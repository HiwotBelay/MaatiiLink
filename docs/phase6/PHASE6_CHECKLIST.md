# Phase 6 — Production Go-Live Checklist

**Status:** In progress — May 2026 · **Gate:** G6

## Pre-merge (develop → main)

- [ ] Gate G5 pilot sign-off complete (`docs/phase5/PHASE5_CHECKLIST.md`)
- [ ] `npm run ci` passes on `develop`
- [ ] `npm run smoke` passes against staging URL
- [ ] Production Neon database created (separate from staging)
- [ ] Vercel production env vars set (`docs/phase5/PRODUCTION_SETUP.md`)

## Deploy

- [ ] Merge `develop` → `main`
- [ ] `npx prisma migrate deploy` on production `DIRECT_URL`
- [ ] **Do not** run `npm run db:seed` on production
- [ ] HO admin provisions real users via `/admin`
- [ ] HO admin adds national branches via `/admin` (Branches tab)

## Verification

- [ ] `/api/health` → `ok: true`, `productionReady: true`
- [ ] `/ops` (HO admin) — all env checks green
- [ ] Login smoke: branch manager EOD, supervisor dashboard
- [ ] Production banner visible when `NODE_ENV=production`

## Hypercare (first 2 weeks)

- [ ] Daily review of `/pilot` KPIs and open Sev-1 feedback
- [ ] `docs/phase6/HYPERCARE.md` escalation contacts filled in
- [ ] Incident log in `docs/RISK_REGISTER.md` updated if outages occur

## Gate G6

- [ ] Mentor production sign-off
- [ ] HO sponsor acknowledgment (optional)
- [ ] Project marked complete in README
