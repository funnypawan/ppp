/**
 * Road network: a graph of nodes and edges with optional curved geometry,
 * plus the builder that turns it into merged road / marking / kerb meshes.
 *
 * Traffic, GPS routing, bus stops and the minimap all read from this graph.
 * Traffic in India keeps to the LEFT, so lane offsets are measured to the
 * left of the direction of travel.
 */

import * as THREE from '../../vendor/three.module.js';
import { clamp, makeRng, v2norm } from '../util/math.js';

export const LANE_WIDTH = 3.6;

export class RoadNetwork {
  constructor(seed = 1) {
    this.rng = makeRng(seed);
    this.nodes = [];
    this.edges = [];
    this.adjacency = [];
    this.bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  }

  addNode(x, y, z = 0, meta = {}) {
    const index = this.nodes.length;
    this.nodes.push({ index, x, y, z, edges: [], ...meta });
    this.adjacency.push([]);
    this.bounds.minX = Math.min(this.bounds.minX, x);
    this.bounds.minY = Math.min(this.bounds.minY, y);
    this.bounds.maxX = Math.max(this.bounds.maxX, x);
    this.bounds.maxY = Math.max(this.bounds.maxY, y);
    return index;
  }

  /**
   * @param {number} a node index
   * @param {number} b node index
   * @param {object} opts { width, lanes, type, points: [{x,y,z}], elevated }
   */
  addEdge(a, b, opts = {}) {
    const na = this.nodes[a];
    const nb = this.nodes[b];
    const points = opts.points && opts.points.length > 1
      ? opts.points.map((p) => ({ x: p.x, y: p.y, z: p.z || 0 }))
      : [
          { x: na.x, y: na.y, z: na.z },
          { x: nb.x, y: nb.y, z: nb.z },
        ];
    const edge = {
      index: this.edges.length,
      a,
      b,
      points,
      width: opts.width || 12,
      lanes: opts.lanes || 2,
      type: opts.type || 'street',
      elevated: !!opts.elevated,
      length: 0,
      cumulative: [],
      oneWay: !!opts.oneWay,
    };
    this.edges.push(edge);
    na.edges.push(edge.index);
    nb.edges.push(edge.index);
    this.adjacency[a].push({ edge: edge.index, to: b, cost: this._polylineLength(points) });
    this.adjacency[b].push({ edge: edge.index, to: a, cost: this._polylineLength(points) });
    return edge.index;
  }

  _polylineLength(points) {
    let len = 0;
    for (let i = 1; i < points.length; i++) {
      len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }
    return len;
  }

  finalise() {
    for (const edge of this.edges) {
      const cum = [0];
      for (let i = 1; i < edge.points.length; i++) {
        const d = Math.hypot(
          edge.points[i].x - edge.points[i - 1].x,
          edge.points[i].y - edge.points[i - 1].y
        );
        cum.push(cum[i - 1] + d);
      }
      edge.cumulative = cum;
      edge.length = cum[cum.length - 1];
    }
    return this;
  }

  /** Position + heading at arc length s along an edge. */
  pointAt(edge, s, lane = 0, laneWidth = LANE_WIDTH) {
    const pts = edge.points;
    const target = clamp(s, 0, edge.length);
    let i = 1;
    while (i < edge.cumulative.length - 1 && edge.cumulative[i] < target) i++;
    const segStart = edge.cumulative[i - 1];
    const segLen = Math.max(1e-5, edge.cumulative[i] - segStart);
    const t = (target - segStart) / segLen;
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const x = p0.x + (p1.x - p0.x) * t;
    const y = p0.y + (p1.y - p0.y) * t;
    const z = (p0.z || 0) + ((p1.z || 0) - (p0.z || 0)) * t;
    let dx = p1.x - p0.x;
    let dy = p1.y - p0.y;
    const l = Math.hypot(dx, dy) || 1;
    dx /= l;
    dy /= l;
    // Left of the direction of travel (left-hand traffic).
    const lx = -dy;
    const ly = dx;
    const offset = lane * laneWidth;
    return { x: x + lx * offset, y: y + ly * offset, z, dx, dy, heading: Math.atan2(dy, dx) };
  }

  /** Nearest point on any edge — used to snap the bus onto the road. */
  nearestEdgePoint(x, y, maxDist = Infinity) {
    let best = null;
    for (const edge of this.edges) {
      const pts = edge.points;
      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1];
        const p1 = pts[i];
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const len2 = dx * dx + dy * dy || 1e-6;
        let t = ((x - p0.x) * dx + (y - p0.y) * dy) / len2;
        t = clamp(t, 0, 1);
        const px = p0.x + dx * t;
        const py = p0.y + dy * t;
        const d = Math.hypot(x - px, y - py);
        if (d < maxDist && (!best || d < best.distance)) {
          const l = Math.hypot(dx, dy) || 1;
          best = { edge, distance: d, x: px, y: py, dx: dx / l, dy: dy / l };
        }
      }
    }
    return best;
  }

  /** A* over the node graph — used by the GPS and by traffic navigation. */
  findRoute(startNode, goalNode) {
    if (startNode === goalNode) return [startNode];
    const open = [startNode];
    const cameFrom = new Map();
    const gScore = new Map([[startNode, 0]]);
    const fScore = new Map([[startNode, this._heuristic(startNode, goalNode)]]);
    const closed = new Set();

    while (open.length) {
      let bestIdx = 0;
      for (let i = 1; i < open.length; i++) {
        if ((fScore.get(open[i]) ?? Infinity) < (fScore.get(open[bestIdx]) ?? Infinity)) bestIdx = i;
      }
      const current = open.splice(bestIdx, 1)[0];
      if (current === goalNode) {
        const path = [current];
        let node = current;
        while (cameFrom.has(node)) {
          node = cameFrom.get(node);
          path.unshift(node);
        }
        return path;
      }
      closed.add(current);
      for (const link of this.adjacency[current]) {
        if (closed.has(link.to)) continue;
        const tentative = (gScore.get(current) ?? Infinity) + link.cost;
        if (tentative < (gScore.get(link.to) ?? Infinity)) {
          cameFrom.set(link.to, current);
          gScore.set(link.to, tentative);
          fScore.set(link.to, tentative + this._heuristic(link.to, goalNode));
          if (!open.includes(link.to)) open.push(link.to);
        }
      }
    }
    return null;
  }

  _heuristic(a, b) {
    const na = this.nodes[a];
    const nb = this.nodes[b];
    return Math.hypot(na.x - nb.x, na.y - nb.y);
  }

  nodeDegree(index) {
    return this.adjacency[index].length;
  }

  randomEdge(rng = this.rng) {
    return this.edges[Math.floor(rng() * this.edges.length)];
  }

  randomNode(rng = this.rng) {
    return Math.floor(rng() * this.nodes.length);
  }

  /**
   * Build the merged road geometry.
   * @returns {{group: THREE.Group, surface: THREE.BufferGeometry}}
   */
  buildMeshes(palette, quality = 'high') {
    const group = new THREE.Group();
    group.name = 'Roads';

    const surfacePos = [];
    const surfaceNormal = [];
    const surfaceUv = [];
    const markPos = [];
    const markUv = [];
    const curbPos = [];

    const pushQuad = (arr, p0, p1, p2, p3, uv0, uv1, uv2, uv3) => {
      // Two triangles: p0,p1,p2 and p0,p2,p3
      arr.push(...p0, ...p1, ...p2, ...p0, ...p2, ...p3);
    };

    for (const edge of this.edges) {
      const pts = edge.points;
      const halfWidth = edge.width / 2;
      const dashStep = quality === 'low' ? 16 : 8;
      let travelled = 0;

      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1];
        const p1 = pts[i];
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const segLen = Math.hypot(dx, dy) || 1;
        const ux = dx / segLen;
        const uy = dy / segLen;
        const lx = -uy;
        const ly = ux;
        const z0 = p0.z || 0;
        const z1 = p1.z || 0;

        // Road surface ribbon.
        const a = [p0.x + lx * halfWidth, z0, p0.y + ly * halfWidth];
        const b = [p0.x - lx * halfWidth, z0, p0.y - ly * halfWidth];
        const c = [p1.x - lx * halfWidth, z1, p1.y - ly * halfWidth];
        const d = [p1.x + lx * halfWidth, z1, p1.y + ly * halfWidth];
        pushQuad(surfacePos, a, b, c, d);
        for (let k = 0; k < 6; k++) surfaceNormal.push(0, 1, 0);
        const u0 = travelled / 8;
        const u1 = (travelled + segLen) / 8;
        surfaceUv.push(0, u0, 1, u0, 1, u1, 0, u0, 1, u1, 0, u1);

        // Kerb / shoulder strips (slightly raised, thin).
        const kerbH = 0.16;
        const kw = 0.45;
        for (const side of [1, -1]) {
          const ox = lx * side;
          const oy = ly * side;
          const k0 = [
            p0.x + ox * halfWidth,
            z0,
            p0.y + oy * halfWidth,
          ];
          const k1 = [
            p0.x + ox * (halfWidth + kw),
            z0 + kerbH,
            p0.y + oy * (halfWidth + kw),
          ];
          const k2 = [
            p1.x + ox * (halfWidth + kw),
            z1 + kerbH,
            p1.y + oy * (halfWidth + kw),
          ];
          const k3 = [
            p1.x + ox * halfWidth,
            z1,
            p1.y + oy * halfWidth,
          ];
          pushQuad(curbPos, k0, k1, k2, k3);
        }

        // Lane markings: solid edge lines, dashed centre lines.
        const markOffset = halfWidth - 0.35;
        for (const side of [1, -1]) {
          const ox = lx * side * markOffset;
          const oy = ly * side * markOffset;
          const w = 0.16;
          pushQuad(
            markPos,
            [p0.x + ox - lx * w, z0 + 0.03, p0.y + oy - ly * w],
            [p0.x + ox + lx * w, z0 + 0.03, p0.y + oy + ly * w],
            [p1.x + ox + lx * w, z1 + 0.03, p1.y + oy + ly * w],
            [p1.x + ox - lx * w, z1 + 0.03, p1.y + oy - ly * w]
          );
        }
        // Dashed centre line.
        if (edge.lanes >= 2 && edge.type !== 'service') {
          let s = (travelled % dashStep) / dashStep;
          while (s < 1) {
            const dashLen = 0.45;
            const s0 = s * segLen;
            const s1 = Math.min(segLen, s0 + dashLen * (segLen / dashStep));
            const t0 = s0 / segLen;
            const t1 = s1 / segLen;
            const ax = p0.x + dx * t0;
            const ay = p0.y + dy * t0;
            const bx = p0.x + dx * t1;
            const by = p0.y + dy * t1;
            const az = z0 + (z1 - z0) * t0 + 0.03;
            const bz = z0 + (z1 - z0) * t1 + 0.03;
            const w = 0.14;
            pushQuad(
              markPos,
              [ax - lx * w, az, ay - ly * w],
              [ax + lx * w, az, ay + ly * w],
              [bx + lx * w, bz, by + ly * w],
              [bx - lx * w, bz, by - ly * w]
            );
            s += dashStep / segLen;
          }
        }
        travelled += segLen;
      }
    }

    const roadMaterial = new THREE.MeshLambertMaterial({ color: palette.road });
    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(surfacePos, 3));
    roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(surfaceNormal, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(surfaceUv, 2));
    const roadMesh = new THREE.Mesh(roadGeo, roadMaterial);
    roadMesh.receiveShadow = quality !== 'low';
    roadMesh.name = 'RoadSurface';
    group.add(roadMesh);

    const kerbMaterial = new THREE.MeshLambertMaterial({ color: palette.roadEdge });
    const kerbGeo = new THREE.BufferGeometry();
    kerbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbPos, 3));
    kerbGeo.computeVertexNormals();
    group.add(new THREE.Mesh(kerbGeo, kerbMaterial));

    const markMaterial = new THREE.MeshBasicMaterial({ color: palette.marking });
    const markGeo = new THREE.BufferGeometry();
    markGeo.setAttribute('position', new THREE.Float32BufferAttribute(markPos, 3));
    markGeo.setAttribute('uv', new THREE.Float32BufferAttribute(markUv, 2));
    const markMesh = new THREE.Mesh(markGeo, markMaterial);
    markMesh.name = 'RoadMarkings';
    group.add(markMesh);

    return { group, surface: roadGeo };
  }

  /** Debug helper: total road length in metres. */
  totalLength() {
    return this.edges.reduce((sum, e) => sum + e.length, 0);
  }
}

/** Smooth a polyline with a Catmull-Rom pass — used for curved roads. */
export function smoothPolyline(points, subdivisions = 4) {
  if (points.length < 3) return points.slice();
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p.x, p.z || 0, p.y)),
    false,
    'catmullrom',
    0.5
  );
  const count = Math.max(8, (points.length - 1) * subdivisions);
  const out = [];
  for (let i = 0; i <= count; i++) {
    const v = curve.getPoint(i / count);
    out.push({ x: v.x, y: v.z, z: v.y });
  }
  return out;
}
