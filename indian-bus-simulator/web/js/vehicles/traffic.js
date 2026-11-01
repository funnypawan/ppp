/**
 * AI traffic: cars, trucks, buses, auto rickshaws, motorcycles and police
 * vehicles. They follow the road graph on the left hand side, obey the
 * traffic signals, keep their distance and react to the player's bus.
 *
 * Rendering uses instanced meshes (one body mesh per type plus a single
 * instanced wheel set) so a busy city stays cheap.
 */

import * as THREE from '../../vendor/three.module.js';
import { mergeGeometries, trs, box, cylinder } from '../world/geo.js';
import { LANE_WIDTH } from '../world/roadnet.js';
import { clamp, clamp01, makeRng, damp } from '../util/math.js';

export const TRAFFIC_TYPES = {
  car: {
    label: 'Car',
    length: 4.2,
    width: 1.8,
    height: 1.5,
    speed: [11, 16],
    colors: [0xd94b3d, 0x2f5fa8, 0xe8e2d4, 0x3d3d42, 0x4d8b52, 0xd8b23a, 0x8b5aa8],
    mass: 0.6,
  },
  truck: {
    label: 'Truck',
    length: 9.5,
    width: 2.5,
    height: 3.2,
    speed: [8, 12],
    colors: [0x2f6f9f, 0xc26a2a, 0x4f7a4f, 0xb0b0b0],
    mass: 1.4,
  },
  bus: {
    label: 'City Bus',
    length: 10.5,
    width: 2.5,
    height: 3.2,
    speed: [7, 11],
    colors: [0xd94b3d, 0xe0a32a, 0x3f7fbf, 0x4f9f6f],
    mass: 1.2,
  },
  auto: {
    label: 'Auto Rickshaw',
    length: 2.8,
    width: 1.4,
    height: 1.8,
    speed: [8, 12],
    colors: [0xe8c33a, 0x2f7fbf, 0xd94b3d, 0x3f8f5f],
    mass: 0.3,
  },
  bike: {
    label: 'Motorcycle',
    length: 2.1,
    width: 0.8,
    height: 1.3,
    speed: [13, 19],
    colors: [0x2b2b30, 0x8b1f1f, 0x1f4f8b, 0xd0d0d0],
    mass: 0.15,
  },
  police: {
    label: 'Police Vehicle',
    length: 4.6,
    width: 1.85,
    height: 1.6,
    speed: [12, 18],
    colors: [0xf2f2f2],
    mass: 0.7,
  },
};

function bodyGeometryFor(type) {
  const def = TRAFFIC_TYPES[type];
  const parts = [];
  if (type === 'car') {
    parts.push(box(def.width, 0.75, def.length, 0, 0.62, 0));
    parts.push(box(def.width * 0.88, 0.6, def.length * 0.5, 0, 1.22, 0.05));
    parts.push(box(def.width * 0.92, 0.3, def.length * 0.52, 0, 1.35, 0.05));
  } else if (type === 'truck') {
    parts.push(box(def.width, 2.5, def.length * 0.7, 0, 1.7, def.length * 0.14));
    parts.push(box(def.width * 0.95, 1.6, def.length * 0.28, 0, 1.15, -def.length * 0.36));
  } else if (type === 'bus') {
    parts.push(box(def.width, 2.6, def.length, 0, 1.75, 0));
    parts.push(box(def.width * 0.9, 0.35, def.length * 0.95, 0, 3.12, 0));
  } else if (type === 'auto') {
    parts.push(box(def.width * 0.9, 0.9, def.length * 0.45, 0, 1.0, -0.1));
    parts.push(box(def.width, 0.35, def.length * 0.62, 0, 0.6, 0));
    parts.push(box(def.width * 0.75, 0.75, def.length * 0.3, 0, 1.55, -0.35));
  } else if (type === 'bike') {
    parts.push(box(0.35, 0.45, 1.3, 0, 0.85, 0));
    parts.push(box(0.3, 0.55, 0.35, 0, 1.25, 0.5));
  } else if (type === 'police') {
    parts.push(box(def.width, 0.75, def.length, 0, 0.62, 0));
    parts.push(box(def.width * 0.88, 0.6, def.length * 0.52, 0, 1.22, 0.05));
    parts.push(box(def.width * 0.7, 0.18, 0.3, 0, 1.6, 0));
  }
  return mergeGeometries(parts);
}

export class TrafficSystem {
  constructor(scene, map, options = {}) {
    this.scene = scene;
    this.map = map;
    this.network = map.network;
    this.rng = makeRng(options.seed || 7);
    this.density = options.density ?? 0.6;
    this.vehicles = [];
    this.meshes = {};
    this.signalPhase = 0;
    this.signalTimer = 0;
    this.signalState = 'green';
    this.policeChase = null;
    this._buildMeshes(options.quality || 'high');
    this._spawnInitial();
  }

  _buildMeshes(quality) {
    const group = new THREE.Group();
    group.name = 'Traffic';
    for (const type of Object.keys(TRAFFIC_TYPES)) {
      const geo = bodyGeometryFor(type);
      const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const mesh = new THREE.InstancedMesh(geo, mat, 64);
      mesh.count = 0;
      mesh.castShadow = quality !== 'low';
      mesh.frustumCulled = false;
      group.add(mesh);
      this.meshes[type] = mesh;
    }
    // Shared wheel set (one instance per wheel of every vehicle).
    const wheelGeo = mergeGeometries([
      {
        geometry: new THREE.CylinderGeometry(0.34, 0.34, 0.24, 8),
        matrix: trs(0, 0, 0, 0, 0, Math.PI / 2),
      },
    ]);
    this.wheelMesh = new THREE.InstancedMesh(
      wheelGeo,
      new THREE.MeshLambertMaterial({ color: 0x16181b }),
      512
    );
    this.wheelMesh.count = 0;
    this.wheelMesh.frustumCulled = false;
    group.add(this.wheelMesh);
    this.group = group;
    this.scene.add(group);
  }

  get maxVehicles() {
    return Math.round(6 + this.density * 44);
  }

  _spawnInitial() {
    const target = this.maxVehicles;
    const types = Object.keys(TRAFFIC_TYPES);
    for (let k = 0; k < target; k++) {
      const type = k % 11 === 0 ? 'police' : types[Math.floor(this.rng() * types.length)];
      const spawn = this.map.spawnPoints[Math.floor(this.rng() * this.map.spawnPoints.length)];
      if (!spawn) continue;
      const def = TRAFFIC_TYPES[type];
      const lane = Math.floor(this.rng() * Math.max(1, Math.min(2, spawn.lanes ?? 2)));
      this.vehicles.push({
        type,
        edge: spawn.edge,
        s: spawn.s,
        dir: this.rng() < 0.5 ? 1 : -1,
        lane,
        speed: def.speed[0],
        targetSpeed: def.speed[0] + this.rng() * (def.speed[1] - def.speed[0]),
        x: spawn.x,
        y: spawn.y,
        z: spawn.z || 0,
        heading: spawn.heading,
        color: def.colors[Math.floor(this.rng() * def.colors.length)],
        wait: 0,
        active: true,
        hornTimer: 0,
      });
    }
  }

  setDensity(density) {
    this.density = clamp01(density);
    const target = this.maxVehicles;
    while (this.vehicles.length > target) this.vehicles.pop();
    while (this.vehicles.length < target) {
      const spawn = this.map.spawnPoints[Math.floor(this.rng() * this.map.spawnPoints.length)];
      if (!spawn) break;
      const types = Object.keys(TRAFFIC_TYPES);
      const type = types[Math.floor(this.rng() * types.length)];
      const def = TRAFFIC_TYPES[type];
      this.vehicles.push({
        type,
        edge: spawn.edge,
        s: spawn.s,
        dir: 1,
        lane: 0,
        speed: def.speed[0],
        targetSpeed: def.speed[0],
        x: spawn.x,
        y: spawn.y,
        z: spawn.z || 0,
        heading: spawn.heading,
        color: def.colors[Math.floor(this.rng() * def.colors.length)],
        wait: 0,
        active: true,
        hornTimer: 0,
      });
    }
  }

  /** Cycle the traffic signals: N-S green, then E-W green. */
  _updateSignals(dt) {
    this.signalTimer -= dt;
    if (this.signalTimer <= 0) {
      this.signalTimer = this.signalState === 'green' ? 11 : 2.2;
      this.signalState = this.signalState === 'green' ? 'amber' : 'green';
    }
    for (const signal of this.map.signals) {
      signal.setState(signal.axis === this.signalAxis ? this.signalState : this.signalState === 'amber' ? 'red' : 'green');
    }
  }

  update(dt, player) {
    const net = this.network;
    this.signalAxis = (this.signalAxis || 0) === 0 ? 1 : 0;
    this._updateSignals(dt);

    const playerPos = player ? { x: player.x, y: player.y, heading: player.heading } : null;

    for (const v of this.vehicles) {
      const edge = net.edges[v.edge];
      if (!edge) continue;
      const def = TRAFFIC_TYPES[v.type];

      // --- desired speed -------------------------------------------------
      let desired = v.targetSpeed;

      // Signal ahead at the end of the current edge.
      const nodeIndex = v.dir > 0 ? edge.b : edge.a;
      const signal = this.map.signals.find((s) => s.node === nodeIndex);
      if (signal) {
        const axis = signal.axis ?? 0;
        const isGreenForMe = this.signalState !== 'red' && (axis === this.signalAxis || this.signalState === 'amber');
        const distToNode =
          v.dir > 0 ? edge.length - v.s : v.s;
        if (!isGreenForMe && distToNode < 24) {
          desired = 0;
          v.wait = 1;
        }
      }

      // --- vehicle ahead on the same edge --------------------------------
      const ahead = this._vehicleAhead(v);
      if (ahead && ahead.distance < 14) {
        desired = Math.min(desired, Math.max(0, ahead.speed * (ahead.distance / 14)));
      }

      // --- the player's bus ----------------------------------------------
      if (playerPos) {
        const dx = playerPos.x - v.x;
        const dy = playerPos.y - v.y;
        const dist = Math.hypot(dx, dy);
        const forwardX = Math.cos(v.heading);
        const forwardY = Math.sin(v.heading);
        const aheadOf = dx * forwardX + dy * forwardY;
        const lateral = Math.abs(-dx * forwardY + dy * forwardX);
        if (dist < 22 && aheadOf > 0 && lateral < 3.2) {
          desired = Math.min(desired, Math.max(0, (dist - 6) * 0.5));
          if (dist < 12) v.hornTimer = Math.max(v.hornTimer, 0.6);
        }
      }

      // --- integrate ------------------------------------------------------
      const accel = desired > v.speed ? 3.4 : 9.5;
      v.speed = damp(v.speed, desired, accel, dt);
      if (v.speed < 0.05) v.speed = 0;
      v.s += v.dir * v.speed * dt;

      // --- edge transitions ----------------------------------------------
      if (v.s > edge.length || v.s < 0) {
        const node = v.s > edge.length ? edge.b : edge.a;
        const next = this._pickNextEdge(node, edge, v);
        if (next === null) {
          v.s = clamp(v.s, 0, edge.length);
          v.speed = 0;
        } else {
          const nextEdge = net.edges[next.edge];
          v.edge = next.edge;
          v.s = next.dir > 0 ? 0 : nextEdge.length;
          v.dir = next.dir;
          v.lane = Math.min(v.lane, Math.max(0, (nextEdge.lanes || 2) - 1));
        }
      }

      // --- place on the road ---------------------------------------------
      const current = net.edges[v.edge];
      if (current) {
        const base = net.pointAt(current, clamp(v.s, 0, current.length));
        const lateralOffset = v.dir * v.lane * LANE_WIDTH;
        const lx = -base.dy;
        const ly = base.dx;
        v.x = base.x + lx * lateralOffset;
        v.y = base.y + ly * lateralOffset;
        v.z = base.z;
        v.heading = base.heading;
      }
    }

    this._updateInstances(dt);
  }

  _vehicleAhead(v) {
    let best = null;
    const edge = this.network.edges[v.edge];
    if (!edge) return null;
    for (const other of this.vehicles) {
      if (other === v) continue;
      if (other.edge !== v.edge) continue;
      if (other.dir !== v.dir) continue;
      const delta = (other.s - v.s) * v.dir;
      if (delta <= 0) continue;
      if (!best || delta < best.distance) {
        best = { distance: delta, speed: other.speed };
      }
    }
    return best;
  }

  _pickNextEdge(nodeIndex, currentEdge, vehicle) {
    const net = this.network;
    const links = net.adjacency[nodeIndex];
    if (!links.length) return null;
    const options = links.filter((l) => l.edge !== currentEdge.index);
    if (!options.length) {
      // Dead end: turn around.
      const link = links[0];
      return { edge: link.edge, dir: -vehicle.dir };
    }
    // Prefer to continue roughly straight.
    const inHeading = Math.atan2(
      net.nodes[nodeIndex].y - net.nodes[currentEdge.a === nodeIndex ? currentEdge.b : currentEdge.a].y,
      net.nodes[nodeIndex].x - net.nodes[currentEdge.a === nodeIndex ? currentEdge.b : currentEdge.a].x
    );
    let bestLink = null;
    let bestScore = -Infinity;
    for (const link of options) {
      const other = link.edge === currentEdge.index ? currentEdge : net.edges[link.edge];
      const otherNode = link.to;
      const heading = Math.atan2(
        net.nodes[otherNode].y - net.nodes[nodeIndex].y,
        net.nodes[otherNode].x - net.nodes[nodeIndex].x
      );
      let diff = Math.abs(((heading - inHeading + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      const score = -diff * 2 + this.rng() * 0.6;
      if (score > bestScore) {
        bestScore = score;
        bestLink = { edge: link.edge, dir: 1 };
      }
      void other;
    }
    return bestLink;
  }

  _updateInstances(dt) {
    const counts = {};
    for (const type of Object.keys(this.meshes)) counts[type] = 0;
    let wheelCount = 0;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3(1, 1, 1);
    const color = new THREE.Color();

    for (const v of this.vehicles) {
      const mesh = this.meshes[v.type];
      if (!mesh) continue;
      const index = counts[v.type];
      if (index >= mesh.instanceMatrix.count) continue;
      e.set(0, -v.heading + Math.PI, 0);
      q.setFromEuler(e);
      pos.set(v.x, v.z, -v.y);
      m.compose(pos, q, scl);
      mesh.setMatrixAt(index, m);
      mesh.setColorAt(index, color.setHex(v.color));
      counts[v.type]++;

      // Wheels.
      const def = TRAFFIC_TYPES[v.type];
      const wheelPositions = [
        [def.width * 0.42, 0.34, def.length * 0.32],
        [-def.width * 0.42, 0.34, def.length * 0.32],
        [def.width * 0.42, 0.34, -def.length * 0.32],
        [-def.width * 0.42, 0.34, -def.length * 0.32],
      ];
      const wheelOffset = v.type === 'bike' ? 0 : 0;
      void wheelOffset;
      for (const wp of wheelPositions) {
        if (wheelCount >= this.wheelMesh.instanceMatrix.count) break;
        const cos = Math.cos(-v.heading);
        const sin = Math.sin(-v.heading);
        const wx = v.x + (wp[0] * cos - wp[2] * sin);
        const wy = v.y + (wp[0] * sin + wp[2] * cos);
        e.set(v.spin || 0, -v.heading + Math.PI, 0);
        q.setFromEuler(e);
        pos.set(wx, v.z + 0.34, -wy);
        m.compose(pos, q, scl);
        this.wheelMesh.setMatrixAt(wheelCount, m);
        wheelCount++;
      }
    }

    for (const type of Object.keys(this.meshes)) {
      const mesh = this.meshes[type];
      mesh.count = counts[type];
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    this.wheelMesh.count = wheelCount;
    this.wheelMesh.instanceMatrix.needsUpdate = true;
    void dt;
  }

  dispose() {
    if (this.group && this.group.parent) this.group.parent.remove(this.group);
    for (const mesh of Object.values(this.meshes)) mesh.dispose();
    this.wheelMesh.dispose();
  }
}
