# Captura 2.0

Del video al cuerpo humano en 3D anclado al mundo, con dedos (bloque 4 de [`../../docs/plan-v2.md`](../../docs/plan-v2.md)). Reemplaza a MediaPipe + `lift.py` donde hoy falla: el temblor, el avance de frente (≈ 0 m/s) y la falta de dedos.

| Pieza | Para qué | Estado |
| --- | --- | --- |
| [GVHMR](https://github.com/zju3dv/GVHMR) | Cuerpo SMPL-X en el mundo, con gravedad y cámara que se mueve | Corre en la Mac (`gvhmr_mac.py`); `to_poseclip.py` lo pasa a `PoseClip` v1 y la web ya lo usa |
| HaMeR o WiLoR | Manos con dedos (MANO), 15 articulaciones por mano | Sin empezar |
| Fusión → `PoseClip` v2 | Cuerpo + manos en SMPL-X, con contactos | Sin empezar (contrato primero) |

## Licencias

SMPL-X, SMPL, MANO y GVHMR son **no comerciales**. Juan decidió usarlos así (2026-11-04): Tridi v2 es un campo de pruebas. Antes de vender: licencia comercial (Meshcapade) o un modelo de cuerpo abierto ([`../../docs/plan-v2.md`](../../docs/plan-v2.md), sección 10). GVHMR además pide que **las modificaciones de su código se publiquen**: por eso `gvhmr_mac.py` no toca su código, lo importa y lo adapta desde afuera.

## Instalación (una vez)

GVHMR vive fuera del repo, en `~/Code/tridi-thirdparty/GVHMR`, con su propio entorno (fija torch 2.3 y necesita pytorch3d):

```bash
git clone https://github.com/zju3dv/GVHMR ~/Code/tridi-thirdparty/GVHMR
cd ~/Code/tridi-thirdparty/GVHMR && uv venv -p 3.10 .venv && . .venv/bin/activate
uv pip install torch==2.3.1 torchvision==0.18.1 timm==0.9.12 lightning==2.3.0 pytorch-lightning==2.3.0 hydra-core==1.3.2 hydra-zen hydra_colorlog rich numpy==1.23.5 matplotlib "setuptools>=68" tensorboardX opencv-python ffmpeg-python scikit-image termcolor einops imageio==2.34.1 av==13.0.0 joblib trimesh smplx pycolmap ultralytics==8.2.42 lapx yacs wis3d "setuptools<70" scipy==1.13.1
CFLAGS=-Wno-invalid-specialization CXXFLAGS=-Wno-invalid-specialization uv pip install --no-build-isolation "git+https://github.com/facebookresearch/pytorch3d.git@V0.7.8"
```

Lo que no dice su `requirements.txt` y hizo falta en esta Mac (macOS 27, M2):
- `CFLAGS` de pytorch3d: el compilador de Xcode nuevo rechaza un encabezado de torch 2.3 (`is_arithmetic cannot be specialized`).
- `scipy==1.13.1`: la 1.15 no carga en este macOS (`__thread_bss has a zero-fill section type`).
- `setuptools<70` (lightning usa `pkg_resources`), `yacs` y `wis3d` (los importa sin declararlos).

Comprobado (2026-11-04): corre de punta a punta en la Mac. El modelo final de GVHMR va en la CPU: en MPS (torch 2.3) aborta en un recorte de tensor.

**A mano (Juan, en el navegador):** Google Drive no deja bajar los pesos grandes por script, y los modelos de cuerpo piden cuenta. No se usan espejos de terceros: un `.ckpt` o `.pth` puede ejecutar código al cargarse.

1. Del [Drive oficial de GVHMR](https://drive.google.com/drive/folders/1eebJ13FUEXrKBawHpJroW0sNSxLjh9xD), a `~/Code/tridi-thirdparty/GVHMR/inputs/checkpoints/`:
   - `gvhmr/gvhmr_siga24_release.ckpt`
   - `hmr2/epoch=10-step=25000.ckpt`
   - `vitpose/vitpose-h-multi-coco.pth`
   - `yolo/yolov8x.pt`
2. Con cuenta en [smpl-x.is.tue.mpg.de](https://smpl-x.is.tue.mpg.de/): `SMPLX_NEUTRAL.npz` (y `MALE`, `FEMALE`) a `inputs/checkpoints/body_models/smplx/`.
3. Con cuenta en [smpl.is.tue.mpg.de](https://smpl.is.tue.mpg.de/): `SMPL_NEUTRAL.pkl` (y `MALE`, `FEMALE`) a `inputs/checkpoints/body_models/smpl/`.
4. Para las manos, más adelante: cuenta en [mano.is.tue.mpg.de](https://mano.is.tue.mpg.de/), `MANO_RIGHT.pkl`.

## Primer resultado (2026-11-04)

`bailar-01` (10,5 s, de frente, cuerpo entero), con `data.quality` sobre los mismos 33 puntos (`to_joints.py` pasa SMPL-X a los índices de MediaPipe):

| Captura | temblor (m/s²) | pie apoyado que patina (m/s) | pie bajo el piso (cm) | huesos que se estiran | altura (m) |
| --- | --- | --- | --- | --- | --- |
| MediaPipe (hoy) | 11,4 | 0,29 | 0,2 | 9,6 % | 1,56 |
| GVHMR | 11,6 | **0,04** | 0,9 | **0,0 %** | **1,64** |

`jacks-01` (11 s, saltos de tijera, de frente):

| Captura | temblor | patina | bajo el piso | huesos | altura |
| --- | --- | --- | --- | --- | --- |
| MediaPipe (hoy) | 13,4 | 0,28 | 0,3 | 5,7 % | 1,54 |
| GVHMR | 17,4 | 0,31 | 1,1 | **0,0 %** | 1,74 |

Esas dos tablas comparan GVHMR **crudo** contra MediaPipe **suavizado** (`data/smooth.py`). Con el mismo suavizado (`to_poseclip.py`, 2026-11-05), GVHMR gana también en temblor:

| Clip | Captura | temblor | patina | bajo el piso | huesos | altura |
| --- | --- | --- | --- | --- | --- | --- |
| bailar-01 | MediaPipe | 11,4 | 0,29 | 0,2 | 9,6 % | 1,56 |
| bailar-01 | GVHMR | **7,1** | **0,05** | 1,1 | **0,3 %** | 1,63 |
| jacks-01 | MediaPipe | 13,4 | 0,28 | 0,3 | 5,7 % | 1,54 |
| jacks-01 | GVHMR | **11,7** | 0,25 | 1,2 | **0,3 %** | 1,70 |

Lo único que empeora es el pie bajo el piso (~1 cm): lo arregla el refinamiento físico del plan (pies que no patinan ni atraviesan el piso).

**Tiempo:** `jacks-01` de cero, 5,5 min para 11 s de video (~30× el tiempo real): seguir a la persona 42 s, ViTPose 2,6 min, el resto el extractor de rasgos y la odometría. Cabe de sobra en el presupuesto de la Mac (24 h por video).

En el baile, el pie apoyado patina 7 veces menos y los huesos ya no se estiran (es un esqueleto de verdad, SMPL-X). La altura sube a 1,64 m: MediaPipe da 10-20 % de menos. El temblor queda igual y el pie se hunde un poco más (menos de 1 cm). Falta medirlo en todo el set de prueba y de frente caminando hacia la cámara.

## Uso

```bash
~/Code/tridi-thirdparty/GVHMR/.venv/bin/python data/capture2/gvhmr_mac.py data/samples/<video>.mp4 --f-mm 24
~/Code/tridi-thirdparty/GVHMR/.venv/bin/python data/capture2/to_poseclip.py data/samples/<video>.gvhmr.npz
```

`--static` si la cámara no se mueve (más rápido: no corre la odometría visual). `gvhmr_mac.py` deja `<video>.gvhmr.npz`: parámetros SMPL-X por cuadro en el mundo y en la cámara. `to_poseclip.py` lo pasa a un `PoseClip` v1 (`clips/clip_<video>-gvhmr.json` y `.npz`): los 33 puntos de MediaPipe, girado para que z mire a la cámara (el mundo de GVHMR tiene la gravedad bien pero un giro cualquiera; en nuestros clips la persona miraba a −z) y suavizado como `data/lift.py`. Así lo usan la web, el retargeting y `data.quality` sin cambiar el contrato. Todo el set de prueba, de una (se puede cortar y retomar):

```bash
nohup sh data/capture2/run_set.sh > ~/Tridi/capture2/run_set.out 2>&1 &
```

## Probarlo en la web

En la rama `juan/experimental`, `npm --prefix web run dev` y abrir `#/simulaciones`: la galería tiene cada video dos veces, "MediaPipe (hoy)" y "captura 2.0 (GVHMR)", con el robot imitando cada uno (`web/clips/`, `web/src/preloaded.json`). La demo publicada no cambia.
