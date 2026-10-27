# Mercado de datos y servicios para robots (19 de octubre de 2026)

Investigación web para responder a quién le sirven los datos de Real Steel, y para ubicar Relevo y Freno. Cada dato tiene su fuente. Lo marcado "sin verificar" viene de blogs o agregadores.

## 1. Quién usa movimiento humano para entrenar humanoides, y en qué formato

**Movimiento de cuerpo completo (lo más parecido a Real Steel).** Se usa para entrenar el control de cuerpo completo: que el robot camine, se agache o imite a una persona.

- **HumanPlus** (Stanford, 2024) entrenó con **AMASS** (40 h de captura de movimiento pública, gratis) convertida al Unitree H1. El robot sigue a una persona con **una sola cámara RGB**. [paper](https://arxiv.org/pdf/2406.10454)
- **H2O / OmniH2O** (CMU, 2024): teleoperación de cuerpo completo con una cámara RGB o VR, entrenada con AMASS. [H2O](https://arxiv.org/pdf/2403.04436) · [OmniH2O](https://arxiv.org/pdf/2406.08858)
- **NVIDIA SONIC** (febrero de 2026): modelo base de control de cuerpo completo entrenado con **unas 700 h de captura de movimiento**. Entre sus habilidades lista el boxeo. [repo](https://github.com/NVlabs/GR00T-WholeBodyControl)
- **G1 Moves** (marzo de 2026): pipeline abierto que convierte video de una sola cámara en movimientos del Unitree G1 (baile, artes marciales) y los entrena en MuJoCo. Es casi lo mismo que hace Real Steel. [sitio](https://exptech-g1-moves.static.hf.space/index.html)
- **Conclusión: la pose del cuerpo sin manos ni objetos ya existe gratis y en volumen** (AMASS, LAFAN1), y hay herramientas abiertas para pasarla a robots ([GMR](https://github.com/apx103/gmr)). Por sí sola vale poco.

**Lo que sí escasea:**

- **Video en primera persona de manos haciendo tareas.** Lo usan NVIDIA GR00T N1 ([fuente](https://research.nvidia.com/publication/2025-03_nvidia-isaac-gr00t-n1-open-foundation-model-humanoid-robots)) y Physical Intelligence, que con ese video humano duplica el rendimiento en tareas con pocos datos de robot ([fuente](https://pi.website/research/human_to_robot)). Figure navegó solo con video humano y firmó con Brookfield para grabar dentro de más de 100.000 viviendas ([Go-Big](https://www.figure.ai/news/project-go-big)). Apple publicó EgoDex ([paper](https://arxiv.org/pdf/2505.11709)).
- **Teleoperación con las acciones del robot:** una persona maneja un robot y se guarda qué hizo el robot.

## 2. Quién recolecta datos y cuánto paga

- **Scale AI, Physical AI Data Engine:** más de 150.000 horas entregadas en 2025. Clientes: Physical Intelligence, Generalist AI, Cobot. [blog](https://scale.com/blog/physical-ai) · [carta 2026](https://scale.com/blog/scales-next-era-building-for-2026)
- **Micro1:** miles de personas en más de 50 países, Argentina incluida, graban tareas del hogar. Su CEO estima que las empresas de robótica gastan **más de USD 100 M al año** en datos reales. También recolectan DoorDash y Encord. [MIT Technology Review, 1 de abril de 2026](https://www.technologyreview.com/2026/04/01/1134863/humanoid-data-training-gig-economy-2026-breakthrough-technology/)
- **Lo que se le paga a quien graba:** India unos USD 2,5 la hora ([fuente](https://letsdatascience.com/news/indian-workers-train-ai-robots-with-headcam-footage-463a3761)); ofertas de USD 6 a 15 la hora ([OpenTrain](https://www.opentrain.ai/jobs/first-person-household-video-data-recorder--cmsgy6rnh000p04jxp5f2tbcz/)); Tesla pagaba USD 25 a 48 la hora con traje de captura en 2024 ([Decrypt](https://decrypt.co/245399/tesla-bot-robotics-job-motion-capture-suit)).
- **China:** más de 40 centros estatales de recolección, con un teleoperador por robot. [fuente](https://www.all-about-industries.com/china-robot-schools-humanoid-robots-training-a-e91df81a17e3ba9325c6d59aa948fdd7/)
- **Latinoamérica ya está en esto:** Keywords Studios contrata "pilotos de robots" con VR en CDMX ([oferta](https://jobs.workable.com/jobs/c40dc494-226f-4b5e-927e-b7b04585b117.md)); XDOF (portafolio de a16z) busca un líder de operaciones para Latinoamérica ([oferta](https://jobs.a16z.com/jobs/xdofai/fab0cea4-1ac2-4e0d-b7e0-fec47e21fb48--latam-operations-lead)); Remotics hace teleoperación desde CDMX.
- **Precio de venta por hora de dato:** no hay cifras públicas confiables. Un blog sin verificar habla de USD 25 a 80 por demostración.

## 3. Dinero en el sector

- Figure: valuación de USD 39.000 M (septiembre de 2025). Physical Intelligence: USD 5.600 M (noviembre de 2025). Skild AI: más de USD 14.000 M (enero de 2026). [L.E.K.](https://www.lek.com/sites/default/files/2026-10/humanoid-robotics-assessing-where-value-may-accrue-in-physical-ai-ei.pdf)
- **Apptronik**, que fabrica el Apollo que usa Real Steel, levantó unos USD 935 M en su Serie A, en parte para **centros de entrenamiento y recolección de datos**. [The Robot Report](https://www.therobotreport.com/apptronik-brings-in-another-520m-to-ramp-up-apollo-production/)
- Proyección de Morgan Stanley: unos USD 5 billones en humanoides para 2050. [fuente](https://humanoid.guide/?p=3205)

## 4. Peleas de robots como espectáculo

- **CMG Mecha Fighting Series** (Hangzhou, 25 de mayo de 2025): Unitree G1 manejados por personas, transmitido por CCTV. [fuente](https://english.henan.gov.cn/2025/05-26/3162232.html)
- **EngineAI** lanzó una liga con un cinturón de unos USD 1,44 M y les regala robots a los equipos. [fuente](https://mugglehead.com/worlds-first-humanoid-robot-fight-league-officially-launches-with-us1-44m-gold-belt-prize/)
- **REK** (San Francisco): liga de humanoides **manejados con VR**, con entradas de USD 60 a 80 y local propio en 2026. Hizo una pelea entre una persona y un robot y recibió una orden de cese de la comisión atlética de California. [Rest of World](https://restofworld.org/2026/chinese-robot-boxing-unitree-rek/)
- **Silicon Colosseum** (San Francisco): entradas a USD 30, con lleno. [eWeek](https://www.eweek.com/news/chinese-humanoid-robots-san-francisco-boxing-match/)
- No hay cifras públicas de audiencia ni de ingresos.

## 5. Captura de movimiento con el celular

- **Move.ai** captura con un solo iPhone desde 2023 (costaba USD 30 al mes). También están DeepMotion y Rokoko Vision. [CG Channel](https://www.cgchannel.com/2023/11/move-ai-releases-move-one)
- **Conclusión: la captura de movimiento con el celular ya es un commodity.**

## 6. Teleoperación como servicio (Relevo)

- **1X NEO, "Expert Mode":** empleados de 1X en EE. UU. toman el control del robot del cliente con VR, y lo grabado vuelve a 1X como dato de entrenamiento. NEO cuesta USD 499 al mes o USD 20.000. [Road to VR](https://roadtovr.com/helper-robot-neo-vr-telepresence/)
- **Telexistence + Astro Robotics:** pilotos en **Manila** supervisan unos 50 robots cada uno en tiendas de Japón e intervienen en alrededor del 4 % de los casos, por unos USD 250 a 315 al mes. **Es el modelo de Relevo, desde Filipinas.** [Rest of World](https://restofworld.org/2025/philippines-offshoring-automation-tech-jobs/)
- **Teleoperar con el iPhone ya está resuelto técnicamente:** LeRobot trae un teleoperador por teléfono ([docs](https://www.mintlify.com/huggingface/lerobot/teleoperators/phone)); COIN usa un celular de menos de USD 20 ([paper](https://arxiv.org/pdf/2604.16886)); RoboTurk lo hacía con ARKit en 2018 ([paper](https://arxiv.org/pdf/1811.02790)).

## 7. Seguridad de robots (Freno)

- **ISO 10218-1/2:2025:** la norma de seguridad de robots industriales, renovada; absorbe ISO/TS 15066 (robots colaborativos) y agrega ciberseguridad. [The Robot Report](https://www.therobotreport.com/iso-10218-industrial-robot-safety-standard-receives-major-overhaul/)
- **ISO 25785-1:** la primera norma para humanoides (robots que se mantienen en pie solos), todavía en borrador. La impulsan Agility y Boston Dynamics. [ISO](https://www.iso.org/standard/91469.html)
- **El problema técnico:** frenar de golpe a un humanoide lo hace caer como un péndulo. [Synapticon](https://www.synapticon.com/en/newslist/whitepaper-safety-fur-humanoide-roboter)
- **Competencia:** Synapticon POSITRON, con una capa de "seguridad del comportamiento de la IA" separada de la seguridad certificada ([fuente](https://www.synapticon.com/en/newslist/synapticon-auf-dem-robotics-summit-boston-2026)); NVIDIA Halos; Safeworld (USD 12 M en 2026, [fuente](https://cryptobriefing.com/safeworld-12m-seed-robot-safety/)); 3Laws Robotics (USD 4,1 M en 2024).
- **No apareció nadie que se venda como "firewall de IA para robots"**, pero competir significa enfrentar a NVIDIA y Synapticon, y la certificación es cara y lenta.
