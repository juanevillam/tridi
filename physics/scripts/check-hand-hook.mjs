// Regression check for the physical finger actuator hook (createHandActuatorHook in src/fingers.js)
// and the meta.robot === 'unitree_g1' waist-damping gate in src/policy.js.
// Covers:
//   1. Default 29-DoF G1 (unitree_g1/scene_mjx.xml, nq=36, nu=29): safe no-op, bit-identical qpos/ctrl
//   2. Physical Dex3 G1 (dex3/g1_with_hands.xml, nq=50, nu=43): 14 actuators, right index/middle swap
//      safety, IK solver driving (Dex3 & Inspire solvers), physics tracking & applyQpos accuracy
//   3. Inspire 22-DoF capability mapping (nu=51, nq=58 via synthetic in-memory MJCF)
//   4. policy.js waist-damping gate on meta.robot === 'unitree_g1' with nu=43
// Run: npm --prefix physics run check
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import loadMujoco from '@mujoco/mujoco';
import * as THREE from 'three';
import { createFingerSolver, createHandActuatorHook } from '../src/fingers.js';
import { createPolicy } from '../src/policy.js';
import { Simulation } from '../src/sim.js';

const G1_DIR = new URL('../models/unitree_g1/', import.meta.url).pathname;
const DEX3_DIR = new URL('../models/dex3/', import.meta.url).pathname;
const dex3Hands = JSON.parse(readFileSync(new URL('../models/dex3/hands.json', import.meta.url)));
const inspireHands = JSON.parse(readFileSync(new URL('../models/inspire/hands.json', import.meta.url)));

function readTree(dir) {
  const files = {};
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const path = join(entry.parentPath, entry.name);
    files[relative(dir, path)] = new Uint8Array(readFileSync(path));
  }
  return files;
}

const failures = [];
const expect = (ok, what) => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failures.push(what);
};

function makePosePoints(solver, side, bend = 0.7) {
  const angles = new Map();
  for (const b of solver.joints(side)) {
    const short = b.name.replace(`${side}_hand_`, '').replace('_link', '');
    const [lo, hi] = b.range;
    const value = short === 'thumb_0' ? 0 : Math.abs(hi) >= Math.abs(lo) ? bend * hi : bend * lo;
    angles.set(b.joint, THREE.MathUtils.clamp(value, lo, hi));
  }
  const P = Array.from({ length: 21 }, () => new THREE.Vector3());
  const finger = (base, mid, points) => {
    const a = solver.origin(side, angles, base);
    const b = solver.origin(side, angles, mid);
    const tip = b.clone().addScaledVector(solver.segment(side, angles, mid), 0.04);
    [P[points[0]], P[points[1]], P[points[2]], P[points[3]]] = [a, b, b.clone().lerp(tip, 0.5), tip];
  };
  P[0].set(0, 0, 0);
  finger('index_0', 'index_1', [5, 6, 7, 8]);
  finger('middle_0', 'middle_1', [9, 10, 11, 12]);
  if (solver.joints(side).some((j) => j.name.includes('ring_0'))) {
    finger('ring_0', 'ring_1', [13, 14, 15, 16]);
    finger('pinky_0', 'pinky_1', [17, 18, 19, 20]);
  } else {
    for (const k of [13, 17]) for (let i = 0; i < 4; i++) P[k + i].copy(P[9 + i]);
  }
  P[1].copy(solver.origin(side, angles, 'thumb_0'));
  P[2].copy(solver.origin(side, angles, 'thumb_1'));
  P[3].copy(solver.origin(side, angles, 'thumb_2'));
  P[4].copy(P[3]).addScaledVector(solver.segment(side, angles, 'thumb_2'), 0.04);
  return { points: P, truth: angles };
}

const mujoco = await loadMujoco();
const g1Files = readTree(G1_DIR);
const dex3Files = { ...g1Files, ...readTree(DEX3_DIR) };

// ---------------------------------------------------------------------------
// 1. Default 29-DoF G1 (scene_mjx.xml): safe no-op
// ---------------------------------------------------------------------------
console.log('1. Default 29-DoF G1 (unitree_g1/scene_mjx.xml)');
const sim29 = new Simulation(mujoco, g1Files, 'scene_mjx.xml', 'home');
expect(sim29.model.nq === 36 && sim29.model.nu === 29, `scene_mjx.xml dimensions nq=${sim29.model.nq}, nu=${sim29.model.nu}`);

for (const [label, spec] of [
  ['dex3/hands.json', dex3Hands],
  ['inspire/hands.json', inspireHands],
  ['null', null],
]) {
  const hook = createHandActuatorHook(mujoco, sim29.model, spec);
  expect(hook.active === false && hook.count === 0 && hook.jointMap.size === 0, `${label}: inactive no-op (active=${hook.active}, count=${hook.count})`);
  const ctrlBefore = Float64Array.from(sim29.data.ctrl);
  const qposBefore = Float64Array.from(sim29.data.qpos);
  const nonZero = {
    left_hand_thumb_0_joint: 0.5,
    left_hand_index_0_joint: -0.8,
    right_hand_thumb_0_joint: -0.5,
    right_hand_index_0_joint: 0.8,
  };
  const cLeft = hook.applyCtrl(sim29.data, 'left', nonZero);
  const cRight = hook.applyCtrl(sim29.data, 'right', nonZero);
  const qLeft = hook.applyQpos(sim29.data.qpos, 'left', nonZero);
  const qRight = hook.applyQpos(sim29.data.qpos, 'right', nonZero);
  let maxDiff = 0;
  for (let i = 0; i < ctrlBefore.length; i++) maxDiff = Math.max(maxDiff, Math.abs(sim29.data.ctrl[i] - ctrlBefore[i]));
  for (let i = 0; i < qposBefore.length; i++) maxDiff = Math.max(maxDiff, Math.abs(sim29.data.qpos[i] - qposBefore[i]));
  expect(cLeft === 0 && cRight === 0 && qLeft === 0 && qRight === 0 && maxDiff === 0, `${label}: zero writes & maxDiff=${maxDiff}`);
}
await sim29.advance(0.1);
expect(sim29.data.qpos.every(Number.isFinite) && sim29.data.ctrl.every(Number.isFinite), 'advance(0.1) stays finite');
sim29.delete();

// ---------------------------------------------------------------------------
// 2. Physical Dex3 G1 (dex3/g1_with_hands.xml): nq=50, nu=43, 14 actuators
// ---------------------------------------------------------------------------
console.log('2. Physical Dex3 G1 (dex3/g1_with_hands.xml)');
const dex3Sim = new Simulation(mujoco, dex3Files, 'g1_with_hands.xml', 'stand');
expect(dex3Sim.model.nq === 50 && dex3Sim.model.nu === 43, `g1_with_hands.xml dimensions nq=${dex3Sim.model.nq}, nu=${dex3Sim.model.nu}`);

const dex3Hook = createHandActuatorHook(mujoco, dex3Sim.model, dex3Hands);
const dex3WithInspire = createHandActuatorHook(mujoco, dex3Sim.model, inspireHands);
const dex3WithNull = createHandActuatorHook(mujoco, dex3Sim.model, null);
expect(dex3Hook.active === true && dex3Hook.count === 14, `dex3/hands.json hook active=${dex3Hook.active}, count=${dex3Hook.count}`);
expect(dex3WithInspire.active === true && dex3WithInspire.count === 14, `inspire/hands.json on Dex3 model count=${dex3WithInspire.count}`);
expect(dex3WithNull.active === true && dex3WithNull.count === 14, `null spec on Dex3 model count=${dex3WithNull.count}`);

const rIdx0 = dex3Hook.jointMap.get('right_hand_index_0_joint');
const rMid0 = dex3Hook.jointMap.get('right_hand_middle_0_joint');
expect(
  rIdx0?.actuatorId === 39 && rIdx0?.qposAdr === 48 && rMid0?.actuatorId === 41 && rMid0?.qposAdr === 46,
  `right index/middle mapping handles XML order swap (index act=${rIdx0?.actuatorId}/q=${rIdx0?.qposAdr}, middle act=${rMid0?.actuatorId}/q=${rMid0?.qposAdr})`,
);

// Drive distinct targets on right index vs right middle + IK solver targets
const dex3Solver = createFingerSolver(dex3Hands);
const inspireSolver = createFingerSolver(inspireHands);
const leftIk = dex3Solver.solve('left', makePosePoints(dex3Solver, 'left', 0.45).points);
// Also verify Inspire 11-joint output writes cleanly onto Dex3's 7 right-hand actuators without error
const rightIkInspire = inspireSolver.solve('right', makePosePoints(inspireSolver, 'right', 0.45).points);

// Override right index vs middle with clearly distinct targets to catch any index/middle swap
rightIkInspire.set('right_hand_index_0_joint', 0.75);
rightIkInspire.set('right_hand_index_1_joint', 0.65);
rightIkInspire.set('right_hand_middle_0_joint', 0.25);
rightIkInspire.set('right_hand_middle_1_joint', 0.20);
// Include a non-finite entry and an out-of-range value to verify filtering & clamping
rightIkInspire.set('right_hand_thumb_0_joint', Number.NaN);
rightIkInspire.set('right_hand_thumb_2_joint', -99);

const standCtrl = Float64Array.from(dex3Sim.data.ctrl);
const wLeft = dex3Hook.applyCtrl(dex3Sim.data, 'left', leftIk);
const wRight = dex3Hook.applyCtrl(dex3Sim.data, 'right', rightIkInspire);
expect(wLeft === 7 && wRight === 6, `applyCtrl wrote left=${wLeft} (7), right=${wRight} (6 finite of 7 Dex3, skipped NaN + 4 unactuated Inspire)`);

let bodyUntouched = true;
for (let i = 0; i <= 21; i++) if (dex3Sim.data.ctrl[i] !== standCtrl[i]) bodyUntouched = false;
for (let i = 29; i <= 35; i++) if (dex3Sim.data.ctrl[i] !== standCtrl[i]) bodyUntouched = false;
expect(bodyUntouched, 'body actuators (0..21, 29..35) untouched by finger applyCtrl');

const thumb2Info = dex3Hook.jointMap.get('right_hand_thumb_2_joint');
expect(Math.abs(dex3Sim.data.ctrl[thumb2Info.actuatorId] - thumb2Info.ctrlRange[0]) < 1e-9, 'out-of-range ctrl clamped to ctrlRange[0]');
// Set thumb_2 to -0.7 rad (non-colliding flex) for the 0.5 s physics tracking check
rightIkInspire.set('right_hand_thumb_2_joint', -0.7);
dex3Hook.applyCtrl(dex3Sim.data, 'right', { right_hand_thumb_2_joint: -0.7 });

for (let k = 0; k < 25; k++) await dex3Sim.advance(0.02);
let worstTrack = 0;
for (const [joint, target] of leftIk) {
  const info = dex3Hook.jointMap.get(joint);
  worstTrack = Math.max(worstTrack, Math.abs(dex3Sim.data.qpos[info.qposAdr] - target));
}
for (const [joint, raw] of rightIkInspire) {
  const info = dex3Hook.jointMap.get(joint);
  if (!info || !Number.isFinite(raw)) continue;
  const clamped = THREE.MathUtils.clamp(raw, info.ctrlRange[0], info.ctrlRange[1]);
  worstTrack = Math.max(worstTrack, Math.abs(dex3Sim.data.qpos[info.qposAdr] - clamped));
}
expect(
  worstTrack < 0.15 && dex3Sim.data.qpos.every(Number.isFinite),
  `0.5 s physics step tracks targets (worst error=${worstTrack.toFixed(4)} rad < 0.15, finite)`,
);

dex3Sim.reset();
const qTargets = {
  left_hand_thumb_1_joint: 0.4,
  left_hand_index_0_joint: -0.9,
  right_hand_index_0_joint: 0.9,
  right_hand_middle_0_joint: 0.3,
  right_hand_middle_1_joint: 99, // should clamp to qposRange[1]
};
const qw = dex3Hook.applyQpos(dex3Sim.data.qpos, null, qTargets);
expect(qw === 5, `applyQpos with plain object & side=null wrote ${qw} joints`);
let worstQposErr = 0;
for (const [joint, raw] of Object.entries(qTargets)) {
  const info = dex3Hook.jointMap.get(joint);
  const expected = THREE.MathUtils.clamp(raw, info.qposRange[0], info.qposRange[1]);
  worstQposErr = Math.max(worstQposErr, Math.abs(dex3Sim.data.qpos[info.qposAdr] - expected));
}
expect(worstQposErr < 1e-6, `applyQpos exact clamped match (worst=${worstQposErr.toExponential(2)} < 1e-6)`);

// ---------------------------------------------------------------------------
// 3. Inspire capability mapping (22 joints -> nu=51, nq=58 synthetic MJCF)
// ---------------------------------------------------------------------------
console.log('3. Inspire 22-joint capability mapping (synthetic nu=51, nq=58 MJCF)');
const bodyJointNames = [
  'left_hip_pitch_joint', 'left_hip_roll_joint', 'left_hip_yaw_joint', 'left_knee_joint', 'left_ankle_pitch_joint', 'left_ankle_roll_joint',
  'right_hip_pitch_joint', 'right_hip_roll_joint', 'right_hip_yaw_joint', 'right_knee_joint', 'right_ankle_pitch_joint', 'right_ankle_roll_joint',
  'waist_yaw_joint', 'waist_roll_joint', 'waist_pitch_joint',
  'left_shoulder_pitch_joint', 'left_shoulder_roll_joint', 'left_shoulder_yaw_joint', 'left_elbow_joint', 'left_wrist_roll_joint', 'left_wrist_pitch_joint', 'left_wrist_yaw_joint',
  'right_shoulder_pitch_joint', 'right_shoulder_roll_joint', 'right_shoulder_yaw_joint', 'right_elbow_joint', 'right_wrist_roll_joint', 'right_wrist_pitch_joint', 'right_wrist_yaw_joint',
];
const inspireBodiesXml = ['left', 'right']
  .flatMap((side) =>
    inspireHands[side].bodies.map(
      (b) => `      <body name="${b.name}" pos="${b.pos.join(' ')}">
        <inertial pos="0 0 0" mass="0.02" diaginertia="1e-5 1e-5 1e-5"/>
        <joint name="${b.joint}" axis="${b.axis.join(' ')}" range="${b.range[0]} ${b.range[1]}"/>
        <geom type="sphere" size="0.01" contype="0" conaffinity="0"/>
      </body>`,
    ),
  )
  .join('\n');
const inspireActuatorsXml = ['left', 'right']
  .flatMap((side) =>
    inspireHands[side].bodies.map((b) => `    <position kp="500" dampratio="1" inheritrange="1" name="${b.joint}" joint="${b.joint}"/>`),
  )
  .join('\n');
const inspireXml = `<mujoco model="g1_inspire_synthetic">
  <compiler angle="radian"/>
  <option timestep="0.002" integrator="implicitfast"/>
  <default>
    <joint limited="true" damping="0.1" armature="0.001"/>
  </default>
  <worldbody>
    <body name="pelvis" pos="0 0 0.8">
      <freejoint name="floating_base_joint"/>
      <inertial pos="0 0 0" mass="30" diaginertia="1 1 1"/>
      <geom type="sphere" size="0.05" contype="0" conaffinity="0"/>
      <body name="torso_link" pos="0 0 0.2">
        <inertial pos="0 0 0" mass="1" diaginertia="0.1 0.1 0.1"/>
      </body>
${bodyJointNames
  .map(
    (j, idx) => `      <body name="b_${idx}" pos="0 0 0">
        <inertial pos="0 0 0" mass="0.1" diaginertia="1e-4 1e-4 1e-4"/>
        <joint name="${j}" axis="0 1 0" range="-1.5 1.5"/>
        <geom type="sphere" size="0.01" contype="0" conaffinity="0"/>
      </body>`,
  )
  .join('\n')}
${inspireBodiesXml}
    </body>
  </worldbody>
  <actuator>
${bodyJointNames.map((j) => `    <position kp="500" dampratio="1" inheritrange="1" name="${j}" joint="${j}"/>`).join('\n')}
${inspireActuatorsXml}
  </actuator>
  <keyframe>
    <key name="stand"
      qpos="${[0, 0, 0.8, 1, 0, 0, 0, ...new Array(51).fill(0)].join(' ')}"
      ctrl="${new Array(51).fill(0).join(' ')}"/>
  </keyframe>
</mujoco>`;

const inspireSim = new Simulation(mujoco, { 'inspire_synthetic.xml': new TextEncoder().encode(inspireXml) }, 'inspire_synthetic.xml', 'stand');
expect(inspireSim.model.nu === 51 && inspireSim.model.nq === 58, `synthetic Inspire MJCF nu=${inspireSim.model.nu}, nq=${inspireSim.model.nq}`);

const inspireHook = createHandActuatorHook(mujoco, inspireSim.model, inspireHands);
const inspireHookNull = createHandActuatorHook(mujoco, inspireSim.model, null);
expect(inspireHook.active === true && inspireHook.count === 22, `Inspire hook active=${inspireHook.active}, count=${inspireHook.count}`);
expect(inspireHookNull.active === true && inspireHookNull.count === 22, `Inspire null-spec hook count=${inspireHookNull.count}`);

const all22Targets = new Map();
for (const [joint, info] of inspireHook.jointMap) {
  const [lo, hi] = info.ctrlRange;
  all22Targets.set(joint, Math.abs(hi) >= Math.abs(lo) ? 0.6 * hi : 0.6 * lo);
}
const written22 = inspireHook.applyCtrl(inspireSim.data, null, all22Targets);
expect(written22 === 22, `applyCtrl drove all ${written22} Inspire joints`);
for (let step = 0; step < 250; step++) mujoco.mj_step(inspireSim.model, inspireSim.data);

let inspireTrackErr = 0;
for (const [joint, target] of all22Targets) {
  const info = inspireHook.jointMap.get(joint);
  inspireTrackErr = Math.max(inspireTrackErr, Math.abs(inspireSim.data.qpos[info.qposAdr] - target));
}
expect(inspireTrackErr < 0.15, `Inspire 22-joint mj_step convergence (worst=${inspireTrackErr.toFixed(4)} rad < 0.15)`);

mujoco.mj_resetData(inspireSim.model, inspireSim.data);
const qWritten22 = inspireHook.applyQpos(inspireSim.data.qpos, null, all22Targets);
let inspireQposErr = 0;
for (const [joint, target] of all22Targets) {
  const info = inspireHook.jointMap.get(joint);
  inspireQposErr = Math.max(inspireQposErr, Math.abs(inspireSim.data.qpos[info.qposAdr] - target));
}
expect(qWritten22 === 22 && inspireQposErr < 1e-6, `Inspire applyQpos all ${qWritten22} joints (worst=${inspireQposErr.toExponential(2)} < 1e-6)`);
inspireSim.delete();

// ---------------------------------------------------------------------------
// 4. policy.js waist-damping gate (meta.robot === 'unitree_g1' with nu = 43)
// ---------------------------------------------------------------------------
console.log('4. policy.js waist-damping gate (meta.robot === "unitree_g1" with nu=43)');
const dex3XmlText = new TextDecoder().decode(dex3Files['g1_with_hands.xml']).replace('<key name="stand"', '<key name="home"');
const policy43Files = { ...dex3Files, 'g1_with_hands_home.xml': new TextEncoder().encode(dex3XmlText) };
const policySim = new Simulation(mujoco, policy43Files, 'g1_with_hands_home.xml', 'home');

const qFrame = Array.from(policySim.data.qpos);
qFrame[19] = 0.4; // waist_yaw_joint (actuator 12)
qFrame[20] = 0.4; // waist_roll_joint (actuator 13)
qFrame[21] = 0.4; // waist_pitch_joint (actuator 14)
qFrame[22] = 0.4; // left_shoulder_pitch_joint (actuator 15, undamped reference)

const motion43 = {
  clip_id: 'test-g1-43',
  robot: 'unitree_g1',
  fps: 50,
  balanced_by: 'smoothForDisplay',
  qpos: [qFrame, qFrame.slice()],
};
const meta43 = {
  id: 'test-g1-43',
  robot: 'unitree_g1',
  mjcf: 'dex3/g1_with_hands.xml',
  nu: 43,
  obs_dim: 6 + 3 * 43 + 43 + 4, // 182 (mimicObsDim(43, [], false))
  steps: 1,
  task: 'mimic',
  lookahead_s: [],
};
const mockOrt = {
  Tensor: class {
    constructor(type, data, dims) {
      this.type = type;
      this.data = data;
      this.dims = dims;
    }
  },
  InferenceSession: {
    async create() {
      return {
        inputNames: ['obs'],
        outputNames: ['actions'],
        async run() {
          return { actions: { data: new Float32Array(43).fill(0.9) } };
        },
        release() {},
      };
    },
  },
};

policySim.policy = await createPolicy(mockOrt, policySim, new Uint8Array(0), meta43, { motion: motion43 });
policySim.reset();
await policySim.advance(0.02);

// Expected at t=0 (jv=0, prev=0.4, refJ=0.4, onnx=0.9, upright=1 => reflex=0.05):
//   i=12: 0.82 * (0.85 * 0.4) + 0.18 * 0.4 = 0.3508
//   i=13: 0.82 * (0.45 * 0.4) + 0.18 * 0.4 = 0.2196
//   i=14: 0.82 * (Math.min(0.08, 0.55 * 0.4) - 0.02) + 0.18 * 0.4 = 0.1212
//   i=15 (arm): 0.82 * (0.95 * 0.4 + 0.05 * 0.9) + 0.18 * 0.4 = 0.4205
const c12 = policySim.data.ctrl[12];
const c13 = policySim.data.ctrl[13];
const c14 = policySim.data.ctrl[14];
const c15 = policySim.data.ctrl[15];
expect(
  Math.abs(c12 - 0.3508) < 1e-6 &&
    Math.abs(c13 - 0.2196) < 1e-6 &&
    Math.abs(c14 - 0.1212) < 1e-6 &&
    Math.abs(c15 - 0.4205) < 1e-6,
  `waist damping active on nu=43 G1 (ctrl[12..14]=${c12.toFixed(4)},${c13.toFixed(4)},${c14.toFixed(4)} vs arm ctrl[15]=${c15.toFixed(4)})`,
);

policySim.delete();

// ---------------------------------------------------------------------------
// 5. Edge-case guards: partial mujoco/model, non-joint actuators, NaN/Inf, clamp & side isolation
// ---------------------------------------------------------------------------
console.log('5. Edge-case guards, non-joint actuators, non-finite filter & side isolation');
for (const [label, args] of [
  ['null/null/null', [null, null, null]],
  ['undefined/undefined/undefined', [undefined, undefined, undefined]],
  ['empty mujoco + {nu:5}', [{}, { nu: 5 }, null]],
  ['real mujoco + partial {nu:5}', [mujoco, { nu: 5 }, null]],
  ['real mujoco + {nu:0}', [mujoco, { nu: 0 }, null]],
  ['empty handSpec {}', [mujoco, dex3Sim.model, {}]],
  ['empty handSpec bodies', [mujoco, dex3Sim.model, { left: { bodies: [] }, right: {} }]],
]) {
  let threw = false;
  let res = null;
  try {
    res = createHandActuatorHook(...args);
  } catch {
    threw = true;
  }
  expect(!threw && res?.active === false && res?.count === 0, `${label}: safe inactive hook without throw`);
  expect(
    res?.applyCtrl(dex3Sim.data, 'left', { left_hand_thumb_0_joint: 0.5 }) === 0 &&
      res?.applyQpos(dex3Sim.data.qpos, 'left', { left_hand_thumb_0_joint: 0.5 }) === 0,
    `${label}: applyCtrl/applyQpos return 0`,
  );
}

const mixedXml = `<mujoco model="hand_edge_cases">
  <compiler angle="radian"/>
  <worldbody>
    <body name="palm" pos="0 0 0.5">
      <inertial pos="0 0 0" mass="1" diaginertia="0.01 0.01 0.01"/>
      <body name="torso_link" pos="0 0 0.1">
        <inertial pos="0 0 0" mass="1" diaginertia="0.01 0.01 0.01"/>
      </body>
      <site name="hand_site" pos="0 0 0"/>
      <site name="t_a" pos="0 0 0"/>
      <site name="t_b" pos="0 0 0.05"/>
      <body name="l_thumb" pos="0 0.05 0">
        <inertial pos="0 0 0" mass="0.05" diaginertia="1e-4 1e-4 1e-4"/>
        <joint name="left_hand_thumb_0_joint" axis="0 1 0" limited="true" range="-0.8 0.8"/>
        <geom type="sphere" size="0.01" contype="0" conaffinity="0"/>
      </body>
      <body name="r_index" pos="0 -0.05 0">
        <inertial pos="0 0 0" mass="0.05" diaginertia="1e-4 1e-4 1e-4"/>
        <joint name="right_hand_index_0_joint" axis="0 1 0" limited="false"/>
        <geom type="sphere" size="0.01" contype="0" conaffinity="0"/>
      </body>
    </body>
  </worldbody>
  <tendon>
    <spatial name="left_hand_thumb_0_tendon">
      <site site="t_a"/>
      <site site="t_b"/>
    </spatial>
  </tendon>
  <actuator>
    <general name="site_act" site="hand_site"/>
    <position name="tendon_act" tendon="left_hand_thumb_0_tendon" kp="10"/>
    <position name="left_thumb_act" joint="left_hand_thumb_0_joint" ctrllimited="true" ctrlrange="-0.5 0.5" kp="10"/>
    <position name="right_index_act" joint="right_hand_index_0_joint" kp="10"/>
  </actuator>
  <keyframe>
    <key name="stand" qpos="0 0" ctrl="0 0 0 0"/>
  </keyframe>
</mujoco>`;

const mixedSim = new Simulation(mujoco, { 'mixed.xml': new TextEncoder().encode(mixedXml) }, 'mixed.xml', 'stand');
const mixedHookNull = createHandActuatorHook(mujoco, mixedSim.model, null);
const mixedHookSpec = createHandActuatorHook(mujoco, mixedSim.model, dex3Hands);
expect(
  mixedHookNull.active === true && mixedHookNull.count === 2 && mixedHookSpec.active === true && mixedHookSpec.count === 2,
  `skips mjTRN_SITE & mjTRN_TENDON (count=${mixedHookNull.count}/${mixedHookSpec.count})`,
);

const rIdxSpecRange = dex3Hands.right.bodies.find((b) => b.joint === 'right_hand_index_0_joint').range;
const rIdxHookInfo = mixedHookSpec.jointMap.get('right_hand_index_0_joint');
expect(
  Math.abs(rIdxHookInfo.qposRange[0] - rIdxSpecRange[0]) < 1e-6 && Math.abs(rIdxHookInfo.qposRange[1] - rIdxSpecRange[1]) < 1e-6,
  'unlimited joint falls back to handSpec range',
);

const badWritesCtrl = mixedHookSpec.applyCtrl(mixedSim.data, null, {
  left_hand_thumb_0_joint: Number.NaN,
  right_hand_index_0_joint: Infinity,
});
const badWritesInf = mixedHookSpec.applyQpos(mixedSim.data.qpos, null, {
  left_hand_thumb_0_joint: -Infinity,
  right_hand_index_0_joint: Number.NaN,
});
expect(
  badWritesCtrl === 0 && badWritesInf === 0 && mixedSim.data.ctrl.every((v) => v === 0) && mixedSim.data.qpos.every((v) => v === 0),
  'skips NaN / +Infinity / -Infinity cleanly',
);

const wSideLeft = mixedHookSpec.applyCtrl(mixedSim.data, 'left', {
  left_hand_thumb_0_joint: -9,
  right_hand_index_0_joint: 0.7,
});
const wSideCenter = mixedHookSpec.applyCtrl(mixedSim.data, 'center', {
  left_hand_thumb_0_joint: 0.2,
  right_hand_index_0_joint: 0.2,
});
expect(
  wSideLeft === 1 &&
    wSideCenter === 0 &&
    mixedSim.data.ctrl[0] === 0 &&
    mixedSim.data.ctrl[1] === 0 &&
    Math.abs(mixedSim.data.ctrl[2] - -0.5) < 1e-9 &&
    mixedSim.data.ctrl[3] === 0,
  `side="left" isolates right/non-joint actuators & clamps to ctrlRange[0] (${mixedSim.data.ctrl.join(',')})`,
);

const wSideRightQ = mixedHookSpec.applyQpos(mixedSim.data.qpos, 'right', {
  left_hand_thumb_0_joint: 0.3,
  right_hand_index_0_joint: 99,
});
expect(
  wSideRightQ === 1 &&
    mixedSim.data.qpos[0] === 0 &&
    Math.abs(mixedSim.data.qpos[1] - rIdxSpecRange[1]) < 1e-6,
  'side="right" applyQpos isolates left & clamps unlimited joint to handSpec qposRange[1]',
);
expect(
  mixedHookSpec.applyCtrl(null, 'left', { left_hand_thumb_0_joint: 0.1 }) === 0 &&
    mixedHookSpec.applyQpos(null, 'left', { left_hand_thumb_0_joint: 0.1 }) === 0,
  'null data/qpos returns 0 safely',
);
mixedSim.delete();

// Verify kinematic -> physical Dex3 joint-name remapping (src[29] right_shoulder_pitch -> dst[36], leaving left_hand at 29..35 untouched)
const km = dex3Sim.createModel('g1_kinematics.xml', ['g1_kinematics.xml']);
const OBJ_JOINT = mujoco.mjtObj.mjOBJ_JOINT.value;
const bodyMap = [];
for (let j = 1; j < km.njnt; j++) {
  const name = mujoco.mj_id2name(km, OBJ_JOINT, j);
  if (!name) continue;
  const dstJid = mujoco.mj_name2id(dex3Sim.model, OBJ_JOINT, name);
  if (dstJid >= 0) bodyMap.push([km.jnt_qposadr[j], dex3Sim.model.jnt_qposadr[dstJid]]);
}
const rShoulderPair = bodyMap.find(([src]) => src === 29);
expect(
  bodyMap.length === 29 && rShoulderPair?.[1] === 36,
  `kinematic -> Dex3 bodyQposMap maps all 29 body joints (src[29] -> dst[${rShoulderPair?.[1]}], not left_hand)`,
);
km.delete();

dex3Sim.delete();

if (failures.length) {
  console.error(`\ncheck-hand-hook failed: ${failures.length}`);
  process.exit(1);
}
console.log('\ncheck-hand-hook passed');
