# Bitácora: Simplificación Comercial de `#/assembler` y Fase 1 P&ID (`.dxf` → FDS + `.csv` I/O + `.scl`/`.L5K`)

- **Persona:** Pastor (`@torpass`)
- **Rama:** `pastor/hardware-catalog-and-lab4`
- **Fecha:** 2026-11-18 04:30

## Qué se hizo

1. **Motor P&ID en `physics/` ([physics/src/pid_assembler.js](../../physics/src/pid_assembler.js), [physics/src/index.js](../../physics/src/index.js), [physics/scripts/check-assembler.mjs](../../physics/scripts/check-assembler.mjs)):**
   - Se amplió `parseDxfPid()` para extraer etiquetas `ISA-5.1` desde entidades reales de AutoCAD (`TEXT`, `MTEXT`, `ATTRIB` además de `INSERT`), deduplicar nodos normalizados y generar enlaces topológicos cuando un `.dxf` trae líneas geométricas sin atributos `from/to` explícitos.
   - Se añadió `generatePlcIoCsv(dag)` para exportar la tabla maestra de entradas/salidas (`PLC I/O Schedule`) en formato `.csv` compatible con Excel, `Siemens TIA Portal` y `Rockwell Studio 5000`.
   - Se adaptó la narrativa `ISA-88` en `generateIsaEngineeringDocs()` para distinguir entre celdas de mezclado gravimétrico (`TK`/`WT`) y líneas de almacenamiento/transporte en silos (`SL`/`SC`/`PK`).
   - Se completaron las definiciones de bloques en `generatePlcFlatFile()`: inclusión de `TYPE "UDT_FormatRecipe"` y `DATA_BLOCK "BatchDB"` en el `.scl` de Siemens, e inclusión de `ADD_ON_INSTRUCTION_DEFINITION FB_Valve_Standard` en el `.L5K` de Rockwell.
2. **Vista Comercial Simplificada en `#/assembler` ([web/src/screens/assembler.js](../../web/src/screens/assembler.js), [web/src/screens/assembler.css](../../web/src/screens/assembler.css), [web/src/screens/strings/assembler.js](../../web/src/screens/strings/assembler.js)):**
   - Se reemplazó el dashboard saturado de 2 columnas por un flujo comercial de **2 pasos con *Progressive Disclosure* (Opción A)**:
     - **Paso 1 (Vista de Entrada Limpia):** una sola tarjeta centrada con Dropzone para arrastrar o seleccionar el archivo `.dxf`, campo opcional de objetivo del proceso y 2 botones de ejemplo en 1 clic (`01_batch_mixer.dxf`, `02_silo_packaging.dxf`).
     - **Paso 2 (Hoja Ejecutiva de Ingeniería `ISA-5.1`):** muestra en primer plano la especificación funcional completa (Objetivo, Cédula de Equipos `ISA-5.1`, Filosofía de Operación `ISA-88` y Matriz Causa-Efecto) con botones directos para descargar `.md`, descargar tabla I/O en `.csv` (Excel), imprimir/guardar en PDF (`@media print`) y abrir la simulación 3D.
     - **Acordeón Técnico Opcional (`<details>` cerrado por defecto):** agrupa la tabla de direcciones crudas del PLC (`%I0.0`, `%Q0.0`, `%IW64`), el código PLC (`.scl` / `.L5K`), el esquema 2D con inyección de fallas y el XML de MuJoCo para que solo se desplieguen cuando el usuario quiera ver el detalle técnico.

## Qué funcionó y decisiones

- Todas las suites de verificación (`npm --prefix physics run check`, `npm --prefix web run check` con `605` llaves bilingües ES/EN y `npm --prefix web run build`) pasaron con `0` errores.
- El ticker de simulación 2D ahora solo corre cuando el usuario abre explícitamente la pestaña de esquema 2D dentro del acordeón técnico, eliminando distracciones visuales y consumo innecesario mientras se lee la documentación ejecutiva.

## Qué sigue

- **Actualización (Motor In-House Opción 1 para `.dxf`, `.pdf` e imágenes `.jpg/.png` + Geometría 2D `AC1009`):**
  - Se actualizaron los planos en `data/pid_samples/*.dxf` (`01` a `06`) al estándar estricto **AutoCAD R12 (`AC1009`)** con geometría 2D completa (`LINE`, `CIRCLE`, `TEXT`, borde de lámina, cajetín y `$EXTMIN`/`$EXTMAX`) para que se visualicen en visores CAD externos como ShareCAD y LibreCAD.
  - Se amplió `isa_standard.json` (`AT` Analizador de pH/Conductividad y `FT` Caudalímetro) y se implementó el normalizador de alias reales de planta (`TANK <N>`, `BV<N>`, `PP<N>`, `AOD<N>`, `FILTER PRESS <N>`, `SIR <N>` y notas al pie de sensores de nivel y pH).
  - Se implementaron `extractTextFromPdfBytes()`, `convertNodesToStrictDxf()` y `extractBlueprintFromUpload()` en `physics/src/pid_assembler.js` para procesar archivos `.dxf` y `.pdf` vectoriales 100 % en el navegador sin APIs de terceros ni fallbacks fijos (removiendo `.jpg`/`.png` y mostrando un aviso claro si un `.pdf` viene escaneado sin texto CAD seleccionable).
  - Se corrigió el centrado y el contraste del botón principal en `.asm-dropzone` (`web/src/screens/assembler.css`), evitando que `.asm-dropzone span` sobrescribiera el `<span class="t">` de `i18n.js` dentro de `<strong>` y cambiando el relleno verde fluorescente por un botón de alto contraste (`#f1f3ee` con texto `#08090b`), además de fijar `grid-template-columns: minmax(0, 1fr)` en `.asm-drop-card` para que las píldoras largas con `white-space` nunca desborden el borde derecho de la tarjeta.
- Fase 2 (`P-6`): modularizar `pid_assembler.js` y construir el generador 3D de procesos en MuJoCo (layout real desde el grafo y caso de 22 silos → 6 empaquetadoras).
