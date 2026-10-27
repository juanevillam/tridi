# Empresa, equity y propiedad

Nada de esto es asesoría legal: es la lista de lo que hay que decidir y a quién preguntar.

## Para aplicar no hace falta empresa

YC acepta aplicaciones sin entidad legal, y fundadores de fuera de EE. UU. Si nos aceptan, YC normalmente pide una **C-corp de Delaware** (o una estructura que pueda invertir en ella) y ayuda a hacerla. No incorporar nada antes de saber si entramos, salvo que un abogado diga otra cosa.

`TODO`: confirmar en [YC FAQ](https://www.ycombinator.com/faq) las condiciones actuales para fundadores no estadounidenses.

## Reparto entre fundadores (decidir antes de enviar)

El formulario pregunta cómo se reparte la empresa. Lo que YC recomienda en general: repartos parejos o casi, entre quienes van a trabajar full-time, con **vesting** (4 años, 1 de cliff) para todos. Un reparto muy desigual o sin vesting levanta preguntas.

| Decisión | Estado |
| --- | --- |
| Quiénes son fundadores | `TODO(equipo)` |
| Porcentaje de cada uno | `TODO(equipo)` |
| Vesting | Recomendado: 4 años con 1 de cliff |
| Quién es CEO | `TODO(equipo)` |

Hablarlo una vez, en persona, y escribirlo aquí. Es la conversación que más startups rompe si se deja para después.

## Propiedad del código

El código nació en Platanus Hack 26, en un repo **público** de la organización `platanus-hack`. Preguntas abiertas:

1. `TODO`: ¿las bases de Platanus Hack 26 dicen algo sobre la propiedad intelectual de lo construido? Leerlas.
2. ¿Qué licencia tiene el repo público? Hoy no tiene archivo `LICENSE`: por defecto, los derechos son de los autores (nosotros). Si queremos que el código siga abierto o no, decidirlo.
3. Todos los fundadores tienen que ceder su parte del código a la empresa cuando exista (es estándar en la incorporación).
4. Rafael Fernández (@rafafdz) aparece con 4 commits: son la plantilla de los organizadores, no código del producto.

## Deploy

El demo vivo sale del espejo público `Torpass/tridi` (cuenta de Pastor), que copia el repo del hackathon. Opciones:

- **Dejarlo así** mientras dure la aplicación: el demo sigue funcionando y no tocamos nada.
- **Mover el deploy a este repo privado** cuando el producto siga aquí: un proyecto de Vercel conectado a `juanevillam/tridi` (o a una organización de GitHub de Tridi), con dominio propio.

Este repo no tiene espejo (se borró `scripts/mirror.sh`), así que nada privado llega al espejo público.

## Dónde vive el repo

Hoy en la cuenta personal de Juan (`juanevillam/tridi`, privado). Cuando haya fundadores definidos, conviene crear una **organización de GitHub `tridi`** (si está libre) y transferirlo: `gh repo transfer` mantiene historia, issues y redirecciones.

## Visa (si entramos)

El batch es presencial en San Francisco. Fundadores venezolanos necesitan visa para entrar a EE. UU. `TODO`: revisar qué pasaporte tiene cada uno, tiempos de cita de visa, y lo que dice YC para fundadores internacionales. Es lo que más tiempo toma: empezar apenas haya entrevista.
