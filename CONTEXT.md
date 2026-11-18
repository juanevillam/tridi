# Tridi — Context Handoff (`CONTEXT.md`)

**Last updated:** 2026-11-18  
**Active branch:** `juan/roadmap-y-mercado` (rebased onto `origin/main` commit `aaedfbd` with Pastor's new 2-step commercial `#/assembler` and `.dxf`/`.pdf` flexible ISA extractor)  
**Documentation index:** [`docs/README.md`](docs/README.md) | **Roadmap (To-Dos Only):** [`docs/ROADMAP.md`](docs/ROADMAP.md) | **Sales & Community GTM:** [`docs/plan-ventas-y-comunidades.md`](docs/plan-ventas-y-comunidades.md)  
**Latest session logs:** [`docs/bitacora/2026-11-18-0145-juan-roadmap-todos-y-estrategia-mercado.md`](docs/bitacora/2026-11-18-0145-juan-roadmap-todos-y-estrategia-mercado.md) · [`docs/bitacora/2026-11-18-0430-pastor-assembler-comercial-fase1.md`](docs/bitacora/2026-11-18-0430-pastor-assembler-comercial-fase1.md)  
**Quality playbook:** [`docs/audit-playbook.md`](docs/audit-playbook.md) | **Skill:** `.claude/skills/tridi-quality/SKILL.md`

---

## 1. Current State Summary (`origin/main` + `juan/roadmap-y-mercado`)

1. **Industrial P&ID & CAD Assembler (`physics/src/pid_assembler.js` + `#/assembler` — Updated by Pastor on 2026-11-18):**
   - **Commercial 2-Step Progressive Disclosure Flow (`web/src/screens/assembler.js`):**
     - **Step 1 (Clean Upload):** Single centered dropzone for AutoCAD `.dxf` or vectorial `.pdf` blueprints + 1-click presets (`01_batch_mixer.dxf` .. `06_pilot_plant_hydromet.dxf` in strict AutoCAD R12 `AC1009` 2D geometry).
     - **Step 2 (Executive ISA-5.1 Engineering Sheet First):** Protagonist view displays the Functional Design Specification (`FDS`: Equipment Schedule, `ISA-88` Control Narrative, Cause & Effect Safety Matrix) with direct buttons to **Save/Print PDF**, **Download I/O Schedule in Excel (`.csv`)**, and **Open 3D Plant Simulation**.
     - **Collapsible Advanced Technical Accordion (`<details>`):** Houses the generated Siemens `TIA Portal (.scl)` and Rockwell `Studio 5000 (.L5K)` PLC blocks, raw PLC memory addresses (`%I0.0`, `%Q0.0`, `%IW64`), interactive 2D fault-injection schematic, and MuJoCo `.xml`.
   - **Flexible ISA-5.1 Catalog & Alias Normalizer (`physics/components/isa_standard.json`, `physics/src/pid_assembler.js`):**
     - Expanded to 16 industrial equipment classes (`FV`, `WT`, `LT`, `LSH`, `LSL`, `PT`, `TT`, `FT`, `AT`, `M`, `P`, `TK`, `SL`, `SC`, `CV`, `PK`) + real-world non-strict alias recognition (`TANK`, `BV`, `PP`, `AOD`, `FILTER PRESS`, `SIR`, `MT`/`MTO`/`M`, pH/level footnotes) so blueprints that do not follow 100% strict ISO/ISA naming still resolve cleanly.
   - **Next Technical Goal (from Pastor's 2026-11-18 voice memos):**
     - Extend P&ID recognition to **raster images (`.png` / `.jpg` / scanned blueprints)** and design a **cost-bounded hybrid AI pipeline (local deterministic parser + vision/LLM via OpenRouter/API)** where call count and token cost per blueprint are strictly measured to protect unit economics before generating the dynamic PDF documentation, 3D model, and Rockwell/Siemens PLC code.

2. **Global UI/UX Standardization, 3D Worlds & Polish (`web/` + `physics/`):**
   - **Unified Global Header & Centered Navbar (`web/src/header.js`, `web/src/landing/landing.css`, `web/src/style.css`):** Both `.topbar` and `.app-topbar` use a 3-column grid (`grid-template-columns: 1fr auto 1fr`) with `.wordmark` on the left, navigation centered in the middle (`Capture`, `Gym`, `Policy` | `Studio ▾`, `Avances` / `Milestones` on the landing; `Simulaciones`, `Cámara en vivo`, `Subir video`, `Entregas`, `Assembler` | `Avances` on inner screens), and `.topbar-right` on the right (`#/docs` and `#/team` screens removed).
   - **Landing (`#/`, `web/src/screens/home.js`, `web/src/landing/landing.css`, `web/src/landing/city.js`, `web/src/landing/strings.js`):**
     - Compact `.sim-readout` telemetry chip (`Live · standing · MuJoCo 500/50 Hz`) restricted exclusively to the `#home` Hero section (`data-shot="hero"`), fading out immediately when scrolling down.
     - Exact 3D dusk street from `tridi-alpha.vercel.app` (`city.js`: `STREET_M = 76`, `ROW_X = [-28, 28]`, `END_X = 30`, `TOWERS_N = SMALL_SCREEN ? 0 : 4`, `BAY_M = 6`, with shared `loadKenneyGlb` and `canvasCache`), and clean `60x60` open floors across `SkeletonView`, `RobotView`, `cocina`, and `deposito` (no walls and no Matrix horizon effect).
     - Restored `Tridi Capture` (`#capture`) video & simulation framing (`width: min(40vw, 640px)`, `dist: 3.3, aim: 0.8`) and sticky parallax curtain entry for a vertically compact `.footer` inside `#closing` (`min-height: 148svh`), balanced `.wordmark.big` (`clamp(44px, 5.8vw, 72px)`), direct LinkedIn links for the 4 co-founders under the `Team` / `Equipo` column (`Pastor Jiménez`, `Juan Villa`, `César Martínez`, `Ale Hernández`), and `© 2026 Tridi`.
   - **Verified Capture-to-Simulation Flows (`#/upload`, `#/live`, `#/camera/<session>`):**
     - Verified all three flows add `PoseClip` via `addUserClip()` and link directly to `#/simulations/<clip.id>` (`PHONE_WEB` updated to `https://trytridi.com/`).
   - **Active Hover Immunity & Scroll-Overflow Fade (`web/src/scroll-fade.js`, `web/src/style.css`):**
     - Fixed `.push` hover contrast, locked active elements on `:hover` (`[aria-current="true"]`, `[aria-selected="true"]`, `[aria-pressed="true"]`), removed `translateY(-1px)` hover clipping inside scrollbars, and added `mountScrollFade()` (`mask-image` edge fades) on all scrollable containers.

3. **8-Command Tridi Audit Suite (`.agents/skills/tridi-*`, `.claude/commands/tridi-*.md`, `docs/audit-playbook.md`):**
   - Ported from `~/Code/portfolio` and tailored to Tridi: `/tridi-craft-audit`, `/tridi-data-audit`, `/tridi-cache-audit`, `/tridi-perf-audit`, `/tridi-parity-audit`, `/tridi-a11y-audit`, `/tridi-share-audit`, and `/tridi-release-audit`.

4. **2-Layer Documentation & Raw Archives (`docs/`):**
   - Standardized all documentation in [`docs/README.md`](docs/README.md) following `~/Code/portfolio` conventions, and archived the official Brand Manual by José Alejandro ([`docs/pitch/manual-de-marca-tridi.pdf`](docs/pitch/manual-de-marca-tridi.pdf)), Platanus Hack Pitch Deck ([`docs/pitch/tridi-pitch.pdf`](docs/pitch/tridi-pitch.pdf)), and ZAKA field meeting audio + raw transcript ([`docs/reuniones/`](docs/reuniones/)).

---

## 2. How to Resume Tomorrow

1. Read [`AGENTS.md`](AGENTS.md), [`CONTEXT.md`](CONTEXT.md), and [`docs/bitacora/2026-11-13-0045-juan-reunion-zaka-y-plan-industrial.md`](docs/bitacora/2026-11-13-0045-juan-reunion-zaka-y-plan-industrial.md).
2. Confirm branch is `juan/zaka-industrial-plan` (`git status`).
3. Start dev server on a free port when needed (`npm --prefix web run dev -- --port 5199 --strictPort`).
4. When ready to deploy to `https://trytridi.com`, run `scripts/ship.sh` to squash-merge `juan/zaka-industrial-plan` into `main`.
