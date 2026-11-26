# Roadmap Ejecutivo y Estado del Producto — Tridi (Noviembre 2026)

> **Para leer en 3 minutos:** Este es el documento principal de estado de **Tridi (`juanevillam/tridi`)**. Resume cómo funciona nuestro ecosistema sobre **1 motor físico compartido (`MuJoCo` Python + WebAssembly)** y **3 verticales de negocio** (Humanoides, Robots/Mecatrónica y Plantas Industriales P&ID), qué está desplegado hoy en producción (`trytridi.com`) y qué tareas tiene asignadas cada integrante (**Juan, Pastor, César y Ale**).
> Para detalles de implementación a nivel de código, pines o infraestructura, consulta los manuales de Capa 2 en [`docs/architecture-and-sim2real.md`](architecture-and-sim2real.md) y [`docs/infra-and-security.md`](infra-and-security.md).

---

## 1. Reglas de Oro del Ecosistema y las 3 Verticales de Tridi

1. **Un solo motor físico, tres verticales claramente separadas en producto y UI:**
   - **Vertical 1 · Robótica Humanoide (`Unitree G1` / `H1`):** Su entrada es **video humano** (`#/live` cámara en vivo / teléfono por QR o `#/upload` archivo `.mp4`). Entrega el dataset físico y la política `ONNX` en `#/delivery`.
   - **Vertical 2 · Rovers Autónomos y Mecatrónica (`luigi_lab3` / `luigi_lab4`):** Su entrada son **mallas CAD 3D (`.stl`) + código `.ino`** en `#/assembler`. Audita conflictos de timers/interrupciones (`Timer1` vs `<Servo.h>`, `pulseIn` de `47,1 ms` → `ISR < 4 µs`) y entrega firmware C99 determinista sin memoria dinámica (`training/export_mcu.py`).
   - **Vertical 3 · Plantas Industriales y Celdas PLC (`factory_cell` / `P&ID .dxf & .pdf`):** Validada con el **Ing. José González (ZAKA, C.A. / Rockwell Automation)** ([`docs/reunion-zaka.md`](reunion-zaka.md)). Su entrada es el plano **P&ID de AutoCAD (`.dxf` o `.pdf` vectorial)** en `#/assembler` y entrega en orden estricto de valor industrial: **1. Documentación de Ingeniería `ISA-5.1 / ISA-88` (`FDS` + `.csv` I/O + PDF)**, **2. Simulación 3D interactiva en MuJoCo**, y **3. Archivo plano de bloques tipo "Lego" para PLC** (`Siemens TIA Portal .scl` y `Rockwell Studio 5000 .L5K`).
2. **Principio de Arquitectura (`mus3o`): *"La IA razona la topología; el código determinista ensambla la física y el control"*:**
   - Ningún LLM inventa números flotantes de un XML de MuJoCo ni escribe directo registros críticos de un PLC o Arduino. La IA o el parser lee el input (video, `.stl` o `.dxf`), produce un grafo semántico validado contra nuestros catálogos (`physics/components/catalog.json` e `isa_standard.json`), y nuestros ensambladores deterministas (`assembler.js`, `pid_assembler.js`, `export_mcu.py`, `export_plc.py`) compilan el XML, la documentación `ISA-5.1` y el código de control con paridad numérica comprobada (`max_abs_diff < 1e-5`).
3. **Estándar Visual de Laboratorio (`trytridi.com`):**
   - Todas las simulaciones en `#/simulations` (`Unitree G1`, `Rover Luigi v1`, `Rover Luigi v2`, `Industrial Cell`) corren dentro de entornos 3D de planta/laboratorio con iluminación física, **tags 3D proyectados en tiempo real sobre cada actuador/sensor** y una **barra narradora en vivo de 4 etapas** que explica qué está decidiendo la política en cada instante.
4. **Frontera Estricta de Privacidad (`yc/`):**
   - La carpeta [`yc/`](../yc/README.md) vive exclusivamente en el repositorio privado `juanevillam/tridi` y jamás se sube a ningún mirror público.

---

## 2. Estado Actual de las Superficies y Verticales en Producción

| Superficie / Vertical | Estado Hoy (Noviembre 2026) | Manual Técnico (Capa 2) |
| :--- | :--- | :--- |
| **Infraestructura & Dominio (`trytridi.com`)** | **100% Operativo.** Cloudflare Pages (`tridi-18p.pages.dev`) con deploy automático desde `main`, SSL `Full (Strict)`, TLS 1.3, HSTS `max-age=31536000; includeSubDomains; preload`, `SPF -all`, `DMARC p=reject`, Google Search Console verificado y WAF activo. | [`docs/infra-and-security.md`](infra-and-security.md) |
| **Landing, Verticales y Navegación (`/`, `/humanoids`, `/rovers`, `/industrial`, `/electronics`, `/milestones`)** | **100% Operativo** *(en `main`: `#/` + `#/milestones`; en `juan/studio-overhaul` cambios locales completos sin commit/merge, pendiente de revisión de Juan y `scripts/ship.sh`)*. **En `/`:** abre con Humanoides (`Unitree G1` con `g1-stand` recto), selector de plataforma (`.hero-platforms`), entorno 3D procedural "Año 10000" (`world*.js`, cielo abierto y luminarias 3D sin `.glb`), modo **Tridi Gym** *White-Chamber* (`--gym-wash`), piso radial/hexagonal de telemetría, vector de empuje holográfico (`100–500 N`), **Telemetry Redeploy v2** en 4 fases y pose interactiva en `#policy` (`g1-bailar`/`g1-saludar`, SLERP + `dex3.js` diferido). **Landings dedicadas por vertical (`web/src/screens/vertical.js`):** `/humanoids`, `/rovers` (`luigi_lab3`/`luigi_lab4` + galería CAD/hardware), `/industrial` (`factory_cell` + `Assembler`) y `/electronics` (preview `"Próximamente"`). **Navegación unificada y rutas limpias (`web/src/navigation.js`, `web/src/router.js`):** dos secciones explícitas (`Verticales` + `Herramientas de Studio`) en topbar, cierre (`Hardware is here`) y footer; History API con redirección automática desde `#/...`, anclas `#capture`/`#gym`/`#policy` preservadas, fallback SPA nativo en Vite/Cloudflare Pages (`base: '/'`, `appType: 'spa'`) y **167/167 PASS** en E2E headless Chrome (Tiers 1–5) + **Case Studies** (`/milestones`). | [`docs/architecture-and-sim2real.md`](architecture-and-sim2real.md) |
| **Estudio de Simulaciones 3D (`/simulations`)** | **100% Operativo.** Soporta los 4 modelos físicos en orden lógico (`Unitree G1`, `Rover Luigi v1 — Lab 3`, `Rover Luigi v2 — Lab 4`, `Industrial Cell`), todos con entorno 3D de bahía/laboratorio/planta, etiquetas 3D flotantes de telemetría proyectadas desde coordenadas MuJoCo y narrador en vivo de 4 pasos. | [`docs/architecture-and-sim2real.md`](architecture-and-sim2real.md) |
| **Vertical 1: Humanoides (`data/` + `physics/` + `training/`)** | **100% Operativo.** Captura 2.0 (`GVHMR` cuerpo `smplx_*` + `spine` `[3,6,9,12]` + `WiLoR` manos 3D de 21 puntos), retargeting `< 3,2 cm` con lectura directa `smplx_body_pose`/`smplx_global_orient`, overlays 2D (`2×21` manos + cabeza minimalista), toggle **"Manos (+42 pts)"** en `/camera`, hook físico de dedos `createHandActuatorHook` (`Dex3`/`Inspire` `43`/`51` DoF manteniendo `nu = 29`), 9 políticas ONNX (`g1-stand` recto `< 0,5°` y `4/4` empujones `250 N`, `g1-walk`, `g1-run`, `g1-jacks`, `g1-saludar`, `g1-dedos`, `g1-bailar`, `g1-frente`, `g1-sentarse`, `h1-walk`), entrenamiento multi-clip (`training/multiclip.py`) e investigaciones (`docs/investigacion-*.md`). | [`docs/architecture-and-sim2real.md`](architecture-and-sim2real.md) |
| **Vertical 2: Rovers & Mecatrónica (`luigi_lab3` y `luigi_lab4`)** | **100% Operativo.** Catálogo de 14 componentes con escenas 3D aisladas (`physics/components/catalog.json`), gemelos digitales `luigi_lab3` (`nq=9, nu=2`) y `luigi_lab4` (`nq=10, nu=3` con cuello servo SG90 y cono ultrasónico dinámico), política `luigi-lab4.onnx` (`2.353 B`) y compilador `ONNX → C99 / Arduino (.ino)` (`training/export_mcu.py`) con paridad `0.00e+00`. | [`docs/caso-luigi-sim2real.md`](caso-luigi-sim2real.md) |
| **Vertical 3: Plantas Industriales & P&ID (`/assembler`)** | **100% Operativo (Híbrido OpenRouter + PDFs Escaneados + Esquema 2D Interactivo).** Flujo comercial de 2 pasos (*Subir plano → Recibir documento*), catálogo `ISA-5.1` (`isa_standard.json`, 16 clases + alias reales de planta), extractor híbrido para `.dxf`, `.pdf` (vectorial y escaneado con rasterizador lazy `pdfjs-dist` + soporte multipágina) e imágenes `.png`/`.jpg`/`.webp` (`functions/api/pid-analyze.js` + `physics/src/pid_schema.js`, 1 llamada `json_schema` a `google/gemini-2.5-flash`: **\$0.0085/imagen** en `3.5 s` y **\$0.0030/DXF** en `3.1 s`, fallback offline `\$0` para DXF/PDF), esquema 2D SVG dinámico ANSI/ISA-5.1 (`physics/src/pid_diagram.js`) sincronizado bidireccionalmente con clic de tags en la tabla `I/O Schedule` y exportación de **1. FDS `ISA-5.1 / ISA-88` (PDF + `.csv` I/O)**, **2. Escena 3D MuJoCo** y **3. PLC `.scl` / `.L5K`**. | [`docs/reunion-zaka.md`](reunion-zaka.md) · [`docs/plan-v4-industrial-y-verticales.md`](plan-v4-industrial-y-verticales.md) |

---

## 3. Cómo se Conectan las Superficies y el Motor Físico (Diagrama ASCII)

```text
                      ┌──────────────────────────────────────────────────────────┐
                      │               trytridi.com (Cloudflare Pages)            │
                      │     Landing (#/) · Simulations (#/simulations) ·         │
                      │     Factory Assembler (#/assembler) · Case Studies       │
                      └─────────────┬──────────────────────────┬─────────────────┘
                                    │                          │
        ┌───────────────────────────▼──────┐            ┌──────▼───────────────────────────────┐
        │   VERTICAL 1: HUMANOIDES         │            │   VERTICALES 2 & 3: CAD / P&ID       │
        │   (#/live · #/upload · #/delivery)│            │   (#/assembler · Factory Assembler)  │
        │   • Input: Video celular / QR    │            │   • Modo A: Planos P&ID (.dxf)       │
        │   • Captura 2.0 (GVHMR + WiLoR)  │            │     → Grafo ISA-5.1 (isa_standard)   │
        │   • PoseClip v2 → RobotMotion    │            │   • Modo B: Mallas CAD (.stl) + .ino │
        └───────────────────────────┬──────┘            │     → Catálogo 14 comp. (catalog)    │
                                    │                   └──────┬───────────────────────────────┘
                                    ▼                          ▼
                      ┌──────────────────────────────────────────────────────────┐
                      │         MOTOR FÍSICO COMPARTIDO (MuJoCo + PPO RL)        │
                      │   • WebAssembly a 500 Hz en navegador + Three.js 60 fps  │
                      │   • Entornos 3D con Tags Flotantes + Narrador en Vivo    │
                      │   • Entrenamiento PPO / DeepMimic a 50 Hz en Python      │
                      └──────┬──────────────────────────┬───────────────────┬────┘
                             │                          │                   │
              ┌──────────────▼─────────┐   ┌────────────▼───────────┐   ┌───▼────────────────────────┐
              │ Entregable Humanoides  │   │ Entregable Mecatrónica │   │ Entregable Planta / PLC    │
              │ • policy.onnx (265 KB) │   │ • export_mcu.py        │   │ • 1. Docs FDS ISA-5.1 (.md)│
              │ • motion.json          │   │ • Firmware C99 (.ino)  │   │ • 2. Escena 3D MuJoCo (.xml│
              │ • dataset.zip (#/deliv)│   │ • Paridad < 1e-5       │   │ • 3. PLC (.scl / .L5K)     │
              └────────────────────────┘   └────────────────────────┘   └────────────────────────────┘
```

---

## 4. Tablero de Tareas Pendientes (Solo To-Dos)

> Las tareas ya completadas viven en [`docs/estado.md`](estado.md) y en [`docs/bitacora/`](bitacora/). Aquí solo figuran los **to-dos activos** del equipo.

### 🟢 Juan (`docs/`, `web/`, `data/`, `training/`) — CTO · Mercado, Comunidades & Producto
- [ ] **`J-1` · Iteración y Ejecución de la Estrategia de Mercado y Comunidades ([`docs/plan-ventas-y-comunidades.md`](plan-ventas-y-comunidades.md)):** Aterrizar y ejecutar el plan de entrada B2B (presentación en comunidades de robótica/automatización en Venezuela y online como `r/PLC`, `r/robotics`, Discord de LeRobot/Unitree/PLC, estrategia activa de LinkedIn para Tridi y fundadores, y contacto directo a laboratorios de robótica e integradoras industriales).
- [ ] **`J-2` · Directorio Accionable de Primeros Prospectos, Comunidades y Labs:** Armar la lista concreta de comunidades locales/globales, laboratorios con robots físicos y primeras integradoras para empezar el contacto semanal y medir respuestas reales.
- [ ] **`J-Ship` · Revisión y Publicación de Overhaul Multi-Vertical y Rutas Limpias (`juan/studio-overhaul`):** Revisar en preview local las landings (`/`, `/humanoids`, `/rovers`, `/industrial`, `/electronics`), navegación unificada (`Verticales` + `Herramientas de Studio`) y rutas limpias History API (implementación completa sin commit/merge en `juan/studio-overhaul`, verificada con `16/16` physics checks, `824` claves i18n y `167/167` E2E PASS), y ejecutar `scripts/ship.sh` tras aprobación para desplegar en `trytridi.com`.

### 🟢 Pastor (`physics/`, `web/src/screens/assembler.js`) — CEO · Reconocimiento Inteligente P&ID (Imágenes / VLM) & Motor Físico
- [ ] **`P-1` · Despliegue en Producción de `OPENROUTER_API_KEY` (con Juan):** Pipeline híbrido (`functions/api/pid-analyze.js` + `physics/src/pid_schema.js`) y soporte de PDFs escaneados/multipágina (`web/src/pdf-render.js` + fallback JPEG embebido) ya operativos; solo falta cargar `OPENROUTER_API_KEY` en Cloudflare Pages (`tridi`) con Juan y hacer *Retry deployment*.
- [ ] **`P-2` · Simulación Multi-Silo a Escala (Caso Real 22 Silos → 6 Empacadoras) + Conectar "Abrir Simulación 3D" al plano subido:** Ampliar `pid_assembler.js` con el layout completo del caso expuesto por el Ing. José González (ruteo combinatorio de silos con detección de cuellos de botella de flujo) y enlazar el botón 3D al XML MuJoCo compilado del plano cargado.

### 🟢 César (`web/`) — CIO/CTO · Estudio Web & Interactividad
- [x] **`C-1` · Diagrama 2D Dinámico del Plano Subido + Resaltado Bidireccional de Tags ISA (`physics/src/pid_diagram.js`, `web/src/screens/assembler.js`):** Esquema SVG ANSI/ISA-5.1 generado dinámicamente desde `dag.nodes`/`dag.edges` (coordenadas reales con relajación anti-solapamiento + *swimlanes* por flujo) con clic/teclado bidireccional entre la tabla de equipos, la tabla `I/O Schedule`, el inspector de tag y las tuberías conectadas en la vista previa 2D.

### 🟢 Ale (`docs/`, `yc/`) — COO · Validación Industrial, Unit Economics & Pipeline B2B
- [ ] **`A-1` · Segunda Sesión de Validación en Vivo con el Ing. José González (ZAKA, C.A.):** Presentarle el nuevo flujo comercial de `#/assembler` corriendo en vivo con los planos `.dxf` / `.pdf` (`01` a `06`), validar el documento ejecutivo `FDS ISA-5.1` (PDF + `.csv` Excel) y el archivo plano `.L5K` para `Rockwell Studio 5000`, y recoger su feedback con un plano propio de ZAKA.
- [ ] **`A-2` · Unit Economics del Reconocimiento IA/VLM + Ejecución Semanal de Prospección B2B:** Costear junto a Pastor el presupuesto de llamadas a modelos de visión/lenguaje por plano dentro del modelo SaaS *Pay-per-Compute*, y ejecutar junto a Juan la meta semanal de integradoras y laboratorios contactados siguiendo [`docs/plan-ventas-y-comunidades.md`](plan-ventas-y-comunidades.md).
