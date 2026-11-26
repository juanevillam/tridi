"""Writes the 2D skeleton of a preloaded clip, over its source video, for the Simulaciones overlay.

data/ keeps each clip's MediaPipe landmarks in image pixels (`joints2d` in the .npz). The web plays
a smaller copy of the video (public/media), so the points are stored here as a share of the frame
(0 to 1), per video frame, with their visibility. Keeps minimalist head (0, 7, 8) and body (11..32),
plus optional 2x21 hand joints (`hand_joints2d`) when present in the .npz.

Run from the repo root: python3 web/scripts/make-video-overlay.py <clip.npz> <width> <height> <out.json>
(width and height of the ORIGINAL video the clip was extracted from: caminar-perfil.mp4 is 1280x720,
checked by drawing the points over a frame of web/public/media/caminar.mp4).
"""
import json
import sys

import numpy as np

npz, width, height, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
data = np.load(npz, allow_pickle=True)
points = data["joints2d"]  # [frames, 33, 3]: x px, y px, visibility
keep = [0, 7, 8, *range(11, 33)]
frames = [
    [
        [round(float(p[0]) / width, 4), round(float(p[1]) / height, 4), round(float(p[2]), 2)]
        if np.all(np.isfinite(p[:3]))
        else None
        for p in frame[keep]
    ]
    for frame in points
]
t = data["t"]
if len(t) >= 2:
    dt = float(t[1] - t[0])
    span = float(t[-1] - t[0]) + (dt if np.isfinite(dt) and dt > 0 else 0.0)
    fps = float(len(frames) / span) if np.isfinite(span) and span > 0 else (1.0 / dt if np.isfinite(dt) and dt > 0 else 30.0)
else:
    fps = 30.0  # safe fallback for single-frame .npz inputs without timestamp intervals

payload = {
    "fps": fps,
    "points": keep,
    "frames": frames,
}
if "hand_joints2d" in data.files:
    hand_pts = data["hand_joints2d"]  # [frames, 2, 21, 2|3]
    hand_conf = data["hand_conf"] if "hand_conf" in data.files else None
    hands_out = []
    for k, pair in enumerate(hand_pts):
        entry = {}
        for side_idx, side_name in ((0, "left"), (1, "right")):
            if hand_conf is not None:
                conf = float(hand_conf[k, side_idx])
                if not np.isfinite(conf) or conf <= 0:
                    entry[side_name] = None
                    continue
            pts = pair[side_idx]
            has_vis = pts.shape[1] >= 3
            cols = 3 if has_vis else 2
            if not np.all(np.isfinite(pts[:, :cols])) or not np.any(pts[:, :2] != 0):
                entry[side_name] = None
                continue
            entry[side_name] = [
                [
                    round(float(p[0]) / width, 4),
                    round(float(p[1]) / height, 4),
                    *([round(float(p[2]), 2)] if has_vis else []),
                ]
                for p in pts
            ]
        hands_out.append(entry if (entry["left"] or entry["right"]) else None)
    payload["hands"] = hands_out

with open(out, "w") as f:
    json.dump(payload, f, separators=(",", ":"), allow_nan=False)
print(f"{out}: {len(frames)} frames")
