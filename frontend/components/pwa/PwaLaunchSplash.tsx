"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { PWA_SHORT_NAME, PWA_SPLASH_DURATION_MS } from "@/lib/pwa/config";
import styles from "./PwaLaunchSplash.module.css";

const logoSpring = { type: "spring" as const, stiffness: 280, damping: 22, mass: 0.95 };
const fadeEase = [0.22, 1, 0.36, 1] as const;

type ParticleSpec = {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  opacity: number;
};

function buildParticles(count: number): ParticleSpec[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: 8 + ((id * 37) % 84),
    top: 12 + ((id * 53) % 76),
    size: 2 + (id % 4),
    delay: (id % 12) * 0.05,
    duration: 1.6 + (id % 6) * 0.22,
    driftX: ((id % 5) - 2) * 18,
    driftY: -48 - (id % 7) * 16,
    opacity: 0.35 + (id % 5) * 0.12
  }));
}

export function PwaLaunchSplash({ onComplete }: { onComplete: () => void }) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const particles = useMemo(() => buildParticles(42), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const totalMs = reduceMotion ? 520 : PWA_SPLASH_DURATION_MS;
    const fadeOutMs = reduceMotion ? 180 : 520;

    const fadeTimer = window.setTimeout(() => setVisible(false), totalMs - fadeOutMs);
    const doneTimer = window.setTimeout(onComplete, totalMs);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onComplete, reduceMotion]);

  if (!mounted) {
    return null;
  }

  const content = (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="pwa-launch-splash"
          className={`safe-top safe-bottom fixed inset-0 z-[200] flex items-center justify-center overflow-hidden ${styles.root}`}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: reduceMotion ? 0.18 : 0.52, ease: fadeEase } }}
        >
          <div className={`pointer-events-none absolute inset-0 ${styles.filmGrain}`} aria-hidden="true" />

          {particles.map((particle) => (
            <motion.span
              key={particle.id}
              className={styles.particle}
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                width: particle.size,
                height: particle.size,
                opacity: 0
              }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{
                opacity: [0, particle.opacity, 0],
                scale: [0.4, 1, 0.2],
                x: [0, particle.driftX],
                y: [0, particle.driftY]
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: reduceMotion ? 0 : Infinity,
                repeatDelay: 0.35,
                ease: "easeOut"
              }}
            />
          ))}

          <motion.div
            className="pointer-events-none absolute h-[min(72vw,320px)] w-[min(72vw,320px)] rounded-full border border-[rgba(13,148,136,0.2)]"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.15, 1], opacity: [0, 0.45, 0.2] }}
            transition={{ duration: reduceMotion ? 0.3 : 1.4, ease: fadeEase }}
          />
          <motion.div
            className="pointer-events-none absolute h-[min(88vw,400px)] w-[min(88vw,400px)] rounded-full border border-[rgba(13,148,136,0.12)]"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [0.4, 1.2, 1], opacity: [0, 0.3, 0.12] }}
            transition={{ duration: reduceMotion ? 0.3 : 1.6, delay: 0.12, ease: fadeEase }}
          />

          <div className="relative flex flex-col items-center px-6 text-center">
            <motion.div
              className="relative"
              style={{ width: 128, height: 128 }}
              initial={reduceMotion ? { opacity: 0, scale: 1 } : { opacity: 0, scale: 0.35, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={logoSpring}
            >
              <div className={styles.logoRing} aria-hidden="true">
                <div className={styles.logoRingInner} />
              </div>
              <motion.div
                className={`relative h-full w-full overflow-hidden rounded-[24%] border border-[rgba(13,148,136,0.5)] shadow-[0_0_56px_rgba(13,148,136,0.4)] ${styles.logoShine}`}
                animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src="/icons/icon-512.png"
                  alt={`${PWA_SHORT_NAME} logo`}
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                  priority
                />
              </motion.div>
              {!reduceMotion ? (
                <motion.div
                  className={styles.streak}
                  initial={{ opacity: 0, scaleX: 0.2 }}
                  animate={{ opacity: [0, 0.85, 0], scaleX: [0.2, 1, 1.1] }}
                  transition={{ duration: 1.1, delay: 0.45, ease: fadeEase }}
                />
              ) : null}
            </motion.div>

            <motion.p
              className="mt-8 font-display text-4xl text-[color:var(--text-primary)] sm:text-5xl"
              initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: reduceMotion ? 0.05 : 0.55, duration: 0.55, ease: fadeEase }}
            >
              {PWA_SHORT_NAME}
            </motion.p>
            <motion.p
              className="mt-2 text-sm uppercase tracking-[0.32em] text-[color:var(--text-muted)]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0.1 : 0.75, duration: 0.45, ease: fadeEase }}
            >
              Survey Platform
            </motion.p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
