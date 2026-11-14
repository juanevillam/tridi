// #/assembler copy in Spanish and English (src/i18n.js).
import { dict } from '../../i18n.js';

export const title = { es: 'Assembler (P&ID y CAD)', en: 'Assembler (P&ID & CAD)' };

export const { T, t, A } = dict({
  kicker: {
    es: '// TRIDI ASSEMBLER STUDIO · LA IA RAZONA Y EL CÓDIGO ENSAMBLA',
    en: '// TRIDI ASSEMBLER STUDIO · AI REASONS, CODE ASSEMBLES',
  },
  title: {
    es: 'De planos P&ID (.dxf) o piezas CAD (.stl + .ino) a gemelo físico, docs ISA-5.1 y código determinista',
    en: 'From P&ID blueprints (.dxf) or CAD parts (.stl + .ino) to physics twin, ISA-5.1 docs & deterministic code',
  },
  lede: {
    es: 'Arquitectura determinista sin cajas negras: parsea tus etiquetas ISA-5.1 o tu pinout de microcontrolador, verifica el 100 % de las fuentes sin alucinar componentes y genera la ingeniería completa lista para campo.',
    en: 'Deterministic architecture with zero black boxes: parses your ISA-5.1 tags or microcontroller pinout, verifies 100% of sources without hallucinating components, and generates field-ready engineering.',
  },
  backHome: { es: '← Inicio', en: '← Home' },
  goSims: { es: 'Simulaciones 3D', en: '3D Simulations' },
  goDelivery: { es: 'Entregas ONNX / PLC', en: 'ONNX / PLC Deliveries' },

  modeAria: { es: 'Canal de ensamblaje', en: 'Assembly channel' },
  modePid: {
    es: '01 · Planta Industrial P&ID (.dxf → Docs ISA-5.1 + Twin 3D + PLC)',
    en: '01 · Industrial Plant P&ID (.dxf → ISA-5.1 Docs + 3D Twin + PLC)',
  },
  modeCad: {
    es: '02 · Robot y Mecatrónica (.stl + .ino → Gemelo MuJoCo + Firmware C99)',
    en: '02 · Robot & Mechatronics (.stl + .ino → MuJoCo Twin + C99 Firmware)',
  },

  // Mode 1: P&ID (.dxf)
  pidSourceBar: { es: 'plano de entrada — p&id autocad (.dxf) · estándar isa-5.1', en: 'input blueprint — autocad p&id (.dxf) · isa-5.1 standard' },
  pidPickSample: { es: 'Plano P&ID precargado (o sube tu propio .dxf)', en: 'Preloaded P&ID blueprint (or upload your own .dxf)' },
  pidUploadBtn: { es: 'Subir archivo .dxf', en: 'Upload .dxf file' },
  pidGoalLabel: { es: 'Objetivo operativo del proceso (ISA-88)', en: 'Operational process objective (ISA-88)' },
  pidRawToggle: { es: 'Ver / editar entidades .dxf crudas', en: 'View / edit raw .dxf entities' },
  pidReparseBtn: { es: 'Re-analizar P&ID y regenerar ingeniería', en: 'Re-parse P&ID & regenerate engineering' },
  pidVerifiedBadge: { es: '✓ 100 % etiquetas verificadas contra el .dxf (0 alucinadas)', en: '✓ 100% tags verified against source .dxf (0 hallucinated)' },

  pidTwinBar: { es: 'prioridad 2 — gemelo interactivo del proceso y prueba de fallas', en: 'priority 2 — interactive process twin & fault stress-test' },
  pidStepLabel: { es: 'Estado ISA-88', en: 'ISA-88 State' },
  pidScaleLabel: { es: 'Báscula celdas de carga', en: 'Load-cell scale' },
  pidBatchCount: { es: 'Lotes completados', en: 'Completed batches' },
  pidFaultLsh: { es: 'Inyectar falla: Sobrellenado LSH (NC=0)', en: 'Inject fault: LSH Overfill Trip (NC=0)' },
  pidFaultMotor: { es: 'Inyectar falla: Relé térmico Motor (OL=0)', en: 'Inject fault: Motor Thermal Trip (OL=0)' },
  pidFaultReset: { es: 'Rearmar interlocks y continuar ciclo', en: 'Reset interlocks & resume cycle' },
  pidOpen3dSim: { es: 'Abrir Celda Industrial 3D en MuJoCo →', en: 'Open 3D Factory Cell in MuJoCo →' },

  pidOutBar: { es: 'entregables de ingeniería generados (orden de prioridad zaka / isa)', en: 'generated engineering deliverables (zaka / isa priority order)' },
  tabP1: { es: 'Prioridad 1 · Documentación ISA-5.1 (FDS)', en: 'Priority 1 · ISA-5.1 Engineering Docs (FDS)' },
  tabP2: { es: 'Prioridad 2 · Escena 3D MuJoCo (.xml)', en: 'Priority 2 · 3D MuJoCo Scene (.xml)' },
  tabP3: { es: 'Prioridad 3 · Bloques PLC (.scl / .L5K)', en: 'Priority 3 · PLC Function Blocks (.scl / .L5K)' },

  dlFdsBtn: { es: 'Descargar FDS ISA-5.1 (.md) ↓', en: 'Download ISA-5.1 FDS (.md) ↓' },
  dlXmlBtn: { es: 'Descargar MuJoCo MJCF (.xml) ↓', en: 'Download MuJoCo MJCF (.xml) ↓' },
  dlSclBtn: { es: 'Descargar Siemens TIA Portal (.scl) ↓', en: 'Download Siemens TIA Portal (.scl) ↓' },
  dlL5kBtn: { es: 'Descargar Rockwell Studio 5000 (.L5K) ↓', en: 'Download Rockwell Studio 5000 (.L5K) ↓' },
  copyBtn: { es: 'Copiar al portapapeles', en: 'Copy to clipboard' },
  copiedBtn: { es: '✓ Copiado', en: '✓ Copied' },

  secEquip: { es: '1. Cédula de Equipos e Instrumentación (ISA-5.1)', en: '1. Equipment & Instrument Schedule (ISA-5.1)' },
  secIo: { es: '2. Lista de Entradas y Salidas del PLC (I/O Schedule)', en: '2. PLC I/O Assignment Schedule' },
  secNarrative: { es: '3. Filosofía de Operación Paso a Paso (ISA-88)', en: '3. Step-by-Step Control Narrative (ISA-88)' },
  secMatrix: { es: '4. Matriz Causa-Efecto de Enclavamientos (Safety Interlocks)', en: '4. Cause & Effect Safety Interlock Matrix' },

  colTag: { es: 'Tag ISA', en: 'ISA Tag' },
  colCat: { es: 'Categoría', en: 'Category' },
  colFunc: { es: 'Función ISA-5.1', en: 'ISA-5.1 Function' },
  colBlock: { es: 'Bloque PLC', en: 'PLC Block' },
  colFailSafe: { es: 'Estado Fail-Safe', en: 'Fail-Safe State' },
  colPlcTag: { es: 'Tag Simbólico', en: 'Symbolic Tag' },
  colIoType: { es: 'Tipo', en: 'Type' },
  colAddr: { es: 'Dirección', en: 'Address' },
  colSignal: { es: 'Señal Eléctrica', en: 'Electrical Signal' },
  colCause: { es: 'Causa (Condición de Disparo)', en: 'Cause (Trip Condition)' },
  colEffect: { es: 'Efecto Determinista en PLC', en: 'Deterministic PLC Effect' },
  colSev: { es: 'Severidad', en: 'Severity' },

  plcDialectLabel: { es: 'Estándar de exportación PLC', en: 'PLC export dialect' },
  plcSclTab: { es: 'Siemens TIA Portal (.scl — IEC 61131-3)', en: 'Siemens TIA Portal (.scl — IEC 61131-3)' },
  plcL5kTab: { es: 'Rockwell Studio 5000 (.L5K — Logix AOI)', en: 'Rockwell Studio 5000 (.L5K — Logix AOI)' },

  // Mode 2: CAD + Arduino (.stl + .ino)
  cadSourceBar: { es: 'hardware de entrada — mallas cad (.stl) + firmware (.ino)', en: 'input hardware — cad meshes (.stl) + firmware (.ino)' },
  cadPresetLabel: { es: 'Preset de robot físico (o sube tus archivos .stl y .ino)', en: 'Physical robot preset (or upload your .stl & .ino files)' },
  cadUploadStl: { es: 'Subir mallas .stl', en: 'Upload .stl meshes' },
  cadUploadIno: { es: 'Subir sketch .ino', en: 'Upload .ino sketch' },
  cadTestConflict: { es: 'Probar conflicto Timer1 (ENA=D10 + Servo=D9)', en: 'Test Timer1 conflict (ENA=D10 + Servo=D9)' },
  cadFixConflict: { es: 'Restaurar pinout válido (ENA=D5, ENB=D6, Servo=D9, Echo=D3)', en: 'Restore valid pinout (ENA=D5, ENB=D6, Servo=D9, Echo=D3)' },
  cadAuditBar: { es: 'auditoría determinista de pinout, timers y cuellos de botella', en: 'deterministic pinout, timer & bottleneck audit' },
  cadCatalogBar: { es: 'catálogo cerrado de componentes mecatrónicos calibrados', en: 'closed catalog of calibrated mechatronic components' },
  cadOutBar: { es: 'gemelo físico mujoco (.xml) y firmware c99 no bloqueante (50 hz)', en: 'mujoco physics twin (.xml) & non-blocking 50 hz c99 firmware' },
  cadTabXml: { es: '1 · Modelo MuJoCo MJCF (.xml)', en: '1 · MuJoCo MJCF Model (.xml)' },
  cadTabIno: { es: '2 · Firmware C99 Determinista (.ino a 50 Hz)', en: '2 · Deterministic C99 Firmware (50 Hz .ino)' },
  cadOpenRoverSim: { es: 'Simular Rover Luigi Lab 4 en 3D →', en: 'Simulate Luigi Lab 4 Rover in 3D →' },
  cadDlInoBtn: { es: 'Descargar Firmware C99 Calibrado (.ino) ↓', en: 'Download Calibrated C99 Firmware (.ino) ↓' },
});
