---
name: tridi-quality
description: >-
  Master index and orchestrator for Tridi's 7-command audit system (craft, data, cache, perf, parity, a11y, share, and release gate) ported from ~/Code/portfolio and adapted for MuJoCo WASM + Three.js WebGL + ONNX Runtime + Cloudflare Pages (trytridi.com). Use before finishing any web/ or physics/ milestone, or when invoked via /tridi-quality.
---

# Tridi Quality & Audit System (`tridi-quality`)

Tridi uses the **7-Command Audit System** ported from `~/Code/portfolio` (`portfolio-*` + `web-*`) and tailored specifically to Physical AI on the web (`physics/` MuJoCo 500 Hz WASM + ONNX Runtime 50 Hz + Three.js WebGL + `web/` Vite SPA + `data/server.py` + Cloudflare Pages `trytridi.com`).

Full playbook, standing rules, and execution order live in [`docs/audit-playbook.md`](../../../docs/audit-playbook.md).

---

## The 7 Audits & The Order They Run In

When running a full milestone sweep (or auditing Tridi end-to-end), always run in this exact order so earlier structural/network fixes don't invalidate later caches or measurements:

```text
1. /tridi-craft-audit    → Lock componentization (zero twin drift), tokens, and Juan's Lens
2. /tridi-data-audit     → Prune network payload into 3 budgets (first paint vs scroll vs on-demand) & shrink media/STL bloat
3. /tridi-cache-audit    → Bank what remains (HTTP _headers, STL URL dedupe, ONNX/motion/retarget Map caches, GLB & CanvasTexture caches, bounded LRU replays)
4. /tridi-perf-audit     → Protect the 500 Hz MuJoCo & 60 fps WebGL budget (shadow maps, GPU geometry/texture disposal on rebuild/unmount, zero rAF layout reads)
5. /tridi-parity-audit   → Measure 5 viewports + zoom (100%..50%) × 2 languages (ES/EN) × 5 robots (G1, H1, Luigi v1/v2, Factory Cell)
6. /tridi-a11y-audit     → Keyboard focus, modal traps, bilingual aria-labels, prefers-reduced-motion, WCAG 2.2 AA contrast & touch targets
7. /tridi-share-audit    → Open Graph / WhatsApp (<300 KB og.png) / LinkedIn / X preview cards, canonical URLs, JSON-LD
8. /tridi-release-audit  → Final 11-point GO / NO-GO gate before scripts/ship.sh or deploy to trytridi.com
```

### Why this order is mandatory

1. **Craft before Data & Perf:** Craft merges duplicate components and standardizes DOM containers, moving lines the next audits cite.
2. **Data before Cache:** *"Never cache a call you should have deleted or deferred."* `/tridi-data-audit` stops `loadG1()` from eagerly downloading 20 MB of unused `H1`/`Luigi`/`Factory Cell` STLs on `#/` first paint and shrinks 37 MB of milestone videos; `/tridi-cache-audit` then banks the on-demand fetches and derived computations that remain.
3. **Cache & Perf before Parity:** Perf and cache fixes alter how 3D scenes, textures, and media load and settle; Parity then measures the settled boxes across all 5 viewports, 2 languages, and 5 robots.
4. **Parity before A11y:** Accessibility (focus order, contrast, touch target boxes) is measured on the final layout that won't move again.
5. **Release is always last:** Verifies the final `web/dist` bundle, automated test suites (`physics check`, `web check`, `web build`), Cloudflare Pages limits, and 2-Layer Documentation Auto-Sync.

---

## Quick Skill Reference

| Skill / Command | File | Portfolio Equivalent |
| --- | --- | --- |
| `/tridi-craft-audit` | [`.agents/skills/tridi-craft-audit/SKILL.md`](../tridi-craft-audit/SKILL.md) | `portfolio-craft-audit` + `web-craft-audit` + `juan-lens` |
| `/tridi-data-audit` | [`.agents/skills/tridi-data-audit/SKILL.md`](../tridi-data-audit/SKILL.md) | `portfolio-data-audit` + `web-perf-audit` (network/media weight) |
| `/tridi-cache-audit` | [`.agents/skills/tridi-cache-audit/SKILL.md`](../tridi-cache-audit/SKILL.md) | `portfolio-cache-audit` |
| `/tridi-perf-audit` | [`.agents/skills/tridi-perf-audit/SKILL.md`](../tridi-perf-audit/SKILL.md) | `web-perf-audit` (WebGL + MuJoCo WASM + DOM rAF) |
| `/tridi-parity-audit` | [`.agents/skills/tridi-parity-audit/SKILL.md`](../tridi-parity-audit/SKILL.md) | `web-parity-audit` + `/tridi-ux-audit` |
| `/tridi-a11y-audit` | [`.agents/skills/tridi-a11y-audit/SKILL.md`](../tridi-a11y-audit/SKILL.md) | `web-a11y-audit` |
| `/tridi-share-audit` | [`.agents/skills/tridi-share-audit/SKILL.md`](../tridi-share-audit/SKILL.md) | `web-share-audit` |
| `/tridi-release-audit` | [`.agents/skills/tridi-release-audit/SKILL.md`](../tridi-release-audit/SKILL.md) | `portfolio-quality-audit` + `web-release-audit` |
