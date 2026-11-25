# Bitácora — OPENROUTER_API_KEY en Cloudflare Pages + 405 JSON en GET /api/pid-analyze

- **Fecha:** 2026-11-25
- **Persona:** Juan (`@juanevillam`)
- **Rama:** `juan/pid-analyze-get-405` (worktree aislado sobre `origin/main` para no tocar `juan/studio-overhaul`)

## Qué se hizo

1. **Secreto `OPENROUTER_API_KEY` en Cloudflare Pages (`tridi` / `production`):**
   - Subido vía `wrangler@3.90.0 pages secret put OPENROUTER_API_KEY --project-name=tridi`.
   - Verificado en vivo contra `https://trytridi.com/api/pid-analyze` tras el deploy `45570399399` (`bc2fb16`): `HTTP 200 ok: true`, `google/gemini-2.5-flash`, `1286 tokens`, `\$0.00149`, `3.02s`.
2. **Handler `onRequestGet` en `functions/api/pid-analyze.js`:**
   - Antes, un `GET /api/pid-analyze` en el navegador caía al fallback SPA `index.html` con rutas relativas rotas (`Cargando…Loading…`).
   - Ahora responde `405 Method Not Allowed` con `Allow: POST, OPTIONS` y JSON `{ ok: false, errorCode: "method_not_allowed", message, configured }`.

## Verificación

- `node --check functions/api/pid-analyze.js` y `wrangler@3.90.0 pages functions build functions` en verde.
- Trabajo aislado en worktree sin tocar `~/Code/tridi` (`juan/studio-overhaul`).
