# Documentación Técnica Interna — Tridi (`juanevillam/tridi`)

> **CONFIDENCIAL / USO INTERNO DEL EQUIPO (`juanevillam/tridi`)**
> Manual de ingeniería, infraestructura, seguridad, arquitectura Sim-to-Real y referencia de Y Combinator Winter 2027.
> Diseñado para que cualquier miembro del equipo (**Juan, Pastor, César, Ale**) o sus agentes de IA (Claude Code, Antigravity, Cursor) puedan consultar cómo funciona cada pieza en producción sin depender de preguntas manuales.

---

## 1. Índice de Manuales Técnicos Internos

| Manual | Superficie / Alcance | Ruta |
| :--- | :--- | :--- |
| **1. Infraestructura, Dominio (`trytridi.com`), Cloudflare Pages, CI/CD y Seguridad** | Namecheap (`DNSSEC`), Cloudflare (`Account ID`, `Zone ID`, DNS `CNAME`, blindaje de correo `SPF`/`DMARC` + plantilla para Google Workspace, SSL/TLS `Full (strict)`, HSTS Preload en el borde, Redirect Rule `301` de `www` → apex preservando `?api=` y `?lang=`, `security.txt`, AI Labyrinth, Turnstile `Managed`), Cloudflare Pages (`tridi-18p.pages.dev`), GitHub Actions (`.github/workflows/deploy.yml`), y blindaje del servidor de video en la Mac (`data/serve.sh`, `data/server.py`, Gist de descubrimiento y rate-limiting por IP). | [`docs/internal/infra-and-security.md`](infra-and-security.md) |
| **2. Arquitectura del Producto, Captura 2.0, Web y Caso Real Sim-to-Real (`luigi_lab3`)** | Pipeline completo end-to-end: Captura 2.0 (`GVHMR + WiLoR` → `PoseClip` v2 con SMPL-X y manos de 21 puntos), retargeting IK + manos de 5 dedos (`physics/`), entrenamiento PPO y políticas ONNX (`training/`), caso de estudio físico Sim-to-Real en hardware real (`luigi_lab3` en Arduino UNO ATmega328P a 50 Hz + gemelo digital MuJoCo con rayos `HC-SR04`/`APDS-9960`), pantallas de la web (`#/`, `#/milestones`, `#/simulations`, `#/simulations/luigi_lab3`, `#/delivery`), i18n in-place ES/EN y playbook de auditoría (`/tridi-craft-audit`, `/tridi-release-audit`). | [`docs/internal/architecture-and-sim2real.md`](architecture-and-sim2real.md) |
| **3. Referencia de Aplicación a Y Combinator Winter 2027 (`yc/`)** | Estado de la aplicación enviada a YC W27 (deadline 2 de noviembre de 2026, decisiones hasta el 11 de diciembre de 2026), respuestas exactas enviadas en el formulario y perfiles de los 4 cofundadores (`25%` c/u), mapa de archivos en `yc/` y preparación de entrevista. | [`docs/internal/yc-w27-reference.md`](yc-w27-reference.md) |
| **4. Plan v3 — Tridi Hardware Assembler y Caso `luigi_lab4`** | Siguientes pasos del producto: ensamblador self-serve en la web (subir CAD `.stl`/`.step` + código opcional → reconocimiento de piezas y catálogo de componentes → gemelo digital en MuJoCo → exportación dual ONNX + firmware nativo no bloqueante) y archivos de `physics/models/luigi_lab4/`. | [`docs/plan-v3-assembler.md`](../plan-v3-assembler.md) |

---

## 2. Equipo y Áreas de Responsabilidad

| Persona | Rol | GitHub | Áreas / Carpetas |
| :--- | :--- | :--- | :--- |
| **Juan Villa** | **CTO** · Data, Training, Infraestructura, Seguridad y Web | `@juanevillam` | `data/`, `training/`, `web/`, `.github/`, `scripts/` |
| **Pastor Jiménez** | Física (MuJoCo), Retargeting, Render 3D y Entrenamiento | `@torpass` | `physics/`, `training/` |
| **César Martínez** | Experiencia Web y Simulación en el Navegador | `@cisorm` | `web/` |
| **Ale Hernández** | Estrategia, Pitch, Ventas, Clientes y Aplicación YC | `@alehernandezt` | `docs/`, `yc/` |

---

## 3. Cómo deben usar esta documentación los miembros del equipo y sus agentes

Si eres **Pastor, César o Ale** y quieres saber cómo funciona el nuevo despliegue en `https://trytridi.com`, cómo correr una auditoría visual antes de hacer merge, qué cambió en el simulador de `luigi_lab3` o qué dijimos en la aplicación de YC, **pídele directamente a tu agente de código**:

- *"Lee `docs/internal/README.md` y `docs/internal/infra-and-security.md` para explicarme cómo funciona el deploy automático a `trytridi.com` y las reglas de seguridad de Cloudflare."*
- *"Lee `docs/internal/architecture-and-sim2real.md` y `docs/audit-playbook.md` antes de modificar `web/` o `physics/` y corre los checks obligatorios."*
- *"Lee `docs/internal/yc-w27-reference.md` y `yc/aplicacion.md` para repasar las respuestas que dimos a YC W27 y lo que avanzamos desde el envío."*
