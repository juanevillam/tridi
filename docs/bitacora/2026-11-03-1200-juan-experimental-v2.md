---
persona: Juan
rama: juan/experimental
sesion: f4039e1b-2fb0-4ba8-a1c0-e31a058bcb5a
inicio: 2026-11-03 12:00
estado: abierta
---

# Rama experimental: landing en ES/EN y plan Tridi v2

## Objetivo

Trabajar en una rama aparte (`juan/experimental`, local, sin push ni deploy: la demo queda como se mandó a YC) en una versión mucho mejor de Tridi, para mostrarla a los cofundadores cuando esté avanzada. Primero: landing más fluida y en español e inglés sin recargar (como el portafolio de Juan). Después: el plan más ambicioso posible para tracking, entrenamiento y producto.

## Qué se hizo

- Rama `juan/experimental` desde `main`.
- **Idiomas sin recargar** (`web/src/i18n.js`): cada texto está en el DOM una vez por idioma y el CSS muestra el de `<html data-lang>`, el mismo patrón que el portafolio (`website/src/components/T.astro`). Un script en `index.html` decide el idioma antes del primer cuadro (`?lang=`, guardado, navegador, si no inglés). `dict()` por pantalla da `T()` (HTML con los dos idiomas), `t()` (texto plano) y `A()` (atributos como `aria-label` que siguen al idioma). Números con la coma o el punto de cada idioma (`fmt`, `fmtInt`). Selector ES · EN (`langSwitch()`) en la barra de la landing.
- **Landing traducida entera** (`web/src/landing/strings.js`), incluido lo que escribe en vivo: HUD, estados del Gym, carga, contador de pasos, manifiesto palabra por palabra.
- **Fluidez:** medido el scroll de punta a punta: mediana 16,7 ms/cuadro, p95 17,6 ms, pero un cuadro de ~1.030 ms al entrar a Capture. Causa probable: el esqueleto de Capture crea un segundo renderer WebGL y compila shaders al llegar. Ahora se arma en un momento ocioso después de cargar el robot (y se dibuja una vez), y los checkpoints del Gym se bajan a la caché antes.
- **Plan maestro:** [`docs/plan-v2.md`](../plan-v2.md): línea de partida con números, 7 pilares (web, captura SMPL-X con manos, retargeting con IK y manos, entrenamiento en GPU con miles de millones de pasos y un tracker general, producto, infraestructura, sim2real), orden por bloques, puntos de decisión, riesgos y preguntas.

## Qué funcionó

- Cambiar ES ↔ EN en la landing es instantáneo y no recarga; el `aria-label` y los números también cambian. Probado en el navegador de la app (textos del hero, Gym y cierre en los dos idiomas). `vite build` pasa.

## Qué no funcionó

- No se pudo volver a medir el congelón de Capture después del arreglo: el panel del navegador estaba oculto y `requestAnimationFrame` no corre ahí. Falta medirlo con el panel visible.

## Decisiones

- Idioma por defecto cuando el navegador no es ni español ni inglés: inglés (la empresa apunta a EE. UU.).
- Cada pantalla guarda su copy junto a su código (un diccionario por pantalla), no un archivo gigante de traducciones.
- La rama no se sube a `origin` hasta que Juan lo diga.
- **Respuestas de Juan (segunda vuelta):** todo es de Juan; la rama vive en su repo privado `juanevillam/tridi` (subida; nunca `main` ni `Torpass/tridi`); manos de 5 dedos; cómputo solo en su Mac M2 con herramientas gratis y locales (24 h por video está bien); no se muestra a Pastor antes. Visión: un video (p. ej. 3 min lavando platos) → física fiel → RL con millones de variaciones → habilidades que corren debajo de un modelo grande, para cualquier humanoide. Comparable en YC: Asimov (junta muchos datos reales; nosotros multiplicamos uno con física).
- `docs/plan-v2.md` reescrito con eso: controles contra el estancamiento (C1-C4, evaluación fija, mapa de caídas, salud, detector de meseta, regla de la década, registro), escena y objetos, paquete de robot para cualquier humanoide, entrenamiento eficiente en CPU, escalera de 8 habilidades hasta lavar, licencias.

## Preguntas abiertas para Juan

- GPU gratis en la nube (Kaggle da ~30 h/semana): es gratis, pero los videos salen de la Mac. ¿Se permite para entrenar, o solo la Mac?
- El set de prueba (20 videos) lo graba Juan: ¿tiene dónde grabar una cocina para los escalones 4-6?

## Sigue

- Idiomas en En vivo, Subir, Simulaciones, Entrega, Cámara y Red.
- Medir la fluidez con el panel visible y fijar el presupuesto (ningún cuadro > 50 ms).
- Bloque 1 del plan: los controles contra el estancamiento en `training/`, probados sobre `walk-v4`.
