# Plan de Producto y Pipeline de Tareas — Tridi (Noviembre 2026)

> **Propuesta inicial para iterar en equipo (Juan, Pastor, César y Ale):**  
> Este documento reúne las ideas que hemos hablado por voz y chat para bajar Tridi a tierra como un producto real.  
> **Cómo usamos este archivo:** Igual que hicimos en Platanus Hack, **cada tarea tiene un único dueño y toca archivos separados** para que nadie pise el código de otro y las IAs de cada uno sepan exactamente qué construir. **Nada está escrito en piedra:** pásenle este archivo a su IA, véanlo y si alguien quiere cambiar, sumar o intercambiar una tarea, lo ajustamos entre todos.

---

## 1. La Visión General vs. Cómo bajamos Tridi a tierra hoy

**La visión general:**  
Cualquier sistema robótico o línea de automatización física que tenga motores/actuadores, sensores y tiempos reales puede ser simulado y entrenado por Tridi. Eso nos abre **4 verticales claras**:

1. **Robots móviles y logística de almacén (AMR / estilo robots de Amazon que mueven anaqueles / rovers como los de Luigi):** robots que navegan pisos reales, esquivan obstáculos o mueven estantes y cargas de un punto a otro sin chocar ni frenarse por bloqueos de sensores.
2. **Pipelines de fábricas, empaquetadoras y líneas cronometradas:** celdas industriales con varios pasos secuenciales (cintas transportadoras, brazos posicionadores, llenado y cierres en tiempos exactos) donde hoy un pequeño cambio de fricción, peso o retardo de un sensor traba toda la línea.
3. **Brazos robóticos y manipulación:** agarre de objetos rígidos y líquidos (como nuestra prueba de la taza con agua en seco vs. jabonoso) para clasificación y empaque.
4. **Robots humanoides aprendiendo de video humano (`Tridi Capture` — `Unitree G1 / H1`):** convertir un video de celular en políticas de cuerpo completo y manos de 5 dedos.

**Por qué esto vuelve a Tridi un negocio viable desde ya (y no un side project eterno):**  
Llegarle mañana en frío a Tesla Optimus o Figure desde Venezuela sin un portafolio previo es casi imposible. En cambio, en nuestra propia ciudad y región **sí hay fábricas (empaquetadoras, alimentos, café), talleres de automatización, universidades y agencias de robótica** con máquinas reales. Si Tridi resuelve la simulación y calibración física de cualquier máquina o robot, podemos conseguir clientes y casos reales desde ahora mismo mientras avanzamos con YC.

```
CANAL A — De Videos de Internet a Habilidad General       CANAL B — Tu Máquina/Robot y Código a Sim-to-Real (Tridi Assembler)
  100–10.000 videos de internet de una misma acción         Subes el CAD de tu robot/celda (.stl/.step) + tu código (.ino/.py/PLC)
  (distintos ángulos, frenadas, esquives, tropiezos)                                       │
                 │                                                                         ▼
                 ▼                                           Gemelo digital MuJoCo calibrado con motores, sensores y tiempos reales
   Extracción masiva 3D + manos (GVHMR + WiLoR)                                            │
                 └──────────────────────────────┬──────────────────────────────────────────┘
                                                ▼
                      MOTOR TRIDI (MuJoCo + Entrenamiento Multi-Clip en GPU)
            Combina todos los videos + casos borde (obstáculo cruzándose, cambio de piso,
            frenada de emergencia, motor/pata dañada) hasta consolidar 1 sola política robusta
                                                │
                                                ▼
                                     ENTREGA SIM-TO-REAL
                   1. Política neuronal generalista (ONNX a 50 Hz) + Dataset físico
                   2. Puente en vivo por WebSerial USB desde el navegador
                   3. Controlador / firmware nativo calibrado (.ino / C / Python) sin bloqueos
```

### Por qué una habilidad real requiere Múltiples Videos de Internet + Casos Borde (y la diferencia entre Entorno Abierto vs. Fábrica)

- **Escalar con videos de internet, no grabándonos nosotros:** Nosotros no podemos grabarnos 10.000 veces. La verdadera escala de Tridi está en tomar **cientos o miles de videos de internet** de una misma habilidad (ej. personas caminando en distintos ángulos, frenando porque alguien se atraviesa, esquivando un obstáculo, subiendo un desnivel) y entrenar **una sola política generalista** que combine todo ese conocimiento, sumándole en MuJoCo fallos extremos (¿qué pasa si se atraviesa algo de golpe?, ¿qué pasa si un motor pierde fuerza o se daña una pata?).
- **Por qué hoy en 2026 las grandes empresas siguen usando teleoperación (control remoto) en humanoides, y dónde entra Tridi:**
  - Soltar un humanoide de 50 kg con una red neuronal pura en un entorno libre lleno de gente todavía es peligroso si la red solo aprendió a caminar recto en un piso vacío. Por eso incluso los gigantes siguen teleoperando en demos públicas.
  - **En humanoides (entorno abierto):** Tridi les resuelve justamente el entrenamiento en los miles de casos borde (frenar, esquivar, cojear si falla un actuador) que necesitan superar en simulación antes de apagar el control remoto.
  - **En fábricas, empaquetadoras y almacenes (entorno controlado):** A diferencia de un humanoide en la calle, una línea de empaquetado o un robot de almacén opera en un espacio cerrado, predecible y seguro. Ahí nuestras políticas se pueden desplegar **100 % autónomas hoy mismo sin peligro**.

---

## 2. Qué hicimos exactamente con el robot de Luigi (`luigi_lab3`)

Para que todos tengamos claro el flujo técnico que queremos automatizar en la web:

1. **Lo que ya tenía Luigi:** Su robot armado con **6 piezas CAD (`.stl`)** y su **programa en Arduino (`robot_gestos_original.ino`)** con los movimientos que él había programado (avanzar con dos motores en un puente H `L298N`, medir distancia con el ultrasónico `HC-SR04` y usar el sensor óptico `APDS-9960`).
2. **Por qué fallaba en el piso real:** Las llantas de TPU no vencían la fricción estática con `PWM < 115`, el comando `pulseIn()` congelaba el procesador por `47,1 ms` en cada lectura sin eco, y la librería estándar apagaba su sensor `APDS-9960` porque era un clon con `Chip ID = 0x9E`.
3. **Lo que hizo Tridi:** Conectamos sus piezas `.stl` a nuestra simulación en MuJoCo (`luigi.xml`), **reentrenamos en física real los mismos movimientos que él quería hacer** con una política a **50 Hz (`luigi-lab3.onnx`)** y le devolvimos el programa calibrado para su Arduino (`robot_gestos.ino`, ocupando solo 461 bytes de RAM, con interrupción `PCINT1` no bloqueante y radar IR directo a 40 Hz).

---

## 3. Pipeline de Tareas (1 Tarea = 1 Persona, sin pisarnos archivos)

Igual que en la hackathon: **una sola persona por tarea** y cada área en sus propios archivos/carpetas. Si alguien quiere intercambiar una tarea con otro o proponer una distinta después de analizarlo con su IA, lo cambiamos aquí.

### 🟧 Juan (`web/` visual & landing, `training/` GPU & compiladorMCU, `data/`)

| ID | Tarea | Archivos / Carpeta | Qué entrega |
| --- | --- | --- | --- |
| **J-1** ✅ | **Pulido visual de Landing, Simulaciones y `#/milestones` (Listo)** | `web/src/screens/home.js`, `web/src/landing/`, `web/src/screens/simulations.js`, `web/src/stage.js`, `web/src/screens/delivery.js` | Refinados todos los detalles visuales en desktop y móvil (`trytridi.com`), footer de la landing más amplio sin colisión, controles de Simulaciones contextualizados (agarre líquido solo en Cocina, botón Empujar solo en humanoide con física, sin selector redundante en Playback, sin Vereda, nombres claros `Rover Luigi v1/v2` y `Política activa (cerebro ONNX)`), postura erguida en `#/delivery` y guía de preparación industrial ZAKA en `docs/internal/`. |
| **J-2** ✅ | **Pipeline en GPU Cloud + Entrenamiento Multi-Video con Casos Borde (Listo)** | `training/multiclip.py`, `training/cloud_gpu.sh`, `training/env.py`, `training/imitate.py`, `training/ppo.py` | (1) `resolve_clips()` + muestreo adaptativo ponderado por fallos (`clip_fail_ema`) sobre múltiples clips simultáneos (`all-walks`, `all-g1` o carpetas de videos), (2) inyección de fallas de actuador (`--fault-prob`: un motor de pierna pierde 25–65 % de torque) y frenadas de emergencia por obstáculo (`--sudden-stop-prob`: pausa de 1–2 s a mitad de caminata) y (3) script `training/cloud_gpu.sh` para correr en GPU Cloud con pre-flight C1/C2. |
| **J-3** ✅ | **Compilador automático `ONNX → C / Arduino (.ino)` (Listo)** | `training/export_mcu.py`, `physics/models/luigi_lab4/firmware/LAB4_Tridi_Autonomo.ino`, `physics/models/luigi_lab3/firmware/robot_gestos_onnx.ino` | Compila cualquier grafo `.onnx` (`luigi-lab3`, `g1-stand`, `g1-walk`) a C99 (`tridi_policy_forward`) con paridad numérica $< 10^{-5}$ verificada con `clang` vs `onnxruntime`, valida conflictos de hardware (`Timer1 <Servo.h>` vs PWM en `D9/D10`), genera `ISR` no bloqueante (`INT0/INT1` o `PCINT1` en vez de `pulseIn`), barrido radar asíncrono del servo SG90 y compensación de zona muerta (`PWM 115..200`). |
| **J-4** ✅ | **Entrenamiento de la policy `luigi-lab4.onnx` (Escaneo activo en movimiento) (Listo)** | `training/luigi_lab4_env.py`, `training/policies/luigi-lab4.*`, `physics/models/luigi_lab4/firmware/LAB4_Tridi_Autonomo.ino` | Entorno MuJoCo `LuigiLab4Env` (`obs_dim=18, nu=3`) + política `luigi-lab4.onnx` (2.353 bytes) que coordina las 2 ruedas diferenciales + el barrido activo del cuello servo SG90 (`96,06°` de cobertura sin frenar), verificada en `onnx-lite.js` (`check-assembler.mjs`) y transpilada a C99 en `LAB4_Tridi_Autonomo.ino` con `export_mcu.py`. |

---

### 🟦 Pastor (`physics/` motor y catálogo de hardware, backend/sistema del Assembler)

| ID | Tarea | Archivos / Carpeta | Qué entrega |
| --- | --- | --- | --- |
| **P-1** ✅ | **Catálogo de Componentes de Hardware (`physics/components/`) (Listo)** | `physics/components/catalog.json`, `physics/components/index.js`, `physics/models/components/*.xml` | Esquema JSON determinista, **14 escenas MuJoCo 3D individuales** (`nq=1, nu=1`) para previsualizar cada placa/sensor/actuador, y API CRUD (`listComponents`, `getComponent`, `registerComponent`, `removeComponent`, `validateHardwarePinout`) uniendo física MuJoCo con reglas MCU (`deadzone_pwm: 115`, conflicto `Timer1` `<Servo.h>` vs PWM en `D9/D10`, interrupciones `INT0/INT1` vs `PCINT`). |
| **P-2** ✅ | **Gemelo Digital MuJoCo de `luigi_lab4` (Robot con cuello servo SG90) (Listo)** | `physics/models/luigi_lab4/luigi_lab4.xml`, `physics/models/luigi_lab4/scene.xml`, `physics/src/`, `web/src/stage.js` | Modelo MuJoCo (`nq=10, nu=3`) con las 7 mallas `.stl` de Lab 4, articulación revoluta del cuello (`neck_servo_joint`, `±90°` rad) con `7_cabeza_sensor_servo.stl` y sensor `HC-SR04` cuyo cono de rayos gira solidario con el cuello en tiempo real, conectado también en `#/simulations/luigi_lab4`. |
| **P-3** ✅ | **Motor del `Assembler`: Generador automático de MuJoCo XML desde piezas subidas (Listo)** | `physics/src/assembler.js`, `data/server.py` (`GET/POST /components`) | Parser determinista de `.ino` (`parseArduinoSketch`: detecta MCU `arduino_uno/esp32/plc`, drivers `l298n/tb6612fng`, pines, `<Servo.h>`, `pulseIn` y `delay`), clasificador de mallas `.stl` (`classifyStlMeshes`: rovers + celdas industriales) y generador automático `generateMujocoXml` validado en MuJoCo WASM (`check-assembler.mjs`). |
| **P-4** ✅ | **Escena de prueba de Celda Industrial / Empaquetadora en MuJoCo (Listo)** | `physics/models/factory_cell/factory_cell.xml`, `physics/models/factory_cell/scene.xml`, `training/policies/factory-cell.onnx` | Celda industrial en MuJoCo (`nq=10, nu=3`) con cinta transportadora (`conveyor_feed_joint`), cilindro neumático desviador (`pusher_slide_joint`), prensa selladora vertical (`sealer_press_joint`), política cerrada `factory-cell.onnx` sincronizada por sensores ópticos (`0 %` merma) y simulador interactivo de falla de cinta vs. PLC por timer fijo en `#/simulations/factory_cell`. |

---

### 🟩 César (`web/src/screens/` — Pantallas de aplicación aisladas de la landing)

| ID | Tarea | Archivos / Carpeta | Qué entrega |
| --- | --- | --- | --- |
| **C-1** | **Pantalla Web del `Tridi Assembler` (`#/assembler`)** | `web/src/screens/assembler.js`, `web/src/screens/strings/assembler.js` (nuevos) | Interfaz self-serve donde el usuario sube su `.zip` (`.stl` + `.ino` opcional), previsualiza las piezas 3D y selecciona en cada pieza qué motor, sensor y pines usa (leyendo el catálogo `P-1` de Pastor) para lanzar la simulación. |
| **C-2** | **Mejora de `#/delivery`: Descarga Dual (ONNX + Código Nativo Explicable)** | `web/src/screens/delivery.js`, `web/src/screens/strings/delivery.js` | Agregar en la pantalla de entrega de robots físicos la pestaña para ver y descargar el código `.ino` / C generado por `J-3`, con explicación bloque por bloque para que cualquier ingeniero o estudiante entienda qué hace cada parte. |
| **C-3** | **Selector de vertical en `#/simulations` (Humanoides · Rovers · Fábrica)** | `web/src/screens/simulations.js`, `web/src/stage.js` | Organizar el selector de modelos en Simulaciones por categoría (`Humanoides: G1 / H1`, `Robots Móviles: Luigi Lab 3 / Lab 4`, `Industrial`) para que no quede como una lista plana cuando sumemos más máquinas. |

---

### 🟨 Ale (`docs/`, `yc/` — Lógica de Negocio, Economía de Planta y Clientes Reales)

| ID | Tarea | Archivos / Carpeta | Qué entrega |
| --- | --- | --- | --- |
| **A-1** | **Arquitectura de Casos Industriales (Fábricas, Empaquetadoras y Almacenes)** | `docs/verticales-industriales.md` (nuevo) | Traducir cómo funciona una línea real (empaquetadora con pasos cronometrados, embotelladora o robots de almacén) a especificaciones concretas para nosotros: qué pasos tiene el ciclo, dónde se traba hoy por culpa de `delays` fijos o sensores, y qué métrica (cajas/minuto, % de merma) le importa al dueño de la fábrica. |
| **A-2** | **Unit Economics y Modelo de Precios de Tridi (B2B / Agencias / Fábricas)** | `docs/unit-economics.md` (nuevo) | Definir la estructura financiera del producto: cuánto nos cuesta una corrida de GPU en la nube vs. cómo cobramos en cada escalón (cobro por robot/celda calibrada en el Assembler, membresía para agencias de robótica, contratos de datos para humanoides). |
| **A-3** | **Directorio y Contacto de Primeros Clientes / Robots Reales (Pipeline Comercial)** | `docs/clientes-potenciales.md` (nuevo) | Lista accionable de: (1) 5 equipos/laboratorios con robots físicos listos para meter en `#/milestones` ya mismo, (2) 10 agencias/integradores de robótica y (3) 5 plantas/empaquetadoras locales donde podamos ver una línea real en persona, más el mensaje corto de entrada con `trytridi.com/#/milestones`. |
| **A-4** | **Narrativa de Evolución Post-YC y Guion de Casos Reales** | `yc/entrevista.md` | Actualizar la preparación de entrevista de YC W27 con nuestra evolución desde el 2 de noviembre: cómo pasamos de "solo video para humanoides" a resolver Sim-to-Real físico en hardware real (`luigi_lab3`, `luigi_lab4`, `Tridi Assembler` y automatización industrial). |

---

## 4. Cómo analizar este plan con tu IA (Prompt para el equipo)

Cuando hagas `git pull` en `main`, pásale este prompt a tu agente (Claude Code / Antigravity / Cursor):

```text
Lee `docs/ROADMAP.md`, `docs/README.md` y `docs/internal/README.md`.
Soy [Pastor / César / Ale / Juan]. Hazme un resumen de:
1. Cómo quedó planteada la visión de Tridi (los 2 canales de entrada y las 4 verticales, incluyendo robots móviles y líneas de fábricas/empaquetadoras).
2. Cuáles son mis tareas asignadas (`P-*`, `C-*`, `A-*` o `J-*`), qué archivos exactos me toca crear o editar para no chocar con los demás, y dime qué ideas o mejoras le propondrías tú a este plan antes de empezar a programar.
```
