---
name: tridi-quality
description: >-
  Master index and orchestrator for Tridi's 9-command audit system (craft, data, cache, perf, motion, parity, a11y, share, and release gate) ported from ~/Code/portfolio (post-freeze Nov 2026) and adapted for MuJoCo WASM + Three.js WebGL + ONNX Runtime + Cloudflare Pages (trytridi.com). Includes the mandatory Pre-Commit Delta Audit Rule. Use before finishing any web/ or physics/ milestone, or when invoked via /tridi-quality.
---

# Tridi Quality & Audit System (`tridi-quality`)

Tridi uses the **9-Command Audit System** ported from `~/Code/portfolio` (`portfolio-*` + `web-*`, synced post-portfolio freeze Nov 2026) and tailored specifically to Physical AI on the web (`physics/` MuJoCo 500 Hz WASM + ONNX Runtime 50 Hz + Three.js WebGL + `web/` Vite SPA + `data/server.py` + Cloudflare Pages `trytridi.com`).

Full playbook, standing rules, execution order, and the **Pre-Commit Delta Re-Run Rule** live in [`docs/audit-playbook.md`](../../../docs/audit-playbook.md).

---

## The 9 Audits & The Order They Run In

When running a full milestone sweep (or auditing Tridi end-to-end), always run in this exact order so earlier structural/network fixes don't invalidate later caches or measurements:

```text
1. /tridi-craft-audit    → Lock componentization (zero twin drift), tokens, and Juan's Lens
2. /tridi-data-audit     → Prune network payload into 3 budgets (first paint vs scroll vs on-demand) & shrink media/STL bloat
3. /tridi-cache-audit    → Bank what remains (HTTP _headers, STL URL dedupe, ONNX/motion/retarget Map caches, GLB & CanvasTexture caches, bounded LRU replays)
4. /tridi-perf-audit     → Protect the 500 Hz MuJoCo & 60 fps WebGL budget (shadow maps, GPU geometry/texture disposal on rebuild/unmount, zero rAF layout reads)
5. /tridi-motion-audit   → 60fps/120fps UI compositing (zero Frame-0 stalls, covered blur/rAF pause, non-composited filter checks, reduced motion)
6. /tridi-parity-audit   → Measure 5 viewports + zoom (100%..50%) × 2 languages (ES/EN) × 5 robots (G1, H1, Luigi v1/v2, Factory Cell)
7. /tridi-a11y-audit     → Keyboard focus, inert/modal traps, bilingual aria-labels, aria-busy, prefers-reduced-motion, WCAG 2.2 AA contrast & touch targets
8. /tridi-share-audit    → Open Graph / WhatsApp (<300 KB og.png) / LinkedIn / X preview cards, canonical URLs, JSON-LD
9. /tridi-release-audit  → Final 11-point GO / NO-GO gate before scripts/ship.sh or deploy to trytridi.com
```

### Pre-Commit Delta Audit Rule (Mandatory After Approved Changes)

Whenever code changes in `web/` or `physics/` are implemented and approved by Juan, **before committing**, run a fast targeted delta pass of the exact audit skill(s) covering the touched files (see the File → Skill matrix in [`docs/audit-playbook.md`](../../../docs/audit-playbook.md)) so every commit stays up to date with the latest full audit baseline and never re-introduces regressions.

### Why this order is mandatory

1. **Craft before Data & Perf:** Craft merges duplicate components and standardizes DOM containers, moving lines the next audits cite.
2. **Data before Cache:** *"Never cache a call you should have deleted or deferred."* `/tridi-data-audit` stops `loadG1()` from eagerly downloading 20 MB of unused `H1`/`Luigi`/`Factory Cell` STLs on `#/` first paint and shrinks oversized videos; `/tridi-cache-audit` then banks the on-demand fetches and derived computations that remain.
3. **Cache, Perf & Motion before Parity:** Perf, cache, and compositing fixes alter how 3D scenes, textures, transitions, and media load and settle; Parity then measures the settled boxes across all 5 viewports, 2 languages, and 5 robots.
4. **Parity before A11y:** Accessibility (focus order, `inert`, contrast, touch target boxes) is measured on the final layout that won't move again.
5. **Release is always last:** Verifies the final `web/dist` bundle, automated test suites (`physics check`, `web check`, `web build`), Cloudflare Pages limits, and 2-Layer Documentation Auto-Sync.

---

## Quick Skill Reference

| Skill / Command | File | Portfolio Equivalent |
| --- | --- | --- |
| `/tridi-craft-audit` | [`.agents/skills/tridi-craft-audit/SKILL.md`](../tridi-craft-audit/SKILL.md) | `portfolio-craft-audit` + `web-craft-audit` + `juan-lens` |
| `/tridi-data-audit` | [`.agents/skills/tridi-data-audit/SKILL.md`](../tridi-data-audit/SKILL.md) | `portfolio-data-audit` + `web-perf-audit` (network/media weight) |
| `/tridi-cache-audit` | [`.agents/skills/tridi-cache-audit/SKILL.md`](../tridi-cache-audit/SKILL.md) | `portfolio-cache-audit` |
| `/tridi-perf-audit` | [`.agents/skills/tridi-perf-audit/SKILL.md`](../tridi-perf-audit/SKILL.md) | `web-perf-audit` (WebGL + MuJoCo WASM + DOM rAF) |
| `/tridi-motion-audit` | [`.agents/skills/tridi-motion-audit/SKILL.md`](../tridi-motion-audit/SKILL.md) | `portfolio-motion-audit` (60fps/120fps compositing & Frame-0 budget) |
| `/tridi-parity-audit` | [`.agents/skills/tridi-parity-audit/SKILL.md`](../tridi-parity-audit/SKILL.md) | `portfolio-parity-audit` + `web-parity-audit` + `/tridi-ux-audit` |
| `/tridi-a11y-audit` | [`.agents/skills/tridi-a11y-audit/SKILL.md`](../tridi-a11y-audit/SKILL.md) | `portfolio-a11y-audit` + `web-a11y-audit` |
| `/tridi-share-audit` | [`.agents/skills/tridi-share-audit/SKILL.md`](../tridi-share-audit/SKILL.md) | `web-share-audit` |
| `/tridi-release-audit` | [`.agents/skills/tridi-release-audit/SKILL.md`](../tridi-release-audit/SKILL.md) | `portfolio-quality-audit` + `portfolio-release-audit` + `web-release-audit` |
