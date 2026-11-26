---
persona: Juan
rama: juan/studio-overhaul
sesion: 0dde3f2a-7b8c-4203-a1d4-2c9d575fcd5d
inicio: 2026-11-25 16:38
estado: cerrada
---

# Overhaul "Año 10000" de Landing, White-Chamber, `#policy` y Ajustes R3

## Objetivo

Completar sobre `juan/studio-overhaul` (preservando cambios locales existentes y sin hacer deploy, merge ni push a `main`) los 4 bloques pendientes:
1. Mundo 3D de la landing estilo "Año 10000" (100% procedural/instanciado, `0` `.glb`, `< 50` draw calls, cielo abierto, 5 arquetipos, aceras simétricas, EVs cuña y luminarias 3D sin backface culling, manteniendo `city.js` intacto).
2. Piso de telemetría radial/hexagonal, modo **Tridi Gym** *White-Chamber* (`--gym-wash`), vector de empuje holográfico (`100–500 N`) y **Redeploy v2**.
3. Pose interactiva de `#policy` en desktop (brazo izquierdo hacia la tarjeta + seguimiento de cursor) y móvil (ambos índices hacia la tarjeta inferior) con SLERP fluido.
4. Los 4 ajustes R3 de [`docs/investigacion-tracking-articulaciones-humanoides.md`](../investigacion-tracking-articulaciones-humanoides.md) (`smplx_*` + `spine` `[3,6,9,12]`, overlays 2D `2×21` + cabeza minimalista, toggle `"Manos (+42 pts)"` en `#/camera` y hook de actuadores físicos de dedos).

## Qué se hizo

- **Mundo 3D "Año 10000" (`web/src/landing/world.js`, `world-buildings.js`, `world-textures.js`, `world-foliage.js`):**
  - Cielo crepuscular ciber-nocturno controlado con `FogExp2` profundo, mega-skyline lejano con balizas y horizonte holográfico desvanecido sin cierres abruptos.
  - 5 arquetipos futuristas con costillas aerodinámicas, skywalks y tiras LED sutiles; aceras simétricas con bancas en voladizo y bolardos luminosos; vehículos EV en cuña; y luminarias 3D emisivas visibles desde todos los ángulos con pool elíptico único y cono volumétrico sutil.
  - `dressLandingWorld` con `setGymWash(amount)` (`0..1`), caché de texturas `canvasCache` y `undress()` completo (`0` fugas GPU).
- **Telemetría, White-Chamber, Push Vector y Redeploy v2 (`web/src/landing/telemetry.js`, `web/src/push-arrow.js`, `web/src/screens/home.js`, `web/src/landing/landing.css`):**
  - Rejilla reemplazada por retícula radial/hexagonal de precisión con arcos concéntricos, marcas de grados y adaptación de contraste bajo `--gym-wash` (`~600 ms` al entrar/salir de `#gym`).
  - `createPushArrow` renovado a vector holográfico de chevrón animado + anillo de impacto en torso escalado a `100–500 N` en `--signal` (`#c8ff2e`), retrocompatible con `robot-pane.js`.
  - **Redeploy v2** en 4 fases (`1.080 ms`) con escaneo volumétrico y partículas de reconstrucción.
- **Pose interactiva `#policy` (`web/src/screens/home.js`, `web/src/landing/landing.css`, `physics/src/{index,dex3}.js`):**
  - Desktop (`> 860px`): `.policy-caption` a la izquierda, robot a la derecha mirando al usuario señalando con brazo/mano izquierda + seguimiento atenuado al pasar el cursor sobre `.specs li`.
  - Móvil (`<= 860px`): tarjeta abajo y pose frontal con ambos índices apuntando hacia abajo.
  - Transición SLERP (`blendQpos` con camino más corto) sin saltos de cámara ni reinicios, y carga diferida de `dex3.js` únicamente al entrar a `#policy`.
- **R3 — 4 ajustes de tracking y articulaciones:**
  - **Ajuste 1:** `smplx_body_pose`, `smplx_global_orient` y `spine` (`[3,6,9,12]`) en `data/capture2/to_poseclip.py`, `docs/contrato.md`, `web/src/contract.js`, `physics/src/motion.js` → `physics/src/retarget.js` y `web/src/skeleton.js` (42 joints).
  - **Ajuste 2:** manos `2×21` e indicador minimalista de cabeza (`0, 7, 8`) en `web/src/video-overlay.js`, `web/scripts/make-video-overlay.py`, `data/live/src/{index,draw,relay}.js`, `data/relay.py` y `data/overlay.py`.
  - **Ajuste 3:** toggle **"Manos (+42 pts)"** (`default: false`, ES/EN) en `web/src/screens/phone.js`, `web/src/screens/strings/phone.js` y `web/src/style.css`.
  - **Ajuste 4:** hook `createHandActuatorHook` en `physics/src/fingers.js` + `physics/src/index.js` (*no-op* en `nu = 29`, activo en `Dex3`/`Inspire` `43`/`51` DoF) y compuerta `meta.robot === 'unitree_g1'` en `physics/src/policy.js`.
- **Endurecimiento Tier-5, Delta Audits y Auto-Sync 2 capas:**
  - Corregidos `GAP-1..GAP-8` en las iteraciones adversariales, cerrando **`GAP-8`** con `toHandPoints(arr)` compartido en `physics/src/motion.js` y `physics/src/index.js` (`copyMotionHands`) más pruebas de regresión en `physics/scripts/check-dex3.mjs` y `physics/scripts/check-smplx-retarget.mjs`.
  - Corregido hallazgo `WCAG 2.4.7` del Pre-Commit Delta Audit en `web/src/screens/phone.js:252`: `if (event.detail) handsButton.blur();` para preservar `:focus-visible` al activar con teclado (`Enter`/`Space`).
  - Sincronizados [`../estado.md`](../estado.md), [`../ROADMAP.md`](../ROADMAP.md) y [`../architecture-and-sim2real.md`](../architecture-and-sim2real.md).

## Qué funcionó

- `npm --prefix physics run check`: **16/16 suites** en verde (`check-dex3` 4 secciones incluyendo `playClip + frame` GAP-8, `check-smplx-retarget` 9 secciones incluyendo `retargetClip` GAP-8, `check-policy` `|waist_roll| ≤ 0,44°`, `|torso_lat| ≤ 0,27°`, `4/4` empujones `150 N`/`250 N`).
- `npm --prefix web run check && npm --prefix web run build`: **`12` diccionarios (`720` claves ES/EN, `501` lookups)**, `check-skeleton`, `check-video-overlay` y build limpio en `1,19 s` (`web/dist` = `116 MB`, `og.png` = `280 KB`, `dex3` en chunk diferido de `13,81 kB`).
- `npm --prefix data/live run check`: `check`, `check-facing` y `check-bones` en verde.
- `uv run --project data python -m data.check_relay && uv run --project data python -m data.check_overlay`: relay HTTP + WS (`153` frames y cierre `4404`) y overlay (`10/10`) en verde.
- Verificación E2E headless Chrome CDP (42/42 assertions en desktop `1440×900` / `1280×800` y móvil `390×844` / `375×667`): `0` fugas GPU (`[0,0,0,0]`), `0` errores de consola, `0` `.glb` en `#/`, contraste WCAG AA `> 8:1` en `#gym` White-Chamber y `#policy`.

## Qué no funcionó / Hallazgos resueltos

- En el ciclo Tier-5 aparecieron bordes con payloads malformados de manos (`GAP-7` en `copyFingers` y `GAP-8` en `copyMotionHands`/`retargetSteps` cuando `left`/`right` traen `null`, objetos `{x,y,z}` o no-arreglos) y en el Delta Audit un `handsButton.blur()` incondicional en `phone.js:252` que borraba el foco por teclado. Todos quedaron resueltos y cubiertos por pruebas.
- Sin push, merge ni deploy a `main` por restricción explícita de la sesión.

## Decisiones

- Exportar `toHandPoints` desde `physics/src/motion.js` y reutilizarlo en `physics/src/index.js` para mantener un solo validador de tuplas `[x, y, z]` sin deriva entre `retargetSteps` y `copyMotionHands`.
- Aplicar `if (event.detail) handsButton.blur()` en `web/src/screens/phone.js` en lugar de `blur()` incondicional, alineado con `header.js`, `home.js` y `simulations.js`.
- Preservar `web/src/landing/city.js` y `physics/models/` intactos y dejar los cambios listos en `juan/studio-overhaul`.

## Refinamiento visual tras revisión local de Juan

- **Iluminación del mundo (`world.js`, `world-buildings.js`, `world-foliage.js`, `home.js`):** elevado sol a `+4,5°` (blue-hour luminoso), `FogExp2` (`0x222e42`, densidad `0,0115`), PMREM (`0,96`), `sunLight` (`2,45`), `hemiLight` (`1,45`) y exposición (`1,30`); albedos arquitectónicos, aceras y follaje levantados para lectura nítida con brillo normal de pantalla.
- **Sin líneas verdes laterales (`world.js`):** eliminadas las líneas `corridor-calibration-lines` a izquierda y derecha del robot.
- **Tridi Gym — Dark Smoked-Slate Lab Chamber (`world.js`, `telemetry.js`, `home.js`, `landing.css`):** reemplazado el White-Chamber blanco (flash brusco) por cámara de laboratorio gris-pizarra ahumado (`#131922`) con transición suave de `850 ms`, manteniendo `--signal` (`#c8ff2e`) luminoso y sin choque de brillo al entrar/salir.
- **Push Arrow 360° de alto contraste (`push-arrow.js`):** agregado halo/casing oscuro (`#090c12`), punta cónica 3D + núcleo brillante (`#f2ffba`) y retícula radial de impacto en el torso para legibilidad total incluso en empujes frontales directos.
- **Sección `#policy` autónoma con físicas reales (`home.js`):** reemplazada la pose estática/apuntando por secuencia continua con las políticas ONNX reales de `#/simulations` (`g1-bailar` → `g1-saludar` en bucle, precargadas en idle), con recuperación automática ante caída y transición SLERP al entrar/salir.
- **Mayor variedad orgánica en el mundo (`world.js`, `world-foliage.js`):** 4 especies de árboles (copa ancha, ciprés columnar, abedul multi-tronco, arce japonés en niveles), 3 estilos de bancas (voladizo madera, bloque monolítico basalto, asiento con respaldo), tótems luminosos peatonales ámbar cálido y 3 siluetas de vehículos futuristas (Wedge Coupe, Aero-SUV, Pod Urbano Autónomo) en acabados metálicos variados, manteniendo todo estático salvo el robot y los checks/build en verde (`physics` 16/16, `web` check + build `761 ms`, verificación visual en headless Chrome sin errores de consola).

- **Ajuste fino de iluminación, shaders unificados y encuadres (`world.js`, `world-buildings.js`, `push-arrow.js`, `home.js`):**
  - Punto medio de iluminación crepuscular: sol `+1,8°`, fog `0x151c29` (`0,0145`), PMREM `0,76`, `sunLight 2,18`, `hemiLight 1,20`, exposición `1,23`.
  - Lenguaje GLSL `fwidth` unificado con Redeploy v2 tanto en el anillo perimetral de `#gym` (arcos contrarrotatorios + ticks finos + halo suave en 1 draw call) como en `createPushArrow` (haz holográfico + chevrones animados + retícula de impacto con arcos/cruz radial en 2 draw calls).
  - Mayor zoom en `#policy` (`dist: 2,25` desktop / `3,05` mobile) y nuevo plano heroico 3/4 frontal en cierre `#teams` (`az: -32, el: 4, dist: 4,4, aim: 1,05`). Build `758 ms`, 0 errores en headless Chrome.

- **Cohesión visual en `#gym` (`home.js`, `telemetry.js`, `push-arrow.js`):** anillo perimetral completamente estático (sin rotación), marcadores de cadera (nodo Fresnel translúcido), pies (`footReticleMaterial`), X de proyección CoM (`comFloorReticleMaterial`) y líneas de soporte/caída unificados al mismo estilo `fwidth` + halo suave, y flecha de empuje simplificada a cilindro + cono Fresnel minimalista + un solo anillo limpio de impacto en el torso. Build `801 ms`, 0 errores en headless Chrome.

- **Cristales de lujo, flecha pura, specs centrados en móvil y Studio Deck 3D escalable (`push-arrow.js`, `world-buildings.js`, `home.js`, `landing.css`, `strings.js`):**
  - `createPushArrow` reducido a flecha 3D Fresnel pura (sin anillo/líneas planas extra).
  - Fachadas acristaladas cercanas (`tridi-curtain-wall-luxury-v4`) mejoradas a vidrio espejo oscuro de lujo (`roughness 0,045`, `metalness 0,68`, `envMapIntensity 2,35`), micro-inclinación normal por panel individual (`cwTiltX/Y`), marcos anodizados ultrafinos y brillo Fresnel rasante.
  - En móvil (`<= 860px`), los 4 specs de `#policy` quedan centrados (`text-align: center; justify-items: center`).
  - Sección de cierre `#teams` rediseñada como **3D Orbital Studio Deck** escalable con filtros por vertical (`Todo Studio`, `Humanoides`, `Rovers`, `Industrial`), badges por vertical en cada módulo, carrusel 3D con `perspective` + `rotateY`/`translateZ`, navegación circular `←`/`→` y swipe táctil en móvil (`web check` `728` claves / `522` lookups, build `811 ms`, 6 screenshots desktop + móvil verificados con `0` errores).

- **Pulido móvil en `#policy` y footer (`home.js`, `landing.css`):** reforzado centrado de los 4 specs en `#policy` (`place-items: center`), alineado `© 2026 TRIDI` al centro vertical del logo `tridi` y a la derecha (`align-items: center; justify-content: space-between`), y centrados simétricamente los divisores verticales entre `Studio | Product | Team` mediante flex `.foot-sep` equidistante. Build `760 ms`, screenshots móvil verificados sin errores.

## Sigue

- Revisión manual local de Juan sobre `juan/studio-overhaul` (`npm --prefix web run preview -- --host`) antes de ejecutar `/tridi-release-audit` y `scripts/ship.sh`.
