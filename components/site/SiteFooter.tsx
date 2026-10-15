import Image from "next/image";
import { Icon } from "@/components/site/icons";
import { site } from "@/lib/site";

/**
 * Brand footer (same treatment as the menu page footer) for content pages that
 * are not the home page.
 */
export function SiteFooter() {
  return (
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
        <p className="mt-4 font-script text-2xl">{site.tagline}</p>
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
  );
}
