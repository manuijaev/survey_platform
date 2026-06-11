import { PWA_SPLASH_SEEN_KEY } from "@/lib/pwa/config";

/** Runs synchronously before React hydrates to prevent dashboard flash in standalone PWA. */
export const PWA_SPLASH_GATE_SCRIPT = `(function(){try{var standalone=window.matchMedia("(display-mode: standalone)").matches||window.matchMedia("(display-mode: fullscreen)").matches||window.navigator.standalone===true;if(!standalone)return;if(sessionStorage.getItem("${PWA_SPLASH_SEEN_KEY}")!=="1"){document.documentElement.classList.add("pwa-splash-active","pwa-standalone");}}catch(e){}})();`;
