# MaatiiLink — HO Admin Guide

## Roles

- **HO Admin:** publish directives, assign service tickets, view all branches, export audit logs.
- **Supervisor:** compliance dashboard, lock EOD reports, view incidents network-wide.
- **Auditor:** read-only supervisor view + audit export.

## Publish a directive

1. **Directives** → **Publish directive**.
2. Set title, body, optional deadline, mark **Critical** if needed.
3. Branches must acknowledge before the deadline.

## Service desk

1. **Service desk** lists all branch tickets.
2. Update **status** and **assignee** (HO staff).
3. SLA hours show remaining time by priority.

## User directory

1. **Admin** shows all users (read-only in MVP).
2. User provisioning is via IT/DB seed until full admin CRUD is approved.

## Audit & exports

1. **Audit** — latest compliance actions.
2. **Export CSV** for examination sampling.
3. **Supervisor** → **Export CSV** for branch compliance snapshot.

## Production provisioning (Phase 6)

HO admin (`admin@maatiilink.local` in dev only):

1. **Admin → Users** — create branch managers and staff (password min 12 chars).
2. **Admin → Branches** — add outlets for national rollout; use **Graduate to national** when pilot KPIs pass.
3. **Go-live** (`/ops`) — confirm environment checks before announcing go-live.

Never run `npm run db:seed` on production.

## Staging vs production

Use separate Neon databases and `SESSION_SECRET` per environment. Never use production credentials on developer laptops.
