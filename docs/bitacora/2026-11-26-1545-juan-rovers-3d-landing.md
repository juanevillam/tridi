---
fecha: 2026-11-26
persona: juan
rama: juan/studio-overhaul
area: web
sesion: d9cbb30b-5e84-4ff1-88dc-7cd2eddc88cf
---

# Landing 3D Scrolleable de Tridi Rovers (`/rovers`)

## Qué se hizo
- Se creó la experiencia 3D scrolleable dedicada para **Tridi Rovers (`/rovers`)** en `web/src/landing/rovers/` completamente aislada de Humanoides (`/`), `header.js`, `home.js` y `milestones.js`:
  - `web/src/landing/rovers/rovers-world.js`: escena Three.js dedicada con las **7 mallas STL paramétricas reales** de `physics/models/luigi_lab4/assets/` ensambladas con las coordenadas/articulaciones exactas de `luigi_lab4.xml`, navegando un laberinto brutalista oscuro procedural (reutilizando texturas cacheadas de `world-textures.js`, iluminación PMREM + `FogExp2`), ruedas diferenciales con cinemática sincronizada al scroll, cuello servo `SG90` activo (`±62°`) con raycast ultrasónico 2D real contra paredes del laberinto, abanico LiDAR/ultrasónico en `--signal (#c8ff2e)`, trayectoria iluminada progresiva, anillo de calibración en la arena de salida y `dispose()` completo de WebGL al salir de la ruta.
  - `web/src/landing/rovers/rovers-landing.js`: narrativa en 3 capítulos con Lenis + GSAP ScrollTrigger + cámara shift-lens y órbita libre con mouse en desktop:
    1. **Hero 3D (`#home`):** Luigi en la entrada del laberinto, selector de verticales, CTA principal `--signal` a `/simulations/luigi_lab4` y HUD de telemetría en vivo (`SG90`, `HC-SR04`, `50 Hz`).
    2. **Física & Sensores (`#sensors`):** ángulo bajo siguiendo ruedas TPU y radar SG90, telemetría tabular en vivo (`cm`, `deg`, `RPM`), selector `V2 · Radar SG90` vs `V1 · Fijo HC-SR04`, botón/tecla `Space` de pulso LiDAR y checkpoints del laberinto (`01 Entrada`, `02 Chicane`, `03 Salida`).
    3. **Sim-to-Real & Firmware C99 (`#sim2real`):** vista arquitectónica 3/4 de la arena final, specs (`2.3 KB` ONNX, `461 B` SRAM, `50 Hz`, `0` choques), strip editorial de evidencia física real con lightbox de video bajo demanda (`luigi-sim2real.mp4` / `luigi-hardware.mp4`, cero descarga inicial) y CTAs a `/simulations/luigi_lab4`, `/simulations/luigi_lab3` y `/delivery`.
  - `web/src/landing/rovers/rovers.css` y `web/src/landing/rovers/strings.js`: estilos encapsulados bajo `.rovers-landing` siguiendo `docs/design-system.md` y paridad bilingüe ES/EN registrada en `web/scripts/check-i18n.mjs`.
  - `web/src/router.js`: conectado `/rovers` con lazy import (`() => import('./landing/rovers/rovers-landing.js')`).

## Qué funcionó
- **Iteración v3 (feedback de Juan sobre cámara, retículas y visor):**
  - Retículas de piso reemplazadas por el **mismo shader `fwidth`-antialiased de precisión** de `home.js` (`makeMarks`: aro calibrado + arcos segmentados + marcas 15°/90° + aura suave), eliminando `RingGeometry` y marcadores de colisión verdes.
  - Trayectoria reducida a una línea arquitectónica hairline limpia (`1.4 cm`, sin blobs ni puntos verdes en paredes) y visor ultrasónico suavizado con `lerp` exponencial en tonos vidrio/cool-slate sin saltos al rozar paredes.
  - Coreografía multi-ángulo: **Hero** cenital sobre el laberinto (`el: 78°`), **Sensors** en cámara persecución detrás del rover mirando los pasillos (`az: 168°, el: 22°`), **Sim-to-Real** en plano 3/4 frontal bajo idéntico a `#policy` de Humanoides (`az: 22°, el: 12°`) y **Closing** cenital abierto.
- **Iteración v2 (feedback de Juan):**
  - Cámara cenital / vista desde arriba (`el: 74°..84°`, FOV `32°`, orientación fija norte-arriba para no rotar el laberinto en curvas) sobre un **laberinto real en grilla `11×9`** con pasillos, ramificaciones y callejones sin salida, bloques con bordes luminosos superiores e iluminación ciber-crepuscular armonizada con `/` (`sunLight 2.25` + `hemiLight 1.35` + `keyLight` + `toneMappingExposure 1.23` + `FogExp2 0x151c29`).
  - Paridad exacta de posición, tipografía y componentes con `/` (`landing.css`): `.hero-caption`, `.gym-caption.panel` (con `.steps-meter`, `.axis-track`, `.axis-stops` y `.gym-controls`) y `.policy-caption.panel` (con `.specs` 2×2 y CTAs en 1 línea) en `left: var(--gutter)` y `top: var(--card-top)`.
  - `.closing` y `.footer` integrados con el mismo telón GSAP `--shade` y animación `.manifesto` de `home.js`, verificado en screenshot dedicado (`desktop-v2-footer.png`).
- `npm --prefix web run check` (17 diccionarios ES/EN, 985 claves, 746 lookups) y `npm --prefix web run build` (`rovers-landing` = `15.63 kB` gzip JS + `1.45 kB` gzip CSS).
- Chrome headless desktop (`1440×900`) + mobile (`390×844`): `0` errores de consola/runtime.

## Siguiente paso
- Revisión visual de Juan sobre los screenshots desktop/mobile para ajustar cualquier detalle de cámara, ritmo o copy antes de hacer commit en `juan/studio-overhaul`.
