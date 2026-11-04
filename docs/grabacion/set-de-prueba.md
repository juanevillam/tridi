# Set de prueba: los 20 videos que graba Juan, solo

Para qué: medir con números si la captura, el retargeting y el entrenamiento mejoran ([plan v2](../plan-v2.md), pilar B). Siempre se corren los mismos 20 videos, así un cambio se compara contra el anterior.

Todo pensado para grabar **sin ayuda**: el teléfono queda fijo, tú entras al cuadro, haces el movimiento y sales. Se puede grabar en 2 o 3 tandas de ~40 min.

**Privacidad:** los videos **nunca** van al repo ni a la nube. Quedan en la Mac, en `~/Tridi/set-de-prueba/` (fuera del repo). Al repo solo va lo que sale de ellos (movimiento, métricas) y la ficha de medidas de abajo.

---

## 1. Lo que necesitas (una vez)

| Cosa | Para qué | Si no la tienes |
| --- | --- | --- |
| El iPhone | Grabar | — |
| Un soporte que deje el teléfono quieto | Cámara fija: la mayoría de los videos la necesitan | Un trípode de teléfono barato, o el teléfono apoyado de pie contra libros en una mesa o repisa. Lo importante es que **no se mueva** |
| Cinta adhesiva de color (de pintor) | Marcas en el piso | Cualquier cinta, o dos objetos chicos planos (no se tropiezan) |
| Una cinta métrica | Medir distancias y tu cuerpo | — |
| Una silla sin ruedas | Sentarse | — |
| Un escalón firme (escalera de la casa, o un cajón muy firme de 15-20 cm) | Subir y bajar | Si no hay, se salta ese video |
| Mesa, una taza, un plato, una cuchara, una caja chica | Objetos | — |
| La cocina con fregadero | Lavar | — |

## 2. Tu ficha de medidas (5 minutos, una vez)

Mide y anota en `data/set-de-prueba/ficha.json` (te armo el archivo cuando tengas los números; o dímelos en el chat). Sirve de **verdad de terreno**: si la captura dice que mides 1,62 m y mides 1,78 m, está mal en un 9 %.

- Altura, descalzo, en cm.
- Envergadura: brazos abiertos en cruz, de punta de dedo medio a punta de dedo medio.
- Largo del brazo: hombro (el hueso de arriba) a la muñeca.
- Largo de la pierna: cadera (el hueso que se toca al costado) al tobillo.
- Largo de la mano: muñeca a la punta del dedo medio.
- La distancia entre las marcas A y B del piso (punto 3).

## 3. Preparar el lugar (cada tanda)

1. **Luz:** de día, con luz que te dé de frente o de costado. **Nunca con una ventana detrás de ti** (sales oscuro y la captura falla). Prende las luces de la habitación también.
2. **Fondo:** lo más despejado posible. Que no haya otra persona, ni un espejo, ni una tele con gente en el cuadro.
3. **Marcas en el piso:** dos marcas, **A** y **B**, a **3,00 m** exactos una de otra, en línea recta. Mide con la cinta. Más una marca **C** en el medio (1,50 m).
4. **Teléfono, para los videos "de perfil":** a la altura de tu cadera (~1 m del piso), mirando perpendicular a la línea A-B, a **unos 4 m** de la marca C. Comprueba antes: parado en A y parado en B, tienes que entrar entero, de la cabeza a los pies, con un poco de margen arriba y abajo.
5. **Teléfono, para los videos "de frente":** en la línea de A-B, detrás de B, a ~1,5 m de B, a la altura de la cadera.

## 4. Cómo configurar el iPhone (cada tanda)

- App **Cámara**, modo **Video** (no Cinematográfico, no Cámara lenta).
- **1080p a 60 fps** (Ajustes → Cámara → Grabar video). 60 cuadros por segundo ayudan con los movimientos rápidos y con las manos. 4K no hace falta: pesa 4× y la captura no lo aprovecha.
- **Horizontal** para cuerpo entero. **Vertical** solo para los videos de manos (está indicado).
- Lente **1×** (nada de 0,5× ni zoom: el gran angular deforma el cuerpo en los bordes).
- **Bloquear exposición y foco:** con el cuadro armado, mantén apretado el dedo sobre el lugar donde vas a estar hasta que aparezca "Bloqueo AE/AF". Así la imagen no cambia de brillo cuando entras.
- Modo **No molestar** (que no entre una llamada a mitad).
- Para no tener que tocar el teléfono cada vez: graba **una toma larga por tanda** con varios videos dentro, y los separamos después; o usa el **Apple Watch** (app Cámara remota) o "Oye Siri, graba un video" si los tienes.

## 5. Cómo vestirte

- Ropa **ajustada** o normal, no holgada (una sudadera grande esconde los codos y la cadera). Un color que contraste con el fondo (si la pared es blanca, no te vistas de blanco).
- **Manga corta o arremangado:** las muñecas tienen que verse.
- **Sin guantes, sin relojes grandes, sin anillos llamativos** en los videos de manos.
- **Zapatos** en todos menos donde se diga; siempre los mismos en toda la tanda.
- Pelo recogido si tapa la cara o el cuello.

## 6. La rutina de cada video (siempre igual)

1. Dale a grabar.
2. Entra al cuadro y párate en la marca de inicio.
3. **Pose de arranque, 3 segundos:** quieto, de pie, brazos abiertos en cruz (pose T). Es la calibración: le dice a la captura cuánto miden tus brazos en ese video.
4. Haz el movimiento.
5. **Pose de cierre, 2 segundos:** quieto, brazos al costado.
6. Sal del cuadro y corta. Si algo salió raro (tropezaste, alguien entró), repítelo: es gratis.

---

## 7. Los 20 videos

Nombre del archivo = el código de la primera columna (por ejemplo `B01-caminar-perfil.mov`). Si es una toma larga con varios, dímelo y los corto yo.

### A. Calibración (1)

| Código | Cámara | Qué haces | Dura | Para qué |
| --- | --- | --- | --- | --- |
| **A01-calibracion** | De perfil, en C | Pose T 3 s. Después gira **muy despacio** sobre ti mismo una vuelta entera (20 s), brazos en cruz. Después brazos abajo, otra vuelta despacio | ~50 s | La forma de tu cuerpo vista desde todos lados |

### B. Moverse por el piso (6)

| Código | Cámara | Qué haces | Dura | Para qué |
| --- | --- | --- | --- | --- |
| **B01-caminar-perfil** | De perfil | De A a B caminando normal, das la vuelta, de B a A. **3 veces** ida y vuelta | ~30 s | La caminata de siempre, con distancia conocida (3 m): ¿la captura dice 3 m? |
| **B02-caminar-frente** | De frente | De A a B caminando hacia la cámara, vuelta, de B a A de espaldas a la cámara. 3 veces | ~30 s | Lo que hoy falla ("de frente el avance sale ≈ 0") |
| **B03-caminar-circulo** | De perfil | Camina en un círculo de ~2 m alrededor de C, 2 vueltas | ~25 s | Giros mientras caminas |
| **B04-trotar** | De perfil | Trota suave de A a B y de vuelta, 2 veces | ~15 s | Movimiento rápido, pies en el aire |
| **B05-sentadillas-saltos** | De perfil, tú en C | 5 sentadillas lentas, pausa de 3 s, 5 saltos en el lugar con los dos pies | ~30 s | Pies que no se mueven + vuelo + aterrizaje |
| **B06-jumping-jacks** | **De frente**, tú en C | 10 jumping jacks | ~15 s | El movimiento que ya entrenamos (comparar contra el clip de YouTube) |

### C. Con el entorno (3)

| Código | Cámara | Qué haces | Dura | Para qué |
| --- | --- | --- | --- | --- |
| **C01-silla** | De perfil, silla en C, de costado a la cámara | Siéntate y levántate 3 veces, despacio | ~25 s | Contacto con un mueble (escalón 3 del plan) |
| **C02-escalon** | De perfil al escalón | Sube y baja el escalón 3 veces, primero con el pie derecho, después con el izquierdo | ~30 s | Pies a otra altura |
| **C03-apoyarse** | De perfil, mesa en C | Camina hasta la mesa, apoya las dos manos en ella 3 s, inclínate, vuelve | ~20 s | Manos que cargan peso |

### D. Manos y dedos (5) — teléfono **vertical**, a la altura del pecho, a **1,2 m**, que se vea de la cintura para arriba

| Código | Qué haces | Dura | Para qué |
| --- | --- | --- | --- |
| **D01-saludar-senalar** | Saluda con la derecha, después con la izquierda. Señala arriba, abajo, a tu derecha, a tu izquierda, a la cámara | ~20 s | Brazos y dedo índice |
| **D02-contar** | Cuenta del 1 al 5 con la mano derecha, de frente a la cámara, despacio (2 s por número). Después la izquierda. Después las dos a la vez | ~40 s | **Los 5 dedos**, uno por uno |
| **D03-abrir-cerrar** | Abre y cierra el puño 5 veces despacio. Después rápido. Después palma hacia la cámara y hacia ti, girando la muñeca | ~30 s | Flexión de todos los dedos y giro de la muñeca |
| **D04-agarres** | Sin objeto: haz como que agarras una taza por el asa, una pelota con toda la mano, un lápiz con la punta de los dedos. 3 veces cada uno | ~40 s | Formas de agarrar (para las manos del robot) |
| **D05-manos-de-perfil** | Gira 90° (de perfil a la cámara) y repite D02 y D03 rápido | ~40 s | Dedos que se tapan entre sí: el caso difícil |

### E. Objetos (4)

| Código | Cámara | Qué haces | Dura | Para qué |
| --- | --- | --- | --- | --- |
| **E01-taza** | Horizontal, a 45° de la mesa, a la altura del pecho, a ~2 m; que se vea la mesa entera y tú de la cadera para arriba. Dos marcas de cinta en la mesa, a 40 cm | Toma la taza de la marca 1 y déjala en la marca 2. Vuelve. **5 veces**, una con cada mano alternando | ~45 s | Agarrar y dejar (escalón 4) |
| **E02-plato** | Igual que E01 | Toma un plato de la pila y déjalo en otro lugar de la mesa, plano. 5 platos (o el mismo 5 veces) | ~45 s | Objeto plano y ancho |
| **E03-caja** | De perfil, en el piso | Levanta una caja chica del piso en A, llévala caminando a B, déjala en el piso | ~20 s | Cuerpo entero + objeto |
| **E04-lavar** ⭐ | En la cocina: teléfono horizontal en la mesada o en una repisa, a un costado (~45°), a 1,5-2 m, a la altura del pecho; que se vean el fregadero, la mesada y tú de la cintura para arriba. **Lejos del agua** | Lava **un plato, una taza, una cuchara y un vaso**, uno por uno: tomarlo, enjabonar con la esponja, enjuagar, dejarlo en el escurridor. Sin apuro, como lo harías normal | **2 a 3 min** | El video estrella del plan: lavar desde un solo video (escalón 6) |

### F. Casos difíciles (1)

| Código | Cámara | Qué haces | Dura | Para qué |
| --- | --- | --- | --- | --- |
| **F01-bailar** | De perfil, tú en C | Baila libre, con brazos, giros y pasos, 20 s | ~25 s | Movimientos rápidos, giros, brazos cruzando el cuerpo |

---

## 8. Al terminar cada tanda

1. Pasa los videos a la Mac por **AirDrop** (no por la nube, no por WhatsApp: comprime y les saca los datos de la cámara).
2. Déjalos en `~/Tridi/set-de-prueba/` con su código como nombre.
3. Dime en el chat qué grabaste y si algo salió raro. Yo los paso por la captura de hoy (la línea de partida) y anoto las métricas.

## 9. Chequeo rápido antes de cortar cada video

- ¿Se te ve entero (o de la cintura para arriba en D) **todo el tiempo**? Si saliste del cuadro, repite.
- ¿Hiciste la pose T al principio?
- ¿El teléfono no se movió?
- ¿No apareció nadie más?
