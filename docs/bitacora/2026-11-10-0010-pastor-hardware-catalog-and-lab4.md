# Bitácora: Catálogo de Hardware (`P-1`), Gemelo `luigi_lab4` (`P-2`), Motor del Assembler (`P-3`) y Celda Industrial (`P-4`)

- **Persona:** Pastor (`@torpass`)
- **Rama:** `pastor/hardware-catalog-and-lab4`
- **Fecha:** 2026-11-10 00:10

## Qué se hizo

1. **`P-1` — Catálogo de Componentes de Hardware (`physics/components/catalog.json` y `physics/components/index.js`):**
   - Se diseñó e implementó el catálogo determinista de componentes de hardware combinando fuentes de pines/metadatos electrónicos (estilo Wokwi/Fritzing) con parámetros físicos MuJoCo (`damping`, `armature`, `kp`/`kv`, `ctrlrange`, `forcerange`, masas, inercias y conos de rayos) y las calibraciones reales de Sim-to-Real medidas en piso (`deadzone_pwm: 115`, conflicto `Timer1` de `<Servo.h>` en `D9/D10`, interrupciones `INT0/INT1` vs `PCINT`).
   - Se implementó la API CRUD en `physics/components/index.js` (`listComponents`, `getComponent`, `getPreset`, `registerComponent`, `removeComponent`, `validateHardwarePinout`) y los endpoints REST `GET /components` y `POST /components` en `data/server.py`.
2. **`P-2` — Gemelo Digital MuJoCo de `luigi_lab4` (`physics/models/luigi_lab4/luigi_lab4.xml` y `scene.xml`):**
   - Se inspeccionaron las cotas exactas de las 7 mallas `.stl` en `physics/models/luigi_lab4/assets/` (chasis extendido a `180 mm` con ranura del servo `SG90` centrada en `X = 165 mm` = `0.330 m` en marco CAD y `7_cabeza_sensor_servo.stl` con origen en el eje del servo).
   - Se armó `luigi_lab4.xml` (`nq = 10, nu = 3`) respetando el orden de articulaciones igual al de `<actuator>` (`qpos[7]` = rueda izquierda, `qpos[8]` = rueda derecha, `qpos[9]` = `neck_servo_joint`) y se conectó en `physics/src/load.js`, `physics/src/policy.js` (donde el cono ultrasónico gira con `qpos[9]`) y `physics/src/index.js`.
3. **`P-3` — Motor del `Assembler` (`physics/src/assembler.js`):**
   - Se implementó `parseArduinoSketch()` para extraer pines (`ENA`, `ENB`, `IN1..IN4`, `TRIG`, `ECHO`, `SERVO`), periféricos y bloqueos (`pulseIn` y `delay()`) directamente desde archivos `.ino` reales (verificado contra `LAB4_Robot_Explorador_Autonomo.ino`).
   - Se implementaron `classifyStlMeshes()` y `generateMujocoXml()` para generar `robot.xml` y `scene.xml` válidos en MuJoCo WASM desde piezas `.stl` + selección de componentes del catálogo `P-1`.
4. **`P-4` — Escena de Celda Industrial / Empaquetadora (`physics/models/factory_cell/factory_cell.xml` y `scene.xml`):**
   - Se construyó una celda industrial en MuJoCo (`nq = 10, nu = 3`) con cinta transportadora (`conveyor_feed_joint`), cilindro neumático desviador (`pusher_slide_joint`), prensa selladora vertical cronometrada (`sealer_press_joint`) y sensores ópticos de línea.
5. **Verificación automática (`physics/scripts/check-assembler.mjs`) y visor local (`physics/index.html`):**
   - Se agregó `check-assembler.mjs` a `npm --prefix physics run check` y se corrieron todos los checks (`npm --prefix physics run check && npm --prefix web run check && npm --prefix web run build`) pasando con 0 errores.
   - Se actualizó el sandbox de desarrollo de `physics/` (`physics/index.html`, `physics/src/main.js`, `physics/src/style.css`) con selector en vivo entre `Unitree G1`, `Luigi Lab 4 (P-2)`, `Celda Industrial (P-4)` y `Luigi Lab 3`, más un drawer interactivo para probar el CRUD del catálogo (`P-1`) y la compilación `.ino + .stl -> MuJoCo XML` (`P-3`).

## Qué funcionó y qué se ajustó

- Al correr por primera vez `check-assembler.mjs` en MuJoCo WASM, detectamos que si `head_neck_link` se declaraba antes de `left_wheel_link` en `<worldbody>`, el cuello quedaba en `qpos[7]` mientras su actuador estaba en `ctrl[2]`. Reordenar `head_neck_link` después de `right_wheel_link` dejó alineados `qpos[7..9]` con `ctrl[0..2]` tanto para el control directo como para `observeStand()` en `policy.js`.

## Qué sigue

- Juan ya tiene desbloqueado `physics/models/luigi_lab4/scene.xml` (`nq=10, nu=3`) para entrenar `luigi-lab4.onnx` (`J-4`).
- César ya puede importar `HARDWARE_CATALOG`, `listComponents`, `registerComponent`, `validateHardwarePinout`, `parseArduinoSketch` y `generateMujocoXml` desde `physics` para construir la pantalla `#/assembler` (`C-1`) y el selector de verticales (`C-3`).
