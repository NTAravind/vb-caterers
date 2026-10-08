import rawMenu from "@/data/menu.json";

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

/** Single source of truth for every dish on the site. Never reworded here. */
export const menu: Menu = rawMenu as Menu;

export const sectionCount = menu.sections.length;

export const groupCount = menu.sections.reduce(
  (total, section) => total + section.groups.length,
  0,
);

export const itemCount = menu.sections.reduce(
  (total, section) =>
    total +
    section.groups.reduce((inner, group) => inner + group.items.length, 0),
  0,
);

export const itemCountFor = (section: MenuSection) =>
  section.groups.reduce((total, group) => total + group.items.length, 0);

/** Anchor for a section: `#{sectionId}` */
export const sectionAnchor = (sectionId: string) => `#${sectionId}`;

/** Anchor for a group inside a section: `#{sectionId}-{groupIndex}` */
export const groupAnchor = (sectionId: string, groupIndex: number) =>
  `#${sectionId}-${groupIndex}`;

/**
 * Resolves a cuisine to a real anchor in menu.json.
 * Returns `null` when no section/group matches, so callers can fall back to `/menu`.
 */
export function resolveCuisineAnchor(
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
