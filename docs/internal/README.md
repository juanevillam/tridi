# Documentación Interna y Casos Reales — Tridi (`docs/internal/`)

> **CONFIDENCIAL / USO INTERNO DEL EQUIPO (`juanevillam/tridi`)**  
> Reúne en un solo lugar las reuniones industriales, casos de hardware real y manuales técnicos para **Juan, Pastor, César y Ale**.

---

## Índice

| Documento | Qué contiene | Ruta |
| :--- | :--- | :--- |
| **1. Reunión Industrial — ZAKA, C.A.** | Quién es **ZAKA, C.A.** (`zakasys.com`, Rockwell / Siemens / AVEVA / PackML), postura del equipo como aliados y generación de relevo (cero competencia), qué mostrar en 3 minutos y las 4 preguntas de validación dura. | [`reunion-zaka.md`](reunion-zaka.md) |
| **2. Caso Real #1 — Robot Físico de Luigi (`luigi_lab3`)** | Qué pasó en la reunión con Luigi D'Aquaro, cómo armamos el gemelo digital desde sus 6 `.stl`, los 5 problemas reales de hardware que encontramos (`pulseIn()`, sensor clon `0x9E`, zona muerta `PWM < 115`, `2 KB` de RAM) y cómo lo sacamos andando a `50 Hz`. | [`caso-luigi-sim2real.md`](caso-luigi-sim2real.md) |
| **3. Arquitectura y Sim-to-Real** | Pipeline técnico end-to-end: Captura 2.0 (`GVHMR + WiLoR`), retargeting IK + manos de 5 dedos (`physics/`), entrenamiento PPO y compilador `export_mcu.py` (`training/`), modelos `luigi_lab3` / `luigi_lab4` / `factory_cell` y rutas de `web/`. | [`architecture-and-sim2real.md`](architecture-and-sim2real.md) |
| **4. Infraestructura y Seguridad (`trytridi.com`)** | Namecheap (`DNSSEC`), Cloudflare Pages (`tridi`), CI/CD (`.github/workflows/deploy.yml`), `SPF`/`DMARC`, `HSTS Preload`, `CSP` y servidor de video en la Mac (`data/serve.sh`, `data/server.py`). | [`infra-and-security.md`](infra-and-security.md) |
| **5. Referencia Y Combinator W27** | Respuestas exactas enviadas en la aplicación a YC W27 (2 de noviembre de 2026), reparto `25/25/25/25` y mapa de la carpeta [`yc/`](../../yc/README.md). | [`yc-w27-reference.md`](yc-w27-reference.md) |
