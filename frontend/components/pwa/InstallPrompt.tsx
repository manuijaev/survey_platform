"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Download, ExternalLink, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { InstallRitual, type InstallRitualOrigin } from "@/components/pwa/InstallRitual";
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
const cardSpring = { type: "spring" as const, stiffness: 420, damping: 30, mass: 0.82 };

export function InstallPrompt() {
  const pathname = usePathname();
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<InstallPromptMode>("hidden");
  const [ritualOpen, setRitualOpen] = useState(false);
  const [ritualOrigin, setRitualOrigin] = useState<InstallRitualOrigin>({ x: 0, y: 0 });
  const reduceMotion = useReducedMotion();
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
      setRitualOpen(false);
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
    setRitualOpen(false);
    deferredRef.current = null;
  };

  const resolveOrigin = (target?: HTMLElement | null): InstallRitualOrigin => {
    const rect = target?.getBoundingClientRect();
    if (rect) {
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return { x: window.innerWidth / 2, y: window.innerHeight - 96 };
  };

  const beginRitual = (target?: HTMLElement | null) => {
    setRitualOrigin(resolveOrigin(target));
    setRitualOpen(true);
  };

  const closeRitual = () => {
    setRitualOpen(false);
  };

  useEffect(() => {
    if (!ritualOpen) {
      document.body.style.overflow = "";
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [ritualOpen]);

  const runNativeInstall = async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    const deferredPrompt = deferredRef.current;
    if (!deferredPrompt) return "unavailable";

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredRef.current = null;

    if (choice.outcome === "accepted") {
      markPwaInstalled();
      setMode("hidden");
      return "accepted";
    }

    markInstallDismissed();
    setMode("hidden");
    return "dismissed";
  };

  const handlePrimaryAction = (event: React.MouseEvent<HTMLButtonElement>) => {
    beginRitual(event.currentTarget);
  };

  const copy = getPromptCopy(mode);
  const primaryLabel =
    mode === "native"
      ? "Install app"
      : mode === "in-app-browser"
        ? "Open in browser"
        : "Begin install";

  return (
    <>
      <AnimatePresence>
        {!ritualOpen ? (
          <motion.div
            key="install-banner"
            className="fixed bottom-4 left-4 right-4 z-[70] mx-auto max-w-lg sm:left-auto sm:right-6"
            initial={reduceMotion ? false : { opacity: 0, y: 36, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={cardSpring}
          >
            <div className="overflow-hidden rounded-2xl border border-[color:var(--border-active)] bg-[color:var(--glass-bg)] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <motion.div
                className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[rgba(13,148,136,0.16)] blur-2xl"
                animate={reduceMotion ? undefined : { scale: [1, 1.15, 1], opacity: [0.45, 0.75, 0.45] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative flex items-start gap-3">
                <motion.span
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] text-[color:var(--primary)]"
                  animate={reduceMotion ? undefined : { rotate: [0, -4, 4, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  {mode === "ios" ? <ExternalLink className="h-5 w-5" /> : <Download className="h-5 w-5" />}
                </motion.span>

                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg text-[color:var(--text-primary)]">{copy.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">{copy.description}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <motion.button
                      type="button"
                      onClick={
                        mode === "in-app-browser"
                          ? () => window.open(window.location.href, "_blank", "noopener,noreferrer")
                          : handlePrimaryAction
                      }
                      className="focus-ring group relative overflow-hidden rounded-full border border-[color:var(--border-active)] bg-[rgba(13,148,136,0.18)] px-4 py-2 text-sm font-medium text-[color:var(--text-primary)]"
                      whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                      whileHover={reduceMotion ? undefined : { scale: 1.03 }}
                    >
                      <motion.span
                        className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.22),transparent)]"
                        initial={{ x: "-120%" }}
                        whileHover={{ x: "120%" }}
                        transition={{ duration: 0.65, ease: "easeOut" }}
                      />
                      <span className="relative inline-flex items-center gap-2">
                        {mode === "in-app-browser" ? (
                          <ExternalLink className="h-4 w-4" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {primaryLabel}
                      </span>
                    </motion.button>

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
          </motion.div>
        ) : null}
      </AnimatePresence>

      <InstallRitual
        open={ritualOpen}
        origin={ritualOrigin}
        mode={mode}
        copy={copy}
        onClose={closeRitual}
        onNativeInstall={mode === "native" ? runNativeInstall : undefined}
      />
    </>
  );
}

function getPromptCopy(mode: InstallPromptMode) {
  if (mode === "ios") {
    return {
      title: `Add ${PWA_SHORT_NAME} to your home screen`,
      description: "Watch the icon land on your home screen, then follow the quick steps below.",
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
      description: "Your app icon is ready to dock on your home screen.",
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
    description: "Launch the install sequence and pin the survey platform to your home screen.",
    steps: undefined
  };
}
