# Roadmap Ejecutivo y Estado del Producto — Tridi (Noviembre 2026)

> **Para leer en 3 minutos:** Este es el documento principal de estado de **Tridi (`juanevillam/tridi`)**. Resume cómo funciona nuestro ecosistema sobre **1 motor físico compartido (`MuJoCo` Python + WebAssembly)** y **3 verticales de negocio** (Humanoides, Robots/Mecatrónica y Plantas Industriales P&ID), qué está desplegado hoy en producción (`trytridi.com`) y qué tareas tiene asignadas cada integrante (**Juan, Pastor, César y Ale**).
> Para detalles de implementación a nivel de código, pines o infraestructura, consulta los manuales de Capa 2 en [`docs/architecture-and-sim2real.md`](architecture-and-sim2real.md) y [`docs/infra-and-security.md`](infra-and-security.md).

---

## 1. Reglas de Oro del Ecosistema y las 3 Verticales de Tridi

1. **Un solo motor físico, tres verticales claramente separadas en producto y UI:**
   - **Vertical 1 · Robótica Humanoide (`Unitree G1` / `H1`):** Su entrada es **video humano** (`#/live` cámara en vivo / teléfono por QR o `#/upload` archivo `.mp4`). Entrega el dataset físico y la política `ONNX` en `#/delivery`.
   - **Vertical 2 · Rovers Autónomos y Mecatrónica (`luigi_lab3` / `luigi_lab4`):** Su entrada son **mallas CAD 3D (`.stl`) + código `.ino`** en `#/assembler`. Audita conflictos de timers/interrupciones (`Timer1` vs `<Servo.h>`, `pulseIn` de `47,1 ms` → `ISR < 4 µs`) y entrega firmware C99 determinista sin memoria dinámica (`training/export_mcu.py`).
   - **Vertical 3 · Plantas Industriales y Celdas PLC (`factory_cell` / `P&ID .dxf`):** Validada con el **Ing. José González (ZAKA, C.A. / Rockwell Automation)** ([`docs/reunion-zaka.md`](reunion-zaka.md)). Su entrada es el plano **P&ID de AutoCAD (`.dxf`)** en `#/assembler` y entrega en orden estricto de valor industrial: **1. Documentación de Ingeniería `ISA-5.1 / ISA-88` (`FDS`)**, **2. Simulación 3D interactiva en MuJoCo**, y **3. Archivo plano de bloques tipo "Lego" para PLC** (`Siemens TIA Portal .scl` y `Rockwell Studio 5000 .L5K`).
2. **Principio de Arquitectura (`mus3o`): *"La IA razona la topología; el código determinista ensambla la física y el control"*:**
   - Ningún LLM inventa números flotantes de un XML de MuJoCo ni escribe directo registros críticos de un PLC o Arduino. La IA o el parser lee el input (video, `.stl` o `.dxf`), produce un grafo semántico validado contra nuestros catálogos (`physics/components/catalog.json` e `isa_standard.json`), y nuestros ensambladores deterministas (`assembler.js`, `pid_assembler.js`, `export_mcu.py`, `export_plc.py`) compilan el XML, la documentación `ISA-5.1` y el código de control con paridad numérica comprobada (`max_abs_diff < 1e-5`).
3. **Estándar Visual de Laboratorio (`trytridi.com`):**
   - Todas las simulaciones en `#/simulations` (`Unitree G1`, `Rover Luigi v1`, `Rover Luigi v2`, `Industrial Cell`) corren dentro de entornos 3D de planta/laboratorio con iluminación física, **tags 3D proyectados en tiempo real sobre cada actuador/sensor** y una **barra narradora en vivo de 4 etapas** que explica qué está decidiendo la política en cada instante.
4. **Frontera Estricta de Privacidad (`yc/`):**
   - La carpeta [`yc/`](../yc/README.md) vive exclusivamente en el repositorio privado `juanevillam/tridi` y jamás se sube a ningún mirror público.

---

## 2. Estado Actual de las Superficies y Verticales en Producción

| Superficie / Vertical | Estado Hoy (Noviembre 2026) | Manual Técnico (Capa 2) |
| :--- | :--- | :--- |
| **Infraestructura & Dominio (`trytridi.com`)** | **100% Operativo.** Cloudflare Pages (`tridi-18p.pages.dev`) con deploy automático desde `main`, SSL `Full (Strict)`, TLS 1.3, HSTS `max-age=31536000; includeSubDomains; preload`, `SPF -all`, `DMARC p=reject`, Google Search Console verificado y WAF activo. | [`docs/infra-and-security.md`](infra-and-security.md) |
| **Landing & Navegación (`#/` y `#/milestones`)** | **100% Operativo.** Hero con `Unitree G1` en vivo (`Stand v2`), dropdowns `Product ▾` y `Studio ▾` con apertura por hover y tipografía unificada, sección `.tries` con distinción explícita entre herramientas de **Humanoides** (`Live Camera`, `Upload Video`, `Delivery & Code`) vs. **CAD & P&ID** (`Factory Assembler`), footer compacto en 1 barra y página **Case Studies** (`#/milestones`) con los 3 casos reales. | [`docs/architecture-and-sim2real.md`](architecture-and-sim2real.md) |
| **Estudio de Simulaciones 3D (`#/simulations`)** | **100% Operativo.** Soporta los 4 modelos físicos en orden lógico (`Unitree G1`, `Rover Luigi v1 — Lab 3`, `Rover Luigi v2 — Lab 4`, `Industrial Cell`), todos con entorno 3D de bahía/laboratorio/planta, etiquetas 3D flotantes de telemetría proyectadas desde coordenadas MuJoCo y narrador en vivo de 4 pasos. | [`docs/architecture-and-sim2real.md`](architecture-and-sim2real.md) |
| **Vertical 1: Humanoides (`data/` + `physics/` + `training/`)** | **100% Operativo.** Captura 2.0 (`GVHMR` cuerpo SMPL-X en coordenadas de mundo + `WiLoR` manos 3D de 21 puntos), retargeting `< 3,2 cm` con manos Inspire de 5 dedos, 9 políticas ONNX en producción (`g1-stand`, `g1-walk`, `g1-run`, `g1-jacks`, `g1-saludar`, `g1-dedos`, `g1-bailar`, `g1-frente`, `g1-sentarse`, `h1-walk`) y entrenamiento multi-clip con fallas de actuador (`training/multiclip.py`). | [`docs/architecture-and-sim2real.md`](architecture-and-sim2real.md) |
| **Vertical 2: Rovers & Mecatrónica (`luigi_lab3` y `luigi_lab4`)** | **100% Operativo.** Catálogo de 14 componentes con escenas 3D aisladas (`physics/components/catalog.json`), gemelos digitales `luigi_lab3` (`nq=9, nu=2`) y `luigi_lab4` (`nq=10, nu=3` con cuello servo SG90 y cono ultrasónico dinámico), política `luigi-lab4.onnx` (`2.353 B`) y compilador `ONNX → C99 / Arduino (.ino)` (`training/export_mcu.py`) con paridad `0.00e+00`. | [`docs/caso-luigi-sim2real.md`](caso-luigi-sim2real.md) |
| **Vertical 3: Plantas Industriales & P&ID (`#/assembler`)** | **100% Operativo.** Catálogo `ISA-5.1` (`physics/components/isa_standard.json` con 14 clases de equipos industriales), parser de planos AutoCAD `.dxf` (`data/pid_parser.py` y `physics/src/pid_assembler.js`), 2 planos `.dxf` de prueba (`01_batch_mixer.dxf`, `02_silo_packaging.dxf`) y exportación instantánea de: **1. Docs `ISA-5.1 / ISA-88` (`FDS`)**, **2. Escena 3D MuJoCo** y **3. Código PLC** (`Siemens .scl` y `Rockwell .L5K`). | [`docs/reunion-zaka.md`](reunion-zaka.md) · [`docs/plan-v4-industrial-y-verticales.md`](plan-v4-industrial-y-verticales.md) |

---

## 3. Cómo se Conectan las Superficies y el Motor Físico (Diagrama ASCII)

```text
                      ┌──────────────────────────────────────────────────────────┐
                      │               trytridi.com (Cloudflare Pages)            │
                      │     Landing (#/) · Simulations (#/simulations) ·         │
                      │     Factory Assembler (#/assembler) · Case Studies       │
                      └─────────────┬──────────────────────────┬─────────────────┘
                                    │                          │
        ┌───────────────────────────▼──────┐            ┌──────▼───────────────────────────────┐
        │   VERTICAL 1: HUMANOIDES         │            │   VERTICALES 2 & 3: CAD / P&ID       │
        │   (#/live · #/upload · #/delivery)│            │   (#/assembler · Factory Assembler)  │
        │   • Input: Video celular / QR    │            │   • Modo A: Planos P&ID (.dxf)       │
        │   • Captura 2.0 (GVHMR + WiLoR)  │            │     → Grafo ISA-5.1 (isa_standard)   │
        │   • PoseClip v2 → RobotMotion    │            │   • Modo B: Mallas CAD (.stl) + .ino │
        └───────────────────────────┬──────┘            │     → Catálogo 14 comp. (catalog)    │
                                    │                   └──────┬───────────────────────────────┘
                                    ▼                          ▼
                      ┌──────────────────────────────────────────────────────────┐
                      │         MOTOR FÍSICO COMPARTIDO (MuJoCo + PPO RL)        │
                      │   • WebAssembly a 500 Hz en navegador + Three.js 60 fps  │
                      │   • Entornos 3D con Tags Flotantes + Narrador en Vivo    │
                      │   • Entrenamiento PPO / DeepMimic a 50 Hz en Python      │
                      └──────┬──────────────────────────┬───────────────────┬────┘
                             │                          │                   │
              ┌──────────────▼─────────┐   ┌────────────▼───────────┐   ┌───▼────────────────────────┐
              │ Entregable Humanoides  │   │ Entregable Mecatrónica │   │ Entregable Planta / PLC    │
              │ • policy.onnx (265 KB) │   │ • export_mcu.py        │   │ • 1. Docs FDS ISA-5.1 (.md)│
              │ • motion.json          │   │ • Firmware C99 (.ino)  │   │ • 2. Escena 3D MuJoCo (.xml│
              │ • dataset.zip (#/deliv)│   │ • Paridad < 1e-5       │   │ • 3. PLC (.scl / .L5K)     │
              └────────────────────────┘   └────────────────────────┘   └────────────────────────────┘
```

---

## 4. Tablero de Tareas por Integrante (Juan · Pastor · César · Ale)

### 🟢 Juan (`data/`, `training/`, `web/`, `docs/`) — CTO
- [x] **`J-1` · Infraestructura y Seguridad de Producción (`trytridi.com`):** DNS en Cloudflare, SSL Strict, HSTS preload, `SPF`/`DMARC`, Google Search Console, WAF y CI/CD en GitHub Actions.
- [x] **`J-2` · Entrenamiento Multi-Video + Casos Borde (`training/multiclip.py`):** Muestreo ponderado por tasa de caída (`clip_fail_ema`), degradación parcial de actuadores (`--fault-prob`) y frenadas de emergencia (`--sudden-stop-prob`).
- [x] **`J-3` · Compilador Automático `ONNX → C99 / Arduino (.ino)` (`training/export_mcu.py`):** Emisión de inferencia C99 sin heap (`O(1)` SRAM), paridad `max_abs_diff < 1e-5` contra `onnxruntime`, detección de conflicto `Timer1` (`<Servo.h>` vs `D9/D10`) e interrupciones `ISR` sin `pulseIn()`.
- [x] **`J-4` · Política `luigi-lab4.onnx` + Caso de Estudio Lab 4:** Entorno `training/luigi_lab4_env.py` (`obs_dim=18, nu=3`), política `training/policies/luigi-lab4.onnx` (`2.353 B`), firmware `LAB4_Tridi_Autonomo.ino` y página `Case Studies` (`#/milestones`).
- [x] **`J-5` · Pulido Integral de UI/UX, Jerarquía de Producto y Escenarios 3D (`web/`):** Dropdowns con apertura por hover, separación clara entre herramientas de Humanoides vs. `Factory Assembler`, entorno 3D de fábrica/laboratorio + tags 3D flotantes + barra narradora en las 4 simulaciones (`Unitree G1`, `Luigi v1`, `Luigi v2`, `Industrial Cell`).
- [x] **`J-6` · Parser Industrial `P&ID (.dxf)` y Exportador `PLC (.scl / .L5K)` (`data/pid_parser.py`, `training/export_plc.py`):** Ingesta de entidades `INSERT`/`TEXT`/`MTEXT`/`LINE`/`LWPOLYLINE`, planos de prueba `.dxf` y exportación de bloques modulares tipo "Lego" para Rockwell `Studio 5000 (.L5K)` y Siemens `TIA Portal (.scl)`.
- [x] **`J-7` · Estandarización Documental en 2 Capas y Respaldo de Fuentes Raw (`docs/`):** Unificación con el estándar de `~/Code/portfolio`, archivo del manual de marca de **José Alejandro**, pitch deck de Platanus Hack 26, y audio `.m4a` + transcripción raw `.txt` de la reunión con **ZAKA**.

### 🟢 Pastor (`physics/`, `training/`) — CEO
- [x] **`P-1` · Catálogo Unificado de Componentes de Hardware (`physics/components/catalog.json` + `index.js`):** 14 componentes industriales y embebidos con parámetros físicos de MuJoCo y restricciones eléctricas de MCU/PLC + 14 escenas 3D aisladas (`physics/models/components/*.xml`).
- [x] **`P-2` · Gemelo Digital `luigi_lab4` (`physics/models/luigi_lab4/`):** Modelo MuJoCo (`nq=10, nu=3`) con las 7 mallas `.stl` de Laboratorio IV y rotación en vivo del cono ultrasónico junto al cuello servo SG90 (`qpos[9]`).
- [x] **`P-3` · Motor Determinista del `Tridi Assembler` (`physics/src/assembler.js`):** `parseArduinoSketch`, `classifyStlMeshes` y `generateMujocoXml`.
- [x] **`P-4` · Celda Industrial de Empaque (`physics/models/factory_cell/` + `factory-cell.onnx`):** Cinta transportadora, desviador neumático y selladora vertical sincronizados por sensores ópticos (`0 %` de cajas aplastadas frente a timer fijo de PLC).
- [x] **`P-5` · Catálogo `ISA-5.1` y Ensamblador 3D de Plantas desde `P&ID (.dxf)` (`physics/components/isa_standard.json`, `physics/src/pid_assembler.js`):** 14 clases de equipos ISA (`FV`, `WT`, `LT`, `LSH`, `LSL`, `PT`, `TT`, `M`, `P`, `TK`, `SL`, `SC`, `CV`, `PK`), parser de entidades AutoCAD (`INSERT`/`TEXT`/`MTEXT`/`ATTRIB`), exportación de tabla I/O en `.csv` (`generatePlcIoCsv`), bloques completos PLC (`BatchDB` / `FB_Valve_Standard`), generación automática de escena 3D MuJoCo desde el P&ID e inyección de fallas de proceso (`sim.injectProcessFault`).
- [ ] **`P-6` · Simulación Multi-Silo a Escala (Caso Real 22 Silos → 6 Empacadoras):** Ampliar `pid_assembler.js` con el layout completo del caso expuesto por el Ing. José González (ruteo combinatorio de silos con detección de cuellos de botella de flujo).

### 🟢 César (`web/`) — CIO/CTO
- [x] **`C-1` · Pantalla Interactiva `#/assembler` (`web/src/screens/assembler.js`):** Flujo completo con selector de modo (**Modo Planta P&ID `.dxf`** y **Modo Robot CAD `.stl` + `.ino`**), presets interactivos (`Batch Mixer`, `Silo Packaging Line`, `Rover Luigi v1`, `Rover Luigi v2`, `Industrial Cell`) y lanzamiento en 1 clic hacia `#/simulations`.
- [x] **`C-2` · Visor y Descarga de los 3 Entregables Industriales ZAKA en `#/assembler`:** Pestañas interactivas y botones de descarga para **1. Documentación FDS `ISA-5.1 / ISA-88` (`.md`)**, **2. Escena 3D MuJoCo (`.xml`)** y **3. Archivo Plano PLC (`.scl` / `.L5K`)**.
- [x] **`C-3` · Controles de Inyección de Fallas en `#/simulations` (`web/src/screens/simulations.js`):** Panel de prueba de estrés en vivo para comparar modo timer fijo vs. política cerrada Tridi y disparar fallas de sensores/actuadores.
- [ ] **`C-4` · Editor Visual de Tags ISA sobre el Plano 2D ↔ Escena 3D:** Permitir hacer clic sobre un tag (`LT-102`, `FV-101`, `SC-201`) en la tabla `I/O Schedule` de `#/assembler` y resaltar la tubería/equipo correspondiente en la vista previa.

### 🟢 Ale (`docs/`, `yc/`) — COO
- [x] **`A-1` · Dossier de la Reunión con ZAKA (`docs/reunion-zaka.md`), Plan Maestro v4 (`docs/plan-v4-industrial-y-verticales.md`) y Plan de Ventas y Comunidades (`docs/plan-ventas-y-comunidades.md`):** Sistematización de las 2 horas de entrevista con el Ing. José González, las 3 prioridades del producto industrial, posicionamiento de las 3 verticales y playbook GTM de adquisición ("de menos a más" en comunidades de automatización/PLC y robótica).
- [ ] **`A-2` · Segunda Sesión de Validación en Vivo con el Ing. José González (ZAKA, C.A.):** Presentarle `#/assembler` corriendo en vivo con los planos `.dxf` (`01_batch_mixer.dxf` y `02_silo_packaging.dxf`), validar la plantilla `FDS ISA-5.1` generada y el archivo plano `.L5K` para `Rockwell Studio 5000`, y recoger su feedback con un plano `.dxf` propio de ZAKA.
- [ ] **`A-3` · Ejecución Semanal de Prospección B2B y Modelo de Precios SaaS + *Pay-per-Compute* Industrial:** Ejecutar la meta semanal de 30–50 integradoras contactadas (`CSIA`, Siemens/Rockwell Solution Partners, CIEL/Venezuela, México y Colombia) siguiendo [`docs/plan-ventas-y-comunidades.md`](plan-ventas-y-comunidades.md) y cerrar los primeros pilotos.
