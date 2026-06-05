"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function ResponseCard({
  title,
  message,
  actionLabel,
  onAction,
  className
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[1.75rem] border border-[color:var(--border)] bg-[rgba(12,20,16,0.92)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)]", className)}>
      <div className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(16,185,129,0.24)] bg-[rgba(16,185,129,0.12)] text-[color:var(--accent)]">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h3 className="mt-5 font-display text-3xl text-[color:var(--text-primary)]">{title}</h3>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[color:var(--text-secondary)]">{message}</p>
        {actionLabel && onAction ? (
          <Button className="mt-6 min-w-48" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
