---
name: tridi-quality
description: Tridi's UI/UX, 3D camera, MuJoCo physics, media, motion grammar, and bilingual quality gate. Use before finishing any web/ or physics/ task, or when invoked via /tridi-quality, /tridi-craft-audit, or /tridi-ux-audit.
---

# Tridi Quality & Audit System (`tridi-quality`)

Whenever you modify `web/` or `physics/` in `~/Code/tridi`, you **must** run the checks in [`docs/audit-playbook.md`](../../../docs/audit-playbook.md) before declaring work complete:

1. **Automated Physics & Web Build Checks:**
   - `npm --prefix physics run check`
   - `npm --prefix web run check`
   - `npm --prefix web run build`
2. **Visual Craft, Motion & Geometry Verification (`docs/audit-playbook.md`):**
   - Verify zero CLS on live telemetry (`#sim-dodge-state`) and single-line pill on playback speed (`#speed` `0.5×`).
   - Verify **zero dead vertical/horizontal space** (`align-items: start` on `.controls-bar`, `.dl-more`, `.sims-layout`; 2-column grid on `.dl-formats`) and consistent 2-column `Playback` + `Conditions` layout across all robots.
   - Verify 4-tier dark-mode ink hierarchy (`--fg`, `--fg-body`, `--fg-2`, `--dim`), liquid-glass rims on floating HUD/PiP overlays, and quantized duration/easing tokens (`--dur-*`, `--ease`, `--hover`) with tactile `:active` press squash.
   - Verify `cursor: grab` on all 3D canvases, contextual 3D props (`chair.glb` on `Sitting down`, `syncWashSink` on `Washing dishes`), and proper `controls.target` + `camera.position` reset when switching robots.
   - Verify upright torso posture (`< 12°` tilt) on `Unitree G1` walking/running policies (`1.56 Hz` stride cadence on `g1-run`), PiP source videos on all clips and deliveries, and `PhotoViewer` fullscreen lightbox in `#/milestones`.
   - Verify 100% `ES` / `EN` bilingual parity across all routes.
