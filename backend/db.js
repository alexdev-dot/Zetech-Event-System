/**
 * db.js — Supabase JavaScript client
 *
 * Uses @supabase/supabase-js which talks to Supabase PostgREST over HTTPS.
 * No custom run_sql function needed.
 * Passes the `ws` package for WebSocket support on Node.js < 22.
 */

import { createClient } from "@supabase/supabase-js";
import ws from "ws";

if (!process.env.SUPABASE_URL)      throw new Error("SUPABASE_URL is not set");
if (!process.env.SUPABASE_ANON_KEY) throw new Error("SUPABASE_ANON_KEY is not set");

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth:     { persistSession: false },
    realtime: { transport: ws },
  }
);

/** Throw an error if the DB can't be reached. */
export async function testConnection() {
  const { error } = await supabase.from("admins").select("id").limit(1);
  if (error) throw new Error(error.message);
}
