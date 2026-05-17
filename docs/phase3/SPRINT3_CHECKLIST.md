# Phase 3 — Sprint 3 Checklist (Incidents & HO Directives)

**Status:** COMPLETE (implementation) — May 2026

## Roadmap deliverables

- [x] Incident create: category, severity, title, description
- [x] Status flow: OPEN → ESCALATED → RESOLVED → CLOSED
- [x] CRITICAL incidents flagged on supervisor dashboard
- [x] Escalation notifications: in-app banner + email (when SMTP configured)
- [x] HO publish directive (title, body, deadline, isCritical)
- [x] Branch acknowledgment (one per branch per directive)
- [x] Overdue acks on supervisor compliance table
- [ ] Sprint demo recorded and deployed to staging (team action)

## Code locations

- APIs: `src/app/api/incidents/`, `src/app/api/directives/`
- Services: `src/lib/incident/`, `src/lib/directive/`
- UI: `src/app/incidents/`, `src/app/directives/`, supervisor compliance table
- Email: `src/lib/notifications/email.ts`

## Gate

Continue **Sprint 4** (service desk, full dashboard export, admin) then **G3** full MVP UAT.
