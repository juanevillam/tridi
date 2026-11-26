// Procedural branching street trees (tapered CatmullRom curves + outward-normal botanical
// leaf spray cards) and symmetric chamfered basalt curb planters (6 draw calls total).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function buildTaperedBranch(curve, tubularSegs, rStart, rEnd, radialSegs, flareBase = false) {
  const frames = curve.computeFrenetFrames(tubularSegs, false);
  const points = curve.getSpacedPoints(tubularSegs);
  const len = curve.getLength();

  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const b = new THREE.Vector3();
  const vertex = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let i = 0; i <= tubularSegs; i++) {
    const t = i / tubularSegs;
    p.copy(points[i]);
    n.copy(frames.normals[i]);
    b.copy(frames.binormals[i]);

    let r = rStart + (rEnd - rStart) * t;
    if (flareBase && t < 0.16) {
      const ft = 1 - t / 0.16;
      r *= 1 + 0.35 * ft * ft;
    }

    for (let j = 0; j <= radialSegs; j++) {
      const vFrac = j / radialSegs;
      const theta = vFrac * Math.PI * 2;
      const sin = Math.sin(theta);
      const cos = -Math.cos(theta);

      normal.set(
        cos * n.x + sin * b.x,
        cos * n.y + sin * b.y,
        cos * n.z + sin * b.z,
      ).normalize();

      vertex.copy(p).addScaledVector(normal, r);
      positions.push(vertex.x, vertex.y, vertex.z);
      normals.push(normal.x, normal.y, normal.z);
      uvs.push(vFrac * 2, t * len * 1.35);
    }
  }

  const stride = radialSegs + 1;
  for (let i = 0; i < tubularSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * stride + j;
      const c = (i + 1) * stride + j;
      const d = (i + 1) * stride + (j + 1);
      const bIdx = i * stride + (j + 1);
      indices.push(a, c, bIdx, bIdx, c, d);
    }
  }

  const indexed = new THREE.BufferGeometry();
  indexed.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  indexed.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  indexed.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  indexed.setIndex(indices);
  const nonIndexed = indexed.toNonIndexed();
  indexed.dispose();
  return nonIndexed;
}

function createTreeArchetype(rng, tracker, style = 0) {
  const parts = [];
  const tips = [];

  if (style === 1) {
    // Style 1: Tall sculptural columnar cypress / poplar (narrow upright silhouette)
    const trunkTop = new THREE.Vector3((rng() - 0.5) * 0.14, 3.85 + rng() * 0.45, (rng() - 0.5) * 0.14);
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.04, 0),
      new THREE.Vector3((rng() - 0.5) * 0.08, 1.4, (rng() - 0.5) * 0.08),
      new THREE.Vector3(trunkTop.x * 0.6, 2.7, trunkTop.z * 0.6),
      trunkTop,
    ]);
    parts.push(buildTaperedBranch(trunkCurve, 9, 0.125, 0.032, 7, true));

    const branchCount = 8;
    for (let i = 0; i < branchCount; i++) {
      const frac = 0.28 + (i / branchCount) * 0.68;
      const startPt = trunkCurve.getPointAt(Math.min(0.98, frac));
      const yaw = i * 2.39996 + rng() * 0.35; // golden angle spiral
      const reach = (0.48 + (1 - Math.abs(frac - 0.55)) * 0.45) * (0.85 + rng() * 0.25);
      const endPt = new THREE.Vector3(
        startPt.x + Math.cos(yaw) * reach,
        startPt.y + 0.62 + rng() * 0.35,
        startPt.z + Math.sin(yaw) * reach,
      );
      const midPt = startPt.clone().lerp(endPt, 0.5).add(new THREE.Vector3(0, 0.12, 0));
      parts.push(buildTaperedBranch(new THREE.CatmullRomCurve3([startPt, midPt, endPt]), 4, 0.032, 0.010, 5, false));
      tips.push(endPt.clone());
    }
    tips.push(trunkTop.clone().add(new THREE.Vector3(0, 0.42, 0)));
  } else if (style === 2) {
    // Style 2: Multi-stem ornamental birch / olive (3 diverging sculptural trunks)
    const stemCount = 3;
    for (let s = 0; s < stemCount; s++) {
      const baseYaw = (s / stemCount) * Math.PI * 2 + rng() * 0.5;
      const spread = 0.65 + rng() * 0.45;
      const h = 2.55 + rng() * 0.65;
      const start = new THREE.Vector3(Math.cos(baseYaw) * 0.09, 0.04, Math.sin(baseYaw) * 0.09);
      const mid = new THREE.Vector3(Math.cos(baseYaw) * spread * 0.48, h * 0.54, Math.sin(baseYaw) * spread * 0.48);
      const top = new THREE.Vector3(Math.cos(baseYaw) * spread, h, Math.sin(baseYaw) * spread);
      const stemCurve = new THREE.CatmullRomCurve3([start, mid, top]);
      parts.push(buildTaperedBranch(stemCurve, 8, 0.088, 0.034, 6, true));
      tips.push(top.clone());

      for (let b = 0; b < 3; b++) {
        const bStart = stemCurve.getPointAt(0.55 + b * 0.18);
        const bYaw = baseYaw + (b - 1) * 0.72 + (rng() - 0.5) * 0.3;
        const bReach = 0.65 + rng() * 0.45;
        const bEnd = new THREE.Vector3(
          bStart.x + Math.cos(bYaw) * bReach,
          bStart.y + 0.52 + rng() * 0.42,
          bStart.z + Math.sin(bYaw) * bReach,
        );
        parts.push(buildTaperedBranch(new THREE.CatmullRomCurve3([bStart, bStart.clone().lerp(bEnd, 0.5), bEnd]), 4, 0.034, 0.011, 5, false));
        tips.push(bEnd);
      }
    }
  } else if (style === 3) {
    // Style 3: Low sculpted Japanese maple / horizontal tiered architectural canopy
    const trunkTop = new THREE.Vector3((rng() - 0.5) * 0.32, 1.65 + rng() * 0.25, (rng() - 0.5) * 0.32);
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.04, 0),
      new THREE.Vector3((rng() - 0.5) * 0.22, 0.78, (rng() - 0.5) * 0.22),
      trunkTop,
    ]);
    parts.push(buildTaperedBranch(trunkCurve, 8, 0.155, 0.072, 7, true));

    const tierCount = 6;
    for (let i = 0; i < tierCount; i++) {
      const yaw = (i / tierCount) * Math.PI * 2 + (rng() - 0.5) * 0.4;
      const startPt = trunkCurve.getPointAt(0.65 + (i % 2) * 0.3);
      const reach = 1.45 + rng() * 0.55;
      const endY = startPt.y + 0.55 + (i % 3) * 0.28;
      const midPt = new THREE.Vector3(
        startPt.x + Math.cos(yaw) * reach * 0.55,
        startPt.y + (endY - startPt.y) * 0.4,
        startPt.z + Math.sin(yaw) * reach * 0.55,
      );
      const endPt = new THREE.Vector3(startPt.x + Math.cos(yaw) * reach, endY, startPt.z + Math.sin(yaw) * reach);
      parts.push(buildTaperedBranch(new THREE.CatmullRomCurve3([startPt, midPt, endPt]), 5, 0.052, 0.016, 6, false));
      tips.push(endPt.clone());
      tips.push(midPt.clone().add(new THREE.Vector3(0, 0.24, 0)));
    }
  } else {
    // Style 0: Classic architectural spreading canopy (tapered trunk + 5 primary limbs)
    const trunkTop = new THREE.Vector3((rng() - 0.5) * 0.28, 2.35 + rng() * 0.3, (rng() - 0.5) * 0.28);
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.04, 0),
      new THREE.Vector3((rng() - 0.5) * 0.14, 0.95, (rng() - 0.5) * 0.14),
      new THREE.Vector3(trunkTop.x * 0.65, 1.75, trunkTop.z * 0.65),
      trunkTop,
    ]);
    parts.push(buildTaperedBranch(trunkCurve, 9, 0.145, 0.068, 7, true));

    const primaryCount = 5;
    for (let i = 0; i < primaryCount; i++) {
      const yaw = (i / primaryCount) * Math.PI * 2 + (rng() - 0.5) * 0.45;
      const startH = 1.65 + (i / primaryCount) * 0.72;
      const startPt = trunkCurve.getPointAt(Math.min(1, startH / 2.5));
      const reach = 1.15 + rng() * 0.55;
      const endY = startPt.y + 1.15 + rng() * 0.85;
      const midPt = new THREE.Vector3(
        startPt.x + Math.cos(yaw) * reach * 0.52,
        startPt.y + (endY - startPt.y) * 0.58,
        startPt.z + Math.sin(yaw) * reach * 0.52,
      );
      const endPt = new THREE.Vector3(
        startPt.x + Math.cos(yaw) * reach,
        endY,
        startPt.z + Math.sin(yaw) * reach,
      );
      const limbCurve = new THREE.CatmullRomCurve3([startPt, midPt, endPt]);
      parts.push(buildTaperedBranch(limbCurve, 6, 0.056, 0.022, 6, false));
      tips.push(endPt.clone());

      const subCount = 2 + (i % 2);
      for (let s = 0; s < subCount; s++) {
        const frac = 0.45 + 0.35 * (s / subCount);
        const subStart = limbCurve.getPointAt(frac);
        const subYaw = yaw + (s % 2 === 0 ? 1 : -1) * (0.45 + rng() * 0.45);
        const subReach = 0.55 + rng() * 0.42;
        const subEnd = new THREE.Vector3(
          subStart.x + Math.cos(subYaw) * subReach,
          subStart.y + 0.45 + rng() * 0.55,
          subStart.z + Math.sin(subYaw) * subReach,
        );
        const subMid = subStart.clone().lerp(subEnd, 0.5).add(new THREE.Vector3(0, 0.14, 0));
        const subCurve = new THREE.CatmullRomCurve3([subStart, subMid, subEnd]);
        parts.push(buildTaperedBranch(subCurve, 4, 0.024, 0.008, 5, false));
        tips.push(subEnd.clone());
      }
    }

    const crownEnd = new THREE.Vector3((rng() - 0.5) * 0.3, trunkTop.y + 1.85, (rng() - 0.5) * 0.3);
    const crownCurve = new THREE.CatmullRomCurve3([
      trunkTop,
      trunkTop.clone().lerp(crownEnd, 0.5).add(new THREE.Vector3((rng() - 0.5) * 0.2, 0.1, (rng() - 0.5) * 0.2)),
      crownEnd,
    ]);
    parts.push(buildTaperedBranch(crownCurve, 5, 0.055, 0.014, 5, false));
    tips.push(crownEnd);
  }

  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  return {
    geometry: tracker.trackGeo(merged),
    tips,
  };
}

function createLeafClusterGeometry(tracker) {
  const planes = [];
  const angles = [0, Math.PI / 3, (2 * Math.PI) / 3];
  const center = new THREE.Vector3(0, 0.08, 0);

  for (let k = 0; k < angles.length; k++) {
    const raw = new THREE.PlaneGeometry(0.92, 0.92, 2, 2);
    const g = raw.toNonIndexed();
    raw.dispose();

    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      const cup = -0.14 * (px * px + py * py);
      pos.setZ(i, cup);
    }
    g.rotateX(k === 1 ? 0.24 : -0.18);
    g.rotateY(angles[k]);
    planes.push(g);
  }

  const merged = mergeGeometries(planes, false);
  for (const g of planes) g.dispose();

  const pos = merged.attributes.position;
  const norm = merged.attributes.normal;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).sub(center).normalize();
    if (v.lengthSq() < 0.001) v.set(0, 1, 0);
    norm.setXYZ(i, v.x, v.y, v.z);
  }

  return tracker.trackGeo(merged);
}

export function buildFoliageAndPlanters(world, textures, rng, isSmallScreen, isClear, tracker) {
  // Symmetric curb offsets: 0.85 m behind NEAR_CURB_Z (-2.4 -> -1.55) and FAR_CURB_Z (-9.8 -> -10.65),
  // staggered cleanly away from streetlamp plinths and STAGE_CLEAR.
  const candidates = [
    // Near curb trees (z = -1.55)
    { x: -46.0, z: -1.55 },
    { x: -33.0, z: -1.55 },
    { x: -20.0, z: -1.55 },
    { x: -12.0, z: -1.55 },
    { x: 17.9, z: -1.55 },
    { x: 30.0, z: -1.55 },
    { x: 43.0, z: -1.55 },
    { x: 56.0, z: -1.55 },
    // Far curb trees (z = -10.65)
    { x: -49.0, z: -10.65 },
    { x: -35.0, z: -10.65 },
    { x: -20.0, z: -10.65 },
    { x: -7.0, z: -10.65 },
    { x: 7.0, z: -10.65 },
    { x: 21.0, z: -10.65 },
    { x: 35.0, z: -10.65 },
    { x: 51.0, z: -10.65 },
  ];

  // Guard full ~2.5 m crown + leaf spray radius against STAGE_CLEAR (not just the 1.46 m planter curb)
  const sites = candidates.filter((s) => isClear(s.x, s.z, 2.5, 2.5));
  if (!sites.length) return;

  // ---- Chamfered basalt planters + dark metallic tree grates (2 InstancedMeshes) ----
  const planterGeo = tracker.trackGeo(new RoundedBoxGeometry(1.46, 0.14, 1.46, 1, 0.035));
  const planterMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x4b5566,
      map: textures.precast.map,
      roughness: 0.78,
      metalness: 0.10,
    }),
  );
  const planters = new THREE.InstancedMesh(planterGeo, planterMat, sites.length);
  planters.name = 'tree-planters';
  planters.castShadow = false;
  planters.receiveShadow = true;

  const grateGeo = tracker.trackGeo(new THREE.BoxGeometry(1.18, 0.152, 1.18));
  const grateMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x262d38,
      roughness: 0.42,
      metalness: 0.62,
    }),
  );
  const grates = new THREE.InstancedMesh(grateGeo, grateMat, sites.length);
  grates.name = 'tree-grates';
  grates.castShadow = false;
  grates.receiveShadow = true;

  const dummy = new THREE.Object3D();
  sites.forEach((site, idx) => {
    dummy.position.set(site.x, 0.07, site.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    planters.setMatrixAt(idx, dummy.matrix);
    grates.setMatrixAt(idx, dummy.matrix);
  });
  planters.instanceMatrix.needsUpdate = true;
  grates.instanceMatrix.needsUpdate = true;
  world.add(planters, grates);

  // ---- 4 Distinct Botanical Tree Archetypes + Varied Leaf Palettes (5 InstancedMeshes) ----
  const archetypes = [0, 1, 2, 3].map((style) => createTreeArchetype(rng, tracker, style));
  const barkMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x9c8e80,
      map: textures.bark.map,
      roughness: 0.88,
      metalness: 0.02,
    }),
  );

  // Per-species leaf tint palettes (lush sage, deep pine-cypress, silver-eucalyptus, warm bronze-maple)
  const speciesLeafPalettes = [
    [0x63825c, 0x729368, 0x55734f, 0x7ea072],
    [0x3e6656, 0x4a7564, 0x35584a, 0x568270],
    [0x6d8b78, 0x7d9c88, 0x5d7a69, 0x8aa896],
    [0x8a644a, 0x9c7254, 0x78553e, 0xa87d5c],
  ];

  // Deterministic non-repeating species sequence so adjacent trees always contrast naturally
  const speciesOrder = [0, 2, 1, 3, 0, 1, 2, 3, 1, 0, 3, 2, 0, 3, 1, 2];
  const buckets = [[], [], [], []];
  sites.forEach((site, i) => {
    const archIdx = speciesOrder[i % speciesOrder.length];
    buckets[archIdx].push({
      x: site.x,
      z: site.z,
      yaw: rng() * Math.PI * 2,
      scale: 0.82 + rng() * 0.30,
      archIdx,
    });
  });

  const clustersPerTip = isSmallScreen ? 2 : 3;
  const leafPositions = [];

  buckets.forEach((list, archIdx) => {
    if (!list.length) return;
    const arch = archetypes[archIdx];
    const trunkMesh = new THREE.InstancedMesh(arch.geometry, barkMat, list.length);
    trunkMesh.name = `tree-trunks-${archIdx}`;
    trunkMesh.castShadow = false;
    trunkMesh.receiveShadow = false;

    const rotY = new THREE.Quaternion();
    const upAxis = new THREE.Vector3(0, 1, 0);
    const tipWorld = new THREE.Vector3();
    const palette = speciesLeafPalettes[archIdx];

    list.forEach((inst, j) => {
      dummy.position.set(inst.x, 0.1, inst.z);
      dummy.rotation.set(0, inst.yaw, 0);
      dummy.scale.setScalar(inst.scale);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(j, dummy.matrix);

      rotY.setFromAxisAngle(upAxis, inst.yaw);
      const spreadScale = archIdx === 1 ? 0.44 : 0.72;
      for (const tip of arch.tips) {
        tipWorld.copy(tip).multiplyScalar(inst.scale).applyQuaternion(rotY);
        tipWorld.x += inst.x;
        tipWorld.y += 0.1;
        tipWorld.z += inst.z;

        for (let c = 0; c < clustersPerTip; c++) {
          leafPositions.push({
            x: tipWorld.x + (rng() - 0.5) * spreadScale,
            y: tipWorld.y + (rng() - 0.5) * 0.42,
            z: tipWorld.z + (rng() - 0.5) * spreadScale,
            rx: (rng() - 0.5) * 0.65,
            ry: rng() * Math.PI * 2,
            rz: (rng() - 0.5) * 0.65,
            scale: (archIdx === 1 ? 0.58 + rng() * 0.28 : 0.72 + rng() * 0.44) * inst.scale,
            colorHex: palette[(j + c) % palette.length],
          });
        }
      }
    });
    trunkMesh.instanceMatrix.needsUpdate = true;
    world.add(trunkMesh);
  });

  if (leafPositions.length) {
    const leafGeo = createLeafClusterGeometry(tracker);
    const leafMat = tracker.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: textures.leaf.map,
        alphaTest: 0.42,
        side: THREE.DoubleSide,
        roughness: 0.74,
        metalness: 0.02,
      }),
    );
    const leaves = new THREE.InstancedMesh(leafGeo, leafMat, leafPositions.length);
    leaves.name = 'tree-leaf-clusters';
    leaves.castShadow = false;
    leaves.receiveShadow = false;

    const cTmp = new THREE.Color();
    leafPositions.forEach((lp, idx) => {
      dummy.position.set(lp.x, lp.y, lp.z);
      dummy.rotation.set(lp.rx, lp.ry, lp.rz);
      dummy.scale.setScalar(lp.scale);
      dummy.updateMatrix();
      leaves.setMatrixAt(idx, dummy.matrix);
      leaves.setColorAt(idx, cTmp.setHex(lp.colorHex));
    });
    leaves.instanceMatrix.needsUpdate = true;
    if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
    world.add(leaves);
  }
}
