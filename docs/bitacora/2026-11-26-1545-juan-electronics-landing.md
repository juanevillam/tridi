---
persona: Juan
rama: juan/studio-overhaul
sesion: 63f77811-f261-4cd7-9179-2c4cc9371147
inicio: 2026-11-26 15:45
estado: cerrada
---

# Retiro temporal y archivo de contexto de Tridi Electronics (`/electronics`)

## Objetivo

Prototipar la landing visual 3D de `/electronics` y posteriormente retirarla de la navegación y rutas públicas hasta construir el motor eléctrico real y documentar un caso físico, dejando todo el contexto de Pastor (Orbe) y los estándares visuales de Juan guardados en el repo.

## Qué se hizo

- **Contexto archivado permanentemente en el repo:**
  - Creado [`docs/plan-vertical-electronics.md`](../plan-vertical-electronics.md) e indexado en [`docs/README.md`](../README.md) con la visión y enlaces de la referencia **Orbe** enviada por Pastor (`orbefab.com/orbe`, `github.com/orbefab/orbe`, LinkedIn), la base ya existente en `physics/components/catalog.json`, los requisitos del futuro solver eléctrico y la checklist exacta de UI/UX acordada con Juan.
  - Guardada la captura original de Pastor en [`docs/referencias/ref-orbe-electronics.jpg`](../referencias/ref-orbe-electronics.jpg).
- **Retiro limpio de Electronics de la UI pública (`web/`):**
  - Eliminado `electronics` de `VERTICALS` y `VERTICAL_COPY` en `web/src/navigation.js` (desaparece automáticamente de topbar desktop/móvil, `.hero-platforms`, cierre y footer) y de `web/src/strings-navigation.js`.
  - Eliminada la ruta `/electronics` de `ROUTES` y `LANDING_ROUTES` en `web/src/router.js`, removida su entrada de `web/scripts/check-i18n.mjs` y eliminada la carpeta `web/src/landing/electronics/`.

## Qué funcionó

- `npm --prefix web run check` y `npm --prefix web run build` en verde sin menciones activas a Electronics en navegación ni rutas.

## Decisiones

- Publicar únicamente las 3 verticales con casos reales documentados (**Humanoides**, **Rovers** e **Industrial**). Reactivar **Electronics** cuando exista el solver eléctrico (voltaje, corriente por rama y alertas de límites) y al menos un caso físico documentado.

## Sigue

- Continuar revisión y `scripts/ship.sh` sobre las 3 verticales activas en `juan/studio-overhaul`.
