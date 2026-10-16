/**
 * Proxy (the Next.js 16 successor to middleware). It does two jobs:
 *
 *  1. The welcome gate — a first-time visitor landing on `/` is sent to
 *     `/welcome` to leave a phone number and an email address (or skip) before
 *     they browse the site.
 *  2. The admin guard — `/admin/*` requires a signed session cookie.
 *
 * Scope is pages only. The API routes under `/api/admin/*` verify the session
 * themselves in lib/admin/guard.ts — the Next docs warn against treating a
 * proxy as the only authorisation boundary, and a matcher change must never be
 * able to silently open the data endpoints.
 *
 * Only `crypto.subtle` is used (via lib/admin/session.ts), so this runs happily
 * in the default Node.js proxy runtime.
 */

import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin/session";
import { LEAD_GATE_COOKIE, hasPassedLeadGate } from "@/lib/lead-gate";

const LOGIN_PATH = "/admin/login";
const GATE_PATH = "/welcome";

/**
 * Search engines and link-preview bots must be shown the real home page — a
 * redirect to the gate would take the site out of search results and break
 * shared links. This is politeness, not security: the gate guards leads, not
 * data.
 */
const CRAWLER_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|embedly|quora|pinterest|whatsapp|telegram|slack|discord|skype|linkedin|twitter|bingpreview|lighthouse|pagespeed|pingdom|uptime/i;

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) return adminGuard(request);
  return leadGate(request);
}

/** Keeps unauthenticated visitors out of the admin panel. */
async function adminGuard(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifyAdminSession(token);
  const isLoginPage = pathname === LOGIN_PATH;

  // Signed in visitors have no business on the sign-in screen.
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (session || isLoginPage) return NextResponse.next();

  // Send unauthenticated visitors to sign in, remembering where they wanted
  // to go so the form can return them there.
  const loginUrl = new URL(LOGIN_PATH, request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

/** Sends visitors who have not met the gate yet to the welcome page. */
function leadGate(request: NextRequest): NextResponse {
  const { pathname, searchParams } = request.nextUrl;
  const passed = hasPassedLeadGate(
    request.cookies.get(LEAD_GATE_COOKIE)?.value,
  );

  if (pathname === GATE_PATH) {
    // Someone who has already dealt with the gate has no reason to see it again.
    return passed
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  // `?gate=off` is the escape hatch used when a browser refuses cookies;
  // without it such a visitor would be stuck on the gate forever.
  if (passed || searchParams.get("gate") === "off") return NextResponse.next();

  if (CRAWLER_PATTERN.test(request.headers.get("user-agent") ?? "")) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(GATE_PATH, request.url));
}

export const config = {
  // Must be literals: Next.js parses this at compile time and rejects
  // references to constants.
  matcher: ["/", "/welcome", "/admin/:path*"],
};
