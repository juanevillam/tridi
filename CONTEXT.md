# Tridi — Context Handoff (`CONTEXT.md`)

**Last updated:** 2026-11-14  
**Active branch:** `juan/zaka-industrial-plan` (shipped to `main` so `https://trytridi.com` and `tridi.vercel.app` are up to date)  
**Documentation index:** [`docs/README.md`](docs/README.md) | **Roadmap:** [`docs/ROADMAP.md`](docs/ROADMAP.md) | **Sales & Community GTM:** [`docs/plan-ventas-y-comunidades.md`](docs/plan-ventas-y-comunidades.md)  
**Latest session log:** [`docs/bitacora/2026-11-13-0045-juan-reunion-zaka-y-plan-industrial.md`](docs/bitacora/2026-11-13-0045-juan-reunion-zaka-y-plan-industrial.md)  
**Quality playbook:** [`docs/audit-playbook.md`](docs/audit-playbook.md) | **Skill:** `.claude/skills/tridi-quality/SKILL.md`

---

## 1. Current State Summary (`juan/zaka-industrial-plan`)

1. **Industrial P&ID & CAD Assembler (`physics/src/assembler/` + `#/assembler`):**
   - **Channel 1 — Plant & Process Automation (`.dxf` P&ID → ISA-5.1 Docs + 3D Twin + PLC Code):**
     - `physics/src/assembler/pid-parser.js` parses `.dxf` (`INSERT`/`ATTDEF`/`TEXT`/`LINE`/`LWPOLYLINE`) and builds an ISA-5.1 process DAG + I/O schedule (`DI`, `DO`, `AI 4-20 mA`) with 3 bundled industrial plants (`01_batch_mixer.dxf`, `02_sorting_cell.dxf`, `03_pump_interlock.dxf`).
     - `physics/src/assembler/isa-docs-generator.js` generates Cause & Effect Matrix (`CE-01..`), Control Narrative (`STEP 00..30`), and Alarm & Interlock Philosophy.
     - `physics/src/assembler/plc-generator.js` compiles deterministic IEC 61131-3 **Siemens TIA Portal Structured Text (`.scl`)** and **Rockwell Studio 5000 (`.L5K`)** flat files.
   - **Channel 2 — Custom Robots & Mechatronics (`.stl` + `.ino` → Hardware Audit + MuJoCo Twin + 50 Hz C99 Firmware):**
     - `physics/src/assembler/pinout.js` audits ATmega328P / ESP32 pinouts & hardware timers (`Timer1` `<Servo.h>` conflict on `D9/D10` vs `Timer0` PWM on `D5/D6`, blocking `pulseIn()`/`delay()` detection) and outputs calibrated 50 Hz C99 `.ino` firmware (`PWM_MIN_MOVE = 115`, `ISR(INT1_vect)`).
   - **Simulated Industrial Cell (`physics/models/factory_cell/scene.xml`):**
     - Closed-loop 3D sorting cell (`CV-101` conveyor, `PE-101` optical sensor, `LC-101` load cell `250 g / 500 g / 1 kg`, `PZ-101` reject pusher, `PZ-102` accept diverter) inside a 3-wall enclosed industrial bay (`dressIndustrialPlant` in `web/src/looks/index.js`).

2. **Global UI/UX Standardization, Corporate Pages (`#/team`), 3D Worlds Matrix Horizon & Polish (`web/` + `physics/`):**
   - **Unified Global Header & Centered Navbar (`web/src/header.js`, `web/src/landing/landing.css`, `web/src/style.css`):** Both `.topbar` and `.app-topbar` use a 3-column grid (`grid-template-columns: 1fr auto 1fr`) with `.wordmark` on the left, navigation centered in the middle, and `.topbar-right` on the right (`#/docs` removed).
   - **Landing (`#/`, `web/src/screens/home.js`, `web/src/landing/landing.css`, `web/src/landing/city.js`, `web/src/landing/strings.js`):**
     - Compact `.sim-readout` telemetry chip (`Live · standing · MuJoCo 500/50 Hz`) restricted exclusively to the `#home` Hero section (`data-shot="hero"`), fading out immediately when scrolling down.
     - Optimized 3D dusk street (`city.js`): no Spanish shop signs or poster text, half the parked cars (`BAY_M = 14`), 2 café bistro tables, 2 potted plants, 2 bins, 5 building types (`a..e`) + 2 background towers, with a Matrix simulation grid horizon dissolving where the street ends (`±24 m`).
     - Restored `Tridi Capture` (`#capture`) video & simulation framing (`width: min(40vw, 640px)`, `dist: 3.3, aim: 0.8`) and sticky parallax curtain entry for a vertically compact `.footer` inside `#closing` (`min-height: 148svh`), balanced `.wordmark.big` (`clamp(44px, 5.8vw, 72px)`), `"Team"` / `"Equipo"` link, and `© 2026 Tridi`.
   - **Matrix Simulation Grid Horizon Dissolve (`web/src/looks/common.js`, `web/src/looks/index.js`, `web/src/props.js`, `web/src/skeleton.js`, `physics/src/viewer.js`, `web/src/landing/street.js`):**
     - Removed all tall dark backdrop walls and replaced them with `createMatrixHorizon`: a GLSL `ShaderMaterial` that renders a glowing `#c8ff2e` wireframe grid and de-materializing cells right outside each physical world boundary (`SkeletonView`, `RobotView`, `cocina`, `deposito`, `vereda`, `factory_cell`, `luigi_lab3`, `luigi_lab4`, `city.js`) that dissolves smoothly into the dark void.
   - **Co-Founders `#/team` Page (`web/src/screens/team.js`, `web/public/media/team/*.jpg`):**
     - Concise co-founder grid with `52×52 px` circular avatars (`pastor.jpg`, `juan.jpg`, `cesar.jpg`, `ale.jpg`), no `@handles`, titles (`Co-Founder & CEO/CTO/CIO/COO`), 1-line focus areas, and LinkedIn + GitHub links.
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
