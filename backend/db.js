/**
 * db.js — Supabase via HTTPS (RPC)
 *
 * Replit blocks outbound TCP on ports 5432 and 6543, so a direct pg connection
 * to Supabase is not possible. Instead, all queries route through an `exec_sql`
 * PostgreSQL function exposed over HTTPS via Supabase's RPC endpoint.
 *
 * Setup (one-time, in your Supabase SQL editor):
 *   See the SQL snippet shown in the terminal or in backend/setup_exec_sql.sql
 */

import { createClient } from "@supabase/supabase-js";
import ws from "ws";

// ─── Supabase admin client (service role — bypasses RLS) ─────────────────────
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { realtime: { transport: ws } }
);

// ─── Safe param interpolation ─────────────────────────────────────────────────
// Replaces $1, $2 … placeholders with literal SQL values.
// Values always originate from server-side validated code — never raw user input.
function escapeValue(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (Array.isArray(val)) {
    return `ARRAY[${val.map(escapeValue).join(",")}]`;
  }
  return `'${String(val).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

function buildSql(sql, params) {
  if (!params || params.length === 0) return sql;
  return sql.replace(/\$(\d+)/g, (_, n) => escapeValue(params[parseInt(n, 10) - 1]));
}

// ─── SQL statement splitter ───────────────────────────────────────────────────
// Splits on semicolons but treats the whole string as one statement when it
// contains $$ (function/trigger bodies with internal semicolons).
function splitStatements(sql) {
  const stripped = sql.replace(/--[^\n]*/g, "").trim();
  if (stripped.includes("$$")) return stripped ? [stripped] : [];
  return stripped.split(";").map((s) => s.trim()).filter(Boolean);
}

// ─── Error normalisation ──────────────────────────────────────────────────────
function mapError(err) {
  const msg = err?.message || String(err);
  const e = new Error(msg);
  if (msg.includes("duplicate key") || msg.includes("23505")) e.code = "23505";
  else if (msg.includes("foreign key") || msg.includes("23503")) e.code = "23503";
  else e.code = err?.code;
  return e;
}

// ─── pg-compatible pool shim ──────────────────────────────────────────────────
// Exposes pool.query(sql, params?) and pool.connect() just like node-postgres.
export const pool = {
  async query(sql, params) {
    const built = buildSql(sql, params);
    const statements = splitStatements(built);
    let lastResult = { rows: [], rowCount: 0 };

    for (const stmt of statements) {
      const { data, error } = await supabaseAdmin.rpc("exec_sql", {
        query_text: stmt,
      });
      if (error) throw mapError(error);
      const rows = Array.isArray(data) ? data : [];
      lastResult = { rows, rowCount: rows.length };
    }

    return lastResult;
  },

  async connect() {
    return {
      query: (sql, params) => pool.query(sql, params),
      release: () => {},
    };
  },
};

// ─── Connection health check ──────────────────────────────────────────────────
export async function testConnection() {
  const { error } = await supabaseAdmin.rpc("exec_sql", {
    query_text: "SELECT 1",
  });
  if (error) throw new Error("exec_sql not found — run setup_exec_sql.sql in Supabase: " + error.message);
}
