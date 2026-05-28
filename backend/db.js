/**
 * db.js — PostgreSQL connection to Supabase
 *
 * Uses the `pg` driver with the Supabase connection string (DATABASE_URL).
 * This keeps all pool.query() calls in server.js working unchanged.
 *
 * Also exports a supabaseAdmin client (using the service role key) for any
 * Supabase-specific features like storage or auth helpers.
 */

import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const { Pool } = pg;

// ─── pg Pool (raw SQL via Supabase Postgres) ──────────────────────────────────
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ─── Supabase Admin Client (service role — bypasses RLS) ─────────────────────
export const supabaseAdmin =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          realtime: { transport: ws },
        }
      )
    : null;

/** Verify the database connection is reachable. */
export async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}
