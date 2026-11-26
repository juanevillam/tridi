// The landing's copy in every language (src/i18n.js). English is the original, written for a US
// robotics team; Spanish is translated from it. Keys are grouped by chapter. Every claim here must be
// backed by yc/verdad-hoy.md and the "true today" table in docs/pitch/pitch-producto.md.
import { dict } from '../i18n.js';

export const { T, t, A } = dict({
  // Boot and simulation readout
  'boot.world': { es: 'cargando el mundo de física', en: 'loading the physics world' },
  'boot.compiling': { es: 'armando el G1: 29\u00A0articulaciones, 33,3\u00A0kg', en: 'building the G1: 29\u00A0joints, 33.3\u00A0kg' },
  'boot.policy': { es: 'cargando la política entrenada', en: 'loading the trained policy' },
  'boot.failed': { es: 'No se pudo cargar el robot. Recarga la página.', en: 'The robot could not load. Reload the page.' },
  'sim.contacts': { es: 'contactos', en: 'contacts' },
  'sim.rates': { es: 'MuJoCo {hz}/{policy} Hz', en: 'MuJoCo {hz}/{policy} Hz' },
  'sim.info': {
    es: 'Física 250\u00A0Hz: MuJoCo resuelve gravedad, contactos y torques cada 4\u00A0ms. Política 50\u00A0Hz: la red actualiza motores cada 20\u00A0ms. t: tiempo sim; contactos: puntos activos.',
    en: 'Physics 250\u00A0Hz: MuJoCo solves gravity, contacts and torques every 4\u00A0ms. Policy 50\u00A0Hz: the neural net updates motors every 20\u00A0ms. t: sim time; contacts: active points.',
  },

  // Top bar & Footer Studio links
  'nav.home': { es: 'Tridi, volver arriba', en: 'Tridi, back to top' },
  'nav.simulations': { es: 'Simulaciones', en: 'Simulations' },
  'nav.milestones': { es: 'Avances', en: 'Milestones' },
  'nav.menu': { es: 'Menú de navegación', en: 'Navigation menu' },
  'nav.tryLive': { es: 'Abrir Studio', en: 'Open Studio' },
  'nav.live': { es: 'Cámara en vivo', en: 'Live Camera' },
  'nav.upload': { es: 'Subir video', en: 'Upload Video' },
  'nav.delivery': { es: 'Entregas', en: 'Deliveries' },
  'nav.assembler': { es: 'Assembler', en: 'Assembler' },

  // Hero
  'hero.title': { es: 'Robots que aprenden <em>de cualquier video</em>', en: 'Robots that learn <em>from any video</em>' },
  'hero.lede': {
    es: 'Filma un movimiento o conecta tu hardware. Tridi entrena humanoides y robots físicos en simulación real hasta transferir su política.',
    en: 'Film a motion or bring your hardware. Tridi trains humanoids and physical robots in real physics until the policy transfers.',
  },
  'hero.ledeShort': { es: 'Políticas ONNX y datos entrenados en física real para humanoides y cualquier robot físico.', en: 'ONNX policies and training data in real physics for humanoids and any physical robot.' },
  'hero.how': { es: 'Cómo funciona', en: 'How it works' },
  'hero.step1': { es: 'Cualquier video', en: 'Any video' },
  'hero.step1Short': { es: 'Video', en: 'Video' },
  'hero.step2': { es: 'Esqueleto 3D', en: '3D skeleton' },
  'hero.step3': { es: 'El robot practica', en: 'Robot practices' },
  'hero.step3Short': { es: 'Práctica', en: 'Practice' },
  'hero.push': { es: 'Empújalo', en: 'Push it' },
  'key.space': { es: 'espacio', en: 'space' },
  'hero.howLink': { es: 'Cómo aprende', en: 'How it learns' },
  'hud.stand': { es: 'En vivo · de pie', en: 'Live · standing' },
  'hud.push': { es: 'Empujón {n} N', en: '{n} N push' },
  'hud.fall': { es: 'Cayó · levantándose', en: 'Fell · recovering' },
  'hud.tally': { es: '{pushes} empujones · {falls} caídas', en: '{pushes} pushes · {falls} falls' },

  // Capture
  'capture.videoCaption': { es: 'Video de celular · Mixkit', en: 'Phone video · Mixkit' },
  'capture.videoShort': { es: 'Video', en: 'Video' },
  'capture.skeletonCaption': { es: 'Esqueleto 3D · el cuerpo entero', en: '3D skeleton · the whole body' },
  'capture.skeletonShort': { es: 'Esqueleto 3D', en: '3D skeleton' },
  'capture.title': { es: 'Del video al cuerpo del robot', en: 'From video to the robot’s body' },
  'capture.titleShort': { es: 'Del video al robot', en: 'From video to robot' },
  'capture.text': {
    es: 'Extraemos el esqueleto 3D de la persona y lo mapeamos a las articulaciones del robot. Aquí solo copia la pose, sin física.',
    en: 'We extract the person’s 3D skeleton and map it onto the robot’s joints. Here it only copies the pose, with no physics.',
  },
  'capture.textShort': { es: 'Esqueleto 3D de la persona mapeado a las 29\u00A0articulaciones del robot.', en: 'The person’s 3D skeleton, mapped onto the robot’s 29\u00A0joints.' },

  // Gym
  'gym.title': { es: 'Practica hasta no caerse', en: 'Practices until it stops falling' },
  'gym.stepsLabel': { es: 'pasos de<br>práctica', en: 'practice<br>steps' },
  'gym.lede': {
    es: 'Millones de intentos con gravedad, contacto y fricción reales. El video dice qué hacer; la física enseña cómo.',
    en: 'Millions of tries with real gravity, contact and friction. The video says what to do; physics teaches it how.',
  },
  'gym.ledeShort': { es: 'Lo empujamos, se cae y lo vuelve a intentar.', en: 'We push it, it falls, it tries again.' },
  'gym.stages': { es: 'Etapas del entrenamiento', en: 'Training stages' },
  'gym.stepsAt': { es: '{n} pasos', en: '{n} steps' },
  'gym.upOf': { es: '<b>{s}</b> de pie, de 20\u00A0s', en: '<b>{s}</b> standing, of 20\u00A0s' },
  'gym.pushesOf': { es: '<b>{held}</b> empujones de {n}\u00A0N', en: '<b>{held}</b> pushes of {n}\u00A0N held' },
  'gym.force': { es: 'Fuerza', en: 'Force' },
  'gym.capZero': { es: 'Etapa 0: cae sin empujón', en: 'Stage 0: falls with no push' },
  'gym.capHold': { es: 'Etapa {label}: soporta ≤\u00A0{max}\u00A0N', en: 'Stage {label}: holds ≤\u00A0{max}\u00A0N' },
  'gym.standing': { es: 'de pie', en: 'standing' },
  'gym.live': { es: 'en vivo', en: 'live' },
  'gym.pushed': { es: 'empujón de {n}\u00A0N', en: '{n}\u00A0N push' },
  'gym.fell': { es: 'se cayó · lo levantamos', en: 'fell · standing it up' },
  'gym.hint': { es: '<kbd>enter</kbd> o baja para entrenarlo más', en: '<kbd>enter</kbd> or scroll to train it more' },
  'stage.0.verdict': { es: 'Equilibrio', en: 'Balance' },
  'stage.0.text': { es: 'Se mantiene de pie; un empujón fuerte lo tumba.', en: 'Stands upright; a hard push knocks it over.' },
  'stage.1.verdict': { es: 'Estable', en: 'Stable' },
  'stage.1.text': { es: 'Da pasos y gira para resistir empujones.', en: 'Steps and pivots to recover from pushes.' },
  'stage.2.verdict': { es: 'Firme', en: 'Steady' },
  'stage.2.text': { es: 'Absorbe impactos desde cualquier ángulo.', en: 'Absorbs shoves from any angle cleanly.' },

  // Policy
  'policy.title': { es: 'La política entrenada y los datos', en: 'The trained policy and motion data' },
  'policy.titleShort': { es: 'La política y los datos', en: 'The policy and the data' },
  'policy.lede': {
    es: 'Red neuronal compacta en ONNX que coordina los motores en tiempo real, escalando según la habilidad y el robot.',
    en: 'A compact ONNX neural network coordinating actuators in real time, scaling with skill complexity and robot model.',
  },
  'policy.ledeShort': {
    es: 'Red neuronal ONNX que coordina cada motor en tiempo real.',
    en: 'Compact ONNX policy coordinating every actuator in real time.',
  },
  'policy.size': { es: 'según complejidad (ONNX)', en: 'by skill complexity (ONNX)' },
  'policy.sizeShort': { es: 'ONNX', en: 'ONNX' },
  'policy.motors': { es: 'cuerpo y manos 5 dedos', en: 'body & 5-finger hands' },
  'policy.motorsShort': { es: 'Motores', en: 'Joints' },
  'policy.rate': { es: 'ciclo (4–20\u00A0ms / paso)', en: 'loop (4–20\u00A0ms / step)' },
  'policy.rateShort': { es: 'Ciclo', en: 'Rate' },
  'policy.latency': { es: 'inferencia CPU por paso', en: 'CPU inference per step' },
  'policy.latencyShort': { es: 'Latencia', en: 'Latency' },
  'policy.cta': { es: 'Ver los datos entrenados →', en: 'See the trained data →' },

  // Phone arrows
  'arrows.label': { es: 'Secciones', en: 'Sections' },
  'arrows.up': { es: 'Sección anterior', en: 'Previous section' },
  'arrows.down': { es: 'Sección siguiente', en: 'Next section' },
});
