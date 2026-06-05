"use client";

import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, CircleCheckBig, Info, X } from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { cn } from "@/lib/utils";
import type { ToastRecord, ToastType } from "@/lib/toast-service";

const iconMap: Record<ToastType, ComponentType<{ className?: string }>> = {
  success: CircleCheckBig,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const toneMap: Record<
  ToastType,
  { border: string; glow: string; text: string; accent: string; ariaLive: "polite" | "assertive" }
> = {
  success: {
    border: "border-l-[color:var(--accent)]",
    glow: "shadow-[inset_3px_0_12px_rgba(16,185,129,0.22)]",
    text: "text-[color:var(--text-primary)]",
    accent: "text-[color:var(--accent)]",
    ariaLive: "polite"
  },
  error: {
    border: "border-l-[color:var(--error)]",
    glow: "shadow-[inset_3px_0_12px_rgba(248,113,113,0.22)]",
    text: "text-[color:var(--text-primary)]",
    accent: "text-[color:var(--error)]",
    ariaLive: "assertive"
  },
  warning: {
    border: "border-l-[color:var(--warning)]",
    glow: "shadow-[inset_3px_0_12px_rgba(251,191,36,0.2)]",
    text: "text-[color:var(--text-primary)]",
    accent: "text-[color:var(--warning)]",
    ariaLive: "assertive"
  },
  info: {
    border: "border-l-[color:var(--info)]",
    glow: "shadow-[inset_3px_0_12px_rgba(56,189,248,0.2)]",
    text: "text-[color:var(--text-primary)]",
    accent: "text-[color:var(--info)]",
    ariaLive: "polite"
  }
};

export function Toast({
  toast,
  onDismiss
}: {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
}) {
  const tone = toneMap[toast.type];
  const Icon = iconMap[toast.type];
  const [remaining, setRemaining] = useState(toast.duration);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;

    const timer = window.setInterval(() => {
      setRemaining((current) => {
        const nextRemaining = Math.max(0, current - 50);
        if (nextRemaining <= 0) {
          window.clearInterval(timer);
          onDismiss(toast.id);
        }
        return nextRemaining;
      });
    }, 50);

    return () => window.clearInterval(timer);
  }, [onDismiss, paused, toast.id]);

  const progress = useMemo(() => Math.max(0, (remaining / toast.duration) * 100), [remaining, toast.duration]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      role="alert"
      aria-live={tone.ariaLive}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        "pointer-events-auto relative overflow-hidden rounded-2xl border border-[color:var(--glass-border)] border-l-0 bg-[color:var(--bg-elevated)] px-4 py-4 pr-10 shadow-2xl backdrop-blur-xl",
        "min-w-[min(100vw-2rem,24rem)] max-w-[24rem] border-l-4",
        tone.border,
        tone.glow
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 shrink-0", tone.accent)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn("text-sm font-semibold", tone.text)}>{toast.title}</div>
          <div className="mt-1 text-sm leading-5 text-[color:var(--text-secondary)]">{toast.message}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="focus-ring absolute right-2 top-2 rounded-full p-1 text-[color:var(--text-muted)] transition hover:bg-[color:var(--bg-subtle)] hover:text-[color:var(--text-primary)]"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="mt-4 h-0.5 overflow-hidden rounded-full bg-white/5">
        <div
          className={cn("h-full rounded-full transition-[width] duration-75", tone.accent.replace("text-", "bg-"))}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}
