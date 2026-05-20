# Knowledge / directives — content guide (SABA CODERS)

## What your lead asked for

Branches today **call Head Office** to ask “what is the latest procedure for X?”. MaatiiLink replaces that with:

1. **Search** — title, keywords, body text  
2. **Browse by area** — Cash, Loans, Compliance, Treasury, Security, Customer, ATM, Emergency  
3. **Quick lookup** — one tap for common tasks (large withdrawal, AML, ATM down, etc.)  
4. **Latest & pinned** — HO critical circulars at the top  
5. **Acknowledgment** — branch manager confirms read (audit trail)

All of this uses the **same database** as production — not a separate demo app.

---

## Where “real” directives come from

| Source | Who | How |
|--------|-----|-----|
| **Head Office publish** | `hoops@`, `admin@` | `/directives/new` → saved to PostgreSQL → visible to all branches |
| **Seed procedures** | Developers | `npm run db:seed` — pilot SOPs with refs like `HO-2026-001` (replace with bank PDFs over time) |
| **Bank circulars (your task)** | HO / Compliance team | Copy text from email/PDF into **Publish** — title, category, deadline, mandatory flag |

There is **no external government API** for directives. The bank’s truth is whatever HO publishes into MaatiiLink (or imports in a later sprint).

### Recommended rollout with the bank

1. Ask HO for **last 20–30 active circulars** (Word/PDF/email).  
2. For each: **Publish** with correct **category** and **keywords** (Amharic/English terms staff actually search).  
3. Mark **mandatory** + **deadline** when branches must acknowledge.  
4. Pin **critical** items (fraud, AML, emergency).

---

## Categories (areas)

| Code | Area |
|------|------|
| `CASH_OPERATIONS` | Cash, vault, withdrawals |
| `LOAN_PROCEDURES` | Lending, disbursement, collections |
| `COMPLIANCE` | AML, KYC, regulatory |
| `TREASURY` | Liquidity, cash movement |
| `SECURITY` | Fraud, physical security |
| `CUSTOMER_OPERATIONS` | Account opening, complaints |
| `ATM_OPERATIONS` | ATM cash, downtime |
| `EMERGENCY_PROCEDURES` | Power, unrest, BCP |

---

## After pulling latest code — load procedures

```powershell
cd maatiilink
npm run db:seed
```

Then open **Knowledge** as `manager@maatiilink.local` or publish more as `hoops@maatiilink.local`.

---

## APIs (all functional)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/directives?q=&category=` | Search / list |
| POST | `/api/directives` | HO publish |
| POST | `/api/directives/[id]/read` | Mark read |
| POST | `/api/directives/[id]/acknowledge` | Branch manager ack |
| GET | `/api/directives/analytics` | HO compliance stats |
