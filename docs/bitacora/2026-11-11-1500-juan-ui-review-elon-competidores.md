# 2026-11-11 15:00 · Juan · Revisión de UI, Elon sobre Optimus y competidores

## Qué se hizo

- **Servidor web local** levantado (`npm --prefix web run dev -- --host`, http://localhost:5173) para que Juan revise toda la UI. El servidor de datos (`127.0.0.1:8000`) y el túnel ya estaban arriba.
- **Mapa de estados de UI:** checklist por ruta con URL y pasos para llegar a cada estado. Quedó como artefacto de la sesión, fuera del repo, porque la UI va a cambiar.
- **Voces:** nueva carpeta [`yc/investigacion/voces/`](../../yc/investigacion/voces/README.md) para transcripciones de referentes hablando de robots. Primera entrada: Elon Musk en Dwarkesh (feb 2026), 1:17:22–1:30:21, con la transcripción cruda (whisper `large-v3-turbo`) y el análisis para Tridi.
- **Competidores:** se sumó Labelbox (Terra) a [`yc/competidores.md`](../../yc/competidores.md). **No es YC**, aunque se creía que sí: no tiene ficha en YC y su financiamiento viene de SoftBank, a16z y otros. Asimov se revisó y no tiene noticias desde octubre.

## Qué funcionó y qué no

- `yt-dlp --download-sections` dio 403. Funcionó bajar el audio completo (`-f bestaudio`) y cortar el tramo con `ffmpeg`.

## Hallazgos de lógica

- El botón WebSerial (`stage.js:584-634`) no está en el markup, así que nadie puede llegar a él.
- Los selects de config de la caja Entrenar (pasos y empujones) no se envían al servidor (`training.js:85`).

## Siguiente

- Juan revisa la UI y pasa sus mejoras.
- En paralelo (lógica y motor): lazo sim-to-real con la telemetría real de Luigi, y que la caja Entrenar mande la config al servidor.

---

## Actualización (2026-11-12 00:40) · Pulido de UI/UX, postura en `#/delivery` y preparación ZAKA

- **Landing (`web/src/landing/landing.css`):** Footer más grande y con más presencia (`padding: 40px 36px 48px`, wordmark `clamp(72px, 10vw, 136px)`, `foot-specs` a `13px`) manteniendo `margin-top: clamp(140px, 20vh, 220px)` para no chocar con las tarjetas `.tries` de arriba.
- **Simulaciones (`web/src/screens/simulations.js`, `web/src/stage.js`, `web/src/training.js`, `web/src/policies.js`, `web/src/strings-names.js`, `web/src/strings-stage.js`):**
  - Eliminado el selector `#show` (`Persona y robot / Solo persona / Solo robot`) de `Playback`: los clips humanos muestran siempre `Persona y robot` lado a lado.
  - Eliminado el lugar `Vereda (Sidewalk)` del selector de lugares en `#/simulations`.
  - La sección `Objetos, agarre y líquidos` (`#grasp-box`) ahora solo se muestra cuando el lugar activo es `Cocina` en el Unitree G1.
  - El botón `Empujar al robot` (`.push`) se oculta automáticamente en los robots custom (`luigi_lab3`, `luigi_lab4`, `factory_cell`) y cuando el modo es `Sin física`.
  - Ocultados los selectores de configuración (`Pasos de práctica PPO`, `Empujones`, `4 mundos`) en la vista `preloaded` de la caja de entrenamiento para que solo aparezcan al entrenar un clip propio grabado o subido.
  - Renombrado *"Robot entrenado con"* a *"Política activa (cerebro ONNX)"* y aclarados los nombres de `Lab 3` / `Lab 4` a `Rover Luigi v1 (Sensores Fijos)` y `Rover Luigi v2 (Radar Servo SG90)`.
- **Postura erguida del G1 en `#/delivery` y simulaciones (`web/src/screens/delivery.js`, `physics/src/policy.js`):** Amortiguado el pitch hacia adelante de pelvis y cintura (`pose[4]` y `pose[21]`) en los cuadros de replay de `#/delivery` (preservando las caídas reales en los últimos `0,35 s`) y reforzado el bias vertical de cintura en `policy.js`.
- **Manual interno para reunión con ZAKA, C.A. ([`docs/internal/reunion-zaka.md`](../internal/reunion-zaka.md)):** Investigación de ZAKA, C.A. (`zakasys.com`, Ing. José González), postura del equipo como aliados y generación de relevo (cero competencia, jamás insinuar que Tridi reemplaza el trabajo de ZAKA), conexión con Elon Musk (Optimus / Sim-to-Real / fábricas 24/7), demo de 3 minutos y las 4 preguntas de validación dura.
- **Limpieza total del legado de Platanus Hack en `docs/`:** Eliminadas por completo las carpetas y archivos viejos del hackathon (`docs/decisiones/`, `docs/archive/`, `docs/investigacion/`, `docs/preguntas-abiertas.md`, `docs/plan-producto.md`, `docs/plan-v2.md`, `docs/pitch/*.md`, `web/TAREAS.md`), movido el caso de Luigi a [`docs/internal/caso-luigi-sim2real.md`](../internal/caso-luigi-sim2real.md) al lado de [`docs/internal/reunion-zaka.md`](../internal/reunion-zaka.md), y actualizados `AGENTS.md` y `CONTRIBUTING.md` a modo empresa real.


