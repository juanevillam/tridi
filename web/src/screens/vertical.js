// Dedicated Vertical Landings: /humanoids, /rovers, /industrial, /electronics.
// Shares Unified Topbar (header.js), Platform Switcher + Closing + Footer (navigation.js),
// and Design System tokens (docs/design-system.md) without loading MuJoCo WASM, STLs, or MediaPipe.
import './vertical.css';
import { appHeaderHTML, mountAppHeader } from '../header.js';
import {
  VERTICALS,
  closingSectionHTML,
  footerHTML,
  getVertical,
  platformBarHTML,
  toolLabelHTML,
  toolSubHTML,
  toolsForVertical,
  verticalLabelHTML,
  verticalSubHTML,
} from '../navigation.js';
import { prefetch } from '../router.js';
import { A, T } from './strings/verticals.js';

const MEDIA = `${import.meta.env.BASE_URL}media/`;

const ICON_PLAY =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 3.2L13 8l-8.5 4.8V3.2z" fill="currentColor"/></svg>';
const ICON_PAUSE =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h2.6v10H4V3zm5.4 0H12v10H9.4V3z" fill="currentColor"/></svg>';

const reducedMotionQuery =
  typeof window !== 'undefined' ? window.matchMedia?.('(prefers-reduced-motion: reduce)') : null;
const isReducedMotion = () => Boolean(reducedMotionQuery?.matches);

// Literal T(...) maps so web/scripts/check-i18n.mjs statically validates every key.
const HERO_COPY = {
  humanoids: {
    status: () => T('status.live'),
    title: () => T('h.title'),
    lede: () => T('h.lede'),
    metrics: [() => T('h.m1'), () => T('h.m2'), () => T('h.m3')],
    ctaPrimary: { label: () => T('h.ctaPrimary'), href: '/simulations', warm: 'simulations' },
    ctaSecondary: { label: () => T('h.ctaSecondary'), href: '/#capture', warm: '' },
  },
  rovers: {
    status: () => T('status.live'),
    title: () => T('r.title'),
    lede: () => T('r.lede'),
    metrics: [() => T('r.m1'), () => T('r.m2'), () => T('r.m3')],
    ctaPrimary: { label: () => T('r.ctaPrimary'), href: '/simulations/luigi_lab4', warm: 'simulations' },
    ctaSecondary: { label: () => T('r.ctaSecondary'), href: '/milestones', warm: 'milestones' },
  },
  industrial: {
    status: () => T('status.live'),
    title: () => T('i.title'),
    lede: () => T('i.lede'),
    metrics: [() => T('i.m1'), () => T('i.m2'), () => T('i.m3')],
    ctaPrimary: { label: () => T('i.ctaPrimary'), href: '/assembler', warm: 'assembler' },
    ctaSecondary: { label: () => T('i.ctaSecondary'), href: '/simulations/factory_cell', warm: 'simulations' },
  },
  electronics: {
    status: () => T('status.preview'),
    title: () => T('e.title'),
    lede: () => T('e.lede'),
    metrics: [() => T('e.m1'), () => T('e.m2'), () => T('e.m3')],
    ctaPrimary: { label: () => T('e.ctaPrimary'), href: '#teams', warm: '' },
    ctaSecondary: { label: () => T('e.ctaSecondary'), href: '/rovers', warm: 'rovers' },
  },
};

function renderStageHTML(id) {
  if (id === 'humanoids') {
    return `<div class="vt-stage-card">
      <div class="vt-media-frame vt-media-frame--wide">
        <video class="vt-video" data-vt-video="humanoids" data-autoplay-visible="1" src="${MEDIA}caminar.mp4" width="960" height="540" muted loop playsinline preload="metadata" disablepictureinpicture></video>
      </div>
      <div class="vt-stage-bar">
        <p class="vt-stage-cap">${T('h.stageCap')}</p>
        <button type="button" class="vt-media-play" data-video-toggle="humanoids" ${A({ 'aria-label': 'aria.playVideo' })}>
          ${ICON_PAUSE}<span>${T('r.pause')}</span>
        </button>
      </div>
    </div>`;
  }

  if (id === 'rovers') {
    return `<div class="vt-stage-card">
      <div class="vt-stage-bar">
        <div class="vt-tabs" role="tablist" ${A({ 'aria-label': 'aria.videoTabs' })}>
          <button type="button" class="vt-tab active" role="tab" aria-selected="true" data-rover-tab="sim2real" data-src="${MEDIA}luigi-sim2real.mp4">${T('r.tab.sim2real')}</button>
          <button type="button" class="vt-tab" role="tab" aria-selected="false" data-rover-tab="hardware" data-src="${MEDIA}luigi-hardware.mp4">${T('r.tab.hardware')}</button>
        </div>
        <button type="button" class="vt-media-play" data-video-toggle="rovers" ${A({ 'aria-label': 'aria.playVideo' })}>
          ${ICON_PLAY}<span>${T('r.play')}</span>
        </button>
      </div>
      <div class="vt-media-frame vt-media-frame--portrait">
        <video class="vt-video" data-vt-video="rovers" src="${MEDIA}luigi-sim2real.mp4" poster="${MEDIA}luigi-real-frente.jpg" width="480" height="640" muted loop playsinline preload="metadata" disablepictureinpicture></video>
      </div>
      <p class="vt-stage-cap">${T('r.videoHint')}</p>
    </div>`;
  }

  if (id === 'industrial') {
    return `<div class="vt-stage-card">
      <div class="vt-pipe-head">
        <p class="vt-pipe-title">${T('i.pipe.title')}</p>
      </div>
      <div class="vt-pipe-steps">
        <div class="vt-pipe-step"><span>${T('i.pipe.s1k')}</span><b>${T('i.pipe.s1v')}</b></div>
        <div class="vt-pipe-step"><span>${T('i.pipe.s2k')}</span><b>${T('i.pipe.s2v')}</b></div>
        <div class="vt-pipe-step"><span>${T('i.pipe.s3k')}</span><b>${T('i.pipe.s3v')}</b></div>
        <div class="vt-pipe-step"><span>${T('i.pipe.s4k')}</span><b>${T('i.pipe.s4v')}</b></div>
      </div>
      <div class="vt-pipe-tags">
        <span class="vt-chip">01_batch_mixer.dxf</span>
        <span class="vt-chip">02_silo_packaging.dxf</span>
        <span class="vt-chip">06_pilot_plant_hydromet.dxf</span>
      </div>
    </div>`;
  }

  return `<div class="vt-stage-card">
    <div class="vt-pipe-head">
      <p class="vt-pipe-title">${T('e.preview.head')}</p>
    </div>
    <ul class="vt-spec-list">
      <li class="vt-spec-row"><strong>Arduino UNO R3 (ATmega328P)</strong><span>5.0\u00A0V · 2048\u00A0B SRAM · Timer0/1/2</span></li>
      <li class="vt-spec-row"><strong>ESP32 DevKit V1</strong><span>3.3\u00A0V · LEDC PWM · I2C 21/22</span></li>
      <li class="vt-spec-row"><strong>PLC Siemens S7-1200</strong><span>24.0\u00A0V DC DI/DO · AI0/AI1 · PTO</span></li>
      <li class="vt-spec-row"><strong>L298N vs TB6612FNG</strong><span>1.4\u00A0V drop (2.0\u00A0A) vs 0.2\u00A0V drop (1.2\u00A0A)</span></li>
    </ul>
  </div>`;
}

function renderBodySectionsHTML(id) {
  if (id === 'humanoids') {
    return `
      <section class="vt-section" aria-labelledby="vt-models-title">
        <div class="vt-section-head">
          <h2 id="vt-models-title">${T('sec.models')}</h2>
        </div>
        <div class="vt-grid-2">
          <article class="vt-card">
            <p class="vt-card-kicker">${T('h.g1.kicker')}</p>
            <h3 class="vt-card-title">${T('h.g1.title')}</h3>
            <p class="vt-card-body">${T('h.g1.body')}</p>
            <div class="vt-card-actions">
              <a class="vt-card-link" href="/simulations" data-warm="simulations">${T('h.g1.cta')}</a>
            </div>
          </article>
          <article class="vt-card">
            <p class="vt-card-kicker">${T('h.h1.kicker')}</p>
            <h3 class="vt-card-title">${T('h.h1.title')}</h3>
            <p class="vt-card-body">${T('h.h1.body')}</p>
            <div class="vt-card-actions">
              <a class="vt-card-link" href="/simulations" data-warm="simulations">${T('h.h1.cta')}</a>
            </div>
          </article>
        </div>
      </section>
      <section class="vt-section" aria-labelledby="vt-pipe-title">
        <div class="vt-section-head">
          <h2 id="vt-pipe-title">${T('sec.pipeline')}</h2>
        </div>
        <div class="vt-grid-3">
          <article class="vt-card">
            <p class="vt-card-kicker">01 · /#capture</p>
            <h3 class="vt-card-title">${T('h.anc.capture.title')}</h3>
            <p class="vt-card-body">${T('h.anc.capture.body')}</p>
            <div class="vt-card-actions">
              <a class="vt-card-link" href="/#capture">${T('h.anc.cta')}</a>
            </div>
          </article>
          <article class="vt-card">
            <p class="vt-card-kicker">02 · /#gym</p>
            <h3 class="vt-card-title">${T('h.anc.gym.title')}</h3>
            <p class="vt-card-body">${T('h.anc.gym.body')}</p>
            <div class="vt-card-actions">
              <a class="vt-card-link" href="/#gym">${T('h.anc.cta')}</a>
            </div>
          </article>
          <article class="vt-card">
            <p class="vt-card-kicker">03 · /#policy</p>
            <h3 class="vt-card-title">${T('h.anc.policy.title')}</h3>
            <p class="vt-card-body">${T('h.anc.policy.body')}</p>
            <div class="vt-card-actions">
              <a class="vt-card-link" href="/#policy">${T('h.anc.cta')}</a>
            </div>
          </article>
        </div>
      </section>`;
  }

  if (id === 'rovers') {
    const galleryItems = [
      { src: `${MEDIA}luigi-cad-robot.png`, w: 1980, h: 660, cad: true, cap: T('r.gal.cadRobot') },
      { src: `${MEDIA}luigi-cad-chasis.png`, w: 1320, h: 660, cad: true, cap: T('r.gal.cadChasis') },
      { src: `${MEDIA}luigi-cad-planta.png`, w: 1320, h: 960, cad: true, cap: T('r.gal.cadPlanta') },
      { src: `${MEDIA}luigi-real-frente.jpg`, w: 720, h: 480, cad: false, cap: T('r.gal.realFrente') },
      { src: `${MEDIA}luigi-real-sensores.jpg`, w: 720, h: 540, cad: false, cap: T('r.gal.realSensores') },
      { src: `${MEDIA}luigi-real-cables.jpg`, w: 720, h: 480, cad: false, cap: T('r.gal.realCables') },
    ];
    return `
      <section class="vt-section" aria-labelledby="vt-rovers-title">
        <div class="vt-section-head">
          <h2 id="vt-rovers-title">${T('sec.models')}</h2>
        </div>
        <div class="vt-grid-2">
          <article class="vt-card">
            <p class="vt-card-kicker">${T('r.l3.kicker')}</p>
            <h3 class="vt-card-title">${T('r.l3.title')}</h3>
            <p class="vt-card-body">${T('r.l3.body')}</p>
            <div class="vt-card-actions">
              <a class="vt-card-link" href="/simulations/luigi_lab3" data-warm="simulations">${T('r.l3.cta')}</a>
            </div>
          </article>
          <article class="vt-card">
            <p class="vt-card-kicker">${T('r.l4.kicker')}</p>
            <h3 class="vt-card-title">${T('r.l4.title')}</h3>
            <p class="vt-card-body">${T('r.l4.body')}</p>
            <div class="vt-card-actions">
              <a class="vt-card-link" href="/simulations/luigi_lab4" data-warm="simulations">${T('r.l4.cta')}</a>
            </div>
          </article>
        </div>
      </section>
      <section class="vt-section" aria-labelledby="vt-gallery-title">
        <div class="vt-section-head">
          <h2 id="vt-gallery-title">${T('sec.gallery')}</h2>
        </div>
        <div class="vt-gallery" role="region" ${A({ 'aria-label': 'aria.gallery' })}>
          ${galleryItems
            .map(
              (item) => `<figure class="vt-gal-item">
                <div class="vt-gal-frame${item.cad ? ' is-cad' : ''}">
                  <img src="${item.src}" width="${item.w}" height="${item.h}" alt="" loading="lazy" decoding="async" />
                </div>
                <figcaption>${item.cap}</figcaption>
              </figure>`,
            )
            .join('')}
        </div>
      </section>`;
  }

  if (id === 'industrial') {
    return `
      <section class="vt-section" aria-labelledby="vt-ind-title">
        <div class="vt-section-head">
          <h2 id="vt-ind-title">${T('sec.models')}</h2>
        </div>
        <div class="vt-grid-2">
          <article class="vt-card">
            <p class="vt-card-kicker">${T('i.asm.kicker')}</p>
            <h3 class="vt-card-title">${T('i.asm.title')}</h3>
            <p class="vt-card-body">${T('i.asm.body')}</p>
            <div class="vt-card-actions">
              <a class="vt-card-link" href="/assembler" data-warm="assembler">${T('i.asm.cta')}</a>
            </div>
          </article>
          <article class="vt-card">
            <p class="vt-card-kicker">${T('i.fc.kicker')}</p>
            <h3 class="vt-card-title">${T('i.fc.title')}</h3>
            <p class="vt-card-body">${T('i.fc.body')}</p>
            <div class="vt-card-actions">
              <a class="vt-card-link" href="/simulations/factory_cell" data-warm="simulations">${T('i.fc.cta')}</a>
            </div>
          </article>
        </div>
      </section>`;
  }

  return `
    <section class="vt-section" aria-labelledby="vt-elec-title">
      <div class="vt-section-head">
        <h2 id="vt-elec-title">${T('sec.roadmap')}</h2>
        <p>${T('e.preview.note')}</p>
      </div>
      <div class="vt-grid-3">
        <article class="vt-card">
          <p class="vt-card-kicker">${T('e.c1.kicker')}</p>
          <h3 class="vt-card-title">${T('e.c1.title')}</h3>
          <p class="vt-card-body">${T('e.c1.body')}</p>
        </article>
        <article class="vt-card">
          <p class="vt-card-kicker">${T('e.c2.kicker')}</p>
          <h3 class="vt-card-title">${T('e.c2.title')}</h3>
          <p class="vt-card-body">${T('e.c2.body')}</p>
        </article>
        <article class="vt-card">
          <p class="vt-card-kicker">${T('e.c3.kicker')}</p>
          <h3 class="vt-card-title">${T('e.c3.title')}</h3>
          <p class="vt-card-body">${T('e.c3.body')}</p>
        </article>
      </div>
    </section>`;
}

function renderToolsSectionHTML(id) {
  const tools = toolsForVertical(id);
  if (!tools.length) {
    const liveSiblings = VERTICALS.filter((v) => v.status === 'live');
    return `
      <section class="vt-section" aria-labelledby="vt-tools-title">
        <div class="vt-section-head">
          <h2 id="vt-tools-title">${T('sec.siblings')}</h2>
        </div>
        <div class="vt-soon-banner">
          <div class="vt-soon-copy">
            <h3>${T('e.soonTitle')}</h3>
            <p>${T('e.soonBody')}</p>
          </div>
          <span class="vt-kicker is-soon"><span class="vt-kicker-dot" aria-hidden="true"></span>${T('badge.soon')}</span>
        </div>
        <div class="vt-grid-3">
          ${liveSiblings
            .map(
              (v) => `<a class="vt-tool-card" href="${v.href}" data-warm="${v.id}">
                <span class="vt-tool-icon" aria-hidden="true">${v.icon}</span>
                <b>${verticalLabelHTML(v)}</b>
                <span class="vt-tool-sub">${verticalSubHTML(v)}</span>
                <span class="vt-tool-cta">${T('cta.exploreVertical')}</span>
              </a>`,
            )
            .join('')}
        </div>
      </section>`;
  }

  // Per-vertical deep links while keeping strict tool exclusivity from VERTICALS registry.
  const cardsHTML = tools
    .map((tool) => {
      if (id === 'rovers' && tool.id === 'simulations') {
        return `<article class="vt-tool-card vt-tool-card--multi">
          <span class="vt-tool-icon" aria-hidden="true">${tool.icon}</span>
          <b>${toolLabelHTML(tool)}</b>
          <span class="vt-tool-sub">${toolSubHTML(tool)}</span>
          <div class="vt-card-actions">
            <a class="vt-card-link" href="/simulations/luigi_lab4" data-warm="simulations">${T('r.tool.simLab4')}</a>
            <a class="vt-card-link" href="/simulations/luigi_lab3" data-warm="simulations">${T('r.tool.simLab3')}</a>
          </div>
        </article>`;
      }
      const href = id === 'industrial' && tool.id === 'simulations' ? '/simulations/factory_cell' : tool.href;
      return `<a class="vt-tool-card" href="${href}" data-warm="${tool.id}">
        <span class="vt-tool-icon" aria-hidden="true">${tool.icon}</span>
        <b>${toolLabelHTML(tool)}</b>
        <span class="vt-tool-sub">${toolSubHTML(tool)}</span>
        <span class="vt-tool-cta">${T('cta.openTool')}</span>
      </a>`;
    })
    .join('');

  return `
    <section class="vt-section" aria-labelledby="vt-tools-title">
      <div class="vt-section-head">
        <h2 id="vt-tools-title">${T('sec.tools')}</h2>
        <p>${T('sec.toolsSub')}</p>
      </div>
      <div class="vt-grid-tools">
        ${cardsHTML}
      </div>
    </section>`;
}

export function mount(root, _context, params = []) {
  const verticalId = getVertical(params[0])?.id ?? 'humanoids';
  const vertical = getVertical(verticalId);
  const copy = HERO_COPY[verticalId] ?? HERO_COPY.humanoids;
  const isPreview = vertical?.status === 'preview';

  root.innerHTML = `
  <section class="page vertical-page" data-vertical="${verticalId}">
    ${appHeaderHTML({ current: verticalId })}
    <main class="vt-main">
      ${platformBarHTML({ current: verticalId })}
      <section class="vt-hero">
        <div class="vt-hero-copy">
          <span class="vt-kicker${isPreview ? ' is-soon' : ''}"><span class="vt-kicker-dot" aria-hidden="true"></span>${copy.status()}</span>
          <h1 class="vt-hero-title">${copy.title()}</h1>
          <p class="vt-hero-lede">${copy.lede()}</p>
          <ul class="vt-metrics">
            ${copy.metrics.map((m) => `<li>${m()}</li>`).join('')}
          </ul>
          <div class="vt-cta-row">
            <a class="btn btn-signal" href="${copy.ctaPrimary.href}"${copy.ctaPrimary.warm ? ` data-warm="${copy.ctaPrimary.warm}"` : ''}>${copy.ctaPrimary.label()}</a>
            <a class="btn" href="${copy.ctaSecondary.href}"${copy.ctaSecondary.warm ? ` data-warm="${copy.ctaSecondary.warm}"` : ''}>${copy.ctaSecondary.label()}</a>
          </div>
        </div>
        ${renderStageHTML(verticalId)}
      </section>
      ${renderBodySectionsHTML(verticalId)}
      ${renderToolsSectionHTML(verticalId)}
    </main>
    ${closingSectionHTML({ current: verticalId, isChapter: false, footer: footerHTML({ anchorPrefix: '/' }) })}
  </section>`;

  const cleanups = [mountAppHeader(root)];

  for (const link of root.querySelectorAll('.vt-main [data-warm], .closing [data-warm]')) {
    const warm = () => prefetch(link.dataset.warm);
    link.addEventListener('pointerenter', warm, { once: true });
    link.addEventListener('focus', warm, { once: true });
    cleanups.push(() => {
      link.removeEventListener('pointerenter', warm);
      link.removeEventListener('focus', warm);
    });
  }

  // Video controls & visibility-gated playback (never stream heavy rover videos until user clicks; pause off-screen).
  const videos = [...root.querySelectorAll('video[data-vt-video]')];
  const syncToggleUI = (video) => {
    const key = video.dataset.vtVideo;
    const btn = root.querySelector(`[data-video-toggle="${key}"]`);
    if (!btn) return;
    const playing = !video.paused && !video.ended;
    btn.innerHTML = `${playing ? ICON_PAUSE : ICON_PLAY}<span>${playing ? T('r.pause') : T('r.play')}</span>`;
  };

  for (const video of videos) {
    const onState = () => syncToggleUI(video);
    video.addEventListener('play', onState);
    video.addEventListener('pause', onState);
    cleanups.push(() => {
      video.removeEventListener('play', onState);
      video.removeEventListener('pause', onState);
      video.pause();
    });

    const toggleBtn = root.querySelector(`[data-video-toggle="${video.dataset.vtVideo}"]`);
    if (toggleBtn) {
      const onToggle = () => {
        if (video.paused) video.play().catch(() => {});
        else video.pause();
      };
      toggleBtn.addEventListener('click', onToggle);
      cleanups.push(() => toggleBtn.removeEventListener('click', onToggle));
    }
    syncToggleUI(video);
  }

  if (videos.length && typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target;
          if (!entry.isIntersecting) {
            video.pause();
          } else if (video.dataset.autoplayVisible === '1' && !isReducedMotion()) {
            video.play().catch(() => {});
          }
        }
      },
      { threshold: 0.25 },
    );
    for (const video of videos) io.observe(video);
    cleanups.push(() => io.disconnect());
  }

  const onVisibility = () => {
    if (document.hidden) {
      for (const video of videos) video.pause();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility));

  // Rovers tab switcher between luigi-sim2real.mp4 and luigi-hardware.mp4 (lazy src swap on click).
  const roverVideo = root.querySelector('video[data-vt-video="rovers"]');
  const roverTabs = [...root.querySelectorAll('[data-rover-tab]')];
  for (const tab of roverTabs) {
    const onTab = () => {
      for (const other of roverTabs) {
        const active = other === tab;
        other.classList.toggle('active', active);
        other.setAttribute('aria-selected', String(active));
      }
      if (roverVideo && tab.dataset.src && roverVideo.getAttribute('src') !== tab.dataset.src) {
        roverVideo.pause();
        roverVideo.setAttribute('src', tab.dataset.src);
        roverVideo.load();
        syncToggleUI(roverVideo);
      }
    };
    tab.addEventListener('click', onTab);
    cleanups.push(() => tab.removeEventListener('click', onTab));
  }

  // Anchor scroll helper for direct loads (/electronics#teams), cross-route links, and tridi:anchor.
  const scrollToHash = (hash, immediate = false) => {
    if (!hash || hash.startsWith('#/')) return false;
    let target = null;
    try {
      target = root.querySelector(hash);
    } catch {
      return false;
    }
    if (!target) return false;
    const header = root.querySelector('.app-topbar');
    const headerOffset = header ? Math.ceil(header.getBoundingClientRect().height + 24) : 84; // clear sticky .app-topbar (12px top + 12px gap)
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerOffset);
    window.scrollTo({ top, behavior: immediate || isReducedMotion() ? 'auto' : 'smooth' });
    return true;
  };

  for (const link of root.querySelectorAll('a[href^="#"]:not([href^="#/"])')) {
    const onAnchor = (event) => {
      const href = link.getAttribute('href');
      if (!scrollToHash(href, false)) return;
      event.preventDefault();
    };
    link.addEventListener('click', onAnchor);
    cleanups.push(() => link.removeEventListener('click', onAnchor));
  }

  if (location.hash && !location.hash.startsWith('#/')) {
    if (!scrollToHash(location.hash, true)) {
      window.scrollTo(0, 0);
    }
  }
  const onAnchorEvent = (event) => {
    if (!scrollToHash(event.detail, false) && event.detail === '#home') {
      window.scrollTo({ top: 0, behavior: isReducedMotion() ? 'auto' : 'smooth' });
    }
  };
  window.addEventListener('tridi:anchor', onAnchorEvent);
  cleanups.push(() => window.removeEventListener('tridi:anchor', onAnchorEvent));

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
