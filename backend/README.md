# ICEP Backend — Prisma setup

Stack: Node + TypeScript, Express 5, Prisma 7 (`prisma-client` generator + `@prisma/adapter-pg`), Supabase PostgreSQL.

## First-time setup

```bash
cd backend
npm install                 # also runs `prisma generate` (postinstall)
cp .env.example .env        # then fill in DATABASE_URL, DIRECT_URL, JWT_SECRET ...
npm run prisma:validate     # check schema.prisma
npm run prisma:migrate -- --name init   # create tables + first migration
npm run prisma:seed         # departments, campuses, intake, skills, email templates, admin user
npm run typecheck           # should print nothing
```

## Daily commands

| Command | What it does |
|---|---|
| `npm run prisma:generate` | Regenerate client into `src/generated/prisma` (run after every schema change) |
| `npm run prisma:migrate -- --name <name>` | Create + apply a dev migration |
| `npm run prisma:deploy` | Apply migrations in production/CI |
| `npm run prisma:studio` | Browse data in the browser |
| `npm run prisma:seed` | Idempotent seed |
| `npm run prisma:reset` | Drop + recreate DB and reseed (dev only!) |
| `npm run prisma:format` | Format schema |

## Notes
- `DATABASE_URL` (port 6543, pooled) is used by the app; `DIRECT_URL` (port 5432) is used by migrations.
- `src/generated/` is git-ignored — teammates get it from `npm install` / `npm run prisma:generate`.
- Always `import { prisma } from "../config/prisma"`; never create another `PrismaClient`.
- Never commit `.env`.
