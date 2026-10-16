/**
 * Admin credential checking.
 *
 * Node-only (route handlers): uses `node:crypto` so the comparison is
 * constant time. Secrets live in `.env`, which is git-ignored.
 */

import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/** Compares two strings in constant time regardless of content or length. */
function secureEquals(a: string, b: string): boolean {
  const left = digest(a);
  const right = digest(b);
  // Hashing first means both digests are always the same length, so the
  // comparison itself leaks nothing about the original values.
  return timingSafeEqual(left, right);
}

export function isConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}

/**
 * Verifies an email/password pair against the configured admin credentials.
 * Fails closed when the environment is incomplete.
 */
export function verifyCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword) return false;

  return secureEquals(email.trim().toLowerCase(), expectedEmail.trim().toLowerCase()) &&
    secureEquals(password, expectedPassword);
}
