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
CANAL A — Video a Robot (Tridi Capture)          CANAL B — Tu Máquina/Robot y Código a Sim-to-Real (Tridi Assembler)
  Subes un video humano (celular/cámara)           Subes el CAD de tu robot/celda (.stl/.step) + tu código (.ino/.py/PLC)
                 │                                                                │
                 ▼                                                                ▼
   Esqueleto 3D + manos (GVHMR + WiLoR)             Gemelo digital MuJoCo calibrado con motores, sensores y tiempos reales
                 └──────────────────────────────┬─────────────────────────────────┘
                                                ▼
                              MOTOR TRIDI (MuJoCo + PPO/Imitación en GPU)
                       Practica millones de ciclos con fricción, masa y perturbaciones
                                                │
                                                ▼
                                     ENTREGA SIM-TO-REAL
                   1. Política neuronal ligera (ONNX a 50 Hz) + Dataset físico
                   2. Puente en vivo por WebSerial USB desde el navegador
                   3. Controlador / firmware nativo calibrado (.ino / C / Python) sin bloqueos
```

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
| **J-1** | **Pulido visual de Landing, Simulaciones y `#/milestones`** | `web/src/screens/home.js`, `web/src/landing/`, `web/src/screens/milestones.js` | Refinar todos los detalles visuales en desktop y móvil (`trytridi.com`), animaciones, copy y dejar lista la estructura para sumar nuevos casos reales (robots móviles y celdas de fábrica). |
| **J-2** | **Pipeline de entrenamiento acelerado en GPU Cloud** | `training/` | Montar el flujo para que los entrenamientos de políticas (tanto humanoides como robots/máquinas subidas por usuarios) corran a punta de GPU en la nube en **minutos en vez de horas** en local. |
| **J-3** | **Compilador automático `ONNX → C / Arduino (.ino)`** | `training/export_mcu.py` (nuevo) | Automatizar en un script lo que hicimos en el robot de Luigi: leer cualquier `policy.onnx` + el JSON de pines/motores del robot y generar automáticamente el archivo `.ino` / `.c` comentado, sin bloqueos (`ISR` en vez de `pulseIn`) y con compensación de zona muerta de PWM. |
| **J-4** | **Entrenamiento de la policy `luigi-lab4.onnx` (Escaneo activo en movimiento)** | `training/luigi_lab4_env.py`, `training/policies/luigi-lab4.*` | Una vez esté listo el XML de `luigi_lab4` (`P-2`), entrenar la red de 50 Hz que coordina las 2 ruedas + el cuello servo SG90 para que el robot escanee a los lados **mientras avanza** (sin frenar 700 ms como hace el código original de Lab 4). |

---

### 🟦 Pastor (`physics/` motor y catálogo de hardware, backend/sistema del Assembler)

| ID | Tarea | Archivos / Carpeta | Qué entrega |
| --- | --- | --- | --- |
| **P-1** | **Catálogo de Componentes de Hardware (`physics/components/`)** | `physics/components/` (nuevo) | Definir el sistema y esquemas JSON de piezas físicas reutilizables: motores (`TT 200 RPM`, `NEMA 17`, servos `SG90`), sensores (`HC-SR04`, `APDS-9960`, `CNY70`, sensores ópticos de línea/planta), drivers (`L298N`) y microcontroladores (`Arduino UNO`, `ESP32` con sus reglas de pines y timers). |
| **P-2** | **Gemelo Digital MuJoCo de `luigi_lab4` (Robot con cuello servo SG90)** | `physics/models/luigi_lab4/luigi_lab4.xml`, `physics/src/` | Usando las 7 mallas `.stl` que ya están en `physics/models/luigi_lab4/assets/`, armar el modelo MuJoCo con la nueva articulación revoluta de la cabeza (`7_cabeza_sensor_servo.stl`, `0°–180°`) y el sensor ultrasónico que gira junto con el cuello. |
| **P-3** | **Motor del `Assembler`: Generador automático de MuJoCo XML desde piezas subidas** | `physics/src/assembler.js` (nuevo), `data/server.py` | La lógica de sistema de la idea de Pastor: recibir un `.zip` con mallas `.stl` + la configuración de qué componente es cada pieza (del catálogo `P-1`) o el `.ino` del usuario, y generar automáticamente el `robot.xml` funcional en MuJoCo. |
| **P-4** | **Escena de prueba de Celda Industrial / Empaquetadora en MuJoCo** | `physics/worlds/` o `physics/models/factory_cell/` | Prototipo físico en MuJoCo de un pipeline de fábrica o almacén (ej. cinta + actuador posicionador + cierre cronometrado, o robot móvil llevando un anaquel) para demostrar que el mismo motor entrena automatización industrial. |

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
