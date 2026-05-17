# Phase 4 — Security, Quality & UAT

**Status:** In progress — May 2026

## Security checklist

- [x] Secure session cookies (httpOnly, secure in production, SameSite lax)
- [x] CSRF protection on mutating API routes (Origin/Referer check)
- [x] Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- [x] Zod validation on API inputs
- [x] RBAC on all API routes
- [x] Rate limiting on login
- [ ] File upload limits (deferred — attachments in post-v1)
- [ ] `npm audit` — run before pilot; fix critical CVEs

## Testing checklist

- [x] Unit tests: EOD permissions, RBAC, incident transitions, ticket SLA
- [ ] Integration tests API + DB (optional CI with test DB)
- [ ] E2E: login → EOD → ack directive → create ticket
- [ ] Load test: 50 concurrent EOD submissions
- [ ] UAT: 2 branch managers + 1 supervisor on staging

## Documentation

- [x] Branch manager guide — `docs/guides/BRANCH_MANAGER_GUIDE.md`
- [x] Admin guide — `docs/guides/ADMIN_GUIDE.md`
- [x] Deploy runbook — `docs/runbooks/DEPLOY_RUNBOOK.md`
- [x] API contract — `docs/phase1/openapi.yaml`

## Gate G4

- [ ] Mentor UAT sign-off
- [ ] Zero critical bugs open on staging
