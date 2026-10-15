"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/components/site/icons";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])';

/**
 * Shared dialog shell for the gallery: brand-styled backdrop, Escape to close,
 * click-outside to close, focus trap, focus restoration and body scroll lock.
 */
export function Modal({
  label,
  onClose,
  onPrev,
  onNext,
  children,
  footer,
}: {
  label: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    const dialog = dialogRef.current;
    const focusable = dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable ?? dialog)?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      restoreFocusRef.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const nodes = Array.from(
          dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((node) => node.offsetParent !== null || node === document.activeElement);
        if (nodes.length === 0) {
          event.preventDefault();
          dialog.focus();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (event.shiftKey && (active === first || !dialog.contains(active))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const navButton =
    "absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold/40 bg-olive-deep/90 text-gold-olive backdrop-blur-sm transition-colors hover:bg-olive hover:text-gold min-h-[44px] min-w-[44px]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="relative flex max-h-full w-full max-w-5xl flex-col items-center outline-none"
      >
        {onPrev && (
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous item"
            className={`${navButton} left-1 sm:left-2`}
          >
            <Icon name="arrow-left" className="size-5" />
          </button>
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            aria-label="Next item"
            className={`${navButton} right-1 sm:right-2`}
          >
            <Icon name="arrow-right" className="size-5" />
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-1 right-0 z-10 flex size-11 items-center justify-center rounded-full border border-gold/40 bg-olive-deep/90 text-gold-olive backdrop-blur-sm transition-colors hover:bg-olive hover:text-gold"
        >
          <Icon name="close" className="size-5" />
        </button>

        <div className="flex w-full flex-1 items-center justify-center overflow-auto">
          {children}
        </div>

        {footer && <div className="mt-3 w-full shrink-0 text-center">{footer}</div>}
      </div>
    </div>
  );
}
