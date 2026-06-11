import {
  BROWSER_CONTINUE_KEY,
  INSTALL_DISMISS_DAYS,
  INSTALL_DISMISS_KEY,
  INSTALL_INSTALLED_KEY,
  INSTALL_SESSION_SEEN_KEY
} from "@/lib/pwa/config";

export function isStandaloneDisplayMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isInstallDismissed() {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(INSTALL_DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (Number.isNaN(dismissedAt)) return false;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Date.now() - dismissedAt < INSTALL_DISMISS_DAYS * msPerDay;
}

export function markInstallDismissed() {
  localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
  sessionStorage.setItem(INSTALL_SESSION_SEEN_KEY, "1");
}

export function isInstallSeenThisSession() {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(INSTALL_SESSION_SEEN_KEY) === "1";
}

export function markInstallSeenThisSession() {
  sessionStorage.setItem(INSTALL_SESSION_SEEN_KEY, "1");
}

export function isPwaMarkedInstalled() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(INSTALL_INSTALLED_KEY) === "1";
}

export function markPwaInstalled() {
  localStorage.setItem(INSTALL_INSTALLED_KEY, "1");
  sessionStorage.removeItem(INSTALL_SESSION_SEEN_KEY);
}

export function isBrowserContinueDismissed() {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(BROWSER_CONTINUE_KEY) === "1";
}

export function markBrowserContinueDismissed() {
  sessionStorage.setItem(BROWSER_CONTINUE_KEY, "1");
}

export async function detectInstalledRelatedApp() {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & {
    getInstalledRelatedApps?: () => Promise<Array<{ platform?: string; url?: string }>>;
  };
  if (!nav.getInstalledRelatedApps) {
    return isPwaMarkedInstalled();
  }
  try {
    const related = await nav.getInstalledRelatedApps();
    return related.length > 0 || isPwaMarkedInstalled();
  } catch {
    return isPwaMarkedInstalled();
  }
}

export function shouldSuppressInstallPrompt() {
  return isStandaloneDisplayMode() || isPwaMarkedInstalled() || isInstallDismissed() || isInstallSeenThisSession();
}
