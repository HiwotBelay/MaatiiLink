# G2 — Architecture & staging review (mentor pack)

**Project:** MaatiiLink — Cooperative Bank of Oromia (COOP DX Valley)  
**Team:** SABA CODERS  
**Date:** 2026-05-17  
**Requested by:** SABA CODERS

---

## 1. Summary for reviewer

MaatiiLink is an internal branch-to–Head Office operations web app (Next.js 15, PostgreSQL on Neon, session auth + RBAC). This submission requests **Gate G2** approval: architecture, security posture, and a **live staging URL** for UAT.

| Item | Location |
|------|----------|
| System architecture (diagram + deployment) | `docs/phase2/ARCHITECTURE.md` |
| STRIDE threat model (auth, uploads, HO publish) | `docs/phase2/THREAT_MODEL.md` |
| RBAC matrix (5 roles) | `docs/phase2/RBAC_PLAN.md` + code `src/lib/rbac.ts` |
| Backup & retention | `docs/phase2/BACKUP_POLICY.md` |
| CI on every PR | `.github/workflows/ci.yml` |
| DB migrations | `docs/phase2/MIGRATION_STRATEGY.md` |

---

## 2. Staging environment

| Field | Value |
|-------|--------|
| **Staging URL** | https://maatii-link.vercel.app |
| **Health check** | https://maatii-link.vercel.app/api/health |
| **Hosting** | Vercel (Preview/Production on `develop`) or DX Valley VM |
| **Database** | Neon PostgreSQL — isolated `staging` branch |
| **Secrets** | `DATABASE_URL`, `SESSION_SECRET` — not in git; Vercel env only |

Expected health response:

```json
{
  "ok": true,
  "service": "MaatiiLink",
  "database": "connected"
}
```

---

## 3. Security controls (implemented)

- HTTP-only session cookie; `jose` signed sessions; 8h expiry
- Passwords hashed with bcrypt (seed users for UAT only)
- RBAC enforced in middleware + API (`src/lib/rbac.ts`)
- Audit log for auth and EOD state changes
- TLS in transit (Vercel/Neon); DB SSL required
- No secrets in repository; `.env` gitignored

**Out of scope for staging (documented):** Bank LDAP/SSO, WAF, on-prem production host.

---

## 4. Test accounts (staging UAT only)

Password for all seed users: documented in `docs/DEV_SETUP.md` (rotate before bank pilot).

| Role | Email |
|------|--------|
| Branch manager | `manager@maatiilink.local` |
| Supervisor | `supervisor@maatiilink.local` |
| HO admin | `admin@maatiilink.local` |

---

## 5. Approval (mentor / IT)

Please review the documents above and the staging URL, then sign below.

| Check | Mentor |
|-------|--------|
| Architecture acceptable for internship pilot | ☐ Approved ☐ Changes required |
| Threat model adequate for current scope | ☐ Approved ☐ Changes required |
| Staging URL accessible; health endpoint OK | ☐ Approved ☐ Changes required |
| **Gate G2** | ☐ **Approved** ☐ **Not approved** |

**Reviewer name:** _______________________  
**Role:** _______________________  
**Date:** _______________________  
**Comments:**

---

## 6. Email template (copy/paste)

**Subject:** MaatiiLink — Gate G2 architecture & staging review (SABA CODERS)

Dear [Mentor name],

We are requesting **Gate G2** sign-off for the MaatiiLink internship project (COOP DX Valley).

**Staging:** [YOUR_VERCEL_URL]  
**Health:** [YOUR_VERCEL_URL]/api/health  

**Documents** (in repo `docs/phase2/`):

- Architecture: ARCHITECTURE.md  
- Threat model (STRIDE): THREAT_MODEL.md  
- RBAC: RBAC_PLAN.md  
- Backup policy: BACKUP_POLICY.md  

CI runs lint, typecheck, unit tests, and build on every PR to `main`/`develop`.

Please confirm approval or list required changes. Thank you.

[SABA CODERS lead name]
