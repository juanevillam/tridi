// Retargeting: a human pose (from createPoseTracker) -> the joint angles of the Unitree G1, as
// one MuJoCo qpos row (the RobotMotion row of docs/contrato.md).
//
// The method is Sombra's (src/robot.js there): body frames from the shoulders and hips, then
// coordinate-descent IK on the robot's real kinematic chain instead of closed-form formulas, so
// nobody has to derive each axis' sign by hand. The difference is that the chain is the MuJoCo
// model itself (mj_kinematics on a scratch copy), so these are the angles the simulated G1 uses.
//
// What is copied:
//   pelvis    heading only (yaw); the robot stays upright, the waist and legs carry the rest
//   waist     torso orientation relative to the hips
//   arms/legs the direction of the upper and lower segment, in the torso (arms) or hip (legs) frame
//   feet      kept flat on the floor
//   wrists   live only (options.live): how the hand bends off the forearm and which way its palm
//             faces, from the pose's wrist, index, pinky and thumb points, or from MediaPipe's
//             hand model when the camera runs it (solve's `hands`: 21 points a hand)
// What is not: head (the G1 has no neck), fingers (the G1 model here has none).
// Whatever the camera does not see (legs of someone sitting at a desk) stays in the stand pose.
import * as THREE from 'three';
import { idOf } from './sim.js';

// Coordinate descent, settings from Sombra, where they were tuned on the Apollo and the G1.
const IK_ITERATIONS = 6;
const IK_PROBE = 0.02; // rad, to estimate each joint's slope
const IK_MAX_STEP = 0.35; // rad per iteration, avoids sudden jumps
// A twisted posture can reach the same point as a natural one: a small cost for moving away from
// 0 (about 2 to 5 cm of error) breaks the tie in favor of the natural one.
const JOINT_PENALTY = 0.0005;
// The legs need more than that. Their IK only pins the knee and the ankle, so with the leg nearly
// straight the hip's twist is free, and seen from the side the knees' left-right position comes from
// MediaPipe's depth, its noisiest axis. With the small penalty alone, the walk of data/clips twisted
// the left hip 27 to 71 degrees, closed both legs inward against their limits and crossed the feet in
// 12% of the frames. A person walking twists the hip about 10 degrees. So the hip's twist, and
// closing the leg inward past the stand pose, cost much more; opening it outward (jumping jacks) does not.
const HIP_TWIST_PENALTY = 0.02;
// The same goes for the shoulders' twist and the waist's turn: seen from the side, the shoulder line
// is depth too, and the arms and the torso spun with it. Measured on the clips of data/clips: the
// run's shoulder twist went from -43..40 to -3..3 degrees (p5..p95), and the walk's waist turn from
// -21..12 to -12..7 (a person walking turns it about 10).
const SHOULDER_TWIST_PENALTY = 0.05;
// Live, a person facing the camera has the shoulder line across the image, not along its depth, and
// 0.05 kept the arm's twist at ~17% of what a raised forearm needs (docs/investigacion/
// 2026-10-24-manos-y-dedos-en-vivo.md): waving or arms up came out flattened. Facing the camera
// the penalty drops to this, and it grows back to 0.05 as the person turns to profile.
const SHOULDER_TWIST_FACING = 0.005;
// The wrist (live) copies the hand's bend off the forearm (up-down and side to side). The bend is taken off the person's forearm and put on the
// robot's, so a difference between their arms does not show as a bent wrist. Seen from the side
// the hand is edge-on and its points are a guess: on data/clips' profile walk the wrist stayed
// bent ~45 degrees the whole clip. So the bend counts fully facing the camera and fades to none in
// profile (by cos^2 of the heading), the reverse of the shoulder's twist penalty.
// It also copies which way the palm faces (forward, back, up, down), with the forearm's roll: without
// it the palm was never read, and palms forward and back gave the same robot (check-gestures). The
// palm's normal is the cross product of the hand's length and its width (pinky to index and thumb),
// and its part toward the camera only uses the image's axes (x, y), the steady ones: that is the
// part that tells a palm forward from one back. Read from the index and pinky alone, ~5 cm apart,
// the turn flipped between its limits (+-113 degrees) in data/clips' jumping jacks; the thumb's tip
// doubles the width. A hand whose points collapse (narrower than this share of its length: a fist
// read badly, or a misread) gives no palm, and the wrist keeps its roll.
const MIN_HAND_WIDTH = 0.3;
// The roll's own cost, so a palm read at the edge of its trust does not swing the forearm fully.
const WRIST_ROLL_PENALTY = 0.02;
const WAIST_TWIST_PENALTY = 0.2;
const HIP_INWARD_PENALTY = 0.05;
// The penalties alone do not stop it: the data itself puts the knees and ankles inward, because
// the left-right position of a leg seen from the side is depth. So each leg segment may point
// inward (toward the other leg), measured in the hips' frame, by at most this much; outward is free.
// sin(5 degrees): a person's thigh and shin lean in a few degrees while walking, never across.
// Together (measured on the walk, run and jumping jacks of data/clips): feet crossed in 0% of the
// frames (12% and 7% before), hip twist 9 to 19 degrees at p95 (48 to 68), jumping jacks still open
// the legs 24 degrees, and the limbs still reach within 8 cm in 97 to 100% of the frames.
const MAX_LEG_INWARD = Math.sin((5 * Math.PI) / 180);
// sin^2 of a 45-degree heading: past it the person is closer to profile than to facing the camera.
const PROFILE_SIN2 = 0.5;
// The solution from rest replaces the one from the previous frame only if it costs under 70% of it.
const RESEED_MARGIN = 0.7;
// When SMPL-X 3D rotations are given (PoseClip v2), IK keeps axial twists (shoulder_yaw, hip_yaw,
// wrist_roll) anchored near the closed-form SMPL-X seed instead of pulling them to 0.
const SMPLX_TWIST_PRIOR = 0.05;
// Minimum |cos(middle Euler angle)| before 'YXZ'/'XYZ' outer axes become collinear (within ~12.7 deg
// of +-90 deg gimbal lock): below this we attenuate the axial twist prior smoothly to 0 and gently
// anchor shoulder_pitch toward its SMPL-X seed so tiny link offsets cannot swing pitch across +-cos.
const GIMBAL_COS_THRESHOLD = 0.22;
// Narrower ~6.9 deg cone (|cos(middle)| < 0.12) where outer Euler axes are nearly collinear and
// cand[2]/cand[3] project onto prev0/prev2 without freezing too far from +-90 deg.
const GIMBAL_LOCK_CONE_COS = 0.12;
const SH_GIMBAL_PITCH_PRIOR = 0.005;
// Weight (rad_joint / rad_ori) trading clamped 3D orientation error against joint-space step
// distance when selecting an equivalent Euler branch: prevents sudden ~2*pi flips at a joint stop.
const BRANCH_ORI_WEIGHT = 2.0;
// Clamped orientation error (rad) above which an exact (0-error) Euler branch overrides joint
// continuity so a limb does not stay pinned against a roll stop once the other branch is feasible.
const BRANCH_MAX_CLAMP_ERR = 0.05;
// Orientation error tolerance (rad) below which an Euler candidate counts as strictly in range.
const BRANCH_IN_RANGE_EPS = 1e-4;
const TWO_PI = 2 * Math.PI;
// Zero-allocation element-wise finiteness guard for optional SMPL-X rotation arrays and 3D landmarks.
const allFinite = (arr, n) => {
  if (!(Array.isArray(arr) || ArrayBuffer.isView(arr)) || arr.length < n) return false;
  for (let i = 0; i < n; i++) if (!Number.isFinite(arr[i])) return false;
  return true;
};
const finitePt = (p) => Boolean(p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));
const wrapPi = (ang) => Math.atan2(Math.sin(ang), Math.cos(ang));
// Fixed mount offsets in unitree_g1/g1_mjx.xml: shoulder_pitch_link tilts +-16 deg about X (lines
// 259, 310) and hip_roll_link tilts -10 deg about Y (lines 149, 196); cancelled during decomposition.
const SH_MOUNT = 2 * Math.atan2(0.139201, 0.990264);
const HIP_MOUNT = 2 * Math.atan2(0.0873386, 0.996179);
// Neutral SMPL-X (body_pose = 0) bone unit vectors in robot world axes (x = z_c, y = x_c, z = y_c),
// measured from SMPLX_NEUTRAL so G1 aligns with SMPL-X's 18.2 deg left / 9.4 deg right shoulder droop.
const SMPLX_REST = {
  left: {
    uDir: [-0.1587, 0.9498, -0.2697],
    fDir: [-0.0098, 0.9957, 0.0918],
    tDir: [-0.0245, 0.1429, -0.9894],
    sDir: [-0.0784, -0.1069, -0.9912],
    fng: [-0.0363, 0.9977, -0.0577],
    plm: [0.1072, -0.0535, -0.9928],
  },
  right: {
    uDir: [-0.0963, -0.9865, -0.1328],
    fDir: [-0.0614, -0.9980, -0.0181],
    tDir: [-0.0460, -0.1210, -0.9916],
    sDir: [-0.0491, 0.0375, -0.9981],
    fng: [-0.0346, -0.9956, -0.0874],
    plm: [0.1152, 0.0829, -0.9899],
  },
};
const X_AXIS = new THREE.Vector3(1, 0, 0);

// MediaPipe indices of the human side that drives each robot side. Mirror mode swaps them (and
// flips the pose), so the robot moves like your reflection: raise your right hand and the arm on
// the same side of the screen goes up.
const HUMAN = {
  left: { shoulder: 11, elbow: 13, wrist: 15, pinky: 17, index: 19, thumb: 21, hip: 23, knee: 25, ankle: 27 },
  right: { shoulder: 12, elbow: 14, wrist: 16, pinky: 18, index: 20, thumb: 22, hip: 24, knee: 26, ankle: 28 },
};
const OTHER = { left: 'right', right: 'left' };

const UP = new THREE.Vector3(0, 0, 1);

// The G1's body names. `frame` says which human body frame the limb's directions are measured in.
const limbs = (side) => [
  {
    name: `${side}_arm`,
    side,
    frame: 'torso',
    joints: ['shoulder_pitch', 'shoulder_roll', 'shoulder_yaw', 'elbow'].map((j) => `${side}_${j}_joint`),
    root: `${side}_shoulder_pitch_link`,
    mid: `${side}_elbow_link`,
    tip: `${side}_wrist_roll_link`,
    human: ['shoulder', 'elbow', 'wrist'],
    hand: { joints: ['roll', 'pitch', 'yaw'].map((j) => `${side}_wrist_${j}_joint`), link: `${side}_wrist_yaw_link` },
  },
  {
    name: `${side}_leg`,
    side,
    frame: 'hip',
    joints: ['hip_pitch', 'hip_roll', 'hip_yaw', 'knee'].map((j) => `${side}_${j}_joint`),
    root: `${side}_hip_pitch_link`,
    mid: `${side}_knee_link`,
    tip: `${side}_ankle_pitch_link`,
    human: ['hip', 'knee', 'ankle'],
    foot: { joints: [`${side}_ankle_pitch_joint`, `${side}_ankle_roll_joint`], link: `${side}_ankle_roll_link` },
  },
];
const WAIST = { joints: ['waist_yaw_joint', 'waist_roll_joint', 'waist_pitch_joint'], link: 'torso_link' };

/**
 * @param mujoco  the loaded @mujoco/mujoco module
 * @param model   the G1's MjModel (it must have the "stand" keyframe)
 * @param options.mirror  move like a reflection (default) or like the person, left with left
 * @param options.live    for the live camera: the wrists follow the hand, and the shoulders may
 *   twist freely while the person faces the camera. Also for clips recorded with the live camera
 *   (motion.js), so they train on what the robot did; off for clips of uploaded videos, whose
 *   RobotMotions are the training references they were measured with.
 * @returns { solve(pose) -> { qpos, residual, tracked } }
 */
export function createRetargeter(mujoco, model, { mirror = true, live = false } = {}) {
  const data = new mujoco.MjData(model);
  mujoco.mj_resetDataKeyframe(model, data, idOf(mujoco, model, 'KEY', 'stand'));
  const standQ = Float64Array.from(data.qpos); // the stand pose, what a hidden arm swings around

  const bodyId = (name) => idOf(mujoco, model, 'BODY', name);
  const joint = (name) => {
    const id = idOf(mujoco, model, 'JOINT', name);
    // Inward for a hip roll: negative on the left leg, positive on the right (the G1's ranges).
    const inward = name.endsWith('hip_roll_joint') ? (name.startsWith('left') ? -1 : 1) : 0;
    const twist = name.endsWith('hip_yaw_joint') ? HIP_TWIST_PENALTY
      : name.endsWith('shoulder_yaw_joint') ? SHOULDER_TWIST_PENALTY
      : name === 'waist_yaw_joint' ? WAIST_TWIST_PENALTY
      : name.endsWith('wrist_roll_joint') ? WRIST_ROLL_PENALTY : 0;
    return { name, adr: model.jnt_qposadr[id], limited: model.jnt_limited[id], lo: model.jnt_range[2 * id], hi: model.jnt_range[2 * id + 1],
      twist, inward,
      sideIdx: name.startsWith('left') ? 0 : 1,
      isShoulderPitch: name.endsWith('shoulder_pitch_joint'),
      isShoulderYaw: name.endsWith('shoulder_yaw_joint'),
      isHipPitch: name.endsWith('hip_pitch_joint'),
      isHipYaw: name.endsWith('hip_yaw_joint'),
      isWristRoll: name.endsWith('wrist_roll_joint') };
  };

  // Live views into the scratch MjData, refreshed at the start of every solve.
  let Q = data.qpos;
  let XPOS = data.xpos;
  let XQUAT = data.xquat;
  const fk = () => mujoco.mj_kinematics(model, data);
  const position = (id, out) => out.set(XPOS[3 * id], XPOS[3 * id + 1], XPOS[3 * id + 2]);
  // MuJoCo stores quaternions as (w, x, y, z); three.js as (x, y, z, w).
  const orientation = (id, out) => out.set(XQUAT[4 * id + 1], XQUAT[4 * id + 2], XQUAT[4 * id + 3], XQUAT[4 * id]);
  const getJoint = (j) => Q[j.adr];
  const setJoint = (j, v) => (Q[j.adr] = j.limited ? Math.min(j.hi, Math.max(j.lo, v)) : v);

  // Everything the solver needs about the robot, measured once in the stand pose.
  const pelvisId = bodyId('pelvis');
  const waist = { joints: WAIST.joints.map(joint), body: bodyId(WAIST.link) };
  const chains = [...limbs('left'), ...limbs('right')].map((c) => ({
    ...c,
    joints: c.joints.map(joint),
    rootId: bodyId(c.root),
    midId: bodyId(c.mid),
    tipId: bodyId(c.tip),
    foot: c.foot && { joints: c.foot.joints.map(joint), body: bodyId(c.foot.link) },
    hand: c.hand && { joints: c.hand.joints.map(joint), body: bodyId(c.hand.link) },
    targetMid: new THREE.Vector3(),
    targetTip: new THREE.Vector3(),
  }));
  // Soles: the G1 models each foot as four small spheres in its ankle roll link.
  const footBodies = new Set(chains.filter((c) => c.foot).map((c) => c.foot.body));
  const soles = [];
  for (let g = 0; g < model.ngeom; g++) {
    if (footBodies.has(model.geom_bodyid[g]) && model.geom_type[g] === mujoco.mjtGeom.mjGEOM_SPHERE.value) {
      soles.push({ id: g, radius: model.geom_size[3 * g] });
    }
  }

  fk();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  for (const c of chains) {
    c.upperLength = position(c.rootId, a).distanceTo(position(c.midId, b));
    c.foreLength = position(c.midId, a).distanceTo(position(c.tipId, b));
  }
  // Orientations at rest (stand pose, pelvis upright), world = pelvis frame. A target is "the
  // rest orientation, turned the way the person turned".
  const rest = { torso: orientation(waist.body, new THREE.Quaternion()) };
  for (const c of chains) if (c.foot) rest[c.name] = orientation(c.foot.body, new THREE.Quaternion());
  const restTorsoInverse = rest.torso.clone().invert();
  // The fingers run along the hand's +x (wrist_yaw_link; the chain runs along x). The palm faces
  // its -y on the left hand and +y on the right: in the stand pose both face the thighs (measured).
  const fingersOf = (id, out) => {
    const m = data.xmat;
    return out.set(m[9 * id], m[9 * id + 3], m[9 * id + 6]);
  };
  const palmOf = (id, out, sign) => {
    const m = data.xmat;
    return out.set(m[9 * id + 1], m[9 * id + 4], m[9 * id + 7]).multiplyScalar(-sign);
  };
  const handTarget = new THREE.Vector3();
  const handNow = new THREE.Vector3();
  const palmTarget = new THREE.Vector3();
  const palmNow = new THREE.Vector3();
  const across = new THREE.Vector3();
  const knuckles = new THREE.Vector3();
  // The hand model's 21 points per robot side, in robot axes (only their differences are used: the
  // model puts each hand's origin at its own center).
  const handPoints = { left: Array.from({ length: 21 }, () => new THREE.Vector3()), right: Array.from({ length: 21 }, () => new THREE.Vector3()) };
  // Hand model indices: the wrist, and the index and pinky knuckles, the palm's corners.
  const HAND_WRIST = 0;
  const HAND_INDEX = 5;
  const HAND_PINKY = 17;
  let palmWeight = 0; // how much the palm counts in this hand's solve (0 when it was not read)
  const bend = new THREE.Quaternion();
  const NO_TURN = new THREE.Quaternion();
  const forearm = new THREE.Vector3();

  // Per-solve scratch.
  const S = Array.from({ length: 33 }, () => new THREE.Vector3()); // pose, flipped when mirroring
  const vis = new Uint8Array(33); // visible and finite landmarks for the current solve
  const pelvisQ = new THREE.Quaternion();
  const hTorso = new THREE.Quaternion();
  const hHip = new THREE.Quaternion();
  const toLocal = new THREE.Quaternion();
  const canonical = new THREE.Quaternion();
  const rel = new THREE.Quaternion();
  const q = new THREE.Quaternion();
  const target = new THREE.Quaternion();
  const dir = new THREE.Vector3();
  const basis = { fwd: new THREE.Vector3(), left: new THREE.Vector3(), up: new THREE.Vector3() };
  const mid = (i, j) => new THREE.Vector3().addVectors(S[i], S[j]).multiplyScalar(0.5);

  // Preallocated SMPL-X rotational pre-solve scratch (zero per-frame allocations in hot loop).
  const seedQ = new Float64Array(model.nq);
  const warmBuf = new Float64Array(8);
  let useSmplxPrior = false;
  let smplxWarm = false;
  const shTwistPrior = [SMPLX_TWIST_PRIOR, SMPLX_TWIST_PRIOR];
  const shPitchPrior = [0, 0];
  const hipTwistPrior = [SMPLX_TWIST_PRIOR, SMPLX_TWIST_PRIOR];
  const hipPitchPrior = [0, 0];
  const wrTwistPrior = [SMPLX_TWIST_PRIOR, SMPLX_TWIST_PRIOR];
  const candA = new Float64Array(4);
  const candB = new Float64Array(4);
  const candC = new Float64Array(4);
  const outEuler = new Float64Array(3);
  const euler = new THREE.Euler(0, 0, 0, 'XYZ');
  const eCand = new THREE.Euler(0, 0, 0, 'XYZ');
  const qCand = new THREE.Quaternion();
  const qPel = new THREE.Quaternion();
  const qTor = new THREE.Quaternion();
  const qYawFix = new THREE.Quaternion();
  const qCol = new THREE.Quaternion();
  const qSh = new THREE.Quaternion();
  const qEl = new THREE.Quaternion();
  const qWr = new THREE.Quaternion();
  const qUp = new THREE.Quaternion();
  const qFo = new THREE.Quaternion();
  const qTmp = new THREE.Quaternion();
  const vU = new THREE.Vector3();
  const vF = new THREE.Vector3();
  const bX = new THREE.Vector3();
  const bY = new THREE.Vector3();
  const bZ = new THREE.Vector3();
  const mBasis = new THREE.Matrix4();
  const qShMount = {
    left: new THREE.Quaternion().setFromAxisAngle(X_AXIS, -SH_MOUNT),
    right: new THREE.Quaternion().setFromAxisAngle(X_AXIS, SH_MOUNT),
  };
  const rotvec3ToQuat = (rx, ry, rz, out) => {
    const ax = mirror ? -rz : rz;
    const ay = rx;
    const az = mirror ? -ry : ry;
    const ang = Math.hypot(ax, ay, az);
    if (!Number.isFinite(ang) || ang < 1e-8) return out.set(0, 0, 0, 1);
    const s = Math.sin(0.5 * ang) / ang;
    return out.set(ax * s, ay * s, az * s, Math.cos(0.5 * ang));
  };
  // Picks the physically continuous Euler seed among equivalent branches (primary, flipped middle
  // +-pi branch, and optional gimbal-stabilized warm-twist projection) plus +-2*pi outer wraps,
  // writing [joint0, joint1, joint2] into `outEuler` and returning |cos(middle angle)|.
  const pickContinuousEuler = (qTarget, order, joints, off0, off1, off2, warm) => {
    const j0 = joints[0];
    const j1 = joints[1];
    const j2 = joints[2];
    const prev0 = getJoint(j0);
    const prev1 = getJoint(j1);
    const prev2 = getJoint(j2);
    euler.setFromQuaternion(qTarget, order);
    // All three chains (YXZ shoulder/hip, ZXY waist, XYZ wrist) map joints[0..2] to (outer1, middle, outer2).
    const a0 = order === 'YXZ' ? euler.y : order === 'ZXY' ? euler.z : euler.x;
    const b0 = order === 'XYZ' ? euler.y : euler.x;
    const c0 = order === 'ZXY' ? euler.y : euler.z;
    const midCos = Math.abs(Math.cos(b0));

    candA[0] = a0;
    candB[0] = b0;
    candC[0] = c0;
    const bFlip = (b0 >= 0 ? Math.PI : -Math.PI) - b0;
    candA[1] = wrapPi(a0 + Math.PI);
    candB[1] = bFlip;
    candC[1] = wrapPi(c0 + Math.PI);
    let nCand = 2;
    const inGimbal = midCos < GIMBAL_LOCK_CONE_COS;
    if (inGimbal && warm) {
      // Near b = +-pi/2, outer axes depend only on a + sigma*c; keep either c or a continuous with prev.
      const sigma = (order === 'YXZ' ? -1 : 1) * (b0 >= 0 ? 1 : -1);
      const useFlip = Math.abs(bFlip + off1 - prev1) < Math.abs(b0 + off1 - prev1);
      const aG = useFlip ? candA[1] : a0;
      const bG = useFlip ? bFlip : b0;
      const cG = useFlip ? candC[1] : c0;
      const cKeep = prev2 - off2;
      candA[nCand] = wrapPi(aG + sigma * (cG - cKeep));
      candB[nCand] = bG;
      candC[nCand] = cKeep;
      nCand++;
      const aKeep = prev0 - off0;
      candA[nCand] = aKeep;
      candB[nCand] = bG;
      candC[nCand] = wrapPi(cG + sigma * (aG - aKeep));
      nCand++;
    }

    let bestScore = Infinity;
    let bestOriErr = Infinity;
    let bestTwistOnly = false;
    let best0 = 0;
    let best1 = 0;
    let best2 = 0;
    let exactDist = Infinity;
    let exact0 = 0;
    let exact1 = 0;
    let exact2 = 0;

    for (let ci = 0; ci < nCand; ci++) {
      const ba = candA[ci];
      const bb = candB[ci];
      const bc = candC[ci];
      const v1 = bb + off1;
      const c1 = j1.limited ? THREE.MathUtils.clamp(v1, j1.lo, j1.hi) : v1;
      const eb = c1 - off1;
      for (let ka = -1; ka <= 1; ka++) {
        const v0 = ba + ka * TWO_PI + off0;
        if (ka !== 0 && j0.limited && (v0 < j0.lo - Math.PI || v0 > j0.hi + Math.PI)) continue;
        const c0 = j0.limited ? THREE.MathUtils.clamp(v0, j0.lo, j0.hi) : v0;
        const ea = c0 - off0;
        for (let kc = -1; kc <= 1; kc++) {
          const v2 = bc + kc * TWO_PI + off2;
          if (kc !== 0 && j2.limited && (v2 < j2.lo - Math.PI || v2 > j2.hi + Math.PI)) continue;
          const c2 = j2.limited ? THREE.MathUtils.clamp(v2, j2.lo, j2.hi) : v2;
          const ec = c2 - off2;
          if (order === 'YXZ') eCand.set(eb, ea, ec, 'YXZ');
          else if (order === 'ZXY') eCand.set(eb, ec, ea, 'ZXY');
          else eCand.set(ea, eb, ec, 'XYZ');
          qCand.setFromEuler(eCand);
          const oriErr = 2 * Math.acos(Math.min(1, Math.abs(qCand.dot(qTarget))));
          const dist = Math.hypot(c0 - prev0, c1 - prev1, c2 - prev2);
          const score = BRANCH_ORI_WEIGHT * oriErr + dist;
          if (score < bestScore) {
            bestScore = score;
            bestOriErr = oriErr;
            bestTwistOnly = order === 'YXZ' && Math.abs(c0 - v0) < 1e-6 && Math.abs(c1 - v1) < 1e-6;
            best0 = c0;
            best1 = c1;
            best2 = c2;
          }
          if (oriErr < BRANCH_IN_RANGE_EPS && dist < exactDist) {
            exactDist = dist;
            exact0 = c0;
            exact1 = c1;
            exact2 = c2;
          }
        }
      }
    }

    if (!inGimbal && !bestTwistOnly && bestOriErr > BRANCH_MAX_CLAMP_ERR && exactDist < Infinity) {
      outEuler[0] = exact0;
      outEuler[1] = exact1;
      outEuler[2] = exact2;
    } else {
      outEuler[0] = best0;
      outEuler[1] = best1;
      outEuler[2] = best2;
    }
    return midCos;
  };
  const bodyQuat = (bp, j, out) => {
    const o = 3 * (j - 1);
    return rotvec3ToQuat(bp[o], bp[o + 1], bp[o + 2], out);
  };
  const mirrorVec = (arr, out) => out.set(arr[0], mirror ? -arr[1] : arr[1], arr[2]);
  const basisZ = (d) => {
    bZ.copy(d).negate().normalize();
    bX.copy(X_AXIS).addScaledVector(bZ, -X_AXIS.dot(bZ)).normalize();
    bY.crossVectors(bZ, bX);
    return new THREE.Quaternion().setFromRotationMatrix(mBasis.makeBasis(bX, bY, bZ));
  };
  const basisX = (xDir, yDir) => {
    bX.copy(xDir).normalize();
    bY.copy(yDir).addScaledVector(bX, -yDir.dot(bX)).normalize();
    bZ.crossVectors(bX, bY);
    return new THREE.Quaternion().setFromRotationMatrix(mBasis.makeBasis(bX, bY, bZ));
  };
  const ALIGN = { upper: {}, thigh: {}, hand: {} };
  const REST_DIR = { upper: {}, fore: {}, thigh: {}, shin: {} };
  for (const robotSide of ['left', 'right']) {
    const spec = SMPLX_REST[mirror ? OTHER[robotSide] : robotSide];
    const sSign = robotSide === 'left' ? 1 : -1;
    const u = mirrorVec(spec.uDir, new THREE.Vector3()).normalize();
    const f = mirrorVec(spec.fDir, new THREE.Vector3()).normalize();
    const t = mirrorVec(spec.tDir, new THREE.Vector3()).normalize();
    const sh = mirrorVec(spec.sDir, new THREE.Vector3()).normalize();
    const fng = mirrorVec(spec.fng, new THREE.Vector3()).normalize();
    const plm = mirrorVec(spec.plm, new THREE.Vector3()).normalize();
    REST_DIR.upper[robotSide] = u;
    REST_DIR.fore[robotSide] = f;
    REST_DIR.thigh[robotSide] = t;
    REST_DIR.shin[robotSide] = sh;
    ALIGN.upper[robotSide] = basisZ(u);
    ALIGN.thigh[robotSide] = basisZ(t);
    ALIGN.hand[robotSide] = basisX(fng, vU.copy(plm).multiplyScalar(-sSign));
  }

  // The shoulders' twist penalty for this solve (SHOULDER_TWIST_FACING when live and facing the
  // camera), and how much of the hands' bend is trusted (1 facing the camera, 0 in profile).
  let shoulderTwist = SHOULDER_TWIST_PENALTY;
  let handTrust = 0;
  const penalty = (joints) => joints.reduce((sum, j) => {
    const v = getJoint(j);
    let cost = JOINT_PENALTY * v * v;
    if (j.twist) {
      if (useSmplxPrior) {
        if (j.name !== 'waist_yaw_joint') {
          const w = j.isShoulderYaw ? shTwistPrior[j.sideIdx]
            : j.isHipYaw ? hipTwistPrior[j.sideIdx]
            : j.isWristRoll ? wrTwistPrior[j.sideIdx]
            : SMPLX_TWIST_PRIOR;
          const d = v - seedQ[j.adr];
          cost += w * d * d;
        }
      } else {
        cost += (j.isShoulderYaw ? shoulderTwist : j.twist) * v * v;
      }
    } else if (useSmplxPrior && ((j.isShoulderPitch && shPitchPrior[j.sideIdx] > 0) || (j.isHipPitch && hipPitchPrior[j.sideIdx] > 0))) {
      const w = j.isShoulderPitch ? shPitchPrior[j.sideIdx] : hipPitchPrior[j.sideIdx];
      const d = v - seedQ[j.adr];
      cost += w * d * d;
    }
    if (j.inward) cost += HIP_INWARD_PENALTY * Math.max(0, j.inward * v) ** 2;
    return sum + cost;
  }, 0);

  function limbCost(c) {
    fk();
    position(c.midId, a);
    position(c.tipId, b);
    return a.distanceToSquared(c.targetMid) + b.distanceToSquared(c.targetTip) + penalty(c.joints);
  }

  // How far the hand points, and its palm faces, from where the person's do (world axes, unit length).
  function handCost(hand, sign) {
    fk();
    let cost = 1 - fingersOf(hand.body, handNow).dot(handTarget) + penalty(hand.joints);
    if (palmWeight > 0) cost += palmWeight * (1 - palmOf(hand.body, palmNow, sign).dot(palmTarget));
    return cost;
  }

  function orientationCost(part, goal) {
    fk();
    orientation(part.body, q);
    // 1 - cos² of the half angle: grows like the square of the angle between the two orientations.
    return 1 - q.dot(goal) ** 2 + penalty(part.joints);
  }

  // Solved from the previous pose and from rest. Starting only from the previous one leaves joints
  // stuck in twisted configurations; the rest solution replaces it only when clearly better, so
  // the result does not jump between the two. Skipped when SMPL-X provides the closed-form seed.
  function solveJoints(joints, cost, reseed = true) {
    const warmCost = descend(joints, cost);
    if (!reseed) return;
    for (let i = 0; i < joints.length; i++) warmBuf[i] = getJoint(joints[i]);
    for (const j of joints) setJoint(j, 0);
    const restCost = descend(joints, cost);
    if (restCost > warmCost * RESEED_MARGIN) joints.forEach((j, i) => setJoint(j, warmBuf[i]));
  }

  function descend(joints, cost) {
    for (let it = 0; it < IK_ITERATIONS; it++) {
      for (const j of joints) {
        const q0 = getJoint(j);
        const c0 = cost();
        setJoint(j, q0 + IK_PROBE);
        const cp = cost();
        setJoint(j, q0 - IK_PROBE);
        const cm = cost();
        // Newton step on the parabola through the three points; if it is not convex, go downhill.
        const curvature = cp - 2 * c0 + cm;
        let step = curvature > 1e-9 ? (-IK_PROBE * (cp - cm)) / (2 * curvature) : cp < cm ? IK_MAX_STEP : -IK_MAX_STEP;
        step = THREE.MathUtils.clamp(step, -IK_MAX_STEP, IK_MAX_STEP);
        setJoint(j, q0 + step);
        if (cost() > c0) setJoint(j, q0);
      }
    }
    return cost();
  }

  // Basis (forward, left, up) as a rotation, from the left direction and an approximate "up"
  // (or "forward"); the given vector is made perpendicular to left.
  function frame(out, left, up, fwd = null) {
    basis.left.copy(left).normalize();
    if (fwd) {
      basis.fwd.copy(fwd).addScaledVector(basis.left, -fwd.dot(basis.left)).normalize();
      basis.up.crossVectors(basis.fwd, basis.left);
    } else {
      basis.up.copy(up).addScaledVector(basis.left, -up.dot(basis.left)).normalize();
      basis.fwd.crossVectors(basis.left, basis.up);
    }
    return out.setFromRotationMatrix(new THREE.Matrix4().makeBasis(basis.fwd, basis.left, basis.up));
  }

  /**
   * @param pose { points, visible } from createPoseTracker
   * @param options.hands  { left, right }: MediaPipe hand model world landmarks (21 {x, y, z}) of
   *   the person's left and right hand, or null; when given, the wrist reads the hand from them
   *   instead of the pose's 4 hand points (live only)
   * @param options.travelYaw  heading (rad, about the vertical) the person is travelling in, when
   *   known. It replaces the heading read from the hips if both point the same way (within 90
   *   degrees): seen from the side, the hip line runs along the depth axis, which is MediaPipe's
   *   noisiest, while the direction of travel does not wobble. Walking backwards or sideways keeps
   *   the hips' heading.
   * @param options.smplx  { globalOrient?, bodyPose }: optional SMPL-X 3D rotations from PoseClip v2
   *   (contract axes: x right, y up, z toward camera; bodyPose is 63 floats for joints 1..21) used to
   *   seed waist, shoulders, elbows, hips, knees, and wrists before IK refinement.
   * @returns qpos: Float64Array(nq), a copy; residual: the worst distance (m) between where a limb
   *   ended up and where the person put it (above ~0.08 the robot cannot do that move); tracked:
   *   false when the shoulders were not seen and the previous pose was kept; mirroredArm: true when
   *   one arm was not seen and copies the other's swing (in profile).
   */
  function solve({ points, visible: V }, { travelYaw, hands, smplx } = {}) {
    Q = data.qpos;
    XPOS = data.xpos;
    XQUAT = data.xquat;
    const hasSmplx = allFinite(smplx?.bodyPose, 63);
    useSmplxPrior = hasSmplx;
    if (!hasSmplx) smplxWarm = false;
    const bp = hasSmplx ? smplx.bodyPose : null;
    const L = mirror ? HUMAN.right : HUMAN.left; // the human landmarks that drive the robot's left
    const R = mirror ? HUMAN.left : HUMAN.right;
    const side = { left: L, right: R };
    for (let i = 0; i < 33; i++) {
      const p = points?.[i];
      const ok = Boolean(V?.[i] && finitePt(p));
      vis[i] = ok ? 1 : 0;
      if (ok) S[i].set(p.x, mirror ? -p.y : p.y, p.z);
      else S[i].set(0, 0, 0);
    }
    if (!vis[L.shoulder] || !vis[R.shoulder]) return { qpos: Q.slice(), residual: 0, tracked: false };
    const hipsSeen = Boolean(vis[L.hip] && vis[R.hip]);
    // The person's hands as the robot's sides see them (swapped and flipped when mirroring), in
    // robot axes as pose.js puts the pose's points: x = -z, y = x, z = -y.
    const handOf = {};
    for (const robotSide of ['left', 'right']) {
      const person = hands?.[mirror ? OTHER[robotSide] : robotSide];
      if (!Array.isArray(person) || person.length < 21) continue;
      let ok = true;
      for (let i = 0; i < 21; i++) {
        const p = person[i];
        if (!finitePt(p)) {
          ok = false;
          break;
        }
        handPoints[robotSide][i].set(-p.z, mirror ? -p.x : p.x, -p.y);
      }
      if (ok) handOf[robotSide] = handPoints[robotSide];
    }

    // Pelvis: heading from the hips (or the shoulders when the hips are out of frame), upright.
    const heading = hipsSeen ? frame(hHip, dir.subVectors(S[L.hip], S[R.hip]), UP) : null;
    // Human torso: left between the shoulders, up from the hips to the shoulders.
    const torsoUp = hipsSeen ? mid(L.shoulder, R.shoulder).sub(mid(L.hip, R.hip)) : UP;
    frame(hTorso, dir.subVectors(S[L.shoulder], S[R.shoulder]), torsoUp);
    const headingFrame = heading ?? hTorso;
    dir.set(1, 0, 0).applyQuaternion(headingFrame);
    const bodyYaw = Math.atan2(dir.y, dir.x);
    // SMPL-X / GVHMR 3D joints do not suffer from single-frame MediaPipe depth wobble on the hip
    // line; overriding bodyYaw with travelYaw on spinning/lateral clips turns hHip/hTorso out from
    // under world points S and snaps pelvisQ when travelYaw crosses threshold.
    const yaw = !hasSmplx && Number.isFinite(travelYaw) && Math.cos(travelYaw - bodyYaw) > 0 ? travelYaw : bodyYaw;
    // Facing the camera is a heading of 0 (robot +x is toward it); profile is 90 degrees.
    shoulderTwist = live ? SHOULDER_TWIST_FACING + (SHOULDER_TWIST_PENALTY - SHOULDER_TWIST_FACING) * Math.sin(bodyYaw) ** 2 : SHOULDER_TWIST_PENALTY;
    handTrust = Math.cos(bodyYaw) ** 2;
    pelvisQ.setFromAxisAngle(UP, yaw);
    // If the heading came from the direction of travel, the person's frames must turn with it.
    // Otherwise a hip line that is 15 degrees off the real heading turns every stride by 15
    // degrees from the path of the pelvis, and the planted foot slides.
    if (yaw !== bodyYaw) {
      toLocal.setFromAxisAngle(UP, yaw - bodyYaw);
      hHip.premultiply(toLocal);
      hTorso.premultiply(toLocal);
    }
    Q[0] = Q[1] = Q[2] = 0;
    Q[3] = pelvisQ.w;
    Q[4] = pelvisQ.x;
    Q[5] = pelvisQ.y;
    Q[6] = pelvisQ.z;

    // Waist: from SMPL-X spine chain when present, else the torso's turn and lean relative to hips.
    if (hasSmplx) {
      const go = smplx.globalOrient;
      if (allFinite(go, 3)) rotvec3ToQuat(go[0], go[1], go[2], qPel);
      else qPel.copy(pelvisQ);
      qTor.copy(qPel)
        .multiply(bodyQuat(bp, 3, qCol))
        .multiply(bodyQuat(bp, 6, qSh))
        .multiply(bodyQuat(bp, 9, qEl));
      dir.set(1, 0, 0).applyQuaternion(qPel);
      const smplxYaw = Math.hypot(dir.x, dir.y) > 1e-6 ? Math.atan2(dir.y, dir.x) : yaw;
      qYawFix.setFromAxisAngle(UP, yaw - smplxYaw);
      rel.copy(pelvisQ).invert().multiply(qYawFix).multiply(qTor);
      target.copy(pelvisQ).multiply(rel).multiply(rest.torso);
      pickContinuousEuler(rel, 'ZXY', waist.joints, 0, 0, 0, smplxWarm);
      setJoint(waist.joints[0], outEuler[0]);
      setJoint(waist.joints[1], outEuler[1]);
      setJoint(waist.joints[2], outEuler[2]);
      for (const j of waist.joints) seedQ[j.adr] = getJoint(j);
      solveJoints(waist.joints, () => orientationCost(waist, target), false);
    } else {
      if (hipsSeen) rel.copy(hHip).invert().multiply(hTorso);
      else rel.identity();
      target.copy(pelvisQ).multiply(rel).multiply(rest.torso);
      solveJoints(waist.joints, () => orientationCost(waist, target));
    }
    fk();
    orientation(waist.body, q);
    // Robot torso axes (forward, left, up): the torso's current orientation without its rest offset.
    const torsoCanonical = canonical.copy(q).multiply(restTorsoInverse);
    const hTorsoInverse = toLocal.copy(hTorso).invert();
    const hHipInverse = new THREE.Quaternion().copy(hHip).invert();

    let residual = 0;
    const solved = new Set();
    for (const c of chains) {
      const h = side[c.side];
      const [i0, i1, i2] = c.human.map((k) => h[k]);
      const unseen = !vis[i0] || !vis[i1] || !vis[i2] || (c.frame === 'hip' && !hipsSeen);
      if (unseen) {
        // Automatic Upper-Body Mode (laptop friendly): when legs/hips are out of frame during live
        // capture, lock leg and foot joints cleanly back to the balanced stand pose instead of
        // freezing them in an earlier stride.
        if (live && c.foot) {
          for (const j of c.joints) setJoint(j, standQ[j.adr]);
          for (const j of c.foot.joints) setJoint(j, standQ[j.adr]);
        }
        continue;
      }
      const toRobot = c.frame === 'torso' ? hTorsoInverse : hHipInverse;
      const robotFrame = c.frame === 'torso' ? torsoCanonical : pelvisQ;
      // Directions of the upper and lower segment in the human body frame, then in the robot's.
      position(c.rootId, a);
      // A leg segment in the hips' frame (x forward, y left, z up) leans inward at most MAX_LEG_INWARD.
      const inwardSign = c.side === 'left' ? -1 : 1;
      const limitInward = (v) => {
        if (c.frame !== 'hip' || inwardSign * v.y <= MAX_LEG_INWARD) return v;
        v.y = inwardSign * MAX_LEG_INWARD;
        const rest = Math.hypot(v.x, v.z);
        const scale = rest > 1e-9 ? Math.sqrt(1 - MAX_LEG_INWARD ** 2) / rest : 0;
        v.x *= scale;
        v.z *= scale;
        return v;
      };
      limitInward(dir.subVectors(S[i1], S[i0]).normalize().applyQuaternion(toRobot)).applyQuaternion(robotFrame);
      c.targetMid.copy(a).addScaledVector(dir, c.upperLength);
      limitInward(dir.subVectors(S[i2], S[i1]).normalize().applyQuaternion(toRobot)).applyQuaternion(robotFrame);
      c.targetTip.copy(c.targetMid).addScaledVector(dir, c.foreLength);
      if (hasSmplx) {
        const hSide = mirror ? OTHER[c.side] : c.side;
        const sideIdx = c.side === 'left' ? 0 : 1;
        if (c.frame === 'torso') {
          const [colIdx, shIdx, elIdx] = hSide === 'left' ? [13, 16, 18] : [14, 17, 19];
          const sSign = c.side === 'left' ? 1 : -1;
          qUp.copy(bodyQuat(bp, colIdx, qCol)).multiply(bodyQuat(bp, shIdx, qSh));
          qFo.copy(qUp).multiply(bodyQuat(bp, elIdx, qEl));
          qTmp.copy(qShMount[c.side]).multiply(qUp).multiply(ALIGN.upper[c.side]);
          const shCos = pickContinuousEuler(qTmp, 'YXZ', c.joints, 0, sSign * SH_MOUNT, 0, smplxWarm);
          const shScale = THREE.MathUtils.smoothstep(shCos, 0, GIMBAL_COS_THRESHOLD);
          shTwistPrior[sideIdx] = SMPLX_TWIST_PRIOR * shScale;
          shPitchPrior[sideIdx] = SH_GIMBAL_PITCH_PRIOR * (1 - shScale);
          vU.copy(REST_DIR.upper[c.side]).applyQuaternion(qUp);
          vF.copy(REST_DIR.fore[c.side]).applyQuaternion(qFo);
          const elAng = Math.PI / 2 - Math.acos(THREE.MathUtils.clamp(vU.dot(vF), -1, 1));
          setJoint(c.joints[0], outEuler[0]);
          setJoint(c.joints[1], outEuler[1]);
          setJoint(c.joints[2], outEuler[2]);
          setJoint(c.joints[3], elAng);
        } else {
          const [hipIdx, knIdx] = hSide === 'left' ? [1, 4] : [2, 5];
          qUp.copy(bodyQuat(bp, hipIdx, qCol));
          qFo.copy(qUp).multiply(bodyQuat(bp, knIdx, qSh));
          qTmp.copy(qUp).multiply(ALIGN.thigh[c.side]);
          const hipCos = pickContinuousEuler(qTmp, 'YXZ', c.joints, HIP_MOUNT, 0, 0, smplxWarm);
          const hipScale = THREE.MathUtils.smoothstep(hipCos, 0, GIMBAL_COS_THRESHOLD);
          // 0.4 floor keeps hip_yaw anchored near hip_roll = +-pi/2 so straight-leg IK does not dump onto twist.
          hipTwistPrior[sideIdx] = SMPLX_TWIST_PRIOR * (0.4 + 0.6 * hipScale);
          hipPitchPrior[sideIdx] = SMPLX_TWIST_PRIOR * (1 - hipScale);
          vU.copy(REST_DIR.thigh[c.side]).applyQuaternion(qUp);
          vF.copy(REST_DIR.shin[c.side]).applyQuaternion(qFo);
          const knAng = Math.acos(THREE.MathUtils.clamp(vU.dot(vF), -1, 1));
          setJoint(c.joints[0], outEuler[0]);
          setJoint(c.joints[1], outEuler[1]);
          setJoint(c.joints[2], outEuler[2]);
          setJoint(c.joints[3], knAng);
        }
        for (const j of c.joints) seedQ[j.adr] = getJoint(j);
        solveJoints(c.joints, () => limbCost(c), false);
      } else {
        solveJoints(c.joints, () => limbCost(c));
      }
      solved.add(c);
      fk();
      position(c.midId, a);
      position(c.tipId, b);
      residual = Math.max(residual, a.distanceTo(c.targetMid), b.distanceTo(c.targetTip));
      if (c.foot) {
        // Soles level with the floor: the foot's rest orientation turned with the pelvis' heading.
        target.copy(pelvisQ).multiply(rest[c.name]);
        solveJoints(c.foot.joints, () => orientationCost(c.foot, target));
      }
      const H = handOf[c.side];
      if (c.hand && hasSmplx) {
        const hSide = mirror ? OTHER[c.side] : c.side;
        const sideIdx = c.side === 'left' ? 0 : 1;
        const [colIdx, shIdx, elIdx, wrIdx] = hSide === 'left' ? [13, 16, 18, 20] : [14, 17, 19, 21];
        target.copy(torsoCanonical)
          .multiply(bodyQuat(bp, colIdx, qCol))
          .multiply(bodyQuat(bp, shIdx, qSh))
          .multiply(bodyQuat(bp, elIdx, qEl))
          .multiply(bodyQuat(bp, wrIdx, qWr))
          .multiply(ALIGN.hand[c.side]);
        fk();
        orientation(c.midId, q);
        rel.copy(q).invert().multiply(target);
        const wrCos = pickContinuousEuler(rel, 'XYZ', c.hand.joints, 0, 0, 0, smplxWarm);
        wrTwistPrior[sideIdx] = SMPLX_TWIST_PRIOR * THREE.MathUtils.smoothstep(wrCos, 0, GIMBAL_COS_THRESHOLD);
        setJoint(c.hand.joints[0], outEuler[0]);
        setJoint(c.hand.joints[1], outEuler[1]);
        setJoint(c.hand.joints[2], outEuler[2]);
        for (const j of c.hand.joints) seedQ[j.adr] = getJoint(j);
        solveJoints(c.hand.joints, () => orientationCost(c.hand, target), false);
      } else if (c.hand && live && (H || (vis[h.index] && vis[h.pinky]))) {
        // The hand's wrist, knuckles and the two sides of its width: from the hand model when
        // there is one (its 21 points are far steadier than the pose's 4), else from the pose.
        const handWrist = H ? H[HAND_WRIST] : S[h.wrist];
        if (H) knuckles.addVectors(H[HAND_INDEX], H[HAND_PINKY]).multiplyScalar(0.5);
        else knuckles.copy(mid(h.index, h.pinky));
        // The person's bend: the turn from their forearm (elbow to wrist) to their hand (wrist to
        // knuckles), put on the robot's forearm as it ended up.
        dir.subVectors(S[h.wrist], S[h.elbow]).normalize();
        handTarget.subVectors(knuckles, handWrist).normalize();
        bend.setFromUnitVectors(dir, handTarget).slerp(NO_TURN, 1 - handTrust);
        fk();
        position(c.midId, a);
        position(c.tipId, b);
        handTarget.copy(forearm.subVectors(b, a).normalize()).applyQuaternion(bend);
        // The person's palm: across the hand from the pinky to the index and thumb, crossed with
        // its length, signed so it faces the thighs with the arms hanging (left: length x across).
        const sign = c.side === 'left' ? 1 : -1;
        const length = dir.subVectors(knuckles, handWrist);
        if (H) across.subVectors(H[HAND_INDEX], H[HAND_PINKY]);
        else across.subVectors(vis[h.thumb] ? mid(h.index, h.thumb) : S[h.index], S[h.pinky]);
        palmTarget.crossVectors(length, across).multiplyScalar(sign);
        palmWeight = 0;
        if (palmTarget.length() > MIN_HAND_WIDTH * length.lengthSq()) {
          // In the person's torso frame, then the robot's (as the limbs), across the robot's hand.
          palmTarget.normalize().applyQuaternion(toRobot).applyQuaternion(robotFrame);
          palmTarget.addScaledVector(handTarget, -palmTarget.dot(handTarget)).normalize();
          palmWeight = handTrust;
        }
        solveJoints(c.hand.joints, () => handCost(c.hand, sign));
      }
    }

    // Seen from the side, the far arm is behind the body: MediaPipe does not see it and it stayed
    // frozen in the stand pose while the near one swung. A walking person swings the two arms in
    // opposite phase, so the hidden arm mirrors the seen one: the shoulder goes forward as much as
    // the seen one goes back (around the stand pose), the side lift and the twist mirror (the G1's
    // left and right ranges are mirrored), and the elbow bends the same.
    // Only in profile (turned past 45 degrees): facing the camera, an arm goes unseen because it is
    // behind the back or hidden by the other, not because it swings. Mirroring it there moved an
    // arm the person never moved; it now keeps where it was last seen.
    const arms = chains.filter((c) => !c.foot);
    const seenArms = arms.filter((c) => solved.has(c));
    const mirroredArm = seenArms.length === 1 && Math.sin(bodyYaw) ** 2 > PROFILE_SIN2;
    if (mirroredArm) {
      const [shown] = seenArms;
      const hidden = arms.find((c) => c !== shown);
      const [pitch, roll, twist, elbow] = shown.joints;
      const [hPitch, hRoll, hTwist, hElbow] = hidden.joints;
      setJoint(hPitch, standQ[hPitch.adr] - (getJoint(pitch) - standQ[pitch.adr]));
      setJoint(hRoll, -getJoint(roll));
      setJoint(hTwist, -getJoint(twist));
      setJoint(hElbow, getJoint(elbow));
    }

    // Height: clamp the lowest sole strictly onto z = 0 so stance feet stay grounded on the floor.
    fk();
    let lowest = Infinity;
    for (const { id, radius } of soles) lowest = Math.min(lowest, data.geom_xpos[3 * id + 2] - radius);
    if (Number.isFinite(lowest)) Q[2] = Math.max(0, -lowest);
    const upperBodyOnly = !chains.some((c) => c.foot && solved.has(c));
    smplxWarm = hasSmplx;
    return { qpos: Q.slice(), residual, tracked: true, mirroredArm, upperBodyOnly };
  }

  // Hip to ankle along the leg (m): lets a recorded path be scaled to this robot's stride.
  const legLength = chains.filter((c) => c.foot).reduce((sum, c) => sum + c.upperLength + c.foreLength, 0) / 2;

  return { solve, legLength, delete: () => data.delete() };
}
