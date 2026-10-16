/**
 * Menu storage.
 *
 * Supabase (`public.menu`, one jsonb row) is the source of truth.  The menu is
 * a single document that the admin panel loads and saves whole, so one row beats
 * thousands of normalised rows — and unlike the filesystem it works on read-only
 * hosts such as Vercel.
 *
 * `data/menu.json` is kept as the **seed and fallback**, and is imported rather
 * than read at runtime so it is bundled into the build: a deployment without
 * credentials, or one that cannot reach the database, still renders a menu
 * instead of an empty page. It is never written to any more.
 */

import { cacheLife, cacheTag } from "next/cache";
import seedMenu from "@/data/menu.json";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import type { Menu } from "./menu";
import { validateMenu } from "./menu-validate";

/** Cache tag the admin save path invalidates. */
export const MENU_TAG = "menu";

/** The single row's primary key. */
const MENU_ID = "default";

const TABLE = "menu";

/** Validated, bundled fallback used when Supabase has no usable menu. */
export const seed: Menu = (() => {
  const result = validateMenu(seedMenu);
  if (!result.ok) {
    // A malformed seed is a build-time bug, not a runtime condition.
    throw new Error(`data/menu.json is not a valid menu: ${result.error}`);
  }
  return result.menu;
})();

/** How the menu the caller is looking at was obtained. */
export type MenuSource = "supabase" | "seed";

export type StoredMenu = {
  menu: Menu;
  /** Row version, or 0 when Supabase has no menu yet. */
  version: number;
  source: MenuSource;
};

export class MenuStoreError extends Error {
  readonly kind: "not_configured" | "table_missing" | "conflict" | "unknown";

  constructor(kind: MenuStoreError["kind"], message: string) {
    super(message);
    this.name = "MenuStoreError";
    this.kind = kind;
  }
}

/**
 * PostgREST rejects with a plain `{ message, details, hint, code }` object
 * rather than an `Error`, so neither `instanceof Error` nor `String(error)`
 * is useful here.
 */
function errorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return "";
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return error instanceof Error ? error.message : String(error);
}

const isTableMissing = (error: unknown) =>
  errorCode(error) === "42P01" ||
  errorCode(error) === "PGRST205" ||
  /relation .* does not exist|could not find the table/i.test(errorMessage(error));

/**
 * Validates a document read back from the database.
 *
 * A row edited outside the admin panel (by hand, or by a future import) must not
 * be able to break the render, so anything unusable falls back to the seed.
 */
function parseStored(document: unknown): Menu | null {
  const result = validateMenu(document);
  if (!result.ok) {
    console.error(
      `[menu] the stored menu is invalid, falling back to data/menu.json: ${result.error}`,
    );
    return null;
  }
  return result.menu;
}

/* ------------------------------------------------------------------ reading */

/**
 * The read path used by the pages.
 *
 * The cheap configuration check deliberately sits *outside* the cached
 * function: a build without credentials must not cache the seed as the menu for
 * a later deploy that does have them. Only real database work is cached.
 */
export function getMenu(): Promise<Menu> {
  return isSupabaseConfigured() ? readCachedMenu() : Promise.resolve(seed);
}

async function readCachedMenu(): Promise<Menu> {
  "use cache";
  cacheTag(MENU_TAG);
  // A menu save invalidates this tag, so the lifetime only bounds how long an
  // unreachable-database fallback can linger — it is not the freshness policy.
  cacheLife({ stale: 60, revalidate: 300, expire: 86400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return seed;

  const { data, error } = await supabase
    .from(TABLE)
    .select("data")
    .eq("id", MENU_ID)
    .maybeSingle();

  if (error) {
    if (!isTableMissing(error)) {
      console.error("[menu] read failed:", errorMessage(error));
    }
    return seed;
  }
  if (!data) return seed;

  return parseStored((data as { data: unknown }).data) ?? seed;
}

/**
 * Uncached read for the admin editor: it must always show what is really
 * stored, never a cached copy.
 */
export async function readMenu(): Promise<StoredMenu> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { menu: seed, version: 0, source: "seed" };

  const { data, error } = await supabase
    .from(TABLE)
    .select("data, version")
    .eq("id", MENU_ID)
    .maybeSingle();

  if (error) {
    // A missing table is a normal setup state — the admin panel reports it as
    // "not published yet" and the first save creates the row.
    if (isTableMissing(error)) return { menu: seed, version: 0, source: "seed" };
    throw new MenuStoreError("unknown", errorMessage(error));
  }
  if (!data) return { menu: seed, version: 0, source: "seed" };

  const row = data as { data: unknown; version: number };
  const menu = parseStored(row.data);
  if (!menu) return { menu: seed, version: 0, source: "seed" };

  return { menu, version: row.version, source: "supabase" };
}

/* ------------------------------------------------------------------ writing */

/**
 * Publishes a validated menu.
 *
 * `expectedVersion` is the version the editor loaded (0 when the table had no
 * row). The write is conditional on it, so a second session that loaded the
 * menu earlier cannot silently overwrite a newer edit — it gets a `conflict`
 * and is told to reload.
 */
export async function saveMenu(
  menu: Menu,
  expectedVersion: number,
): Promise<{ version: number }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new MenuStoreError(
      "not_configured",
      "Supabase is not configured on this server, so the menu cannot be saved. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  try {
    if (expectedVersion < 1) {
      // No row yet: the first save is what publishes the seed.
      const { data, error } = await supabase
        .from(TABLE)
        .insert({ id: MENU_ID, data: menu, version: 1 })
        .select("version")
        .single();
      if (error) throw error;
      return { version: (data as { version: number }).version };
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update({
        data: menu,
        version: expectedVersion + 1,
        // The column default only applies on insert.
        updated_at: new Date().toISOString(),
      })
      .eq("id", MENU_ID)
      .eq("version", expectedVersion)
      .select("version");

    if (error) throw error;
    // No row matched the version: someone else saved in the meantime.
    if (!data || data.length === 0) {
      throw new MenuStoreError(
        "conflict",
        "This menu was changed in another tab or session. Reload before saving.",
      );
    }
    return { version: (data[0] as { version: number }).version };
  } catch (error) {
    if (error instanceof MenuStoreError) throw error;

    if (isTableMissing(error)) {
      throw new MenuStoreError(
        "table_missing",
        "The menu table does not exist yet. Run supabase/migrations/20261016131000_create_menu.sql in the Supabase SQL Editor.",
      );
    }
    // Losing the insert race means another session created the row first.
    if (errorCode(error) === "23505") {
      throw new MenuStoreError(
        "conflict",
        "This menu was changed in another tab or session. Reload before saving.",
      );
    }
    throw new MenuStoreError("unknown", errorMessage(error));
  }
}
