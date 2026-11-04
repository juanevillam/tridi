# Set de prueba: videos de cualquier lado

**Cambio del 2026-11-03 (Juan):** Tridi tiene que funcionar con el video que la gente ya tiene: una persona bailando en TikTok, un grupo haciendo una coreografía, alguien lavando platos en YouTube, la cámara de la Mac o el teléfono en la mano. Nada de trípode, 60 fps ni foco bloqueado. Por eso el set de prueba ya no es una sesión de grabación de Juan: es una **lista de videos reales por habilidad**, y la tecnología se mide sobre ellos.

Juan puede sumar grabaciones propias cuando quiera (sección 4), pero no hace falta grabar nada para empezar.

---

## 1. Cómo funciona

| Qué | Dónde |
| --- | --- |
| La lista de videos (id, habilidad, fuente, link, licencia, estado) | [`data/set-de-prueba/manifest.csv`](../../data/set-de-prueba/manifest.csv), versionada |
| Los videos y sus `PoseClip` | `~/Tridi/set-de-prueba/` en la Mac. **Nunca** en el repo ni en la nube |
| Las notas de calidad de cada versión de la captura | [`data/set-de-prueba/quality.csv`](../../data/set-de-prueba/quality.csv), versionada |

```bash
uv run --project data python -m data.testset list                      # qué hay y qué está bajado (✓)
uv run --project data python -m data.testset add "<link>" --id bailar-03 --categoria bailar
uv run --project data python -m data.testset download                  # baja lo que falta
uv run --project data python -m data.testset extract                   # PoseClip de cada video
uv run --project data python -m data.testset quality --save <versión>  # nota de calidad, a quality.csv
```

`add` acepta un link de TikTok, YouTube, Instagram, Pexels o Mixkit, o un archivo de la Mac (un video grabado con el teléfono o la cámara de la Mac).

## 2. La nota de calidad (sin verdad de terreno)

Como no hay captura de movimiento profesional para comparar, se mide lo que un cuerpo humano real no puede hacer ([`data/quality.py`](../../data/quality.py)):

| Medida | Qué es | Bien |
| --- | --- | --- |
| `valid` | Cuadros donde la persona se detectó de verdad | → 100 % |
| `jitter` | Aceleración p95 de rodillas y tobillos (m/s²): temblor cuadro a cuadro | Bajo |
| `slide` | Velocidad del pie apoyado (m/s): un pie apoyado no se mueve | → 0 |
| `sink` | Cuánto se hunde el pie bajo el piso (cm) | → 0 |
| `bones` | Cuánto cambia el largo de muslo, pierna, brazo y antebrazo (%): los huesos no se estiran | → 0 % |
| `height` | Altura estimada (m) | La de la persona |

**Línea de partida** (captura del hackathon, MediaPipe, 2026-11-03):

| Clip | valid | jitter | slide | sink | bones | altura |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Caminar de perfil | 100 % | 43,2 | 0,87 m/s | 0,3 cm | 6,4 % | 1,52 m |
| Correr de perfil | 97 % | 93,9 | 3,18 m/s | 1,2 cm | 12,8 % | 1,56 m |
| Jumping jacks | 100 % | 18,1 | 0,57 m/s | 0,3 cm | 6,8 % | 1,55 m |

El pie apoyado que "patina" casi 1 m/s caminando y los huesos que se estiran 6-13 % son exactamente lo que después hace que la referencia del robot no esté en equilibrio (los controles C1 y C2 de [`training/checks.py`](../../training/checks.py)).

## 3. Qué videos buscar

### De dónde

| Fuente | Licencia | Para qué |
| --- | --- | --- |
| **Pexels** (pexels.com/videos), Mixkit, Pixabay | Uso libre, también comercial, sin atribución; no vender el video tal cual | Pruebas **y** datos del producto. **Empezar por acá** |
| TikTok, YouTube, Instagram | El video es de quien lo publicó | Pruebas en esta Mac. No como datos que se venden: para eso hace falta permiso o licencia ([`yc/verdad-hoy.md`](../../yc/verdad-hoy.md), "Datos con licencia") |
| Grabaciones propias | Nuestras | Todo, y la verdad de terreno (sección 4) |

### Qué habilidades, y cuántos

Unos 5 por habilidad, a propósito variados: no los videos "perfectos", sino los que la gente de verdad sube.

| Habilidad | Buscar (en inglés rinde más) | Lo que se quiere cubrir |
| --- | --- | --- |
| Lavar platos ⭐ | "washing dishes", "doing dishes kitchen sink" | De costado y de frente, una persona, manos visibles |
| Bailar | "dancing", "hip hop dance", "tiktok dance" | Una persona, cuerpo entero, giros |
| Bailar en grupo | "group dancing", "dance choreography" | **Varias personas**: elegir a una, o a todas |
| Caminar | "man walking full body", "walking side view" | De perfil, de frente, cámara que sigue a la persona |
| Correr | "jogging side view", "running" | Pies en el aire |
| Jumping jacks | "jumping jacks" | Una persona y un grupo |
| Sentarse | "sitting down on chair" | Contacto con un mueble |
| Escaleras | "walking up stairs" | Pies a otra altura |
| Manos | "waving hand", "counting fingers", "sign language" | Dedos: para las manos de 5 dedos |
| Objetos | "lifting box", "carrying boxes" | Cuerpo entero + objeto |

Ya hay 25 candidatos de Pexels en el manifiesto (estado `candidato`, sin revisar). Al revisarlos: ¿se ve el cuerpo que importa (entero, o de la cintura para arriba en manos y lavar)? ¿cuántas personas? Si sirve, `estado` → `ok`; si no, se borra la fila.

### Lo difícil también entra

El set tiene que tener los casos que hoy fallan, porque son los que la captura 2.0 tiene que resolver: cámara en la mano que se mueve, gente de frente caminando hacia la cámara, video vertical, poca luz, ropa holgada, una persona tapando a otra, cortes de edición (TikTok). Se marcan en `notas`.

## 4. Si Juan quiere grabar algo (opcional)

Sin reglas de estudio: el teléfono en la mano o apoyado, la cámara de la Mac, como salga. Solo dos grabaciones valen el esfuerzo, porque dan algo que los videos de internet no tienen, **la verdad de terreno**:

1. **Distancia conocida:** dos marcas de cinta en el piso a 3,00 m medidos; caminar de una a la otra, ida y vuelta, de perfil y después de frente. La captura debería decir 3 m.
2. **Tu cuerpo medido:** anota tu altura y tu envergadura (brazos en cruz, punta a punta). Después grábate de cualquier forma haciendo cualquier cosa: la altura estimada se compara con la real.

Se suman con `add ~/ruta/al/video.mov --id propio-distancia-01 --categoria caminar`.
