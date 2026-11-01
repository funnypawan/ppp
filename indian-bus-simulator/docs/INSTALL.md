# Installing Indian Bus Simulator 3D on Android

## Requirements

| Item | Requirement |
| --- | --- |
| Android version | Android 7.0 (API 24) or newer, Android 10+ recommended |
| RAM | 2 GB minimum, 4 GB recommended |
| Storage | ~25 MB for the APK plus WebView cache |
| GPU | Any OpenGL ES 3.0 capable device (all phones from ~2015 onwards) |
| Network | Not required - the game is fully offline |
| Permissions | Only the Android `INTERNET` / `ACCESS_NETWORK_STATE` entries that the embedded WebView needs. No camera, no microphone, no location, no storage |

The game runs in landscape only and keeps the screen awake while it is open.

---

## Option A - download the published APK (easiest)

1. Open the release page:
   <https://github.com/funnypawan/ppp/releases/tag/bus-sim-apk>
2. Download `IndianBusSimulator3D-v1.0-debug.apk` (about 4.5 MB).
3. Copy it to the phone (USB, cloud drive, or download it directly in the
   browser).
4. Tap the file and confirm the install.

Because the APK is a **debug build** it is not signed with a Play Store key, so
Android asks you to allow installation from your file manager:

> Settings → Apps → Special app access → Install unknown apps → allow it for the
> app you are downloading with (Chrome/Files) → back → install.

> Note: the download page inside this repository may show a warning because the
> release is a debug artifact rather than a Play Store upload. This is expected.

---

## Option B - build the APK yourself

Requirements: Node.js 20+, JDK 21, Android SDK (platform 36, build-tools
36.0.0).

```bash
git clone https://github.com/funnypawan/ppp.git
cd ppp/indian-bus-simulator

npm install
npm test          # the build pipeline runs this as well
npm run sync      # capacitor sync android
cd android
./gradlew assembleDebug
```

The APK is written to:

```
indian-bus-simulator/android/app/build/outputs/apk/debug/app-debug.apk
```

Install it with `adb install -r app/build/outputs/apk/debug/app-debug.apk` or
copy it to the phone.

A signed release build can be produced with `./gradlew assembleRelease` once a
keystore is configured in `android/app/build.gradle`.

---

## Option C - play in a browser

```bash
cd indian-bus-simulator
npm run serve
# open http://localhost:5173
```

Keyboard controls (for testing): `W`/`Up` throttle, `S`/`Down` brake,
`A`/`D` steer, `Space` handbrake, `Q`/`E` reverse/drive, `H` horn,
`L` headlights, `C` camera, `O` doors, `Z`/`X` indicators.

---

## First run

1. The main menu shows a slowly rotating bus.
2. **Free Drive** → pick a bus and a map → **Start Free Drive**.
3. Use the on-screen pedals and steering buttons (bottom left / bottom right).
4. Press **DOOR** at a bus stop to let passengers board, then drive to the next
   stop.
5. **Career Mode** unlocks paid missions that pay out into your balance.

Progress (money, unlocks, customisation, mission completion, daily reward
streak) is saved locally on the device and survives restarts.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "App not installed" | The APK was transferred incorrectly - copy it again and make sure it is ~4.5 MB |
| Installation blocked | Enable *Install unknown apps* for your browser/file manager |
| Black screen | Update Android System WebView (Play Store → Android System WebView → Update) and reopen the game |
| Low frame rate | In-game Settings → Graphics quality → *Low*, frame rate limit → 30 |
| Game does not rotate the screen | The device must support `sensorLandscape`; some tablets force portrait via a system setting |

---

## Uninstalling

`Settings → Apps → Indian Bus Simulator 3D → Uninstall`. The game stores its
save inside the app sandbox, so uninstalling also deletes the progress.
