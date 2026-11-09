# Roadmap de Producto y División de Tareas — Tridi (Noviembre 2026)

> **Para leer en 3 minutos (Juan, Pastor, César y Ale):**  
> Hacia dónde va Tridi como producto real, qué hicimos exactamente en el caso de Luigi, quiénes son nuestros clientes alcanzables paso a paso (sin depender de que Tesla o Figure nos respondan mañana) y la tabla de tareas abierta para dividirnos el trabajo.

---

## 1. Qué es Tridi hoy: Dos entradas, un mismo motor físico

Empezamos en la hackathon convirtiendo **video humano** en políticas para humanoides (`Unitree G1` / `H1`). Pero al resolver el robot físico de Luigi descubrimos una segunda entrada igual de potente y mucho más inmediata comercialmente.

Hoy Tridi tiene **dos canales de entrada** que alimentan el **mismo motor de simulación y entrenamiento (MuJoCo + RL en GPU + Sim-to-Real)**:

```
CANAL A — Video a Robot (Tridi Capture)          CANAL B — Tu Hardware y Código a Sim-to-Real (Tridi Assembler)
  Subes un video humano (celular/cámara)           Subes el CAD de tu robot (.stl/.step/URDF) + tu código (.ino/.py)
                 │                                                                │
                 ▼                                                                ▼
   Esqueleto 3D + manos (GVHMR + WiLoR)             Gemelo digital MuJoCo calibrado con tus motores y sensores reales
                 └──────────────────────────────┬─────────────────────────────────┘
                                                ▼
                              MOTOR TRIDI (MuJoCo + PPO/Imitación en GPU)
                       Practica millones de pasos con fricción, masa y perturbaciones
                                                │
                                                ▼
                                     ENTREGA SIM-TO-REAL
                   1. Política neuronal ligera (ONNX a 50 Hz) + Dataset físico
                   2. Puente en vivo por WebSerial USB desde el navegador
                   3. Firmware nativo calibrado (.ino / C / Python) listo para flashear
```

---

## 2. Qué hicimos exactamente con el robot de Luigi (`luigi_lab3`)

Para que todos lo expliquemos igual (a clientes, jueces de YC o agencias de robótica):

1. **Qué nos entregó Luigi:**
   - Sus **6 piezas CAD (`.stl`)** diseñadas para impresión 3D (chasis, soportes de motores TT, patín delantero, bandeja de protoboard, rines y llantas de TPU).
   - Su **programa original en Arduino (`robot_gestos_original.ino`)**, donde él ya había programado los movimientos que quería que hiciera el robot (avanzar con dos motores diferenciales en un puente H `L298N`, medir distancia con un ultrasónico `HC-SR04` y detectar obstáculos/gestos con un sensor óptico `APDS-9960`).
2. **Por qué el robot de Luigi no funcionaba bien en el mundo físico con su código original:**
   - **Problema físico 1 (Fricción y zona muerta):** En el piso real, las llantas de TPU con motores TT no se mueven con `PWM < 115`; el código clásico no compensaba esa zona muerta ni la inercia al frenar.
   - **Problema físico 2 (`pulseIn` bloqueante):** Cuando el `HC-SR04` no veía eco cercano, bloqueaba el procesador del Arduino por **47,1 ms**, dejando al robot ciego y sin control mientras rodaba.
   - **Problema físico 3 (Clon de hardware `0x9E`):** Su sensor `APDS-9960` físico tenía `Chip ID = 0x9E`; la librería estándar de SparkFun lo rechazaba y apagaba el sensor en silencio.
3. **Qué hizo Tridi:**
   - Armamos su **gemelo digital exacto en MuJoCo (`luigi.xml`)** con sus 6 mallas `.stl`, masas reales, llantas de TPU y rayos de sensores.
   - **Tomamos la lógica y los movimientos que él ya había programado** y los reentrenamos en simulación con nuestra política a **50 Hz (`luigi-lab3.onnx`)**, enseñándole a hacer curvas diferenciales suaves y una maniobra de esquive en 4 fases (freno activo en seco `-230 PWM` → reversa → giro de 90° → verificación de despeje).
   - **Transpilamos esa red neuronal y la calibración física de vuelta a su Arduino (`robot_gestos.ino`)** cabiendo en solo **461 bytes de RAM (22 % del Arduino UNO)**, reemplazando `pulseIn()` por una interrupción de hardware (`ISR(PCINT1_vect)` de `0,01 ms`) y leyendo el radar IR `0x9E` directo por registros I2C a `40 Hz`.
   - **Resultado:** El robot físico salió rodando a la primera por el piso de la sala esquivando zapatos, muebles, sofá y cables sin chocar ni una sola vez (videos en [`trytridi.com/#/milestones`](https://trytridi.com/#/milestones)).

---

## 3. Quiénes son nuestros clientes reales (Escalera de Mercado)

Llegarle mañana en frío desde Venezuela a **Tesla Optimus** o **Figure** sin tener antes un portafolio de hardware físico es casi imposible. Por eso nuestra estrategia comercial va de menor a mayor fricción en **3 escalones**:

| Escalón | Quién es el cliente | Qué problema le resolvemos hoy | Qué ganamos nosotros |
| --- | --- | --- | --- |
| **1. Corto plazo (Ahora mismo)**<br>Laboratorios universitarios, makers avanzados, estudios de mecatrónica y competencias | Estudiantes/profesores (como Luigi con Lab 3 y Lab 4) y equipos locales o remotos que ya tienen un robot armado (Arduino, ESP32, Raspberry, brazos SO-100, rovers) pero su código clásico falla en el piso real. | Nos pasan su CAD (`.stl`) + su código (`.ino`/`.py`) y les devolvemos el gemelo digital en MuJoCo + el código reentrenado con física real que sí funciona a la primera. | **Portafolio real de casos Sim-to-Real** en `#/milestones` + prueba de fuego para automatizar nuestros motores, sensores y compilador. |
| **2. Mediano plazo**<br>Agencias de robótica, integradores B2B y startups de robots móviles/brazos | Empresas que arman robots de almacén (AMR), inspección, agro o que compran robots comerciales (`Unitree Go2`, brazos robóticos) y pierden semanas calibrando controladores PID/estado a mano para cada cliente. | Una plataforma web (`Tridi Assembler`) donde suben el CAD + componentes de su robot, entrenan en nuestras GPUs en minutos y descargan el controlador ONNX / C calibrado para su terreno. | **Primeros ingresos recurrentes (SaaS / pago por entrenamiento en GPU)** y validación con empresas reales. |
| **3. Largo plazo (Meta YC)**<br>Empresas de Humanoides y Physical AI | Startups de humanoides y manipulación diestra (`Unitree G1/H1`, `1X`, `Figure`, laboratorios de RL). | Ya con un motor probado en decenas de robots físicos y un pipeline de entrenamiento masivo en GPU cloud, les vendemos **datos de movimiento corregidos por física (`Tridi Capture`)** y políticas entrenadas desde video humano. | **Contratos grandes de datos y políticas ($300k–$1M/año).** |

---

## 4. Cómo nos dividimos las tareas (Próximos Días)

> **Cómo funciona esta tabla:** Cada tarea tiene un **Responsable ideal** según el área que más domina cada uno, pero **cualquiera puede tomar o apoyar en cualquier tarea**. Solo avisen en el grupo cuál agarran y trabajen en su rama (`<nombre>/<tema>`).

### A. Producto Web, Pulido y Flujo "Subir tu Robot" (`web/`)

| ID | Tarea | Qué hay que hacer concreto | Ideal | Quién más puede |
| --- | --- | --- | --- | --- |
| **W-1** | **Pulido continuo de Landing y `#/milestones`** | Revisar detalles visuales en desktop y móvil (`trytridi.com`), fluidez de scroll, textos ES/EN y agregar la pestaña o sección del nuevo caso `luigi_lab4` cuando salga del piso. | **Juan** | César |
| **W-2** | **Prototipo de `Tridi Assembler` (`#/assembler` en la web)** | Crear la pantalla donde un usuario sube un `.zip` con sus piezas `.stl` y su código opcional (`.ino`/`.py`): mostrar las mallas 3D en el navegador y un formulario interactivo que pregunte qué motores, sensores y pines usa cada pieza. | **César / Pastor** | Juan |
| **W-3** | **Selector de modo de entrega en `#/delivery` (Política Neuronal vs Código Explicable)** | En la pantalla de entrega de un robot físico, permitir descargar tanto el `.onnx` puro como el `.ino` comentado paso a paso (para que un estudiante o ingeniero de una agencia entienda cada bloque de código). | **César** | Juan, Pastor |

### B. Física, Gemelos Digitales y Catálogo de Componentes (`physics/`)

| ID | Tarea | Qué hay que hacer concreto | Ideal | Quién más puede |
| --- | --- | --- | --- | --- |
| **P-1** | **Gemelo Digital de `luigi_lab4` (Robot con cuello servo SG90)** | Ya están los 7 archivos `.stl` y el `.ino` en [`physics/models/luigi_lab4/`](../physics/models/luigi_lab4). Armar `luigi_lab4.xml` en MuJoCo agregando la articulación revoluta de la cabeza (`7_cabeza_sensor_servo.stl`, giro `0°–180°`) y el rayo del `HC-SR04` que gira con el cuello. | **Pastor** | Juan |
| **P-2** | **Catálogo JSON de Componentes de Hardware (`physics/components/`)** | Estandarizar en archivos JSON los parámetros físicos que ya calibramos a mano: motores (`TT 200 RPM` con zona muerta `PWM 115`, `SG90 servo`), sensores (`HC-SR04` con cono y alcance, `APDS-9960`, `CNY70`), drivers (`L298N`) y microcontroladores (`Arduino UNO` con sus reglas de pines/timers). | **Pastor / Juan** | César |
| **P-3** | **Generador automático de `.xml` MuJoCo desde mallas subidas** | Script/módulo que tome las piezas `.stl` subidas en el Assembler + las respuestas del usuario sobre motores/sensores y genere automáticamente el `robot.xml` listo para simular en `physics/`. | **Pastor** | Juan |

### C. Entrenamiento en GPU y Compilador Sim-to-Real (`training/`, `data/`)

| ID | Tarea | Qué hay que hacer concreto | Ideal | Quién más puede |
| --- | --- | --- | --- | --- |
| **T-1** | **Reentrenar el movimiento de `luigi_lab4` (Escaneo activo sin frenar)** | En el código original de Luigi (`LAB4_Robot_Explorador_Autonomo.ino`), el robot tiene que **frenar en seco y quedarse quieto 700 ms** cada vez que mueve el cuello para mirar a los lados. Entrenar `luigi-lab4.onnx` para que escanee con el cuello en movimiento y generar su `.ino` no bloqueante (usando `INT1` en el pin `D3` y cuidando que `<Servo.h>` desactiva el PWM en `D9/D10`). | **Juan / Pastor** | — |
| **T-2** | **Pipeline de entrenamiento rápido en GPU Cloud (MJX / PyTorch CUDA)** | Preparar un script/notebook reproducible para correr `training/` en una GPU en la nube (RunPod / Modal / Colab GPU) de modo que entrenar una política nueva tome **minutos en vez de horas** en nuestras Macs. | **Juan** | Pastor |
| **T-3** | **Transpilador automático `ONNX` → C / Arduino (`.ino`)** | Convertir lo que hicimos en `robot_gestos.ino` en un script automático (`training/export_arduino.py`) que lea cualquier `policy.onnx` pequeña + el mapa de pines del robot y escupa el archivo `.ino` listo para compilar en Arduino IDE. | **Juan** | Pastor |

### D. Casos Reales, Clientes y Estrategia (`docs/`, `yc/`)

| ID | Tarea | Qué hay que hacer concreto | Ideal | Quién más puede |
| --- | --- | --- | --- | --- |
| **G-1** | **Probar `luigi_lab4` en el robot físico real y grabar el caso #2** | Cargar el nuevo `.ino` entrenado por Tridi en el robot naranja de Lab 4, grabarlo en el piso superando al código original y subirlo a `#/milestones`. | **Ale + Juan + Pastor** | César |
| **G-2** | **Conseguir los siguientes 2–3 robots físicos para el portafolio** | Contactar compañeros de electrónica/mecatrónica, laboratorios de universidades o agencias locales que tengan un robot móvil, brazo robótico o cuadrúpedo para pasarlos por Tridi y sumar casos reales distintos en `#/milestones`. | **Ale** | Todo el equipo |
| **G-3** | **Preparación de entrevista YC W27 y contacto con agencias de robótica** | Repasar [`docs/internal/yc-w27-reference.md`](internal/yc-w27-reference.md) y armar una lista de 15–20 startups/agencias pequeñas de robótica a las que podamos mostrarles el caso Sim-to-Real de `trytridi.com/#/milestones`. | **Ale / Pastor** | Juan, César |
