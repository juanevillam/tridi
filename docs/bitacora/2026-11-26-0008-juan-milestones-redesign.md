---
persona: Juan
rama: juan/studio-overhaul
sesion: 0708e4e8-bd13-4906-a26f-4d0ebcfe3bd8
inicio: 2026-11-26 00:08
estado: abierta
---

# Rediseño completo de `#/milestones` (Bento futurista, Custom Player y Visor unificado)

## Qué se hizo

- **`web/src/screens/strings/milestones.js`:** Eliminadas claves viejas de `.ms-rail` y `.ms-facts`; agregadas etiquetas bilingües ES/EN para tabs horizontales (`tab.*`), reproductor custom (`vp.*`) y visor unificado (`lb.*`), manteniendo links reales a `Startup Venezuela Summit` y `Platanus Hack 26`.
- **`web/src/screens/milestones.js`:**
  - Selector horizontal superior `.ms-bar` con `mountScrollFade` (`data-scroll-fade`) y navegación por teclado (`ArrowLeft`/`ArrowRight`/`Home`/`End`), sin sidebar ni contador.
  - Header editorial limpio `.ms-hero` (kicker con dot `--signal`, 1 CTA verde + 1 CTA dark-glass, título display `Inter Tight` uppercase, intro directa sin ficha derecha `.ms-facts`).
  - Bento Grid de 12 columnas unificado para `Sim-to-Real` (Luigi) y `Platanus Hack 26` (`platanus-pitch.mp4` primero en tamaño contenido `span 7`).
  - Reproductor custom de video estilo Tridi (play/pause, scrubber interactivo con `--signal`, tiempo `tabular-nums`, mute/unmute, botón abrir en visor; cero `<video controls>` y cero fullscreen nativo).
  - Visor unificado `.ms-viewer` (fotos + videos en un solo marco fijo `3:2` en desktop / full-room en móvil, borde `var(--line-strong)`, esquinas `.ms-corner`, grading BG oscuro Tridi, cross-fade de 2 capas, controles custom para video, scroll lock, botones `close`/`prev`/`next` con hover neutro sobrio sin `scale(1.06)` ni glow verde, y footer mínimo `Evento · 1 / N`).
- **`web/src/style.css`:** Reemplazado todo el bloque de `#/milestones` y `.photo-viewer` por estilos alineados a `landing.css` y `docs/design-system.md` (`hover: hover` gated, cero `translateY` en hover, cero `backdrop-filter` doble, responsive `<= 1000px` / `<= 860px` / `<= 768px` / `<= 640px`).

## Qué funcionó

- `npm --prefix physics run check`: 16/16 suites en verde.
- `npm --prefix web run check && npm --prefix web run build`: i18n, skeleton, overlay y build limpio (`659 ms`).
- Verificación visual y DOM en headless Chrome (`1440×900` y `390×844`, `EN`/`ES`): `0` videos con `controls`, `0` overflow horizontal, marco fijo `1158×772` (`3:2`) idéntico entre video y foto, scroll lock verificado al abrir/cerrar visor.
- Ajuste tras inspección visual móvil: `white-space: nowrap` en `.ms-cta` (evitó salto de línea en `Abrir Simulaciones →`) y ajuste fino de brillo en `.ms-v-fill`.

## Sigue

- Revisión visual manual de Juan en preview local sobre `juan/studio-overhaul`.

## Ajuste v2 tras revisión visual de Juan

- **Orden cronológico inicial:** `Platanus Hack 26 Caracas` (`Oct 2026`) primero y activo por defecto; `Primer Sim-to-Real físico` (`Nov 2026`) segundo.
- **Full-width real:** removidos `max-width` de `.ms-title` y `.ms-intro` (`1334px` = 100% del contenedor).
- **Galería pura sin ruido:** eliminados `.ms-corner` (esquinas blancas), `.ms-tile-chip`, `.ms-tile-cap`, `.ms-tile-expand` y barras de video inline en el grid. Row 1 balanceada `50/50` (`ms-span-6` + `ms-span-6`, `661×441` exactos) y Rows 2–3 en `3` columnas uniformes `3:2`.
- **Ambient blurred BG en fotos y videos:** `.ms-bg-fill` en cards no-`3:2` del grid y `.ms-v-fill` / `.ms-v-fill-vid` sincronizado en el visor unificado (`blur(32px) saturate(1.25) brightness(0.56)`).
- **Controles Tridi propios y hovers visibles:** botones geométricos (`border-radius: 10px`), barra de video del visor en 1 línea delgada `.ms-v-hud` (`height: 38px`) solo dentro del visor, y hovers sobrios de mayor contraste (`rgb(241 243 238 / 0.16)` + borde `0.52`).
- Verificado `npm --prefix web run check` (`712` claves, `477` lookups), `npm --prefix web run build` (`854 ms`) y capturas Chrome desktop (`1440×900`) + móvil (`390×844`).

## Ajuste v3 — Simetría, círculos Tridi y mosaico editorial asimétrico

- **Espaciado simétrico 1:1:1:** `--ms-pad: 24px` (`16px` móvil) iguala exactamente el padding superior del panel, el espacio entre fila de botones y título (`24px`), y el espacio hacia la galería (`24px`).
- **Estándar Tridi de formas (`docs/design-system.md`):** restaurados círculos (`border-radius: 50%`) en `.ms-v-btn` (`close`, `prev`, `next`), `.ms-vid-badge` y `.ms-hud-btn`, y barra de reproducción tipo pill (`border-radius: 999px`) en `.ms-v-hud`.
- **Mosaico editorial variado (`.ms-bento` con `grid-auto-rows: 176px`):**
  - *Platanus Hack 26:* Row 1 `6+6` balanceado; Row 2–3 `3` (vertical `9:16` 3:12 AM) + `5` (foto focal mesa) + `4` (2 clips `16:9` apilados); Row 4 `8` (ensayo wide) + `4` (retrato equipo).
  - *Luigi Sim-to-Real:* Row 1 `6+6` videos con ambient fill; Row 2–3 `8` (CAD panorámico `3:1`) + `4` vertical (sensores reales) + `4+4` planos CAD; Row 4 `6+6` electrónica/tren motriz.
- Verificado `npm --prefix web run check && npm --prefix web run build` (`556 ms`) + capturas Chrome (`v3-platanus-mosaic`, `v3-luigi-mosaic`, `v3-viewer`).

- **Video demo actualizado:** reemplazado `web/public/media/platanus-pitch.mp4` por `~/Downloads/demo.mp4` transcodificado a `1280×720` H.264 + AAC `+faststart` (`18,8 MB`, `2:53`, bajo el límite de `25 MiB` de Cloudflare Pages) y llenado edge-to-edge en `hero-a`.

## Ajuste v4 — Opción A (Video Stage + Strip de 4 fotos) y Visor HUD Tridi Glass

- **Arquitectura separada Videos / Fotos (`web/src/screens/milestones.js`, `strings/milestones.js`, `style.css`):**
  - **Bloque 1 (`.ms-reel`):** un único **Video Stage** protagonista (`clamp(320px, 38vw, 480px)`) con selector pill compacto debajo (`01 Demo en vivo · 02:53` / `02 3:12 AM · 00:10` en Platanus; `01 Prueba en piso · 02:19` / `02 Hardware · 01:29` en Luigi) y ambient blurred fill automático para clips verticales.
  - **Bloque 2 (`.ms-photo-row`):** strip curado de 4 fotos limpias (`repeat(4, 1fr)` en desktop, `2×2` en móvil/tablet), sin videos mezclados ni texto/chips.
- **Visor Fullscreen 100% Tridi (`.ms-viewer`):**
  - Backdrop **glass pizarra ahumado** (`rgb(22 30 42 / 0.72)` → `rgb(11 15 22 / 0.78)` + `backdrop-filter: blur(18px) saturate(1.3)`), luminoso y con profundidad.
  - Shell HUD integrado alineado al marco `3:2`: arriba pill de evento (izq) + pill `ESC ×` (der); abajo dock pill unificado `[ ← · 01 / 06 · → ]` (sin botones flotando sueltos en los bordes como `juanevillam.com`).
- Verificado `npm --prefix web run check && npm --prefix web run build` y capturas desktop + móvil.

- **Platanus Hack 26 en pasado puro:** eliminado bloque `"What changed from that weekend to today"` (`m1.evolTitle`, `m1.e1..e3`) para que el hito quede atemporal sin requerir mantenimiento futuro.

## Ajuste v5 — Grid 3×2 de máxima calidad y backdrop punto medio

- **Platanus Hack 26 (`3×2` HD):** Fila 1 = 3 videos `16:9` HD (`platanus-pitch.mp4`, `platanus-huddle.mp4`, `platanus-floor.mp4`); Fila 2 = 3 fotos `3:2` HD (`platanus-stage.jpg`, `platanus-desk.jpg`, `platanus-rehearsal.jpg`). Eliminados clip vertical `3am-sim` y selfie `team.jpg`.
- **Luigi Sim-to-Real (`3×2`):** mismos 6 mejores elementos (2 videos + 4 fotos CAD/hardware) en el mismo grid limpio `3×2`.
- **Backdrop fullscreen punto medio:** `rgb(16 22 32 / 0.85)` → `rgb(9 12 18 / 0.90)` + `blur(20px) saturate(1.25)` + pill en `.ms-v-title` para lectura perfecta.

## Ajuste v6 — Dual Sliders (Videos | Fotos), navbar más oscuro, backdrop y HUD más grande

- **Dual Sliders lado a lado (`.ms-decks`):** Videos a la izquierda (`01/03` Platanus, `01/02` Luigi) y Fotos a la derecha (`01/03` Platanus, `01/04` Luigi), con dock pill `[ ← · 01 / 03 · → ]`, swipe táctil y apertura directa al visor unificado.
- **Copy auténtico de Platanus Hack 26:** actualizado en ES/EN reflejando las 36 horas duras/divertidas, el aprendizaje, no ganar pero salir con la base sólida de Tridi.
- **Accesibilidad y contraste:** `.app-topbar::before` subido a `rgb(10 12 16 / 0.92)` para evitar lectura de texto debajo al scrollear; botón de play `.ms-vid-badge` opaco de alto contraste en reposo y hover (`rgb(18 22 28 / 0.96)` + borde blanco); backdrop fullscreen subido un nivel (`0.90` → `0.93` + `blur(22px)`); controles de video fullscreen `.ms-v-hud` ampliados (`52px` alto, botones `38×38px`, íconos `18×18px`, scrubber `5px`).

## Ajuste v7 — Split editorial 2 columnas, Autoplay Deck con Mute inline y flechas laterales en Fullscreen

- **Layout Split 2 columnas (`.ms-split`):** texto, CTAs y notas técnicas a la izquierda (`.ms-col-text`); Media Deck(s) fijos (`position: sticky`) a la derecha (`.ms-col-media`).
  - *Platanus Hack 26:* 1 solo Live Media Deck (`6` ítems alternando video/foto).
  - *First physical Sim-to-Real:* 2 Decks separados por scope (`Hardware real`: 2 videos + 2 fotos; `Planos CAD`: 3 planos CAD) para nunca mezclar demo físico con CAD.
- **Autoplay + Mute inline + controles discretos en hover:**
  - Videos del Deck corren en `autoplay muted playsinline` con avance automático suave (pausado al hacer hover, al desmutear, al abrir visor o con `prefers-reduced-motion`).
  - Botón circular `.ms-deck-mute` en esquina inferior derecha cuando el slide activo es video (desmutea en sitio y pausa auto-avance; al abrir fullscreen transfiere `currentTime`).
  - Flechas `←`/`→` y contador `01 / 06` tenues en reposo (`opacity: 0.36` / `0.65`) y nítidos en hover.
- **Visor Fullscreen Tridi refinado:** backdrop azul-pizarra un paso más oscuro (`rgb(15 21 32 / 0.94)` → `rgb(7 10 15 / 0.96)` + `blur(24px)`), barra superior 3-slot (`• Evento` | `01 / 06` | `ESC ×`) y flechas `←`/`→` a los lados del marco en desktop (abajo en móvil), sin chocar con la barra de video `52px`.

## Ajuste v8 — Viewport zero-scroll, Glass Scope Switcher, fix mute/focus y subtítulos EN unificados

- **Layout zero-scroll en desktop (`> 1000px`):** `.ms-panel` ocupa la altura exacta del viewport (`clamp(500px, calc(100svh - var(--topbar-h) - 102px), 780px)`), columna izquierda `.ms-col-text` con `scroll-fade` interno si hay notas largas (Luigi), y columna derecha `.ms-col-media` con un solo Media Deck full-height preservando relación de aspecto real (`object-fit: contain`) sobre ambient blurred BG.
- **Glass Scope Switcher (`.ms-scope-bar`):** pill flotante estilo `#/live` en esquina superior derecha del stage de Luigi (`Physical hardware` | `CAD blueprints`) sin segundo deck apilado ni scroll.
- **Sincronización de Mute y fix de estados focus/hover:**
  - Abrir fullscreen preserva el estado `muted` actual del video en el deck (si estaba muteado, abre muteado; si tenía sonido, abre con sonido) y oculta el control de audio en `luigi-hardware.mp4` (silencioso).
  - Reemplazado `:focus-within` por `:focus-visible` / `:has(:focus-visible)` + `if (e.detail) btn.blur()` en todos los botones y cierre por mouse sin forzar foco de vuelta al stage (cero estados "pegados" al cerrar o quitar hover).
- **Subtítulos EN quemados estilo `platanus-pitch.mp4` (`whisper-cli` + Pillow + `ffmpeg overlay`):**
  - `platanus-huddle.mp4` (`3,41 MB`, 6 cues traducidos de la conversación real de Pastor/César).
  - `platanus-floor.mp4` (`2,50 MB`, `♪ Music ♪`).
  - `luigi-sim2real.mp4` (`11,50 MB`, 16 cues traducidos de la prueba real en piso).

## Ajuste v9 — Ambient color-field 6×4, cross-fade suave, historia Platanus y subtítulos 1:1

- **Ambient BG inteligente solo de colores (`paintAmbient`, `<canvas class="ms-ambient" width="6" height="4">`):** muestrea una sola vez el 86% superior del frame (recortando tickers/subtítulos) a una matriz de `6×4` con `blur(46px) saturate(1.4) brightness(0.55)` — cero tickers bailando, cero siluetas/sillas moviéndose abajo y elimina el segundo `<video>` decodificando en paralelo.
- **Transición cross-fade fluida (`420ms var(--ease)` + `scale(1.015 → 1)`):** espera a `loadeddata`/`onload` antes de intercambiar `.is-on` tanto en navegación manual (`←`/`→`) como en autoplay.
- **Historia completa en pasado de Platanus Hack 26:** agregadas 3 tarjetas editoriales (`m1.notesTitle`, `m1.n1..n3`) en la columna izquierda con scroll interno suave igualando el ritmo de Luigi.
- **Subtítulos EN 1:1 con `platanus-pitch.mp4`:** re-quemados con `Helvetica Neue Medium`, rectángulos rectos `0px` sin separación entre líneas (`line_gap = 0`, `rgba(0,0,0,200)`), idénticos al frame de Pastor.

## Ajuste v10 — Historia real de Platanus Hack 26 (cero repetición), media mentor/sketch y aire en cards

- **Historia real en ES/EN (`strings/milestones.js`):** intro concisa (2 líneas) + 4 tarjetas en pasado sin repetición: *De Real Steel a simulación física*, *El tembleque de pie y 60 M pasos en dos Macs*, *Mentoría con Sebastián Alcalá (cofundador de Wink)* y *Por qué seguimos después del domingo*.
- **Media ampliada en Platanus (`8` ítems):** importados `platanus-mentor.mp4` (`1,0 MB`, silencioso → `silent: true`) y `platanus-sketch.jpg` (`83 KB`) desde `~/Code/portfolio`.
- **Pulido UI (`.ms-notes`, `.ms-step`):** quitados los números `01..04` de todas las tarjetas (Platanus y Luigi) y aumentado el aire alrededor del divisor y del subtítulo (`margin-top: 12px; padding-top: 22px; gap: 16px`).

- **Platanus reducido a 3 tarjetas:** quitada tarjeta de mentoría (`m1.n3`), dejando 3 beats limpios (*De Real Steel a simulación física*, *El tembleque de pie y 60 M de pasos*, *Por qué seguimos después del domingo*).

- **Media de mentoría en alta calidad (`Platanus Hack 26`):** agregada foto `platanus-mentor-photo.jpg` (`1600×1066`, `365 KB`, convertida desde `~/Downloads/platanus-hack/1-25.png`) y reemplazado `platanus-mentor.mp4` por `IMG_2574.MOV` (`4K` → `1280×720` H.264 + AAC `+faststart`, `6,13 MB`, `30,4 s`, con subtítulo `[Mentorship session]`).

## Ajuste v11 — Luigi Sim-to-Real: 3 videos con subtítulos 1:1, CAD v1 + v2 y copy sin repetición

- **3 videos de `~/Downloads/sim-to-real/` transcodificados a H.264 30 fps con subtítulos EN 1:1 (`Helvetica Neue Medium`, caja `0px` `rgba(0,0,0,200)`):**
  - `luigi-sim2real.mp4` (`IMG_2316.MOV` → `720×960`, `18,41 MiB`, 16 subtítulos).
  - `luigi-hardware.mp4` (`IMG_2312.MOV` → `1280×720`, `20,94 MiB`, 11 subtítulos de Luigi explicando APDS-9960, Arduino UNO, HC-SR04, L298N, motores 200 RPM, baterías 3.7 V y condensador 100 µF; habilitado audio real quitando `silent: true`).
  - `luigi-calibration.mp4` (`IMG_2317.MOV` → `720×1280`, `5,35 MiB`, 3 subtítulos del sprint en piso).
- **Planos CAD Lab 3 (v1) + Lab 4 (v2):** agregados `luigi-v2-robot.png` (`279 KB`) y `luigi-v2-chasis.png` (`147 KB`) desde `physics/models/luigi_lab4/renders/` al scope `CAD blueprints` de Luigi (`5` planos en total: 3 de v1 + 2 de v2).
- **Historia de Luigi sin repetición (`web/src/screens/strings/milestones.js`):** reescrito `m2.intro` en pasado narrando cómo Ale conectó con su amigo Luigi D’Aquaro (Lab 3) para probar Sim-to-Real en metal real en una noche y sentar la base de Lab 4 (v2), dejando el detalle técnico a las 4 tarjetas (`m2.s1..s4`).
- **Verificación:** inspeccionados visualmente los frames de los 3 videos, tamaños `< 25 MiB` (Cloudflare Pages) y `npm --prefix web run check && npm --prefix web run build` en verde (`828` claves, `583` lookups).

## Ajuste v12 — Hardware solo videos, rotación vertical `IMG_2312`, subtítulos estandarizados y CAD regenerados desde `.step`

- **Physical hardware (`web/src/screens/milestones.js`):** removidas las 2 fotos (`luigi-real-sensores.jpg`, `luigi-real-cables.jpg`); el scope queda exclusivamente con los 3 videos de Luigi.
- **Rotación vertical + estandarización de subtítulos (estilo `platanus-pitch.mp4`):**
  - `luigi-hardware.mp4` (`IMG_2312.MOV`) rotado con `transpose=2` a vertical `720×1280` (`22,55 MiB`, 11 cues).
  - Re-quemados los 3 videos (`luigi-sim2real.mp4` `20,34 MiB`, `luigi-hardware.mp4` `22,55 MiB`, `luigi-calibration.mp4` `5,35 MiB`) con estilo unificado: `Helvetica Neue Medium`, caja redondeada `4px` `rgba(0,0,0,195)`, `line_gap = 2px`, tamaño proporcional (`22px` en `720×960` / `24px` en `720×1280`) y márgenes amplios idénticos a Platanus.
- **4 planos CAD dark-studio regenerados desde cero a partir de los `.step` en `~/Downloads/` (`Laboratorio3_Robot_Gestos_sin_nombres_2.2.zip` + `LAB4.zip` vía `cascadio` + `trimesh` + `matplotlib` + `PIL`):**
  - `luigi-cad-v1-iso.png` (`343 KB`) y `luigi-cad-v1-ortho.png` (`256 KB`) — Lab 3 (v1).
  - `luigi-cad-v2-iso.png` (`288 KB`) y `luigi-cad-v2-ortho.png` (`218 KB`) — Lab 4 (v2, con cabeza servo radar).
- **Verificación:** los 3 frames de video y los 4 planos CAD inspeccionados visualmente; `npm --prefix web run check && npm --prefix web run build` en verde.

## Ajuste v13 — Subtítulos 100% idénticos a Platanus Hack / Pastor en los 3 videos de Luigi

- Re-quemados los 3 videos de `First physical Sim-to-Real` usando la función exacta de Platanus Hack (`Helvetica Neue Medium` `index=10`, rectángulo recto `0px`, `line_gap = 0`, `pad_x = 0.28×fs`, `pad_y = 0.16×fs`, `rgba(0,0,0,200)`, `margin_bottom = 7.8%` del alto) con tamaño escalado al mismo tamaño efectivo en pantalla (`fs = 28` en `720×960` y `fs = 34` en `720×1280` = `17px` efectivos en el deck, idénticos a Platanus) y auto-wrap balanceado al `84%` del ancho:
  - `luigi-sim2real.mp4` (`20,29 MiB`, 16 cues).
  - `luigi-hardware.mp4` (`22,45 MiB`, 11 cues, vertical `720×1280`).
  - `luigi-calibration.mp4` (`5,34 MiB`, 3 cues, vertical `720×1280`).
- **Fix fotos invisibles en visor fullscreen (`web/src/style.css`):** eliminada regla huérfana `.ms-v-photo:not(.is-loaded) { opacity: 0; }` (ahora `.ms-v-layer` controla el cross-fade vía `.is-on` tras `onload`) y reconstruido `web/dist/` (`vite build`) para que `vite preview` sirva los videos recién generados y el CSS corregido.
- **Fix accesibilidad HUD de video en fullscreen (`web/src/screens/milestones.js`, `web/src/style.css`):** movida la barra `.ms-v-hud` fuera de `.ms-v-stage` a un slot dedicado `.ms-v-hud-slot` (`52px`) debajo del marco de video (`100dvh - 168px`), eliminando cualquier solapamiento entre controles del player y subtítulos en videos verticales y horizontales.
- **Pre-Commit Delta Audit (`craft` / `data` / `motion` / `a11y`):** `0` archivos `> 25 MiB`, `0` `translateY` en hover, `0` `:focus-within`, `0` `backdrop-filter` anidado, `4/4` contadores con `tabular-nums`, `16/16` assets resueltos en disco; eliminados `4` archivos huérfanos sin referencias (`luigi-v2-chasis.png`, `luigi-v2-robot.png`, `platanus-3am-sim.mp4`, `platanus-team.jpg`) y verificado `npm --prefix web run check && npm --prefix web run build` en verde.
- **Planos CAD originales de Luigi (`Lab 3 v1` + `Lab 4 v2`) con badge de versión:** reemplazados los renders propios por los 5 PNG originales limpios de Luigi (`luigi-cad-planta.png`, `luigi-cad-chasis.png`, `luigi-cad-frente.png`, `luigi-cad-rueda.png` de Lab 3 + `luigi-v2-chasis.png` de Lab 4, omitiendo ambos `render_robot.png` con z-fighting) y agregado pill bilingüe `.ms-deck-badge` / `.ms-v-badge` en esquina superior izquierda (`Lab 3 (v1)` vs `Lab 4 (v2)`) para que el usuario distinga cada versión sin ambigüedad.
- **Simetría de 3 cards y badges unificados en Luigi:** reducidas las tarjetas técnicas de Luigi a 3 (`m2.s1..s3`, fusionando drivers `HC-SR04` + `APDS-9960`), agregados badges descriptivos también a los 3 videos de `Physical hardware` (`hw.v1.run`, `hw.v1.walk`, `hw.v1.sprint`), y alineado `.ms-deck-badge` 1:1 en altura (`40px`), `top: 14px`, tipografía `11px` uppercase y rim glass con `.ms-scope-bar`.
- **Descompresión visual (mínima UI sobre media):** eliminados `.ms-deck-badge` y `.ms-v-badge` flotantes; en `CAD blueprints` la versión (`Lab 3 (v1)` / `Lab 4 (v2)`) se fusiona inline dentro del contador existente (`01 / 05 · Lab 3 (v1)`), dejando el borde superior libre solo para el switcher y los videos de `Physical hardware` completamente limpios.
- **Simplificación de columna izquierda:** eliminado el chip repetitivo de fecha `.ms-kicker` (la fecha ya vive en el selector superior), equilibrados `m1.intro` y `m2.intro` a 3 líneas completas (~255 caracteres cada uno) y reducido el CTA a 1 solo botón primario por hito (`Abrir Simulaciones →` / `Simular Lab 3 →`).
