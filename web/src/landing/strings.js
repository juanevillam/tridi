// The landing's copy in every language (src/i18n.js). English is the original, written for a US
// robotics team; Spanish is translated from it. Keys are grouped by chapter. Every claim here must be
// backed by yc/verdad-hoy.md and the "true today" table in docs/pitch/pitch-producto.md.
import { dict } from '../i18n.js';

export const { T, t, A } = dict({
  // Boot and simulation readout
  'boot.world': { es: 'cargando el mundo de física', en: 'loading the physics world' },
  'boot.compiling': { es: 'armando el G1: 29 articulaciones, 33,3 kg', en: 'building the G1: 29 joints, 33.3 kg' },
  'boot.policy': { es: 'cargando la política entrenada', en: 'loading the trained policy' },
  'boot.failed': { es: 'No se pudo cargar el robot. Recarga la página.', en: 'The robot could not load. Reload the page.' },
  'sim.contacts': { es: 'contactos', en: 'contacts' },
  'sim.rates': { es: 'MuJoCo · física {hz} Hz · política {policy} Hz', en: 'MuJoCo · physics {hz} Hz · policy {policy} Hz' },
  'sim.info': {
    es: 'Física 250 Hz: MuJoCo resuelve gravedad, contactos y torques 250 veces/s (cada 4 ms). Política 50 Hz: la red neuronal actualiza los motores 50 veces/s (cada 20 ms). t: tiempo simulado; contactos: puntos de apoyo activos.',
    en: 'Physics 250 Hz: MuJoCo solves gravity, contacts and joint torques 250 times/s (every 4 ms). Policy 50 Hz: the neural network updates motor targets 50 times/s (every 20 ms). t: simulation time; contacts: active collision points.',
  },

  // Top bar
  'nav.home': { es: 'Tridi, inicio', en: 'Tridi, home' },
  'nav.product': { es: 'Producto', en: 'Product' },
  'nav.try': { es: 'Probar', en: 'Try it' },
  'nav.tryLive': { es: ' en vivo', en: ' live' },

  // Hero
  'hero.live': { es: 'Simulación en vivo · Unitree G1 · MuJoCo', en: 'Live simulation · Unitree G1 · MuJoCo' },
  'hero.title': { es: 'Robots que aprenden <em>de cualquier video</em>', en: 'Robots that learn <em>from any video</em>' },
  'hero.lede': {
    es: 'Grabas a una persona moviéndose. Tridi lo convierte en datos de entrenamiento: un humanoide practica el movimiento en física real hasta no caerse.',
    en: 'Film a person moving. Tridi turns it into training data: a humanoid practices the motion in real physics until it stops falling.',
  },
  'hero.ledeShort': { es: 'Cualquier video de una persona, convertido en datos para entrenar humanoides.', en: 'Any video of a person, turned into training data for humanoids.' },
  'hero.how': { es: 'Cómo funciona', en: 'How it works' },
  'hero.step1': { es: 'Cualquier video', en: 'Any video' },
  'hero.step1Short': { es: 'Video', en: 'Video' },
  'hero.step2': { es: 'Esqueleto 3D', en: '3D skeleton' },
  'hero.step3': { es: 'El robot practica', en: 'Robot practices' },
  'hero.step3Short': { es: 'Práctica', en: 'Practice' },
  'hero.push': { es: 'Empújalo', en: 'Push it' },
  'key.space': { es: 'espacio', en: 'space' },
  'hero.howLink': { es: 'Cómo aprende', en: 'How it learns' },
  'hud.stand': { es: 'Física real · de pie con su política', en: 'Real physics · standing on its policy' },
  'hud.push': { es: 'Empujón de {n} N · la política lo atrapa', en: '{n} N push · the policy catches it' },
  'hud.fall': { es: 'Esta vez se cayó. También pasa: se levanta y lo vuelve a intentar', en: 'It fell this time. That happens too: it gets up and tries again' },
  'hud.tally': { es: '{pushes} empujones · {falls} caídas', en: '{pushes} pushes · {falls} falls' },

  // Capture
  'capture.videoCaption': { es: 'Video de celular · Mixkit', en: 'Phone video · Mixkit' },
  'capture.videoShort': { es: 'Video', en: 'Video' },
  'capture.skeletonCaption': { es: 'Esqueleto 3D · el cuerpo entero', en: '3D skeleton · the whole body' },
  'capture.skeletonShort': { es: 'Esqueleto 3D', en: '3D skeleton' },
  'capture.title': { es: 'Del video al cuerpo del robot', en: 'From a video to the robot’s body' },
  'capture.titleShort': { es: 'Del video al robot', en: 'From video to robot' },
  'capture.text': {
    es: 'Sacamos el esqueleto 3D de la persona y lo pasamos a las 29 articulaciones del robot. Aquí solo copia el movimiento, sin física.',
    en: 'We extract the person’s 3D skeleton and map it onto the robot’s 29 joints. Here it only copies the motion, with no physics.',
  },
  'capture.textShort': { es: 'El esqueleto 3D de la persona, pasado a las 29 articulaciones del robot.', en: 'The person’s 3D skeleton, mapped onto the robot’s 29 joints.' },

  // Gym
  'gym.title': { es: 'Practica hasta no caerse', en: 'It practices until it stops falling' },
  'gym.stepsLabel': { es: 'pasos de<br>práctica', en: 'practice<br>steps' },
  'gym.lede': {
    es: 'Millones de intentos con gravedad, contacto y fricción reales. El video dice qué hacer; la física le enseña cómo.',
    en: 'Millions of tries with real gravity, contact and friction. The video says what to do; physics teaches it how.',
  },
  'gym.ledeShort': { es: 'Lo empujamos, se cae y lo vuelve a intentar.', en: 'We push it, it falls, it tries again.' },
  'gym.stages': { es: 'Etapas del entrenamiento', en: 'Training stages' },
  'gym.stepsAt': { es: '{n} pasos', en: '{n} steps' },
  'gym.upOf': { es: '<b>{s}</b> de pie, de 20 s', en: '<b>{s}</b> standing, of 20 s' },
  'gym.pushesOf': { es: '<b>{held}</b> empujones de {n} N', en: '<b>{held}</b> pushes of {n} N held' },
  'gym.standing': { es: 'de pie', en: 'standing' },
  'gym.live': { es: 'en vivo', en: 'live' },
  'gym.pushed': { es: 'empujón de {n} N', en: '{n} N push' },
  'gym.fell': { es: 'se cayó · lo levantamos', en: 'fell · standing it up' },
  'gym.hint': { es: '<kbd>enter</kbd> o baja para entrenarlo más', en: '<kbd>enter</kbd> or scroll to train it more' },
  'stage.0.verdict': { es: 'No sirve', en: 'Useless' },
  'stage.0.text': { es: 'Se cae en un segundo.', en: 'Falls within a second.' },
  'stage.1.verdict': { es: 'A medias', en: 'Halfway' },
  'stage.1.text': { es: 'Se para, pero un empujón lo tumba.', en: 'Stands up, but one push knocks it over.' },
  'stage.2.verdict': { es: 'Estable', en: 'Stable' },
  'stage.2.text': { es: 'Aguanta todo, pero girando sobre un pie.', en: 'Holds every push, but by pivoting on one foot.' },
  'stage.3.verdict': { es: 'Quieto', en: 'Steady' },
  'stage.3.text': { es: 'Estable y sin girar. Es el de arriba.', en: 'Stable and no pivoting. It is the one at the top.' },

  // Policy
  'policy.title': { es: 'Te llevas la política entrenada y los datos', en: 'You get the trained policy and the motion data' },
  'policy.titleShort': { es: 'La política y los datos', en: 'The policy and the data' },
  'policy.lede': {
    es: 'Una red neuronal compacta exportada a ONNX que coordina los motores del robot en tiempo real. El peso y la frecuencia escalan según la complejidad de la habilidad y el robot.',
    en: 'A compact neural network exported to ONNX that coordinates the robot’s actuators in real time. Network size and control rate scale with skill complexity and robot morphology.',
  },
  'policy.size': { es: 'según la complejidad de la habilidad (ONNX)', en: 'scales with skill complexity (ONNX)' },
  'policy.sizeShort': { es: 'según habilidad', en: 'by complexity' },
  'policy.motors': { es: 'actuadores coordinados (cuerpo y manos 5 dedos)', en: 'actuators coordinated (body & 5-finger hands)' },
  'policy.motorsShort': { es: 'grados de libertad', en: 'degrees of freedom' },
  'policy.rate': { es: 'frecuencia de control (4–20 ms por decisión)', en: 'control loop frequency (4–20 ms per step)' },
  'policy.rateShort': { es: 'ciclo de control', en: 'control rate' },
  'policy.latency': { es: 'inferencia en CPU por decisión', en: 'CPU inference latency per step' },
  'policy.latencyShort': { es: 'inferencia CPU', en: 'CPU inference' },
  'policy.note': { es: 'Con ella van los datos del movimiento, corregidos por la física y probados en cuatro mundos.', en: 'It ships with the motion data, corrected by physics and tested in four worlds.' },
  'policy.cta': { es: 'Ver los datos entrenados →', en: 'See the trained data →' },

  // Phone arrows
  'arrows.label': { es: 'Secciones', en: 'Sections' },
  'arrows.up': { es: 'Sección anterior', en: 'Previous section' },
  'arrows.down': { es: 'Sección siguiente', en: 'Next section' },

  // Closing
  // One sentence per line (home.js keeps the <br> when it splits the words for the animation).
  'close.manifesto': { es: 'El hardware ya existe.<br>Entrenamos la física y las políticas.', en: 'Humanoids have the hardware.<br>We train the physics and policies.' },
  'close.text': { es: 'Tridi convierte cualquier video de una persona en datos para entrenar a tu humanoide.', en: 'Tridi turns any video of a person into training data for your humanoid.' },
  'close.tries': { es: 'Probar Tridi', en: 'Try Tridi' },
  'try.live': { es: 'Muévete y el robot te copia', en: 'Move and the robot copies you' },
  'try.liveShort': { es: 'Cámara en vivo', en: 'Live camera' },
  'try.liveGo': { es: 'Abrir la cámara →', en: 'Open the camera →' },
  'try.upload': { es: 'Sube un video de una persona', en: 'Upload a video of a person' },
  'try.uploadShort': { es: 'Subir un video', en: 'Upload a video' },
  'try.uploadSub': { es: 'De perfil y con el cuerpo entero', en: 'Side view, whole body in frame' },
  'try.uploadGo': { es: 'Elegir un video →', en: 'Choose a video →' },
  'try.delivery': { es: 'La política y los datos que entregamos', en: 'The policy and data we deliver' },
  'try.deliveryShort': { es: 'La entrega', en: 'The delivery' },
  'try.deliverySub': { es: 'La política y los datos del robot', en: 'The robot’s policy and data' },
  'try.deliveryGo': { es: 'Ver la entrega →', en: 'See the delivery →' },
  'track.label': { es: 'Dónde estamos', en: 'Where we are' },
  'track.today': { es: 'Hoy', en: 'Today' },
  'track.todayWhat': { es: 'Pararse y aguantar empujones', en: 'Stand and take pushes' },
  'track.todayShort': { es: 'De pie, aguanta empujones', en: 'Stands, takes pushes' },
  'track.todayProof': { es: '{held} empujones de {n} N', en: '{held} pushes of {n} N held' },
  'track.training': { es: 'Entrenando', en: 'Training' },
  'track.walk': { es: 'Caminar como la persona del video', en: 'Walk like the person in the video' },
  'track.walkShort': { es: 'Caminar', en: 'Walk' },
  'track.walkSteps': { es: '{n} M pasos · ', en: '{n} M steps · ' },
  'track.walkProof': { es: '11,8 s caminando solo (65 % de empujones de 250 N)', en: '11.8 s walking on its own (65% of 250 N pushes)' },
  'track.next': { es: 'Lo que viene', en: 'What’s next' },
  'track.nextWhat': { es: 'Cualquier movimiento, en cualquier terreno', en: 'Any motion, on any terrain' },
  'track.nextShort': { es: 'Cualquier terreno', en: 'Any terrain' },
  'foot.madeAt': { es: 'Hecho en', en: 'Made at' },
  'foot.robot': { es: 'Robots', en: 'Robots' },
  'foot.code': { es: 'Código', en: 'Code' },
  'foot.repo': { es: 'Abierto en GitHub', en: 'Open on GitHub' },
});
