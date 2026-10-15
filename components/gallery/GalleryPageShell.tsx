import { io } from "next/cache";
import Image from "next/image";
import { Suspense } from "react";
import { Gallery } from "@/components/gallery/Gallery";
import { GalleryTabs } from "@/components/gallery/GalleryTabs";
import {
  GalleryEmpty,
  GalleryError,
  GallerySetup,
  GallerySkeleton,
} from "@/components/gallery/States";
import { SiteFooter } from "@/components/site/SiteFooter";
import {
  galleryCopy,
  getGalleryConfig,
  sectionEnvKey,
  sectionFolderId,
  sectionKind,
  type MediaSection,
} from "@/lib/gallery/config";
import { toPublicItem } from "@/lib/gallery/format";
import { getGalleryRecords } from "@/lib/gallery/media";

function GalleryHero({ section }: { section: MediaSection }) {
  const copy = galleryCopy[section];
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
          {copy.title}
        </h1>
        <p className="mt-2 font-script text-[clamp(1.5rem,6vw,2.3rem)] leading-tight text-gold-olive">
          {copy.overline}
        </p>
        <span className="u-ornament mt-4" aria-hidden="true" />
        <p className="mx-auto mt-4 max-w-lg text-sm text-gold-olive/90">{copy.intro}</p>
        <GalleryTabs active={section} />
      </div>
    </section>
  );
}

/**
 * One album's content. Configuration is read per request (never cached) so
 * adding credentials or sharing a folder takes effect without a rebuild, and
 * anything that is not a success is kept out of the static shell.
 */
async function GallerySection({ section }: { section: MediaSection }) {
  const config = getGalleryConfig();
  if (!config.ok) {
    // Built before the credentials were added: keep the setup notice out of
    // the static shell so it disappears on the next request, without a rebuild.
    await io();
    return <GallerySetup missing={config.missing} />;
  }

  if (!sectionFolderId(config.config, section)) {
    // The other album may well be configured — only this one is not.
    await io();
    return <GallerySetup missing={[sectionEnvKey(section)]} section={section} />;
  }

  const result = await getGalleryRecords(config.config);
  if (!result.ok) {
    // A Drive hiccup or a folder that is not shared yet must never be frozen
    // into the static shell — re-evaluate it on every request.
    await io();
    return <GalleryError code={result.code} />;
  }

  const items = result.items
    .filter((item) => item.kind === sectionKind(section))
    .map(toPublicItem);

  if (items.length === 0) {
    // Empty today, not necessarily tomorrow — never frozen into the shell.
    await io();
    return <GalleryEmpty section={section} />;
  }

  return (
    <>
      <h2 className="sr-only">{galleryCopy[section].title}</h2>
      <p className="mb-6 text-center text-sm text-ink-soft">
        {items.length} {items.length === 1 ? "item" : "items"} in this album
      </p>
      <Gallery items={items} layout={section === "videos" ? "video" : "masonry"} />
    </>
  );
}

/** Shared layout for `/gallery` (photos) and `/gallery/videos`. */
export function GalleryPageShell({ section }: { section: MediaSection }) {
  const layout = section === "videos" ? "video" : "masonry";
  return (
    <div className="flex-1">
      <GalleryHero section={section} />
      <main id="main" className="mx-auto w-full max-w-6xl px-5 py-12">
        <Suspense fallback={<GallerySkeleton layout={layout} />}>
          <GallerySection section={section} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
