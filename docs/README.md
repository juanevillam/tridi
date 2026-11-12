# Guía de Documentación de Tridi (`docs/`)

> **¿No sabes qué archivo leer?** Empieza aquí. Todo lo activo hoy está en la sección 1; lo histórico del hackathon quedó separado abajo.

---

## 🟢 1. Documentos Activos (Lo que lee el equipo hoy)

| Documento | Para quién | Qué tiene |
| --- | --- | --- |
| **[`ROADMAP.md`](ROADMAP.md)** | **Todo el equipo** | **EMPIEZA AQUÍ:** Visión actual de Tridi (Video a Robot + Hardware Assembler), resumen del caso de Luigi y tabla de tareas por persona (`J-*`, `P-*`, `C-*`, `A-*`). |
| **[`internal/reunion-zaka.md`](internal/reunion-zaka.md)** | **Todo el equipo** | **Reunión con Ing. José González (ZAKA, C.A.):** Quién es ZAKA, postura de aliados (cero competencia), qué mostrar en 3 minutos y las 4 preguntas de validación dura. |
| **[`decisiones/2026-11-07-primer-sim-to-real-luigi.md`](decisiones/2026-11-07-primer-sim-to-real-luigi.md)** | **Todo el equipo** | **Caso Real #1 — Robot de Luigi (`luigi_lab3`):** Qué pasó en la reunión, los 5 fallos físicos reales del hardware (`pulseIn()`, chip clon `0x9E`, zona muerta PWM, 2 KB RAM) y cómo los resolvimos a 50 Hz. |
| **[`plan-v3-assembler.md`](plan-v3-assembler.md)** | **Juan, Pastor, César** | Diseño del **Tridi Hardware Assembler (`#/assembler`)** y especificaciones del `Rover Luigi v2` (`luigi_lab4`). |
| **[`marca.md`](marca.md) y [`pitch/manual-de-marca-tridi.pdf`](pitch/manual-de-marca-tridi.pdf)** | **Todo el equipo** | **Manual de Marca Oficial (Nov 2026, 25 págs):** Colores (`#08090B` Grafito, `#C8FF2E` Señal, `#F1F3EE` Tinta), tipografías (`Inter Tight` + `Geist Mono`) y símbolo 3D. El pitch deck está en [`pitch/tridi-pitch.pdf`](pitch/tridi-pitch.pdf). |
| **[`internal/README.md`](internal/README.md)** | **Equipo y agentes** | Manuales técnicos: infraestructura en Cloudflare Pages ([`infra-and-security.md`](internal/infra-and-security.md)), arquitectura Sim-to-Real ([`architecture-and-sim2real.md`](internal/architecture-and-sim2real.md)) y aplicación enviada a YC W27 ([`yc-w27-reference.md`](internal/yc-w27-reference.md)). |
| **[`contrato.md`](contrato.md)** | **Juan, Pastor, César** | Esquemas JSON compartidos entre `data/`, `physics/`, `training/` y `web/` (`PoseClip` v2, `RobotMotion`, API de video). |
| **[`audit-playbook.md`](audit-playbook.md)** | **Juan, Pastor, César** | Checklist de calidad visual, UX y física antes de desplegar cambios en `web/` o `physics/`. |
| **[`estado.md`](estado.md)** | **Equipo y agentes** | Estado actual al día de hoy por integrante (Pastor, Juan, César, Ale). |

---

## 📦 2. Archivo Histórico (Hackathon y Versiones Anteriores — Solo consulta)

Se conservan como historial del repositorio, pero **no hace falta leerlos para el trabajo actual**:

- **[`plan-v2.md`](plan-v2.md):** Plan ejecutado del 3 al 8 de noviembre (Captura 2.0 `GVHMR + WiLoR`, manos de 5 dedos, 9 políticas de imitación, selector H1/G1, taza con agua). **100 % completado.**
- **[`bitacora/`](bitacora):** Registro sesión por sesión desde el 23 de octubre de 2026.
- **[`pitch/`](pitch):** Textos y guiones originales de Platanus Hack 26 Caracas.
- **[`archive/`](archive), [`plan-producto.md`](plan-producto.md), [`preguntas-abiertas.md`](preguntas-abiertas.md) e [`investigacion/`](investigacion):** Notas técnicas iniciales de octubre de 2026.
