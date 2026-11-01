/**
 * Unified input: touch controls, keyboard and gamepad feed one state object.
 *
 * Touch layout is fully customisable — every control can be dragged to a new
 * position and the layout is persisted with the save file.
 */

import { clamp, clamp01, damp } from '../util/math.js';

export const DEFAULT_LAYOUT = {
  steering: { x: 8, y: 62, size: 26 }, // percentages from the left / bottom
  throttle: { x: 78, y: 18, size: 17 },
  brake: { x: 62, y: 18, size: 17 },
  reverse: { x: 91, y: 44, size: 10 },
  handbrake: { x: 91, y: 60, size: 10 },
  gearUp: { x: 91, y: 28, size: 9 },
  gearDown: { x: 91, y: 12, size: 9 },
  horn: { x: 12, y: 12, size: 11 },
  lights: { x: 27, y: 12, size: 11 },
  indicatorLeft: { x: 42, y: 12, size: 9 },
  indicatorRight: { x: 52, y: 12, size: 9 },
  camera: { x: 50, y: 88, size: 9 },
  doors: { x: 12, y: 30, size: 10 },
  map: { x: 26, y: 88, size: 9 },
  pause: { x: 90, y: 88, size: 9 },
};

export class InputManager {
  constructor(target = window) {
    this.target = target;
    this.keys = new Set();
    this.touch = { throttle: 0, brake: 0, steer: 0, handbrake: 0 };
    this.gamepadIndex = null;
    this.layout = { ...DEFAULT_LAYOUT };
    this.listeners = new Map();
    this.steerSmooth = 0;
    this.enabled = true;
    this.actions = {
      horn: false,
      lights: false,
      indicatorLeft: false,
      indicatorRight: false,
      camera: false,
      doors: false,
      reverse: false,
      gearUp: false,
      gearDown: false,
      pause: false,
      map: false,
      refuel: false,
    };
    this._bind();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(callback);
    return this;
  }

  emit(event, payload) {
    const list = this.listeners.get(event);
    if (list) for (const cb of list) cb(payload);
  }

  _bind() {
    this._onKeyDown = (e) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      this.keys.add(key);
      const actionMap = {
        h: 'horn',
        l: 'lights',
        q: 'indicatorLeft',
        e: 'indicatorRight',
        c: 'camera',
        d: 'doors',
        r: 'reverse',
        ']': 'gearUp',
        '[': 'gearDown',
        p: 'pause',
        m: 'map',
        f: 'refuel',
      };
      if (actionMap[key]) {
        this.actions[actionMap[key]] = true;
        this.emit('action', actionMap[key]);
        e.preventDefault();
      }
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) e.preventDefault();
    };
    this._onKeyUp = (e) => {
      this.keys.delete(e.key.toLowerCase());
    };
    this._onBlur = () => this.keys.clear();

    this.target.addEventListener('keydown', this._onKeyDown);
    this.target.addEventListener('keyup', this._onKeyUp);
    this.target.addEventListener('blur', this._onBlur);
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadIndex = e.gamepad.index;
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadIndex = null;
    });
  }

  dispose() {
    this.target.removeEventListener('keydown', this._onKeyDown);
    this.target.removeEventListener('keyup', this._onKeyUp);
    this.target.removeEventListener('blur', this._onBlur);
  }

  /** Called by the on-screen buttons. */
  setTouchControl(name, value) {
    if (name in this.touch) this.touch[name] = value;
  }

  pressAction(name) {
    this.actions[name] = true;
    this.emit('action', name);
  }

  /** Combined input state for the vehicle. */
  read(out = {}) {
    const keys = this.keys;
    const keyThrottle = keys.has('w') || keys.has('arrowup') ? 1 : 0;
    const keyBrake = keys.has('s') || keys.has('arrowdown') ? 1 : 0;
    const keyLeft = keys.has('a') || keys.has('arrowleft') ? 1 : 0;
    const keyRight = keys.has('d') || keys.has('arrowright') ? 1 : 0;
    const keySteer = keyRight - keyLeft;

    let padSteer = 0;
    let padThrottle = 0;
    let padBrake = 0;
    let padHandbrake = 0;
    if (this.gamepadIndex !== null && navigator.getGamepads) {
      const pad = navigator.getGamepads()[this.gamepadIndex];
      if (pad) {
        padSteer = Math.abs(pad.axes[0] || 0) > 0.12 ? pad.axes[0] : 0;
        padThrottle = pad.buttons[7] ? pad.buttons[7].value : 0;
        padBrake = pad.buttons[6] ? pad.buttons[6].value : 0;
        padHandbrake = pad.buttons[0] && pad.buttons[0].pressed ? 1 : 0;
      }
    }

    const touchSteer = this.touch.steer;
    const rawSteer = clamp(
      Math.abs(keySteer) > 0 ? keySteer : Math.abs(padSteer) > 0 ? padSteer : touchSteer,
      -1,
      1
    );
    this.steerSmooth = damp(this.steerSmooth, rawSteer, 12, 1 / 60);

    out.throttle = clamp01(Math.max(keyThrottle, padThrottle, this.touch.throttle));
    out.brake = clamp01(Math.max(keyBrake, padBrake, this.touch.brake));
    out.steer = this.steerSmooth;
    out.handbrake = clamp01(Math.max(keys.has(' ') ? 1 : 0, padHandbrake, this.touch.handbrake));
    return out;
  }

  consumeAction(name) {
    if (this.actions[name]) {
      this.actions[name] = false;
      return true;
    }
    return false;
  }

  setLayout(layout) {
    this.layout = { ...DEFAULT_LAYOUT, ...(layout || {}) };
  }

  getLayout() {
    return this.layout;
  }
}
