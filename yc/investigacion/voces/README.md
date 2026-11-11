# Voces: gente importante hablando de robots

Transcripciones de charlas, podcasts y entrevistas de referentes (fundadores, investigadores, inversores) que hablan de robótica, humanoides o datos para robots, cuando lo que dicen aplica a Tridi. Las usamos como guía.

Cada entrada tiene dos archivos:

- `YYYY-MM-<persona>-<tema>.md`: el resumen, con minutos y citas cortas, lo que significa para Tridi y los siguientes pasos.
- `YYYY-MM-<persona>-<tema>-transcripcion.md`: la transcripción cruda del tramo, con marcas de tiempo del video completo.

**Cómo agregar una:** se baja el audio con `yt-dlp -f bestaudio`, se corta el tramo con `ffmpeg -ss <inicio> -to <fin>` a WAV mono de 16 kHz, se transcribe con `whisper-cli` (`ggml-large-v3-turbo-q5_0`, `-l en -osrt`) y las marcas se corren al minuto real del video. El video no se guarda en el repo.

| Fecha | Quién | Dónde | Tema | Resumen |
| --- | --- | --- | --- | --- |
| 2026-02 | Elon Musk | Dwarkesh Patel | Optimus, datos para humanoides, sim-to-real, Unitree | [`2026-02-elon-musk-optimus.md`](2026-02-elon-musk-optimus.md) |
