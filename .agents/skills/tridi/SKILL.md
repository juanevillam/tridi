---
name: tridi
description: Tridi team workflow (Juan, Pastor, César, Ale). Use it to set up a teammate's machine (/tridi setup - clone juanevillam/tridi, hooks, dependencies, personal branch), to catch up on where the company and the YC application stand (/tridi estado), and whenever working in the tridi repo - syncing with main, shipping with scripts/ship.sh, keeping the session log in docs/bitacora, auto-syncing the 2-layer documentation in docs/, or working on the Y Combinator application in yc/. Trigger on /tridi, "set up tridi", "ponme al día", "ship this", "update the bitácora", or any work inside the tridi repo.
---

# Tridi: team workflow

Talk to the person in Spanish. Code, commits and PRs in English. The repo's `AGENTS.md` is the source of truth; this skill is the short path.

## What Tridi is, in one breath

Tridi is a Physical AI platform (`https://trytridi.com`) with two input channels feeding one MuJoCo + GPU RL engine:
1. **Tridi Capture (Video to Robot):** ingests batches of internet or phone videos into 3D body + 21-keypoint 5-finger hands (`GVHMR + WiLoR`) and trains generalist humanoid policies (`Unitree G1`, `Unitree H1`) across edge cases and actuator faults.
2. **Tridi Assembler (Hardware & Code to Sim-to-Real):** takes any physical robot or factory automation cell's CAD (`.stl`/`.step`/URDF) + existing code (`.ino`/`.py`/PLC), builds its calibrated MuJoCo digital twin, retrains its control policy at 50 Hz (`ONNX`), and compiles non-blocking native firmware (`.ino`/C) or drives it live over WebSerial (proven in `luigi_lab3` and next in `luigi_lab4`).

Born at Platanus Hack 26 Caracas (Oct 23-25, 2026). Private company repo: `juanevillam/tridi` (deploys to `https://trytridi.com` on Cloudflare Pages); public YC mirror: `Torpass/tridi` (`https://tridi-alpha.vercel.app`).

## `/tridi setup`

Stop at the first failure and give the exact fix.

1. **gh:** `gh --version`, then `gh auth status`. Not logged in: ask them to run `gh auth login` (GitHub.com, SSH, browser) themselves. Never handle their credentials.
2. **Access:** `gh repo view juanevillam/tridi`. If it fails they have not accepted Juan's invitation: https://github.com/notifications.
3. **Clone** with SSH into their code folder (ask where; suggest `~/Code/tridi`). If it exists, `git -C <repo> pull --rebase` instead.
4. **Hooks:** `scripts/setup.sh` (pre-push guard for `main`, `pull.rebase`, `rerere`).
5. **Dependencies:** `uv` (`brew install uv`) then `uv sync` in `data/` and `training/`; `npm install` in `web/`, `physics/` and `data/live/`. The first `data` run downloads its models to `data/models/`.
6. **Branch:** ask their name and first topic: `git switch -c <name>/<topic>` (lowercase, no accents).
7. **Close:** tell them to open Claude Code / Antigravity inside `tridi/` and trust the folder so its hooks run, then run `/tridi estado`.

## `/tridi estado`

Read, in order, and summarize in a few lines what changed and what is next for this person:

1. `docs/ROADMAP.md` (current product vision, 4 verticals, customer ladder, and single-owner task board `J-*`, `P-*`, `C-*`, `A-*`) and `docs/README.md` (index of all docs in `docs/`).
2. `docs/estado.md` and the newest files in `docs/bitacora/`.
3. `git log --oneline -15 origin/main`.

## Working in the repo

- **Start of a session:** the `sync-main:` hook rebases the branch onto `origin/main`; read the incoming commits. On a conflict, `git rebase origin/main` first, keeping both sides; ask before choosing inside another person's folder.
- **Never commit on `main`.** Small conventional commits with the area as scope (`feat(training): ...`, `docs(yc): ...`).
- **Ship** when something works: `scripts/ship.sh "<type(scope): title>"` (squash-merges into `main`, leaves the branch equal to `main`). Ask before shipping unless told to.
- **2-Layer Documentation Auto-Sync (mandatory before `ship.sh` or closing a milestone — never wait to be asked):**
  - Alongside the session log in `docs/bitacora/`, whenever a session completes or advances a task in `docs/ROADMAP.md` (`J-*`, `P-*`, `C-*`, `A-*`), adds a new physical robot/factory case (`luigi_lab4`, etc.), changes JSON schemas/contracts, or modifies Cloudflare/infra/Sim-to-Real architecture, **automatically update**:
    1. **Layer 1 (Human-First):** `docs/ROADMAP.md` and `docs/estado.md` (plus `docs/README.md` if a new active document is created).
    2. **Layer 2 (Technical):** `docs/infra-and-security.md`, `docs/architecture-and-sim2real.md`, or `docs/contrato.md` depending on the area touched.
  - **Public Mirror Boundary:** `yc/` lives exclusively in the private repo `juanevillam/tridi` and must **NEVER** be pushed to the public mirror `Torpass/tridi`.
- **Session log:** one file per session in `docs/bitacora/` (`YYYY-MM-DD-HHMM-<person>-<topic>.md`, `sesion: <id from the bitacora hook>`), updated before finishing every reply. Template in `docs/bitacora/README.md`.

## Working on the YC application

- Every claim must be backed by `yc/verdad-hoy.md` and `yc/yc-w27-reference.md`; if it is not there, add it with its proof or drop it.
- Form answers in plain English, short, numbers over adjectives. Team notes in Spanish.
- `TODO(name)` items are facts only that person knows: ask, never invent them.
- YC research (every startup of the 2026 batches, public applications, robotics deep dive): `yc/investigacion/startups/`. Refresh with `python3 yc/investigacion/startups/actualizar.py`.

## Updating this skill

The repo copy at `.claude/skills/tridi/SKILL.md` (mirrored at `.agents/skills/tridi/SKILL.md`) is the source; Claude Code and Antigravity load it inside the repo. To sync it globally:

```bash
mkdir -p ~/.claude/skills/tridi ~/.gemini/config/skills/tridi && cp .claude/skills/tridi/SKILL.md ~/.claude/skills/tridi/SKILL.md && cp .claude/skills/tridi/SKILL.md ~/.gemini/config/skills/tridi/SKILL.md
```
