"""Regression checks for 2D pose overlays (data/overlay.py) and web/scripts/make-video-overlay.py.

    uv run --project data python -m data.check_overlay
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

from .overlay import draw_pose_overlay

REPO_ROOT = Path(__file__).resolve().parent.parent
MAKE_VIDEO_OVERLAY = REPO_ROOT / "web" / "scripts" / "make-video-overlay.py"


def expect(cond: bool, msg: str) -> None:
    if not cond:
        print(f"FAIL: {msg}", file=sys.stderr)
        sys.exit(1)
    print(f"ok: {msg}")


def _make_body(w: int = 320, h: int = 240) -> np.ndarray:
    pts = np.zeros((33, 3), dtype=np.float32)
    pts[:, 2] = 0.99
    pts[0, :2] = [160, 40]   # nose
    pts[7, :2] = [145, 45]   # left ear
    pts[8, :2] = [175, 45]   # right ear
    pts[11, :2] = [130, 90]  # left shoulder
    pts[12, :2] = [190, 90]  # right shoulder
    pts[13, :2] = [110, 130]
    pts[14, :2] = [210, 130]
    pts[15, :2] = [100, 170]
    pts[16, :2] = [220, 170]
    pts[17, :2] = [95, 175]
    pts[19, :2] = [98, 180]
    pts[21, :2] = [102, 175]
    pts[18, :2] = [225, 175]
    pts[20, :2] = [222, 180]
    pts[22, :2] = [218, 175]
    pts[23, :2] = [140, 150]
    pts[24, :2] = [180, 150]
    pts[25, :2] = [140, 190]
    pts[26, :2] = [180, 190]
    pts[27, :2] = [140, 230]
    pts[28, :2] = [180, 230]
    pts[29, :2] = [135, 232]
    pts[30, :2] = [185, 232]
    pts[31, :2] = [145, 235]
    pts[32, :2] = [175, 235]
    return pts


def _make_hand(cx: float, cy: float) -> np.ndarray:
    hand = np.zeros((21, 3), dtype=np.float32)
    hand[:, 2] = 0.99
    for j in range(21):
        hand[j, 0] = cx + (j % 5) * 4.0
        hand[j, 1] = cy + (j // 5) * 5.0
    return hand


def test_draw_pose_overlay() -> None:
    body = _make_body()
    hands = np.stack([_make_hand(30, 170), _make_hand(260, 170)], axis=0)

    # 1. Head [0, 7, 8] + 2x21 hands with NaN right confidence and NaN coords in right hand.
    bad_hands = hands.copy()
    bad_hands[1, 3, :2] = np.nan
    canvas = np.zeros((240, 320, 3), dtype=np.uint8)
    draw_pose_overlay(canvas, body, 2, bad_hands, np.array([0.9, np.nan], dtype=np.float32))
    left_roi = int(np.count_nonzero(canvas[165:210, 25:60]))
    right_roi = int(np.count_nonzero(canvas[165:210, 255:295]))
    head_roi = int(np.count_nonzero(canvas[30:60, 135:185]))
    expect(left_roi > 100, f"draw_pose_overlay draws left 21-pt hand (nonzero={left_roi})")
    expect(right_roi == 0, f"draw_pose_overlay skips right hand with NaN conf (nonzero={right_roi})")
    expect(head_roi > 50, f"draw_pose_overlay draws minimalist head 0/7/8 (nonzero={head_roi})")

    # 2. Both hands valid vs zero confidence.
    canvas_both = np.zeros((240, 320, 3), dtype=np.uint8)
    draw_pose_overlay(canvas_both, body, 2, hands, np.array([0.85, 0.85], dtype=np.float32))
    right_drawn = int(np.count_nonzero(canvas_both[165:210, 255:295]))
    expect(right_drawn > 100, f"draw_pose_overlay draws right 21-pt hand when valid (nonzero={right_drawn})")

    canvas_zero = np.zeros((240, 320, 3), dtype=np.uint8)
    draw_pose_overlay(canvas_zero, body, 2, hands, np.array([0.0, -0.5], dtype=np.float32))
    expect(
        int(np.count_nonzero(canvas_zero[165:210, 25:60])) == 0
        and int(np.count_nonzero(canvas_zero[165:210, 255:295])) == 0,
        "draw_pose_overlay skips both hands when hand_conf <= 0",
    )


def test_make_video_overlay() -> None:
    body0 = _make_body()
    hands = np.stack([_make_hand(30, 170), _make_hand(260, 170)], axis=0)

    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)

        # 1. 2-frame .npz with NaN and 0.0 hand_conf (GAP-5).
        npz_two = tmp_dir / "two.npz"
        out_two = tmp_dir / "two.json"
        np.savez(
            npz_two,
            t=np.array([0.0, 1.0 / 30.0], dtype=np.float32),
            joints2d=np.stack([body0, body0], axis=0),
            hand_joints2d=np.stack([hands, hands], axis=0),
            hand_conf=np.array([[0.9, 0.0], [np.nan, 0.8]], dtype=np.float32),
        )
        res_two = subprocess.run(
            [sys.executable, str(MAKE_VIDEO_OVERLAY), str(npz_two), "320", "240", str(out_two)],
            capture_output=True,
            text=True,
            check=False,
        )
        expect(res_two.returncode == 0, f"make-video-overlay 2-frame exits 0 (stderr={res_two.stderr.strip()})")
        parsed_two = json.loads(out_two.read_text())
        expect(
            abs(parsed_two["fps"] - 30.0) < 1e-4 and len(parsed_two["frames"]) == 2,
            f"2-frame overlay fps={parsed_two['fps']:.2f}, frames={len(parsed_two['frames'])}",
        )
        expect(
            parsed_two["hands"][0]["left"] is not None
            and parsed_two["hands"][0]["right"] is None
            and parsed_two["hands"][1]["left"] is None
            and parsed_two["hands"][1]["right"] is not None,
            "make-video-overlay filters out both 0.0 and NaN hand_conf cleanly",
        )

        # 2. 1-frame .npz (GAP-5 IndexError regression).
        npz_one = tmp_dir / "one.npz"
        out_one = tmp_dir / "one.json"
        np.savez(
            npz_one,
            t=np.array([0.0], dtype=np.float32),
            joints2d=body0[None, :, :],
            hand_joints2d=hands[None, :, :, :],
            hand_conf=np.array([[0.85, np.nan]], dtype=np.float32),
        )
        res_one = subprocess.run(
            [sys.executable, str(MAKE_VIDEO_OVERLAY), str(npz_one), "320", "240", str(out_one)],
            capture_output=True,
            text=True,
            check=False,
        )
        expect(res_one.returncode == 0, f"make-video-overlay 1-frame exits 0 (stderr={res_one.stderr.strip()})")
        parsed_one = json.loads(out_one.read_text())
        expect(
            len(parsed_one["frames"]) == 1
            and np.isfinite(parsed_one["fps"])
            and parsed_one["fps"] > 0
            and parsed_one["hands"][0]["left"] is not None
            and parsed_one["hands"][0]["right"] is None,
            f"1-frame overlay emits safe fallback fps={parsed_one['fps']} and valid hands",
        )


def main() -> None:
    test_draw_pose_overlay()
    test_make_video_overlay()
    print("overlay check passed", file=sys.stderr)


if __name__ == "__main__":
    main()
