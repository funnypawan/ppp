/**
 * Audio: everything is synthesised with the Web Audio API, so the game ships
 * with no audio files at all and works completely offline.
 *
 * Engine note tracks rpm, air brakes hiss, the horn is a two tone air horn,
 * indicators tick, doors hiss open, tyres roll, rain hisses and passengers
 * murmur in the background.
 */

import { clamp, clamp01, lerp } from '../util/math.js';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.enabled = true;
    this.masterVolume = 0.8;
    this.nodes = {};
  }

  /** Must be called from a user gesture (browser autoplay policy). */
  async init() {
    if (this.ready) return true;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    this.ctx = new Ctx();
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.masterVolume;
    this.master.connect(ctx.destination);

    // --- engine ---------------------------------------------------------
    const engineGain = ctx.createGain();
    engineGain.gain.value = 0.0;
    const engineFilter = ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 900;
    engineGain.connect(this.master);
    engineFilter.connect(engineGain);

    this.engine = { gain: engineGain, filter: engineFilter, oscs: [], gains: [] };
    // A diesel is a mix of a firing order tone plus harmonics.
    const harmonics = [
      { mult: 1, type: 'sawtooth', gain: 0.5, detune: 0 },
      { mult: 0.5, type: 'square', gain: 0.32, detune: 6 },
      { mult: 2, type: 'sawtooth', gain: 0.16, detune: -8 },
      { mult: 3, type: 'triangle', gain: 0.08, detune: 4 },
    ];
    for (const h of harmonics) {
      const osc = ctx.createOscillator();
      osc.type = h.type;
      osc.detune.value = h.detune;
      const g = ctx.createGain();
      g.gain.value = h.gain;
      osc.connect(g);
      g.connect(engineFilter);
      osc.start();
      this.engine.oscs.push({ osc, mult: h.mult });
      this.engine.gains.push(g);
    }

    // --- rolling noise (tyres + wind) ------------------------------------
    const noiseBuffer = this._makeNoiseBuffer(2);
    this.noiseBuffer = noiseBuffer;
    const tyre = ctx.createBufferSource();
    tyre.buffer = noiseBuffer;
    tyre.loop = true;
    const tyreFilter = ctx.createBiquadFilter();
    tyreFilter.type = 'bandpass';
    tyreFilter.frequency.value = 260;
    tyreFilter.Q.value = 0.7;
    const tyreGain = ctx.createGain();
    tyreGain.gain.value = 0;
    tyre.connect(tyreFilter);
    tyreFilter.connect(tyreGain);
    tyreGain.connect(this.master);
    tyre.start();
    this.tyres = { source: tyre, filter: tyreFilter, gain: tyreGain };

    // --- rain ------------------------------------------------------------
    const rain = ctx.createBufferSource();
    rain.buffer = noiseBuffer;
    rain.loop = true;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'highpass';
    rainFilter.frequency.value = 900;
    const rainGain = ctx.createGain();
    rainGain.gain.value = 0;
    rain.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(this.master);
    rain.start();
    this.rain = { source: rain, filter: rainFilter, gain: rainGain };

    // --- passenger ambience ----------------------------------------------
    const murmur = ctx.createBufferSource();
    murmur.buffer = noiseBuffer;
    murmur.loop = true;
    const murmurFilter = ctx.createBiquadFilter();
    murmurFilter.type = 'bandpass';
    murmurFilter.frequency.value = 520;
    murmurFilter.Q.value = 1.4;
    const murmurGain = ctx.createGain();
    murmurGain.gain.value = 0;
    murmur.connect(murmurFilter);
    murmurFilter.connect(murmurGain);
    murmurGain.connect(this.master);
    murmur.start();
    this.murmur = { source: murmur, filter: murmurFilter, gain: murmurGain };

    this.ready = true;
    return true;
  }

  _makeNoiseBuffer(seconds) {
    const ctx = this.ctx;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    return buffer;
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.master) this.master.gain.value = on ? this.masterVolume : 0;
  }

  setVolume(v) {
    this.masterVolume = clamp01(v);
    if (this.master && this.enabled) this.master.gain.value = this.masterVolume;
  }

  /**
   * @param {object} state { rpm, maxRpm, load, speed, inRain, passengers, engineOn }
   */
  update(state) {
    if (!this.ready || !this.enabled) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const rpm = state.rpm || 0;
    const maxRpm = state.maxRpm || 2400;
    const base = 12 + (rpm / maxRpm) * 52;
    for (const { osc, mult } of this.engine.oscs) {
      osc.frequency.setTargetAtTime(base * mult, now, 0.05);
    }
    const load = clamp01(state.load || 0);
    const engineVol = state.engineOn === false ? 0 : 0.05 + load * 0.16 + (rpm / maxRpm) * 0.1;
    this.engine.gain.gain.setTargetAtTime(engineVol, now, 0.08);
    this.engine.filter.frequency.setTargetAtTime(500 + (rpm / maxRpm) * 1800 + load * 700, now, 0.1);

    const speed = state.speed || 0;
    this.tyres.gain.gain.setTargetAtTime(clamp(speed * 0.006, 0, 0.16), now, 0.15);
    this.tyres.filter.frequency.setTargetAtTime(180 + speed * 14, now, 0.2);

    this.rain.gain.gain.setTargetAtTime(clamp01(state.inRain || 0) * 0.14, now, 0.4);
    this.murmur.gain.gain.setTargetAtTime(
      clamp01((state.passengers || 0) / 40) * 0.05,
      now,
      0.5
    );
  }

  /** Two tone air horn. */
  horn(kind = 'air') {
    if (!this.ready || !this.enabled) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const duration = kind === 'musical' ? 1.2 : 0.55;
    const freqs = {
      air: [220, 277],
      electric: [520, 660],
      twin: [165, 196],
      musical: [330, 440, 554],
    }[kind] || [220, 277];

    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, now);
    bus.gain.exponentialRampToValueAtTime(0.22, now + 0.03);
    bus.gain.setValueAtTime(0.22, now + duration - 0.12);
    bus.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    bus.connect(this.master);

    for (const f of freqs) {
      const osc = ctx.createOscillator();
      osc.type = kind === 'electric' ? 'square' : 'sawtooth';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.4;
      osc.connect(g);
      g.connect(bus);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    }
    // Air hiss layer.
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    const ng = ctx.createGain();
    ng.gain.value = 0.1;
    noise.connect(filter);
    filter.connect(ng);
    ng.connect(bus);
    noise.start(now);
    noise.stop(now + duration);
  }

  /** Pneumatic air release. */
  airBrake(intensity = 1) {
    if (!this.ready || !this.enabled) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1800;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    noise.start(now);
    noise.stop(now + 0.5);
  }

  /** Door pneumatic hiss. */
  door() {
    if (!this.ready || !this.enabled) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2600;
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    noise.start(now);
    noise.stop(now + 0.75);
  }

  /** Indicator relay tick. */
  tick() {
    if (!this.ready || !this.enabled) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 1650;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  /** Collision thud. */
  impact(force = 1) {
    if (!this.ready || !this.enabled) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120 + force * 40, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.28);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(clamp(0.3 * force, 0.02, 0.5), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.4);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 700;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.14 * force, now);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    noise.connect(filter);
    filter.connect(ng);
    ng.connect(this.master);
    noise.start(now);
    noise.stop(now + 0.3);
  }

  /** Gear change clunk. */
  gearShift(up = true) {
    if (!this.ready || !this.enabled) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(up ? 260 : 200, now);
    osc.frequency.exponentialRampToValueAtTime(up ? 150 : 120, now + 0.12);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  /** UI feedback. */
  blip(frequency = 660, duration = 0.08) {
    if (!this.ready || !this.enabled) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = frequency;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }
}
