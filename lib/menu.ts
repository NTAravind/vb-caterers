/**
 * Menu types and pure helpers.
 *
 * The data itself is *not* imported here. It lives in `data/menu.json` and is
 * read at runtime through lib/menu-store.ts, so the admin panel can edit it
 * without a rebuild. Everything in this file is a pure function of a `Menu`
 * value, which keeps it usable from both server and client components.
 */

export type MenuGroup = {
  title: string;
  items: string[];
};

export type MenuSection = {
  id: string;
  title: string;
  tagline: string;
  image: string;
  groups: MenuGroup[];
};

export type Menu = {
  tagline: string;
  closing: string;
  sections: MenuSection[];
};

export type MenuCounts = {
  sections: number;
  groups: number;
  items: number;
};

export function countMenu(menu: Menu): MenuCounts {
  return {
    sections: menu.sections.length,
    groups: menu.sections.reduce(
      (total, section) => total + section.groups.length,
      0,
    ),
    items: menu.sections.reduce(
      (total, section) =>
        total +
        section.groups.reduce((inner, group) => inner + group.items.length, 0),
      0,
    ),
  };
}

export const itemCountFor = (section: MenuSection): number =>
  section.groups.reduce((total, group) => total + group.items.length, 0);

/** Anchor for a section: `#{sectionId}` */
export const sectionAnchor = (sectionId: string) => `#${sectionId}`;

/** Anchor for a group inside a section: `#{sectionId}-{groupIndex}` */
export const groupAnchor = (sectionId: string, groupIndex: number) =>
  `#${sectionId}-${groupIndex}`;

/**
 * Resolves a cuisine to a real anchor in the menu.
 * Returns `null` when no section/group matches, so callers can fall back to
 * `/menu`.
 */
export function resolveCuisineAnchor(
  menu: Menu,
  sectionId: string,
  groupTitle?: string,
): string | null {
  const section = menu.sections.find((candidate) => candidate.id === sectionId);
  if (!section) return null;
  if (!groupTitle) return sectionAnchor(section.id);
  const index = section.groups.findIndex(
    (group) => group.title.toLowerCase() === groupTitle.toLowerCase(),
  );
  return index === -1 ? sectionAnchor(section.id) : groupAnchor(section.id, index);
}
