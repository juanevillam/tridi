# Evaluación Técnica R3: Conteo de Puntos y Articulaciones del Tracking Humanoide en Tridi (`data/` + `physics/` + `web/`)

> **CONFIDENCIAL / USO INTERNO (`juanevillam/tridi`)**
> **Para:** Juan, Pastor, César y Ale
> **Fecha:** 25 de noviembre de 2026
> **Objetivo:** Evaluar técnicamente si el esquema actual de tracking humanoide en Tridi (video renderizado 2D, esqueleto 3D `SkeletonView` y `PoseClip` v1/v2) utiliza la cantidad correcta de puntos y articulaciones frente a la anatomía humana y a los grados de libertad (DoFs) reales de los robots humanoides (`Unitree G1` y `Unitree H1`).

> **Convención de evidencia en este documento:**
> - **Medido en Tridi:** conteos exactos, índices, penalizaciones y líneas verificadas en `data/`, `physics/`, `web/` y `docs/contrato.md`.
> - **Referencia de literatura / biomecánica:** grados de libertad anatómicos del esqueleto humano (Zatsiorsky / Latash) y parametrización estándar SMPL-X / MANO.

---

## 1. Veredicto Técnico Directo

> **Respuesta corta:** **SÍ, la cantidad bruta de puntos de Captura 2.0 (`33` puntos de cuerpo + `2 × 21` puntos de manos = `75` landmarks en `PoseClip` v2) es cuantitativamente suficiente** para imitar las articulaciones físicas disponibles en el **`Unitree G1` (`29` DoFs actuados + `22` dedos cosméticos Inspire / `14` Dex3)** y en el **`Unitree H1` (`19` DoFs actuados)**.
>
> **Sin embargo, el pipeline actual NO aprovecha correctamente esa capacidad y requiere 4 ajustes arquitectónicos concretos** porque: (1) descarta rotaciones 3D y vértebras de SMPL-X al proyectar a `33` posiciones, (2) muestra conteos incompatibles entre overlays 2D (`22` puntos), esqueleto 3D (`41 + 42` con `8` puntos sintéticos) y robot (`29`/`19` DoFs), (3) desactiva las `42` articulaciones de mano en captura móvil (`#/camera`), y (4) no simula dedos ni cuello en física (`0` DoFs actuados).

---

## 2. Auditoría Completa Etapa por Etapa en Tridi (*Medido en Tridi*)

La tabla siguiente consolida los conteos exactos verificados en cada etapa desde el video de entrada hasta los actuadores en MuJoCo:

| Etapa del Pipeline | Archivo y Líneas Verificadas | Conteo Exacto e Índices | Qué se Descarta o Sintetiza |
| :--- | :--- | :--- | :--- |
| **1. Detección y tracking 2D** | `data/track.py:1, 33, 58, 87-98` | **`17` keypoints COCO** (`[17, 3]`: `x, y, conf`) con YOLO11-pose + ByteTrack | Clase persona (`classes=[0]`), `MIN_PRESENCE = 0.2`, *track stitching* (`1,0 s`, `1,0×` altura). |
| **2. Levantamiento 3D v1 (Video)** | `data/lift.py:24, 63, 69-70, 183-187, 226-229` | **`12` articulaciones compartidas** (`COCO_TO_MP`: `{5:11, 6:12, 7:13, 8:14, 9:15, 10:16, 11:23, 12:24, 13:25, 14:26, 15:27, 16:28}`) → **`33` landmarks MediaPipe** (`heavy`) `[F, 33, 4]` + `joints2d [F, 33, 3]` | Cara (`0..10`) excluida de `COCO_TO_MP` (`:23`), `MAX_DISAGREEMENT = 0.15` (`:32`), `MIN_VISIBILITY = 0.5` (`:36`), filtro Savitzky-Golay `0,4 s / 0,6 s`. |
| **3. Captura 2.0 Cuerpo (GVHMR)** | `data/capture2/to_poseclip.py:52-69, 186, 197, 243, 307-312` | SMPL-X genera **`127` articulaciones** `[F, 127, 3]`, `global_orient` (`[F, 3]`, raíz `1`) + `body_pose` (`[F, 63]` = **`21` articulaciones × 3**) = **`22` rotaciones de cuerpo** → mapeadas a **`33` puntos MediaPipe** vía `MEDIAPIPE_FROM_SMPLX` (`:54-69`) | Colapsa ojos (`1-3 → 57`, `4-6 → 56`), boca (`9-10 → 55`) y **omite** vértebras SMPL-X (`3, 6, 9`), cuello (`12`), cabeza (`15`), clavículas (`13, 14`) y torsiones axiales al llenar `joints`. |
| **4. Captura 2.0 Manos (WiLoR)** | `data/capture2/wilor_mac.py:16-18, 69-70, 99-105`; `to_poseclip.py:73-82, 96, 172-232` | **`15` articulaciones MANO por mano** (`[F, 15, 3, 3]`, `2 × 15 = 30`) + orientación de muñeca + **`21` keypoints 3D por mano** (`2 × 21 = 42`) | Filtradas con `MAX_WRIST_IMAGE_DIST = 0.30` (`:96`); reemplazan muñecas SMPL-X (`20, 21`) y actualizan puntas MediaPipe (`17..22`). |
| **5. Contrato `PoseClip` v1 / v2** | `docs/contrato.md:45, 53, 59, 63, 86-92, 108-119`; `to_poseclip.py:455-471` | **v1:** `33` puntos MediaPipe (`[F, 33, 4]`).<br>**v2:** `33 + 2 × 21` = **`75` landmarks** + `foot_contact [F, 2]` + `.npz` con `smplx_betas [10]`, `smplx_transl [F, 3]`, `smplx_global_orient [F, 3]`, `smplx_body_pose [F, 63]`, `smplx_left/right_hand_pose [F, 45]` | Búsqueda en todo el repo confirma **0 lectores downstream** de los arreglos `smplx_*` en `physics/`, `training/` o `web/`. |
| **6. Overlays 2D sobre Video** | `data/overlay.py:22-25, 65`; `data/live/src/draw.js:4-7, 31`; `web/scripts/make-video-overlay.py:20`; `web/src/video-overlay.js:23-26, 82-87` | **`22` puntos dibujados** (`11..32`: hombros a dedos del pie) y **`18` huesos** (`make-video-overlay.py` guarda `23` pts `[0, 11..32]`, pero `video-overlay.js:83` filtra `p < 11`) | Sin puntos de cabeza/cuello ni columna, y **0 puntos de manos** (`2 × 21` omitidos en overlay 2D). |
| **7. Captura en Vivo (`#/live` y `#/camera`)** | `web/src/screens/live.js:358-359`; `web/src/screens/phone.js:16-18, 161-162`; `data/live/src/index.js:78, 109-121, 253-266` | **Desktop (`#/live`):** modelo `full` (`33`) + HandLandmarker (`2 × 21` = `75`, `HAND_TO_WRIST = 0.20`).<br>**Teléfono (`#/camera`) y pantallas chicas (`live.js:359`):** modelo `lite` (`33`), **`hands: false`** (`480×360`, `24 fps`) | Móvil y pantallas pequeñas descartan por completo los **42 landmarks** de las manos. |
| **8. Visor Esqueleto 3D (`SkeletonView`)** | `web/src/skeleton.js:10-35, 114-123, 227-311` | **`41` puntos de cuerpo** (`TOTAL_BODY_JOINTS = 41`: `33` MediaPipe + **`8` puntos sintéticos de tronco `33..40`** vía `mix()`, ocultando `11` puntos faciales `0..10` y sustituyéndolos por `1` esfera cabeza + `1` cilindro cuello) + **`42` puntos de mano** (`2 × 21`, muñeca `0` oculta); **`39` huesos cuerpo + `46` huesos manos + `1` cuello** | Los `8` puntos de tronco (`33` sacro, `34` L3, `35` T8, `36` C7, `37-38` clavículas, `39-40` flancos costales) son interpolaciones lineales (`mix()`) de caderas (`23, 24`) y hombros (`11, 12`), **no mediciones reales de columna**. |
| **9. Retargeting (`retarget.js`)** | `physics/src/retarget.js:17, 28, 35, 40, 45, 61-75, 80-113, 325-494` | Lee únicamente `33` puntos + `hands` opcional (`2 × 21`). Emite `qpos` de G1 de tamaño **`36`** (`7` pelvis flotante + **`29`** articulaciones). Penalizaciones: `JOINT_PENALTY = 0.0005`, `HIP_TWIST = 0.02`, `SHOULDER_TWIST = 0.05` (`0.005` de frente), `WRIST_ROLL = 0.02`, `WAIST_TWIST = 0.2` | Reconstruye todos los ángulos mediante IK por descenso de coordenadas de 6 iteraciones sobre posiciones 3D, ignorando `smplx_body_pose`. Línea `:17`: sin cabeza ni dedos físicos. |
| **10. Robots Físicos y Manos Cosméticas** | `physics/models/unitree_g1/g1_mjx.xml:366-400`; `physics/models/unitree_h1/h1.xml:67-242`; `physics/models/inspire/hands.json:8-238`; `physics/models/dex3/hands.json:17-400`; `physics/src/fingers.js:17-32`; `physics/src/dex3.js:1-117`; `physics/src/index.js:43-49, 306-319` | **Unitree G1:** **`29` DoFs actuados** (`6×2` piernas + `3` cintura + `7×2` brazos), **`0` cuello/cabeza**, **`0` dedos del pie**, **`0` dedos físicos**. Manos cosméticas visuales: **Inspire (`2 × 11 = 22` DoFs)** o **Dex3 (`2 × 7 = 14` DoFs)**.<br>**Unitree H1:** **`19` DoFs actuados** (`5×2` piernas sin `ankle_roll` + `1` torso yaw sin `waist_roll/pitch` + `4×2` brazos sin muñecas), **`0` cuello/cabeza**, **`0` dedos del pie**, **`0` manos**. | `dex3.js:3-4`: `"Only drawn: the physics model and the policies keep the 29 joints without hands"`. Las manos Inspire/Dex3 solo rotan grupos visuales Three.js, sin colisión ni torques en MuJoCo. H1 carece de retargeter dedicado. |

---

## 3. Comparación Frente a la Anatomía Humana y Grados de Libertad del Robot

| Dominio Anatómico / Articular | Anatomía Humana (*Referencia de literatura*) | Tracking en Tridi (`PoseClip` v2 / `SkeletonView`) (*Medido en Tridi*) | `Unitree G1` (`g1_mjx.xml` + Inspire) (*Medido en Tridi*) | `Unitree H1` (`h1.xml`) (*Medido en Tridi*) | Brecha Real |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Esqueleto completo (total DoFs cinemáticos)** | **`~244` DoFs** (147–148 articulaciones; Zatsiorsky / Latash) | `75` landmarks (`33 + 2×21`) / `83` nodos visuales (`41 + 42`) | **`29` DoFs físicos** + `22` cosméticos | **`19` DoFs físicos** | La reducción de `~244 → 29/19` está dictada por el hardware del robot, no por falta de landmarks. |
| **Macro-articulación funcional (locomoción + brazos)** | **`~40–50` DoFs primarios** | `33` landmarks cuerpo (`22` rotaciones en SMPL-X `.npz`) | **`29` DoFs** (`12` piernas + `3` cintura + `14` brazos) | **`19` DoFs** (`10` piernas + `1` torso + `8` brazos) | `33` puntos bastan para `29/19` DoFs si se preservan las rotaciones axiales. |
| **Columna y tronco** | `~24` vértebras móviles (`~50+` micro-DoFs; `3–6` DoFs macro) | `0` vértebras medidas en `joints` (vienen de SMPL-X `3,6,9` pero se descartan; `SkeletonView` interpola `8` por `mix()`) | **`3` DoFs** en una sola articulación (`yaw, roll, pitch` de cintura) | **`1` DoF** (`torso` yaw únicamente; sin pitch ni roll) | En G1 basta orientar hombros respecto a caderas; las `8` vértebras de `SkeletonView` son cosméticas. |
| **Cabeza y cuello** | `~7` DoFs cervicales (`3` macro: yaw, pitch, roll) | `11` pts cara (`0..10` MediaPipe) → `1` cabeza + `1` cuello en `SkeletonView`; `0` pts en overlay 2D (`11..32`) | **`0` DoFs** (cabeza rígida fijada a `torso_link`) | **`0` DoFs** (sin articulación de cuello) | Hardware no mueve cabeza (`retarget.js:17`). |
| **Piernas y pies** | `~14+` DoFs macro (sin contar falanges del pie) | `12` pts (`23..32` + cadera/rodilla/tobillo/talón/punta) | **`12` DoFs** (`6×2`: cadera `3`, rodilla `1`, tobillo `2`; **`0` dedos del pie**) | **`10` DoFs** (`5×2`: sin `ankle_roll`; **`0` dedos del pie**) | Suficiente en `PoseClip`; talón+punta (`29..32`) permiten detectar `foot_contact`. |
| **Manos y dedos** | **`~20–27` DoFs por mano** (`40–54` ambas manos) | **`42` landmarks** (`2 × 21` WiLoR / MediaPipe) + **`30` rotaciones MANO** (`2 × 15`) en `.npz` | **`0` DoFs físicos** (`22` Inspire / `14` Dex3 solo visuales en Three.js) | **`0` DoFs** (ni físicos ni visuales) | Suficiente en Capture 2.0 desktop; **ausente en `#/camera`** y **ausente en física MuJoCo**. |

---

## 4. Los 4 Vacíos Arquitectónicos y Ajustes Concretos Requeridos

Aunque el conteo nominal `33 + 2 × 21 = 75` puntos es **correcto y suficiente** en orden de magnitud, los datos reales del repositorio revelan **cuatro desalineaciones** que explican por qué ciertos gestos (torsiones de brazo/cintura, vistas de perfil, captura móvil y manipulación con contacto) pierden fidelidad:

### 4.1 Pérdida de rotaciones SMPL-X y columna al proyectar a `33` puntos (`to_poseclip.py` → `retarget.js`)
- **Hallazgo (*Medido en Tridi*):** `GVHMR + WiLoR` calculan con precisión los ángulos 3D reales en `smplx_body_pose` (`[F, 63]` = 21 articulaciones × 3 ejes) y `smplx_global_orient` (`[F, 3]`), incluyendo vértebras (`3, 6, 9`), cuello (`12`), cabeza (`15`), clavículas (`13, 14`) y torsiones axiales de húmero/fémur/antebrazo. Sin embargo, `data/capture2/to_poseclip.py:54-69` proyecta esos resultados a `33` posiciones cartesianas (`MEDIAPIPE_FROM_SMPLX`), y **`grep` en todo el repositorio confirma `0` lectores de `smplx_*` en `physics/`, `training/` y `web/`**.
- **Consecuencia:** `physics/src/retarget.js` tiene que re-inventar las torsiones axiales a partir de puntos en el espacio usando penalizaciones heurísticas (`WAIST_TWIST_PENALTY = 0.2`, `SHOULDER_TWIST_PENALTY = 0.05`, `HIP_TWIST_PENALTY = 0.02`), lo que degrada giros rápidos de muñeca/brazo o torsiones de tronco. Además, `SkeletonView` (`web/src/skeleton.js:243-252`) fabrica `8` puntos de tronco (`33..40`) mediante interpolación lineal `mix()`, mostrando curvatura lumbar/torácica visualmente rígida en lugar de usar las vértebras reales de SMPL-X.
- **Ajuste recomendado:** Añadir un camino directo de retargeting rotacional en `retarget.js` cuando el clip contenga `smplx_body_pose` / `smplx_global_orient` (mapeando las rotaciones SMPL-X de hombros, codos, muñecas, caderas y cintura directamente a los ejes del G1 antes del refinamiento IK), y poblar los puntos de tronco (`33..36`) de `SkeletonView` con los nodos `3, 6, 9, 12` reales de SMPL-X cuando existan en v2.

### 4.2 Discrepancia visual entre Overlays 2D (`22` pts), `SkeletonView` (`41 + 42`) y Robot (`29`/`19` DoFs)
- **Hallazgo (*Medido en Tridi*):** Los overlays 2D sobre el video (`data/overlay.py:22-25`, `data/live/src/draw.js:4-7`, `web/src/video-overlay.js:82-87`) dibujan únicamente **`22` puntos (`11..32`) y `18` huesos** (omitiendo cabeza/ojos/boca y las `42` articulaciones de las manos), mientras el panel 3D contiguo (`SkeletonView`) dibuja **`41 + 42 = 83` nodos (`39 + 46 + 1 = 86` huesos)** con torso multi-segmento, cabeza/cuello articulados y dedos completos.
- **Consecuencia:** El usuario percibe visualmente que la captura 2D "no tiene manos ni cabeza", que el esqueleto 3D "sí tiene columna multi-vértebra y cuello", y luego ve que el G1 en MuJoCo no gira la cabeza ni flexiona la espalda por partes (`3` DoFs en cintura, `0` en cuello).
- **Ajuste recomendado:** Dibujar también los landmarks de mano (`2 × 21`) y un indicador minimalista de cabeza (`nose` `0` + `ears` `7,8`) en los overlays 2D cuando estén presentes en el clip (`hands !== null`), y documentar/etiquetar claramente en Studio los grados sintéticos o cosméticos frente a los grados actuados del robot.

### 4.3 Techo físico del hardware: `0` DoFs físicos de dedos, cuello y dedos del pie, más brecha del `H1`
- **Hallazgo (*Medido en Tridi*):**
  - El **`Unitree G1`** en `g1_mjx.xml` tiene **`0` DoFs de cuello/cabeza**, **`0` DoFs en dedos del pie** y **`0` DoFs de dedos actuados en física** (`fingers.js` y `dex3.js` mueven únicamente mallas visuales Three.js; el simulador de contacto ve una única cápsula/esfera rígida de palma).
  - El **`Unitree H1`** (`h1.xml`) tiene solo **`19` DoFs**: carece de `ankle_roll` (`2` DoFs), `waist_roll` y `waist_pitch` (`2` DoFs), y de las **6 articulaciones de muñeca** (`3 × 2`), además de no contar con retargeter propio ni manos visuales.
- **Consecuencia:** Ningún incremento en el número de puntos del tracker humano hará que el G1 mueva la cabeza o agarre un objeto físicamente con los dedos si no existen cuerpos/actuadores en el MJCF.
- **Ajuste recomendado:** Para **locomoción y gestos abiertos**, `29` DoFs + manos cosméticas Inspire (`22` DoFs visuales) es la combinación correcta. Cuando Tridi pase a políticas de **manipulación con contacto fino (agarre de vasos, herramientas o perillas)**, será obligatorio habilitar las articulaciones físicas de `Inspire` o `Dex3` dentro del XML de MuJoCo con `<pair>` de fricción explícitos en falanges — momento en el cual los `2 × 21 = 42` puntos de `WiLoR` ya capturados por `PoseClip` v2 sí pasarán a alimentar control físico real.

### 4.4 Punto ciego móvil (`#/camera`) y errores de escala en v1 (`MediaPipe` solo)
- **Hallazgo (*Medido en Tridi*):** En captura remota desde teléfono (`web/src/screens/phone.js:161-162`) y pantallas pequeñas (`web/src/screens/live.js:359`), Tridi fija `model: 'lite'` (`480×360`, `24 fps`) y **`hands: false`** para ahorrar ancho de banda y cómputo. Paralelamente, la captura v1 (`data/lift.py`) con MediaPipe puro sufre errores de escala global de `10–20 %` (`data/README.md:99`) y colapso de profundidad en tomas frontales (`data/README.md:97`).
- **Consecuencia:** Cualquier sesión grabada desde `#/camera` transmite solo `33` puntos (`0` articulaciones de mano/dedos), degradando la calidad de muñecas y dejando inertes los `22` DoFs cosméticos de Inspire.
- **Ajuste recomendado:** Mantener `hands: false` por defecto en `#/camera` para fluidez de `24 fps` en locomoción, pero añadir un toggle explícito **"Manos / Manipulación (`+42` pts)"** cuando el usuario grabe tareas de tren superior cercano; y priorizar `Capture 2.0` (`GVHMR + WiLoR`) sobre `lift.py` v1 siempre que exista servidor GPU disponible.

---

## 5. Conclusión Final

| Pregunta | Veredicto Técnico |
| :--- | :--- |
| **¿Usa Tridi la cantidad correcta de puntos/articulaciones hoy?** | **SÍ en conteo bruto (`33` cuerpo + `2 × 21` manos = `75` puntos en `PoseClip` v2)** frente a los `29` DoFs actuados (+ `22` dedos visuales) del `Unitree G1` y `19` DoFs del `Unitree H1`. Añadir más keypoints cartesianos al cuerpo (p. ej. 60+ marcadores ópticos) no desbloquearía más articulaciones en G1/H1. |
| **¿Qué falta para fidelidad completa?** | **4 ajustes de cableado y fidelidad, no de conteo de puntos:** (1) leer `smplx_body_pose` / `smplx_global_orient` directamente en `retarget.js` y usar vértebras reales en `SkeletonView`; (2) alinear los overlays 2D (`22` pts) con cabeza/manos cuando existan; (3) añadir actuadores físicos de dedos (`Dex3`/`Inspire`) al MJCF cuando se entrenen tareas de agarre; y (4) habilitar modo opcional `hands: true` en `#/camera` para manipulación cercana. |
