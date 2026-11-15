---
name: tridi-perf-audit
description: >-
  Audit what Tridi costs CPU, RAM, and GPU at runtime — protecting the 500 Hz MuJoCo WASM physics and 50 Hz ONNX budget from Three.js WebGL bloat (duplicate shadow maps, geometry/material/texture leaks on rebuild/unmount, draw calls), layout thrashing in rAF/scroll loops, and unpaused off-screen media. Report-first. Use when Juan invokes /tridi-perf-audit or asks for a performance/3D memory audit.
---

# Tridi Performance & 3D Resource Audit — Protect the Simulation Budget (`/tridi-perf-audit`)

The moment this command exists for: **Tridi is a real-time Physical AI simulator running MuJoCo WASM at 500 Hz + ONNX policies at 50 Hz + Three.js WebGL at 60 fps inside a browser tab.** Every millisecond spent rasterizing decorative shadow maps, leaking GPU geometries/textures across `rebuild()` calls, reading DOM layout inside `requestAnimationFrame`, or decoding off-screen videos is CPU and RAM stolen directly from the physics simulation.

**THE MAC GPU CAN HIDE 3D BLOAT UNTIL IT DOESN'T.** A scene with two `2048×2048` shadow-casting directional lights, 80+ decorative meshes, or leaked Three.js `BufferGeometry` / `CanvasTexture` instances may run at 60 fps for the first 10 seconds on an M2 Mac and then throttle the GPU, drop `stats.sim / stats.wall` below `1.0×`, or crash mobile Safari WebGL due to VRAM exhaustion.

Three non-negotiable contracts (ported from `~/Code/portfolio`):

1. **Scope is explicit and echoed back.**
2. **Report before code.** Ranked findings with measured numbers (`renderer.info.render`, `renderer.info.memory`, `realtime` physics ratio, frame times, heap/VRAM deltas) and `file:line` evidence. Mark any fix that visibly alters 3D lighting or geometry so Juan decides.
3. **Measure on the production build (`npm --prefix web run build && npm --prefix web run preview`), never only dev.**

---

## Phase 0 — Ground yourself

1. **Read [`docs/audit-playbook.md`](../../../docs/audit-playbook.md) and [`AGENTS.md`](../../../AGENTS.md).**
2. **Build and serve production:**
   ```bash
   npm --prefix web run build
   ```
3. **Capture baseline runtime metrics via browser DevTools / JS evaluation:**
   - `robotView().viewer.renderer.info.render` (`calls`, `triangles`, `lines`, `points`)
   - `robotView().viewer.renderer.info.memory` (`geometries`, `textures`)
   - Physics real-time ratio (`stats.sim / stats.wall` reported to `onStats`)
   - Scroll & rAF frame times (`p50`, `p95`, `max`) across `#/`, `#/simulations`, `#/delivery`, and `#/assembler`.

---

## Phase 1 — Measure the 5 Runtime Cost Centers

### 1. Three.js WebGL Draw Calls, Lights & Shadow Maps (`physics/src/viewer.js`, `web/src/landing/city.js`, `web/src/props.js`)

- **Shadow Map Multiplication:**
  - `RobotView` in `physics/src/viewer.js` already creates a directional `this.sun` with `castShadow = true` and `shadow.mapSize.set(2048, 2048)`.
  - Check `web/src/landing/city.js`: does `buildCity()` add a **second** `DirectionalLight` with `castShadow = true` (`2048×2048` shadow map) and a **second** `HemisphereLight` to `viewer.scene`? Two shadow-casting directional lights double the shadow pass draw calls for every single `castShadow = true` mesh in the scene every frame!
  - Check which decorative city meshes (`cars`, `facades`, `lamps`, `trees`, `props`) have `castShadow = true` and `receiveShadow = true` unnecessarily when they sit outside the `[-2, 2]` shadow frustum or only serve as background silhouettes.
- **Draw Calls & Instancing:**
  - Count `renderer.info.render.calls` and `triangles` on `#/` (Hero, Gym, Capture, Policy) and on `#/simulations` (Kitchen, Warehouse, Sidewalk, Stones).

### 2. WebGL Geometry, Material & Texture Leaks Across `rebuild()` and Route Switches

- **Test recipe (the 10-switch leak test):**
  - Read `renderer.info.memory` (`{ geometries, textures }`) on `#/`.
  - Navigate `#/ → #/simulations → switch 4 scenes (Cocina, Depósito, Vereda, Vacío) → switch 3 robots (G1, Luigi v2, Celda Industrial) → #/ → #/simulations → #/`.
  - Read `renderer.info.memory` again. **If `geometries` or `textures` grew monotonically, there is a GPU memory leak.**
- **Known leak patterns to inspect:**
  1. **`RobotView.rebuild()` (`physics/src/viewer.js`):** Disposes `object.geometry` and `object.material` of `this.geoms`, **but** if `dressPlace()` in `web/src/props.js` attached cloned `.glb` child meshes (`object.add(copy)`) with cloned materials (`o.material = o.material.clone()`), removing `object` from `this.world` without traversing `object.children` leaks every cloned `.glb` geometry and material in WebGL memory!
  2. **`setFloor()` (`web/src/props.js` & `web/src/landing/street.js`):** When switching floors (`vereda`, `cocina`, `deposito`), does `undoFloor()` dispose the `CanvasTexture`, `PlaneGeometry`, and `MeshStandardMaterial` it created, or only `scene.remove(mesh)`?
  3. **`buildCity().destroy()` (`web/src/landing/city.js`):** When leaving `#/` (`unmount`), `city.destroy()` removes `city` from `scene` — does it dispose the geometries, cloned materials, and procedural `CanvasTexture`s created inside `buildCity()`, or does every visit to `#/` leak another copy of the city in VRAM?
  4. **Secondary Viewers (`SkeletonView` in `web/src/skeleton.js`, `Assembler` 3D preview in `web/src/screens/assembler.js`):** Confirm every secondary `THREE.WebGLRenderer` calls `renderer.dispose()`, `controls.dispose()`, and traverses its scene to dispose geometries/materials/textures on screen `unmount()`.

### 3. Main-Thread Layout Thrashing in `requestAnimationFrame` & Scroll Handlers

- Grep `web/src/` and `physics/src/` for layout-forcing reads inside `requestAnimationFrame`, `scroll`, or `pointermove` callbacks:
  ```bash
  grep -rn "getBoundingClientRect\|getComputedStyle\|clientWidth\|clientHeight\|offsetWidth\|offsetHeight" web/src physics/src
  ```
- In `web/src/screens/home.js`: check `onScroll()` and `tick()`. Are section heights/offsets measured on every scroll tick, or cached on `ResizeObserver`?
- Never put CSS `transition: transform ...` on elements whose `transform` is updated every frame by `requestAnimationFrame`.

### 4. Off-Screen & Hidden-Tab Pausing (MuJoCo WASM, WebGL, `<video>`, Observers)

- **Canvas disconnected (`!canvas.isConnected`):** In `physics/src/index.js`, when the user is on `#/docs`, `#/team`, `#/milestones`, or `#/assembler` (where `robot-host` canvas is detached), confirm `frame()` skips `sim.advance()` and `view.render()`. Even better: why keep calling `requestAnimationFrame(frame)` at 60 Hz while `!canvas.isConnected` when `attachRobot` / `MutationObserver` can wake it, or verify that the idle check costs `0.0 ms`?
- **Off-screen `<video>` elements:** Check `#capture` video on `#/`, PiP videos in `#/simulations` and `#/delivery`, and the 3 videos in `#/milestones`. Confirm off-screen or hidden-tab videos call `.pause()` so hardware video decoders are freed.
- **Unmounted screen cleanup:** Every screen's returned cleanup function in `web/src/screens/*.js` must disconnect all `ResizeObserver`, `MutationObserver`, `IntersectionObserver`, `AbortController`, and window event listeners.

### 5. MuJoCo WASM Heap (`MjModel` / `MjData` Deletion Discipline)

- Check every call to `sim.createModel(...)` and `new mujoco.MjData(...)` across `physics/src/` (`sim.js`, `index.js`, `retarget.js`, `root.js`, `level.js`, `clearance.js`):
  - Every `MjModel` and `MjData` allocated in Emscripten WASM heap **must** have a matching `.delete()` when replaced or disposed, or WASM linear memory grows until `Out of Memory`.

---

## Phase 2 — Report (stop for approval)

```markdown
# Tridi Performance & 3D Resource Audit — <scope> — <date>

## Verdict
Headline numbers:
- Landing (`#/`) WebGL draw calls, triangles, shadow maps, and frame time (ms)
- Simulations (`#/simulations`) WebGL draw calls, triangles, and `realtime` physics ratio (`stats.sim / stats.wall`)
- 10-route-switch VRAM/heap delta (`renderer.info.memory.geometries` & `textures` before vs after)

## Findings (Ranked by Impact on Physics Realtime Ratio, GPU Memory & Frame Time)
Each: file:line, measured metric before, root cause, concrete fix, expected metric after, and whether it changes visual appearance.

## Deliberately Paid Costs
Costs Tridi pays on purpose (e.g. 500 Hz MuJoCo timestep, flat-shaded G1 STL meshes) with the engineering reason.

## Ranked Fix Order
Independently verifiable batches.
```

Present the report and wait for Juan's approval.
