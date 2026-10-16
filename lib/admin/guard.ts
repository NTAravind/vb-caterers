/**
 * Shared guard for admin API route handlers.
 *
 * proxy.ts already blocks unauthenticated page requests to /admin, but the
 * Next.js docs are explicit that a proxy must not be the only line of
 * defence — every route handler re-checks the session cookie itself.
 */

import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSession, type AdminSession } from "@/lib/admin/session";

export function json(
  status: number,
  body: Record<string, unknown>,
  extra?: HeadersInit,
): Response {
  const headers = new Headers(extra);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(JSON.stringify(body), { status, headers });
}

/**
 * Returns the current admin session, or a ready-made 401 response. Callers
 * use it as `const session = await requireAdmin(request); if (!session.ok)
 * return session.response;`.
 */
export async function requireAdmin(
  request: NextRequest,
): Promise<{ ok: true; session: AdminSession } | { ok: false; response: Response }> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifyAdminSession(token);
  if (!session) {
    return {
      ok: false,
      response: json(401, { error: "unauthorized", message: "Please sign in again." }),
    };
  }
  return { ok: true, session };
}
