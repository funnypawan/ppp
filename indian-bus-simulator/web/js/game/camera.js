/**
 * Camera rig: third person chase, driver view, cockpit, front bumper, rear
 * view and a cinematic orbit. Transitions are smoothed so switching modes
 * never snaps.
 */

import * as THREE from '../../vendor/three.module.js';
import { clamp, damp, lerp, dampAngle, wrapAngle } from '../util/math.js';

export const CAMERA_MODES = [
  { id: 'third', name: 'Third Person', icon: '🚐' },
  { id: 'driver', name: 'Driver View', icon: '🧑‍✈️' },
  { id: 'cockpit', name: 'Cockpit', icon: '🎛️' },
  { id: 'front', name: 'Front Camera', icon: '🔦' },
  { id: 'rear', name: 'Rear Camera', icon: '🔙' },
  { id: 'cinematic', name: 'Cinematic', icon: '🎬' },
];

export class CameraRig {
  constructor(camera, options = {}) {
    this.camera = camera;
    this.mode = options.mode || 'third';
    this.sensitivity = options.sensitivity ?? 1;
    this.modeBlend = 1;
    this.cinematicAngle = 0;
    this.shake = 0;
    this._pos = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this._targetPos = new THREE.Vector3();
    this._targetLook = new THREE.Vector3();
    this._quat = new THREE.Quaternion();
    this._tmp = new THREE.Vector3();
    this._tmp2 = new THREE.Vector3();
    this.initialised = false;
  }

  setMode(mode) {
    if (!CAMERA_MODES.some((m) => m.id === mode)) return;
    if (mode === this.mode) return;
    this.mode = mode;
    this.modeBlend = 0;
  }

  cycleMode(dir = 1) {
    const index = CAMERA_MODES.findIndex((m) => m.id === this.mode);
    const next = (index + dir + CAMERA_MODES.length) % CAMERA_MODES.length;
    this.setMode(CAMERA_MODES[next].id);
    return this.mode;
  }

  addShake(amount) {
    this.shake = Math.min(1.2, this.shake + amount);
  }

  /** @param {THREE.Object3D} busGroup the player bus group */
  update(dt, busGroup, telemetry) {
    const spec = busGroup.userData?.spec;
    const speed = telemetry ? telemetry.speed : 0;
    const yaw = busGroup.rotation.y;
    const forward = this._tmp.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
    const right = this._tmp2.set(Math.cos(yaw), 0, -Math.sin(yaw)).normalize();
    const pos = busGroup.position;
    const length = spec ? spec.length : 11;
    const height = spec ? spec.height : 3.2;
    const width = spec ? spec.width : 2.5;

    switch (this.mode) {
      case 'driver': {
        this._targetPos.set(
          pos.x + right.x * (width / 2 - 0.62) + forward.x * (length / 2 - 1.25),
          pos.y + 2.15,
          pos.z + right.z * (width / 2 - 0.62) + forward.z * (length / 2 - 1.25)
        );
        this._targetLook.set(
          this._targetPos.x + forward.x * 30,
          this._targetPos.y - 1.2 + this._targetLook.y * 0,
          this._targetPos.z + forward.z * 30
        );
        break;
      }
      case 'cockpit': {
        this._targetPos.set(
          pos.x - forward.x * 0.2 + right.x * (width / 2 - 0.62),
          pos.y + 1.62,
          pos.z - forward.z * 0.2 + right.z * (width / 2 - 0.62)
        );
        this._targetLook.set(
          this._targetPos.x + forward.x * 30,
          this._targetPos.y + 0.6,
          this._targetPos.z + forward.z * 30
        );
        break;
      }
      case 'front': {
        this._targetPos.set(
          pos.x + forward.x * (length / 2 + 0.25),
          pos.y + 1.05,
          pos.z + forward.z * (length / 2 + 0.25)
        );
        this._targetLook.set(
          this._targetPos.x + forward.x * 30,
          this._targetPos.y - 0.6,
          this._targetPos.z + forward.z * 30
        );
        break;
      }
      case 'rear': {
        this._targetPos.set(
          pos.x - forward.x * (length / 2 - 0.4),
          pos.y + 2.5,
          pos.z - forward.z * (length / 2 - 0.4)
        );
        this._targetLook.set(
          this._targetPos.x - forward.x * 20,
          this._targetPos.y,
          this._targetPos.z - forward.z * 20
        );
        break;
      }
      case 'cinematic': {
        this.cinematicAngle += dt * 0.16;
        const radius = 16 + Math.sin(this.cinematicAngle * 0.7) * 4;
        this._targetPos.set(
          pos.x + Math.cos(this.cinematicAngle) * radius,
          pos.y + 5.5 + Math.sin(this.cinematicAngle * 0.5) * 2.2,
          pos.z + Math.sin(this.cinematicAngle) * radius
        );
        this._targetLook.set(pos.x, pos.y + height * 0.45, pos.z);
        break;
      }
      case 'third':
      default: {
        const back = 9.5 + length * 0.35 + speed * 0.16;
        const up = 4.2 + height * 0.35 + speed * 0.05;
        this._targetPos.set(
          pos.x - forward.x * back,
          pos.y + up,
          pos.z - forward.z * back
        );
        this._targetLook.set(
          pos.x + forward.x * (6 + speed * 0.4),
          pos.y + height * 0.42,
          pos.z + forward.z * (6 + speed * 0.4)
        );
        break;
      }
    }

    if (!this.initialised) {
      this._pos.copy(this._targetPos);
      this._look.copy(this._targetLook);
      this.initialised = true;
    }

    this.modeBlend = Math.min(1, this.modeBlend + dt * 3.2);
    const lambda = this.mode === 'third' ? 6.5 : 12;
    this._pos.x = damp(this._pos.x, this._targetPos.x, lambda, dt);
    this._pos.y = damp(this._pos.y, this._targetPos.y, lambda, dt);
    this._pos.z = damp(this._pos.z, this._targetPos.z, lambda, dt);
    this._look.x = damp(this._look.x, this._targetLook.x, lambda * 1.2, dt);
    this._look.y = damp(this._look.y, this._targetLook.y, lambda * 1.2, dt);
    this._look.z = damp(this._look.z, this._targetLook.z, lambda * 1.2, dt);

    // Speed shake + engine vibration.
    this.shake = Math.max(0, this.shake - dt * 2.2);
    const vibration = Math.min(0.06, speed * 0.0015) + this.shake * 0.25;
    const t = performance.now() * 0.001;
    this.camera.position.set(
      this._pos.x + Math.sin(t * 27) * vibration,
      this._pos.y + Math.sin(t * 31) * vibration,
      this._pos.z + Math.cos(t * 23) * vibration
    );
    this.camera.lookAt(this._look);

    // Field of view grows with speed for a sense of velocity.
    const targetFov = this.mode === 'third' ? 62 + clamp(speed * 0.45, 0, 16) : 70;
    this.camera.fov = damp(this.camera.fov, targetFov, 4, dt);
    this.camera.updateProjectionMatrix();
  }
}
