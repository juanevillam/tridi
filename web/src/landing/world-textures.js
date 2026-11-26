// Procedural PBR texture synthesis and session-scoped <canvas> cache for the landing world.
// Uses single-pass ImageData heightfields + Sobel normals so generation takes < 20 ms once per
// session and creates zero external network requests.
import * as THREE from 'three';

const canvasCache = new Map();

export function createDeterministicRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createResourceTracker() {
  const geos = new Set();
  const mats = new Set();
  const texs = new Set();

  const trackGeo = (g) => {
    if (g) geos.add(g);
    return g;
  };
  const trackMat = (m) => {
    if (m) mats.add(m);
    return m;
  };
  const trackTex = (t) => {
    if (t) texs.add(t);
    return t;
  };

  const disposeAll = (rootGroup) => {
    if (rootGroup) {
      rootGroup.traverse((obj) => {
        if (obj.isInstancedMesh && typeof obj.dispose === 'function') {
          obj.dispose();
        }
        if (obj.geometry) geos.add(obj.geometry);
        if (obj.material) {
          const list = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const mat of list) {
            if (!mat) continue;
            mats.add(mat);
            for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'bumpMap', 'emissiveMap', 'alphaMap']) {
              if (mat[key]) texs.add(mat[key]);
            }
          }
        }
      });
    }
    for (const tex of texs) tex.dispose();
    for (const mat of mats) mat.dispose();
    for (const geo of geos) geo.dispose();
    texs.clear();
    mats.clear();
    geos.clear();
  };

  return { trackGeo, trackMat, trackTex, disposeAll };
}

function cachedCanvas(key, width, height, drawFn) {
  let canvas = canvasCache.get(key);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    drawFn(canvas, ctx, width, height);
    canvasCache.set(key, canvas);
  }
  return canvas;
}

// Fast tileable 2D integer hash -> [0, 1)
function hash2(ix, iy, period, seed) {
  const wx = ((ix % period) + period) % period;
  const wy = ((iy % period) + period) % period;
  let h = (Math.imul(wx, 374761393) + Math.imul(wy, 668265263) + Math.imul(seed, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function tileValueNoise(u, v, freq, seed) {
  const x = u * freq;
  const y = v * freq;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const n00 = hash2(x0, y0, freq, seed);
  const n10 = hash2(x0 + 1, y0, freq, seed);
  const n01 = hash2(x0, y0 + 1, freq, seed);
  const n11 = hash2(x0 + 1, y0 + 1, freq, seed);
  const nx0 = n00 + (n10 - n00) * sx;
  const nx1 = n01 + (n11 - n01) * sx;
  return nx0 + (nx1 - nx0) * sy;
}

function tileFbm(u, v, baseFreq, octaves, seed) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let freq = baseFreq;
  for (let i = 0; i < octaves; i++) {
    sum += amp * tileValueNoise(u, v, freq, seed + i * 97);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function clampByte(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

function buildNormalCanvas(key, heights, size, strength) {
  return cachedCanvas(key, size, size, (_canvas, ctx) => {
    const img = ctx.createImageData(size, size);
    const data = img.data;
    const mask = size - 1;
    for (let y = 0; y < size; y++) {
      const ym = (y - 1) & mask;
      const yp = (y + 1) & mask;
      for (let x = 0; x < size; x++) {
        const xm = (x - 1) & mask;
        const xp = (x + 1) & mask;
        const tl = heights[ym * size + xm];
        const t = heights[ym * size + x];
        const tr = heights[ym * size + xp];
        const l = heights[y * size + xm];
        const r = heights[y * size + xp];
        const bl = heights[yp * size + xm];
        const b = heights[yp * size + x];
        const br = heights[yp * size + xp];

        const dx = (tr + 2 * r + br - (tl + 2 * l + bl)) * strength;
        const dy = (bl + 2 * b + br - (tl + 2 * t + tr)) * strength;
        const dz = 1.0;
        const invLen = 1 / Math.hypot(dx, dy, dz);
        const idx = (y * size + x) * 4;
        data[idx] = clampByte((-dx * invLen * 0.5 + 0.5) * 255);
        // Canvas Y increases downward (-v), so -dH/dv = +dy matches Three.js OpenGL +Y/+v tangent space
        data[idx + 1] = clampByte((dy * invLen * 0.5 + 0.5) * 255);
        data[idx + 2] = clampByte((dz * invLen * 0.5 + 0.5) * 255);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
}

// Single-pass dark matte carbon-asphalt (roughness 0.78..0.93, zero mirror puddles)
function synthesizeAsphalt() {
  const size = 256;
  const mapKey = 'asphalt:map:v2';
  const roughKey = 'asphalt:rough:v2';
  const normKey = 'asphalt:norm:v2';

  const needMap = !canvasCache.has(mapKey);
  const needRough = !canvasCache.has(roughKey);
  const needNorm = !canvasCache.has(normKey);

  if (needMap || needRough || needNorm) {
    const heights = needNorm ? new Float32Array(size * size) : null;
    const mapCanvas = needMap ? document.createElement('canvas') : null;
    const roughCanvas = needRough ? document.createElement('canvas') : null;
    let mapCtx = null;
    let roughCtx = null;
    let mapImg = null;
    let roughImg = null;

    if (mapCanvas) {
      mapCanvas.width = mapCanvas.height = size;
      mapCtx = mapCanvas.getContext('2d');
      mapImg = mapCtx.createImageData(size, size);
    }
    if (roughCanvas) {
      roughCanvas.width = roughCanvas.height = size;
      roughCtx = roughCanvas.getContext('2d');
      roughImg = roughCtx.createImageData(size, size);
    }

    const md = mapImg?.data;
    const rd = roughImg?.data;
    for (let y = 0; y < size; y++) {
      const v = y / size;
      const wear = Math.exp(-Math.pow((v - 0.36) / 0.08, 2)) + Math.exp(-Math.pow((v - 0.64) / 0.08, 2));
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const macro = tileFbm(u, v, 4, 3, 11);
        const micro = tileValueNoise(u, v, 64, 37);
        const grain = micro * 0.65 + tileValueNoise(u, v, 128, 73) * 0.35;
        const px = y * size + x;
        const idx = px * 4;

        if (heights) heights[px] = grain * 0.72 + macro * 0.28;
        if (md) {
          const lum = 15 + grain * 10 + macro * 4 - wear * 2.0;
          md[idx] = clampByte(lum * 0.94);
          md[idx + 1] = clampByte(lum * 0.98);
          md[idx + 2] = clampByte(lum * 1.12);
          md[idx + 3] = 255;
        }
        if (rd) {
          const rough = Math.min(0.93, Math.max(0.78, 0.86 - wear * 0.07 + (micro - 0.5) * 0.08));
          const val = clampByte(rough * 255);
          rd[idx] = rd[idx + 1] = rd[idx + 2] = val;
          rd[idx + 3] = 255;
        }
      }
    }

    if (mapCanvas) {
      mapCtx.putImageData(mapImg, 0, 0);
      canvasCache.set(mapKey, mapCanvas);
    }
    if (roughCanvas) {
      roughCtx.putImageData(roughImg, 0, 0);
      canvasCache.set(roughKey, roughCanvas);
    }
    if (heights) buildNormalCanvas(normKey, heights, size, 1.35);
  }

  return {
    mapCanvas: canvasCache.get(mapKey),
    roughCanvas: canvasCache.get(roughKey),
    normalCanvas: canvasCache.get(normKey),
  };
}

// Single-pass architectural basalt sidewalk pavers (shared symmetrically by near & far sidewalks)
function synthesizePlaza() {
  const size = 256;
  const mapKey = 'plaza:map:v2';
  const roughKey = 'plaza:rough:v2';
  const normKey = 'plaza:norm:v2';

  const needMap = !canvasCache.has(mapKey);
  const needRough = !canvasCache.has(roughKey);
  const needNorm = !canvasCache.has(normKey);

  if (needMap || needRough || needNorm) {
    const heights = needNorm ? new Float32Array(size * size) : null;
    const mapCanvas = needMap ? document.createElement('canvas') : null;
    const roughCanvas = needRough ? document.createElement('canvas') : null;
    let mapCtx = null;
    let roughCtx = null;
    let mapImg = null;
    let roughImg = null;

    if (mapCanvas) {
      mapCanvas.width = mapCanvas.height = size;
      mapCtx = mapCanvas.getContext('2d');
      mapImg = mapCtx.createImageData(size, size);
    }
    if (roughCanvas) {
      roughCanvas.width = roughCanvas.height = size;
      roughCtx = roughCanvas.getContext('2d');
      roughImg = roughCtx.createImageData(size, size);
    }

    const md = mapImg?.data;
    const rd = roughImg?.data;
    for (let y = 0; y < size; y++) {
      const v = y / size;
      const cellY = Math.floor(v * 2);
      const localY = v * 2 - cellY;
      const distY = Math.min(localY, 1 - localY);
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const cellX = Math.floor(u * 2);
        const localX = u * 2 - cellX;
        const distX = Math.min(localX, 1 - localX);
        const groove = 1 - smoothstep(0.006, 0.016, Math.min(distX, distY));

        const slabTint = (hash2(cellX, cellY, 2, 101) - 0.5) * 4.5;
        const fbm = tileFbm(u, v, 8, 3, 55);
        const brush = tileValueNoise(u, v * 0.25, 32, 211) * 0.55 + fbm * 0.45;
        const speckle = tileValueNoise(u, v, 128, 313);
        const px = y * size + x;
        const idx = px * 4;

        if (heights) heights[px] = (1 - groove * 0.85) * (0.75 + brush * 0.18 + speckle * 0.07);
        if (md) {
          const base = 31 + slabTint + (brush - 0.5) * 7 + (speckle - 0.5) * 3.5;
          const lum = base * (1 - groove * 0.45);
          md[idx] = clampByte(lum * 0.96);
          md[idx + 1] = clampByte(lum * 0.98);
          md[idx + 2] = clampByte(lum * 1.05);
          md[idx + 3] = 255;
        }
        if (rd) {
          const rough = 0.72 + fbm * 0.12 + groove * 0.1;
          const val = clampByte(rough * 255);
          rd[idx] = rd[idx + 1] = rd[idx + 2] = val;
          rd[idx + 3] = 255;
        }
      }
    }

    if (mapCanvas) {
      mapCtx.putImageData(mapImg, 0, 0);
      canvasCache.set(mapKey, mapCanvas);
    }
    if (roughCanvas) {
      roughCtx.putImageData(roughImg, 0, 0);
      canvasCache.set(roughKey, roughCanvas);
    }
    if (heights) buildNormalCanvas(normKey, heights, size, 1.8);
  }

  return {
    mapCanvas: canvasCache.get(mapKey),
    roughCanvas: canvasCache.get(roughKey),
    normalCanvas: canvasCache.get(normKey),
  };
}

// Single-pass dark architectural precast concrete (map + normal only; uniform roughness keeps texture count <= 16)
function synthesizePrecast() {
  const size = 256;
  const mapKey = 'precast:map:v2';
  const normKey = 'precast:norm:v2';

  const needMap = !canvasCache.has(mapKey);
  const needNorm = !canvasCache.has(normKey);

  if (needMap || needNorm) {
    const heights = needNorm ? new Float32Array(size * size) : null;
    const mapCanvas = needMap ? document.createElement('canvas') : null;
    let mapCtx = null;
    let mapImg = null;
    if (mapCanvas) {
      mapCanvas.width = mapCanvas.height = size;
      mapCtx = mapCanvas.getContext('2d');
      mapImg = mapCtx.createImageData(size, size);
    }
    const md = mapImg?.data;

    for (let y = 0; y < size; y++) {
      const v = y / size;
      const panelY = (v * 4) % 1;
      const distY = Math.min(panelY, 1 - panelY);
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const panelX = (u * 2) % 1;
        const distX = Math.min(panelX, 1 - panelX);
        const seam = 1 - smoothstep(0.005, 0.015, Math.min(distX, distY));

        const tx = Math.min(Math.abs(panelX - 0.14), Math.abs(panelX - 0.86));
        const ty = Math.min(Math.abs(panelY - 0.22), Math.abs(panelY - 0.78));
        const tieHole = 1 - smoothstep(0.014, 0.026, Math.hypot(tx, ty * 0.5));

        const cloud = tileFbm(u, v, 4, 3, 409);
        const fine = tileValueNoise(u, v, 64, 503);
        const px = y * size + x;
        const idx = px * 4;

        if (heights) heights[px] = (1 - seam * 0.7 - tieHole * 0.4) * (0.7 + cloud * 0.2 + fine * 0.1);
        if (md) {
          const base = 42 + (cloud - 0.5) * 9 + (fine - 0.5) * 4;
          const lum = base * (1 - seam * 0.35 - tieHole * 0.25);
          md[idx] = clampByte(lum * 0.96);
          md[idx + 1] = clampByte(lum * 0.99);
          md[idx + 2] = clampByte(lum * 1.07);
          md[idx + 3] = 255;
        }
      }
    }

    if (mapCanvas) {
      mapCtx.putImageData(mapImg, 0, 0);
      canvasCache.set(mapKey, mapCanvas);
    }
    if (heights) buildNormalCanvas(normKey, heights, size, 1.5);
  }

  return {
    mapCanvas: canvasCache.get(mapKey),
    normalCanvas: canvasCache.get(normKey),
  };
}

function synthesizeBark() {
  const size = 256;
  const mapCanvas = cachedCanvas('bark:map:v2', size, size, (_c, ctx) => {
    const img = ctx.createImageData(size, size);
    const d = img.data;
    for (let y = 0; y < size; y++) {
      const v = y / size;
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const warp = tileFbm(u, v, 4, 2, 701) * 0.09;
        const ridge = tileFbm((u + warp) % 1, v * 0.35, 12, 3, 719);
        const grain = tileValueNoise(u, v, 48, 757);
        const val = Math.pow(ridge, 1.35) * 0.8 + grain * 0.2;
        const lum = 26 + val * 32;
        const idx = (y * size + x) * 4;
        d[idx] = clampByte(lum * 1.08);
        d[idx + 1] = clampByte(lum * 0.94);
        d[idx + 2] = clampByte(lum * 0.8);
        d[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
  return { mapCanvas };
}

function synthesizeTimber() {
  const size = 256;
  const mapKey = 'timber:map:v1';
  const normKey = 'timber:norm:v1';
  const needMap = !canvasCache.has(mapKey);
  const needNorm = !canvasCache.has(normKey);

  if (needMap || needNorm) {
    const heights = needNorm ? new Float32Array(size * size) : null;
    const mapCanvas = needMap ? document.createElement('canvas') : null;
    let mapCtx = null;
    let mapImg = null;
    if (mapCanvas) {
      mapCanvas.width = mapCanvas.height = size;
      mapCtx = mapCanvas.getContext('2d');
      mapImg = mapCtx.createImageData(size, size);
    }
    const md = mapImg?.data;
    const slats = 8;

    for (let y = 0; y < size; y++) {
      const v = y / size;
      const slatPos = (v * slats) % 1;
      const slatIdx = Math.floor(v * slats);
      const gap = 1 - smoothstep(0.04, 0.11, Math.min(slatPos, 1 - slatPos));
      const slatBias = (hash2(slatIdx, 0, slats, 811) - 0.5) * 14;
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const grain = tileFbm(u * 0.35, v * 4, 8, 3, 823 + slatIdx);
        const px = y * size + x;
        const idx = px * 4;
        if (heights) heights[px] = (1 - gap * 0.85) * (0.7 + grain * 0.3);
        if (md) {
          const lum = (74 + slatBias + (grain - 0.5) * 20) * (1 - gap * 0.72);
          md[idx] = clampByte(lum * 1.18);
          md[idx + 1] = clampByte(lum * 0.82);
          md[idx + 2] = clampByte(lum * 0.55);
          md[idx + 3] = 255;
        }
      }
    }

    if (mapCanvas) {
      mapCtx.putImageData(mapImg, 0, 0);
      canvasCache.set(mapKey, mapCanvas);
    }
    if (heights) buildNormalCanvas(normKey, heights, size, 1.9);
  }

  return {
    mapCanvas: canvasCache.get(mapKey),
    normalCanvas: canvasCache.get(normKey),
  };
}

function synthesizeLeafSpray() {
  const size = 512;
  return cachedCanvas('leaf:spray:v1', size, size, (_c, ctx) => {
    const rng = createDeterministicRng(4207);
    ctx.clearRect(0, 0, size, size);

    ctx.strokeStyle = '#3b3326';
    ctx.lineCap = 'round';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(256, 488);
    ctx.quadraticCurveTo(252, 340, 260, 128);
    ctx.stroke();

    const subTwigs = [
      [255, 390, 145, 290],
      [255, 360, 368, 262],
      [257, 275, 138, 175],
      [258, 245, 372, 152],
      [259, 170, 210, 74],
      [259, 165, 314, 78],
    ];
    ctx.lineWidth = 3.5;
    for (const [x0, y0, x1, y1] of subTwigs) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) * 0.5, (y0 + y1) * 0.5 + 16, x1, y1);
      ctx.stroke();
    }

    const drawLeaf = (cx, cy, angle, len, wid, shade) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      const g = ctx.createLinearGradient(0, 0, 0, -len);
      const rBase = Math.round(92 * shade);
      const gBase = Math.round(122 * shade);
      const bBase = Math.round(80 * shade);
      g.addColorStop(0, `rgb(${rBase - 14}, ${gBase - 16}, ${bBase - 10})`);
      g.addColorStop(0.55, `rgb(${rBase}, ${gBase}, ${bBase})`);
      g.addColorStop(1, `rgb(${rBase + 16}, ${gBase + 18}, ${bBase + 10})`);
      ctx.fillStyle = g;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-wid, -len * 0.28, -wid * 0.72, -len * 0.75, 0, -len);
      ctx.bezierCurveTo(wid * 0.72, -len * 0.75, wid, -len * 0.28, 0, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = `rgba(${rBase + 26}, ${gBase + 28}, ${bBase + 16}, 0.55)`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.lineTo(0, -len * 0.88);
      ctx.stroke();
      ctx.restore();
    };

    const anchors = [
      [254, 410, -0.95], [258, 398, 0.95],
      [205, 342, -1.2], [162, 305, -0.75], [146, 290, -0.45],
      [308, 315, 1.15], [352, 275, 0.72], [368, 260, 0.42],
      [204, 232, -1.15], [158, 195, -0.8], [138, 175, -0.45],
      [310, 205, 1.15], [354, 168, 0.78], [372, 152, 0.42],
      [235, 128, -0.65], [210, 76, -0.25],
      [285, 124, 0.65], [314, 78, 0.25],
      [259, 130, 0.04], [257, 210, -0.22], [262, 295, 0.28],
    ];

    for (const [x, y, ang] of anchors) {
      const len = 78 + rng() * 38;
      const wid = len * (0.28 + rng() * 0.08);
      const shade = 0.82 + rng() * 0.34;
      drawLeaf(x, y, ang + (rng() - 0.5) * 0.24, len, wid, shade);
    }
  });
}

// Neutral white elliptical pool texture tinted per-instance via InstancedMesh.setColorAt()
function synthesizeEllipticalPool() {
  const w = 256;
  const h = 128;
  return cachedCanvas('lamp:ellipticalPool:v2', w, h, (_c, ctx) => {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(128, 64);
    ctx.scale(1.0, 0.5);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 124);
    g.addColorStop(0.0, 'rgba(255, 255, 255, 0.28)');
    g.addColorStop(0.28, 'rgba(255, 255, 255, 0.14)');
    g.addColorStop(0.62, 'rgba(255, 255, 255, 0.035)');
    g.addColorStop(0.9, 'rgba(255, 255, 255, 0.0)');
    g.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(-128, -128, 256, 256);
    ctx.restore();
  });
}

function synthesizeDrainGrate() {
  const w = 128;
  const h = 64;
  return cachedCanvas('road:drainGrate:v1', w, h, (_c, ctx) => {
    ctx.fillStyle = '#090b0f';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#3c434f';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);

    // 9 diagonal storm-grate bars with metallic specular rim
    const bars = 9;
    const step = (w - 16) / bars;
    for (let i = 0; i < bars; i++) {
      const bx = 8 + i * step;
      ctx.fillStyle = '#4b5362';
      ctx.beginPath();
      ctx.moveTo(bx, 6);
      ctx.lineTo(bx + 6, 6);
      ctx.lineTo(bx + 2, h - 6);
      ctx.lineTo(bx - 4, h - 6);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#737d8f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx, 6);
      ctx.lineTo(bx + 6, 6);
      ctx.stroke();
    }
  });
}

function synthesizeCrosswalk() {
  const w = 512;
  const h = 512;
  return cachedCanvas('road:crosswalk:v1', w, h, (_c, ctx) => {
    ctx.clearRect(0, 0, w, h);
    const rng = createDeterministicRng(909);
    const stripes = 8;
    const step = h / stripes;
    for (let i = 0; i < stripes; i++) {
      const y = i * step + step * 0.22;
      const bh = step * 0.56;
      ctx.fillStyle = 'rgba(182, 188, 198, 0.58)';
      ctx.fillRect(28, y, w - 56, bh);
      for (let k = 0; k < 28; k++) {
        ctx.fillStyle = 'rgba(20, 22, 28, 0.18)';
        ctx.fillRect(28 + rng() * (w - 56), y + rng() * bh, 8 + rng() * 24, 2 + rng() * 5);
      }
    }
  });
}

function synthesizeCorridorTrack() {
  const w = 512;
  const h = 64;
  return cachedCanvas('plaza:corridorTrack:v2', w, h, (_c, ctx) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(165, 172, 184, 0.22)';
    ctx.fillRect(0, 28, w, 3);
    // Restrained --signal (#c8ff2e) metric ticks every 1 m (16 px per meter over 32 m strip)
    const pxPerM = w / 32;
    for (let m = 0; m <= 32; m++) {
      const x = Math.round(m * pxPerM);
      const major = m % 4 === 0;
      ctx.fillStyle = major ? 'rgba(200, 255, 46, 0.42)' : 'rgba(200, 255, 46, 0.22)';
      ctx.fillRect(x, major ? 12 : 20, major ? 2 : 1, major ? 20 : 12);
    }
  });
}

export function createTextureSet(renderer, tracker) {
  const maxAniso = Math.min(8, renderer?.capabilities?.getMaxAnisotropy?.() || 4);
  const makeTex = (canvas, { srgb = false, rx = 1, ry = 1, repeat = true, aniso = maxAniso } = {}) => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.wrapS = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    tex.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    tex.repeat.set(rx, ry);
    tex.anisotropy = aniso;
    tex.needsUpdate = true;
    return tracker.trackTex(tex);
  };

  const asphalt = synthesizeAsphalt();
  const plaza = synthesizePlaza();
  const precast = synthesizePrecast();
  const bark = synthesizeBark();
  const timber = synthesizeTimber();

  // Total CanvasTexture instances: 3 + 3 + 2 + 1 + 2 + 1 + 1 + 1 + 1 + 1 = 16 (<= 16 budget)
  return {
    asphalt: {
      map: makeTex(asphalt.mapCanvas, { srgb: true, rx: 13, ry: 1 }),
      normalMap: makeTex(asphalt.normalCanvas, { srgb: false, rx: 13, ry: 1 }),
      roughnessMap: makeTex(asphalt.roughCanvas, { srgb: false, rx: 13, ry: 1 }),
    },
    plaza: {
      map: makeTex(plaza.mapCanvas, { srgb: true, rx: 52, ry: 3.2 }),
      normalMap: makeTex(plaza.normalCanvas, { srgb: false, rx: 52, ry: 3.2 }),
      roughnessMap: makeTex(plaza.roughCanvas, { srgb: false, rx: 52, ry: 3.2 }),
    },
    precast: {
      map: makeTex(precast.mapCanvas, { srgb: true, rx: 1, ry: 1 }),
      normalMap: makeTex(precast.normalCanvas, { srgb: false, rx: 1, ry: 1 }),
    },
    bark: {
      map: makeTex(bark.mapCanvas, { srgb: true, rx: 1, ry: 1 }),
    },
    timber: {
      map: makeTex(timber.mapCanvas, { srgb: true, rx: 2, ry: 1 }),
      normalMap: makeTex(timber.normalCanvas, { srgb: false, rx: 2, ry: 1 }),
    },
    leaf: {
      map: makeTex(synthesizeLeafSpray(), { srgb: true, repeat: false, aniso: 4 }),
    },
    ellipticalPool: {
      map: makeTex(synthesizeEllipticalPool(), { srgb: true, repeat: false, aniso: 1 }),
    },
    drainGrate: {
      map: makeTex(synthesizeDrainGrate(), { srgb: true, repeat: false, aniso: 4 }),
    },
    crosswalk: {
      map: makeTex(synthesizeCrosswalk(), { srgb: true, repeat: false }),
    },
    corridorTrack: {
      map: makeTex(synthesizeCorridorTrack(), { srgb: true, repeat: false }),
    },
  };
}
