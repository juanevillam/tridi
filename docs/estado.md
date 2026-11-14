# Estado Actual — Tridi (Noviembre 2026)

> Dónde está cada área **hoy**. Es lo primero que lee el equipo o su agente al empezar una sesión. El tablero de tareas está en [`ROADMAP.md`](ROADMAP.md) y el historial por sesión en [`bitacora/`](bitacora).

---

## Pastor: Física, Catálogo de Hardware y Motor del Assembler (`physics/`, `training/`)

- **Humanoides en MuJoCo WASM (`Unitree G1` y `Unitree H1`):**
  - Simulación física en tiempo real en el navegador (`250 Hz` física, `50 Hz` política ONNX), retargeting con IK de cuerpo completo y manos de 5 dedos (`physics/models/inspire/hands.json`, error de punta de dedos $< 2\text{ cm}$), mundos (`Sin muebles`, `Cocina`, `Depósito`) e interacción física con taza y partículas de agua en `Cocina`.
- **Catálogo de Hardware y Motor del Assembler (`P-1..P-4` ✅):**
  - **`P-1` (`physics/components/`):** Catálogo determinista (`catalog.json` + API CRUD y `validateHardwarePinout`) con **14 escenas MuJoCo 3D individuales** (`physics/models/components/*.xml`) y reglas reales de hardware (`deadzone_pwm: 115`, conflicto `Timer1` de `<Servo.h>` en `D9/D10`, interrupciones `INT0/INT1` vs `PCINT`).
  - **`P-2` (`physics/models/luigi_lab4/`):** Gemelo digital del `Rover Luigi v2 (Radar Servo SG90)` (`nq=10, nu=3`) con cuello móvil `neck_servo_joint` (`±90°`) y cono ultrasónico rotatorio en tiempo real.
  - **`P-3` (`physics/src/assembler.js`):** Parser de sketches Arduino (`parseArduinoSketch`), clasificador de piezas `.stl` (`classifyStlMeshes`) y generador automático de MJCF (`generateMujocoXml`).
  - **`P-4` (`physics/models/factory_cell/`):** Celda industrial de empaque en MuJoCo (`nq=10, nu=3`: cinta transportadora, pistón desviador, prensa selladora y 3 sensores ópticos) con política `factory-cell.onnx` (`0 %` merma) y simulador comparativo frente a PLC por timer fijo.
  - **`P-5 / J-6` (`physics/components/isa_standard.json`, `physics/src/pid_assembler.js`):** Catálogo determinista `ISA-5.1` de 14 clases de equipos industriales (`FV`, `WT`, `LT`, `LSH`, `LSL`, `PT`, `TT`, `M`, `P`, `TK`, `SL`, `SC`, `CV`, `PK`), parser `.dxf` (`parseDxfPid`), generador de documentación FDS `ISA-5.1 / ISA-88` (`generateIsaEngineeringDocs`), ensamblador de escenas 3D MuJoCo (`generatePidMujocoXml`) y generador de código PLC (`generatePlcFlatFile`), verificado en `check-assembler.mjs`.
- **Sigue:** Extender escenas 3D de tanques/silos en MuJoCo y pruebas de seguimiento con **ZAKA, C.A.** ([`reunion-zaka.md`](reunion-zaka.md)).

---

## Juan: Datos, Entrenamiento GPU, Compilador MCU, Web e Infraestructura (`data/`, `training/`, `web/`)

- **Captura 2.0 (`GVHMR + WiLoR`) y Servidor de Video (`data/`):**
  - Pipeline completo de video y cámara en vivo/QR a `PoseClip` v2 con SMPL-X y manos de 21 puntos (`data/server.py` + `data/serve.sh` detrás de túnel de Cloudflare).
- **Políticas ONNX, Multi-Clip GPU y Compilador MCU (`J-2..J-4` ✅):**
  - Política de equilibrio `g1-stand.onnx` entrenada hasta **300 M pasos** (`4/4` empujones de `250 N` en 4 pisos) + las **9 políticas de imitación** publicadas en `training/policies/`.
  - **`J-2` (`training/multiclip.py`, `cloud_gpu.sh`):** Entrenamiento simultáneo multi-video con muestreo adaptativo por fallos (`clip_fail_ema`), degradación de actuadores (`--fault-prob`) y frenadas de emergencia (`--sudden-stop-prob`).
  - **`J-3` (`training/export_mcu.py`):** Compilador automático `ONNX → C99 / Arduino (.ino)` con paridad $< 10^{-5}$, interrupciones por hardware (`PCINT1`/`INT0`) en lugar de `pulseIn()` y máquina de estados no bloqueante a `50 Hz`.
  - **`J-4` (`training/luigi_lab4_env.py`):** Política `luigi-lab4.onnx` (`2.353 bytes`) que coordina las 2 ruedas + el barrido activo del cuello servo `SG90` en movimiento, y caso físico real `luigi_lab3` documentado en [`caso-luigi-sim2real.md`](caso-luigi-sim2real.md).
- **Producción en `trytridi.com`, Evolución Corporativa de 3 Verticales y Piloto Industrial P&ID (`J-1`, `J-5`, `J-6` ✅):**
  - Despliegue continuo en Cloudflare Pages (`.github/workflows/deploy.yml`, seguridad DNS/HSTS/CSP en [`infra-and-security.md`](infra-and-security.md)).
  - **`J-1` ✅:** Landing, `#/milestones` (con visor `PhotoViewer` a pantalla completa y chips unificados), `#/simulations` (layout de 2 columnas sin espacio muerto en todos los robots, botón `0.5×` en 1 línea, videos PiP en todos los clips y utilería 3D en `Sitting down` y `Washing dishes`) y `#/delivery`.
  - **`J-5` ✅ (`web/src/screens/home.js`, `web/src/landing/`):** Navbar corporativo unificado con dropdowns en desktop y acordeón en móvil (`Product ▾`, `Studio ▾`, `Case Studies`), sección corporativa de las **3 verticales (`#verticals`)**, 5.ª tarjeta interactiva (`#/assembler`) y footer espejo de 4 columnas.
  - **`J-6` ✅ (`data/pid_parser.py`, `training/export_plc.py`, `physics/src/pid_assembler.js`, `data/pid_samples/*.dxf`):** Pipeline autónomo `P&ID (.dxf) → Documentación FDS ISA-5.1 + Escena 3D MuJoCo + Bloques PLC (.scl / .L5K)` con 2 planos `.dxf` de prueba (`01_batch_mixer.dxf`, `02_silo_packaging.dxf`).
- **Sigue:** Demostración de seguimiento con el **Ing. José González (ZAKA, C.A.)** sobre `#/assembler` y preparación de entrevista YC W27.

---

## César: Pantallas de Aplicación y Assembler (`web/src/screens/`)

- **Funciona (`C-1..C-3` ✅):**
  - Navegación completa de la aplicación (`#/`, `#/live`, `#/upload`, `#/simulations`, `#/assembler`, `#/milestones`, `#/delivery`), conexión con el servidor de video y traducción bilingüe ES/EN verificada (`780+` claves).
  - **`C-1` ✅ (`web/src/screens/assembler.js`):** Pantalla self-serve `#/assembler` con doble canal (**Canal 01: Plantas Industriales P&ID `.dxf`** con Prioridades 1, 2 y 3; **Canal 02: Robots y Mecatrónica `.stl + .ino`** con auditoría `Timer1`, catálogo `P-1` y descarga de `.xml` + `.ino` C99).
  - **`C-2` ✅ (`web/src/screens/delivery.js`):** Descarga dual en `#/delivery` (`ONNX` + código determinista C99/Arduino `.ino` a `50 Hz`, `Siemens TIA Portal .scl` y `Rockwell Studio 5000 .L5K`).
  - **`C-3` ✅ (`web/src/screens/simulations.js`):** Selector `<select id="robot-model">` agrupado con `<optgroup>` por las 3 verticales (`Humanoides`, `Robots Móviles`, `Plantas Industriales`) + acceso directo a `#/assembler`.

---

## Ale: Estrategia Industrial, Clientes y Y Combinator (`docs/`, `yc/`)

- **Funciona:** Aplicación enviada a **YC Winter 2027** ([`../yc/README.md`](../yc/README.md), copia exacta en [`../yc/yc-w27-reference.md`](../yc/yc-w27-reference.md)), perfil de Tridi en LinkedIn, Pitch Deck oficial ([`pitch/tridi-pitch.pdf`](pitch/tridi-pitch.pdf)), Manual de Marca oficial ([`pitch/manual-de-marca-tridi.pdf`](pitch/manual-de-marca-tridi.pdf)) y puente directo para la reunión de validación industrial con el **Ing. José González (ZAKA, C.A.)** ([`reunion-zaka.md`](reunion-zaka.md)).
- **Pendiente en [`ROADMAP.md`](ROADMAP.md):**
  - **`A-1`:** Especificación de casos industriales (`docs/verticales-industriales.md`) alimentada con lo que validemos con ZAKA.
  - **`A-2`:** Unit Economics y modelo de precios (`docs/unit-economics.md`).
  - **`A-3`:** Pipeline comercial de primeros robots y plantas reales (`docs/clientes-potenciales.md`).
  - **`A-4`:** Actualización de narrativa y guion de entrevista en [`../yc/entrevista.md`](../yc/entrevista.md) con los casos reales post-envío.
