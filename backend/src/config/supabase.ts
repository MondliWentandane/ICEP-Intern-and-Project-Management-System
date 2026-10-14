import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client — used ONLY for Storage (CV / document uploads).
 * The database is accessed through Prisma (src/config/prisma.ts), not through this client.
 *
 * Uses the SERVICE ROLE key, which bypasses Row Level Security. Never send it to the
 * frontend and never prefix it with NEXT_PUBLIC_.
 */
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
}

export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Bucket that holds Document.fileUrl objects (see the Document model in schema.prisma). */
export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "documents";

export default supabase;
