"""Make a RobotMotion physically plausible before training on it: planted feet and a balanced body.

    uv run --project training python -m training.balance <clip id or RobotMotion.json> [--rounds 4]

Why (docs/plan-v2.md, block 3): the checks found the walk reference infeasible. With the pelvis held,
its planted foot slides 0.25 m/s, and its zero moment point (ZMP) is outside the feet on the floor in
93 % of the decisions. The policy then has to change the motion to stay up while the imitation reward
punishes every change: more steps never fixed that (the hackathon plateau).

What it does, all kinematic, on the training model:

1. Contacts. Each foot is on the floor where the reference has it low and slow, cleaned of blips
   shorter than MIN_CONTACT_S; a walk always has at least one foot down.
2. Feet targets. A planted foot's toe stays where it landed (median of the stretch) on the floor,
   facing its median yaw; its heel may rise. A swinging foot follows the reference, shifted smoothly from where it
   lifted off to where it lands, and never below the sole height.
3. Balance. The center of mass is moved in the floor plane until the ZMP (cart-table model,
   ZMP = CoM - z/g * CoM'') is inside the support polygon of the planted feet; the shift is smoothed
   so it does not add accelerations of its own, and the loop repeats ITERS times.
4. Inverse kinematics per frame on the pelvis position and the 12 leg joints: feet on their targets,
   center of mass on its target, everything else as close to the reference as it can stay. Arms,
   waist and the pelvis orientation are untouched.

Writes training/references/<clip_id>-balanced.json, a RobotMotion with "balanced_by": "training.balance";
imitate.Motion skips its own smoothing for those (it would slide the feet again). Then run
`python -m training.checks training/references/<clip_id>-balanced.json`.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import mujoco
import numpy as np

from .checks import sole_points
from .imitate import FEET, FOOT_SPHERES, Motion, motion_path, smooth

OUT = Path(__file__).parent / "references"
G = 9.81

# 1. Contacts. A foot within 3 cm of the floor (twice C1's 1.5 cm: MediaPipe's depth noise lifts a
# planted foot by about a centimeter, a real swing clears by 5+) and moving slower than 0.4 m/s (a
# swing moves at 1-3 m/s; a planted foot that "slides" 0.25 m/s is the error we are removing).
CONTACT_CLEAR_M = 0.03
CONTACT_SPEED = 0.4
SPEED_SMOOTH_S = 0.1  # foot speed over 3 frames: frame-to-frame jitter alone reads as 1 m/s
# A contact or a swing shorter than 0.1 s (3 frames) is noise: a real step lasts ~0.5 s.
MIN_CONTACT_S = 0.1

# 3. Balance, as walking-pattern generators do (Kajita's cart-table / linear inverted pendulum):
# the desired ZMP sits at the center of the planted foot, moves to the next foot during double
# support, and the CoM path that produces it is solved by least squares.
# Double support of at least 0.12 s (human walking has ~0.1 s per step at 0.6 m/s): the trailing
# foot lifts later if the video's contacts give less. Without it the ZMP has to jump between feet.
DOUBLE_SUPPORT_S = 0.12
# How much the CoM may stay near the reference's own CoM (relative to producing the ZMP): small,
# because the reference's CoM is ~21 cm off its feet (median, the walk); the feet decide.
STAY_NEAR_REF = 1e-3
# Rounds of: solve CoM -> inverse kinematics -> measure the ZMP the robot really has -> correct.
ROUNDS = 4
ROUND_GAIN = 0.8
# Pelvis height target smoothed over 0.3 s (a step is ~0.5 s: the bob of the gait survives).
HEIGHT_SMOOTH_S = 0.3
# Polish: legs and pelvis smoothed over 0.1 s (3 frames at 30 fps), then held with weight 1 (20 times
# the plain posture weight) while the feet and CoM are put back.
POLISH_SMOOTH_S = 0.1
W_POLISH = 1.0
# The ZMP is measured as checks.C2 measures it (CoM smoothed over 0.2 s before differentiating), so
# the fix is judged by the test that found the problem.
ACC_SMOOTH_S = 0.2

# 4. Inverse kinematics. Feet first (weight 10: a sliding foot is what C1 failed on), then the CoM
# (10, as much as the feet: it is the balance), then the pelvis height (0.3, loose: the legs need to bend), then the leg angles of the
# reference (0.05: the style of the motion, when nothing else asks).
W_FOOT, W_COM, W_HEIGHT, W_POSTURE = 10.0, 10.0, 0.3, 0.05
# A swinging foot clears the floor by 5 mm.
SWING_CLEAR_M = 0.005
# A swing lifts the foot at least 5 cm at mid-step (people clear 1-2 cm at the toe and lift the foot
# 10-15 cm; the reference often drags it within 1.5 cm, which reads as a contact). Sine profile:
# zero speed at lift-off and landing.
SWING_LIFT_M = 0.05
# Wrists smoothed over 0.3 s. MediaPipe gives a hand only 3 body landmarks, so the wrist angles are
# mostly noise, and the wrist pitch/yaw motors (5 N m, gain 20) saturate on 0.25 rad of it: 5 % of
# the walk with the pelvis held (checks.C2). Nothing in a walk needs the wrist faster than that.
WRIST_SMOOTH_S = 0.3
# Which capsule ends hold a foot at toe-off: those within 3 cm of the most forward one (on the G1,
# the toe ends of the three capsules, 10-12 cm ahead of the ankle; the next ones back are at 5 cm).
TOE_BAND_M = 0.03
# The floor is a hard limit: 10 times the feet. Softer, a sphere 1-2 cm into the floor survived the IK,
# and imitate.Motion's grounding then lifted the whole body (and the planted foot) by as much.
W_FLOOR = 100.0
DAMPING = 1e-3
IK_STEPS = 20


def leg_dofs(model: mujoco.MjModel) -> tuple[np.ndarray, np.ndarray]:
    """dof and qpos indices of the 12 leg joints."""
    ids = [j for j in range(model.njnt) if any(p in model.joint(j).name for p in ("hip", "knee", "ankle"))]
    return model.jnt_dofadr[ids], model.jnt_qposadr[ids]


def sole_local(model: mujoco.MjModel) -> dict[str, list[np.ndarray]]:
    """Capsule ends of each foot in its ankle body's frame (checks.sole_points, at the default pose)."""
    from .checks import sole_points

    data = mujoco.MjData(model)
    mujoco.mj_kinematics(model, data)
    out = {}
    for side, body in zip(("left", "right"), FEET):
        b = model.body(body).id
        R, x = data.xmat[b].reshape(3, 3), data.xpos[b]
        out[side] = [R.T @ (p - x) for p, _, _ in sole_points(model, data, side)]
    return out


def toe_ends(model: mujoco.MjModel) -> list[int]:
    x = [e[0] for e in sole_local(model)["left"]]
    return [j for j, v in enumerate(x) if v >= max(x) - TOE_BAND_M]


def sole_height(model: mujoco.MjModel) -> float:
    """Height of the ankle body when its sole rests flat on the floor."""
    from .checks import sole_points

    data = mujoco.MjData(model)
    mujoco.mj_kinematics(model, data)
    b = model.body(FEET[0]).id
    return max(r - (p[2] - data.xpos[b][2]) for p, r, _ in sole_points(model, data, "left"))


def runs(mask: np.ndarray) -> list[tuple[int, int]]:
    """[start, end) of every stretch of True."""
    out, start = [], None
    for i, v in enumerate(list(mask) + [False]):
        if v and start is None:
            start = i
        elif not v and start is not None:
            out.append((start, i))
            start = None
    return out


def clean(mask: np.ndarray, min_len: int) -> np.ndarray:
    """Fill gaps and drop stretches shorter than min_len frames."""
    m = mask.copy()
    for a, b in runs(~m):
        if 0 < a and b < len(m) and b - a < min_len:
            m[a:b] = True
    for a, b in runs(m):
        if b - a < min_len:
            m[a:b] = False
    return m


def yaw_of(R: np.ndarray) -> float:
    return float(np.arctan2(R[1, 0], R[0, 0]))


def contacts(model, data, q: np.ndarray, fps: float, walking: bool) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Per frame and foot: on the floor (bool), ankle position, ankle yaw."""
    feet = [model.body(n).id for n in FEET]
    floor = model.geom("floor").id
    spheres = [[model.geom(n).id for n in FOOT_SPHERES[s]] for s in ("left", "right")]
    pos = np.zeros((len(q), 2, 3))
    yaw = np.zeros((len(q), 2))
    clear = np.zeros((len(q), 2))
    for i in range(len(q)):
        data.qpos[:] = q[i]
        mujoco.mj_kinematics(model, data)
        for k in range(2):
            pos[i, k] = data.xpos[feet[k]]
            yaw[i, k] = yaw_of(data.xmat[feet[k]].reshape(3, 3))
            clear[i, k] = min(mujoco.mj_geomDistance(model, data, g, floor, 1.0, None) for g in spheres[k])
    xy = smooth(pos[..., :2].reshape(len(q), 4), max(1, round(SPEED_SMOOTH_S * fps))).reshape(len(q), 2, 2)
    speed = np.linalg.norm(np.gradient(xy, 1 / fps, axis=0), axis=-1)
    on = (clear < CONTACT_CLEAR_M) & (speed < CONTACT_SPEED)
    if walking:  # no flight in a walk: the lower foot is down
        none = ~on.any(axis=1)
        on[none, np.argmin(clear[none], axis=1)] = True
    min_len = max(1, round(MIN_CONTACT_S * fps))
    on = np.stack([clean(on[:, k], min_len) for k in range(2)], axis=1)
    if walking:
        none = ~on.any(axis=1)
        on[none, np.argmin(clear[none], axis=1)] = True
    return on, pos, yaw


def feet_targets(on: np.ndarray, pos: np.ndarray, yaw: np.ndarray, sole: float, fps: float):
    """Target ankle position and yaw per frame and foot (see the module docstring, step 2)."""
    n = len(on)
    tgt = pos.copy()
    tyaw = yaw.copy()
    for k in range(2):
        stretches = runs(on[:, k])
        for a, b in stretches:
            tgt[a:b, k, :2] = np.median(pos[a:b, k, :2], axis=0)
            tgt[a:b, k, 2] = sole
            tyaw[a:b, k] = np.median(np.unwrap(yaw[a:b, k]))
        # Swings: the reference path, shifted from lift-off to landing so it starts and ends on the
        # planted spots.
        for (a0, b0), (a1, b1) in zip([(0, 0)] + stretches, stretches + [(n, n)]):
            s, e = b0, a1  # swing is [s, e)
            if e <= s:
                continue
            start = tgt[s - 1, k] - pos[s - 1, k] if s > 0 else np.zeros(3)
            end = tgt[e, k] - pos[e, k] if e < n else start
            u = (np.arange(s, e) - s + 1) / (e - s + 1)
            u = u * u * (3 - 2 * u)  # smoothstep: no jump in velocity at either end
            tgt[s:e, k] = pos[s:e, k] + (1 - u)[:, None] * start + u[:, None] * end
            lift = sole + SWING_CLEAR_M + SWING_LIFT_M * np.sin(np.pi * (np.arange(s, e) - s + 1) / (e - s + 1))
            tgt[s:e, k, 2] = np.maximum(tgt[s:e, k, 2], lift)
    return tgt, tyaw


def ik_frame(model, data, q: np.ndarray, q_ref: np.ndarray, feet_pos, feet_yaw, planted, com_xy, dofs, qadr,
             w_posture: float = W_POSTURE) -> np.ndarray:
    """Pelvis position + leg joints so the feet and the CoM reach their targets (damped least squares)."""
    feet = [model.body(n).id for n in FEET]
    local_ends = sole_local(model)
    front = toe_ends(model)
    cols = np.concatenate([[0, 1, 2], dofs])  # pelvis translation + legs, in qvel space
    lo, hi = model.jnt_range[[model.dof_jntid[d] for d in dofs]].T
    jp, jr = np.zeros((3, model.nv)), np.zeros((3, model.nv))
    for _ in range(IK_STEPS):
        data.qpos[:] = q
        mujoco.mj_kinematics(model, data)
        mujoco.mj_comPos(model, data)
        rows, errs, ws = [], [], []
        for k, side in enumerate(("left", "right")):
            ends = sole_points(model, data, side)
            if planted[k]:
                # Planted flat (1): every capsule end on the floor, where the foot landed, facing its
                # yaw. Toe-off (2, the trailing foot in double support): only the two front ends stay;
                # the heel may rise. Flat all the way left the trailing foot 5-6 cm up: a human stride
                # is too long for the G1 to reach flat-footed.
                R = np.array([[np.cos(feet_yaw[k]), -np.sin(feet_yaw[k]), 0], [np.sin(feet_yaw[k]), np.cos(feet_yaw[k]), 0], [0, 0, 1]])
                for j, (p, r, gid) in enumerate(ends):
                    if planted[k] == 2 and j not in front:
                        continue
                    want = feet_pos[k] + R @ local_ends[side][j]
                    want[2] = r
                    mujoco.mj_jac(model, data, jp, jr, p, feet[k])
                    rows.append(jp[:, cols].copy())
                    errs.append(want - p)
                    ws += [W_FOOT] * 3
            else:
                mujoco.mj_jacBody(model, data, jp, jr, feet[k])
                rows.append(jp[:, cols].copy())
                errs.append(feet_pos[k] - data.xpos[feet[k]])
                ws += [W_FOOT] * 3
            # No capsule end of either foot below the floor (a swinging toe dipping in lifted the whole
            # body when imitate.Motion grounded it); a swinging foot clears it by SWING_CLEAR_M.
            for p, r, gid in ends:
                low = r + (0.0 if planted[k] else SWING_CLEAR_M)
                if p[2] < low:
                    mujoco.mj_jac(model, data, jp, jr, p, feet[k])
                    rows.append(jp[2:3, cols].copy())
                    errs.append([low - p[2]])
                    ws += [W_FLOOR]
        jc = np.zeros((3, model.nv))
        mujoco.mj_jacSubtreeCom(model, data, jc, 1)
        rows.append(jc[:2, cols])
        errs.append(com_xy - data.subtree_com[1][:2])
        ws += [W_COM] * 2
        h = np.zeros((1, len(cols)))
        h[0, 2] = 1
        rows.append(h)
        errs.append([q_ref[2] - q[2]])
        ws += [W_HEIGHT]
        post = np.zeros((len(dofs), len(cols)))
        post[:, 3:] = np.eye(len(dofs))
        rows.append(post)
        errs.append(q_ref[qadr] - q[qadr])
        ws += [w_posture] * len(dofs)
        J = np.vstack(rows)
        e = np.concatenate([np.atleast_1d(x) for x in errs])
        w = np.array(ws)
        dq = np.linalg.solve(J.T @ (w[:, None] * J) + DAMPING * np.eye(len(cols)), J.T @ (w * e))
        q = q.copy()
        q[:3] += dq[:3]
        q[qadr] = np.clip(q[qadr] + dq[3:], lo, hi)
    return q


def support_points(model, data, q: np.ndarray, planted) -> np.ndarray:
    """Capsule ends of the planted feet that are on the floor (as checks.C2 counts them)."""
    data.qpos[:] = q
    mujoco.mj_kinematics(model, data)
    return np.array([p[:2].copy() for k, s in enumerate(("left", "right")) if planted[k]
                     for p, r, _ in sole_points(model, data, s) if p[2] - r < CONTACT_CLEAR_M / 2])


def com_of(model, data, qs: np.ndarray) -> np.ndarray:
    out = np.zeros((len(qs), 3))
    for i, q in enumerate(qs):
        data.qpos[:] = q
        mujoco.mj_kinematics(model, data)
        mujoco.mj_comPos(model, data)
        out[i] = data.subtree_com[1]
    return out


def zmp_of(com: np.ndarray, fps: float) -> np.ndarray:
    dt = 1 / fps
    acc = np.gradient(np.gradient(smooth(com, max(1, round(ACC_SMOOTH_S * fps))), dt, axis=0), dt, axis=0)
    return com[:, :2] - com[:, 2:3] / G * acc[:, :2]


def double_support(on: np.ndarray, fps: float) -> np.ndarray:
    """Delay each lift-off until the other foot has been down DOUBLE_SUPPORT_S."""
    on = on.copy()
    ds = max(1, round(DOUBLE_SUPPORT_S * fps))
    for k in range(2):
        for a, b in runs(on[:, k]):
            # The other foot lands at the end of this stance (or before): keep this one down until ds
            # frames after that landing.
            landings = [a2 for a2, _ in runs(on[:, 1 - k]) if a < a2 <= b + 1]
            if landings:
                on[b:min(len(on), landings[-1] + ds), k] = True
    return on


def foot_modes(on: np.ndarray) -> np.ndarray:
    """0 swinging, 1 planted flat, 2 toe-off: in double support, the foot whose stance ends first."""
    mode = on.astype(int)
    ends = np.full(on.shape, len(on))
    for k in range(2):
        for a, b in runs(on[:, k]):
            ends[a:b, k] = b
    both = on.all(axis=1)
    trailing = np.argmin(ends, axis=1)
    for i in np.where(both)[0]:
        if ends[i, 0] != ends[i, 1]:
            mode[i, trailing[i]] = 2
    return mode


def desired_zmp(model, data, qs: np.ndarray, on: np.ndarray, fps: float) -> np.ndarray:
    """Center of the planted foot; in double support, moving from the foot that lifts next to the
    one that stays."""
    centers = np.zeros((len(qs), 2, 2))
    toes = np.zeros((len(qs), 2, 2))
    front = toe_ends(model)
    for i, q in enumerate(qs):
        data.qpos[:] = q
        mujoco.mj_kinematics(model, data)
        for k, s in enumerate(("left", "right")):
            ends = sole_points(model, data, s)
            centers[i, k] = np.mean([p[:2] for p, _, _ in ends], axis=0)
            toes[i, k] = np.mean([ends[j][0][:2] for j in front], axis=0)
    p = np.zeros((len(qs), 2))
    both = on.all(axis=1)
    for i in range(len(qs)):
        if not both[i]:
            p[i] = centers[i, int(np.argmax(on[i]))]
    for a, b in runs(both):
        # Which foot stays: the one still down right after; the weight moves onto it.
        after = on[min(b, len(on) - 1)]
        stay = int(np.argmax(after)) if not after.all() else 0
        before = on[max(a - 1, 0)]
        start = int(np.argmax(before)) if not before.all() else 1 - stay
        u = (np.arange(a, b) - a + 0.5) / (b - a)
        # It leaves from the trailing foot's toe: that foot's heel is up (toe-off).
        p[a:b] = (1 - u)[:, None] * toes[a:b, start] + u[:, None] * centers[a:b, stay]
    return p


def com_for_zmp(p: np.ndarray, height: float, fps: float, near: np.ndarray) -> np.ndarray:
    """CoM path whose cart-table ZMP is p: minimize |c - h/g c'' - p|^2 + STAY_NEAR_REF |c - near|^2."""
    n = len(p)
    k = height / G * fps * fps
    A = np.zeros((n, n))
    for i in range(1, n - 1):
        A[i, i - 1], A[i, i], A[i, i + 1] = -k, 1 + 2 * k, -k
    A[0, 0] = A[-1, -1] = 1  # ends: ZMP = CoM (standing still)
    lhs = A.T @ A + STAY_NEAR_REF * np.eye(n)
    return np.linalg.solve(lhs, A.T @ p + STAY_NEAR_REF * near)


def solve_ik(model, data, q_ref, tgt, tyaw, on, com_xy, dofs, qadr, w_posture: float = W_POSTURE) -> np.ndarray:
    qs = q_ref.copy()
    for i in range(len(q_ref)):
        # Warm start from the previous frame's solution, with this frame's arms, waist and pelvis turn.
        start = q_ref[i].copy()
        if i:
            start[:3] = qs[i - 1][:3] + (q_ref[i][:3] - q_ref[i - 1][:3])
            start[qadr] = qs[i - 1][qadr]
        qs[i] = ik_frame(model, data, start, q_ref[i], tgt[i], tyaw[i], on[i], com_xy[i], dofs, qadr, w_posture)
    return qs


def zmp_outside(model, data, qs, on, zmp) -> np.ndarray:
    from .checks import distance_outside

    return np.array([distance_outside(zmp[i], support_points(model, data, qs[i], on[i])) for i in range(len(qs))])


def balance(clip: str, rounds: int = ROUNDS, log=print) -> tuple[dict, dict]:
    from .imitate import MimicEnv

    model = MimicEnv(seed=0, clips=(clip,), push=False).model
    data = mujoco.MjData(model)
    raw = json.loads(motion_path(clip).read_text())
    motion = Motion(motion_path(clip), model)  # smoothed and grounded, as training would see it
    q_ref, fps = motion.qpos.copy(), motion.fps
    walking = "caminar" in clip or "walk" in clip
    dofs, qadr = leg_dofs(model)
    on, pos, yaw = contacts(model, data, q_ref, fps, walking)
    on = double_support(on, fps)
    tgt, tyaw = feet_targets(on, pos, yaw, sole_height(model), fps)
    mode = foot_modes(on)
    com_ref = com_of(model, data, q_ref)
    height = float(np.mean(com_ref[:, 2]))
    # The pelvis height asked for is the reference's, smoothed over HEIGHT_SMOOTH_S: grounding it frame
    # by frame left a 3 m/s^2 median pelvis acceleration in a 0.6 m/s walk (~1 is a real walk's).
    q_ref[:, 2] = smooth(q_ref[:, 2:3], max(1, round(HEIGHT_SMOOTH_S * fps)))[:, 0]
    wrists = [model.jnt_qposadr[j] for j in range(model.njnt) if "wrist" in model.joint(j).name]
    q_ref[:, wrists] = smooth(q_ref[:, wrists], max(1, round(WRIST_SMOOTH_S * fps)))
    # First pass: feet planted, CoM where the reference has it; it gives the feet's real spots.
    qs = solve_ik(model, data, q_ref, tgt, tyaw, mode, com_ref[:, :2], dofs, qadr)
    p = desired_zmp(model, data, qs, on, fps)
    aim = p.copy()
    history = []
    for r in range(rounds + 1):
        target = np.column_stack([com_for_zmp(aim[:, j], height, fps, com_ref[:, j]) for j in range(2)])
        qs = solve_ik(model, data, q_ref, tgt, tyaw, mode, target, dofs, qadr)
        com = com_of(model, data, qs)
        zmp = zmp_of(com, fps)
        out = zmp_outside(model, data, qs, on, zmp)
        feet_err = max(np.linalg.norm(foot_positions(model, data, qs[i]) - tgt[i], axis=1).max() for i in range(len(qs)))
        history.append({"round": r, "zmp_out_share": float(np.mean(out > 0.03)), "zmp_out_p95_cm": float(100 * np.percentile(out, 95)),
                        "com_err_cm": float(100 * np.percentile(np.linalg.norm(com[:, :2] - target, axis=1), 95)),
                        "feet_err_cm": float(100 * feet_err)})
        h = history[-1]
        log(f"round {r}: ZMP > 3 cm outside the feet in {100 * h['zmp_out_share']:.0f} % of frames (p95 {h['zmp_out_p95_cm']:.1f} cm); "
            f"CoM off its target p95 {h['com_err_cm']:.1f} cm; feet off target ≤ {h['feet_err_cm']:.1f} cm")
        if r == rounds:
            break
        aim += ROUND_GAIN * (p - zmp)  # ask for more where the robot fell short
    # Polish: frame-by-frame IK leaves jitter in the legs (joint acceleration p95 68 rad/s^2 against
    # the reference's 49). Smooth, then solve once more with the smoothed legs as the posture to keep,
    # so the feet and the CoM are back on target.
    smoothed = qs.copy()
    smoothed[:, :3] = smooth(qs[:, :3], max(1, round(POLISH_SMOOTH_S * fps)))
    smoothed[:, qadr] = smooth(qs[:, qadr], max(1, round(POLISH_SMOOTH_S * fps)))
    qs = solve_ik(model, data, smoothed, tgt, tyaw, mode, target, dofs, qadr, W_POLISH)
    com = com_of(model, data, qs)
    zmp = zmp_of(com, fps)
    out = zmp_outside(model, data, qs, on, zmp)
    log(f"polished: ZMP > 3 cm outside the feet in {100 * np.mean(out > 0.03):.0f} % of frames (p95 {100 * np.percentile(out, 95):.1f} cm)")
    out_motion = {**raw, "clip_id": f"{raw['clip_id']}-balanced", "qpos": qs.round(5).tolist(),
                  "balanced_by": "training.balance", "contacts": on.astype(int).tolist()}
    shift = com[:, :2] - com_ref[:, :2]
    return out_motion, {"history": history, "contact_share": on.mean(axis=0).tolist(),
                        "com_shift_cm_p95": float(100 * np.percentile(np.linalg.norm(shift, axis=1), 95))}


def foot_positions(model, data, q) -> np.ndarray:
    data.qpos[:] = q
    mujoco.mj_kinematics(model, data)
    return data.xpos[[model.body(n).id for n in FEET]].copy()


def main() -> None:
    p = argparse.ArgumentParser(prog="python -m training.balance", description=__doc__.split("\n")[0])
    p.add_argument("clip", help="clip id in physics/motions/ or a RobotMotion .json")
    p.add_argument("--rounds", type=int, default=ROUNDS)
    args = p.parse_args()
    motion, info = balance(args.clip, args.rounds)
    OUT.mkdir(exist_ok=True)
    path = OUT / f"{motion['clip_id']}.json"
    path.write_text(json.dumps(motion))
    print(f"feet on the floor: left {100 * info['contact_share'][0]:.0f} %, right {100 * info['contact_share'][1]:.0f} %; "
          f"CoM moved up to {info['com_shift_cm_p95']:.1f} cm (p95)")
    print(f"-> {path}")


if __name__ == "__main__":
    main()
