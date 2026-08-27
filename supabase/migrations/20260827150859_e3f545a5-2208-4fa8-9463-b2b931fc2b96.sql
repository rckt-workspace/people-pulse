
CREATE TABLE public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'people_culture',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  job_title text NOT NULL,
  area text NOT NULL,
  leader_name text NOT NULL,
  evaluation_period text NOT NULL,
  general_responsibilities text,
  wellbeing_score numeric,
  compliance_percentage numeric,
  development_index integer,
  status text NOT NULL DEFAULT 'normal',
  last_session_date date,
  next_followup_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  target_value numeric,
  current_value numeric,
  unit text,
  weight numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  session_type text NOT NULL DEFAULT '1:1 mensual',
  general_notes text,
  ai_summary text,
  approved boolean NOT NULL DEFAULT false,
  wellbeing_score numeric,
  compliance_percentage numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.indicator_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id uuid NOT NULL REFERENCES public.indicators(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  period_label text,
  result_value numeric,
  compliance_percentage numeric,
  status text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  course_name text NOT NULL,
  platform text,
  course_type text NOT NULL DEFAULT 'assigned',
  start_date date,
  completion_date date,
  progress integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'en_curso',
  related_competency text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.wellbeing_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  dimension text NOT NULL,
  score numeric NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.blockers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  category text NOT NULL,
  description text,
  severity text,
  status text NOT NULL DEFAULT 'abierto',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  description text NOT NULL,
  responsible text,
  due_date date,
  priority text,
  effort_level text,
  origin text,
  status text NOT NULL DEFAULT 'abierto',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE public.development_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text,
  description text,
  current_state text,
  target_state text,
  progress integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'activo',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  current_level integer,
  target_level integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  description text,
  recommendation text,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_users TO anon, authenticated;
GRANT ALL ON public.app_users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO anon, authenticated;
GRANT ALL ON public.employees TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.indicators TO anon, authenticated;
GRANT ALL ON public.indicators TO service_role;
GRANT SELECT ON public.sessions TO anon, authenticated;
GRANT ALL ON public.sessions TO service_role;
GRANT SELECT ON public.indicator_results TO anon, authenticated;
GRANT ALL ON public.indicator_results TO service_role;
GRANT SELECT ON public.courses TO anon, authenticated;
GRANT ALL ON public.courses TO service_role;
GRANT SELECT ON public.wellbeing_responses TO anon, authenticated;
GRANT ALL ON public.wellbeing_responses TO service_role;
GRANT SELECT ON public.blockers TO anon, authenticated;
GRANT ALL ON public.blockers TO service_role;
GRANT SELECT ON public.commitments TO anon, authenticated;
GRANT ALL ON public.commitments TO service_role;
GRANT SELECT ON public.development_goals TO anon, authenticated;
GRANT ALL ON public.development_goals TO service_role;
GRANT SELECT ON public.competencies TO anon, authenticated;
GRANT ALL ON public.competencies TO service_role;
GRANT SELECT ON public.alerts TO anon, authenticated;
GRANT ALL ON public.alerts TO service_role;

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicator_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellbeing_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read app_users" ON public.app_users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read employees" ON public.employees FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "write employees" ON public.employees FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update employees" ON public.employees FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete employees" ON public.employees FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY "read indicators" ON public.indicators FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "write indicators" ON public.indicators FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update indicators" ON public.indicators FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete indicators" ON public.indicators FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY "read sessions" ON public.sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read indicator_results" ON public.indicator_results FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read courses" ON public.courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read wellbeing" ON public.wellbeing_responses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read blockers" ON public.blockers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read commitments" ON public.commitments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read development_goals" ON public.development_goals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read competencies" ON public.competencies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read alerts" ON public.alerts FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER employees_updated_at BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data
INSERT INTO public.app_users (id, name, email, role) VALUES
('00000000-0000-0000-0000-0000000000a1','People & Culture','people@empresa.com','people_culture');

INSERT INTO public.employees (id, full_name, job_title, area, leader_name, evaluation_period, general_responsibilities, wellbeing_score, compliance_percentage, development_index, status, last_session_date, next_followup_date) VALUES
('11111111-1111-1111-1111-111111111101','Laura Gómez','Senior UX Designer','Design','Ana Martínez','Q3 2026','Diseñar experiencias digitales alineadas con necesidades del usuario. Liderar procesos de research. Mantener consistencia del Design System. Coordinar handoff con desarrollo. Participar en conversaciones con cliente.',4.2,87,78,'normal','2026-08-03','2026-09-02'),
('11111111-1111-1111-1111-111111111102','Juan Pérez','Backend Developer','Technology','Carlos Medina','Q3 2026','Desarrollar y mantener servicios backend. Asegurar calidad y cobertura de pruebas. Documentar APIs. Participar en revisiones de código.',3.4,78,64,'seguimiento_recomendado','2026-08-10','2026-08-31'),
('11111111-1111-1111-1111-111111111103','Camila Torres','Account Manager','Client Services','María López','Q3 2026','Gestionar la relación con clientes clave. Coordinar equipos internos. Asegurar satisfacción y renovación de cuentas.',4.4,92,82,'normal','2026-08-14','2026-09-05'),
('11111111-1111-1111-1111-111111111104','Andrés Ruiz','Project Manager','Delivery','Carlos Medina','Q3 2026','Planificar y coordinar entregas. Gestionar riesgos y dependencias. Comunicar avances a stakeholders.',2.9,72,55,'seguimiento_prioritario','2026-08-18','2026-08-28'),
('11111111-1111-1111-1111-111111111105','Valentina Rojas','Marketing Specialist','Marketing','Ana Martínez','Q3 2026','Ejecutar campañas de marketing digital. Gestionar contenidos y redes. Medir y reportar resultados.',4.0,85,74,'normal','2026-08-07','2026-09-04');

INSERT INTO public.indicators (id, employee_id, name, description, target_value, current_value, unit, weight) VALUES
('22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111101','Cumplimiento de entregas','Entregables realizados dentro del plazo acordado',95,87,'%',30),
('22222222-2222-2222-2222-222222222202','11111111-1111-1111-1111-111111111101','Satisfacción del cliente','Evaluación promedio del cliente sobre la experiencia entregada',4.5,4.7,'/5',25),
('22222222-2222-2222-2222-222222222203','11111111-1111-1111-1111-111111111101','Consistencia del Design System','Componentes alineados al sistema de diseño',90,72,'%',20),
('22222222-2222-2222-2222-222222222204','11111111-1111-1111-1111-111111111102','Estabilidad de servicios','Uptime de los servicios a cargo',99,97,'%',40),
('22222222-2222-2222-2222-222222222205','11111111-1111-1111-1111-111111111102','Cobertura de pruebas','Porcentaje de código cubierto por pruebas automatizadas',80,64,'%',30),
('22222222-2222-2222-2222-222222222206','11111111-1111-1111-1111-111111111103','Retención de cuentas','Cuentas renovadas sobre el total gestionado',90,94,'%',40),
('22222222-2222-2222-2222-222222222207','11111111-1111-1111-1111-111111111104','Entregas a tiempo','Proyectos entregados en la fecha comprometida',95,70,'%',40),
('22222222-2222-2222-2222-222222222208','11111111-1111-1111-1111-111111111105','Leads calificados','Leads generados por campañas activas',120,102,'unidades',35);

INSERT INTO public.sessions (id, employee_id, session_date, session_type, general_notes, wellbeing_score, compliance_percentage) VALUES
('33333333-3333-3333-3333-333333333301','11111111-1111-1111-1111-111111111101','2026-07-28','1:1 mensual','Conversación centrada en priorización y comunicación con cliente.',3.8,82),
('33333333-3333-3333-3333-333333333302','11111111-1111-1111-1111-111111111101','2026-06-26','1:1 mensual','Revisión de carga laboral y foco del equipo de diseño.',3.3,78),
('33333333-3333-3333-3333-333333333303','11111111-1111-1111-1111-111111111101','2026-05-29','1:1 mensual','Seguimiento a objetivos del trimestre.',3.6,75),
('33333333-3333-3333-3333-333333333304','11111111-1111-1111-1111-111111111102','2026-08-10','1:1 mensual','Bloqueos técnicos y dependencias con otros equipos.',3.4,78),
('33333333-3333-3333-3333-333333333305','11111111-1111-1111-1111-111111111103','2026-08-14','1:1 mensual','Buen momento de la cuenta principal.',4.4,92),
('33333333-3333-3333-3333-333333333306','11111111-1111-1111-1111-111111111104','2026-08-18','Seguimiento','Sobrecarga y bloqueos repetidos en priorización.',2.9,72),
('33333333-3333-3333-3333-333333333307','11111111-1111-1111-1111-111111111105','2026-08-07','1:1 mensual','Campañas al día, buen ritmo.',4.0,85);

INSERT INTO public.indicator_results (indicator_id, employee_id, session_id, period_label, result_value, compliance_percentage, status) VALUES
('22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111101',NULL,'Mayo',75,78.9,'en_riesgo'),
('22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333303','Junio',78,82.1,'en_riesgo'),
('22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333302','Julio',82,86.3,'en_riesgo'),
('22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333301','Agosto',87,91.6,'en_riesgo'),
('22222222-2222-2222-2222-222222222202','11111111-1111-1111-1111-111111111101',NULL,'Mayo',4.3,95.6,'en_riesgo'),
('22222222-2222-2222-2222-222222222202','11111111-1111-1111-1111-111111111101',NULL,'Junio',4.4,97.8,'en_riesgo'),
('22222222-2222-2222-2222-222222222202','11111111-1111-1111-1111-111111111101',NULL,'Julio',4.6,102.2,'cumplido'),
('22222222-2222-2222-2222-222222222202','11111111-1111-1111-1111-111111111101',NULL,'Agosto',4.7,104.4,'cumplido'),
('22222222-2222-2222-2222-222222222203','11111111-1111-1111-1111-111111111101',NULL,'Agosto',72,80.0,'no_cumplido'),
('22222222-2222-2222-2222-222222222204','11111111-1111-1111-1111-111111111102',NULL,'Agosto',97,98.0,'cumplido'),
('22222222-2222-2222-2222-222222222205','11111111-1111-1111-1111-111111111102',NULL,'Agosto',64,80.0,'en_riesgo'),
('22222222-2222-2222-2222-222222222206','11111111-1111-1111-1111-111111111103',NULL,'Agosto',94,104.4,'cumplido'),
('22222222-2222-2222-2222-222222222207','11111111-1111-1111-1111-111111111104',NULL,'Agosto',70,73.7,'no_cumplido'),
('22222222-2222-2222-2222-222222222208','11111111-1111-1111-1111-111111111105',NULL,'Agosto',102,85.0,'en_riesgo');

INSERT INTO public.courses (employee_id, course_name, platform, course_type, start_date, completion_date, progress, status, related_competency) VALUES
('11111111-1111-1111-1111-111111111101','Advanced Design Systems','Udemy','assigned','2026-05-04','2026-06-20',100,'completado','Design Systems'),
('11111111-1111-1111-1111-111111111101','AI for Designers','Udemy','autonomous','2026-07-01',NULL,75,'en_curso','IA aplicada al diseño'),
('11111111-1111-1111-1111-111111111101','Stakeholder Management','Udemy','autonomous','2026-07-15',NULL,40,'en_curso','Comunicación'),
('11111111-1111-1111-1111-111111111101','Research Ops Essentials','Coursera','assigned','2026-06-01',NULL,55,'en_curso','Research'),
('11111111-1111-1111-1111-111111111102','Clean Architecture','Udemy','assigned','2026-05-10','2026-07-02',100,'completado','Arquitectura'),
('11111111-1111-1111-1111-111111111102','Testing Automatizado','Platzi','assigned','2026-07-10',NULL,35,'en_curso','Calidad'),
('11111111-1111-1111-1111-111111111103','Negociación Consultiva','Coursera','assigned','2026-06-05','2026-07-30',100,'completado','Negociación'),
('11111111-1111-1111-1111-111111111103','Customer Success Analytics','Udemy','autonomous','2026-08-01',NULL,20,'en_curso','Analítica'),
('11111111-1111-1111-1111-111111111104','Gestión de Riesgos en Proyectos','Udemy','assigned','2026-06-15',NULL,45,'en_curso','Gestión de proyectos'),
('11111111-1111-1111-1111-111111111105','Growth Marketing','Platzi','assigned','2026-05-20','2026-07-12',100,'completado','Growth'),
('11111111-1111-1111-1111-111111111105','Storytelling de Marca','Udemy','autonomous','2026-07-20',NULL,60,'en_curso','Comunicación');

INSERT INTO public.wellbeing_responses (employee_id, session_id, dimension, score) VALUES
('11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333301','Bienestar general',4.2),
('11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333301','Motivación',4.3),
('11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333301','Energía',3.9),
('11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333301','Carga laboral',3.5),
('11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333301','Estrés percibido',3.2),
('11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333301','Relación con líder',4.6),
('11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333301','Equipo',4.4),
('11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333301','Pertenencia',4.5),
('11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333301','Crecimiento',4.0),
('11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333301','Balance trabajo/vida',3.8),
('11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333301','Autonomía',4.4),
('11111111-1111-1111-1111-111111111102','33333333-3333-3333-3333-333333333304','Bienestar general',3.4),
('11111111-1111-1111-1111-111111111102','33333333-3333-3333-3333-333333333304','Motivación',3.2),
('11111111-1111-1111-1111-111111111102','33333333-3333-3333-3333-333333333304','Energía',3.0),
('11111111-1111-1111-1111-111111111102','33333333-3333-3333-3333-333333333304','Carga laboral',2.8),
('11111111-1111-1111-1111-111111111102','33333333-3333-3333-3333-333333333304','Estrés percibido',2.6),
('11111111-1111-1111-1111-111111111102','33333333-3333-3333-3333-333333333304','Relación con líder',3.8),
('11111111-1111-1111-1111-111111111102','33333333-3333-3333-3333-333333333304','Equipo',3.9),
('11111111-1111-1111-1111-111111111102','33333333-3333-3333-3333-333333333304','Pertenencia',3.6),
('11111111-1111-1111-1111-111111111102','33333333-3333-3333-3333-333333333304','Crecimiento',3.3),
('11111111-1111-1111-1111-111111111102','33333333-3333-3333-3333-333333333304','Balance trabajo/vida',3.1),
('11111111-1111-1111-1111-111111111102','33333333-3333-3333-3333-333333333304','Autonomía',3.7),
('11111111-1111-1111-1111-111111111103','33333333-3333-3333-3333-333333333305','Bienestar general',4.4),
('11111111-1111-1111-1111-111111111103','33333333-3333-3333-3333-333333333305','Motivación',4.5),
('11111111-1111-1111-1111-111111111103','33333333-3333-3333-3333-333333333305','Energía',4.2),
('11111111-1111-1111-1111-111111111103','33333333-3333-3333-3333-333333333305','Carga laboral',3.9),
('11111111-1111-1111-1111-111111111103','33333333-3333-3333-3333-333333333305','Estrés percibido',3.8),
('11111111-1111-1111-1111-111111111103','33333333-3333-3333-3333-333333333305','Relación con líder',4.7),
('11111111-1111-1111-1111-111111111103','33333333-3333-3333-3333-333333333305','Equipo',4.6),
('11111111-1111-1111-1111-111111111103','33333333-3333-3333-3333-333333333305','Pertenencia',4.5),
('11111111-1111-1111-1111-111111111103','33333333-3333-3333-3333-333333333305','Crecimiento',4.1),
('11111111-1111-1111-1111-111111111103','33333333-3333-3333-3333-333333333305','Balance trabajo/vida',4.0),
('11111111-1111-1111-1111-111111111103','33333333-3333-3333-3333-333333333305','Autonomía',4.3),
('11111111-1111-1111-1111-111111111104','33333333-3333-3333-3333-333333333306','Bienestar general',2.9),
('11111111-1111-1111-1111-111111111104','33333333-3333-3333-3333-333333333306','Motivación',2.8),
('11111111-1111-1111-1111-111111111104','33333333-3333-3333-3333-333333333306','Energía',2.5),
('11111111-1111-1111-1111-111111111104','33333333-3333-3333-3333-333333333306','Carga laboral',2.2),
('11111111-1111-1111-1111-111111111104','33333333-3333-3333-3333-333333333306','Estrés percibido',2.1),
('11111111-1111-1111-1111-111111111104','33333333-3333-3333-3333-333333333306','Relación con líder',3.4),
('11111111-1111-1111-1111-111111111104','33333333-3333-3333-3333-333333333306','Equipo',3.5),
('11111111-1111-1111-1111-111111111104','33333333-3333-3333-3333-333333333306','Pertenencia',3.2),
('11111111-1111-1111-1111-111111111104','33333333-3333-3333-3333-333333333306','Crecimiento',2.7),
('11111111-1111-1111-1111-111111111104','33333333-3333-3333-3333-333333333306','Balance trabajo/vida',2.4),
('11111111-1111-1111-1111-111111111104','33333333-3333-3333-3333-333333333306','Autonomía',3.3),
('11111111-1111-1111-1111-111111111105','33333333-3333-3333-3333-333333333307','Bienestar general',4.0),
('11111111-1111-1111-1111-111111111105','33333333-3333-3333-3333-333333333307','Motivación',4.1),
('11111111-1111-1111-1111-111111111105','33333333-3333-3333-3333-333333333307','Energía',3.8),
('11111111-1111-1111-1111-111111111105','33333333-3333-3333-3333-333333333307','Carga laboral',3.6),
('11111111-1111-1111-1111-111111111105','33333333-3333-3333-3333-333333333307','Estrés percibido',3.5),
('11111111-1111-1111-1111-111111111105','33333333-3333-3333-3333-333333333307','Relación con líder',4.3),
('11111111-1111-1111-1111-111111111105','33333333-3333-3333-3333-333333333307','Equipo',4.2),
('11111111-1111-1111-1111-111111111105','33333333-3333-3333-3333-333333333307','Pertenencia',4.1),
('11111111-1111-1111-1111-111111111105','33333333-3333-3333-3333-333333333307','Crecimiento',3.9),
('11111111-1111-1111-1111-111111111105','33333333-3333-3333-3333-333333333307','Balance trabajo/vida',3.7),
('11111111-1111-1111-1111-111111111105','33333333-3333-3333-3333-333333333307','Autonomía',4.0);

INSERT INTO public.blockers (employee_id, session_id, category, description, severity, status) VALUES
('11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333301','Priorización','Cambios frecuentes de alcance','media','abierto'),
('11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333302','Cliente','Feedback tardío del cliente','media','abierto'),
('11111111-1111-1111-1111-111111111102','33333333-3333-3333-3333-333333333304','Procesos','Dependencias entre equipos','alta','abierto'),
('11111111-1111-1111-1111-111111111104','33333333-3333-3333-3333-333333333306','Carga laboral','Exceso de proyectos simultáneos','alta','abierto'),
('11111111-1111-1111-1111-111111111105','33333333-3333-3333-3333-333333333307','Comunicación','Falta de claridad en briefs','baja','abierto'),
('11111111-1111-1111-1111-111111111103','33333333-3333-3333-3333-333333333305','Conocimiento','Curva de aprendizaje en analítica','baja','abierto');

INSERT INTO public.commitments (employee_id, session_id, description, responsible, due_date, priority, status) VALUES
('11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333301','Definir criterios de priorización con el cliente','Laura Gómez','2026-08-20','alta','abierto'),
('11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333301','Actualizar componentes del Design System','Laura Gómez','2026-09-05','media','abierto'),
('11111111-1111-1111-1111-111111111102','33333333-3333-3333-3333-333333333304','Documentar APIs críticas','Juan Pérez','2026-08-15','alta','vencido'),
('11111111-1111-1111-1111-111111111104','33333333-3333-3333-3333-333333333306','Redistribuir carga de proyectos','Carlos Medina','2026-08-12','alta','vencido');

INSERT INTO public.development_goals (employee_id, title, category, description, current_state, target_state, progress, status) VALUES
('11111111-1111-1111-1111-111111111101','Liderazgo de research','Liderazgo','Liderar de forma autónoma procesos de research end-to-end','Participa con apoyo','Lidera de forma autónoma',60,'activo');

INSERT INTO public.competencies (employee_id, name, category, current_level, target_level) VALUES
('11111111-1111-1111-1111-111111111101','Comunicación con cliente','Interpersonal',3,4),
('11111111-1111-1111-1111-111111111101','Design Systems','Técnica',4,5);

INSERT INTO public.alerts (employee_id, alert_type, severity, title, description, recommendation) VALUES
('11111111-1111-1111-1111-111111111104','wellbeing','critical','Bienestar en descenso sostenido','Bienestar 2.9/5 y carga laboral elevada durante dos periodos.','Agendar seguimiento prioritario esta semana.'),
('11111111-1111-1111-1111-111111111102','commitments','warning','Compromisos vencidos','1 compromiso vencido y bloqueo repetido en procesos.','Revisar dependencias con el equipo de plataforma.');
