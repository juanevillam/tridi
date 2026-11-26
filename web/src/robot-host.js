// The one G1 of the app. Loading it costs 30 MB of downloads plus compiling MuJoCo, the model
// and the shaders, so it happens once, when the page opens (main.js starts it; the robot panes
// show its progress). Screens borrow its canvas: attach() moves it into their pane, and leaving the
// screen takes it out, where physics/ pauses it. A WebGL context survives being moved.
import { createSimView, WORLDS } from 'tridi-physics';
import { FINAL_LEVEL, policyUrls } from './policies.js';
import { clearStageProps } from './props.js';
import { SCENE_THEME } from './skeleton.js';

const canvas = document.createElement('canvas');
canvas.className = 'robot-canvas';
canvas.setAttribute('role', 'img');
canvas.setAttribute('aria-label', '3D MuJoCo physics simulation viewport');

let ready = null;
let view = null;
let activeAttachment = 0;
let attachQueue = Promise.resolve();
let progress = { done: 0, total: 1, compiling: false };
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener(progress));

/** Starts loading the robot (once) and returns the promise of its view. */
export function loadRobot() {
  ready ??= createSimView(canvas, {
    theme: SCENE_THEME,
    onProgress: ({ done, total }) => {
      // After the last file, MuJoCo still compiles the model: say so instead of a stuck 100 %.
      progress = { done, total, compiling: done === total };
      notify();
    },
  })
    .then(async (loaded) => {
      // The trained policy comes with the robot, so "Empujar" shows it recovering anywhere. It
      // swaps in the policy's own model of the G1, hence here, once.
      progress = { ...progress, compiling: true, policy: true };
      notify();
      try {
        const { onnx, json } = policyUrls(FINAL_LEVEL);
        await loaded.loadPolicy(onnx, json);
      } catch (error) {
        console.error(error); // the robot still stands with its stiff motors
      }
      return loaded;
    })
    .then((loaded) => (view = loaded));
  return ready;
}

/** Calls `listener` with { done, total, compiling, policy } now and as loading moves on; returns unsubscribe. */
export function onRobotProgress(listener) {
  listeners.add(listener);
  listener(progress);
  return () => listeners.delete(listener);
}

/**
 * Puts the robot's canvas into `pane` (before its other children) and, once loaded, hands the
 * view over standing and playing at normal speed, whatever the previous screen left.
 * @returns {{ ready: Promise<object>, detach(): void }}
 */
export function attachRobot(pane) {
  pane.prepend(canvas);
  const token = ++activeAttachment;
  let attached = true;
  const stillActive = () => attached && token === activeAttachment;
  view?.cancelPending?.();
  const handed = (attachQueue = attachQueue
    .catch(() => {})
    .then(() => loadRobot())
    .then(async (loaded) => {
      if (!stillActive()) return null;
      await loaded.cancelPending?.();
      if (!stillActive()) return null;
      const onSims = /^\/(simulations|simulaciones)(\/|$)/.test(location.pathname) || /^#\/(simulations|simulaciones)(\/|$)/.test(location.hash);
      if (!onSims) {
        clearStageProps(loaded);
        if (loaded.scene?.()) {
          await loaded.setScene(null);
          if (!stillActive()) return null;
        }
        if (loaded.world?.() && loaded.world().id !== 'plano') {
          await loaded.setWorld(WORLDS.find((world) => world.id === 'plano'));
          if (!stillActive()) return null;
        }
        const nonG1Policy = Boolean(loaded.sim?.policy?.robot && loaded.sim.policy.robot !== 'unitree_g1');
        const customScene = /^(unitree_h1|luigi_lab3|luigi_lab4|factory_cell)\//.test(loaded.sim?.sceneFile ?? '');
        // Restore FINAL_LEVEL whenever sim.policy is missing (even if G1 nq >= 36) so the robot never lacks balance control.
        const missingPolicy = !loaded.sim?.policy;
        const nonFinalPolicy = Boolean(loaded.sim?.policy?.id && loaded.sim.policy.id !== FINAL_LEVEL);
        if (nonG1Policy || customScene || missingPolicy || nonFinalPolicy) {
          try {
            const { onnx, json } = policyUrls(FINAL_LEVEL);
            await loaded.loadPolicy(onnx, json);
          } catch (error) {
            console.error(error);
          }
          if (!stillActive()) return null;
        }
      }
      loaded.stop(); // ends a clip or a camera copy and stands the robot up
      loaded.setSpeed(1);
      loaded.play();
      return loaded;
    }));
  return {
    ready: handed,
    detach() {
      attached = false;
      view?.cancelPending?.();
      if (canvas.parentNode === pane) canvas.remove();
    },
  };
}

/** The robot's view if it has loaded, else null. */
export const robotView = () => view;
