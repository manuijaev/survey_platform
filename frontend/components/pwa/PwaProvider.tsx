"use client";

import { useCallback, useEffect, useState } from "react";
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

export function PwaProvider({ children }: PwaProviderProps) {
  const [updateReady, setUpdateReady] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [showLaunchSplash, setShowLaunchSplash] = useState(false);

  useEffect(() => {
    if (!isStandaloneDisplayMode()) return;
    markPwaInstalled();
    setShowLaunchSplash(shouldShowPwaLaunchSplash());
    document.documentElement.classList.add("pwa-standalone");
    return () => {
      document.documentElement.classList.remove("pwa-standalone");
    };
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

  const completeLaunchSplash = useCallback(() => {
    markPwaSplashSeenThisSession();
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

  return (
    <>
      {children}
      {showLaunchSplash ? <PwaLaunchSplash onComplete={completeLaunchSplash} /> : null}
      <OpenInAppPrompt />
      <InstallPrompt />
      {updateReady ? <UpdateBanner onReload={reloadForUpdate} /> : null}
    </>
  );
}
