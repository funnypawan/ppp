# Building and installing Ronny Personal Assistant

## What you need

| | Android Studio path | Gradle-free path |
|---|---|---|
| JDK | bundled with Android Studio | any JDK 8+ (`java -version`) |
| Android SDK | installed by Android Studio | not needed |
| Python | not needed | Python 3.7+ (for the build script) |
| Network | to download the AGP once | only for `fetch-toolchain.py` |

---

## Option A — Android Studio (recommended)

1. **Open the project**
   `File → Open…` → choose the `RonnyPersonalAssistant` folder (the one that
   contains `settings.gradle`).

2. **Point it at the SDK**
   Android Studio usually finds it automatically. If not, copy
   `local.properties.example` to `local.properties` and set:

   ```
   sdk.dir=/home/you/Android/Sdk
   ```

3. **Sync**
   Click *Sync Now*. The project has **no external dependencies** — only the
   Android Gradle Plugin itself is downloaded.

4. **Build a debug APK**
   `Build → Build Bundle(s) / APK(s) → Build APK(s)`

   Result: `app/build/outputs/apk/debug/app-debug.apk`

5. **Build a signed release APK**
   `Build → Generate Signed Bundle / APK…` → APK → create/choose a keystore →
   `release`.

   Result: `app/build/outputs/apk/release/app-release.apk`

### Command line

```bash
cd RonnyPersonalAssistant
./gradlew assembleDebug
./gradlew assembleRelease
./gradlew installDebug            # builds and installs over adb
```

---

## Option B — Gradle-free build script

This is how `release/RonnyPersonalAssistant.apk` in this repository was
produced. Useful when Android Studio or the Gradle download is unavailable.

```bash
cd RonnyPersonalAssistant

# 1. One-off: download aapt2, d8, apksigner, android.jar and javac (~60 MB)
python3 tools/fetch-toolchain.py

# 2. Build + zipalign + sign
python3 tools/offline-build.py
```

Output:

```
release/RonnyPersonalAssistant.apk
```

The build steps are:

1. `aapt2 compile` every file in `app/src/main/res`
2. `aapt2 link` against `android.jar` → `base.apk` + generated `R.java`
3. `javac` all sources (Java 8, `-bootclasspath android.jar` so no desktop-only
   API can sneak in)
4. `d8 --min-api 26` → `classes.dex`
5. insert `classes.dex` (stored, uncompressed) into the APK and **zipalign** to
   4 bytes
6. `apksigner` with a generated RSA-2048 key → **v1 (JAR) + v2** signatures
7. `apksigner verify --print-certs` and a contents check

If you want your own signing key, replace `tools/toolchain/ronny.jks` with a
PKCS12 keystore using alias `ronny` and password `ronny`, or edit the
`--ks*` arguments in `tools/offline-build.py`.

### Regenerating the reminder tones

```bash
python3 tools/make_sounds.py      # rewrites app/src/main/res/raw/*.wav
```

No external audio libraries — the tones are synthesised in pure Python.

### Running the logic tests

```bash
python3 tools/run-tests.py
```

This compiles `tools/tests/LogicTest.java` against the app's classes and checks
time formatting, countdowns, the default schedule (times *and* exact Hindi
messages), next-trigger day skipping across weekday/weekend masks and the
timeline state machine. All checks must print `ALL LOGIC CHECKS PASSED`.

---

## Installing on the phone

### With a cable (adb)

```bash
adb install -r release/RonnyPersonalAssistant.apk
adb shell am start -n com.ronny.assistant/.ui.MainActivity
```

### Without a cable

1. Copy the APK to the phone (USB, Bluetooth, WhatsApp to yourself, …).
2. Tap the file.
3. If Android asks, allow *Install unknown apps* for the app you opened it from.
4. Tap **Install**.

Minimum Android version: **8.0 (API 26)**. The APK is arm64/armeabi-v7a/x86
agnostic — it is pure Java/Kotlin-free framework code, so it runs on every
Android device with API 26+.

---

## First run checklist

1. Open the app → allow **notifications** when Android asks.
2. The app shows the reliability dialog once. Tap **Open** and walk through:
   * Notifications → Allowed
   * Exact alarms → Allowed
   * Battery optimisation → Allowed
   * Auto-start (OEM phones) → open App info and enable it
   * Hindi speech data → install if it says "Needs attention"
3. Back on the dashboard you should see the greeting, the clock, the next
   activity, its countdown and the full timeline.

## Troubleshooting the build

| Symptom | Fix |
|---|---|
| `Missing aapt2 / d8.jar …` | run `python3 tools/fetch-toolchain.py` first |
| `package R does not exist` | sub-package classes need `import com.ronny.assistant.R;` |
| `gradle: SDK location not found` | create `local.properties` with `sdk.dir=…` |
| `apksigner: no suitable key` | delete `tools/toolchain/ronny.jks` and rebuild |
| APK installs but crashes | run `adb logcat \| grep Ronny` and open an issue with the trace |
