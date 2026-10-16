/**
 * Admin menu endpoint.
 *
 * GET returns what is stored right now (never a cached copy), together with the
 * row version the editor must send back when it saves. PUT validates the whole
 * menu, writes it to Supabase, and revalidates the cached pages so `/menu`
 * reflects the change without a rebuild.
 *
 * proxy.ts does not match /api/*, so both handlers check the session themselves.
 */

import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { json, requireAdmin } from "@/lib/admin/guard";
import { countMenu } from "@/lib/menu";
import { MENU_TAG, MenuStoreError, readMenu, saveMenu } from "@/lib/menu-store";
import { validateMenu } from "@/lib/menu-validate";

/** The document is ~60 KB; anything near a megabyte is not a menu. */
const MAX_BODY_BYTES = 1_048_576;

/** Maps a storage failure onto a status the editor can explain. */
function failureResponse(error: unknown): Response {
  if (!(error instanceof MenuStoreError)) {
    console.error("[menu] unexpected failure:", error);
    return json(500, {
      ok: false,
      error: "unknown",
      message: "Could not reach the menu storage.",
    });
  }

  console.error(`[menu] ${error.kind}:`, error.message);

  switch (error.kind) {
    case "conflict":
      return json(409, { ok: false, error: "conflict", message: error.message });
    case "not_configured":
    case "table_missing":
      return json(503, { ok: false, error: error.kind, message: error.message });
    default:
      return json(500, { ok: false, error: "unknown", message: error.message });
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  const guard = await requireAdmin(request);
  if (!guard.ok) return guard.response;

  try {
    const stored = await readMenu();
    return json(200, {
      ok: true,
      menu: stored.menu,
      version: stored.version,
      source: stored.source,
      counts: countMenu(stored.menu),
    });
  } catch (error) {
    return failureResponse(error);
  }
}

export async function PUT(request: NextRequest): Promise<Response> {
  const guard = await requireAdmin(request);
  if (!guard.ok) return guard.response;

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json(413, {
      ok: false,
      error: "too-large",
      message: "That menu is too large to save.",
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: "bad-request", message: "Invalid request." });
  }

  const body = (payload ?? {}) as Record<string, unknown>;
  const result = validateMenu(body.menu ?? body);
  if (!result.ok) {
    return json(400, { ok: false, error: "invalid-menu", message: result.error });
  }

  // 0 means the editor never saw a stored row (table empty or missing); the
  // save then creates it, which is how the seed gets published.
  const expectedVersion = Number(body.version ?? 0);
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0) {
    return json(400, {
      ok: false,
      error: "bad-request",
      message: "Invalid version.",
    });
  }

  let saved: { version: number };
  try {
    saved = await saveMenu(result.menu, expectedVersion);
  } catch (error) {
    return failureResponse(error);
  }

  // Cached pages are invalidated immediately, so the next request re-reads
  // rather than serving the old menu.
  revalidateTag(MENU_TAG, { expire: 0 });

  return json(200, {
    ok: true,
    // Hand back what was actually stored: the validator trims text and drops
    // blank lines, so this is exactly what the editor should show next.
    menu: result.menu,
    version: saved.version,
    counts: countMenu(result.menu),
  });
}
