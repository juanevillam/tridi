// A trained policy (training/, exported to ONNX) driving the G1: it reads the robot's state, and
// every 20 ms writes the motor targets. It has to build the observation exactly as training does
// (env.py observe for standing, imitate.py MimicEnv.observe for imitation), because the network only
// means anything for numbers laid out the way it learned.
//
// No browser APIs: `ort` is passed in, so Node runs the same code in scripts/check-policy.mjs and
// scripts/check-mimic.mjs.
import { createReference } from './reference.js';
import { idOf } from './sim.js';

// The policy decides every 20 ms: 5 steps with G1 scene_mjx.xml's 4 ms step, 10 steps with H1's 2 ms step.
const CONTROL_DT = 0.02;
// The keyframe training starts from; its ctrl (or qpos for torque models) is the standing pose.
const HOME_KEY = 'home';
// Observation scales, from training/env.py. They keep every input near [-1, 1].
const ANG_VEL_SCALE = 0.25;
const JOINT_VEL_SCALE = 0.05;
const ACTION_SCALE = 0.25; // one unit of action is 0.25 rad from the standing pose
const SUPPORTED_ROBOTS = new Set(['unitree_g1', 'unitree_h1']);
const standObsDim = (nu, senseVelocity = false) => 3 + 3 + nu + nu + nu + (senseVelocity ? 3 : 0);
// Imitation adds the reference 20 ms ahead (joints, pelvis velocity, pelvis height), for each
// look-ahead instant of policy.json its joints and pelvis position, and optionally (sense_velocity)
// the robot's own pelvis velocity in the pelvis frame (imitate.MimicEnv.observe).
const mimicObsDim = (nu, lookahead, senseVelocity = false) =>
  standObsDim(nu, false) + nu + 3 + 1 + lookahead.length * (nu + 3) + (senseVelocity ? 3 : 0);
// A fall, as training ends an episode (env.py): pelvis below 0.5 m or the torso tilted past 60
// degrees. An imitation policy that falls starts its clip over after FALL_PAUSE_S, long enough to
// see the fall and short enough that the robot is not left lying on the floor for the rest of the clip.
const FALL_HEIGHT = 0.5;
const FALL_UPRIGHT = 0.5;
const FALL_PAUSE_S = 1;
// A fallen robot is outside everything the policy saw (training ends the episode at the fall), so
// its outputs there are noise: the trained g1-stand, knocked down, swung its joints at ~55 rad/s on
// the floor. Once fallen, the network stops deciding and the motors hold the pose it landed in,
// until a reset stands it up. It takes back over only if the robot is clearly up again, with some
// margin over the fall line so it does not flicker at the edge.
const RECOVER_HEIGHT = 0.6;

/**
 * @param ort    the onnxruntime-web module (or onnxruntime-node)
 * @param sim    the Simulation, already loaded with the scene the policy was trained on
 * @param onnx   the bytes of policy.onnx
 * @param meta   policy.json: { id, robot, mjcf, obs_dim, nu, steps, task?, motion?, lookahead_s?, ... }
 * @param options.motion  the RobotMotion an imitation policy follows (the clip of policy.json's `motion`)
 */
export async function createPolicy(ort, sim, onnx, meta, { motion } = {}) {
  const { model } = sim;
  const nu = meta.nu ?? 29;
  const standObs = standObsDim(nu, false);
  const mimic = meta.task === 'mimic' || (meta.task === undefined && meta.obs_dim !== standObs && meta.obs_dim !== standObsDim(nu, true));
  const lookahead = meta.lookahead_s ?? [];
  const senseVelocity =
    Boolean(meta.sense_velocity) ||
    (mimic ? meta.obs_dim === mimicObsDim(nu, lookahead, true) : meta.obs_dim === standObsDim(nu, true));
  const obsDim = mimic ? mimicObsDim(nu, lookahead, senseVelocity) : standObsDim(nu, senseVelocity);
  if (!SUPPORTED_ROBOTS.has(meta.robot) || meta.obs_dim !== obsDim || model.nu !== nu) {
    throw new Error(`The policy ${meta.id} is not for this robot (${meta.robot}, ${meta.obs_dim} inputs, ${meta.nu} motors).`);
  }
  const decimation = Math.round(CONTROL_DT / model.opt.timestep);
  if (Math.abs(model.opt.timestep * decimation - CONTROL_DT) > 1e-9) {
    throw new Error(`The policy decides every 20 ms; this scene steps ${model.opt.timestep * 1000} ms, so that is not ${decimation} steps.`);
  }
  if (mimic && !motion) throw new Error(`The policy ${meta.id} imitates a clip: pass its RobotMotion ({ motion }).`);
  const reference = mimic ? createReference(sim.mujoco, model, motion) : null;
  const minRefZ = mimic && motion.qpos?.length ? Math.min(...motion.qpos.map((r) => r[2])) : FALL_HEIGHT;
  // Deep squats and sitting down lower the pelvis to 0.32-0.44 m while upright, below the 0.50 m
  // standing fall line; adapt the fall threshold to 12 cm below the clip's lowest reference pose.
  const fallHeight = mimic ? Math.min(FALL_HEIGHT, minRefZ - 0.12) : FALL_HEIGHT;
  const session = await ort.InferenceSession.create(onnx, { executionProviders: ['wasm'] });
  const [input] = session.inputNames;
  const [output] = session.outputNames;

  // The standing pose: the motor targets of the home keyframe (or key_qpos joints for torque models like H1).
  const home = idOf(sim.mujoco, model, 'KEY', HOME_KEY);
  const keyCtrl = Float64Array.from(model.key_ctrl.subarray(home * nu, (home + 1) * nu));
  const standing = keyCtrl.some((v) => v !== 0)
    ? keyCtrl
    : Float64Array.from({ length: nu }, (_, i) => model.key_qpos[home * model.nq + model.jnt_qposadr[model.actuator_trnid[2 * i]]]);
  const previous = standing.slice(); // the targets of the last decision, as the next observation
  const obs = new Float32Array(obsDim);

  // The standing observation numbers, in the order of training/README.md.
  function observeStand({ qpos, qvel }) {
    // Angular velocity of the pelvis in its own frame (a free joint reports it that way).
    for (let i = 0; i < 3; i++) obs[i] = qvel[3 + i] * ANG_VEL_SCALE;
    // Gravity seen from the pelvis: R^T (0, 0, -1), with qpos[3:7] = (w, x, y, z).
    const [w, x, y, z] = [qpos[3], qpos[4], qpos[5], qpos[6]];
    obs[3] = -2 * (x * z - w * y);
    obs[4] = -2 * (y * z + w * x);
    obs[5] = -(1 - 2 * (x * x + y * y));
    for (let i = 0; i < nu; i++) {
      obs[6 + i] = qpos[7 + i] - standing[i];
      obs[6 + nu + i] = qvel[6 + i] * JOINT_VEL_SCALE;
      obs[6 + 2 * nu + i] = (previous[i] - standing[i]) / ACTION_SCALE;
    }
    if (!mimic && senseVelocity) {
      const R = [
        1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y),
        2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x),
        2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y),
      ];
      for (let k = 0; k < 3; k++) obs[standObs + k] = R[k] * qvel[0] + R[3 + k] * qvel[1] + R[6 + k] * qvel[2];
    }
  }

  // Imitation at clip time t: the standing obs, then what the reference asks for 20 ms ahead and at each
  // look-ahead instant. Vectors from the world go to the pelvis frame with R^T (MuJoCo's quat2Mat).
  function observeMimic({ qpos, qvel }, t) {
    observeStand({ qpos, qvel });
    const [w, x, y, z] = [qpos[3], qpos[4], qpos[5], qpos[6]];
    const R = [
      1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y),
      2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x),
      2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y),
    ];
    const toBody = (v, k) => R[k] * v[0] + R[3 + k] * v[1] + R[6 + k] * v[2]; // (R^T v)[k]
    let at = standObs;
    const next = reference.sample(t + CONTROL_DT);
    for (let i = 0; i < nu; i++) obs[at++] = next.q[7 + i] - standing[i];
    for (let k = 0; k < 3; k++) obs[at++] = toBody(next.rootVel, k);
    obs[at++] = next.q[2] - qpos[2];
    for (const s of lookahead) {
      const { q } = reference.sample(t + s);
      for (let i = 0; i < nu; i++) obs[at++] = q[7 + i] - standing[i];
      const offset = [q[0] - qpos[0], q[1] - qpos[1], q[2] - qpos[2]];
      for (let k = 0; k < 3; k++) obs[at++] = toBody(offset, k);
    }
    if (senseVelocity) {
      for (let k = 0; k < 3; k++) obs[at++] = toBody(qvel, k);
    }
  }

  // Clip time of an imitation policy: one decision is 20 ms of the clip (MimicEnv.t).
  const clipTime = (sim) => sim.steps * model.opt.timestep;
  let fellAt = null; // clip time of the fall, while an imitation policy lies on the floor
  let down = false; // fallen: the network is not deciding (see RECOVER_HEIGHT)

  // Starts the clip over at its end, or a moment after a fall. True if it did (sim.reset() was called).
  function startOver(sim, t) {
    const { qpos } = sim.data;
    const upright = 1 - 2 * (qpos[4] * qpos[4] + qpos[5] * qpos[5]);
    if (qpos[2] < fallHeight || upright < FALL_UPRIGHT) fellAt ??= t;
    if (t < reference.duration && (fellAt === null || t - fellAt < FALL_PAUSE_S)) return false;
    sim.reset();
    return true;
  }

  function observe(data, t = 0) {
    if (mimic) observeMimic(data, t);
    else observeStand(data);
    return obs;
  }

  return {
    id: meta.id,
    robot: meta.robot,
    steps: meta.steps,
    task: mimic ? 'mimic' : 'stand',
    isImitation: mimic,
    decimation,
    observe,
    sampleReference: (t) => reference?.sample(t) ?? null,
    handsAt: (t) => (mimic && motion?.hands?.length ? motion.hands[Math.min(motion.hands.length - 1, Math.max(0, Math.floor(t * motion.fps)))] : null),
    isDown: () => down,
    /** Seconds into the clip an imitation policy is at (0 for standing): to sync what is drawn beside. */
    time: (sim) => (mimic ? clipTime(sim) : 0),
    duration: reference?.duration ?? 0,
    // Standing: back to the standing pose as "the previous action", as training starts every
    // episode. Imitation: the robot is put in the clip's first pose with its velocities and holds
    // it (MimicEnv.reset_at(0)); sim.reset() runs mj_forward after this.
    reset(sim) {
      down = false;
      if (!mimic) return void previous.set(standing);
      fellAt = null;
      const { data } = sim;
      const { q, rootVel, jointVel } = reference.sample(0);
      data.qpos.set(q, 0);
      data.qvel.fill(0, 0, 6 + nu);
      data.qvel.set(rootVel, 0);
      data.qvel.set(jointVel, 6);
      previous.set(q.slice(7, 7 + nu));
      data.ctrl.set(previous);
    },
    // One decision: the network's output already is the motor targets (it adds the reference or
    // the standing pose, applies the scale and clips to each motor's range), so it goes straight
    // to ctrl. An imitation policy starts its clip over when it ends, or a moment after a fall.
    async act(sim) {
      const { data } = sim;
      const t = clipTime(sim);
      if (mimic && startOver(sim, t)) return;
      const { qpos } = data;
      const upright = 1 - 2 * (qpos[4] * qpos[4] + qpos[5] * qpos[5]);
      if (qpos[2] < fallHeight || upright < FALL_UPRIGHT) {
        if (!down) {
          down = true;
          // Hold where it landed: each motor's target is its joint's current angle.
          for (let i = 0; i < nu; i++) data.ctrl[i] = qpos[7 + i];
        }
        return;
      }
      if (down && qpos[2] < Math.max(fallHeight + 0.1, RECOVER_HEIGHT)) return;
      down = false;
      const result = await session.run({ [input]: new ort.Tensor('float32', observe(data, t), [1, obsDim]) });
      const ctrl = result[output].data;
      previous.set(ctrl);
      if (mimic && sim._inAdvance && !sim.pushUntil) {
        // Blend the clean reference joints with the ONNX reflex residual: 6% residual when upright
        // so full-amplitude human motion is preserved without 50 Hz motor chatter, ramping to
        // 100% policy recovery reflex as the torso tilts, with a 1-step exponential smoothing filter.
        const next = reference.sample(t + CONTROL_DT);
        const reflex = Math.min(1, Math.max(0.06, (1 - upright - 0.02) / 0.18));
        for (let i = 0; i < nu; i++) {
          const refJ = next.q[7 + i];
          const target = refJ + reflex * (ctrl[i] - refJ);
          data.ctrl[i] = 0.55 * target + 0.45 * data.ctrl[i];
        }
      } else {
        data.ctrl.set(ctrl);
      }
    },
    /** Sets "the previous action" directly: for checks that feed a recorded state. */
    setPrevious: (ctrl) => previous.set(ctrl),
    dispose: () => session.release(),
  };
}
