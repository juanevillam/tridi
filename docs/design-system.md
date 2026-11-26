# Tridi Design System & UI Standards (`web/`)

Fuente única de verdad de UI/UX para **Landing (`#/`)** y las 5 pantallas de **Tridi Studio (`#/simulations`, `#/live`, `#/upload`, `#/delivery`, `#/assembler`)** en Desktop y Móvil. Combina la identidad visual de [`docs/marca.md`](marca.md) con el estándar de ingeniería de interfaces de Juan (dark-first, cero twin drift, rendimiento sobre WebGL a 60 fps).

> **Regla de oro:** Antes de estilizar cualquier superficie, popover, botón, card o vista móvil en Tridi, aplicar estas reglas primero para resolver el 90% de la calidad en una sola pasada y evitar iteraciones píxel a píxel.

---

## 1. Tipografía y Jerarquía

| Rol | Fuente | Tamaño / Peso | Uso |
| :--- | :--- | :--- | :--- |
| Display / Títulos | `Inter Tight` (`--display`) | `600–700`, `tracking: -0.025em` a `-0.04em`, `line-height: 0.94–1.06` | `h1`, `h2`, títulos de tarjetas y botones primarios. |
| Cuerpo / Copy | `Inter Tight` (`--display`) | `400`, `14px–18px`, `line-height: 1.45–1.5`, color `--ink-body` | Párrafos cortos (máx. `56–64ch`). |
| Técnico / UI / Nav | `Geist Mono` (`--mono`) | `500–600`, `10px–12px`, `uppercase`, `tracking: 0.04em–0.08em` | Links de navbar, labels de controles, badges, telemetría. |
| Números vivos | `Geist Mono` (`--mono`) | `font-variant-numeric: tabular-nums; white-space: nowrap;` | Relojes (`t`), pasos, Hz, fuerzas (`N`), velocidades (`0.5×`). |

---

## 2. Elevación y Superficies (3 niveles exactos)

En dark mode sobre canvas 3D (WebGL / MuJoCo), **más elevado = más opaco y denso** para mantener contraste AA sin ensuciar el texto con el 3D de atrás:

| Nivel | Superficie | Fondo | Borde | Radio | Blur |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Nivel 0** | Canvas / Fondo | `var(--bg)` (`#08090b`) | — | — | — |
| **Nivel 1** | **Chrome persistente** (`.topbar`, `.app-topbar`, `.sim-readout`, docks flotantes) | `rgb(10 12 16 / 0.78)` (`0.86` al scrollear) | `1px solid var(--line)` | `var(--r-card)` (`14px`) en desktop · `0` si va attached en móvil | `var(--lg-blur)` (`blur(16px) saturate(1.8)`) en `::before` con `transform: translateZ(0)` |
| **Nivel 2** | **Cards / Paneles** (`.panel`, cards de Capture/Gym/Policy/Studio) | `rgb(10 12 16 / 0.84)` | `1px solid var(--line)` | `var(--r-card)` (`14px`) | Ninguno o `blur(12px)` fijo sin animar |
| **Nivel 3** | **Popovers / Dropdowns / Tooltips** (`.nav-drop-panel`, `.lang-menu`, `.sim-tooltip`) | `rgb(10 12 16 / 0.96)` | `1px solid var(--line-strong)` | `var(--r-card)` (`14px`) | **SIN `backdrop-filter`** (a 96% opaco no aporta y provoca flickering de capas GPU sobre WebGL) |

### Regla de color y acento (`--signal: #c8ff2e`)
- **Un solo CTA verde por pantalla/capítulo.** Botones secundarios (`Open Studio` en topbar, `How it learns`, botones de acción auxiliar) siempre son **dark-glass neutros** (`rgb(241 243 238 / 0.08)`, borde `rgb(241 243 238 / 0.24)`, hover `rgb(241 243 238 / 0.14)`).
- **Links de navbar y triggers de idioma:** hover neutro blanco/glass (`color: var(--fg)`, `background: rgb(241 243 238 / 0.08)`), nunca borde extra ni texto verde en hover.
- **Sin bordes de acento curvos** en la parte superior de tarjetas redondeadas (`border-top: 2px solid var(--signal)` prohibido).

---

## 3. Componentes Unificados (Zero Twin Drift)

1. **Popovers (`Studio`, `Idioma`, `Tooltip`):**
   - Contenedor: `padding: 0`, `gap: 0`, `border: 1px solid var(--line-strong)`, `border-radius: var(--r-card)`, `background: rgb(10 12 16 / 0.96)`, sombra `0 20px 44px -14px rgb(0 0 0 / 0.85)`.
   - Filas: `border: 0`, divisor `border-bottom: 1px solid var(--line)` edge-to-edge (última sin borde), radio superior en `:first-child` e inferior en `:last-child`, hover neutro `rgb(241 243 238 / 0.06)`. **Cero bordes anidados** dentro de ítems de menú.
   - Estado seleccionado (ej. idioma activo): fondo `rgb(200 255 46 / 0.12)` + texto `var(--signal)` + checkmark `✓`. Ítems de navegación pura (ej. Studio) no llevan estado activo ni iluminación del icono al click.
   - Iconos en menú Studio: en desktop, contenedor sutil `34×34px` (`radius: 9px`, `rgb(200 255 46 / 0.08)`, `border: 1px solid rgb(200 255 46 / 0.16)`, icono `var(--signal)`); en móvil, sin caja, `18×18px` SVG centrado verticalmente.
2. **Botones — Círculo vs Pill:**
   - Un solo icono (`×`, globo, play/pause, reset): **círculo** (`border-radius: 50%`, ancho = alto, mín. `36px`).
   - Botón con texto: **pill** (`border-radius: 999px`, `white-space: nowrap`).
3. **Encuadre Desktop de Landing (Cadencia 1× / 2×):**
   - Arriba del `.topbar`: `--nav-top: 12px`.
   - Entre `.topbar` y esquinas viewfinder (`.corner.tl/tr`), debajo de `.corner.bl/br` y a izquierda/derecha (`--frame-x`): `--frame-gap: 24px` (exacto 2×).
   - Esquinas `.corner`: sharp 90° (`14×14px`, `1px solid rgb(241 243 238 / 0.36)`), alineadas al mismo `--frame-x` del `.topbar`.

---

## 4. Reglas Móviles y Pantallas Densas (`<= 860px` / `<= 1000px`)

1. **Header móvil attached full-width:**
   - `inset: 0 0 auto 0`, `border-radius: 0`, `padding: 10px var(--gutter)`, mismo color `rgb(10 12 16 / 0.78)` que desktop, solo `border-bottom: 1px solid var(--line)`.
   - Drawer fullscreen: **fade puro (`200ms ease`)**, sin `translateY`, sin flash del header.
   - Al abrir drawer: **scroll lock obligatorio** (`lenis?.stop()` + `html.style.overflow = 'hidden'`). Al cambiar idioma: cerrar menú automáticamente.
   - Idioma en móvil: aparece a la izquierda del botón `X` cuando el menú está abierto.
   - Alineación izquierda (`text-align: left`) en móvil; no centrar bloques editoriales sobre 3D.
2. **Progressive Disclosure en pantallas complejas de Studio (`Simulations`, `Live`, `Upload`, `Delivery`, `Assembler`):**
   - **Viewport 3D manda:** en móvil, el canvas 3D ocupa la parte superior visible sin scroll; debajo va **1 sola barra primaria compacta** (Play/Pause + selector principal o CTA).
   - **Controles secundarios (sliders de física, terrenos, cámara, metadata) colapsados** dentro de `<details>` o bottom-sheet/drawer bajo demanda. Nunca apilar > 2 filas de controles visibles a la vez en móvil.
   - **Touch vs 3D:** en Landing (3D de fondo con scroll), desactivar órbita táctil (`if (narrow() || e.pointerType === 'touch') return`). En pantallas de Studio (donde el canvas es interactivo), limitar `touch-action: none` estrictamente al `<canvas>` para que el resto de la página scrollee normal.
3. **Hover en pantallas táctiles:**
   - Todo `:hover` de links, tabs y acordeones va dentro de `@media (hover: hover) and (pointer: fine)` + `btn.blur()` al colapsar acordeones para evitar estados "pegados" tras un tap.

---

## 5. Animación, GPU Compositing y Zero CLS

- **Cero `backdrop-filter` anidado o animado sobre WebGL:** causa repromoción de capas GPU y flickering en links vecinos. Mantener `backdrop-filter` solo en el pseudo-elemento fijo `::before` del navbar (`transform: translateZ(0)`).
- **Feedback táctil instantáneo (0 ms delay):** disparar animaciones de click (`Push it`, botones) en el instante del evento, usando `::after` con `transform + opacity` (GPU-only) sin tocar el `box-shadow` base del botón.
- **Duraciones estándar:** `120ms–150ms ease` (hover, tooltips, dropdowns), `200ms ease` (drawers/modales fade), `300ms var(--ease)` (cambios de panel).
- **Zero CLS en números, ancho natural en texto:** fijar `min-width` en `ch` + `tabular-nums` en contadores (`t`, `contacts`, `speed`), pero **NO** fijar `min-width` rígidos grandes en pills de texto variable (generan huecos artificiales).

---

## 6. Copy Multi-Idioma (ES / EN)

- **Copy-budget por idioma:** escribir ES y EN con longitudes equivalentes (no traducción literal).
- **Unidades indivisibles:** usar `\u00A0` (`250\u00A0Hz`, `4\u00A0ms`, `50\u00A0Hz`, `20\u00A0ms`) para que número y unidad nunca se partan entre líneas.
- **Wrapping limpio:** usar `max-width` en `ch` + `text-wrap: balance` solo en titulares/ledes cortos de 2 líneas; **nunca** `text-wrap: balance` en tooltips o párrafos de 4+ líneas (deja aire vacío irregular a la derecha).
- **Evitar CSS por idioma (`html[data-lang='...']`):** solo aceptable como excepción puntual en el `h1` display del Hero móvil; nunca generalizarlo a componentes de Studio.

---

## 7. Anti-Patrones Prohibidos

- ❌ Dos `backdrop-filter` superpuestos animándose sobre un `<canvas>` WebGL.
- ❌ Bordes dentro de bordes en dropdowns (ej. ítems con caja/borde dentro de un panel con borde).
- ❌ Múltiples CTAs verde `--signal` compitiendo en la misma vista.
- ❌ Animar `box-shadow` en botones que ya tienen sombra/glow base (causa flicker al terminar).
- ❌ Dejar el scroll del fondo activo cuando un drawer/modal móvil está abierto.
- ❌ Meter 5+ controles/sliders abiertos por defecto en pantallas de Studio en móvil.
