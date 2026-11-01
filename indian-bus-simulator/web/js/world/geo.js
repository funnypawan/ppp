/**
 * Geometry helpers: merging geometries and building simple primitives without
 * relying on three's example addons (keeps the shipped bundle small).
 */

import * as THREE from '../../vendor/three.module.js';

/** Convert an indexed geometry to a flat (non indexed) geometry. */
export function toNonIndexed(geometry) {
  if (!geometry.index) return geometry;
  const out = geometry.toNonIndexed();
  geometry.dispose();
  return out;
}

/**
 * Merge a list of { geometry, matrix } entries into one BufferGeometry.
 */
export function mergeGeometries(entries) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const normalMatrix = new THREE.Matrix3();

  for (const entry of entries) {
    const geo = toNonIndexed(entry.geometry.clone());
    const matrix = entry.matrix || new THREE.Matrix4();
    normalMatrix.getNormalMatrix(matrix);
    const pos = geo.attributes.position;
    const nor = geo.attributes.normal;
    const uv = geo.attributes.uv;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(matrix);
      positions.push(v.x, v.y, v.z);
      if (nor) {
        v.fromBufferAttribute(nor, i).applyMatrix3(normalMatrix).normalize();
        normals.push(v.x, v.y, v.z);
      } else {
        normals.push(0, 1, 0);
      }
      if (uv) uvs.push(uv.getX(i), uv.getY(i));
      else uvs.push(0, 0);
    }
    geo.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return merged;
}

/** Convenience: build a transform matrix from position / rotation / scale. */
export function trs(px, py, pz, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Matrix4();
  m.compose(
    new THREE.Vector3(px, py, pz),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(sx, sy, sz)
  );
  return m;
}

/** Box helper that returns { geometry, matrix } ready for merging. */
export function box(w, h, d, x = 0, y = 0, z = 0, ry = 0) {
  return { geometry: new THREE.BoxGeometry(w, h, d), matrix: trs(x, y, z, 0, ry, 0) };
}

export function cylinder(rTop, rBottom, h, seg, x = 0, y = 0, z = 0) {
  return {
    geometry: new THREE.CylinderGeometry(rTop, rBottom, h, seg),
    matrix: trs(x, y, z),
  };
}

export function cone(r, h, seg, x = 0, y = 0, z = 0) {
  return {
    geometry: new THREE.ConeGeometry(r, h, seg),
    matrix: trs(x, y, z),
  };
}

export function sphere(r, seg, x = 0, y = 0, z = 0) {
  return {
    geometry: new THREE.SphereGeometry(r, seg, Math.max(4, seg >> 1)),
    matrix: trs(x, y, z),
  };
}

/** A flat quad in the XZ plane (used for road signs, decals, water). */
export function plane(w, d, x = 0, y = 0, z = 0, ry = 0) {
  const g = new THREE.PlaneGeometry(w, d);
  g.rotateX(-Math.PI / 2);
  return { geometry: g, matrix: trs(x, y, z, 0, ry, 0) };
}
