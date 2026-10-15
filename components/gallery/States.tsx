import { Icon } from "@/components/site/icons";
import { galleryEnvKeys, galleryCopy, type MediaSection } from "@/lib/gallery/config";
import type { GalleryErrorCode } from "@/lib/gallery/types";

/** Skeleton shown while a gallery listing streams in. */
export function GallerySkeleton({
  layout = "masonry",
}: {
  layout?: "masonry" | "video";
}) {
  const heights = ["h-40", "h-56", "h-32", "h-48", "h-36", "h-52", "h-44", "h-32"];
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading the gallery…</span>
      <div
        aria-hidden="true"
        className={
          layout === "video"
            ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            : "columns-2 gap-3 sm:columns-3 lg:columns-4"
        }
      >
        {(layout === "video" ? ["h-56", "h-56", "h-56", "h-56", "h-56", "h-56"] : heights).map(
          (height, index) => (
            <div
              key={index}
              className={`animate-pulse rounded-xl border border-line bg-card ${height} ${
                layout === "video" ? "" : "mb-3 break-inside-avoid"
              }`}
            />
          ),
        )}
      </div>
    </div>
  );
}

function Panel({
  icon,
  title,
  children,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-line bg-card p-8 text-center shadow-[var(--shadow)]">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full border border-line bg-page text-gold">
        <Icon name={icon} className="size-7" />
      </span>
      <h3 className="u-heading mt-4 text-xl text-gold-deep">{title}</h3>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft">{children}</div>
    </div>
  );
}

export function GalleryEmpty({ section }: { section: MediaSection }) {
  const copy = galleryCopy[section];
  return (
    <Panel icon={section === "videos" ? "video" : "photos"} title={copy.emptyTitle}>
      <p>{copy.emptyBody}</p>
    </Panel>
  );
}

const ERROR_COPY: Record<GalleryErrorCode, { title: string; help: string }> = {
  "not-configured": {
    title: "Gallery setup required",
    help: "The Google Drive gallery has not been configured on this server yet.",
  },
  "auth-error": {
    title: "Gallery temporarily unavailable",
    help: "The server could not authorise with Google Drive. Check that the service-account email and private key are correct.",
  },
  "folder-not-found": {
    title: "Drive folder not found",
    help: "The configured folder does not exist, is in the trash, or has not been shared with the service account.",
  },
  forbidden: {
    title: "Drive folder not shared",
    help: "Share the gallery folder in Google Drive with the service-account email as a Viewer, then try again.",
  },
  "rate-limited": {
    title: "Google Drive is busy",
    help: "The Drive API is rate limiting requests. Please check back in a few minutes.",
  },
  "network-error": {
    title: "Gallery temporarily unavailable",
    help: "The server could not reach Google Drive. Please try again shortly.",
  },
  "upstream-error": {
    title: "Gallery temporarily unavailable",
    help: "Google Drive returned an unexpected response. Please try again shortly.",
  },
};

export function GalleryError({ code }: { code: GalleryErrorCode }) {
  const copy = ERROR_COPY[code] ?? ERROR_COPY["upstream-error"];
  return (
    <Panel icon="alert" title={copy.title}>
      <p>{copy.help}</p>
      <p className="text-xs text-ink-soft/80">
        Visitors see this message instead of a broken grid — nothing from the Drive folder is
        exposed by accident.
      </p>
    </Panel>
  );
}

/**
 * Rendered when the environment variables are missing. It lists variable
 * *names* only — values and credentials are never printed.
 */
export function GallerySetup({
  missing,
  section,
}: {
  missing?: string[];
  section?: MediaSection;
}) {
  const missingCount = missing?.length ?? 0;
  return (
    <Panel icon="alert" title="Gallery setup required">
      <p>
        {section
          ? `The ${galleryCopy[section].tab.toLowerCase()} album is powered by a shared Google Drive folder.`
          : "This gallery is powered by shared Google Drive folders."}{" "}
        {missingCount === 1
          ? "Add the environment variable below and reload the page to switch it on."
          : "Add the environment variables below and reload the page to switch it on."}
      </p>
      <GallerySetupList missing={missing} />
      <p className="text-xs text-ink-soft/80">
        Full setup steps (service account, Drive API, folder sharing) are in the project
        README under “Google Drive gallery”.
      </p>
    </Panel>
  );
}

function GallerySetupList({ missing }: { missing?: string[] }) {
  return (
    <ul className="mx-auto mt-2 w-fit space-y-1 text-left font-mono text-xs text-ink-soft">
      {Object.values(galleryEnvKeys).map((key) => (
        <li key={key} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={missing?.includes(key) ? "text-gold" : "text-line"}
          >
            ·
          </span>
          {key}
          {missing?.includes(key) && <span className="sr-only"> (missing)</span>}
        </li>
      ))}
    </ul>
  );
}
