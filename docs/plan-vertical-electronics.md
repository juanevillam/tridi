# Plan Vertical Futuro — Tridi Electronics (Archivado hasta construir el motor eléctrico)

> **Estado (26 de noviembre de 2026):** Retirado temporalmente de la navegación pública (`trytridi.com` muestra solo las 3 verticales con casos reales documentados: **Humanoides**, **Rovers** e **Industrial**). Este documento guarda todo el contexto de producto, la referencia enviada por **Pastor** y los estándares visuales acordados con **Juan** para retomar la vertical sin repetir explicaciones.

---

## 1. Visión y Referencia de Pastor (`Orbe`)

Pastor compartió la referencia de **Orbe** (Alejandro Wurts) como norte de lo que debe hacer **Tridi Electronics**:

- **Links de referencia:**
  - Web: `https://orbefab.com/orbe`
  - Repo open-source: `https://github.com/orbefab/orbe`
  - Post LinkedIn: `https://www.linkedin.com/feed/update/urn:li:activity:7530655129960804352/`
  - Captura guardada en el repo: [`referencias/ref-orbe-electronics.jpg`](referencias/ref-orbe-electronics.jpg)
- **Propuesta central (cita de referencia):**
  > *"Simulador open source para circuitos digitales y electrónica, diseñado para que tu IA favorita lo use desde la terminal. Arma el circuito, lo prueba y te dice si algo va a fallar antes de que lo construyas. Calcula voltajes y corrientes de verdad, y te avisa cosas como 'ojo, este LED se va a quemar'. Cada parte viene con su modelo 3D y sus límites. Soporta Arduino Nano y Uno, ESP32 viene pronto. Tu agente lo prueba primero, y tú lo construyes ya que sabes que funciona."*
- **Cómo encaja en Tridi:**
  - Extiende el principio determinista de Tridi (*"la IA razona la topología; el código determinista valida la física y el control"*) a la capa eléctrica antes de compilar gemelos MuJoCo y firmware C99/PLC.
  - Conecta directamente con **Rovers** (`Luigi Lab 3/4`) e **Industrial** (`PLC S7-1200`), cerrando el ciclo: **Circuito eléctrico válido → Física 3D MuJoCo → Firmware determinista**.

---

## 2. Base Determinista que YA Existe Hoy en el Repo

Antes de construir el solver de circuitos/voltaje, ya contamos con:

- **`physics/components/catalog.json`** (catálogo P-1 con 14 escenas 3D MuJoCo):
  - **MCUs:** `Arduino UNO R3 (ATmega328P)` (`5.0 V`, `2048 B` SRAM, conflicto `Timer1` en `D9/D10` con `<Servo.h>`, `INT0/INT1` vs `PCINT`), `ESP32 DevKit V1` (`3.3 V`, `LEDC PWM`, `I2C 21/22`), `PLC S7-1200` (`24.0 V DC`).
  - **Drivers:** `L298N` (`1.4 V` caída, `2.0 A` máx) vs `TB6612FNG` (`0.2 V` caída, `1.2 A` máx).
  - **Actuadores y sensores:** `TT Gearmotor` (`deadzone_pwm: 115`), `SG90 Servo`, `NEMA 17`, `HC-SR04` (`pulseIn` `47.1 ms` vs `ISR`), `APDS-9960` (`0x39` / clones `0x9E`), `CNY70`.
- **Validación activa hoy:** `validateHardwarePinout` y parser `.ino` en `physics/src/assembler.js`.

---

## 3. Qué Construir Antes de Volver a Publicar `/electronics`

No volver a publicar la vertical en el navbar hasta tener al menos 1 caso real documentado y el solver eléctrico real:

1. **Solver eléctrico real (CLI / agente + navegador):**
   - Grafo de netlist determinista (nodos, fuentes, resistencias, LEDs, botones, pines MCU) con cálculo real de voltajes y corrientes por rama (nodal / SPICE ligero).
   - Verificación automática de límites por componente (corriente máxima de LED `20 mA`, caída en puente H, niveles lógicos `3.3 V / 5 V / 24 V`, presupuesto de brownout y derating térmico).
   - Interfaz pensada para agentes desde terminal (CLI/JSON estructurado con diagnósticos claros tipo `"LED_RED: 68 mA > 20 mA max"`).
2. **Caso físico documentado (equivalente a `caso-luigi-sim2real.md`):**
   - Al menos 1 circuito real armado en Arduino UNO / Nano o ESP32 validado primero en el simulador y luego en protoboard física.

---

## 4. Estándar Visual y Checklist para la Futura Landing `/electronics` (Feedback Exacto de Juan)

Cuando se reactive `/electronics`, aplicar obligatoriamente estas decisiones validadas por Juan (en `web/src/landing/electronics/`):

- **Escena 3D clara y legible estilo Orbe:**
  - Iluminación de estudio clara de 3 puntos sobre rejilla grafito (`#13171e`), **nunca** una escena oscura donde la placa se pierda en sombras.
  - **Arduino UNO R3** azul reconocible (USB-B, jack DC, DIP-28 ATmega328P, headers, silkscreen) + **protoboard blanca de 400 puntos** + **cables puente curvos 3D** con conectores DuPont + **LEDs domo** en secuencia viva + **resistencias axiales** + **botón táctil `@btn1`** presionable con etiqueta proyectada.
- **Hero realmente interactivo (cero botones pasivos de scroll):**
  - Botón primario `.btn.btn-signal.hero-push` (`Pulsar @btn1 [ESPACIO]`) que acciona físicamente el botón en 3D.
  - Botón secundario `.btn.btn-ghost` (`Simular fallo LED` / `Restaurar 220 Ω`) que dispara en vivo la alerta de sobrecarga (`68 mA > 20 mA máx`) + terminal compacto (`car: RED | walk: GO`).
- **Paridad 1:1 con `/` (`landing.css` + `style.css` — cero componentes duplicados):**
  - Usar `<div class="landing el-landing">` para heredar exactamente `.film`, `.film-hud`, `.sim-readout` (mismo componente con `ⓘ` y reloj `t`), `.btn` / `.btn-signal` / `.btn-ghost` (misma tipografía de botones) y `.panel`.
  - Tarjetas de capítulos ancladas arriba en `--card-top` (mismo locket que Capture/Gym/Policy en `/`), nunca centradas verticalmente.
  - Último ítem de listas técnicas sin divisor inferior (`border-bottom: 0`).
  - Reconectar en `web/src/navigation.js` (`VERTICALS` + `VERTICAL_COPY`), `web/src/strings-navigation.js`, `web/src/router.js` (`ROUTES` + `LANDING_ROUTES`) y `web/scripts/check-i18n.mjs`.
