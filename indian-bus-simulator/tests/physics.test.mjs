/**
 * Physics regression tests. Run with:  node --test tests/
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { VehiclePhysics, defaultEnvironment, resolveCollisions } from '../web/js/vehicles/physics.js';
import { BUS_SPECS, getBusSpec, engineTorque, seatCapacity } from '../web/js/vehicles/specs.js';

const DT = 1 / 120;

function simulate(spec, seconds, input, env = defaultEnvironment()) {
  const p = new VehiclePhysics(spec);
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i++) {
    p.setInputs(typeof input === 'function' ? input(p, i * DT) : input);
    p.step(DT, env);
  }
  return p;
}

test('catalogue: eight buses with sane data', () => {
  assert.equal(BUS_SPECS.length, 8);
  for (const s of BUS_SPECS) {
    assert.ok(s.length > 5 && s.length < 16, `${s.id} length`);
    assert.ok(s.mass > 3000, `${s.id} mass`);
    assert.ok(s.gearRatios.length >= 4, `${s.id} gears`);
    assert.ok(s.maxSpeedKmh >= 60 && s.maxSpeedKmh <= 140, `${s.id} vmax`);
    assert.ok(seatCapacity(s) > 8, `${s.id} seats`);
  }
  // Every bus must feel different from the others.
  const masses = BUS_SPECS.map((s) => s.mass);
  assert.equal(new Set(masses).size, BUS_SPECS.length);
});

test('engine torque curve: peak in mid range, never negative', () => {
  const spec = getBusSpec('luxury_coach');
  assert.ok(engineTorque(spec, spec.idleRpm) > 0);
  assert.ok(engineTorque(spec, spec.maxRpm) > 0);
  const mid = engineTorque(spec, spec.idleRpm + (spec.maxRpm - spec.idleRpm) * 0.5);
  assert.ok(mid >= spec.peakTorque * 0.9, 'mid-range torque should be near peak');
});

test('acceleration: heavy city bus pulls away from rest', () => {
  const spec = getBusSpec('city_public');
  const p = simulate(spec, 6, { throttle: 1, brake: 0, steer: 0, handbrake: 0 });
  assert.ok(p.speedKmh > 8, `expected > 8 km/h after 6s, got ${p.speedKmh.toFixed(1)}`);
  assert.ok(p.rpm > spec.idleRpm);
  // A loaded bus should not sprint away like a sports car.
  assert.ok(p.speedKmh < 70, `bus accelerated implausibly fast: ${p.speedKmh.toFixed(1)}`);
  // 0-40 km/h should feel like a loaded bus: between 12 and 60 seconds.
  const p2 = new VehiclePhysics(spec);
  let t = 0;
  while (p2.speedKmh < 40 && t < 120) {
    p2.setInputs({ throttle: 1, brake: 0, steer: 0, handbrake: 0 });
    p2.step(DT, defaultEnvironment());
    t += DT;
  }
  assert.ok(t > 10 && t < 60, `0-40 km/h took ${t.toFixed(1)}s`);
});

test('braking: a 20 m/s stop takes a plausible distance', () => {
  const spec = getBusSpec('city_public');
  const p = new VehiclePhysics(spec);
  // Accelerate to roughly 20 m/s.
  for (let i = 0; i < 120 * 75; i++) {
    p.setInputs({ throttle: 1, brake: 0, steer: 0, handbrake: 0 });
    p.step(DT, defaultEnvironment());
    if (p.speed > 20) break;
  }
  assert.ok(p.speed > 19, `setup failed, speed ${p.speed}`);
  const startX = p.x;
  const startY = p.y;
  for (let i = 0; i < 120 * 12; i++) {
    p.setInputs({ throttle: 0, brake: 1, steer: 0, handbrake: 0 });
    p.step(DT, defaultEnvironment());
  }
  const dist = Math.hypot(p.x - startX, p.y - startY);
  assert.ok(p.speed < 0.6, `bus should stop, speed ${p.speed}`);
  assert.ok(dist > 8 && dist < 120, `braking distance ${dist.toFixed(1)} m out of range`);
});

test('steering: turning left produces a positive yaw rate and moves north', () => {
  const spec = getBusSpec('volvo_inspired');
  const p = new VehiclePhysics(spec);
  for (let i = 0; i < 120 * 12; i++) {
    p.setInputs({ throttle: 0.55, brake: 0, steer: 0.85, handbrake: 0 });
    p.step(DT, defaultEnvironment());
  }
  assert.ok(p.r > 0.05, `yaw rate should be positive (left turn), got ${p.r}`);
  assert.ok(p.y > 1, `bus should have moved to the left (+y), got y=${p.y.toFixed(2)}`);
});

test('steering right mirrors the left turn', () => {
  const spec = getBusSpec('volvo_inspired');
  const p = new VehiclePhysics(spec);
  for (let i = 0; i < 120 * 12; i++) {
    p.setInputs({ throttle: 0.55, brake: 0, steer: -0.85, handbrake: 0 });
    p.step(DT, defaultEnvironment());
  }
  assert.ok(p.r < -0.05, `yaw rate should be negative, got ${p.r}`);
  assert.ok(p.y < -1, `bus should have moved right (-y), got y=${p.y.toFixed(2)}`);
});

test('reverse gear moves the bus backwards', () => {
  const spec = getBusSpec('mini_bus');
  const p = new VehiclePhysics(spec);
  p.setGear(-1);
  for (let i = 0; i < 120 * 6; i++) {
    p.setInputs({ throttle: 0.7, brake: 0, steer: 0, handbrake: 0 });
    p.step(DT, defaultEnvironment());
  }
  assert.ok(p.u < -0.5, `expected negative longitudinal velocity, got ${p.u}`);
});

test('handbrake locks the rear axle and scrubs speed', () => {
  const spec = getBusSpec('city_public');
  const p = new VehiclePhysics(spec);
  for (let i = 0; i < 120 * 15; i++) {
    p.setInputs({ throttle: 1, brake: 0, steer: 0, handbrake: 0 });
    p.step(DT, defaultEnvironment());
  }
  const before = p.speed;
  for (let i = 0; i < 120 * 3; i++) {
    p.setInputs({ throttle: 0, brake: 0, steer: 0, handbrake: 1 });
    p.step(DT, defaultEnvironment());
  }
  assert.ok(p.speed < before, 'handbrake should slow the bus');
  assert.ok(p.wheelSlip[2] > 0.01, 'rear tyres should be locked and sliding');
});

test('rain reduces available grip', () => {
  const spec = getBusSpec('city_public');
  const dry = new VehiclePhysics(spec);
  const wet = new VehiclePhysics(spec);
  const wetEnv = defaultEnvironment();
  wetEnv.grip = 0.55;
  dry.u = 15;
  wet.u = 15;
  for (let i = 0; i < 120 * 3; i++) {
    dry.setInputs({ throttle: 0.2, brake: 0, steer: 0.8, handbrake: 0 });
    wet.setInputs({ throttle: 0.2, brake: 0, steer: 0.8, handbrake: 0 });
    dry.step(DT, defaultEnvironment());
    wet.step(DT, wetEnv);
  }
  assert.ok(
    Math.abs(wet.slipRear) > Math.abs(dry.slipRear),
    `wet road should produce more slip (${wet.slipRear.toFixed(3)} vs ${dry.slipRear.toFixed(3)})`
  );
});

test('fuel is consumed while the engine runs', () => {
  const spec = getBusSpec('city_public');
  const p = new VehiclePhysics(spec);
  const before = p.fuel;
  for (let i = 0; i < 120 * 30; i++) {
    p.setInputs({ throttle: 0.8, brake: 0, steer: 0, handbrake: 0 });
    p.step(DT, defaultEnvironment());
  }
  assert.ok(p.fuel < before, 'fuel must drop');
  assert.ok(before - p.fuel > 0.01, 'fuel consumption should be measurable');
});

test('collision with a static obstacle stops the bus and adds damage', () => {
  const spec = getBusSpec('city_public');
  const p = new VehiclePhysics(spec);
  for (let i = 0; i < 120 * 10; i++) {
    p.setInputs({ throttle: 1, brake: 0, steer: 0, handbrake: 0 });
    p.step(DT, defaultEnvironment());
  }
  const wall = { type: 'circle', x: p.x + 12, y: p.y, radius: 1.2 };
  let impulse = 0;
  for (let i = 0; i < 120 * 3; i++) {
    p.setInputs({ throttle: 1, brake: 0, steer: 0, handbrake: 0 });
    p.step(DT, defaultEnvironment());
    const res = resolveCollisions(p, [wall], DT);
    impulse += res.impulse;
  }
  assert.ok(impulse > 0, 'collision should register an impulse');
  assert.ok(p.damage > 0, 'collision should add damage');
});

test('damage reduces performance', () => {
  const spec = getBusSpec('city_public');
  const healthy = simulate(spec, 6, { throttle: 1, brake: 0, steer: 0, handbrake: 0 });
  const p = new VehiclePhysics(spec);
  p.damage = 1;
  for (let i = 0; i < 120 * 6; i++) {
    p.setInputs({ throttle: 1, brake: 0, steer: 0, handbrake: 0 });
    p.step(DT, defaultEnvironment());
  }
  const damaged = p;
  assert.ok(damaged.speedKmh < healthy.speedKmh, 'a damaged bus must be slower');
});

test('gearbox shifts up as speed rises', () => {
  const spec = getBusSpec('city_public');
  const p = new VehiclePhysics(spec);
  const gears = new Set();
  for (let i = 0; i < 120 * 45; i++) {
    p.setInputs({ throttle: 1, brake: 0, steer: 0, handbrake: 0 });
    p.step(DT, defaultEnvironment());
    gears.add(p.gear);
  }
  assert.ok(gears.size >= 3, `auto box should use several gears, saw ${[...gears].join(',')}`);
});
