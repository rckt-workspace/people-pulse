ALTER TABLE public.development_goals
  ADD COLUMN IF NOT EXISTS actions text,
  ADD COLUMN IF NOT EXISTS related_indicators text,
  ADD COLUMN IF NOT EXISTS related_courses text,
  ADD COLUMN IF NOT EXISTS responsible text,
  ADD COLUMN IF NOT EXISTS target_date date,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.development_goals TO anon, authenticated;
GRANT ALL ON public.development_goals TO service_role;

DROP POLICY IF EXISTS "write development_goals" ON public.development_goals;
DROP POLICY IF EXISTS "update development_goals" ON public.development_goals;
DROP POLICY IF EXISTS "delete development_goals" ON public.development_goals;
CREATE POLICY "write development_goals" ON public.development_goals FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update development_goals" ON public.development_goals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete development_goals" ON public.development_goals FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.development_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text,
  rationale text,
  evidence text,
  current_state text,
  target_state text,
  suggested_actions text,
  status text NOT NULL DEFAULT 'pendiente',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.development_suggestions TO anon, authenticated;
GRANT ALL ON public.development_suggestions TO service_role;
ALTER TABLE public.development_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read development_suggestions" ON public.development_suggestions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "write development_suggestions" ON public.development_suggestions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update development_suggestions" ON public.development_suggestions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete development_suggestions" ON public.development_suggestions FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.development_index_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period_month date NOT NULL,
  total_score integer NOT NULL,
  performance_score numeric,
  commitments_score numeric,
  competencies_score numeric,
  training_score numeric,
  goals_score numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, period_month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.development_index_history TO anon, authenticated;
GRANT ALL ON public.development_index_history TO service_role;
ALTER TABLE public.development_index_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read development_index_history" ON public.development_index_history FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "write development_index_history" ON public.development_index_history FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update development_index_history" ON public.development_index_history FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read app_settings" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "write app_settings" ON public.app_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update app_settings" ON public.app_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.app_settings (key, value) VALUES
  ('development_index_weights', '{"performance":30,"commitments":20,"competencies":20,"training":15,"goals":15}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TRIGGER development_goals_updated_at
BEFORE UPDATE ON public.development_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();