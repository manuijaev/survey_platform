# simple-survey-mobile

Android mobile delivery for the SkyWorld Survey Platform.

The mobile application is a **Progressive Web App** wrapped as an **Android APK** (Trusted Web Activity). It uses the same production deployment as the web app.

| Item | Value |
|------|--------|
| Live PWA | https://survey-platform-lemon-one.vercel.app |
| Web source | [`../frontend/`](../frontend/) |
| Start URL | `/surveys` |

## Install without APK (PWA)

**Android (Chrome):** Open the live URL → **Install app** / **Add to Home screen**

**iOS (Safari):** Share → **Add to Home Screen**

## Build a real APK (Bubblewrap — signed release)

Follow **[BUBBLEWRAP_SETUP.md](./BUBBLEWRAP_SETUP.md)** — full prerequisites, keystore, signed APK, and Vercel asset links.

Quick sequence:

```bash
npm install -g @bubblewrap/cli
cd mobile/twa && bubblewrap update
# create android.keystore (see guide)
export BUBBLEWRAP_KEYSTORE_PASSWORD='...'
bubblewrap build
```

Also see **[APK_BUILD_GUIDE.md](./APK_BUILD_GUIDE.md)** for PWABuilder (quick alternative).

## Download APK (v1.0.0)

After publishing a GitHub Release, the install file is:

`https://github.com/manuijaev/simple-survey-mobile/releases/download/v1.0.0/app-release-signed.apk`

A copy is also kept in [`releases/skyworld-survey-v1.0.0.apk`](releases/skyworld-survey-v1.0.0.apk).

## Submission

- **Mobile repo:** `https://github.com/manuijaev/simple-survey-mobile`
- **Web monorepo:** `https://github.com/manuijaev/survey_platform`
- **Live PWA:** https://survey-platform-lemon-one.vercel.app

The Android app is a Trusted Web Activity (TWA) packaging the production PWA. It provides the same mobile survey discovery, stepped completion, and multipart submission experience as the web app.
