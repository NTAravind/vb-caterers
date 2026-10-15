/**
 * Cached access to the gallery listing.
 *
 * `getGalleryRecords` is the single source of truth used by both the gallery
 * page and the media endpoint (which allow-lists file IDs against it). The
 * Drive listing is cached with `use cache` so a folder with hundreds of files
 * costs a handful of API calls per revalidation window, not one per visitor.
 *
 * The cheap environment check deliberately happens *outside* this function
 * (callers use `getGalleryConfig()`): a build without credentials must not
 * cache a "not configured" result that a later runtime deploy would keep
 * serving. Only real Drive work is cached here.
 */

import { cacheLife } from "next/cache";
import type { GalleryConfig } from "./config";
import { DriveError, listGalleryMedia } from "./drive";
import type { GalleryErrorCode, GalleryResult } from "./types";

function failure(code: GalleryErrorCode, message: string): GalleryResult {
  return { ok: false, code, message };
}

/**
 * Failures expire fast (a fixed key, a newly shared folder or a Drive hiccup
 * should recover without a rebuild) while still capping retries at ~2/minute.
 */
function cacheFailures(): void {
  cacheLife({ stale: 0, revalidate: 30, expire: 300 });
}

export async function getGalleryRecords(
  config: GalleryConfig,
): Promise<GalleryResult> {
  "use cache";

  try {
    const items = await listGalleryMedia(config);
    // New uploads show up within ~5 minutes without hammering the Drive API.
    cacheLife({ stale: 120, revalidate: 300, expire: 86400 });
    return { ok: true, items };
  } catch (error) {
    cacheFailures();
    if (error instanceof DriveError) {
      return failure(error.code, error.message);
    }
    return failure(
      "upstream-error",
      "Something went wrong while loading the gallery.",
    );
  }
}
