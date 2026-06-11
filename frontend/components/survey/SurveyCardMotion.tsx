"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePwaLaunchGate } from "@/lib/pwa/PwaLaunchGateContext";
import type { ReactNode } from "react";
import styles from "./SurveyCard.module.css";

const popSpring = {
  type: "spring" as const,
  stiffness: 380,
  damping: 22,
  mass: 0.85
};

type SurveyCardMotionProps = {
  children: ReactNode;
  index?: number;
};

export function SurveyCardMotion({ children, index = 0 }: SurveyCardMotionProps) {
  const reduceMotion = useReducedMotion();
  const { deferMotion } = usePwaLaunchGate();

  if (reduceMotion || deferMotion) {
    return <div className={styles.cardWrap}>{children}</div>;
  }

  return (
    <motion.div
      className={styles.cardWrap}
      style={{ transformOrigin: "center center" }}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{
        scale: 1.07,
        y: -14,
        zIndex: 30,
        transition: popSpring
      }}
      whileTap={{ scale: 1.03, y: -6, transition: { duration: 0.12 } }}
      transition={{
        opacity: { duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 },
        y: { ...popSpring, delay: index * 0.06 },
        scale: popSpring
      }}
    >
      {children}
    </motion.div>
  );
}
