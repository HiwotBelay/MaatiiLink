# MaatiiLink — Deploy & Rollback Runbook

## Prerequisites

- Neon `DATABASE_URL` (pooled) + `DIRECT_URL` (direct) on Vercel
- `SESSION_SECRET` (32+ random characters)
- `APP_URL` set to public site URL

## Deploy to staging (Vercel)

```bash
git push origin develop
# CI must pass: lint, typecheck, test, build
# Vercel auto-deploys develop branch
npx prisma migrate deploy   # against staging DIRECT_URL
npm run db:seed             # only on fresh DB or as documented
```

Verify: `/api/health` returns database connected.

## Deploy to production

1. Merge `develop` → `main` after **G5 pilot** and **G4 UAT** sign-off.
2. Run `prisma migrate deploy` on production DB.
3. Do **not** re-run seed on production without HO approval.
4. Provision users/branches via `/admin` (see `docs/phase6/GO_LIVE_RUNBOOK.md`).
5. Run smoke: `APP_URL=https://your-prod-url npm run smoke`.
6. Verify `/ops` (HO admin) shows production-ready checks.

## Rollback

1. Revert to previous Vercel deployment (Deployments → Promote previous).
2. If a bad migration shipped, restore DB from Neon backup (see `docs/phase2/BACKUP_POLICY.md`).
3. Post incident note in team risk register.

## Backup restore (Neon)

1. Neon console → Branch → Restore / point-in-time.
2. Update `DATABASE_URL` if branch endpoint changes.
3. Re-run health check and smoke test login.
