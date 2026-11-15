# Tridi — Context Handoff (`CONTEXT.md`)

**Last updated:** 2026-11-14  
**Active branch:** `juan/zaka-industrial-plan` (pushed to `origin/juan/zaka-industrial-plan`, **NOT yet merged to `main`** so `https://trytridi.com` is not deployed until final approval)  
**Documentation index:** [`docs/README.md`](docs/README.md) | **Roadmap:** [`docs/ROADMAP.md`](docs/ROADMAP.md)  
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

2. **Global UI/UX Standardization, Corporate Pages (`#/docs`, `#/team`), Scroll-Overflow Fade & Polish (`web/` + `physics/`):**
   - **Unified Global Header & Standardized Shell (`web/src/header.js`, `web/src/style.css`):** All inner screens (`#/simulations`, `#/live`, `#/upload`, `#/delivery`, `#/assembler`, `#/milestones`, `#/docs`, `#/team`) share `appHeaderHTML()`, `width: min(1720px, 100%); margin: 0 auto; padding: 14px 20px 28px;`, and `.screen-toolbar` (`margin-top: 14px`).
   - **Landing (`#/`, `web/src/screens/home.js`, `web/src/landing/landing.css`, `web/src/landing/city.js`):**
     - Merged `.hud` and `.sim-readout` into a single bottom-right telemetry chip (`MuJoCo WASM · Unitree G1 · 29 DOF · 500 Hz`).
     - Lighter 3D city (`city.js`): narrower sidewalk (`6 m`), shorter street (`44 m`), zero background skyscrapers (`TOWERS_N = 0`), 4 building GLBs, fewer parked cars.
     - Fixed `Tridi Capture` (`#capture`) PiP skeleton specificity (`.landing .frame.frame-skeleton` `position: absolute`) so video never collides with `.capture-caption`.
     - Fixed G1 robot state transitions (`setMode`, `useLevel`, `runGym`) so the robot stops walking immediately when leaving `#capture` and stays centered inside its `1.2 m` circle in `#gym`.
     - Cinematic camera framing in `Tridi Policy` (`#policy`) and full-viewport `#closing` (`min-height: 100svh`) with a second-scroll multi-column corporate `.footer` (and `.wordmark` click scroll-to-top).
   - **Dedicated `#/docs` & `#/team` Pages (`web/src/screens/docs.js`, `web/src/screens/team.js`):**
     - `#/docs` auto-syncs dynamically with `WORLDS`, `SCENES`, `listComponents` from `tridi-physics` and `LEVELS`, `IMITATIONS`, `ROBOT_MODELS` from `web/src/policies.js`.
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
