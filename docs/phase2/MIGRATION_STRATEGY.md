# MaatiiLink — Database Migration Strategy

**ORM:** Prisma 5 | **Database:** PostgreSQL (Neon)

---

## Principles

1. **Never edit applied migrations** — add a new migration for every schema change.
2. **Same migration order** on dev, staging, and production.
3. **No `db push` on production** — use `prisma migrate deploy` only.

---

## Commands

| Task | Command | Who |
|------|---------|-----|
| Local dev change | `npm run db:migrate` | Developer |
| Apply on staging/prod | `npx prisma migrate deploy` | Deploy pipeline or lead |
| Regenerate client | `npx prisma generate` | Automatic on `postinstall` / build |
| Seed dev data | `npm run db:seed` | Local + staging only |
| Inspect data | `npm run db:studio` | Developers |

---

## Workflow

```mermaid
flowchart LR
  A[Edit schema.prisma] --> B[prisma migrate dev]
  B --> C[Commit migration SQL]
  C --> D[PR + CI build]
  D --> E[merge to develop]
  E --> F[migrate deploy on staging]
  F --> G[UAT]
  G --> H[migrate deploy on production]
```

---

## Branching (Neon)

| Environment | Neon setup |
|-------------|------------|
| Development | Main Neon project (current `.env`) |
| Staging | Separate branch or project `maatiilink-staging` |
| Production | New project; no shared password with dev |

---

## Rollback

- Prisma has no automatic down migrations in production.
- **Rollback plan:** restore Neon point-in-time backup (see `BACKUP_POLICY.md`) + redeploy previous app version.
- For safe changes: prefer additive columns (nullable first), deploy app, then backfill, then enforce.

---

## Current migrations

| Migration | Description |
|-----------|-------------|
| `20260517172052_init` | Initial schema: Branch, User, EOD, Incident, Directive, Ticket, AuditLog |

---

## CI note

CI uses a dummy `DATABASE_URL` for `prisma generate` and `next build`. Migrations are validated in dev before push; optional future job: ephemeral Postgres + `migrate deploy` on PR.
