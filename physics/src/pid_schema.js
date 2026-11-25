// Strict Industrial IR schema, prompt builder, deterministic sanitizer, and cost estimator
// for Tridi's Hybrid P&ID Pipeline ("AI reasons, deterministic code assembles" — mus3o pattern).
import isaStandardJson from '../components/isa_standard.json' with { type: 'json' };

export const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.5-flash';

// Approximate USD per 1M tokens for fallback cost estimation when OpenRouter omits `usage.cost`.
const MODEL_PRICING_PER_M = {
  'google/gemini-2.5-flash': { input: 0.3, output: 2.5 },
  'google/gemini-2.5-flash-lite': { input: 0.1, output: 0.4 },
  'google/gemini-2.0-flash-001': { input: 0.1, output: 0.4 },
  'anthropic/claude-3.5-haiku': { input: 0.8, output: 4.0 },
  'qwen/qwen2.5-vl-72b-instruct': { input: 0.4, output: 0.4 },
};

const VALID_PREFIXES = new Set(Object.keys(isaStandardJson.tagClasses));

const PREFIX_ALIAS_MAP = {
  BV: 'FV',
  XV: 'FV',
  SV: 'FV',
  MV: 'FV',
  HV: 'FV',
  CVL: 'FV',
  PP: 'P',
  AOD: 'P',
  PMP: 'P',
  TANK: 'TK',
  VESSEL: 'TK',
  REACTOR: 'TK',
  COL: 'TK',
  SIR: 'TK',
  SILO: 'SL',
  FP: 'PK',
  FILTER: 'PK',
  AIT: 'AT',
  PH: 'AT',
  LIT: 'LT',
  FIT: 'FT',
  PIT: 'PT',
  TIT: 'TT',
  WIT: 'WT',
  MT: 'M',
  MTO: 'M',
  AG: 'M',
};

const SYSTEM_PROMPT = `You are a Principal Industrial Automation & Control Systems Engineer (ANSI/ISA-5.1, ISA-88, PackML, IEC 61131-3).
Your job is to inspect a P&ID blueprint (either an image or extracted AutoCAD DXF/PDF text) and output ONE compact, strictly valid JSON object describing the exact physical process shown.

RULES (CRITICAL — ZERO HALLUCINATION, ZERO EXTRAPOLATION):
1. Extract ONLY equipment, valves, drives, and instruments whose labels are genuinely visible in the input blueprint (including footnotes like pH sensors or tank level sensor lists).
2. NEVER extrapolate or hallucinate sequential numbers (e.g. NEVER generate BV1, BV2, ... BV99). If a plant has dozens of minor manual ball valves, list ONLY the primary process vessels/tanks/columns/silos, all pumps/motors, all machines/filter presses, all sensors/instruments, and up to 10 key main-line control/isolation valves (HARD CAP: <= 38 total nodes, <= 24 edges).
3. Map EVERY component prefix to one of these 16 closed-catalog ISA-5.1 prefixes:
   - Vessels/Equipment: TK (tank/vessel/reactor/column), SL (silo), PK (packager/filter press/machine station)
   - Valves: FV (any control, solenoid, knife-gate, or ball valve — keep original label in sourceLabel, e.g. tag "FV-BV15", sourceLabel "BV15")
   - Drives/Motors: M (agitator/mixer/sifter/motor), P (pump/peristaltic/diaphragm), SC (screw conveyor), CV (belt conveyor)
   - Sensors/Safety: WT (weight/load cell), LT (level transmitter), LSH (high level switch), LSL (low level switch), PT (pressure), TT (temperature), FT (flow), AT (pH/analyzer)
4. Coordinates (x, y) must be normalized floats in [-1.0, 1.0] reflecting approximate blueprint layout (left-to-right, bottom-to-top).
5. Write a SPECIFIC ISA-88 Control Narrative (4 to 5 concise steps), Cause & Effect Safety Interlock Matrix (4 to 5 rows), and plcSequenceSteps (4 to 5 steps) tailored to THIS EXACT PROCESS (never generic filler). Every tag cited in edges, causeEffectMatrix, and plcSequenceSteps MUST exist in nodes[] (or be "E-STOP").
6. Keep descriptions concise (< 60 chars) and output ONLY compact raw JSON matching this exact schema.`;

const PID_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['projectId', 'processGoal', 'nodes', 'edges', 'controlNarrative', 'causeEffectMatrix', 'plcSequenceSteps'],
  properties: {
    projectId: { type: 'string' },
    processGoal: { type: 'string' },
    nodes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['tag', 'sourceLabel', 'prefix', 'x', 'y', 'description'],
        properties: {
          tag: { type: 'string' },
          sourceLabel: { type: 'string' },
          prefix: { type: 'string' },
          x: { type: 'number' },
          y: { type: 'number' },
          description: { type: 'string' },
        },
      },
    },
    edges: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['from', 'to', 'layer'],
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          layer: { type: 'string' },
        },
      },
    },
    controlNarrative: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['step', 'title', 'logic'],
        properties: {
          step: { type: 'string' },
          title: { type: 'string' },
          logic: { type: 'string' },
        },
      },
    },
    causeEffectMatrix: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'causeTag', 'causeCondition', 'effects', 'severity'],
        properties: {
          id: { type: 'string' },
          causeTag: { type: 'string' },
          causeCondition: { type: 'string' },
          effects: { type: 'string' },
          severity: { type: 'string' },
        },
      },
    },
    plcSequenceSteps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['stepNumber', 'label', 'openValves', 'startMotors', 'transitionCondition', 'durationSec'],
        properties: {
          stepNumber: { type: 'integer' },
          label: { type: 'string' },
          openValves: { type: 'array', items: { type: 'string' } },
          startMotors: { type: 'array', items: { type: 'string' } },
          transitionCondition: { type: 'string' },
          durationSec: { type: 'number' },
        },
      },
    },
  },
};

/**
 * Normalizes any tag returned by a VLM/LLM into our closed 16-class ISA-5.1 prefix catalog.
 */
const PRESERVE_ALIAS_IN_SUFFIX = new Set(['BV', 'XV', 'SV', 'MV', 'HV', 'PP', 'AOD', 'SIR', 'FP']);

function normalizeAiNode(rawNode, idx) {
  if (!rawNode || typeof rawNode !== 'object') return null;
  const rawTag = String(rawNode.tag || rawNode.sourceLabel || '').trim().toUpperCase();
  if (!rawTag) return null;

  let rawPrefix = String(rawNode.prefix || '').trim().toUpperCase();
  const tagMatch = rawTag.match(/^([A-Z]{1,7})[-\s_]?([A-Z0-9]+)$/);
  if (!rawPrefix && tagMatch) rawPrefix = tagMatch[1];

  const prefix = VALID_PREFIXES.has(rawPrefix)
    ? rawPrefix
    : VALID_PREFIXES.has(PREFIX_ALIAS_MAP[rawPrefix])
      ? PREFIX_ALIAS_MAP[rawPrefix]
      : tagMatch && VALID_PREFIXES.has(PREFIX_ALIAS_MAP[tagMatch[1]])
        ? PREFIX_ALIAS_MAP[tagMatch[1]]
        : 'TK';

  let suffix = tagMatch ? tagMatch[2] : rawTag.replace(/[^A-Z0-9]/g, '').slice(-3) || String(idx + 1).padStart(2, '0');
  if (!suffix) suffix = String(idx + 1).padStart(2, '0');
  if (/^\d$/.test(suffix)) suffix = suffix.padStart(2, '0');
  // Preserve short equipment alias codes inside suffix when remapped (e.g. BV15 -> FV-BV15, PP6 -> P-PP06),
  // but strip generic English words like TANK 1 -> TK-01.
  if (
    tagMatch &&
    tagMatch[1] !== prefix &&
    PRESERVE_ALIAS_IN_SUFFIX.has(tagMatch[1]) &&
    !suffix.startsWith(tagMatch[1]) &&
    PREFIX_ALIAS_MAP[tagMatch[1]] === prefix
  ) {
    suffix = `${tagMatch[1]}${suffix}`;
  }

  const tag = `${prefix}-${suffix}`;
  const x = Number.isFinite(Number(rawNode.x)) ? Math.max(-1, Math.min(1, Number(rawNode.x))) : ((idx % 5) - 2) * 0.45;
  const y = Number.isFinite(Number(rawNode.y)) ? Math.max(-1, Math.min(1, Number(rawNode.y))) : (1 - Math.floor(idx / 5)) * 0.4;
  const sourceLabel = String(rawNode.sourceLabel || rawNode.tag || tag).trim().slice(0, 48);
  const catalogDesc = isaStandardJson.tagClasses[prefix]?.isaName || `ISA-5.1 Element (${prefix})`;
  const description = String(rawNode.description || `${catalogDesc} (${sourceLabel})`).trim().slice(0, 140);

  return {
    tag,
    sourceLabel,
    prefix,
    layer: `PID_${(isaStandardJson.tagClasses[prefix]?.category || 'AUTO').toUpperCase()}`,
    block: `ISA_${prefix}`,
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
    description,
  };
}

/**
 * Strips optional ```json ... ``` fences and parses JSON safely.
 */
export function parseJsonLoose(text = '') {
  const cleaned = String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new Error('Model response did not contain a JSON object');
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

/**
 * Deterministic sanitizer ("Zod .catch() + verifySources" pattern from mus3o).
 * Guarantees that an AI response can never crash downstream FDS, DXF, MuJoCo, or PLC compilers,
 * and drops any hallucinated edges/references not present in the verified node set.
 */
export function sanitizeAiPidSpec(raw, { fallbackNodes = [], fallbackEdges = [], fileName = 'custom_pid.dxf', processGoal = '' } = {}) {
  const obj = raw && typeof raw === 'object' ? raw : {};

  const deduped = new Map();
  const rawList = Array.isArray(obj.nodes) && obj.nodes.length > 0 ? obj.nodes : fallbackNodes;
  rawList.forEach((n, idx) => {
    const norm = normalizeAiNode(n, idx);
    if (norm && !deduped.has(norm.tag)) {
      deduped.set(norm.tag, norm);
    }
  });
  // If deterministic parser already extracted verified nodes from a DXF/PDF, ensure none are lost
  for (const fn of fallbackNodes) {
    const norm = normalizeAiNode(fn, deduped.size);
    if (norm && !deduped.has(norm.tag)) {
      deduped.set(norm.tag, norm);
    }
  }

  const nodes = [...deduped.values()];
  const tagSet = new Set(nodes.map((n) => n.tag));
  const labelToTag = new Map();
  for (const n of nodes) {
    labelToTag.set(n.tag.toUpperCase(), n.tag);
    labelToTag.set(n.sourceLabel.toUpperCase(), n.tag);
  }
  const resolveTag = (val) => labelToTag.get(String(val || '').trim().toUpperCase()) || null;

  const rawEdges = Array.isArray(obj.edges) && obj.edges.length > 0 ? obj.edges : fallbackEdges;
  const edgeKeys = new Set();
  const edges = [];
  for (const e of rawEdges) {
    const from = resolveTag(e?.from);
    const to = resolveTag(e?.to);
    if (!from || !to || from === to) continue;
    const key = `${from}->${to}`;
    if (edgeKeys.has(key)) continue;
    edgeKeys.add(key);
    edges.push({
      from,
      to,
      layer: String(e?.layer || 'PID_PIPING').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 32),
    });
  }

  const controlNarrative = Array.isArray(obj.controlNarrative)
    ? obj.controlNarrative
        .filter((s) => s && (s.title || s.logic))
        .slice(0, 8)
        .map((s, idx) => ({
          step: String(s.step || `STEP ${String(idx * 10).padStart(2, '0')}`).trim(),
          title: String(s.title || `Process Step ${idx + 1}`).trim(),
          logic: String(s.logic || '').trim(),
        }))
    : [];

  const causeEffectMatrix = Array.isArray(obj.causeEffectMatrix)
    ? obj.causeEffectMatrix
        .filter((ce) => ce && ce.causeCondition && ce.effects)
        .slice(0, 10)
        .map((ce, idx) => {
          const resolved = resolveTag(ce.causeTag);
          return {
            id: String(ce.id || `CE-${String(idx + 1).padStart(2, '0')}`).trim(),
            causeTag: resolved || (String(ce.causeTag || '').toUpperCase().includes('STOP') ? 'E-STOP' : nodes[0]?.tag || 'E-STOP'),
            causeCondition: String(ce.causeCondition).trim(),
            effects: String(ce.effects).trim(),
            severity: String(ce.severity || 'HIGH / PROCESS').trim().toUpperCase(),
          };
        })
    : [];

  let lastStepNum = 0;
  const plcSequenceSteps = Array.isArray(obj.plcSequenceSteps)
    ? obj.plcSequenceSteps
        .filter((st) => st && (st.label || st.name))
        .slice(0, 8)
        .map((st, idx) => {
          let num = Number.isFinite(Number(st.stepNumber)) ? Math.round(Number(st.stepNumber)) : (idx + 1) * 10;
          if (num > 0 && num < 10) num *= 10;
          if (num <= lastStepNum) num = lastStepNum + 10;
          lastStepNum = num;
          const cleanLabel = String(st.label || st.name)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^A-Za-z0-9_ ]/g, '')
            .trim()
            .toUpperCase()
            .replace(/\s+/g, '_')
            .slice(0, 32);
          return {
            stepNumber: num,
            label: cleanLabel || `STEP_${num}`,
            openValves: Array.isArray(st.openValves) ? st.openValves.map(resolveTag).filter(Boolean) : [],
            startMotors: Array.isArray(st.startMotors) ? st.startMotors.map(resolveTag).filter(Boolean) : [],
            transitionCondition: String(st.transitionCondition || st.nextCondition || 'TRUE').trim().slice(0, 96),
            durationSec: Number.isFinite(Number(st.durationSec)) ? Math.max(0, Number(st.durationSec)) : 0,
          };
        })
    : [];

  const cleanProjectId = String(obj.projectId || fileName.replace(/\.[^.]+$/, ''))
    .toUpperCase()
    .replace(/[^A-Z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'TRIDI_PID_PLANT';

  return {
    projectId: cleanProjectId,
    processGoal: String(processGoal || obj.processGoal || '').trim(),
    nodes,
    edges,
    controlNarrative,
    causeEffectMatrix,
    plcSequenceSteps,
    verifiedTagCount: nodes.length,
    tagSetSize: tagSet.size,
  };
}

/**
 * Computes exact or estimated USD cost of one OpenRouter call for unit economics tracking.
 */
export function estimateOpenRouterCostUsd(model = DEFAULT_OPENROUTER_MODEL, usage = {}) {
  const promptTokens = Number(usage?.prompt_tokens ?? usage?.promptTokens ?? 0);
  const completionTokens = Number(usage?.completion_tokens ?? usage?.completionTokens ?? 0);
  const totalTokens = Number(usage?.total_tokens ?? usage?.totalTokens ?? promptTokens + completionTokens);
  if (typeof usage?.cost === 'number' && Number.isFinite(usage.cost)) {
    return { promptTokens, completionTokens, totalTokens, costUsd: usage.cost };
  }
  const pricing = MODEL_PRICING_PER_M[model] || MODEL_PRICING_PER_M[DEFAULT_OPENROUTER_MODEL];
  const costUsd = (promptTokens / 1_000_000) * pricing.input + (completionTokens / 1_000_000) * pricing.output;
  return {
    promptTokens,
    completionTokens,
    totalTokens,
    costUsd: Number(costUsd.toFixed(6)),
  };
}

/**
 * Builds the single-shot OpenRouter `/api/v1/chat/completions` payload.
 * Supports two cost-optimized routes:
 *   - `vision`: imageDataUrl (`data:image/jpeg;base64,...`) from `.png`/`.jpg` or scanned `.pdf`
 *   - `text`: compact deterministic summary from `.dxf` or vector `.pdf` (~500 tokens input)
 */
export function buildOpenRouterPayload({
  mode = 'text',
  model = DEFAULT_OPENROUTER_MODEL,
  fileName = 'blueprint.dxf',
  lang = 'en',
  processGoal = '',
  imageDataUrl = '',
  extractedNodes = [],
  extractedEdges = [],
  rawSnippet = '',
} = {}) {
  const targetLang = lang === 'es' ? 'Spanish (keeping ANSI/ISA-5.1 tags and IEC 61131-3 terms in English)' : 'English (ANSI/ISA-5.1 technical industrial English)';
  const userGoalLine = processGoal ? `User operational objective: "${processGoal}"` : 'Infer the operational objective directly from the blueprint.';

  if (mode === 'vision' && imageDataUrl) {
    return {
      model,
      temperature: 0.1,
      max_tokens: 4500,
      reasoning: { effort: 'none' },
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'tridi_pid_spec',
          strict: true,
          schema: PID_JSON_SCHEMA,
        },
      },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this industrial P&ID blueprint image ("${fileName}").\nLanguage for prose fields (processGoal, controlNarrative, causeEffectMatrix): ${targetLang}.\n${userGoalLine}\nExtract ALL clearly readable vessels/tanks/silos/columns, pumps/motors, filter presses/packagers, instruments (including footnotes like pH sensors or tank level sensor lists), and up to 10 key main-line valves (HARD CAP: <= 38 total nodes, <= 24 edges; NEVER extrapolate sequential numbers). Produce the complete compact JSON specification.`,
            },
            {
              type: 'image_url',
              image_url: { url: imageDataUrl },
            },
          ],
        },
      ],
    };
  }

  const compactNodes = extractedNodes.slice(0, 80).map((n) => ({
    tag: n.tag,
    sourceLabel: n.sourceLabel || n.tag,
    prefix: n.prefix,
    description: n.description,
  }));
  const compactEdges = extractedEdges.slice(0, 60);

  return {
    model,
    temperature: 0.1,
    max_tokens: 3000,
    reasoning: { effort: 'none' },
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'tridi_pid_spec',
        strict: true,
        schema: PID_JSON_SCHEMA,
      },
    },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Blueprint file: "${fileName}"\nLanguage for prose fields (processGoal, controlNarrative, causeEffectMatrix): ${targetLang}.\n${userGoalLine}\n\nDeterministically verified P&ID tags (${compactNodes.length}):\n${JSON.stringify(compactNodes)}\n\nVerified piping edges (${compactEdges.length}):\n${JSON.stringify(compactEdges)}${rawSnippet ? `\nAdditional blueprint text notes:\n${String(rawSnippet).slice(0, 1200)}` : ''}\n\nBecause nodes[] and edges[] are already verified locally, return "nodes": [] and "edges": [] to save tokens, and output ONLY projectId, processGoal, controlNarrative (4-6 steps), causeEffectMatrix (4-6 rows), and plcSequenceSteps (4-6 steps) referencing the exact verified tags above.`,
      },
    ],
  };
}
