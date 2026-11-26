// Bilingual ES/EN dictionary for dedicated Vertical Landings (/humanoids, /rovers, /industrial, /electronics).
// Every factual spec is verified against physics/, training/, web/src/policies.js, and web/public/media/.
import { dict } from '../../i18n.js';

export const { T, t, A } = dict({
  'status.live': { es: 'En vivo · Simulación y políticas', en: 'Live · Simulation & policies' },
  'status.preview': { es: 'Próximamente · Hoja de ruta', en: 'Coming soon · Roadmap' },
  'badge.soon': { es: 'Próximamente', en: 'Coming soon' },

  'sec.models': { es: 'Capacidades y hardware verificado', en: 'Verified models & capabilities' },
  'sec.pipeline': { es: 'Flujo en la escena 3D principal', en: 'Live 3D pipeline on Home' },
  'sec.gallery': { es: 'CAD real y prototipo físico', en: 'Real CAD & physical hardware' },
  'sec.tools': { es: 'Herramientas de Studio para esta vertical', en: 'Studio tools for this vertical' },
  'sec.toolsSub': {
    es: 'Módulos activos conectados directamente a esta vertical.',
    en: 'Active Studio modules wired directly to this vertical.',
  },
  'sec.roadmap': { es: 'Base actual y hoja de ruta eléctrica', en: 'Current baseline & electrical roadmap' },
  'sec.siblings': { es: 'Verticales activas hoy', en: 'Live verticals today' },

  'cta.openTool': { es: 'Abrir en Studio →', en: 'Open in Studio →' },
  'cta.exploreVertical': { es: 'Explorar vertical →', en: 'Explore vertical →' },
  'aria.playVideo': { es: 'Reproducir o pausar video', en: 'Play or pause video' },
  'aria.videoTabs': { es: 'Videos de demostración del rover', en: 'Rover demo videos' },
  'aria.gallery': { es: 'Galería de CAD y hardware de Luigi', en: 'Luigi CAD and hardware gallery' },

  // ---- Humanoids (/humanoids) ----
  'h.title': {
    es: 'Humanoides entrenados desde <em>cualquier video</em>',
    en: 'Humanoids trained from <em>any video</em>',
  },
  'h.lede': {
    es: 'Extraemos esqueletos 3D desde video o cámara en vivo, entrenamos en MuJoCo a 250\u00A0Hz y exportamos políticas ONNX compactas listas para correr a 50\u00A0Hz.',
    en: 'Extract 3D skeletons from video or live camera, train in 250\u00A0Hz MuJoCo physics, and export compact ONNX policies running at 50\u00A0Hz.',
  },
  'h.m1': { es: '29\u00A0DOF · 33.3\u00A0kg (G1)', en: '29\u00A0DOF · 33.3\u00A0kg (G1)' },
  'h.m2': { es: '250\u00A0Hz física · 50\u00A0Hz ONNX', en: '250\u00A0Hz physics · 50\u00A0Hz ONNX' },
  'h.m3': { es: '<\u00A00.5\u00A0ms inferencia CPU', en: '<\u00A00.5\u00A0ms CPU inference' },
  'h.ctaPrimary': { es: 'Simular humanoides →', en: 'Simulate humanoids →' },
  'h.ctaSecondary': { es: 'Ver escena 3D en vivo', en: 'See live 3D world' },
  'h.stageCap': {
    es: 'Referencia real: caminar (960×540, 11.88\u00A0s) → PoseClip → Unitree\u00A0G1 en MuJoCo',
    en: 'Real reference: walk clip (960×540, 11.88\u00A0s) → PoseClip → Unitree\u00A0G1 in MuJoCo',
  },
  'h.g1.kicker': { es: 'Unitree G1 · 35 mallas STL', en: 'Unitree G1 · 35 STL meshes' },
  'h.g1.title': { es: 'Unitree G1 (29\u00A0DOF)', en: 'Unitree G1 (29\u00A0DOF)' },
  'h.g1.body': {
    es: '33.3\u00A0kg, manos de 5 dedos y políticas entrenadas en producción: g1-stand (300\u00A0M pasos, soporta empujones ≤\u00A0500\u00A0N), g1-walk, g1-bailar y g1-saludar.',
    en: '33.3\u00A0kg, 5-finger hands, and trained policies in production: g1-stand (300M steps, holds ≤\u00A0500\u00A0N pushes), g1-walk, g1-bailar, and g1-saludar.',
  },
  'h.g1.cta': { es: 'Abrir G1 en Simulaciones →', en: 'Open G1 in Simulations →' },
  'h.h1.kicker': { es: 'Unitree H1 · 21 mallas STL', en: 'Unitree H1 · 21 STL meshes' },
  'h.h1.title': { es: 'Unitree H1 (19\u00A0DOF)', en: 'Unitree H1 (19\u00A0DOF)' },
  'h.h1.body': {
    es: 'Bípedo de escala completa con política entrenada h1-walk (300\u00A0KB ONNX, 10\u00A0M pasos, 11.85\u00A0s seguidos en física MuJoCo).',
    en: 'Full-scale biped with a trained h1-walk policy (300\u00A0KB ONNX, 10M steps, 11.85\u00A0s tracked in MuJoCo physics).',
  },
  'h.h1.cta': { es: 'Abrir Simulaciones →', en: 'Open Simulations →' },
  'h.anc.capture.title': { es: 'Tridi Capture', en: 'Tridi Capture' },
  'h.anc.capture.body': {
    es: 'Del video al esqueleto 3D mapeado a las articulaciones del robot.',
    en: 'From raw video to a 3D skeleton mapped onto the robot joints.',
  },
  'h.anc.gym.title': { es: 'Tridi Gym', en: 'Tridi Gym' },
  'h.anc.gym.body': {
    es: 'Progresión real de 10\u00A0M → 100\u00A0M → 300\u00A0M pasos con empujones de hasta 500\u00A0N.',
    en: 'Real progression from 10M → 100M → 300M steps under up to 500\u00A0N pushes.',
  },
  'h.anc.policy.title': { es: 'Tridi Policy', en: 'Tridi Policy' },
  'h.anc.policy.body': {
    es: 'Redes ONNX de 150–500\u00A0KB ejecutando g1-bailar y g1-saludar a 50\u00A0Hz.',
    en: '150–500\u00A0KB ONNX networks running g1-bailar and g1-saludar at 50\u00A0Hz.',
  },
  'h.anc.cta': { es: 'Ir a la escena 3D →', en: 'Jump to 3D scene →' },

  // ---- Rovers (/rovers) ----
  'r.title': {
    es: 'Rovers físicos con <em>Sim-to-Real a 50\u00A0Hz</em>',
    en: 'Physical rovers with <em>50\u00A0Hz Sim-to-Real</em>',
  },
  'r.lede': {
    es: 'De CAD STL y firmware Arduino a políticas ONNX entrenadas en MuJoCo que bajan a C99 determinista en 461\u00A0B de SRAM sobre piso real.',
    en: 'From CAD STL parts and Arduino sketches to MuJoCo-trained ONNX policies compiled down to deterministic 461\u00A0B SRAM C99 on real floors.',
  },
  'r.m1': { es: '461\u00A0B RAM · 50\u00A0Hz C99', en: '461\u00A0B RAM · 50\u00A0Hz C99' },
  'r.m2': { es: '1.9–2.3\u00A0KB ONNX · 5\u00A0M pasos', en: '1.9–2.3\u00A0KB ONNX · 5M steps' },
  'r.m3': { es: 'WebSerial 9600\u00A0baud en vivo', en: 'Live 9600\u00A0baud WebSerial' },
  'r.ctaPrimary': { es: 'Simular Luigi Lab 4 →', en: 'Simulate Luigi Lab 4 →' },
  'r.ctaSecondary': { es: 'Ver avance Sim-to-Real', en: 'See Sim-to-Real milestone' },
  'r.tab.sim2real': { es: 'Pista real · 139\u00A0s', en: 'Floor run · 139\u00A0s' },
  'r.tab.hardware': { es: 'Recorrido hardware · 89\u00A0s', en: 'Hardware tour · 89\u00A0s' },
  'r.videoHint': {
    es: 'Video bajo demanda para cuidar tu ancho de banda. Pulsa reproducir para cargar.',
    en: 'On-demand video to protect bandwidth. Press play to stream.',
  },
  'r.play': { es: 'Reproducir', en: 'Play' },
  'r.pause': { es: 'Pausar', en: 'Pause' },
  'r.l3.kicker': { es: 'Luigi Lab 3 (v1) · 6 piezas STL (2.6\u00A0MB)', en: 'Luigi Lab 3 (v1) · 6 STL parts (2.6\u00A0MB)' },
  'r.l3.title': { es: 'Arduino UNO + HC-SR04 PCINT1 + APDS-9960', en: 'Arduino UNO + HC-SR04 PCINT1 + APDS-9960' },
  'r.l3.body': {
    es: 'Chasis PLA de 150\u00A0mm (2.2\u00A0kg), puente H L298N, ultrasonido frontal por interrupción PCINT1, sensor IR APDS-9960 (0x39 / Chip ID 0x9E a 40\u00A0Hz), luigi-lab3.onnx (1.9\u00A0KB, 5\u00A0M pasos) y firmware C99 de 461\u00A0B RAM con puente WebSerial a 9600\u00A0baud.',
    en: '150\u00A0mm PLA chassis (2.2\u00A0kg), L298N H-bridge, PCINT1 ultrasonic ISR, APDS-9960 IR proximity (0x39 / Chip ID 0x9E @ 40\u00A0Hz), luigi-lab3.onnx (1.9\u00A0KB, 5M steps), and 461\u00A0B RAM C99 firmware with live 9600\u00A0baud WebSerial bridge.',
  },
  'r.l3.cta': { es: 'Abrir Luigi Lab 3 →', en: 'Open Luigi Lab 3 →' },
  'r.l4.kicker': { es: 'Luigi Lab 4 (v2) · 7 piezas STL (3.72\u00A0MB)', en: 'Luigi Lab 4 (v2) · 7 STL parts (3.72\u00A0MB)' },
  'r.l4.title': { es: 'Torreta SG90 ±63° + Ultrasonido INT1', en: 'SG90 ±63° Pan Turret + INT1 Ultrasonic' },
  'r.l4.body': {
    es: 'Radar activo con servo SG90 en D9 (Timer1, barrido ±63°), HC-SR04 en interrupción externa INT1 (D3), motores ENA/ENB aislados en Timer0 (D5/D6) y política luigi-lab4.onnx (2.3\u00A0KB, 5,000,000 pasos, obs_dim=18, nu=3) para evasión continua.',
    en: 'Active radar with SG90 servo on D9 (Timer1, ±63° sweep), HC-SR04 on hardware INT1 (D3), ENA/ENB isolated on Timer0 (D5/D6), and luigi-lab4.onnx (2.3\u00A0KB, 5,000,000 steps, obs_dim=18, nu=3) for continuous avoidance.',
  },
  'r.l4.cta': { es: 'Abrir Luigi Lab 4 →', en: 'Open Luigi Lab 4 →' },
  'r.gal.cadRobot': { es: 'CAD · Ensamble completo Luigi', en: 'CAD · Complete Luigi assembly' },
  'r.gal.cadChasis': { es: 'CAD · Chasis PLA y soportes', en: 'CAD · PLA chassis and mounts' },
  'r.gal.cadPlanta': { es: 'CAD · Vista en planta y geometría', en: 'CAD · Top-down geometry' },
  'r.gal.realFrente': { es: 'Hardware · Vista frontal en piso', en: 'Hardware · Front view on floor' },
  'r.gal.realSensores': { es: 'Hardware · HC-SR04 + APDS-9960', en: 'Hardware · HC-SR04 + APDS-9960' },
  'r.gal.realCables': { es: 'Hardware · Cableado L298N y UNO', en: 'Hardware · L298N and UNO wiring' },
  'r.tool.simLab4': { es: 'Abrir Luigi Lab 4 →', en: 'Open Luigi Lab 4 →' },
  'r.tool.simLab3': { es: 'Abrir Luigi Lab 3 →', en: 'Open Luigi Lab 3 →' },

  // ---- Industrial (/industrial) ----
  'i.title': {
    es: 'Planos P&ID a <em>gemelo 3D y código PLC</em>',
    en: 'P&ID drawings to <em>3D twin & PLC code</em>',
  },
  'i.lede': {
    es: 'Convierte archivos .dxf o .pdf vectoriales en documentación ANSI/ISA-5.1, gemelo MuJoCo factory_cell y bloques Siemens .scl / Rockwell .L5K listos para planta.',
    en: 'Turn .dxf or vector .pdf schematics into ANSI/ISA-5.1 engineering docs, a factory_cell MuJoCo twin, and Siemens .scl / Rockwell .L5K blocks.',
  },
  'i.m1': { es: '16 clases ANSI/ISA-5.1', en: '16 ANSI/ISA-5.1 tag classes' },
  'i.m2': { es: 'Ciclo 4.4\u00A0s · 0.0\u00A0% aplaste', en: '4.4\u00A0s cycle · 0.0% crush rate' },
  'i.m3': { es: 'Recetas 250\u00A0g / 500\u00A0g / 1\u00A0kg', en: '250\u00A0g / 500\u00A0g / 1\u00A0kg recipes' },
  'i.ctaPrimary': { es: 'Abrir Assembler →', en: 'Open Assembler →' },
  'i.ctaSecondary': { es: 'Simular factory_cell', en: 'Simulate factory_cell' },
  'i.pipe.title': { es: 'Flujo determinista sin componentes inventados', en: 'Deterministic pipeline with zero hallucinated parts' },
  'i.pipe.s1k': { es: '01 · Entrada CAD', en: '01 · CAD Input' },
  'i.pipe.s1v': { es: '.dxf / .pdf vectorial', en: '.dxf / vector .pdf' },
  'i.pipe.s2k': { es: '02 · Norma ISA-5.1', en: '02 · ISA-5.1 Parse' },
  'i.pipe.s2v': { es: 'FDS + Causa/Efecto + I/O .csv', en: 'FDS + Cause/Effect + I/O .csv' },
  'i.pipe.s3k': { es: '03 · Gemelo MuJoCo', en: '03 · MuJoCo Twin' },
  'i.pipe.s3v': { es: 'factory_cell + fallos', en: 'factory_cell + faults' },
  'i.pipe.s4k': { es: '04 · Código PLC', en: '04 · PLC Export' },
  'i.pipe.s4v': { es: 'Siemens .scl / Rockwell .L5K', en: 'Siemens .scl / Rockwell .L5K' },
  'i.asm.kicker': { es: 'Tridi Assembler · 100\u00A0% local en navegador', en: 'Tridi Assembler · 100% local in browser' },
  'i.asm.title': { es: 'Ingesta P&ID y generación ISA-5.1', en: 'P&ID ingestion & ISA-5.1 generation' },
  'i.asm.body': {
    es: 'Incluye 3 muestras reales de planta (01_batch_mixer.dxf, 02_silo_packaging.dxf y 06_pilot_plant_hydromet.dxf) con 16 clases de tags ISA-5.1. Exporta FDS ejecutivo, matriz Causa y Efecto, listado I/O .csv, bloques .scl/.L5K e inyección de fallos 2D.',
    en: 'Ships with 3 real plant samples (01_batch_mixer.dxf, 02_silo_packaging.dxf, 06_pilot_plant_hydromet.dxf) across 16 ISA-5.1 tag classes. Exports Executive FDS, Cause & Effect Matrix, I/O .csv, .scl/.L5K blocks, and 2D fault injection.',
  },
  'i.asm.cta': { es: 'Probar Assembler con P&ID →', en: 'Try Assembler with P&ID →' },
  'i.fc.kicker': { es: 'factory_cell · 4 estaciones MuJoCo', en: 'factory_cell · 4 MuJoCo stations' },
  'i.fc.title': { es: 'Celda de empaque y sellado (ISA-88)', en: 'Packaging & sealing cell (ISA-88)' },
  'i.fc.body': {
    es: 'HOPPER-01 (PE-01), PRESS-01 (PE-02), PUSHER-01 (PE-03) y PALLET-01 (apilado 0/6). Compara sincronización óptica (0\u00A0% merma) frente a Timer Fijo con 28\u00A0% patinaje de banda y cambia recetas HMI entre 250\u00A0g, 500\u00A0g y 1\u00A0kg.',
    en: 'HOPPER-01 (PE-01), PRESS-01 (PE-02), PUSHER-01 (PE-03), and PALLET-01 (0/6 stack). Compares optical sync (0% waste) against Fixed Timer under 28% belt-slip fault, with HMI recipes for 250\u00A0g, 500\u00A0g, and 1\u00A0kg.',
  },
  'i.fc.cta': { es: 'Abrir factory_cell en Simulaciones →', en: 'Open factory_cell in Simulations →' },

  // ---- Electronics (/electronics) ----
  'e.title': {
    es: 'Validación eléctrica de <em>placas y circuitos</em>',
    en: 'Electrical validation for <em>boards & circuits</em>',
  },
  'e.lede': {
    es: 'Estamos construyendo la capa eléctrica sobre nuestro catálogo verificado de MCUs, drivers y sensores. Hoy validamos pinouts y timers en Assembler; simulación térmica y de rieles llega próximamente.',
    en: 'We are building the electrical validation layer on top of our verified MCU, driver, and sensor catalog. Pinouts and timer locks run today in Assembler; power-rail and thermal simulation are coming soon.',
  },
  'e.m1': { es: 'Próximamente en Studio', en: 'Coming soon to Studio' },
  'e.m2': { es: 'UNO R3 · ESP32 · S7-1200', en: 'UNO R3 · ESP32 · S7-1200' },
  'e.m3': { es: 'L298N 1.4\u00A0V vs TB6612FNG 0.2\u00A0V', en: 'L298N 1.4\u00A0V vs TB6612FNG 0.2\u00A0V' },
  'e.ctaPrimary': { es: 'Ver verticales activas ↓', en: 'Explore live verticals ↓' },
  'e.ctaSecondary': { es: 'Ver auditoría de pines en Rovers', en: 'See pinout audit on Rovers' },
  'e.preview.head': { es: 'Catálogo determinista ya verificado (physics/components/catalog.json)', en: 'Deterministic catalog already verified (physics/components/catalog.json)' },
  'e.preview.note': {
    es: 'Sin telemetría ficticia ni simuladores falsos: abajo se muestra exactamente qué ya validamos hoy y qué entra en la hoja de ruta.',
    en: 'No fake telemetry or dummy circuit sims: below is exactly what is verified today and what lands next on the roadmap.',
  },
  'e.c1.kicker': { es: 'Ya activo en physics/components', en: 'Active today in physics/components' },
  'e.c1.title': { es: 'Restricciones de MCU, timers y drivers', en: 'MCU, timer & driver guardrails' },
  'e.c1.body': {
    es: 'Arduino UNO R3 (5\u00A0V, 2048\u00A0B SRAM, bloqueo Timer0/1/2 p. ej. Servo.h en D9/D10), ESP32 DevKit V1 (3.3\u00A0V / LEDC), PLC S7-1200 (24\u00A0V DC) y caída de puente H L298N (1.4\u00A0V) frente a TB6612FNG (0.2\u00A0V).',
    en: 'Arduino UNO R3 (5\u00A0V, 2048\u00A0B SRAM, Timer0/1/2 lock detection e.g. Servo.h on D9/D10), ESP32 DevKit V1 (3.3\u00A0V / LEDC), PLC S7-1200 (24\u00A0V DC), and L298N (1.4\u00A0V drop) vs TB6612FNG (0.2\u00A0V drop).',
  },
  'e.c2.kicker': { es: 'Hoja de ruta · Próximamente', en: 'Roadmap · Coming soon' },
  'e.c2.title': { es: 'Rieles de potencia y presupuesto de brownout', en: 'Power rails & brownout budget' },
  'e.c2.body': {
    es: 'Cálculo de caída de tensión bajo corriente de arranque, eficiencia de reguladores LDO/buck y margen de batería antes de resetear el microcontrolador.',
    en: 'Voltage-drop budgeting under motor stall current, LDO/buck efficiency, and battery sag margin before MCU brownout resets.',
  },
  'e.c3.kicker': { es: 'Hoja de ruta · Próximamente', en: 'Roadmap · Coming soon' },
  'e.c3.title': { es: 'Térmica, netlist y niveles lógicos', en: 'Thermal derating, netlist & logic levels' },
  'e.c3.body': {
    es: 'Derating térmico en puentes H, inyección de fallos por cortocircuito y verificación automática de compatibilidad lógica 3.3\u00A0V / 5\u00A0V / 24\u00A0V desde netlists.',
    en: 'H-bridge junction thermal derating, short-circuit fault injection, and automated 3.3\u00A0V / 5\u00A0V / 24\u00A0V logic-level checks from schematics and netlists.',
  },
  'e.soonTitle': { es: 'Herramientas dedicadas de Electrónica: Próximamente', en: 'Dedicated Electronics tools: Coming soon' },
  'e.soonBody': {
    es: 'Mientras cerramos el motor de validación de rieles y circuitos, puedes explorar las tres verticales que ya corren en física real y Studio hoy.',
    en: 'While we finish the power-rail and circuit validation engine, explore the three verticals already running in live physics and Studio today.',
  },
});
