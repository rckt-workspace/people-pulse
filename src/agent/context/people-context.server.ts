import { serverClient } from "@/lib/development-ai.server";

type Db = ReturnType<typeof serverClient>;

// Volumen máximo por consulta. El modelo recibe resúmenes, nunca la base completa.
const LIST_LIMIT = 10;
const TEAM_LIMIT = 1000;

export type AssistantContext = {
  scope: "employee" | "team";
  // Datos resumidos que se envían al modelo como JSON.
  data: Record<string, unknown>;
  // Frases plantilla con los mismos datos; se usan si la IA no está disponible.
  summary: string[];
};

const clip = (value: string | null | undefined, max = 300) => (value ? value.slice(0, max) : null);

function countBy<T>(rows: T[], key: (row: T) => string | null | undefined) {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const k = key(row) ?? "sin dato";
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export async function buildAssistantContext(employeeId?: string): Promise<AssistantContext | null> {
  const db = serverClient();
  return employeeId ? buildEmployeeContext(db, employeeId) : buildTeamContext(db);
}

async function buildEmployeeContext(db: Db, employeeId: string): Promise<AssistantContext | null> {
  const [emp, ind, blk, com, cou, goa, ses, ans, wel] = await Promise.all([
    db
      .from("employees")
      .select(
        "full_name, job_title, area, leader_name, status, wellbeing_score, compliance_percentage, development_index, last_session_date, next_followup_date, evaluation_period",
      )
      .eq("id", employeeId)
      .maybeSingle(),
    db.from("indicators")
      .select("name, current_value, target_value, unit")
      .eq("employee_id", employeeId)
      .limit(LIST_LIMIT * 2),
    db.from("blockers")
      .select("category, description, status, severity")
      .eq("employee_id", employeeId)
      .neq("status", "resuelto")
      .limit(LIST_LIMIT),
    db.from("commitments")
      .select("description, status, due_date, priority")
      .eq("employee_id", employeeId)
      .neq("status", "cumplido")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(LIST_LIMIT),
    db.from("courses")
      .select("course_name, progress, status")
      .eq("employee_id", employeeId)
      .limit(LIST_LIMIT),
    db.from("development_goals")
      .select("title, status, progress, target_date")
      .eq("employee_id", employeeId)
      .limit(LIST_LIMIT),
    db.from("sessions")
      .select("session_date, session_type, status, compliance_percentage, wellbeing_score, ai_summary")
      .eq("employee_id", employeeId)
      .order("session_date", { ascending: false })
      .limit(5),
    db.from("session_questions")
      .select("question_text, answer")
      .eq("employee_id", employeeId)
      .not("answer", "is", null)
      .limit(12),
    db.from("wellbeing_responses")
      .select("dimension, score, created_at")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const e = emp.data;
  if (!e) return null;

  const indicators = (ind.data ?? []).map((i) => ({
    nombre: i.name,
    actual: i.current_value,
    meta: i.target_value,
    unidad: i.unit,
  }));
  const blockers = (blk.data ?? []).map((b) => ({
    categoria: b.category,
    descripcion: clip(b.description),
    estado: b.status,
    severidad: b.severity,
  }));
  const commitments = (com.data ?? []).map((c) => ({
    descripcion: clip(c.description),
    estado: c.status,
    vence: c.due_date,
    prioridad: c.priority,
  }));
  const courses = (cou.data ?? []).map((c) => ({ curso: c.course_name, avance: c.progress, estado: c.status }));
  const goals = (goa.data ?? []).map((g) => ({ objetivo: g.title, estado: g.status, avance: g.progress, fecha: g.target_date }));
  const sessions = (ses.data ?? []).map((s) => ({
    fecha: s.session_date,
    tipo: s.session_type,
    estado: s.status,
    cumplimiento: s.compliance_percentage,
    bienestar: s.wellbeing_score,
    resumen: clip(s.ai_summary),
  }));
  const answers = (ans.data ?? []).map((a) => ({ pregunta: clip(a.question_text, 200), respuesta: clip(a.answer) }));
  const wellbeing = (wel.data ?? []).map((w) => ({ dimension: w.dimension, puntuacion: w.score, fecha: w.created_at.slice(0, 10) }));

  const data = {
    persona: {
      nombre: e.full_name,
      cargo: e.job_title,
      area: e.area,
      lider: e.leader_name,
      estado: e.status,
      bienestar: e.wellbeing_score,
      cumplimiento: e.compliance_percentage,
      indice_desarrollo: e.development_index,
      ultima_sesion: e.last_session_date,
      proximo_seguimiento: e.next_followup_date,
      periodo_evaluacion: e.evaluation_period,
    },
    indicadores: indicators,
    bloqueos_abiertos: blockers,
    compromisos_abiertos: commitments,
    formacion: courses,
    objetivos_desarrollo: goals,
    sesiones_recientes: sessions,
    preguntas_respondidas: answers,
    bienestar_reciente: wellbeing,
  };

  const summary = [
    `${e.full_name} (${e.job_title}): ${indicators.length} indicadores, ${blockers.length} bloqueos abiertos, ${commitments.length} compromisos abiertos.`,
    `${courses.length} cursos y ${goals.length} objetivos de desarrollo registrados. ${sessions.length} sesiones recientes.`,
  ];

  return { scope: "employee", data, summary };
}

async function buildTeamContext(db: Db): Promise<AssistantContext> {
  const since = new Date(Date.now() - 180 * 86400000).toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const [emp, blk, com, ind, wel] = await Promise.all([
    db
      .from("employees")
      .select("full_name, status, wellbeing_score, compliance_percentage, next_followup_date")
      .limit(TEAM_LIMIT),
    db.from("blockers").select("category").neq("status", "resuelto").limit(TEAM_LIMIT),
    db.from("commitments").select("status, due_date").neq("status", "cumplido").limit(TEAM_LIMIT),
    db.from("indicators").select("name, current_value, target_value").limit(TEAM_LIMIT),
    db.from("wellbeing_responses").select("score, created_at").gte("created_at", since).limit(TEAM_LIMIT),
  ]);

  const employees = emp.data ?? [];
  const blockers = blk.data ?? [];
  const commitments = com.data ?? [];
  const followUps = employees
    .filter((x) => x.status === "seguimiento_prioritario" || x.status === "seguimiento_recomendado")
    .map((x) => ({ nombre: x.full_name, estado: x.status, proximo_seguimiento: x.next_followup_date }));
  const overdue = commitments.filter((c) => c.due_date && c.due_date < today).length;

  // Cumplimiento promedio por indicador, con los 8 más frecuentes.
  const groups = new Map<string, { n: number; sum: number; count: number }>();
  for (const i of ind.data ?? []) {
    const g = groups.get(i.name) ?? { n: 0, sum: 0, count: 0 };
    g.n += 1;
    if (i.target_value && i.current_value !== null) {
      g.sum += Number(i.current_value) / Number(i.target_value);
      g.count += 1;
    }
    groups.set(i.name, g);
  }
  const indicators = [...groups.entries()]
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, 8)
    .map(([nombre, g]) => ({
      nombre,
      registros: g.n,
      cumplimiento_promedio_pct: g.count ? Math.round((g.sum / g.count) * 100) : null,
    }));

  // Tendencia mensual de bienestar, últimos 6 meses con datos.
  const months = new Map<string, { sum: number; n: number }>();
  for (const w of wel.data ?? []) {
    const month = w.created_at.slice(0, 7);
    const m = months.get(month) ?? { sum: 0, n: 0 };
    m.sum += w.score;
    m.n += 1;
    months.set(month, m);
  }
  const trend = [...months.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([mes, m]) => ({ mes, promedio: Math.round((m.sum / m.n) * 10) / 10, respuestas: m.n }));

  const truncated = employees.length >= TEAM_LIMIT || blockers.length >= TEAM_LIMIT;
  const data = {
    personas: {
      total: employees.length,
      por_estado: countBy(employees, (x) => x.status),
      seguimiento_prioritario_o_recomendado: followUps.slice(0, 15),
    },
    indicadores_generales: indicators,
    bloqueos_abiertos: { total: blockers.length, por_categoria: countBy(blockers, (b) => b.category) },
    compromisos_abiertos: { total: commitments.length, vencidos: overdue },
    tendencia_bienestar_mensual: trend,
    nota_muestra: truncated ? `Se leyeron como máximo ${TEAM_LIMIT} registros por tabla.` : null,
  };

  const summary = [
    `${employees.length} personas en el equipo; ${followUps.length} con seguimiento prioritario o recomendado.`,
    `${blockers.length} bloqueos abiertos.`,
    `${commitments.length} compromisos abiertos, ${overdue} vencidos.`,
  ];

  return { scope: "team", data, summary };
}
