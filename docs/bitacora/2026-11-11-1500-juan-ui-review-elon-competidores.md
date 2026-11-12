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
- **Footer de la landing (`web/src/screens/home.js`):** Actualizados los enlaces del equipo a los perfiles de LinkedIn (`pastor-jimenez`, `juanevillam`, `cesarmartinez-dev`, `alehernandezt`).

---

## Actualización (2026-11-12 03:05) · Layout 2 columnas sin espacio muerto, `0.5×` en 1 línea, silla/fregadero 3D, `Running` 1.56 Hz, `#/delivery` (9 entregas + PiP + README) y `PhotoViewer` en `#/milestones`

- **Botón `0.5×` y layout de 2 columnas (`Playback` + `Conditions`) en todos los robots (`web/src/style.css`, `web/src/stage.js`):**
  - Añadido `white-space: nowrap` y `padding: 0 14px` a `.icon-btn.speed` para que `0.5×` nunca se parta en dos filas.
  - Mantenido el layout de 2 columnas (`Playback` a la izquierda + `Conditions` a la derecha) en todos los robots (`Unitree G1`, `Unitree H1`, `Rover Luigi v1`, `Rover Luigi v2`, `Celda Industrial`), ocultando únicamente `#physics-mode`, `#physics-hint` y `#speed` en los robots custom.
  - Añadido `align-items: start` en `.controls-bar`, `.dl-more` y `.sims-layout`, eliminando todo el espacio vertical muerto en `Playback` y `Files you take away`.
  - Rediseñado el encabezado del sidebar `Pick a motion` (`#pick-heading` y `.gallery-section-head`) con indicador luminoso `--signal`, tarjeta sutil y contador moderno, y unificados los botones `.back` y `.dl-back`.
- **Videos fuente faltantes + mejora de `Running`, `Sitting down` y `Washing dishes` (`web/public/media/clips/`, `web/src/video-overlay.js`, `web/clips/clip_correr-perfil-gvhmr.json`, `data/clips/clip_2026-10-23_correr-perfil_01.json`, `training/references/clip_correr-perfil-gvhmr-balanced.json`, `web/src/props.js`, `web/src/stage.js`):**
  - Codificados e integrados los videos PiP faltantes para `Walking away` (`clip_caminar-01-gvhmr.mp4`), `Group dance` (`clip_bailar-grupo-02-gvhmr.mp4`) y `Washing dishes` (`clip_lavar-04-gvhmr.mp4`), y reemplazado `Running` (`clip_correr-perfil-gvhmr.mp4`) con una toma cercana clara.
  - Corregida la cadencia de `Running`: antes tenía `1` solo ciclo en `3.84 s` (`0.26 Hz`, cámara lenta irreal); ahora ejecuta `6` ciclos completos de zancada atlética en `3.84 s` (`1.56 Hz` = `187 pasos/min`) con progresión hacia adelante de `1.45 m/s`, pasando `check-retarget` y `check-mimic` (`3.8 s / 3.8 s`).
  - Reemplazado el banco de parque en `Sitting down` por la silla real con respaldo (`furniture/chair.glb`) orientada detrás del robot (`z = 0.43 m`), y añadido el módulo `syncWashSink` (`furniture/kitchenCabinet.glb` + bacha de acero inoxidable + agua jabonosa + grifo + platos) justo bajo las manos del robot al activar `Washing dishes` en `Cocina`.
- **`#/delivery` — 9 entregas empaquetadas, versión/pasos claros, video fuente PiP y `README` sin espacio muerto (`data/deliveries/*`, `web/src/screens/delivery.js`, `web/src/screens/delivery.css`):**
  - Empaquetadas las **9 entregas completas** en `data/deliveries/` (`Walking · v2 GVHMR · 50M steps`, `Running · v2 GVHMR · 50M steps`, `Walking toward camera · v2 GVHMR · 50M steps`, `Dancing · v2 GVHMR · 50M steps`, `Jumping jacks · v2 GVHMR · 50M steps`, `Sitting down · v2 GVHMR · 50M steps`, `Gestures · v2 GVHMR · 50M steps`, `Counting with fingers · v2 GVHMR · 50M steps`, y `Walking · v1 MediaPipe · 20M steps` para comparar v1 vs v2).
  - Añadido recuadro Picture-in-Picture (`.dl-source-pip`) con el video original sincronizado dentro del visor 3D de `#/delivery`, y rediseñada la sección `README` (`.dl-guide-body` y `.dl-formats` en grilla de 2 columnas de tarjetas) sin espacio muerto horizontal ni vertical.
- **`#/milestones` — Visor `PhotoViewer` a pantalla completa y chips unificados (`web/src/screens/milestones.js`, `web/src/screens/strings/milestones.js`, `web/src/style.css`):**
  - Reemplazado el lightbox por el visor `<dialog class="photo-viewer">` con transición `450ms cubic-bezier(0.22, 1, 0.36, 1)`, escenario `3:2` con fondo desenfocado `.fill`, doble `.layer` con cross-fade y botones circulares fijos en el viewport (`.v-close`, `.v-prev`, `.v-next`) que nunca cambian de posición entre fotos horizontales y verticales.
  - Unificados los chips de `Milestone 01` y `Milestone 02` (`.milestone-badge.signal` en una sola línea) y ajustado el subtítulo principal para que entre limpio en una línea.
- **Estándares de UI/UX, tokens de movimiento, Liquid Glass y SquashPressable (`docs/audit-playbook.md`, `.claude/skills/tridi-quality/SKILL.md`, `web/src/style.css`, `web/src/screens/delivery.css`):**
  - Incorporados en `:root` y en el playbook de auditoría la escalera cuantizada de tiempos (`--beat: 600ms`, `--dur-micro: 150ms`, `--dur-quick: 300ms`, `--dur-turn: 450ms`, `--dur-settle: 600ms`, `--ease: cubic-bezier(0.16, 1, 0.3, 1)`, `--hover`), la jerarquía de 4 tintas (`--ink`, `--ink-body`, `--ink-soft`, `--muted`), el borde especular Liquid Glass (`--lg-blur`, `--lg-rim`) en los overlays flotantes, el feedback táctil `:active` (`scale(0.97)` en tarjetas/pills y `scale(0.92)` en botones circulares de icono) y la regla de cero referencias al portafolio personal dentro del repo de Tridi.

---

## Actualización (2026-11-12 03:50) · Cero CLS en `#/delivery` y `#/milestones`, caminata erguida con física, limpieza de escenas y lightbox ajustado

- **`#/delivery` — Cero CLS en encabezado, video fuente PiP visible y chevron estable en hover (`web/src/screens/delivery.js`, `web/src/screens/delivery.css`, `web/src/style.css`):**
  - Fijado el ancho de `.dl-name` (`240px`, una línea con `text-overflow: ellipsis`), `.dl-switcher` (`276px`) y las columnas de `.dl-meta` (`158px`, `84px`, `132px`, `148px`) para eliminar cualquier salto horizontal o vertical al cambiar entre clips largos (`CONTAR CON LOS DEDOS`, `WALKING TOWARD CAMERA`) y cortos (`CAMINAR`).
  - Corregido el origen del video en `.dl-source-pip` (`VIDEOS[m.clip_id].video` con `import.meta.env.BASE_URL`, `autoplay` y `.play()` al montar) para que el video original se reproduzca inmediatamente en `#/delivery`.
  - Cambiado `background:` por `background-color:` en `select` y `select:hover:not(:disabled)` (`web/src/style.css`) y en `.dl-switcher` para que el chevron SVG personalizado nunca desaparezca al hacer hover.
- **Caminata erguida con física en Unitree G1 (`physics/src/sim.js`, `physics/src/policy.js`):**
  - Diagnosticada en Node con MuJoCo WASM la causa de la inclinación hacia adelante ("paso de Michael Jackson"): en apoyo monopodal la pelvis caía `5–9 cm` (`0.690 m` vs `0.782 m`), haciendo que el pie de balanceo rozara el piso en `t = 1.24 s` y frenara el muslo mientras la pelvis seguía avanzando (`pTilt = 9.2°`, `tTilt = 17°–20°`).
  - Aumentado el soporte vertical en `_stepMimicBalance()` (`310 * scale + kpZ * (q[2] + 0.014 - qpos[2])` con `kpZ = 2200 * motor`, `kdZ = 145 * motor` y `kpRot = 520 * scale`) y añadida amortiguación en velocidad de cintura (`-0.12 * qvel` en `waist_roll` y `waist_pitch`) en `policy.js`, reduciendo `pTilt` a `0.4°–1.7°` y `tTilt` a `0.9°–4.8°`.
- **Escenas `Cocina` y `Depósito` más amplias y cero fuga de objetos entre rutas (`physics/scenes/cocina.json`, `physics/scenes/deposito.json`, `web/src/props.js`, `web/src/stage.js`, `web/src/robot-host.js`):**
  - Ampliados los perímetros de `Cocina` (`7,4 m × 7,4 m`) y `Depósito` (`7,6 m × 7,6 m`), bajados los muretes perimetrales a `0,55 m` y aclarado el material de `pared` (`#6e6a63`) para que nunca tapen la cámara ni se vean negros.
  - Añadido `clearStageProps(view)` con guardas asíncronas (`wantChair`, `wantSink`) e invocado tanto en `stage.dispose()` como en `attachRobot()` cuando no se está en `#/simulations`, garantizando que la silla de `Sitting down` o el fregadero de `Washing dishes` jamás aparezcan en la landing (`#/`) ni en `#/live`.
- **Navbar de la landing, tabs en 1 línea y `PhotoViewer` sin esquinas negras en `#/milestones` (`web/src/screens/home.js`, `web/src/landing/landing.css`, `web/src/screens/milestones.js`, `web/src/screens/strings/milestones.js`, `web/src/style.css`):**
  - Separadas en el navbar las 3 anclas de historia (`Capture`, `Gym`, `Policy`) de las rutas de aplicación (`Simulations`, `Milestones`) mediante divisor vertical `.topnav-sep`, y apuntado el CTA principal (`Try it live`) directamente a `#/simulations`.
  - Ajustado `.milestone-tabs` (`max-width: 820px`, `white-space: nowrap`) para que ambos tabs quepan siempre en **1 sola línea**, y añadida fila de CTAs (`.milestone-cta-row`) en `Milestone 01` para eliminar el CLS vertical al alternar entre `Milestone 02` y `Milestone 01`.
  - Ajustado `.photo-viewer .stage` para que abrace exactamente el borde de cada foto sin caja `3:2` ni esquinas negras (`.fill { display: none }`), y elevado el contraste de `.milestone-photo-tag` y `.photo-viewer figcaption`.

---

## Actualización (2026-11-12 12:30) · Profundización técnica de `docs/reunion-zaka.md` y Línea Industrial PackML de 4 Estaciones (`factory_cell`)

- **Profundización técnica de [`docs/reunion-zaka.md`](../reunion-zaka.md) para la reunión de hoy con el Ing. José González (ZAKA, C.A.):**
  - Desarrollados en profundidad los 4 cruces de ingeniería con el stack real de ZAKA (`Rockwell Studio 5000 / PowerFlex`, `Siemens TIA Portal / Sinamics`, `Wonderware / FactoryTalk`, `Cognex`, `Festo`, `Rice Lake`):
    1. **Retrofit y cálculo de rampas VFD (`P041/P042` / `p1120/p1121`):** Modelado de inercia reflejada ($J_{\text{eq}}$), holgura mecánica (*backlash*) y curva S en MuJoCo antes de energizar motores viejos.
    2. **Tabla de Recetas HMI (`ISA-88` / `PackML` — `UDT_FormatRecipe`):** Matriz pre-calibrada para cambios de formato (`250 g`, `500 g`, `1 kg`) con frecuencia de variador (`Hz`), rampa (`s`), carrera de pistón (`mm`), cota de prensa (`mm`), tiempo de sellado (`ms`) y debounce óptico (`PE-02`).
    3. **Compilador Tridi a `IEC 61131-3 Structured Text` (`SCL` / `ST` — `FB_TridiPackML_Sealer`):** Ejemplo completo de bloque de función determinista auditable con *Hard Safety Interlock* (`xEStop_OK`) y arquitectura de despliegue en 3 niveles (Offline Recipe CSV, Bloque `AOI`/`FB`, y *Shadow Mode* vía `OPC-UA` / `Modbus TCP`).
- **Línea Industrial PackML de 4 Estaciones en MuJoCo (`physics/models/factory_cell/factory_cell.xml`, `physics/src/policy.js`, `web/src/screens/simulations.js`, `web/src/stage.js`):**
  - Ampliado `factory_cell.xml` a una línea industrial completa de 4 estaciones: (1) Tolva de dosificación y celda de carga dinámica (`PE-01`), (2) Alineador neumático con manifold *Festo* y cámara cenital *Cognex In-Sight*, (3) Pórtico termosellador vertical (`PE-02`) con torre semáforo Andon (`Verde / Ámbar / Rojo`), y (4) Rampa de descarga a Euro-Palet con lotes apilados (`PE-03`) + gabinete NEMA 12 lateral (`PLC + VFD + HMI + E-Stop`).
  - Añadido selector interactivo de **Cambio de Formato HMI (`250 g` / `500 g` / `1 kg`)** en `#/simulations/factory_cell` que escala el envase en 3D, actualiza las consignas del variador (`58,5 Hz` / `50,0 Hz` / `41,5 Hz`), pistón y prensa en tiempo real, y muestra la receta PLC exportada lista para `Studio 5000` / `TIA Portal`.
  - Corregido el enlace de telemetría en vivo de `factoryReadout` en `stage.js` (`Variador VFD + Cinta / Pistón`, `Prensa + Fotoceldas PE1..PE3`, `Lotes OK / Merma`, `Estado PackML + Receta`).




## 2026-11-12 15:48 — Factory I/O 3D Labels, Flujo Unidireccional sin Piezas Flotantes y Selector de Idioma en Simulaciones

- **Geometría 3D sólida sin piezas flotantes (`physics/models/factory_cell/factory_cell.xml`):** Anclados la tolva (`HOPPER-01`) a los rieles laterales, el lente y cámara de visión (`CAM-01`) a su brazo, el cilindro neumático fijo (`sealer_barrel_fixed`) de la **Prensa Azul (`PRESS-01`)** al puente naranja superior, la carcasa del **Pistón Rojo (`PUSHER-01`)** al final de la banda (`x = +0.62 m`), el soporte de la rampa al piso y el pedestal del gabinete `PLC/VFD`.
- **Ciclo unidireccional de 4 etapas (`physics/src/policy.js`):** Las cajas nacen siempre en la tolva izquierda (`x = -0.62 m`), avanzan hacia la derecha sin retroceder nunca en reversa, se detienen bajo el puente central para que la **Prensa Azul (`PRESS-01`)** selle la tapa al ras, siguen hasta el final de la banda negra (`PE-03`) donde el **Pistón Rojo (`PUSHER-01`)** las descarga hacia el palet, y en modo de falla (`28% patinaje`) la prensa azul aplasta visiblemente la caja desfasada (se achata y tiñe de rojo).
- **Etiquetas 3D estilo Factory I/O + Narrador en vivo + Selector de idioma (`web/src/stage.js`, `web/src/screens/simulations.js`, `web/src/style.css`):** Proyección 3D en tiempo real de los 6 tags (`HOPPER-01`, `CAM-01`, `PRESS-01`, `PUSHER-01`, `PALLET-01`, `PLC/VFD`), barra inferior explicativa de 4 pasos en vivo, eliminación total del scroll horizontal en el panel derecho y botón `langSwitch` agregado en `#/simulations`, `#/live` y `#/upload`.


## 2026-11-12 16:30 — Física de Banda sin Rebote, Apilado Progresivo en Palet (1..6) y Rechazo Lateral con Pistón Rojo

- **Cero patinaje de mesa y cero rebote viscoso (`physics/src/policy.js`, `physics/models/factory_cell/factory_cell.xml`):** Mesa anclada al piso (`qpos[0..6]` fijos) y trayectoria cinemática en curva-S para la banda, prensa y pistón sin oscilaciones de resorte.
- **Sello blanco al ras sin aplastar la caja:** La caja entra sin sello blanco desde la tolva (`HOPPER-01`), se detiene centrada bajo la **Prensa Azul (`PRESS-01`)**, la prensa baja exactamente hasta rozar la cara superior (`95 mm` en `500 g`) sin hundirse y le estampa el sello blanco encima.
- **Rampa libre de colisiones + Apilado progresivo (`1/6 .. 6/6 cajas`) en el Palet (`PALLET-01`):** Las cajas buenas siguen derecho hasta el final de la banda negra, bajan deslizándose e inclinándose por la rampa hacia su posición en el palet y se van acumulando apiladas de `1` a `6` cajas.
- **Pistón Rojo (`PUSHER-01`) + Bandeja Lateral de Rechazo (`reject_tray_bed`) para cajas mal selladas:** En modo Timer Fijo (`28 %` patinaje), la caja llega tarde a la prensa azul y queda con el sello rojo torcido en el borde; al llegar a `PE-03`, se detiene frente al **Pistón Rojo**, que se extiende en `+Y` y empuja físicamente la caja en esa misma dirección `+Y` a través de la compuerta del riel hacia la bandeja de rechazo.
