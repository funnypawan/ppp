# Unity project guide - Indian Bus Simulator 3D

Location: `unity/IndianBusSimulator/`

A Unity **2022.3 LTS** project (2022.3.62f1) written in C#. It contains the
complete game: buses, maps, traffic, passengers, missions, economy, menus,
HUD, weather and audio. Everything is generated procedurally at runtime, so
there are no binary art assets to manage.

---

## 1. Opening the project

1. Install Unity **2022.3 LTS** (any 2022.3 patch release works).
2. `File → Open →` choose the `unity/IndianBusSimulator` folder.
3. Wait for the first import (a minute or two, the project is small).
4. Open `Assets/Scenes/MainMenu.unity` and press **Play**.

No packages beyond the default set are required; `Packages/manifest.json` only
adds the visual studio and test framework helpers.

## 2. Folder layout

```
Assets/
  Scenes/                Loading, MainMenu, BusGarage, MapSelection,
                         CareerMode, Gameplay, Settings
  Scripts/
    Core/                IBS.Core.asmdef
      MathUtil.cs        engine free math + seeded RNG
      BusSpecs.cs        the eight bus specifications
      VehiclePhysics.cs  heavy vehicle model + collision solver
      Economy.cs         fares, fines, daily rewards, missions
      SaveData.cs        save model + PlayerPrefs persistence
      MapDefinitions.cs  the seven maps + weather presets
      Settings.cs        graphics/audio settings
      AudioFactory.cs    procedural sound synthesis
    Util/                IBS.Util.asmdef  - procedural mesh helpers
    World/               IBS.World.asmdef - road graph, map generator, environment
    Vehicles/            IBS.Vehicles.asmdef - bus model, player bus, traffic AI
    Game/                IBS.Game.asmdef - game manager, camera, HUD, passengers, GPS
    UI/                  IBS.UI.asmdef   - menu controller, touch controls
Tools/
  CompileCheck/          UnityEngine stubs + C# regression suite
  generate_project_files.py  regenerates .meta files, scenes and settings
ProjectSettings/         Unity project settings (landscape, package name, ...)
Packages/manifest.json    package manifest
```

Assembly definitions enforce the dependency direction:
`Util → Core → World → Vehicles → Game → UI`.

## 3. Scenes

| Scene | Purpose |
| --- | --- |
| `Loading` | Boot scene, creates the game manager |
| `MainMenu` | Menu with the rotating showcase bus |
| `BusGarage` | Garage screen (the menu controller switches screens itself) |
| `MapSelection` | Map screen |
| `CareerMode` | Career screen |
| `Gameplay` | Full driving scene: map, traffic, passengers, GPS, HUD, camera rig |
| `Settings` | Settings screen |

The scenes are deliberately thin. `GameManager` builds the world at runtime
from the map definition and the bus specification, which keeps the project
reviewable as plain text and avoids binary prefabs.

## 4. Android build settings

| Setting | Value |
| --- | --- |
| Package name | `in.indianbus3d.game` |
| Version | 1.0 (code 1) |
| Minimum API | 24 (Android 7.0) |
| Target API | automatic (highest installed) |
| Orientation | Landscape (`defaultScreenOrientation: 1`) |
| Scripting backend | IL2CPP, ARM64 only |
| Permissions | none |
| Quality presets | Low / Medium / High / Ultra |

Build steps: `File → Build Settings → Android → Switch Platform → Build`.
The Gradle project is exported to `Builds/Android/`.

## 5. Verifying the C# without Unity

```bash
cd unity/IndianBusSimulator/Tools/CompileCheck
dotnet build CompileCheck.csproj -c Release
dotnet run --project CompileCheck.csproj -c Release --no-build
```

`UnityStubs/UnityEngineStubs.cs` mirrors the Unity API surface the game uses
(signatures verified against the UnityCsReference sources), so the build type
checks every script in `Assets/Scripts`. `Program.cs` then runs the
head-less physics and mission suite against the real C# code.

The same command runs in `.github/workflows/unity-compile-check.yml` on every
push.

## 6. Regenerating the scaffolding

```bash
cd unity/IndianBusSimulator
python3 Tools/generate_project_files.py
```

This recreates the `.meta` files (deterministic GUIDs, so scene references stay
stable), the assembly definitions, the seven scenes, `ProjectSettings` and the
package manifest. Existing files are never overwritten.

## 7. Extending the game

* **New bus** - add an entry to `BusCatalog.All` in `Core/BusSpecs.cs`. The
  garage, the shop, the showcase and the physics pick it up automatically.
* **New map** - add an entry to `MapCatalog.All` in `Core/MapDefinitions.cs`
  and, if it needs a new road layout, extend `RoadNetwork.Build`.
* **New mission** - add an entry to `MissionCatalog.All` in `Core/Economy.cs`.
* **New sound** - extend `Core/AudioFactory.cs`; all clips are synthesised, no
  asset import required.

The playable web build follows the same structure, so features should be
mirrored in `indian-bus-simulator/web/js/` to keep both builds in sync.
