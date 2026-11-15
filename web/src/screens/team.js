// #/team — Dedicated Team & Company Screen.
import { appHeaderHTML, mountAppHeader } from '../header.js';
import { dict } from '../i18n.js';

const { T } = dict({
  title: { es: 'Equipo e Ingeniería', en: 'Team & Engineering' },
  sub: {
    es: 'Construyendo la infraestructura de simulación física y despliegue Sim-to-Real para robótica e industria.',
    en: 'Building the physics simulation and Sim-to-Real deployment infrastructure for robotics and industry.',
  },
  missionKicker: { es: 'MISIÓN DE TRIDI', en: 'TRIDI MISSION' },
  missionTitle: {
    es: 'El hardware ya existe. Nosotros entrenamos la física y las políticas que lo hacen trabajar en el mundo real.',
    en: 'The hardware is here. We train the physics and policies that make it work in the real world.',
  },
  openCases: { es: 'Ver Casos de Estudio →', en: 'View Case Studies →' },
  openDocs: { es: 'Ver Documentación →', en: 'View Documentation →' },
});

export const title = { es: 'Equipo', en: 'Team' };

const FOUNDERS = [
  {
    name: 'Pastor Jiménez',
    role: 'CEO & Co-Founder',
    handle: '@torpass',
    linkedin: 'https://www.linkedin.com/in/pastor-jimenez/',
    focus: {
      es: 'Motor Físico MuJoCo, Retargeting 3D, Catálogo CAD y Entrenamiento RL',
      en: 'MuJoCo Physics Engine, 3D Retargeting, CAD Catalog & RL Training',
    },
    bio: {
      es: 'Lidera el núcleo de simulación en WebAssembly/MuJoCo, el retargeting cinemático de cuerpo completo y manos, el catálogo de actuadores/sensores y los entornos de aprendizaje por refuerzo.',
      en: 'Leads the WebAssembly/MuJoCo simulation core, full-body and dexterous hand kinematic retargeting, actuator/sensor hardware catalog, and reinforcement learning environments.',
    },
    tags: ['MuJoCo WASM', 'RL / PPO', 'Retargeting', 'Three.js'],
  },
  {
    name: 'Juan Esteban Villa',
    role: 'CTO & Co-Founder',
    handle: '@juanevillam',
    linkedin: 'https://www.linkedin.com/in/juanevillam/',
    focus: {
      es: 'Pipeline de Visión 3D, Arquitectura Sim-to-Real, Infraestructura y Producto Web',
      en: '3D Vision Pipeline, Sim-to-Real Architecture, Infrastructure & Web Product',
    },
    bio: {
      es: 'Lidera el pipeline de captura monocular (GVHMR + WiLoR), la transferencia Sim-to-Real hacia hardware físico (ONNX / C99 / PLC), la infraestructura cloud y la arquitectura de interfaz de Tridi Studio.',
      en: 'Leads the monocular capture pipeline (GVHMR + WiLoR), Sim-to-Real transfer to physical hardware (ONNX / C99 / PLC), cloud infrastructure, and Tridi Studio frontend architecture.',
    },
    tags: ['GVHMR / WiLoR', 'Sim-to-Real', 'Cloud Infra', 'UI/UX Craft'],
  },
  {
    name: 'César Martínez',
    role: 'CIO & Co-Founder',
    handle: '@cisorm',
    linkedin: 'https://www.linkedin.com/in/cesar-martinez-info/',
    focus: {
      es: 'Hardware Assembler, P&ID ISA-5.1 y Generación de Código Industrial',
      en: 'Hardware Assembler, ISA-5.1 P&ID & Industrial Code Generation',
    },
    bio: {
      es: 'Lidera el entorno interactivo de Tridi Assembler, la ingesta de planos P&ID (.dxf) bajo norma ISA-5.1, la validación de lazos de control y la síntesis de código para PLCs y microcontroladores.',
      en: 'Leads the interactive Tridi Assembler environment, ISA-5.1 P&ID (.dxf) ingestion, control loop validation, and deterministic code synthesis for PLCs and microcontrollers.',
    },
    tags: ['ISA-5.1 P&ID', 'Assembler 3D', 'IEC 61131-3 PLC', 'CAD / DXF'],
  },
  {
    name: 'Alejandro Hernández',
    role: 'COO & Co-Founder',
    handle: '@alehernandezt',
    linkedin: 'https://www.linkedin.com/in/jose-alejandro-hernandez-torres/',
    focus: {
      es: 'Operaciones, Estrategia Industrial, Despliegues en Planta y Marca',
      en: 'Operations, Industrial Strategy, Plant Deployments & Brand',
    },
    bio: {
      es: 'Lidera las alianzas con integradores de automatización e industrias manufactureras, la validación en planta con clientes reales, la estrategia comercial y el sistema de diseño corporativo.',
      en: 'Leads partnerships with automation integrators and manufacturing plants, on-site customer validation, commercial strategy, and the corporate brand system.',
    },
    tags: ['Industrial B2B', 'Plant Ops', 'Unit Economics', 'Brand System'],
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
        <a class="button" href="#/docs" style="min-height:36px;padding:0 14px;font-size:13px">${T('openDocs')}</a>
        <a class="button primary" href="#/milestones" style="min-height:36px;padding:0 14px;font-size:13px">${T('openCases')}</a>
      </div>
    </div>

    <div class="team-layout">
      <article class="docs-section">
        <div class="docs-section-head">
          <h2>${T('missionTitle')}</h2>
          <span class="docs-kicker">${T('missionKicker')}</span>
        </div>
        <div class="team-pillars-grid">
          <div class="docs-card">
            <h3>1 · Humanoid &amp; Dexterous Policies</h3>
            <p>
              <span class="lang-es">Captura de habilidades humanas desde video común hacia políticas de locomoción y manipulación entrenadas con variación de dominio (fricción, masa, empujes y latencia).</span>
              <span class="lang-en">Capturing human skills from everyday video into locomotion and manipulation policies trained under domain randomization (friction, mass, pushes, and latency).</span>
            </p>
          </div>
          <div class="docs-card">
            <h3>2 · Industrial P&amp;ID &amp; Plant Digital Twins</h3>
            <p>
              <span class="lang-es">Conversión de planos P&amp;ID (<code>.dxf</code>) en documentación ISA-5.1, gemelos 3D interactivos con inyección de fallas y lógica PLC verificada antes de tocar la planta física.</span>
              <span class="lang-en">Converting P&amp;ID drawings (<code>.dxf</code>) into ISA-5.1 documentation, interactive 3D twins with fault injection, and verified PLC logic before touching the physical plant.</span>
            </p>
          </div>
          <div class="docs-card">
            <h3>3 · Verified Sim-to-Real Transfer</h3>
            <p>
              <span class="lang-es">Validado de extremo a extremo desde el gemelo digital en MuJoCo hasta robots físicos construidos desde cero y celdas industriales reales.</span>
              <span class="lang-en">Validated end-to-end from the MuJoCo digital twin to custom-built physical robots and real industrial cells.</span>
            </p>
          </div>
        </div>
      </article>

      <div class="team-founders-grid">
        ${FOUNDERS.map(
          (f) => `
          <article class="team-card">
            <div class="team-card-top">
              <div class="team-role-row">
                <span class="team-role-badge">${f.role}</span>
                <span class="team-handle">${f.handle}</span>
              </div>
              <h2>${f.name}</h2>
              <p class="team-focus">
                <span class="lang-es">${f.focus.es}</span>
                <span class="lang-en">${f.focus.en}</span>
              </p>
              <p class="team-bio">
                <span class="lang-es">${f.bio.es}</span>
                <span class="lang-en">${f.bio.en}</span>
              </p>
            </div>
            <div>
              <ul class="team-tags" style="margin-bottom:12px">
                ${f.tags.map((tag) => `<li>${tag}</li>`).join('')}
              </ul>
              <div class="team-card-links">
                <a class="team-link" href="${f.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
              </div>
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
