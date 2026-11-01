/**
 * Small, dependency-free math helpers used across the simulation.
 * Kept free of any Three.js import so it can be unit tested under Node.
 */

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const clamp01 = (v) => clamp(v, 0, 1);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
export const smoothstep = (t) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
export const sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);

/** Frame-rate independent exponential smoothing. */
export const damp = (current, target, lambda, dt) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

export const moveTowards = (current, target, maxDelta) => {
  const d = target - current;
  if (Math.abs(d) <= maxDelta) return target;
  return current + sign(d) * maxDelta;
};

/** Wrap an angle into [-PI, PI]. */
export function wrapAngle(a) {
  a = (a + Math.PI) % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return a - Math.PI;
}

export const angleDelta = (from, to) => wrapAngle(to - from);

export function lerpAngle(a, b, t) {
  return a + angleDelta(a, b) * t;
}

export function dampAngle(current, target, lambda, dt) {
  return current + angleDelta(current, target) * (1 - Math.exp(-lambda * dt));
}

/** Deterministic PRNG (mulberry32) so maps/props are reproducible per seed. */
export function makeRng(seed) {
  let a = seed >>> 0;
  const rng = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rng.range = (min, max) => min + (max - min) * rng();
  rng.int = (min, max) => Math.floor(rng.range(min, max + 1));
  rng.pick = (arr) => arr[Math.floor(rng() * arr.length) % arr.length];
  rng.chance = (p) => rng() < p;
  return rng;
}

/** 2D vector helpers on plain {x, y} objects (y == world Z). */
export const v2 = (x = 0, y = 0) => ({ x, y });
export const v2add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const v2sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
export const v2scale = (a, s) => ({ x: a.x * s, y: a.y * s });
export const v2dot = (a, b) => a.x * b.x + a.y * b.y;
export const v2len = (a) => Math.hypot(a.x, a.y);
export const v2lenSq = (a) => a.x * a.x + a.y * a.y;
export const v2norm = (a) => {
  const l = v2len(a);
  return l > 1e-6 ? { x: a.x / l, y: a.y / l } : { x: 0, y: 0 };
};
export const v2dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const v2distSq = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

/** Rotate a 2D vector by yaw (radians) — matches world yaw convention (x, z). */
export function v2rotate(v, yaw) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

/** Signed distance from point to an axis aligned box (negative = inside). */
export function sdBox(px, py, cx, cy, hx, hy) {
  const dx = Math.abs(px - cx) - hx;
  const dy = Math.abs(py - cy) - hy;
  const ox = Math.max(dx, 0);
  const oy = Math.max(dy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(dx, dy), 0);
}

/** Circle vs oriented box overlap test with penetration depth. */
export function circleVsOBB(cx, cy, radius, box) {
  const { x, y, hx, hy, yaw } = box;
  const dx = cx - x;
  const dy = cy - y;
  const c = Math.cos(-yaw);
  const s = Math.sin(-yaw);
  const lx = dx * c - dy * s;
  const ly = dx * s + dy * c;
  const qx = clamp(lx, -hx, hx);
  const qy = clamp(ly, -hy, hy);
  const dist = Math.hypot(lx - qx, ly - qy);
  return { hit: dist < radius, depth: radius - dist, lx, ly };
}

/** Simple 2D value noise, used for terrain / texture variation. */
export function makeNoise2D(seed) {
  const rng = makeRng(seed);
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = (h, x, y) => {
    switch (h & 3) {
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      default: return -x - y;
    }
  };
  return (x, y) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const aa = perm[perm[X] + Y];
    const ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y];
    const bb = perm[perm[X + 1] + Y + 1];
    const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
    const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
    return lerp(x1, x2, v) * 0.7;
  };
}

/** Fractal brownian motion over a noise function. */
export function fbm(noise, x, y, octaves = 4, lacunarity = 2, gain = 0.5) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise(x * freq, y * freq) * amp;
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

/** Convert km/h to m/s and back. */
export const kmh = (ms) => ms * 3.6;
export const ms = (kmhValue) => kmhValue / 3.6;

/** Format seconds as M:SS. */
export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/** Format an Indian-style rupee amount without decimals. */
export function formatMoney(amount) {
  const n = Math.max(0, Math.round(amount));
  return `₹${n.toLocaleString('en-IN')}`;
}
