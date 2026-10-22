#!/usr/bin/env bash
# Dream Classes — build debug APK. Requires: JDK 17 + Android SDK (see ANDROID.md).
set -e
cd "$(dirname "$0")"
if ! command -v java >/dev/null; then echo "❌ Java not found. Install JDK 17 first (see ANDROID.md)."; exit 1; fi
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then echo "❌ ANDROID_HOME not set. Install Android Studio/SDK (see ANDROID.md)."; exit 1; fi
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
echo "✅ APK: android/app/build/outputs/apk/debug/app-debug.apk"
ls -lh app/build/outputs/apk/debug/app-debug.apk
