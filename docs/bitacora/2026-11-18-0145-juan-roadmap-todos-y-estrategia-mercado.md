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
- **Actualización (01:55):** Reescrito y ampliado [`docs/plan-ventas-y-comunidades.md`](../plan-ventas-y-comunidades.md) como plan completo B2B sobre las 3 verticales en producción (1. Matriz de comercialización por vertical, 2. Entrada "Show & Ask" en comunidades de Venezuela y foros online `r/PLC`, `PLCTalk`, `LeRobot`, `Unitree`, 3. Estrategia operativa de LinkedIn para Tridi y los 4 co-founders con 4 pilares de video y rutina diaria de conexiones, 4. Guiones exactos de Cold Email para labs con G1/rovers, startups de datos de YC e integradores industriales, 5. Fuentes abiertas de contactos en GitHub/ArXiv/CSIA/Rockwell, y 6. Plan de ejecución de 7 días).
