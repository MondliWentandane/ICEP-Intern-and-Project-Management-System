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

const createClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"],
  });

// Reuse one client across hot reloads (tsx watch / nodemon) so we don't exhaust DB connections.
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

export const prisma = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Call on shutdown (SIGINT/SIGTERM) and in scripts such as the seed. */
export const disconnectPrisma = () => prisma.$disconnect();

export default prisma;
