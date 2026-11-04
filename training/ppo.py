"""PPO for the G1: an MLP policy learns to stand and take pushes, saving checkpoints along the way.

    uv run --project training python -m training.ppo [--task stand|mimic] [--motion <clip>] [--steps 20000000] [--run stand]
        [--every 2000000] [--export-dir <dir>] [--policy-prefix <id>] [--resume] [--note "why this run"]

Checkpoints go to training/runs/<run>/ as step_<N>.pt plus a progress.csv, at 0, 10k, 100k, 1M,
3M, 10M... environment steps (and every --every steps): the pitch shows the same robot at several of
them side by side. Each one is also exported right away as <prefix>-step-<N>.onnx + .json (to
--export-dir, the run folder by default), so the web can load a checkpoint while training goes on.

Long runs on Juan's work Mac (docs/plan-v2.md, section 3):
- guard.py slows the training down while the Mac is in use and pauses it on battery or when hot.
- latest.pt is saved every few minutes and on Ctrl-C; --resume continues a run where it stopped.
- Every checkpoint is evaluated (evals.csv) and plateau.py stops the run when it stops learning,
  writing plateau.md with why. --no-plateau-stop keeps it going anyway.
- Each finished run adds a line to training/experiments.csv (versioned): what changed and what it gave.
"""

from __future__ import annotations

import argparse
import csv
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import torch
from torch import nn

from .env import EPISODE_STEPS, NU, OBS_DIM, PUSH_EVERY_S, PUSH_N, Stance
from .guard import Guard
from .netlive import NetLive
from .plateau import MIN_STEPS, judge
from .vec import VecEnv

RUNS = Path(__file__).parent / "runs"
REGISTRY = Path(__file__).parent / "experiments.csv"
# latest.pt this often: a crash, a reboot or a closed lid loses at most this much training.
LATEST_EVERY_S = 300
# A long run with no --every still gets enough evaluations for plateau.py to judge it: one every
# this share of the run (20 evaluations over the run), never closer than 1 M steps.
AUTO_EVALS = 20

# 64 robots x 64 steps = 4096 transitions per update. 64 robots fill the 8 cores of an M2 (11.8k
# steps/s measured); 64 steps (1.3 s of robot time) is long enough for GAE to see a stumble's cost.
NUM_ENVS = 64
WORKERS = 8
ROLLOUT = 64

# Standard PPO for continuous control (CleanRL, legged_gym), not tuned for this robot.
GAMMA = 0.99  # values ~2 s ahead (1 / (1 - 0.99) = 100 steps at 50 Hz): enough to feel a coming fall
LAMBDA = 0.95
CLIP = 0.2
EPOCHS = 5
MINIBATCHES = 4
LR = 3e-4
MAX_GRAD_NORM = 1.0
VALUE_COEF = 1.0
ENTROPY_COEF = 0.0  # exploration comes from the learned std, which starts at 0.5 (0.12 rad)
INIT_LOG_STD = np.log(0.5)

# Environment steps where a checkpoint is saved. 1k from the original plan is left out: it is less
# than one update (4096), so it would be the same untrained policy as step 0.
CHECKPOINTS = [0, 10_000, 100_000, 1_000_000, 3_000_000, 10_000_000, 30_000_000, 100_000_000]


class RunningNorm(nn.Module):
    """Running mean and std of the observations, so the network sees inputs near N(0, 1).
    Stored as buffers: the exported ONNX normalizes by itself and the browser sends raw obs."""

    def __init__(self, dim: int):
        super().__init__()
        self.register_buffer("mean", torch.zeros(dim))
        self.register_buffer("var", torch.ones(dim))
        self.register_buffer("count", torch.tensor(1e-4))

    def update(self, x: torch.Tensor) -> None:
        batch_mean, batch_var, n = x.mean(0), x.var(0, unbiased=False), x.shape[0]
        delta = batch_mean - self.mean
        total = self.count + n
        self.mean += delta * n / total
        self.var = (self.var * self.count + batch_var * n + delta**2 * self.count * n / total) / total
        self.count = total

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Clipped at 5 std: one strange reading (a contact spike) cannot saturate the network.
        return torch.clamp((x - self.mean) / torch.sqrt(self.var + 1e-8), -5, 5)


def mlp(inp: int, out: int, hidden=(256, 128, 64)) -> nn.Sequential:
    layers, last = [], inp
    for h in hidden:
        layers += [nn.Linear(last, h), nn.ELU()]
        last = h
    layers.append(nn.Linear(last, out))
    return nn.Sequential(*layers)


class ActorCritic(nn.Module):
    """Small enough to run every 20 ms in a phone's browser: ~70k parameters per network."""

    def __init__(self, obs_dim: int = OBS_DIM):
        super().__init__()
        self.norm = RunningNorm(obs_dim)
        self.actor = mlp(obs_dim, NU)
        self.critic = mlp(obs_dim, 1)
        self.log_std = nn.Parameter(torch.full((NU,), float(INIT_LOG_STD)))
        # Small last layer: the untrained policy starts near the standing pose instead of random.
        nn.init.orthogonal_(self.actor[-1].weight, 0.01)
        nn.init.zeros_(self.actor[-1].bias)

    def dist(self, obs: torch.Tensor) -> torch.distributions.Normal:
        return torch.distributions.Normal(self.actor(self.norm(obs)), self.log_std.exp())

    def value(self, obs: torch.Tensor) -> torch.Tensor:
        return self.critic(self.norm(obs)).squeeze(-1)


def obs_size(task: str) -> int:
    if task == "mimic":
        from .imitate import MIMIC_OBS_DIM

        return MIMIC_OBS_DIM
    return OBS_DIM


def save(model: ActorCritic, run_dir: Path, step: int, meta: dict, export_dir: Path | None = None,
         prefix: str = "") -> None:
    """A checkpoint also says what it learned (task and motion), so export and evaluation need no flags.
    With export_dir it is exported to ONNX at once (export.py): every checkpoint is usable by the web
    as soon as it exists, not only the last one."""
    path = run_dir / f"step_{step}.pt"
    torch.save({"model": model.state_dict(), "step": step, **meta}, path)
    if export_dir is not None:
        from .export import export

        print()  # off the \r progress line
        export(path, f"{prefix}-step-{step}", export_dir)


def train(total_steps: int, run: str, device: str, init: Path | None, push_n: tuple[float, float], task: str,
          motion: str | None = None, every: int = 0, export_dir: Path | None = None, prefix: str | None = None,
          push_every: tuple[float, float] = PUSH_EVERY_S, stance: Stance | None = None, std: float | None = None,
          seed: int = 0, worlds: tuple[str, ...] = (), wind_max: float | None = None, resume: bool = False,
          guard_on: bool = True, plateau_stop: bool = True, note: str = "", argv: str = "", shared: str = "background") -> None:
    run_dir = RUNS / run
    run_dir.mkdir(parents=True, exist_ok=True)
    torch.manual_seed(seed)
    if every <= 0 and total_steps >= 10 * MIN_STEPS:
        every = max(1_000_000, total_steps // AUTO_EVALS // 1_000_000 * 1_000_000)
    obs_dim = obs_size(task)
    model = ActorCritic(obs_dim)
    if init:  # continue from an earlier run (its steps are not counted again)
        model.load_state_dict(torch.load(init)["model"])
    if std is not None:
        # A continued run inherits a narrowed std (0.5 -> 0.2 after 40 M steps), and with no entropy
        # bonus it only narrows further: a changed reward needs the exploration opened again.
        model.log_std.data.fill_(np.log(std))
    opt = torch.optim.Adam(model.parameters(), lr=LR, eps=1e-5)
    envs = VecEnv(NUM_ENVS, WORKERS, seed=seed, push_n=push_n, task=task, motion=motion, push_every=push_every, stance=stance,
                  worlds=worlds, wind_max=wind_max)
    obs = envs.reset()
    meta = {"task": task, "motion": motion} if task == "mimic" else {"task": task}
    meta["worlds"] = list(worlds) or ["plano"]
    extra = range(every, total_steps, every) if every > 0 else []
    pending = sorted({c for c in CHECKPOINTS if c <= total_steps} | set(extra))
    out = (export_dir, prefix or run)
    step, elapsed = 0, 0.0
    latest = run_dir / "latest.pt"
    if resume and latest.exists():
        state = torch.load(latest)
        model.load_state_dict(state["model"])
        opt.load_state_dict(state["opt"])
        step, elapsed = state["step"], state["seconds"]
        pending = [c for c in pending if c > step]
        print(f"resuming {run} at {step:,} steps ({elapsed / 3600:.1f} h trained so far)")
    else:
        save(model, run_dir, 0, meta, *out)
        pending.remove(0)

    # The metric plateau.py judges, higher is better: seconds of the clip followed from its start
    # (imitation, evaluate_walk.run), or mean episode seconds (standing, from training itself).
    ceiling = None
    if task == "mimic":
        from .evaluate_walk import run as follow

        ceiling = follow(None, motion or _default_motion())[1]  # the clip's duration
    else:
        ceiling = EPISODE_STEPS / 50
    evals_path = run_dir / "evals.csv"
    evals: list[tuple[int, float]] = []
    if resume and evals_path.exists():
        with open(evals_path) as f:
            evals = [(int(r["step"]), float(r["metric"])) for r in csv.DictReader(f)]
    else:
        with open(evals_path, "w", newline="") as f:
            csv.writer(f).writerow(["step", "metric", "verdict"])
    recent_eps: list[float] = []

    def evaluate(at: int) -> float:
        if task == "mimic":
            model.eval()
            value = follow(model, motion or _default_motion())[0]
            model.train()
            return value
        return float(np.mean(recent_eps[-20:])) if recent_eps else 0.0

    appending = resume and (run_dir / "progress.csv").exists()
    log = open(run_dir / "progress.csv", "a" if appending else "w", newline="")
    writer = csv.writer(log)
    if not appending:
        writer.writerow(["step", "seconds", "reward_per_step", "episode_s", "falls", "steps_per_s", "mode"])
    ep_len = np.zeros(NUM_ENVS)
    start = time.time() - elapsed
    net = NetLive(run_dir, task, total_steps)  # what the web draws while this trains (netlive.py)
    guard = Guard([os.getpid(), *(p.pid for p in envs.procs)], run_dir, enabled=guard_on, shared=shared)
    saved_at = time.time()
    stopped = {"why": ""}

    def save_latest() -> None:
        torch.save({"model": model.state_dict(), "opt": opt.state_dict(), "step": step,
                    "seconds": time.time() - start - guard.paused_s, **meta}, latest)

    def on_signal(signum, _frame) -> None:
        stopped["why"] = "interrupted"
        raise KeyboardInterrupt

    # Both, set by hand: a run started in the background inherits SIGINT ignored, and Ctrl-C would
    # then do nothing at all. Workers ignore SIGINT (vec.py), so only this process decides.
    signal.signal(signal.SIGTERM, on_signal)
    signal.signal(signal.SIGINT, on_signal)
    verdict = None

    try:
      while step < total_steps:
          guard.checkpoint()
          t0 = time.time()
          buf_obs = np.zeros((ROLLOUT, NUM_ENVS, obs_dim), np.float32)
          buf_act = np.zeros((ROLLOUT, NUM_ENVS, NU), np.float32)
          buf_logp = np.zeros((ROLLOUT, NUM_ENVS), np.float32)
          buf_rew = np.zeros((ROLLOUT, NUM_ENVS), np.float32)
          buf_done = np.zeros((ROLLOUT, NUM_ENVS), np.float32)
          buf_val = np.zeros((ROLLOUT + 1, NUM_ENVS), np.float32)
          finished, falls = [], 0

          # Rollouts run the policy on CPU: 64 observations per call is too small for the GPU to pay
          # off its transfer cost.
          with torch.no_grad():
              for t in range(ROLLOUT):
                  o = torch.as_tensor(obs)
                  d = model.dist(o)
                  a = d.sample()
                  buf_obs[t], buf_act[t] = obs, a.numpy()
                  buf_logp[t] = d.log_prob(a).sum(-1).numpy()
                  buf_val[t] = model.value(o).numpy()
                  obs, rew, term, trunc, final, _ = envs.step(a.numpy())
                  if trunc.any():
                      # Time ran out, the robot did not fall: count the future it would still have had.
                      rew = rew + GAMMA * trunc * model.value(torch.as_tensor(final)).numpy()
                  buf_rew[t], buf_done[t] = rew, term | trunc
                  ep_len += 1
                  for i in np.flatnonzero(term | trunc):
                      finished.append(ep_len[i] / 50)
                      ep_len[i] = 0
                  falls += int(term.sum())
              buf_val[ROLLOUT] = model.value(torch.as_tensor(obs)).numpy()
          model.norm.update(torch.as_tensor(buf_obs.reshape(-1, obs_dim)))

          # Generalized advantage estimation.
          adv = np.zeros_like(buf_rew)
          last = np.zeros(NUM_ENVS, np.float32)
          for t in reversed(range(ROLLOUT)):
              nonterminal = 1.0 - buf_done[t]
              delta = buf_rew[t] + GAMMA * buf_val[t + 1] * nonterminal - buf_val[t]
              last = delta + GAMMA * LAMBDA * nonterminal * last
              adv[t] = last
          ret = adv + buf_val[:ROLLOUT]

          # PPO update, in minibatches of 1024.
          model.to(device)
          b_obs = torch.as_tensor(buf_obs.reshape(-1, obs_dim), device=device)
          b_act = torch.as_tensor(buf_act.reshape(-1, NU), device=device)
          b_logp = torch.as_tensor(buf_logp.reshape(-1), device=device)
          b_adv = torch.as_tensor(adv.reshape(-1), device=device)
          b_ret = torch.as_tensor(ret.reshape(-1), device=device)
          b_adv = (b_adv - b_adv.mean()) / (b_adv.std() + 1e-8)
          n = b_obs.shape[0]
          mb = n // MINIBATCHES
          for _ in range(EPOCHS):
              perm = torch.randperm(n, device=device)
              for k in range(MINIBATCHES):
                  idx = perm[k * mb : (k + 1) * mb]
                  d = model.dist(b_obs[idx])
                  logp = d.log_prob(b_act[idx]).sum(-1)
                  ratio = (logp - b_logp[idx]).exp()
                  pg = -torch.min(ratio * b_adv[idx], ratio.clamp(1 - CLIP, 1 + CLIP) * b_adv[idx]).mean()
                  v_loss = ((model.value(b_obs[idx]) - b_ret[idx]) ** 2).mean()
                  loss = pg + VALUE_COEF * v_loss - ENTROPY_COEF * d.entropy().sum(-1).mean()
                  opt.zero_grad()
                  loss.backward()
                  nn.utils.clip_grad_norm_(model.parameters(), MAX_GRAD_NORM)
                  opt.step()
          model.to("cpu")

          step += ROLLOUT * NUM_ENVS
          sps = ROLLOUT * NUM_ENVS / (time.time() - t0)
          ep = float(np.mean(finished)) if finished else float("nan")
          if finished:
              recent_eps.append(ep)
          writer.writerow([step, round(time.time() - start, 1), round(float(buf_rew.mean()), 4), round(ep, 2), falls, int(sps),
                           guard.mode])
          log.flush()
          net.record(step, float(buf_rew.mean()), ep)
          if net.due():
              net.write(model, buf_obs[:, 0], step)
          print(f"\rstep {step:>10,} / {total_steps:,} ({100 * step / total_steps:4.1f}%)  reward/step {buf_rew.mean():.3f}  "
                f"episode {ep:5.1f} s  falls {falls:3d}  {sps:,.0f} steps/s  [{guard.mode}]", end="", flush=True)
          while pending and step >= pending[0]:
              at = pending.pop(0)
              save(model, run_dir, at, meta, *out)
              value = evaluate(at)
              evals.append((step, value))
              verdict = judge(evals, ceiling)
              with open(evals_path, "a", newline="") as f:
                  csv.writer(f).writerow([step, round(value, 3), verdict.text])
              print(f"\n[eval] {step:,} steps: {value:.2f} (ceiling {ceiling:.1f}) · {verdict.text}", flush=True)
              if verdict.stop and plateau_stop:
                  stopped["why"] = verdict.rule
                  write_report(run_dir, evals, verdict, ceiling)
                  break
          if stopped["why"]:
              break
          if time.time() - saved_at > LATEST_EVERY_S:
              save_latest()
              saved_at = time.time()
    except KeyboardInterrupt:
        stopped["why"] = stopped["why"] or "interrupted"
        print(f"\nstopped at {step:,} steps; continue with --resume")
    finally:
        save_latest()
        guard.close()
    if stopped["why"] != "interrupted":
        save(model, run_dir, step, meta, *out)
    minutes = (time.time() - start) / 60
    print(f"\n{stopped['why'] or 'done'}: {step:,} steps in {minutes:.1f} min -> {run_dir}")
    envs.close()
    if stopped["why"] != "interrupted":
        register(run, task, motion, step, minutes, init, evals, stopped["why"] or "done", note, argv, seed, guard.paused_s)


def _default_motion() -> str:
    from .imitate import DEFAULT_MOTION

    return DEFAULT_MOTION


def write_report(run_dir: Path, evals: list[tuple[int, float]], verdict, ceiling: float | None) -> None:
    """plateau.md: why the run was stopped, with the curve, so the next run changes the right thing."""
    lines = [f"# {run_dir.name}: stopped ({verdict.rule})", "", verdict.text, "", "| steps | metric |", "| ---: | ---: |"]
    lines += [f"| {s:,} | {v:.2f} |" for s, v in evals]
    if verdict.rule != "done":
        lines += ["", "## What to look at before training more", "",
                  "- Is the reference feasible? `python -m training.diagnose_reference <clip>` (control C1).",
                  "- Where does it fall? The failure map per stretch of the clip (control in docs/plan-v2.md, section 3).",
                  "- Is it still exploring? The action std in the checkpoints: a collapsed std learns nothing new.",
                  "- Change one thing (reward, observation, curriculum, network) and compare against this run."]
    if ceiling:
        lines.insert(3, f"Ceiling: {ceiling:.2f}")
    (run_dir / "plateau.md").write_text("\n".join(lines) + "\n")


def register(run: str, task: str, motion: str | None, steps: int, minutes: float, init: Path | None,
             evals: list[tuple[int, float]], why: str, note: str, argv: str, seed: int, paused_s: float) -> None:
    """One line per finished run in training/experiments.csv: the lab notebook, versioned."""
    try:
        commit = subprocess.run(["git", "rev-parse", "--short", "HEAD"], capture_output=True, text=True,
                                cwd=Path(__file__).parent).stdout.strip()
    except OSError:
        commit = ""
    new = not REGISTRY.exists()
    with open(REGISTRY, "a", newline="") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["date", "run", "commit", "task", "motion", "seed", "steps", "minutes", "paused_min", "init",
                        "final", "best", "stopped", "note", "command"])
        best = max((v for _, v in evals), default=float("nan"))
        final = evals[-1][1] if evals else float("nan")
        w.writerow([time.strftime("%Y-%m-%d %H:%M"), run, commit, task, motion or "", seed, steps, round(minutes, 1),
                    round(paused_s / 60, 1), str(init or ""), round(final, 3), round(best, 3), why, note, argv])


def main() -> None:
    p = argparse.ArgumentParser(prog="python -m training.ppo", description=__doc__.split("\n")[0])
    p.add_argument("--steps", type=int, default=20_000_000)
    p.add_argument("--run", default="stand")
    p.add_argument("--task", choices=["stand", "mimic", "walk"], default="stand",
                   help="stand: balance and pushes (env.py); mimic: imitate a RobotMotion (imitate.py); walk: old name of mimic")
    p.add_argument("--motion", help="mimic: a RobotMotion .json, or a clip id in physics/motions/ (default: the walk)")
    p.add_argument("--init", type=Path, help="checkpoint to continue from")
    p.add_argument("--every", type=int, default=0, help="also save a checkpoint every this many steps")
    p.add_argument("--export-dir", type=Path, help="export each checkpoint to ONNX here (default: the run folder)")
    p.add_argument("--no-export", action="store_true", help="save .pt checkpoints only")
    p.add_argument("--policy-prefix", help="policy id prefix of the exports (default: the run name)")
    p.add_argument("--push-min", type=float, default=PUSH_N[0], help="weakest random push, N")
    p.add_argument("--push-max", type=float, default=PUSH_N[1], help="strongest random push, N")
    p.add_argument("--push-every", default=f"{PUSH_EVERY_S[0]},{PUSH_EVERY_S[1]}",
                   help="seconds between random pushes, min,max (default 2,4; a quiet stance needs 4,8 to settle between them)")
    p.add_argument("--reward", default="", help="stance terms (env.py Stance), e.g. turn=0.3,feet=0.5,planted=0.1,rate=0.02,calm_s=1")
    p.add_argument("--worlds", default="",
                   help="train in these worlds of physics/worlds/, e.g. plano,piedras,resbaloso,viento (training/worlds.py); "
                        "empty: the flat floor, as before. Pushes then come from each world, capped by --push-max")
    p.add_argument("--wind-max", type=float,
                   help="--worlds: cap every world's wind at this many m/s (a curriculum: e.g. 6, then 10, then none)")
    p.add_argument("--std", type=float, help="reset the action std to this (e.g. 0.3) when continuing with --init")
    p.add_argument("--seed", type=int, default=0, help="torch and environment seed (every run replays seed 0 otherwise)")
    # CPU by default: measured on an M2, 11.2k steps/s on CPU vs 10.1k on MPS. This network is so small
    # that moving each minibatch to the GPU costs more than the GPU saves. --device mps to compare.
    p.add_argument("--device", default="cpu")
    p.add_argument("--resume", action="store_true", help="continue this run from its latest.pt (after Ctrl-C, a crash or a reboot)")
    p.add_argument("--no-guard", action="store_true", help="train flat out: no slowing down while the Mac is in use, no pauses")
    p.add_argument("--shared", choices=["background", "nice"], default="background",
                   help="while the Mac is in use: background (cool and quiet, ~8x slower) or nice (fast, warm)")
    p.add_argument("--no-plateau-stop", action="store_true", help="keep training even if plateau.py says it stopped learning")
    p.add_argument("--note", default="", help="what this run changes and why (goes to training/experiments.csv)")
    args = p.parse_args()
    task = "mimic" if args.task == "walk" else args.task
    export_dir = None if args.no_export else (args.export_dir or RUNS / args.run)
    stance = Stance(**{k: float(v) for k, v in (kv.split("=") for kv in args.reward.split(",") if kv)}) if args.reward else None
    push_every = tuple(float(v) for v in args.push_every.split(","))
    train(args.steps, args.run, args.device, args.init, (args.push_min, args.push_max), task, args.motion,
          args.every, export_dir, args.policy_prefix, push_every, stance, args.std, args.seed,
          tuple(w for w in args.worlds.split(",") if w), args.wind_max, args.resume, not args.no_guard,
          not args.no_plateau_stop, args.note, " ".join(sys.argv[1:]), args.shared)


if __name__ == "__main__":
    main()
