// Development page of physics/: the G1 standing in MuJoCo, simulated in the browser, and copying
// you when the camera is on.
import {
  createSimView,
  generateMujocoXml,
  getPreset,
  listComponents,
  parseArduinoSketch,
  registerComponent,
  validateHardwarePinout,
} from './index.js';
import lab4SketchText from '../models/luigi_lab4/firmware/LAB4_Robot_Explorador_Autonomo.ino?raw';

// The RobotMotion of Juan's walking clip (npm run retarget), played on the robot.
// The trained policies of training/ (policy.onnx + policy.json each), by name.
const POLICY_URLS = import.meta.glob('../../training/policies/*.{onnx,json}', { query: '?url', import: 'default', eager: true });
const policyUrl = (name, ext) => POLICY_URLS[`../../training/policies/${name}.${ext}`];
const WALK_URL = new URL('../motions/clip_2026-10-23_caminar-perfil_01.json', import.meta.url).href;

const $ = (id) => document.getElementById(id);

function showProgress({ done, total, bytes }) {
  $('progress-bar').style.width = `${(100 * done) / total}%`;
  $('progress-text').textContent = `Cargando MuJoCo y el robot: ${done} de ${total} archivos · ${(bytes / 1e6).toFixed(1)} MB`;
}

async function start() {
  let view;
  try {
    view = await createSimView($('view'), {
      onProgress: showProgress,
      onStats: ({ realtime, pelvisHeight, puppet, policy }) => {
        const { model } = view.sim;
        $('stats').textContent = puppet
          ? `${model.nu} motores · reproduciendo un movimiento, sin dinámica · pelvis a ${pelvisHeight.toFixed(2)} m`
          : `${model.nu} motores${policy ? ` · política ${policy}` : ''} · ${Math.round(1 / model.opt.timestep)} pasos/s de física · tiempo real x${realtime.toFixed(2)} · pelvis a ${pelvisHeight.toFixed(2)} m`;
      },
    });
  } catch (error) {
    $('progress-text').textContent = `No se pudo cargar: ${error.message}`;
    $('loading').classList.add('error');
    throw error;
  }
  $('loading').hidden = true;
  // In development the console can drive the robot (view.mimic with a made-up pose) without a camera.
  if (import.meta.env.DEV) window.tridi = view;
  for (const id of ['robot-model', 'catalog-toggle', 'camera', 'clip', 'policy', 'push', 'reset']) $(id).disabled = false;

  // Demo controller for Luigi Lab 4 (active SG90 neck radar + differential drive) and Industrial Factory Cell
  let demoTimer = null;
  function stopDemoLoop() {
    if (demoTimer) {
      clearInterval(demoTimer);
      demoTimer = null;
    }
    view.sim.sensorReadout = null;
  }

  function startSceneDemo(sceneFile) {
    stopDemoLoop();
    stopCamera();
    view.sim.policy?.dispose();
    view.sim.policy = null;
    view.sim.load(sceneFile, 'home');
    view.viewer.rebuild();
    if (sceneFile.startsWith('luigi_lab4/') || sceneFile.startsWith('luigi_lab3/')) {
      view.viewer.targetHeight = 0.12;
      view.viewer.camera.position.set(1.1, 0.65, -0.95);
      const isLab4 = sceneFile.startsWith('luigi_lab4/');
      demoTimer = setInterval(() => {
        const t = view.sim.data.time;
        const { qpos, ctrl } = view.sim.data;
        ctrl[0] = 12.5 + 3.5 * Math.sin(t * 0.9);
        ctrl[1] = 12.5 - 3.5 * Math.sin(t * 0.9);
        if (isLab4 && view.sim.model.nu >= 3) {
          ctrl[2] = 1.15 * Math.sin(t * 2.8); // continuous SG90 neck scan ±66 deg
        }
        const [qw, qx, qy, qz] = [qpos[3], qpos[4], qpos[5], qpos[6]];
        const bodyYaw = Math.atan2(2 * (qw * qz + qx * qy), 1 - 2 * (qy * qy + qz * qz));
        const neckYaw = isLab4 && view.sim.model.nq >= 10 ? qpos[9] : 0;
        const yaw = bodyYaw + neckYaw;
        const off = isLab4 ? 0.18 : 0.155;
        view.sim.sensorReadout = {
          sx: qpos[0] + off * Math.cos(bodyYaw),
          sy: qpos[1] + off * Math.sin(bodyYaw),
          sz: qpos[2] + 0.015,
          yaw,
          rays: [0.85, 0.95, 1.05, 1.1, 1.05, 0.95, 0.85],
          distCm: 95,
          dodgeStage: 0,
        };
      }, 20);
    } else if (sceneFile.startsWith('factory_cell/')) {
      view.viewer.targetHeight = 0.35;
      view.viewer.camera.position.set(1.55, 0.95, -1.25);
      demoTimer = setInterval(() => {
        const t = view.sim.data.time;
        const phase = t % 4.0;
        const { ctrl } = view.sim.data;
        // Timed 3-stage packaging cycle: 1) feed box to sealer -> 2) clamp & seal -> 3) advance & push
        if (phase < 1.4) {
          ctrl[0] = 0.55; // move package under sealer gantry (x = +0.10 m)
          ctrl[1] = 0.0;
          ctrl[2] = 0.0;
        } else if (phase < 2.6) {
          ctrl[0] = 0.55;
          ctrl[1] = 0.15; // lateral positioning gate holds box aligned
          ctrl[2] = 0.14; // vertical heat-sealer presses down
        } else if (phase < 3.5) {
          ctrl[0] = 0.92; // discharge sealed box to exit sensor
          ctrl[1] = 0.0;
          ctrl[2] = 0.0;
        } else {
          ctrl[0] = -0.10; // reset carrier for next package
          ctrl[1] = 0.0;
          ctrl[2] = 0.0;
        }
      }, 20);
    } else {
      view.viewer.targetHeight = 0.75;
      view.viewer.camera.position.set(2.6, 1.5, -1.6);
    }
  }

  $('robot-model').onchange = (e) => startSceneDemo(e.target.value);

  // Render P-1 Hardware Catalog & P-3 Assembler drawer
  function renderCatalog() {
    const bucket = $('cat-filter').value || undefined;
    const items = listComponents({ bucket });
    $('cat-list').innerHTML = items
      .map(
        (c) => `<div class="cat-card">
          <div><strong>${c.name}</strong> <span class="badge">${c.category}</span></div>
          <div class="cat-meta">id: <code>${c.id}</code> · masa: ${c.mujoco?.mass_kg ?? '—'} kg${
            c.mcu?.deadzone_pwm ? ` · deadzone PWM: ${c.mcu.deadzone_pwm}` : ''
          }${c.mcu?.locks_timer_on_arduino_uno ? ` · bloquea ${c.mcu.locks_timer_on_arduino_uno}` : ''}</div>
        </div>`,
      )
      .join('');
  }
  renderCatalog();
  $('cat-filter').onchange = renderCatalog;
  $('catalog-toggle').onclick = () => {
    $('assembler-drawer').hidden = !$('assembler-drawer').hidden;
  };
  $('close-drawer').onclick = () => {
    $('assembler-drawer').hidden = true;
  };
  $('add-comp-form').onsubmit = (e) => {
    e.preventDefault();
    try {
      const comp = registerComponent({
        id: $('comp-id').value.trim(),
        name: $('comp-name').value.trim(),
        category: $('comp-cat').value,
        mujoco: {
          joint_type: 'hinge',
          kp: Number($('comp-kp').value) || 5.0,
          forcerange: [-Number($('comp-force').value), Number($('comp-force').value)],
          mass_kg: 0.055,
        },
      });
      renderCatalog();
      $('assembler-out').textContent = `Componente registrado en [${comp.bucket}]:\n` + JSON.stringify(comp, null, 2);
      $('comp-id').value = '';
      $('comp-name').value = '';
    } catch (err) {
      $('assembler-out').textContent = `Error: ${err.message}`;
    }
  };
  $('run-assembler-lab4').onclick = () => {
    const parsed = parseArduinoSketch(lab4SketchText);
    const pinCheck = validateHardwarePinout('arduino_uno', getPreset('luigi_lab4').pinout);
    const compiled = generateMujocoXml({ preset: 'luigi_lab4', modelName: 'assembled_lab4' });
    view.sim.files['luigi_lab4/assembled_lab4.xml'] = new TextEncoder().encode(compiled.robotXml);
    view.sim.files['luigi_lab4/assembled_scene.xml'] = new TextEncoder().encode(compiled.sceneXml);
    $('robot-model').value = 'luigi_lab4/scene.xml';
    startSceneDemo('luigi_lab4/assembled_scene.xml');
    $('assembler-out').textContent = JSON.stringify(
      {
        sketch_parsed: {
          pinout: parsed.pinout,
          bottlenecks_found: parsed.bottlenecks,
        },
        hardware_validation: pinCheck,
        mujoco_compiled: {
          model: compiled.modelName,
          nq: compiled.nq,
          nu: compiled.nu,
          meshes: compiled.meshes.map((m) => `${m.file} -> ${m.role}`),
        },
      },
      null,
      2,
    );
  };
  $('push').onclick = () => {
    stopCamera();
    view.push();
  };
  $('reset').onclick = () => {
    stopCamera();
    view.reset();
  };
  $('camera').onclick = () => (live ? stopCamera() : startCamera());
  $('policy').onchange = async (event) => {
    const name = event.target.value;
    stopCamera();
    $('policy').disabled = true;
    $('camera-stats').textContent = name ? 'Cargando la política (la primera vez baja 14 MB)…' : '';
    try {
      if (name) await view.loadPolicy(policyUrl(name, 'onnx'), policyUrl(name, 'json'));
      else view.clearPolicy();
      $('camera-stats').textContent = '';
    } catch (error) {
      $('camera-stats').textContent = `No se pudo cargar la política: ${error.message}`;
      event.target.value = '';
      console.error(error);
    } finally {
      $('policy').disabled = false;
    }
  };
  $('clip').onclick = async () => {
    stopCamera();
    view.playClip(await (await fetch(WALK_URL)).json());
  };

  let live = null;
  let cameraStats = { frames: 0, since: performance.now(), residual: 0 };

  function stopCamera() {
    if (!live) return;
    live.stop();
    live = null;
    view.reset();
    $('camera-box').hidden = true;
    $('camera-stats').textContent = '';
    $('camera').textContent = 'Cámara';
    $('camera').classList.remove('on');
  }

  async function startCamera() {
    const button = $('camera');
    button.disabled = true;
    const say = (text) => ($('camera-stats').textContent = text);
    say('Cargando el modelo de pose…');
    try {
      // MediaPipe is only downloaded when the camera is asked for.
      const { createLiveCapture, drawSkeleton, CameraError } = await import('tridi-live');
      const overlay = $('camera-overlay');
      const ctx = overlay.getContext('2d');
      try {
        live = await createLiveCapture($('camera-video'), {
          onProgress: ({ stage, done }) => say(stage === 'model' ? (done ? 'Modelo listo, abriendo la cámara…' : 'Cargando el modelo de pose…') : 'Esperando permiso de la cámara…'),
          onPose: (pose) => {
            const video = $('camera-video');
            if (overlay.width !== video.videoWidth) [overlay.width, overlay.height] = [video.videoWidth, video.videoHeight];
            ctx.clearRect(0, 0, overlay.width, overlay.height);
            if (pose) drawSkeleton(ctx, pose.landmarks, pose.visible);
            const { tracked, residual } = view.mimic(pose);
            cameraStats.frames++;
            if (tracked) cameraStats.residual = residual;
            const elapsed = (performance.now() - cameraStats.since) / 1000;
            if (elapsed >= 1) {
              const body = !pose ? 'no te veo' : !pose.visible ? 'tápate menos' : `error de alcance ${(cameraStats.residual * 100).toFixed(1)} cm`;
              say(`cámara ${Math.round(cameraStats.frames / elapsed)} fps · ${body}`);
              cameraStats = { frames: 0, since: performance.now(), residual: cameraStats.residual };
            }
          },
        });
      } catch (error) {
        if (error instanceof CameraError) return say(error.message);
        throw error;
      }
      $('camera-box').hidden = false;
      button.textContent = 'Apagar cámara';
      button.classList.add('on');
    } catch (error) {
      say(`No se pudo iniciar la cámara: ${error.message}`);
      console.error(error);
    } finally {
      button.disabled = false;
    }
  }
}

start();
