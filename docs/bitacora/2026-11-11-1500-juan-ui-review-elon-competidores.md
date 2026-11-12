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
- **Manual para reunión con ZAKA, C.A. ([`docs/reunion-zaka.md`](../reunion-zaka.md)):** Investigación de ZAKA, C.A. (`zakasys.com`, Ing. José González), postura del equipo como aliados y generación de relevo (cero competencia, jamás insinuar que Tridi reemplaza el trabajo de ZAKA), conexión con Elon Musk (Optimus / Sim-to-Real / fábricas 24/7), demo de 3 minutos y las 4 preguntas de validación dura.
- **Limpieza total del legado de Platanus Hack y subcarpetas en `docs/`:** Eliminadas por completo las carpetas viejas y redundantes (`docs/internal/`, `docs/decisiones/`, `docs/archive/`, `docs/investigacion/`, `docs/preguntas-abiertas.md`, `docs/plan-producto.md`, `docs/plan-v2.md`, `docs/pitch/*.md`, `web/TAREAS.md`), dejando todos los documentos directamente en `docs/` ([`docs/reunion-zaka.md`](../reunion-zaka.md), [`docs/caso-luigi-sim2real.md`](../caso-luigi-sim2real.md), [`docs/architecture-and-sim2real.md`](../architecture-and-sim2real.md), [`docs/infra-and-security.md`](../infra-and-security.md)) y moviendo `yc-w27-reference.md` a `yc/`.

---

## Actualización (2026-11-12 02:25) · Pulido integral de `#/simulations`, `#/milestones`, video origen PiP y arreglo de `Running`

- **`#/milestones` (`web/src/screens/milestones.js`, `web/src/screens/strings/milestones.js`, `web/src/style.css`):**
  - Actualizado `48 horas` → `36 horas` (`48 hours` → `36 hours`) en todas las cadenas ES/EN.
  - Reducido el tamaño de los chips y etiquetas (`.milestone-badge`, `.milestone-photo-tag`, `.milestone-video-head`).
  - Eliminado el CTA redundante `"Abrir Celda Industrial"` del encabezado del Caso 2 (Luigi) y dejado el CTA principal directo al robot de Luigi (`Simular Robot de Luigi (Lab 3) →` / `Probar Lab 4 (Radar SG90) →`).
  - Añadido modal **Lightbox en pantalla completa** (`#milestone-lightbox`) al hacer clic sobre cualquiera de las 6 fotos de arquitectura física (con navegación `‹`/`›`, teclado `Escape`/`ArrowLeft`/`ArrowRight`, contador y `object-fit: cover`).
- **`#/simulations` — Condiciones, Playback y Robots Custom (`web/src/screens/simulations.js`, `web/src/stage.js`, `web/src/training.js`, `web/src/gallery.js`):**
  - Ocultada por completo la tarjeta `Playback` (`#playback-group`) cuando se selecciona un robot custom (`luigi_lab3`, `luigi_lab4`, `factory_cell`), expandiendo `Condiciones` a ancho completo.
  - En `factory_cell` (`Celda Industrial`), ocultados el selector `Mundo` (`#world-field`) y los sliders climáticos (`.tune`), y separado su panel derecho con un selector industrial limpio de 2 modos (`Política Tridi · Guiada por Barreras Ópticas` vs `PLC Clásico · Timer Fijo`) y botón de reinicio propio (`Reiniciar ciclo de celda industrial`), sin controles del rover de Luigi.
  - Eliminados del panel derecho los selectores duplicados de robot (`#custom-robot-tabs`) y el botón `"Volver a Unitree G1"` (`#luigi-back-g1`), dejando el selector `Robot` en `Condiciones` como único punto de cambio.
  - Ocultado el selector `#policy-field` (`Política activa`) en `#/simulations` para evitar inconsistencias al ver movimientos de galería.
  - Reestructurada la caja `Entrenar al robot en este movimiento` (`.train-actions-stack` + `.train-actions-subrow`) con jerarquía y espaciado limpios, y eliminados los chips repetitivos `"Entrenado con física"` de todas las tarjetas de galería.
- **Video origen Picture-in-Picture (PiP) y arreglo de `Running` (`web/src/video-overlay.js`, `web/public/media/clips/*.mp4`, `web/clips/clip_correr-perfil-gvhmr.json`, `training/references/clip_correr-perfil-gvhmr-balanced.json`, `physics/src/policy.js`):**
  - Codificados los 8 videos fuente H.264 ligeros en `web/public/media/clips/` y añadido recuadro Picture-in-Picture (`source-pip-wrap`) en `#human-pane` que muestra el video real sincronizado junto al esqueleto 3D (con clic para ampliar a pantalla completa o minimizar).
  - Ocultado `clip_frente-correr-01-gvhmr` (el video fuente era una caminata tapándose el sol, no carrera) y corregido el intercambio monocular de piernas (`f=36..72`) y braceo en `clip_correr-perfil-gvhmr` + referencia balanceada G1 + respuesta de actuadores en `physics/src/policy.js` (`0.82 * target + 0.18 * ctrl`).
- **Mundos y lugares más compactos y detallados (`physics/scenes/cocina.json`, `physics/scenes/deposito.json`, `web/src/props.js`, `web/src/looks/wet.js`, `web/src/looks/rocks.js`, `web/src/looks/meadow.js`):**
  - Delimitados `Cocina` (20 objetos) y `Depósito` (16 objetos) con muros perimetrales bajos (`pared`), plantas, bancos, estanterías y cajas sobre piso, y compactados los escenarios de `Piso resbaloso`, `Piedras` y `Viento`.



