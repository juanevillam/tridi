---
description: Audit Tridi's interactive UX, robot switching, 3D camera targeting, physics posture, and ES/EN bilingual parity.
---

# Tridi UX & Simulation Audit (`/tridi-ux-audit`)

Read [`docs/audit-playbook.md`](../../docs/audit-playbook.md) first. Verify every user flow across `#/`, `#/simulations`, `#/simulations/luigi_lab3`, `#/milestones`, `#/live`, `#/upload`, and `#/delivery`.

## Audit Checklist

1. **Robot-Aware UI State (`#/simulations`):**
   - Load `#/simulations/luigi_lab3` directly and via the `#/milestones` CTA button. Verify `#robot-model` is `luigi_lab3`, `#stage[data-show="robot"]` is active, `#luigi-sim-panel` is visible, and humanoid-only sections (`#grasp-box`, `#place-field`, `#policy-field`, `#gallery`) are hidden.
   - Click `Switch back to Unitree G1` (`#luigi-back-g1`) and navigate back to `#/`. Verify the Landing page displays `Unitree G1` standing upright in the hero.
2. **3D Camera Reset & Orbit Affordance:**
   - Verify `.pane canvas` and `.film canvas` have `cursor: grab` (`grabbing` when active).
   - Switch between `unitree_g1` and `luigi_lab3`, and click `#luigi-reset-arena`. Verify `viewer.controls.target` is reset to the robot's pelvis before `viewer.camera.position` is set.
3. **Humanoid Upright Walking & Wheeled Obstacle Dodge (`physics/`):**
   - Run `npm --prefix physics run check`.
   - Verify `Unitree G1` walking (`g1-walk`, `g1-frente`) maintains `torsoTilt < 12°` and `luigi_lab3` executes its 4-stage obstacle evasion inside the solid 3.4m × 3.4m arena without passing through obstacles.
4. **ES / EN Bilingual Parity:**
   - Toggle `ES` / `EN` on every route and confirm zero untranslated strings remain visible.
