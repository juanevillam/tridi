// The person's pane, for a clip whose source video is in the repo: the recording the robot learned
// from, with its skeleton drawn over it in the signal lime (the 2D points MediaPipe found in each frame,
// scripts/make-video-overlay.py). Clips without a video keep the 3D skeleton (skeleton.js).
const BASE = import.meta.env.BASE_URL;

export const resolveAsset = (p) => (!p ? null : p.startsWith('/') ? p : `${BASE}${p}`);

// Clip id -> its source video and optional 2D skeleton (public/media).
export const VIDEOS = {
  'clip_2026-10-23_caminar-perfil_01': { video: '/media/caminar.mp4', pose: '/media/caminar.pose2d.json', credit: 'Mixkit 4855' },
  'clip_caminar-perfil-gvhmr': { video: '/media/clips/clip_caminar-perfil-gvhmr.mp4', pip: true },
  'clip_correr-perfil-gvhmr': { video: '/media/clips/clip_correr-perfil-gvhmr.mp4', pip: true },
  'clip_frente-04-gvhmr': { video: '/media/clips/clip_frente-04-gvhmr.mp4', pip: true },
  'clip_jacks-01-gvhmr': { video: '/media/clips/clip_jacks-01-gvhmr.mp4', pip: true },
  'clip_bailar-01-gvhmr': { video: '/media/clips/clip_bailar-01-gvhmr.mp4', pip: true },
  'clip_sentarse-02-gvhmr': { video: '/media/clips/clip_sentarse-02-gvhmr.mp4', pip: true },
  'clip_caminar-01-gvhmr': { video: '/media/clips/clip_caminar-01-gvhmr.mp4', pip: true },
  'clip_bailar-grupo-02-gvhmr': { video: '/media/clips/clip_bailar-grupo-02-gvhmr.mp4', pip: true },
  'clip_saludar-02-gvhmr': { video: '/media/clips/clip_saludar-02-gvhmr.mp4', pip: true },
  'clip_dedos-01-gvhmr': { video: '/media/clips/clip_dedos-01-gvhmr.mp4', pip: true },
  'clip_lavar-04-gvhmr': { video: '/media/clips/clip_lavar-04-gvhmr.mp4', pip: true },
};

// The bones to draw, as MediaPipe Pose indices: shoulders, arms, torso, hips, legs and feet.
const BONES = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [27, 29], [29, 31], [27, 31], [24, 26], [26, 28], [28, 30], [30, 32], [28, 32],
];
// Local copy (avoid importing 'tridi-live' which pulls @mediapipe/tasks-vision into landing initial bundle).
const HAND_BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [0, 9], [9, 10], [10, 11], [11, 12], // middle
  [0, 13], [13, 14], [14, 15], [15, 16], // ring
  [0, 17], [17, 18], [18, 19], [19, 20], // pinky
  [5, 9], [9, 13], [13, 17], // knuckles
];
const COARSE_HAND_POINTS = { left: new Set([17, 19, 21]), right: new Set([18, 20, 22]) };
const MIN_VISIBILITY = 0.5; // as data/live's drawSkeleton and MediaPipe's own drawing
const SIGNAL = '#c8ff2e'; // the brand's signal color, as the 3D skeleton

/**
 * The 2D skeleton drawn over a video, frame by frame: on the frame nearest to `time` of the pose file
 * (scripts/make-video-overlay.py), placed the way CSS fits the video in its box.
 * @param fit  'contain' (the whole picture, bars around it) or 'cover' (it fills the box, cropped)
 * @returns {{ load(url): Promise<void>, draw(time): void, clear(): void, ready(): boolean, duration(): number }}
 */
export function createPoseDrawing(video, canvas, { fit = 'contain' } = {}) {
  const ctx = canvas.getContext('2d');
  let pose = null; // { fps, points, frames }
  let index = null; // MediaPipe index -> position in a frame's list
  let loadToken = 0;

  // The video's picture inside the canvas's box, as object-fit places it.
  function frameRect() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const ratio = video.videoWidth / video.videoHeight || 16 / 9;
    const fitW = fit === 'cover' ? Math.max(w, h * ratio) : Math.min(w, h * ratio);
    const fitH = fitW / ratio;
    return { x: (w - fitW) / 2, y: (h - fitH) / 2, w: fitW, h: fitH };
  }

  function clear() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function draw(time) {
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(canvas.clientWidth * dpr) || canvas.height !== Math.round(canvas.clientHeight * dpr)) {
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
    }
    clear();
    if (!pose) return;
    const frameIdx = Math.min(pose.frames.length - 1, Math.max(0, Math.round(time * pose.fps)));
    const frame = pose.frames[frameIdx];
    if (!frame) return;
    const handFrame = pose.hands?.[frameIdx] ?? null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = frameRect();
    const at = (p) => {
      const idx = index.get(p);
      return idx !== undefined ? frame[idx] : undefined;
    };
    const seen = (p) => {
      const q = at(p);
      return Boolean(q && Number.isFinite(q[0]) && Number.isFinite(q[1]) && (q[2] ?? 1) >= MIN_VISIBILITY);
    };
    const xy = (p) => [r.x + at(p)[0] * r.w, r.y + at(p)[1] * r.h];
    const okHandPt = (pt) =>
      Array.isArray(pt) && pt.length >= 2 && Number.isFinite(pt[0]) && Number.isFinite(pt[1]) && (pt[2] ?? 1) >= MIN_VISIBILITY;
    const handXY = (pt) => [r.x + pt[0] * r.w, r.y + pt[1] * r.h];
    const line = (a, b) => {
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    };
    const dot = (p, radius) => {
      ctx.beginPath();
      ctx.arc(p[0], p[1], radius, 0, 2 * Math.PI);
      ctx.fill();
    };

    const baseWidth = Math.max(2.5, r.h / 160);
    ctx.strokeStyle = SIGNAL;
    ctx.lineWidth = baseWidth;
    ctx.lineCap = 'round';
    for (const [a, b] of BONES) {
      if (!seen(a) || !seen(b)) continue;
      line(xy(a), xy(b));
    }

    // Minimalist head (0 nose + 7, 8 ears), degrading cleanly if a legacy JSON omits 7, 8.
    const earPts = [7, 8].filter(seen).map(xy);
    const earMid = earPts.length === 2 ? [(earPts[0][0] + earPts[1][0]) / 2, (earPts[0][1] + earPts[1][1]) / 2] : (earPts[0] ?? null);
    const nosePt = seen(0) ? xy(0) : null;
    const headAnchor = earMid && nosePt
      ? [earMid[0] + (nosePt[0] - earMid[0]) * 0.25, earMid[1] + (nosePt[1] - earMid[1]) * 0.25]
      : (earMid ?? nosePt);
    if (headAnchor && seen(11) && seen(12)) {
      const s11 = xy(11);
      const s12 = xy(12);
      line([(s11[0] + s12[0]) / 2, (s11[1] + s12[1]) / 2], headAnchor);
    }
    ctx.lineWidth = Math.max(1.5, baseWidth * 0.75);
    if (seen(7) && nosePt) line(xy(7), nosePt);
    if (seen(8) && nosePt) line(xy(8), nosePt);
    if (seen(7) && seen(8) && !nosePt) line(xy(7), xy(8));

    // Optional 2x21 hand skeletons.
    const drawnHands = { left: false, right: false };
    if (handFrame) {
      ctx.lineWidth = Math.max(1.2, baseWidth * 0.55);
      for (const side of ['left', 'right']) {
        const hand = handFrame[side];
        if (!Array.isArray(hand) || hand.length !== 21 || !okHandPt(hand[0])) continue;
        for (const [a, b] of HAND_BONES) {
          if (okHandPt(hand[a]) && okHandPt(hand[b])) line(handXY(hand[a]), handXY(hand[b]));
        }
        drawnHands[side] = true;
      }
    }

    ctx.fillStyle = '#ffffff';
    if (nosePt) dot(nosePt, baseWidth * 0.9);
    const earR = Math.max(2, baseWidth * 0.75);
    if (seen(7)) dot(xy(7), earR);
    if (seen(8)) dot(xy(8), earR);
    for (const p of pose.points) {
      if (p < 11 || !seen(p)) continue;
      if ((drawnHands.left && COARSE_HAND_POINTS.left.has(p)) || (drawnHands.right && COARSE_HAND_POINTS.right.has(p))) continue;
      dot(xy(p), baseWidth * 0.9);
    }
    if (handFrame) {
      const handR = Math.max(1.5, baseWidth * 0.5);
      for (const side of ['left', 'right']) {
        if (!drawnHands[side]) continue;
        for (const p of handFrame[side]) {
          if (okHandPt(p)) dot(handXY(p), handR);
        }
      }
    }
  }

  return {
    async load(url) {
      const token = ++loadToken;
      pose = null;
      index = null;
      clear();
      if (!url) return;
      const res = await fetch(url);
      if (token !== loadToken) return;
      const next = await res.json();
      if (token !== loadToken) return;
      pose = next;
      index = new Map(pose.points.map((p, i) => [p, i]));
    },
    draw,
    clear,
    ready: () => Boolean(pose),
    duration: () => (pose ? pose.frames.length / pose.fps : 0),
  };
}

/**
 * @param pane  the person's pane; a <video> and a <canvas> are added to it
 * @returns {{ show(clipId): Promise<boolean>, sync(time, playing, speed): void, dispose(): void }}
 */
export function createVideoOverlay(pane) {
  const pipWrap = Object.assign(document.createElement('div'), { className: 'source-pip-wrap', hidden: true });
  const pipTag = Object.assign(document.createElement('span'), { className: 'source-pip-tag' });
  const expandLabel = '<span class="t" lang="es">Clic para ampliar</span><span class="t" lang="en">Click to expand</span>';
  const minimizeLabel = '<span class="t" lang="es">Clic para minimizar</span><span class="t" lang="en">Click to minimize</span>';
  pipTag.innerHTML = expandLabel;
  const video = Object.assign(document.createElement('video'), { muted: true, playsInline: true, loop: true, preload: 'metadata' });
  video.className = 'source-video';
  const canvas = Object.assign(document.createElement('canvas'), { className: 'source-overlay' });
  pipWrap.append(video, pipTag);
  pipWrap.onclick = () => {
    if (!pane.classList.contains('has-pip-video')) return;
    const expanded = pane.classList.toggle('pip-expanded');
    pipTag.innerHTML = expanded ? minimizeLabel : expandLabel;
  };
  pane.prepend(pipWrap, canvas);
  const drawing = createPoseDrawing(video, canvas, { fit: 'contain' });
  let activeEntry = null;

  async function show(clipId) {
    const entry = VIDEOS[clipId] ?? null;
    activeEntry = entry;
    const isFull = Boolean(entry && !entry.pip);
    const isPip = Boolean(entry && entry.pip);
    pane.classList.toggle('has-video', isFull);
    pane.classList.toggle('has-pip-video', isPip);
    pane.classList.remove('pip-expanded');
    pipWrap.hidden = !entry;
    if (isPip) {
      pipTag.innerHTML = expandLabel;
    }
    if (!entry) {
      await drawing.load(null); // no bones of the previous clip
      video.removeAttribute('src');
      video.load();
      return false;
    }
    video.src = resolveAsset(entry.video);
    await drawing.load(entry.pose ? resolveAsset(entry.pose) : null);
    return true;
  }

  /**
   * Keeps the video on the stage's clock: it plays on its own and is only nudged when it drifts
   * more than a few frames, so playback stays smooth. Call every animation frame.
   */
  function sync(time, playing, speed) {
    if (!activeEntry) return;
    const duration = video.duration || drawing.duration();
    const target = duration ? time % duration : time;
    if (Number.isFinite(target) && Math.abs(video.currentTime - target) > 0.18) {
      try {
        video.currentTime = target;
      } catch {}
    }
    video.playbackRate = speed;
    if (playing && video.paused) video.play().catch(() => {});
    if (!playing && !video.paused) video.pause();
    if (drawing.ready()) drawing.draw(video.currentTime);
  }

  return {
    show,
    sync,
    dispose() {
      video.pause();
      pipWrap.remove();
      canvas.remove();
    },
  };
}
