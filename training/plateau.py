"""Stops a training that stopped learning, and says why it thinks so.

In the hackathon `walk-v4` went from 10 M to 20 M steps and followed its clip 3.68 s, then 3.54 s:
the extra 10 M steps (and their hour of the Mac) bought nothing, and nobody noticed until the end.
This module watches the metric of every evaluation while the run goes on and calls it:

    window  the best of the last WINDOW evaluations is not MIN_GAIN better than the best before
            them: the curve went flat.
    decade  10x the steps did not give DECADE_GAIN more: the method is out of ideas, more of the
            same will not help (the rule of docs/plan-v2.md, section 3).
    done    the metric reached the task's ceiling (the whole clip followed): nothing left to learn.

Only after MIN_STEPS, so the noisy start of a run never stops it. The metric must be "higher is
better" (followed_s for imitation, episode seconds for standing).
"""

from __future__ import annotations

from dataclasses import dataclass

WINDOW = 3
# 2 %: smaller changes are within what one deterministic evaluation varies between checkpoints
# that learned the same thing (walk-v4 swung 3.68 -> 3.54 s, -4 %, with no real change).
MIN_GAIN = 0.02
# 10 %: one more decade of steps costs 10x the time; on the Mac, the step from 100 M to 1 B is a
# day. Less than 10 % for it is not worth the day, and says to change the method.
DECADE_GAIN = 0.10
# Before 3 M steps a run is still finding its feet (jacks-v2 was flat from 0 to 1 M, 0.74 s, and
# then learned): judging it there would kill runs that were about to start.
MIN_STEPS = 3_000_000
# Reaching this share of the ceiling counts as done (one deterministic run may stop a frame short).
DONE_SHARE = 0.98


@dataclass
class Verdict:
    stop: bool
    rule: str  # "", "window", "decade" or "done"
    text: str


def judge(evals: list[tuple[int, float]], ceiling: float | None = None) -> Verdict:
    """evals: (steps, metric) in step order, step 0 included or not."""
    if not evals:
        return Verdict(False, "", "no evaluations yet")
    step, value = evals[-1]
    if ceiling and value >= DONE_SHARE * ceiling:
        return Verdict(True, "done", f"{value:.2f} of {ceiling:.2f}: the whole task is learned")
    if step < MIN_STEPS:
        return Verdict(False, "", f"too early to judge ({step:,} < {MIN_STEPS:,} steps)")

    judged = [(s, v) for s, v in evals if s >= 1]
    if len(judged) > WINDOW:
        recent = max(v for _, v in judged[-WINDOW:])
        before = max(v for _, v in judged[:-WINDOW])
        if recent < before * (1 + MIN_GAIN) + 1e-9:
            first = judged[-WINDOW][0]
            return Verdict(True, "window", f"no gain in the last {WINDOW} evaluations (from {first:,} to {step:,} steps): "
                           f"best {recent:.2f} vs {before:.2f} before")

    # The decade: the best at or before step / 10, against the best now.
    earlier = [v for s, v in judged if s <= step / 10]
    if earlier:
        then, now = max(earlier), max(v for _, v in judged)
        if then > 0 and now < then * (1 + DECADE_GAIN):
            return Verdict(True, "decade", f"10x the steps (to {step:,}) gave {100 * (now / then - 1):+.0f} %, "
                           f"under {100 * DECADE_GAIN:.0f} %: change the method, not the step count")
    return Verdict(False, "", f"still learning: {value:.2f} at {step:,} steps")


def selftest() -> None:
    # walk-v4 as it was evaluated every 2 M steps (the shape in docs/plan-producto.md): it learns
    # until ~10 M, then flat. The window rule has to call it well before 20 M.
    walk = [(0, 0.86), (1_000_000, 2.88), (2_000_000, 2.6), (4_000_000, 3.1), (6_000_000, 3.4), (8_000_000, 3.6),
            (10_000_000, 3.68), (12_000_000, 3.6), (14_000_000, 3.55), (16_000_000, 3.62)]
    v = judge(walk)
    assert v.stop and v.rule == "window", v
    # A run still learning is not stopped.
    rising = [(s * 1_000_000, 1 + s * 0.3) for s in range(1, 12)]
    assert not judge(rising).stop
    # jacks-v2: flat until 1 M, then up; early flatness is never judged.
    assert not judge([(0, 0.74), (10_000, 0.74), (100_000, 0.74), (1_000_000, 0.76)]).stop
    # A decade with +5 %, slowly enough that the window never fires.
    slow = [(1_000_000, 3.0), (3_000_000, 3.07), (5_000_000, 3.1), (7_000_000, 3.13), (10_000_000, 3.15)]
    assert judge(slow).rule in ("decade", "window"), judge(slow)
    # Done: the whole 11.8 s clip followed.
    assert judge([(5_000_000, 11.7)], ceiling=11.8).rule == "done"
    print("plateau selftest ok")


if __name__ == "__main__":
    selftest()
