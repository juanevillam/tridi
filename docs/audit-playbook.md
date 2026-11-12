# Tridi Web & Physics Audit Playbook (`docs/audit-playbook.md`)

Use this playbook whenever touching `web/` or `physics/` so UI, UX, 3D camera, motion grammar, and simulation regressions are caught automatically before shipping.

---

## Commands & Skills

| Command / Skill | Scope | Fixes issues? |
|---|---|---|
| `/tridi-craft-audit` | Component standardization (zero twin drift), pixel-level layout, zero dead vertical/horizontal space, CLS, typography, token contrast, concentric corners, motion ladder, and zoom-out balance (`100%`, `80%`, `67%`, `50%`). | Yes |
| `/tridi-ux-audit` | User journeys, robot-specific UI filtering (`unitree_g1`, `luigi_lab3`, `luigi_lab4`, `factory_cell`), 3D props (`chair.glb`, `syncWashSink`), camera target resets, orbit cursors, media orientation/duration, and ES/EN parity. | Yes |
| `/tridi-release-audit` | Final ship gate: `npm --prefix physics run check`, `npm --prefix web run check`, `npm --prefix web run build`, and zero console/runtime errors across all routes. | Report + fix |

---

## Standing Product & UI/UX Standards (Non-Negotiable)

1. **One of Everything & Zero Twin Drift:**
   - Before adding a button, back pill, section header, badge, or modal, grep `web/src/` for existing siblings and reuse the shared class/token (`.back` / `.dl-back`, `.milestone-badge.signal`, `#pick-heading` / `.gallery-section-head`, `dialog.photo-viewer`). Never duplicate styles with slightly different paddings, radii, or borders.
2. **Dark-Surface Contrast, 4-Tier Ink Hierarchy & Liquid Glass:**
   - Tridi's UI is dark-only (`--bg: #08090b`, `--panel: #121417`, `--line: rgb(241 243 238 / 0.12)`), never pure `#fff` or `#000` for card surfaces.
   - **4-tier ink hierarchy:** `--fg` (`#f1f3ee`) for primary titles and active controls, `--fg-body` (`#bdbdbd`) for running paragraphs (lighter than secondary labels so reading across a block never tires the eye), `--fg-2` (`#a9ada4`) for secondary labels, and `--dim` (`#7d8279`) for uppercase monospace metadata.
   - **One Signal Accent:** Primary signal accents use `--signal` (`#c8ff2e`) with translucent tint backgrounds (`rgb(200 255 46 / 0.12)`); warnings use `#fbbf24`; active dodge/alerts use `#ff6a3d`. Never use dark-on-dark badges.
   - **Floating Glass Surfaces:** Floating HUDs, PiP video previews (`.source-pip-wrap`, `.dl-source-pip`), and modal controls sit over a dark tonal floor with `backdrop-filter: blur(16px) saturate(1.8)` and a subtle top specular rim (`inset 0 0.75px 0 rgb(255 255 255 / 0.22)`).
3. **Zero Content Layout Shift (CLS) & Tabular Numerals:**
   - Any element displaying live 50 Hz telemetry (`#sim-hcsr04`, `#sim-apds`, `#sim-wheels`, `#sim-dodge-state`, `.hud .state`, `.sim-readout`) or cycling state (`#speed`: `1×`, `0.5×`, `0.25×`) **must** have fixed dimensions (`min-width` / `height`), `font-variant-numeric: tabular-nums`, and `white-space: nowrap` so text changes never shift neighboring buttons or wrap onto 2 lines.
4. **Zero Dead Vertical or Horizontal Space (`align-items: start`):**
   - **Never stretch a short card to match a tall neighbor:** Multi-column grids (`.controls-bar` with `Playback` + `Conditions`, `.dl-more` with `Training` + `Files you take away`, `.sims-layout`) must use `align-items: start` so every card ends cleanly where its content ends — zero dead vertical whitespace.
   - **Keep the 2-column layout across all robots:** Switching from `Unitree G1` to `Rover Luigi v1/v2` or `Industrial Cell` keeps `Playback` (left) and `Conditions` (right) in the same 2-column grid (hiding only humanoid-specific toggles inside `Playback`), never collapsing into 1 column.
   - **Eliminate dead horizontal space:** Wide documentation/spec blocks (like `README` / `.dl-formats` in `#/delivery`) use a 2-column card grid (`repeat(2, minmax(0, 1fr))`) with code samples spanning underneath.
5. **Shapes, Concentric Corners & Circle-vs-Pill Rule:**
   - **Circle vs Pill:** Lone icon/glyph buttons (`#play`, `#reset`, `.dl-play`, `.v-close`, `.v-prev`, `.v-next`) are **circles** (`border-radius: 50%`, equal width/height). Controls carrying text (`#speed` `0.5×`, `.back`, `.dl-back`, `.chip`) are **pills** (`border-radius: 999px`, `white-space: nowrap`).
   - **Concentric corners:** Nested elements inside a rounded container reduce their corner radius by the padding inset (`innerRadius = Math.max(outerRadius - inset, floor)`). Radii are defined in `rem` or `px` (never `vw`/`svh`) so they stay invariant under browser zoom.
6. **Quantized Motion Ladder & Tactile Press Feedback:**
   - All transitions use `:root` duration tokens (`--dur-micro: 150ms`, `--dur-quick: 300ms`, `--dur-turn: 450ms`, `--dur-settle: 600ms`) and `--ease: cubic-bezier(0.16, 1, 0.3, 1)` (with `--hover: 220ms cubic-bezier(0.25, 0.1, 0.25, 1)` for color/border fades).
   - Interactive cards, pills, and buttons provide tactile `:active` press squash (`transform: scale(0.97)` on pills/cards, `scale(0.92)` on lone icon buttons), disabled under `prefers-reduced-motion: reduce`.
   - Fullscreen photo lightboxes (`dialog.photo-viewer` in `#/milestones`) open/close with `450ms` `opacity` + `scale(0.96 -> 1)`, a fixed `3:2` stage with blurred backdrop fill for portrait photos, two cross-fading `.layer` images, and viewport-pinned circular navigation buttons that never shift position.
7. **Robot-Aware Contextual UI, 3D Props & Camera Reset:**
   - Every interactive 3D canvas (`.pane canvas`, `.film canvas`, `.dl-view canvas`) must show `cursor: grab` and `:active { cursor: grabbing }`.
   - Contextual 3D props load automatically for their clip: `Sitting down` places the real chair (`furniture/chair.glb`) with backrest behind the robot; `Washing dishes` switches to `Cocina` and places the kitchen sink counter (`syncWashSink`) with plates and soapy water under the robot's hands.
   - Leaving `#/simulations` must always restore `unitree_g1` with `FINAL_LEVEL` (`g1-stand`) so `#/` never inherits a wheeled robot or industrial cell.
8. **Physical Uprightness, Natural Gait Cadence & Performance:**
   - Humanoid walking/running policies (`g1-walk`, `g1-frente`, `g1-run`) must maintain upright torso posture (`torsoTilt < 12°`) and natural athletic stride cadence (`1.56 Hz` for `g1-run`).
   - All PiP source videos (`web/public/media/clips/*.mp4`) use compact H.264 encodes (`preload="metadata"`, `muted playsinline`), pause when hidden, and never block first paint.
9. **Bilingual Parity (`ES` + `EN`) & CSS Scoping:**
   - Every visible string must have both `<span class="t" lang="es">` and `<span class="t" lang="en">` (verified by `npm --prefix web run check`).
