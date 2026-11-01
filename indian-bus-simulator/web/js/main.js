/**
 * Indian Bus Simulator 3D — application entry point.
 *
 * Owns the renderer, the menu showroom scene, the gameplay session and the
 * main loop. Everything is offline: no network calls, no external assets.
 */

import * as THREE from '../vendor/three.module.js';

import { SaveSystem } from './core/save.js';
import { SettingsStore, QUALITY_PRESETS } from './core/settings.js';
import { InputManager } from './core/input.js';
import { AudioEngine } from './core/audio.js';

import { getMapDef, MAP_DEFS, WEATHER_BY_ID } from './world/mapdefs.js';
import { generateMap } from './world/maps.js';
import { SkySystem } from './world/sky.js';
import { WeatherSystem } from './world/weather.js';

import { getBusSpec, BUS_SPECS } from './vehicles/specs.js';
import { Bus } from './vehicles/bus.js';
import { TrafficSystem } from './vehicles/traffic.js';

import { CameraRig, CAMERA_MODES } from './game/camera.js';
import { Hud } from './game/hud.js';
import { GpsNavigator } from './game/gps.js';
import { PassengerSystem } from './game/passengers.js';
import { MissionSession, MISSION_BY_ID } from './game/missions.js';
import {
  evaluateAchievements,
  dailyRewardState,
  passengerFare,
  tripRunningCost,
  speedFine,
  collisionFine,
  busUnlockPrice,
} from './game/economy.js';

import { MenuManager } from './ui/menu.js';

const FIXED_DT = 1 / 120;

export class GameApp {
  constructor() {
    this.canvas = document.getElementById('scene');
    this.uiRoot = document.getElementById('ui-root');
    this.save = new SaveSystem();
    this.save.load();
    this.settings = new SettingsStore(this.save);
    this.input = new InputManager(window);
    this.audio = new AudioEngine();
    this.clock = new THREE.Clock();
    this.accumulator = 0;
    this.frameTimes = [];
    this.session = null;
    this.menuMode = 'loading';
    this.paused = false;
    this.lastFps = 60;
    this.fpsAccum = 0;
    this.fpsFrames = 0;
    this.pendingToast = null;

    this._initRenderer();
    this._initShowroom();
    this.menu = new MenuManager(this);
    this.hud = new Hud(this.uiRoot, this.input, {
      currentCamera: () => this.session?.camera?.mode || this.settings.get('cameraMode'),
    });

    this.input.on('action', (action) => this._onAction(action));
    window.addEventListener('resize', () => this._resize());
    window.addEventListener('pointerdown', () => this.audio.init(), { once: true });
    this._resize();

    this.menu.show('loading');
    setTimeout(() => {
      this.menu.show('menu');
      this.menuMode = 'menu';
    }, 700);
  }

  /* ------------------------------------------------------------- renderer */

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: this.settings.get('antialias'),
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(this._pixelRatio());
    this.renderer.shadowMap.enabled = this.settings.get('shadows');
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
  }

  _pixelRatio() {
    const base = Math.min(window.devicePixelRatio || 1, 2);
    return Math.max(0.5, base * this.settings.get('pixelRatio'));
  }

  _resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(this._pixelRatio());
    if (this.showroomCamera) {
      this.showroomCamera.aspect = w / h;
      this.showroomCamera.updateProjectionMatrix();
    }
    if (this.session?.camera) {
      this.session.camera.aspect = w / h;
      this.session.camera.updateProjectionMatrix();
    }
  }

  /* ------------------------------------------------------------- showroom */

  _initShowroom() {
    this.showroomScene = new THREE.Scene();
    this.showroomScene.background = new THREE.Color(0x0d1418);
    this.showroomCamera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    this.showroomCamera.position.set(0, 3.4, 9);
    this.showroomCamera.lookAt(0, 1.4, 0);

    const key = new THREE.DirectionalLight(0xfff0d8, 1.5);
    key.position.set(6, 10, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -12;
    key.shadow.camera.right = 12;
    key.shadow.camera.top = 12;
    key.shadow.camera.bottom = -12;
    this.showroomScene.add(key);

    const rim = new THREE.DirectionalLight(0x6fa8ff, 0.7);
    rim.position.set(-7, 4, -6);
    this.showroomScene.add(rim);

    this.showroomScene.add(new THREE.HemisphereLight(0x9fd0e8, 0x2a2622, 0.55));

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(14, 48),
      new THREE.MeshLambertMaterial({ color: 0x1b2226 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.showroomScene.add(floor);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(6.4, 0.06, 6, 64),
      new THREE.MeshBasicMaterial({ color: 0x2f7f6f })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.03;
    this.showroomScene.add(ring);

    this.showroomTurntable = new THREE.Group();
    this.showroomScene.add(this.showroomTurntable);
    this.showroomBus = null;
    this.showroomSpecId = null;
  }

  setShowroomBus(specId, custom) {
    if (this.showroomSpecId === specId && this.showroomBus) {
      if (custom) {
        import('../vehicles/busmodel.js').then((m) =>
          m.applyCustomization(this.showroomBus, custom, getBusSpec(specId))
        );
      }
      return;
    }
    const spec = getBusSpec(specId);
    if (this.showroomBus) {
      this.showroomTurntable.remove(this.showroomBus);
      this.showroomBus = null;
    }
    import('../vehicles/busmodel.js').then((m) => {
      const model = m.buildBusModel(spec, custom || {});
      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      this.showroomBus = model;
      this.showroomSpecId = specId;
      this.showroomTurntable.add(model);
    });
  }

  /* -------------------------------------------------------------- session */

  startCareer(missionId) {
    const mission = MISSION_BY_ID[missionId];
    if (!mission) return false;
    this._startSession({
      mode: 'career',
      mission,
      mapId: mission.map,
      busId: mission.bus || this.save.data.selectedBus,
      weather: getMapDef(mission.map).defaultWeather,
      hour: getMapDef(mission.map).defaultTime,
      trafficDensity: getMapDef(mission.map).trafficDensity,
    });
    return true;
  }

  startFreeDrive(options = {}) {
    this._startSession({
      mode: 'free',
      mission: null,
      mapId: options.mapId || this.save.data.selectedMap,
      busId: options.busId || this.save.data.selectedBus,
      weather: options.weather || 'clear',
      hour: options.hour ?? 9,
      trafficDensity: options.trafficDensity ?? 0.6,
      timeOfDay: options.timeOfDay || 'day',
    });
  }

  _startSession(config) {
    this.teardownSession();
    const mapDef = getMapDef(config.mapId);
    const spec = getBusSpec(config.busId);
    const custom = this.save.getCustomization(config.busId);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(mapDef.palette.sky);

    const quality = this.settings.get('quality');
    const map = generateMap(config.mapId, {
      seed: 1337,
      quality,
      shadows: this.settings.get('shadows'),
    });
    scene.add(map.group);

    const sky = new SkySystem(scene, this.renderer);
    sky.setHour(config.hour ?? mapDef.defaultTime);
    sky.setShadowQuality(this.settings.get('shadowQuality'));
    sky.setTimeScale(0);

    const weather = new WeatherSystem(scene, quality);
    weather.setWeather(config.weather || mapDef.defaultWeather);

    const camera = new THREE.PerspectiveCamera(62, 1, 0.3, 1200);
    camera.position.set(0, 6, 14);
    const rig = new CameraRig(camera, {
      mode: this.settings.get('cameraMode'),
      sensitivity: this.settings.get('cameraSensitivity'),
    });

    const start = map.startPose;
    const bus = new Bus(spec, custom, {
      x: start.x,
      y: start.y,
      yaw: 0,
      autoGearbox: this.settings.get('autoGearbox'),
    });
    bus.group.userData.spec = spec;
    scene.add(bus.group);

    const traffic = new TrafficSystem(scene, map, {
      density: (config.trafficDensity ?? mapDef.trafficDensity) *
        QUALITY_PRESETS[quality].trafficDensityScale,
      quality,
    });

    const passengers = new PassengerSystem(map, spec, {
      onEvent: (type, data) => this._onPassengerEvent(type, data),
    });

    const gps = new GpsNavigator(map.network);
    gps._lastNode = 0;
    const destination = map.destinations[map.destinations.length - 1] || map.startPose;
    gps.setDestination(destination.x, destination.y);

    this.session = {
      mode: config.mode,
      mission: config.mission,
      missionSession: config.mission ? new MissionSession(config.mission) : null,
      map,
      mapDef,
      bus,
      traffic,
      passengers,
      gps,
      sky,
      weather,
      camera,
      rig,
      scene,
      elapsed: 0,
      odometerStart: bus.physics.odometer,
      distanceKm: 0,
      fines: 0,
      collisions: 0,
      perfect: true,
      fuelUsed: 0,
      satisfaction: 1,
      speedLimit: mapDef.layout === 'highway' ? 80 : 60,
      routeTarget: destination,
      startedAt: Date.now(),
      timeScale: 1,
    };

    this.hud.attachMap(map);
    this.menu.show('play');
    this.menuMode = 'play';
    this.paused = false;
    this.audio.init();
    this.hud.toast(
      config.mode === 'career'
        ? `Mission: ${config.mission.title}`
        : `Free drive — ${mapDef.name}`
    );
  }

  teardownSession() {
    if (!this.session) return;
    const s = this.session;
    s.traffic.dispose();
    if (s.scene) {
      s.scene.traverse((obj) => {
        if (obj.isMesh || obj.isInstancedMesh) {
          obj.geometry?.dispose?.();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.());
          else obj.material?.dispose?.();
        }
      });
    }
    this.session = null;
  }

  exitToMenu() {
    this.teardownSession();
    this.menu.show('menu');
    this.menuMode = 'menu';
  }

  pause() {
    if (this.menuMode !== 'play' || this.paused) return;
    this.paused = true;
    this.menu.show('pause');
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.menu.show('play');
  }

  /* --------------------------------------------------------------- events */

  _onAction(action) {
    if (this.menuMode !== 'play' || !this.session) {
      if (action === 'pause' && this.menuMode === 'play') this.pause();
      return;
    }
    const s = this.session;
    switch (action) {
      case 'horn':
        s.bus.honk();
        this.audio.horn(this.save.getCustomization(s.bus.spec.id).horn || 'air');
        break;
      case 'lights':
        s.bus.setHeadlights(!s.bus.headlightsOn);
        this.audio.blip(520, 0.05);
        break;
      case 'indicatorLeft':
        s.bus.toggleIndicator(-1);
        this.audio.tick();
        break;
      case 'indicatorRight':
        s.bus.toggleIndicator(1);
        this.audio.tick();
        break;
      case 'camera':
        s.rig.cycleMode(1);
        this.settings.set('cameraMode', s.rig.mode);
        break;
      case 'doors': {
        const open = s.bus.toggleDoors();
        this.audio.door();
        this.hud.toast(open ? 'Doors open — passengers boarding' : 'Doors closed');
        break;
      }
      case 'reverse':
        s.bus.physics.setGear(s.bus.physics.gear === -1 ? 1 : -1);
        this.audio.gearShift(s.bus.physics.gear < 0);
        break;
      case 'gearUp':
        s.bus.physics.shiftUp();
        this.audio.gearShift(true);
        break;
      case 'gearDown':
        s.bus.physics.shiftDown();
        this.audio.gearShift(false);
        break;
      case 'pause':
        this.pause();
        break;
      case 'map':
        this.menu.toggleBigMap();
        break;
      case 'refuel':
        this._tryRefuel();
        break;
      default:
        break;
    }
  }

  _onPassengerEvent(type, data) {
    if (!this.session) return;
    if (type === 'alight') {
      const fare = passengerFare(2.5, this.session.passengers.averageSatisfaction());
      this.save.addMoney(fare);
      this.save.addStat('passengersDelivered', data.count);
      this.save.addStat('totalFares', fare);
      this.save.addStat('trips', 0);
      this.hud.toast(`₹${fare} collected — ${data.count} passenger(s) dropped`);
      if (this.session.missionSession) this.session.missionSession.onPassengerDropped(
        this.session.passengers.averageSatisfaction()
      );
    } else if (type === 'board') {
      if (this.session.missionSession) this.session.missionSession.onPassengerPicked();
      this.hud.toast(`${data.count} passenger(s) on board`);
    }
  }

  _tryRefuel() {
    const s = this.session;
    if (!s) return;
    const station = s.map.fuelStations.find(
      (f) => Math.hypot(f.x - s.bus.physics.x, f.y - s.bus.physics.y) < f.radius
    );
    if (!station) {
      this.hud.toast('No fuel station nearby');
      return;
    }
    if (Math.abs(s.bus.physics.speed) > 1) {
      this.hud.toast('Stop the bus at the fuel pump first');
      return;
    }
    const added = s.bus.refuel(s.bus.spec.fuelTank);
    const cost = Math.round(added * 92);
    this.save.spendMoney(cost);
    this.hud.toast(`Refuelled ${Math.round(added)} L for ₹${cost}`);
  }

  /* ------------------------------------------------------------ main loop */

  start() {
    const loop = () => {
      requestAnimationFrame(loop);
      this._frame();
    };
    loop();
  }

  _frame() {
    const dt = Math.min(0.1, this.clock.getDelta());

    // FPS counter + limiter.
    this.fpsAccum += dt;
    this.fpsFrames += 1;
    if (this.fpsAccum >= 0.5) {
      this.lastFps = this.fpsFrames / this.fpsAccum;
      this.fpsAccum = 0;
      this.fpsFrames = 0;
    }
    const limit = this.settings.get('fpsLimit');
    if (limit && limit > 0) {
      const minFrame = 1 / limit;
      if (dt < minFrame) {
        // Skip rendering this frame to honour the cap.
        return;
      }
    }

    this.menu.tick(dt);

    if (this.menuMode === 'play' && this.session) {
      if (!this.paused) this._updateGame(dt);
      this._renderGame(dt);
    } else {
      this._renderMenu(dt);
    }
    this.save.tick(dt, 25);
  }

  _updateGame(dt) {
    const s = this.session;
    const input = this.input.read({});
    const bus = s.bus;

    // Doors can only be operated while stopped.
    if (bus.doorTarget > 0.5 && Math.abs(bus.physics.speed) > 0.6) {
      bus.setDoorsOpen(false);
    }

    const environment = {
      grip: s.weather.grip,
      slope: this._slopeAt(bus.physics.x, bus.physics.y),
      rollingResistance: s.weather.grip < 0.8 ? 0.013 : 0.009,
      windSpeed: s.weather.windSpeed,
      surfaceRoughness: s.weather.grip < 0.8 ? 0.4 : 0,
    };

    this.accumulator += dt;
    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < 12) {
      bus.update(FIXED_DT, input, { colliders: s.map.colliders, environment });
      this.accumulator -= FIXED_DT;
      steps += 1;
    }

    const telemetry = bus.physics.telemetry();

    // Collisions.
    if (bus.onImpact) {
      const force = bus.onImpact;
      bus.onImpact = 0;
      this.audio.impact(Math.min(1, force / 8));
      s.rig.addShake(Math.min(0.8, force / 10));
      s.collisions += 1;
      s.perfect = false;
      this.save.addStat('crashes', 1);
      const fine = collisionFine(Math.min(1, force / 12));
      if (fine > 0 && this.settings.get('autoFines') !== false) {
        this.save.spendMoney(fine);
        s.fines += fine;
        this.hud.toast(`Collision! Fine ₹${fine}`);
      }
      if (s.missionSession) s.missionSession.onCollision(bus.physics.damage);
    }

    // Traffic + passengers + navigation.
    s.traffic.update(dt, { x: bus.physics.x, y: bus.physics.y, heading: bus.physics.yaw });
    s.passengers.update(dt, {
      x: bus.physics.x,
      y: bus.physics.y,
      speed: telemetry.speed,
      doorsOpen: bus.doorsOpen,
      lateralG: bus.physics.lateralG,
      longitudinalG: bus.physics.longitudinalG,
    });
    const guidance = s.gps.update({ x: bus.physics.x, y: bus.physics.y, heading: bus.physics.yaw });

    // Distance + fuel accounting.
    s.distanceKm = (bus.physics.odometer - s.odometerStart) / 1000;
    s.elapsed += dt;
    this.save.addStat('distanceKm', (s.distanceKm - (s.lastDistanceKm || 0)));
    s.lastDistanceKm = s.distanceKm;
    this.save.addStat('playTimeSec', dt);

    // Speed limit check.
    const limit = s.speedLimit;
    if (telemetry.speedKmh > limit + 4) {
      if (!s.overSpeed) {
        s.overSpeed = true;
        const fine = speedFine(limit, telemetry.speedKmh);
        if (fine > 0) {
          this.save.spendMoney(fine);
          s.fines += fine;
          this.hud.toast(`Speeding! Fine ₹${fine}`);
        }
        if (s.missionSession) s.missionSession.onSpeedViolation();
      }
    } else {
      s.overSpeed = false;
    }

    // Mission evaluation.
    if (s.missionSession) {
      s.missionSession.distanceKm = s.distanceKm;
      const status = s.missionSession.update(dt, {
        damage: bus.physics.damage,
      });
      if (status === 'complete') this._completeMission();
      else if (status === 'failed') this._failMission();
    }

    // Fuel warning.
    if (bus.physics.fuel < 6 && !s.fuelWarned) {
      s.fuelWarned = true;
      this.hud.toast('Low fuel — find a petrol pump');
    }

    // Audio state.
    this.audio.update({
      rpm: telemetry.rpm,
      maxRpm: bus.spec.maxRpm,
      load: bus.physics.engineLoad,
      speed: telemetry.speed,
      inRain: s.weather.intensity,
      passengers: s.passengers.onboard,
      engineOn: bus.engineOn,
    });

    // HUD.
    this.hud.update(dt, {
      speedKmh: telemetry.speedKmh,
      rpm: telemetry.rpm,
      maxRpm: bus.spec.maxRpm,
      gear: telemetry.gear,
      fuel: telemetry.fuel,
      fuelCapacity: bus.spec.fuelTank,
      gpsInstruction: guidance.instruction,
      gpsDistance: guidance.distance,
      passengers: s.passengers.onboard,
      passengerCapacity: s.passengers.capacity,
      satisfaction: s.passengers.averageSatisfaction(),
      mission: s.missionSession,
      weatherIcon: (WEATHER_BY_ID[s.weather.current] || {}).icon || '☀️',
      weatherName: (WEATHER_BY_ID[s.weather.current] || {}).name || 'Clear',
      clock: this._clockText(s.sky.hour),
      speedLimit: limit,
      overSpeedLimit: telemetry.speedKmh > limit + 4,
      damage: bus.physics.damage,
    });
  }

  _clockText(hour) {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}:${String(m).padStart(2, '0')} ${suffix}`;
  }

  _slopeAt(x, y) {
    const s = this.session;
    if (!s) return 0;
    // The mountain map climbs; derive a gradient from the elevation of the
    // nearest road node.
    const near = s.map.network.nearestEdgePoint(x, y, 60);
    if (!near) return 0;
    const edge = near.edge;
    const p0 = edge.points[0];
    const p1 = edge.points[edge.points.length - 1];
    const dz = (p1.z || 0) - (p0.z || 0);
    const dist = Math.max(1, edge.length);
    return Math.atan2(dz, dist);
  }

  _completeMission() {
    const s = this.session;
    if (s.completed) return;
    s.completed = true;
    const reward = s.missionSession.reward;
    this.save.addMoney(reward);
    this.save.addStat('trips', 1);
    if (s.perfect) this.save.addStat('perfectDrives', 1);
    if (!this.save.data.completedMissions.includes(s.mission.id)) {
      this.save.data.completedMissions.push(s.mission.id);
    }
    this.save.data.missionStars[s.mission.id] = 3;
    this._checkAchievements();
    this.hud.toast(`Mission complete! +₹${reward}`);
    this.menu.show('mission-complete');
  }

  _failMission() {
    const s = this.session;
    if (s.failed) return;
    s.failed = true;
    this.hud.toast(`Mission failed: ${s.missionSession.failReason}`);
    this.menu.show('mission-failed');
  }

  _checkAchievements() {
    const stats = this.save.data.stats;
    const unlocked = evaluateAchievements(this.save.data.achievements, stats, {
      busCount: this.save.data.unlockedBuses.length,
    });
    for (const a of unlocked) {
      this.save.addMoney(a.reward);
      this.hud.toast(`Achievement: ${a.name} (+₹${a.reward})`);
    }
    if (unlocked.length) this.save.markDirty();
  }

  _renderGame(dt) {
    const s = this.session;
    s.rig.update(dt, s.bus.group, s.bus.physics.telemetry());
    s.sky.update(dt, s.camera.position);
    s.weather.update(dt, s.camera.position, s.scene);
    // Night lamps glow.
    const night = s.sky.hour < 6.2 || s.sky.hour > 18.2;
    for (const mesh of s.map.emissiveMeshes) {
      mesh.visible = night;
    }
    this.renderer.render(s.scene, s.camera);
  }

  _renderMenu(dt) {
    this.showroomTurntable.rotation.y += dt * 0.25;
    if (this.showroomBus) {
      this.showroomBus.rotation.y = 0;
    }
    this.renderer.render(this.showroomScene, this.showroomCamera);
  }

  /* ------------------------------------------------------------ utilities */

  unlockBus(id) {
    const price = busUnlockPrice(id);
    if (this.save.isBusUnlocked(id)) return true;
    if (!this.save.spendMoney(price)) return false;
    this.save.unlockBus(id);
    this.save.data.selectedBus = id;
    this.save.markDirty();
    return true;
  }

  unlockMap(id) {
    const def = getMapDef(id);
    if (this.save.isMapUnlocked(id)) return true;
    if (!this.save.spendMoney(def.price)) return false;
    this.save.unlockMap(id);
    this.save.data.selectedMap = id;
    this.save.markDirty();
    return true;
  }

  dailyRewardInfo() {
    const today = Math.floor(Date.now() / 86400000);
    return dailyRewardState(this.save.data.daily, today);
  }
}

const app = new GameApp();
app.start();
window.gameApp = app;
export default app;
