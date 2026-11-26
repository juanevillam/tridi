---
persona: Juan
rama: juan/studio-overhaul
sesion: 2f23e59b-0e11-4250-ba0d-55b49515bf15
inicio: 2026-11-25 02:24
estado: abierta
---

# Studio Overhaul — Shell compartido y todas las pantallas internas

## Objetivo

Llevar todas las pantallas internas de Tridi Studio (`#/simulations`, `#/live`, `#/camera`, `#/upload`, `#/delivery`, `#/assembler`, `#/milestones`, `#/net`) al 100% del estándar visual, motion, accesibilidad y responsiveness congelado en `docs/design-system.md` (Desktop `1440×900` / `1280×800` + Mobile `390×844` / `375×667`, ES + EN) con commits locales atómicos en `juan/studio-overhaul`, sin `git push` ni tocar `main` ni romper la Landing (`#/`).

## Qué se hizo

1. **Shell compartido (`web/src/header.js`, `web/src/style.css`):**
   - `.app-topbar` unificada con superficie Nivel 1 en `::before` (`transform: translateZ(0)`, cero `backdrop-filter` doble sobre WebGL), estado activo con barrita verde animada (`--signal`, `scaleX` en desktop / `scaleY` lateral en móvil), hover neutro en `@media (hover: hover) and (pointer: fine)` y dropdown de idioma limpio sin bordes anidados.
   - Móvil `<= 1000px`: header attached full-width (`position: fixed; inset: 0 0 auto 0; border-radius: 0`), drawer fullscreen fade puro (`200ms ease`) con scroll lock (`html.style.overflow = 'hidden'`), grupo `Studio` colapsable con iconos 18px y globo de idioma a la izquierda de `X` (cierre automático al cambiar idioma).
   - Clearance uniforme (`padding-top: calc(var(--topbar-h) + 12px)`) en todas las pantallas móviles.
2. **`#/simulations` (`web/src/screens/simulations.js`, `web/src/style.css`):**
   - Progressive disclosure en móvil (`<= 720px`): `#stage` 3D protagonista arriba → barra primaria compacta `#playback-group` debajo → `#conditions-group` colapsado por defecto en `<details id="conditions-disclosure">` → galería horizontal `#gallery`.
   - `touch-action: none` estrictamente en `.pane canvas`, superficies Nivel 2 (`rgb(10 12 16 / 0.84)`) sin `backdrop-filter` doble sobre WebGL, telemetría tabular sin CLS y fix de `<select>` (`-webkit-appearance: none` + `white-space: nowrap`).
3. **`#/live` y `#/camera` (`web/src/screens/phone.js`, `web/src/style.css`):**
   - `.live-grid` igualada a `--studio-stage-h` (`1fr 1fr` en desktop, apilada verticalmente en móvil `<= 900px`), `.live-dock` limpio en 1 fila sin `backdrop-filter` doble ni transición de `width/padding`, 1 solo CTA `--signal` por estado.
   - `#/camera` (`phone.js`) actualizado con `.phone-topbar` (wordmark + selector de idioma), `.phone-stage` Nivel 2, `.phone-big` legible y CTA full-width en móvil.
4. **`#/upload` (`web/src/style.css`):**
   - `.upload-panel` Nivel 2 sin `backdrop-filter`, `.dropzone > span` corregido para contraste oscuro sobre CTA `--signal`, acentos azules heredados migrados a `--signal`, móvil con preview 16:9 arriba y toggle 2 columnas proporcional sin truncar etiquetas ES/EN.
5. **`#/delivery` (`web/src/screens/delivery.css`, `web/src/scroll-fade.js`):**
   - Toolbar sticky sin `backdrop-filter` sobre WebGL, 1 solo CTA verde principal (`.dl-jump`) con botones `.dl-get` en dark-glass neutro, cero bordes anidados en `.dl-formats > div`, `.dl-code` incluido en `mountScrollFade`, `touch-action: none` en canvas 3D, botones `.dl-play` circulares exactos (`34×34`) y `.dl-switcher` full-width en móvil.
6. **`#/assembler` (`web/src/screens/assembler.js`, `web/src/screens/assembler.css`):**
   - Flujo 2 pasos y tarjetas FDS unificadas a Nivel 2 (`rgb(10 12 16 / 0.84)`), cero bordes anidados en `.asm-hud-card`, `.asm-narrative-list li` y `.asm-comp-card`, CTA principal en `--signal`, toggle compacto `P&ID` / `CAD` en móvil (`58px` topbar sin solapamiento) y `.asm-drop-card` alineado a la izquierda en móvil.
7. **Pantallas secundarias (`#/milestones`, `#/net` en `web/src/style.css`, `web/src/screens/net.js`):**
   - `#/milestones` migrado a Nivel 2 sin `backdrop-filter`, 4-tier ink (`--ink-body` en prosa), cero bordes anidados en `.milestone-step`, hover encapsulado, lightbox con botones circulares sin doble blur, `.milestone-card` con `minmax(0, 1fr)` y `.milestone-badge` + `.milestone-tabs` adaptados a móvil sin clipping.
   - `#/net` integrado a `.app-topbar`. *(Nota: `#/docs` y `#/team` no existen como rutas registradas en `web/src/router.js`.)*

## Qué funcionó

- Verificación visual en navegador real (Desktop `1440×900` + Mobile `390×844`, ES + EN) en todos los bloques con `0` errores de consola y `0` overflow horizontal.
- `npm --prefix physics run check` + `npm --prefix web run check` (`719` claves ES/EN) + `npm --prefix web run build` pasaron con `0` errores.

## Sigue

- Revisión final de Juan sobre `npm --prefix web run preview -- --host` en `juan/studio-overhaul` antes de `scripts/ship.sh`.
