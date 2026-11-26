// Dedicated 3D world for Tridi Rovers (/rovers):
// Real CAD STL meshes from both Luigi V1 (luigi_lab3, 6 STLs, fixed HC-SR04 + APDS-9960 boom)
// and Luigi V2 (luigi_lab4, 7 STLs, rotating SG90 servo neck ±90°) navigating an 11x9 labyrinth
// with live dynamic obstacle placement, ultrasonic raycasting, and smooth C1 avoidance rerouting.
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createResourceTracker, createTextureSet } from '../world-textures.js';

import v1ChasisStlUrl from '../../../../physics/models/luigi_lab3/assets/1_chasis_robot.stl?url';
import chasisStlUrl from '../../../../physics/models/luigi_lab4/assets/1_chasis_robot.stl?url';
import soporteStlUrl from '../../../../physics/models/luigi_lab4/assets/2_soporte_motor_x2.stl?url';
import patinStlUrl from '../../../../physics/models/luigi_lab4/assets/3_patin_delantero.stl?url';
import bandejaStlUrl from '../../../../physics/models/luigi_lab4/assets/4_bandeja_protoboard.stl?url';
import rinStlUrl from '../../../../physics/models/luigi_lab4/assets/5_rin_x2.stl?url';
import llantaStlUrl from '../../../../physics/models/luigi_lab4/assets/6_llanta_x2_TPU.stl?url';
import cabezaStlUrl from '../../../../physics/models/luigi_lab4/assets/7_cabeza_sensor_servo.stl?url';

const STL_MANIFEST = [
  ['v1Chasis', v1ChasisStlUrl],
  ['chasis', chasisStlUrl],
  ['soporte', soporteStlUrl],
  ['patin', patinStlUrl],
  ['bandeja', bandejaStlUrl],
  ['rin', rinStlUrl],
  ['llanta', llantaStlUrl],
  ['cabeza', cabezaStlUrl],
];

const stlCache = new Map();

function loadStlGeometry(loader, key, url) {
  if (!stlCache.has(key)) {
    stlCache.set(
      key,
      loader
        .loadAsync(url)
        .then((geo) => {
          geo.computeVertexNormals();
          return geo;
        })
        .catch((err) => {
          stlCache.delete(key);
          throw err;
        }),
    );
  }
  return stlCache.get(key);
}

const SIGNAL_HEX = 0xc8ff2e;
const FOG_COLOR = 0x151c29; // harmonized with landing/world.js
const WHEEL_RADIUS = 0.065;
const WHEEL_TRACK = 0.264;
const PELVIS_HEIGHT = 0.0875;
const MAX_SCAN_DIST = 1.65;
const MAX_OBSTACLES = 3;
const OBS_HALF_EXTENT = 0.115; // 23 cm calibration crate in 109 cm clear corridor
const AVOID_HALF_SPAN_M = 0.78; // C1 raised-cosine dodge span (~1.56 m total bypass)
const AVOID_LATERAL_M = 0.305; // keeps >= 7.5 cm clearance from walls (0.545 - 0.16 = 0.385 m) and crate
const MIN_OBS_GAP_U = 0.065; // > 2 * AVOID_HALF_SPAN_M / pathLengthM (~0.0491) so opposite-side dodges never cancel

// ---- Real 11 x 9 Grid Architectural Maze ----
const CELL = 1.05;
const WALL_H = 0.72;
const MAZE_GRID = [
  '###########',
  '#...#.....#',
  '#.#.#.###.#',
  '#.#...#...#',
  '#.#####.#.#',
  '#.....#.#.#',
  '###.#.#.#.#',
  '#...#.....#',
  '###########',
];
const GRID_ROWS = MAZE_GRID.length;
const GRID_COLS = MAZE_GRID[0].length;
const cellToWorld = (col, row) =>
  new THREE.Vector3((col - (GRID_COLS - 1) * 0.5) * CELL, 0, (row - (GRID_ROWS - 1) * 0.5) * CELL);

const SOLVED_CELLS = [
  [1, 7],
  [2, 7],
  [3, 7],
  [3, 6],
  [3, 5],
  [2, 5],
  [1, 5],
  [1, 4],
  [1, 3],
  [1, 2],
  [1, 1],
  [2, 1],
  [3, 1],
  [3, 2],
  [3, 3],
  [4, 3],
  [5, 3],
  [5, 2],
  [5, 1],
  [6, 1],
  [7, 1],
  [8, 1],
  [9, 1],
  [9, 2],
  [9, 3],
  [8, 3],
  [7, 3],
  [7, 4],
  [7, 5],
  [7, 6],
  [7, 7],
  [8, 7],
  [9, 7],
];

function buildRoundedPath(cells) {
  const pts = [];
  for (let i = 0; i < cells.length; i++) {
    const curr = cellToWorld(cells[i][0], cells[i][1]);
    if (i > 0 && i < cells.length - 1) {
      const prev = cellToWorld(cells[i - 1][0], cells[i - 1][1]);
      const next = cellToWorld(cells[i + 1][0], cells[i + 1][1]);
      const d1x = curr.x - prev.x;
      const d1z = curr.z - prev.z;
      const d2x = next.x - curr.x;
      const d2z = next.z - curr.z;
      if (Math.abs(d1x * d2z - d1z * d2x) > 0.01) {
        pts.push(prev.clone().lerp(curr, 0.72));
        pts.push(curr.clone().lerp(next, 0.28));
        continue;
      }
    }
    pts.push(curr);
  }
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.35);
}

function normalizeForMerge(rawGeo) {
  const g = rawGeo.index ? rawGeo.toNonIndexed() : rawGeo.clone();
  for (const name of Object.keys(g.attributes)) {
    if (name !== 'position' && name !== 'normal' && name !== 'uv') {
      g.deleteAttribute(name);
    }
  }
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) {
    const count = g.attributes.position.count;
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
  }
  return g;
}

function mergeList(geos, tracker) {
  if (!geos.length) return null;
  const norm = geos.map((g) => normalizeForMerge(g));
  for (const g of geos) g.dispose();
  const merged = mergeGeometries(norm, false);
  for (const g of norm) g.dispose();
  return merged ? tracker.trackGeo(merged) : null;
}

function buildPmremEnvironment(renderer, isSmallScreen) {
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x182234);

  const panels = [
    { pos: [0, 14, 0], rot: [Math.PI / 2, 0, 0], color: 0x7c96bd, w: 30, h: 30 },
    { pos: [0, 4, -20], rot: [0, 0, 0], color: 0x5c769e, w: 32, h: 8 },
    { pos: [0, 4, 20], rot: [0, Math.PI, 0], color: 0x455c80, w: 32, h: 8 },
    { pos: [-20, 4, 0], rot: [0, Math.PI / 2, 0], color: 0x58729a, w: 28, h: 8 },
    { pos: [20, 4, 0], rot: [0, -Math.PI / 2, 0], color: 0x4c658a, w: 28, h: 8 },
  ];
  const created = panels.map((p) => {
    const g = new THREE.PlaneGeometry(p.w, p.h);
    const m = new THREE.MeshBasicMaterial({ color: p.color });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(...p.pos);
    mesh.rotation.set(...p.rot);
    envScene.add(mesh);
    return { g, m };
  });

  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(envScene, 0.025, 0.1, 100, { size: isSmallScreen ? 128 : 256 });
  pmrem.dispose();
  for (const item of created) {
    item.g.dispose();
    item.m.dispose();
  }
  return target;
}

function raycastMazeXZ(ox, oz, dx, dz, boxes, obstacles, maxDist = MAX_SCAN_DIST) {
  let best = maxDist;
  const invDx = Math.abs(dx) > 1e-6 ? 1 / dx : Infinity;
  const invDz = Math.abs(dz) > 1e-6 ? 1 / dz : Infinity;
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    const t1 = (b.minX - ox) * invDx;
    const t2 = (b.maxX - ox) * invDx;
    const t3 = (b.minZ - oz) * invDz;
    const t4 = (b.maxZ - oz) * invDz;
    const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
    const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));
    if (tmax >= 0 && tmin <= tmax && tmin >= 0 && tmin < best) {
      best = tmin;
    }
  }
  // Exact OBB slab raycast against active dynamic obstacles
  for (let i = 0; i < obstacles.length; i++) {
    const ob = obstacles[i];
    const rx = ox - ob.x;
    const rz = oz - ob.z;
    const lox = rx * ob.cosH - rz * ob.sinH;
    const loz = rx * ob.sinH + rz * ob.cosH;
    const ldx = dx * ob.cosH - dz * ob.sinH;
    const ldz = dx * ob.sinH + dz * ob.cosH;
    const ilx = Math.abs(ldx) > 1e-6 ? 1 / ldx : Infinity;
    const ilz = Math.abs(ldz) > 1e-6 ? 1 / ldz : Infinity;
    const h = OBS_HALF_EXTENT + 0.015;
    const t1 = (-h - lox) * ilx;
    const t2 = (h - lox) * ilx;
    const t3 = (-h - loz) * ilz;
    const t4 = (h - loz) * ilz;
    const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
    const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));
    if (tmax >= 0 && tmin <= tmax && tmin >= 0 && tmin < best) {
      best = tmin;
    }
  }
  return best;
}

/**
 * Exact same fwidth-antialiased holographic perimeter reticle shader used in Humanoids (home.js makeMarks):
 * razor-sharp calibration ring, segmented inner/outer arcs, 15 deg minor & 90 deg cardinal degree ticks, soft aura.
 */
function createLandingReticle(radiusM, tracker, initialOpacity = 0.78) {
  const r = radiusM;
  const mat = tracker.trackMat(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      uniforms: {
        uOpacity: { value: initialOpacity },
        uSignal: { value: new THREE.Color(SIGNAL_HEX) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vLocal;
        void main() {
          vLocal = position.xy;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        uniform vec3 uSignal;
        varying vec2 vLocal;

        float ringAt(float d, float rad, float fw) {
          return 1.0 - clamp(abs(d - rad) / (fw * 1.35), 0.0, 1.0);
        }

        void main() {
          float d = length(vLocal);
          if (d > ${(r * 1.24).toFixed(3)} || d < ${(r * 0.65).toFixed(3)}) discard;
          float ang = atan(vLocal.y, vLocal.x);
          float fw = max(fwidth(d), 0.0018);

          float mainRing = ringAt(d, ${r.toFixed(3)}, fw);
          float innerArc = ringAt(d, ${(r * 0.916).toFixed(3)}, fw) * smoothstep(-0.22, 0.16, cos(ang * 4.0)) * 0.50;
          float outerArc = ringAt(d, ${(r * 1.10).toFixed(3)}, fw) * smoothstep(0.35, 0.65, cos(ang * 6.0)) * 0.30;

          float t15Sin = sin(ang * 12.0) * d / 12.0;
          float t15 = (1.0 - clamp(abs(t15Sin) / max(fwidth(t15Sin) * 1.25, 0.0014), 0.0, 1.0))
            * step(${(r * 1.02).toFixed(3)}, d) * step(d, ${(r * 1.07).toFixed(3)});
          float t90Sin = sin(ang * 2.0) * d / 2.0;
          float t90 = (1.0 - clamp(abs(t90Sin) / max(fwidth(t90Sin) * 1.25, 0.0014), 0.0, 1.0))
            * step(${(r * 0.95).toFixed(3)}, d) * step(d, ${(r * 1.15).toFixed(3)});

          float aura = exp(-pow((d - ${r.toFixed(3)}) / ${(r * 0.038).toFixed(4)}, 2.0)) * 0.20;

          float mask = clamp(mainRing * 0.92 + innerArc + outerArc + t15 * 0.52 + t90 * 0.88 + aura, 0.0, 1.0);
          float alpha = mask * uOpacity;
          if (alpha < 0.004) discard;
          gl_FragColor = vec4(uSignal, alpha);
          #include <colorspace_fragment>
        }`,
    }),
  );
  const planeSize = r * 2.52;
  const geo = tracker.trackGeo(new THREE.PlaneGeometry(planeSize, planeSize));
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.009;
  mesh.renderOrder = 3;
  return { mesh, mat };
}

function buildLuigiRover(stls, tracker) {
  const root = new THREE.Group();
  root.name = 'luigi-v1-v2-rover';

  const mujocoFrame = new THREE.Group();
  mujocoFrame.position.y = PELVIS_HEIGHT;
  mujocoFrame.rotation.x = -Math.PI / 2;
  root.add(mujocoFrame);

  const cadOrigin = new THREE.Group();
  cadOrigin.position.set(-0.15, 0, 0);
  mujocoFrame.add(cadOrigin);

  // V2 (luigi_lab4) orange PLA materials
  const matOrangePla = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0xf7781c, roughness: 0.38, metalness: 0.08, envMapIntensity: 1.15 }),
  );
  const matOrangeDark = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0xde6516, roughness: 0.44, metalness: 0.08 }),
  );
  // V1 (luigi_lab3) matte black PLA materials (exact rgba="0.13 0.14 0.16" from luigi.xml)
  const matBlackPla = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.58, metalness: 0.08, envMapIntensity: 1.1 }),
  );
  const matBlackDark = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0x2c3037, roughness: 0.62, metalness: 0.08 }),
  );

  const matMotorYellow = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0xf5cf1d, roughness: 0.36, metalness: 0.1 }),
  );
  const matRimYellow = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0xfce014, roughness: 0.32, metalness: 0.14, envMapIntensity: 1.25 }),
  );
  const matTireTpu = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0x1e2126, roughness: 0.85, metalness: 0.05 }),
  );
  const matMetal = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0xd0d6de, roughness: 0.22, metalness: 0.88, envMapIntensity: 1.35 }),
  );
  const matDarkPlastic = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0x1c1f26, roughness: 0.58, metalness: 0.18 }),
  );
  const matBatteryGreen = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0x5cc458, roughness: 0.35, metalness: 0.12 }),
  );
  const matArduinoBlue = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0x0d72ba, roughness: 0.34, metalness: 0.22 }),
  );
  const matL298Red = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0xd62424, roughness: 0.36, metalness: 0.18 }),
  );
  const matProtoWhite = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0xf0f0eb, roughness: 0.5, metalness: 0.04 }),
  );
  const matServoBlue = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0x1e66db, roughness: 0.32, metalness: 0.15 }),
  );
  const matSensorMesh = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0x2e3338, roughness: 0.45, metalness: 0.7 }),
  );
  const matWoodBoom = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0xd1ad7a, roughness: 0.72, metalness: 0.04 }),
  );
  const matApdsPurple = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0x7a249e, roughness: 0.36, metalness: 0.22 }),
  );

  const STL_SCALE = 0.002;
  const addStl = (parent, geo, mat, pos = [0, 0, 0], quat = null) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.setScalar(STL_SCALE);
    mesh.position.set(...pos);
    if (quat) mesh.quaternion.set(quat[1], quat[2], quat[3], quat[0]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const addBox = (parent, sizeHalf, mat, pos, quat = null) => {
    const geo = tracker.trackGeo(new THREE.BoxGeometry(sizeHalf[0] * 2, sizeHalf[1] * 2, sizeHalf[2] * 2));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    if (quat) mesh.quaternion.set(quat[1], quat[2], quat[3], quat[0]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const addCyl = (parent, radius, halfLen, mat, pos, quat = null) => {
    const geo = tracker.trackGeo(new THREE.CylinderGeometry(radius, radius, halfLen * 2, 16));
    geo.rotateX(Math.PI / 2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    if (quat) mesh.quaternion.set(quat[1], quat[2], quat[3], quat[0]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const upAxis = new THREE.Vector3(0, 1, 0);
  const addWire = (parent, from, to, colorHex, radius = 0.0024) => {
    const pA = new THREE.Vector3(...from);
    const pB = new THREE.Vector3(...to);
    const dir = pB.clone().sub(pA);
    const len = dir.length();
    if (len < 1e-4) return null;
    const geo = tracker.trackGeo(new THREE.CylinderGeometry(radius, radius, len, 8));
    const mat = tracker.trackMat(new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.45, metalness: 0.08 }));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pA).addScaledVector(dir, 0.5);
    mesh.quaternion.setFromUnitVectors(upAxis, dir.normalize());
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // ---- Shared electronics & differential drivetrain (identical in V1 & V2) ----
  addBox(cadOrigin, [0.052, 0.0188, 0.0225], matMotorYellow, [0.115, 0.0812, -0.0225]);
  addBox(cadOrigin, [0.052, 0.0188, 0.0225], matMotorYellow, [0.115, -0.0812, -0.0225]);
  addCyl(cadOrigin, 0.017, 0.018, matMetal, [0.18, 0.0812, -0.0225], [0.7071068, 0, 0.7071068, 0]);
  addCyl(cadOrigin, 0.017, 0.018, matMetal, [0.18, -0.0812, -0.0225], [0.7071068, 0, 0.7071068, 0]);

  addBox(cadOrigin, [0.077, 0.042, 0.008], matDarkPlastic, [0.147, 0, -0.018]);
  addCyl(cadOrigin, 0.018, 0.068, matBatteryGreen, [0.147, 0.02, -0.028], [0.7071068, 0, 0.7071068, 0]);
  addCyl(cadOrigin, 0.018, 0.068, matBatteryGreen, [0.147, -0.02, -0.028], [0.7071068, 0, 0.7071068, 0]);

  addBox(cadOrigin, [0.0533, 0.0686, 0.0032], matArduinoBlue, [0.2173, 0, 0.0206]);
  addBox(cadOrigin, [0.012, 0.016, 0.011], matMetal, [0.24, 0.0486, 0.034]);
  addBox(cadOrigin, [0.014, 0.011, 0.01], matDarkPlastic, [0.182, 0.052, 0.033]);
  addBox(cadOrigin, [0.042, 0.003, 0.005], matDarkPlastic, [0.217, 0.062, 0.028]);
  addBox(cadOrigin, [0.042, 0.003, 0.005], matDarkPlastic, [0.217, -0.062, 0.028]);

  const ledMat = tracker.trackMat(new THREE.MeshBasicMaterial({ color: SIGNAL_HEX, toneMapped: false }));
  const statusLed = new THREE.Mesh(tracker.trackGeo(new THREE.BoxGeometry(0.008, 0.008, 0.004)), ledMat);
  statusLed.position.set(0.225, -0.025, 0.026);
  cadOrigin.add(statusLed);

  addBox(cadOrigin, [0.043, 0.043, 0.0032], matL298Red, [0.103, 0, 0.0186]);
  addBox(cadOrigin, [0.02, 0.029, 0.025], matDarkPlastic, [0.137, 0, 0.045]);
  addBox(cadOrigin, [0.055, 0.083, 0.0095], matProtoWhite, [0.057, 0, 0.0815]);

  const leftWheel = new THREE.Group();
  leftWheel.position.set(0.08, 0.132, -0.0225);
  addStl(leftWheel, stls.rin, matRimYellow, [0, 0.026, 0], [0.7071068, 0.7071068, 0, 0]);
  addStl(leftWheel, stls.llanta, matTireTpu, [0, 0.026, 0], [0.7071068, 0.7071068, 0, 0]);
  cadOrigin.add(leftWheel);

  const rightWheel = new THREE.Group();
  rightWheel.position.set(0.08, -0.132, -0.0225);
  addStl(rightWheel, stls.rin, matRimYellow, [0, -0.026, 0], [0.7071068, -0.7071068, 0, 0]);
  addStl(rightWheel, stls.llanta, matTireTpu, [0, -0.026, 0], [0.7071068, -0.7071068, 0, 0]);
  cadOrigin.add(rightWheel);

  // Shared ultrasonic cone shader material
  const fanGeo = tracker.trackGeo(new THREE.PlaneGeometry(1, 0.62, 1, 1));
  fanGeo.translate(0.5, 0, 0);
  const fanMat = tracker.trackMat(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
      uniforms: {
        uPing: { value: 0 },
        uCool: { value: new THREE.Color(0x9ec4f0) },
        uSignal: { value: new THREE.Color(SIGNAL_HEX) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uPing;
        uniform vec3 uCool;
        uniform vec3 uSignal;
        varying vec2 vUv;
        void main() {
          float dist = vUv.x;
          float lat = abs(vUv.y - 0.5) * 2.0;
          float halfW = mix(0.08, 0.96, dist);
          float fw = max(fwidth(lat), 0.012);
          float inCone = 1.0 - smoothstep(halfW - fw * 1.5, halfW, lat);
          float edge = (1.0 - clamp(abs(lat - halfW) / (fw * 1.8), 0.0, 1.0)) * step(0.02, dist);
          float fade = pow(1.0 - dist, 1.5) * smoothstep(0.0, 0.06, dist);
          vec3 col = mix(uCool, uSignal, 0.25 + uPing * 0.65);
          float alpha = (inCone * 0.07 + edge * 0.28) * fade * (1.0 + uPing * 0.9);
          if (alpha < 0.003) discard;
          gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.45));
          #include <colorspace_fragment>
        }`,
    }),
  );

  // ---- V2 Group (luigi_lab4: extended 180 mm orange chassis + rotating SG90 neck) ----
  const v2Group = new THREE.Group();
  v2Group.name = 'luigi-v2-lab4';
  cadOrigin.add(v2Group);

  addStl(v2Group, stls.chasis, matOrangePla);
  addStl(v2Group, stls.soporte, matOrangeDark, [0, 0, 0], [0.7071068, 0.7071068, 0, 0]);
  addStl(v2Group, stls.soporte, matOrangeDark, [0, 0, 0], [0.7071068, -0.7071068, 0, 0]);
  addStl(v2Group, stls.patin, matOrangeDark, [0.552, 0, 0], [0, 0, 1, 0]);
  addStl(v2Group, stls.bandeja, matOrangePla, [0, 0, 0.067]);

  addBox(v2Group, [0.0126, 0.0232, 0.022], matServoBlue, [0.33, -0.0108, 0.004]);
  addBox(v2Group, [0.0126, 0.0325, 0.0025], matServoBlue, [0.33, -0.0108, 0.01]);
  addCyl(v2Group, 0.011, 0.006, matServoBlue, [0.33, 0, 0.02]);

  const headNeck = new THREE.Group();
  headNeck.position.set(0.33, 0, 0.025);
  addCyl(headNeck, 0.009, 0.002, matProtoWhite, [0, 0, -0.001]);
  addStl(headNeck, stls.cabeza, matOrangePla);
  addBox(headNeck, [0.003, 0.045, 0.02], matArduinoBlue, [0.008, 0, 0.026]);
  addCyl(headNeck, 0.016, 0.012, matMetal, [0.02, 0.026, 0.026], [0.7071068, 0, 0.7071068, 0]);
  addCyl(headNeck, 0.016, 0.012, matMetal, [0.02, -0.026, 0.026], [0.7071068, 0, 0.7071068, 0]);
  addCyl(headNeck, 0.013, 0.001, matSensorMesh, [0.0325, 0.026, 0.026], [0.7071068, 0, 0.7071068, 0]);
  addCyl(headNeck, 0.013, 0.001, matSensorMesh, [0.0325, -0.026, 0.026], [0.7071068, 0, 0.7071068, 0]);
  v2Group.add(headNeck);

  const radarFanV2 = new THREE.Mesh(fanGeo, fanMat);
  radarFanV2.position.set(0.036, 0, 0.026);
  radarFanV2.renderOrder = 4;
  headNeck.add(radarFanV2);

  // ---- V1 Group (luigi_lab3: matte black PLA, fixed front HC-SR04, APDS-9960 boom, Dupont wires, NO SG90 neck) ----
  const v1Group = new THREE.Group();
  v1Group.name = 'luigi-v1-lab3';
  v1Group.visible = false;
  cadOrigin.add(v1Group);

  addStl(v1Group, stls.v1Chasis, matBlackPla);
  addStl(v1Group, stls.soporte, matBlackDark, [0, 0, 0], [0.7071068, 0.7071068, 0, 0]);
  addStl(v1Group, stls.soporte, matBlackDark, [0, 0, 0], [0.7071068, -0.7071068, 0, 0]);
  addStl(v1Group, stls.patin, matBlackDark, [0.552, 0, 0], [0, 0, 1, 0]);
  addStl(v1Group, stls.bandeja, matBlackDark, [0, 0, 0.067]);

  // Protoboard switch & capacitor from luigi_lab3/luigi.xml
  addBox(v1Group, [0.016, 0.011, 0.009], matDarkPlastic, [0.035, -0.068, 0.096]);
  addCyl(v1Group, 0.005, 0.008, matArduinoBlue, [0.065, 0.012, 0.098]);

  // Fixed front HC-SR04 ultrasonic sensor (no SG90 servo, rigid on chassis)
  addBox(v1Group, [0.003, 0.045, 0.02], matArduinoBlue, [0.285, 0, 0.038]);
  addCyl(v1Group, 0.016, 0.012, matMetal, [0.299, 0.026, 0.038], [0.7071068, 0, 0.7071068, 0]);
  addCyl(v1Group, 0.016, 0.012, matMetal, [0.299, -0.026, 0.038], [0.7071068, 0, 0.7071068, 0]);
  addCyl(v1Group, 0.013, 0.001, matSensorMesh, [0.3115, 0.026, 0.038], [0.7071068, 0, 0.7071068, 0]);
  addCyl(v1Group, 0.013, 0.001, matSensorMesh, [0.3115, -0.026, 0.038], [0.7071068, 0, 0.7071068, 0]);

  // Top wood/tape boom + purple APDS-9960 optical sensor (exact luigi_lab3/luigi.xml lines 80-84)
  addBox(v1Group, [0.036, 0.008, 0.0025], matWoodBoom, [0.275, 0.005, 0.092], [0.991, 0, -0.131, 0]);
  addBox(v1Group, [0.018, 0.011, 0.008], matDarkPlastic, [0.292, 0.005, 0.095], [0.991, 0, -0.131, 0]);
  addBox(v1Group, [0.014, 0.018, 0.002], matApdsPurple, [0.312, 0.005, 0.102], [0.966, 0, -0.259, 0]);
  addBox(v1Group, [0.004, 0.004, 0.0015], matDarkPlastic, [0.316, 0.005, 0.104], [0.966, 0, -0.259, 0]);

  // Arched Dupont wiring harness (luigi_lab3/luigi.xml lines 88-107)
  addWire(v1Group, [0.295, 0.008, 0.094], [0.235, -0.045, 0.145], 0xf5d61f);
  addWire(v1Group, [0.235, -0.045, 0.145], [0.185, 0.045, 0.095], 0xf5d61f);
  addWire(v1Group, [0.185, 0.045, 0.095], [0.085, 0.015, 0.095], 0xf5d61f);
  addWire(v1Group, [0.295, 0.002, 0.092], [0.22, -0.055, 0.132], 0x2eb870);
  addWire(v1Group, [0.22, -0.055, 0.132], [0.205, -0.058, 0.032], 0x2eb870);
  addWire(v1Group, [0.282, 0.01, 0.056], [0.16, 0.038, 0.118], 0x266be0);
  addWire(v1Group, [0.16, 0.038, 0.118], [0.068, -0.025, 0.094], 0x266be0);
  addWire(v1Group, [0.282, -0.006, 0.056], [0.145, 0.022, 0.122], 0xf2731f);
  addWire(v1Group, [0.145, 0.022, 0.122], [0.048, 0.032, 0.094], 0xf2731f);
  addWire(v1Group, [0.245, 0.058, 0.032], [0.155, 0.068, 0.105], 0x8538c7);
  addWire(v1Group, [0.155, 0.068, 0.105], [0.075, -0.038, 0.094], 0x8538c7);
  addWire(v1Group, [0.23, 0.058, 0.032], [0.13, 0.042, 0.108], 0xebebe6);
  addWire(v1Group, [0.13, 0.042, 0.108], [0.052, 0.01, 0.094], 0xebebe6);
  addWire(v1Group, [0.095, 0.018, 0.025], [0.038, -0.048, 0.094], 0xe02424, 0.0026);

  // Fixed forward ultrasonic cone for V1 (never rotates)
  const radarFanV1 = new THREE.Mesh(fanGeo, fanMat);
  radarFanV1.position.set(0.314, 0, 0.038);
  radarFanV1.renderOrder = 4;
  v1Group.add(radarFanV1);

  // Exact same fwidth-antialiased calibration reticle as Humanoids (home.js) around Luigi
  const roverReticle = createLandingReticle(0.32, tracker, 0.76);
  roverReticle.mesh.position.set(0.02, 0.009, 0);
  root.add(roverReticle.mesh);

  return { root, v1Group, v2Group, leftWheel, rightWheel, headNeck, radarFanV1, radarFanV2, fanMat, roverReticle };
}

function buildMazeWorld(scene, curve, textures, tracker) {
  const world = new THREE.Group();
  world.name = 'topdown-labyrinth-world';
  scene.add(world);

  const wallBoxes = [];

  // 1. Cyber-twilight architectural plaza floor
  const floorGeo = tracker.trackGeo(new THREE.PlaneGeometry(72, 72));
  floorGeo.rotateX(-Math.PI / 2);
  textures.plaza.map.repeat.set(32, 32);
  textures.plaza.normalMap.repeat.set(32, 32);
  textures.plaza.roughnessMap.repeat.set(32, 32);
  const floorMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd0d9e8,
      map: textures.plaza.map,
      normalMap: textures.plaza.normalMap,
      normalScale: new THREE.Vector2(0.42, 0.42),
      roughnessMap: textures.plaza.roughnessMap,
      roughness: 0.88,
      metalness: 0.1,
      envMapIntensity: 0.92,
    }),
  );
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.receiveShadow = true;
  world.add(floor);

  // 2. Subtle architectural floor grid (clean neutral slate, pings with --signal only on triggerPing)
  const gridGeo = tracker.trackGeo(new THREE.PlaneGeometry(GRID_COLS * CELL + 6, GRID_ROWS * CELL + 6));
  gridGeo.rotateX(-Math.PI / 2);
  const gridMat = tracker.trackMat(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      uniforms: {
        uRoverPos: { value: new THREE.Vector2(0, 0) },
        uPingRadius: { value: -1 },
        uPingAlpha: { value: 0 },
        uSignal: { value: new THREE.Color(SIGNAL_HEX) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vWorldXZ;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldXZ = wp.xz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec2 uRoverPos;
        uniform float uPingRadius;
        uniform float uPingAlpha;
        uniform vec3 uSignal;
        varying vec2 vWorldXZ;

        float gridLine(vec2 coord, float stepSize) {
          vec2 p = coord / stepSize;
          vec2 g = abs(fract(p - 0.5) - 0.5) / max(fwidth(p), vec2(0.001));
          return 1.0 - min(min(g.x, g.y), 1.0);
        }

        void main() {
          float dRover = length(vWorldXZ - uRoverPos);
          float cell = gridLine(vWorldXZ + vec2(${(CELL * 0.5).toFixed(3)}), ${CELL.toFixed(3)});
          float pingRing = 0.0;
          if (uPingAlpha > 0.005) {
            pingRing = exp(-pow(abs(dRover - uPingRadius) / 0.11, 2.0)) * uPingAlpha * 0.75;
          }
          vec3 col = mix(vec3(0.55, 0.65, 0.8), uSignal, clamp(pingRing, 0.0, 1.0));
          float alpha = cell * 0.14 + pingRing * (0.22 + cell * 0.38);
          if (alpha < 0.004) discard;
          gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.7));
          #include <colorspace_fragment>
        }`,
    }),
  );
  const gridOverlay = new THREE.Mesh(gridGeo, gridMat);
  gridOverlay.position.y = 0.004;
  gridOverlay.renderOrder = 1;
  world.add(gridOverlay);

  // 3. Illuminated architectural labyrinth walls
  const wallBodyParts = [];
  const wallTopParts = [];
  const wallRimParts = [];

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (MAZE_GRID[r][c] !== '#') continue;
      const center = cellToWorld(c, r);
      const isOuter = r === 0 || r === GRID_ROWS - 1 || c === 0 || c === GRID_COLS - 1;
      const h = isOuter ? WALL_H + 0.14 : WALL_H;
      const blockW = CELL - 0.04;

      wallBoxes.push({
        minX: center.x - CELL * 0.5,
        maxX: center.x + CELL * 0.5,
        minZ: center.z - CELL * 0.5,
        maxZ: center.z + CELL * 0.5,
      });

      const body = new RoundedBoxGeometry(blockW, h, blockW, 1, 0.025);
      body.translate(center.x, h * 0.5, center.z);
      wallBodyParts.push(body);

      const cap = new THREE.BoxGeometry(blockW - 0.06, 0.035, blockW - 0.06);
      cap.translate(center.x, h + 0.017, center.z);
      wallTopParts.push(cap);

      const rimThick = 0.022;
      const rimY = h + 0.036;
      const rimN = new THREE.BoxGeometry(blockW - 0.08, 0.01, rimThick);
      rimN.translate(center.x, rimY, center.z - (blockW - 0.12) * 0.5);
      const rimS = new THREE.BoxGeometry(blockW - 0.08, 0.01, rimThick);
      rimS.translate(center.x, rimY, center.z + (blockW - 0.12) * 0.5);
      const rimW = new THREE.BoxGeometry(rimThick, 0.01, blockW - 0.08);
      rimW.translate(center.x - (blockW - 0.12) * 0.5, rimY, center.z);
      const rimE = new THREE.BoxGeometry(rimThick, 0.01, blockW - 0.08);
      rimE.translate(center.x + (blockW - 0.12) * 0.5, rimY, center.z);
      wallRimParts.push(rimN, rimS, rimW, rimE);
    }
  }

  const wallBodyGeo = mergeList(wallBodyParts, tracker);
  const wallBodyMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x5c6b82,
      map: textures.precast.map,
      normalMap: textures.precast.normalMap,
      normalScale: new THREE.Vector2(0.45, 0.45),
      roughness: 0.62,
      metalness: 0.18,
      envMapIntensity: 1.2,
    }),
  );
  const wallBodyMesh = new THREE.Mesh(wallBodyGeo, wallBodyMat);
  wallBodyMesh.name = 'maze-walls-body';
  wallBodyMesh.castShadow = true;
  wallBodyMesh.receiveShadow = true;
  world.add(wallBodyMesh);

  const wallTopGeo = mergeList(wallTopParts, tracker);
  const wallTopMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x3b475c,
      roughness: 0.42,
      metalness: 0.48,
      envMapIntensity: 1.35,
    }),
  );
  const wallTopMesh = new THREE.Mesh(wallTopGeo, wallTopMat);
  wallTopMesh.name = 'maze-walls-cap';
  wallTopMesh.receiveShadow = true;
  world.add(wallTopMesh);

  const wallRimGeo = mergeList(wallRimParts, tracker);
  const wallRimMat = tracker.trackMat(
    new THREE.MeshBasicMaterial({
      color: 0x8fb2de,
      transparent: true,
      opacity: 0.44,
      toneMapped: false,
    }),
  );
  const wallRimMesh = new THREE.Mesh(wallRimGeo, wallRimMat);
  wallRimMesh.name = 'maze-walls-rim';
  world.add(wallRimMesh);

  // 4. Ultra-clean architectural hairline trajectory
  const ribbonSamples = 260;
  const ribbonHalfW = 0.008;
  const ribbonPositions = new Float32Array((ribbonSamples + 1) * 2 * 3);
  const ribbonUvs = new Float32Array((ribbonSamples + 1) * 2 * 2);
  const ribbonIndices = [];
  const pTmp = new THREE.Vector3();
  const tTmp = new THREE.Vector3();
  for (let i = 0; i <= ribbonSamples; i++) {
    const u = i / ribbonSamples;
    curve.getPointAt(u, pTmp);
    curve.getTangentAt(u, tTmp);
    const nx = -tTmp.z;
    const nz = tTmp.x;
    const len = Math.hypot(nx, nz) || 1;
    const ox = (nx / len) * ribbonHalfW;
    const oz = (nz / len) * ribbonHalfW;
    const base = i * 6;
    ribbonPositions[base] = pTmp.x - ox;
    ribbonPositions[base + 1] = 0.007;
    ribbonPositions[base + 2] = pTmp.z - oz;
    ribbonPositions[base + 3] = pTmp.x + ox;
    ribbonPositions[base + 4] = 0.007;
    ribbonPositions[base + 5] = pTmp.z + oz;

    const uvBase = i * 4;
    ribbonUvs[uvBase] = u;
    ribbonUvs[uvBase + 1] = 0;
    ribbonUvs[uvBase + 2] = u;
    ribbonUvs[uvBase + 3] = 1;

    if (i < ribbonSamples) {
      const a = i * 2;
      ribbonIndices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const ribbonGeo = tracker.trackGeo(new THREE.BufferGeometry());
  ribbonGeo.setAttribute('position', new THREE.BufferAttribute(ribbonPositions, 3));
  ribbonGeo.setAttribute('uv', new THREE.BufferAttribute(ribbonUvs, 2));
  ribbonGeo.setIndex(ribbonIndices);
  const ribbonMat = tracker.trackMat(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
      uniforms: {
        uProgress: { value: 0 },
        uSignal: { value: new THREE.Color(SIGNAL_HEX) },
        uAhead: { value: new THREE.Color(0x9ab4d4) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uProgress;
        uniform vec3 uSignal;
        uniform vec3 uAhead;
        varying vec2 vUv;
        void main() {
          float behind = 1.0 - smoothstep(uProgress - 0.006, uProgress + 0.006, vUv.x);
          vec3 col = mix(uAhead, uSignal, behind);
          float alpha = mix(0.24, 0.72, behind);
          gl_FragColor = vec4(col, alpha);
          #include <colorspace_fragment>
        }`,
    }),
  );
  const pathRibbon = new THREE.Mesh(ribbonGeo, ribbonMat);
  pathRibbon.name = 'maze-path-hairline';
  pathRibbon.renderOrder = 2;
  world.add(pathRibbon);

  // 5. Exit goal reticle using the exact same home.js fwidth shader
  const exitPos = cellToWorld(SOLVED_CELLS[SOLVED_CELLS.length - 1][0], SOLVED_CELLS[SOLVED_CELLS.length - 1][1]);
  const exitReticle = createLandingReticle(0.42, tracker, 0.55);
  exitReticle.mesh.position.set(exitPos.x, 0.008, exitPos.z);
  world.add(exitReticle.mesh);

  // 6. Pooled dynamic obstacle meshes (up to MAX_OBSTACLES = 3, zero runtime allocation/leaks)
  const obsBoxGeo = tracker.trackGeo(
    new RoundedBoxGeometry(OBS_HALF_EXTENT * 2, 0.24, OBS_HALF_EXTENT * 2, 2, 0.025),
  );
  const obsCollarGeo = tracker.trackGeo(new THREE.BoxGeometry(OBS_HALF_EXTENT * 2 + 0.01, 0.024, OBS_HALF_EXTENT * 2 + 0.01));
  const obsBodyMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x263142,
      roughness: 0.48,
      metalness: 0.28,
      envMapIntensity: 1.25,
    }),
  );
  const obsCollarMat = tracker.trackMat(
    new THREE.MeshBasicMaterial({ color: SIGNAL_HEX, toneMapped: false }),
  );
  const obstaclePool = Array.from({ length: MAX_OBSTACLES }, () => {
    const group = new THREE.Group();
    group.visible = false;
    const crate = new THREE.Mesh(obsBoxGeo, obsBodyMat);
    crate.position.y = 0.12;
    crate.castShadow = true;
    crate.receiveShadow = true;
    group.add(crate);

    const collar = new THREE.Mesh(obsCollarGeo, obsCollarMat);
    collar.position.y = 0.21;
    group.add(collar);

    const reticle = createLandingReticle(0.22, tracker, 0.72);
    reticle.mesh.position.y = 0.008;
    group.add(reticle.mesh);

    world.add(group);
    return { group, crate, collar, reticle };
  });

  return { world, wallBoxes, gridMat, ribbonMat, obstaclePool };
}

export function createRoversWorld(container, { onProgress = () => {}, onTelemetry = () => {}, isReducedMotion = () => false } = {}) {
  const tracker = createResourceTracker();
  const canvas = document.createElement('canvas');
  canvas.className = 'rovers-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', '3D Tridi Rovers simulation: Luigi V1 & V2 navigating an architectural labyrinth');
  container.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false,
  });
  const isSmallScreen = () => window.innerWidth <= 860;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.23;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FOG_COLOR);
  scene.fog = new THREE.FogExp2(FOG_COLOR, 0.018);

  const pmremTarget = buildPmremEnvironment(renderer, isSmallScreen());
  scene.environment = pmremTarget.texture;

  const camera = new THREE.PerspectiveCamera(
    32,
    (container.clientWidth || window.innerWidth) / Math.max(1, container.clientHeight || window.innerHeight),
    0.08,
    90,
  );

  const hemiLight = new THREE.HemisphereLight(0xaec7e8, 0x313a4a, 1.35);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfff0df, 2.25);
  sunLight.position.set(-6, 12, 7);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(isSmallScreen() ? 1024 : 2048, isSmallScreen() ? 1024 : 2048);
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 32;
  const sBounds = 9.5;
  sunLight.shadow.camera.left = -sBounds;
  sunLight.shadow.camera.right = sBounds;
  sunLight.shadow.camera.top = sBounds;
  sunLight.shadow.camera.bottom = -sBounds;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  const keyLight = new THREE.PointLight(0xfff7ee, 4.2, 16, 1.35);
  scene.add(keyLight);

  const curve = buildRoundedPath(SOLVED_CELLS);
  const pathLengthM = curve.getLength();
  const textures = createTextureSet(renderer, tracker);
  const maze = buildMazeWorld(scene, curve, textures, tracker);

  let rover = null;
  let disposed = false;
  let rafId = 0;

  let targetProgress = 0.03;
  let currentProgress = 0.03;
  let lastProgress = 0.03;
  let lastHeading = 0;
  let wheelAngleL = 0;
  let wheelAngleR = 0;
  let radarMode = 'sg90';
  let pingTimer = 0;
  let smoothBeamLen = 0.9;
  let autoDriveTarget = null; // Autonomous live dodge advance when an obstacle is dropped

  // Active dynamic obstacles in the maze (max 3)
  const activeObstacles = [];
  let nextObstacleSide = 1;

  const pCurveTmp = new THREE.Vector3();
  const tCurveTmp = new THREE.Vector3();

  // Compute C1-smooth lateral avoidance offset along the corridor at curve parameter u
  function getAvoidanceOffset(u) {
    if (!activeObstacles.length) return 0;
    let total = 0;
    for (let i = 0; i < activeObstacles.length; i++) {
      const ob = activeObstacles[i];
      const ds = (u - ob.u) * pathLengthM;
      const w = Math.abs(ds) / AVOID_HALF_SPAN_M;
      if (w < 1) {
        const bump = 0.5 * (1 + Math.cos(Math.PI * w));
        total += ob.side * AVOID_LATERAL_M * bump;
      }
    }
    return Math.max(-0.31, Math.min(0.31, total));
  }

  function evalDivertedPoint(u, outVec) {
    const uc = Math.min(0.996, Math.max(0.004, u));
    curve.getPointAt(uc, pCurveTmp);
    curve.getTangentAt(uc, tCurveTmp);
    const lat = getAvoidanceOffset(uc);
    // Perpendicular vector in XZ plane: (sin(h), 0, cos(h)) where tan = (cos(h), 0, -sin(h))
    const h = Math.atan2(-tCurveTmp.z, tCurveTmp.x);
    outVec.set(pCurveTmp.x + Math.sin(h) * lat, 0, pCurveTmp.z + Math.cos(h) * lat);
    return outVec;
  }

  function syncObstaclePool() {
    for (let i = 0; i < maze.obstaclePool.length; i++) {
      const slot = maze.obstaclePool[i];
      const ob = activeObstacles[i];
      if (!ob) {
        slot.group.visible = false;
        continue;
      }
      slot.group.visible = true;
      slot.group.position.set(ob.x, 0, ob.z);
      slot.group.rotation.y = ob.heading;
      const dropY = (1 - ob.dropT) * (1 - ob.dropT) * 0.68;
      slot.crate.position.y = 0.12 + dropY;
      slot.collar.position.y = 0.21 + dropY;
      slot.reticle.mat.uniforms.uOpacity.value = 0.45 + 0.35 * ob.dropT;
    }
  }

  function isStraightCorridor(cand) {
    const tA = curve.getTangentAt(Math.max(0.01, cand - 0.025));
    const tB = curve.getTangentAt(Math.min(0.99, cand + 0.025));
    let dH = Math.atan2(-tB.z, tB.x) - Math.atan2(-tA.z, tA.x);
    if (dH > Math.PI) dH -= Math.PI * 2;
    if (dH < -Math.PI) dH += Math.PI * 2;
    return Math.abs(dH) < 0.22;
  }

  function findStraightCorridorU(uBase) {
    const startU = Math.min(0.9, Math.max(0.11, uBase));
    // Search forward across the remaining corridor (up to 0.90) enforcing >= MIN_OBS_GAP_U separation
    for (let cand = startU; cand <= 0.9001; cand += 0.005) {
      const u = Math.min(0.9, cand);
      const tooClose = activeObstacles.some((ob) => Math.abs(ob.u - u) < MIN_OBS_GAP_U);
      if (!tooClose && isStraightCorridor(u)) return u;
    }
    // If all remaining straight slots ahead are already occupied, select a straight slot ahead/nearby
    // (placeObstacle will evict conflicting obstacles within MIN_OBS_GAP_U rather than stacking)
    for (let cand = startU; cand <= 0.9001; cand += 0.005) {
      const u = Math.min(0.9, cand);
      if (isStraightCorridor(u)) return u;
    }
    for (let cand = startU; cand >= 0.11; cand -= 0.005) {
      if (isStraightCorridor(cand)) return cand;
    }
    return 0.875;
  }

  // Camera state supports both world-aligned top-down (rel: 0) and rover-relative front/rear (rel: 1)
  const currentShot = { az: -90, el: 78, dist: 6.2, aim: 0.12, shift: 0.2, rel: 0 };
  let goalShot = { ...currentShot };
  const userOrbit = { az: 0, el: 0, dragging: false, reset: false };
  const camTarget = new THREE.Vector3(0, 0.12, 0);
  let smoothAzRad = (-90 * Math.PI) / 180;

  const posTmp = new THREE.Vector3();
  const posAheadTmp = new THREE.Vector3();
  const posBehindTmp = new THREE.Vector3();
  const sensorOriginWorld = new THREE.Vector3();

  const stlLoader = new STLLoader();
  let loadedCount = 0;
  onProgress({ done: 0, total: STL_MANIFEST.length });

  const ready = Promise.all(
    STL_MANIFEST.map(async ([key, url]) => {
      const geo = await loadStlGeometry(stlLoader, key, url);
      loadedCount++;
      if (!disposed) onProgress({ done: loadedCount, total: STL_MANIFEST.length });
      return [key, geo];
    }),
  ).then((entries) => {
    if (disposed) return null;
    const stls = Object.fromEntries(entries);
    rover = buildLuigiRover(stls, tracker);
    rover.v1Group.visible = radarMode === 'fixed';
    rover.v2Group.visible = radarMode === 'sg90';
    scene.add(rover.root);
    evalDivertedPoint(currentProgress, posTmp);
    evalDivertedPoint(currentProgress + 0.004, posAheadTmp);
    rover.root.position.set(posTmp.x, 0, posTmp.z);
    lastHeading = Math.atan2(-(posAheadTmp.z - posTmp.z), posAheadTmp.x - posTmp.x);
    rover.root.rotation.y = lastHeading;
    camTarget.set(posTmp.x, currentShot.aim, posTmp.z);
    return rover;
  });

  const onResize = () => {
    if (disposed) return;
    const w = container.clientWidth || window.innerWidth;
    const h = Math.max(1, container.clientHeight || window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize, { passive: true });

  let lastMs = performance.now();
  let lastTelemetryMs = 0;
  let simTime = 0;

  function renderFrame(nowMs) {
    if (disposed) return;
    rafId = requestAnimationFrame(renderFrame);
    if (document.hidden) {
      lastMs = nowMs;
      return;
    }

    const dt = Math.min(0.05, Math.max(0.001, (nowMs - lastMs) / 1000));
    lastMs = nowMs;
    const rm = isReducedMotion();
    if (!rm) simTime += dt;

    // Advance drop animation on placed obstacles
    let obsDirty = false;
    for (let i = 0; i < activeObstacles.length; i++) {
      if (activeObstacles[i].dropT < 1) {
        activeObstacles[i].dropT = rm ? 1 : Math.min(1, activeObstacles[i].dropT + dt / 0.22);
        obsDirty = true;
      }
    }
    if (obsDirty) syncObstaclePool();

    // If an autonomous obstacle-avoidance drive is active, advance targetProgress smoothly at realistic rover speed
    if (autoDriveTarget !== null) {
      const stepU = (0.48 / pathLengthM) * dt;
      if (targetProgress < autoDriveTarget) {
        targetProgress = Math.min(autoDriveTarget, targetProgress + stepU);
      } else {
        autoDriveTarget = null;
      }
    }

    const kProg = rm ? 1 : 1 - Math.exp(-dt / 0.16);
    currentProgress += (targetProgress - currentProgress) * kProg;
    const u = Math.min(0.995, Math.max(0.005, currentProgress));

    evalDivertedPoint(u, posTmp);
    evalDivertedPoint(u - 0.0035, posBehindTmp);
    evalDivertedPoint(u + 0.0035, posAheadTmp);
    const heading = Math.atan2(-(posAheadTmp.z - posBehindTmp.z), posAheadTmp.x - posBehindTmp.x);
    curve.getPointAt(u, pCurveTmp);
    curve.getTangentAt(u, tCurveTmp);
    const centerHeading = Math.atan2(-tCurveTmp.z, tCurveTmp.x);

    const ds = (currentProgress - lastProgress) * pathLengthM;
    let dHeading = heading - lastHeading;
    if (dHeading > Math.PI) dHeading -= Math.PI * 2;
    if (dHeading < -Math.PI) dHeading += Math.PI * 2;
    lastProgress = currentProgress;
    lastHeading = heading;

    const linVel = ds / dt;
    const angVel = dHeading / dt;
    const vL = linVel - angVel * (WHEEL_TRACK * 0.5);
    const vR = linVel + angVel * (WHEEL_TRACK * 0.5);
    wheelAngleL += (vL * dt) / WHEEL_RADIUS;
    wheelAngleR += (vR * dt) / WHEEL_RADIUS;

    // V2: SG90 servo sweeps +-52 deg; V1: strictly fixed at 0 rad (no rotating neck)
    const neckRad = radarMode === 'sg90' ? Math.sin(simTime * 1.45) * 0.9 : 0;
    const beamAngle = heading + neckRad;
    const beamDx = Math.cos(beamAngle);
    const beamDz = -Math.sin(beamAngle);
    sensorOriginWorld.set(posTmp.x + Math.cos(heading) * 0.19, 0.14, posTmp.z - Math.sin(heading) * 0.19);
    const hitDist = raycastMazeXZ(
      sensorOriginWorld.x,
      sensorOriginWorld.z,
      beamDx,
      beamDz,
      maze.wallBoxes,
      activeObstacles,
      MAX_SCAN_DIST,
    );
    const targetBeamLen = Math.max(0.24, Math.min(1.15, hitDist - 0.06));
    smoothBeamLen += (targetBeamLen - smoothBeamLen) * (rm ? 1 : 1 - Math.exp(-dt / 0.11));

    const avoiding = activeObstacles.some((ob) => Math.abs((u - ob.u) * pathLengthM) < AVOID_HALF_SPAN_M * 0.92);

    if (rover) {
      rover.root.position.set(posTmp.x, 0, posTmp.z);
      rover.root.rotation.y = heading;
      rover.leftWheel.rotation.y = wheelAngleL;
      rover.rightWheel.rotation.y = wheelAngleR;
      rover.headNeck.rotation.z = neckRad;

      rover.radarFanV1.scale.x = smoothBeamLen;
      rover.radarFanV2.scale.x = smoothBeamLen;
      rover.fanMat.uniforms.uPing.value = pingTimer;
    }

    if (pingTimer > 0) {
      pingTimer = Math.max(0, pingTimer - dt * 0.85);
      maze.gridMat.uniforms.uPingRadius.value = (1 - pingTimer) * 7.5;
      maze.gridMat.uniforms.uPingAlpha.value = Math.sin(pingTimer * Math.PI);
    } else {
      maze.gridMat.uniforms.uPingAlpha.value = 0;
    }
    maze.gridMat.uniforms.uRoverPos.value.set(posTmp.x, posTmp.z);
    maze.ribbonMat.uniforms.uProgress.value = u;

    // Smooth camera interpolation across Overhead -> Front -> Behind -> Overhead
    const kCam = rm ? 1 : 1 - Math.exp(-dt / 0.26);
    for (const k of Object.keys(currentShot)) {
      if (k === 'az') continue;
      currentShot[k] += (goalShot[k] - currentShot[k]) * kCam;
    }
    if (userOrbit.reset && !userOrbit.dragging) {
      const decay = rm ? 0 : Math.exp(-dt / 0.14);
      userOrbit.az *= decay;
      userOrbit.el *= decay;
      if (Math.abs(userOrbit.az) < 0.08 && Math.abs(userOrbit.el) < 0.08) {
        userOrbit.az = 0;
        userOrbit.el = 0;
        userOrbit.reset = false;
      }
    }

    // Anchor chase/elevated target & azimuth to undiverted centerline so dodge steering never swings the corridor frame
    const useCenterline = currentShot.rel > 0.5 && currentShot.el >= 38;
    const camHeading = useCenterline ? centerHeading : heading;

    // Shortest-angle azimuth interpolation faster than kProg (0.16 s) so chase orbit clears corner walls
    const kAz = rm ? 1 : 1 - Math.exp(-dt / 0.095);
    const goalAzRad = camHeading * currentShot.rel + ((goalShot.az + userOrbit.az) * Math.PI) / 180;
    let dAz = goalAzRad - smoothAzRad;
    while (dAz > Math.PI) dAz -= Math.PI * 2;
    while (dAz < -Math.PI) dAz += Math.PI * 2;
    smoothAzRad += dAz * kAz;

    const kFollow = rm ? 1 : 1 - Math.exp(-dt / 0.055);
    camTarget.x = useCenterline ? pCurveTmp.x : posTmp.x;
    camTarget.y += (currentShot.aim - camTarget.y) * kFollow;
    camTarget.z = useCenterline ? pCurveTmp.z : posTmp.z;

    const elDeg = Math.max(8, Math.min(86, currentShot.el + userOrbit.el));
    const elRad = (elDeg * Math.PI) / 180;
    const dist = currentShot.dist;

    camera.position.set(
      camTarget.x + Math.cos(smoothAzRad) * Math.cos(elRad) * dist,
      camTarget.y + Math.sin(elRad) * dist,
      camTarget.z - Math.sin(smoothAzRad) * Math.cos(elRad) * dist,
    );
    camera.lookAt(camTarget);
    keyLight.position.set(camera.position.x, camera.position.y + 1.2, camera.position.z);

    const filmWidth = camera.filmGauge * Math.min(camera.aspect, 1);
    camera.filmOffset = -currentShot.shift * camera.aspect * 2 * Math.tan((camera.fov * Math.PI) / 360) * filmWidth;
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);

    if (nowMs - lastTelemetryMs > 66) {
      lastTelemetryMs = nowMs;
      const avgRpm = Math.min(200, Math.round((Math.abs(linVel) / (2 * Math.PI * WHEEL_RADIUS)) * 60));
      onTelemetry({
        simTime,
        neckDeg: Math.round((neckRad * 180) / Math.PI),
        distCm: Math.round(hitDist * 100),
        rpm: avgRpm,
        progress: u,
        radarMode,
        obstacleCount: activeObstacles.length,
        avoiding,
      });
    }
  }

  rafId = requestAnimationFrame(renderFrame);

  return {
    ready,
    setProgress(u, { cancelAuto = false, immediate = false } = {}) {
      if (cancelAuto) autoDriveTarget = null;
      const next = Math.min(0.99, Math.max(0.015, u));
      targetProgress = next;
      if (immediate) {
        currentProgress = next;
        lastProgress = next;
      }
    },
    setShot(shot) {
      goalShot = { ...shot };
    },
    setRadarMode(mode) {
      radarMode = mode === 'fixed' ? 'fixed' : 'sg90';
      if (rover) {
        rover.v1Group.visible = radarMode === 'fixed';
        rover.v2Group.visible = radarMode === 'sg90';
      }
    },
    triggerPing() {
      pingTimer = 1.0;
    },
    placeObstacle() {
      // If rover is already near the exit, stage cleanly before exit and clear exit-zone obstacles so dodge never conflicts
      let anchor = currentProgress + 0.03; // ~0.95 m ahead on 31.77 m path (> AVOID_HALF_SPAN_M = 0.78 m) inside visible corridor
      if (currentProgress > 0.87) {
        currentProgress = 0.825;
        targetProgress = 0.825;
        anchor = 0.855;
        for (let i = activeObstacles.length - 1; i >= 0; i--) {
          if (activeObstacles[i].u >= 0.76) activeObstacles.splice(i, 1);
        }
      }
      const uObs = findStraightCorridorU(anchor);
      // Evict any existing obstacle within MIN_OBS_GAP_U so opposite-side lateral offsets never cancel
      for (let i = activeObstacles.length - 1; i >= 0; i--) {
        if (Math.abs(activeObstacles[i].u - uObs) < MIN_OBS_GAP_U) {
          activeObstacles.splice(i, 1);
        }
      }

      const pt = curve.getPointAt(uObs);
      const tan = curve.getTangentAt(uObs);
      const h = Math.atan2(-tan.z, tan.x);
      const side = nextObstacleSide;
      nextObstacleSide *= -1;
      // Place crate slightly on the opposite side of centerline so rover's bypass lane (+side * 0.305) is clear
      const crateOffset = -side * 0.145;
      const ox = pt.x + Math.sin(h) * crateOffset;
      const oz = pt.z + Math.cos(h) * crateOffset;

      if (activeObstacles.length >= MAX_OBSTACLES) {
        activeObstacles.shift();
      }
      activeObstacles.push({
        u: uObs,
        side,
        x: ox,
        z: oz,
        heading: h,
        cosH: Math.cos(h),
        sinH: Math.sin(h),
        dropT: isReducedMotion() ? 1 : 0,
      });
      syncObstaclePool();
      pingTimer = 1.0;
      autoDriveTarget = Math.min(0.965, uObs + 0.062);
      return activeObstacles.length;
    },
    clearObstacles() {
      activeObstacles.length = 0;
      autoDriveTarget = null;
      syncObstaclePool();
    },
    orbitDelta(dAz, dEl) {
      userOrbit.dragging = true;
      userOrbit.reset = false;
      userOrbit.az += dAz;
      userOrbit.el = Math.max(-28, Math.min(34, userOrbit.el + dEl));
    },
    endOrbit() {
      userOrbit.dragging = false;
    },
    resetOrbit() {
      userOrbit.reset = true;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      scene.environment = null;
      pmremTarget.dispose();
      tracker.disposeAll(maze.world);
      if (rover) scene.remove(rover.root);
      scene.remove(maze.world);
      renderer.dispose();
      if (canvas.parentNode) canvas.remove();
    },
  };
}
