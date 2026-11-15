---
name: tridi-share-audit
description: >-
  Audit how trytridi.com looks when shared on LinkedIn, WhatsApp, X/Twitter, Slack, and YC Bookface, and how search crawlers read the built HTML — Open Graph & Twitter tags, og.png size & weight (< 300 KB for instant WhatsApp preview), canonical URL, JSON-LD, and robots.txt. Report-first. Use when Juan invokes /tridi-share-audit or asks to audit social previews/SEO.
---

# Tridi Share & Crawler Audit — The Link Preview Is the First Screen (`/tridi-share-audit`)

The moment this command exists for: **Juan or the team is sharing `https://trytridi.com` with Y Combinator partners, industrial customers (Zaka, food/beverage plants), LinkedIn, WhatsApp, or X.** Before anyone sees the 3D Unitree G1 in MuJoCo, they see the preview card drawn in WhatsApp, iMessage, LinkedIn, or Slack. A `700 KB` PNG that WhatsApp refuses to preview on mobile data, a missing canonical tag, or a cut description ruins the first impression before the page even opens.

Three non-negotiable contracts (ported from `~/Code/portfolio`):

1. **Scope is explicit and echoed back.**
2. **Report before code.** Copy in `<title>` or `<meta name="description">` is flagged for Juan, never silently rewritten without approval.
3. **Read from the BUILT HTML (`web/dist/index.html`) and built assets (`web/dist/og.*`).**

---

## Phase 0 — Ground yourself

1. **Read `web/index.html`, [`docs/infra-and-security.md`](../../../docs/infra-and-security.md), and [`AGENTS.md`](../../../AGENTS.md).**
2. **Build the production bundle:**
   ```bash
   npm --prefix web run build
   ```

---

## Phase 1 — Inventory and Check

### 1. `<head>` Metadata in `web/dist/index.html`

Extract `<title>`, `<meta ...>`, `<link rel="canonical">`, and `<script type="application/ld+json">` from `web/dist/index.html` and check against every network's rules:

- **`<title>`:** Concise, brand-first (`Tridi — ...`), `< 60` characters.
- **`meta[name="description"]` & `og:description` & `twitter:description`:** Complete sentence, `< 160` characters for search and `< 200` for social cards, no mid-word truncation, aligned with [`yc/verdad-hoy.md`](../../../yc/verdad-hoy.md).
- **`og:title`, `og:type="website"`, `og:url="https://trytridi.com/"`, `<link rel="canonical" href="https://trytridi.com/">`:** Absolute `https://trytridi.com/` URLs.
- **`twitter:card="summary_large_image"` & `twitter:image` & `og:image`:** Absolute `https://trytridi.com/...` URL, plus `og:image:width="1200"`, `og:image:height="630"`, and `og:image:alt`.
- **Theme color & Favicon:** `meta[name="theme-color" content="#08090b"]`, SVG/PNG favicon resolving in `web/dist/`.

### 2. Preview Image (`og.png` / `og.jpg`) Weight & Framing

Run `sips` and `ls -lh` on the Open Graph image in `web/public/`:
```bash
sips -g pixelWidth -g pixelHeight -g format web/public/og*
ls -lh web/public/og*
```
- **Dimensions:** Exactly **`1200×630`** (`1.91:1` aspect ratio).
- **Center-Square Safe Zone:** WhatsApp and iMessage often crop `1200×630` cards to a center `630×630` square on mobile — verify the Tridi logo/headline sits inside the center square and is not clipped at the left/right edges.
- **Byte Weight (`< 300 KB` hard target):**
  - LinkedIn and X accept up to 5 MB, **but WhatsApp mobile frequently drops preview images over `~300 KB`!**
  - If `web/public/og.png` is `700 KB`, check whether an optimized PNG (`pngquant` / indexed palette) or high-quality progressive JPEG (`quality 88`, `< 180 KB`) is visually identical while loading 4× faster in WhatsApp.

### 3. Crawler & Search Hygiene

- **`robots.txt` & `sitemap.xml`:** Check whether `web/public/robots.txt` exists and cleanly allows crawlers.
- **Structured Data (`JSON-LD`):** Check whether `web/index.html` includes a clean `Organization` / `SoftwareApplication` JSON-LD block (`name: "Tridi"`, `url: "https://trytridi.com"`, description).
- **No-JS Fallback / Crawler Readability:** Check what a crawler that executes zero JS sees in `web/dist/index.html`.

---

## Phase 2 — Report (stop for approval)

```markdown
# Tridi Share & Crawler Audit — <date>

## Verdict
Summary of social card readiness across WhatsApp, LinkedIn, X, and search crawlers.

## Metadata & Image Table
| Tag / Asset | Current Value | Target / Rule | Status |

## Findings (Ranked)
Each: file:line, what a recipient on WhatsApp/LinkedIn/X sees, concrete fix, effort.

## Copy Flagged for Juan
Title/description options if any need adjustment.
```

Present the report and wait for Juan's approval. Never post or send external test links without explicit instruction.
