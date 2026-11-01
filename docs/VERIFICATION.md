# Verification report

This document states exactly what has been *executed* and what has only been
*implemented*. Nothing in the project is claimed as tested unless a command
below produced a passing result.

---

## 1. Automated checks (green in CI)

| Check | Command | Result |
| --- | --- | --- |
| JavaScript unit + integration suite | `npm test` in `indian-bus-simulator/` | **26 passed, 0 failed** (13 physics + 13 integration) |
| C# compile check of every Unity script | `dotnet build` in `unity/IndianBusSimulator/Tools/CompileCheck` | **Build succeeded, 0 errors** |
| C# physics / mission regression suite | `dotnet run --project CompileCheck.csproj` | **30 passed, 0 failed** |
| Android debug APK | `./gradlew assembleDebug` (GitHub Actions, JDK 21, SDK 36) | **Built**, 4 567 489 bytes |
| APK manifest verification | `aapt2 dump badging` | package `in.indianbus3d.game`, target SDK 36, `android.hardware.screen.landscape`, launcher `in.indianbus3d.game.MainActivity` |
| APK content verification | `unzip -l` | `index.html`, `css/style.css`, `js/main.js`, `vendor/three.module.js` present |
| Release publication | `gh release upload` | `IndianBusSimulator3D-v1.0-debug.apk` on the `bus-sim-apk` release |

Every APK build posts its verification report (package name, SDK versions,
orientation, bundled game files) into the tracking issue
`[apk-build-report] Indian Bus Simulator 3D`, and the Unity compile check
opens an issue only when it fails.

Both workflows are public and can be re-run from the repository's **Actions**
tab:

* `build-bus-sim-apk.yml` - build, verify and publish the APK,
* `unity-compile-check.yml` - type-check the Unity sources and run the C# suite.

### What the JavaScript suite covers

* the catalogue has eight sane, distinct buses,
* the torque curve peaks in the mid range and never goes negative,
* a loaded city bus accelerates like a bus (0-40 km/h in ~21 s, never a
  sports car),
* braking from 20 m/s stops the bus within a plausible distance (~59 m),
* steering produces yaw and the lock falls off with speed,
* the gearbox shifts up automatically and reverse works,
* fuel is consumed and never goes negative,
* collisions report an impulse, add damage and never add speed,
* traffic keeps its distance behind the player bus,
* passengers board, travel and are dropped off,
* a mission completes when its objectives are met and fails on timeout,
* the save round-trips,
* GPS produces a route, the cameras switch.

### What the C# suite covers

The same expectations are re-checked against the C# port (catalogue, torque
curve, acceleration, braking, steering, gearbox, fuel, collisions, mission
completion and failure), which proves the two implementations agree.

---

## 2. Implemented but not covered by an automated test

The following systems exist, compile, and are wired into the runtime, but the
development sandbox had no GPU, browser or phone, so they were not observed
visually here:

* the WebGL rendering of the menus, the HUD, the minimap and the touch layout,
* the appearance of the procedural bus, the map geometry and the prop placement,
* the audio output (engine pitch, horn, air brake, doors, rain),
* the precipitation particles and the day/night lighting,
* the on-device performance on a 4 GB phone.

---

## 3. Not verified here

* **The Unity Editor.** Unity could not be installed in the sandbox (the
  installer and the licence server were unreachable). The Unity project is
  therefore *source complete and type checked*, but it has never been opened,
  played or exported to an APK from inside Unity. Expect the usual first
  import adjustments (scene lighting values, quality preset names, the
  `Assets/Settings` folder that Unity creates on import).
* **A physical Android device.** The APK was built and inspected
  programmatically (manifest, permissions, bundled assets), but it was not
  installed on a phone or emulator here.
* **Release signing.** Only debug APKs are produced; a keystore is not part of
  the repository.

---

## 4. How to reproduce the checks

```bash
# 1. JavaScript suite
cd indian-bus-simulator && npm install && npm test

# 2. C# compile + regression suite
cd unity/IndianBusSimulator/Tools/CompileCheck
dotnet build CompileCheck.csproj -c Release
dotnet run --project CompileCheck.csproj -c Release --no-build

# 3. APK (needs JDK 21 + Android SDK 36)
cd indian-bus-simulator && npm run sync
cd android && ./gradlew assembleDebug
```

---

## 5. Source of truth

The repository is the source of truth. This report summarises it; where the two
disagree, the code and the CI results win.
