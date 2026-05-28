-- ============================================================
-- Run this in your Supabase SQL editor (safe to re-run):
-- https://supabase.com/dashboard → SQL Editor → New Query
-- ============================================================

-- Fixed version: uses CTE wrap for DML+RETURNING so PostgreSQL
-- doesn't reject INSERT/UPDATE/DELETE in a FROM subquery position.

CREATE OR REPLACE FUNCTION exec_sql(query_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result   jsonb;
  first_kw text;
BEGIN
  first_kw := upper(split_part(trim(query_text), ' ', 1));

  IF first_kw = 'SELECT' OR first_kw = 'WITH' THEN
    -- Pure read queries — safe to wrap as a subquery
    EXECUTE format(
      'SELECT COALESCE(to_jsonb(array_agg(row_to_json(t))), ''[]''::jsonb) FROM (%s) t',
      query_text
    ) INTO result;
    RETURN COALESCE(result, '[]'::jsonb);

  ELSIF query_text ~* '\yRETURNING\y' THEN
    -- DML (INSERT/UPDATE/DELETE) with RETURNING clause.
    -- PostgreSQL does NOT allow DML in a FROM subquery, so wrap as a CTE instead.
    EXECUTE format(
      'WITH _cte AS (%s) SELECT COALESCE(to_jsonb(array_agg(row_to_json(t))), ''[]''::jsonb) FROM _cte t',
      query_text
    ) INTO result;
    RETURN COALESCE(result, '[]'::jsonb);

  ELSE
    -- DDL (CREATE TABLE, ALTER TABLE, CREATE INDEX, CREATE FUNCTION, etc.)
    -- and DML without RETURNING
    EXECUTE query_text;
    RETURN '[]'::jsonb;
  END IF;
END;
$$;
