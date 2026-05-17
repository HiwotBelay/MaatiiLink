# MaatiiLink — Entity Relationship Diagram

**Implementation:** `prisma/schema.prisma` (source of truth)  
**Status:** v1.0 aligned with PRD — May 2026

---

## Diagram (logical)

```
┌─────────────┐       ┌─────────────┐
│   Branch    │◄──────│    User     │
│─────────────│  1:N  │─────────────│
│ id          │       │ id          │
│ branchCode  │       │ email       │
│ name        │       │ role        │
│ district    │       │ branchId?   │
│ region      │       │ passwordHash│
│ isSmartBranch│      └──────┬──────┘
└──────┬──────┘              │
       │                     │
       │ 1:N                 │
       ▼                     │
┌─────────────┐              │
│  EodReport  │◄─────────────┘ submittedBy
│─────────────│
│ branchId    │
│ reportDate  │ UNIQUE(branchId, reportDate)
│ status      │
│ cash bands  │
└─────────────┘

┌─────────────┐       ┌─────────────┐
│  Incident   │       │  Directive  │
│─────────────│       │─────────────│
│ branchId    │       │ publishedBy │
│ reporterId  │       │ title, body │
│ severity    │       │ deadlineAt  │
│ status      │       └──────┬──────┘
└─────────────┘              │ 1:N
                             ▼
                    ┌──────────────────────┐
                    │ DirectiveAck         │
                    │──────────────────────│
                    │ directiveId+branchId │ UNIQUE
                    │ userId               │
                    │ acknowledgedAt       │
                    └──────────────────────┘

┌─────────────┐       ┌─────────────┐
│ServiceTicket│       │  AuditLog   │
│─────────────│       │─────────────│
│ branchId    │       │ userId?     │
│ creatorId   │       │ action      │
│ assigneeId? │       │ entityType  │
│ category    │       │ metadata    │
│ status      │       └─────────────┘
└─────────────┘
```

---

## Entities summary

| Entity | Purpose |
|--------|---------|
| Branch | Bank outlet (753+ in network) |
| User | Staff login; linked to branch except SUPERVISOR/HO |
| EodReport | Daily branch operations summary |
| Incident | Operational exception / risk event |
| Directive | HO policy circular |
| DirectiveAcknowledgment | Proof branch received directive |
| ServiceTicket | Internal IT / facilities / cash logistics request |
| AuditLog | Compliance trail for all critical actions |

---

## Enums

| Enum | Values |
|------|--------|
| Role | BRANCH_STAFF, BRANCH_MANAGER, SUPERVISOR, HO_ADMIN, AUDITOR |
| EodStatus | DRAFT, SUBMITTED, LOCKED |
| IncidentSeverity | LOW, MEDIUM, HIGH, CRITICAL |
| IncidentStatus | OPEN, ESCALATED, RESOLVED, CLOSED |
| TicketCategory | IT, FACILITIES, CASH_LOGISTICS, OTHER |
| TicketStatus | OPEN, IN_PROGRESS, RESOLVED, CLOSED |
| TicketPriority | LOW, MEDIUM, HIGH, URGENT |

---

## Changes from discovery

| Change | Reason |
|--------|--------|
| Cash as bands not amounts | Reduces sensitivity; no vault balance in v1 |
| One EOD per branch per day | Matches bank EOD practice |
| One directive ack per branch | Manager signs for branch |

---

## Prisma commands

```bash
npx prisma studio          # visual ERD browser
npx prisma migrate dev     # apply schema changes
```
