# MaatiiLink — Backup & Recovery Policy

**Phase 2** | Database: Neon PostgreSQL

---

## Backup strategy

| Item | Policy |
|------|--------|
| **Provider** | Neon automated backups (continuous + daily snapshots per plan) |
| **Frequency** | Continuous WAL / PITR per Neon tier |
| **Retention** | Minimum **7 days** on dev; **30 days** recommended for staging/production |
| **Scope** | Full database (all MaatiiLink tables in `public` schema) |
| **App code** | GitHub `main` / `develop` (source of truth) |
| **Secrets** | `.env` not in git; store in team password manager |

---

## Recovery objectives (pilot)

| Metric | Target |
|--------|--------|
| **RPO** (max data loss) | < 24 hours (pilot); < 1 hour with Neon PITR on prod |
| **RTO** (time to restore service) | < 4 hours (pilot) |

---

## Procedures

### Restore database (Neon)

1. Open Neon console → project → **Restore** / point-in-time.
2. Create branch from restore point OR restore to new endpoint.
3. Update staging/production `DATABASE_URL` if endpoint changes.
4. Run `npx prisma migrate deploy` to ensure schema version matches app.
5. Verify `/api/health` and row counts.

### Restore application

1. Checkout last known good git tag on `main`.
2. `npm ci && npm run build`
3. Redeploy to host.
4. Smoke test login + health.

---

## Monthly operational tasks

| Task | Owner |
|------|-------|
| Confirm Neon backups enabled | SABA CODERS lead |
| Export audit logs CSV for archive | HO_ADMIN / AUDITOR (when live) |
| Test restore on staging (quarterly) | SABA CODERS |

---

## What we do not backup in v1

- Uploaded incident files (until Sprint 3; then object storage with versioning)
- Browser session state (users re-login after restore)
