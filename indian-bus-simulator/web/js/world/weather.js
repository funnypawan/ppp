/**
 * Weather: rain, snow, fog and the grip / visibility effects that come with
 * them. Particles follow the camera so a small pool of geometry is enough.
 */

import * as THREE from '../../vendor/three.module.js';
import { WEATHER_BY_ID } from './mapdefs.js';
import { clamp01, damp, lerp } from '../util/math.js';

export class WeatherSystem {
  constructor(scene, quality = 'high') {
    this.scene = scene;
    this.quality = quality;
    this.current = 'clear';
    this.target = 'clear';
    this.intensity = 0;
    this.snowIntensity = 0;
    this.wetness = 0;
    this.grip = 1;
    this.fogDensity = 0.0016;
    this.windAngle = 0.4;
    this.windSpeed = 2;

    this._buildRain();
    this._buildSnow();
  }

  _buildRain() {
    const count = this.quality === 'low' ? 400 : this.quality === 'medium' ? 900 : 1600;
    this.rainCount = count;
    const positions = new Float32Array(count * 6);
    this.rainData = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 70;
      const y = Math.random() * 40;
      const z = (Math.random() - 0.5) * 70;
      this.rainData.push({ x, y, z, speed: 26 + Math.random() * 16 });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainMaterial = new THREE.LineBasicMaterial({
      color: 0xaaccee,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    this.rain = new THREE.LineSegments(geo, this.rainMaterial);
    this.rain.frustumCulled = false;
    this.rain.visible = false;
    this.scene.add(this.rain);
  }

  _buildSnow() {
    const count = this.quality === 'low' ? 250 : 700;
    this.snowCount = count;
    const positions = new Float32Array(count * 3);
    this.snowData = [];
    for (let i = 0; i < count; i++) {
      this.snowData.push({
        x: (Math.random() - 0.5) * 70,
        y: Math.random() * 40,
        z: (Math.random() - 0.5) * 70,
        speed: 1.6 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
      });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.snowMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.16,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    this.snow = new THREE.Points(geo, this.snowMaterial);
    this.snow.frustumCulled = false;
    this.snow.visible = false;
    this.scene.add(this.snow);
  }

  setWeather(id) {
    this.target = id;
  }

  get definition() {
    return WEATHER_BY_ID[this.current] || WEATHER_BY_ID.clear;
  }

  update(dt, cameraPos, scene) {
    const target = WEATHER_BY_ID[this.target] || WEATHER_BY_ID.clear;
    this.intensity = damp(this.intensity, target.rain, 1.4, dt);
    this.snowIntensity = damp(this.snowIntensity, target.snow, 1.4, dt);
    this.grip = damp(this.grip, target.grip, 1.2, dt);
    this.wetness = damp(this.wetness, target.rain > 0 ? 1 : this.wetness * 0.999, 0.4, dt);
    this.fogDensity = damp(this.fogDensity, target.fog, 1.0, dt);
    this.current = this.target;

    if (scene && scene.fog) {
      scene.fog.density = this.fogDensity;
    }

    this.rain.visible = this.intensity > 0.02;
    if (this.rain.visible) this._updateRain(dt, cameraPos);
    this.snow.visible = this.snowIntensity > 0.02;
    if (this.snow.visible) this._updateSnow(dt, cameraPos);
  }

  _updateRain(dt, cameraPos) {
    const pos = this.rain.geometry.attributes.position.array;
    const count = this.rainCount;
    const visible = Math.floor(count * clamp01(this.intensity));
    for (let i = 0; i < count; i++) {
      const d = this.rainData[i];
      if (i < visible) {
        d.y -= d.speed * dt;
        d.x += this.windSpeed * Math.cos(this.windAngle) * dt;
        d.z += this.windSpeed * Math.sin(this.windAngle) * dt;
        if (d.y < 0) {
          d.y = 38;
          d.x = (Math.random() - 0.5) * 70;
          d.z = (Math.random() - 0.5) * 70;
        }
        if (cameraPos) {
          if (d.x > cameraPos.x + 35) d.x -= 70;
          if (d.x < cameraPos.x - 35) d.x += 70;
          if (d.z > cameraPos.z + 35) d.z -= 70;
          if (d.z < cameraPos.z - 35) d.z += 70;
        }
        const len = 1.1 + d.speed * 0.06;
        const o = i * 6;
        pos[o] = d.x;
        pos[o + 1] = d.y;
        pos[o + 2] = d.z;
        pos[o + 3] = d.x + this.windSpeed * Math.cos(this.windAngle) * 0.03;
        pos[o + 4] = d.y + len;
        pos[o + 5] = d.z + this.windSpeed * Math.sin(this.windAngle) * 0.03;
      } else {
        const o = i * 6;
        for (let k = 0; k < 6; k++) pos[o + k] = 0;
      }
    }
    this.rain.geometry.attributes.position.needsUpdate = true;
    this.rainMaterial.opacity = 0.25 + this.intensity * 0.4;
  }

  _updateSnow(dt, cameraPos) {
    const pos = this.snow.geometry.attributes.position.array;
    const visible = Math.floor(this.snowCount * clamp01(this.snowIntensity));
    for (let i = 0; i < this.snowCount; i++) {
      const d = this.snowData[i];
      if (i < visible) {
        d.y -= d.speed * dt;
        d.phase += dt * 1.4;
        d.x += Math.cos(d.phase) * 0.6 * dt + this.windSpeed * Math.cos(this.windAngle) * dt * 0.4;
        d.z += Math.sin(d.phase) * 0.6 * dt + this.windSpeed * Math.sin(this.windAngle) * dt * 0.4;
        if (d.y < 0) {
          d.y = 38;
          d.x = (Math.random() - 0.5) * 70;
          d.z = (Math.random() - 0.5) * 70;
        }
        if (cameraPos) {
          if (d.x > cameraPos.x + 35) d.x -= 70;
          if (d.x < cameraPos.x - 35) d.x += 70;
          if (d.z > cameraPos.z + 35) d.z -= 70;
          if (d.z < cameraPos.z - 35) d.z += 70;
        }
        const o = i * 3;
        pos[o] = d.x;
        pos[o + 1] = d.y;
        pos[o + 2] = d.z;
      } else {
        const o = i * 3;
        pos[o] = pos[o + 1] = pos[o + 2] = 0;
      }
    }
    this.snow.geometry.attributes.position.needsUpdate = true;
  }
}
