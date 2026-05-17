# MaatiiLink — Staging Environment

**Phase 2** | SABA CODERS

> **Step-by-step G2 deploy:** see **[G2_DEPLOY_GUIDE.md](./G2_DEPLOY_GUIDE.md)**  
> **Mentor sign-off pack:** see **[G2_MENTOR_SUBMISSION.md](./G2_MENTOR_SUBMISSION.md)**

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

5. Staging URL: **https://maatii-link.vercel.app**

### Option B — VM at DX Valley

1. Node 22 + PM2 or Docker  
2. `docker compose` with app container + optional local Postgres **or** Neon URL  
3. Nginx reverse proxy + TLS (Let's Encrypt or bank cert)  
4. Firewall: VPN or office IP only until pilot

---

## Staging checklist

- [x] Neon branch / staging DB configured (pooled `DATABASE_URL` on Vercel)
- [x] `prisma migrate deploy` + seed applied (health: 2 branches, 3 users)
- [x] Vercel project live; env vars set (`DATABASE_URL`, `SESSION_SECRET`)
- [x] Deployed from GitHub → Vercel
- [x] `/api/health` returns `ok: true`, `database: connected`
- [x] App home + `/login` reachable on staging
- [ ] Mentor / IT formal sign-off (submit `G2_MENTOR_SUBMISSION.md` when ready)

---

## Gate G2 — Staging URL (team)

| Field | Value |
|-------|--------|
| **Staging URL** | https://maatii-link.vercel.app |
| **Health URL** | https://maatii-link.vercel.app/api/health |
| **Login** | https://maatii-link.vercel.app/login |
| **Hosting** | Vercel |
| **Deployed by** | SABA CODERS |
| **Date** | 2026-05-17 |
| **Health verified** | `ok: true`, `database: connected` (2026-05-17) |
| **Mentor / IT approved** | Pending — use `G2_MENTOR_SUBMISSION.md` |

---

## Smoke test (verified)

```bash
curl https://maatii-link.vercel.app/api/health
```

Response (2026-05-17):

```json
{
  "ok": true,
  "service": "MaatiiLink",
  "database": "connected",
  "stats": { "branches": 2, "users": 3 }
}
```
