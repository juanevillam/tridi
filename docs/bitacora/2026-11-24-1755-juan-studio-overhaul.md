---
persona: Juan
rama: juan/studio-overhaul
sesion: a3bf16e0-f171-4c8c-8304-fe92949c7d47
inicio: 2026-11-24 17:55
estado: cerrada
---

# Studio Product Overhaul (Fases 1 a 6)

## Objetivo

Ejecutar el overhaul completo de Tridi Studio (`#/live`, `#/camera`, `#/upload`, `#/simulations`, `#/delivery`, `#/assembler`) en rama local `juan/studio-overhaul` sin tocar `main` ni pushear, unificando shell visual, arreglando cámara móvil/laptop, agregando colisión física real para la silla en MuJoCo y habilitando captura local de video 24/7 en `#/upload`.

## Qué se hizo

- **Fase 1 + Fase 4 (`feat(web): unify Studio shell, sticky delivery bar, and playback speed controls`):**
  - `.app-topbar` sticky con Liquid Glass y active-state hover immunity en `web/src/style.css`; radios unificados (círculos para íconos solos, pills para botones de acción, `--r-card: 12px` para paneles) y misma geometría 2-pane (`--studio-stage-h`) entre `#/live` y `#/upload`.
  - Removido el mini-header `.screen-toolbar` extra de `#/assembler` (`web/src/screens/assembler.js`), moviendo el toggle P&ID/CAD al `rightSlot` de `.app-topbar` y compactando el ritmo vertical en `web/src/screens/assembler.css`.
  - `#/delivery`: `.dl-toolbar` sticky bajo `.app-topbar` en desktop (estático en móvil `< 1100px`), `SPEEDS = [0.25, 0.5, 1, 2]`, fix de especificidad CSS con `:where(.dl button:not(.app-topbar button))` para `.dl-speeds`/`.dl-seg` y sincronización inmediata de `pipVideo.playbackRate` al cambiar velocidad.
- **Fase 2 + Fase 3 (`feat(live): full-viewport Liquid Glass dock, upper-body mode, and fast pose-only phone camera`):**
  - `#/live` rediseñado a altura completa de viewport (`calc(100svh - var(--topbar-h) - 42px)`) con dock flotante Liquid Glass centrado y máquina de estados estricta (`idle` / `connecting` / `live` / `saved`) en `web/src/screens/live.js` y `web/src/style.css`.
  - Modo tren superior automático (`upperBodyOnly`) en `physics/src/retarget.js` y `physics/src/index.js`: bloquea piernas y pies a `standQ` cuando están fuera de cuadro en vivo y muestra chip tranquilo `"Modo tren superior"`.
  - `#/camera` (`web/src/screens/phone.js`, `data/live/src/index.js`, `data/live/src/relay.js`): `getUserMedia` inmediato al tocar antes de bajar MediaPipe WASM, resolución acotada a `480×360` y `24 fps`, `hands: false`, y envío solo de JSON de pose (~1 KB/frame, sin JPEGs pesados cada tick).
- **Fase 5 (`feat(simulations): add MuJoCo chair collision, curate clips, clamp feet, and declutter UI`):**
  - Agregado `SIT_CHAIR_SCENE` en `physics/src/scenes.js` (cajas estáticas transparentes de asiento `z = 0..0.42 m` y respaldo `x = -0.46 m` con pares de contacto explícitos contra el G1), alineado 1:1 con `chair.glb` en `web/src/props.js` y activado automáticamente para `clip_sentarse-02-gvhmr` en `web/src/stage.js`.
  - Ocultados `clip_correr-perfil-gvhmr` y `clip_bailar-grupo-02-gvhmr` del showcase por defecto en `web/src/screens/simulations.js`.
  - Clamp de altura de suelo `Math.max(0, -lowest)` en `physics/src/retarget.js`.
  - UI de `#/simulations` más limpia: sliders avanzados `.tune` plegados por defecto en desktop y móvil, sidebar `360px` y `.pane-label` en pill Liquid Glass.
- **Fase 6 (`feat(upload): browser-local MediaPipe video capture with optional GPU server mode`):**
  - Agregado `extractPoseClipFromVideo` en `data/live/src/index.js` (seek determinista a `25 fps` con MediaPipe PoseLandmarker + filtros de `createLiveCapture` en el navegador).
  - `#/upload` (`web/src/screens/upload.js`, `web/src/screens/strings/upload.js`, `web/src/style.css`) abre directo en `pick` con modo `Navegador (24/7)` por defecto sin bloquear si el túnel a Mac está apagado, manteniendo el modo opcional `Servidor GPU (3D / RL)` cuando el servidor responde.
- **Ronda 2 — Pulido Desktop + Mobile en 3 pantallas core (`#/`, `#/simulations`, `#/live`):**
  - **Landing (`#/`, `fix(landing): ...`):** Fuera borde verde curvo superior en `.panel`, fuera `.scroll-cue` y `.phone-arrows`, `.topbar` y `.btn` unificados con Studio (`--r-card: 12px`, pills), menú móvil circular (`36×36 px`), `Open Studio` movido dentro del menú móvil con acordeón Studio cerrado por defecto, Hero móvil en 2 líneas sin pills de pasos, fuerza Gym en pasos de `100..500 N`, robot saluda (`clip_saludar-02-gvhmr`) en Tridi Policy, footer sin solapar `.tries` y equipo en grid `2×2` en móvil.
  - **Simulations (`#/simulations`, `fix(simulations): ...`):** Zoom y línea vertical de pies empatados 1:1 entre humano y robot + botón `Reset view` y alineación automática al ángulo del video, fuerzas `100 / 300 / 500 N`, `#speed` ancho fijo (`72px`, cero CLS), `.mode` concéntrico (`999px`), PiP compacto uniforme (`138×104 px`) con labels consistentes (`Clic para ampliar` / `Clic para minimizar`), `Sitting down` conserva mundo normal (`sceneId !== 'silla'`), `Stones` sin borde cuadrado artificial, viento pausado al pausar simulación, `World`/`Place`/`Tune` ocultos en `Without physics`, sliders en grid `2×2` y `clip_lavar-04-gvhmr` oculto del showcase.
  - **Live Camera (`#/live`, `fix(live): ...`):** Dock de una fila sin CLS, eliminado botón duplicado (`Stop & save` + `×` descartar), copy sin disculpas de limitaciones, toggle `Vista fija` / `Cámara libre` (auto-desbloquea al arrastrar el 3D), QR más grande con estilo 3D y sin texto de sesión, y `.app-topnav` móvil en tira horizontal de 1 sola línea en todas las pantallas Studio.

- **Pulido interactivo Landing + Simulations + Live (desktop y móvil):**
  - Header unificado: hover neutro blanco/glass en `Capture`, `Gym`, `Policy`, `Studio ▾`, `Milestones` y selector de idioma (`.lang-trigger`); botón `How it learns` igualado en superficie y hover a `Open Studio`.
  - Menú móvil fullscreen edge-to-edge con selector de idioma arriba a la izquierda, líneas divisoras full-bleed con padding interno y `Open Studio` de `52px` alineado en la misma posición vertical exacta que `Push it`.
  - Hero desktop con cámara 3/4 más cercana (`dist: 1.52`, `aim: 1.02`) y Hero móvil con fila única de 3 chips + órbita libre desactivada en pantallas táctiles/móviles.
  - Nota técnica registrada: la ligera inclinación lateral del torso en reposo tras ~3 s viene del equilibrio aprendido por el checkpoint `g1-stand.onnx` (300M); para dejarlo 100% recto en física hace falta reentrenar `g1-stand` con mayor penalización de `waist_roll`.

- **Estandarización del Design System (`docs/design-system.md`):**
  - Documentadas las reglas congeladas tras el pulido del Header + Hero (3 niveles de superficie sobre WebGL, popovers unificados sin bordes anidados, GPU compositing sin flickering, navbar móvil attached con scroll lock y fade puro, copy-budget ES/EN y progressive disclosure para pantallas densas de Studio). Enlazado en `docs/README.md` y `AGENTS.md` para que cualquier agente futuro lo siga automáticamente.

## Qué funcionó

- `npm --prefix data/live run check` pasó en verde.
- `npm --prefix physics run check` pasó las 13 suites (incluyendo paridad `0.0e+0` en retargeting, escenas, mundos y assembler).
- `npm --prefix web run check` pasó con 100% de paridad ES/EN y todos los lookups resueltos.
- `npm --prefix web run build` compiló `web/dist` limpio con 0 errores en cada fase.

## Qué no funcionó

- Sin fallos bloqueantes. Un detalle detectado y corregido a tiempo: `.dl button:not(.app-topbar button)` en `delivery.css` tenía especificidad `(0,2,2)` que pisaba `.dl-speeds button` `(0,1,1)` — resuelto envolviendo el reset en `:where(...)`.

## Decisiones

- Se rebasió `juan/studio-overhaul` sobre `origin/main` (dejando `main` local intacto) para incorporar la regla §2.5 del `audit-playbook.md` y el delta audit previo de `#/assembler`.
- En `#/camera` se envía solo pose JSON (sin JPEG) para recortar >95% de ancho de banda por el túnel de Cloudflare; `#/live` renderiza el esqueleto limpio sobre el fondo oscuro del panel.
- Los clips `clip_correr-perfil-gvhmr` y `clip_bailar-grupo-02-gvhmr` se mantienen en `preloaded.json` para no romper `#/delivery`, pero se ocultan del gallery por defecto en `#/simulations`.

## Sigue

- Juan prueba manualmente el build de producción en local (`npm --prefix web run preview -- --host`) en las 5 pantallas + celular (`#/camera`).
- Tras aprobación manual de Juan, hacer `scripts/ship.sh` y push cuando él indique.
