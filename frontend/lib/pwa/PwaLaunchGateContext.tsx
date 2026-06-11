"use client";

import { createContext, useContext } from "react";

export type PwaLaunchPhase = "boot" | "idle" | "splash" | "reveal" | "ready";

type PwaLaunchGateValue = {
  phase: PwaLaunchPhase;
  /** When true, page-level motion (cards, etc.) stays static for a calm launch handoff. */
  deferMotion: boolean;
};

const PwaLaunchGateContext = createContext<PwaLaunchGateValue>({
  phase: "idle",
  deferMotion: false
});

export function PwaLaunchGateProvider({
  value,
  children
}: {
  value: PwaLaunchGateValue;
  children: React.ReactNode;
}) {
  return <PwaLaunchGateContext.Provider value={value}>{children}</PwaLaunchGateContext.Provider>;
}

export function usePwaLaunchGate() {
  return useContext(PwaLaunchGateContext);
}
