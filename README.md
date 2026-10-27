# Tridi

<img src="./project-logo.png" alt="Tridi" width="120" />

**Convertimos un video común en data para robots humanoides.**

Grabas a una persona moviéndose con el celular. Un humanoide aprende a hacerlo igual, practicando en física real hasta no caerse.

Repo privado de la empresa. Todo lo de la aplicación a Y Combinator vive en [`yc/`](yc/README.md).

👉 Demo en vivo: [tridi-alpha.vercel.app](https://tridi-alpha.vercel.app)

## El problema

ChatGPT se entrenó con todo internet. Los robots no tienen nada parecido: no existe un internet de datos de movimiento. Hoy, enseñarle un movimiento nuevo a un humanoide exige trajes de captura, un estudio y mucho tiempo, sobre pisos perfectos que en la calle no existen.

## Qué hace Tridi

- **Tridi Capture:** de un video de celular sacamos el esqueleto 3D de la persona (33 puntos, 30 veces por segundo) y lo pasamos a las 29 articulaciones del robot, con 3,2 cm de error.
- **Tridi Gym:** si el robot solo copia el video, se cae. El video le dice qué hacer; la física le enseña cómo. Una red neuronal practica el movimiento millones de veces con física real, en cuatro ambientes imperfectos: acera, piedras, piso resbaloso y viento.
- **Tridi Policy:** se entrega la data y el cerebro entrenado del robot, en ONNX, el formato que corre un robot.

## Dónde estamos

| Estado | Qué hace |
| --- | --- |
| **Hoy** | Se para y aguanta la mayoría de los empujones de 250 N |
| **Entrenando** | Caminar como la persona del video (todavía no camina solo) |
| **Lo que sigue** | Cualquier movimiento, en cualquier terreno, y probarlo en un G1 real |

El detalle, sin inflar: [`yc/verdad-hoy.md`](yc/verdad-hoy.md).

## El repo

| Carpeta | Qué es |
| --- | --- |
| [`data/`](data/README.md) | Video o cámara → esqueleto 3D de una persona (`PoseClip`), y el servidor de videos con su cola |
| [`physics/`](physics/README.md) | Unitree G1 en MuJoCo (WebAssembly), retargeting, mundos y escenas |
| [`training/`](training/README.md) | Entrenamiento con PPO, imitación, exportación a ONNX, rollouts y entrega |
| [`web/`](web) | La app web: landing, Gym, Simulaciones, cámara en vivo, entrega |
| [`docs/`](docs) | Estado, contrato entre partes, decisiones, bitácora, pitch |
| [`yc/`](yc/README.md) | Aplicación a Y Combinator |

Cómo trabajamos (ramas, `scripts/ship.sh`, bitácora): [`CONTRIBUTING.md`](CONTRIBUTING.md). Para agentes: [`AGENTS.md`](AGENTS.md).

## Cómo lo construimos

- **Física:** MuJoCo, en Python para entrenar y compilado a WebAssembly para el navegador (física a 250 Hz, política a 50 Hz).
- **Robot:** Unitree G1, modelo de MuJoCo Menagerie.
- **La política:** una red de 265 KB que controla 29 motores, decide cada 20 ms y tarda menos de 1 ms. Corre directo en el navegador.

No es un LLM: es una red pequeña que aprendió a no caerse. El LLM decide a dónde ir; nosotros le enseñamos al robot a llegar sin caerse.

## Equipo

César Martinez ([@cisorm](https://github.com/cisorm)) · Juan Villa ([@juanevillam](https://github.com/juanevillam)) · Pastor Jiménez ([@torpass](https://github.com/torpass)) · Ale Hernández ([@alehernandezt](https://github.com/alehernandezt))

Nació en Platanus Hack 26, Caracas (23 al 25 de octubre de 2026). El repo de esa entrega, público y congelado: [platanus-hack/platanus-hack-26-ve-team-26](https://github.com/platanus-hack/platanus-hack-26-ve-team-26).
