// Cloudflare Pages Function: POST /api/pid-analyze
// Hybrid P&ID Analyzer using OpenRouter (1 single shot per blueprint, strict JSON schema,
// deterministic sanitizer, exact token & USD cost telemetry).
import {
  buildOpenRouterPayload,
  DEFAULT_OPENROUTER_MODEL,
  estimateOpenRouterCostUsd,
  parseJsonLoose,
  sanitizeAiPidSpec,
} from '../../physics/src/pid_schema.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_PAYLOAD_BYTES = 6 * 1024 * 1024; // 6 MiB safety cap for base64 images
const REQUEST_TIMEOUT_MS = 45_000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8',
};

/**
 * Shared request processor usable both in Cloudflare Pages Functions (`onRequestPost`)
 * and in local Vite dev middleware (`web/vite.config.js`) with zero code drift.
 */
export async function handlePidAnalyzePayload(body, env = {}) {
  const apiKey = String(env.OPENROUTER_API_KEY || '').trim();
  if (!apiKey) {
    return {
      status: 503,
      data: {
        ok: false,
        errorCode: 'api_not_configured',
        message: 'OPENROUTER_API_KEY is not configured on the server.',
      },
    };
  }

  const mode = body?.mode === 'vision' ? 'vision' : 'text';
  const model = String(env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL).trim();
  const fileName = String(body?.fileName || 'blueprint.dxf').slice(0, 120);
  const lang = body?.lang === 'es' ? 'es' : 'en';
  const processGoal = String(body?.processGoal || '').slice(0, 500);
  const imageDataUrl = typeof body?.imageDataUrl === 'string' ? body.imageDataUrl : '';
  const extractedNodes = Array.isArray(body?.extractedNodes) ? body.extractedNodes : [];
  const extractedEdges = Array.isArray(body?.extractedEdges) ? body.extractedEdges : [];
  const rawSnippet = typeof body?.rawSnippet === 'string' ? body.rawSnippet : '';

  if (mode === 'vision' && !imageDataUrl.startsWith('data:image/')) {
    return {
      status: 400,
      data: { ok: false, errorCode: 'invalid_image', message: 'Expected a base64 image data URL for vision mode.' },
    };
  }

  if (mode === 'text' && extractedNodes.length === 0 && !rawSnippet.trim()) {
    return {
      status: 400,
      data: { ok: false, errorCode: 'empty_input', message: 'No blueprint tags or text provided.' },
    };
  }

  const payload = buildOpenRouterPayload({
    mode,
    model,
    fileName,
    lang,
    processGoal,
    imageDataUrl,
    extractedNodes,
    extractedEdges,
    rawSnippet,
  });

  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://trytridi.com',
        'X-Title': 'Tridi Industrial P&ID Assembler',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const latencyMs = Date.now() - startedAt;
    const rawResp = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        status: res.status === 402 ? 402 : 502,
        data: {
          ok: false,
          errorCode: res.status === 402 ? 'insufficient_credits' : 'upstream_error',
          message: rawResp?.error?.message || `OpenRouter returned HTTP ${res.status}`,
        },
      };
    }

    const content = rawResp?.choices?.[0]?.message?.content;
    if (!content) {
      return {
        status: 502,
        data: { ok: false, errorCode: 'empty_ai_response', message: 'Model returned an empty response.' },
      };
    }

    const parsedJson = parseJsonLoose(content);
    const spec = sanitizeAiPidSpec(parsedJson, {
      fallbackNodes: extractedNodes,
      fallbackEdges: extractedEdges,
      fileName,
      processGoal,
    });

    if (spec.nodes.length === 0) {
      return {
        status: 422,
        data: {
          ok: false,
          errorCode: 'no_equipment_detected',
          message: 'No industrial P&ID equipment or instrumentation was recognized in this file.',
        },
      };
    }

    const usedModel = rawResp?.model || model;
    const costInfo = estimateOpenRouterCostUsd(usedModel, rawResp?.usage || {});

    return {
      status: 200,
      data: {
        ok: true,
        mode,
        spec,
        usage: {
          model: usedModel,
          calls: 1,
          ...costInfo,
          latencyMs,
        },
      },
    };
  } catch (err) {
    const isAbort = err?.name === 'AbortError';
    return {
      status: isAbort ? 504 : 500,
      data: {
        ok: false,
        errorCode: isAbort ? 'timeout' : 'analysis_failed',
        message: isAbort ? 'OpenRouter analysis timed out after 28 s.' : String(err?.message || err),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return new Response(
      JSON.stringify({ ok: false, errorCode: 'payload_too_large', message: 'Blueprint payload exceeds 6 MB limit.' }),
      { status: 413, headers: CORS_HEADERS },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, errorCode: 'invalid_json', message: 'Request body must be valid JSON.' }),
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const result = await handlePidAnalyzePayload(body, env);
  return new Response(JSON.stringify(result.data), {
    status: result.status,
    headers: CORS_HEADERS,
  });
}
