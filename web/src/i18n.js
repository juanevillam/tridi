// Languages without a reload, the way Juan's portfolio does it: every translated string is in the
// DOM once per language (<span class="t" lang="es">…</span><span class="t" lang="en">…</span>) and
// CSS shows the one <html data-lang> names (style.css). Switching language flips one attribute: no
// re-render, no navigation, no flash, and text written later by a screen (a status line, a HUD)
// switches too, because it is written the same way (T()).
//
// What cannot be two spans (aria-label, title, placeholder, document.title, a canvas) asks for the
// current language with t() and listens with onLang().

export const LANGS = ['es', 'en'];
export const LANG_NAMES = { es: 'Español', en: 'English' };
const KEY = 'tridi-lang';

const html = document.documentElement;
const listeners = new Set();

/** The language on screen now. index.html's pre-paint script settled it before the first frame. */
export const lang = () => (LANGS.includes(html.dataset.lang) ? html.dataset.lang : 'es');

export function setLang(next) {
  if (!LANGS.includes(next) || next === lang()) return;
  html.dataset.lang = next;
  html.lang = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // private mode: the choice lasts this visit only
  }
  for (const element of document.querySelectorAll('[data-i18n-attr]')) applyAttrs(element);
  listeners.forEach((listener) => listener(next));
}

/** Calls `listener(lang)` on every switch; returns unsubscribe. */
export function onLang(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// A string is { es, en }; a value in vars may be a function of the language (a number formatted
// with its own decimal mark) or a plain value.
const fill = (text, vars, language) =>
  text.replace(/\{(\w+)\}/g, (_, name) => {
    const value = vars?.[name];
    return String(typeof value === 'function' ? value(language) : (value ?? ''));
  });

/**
 * Builds a screen's translators from its own strings, so each screen keeps its copy next to its
 * code and keys never collide between screens.
 * @param {Record<string, {es: string, en: string}>} strings
 */
export function dict(strings) {
  const get = (key, language) => {
    const entry = strings[key];
    if (!entry) {
      console.warn(`i18n: missing ${key}`);
      return key;
    }
    return entry[language] ?? entry.es;
  };
  /** HTML with every language, for innerHTML and templates. Strings may hold markup. */
  const T = (key, vars) => LANGS.map((l) => `<span class="t" lang="${l}">${fill(get(key, l), vars, l)}</span>`).join('');
  /** Plain text in the current language, for attributes, titles and canvases. */
  const t = (key, vars) => fill(get(key, lang()), vars, lang());
  /** data-i18n-attr for an element: its attributes follow the language (applyAttrs). */
  const A = (attrs, vars) => {
    const map = Object.fromEntries(Object.entries(attrs).map(([attr, key]) => [attr, Object.fromEntries(LANGS.map((l) => [l, fill(get(key, l), vars, l)]))]));
    const first = Object.entries(map).map(([attr, byLang]) => `${attr}="${escapeAttr(byLang[lang()])}"`).join(' ');
    return `${first} data-i18n-attr="${escapeAttr(JSON.stringify(map))}"`;
  };
  return { T, t, A };
}

const escapeAttr = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

function applyAttrs(element) {
  try {
    const map = JSON.parse(element.dataset.i18nAttr);
    for (const [attr, byLang] of Object.entries(map)) element.setAttribute(attr, byLang[lang()] ?? byLang.es);
  } catch {
    // a malformed map leaves the attribute as it was
  }
}

/** Numbers in the language's own way: 1,5 s in Spanish, 1.5 s in English. */
export const fmt = (value, digits = 1) => (language) =>
  Number(value).toLocaleString(language, { minimumFractionDigits: digits, maximumFractionDigits: digits });
export const fmtInt = (value) => (language) => Math.round(value).toLocaleString(language);

/** The ES · EN switch for a screen's header. One click flips the page in place. */
export function langSwitch(className = '') {
  return `<div class="lang-switch ${className}" role="group" aria-label="Idioma / Language">${LANGS.map(
    (l) => `<button type="button" data-set-lang="${l}" lang="${l}" aria-label="${LANG_NAMES[l]}">${l.toUpperCase()}</button>`,
  ).join('')}</div>`;
}

// One listener for every switch on every screen, present or future.
document.addEventListener('click', (event) => {
  const button = event.target.closest?.('[data-set-lang]');
  if (button) setLang(button.dataset.setLang);
});
