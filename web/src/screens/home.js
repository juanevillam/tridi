// Home: the landing, told like a film. There is no stock footage: the "camera" is the real G1
// from physics/ (MuJoCo + three.js), fixed behind the page, and scrolling directs it from shot to
// shot (a close-up, the walk, the training, the legs). Over it, chapters named after the parts of
// the product (Capture, Gym, Policy) bring in the rest of the real material: the source video, the
// PoseClip skeleton from data/ and the training log of training/.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import '../landing/landing.css';
import { loader } from '../loader.js';
import { dressLandingWorld } from '../landing/world.js';
import { dressTelemetry } from '../landing/telemetry.js';
import { savedMotion } from '../motions.js';
import { FINAL_LEVEL, policyUrls } from '../policies.js';
import { PUSH_N as STANDING_PUSH_N, pushWhenReady } from '../push.js';
// The walk being trained (training/): its step count feeds the roadmap, so the page follows the
// training without anyone editing it. Optional: the build works without the file.
const walkPolicy = Object.values(import.meta.glob('../../../training/policies/g1-walk.json', { eager: true, import: 'default' }))[0] ?? null;
import { fetchClip, preloaded } from '../preloaded.js';
import { LOGO, WORDMARK } from '../brand.js';
import { createPushArrow } from '../push-arrow.js';
import { fetchCachedJson, fetchCachedOnnxBytes, sampleMotion } from 'tridi-physics';
import { attachRobot, onRobotProgress, robotView } from '../robot-host.js';
import { prefetch } from '../router.js';
import { SkeletonView } from '../skeleton.js';
import { fmt, fmtInt, lang, langSwitch, onLang } from '../i18n.js';
import { A, T } from '../landing/strings.js';
import {
  bindNavDropLinking,
  closingSectionHTML,
  footerHTML,
  navDropdownAriaAttrs,
  navDropdownSectionsHTML,
  navTriggerLabelHTML,
  platformBarHTML,
  positionNavPanel,
} from '../navigation.js';
import { createPoseDrawing, resolveAsset, VIDEOS } from '../video-overlay.js';

gsap.registerPlugin(ScrollTrigger);

export const title = '';

// The walk of Capture: the clip extracted from this very video (data/samples/mixkit-4855.mp4,
// re-encoded small into public/media). Clip and video start together and last the same 11.8 s.
// Capture 2.0's walk (GVHMR, data/capture2): the same Mixkit video and frames as the MediaPipe one it
// replaces, so the robot, the 3D skeleton and the video stay in step. Its RobotMotion is saved in
// physics/motions, so it starts at once.
const WALK = preloaded.find((item) => item.clip === 'clip_caminar-perfil-gvhmr');
const MEDIA = `${import.meta.env.BASE_URL}media/`;
const WALK_VIDEO = `${MEDIA}caminar.mp4`;
const PUSH_N = 300; // default landing Gym push force (100..500 N in 100 N steps)
const FALLEN_PELVIS_M = 0.45; // the standing G1 has its pelvis at 0.78 m
const GYM_PUSH_EVERY_S = 3.2; // the Gym pushes the standing robot this often, giving it time to recover its stance
// The first push comes sooner, so a stage shows itself while its stop holds the scroll; never
// before 2 s, the earliest training ever pushes (training/env.py PUSH_EVERY_S): earlier is outside
// what the policies learned, and "Estable" could fall.
const GYM_FIRST_PUSH_S = 2.0;
const FLOOR_SETTLE_MS = 1050; // let a fallen robot rest clearly on the plaza before redeploying
const REDEPLOY_DEMAT_MS = 280; // fade-out + downward telemetry scan sweep
const REDEPLOY_MAT_MS = 540; // knees_bent -> home unfold + upward scan sweep
const REDEPLOY_HANDOFF_MS = 260; // reticle fade-out as standing policy takes over
const REDEPLOY_TOTAL_MS = REDEPLOY_DEMAT_MS + REDEPLOY_MAT_MS + REDEPLOY_HANDOFF_MS;
const AFTER_PUSH_S = 5; // after a push in the hero, the robot stands this long before it is reset
// The Gym in three stops of the real training (stand-300m, training/README.md), each a saved
// checkpoint with what training.evaluate measured for it: seconds standing (of 20) and 250 N
// pushes held (of 4).
const GYM_STAGES = [
  { level: 'g1-stand-step-10000000', steps: 10e6, label: '10\u00A0M', up: 11.2, pushes: 1.6, maxN: 200 },
  { level: 'g1-stand-step-100000000', steps: 100e6, label: '100\u00A0M', up: 20, pushes: 4, maxN: 300 },
  { level: 'g1-stand', steps: 300e6, label: '300\u00A0M', up: 20, pushes: 4, maxN: 500 },
];
// The policy decides 50 times a second (training/README.md), for the simulation's readout.
const DECISIONS_PER_S = 50;
const reducedMotionQuery = typeof window !== 'undefined' ? window.matchMedia?.('(prefers-reduced-motion: reduce)') : null;
const isReducedMotion = () => Boolean(reducedMotionQuery?.matches);
// The film fills the whole screen, so on a retina screen a pixel ratio of 2 drew four times the
// pixels of 1: 1.5 keeps the robot sharp and draws 44 % fewer pixels than 2, every frame.
const FILM_PIXEL_RATIO = 1.5;
const narrow = () => innerWidth <= 860;

// The shots. The camera orbits the robot's pelvis: azimuth 0 looks at the robot from the front
// (MuJoCo +x), elevation lifts it, distance in meters, aim is the height it looks at, and shift
// slides the robot across the frame (a share of the width, + to the right) to leave room for words.
// follow is how many seconds the camera takes to catch up with the pelvis (physics/ viewer
// followTau): a still frame instead of the street sliding with every small step; the walk keeps a
// short one so the robot stays in frame. Resets and clip loops still cut (the viewer snaps them).
// Capture looks from the robot's right (az -90): the walk is turned to head +x (faceForward), so
// it is the side the phone filmed, the robot walks the same way as the video, and the far arm is
// the one behind the body. Policy shows the whole robot the network moves, slightly from above.
const SHOTS = {
  // Tight 3/4 cinema hero close-up (18 deg off-axis, 1.24 m): puts the robot front-and-center
  // over the street background while keeping the left headline clear.
  hero: { az: 18, el: 3, dist: 1.24, aim: 1.06, shift: 0.19, follow: 0.5 },
  capture: { az: -90, el: 6, dist: 3.3, aim: 0.8, shift: 0.24, follow: 0.15 },
  gym: { az: 38, el: 12, dist: 3.5, aim: 0.78, shift: 0.2, follow: 0.6 },
  policy: { az: 16, el: 6, dist: 2.25, aim: 0.88, shift: 0.2, follow: 0.3 },
  // Heroic low-angle front-3/4 architectural establishing shot showing the G1 against the twilight skyline
  close: { az: -32, el: 4, dist: 4.4, aim: 1.05, shift: 0, follow: 0.9 },
};
const POLICY_NARROW_SHOT = { az: 0, el: 5, dist: 3.05, aim: 0.44, shift: 0, follow: 0.3 };
// On phones zoom out cleanly so the full humanoid reads above the bottom card without excess floor or sky.
// Hero keeps its approved framing (2.65 m).
const narrowShot = (shot) =>
  shot.dist < 1.5
    ? { ...shot, shift: 0, dist: 2.65, aim: 0.68 }
    : { ...shot, shift: 0, dist: shot.dist * 1.38, aim: shot.aim - 0.38, el: Math.max(4, shot.el - 2) };

// "3,6 de 4" / "3.6 of 4": pushes held, in the language's own decimal mark.
const T_OF = (n, l) => (l === 'en' ? `${fmt(n, n % 1 ? 1 : 0)(l)} of 4` : `${fmt(n, n % 1 ? 1 : 0)(l)} de 4`);

export function mount(root) {
  document.documentElement.classList.add('is-landing');
  root.innerHTML = `
  <div class="landing">
    <div class="film" aria-hidden="true"></div>
    <div class="film-hud" data-shot="hero">
      <i class="corner tl" aria-hidden="true"></i><i class="corner tr" aria-hidden="true"></i><i class="corner bl" aria-hidden="true"></i><i class="corner br" aria-hidden="true"></i>
      <div class="sim-readout" data-state="stand">
        <span class="sim-live-pill"><i class="sim-state-dot" aria-hidden="true"></i><span data-sim="state">${T('hud.stand')}</span></span>
        <span data-sim="rates">MuJoCo</span>
        <span>t <b data-sim="time">0,0</b> s</span>
        <span>${T('sim.contacts')} <b data-sim="contacts">0</b></span>
        <button type="button" class="sim-info-btn" aria-label="Info">ⓘ<span class="sim-tooltip" role="tooltip">${T('sim.info')}</span></button>
      </div>
    </div>
    <div class="film-shade" aria-hidden="true"></div>
    <div class="film-wash" aria-hidden="true"></div>
    <div class="boot" role="status" aria-live="polite">
      <div class="boot-head">
        ${loader('small')}
        <div class="boot-meta">
          <p class="boot-title"><span>mujoco.wasm</span><b class="boot-files">0/39</b></p>
          <p class="boot-line">${T('boot.world')}</p>
        </div>
      </div>
      <div class="boot-track"><i class="boot-bar"></i></div>
    </div>

    <header class="topbar">
      <a class="wordmark" href="#home" ${A({ 'aria-label': 'nav.home' })}>${LOGO}${WORDMARK}</a>
      <nav class="topnav" ${A({ 'aria-label': 'nav.menu' })}>
        <a class="nav-direct" href="#capture">Capture</a>
        <a class="nav-direct" href="#gym">Gym</a>
        <a class="nav-direct" href="#policy">Policy</a>
        <i class="topnav-sep" aria-hidden="true"></i>
        <div class="nav-drop" data-drop="platform">
          <button type="button" class="nav-drop-btn" aria-expanded="false" aria-controls="landing-nav-platform-panel">
            <span>${navTriggerLabelHTML()}</span>
            <svg class="nav-chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div id="landing-nav-platform-panel" class="nav-drop-panel nav-drop-platform" role="region" ${navDropdownAriaAttrs()}>
            <div class="nav-drop-inner">
              ${navDropdownSectionsHTML({ current: 'humanoids' })}
            </div>
          </div>
        </div>
        <a class="nav-direct" href="/milestones" data-warm="milestones">${T('nav.milestones')}</a>
        <div class="nav-mobile-footer">
          <a class="btn btn-signal nav-mobile-cta" href="/simulations" data-warm="simulations">${T('nav.tryLive')}</a>
        </div>
      </nav>
      <div class="topbar-right">
        <div class="topbar-desktop-lang">${langSwitch()}</div>
        <a class="btn btn-small topbar-desktop-cta" href="/simulations" data-warm="simulations">${T('nav.tryLive')}</a>
        <button type="button" class="nav-mobile-btn" aria-expanded="false" ${A({ 'aria-label': 'nav.menu' })}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path class="i-bars" d="M3 5.5h14M3 10h14M3 14.5h14"/><path class="i-close" d="M4.5 4.5l11 11M15.5 4.5l-11 11"/></svg>
        </button>
      </div>
    </header>

    <section class="chapter hero" id="home" data-shot="hero" data-mode="stand">
      <div class="caption hero-caption">
        ${platformBarHTML({ current: 'humanoids' })}
        <h1>${T('hero.title')}</h1>
        <p class="hero-lede"><span class="only-wide">${T('hero.lede')}</span><span class="only-narrow">${T('hero.ledeShort')}</span></p>
        <ol class="hero-steps" ${A({ 'aria-label': 'hero.how' })}>
          <li><b>01</b><span class="only-wide">${T('hero.step1')}</span><span class="only-narrow">${T('hero.step1Short')}</span></li>
          <li><b>02</b>${T('hero.step2')}</li>
          <li><b>03</b><span class="only-wide">${T('hero.step3')}</span><span class="only-narrow">${T('hero.step3Short')}</span></li>
        </ol>
        <div class="cta-row">
          <button class="btn btn-signal hero-push" type="button" disabled>${T('hero.push')} <kbd>${T('key.space')}</kbd></button>
          <a class="btn btn-ghost" href="#capture">${T('hero.howLink')}</a>
        </div>
      </div>
    </section>

    <section class="chapter capture" id="capture" data-shot="capture" data-mode="walk">
      <div class="sticky">
        <div class="capture-media">
          <figure class="frame frame-video">
            <video class="walk-video" src="${WALK_VIDEO}" muted playsinline loop preload="metadata"></video>
            <canvas class="walk-overlay" aria-hidden="true"></canvas>
          </figure>
          <figure class="frame frame-skeleton">
            <canvas class="skeleton-canvas" role="img" ${A({ 'aria-label': 'capture.skeletonShort' })}></canvas>
          </figure>
        </div>
        <div class="caption capture-caption panel">
          <p class="product">Tridi Capture</p>
          <h2><span class="only-wide">${T('capture.title')}</span><span class="only-narrow">${T('capture.titleShort')}</span></h2>
          <p><span class="only-wide">${T('capture.text')}</span><span class="only-narrow">${T('capture.textShort')}</span></p>
        </div>
      </div>
    </section>

    <section class="chapter gym" id="gym" data-shot="gym" data-mode="gym" data-hold="0.8">
      <div class="sticky">
        <div class="caption gym-caption panel">
          <p class="product">Tridi Gym</p>
          <h2>${T('gym.title')}</h2>
          <p class="gym-lede"><span class="only-wide">${T('gym.lede')}</span><span class="only-narrow">${T('gym.ledeShort')}</span></p>
          <div class="steps-meter">
            <div class="steps-row">
              <p class="steps-now"><b data-gym="steps" data-value="10000000">10\u00A0M</b><span>${T('gym.stepsLabel')}</span></p>
              <p class="gym-status"><i class="live-dot" aria-hidden="true"></i><span class="gym-status-body"><span data-gym="up">—</span> ${T('gym.standing')} · <span data-gym="status">${T('gym.live')}</span></span></p>
            </div>
            <div class="steps-axis">
              <div class="axis-track" aria-hidden="true">
                <i class="axis-line"><i class="axis-fill"></i></i>
                ${GYM_STAGES.map((_, i) => `<i class="axis-tick" style="--at: ${(100 * i) / (GYM_STAGES.length - 1)}%"></i>`).join('')}
              </div>
              <div class="axis-stops" role="group" ${A({ 'aria-label': 'gym.stages' })}>
              ${GYM_STAGES.map((stage, i) => `
                <button class="axis-stop" type="button" data-stage="${i}" aria-pressed="${i === 0}" style="--at: ${(100 * i) / (GYM_STAGES.length - 1)}%">
                  <span class="axis-label">${T('gym.stepsAt', { n: stage.label })}</span>
                  <span class="axis-verdict">${T(`stage.${i}.verdict`)}</span>
                </button>`).join('')}
              </div>
            </div>
            <div class="stage-detail">
              <span class="stage-text" data-gym="text"></span>
              <span class="stage-numbers" data-gym="numbers"></span>
            </div>
          </div>
          <div class="gym-controls">
            <button class="btn btn-signal btn-small gym-push" type="button" disabled>${T('hero.push')} <kbd>${T('key.space')}</kbd></button>
            <label class="gym-force">
              <span class="gym-force-head"><span>${T('gym.force')}</span><b data-gym="force">${PUSH_N}\u00A0N</b></span>
              <div class="gym-force-track">
                <i class="gym-force-zone" data-gym="force-zone"></i>
                <input type="range" class="gym-force-slider" min="100" max="500" step="100" value="${PUSH_N}" />
              </div>
              <span class="gym-force-cap" data-gym="force-cap"></span>
            </label>
          </div>
        </div>
      </div>
    </section>

    <section class="chapter policy" id="policy" data-shot="policy" data-mode="policy" data-hold="0.82" data-rest="0.55">
      <div class="sticky">
        <div class="caption policy-caption panel">
          <p class="product">Tridi Policy</p>
          <h2><span class="only-wide">${T('policy.title')}</span><span class="only-narrow">${T('policy.titleShort')}</span></h2>
          <p class="policy-lede"><span class="only-wide">${T('policy.lede')}</span><span class="only-narrow">${T('policy.ledeShort')}</span></p>
          <ul class="specs">
            <li data-spec="0"><b>150–500\u00A0KB</b><span><span class="only-wide">${T('policy.size')}</span><span class="only-narrow">${T('policy.sizeShort')}</span></span></li>
            <li class="spec-sep" aria-hidden="true"></li>
            <li data-spec="1"><b>19–51\u00A0DOF</b><span><span class="only-wide">${T('policy.motors')}</span><span class="only-narrow">${T('policy.motorsShort')}</span></span></li>
            <li class="spec-sep" aria-hidden="true"></li>
            <li data-spec="2"><b>50–250\u00A0Hz</b><span><span class="only-wide">${T('policy.rate')}</span><span class="only-narrow">${T('policy.rateShort')}</span></span></li>
            <li class="spec-sep" aria-hidden="true"></li>
            <li data-spec="3"><b>&lt;\u00A00.5\u00A0ms</b><span><span class="only-wide">${T('policy.latency')}</span><span class="only-narrow">${T('policy.latencyShort')}</span></span></li>
          </ul>
          <a class="btn btn-signal btn-small policy-data" href="/delivery" data-warm="delivery">${T('policy.cta')}</a>
        </div>
      </div>
    </section>

    <nav class="phone-arrows" ${A({ 'aria-label': 'arrows.label' })}>
      <button type="button" class="arrow-up" ${A({ 'aria-label': 'arrows.up' })}>↑</button>
      <button type="button" class="arrow-down" ${A({ 'aria-label': 'arrows.down' })}>↓</button>
    </nav>

    ${closingSectionHTML({ current: 'humanoids', isChapter: true, footer: footerHTML({ anchorPrefix: '' }) })}
  </div>`;

  const $ = (selector) => root.querySelector(selector);
  const $$ = (selector) => [...root.querySelectorAll(selector)];
  let gone = false;
  const cleanups = [];
  const on = (target, type, fn, options) => {
    target.addEventListener(type, fn, options);
    cleanups.push(() => target.removeEventListener(type, fn, options));
  };

  // ---- Unified Navbar Dropdowns (Hover on Desktop, Accordion on Mobile) ----
  const topbarEl = $('.topbar');
  const navDrops = $$('.nav-drop');
  const mobileBtn = $('.nav-mobile-btn');
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
    const focusedDropBtn = navDrops.find((drop) => drop.contains(document.activeElement))?.querySelector('.nav-drop-btn') ?? null;
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
      for (const other of navDrops) {
        if (other !== drop) {
          other.classList.remove('open');
          other.querySelector('.nav-drop-btn')?.setAttribute('aria-expanded', 'false');
        }
      }
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
      // Sync aria-expanded when desktop :focus-within opens the dropdown panel visually.
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
      const nextTarget = event.relatedTarget;
      if (nextTarget) {
        if (!drop.contains(nextTarget)) closeOnFocusOut();
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
      for (const other of navDrops) {
        if (other !== drop) {
          other.classList.remove('open');
          other.querySelector('.nav-drop-btn')?.setAttribute('aria-expanded', 'false');
        }
      }
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
      // Keep Platform accordion closed by default when opening mobile menu.
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

  // ---- Smooth scroll, and GSAP's scroll triggers driven by it ----
  // gymGate (Gym, below) sees every wheel step first, so a fast scroll stops at each stage.
  // lerp 0.15 settles a wheel step in about a quarter of a second: 0.09 glided for twice that and
  // the page felt heavy.
  let lenis = null;
  const tick = (time) => lenis?.raf(time * 1000);
  function createLenis() {
    if (lenis || isReducedMotion()) return;
    lenis = new Lenis({ lerp: 0.15, virtualScroll: (data) => gymGate(data) });
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
  // Lenis 1.3 keeps targetScroll equal to the current animated position until the next raf tick
  // for programmatic scrolls, and early-returns without stopping an in-flight tween if
  // target === targetScroll. Resetting before scrollTo clears any prior tween on rapid click-back.
  const lenisScrollTo = (top, opts) => {
    if (!lenis) return;
    lenis.reset();
    lenis.scrollTo(top, opts);
  };
  createLenis();
  // A target's page position, moved by its data-offset (px): "#try" lands below the top bar.
  const anchorTop = (target) => target.getBoundingClientRect().top + scrollY + Number(target.dataset.offset ?? 0);
  const navFlight = { until: 0, chapter: null };
  const scrollTo = (target) => {
    const destChapter = target.closest?.('.chapter') ?? null;
    if (destChapter) {
      navFlight.until = performance.now() + 800;
      navFlight.chapter = destChapter;
    }
    const top = anchorTop(target);
    return lenis ? lenisScrollTo(top, { duration: 0.75 }) : window.scrollTo({ top });
  };
  on(window, 'wheel', () => (navFlight.until = 0), { passive: true });
  on(window, 'touchstart', () => (navFlight.until = 0), { passive: true });
  const probar = $('#try');

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
      event.preventDefault();
      closeAllMenus();
      const target = root.querySelector(link.getAttribute('href'));
      if (target) scrollTo(target);
    });
  }
  const scrollTopBtn = $('[data-scroll-top]');
  if (scrollTopBtn) {
    on(scrollTopBtn, 'click', () => {
      closeAllMenus();
      const homeEl = $('#home');
      if (homeEl) scrollTo(homeEl);
    });
  }

  // ---- The film: the one robot, behind everything ----
  const landingEl = $('.landing');
  const film = $('.film');
  cleanups.push(
    onRobotProgress(({ done, total, compiling, policy }) => {
      $('.boot-files').textContent = `${done}/${total}`;
      $('.boot-bar').style.width = `${(100 * done) / total}%`;
      $('.boot-line').innerHTML = T(policy ? 'boot.policy' : compiling ? 'boot.compiling' : 'boot.world');
    }),
  );
  // Optional ?boot=1 preview mode: keeps the loading overlay visible so Juan can inspect & tune it live.
  const holdBoot = new URLSearchParams(location.search).has('boot');
  if (holdBoot) {
    $('.boot-files').textContent = '24/39';
    $('.boot-bar').style.width = '62%';
  }
  if (robotView() && !holdBoot) film.classList.add('ready');
  const robot = attachRobot(film);
  let view = null;
  let saved = null; // the viewer's camera as the app screens expect it, put back on unmount
  let lights = []; // the landing's extra lights
  let key = null; // the one of them that rides with the camera
  let hemiLight = null; // hemisphere bounce adapted smoothly in White-Chamber
  let landingWorld = null; // procedural landing world handle (update, setGymWash, undress)
  let telemetry = null; // the physics drawn into the scene (landing/telemetry.js)
  let lastFrameMs = 0;
  let gymWashT = 0;
  let gymWash = 0;
  let lastGymWashCss = '';
  let isGymChamber = false;
  const GYM_HEMI_SKY = new THREE.Color(0xc8ddf7);
  const GYM_HEMI_GROUND = new THREE.Color(0x2c3648);

  // The camera eases toward the shot of the chapter on screen, blending between neighbours.
  const shot = { ...SHOTS.hero };
  const chapters = $$('.chapter');
  // Where the chapters and the Gym's stages are, measured once and again on resize (measure(),
  // below). Reading offsetTop every frame made the browser lay the page out again every frame,
  // right after GSAP and the wash had written their styles.
  const layout = { tops: [], gymTop: 0, gymStep: 1 };
  const chapterAt = (y) => chapters[layout.tops.findLastIndex((top) => top <= y)] ?? chapters[0];
  const shotForViewport = (name) => {
    const base = SHOTS[name] ?? SHOTS.close;
    if (!narrow()) return base;
    return name === 'policy' ? POLICY_NARROW_SHOT : narrowShot(base);
  };
  function targetShot() {
    if (navFlight.chapter && performance.now() < navFlight.until) {
      return shotForViewport(navFlight.chapter.dataset.shot);
    }
    const mid = scrollY + innerHeight * 0.5;
    let from = chapters[0];
    let to = chapters[0];
    let t = 0;
    for (let i = 0; i < chapters.length; i++) {
      const top = layout.tops[i];
      const next = layout.tops[i + 1] ?? Infinity;
      if (mid >= top && mid < next) {
        from = chapters[i];
        to = chapters[i + 1] ?? chapters[i];
        // Hold the chapter's shot for most of it, and move to the next one in its last stretch.
        // The Gym holds it longer (data-hold): its last stage sits at 75 % of the chapter.
        const span = next - top;
        const hold = Number(chapters[i].dataset.hold ?? 0.7);
        t = Math.min(1, Math.max(0, ((mid - top) / span - hold) / (1 - hold)));
        break;
      }
    }
    const a = shotForViewport(from.dataset.shot);
    const b = shotForViewport(to.dataset.shot);
    const s = t * t * (3 - 2 * t);
    return Object.fromEntries(Object.keys(a).map((k) => [k, a[k] + (b[k] - a[k]) * s]));
  }

  // Click-and-drag camera orbiting on the landing background so the user can rotate around the robot.
  const userOrbit = { az: 0, el: 0, dragging: false, lastX: 0, lastY: 0, reset: false };
  on(window, 'pointerdown', (e) => {
    if (narrow() || e.pointerType === 'touch' || e.button !== 0) return;
    if (e.target.closest?.('a, button, input, select, label, video, .panel, .topbar, .hero-platforms, .closing-card, .try, .sim-readout, .phone-arrows')) return;
    userOrbit.dragging = true;
    userOrbit.reset = false;
    userOrbit.lastX = e.clientX;
    userOrbit.lastY = e.clientY;
    document.body.style.cursor = 'grabbing';
  });
  on(window, 'pointermove', (e) => {
    if (!userOrbit.dragging) return;
    const dx = e.clientX - userOrbit.lastX;
    const dy = e.clientY - userOrbit.lastY;
    userOrbit.lastX = e.clientX;
    userOrbit.lastY = e.clientY;
    userOrbit.az -= dx * 0.35;
    userOrbit.el = Math.max(-10, Math.min(28, userOrbit.el + dy * 0.22));
  });
  const endOrbitDrag = () => {
    if (!userOrbit.dragging) return;
    userOrbit.dragging = false;
    document.body.style.cursor = '';
  };
  on(window, 'pointerup', endOrbitDrag);
  on(window, 'pointercancel', endOrbitDrag);

  function directCamera(v, dt = 1 / 60) {
    const goal = targetShot();
    const rm = isReducedMotion();
    const k = rm ? 1 : 1 - Math.exp(-dt / 0.27);
    for (const key of Object.keys(shot)) shot[key] += (goal[key] - shot[key]) * k;
    // Smoothly return any free-roam orbit to the chapter's canonical viewpoint when entering a new chapter.
    if (userOrbit.reset && !userOrbit.dragging) {
      const decay = rm ? 0 : Math.exp(-dt / 0.13);
      userOrbit.az *= decay;
      userOrbit.el *= decay;
      if (Math.abs(userOrbit.az) < 0.08 && Math.abs(userOrbit.el) < 0.08) {
        userOrbit.az = 0;
        userOrbit.el = 0;
        userOrbit.reset = false;
      }
    }
    v.viewer.followTau = rm ? 0 : shot.follow;
    const { camera, controls } = v.viewer;
    const az = ((shot.az + userOrbit.az) * Math.PI) / 180;
    const el = (Math.max(-5, Math.min(42, shot.el + userOrbit.el)) * Math.PI) / 180;
    // The camera is level and the picture is shifted instead (an architect's shift lens): a camera
    // tilted down to the aim made every vertical away from the image's center lean, and with the
    // robot slid to the side for the words (shift) and running ahead of the camera in the walk, the
    // robot leaned visibly at the end of Capture, where the shot rises toward the Gym's.
    const height = shot.aim + Math.sin(el) * shot.dist;
    v.viewer.targetHeight = height;
    controls.maxPolarAngle = Math.PI / 2; // OrbitControls would lift a level camera off its height
    const { x, z } = controls.target;
    camera.position.set(x + Math.cos(az) * Math.cos(el) * shot.dist, height, z - Math.sin(az) * Math.cos(el) * shot.dist);
    // Slide the image sideways (three.js film offset), so the robot stands where the words are not.
    const filmWidth = camera.filmGauge * Math.min(camera.aspect, 1);
    camera.filmOffset = -shot.shift * camera.aspect * 2 * Math.tan((camera.fov * Math.PI) / 360) * filmWidth;
    camera.updateProjectionMatrix();
    // And up, so the aim (el degrees below the level line of sight) sits at the image's center as
    // the tilted camera had it: the projection's vertical offset, in units of the image's half height.
    const m = camera.projectionMatrix.elements;
    m[9] = -m[5] * Math.tan(el);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    key?.position.copy(camera.position).add(KEY_LIFT);
  }
  const KEY_LIFT = new THREE.Vector3(0, 0.8, 0); // the key light sits a little above the lens

  // ---- The push, drawn in the robot's scene: the arrow from where the shove comes
  // (push-arrow.js), and the Gym's test ring on the floor around the robot it trains ----
  const SIGNAL = 0xc8ff2e; // --signal in style.css
  const RING_M = 1.2; // a fall of the G1 reaches about this far from where it stood
  let marks = null; // { arrow, ring, ringMaterial }
  function makeMarks(scene) {
    // Sleek fwidth-antialiased holographic perimeter reticle matching Redeploy v2's high-tech shader aesthetic (1 draw call)
    const ringMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uSignal: { value: new THREE.Color(SIGNAL) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vLocal;
        void main() {
          vLocal = position.xy;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uOpacity;
        uniform vec3 uSignal;
        varying vec2 vLocal;

        float ringAt(float d, float r, float fw) {
          return 1.0 - clamp(abs(d - r) / (fw * 1.35), 0.0, 1.0);
        }

        void main() {
          float d = length(vLocal);
          if (d > ${(RING_M + 0.28).toFixed(2)} || d < 0.78) discard;
          float ang = atan(vLocal.y, vLocal.x);
          float fw = max(fwidth(d), 0.0025);

          // Static razor-sharp outer calibration ring (1.20 m) + clean static segmented inner/outer arcs
          float mainRing = ringAt(d, ${RING_M.toFixed(2)}, fw);
          float innerArc = ringAt(d, ${(RING_M - 0.10).toFixed(2)}, fw) * smoothstep(-0.22, 0.16, cos(ang * 4.0)) * 0.50;
          float outerArc = ringAt(d, ${(RING_M + 0.12).toFixed(2)}, fw) * smoothstep(0.35, 0.65, cos(ang * 6.0)) * 0.30;

          // Precision 15 deg minor & 90 deg cardinal degree ticks
          float t15Sin = sin(ang * 12.0) * d / 12.0;
          float t15 = (1.0 - clamp(abs(t15Sin) / max(fwidth(t15Sin) * 1.25, 0.002), 0.0, 1.0))
            * step(${(RING_M + 0.025).toFixed(3)}, d) * step(d, ${(RING_M + 0.085).toFixed(3)});
          float t90Sin = sin(ang * 2.0) * d / 2.0;
          float t90 = (1.0 - clamp(abs(t90Sin) / max(fwidth(t90Sin) * 1.25, 0.002), 0.0, 1.0))
            * step(${(RING_M - 0.06).toFixed(3)}, d) * step(d, ${(RING_M + 0.18).toFixed(3)});

          // Soft futuristic radial glow along perimeter
          float aura = exp(-pow((d - ${RING_M.toFixed(2)}) / 0.045, 2.0)) * 0.22;

          float mask = clamp(mainRing * 0.92 + innerArc + outerArc + t15 * 0.52 + t90 * 0.88 + aura, 0.0, 1.0);
          float alpha = mask * uOpacity;
          if (alpha < 0.004) discard;
          gl_FragColor = vec4(uSignal, alpha);
          #include <colorspace_fragment>
        }`,
    });
    const planeSize = (RING_M + 0.3) * 2;
    const ringGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const ring = new THREE.Mesh(ringGeo, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.006;
    ring.renderOrder = 3;
    ring.visible = false;
    scene.add(ring);
    return { arrow: createPushArrow(scene), ring, ringMaterial, opacity: 0 };
  }
  // Right after view.push(). Smaller in the hero, whose camera stands 1.35 m from the robot
  // instead of 3.7 m.
  function drawPush(newtons = PUSH_N) {
    if (marks && view) marks.arrow.point(view, mode === 'gym' ? 1 : 0.6, { forceN: newtons });
  }
  function updateMarks(dt = 1 / 60, nowSec = 0) {
    if (!marks) return;
    marks.arrow.update();
    const goal = mode === 'gym' ? 0.72 + 0.22 * gymWash : 0;
    const wasHidden = marks.opacity <= 0.01;
    const rm = isReducedMotion();
    const k = rm ? 1 : 1 - Math.exp(-dt / 0.20);
    marks.opacity += (goal - marks.opacity) * k;
    marks.ringMaterial.uniforms.uOpacity.value = marks.opacity;
    marks.ringMaterial.uniforms.uTime.value = rm ? 0 : nowSec;
    const targetX = gym.ringX;
    const targetZ = -gym.ringY;
    if (wasHidden) {
      marks.ring.position.set(targetX, marks.ring.position.y, targetZ);
    } else {
      const rk = rm ? 1 : 1 - Math.exp(-dt / 0.18);
      marks.ring.position.x += (targetX - marks.ring.position.x) * rk;
      marks.ring.position.z += (targetZ - marks.ring.position.z) * rk;
    }
    marks.ring.visible = marks.opacity > 0.01;
  }

  // ---- What the robot does in each chapter ----
  let level = null; // checked against view.sim.policy.id so returning from another robot always reloads G1
  let queue = Promise.resolve();
  function useLevel(id, { reset = false, motion = undefined, guard = null } = {}) {
    queue = queue
      .then(async () => {
        if (gone || !view) return false;
        if (guard && !guard()) return false;
        const wasNonG1 = view.sim?.policy?.robot && view.sim.policy.robot !== 'unitree_g1';
        const shouldReset = reset || wasNonG1;
        if (!motion && level === id && view.sim?.policy?.id === id && !wasNonG1) {
          if (shouldReset && view.sim) view.stop();
          return true;
        }
        const { onnx, json } = policyUrls(id);
        await view.loadPolicy(onnx, json, motion ? { motion, reset: shouldReset } : { reset: shouldReset });
        if (gone || !view) return false;
        level = id;
        return true;
      })
      .catch((error) => {
        console.error(error);
        return false;
      });
    return queue;
  }
  // The walk of Capture, turned to start facing +x like the standing robot (faceForward), so the
  // walk begins without the robot snapping 90°.
  const walkMotion = WALK ? savedMotion(WALK.clip).then((motion) => motion && faceForward(motion)) : Promise.resolve(null);
  let resolvedWalkMotion = null;
  let walkMotionDuration = 0;
  let walkBounds = null;
  function updateWalkBounds(m) {
    if (!m?.qpos?.length) return;
    walkMotionDuration = (m.qpos.length - 1) / m.fps;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const row of m.qpos) {
      if (row[0] < minX) minX = row[0];
      if (row[0] > maxX) maxX = row[0];
      if (row[1] < minY) minY = row[1];
      if (row[1] > maxY) maxY = row[1];
    }
    walkBounds = { minX, maxX, minY, maxY };
  }
  function ensureWalkDisplayMotion(motion) {
    if (!motion) return null;
    const display = view?.smoothClip ? view.smoothClip(motion) : motion;
    if (display !== resolvedWalkMotion) {
      resolvedWalkMotion = display;
      updateWalkBounds(display);
    }
    return display;
  }
  walkMotion.then((m) => {
    if (!m) return;
    if (!resolvedWalkMotion) {
      resolvedWalkMotion = m;
      updateWalkBounds(m);
    }
  });
  let mode = null; // 'stand' | 'walk' | 'policy' | 'gym'
  let modeToken = 0;
  let heroAnchor = { x: 0, y: 0 };
  let blendingToWalk = false;
  let walkOffset = [0, 0];
  let walkSampleTmp = null;
  let redeploy = null;

  // Autonomous physics showcase for #policy: runs real trained ONNX policies from #/simulations
  // (g1-bailar -> g1-saludar -> loop), so improvements in Simulations automatically carry over here.
  const POLICY_SHOWCASE = [
    { id: 'g1-bailar', motion: 'clip_bailar-01-gvhmr-balanced', durationS: 10.47 },
    { id: 'g1-saludar', motion: 'clip_saludar-02-gvhmr-balanced', durationS: 10.23 },
  ];
  const policyShow = { idx: 0, prevT: 0, switching: false, fallenAt: 0, startedAt: 0 };
  const policyMotionCache = new Map();
  function getPolicyMotion(motionId) {
    if (!policyMotionCache.has(motionId)) {
      policyMotionCache.set(motionId, savedMotion(motionId));
    }
    return policyMotionCache.get(motionId);
  }

  async function startPolicyShowcase(idx, token, { skipBlend = false } = {}) {
    if (gone || !view || token !== modeToken || mode !== 'policy') return;
    policyShow.switching = true;
    policyShow.idx = idx % POLICY_SHOWCASE.length;
    policyShow.prevT = 0;
    policyShow.fallenAt = 0;
    const item = POLICY_SHOWCASE[policyShow.idx];
    const motion = await getPolicyMotion(item.motion);
    if (gone || !view || token !== modeToken || mode !== 'policy') {
      policyShow.switching = false;
      return;
    }
    if (!skipBlend && motion?.qpos?.length && view.sim) {
      const [rawPx, rawPy] = view.sim.bodyPosition('pelvis');
      const startQ = Float64Array.from(motion.qpos[0]);
      const blendDur = smoothBlendDur(0.42, rawPx, rawPy, startQ[0], startQ[1]);
      const blended = await view.blendPose(startQ, { duration: blendDur });
      if (!blended || gone || !view || token !== modeToken || mode !== 'policy') {
        policyShow.switching = false;
        return;
      }
    }
    const ok = await useLevel(item.id, {
      reset: true,
      motion,
      guard: () => token === modeToken && mode === 'policy',
    });
    if (gone || !view || token !== modeToken || mode !== 'policy') {
      policyShow.switching = false;
      return;
    }
    if (ok) {
      policyShow.prevT = view.clipTime?.() ?? 0;
      policyShow.startedAt = performance.now();
    }
    policyShow.switching = false;
  }

  function updatePolicyShowcase(now) {
    if (mode !== 'policy' || !view?.sim || policyShow.switching || redeploy) return;
    const current = POLICY_SHOWCASE[policyShow.idx];
    const [, , pz] = view.sim.bodyPosition('pelvis');
    if (pz < FALLEN_PELVIS_M) {
      if (!policyShow.fallenAt) policyShow.fallenAt = now;
      else if (now - policyShow.fallenAt > FLOOR_SETTLE_MS) {
        startPolicyShowcase((policyShow.idx + 1) % POLICY_SHOWCASE.length, modeToken);
      }
      return;
    }
    policyShow.fallenAt = 0;
    const t = view.clipTime?.() ?? 0;
    const wrapped = policyShow.prevT > 2.0 && t < policyShow.prevT - 1.5;
    const nearEnd = current && t >= current.durationS - 0.18 && now - policyShow.startedAt > 3000;
    policyShow.prevT = t;
    if (wrapped || nearEnd) {
      startPolicyShowcase((policyShow.idx + 1) % POLICY_SHOWCASE.length, modeToken);
    }
  }

  const clampStageXY = (x, y) => ({
    x: Math.max(-7.5, Math.min(11.5, x)),
    y: Math.max(-1.8, Math.min(1.8, y)),
  });
  const smoothBlendDur = (base, fromX, fromY, toX, toY) => {
    if (isReducedMotion()) return 0;
    const dist = Math.hypot(toX - fromX, toY - fromY);
    // 6 m/s keeps peak smoothstep pelvis velocity <= 9 m/s (< 0.30 m/frame even at 30 fps)
    return Math.max(base, Math.min(1.8, dist / 6));
  };
  const clampWalkOffset = (dx, dy) => {
    if (!walkBounds) return [0, 0];
    const minDx = -8 - walkBounds.minX;
    const maxDx = 14 - walkBounds.maxX;
    const minDy = -2.2 - walkBounds.minY;
    const maxDy = 2.2 - walkBounds.maxY;
    return [Math.max(minDx, Math.min(maxDx, dx)), Math.max(minDy, Math.min(maxDy, dy))];
  };
  function standTargetQ(x, y) {
    const q = view.sim.keyQpos(view.sim.keyName);
    q[0] = x;
    q[1] = y;
    return q;
  }
  function sampleWalkAt(motion, t, offset) {
    walkSampleTmp ??= new Float64Array(motion.qpos[0].length);
    sampleMotion(motion, t, walkSampleTmp);
    walkSampleTmp[0] += offset[0];
    walkSampleTmp[1] += offset[1];
    return walkSampleTmp;
  }

  function finishRedeployState(owner) {
    if (owner === 'hero') {
      hero.fallen = false;
      hero.fallenAt = 0;
      say('stand', 'hud.stand');
    } else if (owner === 'gym') {
      const t = view.sim.data.time;
      gym.fallen = false;
      gym.fallenAt = 0;
      gym.since = t || 1e-6;
      gym.lastPush = gym.since - (GYM_PUSH_EVERY_S - GYM_FIRST_PUSH_S);
      $('[data-gym="status"]').innerHTML = T('gym.live');
    }
  }

  const isG1Sim = (v) =>
    Boolean(
      v?.sim?.data?.qpos &&
        v.sim.data.qpos.length >= 36 &&
        !/^(unitree_h1|luigi_lab3|luigi_lab4|factory_cell)\//.test(v.sim.sceneFile ?? '') &&
        (!v.sim.policy?.robot || v.sim.policy.robot === 'unitree_g1'),
    );

  function cancelRedeploy({ restoreOnly = false } = {}) {
    marks?.arrow?.hide?.();
    if (!redeploy) return;
    const active = redeploy;
    redeploy = null;
    view?.viewer?.resetRobotEffect?.();
    telemetry?.setRedeploy(null);
    if (!restoreOnly && isG1Sim(view) && !active.resetDone) {
      // Cancelled while still lying on the floor: stage upright at anchor so incoming blendPose
      // never interpolates from a crumpled floor pose.
      view.sim.reset();
      if (active.homeQ.length <= view.sim.data.qpos.length) view.sim.puppet(active.homeQ);
    }
    hero.fallen = false;
    hero.fallenAt = 0;
    gym.fallen = false;
    gym.fallenAt = 0;
  }

  function startRedeploy(owner, anchor, now = performance.now()) {
    if (!isG1Sim(view) || redeploy) return;
    const safeAnchor = clampStageXY(anchor.x, anchor.y);
    const homeQ = standTargetQ(safeAnchor.x, safeAnchor.y);
    if (isReducedMotion()) {
      view.sim.reset();
      if (homeQ.length <= view.sim.data.qpos.length) view.sim.data.qpos.set(homeQ);
      view.sim.holdCurrentPose();
      view.sim.mujoco.mj_forward(view.sim.model, view.sim.data);
      view.sim.simTarget = view.sim.data.time;
      finishRedeployState(owner);
      return;
    }
    const fallenQ = Float64Array.from(view.sim.data.qpos);
    const [fx, fy] = view.sim.bodyPosition('pelvis');
    if (fallenQ.length <= view.sim.data.qpos.length) view.sim.puppet(fallenQ);
    const crouchQ = view.sim.keyQpos('knees_bent');
    crouchQ[0] = safeAnchor.x;
    crouchQ[1] = safeAnchor.y;
    crouchQ[2] = Math.max(0.66, crouchQ[2] - 0.04);
    redeploy = {
      owner,
      anchor: safeAnchor,
      start: now,
      fx,
      fy,
      fallenQ,
      crouchQ,
      homeQ,
      resetDone: false,
      handoffDone: false,
      workQ: new Float64Array(homeQ.length),
    };
  }

  function updateRedeploy(now) {
    if (!redeploy || !isG1Sim(view)) return;
    const elapsed = now - redeploy.start;
    if (elapsed < REDEPLOY_DEMAT_MS) {
      const u = Math.max(0, Math.min(1, elapsed / REDEPLOY_DEMAT_MS));
      view.viewer.setRobotEffect({
        opacity: 1 - u * u,
        emissive: 1.4 * Math.sin(u * Math.PI * 0.5),
        emissiveColor: SIGNAL,
      });
      telemetry?.setRedeploy({ phase: 'dematerialize', progress: u, x: redeploy.fx, y: redeploy.fy });
      return;
    }
    if (!redeploy.resetDone) {
      redeploy.resetDone = true;
      view.sim.reset();
      if (redeploy.crouchQ.length <= view.sim.data.qpos.length) view.sim.puppet(redeploy.crouchQ);
      pushed.lastT = -Infinity;
    }
    const matEnd = REDEPLOY_DEMAT_MS + REDEPLOY_MAT_MS;
    if (elapsed < matEnd) {
      const u = Math.max(0, Math.min(1, (elapsed - REDEPLOY_DEMAT_MS) / REDEPLOY_MAT_MS));
      const e = 1 - Math.pow(1 - u, 3);
      const { crouchQ, homeQ, workQ } = redeploy;
      for (let j = 0; j < workQ.length; j++) workQ[j] = crouchQ[j] + (homeQ[j] - crouchQ[j]) * e;
      const norm = Math.hypot(workQ[3], workQ[4], workQ[5], workQ[6]) || 1;
      workQ[3] /= norm;
      workQ[4] /= norm;
      workQ[5] /= norm;
      workQ[6] /= norm;
      if (workQ.length <= view.sim.data.qpos.length) view.sim.puppet(workQ);
      view.viewer.setRobotEffect({
        opacity: e,
        emissive: 1.4 * (1 - e),
        emissiveColor: SIGNAL,
      });
      telemetry?.setRedeploy({ phase: 'materialize', progress: u, x: redeploy.anchor.x, y: redeploy.anchor.y });
      return;
    }
    if (!redeploy.handoffDone) {
      redeploy.handoffDone = true;
      view.viewer.resetRobotEffect();
      if (redeploy.homeQ.length <= view.sim.data.qpos.length) view.sim.puppet(redeploy.homeQ);
      view.releasePuppet({ resetPolicy: true, syncPrevious: true });
      finishRedeployState(redeploy.owner);
    }
    const u = Math.max(0, Math.min(1, (elapsed - matEnd) / REDEPLOY_HANDOFF_MS));
    telemetry?.setRedeploy({ phase: 'handoff', progress: u, x: redeploy.anchor.x, y: redeploy.anchor.y });
    if (elapsed >= REDEPLOY_TOTAL_MS) {
      telemetry?.setRedeploy(null);
      redeploy = null;
    }
  }

  async function setMode(next) {
    if (!view || mode === next) return;
    const prevKind = mode?.split(':')[0] ?? null;
    const [kind, wanted = FINAL_LEVEL] = next.split(':');
    const wasFirst = mode === null;
    mode = next;
    const token = ++modeToken;
    userOrbit.reset = true; // smoothly align camera back to the chapter's canonical viewpoint
    Object.assign(gym, { since: 0, shownAt: 0 });
    marks?.arrow?.hide?.();
    cancelRedeploy();
    blendingToWalk = false;
    policyShow.switching = false;

    const [rawPx, rawPy, rawPz] = view.sim ? view.sim.bodyPosition('pelvis') : [0, 0, 0.78];
    const anchor = clampStageXY(rawPx, rawPy);

    if (kind === 'walk') {
      blendingToWalk = true;
      await useLevel(FINAL_LEVEL, { reset: false, guard: () => token === modeToken });
      const rawMotion = await walkMotion;
      if (token !== modeToken || gone || !view || !rawMotion) return;
      const motion = ensureWalkDisplayMotion(rawMotion);
      const dur = walkDuration();
      walk.t = walk.dir < 0 ? Math.max(0, dur - 0.001) : 0;
      walk.prevT = walk.t;
      video.currentTime = walk.t;
      const mAnchor = sampleWalkAt(motion, walk.t, [0, 0]);
      walkOffset = clampWalkOffset(anchor.x - mAnchor[0], anchor.y - mAnchor[1]);
      const targetPos = sampleWalkAt(motion, walk.t, walkOffset);
      const blendDur = wasFirst ? 0 : smoothBlendDur(0.4, rawPx, rawPy, targetPos[0], targetPos[1]);
      const ok = await view.blendPose(() => sampleWalkAt(motion, walk.t, walkOffset), { duration: blendDur });
      if (!ok || token !== modeToken || gone || !view || mode !== 'walk') return;
      blendingToWalk = false;
      view.playClip(motion, { loop: false, autoAdvance: false, offset: walkOffset, time: walk.t });
      view.seek(walk.t);
    } else if (kind === 'policy') {
      await startPolicyShowcase(0, token, { skipBlend: wasFirst });
    } else if (kind === 'gym') {
      gym.ringX = anchor.x;
      gym.ringY = anchor.y;
      if (marks && marks.opacity <= 0.01) {
        marks.ring.position.set(anchor.x, marks.ring.position.y, -anchor.y);
      }
      gym.loading = true;
      const ok = await useLevel(gymLevel(), { reset: false, guard: () => token === modeToken });
      gym.loading = false;
      if (!ok || token !== modeToken || gone || !view || mode !== 'gym') return;
      if (rawPz < FALLEN_PELVIS_M) {
        startGymRun({ x: anchor.x, y: anchor.y, reset: true });
      } else if (prevKind === 'policy' || prevKind === 'walk' || view.sim.puppeted || view.clipTime?.() > 0) {
        const blendDur = wasFirst ? 0 : smoothBlendDur(0.35, rawPx, rawPy, anchor.x, anchor.y);
        const blended = await view.blendPose(standTargetQ(anchor.x, anchor.y), {
          duration: blendDur,
          release: true,
          syncPrevious: true,
        });
        if (!blended || token !== modeToken || gone || !view || mode !== 'gym') return;
        startGymRun({ x: anchor.x, y: anchor.y, reset: false });
      } else {
        startGymRun({ x: anchor.x, y: anchor.y, reset: false });
      }
    } else {
      heroAnchor = anchor;
      await useLevel(wanted, { reset: false, guard: () => token === modeToken });
      if (token !== modeToken || gone || !view || mode !== next) return;
      if (prevKind === 'policy' || prevKind === 'walk' || view.sim.puppeted || view.clipTime?.() > 0) {
        const blendDur = wasFirst ? 0 : smoothBlendDur(0.35, rawPx, rawPy, anchor.x, anchor.y);
        await view.blendPose(standTargetQ(anchor.x, anchor.y), {
          duration: blendDur,
          release: true,
          syncPrevious: true,
        });
      } else if (rawPz < FALLEN_PELVIS_M) {
        startRedeploy('hero', anchor);
      }
    }
  }
  const modeAt = () => {
    if (navFlight.chapter && performance.now() < navFlight.until) {
      return navFlight.chapter.dataset.mode ?? 'stand';
    }
    return chapterAt(scrollY + innerHeight * 0.5).dataset.mode ?? 'stand';
  };

  // Hero: the robot stands on its own with the trained policy; a push shows it catching itself.
  // fallenAt: when the robot was first seen on the floor (0 while standing), to stand it up again.
  const hero = { pushes: 0, falls: 0, pushedAt: 0, fallen: false, fallenAt: 0 };
  const readoutEl = $('.sim-readout');
  const stateSpan = $('[data-sim="state"]');
  const say = (state, key, vars) => {
    if (readoutEl) readoutEl.dataset.state = state;
    if (stateSpan) stateSpan.innerHTML = T(key, vars);
  };
  let heroTimer = 0;
  // The hero's push is the one the trained robot holds, spaced as in training (push.js); the
  // Gym's own pushes count in its spacing too (pushed.lastT).
  const pushed = { lastT: -Infinity, queued: 0 };
  const triggerHeroKick = () => {
    for (const button of $$('.hero-push')) {
      button.classList.remove('kick');
      void button.offsetWidth; // restart the animation immediately on click/space
      button.classList.add('kick');
      button.addEventListener('animationend', () => button.classList.remove('kick'), { once: true });
    }
  };
  function pushHero() {
    if (!view || mode !== 'stand' || redeploy || hero.fallen) return;
    triggerHeroKick();
    pushWhenReady(pushed, view, landHeroPush, () => !gone && mode === 'stand' && !redeploy && !hero.fallen);
  }
  function landHeroPush() {
    drawPush(STANDING_PUSH_N);
    hero.pushes += 1;
    hero.pushedAt = performance.now();
    hero.fallen = false;
    say('push', 'hud.push', { n: STANDING_PUSH_N });
    clearTimeout(heroTimer);
    heroTimer = setTimeout(() => {
      if (!hero.fallen) say('stand', 'hud.stand');
    }, AFTER_PUSH_S * 1000);
  }
  // A robot on the floor in the hero, whatever put it there (a push the policy missed, or the page
  // coming back to the hero with it fallen), waits FLOOR_SETTLE_MS then runs the fluid Telemetry Redeploy.
  function standHeroUp(now) {
    if (redeploy || view.sim.puppeted) return;
    const [px, py, pz] = view.sim.bodyPosition('pelvis');
    const down = pz < FALLEN_PELVIS_M;
    // Gently redeploy back to the stage anchor only if a heavy push drove it far off-stage.
    if (!down && Math.hypot(px - heroAnchor.x, py - heroAnchor.y) > RING_M * 1.45 && now - hero.pushedAt > 2400) {
      startRedeploy('hero', heroAnchor, now);
      return;
    }
    if (!down) {
      hero.fallenAt = 0;
      return;
    }
    if (!hero.fallenAt) {
      hero.fallenAt = now;
      if (hero.pushedAt && !hero.fallen) {
        hero.fallen = true; // the policy misses some pushes (training/README.md): say so
        hero.falls += 1;
        say('fall', 'hud.fall');
      }
    } else if (now - hero.fallenAt > FLOOR_SETTLE_MS) {
      startRedeploy('hero', heroAnchor, now);
    }
  }
  $$('.hero-push').forEach((button) => on(button, 'click', pushHero));
  // Space pushes the robot, as the hero's button says, wherever it stands on its own (the hero,
  // the Gym and Policy); during the walk, a puppet, it does nothing, and the closing scrolls. Enter moves the
  // film forward: it goes to the next stop (each of the Gym's checkpoints, then each chapter), and
  // after the last one the browser scrolls as usual. Space used to move the film past the hero
  // too, which read oddly next to a hero where it pushes. From where the glide under way ends, not scrollY, so presses during a glide
  // chain: Lenis 1.3 moves targetScroll along with a programmatic glide (it is the current
  // position, not the stop), so reading it mid-glide sent each press back to the same stop.
  // Enter always goes to the next stop, the hero included, so a demo can move through the film
  // fast; on phones it takes the same step as the down arrow (one chapter, or one Gym stage).
  // A push button keeps the focus after a click (Chrome on the Mac): Enter there still advances
  // instead of pressing it again; the other buttons and links keep their own Enter.
  const ENTER_GLIDE_S = 0.35; // still reads as a move to the next stop, but 1 s felt stuck
  on(window, 'keydown', (event) => {
    const enter = event.key === 'Enter';
    const own = enter ? 'input, textarea, select, button:not(.hero-push, .gym-push), a' : 'input, textarea, select, button, a';
    // Held down, Enter repeats and runs down the stops; space keeps one push per press.
    if ((event.code !== 'Space' && !enter) || (event.repeat && !enter) || event.target.closest?.(own)) return;
    if (!enter) {
      if (chapterAt(scrollY + innerHeight * 0.5) === chapters.at(-1)) return; // the closing scrolls as usual
      event.preventDefault();
      if (mode === 'gym') pushGym();
      else pushHero();
      return;
    }
    if (narrow()) {
      event.preventDefault();
      if (!event.repeat) step(1); // step reads the chapter from scrollY, which lags a held key
      return;
    }
    const from = lenis ? (lenis.animate.isRunning ? lenis.animate.to : lenis.targetScroll) : scrollY;
    const next = enterStops().find((stop) => stop > from + STOP_PX);
    if (next === undefined) return;
    event.preventDefault();
    // Enter is for moving through a demo fast: a short glide (ENTER_GLIDE_S).
    if (lenis) lenisScrollTo(next, { duration: ENTER_GLIDE_S });
    else window.scrollTo({ top: next });
  });

  // Gym: the three stages are three screens of scroll. The chapter is four screens tall and its
  // panel sticks for three of them (landing.css .gym); the stage is the third of that stretch you
  // are in, so scrolling is what trains the robot. Each stage's middle is a stop: scrolling down,
  // a wheel or trackpad gesture, however fast, stops there instead of flying past (gymGate), and
  // keeps the scroll until that checkpoint has shown what it does (gymShown): the untrained robot
  // falls (~1,1 s), the others take their first push. Up, the top bar's links and the axis move freely.
  const gymEl = $('.gym');
  const gymPanel = gymEl.querySelector('.sticky');
  const gym = { since: 0, lastPush: 0, fallen: false, fallenAt: 0, loading: false, shownAt: 0, forceN: PUSH_N, ringX: 0, ringY: 0 };
  const forceSlider = $('.gym-force-slider');
  const forceLabel = $('[data-gym="force"]');
  if (forceSlider) {
    on(forceSlider, 'input', () => {
      gym.forceN = Number(forceSlider.value) || PUSH_N;
      if (forceLabel) forceLabel.textContent = `${gym.forceN}\u00A0N`;
      shownStage = -1;
      showGymStage();
    });
  }
  const simInfoBtn = $('.sim-info-btn');
  if (simInfoBtn) {
    on(simInfoBtn, 'click', (event) => {
      event.stopPropagation();
      simInfoBtn.classList.toggle('open');
    });
    on(document, 'click', () => simInfoBtn.classList.remove('open'));
  }
  const triggerGymKick = () => {
    for (const button of $$('.gym-push')) {
      button.classList.remove('kick');
      void button.offsetWidth; // restart GPU-only ring animation immediately on click/space
      button.classList.add('kick');
      button.addEventListener('animationend', () => button.classList.remove('kick'), { once: true });
    }
  };
  // A push by hand (space or the panel's button) on the checkpoint on screen. The Gym's own pushes
  // count from it, so two never land on top of each other.
  function pushGym() {
    if (!view || mode !== 'gym' || !gym.since || gym.fallen || gym.loading || redeploy) return;
    triggerGymKick();
    gym.lastPush = pushed.lastT = view.sim.data.time;
    gym.shownAt ||= performance.now() + GYM_SHOWN_PUSH_S * 1000;
    view.push(undefined, gym.forceN);
    drawPush(gym.forceN);
    $('[data-gym="status"]').innerHTML = T('gym.pushed', { n: gym.forceN });
  }
  $$('.gym-push').forEach((button) => on(button, 'click', pushGym));
  const GYM_SHOWN_FALL_S = 0.4; // after a fall, a moment on the floor before the scroll is let go
  const GYM_SHOWN_PUSH_S = 0.8; // after a push, time to see it stagger and catch itself (or not)
  // A stop never keeps the scroll longer, even if a checkpoint is slow to load: longer reads as
  // stuck (2.5 s did), which is why the Gym once ran on its own clock instead of the scroll. And
  // each stop holds once per visit: coming back to a stage scrolls straight through it.
  const GYM_HOLD_MAX_S = 1.2;
  const STOP_PX = 4; // Lenis lands on fractional pixels: this close to a stop is on it
  const held = new Set(); // the stops that already held the scroll
  const gymStops = () => GYM_STAGES.map((_, i) => layout.gymTop + (i + 0.5) * layout.gymStep);
  // On phones the Gym is one screen tall and its stage moves with the arrows or the axis (phone.stage),
  // not with the scroll: long scroll-driven stretches felt stuck under a finger.
  const phone = { stage: 0 };
  // Locking the clicked target stage during Lenis's programmatic scroll avoids transiently activating
  // the middle 100M stage (and flickering the UI/policy loader) when jumping 10M <-> 300M.
  const gymFlight = { until: 0, stage: -1 };
  on(window, 'wheel', () => (gymFlight.until = 0), { passive: true });
  on(window, 'touchstart', () => (gymFlight.until = 0), { passive: true });
  const gymStage = () => {
    if (narrow() || !layout.gymStep) return phone.stage;
    if (gymFlight.stage >= 0 && performance.now() < gymFlight.until) return gymFlight.stage;
    return Math.min(GYM_STAGES.length - 1, Math.max(0, Math.floor((scrollY - layout.gymTop) / layout.gymStep)));
  };
  // Where Enter stops after the hero: each chapter's top plus data-rest (a share of the screen,
  // where its words are all in), the Gym's checkpoints instead of the Gym, and the ways to try it
  // instead of the closing (where the top bar's "Probar" lands too).
  const enterStops = () =>
    chapters.slice(1).flatMap((chapter, i) => {
      if (chapter === gymEl) return gymStops();
      if (chapter.contains(probar)) return [anchorTop(probar)];
      return [layout.tops[i + 1] + innerHeight * Number(chapter.dataset.rest ?? 0)];
    });
  function measure() {
    layout.tops = chapters.map((chapter) => chapter.offsetTop);
    layout.gymTop = gymEl.offsetTop;
    layout.gymStep = (gymEl.offsetHeight - gymPanel.offsetHeight) / GYM_STAGES.length;
  }
  measure();
  const layoutObserver = new ResizeObserver(measure);
  layoutObserver.observe(root.querySelector('.landing'));
  cleanups.push(() => layoutObserver.disconnect());
  const gymLevel = () => GYM_STAGES[gymStage()].level;
  function gymGate() {
    // Let wheel and trackpad scrolling glide naturally through Tridi Gym without clamping or blocking deltaY,
    // which previously fought trackpad momentum and caused scroll stutter/flicker.
    return true;
  }
  $$('.axis-stop').forEach((stop, i) =>
    on(stop, 'click', () => {
      if (narrow()) return void (phone.stage = i);
      gymFlight.stage = i;
      gymFlight.until = performance.now() + 1050;
      showGymStage();
      const top = gymStops()[i];
      if (lenis) lenisScrollTo(top, { duration: 1 });
      else window.scrollTo({ top });
    }),
  );
  // Phone arrows: one screen per chapter, and inside the Gym one stage per tap.
  const chapterIndex = () => Math.max(0, layout.tops.findLastIndex((top) => top <= scrollY + innerHeight * 0.4));
  const goTo = (chapterIdx) => {
    const top = layout.tops[chapterIdx] ?? 0;
    if (lenis) lenisScrollTo(top, { duration: 0.8 });
    else window.scrollTo({ top, behavior: isReducedMotion() ? 'auto' : 'smooth' });
  };
  function step(direction) {
    const i = chapterIndex();
    if (chapters[i] === gymEl) {
      const next = phone.stage + direction;
      if (next >= 0 && next < GYM_STAGES.length) return void (phone.stage = next);
    }
    const targetIdx = i + direction;
    const target = chapters[targetIdx];
    if (!target) return;
    if (target === gymEl) phone.stage = direction > 0 ? 0 : GYM_STAGES.length - 1;
    goTo(targetIdx);
  }
  on($('.arrow-up'), 'click', () => step(-1));
  on($('.arrow-down'), 'click', () => step(1));
  const updateArrows = () => {
    const i = chapterIndex();
    const inGym = chapters[i] === gymEl;
    $('.arrow-up').disabled = i === 0 && !(inGym && phone.stage > 0);
    $('.arrow-down').disabled = i === chapters.length - 1;
  };
  on(window, 'scroll', updateArrows, { passive: true });
  updateArrows();

  let shownStage = -1;
  const stepsCounter = { value: GYM_STAGES[0].steps };
  // Numbers written as text (the step counter) take the new language's decimal mark on a switch.
  cleanups.push(onLang(() => (shownStage = -1)));
  function showGymStage() {
    const stage = gymStage();
    if (stage === shownStage) return;
    shownStage = stage;
    const current = GYM_STAGES[stage];
    for (const selector of ['.axis-stop', '.axis-tick']) {
      $$(selector).forEach((stop, i) => {
        stop.classList.toggle('on', i === stage);
        stop.classList.toggle('past', i < stage);
        if (selector === '.axis-stop') stop.setAttribute('aria-pressed', String(i === stage));
      });
    }
    $('.axis-fill').style.width = $$('.axis-stop')[stage].style.getPropertyValue('--at');
    $('[data-gym="text"]').innerHTML = T(`stage.${stage}.text`);
    $('[data-gym="numbers"]').innerHTML = `<span>${T('gym.upOf', { s: (l) => `${fmt(current.up, current.up % 1 ? 1 : 0)(l)}\u00A0s` })}</span><span>${T('gym.pushesOf', { held: (l) => T_OF(current.pushes, l), n: gym.forceN })}</span>`;
    const capEl = $('[data-gym="force-cap"]');
    const zoneEl = $('[data-gym="force-zone"]');
    if (capEl) {
      capEl.innerHTML = current.maxN > 0 ? T('gym.capHold', { label: current.label, max: current.maxN }) : T('gym.capZero');
      capEl.dataset.over = String(gym.forceN > current.maxN);
    }
    if (zoneEl) {
      // Force slider runs 100..500 N (400 N span), so map maxN onto the exact slider range.
      const pct = current.maxN <= 100 ? 0 : Math.min(100, Math.max(0, ((current.maxN - 100) / 400) * 100));
      zoneEl.style.width = `${pct}%`;
    }
    // Single shared counter object with killTweensOf so rapid stage changes never run competing tweens.
    gsap.killTweensOf(stepsCounter);
    gsap.to(stepsCounter, {
      value: current.steps,
      duration: isReducedMotion() ? 0 : 0.65,
      ease: 'power2.out',
      onUpdate: () => {
        const el = $('[data-gym="steps"]');
        if (!el) return;
        el.dataset.value = stepsCounter.value;
        const millions = Math.max(1, Math.round(stepsCounter.value / 1e6));
        el.textContent = `${fmtInt(millions)(lang())}\u00A0M`;
      },
    });
  }
  // Times are the simulation's own clock, not the wall's: a slow or hidden tab cannot fake them.
  function startGymRun({ x = gym.ringX, y = gym.ringY, reset = false } = {}) {
    gym.ringX = x;
    gym.ringY = y;
    if (reset && isG1Sim(view)) {
      view.sim.reset();
      view.sim.data.qpos[0] = x;
      view.sim.data.qpos[1] = y;
      view.sim.mujoco.mj_forward(view.sim.model, view.sim.data);
    }
    const t = view.sim.data.time;
    $('[data-gym="status"]').innerHTML = T('gym.live'); // not the last checkpoint's fall
    // The first push comes at GYM_FIRST_PUSH_S, then every GYM_PUSH_EVERY_S.
    Object.assign(gym, { since: t || 1e-6, lastPush: t - (GYM_PUSH_EVERY_S - GYM_FIRST_PUSH_S), fallen: false, fallenAt: 0 });
  }
  function runGym(nowMs = performance.now()) {
    if (redeploy) return;
    const wanted = gymLevel();
    if (wanted !== level) {
      if (gym.loading) return; // one checkpoint at a time; the next frame asks again if needed
      gym.loading = true;
      const token = modeToken;
      const swapAnchor = { x: gym.ringX, y: gym.ringY };
      useLevel(wanted, { reset: false, guard: () => token === modeToken && mode === 'gym' }).then((ok) => {
        gym.loading = false;
        if (!ok || token !== modeToken || gone || mode !== 'gym') return;
        if (!gym.fallen && !redeploy) {
          if (!gym.since) {
            startGymRun({ ...swapAnchor, reset: false });
          } else {
            gym.shownAt = 0;
            $('[data-gym="status"]').innerHTML = T('gym.live');
          }
        }
      });
      return;
    }
    if (gym.fallen) {
      if (nowMs - gym.fallenAt > FLOOR_SETTLE_MS) {
        startRedeploy('gym', { x: gym.ringX, y: gym.ringY }, nowMs);
      }
      return;
    }
    if (!gym.since) return;
    const now = view.sim.data.time;
    const up = now - gym.since;
    $('[data-gym="up"]').textContent = `${fmt(up, 1)(lang())}\u00A0s`;
    const [px, py, pz] = view.sim.bodyPosition('pelvis');
    if (pz < FALLEN_PELVIS_M) {
      gym.fallen = true;
      gym.fallenAt = nowMs;
      gym.shownAt ||= nowMs + GYM_SHOWN_FALL_S * 1000;
      $('[data-gym="status"]').innerHTML = T('gym.fell');
      return;
    }
    // Only recenter after a recovery has fully settled (never mid-fall right after a heavy push).
    if (Math.hypot(px - gym.ringX, py - gym.ringY) > RING_M * 1.45 && now - gym.lastPush > 2.2) {
      startRedeploy('gym', { x: gym.ringX, y: gym.ringY }, nowMs);
      return;
    }
    if (now - gym.lastPush > GYM_PUSH_EVERY_S) {
      gym.lastPush = pushed.lastT = now;
      gym.shownAt ||= nowMs + GYM_SHOWN_PUSH_S * 1000;
      view.push(undefined, gym.forceN);
      drawPush(gym.forceN);
      $('[data-gym="status"]').innerHTML = T('gym.pushed', { n: gym.forceN });
    }
  }

  // ---- Capture: the video, the skeleton and the robot on one clock (the video's) ----
  const video = $('.walk-video');
  let skeleton = null;
  // The 2D points MediaPipe found in this same video, drawn over the person (video-overlay.js, as in
  // Simulaciones), on the walk's clock: forward and backward with the scroll.
  const walkPose = createPoseDrawing(video, $('.walk-overlay'), { fit: 'cover' });
  walkPose.load(resolveAsset(VIDEOS['clip_2026-10-23_caminar-perfil_01'].pose)).catch((error) => console.error(error));
  const captureEl = $('.capture');
  // The walk follows the scroll's direction: scrolling down it plays forward on the video's own
  // clock; scrolling up, the video, the skeleton and the robot run backward together, so going
  // back up the page rewinds the story (the robot walks back the way it came). Browsers cannot
  // play a video backward (negative playbackRate), so in reverse the video is paused and seeked.
  // dir keeps the last direction while the page stands still. DIR_PX ignores Lenis's sub-pixel
  // settling, which would flip the direction at the end of every glide.
  const DIR_PX = 0.5;
  const walk = { t: 0, prevT: 0, dir: 1, lastY: scrollY, lastNow: 0 };
  const walkDuration = () => (Number.isFinite(video.duration) && video.duration > 0 ? video.duration : walkMotionDuration);
  function recenterWalkLoop(nextT) {
    const motion = resolvedWalkMotion;
    if (!motion || !view?.sim || gone) return;
    const token = modeToken;
    const [curX, curY] = view.sim.bodyPosition('pelvis');
    walk.t = nextT;
    walk.prevT = nextT;
    walkOffset = [0, 0];
    if (!video.paused) video.pause();
    video.currentTime = walk.t;
    if (skeleton?.clip) {
      skeleton.time = walk.t;
      skeleton.render();
    }
    walkPose.draw(walk.t);
    const targetPos = sampleWalkAt(motion, walk.t, walkOffset);
    const blendDur = smoothBlendDur(0.45, curX, curY, targetPos[0], targetPos[1]);
    blendingToWalk = true;
    view.blendPose(() => sampleWalkAt(motion, walk.t, walkOffset), { duration: blendDur }).then((ok) => {
      if (!ok || token !== modeToken || gone || !view || mode !== 'walk') return;
      blendingToWalk = false;
      walk.prevT = walk.t;
      view.playClip(motion, { loop: false, autoAdvance: false, offset: walkOffset, time: walk.t });
      view.seek(walk.t);
    });
  }
  function updateWalk(now) {
    const dt = walk.lastNow ? Math.min(0.1, (now - walk.lastNow) / 1000) : 0; // 0.1: no leap after a hidden tab
    walk.lastNow = now;
    if (mode !== 'walk') {
      if (!video.paused) video.pause();
      return;
    }
    if (blendingToWalk) {
      if (!video.paused) video.pause();
      if (skeleton?.clip) {
        skeleton.time = walk.t;
        skeleton.render();
      }
      walkPose.draw(walk.t);
      return;
    }
    const duration = walkDuration();
    if (walk.dir > 0 || !duration) {
      if (video.paused) video.play().catch(() => {});
      walk.t = video.currentTime;
      if (duration > 0 && walk.t < walk.prevT - duration * 0.5) {
        recenterWalkLoop(walk.t);
        return;
      }
    } else {
      if (!video.paused) video.pause();
      const nextT = walk.t - dt;
      if (nextT < 0) {
        recenterWalkLoop(Math.max(0, duration - 0.001));
        return;
      }
      walk.t = nextT;
      // One seek at a time: queuing one every frame made the video fall behind and stutter.
      if (!video.seeking) video.currentTime = walk.t;
    }
    walk.prevT = walk.t;
    if (skeleton?.clip) {
      skeleton.time = walk.t;
      skeleton.render();
    }
    walkPose.draw(walk.t);
    view.seek(walk.t);
  }
  function updateScrollDir() {
    const delta = scrollY - walk.lastY;
    walk.lastY = scrollY;
    if (Math.abs(delta) > DIR_PX) walk.dir = Math.sign(delta);
  }

  // ---- The wash: one fixed dark veil behind the words, on the side they are on ----
  // A veil per chapter ended in a hard line where the chapter ended; one veil for the whole page,
  // eased toward each chapter's side, leaves no edge. On phones the words sit low: a floor instead.
  const washEl = $('.film-wash');
  const hudEl = $('.film-hud');
  const navLinks = $$('.topnav > .nav-direct');
  let activeNavHref = '';
  // The hero's title sits low on the left, over the plaza & street (landing/world.js).
  const WASH = { hero: [0.85, 0], capture: [1, 0], gym: [1, 0], policy: [1, 0], close: [0, 0] };
  const wash = { left: 0, right: 0, floor: 0 };
  const washed = { left: '', right: '', floor: '' }; // what the veil has now: write only changes
  function updateWash(dt = 1 / 60) {
    const inFlight = navFlight.chapter && performance.now() < navFlight.until;
    const chapter = inFlight ? navFlight.chapter : chapterAt(scrollY + innerHeight * 0.5);
    const wantedHref = `#${chapter.id}`;
    if (wantedHref !== activeNavHref) {
      activeNavHref = wantedHref;
      for (const link of navLinks) {
        const isCurrent = link.getAttribute('href') === wantedHref;
        link.classList.toggle('active', isCurrent);
        if (isCurrent) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
      if (hudEl) {
        hudEl.dataset.shot = chapter.dataset.shot || 'hero';
        hudEl.classList.toggle('is-closing', chapter.dataset.shot === 'close');
      }
    }
    const [left, right] = WASH[chapter.dataset.shot] ?? [0, 0];
    const goal = narrow() ? { left: 0, right: 0, floor: chapter.dataset.shot === 'close' ? 0 : 1 } : { left, right, floor: 0 };
    const k = isReducedMotion() ? 1 : 1 - Math.exp(-dt / 0.20);
    for (const side of Object.keys(wash)) {
      wash[side] += (goal[side] - wash[side]) * k;
      const value = wash[side].toFixed(3);
      if (value !== washed[side]) washEl.style.setProperty(`--wash-${side}`, (washed[side] = value));
    }
  }

  // The simulation's own readout, in the corner of the film: its clock and its contacts. Ten
  // times a second is enough to read and keeps the page from rewriting text every frame.
  const READOUT_EVERY_MS = 100;
  let readAt = 0;
  function updateReadout(now) {
    if (now - readAt < READOUT_EVERY_MS) return;
    readAt = now;
    $('[data-sim="time"]').textContent = fmt(view.sim.data.time, 1)(lang());
    $('[data-sim="contacts"]').textContent = view.sim.data.ncon;
  }

  // ---- Every frame ----
  let frameId = requestAnimationFrame(function frame(now) {
    const frameDt = lastFrameMs ? Math.min(0.1, Math.max(0, (now - lastFrameMs) / 1000)) : 1 / 60;
    lastFrameMs = now;
    const currentMode = modeAt();
    const washGoal = currentMode === 'gym' ? 1 : 0;
    if (isReducedMotion()) {
      gymWashT = washGoal;
    } else {
      const washStep = frameDt / 0.85;
      if (gymWashT < washGoal) gymWashT = Math.min(washGoal, gymWashT + washStep);
      else if (gymWashT > washGoal) gymWashT = Math.max(washGoal, gymWashT - washStep);
    }
    gymWash = gymWashT * gymWashT * (3 - 2 * gymWashT);
    if (Math.abs(gymWash - washGoal) < 0.001) {
      gymWash = washGoal;
      gymWashT = washGoal;
    }
    const washStr = gymWash.toFixed(3);
    if (washStr !== lastGymWashCss) {
      lastGymWashCss = washStr;
      landingEl?.style.setProperty('--gym-wash', washStr);
    }
    const chamber = gymWash > 0.5;
    if (chamber !== isGymChamber) {
      isGymChamber = chamber;
      landingEl?.classList.toggle('is-gym-chamber', chamber);
    }

    updateWash(frameDt);
    updateMarks(frameDt, now * 0.001);
    if (view) {
      landingWorld?.update?.(frameDt, now * 0.001);
      const [px, py] = view.sim.bodyPosition('pelvis');
      landingWorld?.setGymWash?.(gymWash, [px, -py]);
      if (hemiLight) {
        hemiLight.color.setHex(0xaec7e8).lerp(GYM_HEMI_SKY, gymWash);
        hemiLight.groundColor.setHex(0x313a4a).lerp(GYM_HEMI_GROUND, gymWash);
        hemiLight.intensity = 1.20 + 0.05 * gymWash;
      }
      updateRedeploy(now);
      // Show telemetry in Hero and Tridi Gym; CoM marker only in Tridi Gym.
      const showTelemetry = (mode === 'gym' || mode === 'stand') && (!redeploy || redeploy.handoffDone);
      telemetry?.update(showTelemetry, { com: mode === 'gym', gymWash });
      updateReadout(now);
      directCamera(view, frameDt);
      updateScrollDir();
      setMode(currentMode);
      updateWalk(now);
      if (mode === 'policy') updatePolicyShowcase(now);
      if (mode === 'gym') {
        showGymStage();
        runGym(now);
      }
      if (mode === 'stand') standHeroUp(now);
    }
    frameId = requestAnimationFrame(frame);
  });

  robot.ready.then(
    (loaded) => {
      if (!loaded || gone) return;
      view = loaded;
      const { camera, controls } = view.viewer;
      saved = {
        offset: camera.position.clone().sub(controls.target),
        targetHeight: view.viewer.targetHeight,
        maxPolarAngle: controls.maxPolarAngle,
        snapOnTeleport: view.viewer.snapOnTeleport,
        onFrame: view.viewer.onFrame ?? null,
      };
      view.viewer.snapOnTeleport = false; // continuous single-camera dolly across shots and redeploys
      controls.enabled = false; // the scroll directs the camera here
      // Balanced cyber-twilight lighting harmonized with landing/world.js (Sky +1.8 deg + PMREM 0.76 + FogExp2 0x151c29):
      // key rides with the camera; sunLight stays the sole shadow caster; hemiLight lifts shadows cleanly.
      key = new THREE.PointLight(0xfff7ee, 5.0, 13, 1.35);
      const sunLight = view.viewer.sun;
      hemiLight = view.viewer.scene.children.find((o) => o.isHemisphereLight);
      saved.sun = sunLight && { color: sunLight.color.getHex(), intensity: sunLight.intensity, pos: sunLight.position.clone() };
      saved.hemi = hemiLight && { color: hemiLight.color.getHex(), ground: hemiLight.groundColor.getHex(), intensity: hemiLight.intensity };
      if (sunLight) {
        sunLight.color.setHex(0xfff0df);
        sunLight.intensity = 2.18;
      }
      if (hemiLight) {
        hemiLight.color.setHex(0xaec7e8);
        hemiLight.groundColor.setHex(0x313a4a);
        hemiLight.intensity = 1.20;
      }
      lights = [key];
      saved.exposure = view.viewer.renderer.toneMappingExposure;
      saved.pixelRatio = view.viewer.renderer.getPixelRatio();
      view.viewer.renderer.setPixelRatio(Math.min(devicePixelRatio, FILM_PIXEL_RATIO));
      view.viewer.resize();
      view.viewer.renderer.toneMappingExposure = 1.23;
      lights.forEach((light) => view.viewer.scene.add(light));
      // Twilight robotics plaza & test-street around the robot instead of the grid, while the landing has it.
      landingWorld = dressLandingWorld(view.viewer.scene, view.viewer.renderer);
      marks = makeMarks(view.viewer.scene);
      telemetry = dressTelemetry(view);
      $('[data-sim="rates"]').innerHTML = T('sim.rates', { hz: Math.round(1 / view.sim.model.opt.timestep), policy: DECISIONS_PER_S });
      if (!holdBoot) film.classList.add('ready');
      $$('.hero-push, .gym-push').forEach((button) => (button.disabled = false));
      warmUp();
    },
    (error) => {
      if (gone) return;
      $('.boot-line').innerHTML = T('boot.failed');
      console.error(error);
    },
  );

  // While the reader is still on the hero, do the work the next chapters would otherwise do on
  // arrival: the skeleton's renderer, and the Gym's checkpoints downloaded into the browser's cache
  // (loading one then only builds its network, instead of waiting on the network mid-scroll).
  function warmUp() {
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 200));
    idle(buildSkeleton, { timeout: 1500 });
    idle(() => {
      for (const stage of GYM_STAGES) {
        const { onnx, json } = policyUrls(stage.level);
        if (onnx) fetchCachedOnnxBytes(onnx).catch(() => {});
        if (json) fetchCachedJson(json).catch(() => {});
      }
      for (const item of POLICY_SHOWCASE) {
        const { onnx, json } = policyUrls(item.id);
        if (onnx) fetchCachedOnnxBytes(onnx).catch(() => {});
        if (json) fetchCachedJson(json).catch(() => {});
      }
    }, { timeout: 3000 });
  }

  // ---- Scroll choreography (GSAP) ----
  let ctx = null;
  function syncGsapMotion() {
    ctx?.revert();
    ctx = null;
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    if (isReducedMotion()) return;
    ctx = gsap.context(() => {
      // Hero words: lines rise in on load; the whole caption drifts up and fades as you leave.
      gsap.from('.hero-caption > *', { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.2 });
      gsap.to('.hero-caption', {
        y: -80,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 40%', scrub: true },
      });

      // Capture: video, skeleton and robot are all on screen at once; the frames and the one text
      // rise in as the chapter arrives.
      gsap.from('.capture-media .frame, .capture-caption', {
        opacity: 0,
        y: 28,
        stagger: 0.08,
        scrollTrigger: { trigger: '.capture', start: 'top 75%', end: 'top 15%', scrub: true },
      });

      // Gym: card rises in as one unit so children never shift outside the panel border.
      gsap.from('.gym-caption', { opacity: 0, y: 20, duration: 0.55, scrollTrigger: { trigger: '.gym', start: 'top 65%', toggleActions: 'play none none none' } });

      // Policy: card rises in cleanly as one unit so all 4 specs and CTA button stay inside the panel.
      gsap.from('.policy-caption', { opacity: 0, y: 20, duration: 0.55, scrollTrigger: { trigger: '.policy', start: 'top 65%', toggleActions: 'play none none none' } });

      // Closing: the page closes over the film like a curtain, and the manifesto rises word by word.
      gsap.fromTo('.film-shade', { '--shade': 0 }, { '--shade': 0.88, immediateRender: false, scrollTrigger: { trigger: '.closing', start: 'top bottom', end: 'top 30%', scrub: true } });
      const words = $('.manifesto');
      // Word by word, line by line: the manifesto's <br> (one sentence per line) stays where it was.
      if (!words.dataset.wrapped) {
        words.dataset.wrapped = '1';
        const wrapWords = (text) => text.split(' ').map((w) => `<span class="w"><span>${w}</span></span>`).join(' ');
        for (const span of words.querySelectorAll('.t')) span.innerHTML = span.innerHTML.split(/<br\s*\/?>/).map((line) => wrapWords(line.trim())).join('<br>');
      }
      gsap.from('.manifesto .w > span', { yPercent: 110, stagger: 0.04, ease: 'power3.out', scrollTrigger: { trigger: '.closing', start: 'top 80%', end: 'top 10%', scrub: true } });
      // Done by the time the closing's top reaches the top of the screen, before "Probar" lands.
      // Animate the .tries container rather than individual .try links so GSAP never fights CSS hover states.
      gsap.from('.closing-text, .tries', { opacity: 0, y: 40, stagger: 0.08, scrollTrigger: { trigger: '.closing', start: 'top 70%', end: 'top top', scrub: true } });
    }, root);
  }
  syncGsapMotion();

  const scrollToHash = (hash, immediate = false) => {
    if (!hash || hash.startsWith('#/')) return false;
    let target = null;
    try {
      target = root.querySelector(hash);
    } catch {
      return false;
    }
    if (!target) return false;
    measure();
    const top = anchorTop(target);
    const destChapter = target.closest?.('.chapter') ?? null;
    if (destChapter) {
      navFlight.until = performance.now() + (immediate ? 200 : 800);
      navFlight.chapter = destChapter;
    }
    if (lenis) lenisScrollTo(top, immediate ? { immediate: true } : { duration: 0.75 });
    else window.scrollTo({ top });
    ScrollTrigger.update();
    return true;
  };
  if (location.hash && !location.hash.startsWith('#/')) {
    if (!scrollToHash(location.hash, true)) {
      window.scrollTo(0, 0);
    }
  }
  on(window, 'tridi:anchor', (event) => scrollToHash(event.detail, false));

  function syncReducedMotion() {
    if (isReducedMotion()) {
      destroyLenis();
      if (redeploy && isG1Sim(view)) {
        const active = redeploy;
        redeploy = null;
        view.viewer.resetRobotEffect();
        telemetry?.setRedeploy(null);
        view.sim.reset();
        pushed.lastT = -Infinity;
        if (active.homeQ.length <= view.sim.data.qpos.length) view.sim.data.qpos.set(active.homeQ);
        view.sim.holdCurrentPose();
        view.sim.mujoco.mj_forward(view.sim.model, view.sim.data);
        view.sim.simTarget = view.sim.data.time;
        finishRedeployState(active.owner);
      }
    } else {
      createLenis();
    }
    syncGsapMotion();
  }
  if (reducedMotionQuery?.addEventListener) on(reducedMotionQuery, 'change', syncReducedMotion);

  // The skeleton of Capture: a second WebGL renderer, whose context and shaders took ~1 s to set up
  // the moment Capture came near, a visible freeze mid-scroll. Now it is built while the page is
  // idle after the robot loads (warmUp), and drawn once there so its shaders are compiled before
  // anyone sees it; the observer is only the fallback for someone who scrolls there first.
  function buildSkeleton() {
    if (skeleton || gone || !WALK) return;
    skeleton = new SkeletonView($('.skeleton-canvas'));
    skeleton.controls.enabled = false;
    // Seen from the side the video was filmed from (the PoseClip's z points to the phone), so the
    // skeleton walks the same way as the person and the far arm is the dimmed one behind the body.
    skeleton.camera.position.set(0, 1.1, 3.4);
    fetchClip(WALK).then((clip) => {
      if (gone) return;
      skeleton.setClip(clip);
      skeleton.render();
    }, console.error);
  }
  const skeletonObserver = new IntersectionObserver(([entry]) => entry.isIntersecting && buildSkeleton(), { rootMargin: '400px' });
  skeletonObserver.observe(captureEl);

  // The top bar is clear over the hero and turns solid once the hero has scrolled past its bottom
  // edge: from there on chapter text scrolls under it (the Gym, the end of each pinned chapter and
  // the closing), in the same light ink as the bar's own words. An observer, not a ScrollTrigger,
  // so it also works with reduced motion, where the GSAP context below creates nothing.
  const topbar = $('.topbar');
  const barObserver = new IntersectionObserver(([entry]) => topbar.classList.toggle('solid', !entry.isIntersecting), {
    rootMargin: `-${Math.round(topbar.getBoundingClientRect().bottom)}px 0px 0px 0px`, // the bar floats below the top
  });
  barObserver.observe($('.hero'));

  return () => {
    gone = true;
    document.documentElement.classList.remove('is-landing');
    cancelAnimationFrame(frameId);
    clearTimeout(heroTimer);
    clearTimeout(pushed.queued);
    ctx?.revert();
    ctx = null;
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    destroyLenis();
    skeletonObserver.disconnect();
    barObserver.disconnect();
    cleanups.forEach((fn) => fn());
    video.pause();
    skeleton?.dispose();
    // Give the camera back to the app screens as they expect it.
    if (view && saved) {
      cancelRedeploy({ restoreOnly: true });
      view.cancelBlend?.();
      view.viewer.resetRobotEffect?.();
      view.viewer.snapOnTeleport = saved.snapOnTeleport ?? true;
      const { camera, controls } = view.viewer;
      view.viewer.targetHeight = saved.targetHeight;
      controls.target.y = saved.targetHeight;
      camera.position.copy(controls.target).add(saved.offset);
      camera.filmOffset = 0;
      camera.updateProjectionMatrix(); // also drops the vertical shift
      controls.maxPolarAngle = saved.maxPolarAngle;
      controls.enabled = true;
      view.viewer.followTau = 0; // the app screens follow the robot rigidly
      lights.forEach((light) => view.viewer.scene.remove(light));
      const sunLight = view.viewer.sun;
      const hemiLight = view.viewer.scene.children.find((o) => o.isHemisphereLight);
      if (sunLight && saved.sun) {
        sunLight.color.setHex(saved.sun.color);
        sunLight.intensity = saved.sun.intensity;
        sunLight.position.copy(saved.sun.pos);
      }
      if (hemiLight && saved.hemi) {
        hemiLight.color.setHex(saved.hemi.color);
        hemiLight.groundColor.setHex(saved.hemi.ground);
        hemiLight.intensity = saved.hemi.intensity;
      }
      view.viewer.renderer.toneMappingExposure = saved.exposure;
      view.viewer.renderer.setPixelRatio(saved.pixelRatio);
      landingWorld?.undress?.();
      landingWorld = null;
      landingEl?.style.removeProperty('--gym-wash');
      landingEl?.classList.remove('is-gym-chamber');
      view.viewer.resize();
      telemetry?.dispose();
      telemetry = null;
      if (marks) {
        marks.arrow.dispose();
        view.viewer.scene.remove(marks.ring);
        marks.ring.traverse((o) => o.geometry?.dispose());
        marks.ringMaterial.dispose();
        marks = null;
      }
    }
    robot.detach();
  };
}

// Turns a RobotMotion about the vertical through its first pelvis position so it starts facing +x,
// where the standing robot faces after a reset: the walk was filmed heading +y, and without this the
// robot snapped 90° when it started. The pelvis path and quaternion turn; the joints do not.
function faceForward(motion) {
  const [x0, y0, , w0, a0, b0, c0] = motion.qpos[0];
  const yaw = Math.atan2(2 * (w0 * c0 + a0 * b0), 1 - 2 * (b0 * b0 + c0 * c0));
  const cos = Math.cos(-yaw);
  const sin = Math.sin(-yaw);
  const hw = Math.cos(-yaw / 2); // the turn as a quaternion about z: (hw, 0, 0, hz)
  const hz = Math.sin(-yaw / 2);
  const qpos = motion.qpos.map(([x, y, z, w, a, b, c, ...joints]) => [
    x0 + cos * (x - x0) - sin * (y - y0),
    y0 + sin * (x - x0) + cos * (y - y0),
    z,
    hw * w - hz * c,
    hw * a - hz * b,
    hw * b + hz * a,
    hw * c + hz * w,
    ...joints,
  ]);
  return { ...motion, qpos };
}
