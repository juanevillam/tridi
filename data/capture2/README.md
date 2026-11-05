# Captura 2.0

Del video al cuerpo humano en 3D anclado al mundo, con dedos (bloque 4 de [`../../docs/plan-v2.md`](../../docs/plan-v2.md)). Reemplaza a MediaPipe + `lift.py` donde hoy falla: el temblor, el avance de frente (≈ 0 m/s) y la falta de dedos.

| Pieza | Para qué | Estado |
| --- | --- | --- |
| [GVHMR](https://github.com/zju3dv/GVHMR) | Cuerpo SMPL-X en el mundo, con gravedad y cámara que se mueve | Instalado en la Mac (`gvhmr_mac.py`); faltan los pesos y los modelos de cuerpo |
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

Comprobado (2026-11-04): su código importa y los `.cuda()` van a MPS. Falta correrlo con los pesos.

**A mano (Juan, en el navegador):** Google Drive no deja bajar los pesos grandes por script, y los modelos de cuerpo piden cuenta. No se usan espejos de terceros: un `.ckpt` o `.pth` puede ejecutar código al cargarse.

1. Del [Drive oficial de GVHMR](https://drive.google.com/drive/folders/1eebJ13FUEXrKBawHpJroW0sNSxLjh9xD), a `~/Code/tridi-thirdparty/GVHMR/inputs/checkpoints/`:
   - `gvhmr/gvhmr_siga24_release.ckpt`
   - `hmr2/epoch=10-step=25000.ckpt`
   - `vitpose/vitpose-h-multi-coco.pth`
   - `yolo/yolov8x.pt`
2. Con cuenta en [smpl-x.is.tue.mpg.de](https://smpl-x.is.tue.mpg.de/): `SMPLX_NEUTRAL.npz` (y `MALE`, `FEMALE`) a `inputs/checkpoints/body_models/smplx/`.
3. Con cuenta en [smpl.is.tue.mpg.de](https://smpl.is.tue.mpg.de/): `SMPL_NEUTRAL.pkl` (y `MALE`, `FEMALE`) a `inputs/checkpoints/body_models/smpl/`.
4. Para las manos, más adelante: cuenta en [mano.is.tue.mpg.de](https://mano.is.tue.mpg.de/), `MANO_RIGHT.pkl`.

## Uso

```bash
~/Code/tridi-thirdparty/GVHMR/.venv/bin/python data/capture2/gvhmr_mac.py data/samples/<video>.mp4 --f-mm 24
```

`--static` si la cámara no se mueve (más rápido: no corre la odometría visual). Sale `<video>.gvhmr.npz`: parámetros SMPL-X por cuadro en el mundo y en la cámara.
