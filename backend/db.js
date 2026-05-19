import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL) throw new Error("SUPABASE_URL is not set");
if (!process.env.SUPABASE_ANON_KEY) throw new Error("SUPABASE_ANON_KEY is not set");

// Backend-only Supabase client — credentials never leave this process.
// Uses the anon key with RLS disabled on all tables (our Express API owns auth/authz).
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

/**
 * pool.query(sql, params) shim — translates $1/$2 params into Supabase rpc call.
 * We expose a named RPC function `run_query` in Supabase that executes arbitrary SQL.
 * For simple cases this delegates to supabase.rpc; the real implementation uses
 * a raw SQL approach via the Supabase postgres connection.
 */

// We use a thin wrapper that maps pg-style queries to supabase.rpc("run_query", ...)
// This requires the run_query function to exist in Supabase (see schema.sql).
export const pool = {
  async query(sql, params = []) {
    const { data, error } = await supabase.rpc("run_query", {
      sql_query: sql,
      sql_params: params.map((p) => (p === null || p === undefined ? null : String(p))),
    });
    if (error) throw new Error(`DB error: ${error.message} | SQL: ${sql.slice(0, 100)}`);
    return { rows: Array.isArray(data) ? data : [], rowCount: Array.isArray(data) ? data.length : 0 };
  },
};

export async function testConnection() {
  const { error } = await supabase.rpc("run_query", {
    sql_query: "SELECT 1 AS ok",
    sql_params: [],
  });
  if (error) throw new Error(error.message);
}
