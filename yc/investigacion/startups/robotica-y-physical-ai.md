# Robótica e IA física en YC 2026

**Lo más importante de toda la investigación:** en 2026 YC aceptó al menos una docena de startups que venden **datos o infraestructura para entrenar robots**. Valida el mercado: a YC le interesa. Pero también es una categoría llena, y una de ellas, **Asimov (W26)**, se presenta casi igual que nosotros: *"Real-world human movement data for humanoid robots"*.

Investigado el 27 de octubre de 2026 con sus páginas de YC, Launch YC, sitios web y prensa. Las métricas de tracción son autodeclaradas en los posts de lanzamiento, que se publican durante el batch: **no son lo que tenían al aplicar**. Los videos de lanzamiento no se pudieron ver (YouTube bloqueó la descarga): de los videos solo hay título y canal. Lo marcado "sin verificar" viene de agregadores.

De 801 startups en los cuatro batches de 2026, **104** tocan robótica, hardware o simulación (16 en W26, 20 en Spring, 39 en Summer, 29 en Fall): la categoría crece batch a batch. Lista completa al final.

---

## A. Las más cercanas a Tridi

### Asimov (W26): el más cercano

- **Qué hace:** vende datos de movimiento humano real (hogares y negocios) a laboratorios de humanoides.
- **Cómo consigue datos:** personas que se graban con el celular en la cabeza (video egocéntrico) y cobran por eso (un artículo cita USD 5-30 la hora); kits de grabación para trabajadores de negocios aliados; y **una empresa de limpieza propia** en el Bay Area cuyos limpiadores graban mientras trabajan. Entregan video egocéntrico, **pose 3D del cuerpo**, profundidad, etiquetas semánticas y segmentación de actividad. **No mencionan retargeting a robots ni corrección física.**
- **Tracción:** dicen tener de clientes a los laboratorios de robótica más grandes, sin nombrarlos. 5.000+ contribuidores según un artículo (sin verificar).
- **Fundadores (3):** Lyem Ningthou (investigación de robótica en defensa, pipelines de datos para la US Air Force) y Anshul Verma (Scale AI, Amazon, infraestructura de datos). Compañeros de cuarto en Berkeley; ya habían fundado juntos una startup con ingresos de seis cifras.
- **Financiamiento:** no público. Bouken Capital dice que invirtió junto a YC, Robinhood Ventures y ángeles de OpenAI, Anthropic, Figure y Scale (sin verificar).
- **Cómo se presentó:** Launch "On demand human intelligence for robots". Promete un momento GPT-3 para humanoides y pide tres cosas: laboratorios que compren, negocios aliados y gente que grabe.
- **Para Tridi:** **competidor directo** en "movimiento humano → humanoide". También **cliente posible**: tienen video y pose, pero no física ni el cuerpo del robot.
- Fuentes: [YC](https://www.ycombinator.com/companies/asimov) · [Launch](https://www.ycombinator.com/launches/PeH-asimov-on-demand-human-intelligence-for-robots) · [sitio](https://tryasimov.ai/) · [StartupHub](https://www.startuphub.ai/ai-news/claudes-corner/2026/claudes-corner-asimov-yc-w2026) · [Bouken](https://boukencapital.substack.com/p/the-kinematics-of-intuition-bringing)

### Human Archive (W26)

- **Qué hace:** "Physical AI data lab": datasets multimodales (video, sensores, robots) para laboratorios de IA, con catálogo listo para comprar.
- **Cómo consigue datos:** hardware propio (estéreo, guantes táctiles, IMU en el cuerpo, cámaras de muñeca; reconstrucción de manos y pose humana) y gorras con cámara para trabajadores gig en India (1.000+ equipos, ~USD 1 la hora base según TechCrunch). Dicen poder capturar 8.000 h al día.
- **Tracción:** laboratorios sin nombre. Polémica: el gobierno indio abrió una investigación por consentimiento y privacidad; Urban Company y Pronto no quisieron aliarse.
- **Fundadores:** Raj Patel (dejó Berkeley), Rushil Agarwal (Berkeley, Coinbase), Shloke Patel (Stanford, robótica), Samay Maini. Amigos desde hace 20 años. Equipo de ~100.
- **Financiamiento:** USD 8,2 M (Wing VC, NVP, YC y ángeles de OpenAI, Nvidia, Google, Meta), mayo de 2026.
- **Para Tridi:** compite por el mismo presupuesto y marca la escala del sector. Su foco es manos y manipulación.
- Fuentes: [YC](https://www.ycombinator.com/companies/human-archive) · [TechCrunch](https://techcrunch.com/2026/05/26/human-archive-taps-into-indias-services-startups-to-collect-data-for-physical-ai/) · [Pulse 2.0](https://pulse2.com/human-archive-8-2-million-raised-to-build-training-data-infrastructure-for-physical-ai/) · [OECD](https://oecd.ai/en/incidents/2026-05-26-a30b)

### Intelligence Factory (Spring 26): nuestro espejo

- **Qué hace:** "Human Intelligence for Robots". **Vende modelos** de manipulación, no datos.
- **Cómo:** "fábricas de datos" con guantes propios (visión, movimiento, tacto) y **retargeting del movimiento humano al robot** (de mano de cinco dedos a pinza). Despliegan en almacenes, supermercados y data centers.
- **Fundadores (equipo de 10):** Yash Sinha (robótica en ETH Zurich, fundador de Kaio Labs, simulación en F1) y Jalaj Shukla (UPenn GRASP; Dimensional, Blue Sky Robotics). Dicen llevar 5 años desplegando robots.
- **Financiamiento:** pre-seed con YC y Comma Capital.
- **Para Tridi:** **mismo concepto** (humano → retargeting → política), pero con manos y guantes. Prueba de que YC compra la idea "de la persona al robot".
- Fuentes: [YC](https://www.ycombinator.com/companies/intelligence-factory) · [vcbacked](https://www.vcbacked.co/company/intelligence-factory)

### Hemlock (F26): la objeción "el video no basta"

- **Qué hace:** pulsera EMG que agrega **fuerza y contacto** al video egocéntrico. Su tesis: el video solo pierde la fuerza.
- **Tracción, con números contra un modelo con nombre:** pi0.5 agarrando huevos, 10 veces más éxito con video + pulsera que con video solo; Gemini enroscando un bombillo, 2,7 veces mejor. Grupo beta.
- **Fundador:** Julian Olschwang, **fundador solo**. Dejó CMU, laboratorio de biomecatrónica de UCLA, 4 patentes.
- **Para Tridi:** ataca directo "datos de video". Hay que tener la respuesta lista (ver "Qué cambiamos", punto 3).
- Fuentes: [YC](https://www.ycombinator.com/companies/hemlock) · [sitio](https://hemlock.inc)

### Hub (Spring 26)

- Red global de personas que graba datos a pedido del cliente, con procedencia verificada (contratan operadores en Brasil, entre otros). Video egocéntrico y multimodal.
- Dicen haber pasado de contratos de cinco cifras a uno de **siete cifras** en semanas.
- Armin Kiani (CS y robótica) y Tim Sprecher. Fundada en 2024, equipo de 60. Seed de ~USD 1,7 M liderado por SwissBorg.
- **Para Tridi:** vende datos crudos. Más **cliente o proveedor** que competidor.
- Fuentes: [YC](https://www.ycombinator.com/companies/hub) · [Launch](https://www.ycombinator.com/launches/Qoe-hub-real-world-training-data-for-frontier-ai-labs-and-robotics)

### Datoric (Summer 26)

- Toma las fallas del modelo del cliente, las convierte en hipótesis de qué datos faltan, los recolecta y los entrega como "recetas". Apps por invitación, 300k+ contribuidores.
- "Casi siete cifras" de ingresos en 30 días (autodeclarado).
- Nikhil Reddy (UChicago) y Jeffrey Lin (jefe de datos del equipo de robótica de NYU). Origen llamativo: en 2023 automatizaron tareas pagadas de anotación saltándose el control de calidad, ganaron seis cifras y después reportaron las fallas.
- **Para Tridi:** el patrón "falla del modelo → datos dirigidos" es una buena forma de vender.
- Fuentes: [YC](https://www.ycombinator.com/companies/datoric) · [sitio](https://www.datoric.com)

### Praxis Robotics (Summer 26)

- Convierte negocios reales en vendedores de datos para robots: video egocéntrico, estéreo, IMU, guantes, escaneos 3D, con hardware propio (parte del equipo en Shenzhen).
- Dicen tener alcance a ~60k trabajadores en 150+ tipos de lugar, vía conglomerados. Sin clientes nombrados.
- Rohan Seelamsetty, Dev Karpe, Tommy Li (Penn, Wharton): perfil más de negocios que de robótica.
- **Para Tridi:** proveedor o cliente de video.
- Fuente: [YC](https://www.ycombinator.com/companies/praxis-robotics)

### DeepReach (Summer 26)

- Fabrica equipos de captura estéreo y se los da a socios locales que montan su propio negocio de datos. "Varios millones" en contratos firmados (autodeclarado); 475 equipos, 100+ socios, 7 países.
- Tim Li (fundó HireIO y una red de ~70k anotadores) y Chris Liu (PhD en visión, USC, Meta).
- **Para Tridi:** proveedor o cliente.
- Fuentes: [YC](https://www.ycombinator.com/companies/deepreach-inc) · [sitio](https://deepreach.ai)

### Aktoria Robotics (Summer 26)

- "Human as API for robots": teleoperación 24/7 con operadores en India, **México** y EE. UU., 40 ms de latencia. Gancho: todo robot "autónomo" que viste este año tenía una persona detrás.
- Dos estudiantes de posgrado de robótica en CMU (Jaskaran Singh Walia, Shreenabh Agrawal).
- **Para Tridi:** otra forma de conseguir demostraciones (teleoperación contra video). Es la idea de **Relevo** (`platanus-ideas`) hecha empresa YC.
- Fuente: [YC](https://www.ycombinator.com/companies/aktoria-robotics)

### Otras de esta capa

| Startup | Qué hace | Para Tridi |
| --- | --- | --- |
| [Axonnic](https://www.ycombinator.com/companies/axonnic) (F26) | EMG que captura intención y fuerza de las manos. Fundadores de Oxford | Complemento |
| [Shotwell AI](https://www.ycombinator.com/companies/shotwellai) (Spring 26) | Control de calidad y anotación de datos de robots. Fundadores de Gradio (vendida a Hugging Face), Sunday Robotics, Tesla | Partner |
| [StableBrowse](https://www.ycombinator.com/companies/stablebrowse) (Spring 26) | El one-liner dice "datos para IA física" pero el producto es un navegador para agentes: probable pivot | Nada |

---

## B. Simulación, aprendizaje por refuerzo, evaluación y despliegue

| Startup | Qué hace | Fundadores | Tracción pública | Para Tridi |
| --- | --- | --- | --- | --- |
| [Fern](https://www.ycombinator.com/companies/fern-bot) (W26) | Dice "entornos de RL para empresas de robótica", pero su Launch es otro producto: confuso | PhD Purdue, Meta LLaMA; Meta, Citadel | — | Compite en "RL sobre el robot del cliente". Info débil |
| [One Robot](https://www.ycombinator.com/companies/one-robot) (W26) | World models para evaluar y entrenar robots (textiles, cajas) | JPL, Google, McLaren; Tesla Dojo | — | Partner: evaluar políticas |
| [Enact](https://www.ycombinator.com/companies/enact) (Summer 26) | RL en el mundo real: correr, detectar fallas, demostrar la recuperación, reentrenar | Stanford IRIS (laboratorio de Chelsea Finn), Meta | pi0.5 de 90/100 a 99/100 con 50 demostraciones | **Espejo de método:** mostrar antes/después |
| [Robocurve](https://www.ycombinator.com/companies/robocurve) (Summer 26) | Evaluaciones para robots, framework abierto | Harvard, Rhodes Scholar, UK AISI. Fundador solo | v1 abierta, un piloto | Partner: benchmark independiente |
| [Runtime.si](https://www.ycombinator.com/companies/runtimesi) (F26) | Capa de evaluación en miles de mundos simulados | UPenn GRASP (3) | — | Partner o competidor parcial |
| [General Instinct](https://www.ycombinator.com/companies/general-instinct) (Spring 26) | Comprime modelos para correr en el chip del robot | Siemens; ex-DeepMind RL | Desplegó pi0.7 con Physical Intelligence | Partner: nuestro ONNX en el robot |
| [Avea Robotics](https://www.ycombinator.com/companies/avea-robotics) (Spring 26) | Teleoperación con VR | UIUC; software de vuelo NASA y DoD | ~USD 18k de ingreso mensual, ~30 robots. YC la marca **adquirida** | Ejemplo de ingresos tempranos |
| [OS3](https://www.ycombinator.com/companies/os3) (Summer 26) | Humanoide sobre ruedas a menos de USD 10k; modelo entrenado con ~150k h de video | UCSD, ServiceNow; USC, Coinbase | En hoteles; preventa con depósito | Cliente débil: tiene ruedas |
| [Nori](https://www.ycombinator.com/companies/noril1) (Summer 26) | "Humanoide" de USD 1.688 (brazos sobre base móvil) | Columbia | USD 440k en ventas en 6 semanas | Cliente débil: no camina |
| [Standard Physics](https://www.ycombinator.com/companies/standard-physics) (W26) | Simulación de fluidos para edificios | — | — | Nada |

---

## C. Ojo: lo básico de nuestro pipeline ya es abierto

Un partner va a preguntar "¿por qué no usar GMR + BeyondMimic?". Hoy existen, gratis:

- **GVHMR + GMR:** video → G1 en un comando ([GMR](https://github.com/apx103/gmr)).
- **NVIDIA GEM-X:** pose de una cámara → G1, licencia comercial Apache 2.0 ([repo](https://github.com/thinhlpg/GEM-X)).
- Paper "SAM 3D Body → G1" ([arXiv 2512.21573](https://arxiv.org/abs/2512.21573v1)).
- **G1 Moves** (marzo de 2026): 60 clips para G1 **con políticas entrenadas incluidas**, algunos desde video de una cámara ([sitio](https://exptech-g1-moves.static.hf.space/index.html)).

La técnica sola no es foso. Lo que nos diferencia tiene que medirse (punto 4 abajo).

---

## Qué aprendemos

### Quién compite de verdad

- **Asimov** es el directo: casi el mismo one-liner y entrega pose 3D. Ellos capturan **video nuevo** con una operación de gente grabando; nosotros convertimos **video que ya existe** en movimiento **que el robot puede hacer** (G1) más una política. Ellos ganan en volumen y operación; nosotros estamos más cerca de algo que corre en el robot.
- **Human Archive** cruza en pose humana, pero va a manos y tiene escala.
- **Intelligence Factory** es el mismo concepto en manos.
- **Hub, Datoric, Praxis, DeepReach, Aktoria** compiten por el presupuesto de datos de los laboratorios, pero venden datos crudos o teleoperación.
- **El hueco:** casi todos apuntan a **manipulación con las manos**. Nadie de la lista hace **movimiento de cuerpo entero para humanoides con piernas** (caminar, equilibrio, gestos, deporte). Es nuestro lugar, aunque hoy la demanda pagada es menor que la de manipulación.

### El patrón de los aceptados

- **Fundadores:** vienen de un laboratorio de robótica top (GRASP, CMU, Stanford, ETH, Berkeley), de infraestructura de datos (Scale AI, redes de anotadores), o ya hicieron una startup con ingresos. Equipos de 2 a 4, casi todos en San Francisco. Hay fundadores solos (Hemlock, Robocurve).
- **Un acceso que otros no tienen:** empresa de limpieza propia (Asimov), trabajadores en India (Human Archive), conglomerados (Praxis), red de socios (DeepReach). La pregunta implícita: "¿qué tienes tú que otro no puede conseguir?".
- **Los que no tienen ingresos muestran una mejora medida contra un modelo con nombre** (Hemlock: 10x en pi0.5; Enact: 90 → 99 de 100).
- **El cliente:** todos dicen "laboratorios de IA / empresas de humanoides" sin nombres; es un mercado de pocos compradores. Lo concreto es el caso de uso (huevos, bombillo, cajas), no el nombre.

### Qué cambiamos en la aplicación

1. **No presentarnos como vendedores de datos.** Esa categoría ya tiene 8+ empresas YC con operación, hardware y capital. Somos la **capa de conversión**: cualquier video humano → movimiento de cuerpo entero que el robot puede ejecutar + la política que lo hace. "Datos de movimiento" es la frase de Asimov; la nuestra es **"movimiento que tu robot de verdad puede hacer"**.
2. **Nicho explícito:** cuerpo entero de humanoides con piernas, empezando por el G1. Decir que es una elección: los demás están en manos.
3. **Responder a Hemlock antes de que pregunten:** el video no trae fuerza, pero nuestra simulación produce trayectorias con contactos, torques y equilibrio consistentes, y descarta las imposibles. Honestos: **fuerzas inferidas en simulación, no medidas**.
4. **Responder "¿por qué no GMR o G1 Moves?" con números:** comparar retargeting crudo contra Tridi en pies que patinan, piernas que atraviesan el piso, porcentaje del clip que se sigue sin caer, y tiempo y costo por clip. Los aceptados sin ingresos ganan con antes/después.
5. **Convertir el "todavía no camina" en plan con fecha:** "3,5 s de 11,8 hoy; clip completo para X". Mejor aún: subir esa cifra antes del 2 de noviembre.
6. **Señal de usuarios esta semana:** escribir a 10-20 dueños o laboratorios de G1 (universidades, gente que publica demos de G1 en X y YouTube) y ofrecer convertir sus videos gratis. Publicar un dataset de muestra en Hugging Face. Uno o dos "sí lo usaríamos / pagaríamos" con nombre valen más que cualquier tamaño de mercado.
7. **Canal B2B:** licenciar el pipeline a Asimov, Praxis, DeepReach o Hub como post-procesamiento de su video. Es una venta concreta que no compite con su operación.
8. **Fundadores:** dejar claro quién hizo el RL, el retargeting y la simulación. Las 36 horas como prueba de velocidad. Caracas como ventaja de costo y resiliencia, con mudanza a SF.

### Quién podría ser cliente o partner

- **Clientes del pipeline:** Asimov, Human Archive, Praxis, DeepReach, Hub, Datoric: tienen montañas de video humano y venden a laboratorios de humanoides; convertirlo a movimiento factible les sube el valor.
- **Partners técnicos:** Shotwell (calidad), Runtime.si, One Robot, Robocurve (evaluar nuestras políticas), General Instinct (nuestro ONNX en el chip del robot), Hemlock y Axonnic (fuerza en manos).
- **Clientes finales:** los mejores no están en esta lista: laboratorios y dueños de Unitree G1/H1 y empresas de humanoides con piernas.

---

## Las 104 de 2026 que tocan robótica, hardware o simulación

Filtro: etiqueta Robotics o una palabra clave (robot, humanoid, embodied, physical AI, motion, teleop, simulation, dexterity, actuator, world model) en el one-liner. Algunas son falsos positivos (simulación de mercado, por ejemplo); se dejan para no perder ninguna.

| Startup | Batch | Qué hace | Dónde |
| --- | --- | --- | --- |
| [Asimov](https://www.ycombinator.com/companies/asimov) | Winter 2026 | Real-world human movement data for humanoid robots | San Francisco, CA, USA; Remote |
| [Brumby](https://www.ycombinator.com/companies/brumby) | Winter 2026 | Robot Cowboys that Herd Cattle with AI Drones | Sydney, NSW, Australia |
| [Fern](https://www.ycombinator.com/companies/fern-bot) | Winter 2026 | RL environments for robotics companies | — |
| [General Astronautics](https://www.ycombinator.com/companies/generalastro) | Winter 2026 | Superintelligent space Robots | San Francisco, CA, USA |
| [Hlabs](https://www.ycombinator.com/companies/hlabs) | Winter 2026 | US-Made Parts for Robots | Austin, TX, USA |
| [Human Archive](https://www.ycombinator.com/companies/human-archive) | Winter 2026 | Physical AI data lab | San Francisco, CA, USA |
| [Kyten Technologies](https://www.ycombinator.com/companies/kyten-technologies) | Winter 2026 | Custom Aerospace-Grade Battery Packs | Seattle, WA, USA |
| [OctaPulse](https://www.ycombinator.com/companies/octapulse) | Winter 2026 | OctaPulse builds computer vision and robotics for fish farms and… | Frisco, TX, USA |
| [One Robot](https://www.ycombinator.com/companies/one-robot) | Winter 2026 | World models for robot evals and training. | San Francisco, CA, USA |
| [Origami Robotics](https://www.ycombinator.com/companies/origami-robotics) | Winter 2026 | Manipulate Anything Robot | San Francisco, CA, USA |
| [Polymath](https://www.ycombinator.com/companies/polymath) | Winter 2026 | Simulation environments to train & evaluate long-horizon AI agents | San Francisco, CA, USA |
| [Remy AI](https://www.ycombinator.com/companies/remy-ai) | Winter 2026 | Automating dexterous tasks in warehouses with AI-powered robots | San Francisco, CA, USA |
| [RoboDock](https://www.ycombinator.com/companies/robodock) | Winter 2026 | Robots that run autonomous depots for autonomous fleets. | San Francisco, CA, USA |
| [Servo7](https://www.ycombinator.com/companies/servo7) | Winter 2026 | Container unloading robots for warehouses | Amsterdam, NH, Netherlands |
| [Standard Physics](https://www.ycombinator.com/companies/standard-physics) | Winter 2026 | Fast Physics Simulations for Rapid Design and Real Time Control | San Francisco, CA, USA |
| [Valgo](https://www.ycombinator.com/companies/valgo) | Winter 2026 | Insurance risk layer for physical AI | San Francisco, CA, USA |
| [Advanced Metal Research](https://www.ycombinator.com/companies/advanced-metal-research) | Spring 2026 | Machine intelligence for American Welding | Los Angeles, CA, USA |
| [ANORIA](https://www.ycombinator.com/companies/anoria) | Spring 2026 | The first wearable that reads your emotions to enhance your EQ. | San Francisco, CA, USA |
| [Aseon Labs](https://www.ycombinator.com/companies/aseon-labs) | Spring 2026 | Robotic pitstops for self-driving cars | San Francisco, CA, USA |
| [Auxos](https://www.ycombinator.com/companies/auxos) | Spring 2026 | Simulations of real people for market research | San Francisco, CA, USA |
| [Avea Robotics](https://www.ycombinator.com/companies/avea-robotics) | Spring 2026 | The human-in-the-loop system for robots | San Francisco, CA, USA |
| [Eden Robotics](https://www.ycombinator.com/companies/eden-robotics) | Spring 2026 | Autonomous services for humanity. | San Francisco, CA, USA |
| [Foresight](https://www.ycombinator.com/companies/foresight) | Spring 2026 | Consumer simulations for CPG market research | New York City, NY, USA |
| [General Instinct](https://www.ycombinator.com/companies/general-instinct) | Spring 2026 | Deployment infrastructure for Physical AI | San Francisco, CA, USA |
| [Hub](https://www.ycombinator.com/companies/hub) | Spring 2026 | Real-world training data for frontier AI labs and robotics. | San Francisco, CA, USA |
| [InLoop Robotics](https://www.ycombinator.com/companies/inloop-robotics) | Spring 2026 | Robotic arms that pick and pack your orders. | BY, Germany |
| [Intelligence Factory](https://www.ycombinator.com/companies/intelligence-factory) | Spring 2026 | Human Intelligence for Robots | New York City, NY, USA |
| [Nine Fives](https://www.ycombinator.com/companies/nine-fives) | Spring 2026 | RF test equipment for next-gen spacecraft, drones, and cellphones | San Francisco, CA, USA |
| [Ornadyne](https://www.ycombinator.com/companies/ornadyne) | Spring 2026 | We're building robot birds for surveillance. | Los Angeles, CA, USA |
| [PerfectBit, Inc.](https://www.ycombinator.com/companies/perfectbit-inc) | Spring 2026 | Robotics | San Francisco, CA, USA |
| [Prototyping.io](https://www.ycombinator.com/companies/prototypingio) | Spring 2026 | Autonomous manufacturing for mechanical parts | San Francisco, CA, USA |
| [shotwell.ai](https://www.ycombinator.com/companies/shotwellai) | Spring 2026 | Annotations for robotics data | San Francisco, CA, USA |
| [StableBrowse](https://www.ycombinator.com/companies/stablebrowse) | Spring 2026 | Building the Data Infrastructure layer for Physical AI. | San Francisco, CA, USA |
| [Synphony](https://www.ycombinator.com/companies/synphony) | Spring 2026 | robots & software for farms | San Francisco, CA, USA |
| [Tenet Industries](https://www.ycombinator.com/companies/tenet-industries) | Spring 2026 | AI-automated factory for PCBAs | Munich, BY, Germany |
| [Twolabs](https://www.ycombinator.com/companies/twolabs) | Spring 2026 | RL environments for underexplored domains. | San Francisco, CA, USA |
| [6thSense](https://www.ycombinator.com/companies/6thsense) | Summer 2026 | Nervous System for Physical AI | San Francisco, CA, USA |
| [Agency Tool Company](https://www.ycombinator.com/companies/agency-tool-company) | Summer 2026 | Reliable infrastructure to build, deploy and manage real-world robots. | Denver, CO, USA |
| [Aktoria Robotics](https://www.ycombinator.com/companies/aktoria-robotics) | Summer 2026 | Human as API for robots | San Francisco, CA, USA |
| [Cosmic Robotics](https://www.ycombinator.com/companies/cosmic-robotics) | Summer 2026 | Autonomous construction on Earth and beyond | San Francisco, CA, USA |
| [Datoric](https://www.ycombinator.com/companies/datoric) | Summer 2026 | The training data R&D engine for physical AI | San Francisco, CA, USA |
| [Dawn Industries](https://www.ycombinator.com/companies/dawn-industries) | Summer 2026 | Automatic Diagnosis & Fix for Industrial Automation Cells | San Francisco, CA, USA |
| [DeepReach Inc.](https://www.ycombinator.com/companies/deepreach-inc) | Summer 2026 | Network for Physical AI Data Business | San Francisco, CA, USA |
| [Edgerun](https://www.ycombinator.com/companies/edgerun) | Summer 2026 | Military exoskeletons | San Francisco, CA, USA |
| [Ekho Labs](https://www.ycombinator.com/companies/ekho-labs) | Summer 2026 | World Model for Freight | New York City, NY, USA |
| [Enact](https://www.ycombinator.com/companies/enact) | Summer 2026 | Real-world RL environments for robotics models | San Francisco, CA, USA |
| [Greypoint Industries](https://www.ycombinator.com/companies/greypoint-industries) | Summer 2026 | Building drone swarms that hunt hidden enemies. | San Francisco, CA, USA |
| [Grip](https://www.ycombinator.com/companies/grip) | Summer 2026 | Robots for waste manipulation | Zürich, ZH, Switzerland |
| [Hebbian Robotics](https://www.ycombinator.com/companies/hebbian-robotics) | Summer 2026 | Foundational infrastructure for Physical AI | San Francisco, CA, USA |
| [Hilstart](https://www.ycombinator.com/companies/hilstart) | Summer 2026 | Autonomous Hardware Testing | San Francisco, CA, USA |
| [Libra Robotics](https://www.ycombinator.com/companies/libra-robotics) | Summer 2026 | The robot workforce for infrastructure of the AI era | San Francisco, CA, USA |
| [Maingen](https://www.ycombinator.com/companies/maingen) | Summer 2026 | Simulating Agents Running Industrial Companies | San Francisco, CA, USA |
| [Manifold](https://www.ycombinator.com/companies/manifold-2) | Summer 2026 | Drop-in robotic labor that works on Day 1 | Los Angeles, CA, USA |
| [Mass Magnetics](https://www.ycombinator.com/companies/mass-magnetics) | Summer 2026 | USA-made magnetics for robotics and defense. | Boston, MA, USA |
| [Most Robotic](https://www.ycombinator.com/companies/most-robotic) | Summer 2026 | Research lab building the most robotic household in the world | San Francisco, CA, USA |
| [Moving Atoms](https://www.ycombinator.com/companies/moving-atoms) | Summer 2026 | Scan to 3D Model | San Francisco, CA, USA |
| [Neuromorphic](https://www.ycombinator.com/companies/neuromorphic) | Summer 2026 | Building robots to automate wetlabs | San Francisco, CA, USA |
| [Neuron Industries](https://www.ycombinator.com/companies/neuron-industries) | Summer 2026 | Industrial Controllers built for AI | Los Angeles, CA, USA |
| [Nori](https://www.ycombinator.com/companies/noril1) | Summer 2026 | The most capable American-made humanoid robot for $1,688 | San Francisco, CA, USA |
| [Olam Labs](https://www.ycombinator.com/companies/olam-labs) | Summer 2026 | Crafting simulations for frontier lab model training | San Francisco, CA, USA |
| [OpenVector](https://www.ycombinator.com/companies/openvector) | Summer 2026 | AI that turns any camera to an autonomous worker with real-time vision | San Francisco, CA, USA |
| [OS3](https://www.ycombinator.com/companies/os3) | Summer 2026 | Affordable, intelligent humanoid robots built to deploy at scale | San Francisco, CA, USA |
| [Pacific](https://www.ycombinator.com/companies/pacific) | Summer 2026 | Mass-producing and financing micro data center incredibly quickly. | San Francisco, CA, USA |
| [Pennant](https://www.ycombinator.com/companies/pennant) | Summer 2026 | The World Model for Corporate Governance | New York City, NY, USA |
| [Praxis Robotics](https://www.ycombinator.com/companies/praxis-robotics) | Summer 2026 | Turns real businesses into robotics data vendors | San Francisco, CA, USA |
| [Proprio Robotics](https://www.ycombinator.com/companies/proprio-robotics) | Summer 2026 | Robots to maintain and assemble data centers | San Francisco, CA, USA |
| [ProvenMetal](https://www.ycombinator.com/companies/provenmetal) | Summer 2026 | AI-native electronics manufacturing for the American industrial base | San Francisco, CA, USA |
| [Robocurve](https://www.ycombinator.com/companies/robocurve) | Summer 2026 | Evals for robots | San Francisco, CA, USA |
| [Salem Robotics Inc](https://www.ycombinator.com/companies/salem-robotics-inc) | Summer 2026 | Deploying robots to replace workers in hazardous spaces | San Francisco, CA, USA |
| [Shiraz AI](https://www.ycombinator.com/companies/shiraz-ai) | Summer 2026 | Robots that learn on the job | San Francisco, CA, USA |
| [Studio](https://www.ycombinator.com/companies/studio) | Summer 2026 | Accurately simulate market response at scale | San Francisco, CA, USA |
| [Synapse Semiconductor](https://www.ycombinator.com/companies/synapse-semiconductor) | Summer 2026 | New semiconductors that merge compute and vision | Durham, NC, USA |
| [Tensr](https://www.ycombinator.com/companies/tensr) | Summer 2026 | Robotic factories that build robots | Emeryville, CA, USA |
| [Ultrasonium](https://www.ycombinator.com/companies/ultrasonium) | Summer 2026 | Metal manufacturing, faster, cheaper, and more versatile. | Boston, MA, USA |
| [Waddle Labs](https://www.ycombinator.com/companies/waddle-labs) | Summer 2026 | LLMs that control robots | San Francisco, CA, USA |
| [Ageospatial](https://www.ycombinator.com/companies/ageospatial) | Fall 2026 | Physical intelligence for every decision with Geospatial AI. | San Francisco, CA, USA; Remote |
| [Antropi Robotics](https://www.ycombinator.com/companies/antropi-robotics) | Fall 2026 | Autonomous CNC factories for faster hardware | San Francisco, CA, USA |
| [Applied Kinetics](https://www.ycombinator.com/companies/applied-kinetics) | Fall 2026 | AI-native manufacturing for data center and energy projects | San Francisco, CA, USA |
| [Archgen Labs](https://www.ycombinator.com/companies/archgen-labs) | Fall 2026 | AI-powered EDA tools for faster, cooler 3D chips | San Francisco, CA, USA |
| [Asim](https://www.ycombinator.com/companies/asim-group) | Fall 2026 | Enable robots to operate safely in the real world. | San Francisco, CA, USA |
| [Axonnic](https://www.ycombinator.com/companies/axonnic) | Fall 2026 | Bringing human dexterity to every robot | San Francisco, CA, USA; Remote |
| [Deploy](https://www.ycombinator.com/companies/deploy) | Fall 2026 | The generalist robot deployment company. | San Francisco, CA, USA |
| [Dreamscale Labs](https://www.ycombinator.com/companies/dreamscale-labs) | Fall 2026 | Real-time cloud inference for robotics. | San Francisco, CA, USA |
| [Evident Machines](https://www.ycombinator.com/companies/evident-machines) | Fall 2026 | Real-world benchmarks for electrical engineering | San Francisco, CA, USA |
| [Hemlock](https://www.ycombinator.com/companies/hemlock) | Fall 2026 | Force + contact dynamics collected at scale for training physical AI. | San Francisco, CA, USA |
| [horizontal.](https://www.ycombinator.com/companies/horizontal) | Fall 2026 | AI agents that run factory operations end-to-end. | San Francisco, CA, USA |
| [Hundred](https://www.ycombinator.com/companies/hundred) | Fall 2026 | 100% automated inspection for consumer electronics parts | San Francisco, CA, USA |
| [Lux Foods](https://www.ycombinator.com/companies/lux-foods) | Fall 2026 | Crops engineered for premium fruit, grown without sunlight. | San Francisco, CA, USA |
| [Mantle](https://www.ycombinator.com/companies/mantle-2) | Fall 2026 | The pit crew for machines and robots. | San Francisco, CA, USA |
| [Micora](https://www.ycombinator.com/companies/micora) | Fall 2026 | Microgrids in a box built anywhere in days | San Francisco, CA, USA |
| [Odin Robotics](https://www.ycombinator.com/companies/odin-robotics) | Fall 2026 | Robot arms that do repetitive manual work in existing factories. | ZH, Switzerland |
| [Open Actuation](https://www.ycombinator.com/companies/open-actuation) | Fall 2026 | Quick-turn, purpose-built motors & actuators for all | Los Angeles, CA, USA |
| [Preload](https://www.ycombinator.com/companies/preload) | Fall 2026 | Sensorimotor context for physical AI | San Francisco, CA, USA |
| [Primordiant](https://www.ycombinator.com/companies/primordiant) | Fall 2026 | Embodied Scientific Intelligence | San Francisco, CA, USA |
| [Rhem Labs](https://www.ycombinator.com/companies/rhem-labs) | Fall 2026 | Home care technology for aging parents and their families | San Francisco, CA, USA |
| [Rodeo Robotics](https://www.ycombinator.com/companies/rodeo-robotics) | Fall 2026 | Robots for vehicle maintenance. | San Francisco, CA, USA |
| [Runtime.si](https://www.ycombinator.com/companies/runtimesi) | Fall 2026 | Evaluation Infrastructure for Robotics (YC F26) | San Francisco, CA, USA |
| [Shepherd Robotics](https://www.ycombinator.com/companies/shepherd-robotics) | Fall 2026 | Robots for high skilled labor powering AI infrastructure | San Francisco, CA, USA |
| [Silica](https://www.ycombinator.com/companies/silica) | Fall 2026 | Actuators for Physical AI | San Francisco, CA, USA |
| [Simantic](https://www.ycombinator.com/companies/simantic) | Fall 2026 | Firmware simulation for AI agents | Waterloo, ON, Canada |
| [Sinter](https://www.ycombinator.com/companies/sinter-systems) | Fall 2026 | Accelerated plastics manufacturing | El Segundo, CA, USA |
| [Theseus Robotics](https://www.ycombinator.com/companies/theseus-robotics) | Fall 2026 | Humanoids to restock retail shelves & pick orders | ZH, Switzerland |
| [twentyfour26](https://www.ycombinator.com/companies/twentyfour26) | Fall 2026 | On Demand CNC Prototyping | San Francisco, CA, USA |
| [Workers IO](https://www.ycombinator.com/companies/workers-io) | Fall 2026 | Simulation environments for verifying mission-critical software | San Francisco, CA, USA |
