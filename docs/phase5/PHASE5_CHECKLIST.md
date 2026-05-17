# Phase 5 — Pilot Deployment Checklist

**Status:** In progress — May 2026

## Application (code)

- [x] `Branch.isPilotBranch` flag + seed pilot branches
- [x] `PilotFeedback` model + API (create, list, triage)
- [x] KPI dashboard (`/pilot`, `GET /api/pilot/kpis`)
- [x] RBAC: `PILOT_VIEW`, `PILOT_FEEDBACK_CREATE`, `PILOT_FEEDBACK_TRIAGE`
- [x] Middleware + nav link to `/pilot`
- [x] Supervisor shortcut to pilot dashboard

## Database

- [ ] `npx prisma migrate deploy` on staging/production
- [ ] `npm run db:seed` on dev only (sets `isPilotBranch`)

## Operations

- [ ] Production env per `PRODUCTION_SETUP.md`
- [ ] Rotate dev passwords; disable seed on prod
- [ ] VPN / IP allowlist for pilot URL (if required by bank)
- [ ] Backup verified (Neon PITR)

## Training & UAT

- [ ] `PILOT_TRAINING.md` sessions completed (5 branches)
- [ ] 2 branch managers complete EOD + directive ack on staging
- [ ] Supervisor reviews compliance + pilot KPIs daily for 2 weeks

## Reporting

- [ ] `PILOT_REPORT_TEMPLATE.md` completed
- [ ] Open Sev-1 feedback items = 0 at gate review

## Gate G5

- [ ] Mentor pilot sign-off
- [ ] HO DX Valley approval to proceed to Phase 6 (production go-live)
