# Robots: un humanoide es un paquete

Tridi tiene que servir para cualquier humanoide ([`docs/plan-v2.md`](../docs/plan-v2.md), pilar D). El código no conoce a un robot por los nombres de sus cuerpos: cada robot es un archivo `robots/<id>.json` que dice dónde están sus partes, al lado de su modelo MuJoCo en `physics/models/`.

| Campo | Qué es |
| --- | --- |
| `mjcf` | La escena que se carga, relativa a `physics/models/` (como la nombra `policy.json`) |
| `keyframe` | La pose de pie |
| `actuators` | `position`: servos de posición ya (G1). `torque`: motores de torque, que el cargador convierte en servos PD con las ganancias `pd` (por nombre de articulación), conservando el límite de torque del motor. Así toda política manda ángulos objetivo igual en cualquier robot |
| `points` | Pelvis, torso, cabeza, pies y manos: un cuerpo (`body`) o una geometría (`geom`), con `offset` opcional en el marco del cuerpo |
| `feet` | Las geometrías de la suela de cada pie (nombres), o un cuerpo cuyas geometrías de colisión son la suela |
| `hands` | La mano y sus dedos (pendiente: bloque 5) |

`training/robot.py` los carga. Para revisar uno nuevo:

```bash
uv run --project training python -m training.robot g1 h1
```

Revisa que las partes existan, que los servos sostengan la pose con la pelvis sostenida (error < 0,1 rad), que la pose de pie apoye las suelas en el piso (± 2 cm), cuánto aguanta de pie sin política ni ayuda (dato, no nota) y cuántos pasos de física por segundo da en un núcleo.

## Robots de hoy (2026-11-03, M2 con un entrenamiento corriendo al lado)

| Robot | Articulaciones | Alto | Pelvis | Pierna | Masa | Servos | Error | Suela | Solo, sin política | Pasos/s (1 núcleo) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Unitree G1 | 29 | 1,26 m | 0,78 m | 0,75 m | 33,3 kg | ok | 0,011 rad | -0,1 cm | 1,2 s | ~24.000 |
| Unitree H1 | 19 | 1,66 m | 0,98 m | 0,91 m | 51,4 kg | ok | 0,007 rad | -0,1 cm | 1,3 s | ~40.000 |

El H1 es 40 cm más alto, pesa 18 kg más y no tiene muñecas ni manos: si algo sirve en los dos, no depende del tamaño del G1. Ninguno se sostiene sin política (los servos de entrenamiento del G1 son blandos a propósito), por eso el chequeo sostiene la pelvis.

**Falta** para que un robot nuevo entre "sin tocar código": que `training.balance`, el retargeting y `training/env.py` lean el paquete en vez de los nombres del G1.
