"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function Progress({
  value,
  total,
  label
}: {
  value: number;
  total: number;
  label?: string;
}) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  const spring = useSpring(0, { stiffness: 120, damping: 20, mass: 0.8 });
  const width = useTransform(spring, (latest) => `${latest}%`);

  useEffect(() => {
    spring.set(percent);
  }, [percent, spring]);

  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between text-sm text-[color:var(--text-secondary)]">
          <span>{label}</span>
          <span className="font-mono text-[12px]">{Math.round(percent)}%</span>
        </div>
      ) : null}
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <motion.div className="h-full rounded-full bg-[color:var(--primary)] shadow-[0_0_18px_rgba(13,148,136,0.35)]" style={{ width }} />
      </div>
    </div>
  );
}
