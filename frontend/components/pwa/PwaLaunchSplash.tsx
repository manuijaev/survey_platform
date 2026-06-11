"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { PWA_SHORT_NAME, PWA_SPLASH_DURATION_MS } from "@/lib/pwa/config";
import styles from "./PwaLaunchSplash.module.css";

const fadeEase = [0.22, 1, 0.36, 1] as const;
const snapSpring = { type: "spring" as const, stiffness: 420, damping: 28, mass: 0.82 };

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

type SparkSpec = {
  id: number;
  angle: number;
  radius: number;
  size: number;
  delay: number;
};

const LIGHT_RAYS = Array.from({ length: 14 }, (_, id) => ({
  id,
  rotate: (360 / 14) * id,
  delay: id * 0.03
}));

function buildParticles(count: number): ParticleSpec[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: 6 + ((id * 41) % 88),
    top: 10 + ((id * 59) % 80),
    size: 1.5 + (id % 5) * 0.65,
    delay: (id % 14) * 0.06,
    duration: 1.8 + (id % 7) * 0.28,
    driftX: ((id % 7) - 3) * 22,
    driftY: -56 - (id % 9) * 18,
    opacity: 0.28 + (id % 6) * 0.1
  }));
}

function buildSparks(count: number): SparkSpec[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    angle: (360 / count) * id + 12,
    radius: 78 + (id % 3) * 14,
    size: 3 + (id % 2),
    delay: 0.35 + id * 0.05
  }));
}

const titleContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.055, delayChildren: 0.62 }
  }
};

const titleChar = {
  hidden: { opacity: 0, y: 28, rotateX: -72, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 380, damping: 24 }
  }
};

export function PwaLaunchSplash({ onComplete }: { onComplete: () => void }) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const particles = useMemo(() => buildParticles(48), []);
  const sparks = useMemo(() => buildSparks(10), []);
  const titleChars = useMemo(() => PWA_SHORT_NAME.split(""), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const totalMs = reduceMotion ? 520 : PWA_SPLASH_DURATION_MS;
    const fadeOutMs = reduceMotion ? 180 : 620;

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
          exit={{
            opacity: 0,
            scale: 1.04,
            filter: "blur(14px)",
            transition: { duration: reduceMotion ? 0.18 : 0.62, ease: fadeEase }
          }}
        >
          <motion.div
            className={`${styles.auroraLayer} ${styles.auroraTeal}`}
            style={{ width: "min(92vw, 520px)", height: "min(92vw, 520px)", left: "8%", top: "18%" }}
            animate={
              reduceMotion
                ? { opacity: 0.5 }
                : { x: [0, 36, -18, 0], y: [0, -28, 14, 0], scale: [1, 1.12, 0.96, 1], opacity: [0.42, 0.62, 0.48, 0.42] }
            }
            transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className={`${styles.auroraLayer} ${styles.auroraMint}`}
            style={{ width: "min(78vw, 440px)", height: "min(78vw, 440px)", right: "4%", bottom: "12%" }}
            animate={
              reduceMotion
                ? { opacity: 0.4 }
                : { x: [0, -42, 24, 0], y: [0, 22, -18, 0], scale: [1, 0.92, 1.08, 1], opacity: [0.35, 0.55, 0.4, 0.35] }
            }
            transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          />
          <motion.div
            className={`${styles.auroraLayer} ${styles.auroraDeep}`}
            style={{ width: "min(64vw, 360px)", height: "min(64vw, 360px)", left: "34%", top: "52%" }}
            animate={
              reduceMotion
                ? { opacity: 0.35 }
                : { x: [0, 18, -26, 0], y: [0, -16, 20, 0], opacity: [0.28, 0.48, 0.32, 0.28] }
            }
            transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          />

          <div className={styles.vignette} aria-hidden="true" />
          <div className={`pointer-events-none absolute inset-0 ${styles.filmGrain}`} aria-hidden="true" />

          {!reduceMotion ? (
            <motion.div
              className={styles.burstCore}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 2.8, 5.5], opacity: [0, 0.85, 0] }}
              transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
            />
          ) : null}

          {!reduceMotion
            ? LIGHT_RAYS.map((ray) => (
                <motion.div
                  key={ray.id}
                  className={styles.lightRay}
                  style={{ rotate: `${ray.rotate}deg` }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: [0, 1, 0.65], opacity: [0, 0.55, 0.12] }}
                  transition={{
                    duration: 1.35,
                    delay: 0.08 + ray.delay,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                />
              ))
            : null}

          {particles.map((particle) => (
            <motion.span
              key={particle.id}
              className={styles.particle}
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                width: particle.size,
                height: particle.size
              }}
              initial={{ opacity: 0, scale: 0.2 }}
              animate={{
                opacity: reduceMotion ? 0 : [0, particle.opacity, 0],
                scale: reduceMotion ? 0 : [0.2, 1.1, 0.15],
                x: reduceMotion ? 0 : [0, particle.driftX],
                y: reduceMotion ? 0 : [0, particle.driftY]
              }}
              transition={{
                duration: particle.duration,
                delay: 0.2 + particle.delay,
                repeat: reduceMotion ? 0 : Infinity,
                repeatDelay: 0.28,
                ease: "easeOut"
              }}
            />
          ))}

          <div className="relative flex flex-col items-center px-6 text-center" style={{ perspective: 900 }}>
            <motion.div
              className="relative"
              style={{ width: 132, height: 132 }}
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.15, rotateY: -88, rotateX: 18, z: -120, filter: "blur(18px)" }
              }
              animate={
                reduceMotion
                  ? { opacity: 1 }
                  : {
                      opacity: 1,
                      scale: 1,
                      rotateY: 0,
                      rotateX: 0,
                      z: 0,
                      filter: "blur(0px)",
                      y: [0, -5, 0]
                    }
              }
              transition={
                reduceMotion
                  ? { duration: 0.28 }
                  : {
                      opacity: { duration: 0.35 },
                      scale: snapSpring,
                      rotateY: snapSpring,
                      rotateX: snapSpring,
                      z: snapSpring,
                      filter: { duration: 0.55, ease: fadeEase },
                      y: { duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 1.1 }
                    }
              }
            >
              {!reduceMotion ? (
                <motion.div
                  className={styles.halo}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{
                    scale: [0.4, 1.15, 1],
                    opacity: [0, 0.85, 0.55]
                  }}
                  transition={{ duration: 1.1, delay: 0.12, ease: fadeEase }}
                />
              ) : null}

              {!reduceMotion
                ? sparks.map((spark) => {
                    const rad = (spark.angle * Math.PI) / 180;
                    const x = Math.cos(rad) * spark.radius;
                    const y = Math.sin(rad) * spark.radius;
                    return (
                      <motion.span
                        key={spark.id}
                        className={styles.spark}
                        style={{ width: spark.size, height: spark.size, marginLeft: -spark.size / 2, marginTop: -spark.size / 2 }}
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                        animate={{
                          x: [0, x * 0.35, x],
                          y: [0, y * 0.35, y],
                          opacity: [0, 1, 0.35],
                          scale: [0, 1.2, 0.7]
                        }}
                        transition={{
                          duration: 1.05,
                          delay: spark.delay,
                          ease: [0.22, 1, 0.36, 1]
                        }}
                      />
                    );
                  })
                : null}

              <motion.div
                className={`${styles.logoFrame} relative h-full w-full`}
                initial={reduceMotion ? undefined : { scale: 0.92, filter: "brightness(0.7)" }}
                animate={reduceMotion ? undefined : { scale: 1, filter: "brightness(1)" }}
                transition={{ duration: 0.85, delay: 0.2, ...snapSpring }}
              >
                <Image
                  src="/icons/icon-512.png"
                  alt={`${PWA_SHORT_NAME} logo`}
                  width={132}
                  height={132}
                  className="h-full w-full object-cover"
                  priority
                />
                {!reduceMotion ? (
                  <motion.div
                    className={styles.logoSweep}
                    initial={{ x: "-130%", opacity: 0 }}
                    animate={{ x: ["-130%", "130%"], opacity: [0, 1, 0] }}
                    transition={{ duration: 0.95, delay: 0.72, ease: fadeEase }}
                  />
                ) : null}
              </motion.div>
            </motion.div>

            <motion.div
              className="mt-9 overflow-hidden"
              variants={titleContainer}
              initial="hidden"
              animate="show"
            >
              <p className="font-display text-4xl text-[color:var(--text-primary)] sm:text-5xl" aria-label={PWA_SHORT_NAME}>
                {titleChars.map((char, index) => (
                  <motion.span
                    key={`${char}-${index}`}
                    className={styles.titleChar}
                    variants={reduceMotion ? undefined : titleChar}
                    initial={reduceMotion ? { opacity: 0 } : undefined}
                    animate={reduceMotion ? { opacity: 1 } : undefined}
                    transition={reduceMotion ? { delay: 0.12, duration: 0.25 } : undefined}
                  >
                    {char}
                  </motion.span>
                ))}
              </p>
            </motion.div>

            <motion.p
              className={`${styles.tagline} mt-3 text-sm uppercase text-[color:var(--text-muted)]`}
              initial={{ opacity: 0, y: 14, letterSpacing: "0.48em", filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "0.32em", filter: "blur(0px)" }}
              transition={{
                delay: reduceMotion ? 0.18 : 1.05,
                duration: reduceMotion ? 0.28 : 0.75,
                ease: fadeEase
              }}
            >
              Survey Platform
            </motion.p>

            {!reduceMotion ? (
              <motion.div
                className="mt-8 h-px w-24 origin-center bg-gradient-to-r from-transparent via-[rgba(16,185,129,0.75)] to-transparent"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: [0, 1, 0.55] }}
                transition={{ delay: 1.2, duration: 0.85, ease: fadeEase }}
              />
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
