import { SW_SCOPE, SW_URL } from "@/lib/pwa/config";

export type ServiceWorkerRegistrationResult = {
  registration: ServiceWorkerRegistration;
  waitingWorker: ServiceWorker | null;
};

export async function registerServiceWorker(): Promise<ServiceWorkerRegistrationResult | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  const registration = await navigator.serviceWorker.register(SW_URL, {
    scope: SW_SCOPE,
    updateViaCache: "none"
  });

  await registration.update().catch(() => undefined);

  return {
    registration,
    waitingWorker: registration.waiting
  };
}

export function activateWaitingWorker(registration: ServiceWorkerRegistration) {
  const waiting = registration.waiting;
  if (!waiting) {
    return;
  }

  waiting.postMessage({ type: "SKIP_WAITING" });
}
