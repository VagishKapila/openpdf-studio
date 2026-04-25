# OpenPDF Studio — Infrastructure

Source of truth for what's running where. Update whenever infrastructure
changes.

**Last updated:** 2026-04-22

---

## Live URLs

| URL | Purpose | Status |
|---|---|---|
| https://app.snaphw.com | Canonical production URL | ✅ Live |
| https://openpdf-studio-production-462c.up.railway.app | Railway default URL (fallback) | ✅ Live |

**NOT part of this project:**
- `https://snaphw.com/app/` — older HTML PDF editor, separate codebase,
  separate hosting. Do NOT modify as part of OpenPDF PWA work.

---

## Hosting

**Production: Railway** (Vagish's paid account)
- Project: openpdf-studio
- Service: pwa
- Branch: pwa-main (auto-deploy on push via webhook + explicit trigger)
- Build: `cd apps/pwa && pnpm install && pnpm build`
- Serve: `cd apps/pwa && npx serve dist -s -l $PORT`
- Runtime: Node 22.12+ (pinned via `.node-version`)
- Region: [whatever Railway selected at project creation]

**NOT used:**
- Vercel (retired 2026-04-21, project deleted via API)
- Cloudflare Pages (never deployed)
- Hostinger (Vagish has an account but not used for this project)
- Bluehost (Vagish has an account but not used for this project)
- IONOS (Vagish has an account but not used for this project)
- AWS (Vagish has an account but not used for this project)

Rationale: Railway provides native Node 22 + pnpm + Vite support,
auto-deploys from GitHub, free SSL via Let's Encrypt, integrated logs.
The other paid accounts serve different purposes (traditional hosting,
email, WordPress) and would be worse fits for a JavaScript PWA.

---

## Domain & DNS

**Registrar:** GoDaddy (snaphw.com)
**Nameservers:** `ns31.domaincontrol.com`, `ns32.domaincontrol.com`

**Records managed as part of this project:**
| Type | Host | Value | TTL | Purpose |
|---|---|---|---|---|
| CNAME | app | `5jgoopuk.up.railway.app` | 1 hour | Points `app.snaphw.com` → Railway |
| TXT | `_railway-verify.app` | [Railway token] | 1 hour | Railway ownership verification |

**Records NOT managed as part of this project** (untouched, preserved):
- snaphw.com apex A records — whatever was there before
- snaphw.com MX records (email)
- snaphw.com TXT records (SPF, DKIM, etc.)
- Any other CNAME for snaphw.com
- `snaphw.com/app/` path routing — handled at hosting level, not DNS

**DNS change policy:**
- New subdomains (e.g., `api.snaphw.com` in future): add via GoDaddy API
  or browser automation, never touch existing records
- Changing any existing record: manual review required, never automated
- Deleting records: requires explicit human approval

---

## GitHub

**Repo:** https://github.com/VagishKapila/openpdf
**Visibility:** Public
**License:** MIT
**Default branch:** pwa-main
**Auto-deploy:** Railway watches `pwa-main`, redeploys on push

---

## Secrets & Credentials

Stored in:
1. **Railway environment variables** (production runtime):
   - `NODE_ENV=production` (auto)
   - (No other secrets yet — add PLAUSIBLE_API_KEY and similar when those
     features land)

2. **Cowork session environment** (build/deploy time):
   - `RAILWAY_TOKEN` (for `./tools/scripts/deploy.sh`)
   - `GITHUB_TOKEN` (via `gh` CLI authentication)
   - `GODADDY_API_KEY` + `GODADDY_API_SECRET` (if/when API tier allows)

3. **Vagish's local keychain:**
   - GitHub credentials for `git push`
   - Railway login state for `railway` CLI
   - Browser-logged-in sessions for GoDaddy, Hostinger, IONOS, etc.
     (used by Chrome MCP browser automation when API isn't available)

**Never committed to the repo:**
- Any API key, token, or secret
- Environment files (`.env*` is in `.gitignore`)

---

## Deploy Flow

Current automated flow:

```
Developer commits to pwa-main
        ↓
git push origin pwa-main
(via ./tools/scripts/deploy.sh)
        ↓
GitHub webhook → Railway
        ↓
(webhook is sometimes unreliable — see TECH_DEBT #8)
./tools/scripts/deploy.sh also triggers Railway serviceInstanceDeploy
via GraphQL as a safeguard
        ↓
Railway builds: pnpm install + pnpm build
        ↓
Railway deploys to openpdf-studio-production-462c.up.railway.app
        ↓
Custom domain routing: app.snaphw.com → same deployment
```

Single command to push and deploy:
```bash
./tools/scripts/deploy.sh
```

Typical deploy time: 60-90 seconds from push to live.

---

## Analytics & Monitoring

### Sentry (Error Monitoring) — ACTIVE
- Project: formiq (org: varshyl-inc)
- DSN: stored in Railway env var `VITE_SENTRY_DSN`
- Dashboard: https://varshyl-inc.sentry.io/projects/formiq/
- Captures: unhandled errors, export annotation failures, ErrorBoundary crashes
- Enabled: production only (`import.meta.env.PROD`)
- Sample rate: 10% traces

### Varshyl Dashboard Master (Analytics) — PENDING
- Status: hub.varshyl.com being restored — will activate when URL is live
- To activate: add `VITE_VARSHYL_WEBHOOK_URL` and `VITE_VARSHYL_WEBHOOK_SECRET` to Railway env vars
- Product tag: `formiq`
- Events tracked: `pdf_opened`, `annotation_created`, `pdf_exported`, `tool_selected`, `pwa_installed`
- Implementation: `apps/pwa/src/lib/analytics.ts` (no-op until env var is set)

### Uptime Monitoring
- Not yet set up. Planned when product has real users.

---

## Rollback Procedure

If a deploy breaks production:

1. Identify the bad commit in `git log`
2. Revert locally:
   ```bash
   git revert <bad-commit-sha>
   ./tools/scripts/deploy.sh
   ```
3. Railway redeploys within ~90 seconds

For worse cases (entire repo state broken):
- Railway keeps previous deployments. In the Railway dashboard:
  Deployments → find last known good deployment → "Redeploy"

---

## Cost

Approximate monthly costs as of launch:

| Service | Cost |
|---|---|
| Railway (Hobby plan) | ~$5–15/month (scales with usage) |
| GoDaddy snaphw.com renewal | ~$20/year (~$1.67/month) |
| GitHub (public repo) | $0 |
| Plausible (when added) | $9/month (or self-host free) |
| **Total at launch** | **~$7–17/month** |

---

## Future Infrastructure Changes

Changes to this document are expected when:

- **Request Signatures backend ships (v1.1)** — adds a signatures service
- **Plausible analytics ships (Day 4-5)** — adds one external dependency
- **Custom domain strategy changes** — if Vagish decides to move away from
  `app.snaphw.com`
- **Cross-device sync ships (v2+)** — adds database, auth, significant infra

Update this file whenever any of those happen.

---

© 2026 Vagish Kapila · Varshyl Inc · kapilav@varshyl.com
