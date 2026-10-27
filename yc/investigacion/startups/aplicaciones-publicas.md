# Las aplicaciones que se hicieron públicas

Muy pocas startups publican su aplicación: **362 en toda la historia de YC** (15 de las 801 de 2026). Son la única forma de ver cómo se presentaron los que entraron. Lista completa en [`aplicaciones-publicas-lista.md`](aplicaciones-publicas-lista.md); se ven abriendo la página de YC de cada una.

Revisado el 27 de octubre de 2026:

- **Videos:** se transcribieron con whisper.cpp **los 65 videos públicos de 2022 a 2026** ([`videos.py`](videos.py)). También se miraron cuadros de una muestra para ver dónde y cómo grabaron. Los videos y las transcripciones quedan en `cache/videos/`, sin versionar, porque son de los fundadores.
- **Respuestas escritas:** se leyeron las 62 aplicaciones con respuestas públicas. Casi siempre publican solo tres: el one-liner, "qué van a hacer" y "cuánto tiempo llevan".

## El video de fundadores: cómo lo hacen los que entraron

### Números (65 videos, 2022-2026)

| Qué | Dato |
| --- | --- |
| Duración | **Mediana de 62 s**. 38 de 65 duran un minuto o menos. Solo 2 pasan de 90 s (el más largo, 113 s) |
| Palabras | Mediana de ~185 palabras |
| Velocidad | **Mediana de 177 palabras por minuto**: hablan rápido, sin pausas de presentación |
| Producción | Ninguno tiene música, cortes elaborados ni slides. Son tomas de celular o webcam |

### Dónde y cómo graban

1. **Todos los fundadores sentados juntos frente a la cámara, en una sola toma.** Es lo más común.
   - Fondo neutro: Moritz (W26).
   - O su lugar de trabajo, con el producto detrás: Manifold (Summer 26) grabó en vertical con el celular, en un depósito con el brazo robótico atrás. Starcloud (S24) señala el hardware que arman en su WeWork.
2. **El producto funcionando en pantalla y los fundadores en una ventanita** (Polymath Robotics, S22). El tractor maneja solo mientras ellos se presentan. **Es el formato ideal para Tridi:** el G1 recuperándose de empujones mientras hablamos.
3. Alguno lo graba un fundador solo, aunque el equipo sea más grande. Es mejor que estén todos.

### La estructura que se repite

Casi todos siguen el mismo orden, y cada parte dura 1-3 frases:

1. **"Hi, I'm X" + una credencial concreta de cada fundador.** No es el título; es un hecho:
   - "a Starlink en SpaceX" (Starcloud)
   - "fundé Starsky Robotics, primer camión sin conductor en una autopista pública" (Polymath)
   - "abogado de OpenAI y Google" (Moritz)
2. **Cómo se conocen,** en una frase: "mejores amigos desde el primer año de universidad" (Manifold).
3. **De dónde sale el problema:** casi siempre de la experiencia propia.
   - El negocio familiar de reciclaje: Revise Robotics.
   - El depósito de la familia: Manifold.
   - Lo vieron en su trabajo anterior: Manifold Freight en Convoy, Sherpa en Lindy.
4. **Qué construyen,** en una frase simple, a veces con analogía: "como AWS para el espacio" (Starcloud), "lo que hizo Mint con las finanzas personales" (Manifold Freight).
5. **Avance con números y tiempo:**
   - "Desde marzo" (Manifold).
   - "En 20 días: 22 usuarios entrevistados, #1 en Product Hunt, 1.300 usuarios" (Mintlify).
   - "USD 73k de ingreso anual en 4 semanas" (Moritz).
   - "55 instalaciones, USD 350k anuales, 15 % mensual" (Ascenix).
   - Los que no tienen ingresos dan la próxima fecha concreta: "primer piloto la primera semana de diciembre" (Revise Robotics), "lanzamos el demostrador en mayo" (Starcloud).
6. **Cierre corto:** "See you in San Francisco", "Please give us a reason to drop out of college" (Mintlify). Sin resumen.

### Qué hacen los de robótica y hardware sin clientes todavía

Revise Robotics (W25), Polymath (S22), Starcloud (S24), Voxel Energy (W26) y Manifold (S26) entraron **sin ingresos**. Lo que muestran en su lugar:

- Una razón personal para el problema (negocio familiar).
- Un antecedente técnico fuerte (Caltech, SpaceX, Starsky).
- **Algo físico funcionando o en construcción, a la vista.**
- **Una fecha:** el próximo piloto o lanzamiento.

## Las respuestas escritas

| Pregunta | Mediana | Máximo | Patrón |
| --- | --- | --- | --- |
| Qué hace la empresa en 50 caracteres | 6 palabras | 9 | Frase nominal. "X para Y" o "X de Y". Ej.: "Uber for Trucks in Turkey" (Kamion), "lipsync video to audio in any language in one-shot" (sync.) |
| Qué van a hacer | 76 palabras | 256 | 1) Qué es, en la primera frase. 2) Qué hace hoy ("today we're focused on…"). 3) Casos de uso concretos. 4) Hacia dónde va. Sin adjetivos |
| Cuánto tiempo y cuánto full-time | 23 palabras | 105 | Fechas exactas y **honestidad sobre quién no está full-time todavía**. Ej.: sync. (W24) dijo que un fundador terminaba el doctorado y entraba en mayo |

**sync. (W24) es la referencia más cercana a nosotros:** modelos que modifican a personas en video. Su respuesta separa limpio "hoy" (doblaje de labios) de "después" (el cuerpo entero), sin prometer lo segundo como hecho. Es el tono que tiene que tener la nuestra con la caminata.

**Koywe (W23)** es latinoamericana: infraestructura cripto para la región. En su video los dos fundadores cuentan que son segundos fundadores y amigos desde chicos. Pero es el video más largo (113 s) y se nota que lo improvisaron. Lección: **ensayar**.

## Lo que hacemos con esto (ya aplicado a [`../../video-fundadores.md`](../../video-fundadores.md))

1. **60 segundos, todos juntos, una sola toma**, en un lugar que diga algo: con la laptop mostrando al G1 o la simulación detrás. Mejor aún el formato Polymath: el robot en pantalla y nosotros en una ventanita.
2. **Cada uno: nombre + un hecho concreto** (no "soy desarrollador").
3. **Cómo nos conocemos** en una frase.
4. **El problema contado desde nosotros**, no desde un informe de mercado.
5. **Avance con tiempo y números:** "en 36 horas", "3,2 cm de error", "aguanta 250 N", y la próxima fecha.
6. **Hablar rápido y natural** (~175 palabras por minuto): practicar hasta no leer.
7. **Cierre de una línea.**
