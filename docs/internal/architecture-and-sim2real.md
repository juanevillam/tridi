# Manual Técnico Interno 2: Arquitectura del Producto, Captura 2.0, Web y Caso Real Sim-to-Real (`luigi_lab3`)

> **CONFIDENCIAL / USO INTERNO (`juanevillam/tridi`)**
> Referencia técnica completa de los 4 módulos de Tridi (`data/`, `physics/`, `training/`, `web/`) y del primer caso de estudio físico Sim-to-Real en hardware real (`luigi_lab3`).

---

## 1. Visión General de la Cadena Técnica

Tridi convierte movimiento humano en video (o simulación física guiada por sensores) en **datos corregidos por física** y **políticas neuronales entrenadas (`ONNX`)** listas para ejecutarse tanto en humanoides (`Unitree G1`, `Unitree H1`) como en robots físicos embebidos (`luigi_lab3`).

| Etapa | Carpeta | Entrada | Salida | Verificación automática |
| :--- | :--- | :--- | :--- | :--- |
| **1. Captura 2.0 (Video y Cámara)** | `data/`, `data/live/`, `data/capture2/` | Video `.mp4`/`.mov` o cámara web / iPhone por QR (`30 fps`) | `PoseClip` v2 (`.json` + `.npz`): 33 puntos MediaPipe + cuerpo SMPL-X (`GVHMR`) + manos 3D de 21 puntos (`WiLoR`) + contacto de pies | `npm --prefix data/live run check && npm --prefix data/live run check-relay` |
| **2. Física, Retargeting y Gemelos Digitales** | `physics/` | `PoseClip` v2 o modelo MJCF (`.xml` + mallas `.stl`) | `RobotMotion` (`physics/motions/*.json`), simulación MuJoCo WASM a `500 Hz` (`dt = 2 ms`) y render Three.js a `60 fps` | `npm --prefix physics run check` (12 suites) |
| **3. Entrenamiento RL (PPO) y Entrega** | `training/` | `RobotMotion` + modelo MuJoCo + 4 mundos con perturbaciones | Políticas `ONNX` (`50 Hz`, `< 1 ms`), rollouts (`dataset.zip`) y paquete de entrega (`delivery.json`, `replay.json`) | `uv run --project training python -m training.ppo --help` |
| **4. Aplicación Web Interactiva** | `web/` | Políticas `ONNX`, `RobotMotion`, videos y simulador MuJoCo WASM | SPA bilingüe ES/EN (`#/`, `#/milestones`, `#/simulations`, `#/simulations/luigi_lab3`, `#/delivery`, `#/live`, `#/upload`) | `npm --prefix web run check && npm --prefix web run build` |

---

## 2. Captura 2.0 (`data/`): Cuerpo Completo en Coordenadas de Mundo + Manos de 5 Dedos

1. **Reconstrucción 3D en coordenadas de mundo (`data/capture2/gvhmr_mac.py`):**
   - Usa **GVHMR** sobre Apple Silicon (`mps`/`cpu`) para estimar la pose SMPL-X y la trayectoria global de la pelvis sin que el sujeto patine ni pierda escala cuando camina de frente o gira.
2. **Manos 3D de 21 articulaciones (`data/capture2/wilor_mac.py`):**
   - Extrae las 21 articulaciones 3D de cada mano con **WiLoR** y las fusiona en el `PoseClip` v2 (`data/capture2/to_poseclip.py`).
3. **Cámara en vivo y Teléfono por QR (`data/live/` + `data/relay.py`):**
   - Filtra puntos con **One Euro Filter**, corrige inversiones izquierda/derecha (`check-facing.mjs`), recupera la profundidad del codo por longitud ósea (`check-bones.mjs`) y transmite frames del teléfono a la Mac por WebSocket (`/live/{id}/ws`).

---

## 3. Motor Físico, Retargeting y Políticas (`physics/` + `training/`)

### 3.1 Humanoides (`Unitree G1` y `Unitree H1`)
- **Retargeting Cinemático (`physics/src/retarget.js`, `physics/src/ik.js`):**
  - Convierte el `PoseClip` a las 29 articulaciones del `Unitree G1` con `< 3,2 cm` de error mediano, plantado de pie de apoyo sin deslizamiento (`physics/src/root.js`), separación mínima entre manos (`HANDS_APART_M = 0.145 m` en `physics/src/clearance.js`) y manos diestras Inspire de 5 dedos (`physics/models/inspire/hands.json`, error `< 2 cm` en puntas de dedos).
- **Postura Erguida y Estabilidad (`physics/src/sim.js`, `physics/src/policy.js`):**
  - Rigidez de seguimiento de orientación de pelvis `kpRot = 420`, `kdRot = 48` y aislamiento de `waist_pitch_joint` (`índice 14`) frente a residuales fuera de distribución, manteniendo la inclinación del torso en caminata `< 9°` y superando los 9 checks de `check-mimic.mjs`.
- **9 Políticas ONNX Preentrenadas (`training/policies/`):**
  - Equilibrio `g1-stand` (300 M pasos en 4 mundos: `plano`, `piedras`, `resbaloso`, `viento`; soporta empujones de 250–350 N desde los 4 lados).
  - Imitación: `g1-walk`, `g1-run`, `g1-jacks`, `g1-saludar`, `g1-dedos`, `g1-bailar`, `g1-frente`, `g1-sentarse` y `h1-walk`.

### 3.2 Primer Caso de Estudio Físico Sim-to-Real: Robot Explorador Diferencial (`luigi_lab3`)

Documentado en detalle en [`docs/decisiones/2026-11-07-primer-sim-to-real-luigi.md`](../decisiones/2026-11-07-primer-sim-to-real-luigi.md) y desplegado en `#/milestones` y `#/simulations/luigi_lab3`:

1. **Hardware Físico Real (Luigi D'Aquaro):**
   - Chasis diferencial impreso en 3D (6 piezas CAD STL en `physics/models/luigi_lab3/meshes/`), microcontrolador **Arduino UNO (ATmega328P, 16 MHz, 2 KB SRAM)**, puente H **L298N**, 2 motores TT 200 RPM con llantas TPU, baterías 2S 18650 (`7,4–8,4 V`), ultrasonido **HC-SR04** (`TRIG D9`, `ECHO A1`) y sensor óptico I2C **APDS-9960** (`0x39`, clon con Chip ID `0x9E`).
2. **Gemelo Digital MuJoCo (`physics/models/luigi_lab3/{luigi.xml,scene.xml}`):**
   - Incluye las 6 mallas STL reales, baterías 18650, disipador L298N, cilindros HC-SR04, PCB APDS-9960, arnés de cables Dupont 3D y una arena cerrada de **3,4 m × 3,4 m** con obstáculos sólidos.
   - Simula en tiempo real (`physics/src/policy.js`, `physics/src/viewer.js`) el abanico de **7 rayos ultrasónicos/IR** (±24° renderizados en 3D en verde lima → ámbar → rojo según distancia) y la máquina de evasión en 4 fases.
3. **Política ONNX Transpilada a C Nativo (`entregable-luigi/robot_tridi_autonomo/robot_tridi_autonomo.ino`):**
   - La red `luigi-lab3.onnx` (`obs[7] → Dense(7→16, tanh) → Dense(16→16, tanh) → Dense(16→2, tanh)`) corre directamente en el ATmega328P a **50 Hz (`dt = 20 ms`)** usando solo **461 bytes de RAM (22 %)** y **8.516 bytes de Flash (26 %)**.
   - **Dos hallazgos reales de hardware resueltos en campo:**
     - **Congelamiento por `pulseIn()` (`47,1 ms`):** Reemplazado por una interrupción de cambio de pin en hardware (`ISR(PCINT1_vect)` en `A1/PCINT9`), reduciendo el bloqueo de CPU de `47.100 µs` a **`< 4 µs`**.
     - **Clon `APDS-9960` con `Chip ID = 0x9E`:** La librería oficial de SparkFun rechazaba el sensor porque exigía `0xAB`; escribimos un driver I2C directo a registros (`0x80 ENABLE`, `0x8F CONTROL`, `0x9C PDATA`) a `40 Hz` como radar secundario de proximidad IR.

---

## 4. Arquitectura de la Web (`web/`) y Rutas Principales

Construida en JavaScript modular + Three.js + MuJoCo WASM + Vite (`web/`), con internacionalización instantánea sin recarga (`html[data-lang="en"|"es"]`, verificada por `web/scripts/check-i18n.mjs` sobre **586 claves** en 10 diccionarios):

| Ruta | Archivo Principal | Qué muestra y cómo funciona |
| :--- | :--- | :--- |
| **`#/` (Landing)** | `web/src/screens/home.js` | Escena 3D interactiva del Unitree G1 (rotación libre con `cursor: grab !important`), demostración de las 3 etapas (*Capture → Gym → Policy*), slider de fuerza de empujones (`0–500 N`) y salto directo a prueba en vivo (`#try`). Al regresar desde `#/simulations/luigi_lab3`, restaura automáticamente el `Unitree G1` y protege `dressTelemetry` (`web/src/landing/telemetry.js`) mientras carga el modelo. |
| **`#/milestones` (`#/avances`)** | `web/src/screens/milestones.js` | Barra segmentada con **Hito 02 · Caso Real Sim-to-Real (Nov 2026)** (videos reales `luigi-sim2real.mp4` y `luigi-hardware.mp4`, galería de 6 tarjetas CAD vs. fotos reales, desglose de las 4 etapas y botón directo a `#/simulations/luigi_lab3`) e **Hito 01 · Origen en Platanus Hack 26 (Oct 2026)** (video oficial del pitch `platanus-pitch.mp4`). |
| **`#/simulations`** | `web/src/screens/simulations.js` | Laboratorio completo: selector de robot (`Unitree G1` vs. `Luigi Lab3`), galería separada entre ejemplos precargados (entrenados) y capturas del usuario (entrenables con configuración de pasos PPO, empujones y 4 mundos), selector de mundo (`Plano`, `Piedras`, `Resbaloso`, `Viento`) y escena (`Calle`, `Cocina`, `Oficina`). |
| **`#/simulations/luigi_lab3`** | `web/src/screens/simulations.js` | Carga automáticamente el gemelo digital `luigi_lab3` en vista de solo-robot, posiciona la cámara en perspectiva 3/4 de la arena de 3,4 m × 3,4 m y habilita en la barra derecha el panel de telemetría a 50 Hz y control **Drive & ONNX Policy** (`🤖 ONNX Patrol`, `⬆️ Forward`, `⬇️ Reverse`, `⬅️ Turn Left`, `➡️ Turn Right`, `⏹ Stop`). |
| **`#/delivery/<clip_id>`** | `web/src/screens/delivery.js` | Panel de entrega al cliente: curva de aprendizaje por checkpoint, visualización de la política en los 4 mundos y descarga directa de `policy.onnx`, `motion.json`, `poseclip.json` y `dataset.zip`. |

---

## 5. Playbook de Calidad y Auditoría Obligatoria antes de cada Merge/Deploy

Documentado en [`docs/audit-playbook.md`](../audit-playbook.md) y en el skill [`.claude/skills/tridi-quality/SKILL.md`](../../.claude/skills/tridi-quality/SKILL.md):

1. **Checks automáticos en terminal (0 fallos permitidos):**
   ```bash
   npm --prefix physics run check
   npm --prefix data/live run check && npm --prefix data/live run check-relay
   npm --prefix web run check
   npm --prefix web run build
   ```
2. **Invariantes visuales y de física (`/tridi-craft-audit` y `/tridi-release-audit`):**
   - `0` errores en consola y `0` errores de página al navegar `#/` → `#/milestones` → `#/simulations` → `#/simulations/luigi_lab3` → `#/`.
   - `CLS = 0 px` en tarjetas de telemetría (`.luigi-tel-card` con altura fija `62px` y `font-variant-numeric: tabular-nums`) y píldora de velocidad (`#speed` `68px`).
   - Alturas de columnas alineadas al píxel tanto a `100 %` como a `67 %` de zoom.
   - Todos los `<canvas>` 3D interactivos con `cursor: grab !important` en reposo y `cursor: grabbing !important` al arrastrar.
