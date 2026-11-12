# Competidores: accesos directos

Las startups de YC que hacen lo mismo que Tridi o algo parecido, con enlaces directos. El detalle de cada una (fundadores, financiamiento, cómo se presentaron) está en [`investigacion/startups/robotica-y-physical-ai.md`](investigacion/startups/robotica-y-physical-ai.md). Actualizado el 27 de octubre de 2026.

Batches: **W** = Winter, **X** = Spring, **S** = Summer, **F** = Fall; el número es el año (W26 = Winter 2026).

## Qué hace Tridi, en simple

```
Video de una persona  →  su movimiento 3D  →  ese movimiento en el cuerpo del robot
(celular, cualquier       (esqueleto,           (Unitree G1: 29 motores)
 video que ya exista)      33 puntos)                       │
                                                            ▼
                         Lo que entregamos  ←  El robot practica en física real
                         · la política (red de 265 KB         hasta hacerlo sin caerse
                           que mueve los motores)             (millones de intentos, con
                         · el movimiento corregido            empujones, piedras, viento)
                           que el robot sí puede hacer
```

**La diferencia en una línea:** los demás **capturan** datos de personas (con cámaras en la cabeza, guantes, sensores). Nosotros **convertimos** cualquier video en movimiento que un robot puede ejecutar de verdad, y entregamos además el cerebro que lo ejecuta.

**Qué es nuestro y qué no** (para decirlo bien en la aplicación y en la entrevista):

- **Nuestro:** encontrar y seguir a una persona en el video, pasar su movimiento al robot (retargeting), los mundos de prueba, el entrenamiento por refuerzo, la imitación, el render 3D en el navegador con three.js, y que todo corra en el navegador igual que en Python.
- **No es nuestro:** el motor de física es **MuJoCo**, el estándar en robótica (abierto, de Google DeepMind). Lo compilamos para que corra en el navegador, pero no lo escribimos. Decirlo así: "usamos MuJoCo; lo nuestro es todo lo que va encima".

## Hacen lo mismo o casi

| Startup | Batch | Qué hace | Qué tan parecido | Enlaces |
| --- | --- | --- | --- | --- |
| **Asimov** | W26 | "Real-world human movement data for humanoid robots": gente graba video en primera persona; entregan video + pose 3D del cuerpo | **El más cercano.** Mismo cliente y misma promesa. Diferencia: ellos capturan video nuevo y no lo pasan por física ni entregan política. Puede ser cliente nuestro. Revisado el 2026-11-11: sin noticias desde octubre. Su home sigue mostrando "Asimov Cleaning", donde los limpiadores graban más de 100 apartamentos por fin de semana, y dicen entregar "thousands of hours a day" a los labs | [YC](https://www.ycombinator.com/companies/asimov) · [Launch](https://www.ycombinator.com/launches/PeH-asimov-on-demand-human-intelligence-for-robots) · [sitio](https://tryasimov.ai/) |
| **Intelligence Factory** | X26 | Guantes que capturan manos → **retargeting al robot** → venden el modelo que lo hace | **El mismo concepto** (persona → robot → política), pero con manos y guantes, no cuerpo entero desde video | [YC](https://www.ycombinator.com/companies/intelligence-factory) |
| **Human Archive** | W26 | "Physical AI data lab": datasets de video, sensores y pose humana (foco en manos); USD 8,2 M levantados | Mismo comprador y entrega pose humana. Escala muy superior; sin física ni política | [YC](https://www.ycombinator.com/companies/human-archive) · [TechCrunch](https://techcrunch.com/2026/05/26/human-archive-taps-into-indias-services-startups-to-collect-data-for-physical-ai/) |

## Parecidos: venden datos de personas para entrenar robots

Compiten por el mismo presupuesto, pero venden captura cruda. Todos son **clientes posibles** de Tridi: tienen montañas de video que nosotros podemos convertir.

| Startup | Batch | Qué hace | Enlaces |
| --- | --- | --- | --- |
| Cortex AI | F25 | Video en primera persona con pose de manos y cuerpo + trayectorias de robots en lugares de trabajo reales | [YC](https://www.ycombinator.com/companies/cortex-ai) · [sitio](https://cortexrobot.ai/) |
| Sensei | S24 | Hardware barato para grabar demostraciones humanas + red de operadores ("Scale AI para datos de robots") | [YC](https://www.ycombinator.com/companies/sensei) · [sitio](https://senseirobotics.com) |
| Hub | X26 | Red global que graba datos a pedido; dicen tener contratos de siete cifras | [YC](https://www.ycombinator.com/companies/hub) · [Launch](https://www.ycombinator.com/launches/Qoe-hub-real-world-training-data-for-frontier-ai-labs-and-robotics) |
| Datoric | S26 | Encuentra en qué falla el modelo del cliente y recolecta los datos que faltan | [YC](https://www.ycombinator.com/companies/datoric) · [sitio](https://www.datoric.com) |
| Praxis Robotics | S26 | Convierte negocios reales en proveedores de datos para robots | [YC](https://www.ycombinator.com/companies/praxis-robotics) |
| DeepReach | S26 | Les da equipos de captura a socios locales para que monten su negocio de datos | [YC](https://www.ycombinator.com/companies/deepreach-inc) · [sitio](https://deepreach.ai) |
| Aktoria Robotics | S26 | Teleoperación: personas (en India, México y EE. UU.) manejan robots a distancia | [YC](https://www.ycombinator.com/companies/aktoria-robotics) |
| **Labelbox (Terra)** | No es YC (verificado: no tiene ficha en YC; Serie D de USD 110 M con SoftBank en 2022 y una Serie E de "USD 100 M+" en 2026) | Labelbox es una plataforma de etiquetado. Su producto **Terra** graba demostraciones egocéntricas y de teleoperación con 7 rigs propios, usando la red de expertos Alignerr y su laboratorio en SF ("1PB+" para enero de 2026), y tiene un "diversity engine" que decide qué falta grabar. **No hace retargeting, física ni políticas** ("embodiment-agnostic"). Patrocinó el podcast de Dwarkesh con Elon (feb 2026). Es el jugador grande de "captura": canal o partner posible, porque nuestra capa robot-ready iría encima de su corpus | [Terra](https://labelbox.com/products/terra/) · [Alignerr](https://alignerr.com) |

## Atacan nuestro punto débil

| Startup | Batch | Qué dice | Enlaces |
| --- | --- | --- | --- |
| Hemlock | F26 | "El video solo no basta: le falta la fuerza". Pulsera que la mide | [YC](https://www.ycombinator.com/companies/hemlock) · [sitio](https://hemlock.inc) |
| Axonnic | F26 | Sensor que captura la fuerza e intención de las manos | [YC](https://www.ycombinator.com/companies/axonnic) |

Respuesta preparada: [`entrevista.md`](entrevista.md).

## Hacen otra parte de la cadena (posibles partners)

| Startup | Batch | Qué hace | Enlaces |
| --- | --- | --- | --- |
| Fern | W26 | Dice "entornos de entrenamiento por refuerzo para empresas de robótica" (información confusa) | [YC](https://www.ycombinator.com/companies/fern-bot) |
| One Robot | W26 | Simula el mundo para evaluar y entrenar robots | [YC](https://www.ycombinator.com/companies/one-robot) |
| Enact | S26 | Entrenamiento por refuerzo en el mundo real: corre, detecta fallas, corrige | [YC](https://www.ycombinator.com/companies/enact) |
| Runtime.si | F26 | Evalúa robots en miles de mundos simulados | [YC](https://www.ycombinator.com/companies/runtimesi) |
| Robocurve | S26 | Evaluaciones para robots, abiertas | [YC](https://www.ycombinator.com/companies/robocurve) |
| General Instinct | X26 | Hace que los modelos corran en el chip del robot | [YC](https://www.ycombinator.com/companies/general-instinct) |
| Shotwell AI | X26 | Control de calidad y etiquetas para datos de robots | [YC](https://www.ycombinator.com/companies/shotwellai) |

## Fabricantes de humanoides (clientes posibles)

| Startup | Batch | Qué hace | Enlaces |
| --- | --- | --- | --- |
| K-Scale Labs | W24 | Humanoides abiertos. **Figura como inactiva** | [YC](https://www.ycombinator.com/companies/k-scale-labs) · [sitio](https://kscale.dev/) |
| Proception | W25 | Manos de humanoide muy precisas | [YC](https://www.ycombinator.com/companies/proception-inc) · [sitio](https://proception.ai/) |
| Piggy Robotics | F25 | Humanoide doméstico al precio de un iPhone | [YC](https://www.ycombinator.com/companies/piggy-robotics) · [sitio](https://piggyrobotics.com) |
| OS3 | S26 | Humanoide sobre ruedas a menos de USD 10k | [YC](https://www.ycombinator.com/companies/os3) |
| Nori | S26 | "Humanoide" de USD 1.688 (brazos sobre base móvil) | [YC](https://www.ycombinator.com/companies/noril1) |

## Fuera de YC, gratis y abiertos

Lo que un partner va a nombrar con "¿por qué no usar esto?":

| Proyecto | Qué hace | Enlace |
| --- | --- | --- |
| GMR (+ GVHMR) | Video → movimiento del G1 en un comando, sin física | [GitHub](https://github.com/apx103/gmr) |
| NVIDIA GEM-X | Pose de una cámara → G1, licencia comercial | [GitHub](https://github.com/thinhlpg/GEM-X) |
| G1 Moves | 60 movimientos para el G1 con políticas entrenadas incluidas | [sitio](https://exptech-g1-moves.static.hf.space/index.html) |
| VideoMimic | Paper: video → humanoide real | — |

## Para mantenerlo al día

Con cada batch nuevo: `python3 yc/investigacion/startups/actualizar.py 2027`, revisar el batch en busca de "humanoid", "motion", "robot data", "retarget", y sumar las nuevas aquí.
