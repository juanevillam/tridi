---
description: Run a comprehensive visual craft, layout geometry, CLS, contrast, and 3D framing audit on Tridi's web app and fix all findings.
---

# Tridi Visual Craft Audit (`/tridi-craft-audit`)

Read [`docs/audit-playbook.md`](../../docs/audit-playbook.md) first. Ground every finding in measured DOM geometry (`getBoundingClientRect()`) and computed styles across desktop (`1440×900`), zoomed-out desktop (`100%`, `67%`), and mobile (`390×844`).

## Audit Checklist

1. **Column & Card Height Balance (`#/simulations`):**
   - Measure `.sims-main`, `#controls > .control-group:first-child` (Playback), `#controls > .control-group:last-child` (Conditions), and `.sims-list` (Sidebar).
   - Verify that both `.control-group` cards have identical height (`Math.abs(h1 - h2) <= 2px`) and `.sims-list.bottom` aligns with `.sims-main.bottom` (`Math.abs(b1 - b2) <= 2px`).
2. **Zero CLS Under Live Updates (`#/simulations/luigi_lab3` & `#/`):**
   - Observe `.luigi-telemetry-grid` while `#sim-dodge-state` cycles through all 4 dodge stages (`0` → `1` → `2` → `3`) and while `#speed` cycles (`1×` → `0.5×` → `0.25×`).
   - Verify `getBoundingClientRect().top` of `#luigi-reset-arena` and `#show` shifts by `0px`.
3. **Token & Badge Contrast:**
   - Inspect all `.card-badge`, `.milestone-badge`, `.state`, and button states on dark backgrounds. Ensure contrast ratio meets WCAG AA (`>= 4.5:1`) and uses Tridi house tokens (`--signal`, `#fbbf24`, `#ff6a3d`).
4. **Landing Scroll, Sticky Cards & Footer Clearance (`#/`):**
   - Scroll to `.closing` (`#try`). Verify `.footer` top border never collides with `.tries` cards (`footer.top - tries.bottom >= 48px`) and hovering rapidly across `.try` cards (`1 → 2 → 3 → 4 → 2`) produces zero WebGL/compositor flicker.
5. **Milestones Video Framing & Navigation (`#/milestones`):**
   - Verify `.milestone-tabs` switches cleanly between `sim-to-real` and `platanus-hack`, video boxes do not exceed `360px` height, and `ffprobe` duration matches the intended full clip.
