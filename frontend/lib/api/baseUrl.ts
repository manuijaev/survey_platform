/**
 * Browser calls go through the same-origin proxy so production works without CORS
 * or a public API URL. Server-side code can still talk to the backend directly.
 */
export function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    return "/api/proxy";
  }

  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8080"
  ).replace(/\/$/, "");
}

export function isApiMisconfigured() {
  if (typeof window === "undefined") return false;
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configured) return false;
  return (
    window.location.protocol === "https:" &&
    configured.startsWith("http://") &&
    !configured.includes("localhost")
  );
}
