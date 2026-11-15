# Manual Técnico Interno 1: Infraestructura, Dominio (`trytridi.com`), Cloudflare Pages, CI/CD y Seguridad

> **CONFIDENCIAL / USO INTERNO (`juanevillam/tridi`)**
> Referencia completa de cómo está desplegado y protegido **https://trytridi.com** (Cloudflare Pages + Namecheap + GitHub Actions + servidor de video en Mac con Cloudflare Tunnel). Replicado del estándar de producción de Juan (`juanevillam.com` / `sound-shaper`) sin requerir cuentas de Firebase ni planes pagos.

---

## 1. Mapa de Superficies y Cuentas en Producción

| Superficie | URL en Producción | Plataforma | Proyecto / Identificador | Fuente |
| :--- | :--- | :--- | :--- | :--- |
| **Web Principal (Producción)** | **`https://trytridi.com`** (`www.trytridi.com` → `301`) | Cloudflare Pages | Proyecto `tridi` (`tridi-18p.pages.dev`) | `juanevillam/tridi` (`web/dist`) |
| **Mirror Legacy (Hackathon / YC inicial)** | `https://tridi-alpha.vercel.app` | Vercel | Proyecto `tridi` (cuenta de Pastor, espejo `Torpass/tridi`) | Congelado por compatibilidad con links viejos |
| **Servidor de Video y Entrenamiento** | `https://*.trycloudflare.com` (publicado automáticamente en Gist) | MacBook Air M2 de Juan + Cloudflare Quick Tunnel | `data/serve.sh` → `data/server.py` (`127.0.0.1:8000`) | `juanevillam/tridi` (`data/`, `training/`) |
| **Gist de Descubrimiento de API** | `https://gist.githubusercontent.com/raw/78eb7f16b9c2d8d21a9abfe6607a98da/tridi-api.json` | GitHub Gist (`juanevillam`) | Gist ID `78eb7f16b9c2d8d21a9abfe6607a98da` | Escrito por `data/serve.sh`, leído por `data/live/src/api.js` |

### Identificadores Técnicos (Cloudflare & GitHub)
- **Dominio oficial:** `trytridi.com` (comprado en Namecheap con *Domain Privacy Protection* activo, USD 12/año).
- **Cloudflare Account ID (CTO / Juan):** `3ffb7774e947f05433f775bce098f81f`
- **Cloudflare Zone ID (`trytridi.com`):** `ad0e73bb012d34db1af27f64cbace539`
- **Cloudflare Pages Project:** `tridi` (`id: 04e10026-8bd5-4588-b063-d33987e5559b`, subdominio base `tridi-18p.pages.dev`)
- **GitHub Repository ID (`juanevillam/tridi`):** `1436071808`

---

## 2. Por qué migramos de Vercel Hobby a Cloudflare Pages + GitHub Actions

1. **Sin bloqueo por autor de commit en repositorios privados:** En el plan gratuito (Hobby) de Vercel, cuando un repositorio privado de GitHub tiene varios colaboradores (`Juan`, `Pastor`, `César`), Vercel **bloquea los despliegues** cuyos commits hayan sido hechos por cualquier miembro que no sea el dueño de la cuenta de Vercel (exigiendo pagar USD 20/mes por asiento en Vercel Pro).
2. **Despliegue colaborativo gratuito:** Con **Cloudflare Pages** + [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml), cualquier push a `main` (o `juan/experimental`) de **Juan, Pastor o César** corre primero las suites de verificación (`npm --prefix physics run check && npm --prefix web run check && npm --prefix web run build`) y despliega `web/dist` a Cloudflare Pages sin restricciones de asiento.
3. **Límites holgados de archivos:** Cloudflare Pages permite hasta **25 MiB por archivo** y **20.000 archivos** en el plan gratis. Tras la optimización de `/tridi-data-audit`, `web/dist` pesa **107 MB** en total (**270 archivos**), donde el archivo más pesado es `mujoco.wasm` (**10,75 MB**), seguido por los videos optimizados `media/luigi-sim2real.mp4` (**6,8 MB**), `media/platanus-pitch.mp4` (**5,9 MB**) y `media/luigi-hardware.mp4` (**4,8 MB**).
4. **DDoS, WAF y Seguridad de Borde incluidos gratis:** Al estar el dominio en Cloudflare con nube naranja (`Proxied`), `trytridi.com` recibe mitigación DDoS L3/L4/L7 ilimitada, HSTS en el borde, AI Labyrinth, Turnstile y DNSSEC sin costo.

---

## 3. Configuración en Namecheap (Registrador)

El dominio `trytridi.com` está registrado en Namecheap con **Domain Privacy** activo (oculta datos personales en WHOIS) y delega toda la autoridad DNS a Cloudflare:

1. **Nameservers (`Domain List → trytridi.com → Manage → Nameservers → Custom DNS`):**
   - `trace.ns.cloudflare.com`
   - `zara.ns.cloudflare.com`
2. **DNSSEC (`Advanced DNS → DNSSEC`):**
   - Activado en Cloudflare y vinculado en Namecheap mediante el registro `DS`:
     - **Key Tag:** `2371`
     - **Algorithm:** `13` (`ECDSAP256SHA256`)
     - **Digest Type:** `2` (`SHA-256`)
     - **Digest:** `1E7D5CD48F748157F3D259DDFFD8BE2B6849D209CC751EF7C4E6BBDD4B869DF0`
   - Verificación desde terminal:
     ```bash
     dig @1.1.1.1 +short DS trytridi.com
     # 2371 13 2 1E7D5CD48F748157F3D259DDFFD8BE2B6849D209CC751EF7C4E6BBDD 4B869DF0
     ```

---

## 4. Configuración de DNS y Correo en Cloudflare (`DNS → Records`)

### 4.1 Enrutamiento Web (`CNAME`)

| Type | Name | Target / Content | Proxy Status | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| `CNAME` | `@` (`trytridi.com`) | `tridi-18p.pages.dev` | **Proxied** (nube naranja) | Sirve la web en producción desde el proyecto `tridi` de Cloudflare Pages. |
| `CNAME` | `www` | `tridi-18p.pages.dev` | **Proxied** (nube naranja) | Interceptado en el borde por la Redirect Rule para hacer `301` hacia `https://trytridi.com`. |

### 4.2 Blindaje Anti-Spoofing de Correo (`SPF`, `DMARC`, `MX`)

Se eliminaron los 5 registros `MX` basura que Namecheap pone por defecto (`eforward1..5.registrar-servers.com`) y su `SPF` permisivo (`~all`). Mientras no se active un servidor de correo en `@trytridi.com`, el dominio rechaza el 100% de intentos de suplantación (phishing):

| Type | Name | Content | Razón técnica |
| :--- | :--- | :--- | :--- |
| `TXT` | `@` | `"v=spf1 -all"` | Declara que ningún servidor está autorizado a enviar correo desde `@trytridi.com`. |
| `TXT` | `@` | `"google-site-verification=Cy_4JLz2S7WS9MCtz35HXpGQw9ViuvfWRDeHVPvr7xc"` | Verifica la propiedad del dominio `trytridi.com` en **Google Search Console** (`juanesvillamendoza@gmail.com`) y Google Cloud. |
| `TXT` | `_dmarc` | `"v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s;"` | Ordena a los proveedores de correo rechazar el 100% de correos falsificados de `@trytridi.com` y subdominios (`p=reject; sp=reject`). No lleva `rua=mailto:...@gmail.com` porque RFC 7489 exige autorización TXT del dominio externo y Gmail no la publica. |
| `MX` | *(ninguno)* | *(vacío)* | Sin servidores MX mientras no se reciba correo. |

### 4.3 Cómo activar correos personalizados (`@trytridi.com`) cuando el equipo lo decida

Hay dos caminos listos para cuando queramos usar `@trytridi.com` (ej. `founders@trytridi.com`, `juan@trytridi.com`):

1. **Opción Gratuita (Cloudflare Email Routing — reenvío a Gmail):**
   - En Cloudflare Dashboard (`trytridi.com`) → **Email → Email Routing → Get started**.
   - Crear las direcciones (`founders@trytridi.com`, `juan@trytridi.com`, `pastor@trytridi.com`, `cesar@trytridi.com`, `ale@trytridi.com`) apuntando al correo de cada uno y hacer clic en **Add records and enable** (Cloudflare agrega automáticamente sus 3 `MX` `route1..3.mx.cloudflare.net` y cambia el `TXT @` a `v=spf1 include:_spf.mx.cloudflare.net ~all`).
2. **Opción Corporativa Completa (Google Workspace — bandeja propia para enviar y recibir):**
   - Cambiar `TXT @` a: `v=spf1 include:_spf.google.com -all`
   - Cambiar `TXT _dmarc` a: `v=DMARC1; p=quarantine; sp=quarantine; adkim=r; aspf=r; rua=mailto:dmarc@trytridi.com;`
   - Agregar `TXT google._domainkey` con la llave pública DKIM de Google Admin Console.
   - Agregar `MX @` → `1 SMTP.GOOGLE.COM`.

---

## 5. Seguridad en el Borde de Cloudflare (`SSL/TLS`, `Rules`, `Security`, `Turnstile`)

Configuración activa en la zona `trytridi.com` (paridad total con `juanevillam.com`, **0 alertas en Security Insights**):

1. **`SSL/TLS → Overview`:** Modo **`Full (strict)`**.
2. **`SSL/TLS → Edge Certificates`:**
   - **Always Use HTTPS:** `ON` (`http://trytridi.com` responde `301 Moved Permanently` → `https://trytridi.com/`).
   - **Automatic HTTPS Rewrites:** `ON`.
   - **HTTP Strict Transport Security (HSTS):**
     - **Status:** `ON`
     - **Max Age (`max-age`):** `6 months` (`15552000`)
     - **Apply HSTS policy to subdomains (`includeSubDomains`):** `ON`
     - **Preload:** `ON`
     - **No-Sniff Header (`X-Content-Type-Options: nosniff`):** `ON`
     - *Por qué en el borde además de `_headers`:* Así la respuesta `301` de `https://www.trytridi.com` también incluye `Strict-Transport-Security` y `nosniff`.
3. **`Rules → Redirect Rules` (`Redirect from WWW to root [Template]`):**
   - **Wildcard pattern:** `*://www.trytridi.com/*` → Target `https://trytridi.com/${1}` con código **`301`** y **`Preserve query string: ON`** (indispensable para no perder `?api=...` ni `?lang=es`).
4. **`Security → Settings → security.txt` + [`web/public/.well-known/security.txt`](../web/public/.well-known/security.txt):**
   ```text
   Canonical: https://trytridi.com/.well-known/security.txt
   Contact: mailto:juanesvillamendoza@gmail.com
   Expires: 2027-09-11T12:00:00Z
   Preferred-Languages: en, es
   ```
5. **`Security → Bots`:** **AI Labyrinth `ON`** (atrapa bots y scrapers maliciosos que ignoran `robots.txt` en enlaces honeypot invisibles sin afectar usuarios reales).
6. **Cuenta Cloudflare → `Turnstile`:** Widget para `trytridi.com` en modo **`Managed (Recommended)`** con *Skip future security rule challenges* en `OFF`.

---

## 6. Cabeceras de Seguridad en el Código y Pipeline de Deploy

### 6.1 Cabeceras en Cloudflare Pages ([`web/public/_headers`](../web/public/_headers)) y Vercel ([`vercel.json`](../vercel.json), [`web/vercel.json`](../web/vercel.json))

Ambos archivos están sincronizados para que cualquier despliegue sirva exactamente las mismas cabeceras de seguridad y caché:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(self), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()`
  *(Permite únicamente el acceso a la cámara web en el propio origen `trytridi.com` para la captura de pose en vivo, y bloquea en el navegador micrófono, geolocalización, pagos y WebUSB).*
- `/assets/*`: `Cache-Control: public, max-age=31536000, immutable` (archivos con hash de Vite).
- `/models/*`: `Cache-Control: public, max-age=31536000, immutable` (modelos 3D `.glb` de Kenney en `web/public/models/`).
- `/media/*`: `Cache-Control: public, max-age=604800, stale-while-revalidate=86400` (videos `.mp4` e imágenes de `#/milestones`).
- `/og.png`: imagen Open Graph (`1200 × 630`, **278 KB**, [`web/public/og.png`](../web/public/og.png)) con el hero real de la landing (optimizada `< 300 KB` para preview instantáneo en WhatsApp, LinkedIn y X), declarada en [`web/index.html`](../web/index.html) (`og:image`, `og:image:width`, `og:image:height`, `twitter:image`, `JSON-LD`) junto con [`web/public/robots.txt`](../web/public/robots.txt).

### 6.2 Cómo desplegar a `https://trytridi.com`

1. **Automático por GitHub Actions ([`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)):**
   - Al hacer push a `main` o `juan/experimental` (cuando el secreto `CLOUDFLARE_API_TOKEN` está configurado en el repo), GitHub Actions instala dependencias con Node `22.23.3` ([`.node-version`](../.node-version)), corre `npm --prefix physics run check`, `npm --prefix web run check`, construye `web/dist` y ejecuta `wrangler pages deploy web/dist --project-name=tridi`.
2. **Directo desde terminal (cualquier desarrollador con `wrangler login`):**
   ```bash
   npm --prefix physics run check && npm --prefix web run check && npm --prefix web run build
   npx wrangler pages deploy web/dist --project-name=tridi --branch=main --commit-dirty=true
   rm -rf .wrangler
   ```
3. **Re-aplicar configuración de Zona Cloudflare por script:**
   - [`scripts/cloudflare-setup.mjs`](../scripts/cloudflare-setup.mjs) automatiza vía API de Cloudflare los récords DNS (`CNAME`, `SPF`, `DMARC`), ajustes TLS/HSTS, DNSSEC y Redirect Rule `301`.

---

## 7. Seguridad y Operación del Servidor de Video en la Mac ([`data/serve.sh`](../data/serve.sh) + [`data/server.py`](../data/server.py))

La física (MuJoCo WASM), las políticas ONNX preentrenadas, `#/milestones` y `#/simulations/luigi_lab3` corren **100% en el navegador del visitante** sin necesitar el servidor. El servidor de Python (`data/server.py`) solo interviene cuando alguien:
1. Sube un video nuevo (`POST /uploads`),
2. Lanza un entrenamiento PPO nuevo en cola (`POST /clips/{id}/train`), o
3. Usa el teléfono como cámara por QR (`POST /live`, WebSocket `/live/{id}/ws`).

### Cómo se conecta `https://trytridi.com` con la Mac sin cambiar URLs
1. Al ejecutar `./data/serve.sh` en la Mac de Juan, levanta `uvicorn` en `127.0.0.1:8000` (nunca expone puertos del router ni la IP residencial) y abre un túnel efímero de Cloudflare (`cloudflared tunnel --url http://127.0.0.1:8000`).
2. `data/serve.sh` publica la URL `https://*.trycloudflare.com` en el Gist `78eb7f16b9c2d8d21a9abfe6607a98da` (`tridi-api.json`).
3. Cuando un usuario abre `https://trytridi.com`, [`data/live/src/api.js`](../data/live/src/api.js) (`findApiUrl()`) lee ese Gist, **verifica primero con `checkApi(published)` (`GET /health`) que el túnel esté vivo**, y solo si responde `200 OK` lo activa (si el servidor está apagado, cae silenciosamente a modo offline con `0` errores en consola).

### Blindaje Anti-Abuso en [`data/server.py`](../data/server.py) (modelo `sound-shaper`, sin Firebase)
- **CORS estricto (`CORS_ORIGINS` + `CORS_ORIGIN_REGEX`):** Solo acepta orígenes `https://trytridi.com`, `https://www.trytridi.com`, `https://tridi-18p.pages.dev`, `https://tridi-alpha.vercel.app`, dominios `*tridi*.com` y `localhost`/`127.0.0.1`.
- **Rate Limiting por IP real (`_check_write_rate`):** Lee la IP del cliente desde la cabecera `CF-Connecting-IP` inyectada por el túnel de Cloudflare y limita a **`WRITE_RATE_PER_MIN = 20` peticiones de escritura por minuto por IP** en `POST /uploads`, `POST /clips` y `POST /clips/{id}/train` (devuelve `429 Too Many Requests` si un script intenta spamear).
- **Topes de disco y memoria:**
  - `MAX_UPLOAD = 60 MB` por video y `MAX_DURATION_S = 30 s`.
  - `MAX_ACTIVE_UPLOADS = 16` subidas simultáneas sin completar (`< 1 GB` máximo en disco temporal).
  - `MAX_PENDING_JOBS = 8` trabajos de video en cola y `TRAIN_WAITING = 3` entrenamientos PPO en espera.
  - Protección contra zip-bombs (`sum(m.file_size) > MAX_UPLOAD * 4` → `413`).
  - Limpieza automática cada `30 s` (`_janitor`): borra el archivo de video original a los 10 minutos de procesarse (`KEEP_VIDEO_S = 600`) conservando únicamente el `PoseClip` anónimo (puntos 3D, nunca caras ni videos).

---

## 8. Comandos de Verificación Rápida de Producción

```bash
# 1. Verificar HTTP -> HTTPS (301), HSTS, cabeceras de seguridad y redirect 301 de www -> apex
curl -sI "http://trytridi.com" | grep -iE "^HTTP/|^location:"
curl -sI "https://trytridi.com" | grep -iE "^HTTP/|strict-transport|x-content-type|x-frame|referrer-policy|permissions-policy"
curl -sI "https://www.trytridi.com/test?lang=es" | grep -iE "^HTTP/|^location:|strict-transport|x-content-type"

# 2. Verificar security.txt en vivo
curl -s "https://trytridi.com/.well-known/security.txt"

# 3. Verificar registros DNS de seguridad (SPF, DMARC, MX vacío y DNSSEC DS)
dig @1.1.1.1 +short TXT trytridi.com
dig @1.1.1.1 +short TXT _dmarc.trytridi.com
dig @1.1.1.1 +short MX trytridi.com
dig @1.1.1.1 +short DS trytridi.com
```
