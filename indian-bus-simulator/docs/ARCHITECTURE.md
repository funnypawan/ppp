# Architecture

Both builds of Indian Bus Simulator 3D share the same simulation model and the
same data (bus catalogue, maps, missions, economy). The playable build is
JavaScript; the Unity build is C#. The physics core is a direct port and is
covered by the same expectations in both languages.

---

## 1. Shared conventions

| Concept | Convention |
| --- | --- |
| Map plane | `x` = east, `y` = north |
| Heading | `yaw` in radians, counter-clockwise, `0` = east |
| Body frame | `u` = forward, `v` = left, `r` = yaw rate (counter-clockwise positive) |
| Web build | Three.js `x = map.x`, `z = -map.y`, `object.rotation.y = yaw - PI/2` (models face `-Z`) |
| Unity build | `position = (map.x, 0, map.y)`, `rotation.y = PI/2 - yaw` |
| Doors | Left hand side (India drives on the left) |
| Units | metres, seconds, radians, kilometres per hour for display only |
| Determinism | A seeded `mulberry32` RNG generates every map and bus layout |

---

## 2. Playable build (`indian-bus-simulator/web`)

Plain ES modules, no bundler, no framework. `main.js` boots the renderer and
owns the frame loop.

```
                 ┌──────────────┐
                 │   main.js    │  renderer, frame loop, wiring
                 └──────┬───────┘
        ┌───────────────┼────────────────┬───────────────┐
        ▼               ▼                ▼               ▼
   core/settings   world/maps      vehicles/bus      game/hud
   core/save       world/roadnet   vehicles/traffic  game/camera
   core/input      world/weather   vehicles/specs    game/passengers
   core/audio      world/sky       vehicles/physics  game/gps
```

| Module | Responsibility |
| --- | --- |
| `core/save.js` | localStorage save: money, unlocks, missions, customisation, settings |
| `core/settings.js` | graphics/audio preferences, persisted |
| `core/input.js` | keyboard + touch abstraction into a single input state |
| `core/audio.js` | WebAudio engine/horn/indicator/door sounds, all synthesised |
| `world/mapdefs.js` | the seven map definitions (layout, palette, traffic density) |
| `world/roadnet.js` | road graph: nodes, edges, lanes, speed limits, path finding |
| `world/geo.js` | coordinate helpers, polyline sampling, lane offsets |
| `world/props.js` | buildings, trees, poles, fuel stations, stops, toll plazas |
| `world/maps.js` | builds a map from a definition (geometry + prop placement) |
| `world/sky.js` | sun, sky gradient, stars, fog colours for the time of day |
| `world/weather.js` | weather presets, grip and visibility modifiers |
| `vehicles/specs.js` | the eight bus specifications (mass, power, gears, capacity) |
| `vehicles/physics.js` | the heavy vehicle model + collision solver |
| `vehicles/busmodel.js` | procedural bus mesh (shell, glazing, doors, lights, wheels, interior) |
| `vehicles/bus.js` | the player bus: input → physics → visual state |
| `vehicles/traffic.js` | traffic AI: lane keeping, distance keeping, signals, density |
| `game/economy.js` | fares, fines, running costs, daily rewards |
| `game/missions.js` | mission catalogue and the live mission tracker |
| `game/customization.js` | paint, interior, wheels, rims, lights, horn, stickers, plate, tint |
| `game/camera.js` | six camera modes with smooth transitions |
| `game/hud.js` | speedometer, RPM, gear, fuel, minimap, GPS, passenger counter |
| `game/minimap.js` | top-down map render with stops and the player marker |
| `game/gps.js` | route search and next-turn instructions |
| `game/passengers.js` | spawn, board, seat, drop off, satisfaction, fares |
| `ui/menu.js` | main menu, career, free drive, garage, customisation, maps, rewards, achievements, settings |

### Data flow of a frame

```
input.js ──► bus.js ──► physics.js ──► telemetry
                │            ▲
                │            └── collision (colliders from the map)
                ▼
             busmodel.js (wheels, doors, lights, indicators)
                │
traffic.js ────┼──► camera.js ──► camera transform
passengers.js ─┘
hud.js / minimap.js read the telemetry and the world state
```

### Rendering

* WebGL via Three.js r0.187 (vendored, MIT licence).
* Meshes are generated procedurally (boxes, cylinders, cones, ribbons) so the
  APK stays around 4.5 MB.
* Materials are simple `MeshStandardMaterial`/`MeshBasicMaterial` instances;
  textures are small procedural canvases.
* Shadows are only enabled on the "High"/"Ultra" graphics presets.

---

## 3. Unity project (`unity/IndianBusSimulator`)

C# with assembly definitions per layer, so the dependency direction is
enforced by the compiler.

```
IBS.Util   (no dependencies)      procedural mesh helpers
IBS.Core   (no dependencies)      math, bus catalogue, vehicle physics,
                                   economy, missions, save, settings, audio
IBS.World  → IBS.Core             road network, map generator, environment
IBS.Vehicles → IBS.Core, World    bus model, bus entity, traffic AI
IBS.Game   → Core, World, Vehicles game manager, camera rig, HUD, passengers, GPS
IBS.UI     → Core, World, Vehicles, Game   menu controller, touch controls
```

| Script | Responsibility |
| --- | --- |
| `Core/MathUtil.cs` | engine-free math plus the deterministic RNG |
| `Core/BusSpecs.cs` | the eight bus specifications and the torque/gear helpers |
| `Core/VehiclePhysics.cs` | port of the JavaScript physics + collision solver |
| `Core/Economy.cs` | fares, fines, daily rewards, mission catalogue and tracker |
| `Core/SaveData.cs` | save data model + `PlayerPrefs` persistence |
| `Core/MapDefinitions.cs` | the seven maps and the six weather presets |
| `Core/Settings.cs` | graphics/audio settings applied to the quality system |
| `Core/AudioFactory.cs` | procedurally synthesised engine, horn, air brake, door, rain clips |
| `Util/ProceduralMesh.cs` | box, cylinder, cone, quad, ribbon meshes + material helpers |
| `Vehicles/BusModelBuilder.cs` | builds the bus hierarchy from a specification |
| `Vehicles/BusEntity.cs` | player bus: physics, doors, lights, indicators, wheels |
| `Vehicles/TrafficSystem.cs` | traffic AI with lane keeping and player awareness |
| `World/RoadNetwork.cs` | road graph generation per map layout + BFS routing |
| `World/MapGenerator.cs` | turns the graph into terrain, roads, props and stops |
| `World/EnvironmentController.cs` | day/night cycle, weather, precipitation, grip |
| `Game/GameManager.cs` | boots the save, builds sessions, runs the main loop |
| `Game/CameraRig.cs` | six camera modes with exponential smoothing |
| `Game/HudController.cs` | IMGUI HUD and the touch control layout |
| `Game/PassengerSystem.cs` | passenger spawning, boarding, drop off, satisfaction |
| `Game/GpsNavigator.cs` | route calculation and turn instructions |
| `UI/MenuController.cs` | every menu screen |

### Scenes

`Loading`, `MainMenu`, `BusGarage`, `MapSelection`, `CareerMode`, `Gameplay`,
`Settings`. The scenes are intentionally thin: `GameManager` builds the world
at runtime from data, so no binary prefabs are needed and every asset is
reviewable as text.

### The compile-check harness

`Tools/CompileCheck` contains

* `UnityStubs/UnityEngineStubs.cs` - the subset of the Unity API the game
  uses (signatures cross-checked against the UnityCsReference sources),
* `Program.cs` - a head-less regression suite over the engine-free core,
* `CompileCheck.csproj` - includes every script under `Assets/Scripts`.

`dotnet build` therefore type-checks the *entire* Unity source tree, and
`dotnet run` executes the physics and mission assertions against the real C#
code (not the stubs).

---

## 4. Persistence

| Store | Platform | Contents |
| --- | --- | --- |
| `localStorage` key `ibs3d.save.v1` | Web / Android app | money, unlocks, customisation, mission progress, settings |
| `PlayerPrefs` key `ibs3d.save.v1` | Unity | the same model in JSON |

Both are versioned so a future format change can migrate instead of resetting.
