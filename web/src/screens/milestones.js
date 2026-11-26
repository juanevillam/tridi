// Milestones & Field Notes (#/milestones, #/avances):
// Zero-scroll full-viewport 2-column split (Story & Notes left | Live Autoplay Media Deck right)
// with in-stage Liquid Glass scope switcher for multi-scope milestones (Luigi Hardware / CAD),
// pure color-field ambient canvas (zero moving background distractions), smooth cross-fade on
// both manual & autoplay turns, inline mute synced to fullscreen, and keyboard-only focus states.
import { appHeaderHTML, mountAppHeader } from '../header.js';
import { mountScrollFade } from '../scroll-fade.js';
import { A, T, title } from './strings/milestones.js';

export { title };

const MEDIA = `${import.meta.env.BASE_URL}media/`;

const ICON_PLAY =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 3.2L13 8l-8.5 4.8V3.2z" fill="currentColor"/></svg>';
const ICON_PAUSE =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h2.6v10H4V3zm5.4 0H12v10H9.4V3z" fill="currentColor"/></svg>';
const ICON_VOL =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6h2.7L9 3v10l-3.8-3H2.5V6z" fill="currentColor"/><path d="M11.2 5.3a3.8 3.8 0 010 5.4M12.9 3.6a6.2 6.2 0 010 8.8" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/></svg>';
const ICON_MUTE =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6h2.7L9 3v10l-3.8-3H2.5V6z" fill="currentColor"/><path d="M11.2 5.8l3.2 4.4m0-4.4l-3.2 4.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
const ICON_PREV =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_NEXT =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const AUTOPLAY_PHOTO_MS = 5200;
const AUTOPLAY_VIDEO_MS = 8500;

// Newest milestone first; multi-scope milestones use an in-stage Liquid Glass switcher
const MILESTONES = [
  {
    id: 'sim-to-real',
    key: 'm2',
    ctas: [{ href: '/simulations/luigi_lab3', label: 'm2.ctaSim', primary: true }],
    scopes: [
      {
        id: 'hardware',
        label: 'deck.hardware',
        items: [
          {
            type: 'video',
            src: `${MEDIA}luigi-sim2real.mp4`,
            alt: 'Luigi differential robot untethered floor run at 50 Hz',
          },
          {
            type: 'video',
            src: `${MEDIA}luigi-hardware.mp4`,
            alt: 'Luigi walking through the Lab 3 rover hardware',
          },
          {
            type: 'video',
            src: `${MEDIA}luigi-calibration.mp4`,
            alt: 'Luigi rover untethered floor sprint test',
          },
        ],
      },
      {
        id: 'cad',
        label: 'deck.cad',
        items: [
          {
            type: 'photo',
            src: `${MEDIA}luigi-cad-planta.png`,
            tag: 'cad.v1',
            alt: 'Luigi Lab 3 (v1) — Top CAD blueprint',
          },
          {
            type: 'photo',
            src: `${MEDIA}luigi-cad-chasis.png`,
            tag: 'cad.v1',
            alt: 'Luigi Lab 3 (v1) — Exploded 3D-printed chassis',
          },
          {
            type: 'photo',
            src: `${MEDIA}luigi-cad-frente.png`,
            tag: 'cad.v1',
            alt: 'Luigi Lab 3 (v1) — Front sensor bracket HC-SR04 and APDS-9960',
          },
          {
            type: 'photo',
            src: `${MEDIA}luigi-cad-rueda.png`,
            tag: 'cad.v1',
            alt: 'Luigi Lab 3 (v1) — Rim and TPU wheel assembly',
          },
          {
            type: 'photo',
            src: `${MEDIA}luigi-v2-chasis.png`,
            tag: 'cad.v2',
            alt: 'Luigi Lab 4 (v2) — Exploded chassis with servo radar head',
          },
        ],
      },
    ],
    stepsTitle: 'm2.stepsTitle',
    steps: [
      { title: 'm2.s1.title', body: 'm2.s1.body' },
      { title: 'm2.s2.title', body: 'm2.s2.body' },
      { title: 'm2.s3.title', body: 'm2.s3.body' },
    ],
  },
  {
    id: 'yc-w27',
    key: 'm3',
    ctas: [{ href: '/live', label: 'm3.ctaLive', primary: true }],
    scopes: [
      {
        id: 'all',
        label: null,
        items: [
          {
            type: 'video',
            src: `${MEDIA}yc-founder-video.mp4`,
            alt: 'Tridi one-minute founder video submitted to Y Combinator Winter 2027',
          },
          {
            type: 'video',
            src: `${MEDIA}yc-blackout-rig.mp4`,
            alt: 'Rigging an LED bar from a ceiling chandelier during a blackout on YC deadline day',
          },
          {
            type: 'video',
            src: `${MEDIA}yc-chandelier-light.mp4`,
            alt: 'Close-up of the improvised chandelier, power bank, and LED bar lighting rig',
          },
          {
            type: 'photo',
            src: `${MEDIA}yc-setup.jpg`,
            alt: 'MacBook on a folding tray table with wireless mic receiver filming all four founders',
          },
        ],
      },
    ],
    stepsTitle: 'm3.notesTitle',
    steps: [
      { title: 'm3.n1.title', body: 'm3.n1.body' },
      { title: 'm3.n2.title', body: 'm3.n2.body' },
      { title: 'm3.n3.title', body: 'm3.n3.body' },
    ],
  },
  {
    id: 'platanus-hack',
    key: 'm1',
    ctas: [{ href: '/simulations', label: 'm1.ctaSims', primary: true }],
    scopes: [
      {
        id: 'all',
        label: null,
        items: [
          {
            type: 'video',
            src: `${MEDIA}platanus-pitch.mp4`,
            alt: 'Tridi live demo at Platanus Hack 26 Caracas',
          },
          {
            type: 'photo',
            src: `${MEDIA}platanus-stage.jpg`,
            alt: 'Tridi team presenting live demo on stage at Platanus Hack 26 Caracas',
          },
          {
            type: 'video',
            src: `${MEDIA}platanus-mentor.mp4`,
            alt: 'Product mentorship session with Sebastián Alcalá at Platanus Hack 26',
          },
          {
            type: 'photo',
            src: `${MEDIA}platanus-mentor-photo.jpg`,
            alt: 'Tridi team talking with mentor Sebastián Alcalá at Platanus Hack 26',
          },
          {
            type: 'photo',
            src: `${MEDIA}platanus-sketch.jpg`,
            alt: 'Early Tridi architecture sketch during Platanus Hack 26',
          },
          {
            type: 'video',
            src: `${MEDIA}platanus-huddle.mp4`,
            alt: 'Sunday morning sync aligning camera-to-MuJoCo demo',
          },
          {
            type: 'photo',
            src: `${MEDIA}platanus-desk.jpg`,
            alt: 'Tridi founders working at Yummy offices during Platanus Hack 26',
          },
          {
            type: 'video',
            src: `${MEDIA}platanus-floor.mp4`,
            alt: 'Night shift across the Yummy floor during Platanus Hack 26',
          },
          {
            type: 'photo',
            src: `${MEDIA}platanus-rehearsal.jpg`,
            alt: 'Pitch rehearsal with Tridi simulation running on laptop',
          },
        ],
      },
    ],
    stepsTitle: 'm1.notesTitle',
    steps: [
      { title: 'm1.n1.title', body: 'm1.n1.body' },
      { title: 'm1.n2.title', body: 'm1.n2.body' },
      { title: 'm1.n3.title', body: 'm1.n3.body' },
    ],
  },
];

function fmtTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const total = Math.floor(sec);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

// Samples a media frame into a tiny 6x4 color-field canvas so ONLY pure dominant colors
// glow softly in the ambient backdrop — zero moving tickers, chairs, or recognizable shapes.
function paintAmbient(canvas, source) {
  if (!canvas || !source) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  try {
    const sw = source.videoWidth || source.naturalWidth || 0;
    const sh = source.videoHeight || source.naturalHeight || 0;
    if (!sw || !sh) return;
    // Crop out bottom 14% where tickers/subtitles sit so banner colors never dominate
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, sw, Math.round(sh * 0.86), 0, 0, canvas.width, canvas.height);
    canvas.classList.add('is-ready');
  } catch {
    // ignore cross-origin or unready frames
  }
}

function panelHTML(m, isFirst) {
  const firstScope = m.scopes[0];
  const hasScopes = m.scopes.length > 1;

  return `
    <article
      class="ms-panel"
      id="panel-${m.id}"
      data-panel="${m.id}"
      role="tabpanel"
      ${isFirst ? '' : 'hidden'}
    >
      <div class="ms-split">
        <div class="ms-col-text" data-scroll-fade>
          <h2 class="ms-title">${T(`${m.key}.title`)}</h2>
          <p class="ms-intro">${T(`${m.key}.intro`)}</p>
          <div class="ms-cta-row">
            ${m.ctas
              .map(
                (c) =>
                  `<a class="button ${c.primary ? 'primary ' : ''}ms-cta" href="${c.href}">${T(c.label)}</a>`,
              )
              .join('')}
          </div>

          ${
            m.steps?.length
              ? `
            <section class="ms-notes">
              <h3 class="ms-notes-head">${T(m.stepsTitle)}</h3>
              <div class="ms-steps">
                ${m.steps
                  .map(
                    (s) => `
                  <div class="ms-step">
                    <h4>${T(s.title)}</h4>
                    <p>${T(s.body)}</p>
                  </div>`,
                  )
                  .join('')}
              </div>
            </section>`
              : ''
          }
        </div>

        <div class="ms-col-media">
          <div class="ms-deck" data-deck-ms="${m.id}">
            <div class="ms-deck-stage" tabindex="0" role="button" data-deck-stage>
              <div class="ms-d-layer is-on" data-d-layer="0">
                <canvas class="ms-ambient" width="6" height="4" aria-hidden="true"></canvas>
                <img class="ms-d-photo" alt="" />
                <video class="ms-d-video" muted playsinline preload="metadata" disablepictureinpicture></video>
              </div>
              <div class="ms-d-layer" data-d-layer="1">
                <canvas class="ms-ambient" width="6" height="4" aria-hidden="true"></canvas>
                <img class="ms-d-photo" alt="" />
                <video class="ms-d-video" muted playsinline preload="metadata" disablepictureinpicture></video>
              </div>

              ${
                hasScopes
                  ? `
                <div class="ms-scope-bar" role="group" data-scope-bar>
                  ${m.scopes
                    .map(
                      (sc, i) => `
                    <button
                      type="button"
                      class="ms-scope-btn"
                      data-scope-pick="${sc.id}"
                      aria-pressed="${i === 0 ? 'true' : 'false'}"
                    >${T(sc.label)}</button>`,
                    )
                    .join('')}
                </div>`
                  : ''
              }

              <button type="button" class="ms-deck-nav prev" data-deck-step="-1" ${A({ 'aria-label': 'deck.prev' })}>
                ${ICON_PREV}
              </button>
              <button type="button" class="ms-deck-nav next" data-deck-step="1" ${A({ 'aria-label': 'deck.next' })}>
                ${ICON_NEXT}
              </button>

              <span class="ms-deck-count" data-deck-count>01 / ${pad2(firstScope.items.length)}</span>

              <button type="button" class="ms-deck-mute" data-deck-mute hidden ${A({ 'aria-label': 'vp.mute' })}>
                <span class="ic-vol" hidden>${ICON_VOL}</span>
                <span class="ic-mute">${ICON_MUTE}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

export function mount(root) {
  root.innerHTML = `
    <section class="page milestones-page">
      ${appHeaderHTML({ current: 'milestones' })}

      <nav class="ms-bar" ${A({ 'aria-label': 'railNav' })}>
        <div class="ms-bar-track" role="tablist" data-scroll-fade>
          ${MILESTONES.map(
            (m, i) => `
            <button
              type="button"
              class="ms-tab"
              role="tab"
              data-tab="${m.id}"
              aria-selected="${i === 0 ? 'true' : 'false'}"
              aria-controls="panel-${m.id}"
              tabindex="${i === 0 ? '0' : '-1'}"
            >
              <span class="ms-tab-dot" aria-hidden="true"></span>
              <span class="ms-tab-date">${T(`tab.${m.key}.date`)}</span>
              <span class="ms-tab-name">${T(`tab.${m.key}.title`)}</span>
            </button>`,
          ).join('')}
        </div>
      </nav>

      <div class="ms-stage">
        ${MILESTONES.map((m, i) => panelHTML(m, i === 0)).join('')}
      </div>

      <!-- Unified Tridi Studio Fullscreen Media Viewer -->
      <dialog class="ms-viewer" id="milestone-lightbox" ${A({ 'aria-label': 'lb.dialog' })}>
        <div class="ms-v-room" data-v-room>
          <div class="ms-v-shell">
            <header class="ms-v-top">
              <div class="ms-v-title">
                <span class="ms-kicker-dot" aria-hidden="true"></span>
                <span class="ms-v-event" id="ms-v-event"></span>
              </div>
              <span class="ms-v-count-pill" id="ms-v-count">01 / 06</span>
              <button type="button" class="ms-v-close-pill" id="ms-v-close" ${A({ 'aria-label': 'lb.close' })}>
                <span class="ms-v-esc" aria-hidden="true">ESC</span>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3.5 3.5l9 9m0-9l-9 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                </svg>
              </button>
            </header>

            <div class="ms-v-stage" data-v-stage>
              <div class="ms-v-layer is-on" data-v-layer="0">
                <canvas class="ms-ambient" width="6" height="4" aria-hidden="true"></canvas>
                <img class="ms-v-photo" alt="" />
                <video
                  class="ms-v-video"
                  playsinline
                  preload="metadata"
                  disablepictureinpicture
                  controlslist="nodownload nofullscreen noremoteplayback"
                ></video>
              </div>
              <div class="ms-v-layer" data-v-layer="1">
                <canvas class="ms-ambient" width="6" height="4" aria-hidden="true"></canvas>
                <img class="ms-v-photo" alt="" />
                <video
                  class="ms-v-video"
                  playsinline
                  preload="metadata"
                  disablepictureinpicture
                  controlslist="nodownload nofullscreen noremoteplayback"
                ></video>
              </div>
            </div>

            <div class="ms-v-hud-slot">
              <div class="ms-v-hud" data-v-player hidden>
                <button type="button" class="ms-hud-btn" data-vp="toggle" ${A({ 'aria-label': 'vp.play' })}>
                  <span class="ic-play">${ICON_PLAY}</span>
                  <span class="ic-pause" hidden>${ICON_PAUSE}</span>
                </button>
                <input
                  type="range"
                  class="ms-hud-seek"
                  data-vp="seek"
                  min="0"
                  max="1000"
                  value="0"
                  step="1"
                  ${A({ 'aria-label': 'vp.seek' })}
                />
                <span class="ms-hud-time" data-vp="time">0:00 / 0:00</span>
                <button type="button" class="ms-hud-btn" data-vp="mute" ${A({ 'aria-label': 'vp.mute' })}>
                  <span class="ic-vol">${ICON_VOL}</span>
                  <span class="ic-mute" hidden>${ICON_MUTE}</span>
                </button>
              </div>
            </div>
          </div>

          <button type="button" class="ms-v-side prev" id="ms-v-prev" ${A({ 'aria-label': 'lb.prev' })}>
            ${ICON_PREV}
          </button>
          <button type="button" class="ms-v-side next" id="ms-v-next" ${A({ 'aria-label': 'lb.next' })}>
            ${ICON_NEXT}
          </button>
        </div>
      </dialog>
    </section>
  `;

  const cleanups = [];
  const milestoneById = new Map(MILESTONES.map((m) => [m.id, m]));
  const deckControllers = [];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // =========================================================================
  // Unified Tridi HUD Fullscreen Media Viewer
  // =========================================================================
  const dialog = root.querySelector('#milestone-lightbox');
  const stageEl = dialog?.querySelector('[data-v-stage]');
  const layers = [...(dialog?.querySelectorAll('[data-v-layer]') ?? [])].map((el) => ({
    el,
    ambient: el.querySelector('.ms-ambient'),
    photo: el.querySelector('.ms-v-photo'),
    video: el.querySelector('.ms-v-video'),
  }));
  const hudWrap = dialog?.querySelector('[data-v-player]');
  const toggleBtn = hudWrap?.querySelector('[data-vp="toggle"]');
  const seek = hudWrap?.querySelector('[data-vp="seek"]');
  const timeEl = hudWrap?.querySelector('[data-vp="time"]');
  const muteBtn = hudWrap?.querySelector('[data-vp="mute"]');
  const icPlay = toggleBtn?.querySelector('.ic-play');
  const icPause = toggleBtn?.querySelector('.ic-pause');
  const icVol = muteBtn?.querySelector('.ic-vol');
  const icMute = muteBtn?.querySelector('.ic-mute');

  const vEventEl = root.querySelector('#ms-v-event');
  const vCountEl = root.querySelector('#ms-v-count');
  const vClose = root.querySelector('#ms-v-close');
  const vPrev = root.querySelector('#ms-v-prev');
  const vNext = root.querySelector('#ms-v-next');

  let activeMilestone = null;
  let activeItems = [];
  let activeIdx = 0;
  let frontLayer = 0;
  let turnId = 0;
  let closeTimer = null;
  let lastTriggerEl = null;
  let draggingSeek = false;
  let viewerMuted = true;

  const getActiveLayer = () => layers[frontLayer];

  const syncHud = () => {
    const layer = getActiveLayer();
    const item = activeItems[activeIdx];
    if (!layer || !item || item.type !== 'video') return;
    const v = layer.video;
    const playing = !v.paused && !v.ended;
    if (icPlay) icPlay.hidden = playing;
    if (icPause) icPause.hidden = !playing;
    if (muteBtn) muteBtn.hidden = Boolean(item.silent);
    if (icVol) icVol.hidden = v.muted;
    if (icMute) icMute.hidden = !v.muted;

    const dur = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 0;
    const cur = Number.isFinite(v.currentTime) ? v.currentTime : 0;
    if (timeEl) timeEl.textContent = `${fmtTime(cur)} / ${fmtTime(dur)}`;
    if (seek && !draggingSeek) {
      const pct = dur > 0 ? Math.min(1000, Math.round((cur / dur) * 1000)) : 0;
      seek.value = String(pct);
      seek.style.setProperty('--pct', `${pct / 10}%`);
    }
  };

  const togglePlay = () => {
    const layer = getActiveLayer();
    if (!layer || activeItems[activeIdx]?.type !== 'video') return;
    const { video } = layer;
    if (video.paused || video.ended) video.play().catch(() => {});
    else video.pause();
  };

  const toggleMute = () => {
    const layer = getActiveLayer();
    if (!layer) return;
    viewerMuted = !layer.video.muted;
    layer.video.muted = viewerMuted;
    syncHud();
  };

  const onSeekInput = () => {
    const layer = getActiveLayer();
    if (!layer) return;
    draggingSeek = true;
    const pct = Number(seek.value) / 1000;
    seek.style.setProperty('--pct', `${pct * 100}%`);
    const v = layer.video;
    if (Number.isFinite(v.duration) && v.duration > 0) {
      const t = pct * v.duration;
      v.currentTime = t;
      if (timeEl) timeEl.textContent = `${fmtTime(t)} / ${fmtTime(v.duration)}`;
    }
  };

  const onSeekEnd = () => {
    draggingSeek = false;
    syncHud();
  };

  const onToggleClick = (e) => {
    e.stopPropagation();
    if (e.detail) toggleBtn?.blur();
    togglePlay();
  };
  const onMuteClick = (e) => {
    e.stopPropagation();
    if (e.detail) muteBtn?.blur();
    toggleMute();
  };

  toggleBtn?.addEventListener('click', onToggleClick);
  muteBtn?.addEventListener('click', onMuteClick);
  seek?.addEventListener('input', onSeekInput);
  seek?.addEventListener('change', onSeekEnd);
  seek?.addEventListener('pointerup', onSeekEnd);
  cleanups.push(() => {
    toggleBtn?.removeEventListener('click', onToggleClick);
    muteBtn?.removeEventListener('click', onMuteClick);
    seek?.removeEventListener('input', onSeekInput);
    seek?.removeEventListener('change', onSeekEnd);
    seek?.removeEventListener('pointerup', onSeekEnd);
  });

  layers.forEach((l) => {
    const onLoadedData = () => paintAmbient(l.ambient, l.video);
    const onClick = (e) => {
      e.stopPropagation();
      togglePlay();
    };
    const evs = ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata', 'volumechange'];
    evs.forEach((ev) => l.video.addEventListener(ev, syncHud));
    l.video.addEventListener('loadeddata', onLoadedData);
    l.video.addEventListener('click', onClick);
    cleanups.push(() => {
      evs.forEach((ev) => l.video.removeEventListener(ev, syncHud));
      l.video.removeEventListener('loadeddata', onLoadedData);
      l.video.removeEventListener('click', onClick);
    });
  });

  const clearLayerVideo = (layer) => {
    layer.video.pause();
    layer.video.removeAttribute('src');
    layer.video.load();
  };

  const warmNeighbor = (items, idx) => {
    const p = items[(idx + items.length) % items.length];
    if (p && p.type === 'photo') {
      const img = new Image();
      img.src = p.src;
    }
  };

  const renderViewerItem = (idx, animate = true, startTime = 0) => {
    if (!activeMilestone || !activeItems.length || !dialog) return;
    activeIdx = (idx + activeItems.length) % activeItems.length;
    const item = activeItems[activeIdx];
    const mine = ++turnId;

    const targetIdx = animate ? 1 - frontLayer : frontLayer;
    const target = layers[targetIdx];
    const prev = layers[frontLayer];

    target.el.classList.toggle('is-video', item.type === 'video');
    target.el.classList.toggle('is-photo', item.type === 'photo');
    target.ambient?.classList.remove('is-ready');

    let revealed = false;
    const reveal = () => {
      if (mine !== turnId || revealed) return;
      revealed = true;
      if (animate) {
        prev.el.classList.remove('is-on');
        target.el.classList.add('is-on');
        frontLayer = targetIdx;
        window.setTimeout(() => {
          if (mine === turnId) clearLayerVideo(prev);
        }, 440);
      } else {
        layers[1 - targetIdx].el.classList.remove('is-on');
        clearLayerVideo(layers[1 - targetIdx]);
        target.el.classList.add('is-on');
      }
      if (hudWrap) {
        hudWrap.hidden = item.type !== 'video';
        syncHud();
      }
    };

    if (item.type === 'video') {
      target.photo.removeAttribute('src');
      target.video.src = item.src;
      target.video.currentTime = startTime > 0 ? startTime : 0;
      target.video.muted = Boolean(item.silent) || viewerMuted;
      target.video.play().catch(() => {});
      if (target.video.readyState >= 2) {
        paintAmbient(target.ambient, target.video);
        reveal();
      } else {
        target.video.addEventListener(
          'loadeddata',
          () => {
            paintAmbient(target.ambient, target.video);
            reveal();
          },
          { once: true },
        );
        window.setTimeout(reveal, 240);
      }
    } else {
      clearLayerVideo(target);
      target.photo.alt = item.alt || '';
      target.photo.onload = null;
      target.photo.src = item.src;
      if (target.photo.complete && target.photo.naturalWidth) {
        paintAmbient(target.ambient, target.photo);
        reveal();
      } else {
        target.photo.onload = () => {
          if (mine !== turnId) return;
          paintAmbient(target.ambient, target.photo);
          reveal();
        };
        window.setTimeout(reveal, 600);
      }
    }

    if (vEventEl) vEventEl.innerHTML = T(`tab.${activeMilestone.key}.title`);
    if (vCountEl) {
      const base = `${pad2(activeIdx + 1)} / ${pad2(activeItems.length)}`;
      vCountEl.innerHTML = item.tag ? `${base} · ${T(item.tag)}` : base;
    }

    warmNeighbor(activeItems, activeIdx + 1);
    warmNeighbor(activeItems, activeIdx - 1);
  };

  const lockScroll = (locked) => {
    document.documentElement.style.overflow = locked ? 'hidden' : '';
  };

  const pauseAllDecks = () => deckControllers.forEach((c) => c.suspend());
  const resumeActiveDecks = () => deckControllers.forEach((c) => c.resumeIfActive());

  const openViewer = (milestoneId, items, idx, triggerEl, startTime = 0, startMuted = true, openedByKey = false) => {
    const m = milestoneById.get(milestoneId);
    if (!m || !items?.length || !dialog) return;
    pauseAllDecks();
    activeMilestone = m;
    activeItems = items;
    viewerMuted = Boolean(startMuted);
    lastTriggerEl = openedByKey ? triggerEl : null;
    if (closeTimer !== null) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    dialog.classList.toggle('is-single', items.length < 2);
    renderViewerItem(idx, false, startTime);
    if (!dialog.open) dialog.showModal();
    lockScroll(true);
    void dialog.offsetWidth;
    dialog.classList.add('is-shown');
    if (openedByKey) requestAnimationFrame(() => vClose?.focus());
    else vClose?.blur();
  };

  const closeViewer = (restoreFocus = false) => {
    if (!dialog || !dialog.open) return;
    dialog.classList.remove('is-shown');
    if (closeTimer !== null) clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      turnId++;
      layers.forEach((l) => clearLayerVideo(l));
      dialog.close();
      lockScroll(false);
      closeTimer = null;
      resumeActiveDecks();
      if (restoreFocus && lastTriggerEl) lastTriggerEl.focus?.();
      else document.activeElement?.blur?.();
    }, reducedMotion ? 0 : 260);
  };

  // =========================================================================
  // Live Autoplay Media Deck (Pure color-field ambient BG + smooth cross-fade)
  // =========================================================================
  const mountDeck = (deckEl) => {
    const msId = deckEl.dataset.deckMs;
    const m = milestoneById.get(msId);
    if (!m?.scopes?.length) return;

    const panelEl = deckEl.closest('[data-panel]');
    const stage = deckEl.querySelector('[data-deck-stage]');
    const dLayers = [...deckEl.querySelectorAll('[data-d-layer]')].map((el) => ({
      el,
      ambient: el.querySelector('.ms-ambient'),
      photo: el.querySelector('.ms-d-photo'),
      video: el.querySelector('.ms-d-video'),
    }));
    const countEl = deckEl.querySelector('[data-deck-count]');
    const muteBtnEl = deckEl.querySelector('[data-deck-mute]');
    const dIcVol = muteBtnEl?.querySelector('.ic-vol');
    const dIcMute = muteBtnEl?.querySelector('.ic-mute');
    const stepBtns = [...deckEl.querySelectorAll('[data-deck-step]')];
    const scopeBtns = [...deckEl.querySelectorAll('[data-scope-pick]')];

    let scopeIdx = 0;
    let idx = 0;
    let dFront = 0;
    let dTurn = 0;
    let timer = null;
    let hovered = false;
    let unmutedLock = false;

    const currentItems = () => m.scopes[scopeIdx].items;
    const isVisiblePanel = () => !panelEl?.hidden && (!dialog || !dialog.open);

    const stopLayerVid = (l) => {
      l.video.pause();
      l.video.removeAttribute('src');
      l.video.load();
    };

    const syncMuteUI = (item, isMuted) => {
      if (!muteBtnEl) return;
      const showMute = item?.type === 'video' && !item.silent;
      muteBtnEl.hidden = !showMute;
      if (dIcVol) dIcVol.hidden = isMuted;
      if (dIcMute) dIcMute.hidden = !isMuted;
    };

    const clearTimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const scheduleNext = () => {
      clearTimer();
      const items = currentItems();
      if (reducedMotion || hovered || unmutedLock || !isVisiblePanel() || items.length < 2) return;
      const cur = items[idx];
      const delay = cur.type === 'video' ? AUTOPLAY_VIDEO_MS : AUTOPLAY_PHOTO_MS;
      timer = window.setTimeout(() => show(idx + 1, true), delay);
    };

    const show = (nextIdx, animate = true) => {
      clearTimer();
      const items = currentItems();
      idx = (nextIdx + items.length) % items.length;
      const item = items[idx];
      const mine = ++dTurn;

      const tIdx = animate ? 1 - dFront : dFront;
      const target = dLayers[tIdx];
      const prev = dLayers[dFront];

      target.el.classList.toggle('is-video', item.type === 'video');
      target.el.classList.toggle('is-photo', item.type === 'photo');
      target.ambient?.classList.remove('is-ready');
      stage.setAttribute('aria-label', item.alt);

      unmutedLock = false;

      let revealed = false;
      const reveal = () => {
        if (mine !== dTurn || revealed) return;
        revealed = true;
        if (animate) {
          prev.el.classList.remove('is-on');
          target.el.classList.add('is-on');
          dFront = tIdx;
          window.setTimeout(() => {
            if (mine === dTurn) stopLayerVid(prev);
          }, 440);
        } else {
          dLayers[1 - tIdx].el.classList.remove('is-on');
          stopLayerVid(dLayers[1 - tIdx]);
          target.el.classList.add('is-on');
        }
        scheduleNext();
      };

      if (item.type === 'video') {
        target.photo.removeAttribute('src');
        target.video.muted = true;
        target.video.loop = true;
        target.video.src = item.src;
        if (isVisiblePanel()) target.video.play().catch(() => {});
        syncMuteUI(item, true);

        if (target.video.readyState >= 2) {
          paintAmbient(target.ambient, target.video);
          reveal();
        } else {
          target.video.addEventListener(
            'loadeddata',
            () => {
              paintAmbient(target.ambient, target.video);
              reveal();
            },
            { once: true },
          );
          window.setTimeout(reveal, 220);
        }
      } else {
        stopLayerVid(target);
        target.photo.alt = item.alt || '';
        target.photo.onload = null;
        target.photo.src = item.src;
        syncMuteUI(item, true);

        if (target.photo.complete && target.photo.naturalWidth) {
          paintAmbient(target.ambient, target.photo);
          reveal();
        } else {
          target.photo.onload = () => {
            if (mine !== dTurn) return;
            paintAmbient(target.ambient, target.photo);
            reveal();
          };
          window.setTimeout(reveal, 400);
        }
      }

      if (countEl) {
        const base = `${pad2(idx + 1)} / ${pad2(items.length)}`;
        countEl.innerHTML = item.tag ? `${base} · ${T(item.tag)}` : base;
      }
    };

    const suspend = () => {
      clearTimer();
      dLayers.forEach((l) => l.video.pause());
    };

    const resumeIfActive = () => {
      if (!isVisiblePanel()) {
        suspend();
        return;
      }
      const cur = currentItems()[idx];
      const active = dLayers[dFront];
      if (cur?.type === 'video') active.video.play().catch(() => {});
      scheduleNext();
    };

    scopeBtns.forEach((btn, i) => {
      const onScope = (e) => {
        e.stopPropagation();
        if (e.detail) btn.blur();
        if (scopeIdx === i) return;
        scopeIdx = i;
        scopeBtns.forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
        show(0, true);
      };
      btn.addEventListener('click', onScope);
      cleanups.push(() => btn.removeEventListener('click', onScope));
    });

    const onMuteClick = (e) => {
      e.stopPropagation();
      if (e.detail) muteBtnEl?.blur();
      const cur = currentItems()[idx];
      if (cur?.type !== 'video' || cur.silent) return;
      const v = dLayers[dFront].video;
      const nextMuted = !v.muted;
      v.muted = nextMuted;
      unmutedLock = !nextMuted;
      if (!nextMuted) {
        deckControllers.forEach((c) => {
          if (c.id !== msId) c.mute();
        });
        v.play().catch(() => {});
      }
      syncMuteUI(cur, nextMuted);
      if (unmutedLock) clearTimer();
      else scheduleNext();
    };

    muteBtnEl?.addEventListener('click', onMuteClick);

    stepBtns.forEach((btn) => {
      const onStep = (e) => {
        e.stopPropagation();
        if (e.detail) btn.blur();
        show(idx + Number(btn.dataset.deckStep), true);
      };
      btn.addEventListener('click', onStep);
      cleanups.push(() => btn.removeEventListener('click', onStep));
    });

    const onEnter = () => {
      hovered = true;
      clearTimer();
    };
    const onLeave = () => {
      hovered = false;
      scheduleNext();
    };
    stage.addEventListener('pointerenter', onEnter);
    stage.addEventListener('pointerleave', onLeave);

    const openFromDeck = (byKey = false) => {
      const items = currentItems();
      const cur = items[idx];
      const v = dLayers[dFront].video;
      const t = cur?.type === 'video' ? v.currentTime || 0 : 0;
      const mutedState = cur?.type === 'video' ? Boolean(v.muted) : true;
      openViewer(msId, items, idx, stage, t, mutedState, byKey);
    };

    const onStageClick = (e) => {
      if (e.target.closest('button')) return;
      stage.blur();
      openFromDeck(false);
    };
    const onStageKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFromDeck(true);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        show(idx - 1, true);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        show(idx + 1, true);
      }
    };
    stage.addEventListener('click', onStageClick);
    stage.addEventListener('keydown', onStageKey);

    let dx0 = null;
    const onDown = (e) => {
      if (e.target.closest('button')) return;
      dx0 = e.clientX;
    };
    const onUp = (e) => {
      if (dx0 === null) return;
      const dx = e.clientX - dx0;
      dx0 = null;
      if (Math.abs(dx) > 48) {
        e.stopPropagation();
        show(idx + (dx < 0 ? 1 : -1), true);
      }
    };
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointerup', onUp);

    cleanups.push(() => {
      clearTimer();
      dLayers.forEach((l) => stopLayerVid(l));
      muteBtnEl?.removeEventListener('click', onMuteClick);
      stage.removeEventListener('pointerenter', onEnter);
      stage.removeEventListener('pointerleave', onLeave);
      stage.removeEventListener('click', onStageClick);
      stage.removeEventListener('keydown', onStageKey);
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointerup', onUp);
    });

    deckControllers.push({
      id: msId,
      suspend,
      resumeIfActive,
      mute: () => {
        const v = dLayers[dFront].video;
        if (v && !v.muted) {
          v.muted = true;
          unmutedLock = false;
          syncMuteUI(currentItems()[idx], true);
        }
      },
    });
    show(0, false);
  };

  for (const deckEl of root.querySelectorAll('[data-deck-ms]')) {
    mountDeck(deckEl);
  }

  // Horizontal milestone selector tabs + keyboard navigation
  const tabs = [...root.querySelectorAll('.ms-tab')];
  const panels = [...root.querySelectorAll('[data-panel]')];
  const selectTab = (id, focusTab = false) => {
    tabs.forEach((btn) => {
      const selected = btn.dataset.tab === id;
      btn.setAttribute('aria-selected', String(selected));
      btn.tabIndex = selected ? 0 : -1;
      if (selected) {
        btn.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        if (focusTab) btn.focus();
      }
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== id;
    });
    resumeActiveDecks();
  };

  tabs.forEach((btn, idx) => {
    const onClick = (e) => {
      if (e.detail) btn.blur();
      selectTab(btn.dataset.tab);
    };
    const onKey = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        selectTab(tabs[(idx + 1) % tabs.length].dataset.tab, true);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        selectTab(tabs[(idx - 1 + tabs.length) % tabs.length].dataset.tab, true);
      } else if (e.key === 'Home') {
        e.preventDefault();
        selectTab(tabs[0].dataset.tab, true);
      } else if (e.key === 'End') {
        e.preventDefault();
        selectTab(tabs[tabs.length - 1].dataset.tab, true);
      }
    };
    btn.addEventListener('click', onClick);
    btn.addEventListener('keydown', onKey);
    cleanups.push(() => {
      btn.removeEventListener('click', onClick);
      btn.removeEventListener('keydown', onKey);
    });
  });

  // Viewer controls, backdrop click, keyboard & swipe
  const onPrev = (e) => {
    if (e.detail) vPrev?.blur();
    renderViewerItem(activeIdx - 1, true);
  };
  const onNext = (e) => {
    if (e.detail) vNext?.blur();
    renderViewerItem(activeIdx + 1, true);
  };
  const onCloseClick = (e) => {
    if (e.detail) vClose?.blur();
    closeViewer(e.detail === 0);
  };
  vClose?.addEventListener('click', onCloseClick);
  vPrev?.addEventListener('click', onPrev);
  vNext?.addEventListener('click', onNext);

  const onDialogClick = (e) => {
    const t = e.target;
    if (t === dialog || t?.hasAttribute?.('data-v-room')) closeViewer(false);
  };
  const onDialogCancel = (e) => {
    e.preventDefault();
    closeViewer(true);
  };
  dialog?.addEventListener('click', onDialogClick);
  dialog?.addEventListener('cancel', onDialogCancel);

  let swipeX0 = null;
  const onPointerDown = (e) => {
    if (e.target.closest('.ms-v-hud')) return;
    swipeX0 = e.clientX;
  };
  const onPointerUp = (e) => {
    if (swipeX0 === null) return;
    const dx = e.clientX - swipeX0;
    swipeX0 = null;
    if (Math.abs(dx) > 54) renderViewerItem(activeIdx + (dx < 0 ? 1 : -1), true);
  };
  stageEl?.addEventListener('pointerdown', onPointerDown);
  stageEl?.addEventListener('pointerup', onPointerUp);

  const onKeyDown = (e) => {
    if (!dialog || !dialog.open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeViewer(true);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      renderViewerItem(activeIdx - 1, true);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      renderViewerItem(activeIdx + 1, true);
    } else if (e.key === ' ' && activeItems[activeIdx]?.type === 'video') {
      if (e.target?.tagName === 'BUTTON' || e.target?.tagName === 'INPUT') return;
      e.preventDefault();
      togglePlay();
    }
  };
  window.addEventListener('keydown', onKeyDown);

  const unHeader = mountAppHeader(root);
  mountScrollFade(root);

  return () => {
    unHeader();
    cleanups.forEach((fn) => fn());
    vClose?.removeEventListener('click', onCloseClick);
    vPrev?.removeEventListener('click', onPrev);
    vNext?.removeEventListener('click', onNext);
    dialog?.removeEventListener('click', onDialogClick);
    dialog?.removeEventListener('cancel', onDialogCancel);
    stageEl?.removeEventListener('pointerdown', onPointerDown);
    stageEl?.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('keydown', onKeyDown);
    if (closeTimer !== null) clearTimeout(closeTimer);
    lockScroll(false);
  };
}
