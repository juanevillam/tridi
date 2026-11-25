// Deterministic Dynamic 2D P&ID Layout & ANSI/ISA-5.1 Vector Schematic Renderer
// Builds a real, collision-free 2D schematic directly from `dag.nodes` and `dag.edges`,
// supporting any uploaded plant (.dxf, .pdf, or Vision image) with interactive tag selection.

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const SHAPE_BY_PREFIX = {
  TK: { shape: 'tank', accent: '#68b5ff', lane: 2, boxW: 64, boxH: 56 },
  SL: { shape: 'silo', accent: '#7ec8ff', lane: 0, boxW: 58, boxH: 60 },
  FV: { shape: 'valve', accent: '#c8ff2e', lane: 1, boxW: 56, boxH: 40 },
  P: { shape: 'pump', accent: '#f6ad55', lane: 1, boxW: 54, boxH: 46 },
  M: { shape: 'motor', accent: '#f6ad55', lane: 1, boxW: 52, boxH: 46 },
  SC: { shape: 'conveyor', accent: '#e2a957', lane: 1, boxW: 68, boxH: 38 },
  CV: { shape: 'conveyor', accent: '#9ae6b4', lane: 4, boxW: 68, boxH: 38 },
  PK: { shape: 'packager', accent: '#a7f3d0', lane: 4, boxW: 66, boxH: 50 },
  WT: { shape: 'instrument', accent: '#b794f4', lane: 3, boxW: 54, boxH: 44 },
  LT: { shape: 'instrument', accent: '#90cdf4', lane: 3, boxW: 54, boxH: 44 },
  PT: { shape: 'instrument', accent: '#90cdf4', lane: 3, boxW: 54, boxH: 44 },
  TT: { shape: 'instrument', accent: '#feb2b2', lane: 3, boxW: 54, boxH: 44 },
  FT: { shape: 'instrument', accent: '#76e4f7', lane: 3, boxW: 54, boxH: 44 },
  AT: { shape: 'instrument', accent: '#d6bcfa', lane: 3, boxW: 54, boxH: 44 },
  LSH: { shape: 'safety', accent: '#fbbf24', lane: 3, boxW: 64, boxH: 36 },
  LSL: { shape: 'safety', accent: '#fbbf24', lane: 3, boxW: 64, boxH: 36 },
};

function getVisualSpec(node) {
  return SHAPE_BY_PREFIX[node.prefix] ?? { shape: 'instrument', accent: '#a9ada4', lane: 3, boxW: 56, boxH: 44 };
}

function hasMeaningfulCoordinates(nodes) {
  if (!nodes.length) return false;
  // `PID_AUTO` nodes came from raw text/PDF fallback with synthetic grid coordinates —
  // prefer the process-flow swimlane layout for those so equipment flows cleanly left-to-right.
  if (nodes.every((n) => n.layer === 'PID_AUTO')) return false;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const distinct = new Set();
  for (const n of nodes) {
    const x = Number(n.x);
    const y = Number(n.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    distinct.add(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  const spread = Math.max(maxX - minX, maxY - minY);
  return spread > 0.05 && distinct.size >= Math.max(2, Math.ceil(nodes.length * 0.45));
}

/**
 * Computes a deterministic, collision-free 2D schematic layout for any P&ID DAG.
 * Uses true blueprint (x, y) coordinates when available with deterministic repulsion relaxation,
 * or falls back to a clean 5-lane ISA process flow layout for coordinate-less blueprints.
 */
export function buildPidDiagramLayout(dag, { width = 940 } = {}) {
  const rawNodes = Array.isArray(dag?.nodes) ? dag.nodes : [];
  const rawEdges = Array.isArray(dag?.edges) ? dag.edges : [];
  const count = rawNodes.length;

  // Adaptive canvas height so 8-node mixers stay compact and 48-node pilot plants stay legible.
  const height = count <= 12 ? 380 : count <= 24 ? 480 : count <= 36 ? 560 : 640;
  const padX = 64;
  const padTop = 58;
  const padBottom = 46;
  const usableW = Math.max(240, width - padX * 2);
  const usableH = Math.max(180, height - padTop - padBottom);

  const useCoords = hasMeaningfulCoordinates(rawNodes);
  let positioned = [];

  if (useCoords) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const n of rawNodes) {
      const x = Number.isFinite(Number(n.x)) ? Number(n.x) : 0;
      const y = Number.isFinite(Number(n.y)) ? Number(n.y) : 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const spanX = Math.max(0.01, maxX - minX);
    const spanY = Math.max(0.01, maxY - minY);

    positioned = rawNodes.map((n, idx) => {
      const spec = getVisualSpec(n);
      const nx = Number.isFinite(Number(n.x)) ? (Number(n.x) - minX) / spanX : 0.5;
      // Invert Y: CAD / Vision +Y is upward, SVG +Y is downward.
      const ny = Number.isFinite(Number(n.y)) ? 1 - (Number(n.y) - minY) / spanY : 0.5;
      // Tiny deterministic tie-breaker prevents identical coordinates from stacking at zero distance.
      const jitterX = ((idx % 3) - 1) * 1.5;
      const jitterY = (Math.floor(idx / 3) % 2 === 0 ? -1 : 1) * 1.5;
      const anchorX = padX + nx * usableW + jitterX;
      const anchorY = padTop + ny * usableH + jitterY;
      return {
        ...n,
        ...spec,
        anchorX,
        anchorY,
        cx: anchorX,
        cy: anchorY,
      };
    });

    // Deterministic overlap relaxation: guarantees readable spacing without scrambling topology.
    const minGapX = count > 30 ? 78 : 92;
    const minGapY = count > 30 ? 52 : 62;
    const iterations = 48;
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < positioned.length; i++) {
        for (let j = i + 1; j < positioned.length; j++) {
          const a = positioned[i];
          const b = positioned[j];
          const dx = b.cx - a.cx;
          const dy = b.cy - a.cy;
          const overlapX = minGapX - Math.abs(dx);
          const overlapY = minGapY - Math.abs(dy);
          if (overlapX > 0 && overlapY > 0) {
            if (overlapX < overlapY) {
              const push = (overlapX * 0.52) * (dx >= 0 ? 1 : -1);
              a.cx -= push;
              b.cx += push;
            } else {
              const push = (overlapY * 0.52) * (dy >= 0 ? 1 : -1);
              a.cy -= push;
              b.cy += push;
            }
          }
        }
      }
      for (const n of positioned) {
        // Soft spring back toward original blueprint layout + hard canvas clamp.
        n.cx += (n.anchorX - n.cx) * 0.05;
        n.cy += (n.anchorY - n.cy) * 0.05;
        n.cx = Math.max(padX, Math.min(width - padX, n.cx));
        n.cy = Math.max(padTop, Math.min(height - padBottom, n.cy));
      }
    }
  } else {
    // Process-flow swimlane layout (left -> right) when blueprint lacks 2D coordinates.
    const lanes = [[], [], [], [], []];
    const valves = rawNodes.filter((n) => n.prefix === 'FV');
    const lastValveTag = valves.length > 1 ? valves.at(-1).tag : null;
    for (const n of rawNodes) {
      const spec = getVisualSpec(n);
      let laneIdx = spec.lane;
      if (n.prefix === 'FV') {
        laneIdx = n.tag === lastValveTag ? 4 : 0;
      }
      lanes[laneIdx].push({ ...n, ...spec });
    }
    const activeLanes = lanes.filter((arr) => arr.length > 0);
    const colCount = Math.max(1, activeLanes.length);
    activeLanes.forEach((laneNodes, colIdx) => {
      const laneCenterX =
        colCount === 1 ? width / 2 : padX + (colIdx / (colCount - 1)) * usableW;
      const maxPerCol = 6;
      const subCols = Math.ceil(laneNodes.length / maxPerCol);
      laneNodes.forEach((n, idx) => {
        const subCol = Math.floor(idx / maxPerCol);
        const rowInSub = idx % maxPerCol;
        const rowsHere = Math.min(maxPerCol, laneNodes.length - subCol * maxPerCol);
        const offsetX = subCols > 1 ? (subCol - (subCols - 1) / 2) * 86 : 0;
        const cy =
          rowsHere === 1
            ? padTop + usableH / 2
            : padTop + (rowInSub / (rowsHere - 1)) * usableH;
        positioned.push({
          ...n,
          cx: Math.max(padX, Math.min(width - padX, laneCenterX + offsetX)),
          cy,
        });
      });
    });
  }

  const nodeMap = new Map(positioned.map((n) => [n.tag, n]));
  const adjacency = new Map(positioned.map((n) => [n.tag, { upstream: [], downstream: [], edgeCount: 0 }]));

  const edges = [];
  rawEdges.forEach((e, idx) => {
    const a = nodeMap.get(e.from);
    const b = nodeMap.get(e.to);
    if (!a || !b || a.tag === b.tag) return;

    const adjFrom = adjacency.get(a.tag);
    const adjTo = adjacency.get(b.tag);
    if (!adjFrom.downstream.includes(b.tag)) adjFrom.downstream.push(b.tag);
    if (!adjTo.upstream.includes(a.tag)) adjTo.upstream.push(a.tag);
    adjFrom.edgeCount++;
    adjTo.edgeCount++;

    // Orthogonal Manhattan pipe routing with deterministic lane offset to prevent collinear overlap.
    const dx = b.cx - a.cx;
    const dy = b.cy - a.cy;
    const signX = dx >= 0 ? 1 : -1;
    const signY = dy >= 0 ? 1 : -1;
    const startX = Math.abs(dx) >= Math.abs(dy) ? a.cx + signX * (a.boxW * 0.44) : a.cx;
    const startY = Math.abs(dx) >= Math.abs(dy) ? a.cy : a.cy + signY * (a.boxH * 0.44);
    const endX = Math.abs(dx) >= Math.abs(dy) ? b.cx - signX * (b.boxW * 0.48) : b.cx;
    const endY = Math.abs(dx) >= Math.abs(dy) ? b.cy : b.cy - signY * (b.boxH * 0.48);

    const bendOffset = ((idx % 5) - 2) * 8;
    let d;
    if (Math.abs(dx) >= Math.abs(dy)) {
      const midX = (startX + endX) / 2 + bendOffset;
      d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${midX.toFixed(1)} ${startY.toFixed(1)} L ${midX.toFixed(1)} ${endY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`;
    } else {
      const midY = (startY + endY) / 2 + bendOffset;
      d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${startX.toFixed(1)} ${midY.toFixed(1)} L ${endX.toFixed(1)} ${midY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`;
    }

    edges.push({
      id: `edge-${idx}`,
      from: a.tag,
      to: b.tag,
      layer: e.layer || 'PID_PIPING',
      d,
    });
  });

  return {
    width,
    height,
    layoutMode: useCoords ? 'coords' : 'swimlanes',
    nodes: positioned.map(({ anchorX, anchorY, ...rest }) => ({
      ...rest,
      cx: Number(rest.cx.toFixed(1)),
      cy: Number(rest.cy.toFixed(1)),
      upstream: adjacency.get(rest.tag)?.upstream ?? [],
      downstream: adjacency.get(rest.tag)?.downstream ?? [],
    })),
    edges,
  };
}

function renderIsaSymbol(node) {
  const { shape, accent } = node;
  if (shape === 'tank') {
    return `
      <rect class="asm-svg-body" x="-24" y="-22" width="48" height="40" rx="10" fill="#14181f" stroke="${accent}" stroke-width="1.6"/>
      <rect class="asm-svg-fill" x="-20" y="-4" width="40" height="18" rx="4" fill="${accent}" fill-opacity="0.16"/>
      <line x1="-24" y1="-10" x2="24" y2="-10" stroke="${accent}" stroke-opacity="0.32" stroke-width="1"/>`;
  }
  if (shape === 'silo') {
    return `
      <path class="asm-svg-body" d="M -20 -24 L 20 -24 L 20 6 L 0 22 L -20 6 Z" fill="#14181f" stroke="${accent}" stroke-width="1.6"/>
      <line x1="-20" y1="6" x2="20" y2="6" stroke="${accent}" stroke-opacity="0.35" stroke-width="1"/>`;
  }
  if (shape === 'valve') {
    // Classic ANSI/ISA-5.1 bowtie valve with actuator stem + bonnet
    return `
      <polygon class="asm-svg-body" points="-16,-9 0,0 -16,9" fill="#14181f" stroke="${accent}" stroke-width="1.5"/>
      <polygon class="asm-svg-body" points="16,-9 0,0 16,9" fill="#14181f" stroke="${accent}" stroke-width="1.5"/>
      <line x1="0" y1="0" x2="0" y2="-13" stroke="${accent}" stroke-width="1.4"/>
      <rect x="-7" y="-18" width="14" height="6" rx="2" fill="#14181f" stroke="${accent}" stroke-width="1.2"/>`;
  }
  if (shape === 'pump') {
    // ISA centrifugal/transfer pump circle with tangential discharge nozzle
    return `
      <circle class="asm-svg-body" cx="0" cy="-2" r="14" fill="#14181f" stroke="${accent}" stroke-width="1.6"/>
      <polygon points="-5,-8 9,-2 -5,4" fill="${accent}" fill-opacity="0.78"/>
      <line x1="-18" y1="12" x2="18" y2="12" stroke="${accent}" stroke-opacity="0.45" stroke-width="1.2"/>`;
  }
  if (shape === 'motor') {
    return `
      <circle class="asm-svg-body" cx="0" cy="-2" r="14" fill="#14181f" stroke="${accent}" stroke-width="1.6"/>
      <text x="0" y="2" text-anchor="middle" font-family="Geist Mono, monospace" font-size="11" font-weight="700" fill="${accent}">M</text>`;
  }
  if (shape === 'conveyor') {
    return `
      <rect class="asm-svg-body" x="-26" y="-10" width="52" height="16" rx="8" fill="#14181f" stroke="${accent}" stroke-width="1.5"/>
      <circle cx="-17" cy="-2" r="3.2" fill="none" stroke="${accent}" stroke-width="1.2"/>
      <circle cx="0" cy="-2" r="3.2" fill="none" stroke="${accent}" stroke-width="1.2"/>
      <circle cx="17" cy="-2" r="3.2" fill="none" stroke="${accent}" stroke-width="1.2"/>`;
  }
  if (shape === 'packager') {
    return `
      <rect class="asm-svg-body" x="-24" y="-17" width="48" height="32" rx="6" fill="#14181f" stroke="${accent}" stroke-width="1.6"/>
      <line x1="-10" y1="-17" x2="-10" y2="15" stroke="${accent}" stroke-opacity="0.4" stroke-width="1"/>
      <line x1="10" y1="-17" x2="10" y2="15" stroke="${accent}" stroke-opacity="0.4" stroke-width="1"/>`;
  }
  if (shape === 'safety') {
    return `
      <rect class="asm-svg-body" x="-24" y="-12" width="48" height="22" rx="11" fill="#14181f" stroke="${accent}" stroke-width="1.6"/>
      <circle cx="-14" cy="-1" r="2.6" fill="${accent}"/>`;
  }
  // Default ISA-5.1 instrument bubble (circle with center horizontal line = local/DCS instrument)
  return `
    <circle class="asm-svg-body" cx="0" cy="-2" r="14" fill="#14181f" stroke="${accent}" stroke-width="1.5"/>
    <line x1="-14" y1="-2" x2="14" y2="-2" stroke="${accent}" stroke-opacity="0.45" stroke-width="1"/>`;
}

/**
 * Renders the complete interactive ANSI/ISA-5.1 2D P&ID SVG directly from any parsed DAG.
 * Supports clicked/focused tag highlighting, connected pipe illumination, active sequence tags,
 * and live fault stress-test indicators without destroying keyboard focus.
 */
export function renderPidSchematicSvg(
  dag,
  {
    selectedTag = null,
    activeTags = [],
    faultTags = [],
    ariaLabel = 'Interactive P&ID Schematic',
    compact = false,
  } = {},
) {
  const layout = buildPidDiagramLayout(dag, { width: 940 });
  const activeSet = new Set(activeTags);
  const faultSet = new Set(faultTags);
  const selectedNeighbors = new Set();
  if (selectedTag) {
    selectedNeighbors.add(selectedTag);
    for (const e of layout.edges) {
      if (e.from === selectedTag) selectedNeighbors.add(e.to);
      if (e.to === selectedTag) selectedNeighbors.add(e.from);
    }
  }

  const uid = compact ? 'c' : 'f';
  const edgesSvg = layout.edges
    .map((e) => {
      const touchesSelected = Boolean(selectedTag && (e.from === selectedTag || e.to === selectedTag));
      const touchesFault = faultSet.has(e.from) || faultSet.has(e.to);
      const touchesActive = activeSet.has(e.from) || activeSet.has(e.to);
      const cls = [
        'asm-svg-edge',
        touchesSelected ? 'is-selected' : selectedTag ? 'is-dim' : '',
        touchesFault ? 'is-fault' : touchesActive ? 'is-active' : '',
      ]
        .filter(Boolean)
        .join(' ');
      const marker = touchesFault
        ? `url(#pid-arrow-fault-${uid})`
        : touchesSelected || touchesActive
          ? `url(#pid-arrow-signal-${uid})`
          : `url(#pid-arrow-${uid})`;
      return `<path class="${cls}" d="${e.d}" data-from="${esc(e.from)}" data-to="${esc(e.to)}" data-layer="${esc(e.layer)}" fill="none" marker-end="${marker}"><title>${esc(e.from)} → ${esc(e.to)} (${esc(e.layer)})</title></path>`;
    })
    .join('');

  const nodesSvg = layout.nodes
    .map((n) => {
      const isSelected = selectedTag === n.tag;
      const isNeighbor = Boolean(selectedTag && !isSelected && selectedNeighbors.has(n.tag));
      const isDim = Boolean(selectedTag && !selectedNeighbors.has(n.tag));
      const isFault = faultSet.has(n.tag);
      const isActive = activeSet.has(n.tag);
      const cls = [
        'asm-svg-node',
        isSelected ? 'is-selected' : '',
        isNeighbor ? 'is-neighbor' : '',
        isDim ? 'is-dim' : '',
        isFault ? 'is-fault' : '',
        isActive ? 'is-active' : '',
      ]
        .filter(Boolean)
        .join(' ');
      const tagY = n.shape === 'tank' || n.shape === 'silo' ? 32 : 25;
      const labelW = Math.max(46, n.tag.length * 6.5 + 12);
      return `
        <g class="${cls}" transform="translate(${n.cx}, ${n.cy})" data-tag="${esc(n.tag)}" data-prefix="${esc(n.prefix)}" role="button" tabindex="0" aria-pressed="${isSelected}" aria-label="${esc(n.tag)} — ${esc(n.isaName)}">
          <title>${esc(n.tag)} · ${esc(n.isaName)} — ${esc(n.description)}</title>
          <circle class="asm-svg-halo" cx="0" cy="-2" r="28" fill="none"/>
          ${renderIsaSymbol(n)}
          <rect class="asm-svg-tag-bg" x="${(-labelW / 2).toFixed(1)}" y="${(tagY - 10).toFixed(1)}" width="${labelW.toFixed(1)}" height="15" rx="4"/>
          <text class="asm-svg-tag-text" x="0" y="${tagY.toFixed(1)}" text-anchor="middle">${esc(n.tag)}</text>
        </g>`;
    })
    .join('');

  const svgClass = compact ? 'asm-pid-svg asm-pid-svg--compact' : 'asm-pid-svg asm-pid-svg--dynamic';
  return `
    <svg class="${svgClass}" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-label="${esc(ariaLabel)}" data-node-count="${layout.nodes.length}" data-edge-count="${layout.edges.length}">
      <defs>
        <pattern id="pid-grid-${uid}" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgb(241 243 238 / 0.04)" stroke-width="1"/>
        </pattern>
        <marker id="pid-arrow-${uid}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#636b78"/>
        </marker>
        <marker id="pid-arrow-signal-${uid}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#c8ff2e"/>
        </marker>
        <marker id="pid-arrow-fault-${uid}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#ff6b6b"/>
        </marker>
      </defs>
      <rect x="0" y="0" width="${layout.width}" height="${layout.height}" fill="url(#pid-grid-${uid})"/>
      <g class="asm-svg-meta" font-family="Geist Mono, monospace" font-size="10" fill="#7d8279">
        <text x="16" y="20">ISA-5.1 TOPOLOGY · ${esc(dag?.projectId || 'PLANT')} · ${layout.nodes.length} TAGS · ${layout.edges.length} LINES</text>
        <g transform="translate(${layout.width - 315}, 16)">
          <circle cx="0" cy="-3" r="3.5" fill="#68b5ff"/><text x="7" y="0">TK/SL</text>
          <circle cx="56" cy="-3" r="3.5" fill="#c8ff2e"/><text x="63" y="0">FV</text>
          <circle cx="95" cy="-3" r="3.5" fill="#f6ad55"/><text x="102" y="0">P/M/SC</text>
          <circle cx="156" cy="-3" r="3.5" fill="#90cdf4"/><text x="163" y="0">WT/LT/TT</text>
          <circle cx="232" cy="-3" r="3.5" fill="#fbbf24"/><text x="239" y="0">LSH/LSL</text>
        </g>
      </g>
      <g class="asm-svg-edges">${edgesSvg}</g>
      <g class="asm-svg-nodes">${nodesSvg}</g>
    </svg>`;
}
