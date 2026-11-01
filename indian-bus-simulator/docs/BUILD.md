# Building Indian Bus Simulator 3D

Two independent builds are maintained in this repository:

1. the **playable Android app** (`indian-bus-simulator/`) - Three.js/WebGL
   bundled into a Capacitor Android project,
2. the **Unity project** (`unity/IndianBusSimulator/`) - a complete Unity
   2022.3 LTS C# project.

---

## 1. Playable Android app

### Toolchain

| Tool | Version |
| --- | --- |
| Node.js | 20 or newer (tested on 22) |
| JDK | 21 |
| Android SDK | platform 36, build-tools 36.0.0 |
| Gradle | 8.13 (wrapper included) |
| Capacitor | 8 |

### Commands

```bash
cd indian-bus-simulator
npm install
npm test                 # node --test tests/*.test.mjs  (26 tests)
npm run serve            # static dev server on :5173
npm run sync             # npx cap sync android
npm run apk:debug        # ./gradlew assembleDebug
npm run apk:release      # ./gradlew assembleRelease (needs a keystore)
```

`npm run sync` copies `web/` into `android/app/src/main/assets/public`, so any
change to the game code must be followed by a sync before the next APK build.

### CI pipeline

`.github/workflows/build-bus-sim-apk.yml` runs on every push to the branch:

1. checkout,
2. Node 20 + JDK 21 + Android SDK 36 / build-tools 36.0.0,
3. `npm test` (fails the build if a test fails),
4. `npx cap sync android`,
5. `./gradlew assembleDebug`,
6. verification with `aapt2 dump badging` plus a check that
   `index.html`, `css/style.css`, `js/main.js` and `vendor/three.module.js` are
   really inside the APK,
7. the APK is uploaded as a workflow artifact and published to the
   `bus-sim-apk` GitHub release as `IndianBusSimulator3D-v1.0-debug.apk`.

The verification report is written into the run summary, so the package name,
orientation, permissions and the bundled game files can be inspected without
downloading the artifact.

### Game architecture in the app

```
web/index.html          entry point, canvas + menu markup
web/css/style.css       HUD, menus, touch controls
web/js/main.js          bootstrap: renderer, loop, wiring
web/js/core/            save, settings, input, audio
web/js/world/           map definitions, road network, geometry, props, sky, weather
web/js/vehicles/        bus specs, physics, bus model, player bus, traffic AI
web/js/game/            economy, missions, customisation, camera, HUD, minimap,
                        GPS, passengers
web/js/ui/menu.js       main menu and all sub screens
web/js/util/math.js     shared math helpers
web/vendor/             Three.js r0.187 (module build + core build)
```

The game is plain ES modules - there is no bundler and no transpiler, so a
change is visible after a reload. `npm test` runs the pure logic modules
head-less.

---

## 2. Unity project

### Opening it

1. Install **Unity 2022.3 LTS** (2022.3.62f1 or any newer 2022.3 patch).
2. `File → Open →` select `unity/IndianBusSimulator`.
3. Let the editor import the project. All assets are procedural, so no
   package downloads are needed.
4. Open `Assets/Scenes/MainMenu.unity` and press **Play**.

### Building an Android player from Unity

1. `File → Build Settings…`
2. Select **Android** and press **Switch Platform**.
3. In *Player Settings*:
   - Company / Product: `Pawan Games` / `Indian Bus Simulator 3D`,
   - Package name: `in.indianbus3d.game`,
   - Minimum API level: **Android 7.0 (API 24)**,
   - Target API level: **Automatic (highest installed)**,
   - Scripting Backend: **IL2CPP**, ARM64 enabled,
   - Orientation: **Landscape**,
   - Optimized Frame Pacing: on, `Target Frame Rate` 60.
4. `Build` → choose an output folder → `Build` (or `Build App Bundle (Google
   Play)` for a Play upload).
5. The generated Gradle project lives in `unity/IndianBusSimulator/Builds/`.

### Type checking the C# without Unity

The Unity Editor is not required to validate the sources: the repository ships
a small harness that compiles every script against a minimal set of
`UnityEngine` stubs and runs a head-less regression suite over the engine-free
simulation core.

```bash
cd unity/IndianBusSimulator/Tools/CompileCheck
dotnet build CompileCheck.csproj -c Release
dotnet run --project CompileCheck.csproj -c Release --no-build
```

The suite prints one line per check and exits non-zero on failure. It is also
wired into `.github/workflows/unity-compile-check.yml`, so every push verifies
the Unity sources and the physics behaviour.

### Regenerating the project scaffolding

`Tools/generate_project_files.py` regenerates the `.meta` files (with stable
GUIDs), the assembly definitions, the seven scenes, the project settings and
the package manifest:

```bash
cd unity/IndianBusSimulator
python3 Tools/generate_project_files.py
```

---

## 3. Repository level builds

| Command | Result |
| --- | --- |
| `npm test` (in `indian-bus-simulator/`) | 26 passing unit + integration tests |
| `dotnet run` (in `unity/.../Tools/CompileCheck`) | 30 passing C# physics/mission checks |
| `gh run list` | APK build and Unity compile check status |

Both CI workflows run on push and are visible under the **Actions** tab of the
repository.
