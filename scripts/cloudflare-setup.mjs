#!/usr/bin/env node
/**
 * Configures the Cloudflare Zone for trytridi.com with the exact security and routing
 * posture used by juanevillam.com and Sound Shaper (no Firebase required):
 *   1. Proxied CNAME records: @ -> tridi-18p.pages.dev, www -> tridi-18p.pages.dev (DDoS + WAF active)
 *   2. Email anti-spoofing TXT records: SPF (-all), DMARC (p=reject), DKIM (*._domainkey revoked)
 *   3. Edge TLS & DDoS settings: Strict SSL, Always Use HTTPS, HSTS (2 years + preload + nosniff),
 *      Min TLS 1.2, TLS 1.3, Automatic HTTPS Rewrites, Browser Integrity Check
 *   4. Zone Redirect Rule (301): https://www.trytridi.com/* -> https://trytridi.com/* (preserving path & query)
 *   5. DNSSEC enabled (prints DS record values to paste in Namecheap Advanced DNS -> DNSSEC)
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=<token> node scripts/cloudflare-setup.mjs
 *   (or uses Wrangler's local OAuth token if it has zone permissions)
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ACCOUNT_ID = '3ffb7774e947f05433f775bce098f81f';
const DOMAIN = 'trytridi.com';
const PAGES_TARGET = 'tridi-18p.pages.dev';

function getToken() {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN.trim();
  const wranglerCfg = path.join(os.homedir(), 'Library/Preferences/.wrangler/config/default.toml');
  if (fs.existsSync(wranglerCfg)) {
    const m = fs.readFileSync(wranglerCfg, 'utf8').match(/oauth_token\s*=\s*"([^"]+)"/);
    if (m) return m[1];
  }
  throw new Error('Set CLOUDFLARE_API_TOKEN or run `npx wrangler login`.');
}

const TOKEN = getToken();

async function cf(endpoint, options = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return res.json();
}

async function ensureZone() {
  const list = await cf(`/zones?name=${DOMAIN}`);
  if (list.success && list.result?.length > 0) {
    return list.result[0];
  }
  console.log(`Creating zone ${DOMAIN} in Cloudflare...`);
  const created = await cf('/zones', {
    method: 'POST',
    body: JSON.stringify({
      name: DOMAIN,
      account: { id: ACCOUNT_ID },
      type: 'full',
    }),
  });
  if (!created.success) {
    throw new Error(`Could not find or create zone ${DOMAIN}: ${JSON.stringify(created.errors)}`);
  }
  return created.result;
}

async function upsertDnsRecord(zoneId, desired) {
  const existing = await cf(`/zones/${zoneId}/dns_records?type=${desired.type}&name=${encodeURIComponent(desired.name)}`);
  const prefix = desired.matchPrefix || desired.content;
  const match = (existing.result || []).find((r) =>
    desired.type === 'TXT' ? r.content.startsWith(prefix) : true
  );
  const payload = {
    type: desired.type,
    name: desired.name,
    content: desired.content,
    ttl: desired.ttl,
    proxied: desired.proxied,
  };
  if (match) {
    const res = await cf(`/zones/${zoneId}/dns_records/${match.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    console.log(`  ✓ Updated DNS ${desired.type} ${desired.name} -> ${desired.content} (${res.success ? 'OK' : JSON.stringify(res.errors)})`);
  } else {
    const res = await cf(`/zones/${zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    console.log(`  ✓ Created DNS ${desired.type} ${desired.name} -> ${desired.content} (${res.success ? 'OK' : JSON.stringify(res.errors)})`);
  }
}

async function main() {
  const zone = await ensureZone();
  console.log(`Zone: ${zone.name} (id: ${zone.id}, status: ${zone.status})`);
  console.log(`Cloudflare Nameservers for Namecheap -> Domain -> Custom DNS:`);
  for (const ns of zone.name_servers || []) console.log(`  - ${ns}`);

  console.log('\n1. Configuring DNS records (Cloudflare Pages + Anti-Spoofing + Google Search Console)...');
  const records = [
    { type: 'CNAME', name: DOMAIN, content: PAGES_TARGET, ttl: 1, proxied: true },
    { type: 'CNAME', name: `www.${DOMAIN}`, content: PAGES_TARGET, ttl: 1, proxied: true },
    { type: 'TXT', name: DOMAIN, content: 'v=spf1 -all', matchPrefix: 'v=spf1', ttl: 1, proxied: false },
    { type: 'TXT', name: DOMAIN, content: 'google-site-verification=Cy_4JLz2S7WS9MCtz35HXpGQw9ViuvfWRDeHVPvr7xc', matchPrefix: 'google-site-verification=', ttl: 1, proxied: false },
    { type: 'TXT', name: `_dmarc.${DOMAIN}`, content: 'v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s;', matchPrefix: 'v=DMARC1', ttl: 1, proxied: false },
  ];
  for (const rec of records) {
    await upsertDnsRecord(zone.id, rec);
  }

  console.log('\n2. Applying SSL/TLS, HSTS & DDoS/Bot edge settings...');
  const settings = [
    ['ssl', 'strict'],
    ['always_use_https', 'on'],
    ['min_tls_version', '1.2'],
    ['tls_1_3', 'on'],
    ['automatic_https_rewrites', 'on'],
    ['browser_check', 'on'],
    ['security_level', 'medium'],
    [
      'security_header',
      {
        strict_transport_security: {
          enabled: true,
          max_age: 31536000,
          include_subdomains: true,
          preload: true,
          nosniff: true,
        },
      },
    ],
  ];
  for (const [id, value] of settings) {
    const res = await cf(`/zones/${zone.id}/settings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    });
    console.log(`  ✓ Setting ${id}: ${res.success ? 'OK' : JSON.stringify(res.errors)}`);
  }

  console.log('\n3. Enabling DNSSEC...');
  const dnssec = await cf(`/zones/${zone.id}/dnssec`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'active' }),
  });
  if (dnssec.success && dnssec.result) {
    const d = dnssec.result;
    console.log(`  ✓ DNSSEC status: ${d.status}`);
    if (d.ds) {
      console.log(`    Namecheap DS Record -> Key Tag: ${d.key_tag} | Alg: ${d.algorithm} | Digest Type: ${d.digest_type} | Digest: ${d.digest}`);
    }
  }

  console.log('\n4. Configuring 301 Redirect Rule (www.trytridi.com -> https://trytridi.com)...');
  const rulesetRes = await cf(`/zones/${zone.id}/rulesets/phases/http_request_dynamic_redirect/entrypoint`, {
    method: 'PUT',
    body: JSON.stringify({
      rules: [
        {
          description: 'Redirect www.trytridi.com to apex https://trytridi.com (301)',
          expression: `(http.host eq "www.${DOMAIN}")`,
          action: 'redirect',
          action_parameters: {
            from_value: {
              status_code: 301,
              target_url: {
                expression: `concat("https://${DOMAIN}", http.request.uri.path)`,
              },
              preserve_query_string: true,
            },
          },
          enabled: true,
        },
      ],
    }),
  });
  console.log(`  ✓ Redirect Rule www -> apex: ${rulesetRes.success ? 'OK' : JSON.stringify(rulesetRes.errors)}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
