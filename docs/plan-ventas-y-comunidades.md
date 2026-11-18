# Plan de Mercado, Comunidades y Comercialización B2B — Tridi (Noviembre 2026)

> **Responsable directo:** Juan Villa (CTO), en coordinación con Ale (COO), Pastor (CEO) y César (CIO/CTO).  
> **Contexto real:** Mientras Pastor simplifica la interfaz de `Tridi Assembler` (`#/assembler`) para que cualquier usuario pueda usarla sin fricción técnica, este documento define **cómo sacamos Tridi a la calle**.  
> **Realidad del negocio:** Tridi es B2B técnico puro. Un cliente de automatización industrial o un laboratorio de robótica **jamás** va a llegar porque pongamos un anuncio pagado en Instagram. Llegan por **credibilidad técnica en comunidades, presencia constante en LinkedIn, relaciones con integradores/universidades locales y correos directos (outbound) ultra-específicos** mostrando lo que ya corre en vivo en [`trytridi.com`](https://trytridi.com).

---

## 1. Qué Comercializamos Exactamente (Las 3 Verticales en Producción)

Cada vertical tiene un comprador distinto, un canal distinto y una oferta de entrada sin fricción:

| Vertical | Qué entra → Qué entrega Tridi (`trytridi.com`) | Quién lo necesita hoy (Perfil real) | Cómo entramos (Gancho inicial sin fricción) | Cómo cobramos después (Negocio) |
| --- | --- | --- | --- | --- |
| **Vertical 1: Humanoides (`Unitree G1` / `H1`)** | Video humano (`.mp4` / cámara en vivo) → Retargeting SMPL-X + manos 5 dedos → Política `ONNX a 50 Hz` + Dataset físico (`#/delivery`). | **1.** Laboratorios universitarios y privados con un `G1`/`H1` parado en modos de fábrica.<br>**2.** Startups de captura de datos en YC (*Asimov, Cortex AI, Sensei, Hub, Labelbox Terra*) que graban video crudo pero no tienen física ni políticas. | *"Mándanos 3 videos de una tarea que quieras en tu G1 y te devolvemos gratis el paquete `policy.onnx` + `rollouts` validado en MuJoCo para que lo pruebes."* | **B2B Data / Policy Licensing:** Cobro por paquete de habilidades entrenadas o licencia de procesamiento sobre el corpus de video del partner ($2,000–$10,000+). |
| **Vertical 2: Rovers y Mecatrónica (`CAD .stl + .ino`)** | Mallas 3D (`.stl`) + código Arduino/ESP32/C → Auditoría de pines/timers (`Timer1` vs `Servo.h`, `pulseIn` → `ISR`) + Gemelo 3D MuJoCo + Firmware C99 a `50 Hz` sin bloqueos (`#/assembler`). | **1.** Clubes/laboratorios de robótica y mecatrónica en universidades (Venezuela y LatAm).<br>**2.** Talleres de prototipado, agencias de hardware y constructores de AMRs/rovers. | *"Como hicimos con el rover de Luigi (`trytridi.com/#/milestones`), pásanos el `.zip` con los `.stl` y el `.ino` de un robot que te esté fallando en piso real; le armamos el gemelo 3D gratis y lo publicamos juntos como caso de estudio."* | **SaaS Pro / Equipos:** Acceso recurrente al Assembler + compilador MCU/C99 ($49–$299/mes para labs/talleres). |
| **Vertical 3: Plantas Industriales y P&ID (`.dxf` → `ISA` + `3D` + `PLC`)** | Plano AutoCAD P&ID (`.dxf`) → **1. Documentación `ISA-5.1 / ISA-88` (`FDS`)**, **2. Simulación 3D interactiva en MuJoCo**, y **3. Código plano de bloques PLC** (`Siemens .scl` y `Rockwell .L5K`). | **1.** **Integradores de automatización industrial** (como ZAKA, C.A., integradores Rockwell/Siemens/Ignition).<br>**2.** Fabricantes medianos de maquinaria (OEMs de empaque, alimentos, café, agroindustria). | *"Antes de que gasten semanas redactando la memoria descriptiva `ISA-5.1` o probando tiempos a ciegas en planta, pásanos un plano `.dxf` y en 48h te damos la documentación FDS, el gemelo 3D en web y el `.scl`/`.L5K` para que nos des tu feedback."* | **Cloud SaaS *Pay-per-Compute* / Por Proyecto:** $199–$499/mes por integradora o $300–$1,500 por proyecto industrial procesado/simulado. |

---

## 2. Fase 1 (La más rápida — Días 1 a 10): Presentarnos en Comunidades ("Show & Ask", Cero Tono Vendedor)

**El error típico:** Entrar a un foro o grupo diciendo *"Vendemos Tridi por $500"*. En comunidades de ingenieros eso genera rechazo inmediato o bloqueo por spam.  
**Cómo sí funciona en startups B2B:** Entrar con humildad técnica (**"Show & Ask"**). Mostrar lo que construimos, poner el link directo que abre en 2 segundos sin pedir registro (`trytridi.com`) y pedir opinión honesta de colegas: *"¿Qué les parece? ¿Dónde ven que esto les ahorraría tiempo real y qué le falta?"*.

### A. Comunidades en Venezuela (Barquisimeto, Caracas, Valencia, Mérida) — Trato directo
Aquí tenemos ventaja inmediata de cercanía, idioma y orgullo local ("un equipo venezolano haciendo Physical AI y aplicando a YC"):

1. **Dónde meternos esta misma semana:**
   - **Capítulos estudiantiles y profesores de Mecatrónica / Robótica / Automatización:**
     - **Barquisimeto:** **UNEXPO Barquisimeto** (Ing. Electrónica / Mecatrónica — de donde salió el caso de Luigi D'Aquaro), **UFT (Universidad Fermín Toro)** (Ing. en Computación / Eléctrica), **UCLA**.
     - **Caracas / Centro / Andes:** **USB** (Grupo de Mecatrónica / IEEE RAS USB), **UCV**, **UCAB**, **UNET (Táchira)**, **ULA (Mérida)**, **UC (Valencia)**.
   - **Gremios e Integradores Locales:**
     - **CIEL (Cámara de Industriales del Estado Lara)** y empresas de la Zona Industrial de Barquisimeto (alimentos, empaquetadoras, torrefactoras de café).
     - **Colegas y red cercana a ZAKA, C.A.** (ingenieros de automatización y control en Lara, Portuguesa, Yaracuy y Carabobo).
2. **Mensaje exacto para presentarnos en comunidades/grupos de Venezuela (WhatsApp / Telegram / Correo / En persona):**
   > *"¡Hola a todos! ¿Cómo están? Somos Juan, Pastor, César y Ale. Hace unas semanas armamos **Tridi** (`https://trytridi.com`) en la Platanus Hack en Caracas y con esto estamos aplicando a Y Combinator.*  
   > *Construimos un motor en el navegador (sobre MuJoCo) que hace tres cosas: (1) convierte videos humanos en políticas para robots humanoides, (2) toma piezas CAD (`.stl`) + código Arduino (`.ino`) de rovers/robots, simula la física real (fricción de llantas, zonas muertas de PWM, retardos de `pulseIn`) y devuelve el código en C a 50 Hz (acá pueden ver lo que hicimos con el robot de Luigi acá en Barquisimeto: `https://trytridi.com/#/milestones`), y (3) lee planos industriales P&ID (`.dxf`) para generar documentación `ISA-5.1`, simulación 3D y bloques de PLC (`.scl` / `.L5K`).*  
   > *Queremos presentarnos con la comunidad de acá: ¿qué les parece? Si alguien en el grupo o en su laboratorio tiene un robot físico, un brazo o un plano de automatización con el que esté peleando ahorita, nos encantaría armarles el gemelo físico 3D totalmente gratis para probar nuestro motor con más casos reales de Venezuela. ¡Cualquier feedback técnico es súper bienvenido!"*

---

### B. Comunidades Internacionales Online (Reddit, Discord y Foros de Automatistas/Robótica)
Aquí están miles de ingenieros que trabajan todos los días con PLCs, MuJoCo, ROS y Unitree.

| Comunidad / Foro | Quién está ahí | Qué mostrar (Ángulo exacto) |
| --- | --- | --- |
| **[`r/PLC`](https://www.reddit.com/r/PLC/)** (~95k miembros) + **Discord de `r/PLC`** | Integradores de Rockwell (`Studio 5000`), Siemens (`TIA Portal`), Ignition y Beckhoff de todo el mundo. | Mostrar `#/assembler` y `#/simulations/factory_cell`: cómo leemos un `.dxf` P&ID en el navegador y escupimos la documentación FDS `ISA-5.1`, la escena 3D estilo *Factory I/O* en web y el archivo `.scl` / `.L5K`. Preguntar: *"We're building a lightweight browser tool to go from P&ID .dxf to ISA-5.1 docs + 3D simulation + ST/L5K skeleton. What's the most annoying manual step in your commissioning workflow today?"* |
| **[PLCTalk.net](https://www.plctalk.net/forums/)** y **[Control.com](https://control.com/forums/)** | Dueños de integradoras e ingenieros senior de planta (30–60 años) en EE.UU., Canadá y LatAm. | Hilo técnico sobre **generación automática de tablas I/O, narrativas de control `ISA-88` y matrices Causa-Efecto desde planos AutoCAD `.dxf`**. |
| **[Inductive Automation Forum (Ignition)](https://forum.inductiveautomation.com/)** | Los integradores industriales más modernos y abiertos a herramientas web/cloud. | Mostrar cómo el gemelo físico 3D en el navegador sirve como banco de pruebas (*Virtual Commissioning*) ligero antes de ir a planta. |
| **LeRobot Discord (Hugging Face)** (+25k miembros) | Ingenieros y labs entrenando brazos, rovers y humanoides con RL e imitación. | Mostrar el pipeline `Video → GVHMR + WiLoR → MuJoCo WASM 500 Hz → ONNX 50 Hz` corriendo directo en el navegador (`trytridi.com/#/simulations`) + el compilador `ONNX → C99` (`export_mcu.py`). |
| **Unitree Robotics Discord** & **MuJoCo GitHub Discussions** | Compradores reales de **Unitree G1 / H1 / Go2** e investigadores de física. | Mostrar `Unitree G1` caminando, corriendo a `1.56 Hz`, lavando platos con manos de 5 dedos y aguantando empujones de `500 N` en 4 pisos en el navegador, y ofrecer empaquetar movimientos custom en `#/delivery`. |
| **[`r/robotics`](https://www.reddit.com/r/robotics/)**, **[`r/ROS`](https://www.reddit.com/r/ROS/)** y **[`r/mechatronics`](https://www.reddit.com/r/mechatronics/)** | Constructores de rovers, AMRs y estudiantes/profesores de robótica. | Post del **Caso Luigi Sim-to-Real (`trytridi.com/#/milestones`)**: cómo depuramos `PWM < 115` en llantas de TPU, el bloqueo de `47.1 ms` de `pulseIn()` y el conflicto de `Timer1` con `<Servo.h>` usando MuJoCo + C99 a 50 Hz. |

---

## 3. Fase 2: Estrategia de LinkedIn para Tridi (Nuestro Canal Principal de Confianza B2B)

En B2B industrial y robótica, **LinkedIn es nuestra vidriera comercial número 1**. Cada vez que mandemos un correo a un laboratorio o escribamos a un integrador, van a entrar al LinkedIn de Tridi y a nuestros perfiles personales. Si ven actividad técnica real, responden.

### A. Cómo manejamos el LinkedIn de Tridi + Perfiles de los 4 Fundadores
1. **La regla del amplificador:** La página corporativa de **Tridi** publica **2 o 3 veces por semana**, pero **Juan, Pastor, Ale y César** comparten/comentan desde sus cuentas personales contando el "detrás de cámaras" desde su rol (los perfiles de personas tienen 5× más alcance orgánico en LinkedIn que las páginas de empresa).
2. **Formato que sí funciona en LinkedIn técnico:**
   - **Siempre video nativo corto (20–40 segundos) subido directo a LinkedIn** (sin sonido obligatorio, con subtítulos o etiquetas claras en pantalla, porque el 80 % ve LinkedIn en silencio).
   - **El enlace a `trytridi.com` va en el primer comentario o al final del texto corto.**
   - **Etiquetar tecnologías y empresas reales:** `@Rockwell Automation`, `@Siemens`, `@Unitree Robotics`, `#MuJoCo`, `#PLC`, `#SimToReal`, `#PhysicalAI`, `#ISA88`.

### B. Los 4 Pilares de Contenido Semanal en LinkedIn (Calendario repetible)
1. **Post Tipo 1 — "Hardware Real vs. Simulación" (Vertical 2: Mecatrónica / Rovers):**
   - *Video:* Pantalla dividida del rover físico de Luigi chocando vs. el gemelo en MuJoCo + el robot físico esquivando perfecto a 50 Hz.
   - *Texto:* Explicar en 5 balas los 3 bugs físicos reales que el simulador destapó (`PWM < 115`, `pulseIn` de `47,1 ms`, `Timer1` vs `<Servo.h>`). Llamado final: *"Si tienes un rover o brazo en tu laboratorio y quieres meterlo al simulador, escríbenos por DM"*.
2. **Post Tipo 2 — "De Plano P&ID (.dxf) a Planta 3D y Código PLC en 60 segundos" (Vertical 3: Industrial):**
   - *Video:* Grabación de pantalla en `#/assembler` cargando `01_batch_mixer.dxf`, generando la tabla `I/O Schedule ISA-5.1`, abriendo la celda 3D en `#/simulations/factory_cell` (mostrando qué pasa cuando patina la banda un 28 % en timer fijo vs. sensores ópticos) y descargando el `.scl` para TIA Portal / `.L5K` para Studio 5000.
   - *Texto:* Dirigido directo a **integradores de automatización**: cuánto tiempo se pierde redactando la FDS a mano y probando recetas en parada de planta.
3. **Post Tipo 3 — "De un Video de Celular a un Humanoide Físico" (Vertical 1: Humanoides):**
   - *Video:* Grabación de `#/simulations` con el video PiP de la persona corriendo o lavando platos al lado del `Unitree G1` en MuJoCo, empujándolo con `300 N` en piso resbaloso sin que caiga.
   - *Texto:* Explicar cómo compilamos MuJoCo WASM a 500 Hz + ONNX a 50 Hz en el navegador y cómo entregamos el paquete listo en `#/delivery`.
4. **Post Tipo 4 — "Build in Public" de la Startup (Validación en campo):**
   - *Foto / Video:* Foto o aprendizaje de reuniones reales (como la sesión de 2 horas con el Ing. José González de ZAKA en Barquisimeto, o pruebas nuevas de hardware con el equipo). A los ingenieros e inversionistas les encanta ver fundadores saliendo a hablar con la industria real.

### C. Rutina Diaria de Conexiones en LinkedIn (15 minutos al día)
Cada día agregamos a **10–15 personas ultra-filtradas** con una nota de invitación de 2 líneas (sin vender en la invitación):
- **Filtro 1 (Industrial):** Buscar `"Integrador PLC"`, `"Rockwell Studio 5000"`, `"Siemens TIA Portal"`, `"Ingeniero de Automatización"`, `"Control Systems Integrator"` en Venezuela, Colombia, México, Chile y EE.UU.
- **Filtro 2 (Robótica):** Buscar `"Unitree G1"`, `"MuJoCo"`, `"Sim-to-Real"`, `"Humanoid Robotics"`, `"Robotics Lab"` en universidades y startups.
- **Nota al conectar (300 caracteres máx.):**
  > *"Hola [Nombre], vi que trabajas en [automatización con Rockwell/Siemens / robótica con MuJoCo]. Estamos construyendo Tridi (trytridi.com) para simular física real y generar código de control desde planos/video. Gusto en conectar por acá."*

---

## 4. Fase 3: Correos Fríos (Cold Outbound) a Laboratorios de Robótica, Startups de Datos e Integradores

En B2B, los correos fríos funcionan si cumplen **3 reglas estrictas**:
1. **Asunto corto y técnico** (parece escrito por otro ingeniero, no por marketing).
2. **Máximo 4 a 5 líneas de texto** (se lee en 10 segundos en el celular).
3. **Un ofrecimiento concreto y gratuito de entrada** (hacerles 1 simulación/política de prueba sobre sus propios archivos).

### A. Guion 1 — Para Laboratorios de Robótica con Unitree G1 / H1 / Rovers (Inglés)
*A quién enviarle:* Laboratorios universitarios (CMU, Berkeley, ETH, MIT, Stanford, Georgia Tech, etc.) y autores de papers recientes en ArXiv que mencionen `Unitree G1`, `H1` o `MuJoCo`.

- **Subject:** `50Hz MuJoCo policy + C99/ONNX export for your [G1 / rover] at [Lab Name]`
- **Body:**
  > Hi [First Name],  
  > Saw your lab's recent work on [mention specific robot/paper].  
  > We built **Tridi** (`https://trytridi.com/#/simulations`) — it turns monocular human video or custom `.stl` CAD into 50 Hz MuJoCo policies (`< 2 cm` fingertip retargeting error on G1 + 5-finger Inspire hands) and deterministic C99 firmware.  
  > How are you getting new motions onto your robot today, and what's the biggest bottleneck? Happy to run 2–3 of your reference videos or CAD models through our pipeline for free this week so you can test the exported `.onnx` / `.ino` package.  
  > Best,  
  > Juan — CTO @ Tridi (`https://trytridi.com/#/delivery`)

### B. Guion 2 — Para Startups de Captura de Datos de YC (*Asimov, Cortex AI, Sensei, Hub, Labelbox Terra*)
*Por qué son un cliente/partner ideal:* Ellos ya levantaron millones para pagarle a gente que graba miles de horas de video en primera persona, pero **no pasan ese video por un motor físico ni entregan políticas entrenadas**. Tridi es la capa física que convierte sus videos crudos en paquetes vendibles a fabricantes de robots.

- **Subject:** `Turning [Company]'s human video corpus into physics-verified G1 MuJoCo policies`
- **Body:**
  > Hey [First Name],  
  > Following [Asimov / Cortex / Sensei]'s work on scaling human video collection.  
  > We built **Tridi** (`https://trytridi.com/#/delivery`), the physics layer downstream of raw video: we take in-the-wild human clips, extract 3D body + 21-joint hands (`GVHMR + WiLoR`), retarget to Unitree G1/H1 in MuJoCo, and train 50 Hz ONNX policies tested across 4 terrains.  
  > Send us 5 sample clips from your dataset and we'll return the full physics-verified `RobotMotion` + trained `.onnx` policies in 24h so you can see how it pairs with your data offering. Down to test a batch?  
  > Best,  
  > Juan — CTO @ Tridi

### C. Guion 3 — Para Dueños de Empresas Integradoras de Automatización (Español — LatAm / España)
*De dónde sacamos los correos:* Directorio público de **CSIA (`controlsys.org`)**, **Rockwell PartnerNetwork**, **Siemens Solution Partner Finder** y cámaras industriales en Venezuela, México (Monterrey, Querétaro, Bajío) y Colombia (Medellín, Bogotá, Cali).

- **Asunto:** `De plano P&ID (.dxf) a documentación ISA-5.1 + gemelo 3D y código PLC en 48h`
- **Cuerpo:**
  > Hola [Nombre], vi los proyectos de integración industrial de [Empresa] con [Rockwell / Siemens].  
  > Somos un equipo de ingenieros venezolanos y construimos **Tridi Assembler** (`https://trytridi.com/#/assembler`), una plataforma web que lee planos P&ID de AutoCAD (`.dxf`) y genera automáticamente:  
  > 1. La memoria descriptiva y tabla de I/O bajo norma `ISA-5.1 / ISA-88` (`FDS`),  
  > 2. La simulación física 3D interactiva en el navegador para mostrarle la línea al cliente o probar fallas antes de ir a planta, y  
  > 3. El esqueleto de bloques modulares en texto plano para `Studio 5000 (.L5K)` o `TIA Portal (.scl)`.  
  > Estamos seleccionando 3 integradoras este mes para armarles sin costo el gemelo 3D y la documentación ISA de un plano `.dxf` que tengan activo y recibir su feedback de campo. ¿Tienes 10 minutos este jueves para mostrártelo en vivo?  
  > Un saludo,  
  > Juan Villa — CTO en Tridi (`https://trytridi.com/#/milestones`)

---

## 5. De Dónde Sacamos los Contactos Exactos (Directorios Abiertos)

No hay que adivinar correos ni comprar bases de datos basura. Estas 5 fuentes son públicas y gratuitas:

1. **Integradores Industriales con nombre y web:**
   - **CSIA Exchange (`controlsys.org/find-an-integrator`)**: Filtrar por México, Colombia, Chile, Argentina, España y EE.UU.
   - **Rockwell Automation Partner Locator** (como encontramos el perfil de ZAKA como *Bronze System Integrator*).
   - **Siemens Solution Partner Finder**.
2. **Laboratorios de Robótica con el hardware físico en la mano:**
   - Buscar en **GitHub** repositorios creados en los últimos 6 meses que contengan `unitree_g1`, `g1_description`, `mujoco_menagerie` o `lerobot`. En el `README` o en el commit siempre está el correo institucional (`.edu` / empresa) del investigador principal.
   - Buscar en **Google Scholar / ArXiv (2025–2026)** `"Unitree G1" OR "Unitree H1" "MuJoCo"` → el PDF del paper tiene en la página 1 los correos exactos de los autores que están programando el robot hoy.
3. **Startups de Robótica y Physical AI en Y Combinator:**
   - Nuestra propia tabla en [`yc/competidores.md`](../yc/competidores.md) ya tiene los 24 nombres filtrados (Asimov, Intelligence Factory, Human Archive, Cortex AI, Sensei, Hub, Datoric, Praxis, DeepReach, Proception, Piggy, OS3, Nori, etc.) y los nombres de sus founders para escribirles directo por LinkedIn o correo YC.
4. **Comunidades y Universidades en Venezuela:**
   - Contacto directo por Instagram/LinkedIn/WhatsApp con las directivas de los capítulos estudiantiles **IEEE RAS / Mecatrónica** (UNEXPO, USB, UCV, UCAB, ULA, UFT) y a través de **Luigi D'Aquaro** y el **Ing. José González (ZAKA)**.

---

## 6. Plan de Acción Inmediato (Cómo Arrancamos Esta Semana — Paso a Paso)

Para no abrumarnos queriendo hacer todo el mismo día, lo ejecutamos en este orden:

### Paso 1 (Días 1–2): Dejar Listos Nuestros Activos de Salida
1. **Alinear el perfil de LinkedIn de Tridi + nuestros 4 perfiles:**
   - Descripción clara de las **3 verticales** y enlace directo a `https://trytridi.com`.
   - Grabar **3 videos cortos de pantalla (25 s cada uno, en MP4 ligero)** listos para subir a LinkedIn, Reddit y Discord:
     - `Video 1`: El caso real de Luigi (`#/milestones` + `#/simulations/luigi_lab4`).
     - `Video 2`: De plano P&ID `.dxf` a Docs ISA + Celda Industrial 3D + código PLC (`#/assembler` → `#/simulations/factory_cell`).
     - `Video 3`: De video humano a `Unitree G1` caminando/corriendo/aguantando empujones en MuJoCo (`#/simulations` + `#/delivery`).

### Paso 2 (Días 2–4): Entrada en Comunidades de Venezuela y Foros Online
1. **Venezuela:** Enviar el mensaje de presentación ("Show & Ask" + ofrecimiento de armar el gemelo 3D gratis para sus robots/proyectos) a 5 comunidades/laboratorios de robótica y mecatrónica en Barquisimeto y Caracas.
2. **Online:** Publicar el primer post técnico en **Discord de LeRobot**, **Discord de Unitree** y **`r/PLC` / `r/robotics`** pidiendo feedback sobre el simulador web.

### Paso 3 (Días 4–7): Primera Ola de Outbound Directo (Meta: 30 Contactos Reales)
1. **10 mensajes/correos a Integradores Industriales** (Venezuela, México, Colombia) con el Guion 3 (ofreciendo procesar 1 plano `.dxf` gratis en 48h).
2. **10 correos a Laboratorios Universitarios con Unitree G1 / Rovers** con el Guion 1.
3. **10 mensajes a Founders de Startups de Datos / Robótica (YC)** con el Guion 2.

---

## 7. Métricas de Control Semanal (Sin Mentirnos)

Cada semana medimos solo 4 números reales:
1. **Mensajes / Correos directos enviados y posts en comunidades:** Meta = `30 contactos directos + 2 posts en comunidades/LinkedIn por semana`.
2. **Respuestas técnicas / Conversaciones abiertas:** Meta = `5 a 8 respuestas reales por semana`.
3. **Archivos reales recibidos de terceros (`.stl`, `.ino`, `.dxf` o videos de labs):** Meta = `2 a 3 casos nuevos metidos al simulador`.
4. **Pilotos / Reuniones de validación en vivo agendadas:** Meta = `2 llamadas por semana` (empezando con la 2.ª sesión con ZAKA y el primer lab externo).
