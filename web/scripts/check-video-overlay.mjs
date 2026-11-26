// Regression check for GAP-4 (web/src/video-overlay.js load(url) async race guard):
// verifies that stale fetch() / res.json() resolutions never overwrite pose or re-enable ready()
// after load(null) or a newer load(url2).
// Run: npm --prefix web run check
import { createServer } from 'vite';

const WEB_ROOT = new URL('..', import.meta.url).pathname;

const failures = [];
const expect = (ok, what) => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failures.push(what);
};

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeStubCanvas() {
  let clears = 0;
  let strokes = 0;
  const ctx = {
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    setTransform() {},
    clearRect() { clears++; },
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() { strokes++; },
    arc() {},
    fill() {},
  };
  return {
    clientWidth: 640,
    clientHeight: 360,
    width: 640,
    height: 360,
    getContext: () => ctx,
    stats: () => ({ clears, strokes }),
  };
}

const poseA = {
  fps: 30,
  points: [0, 7, 8, 11, 12],
  frames: Array.from({ length: 30 }, () => [
    [0.5, 0.2, 0.99],
    [0.45, 0.2, 0.99],
    [0.55, 0.2, 0.99],
    [0.4, 0.4, 0.99],
    [0.6, 0.4, 0.99],
  ]),
};
const poseB = {
  fps: 25,
  points: [11, 12],
  frames: Array.from({ length: 10 }, () => [
    [0.3, 0.5, 0.99],
    [0.7, 0.5, 0.99],
  ]),
};

const prevFetch = globalThis.fetch;
const pending = new Map();
globalThis.fetch = (url) => {
  const entry = pending.get(url);
  if (!entry) return Promise.reject(new Error(`Unexpected URL: ${url}`));
  return entry.fetchDef.promise;
};

const server = await createServer({
  root: WEB_ROOT,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
});

try {
  const { createPoseDrawing } = await server.ssrLoadModule('/src/video-overlay.js');
  const video = { videoWidth: 1280, videoHeight: 720 };

  // 1. load(urlA) -> load(null) -> resolve urlA
  {
    const dA = { fetchDef: deferred(), jsonDef: deferred() };
    pending.set('/pose-a.json', dA);
    const canvas = makeStubCanvas();
    const drawing = createPoseDrawing(video, canvas);

    const pA = drawing.load('/pose-a.json');
    await drawing.load(null);
    expect(drawing.ready() === false && drawing.duration() === 0, 'load(null) clears ready() and duration() immediately');

    dA.fetchDef.resolve({ ok: true, json: () => dA.jsonDef.promise });
    dA.jsonDef.resolve(poseA);
    await pA;

    expect(
      drawing.ready() === false && drawing.duration() === 0,
      'stale load(urlA) resolving after load(null) does not re-enable ready() or overwrite pose',
    );
    drawing.draw(0);
    expect(canvas.stats().strokes === 0, 'draw() after stale resolution remains a clean no-op');
  }

  // 2. load(urlA) -> load(urlB) -> resolve urlB -> resolve urlA
  {
    const dA = { fetchDef: deferred(), jsonDef: deferred() };
    const dB = { fetchDef: deferred(), jsonDef: deferred() };
    pending.set('/pose-a.json', dA);
    pending.set('/pose-b.json', dB);
    const canvas = makeStubCanvas();
    const drawing = createPoseDrawing(video, canvas);

    const pA = drawing.load('/pose-a.json');
    const pB = drawing.load('/pose-b.json');

    dB.fetchDef.resolve({ ok: true, json: () => dB.jsonDef.promise });
    dB.jsonDef.resolve(poseB);
    await pB;
    expect(drawing.ready() === true && Math.abs(drawing.duration() - 0.4) < 1e-9, 'newer load(urlB) sets duration=0.4 s');

    dA.fetchDef.resolve({ ok: true, json: () => dA.jsonDef.promise });
    dA.jsonDef.resolve(poseA);
    await pA;
    expect(
      drawing.ready() === true && Math.abs(drawing.duration() - 0.4) < 1e-9,
      'stale load(urlA) resolving after load(urlB) keeps poseB (duration=0.4 s)',
    );
  }

  // 3. load(urlA) fetch resolves, then load(urlB) supersedes before urlA.json() finishes
  {
    const dA = { fetchDef: deferred(), jsonDef: deferred() };
    const dB = { fetchDef: deferred(), jsonDef: deferred() };
    pending.set('/pose-a.json', dA);
    pending.set('/pose-b.json', dB);
    const canvas = makeStubCanvas();
    const drawing = createPoseDrawing(video, canvas);

    const pA = drawing.load('/pose-a.json');
    dA.fetchDef.resolve({ ok: true, json: () => dA.jsonDef.promise });
    await Promise.resolve(); // allow fetch(urlA) continuation to enter await res.json()

    const pB = drawing.load('/pose-b.json');
    dB.fetchDef.resolve({ ok: true, json: () => dB.jsonDef.promise });
    dB.jsonDef.resolve(poseB);
    await pB;

    dA.jsonDef.resolve(poseA);
    await pA;
    expect(
      drawing.ready() === true && Math.abs(drawing.duration() - 0.4) < 1e-9,
      'stale urlA.json() resolving after load(urlB) does not overwrite poseB',
    );
    drawing.draw(0.1);
    expect(canvas.stats().strokes === 1, 'draw() renders only poseB (1 bone stroke, not poseA)');
  }
} finally {
  globalThis.fetch = prevFetch;
  await server.close();
}

if (failures.length) {
  console.error(`\ncheck-video-overlay failed: ${failures.length}`);
  process.exit(1);
}
console.log('\ncheck-video-overlay passed');
