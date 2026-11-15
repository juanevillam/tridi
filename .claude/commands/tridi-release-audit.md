---
name: tridi-release-audit
description: >-
  The final GO / NO-GO gate before shipping (scripts/ship.sh) or deploying trytridi.com to Cloudflare Pages — runs physics check, web i18n check, clean production build, Cloudflare Pages limits (< 25 MiB per file, < 20k files), _headers cache/security verification, route & asset link resolution, security/dependency check, Public Mirror Boundary (yc/), and 2-Layer Documentation Auto-Sync. Report-first; never deploys unasked. Use when Juan invokes /tridi-release-audit or before shipping.
---

# Tridi Release Audit — The Gate Before Every Deploy (`/tridi-release-audit`)

The moment this command exists for: **a merge to `main` (`scripts/ship.sh`) or deploy to `https://trytridi.com` is next.** This audit combines the pre-deploy speed of `/web-release-audit` with the engineering & security rigor of `/portfolio-quality-audit`. It runs **last**, after whatever craft, data, cache, perf, parity, a11y, or share audits the change called for, because it verifies the actual built output (`web/dist`) and repository state that will go live on Cloudflare Pages.

**It never runs `scripts/ship.sh` or `git push` on its own.** The report ends with **GO** or **NO-GO** and the exact evidence.

---

## Phase 0 — What is going out

1. **Inspect branch & commits since `origin/main`:**
   ```bash
   git status -sb
   git log --oneline origin/main..HEAD
   ```
2. **Check which other `/tridi-*` audits the changes called for** (per [`docs/audit-playbook.md`](../../../docs/audit-playbook.md)):
   - UI / layout / CSS rework → `/tridi-craft-audit`, `/tridi-parity-audit`
   - New robot / 3D props / media / replay → `/tridi-data-audit`, `/tridi-cache-audit`, `/tridi-perf-audit`
   - Interactive controls / modals → `/tridi-a11y-audit`
   - `<head>` / OG card / landing copy → `/tridi-share-audit`

---

## Phase 1 — The 12 Gate Checks

Run all 12 checks and record `PASS`, `WARN`, or `FAIL` with exact counts/paths:

1. **Physics & Simulation Test Suite (`physics/`):**
   ```bash
   npm --prefix physics run check
   ```
   All 13 physics, retarget, policy, ONNX, worlds, scenes, and assembler checks must pass (`0` errors).
2. **Web i18n & Translation Completeness (`web/`):**
   ```bash
   npm --prefix web run check
   ```
   Every dictionary key has complete `es`/`en` translations and matching `{placeholders}`, and every lookup resolves.
3. **Clean Production Build (`web/dist`):**
   ```bash
   rm -rf web/dist && npm --prefix web run build
   ```
   Zero build errors.
4. **Nothing Dev-Only, Secret, or Private in `web/dist`:**
   ```bash
   find web/dist \( -name '*.map' -o -name '.DS_Store' -o -name '*.pem' -o -name '*.key' -o -path '*yc*' \)
   ```
   Must return empty. Confirm no private YC notes (`yc/`) or local server secrets are copied into `web/dist`.
5. **Cloudflare Pages Hard Limits & Total Bundle Budget:**
   ```bash
   find web/dist -type f -size +24M
   find web/dist -type f | wc -l
   du -sh web/dist web/dist/*
   ```
   - Zero files over `25 MiB` (Cloudflare Pages hard reject limit).
   - Total file count `< 20,000`.
   - Quote `du -sh web/dist` and flag any unexpected weight jump.
6. **Edge Security & Cache Headers (`web/dist/_headers`):**
   - Confirm `web/dist/_headers` exists and contains:
     - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
     - `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`
     - `/assets/*` → `Cache-Control: public, max-age=31536000, immutable`
     - `/models/*` → `Cache-Control: public, max-age=31536000, immutable`
     - `/media/*` → `Cache-Control: public, max-age=604800, stale-while-revalidate=86400`
7. **Every Internal Reference & Route Resolves:**
   - Verify all `src`, `href`, `poster`, and `og:image` paths in `web/dist/index.html` and `web/src/` point to existing files in `web/dist/`.
   - Verify all registered routes in `web/src/router.js` (`#/`, `#/simulations`, `#/live`, `#/upload`, `#/delivery`, `#/assembler`, `#/milestones`, `#/docs`, `#/team`) mount cleanly.
8. **Security & Dependency Health:**
   - Scan `git diff origin/main..HEAD` for hardcoded credentials, tokens, or accidental debug flags.
   - Check `npm --prefix web audit --omit=dev` and `npm --prefix physics audit --omit=dev`.
9. **YC Truth & Public Mirror Boundary (`AGENTS.md`):**
   - Any metric or claim added to customer/YC-facing surfaces must match [`yc/verdad-hoy.md`](../../../yc/verdad-hoy.md).
   - Confirm `yc/` remains strictly in private `juanevillam/tridi` (`origin`) and is never staged for `Torpass/tridi`.
10. **2-Layer Documentation Auto-Sync (`AGENTS.md`):**
    - Confirm session log in `docs/bitacora/` is updated.
    - If tasks in `docs/ROADMAP.md`, robot models, schemas (`docs/contrato.md`), or infra (`docs/infra-and-security.md`, `docs/architecture-and-sim2real.md`) changed, confirm Layer 1 (`docs/ROADMAP.md`, `docs/estado.md`) and Layer 2 (`docs/*.md` + live `#/docs` screen) are updated in the same branch.
11. **Live Production Smoke Check:**
    - Load the app in browser across `#/`, `#/simulations`, `#/delivery`, `#/assembler`, `#/milestones`, `#/docs`, `#/team`:
    - Confirm `0` console errors, `0` failed network requests (`404`/`500`), G1 stands upright on `#/`, and switching `ES` ↔ `EN` works cleanly.

---

## Phase 2 — Report

```markdown
# Tridi Release Audit — <date> — <branch @ short-sha>

## GO / NO-GO
One line verdict, followed by the summary reason.

## Gate Checks (1–11)
| # | Check | Status (PASS / WARN / FAIL) | Evidence |

## Audits Due vs Run
Which `/tridi-*` audits were called for by this branch's diff and their status.

## Commits Going Out
`git log --oneline origin/main..HEAD`
```

A `FAIL` on Check 1, 2, 3, 4, 5, 7, 9, or 11 is an automatic **NO-GO**.
