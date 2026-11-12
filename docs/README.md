# Guía de Documentación de Tridi (`docs/`)

> **¿No sabes qué archivo leer?** Empieza aquí. Todo lo **activo de hoy** está en la tabla 1; los documentos de versiones anteriores o del hackathon están separados abajo o archivados en `docs/archive/`.

---

## 🟢 1. Documentos Activos (Lo que debes leer hoy)

| Documento | Para quién es | Qué encontrarás adentro |
| --- | --- | --- |
| **[`ROADMAP.md`](ROADMAP.md)** | **Todo el equipo (humanos)** | **EMPIEZA AQUÍ:** Visión actual de Tridi (Video a Robot + Hardware Assembler), explicación clara de cómo entrenamos el robot de Luigi, quiénes son nuestros clientes paso a paso y la **tabla de tareas abiertas** (`J-*`, `P-*`, `C-*`, `A-*`). |
| **[`internal/eventos-y-casos-reales.md`](internal/eventos-y-casos-reales.md)** | **Todo el equipo** | **REGISTRO DE CAMPO Y REUNIONES:** Resumen ejecutivo en un solo lugar de (1) la reunión y éxito Sim-to-Real con **Luigi D'Aquaro** (`luigi_lab3` y `luigi_lab4`) y (2) la preparación y validación industrial con **Ing. José González (`ZAKA, C.A.`)**. |
| **[`internal/preparacion-reunion-zaka-y-claridad-producto.md`](internal/preparacion-reunion-zaka-y-claridad-producto.md)** | **Todo el equipo** | Radiografía completa de **ZAKA, C.A.** (`zakasys.com`), respuestas a todas las dudas de producto/UX de la web, aprendizajes de Elon Musk sobre Optimus y guion de preguntas de validación industrial. |
| **[`decisiones/2026-11-07-primer-sim-to-real-luigi.md`](decisiones/2026-11-07-primer-sim-to-real-luigi.md)** | **Todo el equipo** | Caso de estudio técnico completo del primer Sim-to-Real físico en el robot de Luigi (`luigi_lab3`): los 5 problemas reales de hardware que encontramos (`pulseIn()`, chip clon `0x9E`, zona muerta PWM, 2 KB RAM) y cómo los resolvimos a 50 Hz. |
| **[`plan-v3-assembler.md`](plan-v3-assembler.md)** | **Equipo técnico (Juan, Pastor, César)** | Diseño detallado del **Tridi Hardware Assembler (`#/assembler`)** y especificaciones técnicas del nuevo robot con cuello servo (`luigi_lab4`). |
| **[`marca.md`](marca.md) y [`pitch/manual-de-marca-tridi.pdf`](pitch/manual-de-marca-tridi.pdf)** | **Todo el equipo** | **Manual de Marca Oficial (Noviembre 2026, 25 páginas):** Identidad visual (`#08090B` Grafito, `#C8FF2E` Señal, `#F1F3EE` Tinta, tipografías `Inter Tight` + `Geist Mono`), símbolo 3D y usos correctos. El pitch deck oficial está en [`pitch/tridi-pitch.pdf`](pitch/tridi-pitch.pdf). |
| **[`internal/README.md`](internal/README.md)** | **Equipo y sus agentes de IA** | Índice de manuales técnicos internos: infraestructura de **`trytridi.com`** en Cloudflare Pages ([`infra-and-security.md`](internal/infra-and-security.md)), arquitectura de Captura 2.0 + Sim-to-Real ([`architecture-and-sim2real.md`](internal/architecture-and-sim2real.md)) y las respuestas exactas enviadas a YC W27 ([`yc-w27-reference.md`](internal/yc-w27-reference.md)). |
| **[`contrato.md`](contrato.md)** | **Juan, Pastor, César** | Formatos JSON y esquemas que comparten `data/`, `physics/`, `training/` y `web/` (`PoseClip` v2, `RobotMotion`, API del servidor de video). |
| **[`audit-playbook.md`](audit-playbook.md)** | **Juan, Pastor, César** | Checklist de calidad visual, UX y física que corremos antes de desplegar cambios en `web/` o `physics/`. |
| **[`estado.md`](estado.md)** | **Agentes y equipo** | Resumen del estado actual por persona (Pastor, Juan, César, Ale). |

---

## 📦 2. Archivo Histórico (Hackathon y Versiones Anteriores — Solo consulta)

Estos archivos se conservan por trazabilidad del código y como registro de cómo evolucionó el proyecto, pero **no hace falta leerlos para trabajar hoy**:

- **[`plan-v2.md`](plan-v2.md):** El plan que ejecutamos entre el 3 y el 8 de noviembre de 2026 (Captura 2.0 con `GVHMR + WiLoR`, manos de 5 dedos, las 9 políticas de imitación, selector H1/G1, taza con agua). **100 % completado y en producción.**
- **[`bitacora/`](bitacora):** Registro cronológico sesión por sesión desde el 23 de octubre de 2026.
- **[`pitch/`](pitch):** Contiene el pitch deck oficial ([`tridi-pitch.pdf`](pitch/tridi-pitch.pdf)), el manual de marca oficial ([`manual-de-marca-tridi.pdf`](pitch/manual-de-marca-tridi.pdf)) y los textos de referencia de Platanus Hack 26 (`pitch-producto.md`, `diferencia.md`, `interrogatorio.md`). *(El borrador viejo `pitch/deck/tridi-deck.*` fue eliminado para evitar ruido).*
- **[`archive/`](archive), [`plan-producto.md`](plan-producto.md), [`preguntas-abiertas.md`](preguntas-abiertas.md) e [`investigacion/`](investigacion):** Notas técnicas iniciales de octubre de 2026 y archivos ya superados (`archive/robots-fisicos.md`, `archive/videos-para-datos.txt`, `archive/grabacion/`).
