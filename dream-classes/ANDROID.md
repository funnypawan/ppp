# 📱 Dream Classes — Android App (Capacitor)

**Status:** Real Capacitor 8 Android project generated & configured in `android/`.
**APK:** ❌ Not built in the AI sandbox — it has **no Java, Gradle or Android SDK**
(`./gradlew assembleDebug` → "JAVA_HOME is not set"). Build it on any PC with the steps below (≈15 min first time).

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
1. Install **JDK 17** and **Android Studio** (includes SDK; install "Android SDK Platform 34"+).
2. In `capacitor.config.json`, set `server.url` to your live HTTPS domain
   (e.g. `https://dreamclasses.in`). For a local test server use `http://10.0.2.2:3000`
   (+ `cleartext: true` and a debug domain entry in `network_security_config.xml`).
3. From the `dream-classes/` folder:
   ```bash
   npm install
   npx cap sync android
   cd android && ./gradlew assembleDebug
   ```
   Debug APK → `android/app/build/outputs/apk/debug/app-debug.apk` (install directly on a phone).
   Or `./build-android.sh` from `dream-classes/` does sync + debug build in one go.
4. **Release (Play Store):** Android Studio → *Build → Generate Signed App Bundle/APK* →
   create a keystore (keep it + passwords safe forever), build **AAB**, upload to Play Console.
   Before release, regenerate perfect icon densities: `npm i -D @capacitor/assets && npx capacitor-assets generate`.

## Native notes
- Video playback uses the WebView HTML5 player (same signed URLs/watermark). ExoPlayer via a
  Capacitor plugin is only needed for DRM — not required for current features.
- Nothing in software can stop a second camera filming the screen; FLAG_SECURE + personal
  watermark + single-device login are the practical protections (already enabled).
