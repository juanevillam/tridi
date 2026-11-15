---
name: tridi-parity-audit
description: >-
  Audit Tridi across its 3 parity axes — (1) Desktop, Laptop, Mobile & Zoom viewports (1440x900, 1280x800, 390x844, 390x664, 375x667 + 100%/80%/67%/50% zoom), (2) ES/EN bilingual parity, and (3) Robot & Vertical parity (unitree_g1, unitree_h1, luigi_lab3, luigi_lab4, factory_cell). Measured. Report-first. Use when Juan invokes /tridi-parity-audit, /tridi-ux-audit, or asks for a parity/UX audit.
---

# Tridi Parity & UX Audit — Five Viewports, Two Languages, Five Robots (`/tridi-parity-audit` / `/tridi-ux-audit`)

The moment this command exists for: **a screen, landing section, or simulation control was built or modified on desktop in one language or for one robot, and we need certainty that every viewport, both languages (`ES` + `EN`), and all 5 robot models hold the exact same quality bar.**

**THIS AUDIT RUNS ON NUMBERS.** The deliverable of Phase 1 is a table of DOM geometry measurements (`getBoundingClientRect()`, `scrollWidth === innerWidth`) across viewports, languages, and robot models, produced before Juan is asked anything.

Three non-negotiable contracts (ported from `~/Code/portfolio`):

1. **Scope is explicit and echoed back.**
2. **Report before code.** Any difference in product behavior on one layout or robot is reported for Juan's decision, never silently altered.
3. **Every route in scope, at every viewport, language, and robot.** No sampling.

---

## Phase 0 — Ground yourself

1. **Read [`docs/audit-playbook.md`](../../../docs/audit-playbook.md) and [`AGENTS.md`](../../../AGENTS.md).**
2. **Run automated i18n and physics checks first:**
   ```bash
   npm --prefix physics run check
   npm --prefix web run check
   ```
3. **The fixed measuring sizes:**
   - Desktop: **`1440×900`** and **`1280×800`**
   - Desktop Zoom levels on `1440×900`: **`100%`**, **`80%`**, **`67%`**, **`50%`**
   - Mobile: **`390×844`** (iPhone 15/16 Pro), **`390×664`** (Safari bars visible), **`375×667`** (iPhone SE)
4. **Languages:** `ES` (`html[lang="es"]`) and `EN` (`html[lang="en"]`).

---

## Phase 1 — Measure the 3 Axes of Parity

### Axis 1 — Viewport & Zoom Geometry Parity (`#/`, `#/simulations`, `#/live`, `#/upload`, `#/delivery`, `#/assembler`, `#/milestones`, `#/docs`, `#/team`)

For every route at each viewport:
1. **Zero horizontal overflow:** `document.documentElement.scrollWidth === window.innerWidth`.
2. **Standardized inner shell:** On all 8 inner screens, measure `.app-topbar` (`top`, `left`, `width`, `height`) and the gap to `.screen-toolbar` / first content row (`14px` on desktop).
3. **Landing sections (`#home`, `#gym`, `#capture`, `#policy`, `#closing`, `.footer`):**
   - In `#capture`, verify `.frame-skeleton` stays inside its bottom-right PiP corner (`position: absolute`) and `.capture-video` never overlaps `.capture-caption`.
   - In `#policy`, verify `.policy-caption` on the right never covers the standing G1 robot on the left.
   - In `#closing`, verify `.closing-sticky` fills `>= 100svh` so `.footer` enters on the second scroll with generous breathing room below `.nav`.
4. **Zoom-invariance (`100%`, `80%`, `67%`, `50%`):**
   - Confirm containers center cleanly (`margin: 0 auto; width: min(1720px, 100%)`), corner radii stay proportional (`rem`/`px`, never `vw`/`svh`), and multi-column grids (`align-items: start`) never stretch cards with blank vertical space.

### Axis 2 — Bilingual Parity (`ES` ⇄ `EN`)

1. **Completeness:** `npm --prefix web run check` verifies all string dictionaries and `<span class="t" lang="es">` / `<span class="t" lang="en">` pairs.
2. **Layout stability across languages:**
   - Spanish strings run ~20–25% longer than English. Measure every pill, navbar link, toolbar button, `.card-badge`, and telemetry label in both `ES` and `EN`:
   - Confirm no button or pill wraps onto 2 lines (`height` in `ES` === `height` in `EN`), no text overflows its card, and live counters (`#sim-dodge-state`, `#speed`) maintain identical width in both languages.

### Axis 3 — Robot, Vertical & 3D Camera Parity (`unitree_g1`, `unitree_h1`, `luigi_lab3`, `luigi_lab4`, `factory_cell`)

Walk through every robot in `#/simulations` and verify:
1. **2-Column Controls Stability:**
   - Switching between `Unitree G1`, `Rover Luigi v1 (Lab 3)`, `Rover Luigi v2 (Lab 4)`, and `Celda Industrial` keeps `Playback` (left) and `Conditions` (right) in the same 2-column `.controls-bar` grid (`align-items: start`), hiding only humanoid-specific controls (`#show`, `#grasp-box`, `#place-field`, `#policy-field`, `#gallery`) and showing `#luigi-sim-panel` when applicable.
2. **Contextual 3D Props & Floors (`web/src/props.js`):**
   - Selecting `Sitting down` (`clip_sentarse-02-gvhmr`) automatically places `furniture/chair.glb` behind the G1's legs (`syncSitChair`) and removes it when switching to another clip.
   - Selecting `Washing dishes` (`clip_lavar-04-gvhmr`) switches to `Cocina` and places the kitchen sink counter (`syncWashSink`) in front of the G1's hands, removing it when switching away.
3. **3D Camera Target Reset & Orbit Cursor:**
   - Every 3D `<canvas>` has `cursor: grab` (`:active { cursor: grabbing }`).
   - Switching robots or clicking `#luigi-reset-arena` resets `viewer.controls.target` to the robot's pelvis height before setting `viewer.camera.position`.
4. **Clean Return to Landing (`#/`):**
   - Leaving `#/simulations` (from any robot, place, or world) back to `#/` restores `unitree_g1` with `FINAL_LEVEL` (`g1-stand`) on flat ground (`plano`) with zero leftover props (`clearStageProps`), standing upright in `#home` (never stuck walking or holding a rover model).

---

## Phase 2 — Report (stop for approval)

```markdown
# Tridi Parity & UX Audit — <scope> — <date>

## Verdict
Summary of parity across viewports, ES/EN, and the 5 robot models.

## Measurements Table
| Route / Surface | Metric | Desktop (1440×900) | Mobile (390×844) | ES | EN | Status / Δ |

## Findings (Ranked by Severity)
Each: route, file:line, measured discrepancy, concrete fix.

## Behavior Questions for Juan
Any asymmetric feature or copy length decision requiring product owner input.

## Ranked Fix Order
Independently verifiable batches.
```

Present the report and wait for Juan's approval.
