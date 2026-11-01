/**
 * Graphics, audio and control settings with four quality presets.
 */

export const QUALITY_PRESETS = {
  low: {
    name: 'Low',
    shadows: false,
    shadowQuality: 'low',
    pixelRatio: 0.65,
    textureQuality: 0.5,
    antialias: false,
    fpsLimit: 30,
    drawDistance: 220,
    propDensity: 0.5,
    trafficDensityScale: 0.6,
    particles: 'low',
  },
  medium: {
    name: 'Medium',
    shadows: true,
    shadowQuality: 'low',
    pixelRatio: 0.85,
    textureQuality: 0.75,
    antialias: false,
    fpsLimit: 45,
    drawDistance: 320,
    propDensity: 0.8,
    trafficDensityScale: 0.85,
    particles: 'medium',
  },
  high: {
    name: 'High',
    shadows: true,
    shadowQuality: 'high',
    pixelRatio: 1,
    textureQuality: 1,
    antialias: true,
    fpsLimit: 60,
    drawDistance: 420,
    propDensity: 1,
    trafficDensityScale: 1,
    particles: 'high',
  },
  ultra: {
    name: 'Ultra',
    shadows: true,
    shadowQuality: 'ultra',
    pixelRatio: 1.35,
    textureQuality: 1,
    antialias: true,
    fpsLimit: 60,
    drawDistance: 520,
    propDensity: 1.2,
    trafficDensityScale: 1.2,
    particles: 'high',
  },
};

export const DEFAULT_SETTINGS = {
  quality: 'high',
  shadows: true,
  shadowQuality: 'high',
  pixelRatio: 1,
  textureQuality: 1,
  antialias: true,
  fpsLimit: 60,
  cameraSensitivity: 1,
  cameraMode: 'third',
  audio: true,
  masterVolume: 0.8,
  autoGearbox: true,
  controlLayout: null,
  showHud: true,
  units: 'kmh',
  invertLook: false,
};

export function applyPreset(settings, preset) {
  const p = QUALITY_PRESETS[preset];
  if (!p) return settings;
  return {
    ...settings,
    quality: preset,
    shadows: p.shadows,
    shadowQuality: p.shadowQuality,
    pixelRatio: p.pixelRatio,
    textureQuality: p.textureQuality,
    antialias: p.antialias,
    fpsLimit: p.fpsLimit,
  };
}

export class SettingsStore {
  constructor(saveSystem) {
    this.save = saveSystem;
    this.values = { ...DEFAULT_SETTINGS, ...(saveSystem.data.settings || {}) };
  }

  get(key) {
    return this.values[key];
  }

  set(key, value) {
    this.values[key] = value;
    this.persist();
    return value;
  }

  setPreset(preset) {
    Object.assign(this.values, applyPreset(this.values, preset));
    this.persist();
    return this.values;
  }

  persist() {
    this.save.data.settings = { ...this.values };
    this.save.markDirty();
  }
}
