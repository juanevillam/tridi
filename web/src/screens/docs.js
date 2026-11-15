// #/docs — Interactive Technical Documentation & Architecture Manual.
// Dynamically reads live counts and catalog entries from tridi-physics (WORLDS, SCENES,
// ROBOT_MODELS, LEVELS, listComponents) so documentation stays automatically synchronized
// whenever physics worlds, robot models, policies, or hardware components change.
import { SCENES, WORLDS, listComponents } from 'tridi-physics';
import { appHeaderHTML, mountAppHeader } from '../header.js';
import { dict, lang } from '../i18n.js';
import { IMITATIONS, LEVELS, ROBOT_MODELS } from '../policies.js';

const { T } = dict({
  title: { es: 'Documentación Técnica', en: 'Technical Documentation' },
  sub: {
    es: 'Arquitectura en tiempo real, contratos de datos y motores de simulación sincronizados con el código en vivo.',
    en: 'Real-time architecture, data contracts, and simulation engines synchronized with the live codebase.',
  },
  navLabel: { es: 'Secciones', en: 'Sections' },
  secOverview: { es: '1. Resumen y Arquitectura', en: '1. Overview & Architecture' },
  secCapture: { es: '2. Tridi Capture (Video → 3D)', en: '2. Tridi Capture (Video → 3D)' },
  secGym: { es: '3. Tridi Gym y MuJoCo', en: '3. Tridi Gym & MuJoCo' },
  secAssembler: { es: '4. Hardware & P&ID Assembler', en: '4. Hardware & P&ID Assembler' },
  secExport: { es: '5. Políticas ONNX, C99 y PLC', en: '5. ONNX, C99 & PLC Exports' },
  secContract: { es: '6. Contrato JSON y API', en: '6. JSON Contract & API' },
  statWorlds: { es: 'Mundos físicos MuJoCo', en: 'MuJoCo physics worlds' },
  statScenes: { es: 'Escenas industriales / 3D', en: 'Industrial / 3D scenes' },
  statCatalog: { es: 'Componentes CAD / P&ID', en: 'CAD / P&ID components' },
  statRobots: { es: 'Modelos y políticas activas', en: 'Active models & policies' },
  openStudio: { es: 'Abrir Simulaciones →', en: 'Open Simulations →' },
  openAssembler: { es: 'Abrir Assembler →', en: 'Open Assembler →' },
});

export const title = { es: 'Documentación', en: 'Documentation' };

export function mount(root) {
  const worldList = Object.values(WORLDS ?? {});
  const sceneList = Object.values(SCENES ?? {});
  const robotList = ROBOT_MODELS ?? [];
  const levelList = [...(LEVELS ?? []), ...(IMITATIONS ?? [])];
  const catalogList = typeof listComponents === 'function' ? listComponents() : [];

  const isEn = () => lang() === 'en';

  root.innerHTML = `
  <section class="page docs-page">
    ${appHeaderHTML({ current: 'docs' })}

    <div class="screen-toolbar">
      <div class="screen-toolbar-copy">
        <h1>${T('title')}</h1>
        <p class="screen-toolbar-sub">${T('sub')}</p>
      </div>
      <div class="screen-toolbar-actions">
        <a class="button" href="#/assembler" style="min-height:36px;padding:0 14px;font-size:13px">${T('openAssembler')}</a>
        <a class="button primary" href="#/simulations" style="min-height:36px;padding:0 14px;font-size:13px">${T('openStudio')}</a>
      </div>
    </div>

    <div class="docs-grid">
      <aside class="docs-sidebar">
        <p class="docs-sidebar-title">${T('navLabel')}</p>
        <ul class="docs-nav-list" data-scroll-fade>
          <li><button type="button" class="docs-nav-btn" data-doc-target="doc-overview" aria-current="true">${T('secOverview')}</button></li>
          <li><button type="button" class="docs-nav-btn" data-doc-target="doc-capture">${T('secCapture')}</button></li>
          <li><button type="button" class="docs-nav-btn" data-doc-target="doc-gym">${T('secGym')}</button></li>
          <li><button type="button" class="docs-nav-btn" data-doc-target="doc-assembler">${T('secAssembler')}</button></li>
          <li><button type="button" class="docs-nav-btn" data-doc-target="doc-export">${T('secExport')}</button></li>
          <li><button type="button" class="docs-nav-btn" data-doc-target="doc-contract">${T('secContract')}</button></li>
        </ul>
      </aside>

      <div class="docs-main">
        <article class="docs-section" id="doc-overview">
          <div class="docs-section-head">
            <h2>${T('secOverview')}</h2>
            <span class="docs-kicker">LIVE ENGINE TELEMETRY</span>
          </div>
          <p class="docs-lead">
            <span class="lang-es">Tridi convierte video monocular, planos P&amp;ID (<code>.dxf</code>) y mallas CAD (<code>.stl</code>) en simulaciones físicas deterministas sobre MuJoCo (<code>250 Hz</code>) y controladores listos para producción (redes neuronales <code>ONNX</code> a <code>50 Hz</code>, firmware embebido <code>C99</code> y código <code>PLC IEC 61131-3</code>).</span>
            <span class="lang-en">Tridi turns monocular video, P&amp;ID drawings (<code>.dxf</code>), and CAD meshes (<code>.stl</code>) into deterministic MuJoCo physics simulations (<code>250 Hz</code>) and production-ready controllers (<code>ONNX</code> neural policies at <code>50 Hz</code>, bare-metal <code>C99</code> firmware, and <code>IEC 61131-3 PLC</code> code).</span>
          </p>
          <div class="docs-stat-row">
            <div class="docs-stat">
              <strong>${worldList.length}</strong>
              <span>${T('statWorlds')}</span>
            </div>
            <div class="docs-stat">
              <strong>${sceneList.length}</strong>
              <span>${T('statScenes')}</span>
            </div>
            <div class="docs-stat">
              <strong>${catalogList.length}</strong>
              <span>${T('statCatalog')}</span>
            </div>
            <div class="docs-stat">
              <strong>${robotList.length + levelList.length}</strong>
              <span>${T('statRobots')}</span>
            </div>
          </div>
        </article>

        <article class="docs-section" id="doc-capture">
          <div class="docs-section-head">
            <h2>${T('secCapture')}</h2>
            <span class="docs-kicker">GVHMR · WILOR · MEDIAPIPE</span>
          </div>
          <p class="docs-lead">
            <span class="lang-es">La tubería de visión reconstruye cuerpo completo y manos en coordenadas globales con gravedad real, sin marcadores ni trajes de captura.</span>
            <span class="lang-en">The vision pipeline reconstructs full body and hands in gravity-aligned world coordinates without markers or motion-capture suits.</span>
          </p>
          <div class="docs-cards-grid">
            <div class="docs-card">
              <h3>GVHMR (World-Grounded Body)</h3>
              <p>
                <span class="lang-es">Extrae raíces y rotaciones SMPL-X en coordenadas del mundo (no relativas a la cámara), eliminando el deslizamiento de pies (foot-skate) antes del retargeting cinemático.</span>
                <span class="lang-en">Extracts SMPL-X root trajectories and joint rotations in gravity-aligned world coordinates rather than camera space, eliminating foot-skate before kinematic retargeting.</span>
              </p>
            </div>
            <div class="docs-card">
              <h3>WiLoR (3D Hand Recovery)</h3>
              <p>
                <span class="lang-es">Recupera las 21 articulaciones de cada mano en 3D cuadro por cuadro para tareas de agarre fino (dexterous grasping) y manipulación en mesa.</span>
                <span class="lang-en">Recovers 21 3D hand joints per frame for dexterous grasping and tabletop manipulation tasks.</span>
              </p>
            </div>
          </div>
        </article>

        <article class="docs-section" id="doc-gym">
          <div class="docs-section-head">
            <h2>${T('secGym')}</h2>
            <span class="docs-kicker">MUJOCO WASM · 250 HZ PHYSICS</span>
          </div>
          <p class="docs-lead">
            <span class="lang-es">El motor físico ejecuta MuJoCo directamente en WebAssembly a <code>250 Hz</code> con inferencia de política a <code>50 Hz</code> (5 sub-pasos físicos por decisión). Catálogo sincronizado automáticamente desde <code>physics/src/worlds.js</code> y <code>physics/src/scenes.js</code>:</span>
            <span class="lang-en">The physics engine runs MuJoCo in WebAssembly at <code>250 Hz</code> with policy inference at <code>50 Hz</code> (5 physics substeps per policy step). Catalog automatically synced from <code>physics/src/worlds.js</code> and <code>physics/src/scenes.js</code>:</span>
          </p>
          <div class="docs-cards-grid">
            <div class="docs-card">
              <h3><span class="lang-es">Mundos Físicos Activos (${worldList.length})</span><span class="lang-en">Active Physics Worlds (${worldList.length})</span></h3>
              <p>${worldList.map((w) => `<code>${w.id}</code> (${isEn() ? (w.en ?? w.name) : w.name})`).join(' · ')}</p>
            </div>
            <div class="docs-card">
              <h3><span class="lang-es">Escenas y Plantas 3D (${sceneList.length})</span><span class="lang-en">3D Scenes &amp; Plants (${sceneList.length})</span></h3>
              <p>${sceneList.map((s) => `<code>${s.id}</code> (${isEn() ? (s.en ?? s.name) : s.name})`).join(' · ')}</p>
            </div>
          </div>
        </article>

        <article class="docs-section" id="doc-assembler">
          <div class="docs-section-head">
            <h2>${T('secAssembler')}</h2>
            <span class="docs-kicker">ISA-5.1 P&amp;ID · CAD STL · ${catalogList.length} COMPONENTS</span>
          </div>
          <p class="docs-lead">
            <span class="lang-es">El Assembler opera en dos modos complementarios: (1) <strong>P&amp;ID &amp; Plantas (ISA-5.1)</strong> para parsear planos <code>.dxf</code> o diagramas de tuberías e instrumentación y generar listas de lazos, bombas, válvulas y gemelos 3D; y (2) <strong>CAD &amp; Robot Studio</strong> para ensamblar mallas <code>.stl</code>, sensores y actuadores con exportación directa a MuJoCo MJCF.</span>
            <span class="lang-en">The Assembler operates in two complementary modes: (1) <strong>P&amp;ID &amp; Plants (ISA-5.1)</strong> to parse <code>.dxf</code> piping and instrumentation diagrams into loop tables, pumps, valves, and 3D twins; and (2) <strong>CAD &amp; Robot Studio</strong> to assemble <code>.stl</code> meshes, sensors, and actuators with direct MuJoCo MJCF export.</span>
          </p>
          <div class="docs-cards-grid">
            <div class="docs-card">
              <h3><span class="lang-es">Catálogo de Hardware (${catalogList.length} piezas)</span><span class="lang-en">Hardware Catalog (${catalogList.length} parts)</span></h3>
              <p>${catalogList.map((c) => `<code>${c.id}</code>`).join(' · ')}</p>
            </div>
            <div class="docs-card">
              <h3><span class="lang-es">Validación de Lazos y Gemelo 3D</span><span class="lang-en">Loop Validation &amp; 3D Twin</span></h3>
              <p>
                <span class="lang-es">Audita automáticamente conexiones huérfanas, sensores sin transmisor o actuadores sin bloque de seguridad antes de compilar el programa de control.</span>
                <span class="lang-en">Automatically audits orphan connections, sensors missing transmitters, or actuators without safety interlocks before compiling the control program.</span>
              </p>
            </div>
          </div>
        </article>

        <article class="docs-section" id="doc-export">
          <div class="docs-section-head">
            <h2>${T('secExport')}</h2>
            <span class="docs-kicker">SIM-TO-REAL · ONNX · C99 · IEC 61131-3</span>
          </div>
          <div class="docs-cards-grid">
            <div class="docs-card">
              <h3>ONNX Policy + MuJoCo MJCF</h3>
              <p>
                <span class="lang-es">Políticas entrenadas con PPO (observaciones articulares + gravedad proyectada → 29 torques PD a <code>50 Hz</code>) empaquetadas junto a su escena <code>model.xml</code> y manifiesto de calibración.</span>
                <span class="lang-en">PPO-trained policies (joint observations + projected gravity → 29 PD targets at <code>50 Hz</code>) packaged alongside their <code>model.xml</code> scene and calibration manifest.</span>
              </p>
            </div>
            <div class="docs-card">
              <h3>Deterministic C99 &amp; Structured Text (PLC)</h3>
              <p>
                <span class="lang-es">Generación determinista sin asignación dinámica de memoria (<code>control_step()</code> en C99 para ESP32/STM32/ATmega y <code>Structured Text</code> IEC 61131-3 para Siemens TIA Portal / Allen-Bradley Studio 5000).</span>
                <span class="lang-en">Zero-heap deterministic code generation (<code>control_step()</code> in C99 for ESP32/STM32/ATmega and IEC 61131-3 <code>Structured Text</code> for Siemens TIA Portal / Allen-Bradley Studio 5000).</span>
              </p>
            </div>
          </div>
        </article>

        <article class="docs-section" id="doc-contract">
          <div class="docs-section-head">
            <h2>${T('secContract')}</h2>
            <span class="docs-kicker">POSECLIP · TRAIN JOB · DELIVERY PACKAGE</span>
          </div>
          <div class="docs-cards-grid">
            <div class="docs-card">
              <h3>PoseClip JSON Schema</h3>
              <p>
                <span class="lang-es">Contrato inmutable entre <code>data/</code>, <code>physics/</code> y <code>web/</code>: <code>fps</code>, <code>frames[].root</code> (posición 3D en metros), <code>frames[].joints</code> (cuaterniones SMPL-X / G1) y contactos de pies verificados.</span>
                <span class="lang-en">Immutable contract across <code>data/</code>, <code>physics/</code>, and <code>web/</code>: <code>fps</code>, <code>frames[].root</code> (3D position in meters), <code>frames[].joints</code> (SMPL-X / G1 quaternions), and verified foot contacts.</span>
              </p>
            </div>
            <div class="docs-card">
              <h3>Zero-Retention Video Privacy</h3>
              <p>
                <span class="lang-es">El servidor de captura procesa el video en memoria temporal y elimina el archivo original inmediatamente después de extraer el <code>PoseClip</code>. Solo persisten las trayectorias cinemáticas anónimas.</span>
                <span class="lang-en">The capture server processes video in ephemeral storage and deletes the source file immediately after extracting the <code>PoseClip</code>. Only anonymous kinematic trajectories persist.</span>
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>`;

  const unmountHeader = mountAppHeader(root);

  const navBtns = [...root.querySelectorAll('[data-doc-target]')];
  for (const btn of navBtns) {
    btn.addEventListener('click', () => {
      for (const b of navBtns) b.removeAttribute('aria-current');
      btn.setAttribute('aria-current', 'true');
      const target = root.querySelector(`#${btn.dataset.docTarget}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  return () => {
    unmountHeader?.();
  };
}
