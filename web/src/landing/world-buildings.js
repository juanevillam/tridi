// Futuristic Architectural Robotics Campus corridor ("Año 10000" — SpaceX/Tesla x Cyberpunk)
// + custom GLSL interior-parallax curtain-wall shader + 5 archetypes + skywalks + animated skyline beacons.
// Zero external .glb fetches; synchronous from Frame 0; 9 draw calls total (5 static + 4 instanced).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const NEAR_FACADE_Z = 7.2;
export const FAR_FACADE_Z = -19.4;

function normalizeForMerge(rawGeo, keepColor = false) {
  const g = rawGeo.index ? rawGeo.toNonIndexed() : rawGeo.clone();
  for (const name of Object.keys(g.attributes)) {
    if (name !== 'position' && name !== 'normal' && name !== 'uv' && (!keepColor || name !== 'color')) {
      g.deleteAttribute(name);
    }
  }
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) {
    const count = g.attributes.position.count;
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
  }
  if (keepColor && !g.attributes.color) {
    const count = g.attributes.position.count;
    const white = new Float32Array(count * 3);
    white.fill(1);
    g.setAttribute('color', new THREE.BufferAttribute(white, 3));
  }
  return g;
}

function mergeBucket(bucket, tracker, keepColor = false) {
  if (!bucket.length) return null;
  const normalized = bucket.map((g) => normalizeForMerge(g, keepColor));
  for (const g of bucket) g.dispose();
  const merged = mergeGeometries(normalized, false);
  for (const g of normalized) g.dispose();
  if (!merged) return null;
  return tracker.trackGeo(merged);
}

function makeWorldBox(w, h, d, x, y, z, uvScale = 0.18) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.attributes.uv;
  const norm = geo.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const nx = Math.abs(norm.getX(i));
    const ny = Math.abs(norm.getY(i));
    const u = uv.getX(i);
    const v = uv.getY(i);
    if (nx > 0.5) {
      uv.setXY(i, u * d * uvScale, v * h * uvScale);
    } else if (ny > 0.5) {
      uv.setXY(i, u * w * uvScale, v * d * uvScale);
    } else {
      uv.setXY(i, u * w * uvScale, v * h * uvScale);
    }
  }
  geo.translate(x, y, z);
  return geo;
}

function makeBayPlane(w, h, x, y, z, ry, bayW, bayH, baySeed) {
  const geo = new THREE.PlaneGeometry(w, h);
  const uv = geo.attributes.uv;
  const cols = Math.max(1, w / bayW);
  const rows = Math.max(1, h / bayH);
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) * cols + baySeed, uv.getY(i) * rows);
  }
  if (ry) geo.rotateY(ry);
  geo.translate(x, y, z);
  return geo;
}

function pushLedBox(bucket, w, h, d, x, y, z, hex) {
  const geo = new THREE.BoxGeometry(w, h, d);
  geo.translate(x, y, z);
  const count = geo.attributes.position.count;
  const colors = new Float32Array(count * 3);
  const c = new THREE.Color(hex);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  bucket.push(geo);
}

// Tapered 8-vertex unit prism (y in [0, 1], base 1x1, top topScale x topScale) for sleek skyline towers
function createTaperedTowerGeometry(topScale = 0.84) {
  const b = 0.5;
  const t = 0.5 * topScale;
  const p = [
    [-b, 0, b], [b, 0, b], [b, 0, -b], [-b, 0, -b],
    [-t, 1, t], [t, 1, t], [t, 1, -t], [-t, 1, -t],
  ];
  const faces = [
    [0, 1, 5, 4], // +Z
    [1, 2, 6, 5], // +X
    [2, 3, 7, 6], // -Z
    [3, 0, 4, 7], // -X
    [4, 5, 6, 7], // +Y roof
  ];
  const positions = [];
  for (const [a, bIdx, c, d] of faces) {
    positions.push(...p[a], ...p[bIdx], ...p[c], ...p[a], ...p[c], ...p[d]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

function createCurtainWallMaterial(tracker, sharedUniforms) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0c1320,
    roughness: 0.045,
    metalness: 0.68,
    envMapIntensity: 2.35,
  });

  mat.customProgramCacheKey = () => 'tridi-curtain-wall-luxury-v4';
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uGymWash = sharedUniforms.uGymWash;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vCwWorldPos;
        varying vec3 vCwWorldNormal;
        varying vec2 vCwBayUv;`,
      )
      .replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>
        vCwBayUv = uv;`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
        vCwWorldNormal = normalize(mat3(modelMatrix) * objectNormal);`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vCwWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uGymWash;
        varying vec3 vCwWorldPos;
        varying vec3 vCwWorldNormal;
        varying vec2 vCwBayUv;

        float cwHash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        // Razor-thin anodized architectural mullions (no thick fuzzy beige stripes)
        float cwSubPaneMask(vec2 cell) {
          vec2 subCell = fract(cell * vec2(3.0, 2.0));
          float outerF = smoothstep(0.0, 0.018, cell.x) * smoothstep(1.0, 0.982, cell.x)
                       * smoothstep(0.0, 0.022, cell.y) * smoothstep(1.0, 0.978, cell.y);
          float subX = smoothstep(0.010, 0.024, subCell.x) * smoothstep(0.990, 0.976, subCell.x);
          float subY = smoothstep(0.012, 0.028, subCell.y) * smoothstep(0.988, 0.972, subCell.y);
          return outerF * subX * subY;
        }`,
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        vec2 cwMapCell = fract(vCwBayUv);
        vec2 cwPaneId = floor(vCwBayUv * vec2(3.0, 2.0));
        float cwGlassMask = cwSubPaneMask(cwMapCell);
        float cwPaneTint = cwHash21(cwPaneId + vec2(4.7, 9.2));
        vec3 cwGlassCol = mix(vec3(0.016, 0.024, 0.038), vec3(0.028, 0.042, 0.064), cwPaneTint);
        vec3 cwFrameCol = vec3(0.010, 0.012, 0.016);
        diffuseColor.rgb = mix(cwFrameCol, cwGlassCol, cwGlassMask);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(0.28, roughnessFactor + cwPaneTint * 0.018, cwGlassMask);`,
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `#include <metalnessmap_fragment>
        metalnessFactor = mix(0.86, metalnessFactor, cwGlassMask);`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        // Real architectural glass micro-tilt per individual pane so reflections break up organically
        float cwTiltX = (cwHash21(cwPaneId + vec2(11.1, 3.7)) - 0.5) * 0.028 * cwGlassMask;
        float cwTiltY = (cwHash21(cwPaneId + vec2(27.4, 8.9)) - 0.5) * 0.022 * cwGlassMask;
        normal = normalize(normal + vec3(cwTiltX, cwTiltY, 0.0));`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        vec3 cwN = normalize(vCwWorldNormal);
        vec3 cwUp = abs(cwN.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
        vec3 cwT = normalize(cross(cwUp, cwN));
        vec3 cwB = cross(cwN, cwT);
        vec3 cwV = normalize(vCwWorldPos - cameraPosition);

        float rx = dot(cwV, cwT);
        float ry = dot(cwV, cwB);
        float rz = max(0.24, -dot(cwV, cwN));

        // Grazing Schlick Fresnel sky-sheen for luxury tempered glass polish
        float cwNdotV = clamp(abs(dot(cwN, -cwV)), 0.0, 1.0);
        float cwFresnel = pow(1.0 - cwNdotV, 3.6);
        vec3 cwSkySheen = mix(vec3(0.09, 0.14, 0.24), vec3(0.24, 0.30, 0.42), smoothstep(0.0, 16.0, vCwWorldPos.y));
        totalEmissiveRadiance += cwSkySheen * cwFresnel * 0.42 * cwGlassMask * (1.0 - uGymWash * 0.85);

        vec2 bayId = floor(vCwBayUv);
        vec2 cell = fract(vCwBayUv);
        float h = cwHash21(bayId);
        float hSub = cwHash21(bayId + vec2(19.3, 7.1));

        // Deep architectural interior parallax (only selective bays lit; ground floor stays dark luxury mirror glass)
        vec2 backUv = cell + vec2(rx, ry) * (0.85 / rz);
        float inWall = step(0.06, backUv.x) * step(backUv.x, 0.94) * step(0.08, backUv.y) * step(backUv.y, 0.92);

        float spandrelShadow = mix(0.32, 1.0, smoothstep(0.06, 0.28, cell.y))
                             * mix(0.55, 1.0, smoothstep(0.98, 0.78, cell.y));
        float frameMask = cwGlassMask * spandrelShadow;

        // Ground floor stays sleek dark reflective glass so Hero/Gym/Policy look crisp & architectural
        float groundAtten = mix(0.14, 1.0, smoothstep(3.6, 7.2, vCwWorldPos.y));

        vec3 roomCol = vec3(0.008, 0.012, 0.020);
        float roomStrength = 0.02;
        if (h > 0.82) {
          roomCol = mix(vec3(0.38, 0.62, 0.92), vec3(0.58, 0.80, 1.0), hSub);
          roomStrength = 0.24 + 0.16 * hSub;
        } else if (h > 0.72) {
          roomCol = mix(vec3(0.82, 0.58, 0.36), vec3(0.92, 0.68, 0.44), hSub);
          roomStrength = 0.16 + 0.12 * hSub;
        } else if (h > 0.69) {
          roomCol = vec3(0.56, 0.78, 0.18);
          roomStrength = 0.15 + 0.08 * hSub;
        }

        // Sharp architectural linear ceiling troffer + subtle vertical back-wall gradient
        float troffer = smoothstep(0.82, 0.90, backUv.y) * smoothstep(0.16, 0.28, backUv.x) * smoothstep(0.84, 0.72, backUv.x);
        float wallGrad = 0.28 + 0.72 * smoothstep(0.08, 0.86, backUv.y);
        float interior = (wallGrad * inWall * 0.55 + 0.95 * troffer) * frameMask;

        totalEmissiveRadiance += roomCol * interior * roomStrength * groundAtten * (1.0 - uGymWash * 0.90);`,
      );
  };

  return tracker.trackMat(mat);
}

export function buildBuildingsAndSkyline(world, textures, rng, isSmallScreen, tracker, sharedUniforms) {
  const precastGeos = [];
  const mullionGeos = [];
  const aeroCladdingGeos = [];
  const ledGeos = [];
  const glassGeos = [];

  const BAY_W = 3.2;
  const BAY_H = 3.6;
  let buildingSeed = 1;

  // ---- Archetype 1: SpaceX/Tesla Aero-Ribbed Monolith Tower ----
  const addAeroMonolith = (xStart, width, depth, floors, side, accentHex) => {
    const cx = xStart + width * 0.5;
    const frontZ = side > 0 ? NEAR_FACADE_Z : FAR_FACADE_Z;
    const inward = side > 0 ? -1 : 1;
    const faceRy = side > 0 ? Math.PI : 0;
    const groundH = 4.2;
    const upperH = floors * BAY_H;
    const totalH = groundH + upperH;
    const bodyCenterZ = frontZ - inward * (depth * 0.5);

    // Core dark precast shell
    precastGeos.push(makeWorldBox(width, totalH, depth - 0.5, cx, totalH * 0.5, bodyCenterZ - inward * 0.35));

    // Recessed storefront & full-height dark curtain glass
    glassGeos.push(makeBayPlane(width - 0.6, groundH - 0.3, cx, groundH * 0.5, frontZ - inward * 0.45, faceRy, BAY_W, groundH, buildingSeed * 11));
    glassGeos.push(makeBayPlane(width - 0.5, upperH - 0.3, cx, groundH + upperH * 0.5, frontZ - inward * 0.35, faceRy, BAY_W, BAY_H, buildingSeed * 17));

    // Horizontal dark spandrel mullions
    for (let f = 0; f <= floors; f++) {
      const sy = groundH + f * BAY_H;
      mullionGeos.push(makeWorldBox(width - 0.2, 0.24, 0.22, cx, sy, frontZ - inward * 0.24));
    }

    // 7..9 Full-height aerodynamic titanium ribs (front edge stays >= 6.475 m on near side)
    const numRibs = Math.max(6, Math.round(width / 2.1));
    const ribStep = (width - 0.8) / numRibs;
    for (let i = 0; i <= numRibs; i++) {
      const rx = xStart + 0.4 + i * ribStep;
      const isHeroRib = i === 1 || i === numRibs - 1;
      const ribD = isHeroRib ? 0.98 : 0.78;
      aeroCladdingGeos.push(makeWorldBox(isHeroRib ? 0.26 : 0.20, totalH + 0.6, ribD, rx, (totalH + 0.6) * 0.5, frontZ + inward * (ribD * 0.5 - 0.22)));
      if (isHeroRib) {
        const stripH = totalH * 0.84;
        pushLedBox(ledGeos, 0.055, stripH, 0.04, rx, groundH * 0.5 + stripH * 0.5 - 0.4, frontZ + inward * (ribD - 0.20), accentHex);
      }
    }

    // Stepped aerodynamic parapet crown
    const stepH = 2.4;
    const crownW = width * 0.86;
    const crownD = depth * 0.82;
    aeroCladdingGeos.push(makeWorldBox(crownW, stepH, crownD, cx, totalH + stepH * 0.5, bodyCenterZ - inward * 0.4));
    mullionGeos.push(makeWorldBox(crownW + 0.2, 0.32, crownD + 0.2, cx, totalH + 0.16, bodyCenterZ - inward * 0.4));
    pushLedBox(ledGeos, crownW * 0.72, 0.045, 0.05, cx, totalH + stepH - 0.18, frontZ - inward * 0.35, 0x8ec5ff);

    buildingSeed++;
  };

  // ---- Archetype 2: Detroit: Become Human Cantilevered Lab Podium ----
  const addCantileverLab = (xStart, width, depth, floors, side) => {
    const cx = xStart + width * 0.5;
    const frontZ = side > 0 ? NEAR_FACADE_Z : FAR_FACADE_Z;
    const inward = side > 0 ? -1 : 1;
    const faceRy = side > 0 ? Math.PI : 0;
    const groundH = 4.4;
    const upperH = floors * BAY_H;
    const totalH = groundH + upperH;
    const bodyCenterZ = frontZ - inward * (depth * 0.5);

    // Recessed ground floor storefront + structural piers
    precastGeos.push(makeWorldBox(width, groundH, depth - 0.7, cx, groundH * 0.5, bodyCenterZ - inward * 0.55));
    glassGeos.push(makeBayPlane(width - 0.8, groundH - 0.4, cx, (groundH - 0.2) * 0.5, frontZ - inward * 0.58, faceRy, BAY_W, groundH, buildingSeed * 13));

    const numBays = Math.max(3, Math.round(width / BAY_W));
    const stepW = width / numBays;
    for (let i = 0; i <= numBays; i++) {
      const px = xStart + i * stepW;
      if (i === 0 || i === numBays || i % 2 === 0) {
        aeroCladdingGeos.push(makeWorldBox(0.38, groundH, 0.42, px, groundH * 0.5, frontZ + inward * 0.25));
      }
    }

    // Upper cantilevered volume (projects 1.05 m forward strictly at y >= 4.4 m)
    const cantProj = 1.05;
    const cantFrontZ = frontZ + inward * cantProj;
    const cantDepth = depth + cantProj - 0.35;
    const cantCenterZ = cantFrontZ - inward * (cantDepth * 0.5);

    precastGeos.push(makeWorldBox(width, upperH, cantDepth - 0.3, cx, groundH + upperH * 0.5, cantCenterZ - inward * 0.22));
    glassGeos.push(makeBayPlane(width - 0.4, upperH - 0.4, cx, groundH + upperH * 0.5, cantFrontZ - inward * 0.14, faceRy, BAY_W, BAY_H, buildingSeed * 19));

    // Cantilevered framing & mullions
    for (let i = 0; i <= numBays; i++) {
      const mx = xStart + i * stepW;
      mullionGeos.push(makeWorldBox(i === 0 || i === numBays ? 0.34 : 0.10, upperH + 0.2, 0.24, mx, groundH + upperH * 0.5, cantFrontZ - inward * 0.06));
    }
    for (let f = 0; f <= floors; f++) {
      const my = groundH + f * BAY_H;
      mullionGeos.push(makeWorldBox(width + 0.12, f === 0 || f === floors ? 0.42 : 0.12, 0.28, cx, my, cantFrontZ - inward * 0.06));
    }

    // Brushed titanium under-cantilever soffit + cool ice-white recessed cove LED
    aeroCladdingGeos.push(makeWorldBox(width + 0.08, 0.10, cantProj + 0.65, cx, groundH - 0.04, frontZ + inward * (cantProj * 0.5 - 0.15)));
    pushLedBox(ledGeos, width - 0.8, 0.04, 0.07, cx, groundH - 0.09, frontZ + inward * (cantProj - 0.22), 0xd8e6ff);

    buildingSeed++;
  };

  // ---- Archetype 3: Cyberpunk Tiered Arcology & Exoskeleton ----
  const addTieredArcology = (xStart, width, depth, floors, side) => {
    const cx = xStart + width * 0.5;
    const frontZ = side > 0 ? NEAR_FACADE_Z : FAR_FACADE_Z;
    const inward = side > 0 ? -1 : 1;
    const faceRy = side > 0 ? Math.PI : 0;
    const baseH = 11.4; // Ground + 2 stories
    const upperFloors = Math.max(2, floors - 2);
    const upperH = upperFloors * BAY_H;
    const baseCenterZ = frontZ - inward * (depth * 0.5);

    // Lower massive volume
    precastGeos.push(makeWorldBox(width, baseH, depth - 0.4, cx, baseH * 0.5, baseCenterZ - inward * 0.24));
    glassGeos.push(makeBayPlane(width - 0.7, baseH - 0.6, cx, baseH * 0.5, frontZ - inward * 0.18, faceRy, BAY_W, BAY_H, buildingSeed * 23));

    // Heavy exoskeleton piers on base corners & center
    for (const px of [xStart + 0.3, cx, xStart + width - 0.3]) {
      aeroCladdingGeos.push(makeWorldBox(0.56, baseH + 0.3, 0.62, px, (baseH + 0.3) * 0.5, frontZ + inward * 0.14));
      mullionGeos.push(makeWorldBox(0.62, baseH + 0.35, 0.24, px, (baseH + 0.35) * 0.5, frontZ + inward * 0.28));
    }
    for (let f = 1; f <= 3; f++) {
      const sy = f === 3 ? baseH : f * 3.8;
      mullionGeos.push(makeWorldBox(width + 0.1, f === 3 ? 0.46 : 0.16, 0.36, cx, sy, frontZ - inward * 0.06));
    }

    // Elevated setback terrace at y = 11.4 m (2.2 m setback)
    const setback = 2.2;
    const upperFrontZ = frontZ - inward * setback;
    const upperDepth = Math.max(4.8, depth - setback);
    const upperCenterZ = upperFrontZ - inward * (upperDepth * 0.5);

    // Glass terrace balustrade + restrained --signal terrace rim hairline
    glassGeos.push(makeBayPlane(width - 0.8, 1.05, cx, baseH + 0.55, frontZ - inward * 0.12, faceRy, 2.0, 1.05, buildingSeed * 29));
    mullionGeos.push(makeWorldBox(width - 0.6, 0.08, 0.08, cx, baseH + 1.08, frontZ - inward * 0.12));
    pushLedBox(ledGeos, width - 0.4, 0.035, 0.04, cx, baseH + 0.02, frontZ + inward * 0.14, 0xc8ff2e);

    // Setback upper tower + twin comms fins
    precastGeos.push(makeWorldBox(width * 0.88, upperH, upperDepth - 0.3, cx, baseH + upperH * 0.5, upperCenterZ - inward * 0.2));
    glassGeos.push(makeBayPlane(width * 0.84, upperH - 0.4, cx, baseH + upperH * 0.5, upperFrontZ - inward * 0.12, faceRy, BAY_W, BAY_H, buildingSeed * 31));
    mullionGeos.push(makeWorldBox(width * 0.88, 0.28, 0.28, cx, baseH + upperH, upperFrontZ - inward * 0.12));

    for (const fx of [cx - width * 0.24, cx + width * 0.24]) {
      aeroCladdingGeos.push(makeWorldBox(0.24, 3.2, 2.6, fx, baseH + upperH + 1.6, upperCenterZ));
    }

    buildingSeed++;
  };

  // ---- Archetype 4: Elevated Overhead Skywalks (y >= 8.4 m, clearing 6.08 m lamps & <= 5.1 m cameras) ----
  const addSkywalk = (xCenter, soffitY, width, height) => {
    const spanZ = NEAR_FACADE_Z - FAR_FACADE_Z; // 26.6 m
    const zCenter = (NEAR_FACADE_Z + FAR_FACADE_Z) * 0.5; // -6.1

    // Sculpted belly truss + roof slab
    aeroCladdingGeos.push(makeWorldBox(width + 0.24, 0.44, spanZ + 0.8, xCenter, soffitY + 0.22, zCenter));
    aeroCladdingGeos.push(makeWorldBox(width + 0.32, 0.36, spanZ + 0.8, xCenter, soffitY + height - 0.18, zCenter));

    // Core dark ceiling/floor recess + illuminated glazing on both -X and +X bridge sides
    precastGeos.push(makeWorldBox(width - 0.4, height - 0.8, spanZ + 0.4, xCenter, soffitY + height * 0.5, zCenter));
    glassGeos.push(makeBayPlane(spanZ - 0.6, height - 0.8, xCenter - width * 0.5 - 0.02, soffitY + height * 0.5, zCenter, -Math.PI * 0.5, 3.4, height - 0.8, buildingSeed * 37));
    glassGeos.push(makeBayPlane(spanZ - 0.6, height - 0.8, xCenter + width * 0.5 + 0.02, soffitY + height * 0.5, zCenter, Math.PI * 0.5, 3.4, height - 0.8, buildingSeed * 41));

    // Outer structural exoskeleton rings along Z
    for (let rz = FAR_FACADE_Z + 1.8; rz <= NEAR_FACADE_Z - 1.8; rz += 3.8) {
      mullionGeos.push(makeWorldBox(width + 0.48, height + 0.16, 0.22, xCenter, soffitY + height * 0.5, rz));
    }

    // Subtle under-deck guide LEDs (cool ice-blue + subtle --signal centerline)
    pushLedBox(ledGeos, 0.05, 0.04, spanZ - 1.2, xCenter - width * 0.42, soffitY - 0.02, zCenter, 0x8ec5ff);
    pushLedBox(ledGeos, 0.05, 0.04, spanZ - 1.2, xCenter + width * 0.42, soffitY - 0.02, zCenter, 0x8ec5ff);
    pushLedBox(ledGeos, 0.035, 0.03, spanZ - 2.4, xCenter, soffitY - 0.02, zCenter, 0xc8ff2e);

    buildingSeed++;
  };

  // ---- Archetype 5: Elevated Observation Podium + Twin Glass Pavilions + Telemetry Pylon ----
  const addElevatedPodium = (xStart, width, depth, side) => {
    const cx = xStart + width * 0.5;
    const frontZ = side > 0 ? NEAR_FACADE_Z : FAR_FACADE_Z;
    const inward = side > 0 ? -1 : 1;
    const faceRy = side > 0 ? Math.PI : 0;
    const podiumH = 4.6;
    const bodyCenterZ = frontZ - inward * (depth * 0.5);

    // Low-slung titanium podium base
    precastGeos.push(makeWorldBox(width, podiumH, depth - 0.4, cx, podiumH * 0.5, bodyCenterZ - inward * 0.25));
    glassGeos.push(makeBayPlane(width - 0.8, podiumH - 0.6, cx, podiumH * 0.5, frontZ - inward * 0.28, faceRy, BAY_W, podiumH, buildingSeed * 43));
    aeroCladdingGeos.push(makeWorldBox(width + 0.18, 0.34, depth + 0.4, cx, podiumH - 0.1, bodyCenterZ));
    pushLedBox(ledGeos, width - 0.6, 0.04, 0.05, cx, podiumH - 0.29, frontZ + inward * 0.16, 0x6ea8e5);

    // Observation deck glass parapet
    glassGeos.push(makeBayPlane(width - 0.6, 1.0, cx, podiumH + 0.5, frontZ + inward * 0.1, faceRy, 2.2, 1.0, buildingSeed * 47));
    mullionGeos.push(makeWorldBox(width - 0.4, 0.08, 0.08, cx, podiumH + 1.0, frontZ + inward * 0.1));

    // Twin setback glass lab pavilions separated by open court
    const pavW = (width - 3.6) * 0.5;
    const pavH = 7.2;
    const pavFrontZ = frontZ - inward * 2.0;
    const pavDepth = depth - 2.4;
    const pavCenterZ = pavFrontZ - inward * (pavDepth * 0.5);
    for (const px of [xStart + 0.6 + pavW * 0.5, xStart + width - 0.6 - pavW * 0.5]) {
      precastGeos.push(makeWorldBox(pavW, pavH, pavDepth - 0.3, px, podiumH + pavH * 0.5, pavCenterZ - inward * 0.2));
      glassGeos.push(makeBayPlane(pavW - 0.4, pavH - 0.4, px, podiumH + pavH * 0.5, pavFrontZ - inward * 0.12, faceRy, BAY_W, BAY_H, buildingSeed * 53));
      aeroCladdingGeos.push(makeWorldBox(pavW + 0.15, 0.28, pavDepth, px, podiumH + pavH, pavCenterZ));
    }

    // Central slender 15 m vertical telemetry pylon mast + --signal beacon tip
    mullionGeos.push(makeWorldBox(0.22, 15.0, 0.22, cx, 7.5, frontZ - inward * 1.1));
    pushLedBox(ledGeos, 0.26, 0.35, 0.26, cx, 15.15, frontZ - inward * 1.1, 0xc8ff2e);

    buildingSeed++;
  };

  // ---- Place 8 Futuristic Wings Along Both Extended Corridor Sides (x in [-63.2, +63.2]) ----
  // Zero closure walls at x = +/-43: the street opens cleanly to the cyber-night horizon.
  const nearLayout = [
    { w: 15.6, fn: (x, w) => addElevatedPodium(x, w - 0.45, 9.6, 1) },
    { w: 14.4, fn: (x, w) => addAeroMonolith(x, w - 0.45, 9.4, 6, 1, 0x8ec5ff) },
    { w: 15.6, fn: (x, w) => addTieredArcology(x, w - 0.45, 9.2, 4, 1) }, // anchors Skywalk West (-27.5)
    { w: 16.4, fn: (x, w) => addCantileverLab(x, w - 0.45, 9.0, 3, 1) },
    { w: 16.8, fn: (x, w) => addAeroMonolith(x, w - 0.45, 9.5, 5, 1, 0xc8ff2e) },
    { w: 15.6, fn: (x, w) => addCantileverLab(x, w - 0.45, 9.2, 4, 1) }, // anchors Skywalk East (+26.5)
    { w: 15.6, fn: (x, w) => addTieredArcology(x, w - 0.45, 9.2, 5, 1) },
    { w: 16.4, fn: (x, w) => addElevatedPodium(x, w - 0.45, 9.6, 1) },
  ];

  const farLayout = [
    { w: 16.0, fn: (x, w) => addAeroMonolith(x, w - 0.45, 9.4, 5, -1, 0x8ec5ff) },
    { w: 14.8, fn: (x, w) => addCantileverLab(x, w - 0.45, 9.2, 4, -1) },
    { w: 15.6, fn: (x, w) => addAeroMonolith(x, w - 0.45, 9.5, 5, -1, 0xc8ff2e) }, // anchors Skywalk West (-27.5)
    { w: 16.4, fn: (x, w) => addTieredArcology(x, w - 0.45, 9.2, 4, -1) },
    { w: 16.0, fn: (x, w) => addCantileverLab(x, w - 0.45, 9.0, 4, -1) },
    { w: 16.4, fn: (x, w) => addTieredArcology(x, w - 0.45, 9.2, 5, -1) }, // anchors Skywalk East (+26.5)
    { w: 15.2, fn: (x, w) => addAeroMonolith(x, w - 0.45, 9.4, 6, -1, 0x8ec5ff) },
    { w: 16.0, fn: (x, w) => addElevatedPodium(x, w - 0.45, 9.6, -1) },
  ];

  for (const row of [nearLayout, farLayout]) {
    let cursorX = -63.2;
    for (const spec of row) {
      spec.fn(cursorX, spec.w);
      cursorX += spec.w;
    }
  }

  // Twin elevated skybridges well outside STAGE_CLEAR (x = -27.5 and x = +26.5, y >= 8.4 m)
  addSkywalk(-27.5, 8.4, 3.4, 3.6);
  addSkywalk(26.5, 9.6, 3.4, 3.6);

  const precastGeo = mergeBucket(precastGeos, tracker);
  const mullionGeo = mergeBucket(mullionGeos, tracker);
  const aeroCladdingGeo = mergeBucket(aeroCladdingGeos, tracker);
  const ledGeo = mergeBucket(ledGeos, tracker, true);
  const glassGeo = mergeBucket(glassGeos, tracker);

  const precastMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x828b9c,
      map: textures.precast.map,
      normalMap: textures.precast.normalMap,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.84,
      metalness: 0.08,
      envMapIntensity: 0.98,
    }),
  );

  const mullionMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1d2330,
      roughness: 0.35,
      metalness: 0.78,
      envMapIntensity: 1.15,
    }),
  );

  const aeroCladdingMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x4f5a6d,
      roughness: 0.26,
      metalness: 0.75,
      envMapIntensity: 1.35,
    }),
  );

  const ledMat = tracker.trackMat(
    new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
    }),
  );

  const glassMat = createCurtainWallMaterial(tracker, sharedUniforms);

  for (const [geo, mat, name] of [
    [precastGeo, precastMat, 'campus-precast'],
    [mullionGeo, mullionMat, 'campus-mullions'],
    [aeroCladdingGeo, aeroCladdingMat, 'campus-aero-cladding'],
    [ledGeo, ledMat, 'campus-led-accents'],
    [glassGeo, glassMat, 'campus-curtain-glass'],
  ]) {
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    world.add(mesh);
  }

  // ---- Distant Cyber-Night Mega-Skyline, Crowns, Bands & Animated Beacons (4 InstancedMeshes) ----
  const towerCount = isSmallScreen ? 18 : 32;
  const towerGeo = tracker.trackGeo(createTaperedTowerGeometry(0.84));
  const towerMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.52,
      metalness: 0.38,
      envMapIntensity: 0.85,
    }),
  );
  const towers = new THREE.InstancedMesh(towerGeo, towerMat, towerCount);
  towers.name = 'skyline-towers';
  towers.castShadow = false;
  towers.receiveShadow = false;

  // Stepped crown + offset spire unit for tallest ~65% of mega-towers
  const crownBase = new THREE.BoxGeometry(0.68, 2.2, 0.68);
  crownBase.translate(0, 1.1, 0);
  const crownSpire = new THREE.BoxGeometry(0.11, 5.4, 0.11);
  crownSpire.translate(0.16, 4.9, -0.14);
  const crownGeo = mergeBucket([crownBase, crownSpire], tracker);
  const crownMat = tracker.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2c3648,
      roughness: 0.40,
      metalness: 0.62,
      envMapIntensity: 1.1,
    }),
  );
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, towerCount);
  crowns.name = 'skyline-crowns';
  crowns.castShadow = false;
  crowns.receiveShadow = false;

  const bandGeo = tracker.trackGeo(new THREE.BoxGeometry(1.015, 0.32, 1.015));
  const bandMat = tracker.trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
    }),
  );
  const maxBands = towerCount * 3;
  const bands = new THREE.InstancedMesh(bandGeo, bandMat, maxBands);
  bands.name = 'skyline-bands';
  bands.castShadow = false;
  bands.receiveShadow = false;

  const beaconGeo = tracker.trackGeo(new THREE.BoxGeometry(0.32, 0.32, 0.32));
  const beaconPhases = new Float32Array(towerCount);
  const beaconMat = tracker.trackMat(
    new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          uTime: sharedUniforms.uTime,
          uGymWash: sharedUniforms.uGymWash,
        },
      ]),
      vertexShader: /* glsl */ `
        attribute float aPhase;
        varying vec3 vBeaconColor;
        varying float vPhase;
        #include <fog_pars_vertex>
        void main() {
          vPhase = aPhase;
          vBeaconColor = vec3(1.0);
          #ifdef USE_INSTANCING_COLOR
            vBeaconColor = instanceColor;
          #endif
          vec4 localPos = vec4(position, 1.0);
          #ifdef USE_INSTANCING
            localPos = instanceMatrix * localPos;
          #endif
          vec4 mvPosition = modelViewMatrix * localPos;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uGymWash;
        varying vec3 vBeaconColor;
        varying float vPhase;
        #include <fog_pars_fragment>
        void main() {
          float pulse = 0.25 + 0.75 * pow(0.5 + 0.5 * sin(uTime * 1.6 + vPhase), 4.0);
          float alpha = pulse * (1.0 - uGymWash * 0.92);
          gl_FragColor = vec4(vBeaconColor * (0.75 + 0.75 * pulse), alpha);
          #include <fog_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false,
      fog: true,
    }),
  );
  const beacons = new THREE.InstancedMesh(beaconGeo, beaconMat, towerCount);
  beacons.name = 'skyline-beacons';
  beacons.castShadow = false;
  beacons.receiveShadow = false;

  const dummy = new THREE.Object3D();
  const cTmp = new THREE.Color();
  const towerShades = [0x2a3548, 0x344259, 0x232d3e, 0x3b4b64];
  const bandShades = [0xcfdcf0, 0x7aa4d4, 0x8db624];
  const beaconShades = [0xff4b4b, 0x8ec5ff, 0xc8ff2e];

  let bandIdx = 0;
  let crownIdx = 0;
  let beaconIdx = 0;

  for (let i = 0; i < towerCount; i++) {
    // Last 4 slots: distant fog-attenuated street-vista silhouettes (|x| in [68.5, 74.5], z outside road [-9.8, -2.4])
    // Previous 4 slots: outer flank towers (|x| in [57, 67], z outside street [-19.4, +7.2])
    const isVista = i >= towerCount - 4;
    const isFlank = !isVista && i >= towerCount - 8;
    let x;
    let z;
    let w;
    let d;
    let h;
    if (isVista) {
      const vIdx = i - (towerCount - 4);
      const xSign = vIdx % 2 === 0 ? -1 : 1;
      const zSign = vIdx < 2 ? -1 : 1;
      x = xSign * (68.8 + rng() * 5.2);
      z = zSign < 0 ? -14.5 - rng() * 8.5 : 4.2 + rng() * 7.8;
      w = 6.4 + rng() * 1.4;
      d = 6.4 + rng() * 1.4;
      h = 36 + rng() * 34;
    } else if (isFlank) {
      const fIdx = i - (towerCount - 8);
      const xSign = fIdx % 2 === 0 ? -1 : 1;
      const zSign = fIdx < 2 ? -1 : 1;
      x = xSign * (57 + rng() * 10);
      z = zSign < 0 ? -24 - rng() * 12 : 12 + rng() * 14;
      w = 7.5 + rng() * 6.0;
      d = 7.5 + rng() * 6.0;
      h = 34 + rng() * 40;
    } else {
      const side = i % 2 === 0 ? -1 : 1;
      const mainCount = Math.max(2, towerCount - 8);
      x = -64 + (i / Math.max(1, mainCount - 1)) * 128 + (rng() - 0.5) * 5;
      x = Math.max(-68, Math.min(68, x));
      // Strictly behind FAR_FACADE_Z (-19.4 - 9.6 = -29.0) and NEAR_FACADE_Z (+7.2 + 9.6 = +16.8)
      z = side < 0 ? -32 - rng() * 16 : 20 + rng() * 22;
      w = 7.5 + rng() * 6.0;
      d = 7.5 + rng() * 6.0;
      h = 34 + rng() * 40;
    }

    const ry = (rng() - 0.5) * 0.08;

    dummy.position.set(x, 0, z);
    dummy.rotation.set(0, ry, 0);
    dummy.scale.set(w, h, d);
    dummy.updateMatrix();
    towers.setMatrixAt(i, dummy.matrix);
    towers.setColorAt(i, cTmp.setHex(towerShades[i % towerShades.length]));

    const numBands = 1 + (i % 3);
    for (let b = 0; b < numBands && bandIdx < maxBands; b++) {
      const frac = 0.62 + b * 0.14;
      const taper = 1 - (1 - 0.84) * frac;
      dummy.position.set(x, h * frac, z);
      dummy.rotation.set(0, ry, 0);
      dummy.scale.set(w * taper, 1, d * taper);
      dummy.updateMatrix();
      bands.setMatrixAt(bandIdx, dummy.matrix);
      bands.setColorAt(bandIdx, cTmp.setHex(bandShades[(i + b) % bandShades.length]).multiplyScalar(0.85));
      bandIdx++;
    }

    if (h > 44 || i % 3 === 0) {
      dummy.position.set(x, h, z);
      dummy.rotation.set(0, ry, 0);
      dummy.scale.set(w * 0.84, 1, d * 0.84);
      dummy.updateMatrix();
      crowns.setMatrixAt(crownIdx, dummy.matrix);
      crownIdx++;

      // Beacon mounted at top of offset spire (local x = +0.16 * w * 0.84, y = 7.7, z = -0.14 * d * 0.84)
      const cosR = Math.cos(ry);
      const sinR = Math.sin(ry);
      const lx = 0.16 * w * 0.84;
      const lz = -0.14 * d * 0.84;
      dummy.position.set(x + lx * cosR + lz * sinR, h + 7.7, z - lx * sinR + lz * cosR);
      dummy.rotation.set(0, ry, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      beacons.setMatrixAt(beaconIdx, dummy.matrix);
      beacons.setColorAt(beaconIdx, cTmp.setHex(beaconShades[beaconIdx % beaconShades.length]));
      beaconPhases[beaconIdx] = rng() * Math.PI * 2;
      beaconIdx++;
    }
  }

  bands.count = bandIdx;
  crowns.count = crownIdx;
  beacons.count = beaconIdx;
  beaconGeo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(beaconPhases, 1));

  towers.instanceMatrix.needsUpdate = true;
  if (towers.instanceColor) towers.instanceColor.needsUpdate = true;
  crowns.instanceMatrix.needsUpdate = true;
  bands.instanceMatrix.needsUpdate = true;
  if (bands.instanceColor) bands.instanceColor.needsUpdate = true;
  beacons.instanceMatrix.needsUpdate = true;
  if (beacons.instanceColor) beacons.instanceColor.needsUpdate = true;

  world.add(towers, crowns, bands, beacons);

  return {
    setGymWash(a) {
      ledMat.opacity = 1.0 - a * 0.88;
      bandMat.opacity = 1.0 - a * 0.88;
    },
  };
}
