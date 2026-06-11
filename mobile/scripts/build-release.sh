#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TWA_DIR="$ROOT/twa"
RELEASE_DIR="$ROOT/releases"

echo "==> SkyWorld Bubblewrap release build"
echo "    TWA directory: $TWA_DIR"

command -v bubblewrap >/dev/null 2>&1 || {
  echo "ERROR: bubblewrap not found. Run: npm install -g @bubblewrap/cli"
  exit 1
}

if [[ -z "${ANDROID_HOME:-}" ]]; then
  echo "ERROR: ANDROID_HOME is not set. See mobile/BUBBLEWRAP_SETUP.md Phase 1.4"
  exit 1
fi

if [[ ! -f "$TWA_DIR/twa-manifest.json" ]]; then
  echo "ERROR: missing $TWA_DIR/twa-manifest.json"
  exit 1
fi

if [[ ! -f "$TWA_DIR/android.keystore" ]]; then
  echo "ERROR: missing $TWA_DIR/android.keystore"
  echo "       Create it first (see mobile/BUBBLEWRAP_SETUP.md Phase 3)"
  exit 1
fi

if [[ -z "${BUBBLEWRAP_KEYSTORE_PASSWORD:-}" ]]; then
  echo "ERROR: set BUBBLEWRAP_KEYSTORE_PASSWORD"
  exit 1
fi

cd "$TWA_DIR"

echo "==> Regenerating Android project from twa-manifest.json"
bubblewrap update

echo "==> Building signed release APK"
bubblewrap build

SIGNED_APK="$TWA_DIR/app/build/outputs/apk/release/app-release-signed.apk"
if [[ ! -f "$SIGNED_APK" ]]; then
  echo "ERROR: expected signed APK at $SIGNED_APK"
  exit 1
fi

mkdir -p "$RELEASE_DIR"
OUT="$RELEASE_DIR/skyworld-survey-v1.0.0.apk"
cp "$SIGNED_APK" "$OUT"

echo ""
echo "SUCCESS: $OUT"
echo ""
echo "Next steps:"
echo "  1. Install on Android: adb install \"$OUT\""
echo "  2. Add TWA_SHA256_FINGERPRINT to Vercel (see BUBBLEWRAP_SETUP.md Phase 6)"
echo "  3. Upload to GitHub Releases for submission"
