---
name: tridi-quality
description: Tridi's UI/UX, 3D camera, MuJoCo physics, media, and bilingual quality gate (modeled on Juan's portfolio audit system). Use before finishing any web/ or physics/ task, or when invoked via /tridi-quality, /tridi-craft-audit, or /tridi-ux-audit.
---

# Tridi Quality & Audit System (`tridi-quality`)

Whenever you modify `web/` or `physics/` in `~/Code/tridi`, you **must** run the checks in [`docs/audit-playbook.md`](../../../docs/audit-playbook.md) before declaring work complete:

1. **Automated Physics & Web Build Checks:**
   - `npm --prefix physics run check`
   - `npm --prefix web run check`
   - `npm --prefix web run build`
2. **Visual Craft & Geometry Verification (`docs/audit-playbook.md`):**
   - Verify zero CLS on live telemetry (`#sim-dodge-state`) and playback speed (`#speed`).
   - Verify equal height on `.controls` cards and `.sims-main` vs `.sims-list` at both `100%` and zoomed-out (`67%`) viewports.
   - Verify high-contrast dark-mode tokens (`.card-badge.trained` in `--signal` lime, `.card-badge.trainable` in `#fbbf24` amber).
   - Verify `cursor: grab` on all 3D canvases and proper `controls.target` + `camera.position` reset when switching between `unitree_g1` and `luigi_lab3`.
   - Verify upright torso posture (`< 12°` tilt) on `Unitree G1` walking policies and solid obstacle avoidance on `luigi_lab3`.
   - Verify 100% `ES` / `EN` bilingual parity across all routes.
