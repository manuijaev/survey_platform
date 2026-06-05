"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "center"
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "center" | "drawer";
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const elements = Array.from(focusable).filter((element) => !element.hasAttribute("disabled"));

      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        last.focus();
        event.preventDefault();
      } else if (!event.shiftKey && document.activeElement === last) {
        first.focus();
        event.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const focusTarget = panelRef.current.querySelector<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    focusTarget?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[90]">
          <motion.button
            type="button"
            aria-label="Close modal"
            className="absolute inset-0 cursor-default bg-[rgba(6,10,9,0.85)] backdrop-blur-[8px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {variant === "drawer" ? (
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              className="absolute right-0 top-0 flex h-full w-full max-w-[34rem] flex-col border-l border-[color:var(--glass-border)] bg-[color:var(--bg-elevated)] shadow-2xl"
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border)] px-6 py-5">
                <div className="space-y-1">
                  {title ? <h2 className="font-display text-2xl text-[color:var(--text-primary)]">{title}</h2> : null}
                  {description ? <p className="text-sm text-[color:var(--text-secondary)]">{description}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="focus-ring rounded-full p-2 text-[color:var(--text-secondary)] transition hover:bg-[color:var(--bg-subtle)] hover:text-[color:var(--text-primary)]"
                  aria-label="Close drawer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 muted-scrollbar">{children}</div>
              {footer ? <div className="border-t border-[color:var(--border)] px-6 py-5">{footer}</div> : null}
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                className={cn(
                  "glass-panel w-full max-w-[34rem] rounded-[1.25rem] p-6 sm:p-8",
                  "max-h-[min(88vh,52rem)] overflow-y-auto muted-scrollbar"
                )}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    {title ? <h2 className="font-display text-2xl text-[color:var(--text-primary)]">{title}</h2> : null}
                    {description ? <p className="text-sm text-[color:var(--text-secondary)]">{description}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="focus-ring rounded-full p-2 text-[color:var(--text-secondary)] transition hover:bg-[color:var(--bg-subtle)] hover:text-[color:var(--text-primary)]"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div>{children}</div>
                {footer ? <div className="mt-6">{footer}</div> : null}
              </motion.div>
            </div>
          )}
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
