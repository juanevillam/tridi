"""GVHMR's SMPL-X (gvhmr_mac.py) -> MediaPipe's 33 points, so data.quality compares both captures.

Runs in GVHMR's environment (needs smplx and torch):

    ~/Code/tridi-thirdparty/GVHMR/.venv/bin/python data/capture2/to_joints.py <video>.gvhmr.npz [--out clip.json]

Writes a JSON with what data.jitter.load reads (fps, frames[].joints as [33][3] in meters, y up,
quality.valid_ratio). It is a comparison bridge, not PoseClip v2 (that one keeps the SMPL-X
parameters; contract first, docs/plan-v2.md). Points MediaPipe has and SMPL-X does not name (eyes'
inner and outer corners, mouth, hands' pinky/index/thumb) are copied from the nearest SMPL-X joint;
data.quality does not use them.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

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


def joints(npz: Path) -> tuple[np.ndarray, float]:
    import smplx
    import torch

    d = np.load(npz)
    n = len(d["global_transl"])
    model = smplx.create(str(SMPLX_DIR), model_type="smplx", gender="neutral", use_pca=False,
                         num_betas=d["global_betas"].shape[1], batch_size=n)
    t = lambda k: torch.as_tensor(d[k], dtype=torch.float32)  # noqa: E731
    with torch.no_grad():
        out = model(global_orient=t("global_global_orient"), body_pose=t("global_body_pose"),
                    betas=t("global_betas"), transl=t("global_transl"))
    return out.joints.numpy()[:, MEDIAPIPE_FROM_SMPLX], float(d["fps"])


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("npz", type=Path)
    p.add_argument("--out", type=Path)
    args = p.parse_args()
    j, fps = joints(args.npz)
    # GVHMR's world is y up with the floor near y = 0, as data.jitter expects.
    clip = {"clip_id": args.npz.name.split(".")[0] + "-gvhmr", "fps": fps, "source": "gvhmr",
            "quality": {"valid_ratio": 1.0}, "frames": [{"joints": f.round(4).tolist()} for f in j]}
    out = args.out or args.npz.with_suffix(".joints.json")
    out.write_text(json.dumps(clip))
    print(f"{len(j)} frames -> {out}")


if __name__ == "__main__":
    main()
