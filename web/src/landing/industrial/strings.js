// Bilingual ES/EN dictionary for the 3D scrollable Tridi Industrial landing (/industrial).
// Matches Humanoids (/) copy budget: short 2-line display headline, crisp 2-line lede, exact specs.
import { dict } from '../../i18n.js';

export const { T, t, A } = dict({
  'nav.home': { es: 'Tridi · Inicio', en: 'Tridi · Home' },
  'nav.menu': { es: 'Navegación industrial', en: 'Industrial navigation' },
  'nav.stations': { es: 'Estaciones', en: 'Stations' },
  'nav.validation': { es: 'Validación', en: 'Validation' },
  'nav.policy': { es: 'Policy & PLC', en: 'Policy & PLC' },
  'nav.milestones': { es: 'Avances', en: 'Milestones' },
  'nav.openAssembler': { es: 'Abrir Assembler', en: 'Open Assembler' },

  'hud.packml': { es: 'PACKML · EXECUTE', en: 'PACKML · EXECUTE' },
  'hud.fault': { es: 'PACKML · FAULT (SLIP)', en: 'PACKML · FAULT (SLIP)' },
  'hud.reject': { es: 'PE-02/03 · RECHAZO', en: 'PE-02/03 · REJECT' },
  'hud.cycle': { es: 'Ciclo', en: 'Cycle' },
  'hud.waste': { es: 'Merma', en: 'Waste' },
  'hud.info': {
    es: 'Línea industrial factory_cell en WebGL en vivo: silo, prensa selladora, pistón desviador, PLC S7-1200 y brazo de 6 ejes sincronizados.',
    en: 'Live WebGL factory_cell line: dosing silo, sealing press, reject pusher, S7-1200 PLC, and 6-axis arm running in sync.',
  },

  // Hero (same concise rhythm as Humanoids "/")
  'hero.title': {
    es: 'Plantas que corren <em>antes del PLC</em>',
    en: 'Plants that run <em>before the PLC</em>',
  },
  'hero.lede': {
    es: 'Sube un plano P&ID o arma tu celda. Tridi simula cada actuador en MuJoCo y exporta documentación ISA-5.1 más código PLC.',
    en: 'Upload a P&ID or assemble your cell. Tridi simulates every actuator in MuJoCo and exports ISA-5.1 docs plus PLC code.',
  },
  'hero.ledeShort': {
    es: 'De planos P&ID a gemelo 3D MuJoCo, documentación ISA-5.1 y código PLC.',
    en: 'From P&ID drawings to a 3D MuJoCo twin, ISA-5.1 docs, and PLC code.',
  },
  'hero.step1': { es: 'Plano P&ID', en: 'P&ID drawing' },
  'hero.step1Short': { es: 'P&ID .dxf', en: 'P&ID .dxf' },
  'hero.step2': { es: 'Gemelo 3D', en: '3D twin' },
  'hero.step3': { es: 'Código PLC', en: 'PLC code' },
  'hero.step3Short': { es: 'PLC .scl/.L5K', en: 'PLC .scl/.L5K' },
  'hero.how': { es: 'Flujo industrial en tres pasos', en: 'Industrial pipeline in three steps' },
  'hero.ctaPrimary': { es: 'Abrir Assembler', en: 'Open Assembler' },
  'hero.ctaSecondary': { es: 'Simular celda', en: 'Simulate cell' },

  // Chapter 1 — Plant Stations (observational)
  'stations.product': { es: 'Tridi Assembler · Estaciones', en: 'Tridi Assembler · Stations' },
  'stations.title': {
    es: 'Cada estación, desde tu plano',
    en: 'Every station, from your drawing',
  },
  'stations.titleShort': {
    es: 'La planta por estaciones',
    en: 'Plant by stations',
  },
  'stations.lede': {
    es: 'Recorre las cuatro zonas reales de la celda: silos y dosificación, prensa selladora, paletizado con AGVs y gabinete PLC S7-1200.',
    en: 'Inspect the four live plant zones: dosing silos, sealing press, AGV palletizing bay, and the S7-1200 PLC cabinet.',
  },
  'stations.ledeShort': {
    es: 'Cuatro zonas reales: silos, prensa, paletizado/AGVs y gabinete S7-1200.',
    en: 'Four live zones: silos, press, palletizing/AGVs, and S7-1200 cabinet.',
  },
  'stations.label': { es: 'Estaciones de la planta', en: 'Plant stations' },
  'stations.s0.tag': { es: 'ST-01 · PE-01', en: 'ST-01 · PE-01' },
  'stations.s0.name': { es: 'Silos & Dosificado', en: 'Silos & Feeder' },
  'stations.s0.desc': {
    es: 'Granja de silos de proceso, tolva dosificadora HOPPER-01, celda de carga y fotocélula PE-01 anclada a la guía.',
    en: 'Process silo farm, HOPPER-01 dosing chute, dynamic checkweigher, and rail-mounted PE-01 photo-eye.',
  },
  'stations.s1.tag': { es: 'ST-02 · PE-02', en: 'ST-02 · PE-02' },
  'stations.s1.name': { es: 'Visión & Prensa', en: 'Vision & Press' },
  'stations.s1.desc': {
    es: 'Portal de visión cenital, pórtico sellador PRESS-01 con torreta Andon y sensor óptico PE-02 en entrada de prensa.',
    en: 'Overhead vision portal, PRESS-01 pneumatic sealing gantry with Andon stack, and PE-02 press-entry sensor.',
  },
  'stations.s2.tag': { es: 'ST-03 · PE-03', en: 'ST-03 · PE-03' },
  'stations.s2.name': { es: 'Paletizado & AGVs', en: 'Palletizing & AGVs' },
  'stations.s2.desc': {
    es: 'Desviador PUSHER-01 con tolva de rechazo, brazo IK de 6 ejes sobre Euro-pallet, rodillos de salida y AMRs en bahía.',
    en: 'PUSHER-01 diverter with reject chute, 6-axis IK arm stacking Euro-pallets, outfeed rollers, and bay AMRs.',
  },
  'stations.s3.tag': { es: 'ST-04 · S7-1200', en: 'ST-04 · S7-1200' },
  'stations.s3.name': { es: 'PLC & Mezzanine', en: 'PLC & Mezzanine' },
  'stations.s3.desc': {
    es: 'Gabinete NEMA 12 con Siemens S7-1200 (24\u00A0V DC), HMI SCADA, paro de emergencia y sala de control elevada.',
    en: 'NEMA 12 cabinet with Siemens S7-1200 (24\u00A0V DC), SCADA HMI, E-Stop, and elevated glass control mezzanine.',
  },

  // Chapter 2 — PLC Validation (interactive)
  'val.product': { es: 'Validación física & PLC', en: 'Physics & PLC Validation' },
  'val.title': {
    es: 'Rompe la línea antes de ir a planta',
    en: 'Break the line before the floor',
  },
  'val.titleShort': {
    es: 'Valida fallos en vivo',
    en: 'Validate faults live',
  },
  'val.lede': {
    es: 'Alterna sincronización óptica PackML vs. timer fijo, inyecta una caja defectuosa para ver el rechazo en vivo y cambia recetas ISA-88.',
    en: 'Switch between PackML optical sync and fixed timer, inject a defective box to watch live rejection, and change ISA-88 recipes.',
  },
  'val.ledeShort': {
    es: 'Sync óptico vs. timer fijo, inyección de falla y recetas ISA-88 en vivo.',
    en: 'Optical sync vs. fixed timer, fault injection, and live ISA-88 recipes.',
  },
  'val.modeLabel': { es: 'Modo de control PLC', en: 'PLC control mode' },
  'val.mode.sync': { es: 'Sync óptico · 0\u00A0% merma', en: 'Optical sync · 0% waste' },
  'val.mode.slip': { es: 'Timer fijo · 28\u00A0% patinaje', en: 'Fixed timer · 28% slip' },
  'val.faultLabel': { es: 'Prueba de rechazo óptico', en: 'Optical reject test' },
  'val.faultBtn': { es: 'Inyectar falla', en: 'Inject fault' },
  'val.faultStatusIdle': { es: 'Línea nominal', en: 'Line nominal' },
  'val.faultStatusActive': { es: 'Caja fallada en ruta → PUSHER-01', en: 'Faulted box en route → PUSHER-01' },
  'val.recipeLabel': { es: 'Receta ISA-88', en: 'ISA-88 Recipe' },

  // Chapter 3 — Tridi Policy & PLC Export
  'policy.product': { es: 'Tridi Policy & Exportación PLC', en: 'Tridi Policy & PLC Export' },
  'policy.title': {
    es: 'Lógica probada, lista para descargar al PLC',
    en: 'Validated logic, ready for the PLC',
  },
  'policy.titleShort': {
    es: 'Lista para el PLC real',
    en: 'Ready for the real PLC',
  },
  'policy.lede': {
    es: 'El parser local clasifica planos .dxf y .pdf en 16 clases ANSI/ISA-5.1 y compila bloques deterministas PackML para Siemens TIA Portal y Rockwell.',
    en: 'Our local parser maps .dxf and .pdf schematics to 16 ANSI/ISA-5.1 classes and compiles deterministic PackML blocks for Siemens and Rockwell.',
  },
  'policy.ledeShort': {
    es: '16 clases ANSI/ISA-5.1, FDS ejecutivo, tabla I/O y exportación .scl / .L5K.',
    en: '16 ANSI/ISA-5.1 classes, executive FDS, I/O table, and .scl / .L5K export.',
  },
  'policy.spec.cycle': { es: 'Ciclo validado', en: 'Validated cycle' },
  'policy.spec.cycleShort': { es: 'Ciclo', en: 'Cycle' },
  'policy.spec.waste': { es: 'Tasa de merma', en: 'Waste rate' },
  'policy.spec.wasteShort': { es: 'Merma', en: 'Waste' },
  'policy.spec.isa': { es: 'Clases ANSI/ISA-5.1', en: 'ANSI/ISA-5.1 classes' },
  'policy.spec.isaShort': { es: 'Estándar', en: 'Standard' },
  'policy.spec.plc': { es: 'Bloques PLC nativos', en: 'Native PLC blocks' },
  'policy.spec.plcShort': { es: 'Export PLC', en: 'PLC export' },
  'policy.cta': { es: 'Abrir Assembler →', en: 'Open Assembler →' },

  'arrows.label': { es: 'Saltar entre capítulos', en: 'Jump between chapters' },
  'arrows.up': { es: 'Capítulo anterior', en: 'Previous chapter' },
  'arrows.down': { es: 'Siguiente capítulo', en: 'Next chapter' },
});
