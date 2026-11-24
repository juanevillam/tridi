# Bitácora: Sync de skills de auditoría desde portafolio + estrategia P&ID ZAKA

- **Persona:** Juan (`@juanevillam`)
- **Rama:** `juan/sync-portfolio-skills`
- **Fecha:** 2026-11-24 17:07

## Qué se hizo

1. **Sync local con `origin/main`:** Fast-forward de `main` (`aaedfbd..5671dc3`) trayendo el flujo comercial de 2 pasos de `#/assembler` de Pastor (`.dxf` + `.pdf` vectorial, 6 muestras `AC1009` en `data/pid_samples/`, FDS + `.csv` I/O + `.scl`/`.L5K`) y el `ROADMAP.md` actualizado.
2. **Actualización de la suite de auditorías de Tridi desde `~/Code/portfolio` (post-freeze nov 2026):**
   - Nueva skill **`tridi-motion-audit`** (portada de `portfolio-motion-audit`): Frame-0 stalls, capas `backdrop-filter`/`blur()` ocultas, propiedades no compositadas, `rAF`/`ResizeObserver` y `prefers-reduced-motion`.
   - **`tridi-a11y-audit`**: añadido `inert` + `aria-hidden="true"` en capas cubiertas/modales, orden estricto de `Escape` y `aria-busy="true"` + `role="status"` en procesos largos (P&ID / video / WASM).
   - **`tridi-release-audit`**: añadida verificación de favicons/Search Console/`security.txt` y gate de delta audits pendientes.
   - **`tridi-quality`**, **`docs/audit-playbook.md`** y **`AGENTS.md`**: actualizados al sistema de **9 comandos** e incorporada la **Regla Obligatoria de Pre-Commit Delta Audit** (matriz Archivo → Skill para re-ejecutar solo el delta de las skills afectadas sobre `git diff --name-only` antes de cada commit tras cambios aprobados).
   - Espejado byte-a-byte en `.agents/skills/`, `.claude/skills/` y `.claude/commands/`.

3. **Ship de skills (`PR #42`) y Delta Audit en `#/assembler` (`juan/assembler-delta-audit`):**
   - Mergeado `PR #42` a `main` vía `scripts/ship.sh`.
   - Aplicados Batch 1 + 2 + 3 del delta audit (`craft` + `motion` + `parity` + `a11y`) sobre `web/src/screens/assembler.js`, `assembler.css` y `strings/assembler.js`:
     - Accesibilidad por teclado en dropzone y cargas `.stl`/`.ino` (`.asm-sr-input` + `:focus-within`), `aria-busy="true"` + `try/catch` en `loadFile`, `role="tab"` + `aria-label` bilingüe en tablists/SVGs/`<select>`, y botón Copy con restauración automática sin romper i18n.
     - Ticker 2D optimizado: reutiliza `currentDag` cacheado (cero re-parseo del `.dxf` cada 900 ms) y pausa en `document.hidden` o `prefers-reduced-motion: reduce`.
     - Tokens CSS migrados a `--ink`/`--ink-soft`/`--muted`/`--bg`/`--hover`/`--dur-micro`, chevron rotatorio en `<details>`, padding móvil `< 600px`, bloque `@media (prefers-reduced-motion: reduce)`, paridad ES/EN en Modo CAD y limpieza de 18 llaves i18n huérfanas (`assembler.js` `41.91 kB` → `40.79 kB`).
   - Verificado: `npm --prefix web run check` (`697` claves, `469` lookups OK) y `npm --prefix web run build` (`799 ms`).

## Qué sigue

- Confirmar si hacemos `scripts/ship.sh` de `juan/assembler-delta-audit` a `main`.
- Definir con Juan qué pantalla del producto mejorar primero (`#/simulations`, `#/assembler`, `#/live`, `#/upload` o `#/delivery`).
