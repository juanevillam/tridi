// Dedicated 3D scrollable landing for Tridi Rovers (/rovers).
// Exact Hero + 3-Chapter + Compact Closing + Footer parity with Humanoids (/),
// featuring V1 (luigi_lab3 fixed) vs V2 (luigi_lab4 SG90) CAD hardware, fixed maze checkpoints,
// live dynamic obstacle placement & avoidance, and smooth cenital -> front -> rear -> cenital camera.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../landing.css';
import './rovers.css';
import { LOGO, WORDMARK } from '../../brand.js';
import { loader } from '../../loader.js';
import { langSwitch, onLang } from '../../i18n.js';
import { prefetch } from '../../router.js';
import {
  bindNavDropLinking,
  closingSectionHTML,
  footerHTML,
  navDropdownAriaAttrs,
  navDropdownSectionsHTML,
  navTriggerLabelHTML,
  platformBarHTML,
  positionNavPanel,
} from '../../navigation.js';
import { createRoversWorld } from './rovers-world.js';
import { A, T } from './strings.js';

gsap.registerPlugin(ScrollTrigger);

export const title = { es: 'Rovers', en: 'Rovers' };

const MEDIA = `${import.meta.env.BASE_URL}media/`;
const reducedMotionQuery =
  typeof window !== 'undefined' ? window.matchMedia?.('(prefers-reduced-motion: reduce)') : null;
const isReducedMotion = () => Boolean(reducedMotionQuery?.matches);
const narrow = () => window.innerWidth <= 860;

// Camera choreography:
// 1. Hero: overhead (cenital)
// 2. Ch. 1 (Design): stays overhead into early scroll, then swoops down to front of rover
// 3. Ch. 2 (Sensors): orbits smoothly behind rover (chase view down maze corridors)
// 4. Ch. 3 (Sim-to-Real): elevated rear-3/4 pull-up
// 5. Closing: returns to initial overhead (cenital) view
const SHOTS = {
  hero: { az: -90, el: 78, dist: 6.2, aim: 0.12, shift: 0.2, rel: 0 },
  design: { az: 16, el: 40, dist: 1.32, aim: 0.12, shift: 0.19, rel: 1 }, // camY > 0.96 m clears [4,7] wall (0.756 m) across Ch. 1
  sensors: { az: 170, el: 45, dist: 2.4, aim: 0.1, shift: 0.19, rel: 1 }, // frames Luigi + ~0.95 m-ahead obstacle inside frustum
  sim2real: { az: 150, el: 48, dist: 2.55, aim: 0.1, shift: 0.18, rel: 1 }, // elevated rear-3/4 clearing outer corner walls
  close: { az: -90, el: 78, dist: 7.0, aim: 0.12, shift: 0, rel: 0 },
};

const narrowShot = (shot, name) => {
  if (name === 'hero') return { ...shot, az: -90, el: 80, dist: 6.8, aim: 0.1, shift: 0, rel: 0 };
  if (name === 'design') return { ...shot, az: 14, el: 41, dist: 1.38, aim: -0.06, shift: 0, rel: 1 }; // upper framing above bottom card, camY > 0.84 m clears [4,7] wall
  if (name === 'sensors') return { ...shot, az: 180, el: 46, dist: 4.15, aim: 0.1, shift: 0, rel: 1 }; // clears outer walls + keeps Luigi & entire obstacle crate well inside horizontal/vertical margins across all stages & dodge parities
  if (name === 'sim2real') return { ...shot, az: 150, el: 50, dist: 2.95, aim: -0.16, shift: 0, rel: 1 };
  return { ...shot, dist: shot.dist * 1.1, shift: 0, rel: 0 };
};

const MAZE_STAGES = [
  { progress: 0.21, scrollFrac: 0.15, labelKey: 'stage.0.label', verdictKey: 'stage.0.verdict', textKey: 'stage.0.text' },
  { progress: 0.59, scrollFrac: 0.58, labelKey: 'stage.1.label', verdictKey: 'stage.1.verdict', textKey: 'stage.1.text' },
  { progress: 0.82, scrollFrac: 0.84, labelKey: 'stage.2.label', verdictKey: 'stage.2.verdict', textKey: 'stage.2.text' },
];

const ICON_PLAY =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 3.2L13 8l-8.5 4.8V3.2z" fill="currentColor"/></svg>';

export function mount(root) {
  document.documentElement.classList.add('is-landing');

  root.innerHTML = `
  <div class="landing rovers-landing">
    <div class="film" aria-hidden="true"></div>
    <div class="film-hud" data-shot="hero">
      <i class="corner tl" aria-hidden="true"></i><i class="corner tr" aria-hidden="true"></i><i class="corner bl" aria-hidden="true"></i><i class="corner br" aria-hidden="true"></i>
      <div class="sim-readout" data-state="stand">
        <span class="sim-live-pill"><i class="sim-state-dot" aria-hidden="true"></i><span data-rv="hud-live">${T('hud.live')}</span></span>
        <span>${T('hud.radar')} <b data-rv="hud-neck">+0°</b></span>
        <span>${T('hud.dist')} <b data-rv="hud-dist">120</b>\u00A0cm</span>
        <span>50\u00A0Hz</span>
        <button type="button" class="sim-info-btn" aria-label="Info">ⓘ<span class="sim-tooltip" role="tooltip">${T('hud.info')}</span></button>
      </div>
    </div>
    <div class="film-shade" aria-hidden="true"></div>
    <div class="film-wash" aria-hidden="true"></div>
    <div class="boot" role="status" aria-live="polite">
      <div class="boot-head">
        ${loader('small')}
        <div class="boot-meta">
          <p class="boot-title"><span>${T('boot.title')}</span><b class="boot-files">0/8</b></p>
          <p class="boot-line">${T('boot.line')}</p>
        </div>
      </div>
      <div class="boot-track"><i class="boot-bar"></i></div>
    </div>

    <header class="topbar">
      <a class="wordmark" href="/" ${A({ 'aria-label': 'nav.home' })}>${LOGO}${WORDMARK}</a>
      <nav class="topnav" ${A({ 'aria-label': 'nav.menu' })}>
        <a class="nav-direct active" href="#design">${T('nav.design')}</a>
        <a class="nav-direct" href="#sensors">${T('nav.sensors')}</a>
        <a class="nav-direct" href="#sim2real">${T('nav.sim2real')}</a>
        <i class="topnav-sep" aria-hidden="true"></i>
        <div class="nav-drop is-current" data-drop="platform">
          <button type="button" class="nav-drop-btn active" aria-expanded="false" aria-controls="rovers-nav-platform-panel">
            <span>${navTriggerLabelHTML()}</span>
            <svg class="nav-chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div id="rovers-nav-platform-panel" class="nav-drop-panel nav-drop-platform" role="region" ${navDropdownAriaAttrs()}>
            <div class="nav-drop-inner">
              ${navDropdownSectionsHTML({ current: 'rovers' })}
            </div>
          </div>
        </div>
        <a class="nav-direct" href="/milestones" data-warm="milestones">${T('nav.milestones')}</a>
        <div class="nav-mobile-footer">
          <a class="btn btn-signal nav-mobile-cta" href="/simulations/luigi_lab4" data-warm="simulations">${T('nav.openStudio')}</a>
        </div>
      </nav>
      <div class="topbar-right">
        <div class="topbar-desktop-lang">${langSwitch()}</div>
        <a class="btn btn-small topbar-desktop-cta" href="/simulations/luigi_lab4" data-warm="simulations">${T('nav.openStudio')}</a>
        <button type="button" class="nav-mobile-btn" aria-expanded="false" ${A({ 'aria-label': 'nav.menu' })}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path class="i-bars" d="M3 5.5h14M3 10h14M3 14.5h14"/><path class="i-close" d="M4.5 4.5l11 11M15.5 4.5l-11 11"/></svg>
        </button>
      </div>
    </header>

    <section class="chapter hero" id="home" data-shot="hero" data-hold="0.86">
      <div class="caption hero-caption">
        ${platformBarHTML({ current: 'rovers' })}
        <h1>${T('hero.title')}</h1>
        <p class="hero-lede"><span class="only-wide">${T('hero.lede')}</span><span class="only-narrow">${T('hero.ledeShort')}</span></p>
        <ol class="hero-steps" ${A({ 'aria-label': 'hero.how' })}>
          <li><b>01</b><span class="only-wide">${T('hero.step1')}</span><span class="only-narrow">${T('hero.step1Short')}</span></li>
          <li><b>02</b>${T('hero.step2')}</li>
          <li><b>03</b><span class="only-wide">${T('hero.step3')}</span><span class="only-narrow">${T('hero.step3Short')}</span></li>
        </ol>
        <div class="cta-row">
          <a class="btn btn-signal hero-push" href="/simulations/luigi_lab4" data-warm="simulations">${T('hero.ctaPrimary')}</a>
          <a class="btn btn-ghost" href="#design">${T('hero.ctaSecondary')}</a>
        </div>
      </div>
    </section>

    <section class="chapter rovers-design" id="design" data-shot="design" data-hold="0.74">
      <div class="sticky">
        <div class="caption capture-caption rovers-design-caption panel">
          <p class="product">${T('design.kicker')}</p>
          <h2><span class="only-wide">${T('design.title')}</span><span class="only-narrow">${T('design.titleShort')}</span></h2>
          <p class="rovers-design-lede"><span class="only-wide">${T('design.lede')}</span><span class="only-narrow">${T('design.ledeShort')}</span></p>
          <div class="rovers-hw-diff" role="group" ${A({ 'aria-label': 'design.modeGroup' })}>
            <button type="button" class="rovers-hw-card" data-radar-mode="fixed" aria-pressed="false">
              <span class="rovers-hw-tag">${T('design.v1Tag')}</span>
              <span class="rovers-hw-spec">${T('design.v1Spec')}</span>
            </button>
            <button type="button" class="rovers-hw-card" data-radar-mode="sg90" aria-pressed="true">
              <span class="rovers-hw-tag">${T('design.v2Tag')}</span>
              <span class="rovers-hw-spec">${T('design.v2Spec')}</span>
            </button>
          </div>
          <p class="rovers-hw-note" data-rv="hw-note">${T('design.v2Note')}</p>
        </div>
      </div>
    </section>

    <section class="chapter gym rovers-sensors" id="sensors" data-shot="sensors" data-hold="0.82">
      <div class="sticky">
        <div class="caption gym-caption panel">
          <p class="product">${T('sensors.kicker')}</p>
          <h2><span class="only-wide">${T('sensors.title')}</span><span class="only-narrow">${T('sensors.titleShort')}</span></h2>
          <p class="gym-lede"><span class="only-wide">${T('sensors.lede')}</span><span class="only-narrow">${T('sensors.ledeShort')}</span></p>
          <div class="steps-meter">
            <div class="steps-row">
              <p class="steps-now"><b data-rv="dist">120\u00A0cm</b><span>${T('sensors.wallLabel')}</span></p>
              <p class="gym-status"><i class="live-dot" aria-hidden="true"></i><span class="gym-status-body" data-rv="status-body"><span data-rv="neck">+0°</span> · <span data-rv="rpm">0\u00A0RPM</span></span></p>
            </div>
            <div class="steps-axis">
              <div class="axis-track" aria-hidden="true">
                <i class="axis-line"><i class="axis-fill"></i></i>
                ${MAZE_STAGES.map((_, i) => `<i class="axis-tick${i === 0 ? ' on' : ''}" style="--at: ${(100 * i) / (MAZE_STAGES.length - 1)}%"></i>`).join('')}
              </div>
              <div class="axis-stops" role="group" ${A({ 'aria-label': 'sensors.stagesGroup' })}>
                ${MAZE_STAGES.map(
                  (stage, i) => `
                  <button class="axis-stop${i === 0 ? ' on' : ''}" type="button" data-cp="${i}" aria-pressed="${i === 0}" style="--at: ${(100 * i) / (MAZE_STAGES.length - 1)}%">
                    <span class="axis-label">${T(stage.labelKey)}</span>
                    <span class="axis-verdict">${T(stage.verdictKey)}</span>
                  </button>`,
                ).join('')}
              </div>
            </div>
            <div class="stage-detail">
              <span class="stage-text" data-rv="stage-text">${T('stage.0.text')}</span>
            </div>
          </div>
          <div class="gym-controls rovers-controls">
            <button class="btn btn-signal btn-small gym-push" type="button" data-rv-obstacle>${T('sensors.placeObstacle')}</button>
            <button class="btn btn-small rovers-btn-ghost" type="button" data-rv-clear-obs disabled>${T('sensors.clearObstacles')} (<span data-rv="obs-count">0</span>)</button>
            <button class="btn btn-small rovers-btn-ghost rovers-ping-btn" type="button" data-rv-ping>${T('sensors.ping')} <kbd>${T('sensors.keySpace')}</kbd></button>
            <div class="rovers-seg" role="group" ${A({ 'aria-label': 'sensors.modeGroup' })}>
              <button type="button" class="rovers-seg-btn" data-radar-mode="sg90" aria-pressed="true">${T('sensors.modeV2')}</button>
              <button type="button" class="rovers-seg-btn" data-radar-mode="fixed" aria-pressed="false">${T('sensors.modeV1')}</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="chapter policy rovers-s2r" id="sim2real" data-shot="sim2real" data-hold="0.78">
      <div class="sticky">
        <div class="caption policy-caption panel">
          <p class="product">${T('s2r.kicker')}</p>
          <h2><span class="only-wide">${T('s2r.title')}</span><span class="only-narrow">${T('s2r.titleShort')}</span></h2>
          <p class="policy-lede"><span class="only-wide">${T('s2r.lede')}</span><span class="only-narrow">${T('s2r.ledeShort')}</span></p>
          <ul class="specs">
            <li><b>2.3\u00A0KB</b><span><span class="only-wide">${T('s2r.spec0')}</span><span class="only-narrow">${T('s2r.spec0Short')}</span></span></li>
            <li class="spec-sep" aria-hidden="true"></li>
            <li><b>461\u00A0B</b><span><span class="only-wide">${T('s2r.spec1')}</span><span class="only-narrow">${T('s2r.spec1Short')}</span></span></li>
            <li class="spec-sep" aria-hidden="true"></li>
            <li><b>50\u00A0Hz</b><span><span class="only-wide">${T('s2r.spec2')}</span><span class="only-narrow">${T('s2r.spec2Short')}</span></span></li>
            <li class="spec-sep" aria-hidden="true"></li>
            <li><b>0</b><span><span class="only-wide">${T('s2r.spec3')}</span><span class="only-narrow">${T('s2r.spec3Short')}</span></span></li>
          </ul>
          <div class="rovers-evidence" ${A({ 'aria-label': 'ev.label' })}>
            <div class="rovers-ev-head">
              <span class="rovers-ev-kicker">${T('ev.label')}</span>
              <button type="button" class="rovers-ev-play" data-open-video>
                ${ICON_PLAY}<span>${T('ev.watchVideo')}</span>
              </button>
            </div>
            <div class="rovers-ev-strip">
              <button type="button" class="rovers-ev-item" data-open-video>
                <span class="rovers-ev-thumb">
                  <img src="${MEDIA}luigi-real-frente.jpg" width="720" height="480" alt="" loading="lazy" decoding="async" />
                </span>
                <span class="rovers-ev-cap">${T('ev.capReal')}</span>
              </button>
              <button type="button" class="rovers-ev-item" data-open-video>
                <span class="rovers-ev-thumb">
                  <img src="${MEDIA}luigi-real-sensores.jpg" width="720" height="540" alt="" loading="lazy" decoding="async" />
                </span>
                <span class="rovers-ev-cap">${T('ev.capSensors')}</span>
              </button>
              <button type="button" class="rovers-ev-item" data-open-video>
                <span class="rovers-ev-thumb">
                  <img src="${MEDIA}luigi-real-cables.jpg" width="720" height="480" alt="" loading="lazy" decoding="async" />
                </span>
                <span class="rovers-ev-cap">${T('ev.capCad')}</span>
              </button>
            </div>
          </div>
          <a class="btn btn-signal btn-small policy-data" href="/simulations/luigi_lab4" data-warm="simulations">${T('s2r.ctaSim')}</a>
        </div>
      </div>
    </section>

    ${closingSectionHTML({ current: 'rovers', isChapter: true, footer: footerHTML({ anchorPrefix: '/' }) })}

    <div class="rovers-modal" role="dialog" aria-modal="true" aria-labelledby="rovers-modal-title" hidden>
      <div class="rovers-modal-box">
        <div class="rovers-modal-head">
          <h3 id="rovers-modal-title">${T('ev.modalTitle')}</h3>
          <div class="rovers-seg" role="tablist">
            <button type="button" class="rovers-seg-btn" role="tab" aria-selected="true" aria-pressed="true" data-modal-tab="sim2real" data-src="${MEDIA}luigi-sim2real.mp4">${T('ev.tabSim2Real')}</button>
            <button type="button" class="rovers-seg-btn" role="tab" aria-selected="false" aria-pressed="false" data-modal-tab="hardware" data-src="${MEDIA}luigi-hardware.mp4">${T('ev.tabHardware')}</button>
          </div>
          <button type="button" class="rovers-modal-close" data-close-video ${A({ 'aria-label': 'ev.modalClose' })}>×</button>
        </div>
        <div class="rovers-modal-video-wrap">
          <video class="rovers-modal-video" controls playsinline preload="none" poster="${MEDIA}luigi-real-frente.jpg"></video>
        </div>
      </div>
    </div>
  </div>`;

  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => [...root.querySelectorAll(sel)];
  const cleanups = [];
  const on = (target, type, fn, options) => {
    target.addEventListener(type, fn, options);
    cleanups.push(() => target.removeEventListener(type, fn, options));
  };

  // ---- Unified Navbar Dropdowns & Mobile Drawer ----
  const topbarEl = $('.topbar');
  const navDrops = $$('.nav-drop');
  const mobileBtn = $('.nav-mobile-btn');
  let lenis = null;

  const setScrollLock = (locked) => {
    document.documentElement.style.overflow = locked ? 'hidden' : '';
    const parent = topbarEl?.parentElement;
    if (parent) {
      for (const child of parent.children) {
        if (child !== topbarEl && !child.classList.contains('rovers-modal')) {
          child.inert = Boolean(locked);
        }
      }
    }
    if (locked) lenis?.stop();
    else lenis?.start();
  };
  cleanups.push(() => setScrollLock(false));

  let restoringFocus = false;
  let suppressFocusOpen = false;
  const closeAllMenus = ({ restoreFocus = false } = {}) => {
    const focusedDropBtn =
      navDrops.find((drop) => drop.contains(document.activeElement))?.querySelector('.nav-drop-btn') ?? null;
    const wasMenuOpen = Boolean(topbarEl?.classList.contains('menu-open'));
    suppressFocusOpen = Boolean(focusedDropBtn);
    for (const drop of navDrops) {
      drop.classList.remove('open');
      drop.classList.add('dismissed');
      drop.querySelector('.nav-drop-btn')?.setAttribute('aria-expanded', 'false');
    }
    if (topbarEl) topbarEl.classList.remove('menu-open');
    if (mobileBtn) mobileBtn.setAttribute('aria-expanded', 'false');
    setScrollLock(false);
    if (restoreFocus) {
      restoringFocus = true;
      try {
        if (wasMenuOpen && window.innerWidth <= 1000) mobileBtn?.focus();
        else focusedDropBtn?.focus();
      } finally {
        restoringFocus = false;
      }
    }
  };

  for (const drop of navDrops) {
    cleanups.push(bindNavDropLinking(drop));
    const btn = drop.querySelector('.nav-drop-btn');
    on(drop, 'pointerenter', () => {
      if (window.innerWidth <= 1000) return;
      drop.classList.remove('dismissed');
      positionNavPanel(drop);
    });
    on(drop, 'pointerleave', () => {
      if (window.innerWidth <= 1000) return;
      if (!drop.classList.contains('open') && !drop.contains(document.activeElement)) {
        drop.classList.remove('dismissed');
      }
    });
    on(drop, 'focusin', () => {
      if (restoringFocus || suppressFocusOpen || window.innerWidth <= 1000) return;
      drop.classList.remove('dismissed');
      btn?.setAttribute('aria-expanded', 'true');
      positionNavPanel(drop);
    });
    const closeOnFocusOut = () => {
      suppressFocusOpen = false;
      if (window.innerWidth <= 1000) return;
      drop.classList.remove('open');
      if (!drop.matches(':hover')) drop.classList.remove('dismissed');
      btn?.setAttribute('aria-expanded', 'false');
    };
    on(drop, 'focusout', (event) => {
      if (window.innerWidth <= 1000) return;
      if (event.relatedTarget) {
        if (!drop.contains(event.relatedTarget)) closeOnFocusOut();
        return;
      }
      requestAnimationFrame(() => {
        if (!drop.contains(document.activeElement)) closeOnFocusOut();
      });
    });
    if (btn) {
      on(btn, 'click', (e) => {
        e.stopPropagation();
        const isMobile = window.innerWidth <= 1000;
        const willOpen = !drop.classList.contains('open');
        if (willOpen) {
          suppressFocusOpen = false;
          drop.classList.remove('dismissed');
          drop.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
          if (!isMobile) positionNavPanel(drop);
        } else {
          suppressFocusOpen = !isMobile;
          drop.classList.remove('open');
          drop.classList.toggle('dismissed', !isMobile);
          btn.setAttribute('aria-expanded', 'false');
          if (isMobile) btn.blur();
        }
      });
    }
  }

  if (mobileBtn && topbarEl) {
    on(mobileBtn, 'click', (e) => {
      e.stopPropagation();
      const willOpen = !topbarEl.classList.contains('menu-open');
      topbarEl.classList.toggle('menu-open', willOpen);
      mobileBtn.setAttribute('aria-expanded', String(willOpen));
      setScrollLock(willOpen);
      if (!willOpen) {
        for (const drop of navDrops) {
          drop.classList.remove('open');
          drop.querySelector('.nav-drop-btn')?.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  on(document, 'click', (e) => {
    if (!e.target.closest?.('.topbar')) closeAllMenus();
  });
  on(
    window,
    'resize',
    () => {
      if (window.innerWidth > 1000) {
        if (topbarEl?.classList.contains('menu-open')) closeAllMenus();
        else navDrops.filter((drop) => drop.classList.contains('open')).forEach(positionNavPanel);
      }
    },
    { passive: true },
  );
  cleanups.push(onLang(() => closeAllMenus()));

  // ---- Smooth Scroll (Lenis + GSAP ScrollTrigger) ----
  const tick = (time) => lenis?.raf(time * 1000);
  if (!isReducedMotion()) {
    lenis = new Lenis({ lerp: 0.14 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
  }
  cleanups.push(() => {
    if (lenis) {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenis = null;
    }
  });

  const scrollToEl = (target) => {
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY;
    if (lenis) {
      lenis.reset();
      lenis.scrollTo(top, { duration: 0.75 });
    } else {
      window.scrollTo({ top, behavior: isReducedMotion() ? 'auto' : 'smooth' });
    }
  };

  for (const link of $$('[data-warm]')) {
    const warm = () => prefetch(link.dataset.warm);
    link.addEventListener('pointerenter', warm, { once: true });
    link.addEventListener('focus', warm, { once: true });
  }
  for (const link of $$('.topbar a')) {
    on(link, 'click', () => closeAllMenus());
  }
  for (const link of $$('a[href^="#"]:not([href^="#/"])')) {
    on(link, 'click', (event) => {
      const target = root.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      closeAllMenus();
      scrollToEl(target);
    });
  }
  on(window, 'tridi:anchor', (event) => {
    const target = event.detail ? root.querySelector(event.detail) : null;
    if (target) scrollToEl(target);
  });

  // ---- 3D Labyrinth + Dual V1/V2 Luigi CAD World ----
  const film = $('.film');
  const filmHud = $('.film-hud');
  const filmWash = $('.film-wash');
  const bootFiles = $('.boot-files');
  const bootBar = $('.boot-bar');

  const hudLiveEl = $('[data-rv="hud-live"]');
  const hudNeckEl = $('[data-rv="hud-neck"]');
  const hudDistEl = $('[data-rv="hud-dist"]');
  const distEl = $('[data-rv="dist"]');
  const neckEl = $('[data-rv="neck"]');
  const rpmEl = $('[data-rv="rpm"]');
  const statusBodyEl = $('[data-rv="status-body"]');
  const obsCountEl = $('[data-rv="obs-count"]');
  const clearObsBtn = $('[data-rv-clear-obs]');
  const hwNoteEl = $('[data-rv="hw-note"]');

  let lastProgressTelemetry = 0.03;
  let lastStageIdx = -1;
  let lastObsCount = 0;
  let lastAvoiding = false;
  let pendingStage = null; // latches clicked checkpoint aria-pressed until scroll & rover settle

  const setStageUI = (idx) => {
    if (idx === lastStageIdx) return;
    lastStageIdx = idx;
    cpButtons.forEach((btn, i) => {
      btn.classList.toggle('on', i === idx);
      btn.classList.toggle('past', i < idx);
      btn.setAttribute('aria-pressed', String(i === idx));
    });
    axisTicks.forEach((tickEl, i) => {
      tickEl.classList.toggle('on', i === idx);
      tickEl.classList.toggle('past', i < idx);
    });
    if (axisFill && cpButtons[idx]) {
      axisFill.style.width = cpButtons[idx].style.getPropertyValue('--at');
    }
    if (stageTextEl && MAZE_STAGES[idx]) {
      stageTextEl.innerHTML = T(MAZE_STAGES[idx].textKey);
    }
  };

  const syncObstacleButtons = (count) => {
    if (count === lastObsCount) return;
    lastObsCount = count;
    if (obsCountEl) obsCountEl.textContent = String(count);
    if (clearObsBtn) clearObsBtn.disabled = count === 0;
  };

  const world = createRoversWorld(film, {
    isReducedMotion,
    onProgress: ({ done, total }) => {
      if (bootFiles) bootFiles.textContent = `${done}/${total}`;
      if (bootBar) bootBar.style.width = `${(100 * done) / Math.max(1, total)}%`;
    },
    onTelemetry: ({ neckDeg, distCm, rpm, progress, obstacleCount, avoiding }) => {
      lastProgressTelemetry = progress;
      const sign = neckDeg >= 0 ? '+' : '';
      const neckText = `${sign}${neckDeg}°`;
      if (hudNeckEl) hudNeckEl.textContent = neckText;
      if (hudDistEl) hudDistEl.textContent = String(distCm);
      if (distEl) distEl.textContent = `${distCm}\u00A0cm`;

      if (avoiding !== lastAvoiding && statusBodyEl) {
        lastAvoiding = avoiding;
        if (avoiding) {
          statusBodyEl.innerHTML = T('sensors.avoiding');
        } else {
          statusBodyEl.innerHTML = `<span data-rv="neck">${neckText}</span> · <span data-rv="rpm">${rpm}\u00A0RPM</span>`;
        }
      } else if (!avoiding) {
        const dynNeck = statusBodyEl?.querySelector('[data-rv="neck"]') ?? neckEl;
        const dynRpm = statusBodyEl?.querySelector('[data-rv="rpm"]') ?? rpmEl;
        if (dynNeck) dynNeck.textContent = neckText;
        if (dynRpm) dynRpm.textContent = `${rpm}\u00A0RPM`;
      }

      syncObstacleButtons(obstacleCount);
      const stageIdx = progress < 0.34 ? 0 : progress < 0.72 ? 1 : 2;
      if (pendingStage && !holdObstacleAuto) {
        const progSettled = Math.abs(progress - pendingStage.targetProgress) < 0.04;
        const scrollSettled =
          pendingStage.targetY === null || Math.abs(window.scrollY - pendingStage.targetY) < 16;
        if ((progSettled && scrollSettled) || performance.now() > pendingStage.expiresAt) {
          pendingStage = null;
          setStageUI(stageIdx);
        } else {
          setStageUI(pendingStage.idx);
        }
      } else {
        pendingStage = null;
        setStageUI(stageIdx);
      }
    },
  });
  cleanups.push(() => world.dispose());

  world.ready.then(() => {
    film.classList.add('ready');
    world.triggerPing();
  });

  // Desktop click-and-drag tilt/orbit
  let orbitDragging = false;
  let lastPtrX = 0;
  let lastPtrY = 0;
  on(window, 'pointerdown', (e) => {
    if (narrow() || e.pointerType === 'touch' || e.button !== 0) return;
    if (
      e.target.closest?.(
        'a, button, input, video, .panel, .topbar, .hero-platforms, .closing, .rovers-modal, .sim-readout',
      )
    ) {
      return;
    }
    orbitDragging = true;
    lastPtrX = e.clientX;
    lastPtrY = e.clientY;
    document.body.style.cursor = 'grabbing';
  });
  on(window, 'pointermove', (e) => {
    if (!orbitDragging) return;
    const dx = e.clientX - lastPtrX;
    const dy = e.clientY - lastPtrY;
    lastPtrX = e.clientX;
    lastPtrY = e.clientY;
    world.orbitDelta(-dx * 0.3, dy * 0.2);
  });
  const endDrag = () => {
    if (!orbitDragging) return;
    orbitDragging = false;
    document.body.style.cursor = '';
    world.endOrbit();
  };
  on(window, 'pointerup', endDrag);
  on(window, 'pointercancel', endDrag);

  // ---- GSAP Scroll Choreography (exact parity with home.js closing curtain & footer) ----
  let gsapCtx = null;
  if (!isReducedMotion()) {
    gsapCtx = gsap.context(() => {
      gsap.from('.hero-caption > *', { y: 36, opacity: 0, duration: 1.0, ease: 'expo.out', stagger: 0.07, delay: 0.12 });
      gsap.to('.hero-caption', {
        y: -70,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 40%', scrub: true },
      });
      gsap.fromTo(
        '.film-shade',
        { '--shade': 0 },
        { '--shade': 0.88, immediateRender: false, scrollTrigger: { trigger: '.closing', start: 'top bottom', end: 'top 30%', scrub: true } },
      );
      const words = $('.manifesto');
      if (words && !words.dataset.wrapped) {
        words.dataset.wrapped = '1';
        const wrapWords = (text) =>
          text
            .split(' ')
            .map((w) => `<span class="w"><span>${w}</span></span>`)
            .join(' ');
        for (const span of words.querySelectorAll('.t')) {
          span.innerHTML = span.innerHTML
            .split(/<br\s*\/?>/)
            .map((line) => wrapWords(line.trim()))
            .join('<br>');
        }
      }
      gsap.from('.manifesto .w > span', {
        yPercent: 110,
        stagger: 0.04,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.closing', start: 'top 80%', end: 'top 10%', scrub: true },
      });
      gsap.from('.closing-text, .tries', {
        opacity: 0,
        y: 36,
        stagger: 0.08,
        scrollTrigger: { trigger: '.closing', start: 'top 70%', end: 'top top', scrub: true },
      });
    }, root);
  }
  cleanups.push(() => {
    gsapCtx?.revert();
    ScrollTrigger.getAll().forEach((st) => st.kill());
  });

  // ---- Scroll Sync: Chapter-scoped Maze Progress + Camera Choreography ----
  const chapters = $$('.chapter');
  const navLinks = $$('.topnav > .nav-direct[href^="#"]');
  const cpButtons = $$('.axis-stop');
  const axisTicks = $$('.axis-tick');
  const axisFill = $('.axis-fill');
  const stageTextEl = $('[data-rv="stage-text"]');
  const sensorsEl = $('#sensors');
  const sim2realEl = $('#sim2real');

  let layoutTops = [];
  let sensorsTop = 0;
  let sensorsSpan = 0;
  let sim2realTop = 0;
  let mobileStageProgress = MAZE_STAGES[0].progress;
  let lastSyncedScrollY = window.scrollY;
  let holdObstacleAuto = false;

  const measureLayout = () => {
    layoutTops = chapters.map((el) => el.offsetTop);
    if (sensorsEl) {
      sensorsTop = sensorsEl.offsetTop;
      sensorsSpan = Math.max(0, sensorsEl.offsetHeight - window.innerHeight);
    }
    sim2realTop = sim2realEl ? sim2realEl.offsetTop : document.documentElement.scrollHeight;
  };
  measureLayout();
  on(window, 'resize', measureLayout, { passive: true });
  setStageUI(0);

  const shotFor = (name) => {
    const base = SHOTS[name] ?? SHOTS.close;
    return narrow() ? narrowShot(base, name) : base;
  };

  let lastActiveShot = 'hero';

  const syncScroll = () => {
    const y = window.scrollY;
    const mid = y + window.innerHeight * 0.5;
    const scrolledByUser = Math.abs(y - lastSyncedScrollY) > 4;
    lastSyncedScrollY = y;
    if (scrolledByUser) holdObstacleAuto = false;

    // Map maze traversal strictly inside #sensors so checkpoints never jump out of Ch. 2
    if (!holdObstacleAuto) {
      let mazeProgress = 0.035;
      if (y < sensorsTop) {
        const preFrac = sensorsTop > 0 ? Math.min(1, Math.max(0, y / sensorsTop)) : 0;
        mazeProgress = 0.035 + preFrac * 0.045;
      } else if (sensorsSpan >= 40 && y <= sensorsTop + sensorsSpan) {
        const uSensors = (y - sensorsTop) / sensorsSpan;
        mazeProgress = 0.08 + uSensors * 0.88;
      } else if (sensorsSpan < 40 && y < sim2realTop - window.innerHeight * 0.4) {
        // Mobile 100svh snap inside Ch. 2: respect selected checkpoint stage
        mazeProgress = mobileStageProgress;
      } else {
        mazeProgress = 0.94;
      }
      world.setProgress(mazeProgress, { cancelAuto: scrolledByUser });
    }

    let from = chapters[0];
    let to = chapters[0];
    let blend = 0;
    let inCh1Ramp = false;
    let ch1RampT = 0;

    for (let i = 0; i < chapters.length; i++) {
      const top = layoutTops[i];
      const next = layoutTops[i + 1] ?? Infinity;
      if (mid >= top && mid < next) {
        from = chapters[i];
        to = chapters[i + 1] ?? chapters[i];
        const span = Math.max(1, next - top);
        const hold = Number(from.dataset.hold ?? 0.72);
        const frac = (mid - top) / span;
        // Ch. 1 stays overhead briefly as user scrolls down before descending to front of rover
        if (from.id === 'design' && frac < 0.24) {
          inCh1Ramp = true;
          ch1RampT = Math.min(1, Math.max(0, frac / 0.24));
        } else {
          blend = Math.min(1, Math.max(0, (frac - hold) / Math.max(0.01, 1 - hold)));
        }
        break;
      }
    }

    const fromShotName = from.dataset.shot || 'hero';
    const toShotName = to.dataset.shot || fromShotName;
    let a = shotFor(fromShotName);
    let b = shotFor(toShotName);
    let tBlend = blend;

    if (inCh1Ramp) {
      a = shotFor('hero');
      b = shotFor('design');
      tBlend = ch1RampT;
    }

    const s = tBlend * tBlend * (3 - 2 * tBlend);
    const blended = {};
    for (const key of Object.keys(a)) {
      blended[key] = a[key] + (b[key] - a[key]) * s;
    }
    world.setShot(blended);

    if (fromShotName !== lastActiveShot) {
      lastActiveShot = fromShotName;
      world.resetOrbit();
      if (fromShotName === 'sensors' || fromShotName === 'sim2real') {
        world.triggerPing();
      }
    }

    topbarEl?.classList.toggle('solid', y > 40);
    if (filmHud) {
      filmHud.dataset.shot = fromShotName;
      filmHud.classList.toggle('is-closing', fromShotName === 'close');
    }
    if (filmWash) {
      const isNarrow = narrow();
      filmWash.style.setProperty('--wash-left', isNarrow || fromShotName === 'close' ? '0' : '1');
      filmWash.style.setProperty('--wash-right', '0');
      filmWash.style.setProperty('--wash-floor', isNarrow && fromShotName !== 'close' ? '1' : '0');
    }

    const activeId = from.id ? `#${from.id}` : '#home';
    for (const link of navLinks) {
      const match = link.getAttribute('href') === activeId;
      link.classList.toggle('active', match);
      link.toggleAttribute('aria-current', match);
    }

    if (!holdObstacleAuto) {
      if (pendingStage) {
        setStageUI(pendingStage.idx);
      } else {
        const pForStage = sensorsSpan < 40 ? mobileStageProgress : lastProgressTelemetry;
        const stageIdx = pForStage < 0.34 ? 0 : pForStage < 0.72 ? 1 : 2;
        setStageUI(stageIdx);
      }
    }
  };

  on(window, 'scroll', syncScroll, { passive: true });
  on(window, 'wheel', () => {
    pendingStage = null;
  }, { passive: true });
  on(window, 'touchstart', () => {
    pendingStage = null;
  }, { passive: true });
  syncScroll();

  // ---- Interactive Controls (V1/V2 Synced + Checkpoints + Obstacles) ----
  const modeBtns = $$('[data-radar-mode]');
  const setHardwareMode = (mode) => {
    const nextMode = mode === 'fixed' ? 'fixed' : 'sg90';
    world.setRadarMode(nextMode);
    world.triggerPing();
    for (const btn of modeBtns) {
      btn.setAttribute('aria-pressed', String(btn.dataset.radarMode === nextMode));
    }
    if (hudLiveEl) {
      hudLiveEl.innerHTML = nextMode === 'fixed' ? T('hud.liveV1') : T('hud.live');
    }
    if (hwNoteEl) {
      hwNoteEl.innerHTML = nextMode === 'fixed' ? T('design.v1Note') : T('design.v2Note');
    }
  };

  for (const btn of modeBtns) {
    on(btn, 'click', () => setHardwareMode(btn.dataset.radarMode));
  }

  const pingBtn = $('[data-rv-ping]');
  if (pingBtn) on(pingBtn, 'click', () => world.triggerPing());

  const placeObsBtn = $('[data-rv-obstacle]');
  if (placeObsBtn) {
    on(placeObsBtn, 'click', () => {
      pendingStage = null;
      holdObstacleAuto = true;
      const count = world.placeObstacle();
      syncObstacleButtons(count);
    });
  }

  if (clearObsBtn) {
    on(clearObsBtn, 'click', () => {
      pendingStage = null;
      holdObstacleAuto = false;
      world.clearObstacles();
      syncObstacleButtons(0);
      syncScroll();
    });
  }

  for (const btn of cpButtons) {
    on(btn, 'click', () => {
      const idx = Number(btn.dataset.cp) || 0;
      const stage = MAZE_STAGES[idx] ?? MAZE_STAGES[0];
      holdObstacleAuto = false;
      const targetY = sensorsSpan < 40 ? null : Math.round(sensorsTop + stage.scrollFrac * sensorsSpan);
      pendingStage = {
        idx,
        targetProgress: stage.progress,
        targetY,
        expiresAt: performance.now() + 3000,
      };
      setStageUI(idx);

      if (sensorsSpan < 40) {
        // Mobile 100svh snap: update stage directly without leaving Ch. 2
        mobileStageProgress = stage.progress;
        world.setProgress(stage.progress, { cancelAuto: true, immediate: isReducedMotion() });
        world.triggerPing();
        return;
      }

      // Desktop sticky: target inside #sensors sticky span so it NEVER leaves #sensors
      if (Math.abs(window.scrollY - targetY) < 6) {
        syncScroll();
      } else if (lenis) {
        lenis.reset();
        lenis.scrollTo(targetY, { duration: 0.75 });
      } else {
        window.scrollTo({ top: targetY, behavior: isReducedMotion() ? 'auto' : 'smooth' });
      }
      world.triggerPing();
    });
  }

  // ---- On-Demand Sim-to-Real Video Lightbox Modal ----
  const modal = $('.rovers-modal');
  const modalVideo = $('.rovers-modal-video');
  const openVideoBtns = $$('[data-open-video]');
  const closeVideoBtn = $('[data-close-video]');
  const modalTabs = $$('[data-modal-tab]');
  let activeVideoSrc = `${MEDIA}luigi-sim2real.mp4`;
  let lastTriggerBtn = null;

  const openModal = (triggerEl = null) => {
    if (!modal || !modalVideo) return;
    lastTriggerBtn = triggerEl ?? openVideoBtns[0] ?? null;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('open'));
    if (modalVideo.getAttribute('src') !== activeVideoSrc) {
      modalVideo.setAttribute('src', activeVideoSrc);
      modalVideo.load();
    }
    setScrollLock(true);
    modalVideo.play().catch(() => {});
    closeVideoBtn?.focus();
  };

  const closeModal = () => {
    if (!modal || !modalVideo || modal.hidden) return;
    modal.classList.remove('open');
    modalVideo.pause();
    setScrollLock(false);
    setTimeout(() => {
      if (!modal.classList.contains('open')) modal.hidden = true;
    }, 200);
    lastTriggerBtn?.focus();
  };

  for (const btn of openVideoBtns) {
    on(btn, 'click', () => openModal(btn));
  }
  if (closeVideoBtn) on(closeVideoBtn, 'click', closeModal);
  if (modal) {
    on(modal, 'click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
  for (const tab of modalTabs) {
    on(tab, 'click', () => {
      const src = tab.dataset.src;
      if (!src || !modalVideo) return;
      activeVideoSrc = src;
      for (const other of modalTabs) {
        const active = other === tab;
        other.setAttribute('aria-selected', String(active));
        other.setAttribute('aria-pressed', String(active));
      }
      modalVideo.pause();
      modalVideo.setAttribute('src', activeVideoSrc);
      modalVideo.load();
      modalVideo.play().catch(() => {});
    });
  }

  on(window, 'keydown', (e) => {
    if (e.key === 'Escape') {
      if (modal && !modal.hidden) {
        closeModal();
        return;
      }
      if (
        topbarEl?.classList.contains('menu-open') ||
        navDrops.some((drop) => drop.classList.contains('open') || drop.matches(':hover, :focus-within'))
      ) {
        closeAllMenus({ restoreFocus: true });
      }
    } else if (e.code === 'Space' && (!modal || modal.hidden)) {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A') return;
      e.preventDefault();
      world.triggerPing();
    }
  });

  on(document, 'visibilitychange', () => {
    if (document.hidden && modalVideo && !modalVideo.paused) modalVideo.pause();
  });

  return () => {
    document.documentElement.classList.remove('is-landing');
    document.body.style.cursor = '';
    if (modalVideo) modalVideo.pause();
    cleanups.forEach((fn) => fn());
  };
}
