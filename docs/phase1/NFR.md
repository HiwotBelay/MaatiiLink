# MaatiiLink — Non-Functional Requirements v1.0

## Performance

| ID | Requirement | Target |
|----|-------------|--------|
| PERF-1 | Page load (dashboard) on 4G | < 3 seconds |
| PERF-2 | API read endpoints (p95) | < 500 ms |
| PERF-3 | API write endpoints (p95) | < 1 s |
| PERF-4 | Supervisor dashboard (100 branches) | < 2 s |
| PERF-5 | Concurrent branch EOD submissions | 50 without error |

## Availability

| ID | Requirement | Target |
|----|-------------|--------|
| AVAIL-1 | Uptime during business hours (Mon–Sat 08:00–20:00 EAT) | 99% (pilot) |
| AVAIL-2 | Planned maintenance | Off-hours + notify HO |
| AVAIL-3 | Health endpoint `/api/health` | Monitored every 5 min |

## Security

| ID | Requirement |
|----|-------------|
| SEC-1 | HTTPS only in production |
| SEC-2 | Passwords bcrypt (cost >= 12) |
| SEC-3 | Session HTTP-only cookie; SameSite=Lax |
| SEC-4 | RBAC on every API route |
| SEC-5 | No customer PII in v1 |
| SEC-6 | Rate limit login: 10 attempts / 15 min / IP |
| SEC-7 | Input validation with Zod on all writes |
| SEC-8 | npm audit: zero critical CVEs at release |

## Backup & recovery

| ID | Requirement | Target |
|----|-------------|--------|
| BAK-1 | Neon / DB automated backups | Daily (provider default) |
| BAK-2 | Point-in-time recovery | Per Neon plan |
| BAK-3 | Export audit logs monthly | CSV archive by HO |
| BAK-4 | RTO (pilot) | < 4 hours |
| BAK-5 | RPO (pilot) | < 24 hours |

## Scalability (design for)

| ID | Requirement |
|----|-------------|
| SCL-1 | Support 753 branches, ~15,000 users (phased rollout) |
| SCL-2 | ~753 EOD records/day peak |
| SCL-3 | Database indexes on branchId, reportDate, createdAt |

## Usability

| ID | Requirement |
|----|-------------|
| UX-1 | Responsive: tablet (768px+) and desktop |
| UX-2 | EOD form completable in < 5 minutes |
| UX-3 | English UI v1; localization backlog |
| UX-4 | Clear error messages (no raw stack traces to user) |

## Compliance & audit

| ID | Requirement |
|----|-------------|
| CMP-1 | Immutable audit log (append-only; no delete API) |
| CMP-2 | Directive acknowledgment timestamp + userId stored |
| CMP-3 | EOD submit timestamp + submittedById stored |

## Hosting (pilot)

| Environment | Purpose |
|-------------|---------|
| Local | `npm run dev` + Neon dev DB |
| Staging | Team + optional bank UAT |
| Production | Bank-approved server or Vercel/Railway with IT approval |
