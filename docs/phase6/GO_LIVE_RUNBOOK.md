# Phase 6 — Production Go-Live Runbook

## 1. Freeze and tag

1. Ensure `develop` is green in CI.
2. Record release version in Vercel: set `RELEASE_VERSION=1.0.0` (optional).
3. Merge `develop` → `main`.

## 2. Database

```bash
# With production DIRECT_URL in shell (never commit)
npx prisma migrate deploy
```

Do **not** seed production. Create the first HO admin via Neon SQL or a one-time secure script approved by your mentor.

## 3. Vercel production

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon pooled |
| `DIRECT_URL` | Neon direct |
| `SESSION_SECRET` | New 32+ char secret (not staging) |
| `APP_URL` | `https://your-production-domain` |

Redeploy `main` after env changes.

## 4. Smoke test

```bash
APP_URL=https://your-production-domain npm run smoke
```

Manual checks:

1. `/login` — HO admin sign-in
2. `/ops` — environment checks all OK
3. `/admin` — create one test branch manager (then deactivate after test)
4. `/api/health` — public JSON shows `ok: true`

## 5. National rollout

1. Import branches in batches via **Admin → Branches**.
2. Create users per branch (min: 1 manager per outlet).
3. Graduate pilot branches when KPIs are green (**Graduate to national**).
4. Communicate go-live date using `docs/phase6/NATIONAL_ROLLOUT.md`.

## 6. Rollback

See `docs/runbooks/DEPLOY_RUNBOOK.md` — promote previous Vercel deployment; restore Neon if migration failed.
