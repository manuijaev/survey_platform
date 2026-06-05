"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, error, label, id, children, ...props },
  ref
) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-[color:var(--text-primary)]">
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={id}
        className={cn(
          "focus-ring h-11 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-4 text-[color:var(--text-primary)] transition",
          "focus:border-[color:var(--border-active)] focus:bg-[color:var(--bg-elevated)] focus:shadow-[0_0_0_4px_rgba(13,148,136,0.12)]",
          error && "border-[color:var(--error)] focus:border-[color:var(--error)]",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="text-sm text-[color:var(--error)]">{error}</p> : null}
    </div>
  );
});
