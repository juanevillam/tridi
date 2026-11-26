# Documentación de Tridi (`juanevillam/tridi`)

> **Estándar de Documentación en 2 Capas (Noviembre 2026):**
> 1. **Capa 1 — Punto de Entrada Humano, Estrategia y Estado Ejecutivo (`docs/README.md`, `docs/ROADMAP.md`, `docs/estado.md`):** Pensada para que **Juan, Pastor, César y Ale** entiendan en 3 minutos dónde está cada vertical de Tridi en producción (`trytridi.com`), cómo se conectan los 4 módulos (`data/`, `physics/`, `training/`, `web/`) y cuál es el tablero de tareas activo.
> 2. **Capa 2 — Manuales de Ingeniería Profundos (`docs/architecture-and-sim2real.md`, `docs/infra-and-security.md`, `docs/contrato.md`):** Especificaciones técnicas exhaustivas (ecuaciones, esquemas JSON, pines de hardware, compiladores `ONNX → C99` y `P&ID .dxf → ISA-5.1 + 3D + PLC`, DNS/SSL/WAF en Cloudflare y auditorías).
> 3. **Archivo de Reuniones, Identidad Visual y Fuentes Raw (`docs/pitch/`, `docs/reuniones/`, `docs/bitacora/`):** Respaldo permanente en el repo de los archivos originales de contexto general (manual de marca hecho por **José Alejandro**, pitch deck de **Platanus Hack 26**, grabación de audio `.m4a` y transcripción íntegra `.txt` de la reunión con **ZAKA**, bitácoras y planes históricos) para que nunca se pierdan y todo el equipo los tenga a mano.

---

## 🟢 1. Documentos Activos (Lo que debes leer hoy)

| Documento | Para quién es | Qué encontrarás adentro |
| :--- | :--- | :--- |
| **[`ROADMAP.md`](ROADMAP.md)** | **Todo el equipo (Juan, Pastor, César, Ale)** *(Leer primero)* | Resumen ejecutivo de 3 minutos, reglas de oro de las **3 verticales activas sobre 1 motor físico**, tabla de superficies en producción (`trytridi.com`), diagrama ASCII de arquitectura y tablero de tareas por integrante (`J-*`, `P-*`, `C-*`, `A-*`). |
| **[`plan-vertical-electronics.md`](plan-vertical-electronics.md)** | **Producto e Ingeniería (Archivado / Futuro)** | Contexto completo de la futura vertical **Tridi Electronics** (referencia Orbe de Pastor, catálogo `catalog.json`, requisitos del solver eléctrico y estándar visual de la landing) guardado hasta construir el motor eléctrico. |
| **[`estado.md`](estado.md)** | **Todo el equipo** | Qué funciona hoy en cada módulo (`data/`, `physics/`, `training/`, `web/`), métricas reales medidas y comandos de verificación rápida. |
| **[`plan-v4-industrial-y-verticales.md`](plan-v4-industrial-y-verticales.md)** | **Todo el equipo** | **Plan Maestro v4:** Cómo el principio *"la IA razona y el código ensambla"* (`mus3o`) y las conclusiones de ZAKA se traducen en nuestras 3 verticales (Humanoides, Robots/Mecatrónica y Plantas Industriales P&ID). |
| **[`plan-ventas-y-comunidades.md`](plan-ventas-y-comunidades.md)** | **Todo el equipo (Juan, Pastor, César, Ale)** | **Plan GTM de Ventas, Adquisición y Comunidades ("De menos a más"):** Escalera comercial de 3 escalones (integradores PLC → OEMs → robótica Sim-to-Real), mapa exacto de comunidades (`r/PLC`, `r/robotics`, Discord de LeRobot/Unitree/PLC, PLCTalk), directorios B2B (`CSIA`, `A3`, Siemens/Rockwell Partners), ferias y playbook semanal de prospección. |
| **[`architecture-and-sim2real.md`](architecture-and-sim2real.md)** | **Ingeniería (Juan, Pastor, César) y Agentes IA** | **Manual Técnico Capa 2 — Producto y Sim-to-Real:** Captura 2.0 (`GVHMR + WiLoR`), retargeting MuJoCo, políticas PPO ONNX, compilador `ONNX → C99 / Arduino (.ino)`, pipeline `P&ID (.dxf) → Docs ISA-5.1 + 3D + PLC (.scl / .L5K)` y escenarios 3D con tags en vivo. |
| **[`infra-and-security.md`](infra-and-security.md)** | **CTO (Juan) y Agentes IA** | **Manual Técnico Capa 2 — Infraestructura y Seguridad:** Dominio `trytridi.com` (Namecheap + Cloudflare Zone `ad0e73bb012d34db1af27f64cbace539`), DNS, SSL Strict, HSTS, anti-spoofing (`SPF`/`DMARC`), WAF, CI/CD a Cloudflare Pages y túnel del servidor de video. |
| **[`contrato.md`](contrato.md)** | **Ingeniería (`data/`, `physics/`, `training/`, `web/`)** | **Manual Técnico Capa 2 — Contratos JSON:** Esquemas compartidos entre módulos (`PoseClip` v2, `RobotMotion`, `DeliveryManifest`, `HardwareCatalog` y grafo `ISA-5.1`). |
| **[`audit-playbook.md`](audit-playbook.md)** | **Ingeniería y Agentes IA** | **Playbook de Calidad:** Los 4 checks automáticos de terminal y los invariantes de UI/UX y física que deben pasar con `0` errores antes de cada `scripts/ship.sh`. |
| **[`design-system.md`](design-system.md)** | **Frontend (`web/`) y Agentes IA** | **Design System & UI Standards:** Fuente única de verdad para Landing + Studio (Desktop y Móvil): 3 niveles de superficie, popovers unificados, reglas de GPU/WebGL sin flicker, progressive disclosure móvil, copy-budget ES/EN y anti-patrones prohibidos. |
| **[`marca.md`](marca.md)** | **Diseño, Web y Pitch (Todo el equipo)** | Guía rápida de identidad visual en código (paleta `--bg #08090B`, `--signal #C8FF2E`, tipografías `Inter Tight` + `Geist Mono`, reglas del símbolo y wordmark), resumida del manual original de **José Alejandro**. |
| **[`radar-herramientas.md`](radar-herramientas.md)** | **Ingeniería y Estrategia (Todo el equipo)** | **Radar Técnico de Herramientas Externas:** Registro evaluado de repositorios open-source complementarios (ej. `orbefab/orbe` para simulación eléctrica y emulación AVR/ESP32), licencias, brechas y posibles puntos de integración con Tridi. |
| **[`investigacion-ajuste-incremental-politicas.md`](investigacion-ajuste-incremental-politicas.md)** | **Training & Physics (Juan, Pastor)** | **Investigación Técnica R1 — Ajuste Incremental de Políticas:** Diagnóstico del tilt lateral en `g1-stand.onnx` (`waist_roll` + omisión de `--worlds` + `ret_norm`), comparativa cuantitativa (KL-PPO, Adaptador Residual por Slice, Tronco Congelado, LoRA) y compatibilidad estricta con los 17 ops de `onnx-lite.js` / `export_mcu.py`. |
| **[`investigacion-entornos-3d-locales-desde-fotos.md`](investigacion-entornos-3d-locales-desde-fotos.md)** | **Data, Physics & Web (Juan, Pastor, César)** | **Investigación Técnica R2 — Entornos 3D Simulables desde Fotos:** Arquitectura local en 4 etapas sin LLMs externos (`VGGT`/`Depth Anything V2` + `YOLO-World`/`Florence-2`/`SAM 2` + `2DGS`/`TRELLIS.2` + `CoACD`/MJCF `<pair>`), perfiles de hardware (`Apple M2 16 GB` vs GPU CUDA `12–24 GB`) y 5 modos de fallo críticos. |
| **[`investigacion-tracking-articulaciones-humanoides.md`](investigacion-tracking-articulaciones-humanoides.md)** | **Data, Physics & Web (Todo el equipo)** | **Evaluación Técnica R3 — Conteo de Articulaciones Humanoides:** Auditoría etapa por etapa (`17` COCO → `33` MediaPipe → `127`/`22` SMPL-X → `2×21` WiLoR → `22` overlay 2D / `41+42` `SkeletonView` → `29` G1 / `19` H1), comparativa biomecánica (`~244` DoFs humanos) y veredicto con 4 ajustes arquitectónicos requeridos. |

---

## 📦 2. Archivo de Reuniones, Identidad Visual y Fuentes Raw (Contexto General en el Repo)

Todos los archivos maestros de identidad, presentaciones, grabaciones de campo y transcripciones sin editar viven versionados dentro de `docs/` para que ningún miembro del equipo dependa de archivos sueltos en su computadora:

### 🎨 Identidad de Marca y Pitch Deck (`docs/pitch/`)
- **[`pitch/manual-de-marca-tridi.pdf`](pitch/manual-de-marca-tridi.pdf)** (`3,8 MB`, 25 páginas): **Manual de Marca Oficial de Tridi**, diseñado por **José Alejandro**. Contiene la construcción geométrica del isotipo 3D, proporciones del wordmark `tridi` con la `ı` sin punto (`U+0131`), paleta cromática, tipografía y usos correctos/incorrectos.
- **[`pitch/tridi-pitch.pdf`](pitch/tridi-pitch.pdf)** (`1,1 MB`): **Pitch Deck Oficial de Tridi en Platanus Hack 26** (Caracas, octubre de 2026).

### 🏭 Reuniones Industriales, Audio Raw y Transcripciones (`docs/reunion-zaka.md` + `docs/reuniones/`)
- **[`reunion-zaka.md`](reunion-zaka.md)**: **Documento estructurado de la reunión con el Ing. José González (ZAKA, C.A. / Rockwell Automation)** del 12 de noviembre de 2026 — conclusiones ejecutivas, las 3 prioridades del producto industrial (`P&ID .dxf → 1. Docs ISA-5.1 → 2. Simulación 3D → 3. Archivo plano PLC`), diccionario industrial y resumen de 8 bloques de la sesión de 2 horas.
- **[`reuniones/2026-11-12-reunion-zaka-audio.m4a`](reuniones/2026-11-12-reunion-zaka-audio.m4a)** (`42 MB`, 2 horas): **Grabación de audio íntegra (raw)** de la reunión presencial en Barquisimeto con el Ing. José González (ZAKA, C.A.).
- **[`reuniones/2026-11-12-reunion-zaka-transcripcion-raw.txt`](reuniones/2026-11-12-reunion-zaka-transcripcion-raw.txt)** (`96 KB`, texto completo): **Transcripción íntegra sin recortar (raw Whisper)** de las 2 horas de reunión con el Ing. José González, conservada palabra por palabra para consultas de detalle técnico o citas textuales.

### 🤖 Casos de Estudio Físicos, Planes Anteriores y Bitácora
- **[`caso-luigi-sim2real.md`](caso-luigi-sim2real.md)**: Bitácora técnica completa del **Caso 01 (Rover Diferencial Luigi — Lab 3 y Lab 4)**: mallas STL, fallos reales en el Arduino UNO (`pulseIn` de `47,1 ms` → `ISR < 4 µs`, clon I2C `APDS-9960` con `Chip ID = 0x9E`, conflicto `Timer1` entre `<Servo.h>` y `D9/D10` en `L298N`) y validación Sim-to-Real a `50 Hz`.
- **[`plan-v3-assembler.md`](plan-v3-assembler.md)**: Especificación histórica del sprint v3 (`Tridi Assembler` para carritos Arduino y primera celda industrial `factory_cell`), cuyos entregables ya están integrados en producción.
- **[`bitacora/`](bitacora/README.md)**: Historial cronológico de sesiones de trabajo de cada integrante (`YYYY-MM-DD-HHMM-<persona>-<tema>.md`).
- **[`../yc/`](../yc/README.md)** *(Exclusivo del repo privado `juanevillam/tridi`)*: Aplicación oficial enviada a **Y Combinator Winter 2027** ([`yc/yc-w27-reference.md`](../yc/yc-w27-reference.md)), métricas auditadas ([`yc/verdad-hoy.md`](../yc/verdad-hoy.md)) e investigación de competidores ([`yc/competidores.md`](../yc/competidores.md)).

---

## 🔄 Regla de Auto-Sincronización de Documentación (Obligatoria para Agentes)

Cada vez que una sesión complete o avance una tarea de [`ROADMAP.md`](ROADMAP.md), agregue un nuevo caso físico o industrial, cambie un contrato JSON o modifique la infraestructura de `trytridi.com`, el agente **debe actualizar automáticamente en el mismo commit/branch antes de `scripts/ship.sh`**:
1. **Capa 1 (Humana):** [`docs/ROADMAP.md`](ROADMAP.md) y [`docs/estado.md`](estado.md) (más la bitácora de la sesión en `docs/bitacora/`).
2. **Capa 2 (Manuales Técnicos):** [`docs/architecture-and-sim2real.md`](architecture-and-sim2real.md), [`docs/infra-and-security.md`](infra-and-security.md) o [`docs/contrato.md`](contrato.md) según el área tocada.
