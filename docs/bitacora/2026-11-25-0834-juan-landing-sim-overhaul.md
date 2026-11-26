---
persona: Juan
rama: juan/studio-overhaul
sesion: 2026-11-25-0834-tridi-landing-overhaul
inicio: 2026-11-25 08:34
estado: cerrada
---

# Overhaul de Simulación, Mundo 3D, Continuidad de Landing e Investigaciones (M1–M5)

## Objetivo

Corregir la inclinación lateral del torso en `g1-stand.onnx` (R1), reemplazar el entorno 3D poligonal de la landing (`#/`) por un mundo arquitectónico profesional (R2), lograr continuidad cinematográfica en una sola toma con animación fluida de redespliegue tras caídas (R4), documentar las 3 investigaciones técnicas solicitadas (R1–R3) y sincronizar la documentación en 2 capas dejando todo en `juan/studio-overhaul` para revisión local antes de `scripts/ship.sh` (R5).

## Qué se hizo

- **Política `g1-stand.onnx` recta y guardarraíl de regresión (`training/` + `physics/`):**
  - Agregada recompensa `STANCE_STRAIGHT` en `training/env.py` (`waist_roll=10.0`, `waist_yaw=2.0`, `torso_upright=0.25` sobre `torso_link`) y flag `--reward straight` en `training/ppo.py`.
  - Fine-tuning `stand-straight-v1` (12 M de pasos desde `training/runs/stand-300m/step_300000000.pt`, fila 50 en `training/experiments.csv`) sobre los 4 mundos (`plano`, `piedras`, `resbaloso`, `viento`), seleccionando `training/runs/stand-straight-v1/step_1000000.pt` y exportando `training/policies/g1-stand.{onnx,json}` (`274.751 B`, `obs_dim=96`, `nu=29`, `worlds: ["plano", "piedras", "resbaloso", "viento"]`).
  - Agregado guardarraíl en `physics/scripts/check-policy.mjs` (`MAX_TILT_DEG = 1.0`) que exige `|waist_roll_joint| < 1,0°` y `|torso_lateral_tilt| < 1,0°` durante `0..20 s` en reposo además de `4/4` recuperaciones ante empujones de `150 N` y `250 N`.
- **Nuevo mundo 3D exclusivo de la landing (`web/src/landing/world*.js`):**
  - Creados `world.js` (728 líneas), `world-textures.js` (723), `world-buildings.js` (420) y `world-foliage.js` (348) con plaza/calle arquitectónica al crepúsculo (`Sky` + `FogExp2` + `twilight-horizon-skirt` + `PMREMGenerator` desechado tras generar el entorno), texturas PBR procedurales cacheadas en sesión (`canvasCache`), edificios con shader parallax interior, árboles ramificados (`CatmullRomCurve3` + follaje `InstancedMesh`) y autos EV sin primitivas poligonales ni luces con sombra extra.
  - Desacoplado estrictamente de `web/src/landing/city.js` (que sigue intacto para `#/simulations` vía `web/src/looks/index.js`), respetando `KEEP_CLEAR` (`x ∈ [-9, 12], z ∈ [-7, 5.8]`) / `STAGE_CLEAR` (`x ∈ [-9, 15], z ∈ [-7.5, 6.2]`) y `undress()` con `dispose()` completo de geometrías, materiales, texturas e `InstancedMesh`.
- **Continuidad cinematográfica en una sola toma y Telemetry Redeploy (`web/src/screens/home.js`, `web/src/landing/telemetry.js`, `physics/src/{viewer,sim,index}.js`):**
  - Conectado `dressLandingWorld` en `home.js` con iluminación armonizada; `view.viewer.snapOnTeleport = false` en la landing (manteniendo `true` como default para Studio).
  - Eliminados los cortes por `controls.target.set`, `forceReset` y `GYM_RESTART_S`; transiciones suaves `blendPose` (SLERP de cuaterniones) entre `#home ↔ #capture ↔ #gym (10M/100M/300M sin reset) ↔ #policy ↔ #teams`, `lenisScrollTo` con `lenis.reset()` para clics rápidos y `reducedMotionQuery` dinámico.
  - En `physics/src/index.js` (`createSimView.playClip` + `smoothClip` con `WeakSet` `smoothedMotionSet`), agregados `time` inicial atómico, `autoAdvance` (`true` por defecto para Studio) y exposición de la trayectoria suavizada cacheada para que `home.js` (`#capture`) comparta exactamente la misma trayectoria en `blendPose` y `playClip` y cierre cualquier salto en retroceso (`walk.dir < 0`) o wrap de bucle (`recenterWalkLoop`).
  - Reemplazado el reseteo instantáneo tras caída (Hero y Gym) por **Telemetry Redeploy** cancelable en 4 fases (`1.080 ms` tras `FLOOR_SETTLE_MS = 1.050 ms`): `dematerialize` (`280 ms`, fade + emisivo `--signal` `#c8ff2e` + anillo de escaneo en `telemetry.js`) → `reset` invisible en `knees_bent` → `materialize` (`540 ms`, despliegue `knees_bent → home`) → `handoff` (`260 ms`, `releasePuppet({ resetPolicy: true, syncPrevious: true })`).
- **Tres investigaciones técnicas documentadas y sincronización de 2 capas (`docs/`):**
  - [`docs/investigacion-ajuste-incremental-politicas.md`](../investigacion-ajuste-incremental-politicas.md) (R1): diagnóstico de `g1-stand`, comparativa de KL-PPO, Adaptador Residual por Slice, Tronco Congelado y LoRA sobre los 17 ops de `onnx-lite.js`/`export_mcu.py`.
  - [`docs/investigacion-entornos-3d-locales-desde-fotos.md`](../investigacion-entornos-3d-locales-desde-fotos.md) (R2): arquitectura local en 4 etapas sin LLMs externos (`Apple M2 16 GB` vs GPU CUDA `12–24 GB`) para Street View e interiores → `.glb` + MuJoCo `<pair>`.
  - [`docs/investigacion-tracking-articulaciones-humanoides.md`](../investigacion-tracking-articulaciones-humanoides.md) (R3): auditoría completa (`17/33/127/2×21` → `22` 2D / `41+42` `SkeletonView` → `29` G1 / `19` H1), concluyendo `SÍ` en suficiencia bruta (`75` pts) y detallando 4 ajustes arquitectónicos.
  - Actualizados [`docs/README.md`](../README.md), [`docs/estado.md`](../estado.md), [`docs/architecture-and-sim2real.md`](../architecture-and-sim2real.md) y [`docs/ROADMAP.md`](../ROADMAP.md).

## Qué funcionó

- `npm --prefix physics run check` pasó las **13 suites** (incluyendo `check-policy.mjs` con `max |waist_roll| = 0.44 deg < 1.0 deg`, `max |torso_lat| = 0.27 deg < 1.0 deg`, `4/4` empujones `150 N` y `250 N`).
- `training/runs/stand-straight-v1/evals.csv` registró `20.00 of 20.00: the whole task is learned` en `1.003.520` pasos y mantuvo `20.00 of 20.00` hasta `12.001.280` pasos.
- `npm --prefix web run check` pasó con **`12` diccionarios, `719` claves ES/EN, `500` lookups** y `17` clips pre-cargados traducidos.
- `npm --prefix web run build` compiló `web/dist` limpio (`108 MB` totales, `og.png` en `285 KB`, archivo mayor `mujoco.wasm` en `10 MB` bajo el límite de `25 MiB` de Cloudflare Pages).
- Pre-Commit Delta Audit (`craft`, `data`, `cache`, `perf`, `motion` sobre `git diff --name-only`) cerró con **0 bloqueantes P0/P1** y aislamiento estricto en `juan/studio-overhaul` (cero cambios en `landing.css`, `city.js`, `street.js`, `looks/` o pantallas internas de Studio); las validaciones de M2 (`0` fugas GPU, `33–35` draws, `20` `InstancedMesh.dispose()`) y M3 (`0` saltos de cámara y redeploy fluido) quedaron aprobadas en sus hitos previos.

## Qué no funcionó / Hallazgos resueltos en el camino

- Durante los últimos 10 M del run histórico `stand-300m` (`training/experiments.csv:49`), omitir `--worlds` sobrescribió `step_300000000.pt` solo con `plano` y fijó el sesgo lateral de `waist_roll` (mientras `ret_norm` seguía saltado para `stand` en `training/ppo.py:380`). Quedó documentado en R1 para activar `ret_norm` + `L_KL` en futuros fine-tunings.
- En el mundo 3D y continuidad de la landing se resolvieron antes de cerrar M2/M3: llamada explícita a `InstancedMesh.dispose()`, ajuste del radio de `twilight-horizon-skirt` (`80 < camera.far 100`), `lenis.reset()` en clics rápidos de navegación, lectura dinámica de `prefers-reduced-motion` y guardia `if (redeploy) return;` en `runGym()`.
- **Hallazgo Challenger M5 (teletransporte `9,54 m → 10,20 m` al subir `#gym → #capture` con `walk.dir < 0`, más salto secundario `0,6614 m` de `smoothForDisplay` y wrap en `#capture`):** al entrar a `walk` hacia atrás (`walk.t = walkDuration()`), `playClip()` dejaba `loop = true`, `clipTime = 0` y `autoAdvance = true` antes de `seek(walk.t)`, de modo que el `rAF` interno de `createSimView` (`physics/src/index.js`) envolvía `clipTime` por módulo `% clip.duration` al frame siguiente antes de `updateWalk()`, y al terminar `blendPose` también existía una diferencia de `0,6614 m` entre el clip crudo y `smoothForDisplay({ plantFeet: 'auto' })` además del `snapFollow()` al reiniciar el bucle en `#capture`. Resuelto con `playClip(motion, { loop: false, autoAdvance: false, offset: walkOffset, time: walk.t })`, `view.smoothClip(motion)` (sin doble suavizado vía `WeakSet`) y `recenterWalkLoop()` con `smoothBlendDur()` (`max dPelvis = 0,0507 m` en scroll fluido y `0,1359–0,2552 m` en saltos/wraps de bucle).

## Decisiones

- Mantener `web/src/landing/world*.js` aislado de `city.js` (`#/simulations`) y dejar `snapOnTeleport = true` como default en `RobotView` para no alterar ninguna pantalla de Studio ni vistas responsivas (R5).
- Seleccionar `training/runs/stand-straight-v1/step_1000000.pt` para `g1-stand.onnx` porque conservó el mejor balance entre verticalidad (`< 0,5°`) y supervivencia en los 4 mundos frente a checkpoints posteriores (`8M–12M`).
- No ejecutar `git commit` final, `scripts/ship.sh`, `merge` ni `push` a `main` hasta que Juan revise manualmente en local.

## Sigue

- Verificación manual en navegador por Juan sobre `juan/studio-overhaul` (`npm --prefix web run preview -- --host`) revisando la landing (`#/`), postura del robot, mundo 3D, continuidad entre secciones y Telemetry Redeploy.
- Siguiente etapa (pantallas internas / vistas responsivas si queda ajuste pendiente) y `scripts/ship.sh` a `main` tras aprobación explícita de Juan.
