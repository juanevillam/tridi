# Manual de Marca e Identidad Visual — Tridi (Noviembre 2026)

> **PDF Oficial Completo (25 páginas):** [`docs/pitch/manual-de-marca-tridi.pdf`](pitch/manual-de-marca-tridi.pdf)  
> **Pitch Deck Oficial (Platanus Hack 26):** [`docs/pitch/tridi-pitch.pdf`](pitch/tridi-pitch.pdf)

Tridi es una marca de deep tech para los equipos que construyen y entrenan robots. Su identidad visual funciona como un instrumento de laboratorio: oscura, precisa, con un solo color de acento (`Señal #C8FF2E`) y con el producto en vivo —el robot en simulación física MuJoCo— como imagen principal.

---

## 1. El Símbolo y el Wordmark

- **Concepto:** Una persona convertida en datos 3D para un robot.
  - El **cubo** visto desde arriba en tres tonos de la Señal representa el «3D» del nombre.
  - Sus **tres aristas internas** son, a la vez, los brazos levantados y la columna de una persona.
  - La **cabeza** es una articulación circular sobre la cara superior y el **pecho** es una articulación cuadrada en el vértice central (igual que los keypoints que `Capture` extrae de un video).
- **Wordmark (`tridi`):**
  - Siempre en minúsculas, **Inter Tight Bold (700)** con tracking `-0.015em` (`-1.5%`).
  - Las íes no llevan el punto redondo de la fuente: usan la `ı` sin punto (`U+0131`) y un cuadrado propio de `0.15em` en color Señal (`#C8FF2E` sobre fondo oscuro, o Señal 3 `#6B8F0E` sobre fondo claro).
- **Tamaños mínimos y área de seguridad:**
  - Margen libre alrededor igual a `x` (la altura de la cara superior del cubo).
  - Horizontal: `24 px` de alto en pantalla (`8 mm` impreso). Por debajo de `24 px`, usar solo el símbolo (`16 px` favicon).

---

## 2. Paleta de Colores (`web/src/style.css`)

**Proporción aproximada:** `70% Grafito · 22% Tinta · 8% Señal`.

### Colores de Marca
| Nombre | Hex | RGB | Variable CSS | Uso |
| :--- | :--- | :--- | :--- | :--- |
| **Grafito** | `#08090B` | `8 · 9 · 11` | `--bg` | Fondo base de todo |
| **Señal** | `#C8FF2E` | `200 · 255 · 46` | `--signal` | Acento único: botones primarios, keypoints, lo que se toca o está en vivo |
| **Señal 2** | `#9FD61C` | `159 · 214 · 28` | `--signal-2` | Cara izquierda del cubo |
| **Señal 3** | `#6B8F0E` | `107 · 143 · 14` | `--signal-3` | Cara derecha del cubo y puntos de las íes sobre fondo claro |
| **Tinta** | `#F1F3EE` | `241 · 243 · 238` | `--ink` | Texto principal y fondos claros |

### Colores de Interfaz
| Nombre | Valor | Variable CSS | Uso |
| :--- | :--- | :--- | :--- |
| **Fondo profundo** | `#0F1112` | `--bg-deep` | Paneles sobre el Grafito |
| **Escena** | `#2B3034` | `--scene` | Fondo de las escenas 3D |
| **Tinta suave** | `#A9ADA4` | `--ink-soft` | Texto secundario |
| **Apagado** | `#7D8279` | `--muted` | Etiquetas y ayudas |
| **Línea** | `Tinta al 12%` | `--line` | Bordes y divisores |
| **OK** | `#6FCF8A` | `--ok` | Estados correctos |
| **Error** | `#FF6A5A` | `--error` | Errores y alertas |

---

## 3. Tipografía

Ambas familias son libres (licencia OFL) y se cargan desde `@fontsource-variable`:

1. **Inter Tight** (`Regular 400`, `Medium 500`, `Semibold 600`, `Bold 700`): Grotesca compacta para titulares, texto y botones.
   - Titulares: `Inter Tight 600`, mayúsculas, tracking `-2.5%`, segunda línea en Señal (`#C8FF2E`).
   - Texto de cuerpo: `Inter Tight 400`, `17 px`, interlineado `1.5`, Tinta suave (`#A9ADA4`).
   - Botones: `Inter Tight 600`, `13 px`, mayúsculas, tracking `+6%`, bordes rectos de `4 px`.
2. **Geist Mono** (`Regular 400`, `Medium 500`): Monoespaciada exclusivamente para lo que se mide: números, unidades (`N`, `cm`, `s`, `Hz`, `fps`), etiquetas y telemetría (`11–12 px`, mayúsculas, tracking `+6%`).

---

## 4. Principios Visuales y Usos Incorrectos

1. **Un solo acento:** Base de un solo tono, grises fríos y la Señal (`#C8FF2E`) solo para lo que se toca o se mide. Nada de degradados de colores.
2. **El producto es la imagen:** La simulación en vivo del robot en MuJoCo reemplaza cualquier foto de stock o ilustración. Si algo se mueve en pantalla, es el robot o los datos.
3. **Números en vez de adjetivos:** `«4 de 4 empujones de 250 N»` en vez de `«robusto»`. Cada cifra con su fuente en el repositorio.
4. **Bordes rectos:** Radios de `2 px` y `4 px`, nunca píldoras (`border-radius: 999px`). Puntos clave cuadrados.
5. **Prohibido en el logotipo:** No agregar sombras/brillos, no inclinar/rotar, no invertir el orden símbolo–texto, no cambiar colores, no usar solo contorno, no estirar y nunca usar la `i` con punto redondo.
