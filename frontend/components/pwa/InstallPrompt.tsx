"use client";

import { Download, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  markInstallDismissed,
  markInstallSeenThisSession,
  markPwaInstalled,
  shouldSuppressInstallPrompt
} from "@/lib/pwa/pwaStorage";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const isRespondFlow = /\/respond\/?$/.test(pathname);

  useEffect(() => {
    if (isRespondFlow || shouldSuppressInstallPrompt()) {
      setAllowed(false);
      return;
    }

    setAllowed(true);

    const onBeforeInstall = (event: Event) => {
      if (shouldSuppressInstallPrompt()) return;
      event.preventDefault();
      markInstallSeenThisSession();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      markPwaInstalled();
      setVisible(false);
      setDeferredPrompt(null);
      setAllowed(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [isRespondFlow]);

  if (!allowed || isRespondFlow || !visible || !deferredPrompt) {
    return null;
  }

  const dismiss = () => {
    markInstallDismissed();
    setVisible(false);
    setDeferredPrompt(null);
    setAllowed(false);
  };

  const install = async () => {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      markPwaInstalled();
      setVisible(false);
      setAllowed(false);
    } else {
      markInstallDismissed();
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-lg rounded-2xl border border-[color:var(--border-active)] bg-[color:var(--glass-bg)] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:left-auto sm:right-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] text-[color:var(--primary)]">
          <Download className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg text-[color:var(--text-primary)]">Install SkyWorld</p>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
            Add the survey platform to your home screen for faster access and an app-like experience.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={install}
              className="focus-ring rounded-full border border-[color:var(--border-active)] bg-[rgba(13,148,136,0.18)] px-4 py-2 text-sm text-[color:var(--text-primary)] transition hover:bg-[rgba(13,148,136,0.28)]"
            >
              Install app
            </button>
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
