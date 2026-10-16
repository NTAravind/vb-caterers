/**
 * Server-side Supabase client (service role).
 *
 * NEVER import this from a client component — the service role key bypasses
 * Row Level Security. Every call site is a route handler under app/api/.
 *
 * Leads live in the `public.leads` table; see
 * supabase/migrations/*_create_leads.sql for the schema.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

/** Project URL, or `null` when it cannot be resolved. */
function resolveUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  // Fallback: the service-role JWT carries the project ref as its `ref`
  // claim, so the URL can be derived when NEXT_PUBLIC_SUPABASE_URL is unset.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  try {
    const claims = JSON.parse(
      Buffer.from(key.split(".")[1] ?? "", "base64url").toString("utf8"),
    ) as { ref?: unknown };
    return typeof claims.ref === "string" && claims.ref
      ? `https://${claims.ref}.supabase.co`
      : null;
  } catch {
    return null;
  }
}

/**
 * Returns a memoised service-role client, or `null` when Supabase is not
 * configured on this server. Callers surface a 503 instead of crashing.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = resolveUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  cached =
    url && serviceRoleKey
      ? createClient(url, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;

  return cached;
}

/** True when the server has Supabase credentials. */
export function isSupabaseConfigured(): boolean {
  return getSupabaseAdmin() !== null;
}
