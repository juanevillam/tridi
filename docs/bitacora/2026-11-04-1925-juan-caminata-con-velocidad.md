---
persona: Juan
rama: juan/experimental
sesion: 6f6767dc-9ab1-4aa4-97c3-b1e8ee179dea
inicio: 2026-11-04 19:25
estado: en curso
---

# Caminata que siente su velocidad (corrida de la noche)

Sigue a [`2026-11-03-1200-juan-experimental-v2.md`](2026-11-03-1200-juan-experimental-v2.md): ahí están el escalón 1, los empujones, el pronóstico y las sondas.

## Objetivo

Que la caminata aguante el empujón de la web (250 N) dándole a la política su propia velocidad de pelvis (`--sense-velocity`), entrenada desde cero en la noche, cuando la Mac está libre.

## Qué se hizo

- La corrida de la noche de la sesión anterior (`walk-vel-seed0`) murió a los 3,1 M pasos (sigue 2,46 s del clip, todavía aprendiendo) al cerrarse esa sesión de Claude Code: el entrenamiento era hijo de la sesión (`BrokenPipeError`).
- Relanzada con `nohup` desde `training/runs/night-vel.sh` (salida en `training/runs/night-vel.out`), con `--resume`: sobrevive a que se cierre Claude. Fase 1: caminata desde cero con velocidad, sin empujones, hasta 20 M pasos (se corta sola al seguir el clip entero). Fase 2 (`walk-vel-push-seed0`): empujones de 150-300 N + `--recover`, contra el empujón de la web, cortada por el pronóstico. Al final: escalón 1, empujón de la web y barrido de fuerzas.

- Pausado a pedido de Juan (película en 4K, que la Mac no se caliente) a los 3,21 M pasos, con Ctrl-C: guardó `latest.pt`. Para seguir: `nohup sh training/runs/night-vel.sh > training/runs/night-vel.out 2>&1 &` (la fase 1 ya usa `--resume`).

- **Robots físicos de Luigi** (pedido de Juan, con capturas del chat del equipo): posible reunión el viernes con Luigi, ingeniero electrónico amigo de Ale, que tiene robots sencillos reales (por la imagen, un carrito de dos ruedas con sensor ultrasónico) y simulados en Proteus. Nuevo [`../robots-fisicos.md`](../robots-fisicos.md): qué se dijo en el chat, qué se ve en la imagen, qué es verdad hoy (Tridi nunca corrió en hardware; un carrito no camina), tres demos posibles de menor a mayor valor (gesto → servo en vivo; recorrido de un video → carrito real; controlador entrenado en simulación que funciona en el real, que responde a la duda de César sobre las instrucciones escritas a mano), preguntas para Luigi y qué cambiaría en el repo. Pregunta abierta agregada en [`../preguntas-abiertas.md`](../preguntas-abiertas.md).

- **Captura 2.0 empezada** (Juan: usar SMPL-X con su licencia no comercial, "Tridi es un playground"). Decisión anotada en [`../plan-v2.md`](../plan-v2.md), sección 10. GVHMR clonado fuera del repo (`~/Code/tridi-thirdparty/GVHMR`, su propio entorno con torch 2.3 y pytorch3d compilado para la Mac). Nuevo [`../../data/capture2/`](../../data/capture2/README.md): `gvhmr_mac.py` lo corre en MPS sin tocar su código (su licencia pide publicar las modificaciones), sin DPVO (usa su odometría SIFT en CPU) y sin render. Su código importa y los `.cuda()` van a MPS. **Falta:** los pesos (Google Drive no deja bajarlos por script; no se usan espejos de terceros porque un `.ckpt` puede ejecutar código) y los modelos de cuerpo SMPL-X/SMPL (piden cuenta): los baja Juan en el navegador, lista exacta en el README.

- **GVHMR corre de punta a punta en la Mac** (Juan bajó los pesos y los modelos de cuerpo; todos revisados con `picklescan`, limpios; el `.pkl` de SMPL, que `picklescan` no lee, revisado a mano: solo tipos de datos). Hizo falta parchar también el `.cuda()` de Lightning y correr el modelo final de GVHMR en CPU (en MPS aborta). `data/capture2/to_joints.py` pasa SMPL-X a los 33 puntos para comparar con `data.quality`. Baile: patina 0,29 → 0,04 m/s, huesos 9,6 % → 0 %, altura 1,56 → 1,64 m, temblor igual. Saltos de tijera: temblor 13,4 → 17,4 y pies igual, huesos 0 %; MediaPipe va suavizado y GVHMR crudo. 5,5 min por 11 s de video.

- **2026-11-05, para que el equipo pruebe el 3D nuevo el viernes** (Juan: "empieza, ya no estoy usando la Mac"). Nuevo `data/capture2/to_poseclip.py`: GVHMR → `PoseClip` v1 (33 puntos), girado para que z mire a la cámara (el mundo de GVHMR tenía a la persona mirando a −z; se toma el giro del primer medio segundo comparando con la vista de la cámara) y suavizado igual que `data/lift.py`. `gvhmr_mac.py` guarda los fps reales del video (antes 30 fijo). Con el mismo suavizado GVHMR gana en temblor: baile 11,4 → 7,1, saltos 13,4 → 11,7; huesos ~0 %; solo empeora el pie bajo el piso (~1 cm). Galería de `#/simulaciones` (en esta rama, local) con cada video dos veces, MediaPipe y captura 2.0, y el robot imitando cada uno: probado en el navegador, sin errores. Corriendo con `nohup` `data/capture2/run_set.sh` (todo el set de prueba con cuerpo, ~2 h) y después los dos videos precargados (caminar y correr de perfil).

- Tanda del set: 10 videos bien, GVHMR gana en temblor, pie que patina y huesos en todos (bailar-02 26,2 → 6,2; sentarse-02 15,1 → 8,0); en los de medio cuerpo (dedos, saludar, lavar) inventa piernas quietas y su temblor bajo no cuenta. 4 fallaron en la odometría de SimpleVO (pocos rasgos en el fondo: mar, cortes): `caminar-01`, `correr-01`, `escalera-02`, `bailar-grupo-02`; se reintentan como cámara fija y `run_set.sh` ya lo hace solo. `to_joints.py` borrado (lo reemplaza `to_poseclip.py`). Galería con 7 videos × 2 capturas.

- Terminó todo el set (13:37). Caminar de perfil, el de la web: temblor 43,2 → 23,5, patina 0,87 → 0,40, avanza a 1,06 m/s (MediaPipe 0,76). Correr de perfil 93,9 → 31,5. Caminar alejándose: 5,5 m contra 2,3 m de MediaPipe. Galería: 11 videos con su versión GVHMR, probada en el navegador. Tabla completa en [`../../data/capture2/README.md`](../../data/capture2/README.md).

- **Pedido de Juan (2026-11-05 tarde):** landing, galería solo con captura 2.0, videos bajados en vez de grabados, y manos.
  - Landing (`web/`, área de César; separado en su commit): rutas siempre en inglés (`#/live`, `#/upload`, `#/simulations`, `#/delivery`, `#/camera`, `#/net`; las viejas en español redirigen), selector de idioma como dos palabras simples en vez de píldora, la etiqueta "simulación en vivo" y las esquinas con 20 px de aire bajo la barra, la lectura de MuJoCo abajo a la derecha, Capture/Gym/Policy con la misma tarjeta (misma altura, ancho, título y texto), los números del Gym como líneas simples (no cajas dentro de la tarjeta), sin "Physical AI for humanoids", sin "For humanoid teams", sin la línea de MuJoCo del pie, el manifiesto en dos líneas. Revisado en el navegador en inglés, español y celular.
  - Galería: solo captura 2.0 (los clips de MediaPipe salen; caminar y correr originales se quedan en `preloaded.json` porque los usan la landing, la entrega y la política de caminar), sin `bailar-02`, lista con scroll propio del alto de la escena y los controles.
  - Videos de frente bajados de Pexels (licencia libre): `frente-01` a `frente-04` y `frente-correr-01`, pasados a 720p, en el manifiesto. GVHMR corriendo. `frente-01` avanza hacia la cámara a 0,39 m/s.
  - Manos: WiLoR instalado fuera del repo (`~/Code/tridi-thirdparty/WiLoR`), pesos de su espacio oficial en Hugging Face revisados; `data/capture2/wilor_mac.py`; el detector de manos funciona. Falta `MANO_RIGHT.pkl` (cuenta MANO de Juan).

- **Copy de la landing según la aplicación de YC** (pedido de Juan): hero "Video humano, datos para robots" / "Human video, robot training data", con la idea de que los LLM tuvieron internet y los robots no; Capture dice que encuentra a la persona aunque haya más gente y que copiar sin física se cae; Gym "Copiar no es data" con "el video dice qué hacer; la simulación enseña cómo"; Policy: la política en ONNX y los datos corregidos por física en cuatro mundos. Todo respaldado por `yc/verdad-hoy.md`. Videos de YC (`~/Downloads/demo.mp4` e `intro.mp4`) comprimidos a 15 MB en `web/public/media/`, en el cierre, cargan solo al darle play. MANO: Juan baja "Models & Code" (`mano_v1_2.zip`).
- De frente: `frente-correr-01` avanza 11,9 m hacia la cámara en 10 s (1,19 m/s).

- **Manos andando:** `MANO_RIGHT.pkl` de Juan revisado (solo tipos de datos) e instalado; WiLoR corre en la Mac (pyrender pasa con `PYOPENGL_PLATFORM=darwin`, renderers de entrenamiento apagados desde afuera). En `dedos-01` dibuja bien el "1" (índice arriba, resto doblado). Corriendo en GPU sobre `dedos-01`, `saludar-02`, `dedos-02`, `lavar-04`.
- **De frente, resuelto:** MediaPipe 0,3 m en 18 s caminando hacia la cámara, GVHMR 8,1 m; corriendo 3,0 m contra 11,9 m. La velocidad de GVHMR caminando (0,27-0,45 m/s) parece baja: falta un video de cámara fija con distancia conocida. Caminar y correr de frente en la galería.

- **Corrección de Juan a la landing:** el copy en inglés es el original y la página sale en inglés (ya no se mira el idioma del navegador; español solo si alguien lo elige o `?lang=es`). Copy reescrito más simple: "Robots that learn from any video", "It practices until it stops falling", "You get the trained policy and the motion data". Los videos de YC eran solo contexto (transcritos con whisper en local): fuera de la página y del repo.
- **Caminata de la landing con captura 2.0:** Capture usaba la caminata de MediaPipe guardada en `physics/motions` (con `plantFeet` forzado). Ahora usa `clip_caminar-perfil-gvhmr` (mismo video y mismos 356 cuadros), con su `RobotMotion` guardado en `physics/motions` (commit aparte, carpeta de Pastor) y `plantFeet` automático como en Simulaciones. Simulaciones ya solo muestra v2.
- **Manos, tanda completa (WiLoR, detector en GPU, modelo en CPU):** dedos-01 311 cuadros en 259 s (derecha 90 %), saludar-02 308 en 268 s (izquierda 39 %, derecha 70 %), dedos-02 240 en 204 s (derecha 100 %), lavar-04 777 en 981 s (izquierda 94 %, derecha 70 %): ~0,85-1,3 s por cuadro. Revisado a ojo sobre 12 cuadros: cuenta bien los dedos (2, 3, 4), lado izquierdo/derecho correcto con las dos manos abiertas, encuentra manos pequeñas lavando. En el primer plano de dedos-02 el dibujo sale algo corrido (la proyección de la revisión asume la cámara de WiLoR, no es error de los dedos). Salida en `~/Tridi/capture2/hands/*.wilor.npz`.
- **Contrato `PoseClip` v2 y fusión `GVHMR + WiLoR` (`data/capture2/to_poseclip.py`):**
  - Contrato (`docs/contrato.md`, `web/src/contract.js`, commit aparte): compatible con v1 (`joints` conserva los 33 puntos de MediaPipe), suma `version: 2`, `capture`, `body_model: "smplx"`, `betas`, `camera`, `hands` (21 puntos 3D por mano vista en el espacio del contrato), `hands_conf`, `contacts` (`left_foot`, `right_foot` con altura ≤ 2 cm y velocidad ≤ 0,15 m/s) y `quality.hands_ratio`, más los arreglos SMPL-X girados y centrados en el `.npz`.
  - Fusión en `to_poseclip.py`: asocia cada mano de WiLoR con la muñeca de GVHMR proyectadas al plano de cámara (`MAX_WRIST_IMAGE_DIST = 0.30` del lado largo), pone la muñeca (`R_elbow⁻¹ · R_wrist_wilor`, punto escalar > 0,998 entre los dedos de SMPL-X y los de WiLoR en cámara) y las 15 articulaciones de MANO (`flat_hand_mean = True`, mano izquierda espejada en `x`) en SMPL-X, y ancla los 21 puntos suavizados a la muñeca suavizada del cuerpo. Regenerados los 23 clips de `~/Tridi/capture2/clips/`.
  - `physics/` (commit aparte): `retargetSteps` pasa `hands` de `PoseClip` v2 a `retargeter.solve` (muñecas y palmas) y `playClip` mueve los dedos de las manos Dex3 en los clips con manos; arreglado `check-retarget.mjs` para buscar clips en `data/clips/` o `web/clips/` (`npm --prefix physics run check` pasa entero).
  - `web/` (commit aparte): `SkeletonView` dibuja los 21 puntos y 23 huesos por mano cuando el cuadro trae `hands`, ocultando los 4 huesos gruesos de MediaPipe; actualizados los clips v2 en `web/clips/` y sumados `clip_dedos-01-gvhmr` y `clip_lavar-04-gvhmr` a `preloaded.json`.

## Qué funcionó

- 

## Qué no funcionó

- Vite no ve un archivo nuevo en `physics/motions` (lo lee con `import.meta.glob`) hasta reiniciar el servidor.

- Correr entrenamientos largos como tarea de fondo de la sesión: mueren con ella.
- Esperar trabajos con `pgrep -f <texto>`: la propia espera lleva ese texto y se encuentra a sí misma. La tanda terminó a las 12:55 y la Mac quedó parada ~35 min hasta que Juan preguntó. Ahora se espera por PID (`kill -0`).

## Decisiones

- Antes de más rondas largas de humanoide, prioridad a preparar la demo física con Luigi. No se construye código para su robot hasta conocer su hardware: cada respuesta cambia el diseño.

- Los entrenamientos de la noche se lanzan con `nohup`, desacoplados de la sesión de Claude.

## Sigue

- Captura 2.0: grabar un video caminando hacia la cámara con cámara fija y distancia conocida (para medir la velocidad frontal de GVHMR); revisar alturas de 1,9 m; pie ~1 cm bajo el piso (refinamiento físico); mano de 5 dedos tipo Inspire en el G1 (bloque 5 de `docs/plan-v2.md`).

- Reunión con Luigi (tentativa, viernes): llevar las preguntas de [`../robots-fisicos.md`](../robots-fisicos.md). Con sus respuestas: modelo MuJoCo del carrito y la demo del recorrido.

- Resultado de la noche: si el empujón de la web pasa 0,55, cambiar el contrato (`docs/contrato.md`) y `physics/src/policy.js` para dar la velocidad de la pelvis a la política en la web.
- Entrenar el H1 y resolver su 76 % de contacto.
- Licencia de SMPL-X (no comercial): Juan decide antes de la captura 2.0.
