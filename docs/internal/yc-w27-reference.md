# Y Combinator Winter 2027 — Exact Submitted Application Reference

> **INTERNAL & CONFIDENTIAL:** Exact record of the YC Winter 2027 application submitted by Tridi on **November 2, 2026** (before the 8:00 PM PT deadline). Company answers cannot be edited post-submission; founder profiles remain editable in the YC portal.

---

## 1. Founding Team & Equity Breakdown

We submitted an **equal 25% split** among the four co-founders, vesting over **5 years (20% per year)**:

| Founder | Title in YC Portal | Equity | Technical? | Exclusive 1-Yr Commitment? | Location | Links |
| --- | --- | --- | --- | --- | --- | --- |
| **Pastor Jiménez** | CEO | 25% | Yes | Yes | Barquisimeto, VE | [LinkedIn](https://www.linkedin.com/in/pastor-jimenez) · [GitHub](https://github.com/Torpass) · [tripealo.app](https://tripealo.app) |
| **Juan Villa** | CTO | 25% | Yes | Yes | Barquisimeto, VE | [LinkedIn](https://linkedin.com/in/juanevillam) · [GitHub](https://github.com/juanevillam) · [juanevillam.com](https://juanevillam.com) |
| **César Martínez** | CTO (in profile) / CIO (in Equity section) | 25% | Yes | Yes | Barquisimeto, VE | [LinkedIn](https://www.linkedin.com/in/cesarmartinez-dev) · [GitHub](https://github.com/CisorM) · [cisorm.github.io](https://cisorm.github.io) |
| **José Alejandro Hernández Torres** | COO | 25% | No | Yes | Barquisimeto, VE | [LinkedIn](https://www.linkedin.com/in/alehernandezt/en/) · [GitHub](https://github.com/AleHernandezt) · [alehernandezt.github.io](https://alehernandezt.github.io) |

---

## 2. Founder Profiles — Exact Accomplishment Answers

### Pastor Jiménez (CEO)
- **Non-computer system hack:**
  > When I was about 14, Venezuela was in hyperinflation and a phone was out of reach for my family. I played Hypixel Skyblock, a Minecraft server, found a bug that let me duplicate in-game money, and sold those coins for dollars to players abroad. In practice, I had found a way to earn hard currency from a country where the local money was worthless. With it I bought my first phone and then my first computer, which is the one I learned to code on.
- **Most impressive thing built/achieved:**
  > I designed and built the agentic AI infrastructure at Binaural, Venezuela's #1 Odoo partner: MCP servers wired into the ERP and GitHub, a RAG over every project's docs and scope, and role-specific agents and skills. The whole technical and functional team uses it daily. It cut development cost and time by 73% in two months, and consultants can now generate, test and deploy their own Odoo modules.

### Juan Villa (CTO)
- **Non-computer system hack:**
  > As a kid, I sold my grandmother’s brownies at my after-school study sessions. Instead of pitching anyone, I arrived first, sat in the front, and set the neat little basket under my seat. Classmates came to me, so I never had to sell. Out of about 10 kids, I’d sell all six or so brownies every time. My pay was a commission per sale or the crumbs, and I always took the crumbs. It taught me that the best sales channel is a product people notice and want.
- **Most impressive thing built/achieved:**
  > Working remotely from Venezuela, I built Crol ERP Móvil from scratch, design included: the mobile app of Crol, a Mexican cloud ERP. Businesses across Mexico now use it to sell on the road, issue CFDI e-invoices and manage collections.

### César Martínez (CIO / CTO)
- **Non-computer system hack:**
  > After the June earthquake, information about donation drop-off centers in Barquisimeto was buried in thousands of Instagram and WhatsApp posts, so people didn't know what to bring or where to go. I repurposed my startup Tripealo's infrastructure into a dedicated section: we scraped and manually verified posts, registered 100+ collection centers, and tracked whether each one was still active in real time by following their Instagram and WhatsApp stories. That turned a chaotic social feed into a single reliable source. We then helped coordinate trucks to La Guaira and partnered with Fina and the centers to streamline logistics.
- **Most impressive thing built/achieved:**
  > I digitized my family's two-location electronics store: I built the system that now runs its inventory, sales, repairs and financing, while also managing sales there since 2022.

### José Alejandro Hernández Torres (COO)
- **Non-computer system hack:**
  > when I was a 12 years, I find a way to organize local events in a park near my house. In this events, local entrepreneurs sell products and I receive 50$ for the stand that I made by myself. Using this method I paid my first laptop and paid my first English course.
- **Most impressive thing built/achieved:**
  > After this experience creating something from zero and start to earn money being the intermediate I decided to pivot this project. I found my-commerce. A marketplace that centralize this kind of local entrepreneurs in the same platform

---

## 3. Founders Section (Submitted Verbatim)

### How long have the founders known one another and how did you meet? Have any of the founders not met in person?
> Pastor and Juan went to school together, from primary through high school. By 2016–2017, when we were 13, we were already talking about technology and Bitcoin. Pastor met César and Ale at university. The three of them were a group of misfit hackers who got bored in class, so they started meeting to build things together. In October 2025, Pastor brought Juan in so the four of us could apply to the AlegrIA hackathon in Caracas, where Tripealo was born. Afterwards our paths split: Juan went on to cofound Salvalo, while Pastor, César and Ale kept building Tripealo. Platanus Hack 26 brought the four of us back together. We built Tridi there in 36 hours, and now the four of us are cofounding it. All four founders have met in person.

### Who writes code, or does other technical work on your product? Was any of it done by a non-founder? Please explain.
> All of it was written by the four founders; no non-founders contributed.
> - Pastor Jiménez: physics simulation, motion retargeting, in-browser rendering and the training environment.
> - Juan Villa: video-to-3D-pose pipeline, the video processing server and the training queue; co-owns policy training.
> - César Martínez: the web app (live camera, upload, simulation viewer).
> - José Alejandro Hernández: competitive research, product strategy and pitch.
>
> We use AI coding agents heavily (Claude Code), and we direct and review all of it.

### Are you looking for a cofounder?
> No.

---

## 4. Company Section (Submitted Verbatim)

- **Company name:** `Tridi`
- **Describe what your company does in 50 characters or less:**
  `Human video into training data for humanoid robots`
- **Company URL, if any:** `https://tridi-alpha.vercel.app` (and new production domain: `https://trytridi.com`)
- **Please provide a link to the product, if any:** `https://tridi-alpha.vercel.app`

### What is your company going to make? Please describe your product and what it does or will do.
> Physical AI is the new sexy. LLMs were trained on the entire internet. Robots have nothing like that: human motion data is scarce, expensive and slow to collect. Today, teaching a humanoid a new motion means mocap suits, a studio or months of teleoperation, on perfect floors that don't exist outside the lab.
>
> Meanwhile there is an enormous amount of video of people moving. But video only shows where the joints went, not the physics behind it: gravity, balance, contact and friction. A robot that just copies the motion falls.
>
> Tridi turns any video into robot training data. You upload a clip or record with your phone. We find the person, even in a crowd, extract their 3D skeleton (33 points at 30 fps) and map it onto the robot's 29 joints. Then the robot practices that motion millions of times in a physics simulator (MuJoCo), with real gravity, contact and friction and under varied conditions, until it can do it without falling. Standing policies work today; learning to walk from video is what we're building now. The video says what to do; the simulation teaches how.
>
> Customers will get two things: a small trained policy (ONNX, ready to run on the robot) and the motion data corrected by physics, recorded across many conditions. We start with humanoid companies. The same simulator later serves any hardware company that needs data from its machines in conditions it can't reproduce in a lab.

### Where do you live now, and where would the company be based after YC?
> Barquisimeto, Venezuela / San Francisco, USA

### Explain your decision regarding location.
> We would be in San Francisco during YC, since the batch is in person, and stay in the Bay Area afterwards. Our customers (Figure, 1X, Tesla Optimus) and the real humanoid hardware we need to test our policies on are there, and we can't do that from Venezuela.

---

## 5. Progress Section (Submitted Verbatim)

### How far along are you?
> We have a working prototype, live and open source, built in 36 hours at Platanus Hack 26 (October 2026):
> - Video to robot: from a phone video or a live camera, we pick one person out of several, extract their 3D motion and retarget it to a Unitree G1 humanoid with 3.2 cm median error.
> - Physics training: a 265 KB neural policy controls all 29 motors, deciding every 20 ms in under 1 ms. Our standing policy (60M training steps on two MacBooks) withstands most 250 N pushes; untrained, the robot falls in about one second.
> - Four test worlds (flat, rocks, slippery floor, wind) and a training queue that goes from uploaded video to retargeting, training and a downloadable dataset.
> - Everything runs in the browser: anyone can push the robot at tridi-alpha.vercel.app.

### How long have each of you been working on this? How much of that has been full-time? Please explain.
> We started on October 23, 2026, at the hackathon, all four full-time for 36 hours.

### What tech stack are you using, or planning to use, to build this product? Include AI models and AI coding tools you use.
> - Physics: MuJoCo 3.16, in Python for training and compiled to WebAssembly in the browser. Robot: Unitree G1 model from MuJoCo Menagerie.
> - Training: our own PPO implementation in PyTorch with a DeepMimic-style imitation reward, on Apple Silicon Macs. Policies export to ONNX.
> - Video to 3D pose: Ultralytics YOLO pose + ByteTrack to pick and track one person, MediaPipe Pose for 3D landmarks, OpenCV, temporal smoothing (Savitzky-Golay, One Euro).
> - Backend: FastAPI video server with chunked uploads and a training queue.
> - Frontend: Vite, three.js, onnxruntime-web, MediaPipe in the browser, deployed on Vercel.
> - AI coding tools: Claude Code.
> - Next: GPU training in the cloud (MuJoCo MJX or Isaac Lab) to go from hours per clip to minutes.

### Are people using your product?
> No

### When will you have a version people can use?
> A public demo is live now at tridi-alpha.vercel.app: anyone can upload a video, watch the robot imitate it and push it. The version a humanoid company can use, a policy that follows a full clip, plus its physics-corrected dataset, is our next milestone.

### Do you have revenue?
> no

### If you are applying with the same idea as a previous batch, did anything change? If you applied with a different idea, why did you pivot and what did you learn from the last idea?
> This is our first application with Tridi. In 2024, Juan applied to YC with a different startup, Latydo, a telemedicine app for Venezuela, where he was tech lead. It wasn't accepted, and the team later stopped working together: it wasn't a good fit, and too many people had equity before anything was built. The lesson: don't give equity before you've built something and proven you work well together. For Tridi, the four of us had already built different products together.

### If you have already participated or committed to participate in an incubator, "accelerator" or "pre-accelerator" program, please tell us about it.
> We built Tridi in 36 hours at Platanus Hack 26 in Caracas, a hackathon run by Platanus with Slash, Anthropic, Yummy and Vercel. During the event we received mentorship on how to shape the product, but we are not in any program right now.

---

## 6. Idea Section (Submitted Verbatim)

### Why did you pick this idea to work on? Do you have domain expertise in this area? How do you know people need what you’re making?
> A year ago the question was how to turn a chatbot into an agent. Now the open question is how to make a neural network move a robot, and the bottleneck is data. Humanoid companies have bodies and models but no internet of motion to learn from.
>
> Domain expertise: Pastor builds AI systems that people rely on every day. At Binaural, Venezuela's #1 Odoo partner, he designed and built the company's agentic AI infrastructure: MCP servers wired into the ERP and GitHub, a RAG over every project's docs and scope, and role-specific agents and skills. The whole technical and functional team uses it daily, and it cut development cost and time by 73% in two months. For Tridi, Pastor and Juan wrote the simulation, the imitation reward and our own PPO training loop, and we trained our policies from scratch, with no pre-trained base model.
>
> How we know it's needed: in 2025 Tesla reportedly moved Optimus training away from motion-capture suits and teleoperation toward camera video, because teleoperation doesn't scale (Business Insider, August 2025). Startups like Asimov now exist just to collect human movement data for humanoids. But raw human video isn't robot data: a robot that copies it falls. Making motion physically possible for a specific robot, under real-world conditions, is a step we haven't seen sold as a product.
>
> We haven't sold to anyone yet. Our next step is talking to humanoid teams to find which motions and conditions they need first.

### Who are your competitors? What do you understand about your business that they don’t?
> - Data collection: motion-capture studios, in-house teleoperation teams and startups like Asimov that collect human movement data. Their data is human-shaped and slow to capture, and it still has to be adapted to each robot.
> - Video-to-robot tools: Ultimate Bots Studio (free, browser-based) retargets phone video and evaluates it with a pre-trained control model. AgiBot LinkCraft does it only for AgiBot's own robot. Open-source tools like video2robot stop at retargeting.
> - Research: VideoMimic (UC Berkeley) showed video-trained policies running on a real G1. It's a paper and a lab setup, not a product.
>
> What we understand: copying is not data. A human motion mapped onto a robot is only a copy of the movement: it ignores gravity, balance, contact and friction, so the robot falls. The value is in the correction: the robot learns the motion itself, in physics, under varied conditions. Others rent a pre-trained model or stop at the copy. We train a policy from each video and deliver the physics-corrected data, which is what a robot company can actually train on.

### How do or will you make money? How much could you make?
> We'll sell to humanoid robot companies: usage-based pricing per hour of physics-corrected motion data and per trained policy, plus annual contracts for teams that train on our platform continuously.
>
> Our rough estimate, still to be validated: ~50 well-funded humanoid companies × $300k–$1M a year each on motion data = $15M–$50M a year in the near term. The larger prize is every robot that ships: each new skill on each new body needs motion data. After humanoids, the same simulator serves any hardware company that needs data from its machines in conditions it can't reproduce in a lab.

### If you had any other ideas you considered applying with, please list them.
> Sombra: a live camera that turns a person's 3D skeleton into a robot copying them in real time. We dropped it because copying live doesn't teach the robot anything; Tridi grew out of it.

---

## 7. Equity & Curious Sections (Submitted Verbatim)

### Have you formed ANY legal entity yet?
> no

### Planned equity ownership breakdown:
> We plan an equal split between the four founders:
>
> Pastor Jiménez, CEO: 25%
> Juan Villa, CTO: 25%
> César Martínez, CIO: 25%
> José Alejandro Hernández, COO: 25%
>
> Each founder's equity vests individually over 5 years, 20% per year, so it's earned by staying and building. There are no other stockholders or employees yet.

### Have you taken any investment yet? / Are you currently fundraising?
> no / no

### What convinced you to apply to Y Combinator? Did someone encourage you to apply? Have you been to any YC events?
> We built Tridi in 36 hours and want to find out, as fast as possible, whether humanoid companies will pay for it. Tridi is a global product: the motion data it produces could help define the next generation of AI, the kind that moves in the physical world. From Venezuela there's no realistic way to make that happen: our customers, the investors in this space and the robots we need to test on are all abroad. YC is our way in. It puts us next to the companies building robots, so we can validate the market with them, and next to founders who have taken deep tech from a prototype to customers. Victor Cárdenas and Vicente Zavarce encouraged us to apply when we met them at AlegrIA. We haven't been to any YC events.

### How did you hear about Y Combinator?
> Victor Cárdenas (cofounder of Slash, a YC alum) told us in person at the AlegrIA hackathon in Caracas last year that if we built a good company we should apply to YC. Vicente Zavarce (founder and CEO of Yummy, YC S21) told us the same on a call during the hackathon.

### Batch Preference:
> Winter 2027

---

## 8. Post-Submission Progress (Nov 2 – Nov 9, 2026 — For YC Interview)

Everything below was built in the **7 days immediately after submitting the application** and is live on both **`https://trytridi.com`** and **`https://tridi-alpha.vercel.app`**:

| Area | At Submission (Nov 2, 2026) | Today (Nov 9, 2026) |
| --- | --- | --- |
| **3D Pose Extraction** | MediaPipe 3D (33 landmarks, body only, root drift on jumps) | **Capture 2.0 (`GVHMR + WiLoR`)**: world-space SMPL-X + 21-keypoint 5-finger hands ($< 2\text{ cm}$ fingertip error: **0.34 cm** counting 1–5) + aerial flight preservation |
| **Standing Balance Policy** | 60M steps (`g1-stand.onnx`), holds most 250 N pushes | **300M steps (`Stand v2`)** with pelvis velocity sensing + Capture Point stepping reward: holds **4.0 / 4 pushes at 250 N** and up to **320–350 N** across all 4 terrains |
| **Imitation Policies** | Walk followed 3.5 s of 11.8 s | **All 9 policies complete 100% of their clips**: `g1-walk`, `g1-run`, `g1-jacks`, `g1-saludar`, `g1-dedos`, `g1-bailar`, `g1-frente`, `g1-sentarse`, and `h1-walk` |
| **Robot Morphologies** | Unitree G1 only | **Unitree G1 (29 DOF + 5-finger hands)**, **Unitree H1 (19 DOF)**, and **`luigi_lab3` (differential mobile robot)** |
| **Object & Liquid Physics** | Terrain only | Rigid body (`taza`, 0.35 kg) + fluid particles (`agua`) with dry grip ($\mu = 0.85$) vs soapy slip ($\mu = 0.12$) |
| **Physical Sim-to-Real** | Simulation only | **Completed first physical Sim-to-Real transfer (`#/milestones`)**: CAD `.stl` → MuJoCo digital twin → PPO ONNX policy (17 KB) deployed zero-shot onto real hardware (Arduino UNO + L298N + HC-SR04 + APDS-9960) and live over WebSerial at 50 Hz |
