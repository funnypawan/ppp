# Installation Instructions — FOCUS LIFE

## Option A: Install the APK (recommended, no PC needed)

1. Download **`FocusLife-v1.0-debug.apk`** (26.9 MB) directly from the release: **https://github.com/funnypawan/ppp/releases/tag/focus-life-apk-latest** — or from the `FocusLife-APK` artifact on the [Actions](https://github.com/funnypawan/ppp/actions/workflows/build-focus-life-apk.yml) page (sign in to GitHub required).
2. Copy the APK to your phone (WhatsApp, Drive, USB, or download directly on phone).
3. Tap the APK → if asked, allow **"Install unknown apps"** for your browser/file manager → **Install**.
4. Open **FOCUS LIFE** from the launcher.

## Option B: Build locally with Android Studio

1. Install **JDK 17** and **Android Studio** (Hedgehog or newer).
2. Open the `focus-life/` folder in Android Studio → let Gradle sync (downloads AGP 8.5.2, Kotlin 2.0.20, Compose BOM 2024.09.00).
3. Connect your phone (USB debugging ON) or create an emulator (API 29+).
4. Run ▶ **app** → installs and launches on device.
5. Or build APK: **Build → Build App Bundle(s) / APK(s) → Build APK(s)** → `app/build/outputs/apk/debug/app-debug.apk`.

## Option C: Build via GitHub Actions (cloud, no local setup)

1. Go to repo → **Actions** → **Build FOCUS LIFE APK** → **Run workflow**.
2. Wait ~5–10 min → download `FocusLife-APK` artifact.
3. Install as in Option A.

## Restricted settings fix ("App was denied access")

If the Accessibility toggle shows **"App was denied access"** (common on Android 13+ when the APK is sideloaded):

1. Settings → Apps → **FOCUS LIFE** (App info)
2. Tap **⋮** (top-right) → **Allow restricted settings**
3. Settings → Accessibility → **FOCUS LIFE** → **ON**

Or install from a PC: `adb install focus-life/app/build/outputs/apk/debug/app-debug.apk` (ADB installs are not restricted).

Only Accessibility + Notification Listener are restricted — Notifications and Usage Access work normally.

## First launch setup

1. Enter your name (Profile tab).
2. Grant **Notifications** (Android 13+ prompt) for routine reminders.
3. (Optional, for blocker/usage) Grant **Usage Access** and **Accessibility** — see [PERMISSIONS.md](PERMISSIONS.md).
4. Add today's study targets (Study tab), check habits (Habits tab), start a Focus session (Focus tab).

## Uninstall

Settings → Apps → FOCUS LIFE → Uninstall. All data is local and removed on uninstall.
