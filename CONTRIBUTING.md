# Cómo trabajamos (ramas y commits)

Somos 4 trabajando en paralelo, casi siempre con agentes de IA. El objetivo de este flujo es uno solo: **que nadie tenga que ponerse al día a mano con lo que subieron los demás.**

## La idea en 5 reglas

1. **`main` siempre funciona.** Nadie trabaja directo en `main`.
2. **Cada persona tiene su rama de trabajo**: `<nombre>/<tema>` (`pastor/fisica`, `juan/datos`, `cesar/ui`, `ale/docs`). No es una rama por prompt ni por feature: es tu espacio, y se reinicia sola cada vez que entregas.
3. **Entregas seguido y en pedazos chicos**: cada vez que algo funciona (idealmente cada 30 a 60 minutos) corres `scripts/ship.sh`. Eso lo mete a `main` con squash, y tu rama queda igual a `main` para seguir.
4. **Antes de cada prompt, tu rama se pone al día sola.** Un hook de Claude Code (`scripts/sync-main.sh`) trae lo nuevo de `main` y rebasea tu rama encima, y le cuenta al agente qué commits llegaron del equipo. Si hay un conflicto, no toca nada y le avisa al agente para que lo resuelva.
5. **Cada quien es dueño de su carpeta.** Puedes tocar código de otro cuando haga falta, pero en un cambio chico y separado, y avisas en el grupo.

Con eso, si Juan entregó 10 cosas en 20 minutos, Ale no hace nada: en su próximo prompt ya las tiene debajo.

## El ciclo, paso a paso

```bash
# Una vez, al empezar
git switch -c pastor/fisica

# Trabajas (con el agente o a mano) y commiteas cuando quieras
git add -A && git commit -m "feat(physics): add rigid bodies for the arena"

# Cuando algo funciona: a main
scripts/ship.sh
# o con título propio para el squash:
scripts/ship.sh "feat(physics): rigid bodies and collisions"
```

`ship.sh` hace, en orden: rebasea sobre `origin/main`, sube tu rama, abre el PR, lo mergea con squash, borra la rama remota y deja tu rama local igual a `main`. Sigues trabajando en la misma rama sin hacer nada más.

Si cambias de tema, cambia el nombre: `git switch -c pastor/ragdoll` justo después de un `ship`.

## Deploy

Cada merge a `main` despliega automáticamente a producción en **[`https://trytridi.com`](https://trytridi.com)** mediante GitHub Actions y Cloudflare Pages (`.github/workflows/deploy.yml`). Los detalles técnicos viven en [`docs/infra-and-security.md`](docs/infra-and-security.md).

## Quién es dueño de qué

Cada área vive en su carpeta para que dos personas casi nunca editen el mismo archivo.

| Persona | Área | Carpeta |
| --- | --- | --- |
| Pastor | Física, robot, retargeting y render 3D | `physics/` |
| Juan | Datos: video y cámara → `PoseClip`; servidor de videos | `data/` |
| Pastor y Juan | Entrenamiento de la política | `training/` |
| César | La app web | `web/` |
| Ale | Estrategia, pitch, YC | `docs/`, `yc/` |

## Lo compartido: el contrato

Lo que une las partes (formato de mensajes, tipos, el esquema de los datos) vive en **un solo lugar** (`docs/contrato.md` y su archivo de tipos cuando exista).

- Cambiar el contrato es su **propio** commit, chico, y se entrega con `ship.sh` **antes** del código que lo usa.
- Se avisa en el grupo: "cambié el contrato: X". El que depende de eso lo recibe en su próximo prompt.
- Si trabajas sobre algo que otro todavía no entregó, pídele que haga `ship` de lo que tenga, aunque sea incompleto pero sin romper `main`. Mejor eso que copiar su rama.

## Cuando hay conflicto

El hook no rebasea si hay conflicto: deja todo como estaba y le avisa al agente. Para resolverlo:

```bash
git rebase origin/main
# arreglas los archivos en conflicto, conservando lo de los dos
git add -A && git rebase --continue
```

Con agentes basta con decirle "resuelve el conflicto con main conservando el cambio del otro". Si el conflicto es en la carpeta de otro, pregúntale antes de decidir.

## Si `ship.sh` falla

Se detiene en el primer error y no borra nada. Arreglas lo que dice y lo vuelves a correr: retoma donde quedó (si el PR ya existe, no abre otro).

- **Conflicto al rebasear:** se resuelve igual que arriba y se corre `ship.sh` otra vez.
- **`gh` sin sesión:** `gh auth login`.
- **El merge falla** (por ejemplo, porque `main` cambió en ese segundo): vuelves a correr `ship.sh`.

## Commits

- **En inglés, con [conventional commits](https://www.conventionalcommits.org/)**: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, con el área entre paréntesis: `feat(physics): ...`, `fix(data): ...`, `docs(pitch): ...`.
- Los textos para el equipo y la documentación, en español.
- Cada número mágico lleva su porqué en un comentario o en el README.

## Bitácora: el historial con contexto

Además de los commits, cada sesión de trabajo deja un archivo en [`docs/bitacora/`](docs/bitacora) con qué se buscaba, qué se hizo, qué funcionó, qué no y qué sigue. El agente lo crea en el primer prompt de la sesión y lo actualiza después de cada prompt (un hook le recuerda cuál es su archivo). Encima de eso:

- [`docs/ROADMAP.md`](docs/ROADMAP.md): visión del producto y tablero de tareas por persona (`J-*`, `P-*`, `C-*`, `A-*`).
- [`docs/estado.md`](docs/estado.md): dónde está cada parte ahora; cada uno edita solo su sección.
- [`docs/README.md`](docs/README.md): índice de toda la documentación en `docs/`.

Reglas y plantilla en [`docs/bitacora/README.md`](docs/bitacora/README.md).

## Preparar tu máquina (una vez)

La forma fácil: abre Claude Code en tu carpeta de código y pide `/tridi setup` (la skill vive en `.claude/skills/tridi/`; si todavía no clonaste, pídele a Claude que siga los pasos de abajo). Después, `/tridi estado` te pone al día.

A mano:


1. Instala `gh`, la terminal de GitHub. En macOS: `brew install gh`. En Windows o Linux: [cli.github.com](https://cli.github.com).
2. Inicia sesión: `gh auth login` → GitHub.com → SSH → entrar con el navegador.
3. Acepta la invitación a `juanevillam/tridi` en [github.com/notifications](https://github.com/notifications).
4. Clona y prepara:

```bash
git clone git@github.com:juanevillam/tridi.git
cd tridi
scripts/setup.sh
git switch -c <nombre>/<tema>
```

Abre Claude Code en `tridi/` y acepta confiar en la carpeta, para que corran los hooks. Si tienes al lado `platanus-ideas/` (la investigación previa, privada), el hook también la mantiene al día.

`setup.sh` revisa que `gh` esté listo y activa en tu clon:

- un hook que **bloquea el push directo a `main`** (proteger la rama en GitHub en un repo privado pide GitHub Pro, así que lo cuidamos así);
- `pull.rebase`, para que los pulls no creen commits de merge;
- `rerere`, para que git recuerde cómo resolviste un conflicto y no te lo vuelva a preguntar.
