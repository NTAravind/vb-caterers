"use client";

import { useState } from "react";
import { type GalleryItem } from "@/lib/gallery/types";
import { Lightbox } from "./Lightbox";
import { VideoModal } from "./VideoModal";
import { GalleryTile, type FailedMedia } from "./GalleryTile";

export function Gallery({
  items,
  layout = "masonry",
}: {
  items: GalleryItem[];
  layout?: "masonry" | "video";
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [failed, setFailed] = useState<FailedMedia[]>([]);

  const openItem = (item: GalleryItem) => {
    if (item.kind === "video") setVideoId(item.id);
    else setOpenId(item.id);
  };

  const images = items.filter((item) => item.kind === "image");
  const openIndex = openId ? images.findIndex((item) => item.id === openId) : -1;
  const video = videoId ? items.find((item) => item.id === videoId) : undefined;

  return (
    <>
      <div
        className={
          layout === "video"
            ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            : "columns-2 gap-3 sm:columns-3 lg:columns-4"
        }
      >
        {items.map((item) => (
          <GalleryTile
            key={item.id}
            item={item}
            layout={layout}
            onOpen={() => openItem(item)}
            onFailed={(failure) =>
              setFailed((current) =>
                current.some((entry) => entry.id === failure.id)
                  ? current
                  : [...current, failure],
              )
            }
          />
        ))}
      </div>

      {failed.length > 0 && (
        <p className="mt-4 text-center text-sm text-ink-soft" role="status">
          {failed.length === 1
            ? "1 item could not be displayed."
            : `${failed.length} items could not be displayed.`}
        </p>
      )}

      {openIndex >= 0 && (
        <Lightbox
          items={images}
          index={openIndex}
          onIndexChange={(next) => {
            const nextItem = images[(next + images.length) % images.length];
            if (nextItem) setOpenId(nextItem.id);
          }}
          onClose={() => setOpenId(null)}
        />
      )}

      {video && <VideoModal item={video} onClose={() => setVideoId(null)} />}
    </>
  );
}
