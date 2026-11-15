---
name: tridi-data-audit
description: >-
  Audit what Tridi asks the network (Cloudflare Pages CDN + data/server.py tunnel) and when — 3-bucket payload budget (first paint vs on scroll vs on demand), lazy-loading non-default robot STL meshes/WASM/ONNX/replays, video & 3D asset weight, and streaming byte-range support. Report-first. Use when Juan invokes /tridi-data-audit or asks to audit network/asset weight.
---

# Tridi Data & Network Audit — The Fewest Bytes That Still Feel Instant (`/tridi-data-audit`)

The moment this command exists for: **the simulations and web app work, and the question has moved to what they cost the network and server while they work.** If `web/dist` ships `129+ MB` and a cold visit or route walk pulls `50–200 MB` of `.stl` meshes, `.mp4` videos, `.wasm` binaries, and `replay.json` files that the user never opened, production bandwidth explodes and mobile/laptop clients choke before MuJoCo even starts stepping.

**Fewer bytes in the right bucket is also the better UX.** Every megabyte spared from first paint means the G1 robot stands up faster on `#/` and leaves more RAM and bandwidth for the active simulation.

Three non-negotiable contracts (ported from `~/Code/portfolio`):

1. **Scope is explicit and echoed back.** State which routes, packages (`web/`, `physics/`, `data/`), and asset folders are in scope.
2. **Report before code.** Ranked findings with exact byte counts (`du -sh`, `ls -lh`), network waterfall timing, and `file:line` evidence. Juan cuts and approves.
3. **Read every data & asset load path in scope.** Do not sample — inspect every `import.meta.glob`, `fetch()`, `<video>`, `<img src>`, `GLTFLoader`, and `api.js` call site.

---

## Phase 0 — Ground yourself

1. **Read [`docs/audit-playbook.md`](../../../docs/audit-playbook.md), [`docs/infra-and-security.md`](../../../docs/infra-and-security.md), and [`AGENTS.md`](../../../AGENTS.md).**
2. **Measure the current production build (`web/dist`) before reading code:**
   ```bash
   npm --prefix web run build
   du -sh web/dist web/dist/* web/dist/media/* web/dist/models/*
   ls -lhS web/dist/assets | head -n 45
   find web/dist -type f -size +500k -exec ls -lh {} \;
   ```
3. **Inventory every `import.meta.glob` and `fetch()` across `physics/src/` and `web/src/`:**
   ```bash
   grep -rn "import\.meta\.glob\|fetch(\|loadAsync(" physics/src web/src
   ```

---

## Phase 1 — Separate the 3 Network Budgets

Every asset in `web/dist` belongs to **exactly one** of three budgets. A byte in the wrong budget is the primary finding:

| Budget | When it should load | What belongs here | What MUST NOT load here |
| --- | --- | --- | --- |
| **1. First Paint (`#/`)** | Cold load of `https://trytridi.com` with no scroll | HTML, CSS, core JS bundle, `mujoco.wasm` (`10 MB`), **only `unitree_g1`** MJCF + STL meshes, `g1-stand` ONNX (`367 KB`), the 4 Kenney `.glb` props visible on the street, and `clip_caminar-perfil-gvhmr` JSON. | `unitree_h1` (`13.5 MB` STLs), `luigi_lab3` (`2.1 MB` STLs), `luigi_lab4` (`3.0 MB` STLs), `factory_cell` STLs, `dex3.js` Inspire hand meshes (`~3 MB`), `@mediapipe/tasks-vision` WASM (`13 MB`), `replay-*.json` (`22 MB`), or milestone videos (`37 MB`). |
| **2. On Scroll (`#/`)** | As the user nears `#gym`, `#capture`, `#policy` | `#capture` PiP video (`clip_caminar-perfil-gvhmr.mp4`, `preload="metadata"`), `#gym` level policies (`g1-level1..3` only when `#gym` enters viewport or level button is clicked), `#policy` walk policy (`g1-walk`). | Full preload of all 10 clip videos or non-G1 policies. |
| **3. On Demand (Inner Routes & Actions)** | Only when the user opens that route or selects that robot/clip/tab | - **Robot switch (`swapScene`):** Fetch `unitree_h1/*`, `luigi_lab3/*`, `luigi_lab4/*`, or `factory_cell/*` STL meshes lazily on first selection.<br>- **Hand mimic / grasp:** Dynamic `import('./dex3.js')` + Inspire hand meshes.<br>- **`#/live` camera:** Dynamic `import('tridi-live')` + MediaPipe WASM.<br>- **`#/delivery/<clip>`:** Fetch only the selected clip's `replay.json` (`~2.5 MB`) and only download `dataset.zip` (`1.2 MB`) when user clicks Download.<br>- **`#/milestones`:** Load `luigi-hardware.mp4`, `luigi-sim2real.mp4`, `platanus-pitch.mp4` with `preload="metadata"` (or `preload="none"` for inactive tab). | Eager `Promise.all` over all models/deliveries at startup. |

---

## Phase 2 — The Four Data & Asset Questions

### 1. Is `physics/src/load.js` (`loadG1`) fetching models nobody is looking at?
- Check `physics/src/load.js`: if `loadG1()` merges `G1_FILES`, `H1_FILES`, `LUIGI_FILES`, `LUIGI_LAB4_FILES`, `FACTORY_CELL_FILES`, and `COMPONENT_FILES` into a single startup `Promise.all(entries.map(fetch))`, every visitor to `#/` downloads **~20 MB of extra `.stl` files** for `H1`, `Luigi Lab 3`, `Luigi Lab 4`, and `Factory Cell` before the landing page robot even appears!
- **Fix shape:** `loadG1()` fetches **only `G1_FILES` + `COMPONENT_FILES`** (XMLs are tiny). Expose `sim.ensureModelFiles(sceneFile)` (or lazy per-prefix loader in `load.js`) so `unitree_h1/`, `luigi_lab3/`, `luigi_lab4/`, and `factory_cell/` STL binaries are fetched on demand the first time `swapScene()` or `loadPolicy()` requests that prefix, then cached in `sim.files`.

### 2. Are 3D `.stl` / `.glb` meshes or `.json` replays bloated beyond visual/physical fidelity?
- Inventory every `.stl` in `physics/models/**` over `400 KB`:
  - Check whether any `.stl` is ASCII instead of binary, or has CAD tessellation density (`> 50,000` triangles for a small robot link or wheel like `6_llanta_x2_TPU.stl` at `1.1 MB` × 2 copies in `luigi_lab3` and `luigi_lab4`!).
  - Notice duplicate identical `.stl` files across `luigi_lab3/assets/` and `luigi_lab4/assets/` (`6_llanta_x2_TPU.stl` `1.1 MB`, `2_tapa_chasis.stl`, `3_soporte_sensor.stl`, `4_parachoques.stl`, `5_rin_x2.stl`, `7_base_bateria.stl`) — if Vite hashes them by content they deduplicate in `dist/assets/`, **unless** they differ by header bytes or are fetched twice under different keys in `load.js`! Check `md5` of duplicate STLs across robot folders and deduplicate fetch requests by URL!
- Inventory `data/deliveries/*/replay.json` (`2.1 MB – 2.9 MB` each, `22 MB` total in `dist/assets/`):
  - Check numeric precision in `replay.json`, `poseclip.json`, and `motion.json` (e.g. floats with 16 decimal digits `0.1234567890123456` vs 4 decimals `0.1235`), and confirm `replay.json` is only fetched when `#/delivery` mounts for that clip.

### 3. Are videos in `web/public/media/` oversized or missing `+faststart`?
- Check every `.mp4` in `web/public/media/` with `ffprobe`:
  ```bash
  for f in web/public/media/*.mp4 web/public/media/clips/*.mp4; do
    ffprobe -v error -select_streams v:0 -show_entries stream=width,height,bit_rate,codec_name -show_entries format=duration,size -of default=noprint_wrappers=1 "$f"
  done
  ```
- Any video rendered in a card or PiP (`<= 720p` box) weighing `10–15 MB` (`luigi-hardware.mp4` `15.4 MB`, `luigi-sim2real.mp4` `11.4 MB`, `platanus-pitch.mp4` `10.5 MB`) must be re-encoded with H.264 (`-c:v libx264 -preset slow -profile:v high -crf 23 -pix_fmt yuv420p -movflags +faststart`) down to `~1.5–3.0 MB` while keeping the original resolution/clarity and preserving audio only where speech exists (`platanus-pitch.mp4`).
- Check every `<video>` tag in `web/src/` has `preload="metadata"` (or `preload="none"` when in a hidden tab), `playsinline`, and pauses when off-screen or when switching tabs.

### 4. How does the app talk to `data/server.py` (`web/src/api.js`)?
- Check `web/src/api.js` and its callers (`upload.js`, `delivery.js`, `stage.js`, `training.js`):
  - Does Gist tunnel discovery cache the resolved URL per session or refetch the GitHub Gist on every call?
  - Are failed tunnel probes handled gracefully without spamming console/network errors when offline/static?

---

## Phase 3 — Report (stop for approval)

```markdown
# Tridi Data & Network Audit — <scope> — <date>

## Verdict
Headline numbers: total `web/dist` size, cold first-paint transfer size on `#/`, and worst route's transfer size. Start with what is already scoped right (lazy `dex3.js`, lazy `ort.js`, `no-inline` delivery URLs).

## Budget Table
| Asset / Group | Current Bucket | Target Bucket | Uncompressed Size | Fix |

## Findings (Ranked by Megabytes Saved on Cold Load & Per Session)
Each: file:line, current byte cost and trigger, concrete fix, expected byte savings.

## Checked and Sound
Paths verified to load lazily and cleanly.

## Ranked Fix Order
Independently verifiable batches.
```

Present the report and wait for Juan's approval.
