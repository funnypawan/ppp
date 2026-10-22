# 📱 Dream Classes — Android App (Capacitor)

**Status:** Real Capacitor 8 Android project generated & configured in `android/`.
**APK:** ❌ Not built in the AI sandbox — verified 2026-10-22 (Round 4): no `java`/`javac`/
`gradle`/`sdkmanager`/`adb`, `JAVA_HOME`/`ANDROID_HOME` unset, and the sandbox network cannot
reach `dl.google.com`, `services.gradle.org` or Maven Central, so the toolchain cannot be
installed there either. `./gradlew assembleDebug` fails immediately with
"ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH."
No `.apk` file exists in this repository. Build on any PC with the steps below (≈15 min first time).

### ✅ Verified before hand-off (Round 4)
- `capacitor.config.json` valid: appId `in.dreamclasses.app`, name **Dream Classes**, HTTPS `server.url` placeholder (replace — see below), cleartext off
- `npx cap sync android` re-run: web assets in `android/app/src/main/assets/public/` are byte-identical to `public/` (md5 verified), native bridge included, 4 plugins registered (App, Filesystem, SplashScreen, StatusBar)
- Manifest: INTERNET / ACCESS_NETWORK_STATE / POST_NOTIFICATIONS / CAMERA, `usesCleartextTraffic=false`, `allowBackup=false`, network-security config present; all project XML parses cleanly; every referenced resource exists
- Secrets scan of everything that would go into the APK: **no passwords, JWT/OTP keys, or private keys** (only the placeholder domain)
- Back-button, status-bar, splash-hide logic ships in `assets/public/js/native-bridge.js`; FLAG_SECURE confirmed in `MainActivity.java`

## Already configured
- App name **Dream Classes**, package ID **`in.dreamclasses.app`**
- Brand app icon (adaptive icon + legacy), indigo splash screen with logo, indigo status bar
- **FLAG_SECURE** in `MainActivity.java` — screenshots/screen-recording blocked in the app
- HTTPS-only network policy (`network_security_config.xml`, cleartext off), `allowBackup=false`
- Permissions: INTERNET, ACCESS_NETWORK_STATE, POST_NOTIFICATIONS, CAMERA (doubt photos)
- Hardware **back-button** behaviour, splash hide, status-bar styling (`public/js/native-bridge.js`)
- Offline downloads use app-private storage (WebView IndexedDB; `@capacitor/filesystem` installed for large-file upgrades)
- The app loads your deployed server (`server.url` in `capacitor.config.json`), so login,
  watermark, signed video URLs, tests and push work exactly like the web app.
  Web Push works in the WebView-based app via the server page; for store-grade native
  push, add FCM later (`@capacitor/push-notifications` + Firebase) — optional.

## Build the APK (on your PC)
1. Install **JDK 17** and **Android Studio** (includes SDK; install "Android SDK Platform 36" (this project compileSdk/targetSdk 36, minSdk 24 — Android Studio's SDK Manager will offer exactly what Gradle requests; AGP 8.13 + Gradle wrapper 8.14.3 download automatically on first build)).
2. In `capacitor.config.json`, set `server.url` to your live HTTPS domain
   (e.g. `https://dreamclasses.in`). For a local test server use `http://10.0.2.2:3000`
   (+ `cleartext: true` and a debug domain entry in `network_security_config.xml`).
3. From the `dream-classes/` folder:
   ```bash
   npm install
   npx cap sync android
   cd android && ./gradlew assembleDebug
   ```
   Debug APK → `android/app/build/outputs/apk/debug/app-debug.apk`
4b. **Install the debug APK on a phone:** enable Developer Options → USB debugging, connect USB,
   run `adb install -r android/app/build/outputs/apk/debug/app-debug.apk` — or copy the APK to the
   phone and tap it (allow "install unknown apps" for your file manager when prompted).
   The app opens to your server's student login; the Teacher Panel stays on the web at `/admin`.
   Or `./build-android.sh` from `dream-classes/` does sync + debug build in one go.
5. **Release (Play Store):** Android Studio → *Build → Generate Signed App Bundle/APK* →
   create a keystore (keep it + passwords safe forever), build **AAB**, upload to Play Console.
   Before release, regenerate perfect icon densities: `npm i -D @capacitor/assets && npx capacitor-assets generate`.

## Native notes
- Video playback uses the WebView HTML5 player (same signed URLs/watermark). ExoPlayer via a
  Capacitor plugin is only needed for DRM — not required for current features.
- Nothing in software can stop a second camera filming the screen; FLAG_SECURE + personal
  watermark + single-device login are the practical protections (already enabled).
