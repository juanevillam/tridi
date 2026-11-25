# Bitácora — Soporte para PDFs Escaneados + Diagrama 2D P&ID Dinámico con Resaltado Bidireccional de Tags

- **Fecha:** 2026-11-25
- **Persona:** Pastor (`@torpass`)
- **Rama:** `pastor/hardware-catalog-and-lab4`
- **Tareas de Roadmap:** Punto 2 (`P-1` — PDFs escaneados → Vision automático) y Punto 3 (`C-1` — Diagrama 2D dinámico del plano subido + clic en tag)

## Qué se hizo

1. **Soporte completo para PDFs escaneados y multipágina (`web/src/pdf-render.js`, `physics/src/pid_assembler.js`):**
   - Se instaló `pdfjs-dist` en `web/` con carga estrictamente bajo demanda (`import('../pdf-render.js')`), generando chunks separados (`pdf-render`: `1.38 kB`, `pdf`: `444 kB`, `pdf.worker.min.mjs`: `1.2 MB`) que añaden **0 bytes al First Paint** de `#/` y de los flujos vectoriales `.dxf`/`.pdf`.
   - Cuando `extractBlueprintFromUpload()` detecta que un `.pdf` tiene `0` etiquetas CAD seleccionables (plano escaneado o fuentes `.shx` trazadas en AutoCAD), rasteriza la página en `<canvas>` sobre fondo blanco (`<= 1600 px`, JPEG `0.86`) y la envía en `1` sola llamada acotada a `/api/pid-analyze` (`mode: 'vision'`).
   - Se añadió `extractEmbeddedJpegFromPdfBytes()` sin dependencias externas en `physics/src/pid_assembler.js` como respaldo para PDFs escaneados con streams `/DCTDecode` (útil también en pruebas headless Node).
   - Se agregó selector compacto de páginas (`PDF Page 1/N`) en `#/assembler` cuando el PDF subido tiene múltiples páginas, permitiendo re-analizar la página 2..N en 1 clic si la página 1 es carátula.

2. **Motor determinista de Esquema 2D P&ID ANSI/ISA-5.1 (`physics/src/pid_diagram.js`):**
   - Reemplazó el SVG genérico fijo de 1 tanque por `buildPidDiagramLayout(dag)` + `renderPidSchematicSvg(dag, opts)`.
   - Usa coordenadas reales del plano (DXF o Vision) con relajación determinista anti-solapamiento (48 iteraciones) y altura adaptativa (`380..640 px` según número de tags), o layout de 5 carriles de proceso (*swimlanes* izquierda → derecha) cuando el archivo de origen no trae coordenadas (`PID_AUTO`).
   - Dibuja simbología vectorial real ANSI/ISA-5.1 por prefijo (`TK` tanque con cabezales, `SL` silo con tolva cónica, `FV` válvula corbatín con actuador, `P` bomba con descarga, `M` motor, `SC`/`CV` transportador, `PK` estación empacadora/filtro prensa, burbujas ISA para `WT`/`LT`/`PT`/`TT`/`FT`/`AT` y enclavamientos `LSH`/`LSL`) + tuberías ortogonales Manhattan con flechas direccionales.

3. **Resaltado bidireccional de tags e Inspector PLC en `#/assembler` (`web/src/screens/assembler.js`, `assembler.css`, `strings/assembler.js`):**
   - La pestaña `I/O Schedule` ahora incluye la vista previa 2D sincronizada + tarjeta **Tag Inspector** (función ISA-5.1, bloque PLC, fail-safe, conexiones *Upstream/Downstream* clicables y direcciones `%I/%Q/%IW`).
   - Hacer clic en un tag en la tabla de equipos, en la tabla `I/O Schedule` o directamente en el SVG (ratón o teclado `Enter`/`Space`) resalta el nodo, ilumina sus tuberías conectadas en `--signal` (`#c8ff2e`), atenúa el resto y sincroniza las filas correspondientes.
   - La pestaña `Esquema 2D y Fallas` usa los pasos reales de secuencia (`aiSpec.plcSequenceSteps` o `controlNarrative`) y tags reales de sensor/motor de *esta* planta, actualizando las clases del SVG in-place sin destruir el foco de teclado y respetando `prefers-reduced-motion: reduce`.

## Verificación

- `npm --prefix physics run check` (incluyendo pruebas unitarias nuevas en `check-assembler.mjs` para PDF escaneado sintético, layout por coordenadas y swimlanes en 12..37 nodos y marcado de selección/fallas SVG).
- `npm --prefix web run check` (`717` claves bilingües ES/EN, `481` lookups resueltos) y `npm --prefix web run build` (`vite build` en verde con chunks lazy de `pdfjs-dist`).
- `wrangler@3.90.0 pages functions build functions` en verde.

- **Ajuste UX tras revisión visual:** Se promovió el **Esquema P&ID 2D Interactivo + HUD + Tag Inspector + botones de falla** al primer bloque visible de Step 2 (justo debajo de la barra superior y por encima de la documentación ejecutiva FDS), eliminando duplicación en el cajón técnico (que queda con 3 pestañas limpias: I/O, Código PLC y XML 3D). Se corrigió el espaciado vertical en `pid_diagram.js` (`minGapY: 74`) para evitar roce entre sensores superiores (`LT`/`LSH`) y silos (`SL`), y se fijó `min-height: 28px` en `.asm-tag-btn` para que no herede el `52px` global de `button` en `style.css`.

## Próximos pasos

- Configurar `OPENROUTER_API_KEY` en Cloudflare Pages (`tridi`) con Juan + *Retry deployment* para activar `Vision` (fotos + PDFs escaneados) en `https://trytridi.com/#/assembler`.
- Punto 4 (`P-2`): conectar "Ver Celda en 3D" al XML MuJoCo compilado del plano subido + layout real de 22 silos → 6 empaquetadoras.
