import type { Metadata } from "next";
import Image from "next/image";
import { BackToTop } from "@/components/menu/BackToTop";
import { MenuShell } from "@/components/menu/MenuShell";
import { Icon } from "@/components/site/icons";
import {
  groupAnchor,
  itemCount,
  itemCountFor,
  menu,
  sectionCount,
  type MenuSection,
} from "@/lib/menu";
import { pdfUrl, site, whatsApp } from "@/lib/site";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Explore the full VB Caterers menu — 2000+ dishes across 9 sections including beverages, starters, breakfast, main course, Asian food, mithai, desserts and ice cream.",
  alternates: { canonical: "/menu" },
  openGraph: {
    title: "Menu | VB Caterers, Bengaluru",
    description:
      "2000+ dishes across 9 sections — the complete VB Caterers menu.",
    url: "/menu",
    images: [{ url: "/menu/main-course.jpg", width: 830, height: 551 }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Menu",
  name: `${site.name} Menu`,
  url: `${site.url}/menu`,
  inLanguage: "en-IN",
  description: `${itemCount} dishes across ${sectionCount} sections, served by ${site.name} in ${site.addressLocality}.`,
  hasMenuSection: menu.sections.map((section) => ({
    "@type": "MenuSection",
    name: section.title,
    description: section.tagline,
    numberOfItems: itemCountFor(section),
  })),
};

function MenuHero() {
  return (
    <section className="u-inset-frame relative overflow-hidden bg-olive px-5 py-14 text-center">
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center">
        <Image
          src="/logo.png"
          alt="VB Caterers logo"
          width={106}
          height={129}
          priority
          sizes="96px"
          className="h-auto w-24"
        />
        <h1 className="u-gold-text u-heading mt-4 text-[clamp(3rem,15vw,5.5rem)] leading-none">
          Menu
        </h1>
        <p className="mt-2 font-script text-[clamp(1.5rem,6vw,2.3rem)] leading-tight text-gold-olive">
          {menu.tagline}
        </p>
      </div>
    </section>
  );
}

function SectionCover({
  section,
  eager = false,
}: {
  section: MenuSection;
  eager?: boolean;
}) {
  return (
    <div data-cover className="pt-14 pb-2 text-center">
      <h2
        id={`${section.id}-title`}
        className="u-heading text-[clamp(2rem,8vw,3.4rem)] leading-tight text-gold"
      >
        {section.title}
      </h2>
      <span className="u-ornament mt-3" aria-hidden="true" />
      <p className="mx-auto mt-3 max-w-xl font-script text-2xl text-gold-deep">
        {section.tagline}
      </p>
      <div className="relative mx-auto mt-6 aspect-[3/2] w-full max-w-xl overflow-hidden rounded-xl border border-line shadow-[var(--shadow)]">
        <Image
          src={section.image}
          alt={`${section.title} dishes served by VB Caterers`}
          fill
          priority={eager}
          fetchPriority={eager ? "high" : undefined}
          sizes="(min-width: 640px) 576px, calc(100vw - 2rem)"
          quality={65}
          className="object-cover"
        />
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <div className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <MenuShell
        hero={<MenuHero />}
        totalItems={itemCount}
        sections={menu.sections.map(({ id, title }) => ({ id, title }))}
      >
        {menu.sections.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            data-menu-section
            aria-labelledby={`${section.id}-title`}
            className="pb-6"
          >
            <SectionCover section={section} eager={index === 0} />

            <nav
              data-chips
              aria-label={`Jump to ${section.title} groups`}
              className="my-5 flex flex-wrap justify-center gap-2"
            >
              {section.groups.map((group, index) => (
                <a
                  key={group.title}
                  href={groupAnchor(section.id, index)}
                  className="min-h-[36px] rounded-full border border-line bg-card px-3 py-1 text-base text-gold-deep transition-colors hover:border-gold hover:bg-olive hover:text-gold-olive"
                >
                  {group.title}
                </a>
              ))}
            </nav>

            {section.groups.map((group, index) => (
              <details
                key={group.title}
                id={groupAnchor(section.id, index).slice(1)}
                data-group
                open
                className="mb-3 rounded-xl border border-line bg-card px-4 pb-4 shadow-[var(--shadow)]"
              >
                <summary className="flex min-h-[52px] cursor-pointer items-center gap-3 py-3 select-none">
                  <h3 className="flex-1 text-xl text-gold-deep">{group.title}</h3>
                  <span className="rounded-full border border-line px-2.5 py-0.5 text-sm text-gold-deep">
                    {group.items.length}
                    <span className="sr-only"> items</span>
                  </span>
                  <Icon
                    name="chevron"
                    className="u-caret size-5 shrink-0 text-gold transition-transform"
                    aria-hidden="true"
                  />
                </summary>
                <ul className="columns-[16rem] gap-8 pt-1">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="break-inside-avoid border-b border-dotted border-line py-1.5 text-ink"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </section>
        ))}
      </MenuShell>

      {/* Footer CTA ------------------------------------------------- */}
      <section className="border-t border-line bg-card px-5 py-14 text-center">
        <p className="font-script text-2xl text-gold">Want a custom menu?</p>
        <h2 className="u-heading mt-1 text-2xl text-gold-deep sm:text-3xl">
          Tell us about your event
        </h2>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">
          Chat with our team and we will build a menu around your guests,
          budget and venue.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href={whatsApp.quote}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-olive px-6 text-gold-olive transition-transform hover:-translate-y-0.5"
          >
            <Icon name="whatsapp" className="size-5" aria-hidden="true" />
            Chat with us
          </a>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-gold px-6 text-gold-deep transition-transform hover:-translate-y-0.5"
          >
            <Icon name="download" className="size-5" aria-hidden="true" />
            Download PDF
          </a>
        </div>
      </section>

      <footer className="relative overflow-hidden bg-olive px-5 py-12 text-center text-gold-olive">
        <div className="u-inset-frame absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-xl">
          <Image
            src="/logo.png"
            alt="VB Caterers logo"
            width={94}
            height={114}
            className="mx-auto h-auto w-20"
          />
          <address className="mx-auto mt-4 max-w-md text-sm not-italic leading-relaxed">
            {site.address}
          </address>
          <p className="mt-4 flex flex-col items-center gap-1 text-sm sm:flex-row sm:justify-center sm:gap-4">
            <a
              href={site.phoneHref}
              className="inline-flex min-h-[44px] items-center gap-2 underline-offset-4 hover:underline"
            >
              <Icon name="phone" className="size-4" aria-hidden="true" />
              {site.phoneDisplay}
            </a>
            <a
              href={`mailto:${site.email}`}
              className="inline-flex min-h-[44px] items-center gap-2 underline-offset-4 hover:underline"
            >
              <Icon name="mail" className="size-4" aria-hidden="true" />
              {site.email}
            </a>
          </p>
          <p className="mt-6 text-sm">{site.copyright}</p>
        </div>
      </footer>

      <BackToTop />
    </div>
  );
}
