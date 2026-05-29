---
name: Supabase exec_sql aggregation bug
description: JSON_AGG with FILTER inside the exec_sql RPC wrapper silently returns [] — workaround pattern.
---

## Rule
Never use `JSON_AGG ... FILTER (WHERE ...)` inside the `exec_sql` Supabase RPC wrapper. It silently returns `[]` instead of the real aggregated rows.

**Why:** The `exec_sql` function wraps queries in a way that causes aggregation filters to behave incorrectly — the result is an empty JSON array with no error, making the bug hard to detect.

**How to apply:** Any time you need to return a parent with nested children (e.g. categories + subcategories), always:
1. Run two simple `SELECT` queries in parallel (`Promise.all`)
2. Join them in JavaScript using `.filter()` on the foreign key

Example pattern used in `/api/categories` and `/api/admin/categories`:
```js
const [catsRes, subsRes] = await Promise.all([
  pool.query(`SELECT id, name, display_order FROM event_categories ORDER BY display_order, id`),
  pool.query(`SELECT id, category_id, name, display_order FROM event_subcategories ORDER BY display_order, id`),
]);
const cats = catsRes.rows.map((c) => ({
  ...c,
  subcategories: subsRes.rows.filter((s) => Number(s.category_id) === Number(c.id)),
}));
```
