// Shared extensible registry of Tridi Platform Applications and Studio Tools.
// Single source of truth consumed by Topbar (home.js, header.js), Landing Closing (home.js),
// `/` platform selector, Footer, and dedicated application landings.
import { LOGO, WORDMARK } from './brand.js';
import { A, T } from './strings-navigation.js';

export const VERTICALS = [
  {
    id: 'humanoids',
    slug: 'humanoids',
    href: '/',
    status: 'live',
    tools: ['simulations', 'live', 'upload', 'delivery'],
    icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5.2" r="2.1"/><path d="M9.5 9.2h5l1.2 4.8-1.9.4-.7-2.7v9.3h-2.2v-5.2h-1.8V21H6.9v-9.3l-.7 2.7-1.9-.4 1.2-4.8h4Z"/></svg>',
  },
  {
    id: 'rovers',
    slug: 'rovers',
    href: '/rovers',
    status: 'live',
    tools: ['simulations', 'delivery'],
    icon: '<svg viewBox="0 0 24 24"><rect x="4.5" y="9" width="15" height="6" rx="1.8"/><path d="M9 9V6.2h6V9M12 6.2V4"/><circle cx="7.5" cy="17.5" r="2.2"/><circle cx="16.5" cy="17.5" r="2.2"/></svg>',
  },
  {
    id: 'industrial',
    slug: 'industrial',
    href: '/industrial',
    status: 'live',
    tools: ['assembler', 'simulations', 'delivery'],
    icon: '<svg viewBox="0 0 24 24"><path d="M4 20h16M6 20v-7.5l4-3.5 4.2 3.2L18 8.5"/><circle cx="10" cy="9" r="1.5"/><circle cx="14.2" cy="12.2" r="1.5"/><path d="M16.5 6.5h3v3"/></svg>',
  },
];

const TOOL_DEFS = [
  {
    id: 'simulations',
    href: '/simulations',
    iconKey: 'simulations',
    icon: '<svg viewBox="0 0 24 24"><path d="M12 2.5 3.5 7v10L12 21.5l8.5-4.5V7L12 2.5Z"/><path d="M3.5 7 12 11.5 20.5 7M12 11.5v10"/></svg>',
  },
  {
    id: 'live',
    href: '/live',
    iconKey: 'live',
    icon: '<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="13.5" height="12" rx="2"/><path d="m16 10.2 5.5-3.2v10L16 13.8"/><circle cx="9.25" cy="12" r="2.2"/></svg>',
  },
  {
    id: 'upload',
    href: '/upload',
    iconKey: 'upload',
    icon: '<svg viewBox="0 0 24 24"><path d="M12 15.5V4.5m0 0-4 4m4-4 4 4"/><path d="M4 15.5v3a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5v-3"/></svg>',
  },
  {
    id: 'delivery',
    href: '/delivery',
    iconKey: 'delivery',
    icon: '<svg viewBox="0 0 24 24"><path d="M4 6.5h16M4 12h10m-10 5.5h7"/><circle cx="17.5" cy="15.5" r="3.5"/><path d="m16.2 15.5 1 1 2-2"/></svg>',
  },
  {
    id: 'assembler',
    href: '/assembler',
    iconKey: 'assembler',
    icon: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="7" height="7" rx="1.5"/><rect x="14" y="4" width="7" height="7" rx="1.5"/><rect x="8.5" y="13.5" width="7" height="7" rx="1.5"/><path d="M10 7.5h4M6.5 11v4.5h2M17.5 11v4.5h-2"/></svg>',
  },
];

// Derive each tool's applicable applications directly from VERTICALS so adding/removing an entry
// keeps Topbar, Footer, and platform selector synchronized automatically.
export const STUDIO_TOOLS = TOOL_DEFS.map((tool) => ({
  ...tool,
  verticals: VERTICALS.filter((vertical) => vertical.tools.includes(tool.id)).map((vertical) => vertical.id),
}));

// Literal T(...) maps so web/scripts/check-i18n.mjs statically validates every navigation key.
const VERTICAL_COPY = {
  humanoids: { name: () => T('vert.humanoids.name'), sub: () => T('vert.humanoids.sub') },
  rovers: { name: () => T('vert.rovers.name'), sub: () => T('vert.rovers.sub') },
  industrial: { name: () => T('vert.industrial.name'), sub: () => T('vert.industrial.sub') },
};

const TOOL_COPY = {
  simulations: {
    name: () => T('tool.simulations.name'),
    short: () => T('tool.simulations.short'),
    sub: () => T('tool.simulations.sub'),
  },
  live: {
    name: () => T('tool.live.name'),
    short: () => T('tool.live.short'),
    sub: () => T('tool.live.sub'),
  },
  upload: {
    name: () => T('tool.upload.name'),
    short: () => T('tool.upload.short'),
    sub: () => T('tool.upload.sub'),
  },
  delivery: {
    name: () => T('tool.delivery.name'),
    short: () => T('tool.delivery.short'),
    sub: () => T('tool.delivery.sub'),
  },
  assembler: {
    name: () => T('tool.assembler.name'),
    short: () => T('tool.assembler.short'),
    sub: () => T('tool.assembler.sub'),
  },
};

const inlineBilingual = (value, fallback = '') => {
  if (value && typeof value === 'object') {
    const en = value.en ?? value.es ?? fallback;
    const es = value.es ?? value.en ?? fallback;
    return `<span class="t" lang="en">${en}</span><span class="t" lang="es">${es}</span>`;
  }
  return String(value ?? fallback);
};

export const getVertical = (id) => VERTICALS.find((vertical) => vertical.id === id) ?? null;

export const getTool = (id) => STUDIO_TOOLS.find((tool) => tool.id === id) ?? null;

export function toolsForVertical(verticalId) {
  const vertical = getVertical(verticalId);
  if (!vertical) return [];
  return vertical.tools.map((toolId) => getTool(toolId)).filter(Boolean);
}

export function verticalsForTool(toolId) {
  return VERTICALS.filter((vertical) => vertical.tools.includes(toolId));
}

export const isPlatformRoute = (id) => Boolean(getVertical(id) || getTool(id));

export function verticalLabelHTML(idOrVertical) {
  const vertical = typeof idOrVertical === 'string' ? getVertical(idOrVertical) : idOrVertical;
  const id = vertical?.id ?? String(idOrVertical ?? '');
  return VERTICAL_COPY[id]?.name() ?? inlineBilingual(vertical?.label, id);
}

export function verticalSubHTML(idOrVertical) {
  const vertical = typeof idOrVertical === 'string' ? getVertical(idOrVertical) : idOrVertical;
  const id = vertical?.id ?? String(idOrVertical ?? '');
  return VERTICAL_COPY[id]?.sub() ?? inlineBilingual(vertical?.sub, '');
}

export function toolLabelHTML(idOrTool) {
  const tool = typeof idOrTool === 'string' ? getTool(idOrTool) : idOrTool;
  const id = tool?.id ?? String(idOrTool ?? '');
  return TOOL_COPY[id]?.name() ?? inlineBilingual(tool?.label, id);
}

export function toolShortHTML(idOrTool) {
  const tool = typeof idOrTool === 'string' ? getTool(idOrTool) : idOrTool;
  const id = tool?.id ?? String(idOrTool ?? '');
  return TOOL_COPY[id]?.short() ?? TOOL_COPY[id]?.name() ?? inlineBilingual(tool?.short ?? tool?.label, id);
}

export function toolSubHTML(idOrTool) {
  const tool = typeof idOrTool === 'string' ? getTool(idOrTool) : idOrTool;
  const id = tool?.id ?? String(idOrTool ?? '');
  return TOOL_COPY[id]?.sub() ?? inlineBilingual(tool?.sub, '');
}

export const comingSoonBadgeHTML = () => T('badge.comingSoon');

export const roadmapBadgeHTML = () => T('badge.roadmap');

export const navTriggerLabelHTML = () => T('trigger.platform');

export const navDropdownAriaAttrs = () => A({ 'aria-label': 'aria.panel' });

const ELECTRONICS_NAV_ICON =
  '<svg viewBox="0 0 24 24"><rect x="6.5" y="6.5" width="11" height="11" rx="1.8"/><rect x="9.5" y="9.5" width="5" height="5" rx="0.8"/><path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3"/></svg>';

export function navDropdownSectionsHTML({ current = '' } = {}) {
  const appsMarkup = `${VERTICALS.map((vertical) => {
    const active = vertical.id === current;
    const isPreview = vertical.status === 'preview';
    const tools = toolsForVertical(vertical.id);
    const mobileToolsLine = tools.length
      ? `<span class="nav-item-meta">${tools.map((tool) => toolShortHTML(tool)).join(' · ')}</span>`
      : '';

    return `<a class="nav-drop-item${active ? ' active' : ''}${isPreview ? ' is-preview' : ''}" href="${vertical.href}" data-warm="${vertical.id}" data-nav-app="${vertical.id}" data-nav-tools="${vertical.tools.join(',')}"${active ? ' aria-current="page"' : ''}>
      <span class="nav-drop-icon" aria-hidden="true">${vertical.icon}</span>
      <div class="nav-item-body">
        <div class="nav-item-head">
          <b>${verticalLabelHTML(vertical)}</b>
          ${isPreview ? `<span class="nav-item-status">${comingSoonBadgeHTML()}</span>` : ''}
        </div>
        <span class="nav-item-sub">${verticalSubHTML(vertical)}</span>
        ${mobileToolsLine}
      </div>
    </a>`;
  }).join('')}<div class="nav-drop-item is-preview is-disabled" aria-disabled="true">
      <span class="nav-drop-icon" aria-hidden="true">${ELECTRONICS_NAV_ICON}</span>
      <div class="nav-item-body">
        <div class="nav-item-head">
          <b>${T('vert.electronics.name')}</b>
          <span class="nav-item-status">${comingSoonBadgeHTML()}</span>
        </div>
        <span class="nav-item-sub">${T('vert.electronics.sub')}</span>
      </div>
    </div>`;

  const toolsMarkup = STUDIO_TOOLS.map((tool) => {
    const active = tool.id === current;
    return `<a class="nav-drop-item${active ? ' active' : ''}" href="${tool.href}" data-warm="${tool.id}" data-nav-tool="${tool.id}" data-nav-apps="${tool.verticals.join(',')}"${active ? ' aria-current="page"' : ''}>
      <span class="nav-drop-icon" aria-hidden="true">${tool.icon}</span>
      <div class="nav-item-body">
        <div class="nav-item-head">
          <b>${toolLabelHTML(tool)}</b>
        </div>
        <span class="nav-item-sub">${toolSubHTML(tool)}</span>
      </div>
    </a>`;
  }).join('');

  return `<div class="nav-drop-sections">
    <section class="nav-drop-section nav-drop-section--apps">
      <p class="nav-drop-head">${T('sec.applications')}</p>
      <div class="nav-drop-list">${appsMarkup}</div>
    </section>
    <section class="nav-drop-section nav-drop-section--tools">
      <p class="nav-drop-head">${T('sec.tools')}</p>
      <div class="nav-drop-list">${toolsMarkup}</div>
    </section>
  </div>`;
}

// Desktop cross-column relationship highlight: hovering or focusing an Application highlights its
// matching Studio Tools (and vice versa) without any badge/chip clutter.
export function bindNavDropLinking(drop) {
  const sections = drop?.querySelector('.nav-drop-sections');
  if (!sections) return () => {};
  const appItems = [...sections.querySelectorAll('[data-nav-app]')];
  const toolItems = [...sections.querySelectorAll('[data-nav-tool]')];
  const allItems = [...appItems, ...toolItems];

  const clear = () => {
    sections.classList.remove('is-linking');
    for (const item of allItems) item.classList.remove('is-linked');
  };

  const highlightApp = (appEl) => {
    if (window.innerWidth <= 1000) return;
    const toolIds = new Set((appEl.dataset.navTools || '').split(',').filter(Boolean));
    sections.classList.add('is-linking');
    for (const item of appItems) item.classList.toggle('is-linked', item === appEl);
    for (const item of toolItems) item.classList.toggle('is-linked', toolIds.has(item.dataset.navTool));
  };

  const highlightTool = (toolEl) => {
    if (window.innerWidth <= 1000) return;
    const appIds = new Set((toolEl.dataset.navApps || '').split(',').filter(Boolean));
    sections.classList.add('is-linking');
    for (const item of toolItems) item.classList.toggle('is-linked', item === toolEl);
    for (const item of appItems) item.classList.toggle('is-linked', appIds.has(item.dataset.navApp));
  };

  const cleanups = [];
  const on = (el, type, fn) => {
    el.addEventListener(type, fn);
    cleanups.push(() => el.removeEventListener(type, fn));
  };

  for (const appEl of appItems) {
    on(appEl, 'pointerenter', () => highlightApp(appEl));
    on(appEl, 'focusin', () => highlightApp(appEl));
  }
  for (const toolEl of toolItems) {
    on(toolEl, 'pointerenter', () => highlightTool(toolEl));
    on(toolEl, 'focusin', () => highlightTool(toolEl));
  }
  on(sections, 'pointerleave', clear);
  on(sections, 'focusout', (event) => {
    if (!event.relatedTarget || !sections.contains(event.relatedTarget)) clear();
  });

  return () => {
    clear();
    cleanups.forEach((fn) => fn());
  };
}

export function platformBarHTML({ current = 'humanoids' } = {}) {
  return `<nav class="hero-platforms" ${A({ 'aria-label': 'aria.platforms' })}>
    ${VERTICALS.map((v) => {
      const isCurrent = v.id === current;
      const isPreview = v.status === 'preview';
      return `<a class="hero-platform${isCurrent ? ' is-current' : ''}${isPreview ? ' is-preview' : ''}" href="${v.href}" data-warm="${v.id}"${isCurrent ? ' aria-current="page"' : ''}>${verticalLabelHTML(v)}</a>`;
    }).join('')}
  </nav>`;
}

export function footerHTML({ anchorPrefix = '' } = {}) {
  const homeHref = anchorPrefix ? '/' : '#home';
  return `<footer class="footer">
    <div class="foot-bar">
      <div class="foot-brand-col">
        <a class="wordmark big" href="${homeHref}" ${A({ 'aria-label': 'foot.home' })}>${LOGO}${WORDMARK}</a>
        <p class="foot-rights">${T('foot.rights')}</p>
      </div>
      <div class="foot-columns">
        <div class="foot-col">
          <h4>${T('foot.colApplications')}</h4>
          ${VERTICALS.map((v) => `<a href="${v.href}" data-warm="${v.id}">${verticalLabelHTML(v)}</a>`).join('')}
        </div>
        <div class="foot-col">
          <h4>${T('foot.colStudio')}</h4>
          ${STUDIO_TOOLS.map((tool) => `<a href="${tool.href}" data-warm="${tool.id}">${toolLabelHTML(tool)}</a>`).join('')}
        </div>
        <div class="foot-col">
          <h4>${T('foot.colProduct')}</h4>
          <a href="${anchorPrefix}#capture">Tridi Capture</a>
          <a href="${anchorPrefix}#gym">Tridi Gym</a>
          <a href="${anchorPrefix}#policy">Tridi Policy</a>
          <a href="/milestones" data-warm="milestones">${T('foot.milestones')}</a>
        </div>
        <div class="foot-col foot-col-team">
          <h4>${T('foot.team')}</h4>
          <div class="foot-team-grid">
            <a href="https://www.linkedin.com/in/pastor-jimenez" target="_blank" rel="noopener">Pastor Jiménez</a>
            <a href="https://www.linkedin.com/in/juanevillam" target="_blank" rel="noopener">Juan Villa</a>
            <a href="https://www.linkedin.com/in/alehernandezt" target="_blank" rel="noopener">Ale Hernández</a>
            <a href="https://www.linkedin.com/in/cesarmartinez-dev" target="_blank" rel="noopener">César Martínez</a>
          </div>
        </div>
      </div>
    </div>
  </footer>`;
}

const CLOSING_PRIMARY_CTA = {
  humanoids: { href: '/simulations', warm: 'simulations', label: () => T('close.openStudio') },
  rovers: { href: '/simulations/luigi_lab4', warm: 'simulations', label: () => T('close.ctaRovers') },
  industrial: { href: '/assembler', warm: 'assembler', label: () => T('close.ctaIndustrial') },
};

export function closingSectionHTML({ current = 'humanoids', isChapter = false, footer = '' } = {}) {
  const tagOpen = isChapter
    ? '<section class="chapter closing" id="teams" data-shot="close" data-mode="stand">'
    : '<section class="closing" id="teams">';
  const primary = CLOSING_PRIMARY_CTA[current] ?? CLOSING_PRIMARY_CTA.humanoids;
  return `${tagOpen}
    <div class="closing-sticky">
      <div class="closing-inner" id="try" data-offset="-80">
        <h2 class="manifesto">${T('close.manifesto')}</h2>
        <p class="closing-text"><span class="only-wide">${T('close.text')}</span><span class="only-narrow">${T('close.textShort')}</span></p>
        <div class="closing-actions tries" ${A({ 'aria-label': 'close.actions' })}>
          <a class="btn btn-signal closing-cta-primary" href="${primary.href}" data-warm="${primary.warm}">${primary.label()}</a>
          <a class="btn btn-ghost closing-cta-secondary" href="/milestones" data-warm="milestones">${T('close.milestones')}</a>
        </div>
      </div>
    </div>
    ${footer}
  </section>`;
}

// Clamp desktop popover horizontally within [16px, innerWidth - 16px] so it never clips near
// viewport edges regardless of grid alignment in .topbar or .app-topbar.has-right-slot.
export function positionNavPanel(drop) {
  if (!drop || typeof window === 'undefined') return;
  const panel = drop.querySelector('.nav-drop-panel');
  if (!panel) return;
  if (window.innerWidth <= 1000) {
    panel.style.removeProperty('--drop-shift');
    return;
  }
  panel.style.setProperty('--drop-shift', '0px');
  const rect = panel.getBoundingClientRect();
  const margin = 16; // accounts for scale(0.98) -> scale(1) expansion so final bounds stay >= 8px inside
  let shift = 0;
  if (rect.left < margin) {
    shift = margin - rect.left;
  } else if (rect.right > window.innerWidth - margin) {
    shift = window.innerWidth - margin - rect.right;
  }
  if (shift !== 0) {
    panel.style.setProperty('--drop-shift', `${Math.round(shift)}px`);
  }
}
