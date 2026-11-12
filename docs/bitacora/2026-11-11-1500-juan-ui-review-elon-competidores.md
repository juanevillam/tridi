# 2026-11-11 15:00 · Juan · Revisión de UI, Elon sobre Optimus y competidores

## Qué se hizo

- **Servidor web local** levantado (`npm --prefix web run dev -- --host`, http://localhost:5173) para que Juan revise toda la UI. El servidor de datos (`127.0.0.1:8000`) y el túnel ya estaban arriba.
- **Mapa de estados de UI:** checklist por ruta con URL y pasos para llegar a cada estado. Quedó como artefacto de la sesión, fuera del repo, porque la UI va a cambiar.
- **Voces:** nueva carpeta [`yc/investigacion/voces/`](../../yc/investigacion/voces/README.md) para transcripciones de referentes hablando de robots. Primera entrada: Elon Musk en Dwarkesh (feb 2026), 1:17:22–1:30:21, con la transcripción cruda (whisper `large-v3-turbo`) y el análisis para Tridi.
- **Competidores:** se sumó Labelbox (Terra) a [`yc/competidores.md`](../../yc/competidores.md). **No es YC**, aunque se creía que sí: no tiene ficha en YC y su financiamiento viene de SoftBank, a16z y otros. Asimov se revisó y no tiene noticias desde octubre.

## Qué funcionó y qué no

- `yt-dlp --download-sections` dio 403. Funcionó bajar el audio completo (`-f bestaudio`) y cortar el tramo con `ffmpeg`.

## Hallazgos de lógica

- El botón WebSerial (`stage.js:584-634`) no está en el markup, así que nadie puede llegar a él.
- Los selects de config de la caja Entrenar (pasos y empujones) no se envían al servidor (`training.js:85`).

## Siguiente

- Juan revisa la UI y pasa sus mejoras.
- En paralelo (lógica y motor): lazo sim-to-real con la telemetría real de Luigi, y que la caja Entrenar mande la config al servidor.

---

## Actualización (2026-11-12 00:40) · Pulido de UI/UX, postura en `#/delivery` y preparación ZAKA

- **Landing (`web/src/landing/landing.css`):** Footer más grande y con más presencia (`padding: 40px 36px 48px`, wordmark `clamp(72px, 10vw, 136px)`, `foot-specs` a `13px`) manteniendo `margin-top: clamp(140px, 20vh, 220px)` para no chocar con las tarjetas `.tries` de arriba.
- **Simulaciones (`web/src/screens/simulations.js`, `web/src/stage.js`, `web/src/training.js`, `web/src/policies.js`, `web/src/strings-names.js`, `web/src/strings-stage.js`):**
  - Eliminado el selector `#show` (`Persona y robot / Solo persona / Solo robot`) de `Playback`: los clips humanos muestran siempre `Persona y robot` lado a lado.
  - Eliminado el lugar `Vereda (Sidewalk)` del selector de lugares en `#/simulations`.
  - La sección `Objetos, agarre y líquidos` (`#grasp-box`) ahora solo se muestra cuando el lugar activo es `Cocina` en el Unitree G1.
  - El botón `Empujar al robot` (`.push`) se oculta automáticamente en los robots custom (`luigi_lab3`, `luigi_lab4`, `factory_cell`) y cuando el modo es `Sin física`.
  - Ocultados los selectores de configuración (`Pasos de práctica PPO`, `Empujones`, `4 mundos`) en la vista `preloaded` de la caja de entrenamiento para que solo aparezcan al entrenar un clip propio grabado o subido.
  - Renombrado *"Robot entrenado con"* a *"Política activa (cerebro ONNX)"* y aclarados los nombres de `Lab 3` / `Lab 4` a `Rover Luigi v1 (Sensores Fijos)` y `Rover Luigi v2 (Radar Servo SG90)`.
- **Postura erguida del G1 en `#/delivery` y simulaciones (`web/src/screens/delivery.js`, `physics/src/policy.js`):** Amortiguado el pitch hacia adelante de pelvis y cintura (`pose[4]` y `pose[21]`) en los cuadros de replay de `#/delivery` (preservando las caídas reales en los últimos `0,35 s`) y reforzado el bias vertical de cintura en `policy.js`.
- **Manual interno para reunión con ZAKA, C.A. (`docs/internal/preparacion-reunion-zaka-y-claridad-producto.md`):** Investigación completa de ZAKA, C.A. (`zakasys.com`, Ing. José González), aclaración de producto/UX para el equipo, conexión con Elon Musk (Optimus / Sim-to-Real / fábricas 24/7), cruce técnico de los 8 servicios de ZAKA con Tridi, y sección de reglas de oro ("Qué NO hacer: aliados y generación de relevo, cero competencia").

---

## Registro de Eventos de Campo y Validación Industrial (Hitos en persona)

1. **Evento 1 — Reunión y Pruebas Físicas con Luigi D'Aquaro (`luigi_lab3` y `luigi_lab4`, 7–10 de noviembre de 2026):**
   - **Qué pasó:** Llevamos a tierra el primer caso físico Sim-to-Real de Tridi con el robot diferencial de Luigi D'Aquaro (Arduino UNO, L298N, motores TT 200 RPM con llantas de TPU, ultrasónico `HC-SR04` y sensor óptico `APDS-9960` clon `0x9E`).
   - **Qué descubrimos en la mesa real:** El código original fallaba en el piso por tres razones físicas que no se ven en un IDE: (1) zona muerta de fricción estática con `PWM < 115`, (2) bloqueo de `47,1 ms` por llamada a `pulseIn()` sin eco que dejaba al robot ciego antes de chocar, y (3) rechazo del sensor `APDS-9960` por `Chip ID 0x9E`.
   - **Cómo le dimos la vuelta:** Armamos el gemelo digital en MuJoCo con sus 6 piezas `.stl`, entrenamos la política cerrada a **50 Hz (`luigi-lab3.onnx`)** y construimos el compilador automático `training/export_mcu.py` (`J-3`) que genera C99 nativo no bloqueante (`PCINT1` + registros I2C directos). El robot físico recorrió el pasillo y esquivó las cajas a la primera (documentado en video en `#/milestones`), y luego escalamos al segundo prototipo con torreta servo `SG90` (`luigi_lab4`).
2. **Evento 2 — Preparación para Reunión de Validación Industrial con Ing. José González (`ZAKA, C.A.`, 12 de noviembre de 2026):**
   - **Con quién nos reunimos:** Ing. José González, fundador de **ZAKA, C.A.** (`zakasys.com`, 22 años automatizando plantas en Venezuela desde Calabozo y Barquisimeto; integradores oficiales de Rockwell Automation, Siemens y AVEVA en alimentos, bebidas, empaque PackML y petróleo/gas).
   - **Enfoque acordado por los 4 (Juan, Pastor, César, Ale):** Ir con humildad, como **aliados tecnológicos y generación de relevo** (jamás como competencia ni a "enseñarle qué es un PLC"), pedir su validación experta sobre dónde duele más hoy en piso de planta (ventanas de parada/puesta en marcha, merma por desincronización en empaque, retrofit de máquinas viejas) y abrir la puerta a documentar juntos un primer caso piloto industrial en Barquisimeto. Toda la guía quedó en [`docs/internal/preparacion-reunion-zaka-y-claridad-producto.md`](../internal/preparacion-reunion-zaka-y-claridad-producto.md).
   - **Ajuste clave de Ale sobre el Punto 4:** Se eliminó cualquier mención a que Tridi "automatiza las maniobras manuales del operador" por su cuenta (para que jamás se perciba que Tridi le quita chamba a ZAKA). Quien diseña, vende e instala la automatización en planta es **ZAKA**; Tridi se presenta 100 % como el software de simulación física 3D / gemelo digital para que los ingenieros de ZAKA pre-calibren y muestren sus proyectos al cliente antes de parar la planta.
   - **Limpieza de ruido en `docs/` y registro único de eventos:** Se creó [`docs/internal/eventos-y-casos-reales.md`](../internal/eventos-y-casos-reales.md) (unificando en un solo archivo el resumen de Luigi y el de ZAKA), se incorporó el nuevo Manual de Marca oficial de 25 páginas en [`docs/pitch/manual-de-marca-tridi.pdf`](../pitch/manual-de-marca-tridi.pdf) actualizando [`docs/marca.md`](../marca.md), se eliminó el borrador viejo `docs/pitch/deck/tridi-deck.*` y `docs/pitch/tools/`, y se movieron los borradores superados (`robots-fisicos.md`, `videos-para-datos.txt`, `grabacion/`) a [`docs/archive/`](../archive/).


