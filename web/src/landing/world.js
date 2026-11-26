// Landing-exclusive 3D world ("Año 10000" — Detroit: Become Human x SpaceX/Tesla x Cyberpunk).
// Synchronous (zero external .glb fetches), strictly decoupled from city.js (#/simulations),
// enforces STAGE_CLEAR (containing KEEP_CLEAR), adds zero extra shadow/dynamic lights,
// maintains <= 42 draw calls, and disposes 100% of owned GPU resources on undress().
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createDeterministicRng, createResourceTracker, createTextureSet } from './world-textures.js';
import { buildBuildingsAndSkyline, FAR_FACADE_Z, NEAR_FACADE_Z } from './world-buildings.js';
import { buildFoliageAndPlanters } from './world-foliage.js';

// Public spatial exclusion contract (walk, falls, Hero/Capture/Gym/Policy/Close camera paths)
export const KEEP_CLEAR = { xMin: -9, xMax: 12, zMin: -7, zMax: 5.8 };

// Expanded stage clear covering Capture walk-end (x = 9.58) + Gym/Policy narrow orbits (x <= 13.32)
const STAGE_CLEAR = { xMin: -9, xMax: 15, zMin: -7.5, zMax: 6.2 };

export function isClear(x, z, halfW = 0.5, halfD = halfW) {
  if (!Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(halfW) || !Number.isFinite(halfD)) {
    return false;
  }
  const hw = Math.max(0, halfW);
  const hd = Math.max(0, halfD);
  return (
    x + hw <= STAGE_CLEAR.xMin ||
    x - hw >= STAGE_CLEAR.xMax ||
    z + hd <= STAGE_CLEAR.zMin ||
    z - hd >= STAGE_CLEAR.zMax
  );
}

const NEAR_CURB_Z = -2.4;
const FAR_CURB_Z = -9.8;
const ROAD_CENTER_Z = (NEAR_CURB_Z + FAR_CURB_Z) * 0.5; // -6.1
const SIDEWALK_DEPTH = NEAR_FACADE_Z - NEAR_CURB_Z; // 9.6 m (mirrored on far side: FAR_CURB_Z - 9.6 = FAR_FACADE_Z)
const STREET_LEN = 156;
const CROSSWALK_X = -25;

const FOG_COLOR_NIGHT = new THREE.Color(0x151c29);
const FOG_DENSITY_NIGHT = 0.0145;
// Deep smoked-slate lab chamber ("wind-tunnel" isolation) — avoids blinding white flash on #gym entry
const FOG_COLOR_LAB = new THREE.Color(0x131922);
const FOG_DENSITY_LAB = 0.056;

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

function configureTwilightSky(sunVec) {
  const sky = new Sky();
  sky.scale.setScalar(4500);
  sky.frustumCulled = false;
  const u = sky.material.uniforms;
  u.turbidity.value = 7.0;
  u.rayleigh.value = 2.6;
  u.mieCoefficient.value = 0.0065;
  u.mieDirectionalG.value = 0.85;
  u.sunPosition.value.copy(sunVec);
  if (u.cloudCoverage) u.cloudCoverage.value = 0.17;
  if (u.cloudDensity) u.cloudDensity.value = 0.14;
  if (u.cloudElevation) u.cloudElevation.value = 0.61;
  if (u.showSunDisc) u.showSunDisc.value = 0;
  return sky;
}

function buildPmremEnvironment(renderer, sunVec, isSmallScreen) {
  const skyScene = new THREE.Scene();
  const skyCopy = configureTwilightSky(sunVec);
  skyScene.add(skyCopy);

  // Balanced cyber-twilight ground disc + steel specular bounce panels (legible at normal brightness, moody tone)
  const groundGeo = new THREE.CircleGeometry(40, 24);
  const groundMat = new THREE.MeshBasicMaterial({ color: 0x161d29 });
  const groundDisc = new THREE.Mesh(groundGeo, groundMat);
  groundDisc.rotation.x = -Math.PI / 2;
  groundDisc.position.y = -1;
  skyScene.add(groundDisc);

  const bounceDefs = [
    { pos: [0, 3, -24], rotY: 0, rotX: 0, color: 0x546c94, w: 34, h: 5 },
    { pos: [0, 3, 24], rotY: Math.PI, rotX: 0, color: 0x30425d, w: 34, h: 5 },
    { pos: [-24, 4, 0], rotY: Math.PI / 2, rotX: 0, color: 0x465d82, w: 30, h: 5 },
    { pos: [24, 4, 0], rotY: -Math.PI / 2, rotX: 0, color: 0x3a4f6b, w: 30, h: 5 },
    { pos: [0, 18, 0], rotY: 0, rotX: Math.PI / 2, color: 0x405472, w: 30, h: 30 },
  ];
  const bounceObjs = bounceDefs.map((b) => {
    const g = new THREE.PlaneGeometry(b.w, b.h);
    const m = new THREE.MeshBasicMaterial({ color: b.color });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(...b.pos);
    mesh.rotation.y = b.rotY;
    mesh.rotation.x = b.rotX;
    skyScene.add(mesh);
    return { g, m };
  });

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTarget = pmrem.fromScene(skyScene, 0.025, 0.1, 6000, {
    size: isSmallScreen ? 128 : 256,
  });

  pmrem.dispose();
  skyCopy.geometry.dispose();
  skyCopy.material.dispose();
  groundGeo.dispose();
  groundMat.dispose();
  for (const b of bounceObjs) {
    b.g.dispose();
    b.m.dispose();
  }
  return envTarget;
}

function buildHorizonSkirt(world, tracker, sharedUniforms) {
  // Radius 88 sits outside skyline (~83 m max); constant-NDC 0.99999*w (like Sky.js 1.0*w)
  // pins the skirt at d ≈ 99.01 m (behind world geometry <= 94 m, ahead of Sky 1.0*w) with zero triangle warp.
  const cylGeo = new THREE.CylinderGeometry(88, 88, 48, 48, 1, true);
  const discGeo = new THREE.CircleGeometry(88, 48);
  discGeo.rotateX(Math.PI / 2); // BackSide faces +Y upward
  discGeo.translate(0, -8.04, 0); // +8.0 mesh Y -> y_world = -0.04
  const skirtGeo = mergeList([cylGeo, discGeo], tracker);
  const skirtMat = tracker.trackMat(
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: sharedUniforms.uTime,
        uGymWash: sharedUniforms.uGymWash,
        uFogColor: { value: FOG_COLOR_NIGHT.clone() },
        uLabColor: { value: FOG_COLOR_LAB.clone() },
        uSignal: { value: new THREE.Color(0xc8ff2e) },
      },
      vertexShader: /* glsl */ `
        varying float vWorldY;
        varying float vAngle;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldY = wp.y;
          vAngle = atan(position.z, position.x);
          gl_Position = projectionMatrix * viewMatrix * wp;
          gl_Position.z = gl_Position.w * 0.99999; // constant NDC behind world (<= 94 m), ahead of Sky (1.0*w)
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uGymWash;
        uniform vec3 uFogColor;
        uniform vec3 uLabColor;
        uniform vec3 uSignal;
        varying float vWorldY;
        varying float vAngle;

        void main() {
          float belowGround = 1.0 - smoothstep(0.01, 0.08, vWorldY);
          float h = clamp(vWorldY / 32.0, 0.0, 1.0);
          float horizonAlpha = 1.0 - smoothstep(0.01, 0.62, h);

          // Ultra-subtle atmospheric cyber-mist scan glow (no sharp horizontal wall stripes)
          float band = smoothstep(0.02, 0.10, h) * (1.0 - smoothstep(0.16, 0.42, h));
          float mistWave = 0.5 + 0.5 * sin(h * 16.0 - uTime * 0.45);
          float vTicks = smoothstep(0.985, 1.0, cos(vAngle * 24.0)) * smoothstep(0.03, 0.08, h) * (1.0 - smoothstep(0.12, 0.24, h));
          float sweep = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(vAngle * 2.0 - uTime * 0.35), 3.0);

          vec3 scanTint = mix(vec3(0.42, 0.62, 0.88), uSignal, 0.18 * sweep);
          float scanIntensity = (0.014 * (0.4 + 0.6 * mistWave) + vTicks * 0.022) * band * sweep * (1.0 - uGymWash) * (1.0 - belowGround);

          vec3 baseCol = mix(uFogColor, uLabColor, uGymWash);
          vec3 col = baseCol + scanTint * scanIntensity * 1.4;
          float alpha = mix(clamp(horizonAlpha + scanIntensity, 0.0, 1.0), 1.0, belowGround);
          gl_FragColor = vec4(col, alpha);
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      fog: false,
    }),
  );
  const horizonSkirt = new THREE.Mesh(skirtGeo, skirtMat);
  horizonSkirt.name = 'twilight-horizon-skirt';
  horizonSkirt.position.y = 8.0;
  horizonSkirt.renderOrder = -1;
  world.add(horizonSkirt);
}

function buildGymWashLayers(world, tracker, sharedUniforms) {
  // 1. Dark Smoked-Slate Lab Chamber dome (abstracts city smoothly without white brightness flash)
  const domeGeo = tracker.trackGeo(new THREE.SphereGeometry(72, 28, 16));
  const domeMat = tracker.trackMat(
    new THREE.ShaderMaterial({
      uniforms: {
        uGymWash: sharedUniforms.uGymWash,
        uZenith: { value: new THREE.Color(0x1b2434) },
        uHorizon: { value: new THREE.Color(0x121822) },
      },
      vertexShader: /* glsl */ `
        varying vec3 vLocalDir;
        void main() {
          vLocalDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uGymWash;
        uniform vec3 uZenith;
        uniform vec3 uHorizon;
        varying vec3 vLocalDir;
        void main() {
          float up = clamp(vLocalDir.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 col = mix(uHorizon, uZenith, smoothstep(0.45, 0.92, up));
          float meridian = smoothstep(0.996, 1.0, abs(cos(atan(vLocalDir.z, vLocalDir.x) * 6.0)));
          col = mix(col, vec3(0.24, 0.33, 0.46), meridian * 0.14);
          gl_FragColor = vec4(col, uGymWash * 0.96);
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      fog: false,
    }),
  );
  const gymWashDome = new THREE.Mesh(domeGeo, domeMat);
  gymWashDome.name = 'gym-wash-dome';
  gymWashDome.position.set(2, 0, 0);
  gymWashDome.renderOrder = 0;
  gymWashDome.visible = false;
  world.add(gymWashDome);

  // 2. Floor veil at y = 0.0022 (strictly below telemetry.js y = 0.004..0.008)
  const veilGeo = tracker.trackGeo(new THREE.PlaneGeometry(76, 76));
  veilGeo.rotateX(-Math.PI / 2);
  const veilMat = tracker.trackMat(
    new THREE.ShaderMaterial({
      uniforms: {
        uGymWash: sharedUniforms.uGymWash,
        uCenter: { value: new THREE.Vector2(2, 0) },
        uLabColor: { value: FOG_COLOR_LAB.clone() },
      },
      vertexShader: /* glsl */ `
        varying vec2 vWorldXZ;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldXZ = wp.xz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uGymWash;
        uniform vec2 uCenter;
        uniform vec3 uLabColor;
        varying vec2 vWorldXZ;
        void main() {
          float d = length(vWorldXZ - uCenter);
          float centerVeil = mix(0.76, 0.96, smoothstep(2.4, 11.5, d));
          float fogBlend = 1.0 - exp(-pow(0.056 * d, 2.0));
          float alpha = uGymWash * clamp(max(centerVeil, fogBlend), 0.0, 0.975);
          gl_FragColor = vec4(uLabColor, alpha);
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false,
      fog: false,
    }),
  );
  const gymFloorVeil = new THREE.Mesh(veilGeo, veilMat);
  gymFloorVeil.name = 'gym-floor-veil';
  gymFloorVeil.position.set(2, 0.0022, 0);
  gymFloorVeil.renderOrder = 1;
  gymFloorVeil.visible = false;
  world.add(gymFloorVeil);

  return { gymWashDome, gymFloorVeil, veilMat };
}

function buildGroundAndMarkings(world, textures, tracker) {
  // 1. Symmetric merged sidewalks + dark recessed building-footprint aprons (1 draw call)
  const nearPlazaGeo = new THREE.PlaneGeometry(STREET_LEN, SIDEWALK_DEPTH);
  nearPlazaGeo.rotateX(-Math.PI / 2);
  nearPlazaGeo.translate(0, 0, NEAR_CURB_Z + SIDEWALK_DEPTH * 0.5);

  const farPlazaGeo = new THREE.PlaneGeometry(STREET_LEN, SIDEWALK_DEPTH);
  farPlazaGeo.rotateZ(Math.PI); // mirror paver seam outward from far curb
  farPlazaGeo.rotateX(-Math.PI / 2);
  farPlazaGeo.translate(0, 0, FAR_CURB_Z - SIDEWALK_DEPTH * 0.5);

  // Under-building ground aprons seal recessed ground-floor facades & alleys (z in [+7.15, +18.0] & [-30.0, -19.35])
  const nearApronDepth = 18.0 - 7.15;
  const nearApronGeo = new THREE.PlaneGeometry(STREET_LEN, nearApronDepth);
  const nearApronUv = nearApronGeo.attributes.uv;
  for (let i = 0; i < nearApronUv.count; i++) {
    nearApronUv.setY(i, nearApronUv.getY(i) * (nearApronDepth / SIDEWALK_DEPTH));
  }
  nearApronGeo.rotateX(-Math.PI / 2);
  nearApronGeo.translate(0, -0.002, (7.15 + 18.0) * 0.5);

  const farApronDepth = -19.35 - (-30.0);
  const farApronGeo = new THREE.PlaneGeometry(STREET_LEN, farApronDepth);
  const farApronUv = farApronGeo.attributes.uv;
  for (let i = 0; i < farApronUv.count; i++) {
    farApronUv.setY(i, farApronUv.getY(i) * (farApronDepth / SIDEWALK_DEPTH));
  }
  farApronGeo.rotateZ(Math.PI);
  farApronGeo.rotateX(-Math.PI / 2);
  farApronGeo.translate(0, -0.002, (-30.0 + -19.35) * 0.5);

  const plazaGeo = mergeList([nearPlazaGeo, farPlazaGeo, nearApronGeo, farApronGeo], tracker);
  const plazaMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe8ecf3,
      map: textures.plaza.map,
      normalMap: textures.plaza.normalMap,
      normalScale: new THREE.Vector2(0.45, 0.45),
      roughnessMap: textures.plaza.roughnessMap,
      roughness: 0.96,
      metalness: 0.06,
      envMapIntensity: 0.84,
    }),
  );
  const plazas = new THREE.Mesh(plazaGeo, plazaMat);
  plazas.name = 'plaza-sidewalks';
  plazas.castShadow = false;
  plazas.receiveShadow = true;
  world.add(plazas);

  // 2. Dark matte carbon-asphalt roadway: z in [-9.8, -2.4]
  const roadDepth = NEAR_CURB_Z - FAR_CURB_Z; // 7.4 m
  const roadGeo = tracker.trackGeo(new THREE.PlaneGeometry(STREET_LEN, roadDepth));
  roadGeo.rotateX(-Math.PI / 2);
  const roadMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.asphalt.map,
      normalMap: textures.asphalt.normalMap,
      normalScale: new THREE.Vector2(0.42, 0.42),
      roughnessMap: textures.asphalt.roughnessMap,
      roughness: 1.0,
      metalness: 0.06,
      envMapIntensity: 0.65,
    }),
  );
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.name = 'road-asphalt';
  road.position.set(0, 0, ROAD_CENTER_Z);
  road.castShadow = false;
  road.receiveShadow = true;
  world.add(road);

  // 3. Honed basalt curbs along z = -2.4 and z = -9.8
  const curbParts = [];
  for (const cz of [NEAR_CURB_Z, FAR_CURB_Z]) {
    const cg = new RoundedBoxGeometry(STREET_LEN, 0.022, 0.24, 1, 0.005);
    cg.translate(0, 0, cz);
    curbParts.push(cg);
  }
  const curbGeo = mergeList(curbParts, tracker);
  const curbMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x454e5e,
      roughness: 0.54,
      metalness: 0.14,
      envMapIntensity: 1.0,
    }),
  );
  const curbs = new THREE.Mesh(curbGeo, curbMat);
  curbs.name = 'granite-curbs';
  curbs.castShadow = false;
  curbs.receiveShadow = true;
  world.add(curbs);

  // 4. Crosswalk at x = -25 (strictly outside STAGE_CLEAR)
  const crossGeo = tracker.trackGeo(new THREE.PlaneGeometry(3.2, roadDepth - 0.5));
  const crossMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.crosswalk.map,
      transparent: true,
      depthWrite: false,
      roughness: 0.78,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    }),
  );
  const crosswalk = new THREE.Mesh(crossGeo, crossMat);
  crosswalk.name = 'road-crosswalk';
  crosswalk.rotation.x = -Math.PI / 2;
  crosswalk.position.set(CROSSWALK_X, 0.0012, ROAD_CENTER_Z);
  crosswalk.castShadow = false;
  crosswalk.receiveShadow = true;
  crosswalk.renderOrder = 1;
  world.add(crosswalk);

  // 5. Luminous futuristic road lane guides (1 merged Mesh; no distracting green corridor lines beside robot)
  const laneParts = [];
  for (let lx = -72; lx <= 72; lx += 6.0) {
    if (Math.abs(lx - CROSSWALK_X) < 3.2) continue;
    const dash = new THREE.PlaneGeometry(1.8, 0.045);
    dash.rotateX(-Math.PI / 2);
    dash.translate(lx, 0.0012, ROAD_CENTER_Z);
    laneParts.push(dash);
  }
  // Curb-side parking boundary hairlines split cleanly around crosswalk
  const leftLen = (CROSSWALK_X - 2.4) - (-STREET_LEN * 0.5);
  const leftCenter = (-STREET_LEN * 0.5 + (CROSSWALK_X - 2.4)) * 0.5;
  const rightStart = CROSSWALK_X + 2.4;
  const rightLen = STREET_LEN * 0.5 - rightStart;
  const rightCenter = (rightStart + STREET_LEN * 0.5) * 0.5;
  for (const lz of [-4.35, -7.85]) {
    for (const [segLen, segCenter] of [
      [leftLen, leftCenter],
      [rightLen, rightCenter],
    ]) {
      const strip = new THREE.PlaneGeometry(segLen, 0.024);
      strip.rotateX(-Math.PI / 2);
      strip.translate(segCenter, 0.0012, lz);
      laneParts.push(strip);
    }
  }
  const laneGeo = mergeList(laneParts, tracker);
  const laneMat = tracker.trackMat(
    new THREE.MeshBasicMaterial({
      color: 0x9cb4cc,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    }),
  );
  const laneGuides = new THREE.Mesh(laneGeo, laneMat);
  laneGuides.name = 'road-lane-guides';
  laneGuides.renderOrder = 1;
  world.add(laneGuides);

  // 7. Instanced metallic storm drains along both gutters
  const drainSites = [];
  for (let dx = -66; dx <= 66; dx += 12) {
    if (Math.abs(dx - CROSSWALK_X) < 3.0) continue;
    for (const dz of [NEAR_CURB_Z - 0.24, FAR_CURB_Z + 0.24]) {
      if (isClear(dx, dz, 0.42, 0.2)) drainSites.push({ x: dx, z: dz });
    }
  }
  if (drainSites.length) {
    const drainGeo = tracker.trackGeo(new THREE.PlaneGeometry(0.76, 0.34));
    drainGeo.rotateX(-Math.PI / 2);
    const drainMat = tracker.trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.drainGrate.map,
        roughness: 0.34,
        metalness: 0.84,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
    );
    const drains = new THREE.InstancedMesh(drainGeo, drainMat, drainSites.length);
    drains.name = 'road-drains';
    drains.renderOrder = 1;
    const dummy = new THREE.Object3D();
    drainSites.forEach((d, i) => {
      dummy.position.set(d.x, 0.0014, d.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      drains.setMatrixAt(i, dummy.matrix);
    });
    drains.instanceMatrix.needsUpdate = true;
    world.add(drains);
  }

  return {
    setGymWash(a) {
      laneMat.opacity = 0.28 * (1 - a * 0.78);
      crossMat.opacity = 1.0 - a * 0.75;
    },
  };
}

function buildStreetlampsAndProps(world, textures, tracker, sharedUniforms) {
  const dummy = new THREE.Object3D();
  const cTmp = new THREE.Color();

  // ---- Cantilevered Streetlamps (staggered >= 6 m clear of parked EVs & STAGE_CLEAR) ----
  const lampLocations = [
    { x: -52.0, z: NEAR_CURB_Z + 0.35, toward: -1 },
    { x: -39.5, z: NEAR_CURB_Z + 0.35, toward: -1 },
    { x: -26.0, z: NEAR_CURB_Z + 0.35, toward: -1 },
    { x: -13.5, z: NEAR_CURB_Z + 0.35, toward: -1 },
    { x: 19.0, z: NEAR_CURB_Z + 0.35, toward: -1 },
    { x: 32.0, z: NEAR_CURB_Z + 0.35, toward: -1 },
    { x: 45.0, z: NEAR_CURB_Z + 0.35, toward: -1 },
    { x: 58.0, z: NEAR_CURB_Z + 0.35, toward: -1 },
    { x: -56.0, z: FAR_CURB_Z - 0.35, toward: 1 },
    { x: -42.0, z: FAR_CURB_Z - 0.35, toward: 1 },
    { x: -26.5, z: FAR_CURB_Z - 0.35, toward: 1 },
    { x: -12.0, z: FAR_CURB_Z - 0.35, toward: 1 },
    { x: 0.5, z: FAR_CURB_Z - 0.35, toward: 1 },
    { x: 13.5, z: FAR_CURB_Z - 0.35, toward: 1 },
    { x: 28.5, z: FAR_CURB_Z - 0.35, toward: 1 },
    { x: 44.5, z: FAR_CURB_Z - 0.35, toward: 1 },
    { x: 58.0, z: FAR_CURB_Z - 0.35, toward: 1 },
  ].filter((l) => isClear(l.x, l.z, 0.6, 0.6));

  // Organic varied bench & plaza seating sites (3 distinct archetypes, varied rhythm, outside STAGE_CLEAR)
  const benchSites = [
    { x: -31.5, z: 5.1, ry: 0, type: 0 },
    { x: -19.2, z: 5.3, ry: 0.08, type: 1 },
    { x: -12.0, z: 5.1, ry: -0.05, type: 2 },
    { x: 18.2, z: 5.2, ry: 0.04, type: 1 },
    { x: 27.8, z: 5.0, ry: -0.06, type: 0 },
    { x: 40.5, z: 5.3, ry: 0.05, type: 2 },
    { x: -30.5, z: -17.3, ry: Math.PI - 0.04, type: 2 },
    { x: -17.8, z: -17.5, ry: Math.PI + 0.06, type: 0 },
    { x: -5.8, z: -17.2, ry: Math.PI - 0.08, type: 1 },
    { x: 6.2, z: -17.4, ry: Math.PI + 0.04, type: 2 },
    { x: 19.4, z: -17.3, ry: Math.PI, type: 0 },
    { x: 29.2, z: -17.5, ry: Math.PI - 0.06, type: 1 },
    { x: 42.6, z: -17.2, ry: Math.PI + 0.05, type: 0 },
  ].filter((b) => isClear(b.x, b.z, 1.25, 0.55));

  // Pedestrian architectural light totems (warm-amber glow contrasting cool-white road streetlamps)
  const totemSites = [
    { x: -24.5, z: 5.6 },
    { x: 23.0, z: 5.6 },
    { x: 35.0, z: 5.6 },
    { x: -24.0, z: -17.8 },
    { x: 0.2, z: -17.8 },
    { x: 13.0, z: -17.8 },
    { x: 36.0, z: -17.8 },
  ].filter((t) => isClear(t.x, t.z, 0.35, 0.35));

  let luminaireMat = null;
  let poolMat = null;
  let coneMat = null;
  let bollardSlitMat = null;
  let benchGlowMat = null;
  let totemGlowMat = null;

  if (lampLocations.length) {
    const poleGeo = new THREE.CylinderGeometry(0.048, 0.075, 5.6, 10);
    poleGeo.translate(0, 2.8, 0);

    const plinthGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.42, 10);
    plinthGeo.translate(0, 0.21, 0);

    const armCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 5.45, 0),
      new THREE.Vector3(0, 6.08, 0.35),
      new THREE.Vector3(0, 5.98, 1.25),
    );
    const armGeo = new THREE.TubeGeometry(armCurve, 8, 0.04, 8, false);
    const headGeo = new RoundedBoxGeometry(0.26, 0.055, 0.64, 1, 0.015);
    headGeo.translate(0, 5.98, 1.48);

    const lampBodyGeo = mergeList([plinthGeo, poleGeo, armGeo, headGeo], tracker);
    const lampBodyMat = tracker.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x1a1e26,
        roughness: 0.36,
        metalness: 0.84,
      }),
    );
    const lampBodies = new THREE.InstancedMesh(lampBodyGeo, lampBodyMat, lampLocations.length);
    lampBodies.name = 'streetlamp-bodies';
    lampBodies.castShadow = false;
    lampBodies.receiveShadow = false;

    // 3D manifold emissive luminaire protruding ~4 cm below dark shroud (visible from 360°)
    const luminaireGeo = tracker.trackGeo(new RoundedBoxGeometry(0.23, 0.055, 0.56, 1, 0.014));
    luminaireGeo.translate(0, 5.926, 1.48);
    luminaireMat = tracker.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xeef5ff,
        emissive: 0xcce2ff,
        emissiveIntensity: 2.3,
        roughness: 0.18,
      }),
    );
    const lampLuminaires = new THREE.InstancedMesh(luminaireGeo, luminaireMat, lampLocations.length);
    lampLuminaires.name = 'streetlamp-luminaires';
    lampLuminaires.castShadow = false;

    // Subtle volumetric Fresnel light cone linking each luminaire to its single elliptical pool
    const coneGeo = tracker.trackGeo(new THREE.CylinderGeometry(0.18, 2.05, 5.88, 18, 1, true));
    coneMat = tracker.trackMat(
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(0xcce2ff) },
          uOpacity: { value: 0.095 },
          uGymWash: sharedUniforms.uGymWash,
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          varying vec3 vViewNormal;
          varying vec3 vViewPos;
          void main() {
            vUv = uv;
            vec4 localPos = vec4(position, 1.0);
            vec3 localNorm = normal;
            #ifdef USE_INSTANCING
              localPos = instanceMatrix * localPos;
              localNorm = mat3(instanceMatrix) * localNorm;
            #endif
            vec4 mvPos = modelViewMatrix * localPos;
            vViewPos = -mvPos.xyz;
            vViewNormal = normalize(normalMatrix * localNorm);
            gl_Position = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uOpacity;
          uniform float uGymWash;
          varying vec2 vUv;
          varying vec3 vViewNormal;
          varying vec3 vViewPos;
          void main() {
            float vFade = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.88, vUv.y) * mix(0.28, 1.0, vUv.y * vUv.y);
            float ndotv = clamp(abs(dot(normalize(vViewNormal), normalize(vViewPos))), 0.0, 1.0);
            float fresnel = pow(ndotv, 1.85);
            float alpha = vFade * fresnel * uOpacity * (1.0 - uGymWash * 0.90);
            gl_FragColor = vec4(uColor, alpha);
            #include <colorspace_fragment>
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
        toneMapped: false,
      }),
    );
    const lampCones = new THREE.InstancedMesh(coneGeo, coneMat, lampLocations.length);
    lampCones.name = 'streetlamp-cones';
    lampCones.renderOrder = 2;

    lampLocations.forEach((l, i) => {
      const ry = l.toward > 0 ? 0 : Math.PI;
      dummy.position.set(l.x, 0, l.z);
      dummy.rotation.set(0, ry, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      lampBodies.setMatrixAt(i, dummy.matrix);
      lampLuminaires.setMatrixAt(i, dummy.matrix);

      dummy.position.set(l.x, 2.97, l.z + l.toward * 1.25);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1.25, 1, 0.62);
      dummy.updateMatrix();
      lampCones.setMatrixAt(i, dummy.matrix);
    });
    lampBodies.instanceMatrix.needsUpdate = true;
    lampLuminaires.instanceMatrix.needsUpdate = true;
    lampCones.instanceMatrix.needsUpdate = true;
    world.add(lampBodies, lampLuminaires, lampCones);
  }

  // ---- Shared ground-light-pools (1 InstancedMesh: streetlamp elliptical pools + bench floor wash) ----
  const totalPools = lampLocations.length + benchSites.length;
  if (totalPools > 0) {
    const poolGeo = tracker.trackGeo(new THREE.PlaneGeometry(1, 1));
    poolGeo.rotateX(-Math.PI / 2);
    poolMat = tracker.trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: textures.ellipticalPool.map,
        transparent: true,
        opacity: 1.0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const groundPools = new THREE.InstancedMesh(poolGeo, poolMat, totalPools);
    groundPools.name = 'ground-light-pools';
    groundPools.renderOrder = 1;

    let pIdx = 0;
    for (const l of lampLocations) {
      dummy.position.set(l.x, 0.0018, l.z + l.toward * 1.48);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(7.4, 1, 4.4);
      dummy.updateMatrix();
      groundPools.setMatrixAt(pIdx, dummy.matrix);
      groundPools.setColorAt(pIdx, cTmp.setHex(0xcce2ff));
      pIdx++;
    }
    for (const b of benchSites) {
      const frontOffset = b.ry === 0 ? -0.18 : 0.18;
      dummy.position.set(b.x, 0.0014, b.z + frontOffset);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(2.4, 1, 1.1);
      dummy.updateMatrix();
      groundPools.setMatrixAt(pIdx, dummy.matrix);
      groundPools.setColorAt(pIdx, cTmp.setHex(0x586b82));
      pIdx++;
    }
    groundPools.instanceMatrix.needsUpdate = true;
    if (groundPools.instanceColor) groundPools.instanceColor.needsUpdate = true;
    world.add(groundPools);
  }

  // ---- Monolithic Luminous Bollards (symmetric on near & far curbs) ----
  const bollardXs = [-34.0, -32.4, -18.4, -16.8, -15.2, 16.6, 18.2, 19.8, 32.4, 34.0];
  const bollardSites = [
    ...bollardXs.map((x) => ({ x, z: NEAR_CURB_Z + 0.32 })),
    ...bollardXs.map((x) => ({ x, z: FAR_CURB_Z - 0.32 })),
    { x: -5.0, z: FAR_CURB_Z - 0.32 },
    { x: -3.4, z: FAR_CURB_Z - 0.32 },
    { x: 3.4, z: FAR_CURB_Z - 0.32 },
    { x: 5.0, z: FAR_CURB_Z - 0.32 },
  ].filter((b) => isClear(b.x, b.z, 0.22, 0.22));

  if (bollardSites.length) {
    const bStem = new THREE.CylinderGeometry(0.068, 0.082, 0.62, 6);
    bStem.translate(0, 0.31, 0);
    const bCap = new THREE.CylinderGeometry(0.064, 0.068, 0.14, 6);
    bCap.translate(0, 0.81, 0);
    const bollardGeo = mergeList([bStem, bCap], tracker);
    const bollardMat = tracker.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x1e222b,
        roughness: 0.35,
        metalness: 0.86,
      }),
    );
    const bollardBodies = new THREE.InstancedMesh(bollardGeo, bollardMat, bollardSites.length);
    bollardBodies.name = 'monolith-bollard-bodies';
    bollardBodies.castShadow = false;
    bollardBodies.receiveShadow = false;

    const slitGeo = tracker.trackGeo(new THREE.CylinderGeometry(0.058, 0.062, 0.115, 6));
    slitGeo.translate(0, 0.68, 0);
    bollardSlitMat = tracker.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xeaf6c8,
        emissive: 0xc8ff2e,
        emissiveIntensity: 1.05,
        roughness: 0.2,
      }),
    );
    const bollardSlits = new THREE.InstancedMesh(slitGeo, bollardSlitMat, bollardSites.length);
    bollardSlits.name = 'monolith-bollard-slits';
    bollardSlits.castShadow = false;

    bollardSites.forEach((b, i) => {
      dummy.position.set(b.x, 0, b.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      bollardBodies.setMatrixAt(i, dummy.matrix);
      bollardSlits.setMatrixAt(i, dummy.matrix);
    });
    bollardBodies.instanceMatrix.needsUpdate = true;
    bollardSlits.instanceMatrix.needsUpdate = true;
    world.add(bollardBodies, bollardSlits);
  }

  // ---- Varied Plaza Seating (3 distinct archetypes merged into 3 draw calls total) ----
  if (benchSites.length) {
    const metalParts = [];
    const timberParts = [];
    const glowParts = [];
    const mat4 = new THREE.Matrix4();

    const addPart = (bucket, geo, site) => {
      mat4.makeRotationY(site.ry);
      mat4.setPosition(site.x, 0, site.z);
      geo.applyMatrix4(mat4);
      bucket.push(geo);
    };

    for (const b of benchSites) {
      if (b.type === 0) {
        // Type A: Cantilevered warm-timber + dark steel bench
        const plinth = new RoundedBoxGeometry(0.92, 0.35, 0.32, 1, 0.015);
        plinth.translate(0, 0.175, 0.06);
        addPart(metalParts, plinth, b);
        const ribL = new THREE.BoxGeometry(0.08, 0.045, 0.50);
        ribL.translate(-0.68, 0.365, -0.02);
        addPart(metalParts, ribL, b);
        const ribR = new THREE.BoxGeometry(0.08, 0.045, 0.50);
        ribR.translate(0.68, 0.365, -0.02);
        addPart(metalParts, ribR, b);

        const seat = new RoundedBoxGeometry(2.12, 0.075, 0.56, 1, 0.018);
        seat.translate(0, 0.425, -0.02);
        addPart(timberParts, seat, b);

        const glow = new THREE.BoxGeometry(1.72, 0.016, 0.036);
        glow.translate(0, 0.372, -0.18);
        addPart(glowParts, glow, b);
      } else if (b.type === 1) {
        // Type B: Sculptural monolithic basalt lounge block (wider, low-slung, recessed shadow reveal)
        const base = new RoundedBoxGeometry(2.35, 0.12, 0.62, 1, 0.015);
        base.translate(0, 0.06, 0);
        addPart(metalParts, base, b);
        const monolith = new RoundedBoxGeometry(2.58, 0.30, 0.78, 1, 0.032);
        monolith.translate(0, 0.29, -0.02);
        addPart(metalParts, monolith, b);
        // Inset warm-timber lounge pad on one side
        const pad = new RoundedBoxGeometry(1.42, 0.045, 0.62, 1, 0.014);
        pad.translate(-0.42, 0.46, -0.02);
        addPart(timberParts, pad, b);
        const glow = new THREE.BoxGeometry(2.10, 0.018, 0.04);
        glow.translate(0, 0.125, -0.32);
        addPart(glowParts, glow, b);
      } else {
        // Type C: Compact dual-pod architectural seat with angled backrest
        const legL = new RoundedBoxGeometry(0.14, 0.42, 0.54, 1, 0.014);
        legL.translate(-0.78, 0.21, 0);
        addPart(metalParts, legL, b);
        const legR = new RoundedBoxGeometry(0.14, 0.42, 0.54, 1, 0.014);
        legR.translate(0.78, 0.21, 0);
        addPart(metalParts, legR, b);
        const spine = new RoundedBoxGeometry(1.72, 0.08, 0.12, 1, 0.01);
        spine.translate(0, 0.36, 0.12);
        addPart(metalParts, spine, b);
        const seat = new RoundedBoxGeometry(1.78, 0.07, 0.52, 1, 0.016);
        seat.translate(0, 0.44, -0.04);
        addPart(timberParts, seat, b);
        const back = new RoundedBoxGeometry(1.56, 0.32, 0.06, 1, 0.014);
        back.rotateX(-0.18);
        back.translate(0, 0.68, 0.22);
        addPart(timberParts, back, b);
        const glow = new THREE.BoxGeometry(1.38, 0.016, 0.032);
        glow.translate(0, 0.39, -0.22);
        addPart(glowParts, glow, b);
      }
    }

    const frameGeo = mergeList(metalParts, tracker);
    const frameMat = tracker.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x353d4c,
        roughness: 0.42,
        metalness: 0.68,
        envMapIntensity: 1.15,
      }),
    );
    const seatGeo = mergeList(timberParts, tracker);
    const seatMat = tracker.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xa4856e,
        map: textures.timber.map,
        normalMap: textures.timber.normalMap,
        roughness: 0.58,
        metalness: 0.04,
      }),
    );
    const glowGeo = mergeList(glowParts, tracker);
    benchGlowMat = tracker.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfff0d8,
        emissive: 0xffd7a3,
        emissiveIntensity: 1.25,
        roughness: 0.2,
      }),
    );

    const frames = new THREE.Mesh(frameGeo, frameMat);
    frames.name = 'bench-frames';
    frames.receiveShadow = true;

    const seats = new THREE.Mesh(seatGeo, seatMat);
    seats.name = 'bench-seats';
    seats.receiveShadow = true;

    const underglows = new THREE.Mesh(glowGeo, benchGlowMat);
    underglows.name = 'bench-underglows';

    world.add(frames, seats, underglows);
  }

  // ---- Pedestrian Architectural Light Totems (warm-amber plaza columns, 2 InstancedMeshes) ----
  if (totemSites.length) {
    const tBase = new RoundedBoxGeometry(0.24, 0.16, 0.24, 1, 0.02);
    tBase.translate(0, 0.08, 0);
    const tCol = new THREE.CylinderGeometry(0.085, 0.10, 2.25, 8);
    tCol.translate(0, 1.28, 0);
    const tCap = new THREE.CylinderGeometry(0.11, 0.095, 0.14, 8);
    tCap.translate(0, 2.47, 0);
    const totemBodyGeo = mergeList([tBase, tCol, tCap], tracker);
    const totemBodyMat = tracker.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x303846,
        roughness: 0.34,
        metalness: 0.80,
      }),
    );
    const totemBodies = new THREE.InstancedMesh(totemBodyGeo, totemBodyMat, totemSites.length);
    totemBodies.name = 'plaza-light-totems';

    const tGlowGeo = tracker.trackGeo(new THREE.CylinderGeometry(0.072, 0.072, 0.72, 8));
    tGlowGeo.translate(0, 1.98, 0);
    totemGlowMat = tracker.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfff2dc,
        emissive: 0xffd599,
        emissiveIntensity: 1.85,
        roughness: 0.22,
      }),
    );
    const totemGlows = new THREE.InstancedMesh(tGlowGeo, totemGlowMat, totemSites.length);
    totemGlows.name = 'plaza-light-totem-glows';

    totemSites.forEach((t, i) => {
      dummy.position.set(t.x, 0, t.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      totemBodies.setMatrixAt(i, dummy.matrix);
      totemGlows.setMatrixAt(i, dummy.matrix);
    });
    totemBodies.instanceMatrix.needsUpdate = true;
    totemGlows.instanceMatrix.needsUpdate = true;
    world.add(totemBodies, totemGlows);
  }

  return {
    setGymWash(a) {
      const damp = 1 - a * 0.88;
      if (luminaireMat) luminaireMat.emissiveIntensity = 2.3 * damp;
      if (poolMat) poolMat.opacity = 1.0 - a * 0.90;
      if (bollardSlitMat) bollardSlitMat.emissiveIntensity = 1.05 * damp;
      if (benchGlowMat) benchGlowMat.emissiveIntensity = 1.25 * damp;
      if (totemGlowMat) totemGlowMat.emissiveIntensity = 1.85 * damp;
    },
  };
}

function buildCyberWedgeEvs(world, isSmallScreen, tracker) {
  // Staggered >= 6 m clear of all streetlamp cones and strictly outside STAGE_CLEAR
  // 3 distinct futuristic vehicle types: 0 = Cyberpunk Wedge Coupe, 1 = Aero-SUV, 2 = Autonomous Urban Pod
  const farCars = (isSmallScreen ? [-18.5, -5.5, 6.5, 21.0] : [-34.0, -18.5, -5.5, 6.5, 21.0, 36.5])
    .map((x, idx) => ({ x, z: -8.65, ry: Math.PI, idx, type: [0, 1, 2, 0, 2, 1][idx % 6] }));
  const nearCars = (isSmallScreen ? [-33.0, 25.5] : [-46.0, -33.0, 25.5, 38.5])
    .map((x, idx) => ({ x, z: -3.55, ry: 0, idx: idx + 3, type: [1, 2, 0, 1][idx % 4] }));

  const carSpots = [...farCars, ...nearCars].filter((c) => isClear(c.x, c.z, 2.4, 0.95));
  if (!carSpots.length) return null;

  const extrudeVehicleProfile = (pts, width, opts = {}) => {
    const shape = new THREE.Shape();
    shape.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
    shape.closePath();
    const raw = new THREE.ExtrudeGeometry(shape, {
      depth: width,
      bevelEnabled: true,
      bevelThickness: opts.bevelThickness ?? 0.06,
      bevelSize: opts.bevelSize ?? 0.05,
      bevelSegments: opts.bevelSegments ?? 2,
      curveSegments: 4,
    });
    raw.translate(0, 0, -width * 0.5);
    const pos = raw.attributes.position;
    const roofY = opts.roofY ?? 0.74;
    const roofSpan = opts.roofSpan ?? 0.52;
    const tumble = opts.tumble ?? 0.20;
    const wb = opts.wheelbase ?? 1.42;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      let pz = pos.getZ(i);
      const ny = Math.max(0, (py - roofY) / roofSpan);
      const tumblehome = 1 - tumble * ny;
      const archProx = Math.max(
        Math.exp(-Math.pow((px - wb) / 0.36, 2)),
        Math.exp(-Math.pow((px + wb) / 0.36, 2)),
      );
      const flare = py < roofY + 0.02 ? 1 + 0.06 * archProx * (1 - Math.max(0, (py - 0.22) / 0.54)) : 1;
      const noseStart = opts.noseStart ?? 1.3;
      const noseTaper = px > noseStart ? 1 - 0.09 * Math.pow((px - noseStart) / 1.08, 2) : 1;
      pz *= tumblehome * flare * noseTaper;
      pos.setZ(i, pz);
    }
    raw.computeVertexNormals();
    return raw;
  };

  // Profile templates for 3 distinct futuristic silhouettes (merged per material with vertex colors = 6 draw calls total!)
  const makeVehicleTemplate = (type) => {
    if (type === 1) {
      // Type 1: Futuristic Aero-SUV / Cyber-Crossover (4.85 m long, 1.56 m tall)
      const body = extrudeVehicleProfile([
        [-2.35, 0.26], [-2.42, 0.78], [-2.36, 1.16], [-1.96, 1.52],
        [-0.35, 1.56], [0.85, 1.06], [1.45, 0.98], [2.36, 0.76], [2.42, 0.48], [2.38, 0.26],
        [1.92, 0.24], [1.84, 0.62], [1.66, 0.80], [1.24, 0.80], [1.06, 0.62], [0.98, 0.24],
        [-0.98, 0.24], [-1.06, 0.62], [-1.24, 0.80], [-1.66, 0.80], [-1.84, 0.62], [-1.92, 0.24],
      ], 1.84, { roofY: 0.92, roofSpan: 0.66, tumble: 0.16, wheelbase: 1.45, noseStart: 1.45 });
      const glass = extrudeVehicleProfile([
        [-2.14, 1.12], [-1.88, 1.48], [-0.36, 1.52], [0.90, 1.04], [0.68, 0.98], [-1.98, 1.04],
      ], 1.58, { bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 1, roofY: 0.98, roofSpan: 0.56, tumble: 0.16, wheelbase: 1.45, noseStart: 2.5 });
      const drl = new THREE.BoxGeometry(0.06, 0.04, 1.72);
      drl.translate(2.47, 0.72, 0);
      const tail = new THREE.BoxGeometry(0.06, 0.045, 1.70);
      tail.translate(-2.46, 1.08, 0);
      return { body, glass, drl: [drl], tail: [tail], wb: 1.45, wOff: 0.90, wheelR: 0.36 };
    }
    if (type === 2) {
      // Type 2: Compact Autonomous Urban Pod / Shuttle (3.65 m long, 1.64 m tall glass dome)
      const body = extrudeVehicleProfile([
        [-1.78, 0.22], [-1.84, 0.62], [-1.72, 1.38], [-1.25, 1.62],
        [1.25, 1.62], [1.72, 1.38], [1.84, 0.62], [1.78, 0.22],
        [1.46, 0.20], [1.38, 0.52], [1.22, 0.68], [0.88, 0.68], [0.72, 0.52], [0.64, 0.20],
        [-0.64, 0.20], [-0.72, 0.52], [-0.88, 0.68], [-1.22, 0.68], [-1.38, 0.52], [-1.46, 0.20],
      ], 1.66, { roofY: 0.84, roofSpan: 0.80, tumble: 0.14, wheelbase: 1.05, noseStart: 1.9 });
      const glass = extrudeVehicleProfile([
        [-1.62, 0.82], [-1.52, 1.38], [-1.18, 1.58], [1.18, 1.58], [1.52, 1.38], [1.62, 0.82],
      ], 1.52, { bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 1, roofY: 0.88, roofSpan: 0.72, tumble: 0.14, wheelbase: 1.05, noseStart: 2.5 });
      const drl = new THREE.BoxGeometry(0.055, 0.042, 1.42);
      drl.translate(1.89, 0.64, 0);
      const tail = new THREE.BoxGeometry(0.055, 0.042, 1.42);
      tail.translate(-1.89, 0.64, 0);
      return { body, glass, drl: [drl], tail: [tail], wb: 1.05, wOff: 0.82, wheelR: 0.30 };
    }
    // Type 0: Sharp Cyberpunk Wedge Coupe (4.68 m long, 1.24 m low-slung peak)
    const body = extrudeVehicleProfile([
      [-2.24, 0.21], [-2.34, 0.62], [-2.32, 0.94], [-1.95, 0.96],
      [-0.86, 1.22], [-0.18, 1.24], [1.06, 0.84], [1.34, 0.78],
      [2.28, 0.56], [2.36, 0.42], [2.34, 0.22],
      [1.88, 0.20], [1.80, 0.54], [1.62, 0.72], [1.22, 0.72], [1.04, 0.54], [0.96, 0.20],
      [-0.96, 0.20], [-1.04, 0.54], [-1.22, 0.72], [-1.62, 0.72], [-1.80, 0.54], [-1.88, 0.20],
    ], 1.72, { roofY: 0.74, roofSpan: 0.52, tumble: 0.20, wheelbase: 1.42, noseStart: 1.3 });
    const glass = extrudeVehicleProfile([
      [-1.88, 0.96], [-0.86, 1.21], [-0.18, 1.24], [1.12, 0.82], [0.85, 0.78], [-1.68, 0.86],
    ], 1.46, { bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 1, roofY: 0.84, roofSpan: 0.42, tumble: 0.20, wheelbase: 1.42, noseStart: 2.5 });
    const drlMain = new THREE.BoxGeometry(0.055, 0.032, 1.56);
    drlMain.translate(2.42, 0.49, 0);
    const drlFangL = new THREE.BoxGeometry(0.22, 0.030, 0.045);
    drlFangL.translate(2.33, 0.49, 0.85);
    const drlFangR = new THREE.BoxGeometry(0.22, 0.030, 0.045);
    drlFangR.translate(2.33, 0.49, -0.85);
    const tailMain = new THREE.BoxGeometry(0.055, 0.036, 1.52);
    tailMain.translate(-2.40, 0.86, 0);
    const tailWingL = new THREE.BoxGeometry(0.05, 0.16, 0.045);
    tailWingL.translate(-2.39, 0.79, 0.78);
    const tailWingR = new THREE.BoxGeometry(0.05, 0.16, 0.045);
    tailWingR.translate(-2.39, 0.79, -0.78);
    return { body, glass, drl: [drlMain, drlFangL, drlFangR], tail: [tailMain, tailWingL, tailWingR], wb: 1.42, wOff: 0.85, wheelR: 0.33 };
  };

  // Richer metallic automotive finishes (silver-titanium, midnight cobalt, pearl-slate, bronze-graphite, obsidian)
  const carPalette = [0x5c6b82, 0x36465e, 0x7b8798, 0x2c3646, 0x6b5f58, 0x42576b];
  const bodyBuckets = [];
  const glassBuckets = [];
  const drlBuckets = [];
  const tailBuckets = [];
  const wheelPlacements = [];
  const mat4 = new THREE.Matrix4();
  const cTmp = new THREE.Color();

  const templates = [0, 1, 2].map((t) => makeVehicleTemplate(t));

  for (const car of carSpots) {
    const tpl = templates[car.type];
    mat4.makeRotationY(car.ry);
    mat4.setPosition(car.x, 0, car.z);

    // Clone & bake per-car vertex color onto body so all 3 silhouettes merge into 1 draw call
    const bGeo = normalizeForMerge(tpl.body);
    bGeo.applyMatrix4(mat4);
    cTmp.setHex(carPalette[car.idx % carPalette.length]);
    const vCount = bGeo.attributes.position.count;
    const cols = new Float32Array(vCount * 3);
    for (let k = 0; k < vCount; k++) {
      cols[k * 3] = cTmp.r;
      cols[k * 3 + 1] = cTmp.g;
      cols[k * 3 + 2] = cTmp.b;
    }
    bGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    bodyBuckets.push(bGeo);

    const gGeo = tpl.glass.clone();
    gGeo.applyMatrix4(mat4);
    glassBuckets.push(gGeo);

    for (const d of tpl.drl) {
      const dg = d.clone();
      dg.applyMatrix4(mat4);
      drlBuckets.push(dg);
    }
    for (const t of tpl.tail) {
      const tg = t.clone();
      tg.applyMatrix4(mat4);
      tailBuckets.push(tg);
    }

    const cosR = Math.cos(car.ry);
    const sinR = Math.sin(car.ry);
    for (const [wx, wz] of [
      [tpl.wb, tpl.wOff],
      [tpl.wb, -tpl.wOff],
      [-tpl.wb, tpl.wOff],
      [-tpl.wb, -tpl.wOff],
    ]) {
      wheelPlacements.push({
        x: car.x + wx * cosR + wz * sinR,
        y: tpl.wheelR,
        z: car.z - wx * sinR + wz * cosR,
        ry: car.ry,
        scale: tpl.wheelR / 0.33,
      });
    }
  }

  for (const tpl of templates) {
    tpl.body.dispose();
    tpl.glass.dispose();
    tpl.drl.forEach((g) => g.dispose());
    tpl.tail.forEach((g) => g.dispose());
  }

  const mergedBodyGeo = tracker.trackGeo(mergeGeometries(bodyBuckets, false));
  bodyBuckets.forEach((g) => g.dispose());
  const mergedGlassGeo = mergeList(glassBuckets, tracker);
  const mergedDrlGeo = mergeList(drlBuckets, tracker);
  const mergedTailGeo = mergeList(tailBuckets, tracker);

  const bodyMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.26,
      metalness: 0.78,
      envMapIntensity: 1.55,
    }),
  );
  const glassMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x0c111b,
      roughness: 0.12,
      metalness: 0.78,
      envMapIntensity: 1.5,
    }),
  );
  const drlMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0xf4f9ff, emissive: 0xd8ecff, emissiveIntensity: 2.1 }),
  );
  const tailMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0xff2b2b, emissive: 0xff242c, emissiveIntensity: 2.0 }),
  );

  const bodies = new THREE.Mesh(mergedBodyGeo, bodyMat);
  bodies.name = 'ev-wedge-bodies';
  const canopies = new THREE.Mesh(mergedGlassGeo, glassMat);
  canopies.name = 'ev-wedge-canopies';
  const drls = new THREE.Mesh(mergedDrlGeo, drlMat);
  drls.name = 'ev-wedge-drls';
  const tails = new THREE.Mesh(mergedTailGeo, tailMat);
  tails.name = 'ev-wedge-tails';

  // Instanced tires & 8-sided cyber aero turbine rims across all 3 vehicle types
  const tireGeo = tracker.trackGeo(new THREE.CylinderGeometry(0.33, 0.33, 0.26, 18));
  tireGeo.rotateX(Math.PI / 2);
  const tireMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.82, metalness: 0.08 }),
  );
  const tires = new THREE.InstancedMesh(tireGeo, tireMat, wheelPlacements.length);
  tires.name = 'ev-wedge-tires';

  const rimGeo = tracker.trackGeo(new THREE.CylinderGeometry(0.23, 0.23, 0.27, 8));
  rimGeo.rotateX(Math.PI / 2);
  const rimMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({ color: 0x7b8698, roughness: 0.24, metalness: 0.88 }),
  );
  const rims = new THREE.InstancedMesh(rimGeo, rimMat, wheelPlacements.length);
  rims.name = 'ev-wedge-rims';

  const dummy = new THREE.Object3D();
  wheelPlacements.forEach((wp, i) => {
    dummy.position.set(wp.x, wp.y, wp.z);
    dummy.rotation.set(0, wp.ry, 0);
    dummy.scale.set(wp.scale, wp.scale, 1);
    dummy.updateMatrix();
    tires.setMatrixAt(i, dummy.matrix);
    rims.setMatrixAt(i, dummy.matrix);
  });
  tires.instanceMatrix.needsUpdate = true;
  rims.instanceMatrix.needsUpdate = true;

  world.add(bodies, canopies, tires, rims, drls, tails);

  return {
    setGymWash(a) {
      const damp = 1 - a * 0.78;
      drlMat.emissiveIntensity = 2.1 * damp;
      tailMat.emissiveIntensity = 2.0 * damp;
    },
  };
}

/**
 * Dresses the Three.js scene with the landing-exclusive "Año 10000" robotics plaza & street.
 * @param {THREE.Scene} scene
 * @param {THREE.WebGLRenderer} renderer
 * @returns {(() => void) & { group: THREE.Group, update: (dt?: number, elapsed?: number) => void, setGymWash: (amount?: number, center?: [number, number]) => void, undress: () => void }}
 */
export function dressLandingWorld(scene, renderer) {
  const before = {
    fog: scene.fog,
    environment: scene.environment,
    environmentIntensity: scene.environmentIntensity,
    background: scene.background,
  };

  // Hide RobotView's default studio PlaneGeometry floor and GridHelper before adding world.
  const hidden = scene.children
    .filter((o) => o.type === 'GridHelper' || o.isGridHelper || (o.isMesh && o.geometry?.type === 'PlaneGeometry'))
    .map((obj) => ({ obj, wasVisible: obj.visible }));
  for (const item of hidden) item.obj.visible = false;

  const world = new THREE.Group();
  world.name = 'landing-world';
  scene.add(world);

  const isSmallScreen =
    typeof window !== 'undefined' &&
    (window.innerWidth < 860 || window.matchMedia?.('(pointer: coarse)')?.matches);

  const tracker = createResourceTracker();
  const rng = createDeterministicRng(2604);
  const textures = createTextureSet(renderer, tracker);

  const sharedUniforms = {
    uTime: { value: 0 },
    uGymWash: { value: 0 },
  };

  // ---- Balanced Cyber-Twilight Sky (+1.8 deg), GLSL Horizon Scan Skirt, Fog & PMREM ----
  const sunVec = new THREE.Vector3().setFromSphericalCoords(
    1,
    THREE.MathUtils.degToRad(90 - 1.8),
    THREE.MathUtils.degToRad(212),
  );
  const sky = configureTwilightSky(sunVec);
  tracker.trackGeo(sky.geometry);
  tracker.trackMat(sky.material);
  world.add(sky);

  buildHorizonSkirt(world, tracker, sharedUniforms);
  const { gymWashDome, gymFloorVeil, veilMat } = buildGymWashLayers(world, tracker, sharedUniforms);

  const envTarget = buildPmremEnvironment(renderer, sunVec, isSmallScreen);
  scene.environment = envTarget.texture;
  scene.environmentIntensity = 0.76;
  scene.background = null;
  scene.fog = new THREE.FogExp2(FOG_COLOR_NIGHT.getHex(), FOG_DENSITY_NIGHT);

  // ---- Ground, Architecture, Foliage, Streetscape & Varied Futuristic EVs ----
  const groundWash = buildGroundAndMarkings(world, textures, tracker);
  const buildingsWash = buildBuildingsAndSkyline(world, textures, rng, isSmallScreen, tracker, sharedUniforms);
  buildFoliageAndPlanters(world, textures, rng, isSmallScreen, isClear, tracker);
  const streetWash = buildStreetlampsAndProps(world, textures, tracker, sharedUniforms);
  const evWash = buildCyberWedgeEvs(world, isSmallScreen, tracker);

  let disposed = false;

  const setGymWash = (amount = 0, center) => {
    if (disposed) return;
    const a = Math.max(0, Math.min(1, Number.isFinite(amount) ? amount : 0));
    sharedUniforms.uGymWash.value = a;
    if (Array.isArray(center) && Number.isFinite(center[0]) && Number.isFinite(center[1])) {
      veilMat.uniforms.uCenter.value.set(center[0], center[1]);
    } else if (center && Number.isFinite(center.x) && Number.isFinite(center.z)) {
      veilMat.uniforms.uCenter.value.set(center.x, center.z);
    }
    if (scene.fog?.isFogExp2) {
      scene.fog.color.copy(FOG_COLOR_NIGHT).lerp(FOG_COLOR_LAB, a);
      scene.fog.density = FOG_DENSITY_NIGHT + (FOG_DENSITY_LAB - FOG_DENSITY_NIGHT) * a;
    }
    scene.environmentIntensity = 0.76 + (0.94 - 0.76) * a;
    const showWash = a > 0.001;
    gymWashDome.visible = showWash;
    gymFloorVeil.visible = showWash;
    groundWash?.setGymWash(a);
    buildingsWash?.setGymWash(a);
    streetWash?.setGymWash(a);
    evWash?.setGymWash(a);
  };

  const update = (dt = 0, elapsed) => {
    if (disposed) return;
    if (Number.isFinite(elapsed)) {
      sharedUniforms.uTime.value = elapsed;
    } else if (Number.isFinite(dt)) {
      sharedUniforms.uTime.value += dt;
    }
  };

  const undress = () => {
    if (disposed) return;
    disposed = true;

    scene.remove(world);
    for (const item of hidden) item.obj.visible = item.wasVisible;
    scene.fog = before.fog;
    scene.environment = before.environment;
    scene.environmentIntensity = before.environmentIntensity;
    scene.background = before.background;

    envTarget.dispose();
    tracker.disposeAll(world);
  };

  // Callable handle satisfies both legacy unedited home.js:1816 (`undressWorld()`) and M1->M2 contract
  return Object.assign(() => undress(), {
    group: world,
    update,
    setGymWash,
    undress,
  });
}
