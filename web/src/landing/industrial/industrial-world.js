// Dedicated 3D WebGL Giga-Factory Campus for Tridi Industrial (/industrial).
// Built to the exact scale, architectural variety, lighting, and craft of landing/world.js:
// - Continuous conveyor crate pool + zone-accumulation buffer + 6-axis analytical IK pick-and-place
//   onto an 8-slot (2x2x2) Euro-pallet shuttle with smooth outfeed glide and fresh pallet feed.
// - On-demand fault injection + fixed-timer slip mode: defective/misaligned crates trigger PE-02/PE-03
//   clamped optical beams and are physically diverted by PUSHER-01 down the chute into the reject bin.
// - Physically anchored photoelectric sensors (PE-01, PE-02, PE-03) mounted with steel flanges, posts,
//   and collars onto the conveyor side rails (zero floating parts).
// - Smooth recipe switching (250 g / 500 g / 1 kg) adapting crate dimensions, press stroke, and IK height.
// - Synchronous (zero external .glb or WASM delay), <= 85 draw calls, 100% GPU dispose().
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createResourceTracker, createTextureSet } from '../world-textures.js';

const SIGNAL_HEX = 0xc8ff2e;
const FAULT_HEX = 0xf59e0b;
const SIGNAL_COLOR = new THREE.Color(SIGNAL_HEX);
const FAULT_COLOR = new THREE.Color(FAULT_HEX);
const FOG_COLOR = 0x151c29; // exact world.js cyber-twilight slate depth
const FILM_PIXEL_RATIO = 1.5;

// Camera shots using home.js spherical + shift-lens convention (plumb verticals, same vast FOV)
export const INDUSTRIAL_SHOTS = {
  hero: { az: -58, el: 12, dist: 8.6, aimX: 0.6, aimY: 1.4, aimZ: -0.2, shift: 0.21 },
  assembler: { az: -48, el: 14, dist: 7.4, aimX: -2.05, aimY: 1.45, aimZ: -0.2, shift: 0.21 },
  validation: { az: -76, el: 11, dist: 6.8, aimX: 0.65, aimY: 1.35, aimZ: -0.1, shift: 0.21 },
  policy: { az: -34, el: 13, dist: 8.8, aimX: 1.4, aimY: 1.45, aimZ: -0.1, shift: 0.21 },
  close: { az: -38, el: 14, dist: 14.5, aimX: 0.4, aimY: 2.0, aimZ: -0.6, shift: 0 },
};

const STATION_AIMS = [
  { x: -2.05, y: 1.45, z: -0.2, ringX: -2.05, ringZ: 0.0, ringR: 1.45, az: -48, dist: 7.4 }, // ST-01 Silos & Feeder
  { x: 0.3, y: 1.45, z: 0.0, ringX: 0.35, ringZ: 0.0, ringR: 1.45, az: -112, dist: 6.6 }, // ST-02 Vision & Press
  { x: 3.4, y: 1.35, z: 0.35, ringX: 3.35, ringZ: 0.2, ringR: 1.85, az: -56, dist: 7.4 }, // ST-03 Palletizing & AGVs
  { x: -1.15, y: 1.38, z: -1.65, ringX: -1.15, ringZ: -1.65, ringR: 1.35, az: -136, dist: 6.1 }, // ST-04 PLC & Mezzanine
];

const RECIPES = {
  '250g': { speed: 1.15, boxScale: [0.88, 0.86, 0.88], cycleS: 3.8 },
  '500g': { speed: 1.0, boxScale: [1.0, 1.0, 1.0], cycleS: 4.4 },
  '1kg': { speed: 0.85, boxScale: [1.12, 1.12, 1.08], cycleS: 5.2 },
};

// Quintic minimum-jerk easing (zero velocity & acceleration at endpoints -> buttery smooth robotics)
const quintic = (t) => {
  const u = Math.max(0, Math.min(1, t));
  return u * u * u * (u * (u * 6 - 15) + 10);
};

function normalizeGeo(rawGeo) {
  const g = rawGeo.index ? rawGeo.toNonIndexed() : rawGeo.clone();
  for (const name of Object.keys(g.attributes)) {
    if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
  }
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) {
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  }
  return g;
}

function mergeBucket(geos, tracker) {
  if (!geos.length) return null;
  const norm = geos.map((g) => normalizeGeo(g));
  for (const g of geos) g.dispose();
  const merged = mergeGeometries(norm, false);
  for (const g of norm) g.dispose();
  return merged ? tracker.trackGeo(merged) : null;
}

function createBeltTexture(tracker, maxAniso) {
  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#181e28';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(205, 220, 240, 0.14)';
  ctx.lineWidth = 3;
  for (let x = 0; x < w; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 12, h * 0.5);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(200, 255, 46, 0.18)';
  ctx.fillRect(0, 8, w, 2);
  ctx.fillRect(0, h - 10, w, 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 1);
  tex.anisotropy = Math.min(8, maxAniso || 4);
  tex.needsUpdate = true;
  return tracker.trackTex(tex);
}

function createHmiTexture(tracker) {
  const w = 256;
  const h = 160;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0c1522';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#162436';
  ctx.fillRect(0, 0, w, 26);
  ctx.fillStyle = '#c8ff2e';
  ctx.fillRect(10, 9, 8, 8);
  ctx.fillStyle = '#e5eef8';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('S7-1200 · PACKML EXECUTE', 24, 17);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, 74);
  ctx.lineTo(236, 74);
  ctx.stroke();
  for (const [x, label, col] of [
    [24, 'ST01', '#38bdf8'],
    [82, 'ST02', '#c8ff2e'],
    [140, 'ST03', '#c8ff2e'],
    [198, 'ST04', '#38bdf8'],
  ]) {
    ctx.fillStyle = '#152232';
    ctx.fillRect(x, 54, 38, 38);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, 54, 38, 38);
    ctx.fillStyle = '#dce7f5';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(label, x + 6, 77);
  }
  ctx.fillStyle = '#1c2b3f';
  ctx.fillRect(16, 112, 224, 32);
  ctx.fillStyle = '#c8ff2e';
  ctx.fillRect(22, 120, 128, 6);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(22, 132, 92, 6);
  ctx.fillStyle = '#9bb0c9';
  ctx.font = '10px monospace';
  ctx.fillText('OEE 99.4%', 168, 131);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tracker.trackTex(tex);
}

// Same cyber-twilight Sky + PMREM bounce setup as world.js
function buildFactorySkyAndPmrem(scene, renderer, isSmall) {
  const sunVec = new THREE.Vector3(18, 5.5, -24).normalize();
  const makeSky = () => {
    const sky = new Sky();
    sky.scale.setScalar(2500);
    const u = sky.material.uniforms;
    u.turbidity.value = 6.8;
    u.rayleigh.value = 2.5;
    u.mieCoefficient.value = 0.006;
    u.mieDirectionalG.value = 0.84;
    u.sunPosition.value.copy(sunVec);
    return sky;
  };
  const liveSky = makeSky();
  scene.add(liveSky);

  const skyScene = new THREE.Scene();
  const skyCopy = makeSky();
  skyScene.add(skyCopy);

  const groundGeo = new THREE.CircleGeometry(50, 24);
  const groundMat = new THREE.MeshBasicMaterial({ color: 0x18202d });
  const groundDisc = new THREE.Mesh(groundGeo, groundMat);
  groundDisc.rotation.x = -Math.PI / 2;
  groundDisc.position.y = -1;
  skyScene.add(groundDisc);

  const bounceDefs = [
    { pos: [0, 6, -24], rot: [0, 0, 0], color: 0x627da8, w: 46, h: 7 },
    { pos: [0, 6, 24], rot: [0, Math.PI, 0], color: 0x3b4f6e, w: 46, h: 7 },
    { pos: [-26, 6, 0], rot: [0, Math.PI / 2, 0], color: 0x506990, w: 40, h: 7 },
    { pos: [26, 6, 0], rot: [0, -Math.PI / 2, 0], color: 0x455c7d, w: 40, h: 7 },
    { pos: [0, 18, 0], rot: [Math.PI / 2, 0, 0], color: 0x5c7498, w: 42, h: 32 },
  ];
  const created = bounceDefs.map((b) => {
    const g = new THREE.PlaneGeometry(b.w, b.h);
    const m = new THREE.MeshBasicMaterial({ color: b.color });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(...b.pos);
    mesh.rotation.set(...b.rot);
    skyScene.add(mesh);
    return { g, m };
  });

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTarget = pmrem.fromScene(skyScene, 0.025, 0.1, 4000, { size: isSmall ? 128 : 256 });
  pmrem.dispose();
  skyCopy.geometry.dispose();
  skyCopy.material.dispose();
  groundGeo.dispose();
  groundMat.dispose();
  for (const c of created) {
    c.g.dispose();
    c.m.dispose();
  }
  return { envTarget, liveSky };
}

// Analytical 2-link IK solver for the 6-axis industrial palletizing arm
const ARM_SH_Y = 1.02;
const ARM_L1 = 1.18;
const ARM_L2 = 1.08;
const ARM_WRIST_DROP = 0.28;

function solveArmIK(arm, baseX, baseZ, tx, ty, tz) {
  const dx = tx - baseX;
  const dz = tz - baseZ;
  const yaw = Math.atan2(-dz, dx);
  const rHoriz = Math.max(0.25, Math.hypot(dx, dz));
  const dy = ty + ARM_WRIST_DROP - ARM_SH_Y;
  const maxReach = ARM_L1 + ARM_L2 - 0.04;
  const minReach = Math.abs(ARM_L1 - ARM_L2) + 0.08;
  const d = Math.max(minReach, Math.min(maxReach, Math.hypot(rHoriz, dy)));

  const cosAlpha = Math.max(-1, Math.min(1, (ARM_L1 * ARM_L1 + d * d - ARM_L2 * ARM_L2) / (2 * ARM_L1 * d)));
  const cosBeta = Math.max(-1, Math.min(1, (ARM_L1 * ARM_L1 + ARM_L2 * ARM_L2 - d * d) / (2 * ARM_L1 * ARM_L2)));
  const elev = Math.atan2(dy, rHoriz);
  const shoulderAngleFromHoriz = elev + Math.acos(cosAlpha);
  const elbowBend = -(Math.PI - Math.acos(cosBeta));

  const shRotZ = shoulderAngleFromHoriz - Math.PI / 2;
  const elRotZ = elbowBend;
  const wrRotZ = -Math.PI - shRotZ - elRotZ;

  arm.turret.rotation.y = yaw;
  arm.shoulder.rotation.z = shRotZ;
  arm.elbow.rotation.z = elRotZ;
  arm.wrist.rotation.z = wrRotZ;
}

function buildRoboticArm(tracker, mats, scale = 1.0) {
  const root = new THREE.Group();
  root.scale.setScalar(scale);

  const plinth = new THREE.Mesh(tracker.trackGeo(new THREE.CylinderGeometry(0.36, 0.42, 0.14, 20)), mats.darkFrame);
  plinth.position.y = 0.07;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  root.add(plinth);

  const ped = new THREE.Mesh(tracker.trackGeo(new THREE.CylinderGeometry(0.26, 0.32, 0.56, 20)), mats.anodized);
  ped.position.y = 0.42;
  ped.castShadow = true;
  root.add(ped);

  const turret = new THREE.Group();
  turret.position.y = 0.7;
  root.add(turret);

  const turretBody = new THREE.Mesh(tracker.trackGeo(new THREE.CylinderGeometry(0.24, 0.26, 0.32, 20)), mats.gantry);
  turretBody.position.y = 0.16;
  turretBody.castShadow = true;
  turret.add(turretBody);

  const turretRing = new THREE.Mesh(tracker.trackGeo(new THREE.TorusGeometry(0.245, 0.012, 8, 28)), mats.signal);
  turretRing.rotation.x = Math.PI / 2;
  turretRing.position.y = 0.24;
  turret.add(turretRing);

  const shoulder = new THREE.Group();
  shoulder.position.y = ARM_SH_Y - 0.7;
  turret.add(shoulder);

  const shoulderHub = new THREE.Mesh(tracker.trackGeo(new THREE.CylinderGeometry(0.15, 0.15, 0.34, 16)), mats.steel);
  shoulderHub.rotation.x = Math.PI / 2;
  shoulder.add(shoulderHub);

  const lowerArm = new THREE.Mesh(tracker.trackGeo(new RoundedBoxGeometry(0.19, ARM_L1, 0.21, 1, 0.03)), mats.gantry);
  lowerArm.position.y = ARM_L1 * 0.5;
  lowerArm.castShadow = true;
  shoulder.add(lowerArm);

  const servoPack = new THREE.Mesh(tracker.trackGeo(new RoundedBoxGeometry(0.13, 0.48, 0.14, 1, 0.02)), mats.plcTeal);
  servoPack.position.set(-0.15, 0.34, 0);
  shoulder.add(servoPack);

  const elbow = new THREE.Group();
  elbow.position.y = ARM_L1;
  shoulder.add(elbow);

  const elbowCap = new THREE.Mesh(tracker.trackGeo(new THREE.CylinderGeometry(0.125, 0.125, 0.28, 16)), mats.steel);
  elbowCap.rotation.x = Math.PI / 2;
  elbow.add(elbowCap);

  const elbowRing = new THREE.Mesh(tracker.trackGeo(new THREE.TorusGeometry(0.13, 0.01, 8, 22)), mats.signal);
  elbowRing.position.z = 0.142;
  elbow.add(elbowRing);

  const upperArm = new THREE.Mesh(tracker.trackGeo(new RoundedBoxGeometry(0.14, ARM_L2, 0.15, 1, 0.025)), mats.anodized);
  upperArm.position.y = ARM_L2 * 0.5;
  upperArm.castShadow = true;
  elbow.add(upperArm);

  const wrist = new THREE.Group();
  wrist.position.y = ARM_L2;
  elbow.add(wrist);

  const wristCollar = new THREE.Mesh(tracker.trackGeo(new THREE.CylinderGeometry(0.075, 0.09, 0.18, 14)), mats.steel);
  wristCollar.position.y = 0.09;
  wrist.add(wristCollar);

  const gripper = new THREE.Mesh(tracker.trackGeo(new RoundedBoxGeometry(0.32, 0.06, 0.22, 1, 0.012)), mats.darkFrame);
  gripper.position.y = 0.22;
  const gripperPad = new THREE.Mesh(tracker.trackGeo(new THREE.BoxGeometry(0.26, 0.018, 0.16)), mats.signal);
  gripperPad.position.y = 0.258;
  wrist.add(gripper, gripperPad);

  const carryAnchor = new THREE.Group();
  carryAnchor.position.set(0, ARM_WRIST_DROP + 0.17, 0);
  wrist.add(carryAnchor);

  return { root, turret, shoulder, elbow, wrist, carryAnchor };
}

// Build vast 140m x 80m Giga-Factory Campus with distinct architectural zones & handcrafted props
function buildGigaFactoryCampus(scene, tracker, textures) {
  const campus = new THREE.Group();
  campus.name = 'giga-factory-campus';

  const floorGeo = tracker.trackGeo(new THREE.PlaneGeometry(160, 110));
  floorGeo.rotateX(-Math.PI / 2);
  textures.plaza.map.repeat.set(48, 34);
  textures.plaza.normalMap.repeat.set(48, 34);
  textures.plaza.roughnessMap.repeat.set(48, 34);
  const floorMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xdce4f0,
      map: textures.plaza.map,
      normalMap: textures.plaza.normalMap,
      normalScale: new THREE.Vector2(0.42, 0.42),
      roughnessMap: textures.plaza.roughnessMap,
      roughness: 0.86,
      metalness: 0.14,
      envMapIntensity: 0.95,
    }),
  );
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.receiveShadow = true;
  campus.add(floor);

  const steelParts = [];
  const stainlessParts = [];
  const glassParts = [];
  const wallParts = [];
  const crateParts = [];
  const accentParts = [];
  const yellowParts = [];
  const timberParts = [];

  const pushBox = (bucket, w, h, d, x, y, z, ry = 0) => {
    const g = new THREE.BoxGeometry(w, h, d);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    bucket.push(g);
  };
  const pushCyl = (bucket, rt, rb, h, x, y, z, rx = 0, rz = 0, seg = 14) => {
    const g = new THREE.CylinderGeometry(rt, rb, h, seg);
    if (rx) g.rotateX(rx);
    if (rz) g.rotateZ(rz);
    g.translate(x, y, z);
    bucket.push(g);
  };

  // Open-Span Giga-Factory Portal Trusses
  for (let x = -44; x <= 44; x += 11) {
    for (const z of [-24, 24]) {
      pushBox(steelParts, 0.68, 13.5, 0.78, x, 6.75, z);
      pushBox(steelParts, 1.15, 0.5, 1.15, x, 0.25, z);
    }
    pushBox(steelParts, 0.42, 0.55, 48.6, x, 13.2, 0);
    pushBox(steelParts, 0.28, 0.28, 48.0, x, 11.9, 0);
  }
  for (const z of [-22.6, 22.6]) {
    pushBox(steelParts, 96, 0.55, 0.38, 0, 9.6, z);
  }
  for (const z of [-13.5, 13.5]) {
    pushCyl(stainlessParts, 0.42, 0.42, 88, 0, 10.8, z, 0, Math.PI / 2, 12);
    pushCyl(stainlessParts, 0.14, 0.14, 88, 0, 9.8, z + 0.85, 0, Math.PI / 2, 10);
  }

  for (const z of [-25.5, 25.5]) {
    pushBox(wallParts, 110, 4.2, 0.45, 0, 2.1, z);
    pushBox(wallParts, 110, 2.4, 0.45, 0, 12.6, z);
    for (let mx = -48; mx <= 48; mx += 6) {
      pushBox(steelParts, 0.18, 7.6, 0.28, mx, 7.8, z);
    }
    const gWin = new THREE.PlaneGeometry(108, 7.2);
    if (z > 0) gWin.rotateY(Math.PI);
    gWin.translate(0, 7.8, z + (z < 0 ? 0.25 : -0.25));
    glassParts.push(gWin);
  }

  // ZONE A — Cantilevered Glass Control Room & Observation Mezzanine
  pushBox(steelParts, 26, 0.28, 5.2, 2, 4.6, -20.2);
  for (const cx of [-9.5, -1.5, 6.5, 14.5]) {
    pushBox(steelParts, 0.42, 4.6, 0.42, cx, 2.3, -17.9);
  }
  pushBox(steelParts, 18, 0.24, 4.8, 2, 8.2, -20.2);
  for (const gx of [-7, -2.5, 2, 6.5, 11]) {
    pushBox(steelParts, 0.12, 3.6, 0.12, gx, 6.4, -17.7);
  }
  const ctrlGlass = new THREE.PlaneGeometry(18, 3.3);
  ctrlGlass.translate(2, 6.4, -17.72);
  glassParts.push(ctrlGlass);
  pushBox(timberParts, 11, 0.12, 0.9, 2, 5.5, -18.8);
  pushBox(accentParts, 9.5, 1.4, 0.08, 2, 6.8, -21.8);
  for (let s = 0; s < 14; s++) {
    pushBox(steelParts, 1.35, 0.08, 0.34, -10.8 - s * 0.34, 4.4 - s * 0.32, -17.4);
  }

  // ZONE B — Stainless Process Silo & Tank Farm Wing
  const siloSites = [
    { x: -16.5, z: -9.5, r: 1.85, h: 7.4 },
    { x: -21.5, z: -9.5, r: 1.85, h: 7.4 },
    { x: -26.5, z: -9.5, r: 1.85, h: 7.4 },
    { x: -18.5, z: 5.5, r: 1.65, h: 6.6 },
    { x: -23.5, z: 5.5, r: 1.65, h: 6.6 },
  ];
  for (const s of siloSites) {
    for (const [lx, lz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      pushBox(steelParts, 0.22, 2.4, 0.22, s.x + lx * s.r * 0.72, 1.2, s.z + lz * s.r * 0.72);
    }
    pushCyl(stainlessParts, s.r, 0.35, 1.8, s.x, 2.2, s.z, 0, 0, 20);
    pushCyl(stainlessParts, s.r, s.r, s.h - 2.6, s.x, 3.1 + (s.h - 2.6) * 0.5, s.z, 0, 0, 20);
    pushBox(accentParts, 0.1, 2.2, 0.08, s.x + s.r + 0.04, 5.0, s.z);
  }
  pushCyl(stainlessParts, 0.18, 0.18, 24, -15, 7.6, -9.5, 0, Math.PI / 2, 12);
  pushCyl(stainlessParts, 0.16, 0.16, 12, -3.5, 7.6, -4.5, Math.PI / 2, 0, 12);

  // ZONE C — High-Bay AS/RS Storage Racks
  for (const rz of [-16.5, 16.5]) {
    for (let rx = -8; rx <= 26; rx += 5.5) {
      if (rz < 0 && rx > -10 && rx < 15) continue;
      for (const dx of [-2.1, 2.1]) {
        for (const dz of [-0.6, 0.6]) {
          pushBox(steelParts, 0.14, 7.6, 0.14, rx + dx, 3.8, rz + dz);
        }
      }
      for (const sy of [1.4, 3.0, 4.6, 6.2]) {
        pushBox(steelParts, 4.35, 0.1, 1.28, rx, sy, rz);
        for (const cx of [-1.25, 0, 1.25]) {
          pushBox(crateParts, 0.92, 0.72, 0.88, rx + cx, sy + 0.41, rz);
        }
      }
    }
  }

  // HANDCRAFTED FACTORY PROPS
  const flX = 9.2;
  const flZ = -4.2;
  pushBox(yellowParts, 1.55, 0.62, 1.08, flX, 0.55, flZ);
  pushBox(steelParts, 0.95, 0.95, 0.96, flX - 0.1, 1.32, flZ);
  pushBox(steelParts, 0.14, 2.45, 0.12, flX + 0.88, 1.32, flZ - 0.34);
  pushBox(steelParts, 0.14, 2.45, 0.12, flX + 0.88, 1.32, flZ + 0.34);
  pushBox(stainlessParts, 1.15, 0.06, 0.14, flX + 1.48, 0.16, flZ - 0.28);
  pushBox(stainlessParts, 1.15, 0.06, 0.14, flX + 1.48, 0.16, flZ + 0.28);
  for (const [wx, wz] of [[0.55, 0.56], [0.55, -0.56], [-0.58, 0.52], [-0.58, -0.52]]) {
    pushCyl(steelParts, 0.26, 0.26, 0.18, flX + wx, 0.26, flZ + wz, Math.PI / 2, 0, 14);
  }

  pushBox(steelParts, 1.35, 0.55, 0.92, -9.5, 0.42, 4.4);
  pushBox(timberParts, 1.85, 0.14, 1.15, -7.5, 0.28, 4.4);
  pushBox(crateParts, 0.72, 0.62, 0.76, -7.9, 0.66, 4.4);
  pushBox(crateParts, 0.72, 0.52, 0.76, -7.05, 0.61, 4.4);

  for (const [ax, az] of [[-5.6, -5.2], [7.4, 5.2]]) {
    pushBox(steelParts, 1.18, 0.24, 0.78, ax, 0.16, az);
    pushBox(accentParts, 1.2, 0.04, 0.8, ax, 0.22, az);
    pushBox(crateParts, 0.76, 0.44, 0.62, ax, 0.5, az);
    pushBox(steelParts, 0.26, 0.72, 0.42, ax - 0.82, 0.36, az);
    pushBox(accentParts, 0.04, 0.24, 0.18, ax - 0.68, 0.48, az);
  }

  for (const [dx, dz, ry] of [[-4.8, 3.6, 0.25], [4.8, -4.6, -0.3]]) {
    pushBox(steelParts, 1.45, 0.08, 0.72, dx, 1.05, dz, ry);
    pushBox(steelParts, 0.08, 1.05, 0.62, dx - 0.62, 0.52, dz, ry);
    pushBox(steelParts, 0.08, 1.05, 0.62, dx + 0.62, 0.52, dz, ry);
    pushBox(steelParts, 0.78, 0.46, 0.05, dx, 1.44, dz, ry);
    pushBox(accentParts, 0.72, 0.38, 0.02, dx, 1.44, dz + 0.03, ry);
    pushBox(yellowParts, 0.74, 0.92, 0.48, dx + 1.25, 0.48, dz, ry);
  }

  for (const [bx, bz] of [
    [-4.2, -2.5], [-4.2, 2.3], [5.8, -2.5], [5.8, 2.3],
    [-4.2, -7.2], [5.8, -7.2], [-4.2, 7.2], [5.8, 7.2],
  ]) {
    pushCyl(yellowParts, 0.085, 0.095, 0.96, bx, 0.48, bz, 0, 0, 12);
    pushCyl(steelParts, 0.14, 0.14, 0.04, bx, 0.02, bz, 0, 0, 12);
  }

  const planterSites = [
    { x: -12.5, z: -15.5 },
    { x: -3.5, z: -15.5 },
    { x: 12.5, z: -15.5 },
    { x: 18.5, z: -15.5 },
  ];
  const trunkMat = tracker.trackMat(new THREE.MeshStandardMaterial({ map: textures.bark.map, roughness: 0.9 }));
  const leafMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.leaf.map,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.75,
    }),
  );
  for (const p of planterSites) {
    pushBox(wallParts, 1.45, 0.56, 1.45, p.x, 0.28, p.z);
    pushBox(timberParts, 1.5, 0.08, 1.5, p.x, 0.58, p.z);
    const trunk = new THREE.Mesh(tracker.trackGeo(new THREE.CylinderGeometry(0.06, 0.09, 2.2, 8)), trunkMat);
    trunk.position.set(p.x, 1.5, p.z);
    campus.add(trunk);
    for (let k = 0; k < 4; k++) {
      const card = new THREE.Mesh(tracker.trackGeo(new THREE.PlaneGeometry(1.45, 1.45)), leafMat);
      card.position.set(p.x, 2.65, p.z);
      card.rotation.y = (k * Math.PI) / 4;
      campus.add(card);
    }
  }

  const steelMat = tracker.trackMat(new THREE.MeshStandardMaterial({ color: 0x222b38, roughness: 0.42, metalness: 0.78 }));
  const stainlessMat = tracker.trackMat(new THREE.MeshStandardMaterial({ color: 0x9aa8ba, roughness: 0.26, metalness: 0.88 }));
  const wallMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1b2330,
      map: textures.precast.map,
      normalMap: textures.precast.normalMap,
      normalScale: new THREE.Vector2(0.45, 0.45),
      roughness: 0.82,
    }),
  );
  const glassMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x4b6a94,
      transparent: true,
      opacity: 0.28,
      roughness: 0.12,
      metalness: 0.65,
    }),
  );
  const rackCrateMat = tracker.trackMat(new THREE.MeshStandardMaterial({ color: 0x3b485b, roughness: 0.55, metalness: 0.24 }));
  const accentMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0xdfff85, emissive: SIGNAL_HEX, emissiveIntensity: 0.9, roughness: 0.25 }),
  );
  const yellowMat = tracker.trackMat(new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.42, metalness: 0.25 }));
  const timberMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({ map: textures.timber.map, normalMap: textures.timber.normalMap, roughness: 0.7 }),
  );

  campus.add(new THREE.Mesh(mergeBucket(steelParts, tracker), steelMat));
  campus.add(new THREE.Mesh(mergeBucket(stainlessParts, tracker), stainlessMat));
  campus.add(new THREE.Mesh(mergeBucket(wallParts, tracker), wallMat));
  campus.add(new THREE.Mesh(mergeBucket(glassParts, tracker), glassMat));
  if (crateParts.length) campus.add(new THREE.Mesh(mergeBucket(crateParts, tracker), rackCrateMat));
  if (accentParts.length) campus.add(new THREE.Mesh(mergeBucket(accentParts, tracker), accentMat));
  if (yellowParts.length) campus.add(new THREE.Mesh(mergeBucket(yellowParts, tracker), yellowMat));
  if (timberParts.length) campus.add(new THREE.Mesh(mergeBucket(timberParts, tracker), timberMat));

  // Overhead Linear Luminaires + Volumetric Cones + Elliptical Floor Pools
  const lumPositions = [];
  for (const x of [-22, -11, 0, 11, 22]) {
    for (const z of [-9.5, 0, 9.5]) lumPositions.push({ x, z });
  }
  const lumGeo = tracker.trackGeo(new RoundedBoxGeometry(4.2, 0.08, 0.26, 1, 0.02));
  const lumMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0xeef5ff, emissive: 0xcce2ff, emissiveIntensity: 2.3, roughness: 0.18 }),
  );
  const lumMesh = new THREE.InstancedMesh(lumGeo, lumMat, lumPositions.length);

  const coneGeo = tracker.trackGeo(new THREE.CylinderGeometry(0.55, 3.4, 11.2, 16, 1, true));
  const coneMat = tracker.trackMat(
    new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(0xcce2ff) }, uOpacity: { value: 0.06 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv; varying vec3 vViewNormal; varying vec3 vViewPos;
        void main() {
          vUv = uv;
          vec4 lp = vec4(position, 1.0); vec3 ln = normal;
          #ifdef USE_INSTANCING
            lp = instanceMatrix * lp; ln = mat3(instanceMatrix) * ln;
          #endif
          vec4 mv = modelViewMatrix * lp;
          vViewPos = -mv.xyz; vViewNormal = normalize(normalMatrix * ln);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; uniform float uOpacity;
        varying vec2 vUv; varying vec3 vViewNormal; varying vec3 vViewPos;
        void main() {
          float vf = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
          float ndv = clamp(abs(dot(normalize(vViewNormal), normalize(vViewPos))), 0.0, 1.0);
          gl_FragColor = vec4(uColor, vf * pow(ndv, 1.9) * uOpacity);
          #include <colorspace_fragment>
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  );
  const coneMesh = new THREE.InstancedMesh(coneGeo, coneMat, lumPositions.length);
  coneMesh.renderOrder = 2;

  const poolGeo = tracker.trackGeo(new THREE.PlaneGeometry(1, 1));
  poolGeo.rotateX(-Math.PI / 2);
  const poolMat = tracker.trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xcce2ff,
      map: textures.ellipticalPool.map,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const poolMesh = new THREE.InstancedMesh(poolGeo, poolMat, lumPositions.length);
  poolMesh.renderOrder = 1;

  const dummy = new THREE.Object3D();
  lumPositions.forEach((l, i) => {
    dummy.position.set(l.x, 11.55, l.z);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    lumMesh.setMatrixAt(i, dummy.matrix);

    dummy.position.set(l.x, 5.95, l.z);
    dummy.scale.set(1.4, 1, 0.72);
    dummy.updateMatrix();
    coneMesh.setMatrixAt(i, dummy.matrix);

    dummy.position.set(l.x, 0.004, l.z);
    dummy.scale.set(10.5, 1, 6.2);
    dummy.updateMatrix();
    poolMesh.setMatrixAt(i, dummy.matrix);
  });
  lumMesh.instanceMatrix.needsUpdate = true;
  coneMesh.instanceMatrix.needsUpdate = true;
  poolMesh.instanceMatrix.needsUpdate = true;
  campus.add(lumMesh, coneMesh, poolMesh);

  // Floor Safety Bay Markings & Flow Guides
  const bayParts = [];
  const addLine = (w, d, x, z) => {
    const p = new THREE.PlaneGeometry(w, d);
    p.rotateX(-Math.PI / 2);
    p.translate(x, 0.006, z);
    bayParts.push(p);
  };
  addLine(10.2, 0.042, 0.8, -2.55);
  addLine(10.2, 0.042, 0.8, 2.35);
  addLine(0.042, 4.94, -4.3, -0.1);
  addLine(0.042, 4.94, 5.9, -0.1);
  addLine(76, 0.032, 0, -4.8);
  addLine(76, 0.032, 0, 4.8);
  const bayMat = tracker.trackMat(
    new THREE.MeshBasicMaterial({ color: SIGNAL_HEX, transparent: true, opacity: 0.32, depthWrite: false }),
  );
  const bayLines = new THREE.Mesh(mergeBucket(bayParts, tracker), bayMat);
  bayLines.renderOrder = 1;
  campus.add(bayLines);

  // Holographic floor focus reticle for Chapter 1 (Plant Stations)
  const ringMat = tracker.trackMat(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uSignal: { value: new THREE.Color(SIGNAL_HEX) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uOpacity; uniform vec3 uSignal;
        varying vec2 vUv;
        void main() {
          float d = length(vUv);
          if (d > 1.0 || d < 0.68) discard;
          float ang = atan(vUv.y, vUv.x);
          float mainR = 1.0 - smoothstep(0.0, 0.022, abs(d - 0.88));
          float dash = smoothstep(0.1, 0.45, cos(ang * 10.0 + uTime * 0.6));
          float innerR = (1.0 - smoothstep(0.0, 0.018, abs(d - 0.79))) * dash * 0.55;
          float glow = exp(-pow((d - 0.88) / 0.055, 2.0)) * 0.26;
          float a = clamp(mainR * 0.92 + innerR + glow, 0.0, 1.0) * uOpacity;
          if (a < 0.005) discard;
          gl_FragColor = vec4(uSignal, a);
          #include <colorspace_fragment>
        }`,
    }),
  );
  const stationRing = new THREE.Mesh(tracker.trackGeo(new THREE.PlaneGeometry(2, 2)), ringMat);
  stationRing.rotation.x = -Math.PI / 2;
  stationRing.position.set(0, 0.01, 0);
  stationRing.renderOrder = 3;
  stationRing.visible = false;
  campus.add(stationRing);

  scene.add(campus);
  return { campus, stationRing, ringMat };
}

function buildHeroCellAndLines(scene, tracker, beltTex, hmiTex) {
  const mats = {
    darkFrame: tracker.trackMat(new THREE.MeshStandardMaterial({ color: 0x1e2530, roughness: 0.4, metalness: 0.78 })),
    steel: tracker.trackMat(new THREE.MeshStandardMaterial({ color: 0x9aa6b8, roughness: 0.26, metalness: 0.88 })),
    anodized: tracker.trackMat(new THREE.MeshStandardMaterial({ color: 0x2c3646, roughness: 0.34, metalness: 0.82 })),
    gantry: tracker.trackMat(new THREE.MeshStandardMaterial({ color: 0x354052, roughness: 0.3, metalness: 0.84 })),
    cabinet: tracker.trackMat(new THREE.MeshStandardMaterial({ color: 0x2a3342, roughness: 0.38, metalness: 0.68 })),
    plcTeal: tracker.trackMat(new THREE.MeshStandardMaterial({ color: 0x0e8b9a, roughness: 0.3, metalness: 0.45 })),
    hmi: tracker.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: hmiTex,
        emissive: 0x226688,
        emissiveMap: hmiTex,
        emissiveIntensity: 0.95,
        roughness: 0.16,
      }),
    ),
    signal: tracker.trackMat(
      new THREE.MeshStandardMaterial({ color: 0xe6ff99, emissive: SIGNAL_HEX, emissiveIntensity: 1.5, roughness: 0.2 }),
    ),
    amber: tracker.trackMat(
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.18, roughness: 0.24 }),
    ),
    red: tracker.trackMat(
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.14, roughness: 0.24 }),
    ),
    faultCrate: tracker.trackMat(
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 1.25, roughness: 0.25 }),
    ),
    crate: tracker.trackMat(new THREE.MeshStandardMaterial({ color: 0x4b5668, roughness: 0.56, metalness: 0.24 })),
    crateLabel: tracker.trackMat(new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.48, metalness: 0.05 })),
    pallet: tracker.trackMat(new THREE.MeshStandardMaterial({ color: 0x343c48, roughness: 0.68, metalness: 0.2 })),
    belt: tracker.trackMat(
      new THREE.MeshStandardMaterial({ color: 0xffffff, map: beltTex, roughness: 0.72, metalness: 0.12 }),
    ),
  };

  const addBox = (parent, w, h, d, x, y, z, mat, castShadow = true) => {
    const g = tracker.trackGeo(new RoundedBoxGeometry(w, h, d, 1, Math.min(0.02, w * 0.15, h * 0.15, d * 0.15)));
    const mesh = new THREE.Mesh(g, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const addCyl = (parent, rt, rb, h, x, y, z, mat, rotX = 0, castShadow = true) => {
    const g = tracker.trackGeo(new THREE.CylinderGeometry(rt, rb, h, 20));
    const mesh = new THREE.Mesh(g, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.x = rotX;
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const heroCell = new THREE.Group();
  heroCell.name = 'hero-factory-cell';
  const BELT_Y = 1.05;

  // 1. Main Conveyor Bed (x = -2.7..+2.7) + End Stop Buffer at x = +2.64
  addBox(heroCell, 5.4, 0.16, 1.05, 0, BELT_Y - 0.08, 0, mats.darkFrame);
  addBox(heroCell, 5.28, 0.025, 0.86, 0, BELT_Y + 0.01, 0, mats.belt, false);
  addCyl(heroCell, 0.09, 0.09, 0.96, -2.68, BELT_Y - 0.05, 0, mats.steel, Math.PI / 2);
  addCyl(heroCell, 0.09, 0.09, 0.96, 2.68, BELT_Y - 0.05, 0, mats.steel, Math.PI / 2);
  addBox(heroCell, 0.06, 0.24, 0.88, 2.64, BELT_Y + 0.12, 0, mats.anodized);
  addCyl(heroCell, 0.16, 0.16, 0.38, 2.35, BELT_Y - 0.16, 0.68, mats.plcTeal, Math.PI / 2);
  // Side rails (top at BELT_Y + 0.16); -Z rail has opening at x = +1.40..+2.14 for reject chute
  addBox(heroCell, 4.1, 0.14, 0.045, -0.65, BELT_Y + 0.09, -0.51, mats.steel);
  addBox(heroCell, 0.56, 0.14, 0.045, 2.42, BELT_Y + 0.09, -0.51, mats.steel);
  addBox(heroCell, 5.4, 0.14, 0.045, 0, BELT_Y + 0.09, 0.51, mats.steel);
  for (const lx of [-2.3, 0, 2.3]) {
    for (const lz of [-0.46, 0.46]) {
      addBox(heroCell, 0.12, BELT_Y - 0.12, 0.12, lx, (BELT_Y - 0.12) * 0.5, lz, mats.anodized);
      addBox(heroCell, 0.22, 0.04, 0.22, lx, 0.02, lz, mats.darkFrame, false);
    }
    addBox(heroCell, 0.08, 0.08, 0.92, lx, 0.34, 0, mats.darkFrame);
  }

  // 2. Station 1 (x = -2.05): Stainless Dosing Silo, Enclosed Infeed Chute Shroud & Checkweigher
  addBox(heroCell, 0.14, 1.35, 0.14, -2.05, BELT_Y + 0.68, -0.52, mats.steel);
  addBox(heroCell, 0.14, 1.35, 0.14, -2.05, BELT_Y + 0.68, 0.52, mats.steel);
  addCyl(heroCell, 0.52, 0.24, 0.95, -2.05, BELT_Y + 1.18, 0, mats.steel);
  addCyl(heroCell, 0.52, 0.52, 0.72, -2.05, BELT_Y + 1.98, 0, mats.anodized);
  addCyl(heroCell, 0.11, 0.11, 5.2, -2.05, BELT_Y + 4.9, 0, mats.steel, 0, false);
  // Infeed hood/shroud at belt start (x = -2.68..-2.05) so crates glide cleanly out from inside the feeder
  addBox(heroCell, 0.64, 0.48, 0.04, -2.38, BELT_Y + 0.25, -0.44, mats.anodized);
  addBox(heroCell, 0.64, 0.48, 0.04, -2.38, BELT_Y + 0.25, 0.44, mats.anodized);
  addBox(heroCell, 0.64, 0.04, 0.92, -2.38, BELT_Y + 0.48, 0, mats.gantry);
  addBox(heroCell, 0.04, 0.48, 0.92, -2.68, BELT_Y + 0.25, 0, mats.darkFrame);
  addBox(heroCell, 0.72, 0.02, 0.76, -1.25, BELT_Y + 0.025, 0, mats.plcTeal, false);

  // 3. Station 2 (x = -0.45): Overhead Machine-Vision Portal
  addBox(heroCell, 0.12, 1.12, 0.12, -0.45, BELT_Y + 0.56, -0.54, mats.anodized);
  addBox(heroCell, 0.12, 1.12, 0.12, -0.45, BELT_Y + 0.56, 0.54, mats.anodized);
  addBox(heroCell, 0.22, 0.14, 1.24, -0.45, BELT_Y + 1.12, 0, mats.gantry);
  addBox(heroCell, 0.2, 0.16, 0.2, -0.45, BELT_Y + 0.96, 0, mats.darkFrame);
  addCyl(heroCell, 0.08, 0.08, 0.05, -0.45, BELT_Y + 0.86, 0, mats.signal, 0, false);

  // 4. Station 3 (x = +0.55): Heavy Sealing Press Gantry + Andon Stack Light
  addBox(heroCell, 0.2, 1.48, 0.18, 0.55, BELT_Y + 0.74, -0.56, mats.gantry);
  addBox(heroCell, 0.2, 1.48, 0.18, 0.55, BELT_Y + 0.74, 0.56, mats.gantry);
  addBox(heroCell, 0.34, 0.22, 1.38, 0.55, BELT_Y + 1.48, 0, mats.gantry);
  addBox(heroCell, 0.04, 0.04, 1.18, 0.38, BELT_Y + 1.48, 0, mats.signal, false);
  addCyl(heroCell, 0.12, 0.12, 0.44, 0.55, BELT_Y + 1.24, 0, mats.anodized);
  addCyl(heroCell, 0.03, 0.03, 0.26, 0.55, BELT_Y + 1.72, -0.52, mats.steel);
  addCyl(heroCell, 0.068, 0.068, 0.1, 0.55, BELT_Y + 1.9, -0.52, mats.signal, 0, false);
  addCyl(heroCell, 0.068, 0.068, 0.1, 0.55, BELT_Y + 2.02, -0.52, mats.amber, 0, false);
  addCyl(heroCell, 0.068, 0.068, 0.1, 0.55, BELT_Y + 2.14, -0.52, mats.red, 0, false);

  const sealerHead = new THREE.Group();
  sealerHead.position.set(0.55, BELT_Y + 0.88, 0);
  const sPiston = new THREE.Mesh(tracker.trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.58, 16)), mats.steel);
  sPiston.position.y = 0.26;
  const sDie = new THREE.Mesh(tracker.trackGeo(new RoundedBoxGeometry(0.46, 0.12, 0.44, 1, 0.02)), mats.plcTeal);
  sDie.position.y = -0.06;
  sDie.castShadow = true;
  sealerHead.add(sPiston, sDie);
  heroCell.add(sealerHead);

  // 5. Station 4: Pneumatic Reject Pusher + Reject Bin + Outfeed Pallet Roller Conveyor + 6-Axis IK Arm
  addBox(heroCell, 0.34, 0.22, 0.38, 1.65, BELT_Y + 0.16, 0.72, mats.plcTeal);
  const rejChute = addBox(heroCell, 0.76, 0.06, 0.82, 1.65, BELT_Y - 0.14, -0.92, mats.darkFrame);
  rejChute.rotation.x = -0.35;
  addBox(heroCell, 1.08, 0.08, 1.02, 1.65, 0.04, -1.78, mats.darkFrame);
  addBox(heroCell, 1.08, 0.56, 0.06, 1.65, 0.32, -2.26, mats.red);
  addBox(heroCell, 0.06, 0.56, 1.02, 1.14, 0.32, -1.78, mats.anodized);
  addBox(heroCell, 0.06, 0.56, 1.02, 2.16, 0.32, -1.78, mats.anodized);
  addBox(heroCell, 1.08, 0.34, 0.06, 1.65, 0.21, -1.3, mats.anodized);

  const pusherHead = new THREE.Group();
  pusherHead.position.set(1.65, BELT_Y + 0.22, 0.52);
  const pRod = new THREE.Mesh(tracker.trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.58, 12)), mats.steel);
  pRod.rotation.x = Math.PI / 2;
  pRod.position.z = 0.26;
  const pPlate = new THREE.Mesh(tracker.trackGeo(new RoundedBoxGeometry(0.42, 0.28, 0.05, 1, 0.01)), mats.signal);
  pPlate.position.z = -0.04;
  pusherHead.add(pRod, pPlate);
  heroCell.add(pusherHead);

  // Outfeed Heavy Roller Bed under Palletizing Station + Outfeed Curtain Arch (x = 5.4)
  addBox(heroCell, 3.6, 0.14, 1.65, 4.6, 0.14, 0.0, mats.darkFrame);
  for (let rx = 3.0; rx <= 6.2; rx += 0.35) {
    addCyl(heroCell, 0.045, 0.045, 1.5, rx, 0.23, 0.0, mats.steel, Math.PI / 2, false);
  }
  // Outfeed portal arch at x = 5.85 so exiting pallets pass cleanly through an industrial wrapper gate
  addBox(heroCell, 0.16, 1.75, 0.16, 5.85, 0.9, -0.84, mats.gantry);
  addBox(heroCell, 0.16, 1.75, 0.16, 5.85, 0.9, 0.84, mats.gantry);
  addBox(heroCell, 0.22, 0.16, 1.84, 5.85, 1.78, 0, mats.gantry);

  // Active Euro-Pallet Shuttle Group
  const PALLET_BASE_X = 3.85;
  const PALLET_BASE_Z = 0.0;
  const palletShuttle = new THREE.Group();
  palletShuttle.position.set(PALLET_BASE_X, 0.28, PALLET_BASE_Z);
  addBox(palletShuttle, 1.38, 0.14, 1.44, 0, 0.07, 0, mats.pallet);
  heroCell.add(palletShuttle);

  const PALLET_SLOTS = [
    { x: -0.32, y: 0.31, z: -0.3 },
    { x: 0.32, y: 0.31, z: -0.3 },
    { x: -0.32, y: 0.31, z: 0.3 },
    { x: 0.32, y: 0.31, z: 0.3 },
    { x: -0.32, y: 0.66, z: -0.3 },
    { x: 0.32, y: 0.66, z: -0.3 },
    { x: -0.32, y: 0.66, z: 0.3 },
    { x: 0.32, y: 0.66, z: 0.3 },
  ];

  // Shared Crate Factory (supports optional fault indicator strip for defective boxes)
  const pkgGeo = tracker.trackGeo(new RoundedBoxGeometry(0.48, 0.34, 0.42, 1, 0.025));
  const lblGeo = tracker.trackGeo(new THREE.BoxGeometry(0.28, 0.012, 0.24));
  const stripeGeo = tracker.trackGeo(new THREE.BoxGeometry(0.49, 0.036, 0.04));
  const faultTagGeo = tracker.trackGeo(new THREE.BoxGeometry(0.49, 0.055, 0.43));
  const makeCrate = () => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(pkgGeo, mats.crate);
    body.castShadow = true;
    body.receiveShadow = true;
    const lbl = new THREE.Mesh(lblGeo, mats.crateLabel);
    lbl.position.y = 0.175;
    const stripe = new THREE.Mesh(stripeGeo, mats.signal);
    stripe.position.set(0, 0.05, 0.2);
    const faultTag = new THREE.Mesh(faultTagGeo, mats.faultCrate);
    faultTag.position.y = 0.04;
    faultTag.visible = false;
    g.add(body, lbl, stripe, faultTag);
    g.userData.faultTag = faultTag;
    g.userData.stripe = stripe;
    return g;
  };

  const stackedCrates = PALLET_SLOTS.map((slot, idx) => {
    const c = makeCrate();
    c.position.set(slot.x, slot.y, slot.z);
    c.visible = idx < 4;
    palletShuttle.add(c);
    return c;
  });

  // Hero 6-Axis Industrial Palletizing Arm
  const ARM_X = 2.95;
  const ARM_Z = 1.48;
  const heroArm = buildRoboticArm(tracker, mats, 1.0);
  heroArm.root.position.set(ARM_X, 0, ARM_Z);
  heroCell.add(heroArm.root);

  const carriedCrate = makeCrate();
  carriedCrate.visible = false;
  heroArm.carryAnchor.add(carriedCrate);

  // Continuous Crate Pool (zero teleportation — crates circulate cleanly from dosing hood -> belt -> arm or reject bin)
  const cratePool = Array.from({ length: 6 }, () => {
    const mesh = makeCrate();
    mesh.visible = false;
    heroCell.add(mesh);
    return {
      mesh,
      state: 'idle', // 'idle' | 'belt' | 'waiting_pick' | 'diverting' | 'falling' | 'binned'
      x: -2.42,
      y: BELT_Y + 0.1925,
      z: 0,
      rx: 0,
      ry: 0,
      targetYaw: 0,
      targetZ: 0,
      defective: false,
      divertT: 0,
      fallT: 0,
      binSlot: -1,
      binSink: 0,
    };
  });

  // 6. Full-Height NEMA 12 Industrial PLC S7-1200 & MCC Control Cabinet
  const plcCab = new THREE.Group();
  plcCab.position.set(-1.15, 0, -1.65);
  addBox(plcCab, 1.32, 0.12, 0.72, 0, 0.06, 0, mats.darkFrame);
  addBox(plcCab, 1.24, 2.02, 0.64, 0, 1.13, 0, mats.cabinet);
  addBox(plcCab, 1.12, 1.84, 0.04, 0, 1.14, 0.33, mats.anodized);
  addBox(plcCab, 0.62, 0.42, 0.04, 0.16, 1.48, 0.36, mats.darkFrame);
  addBox(plcCab, 0.54, 0.34, 0.02, 0.16, 1.48, 0.385, mats.hmi, false);
  addBox(plcCab, 0.34, 0.42, 0.03, -0.34, 1.48, 0.36, mats.darkFrame);
  addBox(plcCab, 0.28, 0.05, 0.02, -0.34, 1.6, 0.38, mats.plcTeal, false);
  addCyl(plcCab, 0.024, 0.024, 0.02, -0.24, 1.5, 0.38, mats.signal, Math.PI / 2, false);
  addCyl(plcCab, 0.045, 0.045, 0.05, -0.34, 1.08, 0.37, mats.red, Math.PI / 2);
  addBox(plcCab, 0.16, 0.95, 0.18, 0.42, 2.55, 0, mats.anodized, false);
  addBox(plcCab, 1.85, 0.12, 0.24, 1.25, 2.98, 0.72, mats.anodized, false);
  heroCell.add(plcCab);

  // 7. Optical Photoelectric Sensors PE-01 / PE-02 / PE-03 — Physically Anchored to Side Rails
  // All 3 sit on the conveyor side rails (z = ±0.51, top at BELT_Y + 0.16) using bolted base flanges,
  // vertical steel stanchions, and L-bracket clamps (zero floating housings or misaligned beams!).
  const SENSOR_Y = BELT_Y + 0.2;
  const Z_EMIT_LENS = -0.455; // exact front face of emitter barrel (centered at z=-0.50, length 0.09)
  const Z_RECV_FACE = 0.475; // exact front face of receiver block (centered at z=+0.50, depth 0.05)
  const FULL_BEAM_LEN = Z_RECV_FACE - Z_EMIT_LENS; // 0.93 m clean air gap
  const sensorXs = [-1.25, 0.36, 1.34];
  const sensorBeams = [];

  // Unit cylinder along +Z starting at z=0 so beam.position.z = Z_EMIT_LENS anchors origin on lens face
  const beamUnitGeo = new THREE.CylinderGeometry(0.0085, 0.0085, 1.0, 10);
  beamUnitGeo.rotateX(Math.PI / 2);
  beamUnitGeo.translate(0, 0, 0.5);
  tracker.trackGeo(beamUnitGeo);

  const impactGeo = tracker.trackGeo(new THREE.SphereGeometry(0.022, 10, 10));
  const lensGeo = tracker.trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.008, 12));
  lensGeo.rotateX(Math.PI / 2);

  for (const sx of sensorXs) {
    // Physical rail mounts on both -Z and +Z side rails (rail top is BELT_Y + 0.16)
    for (const railZ of [-0.51, 0.51]) {
      addBox(heroCell, 0.068, 0.02, 0.068, sx, BELT_Y + 0.158, railZ, mats.darkFrame, false); // bolted flange into rail
      addBox(heroCell, 0.032, 0.088, 0.032, sx, BELT_Y + 0.19, railZ, mats.steel, false); // vertical post
      addBox(heroCell, 0.056, 0.04, 0.064, sx, SENSOR_Y, railZ, mats.anodized, false); // clamp collar
    }

    // Emitter barrel (z = -0.50, len = 0.09 -> lens face at z = -0.455)
    addCyl(heroCell, 0.028, 0.028, 0.09, sx, SENSOR_Y, -0.5, mats.anodized, Math.PI / 2, false);
    // Receiver block (z = +0.50, depth = 0.05 -> front face at z = +0.475)
    addBox(heroCell, 0.05, 0.056, 0.05, sx, SENSOR_Y, 0.5, mats.steel, false);

    const lensMat = tracker.trackMat(
      new THREE.MeshBasicMaterial({ color: SIGNAL_HEX }),
    );
    const emitLens = new THREE.Mesh(lensGeo, lensMat);
    emitLens.position.set(sx, SENSOR_Y, Z_EMIT_LENS + 0.001);
    const recvEye = new THREE.Mesh(lensGeo, lensMat);
    recvEye.position.set(sx, SENSOR_Y, Z_RECV_FACE - 0.001);
    heroCell.add(emitLens, recvEye);

    const bMat = tracker.trackMat(
      new THREE.MeshBasicMaterial({
        color: SIGNAL_HEX,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const beam = new THREE.Mesh(beamUnitGeo, bMat);
    beam.position.set(sx, SENSOR_Y, Z_EMIT_LENS);
    beam.scale.set(1, 1, FULL_BEAM_LEN);
    heroCell.add(beam);

    const impactMat = tracker.trackMat(
      new THREE.MeshBasicMaterial({
        color: SIGNAL_HEX,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const impactDot = new THREE.Mesh(impactGeo, impactMat);
    impactDot.position.set(sx, SENSOR_Y, Z_EMIT_LENS + FULL_BEAM_LEN);
    impactDot.visible = false;
    heroCell.add(impactDot);

    sensorBeams.push({
      x: sx,
      mesh: beam,
      mat: bMat,
      lensMat,
      impactDot,
      impactMat,
      currLen: FULL_BEAM_LEN,
      currOpacity: 0.28,
      currRad: 1.0,
      hitMix: 0,
      faultMix: 0,
    });
  }

  scene.add(heroCell);

  // 2 CALM, WIDE-SPACED PARALLEL ASSEMBLY LINES (z = -9.5 m & z = +9.5 m)
  const sidePackages = [];
  for (const lz of [-9.5, 9.5]) {
    const line = new THREE.Group();
    line.position.set(0, 0, lz);
    addBox(line, 18.0, 0.16, 0.96, 0, BELT_Y - 0.08, 0, mats.darkFrame, false);
    addBox(line, 17.8, 0.02, 0.8, 0, BELT_Y + 0.01, 0, mats.belt, false);
    addBox(line, 18.0, 0.12, 0.04, 0, BELT_Y + 0.08, -0.46, mats.steel, false);
    addBox(line, 18.0, 0.12, 0.04, 0, BELT_Y + 0.08, 0.46, mats.steel, false);
    for (let lx = -8; lx <= 8; lx += 4) {
      addBox(line, 0.12, BELT_Y - 0.12, 0.12, lx, (BELT_Y - 0.12) * 0.5, -0.42, mats.anodized, false);
      addBox(line, 0.12, BELT_Y - 0.12, 0.12, lx, (BELT_Y - 0.12) * 0.5, 0.42, mats.anodized, false);
    }
    for (const gx of [-4.5, 3.2]) {
      addBox(line, 0.22, 1.48, 0.18, gx, BELT_Y + 0.74, -0.52, mats.gantry, false);
      addBox(line, 0.22, 1.48, 0.18, gx, BELT_Y + 0.74, 0.52, mats.gantry, false);
      addBox(line, 0.32, 0.22, 1.28, gx, BELT_Y + 1.48, 0, mats.gantry, false);
      addBox(line, 0.05, 0.05, 1.05, gx, BELT_Y + 1.48, 0, mats.signal, false);
    }
    addBox(line, 1.15, 1.95, 0.58, -6.5, 0.975, lz < 0 ? -1.35 : 1.35, mats.cabinet, false);
    const arm = buildRoboticArm(tracker, mats, 0.92);
    arm.root.position.set(5.6, 0, lz < 0 ? -1.35 : 1.35);
    solveArmIK(arm, 0, 0, 0.9, 1.35, lz < 0 ? 1.0 : -1.0);
    line.add(arm.root);

    for (let p = 0; p < 4; p++) {
      const box = new THREE.Mesh(pkgGeo, mats.crate);
      box.position.set(0, BELT_Y + 0.19, 0);
      line.add(box);
      sidePackages.push({ mesh: box, phase: p / 4 + (lz < 0 ? 0.08 : 0.3), dir: lz < 0 ? 1 : -1 });
    }
    scene.add(line);
  }

  return {
    heroCell,
    sealerHead,
    pusherHead,
    sensorBeams,
    Z_EMIT_LENS,
    FULL_BEAM_LEN,
    heroArm,
    ARM_X,
    ARM_Z,
    PALLET_BASE_X,
    PALLET_BASE_Z,
    PALLET_SLOTS,
    palletShuttle,
    stackedCrates,
    carriedCrate,
    cratePool,
    sidePackages,
    mats,
    BELT_Y,
  };
}

/**
 * Mounts the full-scale Giga-Factory Campus & Continuous Pick-and-Place Cell inside `container`.
 */
export function createIndustrialWorld(container, { reducedMotion = () => false, onTelemetry = null } = {}) {
  const tracker = createResourceTracker();
  const isSmall = window.innerWidth <= 860;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, FILM_PIXEL_RATIO));
  renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.24;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FOG_COLOR);
  scene.fog = new THREE.FogExp2(FOG_COLOR, 0.0135);

  const { envTarget, liveSky } = buildFactorySkyAndPmrem(scene, renderer, isSmall);
  scene.environment = envTarget.texture;

  const camera = new THREE.PerspectiveCamera(
    39,
    (container.clientWidth || window.innerWidth) / Math.max(1, container.clientHeight || window.innerHeight),
    0.1,
    3000,
  );

  const hemi = new THREE.HemisphereLight(0xc2d8f2, 0x263144, 1.15);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(0xf4f8ff, 2.55);
  keyLight.position.set(8.5, 13.5, 9.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(isSmall ? 1024 : 2048, isSmall ? 1024 : 2048);
  keyLight.shadow.camera.near = 2;
  keyLight.shadow.camera.far = 42;
  keyLight.shadow.camera.left = -10;
  keyLight.shadow.camera.right = 10;
  keyLight.shadow.camera.top = 8;
  keyLight.shadow.camera.bottom = -8;
  keyLight.shadow.bias = -0.0004;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x8cb8ec, 0.95);
  rimLight.position.set(-10.5, 7.2, -9.0);
  scene.add(rimLight);

  const maxAniso = renderer.capabilities.getMaxAnisotropy?.() || 4;
  const textures = createTextureSet(renderer, tracker);
  const beltTex = createBeltTexture(tracker, maxAniso);
  const hmiTex = createHmiTexture(tracker);

  const campus = buildGigaFactoryCampus(scene, tracker, textures);
  const cell = buildHeroCellAndLines(scene, tracker, beltTex, hmiTex);

  const SPAWN_X = -2.42;
  const PICK_X = 2.35;
  const PUSHER_X = 1.65;
  const SPAWN_SPACING_X = 1.65;
  const REJECT_SLOTS = [
    { x: 1.48, z: -1.62 },
    { x: 1.82, z: -1.62 },
    { x: 1.48, z: -1.96 },
    { x: 1.82, z: -1.96 },
  ];

  const state = {
    disposed: false,
    paused: false,
    simT: 0,
    spawnCount: 0,
    pendingManualFaults: 0,
    faultCooldownS: 0,
    stackCount: 4, // start with 4 boxes neatly stacked on pallet (slots 0..3)
    palletSwapT: 0,
    armState: 'idle', // 'idle' | 'descend' | 'carry' | 'release' | 'return'
    armTimer: 0,
    armTargetSlot: 4,
    armStartPos: [PICK_X, cell.BELT_Y + 0.76, 0],
    smoothBoxScale: [1.0, 1.0, 1.0],
    smoothCycleS: 4.4,
    smoothSpeed: 1.0,
    smoothPress: 0,
    smoothPush: 0,
    nextRejectSlot: 0,
    chapter: 'hero',
    stationIdx: 0,
    controlMode: 'sync',
    recipeKey: '500g',
    goalShot: { ...INDUSTRIAL_SHOTS.hero },
    currShot: { ...INDUSTRIAL_SHOTS.hero },
    userOrbit: { az: 0, el: 0, dragging: false, reset: false },
    ringOpacity: 0,
    lastTelemetryMs: 0,
  };

  // Pre-seed 2 healthy crates on belt so Frame 0 looks alive immediately (even with reducedMotion)
  const seedBeltCrates = () => {
    const beltY = cell.BELT_Y + 0.0225 + 0.17;
    const c0 = cell.cratePool[0];
    c0.state = 'belt';
    c0.x = 0.85;
    c0.y = beltY;
    c0.z = 0;
    c0.mesh.position.set(c0.x, c0.y, 0);
    c0.mesh.visible = true;

    const c1 = cell.cratePool[1];
    c1.state = 'belt';
    c1.x = -1.2;
    c1.y = beltY;
    c1.z = 0;
    c1.mesh.position.set(c1.x, c1.y, 0);
    c1.mesh.visible = true;
    state.spawnCount = 2;
  };
  seedBeltCrates();

  solveArmIK(cell.heroArm, cell.ARM_X, cell.ARM_Z, PICK_X, cell.BELT_Y + 0.76, 0.0);

  function resize() {
    if (state.disposed) return;
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, FILM_PIXEL_RATIO));
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  ro?.observe(container);

  const onVisibility = () => {
    state.paused = document.hidden;
  };
  document.addEventListener('visibilitychange', onVisibility);

  let rafId = 0;
  let prevMs = performance.now();

  const applyFaultVisuals = (crate) => {
    const ft = crate.mesh.userData.faultTag;
    const st = crate.mesh.userData.stripe;
    if (ft) ft.visible = crate.defective;
    if (st) st.visible = !crate.defective;
  };

  function updateSimulation(dt) {
    const recipe = RECIPES[state.recipeKey] ?? RECIPES['500g'];
    const isSlip = state.controlMode === 'slip';
    const rm = reducedMotion();

    // Smooth recipe & speed interpolation (never snaps on 250g/500g/1kg switch!)
    const rLerp = rm ? 1 : 1 - Math.exp(-dt / 0.22);
    for (let i = 0; i < 3; i++) {
      state.smoothBoxScale[i] += (recipe.boxScale[i] - state.smoothBoxScale[i]) * rLerp;
    }
    state.smoothCycleS += (recipe.cycleS - state.smoothCycleS) * rLerp;
    const targetSpeed = rm ? 0 : recipe.speed * (isSlip ? 0.86 : 1.0);
    state.smoothSpeed += (targetSpeed - state.smoothSpeed) * rLerp;

    const stepDt = rm ? 0 : dt * state.smoothSpeed;
    state.simT += stepDt;
    if (state.faultCooldownS > 0) state.faultCooldownS = Math.max(0, state.faultCooldownS - dt);

    const [sx, sy, sz] = state.smoothBoxScale;
    const beltTopY = cell.BELT_Y + 0.0225 + 0.17 * sy;
    const crateTopWorldY = cell.BELT_Y + 0.0225 + 0.34 * sy;
    cell.heroArm.carryAnchor.position.y = ARM_WRIST_DROP + 0.17 * sy;

    // Gentle belt texture scroll matching crate travel speed
    const BELT_SPEED = 0.96; // m/s at 1.0x recipe speed
    beltTex.offset.x = -(state.simT * (BELT_SPEED * 0.34)) % 1;

    // 1. Handle full 8-box Euro-pallet outfeed glide & fresh pallet side-feed (zero teleport!)
    if (state.palletSwapT > 0) {
      state.palletSwapT = Math.max(0, state.palletSwapT - stepDt);
      const u = 1 - state.palletSwapT / 2.4;
      if (u < 0.55) {
        const s = quintic(u / 0.55);
        cell.palletShuttle.position.set(cell.PALLET_BASE_X + s * 2.55, 0.28, 0);
        // Scale down gently right as it clears the outfeed arch at x=5.85..6.4
        const fade = u > 0.44 ? 1 - (u - 0.44) / 0.11 : 1;
        cell.palletShuttle.scale.setScalar(Math.max(0.001, fade));
      } else {
        if (state.stackCount >= 8) {
          state.stackCount = 0;
          cell.stackedCrates.forEach((c) => {
            c.visible = false;
          });
        }
        const s = quintic((u - 0.55) / 0.45);
        cell.palletShuttle.scale.setScalar(1);
        // Fresh empty pallet slides cleanly in from staging side (z = -1.35 -> 0)
        cell.palletShuttle.position.set(cell.PALLET_BASE_X, 0.28, -1.35 * (1 - s));
      }
    } else {
      cell.palletShuttle.scale.setScalar(1);
      cell.palletShuttle.position.set(cell.PALLET_BASE_X, 0.28, 0);
    }

    // 2. Continuous Crate Spawner inside Dosing Hood (x = SPAWN_X)
    if (!rm) {
      let minXOnBelt = Infinity;
      for (const c of cell.cratePool) {
        if (c.state === 'belt' || c.state === 'waiting_pick') {
          if (c.x < minXOnBelt) minXOnBelt = c.x;
        }
      }
      if (minXOnBelt > SPAWN_X + SPAWN_SPACING_X) {
        const idle = cell.cratePool.find((c) => c.state === 'idle');
        if (idle) {
          const isFault = state.pendingManualFaults > 0 || (isSlip && state.spawnCount % 3 === 1);
          if (state.pendingManualFaults > 0) state.pendingManualFaults--;
          state.spawnCount++;
          idle.state = 'belt';
          idle.x = SPAWN_X;
          idle.y = beltTopY;
          idle.z = isFault ? 0.045 : 0;
          idle.rx = 0;
          idle.ry = isFault ? 0.11 : 0;
          idle.targetYaw = idle.ry;
          idle.targetZ = idle.z;
          idle.defective = isFault;
          idle.divertT = 0;
          idle.fallT = 0;
          idle.binSlot = -1;
          idle.binSink = 0;
          applyFaultVisuals(idle);
          idle.mesh.visible = true;
        }
      }
    }

    // 3. Advance Crates on Conveyor, Diverting Chute & Reject Bin
    // Sort belt crates downstream-first so zone accumulation never overlaps
    const beltOrdered = cell.cratePool
      .filter((c) => c.state === 'belt' || c.state === 'waiting_pick')
      .sort((a, b) => b.x - a.x);

    const pickOccupied = beltOrdered.some((c) => c.state === 'waiting_pick');
    let frontLimitX = PICK_X;

    for (const c of beltOrdered) {
      if (c.state === 'waiting_pick') {
        c.x = PICK_X;
        c.y = beltTopY;
        c.z = 0;
        frontLimitX = Math.min(frontLimitX, c.x - 0.68);
        continue;
      }

      // Zone-accumulation safe stop upstream of diverter if pick buffer is occupied
      const effectiveLimit = pickOccupied ? Math.min(frontLimitX, 1.18) : PICK_X;
      const slipDrift = isSlip && c.defective ? Math.sin(state.simT * 9 + c.x * 2) * 0.12 : 0;
      const nextX = Math.min(effectiveLimit, c.x + (BELT_SPEED + slipDrift) * stepDt);
      c.x = nextX;
      c.y = beltTopY;

      // Smooth yaw/lateral drift if marked defective mid-belt
      const dLerp = rm ? 1 : 1 - Math.exp(-dt / 0.12);
      c.z += (c.targetZ - c.z) * dLerp;
      c.ry += (c.targetYaw - c.ry) * dLerp;

      if (c.defective && c.x >= PUSHER_X) {
        c.state = 'diverting';
        c.x = PUSHER_X;
        c.divertT = 0;
        state.faultCooldownS = 1.6;
      } else if (!c.defective && c.x >= PICK_X - 0.004 && !pickOccupied) {
        c.x = PICK_X;
        c.state = 'waiting_pick';
      }

      frontLimitX = Math.min(frontLimitX, c.x - 0.68);
    }

    let rawPush = 0;
    for (const c of cell.cratePool) {
      if (c.state === 'diverting') {
        c.divertT += stepDt / 0.48;
        const p = quintic(Math.min(1, c.divertT));
        rawPush = Math.max(rawPush, Math.sin(p * Math.PI));
        c.x = PUSHER_X;
        c.z = c.targetZ - p * 1.05;
        c.y = beltTopY - Math.max(0, (p - 0.35) / 0.65) * 0.32;
        c.rx = -p * 0.32;
        if (c.divertT >= 1) {
          c.state = 'falling';
          c.fallT = 0;
          // Evict oldest binned crate gracefully inside the walled reject bin if slot is taken
          const slotIdx = state.nextRejectSlot % REJECT_SLOTS.length;
          state.nextRejectSlot++;
          for (const prev of cell.cratePool) {
            if (prev.state === 'binned' && prev.binSlot === slotIdx) {
              prev.binSink = 0.001; // start smooth sink inside walled bin
            }
          }
          c.binSlot = slotIdx;
        }
      } else if (c.state === 'falling') {
        c.fallT += stepDt / 0.38;
        const gT = Math.min(1, c.fallT);
        const slot = REJECT_SLOTS[c.binSlot] ?? REJECT_SLOTS[0];
        c.x = PUSHER_X + (slot.x - PUSHER_X) * gT;
        c.z = -1.05 + (slot.z - -1.05) * gT;
        c.y = Math.max(0.24, beltTopY - 0.32 - 0.5 * 9.8 * (gT * 0.34) * (gT * 0.34));
        c.rx = -0.32 * (1 - gT);
        c.ry *= 1 - gT * 0.5;
        if (c.fallT >= 1) {
          c.state = 'binned';
          c.x = slot.x;
          c.y = 0.24;
          c.z = slot.z;
          c.rx = 0;
        }
      } else if (c.state === 'binned' && c.binSink > 0) {
        c.binSink += dt / 0.35;
        const s = Math.min(1, c.binSink);
        c.y = 0.24 - s * 0.22;
        if (s >= 1) {
          c.state = 'idle';
          c.binSink = 0;
          c.defective = false;
          c.mesh.visible = false;
        }
      }

      if (c.state !== 'idle') {
        const sinkScale = c.state === 'binned' && c.binSink > 0 ? Math.max(0.01, 1 - c.binSink) : 1;
        c.mesh.scale.set(sx * sinkScale, sy * sinkScale, sz * sinkScale);
        c.mesh.position.set(c.x, c.y, c.z);
        c.mesh.rotation.set(c.rx, c.ry, 0);
      }
    }

    // 4. Continuous 6-Axis Arm Pick-and-Place State Machine
    let armTargetX = PICK_X;
    let armTargetY = beltTopY + 0.56;
    let armTargetZ = 0.0;
    const hoverPickY = beltTopY + 0.56;

    const activeSlot = cell.PALLET_SLOTS[Math.min(7, state.armTargetSlot)];
    const placeX = cell.PALLET_BASE_X + activeSlot.x;
    const placeZ = cell.PALLET_BASE_Z + activeSlot.z;
    // Adapt pallet crate vertical stack cleanly to smooth recipe scale
    const layer = state.armTargetSlot >= 4 ? 1 : 0;
    const slotCenterY = 0.14 + 0.17 * sy + layer * (0.34 * sy + 0.01);
    const placeTopWorldY = 0.28 + slotCenterY + 0.17 * sy;

    if (state.armState === 'idle') {
      const readyCrate = cell.cratePool.find((c) => c.state === 'waiting_pick');
      if (readyCrate && state.palletSwapT <= 0 && !rm) {
        state.armState = 'descend';
        state.armTimer = 0;
        state.armTargetSlot = Math.min(7, state.stackCount);
      }
    } else if (state.armState === 'descend') {
      state.armTimer += stepDt / 0.38;
      const p = quintic(Math.min(1, state.armTimer));
      armTargetX = PICK_X;
      armTargetY = hoverPickY + (crateTopWorldY - hoverPickY) * p;
      armTargetZ = 0;
      if (state.armTimer >= 1) {
        const readyCrate = cell.cratePool.find((c) => c.state === 'waiting_pick');
        if (readyCrate) {
          readyCrate.state = 'idle';
          readyCrate.defective = false;
          readyCrate.mesh.visible = false;
        }
        cell.carriedCrate.visible = true;
        cell.carriedCrate.scale.set(sx, sy, sz);
        state.armState = 'carry';
        state.armTimer = 0;
      }
    } else if (state.armState === 'carry') {
      state.armTimer += stepDt / 0.96;
      const p = quintic(Math.min(1, state.armTimer));
      cell.carriedCrate.visible = true;
      cell.carriedCrate.scale.set(sx, sy, sz);
      const liftArch = Math.sin(p * Math.PI) * 0.62;
      armTargetX = PICK_X + (placeX - PICK_X) * p;
      armTargetY = crateTopWorldY + (placeTopWorldY - crateTopWorldY) * p + liftArch;
      armTargetZ = placeZ * p;
      if (state.armTimer >= 1) {
        cell.carriedCrate.visible = false;
        const slotMesh = cell.stackedCrates[state.armTargetSlot];
        if (slotMesh) {
          slotMesh.position.set(activeSlot.x, slotCenterY, activeSlot.z);
          slotMesh.scale.set(sx, sy, sz);
          slotMesh.visible = true;
        }
        state.stackCount++;
        if (state.stackCount >= 8) {
          state.palletSwapT = 2.4;
        }
        state.armState = 'release';
        state.armTimer = 0;
      }
    } else if (state.armState === 'release') {
      state.armTimer += stepDt / 0.28;
      const p = quintic(Math.min(1, state.armTimer));
      armTargetX = placeX;
      armTargetY = placeTopWorldY + p * 0.54;
      armTargetZ = placeZ;
      if (state.armTimer >= 1) {
        state.armState = 'return';
        state.armTimer = 0;
        state.armStartPos = [placeX, placeTopWorldY + 0.54, placeZ];
      }
    } else if (state.armState === 'return') {
      state.armTimer += stepDt / 0.78;
      const p = quintic(Math.min(1, state.armTimer));
      const [ax0, ay0, az0] = state.armStartPos;
      armTargetX = ax0 + (PICK_X - ax0) * p;
      armTargetY = ay0 + (hoverPickY - ay0) * p + Math.sin(p * Math.PI) * 0.22;
      armTargetZ = az0 * (1 - p);
      if (state.armTimer >= 1) {
        state.armState = 'idle';
        state.armTimer = 0;
      }
    }

    // Keep stacked pallet crates smoothly proportioned when recipe changes live
    for (let idx = 0; idx < cell.stackedCrates.length; idx++) {
      const sc = cell.stackedCrates[idx];
      if (!sc.visible) continue;
      const sl = cell.PALLET_SLOTS[idx];
      const lyr = idx >= 4 ? 1 : 0;
      sc.position.set(sl.x, 0.14 + 0.17 * sy + lyr * (0.34 * sy + 0.01), sl.z);
      sc.scale.set(sx, sy, sz);
    }

    solveArmIK(cell.heroArm, cell.ARM_X, cell.ARM_Z, armTargetX, armTargetY, armTargetZ);

    // 5. Optical Beams (Clamped to Crate Face + Smoothed Lerp) & Sealing Press
    let rawPress = 0;
    const triggered = [false, false, false];
    const faultOnSensor = [false, false, false];
    const targetBeamLen = [cell.FULL_BEAM_LEN, cell.FULL_BEAM_LEN, cell.FULL_BEAM_LEN];

    const halfCrateW = 0.24 * sx;
    const halfCrateD = 0.21 * sz;
    const pressCenter = isSlip ? 0.82 : 0.55;

    for (const c of cell.cratePool) {
      if (c.state !== 'belt' && c.state !== 'waiting_pick' && c.state !== 'diverting') continue;
      if (Math.abs(c.z) > 0.36) continue;

      cell.sensorBeams.forEach((sb, idx) => {
        if (Math.abs(c.x - sb.x) <= halfCrateW + 0.02) {
          triggered[idx] = true;
          if (c.defective) faultOnSensor[idx] = true;
          const crateNearZ = c.z - halfCrateD;
          const clamped = Math.max(0.06, Math.min(cell.FULL_BEAM_LEN, crateNearZ - cell.Z_EMIT_LENS));
          targetBeamLen[idx] = Math.min(targetBeamLen[idx], clamped);
        }
      });

      if (c.state === 'belt') {
        const dPress = Math.abs(c.x - pressCenter);
        if (dPress < 0.36) {
          rawPress = Math.max(rawPress, Math.cos((dPress / 0.36) * (Math.PI / 2)));
        }
      }
    }

    const actLerp = rm ? 1 : 1 - Math.exp(-dt / 0.055);
    state.smoothPress += (rawPress - state.smoothPress) * actLerp;
    state.smoothPush += (rawPush - state.smoothPush) * actLerp;

    const restSealerY = cell.BELT_Y + 0.88;
    const touchSealerY = cell.BELT_Y + 0.1425 + 0.34 * sy;
    cell.sealerHead.position.y = restSealerY + (touchSealerY - restSealerY) * state.smoothPress;
    cell.pusherHead.position.z = 0.52 - state.smoothPush * 0.96;

    const beamLerp = rm ? 1 : 1 - Math.exp(-dt / 0.045);
    cell.sensorBeams.forEach((sb, idx) => {
      const hit = triggered[idx];
      const fHit = faultOnSensor[idx];
      sb.currLen += (targetBeamLen[idx] - sb.currLen) * beamLerp;
      sb.currOpacity += ((hit ? 0.9 : 0.28) - sb.currOpacity) * beamLerp;
      sb.currRad += ((hit ? 1.72 : 1.0) - sb.currRad) * beamLerp;
      sb.hitMix += ((hit ? 1 : 0) - sb.hitMix) * beamLerp;
      sb.faultMix += ((fHit ? 1 : 0) - sb.faultMix) * beamLerp;

      sb.mesh.scale.set(sb.currRad, sb.currRad, sb.currLen);
      sb.mat.opacity = sb.currOpacity;
      sb.mat.color.copy(SIGNAL_COLOR).lerp(FAULT_COLOR, sb.faultMix);
      sb.lensMat.color.copy(SIGNAL_COLOR).lerp(FAULT_COLOR, sb.faultMix);

      sb.impactDot.visible = sb.hitMix > 0.04;
      if (sb.impactDot.visible) {
        sb.impactDot.position.z = cell.Z_EMIT_LENS + sb.currLen;
        sb.impactMat.opacity = sb.hitMix * 0.92;
        sb.impactMat.color.copy(SIGNAL_COLOR).lerp(FAULT_COLOR, sb.faultMix);
      }
    });

    const hasActiveFault =
      isSlip ||
      state.faultCooldownS > 0 ||
      cell.cratePool.some((c) => c.defective && (c.state === 'belt' || c.state === 'diverting'));

    cell.mats.signal.emissiveIntensity = isSlip ? 0.35 : 1.5 + 0.25 * Math.sin(state.simT * 3);
    cell.mats.amber.emissiveIntensity = hasActiveFault ? 1.55 + 0.45 * Math.sin(state.simT * 6) : 0.16;
    cell.mats.red.emissiveIntensity = (isSlip || hasActiveFault) && state.smoothPush > 0.12 ? 1.85 : 0.12;

    // Parallel background lines
    for (const sp of cell.sidePackages) {
      const su = (state.simT * 0.055 + sp.phase) % 1;
      sp.mesh.position.x = sp.dir > 0 ? -8.5 + su * 17.0 : 8.5 - su * 17.0;
    }

    // Station focus reticle in Chapter 1 (Plant Stations)
    const showRing = state.chapter === 'assembler';
    const targetOpacity = showRing ? 0.88 : 0;
    const rk = rm ? 1 : 1 - Math.exp(-dt / 0.2);
    state.ringOpacity += (targetOpacity - state.ringOpacity) * rk;
    campus.ringMat.uniforms.uOpacity.value = state.ringOpacity;
    campus.ringMat.uniforms.uTime.value = rm ? 0 : state.simT;
    campus.stationRing.visible = state.ringOpacity > 0.01;

    const st = STATION_AIMS[state.stationIdx] ?? STATION_AIMS[0];
    campus.stationRing.position.x += (st.ringX - campus.stationRing.position.x) * rk;
    campus.stationRing.position.z += (st.ringZ - campus.stationRing.position.z) * rk;
    campus.stationRing.scale.setScalar(st.ringR);

    const now = performance.now();
    if (onTelemetry && now - state.lastTelemetryMs > 100) {
      state.lastTelemetryMs = now;
      const singleFaultActive =
        !isSlip &&
        (state.faultCooldownS > 0 ||
          state.pendingManualFaults > 0 ||
          cell.cratePool.some((c) => c.defective && (c.state === 'belt' || c.state === 'diverting')));
      onTelemetry({
        simT: state.simT,
        cycleS: state.smoothCycleS,
        wastePct: isSlip ? 28.0 : 0.0,
        fault: isSlip,
        rejecting: singleFaultActive,
        sensors: triggered,
      });
    }
  }

  function updateCamera(dt) {
    const rm = reducedMotion();
    const k = rm ? 1 : 1 - Math.exp(-dt / 0.24);
    for (const key of Object.keys(state.currShot)) {
      state.currShot[key] += (state.goalShot[key] - state.currShot[key]) * k;
    }

    if (state.userOrbit.reset && !state.userOrbit.dragging) {
      const decay = rm ? 0 : Math.exp(-dt / 0.14);
      state.userOrbit.az *= decay;
      state.userOrbit.el *= decay;
      if (Math.abs(state.userOrbit.az) < 0.08 && Math.abs(state.userOrbit.el) < 0.08) {
        state.userOrbit.az = 0;
        state.userOrbit.el = 0;
        state.userOrbit.reset = false;
      }
    }

    const azRad = ((state.currShot.az + state.userOrbit.az) * Math.PI) / 180;
    const elRad = (Math.max(3, Math.min(44, state.currShot.el + state.userOrbit.el)) * Math.PI) / 180;

    const { dist, aimX, aimY, aimZ, shift } = state.currShot;
    const height = aimY + Math.sin(elRad) * dist;
    camera.position.set(
      aimX + Math.cos(azRad) * Math.cos(elRad) * dist,
      height,
      aimZ - Math.sin(azRad) * Math.cos(elRad) * dist,
    );
    camera.lookAt(aimX, height, aimZ);

    const filmWidth = camera.filmGauge * Math.min(camera.aspect, 1);
    camera.filmOffset = -shift * camera.aspect * 2 * Math.tan((camera.fov * Math.PI) / 360) * filmWidth;
    camera.updateProjectionMatrix();
    const m = camera.projectionMatrix.elements;
    m[9] = -m[5] * Math.tan(elRad);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }

  function frame(now) {
    if (state.disposed) return;
    rafId = requestAnimationFrame(frame);
    if (state.paused) {
      prevMs = now;
      return;
    }
    const dt = Math.min(0.05, Math.max(0.001, (now - prevMs) / 1000));
    prevMs = now;
    updateSimulation(dt);
    updateCamera(dt);
    renderer.render(scene, camera);
  }
  rafId = requestAnimationFrame(frame);

  return {
    setShotGoal(shot) {
      Object.assign(state.goalShot, shot);
    },
    getStationShot(idx) {
      const st = STATION_AIMS[idx] ?? STATION_AIMS[0];
      return {
        ...INDUSTRIAL_SHOTS.assembler,
        az: st.az,
        dist: st.dist,
        aimX: st.x,
        aimY: st.y,
        aimZ: st.z,
      };
    },
    setChapter(name) {
      if (state.chapter !== name) {
        state.chapter = name;
        state.userOrbit.reset = true;
      }
    },
    setStation(idx) {
      state.stationIdx = Math.max(0, Math.min(STATION_AIMS.length - 1, idx));
    },
    setMode(mode) {
      state.controlMode = mode === 'slip' ? 'slip' : 'sync';
    },
    setRecipe(key) {
      if (key in RECIPES) state.recipeKey = key;
    },
    injectFault() {
      // Flag the nearest healthy incoming crate upstream of PE-03 (preferring upstream of PE-02 so both beams fire)
      const candidates = cell.cratePool
        .filter((c) => c.state === 'belt' && !c.defective && c.x < 1.15)
        .sort((a, b) => b.x - a.x);
      if (candidates.length > 0) {
        const target = candidates[0];
        target.defective = true;
        target.targetYaw = 0.12;
        target.targetZ = 0.045;
        applyFaultVisuals(target);
        state.faultCooldownS = 1.6;
      } else {
        state.pendingManualFaults = Math.min(2, state.pendingManualFaults + 1);
        state.faultCooldownS = 1.6;
      }
    },
    setUserOrbitDrag(dragging) {
      state.userOrbit.dragging = dragging;
      if (dragging) state.userOrbit.reset = false;
    },
    nudgeUserOrbit(dAz, dEl) {
      state.userOrbit.az += dAz;
      state.userOrbit.el = Math.max(-8, Math.min(28, state.userOrbit.el + dEl));
    },
    resize,
    dispose() {
      if (state.disposed) return;
      state.disposed = true;
      cancelAnimationFrame(rafId);
      ro?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      liveSky.geometry.dispose();
      liveSky.material.dispose();
      tracker.disposeAll(scene);
      envTarget.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
