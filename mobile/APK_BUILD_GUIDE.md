# Build a real Android APK for SkyWorld Survey Platform

Your mobile app is a **PWA** hosted at:

**https://survey-platform-lemon-one.vercel.app**

An APK is a thin **Android wrapper** (Trusted Web Activity) that opens that URL in fullscreen, like a native app.

---

## Before you start

| Requirement | Why |
|-------------|-----|
| Live HTTPS site working on a phone | APK loads your Vercel URL |
| `API_URL` set on Vercel | Surveys must load inside the app |
| Chrome on Android for testing | TWA is Chrome-based |

Test in the browser first: open `/surveys` on your phone and complete one survey.

---

## Path A — PWABuilder (fastest, ~15 minutes)

Best for: **quick submission APK** without installing Android Studio.

### 1. Validate the PWA

1. Open [PWABuilder](https://www.pwabuilder.com/)
2. Enter: `https://survey-platform-lemon-one.vercel.app`
3. Click **Start**
4. Fix any **red** manifest/service worker issues (yellow is usually OK)

### 2. Generate the APK

1. Click **Package for stores**
2. Choose **Android**
3. Sign in with Microsoft/Google if prompted (or use **Generate** in browser)
4. Set:
   - **Package ID:** `com.skyworld.survey`
   - **App name:** `SkyWorld`
   - **Launcher name:** `SkyWorld`
5. Download the **APK** (or AAB for Play Store)

### 3. Install on your phone

1. Copy `app-release.apk` to the phone (USB, email, or Drive)
2. Open the file → allow **Install unknown apps** if asked
3. Launch **SkyWorld** → confirm surveys load and respond flow works

### 4. Publish for submission

Upload the APK to GitHub Releases on `simple-survey-mobile`:

```text
Tag: v1.0.0
Asset: skyworld-survey-v1.0.0.apk
```

---

## Path B — Bubblewrap (recommended for full control)

Best for: **reproducible builds**, custom signing, Play Store later.

### 1. Install tools

**Linux / macOS / WSL:**

```bash
# Node 20+
node -v

# Java 17 (required)
java -version

# Bubblewrap CLI
npm install -g @bubblewrap/cli

# Android SDK — install Android Studio OR command-line tools only
# https://developer.android.com/studio#command-line-tools-only
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
```

Accept SDK licenses:

```bash
yes | sdkmanager --licenses
sdkmanager "platforms;android-34" "build-tools;34.0.0"
```

### 2. Initialize the TWA project

From this repo:

```bash
cd mobile/twa
bubblewrap init --manifest https://survey-platform-lemon-one.vercel.app/manifest.webmanifest
```

Suggested answers:

| Prompt | Value |
|--------|--------|
| Domain | `survey-platform-lemon-one.vercel.app` |
| URL path | `/surveys` |
| Package name | `com.skyworld.survey` |
| App name | `SkyWorld Survey Platform` |
| Launcher name | `SkyWorld` |
| Theme / background color | `#060a09` |
| Start URL | `/surveys` |
| Icon | Use URL `https://survey-platform-lemon-one.vercel.app/icons/icon-512.png` |
| Maskable icon | Same 512 icon |
| Monochrome icon | Optional — skip or reuse |
| Include site settings shortcut | No |
| Play Billing | No |
| Geolocation | No |

This creates `mobile/twa/` with an Android Gradle project.

### 3. Build a debug APK (test first)

```bash
cd mobile/twa
bubblewrap build
```

Install debug APK on a connected device:

```bash
bubblewrap install
```

Or find the APK:

```text
mobile/twa/app/build/outputs/apk/debug/app-debug.apk
```

### 4. Build a signed release APK (for submission)

```bash
bubblewrap build --signingKeyPath ./android.keystore --signingKeyAlias android
```

First time, create a keystore:

```bash
keytool -genkeypair -v \
  -keystore android.keystore \
  -alias android \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_STORE_PASS \
  -keypass YOUR_KEY_PASS \
  -dname "CN=SkyWorld, OU=Survey, O=SkyWorld Limited, L=Accra, ST=GH, C=GH"
```

**Keep `android.keystore` and passwords safe** — you need the same key for updates.

Release APK path:

```text
mobile/twa/app/build/outputs/apk/release/app-release-signed.apk
```

### 5. Fullscreen TWA (hide Chrome URL bar)

For verified fullscreen, deploy **Digital Asset Links** on your site.

After building with your keystore, get the SHA-256 fingerprint:

```bash
keytool -list -v -keystore android.keystore -alias android | grep SHA256
```

Copy the fingerprint (format `AA:BB:CC:...`), then on Vercel set:

```text
TWA_PACKAGE_NAME=com.skyworld.survey
TWA_SHA256_FINGERPRINT=AA:BB:CC:...
```

Redeploy the frontend. The route `/.well-known/assetlinks.json` is served automatically (see `frontend/app/.well-known/assetlinks.json/route.ts`).

Verify:

```text
https://survey-platform-lemon-one.vercel.app/.well-known/assetlinks.json
```

Use [Google's Asset Links tester](https://developers.google.com/digital-asset-links/tools/generator) if needed.

Rebuild/reinstall the APK after asset links are live.

---

## Path C — Android Studio (if Bubblewrap UI is easier)

1. Run `bubblewrap init` as above
2. Open `mobile/twa` in **Android Studio**
3. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
4. Sign via **Build → Generate Signed Bundle / APK**

---

## Testing checklist (before submission)

- [ ] APK installs on Android 10+
- [ ] App opens to `/surveys` (not a blank page)
- [ ] Survey list loads (API_URL correct on Vercel)
- [ ] Open a survey → respond flow → submit works
- [ ] PDF upload works on mobile
- [ ] Back button behaves reasonably
- [ ] Offline shows `/offline` page (optional)

---

## Submission wording (copy-paste)

**Mobile repository:** `https://github.com/YOUR_USER/simple-survey-mobile`

**APK:** `https://github.com/YOUR_USER/simple-survey-mobile/releases/download/v1.0.0/skyworld-survey-v1.0.0.apk`

> The Android application is a Trusted Web Activity (TWA) packaging the production PWA at https://survey-platform-lemon-one.vercel.app. It provides the same mobile survey discovery, stepped completion, and multipart submission experience as the web PWA.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank white screen in APK | Check Vercel `API_URL`; open site in Chrome on same device |
| "App not installed" | Uninstall old debug build; enable unknown sources |
| Chrome bar still visible | Deploy `assetlinks.json` with correct SHA-256 + package name |
| PWABuilder fails manifest | Open `/manifest.webmanifest` in browser — must return 200 |
| CORS / API errors | Frontend uses `/api/proxy` — should work same-origin in TWA |

---

## Suggested `simple-survey-mobile` repo layout

```text
simple-survey-mobile/
├── README.md              # Install + APK download link
├── APK_BUILD_GUIDE.md     # Copy of this file
└── releases/
    └── skyworld-survey-v1.0.0.apk
```

You can copy this `mobile/` folder into that repo or link to the monorepo path `survey_platform/mobile/`.
