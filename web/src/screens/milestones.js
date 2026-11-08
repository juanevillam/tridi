// Avances y casos reales (#/milestones, #/avances):
// 1. Milestone 02 (Nov 2026): First physical Sim-to-Real case study on Luigi D'Aquaro's differential robot
//    (6 CAD STL meshes -> MuJoCo digital twin -> 50 Hz ONNX embedded on ATmega328P -> 40 Hz IR radar 0x9E & PCINT1).
// 2. Milestone 01 (Oct 2026): Platanus Hack 26 Caracas origin story + official live demo & pitch video (2:53, before Q&A).
import { langSwitch } from '../i18n.js';
import { A, T, title } from './strings/milestones.js';

export { title };

const MEDIA = `${import.meta.env.BASE_URL}media/`;

export function mount(root) {
  root.innerHTML = `
    <section class="page milestones">
      <header class="page-head milestones-head">
        <a class="back" href="#/" ${A({ 'aria-label': 'back' })}>←<span class="only-wide">&nbsp;${T('back')}</span></a>
        <div class="milestones-title-group">
          <h1>${T('head')}</h1>
          <p class="lead milestones-lede">${T('lede')}</p>
        </div>
        ${langSwitch()}
      </header>

      <article class="milestone-card" id="sim-to-real">
        <div class="milestone-meta">
          <span class="milestone-badge signal">${T('m2.badge')}</span>
          <a class="button primary milestone-cta" href="#/simulations/luigi_lab3">${T('m2.ctaSim')}</a>
        </div>
        <h2>${T('m2.title')}</h2>
        <p class="milestone-intro">${T('m2.intro')}</p>

        <div class="milestone-videos two-col">
          <figure class="milestone-video-box">
            <div class="milestone-video-head">${T('m2.vidFloorLabel')}</div>
            <video src="${MEDIA}luigi-sim2real.mp4" controls playsinline preload="metadata"></video>
            <figcaption>${T('m2.vidFloorCap')}</figcaption>
          </figure>
          <figure class="milestone-video-box">
            <div class="milestone-video-head">${T('m2.vidHwLabel')}</div>
            <video src="${MEDIA}luigi-hardware.mp4" autoplay muted loop playsinline controls preload="metadata"></video>
            <figcaption>${T('m2.vidHwCap')}</figcaption>
          </figure>
        </div>

        <h3 class="milestone-subhead">${T('m2.stepsTitle')}</h3>
        <div class="milestone-steps-grid">
          <div class="milestone-step">
            <h4>${T('m2.s1.title')}</h4>
            <p>${T('m2.s1.body')}</p>
          </div>
          <div class="milestone-step">
            <h4>${T('m2.s2.title')}</h4>
            <p>${T('m2.s2.body')}</p>
          </div>
          <div class="milestone-step">
            <h4>${T('m2.s3.title')}</h4>
            <p>${T('m2.s3.body')}</p>
          </div>
          <div class="milestone-step">
            <h4>${T('m2.s4.title')}</h4>
            <p>${T('m2.s4.body')}</p>
          </div>
        </div>
      </article>

      <article class="milestone-card" id="platanus-hack">
        <div class="milestone-meta">
          <span class="milestone-badge">${T('m1.badge')}</span>
        </div>
        <h2>${T('m1.title')}</h2>
        <p class="milestone-intro">${T('m1.intro')}</p>

        <div class="milestone-videos one-col">
          <figure class="milestone-video-box">
            <div class="milestone-video-head">${T('m1.vidLabel')}</div>
            <video src="${MEDIA}platanus-pitch.mp4" controls playsinline preload="metadata"></video>
            <figcaption>${T('m1.vidCap')}</figcaption>
          </figure>
        </div>

        <h3 class="milestone-subhead">${T('m1.evolTitle')}</h3>
        <div class="milestone-steps-grid three-col">
          <div class="milestone-step">
            <h4>${T('m1.e1.title')}</h4>
            <p>${T('m1.e1.body')}</p>
          </div>
          <div class="milestone-step">
            <h4>${T('m1.e2.title')}</h4>
            <p>${T('m1.e2.body')}</p>
          </div>
          <div class="milestone-step">
            <h4>${T('m1.e3.title')}</h4>
            <p>${T('m1.e3.body')}</p>
          </div>
        </div>
      </article>
    </section>
  `;
}
