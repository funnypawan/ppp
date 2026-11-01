/**
 * Sky, sun, moon, stars and the dynamic day/night cycle.
 *
 * The sky dome uses a tiny gradient shader, the sun/moon are billboarded
 * discs and the star field fades in at night.
 */

import * as THREE from '../../vendor/three.module.js';
import { clamp01, lerp, damp } from '../util/math.js';

const SKY_VERT = `
varying vec3 vWorldPosition;
void main() {
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const SKY_FRAG = `
uniform vec3 topColor;
uniform vec3 middleColor;
uniform vec3 bottomColor;
uniform vec3 sunDirection;
uniform vec3 sunColor;
uniform float sunSize;
varying vec3 vWorldPosition;
void main() {
  vec3 dir = normalize(vWorldPosition);
  float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 col;
  if (h > 0.5) {
    col = mix(middleColor, topColor, smoothstep(0.5, 1.0, h));
  } else {
    col = mix(bottomColor, middleColor, smoothstep(0.0, 0.5, h));
  }
  float sun = max(dot(dir, normalize(sunDirection)), 0.0);
  col += sunColor * pow(sun, 220.0) * 1.6;
  col += sunColor * pow(sun, 12.0) * 0.16;
  gl_FragColor = vec4(col, 1.0);
}`;

const PHASE_KEYFRAMES = [
  // hour, top, middle, bottom, sun intensity, ambient intensity, fog color
  { hour: 0, top: 0x05070f, middle: 0x0a1024, bottom: 0x121a30, sun: 0.04, ambient: 0.22, fog: 0x0b1224 },
  { hour: 5, top: 0x1a2440, middle: 0x4a3a54, bottom: 0x8a5a4a, sun: 0.12, ambient: 0.32, fog: 0x3a3550 },
  { hour: 6.5, top: 0x4a7fb5, middle: 0xd98a5a, bottom: 0xf0b070, sun: 0.85, ambient: 0.55, fog: 0xd0a080 },
  { hour: 9, top: 0x5a9bd4, middle: 0x9fc6e8, bottom: 0xd8e8f2, sun: 1.15, ambient: 0.72, fog: 0xc8dcea },
  { hour: 13, top: 0x4f92d0, middle: 0x9fc9ea, bottom: 0xdcecf5, sun: 1.3, ambient: 0.8, fog: 0xcfe2ef },
  { hour: 16.5, top: 0x5a94cc, middle: 0xa8c8e0, bottom: 0xdde8ee, sun: 1.1, ambient: 0.74, fog: 0xcadbe8 },
  { hour: 18.2, top: 0x3f5f9a, middle: 0xe08a52, bottom: 0xf5b96e, sun: 0.7, ambient: 0.5, fog: 0xd09a70 },
  { hour: 19.5, top: 0x1b2444, middle: 0x4c3a5e, bottom: 0x8a5548, sun: 0.2, ambient: 0.34, fog: 0x453a56 },
  { hour: 21, top: 0x070a16, middle: 0x0d1428, bottom: 0x161e36, sun: 0.05, ambient: 0.24, fog: 0x0d1428 },
  { hour: 24, top: 0x05070f, middle: 0x0a1024, bottom: 0x121a30, sun: 0.04, ambient: 0.22, fog: 0x0b1224 },
];

function lerpColor(a, b, t) {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  return (
    ((Math.round(lerp(ar, br, t)) << 16) |
      (Math.round(lerp(ag, bg, t)) << 8) |
      Math.round(lerp(ab, bb, t))) >>>
    0
  );
}

export class SkySystem {
  constructor(scene, renderer) {
    this.scene = scene;
    this.hour = 12;
    this.dayLengthSec = 240; // real seconds for a full cycle
    this.timeScale = 0; // 0 = frozen time of day
    this.uniforms = {
      topColor: { value: new THREE.Color(0x5a9bd4) },
      middleColor: { value: new THREE.Color(0x9fc6e8) },
      bottomColor: { value: new THREE.Color(0xd8e8f2) },
      sunDirection: { value: new THREE.Vector3(0, 1, 0) },
      sunColor: { value: new THREE.Color(0xfff3d0) },
      sunSize: { value: 1 },
    };
    const geo = new THREE.SphereGeometry(1, 24, 16);
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.dome = new THREE.Mesh(geo, this.material);
    this.dome.scale.setScalar(2200);
    this.dome.renderOrder = -1000;
    this.dome.frustumCulled = false;
    scene.add(this.dome);

    // Lights.
    this.sun = new THREE.DirectionalLight(0xfff2d5, 1.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 220;
    this.sun.shadow.camera.left = -70;
    this.sun.shadow.camera.right = 70;
    this.sun.shadow.camera.top = 70;
    this.sun.shadow.camera.bottom = -70;
    this.sun.shadow.bias = -0.0012;
    scene.add(this.sun);
    scene.add(this.sun.target);

    this.hemi = new THREE.HemisphereLight(0xbcd8f0, 0x6b6250, 0.75);
    scene.add(this.hemi);

    // Sun and moon discs.
    this.sunDisc = new THREE.Mesh(
      new THREE.CircleGeometry(26, 20),
      new THREE.MeshBasicMaterial({ color: 0xfff3c4, fog: false, depthWrite: false })
    );
    this.sunDisc.renderOrder = -999;
    scene.add(this.sunDisc);

    this.moon = new THREE.Mesh(
      new THREE.CircleGeometry(18, 18),
      new THREE.MeshBasicMaterial({ color: 0xe8eefc, fog: false, depthWrite: false })
    );
    this.moon.renderOrder = -999;
    scene.add(this.moon);

    // Stars.
    const starCount = 900;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85);
      const r = 1800;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    });
    this.stars = new THREE.Points(starGeo, this.starMaterial);
    this.stars.renderOrder = -998;
    scene.add(this.stars);

    scene.fog = new THREE.FogExp2(0xcfe2ef, 0.0016);
    this.setHour(this.hour);
  }

  setHour(hour) {
    this.hour = ((hour % 24) + 24) % 24;
    let a = PHASE_KEYFRAMES[0];
    let b = PHASE_KEYFRAMES[PHASE_KEYFRAMES.length - 1];
    for (let i = 0; i < PHASE_KEYFRAMES.length - 1; i++) {
      if (this.hour >= PHASE_KEYFRAMES[i].hour && this.hour <= PHASE_KEYFRAMES[i + 1].hour) {
        a = PHASE_KEYFRAMES[i];
        b = PHASE_KEYFRAMES[i + 1];
        break;
      }
    }
    const span = Math.max(0.001, b.hour - a.hour);
    const t = clamp01((this.hour - a.hour) / span);

    this.uniforms.topColor.value.setHex(lerpColor(a.top, b.top, t));
    this.uniforms.middleColor.value.setHex(lerpColor(a.middle, b.middle, t));
    this.uniforms.bottomColor.value.setHex(lerpColor(a.bottom, b.bottom, t));
    this.sun.intensity = lerp(a.sun, b.sun, t);
    this.hemi.intensity = lerp(a.ambient, b.ambient, t);
    this.fogColor = lerpColor(a.fog, b.fog, t);
    this.scene.fog.color.setHex(this.fogColor);

    // Sun travels in an arc; the moon is opposite.
    const dayAngle = ((this.hour - 6) / 12) * Math.PI;
    const elevation = Math.sin(dayAngle);
    const azimuth = Math.cos(dayAngle);
    const dir = new THREE.Vector3(azimuth * 0.6, elevation, -0.55).normalize();
    this.sunDirection = dir;
    this.uniforms.sunDirection.value.copy(dir);
    this.sun.position.copy(dir).multiplyScalar(120);
    this.sunDisc.position.copy(dir).multiplyScalar(1500);
    this.sunDisc.lookAt(0, 0, 0);
    this.moon.position.copy(dir).multiplyScalar(-1500);
    this.moon.lookAt(0, 0, 0);
    this.sunDisc.visible = elevation > -0.08;
    this.moon.visible = elevation < 0.08;
    this.starMaterial.opacity = clamp01((0.12 - elevation) * 3.4);
    this.isNight = this.hour < 6 || this.hour > 18.5;
  }

  setTimeScale(scale) {
    this.timeScale = scale;
  }

  update(dt, cameraPos) {
    if (this.timeScale > 0) {
      this.setHour(this.hour + (dt * this.timeScale) / 24);
    }
    if (cameraPos) {
      this.dome.position.set(cameraPos.x, 0, cameraPos.z);
      this.stars.position.set(cameraPos.x, 0, cameraPos.z);
    }
  }

  setShadowQuality(quality) {
    const size = quality === 'ultra' ? 2048 : quality === 'high' ? 1024 : 512;
    this.sun.shadow.mapSize.set(size, size);
    if (this.sun.shadow.map) {
      this.sun.shadow.map.dispose();
      this.sun.shadow.map = null;
    }
    this.sun.castShadow = quality !== 'low';
  }
}
