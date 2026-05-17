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

## Staging (Phase 2 — G2)

- App: https://maatii-link.vercel.app  
- Health: https://maatii-link.vercel.app/api/health  
- Login: https://maatii-link.vercel.app/login  

Same dev test users as local (after seed on staging DB). See `docs/phase2/STAGING.md`.

## Dev test users (after seed)

| Email | Role | Lands on |
|-------|------|----------|
| admin@maatiilink.local | HO_ADMIN | /supervisor |
| manager@maatiilink.local | BRANCH_MANAGER | /dashboard |
| supervisor@maatiilink.local | SUPERVISOR | /supervisor |
| auditor@maatiilink.local | AUDITOR | /supervisor (read-only) |
| manager2@maatiilink.local | BRANCH_MANAGER | /dashboard (Merkato branch) |

Password for all: `ChangeMe123!` (see `prisma/seed.ts` — change before pilot)

## Sprint 1 (auth) — done

- `/login` — sign in
- Session cookie (HTTP-only, 8h)
- `/dashboard` — branch roles
- `/supervisor` — supervisor / HO / auditor
- `/api/auth/login`, `/logout`, `/me`
- Audit log on LOGIN / LOGOUT

## Sprint 2 (EOD) — done

**Branch users** (`manager@maatiilink.local`, `staff@maatiilink.local`):

- `/dashboard` — EOD status card links to `/eod`
- `/eod` — draft, save, submit (manager only for submit)
- Cash bands, complaint count, anomaly / staffing notes
- 30-day history on the same page
- Cutoff uses Addis Ababa local date (18:00 EAT)

**Supervisor / HO** (`supervisor@maatiilink.local`, `admin@maatiilink.local`):

- `/supervisor` — all branches EOD status for today
- Lock submitted EODs from the table

**APIs** (session required):

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/eod` | List reports (branch or all) |
| POST | `/api/eod` | Create/update draft |
| GET | `/api/eod/[id]` | Single report |
| POST | `/api/eod/[id]/submit` | Submit draft |
| POST | `/api/eod/[id]/lock` | Supervisor lock |

EOD lifecycle: `DRAFT` → `SUBMITTED` → `LOCKED`

## Sprint 3 (incidents & directives) — done

**Branch users** (`manager@maatiilink.local`):

- `/incidents` — report and update incidents for your branch
- `/directives` — read HO circulars and acknowledge on behalf of branch

**HO admin** (`admin@maatiilink.local`):

- `/directives/new` — publish directives
- `/incidents` — view all branches

**Supervisor** (`supervisor@maatiilink.local`):

- `/supervisor` — EOD + open incidents + overdue directive acks per branch
- Critical incident banner when any CRITICAL is open
- `/incidents` — network-wide list

**Email** (optional): set `SMTP_*` and `SUPERVISOR_NOTIFY_EMAIL` in `.env` (see `.env.example`)

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/incidents` | List / create |
| PATCH | `/api/incidents/[id]` | Update status |
| GET/POST | `/api/directives` | List / publish |
| POST | `/api/directives/[id]/acknowledge` | Branch ack |
