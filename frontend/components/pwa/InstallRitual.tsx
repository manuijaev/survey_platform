"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PWA_SHORT_NAME } from "@/lib/pwa/config";
import type { InstallPromptMode } from "@/lib/pwa/platform";
import styles from "./InstallRitual.module.css";

const heroSpring = { type: "spring" as const, stiffness: 340, damping: 26, mass: 0.9 };
const snapSpring = { type: "spring" as const, stiffness: 520, damping: 32, mass: 0.78 };

export type InstallRitualOrigin = {
  x: number;
  y: number;
};

export type InstallRitualCopy = {
  title: string;
  description: string;
  steps?: string[];
};

type RitualPhase = "burst" | "flight" | "crown" | "guide" | "success" | "exit";

type InstallRitualProps = {
  open: boolean;
  origin: InstallRitualOrigin;
  mode: InstallPromptMode;
  copy: InstallRitualCopy;
  onClose: () => void;
  onNativeInstall?: () => Promise<"accepted" | "dismissed" | "unavailable">;
};

const ORBIT_POINTS = Array.from({ length: 10 }, (_, index) => {
  const angle = (index / 10) * Math.PI * 2;
  return {
    id: index,
    x: Math.cos(angle) * 118,
    y: Math.sin(angle) * 118,
    delay: index * 0.04
  };
});

const BURST_PARTICLES = Array.from({ length: 18 }, (_, index) => {
  const angle = (index / 18) * Math.PI * 2 + 0.2;
  const distance = 56 + (index % 4) * 22;
  return {
    id: index,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    delay: index * 0.018
  };
});

export function InstallRitual({
  open,
  origin,
  mode,
  copy,
  onClose,
  onNativeInstall
}: InstallRitualProps) {
  const reduceMotion = useReducedMotion();
  const onNativeInstallRef = useRef(onNativeInstall);
  const onCloseRef = useRef(onClose);
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<RitualPhase>("burst");

  useEffect(() => {
    onNativeInstallRef.current = onNativeInstall;
    onCloseRef.current = onClose;
  }, [onClose, onNativeInstall]);

  const flightOffset = useMemo(() => {
    const centerX = typeof window !== "undefined" ? window.innerWidth / 2 : origin.x;
    const centerY = typeof window !== "undefined" ? window.innerHeight * 0.38 : origin.y;
    return {
      x: origin.x - centerX,
      y: origin.y - centerY
    };
  }, [origin.x, origin.y]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setPhase("burst");
      return;
    }

    let cancelled = false;

    const finish = () => {
      if (!cancelled) onCloseRef.current();
    };

    const runNative = async () => {
      const install = onNativeInstallRef.current;
      if (!install) {
        setPhase("guide");
        return;
      }

      const outcome = await install();
      if (cancelled) return;

      if (outcome === "accepted") {
        setPhase("success");
        window.setTimeout(() => {
          setPhase("exit");
          finish();
        }, 1600);
        return;
      }

      if (outcome === "dismissed") {
        setPhase("exit");
        window.setTimeout(finish, 420);
        return;
      }

      setPhase("guide");
    };

    if (reduceMotion) {
      if (mode === "native") {
        setPhase("crown");
        void runNative();
      } else {
        setPhase("guide");
      }
      return;
    }

    const timers = [
      window.setTimeout(() => setPhase("flight"), 220),
      window.setTimeout(() => setPhase("crown"), 920),
      window.setTimeout(() => {
        if (mode === "native") {
          void runNative();
          return;
        }
        setPhase("guide");
      }, 1480)
    ];

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [mode, open, reduceMotion]);

  if (!mounted || !open) {
    return null;
  }

  const showGuide = phase === "guide" || (reduceMotion && mode !== "native");
  const showSuccess = phase === "success";
  const showHero = phase !== "exit" && !showGuide;
  const heroLit = phase === "crown" || phase === "success";

  const content = (
    <AnimatePresence mode="wait">
      {open ? (
        <motion.div
          key="install-ritual"
          className={`fixed inset-0 z-[120] ${styles.overlay}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          <motion.div
            className={`absolute inset-0 ${styles.backdropGlow}`}
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(16px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />

          {phase === "burst" ? (
            <motion.div
              className="pointer-events-none absolute rounded-full bg-[rgba(13,148,136,0.35)]"
              style={{ left: origin.x, top: origin.y, width: 12, height: 12, x: "-50%", y: "-50%" }}
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: 28, opacity: 0 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            />
          ) : null}

          {BURST_PARTICLES.map((particle) => (
            <motion.span
              key={particle.id}
              className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-[color:var(--accent)] shadow-[0_0_12px_rgba(16,185,129,0.8)]"
              style={{ left: origin.x, top: origin.y }}
              initial={{ x: "-50%", y: "-50%", scale: 0, opacity: 0 }}
              animate={
                phase === "burst" || phase === "flight"
                  ? {
                      x: `calc(-50% + ${particle.x}px)`,
                      y: `calc(-50% + ${particle.y}px)`,
                      scale: [0, 1.2, 0.2],
                      opacity: [0, 1, 0]
                    }
                  : { opacity: 0 }
              }
              transition={{ duration: 0.8, delay: particle.delay, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}

          {showHero ? (
            <motion.div
              className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2"
              initial={false}
              animate={{ opacity: 1 }}
            >
              {ORBIT_POINTS.map((point) => (
                <motion.span
                  key={point.id}
                  className="absolute h-1.5 w-1.5 rounded-full bg-[rgba(13,148,136,0.85)]"
                  initial={{ x: 0, y: 0, opacity: 0 }}
                  animate={
                    heroLit
                      ? {
                          x: point.x,
                          y: point.y,
                          opacity: [0, 1, 0.65],
                          scale: [0.4, 1, 0.85]
                        }
                      : { opacity: 0 }
                  }
                  transition={{ delay: 0.8 + point.delay, ...heroSpring }}
                />
              ))}

              {[0, 1, 2].map((ring) => (
                <motion.span
                  key={ring}
                  className="absolute left-1/2 top-1/2 rounded-full border border-[rgba(13,148,136,0.28)]"
                  style={{ width: 220 + ring * 54, height: 220 + ring * 54, x: "-50%", y: "-50%" }}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={
                    heroLit ? { scale: [0.5, 1.08, 1], opacity: [0, 0.55, 0.18] } : { opacity: 0 }
                  }
                  transition={{ delay: 0.72 + ring * 0.12, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}

              <motion.div
                className={styles.logoShell}
                style={{ width: 112, height: 112 }}
                initial={
                  reduceMotion
                    ? { x: 0, y: 0, scale: 1, rotate: 0 }
                    : { x: flightOffset.x, y: flightOffset.y, scale: 0.28, rotate: -18 }
                }
                animate={
                  phase === "flight" || heroLit
                    ? { x: 0, y: 0, scale: showSuccess ? 1.08 : 1, rotate: 0 }
                    : { x: flightOffset.x, y: flightOffset.y, scale: 0.28, rotate: -18 }
                }
                transition={snapSpring}
              >
                <div className={styles.logoRing} aria-hidden="true">
                  <div className={styles.logoRingInner} />
                </div>
                <div className={`relative h-full w-full overflow-hidden rounded-[24%] border border-[rgba(13,148,136,0.45)] shadow-[0_0_48px_rgba(13,148,136,0.35)] ${styles.logoShine}`}>
                  <Image
                    src="/icons/icon-512.png"
                    alt={`${PWA_SHORT_NAME} app icon`}
                    width={112}
                    height={112}
                    className="h-full w-full object-cover"
                    priority
                  />
                </div>
              </motion.div>

              <motion.div
                className="absolute left-1/2 top-[calc(100%+1.4rem)] w-max max-w-[min(90vw,22rem)] -translate-x-1/2 text-center"
                initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
                animate={
                  heroLit
                    ? { opacity: 1, y: 0, filter: "blur(0px)" }
                    : { opacity: 0, y: 18, filter: "blur(6px)" }
                }
                transition={{ delay: 0.18, ...heroSpring }}
              >
                <p className="font-display text-3xl text-[color:var(--text-primary)] sm:text-4xl">
                  {showSuccess ? "Welcome aboard" : copy.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                  {showSuccess
                    ? `${PWA_SHORT_NAME} is on your home screen. Launch it anytime for the full experience.`
                    : copy.description}
                </p>
              </motion.div>
            </motion.div>
          ) : null}

          <AnimatePresence>
            {showGuide && copy.steps?.length ? (
              <motion.div
                key="guide"
                className={`absolute inset-0 z-10 flex flex-col overflow-y-auto safe-top safe-bottom ${styles.guidePanel}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={heroSpring}
              >
                <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pb-4 pt-2">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Close install guide"
                      className="focus-ring min-h-11 rounded-full border border-[color:var(--border)] bg-[rgba(8,14,12,0.82)] px-4 py-2 text-xs text-[color:var(--text-secondary)] backdrop-blur-md"
                    >
                      Close
                    </button>
                  </div>
                  <div className={`${styles.guideHeader} flex items-start gap-3`}>
                    <Image
                      src="/icons/icon-192.png"
                      alt=""
                      width={52}
                      height={52}
                      className="h-[52px] w-[52px] shrink-0 rounded-2xl border border-[rgba(13,148,136,0.35)] shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                    />
                    <div className="min-w-0 pt-0.5">
                      <p className="font-display text-2xl leading-tight text-[color:var(--text-primary)]">
                        {copy.title}
                      </p>
                      <p className="mt-1.5 text-sm leading-6 text-[color:var(--text-secondary)]">
                        {copy.description}
                      </p>
                    </div>
                  </div>

                  <div className="w-full space-y-2">
                    {copy.steps.map((step, index) => (
                      <motion.div
                        key={step}
                        className={`${styles.stepCard} rounded-2xl px-4 py-3`}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.12 + index * 0.1, ...heroSpring }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:var(--border-active)] bg-[rgba(13,148,136,0.14)] font-mono text-xs text-[color:var(--primary)]">
                            {index + 1}
                          </span>
                          <p className="text-sm leading-6 text-[color:var(--text-primary)]">{step}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <motion.button
                    type="button"
                    onClick={onClose}
                    className="focus-ring mt-2 min-h-11 w-full rounded-full border border-[color:var(--border-active)] bg-[rgba(13,148,136,0.18)] px-5 py-2.5 text-sm font-medium text-[color:var(--text-primary)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                  >
                    Got it
                  </motion.button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {showGuide && !copy.steps?.length ? (
            <motion.div
              className="absolute inset-x-0 safe-bottom-fixed flex justify-center px-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={heroSpring}
            >
              <button
                type="button"
                onClick={onClose}
                className="focus-ring rounded-full border border-[color:var(--border-active)] bg-[rgba(13,148,136,0.18)] px-5 py-2.5 text-sm text-[color:var(--text-primary)]"
              >
                Continue
              </button>
            </motion.div>
          ) : null}

          {!showGuide && phase !== "success" ? (
            <motion.button
              type="button"
              onClick={onClose}
              aria-label="Close install animation"
              className="focus-ring safe-top-fixed absolute right-4 min-h-10 rounded-full border border-[color:var(--border)] bg-[rgba(8,14,12,0.72)] px-3 py-2 text-xs text-[color:var(--text-secondary)] backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Close
            </motion.button>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
