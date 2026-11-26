// Public API of data/live for the web app: live camera -> MediaPipe pose every frame -> PoseClip.
// The same PoseClip that data/extract.py makes from an uploaded video, with source "camera".
import { FilesetResolver, HandLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision';
import { createBoneGuard } from './bones.js';
import { createFacingGuard } from './facing.js';
import { PoseFilter } from './oneeuro.js';
import { buildPoseClip, cameraTranslation, isSeen } from './poseclip.js';

export { buildPoseClip, cameraTranslation } from './poseclip.js';
export { PoseFilter } from './oneeuro.js';
export { createFacingGuard } from './facing.js';
export { createBoneGuard } from './bones.js';
export { drawSkeleton } from './draw.js';
export { SERVER_GIST, checkApi, findApiUrl, publishedApiUrl, resolveApiUrl } from './api.js';
export { UploadError, chooseSubject, fetchClip, firstFrameUrl, sendClip, trainClip, uploadVideo, watchJob, watchTraining } from './upload.js';
export { IMAGE_FPS, PHONE_SILENCE_S, closePhoneSession, createImageGrabber, createPhoneCapture, createPhoneSender, openPhoneSession, phonePageUrl } from './relay.js';

// The WASM runtime and the models come from their official hosts, pinned to the package version
// in package.json, so the web build does not have to copy them.
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm';
const MODEL_URL = (variant) =>
  `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_${variant}/float16/latest/pose_landmarker_${variant}.task`;

const HAND_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';
// A hand found by the hand model belongs to the pose's wrist nearest to its own wrist, if within
// this share of the image's height (~18 cm at 2 m from a laptop webcam). Not by its handedness
// label: on a selfie camera it is reversed and sometimes jumps (docs/investigacion/2026-10-24-manos-y-dedos-en-vivo.md).
// Raised from 0.08 to 0.20 in v2 because during fast waving (saludar-02) the body's wrist lags the
// hand detector by up to 0.18 of the frame height (data/capture2/to_poseclip.py).
const HAND_TO_WRIST = 0.20;
// The hand model costs ~11 ms a frame, as much as the pose. While it finds a hand it runs every
// frame; with none in the last HAND_RECENT_S (the person is far, or the hands are down) it only
// looks every HAND_PROBE_EVERY frames, so a person stepping close is picked up within ~0.2 s at
// 30 fps and one standing far pays a sixth of it.
const HAND_RECENT_S = 1;
const HAND_PROBE_EVERY = 6;
// In v2, while tracking a visible hand, run every frame (1) on desktop so fast finger counting or
// waving has zero frame-skip lag.
const HAND_TRACK_EVERY = 1;
// Per-frame costs for timing() are averaged with this weight per frame (~1 s at 30 fps).
const TIMING_WEIGHT = 1 / 30;

// "full" keeps 30 fps on a laptop GPU and is clearly steadier than "lite" on legs; phones should
// pass "lite" (half the work). "heavy" is for offline video only (data/lift.py).
const DEFAULT_MODEL = 'full';

// 1280x720 is enough for a full body a few meters away; asking for more only slows the model.
// 60 frames per second where the camera has them: the 'full' model takes ~11 ms a frame on an M2
// (docs/investigacion/2026-10-24-manos-y-dedos-en-vivo.md), so the camera's 30 was the limit, and
// a fast arm moves half as far between two frames. A camera without 60 gives its best.
const CAMERA = { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 60 } };

export class CameraError extends Error {}

/**
 * @param video  a <video> element; the module puts the camera stream in it (muted, inline)
 * @param options.model       'full' (default) or 'lite'
 * @param options.facingMode  'user' (default, the webcam or a phone's front camera) or
 *   'environment' (a phone's back camera, to film someone else: the phone-as-camera page)
 * @param options.stream      a MediaStream to use instead of the camera (e.g. a video file's
 *   captureStream(), for tests and demos without a webcam)
 * @param options.smooth      true (default): every point goes through a causal One Euro filter
 *   (src/oneeuro.js) before onPose and the recording, so the robot copying the person does not shake
 *   with MediaPipe's per-frame noise. false gives MediaPipe's raw output.
 * @param options.hands       true: also run MediaPipe's hand model (7.8 MB more, ~11 ms a frame on
 *   an M2), so the robot's palms and fingers follow the person's. It finds hands with the person
 *   ~1-1.5 m from the camera (whole body in frame, the hands are ~30 px and it rarely does), and
 *   runs on its own: every frame while it sees a hand, now and then while it does not.
 * @param options.onProgress  ({ stage: 'model' | 'camera', done: boolean }) while loading
 * @param options.onPose      ({ landmarks, world, visible, t }) every processed frame: `landmarks`
 *   are 33 points normalized to the video (for drawSkeleton), `world` 33 points in meters
 *   (hip-centered, MediaPipe axes), `visible` false when no body or the upper body (shoulders, elbows, wrists) is too occluded, `camera` where
 *   the hips are from the camera ([x, y, z] m, MediaPipe camera axes; cameraTranslation) or null;
 *   `hands` ({ left, right }: the person's hands, 21 world points each in meters around the hand's
 *   center, MediaPipe axes, or null) only with options.hands; `handLandmarks` ({ left, right }:
 *   21 normalized 2D landmarks per detected hand, or null) when options.hands is active; null if no body.
 * @returns { startRecording, stopRecording, isRecording, fps, timing, setHands, stop }
 */
export async function createLiveCapture(video, { model = DEFAULT_MODEL, facingMode = 'user', stream, constraints, maxFps = 0, smooth = true, hands = false, onProgress, onPose } = {}) {
  // Request camera permission IMMEDIATELY on user gesture before downloading MediaPipe WASM/models
  // so mobile/desktop permission prompts appear instantly and the live video preview shows while
  // the models load in parallel.
  onProgress?.({ stage: 'camera', done: false });
  if (!stream && !navigator.mediaDevices?.getUserMedia) {
    throw new CameraError('El navegador no deja usar la cámara en esta dirección: hace falta abrir la página por HTTPS.');
  }
  const videoConstraints = { ...(constraints ?? CAMERA), facingMode };
  let activeStream = stream;
  try {
    activeStream ??= await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
  } catch (e) {
    const denied = e?.name === 'NotAllowedError' || e?.name === 'SecurityError';
    throw new CameraError(
      denied
        ? 'Sin permiso para usar la cámara. Actívalo en la barra de direcciones del navegador y vuelve a intentar.'
        : 'No se encontró una cámara disponible.',
    );
  }
  video.srcObject = activeStream;
  video.muted = true;
  video.playsInline = true;
  await video.play();
  onProgress?.({ stage: 'camera', done: true });

  onProgress?.({ stage: 'model', done: false });
  let vision;
  let landmarker;
  let handLandmarker = null;
  try {
    vision = await FilesetResolver.forVisionTasks(WASM_URL);
    [landmarker, handLandmarker] = await Promise.all([
      PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL(model), delegate: 'GPU' },
        runningMode: 'VIDEO',
        numPoses: 1,
      }),
      hands
        ? HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 2,
        })
        : Promise.resolve(null),
    ]);
  } catch (e) {
    if (!stream) activeStream.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
    throw e;
  }
  onProgress?.({ stage: 'model', done: true });
  stream = activeStream;
  const minFrameMs = maxFps > 0 ? 1000 / maxFps : 0;
  let lastInferAt = -Infinity;

  let samples = null; // non-null while recording
  let recordStart = 0;
  let lastVideoTime = -1;
  let frameId = 0;
  let running = true;
  let handsDesired = Boolean(hands);
  let handLoading = null;
  let handSeenAt = -Infinity; // when the hand model last found a hand (s)
  let handFrame = 0;
  let lastHands; // the hand model's last answer, reused on the frames it skips while tracking
  const cost = { pose: 0, hands: 0, handRuns: 0 }; // running averages for timing()
  const costRuns = { pose: 0, hands: 0, handRuns: 0 };
  // A plain mean over the first runs, so the average does not start from 0 and creep up.
  const average = (key, value) => (cost[key] += (value - cost[key]) * Math.max(TIMING_WEIGHT, 1 / ++costRuns[key]));
  const times = []; // when each of the last frames was processed, for fps()
  const filter = new PoseFilter();
  const facing = createFacingGuard(); // MediaPipe's mirrored reads of a back, put right (facing.js)
  const bones = createBoneGuard(); // arms squashed in depth, given their length back (bones.js)

  function frame() {
    if (!running) return;
    // Only new camera frames, throttled cleanly when maxFps is set (e.g. mobile capture).
    const now = performance.now();
    if (video.readyState >= 2 && video.currentTime !== lastVideoTime && now - lastInferAt >= minFrameMs) {
      lastVideoTime = video.currentTime;
      lastInferAt = now;
      times.push(now);
      while (times[0] < now - 1000) times.shift();
      const res = landmarker.detectForVideo(video, now);
      average('pose', performance.now() - now);
      let landmarks = res.landmarks[0];
      let world = res.worldLandmarks[0];
      if (!landmarks || !world) {
        filter.reset(); // the body was lost: the next one starts fresh, not from where this one left
        facing.reset();
        bones.reset();
        onPose?.(null);
        samples?.push({ t: (now - recordStart) / 1000, valid: false });
      } else {
        // Before the filter, so it never blends a mirrored frame into the right ones.
        ({ world, landmarks } = facing.fix(world, landmarks, now / 1000));
        // After the facing guard (a mirrored frame would teach it the wrong arm), before the filter.
        ({ world } = bones.fix(world, now / 1000));
        if (smooth) [world, landmarks] = smoothed(filter, now / 1000, world, landmarks);
        const vis = landmarks.map((p) => p.visibility ?? 0);
        const visible = isSeen((i) => vis[i]);
        const w = video.videoWidth;
        const h = video.videoHeight;
        let matchedHands;
        if (handsDesired && handLandmarker) {
          const tracking = now / 1000 - handSeenAt < HAND_RECENT_S;
          const run = handFrame++ % (tracking ? HAND_TRACK_EVERY : HAND_PROBE_EVERY) === 0;
          if (run) {
            const start = performance.now();
            matchedHands = matchHands(handLandmarker.detectForVideo(video, now), landmarks, w / h);
            average('hands', performance.now() - start);
            if (matchedHands.world.left || matchedHands.world.right || matchedHands.image.left || matchedHands.image.right) {
              handSeenAt = now / 1000;
            }
            lastHands = matchedHands;
          } else if (tracking) {
            matchedHands = lastHands;
          }
          average('handRuns', run ? 1 : 0);
        }
        const handsSeen = matchedHands?.world;
        const handLandmarksSeen =
          matchedHands?.image && (matchedHands.image.left || matchedHands.image.right) ? matchedHands.image : null;
        onPose?.({
          landmarks,
          world,
          visible,
          t: now / 1000,
          camera: cameraTranslation(world, landmarks, w, h),
          hands: handsSeen,
          handLandmarks: handLandmarksSeen,
        });
        samples?.push({
          t: (now - recordStart) / 1000,
          world: world.map((p) => [p.x, p.y, p.z]),
          image: landmarks.map((p, i) => [p.x * w, p.y * h, vis[i]]),
          hands:
            handsSeen && (handsSeen.left || handsSeen.right)
              ? {
                  left: handsSeen.left?.map((p) => [p.x, p.y, p.z]) ?? null,
                  right: handsSeen.right?.map((p) => [p.x, p.y, p.z]) ?? null,
                }
              : null,
          valid: visible,
        });
      }
    }
    frameId = requestAnimationFrame(frame);
  }
  frameId = requestAnimationFrame(frame);

  return {
    startRecording() {
      samples = [];
      recordStart = performance.now();
    },
    /** Ends the recording and returns its PoseClip; throws if the body was barely seen. */
    stopRecording() {
      const recorded = samples ?? [];
      samples = null;
      return buildPoseClip(recorded, { width: video.videoWidth, height: video.videoHeight });
    },
    isRecording: () => samples !== null,
    /**
     * Frames processed in the last second. The trajectory comes from following the planted foot
     * frame to frame, so under ~20 fps (a slow phone, a hidden tab) it loses steps: show a warning.
     */
    fps: () => times.length,
    /**
     * What a frame costs on the main thread, averaged over about a second: { pose, hands } in ms
     * per run of each model, and handShare, the share of frames the hand model ran on.
     */
    timing: () => ({ pose: cost.pose, hands: cost.hands, handShare: cost.handRuns }),
    /** Enables or disables the 21-point hand model on the running capture without restarting the camera. */
    async setHands(enabled) {
      handsDesired = Boolean(enabled);
      if (!handsDesired) {
        handSeenAt = -Infinity;
        handFrame = 0;
        lastHands = undefined;
        if (handLandmarker) {
          handLandmarker.close();
          handLandmarker = null;
        }
        return false;
      }
      if (!running) return false;
      if (handLandmarker) return true;
      if (!handLoading) {
        handLoading = HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 2,
        }).then(
          (created) => {
            handLoading = null;
            if (!running || !handsDesired) {
              created.close();
              return false;
            }
            handLandmarker = created;
            return true;
          },
          (error) => {
            handLoading = null;
            if (!handLandmarker) handsDesired = false;
            throw error;
          },
        );
      }
      return handLoading;
    },
    /** Turns the camera off and frees the model. */
    stop() {
      running = false;
      handsDesired = false;
      cancelAnimationFrame(frameId);
      stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
      landmarker.close();
      handLandmarker?.close();
      handLandmarker = null;
    },
  };
}

/**
 * The hand model's hands given to the pose's wrists: `{ world: { left, right }, image: { left, right } }`
 * of the person, each the hand's 21 points or null. Each hand goes to its nearest wrist only (two
 * hands together in a clap stay apart), the closest one when two compete. `aspect` (width / height)
 * makes image distances square.
 */
export function matchHands(result, landmarks, aspect) {
  const world = { left: null, right: null };
  const image = { left: null, right: null };
  if (!result?.landmarks?.length || !landmarks || !(Number.isFinite(aspect) && aspect > 0)) {
    return { world, image };
  }
  const best = { left: HAND_TO_WRIST, right: HAND_TO_WRIST };
  result.landmarks.forEach((hand, i) => {
    if (!hand?.[0] || !Number.isFinite(hand[0].x) || !Number.isFinite(hand[0].y)) return;
    const candidates = [['left', 15], ['right', 16]].filter(
      ([, wrist]) => Number.isFinite(landmarks[wrist]?.x) && Number.isFinite(landmarks[wrist]?.y),
    );
    if (!candidates.length) return;
    const near = candidates
      .map(([side, wrist]) => ({
        side,
        d: Math.hypot((hand[0].x - landmarks[wrist].x) * aspect, hand[0].y - landmarks[wrist].y),
      }))
      .filter((c) => Number.isFinite(c.d))
      .sort((a, b) => a.d - b.d)[0];
    if (near && near.d < best[near.side]) {
      best[near.side] = near.d;
      world[near.side] = result.worldLandmarks?.[i] ?? null;
      image[near.side] = hand;
    }
  });
  return { world, image };
}

/** The frame's points through the One Euro filter, in MediaPipe's own shape ({ x, y, z, visibility }). */
function smoothed(filter, t, world, landmarks) {
  const out = filter.filter(
    t,
    world.map((p) => [p.x, p.y, p.z]),
    landmarks.map((p) => [p.x, p.y, p.z]),
  );
  return [
    out.world.map(([x, y, z], i) => ({ ...world[i], x, y, z })),
    out.image.map(([x, y, z], i) => ({ ...landmarks[i], x, y, z })),
  ];
}

/**
 * Browser-local video -> PoseClip extraction (zero server / Mac tunnel dependency).
 * Seeks deterministically through a local <video> file at `fps` (default 25 Hz), runs MediaPipe
 * PoseLandmarker (and optional HandLandmarker), applies the same facing/bone guards + One Euro
 * filter as live capture, and builds a contract-valid PoseClip.
 */
export async function extractPoseClipFromVideo(file, { model = DEFAULT_MODEL, hands = false, fps = 25, signal, onProgress } = {}) {
  const throwIfAborted = () => {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  };
  throwIfAborted();

  onProgress?.({ stage: 'model', progress: 0 });
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  throwIfAborted();
  const [landmarker, handLandmarker] = await Promise.all([
    PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL(model), delegate: 'GPU' },
      runningMode: 'VIDEO',
      numPoses: 1,
    }),
    hands
      ? HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 2,
      })
      : Promise.resolve(null),
  ]);

  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  const objectUrl = URL.createObjectURL(file);

  try {
    throwIfAborted();
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Could not decode video in browser.'));
      video.src = objectUrl;
    });

    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!duration || !w || !h) throw new Error('Video has no playable frames.');

    const step = 1 / fps;
    const totalFrames = Math.max(2, Math.floor(duration * fps));
    const filter = new PoseFilter();
    const facing = createFacingGuard();
    const bones = createBoneGuard();
    const samples = [];

    const seekTo = (time) => new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
      const onSeeked = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error('Video seek failed.'));
      };
      const onAbort = () => {
        cleanup();
        reject(new DOMException('Aborted', 'AbortError'));
      };
      const cleanup = () => {
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
        signal?.removeEventListener('abort', onAbort);
      };
      video.addEventListener('seeked', onSeeked, { once: true });
      video.addEventListener('error', onError, { once: true });
      signal?.addEventListener('abort', onAbort, { once: true });
      video.currentTime = Math.min(time, Math.max(0, duration - 0.001));
    });

    for (let i = 0; i < totalFrames; i++) {
      throwIfAborted();
      const t = i * step;
      await seekTo(t);
      throwIfAborted();
      const tsMs = Math.max(1, Math.round(t * 1000) + i);
      const res = landmarker.detectForVideo(video, tsMs);
      let landmarks = res.landmarks[0];
      let world = res.worldLandmarks[0];
      if (!landmarks || !world) {
        filter.reset();
        facing.reset();
        bones.reset();
        samples.push({ t, valid: false });
      } else {
        ({ world, landmarks } = facing.fix(world, landmarks, t));
        ({ world } = bones.fix(world, t));
        [world, landmarks] = smoothed(filter, t, world, landmarks);
        const vis = landmarks.map((p) => p.visibility ?? 0);
        const visible = isSeen((k) => vis[k]);
        let handsSeen = null;
        if (handLandmarker) {
          handsSeen = matchHands(handLandmarker.detectForVideo(video, tsMs), landmarks, w / h).world;
        }
        samples.push({
          t,
          world: world.map((p) => [p.x, p.y, p.z]),
          image: landmarks.map((p, k) => [p.x * w, p.y * h, vis[k]]),
          hands:
            handsSeen && (handsSeen.left || handsSeen.right)
              ? {
                  left: handsSeen.left?.map((p) => [p.x, p.y, p.z]) ?? null,
                  right: handsSeen.right?.map((p) => [p.x, p.y, p.z]) ?? null,
                }
              : null,
          valid: visible,
        });
      }
      onProgress?.({ stage: 'extract', progress: (i + 1) / totalFrames });
    }

    return buildPoseClip(samples, { width: w, height: h });
  } finally {
    URL.revokeObjectURL(objectUrl);
    video.removeAttribute('src');
    video.load();
    landmarker.close();
    handLandmarker?.close();
  }
}
