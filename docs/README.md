# Indian Bus Simulator 3D - documentation

A complete 3D bus driving game for Android: eight original Indian buses, seven
Indian maps, heavy-vehicle physics, live traffic, passengers, a career mode,
free drive, customisation, an economy with local saves, weather and a day/night
cycle.

## Where things live

| Path | Contents |
| --- | --- |
| [`indian-bus-simulator/`](../indian-bus-simulator) | The playable build: Three.js/WebGL game + Capacitor Android app (`in.indianbus3d.game`) |
| [`indian-bus-simulator/docs/`](../indian-bus-simulator/docs) | README, INSTALL, BUILD, ARCHITECTURE, GAME_DESIGN, PHASES |
| [`unity/IndianBusSimulator/`](../unity/IndianBusSimulator) | The Unity 2022.3 LTS source project (C#, modular, scene based) |
| [`unity/IndianBusSimulator/Tools/CompileCheck/`](../unity/IndianBusSimulator/Tools/CompileCheck) | UnityEngine stubs + C# regression harness used by CI |
| [`.github/workflows/build-bus-sim-apk.yml`](../.github/workflows/build-bus-sim-apk.yml) | Builds, verifies and publishes the Android APK |
| [`.github/workflows/unity-compile-check.yml`](../.github/workflows/unity-compile-check.yml) | Type-checks the Unity sources and runs the C# suite |

## Documentation index

| Document | Contents |
| --- | --- |
| [Game README](../indian-bus-simulator/docs/README.md) | Overview of the game, both builds, repository layout |
| [INSTALL](../indian-bus-simulator/docs/INSTALL.md) | Installing the APK on a phone, requirements, troubleshooting |
| [BUILD](../indian-bus-simulator/docs/BUILD.md) | Building the APK and the Unity player, CI pipeline |
| [ARCHITECTURE](../indian-bus-simulator/docs/ARCHITECTURE.md) | Module layout of both builds, data flow, conventions |
| [GAME_DESIGN](../indian-bus-simulator/docs/GAME_DESIGN.md) | Buses, maps, missions, economy, controls, cameras |
| [PHASES](../indian-bus-simulator/docs/PHASES.md) | Development phases with an honest per-feature status |
| [UNITY_PROJECT](./UNITY_PROJECT.md) | Working with the Unity project, scenes, build settings |
| [VERIFICATION](./VERIFICATION.md) | What is verified by CI, what is only source complete |

## Download the game

* Android APK: <https://github.com/funnypawan/ppp/releases/tag/bus-sim-apk>
  (`IndianBusSimulator3D-v1.0-debug.apk`, ~4.5 MB)
* In a browser: `cd indian-bus-simulator && npm run serve` → <http://localhost:5173>

## Originality

Every bus, map, mission, sound and piece of code in this project is original
work created for this repository. The game is inspired by the genre, not by
any existing product: no third-party art, audio, maps, branding or proprietary
designs are reproduced. The only third-party dependency is Three.js, used
under the MIT licence and vendored in `indian-bus-simulator/web/vendor/`.
