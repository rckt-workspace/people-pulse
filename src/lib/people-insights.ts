import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/pc";

/* --------------------------------- Tipos --------------------------------- */

export const ALL = "todos";

export type Period = "1m" | "3m" | "6m" | "all";

export type InsightFilters = {
  period: Period;
  area: string;
  leader: string;
  role: string;
};

export type InsightEmployee = {
  id: string;
  full_name: string;
  job_title: string;
  area: string;
  leader_name: string;
  status: string;
  next_followup_date: string | null;
};

type SessionRow = { id: string; session_date: string };
type WellbeingRow = { employee_id: string; score: number; session_id: string | null; created_at: string };
type ResultRow = {
  employee_id: string;
  compliance_percentage: number | null;
  session_id: string | null;
  created_at: string;
};
type BlockerRow = {
  employee_id: string | null;
  category: string;
  status: string;
  session_id: string | null;
  created_at: string;
};
type CommitmentRow = {
  employee_id: string;
  status: string;
  due_date: string | null;
  session_id: string | null;
  created_at: string;
};
type CourseRow = { employee_id: string; course_type: string; status: string; created_at: string };
type DevelopmentRow = { employee_id: string; period_month: string; total_score: number };

export type InsightsData = {
  employees: InsightEmployee[];
  sessions: SessionRow[];
  wellbeing: WellbeingRow[];
  results: ResultRow[];
  blockers: BlockerRow[];
  commitments: CommitmentRow[];
  courses: CourseRow[];
  development: DevelopmentRow[];
  // Nombres de las tablas que no se pudieron cargar. Los datos parciales se muestran igualmente.
  failedSources: string[];
};

export type Signal = {
  title: string;
  evidence: string;
  tone: "critical" | "warning" | "info";
};

export type Insights = {
  referenceDay: string | null;
  employeeCount: number;
  kpis: {
    wellbeing: number | null;
    compliance: number | null;
    followUps: number;
    openBlockers: number;
    openCommitments: number;
    overdueCommitments: number;
    developmentIndex: number | null;
  };
  wellbeingTrend: { label: string; promedio: number; n: number }[];
  compliance: { label: string; valor: number; tone: "positive" | "warning" | "critical" }[];
  blockers: { name: string; valor: number }[];
  developmentTrend: { label: string; promedio: number }[] | null;
  training: {
    assigned: number;
    autonomous: number;
    completed: number;
    inProgress: number;
    completionRate: number | null;
  };
  signals: Signal[];
};

/* ------------------------------- Umbrales ---------------------------------- */

// Reglas simples y explícitas. Cada señal muestra la evidencia que la activó.
export const THRESHOLDS = {
  wellbeingLow: 3.5,
  complianceLow: 85,
  openBlockersHigh: 2,
  signalsMax: 5,
  wellbeingMonthsMax: 6,
} as const;

/* -------------------------------- Consulta --------------------------------- */

function take<T>(name: string, result: PromiseSettledResult<unknown>, failed: string[]): T[] {
  if (result.status === "rejected") {
    failed.push(name);
    return [];
  }
  const { data, error } = result.value as { data: T[] | null; error: unknown };
  if (error) {
    failed.push(name);
    return [];
  }
  return data ?? [];
}

export const peopleInsightsQuery = {
  queryKey: ["people-insights"],
  queryFn: async (): Promise<InsightsData> => {
    const settled = await Promise.allSettled([
      supabase.from("employees").select("id, full_name, job_title, area, leader_name, status, next_followup_date"),
      supabase.from("sessions").select("id, session_date"),
      supabase.from("wellbeing_responses").select("employee_id, score, session_id, created_at"),
      supabase.from("indicator_results").select("employee_id, compliance_percentage, session_id, created_at"),
      supabase.from("blockers").select("employee_id, category, status, session_id, created_at"),
      supabase.from("commitments").select("employee_id, status, due_date, session_id, created_at"),
      supabase.from("courses").select("employee_id, course_type, status, created_at"),
      supabase.from("development_index_history").select("employee_id, period_month, total_score"),
    ]);

    const failed: string[] = [];
    const data: InsightsData = {
      employees: take<InsightEmployee>("employees", settled[0]!, failed),
      sessions: take<SessionRow>("sessions", settled[1]!, failed),
      wellbeing: take<WellbeingRow>("wellbeing_responses", settled[2]!, failed),
      results: take<ResultRow>("indicator_results", settled[3]!, failed),
      blockers: take<BlockerRow>("blockers", settled[4]!, failed),
      commitments: take<CommitmentRow>("commitments", settled[5]!, failed),
      courses: take<CourseRow>("courses", settled[6]!, failed),
      development: take<DevelopmentRow>("development_index_history", settled[7]!, failed),
      failedSources: failed,
    };

    if (failed.length === settled.length) {
      throw new Error("No se pudieron cargar los datos de People Insights.");
    }
    return data;
  },
};

/* ------------------------------- Utilidades -------------------------------- */

const round1 = (value: number) => Math.round(value * 10) / 10;

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

// Última fecha de negocio disponible, por prioridad: session_date, period_month del índice de
// desarrollo y, por último, fechas de registro. Nunca usa la fecha actual del sistema; null si no hay ninguna.
export function referenceDay(data: InsightsData): string | null {
  const latest = (days: string[]) => [...days].sort()[days.length - 1] ?? null;
  return (
    latest(data.sessions.map((s) => s.session_date)) ??
    latest(data.development.map((d) => d.period_month.slice(0, 10))) ??
    latest(
      [
        ...data.wellbeing,
        ...data.results,
        ...data.blockers,
        ...data.commitments,
        ...data.courses,
      ].map((r) => r.created_at.slice(0, 10)),
    )
  );
}

function periodStart(period: Period, reference: string | null): string | null {
  if (period === "all" || reference === null) return null;
  const months = period === "1m" ? 1 : period === "3m" ? 3 : 6;
  const date = new Date(`${reference}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() - months);
  return isoDay(date);
}

function monthLabel(key: string) {
  return new Intl.DateTimeFormat("es-ES", { month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${key}-01T00:00:00Z`),
  );
}

/* ---------------------------- Compromisos ----------------------------- */

// Estados que nunca cuentan como abiertos. "vencido" se cuenta solo como vencido, para no duplicar.
const NOT_OPEN_COMMITMENT_STATUS = new Set(["cumplido", "completado", "vencido"]);

// Fecha de referencia de negocio. Null si no hay ninguna; nunca se compara con la fecha del sistema.
function isPastDue(c: Pick<CommitmentRow, "status" | "due_date">, reference: string | null) {
  return c.status === "abierto" && c.due_date !== null && reference !== null && c.due_date < reference;
}

// Vencido = marcado como vencido, o abierto con fecha límite anterior a la referencia.
export function isCommitmentOverdue(c: Pick<CommitmentRow, "status" | "due_date">, reference: string | null) {
  return c.status === "vencido" || isPastDue(c, reference);
}

// Abierto = no cerrado ni vencido; si está "abierto" con fecha, la fecha debe ser >= referencia.
export function isCommitmentOpen(c: Pick<CommitmentRow, "status" | "due_date">, reference: string | null) {
  if (NOT_OPEN_COMMITMENT_STATUS.has(c.status)) return false;
  return c.status !== "abierto" || c.due_date === null || reference === null || c.due_date >= reference;
}

export function formatScore(value: number | null, suffix = "") {
  return value === null ? "—" : `${round1(value)}${suffix}`;
}

/* --------------------------------- Cálculo --------------------------------- */

export function computeInsights(data: InsightsData, filters: InsightFilters): Insights {
  const reference = referenceDay(data);
  const start = periodStart(filters.period, reference);
  const inPeriod = (day: string) => start === null || day >= start;

  const sessionDay = new Map(data.sessions.map((s) => [s.id, s.session_date]));
  const dayOf = (sessionId: string | null, createdAt: string) =>
    (sessionId ? sessionDay.get(sessionId) : undefined) ?? createdAt.slice(0, 10);

  const employees = data.employees.filter(
    (e) =>
      (filters.area === ALL || e.area === filters.area) &&
      (filters.leader === ALL || e.leader_name === filters.leader) &&
      (filters.role === ALL || e.job_title === filters.role),
  );
  const ids = new Set(employees.map((e) => e.id));
  const nameOf = new Map(employees.map((e) => [e.id, e.full_name]));

  const wellbeing = data.wellbeing.filter(
    (w) => ids.has(w.employee_id) && inPeriod(dayOf(w.session_id, w.created_at)),
  );
  const results = data.results.filter(
    (r) => ids.has(r.employee_id) && inPeriod(dayOf(r.session_id, r.created_at)),
  );
  const blockers = data.blockers.filter(
    (b) => b.employee_id !== null && ids.has(b.employee_id) && inPeriod(dayOf(b.session_id, b.created_at)),
  );
  const commitments = data.commitments.filter(
    (c) => ids.has(c.employee_id) && inPeriod(dayOf(c.session_id, c.created_at)),
  );
  const courses = data.courses.filter((c) => ids.has(c.employee_id) && inPeriod(c.created_at.slice(0, 10)));
  const development = data.development.filter(
    (d) => ids.has(d.employee_id) && inPeriod(d.period_month.slice(0, 10)),
  );

  const openBlockers = blockers.filter((b) => b.status !== "resuelto");
  const openCommitments = commitments.filter((c) => isCommitmentOpen(c, reference));
  const overdueCommitments = commitments.filter((c) => isCommitmentOverdue(c, reference));
  const compliances = results.map((r) => r.compliance_percentage).filter((v): v is number => v !== null);
  const wellbeingScores = wellbeing.map((w) => Number(w.score));

  const kpis = {
    wellbeing: average(wellbeingScores),
    compliance: average(compliances),
    followUps: employees.filter((e) => e.status !== "normal").length,
    openBlockers: openBlockers.length,
    openCommitments: openCommitments.length,
    overdueCommitments: overdueCommitments.length,
    developmentIndex: average(development.map((d) => Number(d.total_score))),
  };

  // Tendencia de bienestar por mes de sesión (últimos 6 meses con datos).
  const byMonth = (rows: { day: string; value: number }[]) => {
    const groups = new Map<string, number[]>();
    for (const row of rows) {
      const key = row.day.slice(0, 7);
      groups.set(key, [...(groups.get(key) ?? []), row.value]);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, values]) => ({ key, promedio: average(values) ?? 0, n: values.length }));
  };

  const wellbeingTrend = byMonth(
    wellbeing.map((w) => ({ day: dayOf(w.session_id, w.created_at), value: Number(w.score) })),
  )
    .slice(-THRESHOLDS.wellbeingMonthsMax)
    .map((m) => ({ label: monthLabel(m.key), promedio: round1(m.promedio), n: m.n }));

  const compliance = [
    { label: "Cumple / supera", min: 100, max: Infinity, tone: "positive" as const },
    { label: "En riesgo", min: 85, max: 100, tone: "warning" as const },
    { label: "Requiere atención", min: -Infinity, max: 85, tone: "critical" as const },
  ].map((bucket) => ({
    label: bucket.label,
    valor: compliances.filter((v) => v >= bucket.min && v < bucket.max).length,
    tone: bucket.tone,
  }));

  const blockerCounts = new Map<string, number>();
  for (const b of openBlockers) blockerCounts.set(b.category, (blockerCounts.get(b.category) ?? 0) + 1);
  const blockersChart = [...blockerCounts.entries()]
    .map(([name, valor]) => ({ name, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 6);

  const developmentMonths = byMonth(development.map((d) => ({ day: d.period_month, value: Number(d.total_score) })));
  const developmentTrend =
    developmentMonths.length >= 2
      ? developmentMonths.map((m) => ({ label: monthLabel(m.key), promedio: round1(m.promedio) }))
      : null;

  const completed = courses.filter((c) => c.status === "completado").length;
  const training = {
    assigned: courses.filter((c) => c.course_type === "assigned").length,
    autonomous: courses.filter((c) => c.course_type === "autonomous").length,
    completed,
    inProgress: courses.filter((c) => c.status === "en_curso").length,
    completionRate: courses.length ? Math.round((completed / courses.length) * 100) : null,
  };

  // Señales por persona, con la evidencia que las activa.
  const signals: Signal[] = [];
  for (const e of employees.filter((x) => x.status === "seguimiento_prioritario")) {
    const when = e.next_followup_date ? ` · próximo seguimiento ${formatDate(e.next_followup_date)}` : "";
    signals.push({
      title: `${e.full_name}: seguimiento prioritario`,
      evidence: `Estado del colaborador${when}.`,
      tone: "critical",
    });
  }
  for (const e of employees.filter((x) => x.status === "seguimiento_recomendado")) {
    signals.push({
      title: `${e.full_name}: seguimiento recomendado`,
      evidence: "Estado del colaborador.",
      tone: "warning",
    });
  }
  for (const id of ids) {
    const overdue = overdueCommitments.filter((c) => c.employee_id === id).length;
    if (overdue > 0) {
      signals.push({
        title: `${nameOf.get(id) ?? "Colaborador"}: compromisos vencidos`,
        evidence: `${overdue} compromiso(s) vencido(s) a la fecha de referencia ${reference ?? "sin fecha disponible"}.`,
        tone: "critical",
      });
    }
  }
  for (const id of ids) {
    const open = openBlockers.filter((b) => b.employee_id === id);
    if (open.length >= THRESHOLDS.openBlockersHigh) {
      const categories = [...new Set(open.map((b) => b.category))].join(", ");
      signals.push({
        title: `${nameOf.get(id) ?? "Colaborador"}: bloqueos abiertos`,
        evidence: `${open.length} bloqueos abiertos (${categories}).`,
        tone: "warning",
      });
    }
  }
  for (const id of ids) {
    const scores = wellbeing.filter((w) => w.employee_id === id).map((w) => Number(w.score));
    const avg = average(scores);
    if (avg !== null && avg < THRESHOLDS.wellbeingLow) {
      signals.push({
        title: `${nameOf.get(id) ?? "Colaborador"}: bienestar bajo`,
        evidence: `Bienestar medio ${round1(avg)}/5 en ${scores.length} respuesta(s).`,
        tone: "warning",
      });
    }
  }
  for (const id of ids) {
    const values = results
      .filter((r) => r.employee_id === id)
      .map((r) => r.compliance_percentage)
      .filter((v): v is number => v !== null);
    const avg = average(values);
    if (avg !== null && avg < THRESHOLDS.complianceLow) {
      signals.push({
        title: `${nameOf.get(id) ?? "Colaborador"}: cumplimiento bajo`,
        evidence: `Cumplimiento medio ${round1(avg)}% en ${values.length} indicador(es).`,
        tone: "warning",
      });
    }
  }

  return {
    referenceDay: reference,
    employeeCount: employees.length,
    kpis,
    wellbeingTrend,
    compliance,
    blockers: blockersChart,
    developmentTrend,
    training,
    signals: signals.slice(0, THRESHOLDS.signalsMax),
  };
}

export const EMPTY_FILTERS: InsightFilters = { period: "all", area: ALL, leader: ALL, role: ALL };
