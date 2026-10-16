/**
 * Signed, http-only admin session tokens.
 *
 * The token is `<expiry>.<hmac>` where the HMAC covers `email|expiry`, so a
 * token can neither be forged nor reused after it expires. Only Web Crypto
 * (`crypto.subtle`) is used, deliberately: this module is imported both by
 * proxy.ts and by the API route handlers, and it must stay runnable in
 * either runtime.
 */

export const ADMIN_SESSION_COOKIE = "vb_admin_session";

/** How long a login stays valid. */
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const encoder = new TextEncoder();

export type AdminSession = { email: string; expiresAt: number };

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET is missing or shorter than 32 characters. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64url'))\"",
    );
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

/** Constant-time comparison of two UTF-8 strings of equal expected length. */
function timingSafeEqual(a: string, b: string): boolean {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.byteLength !== right.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < left.byteLength; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

/** Creates a fresh session token for the single configured admin. */
export async function createAdminSession(now = Date.now()): Promise<string> {
  const email = process.env.ADMIN_EMAIL;
  if (!email) throw new Error("ADMIN_EMAIL is not configured.");

  const expiresAt = Math.floor(now / 1000) + ADMIN_SESSION_TTL_SECONDS;
  const signature = await sign(`${email}|${expiresAt}`);
  return `${expiresAt}.${signature}`;
}

/**
 * Verifies a session token and returns the session, or `null` when the token
 * is absent, malformed, tampered with, or expired.
 */
export async function verifyAdminSession(
  token: string | undefined | null,
  now = Date.now(),
): Promise<AdminSession | null> {
  if (!token) return null;

  const separator = token.indexOf(".");
  if (separator <= 0 || separator === token.length - 1) return null;

  const expiresAt = Number(token.slice(0, separator));
  const signature = token.slice(separator + 1);
  if (!Number.isSafeInteger(expiresAt) || expiresAt * 1000 <= now) return null;

  const email = process.env.ADMIN_EMAIL;
  if (!email) return null;

  let expected: string;
  try {
    expected = await sign(`${email}|${expiresAt}`);
  } catch {
    // Misconfigured secret: fail closed.
    return null;
  }

  if (!timingSafeEqual(signature, expected)) return null;

  return { email, expiresAt: expiresAt * 1000 };
}
