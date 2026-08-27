import { supabase } from "@/integrations/supabase/client";

export type EmployeeStatus = "normal" | "seguimiento_recomendado" | "seguimiento_prioritario";

export type Employee = {
  id: string;
  full_name: string;
  job_title: string;
  area: string;
  leader_name: string;
  evaluation_period: string;
  general_responsibilities: string | null;
  wellbeing_score: number | null;
  compliance_percentage: number | null;
  development_index: number | null;
  status: string;
  last_session_date: string | null;
  next_followup_date: string | null;
};

export type Indicator = {
  id: string;
  employee_id: string;
  name: string;
  description: string | null;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  weight: number | null;
};

export type IndicatorResult = {
  id: string;
  indicator_id: string;
  period_label: string | null;
  result_value: number | null;
  compliance_percentage: number | null;
  status: string | null;
};

export type Course = {
  id: string;
  course_name: string;
  platform: string | null;
  course_type: string;
  start_date: string | null;
  completion_date: string | null;
  progress: number;
  status: string;
  related_competency: string | null;
};

export type Session = {
  id: string;
  session_date: string;
  session_type: string;
  general_notes: string | null;
  wellbeing_score: number | null;
  compliance_percentage: number | null;
};

export type WellbeingResponse = {
  id: string;
  dimension: string;
  score: number;
  session_id: string | null;
};

export const STATUS_LABEL: Record<string, string> = {
  normal: "Normal",
  seguimiento_recomendado: "Seguimiento recomendado",
  seguimiento_prioritario: "Seguimiento prioritario",
};

export const INDICATOR_STATUS_LABEL: Record<string, string> = {
  cumplido: "Cumplido",
  en_riesgo: "En riesgo",
  no_cumplido: "No cumplido",
};

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function daysSince(date: string | null) {
  if (!date) return null;
  const diff = Date.now() - new Date(`${date}T00:00:00Z`).getTime();
  return Math.max(0, Math.round(diff / 86_400_000));
}

export function formatDate(date: string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function indicatorCompliance(indicator: Indicator) {
  if (!indicator.target_value || indicator.current_value === null) return null;
  return (Number(indicator.current_value) / Number(indicator.target_value)) * 100;
}

export function indicatorStatus(compliance: number | null): "cumplido" | "en_riesgo" | "no_cumplido" {
  if (compliance === null) return "en_riesgo";
  if (compliance >= 100) return "cumplido";
  if (compliance >= 85) return "en_riesgo";
  return "no_cumplido";
}

/* -------------------------------- queries -------------------------------- */

export const employeesQuery = {
  queryKey: ["employees"],
  queryFn: async (): Promise<Employee[]> => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("full_name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Employee[];
  },
};

export function employeeQuery(id: string) {
  return {
    queryKey: ["employee", id],
    queryFn: async () => {
      const [employee, indicators, results, courses, sessions, wellbeing, commitments] =
        await Promise.all([
          supabase.from("employees").select("*").eq("id", id).maybeSingle(),
          supabase.from("indicators").select("*").eq("employee_id", id).order("created_at"),
          supabase.from("indicator_results").select("*").eq("employee_id", id).order("created_at"),
          supabase.from("courses").select("*").eq("employee_id", id).order("created_at"),
          supabase
            .from("sessions")
            .select("*")
            .eq("employee_id", id)
            .order("session_date", { ascending: false }),
          supabase.from("wellbeing_responses").select("*").eq("employee_id", id),
          supabase.from("commitments").select("*").eq("employee_id", id),
        ]);

      const firstError =
        employee.error ??
        indicators.error ??
        results.error ??
        courses.error ??
        sessions.error ??
        wellbeing.error ??
        commitments.error;
      if (firstError) throw firstError;

      return {
        employee: employee.data as Employee | null,
        indicators: (indicators.data ?? []) as Indicator[],
        results: (results.data ?? []) as IndicatorResult[],
        courses: (courses.data ?? []) as Course[],
        sessions: (sessions.data ?? []) as Session[],
        wellbeing: (wellbeing.data ?? []) as WellbeingResponse[],
        commitments: (commitments.data ?? []) as { status: string }[],
      };
    },
  };
}

export const overviewQuery = {
  queryKey: ["overview"],
  queryFn: async () => {
    const [employees, wellbeing, blockers, courses, commitments] = await Promise.all([
      supabase.from("employees").select("*"),
      supabase.from("wellbeing_responses").select("dimension, score"),
      supabase.from("blockers").select("category"),
      supabase.from("courses").select("course_type, status, progress"),
      supabase.from("commitments").select("status"),
    ]);

    const firstError =
      employees.error ?? wellbeing.error ?? blockers.error ?? courses.error ?? commitments.error;
    if (firstError) throw firstError;

    return {
      employees: (employees.data ?? []) as Employee[],
      wellbeing: (wellbeing.data ?? []) as { dimension: string; score: number }[],
      blockers: (blockers.data ?? []) as { category: string }[],
      courses: (courses.data ?? []) as { course_type: string; status: string; progress: number }[],
      commitments: (commitments.data ?? []) as { status: string }[],
    };
  },
};
