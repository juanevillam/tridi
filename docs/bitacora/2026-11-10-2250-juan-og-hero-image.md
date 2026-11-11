# 2026-11-10 22:50 — Juan — Imagen Open Graph del hero (`og.png`) en `trytridi.com`

- **Persona:** Juan (@juanevillam)
- **Rama:** `juan/og-hero-image`
- **Tareas:** Imagen Open Graph (`og:image` / `twitter:image`) con el hero real de la landing para enlaces en LinkedIn y redes.

## Qué se hizo

1. **Captura del Hero en vivo (`web/public/og.png`, `1200 × 627`):**
   - Renderizado del hero de la landing en inglés (`?lang=en`) con el Unitree G1 de pie en MuJoCo WASM sobre la calle 3D, titular `ROBOTS THAT LEARN FROM ANY VIDEO`, telemetría en vivo (`MuJoCo · physics 250 Hz · policy 50 Hz`) y barra superior.
   - Añadido `web/scripts/render-og.sh` para regenerar `web/public/og.png` con Chrome headless (`2x` downsampled a `1200 × 627` vía `sips`) cuando cambie el hero.

2. **Metadatos Open Graph y Twitter Card (`web/index.html`):**
   - Añadidos `og:image` (`https://trytridi.com/og.png`), `og:image:width` (`1200`), `og:image:height` (`627`), `og:image:alt` y `twitter:image` en `web/index.html`.

## Verificación

- `npm --prefix physics run check` → 100 % verde.
- `npm --prefix web run check && npm --prefix web run build` → 100 % verde (`web/dist/og.png` exportado).
- Desplegado en Cloudflare Pages (`https://trytridi.com/og.png`).
