# Video de demo

YC deja adjuntar un demo del producto (en ciclos recientes, hasta 3 minutos `TODO: confirmar en el formulario`). Es opcional, pero para nosotros es lo más fuerte que tenemos: el producto se ve y se entiende en segundos.

Ya existe un guion de 2 minutos del hackathon: [`docs/pitch/guion-video-2-minutos.md`](../docs/pitch/guion-video-2-minutos.md). Este lo adapta para YC: menos show, más producto, en inglés.

## Reglas

- Grabación de pantalla con la voz de un fundador. Sin música épica.
- Mostrar el producto funcionando de verdad, sin cortes que escondan fallas.
- Decir lo que no funciona todavía (la caminata), igual que en la aplicación.
- 90 segundos alcanzan. Más corto se ve más seguro.

## Guion (borrador, ~90 s)

| Tiempo | Pantalla | Voz |
| --- | --- | --- |
| 0-10 s | Un video de celular de una persona caminando | "This is a phone video of a person walking. A humanoid robot can't learn from it as-is." |
| 10-25 s | Tridi detecta a la persona (con otra gente en cuadro) y el esqueleto 3D encima | "Tridi finds one person, even in a crowd, and extracts their 3D skeleton: 33 points, 30 times a second." |
| 25-40 s | El esqueleto pasa al G1 | "We map it onto the robot's 29 joints. If the robot just copies it, it falls: the motion isn't physically possible for its body." |
| 40-60 s | El robot entrenando; la red en 3D mientras aprende | "So the robot practices it millions of times in physics, with reinforcement learning, while we push it and change the floor." |
| 60-75 s | La política de pie: empujarlo con la barra espaciadora, se recupera | "This policy runs in your browser: 265 KB, it decides every 20 ms. Push it. It recovers." |
| 75-85 s | La pantalla de entrega: ONNX + dataset | "The customer gets the trained policy and the physics-corrected data." |
| 85-90 s | Logo + URL | "Walking by imitation is next. tridi-alpha.vercel.app." |

`TODO(juan)`: si la caminata mejora esta semana, reemplazar el cierre con el clip caminando y los segundos reales.

## Checklist

- [ ] Grabar en 1080p, navegador limpio (sin pestañas ni marcadores personales)
- [ ] Servidor de video prendido y el túnel funcionando
- [ ] Subir como no listado; probar el enlace en otra cuenta
