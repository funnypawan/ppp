# 📱 Dream Classes — Android App (Capacitor)

**Status:** ✅ **APK GitHub Actions (cloud) se banta hai** — PC ki zaroorat nahi.
**APK:** ✅ Pehla safal build: GitHub Actions run **#39745570771** — artifact **Dream-Classes-APK**
(andar file: `DreamClasses-v1.0-debug.apk`, lagbhag 8.6 MB zip). Har push par aur
"Run workflow" dabane par naya APK ban jata hai (.github/workflows/build-android-apk.yml).
Phone se download: GitHub repo → **Actions** → sabse upar wala safal (✓) run → neeche
**Artifacts → Dream-Classes-APK** → zip download → APK install (step-by-step neeche).
⚠️ Dhyan dein: APK tabhi andar classes dikhayega jab server internet par live ho aur
uska URL build ke samay diya gaya ho (workflow ka `server_url` box). Abhi wala APK
placeholder address par bana hai — install hoga, par app khulne par server nahi milega.
Server free me live karne ke liye repo root me `render.yaml` ready hai (PRODUCTION.md dekhein).

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
