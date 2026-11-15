# Estado Actual — Tridi (Noviembre 2026)

> **Dónde está cada área hoy (13 de noviembre de 2026).** Es lo primero que lee el equipo (**Juan, Pastor, César y Ale**) o su agente al empezar una sesión. El tablero ejecutivo está en [`ROADMAP.md`](ROADMAP.md), el índice general en [`README.md`](README.md) y el historial por sesión en [`bitacora/`](bitacora).

---

## Pastor: Física, Catálogo de Hardware y Ensambladores Deterministas (`physics/`, `training/`)

- **Humanoides en MuJoCo WASM (`Unitree G1` y `Unitree H1`):**
  - Simulación física en tiempo real en el navegador (`500 Hz` física, `50 Hz` política ONNX), retargeting con IK de cuerpo completo y manos Inspire de 5 dedos (`physics/models/inspire/hands.json`, error de punta de dedos $< 2\text{ cm}$), mundos (`Plano`, `Piedras`, `Resbaloso`, `Viento`), escenas (`Sin muebles`, `Cocina`, `Depósito`) e interacción física con taza y partículas de agua en `Cocina`.
- **Catálogo de Hardware y Ensambladores (`P-1..P-5` ✅):**
  - **`P-1` (`physics/components/`):** Catálogo determinista (`catalog.json` + API CRUD y `validateHardwarePinout`) con **14 escenas MuJoCo 3D individuales** (`physics/models/components/*.xml`) y reglas reales de hardware (`deadzone_pwm: 115`, conflicto `Timer1` de `<Servo.h>` en `D9/D10`, interrupciones `INT0/INT1` vs `PCINT`).
  - **`P-2` (`physics/models/luigi_lab4/`):** Gemelo digital del `Rover Luigi v2 (Radar Servo SG90)` (`nq=10, nu=3`) con cuello móvil `neck_servo_joint` (`±90°`) y cono ultrasónico rotatorio en tiempo real.
  - **`P-3` (`physics/src/assembler.js`):** Parser de sketches Arduino (`parseArduinoSketch`), clasificador de piezas `.stl` (`classifyStlMeshes`) y generador automático de MJCF (`generateMujocoXml`).
  - **`P-4` (`physics/models/factory_cell/`):** Celda industrial de empaque en MuJoCo (`nq=10, nu=3`: cinta transportadora, pistón desviador, prensa selladora y 3 sensores ópticos) con política `factory-cell.onnx` (`0 %` merma) y simulador comparativo frente a PLC por timer fijo.
  - **`P-5` (`physics/components/isa_standard.json`, `physics/src/pid_assembler.js`):** Catálogo determinista `ISA-5.1` de 14 clases de equipos industriales (`FV`, `WT`, `LT`, `LSH`, `LSL`, `PT`, `TT`, `M`, `P`, `TK`, `SL`, `SC`, `CV`, `PK`), parser `.dxf` (`parseDxfPid`), generador de documentación FDS `ISA-5.1 / ISA-88` (`generateIsaEngineeringDocs`), ensamblador de escenas 3D MuJoCo (`generatePidMujocoXml`) y generador de código PLC (`generatePlcFlatFile`), verificado en `check-assembler.mjs`.
- **Sigue (`P-6`):** Escena multi-silo a escala (caso real expuesto por el Ing. José González: 22 silos → 6 empaquetadoras) y pruebas con planos `.dxf` reales de **ZAKA, C.A.** ([`reunion-zaka.md`](reunion-zaka.md)).

---

## Juan: Datos, Entrenamiento GPU, Compiladores MCU/PLC, Web e Infraestructura (`data/`, `training/`, `web/`, `docs/`)

- **Captura 2.0 (`GVHMR + WiLoR`) y Servidor de Video (`data/`):**
  - Pipeline completo de video y cámara en vivo/QR a `PoseClip` v2 con SMPL-X y manos de 21 puntos (`data/server.py` + `data/serve.sh` detrás de túnel de Cloudflare).
- **Políticas ONNX, Multi-Clip GPU y Compilador MCU (`J-2..J-4` ✅):**
  - Política de equilibrio `g1-stand.onnx` entrenada hasta **300 M pasos** (`4/4` empujones de `250 N` en 4 pisos) + las **9 políticas de imitación** publicadas en `training/policies/`.
  - **`J-2` (`training/multiclip.py`, `cloud_gpu.sh`):** Entrenamiento simultáneo multi-video con muestreo adaptativo por fallos (`clip_fail_ema`), degradación de actuadores (`--fault-prob`) y frenadas de emergencia (`--sudden-stop-prob`).
  - **`J-3` (`training/export_mcu.py`):** Compilador automático `ONNX → C99 / Arduino (.ino)` con paridad $< 10^{-5}$, interrupciones por hardware (`PCINT1`/`INT0`) en lugar de `pulseIn()` y máquina de estados no bloqueante a `50 Hz`.
  - **`J-4` (`training/luigi_lab4_env.py`):** Política `luigi-lab4.onnx` (`2.353 bytes`) que coordina las 2 ruedas + el barrido activo del cuello servo `SG90` en movimiento, y casos físicos reales `luigi_lab3`/`luigi_lab4` documentados en [`caso-luigi-sim2real.md`](caso-luigi-sim2real.md).
- **Producción en `trytridi.com`, Escenarios 3D con Tags en Vivo, Pipeline P&ID y Estándar Documental en 2 Capas (`J-1`, `J-5`, `J-6`, `J-7` ✅):**
  - **`J-1` ✅ (`infra-and-security.md`):** Cloudflare Pages, DNS, SSL Strict, HSTS preload, `SPF -all`, `DMARC p=reject`, Google Search Console verificado (`scripts/cloudflare-setup.mjs`) y WAF activo.
  - **`J-5` ✅ (`web/src/looks/index.js`, `web/src/stage.js`, `web/src/screens/`):** Navbar unificado con dropdown `Studio ▾` autoexplicativo y enlaces directos a `Case Studies` (`#/milestones`), `Docs` (`#/docs`, sincronizado en vivo con `tridi-physics`) y `Team` (`#/team`), contenedor y header estandarizados a `1720px` (`padding: 14px 20px 28px`) en todas las pantallas, degradados suaves de scroll (`web/src/scroll-fade.js`), footer corporativo multi-columna en segundo scroll y **entorno 3D de fábrica/laboratorio + tags 3D flotantes + barra narradora en vivo de 4 pasos en las 4 simulaciones** (`Unitree G1`, `Luigi v1`, `Luigi v2`, `Industrial Cell`).
  - **`J-6` ✅ (`data/pid_parser.py`, `training/export_plc.py`, `data/pid_samples/*.dxf`):** Pipeline autónomo `P&ID (.dxf) → Documentación FDS ISA-5.1 + Escena 3D MuJoCo + Bloques PLC (.scl / .L5K)` con 2 planos `.dxf` de prueba (`01_batch_mixer.dxf`, `02_silo_packaging.dxf`).
  - **`J-7` ✅ (`docs/`, `README.md`):** Estandarización de la documentación en 2 capas (idéntica a `~/Code/portfolio/docs/`) y archivo permanente en el repo del **Manual de Marca de José Alejandro** (`docs/pitch/manual-de-marca-tridi.pdf`), **Pitch Deck de Platanus Hack 26** (`docs/pitch/tridi-pitch.pdf`), y **audio raw (`.m4a`) + transcripción raw (`.txt`) de la reunión con ZAKA** (`docs/reuniones/`).

---

## César: Pantallas de Aplicación y Factory Assembler (`web/src/screens/`)

- **Funciona (`C-1..C-3` ✅):**
  - Navegación completa de la aplicación (`#/`, `#/live`, `#/upload`, `#/simulations`, `#/assembler`, `#/milestones`, `#/delivery`), conexión con el servidor de video y traducción bilingüe ES/EN verificada (`590+` claves).
  - **`C-1` y `C-2` ✅ (`web/src/screens/assembler.js`):** Pantalla self-serve **Factory Assembler** (`#/assembler`) con doble canal (**Canal 01: Plantas Industriales P&ID `.dxf`** con Prioridades 1, 2 y 3; **Canal 02: Robots y Mecatrónica `.stl + .ino`** con auditoría `Timer1`, catálogo `P-1` y descarga de `.xml` + `.ino` C99), barra rápida de presets interactivos y navegación unificada hacia `Simulations` (`#/simulations`).
  - **`C-3` ✅ (`web/src/screens/simulations.js`, `web/src/screens/delivery.js`):** Selector `<select id="robot-model">` agrupado con `<optgroup>` por las 3 verticales (`Humanoides`, `Robots Móviles`, `Plantas Industriales`) en orden `Unitree G1` → `Rover Luigi v1` → `Rover Luigi v2` → `Industrial Cell`, y separación clara en `#/delivery` entre entregables de Humanoides/MCU vs. PLC Industrial.
- **Sigue (`C-4`):** Resaltado interactivo de tags ISA (`LT-102`, `FV-101`, `SC-201`) entre la tabla `I/O Schedule` y la vista previa en `#/assembler`.

---

## Ale: Estrategia Industrial, Clientes y Y Combinator (`docs/`, `yc/`)

- **Funciona (`A-1` ✅):** Aplicación enviada a **YC Winter 2027** ([`../yc/README.md`](../yc/README.md), copia exacta en [`../yc/yc-w27-reference.md`](../yc/yc-w27-reference.md)), Pitch Deck oficial ([`pitch/tridi-pitch.pdf`](pitch/tridi-pitch.pdf)), Manual de Marca diseñado por **José Alejandro** ([`pitch/manual-de-marca-tridi.pdf`](pitch/manual-de-marca-tridi.pdf)), y sistematización completa de la reunión de 2 horas con el **Ing. José González (ZAKA, C.A. / Rockwell Automation)** en [`reunion-zaka.md`](reunion-zaka.md) y [`plan-v4-industrial-y-verticales.md`](plan-v4-industrial-y-verticales.md).
- **Sigue (`A-2`, `A-3`):**
  - **`A-2`:** Segunda sesión de validación en vivo con el Ing. José González mostrando `#/assembler` y `#/simulations` con sus planos `.dxf`.
  - **`A-3`:** Definir modelo de precios SaaS + *Pay-per-Compute* industrial y actualizar el guion de entrevista de YC W27 ([`../yc/entrevista.md`](../yc/entrevista.md)).
