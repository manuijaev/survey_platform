"use client";

import { ExternalLink, Waves, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PWA_SHORT_NAME, PWA_START_URL } from "@/lib/pwa/config";
import {
  detectInstalledRelatedApp,
  isBrowserContinueDismissed,
  isStandaloneDisplayMode,
  markBrowserContinueDismissed
} from "@/lib/pwa/pwaStorage";

export function OpenInAppPrompt() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [appUrl, setAppUrl] = useState(PWA_START_URL);
  const isRespondFlow = /\/respond\/?$/.test(pathname);

  useEffect(() => {
    if (isRespondFlow || isStandaloneDisplayMode() || isBrowserContinueDismissed()) {
      setVisible(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
      const installed = await detectInstalledRelatedApp();
      if (!cancelled && installed) {
        setAppUrl(`${window.location.origin}${pathname === "/" ? PWA_START_URL : pathname}`);
        setVisible(true);
      }
    };

    void check();

    return () => {
      cancelled = true;
    };
  }, [isRespondFlow, pathname]);

  if (!visible) {
    return null;
  }

  const continueInBrowser = () => {
    markBrowserContinueDismissed();
    setVisible(false);
  };

  const openInApp = () => {
    markBrowserContinueDismissed();
    window.location.assign(appUrl);
  };

  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-[color:var(--border-active)] bg-[rgba(6,10,9,0.94)] px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] text-[color:var(--primary)]">
            <Waves className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[color:var(--text-primary)]">
              {PWA_SHORT_NAME} is installed on this device
            </p>
            <p className="mt-0.5 text-xs leading-5 text-[color:var(--text-secondary)]">
              Open the installed app for the best experience, or keep browsing here.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <button
            type="button"
            onClick={openInApp}
            className="focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[color:var(--border-active)] bg-[rgba(13,148,136,0.18)] px-3 py-1.5 text-xs font-medium text-[color:var(--text-primary)] transition hover:bg-[rgba(13,148,136,0.28)] sm:text-sm sm:px-4 sm:py-2"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open app
          </button>
          <button
            type="button"
            onClick={continueInBrowser}
            className="focus-ring rounded-full border border-[color:var(--border)] px-3 py-1.5 text-xs text-[color:var(--text-secondary)] transition hover:text-[color:var(--text-primary)] sm:px-4 sm:py-2 sm:text-sm"
          >
            Continue in browser
          </button>
          <button
            type="button"
            onClick={continueInBrowser}
            aria-label="Dismiss open in app prompt"
            className="focus-ring rounded-full p-1 text-[color:var(--text-muted)] transition hover:text-[color:var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
