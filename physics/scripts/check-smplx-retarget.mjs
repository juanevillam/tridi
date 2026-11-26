// Headless regression check for SMPL-X rotational retargeting (physics/src/retarget.js + motion.js):
// verifies v1 backwards compatibility, synthetic axial twist preservation (shoulder_yaw, waist_yaw,
// wrist_roll, mirror symmetry), real GVHMR clip metrics (limits, crossed=0, hipTwistP95, reach,
// WiLoR palm agreement), and <12 ms per-solve budget.
// Run: npm --prefix physics run check
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { loadG1Node } from './node-model.mjs';
import { createPoseTracker } from '../src/pose.js';
import { createRetargeter } from '../src/retarget.js';
import { REACH_TOLERANCE, retargetClip } from '../src/motion.js';

const MAX_MS_PER_SOLVE = 12; // must fit inside a 33 ms camera frame alongside MediaPipe + WebGL
const MAX_HIP_TWIST_DEG = 25; // walking twists ~10 deg; 25 deg at p95 leaves room for turns
const MAX_MEDIAN_PALM_ERR_DEG = 15; // WiLoR wrist agreement target when 21-pt hands are present
const MIN_HAND_WIDTH = 0.3; // matches retarget.js MIN_HAND_WIDTH guard against collapsed fists
const MAX_ABDUCTION_STEP_RAD = 0.5; // 5 deg sweep must stay smooth without ~2*pi gimbal flips
const MAX_DIAG_ABDUCTION_STEP_RAD = 1.0; // diagonal flex=30 yaw=0.6 crosses overhead yaw clamp smoothly
const MAX_SHOULDER_YAW_CLAMP = 2.5; // well inside +-2.618 rad limit (no gimbal clamp snap)
const MAX_PELVIS_YAW_STEP_RAD = 0.5; // prevents travelYaw threshold toggling from snapping pelvisQ

const { mujoco, sim } = await loadG1Node();
const id = (type, name) => mujoco.mj_name2id(sim.model, mujoco.mjtObj[`mjOBJ_${type}`].value, name);
const j = (name) => sim.model.jnt_qposadr[id('JOINT', name)];
// Read fresh model.jnt_range / model.jnt_qposadr on every call because MuJoCo WASM heap growth
// during MjData allocations detaches previously captured TypedArray views.
const jointsInRange = (q) => {
  const range = sim.model.jnt_range;
  const adr = sim.model.jnt_qposadr;
  for (let jn = 1; jn < sim.model.njnt; jn++) {
    const v = q[adr[jn]];
    if (!(v >= range[2 * jn] - 1e-4 && v <= range[2 * jn + 1] + 1e-4)) return false;
  }
  return true;
};

const failures = [];
const expect = (ok, what) => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failures.push(what);
};

// Contract axes: x right (person's left), y up, z toward camera.
// Robot axes: x_r = z_c, y_r = x_c, z_r = y_c.
const SEG = { shoulderHalf: 0.19, hipHalf: 0.1, upperArm: 0.29, foreArm: 0.26, thigh: 0.43, shin: 0.42, torso: 0.5 };
function toContractRotvec(q) {
  const ang = 2 * Math.acos(THREE.MathUtils.clamp(q.w, -1, 1));
  if (ang < 1e-8) return [0, 0, 0];
  const s = Math.sin(0.5 * ang);
  const rx = q.x / s;
  const ry = q.y / s;
  const rz = q.z / s;
  return [ry * ang, rz * ang, rx * ang];
}
function setBodyRotvec(bp, jointIdx, rv) {
  const o = 3 * (jointIdx - 1);
  bp[o] = rv[0];
  bp[o + 1] = rv[1];
  bp[o + 2] = rv[2];
}
function makeStandingMediaPipe(overrides = {}, yaw = 0) {
  const P = {};
  const set = (k, x, y, z) => (P[k] = [x, y, z]);
  const s = SEG;
  set(0, 0, s.torso + 0.2, 0.03);
  set(11, s.shoulderHalf, s.torso, 0);
  set(12, -s.shoulderHalf, s.torso, 0);
  set(13, s.shoulderHalf, s.torso - s.upperArm, 0);
  set(14, -s.shoulderHalf, s.torso - s.upperArm, 0);
  set(15, s.shoulderHalf, s.torso - s.upperArm - s.foreArm, 0);
  set(16, -s.shoulderHalf, s.torso - s.upperArm - s.foreArm, 0);
  set(23, s.hipHalf, 0, 0);
  set(24, -s.hipHalf, 0, 0);
  set(25, s.hipHalf, -s.thigh, 0);
  set(26, -s.hipHalf, -s.thigh, 0);
  set(27, s.hipHalf, -s.thigh - s.shin, 0);
  set(28, -s.hipHalf, -s.thigh - s.shin, 0);
  Object.assign(P, overrides);
  const c = Math.cos(yaw);
  const sn = Math.sin(yaw);
  return Array.from({ length: 33 }, (_, k) => {
    const [x, y, z] = P[k] ?? [0, 0, 0];
    return { x: c * x + sn * z, y: -y, z: -(-sn * x + c * z), visibility: P[k] ? 0.99 : 0 };
  });
}

console.log('1. v1 backwards-compatibility (no smplx fields)');
{
  const v1Clip = JSON.parse(readFileSync(new URL('../../data/clips/clip_2026-10-23_caminar-perfil_01.json', import.meta.url)));
  const saved = JSON.parse(readFileSync(new URL('../motions/clip_2026-10-23_caminar-perfil_01.json', import.meta.url)));
  const { motion } = retargetClip(mujoco, sim.model, v1Clip);
  const worst = Math.max(...saved.qpos.flatMap((row, i) => row.map((v, k) => Math.abs(v - motion.qpos[i][k]))));
  expect(worst === 0, `v1 clip matches saved RobotMotion bit-for-bit (max diff=${worst.toExponential(1)})`);
}

console.log('2. synthetic SMPL-X axial twists & mirror symmetry');
{
  const U_L = new THREE.Vector3(-0.1587, 0.9498, -0.2697).normalize();
  const F_L = new THREE.Vector3(-0.0098, 0.9957, 0.0918).normalize();
  const U_R = new THREE.Vector3(-0.0963, -0.9865, -0.1328).normalize();
  const F_R = new THREE.Vector3(-0.0614, -0.9980, -0.0181).normalize();
  const DOWN = new THREE.Vector3(0, 0, -1);
  const UP = new THREE.Vector3(0, 0, 1);

  const qHangL = new THREE.Quaternion().setFromUnitVectors(U_L, DOWN);
  const qHangR = new THREE.Quaternion().setFromUnitVectors(U_R, DOWN);
  const qStraightElL = new THREE.Quaternion().setFromUnitVectors(F_L, U_L);
  const qStraightElR = new THREE.Quaternion().setFromUnitVectors(F_R, U_R);

  // (a) Hanging arm with +0.95 rad axial shoulder_yaw twist (impossible to read from 33 points alone).
  {
    const bp = new Array(63).fill(0);
    const qTwist = new THREE.Quaternion().setFromAxisAngle(DOWN, 0.95).multiply(qHangL);
    setBodyRotvec(bp, 16, toContractRotvec(qTwist));
    setBodyRotvec(bp, 18, toContractRotvec(qStraightElL));
    setBodyRotvec(bp, 17, toContractRotvec(qHangR));
    setBodyRotvec(bp, 19, toContractRotvec(qStraightElR));
    const world = makeStandingMediaPipe();
    const tracker = createPoseTracker({ smooth: false });
    const retNoSmplx = createRetargeter(mujoco, sim.model, { mirror: false });
    const retSmplx = createRetargeter(mujoco, sim.model, { mirror: false });
    const pose = tracker.update(world, world, 0);
    const outLegacy = retNoSmplx.solve(pose);
    const outSmplx = retSmplx.solve(pose, { smplx: { globalOrient: [0, 0, 0], bodyPose: bp } });
    retNoSmplx.delete();
    retSmplx.delete();
    const yawLegacy = outLegacy.qpos[j('left_shoulder_yaw_joint')];
    const yawSmplx = outSmplx.qpos[j('left_shoulder_yaw_joint')];
    expect(Math.abs(yawLegacy) < 0.1 && Math.abs(yawSmplx) > 0.75, `hanging left_shoulder_yaw preserved: legacy=${yawLegacy.toFixed(2)} rad, smplx=${yawSmplx.toFixed(2)} rad`);
  }

  // (b) Waist yaw (+0.51 rad across spine1, spine2, spine3) + mirror symmetry.
  {
    const bp = new Array(63).fill(0);
    setBodyRotvec(bp, 3, [0, 0.17, 0]);
    setBodyRotvec(bp, 6, [0, 0.17, 0]);
    setBodyRotvec(bp, 9, [0, 0.17, 0]);
    const qTwist = new THREE.Quaternion().setFromAxisAngle(DOWN, 0.9).multiply(qHangL);
    setBodyRotvec(bp, 16, toContractRotvec(qTwist));
    setBodyRotvec(bp, 18, toContractRotvec(qStraightElL));
    setBodyRotvec(bp, 17, toContractRotvec(qHangR));
    setBodyRotvec(bp, 19, toContractRotvec(qStraightElR));
    const a = 0.51;
    const rotY = (x, y, z) => [Math.cos(a) * x + Math.sin(a) * z, y, -Math.sin(a) * x + Math.cos(a) * z];
    const world = makeStandingMediaPipe({
      11: rotY(SEG.shoulderHalf, SEG.torso, 0),
      12: rotY(-SEG.shoulderHalf, SEG.torso, 0),
      13: rotY(SEG.shoulderHalf, SEG.torso - SEG.upperArm, 0),
      14: rotY(-SEG.shoulderHalf, SEG.torso - SEG.upperArm, 0),
      15: rotY(SEG.shoulderHalf, SEG.torso - SEG.upperArm - SEG.foreArm, 0),
      16: rotY(-SEG.shoulderHalf, SEG.torso - SEG.upperArm - SEG.foreArm, 0),
    });
    const tracker = createPoseTracker({ smooth: false });
    const pose = tracker.update(world, world, 0);
    const retDirect = createRetargeter(mujoco, sim.model, { mirror: false });
    const retMirror = createRetargeter(mujoco, sim.model, { mirror: true });
    const qDirect = retDirect.solve(pose, { smplx: { globalOrient: [0, 0, 0], bodyPose: bp } }).qpos;
    const qMirror = retMirror.solve(pose, { smplx: { globalOrient: [0, 0, 0], bodyPose: bp } }).qpos;
    retDirect.delete();
    retMirror.delete();
    expect(qDirect[j('waist_yaw_joint')] > 0.38, `waist_yaw preserved: ${qDirect[j('waist_yaw_joint')].toFixed(2)} rad (expected > 0.38)`);
    expect(Math.abs(qMirror[j('waist_yaw_joint')] + qDirect[j('waist_yaw_joint')]) < 0.05, `mirror negates waist_yaw (${qDirect[j('waist_yaw_joint')].toFixed(2)} vs ${qMirror[j('waist_yaw_joint')].toFixed(2)})`);
    expect(Math.abs(qMirror[j('right_shoulder_yaw_joint')] + qDirect[j('left_shoulder_yaw_joint')]) < 0.08, `mirror swaps & negates shoulder_yaw (${qDirect[j('left_shoulder_yaw_joint')].toFixed(2)} vs ${qMirror[j('right_shoulder_yaw_joint')].toFixed(2)})`);
  }

  // (c) Wrist roll (+1.15 rad) in profile (yaw = pi/2, live = false).
  {
    const bp = new Array(63).fill(0);
    setBodyRotvec(bp, 16, toContractRotvec(qHangL));
    setBodyRotvec(bp, 18, toContractRotvec(qStraightElL));
    setBodyRotvec(bp, 17, toContractRotvec(qHangR));
    setBodyRotvec(bp, 19, toContractRotvec(qStraightElR));
    setBodyRotvec(bp, 20, toContractRotvec(new THREE.Quaternion().setFromAxisAngle(F_L, 1.15)));
    const yaw = Math.PI / 2;
    const world = makeStandingMediaPipe({}, yaw);
    const tracker = createPoseTracker({ smooth: false });
    const retProfile = createRetargeter(mujoco, sim.model, { mirror: false, live: false });
    const out = retProfile.solve(tracker.update(world, world, 0), { smplx: { globalOrient: [0, yaw, 0], bodyPose: bp } });
    retProfile.delete();
    const wRoll = out.qpos[j('left_wrist_roll_joint')];
    expect(Math.abs(wRoll) > 0.9, `profile wrist_roll preserved (live=false): ${wRoll.toFixed(2)} rad`);
  }
}

console.log('3. real GVHMR clips (limits, crossed=0, hipTwistP95, reach, palm agreement)');
{
  const data = new mujoco.MjData(sim.model);
  const [lAnk, rAnk, pelvis] = ['left_ankle_roll_link', 'right_ankle_roll_link', 'pelvis'].map((n) => id('BODY', n));
  const [lWrist, rWrist] = ['left_wrist_yaw_link', 'right_wrist_yaw_link'].map((n) => id('BODY', n));
  const hipTwists = ['left_hip_yaw_joint', 'right_hip_yaw_joint'].map(j);
  const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const toR = (p) => new THREE.Vector3(p[2], p[0], p[1]);

  for (const name of ['clip_caminar-perfil-gvhmr.json', 'clip_saludar-02-gvhmr.json', 'clip_dedos-01-gvhmr.json', 'clip_jacks-01-gvhmr.json', 'clip_bailar-grupo-02-gvhmr.json']) {
    const clip = JSON.parse(readFileSync(new URL(`../../web/clips/${name}`, import.meta.url)));
    const { motion, stats } = retargetClip(mujoco, sim.model, clip);
    const inRange = motion.qpos.every(jointsInRange);
    let crossed = 0;
    let maxPelvisYawStep = 0;
    let prevPelvisYaw = null;
    const twists = [];
    const palmErrs = [];
    for (let i = 0; i < motion.qpos.length; i++) {
      const q = motion.qpos[i];
      const pelvisYaw = Math.atan2(2 * (q[3] * q[6] + q[4] * q[5]), 1 - 2 * (q[5] * q[5] + q[6] * q[6]));
      if (prevPelvisYaw !== null) {
        const dyaw = Math.abs(Math.atan2(Math.sin(pelvisYaw - prevPelvisYaw), Math.cos(pelvisYaw - prevPelvisYaw)));
        if (dyaw > maxPelvisYawStep) maxPelvisYawStep = dyaw;
      }
      prevPelvisYaw = pelvisYaw;
      data.qpos.set(q);
      mujoco.mj_kinematics(sim.model, data);
      const m = data.xmat;
      const dx = data.xpos[3 * lAnk] - data.xpos[3 * rAnk];
      const dy = data.xpos[3 * lAnk + 1] - data.xpos[3 * rAnk + 1];
      const dz = data.xpos[3 * lAnk + 2] - data.xpos[3 * rAnk + 2];
      if (m[9 * pelvis + 1] * dx + m[9 * pelvis + 4] * dy + m[9 * pelvis + 7] * dz < 0) crossed++;
      twists.push(...hipTwists.map((a) => Math.abs((q[a] * 180) / Math.PI)));

      const hands = clip.frames[i].hands;
      if (hands) {
        for (const [side, bodyIdx, sign] of [['left', lWrist, 1], ['right', rWrist, -1]]) {
          const pts = hands[side];
          if (!pts) continue;
          const hw = toR(pts[0]);
          const hIdx = toR(pts[5]);
          const hPnk = toR(pts[17]);
          const kn = new THREE.Vector3().addVectors(hIdx, hPnk).multiplyScalar(0.5);
          const len = kn.sub(hw);
          const acr = new THREE.Vector3().subVectors(hIdx, hPnk);
          const pHum = new THREE.Vector3().crossVectors(len, acr).multiplyScalar(sign);
          if (pHum.length() <= MIN_HAND_WIDTH * len.lengthSq()) continue;
          const b = 9 * bodyIdx;
          const fingers = new THREE.Vector3(m[b], m[b + 3], m[b + 6]).normalize();
          const pRob = new THREE.Vector3(m[b + 1], m[b + 4], m[b + 7]).multiplyScalar(-sign).normalize();
          pHum.normalize();
          pHum.addScaledVector(fingers, -pHum.dot(fingers)).normalize();
          const ang = (Math.acos(THREE.MathUtils.clamp(pHum.dot(pRob), -1, 1)) * 180) / Math.PI;
          palmErrs.push(ang);
        }
      }
    }
    const twistP95 = twists.sort((a, b) => a - b)[Math.floor(0.95 * (twists.length - 1))];
    expect(inRange, `${clip.id}: all joints within jnt_range`);
    expect(crossed === 0 && twistP95 < MAX_HIP_TWIST_DEG, `${clip.id}: crossed=${crossed}, hipTwistP95=${twistP95.toFixed(1)} deg (< ${MAX_HIP_TWIST_DEG})`);
    expect(stats.reached >= 0.95, `${clip.id}: ${(stats.reached * 100).toFixed(1)}% frames within ${REACH_TOLERANCE * 100} cm (>= 95%)`);
    expect(maxPelvisYawStep < MAX_PELVIS_YAW_STEP_RAD, `${clip.id}: maxPelvisYawStep=${maxPelvisYawStep.toFixed(3)} rad (< ${MAX_PELVIS_YAW_STEP_RAD})`);
    if (palmErrs.length) {
      const med = median(palmErrs);
      expect(med < MAX_MEDIAN_PALM_ERR_DEG, `${clip.id}: median WiLoR palm error ${med.toFixed(1)} deg across ${palmErrs.length} hand samples (< ${MAX_MEDIAN_PALM_ERR_DEG})`);
    }
  }
  data.delete();
}

console.log('4. speed budget with SMPL-X');
{
  const clip = JSON.parse(readFileSync(new URL('../../web/clips/clip_caminar-perfil-gvhmr.json', import.meta.url)));
  const tracker = createPoseTracker();
  const retargeter = createRetargeter(mujoco, sim.model, { mirror: false });
  const frames = 200;
  const start = performance.now();
  for (let i = 0; i < frames; i++) {
    const f = clip.frames[i % clip.frames.length];
    const world = f.joints.map(([x, y, z, visibility]) => ({ x, y: -y, z: -z, visibility }));
    retargeter.solve(tracker.update(world, world, f.t), {
      smplx: { globalOrient: f.smplx_global_orient, bodyPose: f.smplx_body_pose },
    });
  }
  const ms = (performance.now() - start) / frames;
  retargeter.delete();
  expect(ms < MAX_MS_PER_SOLVE, `${ms.toFixed(2)} ms per solve with SMPL-X (limit ${MAX_MS_PER_SOLVE})`);
}

console.log('5. malformed SMPL-X finiteness & type guards');
{
  const isCleanSolve = (out) => {
    const finiteQ = Array.from(out.qpos).every(Number.isFinite);
    return finiteQ && jointsInRange(out.qpos) && Number.isFinite(out.residual);
  };

  const world = makeStandingMediaPipe();
  const tracker = createPoseTracker({ smooth: false });
  const pose = tracker.update(world, world, 0);
  const ret = createRetargeter(mujoco, sim.model, { mirror: false });
  const badCases = [
    ['bodyPose[0]=NaN', { globalOrient: [0, 0, 0], bodyPose: Object.assign(new Array(63).fill(0), { 0: NaN }) }],
    ['bodyPose[45]=Infinity', { globalOrient: [0, 0, 0], bodyPose: Object.assign(new Array(63).fill(0), { 45: Infinity }) }],
    ['bodyPose[48]=-Infinity', { globalOrient: [0, 0, 0], bodyPose: Object.assign(new Array(63).fill(0), { 48: -Infinity }) }],
    ['globalOrient[0]=NaN', { globalOrient: [NaN, 0, 0], bodyPose: new Array(63).fill(0) }],
    ['globalOrient[1]=Infinity', { globalOrient: [0, Infinity, 0], bodyPose: new Array(63).fill(0) }],
    ['string bodyPose', { globalOrient: '000', bodyPose: '0'.repeat(63) }],
    ['array-like object bodyPose', { globalOrient: { length: 3, 0: 0, 1: 0, 2: 0 }, bodyPose: { length: 63, 0: 0 } }],
  ];
  for (const [label, smplx] of badCases) {
    const out = ret.solve(pose, { smplx });
    expect(isCleanSolve(out), `retargeter.solve(${label}): 0 NaNs, 0 violations, finite residual`);
  }
  ret.delete();

  // Also test motion.js retargetClip guard end-to-end with NaN/Infinity/non-array SMPL-X frames.
  const baseClip = JSON.parse(readFileSync(new URL('../../web/clips/clip_caminar-perfil-gvhmr.json', import.meta.url)));
  const testFrames = baseClip.frames.slice(0, 5).map((f) => ({
    ...f,
    smplx_body_pose: [...f.smplx_body_pose],
    smplx_global_orient: [...f.smplx_global_orient],
  }));
  testFrames[1].smplx_body_pose[7] = NaN;
  testFrames[2].smplx_global_orient[1] = Infinity;
  testFrames[3].smplx_body_pose = '0'.repeat(63);
  const { motion, stats } = retargetClip(mujoco, sim.model, { ...baseClip, frames: testFrames });
  const clipFinite = motion.qpos.every((r) => r.every(Number.isFinite));
  const clipInRange = motion.qpos.every(jointsInRange);
  expect(clipFinite && clipInRange && Number.isFinite(stats.reached), 'retargetClip handles NaN/Inf/string SMPL-X frames cleanly');
}

console.log('6. continuous 0..175 deg arm abduction sweep (no gimbal flip)');
{
  const U_L = new THREE.Vector3(-0.1587, 0.9498, -0.2697).normalize();
  const F_L = new THREE.Vector3(-0.0098, 0.9957, 0.0918).normalize();
  const U_R = new THREE.Vector3(-0.0963, -0.9865, -0.1328).normalize();
  const F_R = new THREE.Vector3(-0.0614, -0.9980, -0.0181).normalize();
  const DOWN = new THREE.Vector3(0, 0, -1);
  const X_AXIS = new THREE.Vector3(1, 0, 0);
  const qHangL = new THREE.Quaternion().setFromUnitVectors(U_L, DOWN);
  const qHangR = new THREE.Quaternion().setFromUnitVectors(U_R, DOWN);
  const qStraightElL = new THREE.Quaternion().setFromUnitVectors(F_L, U_L);
  const qStraightElR = new THREE.Quaternion().setFromUnitVectors(F_R, U_R);

  for (const [side, mirror] of [['left', false], ['right', false], ['left', true]]) {
    const ret = createRetargeter(mujoco, sim.model, { mirror });
    const tr = createPoseTracker({ smooth: false });
    const robSide = mirror ? (side === 'left' ? 'right' : 'left') : side;
    const shJoints = ['shoulder_pitch', 'shoulder_roll', 'shoulder_yaw', 'elbow'].map((k) => j(`${robSide}_${k}_joint`));
    let prev = null;
    let maxStep = 0;
    let maxAbsYaw = 0;
    for (let deg = 0; deg <= 175; deg += 5) {
      const rad = (deg * Math.PI) / 180;
      const sign = side === 'left' ? 1 : -1;
      const qAbd = new THREE.Quaternion().setFromAxisAngle(X_AXIS, sign * rad);
      const qArm = qAbd.clone().multiply(side === 'left' ? qHangL : qHangR);
      const d = new THREE.Vector3(0, 0, -1).applyQuaternion(qAbd);
      const shX = side === 'left' ? SEG.shoulderHalf : -SEG.shoulderHalf;
      const elb = [shX + d.y * SEG.upperArm, SEG.torso + d.z * SEG.upperArm, d.x * SEG.upperArm];
      const wrs = [shX + d.y * (SEG.upperArm + SEG.foreArm), SEG.torso + d.z * (SEG.upperArm + SEG.foreArm), d.x * (SEG.upperArm + SEG.foreArm)];
      const bp = new Array(63).fill(0);
      setBodyRotvec(bp, side === 'left' ? 16 : 17, toContractRotvec(qArm));
      setBodyRotvec(bp, side === 'left' ? 18 : 19, toContractRotvec(side === 'left' ? qStraightElL : qStraightElR));
      if (side === 'left') {
        setBodyRotvec(bp, 17, toContractRotvec(qHangR));
        setBodyRotvec(bp, 19, toContractRotvec(qStraightElR));
      } else {
        setBodyRotvec(bp, 16, toContractRotvec(qHangL));
        setBodyRotvec(bp, 18, toContractRotvec(qStraightElL));
      }
      const world = makeStandingMediaPipe(side === 'left' ? { 13: elb, 15: wrs } : { 14: elb, 16: wrs });
      const out = ret.solve(tr.update(world, world, deg / 50), { smplx: { globalOrient: [0, 0, 0], bodyPose: bp } });
      const cur = shJoints.map((k) => out.qpos[k]);
      maxAbsYaw = Math.max(maxAbsYaw, Math.abs(cur[2]));
      if (prev) {
        const s = Math.max(...cur.map((v, i) => Math.abs(v - prev[i])));
        if (s > maxStep) maxStep = s;
      }
      prev = cur;
    }
    ret.delete();
    expect(maxStep < MAX_ABDUCTION_STEP_RAD && maxAbsYaw < MAX_SHOULDER_YAW_CLAMP,
      `0..175 deg abduction (${side}, mirror=${mirror}): maxStep=${maxStep.toFixed(3)} rad (< ${MAX_ABDUCTION_STEP_RAD}), max|yaw|=${maxAbsYaw.toFixed(3)} rad (< ${MAX_SHOULDER_YAW_CLAMP})`);
  }

  // Diagonal shoulder sweep (flex=30, yaw=0.6, right, 0..175 deg): no exact-branch snap across twist clamp.
  {
    const Y_AXIS = new THREE.Vector3(0, 1, 0);
    const Z_AXIS = new THREE.Vector3(0, 0, 1);
    const ret = createRetargeter(mujoco, sim.model, { mirror: false });
    const tr = createPoseTracker({ smooth: false });
    const shJoints = ['shoulder_pitch', 'shoulder_roll', 'shoulder_yaw', 'elbow'].map((k) => j(`right_${k}_joint`));
    let prev = null;
    let maxStep = 0;
    let maxRes = 0;
    for (let deg = 0; deg <= 175; deg += 5) {
      const rad = (deg * Math.PI) / 180;
      const qRot = new THREE.Quaternion()
        .setFromAxisAngle(Y_AXIS, (30 * Math.PI) / 180)
        .multiply(new THREE.Quaternion().setFromAxisAngle(X_AXIS, -rad))
        .multiply(new THREE.Quaternion().setFromAxisAngle(Z_AXIS, 0.6));
      const qArm = qRot.clone().multiply(qHangR);
      const d = new THREE.Vector3(0, 0, -1).applyQuaternion(qRot);
      const shX = -SEG.shoulderHalf;
      const elb = [shX + d.y * SEG.upperArm, SEG.torso + d.z * SEG.upperArm, d.x * SEG.upperArm];
      const wrs = [shX + d.y * (SEG.upperArm + SEG.foreArm), SEG.torso + d.z * (SEG.upperArm + SEG.foreArm), d.x * (SEG.upperArm + SEG.foreArm)];
      const bp = new Array(63).fill(0);
      setBodyRotvec(bp, 16, toContractRotvec(qHangL));
      setBodyRotvec(bp, 18, toContractRotvec(qStraightElL));
      setBodyRotvec(bp, 17, toContractRotvec(qArm));
      setBodyRotvec(bp, 19, toContractRotvec(qStraightElR));
      const world = makeStandingMediaPipe({ 14: elb, 16: wrs });
      const out = ret.solve(tr.update(world, world, deg / 50), { smplx: { globalOrient: [0, 0, 0], bodyPose: bp } });
      const cur = shJoints.map((k) => out.qpos[k]);
      maxRes = Math.max(maxRes, out.residual);
      if (prev) maxStep = Math.max(maxStep, ...cur.map((v, i) => Math.abs(v - prev[i])));
      prev = cur;
    }
    ret.delete();
    expect(maxStep < MAX_DIAG_ABDUCTION_STEP_RAD && maxRes < REACH_TOLERANCE,
      `diagonal shoulder (flex=30, yaw=0.6, right, 0..175 deg): maxStep=${maxStep.toFixed(3)} rad (< ${MAX_DIAG_ABDUCTION_STEP_RAD}), maxRes=${maxRes.toFixed(4)} m (< ${REACH_TOLERANCE})`);
  }

  // Wrist gimbal-cone sweep (wrist_pitch = 1.48, yaw = 1.5, roll = -85..+90 deg): collinear cand[2]/cand[3].
  {
    const bX = new THREE.Vector3();
    const bY = new THREE.Vector3();
    const bZ = new THREE.Vector3();
    const mB = new THREE.Matrix4();
    const fng = new THREE.Vector3(-0.0363, 0.9977, -0.0577).normalize();
    const plm = new THREE.Vector3(0.1072, -0.0535, -0.9928).normalize();
    const yDir = plm.clone().multiplyScalar(-1);
    bX.copy(fng).normalize();
    bY.copy(yDir).addScaledVector(bX, -yDir.dot(bX)).normalize();
    bZ.crossVectors(bX, bY);
    const alignHandLInv = new THREE.Quaternion().setFromRotationMatrix(mB.makeBasis(bX, bY, bZ)).invert();
    const qArmFoInv = qHangL.clone().multiply(qStraightElL).invert();

    const ret0 = createRetargeter(mujoco, sim.model, { mirror: false });
    const tr0 = createPoseTracker({ smooth: false });
    const bp0 = new Array(63).fill(0);
    setBodyRotvec(bp0, 16, toContractRotvec(qHangL));
    setBodyRotvec(bp0, 18, toContractRotvec(qStraightElL));
    setBodyRotvec(bp0, 17, toContractRotvec(qHangR));
    setBodyRotvec(bp0, 19, toContractRotvec(qStraightElR));
    const out0 = ret0.solve(tr0.update(makeStandingMediaPipe(), makeStandingMediaPipe(), 0), { smplx: { globalOrient: [0, 0, 0], bodyPose: bp0 } });
    const d0 = new mujoco.MjData(sim.model);
    d0.qpos.set(out0.qpos);
    mujoco.mj_kinematics(sim.model, d0);
    const elId = id('BODY', 'left_elbow_link');
    const qElLink = new THREE.Quaternion(d0.xquat[4 * elId + 1], d0.xquat[4 * elId + 2], d0.xquat[4 * elId + 3], d0.xquat[4 * elId]);
    d0.delete();
    ret0.delete();

    const ret = createRetargeter(mujoco, sim.model, { mirror: false });
    const tr = createPoseTracker({ smooth: false });
    const wrJoints = ['roll', 'pitch', 'yaw'].map((k) => j(`left_wrist_${k}_joint`));
    let prev = null;
    let maxStep = 0;
    for (let deg = -85; deg <= 90; deg += 5) {
      const roll = (deg * Math.PI) / 180;
      const bp = new Array(63).fill(0);
      setBodyRotvec(bp, 16, toContractRotvec(qHangL));
      setBodyRotvec(bp, 18, toContractRotvec(qStraightElL));
      setBodyRotvec(bp, 17, toContractRotvec(qHangR));
      setBodyRotvec(bp, 19, toContractRotvec(qStraightElR));
      const qTarget = qElLink.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(roll, 1.48, 1.5, 'XYZ')));
      const qWr = qArmFoInv.clone().multiply(qTarget).multiply(alignHandLInv);
      setBodyRotvec(bp, 20, toContractRotvec(qWr));
      const world = makeStandingMediaPipe();
      const out = ret.solve(tr.update(world, world, (deg + 85) / 100), { smplx: { globalOrient: [0, 0, 0], bodyPose: bp } });
      const cur = wrJoints.map((k) => out.qpos[k]);
      if (prev) maxStep = Math.max(maxStep, ...cur.map((v, i) => Math.abs(v - prev[i])));
      prev = cur;
    }
    ret.delete();
    expect(maxStep < MAX_ABDUCTION_STEP_RAD, `wrist gimbal-cone (pitch=1.48, yaw=1.5, roll=-85..+90 deg): maxStep=${maxStep.toFixed(3)} rad (< ${MAX_ABDUCTION_STEP_RAD})`);
  }

  // Hip roll sweep through +-90 deg gimbal cone (L: -25..+90..0 deg, R: +25..-90..0 deg).
  {
    const T_L = new THREE.Vector3(-0.0245, 0.1429, -0.9894).normalize();
    const S_L = new THREE.Vector3(-0.0784, -0.1069, -0.9912).normalize();
    const T_R = new THREE.Vector3(-0.0460, -0.1210, -0.9916).normalize();
    const S_R = new THREE.Vector3(-0.0491, 0.0375, -0.9981).normalize();
    const qStandLegL = new THREE.Quaternion().setFromUnitVectors(T_L, DOWN);
    const qStandLegR = new THREE.Quaternion().setFromUnitVectors(T_R, DOWN);
    const qStraightKnL = new THREE.Quaternion().setFromUnitVectors(S_L, T_L);
    const qStraightKnR = new THREE.Quaternion().setFromUnitVectors(S_R, T_R);
    for (const side of ['left', 'right']) {
      const ret = createRetargeter(mujoco, sim.model, { mirror: false });
      const tr = createPoseTracker({ smooth: false });
      const hipJoints = ['hip_pitch', 'hip_roll', 'hip_yaw', 'knee'].map((k) => j(`${side}_${k}_joint`));
      const sign = side === 'left' ? 1 : -1;
      const degs = [];
      for (let d = -25; d <= 90; d += 5) degs.push(sign * d);
      for (let d = 85; d >= 0; d -= 5) degs.push(sign * d);
      let prev = null;
      let maxStep = 0;
      for (let idx = 0; idx < degs.length; idx++) {
        const rad = (degs[idx] * Math.PI) / 180;
        const qRoll = new THREE.Quaternion().setFromAxisAngle(X_AXIS, rad);
        const qLeg = qRoll.clone().multiply(side === 'left' ? qStandLegL : qStandLegR);
        const d = new THREE.Vector3(0, 0, -1).applyQuaternion(qRoll);
        const hX = side === 'left' ? SEG.hipHalf : -SEG.hipHalf;
        const kn = [hX + d.y * SEG.thigh, d.z * SEG.thigh, d.x * SEG.thigh];
        const ak = [hX + d.y * (SEG.thigh + SEG.shin), d.z * (SEG.thigh + SEG.shin), d.x * (SEG.thigh + SEG.shin)];
        const bp = new Array(63).fill(0);
        setBodyRotvec(bp, 1, toContractRotvec(side === 'left' ? qLeg : qStandLegL));
        setBodyRotvec(bp, 4, toContractRotvec(qStraightKnL));
        setBodyRotvec(bp, 2, toContractRotvec(side === 'right' ? qLeg : qStandLegR));
        setBodyRotvec(bp, 5, toContractRotvec(qStraightKnR));
        const world = makeStandingMediaPipe(side === 'left' ? { 25: kn, 27: ak } : { 26: kn, 28: ak });
        const out = ret.solve(tr.update(world, world, idx / 50), { smplx: { globalOrient: [0, 0, 0], bodyPose: bp } });
        const cur = hipJoints.map((k) => out.qpos[k]);
        if (prev) maxStep = Math.max(maxStep, ...cur.map((v, i) => Math.abs(v - prev[i])));
        prev = cur;
      }
      ret.delete();
      expect(maxStep < MAX_ABDUCTION_STEP_RAD, `hip_roll sweep (${side}, -+25..+-90..0 deg): maxStep=${maxStep.toFixed(3)} rad (< ${MAX_ABDUCTION_STEP_RAD})`);
    }
  }
}

console.log('7. multi-frame hasSmplx <-> !hasSmplx alternating transitions with travelYaw');
{
  const baseClip = JSON.parse(readFileSync(new URL('../../web/clips/clip_caminar-perfil-gvhmr.json', import.meta.url)));
  const slice = baseClip.frames.slice(0, 200);
  for (const [label, dropSmplx] of [
    ['25f blocks', (i) => Math.floor(i / 25) % 2 === 1],
    ['every other frame', (i) => i % 2 === 1],
  ]) {
    const frames = slice.map((f, i) => {
      if (!dropSmplx(i)) return f;
      const { smplx_body_pose: _bp, smplx_global_orient: _go, ...rest } = f;
      return rest;
    });
    const { motion, stats } = retargetClip(mujoco, sim.model, { ...baseClip, frames });
    const finite = motion.qpos.every((r) => r.every(Number.isFinite));
    const inRange = motion.qpos.every(jointsInRange);
    expect(stats.tracked === frames.length && stats.reached >= 0.95 && finite && inRange,
      `alternating hasSmplx <-> !hasSmplx (${label}): tracked=${stats.tracked}/${frames.length}, reach=${(stats.reached * 100).toFixed(1)}%, finite=${finite}, inRange=${inRange}`);
  }
}

console.log('8. malformed visible landmark / hand finiteness guards (GAP-3)');
{
  const clonePose = (pose) => ({
    points: pose.points.map((p) => p.clone()),
    visible: [...pose.visible],
  });
  const isCleanSolve = (out) =>
    Array.from(out.qpos).every(Number.isFinite) && jointsInRange(out.qpos) && Number.isFinite(out.residual);

  const world = makeStandingMediaPipe();
  const tracker = createPoseTracker({ smooth: false });
  const basePose = tracker.update(world, world, 0);
  const ret = createRetargeter(mujoco, sim.model, { mirror: false, live: true });

  // 8a. Visible shoulder with NaN -> tracked=false, finite qpos, and subsequent tracked=false stays unpoisoned.
  const pShoulderNaN = clonePose(basePose);
  pShoulderNaN.visible[11] = true;
  pShoulderNaN.visible[12] = true;
  pShoulderNaN.visible[23] = false;
  pShoulderNaN.visible[24] = false;
  pShoulderNaN.points[11].x = Number.NaN;
  const outShoulderNaN = ret.solve(pShoulderNaN);
  expect(
    outShoulderNaN.tracked === false && outShoulderNaN.residual === 0 && isCleanSolve(outShoulderNaN),
    'visible shoulder NaN (hipsSeen=false) returns tracked=false without poisoning qpos/residual',
  );

  const pUntracked = clonePose(basePose);
  pUntracked.visible[11] = false;
  pUntracked.visible[12] = false;
  const outUntracked = ret.solve(pUntracked);
  expect(
    outUntracked.tracked === false && outUntracked.residual === 0 && isCleanSolve(outUntracked),
    'subsequent tracked=false frame stays finite and unpoisoned',
  );

  // 8b. Visible hip with Infinity (hipsSeen=true) -> falls back to hipsSeen=false safely.
  const pHipInf = clonePose(basePose);
  pHipInf.visible[23] = true;
  pHipInf.visible[24] = true;
  pHipInf.points[23].y = Infinity;
  const outHipInf = ret.solve(pHipInf);
  expect(
    outHipInf.tracked === true && isCleanSolve(outHipInf),
    'visible hip Infinity (hipsSeen=true) yields finite qpos and finite residual',
  );

  // 8c. Visible elbow with NaN -> limb ignored cleanly, finite residual & qpos.
  const pElbowNaN = clonePose(basePose);
  pElbowNaN.visible[13] = true;
  pElbowNaN.points[13].z = Number.NaN;
  const outElbowNaN = ret.solve(pElbowNaN);
  expect(
    outElbowNaN.tracked === true && isCleanSolve(outElbowNaN),
    'visible elbow NaN yields finite qpos and finite residual',
  );

  // 8d. Live hands with NaN coordinate + NaN travelYaw -> clean finite solve.
  const badHand = Array.from({ length: 21 }, (_, k) => ({ x: 0.01 * k, y: 0.02 * k, z: 0 }));
  badHand[5].x = Number.NaN;
  const outHandNaN = ret.solve(clonePose(basePose), {
    travelYaw: Number.NaN,
    hands: { left: badHand, right: badHand.slice(0, 10) },
  });
  expect(
    outHandNaN.tracked === true && isCleanSolve(outHandNaN),
    'malformed 21-pt hand (NaN / short array) and NaN travelYaw keep qpos & residual finite',
  );

  ret.delete();
}

console.log('9. malformed PoseClip.frames[i].hands guards in retargetClip (GAP-8)');
{
  const baseClip = JSON.parse(readFileSync(new URL('../../web/clips/clip_caminar-perfil-gvhmr.json', import.meta.url)));
  const badHandFrames = baseClip.frames.slice(0, 3).map((f) => ({ ...f }));
  badHandFrames[0].hands = { left: Array(21).fill(null), right: null };
  badHandFrames[1].hands = { left: Array.from({ length: 21 }, () => ({ x: 0.1, y: 0.2, z: 0.3 })), right: null };
  badHandFrames[2].hands = { left: { 0: [0, 0, 0] }, right: 'bad' };
  let err = null;
  let result = null;
  try {
    result = retargetClip(mujoco, sim.model, { ...baseClip, frames: badHandFrames });
  } catch (e) {
    err = e;
  }
  const clipFinite = result?.motion?.qpos?.every((r) => r.every(Number.isFinite)) ?? false;
  const clipInRange = result?.motion?.qpos?.every(jointsInRange) ?? false;
  expect(
    !err && result?.motion?.qpos?.length === 3 && clipFinite && clipInRange && Number.isFinite(result?.stats?.reached),
    `retargetClip handles null tuple / {x,y,z} object / non-array hands cleanly (err=${err?.message ?? 'none'})`,
  );
}

sim.delete();
if (failures.length) {
  console.error(`\ncheck-smplx-retarget failed: ${failures.length}`);
  process.exit(1);
}
console.log('\ncheck-smplx-retarget passed');
