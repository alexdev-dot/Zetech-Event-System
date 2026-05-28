-- ============================================================
-- Run this ONE TIME in your Supabase SQL editor:
-- https://supabase.com/dashboard → SQL Editor → New Query
-- ============================================================

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

  -- Queries that return rows (SELECT, WITH, or any DML with RETURNING)
  IF first_kw IN ('SELECT', 'WITH') OR query_text ~* '\yRETURNING\y' THEN
    BEGIN
      EXECUTE format(
        'SELECT COALESCE(to_jsonb(array_agg(row_to_json(t))), ''[]''::jsonb) FROM (%s) t',
        query_text
      ) INTO result;
      RETURN COALESCE(result, '[]'::jsonb);
    EXCEPTION WHEN OTHERS THEN
      RAISE;
    END;
  ELSE
    -- DDL (CREATE TABLE, ALTER TABLE, CREATE INDEX, CREATE FUNCTION, etc.)
    -- and DML without RETURNING (INSERT/UPDATE/DELETE)
    EXECUTE query_text;
    RETURN '[]'::jsonb;
  END IF;
END;
$$;
