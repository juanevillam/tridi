# Documentación Interna — Tridi (`juanevillam/tridi`)

> **CONFIDENCIAL / USO INTERNO DEL EQUIPO (`juanevillam/tridi`)**  
> Manuales de reuniones industriales, arquitectura, infraestructura y referencia de Y Combinator Winter 2027 para **Juan, Pastor, César y Ale**.

---

## Índice de Documentos Internos

| Documento | Qué contiene | Ruta |
| :--- | :--- | :--- |
| **1. Preparación Reunión ZAKA, C.A.** | Radiografía real de **ZAKA, C.A.** (`zakasys.com`, Rockwell / Siemens / AVEVA / PackML), postura del equipo como aliados y generación de relevo (cero competencia), qué mostrar en 3 minutos y las 4 preguntas de validación dura. | [`docs/internal/reunion-zaka.md`](reunion-zaka.md) |
| **2. Arquitectura y Sim-to-Real** | Pipeline end-to-end: Captura 2.0 (`GVHMR + WiLoR`), retargeting IK + manos de 5 dedos (`physics/`), entrenamiento PPO y compilador `export_mcu.py` (`training/`), caso físico `luigi_lab3` / `luigi_lab4` / `factory_cell` y rutas de `web/`. | [`docs/internal/architecture-and-sim2real.md`](architecture-and-sim2real.md) |
| **3. Infraestructura y Seguridad (`trytridi.com`)** | Namecheap (`DNSSEC`), Cloudflare Pages (`tridi`), CI/CD (`.github/workflows/deploy.yml`), `SPF`/`DMARC`, `HSTS Preload`, `CSP` y servidor de video en la Mac (`data/serve.sh`, `data/server.py`). | [`docs/internal/infra-and-security.md`](infra-and-security.md) |
| **4. Referencia Y Combinator W27** | Respuestas exactas enviadas en la aplicación a YC W27 (2 de noviembre de 2026), reparto `25/25/25/25` y mapa de la carpeta [`yc/`](../../yc/README.md). | [`docs/internal/yc-w27-reference.md`](yc-w27-reference.md) |
