// The training box's copy in every language (src/i18n.js), shared by Subir and Simulaciones.
import { dict } from './i18n.js';

export const { T, t, L } = dict({
  noServer: { es: 'Para entrenar hace falta el servidor de videos, y ahora no está encendido.', en: 'Training needs the video server, and it is not on right now.' },
  lowValid: {
    es: 'El cuerpo se ve en el {got} % de los cuadros y para entrenar hace falta el {need} %: graba con los hombros, los brazos y las manos en cuadro.',
    en: 'The body is visible in {got} % of the frames and training needs {need} %: record with your shoulders, arms and hands in frame.',
  },
  failed: { es: 'El entrenamiento falló.', en: 'The training failed.' },
  lost: { es: 'Se perdió la conexión con el servidor de videos.', en: 'The connection to the video server was lost.' },
  stepQueued: { es: 'En la cola', en: 'In the queue' },
  stepRetarget: { es: 'Pasar tu movimiento al robot', en: 'Map your motion onto the robot' },
  stepTraining: { es: 'Practicar con física', en: 'Practice with physics' },
  stepData: { es: 'Probar en 4 mundos y armar la entrega', en: 'Test in 4 worlds and build the delivery' },
  title: { es: 'Entrenar al robot con este movimiento', en: 'Train the robot on this motion' },
  idle: {
    es: 'Aquí el robot solo repite tu movimiento. Al entrenarlo, aprende a hacerlo con física, y te llevas la política y los datos. Tarda unos 30 minutos en el servidor.',
    en: 'Here the robot only replays your motion. Training it teaches it to do it with physics, and you get the policy and the data. It takes about 30 minutes on the server.',
  },
  start: { es: 'Entrenar al robot', en: 'Train the robot' },
  example: { es: 'Ver los datos entrenados →', en: 'See trained data →' },
  netLink: { es: 'Ver la red en pantalla grande ↗', en: 'See the network full screen ↗' },
  note: {
    es: 'Puedes seguir moviéndote o grabar otro mientras tanto: el entrenamiento sigue en el servidor aunque cierres esta página, hasta que lo canceles.',
    en: 'You can keep moving or record another one meanwhile: the training keeps going on the server even if you close this page, until you cancel it.',
  },
  cancel: { es: 'Cancelar el entrenamiento', en: 'Cancel the training' },
  delivery: { es: 'Ver la entrega', en: 'See the delivery' },
  retry: { es: 'Reintentar', en: 'Retry' },
  lessThanMinute: { es: 'menos de un minuto', en: 'less than a minute' },
  aboutMin: { es: 'unos {n} min', en: 'about {n} min' },
  sending: { es: 'Mandando tu clip al servidor…', en: 'Sending your clip to the server…' },
  joining: { es: 'Entrando a la cola…', en: 'Joining the queue…' },
  aheadOne: { es: 'Hay 1 entrenamiento antes que el tuyo. ', en: '1 training ahead of yours. ' },
  aheadMany: { es: 'Hay {n} entrenamientos antes que el tuyo. ', en: '{n} trainings ahead of yours. ' },
  next: { es: 'Es el siguiente. ', en: 'Yours is next. ' },
  endsIn: { es: 'Termina en {eta}.', en: 'Done in {eta}.' },
  step: { es: 'Paso {at} de {total}', en: 'Step {at} of {total}' },
  follows: { es: 'sigue {followed} s de {duration} s del clip', en: 'follows {followed} s of the clip’s {duration} s' },
  endsInLower: { es: 'termina en {eta}', en: 'done in {eta}' },
  doneError: { es: 'Entrenado, pero la entrega no se armó: {error}', en: 'Trained, but the delivery was not built: {error}' },
  done: {
    es: 'Listo: el robot sigue {followed} s de los {duration} s de tu clip. En la entrega están la política, los datos y la prueba en 4 mundos.',
    en: 'Done: the robot follows {followed} s of your clip’s {duration} s. The delivery has the policy, the data and the test in 4 worlds.',
  },
  confirm: { es: '¿Cancelar este entrenamiento? Se detiene en el servidor y se pierde lo que lleva.', en: 'Cancel this training? It stops on the server and what it has learned so far is lost.' },
});
