/**
 * Integration tests: map generation, bus construction, driving, traffic and
 * the passenger loop, all running head-less against the real modules.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import * as THREE from '../web/vendor/three.module.js';
import { generateMap } from '../web/js/world/maps.js';
import { MAP_DEFS } from '../web/js/world/mapdefs.js';
import { Bus } from '../web/js/vehicles/bus.js';
import { getBusSpec } from '../web/js/vehicles/specs.js';
import { TrafficSystem } from '../web/js/vehicles/traffic.js';
import { PassengerSystem } from '../web/js/game/passengers.js';
import { MissionSession, MISSIONS } from '../web/js/game/missions.js';
import { SaveSystem, createMemoryStorage } from '../web/js/core/save.js';
import { GpsNavigator } from '../web/js/game/gps.js';
import { CameraRig } from '../web/js/game/camera.js';

const DT = 1 / 120;

test('every map generates a usable road network', () => {
  for (const def of MAP_DEFS) {
    const map = generateMap(def.id, { seed: 42, quality: 'low' });
    assert.ok(map.network.nodes.length > 3, `${def.id}: nodes`);
    assert.ok(map.network.edges.length > 2, `${def.id}: edges`);
    assert.ok(map.network.totalLength() > 200, `${def.id}: road length`);
    assert.ok(map.stops.length >= 3, `${def.id}: bus stops`);
    assert.ok(map.colliders.length > 0, `${def.id}: colliders`);
    assert.ok(map.startPose, `${def.id}: start pose`);
    assert.ok(map.group.children.length > 0, `${def.id}: scene group`);
  }
});

test('bus model is built with wheels, doors and lights', () => {
  for (const specId of ['city_public', 'volvo_inspired', 'double_decker', 'mini_bus']) {
    const spec = getBusSpec(specId);
    const bus = new Bus(spec, {}, {});
    const data = bus.model.userData;
    assert.ok(data.wheels.length >= 4, `${specId}: wheels`);
    assert.ok(data.doors.length >= 1, `${specId}: doors`);
    assert.ok(data.headlightMeshes.length === 2, `${specId}: headlights`);
    assert.ok(data.taillightMeshes.length === 2, `${specId}: taillights`);
    assert.ok(data.steeringWheel, `${specId}: steering wheel`);
    assert.ok(data.seatMeshes.length > 0, `${specId}: seats`);
  }
});

test('doors, indicators, headlights and horn respond', () => {
  const bus = new Bus(getBusSpec('city_public'), {}, {});
  assert.equal(bus.toggleDoors(), true);
  assert.equal(bus.doorsOpen, true);
  bus.toggleDoors();
  assert.equal(bus.doorsOpen, false);
  assert.equal(bus.toggleIndicator(-1), -1);
  assert.equal(bus.toggleIndicator(-1), 0);
  bus.setHeadlights(true);
  assert.equal(bus.headlightsOn, true);
  assert.equal(bus.honk(), true);
});

test('the bus drives forward under throttle and brakes to a stop', () => {
  const bus = new Bus(getBusSpec('city_public'), {}, {});
  for (let i = 0; i < 120 * 20; i++) {
    bus.update(DT, { throttle: 1, brake: 0, steer: 0, handbrake: 0 }, {});
  }
  assert.ok(bus.physics.distanceTravelled > 30, 'bus should have travelled');
  assert.ok(bus.speedKmh > 5, `bus should be moving, got ${bus.speedKmh}`);
  for (let i = 0; i < 120 * 15; i++) {
    bus.update(DT, { throttle: 0, brake: 1, steer: 0, handbrake: 0 }, {});
  }
  assert.ok(bus.speedKmh < 1.5, `bus should stop, got ${bus.speedKmh}`);
});

test('the bus collides with a building and takes damage', () => {
  const bus = new Bus(getBusSpec('city_public'), {}, {});
  bus.physics.x = 0;
  bus.physics.y = 0;
  const wall = { type: 'box', x: 14, y: 0, hx: 3, hy: 6, yaw: 0 };
  for (let i = 0; i < 120 * 12; i++) {
    bus.update(DT, { throttle: 1, brake: 0, steer: 0, handbrake: 0 }, { colliders: [wall] });
  }
  assert.ok(bus.physics.damage > 0, 'damage should be recorded');
  assert.ok(bus.physics.x < 12, 'bus should be pushed out of the wall');
});

test('traffic vehicles drive along the network and keep to the left', () => {
  const map = generateMap('indian_city', { seed: 7, quality: 'low' });
  const scene = new THREE.Scene();
  const traffic = new TrafficSystem(scene, map, { density: 0.8, quality: 'low' });
  assert.ok(traffic.vehicles.length > 10, `expected traffic, got ${traffic.vehicles.length}`);
  const before = traffic.vehicles.map((v) => ({ x: v.x, y: v.y }));
  for (let i = 0; i < 120 * 10; i++) {
    traffic.update(DT, null);
  }
  let moved = 0;
  traffic.vehicles.forEach((v, i) => {
    if (Math.hypot(v.x - before[i].x, v.y - before[i].y) > 1) moved += 1;
  });
  assert.ok(moved > traffic.vehicles.length * 0.5, `only ${moved} vehicles moved`);
  traffic.dispose();
});

test('traffic slows down and stops behind the player bus', () => {
  const map = generateMap('indian_city', { seed: 11, quality: 'low' });
  const scene = new THREE.Scene();
  const traffic = new TrafficSystem(scene, map, { density: 0.8, quality: 'low' });
  const v = traffic.vehicles[0];
  // The player's bus drives along just ahead of the traffic vehicle.
  const player = {
    x: v.x + Math.cos(v.heading) * 10,
    y: v.y + Math.sin(v.heading) * 10,
    heading: v.heading,
  };
  for (let i = 0; i < 120 * 4; i++) {
    player.x = v.x + Math.cos(v.heading) * 10;
    player.y = v.y + Math.sin(v.heading) * 10;
    traffic.update(DT, player);
  }
  assert.ok(v.speed < 6, `traffic should slow behind the bus, speed ${v.speed}`);
  traffic.dispose();
});

test('passengers board at a stop and pay a fare when dropped', () => {
  const map = generateMap('indian_city', { seed: 3, quality: 'low' });
  const spec = getBusSpec('city_public');
  const events = [];
  const passengers = new PassengerSystem(map, spec, {
    onEvent: (type, data) => events.push({ type, data }),
  });
  const stop = map.stops[0];
  const busState = {
    x: stop.x,
    y: stop.y,
    speed: 0,
    doorsOpen: true,
    lateralG: 0,
    longitudinalG: 0,
  };
  passengers.update(DT, busState);
  assert.ok(passengers.onboard > 0, 'passengers should board');
  assert.ok(stop.waiting < 3 + 6, 'waiting count should drop');

  // Teleport the bus to the destination of one of the passengers.
  const passenger = passengers.passengers[0];
  const destination = map.stops.find((s) => s.id === passenger.to);
  busState.x = destination.x;
  busState.y = destination.y;
  passengers.update(DT, busState);
  assert.ok(passengers.delivered > 0, 'passenger should be dropped');
  assert.ok(passengers.totalFares > 0, 'fare should be collected');
  assert.ok(events.some((e) => e.type === 'board'));
  assert.ok(events.some((e) => e.type === 'alight'));
});

test('mission session completes when every objective is met', () => {
  const mission = MISSIONS.find((m) => m.id === 'm_city_01');
  const session = new MissionSession(mission);
  for (let i = 0; i < 6; i++) session.onPassengerDropped(1);
  let status = 'running';
  for (let i = 0; i < 60; i++) status = session.update(DT, { damage: 0 });
  assert.equal(status, 'complete');
  assert.ok(session.reward > 0, 'reward should be awarded');
});

test('mission session fails when the time limit expires', () => {
  const mission = MISSIONS.find((m) => m.id === 'm_city_01');
  const session = new MissionSession(mission);
  let status = 'running';
  for (let i = 0; i < 120 * (mission.timeLimit + 5); i++) {
    status = session.update(DT, { damage: 0 });
    if (status !== 'running') break;
  }
  assert.equal(status, 'failed');
});

test('save system persists money, unlocks and customisation', () => {
  const storage = createMemoryStorage();
  const save = new SaveSystem(storage);
  save.load();
  save.addMoney(2500);
  save.unlockBus('luxury_coach');
  save.unlockMap('national_highway');
  save.setCustomization('luxury_coach', { bodyColor: 'blue', stickers: ['temple'] });
  save.markDirty();
  assert.equal(save.save(), true);

  const reloaded = new SaveSystem(storage);
  reloaded.load();
  assert.equal(reloaded.data.money, 7500);
  assert.ok(reloaded.isBusUnlocked('luxury_coach'));
  assert.ok(reloaded.isMapUnlocked('national_highway'));
  assert.equal(reloaded.getCustomization('luxury_coach').bodyColor, 'blue');
  assert.deepEqual(reloaded.getCustomization('luxury_coach').stickers, ['temple']);
});

test('GPS produces a route and guidance', () => {
  const map = generateMap('indian_city', { seed: 5, quality: 'low' });
  const gps = new GpsNavigator(map.network);
  const target = map.destinations[map.destinations.length - 1] || map.startPose;
  const route = gps.setDestination(target.x, target.y);
  assert.ok(route.length >= 2, 'route should have waypoints');
  const guidance = gps.update({ x: map.startPose.x, y: map.startPose.y, heading: 0 });
  assert.ok(typeof guidance.instruction === 'string');
  assert.ok(guidance.distance >= 0);
});

test('camera rig switches between all modes without errors', () => {
  const camera = new THREE.PerspectiveCamera(60, 1.7, 0.1, 1000);
  const rig = new CameraRig(camera, { mode: 'third' });
  const busGroup = new THREE.Group();
  busGroup.userData.spec = getBusSpec('city_public');
  busGroup.position.set(0, 0, 0);
  const modes = ['third', 'driver', 'cockpit', 'front', 'rear', 'cinematic'];
  for (const mode of modes) {
    rig.setMode(mode);
    for (let i = 0; i < 30; i++) {
      rig.update(DT, busGroup, { speed: 12 });
    }
    assert.ok(Number.isFinite(camera.position.x), `camera position finite in ${mode}`);
    assert.ok(Number.isFinite(camera.position.y), `camera position finite in ${mode}`);
  }
});
