"""Draw the subject of a PoseClip over its source video, to check the right person was followed.

    uv run --project data python -m data.overlay data/clips/<clip>.npz <video.mp4> [-o out.mp4]

Green box and skeleton: frames that made it into the clip. Red box: frames dropped and
interpolated (occluded, another person in the crop, or no pose found).
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

# MediaPipe Pose body connections (full face mesh left out; minimalist head 0, 7, 8 drawn separately).
BONES = [
    (11, 12), (11, 13), (13, 15), (12, 14), (14, 16), (11, 23), (12, 24), (23, 24),
    (23, 25), (25, 27), (27, 29), (29, 31), (27, 31), (24, 26), (26, 28), (28, 30), (30, 32), (28, 32),
]
# MediaPipe/MANO 21-point hand bones (5 fingers + palm knuckles, 23 bones per hand, matching web/src/skeleton.js).
HAND_BONES = [
    (0, 1), (1, 2), (2, 3), (3, 4),
    (0, 5), (5, 6), (6, 7), (7, 8),
    (0, 9), (9, 10), (10, 11), (11, 12),
    (0, 13), (13, 14), (14, 15), (15, 16),
    (0, 17), (17, 18), (18, 19), (19, 20),
    (5, 9), (9, 13), (13, 17),
]
MIN_VISIBILITY = 0.5
COARSE_HAND_POINTS = {0: {17, 19, 21}, 1: {18, 20, 22}}
GREEN, RED, WHITE = (80, 220, 80), (60, 60, 230), (255, 255, 255)


def _finite_pt(arr: np.ndarray, idx: int) -> bool:
    return 0 <= idx < len(arr) and bool(np.all(np.isfinite(arr[idx, :2])))


def _ipt(pt: np.ndarray) -> tuple[int, int]:
    return (int(round(float(pt[0]))), int(round(float(pt[1]))))


def draw_pose_overlay(
    frame: np.ndarray,
    joints2d_k: np.ndarray,
    thick: int,
    hand_joints2d_k: np.ndarray | None = None,
    hand_conf_k: np.ndarray | None = None,
) -> None:
    """Draw 11..32 body bones, minimalist [0, 7, 8] head, and optional 2x21 hand skeletons on `frame`."""
    joints2d_k = np.asarray(joints2d_k)

    def seen(idx: int) -> bool:
        if not _finite_pt(joints2d_k, idx):
            return False
        if joints2d_k.shape[1] < 3:
            return True
        vis = float(joints2d_k[idx, 2])
        return np.isfinite(vis) and vis >= MIN_VISIBILITY

    for a, b in BONES:
        if _finite_pt(joints2d_k, a) and _finite_pt(joints2d_k, b):
            cv2.line(frame, _ipt(joints2d_k[a, :2]), _ipt(joints2d_k[b, :2]), GREEN, thick, cv2.LINE_AA)

    # Minimalist head: neck from shoulder midpoint to headAnchor (ear midpoint lerped 0.25 toward nose),
    # plus ear-to-nose lines (or ear-to-ear when nose is hidden).
    ear_pts = [joints2d_k[j, :2].astype(float) for j in (7, 8) if seen(j)]
    ear_mid = (ear_pts[0] + ear_pts[1]) / 2.0 if len(ear_pts) == 2 else (ear_pts[0] if ear_pts else None)
    nose_pt = joints2d_k[0, :2].astype(float) if seen(0) else None
    head_anchor = (
        ear_mid + 0.25 * (nose_pt - ear_mid)
        if ear_mid is not None and nose_pt is not None
        else (ear_mid if ear_mid is not None else nose_pt)
    )
    if head_anchor is not None and _finite_pt(joints2d_k, 11) and _finite_pt(joints2d_k, 12):
        neck_base = (joints2d_k[11, :2].astype(float) + joints2d_k[12, :2].astype(float)) / 2.0
        cv2.line(frame, _ipt(neck_base), _ipt(head_anchor), GREEN, thick, cv2.LINE_AA)

    head_thick = max(1, int(round(thick * 0.75)))
    if seen(7) and nose_pt is not None:
        cv2.line(frame, _ipt(joints2d_k[7, :2]), _ipt(nose_pt), GREEN, head_thick, cv2.LINE_AA)
    if seen(8) and nose_pt is not None:
        cv2.line(frame, _ipt(joints2d_k[8, :2]), _ipt(nose_pt), GREEN, head_thick, cv2.LINE_AA)
    if seen(7) and seen(8) and nose_pt is None:
        cv2.line(frame, _ipt(joints2d_k[7, :2]), _ipt(joints2d_k[8, :2]), GREEN, head_thick, cv2.LINE_AA)

    # Optional 2x21 hand skeletons.
    drawn_sides: set[int] = set()
    hand_thick = max(1, int(round(thick * 0.55)))
    hand_r = max(1, int(round(thick * 0.6)))
    valid_hands: dict[int, tuple[np.ndarray, list[bool]]] = {}
    if hand_joints2d_k is not None:
        hand_arr = np.asarray(hand_joints2d_k)
        for side in (0, 1):
            if side >= len(hand_arr):
                continue
            if hand_conf_k is not None:
                conf = float(hand_conf_k[side])
                if not np.isfinite(conf) or conf <= 0:
                    continue
            hand = np.asarray(hand_arr[side])
            if hand.ndim != 2 or hand.shape[0] != 21 or hand.shape[1] < 2:
                continue
            if not np.any(np.isfinite(hand[:, :2])) or not np.any(hand[:, :2] != 0):
                continue
            ok = [
                _finite_pt(hand, j)
                and (hand.shape[1] < 3 or (np.isfinite(hand[j, 2]) and float(hand[j, 2]) >= MIN_VISIBILITY))
                for j in range(21)
            ]
            if not ok[0]:
                continue
            for a, b in HAND_BONES:
                if ok[a] and ok[b]:
                    cv2.line(frame, _ipt(hand[a, :2]), _ipt(hand[b, :2]), GREEN, hand_thick, cv2.LINE_AA)
            drawn_sides.add(side)
            valid_hands[side] = (hand, ok)

    skip_pts: set[int] = set()
    for side in drawn_sides:
        skip_pts |= COARSE_HAND_POINTS[side]

    for j in range(11, 33):
        if j in skip_pts or not _finite_pt(joints2d_k, j):
            continue
        cv2.circle(frame, _ipt(joints2d_k[j, :2]), thick + 1, WHITE, -1, cv2.LINE_AA)

    if nose_pt is not None:
        cv2.circle(frame, _ipt(nose_pt), max(2, thick), WHITE, -1, cv2.LINE_AA)
    ear_r = max(2, int(round(thick * 0.8)))
    if seen(7):
        cv2.circle(frame, _ipt(joints2d_k[7, :2]), ear_r, WHITE, -1, cv2.LINE_AA)
    if seen(8):
        cv2.circle(frame, _ipt(joints2d_k[8, :2]), ear_r, WHITE, -1, cv2.LINE_AA)

    for side in drawn_sides:
        hand, ok = valid_hands[side]
        for j in range(21):
            if ok[j]:
                cv2.circle(frame, _ipt(hand[j, :2]), hand_r, WHITE, -1, cv2.LINE_AA)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="python -m data.overlay", description=__doc__.split("\n")[0])
    p.add_argument("clip", type=Path, help="the clip's .npz")
    p.add_argument("video", type=Path, help="the source video")
    p.add_argument("-o", "--out", type=Path, help="output video (default: <clip>.overlay.mp4)")
    args = p.parse_args(argv)

    d = np.load(args.clip)
    meta = json.loads(str(d["meta"]))
    frame_index, joints2d, boxes, valid = d["frame_index"], d["joints2d"], d["boxes"], d["valid"]
    hand_joints2d = d["hand_joints2d"] if "hand_joints2d" in d.files else None
    hand_conf = d["hand_conf"] if "hand_conf" in d.files else None
    by_frame = {int(f): k for k, f in enumerate(frame_index)}
    out = args.out or args.clip.with_suffix(".overlay.mp4")

    cap = cv2.VideoCapture(str(args.video))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    w, h = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    tmp = out.with_suffix(".tmp.mp4")
    writer = cv2.VideoWriter(str(tmp), cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))
    thick = max(2, h // 300)
    label = f"#{meta['subject']['track_id']} {meta['subject']['selected_by']}"

    i = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        k = by_frame.get(i)
        if k is not None:
            color = GREEN if valid[k] else RED
            x0, y0, x1, y1 = boxes[k].astype(int)
            cv2.rectangle(frame, (x0, y0), (x1, y1), color, thick)
            cv2.putText(frame, label, (x0, max(y0 - 8, 20)), cv2.FONT_HERSHEY_SIMPLEX, h / 900, color, thick)
            if valid[k]:
                draw_pose_overlay(
                    frame,
                    joints2d[k],
                    thick,
                    hand_joints2d[k] if hand_joints2d is not None else None,
                    hand_conf[k] if hand_conf is not None else None,
                )
        writer.write(frame)
        i += 1
    cap.release()
    writer.release()

    # OpenCV's mp4v does not play everywhere (browsers, QuickTime); re-encode to H.264 when ffmpeg exists.
    if shutil.which("ffmpeg"):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-c:v", "libx264", "-pix_fmt", "yuv420p",
                        "-crf", "23", str(out)], check=True)
        tmp.unlink()
    else:
        tmp.rename(out)
    print(f"overlay -> {out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
