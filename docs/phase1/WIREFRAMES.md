# MaatiiLink — Wireframes v1.0 (6 MVP screens)

**Approved by:** SABA CODERS — May 2026  
**Fidelity:** Low-fi text wireframes (build to these layouts in Sprint 1–4)

---

## Screen 1 — Login

```
┌────────────────────────────────────────────┐
│              [Coopbank logo]               │
│              MaatiiLink                  │
│     Branch-to-Head Office Bridge         │
├────────────────────────────────────────────┤
│  Email    [________________________]     │
│  Password [________________________]     │
│                                          │
│         [        Sign in        ]        │
│                                          │
│  Forgot password? (Phase 2)              │
└────────────────────────────────────────────┘
```

**After login redirect:**
- BRANCH_* → `/dashboard`
- SUPERVISOR / HO_ADMIN / AUDITOR → `/supervisor`

---

## Screen 2 — Branch dashboard (home)

```
┌──────────────────────────────────────────────────────────┐
│ MaatiiLink    Bole Smart Branch (SM001)    [Manager ▼]  │
├──────────────────────────────────────────────────────────┤
│ Good afternoon, Abebe                                    │
├──────────────┬──────────────┬──────────────┬─────────────┤
│ EOD Today    │ Incidents    │ Directives   │ Tickets     │
│ ⚠ Not sent   │ 1 open       │ 2 pending    │ 0 open      │
│ [Submit EOD] │ [View]       │ [Acknowledge]│ [New ticket]│
├──────────────┴──────────────┴──────────────┴─────────────┤
│ Recent activity                                          │
│ • EOD submitted yesterday 17:42                          │
│ • Incident #INC-042 opened                               │
└──────────────────────────────────────────────────────────┘
```

---

## Screen 3 — Digital EOD

```
┌──────────────────────────────────────────────────────────┐
│ ← Back          End of Day Report — 17 May 2026          │
├──────────────────────────────────────────────────────────┤
│ Status: [DRAFT ▼]              [Save draft] [Submit]     │
├──────────────────────────────────────────────────────────┤
│ Opening cash band     ( ) 0-50K  (•) 50K-200K  ( ) 200K+  │
│ Closing cash band     ( ) 0-50K  (•) 50K-200K  ( ) 200K+  │
│ Customer complaints   [  2  ]                            │
│ Transaction anomalies [____________________________]     │
│ Staffing notes        [____________________________]     │
├──────────────────────────────────────────────────────────┤
│ History (last 7 days)                                    │
│ 16 May  ✓ Submitted   15 May  ✓ Submitted   ...          │
└──────────────────────────────────────────────────────────┘
```

---

## Screen 4 — Incidents

**List view:**
```
┌──────────────────────────────────────────────────────────┐
│ Incidents                    [ + Report incident ]       │
├──────────────────────────────────────────────────────────┤
│ Filter: [All statuses ▼] [All severities ▼]            │
├──────────────────────────────────────────────────────────┤
│ CRITICAL │ System downtime — core teller    OPEN  2h ago │
│ MEDIUM   │ Cash shortage at closing        ESC   1d ago  │
│ LOW      │ Customer dispute counter 2      RES   3d ago  │
└──────────────────────────────────────────────────────────┘
```

**Create modal:**
```
│ Category  [SYSTEM_DOWNTIME ▼]                            │
│ Severity  [HIGH ▼]                                       │
│ Title     [________________]                             │
│ Details   [________________]                             │
│           [ Submit ]  [ Cancel ]                         │
```

---

## Screen 5 — HO Directives

```
┌──────────────────────────────────────────────────────────┐
│ HO Directives                                            │
├──────────────────────────────────────────────────────────┤
│ 🔴 CRITICAL — New KYC desk procedure                     │
│    Deadline: 20 May 2026    Status: ⚠ Not acknowledged   │
│    [ Read full ]  [ Acknowledge ]                        │
├──────────────────────────────────────────────────────────┤
│ ○ Standard — Holiday branch hours May                    │
│    Deadline: 25 May 2026    Status: ✓ Acknowledged       │
└──────────────────────────────────────────────────────────┘

Acknowledge flow:
  1. Full text scroll
  2. Checkbox "I confirm this branch has read and will comply"
  3. [Confirm] → stores userId + timestamp
```

---

## Screen 6 — Internal service desk

```
┌──────────────────────────────────────────────────────────┐
│ Service desk                 [ + New request ]         │
├──────────────────────────────────────────────────────────┤
│ #TK-108  IT — Printer not working        IN_PROGRESS   │
│          Assigned: HO IT — SLA: 18h left                 │
├──────────────────────────────────────────────────────────┤
│ #TK-102  FACILITIES — AC unit fault        RESOLVED      │
└──────────────────────────────────────────────────────────┘

New request:
  Category [IT ▼]  Priority [MEDIUM ▼]
  Title [____]  Description [____]
```

---

## Screen 7 — Supervisor command dashboard

```
┌──────────────────────────────────────────────────────────┐
│ Supervisor dashboard     District: Bole    [Export CSV]  │
├──────────────────────────────────────────────────────────┤
│ Summary:  12 branches  |  EOD on-time: 83%  |  3 critical│
├────────────┬─────────┬──────────┬───────────┬────────────┤
│ Branch     │ EOD     │ Incidents│ Directives│ Tickets    │
├────────────┼─────────┼──────────┼───────────┼────────────┤
│ SM001 Bole │ ✓ 17:10 │ 1 open   │ 1 overdue │ 0          │
│ ET012 Mesa │ ✗ Missed│ 0        │ ✓         │ 2 open     │
│ ET088 Urael│ ✓ 16:55 │ 🔴 CRIT  │ ✓         │ 1          │
└────────────┴─────────┴──────────┴───────────┴────────────┘
```

---

## Navigation (authenticated)

```
Branch roles:     [Dashboard] [EOD] [Incidents] [Directives] [Tickets]
Supervisor/HO:    [Dashboard] [Supervisor] [Incidents*] [Directives*] [Admin*]
* scope = all branches
```
