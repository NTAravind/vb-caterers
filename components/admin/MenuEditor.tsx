"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/site/icons";
import { countMenu, itemCountFor, type Menu, type MenuGroup } from "@/lib/menu";
import { cn } from "@/lib/utils";

/**
 * Menu editor.
 *
 * Loads the menu from the admin endpoint (Supabase is the source of truth),
 * lets all of it be edited in place — root copy, sections, groups and the
 * ~2,000 dishes — and saves the *entire* menu with one request. The server
 * validates and cleans it first, then returns what it actually stored, so the
 * editor always ends up showing exactly what is stored.
 *
 * Saves carry the version the editor loaded. If another session saved in the
 * meantime the write is refused as a conflict, rather than silently discarding
 * whichever edit lost the race.
 *
 * Sections are collapsed by default (a native, uncontrolled <details>) purely
 * for performance: rendering 52 textareas at once is fine, but only the open
 * ones need to be in the DOM while typing.
 */

type State =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "saving" }
  | { status: "saved" }
  | { status: "error"; message: string; conflict?: boolean };

type LoadPayload = {
  ok?: boolean;
  menu?: Menu;
  version?: number;
  source?: "supabase" | "seed";
  message?: string;
};

export function MenuEditor() {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [saved, setSaved] = useState<Menu | null>(null);
  const [version, setVersion] = useState(0);
  const [source, setSource] = useState<"supabase" | "seed">("supabase");
  const [state, setState] = useState<State>({ status: "loading" });
  // Bumped to re-run the loader below, which is what the "Reload" button on a
  // save conflict does.
  const [reloadKey, setReloadKey] = useState(0);
  const sectionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/menu", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as LoadPayload | null;
        if (cancelled) return;

        if (!response.ok || !payload?.ok || !payload.menu) {
          setState({
            status: "error",
            message: payload?.message ?? "Could not load the menu.",
          });
          return;
        }
        setMenu(payload.menu);
        setSaved(payload.menu);
        setVersion(payload.version ?? 0);
        setSource(payload.source ?? "supabase");
        setState({ status: "ready" });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: "error", message: "Could not load the menu." });
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const edit = useCallback((change: (current: Menu) => Menu) => {
    setMenu((current) => (current ? change(current) : current));
    setState((current) =>
      current.status === "saving" || current.status === "loading"
        ? current
        : { status: "ready" },
    );
  }, []);

  const setAllOpen = useCallback((open: boolean) => {
    sectionsRef.current
      ?.querySelectorAll("details")
      .forEach((node) => ((node as HTMLDetailsElement).open = open));
  }, []);

  async function save() {
    if (!menu) return;
    setState({ status: "saving" });

    try {
      const response = await fetch("/api/admin/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu, version }),
      });
      const payload = (await response.json().catch(() => null)) as LoadPayload | null;

      if (response.status === 409) {
        setState({
          status: "error",
          conflict: true,
          message: payload?.message ?? "This menu changed elsewhere. Reload before saving.",
        });
        return;
      }
      if (!response.ok || !payload?.ok) {
        setState({
          status: "error",
          message: payload?.message ?? "Could not save the menu.",
        });
        return;
      }

      // Adopt whatever the server cleaned and stored.
      const stored = payload.menu ?? menu;
      setMenu(stored);
      setSaved(stored);
      setVersion(payload.version ?? version + 1);
      setSource("supabase");
      setState({ status: "saved" });
    } catch {
      setState({ status: "error", message: "Network problem — could not save." });
    }
  }

  if (state.status === "loading") {
    return (
      <Card className="border-line bg-card p-8 text-center text-ink-soft">
        Loading the menu…
      </Card>
    );
  }

  if (!menu) {
    return (
      <Card className="border-line bg-card p-8 text-center">
        <p className="text-destructive">
          {state.status === "error" ? state.message : "Could not load the menu."}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => {
            setState({ status: "loading" });
            setReloadKey((key) => key + 1);
          }}
        >
          <Icon name="refresh" />
          Try again
        </Button>
      </Card>
    );
  }

  const dirty = saved ? JSON.stringify(menu) !== JSON.stringify(saved) : false;

  // Nothing is stored in Supabase yet (fresh install, or a table that has not
  // been migrated), so the seed itself needs publishing even without edits.
  const unpublished = source === "seed";
  const canSave = dirty || unpublished;
  const totals = countMenu(menu);

  return (
    <div className="flex flex-col gap-5 pb-24">
      {unpublished ? (
        <Card className="border-gold/40 bg-card p-4 text-sm text-ink-soft">
          <span className="text-gold">This menu is not stored in Supabase yet.</span>{" "}
          It is showing the built-in seed from{" "}
          <code className="text-gold-deep">data/menu.json</code>. Saving publishes
          it and makes Supabase the source of truth.
        </Card>
      ) : null}

      {/* Root copy --------------------------------------------------- */}
      <Card className="border-line bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Menu tagline" hint="Shown under the “Menu” title.">
            <Input
              value={menu.tagline}
              onChange={(event) =>
                edit((current) => ({ ...current, tagline: event.target.value }))
              }
            />
          </Field>
          <Field label="Closing line" hint="Reserved for the end of the menu page.">
            <Input
              value={menu.closing}
              onChange={(event) =>
                edit((current) => ({ ...current, closing: event.target.value }))
              }
            />
          </Field>
        </div>
      </Card>

      {/* Section controls ------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          <span className="text-gold">{totals.sections}</span> sections ·{" "}
          <span className="text-gold">{totals.groups}</span> groups ·{" "}
          <span className="text-gold">{totals.items}</span> dishes
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAllOpen(true)}
          >
            Expand all
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAllOpen(false)}
          >
            Collapse all
          </Button>
        </div>
      </div>

      <div ref={sectionsRef} className="flex flex-col gap-3">
        {menu.sections.map((section, sectionIndex) => (
          <SectionCard
            key={sectionIndex}
            section={section}
            sectionIndex={sectionIndex}
            sectionCount={menu.sections.length}
            edit={edit}
          />
        ))}
      </div>

      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            edit((current) => ({
              ...current,
              sections: [...current.sections, blankSection(current.sections)],
            }))
          }
        >
          <Icon name="plus" />
          Add section
        </Button>
      </div>

      <SaveBar
        state={state}
        unpublished={unpublished}
        dirty={dirty}
        canSave={canSave}
        totals={totals}
        onSave={save}
        onReload={() => {
          setState({ status: "loading" });
          setReloadKey((key) => key + 1);
        }}
        onReset={() => {
          if (saved) setMenu(saved);
          setState({ status: "ready" });
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ pieces */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  // The input is wrapped by the label, so clicking the label focuses it and
  // screen readers announce the pairing without needing generated ids.
  return (
    <Label className="grid gap-1.5 font-normal">
      <span className="text-sm text-ink-soft">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-ink-soft/80">{hint}</span> : null}
    </Label>
  );
}

function IconButton({
  label,
  icon,
  disabled,
  danger,
  onClick,
}: {
  label: string;
  icon: "arrow-up" | "arrow-down" | "trash" | "plus";
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        // These live inside <summary>; don't let the click toggle the panel.
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-md border border-line text-ink-soft transition-colors",
        "hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-soft",
        danger && "hover:border-destructive hover:text-destructive",
      )}
    >
      <Icon name={icon} className="size-4" />
    </button>
  );
}

function SectionCard({
  section,
  sectionIndex,
  sectionCount,
  edit,
}: {
  section: Menu["sections"][number];
  sectionIndex: number;
  sectionCount: number;
  edit: (change: (current: Menu) => Menu) => void;
}) {
  const patchSection = (patch: Partial<typeof section>) =>
    edit((current) => ({
      ...current,
      sections: current.sections.map((candidate, index) =>
        index === sectionIndex ? { ...candidate, ...patch } : candidate,
      ),
    }));

  const moveGroup = (groupIndex: number, delta: number) =>
    edit((current) => ({
      ...current,
      sections: current.sections.map((candidate, index) =>
        index === sectionIndex
          ? { ...candidate, groups: move(candidate.groups, groupIndex, delta) }
          : candidate,
      ),
    }));

  return (
    <details className="group rounded-xl border border-line bg-card shadow-[var(--shadow)]">
      <summary className="flex cursor-pointer list-none items-center gap-2 p-1.5 pl-3 select-none [&::-webkit-details-marker]:hidden">
        <Icon
          name="chevron"
          className="size-5 shrink-0 text-gold transition-transform group-open:rotate-180"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-gold-deep">
            {section.title || "(untitled section)"}
          </span>
          <span className="block truncate text-xs text-ink-soft">
            #{section.id} · {section.groups.length}{" "}
            {section.groups.length === 1 ? "group" : "groups"} ·{" "}
            {itemCountFor(section)} dishes
          </span>
        </span>
        <IconButton
          label="Move section up"
          icon="arrow-up"
          disabled={sectionIndex === 0}
          onClick={() =>
            edit((current) => ({
              ...current,
              sections: move(current.sections, sectionIndex, -1),
            }))
          }
        />
        <IconButton
          label="Move section down"
          icon="arrow-down"
          disabled={sectionIndex === sectionCount - 1}
          onClick={() =>
            edit((current) => ({
              ...current,
              sections: move(current.sections, sectionIndex, 1),
            }))
          }
        />
        <IconButton
          label="Delete section"
          icon="trash"
          danger
          onClick={() => {
            if (
              !window.confirm(
                `Delete “${section.title}” and its ${itemCountFor(section)} dishes?`,
              )
            ) {
              return;
            }
            edit((current) => ({
              ...current,
              sections: current.sections.filter(
                (_candidate, index) => index !== sectionIndex,
              ),
            }));
          }}
        />
      </summary>

      <div className="border-t border-line p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <Input
              value={section.title}
              onChange={(event) => patchSection({ title: event.target.value })}
            />
          </Field>
          <Field label="Id" hint="Used for the page anchor — #id. Letters, numbers, dashes.">
            <Input
              value={section.id}
              onChange={(event) => patchSection({ id: event.target.value })}
            />
          </Field>
          <Field label="Tagline">
            <Input
              value={section.tagline}
              onChange={(event) => patchSection({ tagline: event.target.value })}
            />
          </Field>
          <Field label="Image path" hint="A file in public/, e.g. /menu/main-course.jpg">
            <Input
              value={section.image}
              onChange={(event) => patchSection({ image: event.target.value })}
            />
          </Field>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {section.groups.map((group, groupIndex) => (
            <GroupCard
              key={groupIndex}
              group={group}
              groupIndex={groupIndex}
              groupCount={section.groups.length}
              onChange={(patch) =>
                edit((current) => ({
                  ...current,
                  sections: current.sections.map((candidate, index) =>
                    index === sectionIndex
                      ? {
                          ...candidate,
                          groups: candidate.groups.map((entry, entryIndex) =>
                            entryIndex === groupIndex ? { ...entry, ...patch } : entry,
                          ),
                        }
                      : candidate,
                  ),
                }))
              }
              onMove={(delta) => moveGroup(groupIndex, delta)}
              onDelete={() => {
                if (
                  !window.confirm(
                    `Delete the group “${group.title}” (${group.items.length} dishes)?`,
                  )
                ) {
                  return;
                }
                edit((current) => ({
                  ...current,
                  sections: current.sections.map((candidate, index) =>
                    index === sectionIndex
                      ? {
                          ...candidate,
                          groups: candidate.groups.filter(
                            (_entry, entryIndex) => entryIndex !== groupIndex,
                          ),
                        }
                      : candidate,
                  ),
                }));
              }}
            />
          ))}
        </div>

        <div className="mt-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              edit((current) => ({
                ...current,
                sections: current.sections.map((candidate, index) =>
                  index === sectionIndex
                    ? {
                        ...candidate,
                        groups: [
                          ...candidate.groups,
                          { title: "New group", items: [] as string[] },
                        ],
                      }
                    : candidate,
                ),
              }))
            }
          >
            <Icon name="plus" />
            Add group
          </Button>
        </div>
      </div>
    </details>
  );
}

function GroupCard({
  group,
  groupIndex,
  groupCount,
  onMove,
  onDelete,
  onChange,
}: {
  group: MenuGroup;
  groupIndex: number;
  groupCount: number;
  onMove: (delta: number) => void;
  onDelete: () => void;
  onChange: (patch: Partial<MenuGroup>) => void;
}) {
  const filled = group.items.filter((item) => item.trim().length > 0).length;

  return (
    <div className="rounded-lg border border-line bg-page/40 p-3">
      <div className="flex items-start gap-2">
        <Input
          value={group.title}
          aria-label="Group title"
          placeholder="Group title"
          onChange={(event) => onChange({ title: event.target.value })}
        />
        <IconButton
          label="Move group up"
          icon="arrow-up"
          disabled={groupIndex === 0}
          onClick={() => onMove(-1)}
        />
        <IconButton
          label="Move group down"
          icon="arrow-down"
          disabled={groupIndex === groupCount - 1}
          onClick={() => onMove(1)}
        />
        <IconButton label="Delete group" icon="trash" danger onClick={onDelete} />
      </div>

      <Textarea
        value={group.items.join("\n")}
        aria-label={`Dishes in ${group.title}`}
        spellCheck={false}
        rows={Math.min(Math.max(group.items.length + 1, 5), 22)}
        placeholder={"One dish per line"}
        className="mt-2 font-sans leading-relaxed"
        onChange={(event) => onChange({ items: event.target.value.split("\n") })}
      />
      <p className="mt-1 text-xs text-ink-soft/80">
        {filled} {filled === 1 ? "dish" : "dishes"} · one per line · blank lines
        are dropped when you save
      </p>
    </div>
  );
}

function SaveBar({
  state,
  dirty,
  canSave,
  unpublished,
  totals,
  onSave,
  onReset,
  onReload,
}: {
  state: State;
  dirty: boolean;
  canSave: boolean;
  unpublished: boolean;
  totals: { sections: number; groups: number; items: number };
  onSave: () => void;
  onReset: () => void;
  onReload: () => void;
}) {
  const saving = state.status === "saving";
  const conflict = state.status === "error" && state.conflict === true;

  return (
    <div className="sticky bottom-0 z-20 -mx-5 mt-2 border-t border-line bg-olive/95 px-5 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gold-olive" role="status">
          {state.status === "error" ? (
            <span className="inline-flex flex-wrap items-center gap-3 text-destructive">
              {state.message}
              {conflict ? (
                <button
                  type="button"
                  onClick={onReload}
                  className="inline-flex items-center gap-1.5 rounded-md border border-destructive/50 px-2 py-1 text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Icon name="refresh" className="size-4" />
                  Reload
                </button>
              ) : null}
            </span>
          ) : saving ? (
            "Saving…"
          ) : unpublished ? (
            "Not stored in Supabase yet"
          ) : dirty ? (
            "Unsaved changes"
          ) : state.status === "saved" ? (
            <span className="inline-flex items-center gap-2 text-gold">
              <Icon name="check" className="size-4" />
              Saved to Supabase
            </span>
          ) : (
            `Up to date · ${totals.items} dishes`
          )}
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="text-gold-olive hover:text-gold"
            disabled={!dirty || saving}
            onClick={onReset}
          >
            Discard changes
          </Button>
          <Button type="button" disabled={!canSave || saving} onClick={onSave}>
            <Icon name="save" />
            {saving ? "Saving…" : "Save menu"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ helpers */

/** Moves an item within an array, clamped to its bounds. */
function move<T>(items: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

/** A fresh section with an id that does not collide with existing ones. */
function blankSection(sections: Menu["sections"]): Menu["sections"][number] {
  const used = new Set(sections.map((section) => section.id));
  let id = `section-${sections.length + 1}`;
  let counter = sections.length + 1;
  while (used.has(id)) {
    counter += 1;
    id = `section-${counter}`;
  }
  return { id, title: "New section", tagline: "", image: "/menu/food.jpg", groups: [] };
}
