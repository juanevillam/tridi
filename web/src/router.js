// Clean History API routes (/, /rovers, /industrial, /simulations,
// /simulations/<clip id>, /live, /upload, /delivery, /delivery/<clip id>, /assembler,
// /milestones, /camera/<session id>, /net/<train id>) with SPA fallback and legacy #/... redirect.
// Every screen but home is a separate chunk loaded on first visit, so the menu does not wait for
// MuJoCo, the robot or MediaPipe.
import * as home from './screens/home.js';
import { LANGS, lang, onLang, preferredLang, setLang } from './i18n.js';
import { mountScrollFade } from './scroll-fade.js';

const titleOf = (screen) => {
  const title = typeof screen.title === 'object' ? (screen.title[lang()] ?? screen.title.es) : screen.title;
  return title ? `${title} · Tridi` : 'Tridi';
};

const verticalRoute = (id, title) => async () => {
  const mod = await import('./screens/vertical.js');
  return {
    title,
    mount: (app, context, params) => mod.mount(app, context, [id, ...params]),
    prefetch: mod.prefetch,
  };
};

const ROUTES = {
  '': async () => home,
  rovers: () => import('./landing/rovers/rovers-landing.js'),
  industrial: () => import('./landing/industrial/industrial-landing.js'),
  live: () => import('./screens/live.js'),
  upload: () => import('./screens/upload.js'),
  // A recorded clip's simulation (person and robot side by side, worlds, training): reached from Live
  // after recording, or from the landing Studio links.
  simulations: () => import('./screens/simulations.js'),
  assembler: () => import('./screens/assembler.js'), // P&ID (.dxf) + CAD (.stl + .ino) -> ISA-5.1 docs, 3D twin & PLC/C99 code
  delivery: () => import('./screens/delivery.js'),
  camera: () => import('./screens/phone.js'), // the phone as the live camera, opened from the QR on /live
  net: () => import('./screens/net.js'), // a training's policy network in 3D, linked from the training box
  milestones: () => import('./screens/milestones.js'), // field notes: Sim-to-Real case study + Platanus Hack 26 origin
};
// Routes are always in English, whatever the page's language. The Spanish ones the app used until
// 2026-11 still open (links in docs, QR codes, bookmarks): the address is rewritten to the English one.
const OLD_NAMES = { humanoids: '', 'en-vivo': 'live', subir: 'upload', simulaciones: 'simulations', ensamblador: 'assembler', entrega: 'delivery', camara: 'camera', red: 'net', avances: 'milestones' };

const LANDING_ROUTES = new Set(['', 'rovers', 'industrial']);
// Carry server tunnel & language params across internal route links unless overridden by the target link.
const STICKY_QUERY_KEYS = ['api', 'lang', 'debug'];

const safeDecode = (segment) => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

function parseSegments(rawPath) {
  const trimmed = rawPath.replace(/^\/+|\/+$/g, '');
  if (!trimmed) return { name: '', params: [], canonicalPath: '/' };
  const parts = trimmed.split('/').map(safeDecode);
  const rawFirst = parts[0] ?? '';
  const mapped = OLD_NAMES[rawFirst] ?? rawFirst;
  if (!(mapped in ROUTES)) {
    return { name: '', params: [], canonicalPath: '/' };
  }
  const params = parts.slice(1).filter((s) => s !== '');
  const canonicalPath = mapped ? `/${[mapped, ...params].map(encodeURIComponent).join('/')}` : '/';
  return { name: mapped, params, canonicalPath };
}

function mergeSearch(baseSearch, extraSearch) {
  if (!extraSearch) return baseSearch;
  if (!baseSearch) return extraSearch;
  const merged = new URLSearchParams(extraSearch);
  for (const [key, value] of new URLSearchParams(baseSearch)) {
    merged.set(key, value);
  }
  const qs = merged.toString();
  return qs ? `?${qs}` : '';
}

function withStickySearch(targetSearch) {
  if (!location.search) return targetSearch;
  const currentParams = new URLSearchParams(location.search);
  const nextParams = new URLSearchParams(targetSearch);
  let changed = false;
  for (const key of STICKY_QUERY_KEYS) {
    if (currentParams.has(key) && !nextParams.has(key)) {
      nextParams.set(key, currentParams.get(key));
      changed = true;
    }
  }
  if (!changed) return targetSearch;
  const qs = nextParams.toString();
  return qs ? `?${qs}` : '';
}

function readAndNormalizeLocation() {
  if (location.hash.startsWith('#/')) {
    const rawHash = location.hash.replace(/^#\/?/, '');
    const qIdx = rawHash.indexOf('?');
    const hashPath = qIdx >= 0 ? rawHash.slice(0, qIdx) : rawHash;
    const hashQuery = qIdx >= 0 ? rawHash.slice(qIdx) : '';
    const parsed = parseSegments(`/${hashPath}`);
    const search = mergeSearch(location.search, hashQuery);
    history.replaceState(null, '', `${parsed.canonicalPath}${search}`);
    return { ...parsed, anchor: '', wasLegacyHash: true };
  }

  const parsed = parseSegments(location.pathname);
  const anchor = location.hash && !location.hash.startsWith('#/') ? location.hash : '';
  const targetUrl = `${parsed.canonicalPath}${location.search}${anchor}`;
  const currentUrl = `${location.pathname}${location.search}${location.hash}`;
  if (targetUrl !== currentUrl) {
    history.replaceState(null, '', targetUrl);
  }
  return { ...parsed, anchor, wasLegacyHash: false };
}

function syncLangFromLocation() {
  const asked = new URLSearchParams(location.search).get('lang');
  setLang(LANGS.includes(asked) ? asked : preferredLang(), { persist: false });
}

// The fade between screens; long enough to read as a transition, short enough not to wait on it.
const FADE_MS = 180;
// A screen that takes longer than this to arrive shows "Cargando…" instead of a frozen page.
const SLOW_MS = 300;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A screen's code is a file named after its build. A page opened before a deploy asks for the old
// file, which the new deploy no longer has: the screen fails until a reload brings the new page.
// So a failed screen reloads the page once on its own; only if it fails again within this long (no
// connection, really) does the offline screen show.
const RELOAD_GUARD_MS = 30_000;
const RELOADED_AT = 'tridi-reloaded-at';

function reloadForNewDeploy() {
  try {
    if (Date.now() - Number(sessionStorage.getItem(RELOADED_AT) ?? 0) < RELOAD_GUARD_MS) return false;
    sessionStorage.setItem(RELOADED_AT, String(Date.now()));
  } catch {
    return false; // no storage (private mode): no guard against a reload loop, so do not reload
  }
  location.reload();
  return true;
}

/** Starts loading a screen's code ahead of a click, e.g. while the pointer is over its card. */
export function prefetch(name) {
  return ROUTES[name]?.().then((screen) => screen.prefetch?.());
}

let activeShow = null;
let cancelPending = () => false;
let isTransitioning = false;
let activeScreenName = null;
let activeParamsKey = '';

/**
 * Navigates cleanly via the History API.
 * @param {string} to
 * @param {{ replace?: boolean, preserveSearch?: boolean }} [opts]
 */
export function navigate(to, { replace = false, preserveSearch = true } = {}) {
  const raw = String(to ?? '/');
  // Only short-circuit #anchor links when idle; during an in-flight show() transition,
  // location.pathname already holds the pending route while activeScreenName is still the
  // previous screen, so falling through avoids leaving the pending URL paired with the old DOM.
  if (raw.startsWith('#') && !raw.startsWith('#/') && !isTransitioning) {
    const targetUrl = `${location.pathname}${location.search}${raw}`;
    const currentUrl = `${location.pathname}${location.search}${location.hash}`;
    if (targetUrl !== currentUrl) {
      history[replace ? 'replaceState' : 'pushState'](null, '', targetUrl);
    }
    if (LANDING_ROUTES.has(activeScreenName)) {
      window.dispatchEvent(new CustomEvent('tridi:anchor', { detail: raw }));
    }
    return;
  }

  const normalized =
    raw.startsWith('/') || raw.startsWith('#') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw) ? raw : `/${raw}`;
  let url;
  try {
    url = new URL(normalized, location.origin);
  } catch {
    return;
  }
  if (url.origin !== location.origin) {
    location.assign(url.href);
    return;
  }

  let parsed;
  let search = url.search;
  let anchor = '';
  if (url.hash.startsWith('#/')) {
    const rawHash = url.hash.replace(/^#\/?/, '');
    const qIdx = rawHash.indexOf('?');
    const hashPath = qIdx >= 0 ? rawHash.slice(0, qIdx) : rawHash;
    const hashQuery = qIdx >= 0 ? rawHash.slice(qIdx) : '';
    parsed = parseSegments(`/${hashPath}`);
    search = mergeSearch(search, hashQuery);
  } else {
    parsed = parseSegments(url.pathname);
    anchor = url.hash;
  }

  if (preserveSearch) {
    search = withStickySearch(search);
  }

  const targetUrl = `${parsed.canonicalPath}${search}${anchor}`;
  const currentUrl = `${location.pathname}${location.search}${location.hash}`;
  const urlChanged = targetUrl !== currentUrl;
  if (urlChanged) {
    history[replace ? 'replaceState' : 'pushState'](null, '', targetUrl);
  }

  const nextParamsKey = parsed.params.join('/');
  if (
    activeScreenName === parsed.name &&
    activeParamsKey === nextParamsKey &&
    LANDING_ROUTES.has(parsed.name) &&
    anchor
  ) {
    // Cancel any in-flight show() transition before scrolling on the still-mounted landing so the
    // stale async mount cannot overwrite the DOM out of sync with location.pathname.
    cancelPending();
    if (urlChanged) syncLangFromLocation();
    window.dispatchEvent(new CustomEvent('tridi:anchor', { detail: anchor }));
    return;
  }

  if (urlChanged || activeScreenName !== parsed.name || activeParamsKey !== nextParamsKey) {
    activeShow?.();
  }
}

/**
 * @param app      element the screens render into
 * @param context  shared with every screen: { store, api }
 */
export function startRouter(app, context) {
  let unmount = null;
  let navigation = 0;
  let current = null;
  isTransitioning = false;

  // Cancels any in-flight show() transition (during FADE_MS or async chunk import) so a fast
  // back/forward popstate or same-landing #anchor navigation cannot be overwritten later.
  cancelPending = () => {
    if (!isTransitioning) return false;
    ++navigation;
    isTransitioning = false;
    app.classList.remove('leaving', 'loading');
    return true;
  };

  async function show() {
    const { name, params, anchor } = readAndNormalizeLocation();
    syncLangFromLocation();
    const load = ROUTES[name] ?? ROUTES[''];
    const mine = ++navigation;
    isTransitioning = true;
    app.classList.add('leaving');
    const slow = setTimeout(() => {
      if (mine === navigation) app.classList.add('loading');
    }, SLOW_MS);
    let screen;
    try {
      [screen] = await Promise.all([load(), wait(FADE_MS)]);
    } catch (error) {
      console.error(error);
      if (mine !== navigation) return;
      if (reloadForNewDeploy()) {
        isTransitioning = false;
        app.classList.remove('leaving', 'loading');
        return;
      }
      screen = await import('./screens/offline.js');
    } finally {
      clearTimeout(slow);
    }
    if (mine !== navigation) return; // another link was clicked or transition was cancelled meanwhile
    isTransitioning = false;
    unmount?.();
    app.replaceChildren();
    activeScreenName = name;
    activeParamsKey = params.join('/');
    unmount = screen.mount(app, context, params);
    mountScrollFade(app);
    current = screen;
    document.title = titleOf(screen);
    if (!anchor) {
      window.scrollTo(0, 0);
    } else {
      let matched = null;
      try {
        matched = app.querySelector(anchor);
      } catch {
        matched = null;
      }
      if (!matched) window.scrollTo(0, 0);
    }
    app.classList.remove('leaving', 'loading');
  }

  activeShow = show;

  // A screen's title is a string or { es, en }; the tab follows the language like the page does.
  onLang(() => {
    if (current) document.title = titleOf(current);
  });
  window.addEventListener('popstate', () => {
    const { name, params, anchor, wasLegacyHash } = readAndNormalizeLocation();
    if (!wasLegacyHash && activeScreenName === name && activeParamsKey === params.join('/') && LANDING_ROUTES.has(name)) {
      const aborted = cancelPending();
      syncLangFromLocation();
      // Preserve current scroll position when backing out of an aborted transition; otherwise
      // scroll normally to the target anchor (or #home when returning from /#section to /).
      if (anchor || !aborted) {
        window.dispatchEvent(new CustomEvent('tridi:anchor', { detail: anchor || '#home' }));
      }
      return;
    }
    show();
  });
  window.addEventListener('hashchange', () => {
    if (location.hash.startsWith('#/')) show();
  });

  // Bubble-phase link interception so local handlers (landing #anchors, 3D deck side-card centering)
  // can call preventDefault() first.
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const link = event.target?.closest?.('a[href]');
    if (!link) return;
    if (link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const rawHref = link.getAttribute('href');
    if (!rawHref || (rawHref.startsWith('#') && !rawHref.startsWith('#/'))) return;
    let url;
    try {
      url = new URL(link.href, location.href);
    } catch {
      return;
    }
    if (url.origin !== location.origin) return;
    if (/^\/(assets|media|models)\//.test(url.pathname)) return;
    event.preventDefault();
    navigate(`${url.pathname}${url.search}${url.hash}`);
  });

  show();
}
