"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

type Particle = {
  left: string;
  top: string;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  opacity: number;
};

const seed = [
  [8, 14, 3, 0, 18, 18, 0.23],
  [18, 22, 2, 1.4, 22, 12, 0.28],
  [28, 12, 4, 3.1, 19, 10, 0.19],
  [36, 28, 3, 2.4, 24, 16, 0.24],
  [46, 18, 2, 0.5, 20, 12, 0.22],
  [54, 32, 4, 1.9, 26, 14, 0.21],
  [64, 10, 2, 2.2, 18, 14, 0.26],
  [72, 24, 3, 3.6, 22, 18, 0.2],
  [82, 14, 2, 1.1, 20, 10, 0.25],
  [90, 30, 4, 2.8, 24, 16, 0.18],
  [12, 44, 3, 0.7, 20, 16, 0.24],
  [24, 56, 2, 3.2, 16, 12, 0.2],
  [34, 42, 4, 1.3, 22, 18, 0.17],
  [44, 60, 3, 2.6, 24, 14, 0.22],
  [56, 48, 2, 0.9, 18, 12, 0.26],
  [66, 58, 3, 3.8, 25, 16, 0.23],
  [78, 46, 2, 1.6, 17, 11, 0.19],
  [88, 54, 4, 2.1, 26, 18, 0.21],
  [16, 74, 3, 0.3, 21, 15, 0.2],
  [26, 82, 2, 2.9, 19, 13, 0.27],
  [38, 72, 4, 1.7, 23, 17, 0.16],
  [50, 84, 3, 3.4, 22, 15, 0.24],
  [62, 76, 2, 1.0, 18, 12, 0.18],
  [74, 88, 4, 2.7, 24, 18, 0.2],
  [86, 74, 3, 0.4, 20, 14, 0.22],
  [94, 86, 2, 3.2, 16, 11, 0.25]
] as const;

export function BioluminescentBackdrop({ className }: { className?: string }) {
  const particles = useMemo<Particle[]>(
    () =>
      seed.map(([left, top, size, delay, duration, driftX, opacity]) => ({
        left: `${left}%`,
        top: `${top}%`,
        size,
        delay,
        duration,
        driftX,
        driftY: Math.max(8, 24 - driftX),
        opacity
      })),
    []
  );

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(13,148,136,0.12),transparent_42%),radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.08),transparent_30%)]" />
      <div className="absolute inset-0 will-change-transform">
        {particles.map((particle, index) => (
          <span
            key={index}
            className="absolute rounded-full bg-[color:var(--primary)]"
            style={{
              left: particle.left,
              top: particle.top,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              filter: "blur(0.2px)",
              animation: `particle-drift-${index % 6} ${particle.duration}s ease-in-out ${particle.delay}s infinite alternate`
            }}
          />
        ))}
      </div>
    </div>
  );
}
