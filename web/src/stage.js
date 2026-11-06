// The simulation stage: the human skeleton of the selected clip next to the G1 from physics/,
// with one set of controls for both. The skeleton shows at once; the robot pane shows a dot
// robot until the real one has loaded (robot-pane.js).
//
// The robot repeats the clip (its RobotMotion: saved for the preloaded clips, computed here from the
// PoseClip for any other) in step with the
// skeleton, and has a trained policy loaded: "Empujar" drops the clip and shows the policy
// keeping the robot up. "Empezar de nuevo" puts both back at the start of the clip. "Mundo" puts
// the robot on another floor, grip, wind, mass and motor strength (physics/worlds); leaving the
// screen puts it back on flat ground, since the app shares one robot.
//
// For a clip with an imitation policy (policies.js IMITATIONS), "Robot entrenado con" also offers
// it: the robot then does the clip itself, with physics, from its first pose, and the skeleton
// follows the robot's clock (view.clipTime) instead of the other way around.
import { SCENES, WORLDS } from 'tridi-physics';

import { savedMotion } from './motions.js';
import { FINAL_LEVEL, IMITATIONS, imitationOf, policyUrls } from './policies.js';
import { dressWorld } from './looks/index.js';
import { dressPlace, setFloor } from './props.js';
import { mountRobotPane } from './robot-pane.js';
import { SkeletonView } from './skeleton.js';
import { createVideoOverlay } from './video-overlay.js';
import { fmt, LANGS } from './i18n.js';
import { L, S, T } from './strings-stage.js';
import { levelName, sceneName, worldName } from './strings-names.js';

// Player icons (24 px, currentColor): the playback buttons carry only an icon and a tooltip.
export const ICONS = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>',
  restart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12a7 7 0 1 0 2.1-5M5 4v4h4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
// The speed button cycles through these (1 = real time).
const SPEEDS = [1, 0.5, 0.25];

// A hidden tab or a shader compile can stall a frame; past this the skeleton skips ahead
// instead of jumping, as physics/ does for the robot.
const MAX_FRAME_S = 1 / 30;

/**
 * @param root  element holding the stage markup of screens/simulations.js
 */
export function mountStage(root) {
  const $ = (id) => root.querySelector(`#${id}`);
  const skeleton = new SkeletonView($('human'));
  const label = root.querySelector('.robot-pane .pane-label');
  // The robot is physical (policy in control) after a push; otherwise it plays the clip.
  const robot = mountRobotPane(root.querySelector('.robot-pane'), {
    beforePush() {
      copying = false;
      setRobotLabel();
    },
  });
  let playing = true;
  let speed = 1;
  let level = $('policy').value;
  let robotModel = $('robot-model')?.value ?? 'unitree_g1';
  let current = null; // { clip, title }: what the gallery selected
  let motion = null; // the RobotMotion of `current`
  let copying = false; // the robot is playing `motion`
  const motions = new Map(); // clip id -> RobotMotion, so a clip is retargeted once

  const imitating = () => imitationOf(level) !== null;
  const matchesImitation = (imitation, clipId) =>
    Boolean(imitation && clipId && (imitation.clips ? imitation.clips.includes(clipId) : imitation.clip === clipId));
  // With physics (default) the robot moves by itself: the imitation policy of the clip if there is
  // one, or standing with its policy if it has not learned this movement yet. Without physics it
  // replays the movement as a puppet, as a reference: what it would look like, not what it can do.
  let physics = true;
  const imitationFor = (clip, rModel = robotModel) =>
    IMITATIONS.find((imitation) => (imitation.robot ?? 'unitree_g1') === rModel && matchesImitation(imitation, clip?.id)) ??
    IMITATIONS.find((imitation) => matchesImitation(imitation, clip?.id)) ??
    null;
  const overlay = createVideoOverlay(root.querySelector('#human-pane'));

  // A clip moves with physics only if a policy learned it (an imitation); any other clip is shown
  // as before, the robot replaying its movement without physics.
  const withPhysics = () => physics && imitationFor(current?.clip) !== null;

  // After any change (checkpoint, world, place): the puppet replay unless the clip moves with physics.
  function resume() {
    if (!withPhysics() && motion && !imitating()) startMotion();
    else {
      copying = false;
      setRobotLabel();
    }
  }

  // With physics, a clip with an imitation policy is shown with it.
  function physicsFor(clip) {
    const imitation = imitationFor(clip);
    if (physics && imitation && level !== imitation.id) {
      $('policy').value = imitation.id;
      return loadLevel(imitation.id);
    }
    resume();
  }

  // What the world looks like (looks/): redone after every change of world or place.
  let look = null;
  function refreshLook() {
    look?.undo();
    look = robot.view ? dressWorld(robot.view) : null;
  }

  /** The robot pane's caption: `markup` (from T()) while something loads, else what the robot does. */
  function setRobotLabel(markup) {
    if (markup) return void (label.innerHTML = markup);
    const world = robot.view?.world();
    const place = robot.view?.scene();
    const names = [world && world.id !== 'plano' ? worldName(world.id, world.title) : null, place ? sceneName(place.id, place.title) : null].filter(Boolean);
    label.innerHTML = LANGS.map((l) => {
      const where = names.map((name) => ` · ${name[l].toLowerCase()}`).join('');
      const doing = imitating()
        ? L('doingImitate', {}, l)
        : copying
          ? L('doingCopy', {}, l)
          : L('doingBalance', { level: levelName(level)[l].toLowerCase() }, l);
      return `<span class="t" lang="${l}">${L('robotLine', { doing, where }, l)}</span>`;
    }).join('');
  }

  let last = performance.now();
  let frameId = requestAnimationFrame(function frame(now) {
    const wall = Math.min(MAX_FRAME_S, Math.max(0, (now - last) / 1000));
    last = now;
    // Imitating, the robot's physics sets the time and the skeleton follows it. Otherwise the
    // skeleton's clock is the stage's and the robot follows it, so the two never drift apart.
    if (imitating() && robot.view) skeleton.time = robot.view.clipTime();
    else if (playing) skeleton.advance(wall * speed);
    if (copying && robot.view) robot.view.seek(skeleton.time);
    look?.update(wall);
    overlay.sync(skeleton.time, playing, speed);
    skeleton.render();
    frameId = requestAnimationFrame(frame);
  });

  // Shows the current clip on the robot. Its RobotMotion comes from the saved ones if there is one;
  // otherwise it is computed in slices, with its progress on the label, so the page keeps working.
  async function copyCurrent() {
    const view = robot.view;
    if (!view || !current) return;
    const { clip } = current;
    if (!motions.has(clip.id)) {
      const saved = await savedMotion(clip.id);
      if (saved) motions.set(clip.id, saved);
      else {
        setRobotLabel(T('computing'));
        const computed = await view.retarget(clip, {
          onProgress: (done) => current?.clip === clip && setRobotLabel(T('computingPct', { pct: Math.round(100 * done) })),
        });
        if (!computed) return; // the user left the screen
        motions.set(clip.id, computed.motion);
      }
    }
    if (current?.clip !== clip) return; // the user chose another clip meanwhile
    motion = motions.get(clip.id);
    resume();
  }

  function startMotion() {
    if (!robot.view || !motion || imitating()) return;
    robot.view.playClip(motion);
    robot.view.seek(skeleton.time);
    copying = true;
    setRobotLabel();
  }

  // Loads a training checkpoint. It ends the clip (the robot goes physical), so the clip resumes after.
  async function loadLevel(id) {
    const view = robot.view;
    if (!view) return;
    $('policy').disabled = true;
    root.querySelector('.push').disabled = true;
    setRobotLabel(T('loadingPolicy'));
    try {
      const { onnx, json } = policyUrls(id);
      // An imitation policy also needs the RobotMotion of the clip it learned.
      const imitation = imitationOf(id);
      const motionId = imitation?.motion ?? imitation?.clip;
      const learned = imitation && (motions.get(motionId) ?? (await savedMotion(motionId)));
      await view.loadPolicy(onnx, json, imitation ? { motion: learned } : {});
      level = id;
      robotModel = imitation?.robot ?? 'unitree_g1';
      if ($('robot-model')) $('robot-model').value = robotModel;
      if (imitation) skeleton.time = 0; // the robot starts the clip from its first pose
    } catch (error) {
      console.error(error);
      $('policy').value = level;
      setRobotLabel(T('policyFailed'));
    } finally {
      $('policy').disabled = false;
      root.querySelector('.push').disabled = !robot.view; // never before the robot is there
    }
    // The user may have picked another clip while it loaded: an imitation is only for its own clip.
    if (imitating() && robotModel !== 'unitree_h1' && !matchesImitation(imitationOf(level), current?.clip.id)) {
      $('policy').value = FINAL_LEVEL;
      return loadLevel(FINAL_LEVEL);
    }
    copying = false;
    resume();
  }

  // Another world: a world on the stones scene reloads the model (a moment), and the clip resumes after.
  async function setWorld(id) {
    const view = robot.view;
    if (!view) return;
    $('world').disabled = true;
    root.querySelector('.push').disabled = true;
    setRobotLabel(T('changingWorld'));
    try {
      await view.setWorld(WORLDS.find((world) => world.id === id));
      await dressPlace(view); // a new world rebuilds the drawn geoms: dress the place again
      refreshLook();
    } catch (error) {
      console.error(error);
      setRobotLabel(T('worldFailed'));
    } finally {
      $('world').disabled = false;
      root.querySelector('.push').disabled = !robot.view; // never before the robot is there
    }
    copying = false;
    syncSliders(); // the new world's own values
    resume();
  }

  // Another place (a kitchen, a warehouse, a sidewalk): its furniture is solid and its loose objects
  // can be knocked over. It rebuilds the model (a moment), and the clip resumes after.
  async function setPlace(id) {
    const view = robot.view;
    if (!view) return;
    $('place').disabled = true;
    root.querySelector('.push').disabled = true;
    setRobotLabel(T('buildingPlace'));
    try {
      await view.setScene(SCENES.find((scene) => scene.id === id) ?? null);
      await dressPlace(view); // real models over the place's boxes and cylinders
      setFloor(view, id); // and its floor: tiles, concrete or sidewalk
      refreshLook();
    } catch (error) {
      console.error(error);
      setRobotLabel(T('placeFailed'));
    } finally {
      $('place').disabled = false;
      root.querySelector('.push').disabled = !robot.view; // never before the robot is there
    }
    copying = false;
    resume();
  }

  robot.ready.then(async (view) => {
    if (!view) return;
    refreshLook();
    view.setSpeed(speed);
    if (!playing) view.pause();
    await loadLevel(FINAL_LEVEL); // standing with its policy: physics from the first frame
    if (current) await physicsFor(current.clip);
    copyCurrent(); // the puppet reference, ready for the "sin física" mode
  });

  $('show').onchange = (event) => ($('stage').dataset.show = event.target.value);
  $('policy').onchange = (event) => loadLevel(event.target.value);
  $('world').onchange = (event) => setWorld(event.target.value);
  if ($('robot-model')) {
    $('robot-model').onchange = async (event) => {
      robotModel = event.target.value;
      if (robotModel === 'unitree_h1') {
        const h1 = IMITATIONS.find((im) => im.robot === 'unitree_h1');
        if (h1) {
          const opt = $('policy').querySelector(`option[value="${h1.id}"]`);
          if (opt) opt.disabled = false;
          $('policy').value = h1.id;
          physics = true;
          await loadLevel(h1.id);
        }
      } else {
        const g1Im = imitationFor(current?.clip, 'unitree_g1');
        const nextId = physics && g1Im ? g1Im.id : FINAL_LEVEL;
        $('policy').value = nextId;
        await loadLevel(nextId);
      }
    };
  }

  // Physical object grasping, soapy/wet slip, and gravity release with dynamic liquid spheres.
  const graspButtons = [root.querySelector('#hold-dry'), root.querySelector('#hold-wet'), root.querySelector('#drop-obj')].filter(Boolean);
  const setGraspStatus = (key, activeBtn) => {
    graspButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === activeBtn)));
    const status = $('grasp-status');
    if (!status) return;
    if (!key) {
      status.hidden = true;
      return;
    }
    status.hidden = false;
    status.innerHTML = T(key);
  };
  if ($('hold-dry')) {
    $('hold-dry').onclick = async () => {
      if (!robot.view) return;
      copying = false;
      await robot.view.holdObject({ wet: false });
      await dressPlace(robot.view);
      refreshLook();
      setRobotLabel();
      setGraspStatus('graspHoldingDry', $('hold-dry'));
    };
  }
  if ($('hold-wet')) {
    $('hold-wet').onclick = async () => {
      if (!robot.view) return;
      copying = false;
      await robot.view.holdObject({ wet: true });
      await dressPlace(robot.view);
      refreshLook();
      setRobotLabel();
      setGraspStatus('graspHoldingWet', $('hold-wet'));
    };
  }
  if ($('drop-obj')) {
    $('drop-obj').onclick = () => {
      if (!robot.view) return;
      robot.view.dropObject();
      setGraspStatus('graspDropped', $('drop-obj'));
    };
  }

  // Conditions by hand: each slider sets one value at once (view.setConditions), over the world.
  const sliders = [...root.querySelectorAll('input[data-condition]')];
  // Each language with its own decimal mark: "0,85" / "0.85".
  const decimal = (value, digits) => LANGS.map((l) => `<span class="t" lang="${l}">${fmt(value, digits)(l)}</span>`).join('');
  const showValue = (key, value) => {
    const out = root.querySelector(`output[data-condition="${key}"]`);
    if (key === 'friction') out.innerHTML = decimal(value, 2);
    // The force comes from physics/ (view.conditions), so the drag formula lives in one place.
    else if (key === 'wind_mps') out.innerHTML = value ? `${decimal(value, 0)} m/s · ${decimal(robot.view?.conditions().wind_newtons ?? 0, 0)} N` : T('noWind');
    else out.innerHTML = `×${decimal(value, 2)}`;
  };
  function syncSliders() {
    const view = robot.view;
    if (!view) return;
    const current = view.conditions();
    for (const slider of sliders) {
      slider.value = current[slider.dataset.condition];
      slider.disabled = false;
      showValue(slider.dataset.condition, Number(slider.value));
    }
  }
  for (const slider of sliders) {
    slider.oninput = () => {
      const value = Number(slider.value);
      robot.view?.setConditions({ [slider.dataset.condition]: value });
      showValue(slider.dataset.condition, value);
    };
  }
  robot.ready.then(syncSliders);
  $('place').onchange = (event) => setPlace(event.target.value);
  $('play').onclick = () => {
    playing = !playing;
    if (robot.view) playing ? robot.view.play() : robot.view.pause();
    $('play').innerHTML = playing ? ICONS.pause : ICONS.play;
    S($('play'), { 'aria-label': playing ? 'pause' : 'play', title: playing ? 'pause' : 'play' });
  };
  $('speed').onclick = () => {
    speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    robot.view?.setSpeed(speed);
    $('speed').innerHTML = `${decimal(speed, speed === 1 ? 0 : speed === 0.5 ? 1 : 2)}×`;
  };
  // The physics switch only means something for a clip a policy learned: elsewhere it says so.
  function showMode(clip) {
    const learned = imitationFor(clip) !== null;
    root.querySelector('[data-physics="on"]').disabled = !learned;
    // Each note has a short phone version (.only-narrow, style.css).
    root.querySelector('.mode-note').innerHTML = learned
      ? `<span class="only-wide">${T('modeLearnedWide')}</span><span class="only-narrow">${T('modeLearnedNarrow')}</span>`
      : `<span class="only-wide">${T('modeNoneWide')}</span><span class="only-narrow">${T('modeNoneNarrow')}</span>`;
    root.querySelectorAll('[data-physics]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.physics === 'on') === (learned && physics))));
  }

  // Physics on or off (see `physics`).
  for (const button of root.querySelectorAll('[data-physics]')) {
    button.onclick = async () => {
      physics = button.dataset.physics === 'on';
      root.querySelectorAll('[data-physics]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      if (!robot.view) return;
      if (physics) {
        robot.view.stop(); // the puppet stands back up, on its own motors
        copying = false;
        await physicsFor(current?.clip);
      } else if (imitating()) {
        $('policy').value = FINAL_LEVEL;
        await loadLevel(FINAL_LEVEL); // ends with resume(): the puppet replay
      } else resume();
    };
  }
  $('reset').onclick = () => {
    skeleton.time = 0;
    if (!withPhysics() && motion && !imitating()) startMotion();
    else robot.view?.reset(); // the policy puts the robot back in its first pose (standing or the clip's)
  };

  // An imitation option is only for the clip it learned; leaving that clip goes back to standing.
  function offerImitations(clip) {
    for (const imitation of IMITATIONS) {
      const option = $('policy').querySelector(`option[value="${imitation.id}"]`);
      if (option) option.disabled = imitation.robot !== 'unitree_h1' && !matchesImitation(imitation, clip.id);
    }
    if (imitating() && robotModel !== 'unitree_h1' && !matchesImitation(imitationOf(level), clip.id)) {
      $('policy').value = FINAL_LEVEL;
      loadLevel(FINAL_LEVEL);
    }
  }

  return {
    /** @param {import('./contract.js').PoseClip} clip  @param {string} title */
    showClip(clip, title) {
      skeleton.setClip(clip);
      $('human-label').innerHTML = T('person', { title }); // title: markup, one span per language
      current = { clip, title };
      offerImitations(clip);
      showMode(clip);
      overlay.show(clip.id).catch(console.error);
      motion = motions.get(clip.id) ?? null;
      physicsFor(clip);
      if (!motion) copyCurrent();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      skeleton.dispose();
      overlay.dispose();
      const view = robot.view;
      // The app shares one robot: the next screen starts on flat, empty ground. One rebuild at a time.
      if (view) {
        look?.undo();
        look = null;
        setFloor(view, null); // the viewer's own floor again
        const flat = view.world() && view.world().id !== 'plano' ? view.setWorld(WORLDS.find((world) => world.id === 'plano')) : Promise.resolve();
        flat.then(() => view.scene() && view.setScene(null));
      }
      robot.dispose();
    },
  };
}
