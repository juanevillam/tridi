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

### Paso 2 — La Celda de Empaque en MuJoCo (1 min)
- **Mostrar en pantalla [`trytridi.com/#/simulations/factory_cell`](https://trytridi.com/#/simulations/factory_cell):**
  - Es una celda de empaquetado con **cinta transportadora, pistón neumático, prensa selladora vertical y 3 fotoceldas** (comparando qué pasa cuando la cinta patina con un timer fijo vs. el control sincronizado por sensores con `0 %` de cajas aplastadas).
  - **Hacerle la pregunta abierta de frente:**
    > *"Usted que monta líneas PackML de verdad desde hace 20 años: ¿cómo ve esto? ¿Dónde sí tiene sentido algo así en las plantas de acá y dónde estamos pelando bola?"*

---

## 4. Qué Validar con el Sr. José (Las 3 Hipótesis de Planta + Los Cruces con Nuestro Repo)

### A. Las 3 Hipótesis de Dolor en Planta (Pastor)

1. **Hipótesis 1 — Puesta en marcha y ventanas de parada (*Virtual Commissioning*):**  
   Cuando ellos modernizan una línea de empaque o montan un PLC nuevo trabajando contra reloj en una ventana de parada, ¿cuánto tiempo y plata se pierde hoy probando y ajustando tiempos, variadores, sensores y pistones directamente sobre la máquina el día de la parada de planta? ¿Un gemelo físico donde puedan simular el CAD de la línea antes de tocar la planta les ahorraría horas reales, o ya usan algo para eso?
2. **Hipótesis 2 — Merma y desincronización en líneas de empaque (`PackML`):**  
   En las empaquetadoras y envasadoras reales que ellos atienden en Venezuela, ¿qué es lo que más se traba o genera merma en el día a día? ¿Es un tema de tiempos fijos en el PLC cuando resbala la cinta o cambia el envase (como lo que armamos en `factory_cell`), o el dolor de ellos pasa por otro lado (sensores dañados, falta de repuestos, cuellos de botella mecánicos)?
3. **Hipótesis 3 — IA vs. PLC en industria real:**  
   En una planta de alimentos de verdad que usa Rockwell o Siemens, ¿hasta dónde dejarían entrar algo como Tridi? ¿Como simulador previo para calcular y entregar parámetros deterministas al PLC, o en qué tipo de máquinas sí verían viable meter control adaptativo o visión?

---

### B. Cruce Directo entre lo que Vende ZAKA (`/servicios` y `/clientes`) y lo que Ya Construimos en el Repo (Juan)

1. **Servicio 06 de ZAKA (Retrofit de máquinas viejas) × `Tridi Assembler`:**
   - **El contexto:** ZAKA hace mucho retrofit de extrusoras de plástico y empaquetadoras con controladores obsoletos donde ya no hay planos y la mecánica tiene desgaste y juego.
   - **👉 Qué validar con él:** Cuando le cambian el PLC o meten variadores nuevos (`PowerFlex` / `Sinamics`) a una máquina vieja, ¿cómo calculan hoy las rampas y tiempos sin arriesgarse a romper algo en el arranque? Ahí un gemelo físico en MuJoCo les permite estresar la máquina vieja en simulación antes del día de parada.
2. **"Cambios de formato parametrizados desde HMI" (`ISA-88` / `PackML`) × Nuestra Matriz de Escenarios (`#/delivery`):**
   - **El contexto:** En su página de Alimentos y Bebidas destacan que hacen cambios de formato desde el HMI (ej. pasar de empaque de `250 g` a `1 kg` sin reprogramar desde cero).
   - **👉 Qué validar con él:** Igual que en `#/delivery` probamos al robot con distintos pesos, fricciones y fuerzas, Tridi puede simular la línea con 10 formatos de envase distintos y exportar la **tabla de recetas pre-calibrada para `FactoryTalk View` o `WinCC`**. ¿Cuánto tiempo pierden hoy en planta afinando cada receta nueva a ojo?
3. **El puente real entre Simulación y PLC × Evolución de nuestro compilador `J-3` (`training/export_mcu.py`):**
   - **El contexto:** En industria pesada nadie va a meter una red neuronal `.onnx` como caja negra a controlar una prensa. Pero nosotros ya construimos `export_mcu.py`, que traduce la política entrenada en MuJoCo a C99 determinista sin bloqueos.
   - **👉 Qué validar con él:** Si en vez de exportar a C de Arduino, exportamos la lógica validada en MuJoCo a **Texto Estructurado (`ST` / `SCL` bajo norma `IEC 61131-3`)** o como un bloque de función (**`AOI` para Rockwell `Studio 5000` / `FB` para Siemens `TIA Portal`**), ¿eso sí entraría directo en el flujo de trabajo de los ingenieros de ZAKA?
4. **Fin de línea manual e inspección visual (Servicio 01 de ZAKA) × `Tridi Capture` (con el cuidado de Ale de posicionarlo 100 % como herramienta para que ZAKA venda más proyectos):**
   - **El contexto:** Antes de hablar de humanoides carísimos, las plantas de alimentos en Barquisimeto siguen teniendo cuellos de botella en final de línea (encajonado, paletizado, inspección con cámaras Cognex).
   - **👉 Qué validar con él (sin que suene a que Tridi automatiza por su cuenta):** Cuando ZAKA visita una planta para proponerles un proyecto de automatización en fin de línea, ¿en qué partes ven más cuellos de botella hoy donde a los ingenieros de ZAKA les serviría tener visión/medición por cámara o simular en 3D la solución que ZAKA les va a instalar?

---

## 5. El Cierre Perfecto para Mañana (Sin venderle nada)

Preguntarle si en la oficina de ZAKA acá en Barquisimeto tienen algún **banco de pruebas / maqueta con PLC**, o algún equipo de un cliente de confianza donde nos dejen ir un día con ellos a tomar medidas y armar juntos nuestro **primer caso de estudio industrial real en `#/milestones`** (igual que hicimos con el rover de Luigi, cero costo para ellos y dejándoles el gemelo 3D a ZAKA).
