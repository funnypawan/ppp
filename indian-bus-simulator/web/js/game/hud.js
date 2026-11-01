/**
 * Gameplay HUD: analogue speed/rpm gauge, fuel, gear, minimap, GPS banner,
 * passenger counter, mission tracker and the touch control layer.
 */

import { clamp, clamp01, lerp } from '../util/math.js';
import { Minimap } from './minimap.js';
import { CAMERA_MODES } from './camera.js';

const CONTROL_DEFS = [
  { id: 'steering', label: 'STEER', kind: 'wheel' },
  { id: 'throttle', label: 'GAS', kind: 'pedal', value: 1 },
  { id: 'brake', label: 'BRAKE', kind: 'pedal', value: 1 },
  { id: 'reverse', label: 'R', kind: 'button' },
  { id: 'handbrake', label: 'H', kind: 'button' },
  { id: 'gearUp', label: '▲', kind: 'button' },
  { id: 'gearDown', label: '▼', kind: 'button' },
  { id: 'horn', label: 'HORN', kind: 'button' },
  { id: 'lights', label: 'LAMP', kind: 'button' },
  { id: 'indicatorLeft', label: '◀', kind: 'button' },
  { id: 'indicatorRight', label: '▶', kind: 'button' },
  { id: 'camera', label: 'CAM', kind: 'button' },
  { id: 'doors', label: 'DOOR', kind: 'button' },
  { id: 'map', label: 'MAP', kind: 'button' },
  { id: 'pause', label: '❚❚', kind: 'button' },
];

export class Hud {
  constructor(root, input, options = {}) {
    this.root = root;
    this.input = input;
    this.options = options;
    this.map = null;
    this.minimap = null;
    this.editingLayout = false;
    this.toastTimer = 0;

    this.el = {
      gauge: root.querySelector('#gauge-canvas'),
      speedText: root.querySelector('#speed-text'),
      gearText: root.querySelector('#gear-text'),
      rpmText: root.querySelector('#rpm-text'),
      fuelBar: root.querySelector('#fuel-bar'),
      fuelText: root.querySelector('#fuel-text'),
      gps: root.querySelector('#gps-banner'),
      gpsText: root.querySelector('#gps-text'),
      gpsDistance: root.querySelector('#gps-distance'),
      passengerCount: root.querySelector('#passenger-count'),
      satisfaction: root.querySelector('#satisfaction-bar'),
      missionBox: root.querySelector('#mission-box'),
      missionText: root.querySelector('#mission-text'),
      missionTimer: root.querySelector('#mission-timer'),
      weather: root.querySelector('#weather-chip'),
      clock: root.querySelector('#clock-chip'),
      minimap: root.querySelector('#minimap-canvas'),
      controls: root.querySelector('#controls'),
      toast: root.querySelector('#toast'),
      speedLimit: root.querySelector('#speed-limit'),
      damage: root.querySelector('#damage-chip'),
    };

    this.gaugeCtx = this.el.gauge ? this.el.gauge.getContext('2d') : null;
    this._buildControls();
    this._resizeGauge();
    window.addEventListener('resize', () => this._resizeGauge());
  }

  _resizeGauge() {
    const canvas = this.el.gauge;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = canvas.clientWidth || 150;
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    this.gaugeSize = size;
    this.gaugeDpr = dpr;
  }

  _buildControls() {
    const container = this.el.controls;
    if (!container) return;
    container.innerHTML = '';
    this.controlElements = {};

    for (const def of CONTROL_DEFS) {
      const button = document.createElement('div');
      button.className = `control control-${def.kind}`;
      button.dataset.control = def.id;
      button.innerHTML = `<span>${def.label}</span>`;
      container.appendChild(button);
      this.controlElements[def.id] = button;
      this._bindControl(def, button);
    }
    this.applyLayout(this.input.getLayout());
  }

  _bindControl(def, button) {
    if (def.kind === 'wheel') {
      let dragging = false;
      let startX = 0;
      const radius = () => button.getBoundingClientRect().width / 2;
      const onDown = (e) => {
        dragging = true;
        startX = e.clientX;
        button.setPointerCapture?.(e.pointerId);
        e.preventDefault();
      };
      const onMove = (e) => {
        if (!dragging) return;
        const dx = (e.clientX - startX) / (radius() * 1.35);
        this.input.setTouchControl('steer', clamp(dx, -1, 1));
        e.preventDefault();
      };
      const onUp = () => {
        dragging = false;
        this.input.setTouchControl('steer', 0);
      };
      button.addEventListener('pointerdown', onDown);
      button.addEventListener('pointermove', onMove);
      button.addEventListener('pointerup', onUp);
      button.addEventListener('pointercancel', onUp);
      button.addEventListener('pointerleave', onUp);
    } else if (def.kind === 'pedal') {
      const press = (e) => {
        this.input.setTouchControl(def.id, def.value);
        e.preventDefault();
      };
      const release = () => this.input.setTouchControl(def.id, 0);
      button.addEventListener('pointerdown', press);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('pointerleave', release);
    } else {
      button.addEventListener('pointerdown', (e) => {
        this.input.pressAction(def.id);
        button.classList.add('pressed');
        e.preventDefault();
      });
      const up = () => button.classList.remove('pressed');
      button.addEventListener('pointerup', up);
      button.addEventListener('pointercancel', up);
      button.addEventListener('pointerleave', up);
    }

    // Drag to reposition (layout editor).
    button.addEventListener('pointerdown', (e) => {
      if (!this.editingLayout) return;
      const rect = button.getBoundingClientRect();
      const parentRect = this.el.controls.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      const move = (ev) => {
        const x = clamp(((ev.clientX - parentRect.left - offsetX) / parentRect.width) * 100, 0, 96);
        const y = clamp(((ev.clientY - parentRect.top - offsetY) / parentRect.height) * 100, 0, 96);
        const layout = this.input.getLayout();
        layout[def.id] = { ...(layout[def.id] || {}), x, y };
        this.applyLayout(layout);
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      e.preventDefault();
    });
  }

  applyLayout(layout) {
    for (const def of CONTROL_DEFS) {
      const el = this.controlElements[def.id];
      if (!el) continue;
      const cfg = layout[def.id] || {};
      el.style.left = `${cfg.x ?? 10}%`;
      el.style.bottom = `${cfg.y ?? 10}%`;
      el.style.width = `${cfg.size ?? 12}%`;
      el.style.height = `${cfg.size ?? 12}%`;
    }
  }

  setEditingLayout(on) {
    this.editingLayout = on;
    this.el.controls?.classList.toggle('editing', on);
  }

  attachMap(map) {
    this.map = map;
    if (this.el.minimap) {
      this.minimap = new Minimap(this.el.minimap, map);
      this.minimap.resize();
    }
  }

  toast(message, duration = 2.4) {
    if (!this.el.toast) return;
    this.el.toast.textContent = message;
    this.el.toast.classList.add('visible');
    this.toastTimer = duration;
  }

  update(dt, state) {
    // Speedometer + rpm gauge.
    if (this.gaugeCtx) this._drawGauge(state);
    if (this.el.speedText) {
      this.el.speedText.textContent = Math.round(state.speedKmh);
    }
    if (this.el.rpmText) {
      this.el.rpmText.textContent = Math.round(state.rpm);
    }
    if (this.el.gearText) {
      this.el.gearText.textContent =
        state.gear === -1 ? 'R' : state.gear === 0 ? 'N' : String(state.gear);
    }
    if (this.el.fuelBar) {
      const pct = clamp01(state.fuel / Math.max(1, state.fuelCapacity)) * 100;
      this.el.fuelBar.style.width = `${pct}%`;
      this.el.fuelBar.style.background = pct < 15 ? '#e05a4a' : pct < 35 ? '#e0a33a' : '#4dd6a0';
    }
    if (this.el.fuelText) {
      this.el.fuelText.textContent = `${Math.round(state.fuel)} L`;
    }
    if (this.el.gpsText) {
      this.el.gpsText.textContent = state.gpsInstruction || 'Follow the road';
    }
    if (this.el.gpsDistance) {
      this.el.gpsDistance.textContent =
        state.gpsDistance > 0 ? `${state.gpsDistance} m` : '';
    }
    if (this.el.passengerCount) {
      this.el.passengerCount.textContent = `${state.passengers}/${state.passengerCapacity}`;
    }
    if (this.el.satisfaction) {
      this.el.satisfaction.style.width = `${clamp01(state.satisfaction) * 100}%`;
    }
    if (this.el.weather) {
      this.el.weather.innerHTML = `<span>${state.weatherIcon}</span> ${state.weatherName}`;
    }
    if (this.el.clock) {
      this.el.clock.textContent = state.clock;
    }
    if (this.el.speedLimit) {
      this.el.speedLimit.textContent = state.speedLimit ? `${state.speedLimit} km/h` : '';
      this.el.speedLimit.classList.toggle('over', !!state.overSpeedLimit);
    }
    if (this.el.damage) {
      this.el.damage.textContent = state.damage > 0.02 ? `Damage ${Math.round(state.damage * 100)}%` : '';
    }
    if (state.mission) {
      if (this.el.missionBox) this.el.missionBox.classList.remove('hidden');
      if (this.el.missionText) this.el.missionText.textContent = state.mission.progressText;
      if (this.el.missionTimer) {
        this.el.missionTimer.textContent =
          state.mission.timeRemaining === Infinity
            ? ''
            : `⏱ ${Math.floor(state.mission.timeRemaining / 60)}:${String(
                Math.floor(state.mission.timeRemaining % 60)
              ).padStart(2, '0')}`;
      }
    } else if (this.el.missionBox) {
      this.el.missionBox.classList.add('hidden');
    }

    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.el.toast?.classList.remove('visible');
    }
  }

  _drawGauge(state) {
    const ctx = this.gaugeCtx;
    const size = this.gaugeSize;
    const dpr = this.gaugeDpr;
    ctx.clearRect(0, 0, size * dpr, size * dpr);
    ctx.save();
    ctx.scale(dpr, dpr);
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.44;

    // Dial background.
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(8, 14, 18, 0.72)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(120, 200, 180, 0.35)';
    ctx.stroke();

    // Ticks.
    const maxSpeed = 140;
    for (let i = 0; i <= 14; i++) {
      const a = Math.PI * 0.75 + (i / 14) * Math.PI * 1.5;
      const inner = r * (i % 2 === 0 ? 0.74 : 0.82);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * r * 0.93, cy + Math.sin(a) * r * 0.93);
      ctx.strokeStyle = i >= 12 ? '#e05a4a' : 'rgba(200, 230, 220, 0.7)';
      ctx.lineWidth = i % 2 === 0 ? 2 : 1;
      ctx.stroke();
    }

    // Speed needle.
    const speedRatio = clamp01(state.speedKmh / maxSpeed);
    const a = Math.PI * 0.75 + speedRatio * Math.PI * 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8);
    ctx.strokeStyle = '#43d17a';
    ctx.lineWidth = 3;
    ctx.stroke();

    // RPM ring.
    const rpmRatio = clamp01(state.rpm / Math.max(1, state.maxRpm));
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.62, Math.PI * 0.75, Math.PI * 0.75 + rpmRatio * Math.PI * 1.5);
    ctx.strokeStyle = rpmRatio > 0.88 ? '#e05a4a' : rpmRatio > 0.7 ? '#e0a33a' : '#4aa3c7';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#e8f4ef';
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(state.speedKmh)}`, cx, cy + 4);
    ctx.font = '500 9px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(220,235,230,0.7)';
    ctx.fillText('km/h', cx, cy + 16);
    ctx.restore();
  }

  cameraLabel() {
    const mode = CAMERA_MODES.find((m) => m.id === this.options.currentCamera?.());
    return mode ? mode.name : '';
  }
}
