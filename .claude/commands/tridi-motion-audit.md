---
name: tridi-motion-audit
description: >-
  Audit and optimize 60fps/120fps UI motion, Frame-0 mount stalls, GPU compositing layers (backdrop-filter, filter: blur/brightness, clip-path + drop-shadow), ResizeObserver/rAF choreography, and reduced-motion discipline across Tridi (web/). Ported from ~/Code/portfolio's portfolio-motion-audit. Report-first. Use when Juan invokes /tridi-motion-audit or asks to audit/fix UI animation smoothness or compositing lag.
---

# Tridi Motion & Compositing Audit — 60fps/120fps Fluidity (`/tridi-motion-audit`)

Ported from `~/Code/portfolio/.agents/skills/portfolio-motion-audit/SKILL.md` and adapted for **Tridi** (`web/` Vite SPA + Three.js WebGL + floating dark-glass overlays).

The moment this command exists for: **the screen looks right, yet opening a dropdown, expanding an accordion/panel in `#/assembler`, opening `dialog.photo-viewer`, switching robots/tabs, or scrolling feels "pegado" (sticky/laggy) in Chrome, Safari, or mobile.**

Every motion defect has a physical cause on the main thread or GPU compositor:
- **Frame-0 mount stalls:** mounting heavy DOM/SVG/canvas trees, calling synchronous `getBoundingClientRect()` / `offsetHeight` layout reads, or starting `requestAnimationFrame` loops during the first frame of a transition.
- **Covered or off-screen GPU layers still ticking:** `backdrop-filter: blur(16px)` surfaces, 2D SVG/canvas tickers (e.g., `#/assembler` schematic loop), or WebGL canvases animating while hidden, collapsed (`<details>` closed), or off-screen.
- **Non-composited CSS properties:** animating `filter: brightness(...)`, `box-shadow`, `height`/`width`, `clip-path` on filtered SVGs, or `transform` transitions fighting `requestAnimationFrame` updates.
- **ResizeObserver & pointer-move churn:** firing redundant layout reads or full DOM re-renders on every pointer/resize event instead of updating CSS custom properties directly or batching per frame.

Three non-negotiable contracts:

1. **Scope is explicit and echoed back.** State which routes/components are in scope before reading code.
2. **Report before code, measured with numbers.** Every finding cites `file:line`, Frame 0..N behavior, measured or traced cost, and the exact behavior-preserving fix. Mark any fix that alters visual choreography so Juan decides.
3. **Zero regression against `docs/audit-playbook.md` motion grammar.** All timings stay on the quantized ladder (`--dur-micro: 150ms`, `--hover: 220ms`, `--dur-quick: 300ms`, `--dur-turn: 450ms`, `--dur-settle: 600ms`, `--ease: cubic-bezier(0.16, 1, 0.3, 1)`).

---

## Phase 0 — Ground yourself

1. **Read [`docs/audit-playbook.md`](../../../docs/audit-playbook.md) and [`AGENTS.md`](../../../AGENTS.md).**
2. **Confirm baseline is green:** `npm --prefix physics run check && npm --prefix web run check && npm --prefix web run build`.

---

## Phase 1 — Inventory every motion, rAF loop & GPU layer

Run a mechanical sweep on `web/src`:

```bash
# Every rAF, View Transition, ResizeObserver, and layout read
grep -rn "requestAnimationFrame\|startViewTransition\|ResizeObserver\|getBoundingClientRect\|getComputedStyle" web/src

# Every expensive GPU filter, clip-path, keyframe, and transition in CSS
grep -rn "backdrop-filter\|filter:\|clip-path\|will-change\|@keyframes\|transition:" web/src
```

Build two tables before writing findings:

### Table A — Frame-by-frame Choreography of Primary Transitions
For each major transition (`Studio ▾` dropdown, `#/assembler` Step 1 → Step 2 and technical `<details>` accordion, `dialog.photo-viewer` in `#/milestones`, `#/simulations` robot/scene switches, `#/` scroll & footer parallax):
- **Frame 0 (trigger):** What mounts? What synchronous layout reads run?
- **Frames 1..N (in-flight):** Which CSS properties animate? Are `rAF` loops or `ResizeObserver` callbacks running concurrently?
- **Settled (post-transition):** Which `rAF` loops or `blur()` layers stay alive while hidden/collapsed?

### Table B — Active `requestAnimationFrame` & GPU Layer Budget
For every `rAF` loop and `backdrop-filter` / `filter: blur()` surface:
- When does it start?
- When does it stop (`cancelAnimationFrame`)? Does it pause when `document.hidden`, when its container is collapsed/off-screen, or when `prefers-reduced-motion: reduce`?

---

## Phase 2 — Tridi-Specific Hotspots to Audit

1. **Floating Glass & Overlays (`web/src/style.css`, `web/src/landing/landing.css`):**
   - Never animate `filter: brightness(...)` or `box-shadow` on containers that hold `backdrop-filter: blur(...)` children (forces offscreen re-rasterization every frame); use a composited `opacity` overlay instead.
   - Never put `transition: transform ...` on elements whose `transform` is updated every frame by `requestAnimationFrame` (e.g., 3D projected tags in `#/simulations` or scroll parallax elements).
2. **`#/assembler` 2-Step Transition & Technical Accordion (`web/src/screens/assembler.js`, `assembler.css`):**
   - Verify the 2D schematic ticker (`rAF`/interval) runs **only** while the 2D schematic tab inside `<details>` is open and visible, and stops immediately on close/unmount.
   - Verify opening Step 2 or toggling `<details>` triggers zero redundant layout thrashing.
3. **Scroll-Overflow Fade (`web/src/scroll-fade.js`) & Landing Scroll (`web/src/screens/home.js`):**
   - Confirm scroll listeners never interleave DOM writes with `getBoundingClientRect()` reads, and use passive listeners (`{ passive: true }`).
4. **`prefers-reduced-motion: reduce`:**
   - Confirm all CSS transitions, `:active` press squash, smooth scrolling, and decorative animations collapse cleanly under `@media (prefers-reduced-motion: reduce)`.

---

## Phase 3 — Report (stop for approval)

```markdown
# Tridi Motion & Compositing Audit — <scope> — <date>

## Verdict
One honest paragraph on frame pacing and primary bottlenecks.

## Choreography & Frame-0 Table
| Transition | Frame-0 work | In-flight GPU/CPU cost | Bottleneck |

## Findings (Ranked by Felt Lag / Frame Drops)
1. [HIGH/MED/LOW] <title> — `file:line`
   - Cause: what stalls main thread or GPU compositor.
   - Fix: exact behavior-preserving change.
   - Visual impact: Identical look / Minor timing refinement.

## Already Smooth & Verified
Motion systems confirmed 60fps-clean.

## Ranked Execution Batches
```

Present the report and wait for Juan's approval.
