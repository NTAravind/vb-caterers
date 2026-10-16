/**
 * Admin sign-in. Exchanges email + password for a signed session cookie.
 *
 * The response is identical for "wrong credentials" and "not configured" so
 * the endpoint reveals nothing about the server's setup.
 */

import type { NextRequest } from "next/server";
import { isConfigured, verifyCredentials } from "@/lib/admin/credentials";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSession,
} from "@/lib/admin/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { json } from "@/lib/admin/guard";

/** Slow, deliberate: five guesses a minute from one IP. */
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

export async function POST(request: NextRequest): Promise<Response> {
  const limit = rateLimit(`admin-login:${clientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.allowed) {
    return json(
      429,
      { ok: false, error: "rate-limited", message: "Too many attempts. Please wait a minute." },
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: "bad-request", message: "Invalid request." });
  }

  const body = (payload ?? {}) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!isConfigured()) {
    console.error(
      "[admin] ADMIN_EMAIL / ADMIN_PASSWORD are not set — sign-in is impossible. " +
        "Add them to .env and restart the server.",
    );
    return json(503, {
      ok: false,
      error: "not-configured",
      message: "Admin sign-in is not configured on this server.",
    });
  }

  if (!email || !password || !verifyCredentials(email, password)) {
    return json(401, { ok: false, error: "invalid-credentials", message: "Incorrect email or password." });
  }

  let token: string;
  try {
    token = await createAdminSession();
  } catch (error) {
    console.error("[admin] could not create a session:", error);
    return json(503, { ok: false, error: "not-configured", message: "Admin sessions are not configured." });
  }

  const response = json(200, { ok: true });
  response.headers.append(
    "Set-Cookie",
    [
      `${ADMIN_SESSION_COOKIE}=${token}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${ADMIN_SESSION_TTL_SECONDS}`,
      process.env.NODE_ENV === "production" ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; "),
  );
  return response;
}
