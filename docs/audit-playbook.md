# Tridi Web & Physics Audit Playbook (`docs/audit-playbook.md`)

Ported from `~/Code/portfolio` (`docs/audit-playbook.md` and `website/docs/audit-playbook.md`) and adapted for **Tridi** (`physics/` MuJoCo 500 Hz WASM + ONNX Runtime 50 Hz + Three.js WebGL + `web/` Vite SPA + `data/server.py` + Cloudflare Pages `https://trytridi.com`).

Every audit lives in `.agents/skills/<name>/SKILL.md`, `.claude/skills/<name>/SKILL.md`, and `.claude/commands/<name>.md`. Each was built for a **moment** rather than a vague topic, and this playbook defines the exact sequence so the moments compose without churn.

---

## 1. The 8 Commands & When Each Runs

| Command / Skill | Portfolio Equivalent | The Moment | Scope |
| --- | --- | --- | --- |
| **`/tridi-craft-audit`** | `/portfolio-craft-audit` + `/web-craft-audit` + `juan-lens` | A chunk of UI/CSS/3D rework just landed | Componentization (zero twin drift), shell alignment, tokens, active hover immunity, scroll-overflow fade, zero dead space |
| **`/tridi-data-audit`** | `/portfolio-data-audit` + `/web-perf-audit` (weight) | UI works; what does it cost the network & CDN while it works? | 3-bucket payload budget (`first paint` vs `on scroll` vs `on demand`), lazy non-G1 robot STLs, `.mp4` re-encodes, `.stl` dedupe, `data/server.py` |
| **`/tridi-cache-audit`** | `/portfolio-cache-audit` | UI done & data pruned; what does it relearn, refetch, or recompile that it already knew? | Cloudflare `_headers` (`/assets/*`, `/models/*`, `/media/*`), STL URL cache, ONNX bytes/meta/motion `Map` cache, `smoothForDisplay` cache, GLB + `CanvasTexture` cache, bounded LRU `replay.json` cache |
| **`/tridi-perf-audit`** | `/web-perf-audit` (runtime) | Rework landed, new 3D props/worlds added, or simulation `realtime` drops / GPU heats up | Protecting 500 Hz MuJoCo WASM & 50 Hz ONNX budget: Three.js draw calls, duplicate shadow maps, WebGL geometry/material/texture disposal on `rebuild()` & `unmount()`, zero rAF layout reads, off-screen media pause |
| **`/tridi-parity-audit`** (`/tridi-ux-audit`) | `/web-parity-audit` | A section/screen changed on one viewport, language, or robot vertical | Measured across 5 viewports (`1440×900`, `1280×800`, `390×844`, `390×664`, `375×667`) + zoom (`100%..50%`) × 2 languages (`ES`/`EN`) × 5 robots (`G1`, `H1`, `Luigi v1/v2`, `Factory Cell`) |
| **`/tridi-a11y-audit`** | `/web-a11y-audit` | Layouts have settled, before a release | WCAG 2.2 AA keyboard nav, `:focus-visible`, modal focus traps, bilingual `aria-label`s, `prefers-reduced-motion`, contrast, touch targets |
| **`/tridi-share-audit`** | `/web-share-audit` | Before sharing `trytridi.com` with YC, customers, LinkedIn, WhatsApp, or X | Built `dist/index.html` OG/Twitter tags, `og.png` (`1200×630`, `< 300 KB` for WhatsApp), canonical URL, JSON-LD, `robots.txt` |
| **`/tridi-release-audit`** | `/portfolio-quality-audit` + `/web-release-audit` | Before **every** `scripts/ship.sh` or deploy to `trytridi.com`, **last** | 11-point `GO / NO-GO` gate: `physics check`, `web check`, clean `web build`, Cloudflare Pages limits (`< 25 MiB`), `_headers`, security, `yc/` boundary, 2-layer docs sync |

---

## 2. The Execution Sequence, and Why

When running a full engineering sweep (or closing a major milestone), run the audits in this exact order:

```bash
/tridi-craft-audit      # 1. Structure & tokens first — moves DOM/CSS that later audits cite
/tridi-data-audit       # 2. Prune & defer what asks the network (3 budgets + media/STL weight)
/tridi-cache-audit      # 3. Bank what remains — never cache a fetch you should have deferred
/tridi-perf-audit       # 4. Free GPU/RAM/CPU for 500 Hz MuJoCo (shadow maps, WebGL leaks, rAF)
/tridi-parity-audit     # 5. Measure 5 viewports × 2 languages × 5 robots on settled code
/tridi-a11y-audit       # 6. Keyboard, screen reader, reduced motion & contrast on settled layout
/tridi-share-audit      # 7. Social preview cards (< 300 KB og.png) & crawler metadata
/tridi-release-audit    # 8. Final GO / NO-GO gate on built web/dist before scripts/ship.sh
```

- **Why Craft leads:** Componentization moves files and classes around, which would invalidate `file:line` findings in the subsequent audits.
- **Why Data comes before Cache:** `/tridi-data-audit` removes eager startup fetches that don't belong on first paint (such as `unitree_h1`, `luigi_lab3`, `luigi_lab4`, and `factory_cell` STLs inside `loadG1()`) and re-encodes oversized `.mp4` videos; `/tridi-cache-audit` then caches the on-demand fetches and computations that remain.
- **Why Perf comes before Parity:** Fixing duplicate shadow maps, WebGL disposal leaks, and media loading settles the rendering pipeline before Parity measures boxes across 5 viewports and 5 robots.
- **Why Release is always last:** It checks the final `web/dist` artifact left behind by all earlier passes.

---

## 3. Three Non-Negotiable Audit Contracts

1. **Scope is explicit and echoed back.** State which routes/packages are in scope and respect exclusions. Any critical finding outside scope is listed in a separate labelled section.
2. **Report-first, always.** Every audit produces a ranked findings report with `file:line` evidence and measured numbers (`du -sh`, `getBoundingClientRect()`, `renderer.info`, `ffprobe`) and **waits for Juan's approval** before modifying code.
3. **Measured, never eyeballed.** Every claim about bytes, frame times, WebGL geometries/textures, or pixel alignment quotes before-and-after measurements on the production build.

---

## 4. Standing Product, UI/UX & Engineering Standards (What Every Audit Grounds In)

1. **One of Everything & Zero Twin Drift (`juan-lens`):**
   - Before adding a button, back pill, section header, badge, scrollable fade, or modal, grep `web/src/` for existing siblings and reuse the shared primitive (`.app-topbar`, `.screen-toolbar`, `mountScrollFade`, `dialog.photo-viewer`, `robot-host.js`).
   - **Identical Shell Across All Inner Screens:** `#/simulations`, `#/live`, `#/upload`, `#/delivery`, `#/assembler`, `#/milestones`, `#/docs`, and `#/team` all use `width: min(1720px, 100%); margin: 0 auto; padding: 14px 20px 28px;`, `.app-topbar` at the top, and `margin-top: 14px` to `.screen-toolbar` / first content row.
2. **Dark-Surface Contrast, 4-Tier Ink Hierarchy & Liquid Glass:**
   - Dark-only (`--bg: #08090b`, `--panel: #121417`, `--line: rgb(241 243 238 / 0.12)`), never raw `#fff` or `#000` for card surfaces.
   - **4-tier ink hierarchy:** `--fg` (`#f1f3ee`) for primary titles/active controls, `--fg-body` (`#bdbdbd`) for body paragraphs, `--fg-2` (`#a9ada4`) for secondary labels, `--dim` (`#7d8279`) for uppercase monospace metadata.
   - **One Signal Accent:** `--signal` (`#c8ff2e`) with translucent tint backgrounds (`rgb(200 255 46 / 0.12)`); warnings `#fbbf24`; active dodge/alerts `#ff6a3d`.
   - **Floating Glass Surfaces:** `backdrop-filter: blur(16px) saturate(1.8)` over a dark tonal floor with top specular rim (`inset 0 0.75px 0 rgb(255 255 255 / 0.22)`).
3. **Active State Immunity, Zero Hover Clipping & Scroll-Overflow Fade (`mountScrollFade`):**
   - Active/selected elements (`[aria-current="true"]`, `[aria-selected="true"]`, `[aria-pressed="true"]`, `.active`) must never lose their active border/color on `:hover`.
   - Never use `transform: translateY(-1px)` on `:hover` inside scrollable containers (prevents clipping against scrollbars).
   - Scrollable containers (`#gallery`, `.asm-code`, `.asm-table-wrap`, `.dl-table-wrap`, `.dl-episodes`, `.docs-nav-list`) apply eased `mask-image` edge fades via `web/src/scroll-fade.js`.
4. **Zero CLS, Tabular Numerals & Zero Dead Space (`align-items: start`):**
   - Live 50 Hz telemetry (`#sim-hcsr04`, `#sim-apds`, `#sim-wheels`, `#sim-dodge-state`, `.sim-readout`, `#speed`) must use `font-variant-numeric: tabular-nums`, `white-space: nowrap`, and fixed `min-width`.
   - Multi-column grids (`.controls-bar`, `.dl-more`, `.sims-layout`) use `align-items: start` so short cards never stretch with blank vertical space.
5. **Shapes, Concentric Corners & Motion Grammar:**
   - Lone glyph controls (`#play`, `#reset`, `.dl-play`, `.v-close`, `.v-prev`, `.v-next`) are circles (`border-radius: 50%`). Text controls (`#speed`, `.back`, `.chip`) are pills (`border-radius: 999px`).
   - Transitions use `--dur-micro` (`150ms`), `--dur-quick` (`300ms`), `--dur-turn` (`450ms`), `--dur-settle` (`600ms`), `--ease: cubic-bezier(0.16, 1, 0.3, 1)`, and `--hover: 220ms cubic-bezier(0.25, 0.1, 0.25, 1)`, with tactile `:active` squash (`scale(0.97)` / `scale(0.92)`), respecting `prefers-reduced-motion: reduce`.
6. **3-Bucket Network Budget, Edge Caching & Simulation Resource Priority:**
   - Cold load on `#/` fetches only `mujoco.wasm` + `unitree_g1` + `g1-stand` + landing props. Non-G1 robots (`unitree_h1`, `luigi_lab3`, `luigi_lab4`, `factory_cell`), `dex3.js`, MediaPipe WASM, and `replay.json` load strictly on demand.
   - `web/public/_headers` serves `/assets/*` and `/models/*` with `Cache-Control: public, max-age=31536000, immutable` and `/media/*` with `max-age=604800, stale-while-revalidate=86400`.
   - Every `RobotView.rebuild()`, floor swap, and route `unmount()` disposes all Three.js geometries (including cloned `.glb` children), materials, and procedural `CanvasTexture`s so VRAM and WASM heap remain flat across the entire session.
7. **Robot-Aware Contextual UI, 3D Props & Clean Return to `#/`:**
   - All 3D canvases show `cursor: grab` (`grabbing` on active).
   - `Sitting down` loads `furniture/chair.glb` (`syncSitChair`); `Washing dishes` switches to `Cocina` and loads `syncWashSink`.
   - Leaving `#/simulations` always restores `unitree_g1` with `FINAL_LEVEL` (`g1-stand`) on flat ground (`plano`) with zero leftover props.
8. **Bilingual Parity (`ES` + `EN`) & Copy Ownership:**
   - Every visible string carries both `es` and `en` translations (`npm --prefix web run check`).
   - Copy is flagged by audits, never silently rewritten without Juan's approval.
