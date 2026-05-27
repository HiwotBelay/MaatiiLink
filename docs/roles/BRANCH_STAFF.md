# Branch Staff role — MaatiiLink

**Persona:** Teller / operations officer at **one branch** (e.g. counter staff, junior ops).  
**Login:** `staff@maatiilink.local` / `ChangeMe123!` (after seed)  
**Home:** `/dashboard`

---

## Purpose at the bank

Branch staff execute daily customer and cash work. In MaatiiLink they **support** the branch manager — they do **not** close the day or sign off HO policies on behalf of the branch.

| They do on the job | In MaatiiLink |
|--------------------|---------------|
| Serve customers | — (out of scope) |
| Notice problems (fraud, downtime, cash issue) | **Report incident** |
| Need HO procedure (withdrawal rules, ATM down) | **Search Knowledge** |
| Need IT / facilities help | **Create service ticket** |
| Check if EOD was done | **View EOD** (read-only) |
| Close the branch day | **Manager only** |
| Confirm HO circular read | **Manager only** |

---

## After login — what they see

### 1. Dashboard (`/dashboard`)

Four cards for **their branch only**:

| Card | Meaning |
|------|---------|
| EOD today | Status of today’s report (view only) |
| Open incidents | Count at their branch |
| Overdue policies | Mandatory HO procedures not yet ack’d by **manager** |
| Open service requests | Their branch tickets |

### 2. Sidebar navigation

| Menu | Access |
|------|--------|
| Dashboard | ✓ |
| EOD | View + history (read-only) |
| Incidents | Create + view **own branch** |
| Knowledge | Search & read procedures |
| Service ops | Create + view **own branch** tickets |
| Pilot | Submit rollout feedback (optional) |

**Not visible:** Head Office, Supervisor, EOD oversight, Admin, Audit, Security, Go-live.

---

## Permissions (technical)

| Action | Allowed |
|--------|---------|
| View EOD (own branch) | ✓ |
| Edit / submit EOD | ✗ (manager) |
| Create incident | ✓ |
| Attach evidence (photos/PDF) | ✓ (on report or open incident) |
| Update incident status | ✗ (manager+) |
| View incidents (own branch) | ✓ |
| View / search directives | ✓ |
| Acknowledge directive | ✗ (manager) |
| Create service ticket | ✓ |
| View tickets (own branch) | ✓ |
| Assign / close tickets | ✗ (HO / IT) |
| Supervisor / HO dashboards | ✗ |

---

## Data scope

All queries filter by `user.branchId` — staff never see other branches’ data.

---

## Test account

| Field | Value |
|-------|--------|
| Email | `staff@maatiilink.local` |
| Password | `ChangeMe123!` |
| Branch | Smart Branch Pilot - Bole (SM001) |
