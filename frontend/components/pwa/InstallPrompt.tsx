"use client";

import { Download, Share, Smartphone, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PWA_SHORT_NAME } from "@/lib/pwa/config";
import { isMobileDevice, resolveMobileInstallMode, type InstallPromptMode } from "@/lib/pwa/platform";
import {
  markInstallDismissed,
  markPwaInstalled,
  shouldSuppressInstallPrompt
} from "@/lib/pwa/pwaStorage";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const MOBILE_FALLBACK_DELAY_MS = 2500;

export function InstallPrompt() {
  const pathname = usePathname();
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<InstallPromptMode>("hidden");
  const isRespondFlow = /\/respond\/?$/.test(pathname);

  useEffect(() => {
    if (isRespondFlow || shouldSuppressInstallPrompt()) {
      setMode("hidden");
      deferredRef.current = null;
      return;
    }

    const onBeforeInstall = (event: Event) => {
      if (shouldSuppressInstallPrompt()) return;
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      deferredRef.current = promptEvent;
      setMode("native");
    };

    const onInstalled = () => {
      markPwaInstalled();
      setMode("hidden");
      deferredRef.current = null;
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    const fallbackTimer = window.setTimeout(() => {
      if (shouldSuppressInstallPrompt()) return;
      setMode((current) => {
        if (current === "native") return current;
        const next = resolveMobileInstallMode(Boolean(deferredRef.current));
        return next === "hidden" ? current : next;
      });
    }, isMobileDevice() ? MOBILE_FALLBACK_DELAY_MS : 0);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [isRespondFlow, pathname]);

  if (isRespondFlow || mode === "hidden") {
    return null;
  }

  const dismiss = () => {
    markInstallDismissed();
    setMode("hidden");
    deferredRef.current = null;
  };

  const install = async () => {
    const deferredPrompt = deferredRef.current;
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      markPwaInstalled();
      setMode("hidden");
    } else {
      markInstallDismissed();
    }
    deferredRef.current = null;
  };

  const copy = getPromptCopy(mode);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[70] mx-auto max-w-lg rounded-2xl border border-[color:var(--border-active)] bg-[color:var(--glass-bg)] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:left-auto sm:right-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] text-[color:var(--primary)]">
          {mode === "ios" ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg text-[color:var(--text-primary)]">{copy.title}</p>
          <p className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">{copy.description}</p>
          {copy.steps ? (
            <ol className="mt-3 space-y-2 text-sm leading-6 text-[color:var(--text-primary)]">
              {copy.steps.map((step, index) => (
                <li key={step} className="flex gap-2">
                  <span className="font-mono text-[color:var(--primary)]">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {mode === "native" ? (
              <button
                type="button"
                onClick={install}
                className="focus-ring rounded-full border border-[color:var(--border-active)] bg-[rgba(13,148,136,0.18)] px-4 py-2 text-sm text-[color:var(--text-primary)] transition hover:bg-[rgba(13,148,136,0.28)]"
              >
                Install app
              </button>
            ) : mode === "in-app-browser" ? (
              <button
                type="button"
                onClick={() => {
                  window.open(window.location.href, "_blank", "noopener,noreferrer");
                }}
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-[color:var(--border-active)] bg-[rgba(13,148,136,0.18)] px-4 py-2 text-sm text-[color:var(--text-primary)] transition hover:bg-[rgba(13,148,136,0.28)]"
              >
                <Smartphone className="h-4 w-4" />
                Open in browser
              </button>
            ) : null}
            <button
              type="button"
              onClick={dismiss}
              className="focus-ring rounded-full border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--text-secondary)] transition hover:text-[color:var(--text-primary)]"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="focus-ring rounded-full p-1 text-[color:var(--text-muted)] transition hover:text-[color:var(--text-primary)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function getPromptCopy(mode: InstallPromptMode) {
  if (mode === "ios") {
    return {
      title: `Add ${PWA_SHORT_NAME} to your home screen`,
      description: "Install the survey app on iPhone or iPad for faster access and a full-screen experience.",
      steps: [
        "Tap the Share button at the bottom of Safari.",
        'Scroll down and tap "Add to Home Screen".',
        'Tap "Add" in the top-right corner.'
      ]
    };
  }

  if (mode === "android") {
    return {
      title: `Install ${PWA_SHORT_NAME}`,
      description: "Add the survey platform to your home screen from Chrome.",
      steps: [
        "Tap the menu button (three dots) in the top-right of Chrome.",
        'Choose "Install app" or "Add to Home screen".',
        "Confirm the install prompt when it appears."
      ]
    };
  }

  if (mode === "in-app-browser") {
    return {
      title: "Open in Safari or Chrome to install",
      description:
        "In-app browsers cannot install PWAs. Open this page in your main browser first, then add the app to your home screen.",
      steps: undefined
    };
  }

  return {
    title: `Install ${PWA_SHORT_NAME}`,
    description: "Add the survey platform to your home screen for faster access and an app-like experience.",
    steps: undefined
  };
}
