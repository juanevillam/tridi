# Guía de Documentación de Tridi (`docs/`)

> **¿No sabes qué archivo leer?** Empieza aquí. Esta carpeta tiene tanto los documentos **activos de hoy** como el **archivo histórico** de cuando nació Tridi en Platanus Hack 26.

---

## 🟢 1. Documentos Activos (Lo que debes leer hoy)

| Documento | Para quién es | Qué encontrarás adentro |
| --- | --- | --- |
| **[`ROADMAP.md`](ROADMAP.md)** | **Todo el equipo (humanos)** | **EMPIEZA AQUÍ:** Visión actual de Tridi (Video a Robot + Hardware Assembler), explicación clara de cómo entrenamos el robot de Luigi, quiénes son nuestros clientes paso a paso y la **tabla de tareas abiertas** para dividirnos el trabajo. |
| **[`plan-v3-assembler.md`](plan-v3-assembler.md)** | **Equipo técnico (Juan, Pastor, César)** | Diseño detallado del **Tridi Hardware Assembler (`#/assembler`)** y especificaciones técnicas del nuevo robot con cuello servo (`luigi_lab4`). |
| **[`internal/README.md`](internal/README.md)** | **Equipo y sus agentes de IA** | Manuales técnicos internos: infraestructura de **`trytridi.com`** en Cloudflare Pages ([`infra-and-security.md`](internal/infra-and-security.md)), arquitectura de Captura 2.0 + Sim-to-Real ([`architecture-and-sim2real.md`](internal/architecture-and-sim2real.md)) y las respuestas exactas enviadas a YC W27 ([`yc-w27-reference.md`](internal/yc-w27-reference.md)). |
| **[`decisiones/2026-11-07-primer-sim-to-real-luigi.md`](decisiones/2026-11-07-primer-sim-to-real-luigi.md)** | **Todo el equipo** | Caso de estudio completo del primer Sim-to-Real físico en el robot de Luigi (`luigi_lab3`): los 4 problemas reales de hardware que encontramos y cómo los resolvimos a 50 Hz. |
| **[`contrato.md`](contrato.md)** | **Juan, Pastor, César** | Formatos JSON y esquemas que comparten `data/`, `physics/`, `training/` y `web/` (`PoseClip` v2, `RobotMotion`, API del servidor de video). |
| **[`audit-playbook.md`](audit-playbook.md)** | **Juan, Pastor, César** | Checklist de calidad visual, UX y física que corremos antes de desplegar cambios en `web/` o `physics/`. |
| **[`estado.md`](estado.md)** | **Agentes y equipo** | Resumen del estado actual por persona (Pastor, Juan, César, Ale). |

---

## 📦 2. Archivo Histórico (Hackathon y Versiones Anteriores — Solo consulta)

Estos archivos se conservan como registro de cómo evolucionó el proyecto, pero **no hace falta leerlos para trabajar en los siguientes pasos**:

- **[`plan-v2.md`](plan-v2.md) y [`robots-fisicos.md`](robots-fisicos.md):** El plan que ejecutamos entre el 3 y el 8 de noviembre de 2026 (Captura 2.0 con `GVHMR + WiLoR`, manos de 5 dedos, las 9 políticas de imitación, selector H1/G1, taza con agua y preparación para el robot de Luigi). **Ya está 100 % completado y en producción.**
- **[`bitacora/`](bitacora):** Registro cronológico sesión por sesión desde el 23 de octubre de 2026.
- **[`pitch/`](pitch) y [`marca.md`](marca.md):** El deck, guiones de 1 y 3 minutos y guía de estilo originales de Platanus Hack 26 Caracas (23–25 de octubre de 2026).
- **[`plan-producto.md`](plan-producto.md), [`preguntas-abiertas.md`](preguntas-abiertas.md), [`grabacion/`](grabacion) e [`investigacion/`](investigacion):** Notas técnicas iniciales de la primera semana.
