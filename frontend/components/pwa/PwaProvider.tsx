"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OpenInAppPrompt } from "@/components/pwa/OpenInAppPrompt";
import { PwaLaunchSplash } from "@/components/pwa/PwaLaunchSplash";
import {
  isStandaloneDisplayMode,
  markPwaInstalled,
  markPwaSplashSeenThisSession,
  shouldShowPwaLaunchSplash
} from "@/lib/pwa/pwaStorage";
import { UpdateBanner } from "@/components/pwa/UpdateBanner";
import { activateWaitingWorker, registerServiceWorker } from "@/lib/pwa/registerServiceWorker";
import type { ReactNode } from "react";

type PwaProviderProps = {
  children: ReactNode;
};

type AppRevealPhase = "hidden" | "revealing" | "visible";

const APP_REVEAL_MS = 920;

export function PwaProvider({ children }: PwaProviderProps) {
  const [updateReady, setUpdateReady] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [showLaunchSplash, setShowLaunchSplash] = useState(false);
  const [appRevealPhase, setAppRevealPhase] = useState<AppRevealPhase>("visible");
  const [splashBootstrapped, setSplashBootstrapped] = useState(false);

  useLayoutEffect(() => {
    if (!isStandaloneDisplayMode()) {
      document.documentElement.classList.remove("pwa-splash-active", "pwa-app-reveal");
      setAppRevealPhase("visible");
      setSplashBootstrapped(true);
      return;
    }

    markPwaInstalled();
    document.documentElement.classList.add("pwa-standalone");

    if (shouldShowPwaLaunchSplash()) {
      setShowLaunchSplash(true);
      setAppRevealPhase("hidden");
      document.documentElement.classList.add("pwa-splash-active");
    } else {
      document.documentElement.classList.remove("pwa-splash-active", "pwa-app-reveal");
      setAppRevealPhase("visible");
    }

    setSplashBootstrapped(true);
  }, []);

  useEffect(() => {
    if (!showLaunchSplash) {
      document.body.style.overflow = "";
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [showLaunchSplash]);

  const beginAppReveal = useCallback(() => {
    markPwaSplashSeenThisSession();
    document.documentElement.classList.remove("pwa-splash-active");
    document.documentElement.classList.add("pwa-app-reveal");
    setAppRevealPhase("revealing");

    window.setTimeout(() => {
      document.documentElement.classList.remove("pwa-app-reveal");
      setAppRevealPhase("visible");
    }, APP_REVEAL_MS);
  }, []);

  const completeLaunchSplash = useCallback(() => {
    setShowLaunchSplash(false);
  }, []);

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

  const chromeReady = splashBootstrapped && !showLaunchSplash;

  return (
    <>
      <div
        id="pwa-app-root"
        aria-hidden={appRevealPhase === "hidden"}
        style={appRevealPhase === "hidden" ? { opacity: 0, visibility: "hidden" } : undefined}
      >
        {children}
      </div>
      {showLaunchSplash ? (
        <PwaLaunchSplash onHandoff={beginAppReveal} onComplete={completeLaunchSplash} />
      ) : null}
      {chromeReady ? <OpenInAppPrompt /> : null}
      {chromeReady ? <InstallPrompt /> : null}
      {updateReady ? <UpdateBanner onReload={reloadForUpdate} /> : null}
    </>
  );
}
