---
persona: Juan
rama: juan/studio-overhaul
sesion: 962e8065-f685-4442-bf77-d4c54aed6345
inicio: 2026-11-26 10:15
estado: abierta
---

# Arquitectura multi-vertical, navegación unificada y rutas limpias

## Objetivo

Rediseñar la arquitectura de producto, navegación y enrutamiento de `web/` en la rama `juan/studio-overhaul` para presentar a Tridi como plataforma multi-vertical en `trytridi.com`: mantener `/` abriendo con Humanoides + selector de plataforma, crear landings dedicadas (`/humanoids`, `/rovers`, `/industrial`, `/electronics`), unificar la agrupación en 2 secciones (`Verticales` + `Herramientas de Studio`) en topbar y cierre (`Hardware is here`) tanto en desktop como en móvil, y migrar de `#/...` a rutas limpias History API con redirección desde URLs legadas y fallback SPA nativo — preservando el mundo 3D "Año 10000", `#capture`, `#gym`, `#policy` (`g1-bailar`/`g1-saludar`), ajustes R3, `milestones` y el layout interno de las pantallas individuales de Studio, sin deploy, merge ni push a `main`.

## Qué se hizo

- **M1 — Rutas limpias History API y base SPA (`R3`):**
  - `web/vite.config.js`: fijado `base: '/'` y `appType: 'spa'` para rutas limpias en dev/preview y fallback SPA nativo de Cloudflare Pages (sin `404.html` ni `_redirects`, conservando `web/public/_headers`).
  - `web/index.html`, `web/src/video-overlay.js`, `web/src/screens/live.js` (`PHONE_WEB`), `web/src/screens/delivery.js`, `web/src/screens/home.js`: migrados paths de entrada (`/src/main.js`), medios (`/media/...` + `resolveAsset()`) y enlaces de QR/pantallas.
  - `web/src/router.js`: migrado a History API (`/`, `/humanoids`, `/rovers`, `/industrial`, `/electronics`, `/simulations`, `/live`, `/upload`, `/delivery`, `/assembler`, `/milestones`, `/camera`, `/net`) con `popstate`, intercepción de `<a>`, redirección automática desde `#/...` y aliases en español (`OLD_NAMES`) vía `history.replaceState` preservando `?api`/`?lang`/`?debug`, desplazamiento suave a anclas (`#capture`, `#gym`, `#policy`, `#home`, `#try`) vía `tridi:anchor` + `scrollToHash` y cancelación de transiciones rápidas (`cancelPending()`, guardia de `FADE_MS = 180` y carrera `SLOW_MS`).
  - `physics/src/policy.js`, `web/src/stage.js`, `physics/scripts/check-assembler.mjs`: corregido `TypeError` de `sr.neckDeg` en `scanWheeledSensors` al abrir `/simulations/luigi_lab4`.
- **M2 — Navegación unificada, selector en `/` y cierre (`R2` + `R1`):**
  - `web/src/navigation.js` + `web/src/strings-navigation.js` (registrados en `web/scripts/check-i18n.mjs`): fuente única extensible `VERTICALS` (`humanoids`, `rovers`, `industrial`, `electronics`) y `STUDIO_TOOLS` (`simulations`, `live`, `upload`, `delivery`, `assembler`) con matriz explícita de herramientas por vertical (`Humanoids`: `simulations`, `live`, `upload`, `delivery`; `Rovers`: `simulations`, `delivery`; `Industrial`: `assembler`, `simulations`, `delivery`; `Electronics`: preview `"Próximamente"` / `tools: []`).
  - `web/src/header.js`, `web/src/screens/home.js`, `web/src/style.css`, `web/src/landing/landing.css`: desplegable superior unificado con 2 secciones (`Verticales` + `Herramientas de Studio`), ajuste de viewport (`positionNavPanel()`), `inert` en el drawer móvil, cierre `Hardware is here` y footer de 4 columnas sincronizados, y selector `.hero-platforms` en `/` manteniendo intactos el mundo 3D "Año 10000", `#capture`, `#gym`, `#policy` (`g1-bailar`/`g1-saludar`) y `milestones`.
- **M3 — Landings dedicadas por vertical (`R1`):**
  - `web/src/screens/vertical.js`, `web/src/screens/vertical.css`, `web/src/screens/strings/verticals.js` (registrados en `web/scripts/check-i18n.mjs`):
    - `/humanoids`: `unitree_g1` (29 DoF, 33,3 kg) y `unitree_h1` (19 DoF), `/media/caminar.mp4` (`preload="metadata"`), anclas a `/` (`/#capture`, `/#gym`, `/#policy`) y herramientas exclusivas.
    - `/rovers`: `luigi_lab3` y `luigi_lab4` (`5.000.000` pasos), selector lazy de video (`/media/luigi-sim2real.mp4` ↔ `/media/luigi-hardware.mp4` con pausa fuera de pantalla), 6 imágenes CAD/hardware lazy y enlaces a `Simulations` (`luigi_lab3`/`luigi_lab4`) y `Deliveries`.
    - `/industrial`: `factory_cell` (`4,4 s` ciclo, `0,0 %` merma, `ISA-88` `250 g / 500 g / 1 kg`) + `Assembler` (`.dxf`/`.pdf` vectorial, 16 clases `ANSI/ISA-5.1`, FDS, `.csv` I/O, `.scl`/`.L5K`) y enlaces directos a `Assembler`, `Simulations` (`factory_cell`) y `Deliveries`.
    - `/electronics`: preview honesto `"Próximamente"` / `"Coming soon"` basado en `physics/components/catalog.json` (`Arduino UNO R3`, `ESP32`, `PLC S7-1200`, `L298N` vs `TB6612FNG`), sin herramientas ni telemetría ficticia.
  - Presupuesto preservado: cero cambios de layout/CSS interno en `live`, `upload`, `simulations`, `delivery`, `assembler` y `milestones`.
- **Endurecimiento E2E (Tiers 4–5):**
  - `physics/src/index.js`: serialización `opChain`, contadores `policySeq`/`worldSeq`/`placeSeq` y `cancelPending()` en `createSimView` contra carreras BFCache/desmontaje en `Simulation.puppet()`.
  - `web/src/robot-host.js`, `web/src/stage.js`, `web/src/robot-pane.js`, `web/src/screens/delivery.js`, `web/src/screens/home.js`, `web/src/main.js`, `web/src/i18n.js`: `attachQueue` + recuperación `FINAL_LEVEL`/`missingPolicy`, `dispose()` y limpieza WebSerial (`#arduino-connect`), guardas de desmontaje en `delivery.js`, `isG1Sim` en `home.js`, omisión de `loadRobot()` en `/camera/:id`, `aria-checked` y retorno de foco al pulsar `Escape`.
- **Documentación Capa 1 y Capa 2:**
  - Actualizados `docs/estado.md`, `docs/ROADMAP.md`, `docs/infra-and-security.md`, `docs/architecture-and-sim2real.md` y `docs/README.md` (sin tocar bitácoras previas ni secciones de Pastor, César o Ale).

## Qué funcionó

- `npm --prefix physics run check`: **16/16** suites en verde (`exit 0`).
- `npm --prefix web run check`: **14** diccionarios ES/EN, **824** claves, **583** lookups, **17** clips + `check-skeleton` + `check-video-overlay` en verde (`exit 0`).
- `npm --prefix web run build`: Vite `8.3.4`, **399** módulos; `web/dist` = **288 archivos** (`< 20.000`), **186,17 MB** (`177,55 MiB`), archivo máximo `media/luigi-hardware.mp4` = **22,45 MiB** (`< 25 MiB`), `og.png` = **278 KB**, `_headers` intacto y sin `404.html` ni `_redirects`.
- Suite E2E headless Chrome (desktop y móvil, Tiers 1–5): **167/167 PASS** (`Tier 1: 65`, `Tier 2: 65`, `Tier 3: 16`, `Tier 4: 6`, `Tier 5: 15`, `0` fallos).

## Qué no funcionó

- `sr.neckDeg.toFixed` lanzaba `TypeError` al entrar directo a `/simulations/luigi_lab4` (resuelto en `physics/src/policy.js` y `web/src/stage.js`).
- Carrera entre `:focus-within:not(.dismissed)` y `bringToFront` al cerrar el dropdown con `Escape` (resuelto con `restoringFocus` y `suppressFocusOpen`).
- `RangeError` intermitente en `Simulation.puppet()` al navegar rápido o volver por BFCache en `/delivery` (resuelto con `opChain`/`cancelPending()` y `attachQueue`).
- Desincronización de `popstate` y anclas durante el fade de `180 ms` en `router.js` (resuelto con `isTransitioning` + `cancelPending()`).

## Decisiones

- Usar fallback SPA nativo de Cloudflare Pages (`base: '/'`, `appType: 'spa'`) sin `404.html` ni `_redirects` para evitar bucles de redirección y conservar `web/public/_headers`.
- Mantener `/` abriendo con Humanoides junto al selector de plataforma, en lugar de convertir `/` en un directorio estático sin mundo 3D.
- Centralizar verticales y herramientas en `web/src/navigation.js` + `web/src/strings-navigation.js` para agregar o quitar verticales sin tocar grillas ni CSS por pantalla.
- Mantener sin cambios el layout interno de las pantallas individuales de Studio (`live`, `upload`, `simulations`, `delivery`, `assembler`) y de `milestones`.

## Sigue

- Revisión visual manual de Juan en preview local sobre `juan/studio-overhaul` (todos los cambios están sin commit ni merge).
- Tras aprobación de Juan: commits agrupados y `scripts/ship.sh` (`J-Ship` en `docs/ROADMAP.md`), más tareas activas `J-1` y `J-2`.
