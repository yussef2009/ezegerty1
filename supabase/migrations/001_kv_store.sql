-- Ezegerty key-value store (run in Supabase SQL Editor)
-- Dashboard: https://supabase.com/dashboard/project/pezhnoaegqjbbyfqwavy/sql/new

CREATE TABLE IF NOT EXISTS public.kv_store_97c3633e (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

ALTER TABLE public.kv_store_97c3633e ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kv_store_97c3633e TO anon, authenticated;

DROP POLICY IF EXISTS "kv_store_anon_select" ON public.kv_store_97c3633e;
DROP POLICY IF EXISTS "kv_store_anon_insert" ON public.kv_store_97c3633e;
DROP POLICY IF EXISTS "kv_store_anon_update" ON public.kv_store_97c3633e;
DROP POLICY IF EXISTS "kv_store_anon_delete" ON public.kv_store_97c3633e;
DROP POLICY IF EXISTS "kv_store_auth_select" ON public.kv_store_97c3633e;
DROP POLICY IF EXISTS "kv_store_auth_insert" ON public.kv_store_97c3633e;
DROP POLICY IF EXISTS "kv_store_auth_update" ON public.kv_store_97c3633e;
DROP POLICY IF EXISTS "kv_store_auth_delete" ON public.kv_store_97c3633e;

CREATE POLICY "kv_store_anon_select" ON public.kv_store_97c3633e
  FOR SELECT TO anon USING (true);
CREATE POLICY "kv_store_anon_insert" ON public.kv_store_97c3633e
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "kv_store_anon_update" ON public.kv_store_97c3633e
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "kv_store_anon_delete" ON public.kv_store_97c3633e
  FOR DELETE TO anon USING (true);

CREATE POLICY "kv_store_auth_select" ON public.kv_store_97c3633e
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "kv_store_auth_insert" ON public.kv_store_97c3633e
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "kv_store_auth_update" ON public.kv_store_97c3633e
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "kv_store_auth_delete" ON public.kv_store_97c3633e
  FOR DELETE TO authenticated USING (true);
