/**
 * Minimap: a small 2D canvas rendering of the road network, the player's bus,
 * traffic, bus stops and the GPS route. North-up by default with a
 * heading-up option.
 */

import { clamp } from '../util/math.js';

export class Minimap {
  constructor(canvas, map) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.map = map;
    this.zoom = 1;
    this.rotate = false;
    this.range = 150; // metres visible around the bus
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(64, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(64, Math.floor(rect.height * dpr));
    this.dpr = dpr;
  }

  draw(bus, traffic, route) {
    if (!this.map) return;
    if (!this.canvas.width) this.resize();
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(12, 18, 22, 0.72)';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const scale = (Math.min(w, h) / 2 / this.range) * this.zoom;
    const busHeading = bus ? bus.heading : 0;

    const project = (x, y) => {
      let dx = x - (bus ? bus.x : 0);
      let dy = y - (bus ? bus.y : 0);
      if (this.rotate) {
        const c = Math.cos(-busHeading);
        const s = Math.sin(-busHeading);
        const nx = dx * c - dy * s;
        const ny = dx * s + dy * c;
        dx = nx;
        dy = ny;
      }
      return [cx + dx * scale, cy - dy * scale];
    };

    // Roads.
    ctx.lineCap = 'round';
    for (const edge of this.map.network.edges) {
      const pts = edge.points;
      const first = project(pts[0].x, pts[0].y);
      if (
        Math.abs(first[0] - cx) > w * 1.2 &&
        Math.abs(first[1] - cy) > h * 1.2
      ) {
        // Cheap cull: skip edges far away.
        let visible = false;
        for (const p of pts) {
          const q = project(p.x, p.y);
          if (Math.abs(q[0] - cx) < w && Math.abs(q[1] - cy) < h) {
            visible = true;
            break;
          }
        }
        if (!visible) continue;
      }
      ctx.strokeStyle = edge.type === 'highway' ? 'rgba(240, 232, 200, 0.85)' : 'rgba(160, 170, 180, 0.6)';
      ctx.lineWidth = Math.max(1, (edge.width / 14) * this.dpr * this.zoom);
      ctx.beginPath();
      ctx.moveTo(first[0], first[1]);
      for (let i = 1; i < pts.length; i++) {
        const p = project(pts[i].x, pts[i].y);
        ctx.lineTo(p[0], p[1]);
      }
      ctx.stroke();
    }

    // GPS route.
    if (route && route.length > 1) {
      ctx.strokeStyle = '#43d17a';
      ctx.lineWidth = 2.4 * this.dpr;
      ctx.beginPath();
      const first = project(route[0].x, route[0].y);
      ctx.moveTo(first[0], first[1]);
      for (let i = 1; i < route.length; i++) {
        const p = project(route[i].x, route[i].y);
        ctx.lineTo(p[0], p[1]);
      }
      ctx.stroke();
    }

    // Bus stops.
    ctx.fillStyle = '#ffd166';
    for (const stop of this.map.stops) {
      const p = project(stop.x, stop.y);
      if (p[0] < -10 || p[0] > w + 10 || p[1] < -10 || p[1] > h + 10) continue;
      ctx.beginPath();
      ctx.arc(p[0], p[1], 3 * this.dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Traffic.
    if (traffic) {
      ctx.fillStyle = 'rgba(220, 230, 240, 0.75)';
      for (const v of traffic.vehicles) {
        const p = project(v.x, v.y);
        if (p[0] < -6 || p[0] > w + 6 || p[1] < -6 || p[1] > h + 6) continue;
        ctx.fillRect(p[0] - 1.4 * this.dpr, p[1] - 1.4 * this.dpr, 2.8 * this.dpr, 2.8 * this.dpr);
      }
    }

    // The bus.
    if (bus) {
      const p = project(bus.x, bus.y);
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.rotate(this.rotate ? 0 : -busHeading + Math.PI / 2);
      ctx.fillStyle = '#4dd6a0';
      ctx.beginPath();
      ctx.moveTo(0, -7 * this.dpr);
      ctx.lineTo(5 * this.dpr, 6 * this.dpr);
      ctx.lineTo(0, 3.4 * this.dpr);
      ctx.lineTo(-5 * this.dpr, 6 * this.dpr);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}
