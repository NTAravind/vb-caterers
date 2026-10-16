/**
 * Admin sign-out: clears the session cookie. Safe to call when already
 * signed out.
 */

import { ADMIN_SESSION_COOKIE } from "@/lib/admin/session";
import { json } from "@/lib/admin/guard";

export async function POST(): Promise<Response> {
  const response = json(200, { ok: true });
  response.headers.append(
    "Set-Cookie",
    `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
  return response;
}
