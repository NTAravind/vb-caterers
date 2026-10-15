/**
 * Pure helpers for the Drive gallery — no Next.js or network imports, so this
 * module can be unit-tested with plain Node.
 */

import type {
  GalleryItem,
  GalleryItemKind,
  GalleryRecord,
} from "./types";

/** Image MIME types browsers can display. */
export const SUPPORTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/bmp",
] as const;

/**
 * Video MIME types we list. Not all of them stream natively in a browser —
 * unsupported codecs fall back to the Drive preview player in the modal.
 */
export const SUPPORTED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-m4v",
] as const;

const supportedImageSet: ReadonlySet<string> = new Set(
  SUPPORTED_IMAGE_MIME_TYPES,
);
const supportedVideoSet: ReadonlySet<string> = new Set(
  SUPPORTED_VIDEO_MIME_TYPES,
);

export function mediaKindFor(mimeType: string): GalleryItemKind | null {
  const mime = mimeType.toLowerCase().split(";")[0].trim();
  if (supportedImageSet.has(mime)) return "image";
  if (supportedVideoSet.has(mime)) return "video";
  return null;
}

/** Strips the extension and turns separators into spaces for alt text. */
export function prettifyFileName(name: string): string {
  return name
    .replace(/\.[A-Za-z0-9]{1,8}$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function altTextFor(name: string, description?: string | null): string {
  const fromDescription = description?.trim();
  if (fromDescription) return fromDescription.slice(0, 200);
  return prettifyFileName(name) || "Gallery media";
}

export function captionFor(name: string, description?: string | null): string | null {
  const fromDescription = description?.trim();
  if (fromDescription) return fromDescription.slice(0, 200);
  return null;
}

/** `125000` → `2:05`. Returns null for invalid input. */
export function formatDuration(ms: number | null | undefined): string | null {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return null;
  const total = Math.round(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Newest first, then by name so folders with identical timestamps still have a
 * stable, deterministic order.
 */
export function sortRecords<T extends { createdTime: string; name: string }>(
  records: T[],
): T[] {
  return [...records].sort((a, b) => {
    const aTime = Date.parse(a.createdTime) || 0;
    const bTime = Date.parse(b.createdTime) || 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
}

/** Strips server-only fields before gallery data is serialized to the client. */
export function toPublicItem(record: GalleryRecord): GalleryItem {
  return {
    id: record.id,
    kind: record.kind,
    name: record.name,
    alt: record.alt,
    caption: record.caption,
    width: record.width,
    height: record.height,
    durationMs: record.durationMs,
  };
}

export function parseFileSize(raw: unknown): number {
  const value = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : 0;
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function parseImageDimensions(
  meta: { width?: number | null; height?: number | null } | null | undefined,
): { width: number | null; height: number | null } {
  const width = typeof meta?.width === "number" && meta.width > 0 ? Math.round(meta.width) : null;
  const height = typeof meta?.height === "number" && meta.height > 0 ? Math.round(meta.height) : null;
  return { width, height };
}
