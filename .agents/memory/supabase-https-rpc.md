---
name: Supabase via HTTPS RPC
description: How the backend connects to Supabase when direct TCP is blocked by Replit
---

## Rule
All database queries route through a `exec_sql(query_text text)` PostgreSQL function in Supabase, called via `supabaseAdmin.rpc('exec_sql', { query_text })` over HTTPS (port 443).

**Why:** Replit blocks outbound TCP on ports 5432 (direct pg) and 6543 (Supabase pooler). HTTPS (port 443) is always open.

**How to apply:**
- `backend/db.js` exports a `pool` shim with `.query(sql, params)` and `.connect()` that match the node-postgres API.
- Params are substituted via `buildSql()` — `$1`, `$2` etc. replaced with escaped literals.
- `splitStatements()` splits on `;` unless the SQL contains `$$` (function bodies), in which case the whole string is one statement.
- The `exec_sql` SQL function lives in Supabase — defined in `backend/setup_exec_sql.sql`. Must be created once in Supabase SQL editor before the backend starts.
- `exec_sql` wraps SELECT/WITH/RETURNING queries in `SELECT json_agg(row_to_json(t)) FROM (...) t`; DDL/DML without RETURNING is executed directly.
