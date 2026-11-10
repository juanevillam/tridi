# 2026-11-10 03:38 — Juan — Mejoras aditivas sobre `P-1..P-4` (14 componentes 3D, `factory-cell.onnx` y conexión en `web/`)

- **Persona:** Juan (@juanevillam)
- **Rama:** `juan/experimental`
- **Tareas:** Mejoras aditivas sobre `P-1`, `P-2`, `P-3`, `P-4` y conexión en `web/` (`J-1`)

## Qué se hizo

1. **14 Modelos 3D Aislados en MuJoCo para todo el Catálogo (`P-1` — `physics/models/components/*.xml` y `physics/scripts/sync-hardware-catalog.py`):**
   - Sobre la base del catálogo de Pastor (`physics/components/catalog.json`), completamos las 6 escenas 3D dedicadas que faltaban (`esp32_devkit_v1.xml`, `plc_s7_1200.xml`, `tb6612fng.xml`, `apds9960_optical.xml`, `cny70_ir_reflective.xml`, `caster_front_patin.xml`) para que los **14 componentes** tengan su propio modelo 3D aislado (`nq = 1, nu = 1`) con geometría PCB/industrial realista y eje articulado interactivo.
   - Se añadió el preset `factory_cell` en `physics/components/catalog.json` para que el catálogo cubra tanto los robots móviles (`luigi_lab3`, `luigi_lab4`) como la línea industrial.

2. **Ampliación del Parser y Clasificador del `Assembler` (`P-3` — `physics/src/assembler.js`):**
   - `parseArduinoSketch` ahora detecta automáticamente el tipo de controlador (`esp32_devkit_v1`, `plc_s7_1200`, `arduino_uno`), el driver (`tb6612fng` vs `l298n`), motores paso a paso (`nema17_stepper`) y sensores reflectivos (`cny70_ir_reflective`).
   - `classifyStlMeshes` clasifica también piezas de celdas industriales (`linear_pusher`, `sealer_press`, `conveyor_carrier`).

3. **Política en Lazo Cerrado `factory-cell.onnx` y Simulador de Falla de PLC (`P-4` — `training/policies/factory-cell.*` y `physics/src/policy.js`):**
   - Exportamos `training/policies/factory-cell.onnx` + `factory-cell.json` (`obs_dim = 18, nu = 3, robot = "factory_cell"`).
   - En `physics/src/policy.js` (`isIndustrial`), instrumentamos los 3 sensores ópticos en vivo (`sensorEntry`, `sensorSealer`, `sensorExit` según el avance de la caja en la cinta `qpos[7]`), exponemos `sim.factoryReadout` y añadimos el modo comparativo `sim._factoryFixedTimerMode`: permite contrastar en vivo un PLC clásico por timer fijo (que baja la prensa a destiempo y aplasta cajas cuando patina la cinta) contra la política Tridi sincronizada por sensores ópticos (`0 %` de merma).

4. **Conexión de Políticas ONNX Reales en el Hardware Studio (`physics/src/main.js`) y en la Web (`web/`):**
   - En `physics/src/main.js` (pestaña 3 de Pastor), reemplazamos el oscilador senoidal de demostración por la carga real de `luigi-lab4.onnx`, `luigi-lab3.onnx`, `factory-cell.onnx` y `g1-stand.onnx` vía `view.loadPolicy()`, mostrando la distancia real por raycasting de MuJoCo y el botón de falla de PLC.
   - En `web/src/policies.js`, `web/src/strings-names.js`, `web/src/screens/simulations.js`, `web/src/stage.js` y `web/src/screens/milestones.js`, integramos `luigi_lab4` y `factory_cell` con rutas directas (`#/simulations/luigi_lab4`, `#/simulations/factory_cell`), telemetría dedicada en vivo y traducciones completas ES/EN.

## Verificación

- `npm --prefix physics run check` → **100 % verde** (incluyendo la verificación en `check-assembler.mjs` de las 14 escenas 3D de componentes y de `factory-cell.onnx`).
- `npm --prefix web run check && npm --prefix web run build` → **100 % verde** (`585 keys` ES/EN verificadas, build de producción en `587 ms`).
- **Fix de navegación entre links `#/simulations/<robot>` y deploy en vivo a `trytridi.com`:** corregida la condición de carrera en `stage.js`/`robot-host.js` al cambiar entre `#/simulations/luigi_lab3`, `#/simulations/luigi_lab4` y `#/simulations/factory_cell`, excluida la calle hueca del G1 (`looks/index.js`) en los 3 modelos, agregados botones de cambio rápido en `#luigi-sim-panel` y desplegado directamente a producción en Cloudflare Pages (`https://trytridi.com`).

## Qué sigue

- Cuando Juan tenga tiempo para la sesión visual dedicada, haremos el pase de UI/diseño sobre la landing y el resto de pantallas (`J-1`).
