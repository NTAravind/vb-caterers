/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Best effort only — every server instance keeps its own counter, exactly
 * like the limiter in app/api/gallery/media/[fileId]/route.ts. It exists to
 * blunt scripted abuse of the public lead form and the admin login.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds the caller should wait before retrying. 0 when allowed. */
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): RateLimitResult {
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [mapKey, entry] of buckets) {
        if (entry.resetAt <= now) buckets.delete(mapKey);
      }
      // Still full of live entries: drop the oldest third rather than grow.
      if (buckets.size >= MAX_BUCKETS) {
        let excess = Math.ceil(buckets.size / 3);
        for (const mapKey of buckets.keys()) {
          buckets.delete(mapKey);
          if (--excess <= 0) break;
        }
      }
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count <= limit) return { allowed: true, retryAfterSeconds: 0 };

  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

/** Best-effort client IP, matching the gallery media route. */
export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}
