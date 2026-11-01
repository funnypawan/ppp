# Indian Bus Simulator 3D

A complete, original 3D bus driving game for Android: eight Indian buses, seven
Indian maps, heavy-vehicle physics, live traffic, passengers, a career mode,
free drive, customisation, an economy with local saves, weather and a day/night
cycle.

Two builds of the same game live in this repository:

| Build | Location | Status |
| --- | --- | --- |
| **Playable Android app** (Three.js/WebGL inside a Capacitor shell) | [`indian-bus-simulator/`](../indian-bus-simulator) | Playable, packaged as a real APK by CI |
| **Unity 2022.3 LTS source project** (C#, modular, scene based) | [`unity/IndianBusSimulator/`](../../unity/IndianBusSimulator) | Source complete, type-checked in CI, **not** opened in the Unity Editor here |

Everything in the game is original: no third-party assets, no copied maps, no
borrowed branding. Buses, maps, layouts, sounds and missions are generated from
code and data in this repository.

---

## 1. Quick start (playable build)

```bash
cd indian-bus-simulator
npm install          # install Capacitor tooling
npm test             # 26 unit + integration tests
npm run serve        # play in a browser on http://localhost:5173
```

Android:

```bash
cd indian-bus-simulator
npm run sync         # copy the web build into the Android project
npm run apk:debug    # build app/build/outputs/apk/debug/app-debug.apk
```

or download the published APK from the
[GitHub release](https://github.com/funnypawan/ppp/releases/tag/bus-sim-apk).

See [INSTALL.md](./INSTALL.md) for phone installation and [BUILD.md](./BUILD.md)
for the full pipeline.

---

## 2. What is in the game

### Eight original buses
Sarathi City Bus, Rathore Luxury Coach, Rajdhani Sleeper, Yatra Tourist, Vidyalaya
School Bus, Chhota Mini, Double Decker and the Meridian Volvo-inspired long
distance coach. Every bus has its own mass, wheelbase, tyre size, torque curve,
gearbox, braking, seating layout and body style (city, coach, sleeper, tourist,
school, mini, double, volvo).

### Seven Indian maps
Indian City, Indian Village, National Highway, Mountain Roads, Desert Roads,
Rainy City and Night Highway - each generated from a road graph with buildings,
shops, fuel stations, bus stops, bridges, flyovers, toll plazas, trees,
mountains, rivers, street lights and signals.

### Driving
Single-track heavy-vehicle model with load transfer, friction-circle combined
slip, clutch, gearbox with auto shifting, engine braking plus exhaust retarder,
speed-sensitive steering, suspension pitch/roll/heave, fuel consumption,
collision response and damage.

### Gameplay
Passengers wait at stops, board when the doors are open, are dropped at their
destination and pay a fare based on distance and satisfaction. Ten career
missions across nine categories, free drive with bus/map/weather/time/traffic
choice, a daily reward ladder, an economy with unlockable buses, maps and
customisation, and a local save.

---

## 3. Repository layout

```
indian-bus-simulator/            playable Three.js + Capacitor Android app
  web/                           the game (ES modules, no bundler)
    js/core, js/world, js/vehicles, js/game, js/ui, js/util
    vendor/three.module.js       vendored Three.js r0.187 (MIT)
  android/                       Capacitor 8 Android project (appId in.indianbus3d.game)
  tests/                         node test runner suite (26 tests)
  tools/                         icon generator, dev server
  docs/                          this documentation set
unity/IndianBusSimulator/        Unity 2022.3 LTS project (C#, asmdef modular)
  Assets/Scripts/{Core,Util,World,Vehicles,Game,UI}
  Assets/Scenes/                 Loading, MainMenu, BusGarage, MapSelection,
                                 CareerMode, Gameplay, Settings
  Tools/CompileCheck/            UnityEngine stubs + C# regression harness
docs/                            top level documentation
.github/workflows/
  build-bus-sim-apk.yml          builds + publishes the Android APK
  unity-compile-check.yml        type-checks the Unity sources and runs the C# suite
```

---

## 4. Documentation

| Document | Contents |
| --- | --- |
| [INSTALL.md](./INSTALL.md) | Installing the APK on a phone, requirements, troubleshooting |
| [BUILD.md](./BUILD.md) | Building the APK locally and in CI, building the Unity project |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Module layout of both builds, data flow, conventions |
| [GAME_DESIGN.md](./GAME_DESIGN.md) | Buses, maps, missions, economy, controls, cameras |
| [PHASES.md](./PHASES.md) | Development phases and the honest status of every feature |
| [../../docs/UNITY_PROJECT.md](../../docs/UNITY_PROJECT.md) | Working with the Unity project |
| [../../docs/VERIFICATION.md](../../docs/VERIFICATION.md) | What is tested, what is only source-complete |

---

## 5. Licence

The game code in this repository is original work. Three.js is used under the
MIT licence (see `web/vendor/THREE-LICENSE.txt`).
