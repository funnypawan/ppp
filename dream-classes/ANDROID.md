# 📱 Dream Classes — Android App (Capacitor)

**Status:** ✅ **APK GitHub Actions (cloud) se banta hai** — PC ki zaroorat nahi.
Permanent direct download link:
`https://github.com/funnypawan/ppp/releases/download/apk-latest/DreamClasses-v1.0-debug.apk`
Har safal `main` build par ye Release asset update ho jata hai; workflow ko Actions
se manually bhi chalaya ja sakta hai.

APK **bundled mode** me hai: student/teacher UI APK ke andar hai. Build ke samay
workflow ke `server_url` box me Render URL de sakte hain, ya app khulne par wahi
https address daal sakte hain. App address save karne se pehle `/api/health` se
check karta hai ki wo asal Dream Classes server hai. Sirf server URL badalne ke
liye nayi APK nahi chahiye; frontend/native code badle to nayi APK chahiye.

## Already configured
- App name **Dream Classes**, package ID **`in.dreamclasses.app`**
- Brand app icon (adaptive icon + legacy), indigo splash screen with logo, indigo status bar
- **FLAG_SECURE** in `MainActivity.java` — screenshots/screen-recording blocked in the app
- HTTPS-only network policy (`network_security_config.xml`, cleartext off), `allowBackup=false`
- Permissions: INTERNET, ACCESS_NETWORK_STATE, POST_NOTIFICATIONS, CAMERA (doubt photos)
- Hardware **back-button** behaviour, splash hide, status-bar styling (`public/js/native-bridge.js`)
- Offline downloads use app-private storage (WebView IndexedDB; `@capacitor/filesystem` installed for large-file upgrades)
- The app does **not** use `server.url`. Its bundled UI calls the deployed HTTPS
  backend API (build-time `DC_API_BASE` or the health-checked address saved in the
  app), so login, watermark, signed video URLs and tests work against the real
  server. For store-grade native push, add FCM later if needed — optional.

## Build the APK (on your PC)
1. Install **JDK 21** and **Android Studio** (Capacitor 8 requires JDK 21; install Android SDK Platform 36/build-tools 36).
2. Do **not** add `server.url`. Optionally set `window.DC_API_BASE` in
   `public/js/app-config.js` to the live HTTPS backend, or leave it blank and let
   the app ask for the server address on first launch.
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
   The app opens to the student login and can also open the bundled Teacher Panel against the same configured backend; the panel is also available in a browser at `<server>/admin`.
   Or `./build-android.sh` from `dream-classes/` does sync + debug build in one go.
5. **Release (Play Store):** Android Studio → *Build → Generate Signed App Bundle/APK* →
   create a keystore (keep it + passwords safe forever), build **AAB**, upload to Play Console.
   Before release, regenerate perfect icon densities: `npm i -D @capacitor/assets && npx capacitor-assets generate`.

## Native notes
- Video playback uses the WebView HTML5 player (same signed URLs/watermark). ExoPlayer via a
  Capacitor plugin is only needed for DRM — not required for current features.
- Nothing in software can stop a second camera filming the screen; FLAG_SECURE + personal
  watermark + single-device login are the practical protections (already enabled).
