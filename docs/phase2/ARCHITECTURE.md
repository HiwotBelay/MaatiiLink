# MaatiiLink — System Architecture v1.0

**Team:** SABA CODERS | **Phase 2** | May 2026

---

## 1. High-level architecture

```mermaid
flowchart TB
  subgraph clients [Clients]
    BR[Branch tablet / PC browser]
    SV[Supervisor / HO browser]
  end

  subgraph vercel_or_host [Application host]
    WEB[Next.js 15 App Router]
    API[Route Handlers /api/*]
    AUTH[Session + RBAC layer]
    WEB --> API
    API --> AUTH
  end

  subgraph data [Data layer]
    PG[(PostgreSQL - Neon)]
  end

  subgraph external [Future integrations]
    LDAP[Bank LDAP / SSO]
    CORE[Core banking API read-only]
  end

  BR --> WEB
  SV --> WEB
  AUTH --> PG
  API --> PG
  AUTH -.-> LDAP
  API -.-> CORE
```

---

## 2. Component responsibilities

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| UI | React 19 + Tailwind | Branch / supervisor screens per wireframes |
| App server | Next.js 15 | SSR, routing, API route handlers |
| Auth | HTTP-only session cookie + bcrypt | Login, logout, role checks |
| RBAC | `src/lib/rbac.ts` | Permission matrix enforced per request |
| ORM | Prisma 5 | Schema, migrations, type-safe queries |
| Database | Neon PostgreSQL | Primary datastore (SSL required) |
| Audit | `src/lib/audit.ts` | Append-only compliance log |

---

## 3. Deployment topology

```mermaid
flowchart LR
  subgraph dev [Development]
    D1[localhost:3000]
    D2[Neon dev branch DB]
    D1 --> D2
  end

  subgraph staging [Staging - DX Valley]
    S1[Vercel / VM staging URL]
    S2[Neon staging DB or branch]
    S1 --> S2
  end

  subgraph prod [Production - future]
    P1[Bank-approved host]
    P2[Neon prod or on-prem PG]
    P1 --> P2
  end

  dev --> staging --> prod
```

| Environment | URL pattern | Database |
|-------------|-------------|----------|
| Local | `http://localhost:3000` | Neon dev (`.env`) |
| Staging | `https://maatiilink-staging.*` (set when deployed) | Separate Neon project/branch |
| Production | Bank IT assigned | Isolated DB, no dev credentials |

---

## 4. Request flow (authenticated API)

```mermaid
sequenceDiagram
  participant B as Browser
  participant M as Next.js middleware
  participant A as API route
  participant R as rbac.ts
  participant P as Prisma
  participant D as PostgreSQL

  B->>M: POST /api/eod
  M->>M: Validate session cookie
  M->>A: Forward with user context
  A->>R: requirePermission(role, eod:submit)
  R-->>A: OK / Forbidden
  A->>P: prisma.eodReport.create
  P->>D: INSERT
  A->>P: auditLog.create
  A-->>B: 201 JSON
```

---

## 5. Security boundaries

- Browser never stores passwords after login (session only).
- No customer PII or ledger writes in v1.
- All `/api/*` except health + login require session (see `PUBLIC_API_PATHS` in `rbac.ts`).
- Prisma parameterized queries only (no raw SQL in MVP).

---

## 6. Code map

```
src/
  app/              # Pages + API routes
  lib/
    prisma.ts       # DB client singleton
    rbac.ts         # Permissions (Phase 2)
    audit.ts        # Audit writer
    auth/           # Session helpers (Sprint 1)
middleware.ts       # Route protection (Sprint 1)
prisma/
  schema.prisma     # Source of truth
  migrations/       # Versioned SQL
```

---

## 7. Gate G2 — Team approval

| Item | Status |
|------|--------|
| Architecture reviewed by SABA CODERS | Approved May 2026 |
| Staging plan documented | `STAGING.md` |
| CI pipeline | `.github/workflows/ci.yml` |
