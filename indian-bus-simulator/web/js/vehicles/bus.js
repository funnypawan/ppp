/**
 * The player controlled bus: physics + 3D model + lights, doors, indicators,
 * horn, damage feedback and collision against the world.
 */

import * as THREE from '../../vendor/three.module.js';
import { VehiclePhysics, resolveCollisions, defaultEnvironment } from './physics.js';
import { buildBusModel, applyCustomization } from './busmodel.js';
import { clamp, clamp01, damp } from '../util/math.js';

export const MAP_TO_THREE_YAW = -Math.PI / 2;

export class Bus {
  constructor(spec, custom, options = {}) {
    this.spec = spec;
    this.custom = { ...custom };
    this.options = options;

    this.physics = new VehiclePhysics(spec, {
      x: options.x || 0,
      y: options.y || 0,
      yaw: options.yaw || 0,
      autoGearbox: options.autoGearbox !== false,
    });

    this.model = buildBusModel(spec, this.custom);
    this.group = new THREE.Group();
    this.group.name = 'PlayerBus';
    this.group.add(this.model);

    this.doorOpen = 0;
    this.doorTarget = 0;
    this.indicator = 0; // -1 left, 0 off, 1 right
    this.indicatorPhase = 0;
    this.headlightsOn = false;
    this.hornActive = false;
    this.brakeLightOn = false;
    this.engineOn = true;
    this.headlightBeam = null;
    this.damageSmoke = null;

    this._buildLights();
    this._applyTransform();
  }

  _buildLights() {
    const data = this.model.userData;
    // Cheap "beam" volume in front of the bus plus a soft point light.
    const beamGeo = new THREE.ConeGeometry(3.2, 16, 12, 1, true);
    beamGeo.rotateX(Math.PI / 2);
    beamGeo.translate(0, 0, -8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffeec4,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.headlightBeam = new THREE.Mesh(beamGeo, beamMat);
    this.headlightBeam.position.y = 0.9;
    this.headlightBeam.visible = false;
    this.group.add(this.headlightBeam);

    this.headLight = new THREE.PointLight(0xffeec4, 0, 26, 1.6);
    this.headLight.position.set(0, 1.2, -this.spec.length / 2 + 0.4);
    this.group.add(this.headLight);
  }

  _applyTransform() {
    const p = this.physics;
    this.group.position.set(p.x, p.z || 0, -p.y);
    this.group.rotation.y = p.yaw + MAP_TO_THREE_YAW;
    const s = p.suspension;
    this.model.rotation.x = s.pitch;
    this.model.rotation.z = -s.roll;
    this.model.position.y = s.heave;
  }

  setCustomization(custom) {
    this.custom = { ...this.custom, ...custom };
    applyCustomization(this.model, this.custom, this.spec);
  }

  setDoorsOpen(open) {
    this.doorTarget = open ? 1 : 0;
  }

  toggleDoors() {
    this.setDoorsOpen(this.doorTarget < 0.5);
    return this.doorTarget > 0.5;
  }

  get doorsOpen() {
    return this.doorTarget > 0.5;
  }

  setIndicator(side) {
    this.indicator = side;
  }

  toggleIndicator(side) {
    this.indicator = this.indicator === side ? 0 : side;
    return this.indicator;
  }

  setHeadlights(on) {
    this.headlightsOn = on;
    const data = this.model.userData;
    for (const l of data.headlightMeshes) {
      l.material = on ? data.materials.headlight : new THREE.MeshBasicMaterial({ color: 0x6a6250 });
    }
    if (this.headlightBeam) this.headlightBeam.visible = on;
    if (this.headLight) this.headLight.intensity = on ? 1.4 : 0;
  }

  honk() {
    this.hornActive = true;
    return true;
  }

  /**
   * @param {number} dt
   * @param {object} input { throttle, brake, steer, handbrake }
   * @param {object} ctx { colliders, environment }
   */
  update(dt, input, ctx = {}) {
    const p = this.physics;
    const env = ctx.environment || defaultEnvironment();
    p.setInputs(input);
    p.engineOn = this.engineOn;
    p.step(dt, env);

    if (ctx.colliders && ctx.colliders.length) {
      const result = resolveCollisions(p, ctx.colliders, dt);
      if (result.impulse > 0.4) {
        this.onImpact = result.impulse;
      }
    }

    this._updateDoors(dt);
    this._updateIndicators(dt);
    this._updateLights();
    this._updateWheels(dt);
    this._applyTransform();
    return p.telemetry();
  }

  _updateDoors(dt) {
    this.doorOpen = damp(this.doorOpen, this.doorTarget, 6, dt);
    const data = this.model.userData;
    for (const door of data.doors) {
      for (let i = 0; i < door.children.length; i += 2) {
        const panel = door.children[i];
        const base = (i === 0 ? -0.5 : 0.5) * 0.95;
        panel.position.z = base + (i === 0 ? -1 : 1) * this.doorOpen * 0.85;
      }
    }
  }

  _updateIndicators(dt) {
    this.indicatorPhase += dt * 4.2;
    const blink = this.indicator > 0 && Math.sin(this.indicatorPhase) > 0;
    const data = this.model.userData;
    const on = blink ? 0xffa517 : 0x3a2410;
    data.materials.indicatorLeft.color.setHex(this.indicator === -1 ? on : 0x3a2410);
    data.materials.indicatorRight.color.setHex(this.indicator === 1 ? on : 0x3a2410);
  }

  _updateLights() {
    const data = this.model.userData;
    const braking = this.physics.brake > 0.05 || (this.physics.handbrake > 0.5 && this.physics.speed > 0.5);
    if (braking !== this.brakeLightOn) {
      this.brakeLightOn = braking;
      for (const bl of data.brakeLights) {
        bl.material.color.setHex(braking ? 0xff2a2a : 0x3a0c0c);
      }
    }
  }

  _updateWheels(dt) {
    const data = this.model.userData;
    const spin = (this.physics.u / this.spec.tireRadius) * dt;
    for (const wheel of data.wheels) {
      wheel.spinner.rotation.x -= spin;
      if (wheel.steer) wheel.pivot.rotation.y = -this.physics.steerAngle;
    }
    // Steering wheel in the cabin follows the road wheels.
    if (data.steeringWheel) data.steeringWheel.rotation.z = 0.45 - this.physics.steerAngle * 3.4;
  }

  get position() {
    return { x: this.physics.x, y: this.physics.y, z: this.physics.z };
  }

  get heading() {
    return this.physics.yaw;
  }

  get speedKmh() {
    return this.physics.speedKmh;
  }

  /** Refuel at a fuel station; returns the litres added. */
  refuel(amount) {
    const before = this.physics.fuel;
    this.physics.fuel = Math.min(this.spec.fuelTank, before + amount);
    return this.physics.fuel - before;
  }
}
