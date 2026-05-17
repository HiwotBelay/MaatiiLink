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

| Email | Role | Lands on |
|-------|------|----------|
| admin@maatiilink.local | HO_ADMIN | /supervisor |
| manager@maatiilink.local | BRANCH_MANAGER | /dashboard |
| supervisor@maatiilink.local | SUPERVISOR | /supervisor |

Password for all: `ChangeMe123!` (see `prisma/seed.ts` — change before pilot)

## Sprint 1 (auth) — done

- `/login` — sign in
- Session cookie (HTTP-only, 8h)
- `/dashboard` — branch roles
- `/supervisor` — supervisor / HO / auditor
- `/api/auth/login`, `/logout`, `/me`
- Audit log on LOGIN / LOGOUT
