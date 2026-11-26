// Unified Global App Header for all Tridi Studio & Case Study screens.
// Matches Landing's .topbar visual grammar (docs/design-system.md):
// - Level 1 glass on ::before with translateZ(0) (zero double backdrop-filter over WebGL)
// - Active state with animated --signal indicator bar (bottom scaleX on desktop, left scaleY on mobile)
// - Neutral hover inside @media (hover: hover) and (pointer: fine)
// - Attached full-width mobile header (<= 1000px) with pure fade fullscreen drawer + scroll lock
import { LOGO, WORDMARK } from './brand.js';
import { dict, langSwitch, onLang } from './i18n.js';
import {
  bindNavDropLinking,
  isPlatformRoute,
  navDropdownAriaAttrs,
  navDropdownSectionsHTML,
  navTriggerLabelHTML,
  positionNavPanel,
} from './navigation.js';
import { prefetch } from './router.js';

const { T, A } = dict({
  home: { es: 'Tridi, inicio', en: 'Tridi, home' },
  homeLabel: { es: 'Inicio', en: 'Home' },
  nav: { es: 'Navegación de Tridi Studio', en: 'Tridi Studio navigation' },
  menu: { es: 'Menú', en: 'Menu' },
  milestones: { es: 'Avances', en: 'Milestones' },
});

export function appHeaderHTML({ current, rightSlot = '' } = {}) {
  const isPlatformCurrent = isPlatformRoute(current);
  const isMilestonesCurrent = current === 'milestones';
  const hasSlot = Boolean(rightSlot && rightSlot.trim());

  return `
  <header class="app-topbar${hasSlot ? ' has-right-slot' : ''}" data-screen="${current ?? ''}">
    <div class="app-topbar-left">
      <a class="wordmark" href="/" ${A({ 'aria-label': 'home' })}>${LOGO}${WORDMARK}</a>
    </div>
    <nav class="app-topnav" ${A({ 'aria-label': 'nav' })}>
      <a class="app-nav-link app-nav-mobile-only" href="/">${T('homeLabel')}</a>
      <div class="nav-drop app-nav-drop${isPlatformCurrent ? ' is-current' : ''}" data-drop="platform">
        <button type="button" class="nav-drop-btn app-nav-drop-btn${isPlatformCurrent ? ' active' : ''}" aria-expanded="false" aria-controls="app-nav-platform-panel">
          <span>${navTriggerLabelHTML()}</span>
          <svg class="nav-chev app-nav-chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div id="app-nav-platform-panel" class="nav-drop-panel app-nav-drop-panel" role="region" ${navDropdownAriaAttrs()}>
          <div class="nav-drop-inner app-nav-drop-inner">
            ${navDropdownSectionsHTML({ current })}
          </div>
        </div>
      </div>
      <i class="app-nav-sep" aria-hidden="true"></i>
      <a class="app-nav-link${isMilestonesCurrent ? ' active' : ''}" href="/milestones" data-warm="milestones"${isMilestonesCurrent ? ' aria-current="page"' : ''}>${T('milestones')}</a>
    </nav>
    <div class="app-topbar-right">
      ${hasSlot ? `<div class="app-topbar-slot">${rightSlot}</div>` : ''}
      <div class="app-topbar-lang">${langSwitch()}</div>
      <button type="button" class="app-mobile-btn" aria-expanded="false" ${A({ 'aria-label': 'menu' })}>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path class="i-bars" d="M3 5.5h14M3 10h14M3 14.5h14"/><path class="i-close" d="M4.5 4.5l11 11M15.5 4.5l-11 11"/></svg>
      </button>
    </div>
  </header>`;
}

export function mountAppHeader(root) {
  const cleanups = [];
  const header = root.querySelector('.app-topbar');
  const mobileBtn = header?.querySelector('.app-mobile-btn');
  const platformDrop = header?.querySelector('.app-nav-drop');
  const platformBtn = header?.querySelector('.app-nav-drop-btn');

  for (const link of root.querySelectorAll('.app-topbar [data-warm]')) {
    const warm = () => prefetch(link.dataset.warm);
    link.addEventListener('pointerenter', warm, { once: true });
    link.addEventListener('focus', warm, { once: true });
    cleanups.push(() => {
      link.removeEventListener('pointerenter', warm);
      link.removeEventListener('focus', warm);
    });
  }

  let menuOpen = false;
  const setBackgroundInert = (locked) => {
    const parent = header?.parentElement;
    if (!parent) return;
    for (const child of parent.children) {
      if (child !== header) child.inert = Boolean(locked);
    }
  };
  const setMenuOpen = (next) => {
    if (!header || !mobileBtn) return;
    menuOpen = Boolean(next);
    header.classList.toggle('menu-open', menuOpen);
    mobileBtn.setAttribute('aria-expanded', String(menuOpen));
    document.documentElement.style.overflow = menuOpen ? 'hidden' : '';
    setBackgroundInert(menuOpen);
  };

  const setDropOpen = (open, { dismissed = false } = {}) => {
    if (!platformDrop || !platformBtn) return;
    platformDrop.classList.toggle('open', Boolean(open));
    platformDrop.classList.toggle('dismissed', Boolean(dismissed));
    platformBtn.setAttribute('aria-expanded', String(Boolean(open)));
    if (open) positionNavPanel(platformDrop);
  };

  let restoringFocus = false;
  let suppressFocusOpen = false;
  const closeAll = ({ restoreFocus = false } = {}) => {
    const wasFocusInDrop = Boolean(platformDrop?.contains(document.activeElement));
    const wasMenuOpen = menuOpen;
    suppressFocusOpen = wasFocusInDrop;
    setDropOpen(false, { dismissed: true });
    setMenuOpen(false);
    if (restoreFocus) {
      restoringFocus = true;
      try {
        if (wasMenuOpen && window.innerWidth <= 1000) mobileBtn?.focus();
        else if (wasFocusInDrop) platformBtn?.focus();
      } finally {
        restoringFocus = false;
      }
    }
  };

  if (mobileBtn) {
    const onToggle = (event) => {
      event.stopPropagation();
      const next = !menuOpen;
      setMenuOpen(next);
      if (next && platformDrop?.classList.contains('is-current')) {
        setDropOpen(true);
      } else if (!next) {
        setDropOpen(false);
      }
    };
    mobileBtn.addEventListener('click', onToggle);
    cleanups.push(() => mobileBtn.removeEventListener('click', onToggle));
  }

  if (platformDrop && platformBtn) {
    cleanups.push(bindNavDropLinking(platformDrop));
    const onPointerEnter = () => {
      if (window.innerWidth <= 1000) return;
      platformDrop.classList.remove('dismissed');
      positionNavPanel(platformDrop);
    };
    const onPointerLeave = () => {
      if (window.innerWidth <= 1000) return;
      if (!platformDrop.classList.contains('open') && !platformDrop.contains(document.activeElement)) {
        platformDrop.classList.remove('dismissed');
      }
    };
    const onFocusIn = () => {
      if (restoringFocus || suppressFocusOpen || window.innerWidth <= 1000) return;
      platformDrop.classList.remove('dismissed');
      // Sync aria-expanded when desktop :focus-within opens the dropdown panel visually.
      platformBtn.setAttribute('aria-expanded', 'true');
      positionNavPanel(platformDrop);
    };
    const closeOnFocusOut = () => {
      suppressFocusOpen = false;
      if (window.innerWidth <= 1000) return;
      platformDrop.classList.remove('open');
      if (!platformDrop.matches(':hover')) platformDrop.classList.remove('dismissed');
      platformBtn.setAttribute('aria-expanded', 'false');
    };
    const onFocusOut = (event) => {
      if (window.innerWidth <= 1000) return;
      const nextTarget = event.relatedTarget;
      if (nextTarget) {
        if (!platformDrop.contains(nextTarget)) closeOnFocusOut();
        return;
      }
      requestAnimationFrame(() => {
        if (!platformDrop.contains(document.activeElement)) closeOnFocusOut();
      });
    };
    const onDropToggle = (event) => {
      event.stopPropagation();
      const isMobile = window.innerWidth <= 1000;
      const willOpen = !platformDrop.classList.contains('open');
      if (willOpen) {
        suppressFocusOpen = false;
        setDropOpen(true, { dismissed: false });
      } else {
        suppressFocusOpen = !isMobile;
        setDropOpen(false, { dismissed: !isMobile });
        if (isMobile) platformBtn.blur();
      }
    };
    platformDrop.addEventListener('pointerenter', onPointerEnter);
    platformDrop.addEventListener('pointerleave', onPointerLeave);
    platformDrop.addEventListener('focusin', onFocusIn);
    platformDrop.addEventListener('focusout', onFocusOut);
    platformBtn.addEventListener('click', onDropToggle);
    cleanups.push(() => {
      platformDrop.removeEventListener('pointerenter', onPointerEnter);
      platformDrop.removeEventListener('pointerleave', onPointerLeave);
      platformDrop.removeEventListener('focusin', onFocusIn);
      platformDrop.removeEventListener('focusout', onFocusOut);
      platformBtn.removeEventListener('click', onDropToggle);
    });
  }

  if (header) {
    const onNavClick = (event) => {
      if (event.target.closest?.('.app-topnav a')) {
        setDropOpen(false, { dismissed: true });
        if (menuOpen) setMenuOpen(false);
      }
    };
    header.addEventListener('click', onNavClick);
    cleanups.push(() => header.removeEventListener('click', onNavClick));
  }

  const onDocClick = (event) => {
    if (header && !event.target.closest?.('.app-topbar')) {
      setDropOpen(false, { dismissed: true });
      if (menuOpen) setMenuOpen(false);
    }
  };
  document.addEventListener('click', onDocClick);
  cleanups.push(() => document.removeEventListener('click', onDocClick));

  const onKeyDown = (event) => {
    if (event.key !== 'Escape') return;
    if (
      menuOpen ||
      platformDrop?.classList.contains('open') ||
      platformDrop?.matches(':hover, :focus-within')
    ) {
      closeAll({ restoreFocus: true });
    }
  };
  document.addEventListener('keydown', onKeyDown);
  cleanups.push(() => document.removeEventListener('keydown', onKeyDown));

  const onResize = () => {
    if (window.innerWidth > 1000) {
      if (menuOpen) {
        setMenuOpen(false);
        setDropOpen(false);
      } else if (platformDrop?.classList.contains('open')) {
        positionNavPanel(platformDrop);
      }
    }
  };
  window.addEventListener('resize', onResize, { passive: true });
  cleanups.push(() => window.removeEventListener('resize', onResize));

  // Switching language inside the mobile menu closes it automatically (docs/design-system.md §4.1).
  cleanups.push(
    onLang(() => {
      setDropOpen(false, { dismissed: true });
      if (menuOpen) setMenuOpen(false);
    }),
  );

  return () => {
    if (menuOpen) setMenuOpen(false);
    cleanups.forEach((fn) => fn());
  };
}
