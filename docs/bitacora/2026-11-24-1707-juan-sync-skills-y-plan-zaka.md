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

## Qué sigue

- Confirmar con Juan si se hace ship (`scripts/ship.sh`) de `juan/sync-portfolio-skills` a `main`.
- Definir respuesta a José Alejandro sobre el mensaje al Ing. José González (ZAKA) y arrancar sprint de 2 días en el pipeline P&ID real (imágenes/PDFs escaneados vía VLM acotado + pruebas con planos P&ID reales de terceros + 3D dinámico).
