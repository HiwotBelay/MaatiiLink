# MaatiiLink — Threat Model (STRIDE)

**Phase 2** | SABA CODERS | May 2026

Scope: **authentication**, **file uploads** (incidents), **HO directive publish** flows.

---

## Assets

| Asset | Sensitivity |
|-------|-------------|
| User credentials | High |
| Session tokens | High |
| EOD / incident / ticket data | Medium (operational, no customer PII v1) |
| HO directives | Medium (policy content) |
| Audit logs | High (compliance) |

---

## 1. Authentication flow

| STRIDE | Threat | Mitigation | Status |
|--------|--------|------------|--------|
| **S** Spoofing | Attacker fakes user identity | bcrypt passwords; signed session cookie; `isActive` check | Sprint 1 |
| **T** Tampering | Modify session cookie | HTTP-only, Secure, SameSite; server-side session store or signed JWT with secret | Sprint 1 |
| **R** Repudiation | User denies login/action | `AuditLog` LOGIN/LOGOUT + entity actions | Sprint 1 |
| **I** Info disclosure | Password in logs | Never log passwords; generic login error message | Sprint 1 |
| **D** Denial of service | Brute-force login | Rate limit 10/15min/IP on `/api/auth/login` | Sprint 1 |
| **E** Elevation | Staff gains HO_ADMIN | RBAC on every route; role from DB not client | Sprint 1 |

---

## 2. File upload flow (incidents — Sprint 3)

| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| **S** | Upload malware disguised as PDF | MIME allowlist: pdf, jpeg, png; max 5MB |
| **T** | Replace another branch's file | Store with incidentId; auth check branch scope |
| **R** | Deny upload occurred | AuditLog INCIDENT_CREATE with metadata |
| **I** | Leak file to wrong user | Serve files only after auth + branch/HO scope |
| **D** | Large upload flood | Size limit; rate limit per user |
| **E** | Upload path traversal | UUID filenames; no user-controlled paths |

---

## 3. HO directive publish flow

| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| **S** | Non-admin publishes fake policy | `requirePermission(HO_ADMIN, DIRECTIVE_PUBLISH)` |
| **T** | Alter directive after branches acked | Immutable body after publish; new version = new directive |
| **R** | HO denies publishing | AuditLog + `publishedById` + timestamp |
| **I** | Draft visible to branches early | Status: only `publishedAt <= now` visible |
| **D** | Spam directives | HO_ADMIN only; optional rate limit |
| **E** | Manager publishes directive | RBAC blocks non-HO_ADMIN |

---

## 4. Residual risks (accepted for MVP)

| Risk | Acceptance | Future |
|------|------------|--------|
| Shared dev passwords in seed | Dev only; rotate before pilot | SSO/LDAP |
| Neon cloud outside Ethiopia | OK for DX Valley dev | Bank on-prem for prod |
| No WAF | Staging behind auth | Bank WAF at prod |

---

## 5. Security checklist before pilot

- [ ] HTTPS enforced
- [ ] SESSION_SECRET >= 32 random bytes
- [ ] npm audit zero critical
- [ ] All API routes have RBAC tests
- [ ] Seed/dev accounts disabled or password-rotated
