# Plan v3 — Tridi Hardware Assembler & Self-Serve Sim-to-Real

**Fecha:** 9 de noviembre de 2026  
**Autores:** Juan Villa, Pastor Jiménez, César Martínez, Alejandro Hernández  
**Origen:** Aprendizajes directos tras el primer caso Sim-to-Real físico (`luigi_lab3`), entrega del nuevo diseño físico con cuello servo (`luigi_lab4`) y sesión de estrategia de producto del equipo.

---

## 1. El aprendizaje clave y el verdadero "Aha! Moment" de Tridi

Al llevar Tridi del navegador al piso real con el robot de Luigi ([`docs/internal/caso-luigi-sim2real.md`](internal/caso-luigi-sim2real.md)), descubrimos dos verdades fundamentales sobre el mercado de Physical AI:

1. **El dolor real está en la brecha entre los componentes físicos y la simulación:**
   - Incluso un robot móvil sencillo tiene decenas de detalles físicos que rompen el código de libro de texto: zona muerta de fricción de las llantas de TPU (`PWM < 115`), bloqueo de `47,1 ms` en `pulseIn()` del `HC-SR04`, clones I2C (`APDS-9960` con `Chip ID = 0x9E`) y conflictos de timers en el microcontrolador (en `luigi_lab4`, usar `<Servo.h>` secuestra el `Timer1` del ATmega328P y apaga el PWM en los pines `D9` y `D10`, obligando a mover `ENB` a `D6`).
   - Hoy nosotros hicimos ese ensamblaje y calibración a mano para Luigi en una noche. **Para que Tridi sea escalable y comercializable a cualquier empresa o creador de hardware, ese flujo tiene que ocurrir directo dentro de la plataforma web.**
2. **Por qué Luigi sintió que *"no es como su profesora lo evalúa"* (y qué nos enseña sobre el usuario):**
   - Un estudiante universitario es evaluado por una rúbrica académica que espera ver un `if (distancia < 20) girar()` con `delay(350)`. Cuando le entregas una red neuronal a `50 Hz` con interrupciones de hardware (`ISR(PCINT1_vect)`) y registros I2C crudos, el robot funciona 10 veces mejor en el piso, pero él no sabe cómo explicárselo a su profesora.
   - **El "Aha! Moment" de Tridi:** ocurre en el instante en que un ingeniero o builder **sube su propio archivo CAD (`.zip` / `.stl` / `.step`) + su código (o sin código)**, ve su robot cobrar vida con física real en el navegador en menos de 2 minutos, lo entrena y descarga un paquete que **corre a la primera en su hardware real** (con un modo explicable/modular o política neuronal pura según lo que necesite).

---

## 2. Qué vamos a construir: Tridi Hardware Assembler (`#/assembler`)

Convertir el trabajo artesanal que hicimos en `luigi_lab3` en un producto **self-serve** dentro de `trytridi.com`:

### Etapa 1 — Subida de Hardware (CAD + Código opcional)
El usuario arrastra un `.zip` (como nos mandó Luigi en `LAB3` y `LAB4`) que contiene:
- **Mallas 3D:** `.stl`, `.step`, `.obj` o `URDF`/`MJCF` (ej. `1_chasis_robot.stl` ... `7_cabeza_sensor_servo.stl`).
- **Código o especificación (opcional):** archivo `.ino`, `.py`, `.cpp` o descripción de componentes.

### Etapa 2 — Reconocimiento de Piezas y Catálogo de Hardware Pre-Calibrado
La página inspecciona las piezas 3D y el código (si lo subió) y abre un **asistente interactivo de ensamblaje** que pregunta o confirma pieza por pieza:
- **Chasis y distribución de masa:** dimensiones, peso estimado, material (`PLA`, `TPU`, aluminio).
- **Actuadores y motores:**
  - Si detecta ruedas diferenciales → modelo de motor (`TT Gearmotor 200 RPM`, `NEMA 17`, `BLDC`), voltaje de batería (`2S 18650 7.4V`), driver (`L298N`, `TB6612FNG`) y pines PWM/dirección.
  - Si detecta torreta/articulación extra (como `7_cabeza_sensor_servo.stl` en `luigi_lab4`) → servo (`SG90 180°`, `MG996R`), eje de giro y rango angular.
  - Si detecta morfología bípeda/humanoide → mapeo automático de las articulaciones al esqueleto estándar de Tridi (`G1` / `H1`).
- **Sensores:** ubicación y orientación en el chasis, modelo exacto (`HC-SR04`, `APDS-9960`, `VL53L0X LiDAR`, `CNY70`, IMU) y pines asignados.

### Etapa 3 — Inferencia Automática del Entrenamiento (Con o Sin Código)
- **Si el usuario subió código (`.ino` / `.py`):** Tridi extrae el mapa de pines, detecta cuellos de botella de hardware (como `pulseIn()` bloqueante, `delay()` en el lazo de control o conflictos de `Timer1` con `Servo.h`) y entrena una política que cumple el objetivo del código sin sus bloqueos.
- **Si el usuario NO subió código (solo el modelo 3D):** Tridi infiere el currículo de entrenamiento por la morfología del robot:
  - **Humanoide / Bípedo:** `1. Equilibrio de pie (Stand)` → `2. Recuperación de empujones` → `3. Caminata / Imitación desde video (Tridi Capture)`.
  - **Móvil diferencial / Explorador (`Lab 3` / `Lab 4`):** `1. Locomoción suave superando fricción estática` → `2. Escaneo activo con cuello servo (si tiene torreta)` → `3. Evasión de obstáculos en lazo cerrado`.
  - **Brazo / Manipulador:** `1. Alcance articular` → `2. Agarre con fricción seca y resbalosa`.

### Etapa 4 — Compilador Sim-to-Real y Entrega Dual
Al terminar el entrenamiento en MuJoCo, `#/delivery` entrega:
1. **Gemelo Digital MuJoCo (`robot.xml` + `scene.xml`)** listo para probar en vivo en el navegador o conectar por **WebSerial USB**.
2. **Política neuronal (`policy.onnx` + `policy.json`)** lista para correr a `50 Hz`.
3. **Firmware Nativo No-Bloqueante (`.ino` / `.c` + Guía de Calibración):**
   - Código C/Arduino limpio, comentado línea por línea (para que cualquier ingeniero o estudiante entienda cada bloque y pueda defenderlo o ajustarlo), con interrupciones de hardware preconfiguradas y compensación de zona muerta de PWM.

---

## 3. Primer caso de prueba del Assembler: `luigi_lab4` (Robot Explorador con Escaneo Activo)

Ya archivamos en el repositorio ([`physics/models/luigi_lab4/`](../physics/models/luigi_lab4)) todos los archivos del **Laboratorio 4** de Luigi para usarlo como caso cero del Assembler:

- **Qué cambia respecto a `luigi_lab3`:**
  - Suma una **7.ª pieza CAD** ([`7_cabeza_sensor_servo.stl`](../physics/models/luigi_lab4/assets/7_cabeza_sensor_servo.stl)): una torreta rotatoria impulsada por un micro-servo **SG90** en el pin `D9` ("cuello" que gira de `0°` derecha a `180°` izquierda pasando por `90°` frente).
  - Como `<Servo.h>` usa `Timer1` (inhabilitando PWM en `D9` y `D10`), el puente H `L298N` pasa a usar `ENA=D5, IN1=D7, IN2=D8` (izquierdo) y `ENB=D6, IN3=D11, IN4=D12` (derecho), mientras el `HC-SR04` pasa a `TRIG=D2, ECHO=D3` (ambos pines con interrupción externa nativa `INT0` / `INT1` en el Arduino UNO).
  - **Oportunidad perfecta para Tridi:** en el código base de Lab 4 ([`LAB4_Robot_Explorador_Autonomo.ino`](../physics/models/luigi_lab4/firmware/LAB4_Robot_Explorador_Autonomo.ino)), el robot tiene que **frenar en seco y esperar `700 ms` quieto** cada vez que mueve el cuello para mirar a los lados. Con una política de Tridi en `luigi_lab4`, el servo puede escanear de forma continua mientras el robot sigue rodando con curvas diferenciales suaves y usando `INT1` (`D3`) sin detener el lazo de 50 Hz.

---

## 4. Orden de ejecución propuesto (Siguientes Pasos en `main`)

| Paso | Responsable | Entregable |
| --- | --- | --- |
| **1. Gemelo digital y policy de `luigi_lab4`** | Pastor + Juan | Armar `physics/models/luigi_lab4/luigi_lab4.xml` con la articulación revoluta del cuello (`SG90` + `7_cabeza_sensor_servo.stl`), entrenar `luigi-lab4.onnx` (control coordinado de ruedas + ángulo de escaneo del cuello) y generar el `.ino` no bloqueante con `INT1` en `D3`. |
| **2. Catálogo de componentes de hardware (`physics/components/`)** | Pastor | Definir el esquema JSON de piezas reutilizables (motores DC/TT, servos SG90, sensores `HC-SR04` / `APDS-9960` / `CNY70`, drivers `L298N`, articulaciones G1/H1) con sus masas, inercias, zonas muertas y pines. |
| **3. Pantalla `#/assembler` (MVP Web Assembler)** | César + Juan | Interfaz donde el usuario sube sus `.stl` + `.ino` opcional, visualiza las piezas en 3D, responde las preguntas de componentes/pines y lanza la simulación/entrenamiento en MuJoCo. |
| **4. Primeros Early Adopters con hardware propio** | Ale + Equipo | Probar el flujo self-serve con estudiantes/laboratorios de robótica y equipos que tengan robots móviles, brazos o humanoides para medir el tiempo desde "subo mi CAD" hasta "corre en mi robot físico". |
