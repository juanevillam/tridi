# Bitácora — Pipeline Híbrido P&ID con OpenRouter (`Vision` + `Text` + Sanitizador Determinista)

- **Fecha:** 2026-11-25
- **Persona:** Pastor (`@torpass`)
- **Rama:** `pastor/hardware-catalog-and-lab4`
- **Tarea de Roadmap:** `P-1` (Reconocimiento de imágenes P&ID y detección inteligente híbrida local + OpenRouter con unit economics medidos)

## Qué se hizo

1. **Esquema Industrial Estricto y Sanitizador (`physics/src/pid_schema.js`):**
   - Implementó el patrón *mus3o* ("la IA razona, el código determinista ensambla") con **1 sola llamada acotada** a OpenRouter (`google/gemini-2.5-flash`) usando `response_format: json_schema` (`strict: true`).
   - Dos rutas optimizadas por costo:
     - `mode: 'vision'` para imágenes P&ID (`.png`, `.jpg`, `.jpeg`, `.webp`): redimensionado local en `<canvas>` (`<= 1600 px`, JPEG `0.86`) + extracción de equipos, instrumentos (incluyendo notas al pie de sensores de pH/nivel), narrativa `ISA-88`, matriz Causa-Efecto y pasos `plcSequenceSteps`.
     - `mode: 'text'` para `.dxf` y `.pdf` vectoriales: extracción determinista en navegador a `\$0`, seguida de 1 llamada ligera que NO repite `nodes[]`/`edges[]` y genera solo la narrativa específica, matriz C&E y secuencia PLC para esa planta (con fallback offline limpio si no hay API).
   - `sanitizeAiPidSpec()` normaliza todos los prefijos contra el catálogo cerrado de 16 clases (`isa_standard.json`), elimina conexiones o tags alucinados, normaliza acentos NFD para identificadores IEC 61131-3 y garantiza pasos PLC ascendentes únicos (`10, 20, 30...`).
   - `estimateOpenRouterCostUsd()` calcula el costo exacto por corrida para telemetría y unit economics (`A-2`).

2. **Backend Serverless + Middleware Local (`functions/api/pid-analyze.js`, `web/vite.config.js`, `.env.example`):**
   - Cloudflare Pages Function `POST /api/pid-analyze` con tope de `6 MiB`, timeout `45 s`, manejo honesto de errores (`api_not_configured`, `insufficient_credits`, `no_equipment_detected`, `timeout`) y cero presets falsos.
   - Plugin local `localPidAnalyzePlugin()` en `web/vite.config.js` que monta la misma función `handlePidAnalyzePayload` en `vite dev` leyendo `OPENROUTER_API_KEY` desde `.env` en la raíz (nunca expuesta al navegador ni commiteada).

3. **Integración en Física y UI (`physics/src/pid_assembler.js`, `web/src/screens/assembler.js`, `assembler.css`, `strings/assembler.js`):**
   - `generateIsaEngineeringDocs(dag, { lang, aiSpec })` y `generatePlcFlatFile(dag, { aiSpec })` consumen la narrativa, matriz C&E y secuencia `CASE` de `aiSpec` para emitir FDS y código `.scl` / `.L5K` específicos de cada planta.
   - `#/assembler` acepta `.dxf`, `.pdf`, `.png`, `.jpg`, `.jpeg` y `.webp`, muestra progreso en vivo por etapa (`role="status"`, `aria-busy`), vista previa del plano subido dentro del documento FDS y barra de telemetría de tokens/costo/latencia (`tabular-nums`) dentro del cajón técnico.

## Qué funcionó y métricas medidas en vivo (OpenRouter)

- **Prueba en vivo `Vision` (foto real `PILOT PLANT ON SCALE P&ID`, `1024×766` JPG):**
  - `HTTP 200`, `48` nodos reales detectados (`TK-03..TK-13`, `TK-2A/2B`, `PK-01..02`, `P-01..10`, `FV-01..13`, `LT-01..08`, `AT-01..02`), 4 pasos hidrometalúrgicos reales (`Carga de ALS`, `Stripping y Regeneración`, `Filtración y Concentración`, `Disposición de Residuos`) y 5 filas C&E.
  - **Latencia:** `3.47 s` · **Tokens:** `4,271` (`983` prompt + `3,288` completion) · **Costo exacto:** `\$0.00851 USD` (~587 planos por cada `\$5`).
- **Prueba en vivo `Text` (`03_cip_pasteurizer_loop.dxf`):**
  - `HTTP 200`, narrativa real de pasteurización a `72.5 °C` + desvío de flujo + limpieza CIP inyectada en FDS y en `CASE` del `.scl`/`.L5K`.
  - **Latencia:** `3.12 s` · **Tokens:** `2,424` (`1,393` prompt + `1,031` completion) · **Costo exacto:** `\$0.00300 USD` (~1,669 planos por cada `\$5`).
- **Checks locales:** `npm --prefix physics run check`, `npm --prefix web run check` y `npm --prefix web run build` en verde (`exit 0`).

## Qué falló inicialmente y cómo se corrigió

- En la primera prueba en vivo de `Vision` con `response_format: json_object`, `gemini-2.5-flash` entró en un bucle secuencial (`BV1..BV126`) agotando `max_tokens` y truncando el JSON. Se corrigió cambiando a `response_format: json_schema` (`strict: true`), `reasoning: { effort: 'none' }` y regla explícita anti-extrapolación (`<= 38` nodos principales), reduciendo latencia de `30 s` → `3.5 s` y costo de `\$0.021` → `\$0.0085`.
- En la primera salida en vivo, los `stepNumber` `1..4` se acotaban todos a `10` y los acentos en español se eliminaban (`FILTRACIN`). Se corrigió multiplicando `1..9` por `10`, imponiendo orden ascendente único y aplicando `.normalize('NFD')` antes de limpiar identificadores IEC 61131-3.
- Al desplegar en GitHub Actions, `cloudflare/wrangler-action@v3` instaló `wrangler@3.90.0`, cuyo esbuild rechazó `import ... with { type: 'json' }` en `physics/src/pid_schema.js`. Se reemplazó por `ISA_TAG_CATALOG` (JS puro verificado en sincronía con `isa_standard.json` en `check-assembler.mjs`) y se validó localmente con `npx wrangler@3.90.0 pages functions build functions`.

## Próximos pasos

- Configurar `OPENROUTER_API_KEY` en Cloudflare Dashboard → Pages → `tridi` → Settings → Variables and Secrets (Juan) para habilitar `Vision` y enriquecimiento en `https://trytridi.com/api/pid-analyze`.
- Hacer `scripts/ship.sh` una vez Pastor apruebe y validar en vivo con el Ing. José González (`A-1`).
