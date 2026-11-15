---
name: tridi-craft-audit
description: >-
  Checkpoint audit of Tridi (web/ and physics/) after a chunk of rework — is every repeated thing componentized (zero twin drift), every value a token, and does every surface follow Juan's Lens (shell geometry, 4-tier ink, active hover immunity, scroll-overflow fade, zero dead space). Report-first. Use when Juan invokes /tridi-craft-audit or asks for a craft audit.
---

# Tridi Craft Audit — Componentized, Restraint & Juan's Lens (`/tridi-craft-audit`)

The moment this command exists for: **a chunk of rework just landed on `web/` or `physics/`**, more is planned, and before continuing you want the ground solid. Not "does it work" — the question is whether the _result_ is coherent: whether every screen (`#/`, `#/simulations`, `#/live`, `#/upload`, `#/delivery`, `#/assembler`, `#/milestones`, `#/docs`, `#/team`) reuses what the first one established, and whether the whole product reads as one calm, precision-engineered system rather than a set of screens that each solved their own problem.

Two axes, always both, because they fail together:

- **A. Componentization & Zero Twin Drift** — one topbar (`web/src/header.js`), one `.screen-toolbar`, one `.page` shell, one scroll-overflow fade (`web/src/scroll-fade.js`), one fullscreen lightbox (`dialog.photo-viewer`), one singleton robot canvas (`web/src/robot-host.js`), one GLB loader/cache. No 150-line block living in three files, no component or export nothing renders any more.
- **B. Restraint, Tokens & Juan's Lens** — dark-only monochrome foundations (`--bg: #08090b`, `--panel: #121417`, `--line: rgb(241 243 238 / 0.12)`), 4-tier ink hierarchy (`--fg`, `--fg-body`, `--fg-2`, `--dim`), one signal accent (`--signal: #c8ff2e`), liquid glass with tonal floor, circle-vs-pill rule, concentric corners, quantized motion ladder (`--dur-*`, `--ease`, `--hover`), active-state hover immunity, zero `translateY` hover clipping inside scrollbars, `tabular-nums` on 50 Hz telemetry, and `align-items: start` (zero dead vertical/horizontal space).

Three non-negotiable contracts (ported from `~/Code/portfolio`):

1. **Scope is explicit and echoed back.** State which routes/modules are in scope and respect exclusions — a serious finding outside scope goes in its own labelled section.
2. **Report before code.** Ranked findings with `file:line` evidence and measured DOM geometry (`getBoundingClientRect()`). Juan cuts and approves before any code is modified.
3. **Read everything in scope.** No sampling — the audit's value is noticing that two files one route apart disagree.

---

## Phase 0 — Ground yourself

1. **Read [`docs/audit-playbook.md`](../../../docs/audit-playbook.md) and [`AGENTS.md`](../../../AGENTS.md)** — Tridi's standing rules outrank every generic checklist below.
2. **Confirm baseline is green:**
   ```bash
   npm --prefix physics run check
   npm --prefix web run check
   npm --prefix web run build
   ```
   Note any uncommitted in-flight work (`git status`) so your diff stays separable.
3. **Get the app running** so every geometry claim can be measured against rendered pixels at `1440×900`, `1280×800`, and `390×844` (plus browser zoom `100%`, `80%`, `67%`, `50%`).

---

## Phase 1 — Inventory

1. **Line counts descending across `web/src/` and `physics/src/`:**
   ```bash
   wc -l web/src/*.js web/src/*.css web/src/screens/*.js web/src/screens/*.css web/src/landing/*.js web/src/landing/*.css physics/src/*.js | sort -nr
   ```
   Fat files (`style.css`, `home.js`, `stage.js`, `delivery.js`, `landing.css`, `assembler.js`) are where duplicated blocks and dead rules hide.
2. **Who-imports-what map:** For every exported function/constant in `web/src/` and `physics/src/`, check its importers (`grep -rn "import.*from"`). Identify zero-reference exports, orphaned styles, and stale comments describing deleted mechanisms.
3. **Raw literals vs `:root` tokens:**
   ```bash
   grep -rn "cubic-bezier\|transition:\|#[0-9a-fA-F]\{3,6\}\|border-radius:" web/src/ --include='*.css'
   ```
   Compare every duration, easing curve, hex color, and radius against `:root` in `web/src/style.css` and `web/src/landing/landing.css`.

---

## Phase 2 — Audit both axes

### Axis A — Componentization & Zero Twin Drift

1. **Identical Shell Across All Inner Screens:**
   - Every inner screen (`#/simulations`, `#/live`, `#/upload`, `#/delivery`, `#/assembler`, `#/milestones`, `#/docs`, `#/team`) must use the same outer container geometry (`width: min(1720px, 100%); margin: 0 auto; padding: 14px 20px 28px;`), render `appHeaderHTML()` at the top with `0px` negative margin, and place its secondary controls inside `.screen-toolbar` / `.milestones-head` / `.dl-toolbar` with `margin-top: 14px`.
   - Measure `topbar.getBoundingClientRect().top`, `left`, `width`, `height`, and the vertical gap to the first content row across all 8 inner routes: delta must be `0px`.
2. **Shared Primitives Reuse:**
   - One scroll-overflow fade utility (`mountScrollFade` in `web/src/scroll-fade.js`) covering `#gallery`, `.asm-code`, `.asm-table-wrap`, `.dl-table-wrap`, `.dl-episodes`, `.docs-nav-list`, and `[data-scroll-fade]`.
   - One fullscreen media lightbox (`dialog.photo-viewer`).
   - One robot canvas host (`web/src/robot-host.js`).
   - One string lookup & bilingual span system (`web/src/i18n.js`, `web/src/strings-names.js`).
3. **Dead Code, Orphaned CSS & Stale Comments:**
   - CSS selectors in `style.css`, `landing.css`, `delivery.css`, `assembler.css` whose class/id no longer exists in any `.js` template or `index.html`.
   - Unused exports in `web/src/` or `physics/src/`.

### Axis B — Restraint, Tokens & Juan's Lens

1. **4-Tier Ink Hierarchy & Dark-Surface Contrast:**
   - `--bg: #08090b`, `--panel: #121417`, `--line: rgb(241 243 238 / 0.12)`; never raw `#fff` or `#000` for surfaces.
   - `--fg` (`#f1f3ee`) for primary titles/active controls, `--fg-body` (`#bdbdbd`) for running body paragraphs, `--fg-2` (`#a9ada4`) for secondary labels, `--dim` (`#7d8279`) for uppercase monospace metadata.
   - Single accent signal (`--signal: #c8ff2e`), warnings `#fbbf24`, alerts `#ff6a3d`. Contrast on every button/badge/pill in default, `:hover`, `:active`, and `[aria-current="true"]` states must clear WCAG AA (`>= 4.5:1`, target `> 5.4:1`).
2. **Active State Immunity on `:hover` & Zero Hover Translation Clipping:**
   - Selected/active items (`[aria-current="true"]`, `[aria-selected="true"]`, `[aria-pressed="true"]`, `.active`) must **never** lose their `--signal` border, background tint, or text color on `:hover`.
   - Interactive items inside scrollable containers (`#gallery`, `.milestone-tabs`, `.asm-tabs`, `.dl-episodes`) must **never** use `transform: translateY(-1px)` on `:hover`, which clips top/bottom borders against the scroll container.
3. **Eased Scroll-Overflow Edge Fade (`mask-image`):**
   - Any scrollable container (`overflow-y: auto` or `overflow-x: auto`) must fade its overflowing edge(s) smoothly via `mountScrollFade()` (`.is-scrolled`, `.is-more`, `.is-scrolled-x`, `.is-more-x`) and show zero fade when all content fits.
4. **Zero Dead Vertical or Horizontal Space (`align-items: start`):**
   - Multi-column grids (`.controls-bar`, `.dl-more`, `.sims-layout`, `.asm-workspace`, `.docs-layout`) must use `align-items: start` so short cards never stretch with blank space to match a tall neighbor.
   - Switching robots (`unitree_g1` ↔ `luigi_lab3` ↔ `luigi_lab4` ↔ `factory_cell`) keeps the 2-column `Playback` + `Conditions` structure intact.
5. **Zero CLS & Tabular Numerals on 50 Hz Telemetry:**
   - Live counters (`#sim-hcsr04`, `#sim-apds`, `#sim-wheels`, `#sim-dodge-state`, `.sim-readout`, `#speed`) must use `font-variant-numeric: tabular-nums`, `white-space: nowrap`, and fixed `min-width` / `height`.
6. **Shapes, Concentric Corners & Circle-vs-Pill Rule:**
   - Lone glyph controls (`#play`, `#reset`, `.dl-play`, `.v-close`, `.v-prev`, `.v-next`) are circles (`border-radius: 50%`, equal width/height). Text controls (`#speed`, `.back`, `.chip`) are pills (`border-radius: 999px`).
   - Nested surfaces use `innerRadius = Math.max(outerRadius - inset, floor)` in `rem`/`px` (never `vw`/`svh`).
7. **Quantized Motion Ladder & Tactile Press Squash:**
   - Durations read `--dur-micro` (`150ms`), `--dur-quick` (`300ms`), `--dur-turn` (`450ms`), `--dur-settle` (`600ms`), `--ease: cubic-bezier(0.16, 1, 0.3, 1)`, and `--hover: 220ms cubic-bezier(0.25, 0.1, 0.25, 1)`.
   - Cards/pills squash on `:active` (`scale(0.97)`), lone icon buttons squash deeper (`scale(0.92)`), disabled under `prefers-reduced-motion: reduce`.

---

## Phase 3 — Report (stop for approval)

```markdown
# Tridi Craft Audit — <scope> — <date>

## Verdict
One honest paragraph summarizing overall coherence and measured shell alignment.

## A. Componentization & Zero Twin Drift
Ranked findings: file:line, what is duplicated/dead/inconsistent, measured delta, concrete fix, effort (S/M/L).

## B. Restraint, Tokens & Juan's Lens
Ranked findings: file:line, which token/craft rule it violates, measured numbers, concrete fix.
Include an "Already coherent" note for systems verified sound.

## Copy Flagged for Juan (never rewritten automatically)
Where, the line, which voice rule it breaks.

## Ranked Fix Order
Independently verifiable batches.
```

Present the report and wait for Juan's approval before executing Phase 4.
