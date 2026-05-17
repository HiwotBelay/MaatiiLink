# MaatiiLink — RBAC Implementation Plan

**Phase 2** | Maps PRD roles to code

---

## Role mapping (PRD → Prisma → code)

| PRD name | Prisma `Role` enum | Implementation |
|----------|-------------------|----------------|
| BranchStaff | `BRANCH_STAFF` | `src/lib/rbac.ts` |
| BranchManager | `BRANCH_MANAGER` | `src/lib/rbac.ts` |
| Supervisor | `SUPERVISOR` | `src/lib/rbac.ts` |
| HOAdmin | `HO_ADMIN` | `src/lib/rbac.ts` |
| AuditorReadOnly | `AUDITOR` | `src/lib/rbac.ts` |

---

## Enforcement layers

| Layer | File | When |
|-------|------|------|
| 1. Middleware | `src/middleware.ts` | Block unauthenticated UI routes (Sprint 1) |
| 2. API handlers | Each `src/app/api/**/route.ts` | `requirePermission()` per method |
| 3. Data scope | Service functions | Filter `branchId` for branch roles |
| 4. Tests | `src/lib/rbac.test.ts` | CI on every PR |

---

## Permission constants

Defined in `Permission` object in `src/lib/rbac.ts`:

- `eod:draft`, `eod:submit`, `eod:lock`, `eod:view:branch`, `eod:view:all`
- `incident:create`, `incident:update`, `incident:view:branch`, `incident:view:all`
- `directive:publish`, `directive:ack`, `directive:view`
- `ticket:create`, `ticket:assign`, `ticket:view:branch`, `ticket:view:all`
- `dashboard:supervisor`, `admin:users`, `audit:view`, `audit:export`

---

## Public routes (no session)

| Path | Reason |
|------|--------|
| `/login` | Auth entry |
| `/api/health` | Monitoring |
| `/api/auth/login` | Auth entry |

All other `/api/*` and app routes require session (PRD acceptance criteria).

---

## Example (Sprint 1+)

```typescript
import { requirePermission, Permission } from "@/lib/rbac";

export async function POST(req: Request, user: { role: Role }) {
  requirePermission(user.role, Permission.EOD_SUBMIT);
  // ...
}
```

---

## Full matrix

See `docs/phase1/ROLES_PERMISSIONS.md` (unchanged; this doc is implementation binding).
