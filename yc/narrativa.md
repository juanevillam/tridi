# La historia de Tridi

De aquí salen las respuestas de [`aplicacion.md`](aplicacion.md), el video y la entrevista. Lo marcado **(débil)** es donde un partner de YC va a apretar.

## En una frase

- **Español:** Convertimos un video común en data y cerebros entrenados para robots humanoides.
- **Inglés (≤ 50 caracteres, para el formulario):**
  - `Turning everyday video into robot training data` (47)
  - `Training data for humanoid robots, from video` (45)
  - `Teach humanoid robots any motion from a video` (45)

## Problema

Los LLM se entrenaron con internet. Los robots humanoides no tienen un internet de movimiento. Hoy, enseñarle un movimiento nuevo a un humanoide exige captura de movimiento en estudio (trajes, cámaras, gente) o teleoperación (una persona manejando un robot real). Las dos cosas son caras, lentas y no escalan.

Y el video que sí existe, millones de horas de gente moviéndose, no le sirve tal cual a un robot: otras proporciones, otro peso, y lo que la persona hace es físicamente imposible para el robot. Si lo copia, se cae.

## Solución

Tridi toma un video de celular y entrega lo que una empresa de humanoides necesita para entrenar:

1. **Capture:** encuentra a la persona, saca su esqueleto 3D y lo pasa al cuerpo del robot.
2. **Gym:** el robot practica ese movimiento millones de veces en física real (MuJoCo), con empujones, piedras, piso resbaloso y viento, hasta hacerlo sin caerse.
3. **Policy:** se entrega la red entrenada (ONNX, corre en el robot) y el movimiento corregido por la física, en muchas condiciones.

**El video dice qué hacer; la simulación enseña cómo.**

## Por qué ahora

- Los humanoides ya existen y son baratos: un Unitree G1 cuesta alrededor de USD 16.000 `TODO: verificar precio actual`. Hay cientos de laboratorios y empresas con el mismo robot, y todos necesitan datos.
- El dinero ya llegó: Figure valuada en USD 39.000 M, Physical Intelligence en USD 5.600 M, Skild AI en más de USD 14.000 M, Apptronik levantó ~USD 935 M en parte para centros de recolección de datos. [L.E.K., oct. 2026](https://www.lek.com/sites/default/files/2026-10/humanoid-robotics-assessing-where-value-may-accrue-in-physical-ai-ei.pdf)
- Se gasta mucho en datos: según el CEO de Micro1, las empresas de robótica gastan más de USD 100 M al año en datos reales. [MIT Technology Review, abr. 2026](https://www.technologyreview.com/2026/04/01/1134863/humanoid-data-training-gig-economy-2026-breakthrough-technology/). Scale AI entregó más de 150.000 horas de datos físicos en 2025.
- Las piezas maduraron en 2024-2026: estimación de pose 3D de una sola cámara, simuladores rápidos (MuJoCo en GPU y en WebAssembly) y papers que muestran que funciona (HumanPlus, VideoMimic, NVIDIA SONIC).

## Insight (débil: es lo que más hay que trabajar)

**Posicionamiento recomendado tras estudiar YC 2026:** no "vendemos datos" (categoría llena: 8+ empresas YC con operación y capital), sino **la capa de conversión**: cualquier video humano → movimiento de **cuerpo entero** que un humanoide con piernas puede ejecutar + la política que lo hace. Los demás están en manos.

Lo que creemos y otros no, en borrador:

> Robot companies don't need more raw human video; they need motion a robot can physically perform. The value is not in capturing the pose (that is a commodity) but in the physics step that turns an impossible human motion into a feasible robot motion, plus a policy that already does it. Nobody sells that as a service per motion, per robot.

Por qué es débil hoy: no lo hemos validado con ningún cliente. Un partner va a preguntar "¿quién te dijo que necesita esto?". La única forma de fortalecerlo antes del 2 de noviembre es hablar con gente que entrena humanoides ([`plan-hasta-el-deadline.md`](plan-hasta-el-deadline.md)).

Otras líneas de insight a probar en esas conversaciones:

- **Latinoamérica como fábrica de datos:** grabar personas haciendo tareas cuesta USD 2,5-15 la hora y ya se terceriza (Micro1 en Argentina, Keywords Studios en CDMX, XDOF busca líder de operaciones para LatAm). Un equipo en Venezuela con el pipeline completo puede producir datos corregidos por física más barato que nadie.
- **Una política por movimiento, no un modelo gigante:** las empresas que no son NVIDIA o Figure no pueden entrenar un modelo base; sí pueden comprar habilidades sueltas que corren en su robot.

## Cliente

| Quién | Por qué compraría | Duda |
| --- | --- | --- |
| Laboratorios y universidades con un G1 o H1 | Quieren demos y habilidades nuevas sin montar captura de movimiento | Poco presupuesto |
| Empresas de humanoides medianas (no Figure ni Tesla) | Necesitan datos de movimiento para su robot y no tienen estudio | ¿Lo hacen en casa? |
| Empresas de datos físicos (Scale, Micro1, Encord) | Podrían comprar el pipeline o subcontratar la parte de física | Pueden construirlo ellas |
| Entretenimiento: shows, ligas de pelea de robots, marcas | Coreografías y movimientos de personas reales en un robot | Mercado chico |

`TODO(equipo)`: elegir **un** cliente inicial para la aplicación. YC prefiere uno concreto a cuatro posibles.

## Modelo de negocio (borrador)

- **Por movimiento:** el cliente sube un video y recibe la política + el dataset. Precio por política entrenada.
- **Por volumen de datos:** horas de movimiento corregido por física, en el formato del cliente (LeRobot, etc.).
- **Plataforma:** suscripción para equipos que entrenan seguido.

Tamaño, cuenta simple para la aplicación: si las empresas de robótica gastan > USD 100 M al año en datos hoy y el gasto crece con la flota de humanoides (Morgan Stanley proyecta ~USD 5 billones en humanoides para 2050, [fuente](https://humanoid.guide/?p=3205)), capturar una parte del gasto en datos de movimiento es un negocio de cientos de millones. **(débil: no hay precio por hora de dato verificado.)**

## Competencia

**Lo nuevo (27 oct):** YC 2026 aceptó una docena de startups de datos para robots. Fichas y lecciones en [`investigacion/startups/robotica-y-physical-ai.md`](investigacion/startups/robotica-y-physical-ai.md). Las que más importan van primero.

| Quién | Qué hace | En qué somos distintos |
| --- | --- | --- |
| **Asimov (YC W26)** | "Real-world human movement data for humanoid robots": video egocéntrico + pose 3D, grabado por una red de personas | **El competidor más directo.** Ellos capturan video nuevo; nosotros convertimos cualquier video en movimiento que el robot puede ejecutar (física) + la política. También puede ser cliente |
| **Intelligence Factory (YC Spring 26)** | Guantes → retargeting humano a robot → modelos de manipulación | Mismo concepto, en manos. Nosotros, cuerpo entero |
| **Human Archive (YC W26)**, Hub, Datoric, Praxis, DeepReach (YC 2026) | Venden datos crudos multimodales para robots, con operación y hardware propios (Human Archive levantó USD 8,2 M) | Venden captura; nosotros conversión. Son clientes posibles del pipeline |
| **Hemlock (YC F26)** | Pulsera EMG: dice que el video solo no basta porque le falta la fuerza | Nuestra física infiere contactos y torques consistentes (inferidos, no medidos). Tener la respuesta lista |
| GMR, NVIDIA GEM-X (abiertos) | Video → G1 con un comando, gratis | Retargeting crudo sin física: hay que mostrar con números cuánto mejor queda lo nuestro |
| G1 Moves (mar. 2026) | Pipeline abierto: video de una cámara → movimientos del G1 entrenados en MuJoCo | Es lo más parecido. Es un proyecto de investigación abierto, no un producto ni un servicio. **Hay que estudiarlo a fondo antes de la entrevista** |
| VideoMimic (2025) | Paper: video → humanoide real | Investigación de laboratorio; nosotros, producto en el navegador |
| Ultimate Bots Studio | Video a robot | Usa una política ya hecha de NVIDIA; nosotros entrenamos una por video y entregamos la política + los datos |
| NVIDIA SONIC / GR00T | Modelo base de control de cuerpo completo (~700 h de mocap) | Ellos son el modelo; nosotros los datos y las habilidades que no tiene. Podemos ser proveedor |
| Scale AI, Micro1, Encord | Recolección de datos físicos (video egocéntrico, teleoperación) | Entregan video crudo; nosotros movimiento que el robot puede hacer y la política |
| Move.ai, DeepMotion, Rokoko | Captura de movimiento con celular para animación | Terminan en el esqueleto; no hay física ni robot |
| AMASS, LAFAN1 | Datasets de mocap | Pocos movimientos; varios no se pueden usar comercialmente |

Lo honesto: la captura con celular ya es commodity, y el pipeline video → robot existe en papers y proyectos abiertos. La diferencia tiene que estar en producto, velocidad, calidad de datos y en tener clientes, no en la técnica sola.

## Riesgos que conviene nombrar nosotros

1. El robot todavía no camina imitando el video.
2. Sin pruebas en robot real (sim-to-real).
3. Sin clientes ni conversaciones.
4. Los grandes (NVIDIA, Figure) generan sus propios datos.
5. Estamos en Venezuela, lejos de los clientes y del hardware.
