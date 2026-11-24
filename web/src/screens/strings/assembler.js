// #/assembler copy in Spanish and English (src/i18n.js).
import { dict } from '../../i18n.js';

export const title = { es: 'Factory Assembler', en: 'Factory Assembler' };

export const { T, t, A } = dict({
  title: {
    es: 'De planos P&ID (.dxf) o piezas CAD (.stl + .ino) a gemelo físico, docs ISA-5.1 y código determinista',
    en: 'From P&ID blueprints (.dxf) or CAD parts (.stl + .ino) to physics twin, ISA-5.1 docs & deterministic code',
  },

  modeAria: { es: 'Canal de ensamblaje', en: 'Assembly channel' },
  modePid: {
    es: '01 · Planta Industrial P&ID (.dxf)',
    en: '01 · Industrial Plant P&ID (.dxf)',
  },
  modeCad: {
    es: '02 · Robot CAD (.stl + .ino)',
    en: '02 · Robot CAD (.stl + .ino)',
  },

  // Mode 1: P&ID (.dxf / .pdf) — Commercial 2-step flow
  dropKicker: {
    es: 'INGENIERÍA AUTOMÁTICA DESDE AUTOCAD · ISA-5.1 / ISA-88',
    en: 'AUTOMATED ENGINEERING FROM AUTOCAD · ISA-5.1 / ISA-88',
  },
  dropTitle: {
    es: 'Sube tu plano P&ID (.dxf o .pdf) y genera la documentación de ingeniería',
    en: 'Upload your P&ID blueprint (.dxf or .pdf) to generate engineering documentation',
  },
  dropLead: {
    es: 'Procesamiento 100 % local en tu navegador: lee entidades CAD (.dxf) y textos vectoriales (.pdf), reconoce etiquetas ISA-5.1 y alias industriales (TANK, BV, PP, AOD, FILTER PRESS) sin inventar componentes, y entrega la memoria descriptiva (FDS), tabla I/O y código PLC.',
    en: '100% local in-browser processing: reads CAD entities (.dxf) and vector text (.pdf), recognizes ISA-5.1 tags and plant aliases (TANK, BV, PP, AOD, FILTER PRESS) with zero hallucinated components, and delivers the Functional Design Specification (FDS), I/O table, and PLC code.',
  },
  dropBoxTitle: {
    es: 'Seleccionar plano P&ID (.dxf · .pdf)',
    en: 'Choose P&ID blueprint (.dxf · .pdf)',
  },
  dropBoxSub: {
    es: 'o arrastra y suelta aquí tu archivo .dxf de AutoCAD o PDF vectorial con texto seleccionable',
    en: 'or drag and drop your AutoCAD .dxf or vector PDF with selectable text here',
  },
  dropErrEmptyPdf: {
    es: 'Este PDF no contiene etiquetas de texto CAD seleccionables (está escaneado como imagen o sus fuentes fueron vectorizadas a curvas). Por favor exporta el plano desde AutoCAD en formato .dxf.',
    en: 'This PDF contains no selectable CAD text tags (it is a scanned image or its fonts were outlined to curves). Please export the blueprint from AutoCAD in .dxf format.',
  },
  dropErrEmptyDxf: {
    es: 'No se detectaron etiquetas de equipos ni instrumentación ISA-5.1 en este archivo. Verifica que sea un archivo .dxf ASCII válido.',
    en: 'No ISA-5.1 equipment or instrumentation tags were detected in this file. Please verify it is a valid ASCII .dxf blueprint.',
  },
  dropGoalPlaceholder: {
    es: 'Ej. Dosificar 3 ingredientes por peso en TK-101, agitar 120 s y descargar a cinta...',
    en: 'E.g. Dose 3 ingredients by weight into TK-101, agitate 120 s and discharge to conveyor...',
  },
  dropSamplesLabel: {
    es: '¿No tienes un plano a mano? Prueba con un caso real en 1 clic:',
    en: 'No blueprint on hand? Try a real industrial case in 1 click:',
  },
  changeFileBtn: {
    es: '← Subir otro plano',
    en: '← Upload another blueprint',
  },
  dlDxfBtn: {
    es: 'Descargar AutoCAD (.dxf) ↓',
    en: 'Download AutoCAD (.dxf) ↓',
  },
  docReadyBar: {
    es: 'DOCUMENTACIÓN EJECUTIVA DE INGENIERÍA · ANSI/ISA-5.1 & ISA-88',
    en: 'EXECUTIVE ENGINEERING DOCUMENTATION · ANSI/ISA-5.1 & ISA-88',
  },
  secOverview: {
    es: 'Objetivo Operativo del Proceso',
    en: 'Operational Process Objective',
  },
  dlCsvBtn: {
    es: 'Descargar Tabla I/O (.csv) ↓',
    en: 'Download I/O Table (.csv) ↓',
  },
  printPdfBtn: {
    es: 'Imprimir / Guardar PDF',
    en: 'Print / Save PDF',
  },
  techDrawerTitle: {
    es: 'Ver información técnica avanzada (Tabla de direcciones PLC I/O, Código Siemens .scl / Rockwell .L5K, Esquema 2D y XML 3D)',
    en: 'View advanced technical details (PLC I/O Address Table, Siemens .scl / Rockwell .L5K Code, 2D Schematic & 3D XML)',
  },
  techTabsAria: {
    es: 'Pestañas técnicas de P&ID',
    en: 'P&ID technical tabs',
  },
  plcDialectAria: {
    es: 'Estándar de exportación PLC',
    en: 'PLC export dialect',
  },
  svgPidAria: {
    es: 'Esquema P&ID ISA-5.1 en vivo',
    en: 'P&ID ISA-5.1 Live Schematic',
  },
  svgCadAria: {
    es: 'Esquema de hardware y pinout',
    en: 'Hardware & Pinout Schematic',
  },
  tabDiagram: {
    es: '3 · Esquema 2D y Fallas',
    en: '3 · 2D Schematic & Faults',
  },
  colDesc: {
    es: 'Descripción en Plano',
    en: 'Blueprint Description',
  },

  pidGoalLabel: { es: 'Objetivo operativo del proceso (ISA-88)', en: 'Operational process objective (ISA-88)' },
  pidVerifiedBadge: { es: '✓ 100 % tags verificados en el .dxf', en: '✓ 100% tags verified in .dxf' },

  pidStepLabel: { es: 'Fase ISA-88', en: 'ISA-88 Phase' },
  pidScaleLabel: { es: 'Báscula (WT)', en: 'Scale (WT)' },
  pidBatchCount: { es: 'Lotes listos', en: 'Batches done' },
  pidFaultLsh: { es: '⚡ Falla: Sobrellenado LSH', en: '⚡ Fault: LSH Overfill' },
  pidFaultMotor: { es: '⚡ Falla: Relé Motor', en: '⚡ Fault: Motor Overload' },
  pidFaultReset: { es: '↺ Rearmar planta', en: '↺ Reset plant' },
  pidOpen3dSim: { es: 'Ver Celda en 3D →', en: 'Open 3D Cell →' },

  tabP1Io: { es: '2 · Tabla Equipos e I/O', en: '2 · Equipment & I/O Table' },
  tabP3: { es: '3 · Código PLC (.scl / .L5K)', en: '3 · PLC Code (.scl / .L5K)' },
  tabP2: { es: '4 · Escena 3D (.xml)', en: '4 · 3D Scene (.xml)' },

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

  plcSclTab: { es: 'Siemens TIA Portal (.scl — IEC 61131-3)', en: 'Siemens TIA Portal (.scl — IEC 61131-3)' },
  plcL5kTab: { es: 'Rockwell Studio 5000 (.L5K — Logix AOI)', en: 'Rockwell Studio 5000 (.L5K — Logix AOI)' },

  // Mode 2: CAD + Arduino (.stl + .ino)
  cadSourceBar: { es: '01 · esquema de hardware (.stl + .ino) y auditoría de pines', en: '01 · hardware schematic (.stl + .ino) & pinout audit' },
  cadPresetAria: { es: 'Seleccionar preset de robot físico', en: 'Select physical robot preset' },
  cadPresetLab4: {
    es: 'Luigi Lab IV — Rover Autónomo (Arduino UNO + SG90 + HC-SR04)',
    en: 'Luigi Lab IV — Autonomous Rover (Arduino UNO + SG90 + HC-SR04)',
  },
  cadPresetLab3: {
    es: 'Luigi Lab III — Rover Explorador (Arduino UNO + HC-SR04 + APDS-9960)',
    en: 'Luigi Lab III — Explorer Rover (Arduino UNO + HC-SR04 + APDS-9960)',
  },
  cadPinoutValid: { es: '✓ Pinout válido', en: '✓ Pinout valid' },
  colCadSignal: { es: 'Señal', en: 'Signal' },
  colCadPin: { es: 'Pin MCU', en: 'MCU Pin' },
  colCadBus: { es: 'Bus / Timer de Hardware', en: 'Hardware Bus / Timer' },
  cadTabsAria: { es: 'Pestañas de entregables CAD', en: 'CAD deliverable tabs' },
  cadUploadStl: { es: '+ Subir .stl', en: '+ Upload .stl' },
  cadUploadIno: { es: '+ Subir .ino', en: '+ Upload .ino' },
  cadTestConflict: { es: '⚡ Simular choque Timer1 (ENA=D10 + Servo=D9)', en: '⚡ Simulate Timer1 conflict (ENA=D10 + Servo=D9)' },
  cadFixConflict: { es: '✓ Restaurar pinout válido (D5/D6 Timer0)', en: '✓ Restore valid pinout (D5/D6 Timer0)' },
  cadAuditBar: { es: 'auditoría determinista de pinout, timers y cuellos de botella', en: 'deterministic pinout, timer & bottleneck audit' },
  cadCatalogBar: { es: 'catálogo cerrado de componentes mecatrónicos calibrados', en: 'closed catalog of calibrated mechatronic components' },
  cadOutBar: { es: '02 · entregables generados (auditoría + firmware c99 + mujoco 3d)', en: '02 · generated deliverables (audit + c99 firmware + 3d mujoco)' },
  cadTabAudit: { es: '1 · Tabla Pinout y Catálogo', en: '1 · Pinout Table & Catalog' },
  cadTabIno: { es: '2 · Firmware C99 (50 Hz .ino)', en: '2 · C99 Firmware (50 Hz .ino)' },
  cadTabXml: { es: '3 · Modelo 3D MuJoCo (.xml)', en: '3 · 3D MuJoCo Model (.xml)' },
  cadOpenRoverSim: { es: 'Ver Rover en 3D →', en: 'Open 3D Rover →' },
  cadDlInoBtn: { es: 'Descargar Firmware C99 (.ino) ↓', en: 'Download C99 Firmware (.ino) ↓' },
});
