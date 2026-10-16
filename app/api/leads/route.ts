/**
 * Public lead capture endpoint.
 *
 * Called by the welcome gate form. Deliberately forgiving: it always answers
 * with a generic JSON shape and never echoes database internals to the browser
 * (the form shows its own copy either way). Abuse is blunted with a per-IP
 * rate limit.
 */

import type { NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { normalizeEmail, normalizePhone, saveLead } from "@/lib/leads";
import { json } from "@/lib/admin/guard";

/** Max two submissions per minute per IP — plenty for a real visitor. */
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;
const MAX_BODY_BYTES = 2_048;

export async function POST(request: NextRequest): Promise<Response> {
  const ip = clientIp(request);
  const limit = rateLimit(`leads:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.allowed) {
    return json(
      429,
      { ok: false, error: "rate-limited", message: "Too many attempts. Please try again shortly." },
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json(413, { ok: false, error: "too-large", message: "Request too large." });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: "bad-request", message: "Invalid request." });
  }

  const body = (payload ?? {}) as Record<string, unknown>;
  const phone = normalizePhone(typeof body.phone === "string" ? body.phone : "");
  const email = normalizeEmail(typeof body.email === "string" ? body.email : "");

  if (!phone || !email) {
    return json(400, {
      ok: false,
      error: "invalid-input",
      message: "Please enter a valid phone number and email address.",
    });
  }

  const result = await saveLead({ phone, email, source: "welcome" });
  if (!result.ok) {
    // Configuration/table problems are the operator's to fix; the visitor
    // just sees a soft failure so the form can show a friendly message.
    return json(503, {
      ok: false,
      error: "unavailable",
      message: "We could not save your details right now. Please try again later.",
    });
  }

  return json(200, { ok: true, duplicate: result.duplicate ?? false });
}
