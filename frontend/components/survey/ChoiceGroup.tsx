"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChoiceOption = { value: string; label: string };

export function ChoiceGroup({
  options,
  multiple = false,
  value,
  onChange,
  name,
  error
}: {
  options: ChoiceOption[];
  multiple?: boolean;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  name?: string;
  error?: string;
}) {
  const selected = Array.isArray(value) ? value : [value].filter(Boolean);

  const toggle = (nextValue: string) => {
    if (!multiple) {
      onChange(nextValue);
      return;
    }

    const hasValue = selected.includes(nextValue);
    onChange(hasValue ? selected.filter((item) => item !== nextValue) : [...selected, nextValue]);
  };

  return (
    <div className="space-y-3">
      <div role="group" aria-label={name} className="space-y-2">
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              className={cn(
                "focus-ring flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition duration-200 ease-out",
                "bg-[color:var(--bg-surface)] hover:-translate-y-0.5 hover:bg-[color:var(--bg-subtle)]",
                active
                  ? "border-[color:var(--primary)] bg-[rgba(13,148,136,0.12)] shadow-[0_0_0_1px_rgba(13,148,136,0.18),0_0_24px_rgba(13,148,136,0.12)]"
                  : "border-[color:var(--border)]"
              )}
            >
              <span className="text-[15px] text-[color:var(--text-primary)]">{option.label}</span>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border transition",
                  active
                    ? "border-[color:var(--primary)] bg-[rgba(13,148,136,0.2)] text-[color:var(--accent)]"
                    : "border-[color:var(--border)] text-transparent"
                )}
              >
                <AnimatePresence>
                  {active ? (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 420, damping: 22 }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </span>
            </button>
          );
        })}
      </div>
      {error ? <p className="text-sm text-[color:var(--error)]">{error}</p> : null}
    </div>
  );
}
