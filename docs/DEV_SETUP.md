# Developer setup — SABA CODERS

## 1. Clone

```bash
git clone https://github.com/HiwotBelay/MaatiiLink.git
cd MaatiiLink
git checkout develop
```

## 2. Environment

```bash
npm install
cp .env.example .env
```

Add your Neon **pooled** `DATABASE_URL` and a random `SESSION_SECRET`.

## 3. Database

```bash
npx prisma migrate dev
npm run db:seed
```

## 4. Run

```bash
npm run dev
```

- App: http://localhost:3000  
- Health: http://localhost:3000/api/health  

## Dev test users (after seed)

| Email | Role |
|-------|------|
| admin@maatiilink.local | HO_ADMIN |
| manager@maatiilink.local | BRANCH_MANAGER |
| supervisor@maatiilink.local | SUPERVISOR |

Password for all dev seeds: see `prisma/seed.ts` (change before any pilot).

## Sprint 1 next

- Login page + session
- Role-based route protection
- Audit log on auth events
