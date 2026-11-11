# Tridi × Y Combinator

Todo lo de la aplicación a YC, en un solo lugar. Primera vez que aplicamos. Plan acordado: **Winter 2027 ahora**, y en 2027 aplicar a todos los batches (Spring, Summer, Fall, Winter 2028) hasta entrar.

> Repo privado. Nada de `yc/` va a un repo público ni al espejo de deploy (este repo no tiene espejo).

## Fechas que importan (Winter 2027)

| Qué | Cuándo | Fuente |
| --- | --- | --- |
| Deadline a tiempo | **lunes 2 de noviembre de 2026, 8:00 pm PT** (11:00 pm hora de Caracas) | [ycombinator.com/apply](https://www.ycombinator.com/apply) |
| Respuesta si aplicamos a tiempo | antes del 11 de diciembre de 2026 | idem |
| Entrevistas | noviembre y diciembre, casi todas por video, ~10 minutos | idem |
| Batch | enero a marzo de 2027, presencial en San Francisco, con kickoff de 3 días | idem |
| Aplicación tardía | se lee, pero sin fecha de respuesta | idem |

El trato estándar: **USD 500.000**: 125.000 por 7 % (SAFE post-money) + 375.000 en SAFE sin tope con MFN. [ycombinator.com/deal](https://www.ycombinator.com/deal)

Antes de enviar, abrir el formulario real: YC cambia preguntas entre batches. Las de [`aplicacion.md`](aplicacion.md) son las del ciclo 2026 según fuentes de terceros.

## Por dónde empezar

| Archivo | Para qué |
| --- | --- |
| [`plan-hasta-el-deadline.md`](plan-hasta-el-deadline.md) | **Qué hace cada uno del 27 de octubre al 2 de noviembre.** Empezar aquí |
| [`aplicacion.md`](aplicacion.md) | Cada pregunta del formulario con el borrador en inglés, listo para pegar y editar |
| [`fundadores.md`](fundadores.md) | Quién aplica, roles, dedicación, equity, y lo que falta de cada uno |
| [`narrativa.md`](narrativa.md) | La historia: problema, insight, por qué ahora, mercado, modelo de negocio, competencia |
| [`competidores.md`](competidores.md) | **Quién hace lo mismo o parecido**, con enlaces directos a su página de YC, y qué hace Tridi en simple |
| [`verdad-hoy.md`](verdad-hoy.md) | Qué funciona, qué no, qué números podemos decir. **Nada se infla** |
| [`video-fundadores.md`](video-fundadores.md) | Guion del video de 1 minuto con todos los fundadores |
| [`demo.md`](demo.md) | Guion del video de demo del producto |
| [`entrevista.md`](entrevista.md) | Preparación de la entrevista de 10 minutos: preguntas probables y respuestas |
| [`legal-y-equity.md`](legal-y-equity.md) | Empresa, reparto de acciones, propiedad del código del hackathon, preguntas abiertas |
| [`otras-ideas.md`](otras-ideas.md) | Sálvalo, Tripealo y las ideas de Platanus: cómo contarlas sin que parezca falta de foco |
| [`../docs/pitch/tridi-pitch.pdf`](../docs/pitch/tridi-pitch.pdf) | El pitch que presentamos (4 slides), base del video y la entrevista |
| [`investigacion/startups/`](investigacion/startups/README.md) | **Quién entró a YC** (2022-2026, 3.100+ startups): robótica e IA física, Latinoamérica, aplicaciones y videos públicos, y qué cambiar en la nuestra |
| [`investigacion/voces/`](investigacion/voces/README.md) | **Voces**: transcripciones de referentes hablando de robots (Elon sobre Optimus, …) y qué aplica a Tridi |
| [`recursos.md`](recursos.md) | Lecturas obligatorias de YC y enlaces |
| [`aplicaciones/`](aplicaciones) | Copia exacta de lo enviado en cada batch, con la fecha y el resultado |

## Reglas

1. **Todo lo que se envía a YC está escrito aquí antes**, y se guarda tal cual en `aplicaciones/<batch>/` el día que se envía. Así la próxima aplicación parte de la anterior y YC ve progreso (ellos guardan las anteriores y preguntan "qué cambió").
2. **Nada se infla.** YC lee miles de aplicaciones y entrevista con preguntas que buscan exactamente la exageración. Lo que no funciona, se dice. Base: [`verdad-hoy.md`](verdad-hoy.md).
3. **Inglés claro y corto** en todo lo que va al formulario. Sin adjetivos de marketing. Frases que un partner entiende leyendo rápido.
4. Lo que dice `TODO(nombre)` lo tiene que llenar esa persona: son datos que solo ella sabe.

## Estado

| Pieza | Estado |
| --- | --- |
| Repo privado con todo el código del hackathon y su historia | Hecho (27 oct) |
| Borradores de todas las respuestas | Primera versión (27 oct): falta revisión del equipo y los TODO |
| Decidir quiénes son fundadores, CEO y reparto | **Pendiente: bloquea la aplicación** |
| Video de fundadores | Pendiente |
| Video de demo | Pendiente |
| Conversaciones con clientes posibles | Pendiente: es lo que más mejora la aplicación esta semana |
| Cuenta en [apply.ycombinator.com](https://apply.ycombinator.com) y perfiles de cada fundador | Pendiente |
| Enviada | — |

## Sobre el código

El resto del repo es Tridi tal como quedó al cierre de Platanus Hack 26 (151 commits del equipo). El repo público del hackathon (`platanus-hack/platanus-hack-26-ve-team-26`) queda como está; este es donde sigue el producto. El demo vivo, [tridi-alpha.vercel.app](https://tridi-alpha.vercel.app), todavía sale del espejo `Torpass/tridi`, que copia el repo del hackathon: mover el deploy a este repo es una decisión aparte (ver [`legal-y-equity.md`](legal-y-equity.md#deploy)).
