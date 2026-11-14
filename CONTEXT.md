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

2. **Global UI/UX Standardization & Polish (`web/` + `physics/`):**
   - **Unified Global Header (`web/src/header.js`):** All inner screens (`#/simulations`, `#/live`, `#/upload`, `#/delivery`, `#/assembler`, `#/milestones`) share `appHeaderHTML()` and `mountAppHeader()`.
   - **Landing (`#/`, `web/src/screens/home.js`, `web/src/landing/landing.css`):**
     - Hover-to-open dropdowns (`Product ▾` & `Studio ▾`) with SVG icons and compact category chips (`7.5px` font).
     - `Tridi Gym` (`#gym`): eliminated vertical robot jump when switching between `10M`, `100M`, and `300M` steps (`loadPolicy` only updates `view.targetHeight` when `controls.enabled === true` and skips `sim.reset()` when `reset: false`).
     - `Tridi Policy` (`#policy`): fixed `.policy-data` button overflow by animating `.policy-caption` as a single card unit.
     - Closing & Footer (`#closing`): removed duplicate `.try-tag` chips on `.tries` cards; redesigned `.footer` with larger `tridi` wordmark + tagline stacked below, 2-column team grid next to brand, and `↑ Back to top` button on the right.
   - **Simulations (`#/simulations`):**
     - Matched camera zoom/scale across the source video PiP, 3D green skeleton (`SkeletonView`), and simulated Unitree G1 (`Viewer`).
     - Added Newtons force selector (`100 N · 150 N · 300 N · 500 N`) next to `Push the robot`.
     - Removed `"Pick a motion"` / `"Preloaded examples"` headers, removed bottom `.fio-narrator` boxes, and hid floating tags on `unitree_g1`, `luigi_lab3`, and `luigi_lab4` (kept only on `factory_cell`).
   - **Deliveries (`#/delivery`) & Assembler (`#/assembler`):**
     - `#/delivery`: replaced the crowded header, `.dl-status`, `.dl-explain`, and `.dl-guide` wall of text with a single compact `.dl-toolbar` (clip selector first, inline metric pills, and `↓ Download files` button without `(5)`).
     - `#/assembler`: unified header with mode toggle, removed the 3-step banner in the header, and toned down excessive lime green (`--signal`) so tables, tabs, and SVG schematics use clean neutral monochrome contrast.
   - **Source Video PiP & Expanded View (`#/simulations` & `#/delivery`) + Lightbox (`#/milestones`):**
     - Source training video uses `object-fit: contain` with radial-gradient backdrop in both compact PiP and full-stage expanded view so the person's full body is always visible.
     - `#/milestones` fullscreen lightbox (`.photo-viewer`) centers `figcaption` horizontally, uses a radial-gradient background instead of black, and sets `border-radius: 0` on fullscreen images.

3. **2-Layer Documentation & Raw Archives (`docs/`):**
   - Standardized all documentation in [`docs/README.md`](docs/README.md) following `~/Code/portfolio` conventions, and archived the official Brand Manual by José Alejandro ([`docs/pitch/manual-de-marca-tridi.pdf`](docs/pitch/manual-de-marca-tridi.pdf)), Platanus Hack Pitch Deck ([`docs/pitch/tridi-pitch.pdf`](docs/pitch/tridi-pitch.pdf)), and ZAKA field meeting audio + raw transcript ([`docs/reuniones/`](docs/reuniones/)).

---

## 2. How to Resume Tomorrow

1. Read [`AGENTS.md`](AGENTS.md), [`CONTEXT.md`](CONTEXT.md), and [`docs/bitacora/2026-11-13-0045-juan-reunion-zaka-y-plan-industrial.md`](docs/bitacora/2026-11-13-0045-juan-reunion-zaka-y-plan-industrial.md).
2. Confirm branch is `juan/zaka-industrial-plan` (`git status`).
3. Start dev server on a free port when needed (`npm --prefix web run dev -- --port 5199 --strictPort`).
4. When ready to deploy to `https://trytridi.com`, run `scripts/ship.sh` to squash-merge `juan/zaka-industrial-plan` into `main`.
