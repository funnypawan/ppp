/**
 * Vehicle dynamics for heavy passenger buses.
 *
 * The model is a single-track (bicycle) model extended with:
 *  - longitudinal load transfer (squat / dive) that changes axle grip,
 *  - a friction-circle limited combined-slip tyre model,
 *  - a real gearbox with torque curve, clutch slip and auto/manual shifting,
 *  - engine braking plus an exhaust retarder (buses use one heavily),
 *  - aerodynamic drag, rolling resistance and road grade,
 *  - speed sensitive steering with Ackermann geometry and a real steering rate,
 *  - a simple 4-post suspension used for visual pitch/roll and load feedback.
 *
 * Pure JavaScript: no engine imports, so it can be unit tested under Node.
 * World frame is a 2D "map plane": x = east, y = north, yaw measured CCW from east.
 * (Conversion to Three.js world space happens in the bus entity.)
 */

import { clamp, clamp01, lerp, sign, wrapAngle, damp, moveTowards } from '../util/math.js';
import { engineTorque, gearRatio } from './specs.js';

export const GRAVITY = 9.81;
export const AIR_DENSITY = 1.225;

export const DRIVE = {
  forward: { x: 1, y: 0 },
  reverse: { x: -1, y: 0 },
  neutral: { x: 0, y: 0 },
};

/** Default environment (dry asphalt, level road). */
export function defaultEnvironment() {
  return {
    grip: 1.0, // tyre friction multiplier (rain / mud / snow)
    slope: 0, // road grade in radians (positive = uphill)
    rollingResistance: 0.009,
    windSpeed: 0, // m/s head wind
    surfaceRoughness: 0, // 0..1, shakes the body and reduces grip slightly
  };
}

export class VehiclePhysics {
  constructor(spec, options = {}) {
    this.spec = spec;
    this.autoGearbox = options.autoGearbox !== false;
    this.mass = spec.mass;
    this.wheelbase = spec.wheelbase;
    // Centre of gravity sits slightly behind the middle for a front-engined bus.
    this.a = spec.wheelbase * 0.46; // CG -> front axle
    this.b = spec.wheelbase * 0.54; // CG -> rear axle
    this.h = spec.height * 0.42; // CG height
    this.trackWidth = spec.width * 0.86;
    this.wheelRadius = spec.tireRadius;
    // Buses have a large yaw inertia compared with a car of the same mass.
    this.inertia =
      this.mass * ((spec.length * spec.length + spec.width * spec.width) / 12) * 1.35;
    this.dragArea = spec.frontalArea * spec.dragCoefficient;
    this.maxSteer = (spec.steerMaxDeg * Math.PI) / 180;
    this.reset(options.x || 0, options.y || 0, options.yaw || 0);
  }

  reset(x = 0, y = 0, yaw = 0) {
    const spec = this.spec;
    this.x = x;
    this.y = y;
    this.yaw = yaw;
    this.u = 0; // longitudinal velocity (m/s, forward positive)
    this.v = 0; // lateral velocity (m/s, left positive)
    this.r = 0; // yaw rate (rad/s, CCW positive)
    this.rpm = spec.idleRpm;
    this.gear = 1; // 0 neutral, -1 reverse, 1..N forward
    this.shiftTimer = 0;
    this.shiftCooldown = 0;
    this.clutch = 1;
    this.engineOn = true;
    this.fuel = spec.fuelTank * 0.65;
    this.damage = 0; // 0 = pristine, 1 = wrecked
    this.odometer = 0;
    this.engineLoad = 0;
    this.throttle = 0;
    this.brake = 0;
    this.steerInput = 0;
    this.handbrake = 0;
    this.steerAngle = 0;
    this.slipFront = 0;
    this.slipRear = 0;
    this.lateralG = 0;
    this.longitudinalG = 0;
    this.frontLoad = (this.mass * GRAVITY * this.b) / this.wheelbase;
    this.rearLoad = (this.mass * GRAVITY * this.a) / this.wheelbase;
    this.suspension = { pitch: 0, roll: 0, heave: 0, pitchVel: 0, rollVel: 0 };
    this.wheelSpin = [0, 0, 0, 0]; // angular speed of each wheel (rad/s)
    this.wheelSlip = [0, 0, 0, 0];
    this.lastImpact = 0;
    this.collisionImpulse = 0;
    this.distanceTravelled = 0;
  }

  /** Current speed in the map plane (m/s). */
  get speed() {
    return Math.hypot(this.u, this.v);
  }

  get speedKmh() {
    return this.speed * 3.6;
  }

  /** Heading of the vehicle in map-plane radians. */
  get heading() {
    return this.yaw;
  }

  get forwardX() {
    return Math.cos(this.yaw);
  }

  get forwardY() {
    return Math.sin(this.yaw);
  }

  get leftX() {
    return -Math.sin(this.yaw);
  }

  get leftY() {
    return Math.cos(this.yaw);
  }

  setInputs(input) {
    if (input.throttle !== undefined) this.throttle = clamp01(input.throttle);
    if (input.brake !== undefined) this.brake = clamp01(input.brake);
    if (input.steer !== undefined) this.steerInput = clamp(input.steer, -1, 1);
    if (input.handbrake !== undefined) this.handbrake = clamp01(input.handbrake);
  }

  /** Engage a gear: -1 reverse, 0 neutral, 1..N forward. */
  setGear(gear) {
    const maxGear = this.spec.gearRatios.length;
    const g = clamp(gear, -1, maxGear);
    if (g === this.gear) return;
    // No gear engagement while rolling fast in the opposite direction.
    if (g === -1 && this.u > 1.2) return;
    if (g > 0 && this.u < -1.2) return;
    this.gear = g;
    this.shiftTimer = 0.35; // clutch out during the shift
    this.shiftCooldown = 1.6; // no hunting between adjacent gears
  }

  shiftUp() {
    if (this.gear < this.spec.gearRatios.length) this.setGear(this.gear + 1);
  }

  shiftDown() {
    if (this.gear > -1) this.setGear(this.gear - 1);
  }

  applyCollisionImpulse(forwardImpulse, lateralImpulse, damageAmount) {
    // forwardImpulse: m/s change along the vehicle forward axis
    this.u += forwardImpulse;
    this.v += lateralImpulse;
    this.r += lateralImpulse * 0.012;
    this.damage = clamp01(this.damage + damageAmount);
    this.lastImpact = 1;
    this.collisionImpulse = Math.abs(forwardImpulse) + Math.abs(lateralImpulse);
  }

  /**
   * Advance the simulation.
   * @param {number} dt seconds (fixed step)
   * @param {object} env environment (see defaultEnvironment)
   */
  step(dt, env) {
    const spec = this.spec;
    const e = env || defaultEnvironment();
    const speed = this.speed;
    const absU = Math.abs(this.u);

    // ---------------------------------------------------------------- steering
    // The steering wheel needs time to move and the usable lock shrinks with speed.
    const speedFactor = 1 / (1 + speed * 0.038);
    const targetLock = this.maxSteer * speedFactor;
    const steerRate = this.maxSteer * 3.4 * dt; // rad per second at the road wheel
    const requested = this.steerInput * targetLock;
    this.steerAngle = moveTowards(this.steerAngle, requested, steerRate);
    // Self-centring when the driver lets go of the wheel.
    if (Math.abs(this.steerInput) < 0.02) {
      this.steerAngle = moveTowards(this.steerAngle, 0, steerRate * 0.8);
    }
    const delta = this.steerAngle;

    // ------------------------------------------------------------- gear / rpm
    this.shiftTimer = Math.max(0, this.shiftTimer - dt);
    const ratio = gearRatio(spec, this.gear);
    const totalRatio = ratio * spec.finalDrive;
    const wheelOmega = this.u / this.wheelRadius;
    const gearedRpm =
      (Math.abs(wheelOmega) * Math.abs(totalRatio) * 60) / (Math.PI * 2);
    // Torque converter style slip: the clutch always transmits some torque at
    // low speed and fully locks as the vehicle gets moving.
    const shifting = this.shiftTimer > 0;
    const clutchEngagement =
      this.gear === 0 ? 0 : shifting ? 0.12 : 0.24 + 0.76 * clamp01((absU - 0.2) / 1.2);
    const clutchLock = shifting ? 0 : clamp01((absU - 0.2) / 0.8);
    const freeRev =
      this.gear === 0
        ? lerp(spec.idleRpm, spec.idleRpm + (spec.maxRpm - spec.idleRpm) * 0.45, this.throttle)
        : shifting
          ? spec.idleRpm + (spec.maxRpm - spec.idleRpm) * 0.12
          : lerp(spec.idleRpm, spec.idleRpm + (spec.maxRpm - spec.idleRpm) * 0.42, this.throttle);
    let targetRpm = lerp(freeRev, clamp(gearedRpm, spec.idleRpm, spec.maxRpm), clutchLock);
    if (!this.engineOn) targetRpm = 0;
    this.rpm = damp(this.rpm, targetRpm, 9, dt);

    if (this.autoGearbox && this.engineOn) this._autoShift(dt, absU);

    // ----------------------------------------------------------------- forces
    const mu = 0.85 * e.grip * (1 - this.damage * 0.12);
    const g = GRAVITY;
    const weight = this.mass * g;

    // Longitudinal load transfer using last frame's acceleration.
    const transfer = (this.mass * this.longitudinalG * this.h) / this.wheelbase;
    let frontLoad = (weight * this.b) / this.wheelbase - transfer;
    let rearLoad = (weight * this.a) / this.wheelbase + transfer;
    frontLoad = Math.max(frontLoad, weight * 0.08);
    rearLoad = Math.max(rearLoad, weight * 0.08);
    this.frontLoad = frontLoad;
    this.rearLoad = rearLoad;

    // Drive force from engine torque through the gearbox.
    const torque = engineTorque(spec, this.rpm) * (1 - this.damage * 0.3);
    let driveForce = 0;
    if (this.engineOn && this.gear !== 0) {
      const direction = this.gear < 0 ? -1 : 1;
      const wheelForce = (torque * Math.abs(totalRatio) * 0.92) / this.wheelRadius;
      driveForce = wheelForce * direction * clutchEngagement * this.throttle;
      // Electronic governor: the bus cannot run past its rated maximum speed.
      const maxSpeed = spec.maxSpeedKmh / 3.6;
      if (Math.abs(this.u) > maxSpeed) {
        driveForce *= clamp(1 - (Math.abs(this.u) - maxSpeed) / 2.5, 0, 1);
      }
    }
    this.driveForce = driveForce;
    this.clutch = clutchEngagement;
    this.torqueNow = torque;
    this.ratioNow = totalRatio;

    // Engine braking + exhaust retarder when coasting.
    let retarder = 0;
    if (this.engineOn && this.throttle < 0.05 && absU > 1) {
      const engineBrake = (torque * 0.13 * sign(this.u)) / this.wheelRadius;
      const retarderForce = (spec.retarderTorque * 0.55 * sign(this.u)) / this.wheelRadius;
      retarder = engineBrake + retarderForce;
    }

    // Braking: front biased like a real air-braked bus.
    const brakeForce = (spec.brakeTorque / this.wheelRadius) * this.brake;
    const brakeFront = brakeForce * 0.62;
    const brakeRear = brakeForce * 0.38;

    // Resistances.
    const dragForce = 0.5 * AIR_DENSITY * this.dragArea * this.u * Math.abs(this.u);
    const rolling = e.rollingResistance * weight * sign(this.u) * clamp01(absU / 0.5);
    const slopeForce = weight * Math.sin(e.slope) * (this.gear === 0 ? 1 : 1);
    const windForce = 0.5 * AIR_DENSITY * this.dragArea * e.windSpeed * Math.abs(e.windSpeed) * 0.35;

    const ux = Math.max(2.2, absU); // avoid numerical blow-up at standstill
    const slipF = Math.atan2(this.v + this.a * this.r, ux) - delta;
    const slipR = Math.atan2(this.v - this.b * this.r, ux);
    this.slipFront = slipF;
    this.slipRear = slipR;

    // Tyre cornering forces (left positive), saturating model.
    const stiffFront = 6.4;
    const stiffRear = 6.8;
    let fyFront = -mu * frontLoad * Math.tanh(stiffFront * slipF);
    let fyRear = -mu * rearLoad * Math.tanh(stiffRear * slipR);

    // Longitudinal force per axle, limited by the friction circle.
    let fxFront = -brakeFront * sign(this.u) * clamp01(absU / 0.4);
    let fxRear =
      driveForce +
      retarder -
      brakeRear * sign(this.u) * clamp01(absU / 0.4) -
      (Math.abs(this.handbrake) > 0.5 ? mu * rearLoad * 1.02 * sign(this.u) : 0);

    // Shared friction circle per axle.
    const limitFront = mu * frontLoad;
    const limitRear = mu * rearLoad;
    const magFront = Math.hypot(fxFront, fyFront);
    if (magFront > limitFront && magFront > 0) {
      const s = limitFront / magFront;
      fxFront *= s;
      fyFront *= s;
    }
    const magRear = Math.hypot(fxRear, fyRear);
    if (magRear > limitRear && magRear > 0) {
      const s = limitRear / magRear;
      fxRear *= s;
      fyRear *= s;
    }

    // Total forces in the body frame.
    const fxTotal = fxFront + fxRear - dragForce - rolling - slopeForce - windForce;
    const fyTotal = fyFront * Math.cos(delta) + fyRear;

    // ------------------------------------------------------------- integration
    const uDot = fxTotal / this.mass + this.r * this.v;
    const vDot = fyTotal / this.mass - this.r * this.u;
    const rDot = (this.a * fyFront * Math.cos(delta) - this.b * fyRear) / this.inertia;

    this.u += uDot * dt;
    this.v += vDot * dt;
    this.r += rDot * dt;
    // Yaw damping keeps the model from oscillating at very low speed.
    this.r *= 1 - Math.min(0.9, 1.6 * dt);

    // Kill microscopic residual motion so the bus settles instead of jittering.
    if (absU < 0.05 && this.throttle < 0.02 && this.brake < 0.02) {
      this.u *= 0.85;
      this.v *= 0.8;
    }

    this.longitudinalG = uDot / GRAVITY;
    this.lateralG = vDot / GRAVITY;

    // Pose update in the map plane.
    this.yaw = wrapAngle(this.yaw + this.r * dt);
    const worldVX = this.u * Math.cos(this.yaw) - this.v * Math.sin(this.yaw);
    const worldVY = this.u * Math.sin(this.yaw) + this.v * Math.cos(this.yaw);
    this.x += worldVX * dt;
    this.y += worldVY * dt;
    const travelled = Math.hypot(worldVX, worldVY) * dt;
    this.distanceTravelled += travelled;
    this.odometer += travelled;

    // ------------------------------------------------------------- suspension
    this._updateSuspension(dt, uDot, vDot, e);

    // ---------------------------------------------------------------- wheels
    const wheelSpeed = this.u / this.wheelRadius;
    for (let i = 0; i < 4; i++) this.wheelSpin[i] = wheelSpeed;
    this.wheelSlip[0] = this.wheelSlip[1] = clamp((Math.abs(fxFront) / Math.max(1, limitFront)) - 0.75, 0, 1);
    this.wheelSlip[2] = this.wheelSlip[3] = clamp((Math.abs(fxRear) / Math.max(1, limitRear)) - 0.75, 0, 1);

    // ------------------------------------------------------------------ fuel
    if (this.engineOn) {
      const powerKw = (torque * this.rpm * Math.PI * 2) / 60 / 1000;
      const litresPerHour = 0.9 + powerKw * 0.052 + this.throttle * 0.6;
      const litres = (litresPerHour * dt) / 3600;
      this.fuel = Math.max(0, this.fuel - litres);
    }

    this.engineLoad = clamp01(
      (this.throttle * 0.7 + (this.rpm - spec.idleRpm) / (spec.maxRpm - spec.idleRpm) * 0.5) *
        (this.engineOn ? 1 : 0)
    );
    this.lastImpact = Math.max(0, this.lastImpact - dt * 2.5);
    this.collisionImpulse = Math.max(0, this.collisionImpulse - dt * 8);

    return this.telemetry();
  }

  _autoShift(dt, absU) {
    const spec = this.spec;
    if (this.shiftTimer > 0) return;
    if (this.shiftCooldown > 0) {
      this.shiftCooldown -= dt;
      return;
    }
    const upAt = spec.maxRpm * 0.88;
    const downAt = spec.maxRpm * 0.5;
    if (this.gear === 0) {
      this.setGear(1);
      return;
    }
    if (this.gear > 0) {
      const rpmIn = (gear) => {
        const r = Math.abs(gearRatio(spec, gear) * spec.finalDrive);
        return (absU / this.wheelRadius) * r * (60 / (Math.PI * 2));
      };
      if (
        this.rpm > upAt &&
        this.gear < spec.gearRatios.length &&
        rpmIn(this.gear + 1) > spec.idleRpm * 1.2
      ) {
        this.setGear(this.gear + 1);
      } else if (
        this.gear > 1 &&
        this.rpm < downAt &&
        rpmIn(this.gear - 1) < spec.maxRpm * 0.92
      ) {
        this.setGear(this.gear - 1);
      }
    } else if (this.gear === -1 && this.u > 0.6 && this.throttle > 0.05) {
      // Driver asked to go forward while rolling backwards in reverse gear.
      this.setGear(1);
    }
  }

  _updateSuspension(dt, uDot, vDot, env) {
    // Four-post spring/damper approximation used for body attitude + load feel.
    const k = 46;
    const c = 8.2;
    const targetPitch = clamp(-uDot * 0.0075, -0.09, 0.09);
    const targetRoll = clamp(vDot * 0.006, -0.07, 0.07);
    const rough = env.surfaceRoughness * Math.sin(this.distanceTravelled * 9.3) * 0.012;
    const s = this.suspension;
    s.pitchVel += (targetPitch - s.pitch) * k * dt - s.pitchVel * c * dt;
    s.rollVel += (targetRoll - s.roll) * k * dt - s.rollVel * c * dt;
    s.pitch += s.pitchVel * dt;
    s.roll += s.rollVel * dt;
    s.heave = damp(s.heave, rough, 6, dt);
  }

  telemetry() {
    return {
      speed: this.speed,
      speedKmh: this.speedKmh,
      rpm: this.rpm,
      gear: this.gear,
      throttle: this.throttle,
      brake: this.brake,
      steer: this.steerAngle,
      steerInput: this.steerInput,
      handbrake: this.handbrake,
      slipFront: this.slipFront,
      slipRear: this.slipRear,
      lateralG: this.lateralG,
      longitudinalG: this.longitudinalG,
      fuel: this.fuel,
      damage: this.damage,
      engineOn: this.engineOn,
      distance: this.distanceTravelled,
    };
  }
}

/**
 * Simple longitudinal + lateral collision resolution between the bus (an oriented
 * box) and static world colliders (circles and oriented boxes).
 * Returns the accumulated impulse so the caller can play sounds / spawn sparks.
 */
export function resolveCollisions(physics, colliders, dt) {
  const spec = physics.spec;
  const halfL = spec.length * 0.5;
  const halfW = spec.width * 0.5;
  let impulse = 0;
  let damage = 0;

  for (const col of colliders) {
    const dx = physics.x - col.x;
    const dy = physics.y - col.y;
    const reach = halfL + (col.radius || 1) + 0.2;
    if (dx * dx + dy * dy > reach * reach) continue;

    let penetration = 0;
    let nx = 0;
    let ny = 0;

    if (col.type === 'circle') {
      const dist = Math.hypot(dx, dy);
      const minDist = halfL * 0.72 + col.radius;
      if (dist >= minDist) continue;
      penetration = minDist - dist;
      const inv = dist > 1e-4 ? 1 / dist : 0;
      nx = dx * inv;
      ny = dy * inv;
    } else {
      // Oriented box: transform into the collider's local frame.
      const c = Math.cos(-col.yaw);
      const s = Math.sin(-col.yaw);
      const lx = dx * c - dy * s;
      const ly = dx * s + dy * c;
      const qx = clamp(lx, -col.hx, col.hx);
      const qy = clamp(ly, -col.hy, col.hy);
      const dist = Math.hypot(lx - qx, ly - qy);
      if (dist >= halfW + 0.05) continue;
      let nlx;
      let nly;
      if (dist > 1e-4) {
        nlx = (lx - qx) / dist;
        nly = (ly - qy) / dist;
      } else {
        // Centre inside the box: push out along the smallest axis.
        const px = col.hx - Math.abs(lx);
        const py = col.hy - Math.abs(ly);
        if (px < py) {
          nlx = Math.sign(lx) || 1;
          nly = 0;
        } else {
          nlx = 0;
          nly = Math.sign(ly) || 1;
        }
      }
      // Back to world space.
      const cw = Math.cos(col.yaw);
      const sw = Math.sin(col.yaw);
      nx = nlx * cw - nly * sw;
      ny = nlx * sw + nly * cw;
      penetration = halfW + 0.05 - dist;
    }

    if (penetration <= 0) continue;

    // Push the bus out of the obstacle.
    physics.x += nx * penetration;
    physics.y += ny * penetration;

    // Split the impulse into the body axes and reflect the velocity.
    const fx = physics.forwardX;
    const fy = physics.forwardY;
    const lx = physics.leftX;
    const ly = physics.leftY;
    const normalVel = physics.u * (fx * nx + fy * ny) + physics.v * (lx * nx + ly * ny);
    if (normalVel >= 0) continue; // already separating

    const restitution = 0.12;
    const forwardComponent = normalVel * (fx * nx + fy * ny);
    const lateralComponent = normalVel * (lx * nx + ly * ny);
    const mass = physics.mass;
    const jForward = (-(1 + restitution) * forwardComponent * mass) / 2;
    const jLateral = (-(1 + restitution) * lateralComponent * mass) / 2;
    physics.u += jForward / mass;
    physics.v += jLateral / mass;
    physics.r += (jLateral / mass) * 0.02 * sign(nx * physics.leftX + ny * physics.leftY);

    const severity = Math.min(1, Math.abs(normalVel) / 14);
    impulse += Math.abs(normalVel);
    damage += severity * 0.05;
  }

  if (impulse > 0) {
    physics.applyCollisionImpulse(0, 0, damage);
    physics.lastImpact = Math.min(1, impulse / 8);
  }
  return { impulse, damage };
}
