import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/site/icons";
import {
  cuisines,
  heroImage,
  linkStack,
  site,
  trustChips,
  whatsApp,
  mapsUrl,
} from "@/lib/site";
import { resolveCuisineAnchor } from "@/lib/menu";


export const metadata: Metadata = {
  title: "VB Caterers | Best Catering Service in Bengaluru",
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    url: "/",
    images: [{ url: "/images/DFDFGGDG.jpg", width: 422, height: 701 }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CateringBusiness",
  name: site.name,
  url: site.url,
  telephone: "+91-78990-40404",
  email: site.email,
  image: `${site.url}/images/DFDFGGDG.jpg`,
  slogan: site.tagline,
  priceRange: "₹₹",
  address: {
    "@type": "PostalAddress",
    streetAddress:
      "28, 11th Main Rd, behind KEB Counter, JC Nagar, Kurubarahalli, Basaweshwara Nagar",
    addressLocality: site.addressLocality,
    addressRegion: site.addressRegion,
    postalCode: site.postalCode,
    addressCountry: site.country,
  },
  areaServed: { "@type": "City", name: "Bengaluru" },
  sameAs: [site.url],
  makesOffer: {
    "@type": "Offer",
    itemOffered: { "@type": "Service", name: "Catering services" },
  },
};

function SectionHeading({
  overline,
  title,
  id,
}: {
  overline: string;
  title: string;
  id: string;
}) {
  return (
    <div className="mb-7 px-5 text-center">
      <p className="font-script text-2xl text-gold">{overline}</p>
      <h2 id={id} className="u-heading mt-1 text-2xl text-gold sm:text-3xl">
        {title}
      </h2>
      <span className="u-ornament mt-3" aria-hidden="true" />
    </div>
  );
}

export default function Home() {
  const cuisineLinks = cuisines.map((cuisine) => {
    const anchor = resolveCuisineAnchor(cuisine.sectionId, cuisine.groupTitle);
    return { ...cuisine, href: anchor ? `/menu${anchor}` : "/menu" };
  });

  return (
    <div className="flex-1 pb-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* Hero ------------------------------------------------------- */}
      <header className="relative isolate flex min-h-[86svh] flex-col items-center justify-center overflow-hidden bg-[#222] px-5 py-16 text-center">
        <Image
          src={heroImage.src}
          alt={heroImage.alt}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={65}
          className="-z-10 object-cover brightness-[0.55]"
        />
        <div className="absolute inset-0 -z-10 bg-black/40" aria-hidden="true" />
        <div className="u-inset-frame absolute inset-0" aria-hidden="true" />

        <div className="relative flex w-full max-w-2xl flex-col items-center">
          <Image
            src="/logo.png"
            alt="VB Caterers logo"
            width={134}
            height={163}
            priority
            sizes="(max-width: 640px) 112px, 128px"
            className="h-auto w-28 sm:w-32"
          />
      <h1 className="vb-title-gold u-heading mt-5 text-[clamp(2.6rem,13vw,5rem)] leading-[0.95]">
  VB Caterers
</h1>
          <p className="mt-3 font-script text-[clamp(1.5rem,6vw,2.4rem)] leading-tight text-gold-olive">
            {site.tagline}
          </p>
          <p className="mt-4 max-w-md text-base text-gold-olive sm:text-lg">
            {site.subLine}
          </p>
          <ul className="mt-7 flex flex-wrap items-center justify-center gap-2">
            {trustChips.map((chip) => (
              <li
                key={chip}
                className="rounded-full border border-gold-olive/45 bg-black/30 backdrop-blur-sm px-3 py-1.5 text-sm text-gold-olive"
              >
                {chip}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <main id="main" className="flex-1">
        {/* Link stack ---------------------------------------------- */}
        <section
          aria-labelledby="quick-links"
          className="mx-auto w-full max-w-4xl px-5 py-12 sm:py-16"
        >
          <h2 id="quick-links" className="sr-only">
            Quick links
          </h2>
          <ul className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-4 items-stretch">
            {linkStack
              .filter((link) => link.href.length > 0)
              .map((link, idx) => {
                const isHero = idx === 0;
                return (
                  <li
                    key={link.label}
                    className={
                      isHero
                        ? "col-span-2 md:col-span-2 md:row-span-2 flex"
                        : "col-span-1 flex"
                    }
                  >
                    <a
                      href={link.href}
                      {...(link.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-card p-4 text-center shadow-[var(--shadow)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg w-full h-full"
                    >
                      <span
                        className={`flex shrink-0 items-center justify-center rounded-full border border-line bg-page text-gold transition-transform duration-300 group-hover:scale-110 ${
                          isHero ? "size-16 md:size-20" : "size-14"
                        }`}
                      >
                        <Icon
                          name={link.icon}
                          className={isHero ? "size-8 md:size-10" : "size-7"}
                        />
                      </span>
                      <span className="min-w-0 w-full">
                        <span
                          className={`block font-medium leading-tight text-ink ${
                            isHero ? "text-xl md:text-2xl mt-2" : "text-base"
                          }`}
                        >
                          {link.label}
                        </span>
                        <span
                          className={`mt-1.5 block leading-snug text-ink-soft ${
                            isHero ? "text-sm md:text-base" : "text-[0.8rem]"
                          }`}
                        >
                          {link.sub}
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
          </ul>
        </section>

        {/* Cuisines ------------------------------------------------- */}
        <section
          aria-labelledby="cuisines"
          className="border-y border-line bg-card py-14"
        >
          <SectionHeading
            id="cuisines"
            overline="Flavours for every palate"
            title="Cuisines"
          />
          <ul className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2.5 px-5">
            {cuisineLinks.map((cuisine) => (
              <li key={cuisine.title}>
                <Link
                  href={cuisine.href}
                  title={cuisine.note}
                  className="flex min-h-[44px] items-center rounded-full border border-line bg-page px-4 py-2 text-gold-deep transition-colors hover:border-gold hover:bg-olive hover:text-gold-olive"
                >
                  {cuisine.title}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 px-5 text-center text-sm text-ink-soft">
            Jump straight to the matching section of the{" "}
            <Link
              href="/menu"
              className="text-gold-deep underline underline-offset-4"
            >
              full menu
            </Link>
            .
          </p>
        </section>
      </main>

      {/* Footer ------------------------------------------------------ */}
      <footer className="relative overflow-hidden bg-olive px-5 py-14 text-center text-gold-olive">
        <div className="u-inset-frame absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-xl pt-6">
          <Image
            src="/logo.png"
            alt="VB Caterers logo"
            width={106}
            height={129}
            className="mx-auto h-auto w-24"
          />
          <p className="mt-4 font-script text-2xl">{site.tagline}</p>
          <address className="mt-5 text-sm not-italic leading-relaxed">
            {site.address}
          </address>
          <p className="mt-4 flex flex-col items-center gap-1 text-sm sm:flex-row sm:justify-center sm:gap-4">
            <a
              href={site.phoneHref}
              className="inline-flex min-h-[44px] items-center gap-2 text-gold-olive underline-offset-4 hover:underline"
            >
              <Icon name="phone" className="size-4" aria-hidden="true" />
              {site.phoneDisplay}
            </a>
            <a
              href={`mailto:${site.email}`}
              className="inline-flex min-h-[44px] items-center gap-2 text-gold-olive underline-offset-4 hover:underline"
            >
              <Icon name="mail" className="size-4" aria-hidden="true" />
              {site.email}
            </a>
          </p>
          <p className="mt-6 text-sm">{site.copyright}</p>
        </div>
      </footer>

      {/* Floating Action Buttons ---------------------------------- */}
      <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-[#33352a]/95 p-1.5 shadow-[0_8px_30px_rgb(0_0_0/0.4)] ring-1 ring-gold/30 backdrop-blur-md">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1 rounded-full px-5 py-2 text-gold-olive hover:bg-black/30 hover:text-gold transition-colors"
        >
          <Icon name="pin" className="size-5" aria-hidden="true" />
          <span className="text-[0.65rem] font-sans font-medium uppercase tracking-wider">Location</span>
        </a>
        <div className="w-[1px] h-8 bg-line/20" />
        <a
          href={whatsApp.quote}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1 rounded-full px-5 py-2 text-[#25D366] hover:bg-black/30 transition-colors"
        >
          <Icon name="whatsapp" className="size-5" aria-hidden="true" />
          <span className="text-[0.65rem] font-sans font-medium uppercase tracking-wider">WhatsApp</span>
        </a>
        <div className="w-[1px] h-8 bg-line/20" />
        <a
          href={site.phoneHref}
          className="flex flex-col items-center justify-center gap-1 rounded-full px-5 py-2 text-gold-olive hover:bg-black/30 hover:text-gold transition-colors"
        >
          <Icon name="phone" className="size-5" aria-hidden="true" />
          <span className="text-[0.65rem] font-sans font-medium uppercase tracking-wider">Call</span>
        </a>
      </div>
    </div>
  );
}
