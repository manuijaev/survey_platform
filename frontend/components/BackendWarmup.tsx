"use client";

import { useEffect } from "react";

/**
 * Pings the survey API as soon as the app mounts so a cold Render backend
 * starts waking before the user navigates to data-heavy pages.
 */
export function BackendWarmup() {
  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/proxy/api/surveys", {
      method: "GET",
      headers: { Accept: "application/xml" },
      cache: "no-store",
      signal: controller.signal
    }).catch(() => undefined);

    return () => controller.abort();
  }, []);

  return null;
}
