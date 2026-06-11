"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, label, id, suffix, ...props },
  ref
) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-[color:var(--text-primary)]">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          className={cn(
            "focus-ring h-11 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-4 text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] transition",
            "focus:border-[color:var(--border-active)] focus:bg-[color:var(--bg-elevated)] focus:shadow-[0_0_0_4px_rgba(13,148,136,0.12)]",
            error && "border-[color:var(--error)] focus:border-[color:var(--error)]",
            suffix && "pr-12",
            className
          )}
          {...props}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[color:var(--text-muted)]">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? <p className="text-sm text-[color:var(--error)]">{error}</p> : null}
    </div>
  );
});
