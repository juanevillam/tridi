---
sesion: 2026-11-18-0145-juan-roadmap-todos-y-estrategia-mercado
persona: juan
fecha: 2026-11-18
rama: juan/roadmap-y-mercado
---

# Bitácora — Limpieza de `ROADMAP.md` (Solo To-Dos) y Revisión de Estrategia de Mercado (`plan-ventas-y-comunidades.md`)

## Qué se hizo

1. **Sincronización con `origin/main`:**
   - Tu copia local de `main` estaba 4 commits atrás de `origin/main` (faltaba el merge de `juan/zaka-industrial-plan` con las 3 verticales definitivas, el P&ID Assembler y [`docs/plan-ventas-y-comunidades.md`](../plan-ventas-y-comunidades.md)). Se hizo `git pull --ff-only origin main` y se creó la rama `juan/roadmap-y-mercado`.
2. **Actualización de [`docs/ROADMAP.md`](../ROADMAP.md) y [`docs/estado.md`](../estado.md):**
   - Mantenidas las **3 verticales en producción**:
     - **Vertical 1:** Robótica Humanoide (`Unitree G1` / `H1`).
     - **Vertical 2:** Rovers Autónomos y Mecatrónica (`luigi_lab3` / `luigi_lab4`).
     - **Vertical 3:** Plantas Industriales y Celdas PLC (`factory_cell` / `P&ID .dxf`).
   - Eliminadas todas las tareas completadas (`[x]`) de [`docs/ROADMAP.md`](../ROADMAP.md), dejando **exclusivamente los to-dos activos** alineados con el acuerdo del equipo:
     - **Juan (`J-1`, `J-2`):** Iterar y ejecutar la estrategia de mercado, comunidades (Venezuela y global), LinkedIn de Tridi y contacto a laboratorios de robótica e integradoras industriales.
     - **Pastor (`P-1`, `P-2`):** Rediseñar la interfaz del `Tridi Assembler` (`#/assembler`) para hacerla menos técnica como él la imagina + simulación multi-silo (22 silos → 6 empaquetadoras).
     - **César (`C-1`):** Editor visual de tags ISA 2D ↔ 3D en `#/assembler`.
     - **Ale (`A-1`, `A-2`):** Segunda sesión en vivo con el Ing. José González (ZAKA) + ejecución semanal de prospección B2B.

## Qué sigue

- Iterar con Juan los cambios y acciones concretas sobre [`docs/plan-ventas-y-comunidades.md`](../plan-ventas-y-comunidades.md) (comunidades en Venezuela, LinkedIn de Tridi, foros de automatistas y correos a labs de robótica).
- **Actualización (08:22) — Sync con el rediseño comercial de `#/assembler` de Pastor (`origin/main` `aaedfbd`) y transcripción de los 2 audios de WhatsApp:**
  1. **Rebase sobre `origin/main` (`aaedfbd`):** Incorporados los 5 commits de Pastor (flujo comercial de 2 pasos *"Subir plano → Recibir documento"* en `#/assembler` con impresión PDF, descarga de tabla I/O en `.csv` Excel, acordeón técnico desplegable abajo, soporte para `.dxf` `AC1009` + `.pdf` vectorial, 16 clases `ISA-5.1` y normalizador flexible de alias no estrictos como `TANK`, `BV`, `PP`, `AOD`, `FILTER PRESS`, `SIR`, `MT`/`M`).
  2. **Transcripción local con Whisper (`~/.local/bin/transcribir`) de los 2 audios de Pastor en `~/Downloads/Transcripciones/`:**
     - `WhatsApp Ptt 2026-11-18 at 8.02.16 AM.txt`: Explica que se enfocó en reconocer `.dxf` y `.pdf` contra nuestro catálogo de estructuras para generar el documento de qué hace cada pieza y el proceso de instalación; como vio que muchos planos reales en internet no siguen al 100 % la norma ISO/ISA (a diferencia de lo estricto que decía el Sr. José), flexibilizó el catálogo para reconocer variaciones (ej. si un motor viene como `MTO`, `MT`, `M` o `HK`). Su próximo paso al llegar del trabajo es **hacer lo mismo con imágenes (`.png`/`.jpg`)**.
     - `WhatsApp Ptt 2026-11-18 at 8.03.38 AM.txt`: Plantea el siguiente reto técnico y de negocio: además de leer imágenes, meter **detección inteligente híbrida (modelo de visión + modelo de lenguaje vía API / OpenRouter)** donde parte se procese internamente y parte por API para armar el PDF de documentación de forma aún más dinámica, y de ahí sacar el modelo 3D y el código PLC (Rockwell, etc.). Destaca que **hay que calcular con mucho cuidado el costo y número de llamadas al modelo por plano** antes de meterlo.
  3. **Sincronización de [`docs/ROADMAP.md`](../ROADMAP.md), [`docs/estado.md`](../estado.md), [`docs/plan-ventas-y-comunidades.md`](../plan-ventas-y-comunidades.md) y [`CONTEXT.md`](../../CONTEXT.md):** Actualizado `P-1` de Pastor en `ROADMAP.md` con el reto de imágenes + detección inteligente VLM/LLM acotada en costos, y reflejado el nuevo flujo de `#/assembler` (PDF + `.csv` Excel + `.dxf`/`.pdf`) en el discurso comercial para integradores.
