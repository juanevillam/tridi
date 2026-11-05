#!/bin/sh
# GVHMR on every test-set video that has a body, one after another, detached from Claude's session:
#   nohup sh data/capture2/run_set.sh > ~/Tridi/capture2/run_set.out 2>&1 &
# Skips videos already done (their .gvhmr.npz exists), so it can be stopped and resumed.
# Left out: lavar-01, lavar-05, dedos-02 (hands or forearms only, no body; data/set-de-prueba/manifest.csv).
# Order: walking and full body first (what the team tests), the long 3-person video last (37 s, ~20 min).
set -u
PY=${GVHMR_ROOT:-$HOME/Code/tridi-thirdparty/GVHMR}/.venv/bin/python
SRC=$HOME/Tridi/set-de-prueba/videos
OUT=$HOME/Tridi/capture2
REPO=$(cd "$(dirname "$0")/../.." && pwd)
mkdir -p "$OUT"
for id in caminar-01 caminar-02 jacks-grupo-01 sentarse-02 bailar-02 correr-01 saludar-02 dedos-01 \
          sentarse-01 correr-02 lavar-04 lavar-02 escalera-02 bailar-grupo-02 bailar-01 jacks-01; do
  [ -f "$OUT/$id.gvhmr.npz" ] && { echo "$id: done already"; continue; }
  cp -n "$SRC/$id.mp4" "$OUT/$id.mp4"
  "$PY" "$REPO/data/capture2/gvhmr_mac.py" "$OUT/$id.mp4" || echo "$id: FAILED"
  [ -f "$OUT/$id.gvhmr.npz" ] && "$PY" "$REPO/data/capture2/to_joints.py" "$OUT/$id.gvhmr.npz"
done
echo "all done $(date)"
