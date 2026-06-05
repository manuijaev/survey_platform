"use client";

import { cn } from "@/lib/utils";
import { Button } from "./Button";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-3xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-6 py-16 text-center", className)}>
      <svg viewBox="0 0 320 140" className="mb-6 h-28 w-full max-w-[18rem]" aria-hidden="true">
        <path d="M20 98 C62 48, 110 48, 150 94 S236 144, 300 58" fill="none" stroke="rgba(13,148,136,0.28)" strokeWidth="3" />
        <path d="M18 100 C60 54, 108 54, 150 98 S236 148, 302 62" fill="none" stroke="rgba(16,185,129,0.18)" strokeWidth="2" />
        <circle cx="70" cy="84" r="8" fill="rgba(13,148,136,0.38)" />
        <circle cx="126" cy="70" r="4" fill="rgba(16,185,129,0.38)" />
        <circle cx="208" cy="96" r="7" fill="rgba(13,148,136,0.32)" />
        <circle cx="250" cy="64" r="5" fill="rgba(16,185,129,0.26)" />
      </svg>
      <h2 className="font-display text-3xl text-[color:var(--text-primary)]">{title}</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--text-secondary)]">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-6 min-w-40" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
