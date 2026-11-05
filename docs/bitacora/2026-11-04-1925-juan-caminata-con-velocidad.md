---
persona: Juan
rama: juan/experimental
sesion: 6f6767dc-9ab1-4aa4-97c3-b1e8ee179dea
inicio: 2026-11-04 19:25
estado: en curso
---

# Caminata que siente su velocidad (corrida de la noche)

Sigue a [`2026-11-03-1200-juan-experimental-v2.md`](2026-11-03-1200-juan-experimental-v2.md): ahí están el escalón 1, los empujones, el pronóstico y las sondas.

## Objetivo

Que la caminata aguante el empujón de la web (250 N) dándole a la política su propia velocidad de pelvis (`--sense-velocity`), entrenada desde cero en la noche, cuando la Mac está libre.

## Qué se hizo

- La corrida de la noche de la sesión anterior (`walk-vel-seed0`) murió a los 3,1 M pasos (sigue 2,46 s del clip, todavía aprendiendo) al cerrarse esa sesión de Claude Code: el entrenamiento era hijo de la sesión (`BrokenPipeError`).
- Relanzada con `nohup` desde `training/runs/night-vel.sh` (salida en `training/runs/night-vel.out`), con `--resume`: sobrevive a que se cierre Claude. Fase 1: caminata desde cero con velocidad, sin empujones, hasta 20 M pasos (se corta sola al seguir el clip entero). Fase 2 (`walk-vel-push-seed0`): empujones de 150-300 N + `--recover`, contra el empujón de la web, cortada por el pronóstico. Al final: escalón 1, empujón de la web y barrido de fuerzas.

- Pausado a pedido de Juan (película en 4K, que la Mac no se caliente) a los 3,21 M pasos, con Ctrl-C: guardó `latest.pt`. Para seguir: `nohup sh training/runs/night-vel.sh > training/runs/night-vel.out 2>&1 &` (la fase 1 ya usa `--resume`).

- **Robots físicos de Luigi** (pedido de Juan, con capturas del chat del equipo): posible reunión el viernes con Luigi, ingeniero electrónico amigo de Ale, que tiene robots sencillos reales (por la imagen, un carrito de dos ruedas con sensor ultrasónico) y simulados en Proteus. Nuevo [`../robots-fisicos.md`](../robots-fisicos.md): qué se dijo en el chat, qué se ve en la imagen, qué es verdad hoy (Tridi nunca corrió en hardware; un carrito no camina), tres demos posibles de menor a mayor valor (gesto → servo en vivo; recorrido de un video → carrito real; controlador entrenado en simulación que funciona en el real, que responde a la duda de César sobre las instrucciones escritas a mano), preguntas para Luigi y qué cambiaría en el repo. Pregunta abierta agregada en [`../preguntas-abiertas.md`](../preguntas-abiertas.md).

- **Captura 2.0 empezada** (Juan: usar SMPL-X con su licencia no comercial, "Tridi es un playground"). Decisión anotada en [`../plan-v2.md`](../plan-v2.md), sección 10. GVHMR clonado fuera del repo (`~/Code/tridi-thirdparty/GVHMR`, su propio entorno con torch 2.3 y pytorch3d compilado para la Mac). Nuevo [`../../data/capture2/`](../../data/capture2/README.md): `gvhmr_mac.py` lo corre en MPS sin tocar su código (su licencia pide publicar las modificaciones), sin DPVO (usa su odometría SIFT en CPU) y sin render. Su código importa y los `.cuda()` van a MPS. **Falta:** los pesos (Google Drive no deja bajarlos por script; no se usan espejos de terceros porque un `.ckpt` puede ejecutar código) y los modelos de cuerpo SMPL-X/SMPL (piden cuenta): los baja Juan en el navegador, lista exacta en el README.

- **GVHMR corre de punta a punta en la Mac** (Juan bajó los pesos y los modelos de cuerpo; todos revisados con `picklescan`, limpios; el `.pkl` de SMPL, que `picklescan` no lee, revisado a mano: solo tipos de datos). Hizo falta parchar también el `.cuda()` de Lightning y correr el modelo final de GVHMR en CPU (en MPS aborta). `data/capture2/to_joints.py` pasa SMPL-X a los 33 puntos para comparar con `data.quality`. Baile: patina 0,29 → 0,04 m/s, huesos 9,6 % → 0 %, altura 1,56 → 1,64 m, temblor igual. Saltos de tijera: temblor 13,4 → 17,4 y pies igual, huesos 0 %; MediaPipe va suavizado y GVHMR crudo. 5,5 min por 11 s de video.

## Qué funcionó

- 

## Qué no funcionó

- Correr entrenamientos largos como tarea de fondo de la sesión: mueren con ella.

## Decisiones

- Antes de más rondas largas de humanoide, prioridad a preparar la demo física con Luigi. No se construye código para su robot hasta conocer su hardware: cada respuesta cambia el diseño.

- Los entrenamientos de la noche se lanzan con `nohup`, desacoplados de la sesión de Claude.

## Sigue

- Captura 2.0: suavizar GVHMR igual que MediaPipe y comparar en todo el set de prueba (~2 h de GPU, de noche); probar caminando hacia la cámara; después manos (HaMeR o WiLoR, cuenta MANO de Juan) y `PoseClip` v2.

- Reunión con Luigi (tentativa, viernes): llevar las preguntas de [`../robots-fisicos.md`](../robots-fisicos.md). Con sus respuestas: modelo MuJoCo del carrito y la demo del recorrido.

- Resultado de la noche: si el empujón de la web pasa 0,55, cambiar el contrato (`docs/contrato.md`) y `physics/src/policy.js` para dar la velocidad de la pelvis a la política en la web.
- Entrenar el H1 y resolver su 76 % de contacto.
- Licencia de SMPL-X (no comercial): Juan decide antes de la captura 2.0.
