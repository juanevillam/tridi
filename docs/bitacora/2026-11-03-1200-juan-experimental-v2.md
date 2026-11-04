---
persona: Juan
rama: juan/experimental
sesion: f4039e1b-2fb0-4ba8-a1c0-e31a058bcb5a
inicio: 2026-11-03 12:00
estado: abierta
---

# Rama experimental: landing en ES/EN y plan Tridi v2

## Objetivo

Trabajar en una rama aparte (`juan/experimental`, local, sin push ni deploy: la demo queda como se mandó a YC) en una versión mucho mejor de Tridi, para mostrarla a los cofundadores cuando esté avanzada. Primero: landing más fluida y en español e inglés sin recargar (como el portafolio de Juan). Después: el plan más ambicioso posible para tracking, entrenamiento y producto.

## Qué se hizo

- Rama `juan/experimental` desde `main`.
- **Idiomas sin recargar** (`web/src/i18n.js`): cada texto está en el DOM una vez por idioma y el CSS muestra el de `<html data-lang>`, el mismo patrón que el portafolio (`website/src/components/T.astro`). Un script en `index.html` decide el idioma antes del primer cuadro (`?lang=`, guardado, navegador, si no inglés). `dict()` por pantalla da `T()` (HTML con los dos idiomas), `t()` (texto plano) y `A()` (atributos como `aria-label` que siguen al idioma). Números con la coma o el punto de cada idioma (`fmt`, `fmtInt`). Selector ES · EN (`langSwitch()`) en la barra de la landing.
- **Landing traducida entera** (`web/src/landing/strings.js`), incluido lo que escribe en vivo: HUD, estados del Gym, carga, contador de pasos, manifiesto palabra por palabra.
- **Fluidez:** medido el scroll de punta a punta: mediana 16,7 ms/cuadro, p95 17,6 ms, pero un cuadro de ~1.030 ms al entrar a Capture. Causa probable: el esqueleto de Capture crea un segundo renderer WebGL y compila shaders al llegar. Ahora se arma en un momento ocioso después de cargar el robot (y se dibuja una vez), y los checkpoints del Gym se bajan a la caché antes.
- **Plan maestro:** [`docs/plan-v2.md`](../plan-v2.md): línea de partida con números, 7 pilares (web, captura SMPL-X con manos, retargeting con IK y manos, entrenamiento en GPU con miles de millones de pasos y un tracker general, producto, infraestructura, sim2real), orden por bloques, puntos de decisión, riesgos y preguntas.

## Qué funcionó

- Cambiar ES ↔ EN en la landing es instantáneo y no recarga; el `aria-label` y los números también cambian. Probado en el navegador de la app (textos del hero, Gym y cierre en los dos idiomas). `vite build` pasa.

## Qué no funcionó

- No se pudo volver a medir el congelón de Capture después del arreglo: el panel del navegador estaba oculto y `requestAnimationFrame` no corre ahí. Falta medirlo con el panel visible.

## Decisiones

- Idioma por defecto cuando el navegador no es ni español ni inglés: inglés (la empresa apunta a EE. UU.).
- Cada pantalla guarda su copy junto a su código (un diccionario por pantalla), no un archivo gigante de traducciones.
- La rama no se sube a `origin` hasta que Juan lo diga.
- **Respuestas de Juan (segunda vuelta):** todo es de Juan; la rama vive en su repo privado `juanevillam/tridi` (subida; nunca `main` ni `Torpass/tridi`); manos de 5 dedos; cómputo solo en su Mac M2 con herramientas gratis y locales (24 h por video está bien); no se muestra a Pastor antes. Visión: un video (p. ej. 3 min lavando platos) → física fiel → RL con millones de variaciones → habilidades que corren debajo de un modelo grande, para cualquier humanoide. Comparable en YC: Asimov (junta muchos datos reales; nosotros multiplicamos uno con física).
- `docs/plan-v2.md` reescrito con eso: controles contra el estancamiento (C1-C4, evaluación fija, mapa de caídas, salud, detector de meseta, regla de la década, registro), escena y objetos, paquete de robot para cualquier humanoide, entrenamiento eficiente en CPU, escalera de 8 habilidades hasta lavar, licencias.

- **Tercera vuelta:** nada de GPU en la nube, ni gratis: todo en la Mac. Juan graba solo el set de prueba. La Mac es de trabajo: que no se queme.
- `docs/grabacion/set-de-prueba.md`: guía para grabar solo los 20 videos (equipo, ficha de medidas, marcas a 3 m, iPhone 1080p60 con AE/AF bloqueado, ropa, rutina con pose T, cada video con cámara, qué hacer, duración y para qué; los videos quedan en `~/Tridi/set-de-prueba/`, nunca en el repo).
- **Bloque 1, primera parte (`training/`):** `guard.py` (full / shared / paused según uso, batería, estado térmico de macOS por `ProcessInfo.thermalState` y memoria; `taskpolicy` para prioridad de fondo; `caffeinate` solo enchufada; `pause`/`resume`/`status`), `plateau.py` (ventana de 3 evaluaciones con +2 %, regla de la década +10 %, "done" al 98 % del techo; autotest con la forma de `walk-v4`), y en `ppo.py`: `latest.pt` cada 5 min y al cortar, `--resume`, evaluación en cada checkpoint (`evals.csv`), parada y `plateau.md`, registro `training/experiments.csv`, `--note`, `--shared`.
- Probado: autotest de meseta ok; corrida de 100 k pasos cortada con SIGTERM y reanudada con `--resume` hasta el final (progress y registro bien); medido 11.400 pasos/s a toda máquina, ~1.100-1.500 en prioridad de fondo, ~11.000 con `--shared nice` mientras se usa la Mac. La Mac es una MacBook Air M2 (`Mac14,2`), sin ventilador.
- Encontrado y arreglado: un run lanzado en segundo plano heredaba SIGINT ignorado y Ctrl-C no hacía nada; ahora `ppo.py` maneja SIGINT/SIGTERM y los workers ignoran SIGINT.

- **Bloque 1, segunda parte:** `training/checks.py` (C1 referencia factible, reutiliza `diagnose_reference.analyze`; C2 física factible: motores al límite con la pelvis sostenida + ZMP de la referencia contra los pies apoyados; C3 sobreajuste del primer segundo en 2 M pasos; C4 humo de 1 M pasos), `training/failmap.py` (caídas por tramo de 0,5 s con 2 s de horizonte, acepta `.pt` u `.onnx`) y en `ppo.py` la salud del aprendizaje por actualización (KL, fracción recortada, varianza explicada, desvío, norma del gradiente; aviso tras 20 actualizaciones fuera de rango en `health.txt`) y el mapa de caídas en cada evaluación de imitación.
- **No funcionó y se cambió:** C2 con dinámica inversa (`mj_inverse`): con contactos blandos no deduce la fuerza del piso de una referencia cinemática y pedía todo el peso "de afuera" aun de pie quieto. Reemplazado por saturación de motores + ZMP.
- **Lo que dijeron los controles:** la caminata, los jumping jacks y correr fallan C1 y C2. Caminata: pies en el piso cuando deberían 55 %, pie apoyado que patina 0,25 m/s, motores 100 ms tarde; centro de masa fuera del pie apoyado en 84 % de los cuadros aun quieto (~17 cm), ZMP fuera en 93 %. `g1-walk` aguanta 2 s desde 61 % de los inicios y cae sobre todo entre 4,5 y 8 s. **Por eso más pasos no ayudaron: la referencia no está en equilibrio.** El bloque 3 empieza arreglando la referencia.
- Medido: en prioridad de fondo, con la Mac en uso, la imitación va a ~530 pasos/s; los controles usan `--shared nice` por defecto.

- **Cuarta vuelta (Juan):** el set de prueba no lo graba Juan: videos que ya existen (TikTok, YouTube, Instagram, bancos de video), y Tridi tiene que funcionar con cualquier cámara y con varias personas, sin condiciones de estudio. Hecho: `data/testset.py` (`list`, `add`, `download` con curl para Pexels y yt-dlp para el resto, `extract`, `quality`), `data/set-de-prueba/manifest.csv` con 25 candidatos de Pexels (licencia libre, también comercial; revisada en pexels.com/license), `data/quality.py` (valid, jitter, slide, sink, bones, height) con la línea de partida en `quality.csv`, y la guía reescrita. Los videos no se bajaron todavía: falta el OK de Juan.
- **C3 de la caminata: pasa.** Aprende el primer segundo en ~100 k pasos (sigue 1,02 s de 1,0). La salud avisó algo real: el gradiente se recorta siempre (norma ~22 contra el límite de 1): el tamaño real de cada paso de aprendizaje es desconocido. Candidato a arreglar (normalizar los retornos del crítico).
- **C4 de la caminata: pasa.** Episodio 0,72 → 0,92 s (+28 %), recompensa 0,459 → 0,562 en 1 M pasos. Juntos: la caminata se puede aprender (C3, C4) pero su referencia no está en equilibrio (C1, C2). El problema no es el aprendizaje sino lo que se le pide.
- **Bug arreglado en `checks.py`:** correr `--only c3,c4` escribía un informe que decía "Listo para entrenar largo" sin los C1/C2 fallidos. Ahora los resultados de cada control se guardan en `results.json` del clip y el informe y el veredicto juntan todos (y dicen qué falta).

- **Quinta vuelta (Juan: "sí, bájalos"):** bajados 19 de 25 de Pexels (218 MB en `~/Tridi/set-de-prueba/videos`). `curl` al link de descarga de Pexels da 403; `yt-dlp` (extractor genérico) sí, así que `testset download` usa yt-dlp para todo. Seis siguieron con 403 de Cloudflare aun espaciados 45 s: no se forzó (sería saltar protección anti-bot); quedan `sin-bajar` para bajarlos a mano. Revisados con 4 cuadros cada uno: 10 ok, 8 difíciles, 1 descartado (3 s solo de guantes); caminar-02 en realidad son saltos (→ `saltar`).
- Extraídos 14 clips; fallaron los 4 sin cuerpo entero (lavar-02, lavar-05, correr-02, dedos-02) y lavar-04 de medio cuerpo salió 30 % válido. **Hallazgo:** la captura de hoy no sirve para lavar platos ni dedos tal como la gente los filma; la captura 2.0 necesita medio cuerpo + manos (HaMeR). Línea de partida guardada como `mediapipe-2026-11-03` en `quality.csv` y en la guía.

- **Sexta vuelta (Juan: "continúa, cuerpo completo por ahora, no te detengas"):**
  - **`training/balance.py`** (nuevo): pone la referencia en equilibrio antes de entrenar. Detecta los apoyos (pie bajo y lento, sin parpadeos), fija el pie apoyado donde aterrizó (puede levantar el talón al despegar), levanta el pie en el aire 5 cm a mitad del paso, y resuelve el camino del centro de masa cuyo ZMP queda sobre el pie apoyado (modelo carro-mesa, como los generadores de marcha), con IK de pelvis y piernas. 5 s por clip.
  - **Hallazgo:** el centro de masa de la caminata original iba a 21 cm (mediana) de los pies: el cuerpo avanzaba más rápido que los pasos (el pie "patinaba" para seguirlo). El primer intento (corregir el CoM de a poco) divergía; el método de los generadores de marcha converge en 4 vueltas.
  - **Tres controles estaban mal y se arreglaron:** C2 armaba el polígono de apoyo con los centros de las cápsulas del pie (un triángulo de 4×5 cm sin talón); ahora usa sus extremos. C1 decía que la red ve 20 ms adelante (ve 250 ms desde el hackathon) y exigía contacto exacto a un pie sostenido en el aire; ahora mide con la misma tolerancia de 1,5 cm que la referencia y con los motores apuntando adelante su propio retraso (lo que cualquier política aprende). C2 de torque solo falla por motores que cargan el cuerpo (la muñeca saturaba por el sacudón de la pelvis arrastrada, con referencia 0 todo el clip).
  - **Resultado en la caminata:** ZMP fuera del apoyo 87 % → 2 %; pie apoyado que patina 0,25 → 0,01 m/s; C1, C2, C3 y C4 en verde (C4: episodio +60 %, la original +28 %). La original sigue en rojo con los controles arreglados.
  - **Gradiente siempre recortado, arreglado:** el crítico aprende retornos normalizados (media y desvío corridos). Norma del gradiente ~22 → 1-2,4; el crítico explica 95 % de los retornos.
  - **Entrenamiento largo lanzado:** `walk-balanced-v1`, hasta 100 M pasos con corte por meseta, `--shared nice`.

- **Séptima vuelta (sigue sola, cuerpo completo):**
  - **Idiomas en toda la web:** En vivo, Subir, Simulaciones, Teléfono, Red, Sin conexión y Entrega (la más larga: ~150 textos, con su propio selector ES · EN porque los clientes llegan por link). Lo que se dibuja en un idioma (tarjeta del episodio, gráfico de telemetría, HUD, escalera, guía) se redibuja al cambiar sin cortar la repetición; números con la coma o el punto de cada idioma; nombres de mundos y archivos traducidos por id. Recorridas todas las pantallas en inglés: ningún texto en español, sin errores.
  - **`walk-balanced-v1` aprendió la caminata entera:** sigue **11,86 s de 11,85** en **10 M pasos y 21,6 min** (el hackathon: 3,54 s a 20 M y estancado). El detector de meseta lo cortó solo ("done"). Con `training.rung1` (20 episodios desde el principio, con el empujoncito inicial de los resets): **90 % llega al final** (18 de 20, justo en el umbral); con empujones aleatorios solo 5 % (no entrenó con empujones; la prueba de la entrega sí empuja).
  - **Segundo humanoide:** paquetes de robot (`robots/<id>.json` + `training/robot.py`) con el **Unitree H1** de MuJoCo Menagerie (BSD-3; 1,66 m, 51 kg, 19 articulaciones, sin manos; motores de torque convertidos en servos PD con las ganancias de Unitree). `training.retarget` pasa un movimiento de un robot a otro (puntos escalados por la pierna, brazos por dirección de segmento, pies apoyados clavados): G1 → H1 con pies a 0,4 cm y pie apoyado que patina 0,011 m/s. `training.balance` ahora lee el paquete (en el G1 da el mismo archivo, byte a byte): ZMP del H1 fuera del apoyo 61 % → 2 %. `training.feasible` hace las preguntas físicas de C1/C2 a cualquier robot y coincide con `checks` en el G1. El entorno de entrenamiento también lee el paquete (G1: mismas observaciones y recompensas, diferencia 0,0).
  - **No funcionó / falta:** el H1 equilibrado toca el piso cuando la referencia dice el 76 % del tiempo (C1 pide 80 %): ~24 % de los cuadros el pie queda 2-4 cm arriba con la pelvis sostenida, con cualquier adelanto de motores. Sin resolver. Bug mío en el camino: la salida del H1 pisó el archivo equilibrado del G1 (mismo `clip_id`); restaurado, y ahora el id lleva el robot.
  - Decisión: el segundo robot copia el movimiento ya limpio del G1 en vez de rehacer el retargeting desde la persona; el retargeting directo persona → cualquier robot queda para la captura 2.0.

- **Octava vuelta (escalón 1 de la caminata):**
  - **Segunda semilla** (`walk-balanced-v1-seed1`): también sigue la caminata entera (11,86 s, 10 M pasos, 23,4 min), pero solo **25 %** de los arranques con empujoncito llegan al final. Escalón 1: 1 de 2 semillas, **no pasa**. Causa: ninguna entrenó con arranques perturbados.
  - **`--robust`** (`ea9b41b`): el mimic entrena con arranques con empujoncito y empujones de 0-300 N.
  - **No funcionó:** afinar las dos semillas 10 M pasos con empujones de 0-300 N desde el primer paso **las arruinó**: 5 % llega al final en calma (antes 90 % y 25 %), 0 % con empujones; la semilla 0 seguía el clip entero a 1 M pasos y lo perdió a 3 M. Empujones de esa fuerza en una caminata, sin rampa, borran lo aprendido.
  - **Solo con el empujoncito** (`--robust --push-max 0`, 5 M pasos por semilla, desde los checkpoints originales) **tampoco**: semilla 0 65 %, semilla 1 0 %. La evaluación saltaba entre el clip entero y 1 s de una medición a la siguiente.
  - **Causa encontrada en la salud del entrenamiento:** la tasa de aprendizaje fija (3e-4) daba cambios de política cada vez más grandes a medida que la red se volvía precisa: KL por actualización 0,003 al principio de `walk-balanced-v1`, 0,087 a los 10 M pasos, 55 % del lote recortado. Lo descartado: el normalizador de observaciones (cambia la política en KL 0,0000006).
  - **Arreglo (`2d7fe26`):** tasa adaptativa por KL (la regla de rsl_rl, el entrenador de legged_gym): sube o baja ×1,5 tras cada minilote para mantener KL ≈ 0,01, piso 1e-6 (con el piso de rsl_rl, 1e-5, el KL seguía en 0,02). `--fixed-lr` vuelve a lo anterior. Relanzado: `walk-nudge-v2-seed{0,1}`, y el escalón 1 medido en 1 M, 3 M y 5 M pasos.
  - **Con la tasa adaptativa, la semilla 0 pasa firme:** `walk-nudge-v2-seed0` llega al final desde **100 %** de los arranques con empujoncito en 1 M, 3 M y 5 M pasos (antes 90 %, y oscilando). Con empujones sigue en 5 %.
  - **La semilla 1 no:** 45 % a 1 M, 25 % a 3 M, 5 % a 5 M; el KL estaba en orden (0,012-0,016). Desde la mitad del clip aguanta el 96 % de los arranques; desde el primer cuadro se cae a 1,2 s casi siempre. Los resets se reparten parejo en el clip (~1 de cada 10 cae en el primer segundo), y el escalón 1 y la entrega siempre arrancan en el primer cuadro.
  - **Arreglo:** con `--robust`, 25 % de los resets arrancan en el primer cuadro (`START_SHARE`). Relanzado `walk-nudge-v3-seed1` desde el checkpoint original.
  - Error mío: un `git checkout` de `training/experiments.csv` borró las filas de `walk-nudge-v1`; reconstruidas desde sus `evals.csv` (marcadas en la nota).
  - La Mac se pasó a batería a mitad del entrenamiento: el guardián lo pausó y siguió solo al enchufarla.

## Sigue

- Resultado de `walk-nudge-v1-seed{0,1}` para cerrar el escalón 1.
- Entrenar la caminata con empujones, subiendo la fuerza de a poco (curriculum); la entrega la prueba empujando.
- Entrenar el H1 en su caminata equilibrada y resolver el 76 % de contacto.
- Medir pasos/s y perfilar (bloque 2), con la Mac libre.
- Pasar `training.balance` a correr y a jumping jacks (tienen vuelo: hace falta fase sin apoyo).
- Medir la fluidez de la web con el panel visible (ningún cuadro > 50 ms).
- Captura 2.0: preguntar a Juan por la licencia de SMPL-X (no comercial) antes de usarla.
