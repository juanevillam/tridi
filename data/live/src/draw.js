// Draws MediaPipe's 2D landmarks over the camera image, same bones and colors as data/overlay.py.

// MediaPipe Pose body connections (full face mesh left out; minimalist head 0, 7, 8 drawn separately).
const BONES = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [27, 29], [29, 31], [27, 31], [24, 26], [26, 28], [28, 30], [30, 32], [28, 32],
];
// MediaPipe/MANO 21-point hand bones (5 fingers + palm knuckles, 23 bones per hand, matching web/src/skeleton.js).
const HAND_BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [0, 9], [9, 10], [10, 11], [11, 12], // middle
  [0, 13], [13, 14], [14, 15], [15, 16], // ring
  [0, 17], [17, 18], [18, 19], [19, 20], // pinky
  [5, 9], [9, 13], [13, 17], // knuckles
];
const MIN_VISIBILITY = 0.5;
const COARSE_HAND_POINTS = { left: new Set([17, 19, 21]), right: new Set([18, 20, 22]) };

/**
 * @param ctx            2D context of a canvas laid over the video, with the video's pixel size
 * @param landmarks      33 points normalized to the image ({ x, y, visibility }), from onPose
 * @param visible        false draws in red: the body is too occluded for the clip
 * @param handLandmarks  optional { left, right } of 21 normalized 2D hand points each
 */
export function drawSkeleton(ctx, landmarks, visible = true, handLandmarks = null) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  if (!landmarks) return;
  const color = visible ? 'rgb(80, 220, 80)' : 'rgb(230, 60, 60)';
  const thick = Math.max(2, height / 300);
  const okPt = (p) => Boolean(p && Number.isFinite(p.x) && Number.isFinite(p.y));
  const seen = (i) => okPt(landmarks[i]) && (landmarks[i].visibility ?? 1) >= MIN_VISIBILITY;
  const pt = (i) => [landmarks[i].x * width, landmarks[i].y * height];
  const line = (a, b) => {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  };
  const dot = (p, r) => {
    ctx.beginPath();
    ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
    ctx.fill();
  };

  ctx.strokeStyle = color;
  ctx.lineWidth = thick;
  ctx.lineCap = 'round';
  for (const [a, b] of BONES) {
    if (okPt(landmarks[a]) && okPt(landmarks[b])) line(pt(a), pt(b));
  }

  // Minimalist head: neck from shoulder midpoint to headAnchor (ear midpoint lerped 0.25 toward nose),
  // plus ear-to-nose lines (or ear-to-ear when nose is hidden).
  const earPts = [7, 8].filter(seen).map(pt);
  const earMid = earPts.length === 2 ? [(earPts[0][0] + earPts[1][0]) / 2, (earPts[0][1] + earPts[1][1]) / 2] : (earPts[0] ?? null);
  const nosePt = seen(0) ? pt(0) : null;
  const headAnchor = earMid && nosePt
    ? [earMid[0] + (nosePt[0] - earMid[0]) * 0.25, earMid[1] + (nosePt[1] - earMid[1]) * 0.25]
    : (earMid ?? nosePt);
  if (headAnchor && okPt(landmarks[11]) && okPt(landmarks[12])) {
    const s11 = pt(11);
    const s12 = pt(12);
    line([(s11[0] + s12[0]) / 2, (s11[1] + s12[1]) / 2], headAnchor);
  }
  ctx.lineWidth = Math.max(1.5, thick * 0.75);
  if (seen(7) && nosePt) line(pt(7), nosePt);
  if (seen(8) && nosePt) line(pt(8), nosePt);
  if (seen(7) && seen(8) && !nosePt) line(pt(7), pt(8));

  // Optional 2x21 hand skeletons.
  const drawnHands = { left: false, right: false };
  if (handLandmarks) {
    ctx.lineWidth = Math.max(1.2, thick * 0.55);
    for (const side of ['left', 'right']) {
      const hand = handLandmarks[side];
      if (!Array.isArray(hand) || hand.length !== 21 || !okPt(hand[0])) continue;
      for (const [a, b] of HAND_BONES) {
        if (okPt(hand[a]) && okPt(hand[b])) {
          line([hand[a].x * width, hand[a].y * height], [hand[b].x * width, hand[b].y * height]);
        }
      }
      drawnHands[side] = true;
    }
  }

  ctx.fillStyle = 'white';
  for (let i = 11; i < 33; i++) {
    if (!okPt(landmarks[i])) continue;
    if ((drawnHands.left && COARSE_HAND_POINTS.left.has(i)) || (drawnHands.right && COARSE_HAND_POINTS.right.has(i))) continue;
    dot(pt(i), thick + 1);
  }
  if (nosePt) dot(nosePt, thick + 0.5);
  const earR = Math.max(2, thick * 0.8);
  if (seen(7)) dot(pt(7), earR);
  if (seen(8)) dot(pt(8), earR);
  if (handLandmarks) {
    const handR = Math.max(1.5, thick * 0.6);
    for (const side of ['left', 'right']) {
      if (!drawnHands[side]) continue;
      for (const p of handLandmarks[side]) {
        if (okPt(p)) dot([p.x * width, p.y * height], handR);
      }
    }
  }
}
