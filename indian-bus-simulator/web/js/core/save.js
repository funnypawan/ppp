/**
 * Local save system. Everything the player earns or unlocks is stored as a
 * single JSON blob in localStorage (wrapped so it also works in unit tests
 * with an in-memory adapter).
 */

const SAVE_KEY = 'ibs3d.save.v1';

export function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}

export function defaultSaveData() {
  return {
    version: 1,
    createdAt: Date.now(),
    money: 5000,
    xp: 0,
    level: 1,
    unlockedBuses: ['city_public'],
    selectedBus: 'city_public',
    unlockedMaps: ['indian_city'],
    selectedMap: 'indian_city',
    unlockedMissions: ['m_city_01'],
    completedMissions: [],
    missionStars: {},
    customizations: {},
    settings: null,
    stats: {
      distanceKm: 0,
      passengersDelivered: 0,
      totalFares: 0,
      trips: 0,
      perfectDrives: 0,
      fines: 0,
      crashes: 0,
      fuelUsed: 0,
      playTimeSec: 0,
      topSpeedKmh: 0,
      distancePerBus: {},
    },
    daily: { lastClaimDay: 0, streak: 0 },
    achievements: {},
    seenIntro: false,
  };
}

function deepMerge(base, patch) {
  if (patch === null || patch === undefined) return base;
  if (typeof base !== 'object' || base === null || Array.isArray(base)) return patch;
  if (typeof patch !== 'object' || Array.isArray(patch)) return patch;
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    out[key] = key in base ? deepMerge(base[key], patch[key]) : patch[key];
  }
  return out;
}

export class SaveSystem {
  constructor(storage) {
    this.storage = storage || (typeof localStorage !== 'undefined' ? localStorage : createMemoryStorage());
    this.data = defaultSaveData();
    this.dirty = false;
    this.autoSaveTimer = 0;
  }

  load() {
    try {
      const raw = this.storage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.data = deepMerge(defaultSaveData(), parsed);
      }
    } catch (err) {
      console.warn('[save] could not read save file, starting fresh', err);
      this.data = defaultSaveData();
    }
    return this.data;
  }

  save() {
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(this.data));
      this.dirty = false;
      return true;
    } catch (err) {
      console.warn('[save] could not write save file', err);
      return false;
    }
  }

  /** Mark dirty and flush at most every `interval` seconds. */
  tick(dt, interval = 20) {
    if (!this.dirty) return false;
    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= interval) {
      this.autoSaveTimer = 0;
      return this.save();
    }
    return false;
  }

  markDirty() {
    this.dirty = true;
  }

  reset() {
    this.data = defaultSaveData();
    this.save();
    return this.data;
  }

  // ------------------------------------------------------------- convenience
  get money() {
    return this.data.money;
  }

  addMoney(amount) {
    this.data.money = Math.max(0, this.data.money + amount);
    this.markDirty();
    return this.data.money;
  }

  spendMoney(amount) {
    if (this.data.money < amount) return false;
    this.data.money -= amount;
    this.markDirty();
    return true;
  }

  isBusUnlocked(id) {
    return this.data.unlockedBuses.includes(id);
  }

  unlockBus(id) {
    if (!this.isBusUnlocked(id)) {
      this.data.unlockedBuses.push(id);
      this.markDirty();
    }
  }

  isMapUnlocked(id) {
    return this.data.unlockedMaps.includes(id);
  }

  unlockMap(id) {
    if (!this.isMapUnlocked(id)) {
      this.data.unlockedMaps.push(id);
      this.markDirty();
    }
  }

  addStat(key, amount = 1) {
    if (key in this.data.stats) this.data.stats[key] += amount;
    this.markDirty();
  }

  getCustomization(busId) {
    if (!this.data.customizations[busId]) {
      this.data.customizations[busId] = {
        paint: null,
        bodyColor: null,
        interiorColor: null,
        seatDesign: 'standard',
        wheels: 'standard',
        rims: 'steel',
        headlights: 'halogen',
        horn: 'air',
        stickers: [],
        licensePlate: 'MH 12 AB 1234',
        windowTint: 0.35,
      };
    }
    return this.data.customizations[busId];
  }

  setCustomization(busId, patch) {
    const current = this.getCustomization(busId);
    Object.assign(current, patch);
    this.markDirty();
    return current;
  }
}
