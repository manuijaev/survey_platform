"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OpenInAppPrompt } from "@/components/pwa/OpenInAppPrompt";
import { PwaLaunchSplash } from "@/components/pwa/PwaLaunchSplash";
import { PWA_APP_REVEAL_MS } from "@/lib/pwa/config";
import {
  PwaLaunchGateProvider,
  type PwaLaunchPhase
} from "@/lib/pwa/PwaLaunchGateContext";
import {
  isStandaloneDisplayMode,
  markPwaInstalled,
  markPwaSplashSeenThisSession,
  shouldShowPwaLaunchSplash
} from "@/lib/pwa/pwaStorage";
import { UpdateBanner } from "@/components/pwa/UpdateBanner";
import { activateWaitingWorker, registerServiceWorker } from "@/lib/pwa/registerServiceWorker";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PwaProviderProps = {
  children: ReactNode;
};

function isSplashGateActive() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("pwa-splash-active");
}

export function PwaProvider({ children }: PwaProviderProps) {
  const [updateReady, setUpdateReady] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [phase, setPhase] = useState<PwaLaunchPhase>("boot");
  const [showLaunchSplash, setShowLaunchSplash] = useState(false);

  useLayoutEffect(() => {
    if (!isStandaloneDisplayMode()) {
      document.documentElement.classList.remove("pwa-splash-active", "pwa-app-reveal");
      document.body.style.overflow = "";
      document.body.style.background = "";
      setPhase("idle");
      setShowLaunchSplash(false);
      return;
    }

    markPwaInstalled();
    document.documentElement.classList.add("pwa-standalone");

    if (shouldShowPwaLaunchSplash()) {
      document.documentElement.classList.add("pwa-splash-active");
      document.body.style.overflow = "hidden";
      document.body.style.background = "#030605";
      setPhase("splash");
      setShowLaunchSplash(true);
      return;
    }

    document.documentElement.classList.remove("pwa-splash-active", "pwa-app-reveal");
    document.body.style.overflow = "";
    document.body.style.background = "";
    setPhase("idle");
    setShowLaunchSplash(false);
  }, []);

  const completeLaunchSplash = useCallback(() => {
    markPwaSplashSeenThisSession();
    setShowLaunchSplash(false);
    document.documentElement.classList.remove("pwa-splash-active");
    document.documentElement.classList.add("pwa-app-reveal");
    document.body.style.overflow = "";
    setPhase("reveal");

    window.setTimeout(() => {
      document.documentElement.classList.remove("pwa-app-reveal");
      document.body.style.background = "";
      setPhase("ready");
    }, PWA_APP_REVEAL_MS);
  }, []);

  useEffect(() => {
    if (phase !== "splash" || !showLaunchSplash) {
      return;
    }

    document.body.style.overflow = "hidden";
  }, [phase, showLaunchSplash]);

  useEffect(() => {
    const shouldRegister =
      process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_PWA === "true";

    if (!shouldRegister || !("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;

    const setup = async () => {
      const result = await registerServiceWorker();
      if (!result || cancelled) {
        return;
      }

      setRegistration(result.registration);

      if (result.waitingWorker) {
        setUpdateReady(true);
      }

      result.registration.addEventListener("updatefound", () => {
        const installing = result.registration.installing;
        if (!installing) {
          return;
        }

        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateReady(true);
          }
        });
      });
    };

    void setup();

    const onControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const reloadForUpdate = () => {
    if (registration) {
      activateWaitingWorker(registration);
      return;
    }

    window.location.reload();
  };

  const deferMotion = phase === "boot" || phase === "splash" || phase === "reveal";
  const appHidden = phase === "boot" ? isSplashGateActive() : phase === "splash";
  const chromeReady = phase === "idle" || phase === "ready";

  const gateValue = useMemo(
    () => ({
      phase,
      deferMotion
    }),
    [deferMotion, phase]
  );

  return (
    <PwaLaunchGateProvider value={gateValue}>
      <div
        id="pwa-app-root"
        className={cn(
          appHidden && "pwa-app--hidden",
          phase === "reveal" && "pwa-app--reveal",
          phase === "ready" && "pwa-app--ready",
          phase === "idle" && "pwa-app--ready"
        )}
        aria-hidden={appHidden}
      >
        {children}
      </div>
      {showLaunchSplash ? <PwaLaunchSplash onComplete={completeLaunchSplash} /> : null}
      {chromeReady ? <OpenInAppPrompt /> : null}
      {chromeReady ? <InstallPrompt /> : null}
      {updateReady && chromeReady ? <UpdateBanner onReload={reloadForUpdate} /> : null}
    </PwaLaunchGateProvider>
  );
}
