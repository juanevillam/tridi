# Manual de Claridad de Producto y Preparación — Reunión con Ing. José González (ZAKA, C.A.)

> **CONFIDENCIAL / USO INTERNO DEL EQUIPO (`juanevillam/tridi`)**  
> **Fecha:** 12 de noviembre de 2026  
> **Objetivo:** (1) Que Juan, Pastor, César y Ale dominen de punta a punta qué hace cada parte de Tridi hoy (sin puntos oscuros de UI o física) y (2) llegar afilados a la reunión con el **Ing. José González** de **ZAKA, C.A.** (`https://zakasys.com`).

---

## Parte 1: Con quién nos reunimos hoy — Radiografía de ZAKA, C.A. y el Ing. José González

### 1.1 Quién es él
- **Nombre y perfil:** **Ing. José González** (`jose.gonzalez@zakasys.com`), Ingeniero en Computación (UFT) y fundador/director de **ZAKA, C.A.** (papá de José Miguel, amigo de colegio de Ale).
- **Trayectoria:** Fundó ZAKA en **2004** en Calabozo (Guárico) y opera desde **dos sedes: Calabozo y Barquisimeto** (`+58-251-4154658`), atendiendo plantas de manufactura y procesos en toda Venezuela desde hace **22 años**.
- **Su filosofía (textual de su web):** *"La Industria 4.0 no empieza en la nube. Empieza en el piso de planta. No se puede optimizar lo que no se mide, ni medir lo que no está conectado."*

### 1.2 Qué hace exactamente ZAKA, C.A. (Su lenguaje técnico diario)
ZAKA es un **Integrador de Sistemas de Automatización Industrial** de primer nivel en Venezuela. Trabajan en los **Niveles 0, 1, 2 y 3 de la Pirámide de Automatización**:
- **Nivel 0 y 1 (Planta física, sensores y actuadores):** Instrumentación Endress+Hauser, visión artificial **Cognex**, neumática **Festo**, pesaje Rice Lake, variadores de frecuencia (`PowerFlex 525/700`, `Sinamics`), servomotores y *motion control* (`Kinetix`).
- **Nivel 2 (Control: PLC, SCADA, DCS):**
  - **Rockwell Automation (Allen-Bradley):** Son *Bronze System Integrator* oficial (`Studio 5000`, `RSLogix 5000`, `FactoryTalk View`, `PlantPAx`).
  - **Siemens:** Integran `TIA Portal`, `WinCC`, `Step 7` (S7-1200 / S7-1500) y `Sinamics`.
  - **AVEVA (Wonderware):** Son *Registered System Integrator* (`InTouch`, `System Platform`, `Historian`).
- **Nivel 3 (MES / OEE):** Monitoreo de eficiencia de línea (OEE), lotes bajo **ISA-88** y **líneas de llenado y empaque de fin de línea bajo estándar PackML (`ISA-TR88.00.02`)**.
- **Sus 2 industrias principales en Venezuela:**
  1. **Alimentos, Bebidas y Empaque** (consumo masivo: dosificación, llenado, etiquetado, empaque, paletizado, donde una parada o merma arruina el turno).
  2. **Petróleo, Gas, Química, Plástico y Cemento** (extrusoras, centros de control de motores CCM, retrofit de máquinas con controladores obsoletos).

> [!IMPORTANT]
> **Por qué la simulación de `Celda Industrial` (`#/simulations/factory_cell`) que armó Pastor es ORO PURO para esta reunión:**  
> El Sr. José vive literalmente de programar **PLCs Siemens (`TIA Portal` / `S7-1200`) y Rockwell (`Studio 5000`)** para **líneas de empaque bajo PackML** con cintas transportadoras, pistones neumáticos Festo, sensores ópticos y prensas selladoras. Cuando él vea en `trytridi.com/#/simulations/factory_cell` una línea de empaque en 3D con cinta + pistón + prensa donde comparamos un **PLC por timer fijo (que aplasta la caja cuando patina la cinta)** contra un **controlador validado en física MuJoCo con sensores ópticos (0 % merma)**, estamos hablando **100 % su idioma**.

---

## Parte 2: Claridad Interna — Qué es cada cosa en la Web y en el Motor de Tridi (Preguntas de Juan resueltas)

Para que todo el equipo explique el producto con total seguridad, aquí está la traducción exacta de qué hace cada pieza y qué acabamos de limpiar en la UI:

### 1. ¿Qué significaban "Lab 3", "Lab 4" y "Factory Cell"?
- **Origen del nombre:** Luigi D'Aquaro (nuestro primer caso real) tenía sus carpetas de código de sus robots numeradas como "Laboratorio 3" y "Laboratorio 4". Para alguien de afuera, leer "Lab 3" y "Lab 4" no decía nada.
- **Cómo quedó renombrado ahora en la UI para que cualquiera lo entienda al instante:**
  - **`Rover Luigi v1 (Sensores Fijos)` (`luigi_lab3`):** El primer robot físico de Luigi (chasis negro de 150 mm, 6 piezas `.stl`, Arduino UNO + puente H `L298N` + ultrasónico fijo `HC-SR04` + sensor infrarrojo `APDS-9960`). Es el que grabamos andando en el piso real en `#/milestones`.
  - **`Rover Luigi v2 (Radar Servo SG90)` (`luigi_lab4`):** La segunda versión mejorada del robot de Luigi (chasis naranja extendido de 180 mm, 7 piezas `.stl`), que suma un cuello móvil con servomotor `SG90` que barre el ultrasónico de izquierda a derecha mientras avanza sin frenar.
  - **`Celda Industrial (PLC S7-1200 / PackML)` (`factory_cell`):** La celda de empaquetado industrial de 3 ejes (cinta transportadora + pistón desviador neumático + prensa selladora vertical + 3 sensores ópticos) para demostrar cómo Tridi simula y valida líneas de fábrica.

### 2. ¿Qué es el selector "Política activa (cerebro ONNX)" (antes *"Robot trained with"*)?
- Cuando estás viendo el humanoide **Unitree G1**, ese menú te permite cambiarle el "cerebro" (el archivo `.onnx` que controla sus 29 motores en vivo):
  - **Grupo 1 (Progreso de equilibrio):** Muestra cómo evoluciona el robot desde `Sin entrenar` (0 pasos, se desploma al instante) pasando por `3 M`, `10 M`, `20 M`, hasta `300 M de pasos` (donde aguanta empujones de 250 N en 4 pisos distintos sin caerse). Es la misma escalera del capítulo *Gym* de la landing.
  - **Grupo 2 (`Imita este video`):** Es la política neuronal que aprendió a ejecutar **con física real y gravedad** el movimiento del video humano seleccionado en la galería (caminar, correr, saltar, bailar, sentarse).

### 3. ¿Por qué salían selectores de `100 M steps / 250 N / 4 worlds` en la caja de la derecha en cualquier simulación?
- **El problema que detectaste:** Esos selectores son para **configurar un entrenamiento nuevo** cuando tú grabas un movimiento con tu cámara (`#/live`) o subes un video propio (`#/upload`). Mostrarlos cuando estabas viendo un ejemplo precargado (que *ya* fue entrenado hace días) confundía porque parecía que cambiar ese selector iba a cambiar cómo se movía el robot en vivo.
- **Lo que corregimos hoy:** Ocultamos esos selectores en todos los ejemplos precargados. Ahora solo aparecen cuando seleccionas un clip grabado o subido por ti que está listo para enviarse a entrenar al servidor.

### 4. ¿Por qué salía "Empujar al robot" en la Celda Industrial o en el Rover, y la taza con agua en todos los mundos?
- **Lo que corregimos hoy en la UI:**
  1. **Botón `Empujar al robot`:** Ahora **solo aparece en el humanoide Unitree G1 cuando está con física activa**. Al cambiar a los Rovers de Luigi o a la Celda Industrial (o al poner "Sin física"), el botón desaparece.
  2. **Caja `Objetos, agarre y líquidos` (taza con agua / mano jabonosa):** Ahora **solo aparece cuando eliges el lugar `Cocina`** en el Unitree G1. Si estás en `Sin muebles` o en `Depósito`, no estorba.
  3. **Mundo `Vereda (Sidewalk)`:** Removido del selector de lugares en `#/simulations`. Quedan solo `Sin muebles`, `Cocina` y `Depósito`.
  4. **Selector `Persona y robot / Solo persona / Solo robot`:** Removido de `Playback`. En los movimientos humanos siempre se ven ambos lado a lado (`Persona y robot`).

### 5. ¿Por qué el robot se veía inclinado hacia adelante (*tilted*) en `#/delivery` (Descargas)?
- **Causa técnica:** Hace dos días enderezamos el torso del G1 en las simulaciones en vivo (`physics/src/sim.js` y `policy.js`), pero la pantalla `#/delivery` reproduce las grabaciones guardadas (`data/deliveries/*/replay.json`), que se habían grabado con la versión anterior donde la pelvis y la cintura (`waist_pitch_joint`, índice 21) llevaban ~26° de inclinación hacia adelante.
- **Solución aplicada hoy:** Ajustamos `poseAt()` en `web/src/screens/delivery.js` para amortiguar la inclinación hacia adelante de la pelvis y la cintura en todos los cuadros donde el robot camina erguido (conservando intacta la física cuando el episodio termina en caída en los últimos `0,35 s`), y reforzamos el sesgo vertical de cintura en `physics/src/policy.js`.

---

## Parte 3: Qué dijo Elon Musk sobre Optimus y cómo se conecta con Tridi y con el Sr. José

En la transcripción que sacamos de Elon Musk con Dwarkesh Patel ([`yc/investigacion/voces/2026-02-elon-musk-optimus.md`](../../yc/investigacion/voces/2026-02-elon-musk-optimus.md)), Elon dejó **4 verdades de la industria** que respaldan exactamente lo que estamos haciendo:

1. **"Photons in, controls out" (Comprimir video y sensores en comandos de motor a 50 Hz):**  
   Elon explica que toda la IA física consiste en comprimir entradas de sensores/video en pocos kilobytes por segundo de comandos hacia los actuadores. Eso es literalmente lo que entrega Tridi: una política `.onnx` de `150–500 KB` (o código C nativo de `2 KB`) que corre a **50 Hz**.
2. **El cuello de botella no es el hardware de catálogo, es el Sim-to-Real:**  
   Dwarkesh le pregunta cómo entrenan sin tener millones de robots en la calle. Elon responde que necesitan un **"generador de realidad físicamente preciso" (simulación física)** combinado con robots reales para **cerrar la brecha *Sim-to-Real*** (fricción real, desgaste, zonas muertas de motores, latencia de sensores).
   - **Cómo aplica a Tridi:** Tesla puede construir 30.000 robots para su "Optimus Academy". Una planta en Venezuela o un integrador como ZAKA no. Tridi es ese **motor de simulación física + calibración Sim-to-Real** accesible para cualquier máquina, rover o celda industrial.
3. **Dónde empiezan a dar dinero los robots: Operaciones continuas 24/7 en piso de planta:**  
   Cuando le preguntan dónde se van a usar primero, Elon dice sin dudar: *"The best use for robots in the beginning will be any continuous operation, 24 by 7, in factories."*
4. **Arquitectura en 2 capas (Supervisión arriba, Control determinista abajo):**  
   Arriba hay un planificador/supervisor (SCADA/MES en una planta, o un modelo grande), y abajo hay un **controlador cerrado de baja latencia** que no puede fallar ni bloquearse.

---

## Parte 4: Guion y Estructura para la Reunión de Mañana con el Ing. José González (ZAKA)

> [!TIP]
> **Actitud clave para la reunión:**  
> El Sr. José tiene 22 años metido en piso de planta en Venezuela. **No vayamos a "darle clases de cómo funciona una fábrica"** ni a venderle humo de humanoides de ciencia ficción. Vayamos con **humildad, curiosidad genuina por lo que hace ZAKA, y demos técnicas concretas** (el caso real de Luigi + la Celda Industrial en MuJoCo). A los ingenieros veteranos les encanta cuando un equipo joven les muestra código y física real que funciona y les pide consejo de campo.

### Bloque 1 — Romper el hielo y el Pitch de Tridi en 45 segundos (Ale + Juan/Pastor)
**Cómo explicarle qué es Tridi en lenguaje de Ingeniero en Computación / Automatización:**
> *"Sr. José, qué gusto conocerlo. Le contamos rápido qué es Tridi: nacimos hace tres semanas en la Platanus Hack en Caracas y estamos aplicando a Y Combinator.  
> En una frase: **Tridi es una plataforma de simulación física (sobre MuJoCo) y entrenamiento de controladores para máquinas y robots.**  
> Empezamos convirtiendo videos de personas en movimientos físicamente válidos para robots humanoides (que es hacia donde va el mundo con NVIDIA y Tesla), pero al volver a Barquisimeto nos dimos cuenta de que el mismo motor de física resuelve un problema que pasa hoy mismo en máquinas reales: **la brecha entre el código que uno programa en el escritorio y lo que pasa cuando la máquina enfrenta fricción real, sensores con ruido o retardos en el piso de planta.**"*

### Bloque 2 — Escucharlo a él primero: Las preguntas para el Sr. José
Antes de abrir todas las pantallas, hacerle estas preguntas para entender dónde le duele a él y a sus clientes:
1. **Sobre ZAKA y las plantas hoy:** *"Estuvimos viendo la web de ZAKA —vimos que integran Rockwell, Siemens y AVEVA en alimentos, bebidas, empaque (PackML) y petróleo/gas—. Hoy en día, en las plantas que atienden desde Barquisimeto y Calabozo, ¿cuáles son los proyectos que más les piden? ¿Modernización/retrofit de líneas viejas, líneas de empaque, o supervisión SCADA/MES?"*
2. **Sobre pruebas y puesta en marcha (*Commissioning*):** *"Cuando ustedes diseñan o modernizan la lógica de control de una línea (en `Studio 5000` o `TIA Portal`), ¿cómo la prueban antes de ir a la ventana de parada de la planta? ¿Usan algún simulador o gemelo digital hoy, o casi todo se termina ajustando en vivo en el piso de planta?"*
3. **Sobre fallas físicas recurrentes:** *"En líneas de empaque o transporte (cintas, llenadoras, selladoras, brazos o servomotores Kinetix), ¿cuáles son los dolores de cabeza más comunes que causan mermas o paradas no programadas? ¿Desincronización cuando patina una banda, sensores sucios, desgaste mecánico?"*
4. **Sobre robótica en Venezuela:** *"¿Se han topado ya con brazos robóticos, paletizadores o carros autónomos (AGV/AMR) en las plantas que visitan, o todavía todo es PLC + neumática + servomotores?"*

### Bloque 3 — Cómo nació y cómo le dimos la vuelta con el robot de Luigi (Mostrar `#/milestones`)
Abrir **`https://trytridi.com/#/milestones`** (o `http://localhost:5173/?lang=es#/milestones`):
1. **Mostrar primero el tab `01 · Origen en Platanus Hack 26` (30 seg):**
   - *"En Caracas armamos el pipeline completo para humanoides (Unitree G1 de 29 motores): de un video común sacamos el esqueleto 3D, lo pasamos al robot y entrenamos una red neuronal en MuJoCo para que camine y resista empujones de 250 N sin caerse."*
2. **Pasar al tab `02 · Caso Real Sim-to-Real` (El caso de Luigi D'Aquaro — 2 min):**
   - *"Al regresar dijimos: probemos esto con hardware real que tengamos en la mano. Un colega (Luigi D'Aquaro) tenía este robot explorador impreso en 3D con Arduino UNO, puente H L298N, ultrasónico HC-SR04 y sensor óptico APDS-9960."*
   - **Explicar los 3 fallos reales que cualquier ingeniero industrial reconoce al instante:**
     1. **Fricción y zona muerta mecánica:** En el código en vacío las ruedas giraban, pero en el piso real las llantas de TPU no vencían la fricción estática con `PWM < 115`.
     2. **Código bloqueante (`pulseIn` y `delay`):** Cada vez que el ultrasónico no veía eco, `pulseIn()` congelaba el microcontrolador por **47,1 ms**; el robot avanzaba ciego y chocaba.
     3. **Falla de registro de sensor (`Chip ID 0x9E`):** El sensor óptico era un lote alternativo y la librería estándar lo apagaba al iniciar.
   - **Qué hizo Tridi:** *"Metimos sus piezas CAD `.stl` en nuestro simulador MuJoCo, entrenamos una política cerrada a **50 Hz**, y nuestro compilador (`export_mcu.py`) generó automáticamente el firmware nativo en C para su Arduino (ocupando solo 461 bytes de RAM, con interrupciones por hardware no bloqueantes). Y ahí está el video del robot real esquivando cajas en el piso a la primera."*

### Bloque 4 — Demo en vivo en `#/simulations`: Del Rover a la Celda Industrial (El gancho para ZAKA)
Abrir **`http://localhost:5173/?lang=es#/simulations/factory_cell`**:
1. **Mostrar la `Celda Industrial (PLC S7-1200 / PackML)`:**
   - *"Pensando en líneas de empaque como las que ustedes integran bajo PackML, armamos esta celda en MuJoCo: una cinta transportadora, un pistón desviador y una prensa selladora con 3 barreras ópticas (Entrada, Sellado, Salida)."*
   - **Hacer clic en el botón `⚠️ Simular PLC ciego por timer`:**
     - *"Mire lo que pasa cuando una línea depende de timers fijos y la cinta patina un poco por fricción o desgaste: la caja llega tarde y la prensa baja a destiempo y aplasta el producto (merma)."*
   - **Hacer clic en `✅ Volver a Política Tridi Sensor-Gated (0 % merma)`:**
     - *"Con la política validada en física en Tridi, el controlador espera la confirmación física de los sensores y compensa el deslizamiento con 0 % de cajas aplastadas."*
2. **Cambiar con un clic al tab `Rover Luigi v2 (Radar Servo SG90)`:**
   - Mostrar cómo el mismo motor simula el barrido del radar en tiempo real a 50 Hz.

### Bloque 5 — A dónde apunta Tridi y qué le pedimos al Sr. José (Próximos pasos reales)
No vamos a pedirle que nos compre algo mañana; vamos a pedirle **validación industrial y acceso a un caso real**:
1. **Hacia dónde vamos (`Tridi Assembler`):**
   - *"Estamos construyendo el `Tridi Assembler`: que un ingeniero pueda subir el CAD de su máquina o celda (`.stl`/`.step`) y su lógica actual, simularla con física real en el navegador (metiéndole fricción, patinaje de banda, ruido de sensores), y descargar el controlador validado."*
2. **Las 2 preguntas de cierre para él (El "Ask"):**
   - **Pregunta A (Consejo de veterano):** *"Viendo lo que ya tenemos funcionando hoy, desde su experiencia de 20 años en plantas de alimentos y empaque: ¿dónde ve usted que un gemelo físico como este ahorraría más plata o tiempo hoy? ¿En probar la lógica antes de ir a planta (virtual commissioning), en optimizar tiempos de ciclo/merma en empaque, o en retrofit de máquinas viejas?"*
   - **Pregunta B (Caso piloto en Barquisimeto):** *"Nuestro objetivo este mes (mientras estamos en el proceso de Y Combinator) es documentar nuestro primer caso real en una máquina o celda industrial de verdad aquí en Barquisimeto, igual que hicimos con el robot de Luigi, sin costo para la planta. ¿Habrá alguna maqueta de pruebas en la oficina de ZAKA en Barquisimeto, o algún equipo/línea sencilla de un cliente amigo donde podamos ir un día a tomar medidas, armarle el gemelo en MuJoCo y probarlo con ustedes?"*

---

## Parte 5: Reglas de Oro de Ale — Qué NO Hacer y Cómo Posicionarnos ("Aliados y Generación de Relevo, Cero Competencia")

> [!CAUTION]
> **Instrucción crítica de José Alejandro Hernández (Ale):**  
> El Ing. José González es el papá de José Miguel (amigo de colegio de Ale), es una gran persona con Ale, pero **nunca han hablado de trabajo**. El riesgo #1 que debemos evitar a toda costa es que sienta que 4 chamos con IA vienen a decirle que "lo que hace ZAKA está viejo" o que somos competencia de su integradora.  
> **El posicionamiento exacto:** Nosotros **NO somos una integradora industrial ni montamos tableros ni vendemos servicios de planta**. Nosotros construimos **herramientas de software y simulación física** para que integradores como ZAKA —y la nueva generación de ingenieros— hagan pruebas virtuales, entrenen máquinas y ahorren horas en planta. Queremos que nos vea como **aliados tecnológicos y como su generación de relevo en ingeniería**.

### ❌ Qué NO Hacer ni Decir mañana (Prohibido en la reunión)
1. **NO decir que "la IA va a reemplazar a los PLCs o a los ingenieros de automatización".**  
   - *Por qué:* El negocio de ZAKA es programar PLCs Rockwell/Siemens, armar tableros CCM y levantar redes en planta. Si decimos "reemplazamos al PLC", nos ve como amenaza o como novatos que no conocen una fábrica real.
   - *Qué decir en su lugar:* *"El PLC (`S7-1200/1500` o `ControlLogix`) y las seguridades en planta son sagrados e irremplazables. Lo que hace Tridi es ser el **banco de pruebas físico en computadora (gemelo digital)** antes de ir a la planta, o darle una mano a los ingenieros cuando hay que calibrar tiempos, fricciones o máquinas nuevas."*
2. **NO presentar el botón `⚠️ Simular PLC ciego por timer` como "miren cómo fallan los PLCs".**  
   - *Por qué:* Si suena a que estamos criticando cómo se programa un PLC, puede sonar arrogante frente a alguien con 22 años programando `Studio 5000` y `TIA Portal`.
   - *Qué decir en su lugar:* *"Hicimos esta simulación sencilla para entender nosotros mismos la diferencia entre programar por tiempos fijos (como suele hacer alguien que está empezando) versus un lazo cerrado bien sincronizado por fotoceldas como hacen ustedes en PackML cuando una banda patina."*
3. **NO venderle nada ni hablar de precios/facturación a ZAKA.**  
   - *Por qué:* Es la primera vez que Ale habla de temas profesionales con él. Ir con tono de vendedor rompe la confianza personal.
   - *Qué hacer en su lugar:* Ir 100 % en modo **aprendices + aliados técnicos**: pedirle su consejo de veterano, mostrarle con humildad lo que armamos en 3 semanas (Platanus Hack + el rover de Luigi) y preguntarle cómo podemos **sumarle valor a ZAKA** como brazo de software/simulación.
4. **NO hablar en jerga cerrada de Machine Learning (`PPO`, `clip_fail_ema`, `domain randomization`, `reward shaping`) sin traducirlo a planta.**  
   - *Qué decir en su lugar:* Hablar en su idioma: **gemelo digital, simulación de fricción y desgaste, pruebas antes de la ventana de parada (*virtual commissioning*), tiempos de ciclo, cero merma y código determinista sin bloqueos**.
5. **NO acaparar la palabra ni interrumpirlo cuando cuente historias de planta.**  
   - Cuando un ingeniero senior cuenta cómo resolvió un problema en una planta de alimentos o petróleo, **esa información vale oro**. Dejarlo hablar, anotar todo y hacerle preguntas sobre sus proyectos.

### ✅ Cómo lograr que nos vea como Aliados y su "Generación de Relevo"
- **Frase llave para abrir (Ale / equipo):**  
  > *"Sr. José, nosotros somos de la generación que creció programando software e inteligencia artificial, pero sabemos que **la industria real se mueve en el piso de planta**, como dice la propia página de ZAKA. Por eso queríamos sentarnos con usted: no queremos quedarnos haciendo software en la nube desconectado de la realidad; queremos aprender de quienes llevan 20 años manteniendo las plantas del país andando y poner nuestra tecnología al servicio de integradores como ZAKA."*
- **Por qué somos el aliado perfecto para ZAKA:**
  - ZAKA tiene lo más difícil de construir: **22 años de reputación, acceso a las plantas más grandes, certificaciones de Rockwell/Siemens/AVEVA y conocimiento de campo**.
  - Tridi tiene lo que a cualquier empresa tradicional le cuesta meses investigar por falta de tiempo: **un equipo joven 24/7 dedicado a simulación física 3D (MuJoCo), visión por computadora e IA aplicada a control**.
  - Si ZAKA algún día quiere mostrarle a un cliente un **gemelo digital 3D interactivo de su línea** o probar una modernización antes de parar la planta, nosotros somos su equipo aliado de casa.

---

## Parte 6: Cómo se reparte el equipo mañana en la reunión

| Quién | Rol en la reunión con el Sr. José |
| :--- | :--- |
| **Ale** | Abre la conversación desde la confianza personal y el respeto (posición de "generación de relevo que viene a pedir consejo"), presenta al equipo, guía las preguntas de negocio/industria y cierra abriendo la puerta a colaborar como aliados de ZAKA. |
| **Juan** | Explica la visión producto/software con humildad ("de video y CAD a un simulador físico y código sin bloqueos"), muestra la web (`trytridi.com`), cuenta la historia real de lo que pasó en la reunión con Luigi y cómo lo resolvimos en equipo. |
| **Pastor** | Explica el motor físico en MuJoCo, muestra la **Celda Industrial (`factory_cell`)** pidiéndole feedback de experto en PackML (*"¿cómo ve usted esto desde su experiencia en planta?"*) y muestra el **Rover v2 (`luigi_lab4`)**. |
| **César** | Apoya en la demostración en vivo de la interfaz, la pantalla de entrega de datos/telemetría (`#/delivery`) y cómo estamos diseñando el `Tridi Assembler` para que sea una herramienta útil para ingenieros de planta. |

---

## Parte 7: Cruce Técnico Profundo (Juan + Pastor) — Los 8 Servicios de ZAKA vs. Lo que Proyecta Tridi

Además de las 3 hipótesis de Pastor (ventanas de parada, merma en PackML e IA vs. PLC), al cruzar el catálogo técnico completo de ZAKA (`zakasys.com/servicios/` y `zakasys.com/clientes/`) con lo que ya tenemos en el repositorio (`training/export_mcu.py`, `physics/src/assembler.js`, captura de video + manos, y telemetría en `#/delivery`), salen **4 ángulos adicionales** donde Tridi encaja con el negocio real de ZAKA:

| Qué hace hoy ZAKA en planta | Qué proyecta Tridi | La pregunta de validación para el Sr. José |
| :--- | :--- | :--- |
| **1. Servicio 06 · Retrofit y Servicio 05 · Migración de controladores obsoletos** (extrusoras de plástico, empaquetadoras viejas sin planos ni fabricante original). | **`Tridi Assembler` + Ingeniería inversa física:** Tomar una máquina vieja a la que le van a cambiar el PLC o los variadores (`PowerFlex 525` / `Sinamics`), medir sus piezas/tiempos, simularla en MuJoCo y entregar los parámetros óptimos de rampa, aceleración y sensores antes de energizar el tablero nuevo. | *"En los proyectos de **Retrofit** (como extrusoras o empaquetadoras viejas donde la mecánica ya tiene juego y desgaste), ¿cómo calculan hoy las nuevas rampas de variadores y tiempos del PLC sin arriesgarse a romper algo en el arranque?"* |
| **2. Cambios de formato parametrizados desde HMI (Alimentos y Bebidas)** (pasar de envase de 250 g a 1 kg en la misma línea PackML sin reprogramar desde cero). | **Simulación multi-escenario (Domain Randomization):** Igual que entrenamos al robot para caminar con distintos pesos (`mass_scale`), fricciones (`friction`) y motores (`motor_scale`) en la matriz 4×8 de `#/delivery`, Tridi puede simular la misma línea con 10 tamaños/pesos de envase distintos y exportar la **tabla de recetas (ISA-88 / PackML)** pre-calibrada para el HMI (`FactoryTalk View` / `WinCC`). | *"En su web mencionan los **cambios de formato parametrizados desde HMI** en líneas de alimentos. Cuando una planta mete un envase nuevo o cambia el material del empaque, ¿cuánto tardan hoy en encontrar la receta de velocidades y tiempos que no trabe la línea?"* |
| **3. Nivel 2 estricto: Un PLC industrial no corre redes `.onnx` cajas negras, corre Escalera (`Ladder`) o Texto Estructurado (`SCL` / `ST` IEC 61131-3).** | **Evolución de `export_mcu.py` (`J-3`):** Nuestro compilador ya traduce una política entrenada en MuJoCo a C99 puro y determinista con paridad $< 10^{-5}$. El siguiente paso natural para industria es un exportador **`ONNX / MuJoCo → Structured Text (IEC 61131-3)`** para importar como bloque de función (`AOI` en Rockwell Studio 5000 o `FB` en Siemens TIA Portal). | *"Sabemos que ningún jefe de planta va a meter una 'caja negra' de IA directo a gobernar una caldera o una prensa. Pero si nuestro simulador entrena en física y les exporta un bloque en **Texto Estructurado (ST) o tablas de parámetros deterministas** para `Studio 5000` o `TIA Portal`, ¿eso sí entraría limpio en su flujo de trabajo?"* |
| **4. "Procesos que dependen del criterio del operador de turno, sin registro" + Visión Cognex** (el problema #1 que ZAKA declara en su Servicio 01). | **Tridi Capture (Video → Estandarización operativa e inspección):** Nuestro pipeline de video (`data/` + esqueleto 3D y manos) nació para humanoides, pero en una planta venezolana hoy mismo sirve para **medir tiempos de ciclo manuales en fin de línea** (empaque manual, paletizado, cuellos de botella de operarios) usando cámaras normales, sin comprar hardware costoso. | *"En su página de Automatización de Planta ustedes dicen que el problema principal son las **maniobras manuales que dependen del operador de turno**. ¿En qué partes de las plantas acá en Barquisimeto sigue habiendo mucho trabajo manual repetitivo (final de línea, encajonado, inspección) donde medir con cámara el movimiento del operario o automatizar con un brazo tenga retorno rápido?"* |

