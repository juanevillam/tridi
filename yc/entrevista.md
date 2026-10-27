# La entrevista

Si nos invitan: **10 minutos por video** con dos o tres partners, en noviembre o diciembre. Preguntan rápido y cortan. Lo que miden: si entendemos el problema mejor que nadie, si somos claros, si construimos rápido, y si somos honestos.

## Reglas

- **Respuestas de 1-2 frases.** Si quieren más, preguntan. Contestar largo come las preguntas que nos convienen.
- **Responde una persona por pregunta.** El CEO toma las de negocio; Pastor o Juan las técnicas. Nadie interrumpe ni corrige a otro en vivo.
- **"No lo sabemos todavía" vale.** Inventar un número cuesta la entrevista.
- Ensayar con `/simulacro` (skill del repo privado `platanus-ideas`) y con gente de afuera que pregunte duro.

## Las que seguro preguntan

| Pregunta | Respuesta corta (borrador) |
| --- | --- |
| What do you do? | We turn ordinary video of a person into training data and trained policies for humanoid robots. |
| Who is the customer? Who have you talked to? | **(débil)** TODO: nombres de las conversaciones de esta semana. Sin eso: "Robotics labs and humanoid companies that own robots like the Unitree G1. We've started talking to X." |
| Why will they pay? | Getting a new motion onto a humanoid today means a mocap studio or teleoperation: weeks and thousands of dollars per motion. We do it from a phone video. TODO: validar el costo real con un cliente. |
| Does it work? | The full pipeline works and it's live. The standing policy recovers from most 250 N pushes. Walking by imitation doesn't work yet: it follows 3.5 s of an 11.8 s clip. |
| Has it run on a real robot? | No. That's the next step. We export to ONNX, the format a robot runs, but we haven't modeled motor delay and sensor noise, which is what changes on hardware. |
| What's yours, if it's all MuJoCo, MediaPipe and PyTorch? | The pieces are standard; the pipeline is ours: picking and tracking one person in a crowd, recovering where they walk (MediaPipe doesn't give that), retargeting to the G1, the imitation reward, and making the browser and Python give identical results. |
| Why you? | We built the whole thing in 36 hours, from zero, and shipped it live. TODO: un hecho de cada fundador. |
| Competitors? | Research pipelines like G1 Moves and VideoMimic, data vendors like Scale and Micro1, and NVIDIA's own models. Research projects aren't products; data vendors sell raw video; NVIDIA can be a customer of motion data. |
| Why won't NVIDIA or Figure do this themselves? | They will, for their own robots. The hundreds of teams that buy a G1 can't. We're their data team. |
| How big can this be? | Robot companies already spend over $100M a year on real-world data, and it grows with every humanoid deployed. TODO: cuenta de abajo hacia arriba. |
| What's the hardest part? | Sim-to-real, and getting long motions like walking to work by imitation. |
| What will you do in the next 3 months? | TODO: 1) walking by imitation end to end, 2) one real G1 running our policy, 3) N paying pilot customers. |
| Are you all full-time? | TODO: respuesta real de cada uno. |
| Why YC / why move to SF? | Our customers and the hardware are there. |
| Where does the data come from? Do you own it? | Hackathon tests used YouTube videos. To sell, we record our own or licensed video; recording people in Latin America is cheap and already outsourced. |
| How much does a policy cost to make? | 30-70 minutes of laptop CPU today. On a cloud GPU, minutes. TODO: medirlo. |

## Las difíciles (de [`contexto-tecnico.md`](contexto-tecnico.md) y el interrogatorio del hackathon)

- **"The standing policy doesn't use the video at all."** True: it learned to stand from a reward, not a clip. But it's the base: a robot that can't balance can't imitate anything. First it learns not to fall, then to move like the person.
- **"AMASS is free, clean mocap."** It has few motions, and several datasets (LAFAN1, EgoDex) can't be used commercially. Video has every motion in the world.
- **"This is a hackathon project."** Yes, three days old. What matters is how fast we went, and what we do this week. TODO: lo que hayamos hecho después del hack.
- **"You have another company (Sálvalo / Tripealo)."** TODO: respuesta honesta sobre dedicación ([`otras-ideas.md`](otras-ideas.md)).

## Preguntas de entrevistas YC para practicar

La lista clásica de preguntas de entrevista YC está en [`recursos.md`](recursos.md). Practicar todas en voz alta, cronometradas, con alguien que corte a los 20 segundos.
