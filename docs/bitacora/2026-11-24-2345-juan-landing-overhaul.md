---
persona: Juan
rama: juan/studio-overhaul
sesion: c301e3a8-496f-4f7e-b4aa-4b8ae8913cac
inicio: 2026-11-24 23:45
estado: cerrada
---

# Landing Overhaul — Boot, Capture, Gym, Policy, Closing y Footer

## Objetivo

Ejecutar una pasada completa y estandarizada sobre el resto de la Landing (`#/`) en Desktop + Mobile y ES + EN aplicando `docs/design-system.md`, manteniendo Header y Hero congelados como referencia, en la rama local `juan/studio-overhaul` sin push ni cambios en `main`.

## Qué se hizo

- **Boot loader (`?boot=1`, `web/src/screens/home.js`, `web/src/landing/landing.css`):**
  - Movido fuera de `.film` como hermano (`position: fixed; z-index: 15`) para que `.film-wash` no lo oscurezca, oculto al cargar con `.film.ready ~ .boot`.
  - Estandarizado a superficie Nivel 2 (`rgb(10 12 16 / 0.84)`, `border: 1px solid var(--line)`, `border-radius: var(--r-card)`, sin `backdrop-filter`), alineado al slot de `.sim-readout` (`bottom: 32px; right: var(--gutter)`) en desktop y a `top: calc(var(--topbar-h) + 12px)` en móvil, con contador `tabular-nums` (`min-width: 5ch`) y barra de `2px`.
- **Tridi Capture (`web/src/screens/home.js`, `web/src/landing/landing.css`, `web/src/landing/strings.js`):**
  - `.capture-media` alineado al mismo ancho que `.capture-caption` (`min(var(--card-width), calc(44svh * 16 / 9))`) para evitar colisiones verticales en laptops bajos; `.frame` con fondo `var(--bg)`, borde `var(--line)` y radio `var(--r-card)`.
  - `aria-label` bilingüe en `<canvas class="skeleton-canvas">` (`capture.skeletonShort`), `capture.textShort` balanceado ES/EN con `\u00A0` y posición móvil `top: calc(var(--topbar-h) + 12px)` + `text-align: left`.
- **Tridi Gym (`web/src/screens/home.js`, `web/src/landing/landing.css`, `web/src/landing/strings.js`):**
  - Corregido el rango de la barra de zona segura del slider de fuerza (`(maxN - 100) / 400` para `100..500 N`) y agregado feedback táctil instantáneo `.kick` a `.gym-push`.
  - Selector de etapas (`10M` / `100M` / `300M`) sin bordes anidados, con `aria-pressed`, hover encapsulado en `@media (hover: hover) and (pointer: fine)` y fix de contraste de `.axis-label` dentro de `.axis-stop.on` en móvil.
  - Telemetría sin CLS: `tabular-nums` + `min-width` fijo en `.steps-now b` (`4.8ch`), `[data-gym="up"]` (`4.5ch`), `[data-gym="force"]` (`5ch`) y `\u00A0` en todas las unidades.
- **Tridi Policy (`web/src/screens/home.js`, `web/src/landing/landing.css`, `web/src/landing/strings.js`):**
  - Pose del robot refinada a postura de presentación equilibrada (`updatePolicyPose` respetando `reducedMotion`, centrado limpio en `policyAnchor = { x: 0, y: 0 }`).
  - Padding unificado con `.panel`, grid `2×2` de `.specs` en tiles tonales sin bordes anidados (`border: 0`, `border-radius: var(--r-2)`), unidades indivisibles (`\u00A0`) y CTA `.policy-data` con ancho natural de pill en desktop y `100%` en móvil.
- **Closing + Footer (`web/src/landing/landing.css`, `web/src/landing/strings.js`):**
  - Eliminado CSS muerto (`.vertical-*`, `.progress-track`, `.milestones`) y `backdrop-filter` doble sobre WebGL en `.try`.
  - Cards `.try` estandarizadas a Nivel 2 (`rgb(10 12 16 / 0.84)`, `border-radius: var(--r-card)`), icono en contenedor `34×34px` sin borde en desktop y `18px` limpio en móvil, `.try-go` convertido a label mono sin borde (elimina 5 pills verdes compitiendo), hover encapsulado en `@media (hover: hover) and (pointer: fine)` y `grid-column: 1 / -1` para la 5ta card en `<= 1160px` y móvil `2×2`.
  - Footer alineado al ancho exacto de `.closing-inner` (`padding: 28px 0 32px` desktop, `24px 0 32px` móvil), fix de `display: grid` en `@media (max-width: 960px)` y `.foot-team-grid` en grid `2×2` en móvil.
- **Ronda 2 — Pulido fino tras revisión en vivo de Juan (Desktop + Mobile):**
  - **Navbar activo:** indicador sutil inferior verde `--signal` (`2px`) en `.topnav > .nav-direct.active` (`Capture` / `Gym` / `Policy`) en desktop.
  - **Gym desktop sin flicker 10M ↔ 300M:** agregado `gymFlight` en `home.js` para fijar el stage destino durante el glide de Lenis sin disparar el stage intermedio de `100 M`.
  - **Gym compacto (Desktop + Mobile):** `.gym-status` movido a la derecha de `.steps-now` (`.steps-row`, cero hueco muerto a la derecha y una fila vertical menos); descripciones de etapas en 1 sola línea (`stage.0/1/2.text`) y `stage.0.verdict` EN acortado a `Balance`; en móvil `.gym-controls` en 1 fila horizontal (`Push it` izq + slider `Force` der).
  - **Capture (Desktop + Mobile):** removido `max-width: 13em` de `.panel h2` para que títulos usen el ancho real del panel; mismo borde `1px solid var(--line-strong)` en video y esqueleto; en móvil apilados abajo en orden lógico (card arriba, video+esqueleto abajo) y `narrowShot` bajado (`aim - 0.56`, `el - 4`) + `.film-wash` suavizado para subir y centrar mejor al robot arriba.
  - **Policy (Desktop + Mobile):** `.policy-note` a `max-width: none; width: 100%; padding-top: 14px;` con copy atemporal (`múltiples terrenos` / `multiple terrains`); chips `.specs` más compactos en móvil.
  - **Closing + Footer (Desktop + Mobile):** footer en banda full-width más oscura (`rgb(5 6 8 / 0.96)`) diferenciada del fondo de `.closing`; `Team` en móvil en 1 sola columna vertical; Closing móvil compactado con copy corto propio (`close.textShort` y `try.*SubShort`).
- **Ronda 3 — Pulido de animaciones, móvil y compactación final:**
  - **Navbar activo animado + salto rápido directo:** barra verde `--signal` animada (`scaleX` en desktop, `scaleY` lateral en menú móvil `<= 1000px`); `scrollTo` acelerado (`0.75s`) y `updateWash()` fijado a `navFlight.chapter` para que `Capture → Policy` no ilumine `Gym` al cruzarlo.
  - **Viñetas `.film-hud`:** eliminado `visibility: hidden` en `.is-closing` para que las esquinas desaparezcan con el mismo fade suave de `0.45s` con el que aparecen.
  - **Policy:** removidos `.policy-note` y su divider (`home.js`, `strings.js`, `landing.css`).
  - **Capture + cámara móvil:** orden invertido solo en móvil (video + esqueleto 3D arriba, card `Tridi Capture` abajo en el mismo `bottom: var(--s-5)` que Gym/Policy), `--wash-floor` consistente (`0.84`) y `narrowShot` ajustado (`aim - 0.38`, `dist * 1.38`) para reducir piso visible.
  - **Closing + Footer:** en móvil las 5 herramientas de Studio se consolidan en un solo panel Nivel 2 de 5 filas compactas con divisores (cero 5ta card impar y mucho menos altura vertical); `.footer` vuelve a respetar el ancho de `.closing-inner` (`max-width: 1240px`, card oscura `rgb(6 7 9 / 0.94)` con `border-radius: var(--r-card)`) y `Team` en móvil va en fila horizontal continua (`flex-wrap: wrap`).
- **Ronda 4 — Iconos Closing desktop, Footer ancho navbar y Policy strip móvil:**
  - **Closing desktop:** eliminados textos repetidos `Open →` / `Upload →` (`strings.js`, `home.js`), reemplazados por flecha minimalista `.try-arrow` (`→`) con animación de desplazamiento + color `--signal` en hover; iconos `.try-icon-wrap` ampliados a `44×44px` (`22×22px` SVG) y descripciones balanceadas a 2 líneas exactas en ES y EN.
  - **Footer ancho exacto de `.topbar`:** en desktop `width: min(1680px, calc(100% - var(--frame-x) * 2))` con `.foot-bar` alineado a `1240px`; en móvil attached full-width (`border-radius: 0`) y `Team` en 1 sola línea continua (`flex-wrap: nowrap; justify-content: space-between; font-size: clamp(10.5px, 2.85vw, 12.5px)`).
  - **Policy móvil:** 4 métricas compactadas en una sola tira horizontal de 4 columnas (`repeat(4, minmax(0, 1fr))`) con divisores verticales y labels de 1 palabra (`ONNX` / `Motores` / `Ciclo` / `Latencia`), eliminando todo espacio vacío a la derecha y recortando altura vertical.
- **Ronda 5 — Closing cards sin flechas, Footer 1240px y 3 columnas en móvil:**
  - Removido `.try-arrow` en desktop y móvil; Closing móvil restaurado a cards individuales Nivel 2 con icono en contenedor `34×34px` (distinto al dropdown de Studio).
  - Footer desktop devuelto a `max-width: 1240px` (sin hueco vacío en el medio) y footer móvil compactado a 3 columnas simétricas (`Studio` | `Producto` | `Equipo`).
- **Ronda 6 — Tridi Policy interactivo (29 motores en vivo), Footer simétrico con divisores y transiciones de dropdowns/acordeón:**
  - **Tridi Policy (`home.js`, `strings.js`, `landing.css`):** ahora corre políticas ONNX reales en vivo (`Equilibrio` `g1-stand`, `Saludar` `g1-saludar`, `Caminar` `g1-walk` cargadas on-demand) con selector de 3 botones + monitor compacto en tiempo real de los 29 actuadores (`<canvas class="policy-bars">` leyendo `view.sim.data.ctrl` a 20 Hz + pico `%` tabular) en desktop (`28px`) y móvil (`20px`).
  - **Footer (`landing.css`):** padding horizontal simétrico (`28px 36px`) y divisores verticales `border-left: 1px solid var(--line)` entre `Studio | Product | Team` en desktop y móvil; en móvil logo `Tridi` y `© 2026 TRIDI` van en la misma fila alineados a la base.
  - **Dropdowns y acordeón móvil (`style.css`, `landing.css`, `home.js`):** transición GPU suave (`translateY(-6px) scale(0.98)` + `opacity`, `220ms var(--ease)`) en `.nav-drop-panel` (Studio) y `.lang-menu` (Idioma); acordeón móvil de Studio envuelto en `.nav-drop-inner` con `grid-template-rows: 0fr → 1fr` (`260ms var(--ease)`) en vez de `display: none`.
- **Ronda 7 — Cierre de Landing previo al overhaul autónomo de Studio:**
  - Revertido temporalmente el monitor interactivo de 29 motores en Tridi Policy (se retomará luego con más tiempo).
  - Divisores del footer reemplazados por separadores verticales cortos centrados (`::before`, `height: 56%` desktop / `60%` móvil, estilo `.topnav-sep`) en el centro del gap entre columnas; en móvil `© 2026 TRIDI` queda pegado al lado derecho del logo (`justify-content: flex-start; gap: 10px`).

## Qué funcionó

- Pre-Commit Delta Audit (`craft` + `parity` + `motion` + `a11y`): 0 `backdrop-filter` dobles en secciones tocadas, 100% hovers encapsulados en `@media (hover: hover) and (pointer: fine)`, 0 bordes anidados.
- `npm --prefix web run check` pasó (`716` claves ES/EN, `494` lookups).
- `npm --prefix web run build` compiló `web/dist` en `675ms` con 0 errores.

## Sigue

- Siguiente chat autónomo (`/caveman` + `/goal`, 30–60 min) aplicando exactamente el mismo Design System (`docs/design-system.md`) y auditorías (`docs/audit-playbook.md`) a TODAS las pantallas de Tridi Studio (`#/simulations`, `#/live`, `#/camera`, `#/upload`, `#/delivery`, `#/assembler`, `#/milestones`, `#/docs`, `#/team`) en desktop y móvil con verificación visual en navegador, sobre `juan/studio-overhaul` sin push ni tocar `main`.
