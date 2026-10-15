/**
 * Shared types for the Google Drive media gallery.
 *
 * Nothing in this file talks to Google Drive directly and no credentials or
 * internal Google URLs ever cross into the client — `GalleryItem` is the only
 * shape that is serialized to the browser.
 */

export type GalleryItemKind = "image" | "video";

/**
 * A media file listed from the configured Drive folder. This is the public,
 * browser-safe shape (no Drive URLs, no service-account details).
 */
export type GalleryItem = {
  /** Google Drive file ID. Safe to expose — the media endpoint allow-lists it. */
  id: string;
  kind: GalleryItemKind;
  /** Original file name, used for captions and lightbox labels. */
  name: string;
  /** Accessible alt text: the Drive description if present, else the file name. */
  alt: string;
  /** Optional caption shown under the lightbox image. */
  caption: string | null;
  width: number | null;
  height: number | null;
  /** Video duration in milliseconds when Google reports it. */
  durationMs: number | null;
};

/**
 * Server-side record: everything the public item has, plus the expiring
 * Google-generated thumbnail URL. Never sent to the client — it is only used
 * by the media endpoint to serve grid thumbnails.
 */
export type GalleryRecord = GalleryItem & {
  thumbnailUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  createdTime: string;
};

export type GalleryErrorCode =
  | "not-configured"
  | "auth-error"
  | "folder-not-found"
  | "forbidden"
  | "rate-limited"
  | "network-error"
  | "upstream-error";

export type GalleryResult =
  | { ok: true; items: GalleryRecord[] }
  | { ok: false; code: GalleryErrorCode; message: string };

/** Sizes the media endpoint can serve. */
export type MediaSize = "thumb" | "large" | "full";

/**
 * Builds an in-site URL for a media file. All bytes are proxied through the
 * Next.js server so no Google URLs are ever loaded by the visitor.
 */
export function mediaUrl(id: string, size: MediaSize): string {
  return `/api/gallery/media/${encodeURIComponent(id)}?sz=${size}`;
}
