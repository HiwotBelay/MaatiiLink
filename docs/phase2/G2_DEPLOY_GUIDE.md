# Gate G2 — Staging deploy walkthrough

**Team:** SABA CODERS | **Time:** ~45 minutes | **Stack:** Vercel + Neon

Follow these steps in order. Do **not** use your personal dev `DATABASE_URL` for staging.

---

## Before you start

- [ ] Code pushed to GitHub (`develop` branch has latest Phase 2 + Sprint 1–2)
- [ ] Neon account access (same project as dev is fine)
- [ ] Vercel account (free tier is OK for internship staging)
- [ ] GitHub repo: https://github.com/HiwotBelay/MaatiiLink

---

## Step 1 — Neon staging database (10 min)

1. Open [Neon Console](https://console.neon.tech) → your MaatiiLink project.
2. **Branches** → **Create branch**
   - Name: `staging`
   - Parent: `main` (or your primary branch)
3. Open the new **`staging`** branch → **Connection details**.
4. Copy the **pooled** connection string (host contains `-pooler`).
   - Format: `postgresql://USER:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
5. Save it somewhere safe (password manager). This is **staging only** — not your local `.env`.

> **Why a branch?** Isolated data from dev; same schema via migrations; easy to reset by recreating the branch.

---

## Step 2 — Run migrations + seed on staging (5 min)

On your PC, in the project folder (`maatiilink`):

### PowerShell (Windows)

```powershell
cd "c:\Users\HP\Desktop\coop intern\maatiilink"

# Paste your Neon STAGING pooled URL (not dev):
$env:DATABASE_URL = "postgresql://USER:PASSWORD@ep-xxx-pooler....neon.tech/neondb?sslmode=require"

npx prisma migrate deploy
npm run db:seed
```

Or use the helper script:

```powershell
$env:DATABASE_URL = "YOUR_STAGING_POOLED_URL"
.\scripts\staging-db-setup.ps1
```

**Success looks like:** `All migrations have been applied` and seed logs for branches/users.

**Verify in Neon:** SQL Editor → `SELECT COUNT(*) FROM "User";` → should be > 0.

---

## Step 3 — Generate `SESSION_SECRET` (1 min)

PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Copy the output. Use **only** for staging (not the same as local `.env`).

---

## Step 4 — Deploy to Vercel (15 min)

### 4a. Import project

1. [vercel.com/new](https://vercel.com/new) → **Import** `HiwotBelay/MaatiiLink`
2. Framework: **Next.js** (auto-detected)
3. Root directory: `./` (default)
4. **Do not deploy yet** — open **Environment Variables** first.

### 4b. Environment variables

Add for **Production** (and **Preview** if you use PR previews):

| Name | Value |
|------|--------|
| `DATABASE_URL` | Staging **pooled** Neon URL (Step 1) |
| `SESSION_SECRET` | Output from Step 3 (32+ chars) |
| `NODE_ENV` | `production` |

Optional (recommended for correct redirects):

| Name | Value |
|------|--------|
| `APP_URL` | Your Vercel URL after first deploy (e.g. `https://maatiilink.vercel.app`) |

### 4c. Production branch = `develop` (stable staging URL)

1. Vercel project → **Settings** → **Git**
2. **Production Branch** → set to **`develop`**
3. Save

This project is **staging only**; bank production would be a separate project later.

### 4d. Deploy

1. Click **Deploy** (or push to `develop` to trigger deploy).
2. Wait for build to finish (uses `prisma generate` + `next build` from `package.json`).
3. Copy the URL, e.g. `https://maatiilink-abc123.vercel.app`

If build fails, open **Build logs** — common fixes:
- Missing `DATABASE_URL` or `SESSION_SECRET`
- Invalid Neon URL (use **pooled** string)

---

## Step 5 — Smoke test (2 min)

Replace `YOUR_URL` with your Vercel URL.

**Browser**

- `https://YOUR_URL/api/health` → JSON with `"ok": true`, `"database": "connected"`
- `https://YOUR_URL/login` → login page loads

**PowerShell**

```powershell
Invoke-RestMethod "https://YOUR_URL/api/health"
```

**Login test**

| Email | Password |
|-------|----------|
| `manager@maatiilink.local` | `ChangeMe123!` |

After login → dashboard and `/eod` should work.

---

## Step 6 — Update repo docs (5 min)

1. Edit `docs/phase2/STAGING.md` — fill **Gate G2** table:
   - Staging URL
   - Date
   - Deployed by (your name)
2. Edit `docs/phase2/PHASE2_CHECKLIST.md` — check **Staging URL live**
3. Commit and push (team policy: you push manually).

---

## Step 7 — Mentor / IT sign-off (G2)

Use the ready-made pack: **`G2_MENTOR_SUBMISSION.md`**

Send to your COOP DX Valley IT/security mentor:

- Link to staging URL
- `ARCHITECTURE.md`
- `THREAT_MODEL.md`
- `RBAC_PLAN.md`
- `BACKUP_POLICY.md`

Ask them to reply **“G2 approved”** (or list changes). Record approval in `STAGING.md`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Health `database: disconnected` | Wrong `DATABASE_URL` on Vercel; redeploy after fixing env |
| Health `ok` but login fails | Run `migrate deploy` + `db:seed` on staging DB (Step 2) |
| Login shows "Network error" or 500 | **`SESSION_SECRET` missing or shorter than 32 chars** on Vercel — add env, redeploy. Check `/api/health`: `auth` should be `configured` |
| 500 on login | Check Vercel **Functions** logs; confirm `SESSION_SECRET` is set (32+ characters) |
| Build OK, empty DB | Seed not run against **staging** URL |
| SSL errors | URL must include `?sslmode=require` |

---

## After G2 is approved

Phase 2 is **closed**. Continue **Sprint 3** (incidents & directives) on the same staging URL for UAT.
