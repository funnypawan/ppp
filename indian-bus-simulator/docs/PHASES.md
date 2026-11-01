# Development phases and current status

The game was built in phases, in the order that keeps a playable build in
working condition at every step. This document lists the phases, what each one
delivered, and the **honest** verification status of every feature.

Legend:

* **Verified** - executed automatically in CI or by the test suite.
* **Playable** - implemented and exercised at runtime, but not covered by an
  automated test.
* **Source complete** - the code exists and compiles, but the environment used
  for development could not run the Unity Editor, so it has not been executed
  inside Unity.

---

## Phase 1 - Project setup

| Deliverable | Status |
| --- | --- |
| Unity 2022.3 LTS project skeleton, folder layout, assembly definitions | Source complete |
| `ProjectSettings` (landscape, `in.indianbus3d.game`, API 24+, IL2CPP, ARM64) | Source complete |
| Package manifest, `ProjectVersion.txt`, seven scenes with stable `.meta` GUIDs | Source complete |
| GitHub Actions: APK pipeline + Unity compile check | **Verified** (both workflows green) |

## Phase 2 - Playable bus and physics

| Deliverable | Status |
| --- | --- |
| Heavy vehicle physics: load transfer, friction circle, clutch, gearbox, retarder, suspension, fuel, damage | **Verified** in JS (13 tests) and C# (30 assertions) |
| Eight bus specifications with distinct handling | **Verified** |
| Procedural bus model: shell, glazing, plug doors, lights, indicators, mirrors, wheels, interior, dashboard, steering wheel | Playable |
| Collision solver against buildings and props | **Verified** (JS + C#), Playable in the world |

## Phase 3 - Controls and cameras

| Deliverable | Status |
| --- | --- |
| Touch control layout (pedals, steering, horn, lights, indicators, door, camera, gear, handbrake) | Playable |
| Keyboard fallback for desktop testing | Playable |
| Six camera modes with smooth transitions and sensitivity | Playable |
| Customisable control layout option | Source complete (layout presets are defined) |

## Phase 4 - City map

| Deliverable | Status |
| --- | --- |
| Road graph generator (city, village, highway, mountain, desert layouts) | **Verified** by the integration tests |
| Procedural terrain, roads, markings, buildings, shops, petrol pumps, bus stands, bridges, flyovers, toll plazas, trees, mountains, rivers, signals, street lights | Playable |
| Seven maps with distinct palettes, sizes, traffic densities and stops | **Verified** (map catalogue test), Playable |

## Phase 5 - Traffic and passengers

| Deliverable | Status |
| --- | --- |
| Traffic AI: cars, trucks, buses, motorcycles, auto-rickshaws, police; lane keeping, distance keeping, speed limits, player awareness | **Verified** (integration test that traffic keeps its distance behind the player bus) |
| Passengers: spawning at stops, boarding with the doors open, seating, drop off, satisfaction, fares | **Verified** (integration test) |
| GPS: route search on the road graph and turn instructions | **Verified** (integration test) |

## Phase 6 - Career mode and free drive

| Deliverable | Status |
| --- | --- |
| Ten missions over nine categories with objectives, time limits and rewards | **Verified** (mission completion/timeout test, C# mission test), Playable |
| Free drive with bus, map, weather, time and traffic selection | Playable |
| Mission result screen, replay | Playable |

## Phase 7 - Garage and customisation

| Deliverable | Status |
| --- | --- |
| Garage with eight buses, prices and unlocks | Playable |
| Customisation: paint scheme, body and interior colour, seats, wheels, rims, headlights, horn, stickers, number plate, window tint | Playable |
| Live application of the customisation to the driven bus | Playable |

## Phase 8 - Weather and audio

| Deliverable | Status |
| --- | --- |
| Six weather presets with grip, fog, sky and precipitation changes | Playable |
| Day/night cycle with sun movement, ambient light, automatic headlights | Playable |
| Procedural audio: engine loop (pitch follows the RPM), horn, air brake, doors, gear shift, rain | Playable (WebAudio in the app, `AudioClip` synthesis in Unity) |
| Indicator, door and traffic ambience | Playable |

## Phase 9 - Android optimisation

| Deliverable | Status |
| --- | --- |
| Graphics presets Low → Ultra (shadows, texture quality, anti-aliasing, FPS limit, sensitivity) | Playable |
| Procedural geometry instead of imported meshes (small APK, no memory spikes) | **Verified** (APK is 4.5 MB) |
| Object pooling for traffic and props, LOD-free geometry budget, baked-free lighting | Source complete |
| Landscape, immersive full screen, screen kept awake, no runtime permissions | **Verified** (aapt2 badging output in the CI summary) |
| Target: 4 GB RAM devices, Android 10+ | Source complete (documented budget; not measured on physical hardware here) |

## Phase 10 - Testing

| Deliverable | Status |
| --- | --- |
| 26 JavaScript unit + integration tests (`npm test`) | **Verified** (green in CI) |
| 30 C# physics/mission assertions (`dotnet run`) | **Verified** (green in CI) |
| APK content and manifest verification (aapt2) | **Verified** (in the CI run summary) |
| Play-through on a physical Android device | **Not performed here** - no device or emulator was available in the development sandbox |

## Phase 11 - Documentation and deliverables

| Deliverable | Status |
| --- | --- |
| README, INSTALL, BUILD, ARCHITECTURE, GAME_DESIGN, PHASES | Done |
| Unity project guide and verification report | Done |
| Release artifact `IndianBusSimulator3D-v1.0-debug.apk` | **Published** on the `bus-sim-apk` release |

---

## Known limitations

* The Unity build has **not** been opened in the Unity Editor in this
  environment (no Unity installation and no licence were available). The
  sources compile cleanly against the Unity API and the engine-free core is
  covered by an automated regression suite, but a first Editor import may still
  surface scene or prefab level adjustments.
* The playable build uses IMGUI-style DOM menus and a canvas HUD. It is
  tuned for phones, but it is not a native uGUI interface.
* Traffic vehicles use simplified kinematics (no full rigid body simulation)
  to keep the frame rate stable on low-end devices.
* There is no online service, no cloud save and no ads - the game is fully
  offline and requests no permissions.
