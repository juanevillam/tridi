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

## Sigue

- Idiomas en En vivo, Subir, Simulaciones, Entrega, Cámara y Red.
- Medir la fluidez con el panel visible y fijar el presupuesto (ningún cuadro > 50 ms).
- Resultado de C3 y C4 sobre la caminata.
- Bloque 3 cambia de orden: primero una referencia en equilibrio (contactos de pies reales, pelvis corregida para que el ZMP quede sobre el apoyo), comprobada con C1-C2 en verde, y recién después entrenar.
- Juan graba el set de prueba; después, línea de partida de la captura de hoy sobre esos videos.
