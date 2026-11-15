# Plan de Ventas, Adquisición y Comunidades (GTM "De Menos a Más")

> **Origen:** Conclusión estratégica tras la reunión de campo con **ZAKA (Ing. José Miguel)** y el cierre del prototipo unificado de Tridi (`trytridi.com`).  
> **Principio rector:** *"Ir de menos a más"*. Llegarle en frío a un gigante de robótica (Boston Dynamics, Figure, ABB corporativo) toma 12–18 meses de burocracia. En cambio, **integradores de automatización industrial (SIs), fabricantes medianos de maquinaria (OEMs) y laboratorios de robótica aplicada** tienen dolor real hoy, presupuestos ágiles y toman decisiones en días.

---

## 1. La Escalera Comercial ("De Menos a Más")

En lugar de vender "una plataforma abstracta de IA física", entramos resolviendo un cuello de botella concreto y urgente en 3 escalones progresivos:

| Escalón | Perfil de Cliente (ICP) | Dolor real que tienen hoy | Cómo entra Tridi (Oferta gancho) | Ciclo / Ticket objetivo |
| --- | --- | --- | --- | --- |
| **1. Entrada Rápida (Semanas 1–4)** | **Integradores de Sistemas (PLC / SCADA)**, talleres de retrofits industriales y **labs universitarios / privados de robótica** (Venezuela, México, Colombia, EE.UU., España). | Pierden licitaciones porque el cliente final no entiende un plano 2D (`P&ID` / `CAD`), o queman días en planta depurando lógica `Ladder / ST` sobre hierro real porque **Siemens NX MCD / Emulate3D cuestan $15k–$25k/año por asiento**. | **Piloto "Plano a Simulación en 48h":** Nos envían un P&ID/CAD o video de una celda/máquina y les entregamos el gemelo 3D interactivo en `trytridi.com` + validación de su lógica de control para mostrarle a su cliente o comisionar sin riesgo. | **1 a 2 semanas** (Piloto pagado de $300–$1,500 o suscripción mensual de $199–$499/mes por integradora). |
| **2. Expansión Industrial (Meses 2–3)** | **OEMs de maquinaria mediana** (envasadoras, paletizadoras, líneas de alimentos/bebidas, agroindustria) e integradoras con 5–30 ingenieros. | Cada máquina nueva requiere reprogramar secuencias desde cero y mandar ingenieros semanas a la planta del cliente para la puesta en marcha (*commissioning*). | **Tridi Assembler B2B SaaS:** Generación de escenas físicas MuJoCo desde sus planos + comisionamiento virtual + exportación de bloques deterministas (`IEC 61131-3 ST` / C). | **2 a 4 semanas** ($500–$2,500/mes recurrente). |
| **3. Robótica & Physical AI (Meses 3–6)** | **Startups y empresas de robótica móvil (AMRs, rovers), celdas con brazos (UR, Fanuc, xArm) y constructores de humanoides (Unitree G1/H1).** | Tienen el hardware pero su brecha *Sim-to-Real* rompe las políticas al pasar del simulador al robot físico (como resolvimos en el caso Luigi Lab 3/4). | **Pipeline Sim-to-Real Tridi:** Entrenamiento por video / RL con *Domain Randomization* + entrega de política `ONNX a 50 Hz` + controlador determinista en C/firmware con garantía de transferencia física. | **1 a 2 meses** ($2,000–$10,000+ por proyecto/licencia). |

---

## 2. Comunidades Exactas donde Infiltrarse (Reddit, Discord, Foros)

No vamos a spamear links de ventas. La estrategia en comunidades de ingeniería es **"Show, Don't Tell" ( Ingeniería en público )**: publicar videos cortos (15–30 s) mostrando un P&ID/CAD o un video humano convirtiéndose en simulación física MuJoCo + código PLC/C corriendo en el navegador (`trytridi.com`), respondiendo preguntas técnicas y abriendo DMs con quienes comenten.

### A. Comunidad Automatista, PLC e Integradores Industriales

1. **Reddit (Tráfico orgánico de ingenieros de planta e integradores):**
   - **[`r/PLC`](https://www.reddit.com/r/PLC/)** (~95,000 miembros): La comunidad más importante del mundo de programadores de PLC (Siemens TIA Portal, Allen-Bradley Studio 5000, Codesys, Beckhoff) e integradores de sistemas.
     - *Ángulo de post:* Mostrar cómo estamos construyendo una alternativa web ligera a *Factory I/O* y *Siemens NX MCD* que lee planos P&ID/CAD y simula la física real en MuJoCo en el navegador sin licencias de $20k. Pedir feedback honesto a integradores sobre qué protocolos (`Modbus TCP`, `OPC-UA`, `S7`) o bloques necesitan primero.
   - **[`r/industrialengineering`](https://www.reddit.com/r/industrialengineering/)** y **[`r/Manufacturing`](https://www.reddit.com/r/Manufacturing/)**: Ingenieros de planta, mejora continua y dueños de talleres OEM.
   - **[`r/mechatronics`](https://www.reddit.com/r/mechatronics/)** y **[`r/automation`](https://www.reddit.com/r/automation/)**: Diseñadores de máquinas especiales y celdas automatizadas.

2. **Foros Técnicos e Industriales (Donde están los dueños de integradoras):**
   - **[PLCTalk.net](https://www.plctalk.net/forums/)**: El foro clásico número 1 de integradores norteamericanos y latinoamericanos.
   - **[Control.com](https://control.com/forums/)**: Comunidad de ingenieros de control y automatización de procesos.
   - **[Inductive Automation Forum (Ignition)](https://forum.inductiveautomation.com/)**: Los integradores que usan Ignition son los más modernos y abiertos a adoptar software nuevo en la nube/web.

3. **Discord y Grupos de Automatización:**
   - **Discord de `r/PLC`** (enlazado en la barra lateral de `r/PLC`): Canales de `#general`, `#projects`, `#networking` con ingenieros activos todos los días.
   - **OpenPLC / Factory I/O Communities**: Ingenieros que ya buscan simular plantas en 3D para probar lógica Ladder/ST antes de ir a campo.

---

### B. Comunidad de Robótica, Sim-to-Real y Physical AI

1. **Servidores de Discord clave:**
   - **LeRobot (Hugging Face Robotics Discord)**: +25,000 ingenieros construyendo brazos robóticos, rovers y humanoides con aprendizaje por imitación. Canal ideal para mostrar el pipeline `Video → Pose 3D → MuJoCo → ONNX 50 Hz`.
   - **Unitree Robotics Community / Discord**: Compradores reales de **Unitree G1, H1 y Go2** (universidades, laboratorios corporativos y startups) que tienen el robot físico parado porque no logran entrenar políticas estables más allá de los modos de fábrica.
   - **MuJoCo Discussions (GitHub DeepMind) & Discord**: Desarrolladores de simulación física que valoran que Tridi corra MuJoCo WASM a 500 Hz + ONNX a 50 Hz directo en la web.
   - **ROS / Open Robotics Discord & [ROS Discourse](https://discourse.ros.org/)**: Categorías de *ROS-Industrial*, *Simulation* y *MoveIt*.

2. **Subreddits de Robótica:**
   - **[`r/robotics`](https://www.reddit.com/r/robotics/)**, **[`r/ROS`](https://www.reddit.com/r/ROS/)** y **[`r/ControlTheory`](https://www.reddit.com/r/ControlTheory/)**:
     - *Ángulo de post:* El caso real **Luigi Lab 3 & Lab 4 (Sim-to-Real)**: cómo pasamos de políticas que chocaban en el mundo físico a lograr `0 colisiones` con *Domain Randomization* + arquitectura híbrida y cómo cualquiera puede probar el laboratorio interactivo en `trytridi.com/#/simulations`.

---

## 3. Directorios y Asociaciones B2B (De dónde sacar listas con nombre, empresa y contacto)

Para no depender solo de posts orgánicos, estos 4 directorios públicos nos dan **miles de empresas integradoras filtradas por país y especialidad** para hacer *outbound* directo:

1. **CSIA — Control System Integrators Association (`controlsys.org` / Industrial Automation Exchange):**
   - Directorio público global de empresas integradoras de automatización.
   - Se puede filtrar por **México, Colombia, Chile, Argentina, Brasil, España y EE.UU.** Cada ficha tiene el sitio web de la integradora, industrias que atienden (alimentos, farmacéutica, packaging, agua) y directivos.
2. **Siemens Solution Partner Finder & Rockwell Automation PartnerNetwork Directory:**
   - Buscadores oficiales de todos los *System Integrators* y *OEM Partners* certificados por país. Son empresas que viven de entregar proyectos de automatización y necesitan herramientas de simulación y comisionamiento virtual.
3. **A3 — Association for Advancing Automation (`automate.org`):**
   - Directorio de integradores de celdas robóticas y visión artificial en América.
4. **Cámaras Industriales y Red Local (LATAM — Trato directo en español):**
   - **Venezuela (Ventaja local inmediata en Barquisimeto, Valencia, Caracas):**
     - **CIEL (Cámara de Industriales del Estado Lara)** y empresas de la Zona Industrial de Barquisimeto (alimentos, empaques, metalmecánica, agroindustria).
     - **Red de ZAKA (Ing. José Miguel)** y colegas integradores en Carabobo/Aragua/Miranda.
     - **Capítulos estudiantiles y laboratorios de robótica/mecatrónica (UNEXPO, USB, UCV, UCAB, ULA)** para seguir sumando casos físicos validados como Luigi.
   - **México (Aprovechando el contexto ERP/industrial de Crol):**
     - Integradores y fabricantes OEM en **Monterrey (Nuevo León), Querétaro, Bajío (Guanajuato) y Guadalajara**.
   - **Colombia:**
     - Integradores industriales en **Medellín (Antioquia), Bogotá y Cali** (miembros de la ANDI e integradores de alimentos/packaging).

---

## 4. Conferencias y Ferias donde Conectarse (2026–2027)

No hace falta pagar un stand de $15,000: la estrategia probada en startups B2B es asistir como visitante con **la demo corriendo en vivo en el iPad / laptop (`trytridi.com`)**, agendar 25 reuniones previas por la app del evento con los expositores (los expositores de maquinaria OEM e integradores están obligados a estar en su stand y siempre buscan hablar) y cerrar pilotos ahí mismo.

| Evento | Lugar / Fecha | Por qué es clave para Tridi |
| --- | --- | --- |
| **Automate Show (A3)** | EE.UU. (Chicago / Detroit) | La feria de automatización y robótica industrial más grande de Norteamérica (+800 expositores de celdas, PLCs, AMRs y humanoides). |
| **EXPO PACK México / Guadalajara** | CDMX / Guadalajara | Lleno de fabricantes medianos de maquinaria de envase, embalaje y procesamiento de alimentos de toda Latinoamérica. |
| **Feria Internacional de Bogotá (FIB) / Colombiaplast** | Bogotá, Colombia | Punto de encuentro de integradores y plantas industriales de la región andina. |
| **SPS (Smart Production Solutions)** | Atlanta (EE.UU.) / Núremberg (Alemania) | Enfocada 100 % en control industrial, PLCs, gemelos digitales y *Virtual Commissioning*. |
| **ICRA / IROS / CoRL / ROSCon** | Internacional / EE.UU. | Las conferencias donde están todos los equipos técnicos de Sim-to-Real, humanoides y aprendizaje robótico. |
| **San Francisco Robotics & YC Ecosystem** | Bay Area, CA (Ene–Mar 2027) | Meetups semanales de robótica/Physical AI en SF, Silicon Valley Robotics (`svrobotics.org`) y red directa de founders de YC. |

---

## 5. Playbook Semanal de Ejecución Comercial (Cómo lo operamos en paralelo al producto)

### Guion de Contacto Directo (LinkedIn / Email / WhatsApp a Dueños de Integradoras)

> **Regla:** Corto (máximo 4 líneas), de ingeniero a ingeniero, sin palabras cliché y con un link que abre en 2 segundos sin login.

**Versión en Español (Integradores LATAM / España):**
> *"Hola [Nombre], vi los proyectos de automatización e integración de [Empresa] en [sector, ej. alimentos/packaging].*  
> *Somos un equipo de ingenieros venezolanos (aplicando a YC) y construimos **Tridi** (`https://trytridi.com/#/assembler`): una herramienta web que convierte planos P&ID / CAD en una simulación física 3D interactiva (MuJoCo) y código de control determinista (`ST` / C) para validar la lógica y mostrarle la línea funcionando al cliente antes de tocar hierro.*  
> *Estamos buscando 3 integradoras para hacerles gratis el gemelo físico 3D de un plano que tengan activo esta semana y recibir su feedback técnico. ¿Tienes 10 min este jueves para mostrártelo?"*

**Versión en Inglés (Integradores US / Comunidad `r/PLC` & Robótica):**
> *"Hey [Name] — saw your work on [PLC integration / robotics cells] at [Company].*  
> *We built **Tridi** (`https://trytridi.com/#/simulations`), a browser-native MuJoCo physics & Sim-to-Real studio that turns P&ID/CAD layouts and human video into interactive 3D physical simulations, 50 Hz ONNX policies, and deterministic IEC 61131-3 ST / C code.*  
> *We're onboarding 3 system integrators / robotics teams this month to build a custom interactive 3D cell from one of your active blueprints in 48h so we can stress-test our workflow on real field specs. Open to a quick 10-min chat this week?"*

---

### División de Responsabilidades Semanales en el Equipo

| Miembro | Rol en el Plan de Adquisición y Ventas (en paralelo a producto) | Meta Semanal Medible |
| --- | --- | --- |
| **Ale (COO)** | Liderar el *pipeline* comercial (CRM en Notion/Sheet): extraer lista de 50 integradoras/semana de **CSIA, Siemens Partners y cámaras industriales (Venezuela, México, Colombia, EE.UU.)**, enviar contacto inicial y agendar llamadas de descubrimiento. | **30–50 prospectos contactados/semana → 5 llamadas agendadas/semana.** |
| **Juan (CTO)** | Publicaciones técnicas *"Build in Public"* en **Reddit (`r/PLC`, `r/robotics`), Discord (LeRobot, Unitree, PLC) y LinkedIn** mostrando videos cortos del producto en vivo (`trytridi.com`), más contacto con empresas industriales en red Crol (México) y Lara/Venezuela. | **2 posts técnicos/semana en comunidades + soporte técnico en llamadas clave.** |
| **Pastor (CEO)** | Conectar con laboratorios de robótica, profesores/investigadores Sim-to-Real, comunidades de **MuJoCo / Unitree / LeRobot**, y liderar la demostración técnica de física y entrenamiento en las llamadas con clientes de robótica. | **10 contactos/semana en labs y startups de robótica + demos técnicas.** |
| **César (CIO/CTO)** | Convertir los planos/especificaciones que envíen los prospectos de la semana en escenas interactivas rápidas dentro del **Tridi Assembler (`#/assembler`)** en `< 48h` para cerrar el piloto en la segunda llamada. | **Prototipo interactivo listo en `< 48h` por cada prospecto calificado.** |

---

## 6. Métricas de Product-Market Fit (PMF) para las próximas 4 semanas

Sabremos que encontramos tracción repetible en una vertical cuando:
1. **Un integrador usa nuestra simulación 3D en una propuesta real frente a su cliente final** para ganar un contrato de automatización.
2. **Al menos 3 integradoras o equipos de robótica nos entregan sus propios planos P&ID / CAD / URDF** para meterlos en Tridi y piden acceso recurrente.
3. **Cerramos los primeros pilotos pagados ($300–$1,500)** que podamos reportar como actualización de tracción (*YC W27 Application Update*) antes del 11 de diciembre.
