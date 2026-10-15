/**
 * Configuration for the Google Drive media gallery.
 *
 * Photos and videos live in two separate Drive folders, each read by its own
 * page: `/gallery` lists images, `/gallery/videos` lists videos. Everything is
 * driven by environment variables so the same code works across client
 * projects — see `.env.example` and the README for setup steps.
 */

const ENV_KEYS = {
  photosFolderId: "GOOGLE_DRIVE_PHOTOS_FOLDER_ID",
  videosFolderId: "GOOGLE_DRIVE_VIDEOS_FOLDER_ID",
  serviceAccountEmail: "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  privateKey: "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
} as const;

export const galleryEnvKeys = ENV_KEYS;

/** The two albums the gallery is split into. */
export type MediaSection = "photos" | "videos";

export type GalleryConfig = {
  serviceAccountEmail: string;
  privateKey: string;
  /** Drive folder that holds images; `null` until it is configured. */
  photosFolderId: string | null;
  /** Drive folder that holds videos; `null` until it is configured. */
  videosFolderId: string | null;
};

export type GalleryConfigResult =
  | { ok: true; config: GalleryConfig }
  | { ok: false; missing: string[] };

/** Folder ID backing a section, or `null` when that section is not set up. */
export function sectionFolderId(
  config: GalleryConfig,
  section: MediaSection,
): string | null {
  return section === "photos" ? config.photosFolderId : config.videosFolderId;
}

/** The environment variable that switches a section on. */
export function sectionEnvKey(section: MediaSection): string {
  return section === "photos" ? ENV_KEYS.photosFolderId : ENV_KEYS.videosFolderId;
}

/** Media kind a section is allowed to contain. */
export function sectionKind(section: MediaSection): "image" | "video" {
  return section === "photos" ? "image" : "video";
}

/** Service-account keys in env vars usually contain escaped `\n` sequences. */
function normalizePrivateKey(raw: string): string {
  const trimmed = raw.trim();
  const unquoted =
    trimmed.startsWith('"') && trimmed.endsWith('"')
      ? trimmed.slice(1, -1)
      : trimmed;
  return unquoted.replace(/\\n/g, "\n");
}

/**
 * Reads gallery credentials from the server environment. Returns the list of
 * missing variable names (never their values) so the UI can show setup help.
 *
 * The service-account pair is always required; the two folder IDs are read
 * independently, so a site with photos only (or videos only) still works.
 */
export function getGalleryConfig(): GalleryConfigResult {
  const photosFolderId = process.env[ENV_KEYS.photosFolderId]?.trim() ?? "";
  const videosFolderId = process.env[ENV_KEYS.videosFolderId]?.trim() ?? "";
  const serviceAccountEmail =
    process.env[ENV_KEYS.serviceAccountEmail]?.trim() ?? "";
  const privateKeyRaw = process.env[ENV_KEYS.privateKey]?.trim() ?? "";

  const missing: string[] = [];
  if (!serviceAccountEmail) missing.push(ENV_KEYS.serviceAccountEmail);
  if (!privateKeyRaw) missing.push(ENV_KEYS.privateKey);
  if (!photosFolderId && !videosFolderId) {
    missing.push(ENV_KEYS.photosFolderId, ENV_KEYS.videosFolderId);
  }

  if (missing.length > 0) return { ok: false, missing };

  return {
    ok: true,
    config: {
      serviceAccountEmail,
      privateKey: normalizePrivateKey(privateKeyRaw),
      photosFolderId: photosFolderId || null,
      videosFolderId: videosFolderId || null,
    },
  };
}

/** Upper bound on files pulled from Drive per folder, per cache refresh. */
export const MAX_FILES = 600;

/** Page size used while paginating `files.list`. */
export const DRIVE_PAGE_SIZE = 100;

/** Grid thumbnails and lightbox previews are resized server-side to these. */
export const THUMB_WIDTH = 720;
export const LARGE_WIDTH = 1920;

/** Copy for the two gallery pages, kept here so future projects can restyle it. */
export const galleryCopy = {
  photos: {
    tab: "Photos",
    overline: "Moments we have served",
    title: "Photo Gallery",
    intro:
      "Photos from events we have catered — uploaded by our team and refreshed automatically.",
    emptyTitle: "The photo album is being prepared",
    emptyBody:
      "New photos will appear here as soon as they are added to our shared album.",
  },
  videos: {
    tab: "Videos",
    overline: "Live counters in action",
    title: "Videos",
    intro:
      "Short clips from our counters, buffets and celebrations — uploaded by our team and refreshed automatically.",
    emptyTitle: "The video album is being prepared",
    emptyBody:
      "New videos will appear here as soon as they are added to our shared album.",
  },
} as const;
