"""GVHMR's SMPL-X (gvhmr_mac.py) -> a PoseClip v1 (MediaPipe's 33 points), so today's web, retargeting
and data.quality use the new capture without a contract change.

Runs in GVHMR's environment (needs smplx and torch):

    ~/Code/tridi-thirdparty/GVHMR/.venv/bin/python data/capture2/to_poseclip.py <video>.gvhmr.npz [--out-dir DIR] [--raw]

Writes clip_<video>-gvhmr.json and .npz in --out-dir (default: a clips/ folder next to the .npz), as
docs/contrato.md's PoseClip: y up, z toward the camera, the first frame's hips at (0, 0, 0). It is a
bridge, not PoseClip v2: v2 keeps the SMPL-X parameters (and the fingers); contract first,
docs/plan-v2.md. Points MediaPipe has and SMPL-X does not name (eyes' inner and outer corners,
mouth, hands' pinky/index/thumb) are copied from the nearest SMPL-X joint; nothing downstream reads
them for the body.

Two things differ from GVHMR's own world, and both are fixed here:
- Heading. GVHMR's world has gravity right but an arbitrary turn about the vertical (in our clips the
  person faced -z). The contract wants z toward the camera, so the clip is turned about y until the
  person's facing in the first frames matches their facing in the camera's view (GVHMR's in-camera
  output), as data/lift.py's clips are.
- Smoothing. data/lift.py smooths MediaPipe's points (body 0.4 s, trajectory 0.6 s, data/smooth.py);
  the same is done here so both captures are compared and retargeted alike. --raw skips it.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

# data/smooth.py only needs numpy, so it is imported straight from its folder (data/lift.py, and the
# data package, pull in MediaPipe, which GVHMR's environment does not have).
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from smooth import savgol, smooth_points  # noqa: E402

# The trajectory's own smoothing, the same as data/lift.py's ROOT_WINDOW_S and ROOT_ORDER (copied for
# the reason above; keep them equal).
ROOT_WINDOW_S = 0.6
ROOT_ORDER = 2

GVHMR = Path.home() / "Code" / "tridi-thirdparty" / "GVHMR"
SMPLX_DIR = GVHMR / "inputs" / "checkpoints" / "body_models"

# SMPL-X joint index (smplx library order, with its extra face and feet joints) for each of
# MediaPipe's 33 points. MediaPipe's "left" is the person's left, as SMPL-X's.
NOSE, R_EYE, L_EYE, R_EAR, L_EAR = 55, 56, 57, 58, 59
L_BIG_TOE, L_HEEL, R_BIG_TOE, R_HEEL = 60, 62, 63, 65
MEDIAPIPE_FROM_SMPLX = [
    NOSE,                                   # 0 nose
    L_EYE, L_EYE, L_EYE,                    # 1-3 left eye inner, eye, outer
    R_EYE, R_EYE, R_EYE,                    # 4-6 right eye inner, eye, outer
    L_EAR, R_EAR,                           # 7-8 ears
    NOSE, NOSE,                             # 9-10 mouth
    16, 17,                                 # 11-12 shoulders
    18, 19,                                 # 13-14 elbows
    20, 21,                                 # 15-16 wrists
    20, 21, 20, 21, 20, 21,                 # 17-22 pinky, index, thumb (the wrist)
    1, 2,                                   # 23-24 hips
    4, 5,                                   # 25-26 knees
    7, 8,                                   # 27-28 ankles
    L_HEEL, R_HEEL,                         # 29-30 heels
    L_BIG_TOE, R_BIG_TOE,                   # 31-32 foot index (big toe)
]
# Frames averaged to read the person's heading: 0.5 s at 30 fps, enough to ignore one bad frame and
# short enough that a person who turns early still faces the way they did at the start.
HEADING_FRAMES = 15


def smplx_points(d: np.lib.npyio.NpzFile, space: str) -> np.ndarray:
    """[F, 33, 3] MediaPipe-ordered points of GVHMR's params in 'global' (world) or 'incam' space."""
    import smplx
    import torch

    n = len(d[f"{space}_transl"])
    model = smplx.create(str(SMPLX_DIR), model_type="smplx", gender="neutral", use_pca=False,
                         num_betas=d[f"{space}_betas"].shape[1], batch_size=n)
    t = lambda k: torch.as_tensor(d[f"{space}_{k}"], dtype=torch.float32)  # noqa: E731
    with torch.no_grad():
        out = model(global_orient=t("global_orient"), body_pose=t("body_pose"), betas=t("betas"), transl=t("transl"))
    return out.joints.numpy()[:, MEDIAPIPE_FROM_SMPLX]


def facing_angle(points: np.ndarray) -> float:
    """Heading about y (radians, atan2(x, z)) of the first frames, from hips and shoulders, y up."""
    p = points[:HEADING_FRAMES]
    left = (p[:, 23] - p[:, 24] + p[:, 11] - p[:, 12]).mean(axis=0)  # the person's right -> left
    forward = np.cross(left, [0.0, 1.0, 0.0])  # left x up: with y up, x left gives +z forward
    return float(np.arctan2(forward[0], forward[2]))


def turn_y(points: np.ndarray, angle: float) -> np.ndarray:
    c, s = np.cos(angle), np.sin(angle)
    x, y, z = points[..., 0], points[..., 1], points[..., 2]
    return np.stack([c * x + s * z, y, -s * x + c * z], axis=-1)


def poseclip(npz: Path, raw: bool = False) -> tuple[np.ndarray, float]:
    """[F, 33, 3] points in the contract's space (y up, z toward the camera, first hips at 0)."""
    d = np.load(npz)
    fps = float(d["fps"])
    world = smplx_points(d, "global")
    # Camera space (x right, y down, z away) -> contract axes: a 180 degree turn about x, as data/lift.py.
    seen = smplx_points(d, "incam") * np.array([1, -1, -1])
    pos = turn_y(world, facing_angle(seen) - facing_angle(world))
    if not raw:
        hips = (pos[:, 23] + pos[:, 24]) / 2
        body = smooth_points(pos - hips[:, None], fps)
        root = savgol(hips, int(round(ROOT_WINDOW_S * fps)) | 1, ROOT_ORDER)
        pos = body + root[:, None]
    return pos - (pos[0, 23] + pos[0, 24]) / 2, fps


def write(points: np.ndarray, fps: float, video: str, out_dir: Path) -> Path:
    """Saves clip_<video>-gvhmr.json and .npz as data/extract.write_clip does; returns the JSON path."""
    out_dir.mkdir(parents=True, exist_ok=True)
    clip_id = f"clip_{video}-gvhmr"
    n = len(points)
    t = np.arange(n) / fps
    joints = np.concatenate([points, np.ones((n, 33, 1))], axis=2)  # SMPL-X has no visibility: all 1
    clip = {
        "id": clip_id, "source": "upload", "source_file": f"{video}.mp4", "fps": round(fps, 3),
        "skeleton": "mediapipe33", "units": "m", "origin": "hips",
        "subject": {"track_id": 0, "selected_by": "auto"},  # GVHMR follows the main person itself
        "frames": [{"t": round(float(ti), 4), "joints": j.round(4).tolist()} for ti, j in zip(t, joints)],
        "quality": {"valid_ratio": 1.0},
        "capture": "gvhmr",  # extra field, ignored by today's readers: which capture made it
    }
    path = out_dir / f"{clip_id}.json"
    path.write_text(json.dumps(clip, separators=(",", ":")))
    meta = {k: v for k, v in clip.items() if k != "frames"}
    np.savez_compressed(out_dir / f"{clip_id}.npz", joints=joints.astype(np.float32), t=t.astype(np.float32),
                        valid=np.ones(n, bool), frame_index=np.arange(n), meta=json.dumps(meta))
    return path


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("npz", type=Path, nargs="+")
    p.add_argument("--out-dir", type=Path, help="default: clips/ next to the .npz")
    p.add_argument("--raw", action="store_true", help="no smoothing (GVHMR as it comes)")
    args = p.parse_args()
    for npz in args.npz:
        points, fps = poseclip(npz, args.raw)
        video = npz.name.split(".")[0]
        path = write(points, fps, video, args.out_dir or npz.parent / "clips")
        print(f"{len(points)} frames at {fps:g} fps -> {path}")


if __name__ == "__main__":
    main()
