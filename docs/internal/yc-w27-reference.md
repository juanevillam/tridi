# Manual Técnico Interno 3: Referencia de Aplicación a Y Combinator Winter 2027 (`yc/`)

> **CONFIDENCIAL / USO INTERNO (`juanevillam/tridi`)**
> Estado de nuestra aplicación a **Y Combinator Winter 2027 (W27)**, qué quedó fijo en el formulario enviado vs. qué puede actualizarse, cómo están organizados los documentos en [`yc/`](../../yc/README.md), y qué avances nuevos tenemos listos para enviar como *Application Update* o mostrar en la entrevista.

---

## 1. Cronograma y Estado de la Aplicación (YC W27)

| Hito | Fecha / Estado | Detalle |
| :--- | :--- | :--- |
| **Origen del proyecto** | 23–25 de octubre de 2026 | Construido en 36 horas durante **Platanus Hack 26 Caracas** (151 commits del equipo). |
| **Deadline on-time YC W27** | **2 de noviembre de 2026, 8:00 pm PT** | Aplicación enviada para el batch **Winter 2027** (enero–marzo 2027 en San Francisco). |
| **Ventana de entrevistas** | Noviembre – inicios de diciembre de 2026 | Videollamada de ~10 minutos con partners de YC. |
| **Fecha límite de respuesta YC** | **11 de diciembre de 2026** | Notificación final para aplicaciones enviadas a tiempo. |
| **Servidor en vivo durante revisión** | Nov 3 – Dic 11, 2026 | La física y políticas preentrenadas corren solas en el navegador en **https://trytridi.com** y **https://tridi-alpha.vercel.app**; cuando la Mac de Juan tiene `./data/serve.sh` activo, también procesa subidas y entrenamientos en vivo. |

---

## 2. Qué está congelado vs. Qué SÍ se puede actualizar en `apply.ycombinator.com`

1. **Respuestas principales del formulario de empresa (`yc/aplicacion.md`) — Congeladas tras el envío:**
   - Las respuestas del cuestionario de la compañía (*Company*, *Progress*, *Idea*, *Equity*, *Curious*) y los videos adjuntos (`yc/videos/intro.mp4` y `yc/videos/demo.mp4`) quedan registrados tal como se enviaron al cierre del deadline.
2. **Perfiles individuales de cada fundador (*Founder Profile*) — Editables por cada uno:**
   - Cada co-founder puede seguir editando y manteniendo al día su propio **Founder Profile** en [apply.ycombinator.com](https://apply.ycombinator.com) (Background, Work History, Education, LinkedIn, GitHub y textos personales). Por eso los perfiles personales no se congelan aquí.
3. **Actualizaciones de progreso (*Application Updates*) en `apply.ycombinator.com` — Abiertas:**
   - YC permite enviar actualizaciones cortas y medibles cuando hay avances reales después de enviar la aplicación.

---

## 3. Resumen de las Respuestas Base de la Aplicación ([`yc/aplicacion.md`](../../yc/aplicacion.md))

Para que todo el equipo y sus agentes hablen el mismo idioma y conozcan la línea base que leyeron los partners de YC:

- **One-liner (≤ 50 caracteres):**
  > *"Turning everyday video into robot training data"* (47 caracteres).
- **Qué hace Tridi (*What is your company going to make?*):**
  - Convierte un video común de teléfono de una persona en datos de movimiento corregidos por física y políticas entrenadas (`ONNX`) para robots humanoides y físicos en tres pasos:
    1. **Capture:** Seguimiento de una persona en el video, extracción del esqueleto 3D (33 puntos, 30 fps) y retargeting a las 29 articulaciones del Unitree G1 (`3,2 cm` de error mediano).
    2. **Gym:** El robot practica ese movimiento millones de veces en física (MuJoCo) con aprendizaje por refuerzo (PPO), recibiendo empujones y variando piso, fricción, masa y motores hasta no caerse.
    3. **Policy:** El cliente recibe la política entrenada (`265 KB ONNX` que corre a `50 Hz` en `< 1 ms`) y el dataset de movimiento corregido por física en los 4 mundos.
  - Frase síntesis: *"The video says what to do; the simulation teaches how."*
- **Quién construyó el código (*Who writes code?*):**
  - 100 % construido por los fundadores en Platanus Hack 26 (151 commits en 36 horas) y continuado en `juanevillam/tridi`:
    - **Juan (CTO):** Pipeline de video a esqueleto 3D (`data/`), pipeline de entrenamiento e imitación (`training/`), servidor de video, infraestructura/seguridad (`trytridi.com`) y gran parte de la web (`web/`).
    - **Pastor:** Física en MuJoCo (`physics/`), modelo Unitree G1, retargeting, mundos y políticas RL (`training/`).
    - **César:** Experiencia web de la simulación (`web/`).
    - **Ale:** Estrategia, producto, pitch, relación con clientes y aplicación YC (`docs/`, `yc/`).
- **Modelo de negocio (*How will you make money?*):**
  - Cobro por habilidad entrenada (*per trained skill*: política ONNX + dataset corregido por física para el robot del cliente) y por volumen de datos de movimiento.

---

## 4. Qué Avanzó Tridi DESPUÉS de Enviar la Aplicación (Para el *Update* a YC y la Entrevista)

Cuando YC pregunta en una actualización o al inicio de la entrevista **"What has changed since you applied?"**, estos son los **4 hechos verificables** construidos entre el 3 y el 9 de noviembre de 2026:

1. **Primer Caso Real Sim-to-Real Físico Completado (`luigi_lab3`, 7–8 de noviembre de 2026):**
   - Al momento de enviar la aplicación, `yc/verdad-hoy.md` decía: *"Robot real: Nunca probado en un robot físico"*.
   - **Hoy ya cerramos nuestro primer ciclo Sim-to-Real en hardware físico real:** modelamos en MuJoCo el robot diferencial de Luigi D'Aquaro a partir de sus 6 piezas CAD STL, entrenamos la política de navegación y evasión (`luigi-lab3.onnx`), la transpilamos a C nativo (`461 bytes` de RAM a `50 Hz` en un Arduino UNO ATmega328P), resolvimos en vivo los cuellos de botella de sensores reales (`ISR(PCINT1_vect)` no bloqueante para el ultrasonido `HC-SR04` y driver I2C de registros para el clon `APDS-9960 0x9E`) y el robot físico navegó y esquivó obstáculos en piso real sin chocar.
   - Evidencia en vivo: **`https://trytridi.com/#/milestones`** y simulador interactivo en **`https://trytridi.com/#/simulations/luigi_lab3`**.
2. **De 3,5 s a Clips Completos con Captura 2.0 y Manos de 5 Dedos (`GVHMR + WiLoR`):**
   - Al enviar la aplicación, la caminata por imitación seguía `3,5 s` de `11,8 s` y no teníamos manos articuladas.
   - Hoy tenemos **9 políticas completas publicadas en `training/policies/`** (`g1-walk` siguiendo `11,86 / 11,85 s` con 65 % de supervivencia a empujones de 250 N, `g1-run`, `g1-jacks`, `g1-saludar`, `g1-dedos`, `g1-bailar`, `g1-frente`, `g1-sentarse` y `h1-walk`), más manos diestras Inspire de 5 dedos con `< 2 cm` de error en puntas de dedos (`0,34 cm` contando del 1 al 5).
3. **Política `Stand` v2 a 300 M de pasos en 4 mundos:**
   - Escaló de `60 M` a **`300 M` de pasos** con término de Capture Point (`STANCE_V2`), aguantando `4,0 / 4` empujones de `250 N` y hasta `320–350 N` en los 4 terrenos (`plano`, `piedras`, `resbaloso`, `viento`).
4. **Dominio Propio e Infraestructura en Producción (`https://trytridi.com`):**
   - Desplegado en **https://trytridi.com** sobre Cloudflare Pages con seguridad completa de borde, bilingüe ES/EN en tiempo real sin recarga y sin bloqueo de despliegue para ningún co-founder.

---

## 5. Mapa Completo de Archivos en [`yc/`](../../yc/README.md)

| Archivo | Contenido |
| :--- | :--- |
| [`yc/README.md`](../../yc/README.md) | Índice general de la carpeta YC, fechas del batch W27 y reglas de estilo. |
| [`yc/aplicacion.md`](../../yc/aplicacion.md) | Todas las preguntas del formulario de YC con las respuestas en inglés. |
| [`yc/verdad-hoy.md`](../../yc/verdad-hoy.md) | Tabla de qué era verdad al corte del 27 de octubre vs. qué faltaba. |
| [`yc/fundadores.md`](../../yc/fundadores.md) | Estructura de fundadores, roles y guía para los perfiles individuales. |
| [`yc/narrativa.md`](../../yc/narrativa.md) | Tesis del problema, insight técnico, por qué ahora, mercado y modelo de negocio. |
| [`yc/competidores.md`](../../yc/competidores.md) | Comparativa directa con startups de Physical AI y mocap (Asimov YC W26, Human Archive YC W26, Intelligence Factory YC S26, VideoMimic, Move.ai). |
| [`yc/entrevista.md`](../../yc/entrevista.md) | Banco de preguntas duras para la entrevista de 10 minutos con partners de YC. |
| [`yc/contexto-tecnico.md`](../../yc/contexto-tecnico.md) | Explicación de cada pieza técnica en palabras simples para defender en vivo. |
| [`yc/investigacion/startups/`](../../yc/investigacion/startups/README.md) | Base de datos de 3.100+ startups aceptadas por YC (2022–2026) con foco en robótica y Latinoamérica. |
