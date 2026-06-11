export function isIosDevice() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isAppleMobile = /iPad|iPhone|iPod/i.test(ua);
  const isIpadOs =
    window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
  return isAppleMobile || isIpadOs;
}

export function isAndroidDevice() {
  if (typeof window === "undefined") return false;
  return /Android/i.test(window.navigator.userAgent);
}

export function isMobileDevice() {
  if (typeof window === "undefined") return false;
  return isIosDevice() || isAndroidDevice() || window.matchMedia("(max-width: 768px)").matches;
}

export function isInAppBrowser() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /fbav|fban|instagram|line\/|twitter|linkedinapp|gsa\/|wv\)/i.test(ua);
}

export type InstallPromptMode = "hidden" | "native" | "ios" | "android" | "in-app-browser";

export function resolveMobileInstallMode(hasNativePrompt: boolean): InstallPromptMode {
  if (hasNativePrompt) return "native";
  if (isInAppBrowser()) return "in-app-browser";
  if (isIosDevice()) return "ios";
  if (isAndroidDevice()) return "android";
  return "hidden";
}
