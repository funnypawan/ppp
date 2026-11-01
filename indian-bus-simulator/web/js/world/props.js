/**
 * World props: buildings, shops, trees, lamps, signs, shelters, fuel pumps,
 * toll plazas, rocks, mountains and pedestrians.
 *
 * Everything is batched into InstancedMesh groups so a busy city still only
 * costs a handful of draw calls.
 */

import * as THREE from '../../vendor/three.module.js';
import { mergeGeometries, trs, box, cylinder, cone, sphere, plane } from './geo.js';

const UNIT_BOX = (() => {
  const g = new THREE.BoxGeometry(1, 1, 1);
  g.translate(0, 0.5, 0);
  return g;
})();

function buildTreeGeometry() {
  const parts = [
    cylinder(0.12, 0.18, 0.45, 6, 0, 0.225, 0),
    cone(0.55, 0.85, 7, 0, 0.95, 0),
    cone(0.42, 0.7, 7, 0, 1.45, 0),
  ];
  return mergeGeometries(parts);
}

function buildPalmGeometry() {
  const parts = [
    cylinder(0.09, 0.16, 1.1, 6, 0, 0.55, 0),
    { geometry: new THREE.ConeGeometry(0.14, 1.5, 5), matrix: trs(0.5, 1.05, 0, 0, 0, -1.1) },
    { geometry: new THREE.ConeGeometry(0.14, 1.4, 5), matrix: trs(-0.5, 1.0, 0, 0, 0, 1.1) },
    { geometry: new THREE.ConeGeometry(0.14, 1.5, 5), matrix: trs(0, 1.0, 0.55, 1.1, 0, 0) },
    { geometry: new THREE.ConeGeometry(0.14, 1.4, 5), matrix: trs(0, 1.0, -0.55, -1.1, 0, 0) },
  ];
  return mergeGeometries(parts);
}

function buildLampGeometry() {
  return mergeGeometries([
    cylinder(0.08, 0.11, 1, 6, 0, 0.5, 0),
    { geometry: new THREE.BoxGeometry(0.12, 0.12, 0.9), matrix: trs(0, 0.98, 0.38, 0, 0, 0) },
  ]);
}

function buildLampHeadGeometry() {
  const g = new THREE.BoxGeometry(0.4, 0.16, 0.6);
  g.translate(0, 0.95, 0.78);
  return g;
}

function buildSignGeometry() {
  return mergeGeometries([
    cylinder(0.06, 0.07, 1.1, 6, 0, 0.55, 0),
    { geometry: new THREE.BoxGeometry(0.9, 0.6, 0.06), matrix: trs(0, 1.3, 0) },
  ]);
}

function buildShelterGeometry() {
  return mergeGeometries([
    { geometry: new THREE.BoxGeometry(0.12, 2.4, 0.12), matrix: trs(-1.6, 1.2, -0.8) },
    { geometry: new THREE.BoxGeometry(0.12, 2.4, 0.12), matrix: trs(1.6, 1.2, -0.8) },
    { geometry: new THREE.BoxGeometry(0.12, 2.4, 0.12), matrix: trs(-1.6, 1.2, 0.8) },
    { geometry: new THREE.BoxGeometry(0.12, 2.4, 0.12), matrix: trs(1.6, 1.2, 0.8) },
    { geometry: new THREE.BoxGeometry(3.8, 0.12, 2.0), matrix: trs(0, 2.45, 0) },
    { geometry: new THREE.BoxGeometry(2.6, 0.12, 0.5), matrix: trs(0, 0.62, -0.6) },
  ]);
}

function buildPumpGeometry() {
  return mergeGeometries([
    { geometry: new THREE.BoxGeometry(0.9, 1.9, 0.6), matrix: trs(0, 0.95, 0) },
    { geometry: new THREE.BoxGeometry(1.1, 0.5, 0.8), matrix: trs(0, 1.7, 0) },
  ]);
}

function buildCanopyGeometry() {
  return mergeGeometries([
    { geometry: new THREE.BoxGeometry(0.3, 6, 0.3), matrix: trs(-4, 3, -2) },
    { geometry: new THREE.BoxGeometry(0.3, 6, 0.3), matrix: trs(4, 3, -2) },
    { geometry: new THREE.BoxGeometry(0.3, 6, 0.3), matrix: trs(-4, 3, 2) },
    { geometry: new THREE.BoxGeometry(0.3, 6, 0.3), matrix: trs(4, 3, 2) },
    { geometry: new THREE.BoxGeometry(9.5, 0.35, 5.5), matrix: trs(0, 6.1, 0) },
  ]);
}

function buildTollBoothGeometry() {
  return mergeGeometries([
    { geometry: new THREE.BoxGeometry(3.2, 3.0, 3.0), matrix: trs(0, 1.5, 0) },
    { geometry: new THREE.BoxGeometry(3.6, 0.3, 3.4), matrix: trs(0, 3.1, 0) },
  ]);
}

function buildPedestrianGeometry() {
  return mergeGeometries([
    cylinder(0.16, 0.2, 0.75, 6, 0, 0.95, 0),
    sphere(0.16, 6, 0, 1.5, 0),
  ]);
}

function buildBarrierGeometry() {
  return mergeGeometries([
    { geometry: new THREE.BoxGeometry(0.5, 0.9, 3.2), matrix: trs(0, 0.45, 0) },
  ]);
}

function buildRockGeometry() {
  const g = new THREE.DodecahedronGeometry(1, 0);
  g.scale(1, 0.8, 1);
  return g;
}

/**
 * Collects prop instances and builds them as a small number of
 * InstancedMesh objects.
 */
export class PropScatter {
  constructor() {
    this.buckets = new Map();
  }

  add(type, opts) {
    if (!this.buckets.has(type)) this.buckets.set(type, []);
    this.buckets.get(type).push(opts);
  }

  get count() {
    let n = 0;
    for (const list of this.buckets.values()) n += list.length;
    return n;
  }

  build({ shadows = true, palette } = {}) {
    const group = new THREE.Group();
    group.name = 'Props';
    const emissives = [];

    for (const [type, list] of this.buckets) {
      if (!list.length) continue;
      const def = PROP_DEFS[type];
      if (!def) continue;
      const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const mesh = new THREE.InstancedMesh(def.geometry, material, list.length);
      mesh.name = `Prop_${type}`;
      mesh.castShadow = shadows && def.castShadow !== false;
      mesh.receiveShadow = shadows && def.receiveShadow !== false;
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const e = new THREE.Euler();
      const v = new THREE.Vector3();
      const s = new THREE.Vector3();
      const color = new THREE.Color();
      let hasColor = false;
      for (let i = 0; i < list.length; i++) {
        const o = list[i];
        e.set(o.rx || 0, o.ry || 0, o.rz || 0);
        q.setFromEuler(e);
        v.set(o.x, o.y || 0, o.z);
        s.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1);
        m.compose(v, q, s);
        mesh.setMatrixAt(i, m);
        if (o.color !== undefined) {
          color.set(o.color);
          mesh.setColorAt(i, color);
          hasColor = true;
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (hasColor && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      group.add(mesh);

      if (def.emissive) {
        const emissiveMaterial = new THREE.MeshBasicMaterial({ color: def.emissiveColor || 0xffe9b0 });
        const emissiveMesh = new THREE.InstancedMesh(def.geometry, emissiveMaterial, list.length);
        emissiveMesh.name = `Prop_${type}_Glow`;
        for (let i = 0; i < list.length; i++) {
          const o = list[i];
          e.set(o.rx || 0, o.ry || 0, o.rz || 0);
          q.setFromEuler(e);
          v.set(o.x, o.y || 0, o.z);
          s.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1);
          m.compose(v, q, s);
          emissiveMesh.setMatrixAt(i, m);
        }
        emissiveMesh.instanceMatrix.needsUpdate = true;
        emissiveMesh.visible = false;
        group.add(emissiveMesh);
        emissives.push(emissiveMesh);
      }
    }

    group.userData.emissives = emissives;
    return group;
  }
}

export const PROP_DEFS = {
  building: { geometry: UNIT_BOX, castShadow: true, receiveShadow: true },
  buildingRoof: { geometry: UNIT_BOX, castShadow: true },
  shop: { geometry: UNIT_BOX, castShadow: true, receiveShadow: true },
  shopAwning: { geometry: UNIT_BOX, castShadow: false },
  tree: { geometry: buildTreeGeometry(), castShadow: true },
  palm: { geometry: buildPalmGeometry(), castShadow: true },
  bush: { geometry: new THREE.SphereGeometry(0.6, 6, 4), castShadow: false },
  lamp: { geometry: buildLampGeometry(), castShadow: false },
  lampHead: {
    geometry: buildLampHeadGeometry(),
    castShadow: false,
    emissive: true,
    emissiveColor: 0xffd9a0,
  },
  sign: { geometry: buildSignGeometry(), castShadow: false },
  shelter: { geometry: buildShelterGeometry(), castShadow: true },
  pump: { geometry: buildPumpGeometry(), castShadow: true },
  canopy: { geometry: buildCanopyGeometry(), castShadow: true },
  tollBooth: { geometry: buildTollBoothGeometry(), castShadow: true },
  pedestrian: { geometry: buildPedestrianGeometry(), castShadow: false },
  barrier: { geometry: buildBarrierGeometry(), castShadow: true },
  rock: { geometry: buildRockGeometry(), castShadow: true },
  mountain: { geometry: new THREE.ConeGeometry(1, 1, 7), castShadow: false },
  water: { geometry: new THREE.PlaneGeometry(1, 1), castShadow: false, receiveShadow: false },
};

/** A traffic light that can be switched between red / amber / green. */
export class TrafficSignal {
  constructor(position, rotationY) {
    this.group = new THREE.Group();
    this.group.position.set(position.x, position.y || 0, position.z);
    this.group.rotation.y = rotationY;

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.11, 3.4, 6),
      new THREE.MeshLambertMaterial({ color: 0x33383d })
    );
    pole.position.y = 1.7;
    this.group.add(pole);

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 1.15, 0.34),
      new THREE.MeshLambertMaterial({ color: 0x22262a })
    );
    box.position.y = 3.1;
    this.group.add(box);

    this.lights = [];
    const colors = [0xff2b2b, 0xffb020, 0x35e05a];
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: colors[i] });
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), mat);
      lamp.position.set(0, 3.45 - i * 0.35, -0.2);
      lamp.userData.baseColor = colors[i];
      this.group.add(lamp);
      this.lights.push(lamp);
    }
    this.state = 'red';
  }

  setState(state) {
    this.state = state;
    const activeIndex = state === 'green' ? 2 : state === 'amber' ? 1 : 0;
    for (let i = 0; i < this.lights.length; i++) {
      const on = i === activeIndex;
      this.lights[i].material.color.setHex(on ? this.lights[i].userData.baseColor : 0x202020);
      this.lights[i].visible = true;
    }
  }
}

/** Simple animated passenger / pedestrian marker used at bus stops. */
export function createPedestrianMesh(color) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.21, 0.78, 6),
    new THREE.MeshLambertMaterial({ color })
  );
  body.position.y = 0.95;
  group.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 7, 5),
    new THREE.MeshLambertMaterial({ color: 0xc98d63 })
  );
  head.position.y = 1.52;
  group.add(head);
  group.userData.body = body;
  return group;
}
