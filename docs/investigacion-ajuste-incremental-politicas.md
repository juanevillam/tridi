# Investigación Técnica R1: Ajuste Incremental y Modular de Políticas de Control (`training/` + `physics/`)

> **CONFIDENCIAL / USO INTERNO (`juanevillam/tridi`)**
> **Para:** Juan, Pastor, César y Ale
> **Fecha:** 25 de noviembre de 2026
> **Objetivo:** Diagnosticar la causa exacta de la inclinación lateral del torso en `g1-stand.onnx` y evaluar la viabilidad técnica y arquitectura óptima para corregir fallos puntuales en políticas de Tridi (postura de tronco en `stand`, movimiento de brazos/manos en `mimic`) de forma incremental sin reentrenar desde cero ni romper el runtime de `onnx-lite.js` / `export_mcu.py`.

> **Convención de evidencia en este documento:**
> - **Medido en Tridi:** valores inspeccionados directamente en código, checkpoints, `training/experiments.csv`, `training/runs/stand-300m/*` o rollouts reales en MuJoCo.
> - **Referencia de literatura / modelo:** propiedades matemáticas o prácticas estándar de PPO / LoRA / control residual.
> - **Estimación de ingeniería en M2 16 GB:** proyecciones de tiempo de cómputo basadas en el throughput medido del `VecEnv` de Tridi (`~8.725–11.200 pasos/s`).

---

## 1. Diagnóstico del Estado Actual y Restricciones del Stack de Tridi

Antes de comparar estrategias de ajuste incremental, es necesario fijar las restricciones exactas de la arquitectura de entrenamiento y despliegue en Tridi.

### 1.1 Arquitectura exacta y conteo de parámetros de `ActorCritic` (*Medido en Tridi*)

En `training/ppo.py:81-170`, todas las políticas de humanoides comparten la misma clase `ActorCritic`:
- `self.norm = RunningNorm(obs_dim)` (`ppo.py:81-101`): buffers `mean` `(obs_dim,)`, `var` `(obs_dim,)`, `count` `(1,)`, normalizando con recorte simétrico `torch.clamp(..., -5, 5)`.
- `mlp(inp, out, hidden=(256, 128, 64))` (`ppo.py:104-110`): `Linear(inp, 256) → ELU → Linear(256, 128) → ELU → Linear(128, 64) → ELU → Linear(64, out)`.
- `self.log_std` (`ppo.py:121`): vector entrenable de tamaño `nu` inicializado en `ln(0.5) ≈ -0.6931` (`INIT_LOG_STD`, `ppo.py:65`).
- `self.ret_norm = RunningNorm(1)` (`ppo.py:126`): normalización de retornos para el crítico.

| Configuración (`Unitree G1`, `nu = 29`) | Capa `L0` (`inp → 256`) | Capas ocultas (`256 → 128 → 64`) | Cabeza `L6` (`64 → 29`) | Params Actor | Params Critic (`64 → 1`) | Total entrenable (+ `log_std` = `29`) | Buffers (`norm` + `ret_norm`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`stand` base (`obs_dim = 93`)** | `24.064` | `41.152` (`32.896 + 8.256`) | `1.885` | **`67.101`** | `65.281` | **`132.411`** | `187 + 3 = 190` |
| **`stand` + `--sense-velocity` (`obs_dim = 96`)** | `24.832` | `41.152` (`32.896 + 8.256`) | `1.885` | **`67.869`** | `66.049` | **`133.947`** | `193 + 3 = 196` |
| **`mimic` base (`obs_dim = 190`)** | `48.896` | `41.152` (`32.896 + 8.256`) | `1.885` | **`91.933`** | `90.113` | **`182.075`** | `381 + 3 = 384` |
| **`mimic` + `--sense-velocity` (`obs_dim = 193`)** | `49.664` | `41.152` (`32.896 + 8.256`) | `1.885` | **`92.701`** | `90.881` | **`183.611`** | `387 (norm) + 3 (ret_norm) = 390` (`+6` frente a `384` en `obs=190`) |

### 1.2 Mapa de actuadores del `Unitree G1` (`nu = 29`) (*Medido en Tridi*)

Según `physics/models/unitree_g1/g1_mjx.xml:52-60, 366-400`, los 29 actuadores de posición siguen este orden estricto:
- **`0..5` Pierna izquierda:** `left_hip_pitch_joint`, `left_hip_roll_joint`, `left_hip_yaw_joint`, `left_knee_joint`, `left_ankle_pitch_joint`, `left_ankle_roll_joint`.
- **`6..11` Pierna derecha:** `right_hip_pitch_joint`, `right_hip_roll_joint`, `right_hip_yaw_joint`, `right_knee_joint`, `right_ankle_pitch_joint`, `right_ankle_roll_joint`.
- **`12..14` Cintura (`kp=75, kv=2`):** `waist_yaw_joint` `[12]` (`±2,618 rad`, `±88 N·m`), `waist_roll_joint` `[13]` (`±0,52 rad`, `±50 N·m`), `waist_pitch_joint` `[14]` (`±0,52 rad`, `±50 N·m`).
- **`15..21` Brazo y muñeca izquierdos:** `left_shoulder_pitch` `[15]`, `left_shoulder_roll` `[16]`, `left_shoulder_yaw` `[17]`, `left_elbow` `[18]`, `left_wrist_roll` `[19]`, `left_wrist_pitch` `[20]`, `left_wrist_yaw` `[21]`.
- **`22..28` Brazo y muñeca derechos:** `right_shoulder_pitch` `[22]`, `right_shoulder_roll` `[23]`, `right_shoulder_yaw` `[24]`, `right_elbow` `[25]`, `right_wrist_roll` `[26]`, `right_wrist_pitch` `[27]`, `right_wrist_yaw` `[28]`.

### 1.3 Causas verificadas de los fallos actuales en `stand` y `mimic` (*Medido en Tridi*)

#### A. Inclinación lateral del torso en `training/policies/g1-stand.onnx`
Al evaluar `g1-stand.onnx` (`274.751 B`, `obs_dim=96`, MD5 `c136c04575fa48cc0e7ff1bb9d7fde7c`) desde `home_qpos` sin ruido en `G1Env`, el robot alcanza en `t = 3 s` un `waist_roll = +1,28°` (`torso_lat = -0,84°`) y entre `t = 5–10 s` se estabiliza en **`waist_roll = +5,31°`**, `waist_yaw = +7,74°` y **`torso_lat = -5,17°`**. Cuatro hechos explican este comportamiento:

1. **Vacío en `G1Env.reward()` (`training/env.py:298-307`):**
   - El término `"upright"` (`0.4 * exp(-(g[0]**2 + g[1]**2) / 0.04)`) mide únicamente la inclinación de la **pelvis** (`qpos[3:7]`), no la de `torso_link`.
   - El término `"pose"` (`0.2 * exp(-sum((qpos[7:] - default)**2) / 1.0)`) es isotrópico sobre las 29 articulaciones: un sesgo permanente de `0,09 rad` (`~5,2°`) en `waist_roll_joint` (`[13]`) aporta apenas `0,0081` dentro de `sum(dq^2)` (`exp(-0,0081) = 0,991933`), bajando `"pose"` de `0,200000` a `0,198387` (`Δpose = -0,001613`, es decir, una **reducción relativa de `0,81 %` en `"pose"`** y `~0,16 %` de la recompensa total por paso `~1,0`). La política puede desplazar lateralmente el centro de masa del torso para compensar asimetrías de pasos/empujones a costo prácticamente nulo.
2. **Omisión de `--worlds` en el ajuste final `290M → 300M` (`training/experiments.csv:48-49`):**
   - La etapa 3 (`100M → 300M`, `experiments.csv:48`) entrenó con `--worlds plano,piedras,resbaloso,viento --wind-max 6 --std 0.20`, logrando `20.00/20.00 s` y `waist_roll = +2,07°` (`torso_lat = -2,38°`) en `stand-300m-step-300000000.onnx` (MD5 `347825a3755a12364bc611d852b49d36`).
   - La etapa 4 (`290M → 300M`, `experiments.csv:49`) ejecutó `--resume ... --reward ...rate=0.005 --push-min 100 --push-max 360 --std 0.25 --no-export` **omitiendo `--worlds`**. En `ppo.py:243` (`meta["worlds"] = list(worlds) or ["plano"]`), eso confinó los últimos 10 M de pasos a `"plano"` únicamente, reabrió `--std` a `0.25` (tras haber decaído a `0.1009` en `290M`) y redujo la penalización `rate` de `0.01` a `0.005`. El promedio de episodio cayó de `20,00 s` a `17,607 s` en `292M` antes de cerrar en `19,689 s` (`300M`), fijando la asimetría de `+5,31°`, sobrescribiendo `training/runs/stand-300m/step_300000000.pt` con pesos `worlds=['plano']` idénticos a `g1-stand.onnx` (`diff = 0.000000`), y degradando `g1-stand.json` a `"worlds": ["plano"]` (el último `.pt` intacto de 4 mundos en disco es `training/runs/stand-300m/step_280000000.pt`).
3. **Bug de `ret_norm` desactivado para `stand` (`training/ppo.py:380-382`):**
   - `if task != "stand": model.ret_norm.update(...)` mantiene `ret_norm` fijo en `(mean=0, var=1)` durante todo `stand-300m`. Con retornos descontados de `~50–100` en episodios de 20 s, la pérdida del crítico domina los gradientes y eleva `grad_norm` a **`15,96–171,33`** (`health.txt:45` registra `15.96`) frente a `MAX_GRAD_NORM = 1.0` (`training/runs/stand-300m/health.txt:28-78`; `65,65` al final de `progress.csv`), haciendo impreciso cualquier fine-tuning posterior.

#### B. Parche ad-hoc en `mimic` y restricciones de exportación (`policy.js`, `onnx-lite.js`, `export_mcu.py`)
1. **Evidencia de parche runtime (`physics/src/policy.js:678-698`):** Cuando `mimic && sim._inAdvance && !sim.pushUntil`, `act()` ya intercepta los índices `12..14` de la cintura (`0.85*refJ - 0.08*jv`, `0.45*refJ - 0.12*jv`, `min(0.08, 0.55*refJ) - 0.02 - 0.12*jv`) y mezcla los demás grados con un `reflex` de `0.05..0.22` porque la política ONNX pura (`g1-walk.onnx` `375.352 B`, `g1-run.onnx` `372.256 B`) arrastra sesgos posturales fuera de distribución.
2. **Restricción estricta de 17 operadores ONNX:** Tanto el runtime ligero del navegador (`physics/src/onnx-lite.js:205-227`) como el compilador C99 embebido (`training/export_mcu.py:213-395`) soportan **exactamente 17 ops**: `Add`, `Sub`, `Mul`, `Div`, `Max`, `Min`, `Clip`, `Elu`, `Tanh`, `Relu`, `Sin`, `Cos`, `Identity`, `MatMul`, `Gemm`, `Constant`, `Slice` (`Slice` solo 2D con `step === 1` en `onnx-lite.js:194-196`). **No existen `Concat`, `ScatterND`, `ScatterElements`, `Pad` ni `Reshape`.** Cualquier arquitectura incremental debe compilarse únicamente con esos 17 operadores.
3. **Evidencia histórica de `Adaptive KL LR`, `widen` y currículos bruscos (`training/experiments.csv`):**
   - **LR fijo vs `Adaptive KL LR`:** con `LR = 3e-4` fijo (`walk-nudge-v1`, `experiments.csv:7-10`), al estrecharse `std` el KL subió a `0,10` (55 % del batch clipeado) y colapsó la marcha (`11,86 s → 1,08 s`). Con `KL_TARGET = 0.01`, `LR_STEP = 1.5` y `LR_RANGE = (1e-6, 1e-2)` (`ppo.py:70-74`), `walk-nudge-v2-seed0` mantuvo `11,86 s`.
   - **`ActorCritic.widen` (`ppo.py:145-155`):** añadir 3 entradas de velocidad con pesos en cero sobre una caminata ya convergida (`probe-velocity`, `experiments.csv:26-27`) estancó en `0,475` y aprendió **`~10x` más lento** que entrenar desde cero (`walk-vel-seed0`: `10M` pasos, `43,7 min`, `11,86 s`).
   - **Throughput real (`stand-300m/progress.csv`, `ppo.py:617`, `training/README.md:144-145`):** En Apple M2 (8 núcleos, 16 GB), el `VecEnv` alcanza **`8.725 pasos/s`** mediana en modo `shared` (`84.294` updates) y **`10.363 pasos/s`** mediana en `full` (`1.595` updates; hasta `11.200 pasos/s` sin carga compartida en CPU vs `10.100 pasos/s` en MPS, `~10 %` más lento en GPU por transferencia host-device).

---

## 2. Evaluación Comparativa de las 4 Arquitecturas de Ajuste Incremental

La tabla siguiente compara cuantitativamente las cuatro estrategias evaluadas sobre las redes exactas de Tridi (`stand` `96 → 256 → 128 → 64 → 29`, `67.869` params actor; `mimic` `193 → 256 → 128 → 64 → 29`, `92.701` params actor):

| Enfoque | Parámetros entrenables (Actor `stand 96` / `mimic 193`) | Compatibilidad `RunningNorm`, `onnx-lite.js` y `export_mcu.py` | Preservación de habilidades base (piernas / empujones) | Costo de cómputo estimado en M2 CPU (`~10k pasos/s`) | Caso de uso óptimo en Tridi |
| :--- | :---: | :--- | :--- | :---: | :--- |
| **(a) Reward Surgery + KL-PPO (`L_KL = β·KL(π_new \|\| π_old)`) + Adaptive KL LR** | `67.869` (`100 %`) / `92.701` (`100 %`) *(+ crítico)* | **100 % nativa.** Idéntico grafo de 17 ops (`274.751 B` / `375.352 B`), sin cambios en `export.py`. | **Alta** si `β ∈ [0.05, 0.2]`, `RunningNorm` congelado (o EMA baja), `std` moderada (`0.12–0.15`) y los 4 mundos activos. Riesgo de olvido si se omite `--worlds`. | `5M–15M` pasos (`~8–25 min` vs `~9,45 h` para `300M` desde cero: **92–97 % de ahorro**). | **Fallos acoplados de cuerpo entero:** tilt de `waist_roll` en `stand` + recuperación de empujones `250–350 N`. |
| **(b) Residual Policy / Adaptadores por Slice Articular** (`obs → h_res → k`, cero-pad a `29`) | `h_res=32, k=3` (cintura): `3.203` (`4,7 %`) / `6.307` (`6,8 %`)<br>`h_res=32, k=14` (brazos): `3.566` (`5,3 %`) / `6.670` (`7,2 %`) | **100 % nativa con zero-padding estático en la última `Gemm`** (`Gemm → Elu → Gemm → Add`, sin `Concat`/`ScatterND`); **0 ops extra** si es lineal (`64 → k` plegado en `L6`). | **Preservación matemática exacta (100 %)** en las articulaciones no objetivo (`0..11` piernas congeladas); salida inicial nula (`W_out = 0, b_out = 0`). | `2M–6M` pasos (`~3–10 min`). Requiere re-entrenar el crítico por cambio en recompensa. | **Correcciones desacopladas por grupo articular:** braceo en `mimic` (`15..28`) o recorte de cintura (`12..14`) sin tocar marcha. |
| **(c) Tronco Congelado + Ajuste Selectivo de Cabeza (`L6`)** (congelar `L0, L2, L4` + `RunningNorm`) | `L6` completa: `1.885` (`2,78 %` / `2,03 %`)<br>Solo cintura (`12..14`): `195` (`0,29 %` / `0,21 %`)<br>Solo brazos (`15..28`): `910` (`1,34 %` / `0,98 %`) | **100 % nativa.** Cero cambios de grafo ni de tamaño (`274.751 B` / `375.352 B`). | Conserva representaciones previas, pero **no puede aprender dependencias no lineales nuevas** que el tronco de `64` dims ya filtró. | `1M–3M` pasos (`~2–5 min`), pero choca rápido contra un **techo de expresividad** (análogo al fracaso de `widen`). | **Solo ajustes estáticos de offset/ganancia lineal** cuando el error ya es linealmente separable en la capa `64`. |
| **(d) LoRA (`W' = W + (α/r)·B·A`) en capas lineales** | `r=4` (4 capas): `4.084` (`6,0 %`) / `4.472` (`4,8 %`)<br>`r=8` (4 capas): `8.168` (`12,0 %`) / `8.944` (`9,6 %`)<br>`r=8` solo intermedias (`256×128`, `128×64`): `4.608` (`6,8 %` / `5,0 %`) | **Nativa solo tras plegado algebraico al exportar** (`W' = W + (α/r)BA`). Sin plegar duplica los nodos `Gemm`/`MatMul` y agranda el `.onnx`. | **Sin garantía por sí sola:** cada actualización modifica las 29 salidas simultáneamente salvo enmascaramiento de filas en `L6` o `L_KL` adicional. | Prácticamente el **mismo wall-clock** que (a): `>95 %` del tiempo por update está en la física MuJoCo CPU, no en PyTorch backward. | **No recomendada** para MLPs de `~68k–93k` parámetros en simuladores CPU-bound. |

### 2.1 Análisis profundo por enfoque

#### (a) Reward Surgery + KL-Regularized PPO (`L_KL`) + Adaptive KL LR
- **Mecanismo:** Se carga el checkpoint convergido (`--init`), se corrige la función de recompensa (añadiendo términos explícitos en `waist_roll` / `torso_link`) y se agrega un anclaje explícito a la política congelada de referencia `π_old` en la pérdida de PPO (`ppo.py:400`):
  $$\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{clip}} + c_v \mathcal{L}_v - c_e \mathcal{H}(\pi_\theta) + \beta \, D_{\text{KL}}\big(\pi_{\text{old}}(\cdot \mid s) \,\|\, \pi_\theta(\cdot \mid s)\big)$$
  donde para distribuciones gaussianas diagonales de PPO, $D_{\text{KL}}$ tiene forma cerrada analítica y diferenciable respecto a $\mu_\theta$ y $\sigma_\theta$.
- **Diferencia clave frente a `Adaptive KL LR` actual:** Hoy `ppo.py:405-413` ajusta `lr` mirando el KL *entre minibatch y rollout actual* (`KL(π_t || π_{t+1})`), lo que frena saltos bruscos por iteración, pero **no impide la deriva acumulada** tras 1.000 updates respecto al checkpoint inicial `π_0`. El término explícito $\beta \, D_{\text{KL}}(\pi_0 \| \pi_\theta)$ ancla la política base de piernas y balance frente a empujones mientras la nueva recompensa mueve únicamente los grados necesarios para enderezar el torso.
- **Condiciones obligatorias en Tridi:**
  1. **Activar `ret_norm` (o pre-calibrarlo con un rollout inicial):** eliminar la excepción `if task != "stand"` en `ppo.py:380` para bajar `grad_norm` de `15,96–171,33` al rango `< 2`.
  2. **Congelar `RunningNorm` (`model.norm`):** tras 300 M de pasos, las estadísticas de entrada ya están estabilizadas; descongelarlas con un `--std` alto o mundos distintos altera el espacio normalizado visto por las capas profundas.
  3. **Mantener cobertura completa de mundos y `std` contenida:** incluir siempre `--worlds plano,piedras,resbaloso,viento` y reabrir `std` solo a `0.12–0.15` (no `0.25`).

#### (b) Residual Policy / Adaptadores por Slice Articular (`obs → h_res → k`)
- **Mecanismo:** Se congela el actor base $\pi_{\text{base}}(s) \in \mathbb{R}^{29}$ y se entrena un pequeño MLP residual $r_\phi(s) \in \mathbb{R}^{k}$ con la última capa inicializada en cero (`W_{\text{out}} = 0, b_{\text{out}} = 0`), aplicado solo a un subconjunto de índices $\mathcal{I}$ (por ejemplo, cintura `12..14` con $k=3$, o brazos `15..28` con $k=14$):
  $$a(s) = \pi_{\text{base}}(s) + S_{\mathcal{I}}\, r_\phi(s)$$
  donde $S_{\mathcal{I}} \in \{0,1\}^{29 \times k}$ es una matriz de selección constante.
- **Compatibilidad exacta con `onnx-lite.js` y `export_mcu.py` (sin `Concat` ni `ScatterND`):**
  - En lugar de insertar `ScatterND` o `Concat` al exportar a ONNX, la matriz $W_{\text{out}} \in \mathbb{R}^{k \times h_{\text{res}}}$ y el sesgo $b_{\text{out}} \in \mathbb{R}^{k}$ se expanden estáticamente en tiempo de exportación a $\tilde{W}_{\text{out}} = S_{\mathcal{I}} W_{\text{out}} \in \mathbb{R}^{29 \times h_{\text{res}}}$ y $\tilde{b}_{\text{out}} = S_{\mathcal{I}} b_{\text{out}} \in \mathbb{R}^{29}$ (las filas fuera de $\mathcal{I}$ son exactamente `0`).
  - El subgrafo residual resultante en ONNX es simplemente **`Gemm → Elu → Gemm → Add`** sumado a la salida del actor base — **100 % compatible con los 17 operadores** de `onnx-lite.js` y `export_mcu.py`.
  - Si la corrección residual no requiere no-linealidad propia sino una combinación lineal de las características `64` del actor base, puede plegarse algebraicamente en la capa `L6` con **0 operadores adicionales** y el mismo tamaño exacto (`274.751 B` / `375.352 B`).
- **Ventaja estructural en `mimic`:** En `g1-walk`, `g1-run` o `g1-frente`, el controlador de piernas (`0..11`) suele ser frágil ante perturbaciones de gradiente. El adaptador residual por slice garantiza matemáticamente que `Δa[0..11] ≡ 0` en el paso 0 y durante todo el fine-tuning, eliminando la necesidad de reglas rígidas en JavaScript como `policy.js:688-694`.
- **Limitación para `stand`:** Si el tilt del torso en `stand` requiere ajustar simultáneamente el ancho de pisada o compensación en caderas/tobillos (`0..11`) al recibir empujones de `250–350 N`, aislar solo `12..14` impide esa re-coordinación pierna-cintura.

#### (c) Tronco Congelado + Ajuste Selectivo de Cabeza (`L6`: `64 → 29`)
- **Mecanismo:** Se congelan `RunningNorm`, `L0`, `L2` y `L4`, actualizando únicamente los pesos y sesgos de `L6` (`1.885` parámetros totales, o `195` columnas para cintura / `910` columnas para brazos).
- **Por qué tiene un techo de expresividad:** La capa `L6` solo puede formar combinaciones lineales de las 64 neuronas de `L4`. Cuando la función de recompensa original nunca premió corregir `waist_roll` de forma fina ni distinguió un error pequeño de inclinación del torso frente a una perturbación lateral, las activaciones de `L4` comprimen o desechan esa señal. El experimento `probe-velocity` / `walk-vel-seed0` (`experiments.csv:26-27`) ya demostró en Tridi que cuando las capas tempranas subestiman una señal nueva o suprimida, el ajuste limitado a capas finales converge `~10x` más lento o queda estancado.
- **Uso válido:** Únicamente para eliminar un *offset* constante o ganancia lineal pequeña cuando el análisis de activaciones muestra que el error ya es linealmente predecible desde `L4`.

#### (d) LoRA (Low-Rank Adaptation) — Por qué aporta ahorro despreciable en Tridi
- **Aritmética exacta de parámetros:** LoRA reemplaza $W \in \mathbb{R}^{d_{\text{out}} \times d_{\text{in}}}$ por $W + \frac{\alpha}{r} B A$ con $A \in \mathbb{R}^{r \times d_{\text{in}}}, B \in \mathbb{R}^{d_{\text{out}} \times r}$. En un LLM ($d = 4096$), rango $r = 8$ representa $16 / 4096 = 0{,}39\ \%$ de parámetros. En el MLP de Tridi:
  - Capa `256 → 128`: `32.768` pesos base; con $r = 8$, LoRA requiere $8 \times (256 + 128) = 3.072$ pesos (**`9,4 %`**).
  - Capa `128 → 64`: `8.192` pesos base; con $r = 8$, requiere $8 \times (128 + 64) = 1.536$ (**`18,8 %`**).
  - Capa `64 → 29`: `1.856` pesos base; con $r = 8$, requiere $8 \times (64 + 29) = 744$ (**`40,1 %`**, y a $r = 16$ sube a `80,2 %`).
  - Sumando las 4 capas lineales del actor `stand` (`96 → 256 → 128 → 64 → 29`): $r = 4$ entrena **`4.084` (`6,0 %`)** y $r = 8$ entrena **`8.168` (`12,0 %`)**; en `mimic` (`193 → ...`): $r = 4$ entrena **`4.472` (`4,8 %`)** y $r = 8$ entrena **`8.944` (`9,6 %`)**.
- **Cuello de botella físico (por qué no ahorra tiempo real):** En `training/ppo.py:341-404`, cada iteración de `4.096` transiciones ejecuta `20.480` pasos de física MuJoCo en 8 núcleos CPU (`~0,40 s` a `~10.300 pasos/s`), mientras que 5 épocas × 4 minibatches de forward/backward sobre un MLP de `~68k–93k` parámetros toman **`< 5 %`** del tiempo total del update (por eso mismo entrenar en GPU MPS fue `~10 %` más lento que en CPU: `10,1k` vs `11,2k pasos/s`). Reducir los parámetros del actor con LoRA **ahorra prácticamente cero tiempo de reloj**, introduce un cuello de botella de rango y obliga a plegar $W' = W + \frac{\alpha}{r} B A$ antes de exportar para no duplicar `Gemm` en `onnx-lite.js`.

---

## 3. Propuesta de Arquitectura Recomendada para Tridi (Por Pipeline)

No existe una única técnica ganadora para todos los casos: la arquitectura debe corresponder al grado de acoplamiento físico del fallo.

```text
Fallo detectado en evaluación / web
   │
   ├── ¿Acoplado al balance global / piernas? (ej. tilt de waist_roll en stand + empujones 250–350 N)
   │      └──► Fase A: Reward Surgery + KL-PPO (β·KL(π_0 || π_θ)) + Adaptive KL LR
   │           • Base: training/runs/stand-300m/step_280000000.pt (último .pt intacto de 4 mundos)
   │           • Activar ret_norm, congelar RunningNorm, 4 mundos, std 0.12–0.15
   │           • Costo estimado: 5M–15M pasos (~8–25 min en M2 CPU)
   │
   └── ¿Localizado en subconjunto articular? (ej. braceo en mimic 15..28 o trim de cintura 12..14)
          └──► Fase B: Residual Joint-Slice Adapter (obs → h_res=32 → k)
               • Base actor congelada (0..11 piernas intactas por construcción)
               • Exportado con zero-padding en W_out (Gemm → Elu → Gemm → Add)
               • Costo estimado: 2M–6M pasos (~3–10 min en M2 CPU)
```

### 3.1 Pipeline `stand` (`g1-stand.onnx`, `obs_dim = 96`): Solución inmediata al tilt lateral

1. **Punto de partida:** reanudar desde `training/runs/stand-300m/step_280000000.pt` (último checkpoint `.pt` intacto de 4 mundos en disco, `worlds=['plano', 'piedras', 'resbaloso', 'viento']`) con `--worlds plano,piedras,resbaloso,viento` explícito:
   ```bash
   uv run --project training python -m training.ppo \
     --task stand --init training/runs/stand-300m/step_280000000.pt \
     --worlds plano,piedras,resbaloso,viento --sense-velocity --std 0.15
   ```
   - **Distinción crítica de artefactos (`step_300000000.pt` vs `step_280000000.pt` vs `stand-300m-step-300000000.onnx`):** La etapa 4 (`experiments.csv:49`, `--steps 300000000 --no-export` sin `--worlds`) **sobrescribió** `training/runs/stand-300m/step_300000000.pt` con pesos `worlds=['plano']` idénticos a `g1-stand.onnx` (`diff = 0.000000`). Por su parte, `training/runs/stand-300m/stand-300m-step-300000000.onnx`/`.json` (`worlds=["plano","piedras","resbaloso","viento"]`) sobrevivió únicamente como ONNX exportado de etapa 3 (no cargable como checkpoint `.pt` en `ppo.py`). No usar `step_300000000.pt` como base asumiendo inicialización de 4 mundos.
2. **Cirugía de recompensa en `training/env.py` (`G1Env.reward()`):**
   - Añadir penalización específica de roll de cintura y verticalidad de `torso_link` (no solo de la pelvis): p. ej., componente multiplicativo o aditivo exponencial sobre `qpos[7 + 13]` (`waist_roll_joint`) y proyección lateral de gravedad en el cuerpo `torso_link` (`env.py:298-307`), manteniendo el criterio de diseño positivo/acotado del archivo.
3. **Estabilización de PPO (`training/ppo.py`):**
   - Habilitar `ret_norm.update()` para `task == "stand"` (eliminando el salto `if task != "stand"` de `ppo.py:380`, o pre-llenando `ret_norm` durante 1–2 rollouts antes de actualizar pesos) para bajar `grad_norm` de `15,96–171,33` a `< 2`.
   - Congelar `model.norm` (`RunningNorm`) durante el fine-tuning.
   - Incorporar término explícito `beta * kl_to_init` (`β ≈ 0.05–0.15`) respecto a `π_0` junto con `Adaptive KL LR` (`KL_TARGET = 0.01`), abriendo `--std 0.12–0.15`.
4. **Criterio de aceptación (*Medido en Tridi*):**
   - `|waist_roll_joint| < 1,0°` y `|torso_lateral_tilt| < 1,0°` en reposo `0..20 s` desde `home_qpos`, manteniendo `4/4` recuperaciones ante empujones de `250 N` y cobertura declarada `"worlds": ["plano", "piedras", "resbaloso", "viento"]` en `g1-stand.json`.

### 3.2 Pipeline `mimic` (`190/193`-dim): Corrección de brazos/manos y reemplazo del parche JS

1. **Problema a resolver:** evitar tener que reentrenar desde cero (`10M–30M` pasos) políticas completas de locomoción o baile cada vez que `g1-run` o `g1-walk` presenta braceo rígido o desviación de cintura, y retirar eventualmente los overrides manuales de `physics/src/policy.js:688-694`.
2. **Arquitectura recomendada (Residual Joint-Slice Adapter):**
   - Mantener congelado `base_actor` y `RunningNorm`.
   - Instanciar un residual `ResidualSliceHead(obs_dim, h_res=32, indices=[15..28])` (o `[12..14]` para cintura, `[12..28]` para tren superior completo) con `nn.init.zeros_` en su proyección final.
   - Entrenar exclusivamente el residual (+ el crítico `critic` y `ret_norm`) usando la recompensa corregida de postura de brazos/cintura sobre `MimicEnv`. En **2M–6M pasos (`~3–10 min` en M2 CPU)**, las piernas (`0..11`) conservan el 100 % de su estabilidad ante empujones y terrenos irregulares.
3. **Exportación ONNX compatible con navegador y MCU:**
   - Al exportar en `training/export.py`, expandir estáticamente `W_out` (`14 × 32 → 29 × 32`) y `b_out` (`14 → 29`) con filas en cero para los índices congelados y sumar al `actor` base antes de multiplicar por `ACTION_SCALE = 0.25`. El grafo resultante utiliza únicamente `Gemm`, `Elu` y `Add`, ejecutándose sin cambios tanto en `physics/src/onnx-lite.js` (`< 1 ms` en navegador) como en `training/export_mcu.py` (`C99` sin heap).

---

## 4. Conclusión Ejecutiva

1. **Es completamente viable** corregir fallos puntuales de políticas en Tridi de forma incremental con un ahorro estimado de **85–97 % de cómputo** frente a reentrenar desde cero (`~8–25 min` vs `~9,45 h`).
2. **Para `stand` (tilt de `waist_roll`), la solución óptima es Reward Surgery + KL-PPO (`L_KL`) + Adaptive KL LR** corrigiendo el bug de `ret_norm` en `ppo.py:380` y preservando los 4 mundos.
3. **Para `mimic` (brazos/manos y cintura), la solución óptima es un Adaptador Residual por Slice Articular** con zero-padding estático en la exportación ONNX, garantizando preservación exacta de piernas y 100 % de compatibilidad con los 17 operadores de `onnx-lite.js` y `export_mcu.py`.
4. **Se descartan LoRA y Tronco Congelado puro** como estrategias principales: el primero por aritmética desfavorable en MLPs pequeños (`~68k–93k` params) cuyo tiempo de ejecución está dominado (`> 95 %`) por MuJoCo en CPU, y el segundo por su techo de expresividad demostrado en el caso `widen` (`~10x` más lento).
