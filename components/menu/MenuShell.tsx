"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/site/icons";

type SectionMeta = { id: string; title: string };

type Props = {
  sections: SectionMeta[];
  totalItems: number;
  hero: ReactNode;
  children: ReactNode;
};

const DEBOUNCE_MS = 180;

/**
 * Wraps the statically rendered menu: sticky search + category pills,
 * scroll-spy and live filtering. The 2000+ items stay server-rendered —
 * this component only toggles classes on the existing DOM.
 */
export function MenuShell({ sections, totalItems, hero, children }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const noResultsRef = useRef<HTMLParagraphElement>(null);
  const openStatesRef = useRef<Map<HTMLDetailsElement, boolean> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [active, setActive] = useState<string>(sections[0]?.id ?? "");

  const applyFilter = useCallback((raw: string) => {
    const root = contentRef.current;
    if (!root) return;
    const q = raw.trim().toLowerCase();
    const openStates = openStatesRef.current;
    let anyMatch = false;

    root
      .querySelectorAll<HTMLElement>("[data-menu-section]")
      .forEach((section) => {
        let sectionMatches = false;

        section.querySelectorAll<HTMLDetailsElement>("[data-group]").forEach(
          (group) => {
            let groupMatches = false;

            group.querySelectorAll("li").forEach((item) => {
              const match =
                !q || (item.textContent ?? "").toLowerCase().includes(q);
              item.classList.toggle("u-hide", !match);
              if (match) groupMatches = true;
            });

            group.classList.toggle("u-hide", !groupMatches);
            if (q && groupMatches) group.open = true;
            if (!q && openStates) group.open = openStates.get(group) ?? true;
            if (groupMatches) sectionMatches = true;
          },
        );

        section
          .querySelector("[data-cover]")
          ?.classList.toggle("u-hide", Boolean(q));
        section
          .querySelector("[data-chips]")
          ?.classList.toggle("u-hide", Boolean(q));
        section.classList.toggle("u-hide", !sectionMatches);

        if (sectionMatches) anyMatch = true;
      });

    noResultsRef.current?.classList.toggle("u-hide", anyMatch);
  }, []);

  const syncUrl = useCallback((q: string) => {
    const url = new URL(window.location.href);
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const runSearch = useCallback(
    (value: string) => {
      applyFilter(value);
      syncUrl(value.trim());
    },
    [applyFilter, syncUrl],
  );

  /* Wire up the DOM once the shell has mounted. */
  useEffect(() => {
    const root = contentRef.current;
    const input = inputRef.current;
    if (!root || !input) return;

    openStatesRef.current = new Map(
      Array.from(
        root.querySelectorAll<HTMLDetailsElement>("[data-group]"),
      ).map((group) => [group, group.open]),
    );

    const initial = new URLSearchParams(window.location.search).get("q") ?? "";
    if (initial) {
      input.value = initial;
      applyFilter(initial);
    }

    const sectionsToWatch = Array.from(
      root.querySelectorAll<HTMLElement>("[data-menu-section]"),
    );
    const pillsNav = pillsRef.current;
    const pills = pillsNav
      ? Array.from(pillsNav.querySelectorAll<HTMLAnchorElement>("a[data-pill]"))
      : [];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).id;
          setActive(id);
          const pill = pills.find((candidate) => candidate.dataset.pill === id);
          if (pill && pillsNav) {
            const left =
              pill.offsetLeft - pillsNav.clientWidth / 2 + pill.offsetWidth / 2;
            pillsNav.scrollTo({ left, behavior: "smooth" });
          }
        }
      },
      { rootMargin: "-30% 0px -65% 0px" },
    );
    sectionsToWatch.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [applyFilter]);

  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runSearch(value), DEBOUNCE_MS);
  };

  const clearSearch = () => {
    const input = inputRef.current;
    if (!input) return;
    input.value = "";
    if (timerRef.current) clearTimeout(timerRef.current);
    runSearch("");
    input.focus();
  };

  return (
    <div className="flex-1">
      {hero}

      <header
        className="sticky top-0 z-30 border-b border-line bg-page shadow-[0_6px_18px_rgb(0_0_0/0.06)]"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 pt-2.5 pb-2">
          <Link
            href="/"
            aria-label="VB Caterers home"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-olive p-1"
          >
            <Image
              src="/logo.png"
              alt=""
              width={34}
              height={41}
              className="h-auto w-full"
            />
          </Link>
          <div className="relative flex-1">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gold"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="search"
              autoComplete="off"
              onChange={onSearchChange}
              aria-label="Search the menu"
              placeholder={`Search ${totalItems}+ dishes and drinks…`}
              className="min-h-[44px] w-full rounded-full border border-line bg-card py-2 pr-9 pl-9 text-base text-ink placeholder:text-ink-soft/80"
            />
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-gold hover:bg-line/40"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>

        <nav
          ref={pillsRef}
          aria-label="Menu categories"
          className="u-snap relative mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 pb-2.5"
        >
          {sections.map((section) => (
            <a
              key={section.id}
              data-pill={section.id}
              href={`#${section.id}`}
              aria-current={active === section.id ? "true" : undefined}
              className={`min-h-[36px] flex-none rounded-full border px-3.5 py-1 text-base whitespace-nowrap transition-colors ${
                active === section.id
                  ? "border-gold bg-gold text-page"
                  : "border-line bg-card text-gold-deep hover:border-gold"
              }`}
            >
              {section.title}
            </a>
          ))}
        </nav>
      </header>

      <main id="menu-content" className="mx-auto max-w-5xl px-4" ref={contentRef}>
        {children}
        <p
          ref={noResultsRef}
          className="u-hide py-16 text-center font-script text-3xl text-gold"
          role="status"
        >
          No dishes match your search.
        </p>
      </main>
    </div>
  );
}
