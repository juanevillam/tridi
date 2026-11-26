// Entrena a Tridi en vivo (#/live): full-viewport 2-pane stage (camera + G1) with a single
// centered Liquid Glass floating dock driven by a strict 1-state machine:
//   idle -> connecting -> live -> saved
// Zero stacked banners or stale warnings. Automatically enters calm Upper-Body Mode on laptops
// when hips/knees/ankles are out of frame.
import { appHeaderHTML, mountAppHeader } from '../header.js';
import { addUserClip } from '../preloaded.js';
import { mountRobotPane, robotPaneHTML } from '../robot-pane.js';
import { escapeHtml } from '../i18n.js';
import { A, L, T } from './strings/live.js';

const tl = (key, value, language) => L(key, { time: value, n: value }, language);

export { title } from './strings/live.js';

// Phones run MediaPipe's "lite" model: half the work, as data/live recommends.
const SMALL_SCREEN = matchMedia('(max-width: 720px), (pointer: coarse)').matches;
const MIN_FPS = 18;
const WARMUP_MS = 3000;
const MAX_RECORD_S = 30;
const MIN_RECORD_S = 2;
const PHONE_WEB = ['localhost', '127.0.0.1'].includes(location.hostname) ? 'https://trytridi.com/' : `${location.origin}/`;
const LOCAL_API = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/;
const FOLLOW_S = 0.5;
const LIVE_PIXEL_RATIO = 1.25;
const LIVE_SHADOW_PX = 1024;
const DEBUG = new URLSearchParams(location.search).has('debug');

const FIX_NAMES = {
  'mirrored arm': 'brazo oculto espejado',
  legs: 'piernas abiertas',
  'left arm': 'brazo izq. abierto',
  'right arm': 'brazo der. abierto',
  'left arm on chest': 'brazo izq. frente al pecho',
  'right arm on chest': 'brazo der. frente al pecho',
  hands: 'manos separadas',
};

const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

export function mount(root, { api }) {
  root.innerHTML = `
    <section class="page live" data-state="idle">
      ${appHeaderHTML({ current: 'live' })}
      <div class="live-stage">
        <div class="live-grid">
          <section class="pane camera-pane">
            <video playsinline muted></video>
            <img class="phone-image" alt="" hidden>
            <canvas class="camera-overlay"></canvas>
            <div class="camera-off">
              <ol class="steps">
                <li>${T('step1')}</li>
                <li>${T('step2')}</li>
                <li>${T('step3')}</li>
              </ol>
            </div>
            <div class="phone-qr" hidden>
              <div class="qr"></div>
              <p>${T('scan')}</p>
            </div>
            <p class="pane-label camera-label">${T('you')}</p>
          </section>
          ${robotPaneHTML(T('robot'), { push: false })}
        </div>

        <div class="live-dock" role="region" ${A({ 'aria-label': 'head' })}>
          <div class="live-dock-row" data-for="idle">
            <button class="primary camera-toggle" type="button">${T('cameraOn')}</button>
            <button class="phone-toggle" type="button">${T('phone')}</button>
            <button class="live-lock-btn" type="button" aria-pressed="true">${T('lockView')}</button>
          </div>

          <div class="live-dock-row" data-for="connecting">
            <span class="live-chip live-connecting-text" aria-live="polite">${T('preparing')}</span>
            <button class="live-cancel" type="button">${T('cancel')}</button>
          </div>

          <div class="live-dock-row" data-for="live">
            <span class="recording"><span class="rec-dot"></span><span class="rec-time">0:00</span><span class="rec-max"> / ${clock(MAX_RECORD_S)}</span></span>
            <span class="live-chip live-mode-chip" aria-live="polite">${T('upperBody')}</span>
            <button class="live-lock-btn" type="button" aria-pressed="true">${T('lockView')}</button>
            <button class="primary record-toggle" type="button">${T('stopSave')}</button>
            <button class="icon-btn live-stop-cam" type="button" ${A({ 'aria-label': 'discard', title: 'discard' })}>×</button>
          </div>

          <div class="live-dock-row" data-for="saved">
            <span class="saved-text"></span>
            <a class="button primary see-clip" href="/simulations">${T('seeSim')}</a>
            <button class="again" type="button">${T('again')}</button>
          </div>
        </div>

        <p class="live-toast" role="status" hidden></p>
        <p class="live-debug" ${DEBUG ? '' : 'hidden'}></p>
      </div>
    </section>`;

  const $ = (selector) => root.querySelector(selector);
  const page = $('.live');
  const video = $('video');
  const phoneImage = $('.phone-image');
  const overlay = $('.camera-overlay');
  const ctx = overlay.getContext('2d');
  const startBtn = $('.camera-toggle');
  const phoneBtn = $('.phone-toggle');
  const cancelBtn = $('.live-cancel');
  const stopCamBtn = $('.live-stop-cam');
  const modeChip = $('.live-mode-chip');
  const connectingText = $('.live-connecting-text');
  const toastEl = $('.live-toast');

  let state = 'idle'; // 'idle' | 'connecting' | 'live' | 'saved'
  let toastTimer = 0;

  function showToast(markup, isError = false, autoHideMs = 0) {
    clearTimeout(toastTimer);
    if (!markup) {
      toastEl.hidden = true;
      toastEl.classList.remove('error');
      return;
    }
    toastEl.innerHTML = markup;
    toastEl.classList.toggle('error', isError);
    toastEl.hidden = false;
    if (autoHideMs > 0) {
      toastTimer = setTimeout(() => {
        if (!disposed) toastEl.hidden = true;
      }, autoHideMs);
    }
  }

  function setState(next) {
    state = next;
    page.dataset.state = next;
    if (next !== 'live') showToast('');
  }

  let live = null;
  const isPhone = () => live?.source === 'phone';
  let startedAt = 0;
  let lastReport = 0;
  let disposed = false;
  let connectingAborted = false;
  let returnToWebcam = false;

  const robotPane = $('.robot-pane');
  const robot = mountRobotPane(robotPane);
  const lockBtns = [...root.querySelectorAll('.live-lock-btn')];
  let viewLocked = true;

  function snapCameraFront(view = robot.view) {
    if (!view?.viewer || !view?.sim) return;
    const [px, py] = view.sim.bodyPosition('pelvis');
    const { camera, controls } = view.viewer;
    view.viewer.targetHeight = 0.78;
    controls.target.set(px, 0.78, -py);
    camera.position.set(px + 2.45, 1.08, -py);
    controls.update();
  }

  function setViewLocked(next) {
    viewLocked = Boolean(next);
    for (const b of lockBtns) {
      b.setAttribute('aria-pressed', String(viewLocked));
      b.innerHTML = viewLocked ? T('lockView') : T('freeRoam');
    }
    if (viewLocked) snapCameraFront();
  }

  for (const b of lockBtns) {
    b.onclick = () => setViewLocked(!viewLocked);
  }
  const onOrbitStart = () => {
    if (viewLocked) setViewLocked(false);
  };
  robotPane.addEventListener('pointerdown', onOrbitStart);

  let restoreRender = () => {};
  robot.ready.then((view) => {
    if (!view || disposed) return;
    view.viewer.followTau = FOLLOW_S;
    restoreRender = lightenRender(view.viewer);
    if (viewLocked) snapCameraFront(view);
  });

  function lightenRender(viewer) {
    const { renderer, sun } = viewer;
    const ratio = renderer.getPixelRatio();
    const shadow = sun.shadow.mapSize.x;
    const setShadow = (px) => {
      sun.shadow.mapSize.set(px, px);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
    };
    renderer.setPixelRatio(Math.min(devicePixelRatio, LIVE_PIXEL_RATIO));
    setShadow(Math.min(shadow, LIVE_SHADOW_PX));
    return () => {
      renderer.setPixelRatio(ratio);
      setShadow(shadow);
    };
  }

  const perf = { frames: [], mimic: 0, mimicSamples: 0, raf: 0 };
  if (DEBUG) {
    perf.raf = requestAnimationFrame(function count(t) {
      perf.frames.push(t);
      while (perf.frames[0] < t - 1000) perf.frames.shift();
      perf.raf = requestAnimationFrame(count);
    });
  }

  let recordTimer = 0;
  let recordStart = 0;

  function startRecording() {
    if (!live) return;
    live.startRecording();
    recordStart = performance.now();
    $('.rec-time').textContent = '0:00';
    setState('live');
    clearInterval(recordTimer);
    recordTimer = setInterval(() => {
      const seconds = (performance.now() - recordStart) / 1000;
      $('.rec-time').textContent = clock(Math.min(seconds, MAX_RECORD_S));
      if (seconds >= MAX_RECORD_S) saveRecording();
    }, 250);
  }

  function finishWithSaved(markup, clip = null) {
    $('.saved-text').innerHTML = markup;
    $('.saved-text').classList.toggle('error', !clip);
    $('.see-clip').hidden = !clip;
    if (clip) $('.see-clip').href = `/simulations/${encodeURIComponent(clip.id)}`;
    setState('saved');
  }

  function saveRecording({ keepCamera = false } = {}) {
    if (!live?.isRecording()) return false;
    clearInterval(recordTimer);
    const seconds = (performance.now() - recordStart) / 1000;
    let clip = null;
    let errKey = null;
    try {
      clip = live.stopRecording();
    } catch {
      errKey = 'notSeen';
    }
    if (!errKey && seconds < MIN_RECORD_S) {
      clip = null;
      errKey = 'tooShort';
    }
    if (clip) {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const key = isPhone() ? 'phoneClip' : 'cameraClip';
      addUserClip(clip, { es: tl(key, time, 'es'), en: tl(key, time, 'en') });
    }
    if (!keepCamera) teardownCapture();
    if (clip) {
      finishWithSaved(T('saved', { seconds: Math.round(seconds), pct: Math.round(100 * clip.quality.valid_ratio) }), clip);
    } else {
      finishWithSaved(T(errKey ?? 'notSeen'), null);
    }
    return true;
  }

  function teardownCapture() {
    clearInterval(recordTimer);
    if (live) {
      live.stop();
      live = null;
    }
    robot.view?.reset();
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    phoneImage.hidden = true;
    phoneImage.removeAttribute('src');
    page.classList.remove('camera-on', 'phone-on');
    $('.phone-qr').hidden = true;
    $('.camera-label').innerHTML = T('you');
  }

  function stop({ toIdle = true, discard = false } = {}) {
    connectingAborted = true;
    if (!discard && live?.isRecording()) {
      saveRecording({ keepCamera: false });
      return;
    }
    teardownCapture();
    if (toIdle) setState('idle');
  }

  function onPose(pose) {
    if (state !== 'live') return;
    const { width, height } = isPhone() ? live.size() : { width: video.videoWidth, height: video.videoHeight };
    if (width && height && (overlay.width !== width || overlay.height !== height)) {
      [overlay.width, overlay.height] = [width, height];
    }
    drawSkeleton(ctx, pose?.landmarks, pose?.visible, pose?.handLandmarks);
    const mimicStart = performance.now();
    const copied = robot.view?.mimic(pose);
    if (viewLocked && robot.view) snapCameraFront(robot.view);
    perf.mimic += (performance.now() - mimicStart - perf.mimic) / Math.min(30, ++perf.mimicSamples);

    const now = performance.now();
    if (now - lastReport < 1000) return;
    lastReport = now;

    if (DEBUG) {
      const fixes = (copied?.fixes ?? []).map((f) => FIX_NAMES[f] ?? f).join(', ') || 'ninguno';
      const body = copied?.tracked ? `Distancia al cuerpo: ${(100 * copied.residual).toFixed(1)} cm · arreglos: ${fixes}` : 'Sin seguimiento';
      const ms = (value) => `${value.toFixed(1)} ms`;
      const t = live?.timing?.();
      const models = t ? `pose ${ms(t.pose)} · manos ${ms(t.hands)} en ${Math.round(100 * t.handShare)} % de los cuadros · ` : '';
      $('.live-debug').textContent = `${body}\n${live?.fps() ?? 0} cuadros/s de cámara · ${perf.frames.length} fps de pantalla · ${models}robot ${ms(perf.mimic)}`;
    }

    const phone = isPhone();
    let chipTone = 'neutral';
    if (!robot.view) {
      modeChip.innerHTML = T('robotLoading');
    } else if (!pose) {
      modeChip.innerHTML = T(phone ? 'phoneNobody' : 'nobody');
    } else if (!pose.visible) {
      modeChip.innerHTML = T(phone ? 'phoneHalf' : 'half');
    } else if (copied?.upperBodyOnly) {
      modeChip.innerHTML = T('upperBody');
      chipTone = 'signal';
    } else {
      modeChip.innerHTML = T('fullBody');
      chipTone = 'signal';
    }
    modeChip.dataset.tone = chipTone;

    const fps = live?.fps() ?? 0;
    const slow = now - startedAt > WARMUP_MS && fps > 0 && fps < MIN_FPS;
    if (slow) {
      const frames = (l) => (fps === 1 ? tl('framesOne', '', l) : tl('framesMany', fps, l));
      showToast(T(phone ? 'phoneSlow' : 'slow', { frames }), false);
    } else if (!toastEl.classList.contains('error')) {
      showToast('');
    }
  }

  let drawSkeleton;
  let capture = null;

  async function start() {
    teardownCapture();
    connectingAborted = false;
    setState('connecting');
    connectingText.innerHTML = T('waitingPermission');
    showToast('');
    try {
      capture ??= await import('tridi-live');
      if (disposed || connectingAborted) return;
      drawSkeleton = capture.drawSkeleton;
      const session = await capture.createLiveCapture(video, {
        model: SMALL_SCREEN ? 'lite' : 'full',
        hands: !SMALL_SCREEN,
        onProgress: ({ stage, done }) => {
          if (disposed || connectingAborted) return;
          if (stage === 'camera' && !done) connectingText.innerHTML = T('waitingPermission');
          else if (stage === 'camera' && done) {
            page.classList.add('camera-on');
            connectingText.innerHTML = T('preparing');
          } else if (stage === 'model' && !done) {
            connectingText.innerHTML = T('preparing');
          }
        },
        onPose,
      });
      if (disposed || connectingAborted) return session.stop();
      live = session;
      startedAt = performance.now();
      page.classList.add('camera-on');
      startRecording();
    } catch (error) {
      teardownCapture();
      setState('idle');
      const isCamera = capture && error instanceof capture.CameraError;
      showToast(isCamera ? escapeHtml(error.message) : T('cameraFailed'), true, 7000);
      if (!isCamera) console.error(error);
    }
  }

  async function startPhone() {
    teardownCapture();
    connectingAborted = false;
    setState('connecting');
    connectingText.innerHTML = T('lookingServer');
    showToast('');
    try {
      await api.checked;
      if (!api.ok) await api.recheck();
      if (disposed || connectingAborted) return;
      if (!api.ok) {
        setState('idle');
        return showToast(T('phoneNoServer'), true, 7000);
      }
      if (LOCAL_API.test(api.url)) {
        setState('idle');
        return showToast(T('phoneLocal'), true, 7000);
      }
      connectingText.innerHTML = T('opening');
      const [tridi, { renderSVG }] = await Promise.all([capture ?? import('tridi-live'), import('uqr')]);
      if (disposed || connectingAborted) return;
      capture = tridi;
      drawSkeleton = capture.drawSkeleton;
      const { sessionId } = await capture.openPhoneSession(api.url);
      if (disposed || connectingAborted) return capture.closePhoneSession(api.url, sessionId);
      const url = capture.phonePageUrl(PHONE_WEB, api.url, sessionId);
      $('.qr').innerHTML = renderSVG(url, { ecc: 'M', border: 2, pixelSize: 7, blackColor: '#0d0d0b', whiteColor: '#ffffff' });
      $('.phone-qr').hidden = false;
      live = capture.createPhoneCapture(api.url, sessionId, { onPose, onImage, onStatus: onPhoneStatus });
      page.classList.add('phone-on');
      $('.camera-label').innerHTML = T('yourPhone');
      connectingText.innerHTML = T('phoneWaiting');
    } catch (error) {
      teardownCapture();
      setState('idle');
      const known = capture && error instanceof capture.UploadError;
      showToast(known ? escapeHtml(error.message) : T('phoneFailed'), true, 7000);
      if (!known) console.error(error);
    }
  }

  function onImage(src) {
    if (!isPhone()) return;
    phoneImage.src = src;
    phoneImage.hidden = false;
  }

  function onPhoneStatus({ state: phoneState }) {
    if (!isPhone()) return;
    if (phoneState === 'streaming') {
      $('.phone-qr').hidden = true;
      page.classList.add('camera-on');
      if (!live.isRecording()) {
        startedAt = performance.now();
        startRecording();
      }
    } else if (phoneState === 'lost' || phoneState === 'ended') {
      const hadRecording = live.isRecording();
      const why = phoneState === 'lost' ? T('lost', { s: capture.PHONE_SILENCE_S }) : T('ended');
      if (hadRecording) {
        saveRecording({ keepCamera: false });
      } else {
        teardownCapture();
        setState('idle');
        showToast(why, false, 5000);
      }
      if (returnToWebcam && !hadRecording) start();
    }
  }

  startBtn.onclick = () => start();
  phoneBtn.onclick = () => startPhone();
  cancelBtn.onclick = () => stop({ toIdle: true, discard: true });
  stopCamBtn.onclick = () => stop({ toIdle: true, discard: true });
  $('.record-toggle').onclick = () => saveRecording({ keepCamera: false });
  $('.again').onclick = () => start();

  const unHeader = mountAppHeader(root);
  return () => {
    unHeader();
    robotPane.removeEventListener('pointerdown', onOrbitStart);
    disposed = true;
    clearTimeout(toastTimer);
    clearInterval(recordTimer);
    teardownCapture();
    if (robot.view) robot.view.viewer.followTau = 0;
    restoreRender();
    cancelAnimationFrame(perf.raf);
    robot.dispose();
  };
}
