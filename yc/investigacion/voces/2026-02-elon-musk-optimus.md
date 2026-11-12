# Elon Musk sobre humanoides y Optimus: qué le sirve a Tridi

- **Fuente:** podcast de Dwarkesh Patel, [Elon Musk – "In 36 months, the cheapest place to put AI will be space"](https://youtu.be/BYXbuik3dgA?t=4642), publicado el 2026-02-05. El bloque de robots va de **1:17:22 a 1:30:21**.
- **Transcripción cruda con marcas de tiempo:** [`2026-02-elon-musk-optimus-transcripcion.md`](2026-02-elon-musk-optimus-transcripcion.md). Las citas de abajo vienen de ahí; si hay que citarlas en público, verificarlas en el video.
- **Patrocinador del episodio:** Labelbox ("robotics and RL data at scale", con su red Alignerr). Ver [`../../competidores.md`](../../competidores.md).
- Escrito el 2026-11-11 por Juan con Antigravity.

> [!IMPORTANT]
> Este documento interpreta lo que dijo Elon. **No** es evidencia de lo que Tridi tiene hoy. Antes de usar cualquier frase en la aplicación o en el pitch, revisar [`../../verdad-hoy.md`](../../verdad-hoy.md).

## Lo que dijo, en 7 ideas

| # | Idea | Minuto | Cita corta |
| --- | --- | --- | --- |
| 1 | Los humanoides tienen **solo tres problemas difíciles**: inteligencia del mundo real, la mano y fabricar a escala | 1:18:10 | *"there are really only three hard things for humanoid robots"* |
| 2 | La mano es más difícil que todo el resto junto; tuvieron que diseñar actuadores propios porque "no hay cadena de suministro" | 1:18:30 – 1:19:07 | *"the hand is more difficult than everything else combined"* |
| 3 | La IA del auto sirve para el robot: **video que entra, control que sale**. El Tesla convierte 1,5 GB/s de video en 2 KB/s de control | 1:19:20 – 1:22:18 | *"photons in, controls out"* |
| 4 | **Dwarkesh le marca el hueco:** el auto tuvo millones de horas de datos humanos gratis porque los autos ya estaban en la calle. El robot no tiene eso, y además tiene muchos más grados de libertad. Elon le da la razón | 1:22:42 – 1:23:19 | *"you're highlighting an important limitation"* |
| 5 | La respuesta de Tesla es una **"Optimus Academy"**: 10.000 a 30.000 robots reales haciendo *self-play*, más un **"generador de realidad" físicamente preciso** con millones de robots simulados. Los robots reales sirven para **cerrar la brecha sim-to-real** | 1:23:25 – 1:24:30 | *"millions of simulated robots in the simulated world… close the sim to real gap"* |
| 6 | Arquitectura en dos capas: **Grok planifica** y asigna tareas, y la **política motora** ejecuta abajo | 1:24:52 | *"Grok would orchestrate the behavior of the Optimus robots"* |
| 7 | Sobre Unitree: lo vende a USD 6k-13k porque es "un robot chico que no es inteligente". Los primeros usos rentables son **tareas simples y continuas, 24/7**. En una Gigafactory, un Gen 3 haría quizás el 10-20 % del trabajo | 1:27:56 – 1:29:43 | *"any 24 by 7 operation"* |

## Lo que significa para Tridi

### 1. El hueco que Dwarkesh le señaló es nuestro mercado

Tesla resuelve la falta de datos con **decenas de miles de robots propios más un simulador propio**. Prácticamente nadie más puede hacer eso: ni los labs, ni las universidades, ni los dueños de un G1. Para ellos quedan dos fuentes de datos baratas: **el video humano que ya existe** y **la simulación física**. Tridi junta justamente esas dos.

**Frase para el pitch** (verificar contra `verdad-hoy.md` antes de usarla):
> "Tesla closes the robot data gap with 30,000 robots and its own physics-accurate reality generator. Everyone else needs another way. Tridi turns existing human video into physics-checked robot motion and a trained policy."

### 2. "Photons in, controls out" ya describe lo que entregamos

Lo que Tridi entrega es la compresión que Elon describe, a escala chica: video → esqueleto 3D → movimiento del robot → una **política pequeña** (ONNX de cientos de KB; la de Luigi corre a 50 Hz en un Arduino UNO). Es un buen marco para explicar el producto en una línea sin jerga.

### 3. Elon confirma que vale la pena cerrar sim-to-real con robots reales

Elon dice que los robots reales "cierran la brecha sim-to-real" del simulador. Nuestra versión chica de eso es el caso Luigi: gemelo digital en MuJoCo → política → robot real. **El paso que nos falta** es el lazo de vuelta: usar la telemetría del robot real para recalibrar el gemelo (fricción, zona muerta de motores, latencia de sensores). Es trabajo de lógica y motor, no de UI. Ver "Siguientes pasos".

### 4. La mano: hoy es nuestro punto débil

Para Elon la mano es lo más difícil. Nuestro `PoseClip` usa los 33 puntos de MediaPipe Pose, que no incluyen dedos, y el G1 de Menagerie no tiene manos diestras. Esto coincide con lo que dicen Hemlock y Axonnic ("al video le falta la fuerza"). **No prometer manos.** Agregar landmarks de mano (MediaPipe Hands, 21 puntos) al `PoseClip` es una extensión posible del contrato, a futuro.

### 5. Unitree "barato y sin inteligencia" es nuestro cliente, no un problema

Elon pone a Unitree como hardware barato al que le falta la inteligencia. Esa es la posición de Tridi: **poner la inteligencia (datos y políticas) en hardware de catálogo**. Tesla diseña todo desde cero ("nothing you can pick out of a catalog"); el resto del mercado compra de catálogo, y ahí apunta el catálogo de hardware de Pastor (`luigi_lab3`, `luigi_lab4`).

### 6. Quedarnos en la capa de abajo

La arquitectura que describe Elon (un LLM o VLM que planifica arriba y una política motora abajo) nos deja claro dónde estar: **la capa motora**, que un planificador de terceros (Grok, Gemini, GPT) pueda llamar. No competir con los planificadores.

### 7. Verticales: tareas repetitivas y continuas

Lo primero que va a rendir son **tareas simples y continuas, 24/7, en fábricas**. Esto respalda el foco industrial de Ale (celdas de fábrica, `luigi_lab4`). Para elegir los próximos casos reales conviene priorizar tareas repetitivas y medibles antes que demos vistosas.

### Cuidado

- Dwarkesh recuerda que **del demo convincente al uso real pasan años** (self-driving tardó unos 10). En la entrevista de YC no exagerar plazos.
- Tesla puede volverse el estándar cerrado. Nuestra apuesta es el resto del mercado (Unitree, labs, robots chicos).

## Siguientes pasos (lógica y motor, no UI)

1. **Lazo sim-to-real con Luigi:** registrar telemetría del robot real (comandos PWM, ultrasónico, tiempos) y ajustar los parámetros del gemelo MuJoCo para que la simulación reproduzca lo medido (identificación de sistema). Es lo que Elon llama "cerrar la brecha" y no depende de la UI.
2. **Randomización de dominio medida:** que los rangos de fricción, masa, latencia y fallas de actuador de `training/` salgan de esas mediciones y no de números a ojo.
3. **Manos en el contrato (exploratorio):** evaluar MediaPipe Hands en `data/` y proponer el campo opcional en [`docs/contrato.md`](../../../docs/contrato.md), como commit de contrato aparte.
4. **Pitch:** llevar la idea 1 a [`../../narrativa.md`](../../narrativa.md) cuando Ale la valide.
