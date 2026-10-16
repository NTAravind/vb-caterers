import Image from "next/image";
import Link from "next/link";
import { Icon, type IconName } from "@/components/site/icons";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for the signed-in admin pages: brand header, a link back to the
 * site, section tabs, and the page heading. Purely presentational — access
 * control is proxy.ts (pages) plus lib/admin/guard.ts (the JSON endpoints).
 */

export type AdminSection = "leads" | "menu";

const TABS: { href: string; label: string; section: AdminSection; icon: IconName }[] = [
  { href: "/admin", label: "Leads", section: "leads", icon: "users" },
  { href: "/admin/menu", label: "Menu", section: "menu", icon: "menu" },
];

export function AdminShell({
  section,
  title,
  description,
  icon,
  children,
}: {
  section: AdminSection;
  title: string;
  description: string;
  icon: IconName;
  children: React.ReactNode;
}) {
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
              <p className="text-xs text-gold-olive">Admin</p>
            </div>
          </div>

          <nav className="flex items-center gap-1" aria-label="Admin sections">
            {TABS.map((tab) => (
              <Link
                key={tab.section}
                href={tab.href}
                aria-current={section === tab.section ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-[40px] items-center gap-2 rounded-md px-3 text-sm transition-colors",
                  section === tab.section
                    ? "bg-olive-deep text-gold"
                    : "text-gold-olive hover:text-gold",
                )}
              >
                <Icon name={tab.icon} className="size-4" aria-hidden="true" />
                {tab.label}
              </Link>
            ))}
          </nav>

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
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-card text-gold",
            )}
          >
            <Icon name={icon} className="size-6" />
          </span>
          <div>
            <h1 className="u-heading text-xl text-gold sm:text-2xl">{title}</h1>
            <p className="text-sm text-ink-soft">{description}</p>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
