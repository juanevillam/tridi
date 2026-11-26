// Clean, minimal holographic 3D push arrow in --signal (#c8ff2e).
// Pure 3D silhouette (slender shaft + crisp cone head with subtle Fresnel glow) — zero extra lines or clutter.
// Shared by the landing's Hero / Tridi Gym (screens/home.js) and Studio robot panes (robot-pane.js).
import * as THREE from 'three';

const SIGNAL = 0xc8ff2e; // --signal in style.css
const CORE_HOT = 0xefffb5;
const ARROW_S = 0.85; // stays visible 0.85 s after push impulse (push lasts 0.1 s)
const BASE_TIP_Y = 0.62;

function makeHoloArrowMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uOpacity: { value: 0 },
      uSignal: { value: new THREE.Color(SIGNAL) },
      uCore: { value: new THREE.Color(CORE_HOT) },
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
        float rim = pow(1.0 - ndotv, 1.55);
        vec3 col = mix(uSignal, uCore, clamp(rim * 0.55 + 0.18, 0.0, 1.0));
        float alpha = (0.64 + 0.36 * rim) * uOpacity;
        gl_FragColor = vec4(col, alpha);
        #include <colorspace_fragment>
      }`,
  });
}

/**
 * Adds the (hidden) clean 3D push arrow to `scene`.
 * @returns {{ point(view, size?: number, opts?: { forceN?: number }): void, update(): void, hide(): void, dispose(): void }}
 */
export function createPushArrow(scene) {
  const arrow = new THREE.Group();
  arrow.name = 'push-vector';
  arrow.visible = false;

  const bodyGroup = new THREE.Group();
  bodyGroup.name = 'push-body';

  const holoMat = makeHoloArrowMaterial();
  const shaftGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.42, 16);
  const shaft = new THREE.Mesh(shaftGeo, holoMat);
  shaft.name = 'push-shaft';
  shaft.position.y = 0.21;
  shaft.renderOrder = 7;

  const headGeo = new THREE.ConeGeometry(0.072, 0.21, 20);
  const head = new THREE.Mesh(headGeo, holoMat);
  head.name = 'push-head';
  head.position.y = 0.525;
  head.renderOrder = 7;

  bodyGroup.add(shaft, head);
  arrow.add(bodyGroup);
  scene.add(arrow);

  let pushedAt = -Infinity;
  const tip = new THREE.Vector3();
  const along = new THREE.Vector3(1, 0, 0);
  const UP = new THREE.Vector3(0, 1, 0);

  return {
    point(view, size = 1, opts = {}) {
      const sim = view?.sim;
      if (!sim?.data) return;
      const force = sim.data.xfrc_applied;
      const xpos = sim.data.xpos;
      const i = sim.pushBodyId ?? 0;

      const fx = force ? force[6 * i] : 0;
      const fy = force ? force[6 * i + 1] : 0;
      const fLen = Math.hypot(fx, fy);
      if (fLen > 1e-6 && Number.isFinite(fLen)) {
        along.set(fx / fLen, 0, -fy / fLen); // MuJoCo (x, y, z) -> Three.js (x, z, -y)
      } else {
        along.set(1, 0, 0);
      }

      const rawForceN = opts?.forceN ?? (sim.lastPushNewtons > 0 ? sim.lastPushNewtons : fLen || 250);
      const safeRawForceN = Number.isFinite(rawForceN) ? rawForceN : 250;
      const forceN = Math.max(50, Math.min(600, safeRawForceN));
      const fn = Math.max(0, Math.min(1, (forceN - 100) / 400));

      // Normalize legacy Studio callers (robot-pane.js) that pre-scale 2-arg `size` by clamp(forceN/200, 0.6, 1.5).
      const sRaw = Number.isFinite(size) && size > 0 ? size : 1;
      const legacyScale = Math.max(0.6, Math.min(1.5, safeRawForceN / 200));
      const s = opts?.forceN === undefined && Math.abs(sRaw - legacyScale) < 1e-6 ? 1 : sRaw;
      const lenScale = 0.72 + 0.68 * fn;
      const radScale = 0.85 + 0.35 * fn;

      bodyGroup.scale.set(radScale, lenScale, radScale);

      const px = xpos?.[3 * i] ?? 0;
      const py = xpos?.[3 * i + 1] ?? 0;
      const pz = xpos?.[3 * i + 2] ?? 0.95;
      tip.set(px, pz, -py).addScaledVector(along, -0.15);

      arrow.scale.setScalar(s);
      arrow.quaternion.setFromUnitVectors(UP, along);
      arrow.position.copy(tip).addScaledVector(along, -BASE_TIP_Y * lenScale * s);
      pushedAt = performance.now();
    },
    update() {
      const t = (performance.now() - pushedAt) / 1000;
      const u = t / ARROW_S;
      if (u < 0 || u >= 1 || !Number.isFinite(u)) {
        arrow.visible = false;
        return;
      }
      arrow.visible = true;
      const tail = Math.max(0, (u - 0.25) / 0.75);
      const fade = 1 - tail * tail;

      holoMat.uniforms.uOpacity.value = fade * 0.94;
    },
    hide() {
      pushedAt = -Infinity;
      arrow.visible = false;
    },
    dispose() {
      scene.remove(arrow);
      shaftGeo.dispose();
      headGeo.dispose();
      holoMat.dispose();
    },
  };
}
