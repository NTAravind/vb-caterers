import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * One row of `public.leads`.
 *
 * The column lives in Postgres as timestamptz but PostgREST serialises it to
 * an ISO string ("2026-10-16T09:05:12.345678+00:00"), which Date can parse on
 * both server and client. Formatting always happens at render time in
 * Asia/Kolkata, so the raw string is kept verbatim here.
 */
export interface LeadRow {
  id: string;
  phone: string;
  email: string;
  source: string;
  created_at: string;
}

/**
 * PostgREST rejects with a plain `PostgrestError` object
 * (`{ message, details, hint, code }`) rather than an `Error`, so neither
 * `instanceof Error` nor `String(error)` is useful here.
 */
function errorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return "";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return String(error ?? "Unknown error");
}

/** True when the error means "the leads table has not been created yet". */
export function isTableMissing(error: unknown): boolean {
  const code = errorCode(error);
  return (
    code === "PGRST205" || // PostgREST: relation not in the schema cache
    code === "42P01" || // undefined_table (direct SQL)
    /does not exist/i.test(errorMessage(error))
  );
}

/** A fatal Supabase configuration problem (missing URL/keys). */
export class LeadsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeadsConfigError";
  }
}

/** Fatal, non-retryable failure while reading or writing leads. */
export class LeadsError extends Error {
  readonly kind: "not_configured" | "table_missing" | "unknown";

  constructor(kind: LeadsError["kind"], message: string) {
    super(message);
    this.name = "LeadsError";
    this.kind = kind;
  }
}

function toLeadsError(error: unknown): LeadsError {
  if (error instanceof LeadsError) return error;
  if (error instanceof LeadsConfigError) {
    return new LeadsError("not_configured", error.message);
  }
  if (isTableMissing(error)) {
    return new LeadsError(
      "table_missing",
      "The leads table does not exist yet. Run the migration in supabase/migrations/ in the Supabase SQL Editor.",
    );
  }
  const message = errorMessage(error);
  return new LeadsError("unknown", message);
}

export function normalizePhone(raw: string): string | null {
  let value = String(raw ?? "").trim();
  if (!value) return null;
  // Drop every separator people habitually type: spaces, dashes, dots, parens.
  value = value.replace(/[\s\-._()]/g, "");
  // "0044..." is the IDD prefix; normalise it to the canonical "+44...".
  if (value.startsWith("00")) value = `+${value.slice(2)}`;
  // Keep a leading + (or digits, for purely domestic numbers); strip the rest.
  if (!/^\+?\d{7,20}$/.test(value)) return null;
  const digits = value.replace(/\D/g, "");
  // E.164 allows at most 15 digits; require a sane minimum too.
  if (digits.length < 8 || digits.length > 15) return null;
  return value.startsWith("+") ? `+${digits}` : digits;
}

export function normalizeEmail(raw: string): string | null {
  const value = String(raw ?? "").trim().toLowerCase();
  if (!value || value.length > 254) return null;
  // Deliberately simple: one @, no spaces, a dot in the domain.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return null;
  return value;
}

function requireClient() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new LeadsConfigError(
      "Supabase is not configured on this server. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return supabase;
}

/**
 * Insert a lead, silently skipping duplicates (same phone + email already
 * stored). Never throws: the welcome gate must never break the form it holds.
 */
export async function saveLead(input: {
  phone: string;
  email: string;
  source?: string;
}): Promise<{ ok: boolean; duplicate?: boolean; error?: string }> {
  try {
    const supabase = requireClient();
    const { error } = await supabase.from("leads").upsert(
      {
        phone: input.phone,
        email: input.email,
        source: input.source ?? "welcome",
      },
      { onConflict: "phone,email", ignoreDuplicates: true },
    );
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    const leadsError = toLeadsError(error);
    // Duplicate rows are an expected outcome of the same visitor returning and
    // submitting again; report them as such rather than as a failure.
    if (/duplicate key/i.test(leadsError.message)) return { ok: true, duplicate: true };
    console.error("[leads] saveLead failed:", leadsError.message);
    return { ok: false, error: leadsError.message };
  }
}

/**
 * Fetch every lead, newest first. Returns rows exactly as PostgREST returns
 * them; sorting into IST buckets happens in the table component.
 */
export async function fetchLeads(): Promise<LeadRow[]> {
  try {
    const supabase = requireClient();
    const { data, error } = await supabase
      .from("leads")
      .select("id, phone, email, source, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as LeadRow[];
  } catch (error) {
    throw toLeadsError(error);
  }
}
