---
persona: Pastor
rama: pastor/hardware-catalog-and-lab4
sesion: manual
inicio: 2026-11-25 02:00
estado: cerrada
---

# Radar técnico: evaluación y fork de orbefab/orbe

## Objetivo

Evaluar si el simulador open-source de circuitos y microcontroladores `orbefab/orbe` compite o complementa a Tridi, documentarlo en el radar técnico del repo y guardar un fork en la cuenta personal de GitHub (`Torpass`).

## Qué se hizo

- Se auditó el repositorio `orbefab/orbe` (`v0.3.0`, Rust puro, `MIT OR Apache-2.0`, emulación instrucción por instrucción de `ATmega328P` y `ESP32-S3`, solver eléctrico DC/transitorio, compilación a WASM y catálogo de ~96 piezas) y se contrastó contra `physics/src/assembler.js` y `physics/components/catalog.json`.
- Se creó el fork en la cuenta personal de Pastor: `https://github.com/Torpass/orbe`.
- Se creó [`docs/radar-herramientas.md`](../radar-herramientas.md) con el análisis técnico, diferencias frente a Vertical 2 de Tridi, limitaciones actuales (`L298N`, `HC-SR04`, motores TT aún ausentes en `v0.3.0`) y ruta de adopción progresiva.
- Se registró el nuevo documento activo en [`docs/README.md`](../README.md).

## Qué funcionó

- Fork creado y verificado vía `gh repo fork orbefab/orbe --clone=false` bajo la cuenta activa `Torpass`.
- Documentación integrada respetando el estándar de 2 capas en `docs/`.

## Qué no funcionó

- Sin incidencias.

## Decisiones

- **Clasificación:** `orbefab/orbe` es complemento directo de Vertical 2 (electrónica + ejecución de `.hex`), no competencia de MuJoCo/RL, Humanoides ni Plantas P&ID/PLC.
- **Prioridad:** Mantenerlo en radar sin desviar el foco actual de `P-1` (reconocimiento de imágenes P&ID / VLM) ni la validación con ZAKA (`A-1`). A corto plazo solo considerar pruebas de humo CLI sobre los `.ino` de `training/export_mcu.py` y posible contacto de comunidad (`J-1`).

## Sigue

- Confirmar si se hace `scripts/ship.sh` de la rama o si se acumula junto al siguiente bloque de `P-1`.
