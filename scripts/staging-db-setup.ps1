# Run migrations + seed against STAGING Neon (not local dev).
# Usage:
#   $env:DATABASE_URL = "postgresql://...-pooler....neon.tech/neondb?sslmode=require"
#   .\scripts\staging-db-setup.ps1

$ErrorActionPreference = "Stop"

if (-not $env:DATABASE_URL) {
  Write-Host "ERROR: Set DATABASE_URL to your Neon STAGING pooled URL first." -ForegroundColor Red
  Write-Host '  $env:DATABASE_URL = "postgresql://..."'
  exit 1
}

if ($env:DATABASE_URL -match "localhost") {
  Write-Host "WARNING: DATABASE_URL looks like localhost. Use Neon staging branch URL." -ForegroundColor Yellow
  $confirm = Read-Host "Continue anyway? (y/N)"
  if ($confirm -ne "y") { exit 1 }
}

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "Applying Prisma migrations to staging..." -ForegroundColor Cyan
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Seeding staging database (dev users + sample branches)..." -ForegroundColor Cyan
npm run db:seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Done. Verify: npx prisma studio (optional) or deploy Vercel and hit /api/health" -ForegroundColor Green
