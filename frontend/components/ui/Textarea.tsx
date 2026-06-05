"use client";

import { useEffect, useRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  autoResize?: boolean;
}

export function Textarea({
  className,
  error,
  label,
  id,
  autoResize = false,
  onChange,
  rows = 4,
  ...props
}: TextareaProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!autoResize || !ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  });

  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-[color:var(--text-primary)]">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        onChange={(event) => {
          if (autoResize && ref.current) {
            ref.current.style.height = "auto";
            ref.current.style.height = `${ref.current.scrollHeight}px`;
          }
          onChange?.(event);
        }}
        className={cn(
          "focus-ring min-h-[7rem] w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-4 py-3 text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] transition",
          "focus:border-[color:var(--border-active)] focus:bg-[color:var(--bg-elevated)] focus:shadow-[0_0_0_4px_rgba(13,148,136,0.12)]",
          error && "border-[color:var(--error)] focus:border-[color:var(--error)]",
          className
        )}
        {...props}
      />
      {error ? <p className="text-sm text-[color:var(--error)]">{error}</p> : null}
    </div>
  );
}
