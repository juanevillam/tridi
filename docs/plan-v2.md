# Plan Tridi v2: de demo de 36 horas a producto de verdad

- **Fecha:** 2026-11-03 · **Quién:** Juan (con Claude) · **Rama:** `juan/experimental`, local, sin push ni deploy.
- **Estado:** propuesta de Juan para mostrar a Pastor, César y Ale cuando esté avanzada. Nada de esto está en `main` ni en la demo (https://tridi-alpha.vercel.app queda como se mandó a YC).
- **Base:** lo que funciona y lo que no al 27 de octubre está en [`../yc/verdad-hoy.md`](../yc/verdad-hoy.md); el plan del hackathon, en [`plan-producto.md`](plan-producto.md). Este plan no reescribe esos documentos: los continúa.

> Regla de este plan: cada paso tiene una **medida** antes de empezar y una **meta** al terminar. "Mejorar el tracking" no es una tarea; "bajar el error de las muñecas de X a Y cm en nuestro set de prueba" sí.

---

## 1. Dónde estamos (la línea de partida, con números)

| Pieza | Hoy | El límite real |
| --- | --- | --- |
| Captura offline | YOLO11-pose + ByteTrack + MediaPipe Pose (heavy), **33 puntos**, Savitzky-Golay | MediaPipe estima cada cuadro solo, no ve profundidad de frente, no hay dedos, la escala sale 10-20 % baja, la trayectoria se reconstruye con heurísticas (pie de apoyo + ajuste a la imagen) |
| Captura en vivo | MediaPipe en el navegador, 33 puntos + palmas (opcional), One Euro | Igual que arriba, y en tiempo real |
| Retargeting | 29 articulaciones del G1, 3,2 cm de error mediano en la caminata | Sin manos (el G1 de la escena no tiene Dex3), sin restricciones de contacto explícitas |
| Entrenamiento | PPO propio en CPU, M2: **~11.400 pasos/s** (64 robots, 8 procesos). De pie: 60 M pasos. Caminata: `walk-v4` sigue **3,5 s de 11,8** y no mejora desde los 10 M pasos | La CPU limita a decenas de millones de pasos. Y **más pasos del mismo método ya no ayudaron a la caminata**: el problema es también el método, no solo la cantidad |
| Producto | En vivo (marioneta, sin física), Subir (cola en la Mac de Juan), Entrega (ONNX + rollouts en 4 mundos) | Todo corre en una Mac detrás de un túnel; un video tarda 30-70 min |
| Web | Landing fluida a 60 fps casi siempre; un congelón de ~1 s al llegar a Capture. Solo en español | — |

**El diagnóstico en una frase:** la cadena entera existe, pero cada eslabón es de hackathon. Las dos palancas que más mueven todo son (1) **pasar el entrenamiento a GPU**, que convierte "60 M pasos en una hora" en "miles de millones de pasos en una hora", y (2) **cambiar MediaPipe por una reconstrucción de cuerpo entero con manos y anclada al mundo**.

---

## 2. Pilar A · La web (lo primero que se ve)

### A1. Idiomas sin recargar ✅ (landing) / ⏳ (resto)

- **Hecho en esta rama:** `web/src/i18n.js`. Cada texto está en la página una vez por idioma y el CSS muestra el de `<html data-lang>`, igual que el portafolio de Juan: cambiar de idioma es cambiar un atributo, sin recarga, sin parpadeo, y el texto que la página escribe después (el HUD, los estados del Gym) también cambia. El idioma se decide antes del primer cuadro: `?lang=`, la elección guardada, el idioma del navegador, si no inglés. Selector ES · EN en la barra de arriba. Los números usan la coma o el punto de cada idioma.
- **Hecho:** la landing completa (`web/src/landing/strings.js`).
- **Sigue:** En vivo, Subir, Simulaciones, Entrega, Cámara del teléfono y Red, cada pantalla con su diccionario junto a su código. Errores del servidor con código + texto en los dos idiomas (hoy el contrato dice "en español si failed"): cambio de contrato, commit aparte.
- **Meta:** cero textos en un solo idioma (un chequeo que recorra el DOM de cada pantalla en los dos idiomas y falle si encuentra un texto sin `.t`).

### A2. Fluidez medida, no a ojo

- **Medida de hoy:** scroll de punta a punta, mediana 16,7 ms por cuadro, p95 17,6 ms; **un cuadro de ~1.030 ms al entrar a Capture**.
- **Hecho:** el esqueleto de Capture (un segundo renderer WebGL que compilaba shaders al llegar) se arma cuando la página está ociosa después de cargar el robot, y los checkpoints del Gym se bajan a la caché antes de que se lleguen a pedir.
- **Sigue:** volver a medir con el panel visible; presupuesto: **ningún cuadro > 50 ms** en scroll en una MacBook Air M2 y en un iPhone 13. Mover la física de MuJoCo a un Web Worker (hoy comparte el hilo con el scroll): con `OffscreenCanvas` el render también. Cargar el robot (30 MB) en paralelo por prioridad: primero lo que se ve en el hero.
- **Meta:** Lighthouse ≥ 90 en rendimiento en escritorio; primer cuadro con el robot < 4 s en una conexión de 50 Mbps.

### A3. Copy de nivel YC

- El inglés no es traducción: está escrito para un equipo de robótica en EE. UU. Lo revisa Ale antes de mostrarlo.
- Nunca mostrar como hecho lo que es plan (regla de [`pitch/pitch-producto.md`](pitch/pitch-producto.md)): la línea "Dónde estamos" de la landing se actualiza sola con los números del entrenamiento.

---

## 3. Pilar B · Captura 2.0: el cuerpo entero, con dedos, anclado al mundo

El objetivo no es "más puntos" por sí mismo: es un **movimiento humano físicamente creíble**, que es lo que después el robot puede imitar. Más puntos sin coherencia temporal y sin anclaje al piso dan más ruido, no más señal.

### B1. Cambiar el modelo de cuerpo: de 33 puntos a SMPL-X

SMPL-X es el formato estándar de cuerpo humano en investigación: 55 articulaciones (cuerpo, 15 por mano, mandíbula y ojos) + la forma del cuerpo + la malla. Casi todo lo que se publica de retargeting a humanoides (y los datasets como AMASS) habla SMPL / SMPL-X. Pasar a SMPL-X nos deja usar ese ecosistema en vez de pelear con 33 puntos.

Candidatos a evaluar, en este orden (todos con código abierto; **revisar licencias antes de cualquier uso comercial**, varias son solo para investigación):

| Qué resuelve | Candidatos | Por qué |
| --- | --- | --- |
| Cuerpo anclado al mundo, con cámara que se mueve | **GVHMR**, WHAM, TRAM, PromptHMR | Dan la trayectoria global y la gravedad: reemplazan las heurísticas de `lift.py` (pie de apoyo, ajuste a la imagen) y el problema "de frente el avance sale ≈ 0" |
| Cuerpo entero con manos y cara en una pasada | SMPLer-X, Multi-HMR, SAM 3D Body (Meta) | Una sola red para todo; Multi-HMR maneja varias personas |
| Manos de calidad | **HaMeR**, WiLoR | Los dedos de verdad salen de un modelo de manos dedicado sobre un recorte de la mano, no del modelo de cuerpo |
| Puntos 2D densos (detector y validación) | RTMW / DWPose (133 puntos: cuerpo, pies, manos, cara), Sapiens (308) | Más puntos 2D para el ajuste final y para validar; los pies con talón y punta mejoran el contacto |

**Pipeline propuesto:** detectar y seguir a las personas (como hoy) → cuerpo anclado al mundo por persona (GVHMR o equivalente) → manos con HaMeR sobre recortes → fusionar en SMPL-X → **refinamiento con física**: pies que no patinan cuando apoyan, que no atraviesan el piso, aceleraciones posibles para un cuerpo humano. Ese último paso es nuestro y es parte del foso.

**El `PoseClip` v2** (cambio de contrato, commit aparte y antes del código): guarda los parámetros SMPL-X por cuadro (`global_orient`, `transl`, `body_pose`, `left/right_hand_pose`, `betas`), los contactos de cada pie, la confianza por articulación y la cámara. Los 33 puntos siguen saliendo derivados del SMPL-X, para que la web y el retargeting de hoy sigan funcionando mientras migran.

### B2. En vivo: la misma calidad, en tiempo real

- Hoy: MediaPipe Pose en el navegador. Sigue: **MediaPipe Holistic** (33 del cuerpo + 21 por mano) como base inmediata y barata, con la profundidad del codo y la mano ya resuelta por `bones.js`.
- Después: un modelo de cuerpo + manos en el servidor con GPU para el modo "Muévete y el robot te copia" en calidad alta, con el navegador como respaldo cuando no hay red.

### B3. Medirlo: nuestro set de prueba

Sin un set de prueba propio, "mejoró el tracking" es opinión. Se arma una vez y se corre en cada cambio:

- **20 videos propios** grabados por el equipo (con permiso, sirven además como datos con licencia): caminar de perfil y de frente, correr, saltar, girar, agacharse, gestos con las manos, contar con los dedos, dos personas en cuadro, cámara en mano.
- **Medidas automáticas** (sin verdad de terreno): patinazo del pie de apoyo (cm/s), pies bajo el piso (cm), temblor (aceleración del tercer derivado), largo de huesos constante (%), y `valid_ratio`.
- **Con verdad de terreno:** un subconjunto en un benchmark público (EMDB o 3DPW) para el error en milímetros (W-MPJPE), y unos clips grabados con la cinta métrica en el piso para comprobar la distancia recorrida.
- **Meta de B:** patinazo del pie de apoyo < 2 cm/s, distancia recorrida con < 5 % de error de frente y de perfil, dedos legibles (abrir, cerrar, señalar, contar) en ≥ 90 % de los cuadros con la mano visible.

---

## 4. Pilar C · Retargeting 2.0: del humano al G1, con manos

- **Cuerpo:** reemplazar el retargeting por ángulos por uno de **cinemática inversa con restricciones** (como GMR, General Motion Retargeting, que ya soporta el G1 desde SMPL-X): emparejar posiciones y orientaciones de pies, manos, pelvis y cabeza, con escala por el largo de los huesos, límites de las articulaciones, sin que el pie atraviese el piso ni patine cuando el humano tiene el pie apoyado.
- **Manos:** el G1 viene con manos Dex3-1 (3 dedos, 7 articulaciones por mano) o Inspire (5 dedos). MuJoCo Menagerie trae el G1 con manos. Decisión a tomar con Pastor: qué mano modelar primero. Retargeting de dedos por la dirección de cada dedo (no por ángulos), porque la mano humana y la del robot no tienen los mismos dedos.
- **Medida:** error de las posiciones clave (manos, pies) en cm, patinazo en el robot, articulaciones en el límite (% de cuadros), y `diagnose_reference.py` en verde antes de entrenar.

---

## 5. Pilar D · Entrenamiento 2.0: miles de millones de pasos, y un método que los aproveche

### D1. Por qué "más pasos" necesita dos cosas a la vez

Juan quiere la mayor cantidad de pasos posible, y tiene razón: los trabajos de imitación de cuerpo entero en el G1 entrenan con **miles de millones** de pasos, no decenas de millones. Pero hay dos datos nuestros que importan:

1. **En CPU no se llega.** A 11.400 pasos/s, 1.000 M de pasos son **~24 horas** de la M2 por cada video. Y la M2 es la laptop de Juan.
2. **Más pasos del mismo método ya no ayudó:** `walk-v4` sigue 3,68 s a los 10 M y 3,54 s a los 20 M. El techo es del método.

Así que el plan va en dos partes que se hacen juntas: **física en GPU** (cantidad) y **un método de seguimiento de movimiento moderno** (calidad de cada paso).

### D2. Física en GPU

| Opción | Qué es | Por qué |
| --- | --- | --- |
| **MuJoCo Warp + mjlab** | MuJoCo en GPU (NVIDIA Warp) con una API de entrenamiento al estilo Isaac Lab | Misma física que la web (MuJoCo), así lo que se ve es lo que se entrenó. mjlab trae tareas de seguimiento de movimiento para el G1 |
| MuJoCo Playground (MJX, JAX) | MuJoCo en GPU sobre JAX; Menagerie trae `g1_mjx.xml` | Más maduro, con ejemplos de locomoción del G1 |
| Isaac Lab | El simulador de NVIDIA | Es el estándar en muchos laboratorios, pero cambia la física respecto de la web |

**Recomendación:** MuJoCo Warp / mjlab, porque mantiene MuJoCo de punta a punta (entrenamiento, web y datos). Primera tarea: reproducir nuestra política de pie con 4.096 robots en paralelo y comparar contra la de hoy.

**Dónde corre y cuánto cuesta** (estimaciones a medir en la primera semana; precios de alquiler aproximados):

| Máquina | Pasos/s esperados | 1.000 M de pasos | Costo aprox. |
| --- | --- | --- | --- |
| M2 (hoy, CPU) | 11.400 (medido) | ~24 h | gratis, pero bloquea la laptop |
| 1 × RTX 4090 alquilada | 100 k - 300 k (a medir) | ~1 - 3 h | ~USD 0,4-0,7 por hora |
| 1 × H100 alquilada | 300 k - 1 M (a medir) | ~20 min - 1 h | ~USD 2-3 por hora |

Eso convierte "60 M pasos" en "**2.000 a 5.000 M pasos**" por el mismo tiempo de espera. Ese es el salto de nivel.

### D3. El método: seguir cualquier movimiento, no uno por clip

1. **Un buen tracker por clip** (lo que hacemos hoy, bien hecho), al estilo BeyondMimic / DeepMimic moderno: inicio en estados al azar del clip, terminación temprana por desvío, **muestreo adaptativo** (practicar más los tramos donde se cae), crítico asimétrico (el crítico ve la verdad del simulador, el actor solo lo que tendría el robot real), red más grande, y aleatorización de fricción, masas, retardo de motores y empujones.
2. **Un tracker general** (al estilo GMT / OmniH2O / TWIST): **una sola política que sigue cualquier movimiento** de una gran colección (AMASS + nuestros clips), entrenada miles de millones de pasos. Cambia el producto entero:
   - Subir un video ya no exige entrenar 30-70 min: el tracker general lo sigue en segundos, y el ajuste fino por clip (opcional) arranca desde ahí.
   - **"Muévete y el robot te copia" pasa a ser con física real**, en tiempo real: la cámara da la referencia y la política la sigue. Hoy es una marioneta.
3. **Del estudiante al robot real:** la política "maestra" con información privilegiada se destila en una "estudiante" que solo usa los sensores del G1 (sin altura de la pelvis, con ruido y retardo), que es la que se puede llevar a un robot.

**Medidas:** `followed_s` (cuánto del clip sigue sin caerse), error medio de posición del cuerpo (cm), tasa de éxito en N clips nunca vistos, robustez en los 4 mundos y bajo empujones. **Meta de D:** la caminata de 11,8 s completa en ≥ 90 % de los episodios; el tracker general sigue ≥ 80 % de un set de 50 clips que no vio.

### D4. Cuántos pasos: la regla

Ni "infinitos" ni un número fijo: **se entrena hasta que la curva de `followed_s` y del éxito en clips no vistos se aplana**, con un checkpoint (y su ONNX) en cada escalón logarítmico, como hoy. Se para cuando 3 evaluaciones seguidas no mejoran más de 1 %. El presupuesto inicial del tracker general: 5.000 M de pasos; el de un ajuste fino por clip: 200-500 M.

---

## 6. Pilar E · El producto: las tres puertas de la landing, de verdad

### E1. "Muévete y el robot te copia"

- **Hoy:** marioneta (cinemática), en el navegador.
- **v2:** el tracker general corre en el navegador (onnxruntime-web, como la política de pie hoy) y sigue la referencia de la cámara con física: si te tiras al piso, el robot se cae de verdad. Retardo objetivo < 150 ms de la persona al robot.
- **Con dedos:** las manos del robot abren y cierran con las tuyas.

### E2. "Sube un video de una persona"

- **Hoy:** cola en la Mac de Juan, 30-70 min, un trabajo a la vez.
- **v2:** reconstrucción en GPU (B1) en < 1 min por 30 s de video; vista previa inmediata con el tracker general; ajuste fino opcional en GPU en la nube (minutos). Progreso por etapas, siempre visible (regla de la casa: nunca una pantalla de carga vacía).
- Varias personas en cuadro: elegir a una o entregar a todas.

### E3. "La política y los datos que entregamos"

Lo que compra un equipo de humanoides tiene que entrar directo en su stack:

- **Política:** ONNX (hoy) + checkpoint de PyTorch + la configuración exacta de observación y acción, con un script de 20 líneas para correrla en MuJoCo.
- **Movimiento humano:** SMPL-X `.npz` (estándar AMASS) y BVH para animación.
- **Movimiento del robot:** `qpos`/`qvel` a 50 Hz corregidos por la física, en el formato de **LeRobot** (Hugging Face) además del nuestro.
- **Informe de calidad:** por clip, cuánto sigue, robustez por mundo, contactos de los pies, y en qué tramos falla. Un PDF/HTML que un ingeniero pueda leer en 2 minutos.

---

## 7. Pilar F · Infraestructura: salir de la Mac

- Trabajadores de GPU bajo demanda (Modal, RunPod o similar) para reconstrucción y entrenamiento; almacenamiento de objetos (Cloudflare R2 o S3) para clips, políticas y entregas; una API pequeña con colas.
- Cuentas y proyectos por cliente, con borrado de videos por defecto (hoy ya guardamos solo el movimiento, nunca el video: mantenerlo).
- Costos por video medidos y mostrados internamente desde el primer día.
- **Deploy:** sigue pendiente la decisión de mover el deploy a este repo ([`../yc/legal-y-equity.md`](../yc/legal-y-equity.md#deploy)). Esta rama no despliega nada.

---

## 8. Pilar G · Robot real (sim2real), cuando lo anterior funcione

- Modelo de los actuadores del G1 (retardo, límite de torque, fricción) y aleatorización de esos parámetros.
- Solo los sensores del robot real en la política estudiante.
- Conseguir un G1 para probar: un laboratorio universitario o una empresa que ya tenga uno (es también una conversación de clientes, ver [`../yc/plan-hasta-el-deadline.md`](../yc/plan-hasta-el-deadline.md)).

---

## 9. Calidad de ingeniería

- `npm run check` y las pruebas de Python en CI (GitHub Actions) en cada push de la rama, cuando se decida subirla.
- Un tablero de métricas (tracking, retargeting, entrenamiento, web) que se actualiza solo: así se le muestra el progreso a los cofundadores con números, no con videos sueltos.
- Cada umbral y número mágico con su porqué al lado (regla de la casa).

---

## 10. Orden de trabajo (tiempo libre de Juan)

Pensado por bloques de ~1 semana de tiempo libre. Cada bloque termina en algo que se puede mostrar.

| Bloque | Qué | Se muestra |
| --- | --- | --- |
| **0 · ya** | Rama `juan/experimental`. Idiomas en la landing. Congelón de Capture. Este plan | La landing en ES/EN sin recargar |
| **1** | Idiomas en todas las pantallas. Medir fluidez con presupuesto. Set de prueba de captura (20 videos) y sus medidas sobre la cadena de hoy | La línea de partida en números |
| **2** | **GPU:** cuenta de GPU en la nube, MuJoCo Warp/mjlab con el G1, reproducir la política de pie y medir pasos/s reales | "60 M pasos en X minutos" |
| **3** | Tracker por clip moderno (D3.1) en GPU: la caminata completa | La caminata de 11,8 s entera, con física |
| **4** | Captura 2.0: GVHMR + HaMeR → SMPL-X, `PoseClip` v2 (contrato primero), refinamiento con física | Antes/después en el set de prueba, con dedos |
| **5** | Retargeting con IK (GMR) y G1 con manos | El robot con las manos del video |
| **6-8** | Tracker general sobre AMASS + nuestros clips, miles de millones de pasos; "Muévete y te copia" con física | Moverse frente a la cámara y que el robot te siga sin marioneta |
| **9+** | Entrega en formatos estándar, infraestructura en la nube, sim2real | Una entrega que un laboratorio pueda usar |

**Puntos de decisión:**

- **Fin del bloque 2:** si MuJoCo Warp/mjlab no da ≥ 100 k pasos/s en una GPU de consumo, probar MJX/Playground antes de pensar en Isaac Lab.
- **Fin del bloque 3:** si el tracker por clip no completa la caminata con 1.000 M pasos, revisar la referencia (captura y retargeting) antes de sumar más pasos: el problema estaría aguas arriba.
- **Licencias:** antes de cualquier cliente, revisar las licencias de cada modelo y dataset (SMPL-X, AMASS y varios modelos de pose son solo para investigación). Puede obligar a entrenar modelos propios con datos propios: es trabajo, pero también foso.

---

## 11. Riesgos

| Riesgo | Qué hacemos |
| --- | --- |
| Costo de GPU con tiempo libre y sin ingresos | Presupuesto mensual fijo; GPU de consumo alquilada por hora; apagar todo al terminar cada corrida |
| Licencias no comerciales (SMPL-X, AMASS, modelos de pose) | Usarlas para investigar; anotar cada una; plan B con datos y modelos propios antes de vender |
| La rama se aleja de `main` y luego no se puede juntar | Rebasar sobre `main` cada semana; contratos nuevos versionados (v2 junto a v1) |
| Hacer demasiado a la vez | Un bloque a la vez, cada uno con su medida y su "se muestra" |

---

## 12. Preguntas abiertas (para Juan primero, después para el equipo)

1. **Presupuesto de GPU:** ¿cuánto por mes se puede gastar en GPU en la nube (por ejemplo USD 50, 200, 500)? Define qué tan rápido llegamos a los miles de millones de pasos.
2. **¿Subir la rama a `origin`?** Empujar `juan/experimental` al repo privado no despliega nada (la demo sale del espejo `Torpass/tridi`) y sirve de respaldo. Hoy queda solo local, como pidió Juan.
3. **Mano del G1:** ¿Dex3-1 (la de Unitree, 3 dedos) o Inspire (5 dedos)? Con Pastor.
4. **¿Mostrar el plan a Pastor antes?** El pilar D es su área (entrenamiento y física): conviene que lo vea temprano, aunque sea en borrador.
