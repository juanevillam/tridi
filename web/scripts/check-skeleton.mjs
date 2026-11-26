// Headless check of web/src/skeleton.js trunk assembly: verifies real SMPL-X vertebrae [3, 6, 9, 12]
// when `frame.spine` is present and `mix()` fallback + hidden joint 41 when absent.
// Run: npm --prefix web run check
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildBodyJoints } from '../src/skeleton.js';

const failures = [];
const expect = (ok, what) => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failures.push(what);
};
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

console.log('buildBodyJoints with real SMPL-X spine (clip_caminar-perfil-gvhmr.json)');
{
  const clip = JSON.parse(readFileSync(new URL('../clips/clip_caminar-perfil-gvhmr.json', import.meta.url)));
  const f0 = clip.frames[0];
  const { joints, hasSpine } = buildBodyJoints(f0, 0);
  expect(joints.length === 42, 'returns 42 body joints');
  expect(hasSpine === true, 'hasSpine is true when frame.spine has 4 valid points');
  expect(
    [0, 1, 2].every((k) => near(joints[34][k], f0.spine[0][k])) &&
      [0, 1, 2].every((k) => near(joints[35][k], f0.spine[1][k])) &&
      [0, 1, 2].every((k) => near(joints[36][k], f0.spine[2][k])) &&
      [0, 1, 2].every((k) => near(joints[41][k], f0.spine[3][k])),
    'joints 34, 35, 36, 41 match frame.spine[0..3]',
  );

  // Across all frames, pelvis (33) stays at hip midpoint and vertebrae increase monotonically in height.
  const ordered = clip.frames.every((f) => {
    const { joints: j, hasSpine: hs } = buildBodyJoints(f, 0.01);
    const hipMidY = 0.5 * (f.joints[23][1] + f.joints[24][1]);
    return (
      hs &&
      near(j[33][1], hipMidY) &&
      j[33][1] < j[34][1] &&
      j[34][1] < j[35][1] &&
      j[35][1] < j[36][1] &&
      j[36][1] < j[41][1]
    );
  });
  expect(ordered, `all ${clip.frames.length} frames preserve hip-anchored pelvic center and monotonic vertebrae y`);
}

console.log('buildBodyJoints fallback without spine (legacy clip_correr-perfil-gvhmr.json & stripped frame)');
{
  const legacy = JSON.parse(readFileSync(new URL('../clips/clip_correr-perfil-gvhmr.json', import.meta.url)));
  const out = buildBodyJoints(legacy.frames[0], 0);
  expect(out.joints.length === 42 && out.hasSpine === false, 'legacy clip sets hasSpine=false with 42-slot array');
  expect(out.joints[41].every((v) => v === 0), 'joint 41 has visibility 0 when spine is absent');

  const gvhmr = JSON.parse(readFileSync(new URL('../clips/clip_caminar-perfil-gvhmr.json', import.meta.url)));
  const { spine: _, ...stripped } = gvhmr.frames[0];
  const fallback = buildBodyJoints(stripped, 0);
  const pelvis = fallback.joints[33];
  const sternum = fallback.joints[36];
  const shMidY = 0.5 * (stripped.joints[11][1] + stripped.joints[12][1]);
  expect(!fallback.hasSpine && near(sternum[1], shMidY), 'stripped frame falls back to shoulder midpoint for sternum (36)');
  expect(
    near(fallback.joints[34][1], pelvis[1] + 0.33 * (sternum[1] - pelvis[1])) &&
      near(fallback.joints[35][1], pelvis[1] + 0.67 * (sternum[1] - pelvis[1])),
    'lumbar (34) and thoracic (35) fall back to 0.33 / 0.67 mix()',
  );

  // Malformed spine falls back safely without NaN.
  const bad = buildBodyJoints({ ...stripped, spine: [[0, Number.NaN, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]] }, 0);
  expect(!bad.hasSpine && bad.joints.every((pt) => pt.every(Number.isFinite)), 'malformed spine falls back cleanly without NaN');
}

if (failures.length) {
  console.error(`\ncheck-skeleton failed: ${failures.length}`);
  process.exit(1);
}
console.log('\ncheck-skeleton passed');
