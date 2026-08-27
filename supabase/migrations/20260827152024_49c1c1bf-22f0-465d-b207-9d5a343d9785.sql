-- 1. Evaluation period format: month range + year
UPDATE public.employees SET evaluation_period = 'Julio - Agosto 2026' WHERE evaluation_period ILIKE 'Q%';

-- 2. Sessions: draft/completed lifecycle
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS current_step integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS facilitator text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS sessions_updated_at ON public.sessions;
CREATE TRIGGER sessions_updated_at BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO anon, authenticated;
GRANT ALL ON public.sessions TO service_role;
DROP POLICY IF EXISTS "write sessions" ON public.sessions;
CREATE POLICY "write sessions" ON public.sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update sessions" ON public.sessions;
CREATE POLICY "update sessions" ON public.sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete sessions" ON public.sessions;
CREATE POLICY "delete sessions" ON public.sessions FOR DELETE TO anon, authenticated USING (true);

-- 3. Indicators: direction
ALTER TABLE public.indicators
  ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'higher_is_better';

-- 4. Writable access for existing operational tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.indicator_results TO anon, authenticated;
GRANT ALL ON public.indicator_results TO service_role;
CREATE POLICY "write indicator_results" ON public.indicator_results FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update indicator_results" ON public.indicator_results FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete indicator_results" ON public.indicator_results FOR DELETE TO anon, authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wellbeing_responses TO anon, authenticated;
GRANT ALL ON public.wellbeing_responses TO service_role;
CREATE POLICY "write wellbeing" ON public.wellbeing_responses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update wellbeing" ON public.wellbeing_responses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete wellbeing" ON public.wellbeing_responses FOR DELETE TO anon, authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blockers TO anon, authenticated;
GRANT ALL ON public.blockers TO service_role;
CREATE POLICY "write blockers" ON public.blockers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update blockers" ON public.blockers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete blockers" ON public.blockers FOR DELETE TO anon, authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.commitments TO anon, authenticated;
GRANT ALL ON public.commitments TO service_role;
CREATE POLICY "write commitments" ON public.commitments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update commitments" ON public.commitments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete commitments" ON public.commitments FOR DELETE TO anon, authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO anon, authenticated;
GRANT ALL ON public.courses TO service_role;
CREATE POLICY "write courses" ON public.courses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update courses" ON public.courses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete courses" ON public.courses FOR DELETE TO anon, authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.development_goals TO anon, authenticated;
GRANT ALL ON public.development_goals TO service_role;
CREATE POLICY "write development_goals" ON public.development_goals FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update development_goals" ON public.development_goals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete development_goals" ON public.development_goals FOR DELETE TO anon, authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.competencies TO anon, authenticated;
GRANT ALL ON public.competencies TO service_role;
CREATE POLICY "write competencies" ON public.competencies FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update competencies" ON public.competencies FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete competencies" ON public.competencies FOR DELETE TO anon, authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO anon, authenticated;
GRANT ALL ON public.alerts TO service_role;
CREATE POLICY "write alerts" ON public.alerts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update alerts" ON public.alerts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete alerts" ON public.alerts FOR DELETE TO anon, authenticated USING (true);

-- 5. New tables
CREATE TABLE public.session_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  topic text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_topics TO anon, authenticated;
GRANT ALL ON public.session_topics TO service_role;
ALTER TABLE public.session_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read session_topics" ON public.session_topics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "write session_topics" ON public.session_topics FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update session_topics" ON public.session_topics FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete session_topics" ON public.session_topics FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.session_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  category text,
  source text NOT NULL DEFAULT 'fixed',
  answer text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_questions TO anon, authenticated;
GRANT ALL ON public.session_questions TO service_role;
ALTER TABLE public.session_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read session_questions" ON public.session_questions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "write session_questions" ON public.session_questions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update session_questions" ON public.session_questions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete session_questions" ON public.session_questions FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.role_question_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_category text NOT NULL,
  question_text text NOT NULL,
  category text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_question_templates TO anon, authenticated;
GRANT ALL ON public.role_question_templates TO service_role;
ALTER TABLE public.role_question_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read role_question_templates" ON public.role_question_templates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "write role_question_templates" ON public.role_question_templates FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update role_question_templates" ON public.role_question_templates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete role_question_templates" ON public.role_question_templates FOR DELETE TO anon, authenticated USING (true);
CREATE TRIGGER role_question_templates_updated_at BEFORE UPDATE ON public.role_question_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.responsibility_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  responsibility_text text NOT NULL,
  status text NOT NULL DEFAULT 'not_evaluated',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.responsibility_reviews TO anon, authenticated;
GRANT ALL ON public.responsibility_reviews TO service_role;
ALTER TABLE public.responsibility_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read responsibility_reviews" ON public.responsibility_reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "write responsibility_reviews" ON public.responsibility_reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update responsibility_reviews" ON public.responsibility_reviews FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete responsibility_reviews" ON public.responsibility_reviews FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.commitment_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id uuid NOT NULL REFERENCES public.commitments(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commitment_updates TO anon, authenticated;
GRANT ALL ON public.commitment_updates TO service_role;
ALTER TABLE public.commitment_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read commitment_updates" ON public.commitment_updates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "write commitment_updates" ON public.commitment_updates FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update commitment_updates" ON public.commitment_updates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete commitment_updates" ON public.commitment_updates FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.course_progress_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  progress integer NOT NULL DEFAULT 0,
  status text,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_progress_history TO anon, authenticated;
GRANT ALL ON public.course_progress_history TO service_role;
ALTER TABLE public.course_progress_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read course_progress_history" ON public.course_progress_history FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "write course_progress_history" ON public.course_progress_history FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update course_progress_history" ON public.course_progress_history FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete course_progress_history" ON public.course_progress_history FOR DELETE TO anon, authenticated USING (true);