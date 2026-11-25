# Radar Técnico y Herramientas Externas — Tridi

> **Propósito:** Mantener un registro vivo y evaluado de proyectos open-source, librerías o herramientas externas que pueden **complementar** el motor físico, los ensambladores (`#/assembler`) o las 3 verticales de **Tridi** sin desviarnos del roadmap activo ([`ROADMAP.md`](ROADMAP.md)).
> **Regla:** Solo entran herramientas verificadas en código (licencia, madurez, qué cubren realmente y cómo encajan en nuestra arquitectura determinista).

---

## 1. Orbe (`orbefab/orbe`) — Simulador Eléctrico + Emulador de MCU (AVR / ESP32)

| Campo | Detalle |
| :--- | :--- |
| **Repositorio upstream** | `https://github.com/orbefab/orbe` (`https://orbefab.com/orbe`) |
| **Fork interno (Pastor)** | `https://github.com/Torpass/orbe` |
| **Fecha de evaluación** | 25 de noviembre de 2026 (`v0.3.0`, creado el 1 nov 2026) |
| **Stack y compilación** | Rust puro (`unsafe_code = "forbid"`), CLI *headless* para agentes IA + visor 3D + compilación a **WASM** (`packages/wasm`). |
| **Licencia** | **`MIT OR Apache-2.0`** (compatible comercialmente con Tridi; solo las imágenes precompiladas de ejemplo en `blocks/` enlazan cores Arduino LGPL). |
| **Relación con Tridi** | **Complemento directo para Vertical 2 (Rovers y Mecatrónica).** No compite con Humanoides, MuJoCo/RL ni Plantas Industriales P&ID/PLC. |
| **Estado en Tridi** | **En radar (Fase 1 / evaluación ligera).** No bloquear `P-1` (P&ID imágenes/VLM) ni validación ZAKA (`A-1`). |

### Qué hace realmente (verificado en su repo)
1. **Solver de circuitos eléctricos (DC + transitorio):** Calcula voltajes, corrientes, nodos flotantes, caídas de tensión en fuentes y violaciones de límites eléctricos (ej. LEDs sobrecorriente o *brownout* de fuente cuando un servo `SG90` arranca y tumba `VCC < 3.0 V`).
2. **Emulación de microcontroladores instrucción por instrucción:** Ejecuta binarios reales compilados por `arduino-cli` o `ESP-IDF` (`.hex` / `.elf`) sobre:
   - `ATmega328P` (`packages/cores/avr` + `packages/socs/microchip`) → Arduino UNO y Nano.
   - `ESP32-S3` (`packages/cores/xtensa` + `packages/socs/espressif`) → en progreso activo.
3. **Catálogo trazado a datasheets (`parts/*/part.jsonc`):** ~96 piezas electrónicas con pines, ratings y referencias exactas a hojas de datos (`uno-board`, `nano-board`, `esp32s3-devkitc-1`, `servo-sg90`, `oled-ssd1306`, `bmp280`, relés, MOSFETs, breadboards).
4. **Flujo *agent-first*:** Comandos deterministas por CLI (`orbe check`, `orbe lint`, `orbe nets`, `orbe test`, `orbe open --headed`) con tests reproducibles (`tests/*.test`).

### Por qué complementa a Tridi (sin solape con nuestro core)
- **Qué cubre Tridi hoy en Vertical 2 (`physics/src/assembler.js`, `physics/components/catalog.json`):** análisis estático de `.ino` por regex (`pulseIn`, `delay`, `Timer1` vs `<Servo.h>`), catálogo cinemático de 14 componentes, física multicuerpo 3D en **MuJoCo (`500 Hz`)**, entrenamiento RL/ONNX y generación de C99 (`training/export_mcu.py`).
- **Qué NO cubre Tridi hoy y Orbe sí resuelve:** verificar que el circuito real no quema componentes ni sufre caídas de tensión, y ejecutar el binario `.hex` real compilado para validar comportamiento eléctrico de pines y timers antes de flashear el hardware.
- **Qué NO cubre Orbe (y es el core de Tridi):** física mecánica 3D de cuerpos rígidos (gravedad, fricción TPU, colisiones, torque, chasis `.stl`), entrenamiento de políticas neuronales (`ONNX`), captura humana (`Unitree G1`/`H1`) y automatización industrial (`P&ID → ISA-5.1 + 3D + PLC`).

### Limitaciones actuales de Orbe a vigilar (`v0.3.0`)
- Proyecto muy joven (lanzado en noviembre 2026); sus crates `orbe-model` y `orbe-mcu` están marcados como `0.x` inestables.
- **Piezas que aún faltan para casos tipo `luigi_lab3`/`luigi_lab4`:** puente H `L298N` / `TB6612FNG`, sensor ultrasónico `HC-SR04`, óptico `APDS-9960` y motores DC reductores `TT`.

### Cómo podemos aprovecharlo en Tridi (de menos a más)
1. **Corto plazo — Verificador de humo en CI / local para `export_mcu.py`:** Probar los `.ino` generados por Tridi compilados con `arduino-cli` dentro del CLI de `orbe` para validar que el firmware ATmega328P corre sin bloqueos ni conflictos eléctricos en pines/servo (`SG90`).
2. **Corto plazo — Referencia de arquitectura de catálogo y GTM (`J-1`):**
   - Adoptar en [`physics/components/catalog.json`](../physics/components/catalog.json) su disciplina de trazabilidad a datasheets reales y ratings eléctricos.
   - Evaluar contacto / demo colaborativa con el autor de Orbefab (*"Orbe valida el circuito y firmware → Tridi simula la física 3D y entrena el control"*).
3. **Mediano/largo plazo (solo si Vertical 2 escala comercialmente) — Co-simulación `orbe-wasm` + `MuJoCo WASM`:** Acoplar el solver WASM de Orbe con MuJoCo en `#/simulations` para lograr un gemelo electromecánico completo en el navegador (binario `.hex` → pines PWM/Servo → actuadores MuJoCo → sensores MuJoCo → pines MCU).
