import type { Metadata } from "next";
import Image from "next/image";
import { Icon } from "@/components/site/icons";
import { LeadGateForm } from "@/components/site/LeadGateForm";
import { site, whatsApp } from "@/lib/site";

/**
 * The first page a new visitor sees. proxy.ts sends anyone without the gate
 * cookie here from the home page; a submission or a skip sends them on to the
 * site proper. Kept out of search results — crawlers are allowed straight
 * through to the home page instead.
 */

export const metadata: Metadata = {
  title: "Welcome",
  description:
    "Share your phone number and email address and VB Caterers will send you menus and pricing for your celebration.",
  robots: { index: false, follow: false },
};

export default function WelcomePage() {
  return (
    <main className="relative isolate flex flex-1 items-center justify-center overflow-hidden bg-page px-5 py-12">
      <div className="u-inset-frame absolute inset-0" aria-hidden="true" />

      <div className="relative flex w-full max-w-md flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt="VB Caterers logo"
          width={134}
          height={163}
          priority
          sizes="(max-width: 640px) 104px, 120px"
          className="h-auto w-24 sm:w-[7.5rem]"
        />

        <p className="mt-5 font-script text-2xl text-gold">Get a quote</p>
        <h1 className="u-heading mt-1 text-2xl text-gold sm:text-3xl">
          Let&rsquo;s plan your event
        </h1>
        <span className="u-ornament mt-3" aria-hidden="true" />

        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          Share your phone and email and {site.name} will send you menus and
          pricing for your celebration.
        </p>

        <div className="mt-7 w-full rounded-lg border border-line bg-card p-5 text-left shadow-[var(--shadow)]">
          <LeadGateForm />
          <p className="mt-4 text-center text-xs text-ink-soft">
            We only use these to contact you about your event. No spam, ever.
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm text-ink-soft">
          <p>Prefer to talk to us right away?</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <a
              href={site.phoneHref}
              className="inline-flex min-h-[44px] items-center gap-2 underline-offset-4 hover:text-gold hover:underline"
            >
              <Icon name="phone" className="size-4" aria-hidden="true" />
              {site.phoneDisplay}
            </a>
            <a
              href={whatsApp.direct}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 underline-offset-4 hover:text-gold hover:underline"
            >
              <Icon name="whatsapp" className="size-4" aria-hidden="true" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
