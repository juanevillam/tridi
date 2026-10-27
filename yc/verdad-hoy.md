# Qué es verdad hoy

Base de todo lo que se dice a YC. Si una respuesta afirma algo que no está aquí, o lo agregamos con su prueba o lo sacamos. Corte: **27 de octubre de 2026** (dos días después del hackathon).

## Funciona

| Qué | Número | Dónde verlo |
| --- | --- | --- |
| Video o cámara → esqueleto 3D de una persona, aunque haya más gente en el cuadro | 33 puntos, 30 veces por segundo | `data/README.md` |
| Esqueleto → las 29 articulaciones del Unitree G1 (MuJoCo) | 3,2 cm de error mediano en la caminata | `physics/README.md` |
| Política de pie: se para y aguanta empujones | La mayoría de los empujones de 250 N; 60 M de pasos de entrenamiento | `training/README.md` |
| La política corre en el navegador | Red de ~70 mil parámetros, 265 KB, decide cada 20 ms en < 1 ms (onnxruntime-web). Web y Python difieren como máximo en 3e-8 | `training/policies/`, `web/` |
| Copia a una persona en vivo desde la cámara | — | [tridi-alpha.vercel.app](https://tridi-alpha.vercel.app) |
| Subir un video y que se entrene en cola | Hasta 30 s; solo se guarda el movimiento | `data/server.py` |
| Cuatro mundos de prueba | Plano, piedras, resbaloso, viento; fricción, masa, motores y empujones al azar | `physics/worlds/` |
| La entrega: política en ONNX + dataset de rollouts en los 4 mundos | — | `training/rollout.py`, `training/deliver.py` |
| La red se ve en 3D mientras entrena | Foto cada 2 s desde la Mac | `training/netlive.py`, `web/src/netview.js` |

## No funciona todavía (decirlo primero)

| Qué | Hoy |
| --- | --- |
| **Caminar imitando el video** | Sigue 3,5 s de un clip de 11,8 s. No camina solo |
| La política de pie no usa el video | Aprende a pararse de una recompensa, no de un clip |
| Robot real | Nunca probado en un G1 físico. No modelamos retardo de motores ni ruido de sensores |
| Entrenar en los 4 mundos | La caminata se entrenó solo en plano |
| Datos con licencia | Las pruebas usan videos de YouTube: para vender hacen falta videos propios o con licencia |
| Infraestructura | El servidor de video corre en la Mac de Juan detrás de un túnel de Cloudflare |

## Usuarios, clientes, ingresos

| Qué | Hoy |
| --- | --- |
| Usuarios | El público y el jurado del hackathon probaron el demo. `TODO(juan)`: ¿hay analytics en Vercel? Contar visitas y videos subidos reales |
| Clientes | Ninguno. **Ninguna conversación con una empresa de robots todavía** |
| Ingresos | USD 0 |
| Inversión | Ninguna |
| Resultado en Platanus Hack 26 | `TODO(equipo)`: puesto en el track 🧊 Three-Dimensional y en la general |

## Números que conviene conseguir antes del 2 de noviembre

Cada uno cambia una respuesta de la aplicación. En orden de impacto:

1. **Conversaciones con posibles clientes** (laboratorios con G1, empresas de humanoides, quien compre datos de movimiento): cuántas, con quién, qué dijeron, si alguno pagaría o probaría. Ver [`plan-hasta-el-deadline.md`](plan-hasta-el-deadline.md).
2. **Caminata:** cuántos segundos del clip sigue después de entrenar más. "De 3,5 s a X s en una semana" es progreso medible.
3. **Uso del demo:** visitas, videos subidos, de qué países.
4. **Costo por política:** hoy 30-70 min de una M2. Medir en GPU en la nube.
