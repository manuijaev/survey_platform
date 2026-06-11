"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PWA_SHORT_NAME, PWA_SPLASH_DURATION_MS } from "@/lib/pwa/config";
import styles from "./PwaLaunchSplash.module.css";

const easeOut = [0.16, 1, 0.3, 1] as const;
const easeSmooth = [0.22, 1, 0.36, 1] as const;
const logoSpring = { type: "spring" as const, stiffness: 360, damping: 26, mass: 0.88 };
const softSpring = { type: "spring" as const, stiffness: 260, damping: 22, mass: 0.95 };

const TIMELINE = {
  burst: 0,
  rays: 0.06,
  halo: 0.14,
  logo: 0.18,
  sweep: 0.78,
  sparks: 0.42,
  title: 0.68,
  tagline: 1.02,
  accent: 1.18,
  float: 1.05
} as const;

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
};

const LIGHT_RAYS = Array.from({ length: 12 }, (_, id) => ({
  id,
  rotate: (360 / 12) * id,
  delay: id * 0.025
}));

function buildParticles(count: number): ParticleSpec[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: 6 + ((id * 41) % 88),
    top: 10 + ((id * 59) % 80),
    size: 1.5 + (id % 5) * 0.65,
    delay: (id % 14) * 0.05,
    duration: 2 + (id % 7) * 0.26,
    driftX: ((id % 7) - 3) * 20,
    driftY: -52 - (id % 9) * 16,
    opacity: 0.24 + (id % 6) * 0.09
  }));
}

function buildSparks(count: number): SparkSpec[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    angle: (360 / count) * id + 18,
    radius: 68 + (id % 4) * 10,
    size: 2.5 + (id % 2) * 0.5
  }));
}

const titleContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.048, delayChildren: TIMELINE.title }
  }
};

const titleChar = {
  hidden: { opacity: 0, y: 22, rotateX: -58, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: "blur(0px)",
    transition: softSpring
  }
};

type PwaLaunchSplashProps = {
  onHandoff: () => void;
  onComplete: () => void;
};

export function PwaLaunchSplash({ onHandoff, onComplete }: PwaLaunchSplashProps) {
  const reduceMotion = useReducedMotion();
  const [mounted] = useState(() => typeof document !== "undefined");
  const [visible, setVisible] = useState(true);
  const handoffRef = useRef(onHandoff);
  const completeRef = useRef(onComplete);
  const particles = useMemo(() => buildParticles(40), []);
  const sparks = useMemo(() => buildSparks(8), []);
  const titleChars = useMemo(() => PWA_SHORT_NAME.split(""), []);

  useEffect(() => {
    handoffRef.current = onHandoff;
    completeRef.current = onComplete;
  }, [onComplete, onHandoff]);

  useEffect(() => {
    const totalMs = reduceMotion ? 520 : PWA_SPLASH_DURATION_MS;
    const fadeOutMs = reduceMotion ? 180 : 620;
    const handoffMs = totalMs - fadeOutMs;

    const handoffTimer = window.setTimeout(() => {
      handoffRef.current();
      setVisible(false);
    }, handoffMs);

    return () => {
      window.clearTimeout(handoffTimer);
    };
  }, [reduceMotion]);

  if (!mounted) {
    return null;
  }

  const content = (
    <AnimatePresence onExitComplete={() => completeRef.current()}>
      {visible ? (
        <motion.div
          key="pwa-launch-splash"
          className={`safe-top safe-bottom fixed inset-0 z-[200] flex items-center justify-center overflow-hidden ${styles.root}`}
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.02,
            filter: "blur(10px)",
            transition: { duration: reduceMotion ? 0.2 : 0.68, ease: easeSmooth }
          }}
        >
          <motion.div
            className={`${styles.auroraLayer} ${styles.auroraTeal}`}
            style={{ width: "min(92vw, 520px)", height: "min(92vw, 520px)", left: "8%", top: "18%" }}
            animate={
              reduceMotion
                ? { opacity: 0.48 }
                : { x: [0, 28, -14, 0], y: [0, -22, 10, 0], scale: [1, 1.08, 0.98, 1], opacity: [0.4, 0.58, 0.46, 0.4] }
            }
            transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className={`${styles.auroraLayer} ${styles.auroraMint}`}
            style={{ width: "min(78vw, 440px)", height: "min(78vw, 440px)", right: "4%", bottom: "12%" }}
            animate={
              reduceMotion
                ? { opacity: 0.38 }
                : { x: [0, -34, 18, 0], y: [0, 18, -14, 0], scale: [1, 0.94, 1.06, 1], opacity: [0.32, 0.5, 0.38, 0.32] }
            }
            transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut", delay: 0.35 }}
          />
          <motion.div
            className={`${styles.auroraLayer} ${styles.auroraDeep}`}
            style={{ width: "min(64vw, 360px)", height: "min(64vw, 360px)", left: "34%", top: "52%" }}
            animate={
              reduceMotion
                ? { opacity: 0.32 }
                : { x: [0, 14, -20, 0], y: [0, -12, 16, 0], opacity: [0.26, 0.42, 0.3, 0.26] }
            }
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
          />

          <div className={styles.vignette} aria-hidden="true" />
          <div className={`pointer-events-none absolute inset-0 ${styles.filmGrain}`} aria-hidden="true" />

          {!reduceMotion ? (
            <motion.div
              className={styles.burstCore}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 2.4, 4.8], opacity: [0, 0.75, 0] }}
              transition={{ duration: 0.95, delay: TIMELINE.burst, ease: easeOut }}
            />
          ) : null}

          {!reduceMotion
            ? LIGHT_RAYS.map((ray) => (
                <motion.div
                  key={ray.id}
                  className={styles.lightRay}
                  style={{ rotate: `${ray.rotate}deg` }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: [0, 1, 0.5], opacity: [0, 0.48, 0.08] }}
                  transition={{
                    duration: 1.2,
                    delay: TIMELINE.rays + ray.delay,
                    ease: easeOut
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
                scale: reduceMotion ? 0 : [0.2, 1, 0.2],
                x: reduceMotion ? 0 : [0, particle.driftX],
                y: reduceMotion ? 0 : [0, particle.driftY]
              }}
              transition={{
                duration: particle.duration,
                delay: TIMELINE.logo + particle.delay,
                repeat: reduceMotion ? 0 : Infinity,
                repeatDelay: 0.32,
                ease: "easeOut"
              }}
            />
          ))}

          <div className="relative flex flex-col items-center px-6 text-center" style={{ perspective: 900 }}>
            <motion.div
              className="relative"
              style={{ width: 136, height: 136 }}
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.2, rotateY: -72, rotateX: 14, z: -100, filter: "blur(16px)" }
              }
              animate={
                reduceMotion
                  ? { opacity: 1, scale: 1, rotateY: 0, rotateX: 0, z: 0, filter: "blur(0px)" }
                  : { opacity: 1, scale: 1, rotateY: 0, rotateX: 0, z: 0, filter: "blur(0px)" }
              }
              transition={
                reduceMotion
                  ? { duration: 0.28, delay: 0.08 }
                  : {
                      delay: TIMELINE.logo,
                      opacity: { duration: 0.4, ease: easeSmooth },
                      scale: logoSpring,
                      rotateY: logoSpring,
                      rotateX: logoSpring,
                      z: logoSpring,
                      filter: { duration: 0.6, ease: easeSmooth }
                    }
              }
            >
              {!reduceMotion ? (
                <motion.div
                  className={styles.halo}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{
                    scale: [0.5, 1.12, 1, 1.06, 1],
                    opacity: [0, 0.72, 0.48, 0.58, 0.48]
                  }}
                  transition={{
                    duration: 2.4,
                    delay: TIMELINE.halo,
                    times: [0, 0.35, 0.55, 0.78, 1],
                    ease: easeSmooth
                  }}
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
                        style={{
                          width: spark.size,
                          height: spark.size,
                          marginLeft: -spark.size / 2,
                          marginTop: -spark.size / 2
                        }}
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                        animate={{
                          x: [0, x * 0.5, x],
                          y: [0, y * 0.5, y],
                          opacity: [0, 0.9, 0.2],
                          scale: [0, 1, 0.5]
                        }}
                        transition={{
                          duration: 0.9,
                          delay: TIMELINE.sparks + spark.id * 0.04,
                          ease: easeSmooth
                        }}
                      />
                    );
                  })
                : null}

              <motion.div
                className={styles.logoCluster}
                animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
                transition={
                  reduceMotion
                    ? undefined
                    : {
                        duration: 3.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: TIMELINE.float
                      }
                }
              >
                <div className="relative h-full w-full">
                  <Image
                    src="/icons/icon-512.png"
                    alt={`${PWA_SHORT_NAME} logo`}
                    width={136}
                    height={136}
                    className={`${styles.logoImage} h-full w-full object-cover`}
                    priority
                  />
                  {!reduceMotion ? (
                    <motion.div
                      className={styles.logoSweep}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: TIMELINE.sweep, duration: 0.01 }}
                    >
                      <motion.div
                        className="absolute inset-[-50%_-80%]"
                        style={{
                          background:
                            "linear-gradient(115deg, transparent 38%, rgba(255,255,255,0.42) 50%, transparent 62%)"
                        }}
                        initial={{ x: "-130%" }}
                        animate={{ x: "130%" }}
                        transition={{ duration: 0.88, delay: TIMELINE.sweep, ease: easeSmooth }}
                      />
                    </motion.div>
                  ) : null}
                </div>
              </motion.div>
            </motion.div>

            <motion.div className="mt-9 overflow-hidden" variants={titleContainer} initial="hidden" animate="show">
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
              initial={{ opacity: 0, y: 12, letterSpacing: "0.44em", filter: "blur(5px)" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "0.32em", filter: "blur(0px)" }}
              transition={{
                delay: reduceMotion ? 0.18 : TIMELINE.tagline,
                duration: reduceMotion ? 0.28 : 0.7,
                ease: easeSmooth
              }}
            >
              Survey Platform
            </motion.p>

            {!reduceMotion ? (
              <motion.div
                className="mt-8 h-px w-24 origin-center bg-gradient-to-r from-transparent via-[rgba(16,185,129,0.7)] to-transparent"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: [0, 0.85, 0.5] }}
                transition={{ delay: TIMELINE.accent, duration: 0.8, ease: easeSmooth }}
              />
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
