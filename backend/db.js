/**
 * db.js — Supabase client wrapper
 *
 * Uses `@supabase/supabase-js` and reads `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from environment.
 */

import { createClient } from "@supabase/supabase-js";

let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export const pool = supabase;

/** Throw an error if the DB can't be reached. */
export async function testConnection() {
  if (supabase) {
    const { error } = await supabase.from("admins").select("id").limit(1);
    if (error) {
      throw error;
    }
    return;
  }

  throw new Error("No SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY configured in environment");
}
