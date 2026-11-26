// Regression check for GAP-1 (dex3 non-G1 scene switches via loadPolicy/reset) and GAP-2
// (concurrent ensureDex3 deduplication + transient STL fetch failure recovery).
// Loads real physics/src/index.js + physics/src/dex3.js via Vite SSR with real MuJoCo WASM
// models and real STL assets, stubbing only browser canvas/WebGLRenderer (viewer.js) and load.js.
// Run: npm --prefix physics run check
import { readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import loadMujoco from '@mujoco/mujoco';
import * as THREE from 'three';
import { createServer } from 'vite';
import { Simulation } from '../src/sim.js';
import { loadG1Node } from './node-model.mjs';

const PHYSICS_ROOT = new URL('..', import.meta.url).pathname;
const G1_DIR = new URL('../models/unitree_g1/', import.meta.url).pathname;
const DEX3_DIR = new URL('../models/dex3/', import.meta.url).pathname;
const DEX3_ASSETS_DIR = new URL('../models/dex3/assets/', import.meta.url);
const POLICIES_DIR = new URL('../../training/policies/', import.meta.url);

function readTree(dir) {
  const files = {};
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const path = join(entry.parentPath, entry.name);
    files[relative(dir, path)] = new Uint8Array(readFileSync(path));
  }
  return files;
}

const failures = [];
const expect = (ok, what) => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failures.push(what);
};

// Stub browser globals before loading index.js / dex3.js.
const prevRaf = globalThis.requestAnimationFrame;
const prevCancelRaf = globalThis.cancelAnimationFrame;
const prevFetch = globalThis.fetch;
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};

let failStlFetch = false;
let stlFetchCount = 0;
globalThis.fetch = async (url) => {
  const s = String(url);
  if (s.endsWith('.STL') || s.includes('/models/dex3/assets/')) {
    stlFetchCount++;
    if (failStlFetch) {
      return { ok: false, status: 503, async arrayBuffer() { return new ArrayBuffer(0); } };
    }
    const name = basename(s.split('?')[0]);
    const buf = readFileSync(new URL(name, DEX3_ASSETS_DIR));
    return {
      ok: true,
      status: 200,
      async arrayBuffer() {
        return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      },
    };
  }
  if (prevFetch) return prevFetch(url);
  throw new Error(`Unexpected fetch in check-dex3: ${s}`);
};

const VISIBLE_GROUPS = new Set([0, 1, 2]);

// Fresh Simulation factory for each createSimView() instance.
const server = await createServer({
  root: PHYSICS_ROOT,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
  plugins: [
    {
      name: 'check-dex3-stubs',
      enforce: 'pre',
      resolveId(id, importer) {
        if (!importer) return null;
        if (id === './load.js' && importer.endsWith('/src/index.js')) return '\0stub:load';
        if (id === './viewer.js' && importer.endsWith('/src/index.js')) return '\0stub:viewer';
        return null;
      },
      load(id) {
        if (id === '\0stub:load') {
          return `
            export async function ensureModelFiles() {}
            export async function loadG1() { return globalThis.__CHECK_DEX3_SIM__(); }
          `;
        }
        if (id === '\0stub:viewer') {
          return `
            import * as THREE from 'three';
            export class RobotView {
              constructor(sim, canvas) {
                this.sim = sim;
                this.canvas = canvas;
                this.world = new THREE.Group();
                this.controls = { enabled: true, dispose() {} };
                this.targetHeight = 0.75;
                this.geoms = this.buildGeoms();
              }
              buildGeoms() {
                const { model } = this.sim;
                const list = [];
                for (let id = 0; id < model.ngeom; id++) {
                  if (!${JSON.stringify([...VISIBLE_GROUPS])}.includes(model.geom_group[id])) continue;
                  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 0x888888 }));
                  this.world.add(mesh);
                  list.push({ id, object: mesh });
                }
                return list;
              }
              rebuild() {
                for (const { object } of this.geoms) {
                  this.world.remove(object);
                  object.geometry.dispose();
                  object.material.dispose();
                }
                this.geoms = this.buildGeoms();
              }
              render() { this.onFrame?.(); }
              dispose() {}
            }
          `;
        }
        return null;
      },
    },
  ],
});

const sims = [];
globalThis.__CHECK_DEX3_SIM__ = async () => {
  const { sim } = await loadG1Node();
  sims.push(sim);
  return sim;
};

try {
  const { createSimView, HELD_OBJECT_SCENE } = await server.ssrLoadModule('/src/index.js');
  const dummyCanvas = { isConnected: false };

  const loadPolicyFiles = (base) => ({
    onnx: new Uint8Array(readFileSync(new URL(`${base}.onnx`, POLICIES_DIR))),
    meta: JSON.parse(readFileSync(new URL(`${base}.json`, POLICIES_DIR))),
  });
  const g1Stand = loadPolicyFiles('g1-stand');
  const luigiLab3 = loadPolicyFiles('luigi-lab3');
  const luigiLab4 = loadPolicyFiles('luigi-lab4');
  const h1Walk = loadPolicyFiles('h1-walk');
  const h1Motion = JSON.parse(readFileSync(new URL('../../training/references/clip_2026-10-23_caminar-perfil_01-h1-balanced.json', import.meta.url)));
  const factoryCell = loadPolicyFiles('factory-cell');

  // -------------------------------------------------------------------------
  // 1. GAP-1: holdObject on G1 -> switch to non-G1 robots -> reset -> back to G1
  // -------------------------------------------------------------------------
  console.log('1. dex3 non-G1 scene switch via loadPolicy() & reset() (GAP-1)');
  const view1 = await createSimView(dummyCanvas);
  const handGroupsOf = (v) => v.viewer.world.children.filter((c) => c.isGroup);

  const held1 = await view1.holdObject({ wet: false });
  const g1Groups = handGroupsOf(view1);
  expect(
    held1 && g1Groups.length === 2 && g1Groups.every((g) => g.visible === true),
    `G1 holdObject initializes 2 visible dex3 hand groups (got ${g1Groups.length})`,
  );

  for (const [label, pol, opts] of [
    ['luigi-lab3', luigiLab3, undefined],
    ['luigi-lab4', luigiLab4, undefined],
    ['h1-walk', h1Walk, { motion: h1Motion }],
    ['factory-cell', factoryCell, undefined],
  ]) {
    let err = null;
    try {
      await view1.loadPolicy(pol.onnx, pol.meta, opts);
      view1.viewer.render();
      view1.reset();
    } catch (e) {
      err = e;
    }
    const groups = handGroupsOf(view1);
    expect(
      !err && groups.length === 2 && groups.every((g) => g.visible === false),
      `loadPolicy(${label}) + render() + reset() succeeds with dex3 hidden (err=${err?.message ?? 'none'})`,
    );
  }

  // Switch back to G1 and verify dex3 re-syncs with G1 wrists cleanly.
  await view1.loadPolicy(g1Stand.onnx, g1Stand.meta);
  const heldAgain = await view1.holdObject({ wet: false });
  view1.viewer.render();
  const backGroups = handGroupsOf(view1);
  expect(
    heldAgain && backGroups.length === 2 && backGroups.every((g) => g.visible === true),
    `switching back to G1 re-syncs and reuses the 2 dex3 hand groups (got ${backGroups.length})`,
  );
  view1.dispose();

  // -------------------------------------------------------------------------
  // 2. GAP-2: transient STL failure recovery & concurrent holdObject dedup
  // -------------------------------------------------------------------------
  console.log('2. concurrent ensureDex3 deduplication & STL fetch failure recovery (GAP-2)');
  const view2 = await createSimView(dummyCanvas);
  await view2.setScene(HELD_OBJECT_SCENE);

  failStlFetch = true;
  let fetchErr = null;
  try {
    await view2.holdObject({ wet: false });
  } catch (e) {
    fetchErr = e;
  }
  expect(
    fetchErr !== null && handGroupsOf(view2).length === 0,
    `failed STL fetch rejects cleanly (${fetchErr?.message}) and leaks 0 groups`,
  );

  failStlFetch = false;
  const fetchesBefore = stlFetchCount;
  const [okA, okB, okC] = await Promise.all([
    view2.holdObject({ wet: false }),
    view2.holdObject({ wet: false }),
    view2.holdObject({ wet: false }),
  ]);
  const groupsAfter = handGroupsOf(view2);
  expect(
    okA && okB && okC && groupsAfter.length === 2 && groupsAfter.every((g) => g.visible === true),
    `concurrent Promise.all(holdObject x3) after failure recovers with exactly 2 hand groups (got ${groupsAfter.length})`,
  );
  expect(
    stlFetchCount - fetchesBefore <= 16,
    `STL meshes fetched once during concurrent calls (fetches=${stlFetchCount - fetchesBefore})`,
  );

  // -------------------------------------------------------------------------
  // 3. GAP-7: copyFingers degrades cleanly on <21-pt / NaN / malformed pose.hands
  // -------------------------------------------------------------------------
  console.log('3. mimic() copyFingers malformed & <21-pt pose.hands guard (GAP-7)');
  const makeStandingWorld = () => {
    const P = {
      0: [0, 0.7, 0.03],
      11: [0.19, 0.5, 0],
      12: [-0.19, 0.5, 0],
      13: [0.19, 0.21, 0],
      14: [-0.19, 0.21, 0],
      15: [0.19, -0.05, 0],
      16: [-0.19, -0.05, 0],
      23: [0.1, 0, 0],
      24: [-0.1, 0, 0],
      25: [0.1, -0.43, 0],
      26: [-0.1, -0.43, 0],
      27: [0.1, -0.85, 0],
      28: [-0.1, -0.85, 0],
    };
    return Array.from({ length: 33 }, (_, i) => {
      const [x, y, z] = P[i] ?? [0, 0, 0];
      return { x, y: -y, z: -z, visibility: P[i] ? 0.99 : 0 };
    });
  };
  const world = makeStandingWorld();
  const handCases = [
    ['1-pt hand', { left: [{ x: 0, y: 0, z: 0 }], right: null }],
    ['20-pt hand', { left: null, right: Array.from({ length: 20 }, () => ({ x: 0.1, y: 0.1, z: 0.1 })) }],
    ['NaN 21-pt hand', { left: Array.from({ length: 21 }, () => ({ x: Number.NaN, y: 0, z: 0 })), right: Array.from({ length: 21 }, () => ({ x: 0, y: Number.POSITIVE_INFINITY, z: 0 })) }],
    ['null element in 21-pt hand', { left: Array.from({ length: 21 }, (_, i) => (i === 5 ? null : { x: 0.1, y: 0.1, z: 0.1 })), right: 'bad' }],
  ];

  // 3a. dex3 drawn-hands path on 29-DoF G1 (view2 already has dex3 + fingerSolver loaded)
  view2.reset();
  let t = 1.0;
  for (const [label, hands] of handCases) {
    let err = null;
    let res = null;
    try {
      res = view2.mimic({ visible: true, t, world, landmarks: world, hands });
    } catch (e) {
      err = e;
    }
    t += 0.04;
    const finiteQpos = Array.from(view2.sim.data.qpos).every(Number.isFinite);
    const finiteCtrl = Array.from(view2.sim.data.ctrl).every(Number.isFinite);
    expect(
      !err && res?.tracked && finiteQpos && finiteCtrl,
      `dex3 path mimic(${label}) succeeds with finite qpos/ctrl (err=${err?.message ?? 'none'})`,
    );
  }
  view2.dispose();

  // 3b. handHook.active path on physical Dex3 G1 (g1_with_hands.xml, nu=43)
  const prevFactory = globalThis.__CHECK_DEX3_SIM__;
  const mujoco = await loadMujoco();
  const dex3Files = { ...readTree(G1_DIR), ...readTree(DEX3_DIR) };
  globalThis.__CHECK_DEX3_SIM__ = async () => {
    const sim = new Simulation(mujoco, dex3Files, 'g1_with_hands.xml', 'stand');
    sims.push(sim);
    return sim;
  };
  const view3 = await createSimView(dummyCanvas);
  // First mimic triggers lazy import('./dex3.js') for handSpecs + fingerSolver; settle before testing cases.
  view3.mimic({ visible: true, t: 1.0, world, landmarks: world, hands: null });
  await new Promise((r) => setTimeout(r, 30));
  for (const [label, hands] of handCases) {
    let err = null;
    let res = null;
    try {
      res = view3.mimic({ visible: true, t, world, landmarks: world, hands });
    } catch (e) {
      err = e;
    }
    t += 0.04;
    const finiteQpos = Array.from(view3.sim.data.qpos).every(Number.isFinite);
    const finiteCtrl = Array.from(view3.sim.data.ctrl).every(Number.isFinite);
    expect(
      !err && res?.tracked && finiteQpos && finiteCtrl,
      `handHook.active path mimic(${label}) succeeds with finite qpos/ctrl (err=${err?.message ?? 'none'})`,
    );
  }
  view3.dispose();
  globalThis.__CHECK_DEX3_SIM__ = prevFactory;

  // -------------------------------------------------------------------------
  // 4. GAP-8: copyMotionHands degrades cleanly on malformed RobotMotion.hands in playClip() frame loop
  // -------------------------------------------------------------------------
  console.log('4. playClip() copyMotionHands malformed RobotMotion.hands guard (GAP-8)');
  const rafQueue = [];
  globalThis.requestAnimationFrame = (cb) => {
    rafQueue.push(cb);
    return rafQueue.length;
  };
  const view4 = await createSimView({ isConnected: true });
  let renderCount = 0;
  view4.viewer.onFrame = () => {
    renderCount++;
  };
  const q0 = Array.from(view4.sim.data.qpos);
  const motionHandCases = [
    ['null tuple element', [{ left: Array(21).fill(null), right: null }]],
    ['object element instead of tuple', [{ left: Array.from({ length: 21 }, () => ({ x: 0.1, y: 0.2, z: 0.3 })), right: null }]],
    ['non-array left/right', [{ left: { 0: [0, 0, 0] }, right: 'bad' }]],
    ['non-array motion.hands', { bad: true }],
  ];
  const prevConsoleError = console.error;
  const consoleErrors = [];
  console.error = (...args) => {
    consoleErrors.push(args.map((a) => String(a)).join(' '));
  };
  try {
    for (const [label, hands] of motionHandCases) {
      consoleErrors.length = 0;
      const beforeRender = renderCount;
      view4.playClip({ clip_id: 'gap8-probe', robot: 'unitree_g1', fps: 30, qpos: [q0, q0], hands });
      const cb = rafQueue.pop();
      if (cb) await cb(performance.now());
      const finiteQpos = Array.from(view4.sim.data.qpos).every(Number.isFinite);
      expect(
        Boolean(cb) && consoleErrors.length === 0 && renderCount === beforeRender + 1 && finiteQpos,
        `playClip + frame(${label}) renders cleanly with 0 console errors & finite qpos`,
      );
    }
  } finally {
    console.error = prevConsoleError;
    globalThis.requestAnimationFrame = () => 0;
    view4.dispose();
  }
} finally {
  delete globalThis.__CHECK_DEX3_SIM__;
  globalThis.requestAnimationFrame = prevRaf;
  globalThis.cancelAnimationFrame = prevCancelRaf;
  globalThis.fetch = prevFetch;
  await server.close();
}

if (failures.length) {
  console.error(`\ncheck-dex3 failed: ${failures.length}`);
  process.exit(1);
}
console.log('\ncheck-dex3 passed');
