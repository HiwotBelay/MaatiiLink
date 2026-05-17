# Production Setup — Pre go-live (after G5)

Use this checklist when moving from pilot staging to bank production hosting.

## Environment variables (Vercel or bank VM)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Neon pooled connection string |
| `DIRECT_URL` | Yes | Neon direct (migrations) |
| `SESSION_SECRET` | Yes | 32+ chars, no quotes |
| `APP_URL` | Yes | Public HTTPS URL |
| `NODE_ENV` | Yes | `production` |

Optional (email notifications from Sprint 3):

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

## Database

1. Create production Neon branch (separate from staging).
2. `npx prisma migrate deploy` with production `DIRECT_URL`.
3. **Do not** run full seed on production.
4. HO admin creates users via `/admin` or approved import script.

## Pilot branch flags

```sql
UPDATE "Branch" SET "isPilotBranch" = true WHERE "branchCode" IN ('...');
```

Only HO-approved codes. Remove flag when branch graduates to national rollout.

## Security

- Enforce HTTPS (Vercel default).
- Rotate `SESSION_SECRET` from staging.
- Review `docs/phase2/THREAT_MODEL.md` and Phase 4 checklist.
- Run `npm audit` and fix critical CVEs.

## Smoke test (production)

1. `/api/health` — database connected
2. Login as HO admin → supervisor dashboard
3. Login as branch manager → EOD draft/submit
4. `/pilot` — KPIs load for flagged branches

## Rollback

See `docs/runbooks/DEPLOY_RUNBOOK.md`.
