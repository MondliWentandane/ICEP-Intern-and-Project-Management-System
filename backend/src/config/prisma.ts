import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

/**
 * Single shared Prisma client (import this everywhere — never `new PrismaClient()` elsewhere).
 *
 * Supabase connection strings (see .env.example):
 *   DATABASE_URL -> pooled connection (port 6543, ?pgbouncer=true) — used at runtime here
 *   DIRECT_URL   -> direct/session connection (port 5432)        — used by prisma migrate (prisma.config.ts)
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
export default prisma;
