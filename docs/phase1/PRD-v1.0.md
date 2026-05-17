# MaatiiLink — Product Requirements Document v1.0

**Team:** SABA CODERS  
**Product:** MaatiiLink  
**Version:** 1.0  
**Date:** May 2026  
**Status:** Approved by team (Phase 1 complete)

---

## 1. Overview

### 1.1 Purpose

MaatiiLink is an **internal** web platform for Cooperative Bank of Oromia that connects **753+ branches** to **Head Office (HO)** with structured daily operations data, incidents, policy acknowledgments, and internal support tickets.

### 1.2 Users

| Persona | Role enum | Primary location |
|---------|-----------|------------------|
| Branch teller / ops officer | BRANCH_STAFF | Branch |
| Branch manager | BRANCH_MANAGER | Branch |
| District / regional supervisor | SUPERVISOR | Field / HO |
| HO operations, IT, compliance | HO_ADMIN | HO |
| Internal audit | AUDITOR | HO (read-only) |

### 1.3 Success criteria (MVP)

- Branch manager submits EOD **same day** before cut-off (configurable, default 18:00 Addis).
- Supervisor sees **all branches in district** with on-time % and open incidents.
- HO publishes directive; branch acknowledgment **logged with user + timestamp**.
- Internal ticket has **status + assignee** visible to branch and HO.
- Every create/update on business entities writes **AuditLog**.

---

## 2. Assumptions (discovery)

*SABA CODERS documents bank reality from public info + standard branch ops. Validate with real staff when possible.*

| ID | Assumption |
|----|------------|
| A1 | EOD today uses paper, Excel, or WhatsApp to district office |
| A2 | Incidents (fraud attempt, downtime, cash variance) are phoned or messaged ad-hoc |
| A3 | HO circulars are emailed or printed; no proof every branch read them |
| A4 | IT/facility requests have no shared ticket number |
| A5 | Supervisors oversee 10–40 branches and need one dashboard |
| A6 | No customer account data in MaatiiLink v1 |

---

## 3. Functional requirements

### 3.1 Authentication (Sprint 1)

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-1 | Email + password login | P0 |
| AUTH-2 | Session cookie, HTTP-only, secure in production | P0 |
| AUTH-3 | Role-based redirect after login | P0 |
| AUTH-4 | Deactivated users cannot login | P0 |
| AUTH-5 | Password change (manager/admin) | P1 |

### 3.2 Digital EOD (Sprint 2)

| ID | Requirement | Priority |
|----|-------------|----------|
| EOD-1 | One EOD per branch per calendar day | P0 |
| EOD-2 | Fields: report date, opening cash band, closing cash band, anomaly notes, complaint count, staffing notes | P0 |
| EOD-3 | Status flow: DRAFT → SUBMITTED → LOCKED (supervisor can lock) | P0 |
| EOD-4 | Only BRANCH_MANAGER (or HO_ADMIN) can submit | P0 |
| EOD-5 | History list last 30 days for branch | P0 |
| EOD-6 | Cash bands: enum ranges (not exact amounts) — e.g. `0-50K`, `50K-200K`, `200K+` ETB | P0 |

### 3.3 Incidents (Sprint 3)

| ID | Requirement | Priority |
|----|-------------|----------|
| INC-1 | Create incident: category, severity, title, description | P0 |
| INC-2 | Categories: FRAUD_ATTEMPT, SYSTEM_DOWNTIME, CASH_VARIANCE, SECURITY, CUSTOMER_DISPUTE, OTHER | P0 |
| INC-3 | Severity: LOW, MEDIUM, HIGH, CRITICAL | P0 |
| INC-4 | Status: OPEN → ESCALATED → RESOLVED → CLOSED | P0 |
| INC-5 | CRITICAL auto-flags on supervisor dashboard | P0 |
| INC-6 | Attachment upload (max 5MB, pdf/jpg/png) | P1 |

### 3.4 HO Directives (Sprint 3)

| ID | Requirement | Priority |
|----|-------------|----------|
| DIR-1 | HO_ADMIN publishes title, body, deadline, isCritical flag | P0 |
| DIR-2 | All branches see active directives | P0 |
| DIR-3 | BRANCH_MANAGER acknowledges on behalf of branch (one ack per branch per directive) | P0 |
| DIR-4 | Critical directive: optional 3-question quiz; quizPassed stored | P1 |
| DIR-5 | Overdue acks visible on supervisor dashboard | P0 |

### 3.5 Service desk (Sprint 4)

| ID | Requirement | Priority |
|----|-------------|----------|
| TKT-1 | Branch creates ticket: category IT, FACILITIES, CASH_LOGISTICS, OTHER | P0 |
| TKT-2 | Priority LOW–URGENT; status OPEN → IN_PROGRESS → RESOLVED → CLOSED | P0 |
| TKT-3 | HO_ADMIN assigns assignee | P0 |
| TKT-4 | SLA display: target hours by priority (24/48/72/168) | P1 |
| TKT-5 | Branch sees own tickets only; HO sees all | P0 |

### 3.6 Supervisor dashboard (Sprint 4)

| ID | Requirement | Priority |
|----|-------------|----------|
| DASH-1 | Table: branch name, EOD today (yes/no/late), open incidents count, overdue directives | P0 |
| DASH-2 | Filter by district/region | P1 |
| DASH-3 | Export CSV (audit sampling) | P1 |
| DASH-4 | AUDITOR: read-only same view + audit log export | P0 |

### 3.7 Audit log (Sprint 1+)

| ID | Requirement | Priority |
|----|-------------|----------|
| AUD-1 | Log: LOGIN, LOGOUT, EOD_SUBMIT, INCIDENT_CREATE, DIRECTIVE_ACK, TICKET_CREATE, TICKET_STATUS_CHANGE | P0 |
| AUD-2 | Fields: userId, action, entityType, entityId, metadata JSON, timestamp | P0 |

---

## 4. Out of scope (v1)

- Core banking balances/transfers  
- Merchant Nation / merchant data  
- Customer PII (account numbers, phone)  
- Mobile native apps (responsive web only)  
- Offline sync (Phase 7 backlog)  
- Amharic/Afaan Oromo UI (Phase 9 backlog)

---

## 5. User stories (summary)

**Branch manager:** As a branch manager, I submit today’s EOD before 6pm so my district supervisor does not call me on WhatsApp.

**Supervisor:** As a supervisor, I see which branches missed EOD or have CRITICAL incidents so I visit or call the same day.

**HO admin:** As HO operations, I publish a compliance circular and see which branches acknowledged before the deadline.

**Branch staff:** As teller staff, I open an IT ticket when the printer fails so HO IT has a ticket ID to track.

**Auditor:** As audit, I export audit logs for a date range without editing any record.

---

## 6. Acceptance criteria (MVP release)

1. All P0 requirements implemented and tested on staging.  
2. `npm run build` passes; `/api/health` returns DB connected.  
3. 3 test roles complete happy path: EOD submit → incident → directive ack → ticket.  
4. Security: all `/api/*` routes check session + role except `/api/auth/login` and `/api/health`.

---

## 7. Approval (Gate G1 — team)

| Role | Name | Date | Signature |
|------|------|------|-----------|
| SABA CODERS | Team | May 2026 | Approved |

*Optional: Coopbank staff validation before pilot.*
