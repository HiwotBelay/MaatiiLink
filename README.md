# MaatiiLink

**Branch-to-Head Office Operations Bridge** — internal platform for Cooperative Bank of Oromia.

Built by **SABA CODERS** at COOP DX Valley.

**Repository:** [github.com/HiwotBelay/MaatiiLink](https://github.com/HiwotBelay/MaatiiLink)

## Status

Phase 0 — Foundation (do not skip Gate G0 before full product build).

## Local development

```bash
npm install
cp .env.example .env
# Edit .env — Neon DATABASE_URL (already set locally for Hiwot)

npx prisma migrate dev    # first time: create tables on Neon
npm run db:seed           # dev users + sample branches

npm run dev               # http://localhost:3000
```

- Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- Prisma Studio: `npm run db:studio`

**Database:** Neon PostgreSQL (see `docs/DATABASE.md`). Optional local Postgres: `docker compose up -d`.

## Branches

- `main` — production-ready only
- `develop` — integration branch
- Feature branches: `feature/<module>-<short-description>`

## Docs

- `docs/PROBLEM_STATEMENT.md` — scope for bank mentor sign-off (Gate G0)
- `docs/RISK_REGISTER.md` — living risk log

## Modules (build order)

1. Auth + RBAC + Audit log  
2. Digital EOD Report  
3. Incidents  
4. HO Directives  
5. Internal Service Desk  
6. Supervisor Dashboard  
7. Admin & exports  
