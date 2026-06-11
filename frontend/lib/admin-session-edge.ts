/** Edge-compatible session helpers (middleware). Uses Web Crypto only. */

export const ADMIN_SESSION_COOKIE = "skyworld_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "dev-admin-session-secret-change-me";
}

async function importHmacKey() {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string) {
  const pairs = hex.match(/.{2}/g);
  if (!pairs) return null;
  return new Uint8Array(pairs.map((pair) => parseInt(pair, 16)));
}

export async function createAdminSessionToken() {
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE * 1000;
  const payload = `admin:${expiresAt}`;
  const key = await importHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${bytesToHex(signature)}`;
}

export async function verifyAdminSessionToken(token?: string | null) {
  if (!token) return false;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;

  const payload = token.slice(0, separator);
  const signatureHex = token.slice(separator + 1);
  if (!payload.startsWith("admin:")) return false;

  const expiresAt = Number(payload.split(":")[1]);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const signatureBytes = hexToBytes(signatureHex);
  if (!signatureBytes) return false;

  const key = await importHmacKey();
  return crypto.subtle.verify("HMAC", key, signatureBytes, new TextEncoder().encode(payload));
}
