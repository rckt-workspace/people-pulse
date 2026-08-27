import { supabase } from "@/integrations/supabase/client";

/* --------------------------------- types --------------------------------- */

export type SessionStatus = "draft" | "completed";

export type SessionRow = {
  id: string;
  employee_id: string;
  session_date: string;
  session_type: string;
  status: string;
  current_step: number;
  facilitator: string | null;
  general_notes: string | null;
  wellbeing_score: number | null;
  compliance_percentage: number | null;
  created_at: string;
  updated_at: string;
};

export type SessionQuestion = {
  id: string;
  session_id: string;
  employee_id: string;
  question_text: string;
  category: string | null;
  source: string;
  answer: string | null;
  sort_order: number;
};

export type SessionTopic = {
  id: string;
  session_id: string;
  topic: string;
};

export type BlockerRow = {
  id: string;
  session_id: string | null;
  employee_id: string | null;
  category: string;
  description: string | null;
  severity: string | null;
  status: string;
  created_at: string;
};

export type CommitmentRow = {
  id: string;
  employee_id: string;
  session_id: string | null;
  description: string;
  responsible: string | null;
  due_date: string | null;
  priority: string | null;
  effort_level: string | null;
  origin: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
};

export type ResponsibilityReview = {
  id: string;
  employee_id: string;
  session_id: string | null;
  responsibility_text: string;
  status: string;
  notes: string | null;
};

export type WellbeingRow = {
  id: string;
  session_id: string | null;
  employee_id: string;
  dimension: string;
  score: number;
  notes: string | null;
};

/* ------------------------------- catalogues ------------------------------- */

export const SESSION_TYPES = [
  "1:1 mensual",
  "Seguimiento",
  "Conversación de desempeño",
  "Plan de mejora",
  "Desarrollo profesional",
  "Otro",
] as const;

export const WIZARD_STEPS = [
  "Preparación",
  "Conversación",
  "Bienestar",
  "Bloqueos",
  "Indicadores",
  "Notas",
  "Revisión",
] as const;

export const GENERAL_QUESTIONS = [
  "¿Qué está saliendo bien actualmente?",
  "¿Qué has aprendido durante este periodo?",
  "¿Qué te está bloqueando?",
  "¿Qué necesitas de tu responsable directo?",
  "¿Qué necesitas de People & Culture?",
  "¿Hay algo que creas que deberíamos cambiar?",
  "¿Qué logro de este periodo destacarías?",
  "¿Qué ha sido lo más difícil durante este periodo?",
];

export const DEVELOPMENT_QUESTIONS = [
  "¿En qué habilidad te gustaría seguir creciendo?",
  "¿Hay alguna responsabilidad nueva que te gustaría asumir?",
  "¿Sientes que estás aprovechando tus fortalezas?",
  "¿Qué te gustaría aprender durante el próximo mes?",
  "¿Hay algún reto profesional que quieras asumir?",
];

export const TRAINING_QUESTIONS = [
  "¿Qué formación estás realizando actualmente?",
  "¿Qué estás aplicando de esa formación en tu trabajo?",
  "¿Qué aprendizaje adicional consideras que necesitas?",
];

export const QUESTION_CATEGORIES = [
  "Bienestar",
  "Desempeño",
  "Desarrollo",
  "Cliente",
  "Equipo",
  "Formación",
  "Liderazgo",
  "Otro",
];

export const ROLE_CATEGORY_LABEL: Record<string, string> = {
  technology: "Software / Technology",
  design: "UX/UI / Design",
  delivery: "Project Management / Delivery",
  marketing: "Marketing",
  client_success: "Account / Client Success",
  people_culture: "People & Culture",
};

export function roleCategoryFor(jobTitle: string, area: string): string {
  const text = `${jobTitle} ${area}`.toLowerCase();
  if (/(developer|engineer|backend|frontend|full ?stack|qa|devops|technology|tecnolog)/.test(text))
    return "technology";
  if (/(ux|ui|design|diseñ)/.test(text)) return "design";
  if (/(project|delivery|pm|scrum|proyecto)/.test(text)) return "delivery";
  if (/(marketing|growth|content)/.test(text)) return "marketing";
  if (/(account|client|customer|cuenta|success)/.test(text)) return "client_success";
  if (/(people|culture|hr|talent)/.test(text)) return "people_culture";
  return "technology";
}

export const WELLBEING_DIMENSIONS: { name: string; question: string; inverted?: boolean }[] = [
  { name: "Bienestar general", question: "¿Cómo describirías tu bienestar general este periodo?" },
  { name: "Motivación", question: "¿Qué tan motivada/o te has sentido?" },
  { name: "Energía", question: "¿Cómo ha estado tu nivel de energía?" },
  {
    name: "Carga laboral",
    question: "¿Qué tan manejable ha sido tu carga laboral?",
  },
  { name: "Estrés percibido", question: "¿Qué nivel de estrés has percibido?", inverted: true },
  { name: "Claridad de responsabilidades", question: "¿Qué tan claras están tus responsabilidades?" },
  { name: "Autonomía", question: "¿Cuánta autonomía sientes en tu trabajo?" },
  { name: "Relación con líder", question: "¿Cómo describirías la relación con tu responsable?" },
  { name: "Relación con equipo", question: "¿Cómo ha sido la relación con tu equipo?" },
  { name: "Pertenencia", question: "¿Qué tanto sientes que perteneces al equipo?" },
  { name: "Reconocimiento", question: "¿Sientes que tu trabajo es reconocido?" },
  { name: "Recursos", question: "¿Cuentas con los recursos que necesitas?" },
  { name: "Balance trabajo/vida", question: "¿Cómo está tu balance entre trabajo y vida personal?" },
  { name: "Crecimiento", question: "¿Sientes que estás creciendo profesionalmente?" },
  { name: "Seguridad psicológica", question: "¿Puedes expresar opiniones sin temor?" },
  { name: "Claridad de objetivos", question: "¿Qué tan claros están tus objetivos?" },
  {
    name: "Experiencia con proyecto/cliente",
    question: "¿Cómo ha sido tu experiencia con el proyecto o cliente?",
  },
];

export const SCALE_LABELS = ["Muy bajo", "Bajo", "Medio", "Bueno", "Muy bueno"];
export const SCALE_LABELS_WORKLOAD = [
  "Nada manejable",
  "Poco manejable",
  "Manejable a ratos",
  "Manejable",
  "Totalmente manejable",
];
export const SCALE_LABELS_STRESS = ["Muy bajo", "Bajo", "Medio", "Alto", "Muy alto"];

export function scaleLabels(dimension: string) {
  if (dimension === "Estrés percibido") return SCALE_LABELS_STRESS;
  if (dimension === "Carga laboral") return SCALE_LABELS_WORKLOAD;
  return SCALE_LABELS;
}

export const BLOCKER_CATEGORIES = [
  "Procesos",
  "Cliente",
  "Liderazgo",
  "Equipo",
  "Herramientas",
  "Carga laboral",
  "Conocimiento",
  "Comunicación",
  "Priorización",
  "Responsabilidades",
  "Motivación",
  "Desarrollo profesional",
  "Información",
  "Dependencias",
  "Otro",
];

export const BLOCKER_SEVERITIES = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
];

export const BLOCKER_STATUSES = [
  { value: "nuevo", label: "Nuevo" },
  { value: "recurrente", label: "Recurrente" },
  { value: "en_resolucion", label: "En resolución" },
  { value: "resuelto", label: "Resuelto" },
];

export const RESPONSIBILITY_STATUSES = [
  { value: "meeting", label: "Cumpliendo" },
  { value: "partial", label: "Cumplimiento parcial" },
  { value: "attention", label: "Requiere atención" },
  { value: "not_evaluated", label: "No evaluada" },
];

export const COMMITMENT_RESPONSIBLES = [
  "Colaborador",
  "Responsable directo",
  "People & Culture",
  "CEO",
  "Cliente",
];

export const COMMITMENT_PRIORITIES = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

export const COMMITMENT_STATUSES = [
  { value: "abierto", label: "Pendiente" },
  { value: "en_progreso", label: "En progreso" },
  { value: "cumplido", label: "Cumplido" },
  { value: "cancelado", label: "Cancelado" },
];

export const NOTE_BLOCKS = [
  { label: "+ Fortaleza", text: "\n## Fortaleza\n- " },
  { label: "+ Tema pendiente", text: "\n## Tema pendiente\n- " },
  { label: "+ Acuerdo", text: "\n## Acuerdo\n- " },
  { label: "+ Riesgo", text: "\n## Riesgo\n- " },
];

export function labelFor(list: { value: string; label: string }[], value: string | null) {
  return list.find((item) => item.value === value)?.label ?? value ?? "—";
}

export function splitResponsibilities(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(/(?<=\.)\s+|\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isOverdue(commitment: CommitmentRow) {
  if (!commitment.due_date) return false;
  if (commitment.status === "cumplido" || commitment.status === "cancelado") return false;
  return new Date(`${commitment.due_date}T23:59:59Z`).getTime() < Date.now();
}

export function followupState(lastSessionDate: string | null) {
  if (!lastSessionDate) return { label: "Sin 1:1 registrado", tone: "critical" as const, days: null };
  const days = Math.floor(
    (Date.now() - new Date(`${lastSessionDate}T00:00:00Z`).getTime()) / 86_400_000,
  );
  if (days > 35) return { label: "Atrasado", tone: "critical" as const, days };
  if (days >= 30) return { label: "Pendiente", tone: "warning" as const, days };
  return { label: "Próximo", tone: "positive" as const, days };
}

/* -------------------------------- queries -------------------------------- */

export const sessionsOverviewQuery = {
  queryKey: ["sessions-overview"],
  queryFn: async () => {
    const [employees, sessions, commitments, blockers] = await Promise.all([
      supabase.from("employees").select("*").order("full_name"),
      supabase.from("sessions").select("*").order("session_date", { ascending: false }),
      supabase.from("commitments").select("*"),
      supabase.from("blockers").select("*"),
    ]);
    const error = employees.error ?? sessions.error ?? commitments.error ?? blockers.error;
    if (error) throw error;
    return {
      employees: (employees.data ?? []) as {
        id: string;
        full_name: string;
        job_title: string;
        area: string;
        last_session_date: string | null;
      }[],
      sessions: (sessions.data ?? []) as SessionRow[],
      commitments: (commitments.data ?? []) as CommitmentRow[],
      blockers: (blockers.data ?? []) as BlockerRow[],
    };
  },
};

export function sessionQuery(sessionId: string) {
  return {
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const { data: session, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .maybeSingle();
      if (error) throw error;
      if (!session) return null;
      const employeeId = (session as SessionRow).employee_id;

      const [
        employee,
        topics,
        questions,
        wellbeing,
        blockers,
        indicators,
        results,
        commitments,
        responsibilities,
        courses,
        history,
      ] = await Promise.all([
        supabase.from("employees").select("*").eq("id", employeeId).maybeSingle(),
        supabase.from("session_topics").select("*").eq("session_id", sessionId).order("created_at"),
        supabase
          .from("session_questions")
          .select("*")
          .eq("session_id", sessionId)
          .order("sort_order"),
        supabase.from("wellbeing_responses").select("*").eq("employee_id", employeeId),
        supabase.from("blockers").select("*").eq("employee_id", employeeId).order("created_at"),
        supabase.from("indicators").select("*").eq("employee_id", employeeId).order("created_at"),
        supabase
          .from("indicator_results")
          .select("*")
          .eq("employee_id", employeeId)
          .order("created_at"),
        supabase.from("commitments").select("*").eq("employee_id", employeeId),
        supabase.from("responsibility_reviews").select("*").eq("session_id", sessionId),
        supabase.from("courses").select("*").eq("employee_id", employeeId).order("created_at"),
        supabase
          .from("sessions")
          .select("*")
          .eq("employee_id", employeeId)
          .order("session_date", { ascending: false }),
      ]);

      return {
        session: session as SessionRow,
        employee: employee.data,
        topics: (topics.data ?? []) as SessionTopic[],
        questions: (questions.data ?? []) as SessionQuestion[],
        wellbeing: (wellbeing.data ?? []) as WellbeingRow[],
        blockers: (blockers.data ?? []) as BlockerRow[],
        indicators: (indicators.data ?? []) as {
          id: string;
          name: string;
          description: string | null;
          target_value: number | null;
          current_value: number | null;
          unit: string | null;
          direction: string;
        }[],
        results: (results.data ?? []) as {
          id: string;
          indicator_id: string;
          period_label: string | null;
          result_value: number | null;
          compliance_percentage: number | null;
          status: string | null;
          session_id: string | null;
        }[],
        commitments: (commitments.data ?? []) as CommitmentRow[],
        responsibilities: (responsibilities.data ?? []) as ResponsibilityReview[],
        courses: (courses.data ?? []) as {
          id: string;
          course_name: string;
          course_type: string;
          progress: number;
          status: string;
          related_competency: string | null;
        }[],
        history: (history.data ?? []) as SessionRow[],
      };
    },
  };
}

export const templatesQuery = {
  queryKey: ["role-question-templates"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("role_question_templates")
      .select("*")
      .order("role_category")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as {
      id: string;
      role_category: string;
      question_text: string;
      category: string | null;
      active: boolean;
      sort_order: number;
    }[];
  },
};

export const commitmentsQuery = {
  queryKey: ["commitments"],
  queryFn: async () => {
    const [commitments, employees, updates] = await Promise.all([
      supabase.from("commitments").select("*").order("created_at", { ascending: false }),
      supabase.from("employees").select("id, full_name, area"),
      supabase.from("commitment_updates").select("*").order("created_at"),
    ]);
    const error = commitments.error ?? employees.error ?? updates.error;
    if (error) throw error;
    return {
      commitments: (commitments.data ?? []) as CommitmentRow[],
      employees: (employees.data ?? []) as { id: string; full_name: string; area: string }[],
      updates: (updates.data ?? []) as {
        id: string;
        commitment_id: string;
        note: string;
        created_by: string | null;
        created_at: string;
      }[],
    };
  },
};

/* ------------------------------- mutations ------------------------------- */

export async function createDraftSession(employeeId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      employee_id: employeeId,
      session_date: today,
      session_type: "1:1 mensual",
      status: "draft",
      current_step: 1,
      facilitator: "People & Culture",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function seedSessionQuestions(
  sessionId: string,
  employeeId: string,
  roleCategory: string,
) {
  const { data: existing } = await supabase
    .from("session_questions")
    .select("id")
    .eq("session_id", sessionId)
    .limit(1);
  if (existing && existing.length > 0) return;

  const { data: templates } = await supabase
    .from("role_question_templates")
    .select("*")
    .eq("role_category", roleCategory)
    .eq("active", true)
    .order("sort_order");

  const rows: {
    session_id: string;
    employee_id: string;
    question_text: string;
    category: string | null;
    source: string;
    sort_order: number;
  }[] = [];
  let order = 0;
  for (const question of GENERAL_QUESTIONS) {
    rows.push({
      session_id: sessionId,
      employee_id: employeeId,
      question_text: question,
      category: "General",
      source: "fixed",
      sort_order: order++,
    });
  }
  for (const question of DEVELOPMENT_QUESTIONS) {
    rows.push({
      session_id: sessionId,
      employee_id: employeeId,
      question_text: question,
      category: "Desarrollo",
      source: "fixed",
      sort_order: order++,
    });
  }
  for (const question of TRAINING_QUESTIONS) {
    rows.push({
      session_id: sessionId,
      employee_id: employeeId,
      question_text: question,
      category: "Formación",
      source: "fixed",
      sort_order: order++,
    });
  }
  for (const template of templates ?? []) {
    rows.push({
      session_id: sessionId,
      employee_id: employeeId,
      question_text: template.question_text,
      category: template.category,
      source: "role",
      sort_order: order++,
    });
  }
  if (rows.length) await supabase.from("session_questions").insert(rows);
}
