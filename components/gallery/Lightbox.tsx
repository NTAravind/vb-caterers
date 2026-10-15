"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";
import { mediaUrl, type GalleryItem } from "@/lib/gallery/types";

const SWIPE_THRESHOLD_PX = 56;

/**
 * In-site image lightbox: full-size (server-resized) image, keyboard and
 * swipe navigation, neighbour preloading, and a graceful error state.
 */
export function Lightbox({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: GalleryItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const item = items[index];
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const status: "loading" | "ready" | "error" =
    item && errorId === item.id ? "error" : item && loadedId === item.id ? "ready" : "loading";

  const goPrev = () => onIndexChange((index - 1 + items.length) % items.length);
  const goNext = () => onIndexChange((index + 1) % items.length);

  useEffect(() => {
    // Preload neighbours so swiping feels instant.
    for (const offset of [-1, 1]) {
      const neighbour = items[(index + offset + items.length) % items.length];
      if (neighbour) {
        const preload = new window.Image();
        preload.src = mediaUrl(neighbour.id, "large");
      }
    }
  }, [index, items]);

  if (!item) return null;

  return (
    <Modal
      label={item.name}
      onClose={onClose}
      onPrev={items.length > 1 ? goPrev : undefined}
      onNext={items.length > 1 ? goNext : undefined}
      footer={
        <div className="mx-auto max-w-xl px-14">
          <p className="truncate text-sm text-gold-olive" title={item.caption ?? item.name}>
            {item.caption ?? item.name}
          </p>
          <p className="mt-0.5 text-xs text-gold-olive/70">
            {index + 1} of {items.length}
          </p>
        </div>
      }
    >
      <div
        className="relative flex max-h-[72svh] w-full items-center justify-center"
        onTouchStart={(event) => {
          const touch = event.changedTouches[0];
          touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          const start = touchStartRef.current;
          touchStartRef.current = null;
          if (!start) return;
          const touch = event.changedTouches[0];
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          if (Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy) * 1.4) {
            if (dx > 0) goPrev();
            else goNext();
          }
        }}
      >
        {status !== "ready" && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-olive-deep/40"
            aria-hidden={status === "loading"}
          >
            {status === "loading" ? (
              <span className="font-script text-2xl text-gold-olive">Loading…</span>
            ) : (
              <div className="px-8 text-center text-gold-olive">
                <p className="font-script text-2xl">This photo could not be loaded</p>
                <p className="mt-2 text-sm text-gold-olive/80">{item.name}</p>
              </div>
            )}
          </div>
        )}
        <Image
          unoptimized
          src={mediaUrl(item.id, "large")}
          alt={item.alt}
          width={item.width ?? 1600}
          height={item.height ?? 1067}
          className={`max-h-[72svh] w-auto max-w-full rounded-xl object-contain transition-opacity duration-300 ${
            status === "ready" ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setLoadedId(item.id)}
          onError={() => setErrorId(item.id)}
        />
      </div>
    </Modal>
  );
}
