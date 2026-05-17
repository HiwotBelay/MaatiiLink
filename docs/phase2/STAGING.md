# MaatiiLink — Staging Environment

**Phase 2** | SABA CODERS

---

## Purpose

Staging mirrors production for UAT before branch pilot. Uses **separate** database credentials from local dev.

---

## Recommended setup (DX Valley / team)

### Option A — Vercel + Neon branch (fastest)

1. Import repo: https://github.com/HiwotBelay/MaatiiLink  
2. Branch: `develop` → Preview deployments  
3. Neon: create branch `staging` from production project or second project  
4. Vercel environment variables (Preview):

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Neon **staging** pooled URL |
| `SESSION_SECRET` | Random 32+ chars (unique per env) |
| `NODE_ENV` | `production` |

5. Staging URL example: `https://maatiilink-xxx.vercel.app`

### Option B — VM at DX Valley

1. Node 22 + PM2 or Docker  
2. `docker compose` with app container + optional local Postgres **or** Neon URL  
3. Nginx reverse proxy + TLS (Let's Encrypt or bank cert)  
4. Firewall: VPN or office IP only until pilot

---

## Staging checklist

- [ ] `DATABASE_URL` is **not** the same as personal dev DB
- [ ] `SESSION_SECRET` unique
- [ ] `npm run build` succeeds on deploy
- [ ] `/api/health` returns `ok: true`
- [ ] Seed run once: `npm run db:seed` (staging only)
- [ ] Dev passwords rotated or SSO before bank demo

---

## Gate G2 — Staging URL (team)

| Field | Value |
|-------|--------|
| Staging URL | _Fill when deployed_ |
| Deployed by | SABA CODERS |
| Date | |
| Approved | Team self-signoff for internship |

---

## Smoke test after deploy

```bash
curl https://YOUR-STAGING-URL/api/health
```

Expected: `"ok": true`, `"database": "connected"`
