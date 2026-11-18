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

Documentado en detalle en [`docs/caso-luigi-sim2real.md`](caso-luigi-sim2real.md) y desplegado en `#/milestones` y `#/simulations/luigi_lab3`:

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

## 4. Arquitectura de la Web (`web/`), Rutas Principales y Escenarios 3D con Tags en Vivo

Construida en JavaScript modular + Three.js + MuJoCo WASM + Vite (`web/`), con internacionalización instantánea sin recarga (`html[data-lang="en"|"es"]`, verificada por `web/scripts/check-i18n.mjs` sobre **590+ claves** en 11 diccionarios):

| Ruta | Archivo Principal | Qué muestra y cómo funciona |
| :--- | :--- | :--- |
| **`#/` (Landing)** | `web/src/screens/home.js` | Escena 3D interactiva del Unitree G1 (`Stand v2`), dropdowns `Product ▾` y `Studio ▾` con apertura por hover y tipografía unificada, demostración de las 3 etapas (*Capture → Gym → Policy*), slider de fuerza de empujones (`0–500 N`), matriz `.tries` con separación explícita por vertical (**Humanoides**: `Live Camera`, `Upload Video`, `Delivery & Code`; **CAD & P&ID**: `Factory Assembler`) y footer compacto en 1 barra. |
| **`#/milestones` (`Case Studies`)** | `web/src/screens/milestones.js` | Casos reales Sim-to-Real: **Caso 01 · Rover Luigi v1 & v2 (Arduino UNO + Radar Servo SG90)** (videos reales `luigi-sim2real.mp4` y `luigi-hardware.mp4`, galería CAD vs. fotos reales con `PhotoViewer` y lanzamiento a `#/simulations/luigi_lab3` o `#/simulations/luigi_lab4`), **Caso 02 · Celda Industrial y ZAKA (`P&ID .dxf → ISA-5.1 + 3D + PLC`)** e **Hito 00 · Origen en Platanus Hack 26** (`platanus-pitch.mp4`). |
| **`#/simulations`** | `web/src/screens/simulations.js` | Estudio 3D unificado: selector de modelo físico agrupado por vertical en orden lógico (`Unitree G1`, `Rover Luigi v1 — Lab 3`, `Rover Luigi v2 — Lab 4`, `Industrial Cell`), **entorno 3D de bahía/laboratorio/planta en todas las simulaciones** (`web/src/looks/index.js`), **tags 3D flotantes proyectados en tiempo real desde MuJoCo** y **barra narradora en vivo de 4 pasos** (`web/src/stage.js`, `web/src/strings-stage.js`). |
| **`#/assembler` (`Factory Assembler`)** | `web/src/screens/assembler.js` | Herramienta self-serve de 2 canales para **Plantas Industriales P&ID (`.dxf`)** y **Robots/Mecatrónica (`.stl + .ino`)**: flujo comercial de 2 pasos (*Progressive Disclosure*: Dropzone limpio `.dxf` → Hoja Ejecutiva de Ingeniería `FDS ISA-5.1 / ISA-88` con descarga en `.md`, tabla I/O en `.csv` para Excel, impresión PDF y acordeón técnico colapsable con tabla de direcciones PLC, bloques `.scl` / `.L5K`, esquema 2D y escena 3D MuJoCo `.xml`), presets en 1 clic y apertura directa en `#/simulations`. |
| **`#/delivery/<clip_id>`** | `web/src/screens/delivery.js` | Panel de entrega para **Humanoides y MCU**: curva de aprendizaje por checkpoint, visualización de la política en los 4 mundos y descarga directa de `policy.onnx`, `motion.json`, `poseclip.json`, `dataset.zip` y firmware C99 determinista (`.ino`), con enlace directo a `Factory Assembler` (`#/assembler`) para entregas de PLC industrial. |

### 4.1 Mapa 3D de Planta/Laboratorio, Tags 3D Flotantes y Narrador en Vivo (`web/src/looks/index.js`, `web/src/stage.js`)
- **Entornos 3D unificados (`web/src/looks/index.js`):**
  - Tanto `factory_cell` como `luigi_lab3`, `luigi_lab4` y `Unitree G1` (`empty`) cuentan con arquitectura 3D de laboratorio/planta en Three.js (columnas estructurales en H, cerchas de techo con luminarias LED industriales, rieles perimetrales con franjas de seguridad amarillo/señal y bahía de telemetría).
- **Proyección de Tags 3D en Tiempo Real (`web/src/stage.js`):**
  - El contenedor `.factory-3d-tags` se monta sobre `#robot` para **los 4 modelos físicos** y proyecta en cada frame (`requestAnimationFrame`) la posición 3D de los cuerpos de MuJoCo (`xpos`) a coordenadas 2D de pantalla (`Vector3.project(camera)`), sin transición CSS sobre `transform` para evitar rezago al rotar la cámara:
    - **`factory_cell`:** `[CV-101] Cinta`, `[CYL-201] Desviador`, `[PRS-301] Selladora`, `[PE-101..103] Sensores Ópticos`, `[PKG] Cajas`.
    - **`luigi_lab3` / `luigi_lab4`:** `[MCU] Arduino UNO · 50 Hz`, `[SR04] Radar Ultrasónico` (con distancia en `cm` y ángulo del servo `SG90` en `v2`), `[L298N] Rueda Izq (D5)` y `[L298N] Rueda Der (D6)`.
    - **`Unitree G1`:** `[G1-IMU] Torso · Pitch`, `[ONNX] Política 50 Hz`, `[MANO-I] Inspire 5-DoF`, `[MANO-D] Inspire 5-DoF`, `[PIE-I] Contacto` y `[PIE-D] Contacto`.
  - Además, cuando `attachStage()` recibe un `sim` cuyo modelo MuJoCo ya terminó de cargar antes del montaje del DOM, dispara inmediatamente `syncRobotMode()` para garantizar que los tags y la barra narradora aparezcan en el 100 % de las navegaciones.

---

## 5. Playbook de Calidad y Auditoría Obligatoria antes de cada Merge/Deploy

Documentado en [`docs/audit-playbook.md`](audit-playbook.md) y en el skill [`.claude/skills/tridi-quality/SKILL.md`](../.claude/skills/tridi-quality/SKILL.md):

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

---

## 6. Compilador Automático `ONNX → C / Arduino (.ino)` (`training/export_mcu.py`, Tarea `J-3`)

- **Ejecución:**
  ```bash
  uv run --project training python -m training.export_mcu --preset luigi_lab4
  uv run --project training python -m training.export_mcu --preset luigi_lab3
  ```
- **Qué hace internamente:**
  1. Lee cualquier grafo `.onnx` de Tridi (`Identity`, `Constant`, `Gemm`, `MatMul`, `Add`, `Sub`, `Mul`, `Div`, `Max`, `Min`, `Tanh`, `Relu`, `Elu`, `Sin`, `Cos`, `Clip`, `Slice`), extrae sus tensores como arreglos `static const float` y emite `tridi_policy_forward(const float* obs, float* ctrl)` en C99 sin memoria dinámica (`O(1)` SRAM).
  2. **Paridad numérica verificada:** antes de escribir el `.ino`, evalúa el grafo compilado contra `onnxruntime` sobre entradas aleatorias y verifica `max_abs_diff < 1e-5` (probado con `clang -O2`: `0.00e+00` en `luigi-lab3.onnx`, `1.19e-06` en `g1-stand.onnx` y `5.96e-07` en `g1-walk.onnx`).
  3. **Guardrails automáticos de hardware (`validate_hardware`):**
     - **Conflicto `Timer1` (`<Servo.h>` vs `D9/D10`):** en ATmega328P (`arduino_uno`), `<Servo.h>` secuestra `Timer1` e inhabilita `analogWrite()` en `D9` y `D10`. Si `servo_pin` está activo y `ENA` o `ENB` usa `D9`/`D10`, aborta con error explícito y exige mover `ENA/ENB` a `D5/D6` (`Timer0`), tal como hace el preset `luigi_lab4` (`ENA=5, ENB=6, SERVO=9`).
     - **Ultrasonido por interrupción de hardware (cero `pulseIn()`):** si `ECHO` está en `D2/D3` (`luigi_lab4`, `ECHO=3`), emite `attachInterrupt(digitalPinToInterrupt(PIN_ECHO), echoISR, CHANGE)` (`INT1`); si está en `A0..A5` (`luigi_lab3`, `ECHO=A1`), emite `ISR(PCINT1_vect)`.
     - **Barrido radar asíncrono del servo SG90 (`luigi_lab4`):** reemplaza `myServo.write(ang); delay(350);` por una máquina de estados a `50 Hz` (`RADAR_ANGLES = {90, 25, 90, 155}` cada `180 ms`) que actualiza `clearanceLeftCm`, `clearanceCenterCm` y `clearanceRightCm` mientras el robot sigue ejecutando la red neuronal cada `20 ms`.

---

## 7. Entrenamiento Multi-Video + Casos Borde y GPU Cloud (`training/multiclip.py`, Tarea `J-2`)

- **Verificación rápida y lanzamiento:**
  ```bash
  uv run --project training python -m training.multiclip --verify --clips all-walks
  ./training/cloud_gpu.sh walk-multiclip-v1 all-walks 50000000
  ```
- **Capacidades en `G1Env` (`training/env.py`) y `MimicEnv` (`training/imitate.py`):**
  1. **Resolución y muestreo multi-clip (`resolve_clips` + `clip_fail_ema`):** acepta un alias (`all-walks` con los 5 clips balanceados de caminata, `all-g1`), lista separada por comas (`caminar,frente,saludar`) o carpeta de `.json`. Mantiene una media móvil exponencial de fallos por clip (`clip_fail_ema`) y muestrea cada episodio con probabilidad $p_i \propto 0{,}30/N + 0{,}70 \cdot \text{fail\_ema}_i$ para concentrar los pasos de GPU en los clips donde el robot aún cae.
  2. **Inyección de falla parcial de actuador (`--fault-prob`, ej. `0.25`):** al iniciar un episodio, con probabilidad `fault_prob`, elige al azar un motor de las piernas (`hip`, `knee`, `ankle`, `wheel`) y degrada su ganancia y torque máximo (`actuator_gainprm`, `actuator_biasprm`, `actuator_forcerange`) por un factor uniforme en `[0.35, 0.75]`.
  3. **Frenada de emergencia por obstáculo (`--sudden-stop-prob`, ej. `0.20`):** programa un instante aleatorio dentro del episodio donde el tiempo de referencia `self.t` se congela durante `50–100 pasos` (`1,0–2,0 s` a `50 Hz`) y la referencia exige velocidad lineal/angular cero y postura erguida antes de reanudar la marcha.

---

## 8. Catálogo de Hardware (`P-1`), Gemelo `luigi_lab4` (`P-2`), Motor del Assembler (`P-3`) y Celda Industrial (`P-4`)

1. **Catálogo de Componentes de Hardware (`physics/components/catalog.json` + `physics/components/index.js`):**
   - Une en una sola fuente de verdad los parámetros físicos de MuJoCo (`mujoco`: `joint_type`, `damping`, `armature`, `kp`/`kv`, `ctrlrange`, `forcerange`, `mass_kg`, conos de rayos) y las restricciones eléctricas del microcontrolador (`mcu`: `deadzone_pwm: 115`, conflicto `Timer1` de `<Servo.h>` que inhabilita PWM en `D9/D10` en ATmega328P, e interrupciones externas `INT0/INT1` en `D2/D3` vs `PCINT`).
   - Expone CRUD en runtime (`listComponents`, `getComponent`, `getPreset`, `registerComponent`, `removeComponent`, `validateHardwarePinout`) y endpoints REST `GET /components` y `POST /components` en `data/server.py`.
2. **Gemelo Digital `luigi_lab4` (`physics/models/luigi_lab4/luigi_lab4.xml` y `scene.xml`):**
   - Modelo MuJoCo (`nq = 10`, `nu = 3`) con las 7 mallas `.stl` de Laboratorio IV.
   - Orden de articulaciones alineado con `<actuator>`: `qpos[7]` = `left_wheel_joint` (`ctrl[0]`), `qpos[8]` = `right_wheel_joint` (`ctrl[1]`), `qpos[9]` = `neck_servo_joint` (`ctrl[2]`, rango `[-1.5708, 1.5708] rad`).
   - En `physics/src/policy.js`, `scanWheeledSensors()` suma `qpos[9]` al ángulo de barrido del cono ultrasónico para que los 7 rayos de `RobotView` giren en vivo junto con la cabeza `7_cabeza_sensor_servo.stl`.
3. **Motor del `Tridi Assembler` (`physics/src/assembler.js`):**
   - `parseArduinoSketch(code)` extrae determinísticamente pines (`ENA`, `ENB`, `IN1..IN4`, `TRIG`, `ECHO`, `SERVO`), periféricos (`<Servo.h>`, `HC-SR04`, `APDS-9960`) y cuellos de botella bloqueantes (`pulseIn` de `47,1 ms` y `delay()`).
   - `classifyStlMeshes(files)` y `generateMujocoXml(config)` generan `robotXml` y `sceneXml` listos para cargar en MuJoCo WASM (`sim.files`).
4. **Celda Industrial de Empaque (`physics/models/factory_cell/factory_cell.xml`, `scene.xml` y `training/policies/factory-cell.onnx`):**
   - Escena industrial en MuJoCo (`nq = 10`, `nu = 3`) con cinta transportadora (`conveyor_feed_joint`), cilindro neumático desviador (`pusher_slide_joint`), cabezal sellador vertical (`sealer_press_joint`) y sensores ópticos de línea (`sensorEntry`, `sensorSealer`, `sensorExit`).
   - Política en lazo cerrado `training/policies/factory-cell.onnx` (`obs_dim = 18, nu = 3, robot = "factory_cell"`) e instrumentación `sim.factoryReadout` en `physics/src/policy.js`, con modo comparativo interactivo (`sim._factoryFixedTimerMode`) que contrasta un PLC tradicional por timer fijo (que aplasta cajas cuando patina la cinta) frente a la política Tridi sincronizada por sensores ópticos (`0 %` de merma).
5. **14 Escenas 3D Aisladas de Componentes (`physics/models/components/*.xml`):**
   - Todos los 14 componentes del catálogo (`arduino_uno`, `esp32_devkit_v1`, `plc_s7_1200`, `l298n`, `tb6612fng`, `tt_gearmotor_200rpm`, `sg90_servo`, `nema17_stepper`, `pneumatic_pusher_linear`, `hcsr04_ultrasonic`, `apds9960_optical`, `cny70_ir_reflective`, `wheel_tt_65mm_tpu`, `caster_front_patin`) tienen su propio modelo 3D interactivo (`nq = 1, nu = 1`) en MuJoCo WASM, conectado tanto en el Hardware Studio (`physics/src/main.js`) como en `web/` (`#/simulations/luigi_lab4`, `#/simulations/factory_cell`).
6. **Entrenamiento de `luigi-lab4.onnx` (`J-4` — `training/luigi_lab4_env.py`, `training/policies/luigi-lab4.onnx`):**
   - Entorno MuJoCo a 50 Hz (`obs_dim = 18`, `nu = 3`) y política ONNX (`2.353 bytes`, `max_diff = 0.00e+00` vs PyTorch/ONNXRuntime) que coordina las 2 ruedas diferenciales y el barrido activo del cuello servo SG90 (`96,06°` de amplitud en movimiento), compilada en `physics/models/luigi_lab4/firmware/LAB4_Tridi_Autonomo.ino` mediante `training/export_mcu.py --preset luigi_lab4`.
5. **Pipeline Industrial `P&ID (.dxf / .pdf / .jpg) → Documentación FDS ISA-5.1 + Escena 3D MuJoCo + Código PLC (.scl / .L5K)` (`physics/src/pid_assembler.js`, `data/pid_parser.py`, `training/export_plc.py`):**
   - Catálogo determinista `ISA-5.1` (`physics/components/isa_standard.json`: 16 clases de equipos `FV`, `WT`, `LT`, `LSH`, `LSL`, `PT`, `TT`, `FT`, `AT`, `M`, `P`, `TK`, `SL`, `SC`, `CV`, `PK`), extractor 100 % local en navegador para planos AutoCAD `.dxf`, `.pdf` vectoriales e imágenes `.jpg`/`.png` (`parseDxfPid`, `extractTextFromPdfBytes`, `extractBlueprintFromUpload`, `convertNodesToStrictDxf` con normalizador de alias reales `TANK`, `BV`, `PP`, `AOD`, `FILTER PRESS`, `SIR` y 6 planos `.dxf` `AC1009` con geometría 2D en `data/pid_samples/`), generador `ISA-5.1 / ISA-88` (`generateIsaEngineeringDocs` + `.csv` I/O `generatePlcIoCsv`), ensamblador 3D en MuJoCo (`generatePidMujocoXml`) y generador de bloques PLC (`generatePlcFlatFile` para `Siemens TIA Portal .scl` y `Rockwell Studio 5000 .L5K`), integrado en `#/assembler` (`web/src/screens/assembler.js`).
