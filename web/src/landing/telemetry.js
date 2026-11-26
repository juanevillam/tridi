// Physics telemetry rendered into the landing scene: radial/hexagonal floor calibration
// reticle with outward sensor pulse, ground contact rings, support polygon, CoM drop &
// Fresnel-rimmed CoM sphere, plus Redeploy v2 volumetric grid-scan & reconstruction particles.
import * as THREE from 'three';

const SIGNAL = 0xc8ff2e; // --signal in style.css
const SIGNAL_LAB = 0xc8ff2e; // keep luminous --signal in dark smoked-slate Lab Chamber (#131922)
const INK = 0xefede8; // --fg
const INK_LAB = 0xdce6f5; // crisp cool-white reticle on dark slate chamber
const GRID_M = 4.5; // reticle radius before fading out
const PULSE_EVERY_S = 3.2;
const PULSE_MPS = 2.2;
const FOOT_DOWN_M = 0.055;
const FEET = ['left_ankle_roll_link', 'right_ankle_roll_link'];
const PARTICLE_COUNT = 48;
const SCAN_HEIGHT_M = 1.48;

const gridMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uCenter: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uGymWash: { value: 0 },
      uInkDark: { value: new THREE.Color(INK) },
      uInkLab: { value: new THREE.Color(INK_LAB) },
      uSignal: { value: new THREE.Color(SIGNAL) },
      uSignalLab: { value: new THREE.Color(SIGNAL_LAB) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vFloor;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vFloor = world.xz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec2 uCenter;
      uniform float uTime;
      uniform float uOpacity;
      uniform float uGymWash;
      uniform vec3 uInkDark;
      uniform vec3 uInkLab;
      uniform vec3 uSignal;
      uniform vec3 uSignalLab;
      varying vec2 vFloor;

      const float TAU = 6.2831853;

      float ringAt(float d, float r, float dFw) {
        return 1.0 - clamp(abs(d - r) / (dFw * 1.15), 0.0, 1.0);
      }

      float angTick(float ang, float d, float halfN) {
        float s = sin(ang * halfN) * max(d, 0.25) / halfN;
        return 1.0 - clamp(abs(s) / max(fwidth(s) * 1.15, 1e-4), 0.0, 1.0);
      }

      float hexLattice(vec2 p) {
        vec2 r = vec2(1.0, 1.7320508);
        vec2 h = r * 0.5;
        vec2 a = mod(p, r) - h;
        vec2 b = mod(p - h, r) - h;
        vec2 gv = dot(a, a) < dot(b, b) ? a : b;
        float hd = max(abs(gv.x), dot(abs(gv), vec2(0.5, 0.8660254)));
        float edge = abs(0.5 - hd);
        return 1.0 - clamp(edge / max(fwidth(hd) * 1.15, 1e-4), 0.0, 1.0);
      }

      void main() {
        vec2 rel = vFloor - uCenter;
        float d = length(rel);
        float ang = atan(rel.y, rel.x);
        float dFw = max(fwidth(d), 1e-4);
        float fade = 1.0 - smoothstep(${(GRID_M * 0.3).toFixed(2)}, ${GRID_M.toFixed(2)}, d);

        // Concentric precision calibration arcs (1.20 m matches Gym ring)
        float quadGap = smoothstep(-0.10, 0.16, cos(ang * 4.0));
        float r06 = ringAt(d, 0.60, dFw);
        float r12 = ringAt(d, 1.20, dFw);
        float r18 = ringAt(d, 1.85, dFw) * quadGap;
        float r26 = ringAt(d, 2.60, dFw);
        float r36 = ringAt(d, 3.60, dFw) * quadGap;
        float arcs = max(max(r06 * 0.65, r12), max(r18 * 0.72, max(r26 * 0.88, r36 * 0.55)));

        // 5 deg / 15 deg / 45 deg radial tick bands
        float band12Minor = step(1.14, d) * step(d, 1.20);
        float band26Minor = step(2.54, d) * step(d, 2.60);
        float ticks5 = angTick(ang, d, 36.0) * max(band12Minor, band26Minor);

        float band12Med = step(1.09, d) * step(d, 1.27);
        float band26Med = step(2.49, d) * step(d, 2.67);
        float ticks15 = angTick(ang, d, 12.0) * max(band12Med, band26Med);

        float bandMajor = max(
          step(0.58, d) * step(d, 0.72),
          max(step(1.04, d) * step(d, 1.34), step(2.42, d) * step(d, 2.74))
        );
        float ticks45 = angTick(ang, d, 4.0) * bandMajor;

        // Hexagonal calibration lattice & 60 deg spokes
        float hexMask = smoothstep(0.32, 0.65, d) * (1.0 - smoothstep(1.95, 2.95, d));
        float hex = hexLattice(rel * 1.54) * hexMask;
        float hexSpokes = angTick(ang, d, 3.0) * smoothstep(0.35, 0.55, d) * (1.0 - smoothstep(2.6, 3.5, d));

        // Outward sensor pulse
        float front = mod(uTime, ${PULSE_EVERY_S.toFixed(2)}) * ${PULSE_MPS.toFixed(2)};
        float pulse = exp(-pow((d - front) / 0.048, 2.0));
        float wake = (1.0 - smoothstep(0.0, 1.15, front - d)) * step(d, front);

        vec3 ink = mix(uInkDark, uInkLab, uGymWash);
        vec3 sig = mix(uSignal, uSignalLab, uGymWash);

        float baseWeight = clamp(arcs * 0.75 + ticks5 * 0.24 + ticks15 * 0.52 + hex * 0.16 + hexSpokes * 0.18, 0.0, 1.0);
        float accentWeight = clamp(ticks45 * 0.78 + pulse * 0.68, 0.0, 1.0);
        vec3 col = mix(ink, sig, clamp(accentWeight * (0.55 + 0.45 * pulse), 0.0, 1.0));

        float baseAlpha = mix(0.24, 0.40, uGymWash);
        float alpha = (baseWeight * (baseAlpha + 0.34 * wake) + accentWeight * mix(0.42, 0.58, uGymWash)) * fade * uOpacity;
        gl_FragColor = vec4(col, alpha);
        #include <colorspace_fragment>
      }`,
  });

const comBallMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uOpacity: { value: 0 },
      uGymWash: { value: 0 },
      uSignal: { value: new THREE.Color(SIGNAL) },
      uCore: { value: new THREE.Color(0xf0ffba) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vViewN;
      varying vec3 vViewPos;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mv.xyz;
        vViewN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      uniform vec3 uSignal;
      uniform vec3 uCore;
      varying vec3 vViewN;
      varying vec3 vViewPos;
      void main() {
        float ndotv = clamp(abs(dot(normalize(vViewN), normalize(vViewPos))), 0.0, 1.0);
        float rim = pow(1.0 - ndotv, 1.8);
        float core = pow(ndotv, 2.2) * 0.55;
        vec3 col = mix(uSignal, uCore, clamp(rim * 0.6 + core, 0.0, 1.0));
        float alpha = clamp(rim * 0.95 + core * 0.45 + 0.12, 0.0, 1.0) * uOpacity;
        gl_FragColor = vec4(col, alpha);
        #include <colorspace_fragment>
      }`,
  });

const footReticleMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    uniforms: {
      uOpacity: { value: 0 },
      uSignal: { value: new THREE.Color(SIGNAL) },
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

      float ringAt(float d, float r, float fw) {
        return 1.0 - clamp(abs(d - r) / (fw * 1.35), 0.0, 1.0);
      }

      void main() {
        float d = length(vLocal);
        if (d > 0.145) discard;
        float fw = max(fwidth(d), 0.002);
        float outer = ringAt(d, 0.095, fw);
        float inner = ringAt(d, 0.036, fw) * 0.72;
        float dotCore = exp(-pow(d / 0.016, 2.0)) * 0.55;
        float aura = exp(-pow((d - 0.095) / 0.018, 2.0)) * 0.24;
        float alpha = clamp(outer * 0.92 + inner + dotCore + aura, 0.0, 1.0) * uOpacity;
        if (alpha < 0.004) discard;
        gl_FragColor = vec4(uSignal, alpha);
        #include <colorspace_fragment>
      }`,
  });

const comFloorReticleMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    uniforms: {
      uOpacity: { value: 0 },
      uSignal: { value: new THREE.Color(SIGNAL) },
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

      float ringAt(float d, float r, float fw) {
        return 1.0 - clamp(abs(d - r) / (fw * 1.35), 0.0, 1.0);
      }

      void main() {
        float d = length(vLocal);
        if (d > 0.15) discard;
        float fw = max(fwidth(d), 0.002);
        float ring = ringAt(d, 0.058, fw);

        // Razor-thin static crosshair X matching the perimeter reticle hairlines
        vec2 rot = vec2(vLocal.x + vLocal.y, vLocal.y - vLocal.x) * 0.70710678;
        float xA = 1.0 - clamp(abs(rot.x) / max(fwidth(rot.x) * 1.25, 0.002), 0.0, 1.0);
        float xB = 1.0 - clamp(abs(rot.y) / max(fwidth(rot.y) * 1.25, 0.002), 0.0, 1.0);
        float crossMask = max(xA, xB) * step(0.022, d) * step(d, 0.115);

        float dotCore = exp(-pow(d / 0.012, 2.0)) * 0.65;
        float aura = exp(-pow((d - 0.058) / 0.016, 2.0)) * 0.22;
        float alpha = clamp(ring * 0.92 + crossMask * 0.78 + dotCore + aura, 0.0, 1.0) * uOpacity;
        if (alpha < 0.004) discard;
        gl_FragColor = vec4(uSignal, alpha);
        #include <colorspace_fragment>
      }`,
  });

const redeployReticleMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uPhase: { value: 0 },
      uOpacity: { value: 0 },
      uGymWash: { value: 0 },
      uSignal: { value: new THREE.Color(SIGNAL) },
      uInkLab: { value: new THREE.Color(INK_LAB) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vLocal;
      void main() {
        vLocal = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uProgress;
      uniform float uPhase;
      uniform float uOpacity;
      uniform float uGymWash;
      uniform vec3 uSignal;
      uniform vec3 uInkLab;
      varying vec2 vLocal;

      const float TAU = 6.2831853;

      float ringAt(float d, float r, float fw) {
        return 1.0 - clamp(abs(d - r) / (fw * 1.25), 0.0, 1.0);
      }

      void main() {
        float d = length(vLocal);
        if (d > 0.78) discard;
        float ang = atan(vLocal.y, vLocal.x);
        float fw = max(fwidth(d), 1e-4);

        float spinA = ang + uTime * 1.8;
        float spinB = ang - uTime * 1.3;
        float arcInner = ringAt(d, 0.44, fw) * smoothstep(-0.2, 0.15, cos(spinA * 3.0));
        float arcMid = ringAt(d, 0.56, fw) * smoothstep(-0.25, 0.12, cos(spinB * 4.0));
        float arcOuter = ringAt(d, 0.68, fw);

        float tickSin = sin(spinB * 12.0) * max(d, 0.25) / 12.0;
        float ticks24 = (1.0 - clamp(abs(tickSin) / max(fwidth(tickSin) * 1.2, 1e-4), 0.0, 1.0)) * step(0.49, d) * step(d, 0.55);

        float hexRad = max(abs(vLocal.x), dot(abs(vLocal), vec2(0.5, 0.8660254)));
        float hexRing = 1.0 - clamp(abs(hexRad - 0.36) / max(fwidth(hexRad) * 1.25, 1e-4), 0.0, 1.0);

        float waveR = uPhase < 0.5 ? mix(0.66, 0.22, uProgress) : mix(0.22, 0.72, uProgress);
        float wave = exp(-pow((d - waveR) / 0.045, 2.0)) * 0.65;

        float inkMask = clamp(arcOuter * 0.65 + ticks24 * 0.60, 0.0, 1.0);
        float sigMask = clamp(arcInner + arcMid * 0.9 + hexRing * 0.75 + wave, 0.0, 1.0);
        vec3 structCol = mix(uSignal, uInkLab, uGymWash * 0.85);
        vec3 col = mix(structCol, uSignal, clamp(sigMask / max(sigMask + inkMask * 0.5, 1e-4), 0.0, 1.0));
        float alpha = clamp(inkMask * 0.75 + sigMask, 0.0, 1.0) * uOpacity;
        gl_FragColor = vec4(col, alpha);
        #include <colorspace_fragment>
      }`,
  });

const scanVolumeMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uScanY: { value: 0.7 },
      uPhase: { value: 0 },
      uProgress: { value: 0 },
      uOpacity: { value: 0 },
      uGymWash: { value: 0 },
      uSignal: { value: new THREE.Color(SIGNAL) },
      uRimLab: { value: new THREE.Color(0x243010) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vLocalPos;
      varying vec3 vViewN;
      varying vec3 vViewPos;
      void main() {
        vLocalPos = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mv.xyz;
        vViewN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uScanY;
      uniform float uPhase;
      uniform float uProgress;
      uniform float uOpacity;
      uniform float uGymWash;
      uniform vec3 uSignal;
      uniform vec3 uRimLab;
      varying vec3 vLocalPos;
      varying vec3 vViewN;
      varying vec3 vViewPos;

      void main() {
        float h = vLocalPos.y + ${(SCAN_HEIGHT_M * 0.5).toFixed(3)};
        float ang = atan(vLocalPos.z, vLocalPos.x);

        // Laser scan slice + directional wake
        float dy = h - uScanY;
        float beam = exp(-pow(dy / 0.028, 2.0));
        float trailDir = uPhase < 0.5 ? 1.0 : -1.0;
        float wake = smoothstep(0.32, 0.0, dy * trailDir) * step(0.0, dy * trailDir);

        // Holographic 4 cm horizontal strata & 24 vertical ribs
        float strata = smoothstep(0.62, 0.96, sin(h * 157.08 - uTime * 3.0));
        float ribs = smoothstep(0.76, 0.98, cos(ang * 24.0 + uTime * 0.9));
        float lattice = clamp(strata * 0.55 + ribs * 0.65, 0.0, 1.0);

        float ndotv = clamp(abs(dot(normalize(vViewN), normalize(vViewPos))), 0.0, 1.0);
        float fresnel = pow(1.0 - ndotv, 1.5);
        float endFade = smoothstep(0.0, 0.08, h) * smoothstep(${SCAN_HEIGHT_M.toFixed(2)}, ${(SCAN_HEIGHT_M - 0.1).toFixed(2)}, h);

        float field = beam + wake * (0.28 + 0.58 * lattice) + fresnel * 0.20 * (0.35 + 0.65 * wake);
        vec3 baseCol = mix(uSignal, uRimLab, uGymWash * (1.0 - clamp(beam + wake * 0.7, 0.0, 1.0)) * 0.65);
        vec3 col = mix(baseCol, uSignal, clamp(beam * 1.4 + lattice * wake * 0.7, 0.0, 1.0));
        float alpha = clamp(field * endFade, 0.0, 0.95) * uOpacity;
        gl_FragColor = vec4(col, alpha);
        #include <colorspace_fragment>
      }`,
  });

const particleMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uScanY: { value: 0.5 },
      uPhase: { value: 0 },
      uProgress: { value: 0 },
      uOpacity: { value: 0 },
      uSignal: { value: new THREE.Color(SIGNAL) },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aSeed;
      attribute float aSpeed;
      uniform float uTime;
      uniform float uScanY;
      uniform float uPhase;
      uniform float uProgress;
      varying float vLife;

      void main() {
        float cycle = fract(aSeed.z + uTime * aSpeed * 0.55 + uProgress * 0.9);
        float angle = aSeed.x + (uTime * 1.6 + cycle * 4.2) * (uPhase < 0.5 ? -1.0 : 1.0);
        float rad = mix(0.24, 0.50, aSeed.y) + (uPhase < 0.5 ? cycle * 0.10 : (1.0 - cycle) * 0.06);
        float yOff = uPhase < 0.5 ? cycle * 0.55 : (cycle - 0.5) * 0.55;
        float py = clamp(uScanY + yOff, 0.03, ${(SCAN_HEIGHT_M + 0.12).toFixed(2)});
        vec3 pos = vec3(cos(angle) * rad, py, sin(angle) * rad);
        vLife = sin(cycle * 3.14159265);
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = clamp((24.0 + 18.0 * aSeed.y) / max(-mv.z, 0.5), 3.0, 16.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      uniform vec3 uSignal;
      varying float vLife;

      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float soft = smoothstep(0.5, 0.12, d);
        gl_FragColor = vec4(uSignal, soft * vLife * uOpacity);
        #include <colorspace_fragment>
      }`,
  });

/**
 * Draws the robot's physics into its scene.
 * @returns {{ update(visible: boolean, options?: { com?: boolean, gymWash?: number }): void, setGymWash(amount: number): void, setRedeploy(state: object | null): void, dispose(): void }}
 */
export function dressTelemetry(view) {
  const { scene } = view.viewer;
  const group = new THREE.Group();
  group.name = 'landing-telemetry';
  scene.add(group);

  const grid = new THREE.Mesh(new THREE.PlaneGeometry(2 * GRID_M, 2 * GRID_M), gridMaterial());
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = 0.004;
  grid.renderOrder = 2;
  group.add(grid);

  const footMat = footReticleMaterial();
  const comFloorMat = comFloorReticleMaterial();
  const xray = comBallMaterial();
  const lineMaterial = new THREE.LineDashedMaterial({
    color: SIGNAL,
    dashSize: 0.035,
    gapSize: 0.025,
    transparent: true,
    depthTest: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
  });

  const onFloor = (mesh) => {
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 3;
    return mesh;
  };

  const footGeo = new THREE.PlaneGeometry(0.30, 0.30);
  const feet = FEET.map(() => {
    const foot = onFloor(new THREE.Mesh(footGeo, footMat));
    foot.position.y = 0.006;
    group.add(foot);
    return foot;
  });
  const support = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), lineMaterial);
  support.renderOrder = 3;
  group.add(support);

  const com = new THREE.Group();
  const comFloor = onFloor(new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), comFloorMat));
  comFloor.position.y = 0.007;
  const comBall = new THREE.Mesh(new THREE.SphereGeometry(0.024, 18, 14), xray);
  comBall.renderOrder = 4;
  const drop = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), lineMaterial);
  drop.renderOrder = 3;
  com.add(comBall, drop);
  group.add(com, comFloor);

  // Redeploy v2: volumetric grid-scan cylinder, floor polar/hex reticle, 3-ring instanced pulse, helical particles
  const redeployGroup = new THREE.Group();
  redeployGroup.name = 'redeploy-v2';
  redeployGroup.visible = false;

  const reticleMat = redeployReticleMaterial();
  const redeployReticle = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), reticleMat);
  redeployReticle.rotation.x = -Math.PI / 2;
  redeployReticle.position.y = 0.008;
  redeployReticle.renderOrder = 4;

  const scanVolMat = scanVolumeMaterial();
  const scanVolume = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, SCAN_HEIGHT_M, 40, 24, true), scanVolMat);
  scanVolume.position.y = SCAN_HEIGHT_M * 0.5;
  scanVolume.renderOrder = 5;

  const scanRingMat = new THREE.MeshBasicMaterial({
    color: SIGNAL,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.NormalBlending,
  });
  const scanRingGeo = new THREE.TorusGeometry(0.46, 0.007, 8, 64);
  scanRingGeo.rotateX(Math.PI / 2);
  const scanRings = new THREE.InstancedMesh(scanRingGeo, scanRingMat, 3);
  scanRings.renderOrder = 5;

  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const seeds = new Float32Array(PARTICLE_COUNT * 3);
  const speeds = new Float32Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    seeds[i * 3] = (i / PARTICLE_COUNT) * Math.PI * 2;
    seeds[i * 3 + 1] = ((i * 7) % PARTICLE_COUNT) / PARTICLE_COUNT;
    seeds[i * 3 + 2] = ((i * 13) % PARTICLE_COUNT) / PARTICLE_COUNT;
    speeds[i] = 0.75 + 0.65 * (((i * 17) % PARTICLE_COUNT) / PARTICLE_COUNT);
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
  particleGeo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  const particleMat = particleMaterial();
  const reconParticles = new THREE.Points(particleGeo, particleMat);
  reconParticles.frustumCulled = false;
  reconParticles.renderOrder = 6;

  redeployGroup.add(redeployReticle, scanVolume, scanRings, reconParticles);
  group.add(redeployGroup);

  const materials = [grid.material, footMat, comFloorMat, xray, lineMaterial, reticleMat, scanVolMat, scanRingMat, particleMat];
  const startedAt = performance.now();
  const elapsedS = () => (performance.now() - startedAt) * 0.001;
  let opacity = 0;
  let gymWash = 0;
  let lastIsG1 = Boolean(view?.sim) && (!view.sim.policy?.robot || view.sim.policy.robot === 'unitree_g1');
  const p = new THREE.Vector3();
  const ringDummy = new THREE.Object3D();
  const down = [false, false];
  const toThree = (target, [x, y, z]) => target.set(x, z, -y); // MuJoCo (x, y, z) -> Three.js (x, z, -y)

  function applyGymWash(amount) {
    const a = Math.max(0, Math.min(1, Number.isFinite(amount) ? amount : 0));
    gymWash = a;
    grid.material.uniforms.uGymWash.value = a;
    xray.uniforms.uGymWash.value = a;
    reticleMat.uniforms.uGymWash.value = a;
    scanVolMat.uniforms.uGymWash.value = a;
  }

  return {
    setGymWash(amount = 0) {
      applyGymWash(amount);
    },
    update(visible, { com: showCom = true, gymWash: nextWash } = {}) {
      if (nextWash !== undefined) applyGymWash(nextWash);
      opacity += ((visible ? 1 : 0) - opacity) * 0.08;
      const sim = view?.sim;
      const isG1 = Boolean(sim) && (!sim.policy?.robot || sim.policy.robot === 'unitree_g1');
      lastIsG1 = isG1;
      const showHud = opacity > 0.01 && isG1;
      group.visible = showHud || redeployGroup.visible;
      grid.visible = showHud;
      if (!showHud) {
        feet[0].visible = false;
        feet[1].visible = false;
        support.visible = false;
        com.visible = false;
        comFloor.visible = false;
        return;
      }
      grid.material.uniforms.uTime.value = elapsedS();
      grid.material.uniforms.uOpacity.value = opacity;
      footMat.uniforms.uOpacity.value = (0.85 + 0.10 * gymWash) * opacity;
      comFloorMat.uniforms.uOpacity.value = (0.88 + 0.10 * gymWash) * opacity;
      xray.uniforms.uOpacity.value = opacity;
      lineMaterial.opacity = (0.58 + 0.14 * gymWash) * opacity;

      toThree(p, sim.bodyPosition('pelvis'));
      grid.position.set(p.x, grid.position.y, p.z);
      grid.material.uniforms.uCenter.value.set(p.x, p.z);

      FEET.forEach((name, i) => {
        toThree(p, sim.bodyPosition(name));
        down[i] = p.y < FOOT_DOWN_M;
        feet[i].visible = down[i];
        feet[i].position.set(p.x, feet[i].position.y, p.z);
      });
      support.visible = down[0] && down[1];
      if (support.visible) {
        support.geometry.attributes.position.setXYZ(0, feet[0].position.x, 0.008, feet[0].position.z);
        support.geometry.attributes.position.setXYZ(1, feet[1].position.x, 0.008, feet[1].position.z);
        support.geometry.attributes.position.needsUpdate = true;
        support.computeLineDistances();
      }

      const c = sim.data.subtree_com;
      toThree(p, [c[0], c[1], c[2]]);
      com.visible = comFloor.visible = showCom;
      com.position.copy(p);
      drop.geometry.attributes.position.setY(1, 0.008 - p.y);
      drop.geometry.attributes.position.needsUpdate = true;
      drop.computeLineDistances();
      comFloor.position.set(p.x, comFloor.position.y, p.z);
    },
    setRedeploy(state) {
      if (!state) {
        redeployGroup.visible = false;
        reticleMat.uniforms.uOpacity.value = 0;
        reticleMat.uniforms.uProgress.value = 0;
        scanVolMat.uniforms.uOpacity.value = 0;
        scanVolMat.uniforms.uProgress.value = 0;
        scanRingMat.opacity = 0;
        particleMat.uniforms.uOpacity.value = 0;
        particleMat.uniforms.uProgress.value = 0;
        group.visible = opacity > 0.01 && lastIsG1;
        return;
      }
      const { phase, progress = 0, x = 0, y = 0 } = state;
      const t = Math.max(0, Math.min(1, progress));
      const nowTime = elapsedS();
      redeployGroup.visible = true;
      redeployGroup.position.set(x, 0, -y);
      group.visible = true;

      let phaseIdx = 2;
      let scanY = 1.38;
      let reticleOp = 0;
      let scanOp = 0;
      let ringOp = 0;
      let partOp = 0;
      let reticleScale = 1;

      if (phase === 'dematerialize') {
        phaseIdx = 0;
        const ease = 1 - (1 - t) * (1 - t);
        scanY = 0.72 - 0.68 * ease;
        reticleScale = 0.92 + 0.14 * ease;
        reticleOp = 0.88 * Math.sin(t * Math.PI * 0.5);
        scanOp = 0.92 * (1 - 0.2 * t);
        ringOp = 0.95 * (1 - 0.25 * t);
        partOp = 0.9 * (1 - 0.2 * t);
      } else if (phase === 'materialize') {
        phaseIdx = 1;
        const ease = 1 - Math.pow(1 - t, 3);
        scanY = 0.03 + 1.38 * ease;
        reticleScale = 1.06 - 0.06 * ease;
        reticleOp = 0.92;
        scanOp = 0.96 * Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.5);
        ringOp = 0.96 * Math.sin(Math.min(1, t * 1.2) * Math.PI * 0.5);
        partOp = 0.95 * (1 - 0.15 * t);
      } else {
        phaseIdx = 2;
        const fade = 1 - t;
        scanY = 1.40 + 0.08 * t;
        reticleScale = 1 + 0.08 * t;
        reticleOp = 0.9 * fade;
        scanOp = 0.65 * fade;
        ringOp = 0.72 * fade;
        partOp = 0.75 * fade;
      }

      redeployReticle.scale.setScalar(reticleScale);
      reticleMat.uniforms.uTime.value = nowTime;
      reticleMat.uniforms.uPhase.value = phaseIdx;
      reticleMat.uniforms.uProgress.value = t;
      reticleMat.uniforms.uOpacity.value = reticleOp;

      scanVolMat.uniforms.uTime.value = nowTime;
      scanVolMat.uniforms.uScanY.value = scanY;
      scanVolMat.uniforms.uPhase.value = phaseIdx;
      scanVolMat.uniforms.uProgress.value = t;
      scanVolMat.uniforms.uOpacity.value = scanOp;

      scanRingMat.opacity = ringOp;
      const ringOffsets = [0, -0.11, 0.11];
      const ringScales = [1.0, 0.94, 1.04];
      for (let i = 0; i < 3; i++) {
        const ry = Math.max(0.02, Math.min(SCAN_HEIGHT_M - 0.02, scanY + ringOffsets[i]));
        ringDummy.position.set(0, ry, 0);
        ringDummy.rotation.set(0, 0, 0);
        ringDummy.scale.setScalar(ringScales[i]);
        ringDummy.updateMatrix();
        scanRings.setMatrixAt(i, ringDummy.matrix);
      }
      scanRings.instanceMatrix.needsUpdate = true;

      particleMat.uniforms.uTime.value = nowTime;
      particleMat.uniforms.uScanY.value = scanY;
      particleMat.uniforms.uPhase.value = phaseIdx;
      particleMat.uniforms.uProgress.value = t;
      particleMat.uniforms.uOpacity.value = partOp;
    },
    dispose() {
      scene.remove(group);
      group.traverse((o) => {
        if (o.isInstancedMesh) o.dispose?.();
        o.geometry?.dispose();
      });
      materials.forEach((m) => m.dispose());
    },
  };
}
