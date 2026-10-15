"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/site/icons";
import { formatDuration } from "@/lib/gallery/format";
import { mediaUrl, type GalleryItem } from "@/lib/gallery/types";

export type FailedMedia = { id: string; message: string };

export function GalleryTile({
  item,
  onOpen,
  onFailed,
  layout = "masonry",
}: {
  item: GalleryItem;
  onOpen: () => void;
  onFailed: (failure: FailedMedia) => void;
  layout?: "masonry" | "video";
}) {
  const [step, setStep] = useState<"thumb" | "full" | "failed">("thumb");
  const duration = formatDuration(item.durationMs);
  const ratio = item.width && item.height ? item.width / item.height : 4 / 3;
  const canShowPoster = step !== "failed";
  const src = step === "thumb" ? mediaUrl(item.id, "thumb") : mediaUrl(item.id, "full");
  const wide = layout === "video";

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={`${item.kind === "video" ? "Play video" : "View photo"}: ${item.alt}`}
      className={`group relative block w-full overflow-hidden rounded-xl border border-line bg-card text-left shadow-[var(--shadow)] transition-transform duration-300 hover:-translate-y-1 ${
        wide ? "" : "mb-3 break-inside-avoid"
      }`}
    >
      {canShowPoster ? (
        <Image
          unoptimized
          src={src}
          alt={item.alt}
          width={item.width ?? 1200}
          height={item.height ?? 900}
          loading="lazy"
          decoding="async"
          className={`block w-full transition-transform duration-500 group-hover:scale-105 ${
            wide ? "aspect-video object-cover" : "h-auto"
          }`}
          onError={() => {
            if (step === "thumb" && item.kind === "image") {
              setStep("full");
            } else {
              setStep("failed");
              onFailed({ id: item.id, message: item.name });
            }
          }}
        />
      ) : (
        <span
          className="flex w-full items-center justify-center bg-olive/90 text-gold-olive"
          style={{ aspectRatio: ratio }}
        >
          <Icon
            name={item.kind === "video" ? "video" : "photos"}
            className="size-8"
            aria-hidden="true"
          />
          <span className="sr-only">{item.name} could not be displayed</span>
        </span>
      )}

      {item.kind === "video" && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex size-14 items-center justify-center rounded-full border border-gold/50 bg-olive-deep/85 text-gold-olive shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            <Icon name="play" className="size-6" />
          </span>
          {duration && (
            <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-xs tabular-nums text-gold-olive">
              {duration}
            </span>
          )}
        </span>
      )}
    </button>
  );
}
