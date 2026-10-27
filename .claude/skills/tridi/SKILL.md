---
name: tridi
description: Tridi team workflow (Juan, Pastor, César, Ale). Use it to set up a teammate's machine (/tridi setup - clone juanevillam/tridi, hooks, dependencies, personal branch), to catch up on where the company and the YC application stand (/tridi estado), and whenever working in the tridi repo - syncing with main, shipping with scripts/ship.sh, keeping the session log in docs/bitacora, or working on the Y Combinator application in yc/. Trigger on /tridi, "set up tridi", "ponme al día", "ship this", "update the bitácora", or any work inside the tridi repo.
---

# Tridi: team workflow

Talk to the person in Spanish. Code, commits and PRs in English. The repo's `AGENTS.md` is the source of truth; this skill is the short path.

## What Tridi is, in one breath

Tridi turns an ordinary phone video of a person into training data and trained policies for humanoid robots (Unitree G1 in MuJoCo, PPO, ONNX). Born at Platanus Hack 26 Caracas (Oct 23-25, 2026). Now it is the team's company: private repo `juanevillam/tridi`, applying to **Y Combinator Winter 2027** (deadline Nov 2, 2026, 8pm PT) and to every batch in 2027. Everything YC lives in `yc/`.

## `/tridi setup`

Stop at the first failure and give the exact fix.

1. **gh:** `gh --version`, then `gh auth status`. Not logged in: ask them to run `gh auth login` (GitHub.com, SSH, browser) themselves. Never handle their credentials.
2. **Access:** `gh repo view juanevillam/tridi`. If it fails they have not accepted Juan's invitation: https://github.com/notifications.
3. **Clone** with SSH into their code folder (ask where; suggest `~/Code/tridi`). If it exists, `git -C <repo> pull --rebase` instead.
4. **Hooks:** `scripts/setup.sh` (pre-push guard for `main`, `pull.rebase`, `rerere`).
5. **Dependencies:** `uv` (`brew install uv`) then `uv sync` in `data/` and `training/`; `npm install` in `web/`, `physics/` and `data/live/`. The first `data` run downloads its models to `data/models/`.
6. **Branch:** ask their name and first topic: `git switch -c <name>/<topic>` (lowercase, no accents).
7. **Close:** tell them to open Claude Code inside `tridi/` and trust the folder so its hooks run, then run `/tridi estado`.

## `/tridi estado`

Read, in order, and summarize in a few lines what changed and what is next for this person:

1. `yc/README.md` (status table and dates) and `yc/plan-hasta-el-deadline.md`.
2. `yc/verdad-hoy.md` (what works, what doesn't).
3. `docs/estado.md` and the newest files in `docs/bitacora/`.
4. `git log --oneline -15 origin/main`.

## Working in the repo

- **Start of a session:** the `sync-main:` hook rebases the branch onto `origin/main`; read the incoming commits. On a conflict, `git rebase origin/main` first, keeping both sides; ask before choosing inside another person's folder.
- **Never commit on `main`.** Small conventional commits with the area as scope (`feat(training): ...`, `docs(yc): ...`).
- **Ship** when something works: `scripts/ship.sh "<type(scope): title>"` (squash-merges into `main`, leaves the branch equal to `main`). Ask before shipping unless told to.
- **Session log:** one file per session in `docs/bitacora/` (`YYYY-MM-DD-HHMM-<person>-<topic>.md`, `sesion: <id from the bitacora hook>`), updated before finishing every reply. Template in `docs/bitacora/README.md`.

## Working on the YC application

- Every claim must be backed by `yc/verdad-hoy.md`; if it is not there, add it with its proof or drop it.
- Form answers in plain English, short, numbers over adjectives. Team notes in Spanish.
- `TODO(name)` items are facts only that person knows: ask, never invent them.
- YC research (every startup of the 2026 batches, public applications, robotics deep dive): `yc/investigacion/startups/`. Refresh with `python3 yc/investigacion/startups/actualizar.py`.
- On the day an application is sent, copy it verbatim to `yc/aplicaciones/<batch>/`.

## Updating this skill

The repo copy at `.claude/skills/tridi/SKILL.md` is the source; Claude Code loads it automatically inside the repo. To use it from any folder:

```bash
mkdir -p ~/.claude/skills/tridi && cp .claude/skills/tridi/SKILL.md ~/.claude/skills/tridi/SKILL.md
```
