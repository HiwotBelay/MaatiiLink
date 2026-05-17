# Phase 5 — Pilot Deployment Plan

**Duration:** Weeks 19–20 · **Gate:** G5 (pilot success before national rollout)

## Objectives

1. Validate MaatiiLink with **5 pilot branches** (mix of smart, traditional, eco).
2. Measure KPIs against roadmap targets for 14 rolling days.
3. Capture branch feedback and triage within 48 hours.
4. Produce a pilot report for mentor / HO sign-off.

## Pilot branches (dev seed)

| Code | Type | Region |
|------|------|--------|
| HQ001 | HO / DX Valley | Addis Ababa |
| SM001 | Smart | Addis Ababa |
| TR001 | Traditional | Addis Ababa |
| EB001 | Eco | Oromia |
| SM002 | Smart | SNNPR |

Production pilot codes are assigned by HO; set `Branch.isPilotBranch = true` only for approved outlets.

## KPI targets (in-app `/pilot`)

| Metric | Target |
|--------|--------|
| EOD on-time (submitted/locked) | ≥ 90% |
| Directive ack within 72h | ≥ 95% |
| Incident median response | < 4 hours |
| Sev-1 open > 24h (feedback + critical incidents) | 0 |

## Roles

| Role | Pilot access |
|------|----------------|
| Branch staff / manager | Submit feedback |
| Supervisor / auditor / HO admin | View KPIs; HO admin triages feedback |

## Weekly rhythm

- **Mon:** Review KPI dashboard; assign open Sev-1 items.
- **Wed:** 30-min check-in with pilot champions (see `PILOT_TRAINING.md`).
- **Fri:** Export feedback status; update risk register.

## Escalation

- **Sev-1:** HO admin + supervisor within 4h; document in pilot feedback + incidents.
- **Outage:** Follow `docs/runbooks/DEPLOY_RUNBOOK.md` rollback steps.

## Exit criteria (Gate G5)

- [ ] All four KPI tiles green for 7 consecutive days
- [ ] Training completed for all pilot champions
- [ ] `PILOT_REPORT_TEMPLATE.md` filled and signed
- [ ] Mentor sign-off recorded in `PHASE5_CHECKLIST.md`
