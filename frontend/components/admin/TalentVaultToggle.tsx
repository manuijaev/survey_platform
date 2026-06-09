"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type TalentVaultToggleProps = {
  shortlisted: boolean;
  loading?: boolean;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
  onToggle: (event: React.MouseEvent) => void;
};

export function TalentVaultToggle({
  shortlisted,
  loading = false,
  size = "md",
  showLabel = false,
  className,
  onToggle
}: TalentVaultToggleProps) {
  const reduceMotion = useReducedMotion();
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const buttonSize = size === "sm" ? "h-9 min-w-9" : "h-11 min-w-11";

  return (
    <motion.button
      type="button"
      aria-label={shortlisted ? "Remove from talent vault" : "Save to talent vault"}
      aria-pressed={shortlisted}
      title={shortlisted ? "Remove from talent vault" : "Save to talent vault"}
      disabled={loading}
      onClick={onToggle}
      whileTap={reduceMotion || loading ? undefined : { scale: 0.92 }}
      whileHover={reduceMotion || loading ? undefined : { scale: 1.06 }}
      className={cn(
        "focus-ring inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border transition-colors",
        buttonSize,
        showLabel && "px-3",
        shortlisted
          ? "border-[rgba(13,148,136,0.45)] bg-[rgba(13,148,136,0.16)] text-[color:var(--primary)] shadow-[0_0_24px_rgba(13,148,136,0.18)]"
          : "border-[color:var(--border)] bg-[color:var(--bg-elevated)] text-[color:var(--text-secondary)] hover:border-[color:var(--border-active)] hover:text-[color:var(--text-primary)]",
        className
      )}
    >
      {loading ? (
        <Loader2 className={cn(iconSize, "animate-spin")} />
      ) : shortlisted ? (
        <BookmarkCheck className={iconSize} />
      ) : (
        <Bookmark className={iconSize} />
      )}
      {showLabel ? (
        <span className="hidden text-xs font-medium sm:inline">
          {shortlisted ? "In vault" : "Save"}
        </span>
      ) : null}
    </motion.button>
  );
}
