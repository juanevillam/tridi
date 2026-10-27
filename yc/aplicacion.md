# La aplicación, pregunta por pregunta

Borradores en inglés listos para editar y pegar en [apply.ycombinator.com](https://apply.ycombinator.com). Las preguntas son las del ciclo 2026 según [Round Funded](https://www.roundfunded.com/en/blogs/how-to-apply-to-y-combinator-2026); **comparar con el formulario real antes de pegar**, porque YC las cambia entre batches.

Cómo se escribe para YC (de sus propios consejos, ver [`recursos.md`](recursos.md)):

- Directo y concreto. La primera frase de cada respuesta responde la pregunta.
- Números en vez de adjetivos. "Follows 3.5 s of an 11.8 s clip" le gana a "promising results".
- Nada de jerga de inversionista ("disruptive", "revolutionary", "TAM").
- Lo que no funciona se dice. Los partners premian la claridad y castigan la exageración.

`TODO(x)` = dato que solo esa persona sabe. **(débil)** = respuesta a reforzar esta semana.

---

## Founders

### Who writes code, or does other technical work on your product? Was any of it done by a non-founder? Please explain.

> TODO(equipo): confirm who the founders are first (see fundadores.md).
>
> All of the product was built by the founders during Platanus Hack 26 in Caracas (Oct 23-25, 2026), 151 commits in 36 hours. Pastor built the physics: the Unitree G1 in MuJoCo, retargeting and the first standing policy. Juan built the video-to-skeleton pipeline, the training and imitation pipeline, the video server and most of the web app. César built the web experience: the simulation UI and the in-browser physics. Ale led strategy, product and the pitch. No non-founder wrote product code; the only other commits are the hackathon organizers' template.

### Are you looking for a cofounder?

> No.

### Founder profiles

Cada fundador llena su perfil en el formulario (educación, trabajo, "something impressive you've built or achieved", LinkedIn, GitHub). Borradores y lo que falta en [`fundadores.md`](fundadores.md).

---

## Founder video

Un minuto, todos los fundadores, cámara simple. Guion: [`video-fundadores.md`](video-fundadores.md).

---

## Company

### Company name

> Tridi

### Describe what your company does in 50 characters or less.

> Turning everyday video into robot training data

(47 caracteres. Alternativas en [`narrativa.md`](narrativa.md#en-una-frase).)

### Company URL, if any

> TODO: ¿dominio propio? (tridi.ai / gettridi.com…). Si no hay, dejar el demo.

### Please provide a link to the product, if any.

> https://tridi-alpha.vercel.app (push the robot with the space bar; move in front of your camera and it copies you; upload a video of a person).

TODO(juan): confirmar que el servidor de video en la Mac esté prendido los días que YC pueda abrirlo, o que el demo funcione sin él (la parte de física corre toda en el navegador).

### If you have a demo, attach it below.

Video de 1-3 minutos: [`demo.md`](demo.md).

### What is your company going to make? Please describe your product and what it does or will do.

> Tridi turns an ordinary phone video of a person into data and trained policies for humanoid robots.
>
> Humanoid robots have bodies but no data: there is no internet of motion to train on. Today, teaching a humanoid a new motion means a motion-capture studio or teleoperating a real robot. Meanwhile there are millions of hours of people moving on video, but a robot can't use them as-is: different proportions, different mass, and a human motion is often physically impossible for the robot. If it copies it, it falls.
>
> Tridi closes that gap in three steps:
> 1. Capture: we find one person in the video (even in a crowd), extract their 3D skeleton (33 points, 30 fps) and retarget it to the robot's 29 joints (Unitree G1, 3.2 cm median error).
> 2. Gym: the robot practices that motion millions of times in physics (MuJoCo) with reinforcement learning, while we push it and change the floor, friction, mass and motors, until it can do it without falling.
> 3. Policy: the customer gets the trained policy (a 265 KB ONNX network that runs on the robot at 50 Hz in under 1 ms) and the physics-corrected motion dataset across four worlds.
>
> The video says what to do; the simulation teaches how.
>
> Today: the full pipeline runs end to end and the demo runs in any browser. A standing policy recovers from most 250 N pushes. Walking by imitation is in progress: it follows 3.5 s of an 11.8 s clip. Next: full imitation, then testing on a real G1.

### Where do you live now, and where would the company be based after YC?

> TODO(equipo): ciudad de cada uno. Borrador: We live in Venezuela (Caracas and Barquisimeto). After YC we would base the company in San Francisco.

### Explain your decision regarding location.

> TODO(equipo): decidirlo de verdad, no solo para la aplicación. Borrador: Our customers, the humanoid companies and robotics labs, and the hardware are in the US. We'd move to San Francisco to be next to them and to test on real robots. We would keep data collection in Latin America, where recording people doing tasks is already outsourced at a fraction of US cost.

---

## Progress

### How far along are you?

> We built a working end-to-end prototype in 36 hours at Platanus Hack 26 (Caracas, Oct 23-25, 2026) and are continuing it. Video or live camera → 3D skeleton → Unitree G1 in MuJoCo → reinforcement learning with randomized worlds → trained policy (ONNX) and dataset. It is live at tridi-alpha.vercel.app: the physics and the trained policy run in the browser.
>
> What works: video to robot motion (3.2 cm median error), a standing policy that recovers from most 250 N pushes (60M training steps), live copying of a person from the webcam, upload a video and train it in a queue, and export of the policy and the dataset.
> What doesn't yet: walking by imitation (follows 3.5 s of an 11.8 s clip), and we have not tested on a real robot.
>
> TODO: agregar el resultado del hackathon y lo que avancemos esta semana (conversaciones con clientes, segundos de caminata).

### How long have each of you been working on this? How much of that has been full-time? Please explain.

> TODO(equipo): ser exactos. Borrador: We started on Oct 23, 2026 at Platanus Hack 26 and worked full-time for its 36 hours. Since then, TODO hours per week each. Before the hackathon, Pastor and Juan prototyped webcam-to-robot motion for about two weeks (Pastor's "Sombra" MVP and our "Real Steel" prototype), which became Tridi.
>
> TODO: ¿quién sigue en otros trabajos o empresas? (Sálvalo, Tripealo, empleos). Decirlo.

### What tech stack are you using, or planning to use, to build this product? Include AI models and AI coding tools you use.

> Physics: MuJoCo (Python for training, compiled to WebAssembly for the browser), Unitree G1 model from MuJoCo Menagerie. Training: PyTorch, PPO with 64 parallel environments, DeepMimic-style imitation rewards, domain randomization; export to ONNX, run with onnxruntime-web. Vision: YOLO11-pose + ByteTrack to track one person, MediaPipe Pose (heavy) for 3D landmarks, Savitzky-Golay and One Euro filtering. Retargeting: inverse kinematics on the G1 model. Web: vanilla JS + three.js, deployed on Vercel. Video server: Python/FastAPI TODO(juan): confirmar. AI coding tools: Claude Code for most of the code, TODO otros.

### Are people using your product?

> Not yet beyond the demo. Hackathon judges and attendees used it live. TODO: números de analytics si existen.

### Do you have revenue?

> No.

### If you are applying with the same idea as a previous batch, did anything change? / If you applied with a different idea, why did you pivot?

> First application. (No aplica.)

### If you have already participated or committed to participate in an incubator, accelerator or pre-accelerator program, please tell us about it.

> TODO(equipo): ¿alguno participó en alguno con Sálvalo o Tripealo? Platanus Hack es un hackathon, no una aceleradora, pero conviene mencionarlo si Platanus Ventures ofreció algo.

---

## Idea

### Why did you pick this idea to work on? Do you have domain expertise in this area? How do you know people need what you're making?

> **(débil)** Hay que reescribirla con lo que salga de las conversaciones de esta semana.
>
> We believe the next step after chatbots and agents is AI that moves things in the physical world, and its bottleneck is data: LLMs had the internet, robots have nothing comparable. Pastor had been building webcam-to-robot motion before the hackathon; we tried seven ideas in the weeks before Platanus Hack and this was the one where we could show a real result in 36 hours.
>
> Domain expertise: honestly, early. None of us has worked at a robotics company. In 36 hours we learned to train a humanoid policy that runs in a browser, which is the kind of speed we bring.
>
> How we know people need it: robot companies already spend over $100M a year on real-world data (Micro1's CEO, MIT Technology Review, Apr 2026); Scale AI delivered 150,000+ hours of physical-AI data in 2025; Apptronik raised ~$935M partly for data collection centers. TODO: lo que digan las conversaciones con clientes (nombres, citas).

### Who are your competitors? What do you understand about your business that they don't?

> TODO: reescribir con [`investigacion/startups/robotica-y-physical-ai.md`](investigacion/startups/robotica-y-physical-ai.md): nombrar a Asimov (YC W26) e Intelligence Factory (YC Spring 26) y posicionarnos como la capa de conversión de cuerpo entero.
>
> Closest: open research pipelines like G1 Moves and VideoMimic that turn single-camera video into humanoid motion; Ultimate Bots Studio, which maps video onto NVIDIA's pre-trained controller; data vendors like Scale AI and Micro1 that sell raw human video and teleoperation; and phone mocap tools (Move.ai, DeepMotion) that stop at the skeleton.
>
> What we understand: raw human video and pose capture are becoming a commodity; what's scarce is motion a specific robot can actually perform. The value is in the physics step that turns an impossible human motion into a feasible robot motion, plus a policy that already executes it. We sell that per motion and per robot, not a giant foundation model only NVIDIA or Figure can train. **(débil: validar con clientes.)**

### How do or will you make money? How much could you make?

> We charge per trained skill (a policy + its physics-corrected dataset, for the customer's robot) and per volume of motion data. Robotics companies spend over $100M a year on real-world data today, and that spend grows with the number of humanoids deployed. TODO: un cálculo de abajo hacia arriba: N empresas/labs × M habilidades al año × precio. Ej.: 500 teams × 20 skills × $2,000 = $20M/yr just for skills, before data volume. Ajustar con lo que digan los clientes.

### If you had any other ideas you considered applying with, please list them.

> Sálvalo (TODO: una línea, ya existe como empresa), Tripealo (TODO), and from our hackathon prep: Freno (a safety firewall between an AI model and a robot's motors), Relevo (remote human operators in Latin America who take over a robot when it's stuck), and Campo (satellite crop alerts for farmers over WhatsApp).

Cómo contar Sálvalo y Tripealo: [`otras-ideas.md`](otras-ideas.md).

---

## Equity

### Have you formed ANY legal entity yet?

> TODO(equipo): No para Tridi (borrador). Si Sálvalo o Tripealo tienen empresa, aclarar que es otra.

### Have you taken any investment yet?

> No.

### Are you currently fundraising?

> No.

### Equity breakdown

El formulario pide el reparto entre fundadores. Decidirlo antes: [`legal-y-equity.md`](legal-y-equity.md).

---

## Curious

### What convinced you to apply to Y Combinator? Did someone encourage you to apply? Have you been to any YC events?

> TODO(equipo). Ser honestos y concretos: ¿quién lo sugirió? ¿Platanus o sus mentores? ¿Startup School? Nombrar a la persona si alguien de YC o un fundador YC nos recomendó.

### How did you hear about Y Combinator?

> TODO(equipo).

---

## Batch preference

> Winter 2027. Si el formulario ofrece "también consideren el siguiente batch", marcarlo: no perdemos nada.
