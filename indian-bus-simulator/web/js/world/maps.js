/**
 * Map generation. Each map builds a road network, dresses it with props,
 * bus stops, signals, fuel stations and collision data, and returns a ready
 * to use MapInstance.
 */

import * as THREE from '../../vendor/three.module.js';
import { RoadNetwork, smoothPolyline, LANE_WIDTH } from './roadnet.js';
import { PropScatter, TrafficSignal } from './props.js';
import { getMapDef } from './mapdefs.js';
import { makeRng, clamp } from '../util/math.js';

const STOP_NAMES = [
  'Bus Stand',
  'Market Chowk',
  'Civil Lines',
  'Temple Junction',
  'Railway Station',
  'College Gate',
  'Nehru Nagar',
  'Old Bazaar',
  'Water Works',
  'Green Park',
  'Mill Gate',
  'Lakeside',
  'Kurkumbagh',
  'AIIMS Crossing',
  'Ring Road Exit',
  'Dharampura',
  'Hudco Colony',
  'Power House',
];

function groundPlane(size, color) {
  const geo = new THREE.PlaneGeometry(size, size, 1, 1);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'Ground';
  return mesh;
}

/** Water body (river / lake) as a flat translucent plane. */
function waterPlane(x, z, width, length, rotationY, color = 0x2f6f8f) {
  const geo = new THREE.PlaneGeometry(width, length);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshLambertMaterial({
    color,
    transparent: true,
    opacity: 0.82,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, -0.25, z);
  mesh.rotation.y = rotationY;
  mesh.name = 'Water';
  return mesh;
}

/**
 * Core map instance.
 */
export class MapInstance {
  constructor(def, network) {
    this.def = def;
    this.id = def.id;
    this.network = network;
    this.group = new THREE.Group();
    this.group.name = `Map_${def.id}`;
    this.props = new PropScatter();
    this.stops = [];
    this.signals = [];
    this.colliders = [];
    this.spawnPoints = [];
    this.destinations = [];
    this.startPose = { x: 0, y: 0, yaw: 0 };
    this.routePath = [];
    this.fuelStations = [];
    this.parkingBays = [];
    this.lampMeshes = [];
    this.emissiveMeshes = [];
  }

  addCollider(c) {
    this.colliders.push(c);
    return c;
  }
}

/* ------------------------------------------------------------------ layouts */

function buildCity(def, rng) {
  const net = new RoadNetwork(Math.floor(rng() * 100000));
  const size = def.size;
  const cols = 8;
  const rows = 8;
  const spacing = size / cols;
  const nodes = [];

  for (let i = 0; i <= cols; i++) {
    nodes[i] = [];
    for (let j = 0; j <= rows; j++) {
      const jitter = i === 0 || j === 0 || i === cols || j === rows ? 0 : 7;
      const x = -size / 2 + i * spacing + (rng() - 0.5) * jitter;
      const y = -size / 2 + j * spacing + (rng() - 0.5) * jitter;
      nodes[i][j] = net.addNode(x, y);
    }
  }

  const isMain = (i, j) => i === 0 || j === 0 || i === cols || j === rows || i === 3 || j === 4;
  const widthFor = (i, j) => (isMain(i, j) ? 16 : 11);
  const lanesFor = (i, j) => (isMain(i, j) ? 4 : 2);

  // Horizontal + vertical streets.
  for (let i = 0; i <= cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (!isMain(i, j) && rng() < 0.12) continue;
      net.addEdge(nodes[i][j], nodes[i][j + 1], {
        width: widthFor(i, j),
        lanes: lanesFor(i, j),
        type: isMain(i, j) ? 'avenue' : 'street',
      });
    }
  }
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (!isMain(i, j) && rng() < 0.12) continue;
      net.addEdge(nodes[i][j], nodes[i + 1][j], {
        width: widthFor(i, j),
        lanes: lanesFor(i, j),
        type: isMain(i, j) ? 'avenue' : 'street',
      });
    }
  }

  // One diagonal avenue for character.
  net.addEdge(nodes[1][1], nodes[2][2], { width: 12, lanes: 2, type: 'street' });
  net.addEdge(nodes[2][2], nodes[3][3], { width: 12, lanes: 2, type: 'street' });

  // River crossing the map north-south with a bridge on the main avenue.
  const riverX = size * 0.18;
  const bridgeCol = 4;
  for (let j = 0; j < rows; j++) {
    const edge = net.addEdge(nodes[bridgeCol][j], nodes[bridgeCol][j + 1], {
      width: 14,
      lanes: 2,
      type: 'bridge',
      elevated: true,
      points: [
        { x: net.nodes[nodes[bridgeCol][j]].x, y: net.nodes[nodes[bridgeCol][j]].y, z: 0 },
        { x: net.nodes[nodes[bridgeCol][j + 1]].x, y: net.nodes[nodes[bridgeCol][j + 1]].y, z: 0 },
      ],
    });
    void edge;
  }

  net.finalise();
  return { net, nodes, cols, rows, spacing, riverX };
}

function buildVillage(def, rng) {
  const net = new RoadNetwork(Math.floor(rng() * 100000));
  const main = [];
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    main.push({
      x: -def.size / 2 + t * def.size,
      y: Math.sin(t * Math.PI * 1.4) * 70 + (rng() - 0.5) * 20,
    });
  }
  const smooth = smoothPolyline(main, 6);
  let prev = net.addNode(smooth[0].x, smooth[0].y);
  const mainNodes = [prev];
  for (let i = 1; i < smooth.length - 1; i++) {
    if (i % 6 !== 0) continue;
    const n = net.addNode(smooth[i].x, smooth[i].y);
    net.addEdge(prev, n, {
      width: 9,
      lanes: 2,
      type: 'road',
      points: smooth.slice(Math.max(0, i - 6), i + 1),
    });
    prev = n;
    mainNodes.push(n);
  }
  net.addEdge(prev, net.addNode(smooth[smooth.length - 1].x, smooth[smooth.length - 1].y), {
    width: 9,
    lanes: 2,
    type: 'road',
    points: smooth.slice(smooth.length - 7),
  });

  // Village lanes branching off the main road.
  const laneCount = 5;
  for (let k = 0; k < laneCount; k++) {
    const idx = 2 + Math.floor((k / laneCount) * (mainNodes.length - 4));
    const base = net.nodes[mainNodes[idx]];
    const side = k % 2 === 0 ? 1 : -1;
    const len = 90 + rng() * 90;
    const ang = side * (Math.PI / 2) + (rng() - 0.5) * 0.5;
    const end = net.addNode(base.x + Math.cos(ang) * len, base.y + Math.sin(ang) * len);
    const mid = net.addNode(
      base.x + Math.cos(ang) * len * 0.5 + (rng() - 0.5) * 20,
      base.y + Math.sin(ang) * len * 0.5 + (rng() - 0.5) * 20
    );
    net.addEdge(mainNodes[idx], mid, { width: 6.5, lanes: 1, type: 'lane' });
    net.addEdge(mid, end, { width: 6.5, lanes: 1, type: 'lane' });
  }

  net.finalise();
  return { net, mainNodes };
}

function buildHighway(def, rng, opts = {}) {
  const net = new RoadNetwork(Math.floor(rng() * 100000));
  const length = def.size;
  const pts = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push({
      x: -length / 2 + t * length,
      y: Math.sin(t * Math.PI * 1.8) * 160 + (rng() - 0.5) * 60,
    });
  }
  const smooth = smoothPolyline(pts, 6);
  const nodes = [];
  let prev = net.addNode(smooth[0].x, smooth[0].y);
  nodes.push(prev);
  for (let i = 6; i < smooth.length - 6; i += 6) {
    const n = net.addNode(smooth[i].x, smooth[i].y);
    net.addEdge(prev, n, {
      width: 20,
      lanes: 4,
      type: 'highway',
      points: smooth.slice(i - 6, i + 1),
    });
    prev = n;
    nodes.push(n);
  }
  const last = net.addNode(smooth[smooth.length - 1].x, smooth[smooth.length - 1].y);
  net.addEdge(prev, last, {
    width: 20,
    lanes: 4,
    type: 'highway',
    points: smooth.slice(smooth.length - 12),
  });
  nodes.push(last);

  // Service road running parallel to the highway.
  if (opts.serviceRoad !== false) {
    const svc = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      svc.push({
        x: -length / 2 + t * length,
        y: Math.sin(t * Math.PI * 1.8) * 160 + 55 + (rng() - 0.5) * 20,
      });
    }
    const svcSmooth = smoothPolyline(svc, 5);
    let sp = net.addNode(svcSmooth[0].x, svcSmooth[0].y);
    for (let i = 5; i < svcSmooth.length - 5; i += 5) {
      const n = net.addNode(svcSmooth[i].x, svcSmooth[i].y);
      net.addEdge(sp, n, { width: 8, lanes: 2, type: 'service', points: svcSmooth.slice(i - 5, i + 1) });
      sp = n;
    }
  }

  net.finalise();
  return { net, nodes };
}

function buildMountain(def, rng) {
  const net = new RoadNetwork(Math.floor(rng() * 100000));
  const pts = [];
  const steps = 26;
  let y = -def.size * 0.45;
  let z = 0;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = -def.size * 0.42 + t * def.size * 0.84;
    // Hairpin pattern: alternate lateral swings while climbing.
    const swing = Math.sin(t * Math.PI * 6) * 120;
    y += 130 * Math.cos(t * Math.PI * 5.5);
    z = t * 90;
    pts.push({ x, y: y + swing * 0.35, z });
  }
  const smooth = smoothPolyline(pts, 5);
  let prev = net.addNode(smooth[0].x, smooth[0].y, smooth[0].z);
  const nodes = [prev];
  for (let i = 5; i < smooth.length - 5; i += 5) {
    const n = net.addNode(smooth[i].x, smooth[i].y, smooth[i].z);
    net.addEdge(prev, n, {
      width: 11,
      lanes: 2,
      type: 'mountain',
      points: smooth.slice(i - 5, i + 1),
    });
    prev = n;
    nodes.push(n);
  }
  net.finalise();
  return { net, nodes };
}

function buildDesert(def, rng) {
  const net = new RoadNetwork(Math.floor(rng() * 100000));
  const pts = [];
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push({ x: -def.size / 2 + t * def.size, y: Math.sin(t * Math.PI * 1.2) * 120 });
  }
  const smooth = smoothPolyline(pts, 6);
  let prev = net.addNode(smooth[0].x, smooth[0].y);
  const nodes = [prev];
  for (let i = 6; i < smooth.length - 6; i += 6) {
    const n = net.addNode(smooth[i].x, smooth[i].y);
    net.addEdge(prev, n, {
      width: 17,
      lanes: 4,
      type: 'highway',
      points: smooth.slice(i - 6, i + 1),
    });
    prev = n;
    nodes.push(n);
  }
  const last = net.addNode(smooth[smooth.length - 1].x, smooth[smooth.length - 1].y);
  net.addEdge(prev, last, { width: 17, lanes: 4, type: 'highway', points: smooth.slice(smooth.length - 12) });
  nodes.push(last);
  net.finalise();
  return { net, nodes };
}

/* ------------------------------------------------------------ map assembly */

export function generateMap(mapId, options = {}) {
  const def = getMapDef(mapId);
  const rng = makeRng(options.seed || hashString(mapId));
  const map = new MapInstance(def, null);

  let layoutData;
  switch (def.layout) {
    case 'city':
      layoutData = buildCity(def, rng);
      break;
    case 'village':
      layoutData = buildVillage(def, rng);
      break;
    case 'mountain':
      layoutData = buildMountain(def, rng);
      break;
    case 'desert':
      layoutData = buildDesert(def, rng);
      break;
    case 'highway':
    default:
      layoutData = buildHighway(def, rng, { serviceRoad: def.id === 'national_highway' });
      break;
  }

  const net = layoutData.net;
  map.network = net;

  // ------------------------------------------------------------- ground
  map.group.add(groundPlane(def.size * 1.6, def.palette.ground));

  // ------------------------------------------------------------- props
  const scatter = map.props;
  const palette = def.palette;

  if (def.layout === 'city') {
    dressCity(map, layoutData, scatter, rng, palette, def);
  } else if (def.layout === 'village') {
    dressVillage(map, layoutData, scatter, rng, palette, def);
  } else if (def.layout === 'mountain') {
    dressMountain(map, layoutData, scatter, rng, palette, def);
  } else if (def.layout === 'desert') {
    dressDesert(map, layoutData, scatter, rng, palette, def);
  } else {
    dressHighway(map, layoutData, scatter, rng, palette, def);
  }

  // Build the instanced prop meshes.
  const propsGroup = scatter.build({ shadows: options.shadows !== false, palette });
  map.group.add(propsGroup);
  map.emissiveMeshes = propsGroup.userData.emissives || [];

  // Road surface + markings.
  const roadMeshes = net.buildMeshes(palette, options.quality || 'high');
  map.group.add(roadMeshes.group);

  // ------------------------------------------------------------- traffic
  buildSpawnPoints(map, rng, def);
  buildSignals(map, rng, def);
  buildStops(map, rng, def, layoutData);
  buildParkingBays(map, rng, def, layoutData);

  // Depot / start position: the first node of the network.
  const startNode = net.nodes[0];
  map.startPose = { x: startNode.x, y: startNode.y, yaw: 0 };
  map.depot = { x: startNode.x, y: startNode.y };

  // GPS route: depot -> a far node across the map.
  const farNode = pickFarNode(net, 0);
  const route = net.findRoute(0, farNode) || [0];
  map.routePath = route.map((n) => ({ x: net.nodes[n].x, y: net.nodes[n].y }));
  map.destinations = route
    .filter((_, i) => i % Math.max(1, Math.floor(route.length / 4)) === 0)
    .map((n) => ({ x: net.nodes[n].x, y: net.nodes[n].y, name: 'Depot stop' }));

  return map;
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickFarNode(net, from) {
  let best = from;
  let bestDist = -1;
  for (let i = 0; i < net.nodes.length; i++) {
    const d = Math.hypot(net.nodes[i].x - net.nodes[from].x, net.nodes[i].y - net.nodes[from].y);
    if (d > bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

function dressCity(map, layout, scatter, rng, palette, def) {
  const net = layout.net;
  const { cols, rows, spacing } = layout;

  // River band.
  const riverWidth = 46;
  const river = waterPlane(layout.riverX, 0, riverWidth, def.size, 0, 0x2d6f8f);
  map.group.add(river);

  // Buildings in every block.
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const cx = -def.size / 2 + (i + 0.5) * spacing;
      const cy = -def.size / 2 + (j + 0.5) * spacing;
      if (Math.abs(cx - layout.riverX) < riverWidth) continue;
      const count = 2 + Math.floor(rng() * 4);
      for (let k = 0; k < count; k++) {
        const w = 12 + rng() * 16;
        const d = 12 + rng() * 16;
        const h = 8 + rng() * 26;
        const px = cx + (rng() - 0.5) * spacing * 0.6;
        const py = cy + (rng() - 0.5) * spacing * 0.6;
        if (Math.abs(px - layout.riverX) < riverWidth * 0.8) continue;
        const color = palette.building[Math.floor(rng() * palette.building.length)];
        scatter.add('building', {
          x: px,
          y: 0,
          z: py,
          sx: w,
          sy: h,
          sz: d,
          ry: Math.round(rng() * 4) * (Math.PI / 2) + (rng() - 0.5) * 0.2,
          color,
        });
        scatter.add('buildingRoof', {
          x: px,
          y: h,
          z: py,
          sx: w * 1.08,
          sy: 0.7,
          sz: d * 1.08,
          ry: 0,
          color: palette.roof[Math.floor(rng() * palette.roof.length)],
        });
        map.addCollider({ type: 'box', x: px, y: py, hx: w / 2, hy: d / 2, yaw: 0 });
      }
      // A couple of street trees per block.
      const treeCount = 2 + Math.floor(rng() * 3);
      for (let k = 0; k < treeCount; k++) {
        const px = cx + (rng() - 0.5) * spacing * 0.8;
        const py = cy + (rng() - 0.5) * spacing * 0.8;
        if (Math.abs(px - layout.riverX) < riverWidth) continue;
        scatter.add(rng() < 0.2 ? 'palm' : 'tree', {
          x: px,
          y: 0,
          z: py,
          sx: 1.6 + rng() * 0.8,
          sy: 2 + rng() * 2.4,
          sz: 1.6 + rng() * 0.8,
          ry: rng() * Math.PI,
          color: palette.foliage,
        });
        map.addCollider({ type: 'circle', x: px, y: py, radius: 0.6 });
      }
    }
  }

  // Street lamps along the avenues.
  for (const edge of net.edges) {
    if (edge.type !== 'avenue' && edge.type !== 'bridge') continue;
    const count = Math.floor(edge.length / 55);
    for (let k = 0; k < count; k++) {
      const s = (k + 0.5) * (edge.length / count);
      const p = net.pointAt(edge, s);
      const side = k % 2 === 0 ? 1 : -1;
      const ox = -p.dy * side * (edge.width / 2 + 1.2);
      const oy = p.dx * side * (edge.width / 2 + 1.2);
      scatter.add('lamp', {
        x: p.x + ox,
        y: 0,
        z: p.y + oy,
        ry: Math.atan2(-p.dx, -p.dy),
        sx: 1,
        sy: 1,
        sz: 1,
      });
      scatter.add('lampHead', {
        x: p.x + ox,
        y: 0,
        z: p.y + oy,
        ry: Math.atan2(-p.dx, -p.dy),
        sx: 1,
        sy: 1,
        sz: 1,
      });
    }
  }

  // Road signs at a few intersections.
  for (let k = 0; k < 10; k++) {
    const edge = net.randomEdge(rng);
    const p = net.pointAt(edge, rng() * edge.length);
    scatter.add('sign', {
      x: p.x + -p.dy * (edge.width / 2 + 2),
      y: 0,
      z: p.y + p.dx * (edge.width / 2 + 2),
      ry: Math.atan2(-p.dx, -p.dy),
      sx: 1.1,
      sy: 1.1,
      sz: 1.1,
      color: 0x2f6fa8,
    });
  }

  // Petrol pump on a corner block.
  const pumpEdge = net.edges.find((e) => e.type === 'avenue') || net.edges[0];
  const pumpPoint = net.pointAt(pumpEdge, Math.min(40, pumpEdge.length * 0.3));
  const px = pumpPoint.x + -pumpPoint.dy * (pumpEdge.width / 2 + 9);
  const py = pumpPoint.y + pumpPoint.dx * (pumpEdge.width / 2 + 9);
  scatter.add('pump', { x: px, y: 0, z: py, ry: Math.atan2(pumpPoint.dx, pumpPoint.dy) });
  scatter.add('canopy', { x: px, y: 0, z: py, ry: Math.atan2(pumpPoint.dx, pumpPoint.dy) });
  map.addCollider({ type: 'box', x: px, y: py, hx: 2.5, hy: 2.5, yaw: 0 });
  map.fuelStations.push({ x: px, y: py, radius: 26, name: 'HP Petrol Pump' });

  // River bank colliders (keep the bus out of the water except at the bridge).
  for (let k = 0; k < 22; k++) {
    const y = -def.size / 2 + (k / 21) * def.size;
    map.addCollider({ type: 'circle', x: layout.riverX - riverWidth / 2, y, radius: 2 });
    map.addCollider({ type: 'circle', x: layout.riverX + riverWidth / 2, y, radius: 2 });
  }
}

function dressVillage(map, layout, scatter, rng, palette, def) {
  const net = layout.net;

  // River along the south.
  const river = waterPlane(0, -def.size * 0.36, def.size * 1.2, 34, 0.12, 0x3a7f9a);
  map.group.add(river);

  // Houses along the main road and lanes.
  for (const edge of net.edges) {
    const count = Math.max(1, Math.floor(edge.length / 34));
    for (let k = 0; k < count; k++) {
      const s = (k + 0.4) * (edge.length / count);
      const p = net.pointAt(edge, s);
      const side = k % 2 === 0 ? 1 : -1;
      const dist = edge.width / 2 + 8 + rng() * 16;
      const px = p.x + -p.dy * side * dist;
      const py = p.y + p.dx * side * dist;
      const w = 7 + rng() * 6;
      const d = 6 + rng() * 6;
      const h = 3.6 + rng() * 3;
      scatter.add('building', {
        x: px,
        y: 0,
        z: py,
        sx: w,
        sy: h,
        sz: d,
        ry: Math.atan2(p.dx, p.dy) + (rng() - 0.5) * 0.4,
        color: palette.building[Math.floor(rng() * palette.building.length)],
      });
      scatter.add('buildingRoof', {
        x: px,
        y: h,
        z: py,
        sx: w * 1.15,
        sy: 0.5,
        sz: d * 1.15,
        ry: Math.atan2(p.dx, p.dy),
        color: palette.roof[Math.floor(rng() * palette.roof.length)],
      });
      map.addCollider({ type: 'box', x: px, y: py, hx: w / 2, hy: d / 2, yaw: 0 });
    }
    // Trees along the lanes.
    const treeCount = Math.floor(edge.length / 45);
    for (let k = 0; k < treeCount; k++) {
      const s = (k + 0.5) * (edge.length / treeCount);
      const p = net.pointAt(edge, s);
      const side = rng() < 0.5 ? 1 : -1;
      const px = p.x + -p.dy * side * (edge.width / 2 + 4);
      const py = p.y + p.dx * side * (edge.width / 2 + 4);
      scatter.add(rng() < 0.45 ? 'palm' : 'tree', {
        x: px,
        y: 0,
        z: py,
        sx: 1.8 + rng(),
        sy: 2.4 + rng() * 2,
        sz: 1.8 + rng(),
        ry: rng() * Math.PI,
        color: palette.foliage,
      });
      map.addCollider({ type: 'circle', x: px, y: py, radius: 0.5 });
    }
  }

  // Market cluster.
  const marketNode = net.nodes[layout.mainNodes[Math.floor(layout.mainNodes.length / 2)]];
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    const px = marketNode.x + Math.cos(a) * 22 + (rng() - 0.5) * 8;
    const py = marketNode.y + Math.sin(a) * 22 + (rng() - 0.5) * 8;
    scatter.add('shop', {
      x: px,
      y: 0,
      z: py,
      sx: 6 + rng() * 4,
      sy: 3.4,
      sz: 5 + rng() * 3,
      ry: a + Math.PI / 2,
      color: palette.building[Math.floor(rng() * palette.building.length)],
    });
    scatter.add('shopAwning', {
      x: px,
      y: 3.2,
      z: py,
      sx: 6.4,
      sy: 0.18,
      sz: 1.6,
      ry: a + Math.PI / 2,
      color: palette.accent,
    });
    map.addCollider({ type: 'circle', x: px, y: py, radius: 3.4 });
  }
}

function dressHighway(map, layout, scatter, rng, palette, def) {
  const net = layout.net;

  // Distant hills.
  for (let k = 0; k < 26; k++) {
    const angle = rng() * Math.PI * 2;
    const dist = def.size * (0.42 + rng() * 0.3);
    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;
    scatter.add('mountain', {
      x: px,
      y: 0,
      z: py,
      sx: 40 + rng() * 90,
      sy: 25 + rng() * 70,
      sz: 40 + rng() * 90,
      color: def.id === 'night_highway' ? 0x1b2430 : 0x6d7a52,
    });
  }

  // Roadside trees + bushes.
  for (const edge of net.edges) {
    if (edge.type === 'service') continue;
    const count = Math.floor(edge.length / 60);
    for (let k = 0; k < count; k++) {
      const s = (k + 0.5) * (edge.length / count);
      const p = net.pointAt(edge, s);
      const side = k % 2 === 0 ? 1 : -1;
      const dist = edge.width / 2 + 12 + rng() * 30;
      const px = p.x + -p.dy * side * dist;
      const py = p.y + p.dx * side * dist;
      scatter.add(rng() < 0.25 ? 'palm' : 'tree', {
        x: px,
        y: 0,
        z: py,
        sx: 1.7 + rng() * 0.9,
        sy: 2.6 + rng() * 2.2,
        sz: 1.7 + rng() * 0.9,
        ry: rng() * Math.PI,
        color: palette.foliage,
      });
      map.addCollider({ type: 'circle', x: px, y: py, radius: 0.6 });
    }
  }

  // Dhaba / roadside shops.
  const shopCount = 8;
  for (let k = 0; k < shopCount; k++) {
    const edge = net.edges.find((e) => e.type === 'highway') || net.edges[0];
    const s = (k + 0.5) * (edge.length / shopCount);
    const p = net.pointAt(edge, s);
    const side = k % 2 === 0 ? 1 : -1;
    const dist = edge.width / 2 + 22;
    const px = p.x + -p.dy * side * dist;
    const py = p.y + p.dx * side * dist;
    scatter.add('shop', {
      x: px,
      y: 0,
      z: py,
      sx: 10 + rng() * 6,
      sy: 4.5,
      sz: 8,
      ry: Math.atan2(p.dx, p.dy),
      color: palette.building[Math.floor(rng() * palette.building.length)],
    });
    map.addCollider({ type: 'circle', x: px, y: py, radius: 5 });
  }

  // Toll plaza in the middle of the highway.
  const mainEdge = net.edges.find((e) => e.type === 'highway');
  if (mainEdge && def.features.toll) {
    const p = net.pointAt(mainEdge, mainEdge.length * 0.5);
    const ry = Math.atan2(p.dy, p.dx);
    scatter.add('tollBooth', { x: p.x + -p.dy * 12, y: 0, z: p.y + p.dx * 12, ry });
    scatter.add('canopy', { x: p.x, y: 0, z: p.y, ry: ry + Math.PI / 2 });
    for (let k = -1; k <= 1; k++) {
      scatter.add('barrier', {
        x: p.x + -p.dy * (k * 4),
        y: 0,
        z: p.y + p.dx * (k * 4),
        ry: ry + Math.PI / 2,
        color: k === 0 ? 0xe0e0e0 : 0xd05a3a,
      });
    }
    map.addCollider({ type: 'box', x: p.x + -p.dy * 12, y: p.y + p.dx * 12, hx: 1.6, hy: 1.6, yaw: 0 });
    map.tollPlaza = { x: p.x, y: p.y };
  }

  // Lamps near the start and at the toll plaza.
  const lampEdge = net.edges.find((e) => e.type === 'highway') || net.edges[0];
  for (let k = 0; k < 16; k++) {
    const s = (k / 15) * lampEdge.length;
    const p = net.pointAt(lampEdge, s);
    const side = k % 2 === 0 ? 1 : -1;
    const px = p.x + -p.dy * side * (lampEdge.width / 2 + 1.4);
    const py = p.y + p.dx * side * (lampEdge.width / 2 + 1.4);
    scatter.add('lamp', { x: px, y: 0, z: py, ry: Math.atan2(-p.dx, -p.dy) });
    scatter.add('lampHead', { x: px, y: 0, z: py, ry: Math.atan2(-p.dx, -p.dy) });
  }

  // Fuel station along the highway.
  const fuelEdge = net.edges.find((e) => e.type === 'service') || mainEdge;
  const fp = net.pointAt(fuelEdge, fuelEdge.length * 0.25);
  const fpx = fp.x + -fp.dy * 16;
  const fpy = fp.y + fp.dx * 16;
  scatter.add('pump', { x: fpx, y: 0, z: fpy, ry: Math.atan2(fp.dx, fp.dy) });
  scatter.add('canopy', { x: fpx, y: 0, z: fpy, ry: Math.atan2(fp.dx, fp.dy) });
  map.fuelStations.push({ x: fpx, y: fpy, radius: 24, name: 'Highway Fuel Point' });
  map.addCollider({ type: 'circle', x: fpx, y: fpy, radius: 3 });
}

function dressMountain(map, layout, scatter, rng, palette, def) {
  const net = layout.net;

  // Rock faces along the mountain.
  for (const edge of net.edges) {
    const count = Math.floor(edge.length / 22);
    for (let k = 0; k < count; k++) {
      const s = (k + 0.5) * (edge.length / count);
      const p = net.pointAt(edge, s);
      const side = k % 2 === 0 ? 1 : -1;
      const dist = edge.width / 2 + 8 + rng() * 22;
      const px = p.x + -p.dy * side * dist;
      const py = p.y + p.dx * side * dist;
      const size = 4 + rng() * 12;
      scatter.add('rock', {
        x: px,
        y: p.z,
        z: py,
        sx: size,
        sy: size * (0.7 + rng() * 0.7),
        sz: size,
        ry: rng() * Math.PI,
        color: 0x6f6a63,
      });
      map.addCollider({ type: 'circle', x: px, y: py, radius: size * 0.8 });
      if (rng() < 0.4) {
        scatter.add('tree', {
          x: px + (rng() - 0.5) * 8,
          y: p.z,
          z: py + (rng() - 0.5) * 8,
          sx: 1.6,
          sy: 2.6 + rng() * 1.6,
          sz: 1.6,
          ry: rng() * Math.PI,
          color: palette.foliage,
        });
      }
    }
    // Guard rails.
    for (let k = 0; k < Math.floor(edge.length / 16); k++) {
      const s = (k + 0.5) * (edge.length / Math.max(1, Math.floor(edge.length / 16)));
      const p = net.pointAt(edge, s);
      const side = k % 2 === 0 ? 1 : -1;
      scatter.add('barrier', {
        x: p.x + -p.dy * side * (edge.width / 2 + 0.4),
        y: p.z,
        z: p.y + p.dx * side * (edge.width / 2 + 0.4),
        ry: Math.atan2(p.dx, p.dy),
        color: 0xd8d4c8,
      });
    }
  }

  // Distant peaks.
  for (let k = 0; k < 30; k++) {
    const angle = rng() * Math.PI * 2;
    const dist = def.size * (0.4 + rng() * 0.4);
    scatter.add('mountain', {
      x: Math.cos(angle) * dist,
      y: 0,
      z: Math.sin(angle) * dist,
      sx: 90 + rng() * 160,
      sy: 90 + rng() * 190,
      sz: 90 + rng() * 160,
      color: 0x5d6570,
    });
  }

  // Hill station village at the top of the route.
  const topNode = net.nodes[layout.nodes[layout.nodes.length - 1]];
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const px = topNode.x + Math.cos(a) * 26;
    const py = topNode.y + Math.sin(a) * 26;
    scatter.add('building', {
      x: px,
      y: topNode.z,
      z: py,
      sx: 7 + rng() * 5,
      sy: 5 + rng() * 5,
      sz: 6 + rng() * 4,
      ry: a,
      color: palette.building[Math.floor(rng() * palette.building.length)],
    });
    scatter.add('buildingRoof', {
      x: px,
      y: topNode.z + 6,
      z: py,
      sx: 8.5,
      sy: 0.6,
      sz: 7,
      ry: a,
      color: palette.roof[Math.floor(rng() * palette.roof.length)],
    });
    map.addCollider({ type: 'circle', x: px, y: py, radius: 4 });
  }
}

function dressDesert(map, layout, scatter, rng, palette, def) {
  const net = layout.net;

  // Dunes.
  for (let k = 0; k < 90; k++) {
    const angle = rng() * Math.PI * 2;
    const dist = 40 + rng() * def.size * 0.55;
    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;
    const size = 18 + rng() * 45;
    scatter.add('mountain', {
      x: px,
      y: -size * 0.25,
      z: py,
      sx: size,
      sy: size * (0.35 + rng() * 0.25),
      sz: size * (0.7 + rng() * 0.5),
      ry: rng() * Math.PI,
      color: palette.ground,
    });
  }

  // Sparse bushes and a lone petrol station.
  for (const edge of net.edges) {
    const count = Math.floor(edge.length / 120);
    for (let k = 0; k < count; k++) {
      const s = (k + 0.5) * (edge.length / count);
      const p = net.pointAt(edge, s);
      const side = k % 2 === 0 ? 1 : -1;
      scatter.add('bush', {
        x: p.x + -p.dy * side * (edge.width / 2 + 10 + rng() * 30),
        y: 0,
        z: p.y + p.dx * side * (edge.width / 2 + 10 + rng() * 30),
        sx: 1.6 + rng(),
        sy: 1.1 + rng() * 0.6,
        sz: 1.6 + rng(),
        color: 0x8a8f4e,
      });
    }
  }

  const mainEdge = net.edges.find((e) => e.type === 'highway') || net.edges[0];
  const fp = net.pointAt(mainEdge, mainEdge.length * 0.35);
  const fpx = fp.x + -fp.dy * 18;
  const fpy = fp.y + fp.dx * 18;
  scatter.add('pump', { x: fpx, y: 0, z: fpy, ry: Math.atan2(fp.dx, fp.dy) });
  scatter.add('canopy', { x: fpx, y: 0, z: fpy, ry: Math.atan2(fp.dx, fp.dy) });
  scatter.add('shop', {
    x: fpx + 14,
    y: 0,
    z: fpy,
    sx: 9,
    sy: 4,
    sz: 7,
    ry: Math.atan2(fp.dx, fp.dy),
    color: palette.building[0],
  });
  map.fuelStations.push({ x: fpx, y: fpy, radius: 24, name: 'Desert Fuel Stop' });
  map.addCollider({ type: 'circle', x: fpx, y: fpy, radius: 3 });
}

/* -------------------------------------------------------------- furniture */

function buildSpawnPoints(map, rng, def) {
  const net = map.network;
  const lanes = def.layout === 'city' ? 2 : 1;
  const count = Math.min(40, Math.floor(net.edges.length * 0.8));
  for (let k = 0; k < count; k++) {
    const edge = net.randomEdge(rng);
    if (!edge || edge.length < 40) continue;
    const s = rng() * edge.length;
    const lane = Math.floor(rng() * lanes);
    const p = net.pointAt(edge, s, lane);
    map.spawnPoints.push({
      x: p.x,
      y: p.y,
      z: p.z,
      heading: p.heading,
      edge: edge.index,
      s,
      lane,
    });
  }
}

function buildSignals(map, rng, def) {
  if (def.layout !== 'city') return;
  const net = map.network;
  const candidates = net.nodes
    .map((n, i) => ({ node: n, i, degree: net.nodeDegree(i) }))
    .filter((c) => c.degree >= 3);
  // Keep the number of signals modest for performance.
  const count = Math.min(12, candidates.length);
  for (let k = 0; k < count; k++) {
    const c = candidates[Math.floor((k / count) * candidates.length)];
    const signal = new TrafficSignal({ x: c.node.x + 9, y: 0, z: c.node.y + 9 }, 0);
    signal.node = c.i;
    map.signals.push(signal);
  }
}

function buildStops(map, rng, def, layout) {
  const net = map.network;
  const count = def.stopCount || 6;
  const edges = net.edges.filter((e) => e.type !== 'service' && e.length > 50);
  for (let k = 0; k < count && edges.length; k++) {
    const edge = edges[Math.floor((k / count) * edges.length)];
    const s = edge.length * (0.25 + rng() * 0.5);
    const side = k % 2 === 0 ? 1 : -1;
    const p = net.pointAt(edge, s);
    const off = edge.width / 2 + 3.4;
    const sx = p.x + -p.dy * side * off;
    const sy = p.y + p.dx * side * off;
    const stop = {
      id: `stop_${map.id}_${k}`,
      name: STOP_NAMES[k % STOP_NAMES.length],
      x: sx,
      y: sy,
      z: p.z,
      rotationY: Math.atan2(p.dx, p.dy) + (side > 0 ? 0 : Math.PI),
      edge: edge.index,
      s,
      side,
      waiting: 2 + Math.floor(rng() * 5),
      boarded: 0,
      capacity: 30,
    };
    map.stops.push(stop);
    map.props.add('shelter', {
      x: sx,
      y: p.z,
      z: sy,
      ry: stop.rotationY,
      sx: 1,
      sy: 1,
      sz: 1,
      color: 0x9a9a95,
    });
    // Waiting passengers.
    for (let w = 0; w < Math.min(4, stop.waiting); w++) {
      map.props.add('pedestrian', {
        x: sx + (rng() - 0.5) * 2.5,
        y: p.z,
        z: sy + (rng() - 0.5) * 2.5,
        ry: rng() * Math.PI,
        sx: 0.95,
        sy: 0.95,
        sz: 0.95,
        color: [0x3f6fa8, 0xa8443c, 0x4f7a4a, 0x8a6b3f, 0x6a4f8a][w % 5],
      });
    }
  }
}

function buildParkingBays(map, rng, def, layout) {
  const net = map.network;
  const edge = net.edges.find((e) => e.length > 40) || net.edges[0];
  const p = net.pointAt(edge, Math.min(30, edge.length * 0.25));
  const side = 1;
  const off = edge.width / 2 + 5.5;
  map.parkingBays.push({
    x: p.x + -p.dy * side * off,
    y: p.y + p.dx * side * off,
    z: p.z,
    yaw: Math.atan2(p.dx, p.dy),
    width: 4.5,
    length: 12,
  });
}

export { STOP_NAMES };
