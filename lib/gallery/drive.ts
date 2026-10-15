/**
 * Minimal server-side Google Drive client.
 *
 * Uses the official Drive API v3 with a service account (JWT bearer flow),
 * implemented with Node's built-in crypto so no Google SDK is required.
 * All credentials stay on the server — nothing here is bundled for the
 * browser.
 */

import { createSign } from "node:crypto";
import {
  DRIVE_PAGE_SIZE,
  MAX_FILES,
  type GalleryConfig,
} from "./config";
import {
  altTextFor,
  captionFor,
  mediaKindFor,
  parseFileSize,
  parseImageDimensions,
  sortRecords,
} from "./format";
import type { GalleryItemKind, GalleryRecord } from "./types";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const TOKEN_EXPIRY_MARGIN_MS = 60_000;
const FETCH_TIMEOUT_MS = 15_000;

export const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

type FetchImpl = typeof fetch;

/** Typed error so the route/UI can react without leaking upstream details. */
export class DriveError extends Error {
  constructor(
    readonly code:
      | "not-configured"
      | "auth-error"
      | "folder-not-found"
      | "forbidden"
      | "rate-limited"
      | "network-error"
      | "upstream-error",
    message: string,
  ) {
    super(message);
    this.name = "DriveError";
  }
}

/* Auth ------------------------------------------------------------------- */

type TokenCache = { token: string; expiresAt: number };

let tokenCache: TokenCache | null = null;

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function createSignedJwt(config: GalleryConfig, issuedAt: number): string {
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: config.serviceAccountEmail,
      scope: DRIVE_SCOPE,
      aud: TOKEN_URL,
      iat: issuedAt,
      exp: issuedAt + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  const signature = signer.sign(config.privateKey, "base64url");
  return `${header}.${payload}.${signature}`;
}

/**
 * Exchanges a service-account JWT for a short-lived OAuth access token.
 * Tokens are cached in module memory and refreshed a minute before expiry.
 */
export async function getAccessToken(
  config: GalleryConfig,
  fetchImpl: FetchImpl = fetch,
): Promise<string> {
  if (tokenCache && tokenCache.expiresAt - TOKEN_EXPIRY_MARGIN_MS > Date.now()) {
    return tokenCache.token;
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  let assertion: string;
  try {
    assertion = createSignedJwt(config, issuedAt);
  } catch {
    throw new DriveError(
      "auth-error",
      "The service-account private key could not be read. Check the format of GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.",
    );
  }

  let response: Response;
  try {
    response = await fetchImpl(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }).toString(),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    throw new DriveError(
      "network-error",
      `Could not reach Google's token endpoint: ${describe(error)}`,
    );
  }

  if (response.status === 429) {
    throw new DriveError("rate-limited", "Google OAuth rate limit reached.");
  }

  if (!response.ok) {
    throw new DriveError(
      "auth-error",
      `Google OAuth token request failed (${response.status}).`,
    );
  }

  const body = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!body.access_token) {
    throw new DriveError("auth-error", "Google OAuth response had no access token.");
  }

  tokenCache = {
    token: body.access_token,
    expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
  };
  return tokenCache.token;
}

/** Test hook — clears the in-memory token between unit tests. */
export function resetAccessTokenCache(): void {
  tokenCache = null;
}

/* Listing ---------------------------------------------------------------- */

type DriveFile = {
  id?: string;
  name?: string;
  mimeType?: string;
  size?: string;
  createdTime?: string;
  description?: string;
  thumbnailLink?: string;
  imageMediaMetadata?: { width?: number; height?: number };
  videoMediaMetadata?: { durationMillis?: number; width?: number; height?: number };
};

type DriveListResponse = {
  files?: DriveFile[];
  nextPageToken?: string;
};

function driveHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

function describe(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function mapHttpError(status: number): DriveError {
  if (status === 401) {
    return new DriveError("auth-error", "The Drive access token was rejected.");
  }
  if (status === 403) {
    return new DriveError(
      "forbidden",
      "The service account is not allowed to read this Drive folder.",
    );
  }
  if (status === 404) {
    return new DriveError(
      "folder-not-found",
      "The configured Drive folder does not exist or is not shared.",
    );
  }
  if (status === 429) {
    return new DriveError("rate-limited", "Google Drive API rate limit reached.");
  }
  return new DriveError("upstream-error", `Google Drive API returned ${status}.`);
}

/** Confirms the folder exists and the service account may read it. */
async function assertFolderAccessible(
  folderId: string,
  token: string,
  fetchImpl: FetchImpl,
): Promise<void> {
  let response: Response;
  try {
    const url = new URL(`${DRIVE_API}/files/${encodeURIComponent(folderId)}`);
    url.searchParams.set("fields", "id,name,mimeType,trashed");
    url.searchParams.set("supportsAllDrives", "true");
    response = await fetchImpl(url, {
      headers: driveHeaders(token),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    throw new DriveError(
      "network-error",
      `Could not reach Google Drive: ${describe(error)}`,
    );
  }

  if (!response.ok) throw mapHttpError(response.status);

  const body = (await response.json()) as { mimeType?: string; trashed?: boolean };
  if (body.mimeType !== FOLDER_MIME_TYPE) {
    throw new DriveError(
      "folder-not-found",
      "The configured ID is not a Google Drive folder.",
    );
  }
  if (body.trashed) {
    throw new DriveError("folder-not-found", "The configured Drive folder is in the trash.");
  }
}

function toRecord(file: DriveFile, kind: GalleryItemKind): GalleryRecord | null {
  if (!file.id || !file.name) return null;

  const dimensions =
    kind === "image"
      ? parseImageDimensions(file.imageMediaMetadata)
      : parseImageDimensions(file.videoMediaMetadata);

  const durationMs =
    kind === "video" && typeof file.videoMediaMetadata?.durationMillis === "number"
      ? Math.round(file.videoMediaMetadata.durationMillis)
      : null;

  return {
    id: file.id,
    kind,
    name: file.name,
    alt: altTextFor(file.name, file.description),
    caption: captionFor(file.name, file.description),
    width: dimensions.width,
    height: dimensions.height,
    durationMs,
    thumbnailUrl: typeof file.thumbnailLink === "string" ? file.thumbnailLink : null,
    mimeType: file.mimeType ?? "",
    sizeBytes: parseFileSize(file.size),
    createdTime: file.createdTime ?? "",
  };
}

/**
 * Lists the media in one folder (one level, no sub-folders), keeping only the
 * media kind that folder is meant to hold, paginating until Drive runs out of
 * pages or `limit` records have been collected.
 */
async function listOneFolder(
  folderId: string,
  kind: GalleryItemKind,
  token: string,
  fetchImpl: FetchImpl,
  limit: number,
): Promise<GalleryRecord[]> {
  const fields = [
    "nextPageToken",
    "files(id,name,mimeType,size,createdTime,description,thumbnailLink",
    "imageMediaMetadata(width,height),videoMediaMetadata(durationMillis,width,height))",
  ].join(",");
  const kindFilter = kind === "image" ? "image/" : "video/";

  const records: GalleryRecord[] = [];
  let pageToken: string | undefined;
  let pages = 0;

  do {
    const url = new URL(`${DRIVE_API}/files`);
    url.searchParams.set(
      "q",
      `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false and mimeType contains '${kindFilter}'`,
    );
    url.searchParams.set("fields", fields);
    url.searchParams.set("pageSize", String(DRIVE_PAGE_SIZE));
    url.searchParams.set("supportsAllDrives", "true");
    url.searchParams.set("includeItemsFromAllDrives", "true");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    let response: Response;
    try {
      response = await fetchImpl(url, {
        headers: driveHeaders(token),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (error) {
      throw new DriveError(
        "network-error",
        `Could not reach Google Drive: ${describe(error)}`,
      );
    }

    if (!response.ok) throw mapHttpError(response.status);

    const body = (await response.json()) as DriveListResponse;

    for (const file of body.files ?? []) {
      if (!file.mimeType || file.mimeType === FOLDER_MIME_TYPE) continue;
      // Guard against a file being returned by the wrong query (or a folder
      // holding a mix): only the kind this album expects is listed.
      if (mediaKindFor(file.mimeType) !== kind) continue;
      const record = toRecord(file, kind);
      if (record) records.push(record);
    }

    pageToken = body.nextPageToken;
    pages += 1;
  } while (
    pageToken &&
    records.length < limit &&
    pages < Math.ceil(MAX_FILES / DRIVE_PAGE_SIZE)
  );

  return records;
}

/**
 * Lists media from both configured albums — images from the photos folder,
 * videos from the videos folder — merged and sorted newest first. A folder
 * that is not configured yet is skipped, so photos-only or videos-only setups
 * work. `MAX_FILES` caps each album, so a huge photo album can never starve
 * the videos page.
 */
export async function listGalleryMedia(
  config: GalleryConfig,
  fetchImpl: FetchImpl = fetch,
): Promise<GalleryRecord[]> {
  const albums: { folderId: string; kind: GalleryItemKind }[] = [];
  if (config.photosFolderId) albums.push({ folderId: config.photosFolderId, kind: "image" });
  if (config.videosFolderId) albums.push({ folderId: config.videosFolderId, kind: "video" });

  if (albums.length === 0) {
    throw new DriveError(
      "not-configured",
      "No Drive folder is configured for the gallery yet.",
    );
  }

  const token = await getAccessToken(config, fetchImpl);
  const records: GalleryRecord[] = [];

  for (const album of albums) {
    await assertFolderAccessible(album.folderId, token, fetchImpl);
    records.push(
      ...(await listOneFolder(album.folderId, album.kind, token, fetchImpl, MAX_FILES)),
    );
  }

  return sortRecords(records);
}
