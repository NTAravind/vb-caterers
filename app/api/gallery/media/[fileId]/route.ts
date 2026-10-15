/**
 * Media endpoint that streams Google Drive files through the Next.js server.
 *
 * Safety properties:
 *  - Only file IDs that appear in the configured gallery folder are served
 *    (allow-list), so this is not an open Google Drive proxy.
 *  - Service-account credentials never leave the server.
 *  - Images are resized server-side (`?sz=thumb|large`) so the gallery never
 *    downloads full-resolution originals up front; videos stream with Range
 *    passthrough and are never buffered through server memory.
 */

import type { NextRequest } from "next/server";
import { getGalleryConfig, LARGE_WIDTH, THUMB_WIDTH, type GalleryConfig } from "@/lib/gallery/config";
import { getAccessToken, resetAccessTokenCache } from "@/lib/gallery/drive";
import { mediaKindFor } from "@/lib/gallery/format";
import { getGalleryRecords } from "@/lib/gallery/media";
import type { GalleryRecord, MediaSize } from "@/lib/gallery/types";

const FILE_ID_PATTERN = /^[A-Za-z0-9_-]{10,}$/;
const THUMB_FETCH_TIMEOUT_MS = 8_000;

const MEDIA_CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";
const DERIVED_CACHE_CONTROL =
  "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400";

/** Upstream (Drive or thumbnail host) could not be reached. */
class UpstreamUnavailableError extends Error {}

/* Tiny per-instance rate limiter (best effort — serverless instances each
   keep their own counter). Generous limits: a 300-tile masonry grid only
   needs a few dozen requests. */
const RATE_WINDOW_MS = 10_000;
const RATE_MAX_REQUESTS = 240;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimitAllows(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    if (rateBuckets.size > 5_000) {
      for (const [key, entry] of rateBuckets) {
        if (entry.resetAt <= now) rateBuckets.delete(key);
      }
    }
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= RATE_MAX_REQUESTS;
}

function jsonResponse(status: number, body: Record<string, string>, extra?: HeadersInit): Response {
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  for (const [key, value] of new Headers(extra)) headers.set(key, value);
  return new Response(JSON.stringify(body), { status, headers });
}

function parseSize(raw: string | null): MediaSize {
  return raw === "thumb" || raw === "large" ? raw : "full";
}

/** Drive thumbnail links end in a size suffix like `=s220`; ask for a larger one. */
function bumpThumbnailSize(url: string, size: number): string {
  try {
    const parsed = new URL(url);
    if (/=s\d+$/.test(parsed.pathname)) {
      parsed.pathname = parsed.pathname.replace(/=s\d+$/, `=s${size}`);
      return parsed.toString();
    }
  } catch {
    /* fall through to the original URL */
  }
  return url;
}

function isImageResponse(response: Response): boolean {
  return (response.headers.get("content-type") ?? "").toLowerCase().startsWith("image/");
}

async function tryGoogleThumbnail(url: string): Promise<Response | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(THUMB_FETCH_TIMEOUT_MS) });
    if (response.ok && isImageResponse(response)) return response;
    response.body?.cancel();
  } catch {
    /* expired link, blocked, timeout — caller falls through */
  }
  return null;
}

/** Copies a Node Buffer into a plain ArrayBuffer accepted by `Response`. */
function toBody(data: Buffer): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

/** Returns a resized WebP, or null when the original should be served as-is. */
async function resizeImage(
  buffer: Buffer,
  width: number,
): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  try {
    const sharp = (await import("sharp")).default;
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || metadata.width <= width) return null;
    const body = await sharp(buffer)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
    return { body: toBody(body), contentType: "image/webp" };
  } catch {
    return null;
  }
}

/**
 * Streams file bytes from Drive (`files.get?alt=media`), forwarding the
 * visitor's Range header so browsers can seek. The response body is passed
 * through untouched — large videos are never buffered in server memory.
 * No abort timeout here: a timeout signal would also kill an in-flight stream.
 */
async function fetchDriveMedia(
  record: GalleryRecord,
  config: GalleryConfig,
  rangeHeader: string | null,
  retryAuth = true,
): Promise<Response> {
  const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(record.id)}`);
  url.searchParams.set("alt", "media");
  url.searchParams.set("supportsAllDrives", "true");

  const token = await getAccessToken(config);
  const headers = new Headers({ Authorization: `Bearer ${token}` });
  if (rangeHeader) headers.set("Range", rangeHeader);

  let response: Response;
  try {
    response = await fetch(url, { headers });
  } catch {
    throw new UpstreamUnavailableError("Could not reach Google Drive.");
  }

  if (response.status === 401 && retryAuth) {
    // Token may have expired mid-flight — refresh once and try again.
    response.body?.cancel();
    resetAccessTokenCache();
    return fetchDriveMedia(record, config, rangeHeader, false);
  }

  return response;
}

function passthroughHeaders(upstream: Response, contentType: string): Headers {
  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") ?? contentType);
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);
  const contentRange = upstream.headers.get("content-range");
  if (contentRange) headers.set("Content-Range", contentRange);
  const acceptRanges = upstream.headers.get("accept-ranges");
  if (acceptRanges) headers.set("Accept-Ranges", acceptRanges);
  headers.set("Cache-Control", MEDIA_CACHE_CONTROL);
  headers.set("Content-Disposition", "inline");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  return headers;
}

function derivedHeaders(contentType: string, byteLength: number): Headers {
  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Content-Length", String(byteLength));
  headers.set("Cache-Control", DERIVED_CACHE_CONTROL);
  headers.set("Content-Disposition", "inline");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  return headers;
}

async function serveThumbnail(record: GalleryRecord, config: GalleryConfig): Promise<Response> {
  // 1. Google's own thumbnail (cheap) — link-shared folders resolve here.
  const candidates = record.thumbnailUrl
    ? [bumpThumbnailSize(record.thumbnailUrl, 800), record.thumbnailUrl]
    : [];
  for (const url of candidates) {
    const googleThumb = await tryGoogleThumbnail(url);
    if (googleThumb) {
      const headers = derivedHeaders(googleThumb.headers.get("content-type") ?? "image/jpeg", 0);
      headers.delete("Content-Length");
      return new Response(googleThumb.body, { status: 200, headers });
    }
  }

  // 2. Folders shared only with the service account: fetch + resize ourselves.
  if (record.kind === "image" && mediaKindFor(record.mimeType) === "image") {
    const upstream = await fetchDriveMedia(record, config, null);
    if (upstream.ok) {
      const buffer = Buffer.from(await upstream.arrayBuffer());
      const resized = await resizeImage(buffer, THUMB_WIDTH);
      if (resized) {
        return new Response(resized.body, {
          status: 200,
          headers: derivedHeaders(resized.contentType, resized.body.byteLength),
        });
      }
      return new Response(toBody(buffer), {
        status: 200,
        headers: derivedHeaders(
          upstream.headers.get("content-type") ?? record.mimeType,
          buffer.byteLength,
        ),
      });
    }
    upstream.body?.cancel();
  }

  // 3. No usable thumbnail (e.g. private videos) — the UI shows a placeholder.
  return jsonResponse(404, { error: "not-found", message: "No thumbnail available." });
}

async function serveLarge(record: GalleryRecord, config: GalleryConfig): Promise<Response> {
  if (record.kind !== "image") return serveFull(record, config, null);

  const upstream = await fetchDriveMedia(record, config, null);
  if (!upstream.ok) {
    const status = upstream.status === 404 ? 404 : 502;
    upstream.body?.cancel();
    return jsonResponse(status, { error: "upstream-error", message: "Media unavailable." });
  }

  const buffer = Buffer.from(await upstream.arrayBuffer());
  const resized = await resizeImage(buffer, LARGE_WIDTH);
  const body = resized ? resized.body : toBody(buffer);
  const contentType = resized
    ? resized.contentType
    : (upstream.headers.get("content-type") ?? record.mimeType);
  return new Response(body, { status: 200, headers: derivedHeaders(contentType, body.byteLength) });
}

async function serveFull(
  record: GalleryRecord,
  config: GalleryConfig,
  rangeHeader: string | null,
): Promise<Response> {
  const upstream = await fetchDriveMedia(record, config, rangeHeader);
  if (!upstream.ok && upstream.status !== 206) {
    const status = upstream.status === 404 ? 404 : upstream.status === 403 ? 403 : 502;
    upstream.body?.cancel();
    return jsonResponse(status, { error: "upstream-error", message: "Media unavailable." });
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers: passthroughHeaders(upstream, record.mimeType),
  });
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ fileId: string }> },
): Promise<Response> {
  const { fileId } = await ctx.params;

  if (!FILE_ID_PATTERN.test(fileId)) {
    return jsonResponse(400, { error: "bad-request", message: "Invalid file ID." });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  if (!rateLimitAllows(ip)) {
    return jsonResponse(
      429,
      { error: "rate-limited", message: "Too many requests." },
      { "Retry-After": "1" },
    );
  }

  const galleryConfig = getGalleryConfig();
  if (!galleryConfig.ok) {
    return jsonResponse(503, {
      error: "not-configured",
      message: "The gallery is not configured on this server yet.",
    });
  }

  const records = await getGalleryRecords(galleryConfig.config);
  if (!records.ok) {
    return jsonResponse(
      records.code === "rate-limited" ? 429 : 503,
      { error: records.code, message: records.message },
    );
  }

  const record = records.items.find((item) => item.id === fileId);
  if (!record) {
    return jsonResponse(404, { error: "not-found", message: "Unknown media file." });
  }

  const size = parseSize(request.nextUrl.searchParams.get("sz"));

  try {
    if (size === "thumb") return await serveThumbnail(record, galleryConfig.config);
    if (size === "large") return await serveLarge(record, galleryConfig.config);
    return await serveFull(record, galleryConfig.config, request.headers.get("range"));
  } catch (error) {
    if (error instanceof UpstreamUnavailableError) {
      return jsonResponse(502, { error: "network-error", message: "Media unavailable." });
    }
    return jsonResponse(502, { error: "upstream-error", message: "Media unavailable." });
  }
}
