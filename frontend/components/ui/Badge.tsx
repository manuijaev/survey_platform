"use client";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  children
}: {
  className?: string;
  tone?: "neutral" | "success" | "info" | "warning" | "danger" | "teal";
  children: React.ReactNode;
}) {
  const toneClasses: Record<string, string> = {
    neutral: "bg-white/5 text-[color:var(--text-secondary)] border-white/10",
    success: "bg-[rgba(16,185,129,0.14)] text-[color:var(--accent)] border-[rgba(16,185,129,0.22)]",
    info: "bg-[rgba(56,189,248,0.12)] text-[color:var(--info)] border-[rgba(56,189,248,0.22)]",
    warning: "bg-[rgba(251,191,36,0.14)] text-[color:var(--warning)] border-[rgba(251,191,36,0.22)]",
    danger: "bg-[rgba(248,113,113,0.14)] text-[color:var(--error)] border-[rgba(248,113,113,0.22)]",
    teal: "bg-[rgba(13,148,136,0.15)] text-[color:var(--primary)] border-[rgba(13,148,136,0.22)]"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium leading-none",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
