# Hypercare — First 14 Days After Go-Live

**Owner:** SABA CODERS + HO operations contact

## Daily (business days)

| Time | Action |
|------|--------|
| 08:30 | Check `/api/health` and Vercel deployment status |
| 09:00 | Review `/pilot` KPIs; assign open Sev-1 items |
| 17:00 | Confirm EOD submission rate ≥ 90% for pilot/national branches |

## Escalation

| Severity | Response | Channel |
|----------|----------|---------|
| Sev-1 (outage) | < 1 hour | Phone + HO IT (fill bank contacts below) |
| Sev-2 (degraded) | < 4 hours | Supervisor email |
| Sev-3 (UX/training) | 48 hours | Pilot feedback triage |

**Bank contacts (fill in, do not commit personal numbers to git):**

- HO IT desk: _______________
- District supervisor on-call: _______________
- COOP DX Valley mentor: _______________

## Weekly

- Export audit sample for HO compliance (`/audit`)
- Update `docs/RISK_REGISTER.md` with any production incidents
- Short status email to mentor (template in `G6_MENTOR_SUBMISSION.md`)
