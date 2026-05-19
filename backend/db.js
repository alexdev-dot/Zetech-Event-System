/**
 * db.js — Supabase REST API query layer
 *
 * Exposes pool.query(sql, params) using Supabase's PostgREST REST API.
 * All credentials stay on the server — no secrets ever reach the browser.
 *
 * Uses a named Postgres function `run_sql(query text, params text[])`
 * stored in Supabase to execute arbitrary parameterised SQL via RPC.
 * See schema.sql for the function definition.
 */

if (!process.env.SUPABASE_URL) throw new Error("SUPABASE_URL is not set");
if (!process.env.SUPABASE_ANON_KEY) throw new Error("SUPABASE_ANON_KEY is not set");

const BASE = process.env.SUPABASE_URL;
const KEY  = process.env.SUPABASE_ANON_KEY;

const headers = {
  "Content-Type": "application/json",
  "apikey": KEY,
  "Authorization": `Bearer ${KEY}`,
};

async function rpc(fn, body) {
  const res = await fetch(`${BASE}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try { msg = JSON.parse(text)?.message || JSON.parse(text)?.hint || text; } catch {}
    throw new Error(`Supabase RPC ${fn} error (${res.status}): ${msg}`);
  }
  try { return JSON.parse(text); } catch { return text; }
}

/**
 * Execute a parameterised SQL query via the run_sql RPC function.
 * Returns { rows, rowCount } — same interface as the pg driver.
 */
export const pool = {
  async query(sql, params = []) {
    const safeParams = params.map((p) =>
      p === null || p === undefined ? null : String(p)
    );
    const data = await rpc("run_sql", { query: sql, params: safeParams });
    const rows = Array.isArray(data) ? data : (data?.rows ?? []);
    return { rows, rowCount: rows.length };
  },
};

export async function testConnection() {
  await pool.query("SELECT 1 AS ok");
}
