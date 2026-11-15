---
name: tridi-cache-audit
description: >-
  Audit what Tridi recomputes, refetches, re-parses, or re-compiles that it already knew — across HTTP edge headers (_headers), MuJoCo WASM/STL files, ONNX policies & sessions, retargeted RobotMotions, Three.js GLB models, procedural CanvasTextures, and delivery replays. Give every stable value one home, one key, one version, one death. Report-first. Use when Juan invokes /tridi-cache-audit or asks for a cache audit.
---

# Tridi Cache Audit — Never Learn, Fetch, or Compile the Same Thing Twice (`/tridi-cache-audit`)

The moment this command exists for: **the user switches between simulations, levels, worlds, or routes and the app re-fetches, re-compiles, or re-generates heavy 3D/WASM/ONNX/texture assets it already held two seconds ago.** In a physical-AI web studio running MuJoCo WASM + ONNX Runtime + Three.js WebGL, a missing cache doesn't just cause a text flicker — it re-downloads megabytes from Cloudflare, re-compiles an ONNX `InferenceSession`, re-runs 360-frame inverse kinematics (`retargetClipAsync` / `smoothForDisplay`), or re-draws procedural `CanvasTexture`s on the main thread, stealing RAM and CPU from the 500 Hz physics loop.

This is `/tridi-data-audit`'s sibling: `/tridi-data-audit` prunes what should not be asked at all; `/tridi-cache-audit` banks what remains so **it is never asked or computed twice**.

Three non-negotiable contracts (ported from `~/Code/portfolio`):

1. **Scope is explicit and echoed back.**
2. **Report before code.** Ranked findings with `file:line` evidence, stability classification, cost when re-asked, and its **One Home** from the Phase 2 table.
3. **Read every compute & fetch path in scope.**

---

## Phase 0 — Ground yourself in what is already cached

1. **Read [`docs/audit-playbook.md`](../../../docs/audit-playbook.md) and [`AGENTS.md`](../../../AGENTS.md).**
2. **Inventory the caches Tridi already has** (so fixes join an existing pattern rather than inventing a new one):
   - **`web/src/robot-host.js` (`loadRobot` / `attachRobot`):** Singleton `<canvas>` and `createSimView` instance kept alive across route changes; WebGL context survives DOM reparenting.
   - **`web/src/preloaded.js` (`fetchClip`):** Module-level `Map` caching fetched `PoseClip` JSONs by URL, deleting key on `.catch()` so failed fetches can retry.
   - **`web/src/props.js` (`loadModel`):** Module-level `Map` caching loaded Kenney `.glb` templates by relative path.
   - **`physics/src/index.js` (`kinematicModel` & `placeFile`):** `kinematic ??= sim.createModel(...)` and `sim.files[name]` for generated scene XMLs.
   - **`web/public/_headers`:** Cloudflare Pages HTTP `Cache-Control` rules.

---

## Phase 1 — Inventory every recompute, refetch, and re-allocation

Sweep `physics/src/` and `web/src/` for the six families in Tridi:

```bash
# 1. Network fetches without a module-level Map cache
grep -rn "fetch(" physics/src web/src
# 2. ONNX session & MuJoCo model compilations
grep -rn "InferenceSession\.create\|createModel(\|loadPolicy(" physics/src web/src
# 3. Retargeting and motion smoothing computations
grep -rn "retargetClip\|smoothForDisplay\|createReference" physics/src web/src
# 4. Three.js GLTFLoader & procedural 2D canvas texture allocations
grep -rn "GLTFLoader\|CanvasTexture\|createElement('canvas')" physics/src web/src
# 5. Browser storage & HTTP cache headers
grep -rn "localStorage\|sessionStorage" web/src
cat web/public/_headers
```

For each site, record four columns:

| Column | What it answers |
| --- | --- |
| **Value** | What bytes, model, ONNX session, motion, or texture is being fetched/computed |
| **Stability** | Immutable static asset / immutable per clip+params / session-scoped / live 500 Hz state |
| **Current Trigger** | Per frame / per level click / per world change / per route mount / once per session |
| **Cost when re-asked** | Network MBs, main-thread freeze (ms), WASM/GPU heap growth, WebGL shader stall |

Every row where **Stability** is `Immutable` and **Trigger** is anything other than `Once` is a finding.

---

## Phase 2 — The Four Cache Questions in Tridi

### 1. Does this value ever change — and where is its One Home?

| The value should survive | One Home in Tridi | Model / Pattern |
| --- | --- | --- |
| **Deploys / Reloads (immutable hashed or static assets)** | Cloudflare Edge + Browser HTTP Cache (`web/public/_headers`) | `/assets/*` and `/models/*` → `Cache-Control: public, max-age=31536000, immutable`; `/media/*` → `max-age=604800, stale-while-revalidate=86400` |
| **The Session (immutable bytes, policies, motions, 3D templates)** | Service-level `Map` in `physics/src/` or `web/src/` (with `.catch(() => cache.delete(key))` so failures never stick) | `fetchClip` in `web/src/preloaded.js`, `loadModel` in `web/src/props.js` |
| **The Session (heavy multi-MB JSONs like `replay.json`)** | Bounded LRU `Map` (e.g. `MAX_CACHED_REPLAYS = 3`) | Keeps recent `#/delivery` switches instant (`0 ms`) without holding `9 × 2.6 MB = 23 MB` in JS heap forever |
| **User Preferences (`lang`)** | `localStorage` | `web/src/i18n.js` |

### 2. Specific Tridi Cache Hotspots to Audit & Verify

1. **HTTP Cache Headers (`web/public/_headers`):**
   - Check every top-level folder in `web/public/` (`assets/`, `models/`, `media/`, `og.png`).
   - If `/models/*` (`public/models/kenney/*.glb`) is missing from `web/public/_headers`, every reload revalidates 15+ `.glb` files against Cloudflare!
2. **ONNX Policy Bytes, Meta JSON & Motion JSON Cache (`physics/src/index.js` `loadPolicy`):**
   - Check `loadPolicy(onnx, meta, { motion })`: when `onnx`, `meta`, or `motion` are URL strings, does it `fetch()` them raw every time a user clicks Level `1 → 2 → 3 → 4` in `#gym` or switches policies in `#/simulations`?
   - **Rule:** Cache fetched `Uint8Array` (`onnx`), parsed `meta` JSON, and parsed `motion` JSON in module-level `Map`s keyed by URL (removing on fetch failure).
3. **Deduplicated STL Fetch by URL (`physics/src/load.js`):**
   - Multiple robot folders (`luigi_lab3` and `luigi_lab4`) share identical STL files (`6_llanta_x2_TPU.stl` `1.1 MB`, `2_tapa_chasis.stl`, etc.) which Vite outputs to the **exact same hashed `/assets/*.stl` URL**.
   - Key the fetch promise cache by `url` so identical hashed URLs are fetched once and shared across `sim.files[key]` entries!
4. **Smoothed & Retargeted `RobotMotion` Cache (`physics/src/index.js` & `web/src/stage.js`):**
   - `view.playClip(motion, { plantFeet })` runs `smoothForDisplay(sim.mujoco, kinematicModel(), motion, { plantFeet })` on every call — solving forward kinematics and Savitzky-Golay/low-pass smoothing across all frames of the clip.
   - Cache the smoothed `RobotMotion` in a `WeakMap<object, Map<string, object>>` keyed by `motion` object reference and `String(plantFeet)` so re-playing a clip (or scrolling in/out of `#capture` on the landing page) is `0 ms`!
5. **Unified GLB Cache & Procedural `CanvasTexture` Cache (`web/src/props.js`, `web/src/landing/city.js`, `web/src/landing/street.js`):**
   - Check whether `city.js` instantiates its own `new GLTFLoader()` instead of sharing `loadModel` with `props.js`.
   - Check whether `city.js` (`sidewalkTile`, `roadTile`, `plazaTile`, `windowLit`, `windowDark`, `facadeTint`, `buildingSign`), `street.js`, and `props.js` (`kitchenFloor`, `warehouseFloor`) regenerate 2D `<canvas>` textures with thousands of `fillRect` grain loops on every route mount or floor switch instead of caching the generated `<canvas>` / `CanvasTexture` once per session!
6. **Gist API URL Resolution Cache (`web/src/api.js`):**
   - Confirm the Cloudflare tunnel URL read from GitHub Gist is cached in memory (with a sensible TTL or refresh-on-error) rather than fetched before every API request.

---

## Phase 3 — Report (stop for approval)

```markdown
# Tridi Cache Audit — <scope> — <date>

## Verdict
One honest paragraph starting with what is already cached well (`robot-host.js`, `preloaded.js`, `/assets/*` immutable header), followed by the main recompute/refetch leaks found.

## Findings (Ranked by Felt Latency, RAM & Bandwidth Saved)
Each: file:line, the value, its stability, what re-asking costs, and the concrete fix + its One Home.

## Checked and Sound
Paths verified to cache and invalidate properly.

## Deliberately Not Cached
Values that are cheap or live where caching would add complexity for zero gain.

## Ranked Fix Order
Independently verifiable batches.
```

Present the report and wait for Juan's approval.
