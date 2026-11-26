# Investigación Técnica R2: Generación de Entornos 3D Simulables desde Fotos con Red Neuronal Local (`data/` + `physics/` + `web/`)

> **CONFIDENCIAL / USO INTERNO (`juanevillam/tridi`)**
> **Para:** Juan, Pastor, César y Ale
> **Fecha:** 25 de noviembre de 2026
> **Objetivo:** Evaluar la viabilidad técnica y proponer una arquitectura ejecutable con redes neuronales locales (sin depender de llamadas constantes a LLMs externos en nube) para convertir fotografías de calles (p. ej. Street View) o interiores (cocinas, depósitos, talleres) en entornos 3D visualmente realistas (`.glb`) y físicamente simulables en MuJoCo (`<geom>` + `<pair>`).

> **Convención de evidencia en este documento:**
> - **Medido en Tridi:** valores inspeccionados en `data/scene.py`, `physics/src/scenes.js`, `g1_mjx.xml`, `web/src/landing/city.js`, `data/server.py`, `data/capture2/README.md` y hardware local (`sysctl` / `sw_vers`).
> - **Referencia de literatura / modelo:** tamaños de parámetros, VRAM y latencias publicados de modelos de visión/3D (`Depth Anything V2`, `UniDepth`, `Metric3D v2`, `DUSt3R`, `MASt3R`, `VGGT`, `YOLO-World`, `Florence-2`, `SAM 2`, `2DGS`, `SuGaR`, `TripoSR`, `TRELLIS.2`, `Hunyuan3D-2`, `CoACD`).
> - **Estimación de ingeniería en M2 16 GB:** proyecciones de latencia y memoria sobre el Apple M2 actual de Tridi basadas en las restricciones reales observadas en `gvhmr_mac.py` y `wilor_mac.py`.

---

## 1. Línea Base en Tridi y Restricciones de Simulación y Despliegue

### 1.1 Qué hace hoy `data/scene.py` y por qué no escala a fotos arbitrarias (*Medido en Tridi*)

El extractor actual de escenas (`data/scene.py`) fue diseñado únicamente como proxy geométrico alrededor de un humano caminando en video:
- **Modelo y entrada:** corre `yolo11m.pt` (`MIN_CONFIDENCE = 0.35`, `data/scene.py:34, 38`) únicamente sobre el **cuadro 0** del video (`read_frame(video, int(lifted.frame_index[0]))` en `data/scene.py:300`).
- **Sin modelo de profundidad (`"plain geometry, no depth model"`, `scene.py:4`):** estima el plano del suelo `(n, d)` promediando los primeros `FLOOR_WINDOW_S = 0.5 s` (`scene.py:85, 118-134`) a partir de los puntos de los pies del sujeto (`FEET = (27..32)`) y la altura torso-cadera del `PoseClip`.
- **Proyección rayo-piso y tabla fija:** solo reconoce **15 clases COCO** en `KINDS` (`chair`, `couch`, `bed`, `dining table`, `toilet`, `refrigerator`, `oven`, `sink`, `bench`, `potted plant`, `suitcase`, `fire hydrant`, `bicycle`, `motorcycle`, `car`, `scene.py:57-76`) con profundidad hardcodeada (ej. `chair: 0.5 m`, `refrigerator: 0.7 m`, `car: 1.8 m`) y heurística de piso cerámico (`TILE_ROOMS = {"refrigerator", "oven", "sink", "toilet"}` → `friction_hint = 0.6`, `scene.py:80-81`). Proyecta la base del bounding box hasta `MAX_DISTANCE_M = 15.0 m` (`scene.py:101`), descarta objetos cortados en el borde inferior (`EDGE_PX = 2`, `scene.py:88, 207-209`), no conoce el `yaw` del mueble y despeja la ruta del humano usando `PATH_CLEARANCE_M = 0.35 m` (`MAX_SHIFT_M = 3.0 m`, `scene.py:96-97, 232-243`).
- **Brecha frente a Street View e interiores reales:** En una foto de Google Street View o de una cocina vacía **no hay persona en cuadro**, por lo que `floor_plane()` falla por completo. Además, las cajas AABB no representan geometría cóncava (puertas abiertas, espacios bajo mesas, encimeras en L, aceras con escalones).

### 1.2 Contrato físico obligatorio de MuJoCo (`physics/src/scenes.js` y `g1_mjx.xml`) (*Medido en Tridi*)

Un error frecuente al pensar en entornos 3D desde fotos es asumir que basta con cargar un `.glb` fotogramétrico en MuJoCo. El stack físico de Tridi lo impide explícitamente por dos razones verificadas:
1. **Colisión por pares explícitos (`physics/models/unitree_g1/g1_mjx.xml:23-24`, `scene_mjx.xml:26-111`):** El modelo del G1 desactiva las colisiones globales por bitmask (`<geom condim="1" contype="0" conaffinity="0"/>`) y nombra sus cuerpos físicos como `*_collision` (`pelvis_collision`, `left_foot_box_collision`, `left_foot1..3_collision`, `torso_collision`, `head_collision`, `left_hand_collision`, etc.).
2. **Inyección en `physics/src/scenes.js:6-8, 75-117`:** `collisionGeoms(robotXml)` extrae todos los `*_collision` y `placeXml()` genera un `<pair geom1="${r}" geom2="${name}" condim="3" friction="${mu} ${mu}"/>` entre **cada geom del robot y cada geom del escenario** (además de pares contra `floor` / `stones` si `movable: true`).
3. **Desacoplamiento visual/físico ya validado (`scenes.js:58-70`, `web/src/props.js`):** Para el clip de sentarse (`SIT_CHAIR_SCENE`), Tridi ya separa el `.glb` visual (`furniture/chair.glb`, `11 KB`) de dos primitivas físicas transparentes (`silla_asiento` + `silla_respaldo` con `rgba` alfa `0`). Asimismo, MuJoCo envuelve cualquier malla única en su **envolvente convexa global** si no se descompone en piezas convexas, lo que bloquearía interiores de habitaciones o huecos bajo mesas.

### 1.3 Presupuesto WebGL, CDN y Hardware Local (*Medido en Tridi*)

- **Render y sombras (`physics/src/viewer.js:38-43`, `web/src/landing/city.js:44-49, 448-455, 575-594`):** `RobotView` ya posee la única luz direccional con mapa de sombras (`this.sun`, `2048×2048` `PCFShadowMap`). Todo entorno nuevo debe usar `castShadow = false` en masa/arquitectura lejana (o sombra única sobre `this.sun`), generar iluminación ambiental con un único `PMREMGenerator(renderer)`, liberar geometrías/materiales/texturas en `undress()` y respetar los corredores `KEEP_CLEAR` (`x ∈ [-9, 12], z ∈ [-7, 1.6]` y `x ∈ [-2.5, 12], z ∈ [-7, 5.8]` en la landing).
- **Límites de Cloudflare Pages (`docs/audit-playbook.md:21`, `web/public/_headers:11-12`):** máximo **`25 MiB` por archivo**; `/models/*` se sirve con caché inmutable (`max-age=31536000, immutable`). Los `23` `.glb` actuales de `web/public/models/kenney/` pesan `1,59 MB` (`1,6 MB`) en conjunto y abarcan `5,3 KB–162,5 KB` (`commercial/building-g.glb` = `166.356 B` = `162,5 KB`), mientras que el subconjunto de `10` muebles en `web/public/models/kenney/furniture/` abarca `5,3 KB–53,1 KB`.
- **Hardware local actual y cuello de botella PyTorch MPS (`sysctl`, `data/server.py`, `data/capture2/README.md`):**
  - Máquina verificada: **`Apple M2`, `8` núcleos, `16 GB` de RAM unificada (`17.179.869.184 B`), `macOS 27.2.1`**.
  - `data/server.py:52-60, 191-193` opera con una cola de **1 solo worker (`work`)** detrás de un túnel `cloudflared` (`data/serve.sh`).
  - `data/capture2/gvhmr_mac.py:87-95` y `wilor_mac.py:60-62` documentan que `torch==2.3.1` en MPS aborta en operaciones de slicing complejas (`subRange.start + subRange.length`), obligando a correr cabezas transformer pesadas en CPU (`~0,6 s/frame` WiLoR).

---

## 2. Arquitectura Propuesta: Pipeline Neuronal Local en 4 Etapas (Cero LLMs Externos)

Para convertir **1 a N fotos** (Street View panorámico/multi-ángulo o interior residencial/industrial) en un paquete doble —**malla PBR `.glb` optimizada para Three.js + escena MuJoCo (`Escenas` JSON + colisionadores convexos MJCF)**— sin depender de APIs de LLMs en la nube, la arquitectura se divide en **4 etapas locales deterministas y neuronales**:

```text
Fotos de entrada (1 imagen monocular o 2–16 vistas Street View / interior)
   │
   ▼ [Etapa A: Geometría Métrica y Plano del Suelo]
   │  • Multi-vista: VGGT (o MASt3R/DUSt3R) → poses de cámara + pointmap denso
   │  • Monocular: Depth Anything V2 + UniDepth / Metric3D v2 (+ escala canónica)
   │  • RANSAC de plano dominante + normal de gravedad → suelo z = 0 y altura
   │
   ▼ [Etapa B: Semántica Open-Vocab + Prior Físico Local (Cero LLMs en Nube)]
   │  • Detección: YOLO-World / Florence-2 (Base 230M)
   │  • Máscaras de instancia: SAM 2 (Tiny/Small) proyectadas a la nube 3D
   │  • Lookup determinista local: clase → {fricción, masa, densidad, movilidad}
   │
   ▼ [Etapa C: Reconstrucción Visual y Completación de Oclusiones]
   │  • Escena multi-vista: 2DGS / SuGaR → TSDF/Poisson → .glb decimado PBR
   │  • Objetos ocluidos/monocular: TRELLIS.2 / TripoSR → .glb por instancia
   │  • Compresión Draco / KTX2 (< 5–15 MiB totales, límite Cloudflare < 25 MiB)
   │
   ▼ [Etapa D: Síntesis de Colisiones MuJoCo y Corredor Transitable]
      • Objetos simples (cajas/cilindros/mesadas): ajuste OBB / cilindro mínimo
      • Geometría cóncava (huecos, sillas, aceras, puertas): CoACD → hulls convexos
      • Salida: Escenas JSON (docs/contrato.md) + placeXml() con <pair> explícitos
```

### 2.1 Detalle técnico por etapa

#### Etapa A — Geometría Métrica, Escala y Alineación a Gravedad (`z = 0`)
- **Caso multi-vista (2–16 fotos, p. ej. barrido de cocina o ángulos de Street View):**
  - **`VGGT` (CVPR 2025, *Referencia de literatura*):** transformer feed-forward que predice en un solo pase cámaras intrínsecas/extrínsecas, mapas de profundidad y nube de puntos 3D (`~0,2–0,5 s` para ~10 imágenes en A100 con FlashAttention; escalado cuadrático $O(N^2)$ mitigado por ventanas en GPUs de `12 GB`).
  - **Alternativa estable en hardware medio: `DUSt3R` / `MASt3R` (*Referencia de literatura*):** emparejamiento denso por pares + alineación global (`~9+ s` para ~10 imágenes en GPU), menos sensible a memoria por cuadro que `VGGT` sin chunking.
- **Caso monocular (1 sola foto de Street View o habitación):**
  - **`Depth Anything V2` (*Referencia de literatura*):** ViT-S (`~25M`, `~0,6 GB` VRAM), ViT-B (`~98M`, `~1,2 GB`), ViT-L (`~335M`, `~2,3 GB`). Sus bloques ViT estándar se ejecutan bien en Apple Silicon MPS/CoreML, aunque produce profundidad **relativa** (afin), no métrica absoluta.
  - **`UniDepth` v1/v2 (`~300M+`, `4–8+ GB` VRAM) o `Metric3D v2` (`200M–600M+`, `4,2–10+ GB` VRAM, *Referencia de literatura*):** predicen profundidad **métrica en metros** e intrínsecas de cámara sin conocer la distancia focal previa; sus bloques de atención cruzada/transformación canónica son más pesados en Apple Silicon MPS que en CUDA.
- **Alineación física:** Un paso geométrico clásico (Open3D / NumPy **RANSAC** sobre normales de superficie cercanas a la vertical estimada por líneas de fuga / horizonte) fija el plano del suelo en `z = 0`, eliminando la dependencia actual de `data/scene.py` de tener pies humanos visibles.

#### Etapa B — Semántica Open-Vocab Local y Tabla Determinista de Física (Sin LLMs Externos)
Para asignar **masa, fricción, restitución y movilidad** sin consultar a un LLM en cada foto:
1. **Detección abierta local:** **`YOLO-World`** (`~10M–100M+` params, `2–6 GB` VRAM, `50–120+ FPS` en GPU) o **`Florence-2-base`** (`230M`, `~1–1,5 GB` VRAM, `~200–650 ms`/imagen en GPU) detectan clases más allá de las 15 de COCO (p. ej. `curb`, `sidewalk`, `cabinet`, `kitchen island`, `stairs`, `tree trunk`, `bollard`, `cardboard box`, `pallet`).
2. **Segmentación precisa:** **`SAM 2`** (`Tiny 38,9M` o `Small 46M`, `4–8 GB` VRAM; `Base+ 80,8M`; `Large 224,4M` `12–16+ GB` VRAM) recorta la máscara exacta de cada objeto para proyectar solo sus píxeles de profundidad 3D, evitando contaminar la nube con el fondo.
3. **Motor determinista local de propiedades físicas (cero tokens, 0 ms de red):** un diccionario estructurado local (extensión directa de `KINDS` y `TILE_ROOMS` en `data/scene.py:57-81`) mapea `(etiqueta_semántica, volumen_3D_medido)` a parámetros de MuJoCo:
   - **Fricción (`mu`):** asfalto/concreto `0,90–1,0`; madera seca `0,75`; baldosa/cerámica (`TILE_ROOMS`) `0,60`; metal pintado `0,45`; charco/hielo `0,25–0,35`.
   - **Masa y movilidad:** objetos estructurales (`wall`, `counter`, `island`, `refrigerator`, `curb`, `lamp_post`, `tree`) se marcan `movable: false`; mobiliario/cargas (`chair`, `box`, `suitcase`, `trash_bin`) calculan masa como $\max(m_{\min},\, \rho_{\text{clase}} \cdot V_{\text{occ}})$ con `freejoint`.

#### Etapa C — Reconstrucción Visual y Completación de Oclusiones (`.glb`)
- **Escena completa (multi-vista):** **`2DGS`** (2D Gaussian Splatting) o **`SuGaR`** (*Referencia de literatura*) alinean los splats a superficies planas/curvas y extraen malla explícita vía fusión TSDF / Marching Cubes / Poisson (`minutos` por escena en `12–24 GB` VRAM CUDA), texturizada en PBR y decimada para Three.js.
- **Completación de objetos ocluidos (monocular o parte trasera no vista):**
  - **`TripoSR`** (*Referencia de literatura*): `~6 GB` VRAM, `< 0,5 s` en A100 / `~2–5 s` en GPU de consumo; genera malla rápida con colores de vértice/textura básica (sin PBR completo).
  - **`TRELLIS` / `TRELLIS.2`** (*Referencia de literatura*, licencia MIT): generación por vóxeles estructurados (`O-Voxel`); `TRELLIS` ~`16 GB` VRAM, `TRELLIS.2` (`4B`) recomienda `24 GB` (`8–12 GB` con *offloading*/slicing), `~45–120 s` en RTX 4090 (`~3–60 s` en H100), exporta **`.glb` PBR nativo**.
  - **`Hunyuan3D-2 / 2.1`** (*Referencia de literatura*): DiT de forma (`~10 GB` VRAM) + pintado PBR multivista (`~21 GB` VRAM, hasta `~29 GB` combinados sin offloading), `~2–5 min` por objeto y licencia comunitaria restrictiva.
- **Post-procesado obligatorio para `web/`:** decimación (`quadric edge collapse`), empaquetado de texturas `KTX2`/`WebP` y geometría Draco manteniendo el bundle por escena muy por debajo del límite de `25 MiB` de Cloudflare Pages (`docs/audit-playbook.md:21`) y compatible con `PMREMGenerator` + luz única `this.sun` de `RobotView`.

#### Etapa D — Síntesis de Colisiones MuJoCo (`CoACD` + `scenes.js`)
1. **Clasificación geométrica:** Objetos convexos simples (mesada recta, caja, poste, refrigerador) se ajustan con **OBB** (Oriented Bounding Box) o **cilindro mínimo** — exacto, rápido y con costo $O(1)$ en el solver de contactos.
2. **Descomposición convexa (`CoACD`):** Para geometría cóncava (sillas con respaldo y patas, mesas pasables por debajo, escalones, muros en L o aceras con rebaje), **`CoACD`** (*Collision-Aware Concave Decomposition*, disponible vía `coacd` + `obj2mjcf`) particiona la malla en un conjunto mínimo de **cascos convexos sin auto-intersección**.
3. **Emisión compatible con `g1_mjx.xml`:** El generador emite las piezas en el formato `Escenas` (`docs/contrato.md:433-470`) o como `<geom type="mesh" ... rgba="... 0"/>` invisibles alineadas al `.glb` visual (mismo patrón validado en `SIT_CHAIR_SCENE`), registrando los `<pair>` explícitos en `scenes.js:87-117` y verificando zonas despejadas equivalentes a `KEEP_CLEAR` (`city.js:44-47`) o `PATH_CLEARANCE_M` (`scene.py:96`).

---

## 3. Análisis Honesto de Hardware: 2 Perfiles Operativos y Viabilidad Real

Separar lo que corre hoy en el hardware de Juan frente a lo que exige GPU CUDA dedicada es crítico para no prometer latencias irreales.

| Dimensión | Perfil 1: Proxy Rápido Local en **Apple M2 (16 GB RAM)** *(Hardware actual de Tridi)* | Perfil 2: Estación / Nodo Local con **GPU CUDA (12–24 GB VRAM, ej. RTX 3090/4090)** |
| :--- | :--- | :--- |
| **Etapa A (Geometría)** | `Depth Anything V2 Small/Base` (`~25M–98M`, `0,6–1,2 GB`) + calibración de escala por priors + RANSAC `z=0` | `VGGT` (`~10` vistas) o `MASt3R` + `UniDepth v2` / `Metric3D v2` (`4–10 GB` VRAM) |
| **Etapa B (Semántica)** | `YOLO-World` o `Florence-2-base` (`230M`, `~1–1,5 GB`) + `SAM 2 Tiny/Small` (`39M–46M`, `4–8 GB`) + tabla física local | `Florence-2-large` (`770M`) + `SAM 2 Base+/Large` (`8–16 GB` VRAM) + tabla física local |
| **Etapa C (Malla Visual)** | **Sin reconstrucción neuronal pesada:** proyección de textura a primitivas/heightfield o assets `.glb` locales reutilizables (estilo Kenney) | `2DGS` / `SuGaR` para malla de escena + `TRELLIS.2` (MIT, PBR `.glb`, `16–24 GB` VRAM) o `TripoSR` (`6 GB` VRAM) para objetos |
| **Etapa D (Física MuJoCo)** | RANSAC plano + ajuste OBB/cilindro + `CoACD` rápido sobre malla proxy (`CPU 8 cores`) | `CoACD` de alta resolución sobre piezas cóncavas + `<geom>`/`<pair>` en `scenes.js` |
| **Memoria pico** | `~6–10 GB` unificados (cabe en `16 GB` manteniendo servidor `data/server.py` operativo) | `12–24 GB` VRAM (con descarga secuencial por etapa si VRAM = `12 GB`) |
| **Latencia por escena** | **`~2–8 s` por escena** *(Estimación de ingeniería en M2 16 GB)* | **`~30 s–4 min` por escena** *(Referencia de literatura/modelo; dominado por `2DGS` y `TRELLIS.2`)* |
| **Viabilidad** | **VIABLE HOY** como reemplazo superior de `data/scene.py` (funciona sin humano en cuadro, estima profundidad y suelo). | **VIABLE EN WORKSTATION DEDICADA** para reconstrucción fotorrealista PBR desde fotos. |
| **Qué NO es viable aquí** | **`2DGS`, `TRELLIS.2` (`4B`) y `Hunyuan3D-2.1` (`~21–29 GB` VRAM)** exceden `16 GB` unificados y sufren fallbacks CPU de PyTorch MPS (`wilor_mac.py`, `gvhmr_mac.py`). | `Hunyuan3D-2.1` sin *offloading* (`~29 GB` pico) excede GPUs de `24 GB`; además su licencia es menos permisiva que `TRELLIS.2` (MIT). |

---

## 4. Los 5 Modos de Fallo Críticos (y Cómo Mitigarlos)

Incluso con modelos neuronales locales de última generación, transformar fotos arbitrarias en simuladores físicos de contacto presenta cinco fallos estructurales que deben tratarse explícitamente en código:

1. **Vidrios transparentes, puertas de cristal y espejos:**
   - *Fallo:* Tanto `Depth Anything V2` como `UniDepth` y `VGGT` estiman la profundidad del objeto *detrás* del cristal o del reflejo *virtual* dentro del espejo, creando huecos transitables donde hay un vidrio sólido o muros fantasma detrás de una pared.
   - *Mitigación:* Detección explícita de clases reflectivas/transparentes (`window`, `glass_door`, `mirror`) en Etapa B (`Florence-2` + `SAM 2`); al detectarlas, ajustar un plano coplanar con el marco adyacente (`RANSAC` en el borde de la máscara) y emitir una pared colisionadora plana en MuJoCo.
2. **Patas delgadas de sillas/mesas, postes finos y cables (`< 3–4 cm`):**
   - *Fallo:* Las redes de profundidad con parches ViT (p. ej. `518×518` px) suavizan o borran patas delgadas, y `CoACD` con umbral de concavidad laxo fusiona patas en bloques sólidos o deja tableros flotando. Los pies del G1 se enganchan o atraviesan apoyos inexistentes.
   - *Mitigación:* Regla híbrida en Etapa D: si `SAM 2` clasifica `chair` o `dining table` con confianza alta, sintetizar colisión compuesta (tablero + patas mínimas de `4 cm` hasta `z = 0`, igual que `SIT_CHAIR_SCENE` en `scenes.js:63-70`) en lugar de confiar ciegamente en `CoACD` sobre una nube ruidosa.
3. **Sombras proyectadas duras e iluminación dinámica (Street View exterior):**
   - *Fallo:* Sombras de árboles, edificios o postes sobre la acera/calzada confunden tanto a detectores como a estimadores monoculares de profundidad, generando falsos bordillos o desniveles en `z = 0` (el mismo riesgo que `data/scene.py:36-37` ya documenta para `conf < 0.35`).
   - *Mitigación:* Filtrado estricto de `RANSAC` plano sobre la máscara semántica de `sidewalk`/`road`/`floor` (forzando planitud local $z = 0$ en regiones de piso continuo independientemente de variaciones de luminancia) y descarte de obstáculos cuya altura 3D sobre el plano no supere `0,04 m` salvo que correspondan a clase `curb` o `step`.
4. **Ambigüedad de escala métrica monocular en Street View (sin humano en cuadro):**
   - *Fallo:* En una foto única sin persona ni baseline estéreo, el campo de visión (`HFOV`) desconocido introduce derivas globales de escala de `±15–35 %`: un bordillo de `15 cm` o una puerta de `2,05 m` pueden reconstruirse a escala `0,7×` o `1,3×`, alterando la física de paso del G1 (`1,3 m` de alto).
   - *Mitigación:* Fusionar la predicción de intrínsecas de `UniDepth`/`Metric3D v2` con **anclas métricas canónicas** de objetos detectados en Etapa B (altura estándar de puerta `2,05 m`, encimera de cocina `0,90 m`, ancho de carril/vehículo `1,80 m`, bordillo `0,15 m`) mediante ajuste robusto (mediana ponderada del factor de escala global).
5. **Vehículos y peatones en movimiento (fantasmas en multi-vista y obstáculos falsos):**
   - *Fallo:* En secuencias de Street View o video casual, autos o peatones que cambian de posición entre cuadros generan estelas ("ghost geometry") en `VGGT`/`2DGS` o paredes sólidas en medio de la vía donde el robot debe caminar.
   - *Mitigación:* Enmascaramiento dinámico previo a la fusión 3D: filtrar las máscaras `SAM 2` de clases móviles (`person`, `pedestrian`, `bicycle`, `dog`, y `car`/`bus` con disparidad inconsistente respecto a poses de `VGGT`) **antes** de `2DGS`/`CoACD`, y validar finalmente la transitabilidad mediante corredores `KEEP_CLEAR` / `PATH_CLEARANCE_M`.

---

## 5. Conclusión y Hoja de Ruta Recomendada para Tridi

1. **Viabilidad confirmada sin LLMs externos:** Todo el razonamiento semántico y físico requerido para simulación MuJoCo puede resolverse localmente combinando visión open-vocab (`YOLO-World` / `Florence-2` + `SAM 2`) con una **tabla determinista de propiedades físicas** (ampliando `KINDS` y `TILE_ROOMS` de `data/scene.py`).
2. **Despliegue en dos perfiles según hardware:**
   - **Corto plazo (en el Apple M2 16 GB actual):** implementar el **Perfil 1 (`~2–8 s/escena`)** con `Depth Anything V2` + `YOLO-World`/`Florence-2` + `SAM 2 Tiny` + `RANSAC` + OBB/cilindro/`CoACD` para sustituir el límite actual de `data/scene.py` (funcionar sin humano en cuadro y en interiores/calles reales).
   - **Mediano plazo (cuando se habilite GPU CUDA local/dedicada de 12–24 GB VRAM):** conectar el **Perfil 2** (`VGGT`/`MASt3R` + `2DGS` + `TRELLIS.2` MIT) para generar mallas PBR `.glb` completas (`< 25 MiB` para Cloudflare Pages) emparejadas con colisiones `CoACD` + `<pair>` explícitos de `scenes.js`.
