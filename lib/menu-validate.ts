/**
 * Validation for `data/menu.json`.
 *
 * The admin editor posts a whole menu back, so the file is only ever as safe as
 * this function. It rejects anything that would break the menu page and returns
 * a *cleaned* menu (trimmed, blank lines dropped), so what lands on disk is
 * always canonical.
 */

import type { Menu, MenuSection } from "./menu";

const MAX_SECTIONS = 40;
const MAX_GROUPS = 100;
const MAX_ITEMS_PER_GROUP = 500;
const MAX_TOTAL_ITEMS = 8000;

const MAX_TITLE = 80;
const MAX_TAGLINE = 200;
const MAX_ITEM = 160;
const MAX_IMAGE = 200;
const MAX_ID = 60;
const MAX_COPY = 300;

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type MenuValidation =
  | { ok: true; menu: Menu }
  | { ok: false; error: string };

const fail = (error: string): MenuValidation => ({ ok: false, error });

const asText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

/** Required text, length-bounded. */
function required(
  value: unknown,
  label: string,
  max: number,
): { value: string } | { error: string } {
  if (typeof value !== "string") return { error: `${label} must be text.` };
  const text = value.trim();
  if (text.length === 0) return { error: `${label} cannot be empty.` };
  if (text.length > max) {
    return { error: `${label} is too long (${text.length} characters, max ${max}).` };
  }
  return { value: text };
}

/** Optional text (an empty tagline is allowed), length-bounded. */
function optional(
  value: unknown,
  label: string,
  max: number,
): string | { error: string } {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return { error: `${label} must be text.` };
  const text = value.trim();
  if (text.length > max) {
    return { error: `${label} is too long (${text.length} characters, max ${max}).` };
  }
  return text;
}

export function validateMenu(input: unknown): MenuValidation {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return fail("The menu must be an object.");
  }
  const root = input as Record<string, unknown>;

  const tagline = optional(root.tagline, "Menu tagline", MAX_COPY);
  if (typeof tagline !== "string") return fail(tagline.error);

  const closing = optional(root.closing, "Closing line", MAX_COPY);
  if (typeof closing !== "string") return fail(closing.error);

  if (!Array.isArray(root.sections)) {
    return fail("The menu needs a list of sections.");
  }
  if (root.sections.length === 0) {
    return fail("The menu needs at least one section.");
  }
  if (root.sections.length > MAX_SECTIONS) {
    return fail(`Too many sections (max ${MAX_SECTIONS}).`);
  }

  const sections: MenuSection[] = [];
  const seenIds = new Set<string>();
  let totalItems = 0;

  for (const [index, rawSection] of root.sections.entries()) {
    const where = `Section ${index + 1}`;
    if (typeof rawSection !== "object" || rawSection === null) {
      return fail(`${where} is not valid.`);
    }
    const section = rawSection as Record<string, unknown>;

    const id = asText(section.id);
    if (!ID_PATTERN.test(id) || id.length > MAX_ID) {
      return fail(
        `${where} needs an id of lowercase letters, numbers and single dashes (max ${MAX_ID}).`,
      );
    }
    if (seenIds.has(id)) return fail(`Two sections share the id "${id}".`);
    seenIds.add(id);

    const title = required(section.title, `${where} title`, MAX_TITLE);
    if ("error" in title) return fail(title.error);

    const sectionTagline = optional(section.tagline, `${where} tagline`, MAX_TAGLINE);
    if (typeof sectionTagline !== "string") return fail(sectionTagline.error);

    const image = asText(section.image);
    if (!image.startsWith("/") || image.includes("..") || image.length > MAX_IMAGE) {
      return fail(`${where} needs a local image path starting with "/".`);
    }

    if (!Array.isArray(section.groups)) {
      return fail(`${where} needs a list of groups.`);
    }
    if (section.groups.length === 0) return fail(`${where} has no groups.`);
    if (section.groups.length > MAX_GROUPS) {
      return fail(`${where} has too many groups (max ${MAX_GROUPS}).`);
    }

    const groups: MenuSection["groups"] = [];

    for (const [groupIndex, rawGroup] of section.groups.entries()) {
      const groupWhere = `${where} → group ${groupIndex + 1}`;
      if (typeof rawGroup !== "object" || rawGroup === null) {
        return fail(`${groupWhere} is not valid.`);
      }
      const group = rawGroup as Record<string, unknown>;

      const groupTitle = required(group.title, `${groupWhere} title`, MAX_TITLE);
      if ("error" in groupTitle) return fail(groupTitle.error);

      if (!Array.isArray(group.items)) {
        return fail(`${groupWhere} needs a list of dishes.`);
      }
      if (group.items.length > MAX_ITEMS_PER_GROUP) {
        return fail(`${groupWhere} has too many dishes (max ${MAX_ITEMS_PER_GROUP}).`);
      }

      const items: string[] = [];
      for (const rawItem of group.items) {
        if (rawItem !== null && typeof rawItem !== "string") {
          return fail(`${groupWhere} has a dish that is not text.`);
        }
        const item = asText(rawItem);
        if (item.length === 0) continue; // blank lines typed in the editor
        if (item.length > MAX_ITEM) {
          return fail(`${groupWhere}: "${item.slice(0, 40)}…" is too long (max ${MAX_ITEM}).`);
        }
        items.push(item);
      }

      if (items.length === 0) return fail(`${groupWhere} has no dishes.`);
      totalItems += items.length;
      if (totalItems > MAX_TOTAL_ITEMS) {
        return fail(`Too many dishes overall (max ${MAX_TOTAL_ITEMS}).`);
      }

      groups.push({ title: groupTitle.value, items });
    }

    sections.push({
      id,
      title: title.value,
      tagline: sectionTagline,
      image,
      groups,
    });
  }

  return { ok: true, menu: { tagline, closing, sections } };
}
