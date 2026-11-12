# Registro de Eventos de Campo, Reuniones y Casos Reales — Tridi

> **Propósito de este documento:** Tener en **un solo lugar claro** el resumen ejecutivo y técnico de todas las reuniones presenciales, pruebas con hardware real y sesiones de validación industrial de Tridi, con enlaces directos a sus archivos de código y documentos de detalle.

---

## Evento #1: Primer Caso Sim-to-Real Físico con Luigi D'Aquaro (`luigi_lab3` y `luigi_lab4`)

- **Fecha y lugar:** 7 de noviembre de 2026 · Reunión presencial en casa de Alejandro Hernández (Barquisimeto).
- **Participantes:** Juan Villa, Alejandro Hernández, Luigi D'Aquaro (Ingeniero Electrónico).
- **Estado:** **Completado y en producción** (`trytridi.com/#/milestones`, `#/simulations/luigi_lab3`, `#/simulations/luigi_lab4`).
- **Documento técnico detallado:** [`docs/decisiones/2026-11-07-primer-sim-to-real-luigi.md`](../decisiones/2026-11-07-primer-sim-to-real-luigi.md)

### 1.1 Qué pasó en la reunión (Resumen Ejecutivo)
1. **El reto:** Demostrar que Tridi no solo mueve robots en una pantalla WebGL, sino que puede tomar el diseño CAD y el código de un robot físico real, construir su gemelo digital en MuJoCo y exportar un cerebro que lo mueva en el piso real sin chocar.
2. **El hardware (`Rover Luigi v1 — luigi_lab3`):** Chasis diferencial impreso en 3D (6 piezas `.stl` diseñadas en Python `build123d`), 2 motores TT con reductora (`200 RPM`), llantas de TPU, puente H `L298N`, batería 2S `18650` (`7.4 V`), sensor ultrasónico `HC-SR04` (`A0/A1`), sensor óptico I2C `APDS-9960` (`0x39`) y microcontrolador `Arduino UNO (ATmega328P, 2 KB RAM, 32 KB Flash)`.
3. **Lo que encontramos al conectarlo:** El código original de Arduino de Luigi tenía **bloqueos críticos** que hacían que el robot chocara en el piso:
   - `pulseIn()` en el ultrasónico `HC-SR04` congelaba el procesador hasta **`47.1 ms`** cuando no recibía eco.
   - El sensor morado `APDS-9960` era un clon chino con `Chip ID = 0x9E` (la librería oficial de SparkFun solo acepta `0xAB`/`0x9C`), por lo que `apds.init()` fallaba en silencio y dejaba el sensor apagado; además, `readGesture()` tenía un `while(1)` bloqueante.
   - Los motores TT tenían una zona muerta de fricción estática en el piso (`PWM < 110` solo zumbaba sin mover la rueda).
4. **Cómo lo resolvimos esa misma noche:**
   - Importamos las 6 piezas `.stl` a MuJoCo ([`physics/models/luigi_lab3/luigi.xml`](../../physics/models/luigi_lab3/luigi.xml)) y calibramos la fricción y masa real.
   - Entrenamos y exportamos la política neuronal [`training/policies/luigi-lab3.onnx`](../../training/policies/luigi-lab3.onnx) (`obs_dim = 15`, `nu = 2`) y la transpilamos a C puro a `50 Hz` (`20 ms`) ocupando solo **22 % de RAM (`461 bytes`)**.
   - Reemplazamos `pulseIn()` por interrupciones de hardware (`ISR(PCINT1_vect)` en `0.01 ms`) y escribimos un driver I2C directo por registros para el chip `0x9E` como radar IR continuo a `40 Hz` (`0.2 ms`) con auto-calibración al encender.
   - Conectamos el robot en vivo a `trytridi.com` por **WebSerial USB (`9600 baud`)** y luego lo desconectamos para probarlo autónomo en el piso.
5. **Resultado medido:** Más de **2 minutos continuos** rodando de forma 100 % autónoma en la sala (`web/public/videos/luigi-floor.mp4`), esquivando zapatos, muebles, sofás y cables en lazo cerrado sin un solo choque.
6. **Evolución inmediata (`Rover Luigi v2 — luigi_lab4`):** A partir de este caso construimos la versión 2 con servomotor `SG90` en el cuello (`servo_neck`, `±75°`) que barre un cono frontal con 3 rayos de distancia y le da memoria espacial (`dist_left`, `dist_center`, `dist_right`) para decidir hacia qué lado girar sin titubear ([`physics/models/luigi_lab4/luigi.xml`](../../physics/models/luigi_lab4/luigi.xml)).

---

## Evento #2: Reunión de Validación Industrial con Ing. José González (`ZAKA, C.A.`)

- **Fecha y lugar:** 12 de noviembre de 2026 · Barquisimeto, Lara.
- **Participantes:** Ing. José González (Fundador y Director de `ZAKA, C.A.`, `zakasys.com`, papá de José Miguel, amigo de colegio de Ale) + Equipo Tridi (Ale, Juan, Pastor, César).
- **Estado:** **Preparación lista** (se actualizará con las conclusiones reales al terminar la reunión).
- **Documento completo de preparación y preguntas:** [`docs/internal/preparacion-reunion-zaka-y-claridad-producto.md`](preparacion-reunion-zaka-y-claridad-producto.md)

### 2.1 Perfil de ZAKA, C.A. (`zakasys.com`)
- **Trayectoria:** Fundada en **2004** (+20 años en plantas reales de Venezuela), con sede en Calabozo y oficina en Barquisimeto (`+58-251-4154658`).
- **Ecosistema técnico:** *Bronze System Integrator* oficial de **Rockwell Automation (Allen-Bradley)**, *Registered System Integrator* de **AVEVA (Wonderware / InTouch / System Platform)** y especialistas en **Siemens (`TIA Portal`, `S7-1200/1500`, `WinCC`)**.
- **Verticales principales:** Alimentos, Bebidas y Empaque (dosificación `ISA-88`, fin de línea `PackML`, variadores `PowerFlex`/`Sinamics`) y Petróleo, Gas, Plásticos y Cemento (retrofits de extrusoras, tableros MCC).
- **Promesa central de ZAKA:** *"Modernizar líneas sin detener la planta, trabajando en ventanas de parada reales."*

### 2.2 Postura del Equipo y Reglas de Oro (Alineación Ale + Pastor + Juan)
1. **No vamos a venderle nada ni a competir con ZAKA:** El Sr. José nos recibe por el cariño y la confianza personal con Ale. Vamos con humildad como jóvenes ingenieros a pedirle consejo a alguien con 22 años de experiencia real en planta.
2. **Alianza y generación de relevo (Regla de Ale):** ZAKA tiene 22 años de reputación, clientes industriales y dominio de PLCs/SCADA; Tridi es un equipo joven dedicado a simulación física 3D (MuJoCo) e IA. **Jamás insinuar que Tridi automatiza las maniobras manuales por su cuenta ni que reemplaza al integrador:** quien diseña, vende y monta la automatización en la planta es **ZAKA**, y Tridi es el software de simulación 3D / gemelo físico para que los ingenieros de ZAKA prueben y pre-calibren sus proyectos antes de la parada de planta.
3. **Qué le mostramos en 2 minutos en `trytridi.com`:**
   - `#/milestones` y `#/simulations/luigi_lab4`: Cómo tomamos el CAD `.stl` y el código con bloqueos del robot de Luigi, lo simulamos en MuJoCo y corregimos la física y el firmware.
   - `#/simulations/factory_cell`: La celda de empaquetado industrial con cinta, pistón neumático, selladora y fotoceldas (comparando el PLC de timer fijo cuando la cinta patina vs. el control sincronizado).
4. **Las 3 Hipótesis de Validación que queremos responder con él:**
   - **H1 (Ventanas de parada / Puesta en marcha):** ¿Cuánto tiempo se pierde hoy el día de la parada ajustando variadores, sensores y tiempos directamente sobre la máquina física, y si un gemelo físico 3D previo les ahorraría horas reales?
   - **H2 (Merma y desincronización en líneas PackML):** ¿Qué es lo que más traba o genera merma en las empaquetadoras que ellos atienden en Venezuela (desincronización cuando patina la cinta o cambia el formato del envase vs. fallas mecánicas/sensores)?
   - **H3 (Del simulador al PLC real):** Como ningún jefe de planta mete una caja negra en un PLC, ¿qué tan útil sería para ZAKA que el simulador 3D exporte tablas de parámetros deterministas (recetas `ISA-88` / `PackML`) o bloques en **Texto Estructurado (`ST` IEC 61131-3)** para `Studio 5000` y `TIA Portal`?
