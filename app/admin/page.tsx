import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { Icon } from "@/components/site/icons";

export const metadata: Metadata = {
  title: "Lead Dashboard",
  description: "Captured leads from the VB Caterers website.",
  robots: { index: false, follow: false },
};

/**
 * Server component on purpose: it only exports metadata and renders a client
 * component, so nothing here reads search params or headers. Access control
 * happens in proxy.ts (page) and lib/admin/guard.ts (the JSON endpoints).
 */
export default function AdminPage() {
  return (
    <div className="min-h-svh">
      <header className="border-b border-line bg-olive">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="VB Caterers logo"
              width={34}
              height={42}
              className="h-auto w-8"
            />
            <div className="leading-tight">
              <p className="u-heading text-sm text-gold">VB Caterers</p>
              <p className="text-xs text-gold-olive">Lead Dashboard</p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm text-gold-olive underline-offset-4 transition-colors hover:text-gold hover:underline"
          >
            <Icon name="arrow-left" className="size-4" />
            Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full border border-gold/40 bg-card text-gold">
            <Icon name="users" className="size-6" />
          </span>
          <div>
            <h1 className="u-heading text-xl text-gold sm:text-2xl">
              Captured Leads
            </h1>
            <p className="text-sm text-ink-soft">
              Phone and email details submitted through the welcome gate.
            </p>
          </div>
        </div>

        <AdminDashboard />
      </main>
    </div>
  );
}
