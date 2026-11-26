// Shared bilingual navigation dictionary (ES/EN) for Platform applications and Studio tools.
// Used by web/src/navigation.js and validated by web/scripts/check-i18n.mjs.
import { dict } from './i18n.js';

export const { T, t, A, L, strings } = dict({
  'trigger.platform': { es: 'Plataforma', en: 'Platform' },
  'sec.applications': { es: 'Aplicaciones', en: 'Applications' },
  'sec.tools': { es: 'Herramientas de Studio', en: 'Studio Tools' },
  'badge.comingSoon': { es: 'Próximamente', en: 'Coming soon' },
  'badge.roadmap': { es: 'Hoja de ruta', en: 'Roadmap' },
  'aria.panel': { es: 'Aplicaciones y Herramientas de Studio', en: 'Applications and Studio Tools' },
  'aria.platforms': { es: 'Aplicaciones de plataforma', en: 'Platform applications' },

  'vert.humanoids.name': { es: 'Humanoides', en: 'Humanoids' },
  'vert.humanoids.sub': { es: 'Bípedos en MuJoCo y políticas ONNX', en: 'Bipeds in MuJoCo & ONNX policies' },
  'vert.rovers.name': { es: 'Rovers', en: 'Rovers' },
  'vert.rovers.sub': { es: 'Rovers con radar y evasión 50\u00A0Hz', en: 'Radar rovers & 50\u00A0Hz avoidance' },
  'vert.industrial.name': { es: 'Industrial', en: 'Industrial' },
  'vert.industrial.sub': { es: 'Celdas P&ID, PLC y gemelo 3D', en: 'P&ID cells, PLC & 3D twin' },
  'vert.electronics.name': { es: 'Electrónica', en: 'Electronics' },
  'vert.electronics.sub': { es: 'Validación eléctrica de circuitos en 3D', en: '3D electrical circuit validation' },

  'tool.simulations.name': { es: 'Simulaciones', en: 'Simulations' },
  'tool.simulations.short': { es: 'Simulaciones', en: 'Simulations' },
  'tool.simulations.sub': { es: 'Prueba robots y políticas en física 3D', en: 'Test robots and policies in 3D physics' },
  'tool.live.name': { es: 'Cámara en vivo', en: 'Live Camera' },
  'tool.live.short': { es: 'Cámara en vivo', en: 'Live Camera' },
  'tool.live.sub': { es: 'Captura movimiento con webcam o celular', en: 'Capture live motion with webcam or phone' },
  'tool.upload.name': { es: 'Subir video', en: 'Upload Video' },
  'tool.upload.short': { es: 'Subir video', en: 'Upload Video' },
  'tool.upload.sub': { es: 'Convierte videos .mp4 en movimiento 3D', en: 'Turn any .mp4 video into 3D robot motion' },
  'tool.delivery.name': { es: 'Entregas', en: 'Deliveries' },
  'tool.delivery.short': { es: 'Entregas', en: 'Deliveries' },
  'tool.delivery.sub': { es: 'Políticas ONNX a 50\u00A0Hz y trayectorias', en: 'Download 50\u00A0Hz ONNX policies & trajectories' },
  'tool.assembler.name': { es: 'Assembler', en: 'Assembler' },
  'tool.assembler.short': { es: 'Assembler', en: 'Assembler' },
  'tool.assembler.sub': { es: 'Planos CAD y P&ID a simulación y código', en: 'CAD & P&ID files to simulation & code' },

  // Shared Closing & Footer (home.js + vertical.js)
  // One sentence per line (home.js keeps the <br> when it splits the words for the animation).
  'close.manifesto': { es: 'El hardware existe.<br>Entrenamos su física.', en: 'Hardware is here.<br>We train its physics.' },
  'close.text': {
    es: 'Abre Tridi Studio para simular, capturar movimiento o ensamblar planos en física real.',
    en: 'Open Tridi Studio to simulate, capture motion, or assemble blueprints in real physics.',
  },
  'close.textShort': {
    es: 'Simula, captura movimiento o ensambla planos en Tridi Studio.',
    en: 'Simulate, capture motion, or assemble blueprints in Tridi Studio.',
  },
  'close.actions': { es: 'Acciones de Tridi Studio', en: 'Tridi Studio actions' },
  'close.openStudio': { es: 'Abrir Studio →', en: 'Open Studio →' },
  'close.ctaRovers': { es: 'Simular Rover →', en: 'Simulate Rover →' },
  'close.ctaIndustrial': { es: 'Abrir Assembler →', en: 'Open Assembler →' },
  'close.milestones': { es: 'Ver avances', en: 'View milestones' },
  'foot.home': { es: 'Tridi, inicio', en: 'Tridi, home' },
  'foot.colApplications': { es: 'Aplicaciones', en: 'Applications' },
  'foot.colStudio': { es: 'Studio', en: 'Studio' },
  'foot.colProduct': { es: 'Producto', en: 'Product' },
  'foot.milestones': { es: 'Avances', en: 'Milestones' },
  'foot.team': { es: 'Equipo', en: 'Team' },
  'foot.rights': { es: '© 2026 Tridi', en: '© 2026 Tridi' },
});
