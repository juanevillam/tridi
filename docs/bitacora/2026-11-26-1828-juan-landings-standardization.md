---
fecha: 2026-11-26
persona: juan
rama: juan/studio-overhaul
area: web
sesion: 5e968f4c-102c-4c7e-aec4-bda676787578
---

# Estandarización de las 3 Landings 3D (`/`, `/rovers`, `/industrial`)

## Qué se hizo

- **Contrato compartido y Humanoides (`/`)** (`web/src/screens/home.js`, `web/src/navigation.js`, `web/src/strings-navigation.js`, `web/src/landing/landing.css`):
  - Se agregó `${platformBarHTML({ current: 'humanoids' })}` al Hero de `/` igualando `/rovers` e `/industrial`.
  - Se unificó el ancho de `.hero-caption`, `.capture-caption`, `.gym-caption` y `.policy-caption` con el token único `--card-width: min(36vw, 500px)` en `landing.css` (heredado por las 3 verticales en desktop `500 px` y mobile `358 px`).
  - Se restauró `.closing` ("Hardware is here") con el espaciado compacto y posicionamiento de `main`, sin bloques extra de plataforma y con CTA principal contextual por vertical (`humanoids` → `/simulations`, `rovers` → `/simulations/luigi_lab4`, `industrial` → `/assembler`) + CTA secundario `Milestones`.

- **Tridi Rovers (`/rovers`)** (`web/src/landing/rovers/rovers-landing.js`, `rovers-world.js`, `rovers.css`, `strings.js`):
  - Reestructurada en **Hero + 3 capítulos + Closing**:
    1. **Cap. 1 (`#design`) — Diseño V1 vs V2:** distinción fiel V1 (`luigi_lab3`, sensores fijos sin cuello rotatorio SG90) vs V2 (`luigi_lab4`, servo SG90 rotatorio).
    2. **Cap. 2 (`#sensors`) — Física & Sensores:** corregido el bug de checkpoints (`Stage 01 Entry`, `Stage 02 Chicane`, `Stage 03 Exit`) para recorrer cada tramo real; agregado botón interactivo `Place Obstacle` / `Clear` con evasión en vivo + `LiDAR Ping` y toggle `V2 · SG90 / V1 · Fixed`.
    3. **Cap. 3 (`#sim2real`) — Tridi Policy & Sim-to-Real:** mismo `--card-width`, evidencia real integrada sin espacio muerto a la derecha y **1 solo CTA principal** (`Simulate v2 →`).
  - Coreografía de cámara ajustada: inicio cenital → sostén cenital → frente del rover → detrás del rover → regreso cenital al cierre, con lock de `camTarget`/frustum verificado en desktop y mobile.

- **Tridi Industrial (`/industrial`)** (`web/src/landing/industrial/industrial-landing.js`, `industrial-world.js`, `industrial.css`, `strings.js`):
  - Reestructurada en **Hero + 3 capítulos + Closing**:
    1. **Cap. 1 (`#stations`) — Estaciones de planta:** recorrido por zonas del campus Giga-Factory (silos, celda principal, paletizado/AGVs) con transiciones de cámara.
    2. **Cap. 2 (`#validation`) — Validación PLC:** toggle `Optical sync · 0% waste` vs `Fixed timer · 28% slip`, botón `Inject fault` (`Faulted box en route -> PUSHER-01`) y selector de recetas ISA-88 (`250 g / 500 g / 1 kg`) con respuesta en vivo.
    3. **Cap. 3 (`#policy`) — Policy & PLC Export:** mismo `--card-width`, specs y **1 solo CTA principal** (`Open Assembler →`).
  - Fixes 3D en `industrial-world.js`: sensores ópticos (`PE-01`, `PE-02`, `PE-03`) anclados físicamente a la estructura/banda (cero elementos flotando), haces originados en cada lente con interpolación suave y ciclo continuo de banda/brazo/cajas sin reset abrupto.
  - Conectado `bindNavDropLinking` en `industrial-landing.js`.

## Verificación

- `npm --prefix physics run check`: **pasó** (`check`, `retarget`, `smplx`, `policy`, `onnx`, `mimic`, `smooth`, `touch`, `gestures`, `fingers`, `hand-hook`, `dex3`, `root`, `worlds`, `scenes`, `assembler`).
- `npm --prefix web run check`: **pasó** (16 diccionarios, 985 claves ES/EN, 731 lookups + skeleton + video-overlay).
- `npm --prefix web run build`: **pasó** (`vite build` en 852 ms).
- **Headless Chrome (`1440×900` desktop y `390×844` mobile)** sobre `/`, `/rovers` e `/industrial`:
  - `0` errores de consola, runtime y WebGL en las 6 combinaciones ruta/viewport.
  - `0` overflow horizontal (`scrollWidth === innerWidth`: `1440/1440` y `390/390`).
  - Ancho de cards idéntico en las 3 landings: `500 px` desktop, `358 px` mobile.
  - `.hero-platforms` presente y vertical activa marcada en los 3 Heroes; 3 capítulos + `.closing` compacto (`900 px` desktop / `844 px` mobile) con CTA contextual en las 3 rutas.
  - Controles interactivos verificados en vivo y screenshots revisados visualmente (`desktop-home-hero`, `desktop-home-closing`, `desktop-rovers-hero`, `desktop-rovers-ch2`, `mobile-rovers-ch2`, `desktop-rovers-closing`, `desktop-industrial-hero`, `desktop-industrial-ch2`, `mobile-industrial-ch2`).
- **Delta audit (`tridi-craft-audit` + `tridi-parity-audit`):** `0` bloqueos P0/P1.

## Estado git y siguiente paso

- Checkpoint de código subido previamente a `origin/juan/studio-overhaul` en commit `13ce19e` (sin deploy ni push a `main`).
- Esta bitácora queda lista en local en `juan/studio-overhaul` para revisión de Juan antes de commit final o `scripts/ship.sh`.
