// The phone as the live camera (#/camera/<session>): the page the QR on En vivo opens on the
// phone (docs/contrato.md, "El teléfono como cámara"). It runs the same MediaPipe as the webcam on
// the phone's back camera (createLiveCapture from data/live) and posts the poses to the Mac's
// session (createPhoneSender), with a small image of the camera (createImageGrabber) so the Mac
// shows what the phone sees under the skeleton; the robot on the Mac copies whoever this phone films. Nothing else
// loads here: no robot, no 3D, so a phone opens it in a moment. The server's address comes in
// ?api= of the QR's link, which web/src/api.js reads first.
import { LOGO, WORDMARK } from '../brand.js';
import { escapeHtml, LANGS, langSwitch } from '../i18n.js';
import { L, T } from './strings/phone.js';

export { title } from './strings/phone.js';

// Phones run MediaPipe's "lite" model capped at 480x360 and 24 fps so inference stays responsive
// and battery/thermal throttling doesn't cause 5 s tunnel freezes.
const MODEL = 'lite';
const PHONE_CONSTRAINTS = { width: { ideal: 480 }, height: { ideal: 360 }, frameRate: { ideal: 30 } };
const PHONE_MAX_FPS = 24;
// Words change once a second, not every frame (as on the live screen).
const REPORT_MS = 1000;
// Under this many frames per second the robot moves in jumps (the live screen's line).
const MIN_FPS = 20;
// If the Mac stops asking for the frames (closed tab, tunnel gone) the phone stops after this long,
// so a forgotten phone does not film and post for an hour: 30 s is longer than any tunnel hiccup,
// and a Mac that closed its tab never comes back.
const UNWATCHED_STOP_S = 30;
// Session ids as data/relay.py makes them.
const SESSION_ID = /^[23456789abcdefghjkmnpqrstuvwxyz]{8}$/;
// Our own "no server" error, recognized by its message to show it in the page's language.
const NO_TRIDI = 'no-tridi-server';

export function mount(root, { api }, [sessionId] = []) {
  root.innerHTML = `
    <section class="page narrow phone">
      <header class="phone-topbar">
        <a class="wordmark" href="/">${LOGO}${WORDMARK}</a>
        ${langSwitch()}
      </header>
      <div class="phone-head">
        <h1>${T('head')}</h1>
        <p class="lead">${T('lead')}</p>
      </div>
      <div class="phone-stage">
        <video playsinline muted></video>
        <canvas class="phone-overlay"></canvas>
        <p class="phone-big" aria-live="polite">${T('tap')}</p>
      </div>
      <p class="phone-meta"></p>
      <div class="row">
        <button class="primary phone-start" type="button">${T('use')}</button>
        <button class="phone-end" type="button" hidden>${T('end')}</button>
        <button class="phone-hands" type="button" aria-pressed="false">${T('hands')}</button>
      </div>
      <ol class="steps">
        <li>${T('step1')}</li>
        <li>${T('step2')}</li>
        <li>${T('step3')}</li>
      </ol>
    </section>`;

  const $ = (selector) => root.querySelector(selector);
  const video = $('video');
  const overlay = $('.phone-overlay');
  const ctx = overlay.getContext('2d');
  const startButton = $('.phone-start');
  const endButton = $('.phone-end');
  const handsButton = $('.phone-hands');
  // markup: T() or escaped text from outside
  const big = (markup, isError = false) => {
    $('.phone-big').innerHTML = markup;
    $('.phone-big').classList.toggle('error', isError);
  };

  let capture = null; // the tridi-live module
  let live = null; // createLiveCapture
  let sender = null; // createPhoneSender
  let wakeLock = null;
  let server = { state: 'sending' }; // the last status the sender reported
  let unwatchedSince = 0;
  let lastReport = 0;
  let disposed = false;
  let handsEnabled = false;
  let activeHandsToken = 0;

  if (!SESSION_ID.test(sessionId ?? '')) {
    big(T('badLink'), true);
    startButton.disabled = true;
    handsButton.disabled = true;
  } else if (!api.url) {
    big(T('noServer'), true);
    startButton.disabled = true;
    handsButton.disabled = true;
  }

  // The screen must stay on: a locked phone stops the camera. The hint in the steps covers the
  // browsers without the Wake Lock API.
  async function keepAwake() {
    try {
      wakeLock = await navigator.wakeLock?.request('screen');
    } catch {
      wakeLock = null;
    }
  }
  const onVisible = () => document.visibilityState === 'visible' && live && keepAwake();
  document.addEventListener('visibilitychange', onVisible);

  function onPose(pose) {
    if (overlay.width !== video.videoWidth) [overlay.width, overlay.height] = [video.videoWidth, video.videoHeight];
    capture.drawSkeleton(ctx, pose?.landmarks, pose?.visible, pose?.handLandmarks);
    // Pose-only (~1 KB JSON) over the tunnel: no per-frame JPEGs (cuts bandwidth >95%).
    sender?.push(pose, video.videoWidth, video.videoHeight, null);

    const now = performance.now();
    if (now - lastReport < REPORT_MS) return;
    lastReport = now;
    if (server.state === 'offline') big(T('offline'), true);
    else if (server.state === 'unwatched') big(T('unwatched'), true);
    else if (!pose) big(T('nobody'));
    else if (!pose.visible) big(T('half'));
    else big(T('ok'));
    const fps = live?.fps() ?? 0;
    $('.phone-meta').innerHTML = LANGS.map((l) =>
      `<span class="t" lang="${l}">${L(fps === 1 ? 'framesOne' : 'framesMany', { n: fps }, l)}${fps < MIN_FPS ? L('slow', {}, l) : ''}</span>`).join('');
  }

  function onStatus(status) {
    server = status;
    if (status.state === 'ended') return end(T('ended'));
    if (status.state !== 'unwatched') unwatchedSince = 0;
    else if (!unwatchedSince) unwatchedSince = performance.now();
    else if (performance.now() - unwatchedSince > UNWATCHED_STOP_S * 1000) {
      end(T('stopped', { s: UNWATCHED_STOP_S }), true);
    }
  }

  async function start() {
    startButton.disabled = true;
    big(T('waitingPermission'));
    let preStream = null;
    try {
      // 1. Call getUserMedia IMMEDIATELY on tap (before downloading MediaPipe WASM) so permission
      //    is instant and the camera preview appears right away while models load in parallel.
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('HTTPS required for camera');
      }
      preStream = await navigator.mediaDevices.getUserMedia({
        video: { ...PHONE_CONSTRAINTS, facingMode: 'environment' },
        audio: false,
      });
      if (disposed) {
        preStream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = preStream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      $('.phone').classList.add('camera-on');
      big(T('preparing'));

      // 2. Download tridi-live + check server in parallel while camera preview is already visible.
      const [tridi] = await Promise.all([capture ?? import('tridi-live'), api.checked]);
      if (disposed) {
        preStream.getTracks().forEach((t) => t.stop());
        video.srcObject = null;
        return;
      }
      capture = tridi;
      if (!api.ok) throw new capture.UploadError(NO_TRIDI);

      const wantHands = handsEnabled;
      const session = await capture.createLiveCapture(video, {
        model: MODEL,
        hands: wantHands,
        facingMode: 'environment',
        stream: preStream,
        constraints: PHONE_CONSTRAINTS,
        maxFps: PHONE_MAX_FPS,
        onProgress: ({ stage, done }) => {
          if (stage === 'model' && !done) big(T('preparing'));
        },
        onPose,
      });
      if (disposed) return session.stop();
      preStream = null; // owned by session now
      live = session;
      if (handsEnabled !== wantHands) {
        const target = handsEnabled;
        const token = ++activeHandsToken;
        handsButton.disabled = true;
        handsButton.setAttribute('aria-busy', 'true');
        session.setHands(target).then(
          (ok) => {
            if (target && !ok && !disposed && live === session && token === activeHandsToken) {
              handsEnabled = false;
              handsButton.setAttribute('aria-pressed', 'false');
            }
          },
          (error) => {
            if (!disposed && live === session && token === activeHandsToken) {
              handsEnabled = false;
              handsButton.setAttribute('aria-pressed', 'false');
            }
            console.error(error);
          },
        ).finally(() => {
          if (!disposed && live === session && token === activeHandsToken) {
            handsButton.disabled = false;
            handsButton.removeAttribute('aria-busy');
          }
        });
      }
      sender = capture.createPhoneSender(api.url, sessionId, { onStatus });
      keepAwake();
      startButton.hidden = true;
      endButton.hidden = false;
      big(T('connecting'));
    } catch (error) {
      if (preStream) {
        preStream.getTracks().forEach((t) => t.stop());
        video.srcObject = null;
        $('.phone').classList.remove('camera-on');
      }
      const known = capture && (error instanceof capture.CameraError || error instanceof capture.UploadError);
      big(error?.message === NO_TRIDI ? T('noTridi') : known ? escapeHtml(error.message) : T('cameraFailed'), true);
      if (!known) console.error(error);
      startButton.disabled = false;
    }
  }

  function end(message, isError = false) {
    sender?.stop();
    sender = null;
    live?.stop();
    live = null;
    wakeLock?.release().catch(() => {});
    wakeLock = null;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    $('.phone').classList.remove('camera-on');
    endButton.hidden = true;
    handsButton.hidden = true;
    handsButton.disabled = true;
    handsButton.removeAttribute('aria-busy');
    $('.phone-meta').innerHTML = '';
    big(message, isError);
  }

  handsButton.onclick = async (event) => {
    const next = !handsEnabled;
    handsEnabled = next;
    handsButton.setAttribute('aria-pressed', String(next));
    if (event.detail) handsButton.blur();
    if (!live) return;
    const token = ++activeHandsToken;
    const currentLive = live;
    handsButton.disabled = true;
    handsButton.setAttribute('aria-busy', 'true');
    try {
      const ok = await currentLive.setHands(next);
      if (next && !ok && !disposed && live === currentLive && token === activeHandsToken) {
        handsEnabled = false;
        handsButton.setAttribute('aria-pressed', 'false');
      }
    } catch (error) {
      if (!disposed && live === currentLive && token === activeHandsToken) {
        handsEnabled = false;
        handsButton.setAttribute('aria-pressed', 'false');
      }
      console.error(error);
    } finally {
      if (!disposed && live === currentLive && token === activeHandsToken) {
        handsButton.disabled = false;
        handsButton.removeAttribute('aria-busy');
      }
    }
  };

  startButton.onclick = start;
  endButton.onclick = () => {
    capture?.closePhoneSession(api.url, sessionId); // the Mac sees it at once and goes back to its webcam
    end(T('done'));
  };
  // Leaving the page (closing the tab, going home) tells the Mac too, instead of 5 s of silence.
  const onLeave = () => live && capture?.closePhoneSession(api.url, sessionId);
  window.addEventListener('pagehide', onLeave);

  return () => {
    disposed = true;
    onLeave();
    window.removeEventListener('pagehide', onLeave);
    document.removeEventListener('visibilitychange', onVisible);
    end('');
  };
}
