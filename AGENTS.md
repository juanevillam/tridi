# Tridi: context for agents

Private company repo of **Tridi** (`juanevillam/tridi`): Juan, Pastor, César and Ale. Tridi is for Physical AI: it turns video and CAD hardware designs into physics simulations (MuJoCo) and trained controllers (`ONNX` at 50 Hz + deterministic native C/firmware for real-world Sim-to-Real transfer). Current product roadmap and task board: [`docs/ROADMAP.md`](docs/ROADMAP.md). Write the reason next to every threshold or magic number.

## Where the company stands (read this first)

- **Goal:** **Y Combinator Winter 2027** (application submitted on **2026-11-02**; decisions by Dec 11; batch Jan–Mar 2027 in San Francisco) and real-world physical robot & industrial automation deployments.
- **Everything YC lives in [`yc/`](yc/README.md)** (Spanish; answers for the form in English) and the verbatim submitted application lives in [`yc/yc-w27-reference.md`](yc/yc-w27-reference.md).
- **Never state a YC answer, metric or claim that [`yc/verdad-hoy.md`](yc/verdad-hoy.md) does not back.** `TODO(name)` items are facts only that person knows: ask, never invent.
- Quick catch-up for a teammate: the `tridi` skill (`/tridi estado`), in [`.claude/skills/tridi/SKILL.md`](.claude/skills/tridi/SKILL.md). Machine setup: `/tridi setup`.

## Map

| Need | Where |
| --- | --- |
| **Product Roadmap, Customer Strategy & Team Task Board** | [`docs/ROADMAP.md`](docs/ROADMAP.md), [`docs/plan-v3-assembler.md`](docs/plan-v3-assembler.md) |
| **Clean index of all `docs/`** | [`docs/README.md`](docs/README.md) |
| **Real-World Cases, Field Meetings & Manuals** | [`docs/reunion-zaka.md`](docs/reunion-zaka.md), [`docs/caso-luigi-sim2real.md`](docs/caso-luigi-sim2real.md), [`docs/architecture-and-sim2real.md`](docs/architecture-and-sim2real.md), [`docs/infra-and-security.md`](docs/infra-and-security.md) |
| What each area does and how to run it | `data/README.md`, `physics/README.md`, `training/README.md`, `web/` |
| Where each part is now | [`docs/estado.md`](docs/estado.md), newest [`docs/bitacora/`](docs/bitacora) |
| Brand manual & official pitch deck | [`docs/marca.md`](docs/marca.md), [`docs/pitch/manual-de-marca-tridi.pdf`](docs/pitch/manual-de-marca-tridi.pdf), [`docs/pitch/tridi-pitch.pdf`](docs/pitch/tridi-pitch.pdf) |
| Shared JSON schemas between areas | [`docs/contrato.md`](docs/contrato.md) |
| The YC application & industry voices | [`yc/README.md`](yc/README.md), [`yc/competidores.md`](yc/competidores.md), [`yc/investigacion/voces/`](yc/investigacion/voces/README.md) |
| Web & Physics Quality Audit Playbook | [`docs/audit-playbook.md`](docs/audit-playbook.md), [`.claude/skills/tridi-quality/SKILL.md`](.claude/skills/tridi-quality/SKILL.md) |
| Session Handoff Summary | [`CONTEXT.md`](CONTEXT.md) |

## Remotes & Deploy

- `origin` is `juanevillam/tridi` (private).
- **Production (`https://trytridi.com`):** Deployed automatically from `main` to Cloudflare Pages (`tridi`, `tridi-18p.pages.dev`) via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Full DNS, Cloudflare security, HSTS, DMARC/SPF, and deploy details live in [`docs/infra-and-security.md`](docs/infra-and-security.md).
- **Video server:** `data/server.py` runs on Juan's Mac behind a Cloudflare tunnel (`data/serve.sh`); it writes the tunnel's changing URL to a gist that the web reads (`?api=` still overrides it). It keeps only PoseClips, never videos.

## Start of every session

1. Read [`docs/estado.md`](docs/estado.md) (where each part is now), [`docs/ROADMAP.md`](docs/ROADMAP.md), and the latest file in [`docs/bitacora/`](docs/bitacora).
2. If the session touches the YC application, also read [`yc/README.md`](yc/README.md) and [`yc/verdad-hoy.md`](yc/verdad-hoy.md).

## Git workflow (mandatory)

Full detail in [`CONTRIBUTING.md`](CONTRIBUTING.md). What an agent must do:

- **Never commit on `main`.** A pre-push hook (`.githooks/pre-push`, enabled by `scripts/setup.sh`) rejects direct pushes to it. Work on the person's branch `<name>/<topic>`; if you are on `main`, create one first.
- **A `sync-main:` message at the start of a prompt** comes from the hook that rebased this branch onto `origin/main`. Read the incoming commits: teammates may have changed code you depend on. If it reports a conflict, resolve it with `git rebase origin/main` before anything else, keeping both sides' intent; if the conflict is in another person's folder, ask before choosing.
- **Commit small and often**, in English with conventional commits and the area as scope: `feat(physics): ...`, `fix(data): ...`, `docs(internal): ...`. One logical change per commit.
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
  1. **Layer 1 (Human-First):** [`docs/ROADMAP.md`](docs/ROADMAP.md) and this person's section of [`docs/estado.md`](docs/estado.md) (plus [`docs/README.md`](docs/README.md) if a new active document is created).
  2. **Layer 2 (Technical Manuals):** [`docs/infra-and-security.md`](docs/infra-and-security.md), [`docs/architecture-and-sim2real.md`](docs/architecture-and-sim2real.md), or [`docs/contrato.md`](docs/contrato.md) depending on the area touched.
- **Public Mirror Boundary (`Torpass/tridi`):** [`yc/`](yc/README.md) lives exclusively in the private repo `juanevillam/tridi` and must **NEVER** be pushed to the public mirror `Torpass/tridi`.

## Team

| Person | GitHub | Area | Folder |
| --- | --- | --- | --- |
| Juan (CTO) | @juanevillam | Data (video and camera → `PoseClip`, video server), training, infra/security, much of the web | `data/`, `training/`, `web/` |
| Pastor (CEO) | @torpass | Physics engine, robot, retargeting, 3D render, hardware catalog, training | `physics/`, `training/` |
| César (CIO/CTO) | @cisorm | The web app & Assembler screens | `web/` |
| Ale (COO) | @alehernandezt | Strategy, industrial verticals, unit economics, YC application, customer conversations | `docs/`, `yc/` |

Exact submitted YC W27 application and 25/25/25/25 equity split live in [`yc/yc-w27-reference.md`](yc/yc-w27-reference.md).

## Conventions

- Code, commits and PRs in English. Docs and texts for the team in Spanish.
- Every long operation shows its progress; main buttons stay visible without scrolling.
- Whenever touching `web/` or `physics/`, follow [`docs/audit-playbook.md`](docs/audit-playbook.md) (`/tridi-craft-audit`, `/tridi-ux-audit`) and run `npm --prefix physics run check && npm --prefix web run check && npm --prefix web run build` before finishing.
