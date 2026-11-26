# 2026-11-26 16:35 — Milestone YC W27 con videos subtitulados

- **Persona:** Juan (`@juanevillam`)
- **Rama:** `juan/studio-overhaul`
- **Sesión:** `4c7c60ee-bce2-426c-9935-8e2361df7148`

## Qué se hizo

- Se revisaron y transcribieron (local con `whisper-cli`) los 5 archivos de `~/Downloads/yc-application/` para curar la media pública del nuevo avance de YC W27:
  - **Incluidos (4 activos en `web/public/media/`):**
    - `yc-founder-video.mp4` (`8,4 MB`, 1080×720 H.264 `faststart`, 57 s — video oficial enviado a YC W27, ya traía subtítulos en inglés).
    - `yc-blackout-rig.mp4` (`3,9 MB`, 576×1024 H.264 `faststart`, 22 s — montaje de la barra LED en la lámpara del techo durante el apagón, con subtítulos en inglés quemados al estilo de `luigi-hardware.mp4`).
    - `yc-chandelier-light.mp4` (`2,1 MB`, 576×1024 H.264 `faststart`, 11 s — primer plano del montaje cargador + power bank + barra LED + lámpara, con subtítulos en inglés quemados).
    - `yc-setup.jpg` (`101 KB` — foto del setup con la MacBook sobre mesa plegable y receptor inalámbrico).
  - **Descartado:** `PXL_20261103_023547581.mp4` (77 MB, video informal comiendo pizza / chiste interno, no apto para web pública).
- Se reordenaron los 3 tabs de más nuevo a más viejo en `web/src/screens/milestones.js`:
  1. `7 Nov 2026` — Primer Sim-to-Real físico (`sim-to-real`)
  2. `2 Nov 2026` — Aplicación a YC W27 (`yc-w27`)
  3. `23–25 Oct 2026` — Platanus Hack 26 Caracas (`platanus-hack`)

## Decisiones

- Como `ffmpeg` en esta Mac no trae `libass`/`drawtext`, se renderizaron tarjetas PNG transparentes con Pillow (`data/.venv`) y `HelveticaNeue.ttc` y se compusieron por `overlay=enable='between(t,...)'` para replicar el estilo de subtítulos de `luigi-hardware.mp4` y `platanus-mentor.mp4`.
- Se mantuvo el límite privado de `yc/`: cero respuestas privadas o equity en el copy público; CTA apunta a `/live`.

## Próximo paso

- Revisar visualmente en `/milestones` y, si Juan prefiere orden cronológico estricto (`Oct 23–25 → Nov 2 → Nov 7`), intercambiar `m2` y `m3`.
