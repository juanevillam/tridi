// Copy for #/milestones (#/avances): engineering logbook of Tridi's real-world milestones.
// Direct, factual prose — no marketing fluff, real links to events, balanced ES/EN copy budget.
import { dict } from '../../i18n.js';

export const title = { es: 'Avances', en: 'Milestones' };

const SVS_LINK =
  '<a class="ms-link" href="https://www.startupvenezuelasummit.com" target="_blank" rel="noopener noreferrer">Startup Venezuela Summit</a>';
const PH_LINK =
  '<a class="ms-link" href="https://hack.platan.us" target="_blank" rel="noopener noreferrer">Platanus Hack 26</a>';
const YC_LINK =
  '<a class="ms-link" href="https://www.ycombinator.com" target="_blank" rel="noopener noreferrer">Y Combinator</a>';

export const { T, t, A } = dict({
  railNav: { es: 'Selector de avances', en: 'Milestones selector' },

  // Horizontal milestone selector tabs
  'tab.m1.date': { es: '23–25 Oct 2026', en: 'Oct 23–25, 2026' },
  'tab.m1.title': { es: 'Platanus Hack 26 Caracas', en: 'Platanus Hack 26 Caracas' },

  'tab.m2.date': { es: '7 Nov 2026', en: 'Nov 7, 2026' },
  'tab.m2.title': { es: 'Primer Sim-to-Real físico', en: 'First physical Sim-to-Real' },

  'tab.m3.date': { es: '2 Nov 2026', en: 'Nov 2, 2026' },
  'tab.m3.title': { es: 'Aplicación a YC W27', en: 'YC W27 application' },

  // Deck scope labels & navigation
  'deck.hardware': { es: 'Hardware real', en: 'Physical hardware' },
  'deck.cad': { es: 'Planos CAD', en: 'CAD blueprints' },
  'deck.prev': { es: 'Anterior', en: 'Previous' },
  'deck.next': { es: 'Siguiente', en: 'Next' },

  // Minimal inline CAD version tags merged into counter pill (Lab 3 v1 vs Lab 4 v2)
  'cad.v1': { es: 'Lab 3 (v1)', en: 'Lab 3 (v1)' },
  'cad.v2': { es: 'Lab 4 (v2)', en: 'Lab 4 (v2)' },

  // Unified Tridi media viewer & video controls labels
  'vp.play': { es: 'Reproducir video', en: 'Play video' },
  'vp.mute': { es: 'Activar o silenciar audio', en: 'Toggle audio' },
  'vp.seek': { es: 'Progreso del video', en: 'Video progress' },

  'lb.dialog': { es: 'Visor de medios', en: 'Media viewer' },
  'lb.close': { es: 'Cerrar visor', en: 'Close viewer' },
  'lb.prev': { es: 'Elemento anterior', en: 'Previous item' },
  'lb.next': { es: 'Siguiente elemento', en: 'Next item' },

  // =========================================================================
  // Milestone 01 — Platanus Hack 26 Caracas
  // =========================================================================
  'm1.ctaSims': { es: 'Abrir Simulaciones →', en: 'Open Simulations →' },
  'm1.title': {
    es: '36 horas en Platanus Hack 26 Caracas: donde nació Tridi',
    en: '36 hours at Platanus Hack 26 Caracas: where Tridi started',
  },
  'm1.intro': {
    es: `Saliendo del ${SVS_LINK}, nos reunimos los cuatro en las oficinas de Yummy en Caracas para la parada venezolana de ${PH_LINK}. Con unas 20\u00A0horas netas de código y dos Macs, armamos la primera versión de Tridi desde cero para subirla en vivo frente al jurado.`,
    en: `Straight out of the ${SVS_LINK}, the four of us reunited at Yummy’s offices in Caracas for the Venezuelan stop of ${PH_LINK}. With roughly 20\u00A0net hours of code and two Macs, we built the first version of Tridi from scratch to demo live in front of the judges.`,
  },
  'm1.notesTitle': {
    es: 'La historia detrás del fin de semana',
    en: 'The story behind the weekend',
  },
  'm1.n1.title': {
    es: 'De Real Steel a simulación física de humanoides',
    en: 'From Real Steel to physical humanoid simulation',
  },
  'm1.n1.body': {
    es: 'Todo arrancó en nuestro grupo de amigos tras aplicar con juegos arcade propios para asegurar cupo. Queríamos algo técnicamente loco y de escala global: primero pensamos en peleas de robots estilo Real Steel, pero lo bajamos a algo real — entrenar humanoides con físicas en MuJoCo.',
    en: 'It started in our friends’ group chat after we each built custom arcade entries to boost our odds of getting in. We wanted something technically wild at global scale: first pitched a Real Steel robot-fighting concept, then grounded it into training humanoids in real MuJoCo physics.',
  },
  'm1.n2.title': {
    es: 'El tembleque de pie y 60\u00A0M de pasos en dos Macs',
    en: 'The standing wobble & 60M steps on two Macs',
  },
  'm1.n2.body': {
    es: 'La primera política de equilibrio mantenía al Unitree G1 de pie dando saltitos de lado a lado: recompensábamos no caerse, pero no quedarse quieto. Mientras desarrollábamos el producto en dos Macs (M5 Pro y M2 Pro), tomamos decenas de intentos hasta cerrar una política de 60\u00A0M de pasos.',
    en: 'Our first balance policy kept the Unitree G1 upright by hopping side to side — we rewarded staying up without rewarding stillness. Splitting product code and RL training across just two Macs (an M5 Pro and an M2 Pro), it took dozens of runs to land a 60M-step policy in time.',
  },
  'm1.n3.title': {
    es: 'Por qué seguimos después del domingo',
    en: 'Why we kept building after Sunday',
  },
  'm1.n3.body': {
    es: 'No ganamos, pero ya veníamos de convertir nuestra hackathon anterior en startups reales. Si igual íbamos a dedicar 16\u00A0horas diarias a construir, tenía sentido apostar por algo tan complejo y de escala global como Tridi.',
    en: 'We didn’t win, but we had already turned our previous hackathon into real startups. If we were going to spend 16\u00A0hours a day building anyway, it made sense to bet on something technically hard and global-scale like Tridi.',
  },

  // =========================================================================
  // Milestone 02 — Physical Sim-to-Real (Luigi's differential robot)
  // =========================================================================
  'm2.ctaSim': { es: 'Simular Lab 3 →', en: 'Simulate Lab 3 →' },
  'm2.title': {
    es: 'Primer robot físico corriendo una política de Tridi a 50\u00A0Hz',
    en: 'First physical robot running a 50\u00A0Hz Tridi policy',
  },
  'm2.intro': {
    es: 'Antes de llevar una política a un humanoide, probamos el ciclo Sim-to-Real en metal real con el rover diferencial (Lab 3) de Luigi D’Aquaro, amigo de Ale. En una sola noche cerramos el flujo de CAD a hardware sin cables y sentamos la base para Lab 4 (v2).',
    en: 'Before putting a policy on a humanoid, we proved the full Sim-to-Real loop on real metal with Ale’s friend Luigi D’Aquaro’s differential rover (Lab 3). In a single night we went from CAD blueprints to untethered hardware and laid the foundation for Lab 4 (v2).',
  },

  'm2.stepsTitle': {
    es: 'Tres problemas reales de hardware resueltos',
    en: 'Three real hardware bottlenecks solved',
  },
  'm2.s1.title': { es: '6 STLs a MuJoCo y ONNX', en: '6 STLs to MuJoCo & ONNX' },
  'm2.s1.body': {
    es: 'Armamos el modelo MuJoCo con las 6 mallas STL reales, masas medidas y actuadores a 20,94\u00A0rad/s. Exportamos la política ONNX (15 observaciones, 2 motores) y la enlazamos al navegador por WebSerial a 9600\u00A0baud.',
    en: 'Built the MuJoCo model from the 6 real STL meshes, measured masses and 20.94\u00A0rad/s actuators. Exported the ONNX policy (15 obs, 2 motors) and linked it live to the browser over 9600-baud WebSerial.',
  },
  'm2.s2.title': { es: 'Caber en 2\u00A0KB de RAM y vencer fricción', en: 'Fitting in 2\u00A0KB RAM & static friction' },
  'm2.s2.body': {
    es: 'Transpilamos el grafo ONNX a C nativo (461\u00A0bytes de RAM, 22\u00A0% del ATmega328P) corriendo cada 20\u00A0ms, y mapeamos rad/s a PWM [115..200] para salir de la zona muerta de las llantas de TPU.',
    en: 'Transpiled the ONNX graph to native C (461\u00A0bytes RAM, 22% of the ATmega328P) running every 20\u00A0ms, and mapped rad/s to PWM [115..200] to clear the TPU tires’ static friction deadzone.',
  },
  'm2.s3.title': { es: 'Drivers en tiempo real para HC-SR04 y APDS-9960', en: 'Real-time HC-SR04 & APDS-9960 drivers' },
  'm2.s3.body': {
    es: 'Cambiamos pulseIn() (que congelaba 47,1\u00A0ms sin eco) por una interrupción ISR(PCINT1_vect) de 0,01\u00A0ms, y escribimos un driver I2C directo (registros 0x80–0x9C) para el clon APDS-9960 (Chip ID 0x9E) que la librería oficial rechazaba.',
    en: 'Replaced blocking pulseIn() (47.1\u00A0ms stall on missed echoes) with a 0.01\u00A0ms ISR(PCINT1_vect) interrupt, and wrote a direct I2C register driver (0x80–0x9C) for the Chip ID 0x9E APDS-9960 clone rejected by the stock library.',
  },

  // =========================================================================
  // Milestone 03 — Y Combinator W27 Application
  // =========================================================================
  'm3.ctaLive': { es: 'Abrir captura en vivo →', en: 'Open live capture →' },
  'm3.title': {
    es: 'Aplicación a Y\u00A0Combinator W27: una semana tras Caracas',
    en: 'Y\u00A0Combinator W27 application: one week after Caracas',
  },
  'm3.intro': {
    es: `Siete días después de Platanus Hack 26 cerramos el primer demo en producción y aplicamos a ${YC_LINK} Winter 2027 desde Barquisimeto. Grabamos el video de un minuto el mismo día del cierre, contra reloj y con un apagón en medio.`,
    en: `Seven days after Platanus Hack 26 we shipped the first live demo and applied to ${YC_LINK} Winter 2027 from Barquisimeto. We recorded the one-minute founder video on deadline day, racing the clock through a power outage.`,
  },
  'm3.notesTitle': {
    es: 'Detrás del video del 2 de noviembre',
    en: 'Behind the November 2 video',
  },
  'm3.n1.title': {
    es: 'De prototipo de hackathon a compañía',
    en: 'From hackathon prototype to company',
  },
  'm3.n1.body': {
    es: 'En una semana consolidamos los cuatro roles fundadores, publicamos el demo web con políticas ONNX en el navegador y documentamos con números reales lo que ya funcionaba y lo que faltaba por resolver.',
    en: 'In one week we locked in all four founding roles, shipped the live web demo running ONNX policies in the browser, and wrote down with hard numbers what already worked and what remained unsolved.',
  },
  'm3.n2.title': {
    es: 'Apagón en Barquisimeto y luz colgada del techo',
    en: 'Blackout in Barquisimeto & a chandelier light rig',
  },
  'm3.n2.body': {
    es: 'Elegimos la casa donde casi nunca se va la luz para evitar sorpresas y se fue justo antes de grabar. Sin bombillos recargables, colgamos una barra LED y un power bank de la lámpara del techo con alambre para poder ensayar.',
    en: 'We picked the house where the power almost never goes out, and the grid dropped right before filming. With no rechargeable bulbs on hand, we wired an LED bar and a power bank to the ceiling chandelier just to keep rehearsing.',
  },
  'm3.n3.title': {
    es: 'Mudanza a las 7\u00A0p.\u00A0m. y toma final antes de medianoche',
    en: '7\u00A0p.m. relocation & final take before midnight',
  },
  'm3.n3.body': {
    es: 'Con el cierre a las 12 y todavía sin video a las 7 de la noche, nos movimos a casa de Ale para reunir a los cuatro. Con la MacBook sobre una mesa plegable y un micrófono inalámbrico, sacamos la toma de 57\u00A0s y enviamos a tiempo.',
    en: 'With the deadline at midnight and still no take at 7\u00A0p.m., we moved over to Ale’s house to get all four of us in frame. With a MacBook on a folding tray table and one wireless mic, we nailed the 57\u00A0s cut and submitted on time.',
  },
});
