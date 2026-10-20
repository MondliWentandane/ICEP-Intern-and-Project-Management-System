import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ WARNING: SUPABASE_URL or SUPABASE_ANON_KEY is missing from the .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);