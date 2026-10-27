# 🧊 Tridi: cómo funciona (contexto para el pitch)

## La idea

Grabas a una persona con el celular, sacamos su esqueleto 3D, se lo pasamos al robot (Unitree G1) y una red neuronal aprende a hacer ese movimiento con física real, sin caerse.

**¿Por qué no copiar el video directo?** El video no tiene física: si el robot solo repite la pose, los pies patinan y se cae. El video le dice *qué* hacer; la física le enseña *cómo*.

**¿Por qué no un LLM?** El LLM decide a dónde ir. Nuestra red decide cómo mover 29 motores 50 veces por segundo sin caerse: chiquita (265 KB) y rapidísima, corre en el navegador.

## El recorrido

1️⃣ **Video → esqueleto 3D:** 33 puntos del cuerpo en 3D, 30 veces por segundo
2️⃣ **Esqueleto → robot:** a las 29 articulaciones del G1 (3,2 cm de error)
3️⃣ **Practica:** 64 robots simulados lo intentan millones de veces; ganan puntos si se parecen al humano sin caerse (aprendizaje por refuerzo)
4️⃣ **4 mundos:** plano, piedras, resbaloso y viento. Hoy los usamos para probar; la caminata se entrenó solo en plano
5️⃣ **Entrega:** el cerebro entrenado (ONNX) + el dataset de las pruebas

## Verdad hoy (no inflar)

✅ Se para y aguanta la mayoría de los empujones de 250 N
✅ Copia a una persona en vivo desde la cámara
🟡 Caminar: sigue 3,5 s de 11,8 del clip, todavía no camina solo
❌ No probado en un G1 real (siguiente paso)

**Escalera:** sin entrenar se cae en 1,1 s → 3 M pasos: 4,2 s → 10 M: 9,6 s → entrenado: 20 s de pie sin girar

---

# 🔧 Parte técnica

**Esqueleto:** YOLO11-pose + ByteTrack siguen a cada persona → MediaPipe Pose (heavy) da los 33 puntos 3D en metros → si YOLO y MediaPipe no coinciden, el cuadro se descarta → Savitzky-Golay (video) / One Euro (en vivo) quitan el temblor. Hay que grabar de perfil.

**Retargeting:** cinemática inversa sobre el modelo MuJoCo del G1 (29 articulaciones, 33 kg). Sin cabeza ni dedos.

**La red:** MLP 256 → 128 → 64 (ELU), actor-crítico (una decide los motores, otra estima qué tan bien va). ~70 mil parámetros. Entran 93 números (190 en imitación: suma la pose que viene en 0,1 y 0,25 s), salen 29 objetivos de motor. Decide cada 20 ms en < 1 ms con onnxruntime-web.

**Entrenamiento:** PPO en MuJoCo (física a 250 Hz), 64 robots en paralelo en la CPU de una M2. Recompensa estilo DeepMimic: ángulos (0,5), pelvis (0,2), pies (0,15), velocidad (0,15), torso (0,1). Arranca en un instante al azar del clip y se corta si se aleja más de 0,6 m o se cae. Los mundos sortean fricción, masa, motores, viento y empujones en cada reinicio (domain randomization).

**Después:** cada checkpoint se exporta a ONNX (la escalera) → `rollout.py` graba el dataset en los 4 mundos → `deliver.py` arma la entrega. Web y Python coinciden: diferencia máxima 3e-8.

---

# 🧠 La red en vivo: de la Mac al navegador

**La idea:** lo que se ve en la web no es un video ni una animación inventada. Es la red real mientras aprende: cada 2 s la Mac le saca una foto y el navegador la dibuja en 3D.

1️⃣ **La Mac entrena.** `data/serve.sh` levanta el servidor; al dar Entrenar, lanza PPO. Los logs quedan en `data/server_data/train/<id>/`
2️⃣ **Foto cada 2 s** (`training/netlive.py`): toma la red tal como está (la misma que después sale en ONNX), le pasa los últimos 16 pasos de un robot y guarda qué hizo cada neurona, las 500 conexiones más fuertes por capa, cuánto cambió cada capa y las curvas de recompensa → `net.json`
3️⃣ **El servidor la sirve** en `GET /train/{id}/net` (~25 KB con gzip)
4️⃣ **Túnel de Cloudflare:** saca la Mac a internet. Su URL cambia, así que `serve.sh` la escribe en un gist y la web la lee de ahí
5️⃣ **El navegador la pinta** con three.js (`web/src/netview.js`), pidiéndola cada 2 s

**Qué se ve:**
• Cada esfera es una neurona real: 190 entradas → 256 → 128 → 64 → 29 motores
• Verde = se activa en positivo, azul = negativo
• Las líneas son las conexiones más fuertes; las chispas, por donde pasa más señal ahora
• Los 16 pasos se repiten en loop hasta que llega la foto siguiente, así se mueve sin saltos

**Límites:** va con hasta ~2 s de retraso; si la Mac o el túnel se apagan, la vista se congela; si falla la foto, el entrenamiento sigue igual.

**Para el pitch:** "Es la red real mientras aprende. Cada 2 segundos la Mac le saca una foto y el navegador la dibuja: cuando cambian los pesos, cambia lo que ves."

---

# ❓ ¿Por qué no usamos Jev (TypeSafe AI)?

**Qué es Jev:** un modelo que toma el estado de un programa y responde preguntas tipadas: elegir entre opciones, dar un puntaje o un sí/no con probabilidad. Sirve para clasificar, enrutar y puntuar. Corre por API en la nube, en 70-500 ms.

**Por qué no sirve para mover el robot:**
• **Latencia:** el robot decide cada 20 ms. Jev tarda de 70 a 500 ms, más el viaje por internet: el robot ya se cayó antes de recibir la respuesta
• **Tipo de salida:** Jev elige entre opciones discretas. Nosotros necesitamos 29 números continuos (el ángulo de cada motor), 50 veces por segundo
• **No sabe de física:** nuestra red aprendió probando millones de veces en MuJoCo. Jev nunca sintió una caída
• **Tiene que correr en el robot:** nuestra política pesa 265 KB, decide en menos de 1 ms y funciona sin internet

**Dónde sí encajaría:** arriba, en la capa que decide *qué* hacer: "¿este video sirve para entrenar?", "¿qué movimiento toca ahora?", "¿este episodio cuenta como caída?". Igual que el LLM: él decide a dónde ir, nuestra red lleva al robot sin caerse.

**Para el pitch:** "Jev decide qué hacer en milisegundos; nuestra red mueve 29 motores en menos de uno. Son capas distintas y se complementan."

---

# ⚠️ Preguntas peligrosas (ensayar)

Estas son las que nos pueden hundir. Mejor decirlas nosotros primero que dejar que las diga el jurado.

## 🔥 Las que más duelen

**"El robot no camina."**
Es verdad y lo decimos primero. Hoy la caminata sigue 3,5 s de un clip de 11,8. Lo que sí funciona es la cadena entera: video → esqueleto → robot → entrenamiento → entrega. Falta que la política aguante el clip completo, y eso es cuestión de más entrenamiento.

**"La política que se para no usa el video para nada."**
La más peligrosa. Es verdad: aprende a pararse de una recompensa, no de un clip. Pero es la base de todo: un robot que no sabe equilibrarse no puede imitar nada. Primero aprende a no caerse, después a moverse como la persona.

**"¿Esto funciona en un G1 real?"**
No lo hemos probado. En simulación no modelamos el retardo de los motores ni el ruido de los sensores, que es justo lo que cambia en el robot real. Entregamos en ONNX, el formato que corre un robot, así que probarlo es el siguiente paso.

## 🔧 Técnicas

**"¿Qué es suyo, si todo es MuJoCo, MediaPipe y PyTorch?"**
Las piezas son estándar; la cadena es nuestra. Elegir y seguir a una persona entre varias, reconstruir por dónde camina (MediaPipe no lo da), pasarlo al G1, la recompensa de imitación y que la web y Python den exactamente lo mismo.

**"¿Por qué hablan de piedras y viento?"**
Porque ahí probamos al robot: un robot que solo vio piso perfecto no sirve en la calle. Ojo: la caminata se entrenó solo en piso plano. Entrenarla también en los 4 mundos es lo que sigue.

## 🥊 Competencia

**"Ultimate Bots Studio ya hace video a robot."**
Sí, pero usan una política ya hecha de NVIDIA. Nosotros entrenamos una política nueva por cada video, y entregamos esa política más el dataset.

**"VideoMimic lo hizo en 2025."**
VideoMimic es un paper de investigación con un robot de laboratorio. Nosotros lo convertimos en un producto que cualquiera usa desde el navegador.

**"AMASS es gratis y es mocap limpio."**
Pero tiene pocos movimientos, y LAFAN1 o EgoDex no se pueden usar comercialmente. El video tiene todos los movimientos del mundo. Esa ventaja pesa cuando la imitación funcione bien.

## 💰 Negocio

**"¿Los datos son suyos?"**
Los videos de YouTube los usamos para probar y demostrar. Para vender hacen falta videos propios o con licencia, y lo sabemos.

**"¿Cuánto cuesta producir esto?"**
No es cero: no pagamos por grabar, pero sí el cómputo, unos 30-70 min de laptop por política. En GPU en la nube serían minutos.

**"¿Qué venden?"** (en menos de 10 s)
"Convertimos video común en data y cerebros entrenados para robots humanoides."

**Regla:** si no sabemos algo, decimos "no lo sabemos todavía". Inventar nos cuesta toda la credibilidad.
