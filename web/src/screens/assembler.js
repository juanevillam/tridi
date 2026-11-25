// #/assembler — Tridi Assembler Studio ("AI reasons, code assembles" — mus3o Low-Token DSL pattern).
// Channel 1: Plant & Process Automation (P&ID .dxf -> ISA-5.1 Engineering Docs + 3D Twin + PLC Flat Files)
// Channel 2: Custom Robots & Mechatronics (.stl + .ino -> Pinout/Timer Audit + MuJoCo Twin + 50 Hz C99 Firmware)
import './assembler.css';
import {
  buildPidDiagramLayout,
  classifyStlMeshes,
  extractBlueprintFromUpload,
  generateIsaEngineeringDocs,
  generateMujocoXml,
  generatePidMujocoXml,
  generatePlcFlatFile,
  getPreset,
  listComponents,
  parseArduinoSketch,
  parseDxfPid,
  PID_SAMPLE_DXFS,
  renderPidSchematicSvg,
  validateHardwarePinout,
} from 'tridi-physics';
import { appHeaderHTML, mountAppHeader } from '../header.js';
import { lang, onLang } from '../i18n.js';
import { A, T, t, title } from './strings/assembler.js';

export { title };

const LAB4_DEFAULT_INO = `// Luigi Lab IV — Original Sketch (with blocking pulseIn & delay to audit)
#include <Servo.h>
const int ENA = 5;
const int IN1 = 7;
const int IN2 = 8;
const int ENB = 6;
const int IN3 = 12;
const int IN4 = 13;
const int TRIG = 4;
const int ECHO = 3;
const int SERVO_PIN = 9;
Servo neck;

void setup() {
  neck.attach(SERVO_PIN);
}
void loop() {
  long dur = pulseIn(ECHO, HIGH, 25000);
  delay(80);
}`;

const CALIBRATED_LAB4_C99 = `// ============================================================================
// TRIDI SIM-TO-REAL — DETERMINISTIC 50 HZ C99 FIRMWARE (ATmega328P / Arduino UNO)
// Target: Luigi Lab IV Autonomous Rover | Policy: luigi-lab4.onnx (obs_dim=18, nu=3)
// Hardware Audit: Timer1 (<Servo.h> on D9) isolated from ENA/ENB PWM on Timer0 (D5/D6)
// ============================================================================
#include <Arduino.h>
#include <Servo.h>

#define PIN_ENA       5   // Timer0 PWM — Left Gearbox
#define PIN_IN1       7
#define PIN_IN2       8
#define PIN_ENB       6   // Timer0 PWM — Right Gearbox
#define PIN_IN3       12
#define PIN_IN4       13
#define PIN_TRIG      4   // HC-SR04 Ultrasonic Trigger
#define PIN_ECHO      3   // INT1 Hardware Interrupt (zero blocking pulseIn)
#define PIN_SERVO     9   // SG90 Neck Turret (-65 deg to +65 deg)

// Empirically calibrated Sim-to-Real constants (docs/caso-luigi-sim2real.md)
#define PWM_MIN_MOVE  115 // Overcomes TT 1:48 gearbox static friction on carpet
#define PWM_MAX_SAFE  235 // Prevents 2S Li-Ion voltage sag on L298N
#define CONTROL_DT_US 20000UL // 50 Hz deterministic control loop (20 ms)

static volatile uint32_t echoRiseUs = 0;
static volatile uint16_t latestDistCm = 120;
static Servo neckServo;
static uint32_t lastStepUs = 0;

void onEchoEdge() {
  if (digitalRead(PIN_ECHO) == HIGH) {
    echoRiseUs = micros();
  } else if (echoRiseUs > 0) {
    uint32_t dt = micros() - echoRiseUs;
    if (dt < 24000UL) latestDistCm = (uint16_t)(dt / 58UL);
  }
}

static inline int16_t applyDeadzonePwm(float normCmd) {
  if (normCmd > -0.08f && normCmd < 0.08f) return 0;
  float mag = normCmd < 0.0f ? -normCmd : normCmd;
  if (mag > 1.0f) mag = 1.0f;
  int16_t pwm = (int16_t)(PWM_MIN_MOVE + mag * (PWM_MAX_SAFE - PWM_MIN_MOVE));
  return normCmd >= 0.0f ? pwm : -pwm;
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_ENA, OUTPUT); pinMode(PIN_ENB, OUTPUT);
  pinMode(PIN_IN1, OUTPUT); pinMode(PIN_IN2, OUTPUT);
  pinMode(PIN_IN3, OUTPUT); pinMode(PIN_IN4, OUTPUT);
  pinMode(PIN_TRIG, OUTPUT); pinMode(PIN_ECHO, INPUT);
  attachInterrupt(digitalPinToInterrupt(PIN_ECHO), onEchoEdge, CHANGE);
  neckServo.attach(PIN_SERVO);
  neckServo.write(90);
}

void loop() {
  uint32_t now = micros();
  if (now - lastStepUs < CONTROL_DT_US) return;
  lastStepUs = now;

  // Trigger non-blocking ultrasonic pulse
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  // Deterministic 50 Hz obstacle-avoidance & neck-sweep control law
  uint16_t d = latestDistCm;
  int16_t leftPwm = applyDeadzonePwm(d > 32 ? 0.72f : -0.65f);
  int16_t rightPwm = applyDeadzonePwm(d > 32 ? 0.72f : 0.65f);

  digitalWrite(PIN_IN1, leftPwm >= 0 ? HIGH : LOW);
  digitalWrite(PIN_IN2, leftPwm < 0 ? HIGH : LOW);
  analogWrite(PIN_ENA, leftPwm >= 0 ? leftPwm : -leftPwm);

  digitalWrite(PIN_IN3, rightPwm >= 0 ? HIGH : LOW);
  digitalWrite(PIN_IN4, rightPwm < 0 ? HIGH : LOW);
  analogWrite(PIN_ENB, rightPwm >= 0 ? rightPwm : -rightPwm);
}
`;

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function downloadText(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function mount(root) {
  let mode = 'pid'; // 'pid' | 'cad'
  let pidStep = 'pick'; // 'pick' | 'result'
  let techOpen = false;
  let sampleId = '01_batch_mixer.dxf';
  let dxfText = PID_SAMPLE_DXFS[sampleId].dxf;
  let processGoal = '';
  let uploadErrorKey = null;
  let uploadStageKey = null;
  let activeAiSpec = null;
  let activeAiUsage = null;
  let previewImageUrl = null;
  let lastPdfFile = null;
  let pdfPageCount = 1;
  let pdfPageNumber = 1;
  let selectedTag = null;
  let pidTab = 'p1io'; // 'p1io' | 'p3' | 'diagram' | 'p2'
  let plcDialect = 'scl'; // 'scl' | 'l5k'
  let cadPreset = 'luigi_lab4';
  let cadTab = 'audit'; // 'audit' | 'ino' | 'xml'
  let inoText = LAB4_DEFAULT_INO;
  let stlNames = ['1_chasis_robot.stl', '5_rin_x2.stl', '6_llanta_x2_TPU.stl', '7_cabeza_sensor_servo.stl'];
  let pinOverride = null;
  let currentDag = null;
  let currentSteps = [];
  let copyTimer = null;
  const reducedMotionQuery = typeof window !== 'undefined' ? window.matchMedia?.('(prefers-reduced-motion: reduce)') : null;
  const clearPreviewUrl = () => {
    if (previewImageUrl?.startsWith?.('blob:')) {
      URL.revokeObjectURL(previewImageUrl);
    }
    previewImageUrl = null;
  };
  const lazyRenderPdfToImage = async (bytes, opts) => {
    const { renderPdfPageToImage } = await import('../pdf-render.js');
    return renderPdfPageToImage(bytes, opts);
  };

  // Interactive P&ID process simulation state (derived dynamically from the uploaded plant's sequence)
  const simState = {
    stepIdx: 0,
    faultSensor: false,
    faultDrive: false,
  };

  const modeToggleHTML = `
    <div class="asm-modes" role="tablist" ${A({ 'aria-label': 'modeAria' })}>
      <button type="button" class="asm-mode-btn" data-mode="pid" role="tab" aria-selected="true">${T('modePid')}</button>
      <button type="button" class="asm-mode-btn" data-mode="cad" role="tab" aria-selected="false">${T('modeCad')}</button>
    </div>`;

  root.innerHTML = `
    <div class="asm-page">
      ${appHeaderHTML({ current: 'assembler' })}
      <div class="screen-toolbar">
        <div class="screen-toolbar-copy">
          <h1>Assembler</h1>
          <p class="screen-toolbar-sub">${T('title')}</p>
        </div>
        <div class="screen-toolbar-actions">
          ${modeToggleHTML}
        </div>
      </div>
      <div class="asm-shell">
        <div class="asm-grid" id="asm-content"></div>
      </div>
    </div>`;

  const contentEl = root.querySelector('#asm-content');
  const cleanups = [mountAppHeader(root)];
  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    cleanups.push(() => target.removeEventListener(type, fn, opts));
  };

  for (const btn of root.querySelectorAll('.asm-mode-btn')) {
    on(btn, 'click', () => {
      mode = btn.dataset.mode;
      for (const b of root.querySelectorAll('.asm-mode-btn')) {
        b.setAttribute('aria-selected', String(b === btn));
      }
      render();
    });
  }

  function renderCadSchematicSvg(activePinout, pinAudit) {
    const enaPin = activePinout.ENA ?? 5;
    const enbPin = activePinout.ENB ?? 6;
    const servoPin = activePinout.SERVO ?? 9;
    const echoPin = activePinout.ECHO ?? 3;
    const isConflict = !pinAudit.valid;
    const pwmColor = isConflict ? '#ff6b6b' : '#d4d8df';
    return `
      <svg class="asm-pid-svg" viewBox="0 0 620 220" role="img" ${A({ 'aria-label': 'svgCadAria' })}>
        <!-- Wires from MCU to peripherals -->
        <path d="M210 64 H135" stroke="${pwmColor}" stroke-width="2" fill="none" stroke-dasharray="${isConflict ? '4 3' : 'none'}"/>
        <path d="M210 106 H135" stroke="#8e96a4" stroke-width="1.8" fill="none"/>
        <path d="M210 154 H135" stroke="#8e96a4" stroke-width="1.8" fill="none"/>
        <path d="M410 74 H485" stroke="#d4d8df" stroke-width="1.8" fill="none"/>
        <path d="M410 142 H485" stroke="#8e96a4" stroke-width="1.8" fill="none"/>

        <!-- Left: L298N Dual H-Bridge + TT Gearmotors -->
        <rect x="20" y="34" width="115" height="92" rx="8" fill="#121417" stroke="${isConflict ? '#ff6b6b' : '#4a515d'}" stroke-width="1.5"/>
        <text x="77" y="56" text-anchor="middle" font-family="Geist Mono, monospace" font-size="11" font-weight="700" fill="#f5f5f5">L298N DRIVER</text>
        <text x="77" y="74" text-anchor="middle" font-family="Geist Mono, monospace" font-size="9.5" fill="${isConflict ? '#ff6b6b' : '#d4d8df'}">ENA: D${esc(enaPin)} ${isConflict ? '⚠ TIMER1' : '(Timer0)'}</text>
        <text x="77" y="90" text-anchor="middle" font-family="Geist Mono, monospace" font-size="9.5" fill="#bdbdbd">ENB: D${esc(enbPin)} (Timer0)</text>
        <text x="77" y="108" text-anchor="middle" font-family="Geist Mono, monospace" font-size="9" fill="#7a7a7a">Deadzone PWM ≥ 115</text>

        <!-- Left bottom: Dual TT Gearmotors -->
        <rect x="20" y="138" width="115" height="52" rx="8" fill="#121417" stroke="#383e49" stroke-width="1.4"/>
        <text x="77" y="160" text-anchor="middle" font-family="Geist Mono, monospace" font-size="10.5" font-weight="700" fill="#f5f5f5">2× TT 1:48 MOTORS</text>
        <text x="77" y="176" text-anchor="middle" font-family="Geist Mono, monospace" font-size="9" fill="#a3a3a3">TPU Tires · 200 RPM</text>

        <!-- Center: Arduino UNO (ATmega328P) -->
        <rect x="210" y="28" width="200" height="164" rx="10" fill="#14181f" stroke="${isConflict ? '#ff6b6b' : '#636b78'}" stroke-width="1.8"/>
        <text x="310" y="54" text-anchor="middle" font-family="Geist Mono, monospace" font-size="12.5" font-weight="700" fill="#f5f5f5">ARDUINO UNO (ATmega328P)</text>
        <text x="310" y="72" text-anchor="middle" font-family="Geist Mono, monospace" font-size="10" fill="#bdbdbd">50 Hz Non-Blocking C99 Loop</text>
        <rect x="228" y="86" width="164" height="42" rx="6" fill="#0d0f13" stroke="#262a33"/>
        <text x="310" y="104" text-anchor="middle" font-family="Geist Mono, monospace" font-size="9.5" fill="#f5f5f5">Timer0 (D5/D6): 976 Hz PWM</text>
        <text x="310" y="120" text-anchor="middle" font-family="Geist Mono, monospace" font-size="9.5" fill="${isConflict ? '#ff6b6b' : '#a3a3a3'}">Timer1 (D9/D10): &lt;Servo.h&gt; Lock</text>
        <rect x="228" y="138" width="164" height="38" rx="6" fill="#0d0f13" stroke="#262a33"/>
        <text x="310" y="155" text-anchor="middle" font-family="Geist Mono, monospace" font-size="9.5" fill="#d4d8df">ISR INT1 (D${esc(echoPin)}): 0 ms block</text>
        <text x="310" y="169" text-anchor="middle" font-family="Geist Mono, monospace" font-size="9" fill="#7a7a7a">SRAM: 461 B / 2048 B (22.5%)</text>

        <!-- Right top: SG90 Neck Radar Servo -->
        <rect x="485" y="42" width="115" height="64" rx="8" fill="#121417" stroke="#4a515d" stroke-width="1.5"/>
        <text x="542" y="65" text-anchor="middle" font-family="Geist Mono, monospace" font-size="10.5" font-weight="700" fill="#f5f5f5">SG90 SERVO</text>
        <text x="542" y="81" text-anchor="middle" font-family="Geist Mono, monospace" font-size="9.5" fill="#d4d8df">PWM: D${esc(servoPin)} (±65°)</text>
        <text x="542" y="95" text-anchor="middle" font-family="Geist Mono, monospace" font-size="8.5" fill="#7a7a7a">Active Neck Sweep</text>

        <!-- Right bottom: HC-SR04 + APDS-9960 -->
        <rect x="485" y="118" width="115" height="68" rx="8" fill="#121417" stroke="#383e49" stroke-width="1.5"/>
        <text x="542" y="140" text-anchor="middle" font-family="Geist Mono, monospace" font-size="10.5" font-weight="700" fill="#f5f5f5">HC-SR04 + I2C</text>
        <text x="542" y="156" text-anchor="middle" font-family="Geist Mono, monospace" font-size="9.5" fill="#bdbdbd">TRIG D4 · ECHO D${esc(echoPin)}</text>
        <text x="542" y="172" text-anchor="middle" font-family="Geist Mono, monospace" font-size="8.5" fill="#7a7a7a">APDS-9960 (0x9E)</text>
      </svg>`;
  }

  function getPlantSequenceSteps(dag, docs, aiSpec) {
    if (Array.isArray(aiSpec?.plcSequenceSteps) && aiSpec.plcSequenceSteps.length > 0) {
      return aiSpec.plcSequenceSteps.map((st) => ({
        code: `${String(st.stepNumber).padStart(2, '0')} · ${st.label}`,
        activeTags: [...(st.openValves || []), ...(st.startMotors || [])],
      }));
    }
    const valves = dag.nodes.filter((n) => n.prefix === 'FV').map((n) => n.tag);
    const drives = dag.nodes.filter((n) => n.prefix === 'M' || n.prefix === 'P' || n.prefix === 'SC').map((n) => n.tag);
    const downstream = dag.nodes.filter((n) => n.prefix === 'CV' || n.prefix === 'PK').map((n) => n.tag);
    const vessels = dag.nodes.filter((n) => n.prefix === 'TK' || n.prefix === 'SL').map((n) => n.tag);
    const narrative = docs?.controlNarrative || [];
    const fallbackTags = [
      [],
      [...valves.slice(0, Math.max(1, valves.length - 1)), ...vessels.slice(0, 2)],
      [...drives, ...vessels.slice(0, 1)],
      [...(valves.length > 1 ? [valves.at(-1)] : []), ...downstream],
    ];
    if (narrative.length) {
      return narrative.map((s, idx) => ({
        code: s.step,
        activeTags: fallbackTags[idx % fallbackTags.length] || [],
      }));
    }
    return [
      { code: '00 · IDLE', activeTags: [] },
      { code: '10 · FEED', activeTags: fallbackTags[1] },
      { code: '20 · PROCESS', activeTags: fallbackTags[2] },
      { code: '30 · DISCHARGE', activeTags: fallbackTags[3] },
    ];
  }

  function getPlantFaultTargets(dag) {
    const sensorNode =
      dag.nodes.find((n) => n.prefix === 'LSH') ??
      dag.nodes.find((n) => n.category === 'safety_switch') ??
      dag.nodes.find((n) => n.category === 'sensor') ??
      null;
    const driveNode =
      dag.nodes.find((n) => n.prefix === 'M' || n.prefix === 'P' || n.prefix === 'SC' || n.prefix === 'CV') ??
      dag.nodes.find((n) => n.category === 'actuator') ??
      null;
    return { sensorNode, driveNode };
  }

  function getLiveDiagramSignals(dag, steps) {
    const { sensorNode, driveNode } = getPlantFaultTargets(dag);
    const faultTags = [];
    if (simState.faultSensor && sensorNode) faultTags.push(sensorNode.tag);
    if (simState.faultDrive && driveNode) faultTags.push(driveNode.tag);
    const isFault = faultTags.length > 0;
    const safeIdx = steps.length ? simState.stepIdx % steps.length : 0;
    const step = steps[safeIdx] ?? { code: '00 · IDLE', activeTags: [] };
    const stateText = simState.faultSensor
      ? `HOLD · TRIP (${sensorNode?.tag ?? 'LSH'})`
      : simState.faultDrive
        ? `HOLD · FAULT (${driveNode?.tag ?? 'DRIVE'})`
        : step.code;
    return {
      isFault,
      faultTags,
      activeTags: isFault ? [] : step.activeTags,
      stateText,
      sensorNode,
      driveNode,
    };
  }

  function renderTagInspector(dag, layout, tag) {
    if (!tag) {
      return `
        <div class="asm-inspector" id="asm-tag-inspector">
          <p class="asm-inspector-hint">${T('diagramHint')}</p>
        </div>`;
    }
    const node = layout.nodes.find((n) => n.tag === tag);
    if (!node) return '';
    const ios = dag.ioSchedule.filter((io) => io.isaTag === tag);
    const chipList = (tags) =>
      tags.length
        ? tags.map((tg) => `<button type="button" class="asm-tag-btn" data-select-tag="${esc(tg)}" aria-pressed="false">${esc(tg)}</button>`).join('')
        : `<span>${T('inspectorNone')}</span>`;
    return `
      <div class="asm-inspector is-active" id="asm-tag-inspector">
        <div class="asm-inspector-head">
          <div class="asm-inspector-title">
            <span class="asm-badge ok">${esc(node.tag)}</span>
            <b>${esc(node.isaName)}</b>
            <span class="asm-badge">${esc(node.plcBlock)}</span>
          </div>
          <button type="button" class="asm-pill" id="asm-clear-tag">${T('inspectorClear')}</button>
        </div>
        <div class="asm-inspector-meta">
          <span>${esc(node.description)}</span>
          <span><b>Fail-Safe:</b> ${esc(node.failSafe)}</span>
        </div>
        <div class="asm-inspector-links">
          <span>${T('inspectorUpstream')}:</span> ${chipList(node.upstream)}
          <span>· ${T('inspectorDownstream')}:</span> ${chipList(node.downstream)}
        </div>
        ${
          ios.length
            ? `<div class="asm-inspector-links">
                <span>${T('inspectorIoLabel')}:</span>
                ${ios.map((io) => `<span class="asm-badge">${esc(io.ioType)} ${esc(io.address)} · ${esc(io.plcTag)}</span>`).join('')}
              </div>`
            : ''
        }
      </div>`;
  }

  function applySvgLiveState(svgEl, { activeTags = [], faultTags = [] } = {}) {
    if (!svgEl) return;
    const activeSet = new Set(activeTags);
    const faultSet = new Set(faultTags);
    const uid = svgEl.classList.contains('asm-pid-svg--compact') ? 'c' : 'f';
    for (const nodeEl of svgEl.querySelectorAll('.asm-svg-node')) {
      const tg = nodeEl.dataset.tag;
      nodeEl.classList.toggle('is-active', activeSet.has(tg));
      nodeEl.classList.toggle('is-fault', faultSet.has(tg));
    }
    for (const edgeEl of svgEl.querySelectorAll('.asm-svg-edge')) {
      const from = edgeEl.dataset.from;
      const to = edgeEl.dataset.to;
      const isSelected = edgeEl.classList.contains('is-selected');
      const isFault = faultSet.has(from) || faultSet.has(to);
      const isActive = activeSet.has(from) || activeSet.has(to);
      edgeEl.classList.toggle('is-fault', isFault);
      edgeEl.classList.toggle('is-active', !isFault && isActive);
      const marker = isFault
        ? `url(#pid-arrow-fault-${uid})`
        : isSelected || isActive
          ? `url(#pid-arrow-signal-${uid})`
          : `url(#pid-arrow-${uid})`;
      edgeEl.setAttribute('marker-end', marker);
    }
  }

  function renderPdfPageButtons(pageCount, activePage, disabled = false) {
    if (pageCount <= 1) return '';
    const maxShown = Math.min(pageCount, 8);
    const btns = [];
    for (let p = 1; p <= maxShown; p++) {
      btns.push(
        `<button type="button" class="asm-page-btn" data-pdf-page="${p}" ${p === activePage ? 'aria-current="page"' : ''} ${disabled ? 'disabled' : ''}>${p}</button>`,
      );
    }
    return `
      <div class="asm-pdf-pages">
        <span class="asm-pdf-pages-label">${T('pdfPageLabel')} (${activePage}/${pageCount})</span>
        ${btns.join('')}
      </div>`;
  }

  const analyzeUploadedFile = async (file, { pdfPage = 1, forceVision = false } = {}) => {
    if (!file || uploadStageKey) return;
    uploadErrorKey = null;
    const isPdf = /\.pdf$/i.test(file.name);
    const isImage = /\.(png|jpe?g|webp)$/i.test(file.name);
    if (isPdf) lastPdfFile = file;
    else {
      lastPdfFile = null;
      pdfPageCount = 1;
      pdfPageNumber = 1;
    }
    const stageMap = {
      vision_prepare: 'stagePreparing',
      parse_local: 'stagePreparing',
      pdf_rasterize: 'stagePdfRasterize',
      vision_analyze: 'stageVision',
      text_enrich: 'stageEnrich',
    };
    uploadStageKey = forceVision ? 'stagePdfRasterize' : 'stagePreparing';
    render();
    try {
      const extracted = await extractBlueprintFromUpload(file, {
        lang: lang(),
        processGoal,
        pdfPage,
        forceVision,
        renderPdfToImage: lazyRenderPdfToImage,
        onStage: (stage) => {
          const nextKey = stageMap[stage] ?? 'stagePreparing';
          if (uploadStageKey !== nextKey) {
            uploadStageKey = nextKey;
            render();
          }
        },
      });
      uploadStageKey = null;
      if (isPdf && extracted.pageCount) {
        pdfPageCount = extracted.pageCount;
        pdfPageNumber = extracted.pageNumber || pdfPage;
      }
      if (!extracted.ok) {
        if (extracted.errorCode === 'api_not_configured') {
          uploadErrorKey = 'dropErrApiNotConfigured';
        } else if (extracted.errorCode === 'empty_pdf') {
          uploadErrorKey = 'dropErrEmptyPdf';
        } else if (extracted.errorCode === 'empty_dxf') {
          uploadErrorKey = 'dropErrEmptyDxf';
        } else {
          uploadErrorKey = isImage || isPdf ? 'dropErrVisionFailed' : 'dropErrEmptyDxf';
        }
        render();
        return;
      }
      clearPreviewUrl();
      sampleId = file.name;
      dxfText = extracted.dxfText;
      activeAiSpec = extracted.aiSpec || null;
      activeAiUsage = extracted.usage || null;
      previewImageUrl = extracted.previewImageUrl || null;
      selectedTag = null;
      simState.stepIdx = 0;
      simState.faultSensor = false;
      simState.faultDrive = false;
      if (!processGoal.trim()) {
        processGoal =
          extracted.processGoal || `Automated ISA-5.1 / ISA-88 engineering specification for ${file.name}`;
      }
      pidStep = 'result';
      render();
    } catch {
      uploadStageKey = null;
      uploadErrorKey = isImage || isPdf ? 'dropErrVisionFailed' : 'dropErrEmptyDxf';
      render();
    }
  };

  function render() {
    contentEl.className = mode === 'pid' ? 'asm-simple-wrap' : 'asm-grid';
    if (mode === 'pid') {
      if (pidStep === 'pick') {
        contentEl.innerHTML = `
          <section class="asm-drop-card">
            <p class="asm-drop-kicker">${T('dropKicker')}</p>
            <h2>${T('dropTitle')}</h2>
            <p class="asm-drop-lead">${T('dropLead')}</p>

            <label class="asm-dropzone" id="asm-dropzone" ${uploadStageKey ? 'aria-busy="true"' : ''}>
              <input type="file" id="asm-dxf-file" class="asm-sr-input" accept=".dxf,.pdf,.png,.jpg,.jpeg,.webp" ${uploadStageKey ? 'disabled' : ''} />
              <strong>${T('dropBoxTitle')}</strong>
              <span>${T('dropBoxSub')}</span>
            </label>
            ${uploadStageKey ? `<p class="asm-upload-status" role="status" aria-live="polite">${T(uploadStageKey)}</p>` : ''}
            ${uploadErrorKey ? `<p class="asm-upload-error" role="alert">${T(uploadErrorKey)}</p>` : ''}
            ${
              uploadErrorKey && lastPdfFile && pdfPageCount > 1
                ? `<div class="asm-row" style="justify-content:center">
                    <span class="asm-inspector-hint">${T('pdfTryAnotherPage')}</span>
                    ${renderPdfPageButtons(pdfPageCount, pdfPageNumber, Boolean(uploadStageKey))}
                  </div>`
                : ''
            }

            <div class="asm-field" style="text-align:left">
              <label class="asm-label" for="asm-goal-input">${T('pidGoalLabel')}</label>
              <input
                type="text"
                id="asm-goal-input"
                class="asm-input"
                value="${esc(processGoal)}"
                ${A({ placeholder: 'dropGoalPlaceholder' })}
              />
            </div>

            <div class="asm-samples-box">
              <p>${T('dropSamplesLabel')}</p>
              <div class="asm-samples-row">
                ${Object.values(PID_SAMPLE_DXFS)
                  .map(
                    (s) =>
                      `<button type="button" class="asm-pill" data-sample-pick="${esc(s.id)}">${esc(s.title[lang()] ?? s.title.es)}</button>`,
                  )
                  .join('')}
              </div>
            </div>
          </section>`;

        const goalIn = contentEl.querySelector('#asm-goal-input');
        if (goalIn) {
          goalIn.oninput = () => {
            processGoal = goalIn.value;
          };
        }

        const fileIn = contentEl.querySelector('#asm-dxf-file');
        if (fileIn) {
          fileIn.onchange = () => analyzeUploadedFile(fileIn.files?.[0]);
        }

        const dropzone = contentEl.querySelector('#asm-dropzone');
        if (dropzone) {
          dropzone.ondragover = (e) => {
            e.preventDefault();
            dropzone.classList.add('dragging');
          };
          dropzone.ondragleave = () => dropzone.classList.remove('dragging');
          dropzone.ondrop = (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragging');
            analyzeUploadedFile(e.dataTransfer?.files?.[0]);
          };
        }

        for (const pBtn of contentEl.querySelectorAll('[data-pdf-page]')) {
          pBtn.onclick = () => {
            const targetPage = Number(pBtn.dataset.pdfPage) || 1;
            if (lastPdfFile && targetPage !== pdfPageNumber) {
              analyzeUploadedFile(lastPdfFile, { pdfPage: targetPage, forceVision: true });
            }
          };
        }

        for (const sBtn of contentEl.querySelectorAll('[data-sample-pick]')) {
          sBtn.onclick = () => {
            clearPreviewUrl();
            lastPdfFile = null;
            pdfPageCount = 1;
            pdfPageNumber = 1;
            selectedTag = null;
            simState.stepIdx = 0;
            simState.faultSensor = false;
            simState.faultDrive = false;
            uploadErrorKey = null;
            uploadStageKey = null;
            activeAiSpec = null;
            activeAiUsage = null;
            sampleId = sBtn.dataset.samplePick;
            dxfText = PID_SAMPLE_DXFS[sampleId].dxf;
            processGoal = PID_SAMPLE_DXFS[sampleId].processGoal[lang()] ?? PID_SAMPLE_DXFS[sampleId].processGoal.es;
            pidStep = 'result';
            render();
          };
        }
        return;
      }

      // Step 2: Executive Engineering Document + Collapsible Technical Details
      const dag = parseDxfPid(dxfText, { fileName: sampleId, processGoal });
      currentDag = dag;
      const docs = generateIsaEngineeringDocs(dag, { lang: lang(), aiSpec: activeAiSpec });
      const pid3d = generatePidMujocoXml(dag);
      const plc = generatePlcFlatFile(dag, { aiSpec: activeAiSpec });
      const diagramLayout = buildPidDiagramLayout(dag);
      if (selectedTag && !dag.nodes.some((n) => n.tag === selectedTag)) {
        selectedTag = null;
      }
      currentSteps = getPlantSequenceSteps(dag, docs, activeAiSpec);
      const liveSig = getLiveDiagramSignals(dag, currentSteps);
      const usageSummary = activeAiUsage
        ? `${activeAiUsage.model} · 1 call · ${activeAiUsage.totalTokens.toLocaleString('en-US')} tok · $${Number(activeAiUsage.costUsd || 0).toFixed(4)} · ${(Number(activeAiUsage.latencyMs || 0) / 1000).toFixed(1)}s`
        : '';

      contentEl.innerHTML = `
        <div class="asm-doc-header">
          <div class="asm-row">
            <button type="button" class="asm-pill" id="asm-back-pick">${T('changeFileBtn')}</button>
            <span class="asm-badge ok">${esc(dag.fileName)}</span>
            <span class="asm-badge ok">${T('pidVerifiedBadge')} (${dag.nodes.length})</span>
            <span class="asm-badge">PLC I/O: ${dag.ioSummary.totalIoPoints} (DI:${dag.ioSummary.DI} · DO:${dag.ioSummary.DO} · AI:${dag.ioSummary.AI})</span>
            ${lastPdfFile && pdfPageCount > 1 ? renderPdfPageButtons(pdfPageCount, pdfPageNumber, Boolean(uploadStageKey)) : ''}
          </div>
          <div class="asm-row">
            <button type="button" class="asm-pill signal" id="asm-dl-fds">${T('dlFdsBtn')}</button>
            <button type="button" class="asm-pill" id="asm-dl-csv">${T('dlCsvBtn')}</button>
            <button type="button" class="asm-pill" id="asm-dl-dxf">${T('dlDxfBtn')}</button>
            <button type="button" class="asm-pill" id="asm-print-pdf">${T('printPdfBtn')}</button>
            <button type="button" class="asm-pill" id="asm-copy-fds">${T('copyBtn')}</button>
            <a class="asm-pill signal" href="#/simulations/factory_cell">${T('pidOpen3dSim')}</a>
          </div>
        </div>
        ${uploadStageKey ? `<p class="asm-upload-status" role="status" aria-live="polite">${T(uploadStageKey)}</p>` : ''}
        ${uploadErrorKey ? `<p class="asm-upload-error" role="alert">${T(uploadErrorKey)}</p>` : ''}

        <section class="asm-win">
          <div class="asm-bar"><span>${T('docReadyBar')}</span><b>${esc(dag.projectId)}</b></div>
          <div class="asm-body">
            ${
              previewImageUrl
                ? `<h3 class="asm-sec-title">${T('secSourcePreview')}</h3>
                   <img class="asm-preview-img" src="${esc(previewImageUrl)}" alt="${esc(t('secSourcePreview'))}: ${esc(dag.fileName)}" />`
                : ''
            }
            <h3 class="asm-sec-title">${T('secOverview')}</h3>
            <p class="asm-doc-objective">${esc(dag.processGoal)}</p>

            <h3 class="asm-sec-title">${T('secEquip')} (${dag.nodes.length})</h3>
            <div class="asm-table-wrap">
              <table class="asm-table">
                <thead>
                  <tr>
                    <th>${T('colTag')}</th>
                    <th>${T('colCat')}</th>
                    <th>${T('colFunc')}</th>
                    <th>${T('colBlock')}</th>
                    <th>${T('colFailSafe')}</th>
                    <th>${T('colDesc')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${dag.nodes
                    .map(
                      (n) =>
                        `<tr class="${selectedTag === n.tag ? 'is-selected' : ''}"><td><button type="button" class="asm-tag-btn" data-jump-tag="${esc(n.tag)}" aria-pressed="${selectedTag === n.tag}">${esc(n.tag)}</button></td><td>${esc(n.category)}</td><td>${esc(n.isaName)}</td><td><code>${esc(n.plcBlock)}</code></td><td>${esc(n.failSafe)}</td><td>${esc(n.description)}</td></tr>`,
                    )
                    .join('')}
                </tbody>
              </table>
            </div>

            <h3 class="asm-sec-title">${T('secNarrative')}</h3>
            <ul class="asm-narrative-list">
              ${docs.controlNarrative.map((s) => `<li><b>${esc(s.step)} — ${esc(s.title)}</b><p>${esc(s.logic)}</p></li>`).join('')}
            </ul>

            <h3 class="asm-sec-title">${T('secMatrix')}</h3>
            <div class="asm-table-wrap">
              <table class="asm-table">
                <thead><tr><th>ID</th><th>${T('colTag')}</th><th>${T('colCause')}</th><th>${T('colEffect')}</th><th>${T('colSev')}</th></tr></thead>
                <tbody>
                  ${docs.causeEffectMatrix
                    .map(
                      (ce) =>
                        `<tr><td><code>${esc(ce.id)}</code></td><td><code>${esc(ce.causeTag)}</code></td><td>${esc(ce.causeCondition)}</td><td>${esc(ce.effects)}</td><td><code>${esc(ce.severity)}</code></td></tr>`,
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <details class="asm-tech-drawer" id="asm-tech-details" ${techOpen ? 'open' : ''}>
          <summary>
            <span>${T('techDrawerTitle')}</span>
            <span class="asm-chevron" aria-hidden="true">▾</span>
          </summary>
          ${
            activeAiUsage
              ? `<div class="asm-usage-bar"><span>${T('aiTelemetryBadge')}</span><b>${esc(usageSummary)}</b></div>`
              : ''
          }
          <div class="asm-tabs" role="tablist" ${A({ 'aria-label': 'techTabsAria' })}>
            <button type="button" class="asm-tab" role="tab" data-ptab="p1io" aria-selected="${pidTab === 'p1io'}">${T('tabP1Io')} (${dag.ioSummary.totalIoPoints})</button>
            <button type="button" class="asm-tab" role="tab" data-ptab="p3" aria-selected="${pidTab === 'p3'}">${T('tabP3')}</button>
            <button type="button" class="asm-tab" role="tab" data-ptab="diagram" aria-selected="${pidTab === 'diagram'}">${T('tabDiagram')}</button>
            <button type="button" class="asm-tab" role="tab" data-ptab="p2" aria-selected="${pidTab === 'p2'}">${T('tabP2')}</button>
          </div>
          <div class="asm-body">
            ${
              pidTab === 'p1io'
                ? `
              <div class="asm-pid-stage" id="asm-io-stage">
                <div id="asm-svg-holder">${renderPidSchematicSvg(dag, { selectedTag, ariaLabel: t('svgPidAria'), compact: true })}</div>
                ${renderTagInspector(dag, diagramLayout, selectedTag)}
              </div>
              <div class="asm-row" style="justify-content:space-between">
                <h3 class="asm-sec-title">${T('secIo')}</h3>
                <button type="button" class="asm-pill signal" id="asm-dl-csv-inner">${T('dlCsvBtn')}</button>
              </div>
              <div class="asm-table-wrap">
                <table class="asm-table">
                  <thead><tr><th>${T('colPlcTag')}</th><th>${T('colTag')}</th><th>${T('colIoType')}</th><th>${T('colAddr')}</th><th>${T('colSignal')}</th><th>${T('colBlock')}</th></tr></thead>
                  <tbody>
                    ${dag.ioSchedule
                      .map(
                        (io) =>
                          `<tr class="${selectedTag === io.isaTag ? 'is-selected' : ''}" data-io-tag="${esc(io.isaTag)}"><td><code>${esc(io.plcTag)}</code></td><td><button type="button" class="asm-tag-btn" data-select-tag="${esc(io.isaTag)}" aria-pressed="${selectedTag === io.isaTag}">${esc(io.isaTag)}</button></td><td><b>${esc(io.ioType)}</b></td><td><code>${esc(io.address)}</code></td><td>${esc(io.signal)}</td><td><code>${esc(io.plcBlock)}</code></td></tr>`,
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>`
                : pidTab === 'p3'
                  ? `
              <div class="asm-row" style="justify-content:space-between">
                <div class="asm-row" role="tablist" ${A({ 'aria-label': 'plcDialectAria' })}>
                  <button type="button" class="asm-tab" role="tab" data-dialect="scl" aria-selected="${plcDialect === 'scl'}">${T('plcSclTab')}</button>
                  <button type="button" class="asm-tab" role="tab" data-dialect="l5k" aria-selected="${plcDialect === 'l5k'}">${T('plcL5kTab')}</button>
                </div>
                <div class="asm-row">
                  <button type="button" class="asm-pill signal" id="asm-dl-scl">${T('dlSclBtn')}</button>
                  <button type="button" class="asm-pill" id="asm-dl-l5k">${T('dlL5kBtn')}</button>
                </div>
              </div>
              <pre class="asm-code"><code>${esc(plcDialect === 'scl' ? plc.scl : plc.l5k)}</code></pre>`
                  : pidTab === 'diagram'
                    ? `
              <div class="asm-pid-stage">
                <div class="asm-pid-hud">
                  <div class="asm-hud-card">
                    <span>${T('pidStepLabel')}</span>
                    <b id="asm-hud-state" class="${liveSig.isFault ? 'trip' : 'ok'}">${esc(liveSig.stateText)}</b>
                  </div>
                  <div class="asm-hud-card">
                    <span>${T('hudActiveLabel')}</span>
                    <b id="asm-hud-active">${liveSig.activeTags.length} / ${dag.nodes.length}</b>
                  </div>
                  <div class="asm-hud-card">
                    <span>${T('hudTopologyLabel')}</span>
                    <b id="asm-hud-topo">${dag.nodes.length} tags · ${dag.edges.length} lines</b>
                  </div>
                </div>
                <div id="asm-svg-holder">${renderPidSchematicSvg(dag, {
                  selectedTag,
                  activeTags: liveSig.activeTags,
                  faultTags: liveSig.faultTags,
                  ariaLabel: t('svgPidAria'),
                  compact: false,
                })}</div>
                ${renderTagInspector(dag, diagramLayout, selectedTag)}
                <div class="asm-row">
                  <button type="button" class="asm-pill" id="asm-fault-lsh">${T('pidFaultSensorBtn')}${liveSig.sensorNode ? ` (${esc(liveSig.sensorNode.tag)})` : ''}</button>
                  <button type="button" class="asm-pill" id="asm-fault-motor">${T('pidFaultDriveBtn')}${liveSig.driveNode ? ` (${esc(liveSig.driveNode.tag)})` : ''}</button>
                  <button type="button" class="asm-pill" id="asm-fault-reset">${T('pidFaultReset')}</button>
                </div>
              </div>`
                    : `
              <div class="asm-row" style="justify-content:space-between">
                <button type="button" class="asm-pill signal" id="asm-dl-pid-xml">${T('dlXmlBtn')}</button>
                <a class="asm-pill signal" href="#/simulations/factory_cell">${T('pidOpen3dSim')}</a>
              </div>
              <pre class="asm-code"><code>${esc(pid3d.sceneXml)}</code></pre>`
            }
          </div>
        </details>`;

      const selectTag = (nextTag, { scrollToTable = false, scrollToSvg = false } = {}) => {
        selectedTag = selectedTag === nextTag ? null : nextTag;
        render();
        const scrollBehavior = reducedMotionQuery?.matches ? 'auto' : 'smooth';
        if (selectedTag && scrollToTable) {
          const matchingRow = contentEl.querySelector(`tr[data-io-tag="${CSS.escape(selectedTag)}"]`);
          matchingRow?.scrollIntoView({ block: 'nearest', behavior: scrollBehavior });
        } else if (selectedTag && scrollToSvg) {
          const holder = contentEl.querySelector('#asm-svg-holder');
          holder?.scrollIntoView({ block: 'nearest', behavior: scrollBehavior });
        }
      };

      const backBtn = contentEl.querySelector('#asm-back-pick');
      if (backBtn) {
        backBtn.onclick = () => {
          clearPreviewUrl();
          lastPdfFile = null;
          pdfPageCount = 1;
          pdfPageNumber = 1;
          selectedTag = null;
          uploadErrorKey = null;
          activeAiSpec = null;
          activeAiUsage = null;
          pidStep = 'pick';
          render();
        };
      }
      for (const pBtn of contentEl.querySelectorAll('[data-pdf-page]')) {
        pBtn.onclick = () => {
          const targetPage = Number(pBtn.dataset.pdfPage) || 1;
          if (lastPdfFile && targetPage !== pdfPageNumber && !uploadStageKey) {
            analyzeUploadedFile(lastPdfFile, { pdfPage: targetPage, forceVision: true });
          }
        };
      }
      const detailsEl = contentEl.querySelector('#asm-tech-details');
      if (detailsEl) {
        detailsEl.ontoggle = () => {
          techOpen = detailsEl.open;
        };
      }
      for (const tabBtn of contentEl.querySelectorAll('[data-ptab]')) {
        tabBtn.onclick = () => {
          pidTab = tabBtn.dataset.ptab;
          techOpen = true;
          render();
        };
      }
      for (const dBtn of contentEl.querySelectorAll('[data-dialect]')) {
        dBtn.onclick = () => {
          plcDialect = dBtn.dataset.dialect;
          techOpen = true;
          render();
        };
      }
      for (const jBtn of contentEl.querySelectorAll('[data-jump-tag]')) {
        jBtn.onclick = () => {
          const tg = jBtn.dataset.jumpTag;
          selectedTag = tg;
          techOpen = true;
          if (pidTab !== 'p1io' && pidTab !== 'diagram') pidTab = 'p1io';
          render();
          const holder = contentEl.querySelector('#asm-svg-holder');
          holder?.scrollIntoView({
            block: 'center',
            behavior: reducedMotionQuery?.matches ? 'auto' : 'smooth',
          });
        };
      }
      for (const tBtn of contentEl.querySelectorAll('[data-select-tag]')) {
        tBtn.onclick = () => {
          const tg = tBtn.dataset.selectTag;
          selectTag(tg, { scrollToSvg: pidTab === 'p1io' });
        };
      }
      for (const svgNode of contentEl.querySelectorAll('.asm-svg-node[data-tag]')) {
        svgNode.onclick = () => selectTag(svgNode.dataset.tag, { scrollToTable: pidTab === 'p1io' });
        svgNode.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectTag(svgNode.dataset.tag, { scrollToTable: pidTab === 'p1io' });
          }
        };
      }
      const clearTagBtn = contentEl.querySelector('#asm-clear-tag');
      if (clearTagBtn) {
        clearTagBtn.onclick = () => {
          selectedTag = null;
          render();
        };
      }
      const dlFds = contentEl.querySelector('#asm-dl-fds');
      if (dlFds) dlFds.onclick = () => downloadText(docs.fileName, docs.markdown, 'text/markdown;charset=utf-8');
      const dlCsv = contentEl.querySelector('#asm-dl-csv');
      if (dlCsv) dlCsv.onclick = () => downloadText(docs.ioCsvFileName, docs.ioCsv, 'text/csv;charset=utf-8');
      const dlDxf = contentEl.querySelector('#asm-dl-dxf');
      if (dlDxf) {
        const outDxfName = sampleId.endsWith('.dxf') ? sampleId : `${dag.projectId.toLowerCase()}.dxf`;
        dlDxf.onclick = () => downloadText(outDxfName, dxfText, 'application/dxf;charset=utf-8');
      }
      const dlCsvInner = contentEl.querySelector('#asm-dl-csv-inner');
      if (dlCsvInner) dlCsvInner.onclick = () => downloadText(docs.ioCsvFileName, docs.ioCsv, 'text/csv;charset=utf-8');
      const printBtn = contentEl.querySelector('#asm-print-pdf');
      if (printBtn) printBtn.onclick = () => window.print();
      const copyFds = contentEl.querySelector('#asm-copy-fds');
      if (copyFds) {
        copyFds.onclick = () => {
          navigator.clipboard?.writeText(docs.markdown);
          copyFds.innerHTML = T('copiedBtn');
          clearTimeout(copyTimer);
          copyTimer = setTimeout(() => {
            if (copyFds.isConnected) copyFds.innerHTML = T('copyBtn');
          }, 1800);
        };
      }
      const dlXml = contentEl.querySelector('#asm-dl-pid-xml');
      if (dlXml) dlXml.onclick = () => downloadText(`${pid3d.modelName}.xml`, pid3d.sceneXml, 'application/xml;charset=utf-8');
      const dlScl = contentEl.querySelector('#asm-dl-scl');
      if (dlScl) dlScl.onclick = () => downloadText(plc.sclFileName, plc.scl);
      const dlL5k = contentEl.querySelector('#asm-dl-l5k');
      if (dlL5k) dlL5k.onclick = () => downloadText(plc.l5kFileName, plc.l5k);

      const faultLshBtn = contentEl.querySelector('#asm-fault-lsh');
      if (faultLshBtn) {
        faultLshBtn.onclick = () => {
          simState.faultSensor = true;
          render();
        };
      }
      const faultMotBtn = contentEl.querySelector('#asm-fault-motor');
      if (faultMotBtn) {
        faultMotBtn.onclick = () => {
          simState.faultDrive = true;
          render();
        };
      }
      const faultResetBtn = contentEl.querySelector('#asm-fault-reset');
      if (faultResetBtn) {
        faultResetBtn.onclick = () => {
          simState.faultSensor = false;
          simState.faultDrive = false;
          render();
        };
      }
      return;
    }

    // Mode 2: CAD + Arduino (.stl + .ino)
    const presetObj = getPreset(cadPreset) ?? getPreset('luigi_lab4');
    const parsedIno = parseArduinoSketch(inoText);
    const activePinout = pinOverride ?? { ...presetObj.pinout, ...parsedIno.pinout };
    const pinAudit = validateHardwarePinout('arduino_uno', activePinout);
    const meshRoles = classifyStlMeshes(stlNames);
    const compiledMjcf = generateMujocoXml({ preset: cadPreset, modelName: `${cadPreset}_assembled` });
    const catalog = listComponents();

    contentEl.innerHTML = `
      <div class="asm-col">
        <section class="asm-win">
          <div class="asm-bar"><span>${T('cadSourceBar')}</span><b>${meshRoles.length} STL · ${pinAudit.valid ? 'PINOUT OK' : 'CONFLICT'}</b></div>
          <div class="asm-body">
            <div class="asm-row">
              <select id="asm-cad-preset" class="asm-select" style="flex:1" ${A({ 'aria-label': 'cadPresetAria' })}>
                <option value="luigi_lab4" ${cadPreset === 'luigi_lab4' ? 'selected' : ''}>${esc(t('cadPresetLab4'))}</option>
                <option value="luigi_lab3" ${cadPreset === 'luigi_lab3' ? 'selected' : ''}>${esc(t('cadPresetLab3'))}</option>
              </select>
              <label class="asm-pill" style="cursor:pointer">
                <span>${T('cadUploadStl')}</span>
                <input type="file" id="asm-stl-files" class="asm-sr-input" accept=".stl" multiple />
              </label>
              <label class="asm-pill" style="cursor:pointer">
                <span>${T('cadUploadIno')}</span>
                <input type="file" id="asm-ino-file" class="asm-sr-input" accept=".ino,.c,.cpp,.txt" />
              </label>
              <a class="asm-pill signal" href="#/simulations/luigi_lab4">${T('cadOpenRoverSim')}</a>
            </div>

            <div class="asm-pid-stage">
              <div class="asm-badges">
                <span class="asm-badge ${pinAudit.valid ? 'ok' : 'err'}">${
                  pinAudit.valid ? `${T('cadPinoutValid')} (${esc(pinAudit.interruptMode)})` : `✗ ${esc(pinAudit.errors.join(' | '))}`
                }</span>
                ${parsedIno.bottlenecks.map((b) => `<span class="asm-badge err">⚠ ${esc(b.type)}: ${esc(b.fix)}</span>`).join('')}
              </div>
              <div>${renderCadSchematicSvg(activePinout, pinAudit)}</div>
              <div class="asm-row">
                <button type="button" class="asm-pill" id="asm-test-conflict">${T('cadTestConflict')}</button>
                <button type="button" class="asm-pill signal" id="asm-fix-conflict">${T('cadFixConflict')}</button>
              </div>
            </div>

            <div class="asm-badges">
              ${meshRoles.map((m) => `<span class="asm-badge ok">${esc(m.file)} → ${esc(m.role)}</span>`).join('')}
            </div>
          </div>
        </section>
      </div>

      <div class="asm-col">
        <section class="asm-win">
          <div class="asm-bar"><span>${T('cadOutBar')}</span><b>${esc(cadPreset.toUpperCase())}</b></div>
          <div class="asm-tabs" role="tablist" ${A({ 'aria-label': 'cadTabsAria' })}>
            <button type="button" class="asm-tab" role="tab" data-ctab="audit" aria-selected="${cadTab === 'audit'}">${T('cadTabAudit')}</button>
            <button type="button" class="asm-tab" role="tab" data-ctab="ino" aria-selected="${cadTab === 'ino'}">${T('cadTabIno')}</button>
            <button type="button" class="asm-tab" role="tab" data-ctab="xml" aria-selected="${cadTab === 'xml'}">${T('cadTabXml')}</button>
          </div>
          <div class="asm-body">
            ${
              cadTab === 'audit'
                ? `
              <h3 class="asm-sec-title">${T('cadAuditBar')}</h3>
              <div class="asm-table-wrap">
                <table class="asm-table">
                  <thead><tr><th>${T('colCadSignal')}</th><th>${T('colCadPin')}</th><th>${T('colCadBus')}</th></tr></thead>
                  <tbody>
                    ${Object.entries(activePinout)
                      .map(
                        ([sig, pin]) =>
                          `<tr><td><code>${esc(sig)}</code></td><td><b>D${esc(pin)}</b></td><td>${
                            pin === 5 || pin === 6
                              ? 'Timer0 PWM (976 Hz)'
                              : pin === 9 || pin === 10
                                ? 'Timer1 (16-bit Servo / PWM)'
                                : pin === 2 || pin === 3
                                  ? 'Hardware External ISR (INT0/INT1)'
                                  : 'Digital GPIO'
                          }</td></tr>`,
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
              <h3 class="asm-sec-title">${T('cadCatalogBar')} (${catalog.length})</h3>
              <div class="asm-comp-grid">
                ${catalog
                  .slice(0, 6)
                  .map(
                    (c) => `
                  <div class="asm-comp-card">
                    <b>${esc(c.name)}</b>
                    <span><code>${esc(c.id)}</code> · ${esc(c.category)}</span>
                  </div>`,
                  )
                  .join('')}
              </div>`
                : `
              <div class="asm-row" style="justify-content:space-between">
                ${
                  cadTab === 'xml'
                    ? `<button type="button" class="asm-pill signal" id="asm-dl-cad-xml">${T('dlXmlBtn')}</button>`
                    : `<button type="button" class="asm-pill signal" id="asm-dl-cad-ino">${T('cadDlInoBtn')}</button>`
                }
                <a class="asm-pill signal" href="#/simulations/luigi_lab4">${T('cadOpenRoverSim')}</a>
              </div>
              <pre class="asm-code"><code>${esc(cadTab === 'xml' ? compiledMjcf.robotXml : CALIBRATED_LAB4_C99)}</code></pre>`
            }
          </div>
        </section>
      </div>`;

    const presetSel = contentEl.querySelector('#asm-cad-preset');
    if (presetSel) {
      presetSel.onchange = () => {
        cadPreset = presetSel.value;
        pinOverride = null;
        render();
      };
    }
    const stlIn = contentEl.querySelector('#asm-stl-files');
    if (stlIn) {
      stlIn.onchange = () => {
        if (stlIn.files?.length) {
          stlNames = [...stlIn.files].map((f) => f.name);
          render();
        }
      };
    }
    const inoIn = contentEl.querySelector('#asm-ino-file');
    if (inoIn) {
      inoIn.onchange = async () => {
        const file = inoIn.files?.[0];
        if (!file) return;
        inoText = await file.text();
        pinOverride = null;
        render();
      };
    }
    const conflictBtn = contentEl.querySelector('#asm-test-conflict');
    if (conflictBtn) {
      conflictBtn.onclick = () => {
        pinOverride = { ...activePinout, ENA: 10, SERVO: 9 };
        render();
      };
    }
    const fixBtn = contentEl.querySelector('#asm-fix-conflict');
    if (fixBtn) {
      fixBtn.onclick = () => {
        pinOverride = { ...activePinout, ENA: 5, ENB: 6, SERVO: 9, ECHO: 3 };
        render();
      };
    }
    for (const cBtn of contentEl.querySelectorAll('[data-ctab]')) {
      cBtn.onclick = () => {
        cadTab = cBtn.dataset.ctab;
        render();
      };
    }
    const dlCadXml = contentEl.querySelector('#asm-dl-cad-xml');
    if (dlCadXml) dlCadXml.onclick = () => downloadText(`${cadPreset}_mujoco.xml`, compiledMjcf.robotXml, 'application/xml;charset=utf-8');
    const dlCadIno = contentEl.querySelector('#asm-dl-cad-ino');
    if (dlCadIno) dlCadIno.onclick = () => downloadText(`${cadPreset}_50Hz_calibrated.ino`, CALIBRATED_LAB4_C99);
  }

  render();

  // Live P&ID sequence ticker (updates HUD + SVG classes in-place every 1800 ms without wiping keyboard focus)
  const ticker = setInterval(() => {
    if (
      document.hidden ||
      reducedMotionQuery?.matches ||
      mode !== 'pid' ||
      pidStep !== 'result' ||
      !techOpen ||
      pidTab !== 'diagram' ||
      simState.faultSensor ||
      simState.faultDrive ||
      !currentDag ||
      !currentSteps.length
    ) {
      return;
    }
    simState.stepIdx = (simState.stepIdx + 1) % currentSteps.length;
    const liveSig = getLiveDiagramSignals(currentDag, currentSteps);
    const sEl = contentEl.querySelector('#asm-hud-state');
    const aEl = contentEl.querySelector('#asm-hud-active');
    const svgEl = contentEl.querySelector('#asm-svg-holder svg');
    if (sEl) sEl.textContent = liveSig.stateText;
    if (aEl) aEl.textContent = `${liveSig.activeTags.length} / ${currentDag.nodes.length}`;
    if (svgEl) {
      applySvgLiveState(svgEl, { activeTags: liveSig.activeTags, faultTags: liveSig.faultTags });
    }
  }, 1800);

  const stopLang = onLang(() => {
    if (PID_SAMPLE_DXFS[sampleId]) {
      processGoal = PID_SAMPLE_DXFS[sampleId].processGoal[lang()] ?? PID_SAMPLE_DXFS[sampleId].processGoal.es;
    }
    render();
  });

  return () => {
    clearInterval(ticker);
    clearTimeout(copyTimer);
    clearPreviewUrl();
    lastPdfFile = null;
    stopLang();
    cleanups.forEach((fn) => fn());
  };
}
