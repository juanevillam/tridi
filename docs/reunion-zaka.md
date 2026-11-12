# Preparación de Reunión Industrial — Ing. José González (ZAKA, C.A.)

> **Fecha:** 12 de noviembre de 2026 · Barquisimeto  
> **Con quién:** **Ing. José González** (Fundador y Director de **ZAKA, C.A.**, [`zakasys.com`](https://zakasys.com), Ingeniero en Computación UFT, papá de José Miguel, amigo de colegio de Ale).  
> **Objetivo real de la reunión:** **No ir a venderle nada.** Ir como aliados y generación de relevo a mostrarle en 2 minutos lo que construimos y hacerle preguntas de validación dura a alguien con 22 años metido en las plantas de Venezuela.

---

## 1. Quién es ZAKA, C.A. y en qué mundo se mueven

- **22 años en piso de planta (desde 2004):** Empezaron en Calabozo (Guárico) y operan desde **Calabozo y Barquisimeto**. Su filosofía escrita en su web es: *"La Industria 4.0 no empieza en la nube. Empieza en el piso de planta. No se puede optimizar lo que no se mide, ni medir lo que no está conectado."*
- **Su promesa principal como empresa:** **"Modernizar líneas sin detener la planta, trabajando en ventanas de parada reales."**
- **Las tecnologías que usan todos los días:**
  - **Rockwell Automation (Allen-Bradley):** Son *Bronze System Integrator* oficial (`Studio 5000`, `ControlLogix`, `CompactLogix`, `FactoryTalk View`, variadores `PowerFlex 525/700`, servos `Kinetix`).
  - **Siemens:** Integran `TIA Portal`, `S7-1200 / S7-1500`, `WinCC` y variadores `Sinamics`.
  - **AVEVA (Wonderware):** Son *Registered System Integrator* (`InTouch`, `System Platform`, `Historian`).
  - **Instrumentación y campo:** Sensores Endress+Hauser, visión artificial **Cognex**, neumática **Festo** y pesaje Rice Lake.
- **Sus 2 verticales fuertes en Venezuela:**
  1. **Alimentos, Bebidas y Empaque:** Dosificación por lotes (**ISA-88**) y líneas de envasado, empaquetadoras y fin de línea bajo el estándar industrial **PackML** (`ISA-TR88.00.02`), con cambios de formato parametrizados desde el HMI.
  2. **Petróleo, Gas, Plásticos y Cemento:** Retrofits de maquinaria pesada (ej. extrusoras con controladores obsoletos sin planos originales), migración de PLCs viejos y tableros de control de motores (CCM).

---

## 1.5 Diccionario Rápido de Planta para Todo el Equipo (Traducido a lo que ya construimos en Tridi) + Videos

Para que todo el equipo (**Ale, Pastor, Juan y César**) vaya con la película clara hoy: **el 90 % de los conceptos de automatización industrial son equivalentes directos de lo que ya programamos en Tridi**, solo que en planta tienen otros nombres.

### A. Traducción directa: de nuestro código al lenguaje del Sr. José

| Concepto en Planta (ZAKA) | Qué es en sencillo (Nuestro mundo en Tridi) | Cómo lo resuelve lo que ya construimos |
| --- | --- | --- |
| **PLC (`Siemens S7-1200/1500`, `Rockwell CompactLogix`)** | Es literalmente un **microcontrolador industrial blindado a 24 V** montado en un gabinete que corre un ciclo fijo (`scan time` de `5–20 ms`) leyendo sensores (`true/false`) y activando motores o válvulas neumáticas. | Nuestro compilador [`training/export_mcu.py`](../training/export_mcu.py) ya genera lazos de control deterministas de `20 ms` (`50 Hz`) sin bloqueos ni memoria dinámica. |
| **Texto Estructurado (`SCL` / `ST` — `IEC 61131-3`) y Bloques `AOI` / `FB`** | Es el lenguaje moderno de programación de PLCs. En vez de diagramas eléctricos viejos (*Ladder*), es código idéntico a TypeScript/C (`IF sensor THEN motor := 50.0; END_IF;`) empaquetado como una función reutilizable (`FB` en Siemens / `AOI` en Rockwell). | En vez de exportar solo `.h` de C para Arduino, el compilador de Tridi exporta un bloque `.scl` auditable que los ingenieros de ZAKA pegan en `TIA Portal` o `Studio 5000`. |
| **Variador de Frecuencia (`VFD` — `PowerFlex` / `Sinamics`) y Rampas** | En el robot de Luigi usamos un puente H (`L298N`) con `PWM` (`0..255`) para regular motores DC. En fábrica los motores son trifásicos AC grandes, y el **VFD** regula su velocidad subiendo o bajando la frecuencia eléctrica (`0 Hz` a `60 Hz`). La **rampa (`Accel / Decel Time`)** son los segundos que tarda en subir de `0` a `50 Hz` para no partir ejes viejos ni patinar la banda por un tirón brusco. | En MuJoCo modelamos la masa real, fricción y juego mecánico de la máquina, probamos distintas rampas (`0,24 s`, `0,35 s`, `0,52 s`) y entregamos el número exacto antes de energizar el motor en planta. |
| **HMI (`FactoryTalk View` / `WinCC` / `InTouch`) y "Recetas de Formato" (`ISA-88` / `PackML`)** | El **HMI** es la pantalla táctil pegada al tablero de la máquina donde el operador elige qué producto va a correr hoy (`Formato 250 g`, `500 g` o `1 kg`). La **receta** es la tabla de números (`Hz` de cinta, `mm` de pistón, `ms` de prensa) que se le envía al PLC al cambiar de envase. | Igual que en [`trytridi.com/#/delivery`](https://trytridi.com/#/delivery) probamos 32 episodios variando masa y fricción, en [`trytridi.com/#/simulations/factory_cell`](https://trytridi.com/#/simulations/factory_cell) simulamos cada formato de envase y exportamos la tabla de recetas pre-calibrada sin gastar horas ni aplastar cajas a ojo en la planta. |
| ***Virtual Commissioning* (Puesta en marcha virtual)** | Es probar el programa del PLC contra el modelo 3D de la máquina en la computadora **antes** del domingo de parada de planta. | En lugar de usar software corporativo de USD 30.000+ que requiere estaciones pesadas, Tridi levanta el gemelo físico en MuJoCo directo en el navegador a partir de los `.STL` y prueba casos extremos (patinaje de banda, fricción, sensores con retardo). |

### B. 5 Videos Cortos en YouTube (para ver a `1.5×` antes de la reunión)

1. **Cómo se ve un simulador 3D conectado a un PLC real (Factory I/O + Siemens TIA Portal):**
   - 🎥 [Simulación 3D con Factory I/O y TIA Portal (español)](https://www.youtube.com/watch?v=fOZVj-tRITw)
   - 🎥 [Ejemplo práctico de banda transportadora 3D + sensores + PLC](https://www.youtube.com/watch?v=NO9WiTH9PLk)
   - *Por qué verlo:* Muestra exactamente una cinta con fotoceldas y pistones como nuestro `factory_cell`. La diferencia clave es que los simuladores clásicos de PLC son casi "cinemáticos" (cajas ideales), mientras que **MuJoCo en Tridi simula física de contacto real, patinaje, fricción variable e inercia en la web**.
2. **Qué es un Variador de Frecuencia (VFD) y por qué importan las rampas de aceleración:**
   - 🎥 [Variadores de Frecuencia explicados fácilmente](https://www.youtube.com/watch?v=Ry10hneiET4)
   - 🎥 [Rampas de aceleración y desaceleración en un variador](https://www.youtube.com/watch?v=Ul_O3oaz3cw)
   - *Por qué verlo:* En los primeros 3 minutos queda clarísimo qué son los `Hz` y los segundos de rampa (`0,24 s`, `0,35 s`, `0,52 s`) que calculamos en `factory_cell`.
3. **Qué es *Virtual Commissioning* con CAD mecánico real (Siemens NX MCD + PLC):**
   - 🎥 [Virtual Commissioning: CAD 3D + PLC Simulation](https://www.youtube.com/watch?v=ZvrE2IfrfgI)
   - *Por qué verlo:* Muestra cómo la gran industria conecta el CAD 3D con el PLC para validar una máquina antes de fabricarla o modernizarla.

> **Actitud clave para todo el equipo:** Ninguno de nosotros tiene que fingir que lleva 20 años programando PLCs Siemens — ese es el orgullo y el terreno del Sr. José. Nuestra fortaleza frente a él es: *"Sr. José, nosotros dominamos el motor de física 3D (`MuJoCo`), visión e IA; queremos que usted nos diga cómo le entregamos esos parámetros, tablas de recetas o bloques de código para que a los ingenieros de ZAKA les ahorre horas reales en planta."*

---

## 2. Nuestra Postura: Aliados y Generación de Relevo (Cero Competencia)

> [!IMPORTANT]
> **Regla de oro del equipo (Ale + Pastor + Juan + César):**  
> El Sr. José recibe a Ale con muchísimo cariño personal, pero nunca han hablado de trabajo. El peor error sería sonar a que "4 chamos con IA vienen a reemplazar los PLCs o a quitarle chamba a ZAKA".  
> **La postura exacta:**
> - **Quien diseña, vende y monta la automatización en la planta es ZAKA.** Ellos tienen 22 años de reputación, certificaciones y acceso a las plantas.
> - **Qué es Tridi para ZAKA:** Nosotros no montamos tableros ni vendemos servicios de planta. Somos un equipo joven dedicado a **simulación física 3D (`MuJoCo`) e IA aplicada a control**, que busca ser el **aliado de software de ZAKA** (su banco de pruebas virtual / gemelo digital antes de ir a la parada de planta).

### Qué NO hacer en la reunión
1. **Jamás decir que Tridi "automatiza las maniobras manuales del operador" por su cuenta.** Ese es el negocio de ZAKA. Si una planta necesita automatizar una línea, la automatiza ZAKA; Tridi es el simulador 3D para los ingenieros de ZAKA.
2. **Jamás decir que "la IA reemplaza al PLC"** ni presentar el botón de falla de la celda industrial como "miren cómo fallan los PLCs". En una planta real, el PLC (`Rockwell` / `Siemens`) y las seguridades eléctricas son sagrados.
3. **No hablar en jerga académica de IA (`PPO`, `domain randomization`, `reward`).** Hablar en idioma de planta: **gemelo físico, simulación de fricción y patinaje, pruebas antes de la ventana de parada (*virtual commissioning*), recetas de formato y cero merma**.

### Cómo entra aquí la tesis de Elon Musk (Optimus y fábricas, feb 2026)
En la entrevista que transcribimos ([`yc/investigacion/voces/2026-02-elon-musk-optimus.md`](../yc/investigacion/voces/2026-02-elon-musk-optimus.md)), Elon resume el problema real de la robótica física hoy en dos puntos que conectan directo con el Sr. José:
- **El cuello de botella ya no es el hardware, es el *Sim-to-Real*:** Una cosa es el código en vacío y otra muy distinta cuando el motor enfrenta fricción real, desgaste mecánico, cajas que resbalan o sensores con retardo. Para resolverlo sin romper equipos en vivo hace falta un **simulador físicamente exacto**.
- **Dónde da retorno primero:** En **operaciones continuas 24/7 dentro de fábricas**, donde cada minuto de parada o cada caja aplastada cuesta plata real.

---

## 3. Cómo Abrir la Conversación y Qué Mostrar en Pantalla (3 minutos)

### Paso 1 — El Pitch corto de Tridi y la historia de Luigi (1 min)
- **Cómo contarlo:**
  > *"Sr. José, Tridi nació hace tres semanas en la Platanus Hack en Caracas y con esto aplicamos a Y Combinator. Empezamos convirtiendo videos en movimientos físicos para robots humanoides en MuJoCo. Pero al volver a Barquisimeto quisimos probar el mismo motor de física con hardware real que tuviéramos en la mano, y nos sentamos con Luigi D'Aquaro y su robot explorador."*
- **Mostrar en pantalla [`trytridi.com/#/milestones`](https://trytridi.com/#/milestones) y [`#/simulations/luigi_lab4`](https://trytridi.com/#/simulations/luigi_lab4):**
  - Mostrar cómo agarramos las piezas CAD (`.stl`) y el código Arduino de su robot, armamos su gemelo físico en MuJoCo y destapamos los 3 problemas reales por los que chocaba en el piso:
    1. **Fricción real:** Las llantas de TPU tenían zona muerta y no se movían con `PWM < 115`.
    2. **Bloqueo de código:** `pulseIn()` en el sensor ultrasónico congelaba el procesador por **`47,1 ms`** cuando no había eco.
    3. **Sensor apagado en silencio:** El sensor óptico era un lote alternativo (`Chip ID 0x9E`) y la librería oficial lo rechazaba.
  - Con el simulador y nuestro compilador a C (`50 Hz`, sin bloqueos), el robot físico salió andando y esquivando todo en la sala a la primera.

### Paso 2 — La Línea Industrial de 4 Estaciones en MuJoCo (2 min)
- **Mostrar en pantalla [`trytridi.com/#/simulations/factory_cell`](https://trytridi.com/#/simulations/factory_cell):**
  - Construimos una línea **PackML / ISA-88 de 4 estaciones** inspirada directamente en el catálogo de integraciones de ZAKA:
    1. **Estación 1 — Dosificación y Pesaje Dinámico (`PE-01` en `x = -0,38 m`):** Tolva de entrada inoxidable, plataforma de celda de carga tipo *Rice Lake* y primera barrera fotocelda emisora/receptora.
    2. **Estación 2 — Alineación Neumática y Visión (`x = -0,08 m`):** Cilindro neumático lateral tipo *Festo* con manifold y cámara cenital tipo *Cognex In-Sight* con anillo de iluminación.
    3. **Estación 3 — Prensa Termoselladora / Tapadora + Torre Andon (`PE-02` en `x = +0,10 m`):** Pórtico industrial con actuador vertical, semáforo de estado `PackML` (`Verde / Ámbar / Rojo`) y barrera óptica de confirmación de posición antes del descenso.
    4. **Estación 4 — Rampa de Descarga, Paletizado y Gabinete NEMA 12 (`PE-03` en `x = +0,52..1,18 m`):** Rampa de salida hacia Euro-Palet con lotes apilados y tablero de control lateral (`PLC Rockwell / Siemens` + variador `VFD` + pantalla `HMI` + paro de emergencia).
  - **Qué demostrar en vivo con los botones del panel derecho:**
    - **Cambio de Formato HMI (`250 g` / `500 g` / `1 kg`):** Al cambiar el formato en pantalla, cambia la geometría e inercia de la caja en 3D y el simulador escupe al instante la **receta pre-calibrada para el PLC** (`VFD Hz`, `Rampa de aceleración en s`, `Carrera de pistón en mm`, `Profundidad de prensa en mm` y `Tiempo de sellado Dwell en ms`).
    - **Stress-Test de Patinaje de Banda (`28 %` de desgaste mecánico):** Mostrar cómo un programa de PLC por timer fijo aplasta el envase cuando la banda patina, mientras que el lazo cerrado validado en MuJoCo compensa el retardo esperando la confirmación física de `PE-02` (`0 %` de merma).
  - **Hacerle la pregunta abierta de frente:**
    > *"Usted que monta líneas PackML de verdad desde hace 22 años: ¿cómo ve esto? ¿Dónde sí tiene sentido algo así en las plantas de acá y dónde estamos pelando bola?"*

---

## 4. Qué Validar con el Sr. José (Las 3 Hipótesis de Planta + Los 4 Cruces Técnicos a Fondo)

### A. Las 3 Hipótesis de Dolor en Planta (Pastor)

1. **Hipótesis 1 — Puesta en marcha y ventanas de parada (*Virtual Commissioning*):**  
   Cuando ellos modernizan una línea de empaque o montan un PLC nuevo trabajando contra reloj en una ventana de parada, ¿cuánto tiempo y plata se pierde hoy probando y ajustando tiempos, variadores, sensores y pistones directamente sobre la máquina el día de la parada de planta? ¿Un gemelo físico donde puedan simular el CAD de la línea antes de tocar la planta les ahorraría horas reales, o ya usan algo para eso?
2. **Hipótesis 2 — Merma y desincronización en líneas de empaque (`PackML`):**  
   En las empaquetadoras y envasadoras reales que ellos atienden en Venezuela, ¿qué es lo que más se traba o genera merma en el día a día? ¿Es un tema de tiempos fijos en el PLC cuando resbala la cinta o cambia el envase (como lo que armamos en `factory_cell`), o el dolor de ellos pasa por otro lado (sensores dañados, falta de repuestos, cuellos de botella mecánicos)?
3. **Hipótesis 3 — IA vs. PLC en industria real:**  
   En una planta de alimentos de verdad que usa Rockwell o Siemens, ¿hasta dónde dejarían entrar algo como Tridi? ¿Como simulador previo para calcular y entregar parámetros deterministas al PLC, o en qué tipo de máquinas sí verían viable meter control adaptativo o visión?

---

### B. Cruce Técnico a Fondo entre lo que Vende ZAKA (`/servicios` y `/clientes`) y Nuestro Repo (Juan)

#### 1. Servicio 06 de ZAKA (Retrofit de máquinas viejas) × `Tridi Assembler` (Modelado de Juego Mecánico y Rampas VFD)
- **El problema físico real en planta:** ZAKA hace retrofit de extrusoras de plástico, mezcladoras y empaquetadoras de los años 80/90 cuyos controladores murieron, donde ya no existen planos originales y los reductores/correas tienen desgaste (*backlash*, holgura mecánica y fricción asimétrica). Cuando se instala un variador moderno (`Allen-Bradley PowerFlex 525/753` o `Siemens Sinamics G120`), una rampa de aceleración/desaceleración muy agresiva genera picos de torque mecánico, golpe de ariete o resonancia que parte ejes o quema fusibles el día del arranque.
- **Cómo lo resuelve Tridi técnicamente:**
  - En MuJoCo modelamos la inercia rotacional reflejada al eje del motor ($J_{\text{eq}} = J_m + J_{\text{carga}} / i^2$), el coeficiente de fricción estática/viscosa (`damping`, `frictionloss`, `armature`) y el patinaje de banda.
  - Antes de energizar el tablero en planta, corremos un barrido de estrés en el gemelo físico y entregamos los parámetros exactos del variador:
    - **Tiempo de Rampa de Aceleración (`P041 Accel Time 1` en PowerFlex / `p1120` en Sinamics)** y **Curva S (`S-Curve %`)** que garantizan que el torque pico nunca supere el límite mecánico del eje viejo.
- **👉 Qué preguntarle al Sr. José:**
  > *"Cuando le cambian el PLC o meten variadores nuevos (`PowerFlex` / `Sinamics`) a una máquina vieja sin planos, ¿cómo calculan hoy las rampas y tiempos sin arriesgarse a golpear la transmisión en el arranque?"*

#### 2. "Cambios de formato parametrizados desde HMI" (`ISA-88` / `PackML`) × Nuestra Matriz de Escenarios (`#/delivery` + `factory_cell`)
- **El problema físico real en planta:** En su vertical de Alimentos y Bebidas, ZAKA implementa cambios de formato desde el HMI (`FactoryTalk View` / `WinCC` / `InTouch`) para que el operador cambie de `250 g` a `500 g` o `1 kg` sin reprogramar el PLC. Sin embargo, cada formato nuevo cambia el centro de masa, la fricción con las barandas y la inercia de frenado: afinar a ojo cada receta nueva en piso de planta consume horas de paro y cientos de envases perdidos en pruebas.
- **Cómo lo resuelve Tridi técnicamente:**
  - Exactamente igual que en [`trytridi.com/#/delivery`](https://trytridi.com/#/delivery) corremos una matriz de 32 episodios variando masa (`×0,80..×1,25`), fricción (`0,25..1,00`) y perturbaciones, Tridi simula los distintos formatos de envase en `factory_cell` y exporta la **Tabla de Recetas Deterministas (`UDT_Recipe_Format`)** lista para importar en `.CSV` o `OPC-UA` al HMI:

| Parámetro de Receta PLC / HMI (`UDT_FormatRecipe`) | Formato `250 g` (Alta vel.) | Formato `500 g` (Estándar) | Formato `1 kg` (Alta inercia) | Registro destino típico (`Rockwell` / `Siemens`) |
| --- | --- | --- | --- | --- |
| **Frecuencia Variador Cinta (`VFD_Freq_Hz`)** | `58,5 Hz` | `50,0 Hz` | `41,5 Hz` | `PowerFlex CmdFreq` / `Sinamics p1082` |
| **Rampa Aceleración / Frenado (`VFD_Ramp_s`)** | `0,24 s` | `0,35 s` | `0,52 s` | `P041/P042` / `p1120/p1121` |
| **Carrera Cilindro Alineador (`Pusher_Stroke_mm`)** | `155 mm` | `145 mm` | `132 mm` | `Festo Servo/Prop Valve Setpoint` |
| **Cota Prensa Selladora (`Sealer_Depth_mm`)** | `115 mm` | `138 mm` | `152 mm` | `Kinetix Axis Position` / `TO_PositioningAxis` |
| **Tiempo de Presión / Sellado (`Sealer_Dwell_ms`)** | `420 ms` | `550 ms` | `680 ms` | `TON_SealerDwell.PT` |
| **Ventana de Validación Óptica (`PE02_Debounce_ms`)** | `18 ms` | `25 ms` | `35 ms` | `TON_PE02_Confirm.PT` |

- **👉 Qué preguntarle al Sr. José:**
  > *"Cuando una planta mete un envase nuevo o cambia el gramaje, ¿cuánto tiempo y cuánta merma les toma hoy afinar en vivo la tabla de recetas del HMI para que no se caigan ni se aplasten los envases?"*

#### 3. El Puente Real entre Simulación y PLC × Evolución de Nuestro Compilador `J-3` (`training/export_mcu.py` → `IEC 61131-3 ST / SCL`)
- **El problema de ingeniería:** Ningún gerente de planta ni integrador serio va a meter una red neuronal `.onnx` como caja negra ni un script de Python con recolección de basura a comandar una prensa industrial de 80 N o un motor de 50 HP. El PLC requiere **tiempo de ciclo determinista (`scan time` de `2 ms` a `20 ms`), sin memoria dinámica, auditable línea por línea y con enclaves (*interlocks*) de seguridad cableados**.
- **Cómo lo resuelve Tridi técnicamente:**
  - En el Caso Luigi ([`docs/caso-luigi-sim2real.md`](caso-luigi-sim2real.md)) ya construimos [`training/export_mcu.py`](../training/export_mcu.py), que toma una política validada en MuJoCo y la transpila a **C99 estático (`461 bytes` de RAM, `< 0,4 ms` de ejecución, cero `malloc`)**.
  - Para integradores industriales como ZAKA, ese mismo compilador puede escupir un **Bloque de Función determinista en Texto Estructurado (`IEC 61131-3 Structured Text` — `SCL` en Siemens `TIA Portal` o `AOI` en Rockwell `Studio 5000`)**, donde la lógica validada en MuJoCo corre rodeada por un **Enclave de Seguridad Determinista (*Safety Wrapper*)**:

```iecst
(* Bloque generado por Tridi Compiler para Siemens TIA Portal (SCL) / Rockwell Studio 5000 (ST) *)
FUNCTION_BLOCK "FB_TridiPackML_Sealer"
VAR_INPUT
    xEStop_OK        : BOOL;   (* Enclave físico de parada de emergencia (Canal doble) *)
    xPE01_Entry      : BOOL;   (* Fotocelda entrada / pesaje (x = -380 mm) *)
    xPE02_SealerZone : BOOL;   (* Fotocelda confirmación zona prensa (x = +100 mm) *)
    xPE03_Exit       : BOOL;   (* Fotocelda salida a palet (x = +520 mm) *)
    rBeltPos_mm      : REAL;   (* Posición estimada por encoder / integrador VFD *)
    stRecipe         : "UDT_FormatRecipe"; (* Receta activa desde HMI: 250g / 500g / 1kg *)
END_VAR
VAR_OUTPUT
    rVFD_SpeedRef_Hz : REAL;   (* Consigna hacia PowerFlex 525 / Sinamics G120 *)
    rPusher_Ref_mm   : REAL;   (* Consigna cilindro alineador Festo *)
    rSealer_Ref_mm   : REAL;   (* Consigna prensa vertical *)
    ePackML_State    : INT;    (* 10=EXECUTE, 20=HOLDING, 30=HELD/FAULT *)
END_VAR
BEGIN
    (* 1. HARD SAFETY INTERLOCK: El PLC manda siempre sobre cualquier consigna *)
    IF NOT #xEStop_OK THEN
        #rVFD_SpeedRef_Hz := 0.0;
        #rPusher_Ref_mm   := 0.0;
        #rSealer_Ref_mm   := 0.0;
        #ePackML_State    := 30; (* PACKML_ABORTED / HELD *)
        RETURN;
    END_IF;

    (* 2. LAZO CERRADO VALIDADO EN MUJOCO: Compensa patinaje de banda esperando PE-02 *)
    IF #xPE02_SealerZone THEN
        #rVFD_SpeedRef_Hz := #stRecipe.VFD_Freq_Hz;
        #rPusher_Ref_mm   := #stRecipe.Pusher_Stroke_mm;
        #rSealer_Ref_mm   := #stRecipe.Sealer_Depth_mm;
        #ePackML_State    := 10; (* PACKML_EXECUTE_SEAL *)
    ELSE
        (* Si la banda patina, pre-alinea guías a 40 mm y retiene la prensa arriba (0 mm) *)
        #rVFD_SpeedRef_Hz := #stRecipe.VFD_Freq_Hz;
        #rPusher_Ref_mm   := 40.0;
        #rSealer_Ref_mm   := 0.0;
        #ePackML_State    := 10;
    END_IF;
END_FUNCTION_BLOCK
```

- **Arquitectura de Despliegue en 3 Niveles (Sin tocar la seguridad de la planta):**

```mermaid
flowchart LR
    subgraph PISO["1. Piso de Planta (Intocable · ZAKA)"]
        PLC["PLC Rockwell CompactLogix / Siemens S7-1500<br/>(Scan determinista 5-20 ms + Safety Interlocks)"]
        VFD["Variadores PowerFlex / Sinamics + Neumática Festo"]
        SENS["Fotoceldas PE1..PE3 + Celda Rice Lake + Cognex"]
        SENS --> PLC --> VFD
    end

    subgraph PUENTE["2. Puente Industrial Estándar"]
        OPC["OPC-UA / Modbus TCP / EtherNet/IP<br/>(Lectura de telemetría o carga de Recetas CSV)"]
    end

    subgraph TRIDI["3. Gemelo Físico Tridi (MuJoCo 50 Hz)"]
        SIM["Simulador Físico 3D de la Línea (CAD STL + Fricción/Inercia)"]
        OUT1["Modo A (Offline): Tabla de Recetas HMI + Rampas VFD"]
        OUT2["Modo B (Código): Bloque ST/SCL (AOI / FB) auditable"]
        OUT3["Modo C (Shadow Mode): Gemelo leyendo PLC en vivo sin escribir"]
        SIM --> OUT1 & OUT2 & OUT3
    end

    PLC <--> OPC <--> TRIDI
```

- **👉 Qué preguntarle al Sr. José:**
  > *"Si el simulador de Tridi le entrega a los ingenieros de ZAKA la tabla de recetas pre-calibrada o un bloque `AOI` / `SCL` estándar que ellos mismos revisan y cargan en `Studio 5000` o `TIA Portal` — o corre en 'modo sombra' leyendo por `Modbus TCP` / `OPC-UA` sin tocar el control —, ¿eso calza limpio con las normas de las plantas acá?"*

#### 4. Fin de Línea Manual e Inspección Visual (Servicio 01 de ZAKA) × `Tridi Capture` (100 % como herramienta comercial y técnica para ZAKA)
- **El contexto:** En alimentos y empaque en Venezuela, el final de línea (encajonado manual, paletizado mixto, control de calidad visual con cámaras **Cognex**) suele ser donde más cuellos de botella y lesiones ergonómicas ocurren.
- **👉 Qué validar con él (posicionándolo siempre para que ZAKA venda más proyectos):**
  > *"Cuando ustedes visitan una planta para levantar un proyecto nuevo de fin de línea o inspección con cámaras Cognex, ¿les serviría grabar un video rápido de la operación actual y poder mostrarle al dueño de la planta una simulación física 3D de cómo va a quedar la celda automatizada por ZAKA antes de que les aprueben el presupuesto?"*

---

## 5. El Cierre Perfecto para Hoy (Sin venderle nada)

Preguntarle si en la oficina de ZAKA acá en Barquisimeto tienen algún **banco de pruebas / maqueta con PLC (`Allen-Bradley` o `Siemens`)**, o algún equipo real donde nos dejen ir una tarde con ellos a tomar medidas, conectarnos en modo lectura (`Modbus TCP` / `OPC-UA` / `Serial`) y armar juntos nuestro **primer caso de estudio industrial en [`trytridi.com/#/milestones`](https://trytridi.com/#/milestones)** — cero costo para ellos, dándole todo el crédito de ingeniería industrial a ZAKA y dejándoles el gemelo 3D listo para mostrar a sus clientes.
