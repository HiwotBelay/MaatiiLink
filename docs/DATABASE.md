# Database — Neon PostgreSQL

MaatiiLink uses **[Neon](https://neon.tech)** for PostgreSQL in development (and later staging).

## Connection

1. Each developer copies `.env.example` to `.env`
2. **Local dev:** paste the **direct** connection string (no `-pooler` in hostname) into both `DATABASE_URL` and `DIRECT_URL` in `.env`
3. **Vercel:** use **pooled** for `DATABASE_URL` (`?sslmode=require&pgbouncer=true&connection_limit=1`) and **direct** for `DIRECT_URL`
4. Always include `sslmode=require` for Neon

## Team access

- Share the Neon project invite from the dashboard (do not paste passwords in WhatsApp/Telegram)
- Use **branch databases** in Neon for preview environments if needed later

## Prisma (Phase 2)

When the app is scaffolded:

```bash
npx prisma migrate dev
npx prisma db push   # only if mentor approves for early prototypes
```

## Security

- Never commit `.env`
- Rotate credentials if they were exposed in chat, screenshots, or public repos
- For bank pilot/production, prefer bank-approved hosting; Neon is fine for DX Valley dev
