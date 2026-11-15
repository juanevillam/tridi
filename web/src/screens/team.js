// #/team — Team Screen.
import { appHeaderHTML, mountAppHeader } from '../header.js';
import { dict } from '../i18n.js';

const { T } = dict({
  title: { es: 'Equipo', en: 'Team' },
  sub: {
    es: 'Cuatro cofundadores construyendo física, visión 3D y automatización industrial.',
    en: 'Four co-founders building physics, 3D vision, and industrial automation.',
  },
  openCases: { es: 'Ver Casos de Estudio →', en: 'View Case Studies →' },
});

export const title = { es: 'Equipo', en: 'Team' };

const MEDIA = `${import.meta.env.BASE_URL}media/team/`;

const FOUNDERS = [
  {
    name: 'Pastor Jiménez',
    role: 'Co-Founder & CEO',
    github: 'https://github.com/torpass',
    linkedin: 'https://www.linkedin.com/in/pastor-jimenez/',
    photo: `${MEDIA}pastor.jpg`,
    focus: {
      es: 'Física MuJoCo, retargeting 3D y aprendizaje por refuerzo.',
      en: 'MuJoCo physics, 3D retargeting & reinforcement learning.',
    },
  },
  {
    name: 'Juan Esteban Villa',
    role: 'Co-Founder & CTO',
    github: 'https://github.com/juanevillam',
    linkedin: 'https://www.linkedin.com/in/juanevillam/',
    photo: `${MEDIA}juan.jpg`,
    focus: {
      es: 'Visión 3D, transferencia Sim-to-Real e infraestructura.',
      en: '3D vision, Sim-to-Real transfer & infrastructure.',
    },
  },
  {
    name: 'César Martínez',
    role: 'Co-Founder & CIO',
    github: 'https://github.com/cisorm',
    linkedin: 'https://www.linkedin.com/in/cesar-martinez-info/',
    photo: `${MEDIA}cesar.jpg`,
    focus: {
      es: 'Assembler CAD/P&ID, plataforma web y generación de código.',
      en: 'CAD/P&ID Assembler, web platform & code generation.',
    },
  },
  {
    name: 'Alejandro Hernández',
    role: 'Co-Founder & COO',
    github: 'https://github.com/alehernandezt',
    linkedin: 'https://www.linkedin.com/in/jose-alejandro-hernandez-torres/',
    photo: `${MEDIA}ale.jpg`,
    focus: {
      es: 'Estrategia comercial, verticales industriales y operaciones.',
      en: 'Commercial strategy, industrial verticals & operations.',
    },
  },
];

export function mount(root) {
  root.innerHTML = `
  <section class="page team-page">
    ${appHeaderHTML({ current: 'team' })}

    <div class="screen-toolbar">
      <div class="screen-toolbar-copy">
        <h1>${T('title')}</h1>
        <p class="screen-toolbar-sub">${T('sub')}</p>
      </div>
      <div class="screen-toolbar-actions">
        <a class="button primary" href="#/milestones" style="min-height:36px;padding:0 14px;font-size:13px">${T('openCases')}</a>
      </div>
    </div>

    <div class="team-layout">
      <div class="team-founders-grid">
        ${FOUNDERS.map(
          (f) => `
          <article class="team-card">
            <div class="team-card-head">
              <img class="team-avatar" src="${f.photo}" alt="${f.name}" width="52" height="52" loading="lazy" decoding="async" />
              <div class="team-head-meta">
                <h2>${f.name}</h2>
                <span class="team-role-badge">${f.role}</span>
              </div>
            </div>
            <p class="team-focus">
              <span class="t" lang="es">${f.focus.es}</span>
              <span class="t" lang="en">${f.focus.en}</span>
            </p>
            <div class="team-card-links">
              <a class="team-link" href="${f.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
              <a class="team-link" href="${f.github}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
            </div>
          </article>`,
        ).join('')}
      </div>
    </div>
  </section>`;

  const unmountHeader = mountAppHeader(root);
  return () => {
    unmountHeader?.();
  };
}
