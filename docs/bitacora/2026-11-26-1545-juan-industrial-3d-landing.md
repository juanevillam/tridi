---
persona: Juan
rama: juan/studio-overhaul
sesion: 8218dc4f-4ef9-4d1a-bf92-d5f441a9c4bf
inicio: 2026-11-26 15:45
estado: abierta
---

# Landing visual 3D scrolleable de Tridi Industrial (`/industrial`)

## Objetivo

Reemplazar la vista genérica de `vertical.js` para `/industrial` por una experiencia 3D scrolleable cinematográfica en `juan/studio-overhaul` enfocada en `factory_cell` (banda transportadora + prensa selladora + pistón desviador + brazo robótico paletizador de 6 ejes + gabinete PLC S7-1200 / PackML) dentro de un entorno de planta futurista dark-monochrome con acentos `--signal: #c8ff2e`, aislada en `web/src/landing/industrial/` con carga diferida en `web/src/router.js` y sin tocar `/`, `home.js`, `header.js` ni `milestones`.

## Qué se hizo

- **Módulos dedicados en `web/src/landing/industrial/`:**
  - `industrial-world.js`: escena WebGL Three.js procedural sincrónica (`0` `.glb` externos, sin espera de MuJoCo WASM, `FILM_PIXEL_RATIO = 1.5`, PMREM arquitectónico y `dispose()` completo de GPU/ResizeObserver/rAF al desmontar). Replica la geometría y estaciones reales de `physics/models/factory_cell/factory_cell.xml` (tolva/pesaje `ST-01`, visión + pórtico sellador + torreta Andon `ST-02/03`, pistón neumático + bandeja rechazo + Euro-pallet `ST-04`, gabinete NEMA 12 PLC S7-1200 + HMI, haces ópticos `PE-01/PE-02/PE-03` en `--signal`) más un brazo robótico articulado de 6 ejes y nave industrial minimalista con cerchas, luminarias lineales y anillo holográfico de foco por estación.
  - `industrial-landing.js`: narrativa en 3 capítulos + cierre unificado (`closingSectionHTML` + `footerHTML`), smooth scroll Lenis + cámaras interpoladas por capítulo, selector interactivo de 4 estaciones en Capítulo 2 (`Tridi Assembler`), toggle en vivo de modo PLC (`Sync óptico 0,0 % merma` vs `Timer fijo 28,0 % patinaje`) y recetas `ISA-88` (`250 g / 500 g / 1 kg`) en Capítulo 3 (`Validación física & PLC / PackML`), HUD unificado inferior derecho (`PACKML · EXECUTE / FAULT`, ciclo, merma y LEDs `PE-01..03`) y CTAs a `/assembler`, `/simulations/factory_cell` y `/delivery`.
  - `industrial.css`: estilos encapsulados bajo `.industrial-landing` siguiendo `docs/design-system.md` (un solo CTA verde por capítulo, inmunidad de contraste activo en `:hover`, layout móvil `<= 860px` con scroll-snap y `.phone-arrows`).
  - `strings.js`: diccionario bilingüe ES/EN completo registrado en `web/scripts/check-i18n.mjs`.
- **Conexión lazy en `web/src/router.js`:** `/industrial` carga `./landing/industrial/industrial-landing.js` como chunk separado (`39.95 kB` JS / `14.00 kB` gzip; `5.28 kB` CSS / `1.51 kB` gzip).

## Qué funcionó

- `npm --prefix web run check`: `17` diccionarios ES/EN (`983` claves), `750` lookups, `check-skeleton` y `check-video-overlay` en verde.
- `npm --prefix web run build`: Vite `8.3.4` (`411` módulos) en `776 ms`, chunk `industrial-landing` separado.
- Verificación visual en navegador real (`1440×900` desktop y `390×844` móvil) con `0` errores de consola/WebGL tanto en carga/interacción como al desmontar ruta hacia `/rovers`.

## Qué no funcionó (y se corrigió)

- Primera pasada de screenshots detectó: (1) regla global `button:hover:not(:disabled)` sobreescribiendo el fondo verde del botón de estación activo al hacer hover, (2) `.eyebrow` redundante al lado de `.hero-platforms`, (3) tercer CTA (`Ver Entregables`) en `#validation` rozando el borde inferior a `900 px` de alto, y (4) encuadre móvil demasiado cerrado en Hero. Todo corregido y re-verificado en screenshots v2.

## Decisiones

- Usar una escena Three.js dedicada en `industrial-world.js` (reflejando las coordenadas/estaciones reales de `physics/models/factory_cell/factory_cell.xml`) en lugar de compartir el singleton MuJoCo G1 de `robot-host.js`, para obtener arranque instantáneo, 0 interferencia con `/` y `dispose()` WebGL determinista al cambiar de ruta.

- **Iteración v3 (feedback de Juan — escala, densidad, iluminación `world.js`, copy Hero y drag-orbit):**
  - `industrial-world.js`: escalada a mega-fábrica 1:1 (celda principal `6.0 m`, silo dosificador `2.8 m`, pórtico sellador `2.45 m`, brazo industrial de 6 ejes `2.4 m`, gabinete NEMA 12 Siemens S7-1200 + pantalla HMI SCADA renderizada en canvas `2.15 m`), sumadas 2 líneas paralelas activas (`z = ±5.8 m`) con brazos y cajas en movimiento, puente grúa móvil superior, 2 AGVs autónomos en pasillos, mezzanine elevada, racks AS/RS, iluminación ciber-crepuscular idéntica a `world.js` (`0x151c29`, `Sky` PMREM, piso PBR `world-textures.js`, conos volumétricos Fresnel y pools elípticos). Corregida la dirección de drag-and-drop (`z - sin(az)` idéntico a `home.js`).
  - `strings.js` + `industrial.css`: recortado el Hero al mismo presupuesto de copy de Humanoides (`Plantas que corren / antes del PLC`), lede de 2 líneas sin corte a la izquierda, y foco orbital dinámico por estación al cambiar entre `ST-01`, `ST-02/03`, `ST-04` y `PLC S7-1200`.

- **Iteración v4 (IK físico de paletizado + Giga-Factory campus amplio y calmo):**
  - `industrial-world.js`: reemplazado el movimiento oscilatorio por **IK analítico de 2 eslabones con easing quíntico (minimum-jerk)** en el brazo de 6 ejes: la caja frena en el tope del buffer (`x = 2.35`), el gripper la toma físicamente, describe un arco suave y la apila en el Euro-pallet (`2×2×2`, 8 posiciones reales); al completarse los 8 espacios, el shuttle desliza el pallet lleno por la cama de rodillos mientras entra un pallet vacío (cero cajas desapareciendo). En modo `slip`, el pistón empuja la caja por la rampa inclinada con caída por gravedad hacia un contenedor de rechazo con paredes.
  - Mundo ampliado a campus **Giga-Factory de `140×80 m`** con cámara shift-lens arquitectónica idéntica a `home.js` (`m[9] = -m[5] * tan(el)` + `Sky` + `FogExp2 0.0135`): 3 zonas diferenciadas (bahía central + 2 líneas paralelas calmas a `z = ±9.5 m`, ala de silos de acero inoxidable con tuberías aéreas y mezzanine de sala de control acristalada con escalera) y props variados (montacargas eléctrico, remolcador con pallet, 2 AMRs estacionados en base de carga, estaciones de operador HMI + gabinetes de herramientas, bolardos de seguridad y jardineras arquitectónicas con árboles interiores).

## Sigue

- Iterar visualmente con Juan sobre `/industrial` en `juan/studio-overhaul` (sin deploy ni merge/push a `main`).
