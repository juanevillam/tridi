#!/usr/bin/env python3
"""Downloads the public YC directory for the given batches and rebuilds the tables in this folder.

Usage (from the repo root):
    python3 yc/investigacion/startups/actualizar.py                     # every 2026 and 2027 batch
    python3 yc/investigacion/startups/actualizar.py "Winter 2027"       # only that batch
    python3 yc/investigacion/startups/actualizar.py 2024 2023          # every batch of those years
    python3 yc/investigacion/startups/actualizar.py --publicas          # also every batch's public applications

Sources, both public and the same ones ycombinator.com/companies uses:
  1. The directory's search index (Algolia). Its read-only key is printed in the companies page.
  2. Each company page (ycombinator.com/companies/<slug>): founders, launches, and the application
     answers or video only when the company chose to make them public.

Raw data goes to cache/ (git-ignored: long texts belong to YC and the founders); the tables keep
facts and one-liners only. Stdlib only, so it runs without installing anything.
"""
import html
import json
import re
import sys
import time
import urllib.request
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
CACHE = HERE / "cache"
UA = {"User-Agent": "Mozilla/5.0 (tridi research)"}
DEFAULT_YEARS = ("2026", "2027")
SEASONS = ("Winter", "Spring", "Summer", "Fall")  # YC's four batches a year since 2025
PAUSE_S = 0.4  # between company pages: ~1,000 pages take about 7 minutes and never hammer the site


def get(url, data=None, headers=None):
    req = urllib.request.Request(url, data=data, headers={**UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8")


def algolia_opts():
    page = get("https://www.ycombinator.com/companies")
    m = re.search(r"window\.AlgoliaOpts = (\{.*?\});", page)
    return json.loads(m.group(1))


def search(opts, params):
    url = f"https://{opts['app'].lower()}-dsn.algolia.net/1/indexes/YCCompany_production/query"
    headers = {"x-algolia-application-id": opts["app"], "x-algolia-api-key": opts["key"]}
    return json.loads(get(url, json.dumps(params).encode(), headers))


def batches_available(opts):
    facets = search(opts, {"query": "", "hitsPerPage": 0, "facets": ["batch"], "maxValuesPerFacet": 500})
    return facets["facets"]["batch"]


def list_batch(opts, batch):
    hits, page = [], 0
    while True:
        r = search(opts, {"query": "", "hitsPerPage": 1000, "page": page, "filters": f'batch:"{batch}"'})
        hits += r["hits"]
        page += 1
        if page >= r["nbPages"]:
            return hits


def company_page(slug):
    s = get(f"https://www.ycombinator.com/companies/{slug}")
    m = re.search(r'data-page="([^"]+)"', s)
    props = json.loads(html.unescape(m.group(1)))["props"]
    c = props["company"]
    # Signed S3 links expire in minutes: keep only whether a video exists, and link the company page.
    return {
        "year_founded": c.get("year_founded"),
        "location": c.get("location"),
        "country": c.get("country"),
        "linkedin_url": c.get("linkedin_url"),
        "twitter_url": c.get("twitter_url"),
        "primary_group_partner": (c.get("primary_group_partner") or {}).get("full_name"),
        "has_app_video": bool(c.get("app_video_url")),
        "has_dday_video": bool(c.get("dday_video_url")),
        "app_answers": [
            {"question": a.get("question", "").strip(), "answer": a.get("answer", "")}
            for a in (c.get("app_answers") or []) if a.get("answer_public", True)
        ],
        "founders": [
            {"name": f.get("full_name"), "title": f.get("title"), "bio": f.get("founder_bio"),
             "linkedin": f.get("linkedin_url"), "twitter": f.get("twitter_url")}
            for f in c.get("founders") or []
        ],
        "launches": [{"title": l.get("title"), "url": l.get("url")} for l in props.get("launches") or []],
    }


def slugify(batch):
    season, year = batch.split()
    return f"{year}-{season.lower()}"


def fetch(opts, batch):
    out = CACHE / f"{slugify(batch)}.json"
    hits = list_batch(opts, batch)
    old = {c["slug"]: c for c in json.loads(out.read_text())} if out.exists() else {}
    rows = []
    for i, h in enumerate(hits, 1):
        row = {k: h.get(k) for k in (
            "name", "slug", "batch", "one_liner", "long_description", "website", "all_locations",
            "team_size", "industry", "subindustry", "industries", "tags", "regions", "status", "stage",
            "app_video_public", "demo_day_video_public", "launched_at")}
        try:
            row.update(company_page(h["slug"]))
            time.sleep(PAUSE_S)
        except Exception as e:  # one broken page must not lose the batch: keep the last good copy
            print(f"  ! {h['slug']}: {e}", file=sys.stderr)
            row.update({k: v for k, v in old.get(h["slug"], {}).items() if k not in row})
        rows.append(row)
        if i % 25 == 0:
            print(f"  {batch}: {i}/{len(hits)}")
    rows.sort(key=lambda r: r["name"].lower())
    CACHE.mkdir(exist_ok=True)
    out.write_text(json.dumps(rows, ensure_ascii=False, indent=1))
    return rows


def cell(text, limit=160):
    text = " ".join((text or "").split()).replace("|", "/")
    return text if len(text) <= limit else text[: limit - 1] + "…"


def table(rows):
    lines = ["| Startup | Qué hace | Industria | Dónde | Equipo | Fundadores | Público |",
             "| --- | --- | --- | --- | --- | --- | --- |"]
    for r in rows:
        flags = " ".join(x for x, on in (("🎥 video", r.get("has_app_video")), ("📝 respuestas", r.get("app_answers")),
                                         ("🚀 launch", r.get("launches"))) if on)
        lines.append(
            f"| [{cell(r['name'], 40)}](https://www.ycombinator.com/companies/{r['slug']}) | {cell(r['one_liner'])} "
            f"| {cell(r.get('subindustry') or r.get('industry'), 50)} | {cell(r.get('all_locations'), 40)} "
            f"| {r.get('team_size') or '—'} | {len(r.get('founders') or [])} | {flags or '—'} |")
    return "\n".join(lines)


def write_batch(batch, rows):
    ind = Counter((r.get("industry") or "—") for r in rows)
    reg = Counter(x for r in rows for x in (r.get("regions") or []))
    founders = Counter(len(r.get("founders") or []) for r in rows)
    text = f"""# {batch}

{len(rows)} startups. Generado por `actualizar.py`; no editar a mano (las notas van en los otros archivos de `startups/`).

- **Industrias:** {", ".join(f"{k} {v}" for k, v in ind.most_common(8))}
- **Regiones:** {", ".join(f"{k} {v}" for k, v in reg.most_common(8))}
- **Fundadores por startup:** {", ".join(f"{k}: {v}" for k, v in sorted(founders.items()))}
- **Con algo de su aplicación público:** {sum(1 for r in rows if r.get("has_app_video") or r.get("app_answers"))}

{table(rows)}
"""
    (HERE / f"{slugify(batch)}.md").write_text(text)


def write_public(opts):
    """Every batch's startups that made their application video or answers public."""
    r = search(opts, {"query": "", "hitsPerPage": 1000,
                      "filters": "app_video_public:true OR app_answers:true OR question_answers:true"})
    rows = []
    for h in r["hits"]:
        try:
            p = company_page(h["slug"])
            time.sleep(PAUSE_S)
        except Exception as e:
            print(f"  ! {h['slug']}: {e}", file=sys.stderr)
            continue
        rows.append({"name": h["name"], "slug": h["slug"], "batch": h["batch"], "one_liner": h.get("one_liner"),
                     "industry": h.get("industry"), "status": h.get("status"), **p})
    rows.sort(key=lambda x: (-int(x["batch"].split()[-1]), x["name"].lower()))
    CACHE.mkdir(exist_ok=True)
    (CACHE / "aplicaciones-publicas.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1))
    lines = ["| Startup | Batch | Qué hace | Estado | Video | Respuestas |", "| --- | --- | --- | --- | --- | --- |"]
    for x in rows:
        lines.append(f"| [{cell(x['name'], 40)}](https://www.ycombinator.com/companies/{x['slug']}) | {x['batch']} "
                     f"| {cell(x['one_liner'], 120)} | {x.get('status') or '—'} | {'🎥' if x['has_app_video'] else '—'} "
                     f"| {len(x['app_answers']) or '—'} |")
    (HERE / "aplicaciones-publicas-lista.md").write_text(
        "# Aplicaciones públicas (todos los batches)\n\nStartups que publicaron su video de aplicación o sus respuestas en "
        "su página de YC. El video y las respuestas se ven abriendo la página. Generado por `actualizar.py --publicas`; "
        f"el análisis está en [`aplicaciones-publicas.md`](aplicaciones-publicas.md).\n\n{len(rows)} startups.\n\n"
        + "\n".join(lines) + "\n")


def main(args):
    opts = algolia_opts()
    available = batches_available(opts)
    # A bare year ("2024") means every batch of that year; a full name ("Spring 2027") means that batch.
    names = [a for a in args if not a.startswith("--")]
    years = {a for a in names if a.isdigit()} or (set() if names else set(DEFAULT_YEARS))
    wanted = [a for a in names if not a.isdigit()] + sorted(
        (b for b in available if b.split()[-1] in years and b.split()[0] in SEASONS),
        key=lambda b: (b.split()[-1], SEASONS.index(b.split()[0])))
    for batch in wanted:
        print(f"{batch}: {available.get(batch, 0)} startups")
        write_batch(batch, fetch(opts, batch))
    if "--publicas" in args:
        write_public(opts)


if __name__ == "__main__":
    main(sys.argv[1:])
