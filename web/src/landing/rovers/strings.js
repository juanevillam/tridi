// Bilingual ES/EN copy for the dedicated Tridi Rovers 3D landing (/rovers).
// Every claim is backed by docs/caso-luigi-sim2real.md, physics/models/luigi_lab3/, and physics/models/luigi_lab4/.
import { dict } from '../../i18n.js';

export const { T, t, A } = dict({
  // Boot & HUD
  'boot.title': { es: 'luigi_cad.stl', en: 'luigi_cad.stl' },
  'boot.line': { es: 'ensamblando chasis V1/V2 y laberinto', en: 'assembling V1/V2 CAD chassis & maze' },
  'hud.live': { es: 'En vivo · Luigi v2', en: 'Live · Luigi v2' },
  'hud.liveV1': { es: 'En vivo · Luigi v1', en: 'Live · Luigi v1' },
  'hud.radar': { es: 'Radar', en: 'Radar' },
  'hud.dist': { es: 'Pared', en: 'Wall' },
  'hud.info': {
    es: 'Mallas STL reales de Luigi V1 (Lab 3, sensor fijo) y V2 (Lab 4, cuello SG90 ±90°) con raycast ultrasónico HC-SR04 y esquive en vivo.',
    en: 'Real Luigi V1 (Lab 3, fixed sensor) and V2 (Lab 4, SG90 ±90° neck) STL meshes with live HC-SR04 raycasting and obstacle avoidance.',
  },

  // Topbar
  'nav.home': { es: 'Tridi, volver arriba', en: 'Tridi, back to top' },
  'nav.design': { es: 'Diseño', en: 'Design' },
  'nav.sensors': { es: 'Sensores', en: 'Sensors' },
  'nav.sim2real': { es: 'Sim-to-Real', en: 'Sim-to-Real' },
  'nav.milestones': { es: 'Avances', en: 'Milestones' },
  'nav.menu': { es: 'Menú de navegación', en: 'Navigation menu' },
  'nav.openStudio': { es: 'Abrir Studio', en: 'Open Studio' },

  // Hero
  'hero.title': { es: 'Rovers que navegan <em>sin chocar</em>', en: 'Rovers that navigate <em>without crashing</em>' },
  'hero.lede': {
    es: 'De tu diseño CAD a un gemelo físico en MuJoCo y firmware C99 corriendo a 50\u00A0Hz dentro de un Arduino UNO.',
    en: 'From your CAD design to a real MuJoCo physics twin and C99 firmware running at 50\u00A0Hz inside an Arduino UNO.',
  },
  'hero.ledeShort': {
    es: 'CAD real, simulación MuJoCo y política ONNX compilada a C99 para tu rover.',
    en: 'Real CAD, MuJoCo physics, and an ONNX policy compiled to C99 for your rover.',
  },
  'hero.how': { es: 'Pipeline de rovers', en: 'Rover pipeline' },
  'hero.step1': { es: 'CAD & STL reales', en: 'Real CAD & STL' },
  'hero.step1Short': { es: 'CAD', en: 'CAD' },
  'hero.step2': { es: 'Física MuJoCo', en: 'MuJoCo physics' },
  'hero.step3': { es: 'Firmware C99', en: 'C99 firmware' },
  'hero.step3Short': { es: 'C99', en: 'C99' },
  'hero.ctaPrimary': { es: 'Simular v2 →', en: 'Simulate v2 →' },
  'hero.ctaSecondary': { es: 'Ver evolución V1 → V2', en: 'Explore V1 → V2' },

  // Chapter 1: V1 vs V2 Hardware Design (observational)
  'design.kicker': { es: 'Tridi Hardware · V1 → V2', en: 'Tridi Hardware · V1 → V2' },
  'design.title': { es: 'De sensor fijo a cuello servo activo', en: 'From fixed sensor to active servo neck' },
  'design.titleShort': { es: 'Evolución V1 → V2', en: 'V1 → V2 evolution' },
  'design.lede': {
    es: 'V1 (Lab 3) montaba el HC-SR04 fijo bajo un brazo APDS-9960 sobre PLA negro. En V2 (Lab 4) extendimos el chasis a 180\u00A0mm e integramos un servo SG90 (±90°) para barrer pasillos antes de girar.',
    en: 'V1 (Lab 3) mounted the HC-SR04 rigidly under an APDS-9960 boom on black PLA. V2 (Lab 4) extends the chassis to 180\u00A0mm and embeds an SG90 servo (±90°) to scan corridors ahead of turns.',
  },
  'design.ledeShort': {
    es: 'V1 fijaba el sensor al chasis; V2 suma cuello servo SG90 (±90°) para barrer pasillos.',
    en: 'V1 fixed the sensor to the chassis; V2 adds an SG90 servo neck (±90°) to sweep turns.',
  },
  'design.modeGroup': { es: 'Comparar hardware V1 y V2', en: 'Compare V1 and V2 hardware' },
  'design.v1Tag': { es: 'V1 · Lab 3', en: 'V1 · Lab 3' },
  'design.v2Tag': { es: 'V2 · Lab 4', en: 'V2 · Lab 4' },
  'design.v1Spec': { es: '6 STL · HC-SR04 fijo + APDS-9960', en: '6 STLs · Fixed HC-SR04 + APDS-9960' },
  'design.v2Spec': { es: '7 STL · Cuello SG90 ±90° · 180\u00A0mm', en: '7 STLs · SG90 ±90° neck · 180\u00A0mm' },
  'design.v1Note': {
    es: 'Sin servo en cuello: para mirar a los lados debe girar todo el rover.',
    en: 'No rotating neck: the entire chassis must pivot to check side walls.',
  },
  'design.v2Note': {
    es: 'El servo SG90 barre ±90° en marcha continua sin frenar ni perder línea.',
    en: 'The SG90 servo sweeps ±90° continuously while keeping forward drive.',
  },

  // Chapter 2: Physics & Sensors (interactive)
  'sensors.kicker': { es: 'Tridi Physics · Sensores y Esquive', en: 'Tridi Physics · Sensors & Avoidance' },
  'sensors.title': { es: 'Radar activo y esquive en vivo', en: 'Active radar and live avoidance' },
  'sensors.titleShort': { es: 'Sensores y esquive', en: 'Sensors & avoidance' },
  'sensors.lede': {
    es: 'Motores TT de 200\u00A0RPM, llantas de TPU y raycast ultrasónico HC-SR04 en lazo cerrado. Coloca un obstáculo en la pista y observa el desvío inmediato.',
    en: '200\u00A0RPM TT motors, TPU tires, and closed-loop HC-SR04 ultrasonic raycasting. Drop an obstacle onto the maze and watch Luigi reroute live.',
  },
  'sensors.ledeShort': {
    es: 'Tracción diferencial y raycast HC-SR04: coloca obstáculos y observa el desvío.',
    en: 'Differential drive and HC-SR04 raycast: drop obstacles and watch live avoidance.',
  },
  'sensors.wallLabel': { es: 'eco<br>ultrasónico', en: 'ultrasonic<br>echo' },
  'sensors.modeGroup': { es: 'Modo de sensor del rover', en: 'Rover sensor mode' },
  'sensors.modeV2': { es: 'V2 · SG90', en: 'V2 · SG90' },
  'sensors.modeV1': { es: 'V1 · Fijo', en: 'V1 · Fixed' },
  'sensors.placeObstacle': { es: 'Colocar obstáculo', en: 'Place obstacle' },
  'sensors.clearObstacles': { es: 'Limpiar', en: 'Clear' },
  'sensors.ping': { es: 'Pulso LiDAR', en: 'LiDAR Ping' },
  'sensors.keySpace': { es: 'espacio', en: 'space' },
  'sensors.avoiding': { es: 'Obstáculo · esquivando', en: 'Obstacle · dodging' },
  'sensors.stagesGroup': { es: 'Tramos del laberinto', en: 'Maze checkpoints' },
  'stage.0.label': { es: 'Tramo 01', en: 'Stage 01' },
  'stage.0.verdict': { es: 'Entrada', en: 'Entry' },
  'stage.0.text': {
    es: 'Mide pasillos estrechos con HC-SR04 y ajusta tracción diferencial sin rozar paredes.',
    en: 'Measures tight corridors with HC-SR04 and tunes differential drive without scraping walls.',
  },
  'stage.1.label': { es: 'Tramo 02', en: 'Stage 02' },
  'stage.1.verdict': { es: 'Chicane', en: 'Chicane' },
  'stage.1.text': {
    es: 'El servo SG90 barre ±90° para anticipar bifurcaciones y descartar callejones sin salida.',
    en: 'The SG90 servo sweeps ±90° to anticipate junctions and reject dead-end corridors.',
  },
  'stage.2.label': { es: 'Tramo 03', en: 'Stage 03' },
  'stage.2.verdict': { es: 'Salida', en: 'Exit' },
  'stage.2.text': {
    es: 'Llega a la meta en lazo cerrado a 50\u00A0Hz con cero colisiones en todo el recorrido.',
    en: 'Reaches the exit in closed-loop 50\u00A0Hz control with zero collisions across the maze.',
  },

  // Chapter 3: Tridi Policy & Sim-to-Real
  's2r.kicker': { es: 'Tridi Policy · Sim-to-Real', en: 'Tridi Policy · Sim-to-Real' },
  's2r.title': { es: 'De ONNX a C99 en 2\u00A0KB de RAM', en: 'From ONNX to C99 in 2\u00A0KB RAM' },
  's2r.titleShort': { es: 'ONNX a C99 en 2\u00A0KB', en: 'ONNX to C99 in 2\u00A0KB' },
  's2r.lede': {
    es: 'Compilamos la red neuronal a C nativo sin bloqueos (PCINT1 + I2C directo). Desconectado del USB, Luigi rodó más de 2\u00A0minutos esquivando muebles reales.',
    en: 'We compile the neural policy into non-blocking native C (PCINT1 + raw I2C). Unplugged from USB, Luigi ran 2+ minutes dodging real furniture.',
  },
  's2r.ledeShort': {
    es: 'Red compilada a C nativo en Arduino UNO: 2+ min autónomo sin choques.',
    en: 'Policy compiled to native C on Arduino UNO: 2+ min autonomous with zero crashes.',
  },
  's2r.spec0': { es: 'peso ONNX', en: 'ONNX size' },
  's2r.spec0Short': { es: 'ONNX', en: 'ONNX' },
  's2r.spec1': { es: 'SRAM usada (22\u00A0%)', en: 'SRAM used (22%)' },
  's2r.spec1Short': { es: 'SRAM', en: 'SRAM' },
  's2r.spec2': { es: 'lazo C99 (20\u00A0ms)', en: 'C99 loop (20\u00A0ms)' },
  's2r.spec2Short': { es: 'Ciclo', en: 'Loop' },
  's2r.spec3': { es: 'choques en sala', en: 'room crashes' },
  's2r.spec3Short': { es: 'Choques', en: 'Crashes' },
  's2r.ctaSim': { es: 'Simular v2 →', en: 'Simulate v2 →' },

  // Editorial hardware evidence strip + on-demand video lightbox
  'ev.label': { es: 'Evidencia física real', en: 'Real physical evidence' },
  'ev.watchVideo': { es: 'Ver prueba real (2:19)', en: 'Watch real test (2:19)' },
  'ev.capReal': { es: 'Hardware real', en: 'Real hardware' },
  'ev.capSensors': { es: 'HC-SR04 + IR', en: 'HC-SR04 + IR' },
  'ev.capCad': { es: 'UNO + L298N', en: 'UNO + L298N' },
  'ev.modalTitle': { es: 'Prueba Sim-to-Real física · Luigi', en: 'Physical Sim-to-Real test · Luigi' },
  'ev.modalClose': { es: 'Cerrar video', en: 'Close video' },
  'ev.tabSim2Real': { es: 'Navegación autónoma', en: 'Autonomous run' },
  'ev.tabHardware': { es: 'Hardware por dentro', en: 'Hardware teardown' },
});
