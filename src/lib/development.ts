import { supabase } from "@/integrations/supabase/client";
import { indicatorCompliance, type Indicator } from "@/lib/pc";

/* --------------------------------- types --------------------------------- */

export type DevelopmentGoal = {
  id: string;
  employee_id: string;
  title: string;
  category: string | null;
  description: string | null;
  current_state: string | null;
  target_state: string | null;
  actions: string | null;
  related_indicators: string | null;
  related_courses: string | null;
  responsible: string | null;
  target_date: string | null;
  progress: number;
  status: string;
  created_at: string;
};

export type DevelopmentSuggestion = {
  id: string;
  employee_id: string;
  title: string;
  category: string | null;
  rationale: string | null;
  evidence: string | null;
  current_state: string | null;
  target_state: string | null;
  suggested_actions: string | null;
  status: string;
};

export type IndexHistoryPoint = {
  period_month: string;
  total_score: number;
};

export const GOAL_CATEGORIES = [
  "Competencias",
  "Habilidades técnicas",
  "Habilidades blandas",
  "Retos profesionales",
  "Necesidades del cliente",
  "Actualización del mercado",
  "Certificaciones",
  "Liderazgo",
  "Comunicación",
] as const;

export const GOAL_STATUSES = [
  { value: "no_iniciado", label: "No iniciado" },
  { value: "activo", label: "En progreso" },
  { value: "avanzado", label: "Avanzado" },
  { value: "completado", label: "Completado" },
  { value: "pausado", label: "Pausado" },
] as const;

export function goalStatusLabel(status: string) {
  return GOAL_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function goalStatusTone(status: string): "neutral" | "positive" | "warning" | "info" {
  if (status === "completado") return "positive";
  if (status === "pausado") return "warning";
  if (status === "no_iniciado") return "neutral";
  return "info";
}

/* -------------------------------- weights -------------------------------- */

export type IndexWeights = {
  performance: number;
  commitments: number;
  competencies: number;
  training: number;
  goals: number;
};

export const DEFAULT_WEIGHTS: IndexWeights = {
  performance: 30,
  commitments: 20,
  competencies: 20,
  training: 15,
  goals: 15,
};

export const WEIGHT_LABELS: Record<keyof IndexWeights, string> = {
  performance: "Desempeño / indicadores",
  commitments: "Compromisos completados",
  competencies: "Competencias (nivel actual/objetivo)",
  training: "Formación",
  goals: "Objetivos de desarrollo",
};

export const DEV_INDEX_DISCLAIMER =
  "Este indicador resume evolución observable a partir de desempeño, compromisos, competencias, formación y objetivos. No representa una evaluación psicológica ni una medida absoluta del potencial de la persona.";

export const weightsQuery = {
  queryKey: ["development-weights"],
  queryFn: async (): Promise<IndexWeights> => {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "development_index_weights")
      .maybeSingle();
    if (error) throw error;
    return { ...DEFAULT_WEIGHTS, ...((data?.value as Partial<IndexWeights>) ?? {}) };
  },
};

export async function saveWeights(weights: IndexWeights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (total !== 100) throw new Error("Los pesos deben sumar 100%.");
  const { error } = await supabase
    .from("app_settings")
    .upsert(
      { key: "development_index_weights", value: weights, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  if (error) throw error;
}

/* ------------------------------ index formula ----------------------------- */

export type IndexInput = {
  indicators: Indicator[];
  commitments: { status: string }[];
  competencies: { current_level: number | null; target_level: number | null }[];
  courses: { progress: number }[];
  goals: { progress: number }[];
};

export type IndexBreakdown = {
  subscores: Record<keyof IndexWeights, number | null>;
  weighted: Record<keyof IndexWeights, number>;
  total: number;
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const avg = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

export function computeDevelopmentIndex(
  input: IndexInput,
  weights: IndexWeights = DEFAULT_WEIGHTS,
): IndexBreakdown {
  const performance = avg(
    input.indicators
      .map((i) => indicatorCompliance(i))
      .filter((c): c is number => c !== null)
      .map(clamp),
  );

  const totalCommitments = input.commitments.length;
  const commitments = totalCommitments
    ? clamp(
        (input.commitments.filter((c) => c.status === "completado").length / totalCommitments) * 100,
      )
    : null;

  const competencies = avg(
    input.competencies
      .filter((c) => c.current_level !== null && c.target_level)
      .map((c) => clamp((Number(c.current_level) / Number(c.target_level)) * 100)),
  );

  const training = avg(input.courses.map((c) => clamp(Number(c.progress ?? 0))));
  const goals = avg(input.goals.map((g) => clamp(Number(g.progress ?? 0))));

  const subscores: Record<keyof IndexWeights, number | null> = {
    performance,
    commitments,
    competencies,
    training,
    goals,
  };

  // Reparte el peso de las dimensiones sin datos entre las disponibles.
  const availableWeight = (Object.keys(weights) as (keyof IndexWeights)[])
    .filter((k) => subscores[k] !== null)
    .reduce((sum, k) => sum + weights[k], 0);

  const weighted = {} as Record<keyof IndexWeights, number>;
  let total = 0;
  for (const key of Object.keys(weights) as (keyof IndexWeights)[]) {
    const score = subscores[key];
    const value =
      score === null || availableWeight === 0
        ? 0
        : (score * weights[key]) / (availableWeight === 100 ? 100 : availableWeight);
    weighted[key] = Math.round(value * 10) / 10;
    total += value;
  }

  return { subscores, weighted, total: Math.round(clamp(total)) };
}

/* -------------------------------- queries -------------------------------- */

export function developmentQuery(employeeId: string) {
  return {
    queryKey: ["development", employeeId],
    queryFn: async () => {
      const [goals, suggestions, competencies, courses, commitments, indicators, history] =
        await Promise.all([
          supabase
            .from("development_goals")
            .select("*")
            .eq("employee_id", employeeId)
            .order("created_at"),
          supabase
            .from("development_suggestions")
            .select("*")
            .eq("employee_id", employeeId)
            .eq("status", "pendiente")
            .order("created_at", { ascending: false }),
          supabase.from("competencies").select("*").eq("employee_id", employeeId),
          supabase.from("courses").select("*").eq("employee_id", employeeId),
          supabase.from("commitments").select("status").eq("employee_id", employeeId),
          supabase.from("indicators").select("*").eq("employee_id", employeeId),
          supabase
            .from("development_index_history")
            .select("period_month, total_score")
            .eq("employee_id", employeeId)
            .order("period_month"),
        ]);

      const firstError =
        goals.error ??
        suggestions.error ??
        competencies.error ??
        courses.error ??
        commitments.error ??
        indicators.error ??
        history.error;
      if (firstError) throw firstError;

      return {
        goals: (goals.data ?? []) as DevelopmentGoal[],
        suggestions: (suggestions.data ?? []) as DevelopmentSuggestion[],
        competencies: (competencies.data ?? []) as {
          id: string;
          name: string;
          category: string | null;
          current_level: number | null;
          target_level: number | null;
        }[],
        courses: (courses.data ?? []) as { id: string; course_name: string; progress: number }[],
        commitments: (commitments.data ?? []) as { status: string }[],
        indicators: (indicators.data ?? []) as Indicator[],
        history: (history.data ?? []) as IndexHistoryPoint[],
      };
    },
  };
}

export const developmentOverviewQuery = {
  queryKey: ["development-overview"],
  queryFn: async () => {
    const [employees, goals] = await Promise.all([
      supabase.from("employees").select("*").order("full_name"),
      supabase.from("development_goals").select("*"),
    ]);
    if (employees.error) throw employees.error;
    if (goals.error) throw goals.error;
    return {
      employees: employees.data ?? [],
      goals: (goals.data ?? []) as DevelopmentGoal[],
    };
  },
};

/* ------------------------------- mutations ------------------------------- */

export type GoalInput = Omit<
  DevelopmentGoal,
  "id" | "created_at" | "employee_id"
> & { employee_id: string };

export async function upsertGoal(goal: Partial<GoalInput> & { id?: string }) {
  if (goal.id) {
    const { id, ...rest } = goal;
    const { error } = await supabase.from("development_goals").update(rest).eq("id", id);
    if (error) throw error;
    return id;
  }
  const { data, error } = await supabase
    .from("development_goals")
    .insert(goal as never)
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function deleteGoal(id: string) {
  const { error } = await supabase.from("development_goals").delete().eq("id", id);
  if (error) throw error;
}

export async function setSuggestionStatus(id: string, status: "añadida" | "descartada") {
  const { error } = await supabase.from("development_suggestions").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function saveIndexSnapshot(
  employeeId: string,
  breakdown: IndexBreakdown,
) {
  const now = new Date();
  const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const { error } = await supabase.from("development_index_history").upsert(
    {
      employee_id: employeeId,
      period_month: period,
      total_score: breakdown.total,
      performance_score: breakdown.weighted.performance,
      commitments_score: breakdown.weighted.commitments,
      competencies_score: breakdown.weighted.competencies,
      training_score: breakdown.weighted.training,
      goals_score: breakdown.weighted.goals,
    },
    { onConflict: "employee_id,period_month" },
  );
  if (error) throw error;
  const { error: empError } = await supabase
    .from("employees")
    .update({ development_index: breakdown.total })
    .eq("id", employeeId);
  if (empError) throw empError;
}
