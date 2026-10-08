"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/site/icons";

/** Mobile-friendly back-to-top control; appears once the page is scrolled. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex size-11 items-center justify-center rounded-full border border-gold bg-page text-gold shadow-[var(--shadow)]"
    >
      <Icon name="arrow-up" className="size-5" aria-hidden="true" />
    </button>
  );
}
