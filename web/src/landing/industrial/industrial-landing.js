// Tridi Industrial (/industrial): cinematic 3D scrollable landing focused on factory_cell
// (conveyor + sealing press + pneumatic pusher + 6-axis robotic arm + PLC S7-1200 / PackML)
// inside a minimalist dark-monochrome architectural factory hall.
// Lazy-loaded from router.js; fully isolated from Humanoids (/) and header.js.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../landing.css';
import './industrial.css';
import { LOGO, WORDMARK } from '../../brand.js';
import { fmt, lang, langSwitch, onLang } from '../../i18n.js';
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
import { prefetch } from '../../router.js';
import { createIndustrialWorld, INDUSTRIAL_SHOTS } from './industrial-world.js';
import { A, T } from './strings.js';

gsap.registerPlugin(ScrollTrigger);

export const title = { es: 'Industrial', en: 'Industrial' };

const reducedMotionQuery =
  typeof window !== 'undefined' ? window.matchMedia?.('(prefers-reduced-motion: reduce)') : null;
const isReducedMotion = () => Boolean(reducedMotionQuery?.matches);
const narrow = () => window.innerWidth <= 860;

const narrowShot = (shot) => ({
  ...shot,
  shift: 0,
  dist: shot.dist * 1.38,
  aimY: shot.aimY - 0.52,
  el: Math.max(18, shot.el + 3),
});

const STATION_DESCS = [
  () => T('stations.s0.desc'),
  () => T('stations.s1.desc'),
  () => T('stations.s2.desc'),
  () => T('stations.s3.desc'),
];

export function mount(root) {
  document.documentElement.classList.add('is-landing');

  root.innerHTML = `
  <div class="landing industrial-landing">
    <div class="film ready" aria-hidden="true"></div>
    <div class="film-hud" data-shot="hero">
      <i class="corner tl" aria-hidden="true"></i><i class="corner tr" aria-hidden="true"></i><i class="corner bl" aria-hidden="true"></i><i class="corner br" aria-hidden="true"></i>
      <div class="sim-readout" data-state="sync">
        <span class="sim-live-pill"><i class="sim-state-dot" aria-hidden="true"></i><span data-ind="packml">${T('hud.packml')}</span></span>
        <span>${T('hud.cycle')} <b data-ind="cycle">4.4</b>\u00A0s</span>
        <span>${T('hud.waste')} <b data-ind="waste">0.0</b>\u00A0%</span>
        <span class="ind-sensor-dots" aria-hidden="true"><i class="ind-sensor-dot" data-pe="0"></i><i class="ind-sensor-dot" data-pe="1"></i><i class="ind-sensor-dot" data-pe="2"></i></span>
        <button type="button" class="sim-info-btn" aria-label="Info">ⓘ<span class="sim-tooltip" role="tooltip">${T('hud.info')}</span></button>
      </div>
    </div>
    <div class="film-shade" aria-hidden="true"></div>
    <div class="film-wash" aria-hidden="true"></div>

    <header class="topbar">
      <a class="wordmark" href="/" ${A({ 'aria-label': 'nav.home' })}>${LOGO}${WORDMARK}</a>
      <nav class="topnav" ${A({ 'aria-label': 'nav.menu' })}>
        <a class="nav-direct" href="#stations">${T('nav.stations')}</a>
        <a class="nav-direct" href="#validation">${T('nav.validation')}</a>
        <a class="nav-direct" href="#policy">${T('nav.policy')}</a>
        <i class="topnav-sep" aria-hidden="true"></i>
        <div class="nav-drop is-current" data-drop="platform">
          <button type="button" class="nav-drop-btn active" aria-expanded="false" aria-controls="ind-nav-platform-panel">
            <span>${navTriggerLabelHTML()}</span>
            <svg class="nav-chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div id="ind-nav-platform-panel" class="nav-drop-panel nav-drop-platform" role="region" ${navDropdownAriaAttrs()}>
            <div class="nav-drop-inner">
              ${navDropdownSectionsHTML({ current: 'industrial' })}
            </div>
          </div>
        </div>
        <a class="nav-direct" href="/milestones" data-warm="milestones">${T('nav.milestones')}</a>
        <div class="nav-mobile-footer">
          <a class="btn btn-signal nav-mobile-cta" href="/assembler" data-warm="assembler">${T('nav.openAssembler')}</a>
        </div>
      </nav>
      <div class="topbar-right">
        <div class="topbar-desktop-lang">${langSwitch()}</div>
        <a class="btn btn-small topbar-desktop-cta" href="/assembler" data-warm="assembler">${T('nav.openAssembler')}</a>
        <button type="button" class="nav-mobile-btn" aria-expanded="false" ${A({ 'aria-label': 'nav.menu' })}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path class="i-bars" d="M3 5.5h14M3 10h14M3 14.5h14"/><path class="i-close" d="M4.5 4.5l11 11M15.5 4.5l-11 11"/></svg>
        </button>
      </div>
    </header>

    <section class="chapter hero" id="home" data-shot="hero">
      <div class="caption hero-caption">
        ${platformBarHTML({ current: 'industrial' })}
        <h1>${T('hero.title')}</h1>
        <p class="hero-lede"><span class="only-wide">${T('hero.lede')}</span><span class="only-narrow">${T('hero.ledeShort')}</span></p>
        <ol class="hero-steps" ${A({ 'aria-label': 'hero.how' })}>
          <li><b>01</b><span class="only-wide">${T('hero.step1')}</span><span class="only-narrow">${T('hero.step1Short')}</span></li>
          <li><b>02</b>${T('hero.step2')}</li>
          <li><b>03</b><span class="only-wide">${T('hero.step3')}</span><span class="only-narrow">${T('hero.step3Short')}</span></li>
        </ol>
        <div class="cta-row">
          <a class="btn btn-signal hero-push" href="/assembler" data-warm="assembler">${T('hero.ctaPrimary')}</a>
          <a class="btn btn-ghost" href="/simulations/factory_cell" data-warm="simulations">${T('hero.ctaSecondary')}</a>
        </div>
      </div>
    </section>

    <section class="chapter ind-chapter-stations" id="stations" data-shot="assembler" data-hold="0.76">
      <div class="sticky">
        <div class="caption ind-panel panel">
          <p class="product">${T('stations.product')}</p>
          <h2><span class="only-wide">${T('stations.title')}</span><span class="only-narrow">${T('stations.titleShort')}</span></h2>
          <p class="ind-panel-lede"><span class="only-wide">${T('stations.lede')}</span><span class="only-narrow">${T('stations.ledeShort')}</span></p>
          <div class="ind-stations" role="group" ${A({ 'aria-label': 'stations.label' })}>
            <button type="button" class="ind-station-btn" data-station="0" aria-pressed="true">
              <span class="ind-station-tag">${T('stations.s0.tag')}</span>
              <span class="ind-station-name">${T('stations.s0.name')}</span>
            </button>
            <button type="button" class="ind-station-btn" data-station="1" aria-pressed="false">
              <span class="ind-station-tag">${T('stations.s1.tag')}</span>
              <span class="ind-station-name">${T('stations.s1.name')}</span>
            </button>
            <button type="button" class="ind-station-btn" data-station="2" aria-pressed="false">
              <span class="ind-station-tag">${T('stations.s2.tag')}</span>
              <span class="ind-station-name">${T('stations.s2.name')}</span>
            </button>
            <button type="button" class="ind-station-btn" data-station="3" aria-pressed="false">
              <span class="ind-station-tag">${T('stations.s3.tag')}</span>
              <span class="ind-station-name">${T('stations.s3.name')}</span>
            </button>
          </div>
          <p class="ind-station-desc" data-ind="station-desc">${T('stations.s0.desc')}</p>
        </div>
      </div>
    </section>

    <section class="chapter ind-chapter-val" id="validation" data-shot="validation" data-hold="0.78">
      <div class="sticky">
        <div class="caption ind-panel panel">
          <p class="product">${T('val.product')}</p>
          <h2><span class="only-wide">${T('val.title')}</span><span class="only-narrow">${T('val.titleShort')}</span></h2>
          <p class="ind-panel-lede"><span class="only-wide">${T('val.lede')}</span><span class="only-narrow">${T('val.ledeShort')}</span></p>

          <div class="ind-control-group">
            <span class="ind-control-label">${T('val.modeLabel')}</span>
            <div class="ind-seg-row" role="group" ${A({ 'aria-label': 'val.modeLabel' })}>
              <button type="button" class="ind-seg-btn" data-mode="sync" aria-pressed="true">${T('val.mode.sync')}</button>
              <button type="button" class="ind-seg-btn is-fault" data-mode="slip" aria-pressed="false">${T('val.mode.slip')}</button>
            </div>
          </div>

          <div class="ind-control-group">
            <span class="ind-control-label">${T('val.faultLabel')}</span>
            <div class="ind-fault-row">
              <button type="button" class="ind-fault-btn" data-fault-inject>
                <i class="ind-fault-dot" aria-hidden="true"></i>
                <span>${T('val.faultBtn')}</span>
              </button>
              <span class="ind-fault-status" data-ind="fault-status" data-active="false">${T('val.faultStatusIdle')}</span>
            </div>
          </div>

          <div class="ind-control-group">
            <span class="ind-control-label">${T('val.recipeLabel')}</span>
            <div class="ind-seg-row" role="group" ${A({ 'aria-label': 'val.recipeLabel' })}>
              <button type="button" class="ind-seg-btn" data-recipe="250g" aria-pressed="false">250\u00A0g</button>
              <button type="button" class="ind-seg-btn" data-recipe="500g" aria-pressed="true">500\u00A0g</button>
              <button type="button" class="ind-seg-btn" data-recipe="1kg" aria-pressed="false">1\u00A0kg</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="chapter policy ind-chapter-policy" id="policy" data-shot="policy" data-hold="0.82">
      <div class="sticky">
        <div class="caption policy-caption ind-panel panel">
          <p class="product">${T('policy.product')}</p>
          <h2><span class="only-wide">${T('policy.title')}</span><span class="only-narrow">${T('policy.titleShort')}</span></h2>
          <p class="ind-panel-lede"><span class="only-wide">${T('policy.lede')}</span><span class="only-narrow">${T('policy.ledeShort')}</span></p>
          <ul class="specs">
            <li data-spec="0"><b data-ind="spec-cycle">4.4\u00A0s</b><span><span class="only-wide">${T('policy.spec.cycle')}</span><span class="only-narrow">${T('policy.spec.cycleShort')}</span></span></li>
            <li class="spec-sep" aria-hidden="true"></li>
            <li data-spec="1"><b data-ind="spec-waste">0.0\u00A0%</b><span><span class="only-wide">${T('policy.spec.waste')}</span><span class="only-narrow">${T('policy.spec.wasteShort')}</span></span></li>
            <li class="spec-sep" aria-hidden="true"></li>
            <li data-spec="2"><b>16\u00A0ISA</b><span><span class="only-wide">${T('policy.spec.isa')}</span><span class="only-narrow">${T('policy.spec.isaShort')}</span></span></li>
            <li class="spec-sep" aria-hidden="true"></li>
            <li data-spec="3"><b>.scl / .L5K</b><span><span class="only-wide">${T('policy.spec.plc')}</span><span class="only-narrow">${T('policy.spec.plcShort')}</span></span></li>
          </ul>
          <a class="btn btn-signal btn-small policy-data" href="/assembler" data-warm="assembler">${T('policy.cta')}</a>
        </div>
      </div>
    </section>

    <nav class="phone-arrows" ${A({ 'aria-label': 'arrows.label' })}>
      <button type="button" class="arrow-up" ${A({ 'aria-label': 'arrows.up' })}>↑</button>
      <button type="button" class="arrow-down" ${A({ 'aria-label': 'arrows.down' })}>↓</button>
    </nav>

    ${closingSectionHTML({ current: 'industrial', isChapter: true, footer: footerHTML({ anchorPrefix: '/' }) })}
  </div>`;

  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const cleanups = [];
  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    cleanups.push(() => target.removeEventListener(type, fn, opts));
  };

  // ---- Topbar Dropdown & Mobile Drawer (matches home.js accessibility & scroll lock) ----
  const topbarEl = $('.topbar');
  const navDrops = $$('.nav-drop');
  const mobileBtn = $('.nav-mobile-btn');
  let lenis = null;

  const setScrollLock = (locked) => {
    document.documentElement.style.overflow = locked ? 'hidden' : '';
    const parent = topbarEl?.parentElement;
    if (parent) {
      for (const child of parent.children) {
        if (child !== topbarEl) child.inert = Boolean(locked);
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
    topbarEl?.classList.remove('menu-open');
    mobileBtn?.setAttribute('aria-expanded', 'false');
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
    if (!btn) continue;
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
  on(window, 'keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (
      topbarEl?.classList.contains('menu-open') ||
      navDrops.some((drop) => drop.classList.contains('open') || drop.matches(':hover, :focus-within'))
    ) {
      closeAllMenus({ restoreFocus: true });
    }
  });
  cleanups.push(onLang(() => closeAllMenus()));

  // ---- Prefetch linked screens on hover/focus ----
  for (const link of $$('[data-warm]')) {
    const warm = () => prefetch(link.dataset.warm);
    link.addEventListener('pointerenter', warm, { once: true });
    link.addEventListener('focus', warm, { once: true });
    cleanups.push(() => {
      link.removeEventListener('pointerenter', warm);
      link.removeEventListener('focus', warm);
    });
  }

  // ---- Lenis Smooth Scroll ----
  const tick = (time) => lenis?.raf(time * 1000);
  function createLenis() {
    if (lenis || isReducedMotion()) return;
    lenis = new Lenis({ lerp: 0.15 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
  }
  function destroyLenis() {
    if (!lenis) return;
    gsap.ticker.remove(tick);
    lenis.destroy();
    lenis = null;
  }
  createLenis();

  const scrollToEl = (target, immediate = false) => {
    if (!target) return;
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY + Number(target.dataset.offset ?? 0));
    if (immediate || isReducedMotion() || !lenis) window.scrollTo({ top });
    else {
      lenis.reset();
      lenis.scrollTo(top, { duration: 0.75 });
    }
  };

  for (const link of $$('a[href^="#"]:not([href^="#/"])')) {
    on(link, 'click', (e) => {
      const target = root.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      closeAllMenus();
      scrollToEl(target);
    });
  }

  // ---- Mount 3D Industrial Factory World ----
  const film = $('.film');
  const filmHud = $('.film-hud');
  const filmShade = $('.film-shade');
  const filmWash = $('.film-wash');
  const readoutEl = $('.sim-readout');
  const packmlEl = $('[data-ind="packml"]');
  const cycleEl = $('[data-ind="cycle"]');
  const wasteEl = $('[data-ind="waste"]');
  const specCycleEl = $('[data-ind="spec-cycle"]');
  const specWasteEl = $('[data-ind="spec-waste"]');
  const faultStatusEl = $('[data-ind="fault-status"]');
  const peDots = [0, 1, 2].map((i) => $(`[data-pe="${i}"]`));

  let lastHudMode = null;
  let lastFaultActive = null;
  const world = createIndustrialWorld(film, {
    reducedMotion: isReducedMotion,
    onTelemetry({ cycleS, wastePct, fault, rejecting, sensors }) {
      const l = lang();
      if (cycleEl) cycleEl.textContent = fmt(cycleS, 1)(l);
      if (wasteEl) wasteEl.textContent = fmt(wastePct, 1)(l);
      if (specCycleEl) specCycleEl.textContent = `${fmt(cycleS, 1)(l)}\u00A0s`;
      if (specWasteEl) specWasteEl.textContent = `${fmt(wastePct, 1)(l)}\u00A0%`;

      const hudMode = fault ? 'fault' : rejecting ? 'reject' : 'sync';
      if (hudMode !== lastHudMode) {
        lastHudMode = hudMode;
        if (readoutEl) readoutEl.dataset.state = hudMode;
        if (packmlEl) {
          const key = fault ? 'hud.fault' : rejecting ? 'hud.reject' : 'hud.packml';
          packmlEl.innerHTML = T(key);
        }
      }
      const faultActive = Boolean(fault || rejecting);
      if (faultActive !== lastFaultActive) {
        lastFaultActive = faultActive;
        if (faultStatusEl) {
          faultStatusEl.dataset.active = String(faultActive);
          faultStatusEl.innerHTML = T(faultActive ? 'val.faultStatusActive' : 'val.faultStatusIdle');
        }
      }
      sensors.forEach((onNow, idx) => peDots[idx]?.classList.toggle('on', onNow));
    },
  });

  // Desktop click-and-drag orbit on background canvas (disabled on touch/narrow per design-system.md)
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  on(window, 'pointerdown', (e) => {
    if (narrow() || e.pointerType === 'touch' || e.button !== 0) return;
    if (e.target.closest?.('a, button, input, select, label, .panel, .topbar, .hero-platforms, .closing-card, .sim-readout, .phone-arrows')) {
      return;
    }
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    world.setUserOrbitDrag(true);
    document.body.style.cursor = 'grabbing';
  });
  on(window, 'pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    world.nudgeUserOrbit(-dx * 0.35, dy * 0.22);
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    world.setUserOrbitDrag(false);
    document.body.style.cursor = '';
  };
  on(window, 'pointerup', endDrag);
  on(window, 'pointercancel', endDrag);

  // ---- Interactive Chapter 1 Station Selector ----
  const stationBtns = $$('[data-station]');
  const stationDescEl = $('[data-ind="station-desc"]');
  let activeStationIdx = 0;
  const selectStation = (idx) => {
    activeStationIdx = idx;
    stationBtns.forEach((btn) => {
      const active = Number(btn.dataset.station) === idx;
      btn.setAttribute('aria-pressed', String(active));
    });
    if (stationDescEl && STATION_DESCS[idx]) {
      stationDescEl.innerHTML = STATION_DESCS[idx]();
    }
    world.setStation(idx);
    syncScroll();
  };
  for (const btn of stationBtns) {
    on(btn, 'click', () => selectStation(Number(btn.dataset.station)));
  }

  // ---- Interactive Chapter 2 PLC Mode, Fault Injection & ISA-88 Recipe Controls ----
  const modeBtns = $$('[data-mode]');
  for (const btn of modeBtns) {
    on(btn, 'click', () => {
      const next = btn.dataset.mode;
      modeBtns.forEach((other) => other.setAttribute('aria-pressed', String(other === btn)));
      world.setMode(next);
    });
  }
  const faultInjectBtn = $('[data-fault-inject]');
  if (faultInjectBtn) {
    on(faultInjectBtn, 'click', () => {
      world.injectFault();
      faultInjectBtn.classList.remove('is-pulsed');
      void faultInjectBtn.offsetWidth;
      faultInjectBtn.classList.add('is-pulsed');
    });
  }
  const recipeBtns = $$('[data-recipe]');
  for (const btn of recipeBtns) {
    on(btn, 'click', () => {
      const next = btn.dataset.recipe;
      recipeBtns.forEach((other) => other.setAttribute('aria-pressed', String(other === btn)));
      world.setRecipe(next);
    });
  }

  // ---- Scroll Choreography: Camera shots, wash, shade, active nav & phone arrows ----
  const chapters = $$('.chapter');
  const navLinks = {
    assembler: $('.topnav a[href="#stations"]'),
    validation: $('.topnav a[href="#validation"]'),
    policy: $('.topnav a[href="#policy"]'),
  };
  let chapterTops = [];
  const measure = () => {
    chapterTops = chapters.map((ch) => ch.offsetTop);
  };
  measure();

  const shotForViewport = (name) => {
    const base = name === 'assembler' ? world.getStationShot(activeStationIdx) : (INDUSTRIAL_SHOTS[name] ?? INDUSTRIAL_SHOTS.close);
    return narrow() ? narrowShot(base) : base;
  };

  function syncScroll() {
    const mid = window.scrollY + window.innerHeight * 0.5;
    let idx = 0;
    for (let i = 0; i < chapters.length; i++) {
      if (mid >= chapterTops[i]) idx = i;
    }
    const from = chapters[idx] ?? chapters[0];
    const to = chapters[idx + 1] ?? from;
    const top = chapterTops[idx] ?? 0;
    const next = chapterTops[idx + 1] ?? top + window.innerHeight;
    const hold = Number(from.dataset.hold ?? 0.68);
    const span = Math.max(1, next - top);
    const t = Math.min(1, Math.max(0, ((mid - top) / span - hold) / Math.max(0.01, 1 - hold)));
    const s = t * t * (3 - 2 * t);

    const a = shotForViewport(from.dataset.shot);
    const b = shotForViewport(to.dataset.shot);
    const blended = {};
    for (const key of Object.keys(a)) {
      blended[key] = a[key] + (b[key] - a[key]) * s;
    }
    world.setShotGoal(blended);
    world.setChapter(from.dataset.shot);

    const isClose = from.dataset.shot === 'close';
    if (filmHud) {
      filmHud.dataset.shot = from.dataset.shot;
      filmHud.classList.toggle('is-closing', isClose);
    }
    if (filmShade) {
      filmShade.style.setProperty('--shade', isClose ? '0.68' : from.dataset.shot === 'hero' ? '0.12' : '0.22');
    }
    if (filmWash) {
      const isNarrow = narrow();
      filmWash.style.setProperty('--wash-left', isNarrow || isClose ? '0' : '1');
      filmWash.style.setProperty('--wash-right', '0');
      filmWash.style.setProperty('--wash-floor', isNarrow && !isClose ? '1' : '0');
    }

    // Highlight active chapter in topbar
    for (const [key, el] of Object.entries(navLinks)) {
      if (!el) continue;
      const active = from.dataset.shot === key;
      el.classList.toggle('active', active);
      if (active) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    }

    const upBtn = $('.arrow-up');
    const downBtn = $('.arrow-down');
    if (upBtn) upBtn.disabled = idx <= 0;
    if (downBtn) downBtn.disabled = idx >= chapters.length - 1;
  }

  on(window, 'scroll', syncScroll, { passive: true });
  on(
    window,
    'resize',
    () => {
      if (window.innerWidth > 1000 && topbarEl?.classList.contains('menu-open')) closeAllMenus();
      measure();
      world.resize();
      syncScroll();
    },
    { passive: true },
  );

  // Phone arrows jump chapter-by-chapter
  const jumpChapter = (delta) => {
    const mid = window.scrollY + window.innerHeight * 0.5;
    let idx = 0;
    for (let i = 0; i < chapters.length; i++) {
      if (mid >= chapterTops[i]) idx = i;
    }
    const target = chapters[Math.max(0, Math.min(chapters.length - 1, idx + delta))];
    scrollToEl(target);
  };
  on($('.arrow-up'), 'click', () => jumpChapter(-1));
  on($('.arrow-down'), 'click', () => jumpChapter(1));

  // Solid topbar past hero
  const barObserver = new IntersectionObserver(
    ([entry]) => topbarEl?.classList.toggle('solid', !entry.isIntersecting),
    { rootMargin: `-${Math.round(topbarEl.getBoundingClientRect().bottom)}px 0px 0px 0px` },
  );
  barObserver.observe($('.hero'));

  // Handle direct anchor loads & tridi:anchor
  const resolveAnchor = (hash) => {
    if (hash === '#assembler-flow') return $('#stations');
    return root.querySelector(hash);
  };
  const onAnchorEvent = (event) => {
    const target = resolveAnchor(event.detail);
    if (target) scrollToEl(target);
    else if (event.detail === '#home') scrollToEl($('#home'));
  };
  on(window, 'tridi:anchor', onAnchorEvent);
  if (location.hash && !location.hash.startsWith('#/')) {
    const target = resolveAnchor(location.hash);
    if (target) scrollToEl(target, true);
  }

  syncScroll();

  return () => {
    document.documentElement.classList.remove('is-landing');
    document.body.style.cursor = '';
    barObserver.disconnect();
    ScrollTrigger.getAll().forEach((tr) => tr.kill());
    destroyLenis();
    cleanups.forEach((fn) => fn());
    world.dispose();
  };
}
