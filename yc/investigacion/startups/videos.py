#!/usr/bin/env python3
"""Downloads and transcribes the YC application videos that startups made public.

Usage (from the repo root, after `actualizar.py --publicas`):
    python3 yc/investigacion/startups/videos.py            # every public application video
    python3 yc/investigacion/startups/videos.py 2024       # only batches from that year on

For each video: duration, a 2x2 contact sheet of frames (to see the setting and who is on camera)
and an English transcript with whisper.cpp. Everything goes to cache/videos/ (git-ignored: the
videos and words are the founders'); the notes we write about them go in aplicaciones-publicas.md.

Needs ffmpeg and whisper-cli (brew install ffmpeg whisper-cpp) and the model the `transcribir`
skill uses. Already-processed videos are skipped, so it can be stopped and run again.
"""
import html
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "cache" / "videos"
MODEL = Path.home() / ".local/share/whisper-models/ggml-large-v3-turbo-q5_0.bin"
UA = {"User-Agent": "Mozilla/5.0 (tridi research)"}


def app_video_url(slug):
    req = urllib.request.Request(f"https://www.ycombinator.com/companies/{slug}", headers=UA)
    s = urllib.request.urlopen(req, timeout=30).read().decode()
    props = json.loads(html.unescape(re.search(r'data-page="([^"]+)"', s).group(1)))["props"]
    return props["company"].get("app_video_url")  # signed link that expires in about a minute


def run(*cmd):
    return subprocess.run(cmd, check=True, capture_output=True, text=True).stdout


def process(company):
    slug = company["slug"]
    meta_path = OUT / f"{slug}.json"
    if meta_path.exists():
        return json.loads(meta_path.read_text())
    url = app_video_url(slug)
    if not url:
        return None
    mp4, wav = OUT / f"{slug}.mp4", OUT / f"{slug}.wav"
    urllib.request.urlretrieve(url, mp4)
    duration = float(run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp4)))
    # Four frames spread over the video, tiled 2x2: enough to see the setting and how many people talk.
    step = max(duration / 5, 0.5)
    run("ffmpeg", "-y", "-loglevel", "error", "-i", str(mp4), "-vf",
        f"fps=1/{step:.2f},scale=480:-1,tile=2x2", "-frames:v", "1", str(OUT / f"{slug}-frames.jpg"))
    run("ffmpeg", "-y", "-loglevel", "error", "-i", str(mp4), "-ar", "16000", "-ac", "1", str(wav))
    run("whisper-cli", "-m", str(MODEL), "-l", "en", "-nt", "-otxt", "-of", str(OUT / slug), str(wav))
    wav.unlink()
    words = len((OUT / f"{slug}.txt").read_text().split())
    meta = {"slug": slug, "name": company["name"], "batch": company["batch"], "duration_s": round(duration, 1),
            "words": words, "wpm": round(words / duration * 60) if duration else None}
    meta_path.write_text(json.dumps(meta, indent=1))
    return meta


def main(args):
    since = int(args[0]) if args else 0
    companies = json.loads((HERE / "cache" / "aplicaciones-publicas.json").read_text())
    todo = [c for c in companies if c.get("has_app_video") and int(c["batch"].split()[-1]) >= since]
    OUT.mkdir(parents=True, exist_ok=True)
    for i, c in enumerate(todo, 1):
        try:
            m = process(c)
            print(f"{i}/{len(todo)} {c['name']} ({c['batch']}): {m and m['duration_s']} s, {m and m['words']} words")
        except Exception as e:  # one broken video must not stop the rest
            print(f"{i}/{len(todo)} {c['name']}: {e}", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1:])
