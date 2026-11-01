/**
 * Procedural bus model builder.
 *
 * Every bus in the catalogue is generated from its spec: shell, windows,
 * doors, lights, mirrors, interior (seats, dashboard, steering wheel),
 * wheels and all the customisation options.
 *
 * The model faces -Z (three.js convention). Local +X is the right hand side
 * of the vehicle, so the passenger doors sit on the LEFT (-X) exactly like a
 * real Indian bus, and the driver sits on the right.
 */

import * as THREE from '../../vendor/three.module.js';
import { mergeGeometries, trs, box, cylinder, cone, sphere } from '../world/geo.js';
import { BODY_COLORS, INTERIOR_COLORS, catalogEntry } from '../game/customization.js';

/** Bus side silhouette extruded along the width. */
function shellGeometry(spec) {
  const L = spec.length;
  const H = spec.height;
  const floorY = 0.62;
  const bodyTop = H;
  const shape = new THREE.Shape();
  const noseRake = spec.bodyStyle === 'mini' ? 0.9 : 1.45;
  const rearRake = spec.bodyStyle === 'volvo' || spec.bodyStyle === 'coach' ? 0.55 : 0.35;

  shape.moveTo(0, 0);
  shape.lineTo(floorY, 0);
  shape.lineTo(floorY + 0.05, -0.02);
  shape.lineTo(bodyTop - noseRake, -0.02);
  shape.quadraticCurveTo(bodyTop - 0.1, -0.02, bodyTop, 0.5);
  shape.lineTo(bodyTop, L - rearRake);
  shape.quadraticCurveTo(bodyTop, L, L - rearRake - 0.05, L);
  shape.lineTo(floorY + 0.05, L);
  shape.lineTo(floorY, L);
  shape.lineTo(0, L);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: spec.width,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.08,
    bevelSegments: 1,
    steps: 1,
  });
  geo.translate(0, 0, -spec.width / 2);
  geo.rotateY(Math.PI / 2);
  // After the rotation the profile lies along Z and the extrusion along X.
  geo.computeVertexNormals();
  return geo;
}

function wheelGeometry(radius, width) {
  const parts = [
    {
      geometry: new THREE.CylinderGeometry(radius, radius, width, 14),
      matrix: trs(0, 0, 0, 0, 0, Math.PI / 2),
    },
  ];
  return mergeGeometries(parts);
}

function rimGeometry(radius, width) {
  const r = radius * 0.58;
  const parts = [
    {
      geometry: new THREE.CylinderGeometry(r, r, width * 1.04, 12),
      matrix: trs(0, 0, 0, 0, 0, Math.PI / 2),
    },
  ];
  return mergeGeometries(parts);
}

/**
 * @param {object} spec bus spec
 * @param {object} custom customisation (from the save file)
 */
export function buildBusModel(spec, custom = {}) {
  const group = new THREE.Group();
  group.name = `Bus_${spec.id}`;

  const paintId = custom.bodyColor || spec.defaultPaint.replace('#', '');
  const paintHex = custom.bodyColor
    ? catalogEntry('bodyColors', custom.bodyColor).hex
    : spec.defaultPaint;
  const interiorId = custom.interiorColor || 'beige';
  const interiorHex = catalogEntry('interiorColors', interiorId).hex;

  const materials = {
    paint: new THREE.MeshLambertMaterial({ color: new THREE.Color(paintHex) }),
    paintDark: new THREE.MeshLambertMaterial({ color: new THREE.Color(paintHex).multiplyScalar(0.72) }),
    glass: new THREE.MeshLambertMaterial({
      color: 0x1b2a33,
      transparent: true,
      opacity: 0.55 + (custom.windowTint ?? 0.3) * 0.4,
    }),
    trim: new THREE.MeshLambertMaterial({ color: 0x24272b }),
    chrome: new THREE.MeshLambertMaterial({ color: 0xb9bec4 }),
    rubber: new THREE.MeshLambertMaterial({ color: 0x15171a }),
    interior: new THREE.MeshLambertMaterial({ color: new THREE.Color(interiorHex) }),
    seat: new THREE.MeshLambertMaterial({
      color:
        custom.seatDesign === 'velvet'
          ? 0x9c3f5a
          : custom.seatDesign === 'leather'
            ? 0x4a2f22
            : custom.seatDesign === 'reclining'
              ? 0x2f4a6b
              : 0x7a6a52,
    }),
    headlight: new THREE.MeshBasicMaterial({ color: 0xfff0c4 }),
    taillight: new THREE.MeshBasicMaterial({ color: 0x8a1414 }),
    indicatorLeft: new THREE.MeshBasicMaterial({ color: 0x3a2410 }),
    indicatorRight: new THREE.MeshBasicMaterial({ color: 0x3a2410 }),
    plate: new THREE.MeshLambertMaterial({ color: 0xf2f2f2 }),
  };

  const L = spec.length;
  const W = spec.width;
  const H = spec.height;
  const floorY = 0.62;
  const isDouble = spec.bodyStyle === 'double';
  const isSleeper = spec.bodyStyle === 'sleeper';

  // ------------------------------------------------------------------ shell
  const shell = new THREE.Mesh(shellGeometry(spec), materials.paint);
  shell.castShadow = true;
  shell.receiveShadow = true;
  group.add(shell);

  // Skirt / lower band (two tone paint option).
  const skirt = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.06, 0.62, L - 0.3),
    custom.paint === 'two_tone' ? materials.paintDark : materials.paint
  );
  skirt.position.set(0, 0.42, -L / 2 + 0.15);
  skirt.castShadow = true;
  group.add(skirt);

  // Roof with a raised AC unit for the long distance buses.
  const roof = new THREE.Mesh(new THREE.BoxGeometry(W - 0.18, 0.16, L - 1.2), materials.paintDark);
  roof.position.set(0, H - 0.02, -L / 2 + 0.6);
  group.add(roof);
  if (spec.bodyStyle === 'coach' || spec.bodyStyle === 'volvo' || spec.bodyStyle === 'sleeper') {
    const ac = new THREE.Mesh(new THREE.BoxGeometry(W - 0.6, 0.34, 2.2), materials.trim);
    ac.position.set(0, H + 0.14, -L / 2 + 1.6);
    ac.castShadow = true;
    group.add(ac);
  }

  // Waist stripe (paint option 'stripe' / 'livery').
  if (custom.paint === 'stripe' || custom.paint === 'livery') {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(W + 0.04, 0.22, L - 0.6),
      custom.paint === 'livery' ? materials.paintDark : materials.chrome
    );
    stripe.position.set(0, floorY + 0.72, -L / 2 + 0.3);
    group.add(stripe);
  }

  // ---------------------------------------------------------------- windows
  const windowBands = [];
  if (isDouble) {
    windowBands.push({ y: floorY + 0.95, h: 0.95 });
    windowBands.push({ y: floorY + 2.55, h: 1.0 });
  } else if (isSleeper) {
    windowBands.push({ y: floorY + 1.35, h: 0.85 });
  } else {
    windowBands.push({ y: floorY + 0.85, h: spec.bodyStyle === 'mini' ? 0.95 : 1.15 });
  }

  const glassMeshes = [];
  for (const band of windowBands) {
    const front = -L / 2 + 1.35;
    const back = -L / 2 + L - 1.5;
    const len = back - front;
    // Side windows (left and right).
    for (const side of [1, -1]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.06, band.h, len), materials.glass);
      win.position.set(side * (W / 2 - 0.02), band.y, (front + back) / 2);
      group.add(win);
      glassMeshes.push(win);
      // Window pillars.
      const pillars = Math.max(3, Math.round(len / 1.6));
      for (let k = 0; k <= pillars; k++) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.08, band.h + 0.08, 0.12), materials.trim);
        pillar.position.set(side * (W / 2 - 0.01), band.y, front + (len * k) / pillars);
        group.add(pillar);
      }
    }
  }

  // Windscreen + rear window.
  const screenHeight = windowBands[0].h + 0.25;
  const windscreen = new THREE.Mesh(new THREE.BoxGeometry(W - 0.3, screenHeight, 0.08), materials.glass);
  windscreen.position.set(0, windowBands[0].y + screenHeight / 2 - 0.12, -L / 2 + 0.32);
  windscreen.rotation.x = -0.12;
  group.add(windscreen);
  glassMeshes.push(windscreen);

  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(W - 0.5, windowBands[0].h, 0.08), materials.glass);
  rearGlass.position.set(0, windowBands[0].y, -L / 2 + L - 0.1);
  group.add(rearGlass);
  glassMeshes.push(rearGlass);

  // ------------------------------------------------------------------ doors
  // Doors are on the LEFT (-X) side, like every Indian bus.
  const doorZ = -L / 2 + (spec.bodyStyle === 'mini' ? 1.1 : 1.5);
  const doors = [];
  const doorCount = spec.bodyStyle === 'mini' || spec.bodyStyle === 'school' ? 1 : 2;
  for (let d = 0; d < doorCount; d++) {
    const doorGroup = new THREE.Group();
    const panelW = 0.95;
    const panelH = windowBands[0].h + 0.55;
    for (const leaf of [0, 1]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.1, panelH, panelW), materials.paintDark);
      panel.position.set(0, windowBands[0].y + panelH / 2 - 0.45, (leaf - 0.5) * panelW);
      panel.castShadow = true;
      doorGroup.add(panel);
      const glass = new THREE.Mesh(new THREE.BoxGeometry(0.06, panelH * 0.5, panelW * 0.8), materials.glass);
      glass.position.set(-0.03, panelH * 0.18, (leaf - 0.5) * panelW);
      doorGroup.add(glass);
    }
    doorGroup.position.set(-(W / 2 + 0.02), 0, doorZ + d * 1.25);
    group.add(doorGroup);
    doors.push(doorGroup);
  }

  // ------------------------------------------------------------------ lights
  const headlightMeshes = [];
  const taillightMeshes = [];
  const frontZ = -L / 2 + 0.06;
  const rearZ = -L / 2 + L - 0.06;
  for (const side of [1, -1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.12), materials.headlight);
    hl.position.set(side * (W / 2 - 0.42), floorY + 0.22, frontZ);
    group.add(hl);
    headlightMeshes.push(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.1), materials.taillight);
    tl.position.set(side * (W / 2 - 0.4), floorY + 0.25, rearZ);
    group.add(tl);
    taillightMeshes.push(tl);
  }

  const indicatorLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.1), materials.indicatorLeft);
  indicatorLeft.position.set(W / 2 - 0.85, floorY + 0.25, frontZ);
  group.add(indicatorLeft);
  const indicatorRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.1), materials.indicatorRight);
  indicatorRight.position.set(-(W / 2 - 0.85), floorY + 0.25, frontZ);
  group.add(indicatorRight);

  const brakeLights = [];
  for (const side of [1, -1]) {
    const bl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.08), new THREE.MeshBasicMaterial({ color: 0x3a0c0c }));
    bl.position.set(side * (W / 2 - 0.4), floorY - 0.05, rearZ - 0.02);
    group.add(bl);
    brakeLights.push(bl);
  }

  // Bumpers, grille, mirrors.
  const bumperFront = new THREE.Mesh(new THREE.BoxGeometry(W + 0.05, 0.3, 0.3), materials.trim);
  bumperFront.position.set(0, floorY - 0.18, frontZ - 0.05);
  group.add(bumperFront);
  const bumperRear = new THREE.Mesh(new THREE.BoxGeometry(W + 0.05, 0.3, 0.3), materials.trim);
  bumperRear.position.set(0, floorY - 0.18, rearZ + 0.05);
  group.add(bumperRear);
  const grille = new THREE.Mesh(new THREE.BoxGeometry(W * 0.55, 0.4, 0.1), materials.chrome);
  grille.position.set(0, floorY + 0.18, frontZ - 0.02);
  group.add(grille);

  const mirrors = [];
  for (const side of [1, -1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.06), materials.trim);
    arm.position.set(side * (W / 2 + 0.2), floorY + 1.35, frontZ + 0.4);
    group.add(arm);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 0.22), materials.trim);
    mirror.position.set(side * (W / 2 + 0.46), floorY + 1.3, frontZ + 0.4);
    group.add(mirror);
    mirrors.push(mirror);
  }

  // ---------------------------------------------------------------- wheels
  const wheels = [];
  const wheelPositions = [];
  const axleF = -L / 2 + spec.frontOverhang + 0.1;
  const axleR = axleF - spec.wheelbase;
  const halfTrack = W / 2 - 0.12;
  const tyreGeo = wheelGeometry(spec.tireRadius, spec.tireWidth);
  const rimGeo = rimGeometry(spec.tireRadius, spec.tireWidth);
  const rimMat =
    custom.rims === 'polished'
      ? new THREE.MeshLambertMaterial({ color: 0xd7dbe0 })
      : custom.rims === 'painted'
        ? new THREE.MeshLambertMaterial({ color: 0x2f4f7a })
        : materials.chrome;

  const wheelDefs = [
    { x: halfTrack, z: axleF, steer: true },
    { x: -halfTrack, z: axleF, steer: true },
    { x: halfTrack, z: axleR, steer: false },
    { x: -halfTrack, z: axleR, steer: false },
  ];
  // Rear twin wheels on the heavier buses.
  if (spec.mass > 9000) {
    wheelDefs.push({ x: halfTrack + 0.3, z: axleR, steer: false });
    wheelDefs.push({ x: -halfTrack - 0.3, z: axleR, steer: false });
  }
  for (const def of wheelDefs) {
    const pivot = new THREE.Group();
    pivot.position.set(def.x, spec.tireRadius, def.z);
    const spinner = new THREE.Group();
    const tyre = new THREE.Mesh(tyreGeo, materials.rubber);
    tyre.castShadow = true;
    spinner.add(tyre);
    const rim = new THREE.Mesh(rimGeo, custom.wheels === 'alloy' ? rimMat : rimMat);
    spinner.add(rim);
    if (custom.wheels === 'chrome') {
      const cover = new THREE.Mesh(
        new THREE.CylinderGeometry(spec.tireRadius * 0.6, spec.tireRadius * 0.6, spec.tireWidth * 1.1, 12),
        materials.chrome
      );
      cover.rotation.z = Math.PI / 2;
      spinner.add(cover);
    }
    pivot.add(spinner);
    group.add(pivot);
    wheels.push({ pivot, spinner, steer: def.steer, x: def.x, z: def.z });
  }

  // -------------------------------------------------------------- interior
  const interior = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 0.08, L - 0.5), materials.interior);
  floor.position.set(0, floorY, -L / 2 + 0.25);
  interior.add(floor);

  // Seats.
  const seatRows = Math.max(4, spec.seatRows);
  const seatsPerRow = spec.seatsPerRow;
  const seatSpacing = (L - 3.4) / seatRows;
  const seatMeshes = [];
  for (let r = 0; r < seatRows; r++) {
    const z = -L / 2 + 2.4 + r * seatSpacing;
    if (z > -L / 2 + L - 1.6) break;
    for (let s = 0; s < seatsPerRow; s++) {
      const x = -W / 2 + 0.42 + s * ((W - 1.0) / Math.max(1, seatsPerRow - 1));
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.46), materials.seat);
      seat.position.set(x, floorY + 0.42, z);
      interior.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.1), materials.seat);
      back.position.set(x, floorY + 0.7, z + 0.2);
      interior.add(back);
      seatMeshes.push(seat, back);
    }
  }
  if (isDouble) {
    for (let r = 0; r < (spec.upperDeckRows || 6); r++) {
      const z = -L / 2 + 3.0 + r * seatSpacing;
      if (z > -L / 2 + L - 2.0) break;
      const deck = new THREE.Mesh(new THREE.BoxGeometry(W - 0.5, 0.1, L - 4), materials.interior);
      deck.position.set(0, floorY + 2.0, -L / 2 + L / 2);
      interior.add(deck);
      for (let s = 0; s < (spec.upperDeckSeatsPerRow || 3); s++) {
        const x = -W / 2 + 0.5 + s * ((W - 1.2) / 2);
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.46), materials.seat);
        seat.position.set(x, floorY + 2.45, z);
        interior.add(seat);
        seatMeshes.push(seat);
      }
    }
  }

  // Driver cabin: dashboard, steering wheel, seat.
  const dash = new THREE.Mesh(new THREE.BoxGeometry(W - 0.6, 0.28, 0.5), materials.trim);
  dash.position.set(0, floorY + 0.72, -L / 2 + 0.62);
  interior.add(dash);
  const steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 6, 14), materials.trim);
  steeringWheel.position.set(W / 2 - 0.62, floorY + 0.86, -L / 2 + 0.78);
  steeringWheel.rotation.set(0, Math.PI / 2, 0.45);
  interior.add(steeringWheel);
  const driverSeat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.5), materials.seat);
  driverSeat.position.set(W / 2 - 0.62, floorY + 0.5, -L / 2 + 1.35);
  interior.add(driverSeat);
  const driverBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.62, 0.1), materials.seat);
  driverBack.position.set(W / 2 - 0.62, floorY + 0.82, -L / 2 + 1.58);
  interior.add(driverBack);

  group.add(interior);

  // ------------------------------------------------------- plate + stickers
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 0.04), materials.plate);
  plate.position.set(0, floorY - 0.16, rearZ + 0.12);
  group.add(plate);

  const stickerMeshes = [];
  const stickerDefs = {
    route: { w: 1.1, h: 0.3, color: 0xf2f2f2 },
    temple: { w: 0.7, h: 0.7, color: 0xd96b3a },
    lotus: { w: 0.6, h: 0.6, color: 0xe06a8a },
    tiger: { w: 1.4, h: 0.34, color: 0xe08a2a },
    city: { w: 1.3, h: 0.34, color: 0x3f6fa8 },
    tricolor: { w: 1.6, h: 0.18, color: 0xffffff },
    khelo: { w: 0.8, h: 0.8, color: 0x2f7fb0 },
  };
  for (const id of custom.stickers || []) {
    const def = stickerDefs[id];
    if (!def) continue;
    const sticker = new THREE.Mesh(
      new THREE.BoxGeometry(def.w, def.h, 0.03),
      new THREE.MeshLambertMaterial({ color: def.color })
    );
    sticker.position.set(-W / 2 - 0.02, floorY + 0.5, -L / 2 + L * 0.45);
    group.add(sticker);
    stickerMeshes.push(sticker);
  }

  group.userData = {
    materials,
    glassMeshes,
    doors,
    wheels,
    headlightMeshes,
    taillightMeshes,
    brakeLights,
    indicatorLeft,
    indicatorRight,
    steeringWheel,
    seatMeshes,
    plate,
    stickerMeshes,
    mirrors,
    spec,
  };

  return group;
}

/** Apply a customisation set to an already built model (instant preview). */
export function applyCustomization(model, custom, spec) {
  const data = model.userData;
  const materials = data.materials;
  const paintHex = custom.bodyColor
    ? catalogEntry('bodyColors', custom.bodyColor).hex
    : spec.defaultPaint;
  materials.paint.color.set(paintHex);
  materials.paintDark.color.set(new THREE.Color(paintHex).multiplyScalar(0.72));
  const interiorHex = catalogEntry('interiorColors', custom.interiorColor || 'beige').hex;
  materials.interior.color.set(interiorHex);
  materials.seat.color.set(
    custom.seatDesign === 'velvet'
      ? 0x9c3f5a
      : custom.seatDesign === 'leather'
        ? 0x4a2f22
        : custom.seatDesign === 'reclining'
          ? 0x2f4a6b
          : 0x7a6a52
  );
  materials.glass.opacity = 0.55 + (custom.windowTint ?? 0.3) * 0.4;

  const headlight = catalogEntry('headlights', custom.headlights || 'halogen');
  materials.headlight.color.set(headlight.color);

  // Stickers: rebuild from scratch.
  for (const s of data.stickerMeshes) {
    model.remove(s);
    s.geometry.dispose();
  }
  data.stickerMeshes = [];
  const stickerDefs = {
    route: { w: 1.1, h: 0.3, color: 0xf2f2f2 },
    temple: { w: 0.7, h: 0.7, color: 0xd96b3a },
    lotus: { w: 0.6, h: 0.6, color: 0xe06a8a },
    tiger: { w: 1.4, h: 0.34, color: 0xe08a2a },
    city: { w: 1.3, h: 0.34, color: 0x3f6fa8 },
    tricolor: { w: 1.6, h: 0.18, color: 0xffffff },
    khelo: { w: 0.8, h: 0.8, color: 0x2f7fb0 },
  };
  for (const id of custom.stickers || []) {
    const def = stickerDefs[id];
    if (!def) continue;
    const sticker = new THREE.Mesh(
      new THREE.BoxGeometry(def.w, def.h, 0.03),
      new THREE.MeshLambertMaterial({ color: def.color })
    );
    sticker.position.set(-spec.width / 2 - 0.02, 0.62 + 0.5, -spec.length / 2 + spec.length * 0.45);
    model.add(sticker);
    data.stickerMeshes.push(sticker);
  }
  return model;
}
