# Startups que entraron a YC

Lo mismo que hicimos con los rivales de Platanus Hack, pero con YC: quién entra, qué hace, de dónde es, cómo se presentó. No es para copiar ideas (cada batch es distinto), sino para entender qué tipo de equipo y de historia entra, y contar la nuestra mejor.

Qué cubre (bajado el 27 de octubre de 2026):

| Año | Batches | Startups | Para qué |
| --- | --- | --- | --- |
| **2026** | Winter, Spring, Summer, Fall | **801** | **El foco:** análisis, fichas de robótica, Latinoamérica |
| 2027 | Winter, Summer (las primeras publicadas) | 7 | Se completa cuando YC publique cada batch |
| 2022-2025 | Todos | 2.335 | Comparar y ver hacia dónde va YC |

Se actualiza con cada batch nuevo.

## Archivos

| Archivo | Qué tiene |
| --- | --- |
| [`analisis.md`](analisis.md) | **Empezar aquí.** Qué aprendimos de los 2026: qué entra, quiénes, y qué significa para Tridi |
| [`robotica-y-physical-ai.md`](robotica-y-physical-ai.md) | Ficha de cada startup 2026 de robótica, IA física, simulación y datos para robots: competidores, clientes posibles y espejos de Tridi |
| [`latinoamerica.md`](latinoamerica.md) | Startups 2026 con fundadores o sede en Latinoamérica |
| [`aplicaciones-publicas.md`](aplicaciones-publicas.md) | Startups que publicaron su aplicación (respuestas y video): qué patrones tienen las respuestas y los videos |
| [`videos.py`](videos.py) | Baja y transcribe los videos de aplicación públicos (whisper.cpp) |
| [`aplicaciones-publicas-lista.md`](aplicaciones-publicas-lista.md) | La lista completa, de todos los años (generada) |
| `2022-*.md` … `2027-*.md` | Todas las startups de cada batch, en tabla (generadas) |

## Cómo se actualiza

```bash
python3 yc/investigacion/startups/actualizar.py              # todos los batches de 2026 y 2027
python3 yc/investigacion/startups/actualizar.py "Spring 2027" # uno solo
python3 yc/investigacion/startups/actualizar.py 2024 2023     # todos los batches de esos años
python3 yc/investigacion/startups/actualizar.py --publicas    # además, las aplicaciones públicas de todos los años
```

Tarda unos 7 minutos por cada mil startups (pausa entre páginas para no cargar el sitio). Usa solo la biblioteca estándar de Python.

**De dónde salen los datos:** el directorio público de [ycombinator.com/companies](https://www.ycombinator.com/companies) (su índice de búsqueda y la página de cada startup). Los textos largos (descripciones, respuestas de aplicaciones) quedan en `cache/`, que no se versiona: son de YC y de los fundadores. Las tablas guardan datos y el one-liner.

**Lo que no es público:** el video y las respuestas de la aplicación solo se ven si la startup decidió publicarlos (pocas lo hacen). Las demás aplicaciones, los rechazos y las notas de los partners no son públicos.

## Al agregar un batch nuevo

1. Correr `actualizar.py` con el batch.
2. Revisar el batch nuevo contra [`robotica-y-physical-ai.md`](robotica-y-physical-ai.md) y [`latinoamerica.md`](latinoamerica.md), y agregar fichas.
3. Sumar lo nuevo a [`analisis.md`](analisis.md), con fecha.
