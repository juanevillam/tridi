// Ver simulaciones: the gallery of preloaded clips and the stage with the person and the robot.
import { mountGallery } from '../gallery.js';
import { SCENES, WORLDS } from 'tridi-physics';
import { FINAL_LEVEL, IMITATIONS, LEVELS, ROBOT_MODELS } from '../policies.js';
import { robotPaneHTML } from '../robot-pane.js';
import { ICONS, mountStage } from '../stage.js';
import { mountTrainBox, trainBoxHTML } from '../training.js';
import { option } from '../i18n.js';
import { A, T, X, t } from '../strings-stage.js';
import { levelName, robotName, sceneName, worldName } from '../strings-names.js';

export const title = { es: 'Simulaciones', en: 'Simulations' };

// Clips left out of this gallery; they stay in preloaded.json because the landing, the delivery
// and the trained walking policy still use them. The walk and the run are MediaPipe captures: this
// branch shows capture 2.0 (GVHMR, data/capture2) instead, which reads clearly better side by side
// (Juan, 2026-11-05). The synthetic march is a test fixture, not something to watch.
const HIDDEN_CLIPS = ['clip_2026-10-23_caminar-perfil_01', 'clip_2026-10-23_correr-perfil_01', 'clip_synthetic_march_01'];

// The conditions you can set by hand (view.setConditions in physics/). Ranges cover every world in
// physics/worlds and a bit beyond: grip from wet tile (0.2) to rough concrete (1.2); wind up to
// 20 m/s, a gale of about 60 N on the torso; mass and motors ±20 % (below 0.7 the motors cannot
// hold the robot up even still).
export const CONDITIONS = [
  // label: a key of strings-stage.js
  { key: 'friction', label: 'friction', min: 0.2, max: 1.2, step: 0.05 },
  { key: 'wind_mps', label: 'wind_mps', min: 0, max: 20, step: 1 },
  { key: 'mass_scale', label: 'mass_scale', min: 0.8, max: 1.2, step: 0.05 },
  { key: 'motor_scale', label: 'motor_scale', min: 0.7, max: 1.2, step: 0.05 },
];

export function mount(root, { api }, [clipId] = []) {
  root.innerHTML = `
    <section class="page sims">
      <header class="page-head">
        <a class="back" href="#/" ${A({ 'aria-label': 'back' })}>←<span class="only-wide">&nbsp;${T('back')}</span></a>
        <h1>${T('title')}</h1>
      </header>
      <div class="sims-grid">
        <div class="sims-main">
          <div id="stage" data-show="both">
            <section class="pane" id="human-pane">
              <canvas id="human"></canvas>
              <p class="pane-label" id="human-label">${T('personLabel')}</p>
            </section>
            ${robotPaneHTML('Robot')}
          </div>
          <div id="controls" class="controls">
            <section class="control-group" aria-labelledby="ctl-play">
              <h3 id="ctl-play">${T('playback')}</h3>
              <div class="player">
                <button id="play" class="icon-btn primary" type="button" ${A({ 'aria-label': 'pause', title: 'pause' })}>${ICONS.pause}</button>
                <button id="reset" class="icon-btn" type="button" ${A({ 'aria-label': 'restart', title: 'restart' })}>${ICONS.restart}</button>
                <button id="speed" class="icon-btn speed" type="button" ${A({ 'aria-label': 'speed', title: 'speedTitle' })}>1×</button>
                <select id="show" ${A({ 'aria-label': 'what' })}>
                  <option value="both" selected ${X('both')}>${t('both')}</option>
                  <option value="human" ${X('onlyHuman')}>${t('onlyHuman')}</option>
                  <option value="robot" ${X('onlyRobot')}>${t('onlyRobot')}</option>
                </select>
              </div>
              <div class="mode" role="group" ${A({ 'aria-label': 'how' })}>
                <button type="button" data-physics="on" aria-pressed="true">${T('physicsOn')}</button>
                <button type="button" data-physics="off" aria-pressed="false">${T('physicsOff')}</button>
              </div>
              <p class="mode-note">${T('modeNote')}</p>
            </section>
            <section class="control-group" aria-labelledby="ctl-world">
              <h3 id="ctl-world">${T('conditions')}</h3>
              <div class="fields">
                <label class="field wide">${T('robotModel')}
                  <select id="robot-model">
                    ${ROBOT_MODELS.map(({ id, label }) => option(id, robotName(id, label), id === 'unitree_g1' ? 'selected' : '')).join('')}
                  </select>
                </label>
                <label class="field">${T('world')}
                  <select id="world">
                    ${WORLDS.map(({ id, title }) => option(id, worldName(id, title), id === 'plano' ? 'selected' : '')).join('')}
                  </select>
                </label>
                <label class="field">${T('place')}
                  <select id="place">
                    <option value="" selected ${X('noFurniture')}>${t('noFurniture')}</option>
                    ${SCENES.map(({ id, title }) => option(id, sceneName(id, title))).join('')}
                  </select>
                </label>
                <label class="field wide">${T('trainedWith')}
                  <select id="policy">
                    ${LEVELS.map(({ id, label }) => option(id, levelName(id, label), id === FINAL_LEVEL ? 'selected' : '')).join('')}
                    ${IMITATIONS.length ? `<optgroup ${A({ label: 'imitates' })}>${IMITATIONS.map(({ id, label }) => option(id, levelName(id, label), 'disabled')).join('')}</optgroup>` : ''}
                  </select>
                </label>
              </div>
              <div class="grasp-box">
                <p class="mode-note">${T('objectsHead')}</p>
                <div class="mode grasp-actions" role="group" ${A({ 'aria-label': 'objectsHead' })}>
                  <button type="button" id="hold-dry" aria-pressed="false">${T('holdDry')}</button>
                  <button type="button" id="hold-wet" aria-pressed="false">${T('holdWet')}</button>
                  <button type="button" id="drop-obj" aria-pressed="false">${T('dropObj')}</button>
                </div>
                <p class="mode-note" id="grasp-status" hidden></p>
              </div>
              <details class="tune">
              <summary>${T('tune')}</summary>
              <div class="sliders">
                ${CONDITIONS.map(({ key, label, min, max, step }) => `
                <label class="slider">
                  <span class="slider-head"><span>${T(label)}</span><output data-condition="${key}"></output></span>
                  <input type="range" data-condition="${key}" min="${min}" max="${max}" step="${step}" disabled />
                </label>`).join('')}
              </div>
              <p class="conditions-note">${T('conditionsNote')}</p>
              </details>
            </section>
          </div>
        </div>
        <aside class="sims-list">
          ${trainBoxHTML()}
          <h2>${T('pick')}</h2>
          <ul id="gallery"></ul>
        </aside>
      </div>
    </section>`;
  // The physics sliders are open on wide screens; on phones they fold under "Ajustar la física"
  // (style.css hides the toggle on wide screens), so the scene and the clips come first.
  root.querySelector('.tune').open = !matchMedia('(max-width: 720px)').matches;
  const stage = mountStage(root);
  const trainBox = mountTrainBox(root.querySelector('.train-box'), api);
  mountGallery(root, stage, clipId, trainBox.show, { hide: HIDDEN_CLIPS });
  return () => {
    trainBox.dispose();
    stage.dispose();
  };
}

