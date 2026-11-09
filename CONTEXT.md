# Tridi — Context Handoff (`CONTEXT.md`)

**Last updated:** 2026-11-09  
**Active branch:** `juan/experimental`  
**Quality playbook:** [`docs/audit-playbook.md`](docs/audit-playbook.md) | **Skill:** `.claude/skills/tridi-quality/SKILL.md`

---

## 1. Current State Summary

1. **First Physical Sim-to-Real Case Study (`luigi_lab3`, Nov 2026):**
   - **Hardware:** Differential explorer robot by Luigi D'Aquaro (Arduino UNO ATmega328P, L298N H-bridge, 2× 200 RPM TT gearmotors with TPU tires, 2S 18650 battery pack, HC-SR04 ultrasonic sensor on `D9/A1`, APDS-9960 I2C optical sensor on `0x39` with clone Chip ID `0x9E`).
   - **Embedded Firmware & Deliverable:** [`entregable-luigi/robot_tridi_autonomo/robot_tridi_autonomo.ino`](entregable-luigi/robot_tridi_autonomo/robot_tridi_autonomo.ino) runs the transpiled `luigi-lab3.onnx` policy natively in C at **50 Hz** (461 bytes RAM, 22%), uses non-blocking hardware pin-change interrupts (`ISR(PCINT1_vect)`) on `A1` to avoid `pulseIn()`'s 47.1 ms freeze, drives the `0x9E` APDS-9960 register-direct at 40 Hz as an IR proximity radar, and executes a 4-stage closed-loop dodge maneuver.
   - **MuJoCo Digital Twin (`physics/models/luigi_lab3/`):**
     - `luigi.xml` includes the 6 CAD STL meshes, 18650 batteries, L298N heatsink, HC-SR04 dual cylinders, APDS-9960 PCB, and 3D Dupont wire arcs.
     - `scene.xml` features a compact, solid **3.4 m × 3.4 m** walled arena with cylinders and boxes (no hollow city houses).
     - `physics/src/policy.js` & `physics/src/viewer.js` simulate the 7-ray `HC-SR04` + `APDS-9960` sensor fan (±24° cone rendered in 3D, turning lime → amber → red on proximity) and the 4-stage obstacle dodge.

2. **Web App (`web/`) & Physics (`physics/`) Fixes Shipped:**
   - **`#/milestones` (`web/src/screens/milestones.js`):**
     - Segmented tab bar (`02 · Caso Real Sim-to-Real (Nov 2026)` | `01 · Origen en Platanus Hack 26 (Oct 2026)`) so users never get lost scrolling.
     - Full-duration upright videos: `luigi-sim2real.mp4` (`2:19`), `luigi-hardware.mp4` (`1:29` full hardware inspection, transposed upright), and `platanus-pitch.mp4` (`2:53` official pitch before Q&A), constrained to comfortable `310px–360px` player heights (`object-fit: contain`).
   - **`#/simulations` & `#/simulations/luigi_lab3` (`web/src/screens/simulations.js`, `web/src/stage.js`, `web/src/style.css`):**
     - Direct navigation to `#/simulations/luigi_lab3` automatically loads `luigi_lab3` in robot-only view, positions the camera at a clean 3/4 arena overview (`target` reset before `camera.position`), and shows `#luigi-sim-panel` in the right sidebar.
     - Drive & ONNX Policy controller (`🤖 ONNX Patrol`, `⬆️ Forward`, `⬇️ Reverse`, `⬅️ Turn Left`, `➡️ Turn Right`, `⏹ Stop`) lives cleanly inside `#luigi-sim-panel` (no USB connect clutter in Conditions).
     - Fixed CLS on `#sim-dodge-state` (`.luigi-tel-card` fixed `62px` height + `ellipsis`) and `#speed` (`68px` pill width).
     - Balanced column heights across all zoom levels: `.controls` cards stretch equally, and `.sims-list` matches `.sims-main` height.
     - High-contrast badges (`.card-badge.trained` in `--signal` lime, `.card-badge.trainable` in `#fbbf24` amber) and `cursor: grab` on all 3D canvases.
   - **Unitree G1 Upright Walking (`physics/src/sim.js`, `physics/src/policy.js`):**
     - Increased pelvis orientation tracking stiffness (`kpRot = 420`, `kdRot = 48`) and isolated `waist_pitch_joint` (`index 14`) from out-of-distribution forward pitch residuals, reducing walking torso tilt from `32.8°` to `< 9°` while passing all 9 imitation checks in `check-mimic.mjs`.
   - **Landing (`#/`, `web/src/screens/home.js`, `web/src/landing/landing.css`, `web/src/landing/telemetry.js`):**
     - Click-and-drag 3D orbiting enabled on the background scene (`cursor: grab !important` overriding `OrbitControls` inline `cursor: auto`), `Try it live` smooth-scroll mode lock (`navFlight`), safe restoration of `Unitree G1` and camera target when returning from `#/simulations/luigi_lab3` (guarding `dressTelemetry` while G1 reloads), GPU-composited `.try` cards without hover flicker, and generous spacing between `.tries` and `.footer`.
   - **Production & Domain Readiness (`vercel.json`, `web/vercel.json`, `web/index.html`, `data/server.py`, `data/live/src/api.js`):**
     - Synchronized immutable asset and media caching headers across root `vercel.json` and `web/vercel.json`, added OpenGraph/Twitter metadata and bilingual `#app-loading` in `web/index.html`, expanded `data/server.py` CORS (`127.0.0.1`, `localhost`, `tridi-alpha.vercel.app`, `tridi-*.vercel.app`, and `tridi.*` custom domains), and guarded `findApiUrl` in `data/live/src/api.js` with `checkApi(published)` so dead tunnel URLs never trigger console errors.

---

## 2. How to Resume in a New Session

1. Read [`AGENTS.md`](AGENTS.md), [`docs/estado.md`](docs/estado.md), and [`docs/audit-playbook.md`](docs/audit-playbook.md).
2. Run `npm --prefix physics run check && npm --prefix web run check` to verify baseline health.
3. For any UI/UX or simulation work, follow `.claude/skills/tridi-quality/SKILL.md` (`/tridi-craft-audit` and `/tridi-ux-audit`).
