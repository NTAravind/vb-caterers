import Link from "next/link";
import { Icon } from "@/components/site/icons";
import { galleryCopy, type MediaSection } from "@/lib/gallery/config";

const TABS: { section: MediaSection; href: string; icon: "photos" | "video" }[] = [
  { section: "photos", href: "/gallery", icon: "photos" },
  { section: "videos", href: "/gallery/videos", icon: "video" },
];

/** Album switcher shown under the hero on both gallery pages. */
export function GalleryTabs({ active }: { active: MediaSection }) {
  return (
    <nav aria-label="Gallery albums" className="mt-7 flex justify-center gap-3">
      {TABS.map(({ section, href, icon }) => {
        const isActive = section === active;
        return (
          <Link
            key={section}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-5 py-2 text-sm tracking-wide uppercase transition-colors ${
              isActive
                ? "border-gold bg-gold/15 text-gold-olive"
                : "border-gold-olive/30 text-gold-olive/80 hover:border-gold-olive hover:text-gold-olive"
            }`}
          >
            <Icon name={icon} className="size-4" aria-hidden="true" />
            {galleryCopy[section].tab}
          </Link>
        );
      })}
    </nav>
  );
}
