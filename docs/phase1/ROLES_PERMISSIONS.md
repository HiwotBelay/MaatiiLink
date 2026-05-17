# MaatiiLink — Roles & Permissions Matrix

## Roles

| Role | Description |
|------|-------------|
| `BRANCH_STAFF` | Teller / operations officer at one branch |
| `BRANCH_MANAGER` | Submits EOD, acks directives, manages branch tickets |
| `SUPERVISOR` | District/regional oversight across many branches |
| `HO_ADMIN` | Head Office: publish directives, assign tickets, all-branch view |
| `AUDITOR` | Read-only compliance and audit export |

## Permission matrix

| Action | BRANCH_STAFF | BRANCH_MANAGER | SUPERVISOR | HO_ADMIN | AUDITOR |
|--------|:------------:|:--------------:|:----------:|:--------:|:-------:|
| Login | ✓ | ✓ | ✓ | ✓ | ✓ |
| View own branch dashboard | ✓ | ✓ | — | ✓ | ✓ |
| Create / edit EOD (draft) | — | ✓ | — | ✓ | — |
| Submit EOD | — | ✓ | — | ✓ | — |
| Lock EOD (review) | — | — | ✓ | ✓ | — |
| View EOD (own branch) | ✓ | ✓ | ✓ | ✓ | ✓ |
| View EOD (all branches in scope) | — | — | ✓ | ✓ | ✓ |
| Create incident | ✓ | ✓ | ✓ | ✓ | — |
| Update incident status | — | ✓ | ✓ | ✓ | — |
| View incidents (own branch) | ✓ | ✓ | ✓ | ✓ | ✓ |
| View incidents (district/all) | — | — | ✓ | ✓ | ✓ |
| Publish HO directive | — | — | — | ✓ | — |
| Acknowledge directive (branch) | — | ✓ | — | ✓ | — |
| View directives | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create service ticket | ✓ | ✓ | ✓ | ✓ | — |
| Assign / close ticket | — | — | — | ✓ | — |
| View tickets (own branch) | ✓ | ✓ | ✓ | ✓ | ✓ |
| View all tickets | — | — | ✓ | ✓ | ✓ |
| Supervisor dashboard | — | — | ✓ | ✓ | ✓ |
| Manage users / branches | — | — | — | ✓ | — |
| Export audit log | — | — | — | ✓ | ✓ |
| View audit log | — | — | ✓ | ✓ | ✓ |

## Data scope rules

| Role | Branch data scope |
|------|-------------------|
| BRANCH_STAFF, BRANCH_MANAGER | `user.branchId` only |
| SUPERVISOR | All branches (MVP); later filter by `district` |
| HO_ADMIN, AUDITOR | All branches |

## Route access (UI)

| Route | Allowed roles |
|-------|----------------|
| `/login` | Public |
| `/dashboard` | All authenticated |
| `/eod` | BRANCH_STAFF (view), BRANCH_MANAGER+ (edit) |
| `/incidents` | All except AUDITOR (write) |
| `/directives` | All authenticated |
| `/tickets` | All except AUDITOR (write) |
| `/supervisor` | SUPERVISOR, HO_ADMIN, AUDITOR |
| `/admin` | HO_ADMIN |
