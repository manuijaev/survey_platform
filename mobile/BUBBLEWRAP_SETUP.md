# Bubblewrap signed APK — step-by-step

Build a **real signed Android APK** for SkyWorld using [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) (Google’s TWA tool).

**Production PWA:** https://survey-platform-lemon-one.vercel.app  
**Package ID:** `com.skyworld.survey`  
**Config:** [`twa/twa-manifest.json`](twa/twa-manifest.json) (pre-filled)

---

## Phase 1 — Install prerequisites (one time)

### 1.1 Java 17

```bash
java -version
# must show 17 or newer
```

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y openjdk-17-jdk
```

### 1.2 Node.js 20+

```bash
node -v
npm -v
```

### 1.3 Bubblewrap CLI

```bash
npm install -g @bubblewrap/cli
bubblewrap --version
```

### 1.4 Android SDK

**Option A — Android Studio (easiest)**  
Install [Android Studio](https://developer.android.com/studio), open **SDK Manager**, install:

- Android SDK Platform 34
- Android SDK Build-Tools 34

Set environment variables (add to `~/.bashrc`):

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/build-tools/34.0.0
```

**Option B — Command-line tools only**

```bash
mkdir -p $HOME/Android/Sdk/cmdline-tools
cd $HOME/Android/Sdk/cmdline-tools
# Download commandlinetools-linux from developer.android.com/studio#command-line-tools-only
unzip commandlinetools-*.zip
mv cmdline-tools latest

export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

Verify:

```bash
sdkmanager --list | head
adb version
```

---

## Phase 2 — Generate the Android project

A `twa-manifest.json` is already configured in `mobile/twa/`.

```bash
cd "/home/emmanuel/Desktop/survey platform/mobile/twa"
bubblewrap update
```

This downloads icons from your live site and generates the Gradle Android project (`app/`, `gradle/`, etc.).

> **Alternative (interactive):** If you prefer the wizard, run  
> `bubblewrap init --manifest https://survey-platform-lemon-one.vercel.app/manifest.webmanifest`  
> in an empty folder and use the same values as `twa-manifest.json`.

---

## Phase 3 — Create a signing keystore (one time)

```bash
cd "/home/emmanuel/Desktop/survey platform/mobile/twa"

keytool -genkeypair -v \
  -keystore android.keystore \
  -alias android \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "CHOOSE_A_STRONG_STORE_PASSWORD" \
  -keypass "CHOOSE_A_STRONG_KEY_PASSWORD" \
  -dname "CN=SkyWorld Survey, OU=Mobile, O=SkyWorld Limited, L=Accra, ST=Greater Accra, C=GH"
```

**Important**

- `android.keystore` is git-ignored — back it up securely (USB + password manager).
- You need the **same keystore** for every future APK update.

---

## Phase 4 — Build debug APK (test first)

```bash
cd "/home/emmanuel/Desktop/survey platform/mobile/twa"
bubblewrap build --skipSigning
```

APK path:

```text
app/build/outputs/apk/release/app-release-unsigned.apk
```

Or debug:

```bash
cd app && ./gradlew assembleDebug
# app/build/outputs/apk/debug/app-debug.apk
```

### Install on a phone

Enable **Developer options → USB debugging**, connect USB:

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

Or copy the APK file to the phone and open it.

**Test:** surveys list loads, respond flow works, PDF upload works.

---

## Phase 5 — Build signed release APK (for submission)

Set passwords (same session only — do not commit):

```bash
export BUBBLEWRAP_KEYSTORE_PASSWORD="YOUR_STORE_PASSWORD"
export BUBBLEWRAP_KEY_PASSWORD="YOUR_KEY_PASSWORD"
```

Build:

```bash
cd "/home/emmanuel/Desktop/survey platform/mobile/twa"
bubblewrap build
```

Signed APK:

```text
app/build/outputs/apk/release/app-release-signed.apk
```

Rename for submission:

```bash
cp app/build/outputs/apk/release/app-release-signed.apk \
   ../releases/skyworld-survey-v1.0.0.apk
```

Or use the helper script:

```bash
cd "/home/emmanuel/Desktop/survey platform/mobile"
chmod +x scripts/build-release.sh
BUBBLEWRAP_KEYSTORE_PASSWORD='...' BUBBLEWRAP_KEY_PASSWORD='...' ./scripts/build-release.sh
```

---

## Phase 6 — Fullscreen TWA (remove Chrome URL bar)

### 6.1 Get SHA-256 fingerprint

```bash
keytool -list -v \
  -keystore android.keystore \
  -alias android \
  -storepass "YOUR_STORE_PASSWORD" | grep SHA256
```

Copy the value like `AB:CD:EF:12:...`

### 6.2 Configure Vercel

In **Vercel → Project → Settings → Environment Variables**:

| Name | Value |
|------|--------|
| `TWA_PACKAGE_NAME` | `com.skyworld.survey` |
| `TWA_SHA256_FINGERPRINT` | paste SHA256 from keytool |

Redeploy the frontend.

### 6.3 Verify Digital Asset Links

Open in a browser:

```text
https://survey-platform-lemon-one.vercel.app/.well-known/assetlinks.json
```

You should see JSON with your package name and fingerprint.

### 6.4 Reinstall APK

Uninstall the old app from the phone, install the signed APK again. It should open **fullscreen** without the browser address bar.

---

## Phase 7 — Publish for Sky World submission

1. Create GitHub repo **`simple-survey-mobile`** (public).
2. Copy `mobile/` folder contents into it.
3. Create **GitHub Release** `v1.0.0` and attach `skyworld-survey-v1.0.0.apk`.
4. Submit links:

| Item | Value |
|------|--------|
| Mobile repo | `https://github.com/YOUR_USER/simple-survey-mobile` |
| APK | Release download URL |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `bubblewrap: command not found` | `npm install -g @bubblewrap/cli` |
| `ANDROID_HOME not set` | Export `ANDROID_HOME` and PATH (Phase 1.4) |
| `SDK license not accepted` | `yes \| sdkmanager --licenses` |
| Blank screen in APK | Set `API_URL` on Vercel to your Render backend |
| Chrome bar still visible | Complete Phase 6 (asset links + redeploy) |
| `bubblewrap update` fails on icons | Confirm `icon-512.png` loads in browser |
| Build asks for password every time | Export `BUBBLEWRAP_KEYSTORE_PASSWORD` |

---

## Official references

- [Chrome TWA Quick Start](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start)
- [Bubblewrap CLI (npm)](https://www.npmjs.com/package/@bubblewrap/cli)
- [Digital Asset Links](https://developers.google.com/digital-asset-links)
