import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { handlePidAnalyzePayload } from '../functions/api/pid-analyze.js';

function loadRootDotEnv() {
  const envPath = resolve(__dirname, '../.env');
  const out = { ...process.env };
  if (!existsSync(envPath)) return out;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!out[key]) out[key] = val;
  }
  return out;
}

function localPidAnalyzePlugin() {
  return {
    name: 'tridi-local-pid-analyze',
    configureServer(server) {
      server.middlewares.use('/api/pid-analyze', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }
        if (req.method !== 'POST') return next();
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          const result = await handlePidAnalyzePayload(body, loadRootDotEnv());
          res.statusCode = result.status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(result.data));
        } catch (err) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, errorCode: 'invalid_json', message: String(err?.message || err) }));
        }
      });
    },
  };
}

export default defineConfig({
  // Root-relative asset paths so clean History API routes (e.g. /simulations/luigi_lab4) resolve
  // /assets/, /media/, and /models/ from root, and Vite serves index.html in SPA mode (matching
  // Cloudflare Pages native no-404.html SPA fallback without a _redirects infinite loop).
  base: '/',
  appType: 'spa',
  plugins: [localPidAnalyzePlugin()],
  resolve: {
    // tridi-physics and tridi-live are links to ../physics and ../data/live, and npm does not
    // install a linked package's dependencies. Resolving these from web/node_modules makes a
    // fresh install build, and keeps a single copy of three.js. Their versions must match
    // physics/package.json and data/live/package.json.
    dedupe: ['three', '@mujoco/mujoco', '@mediapipe/tasks-vision', 'onnxruntime-web'],
  },
});
