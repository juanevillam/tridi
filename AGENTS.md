# Tridi: context for agents

Private company repo of **Tridi** (`juanevillam/tridi`): Juan, Pastor, César and Ale. Tridi is for Physical AI: it turns video into training data for humanoid robots. Video or camera → 3D skeleton of one person → the motion on a simulated Unitree G1 (MuJoCo) → the robot learns it by imitation, with pushes and varied worlds → it delivers a small trained policy (ONNX) and the physics-corrected motion data. Pitch, and what is true today versus planned: [`docs/pitch/pitch-producto.md`](docs/pitch/pitch-producto.md); how it is built, by area: [`docs/plan-producto.md`](docs/plan-producto.md). Origin of the idea: [`docs/decisiones/2026-10-23-idea-tridi.md`](docs/decisiones/2026-10-23-idea-tridi.md). Write the reason next to every threshold or magic number.

Tridi was born at Platanus Hack 26 Caracas (October 23 to 25, 2026). This repo was cloned from the hackathon repo's `main` with its full history on 2026-10-27, and the product continues here. Older docs (`docs/bitacora/`, `docs/decisiones/`, `docs/pitch/`) are the hackathon's record: keep them as history, don't rewrite them.

## Where the company stands (read this first)

- **Goal:** apply to **Y Combinator Winter 2027** (on-time deadline **2026-11-02, 8pm PT**; decisions by Dec 11; batch Jan-Mar 2027 in San Francisco), then to every YC batch in 2027 until we get in. This is our first YC application.
- **Everything YC lives in [`yc/`](yc/README.md)** (Spanish; answers for the form in English): the form drafts, founders, narrative, what is true today, video scripts, interview prep, legal/equity, the day-by-day plan, and research on the startups YC accepted (`yc/investigacion/startups/`).
- **Never state a YC answer, metric or claim that [`yc/verdad-hoy.md`](yc/verdad-hoy.md) does not back.** `TODO(name)` items are facts only that person knows: ask, never invent.
- The team also runs other projects (Sálvalo, Tripealo); Tridi is the one we apply to YC with. See [`yc/otras-ideas.md`](yc/otras-ideas.md).
- Quick catch-up for a teammate: the `tridi` skill (`/tridi estado`), in [`.claude/skills/tridi/SKILL.md`](.claude/skills/tridi/SKILL.md). Machine setup: `/tridi setup`.

## Map

| Need | Where |
| --- | --- |
| **Product Roadmap, Customer Strategy & Team Task Board (Nov 2026)** | [`docs/ROADMAP.md`](docs/ROADMAP.md), [`docs/plan-v3-assembler.md`](docs/plan-v3-assembler.md) |
| **Human-friendly index of all `docs/`** | [`docs/README.md`](docs/README.md) |
| What each area does and how to run it | `data/README.md`, `physics/README.md`, `training/README.md`, `web/` |
| Where each part is now | [`docs/estado.md`](docs/estado.md), newest [`docs/bitacora/`](docs/bitacora) |
| Shared formats between areas | [`docs/contrato.md`](docs/contrato.md) |
| Why things are the way they are | [`docs/decisiones/`](docs/decisiones) |
| The pitch we presented, scripts, hard questions | [`docs/pitch/`](docs/pitch) (`tridi-pitch.pdf`), [`yc/contexto-tecnico.md`](yc/contexto-tecnico.md) |
| The YC application | [`yc/README.md`](yc/README.md) |
| Competitors and look-alikes, with direct links | [`yc/competidores.md`](yc/competidores.md) |
| Startups YC accepted, by batch, and what we learn from them | [`yc/investigacion/startups/`](yc/investigacion/startups/README.md) |
| Market research for robot data | [`yc/investigacion/mercado-robotica.md`](yc/investigacion/mercado-robotica.md) |
| Web & Physics Quality Audit Playbook | [`docs/audit-playbook.md`](docs/audit-playbook.md), [`.claude/skills/tridi-quality/SKILL.md`](.claude/skills/tridi-quality/SKILL.md) |
| Internal Engineering, Infra, Security & YC Manuals | [`docs/internal/README.md`](docs/internal/README.md) (`infra-and-security.md`, `architecture-and-sim2real.md`, `yc-w27-reference.md`) |
| Session Handoff Summary | [`CONTEXT.md`](CONTEXT.md) |

## Remotes

- `origin` is `juanevillam/tridi` (private). The hackathon repo may exist as a remote `platanus-hack`: it is public and frozen, never push there.
- No mirror: nothing in this repo deploys yet (see Deploy below).

## Start of every session

1. Read [`docs/estado.md`](docs/estado.md) (where each part is now) and the latest files in [`docs/bitacora/`](docs/bitacora) (what happened while this person was away).
   Before writing product copy or claims (web, README, pitch), check the "Qué es verdad hoy y qué es plan" table in [`docs/pitch/pitch-producto.md`](docs/pitch/pitch-producto.md): what is planned is never shown as done.
2. If the session touches the YC application, also read [`yc/README.md`](yc/README.md) (status and dates) and [`yc/verdad-hoy.md`](yc/verdad-hoy.md).
3. Older research from before the hackathon lives in the private repo `juanevillam/platanus-ideas` (optional; if cloned next to this repo as `../platanus-ideas`, the sync hook keeps it updated).

## Git workflow (mandatory)

Full detail in [`CONTRIBUTING.md`](CONTRIBUTING.md). What an agent must do:

- **Never commit on `main`.** A pre-push hook (`.githooks/pre-push`, enabled by `scripts/setup.sh`) rejects direct pushes to it. Work on the person's branch `<name>/<topic>`; if you are on `main`, create one first.
- **A `sync-main:` message at the start of a prompt** comes from the hook that rebased this branch onto `origin/main`. Read the incoming commits: teammates may have changed code you depend on. If it reports a conflict, resolve it with `git rebase origin/main` before anything else, keeping both sides' intent; if the conflict is in another person's folder, ask before choosing.
- **Commit small and often**, in English with conventional commits and the area as scope: `feat(physics): ...`, `fix(data): ...`, `docs(pitch): ...`. One logical change per commit.
- **Ship when something works**: `scripts/ship.sh "<type(scope): title>"` squash-merges the branch into `main` and resets the branch to the new `main`. Only ship code that runs: `main` must always work. Ask the person before shipping if they have not asked you to.
- **Stay in your owner's folder.** If you must touch another area, make it a separate small commit and tell the person so they can warn its owner.
- **Shared contract** (message formats, types, data schema) lives in [`docs/contrato.md`](docs/contrato.md) and its types file. A contract change is its own commit, shipped before the code that uses it.

## Session log & 2-Layer Documentation Auto-Sync (mandatory)

Rules and template in [`docs/bitacora/README.md`](docs/bitacora/README.md) and [`docs/README.md`](docs/README.md).

- **One file per session in `docs/bitacora/`, updated after every prompt** that changes code, docs or decisions. A `bitacora:` message at the start of each prompt names this session's file, or says there is none yet.
- Create it as `docs/bitacora/YYYY-MM-DD-HHMM-<person>-<topic>.md` with the `sesion:` id the hook gives you. Only ever edit this session's file.
- Before finishing each reply, update it: what was done, what worked, what did not and why, decisions, what comes next. Commit it with the work (`docs(bitacora): ...` if alone).
- **2-Layer Documentation Auto-Sync (automatic before `scripts/ship.sh` or closing a milestone — never wait to be asked):**
  Whenever a session completes or advances a task in [`docs/ROADMAP.md`](docs/ROADMAP.md) (`J-*`, `P-*`, `C-*`, `A-*`), adds a new physical robot/factory case (`luigi_lab4`, etc.), changes a JSON schema/contract, or modifies infrastructure (`trytridi.com` / Cloudflare / `data/server.py`) or Sim-to-Real architecture, the agent **MUST automatically update in the same branch before shipping**:
  1. **Layer 1 (Human-First):** [`docs/ROADMAP.md`](docs/ROADMAP.md) and this person's section of [`docs/estado.md`](docs/estado.md) (plus [`docs/README.md`](docs/README.md) if a new active document is created). Decisions that affect others also go to [`docs/decisiones/`](docs/decisiones); open questions to [`docs/preguntas-abiertas.md`](docs/preguntas-abiertas.md).
  2. **Layer 2 (Technical & Internal Manuals):** [`docs/internal/infra-and-security.md`](docs/internal/infra-and-security.md), [`docs/internal/architecture-and-sim2real.md`](docs/internal/architecture-and-sim2real.md), or [`docs/contrato.md`](docs/contrato.md) depending on the area touched.
- **Public Mirror Boundary (`Torpass/tridi`):** [`docs/internal/`](docs/internal/README.md) and [`yc/`](yc/README.md) live exclusively in the private repo `juanevillam/tridi` and must **NEVER** be pushed to the public mirror `Torpass/tridi` (`tridi-alpha.vercel.app`).

## Team

| Person | GitHub | Area | Folder |
| --- | --- | --- | --- |
| Juan (CTO) | @juanevillam | Data (video and camera → `PoseClip`, video server), training, infra/security, much of the web | `data/`, `training/`, `web/` |
| Pastor (CEO) | @torpass | Physics engine, robot, retargeting, 3D render, hardware catalog, training | `physics/`, `training/` |
| César (CIO/CTO) | @cisorm | The web app & Assembler screens | `web/` |
| Ale (COO) | @alehernandezt | Strategy, industrial verticals, unit economics, YC application, customer conversations | `docs/`, `yc/` |

Exact submitted YC W27 application and 25/25/25/25 equity split live in [`docs/internal/yc-w27-reference.md`](docs/internal/yc-w27-reference.md).

## Deploy

- **Production (`https://trytridi.com`):** Deployed on Cloudflare Pages (project `tridi`, `tridi-18p.pages.dev`) and automated via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) so any teammate can push and deploy without Vercel Hobby seat restrictions. Full DNS, Cloudflare security, HSTS, DMARC/SPF, and deploy instructions live in [`docs/internal/infra-and-security.md`](docs/internal/infra-and-security.md).
- **Legacy hackathon mirror (`https://tridi-alpha.vercel.app`):** Deploys from the public mirror [`Torpass/tridi`](https://github.com/Torpass/tridi) of the frozen hackathon repo and stays up for backward compatibility with older links.

- **Video server:** `data/server.py` runs on Juan's Mac behind a Cloudflare tunnel (`data/serve.sh`); it writes the tunnel's changing URL to a gist that the web reads, so the web's address never changes (`?api=` still overrides it). It keeps only PoseClips, never videos. Detail in [`docs/decisiones/2026-10-24-servidor-de-video-en-la-mac.md`](docs/decisiones/2026-10-24-servidor-de-video-en-la-mac.md).

## Conventions

- Code, commits and PRs in English. Docs and texts for the team in Spanish.
- Every long operation shows its progress; main buttons stay visible without scrolling.
- Whenever touching `web/` or `physics/`, follow [`docs/audit-playbook.md`](docs/audit-playbook.md) (`/tridi-craft-audit`, `/tridi-ux-audit`) and run `npm --prefix physics run check && npm --prefix web run check && npm --prefix web run build` before finishing.
