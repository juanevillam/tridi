---
name: tridi-a11y-audit
description: >-
  Accessibility audit of Tridi (web/) — WCAG 2.2 AA keyboard navigation and focus rings across navbar dropdowns, simulation gallery, controls, assembler tabs, and photo lightbox; bilingual screen-reader names (aria-label in ES/EN); prefers-reduced-motion; dark-glass contrast; zoom & touch targets. Measured. Report-first. Use when Juan invokes /tridi-a11y-audit or asks for an accessibility audit.
---

# Tridi Accessibility Audit — Every Control Works by Keyboard, Screen Reader, and Touch (`/tridi-a11y-audit`)

The moment this command exists for: **the layouts have settled** (after `/tridi-craft-audit` and `/tridi-parity-audit`) and before a release. Tridi combines a 3D WebGL stage, floating glass overlays, custom dropdowns, interactive telemetry, and modal lightboxes — surfaces that work effortlessly with a mouse and break for keyboard, VoiceOver, or zoomed-text users unless systematically checked.

**Accessible is not a different look.** Most fixes are invisible (`aria-label`, `role`, `tabindex`, focus restoration, `prefers-reduced-motion`). Any fix that would change the visual design (contrast bump, target size, visible focus ring) is reported with numbers for Juan to decide.

Three non-negotiable contracts (ported from `~/Code/portfolio`):

1. **Scope is explicit and echoed back.**
2. **Report before code**, ranked by user impact (locked out → hard → annoying), with `file:line` and WCAG 2.2 criterion.
3. **Every route and interactive control in scope.** No sampling.

---

## Phase 0 — Ground yourself

1. **Read [`docs/audit-playbook.md`](../../../docs/audit-playbook.md) and [`AGENTS.md`](../../../AGENTS.md).**
2. **Test on the production build (`npm --prefix web run build && npm --prefix web run preview`).**

---

## Phase 1 — Walk and Measure

### 1. Keyboard Navigation & Focus Management (Desktop)

Walk every route (`#/`, `#/simulations`, `#/live`, `#/upload`, `#/delivery`, `#/assembler`, `#/milestones`, `#/docs`, `#/team`) using `Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`, and arrow keys:
- **Visible focus ring (`:focus-visible`):** Every interactive button, link, `<select>`, `<input type="range">`, tab, and card has a high-contrast `:focus-visible` indicator (`>= 3:1` against background, WCAG 2.4.11 / 1.4.11).
- **Landing navbar dropdown (`Studio ▾` in `web/src/screens/home.js`):** Reachable via `Tab`, opens/closes via keyboard, `Escape` closes it, and links inside are reachable only when open.
- **Fullscreen Photo Lightbox (`dialog.photo-viewer` in `#/milestones`) & Overlays:**
  - Opening a photo moves focus inside the `<dialog>`, traps `Tab` inside the modal (apply `inert` and `aria-hidden="true"` to background shells/covered layers when custom overlays are open), navigates photos with `ArrowLeft` / `ArrowRight`, closes on `Escape` in strict topmost-layer order, and restores focus to the thumbnail button that opened it.
- **Tabs, Accordions & Segmented Controls (`.milestone-tabs`, `.asm-tabs`, `<details>` technical accordion, `#show`):**
  - Proper `role="tablist"` / `role="tab"` / `aria-selected` or `aria-pressed` states.
- **Async & Dynamic Announcements:**
  - Long operations (P&ID `.dxf`/`.pdf` parsing, video upload, ONNX/WASM loading) expose `aria-busy="true"` and status updates via `role="status"` / `aria-live="polite"`.

### 2. Screen Reader & Bilingual Names (`ES` + `EN`)

- **Lone glyph / icon-only buttons:** Inspect `#play`, `#reset`, `.dl-play`, `.v-close`, `.v-prev`, `.v-next`, and any icon button. Every one must have a descriptive `aria-label` that updates when the language switches between `ES` and `EN` (or when play/pause toggles).
- **3D `<canvas>` elements (`.robot-canvas`, `.skeleton-canvas`, `.asm-canvas`):** Must carry `role="img"` and an informative `aria-label` (or `aria-hidden="true"` when purely decorative beside text that already states the status).
- **Landmarks & Headings:** One `<h1>` per screen, logical `<h2>` / `<h3>` hierarchy, `<header>` / `<nav>` / `<main>` / `<footer>` landmarks, and `document.documentElement.lang` synced to `'es'` or `'en'` on every language toggle (`web/src/i18n.js`).

### 3. Motion & `prefers-reduced-motion: reduce`

- Emulate `prefers-reduced-motion: reduce`:
  - CSS transitions and `:active` press squash (`transform: scale(...)`) respect `@media (prefers-reduced-motion: reduce)` (`web/src/style.css`, `web/src/landing/landing.css`).
  - Smooth scroll (`behavior: 'smooth'`) degrades to instant scroll when reduced motion is requested.
  - Autoplaying videos (`#capture`, PiP videos) are `muted` and can be paused.

### 4. Visual Contrast, Zoom & Touch Targets

- **Contrast (WCAG 1.4.3 & 1.4.11):** Measure rendered contrast ratios of `--fg` (`#f1f3ee`), `--fg-body` (`#bdbdbd`), `--fg-2` (`#a9ada4`), and `--dim` (`#7d8279`) over `--bg` (`#08090b`), `--panel` (`#121417`), and floating glass surfaces (`backdrop-filter: blur(16px)`), plus button states (`.push`, `.cta-primary`, `.card[aria-current="true"]`, `.card-badge`).
- **200% Browser Zoom & Narrow Viewport (`320px` CSS width, WCAG 1.4.10):** Verify text reflows without clipping or horizontal scrollbars.
- **Touch Targets on Mobile (`390×844`, WCAG 2.5.8):** Every interactive button, pill, and tab meets at least `24×24 CSS px` (`36–44 px` target).

---

## Phase 2 — Report (stop for approval)

```markdown
# Tridi Accessibility Audit — <scope> — <date>

## Verdict
One honest paragraph on keyboard, screen-reader, reduced-motion, and contrast readiness.

## Findings (Ranked: Locked Out → Hard → Annoying)
Each: route, file:line, WCAG 2.2 criterion, what happens, concrete fix, INVISIBLE or VISIBLE change.

## Already Accessible
Systems verified sound.

## Ranked Fix Order
Invisible fixes first, visible fixes after Juan's approval.
```

Present the report and wait for Juan's approval.
