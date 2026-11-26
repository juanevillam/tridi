// Public API of physics/ for the web app: give it a canvas and it loads MuJoCo and the G1,
// simulates in real time and draws every frame until dispose().
import { Vector3 } from 'three';
import { ensureModelFiles, loadG1 } from './load.js';
import { LOOP_BLEND_S, motionDuration, retargetClipAsync, sampleLoopStart, sampleMotion, smoothForDisplay, toHandPoints } from './motion.js';
import { createPolicy } from './policy.js';
import { createPoseTracker } from './pose.js';
import { createRetargeter } from './retarget.js';
import { createRootTracker } from './root.js';
import { createLeveler } from './level.js';
import { createClearance } from './clearance.js';
import { createRobotPoseFilter, OneEuroFilter } from './filters.js';
import { createFingerSolver, createHandActuatorHook } from './fingers.js';
import { RobotView } from './viewer.js';
import { HELD_OBJECT_SCENE, placeXml, SCENE_ORDER } from './scenes.js';
import { middleValues, sceneFile as worldScene, windForce, windSpeed, WORLD_ORDER } from './worlds.js';

export { HELD_OBJECT_SCENE, SIT_CHAIR_SCENE } from './scenes.js';
export { sampleMotion } from './motion.js';
export {
  getComponent,
  getPreset,
  HARDWARE_CATALOG,
  listComponents,
  registerComponent,
  removeComponent,
  validateHardwarePinout,
} from '../components/index.js';
export { classifyStlMeshes, generateMujocoXml, parseArduinoSketch } from './assembler.js';
export {
  buildOpenRouterPayload,
  DEFAULT_OPENROUTER_MODEL,
  estimateOpenRouterCostUsd,
  parseJsonLoose,
  sanitizeAiPidSpec,
} from './pid_schema.js';
export {
  convertNodesToStrictDxf,
  extractBlueprintFromUpload,
  extractEmbeddedJpegFromPdfBytes,
  extractTextFromPdfBytes,
  generateIsaEngineeringDocs,
  generatePidMujocoXml,
  generatePlcFlatFile,
  generatePlcIoCsv,
  ISA_STANDARD,
  parseDxfPid,
  PID_SAMPLE_DXFS,
  PILOT_PLANT_HYDROMET_SPEC,
} from './pid_assembler.js';
export { buildPidDiagramLayout, renderPidSchematicSvg } from './pid_diagram.js';

export const ROBOTS = [
  { id: 'g1', robot: 'unitree_g1', vertical: 'humanoids', name: 'Unitree G1 (29 DOF + Inspire 5 dedos)' },
  { id: 'h1', robot: 'unitree_h1', vertical: 'humanoids', name: 'Unitree H1 (19 DOF, open-source)' },
  { id: 'luigi_lab4', robot: 'luigi_lab4', vertical: 'rovers', name: 'Robot Explorador Lab IV — Luigi (Arduino UNO + Cuello Servo SG90 + HC-SR04)' },
  { id: 'luigi', robot: 'luigi_lab3', vertical: 'rovers', name: 'Robot Explorador Lab III — Luigi (Arduino UNO + HC-SR04 + APDS-9960)' },
  { id: 'factory_cell', robot: 'factory_cell', vertical: 'industrial', name: 'Celda Industrial de Empaque y Clasificación (Cinta + Pistón + Selladora)' },
];

const CUSTOM_SCENE_PREFIXES = ['unitree_h1/', 'luigi_lab3/', 'luigi_lab4/', 'factory_cell/'];
const isCustomScenePath = (scenePath = '') => CUSTOM_SCENE_PREFIXES.some((p) => scenePath.startsWith(p));

// The fingers' smoothing: faster than the body's (ROBOT_POSE_FILTER, 1.5 Hz) because fingers open
// and close in a fraction of a second, and they are only drawn (no feet to keep planted).
const FINGER_FILTER = { minCutoff: 3, beta: 0.5 };
// The hand model misses a hand for a frame or two now and then (motion blur): the fingers hold
// that long before opening.
const FINGERS_HOLD_S = 0.4;

// physics/worlds/*.json, in display order.
const WORLD_FILES = import.meta.glob('../worlds/*.json', { eager: true, import: 'default' });
export const WORLDS = Object.values(WORLD_FILES).sort((a, b) => WORLD_ORDER.indexOf(a.id) - WORLD_ORDER.indexOf(b.id));

// physics/scenes/*.json: places with furniture and loose objects (a kitchen, a warehouse, a sidewalk).
const SCENE_FILES = import.meta.glob('../scenes/*.json', { eager: true, import: 'default' });
export const SCENES = Object.values(SCENE_FILES).sort((a, b) => SCENE_ORDER.indexOf(a.id) - SCENE_ORDER.indexOf(b.id));

// The real-time ratio passed to onStats is averaged over this window so it reads steadily.
const STATS_WINDOW_S = 1;

// Module-level caches for policy bytes (.onnx), metadata/motion JSON, and smoothed display motions.
const onnxBytesCache = new Map();
const jsonAssetCache = new Map();
const smoothedMotionCache = new WeakMap();
const smoothedMotionSet = new WeakSet();

export function fetchCachedOnnxBytes(url) {
  if (!onnxBytesCache.has(url)) {
    onnxBytesCache.set(
      url,
      fetch(url)
        .then(async (res) => {
          if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
          return new Uint8Array(await res.arrayBuffer());
        })
        .catch((err) => {
          onnxBytesCache.delete(url);
          throw err;
        }),
    );
  }
  return onnxBytesCache.get(url);
}

export function fetchCachedJson(url) {
  if (!jsonAssetCache.has(url)) {
    jsonAssetCache.set(
      url,
      fetch(url)
        .then(async (res) => {
          if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
          return res.json();
        })
        .catch((err) => {
          jsonAssetCache.delete(url);
          throw err;
        }),
    );
  }
  return jsonAssetCache.get(url);
}

function blendQpos(from, to, w, out, count = out.length) {
  for (let j = 0; j < 3; j++) out[j] = from[j] + (to[j] - from[j]) * w;
  // Shortest-path SLERP on pelvis quaternion (w, x, y, z) at indices 3..6
  const fw = from[3], fx = from[4], fy = from[5], fz = from[6];
  let tw = to[3], tx = to[4], ty = to[5], tz = to[6];
  let dot = fw * tw + fx * tx + fy * ty + fz * tz;
  if (dot < 0) {
    tw = -tw; tx = -tx; ty = -ty; tz = -tz;
    dot = -dot;
  }
  let s0, s1;
  if (dot > 0.9995) {
    s0 = 1 - w;
    s1 = w;
  } else {
    const theta0 = Math.acos(Math.min(1, dot));
    const sin0 = Math.sin(theta0);
    const theta = theta0 * w;
    const sinTheta = Math.sin(theta);
    s0 = Math.cos(theta) - (dot * sinTheta) / sin0;
    s1 = sinTheta / sin0;
  }
  out[3] = s0 * fw + s1 * tw;
  out[4] = s0 * fx + s1 * tx;
  out[5] = s0 * fy + s1 * ty;
  out[6] = s0 * fz + s1 * tz;
  const norm = Math.hypot(out[3], out[4], out[5], out[6]) || 1;
  out[3] /= norm; out[4] /= norm; out[5] /= norm; out[6] /= norm;
  for (let j = 7; j < count; j++) out[j] = from[j] + (to[j] - from[j]) * w;
  return out;
}

function getSmoothedMotion(mujoco, model, motion, plantFeet) {
  if (smoothedMotionSet.has(motion)) return motion;
  let byOption = smoothedMotionCache.get(motion);
  if (!byOption) {
    byOption = new Map();
    smoothedMotionCache.set(motion, byOption);
  }
  const key = String(plantFeet);
  if (!byOption.has(key)) {
    const smoothed = smoothForDisplay(mujoco, model, motion, { plantFeet });
    smoothedMotionSet.add(smoothed);
    byOption.set(key, smoothed);
  }
  return byOption.get(key);
}

/**
 * @param canvas  a <canvas> sized by CSS; the view follows its size. It can be moved between
 *   elements (the WebGL context survives); while it is out of the page the robot pauses
 * @param options.onProgress  ({ done, total, bytes }) while MuJoCo and the robot download
 * @param options.onStats     ({ realtime, pelvisHeight, puppet }) once per second while playing;
 *   `puppet` is true while the robot copies a person (no dynamics, so `realtime` is 0)
 * @param options.mirror      when copying a person, move like their reflection (default: raise
 *   your right hand and the arm on the same side of the screen goes up) or like them
 * @param options.theme       scene colors { background, ground, gridMajor, gridMinor }; any left out
 *   keep the dark defaults of viewer.js
 */
export async function createSimView(canvas, { onProgress, onStats, mirror = true, theme } = {}) {
  const sim = await loadG1(onProgress);
  const view = new RobotView(sim, canvas, theme);
  // The first draw compiles the shaders (about a second); keep it out of the timing below.
  view.render();

  let speed = 1;
  let playing = true;
  // The RobotMotion being played, if any: { motion, duration, loop, offset }, and where it is (s).
  let clip = null;
  let clipTime = 0;
  let blend = null;
  const row = new Float64Array(sim.model.nq); // the pose being shown (the robot alone: 36 values)
  const lastRow = new Float64Array(sim.model.nq); // a clip's last pose, while it starts over
  let handSpecs = null;
  let handSpecLoading = null;
  let handHook = null;
  let bodyQposMap = null;
  let puppetRow = null;
  let frameId = 0;
  let last = performance.now();
  let stats = { wall: 0, sim: 0 };

  let disposed = false;
  let policySeq = 0;
  let worldSeq = 0;
  let placeSeq = 0;
  let opChain = Promise.resolve();
  const enqueueOp = (fn) => {
    const run = opChain.then(fn, fn);
    opChain = run.catch(() => {});
    return run;
  };

  function toSimQpos(srcRow) {
    if (!bodyQposMap) return srcRow;
    if (srcRow.length === sim.model.nq) {
      puppetRow.set(srcRow);
      return puppetRow;
    }
    puppetRow.set(sim.data.qpos);
    for (let i = 0; i < 7; i++) puppetRow[i] = srcRow[i];
    for (let i = 0; i < bodyQposMap.length; i++) {
      const [srcIdx, dstIdx] = bodyQposMap[i];
      puppetRow[dstIdx] = srcRow[srcIdx];
    }
    return puppetRow;
  }

  function cancelBlend(result = false) {
    if (!blend) return;
    const active = blend;
    blend = null;
    active.resolve?.(result);
  }

  async function frame(now) {
    try {
      const wall = Math.max(0, (now - last) / 1000); // the first frame's timestamp can predate `last`
      last = now;
      // A canvas outside the page (the web app keeps one robot and moves its canvas between
      // screens) is neither simulated nor drawn: the robot waits where it was, at no GPU cost.
      if (!canvas.isConnected) {
        frameId = requestAnimationFrame(frame);
        return;
      }
      if (blend) {
        if (playing) blend.elapsed += wall * speed;
        const u = blend.duration > 0 ? Math.min(1, blend.elapsed / blend.duration) : 1;
        const w = u * u * (3 - 2 * u);
        const rawTo = typeof blend.target === 'function' ? blend.target(now) : blend.target;
        const toQ = bodyQposMap && rawTo.length !== blend.out.length ? toSimQpos(rawTo) : rawTo;
        const count = Math.min(blend.from.length, toQ.length, blend.out.length);
        blendQpos(blend.from, toQ, w, blend.out, count);
        sim.puppet(count === blend.out.length ? blend.out : blend.out.subarray(0, count));
        if (u >= 1) {
          const done = blend;
          blend = null;
          if (done.release) sim.releasePuppet({ resetPolicy: true, syncPrevious: done.syncPrevious });
          done.resolve?.(true);
        }
      } else if (clip) {
        // Same clock as the web's skeleton (wall time x speed), so both stay in step.
        if (playing && clip.autoAdvance) {
          clipTime = clip.loop ? (clipTime + wall * speed) % clip.duration : Math.min(clipTime + wall * speed, clip.duration);
        }
        // Started over (by its own clock or by seek() from the page's): ease in from the last pose
        // instead of jumping to the first (sampleLoopStart).
        if (clip.loop && clipTime < clip.shown - clip.duration / 2) clip.wrapped = true;
        if (clipTime >= LOOP_BLEND_S) clip.wrapped = false;
        clip.shown = clipTime;
        if (clip.wrapped) sampleLoopStart(clip.motion, clipTime, row, lastRow);
        else sampleMotion(clip.motion, clipTime, row);
        if (clip.offset) {
          row[0] += clip.offset[0];
          row[1] += clip.offset[1];
        }
        sim.puppet(toSimQpos(row));
        if (clip.motion.hands) copyMotionHands(clip.motion, clipTime, now);
      } else if (playing) {
        const before = sim.data.time;
        await sim.advance(wall * speed);
        stats.sim += sim.data.time - before;
        if (sim.policy?.isImitation && lastPolicy?.motion?.hands) {
          copyMotionHands(lastPolicy.motion, sim.policy.time(sim), now);
        }
      }
      if (disposed) return;
      stats.wall += wall;
      view.render();
      if (stats.wall >= STATS_WINDOW_S) {
        onStats?.({
          realtime: stats.sim / stats.wall,
          pelvisHeight: sim.bodyPosition('pelvis')[2],
          puppet: sim.puppeted,
          policy: sim.policy?.id ?? null,
        });
        stats = { wall: 0, sim: 0 };
      }
    } catch (error) {
      console.error(error); // keep drawing: one bad frame should not freeze the page
    }
    if (!disposed) frameId = requestAnimationFrame(frame);
  }
  frameId = requestAnimationFrame(frame);

  // Built on first use: only the camera and retargeting need them.
  let tracker = null;
  let retargeter = null;
  let smoother = null; // the live pose filter (filters.js createRobotPoseFilter)
  let rootTracker = null; // where the copying robot is on the floor (root.js)
  let leveler = null; // keeps the copying robot upright sideways (level.js)
  let clearance = null; // keeps its feet apart and hands out of its legs (clearance.js): { model, clear }
  // Retargeting runs on its own model of the G1: the kinematic chain and the soles, without meshes
  // (a model with them takes ~3 s to build in a browser, and would freeze the first camera frame).
  // It does not depend on which model the simulation shows, and its joints are laid out exactly
  // like the policy's model, so the result serves both.
  // The Dex3 hands drawn while copying a person (dex3.js, ~3 MB of meshes on the first mimic) and
  // their fingers from the person's (fingers.js), each joint smoothed like the body's.
  let dex3 = null;
  let dex3Loading = null;
  let fingerSolver = null;
  const fingerFilters = new Map();
  const lastHandAt = { left: -Infinity, right: -Infinity };
  let kinematic = null;
  const KINEMATICS = 'g1_kinematics.xml';
  const kinematicModel = () => (kinematic ??= sim.createModel(KINEMATICS, [KINEMATICS]));

  function ensureDex3() {
    if (dex3) return Promise.resolve(dex3);
    if (!dex3Loading) {
      dex3Loading = import('./dex3.js')
        .then(async ({ createDex3Hands, hands, inspireHands }) => {
          if (disposed) return null;
          handSpecs ??= { hands, inspireHands };
          if (handHook?.active) {
            const spec = !handHook.jointMap.has('left_hand_ring_0_joint') ? hands : inspireHands;
            handHook = createHandActuatorHook(sim.mujoco, sim.model, spec);
            fingerSolver = createFingerSolver(spec);
            return null;
          }
          fingerSolver ??= createFingerSolver(inspireHands);
          const rig = await createDex3Hands(view, sim, inspireHands);
          if (disposed) {
            rig.show(false);
            return null;
          }
          dex3 = rig;
          view.onFrame = () => dex3.update();
          if (handHook?.active) {
            dex3.show(false);
            return null;
          }
          return dex3;
        })
        .finally(() => {
          dex3Loading = null;
        });
    }
    return dex3Loading;
  }

  function refreshHandHook() {
    const initialSpec = handSpecs ? handSpecs.inspireHands : null;
    handHook = createHandActuatorHook(sim.mujoco, sim.model, initialSpec);
    if (handHook.active) {
      dex3?.show(false);
      if (handSpecs) {
        const spec = !handHook.jointMap.has('left_hand_ring_0_joint') ? handSpecs.hands : handSpecs.inspireHands;
        if (spec !== initialSpec) handHook = createHandActuatorHook(sim.mujoco, sim.model, spec);
        fingerSolver = createFingerSolver(spec);
      }
      const km = kinematicModel();
      if (sim.model.nq !== km.nq) {
        const OBJ_JOINT = sim.mujoco.mjtObj.mjOBJ_JOINT.value;
        const map = [];
        for (let j = 1; j < km.njnt; j++) {
          const name = sim.mujoco.mj_id2name(km, OBJ_JOINT, j);
          if (!name) continue;
          const dstJid = sim.mujoco.mj_name2id(sim.model, OBJ_JOINT, name);
          if (dstJid < 0) continue;
          const srcIdx = km.jnt_qposadr[j];
          const dstIdx = sim.model.jnt_qposadr[dstJid];
          if (srcIdx >= 0 && dstIdx >= 0) map.push([srcIdx, dstIdx]);
        }
        bodyQposMap = map;
        puppetRow = new Float64Array(sim.model.nq);
      } else {
        bodyQposMap = null;
        puppetRow = null;
      }
    } else {
      bodyQposMap = null;
      puppetRow = null;
      if (dex3 && handSpecs) fingerSolver = createFingerSolver(handSpecs.inspireHands);
    }
  }
  refreshHandHook();

  // Loads another model into the Simulation. Whatever was built from the old one goes: the
  // retargeter and the policy, and the drawn robot is rebuilt.
  function swapScene(sceneFile, keyName) {
    cancelBlend();
    sim.policy?.dispose();
    clip = null;
    baseScene = sceneFile;
    sim.load(place ? placeFile(sceneFile) : sceneFile, keyName);
    refreshHandHook();
    if (world) sim.applyWorld(conditions ?? middleValues(world)); // a new model starts from its own values
    view.rebuild();
    if (isCustomScenePath(baseScene)) dex3?.show(false);
  }

  // The world the robot is in (physics/worlds), null for the plain scene; and the last policy's
  // bytes and metadata, so changing to a world with another scene can bring the policy back.
  let world = null;
  // Values set by hand over the world's middle ones (setConditions), kept across model reloads.
  let conditions = null;
  let lastPolicy = null;
  // The place the robot is in (physics/scenes, or one detected in a video), null for an empty floor;
  // and the scene file under it (the policy's, or a world's), which the place is added to.
  let place = null;
  let baseScene = sim.sceneFile;

  // The MJCF of `base` with the current place in it, generated once per place and base and kept
  // with the model files, where the Simulation loads it from.
  function placeFile(base) {
    const slash = base.lastIndexOf('/');
    const dir = slash >= 0 ? base.slice(0, slash + 1) : '';
    const leaf = slash >= 0 ? base.slice(slash + 1) : base;
    const name = `${dir}place_${place.id}_${leaf}`;
    if (!sim.files[name]) {
      const text = (file) => new TextDecoder().decode(sim.files[file]);
      const baseXml = text(base);
      const robot = baseXml.match(/<include file="([^"]+)"/)?.[1];
      sim.files[name] = new TextEncoder().encode(placeXml(baseXml, robot ? text(`${dir}${robot}`) : '', place));
    }
    return name;
  }

  // After a new model: the last policy again, on it.
  async function restorePolicy() {
    if (!lastPolicy || disposed) return;
    if (lastPolicy.meta?.nu && sim.model.nu !== lastPolicy.meta.nu) return;
    const { loadOrt } = await import('./ort.js');
    if (disposed) return;
    const policy = await createPolicy(await loadOrt(), sim, lastPolicy.bytes, lastPolicy.meta, { motion: lastPolicy.motion });
    if (disposed) {
      policy.dispose();
      return;
    }
    sim.policy?.dispose();
    sim.policy = policy;
  }

  // Ends a clip or a camera copy and returns to the physical robot, standing.
  function stop() {
    cancelBlend();
    clip = null;
    reset();
  }

  // With a clip playing: back to its start. Otherwise the physical robot standing again (and
  // the next mimic() starts from the stand pose).
  function reset() {
    cancelBlend();
    if (clip) return void (clipTime = 0);
    sim.reset();
    dex3?.show(false);
    fingerSolver?.reset();
    fingerFilters.clear();
    retargeter?.delete();
    rootTracker?.delete();
    leveler?.delete();
    clearance?.model.delete();
    tracker = retargeter = smoother = rootTracker = leveler = clearance = null;
  }

  function copyMotionHands(motion, t, now) {
    if (!Array.isArray(motion.hands) || motion.hands.length === 0) return;
    const idx = Math.min(motion.hands.length - 1, Math.max(0, Math.floor(t * motion.fps)));
    const h = motion.hands[idx];
    copyFingers(
      {
        t: now / 1000,
        hands: h && {
          left: toHandPoints(h.left),
          right: toHandPoints(h.right),
        },
      },
      false,
    );
  }

  // The person's fingers onto physical finger actuators (when active on Dex3/Inspire MJCFs) or
  // onto the drawn 5-finger Inspire hands (models/inspire/hands.json) on 29-DoF models. A hand
  // the camera stopped seeing for FINGERS_HOLD_S opens back through its filters, instead of staying
  // frozen in a fist.
  const isValidHand = (person) =>
    Array.isArray(person) &&
    person.length >= 21 &&
    person.every((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));

  function copyFingers(pose, mirrored = mirror) {
    if (handHook?.active) {
      dex3?.show(false);
      if (!fingerSolver) {
        handSpecLoading ??= import('./dex3.js').then(({ hands, inspireHands }) => {
          handSpecs = { hands, inspireHands };
          if (handHook?.active) {
            const spec = !handHook.jointMap.has('left_hand_ring_0_joint') ? hands : inspireHands;
            handHook = createHandActuatorHook(sim.mujoco, sim.model, spec);
            fingerSolver = createFingerSolver(spec);
          }
        });
        return;
      }
      let written = 0;
      for (const robotSide of ['left', 'right']) {
        const person = pose.hands?.[mirrored ? (robotSide === 'left' ? 'right' : 'left') : robotSide];
        let angles = null;
        if (isValidHand(person)) {
          lastHandAt[robotSide] = pose.t;
          // Robot axes, as pose.js and retarget.js put the body's points (mirrored like them).
          const points = person.map((p) => new Vector3(-p.z, mirrored ? -p.x : p.x, -p.y));
          angles = fingerSolver.solve(robotSide, points);
          for (const [joint, value] of angles) {
            if (!fingerFilters.has(joint)) fingerFilters.set(joint, new OneEuroFilter(FINGER_FILTER));
            angles.set(joint, fingerFilters.get(joint).filter(value, pose.t));
          }
        } else if (pose.t - lastHandAt[robotSide] > FINGERS_HOLD_S) {
          angles = new Map();
          for (const [joint, f] of fingerFilters) if (joint.startsWith(robotSide)) angles.set(joint, f.filter(0, pose.t));
        }
        if (!angles || angles.size === 0) continue;
        if (sim.puppeted) {
          written += handHook.applyQpos(sim.data.qpos, robotSide, angles);
          handHook.applyCtrl(sim.data, robotSide, angles);
        } else {
          handHook.applyCtrl(sim.data, robotSide, angles);
        }
      }
      if (sim.puppeted && written > 0) sim.mujoco.mj_forward(sim.model, sim.data);
      return;
    }

    if (!dex3) {
      ensureDex3()
        .then((rig) => {
          if (!rig || disposed) return;
          rig.show(!handHook?.active && (!!tracker || !!clip?.motion.hands || !!(sim.policy?.isImitation && lastPolicy?.motion?.hands))); // still copying when the meshes arrived
        })
        .catch(() => {});
      return;
    }
    dex3.show(true);
    for (const robotSide of ['left', 'right']) {
      const person = pose.hands?.[mirrored ? (robotSide === 'left' ? 'right' : 'left') : robotSide];
      if (isValidHand(person)) {
        lastHandAt[robotSide] = pose.t;
        // Robot axes, as pose.js and retarget.js put the body's points (mirrored like them).
        const points = person.map((p) => new Vector3(-p.z, mirrored ? -p.x : p.x, -p.y));
        const angles = fingerSolver.solve(robotSide, points);
        for (const [joint, value] of angles) {
          if (!fingerFilters.has(joint)) fingerFilters.set(joint, new OneEuroFilter(FINGER_FILTER));
          angles.set(joint, fingerFilters.get(joint).filter(value, pose.t));
        }
        dex3.setFingers(robotSide, angles);
      } else if (pose.t - lastHandAt[robotSide] > FINGERS_HOLD_S) {
        const angles = new Map();
        for (const [joint, f] of fingerFilters) if (joint.startsWith(robotSide)) angles.set(joint, f.filter(0, pose.t));
        dex3.setFingers(robotSide, angles);
      }
    }
  }

  return {
    sim,
    // The three.js side (camera, controls, targetHeight), for a page that directs the camera itself.
    viewer: view,
    play: () => (playing = true),
    pause: () => (playing = false),
    setSpeed: (value) => (speed = value),
    reset,
    // The shove is for the physical robot: if it was copying a clip or a person, it first goes
    // back to standing. angle and newtons as sim.push (a random direction and 250 N by default).
    push(angle, newtons) {
      if (clip || sim.puppeted) stop();
      sim.push(angle, newtons);
    },
    /**
     * Plays a RobotMotion (physics/motions/, or any with the G1's 36 values per frame) on the
     * robot, without dynamics. It follows play(), pause() and setSpeed(), and reset() rewinds it.
     * What shows is the motion cleaned of the video's jitter (smoothForDisplay in motion.js).
     * @param options.loop  start over at the end (default), or hold the last frame
     * @param options.plantFeet  the pelvis path re-made so the foot on the floor does not slide
     *   (motion.js plantFeet): 'auto' (default) does it unless the clip's feet do not explain its
     *   travel (a run seen from the side); true or false force it.
     * @param options.time  initial playback time (s), clamped to [0, duration] (default 0)
     * @param options.autoAdvance  advance clipTime inside createSimView's frame loop (default true);
     *   set false when an external controller drives clipTime via seek() every frame
     */
    playClip(motion, { loop = true, plantFeet = 'auto', offset = [0, 0], time = 0, autoAdvance = true } = {}) {
      cancelBlend();
      if (isCustomScenePath(baseScene) && motion.robot === 'unitree_g1') {
        swapScene(worldScene(world), 'home');
      }
      // The robot's own values (36), not the model's: a place with loose objects adds 7 per object.
      const robotValues = kinematicModel().nq;
      if (motion.robot !== 'unitree_g1' || motion.qpos[0]?.length !== robotValues) {
        throw new Error(`This RobotMotion is not for the ${robotValues}-value G1 (robot: ${motion.robot}).`);
      }
      const duration = motionDuration(motion);
      const startTime = Math.min(Math.max(time, 0), duration ?? 0);
      clip = {
        motion: getSmoothedMotion(sim.mujoco, kinematicModel(), motion, plantFeet),
        duration,
        loop,
        autoAdvance,
        offset: [offset[0] || 0, offset[1] || 0],
        shown: startTime,
        wrapped: false,
      };
      clipTime = startTime;
      if (!motion.hands) {
        dex3?.show(false);
        if (handHook?.active) {
          const zeros = new Map();
          for (const joint of handHook.jointMap.keys()) zeros.set(joint, 0);
          handHook.applyQpos(sim.data.qpos, null, zeros);
          handHook.applyCtrl(sim.data, null, zeros);
          sim.mujoco.mj_forward(sim.model, sim.data);
        }
      }
    },
    smoothClip: (motion, plantFeet = 'auto') => getSmoothedMotion(sim.mujoco, kinematicModel(), motion, plantFeet),
    setClipOffset(dx = 0, dy = 0) {
      if (clip) clip.offset = [dx, dy];
    },
    blendPose(target, { duration = 0.45, from = null, release = false, syncPrevious = false } = {}) {
      cancelBlend();
      clip = null;
      const out = sim.model.nq === row.length ? row : new Float64Array(sim.model.nq);
      const fromQ = from
        ? Float64Array.from(bodyQposMap && from.length !== sim.model.nq ? toSimQpos(from) : from)
        : Float64Array.from(sim.data.qpos);
      if (duration <= 0) {
        const rawTo = typeof target === 'function' ? target(performance.now()) : target;
        const toQ = bodyQposMap
          ? toSimQpos(rawTo)
          : rawTo.length > sim.model.nq
            ? (rawTo.subarray ? rawTo.subarray(0, sim.model.nq) : rawTo.slice(0, sim.model.nq))
            : rawTo;
        sim.puppet(toQ);
        if (release) sim.releasePuppet({ resetPolicy: true, syncPrevious });
        return Promise.resolve(true);
      }
      return new Promise((resolve) => {
        blend = { from: fromQ, target, out, duration, elapsed: 0, release, syncPrevious, resolve };
      });
    },
    cancelBlend: () => cancelBlend(false),
    releasePuppet: (opts) => {
      cancelBlend();
      clip = null;
      sim.releasePuppet(opts);
    },
    /**
     * The RobotMotion of a PoseClip (a recorded or uploaded one), computed here, in slices so the
     * page keeps answering: about 2 ms per frame, so a 12 s clip takes under a second.
     * Same result as `npm run retarget`, which is instant for the clips already in physics/motions.
     * @param options.onProgress  0 to 1, after each slice
     * @returns Promise<{ motion, stats }> see retargetClip; null if the view was disposed meanwhile
     */
    retarget: (poseClip, options = {}) => retargetClipAsync(sim.mujoco, kinematicModel(), poseClip, { mirror: false, cancelled: () => disposed, ...options }),
    /**
     * Where the clip is, in seconds: the clip being played, or the one an imitation policy follows;
     * 0 otherwise. For syncing anything drawn beside the robot (the person's skeleton).
     */
    clipTime: () => (clip ? clipTime : sim.policy?.time?.(sim) ?? 0),
    seek(seconds) {
      if (!clip) return 0;
      clipTime = Math.min(Math.max(seconds, 0), clip.duration ?? 0);
      if (!clip.autoAdvance) clip.shown = clipTime;
      if (!playing) {
        clip.shown = clipTime;
        sampleMotion(clip.motion, clipTime, row);
        if (clip.offset) {
          row[0] += clip.offset[0];
          row[1] += clip.offset[1];
        }
        sim.puppet(toSimQpos(row));
      }
      return clipTime;
    },
    stop,
    /**
     * Gives the robot a trained policy (training/policies/): from then on it balances itself, and
     * "push" shows it recovering. The policy was trained on its own model of the G1 (softer motors,
     * policy.json's `mjcf`), so this switches the robot to that model; the standing hold of the
     * default model would not work on it.
     * @param onnx  policy.onnx: a URL, or its bytes
     * @param meta  policy.json: the object, or a URL
     * @param options.motion  for an imitation policy (policy.json `task: "mimic"`): the RobotMotion it
     *   learned (the object, or a URL). The robot then does that clip with physics, from its first
     *   pose, and starts over at the end; clipTime() says where it is, and push() still works.
     * Loading another policy of the same model only swaps the network (run by onnx-lite.js, a
     * few KB of JavaScript).
     */
    async loadPolicy(onnx, meta, { motion, reset = true } = {}) {
      const seq = ++policySeq;
      if (disposed) return { cancelled: true };
      const bytes = typeof onnx === 'string' ? await fetchCachedOnnxBytes(onnx) : new Uint8Array(onnx);
      if (disposed || seq !== policySeq) return { cancelled: true };
      if (typeof meta === 'string') meta = await fetchCachedJson(meta);
      if (disposed || seq !== policySeq) return { cancelled: true };
      if (typeof motion === 'string') motion = await fetchCachedJson(motion);
      if (disposed || seq !== policySeq) return { cancelled: true };
      const isCustomRobot = meta.robot !== 'unitree_g1';
      if (isCustomRobot) {
        await ensureModelFiles(sim.files, meta.mjcf);
        if (disposed || seq !== policySeq) return { cancelled: true };
      }
      const { loadOrt } = await import('./ort.js');
      if (disposed || seq !== policySeq) return { cancelled: true };
      const ort = await loadOrt();
      if (disposed || seq !== policySeq) return { cancelled: true };

      return enqueueOp(async () => {
        if (disposed || seq !== policySeq) return { cancelled: true };
        // The policy's scene ('unitree_g1/scene_mjx.xml' -> 'scene_mjx.xml'; 'unitree_h1/scene.xml'
        // and 'luigi_lab3/scene.xml' stay in their subfolder), or the current world's version of it for the G1.
        const sceneFile = isCustomRobot ? meta.mjcf : world ? worldScene(world) : meta.mjcf.slice(meta.mjcf.indexOf('/') + 1);
        const previous = { sceneFile: baseScene, keyName: sim.keyName };
        const sceneChanged = baseScene !== sceneFile;
        if (sceneChanged) swapScene(sceneFile, 'home');
        if (isCustomRobot) dex3?.show(false);
        // Only set targetHeight when OrbitControls is active; on the landing page (controls.enabled === false)
        // directCamera() drives targetHeight (~1.52 m) for its shift-lens projection, so overwriting it to 0.75
        // before view.render() made the robot jump vertically to half height during checkpoint transitions.
        if (view.controls.enabled) {
          view.targetHeight = meta.robot === 'luigi_lab3' || meta.robot === 'luigi_lab4' ? 0.12 : meta.robot === 'factory_cell' ? 0.35 : 0.75;
        }
        try {
          const policy = await createPolicy(ort, sim, bytes, meta, { motion });
          if (disposed || seq !== policySeq) {
            policy.dispose();
            return { cancelled: true };
          }
          if (!sceneChanged && (clip || sim.puppeted)) {
            if (reset) stop();
            else {
              cancelBlend();
              clip = null;
              sim.releasePuppet({ resetPolicy: false });
            }
          }
          if (!sceneChanged && !reset && !sim.puppeted) {
            policy.setPrevious?.(sim.data.ctrl);
          }
          sim.policy?.dispose();
          sim.policy = policy;
          lastPolicy = { bytes, meta, motion };
          if (sceneChanged || reset) sim.reset();
          return { cancelled: false };
        } catch (error) {
          if (disposed || seq !== policySeq) return { cancelled: true };
          if (baseScene !== previous.sceneFile) swapScene(previous.sceneFile, previous.keyName);
          throw error;
        }
      });
    },
    /** Takes the policy off and goes back to the stiff standing hold. */
    clearPolicy: () => {
      ++policySeq;
      world = null;
      lastPolicy = null;
      swapScene('scene.xml', 'stand');
    },
    /**
     * Puts the robot in a world from physics/worlds (an entry of WORLDS): floor, grip, wind,
     * mass and motor strength, with the middle of each training range. A world on another scene
     * (the stones) reloads the model and brings the policy back. Ends a clip or a camera copy.
     */
    async setWorld(next) {
      world = next;
      conditions = null; // a new world starts from its own middle values
      const seq = ++worldSeq;
      return enqueueOp(async () => {
        if (disposed || seq !== worldSeq) return { cancelled: true };
        const targetScene = isCustomScenePath(baseScene) ? baseScene : worldScene(next);
        if (baseScene !== targetScene) {
          swapScene(targetScene, 'home');
          await restorePolicy();
        } else {
          stop();
          sim.applyWorld(middleValues(next));
        }
        if (disposed || seq !== worldSeq) return { cancelled: true };
        sim.reset();
        return { cancelled: false };
      });
    },
    /** The world the robot is in, or null. */
    world: () => world,
    /**
     * Sets the conditions by hand over the current world (flat ground if none): any of
     * { friction, wind_mps, mass_scale, motor_scale }; the rest keep their value. Applies at once,
     * without resetting the robot, and survives a change of place.
     */
    setConditions(values) {
      const base = conditions ?? middleValues(world ?? { friction: [1, 1], wind_mps: [0, 0], mass_scale: [1, 1], motor_scale: [1, 1] });
      const next = { ...base, ...values };
      if (values.wind_mps !== undefined) next.wind_newtons = windForce(values.wind_mps);
      conditions = next;
      sim.applyWorld(conditions);
    },
    /** The conditions in effect: { friction, wind_mps, mass_scale, motor_scale, wind_newtons }. */
    conditions: () => {
      const current = conditions ?? (world ? middleValues(world) : null);
      if (!current) return { friction: 1, wind_mps: 0, mass_scale: 1, motor_scale: 1, wind_newtons: 0 };
      return { wind_mps: current.wind_mps ?? windSpeed(current.wind_newtons), ...current };
    },
    /**
     * Puts the robot in a place (an entry of SCENES, or a scene data/ detected in a video; format
     * in docs/contrato.md): its furniture is solid, and its loose objects can be pushed and knocked
     * over. null takes it away. It combines with the world (a slippery kitchen). Rebuilds the model
     * (a moment) and brings the policy back. Ends a clip or a camera copy.
     */
    async setScene(next) {
      place = next;
      const seq = ++placeSeq;
      return enqueueOp(async () => {
        if (disposed || seq !== placeSeq) return { cancelled: true };
        swapScene(baseScene, sim.keyName);
        await restorePolicy();
        if (disposed || seq !== placeSeq) return { cancelled: true };
        sim.reset();
        return { cancelled: false };
      });
    },
    /** The place the robot is in, or null. */
    scene: () => place,
    /**
     * Places a graspable object (cup + 6 water spheres) into the robot's right hand with Coulomb
     * friction (`wet: false` mu=0.85 holds; `wet: true` mu=0.12 slips under gravity). If no place
     * with a movable object is loaded yet, loads `HELD_OBJECT_SCENE` first.
     */
    async holdObject({ wet = false } = {}) {
      return enqueueOp(async () => {
        if (disposed) return false;
        if (!place || !place.objects?.some((o) => o.movable)) {
          place = HELD_OBJECT_SCENE;
          swapScene(baseScene, sim.keyName);
          await restorePolicy();
          if (disposed) return false;
        } else if (clip || sim.puppeted) {
          stop();
        }
        const ok = sim.holdObject({ wet });
        if (ok && !baseScene.startsWith('unitree_h1/')) {
          const grip = new Map([
            ['right_hand_thumb_0_joint', 0.45],
            ['right_hand_thumb_1_joint', 0.55],
            ['right_hand_thumb_2_joint', 0.45],
            ['right_hand_index_0_joint', 0.95],
            ['right_hand_index_1_joint', 0.85],
            ['right_hand_middle_0_joint', 0.95],
            ['right_hand_middle_1_joint', 0.85],
            ['right_hand_ring_0_joint', 0.95],
            ['right_hand_ring_1_joint', 0.85],
            ['right_hand_pinky_0_joint', 0.95],
            ['right_hand_pinky_1_joint', 0.85],
          ]);
          if (handHook?.active) {
            dex3?.show(false);
            handHook.applyCtrl(sim.data, 'right', grip);
          } else {
            const rig = await ensureDex3();
            if (disposed) return ok;
            if (handHook?.active) {
              dex3?.show(false);
              handHook.applyCtrl(sim.data, 'right', grip);
            } else if (rig) {
              rig.show(true);
              rig.setFingers('right', grip);
            }
          }
        }
        return ok;
      });
    },
    /** Releases the held object (and opens the right hand) so it falls under gravity. */
    dropObject() {
      sim.dropObject();
      if (handHook?.active) {
        const openAngles = new Map();
        for (const [joint, info] of handHook.jointMap) {
          if (info.side === 'right') openAngles.set(joint, 0);
        }
        handHook.applyCtrl(sim.data, 'right', openAngles);
      } else if (dex3) {
        dex3.setFingers('right', new Map());
      }
    },
    /** Current hand-object grasp state: { active, wet, slipped }. */
    graspState: () => sim.graspState(),
    /**
     * Makes the G1 copy a person, one camera frame at a time. Pass what createLiveCapture's
     * onPose gives. A null pose or one too occluded keeps the last pose. reset() ends it.
     * With the pose's `camera` (where the hips are from the camera) the robot also goes where the
     * person goes: it walks across the floor with its planted foot still, and leaves it in a jump
     * (root.js). Without it, it still walks by its feet, but cannot jump.
     * With the pose's `hands` (data/live's hand model, { left, right } of 21 world points) the
     * wrists read the hands from them.
     * @returns { tracked, residual, airborne, fixes } residual is the worst distance (m) between a
     *   limb and where the person put it; above ~0.08 the G1 cannot do that move. airborne: in a
     *   jump. fixes: what the robot added that the person did not do ('mirrored arm', and the parts
     *   clearance.js holds open: 'legs', 'left arm', 'right arm', 'hands'), for a debug readout.
     */
    mimic(pose) {
      if (!pose?.visible) return { tracked: false, residual: 0, airborne: false, fixes: [] };
      cancelBlend();
      clip = null;
      tracker ??= createPoseTracker({ smooth: false }); // data/live already filtered the points
      retargeter ??= createRetargeter(sim.mujoco, kinematicModel(), { mirror, live: true });
      smoother ??= createRobotPoseFilter(kinematicModel().nq); // the robot's own values, not a place's objects
      rootTracker ??= createRootTracker(sim.mujoco, kinematicModel(), { mirror, legLength: retargeter.legLength });
      leveler ??= createLeveler(sim.mujoco, kinematicModel());
      if (!clearance) {
        const model = createClearance(sim.mujoco, kinematicModel());
        clearance = { model, clear: model.createLive() };
      }
      const points = tracker.update(pose.world, pose.landmarks, pose.t);
      const { qpos, tracked, residual, mirroredArm, upperBodyOnly } = retargeter.solve(points, { travelYaw: rootTracker.travelYaw(), hands: pose.hands });
      // The path is made from the filtered pose, the one drawn: made from the raw one, the planted
      // foot would slide by whatever the filter holds back.
      // Leveled before the path: root.js puts the leveled feet back on the floor.
      if (tracked) sim.puppet(toSimQpos(rootTracker.update(clearance.clear(leveler.level(smoother.filter(qpos, pose.t), pose.t), pose.t), pose)));
      if (tracked) copyFingers(pose);
      const fixes = [...(mirroredArm ? ['mirrored arm'] : []), ...clearance.clear.opened()];
      return { tracked, residual, airborne: rootTracker.airborne(), fixes, upperBodyOnly };
    },
    cancelPending() {
      ++policySeq;
      return opChain;
    },
    dispose() {
      disposed = true;
      ++policySeq;
      ++worldSeq;
      ++placeSeq;
      cancelBlend();
      cancelAnimationFrame(frameId);
      sim.policy?.dispose();
      view.dispose();
      retargeter?.delete();
      rootTracker?.delete();
      leveler?.delete();
      clearance?.model.delete();
      kinematic?.delete();
      sim.delete();
    },
  };
}
