import { createClient } from "@supabase/supabase-js";
import type { AiSuggestion } from "./development.functions";
import { chatWithOpenRouter, isOpenRouterConfigured } from "@/agent/providers/openrouter.provider.server";

type Ctx = {
  employee: {
    full_name: string;
    job_title: string;
    area: string;
    general_responsibilities: string | null;
    wellbeing_score: number | null;
    compliance_percentage: number | null;
  };
  indicators: { name: string; current_value: number | null; target_value: number | null; unit: string | null }[];
  blockers: { category: string; description: string | null; status: string }[];
  commitments: { description: string; status: string }[];
  courses: { course_name: string; progress: number; status: string }[];
  goals: { title: string }[];
  answers: { question_text: string; answer: string | null }[];
};

export function serverClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export async function buildContext(employeeId: string): Promise<Ctx | null> {
  const db = serverClient();
  const [employee, indicators, blockers, commitments, courses, goals, answers] = await Promise.all([
    db.from("employees").select("*").eq("id", employeeId).maybeSingle(),
    db.from("indicators").select("name, current_value, target_value, unit").eq("employee_id", employeeId),
    db.from("blockers").select("category, description, status").eq("employee_id", employeeId),
    db.from("commitments").select("description, status").eq("employee_id", employeeId),
    db.from("courses").select("course_name, progress, status").eq("employee_id", employeeId),
    db.from("development_goals").select("title").eq("employee_id", employeeId),
    db
      .from("session_questions")
      .select("question_text, answer")
      .eq("employee_id", employeeId)
      .not("answer", "is", null)
      .limit(12),
  ]);

  if (!employee.data) return null;
  return {
    employee: employee.data as Ctx["employee"],
    indicators: (indicators.data ?? []) as Ctx["indicators"],
    blockers: (blockers.data ?? []) as Ctx["blockers"],
    commitments: (commitments.data ?? []) as Ctx["commitments"],
    courses: (courses.data ?? []) as Ctx["courses"],
    goals: (goals.data ?? []) as Ctx["goals"],
    answers: (answers.data ?? []) as Ctx["answers"],
  };
}

const CATEGORIES = [
  "Competencias",
  "Habilidades técnicas",
  "Habilidades blandas",
  "Retos profesionales",
  "Necesidades del cliente",
  "Actualización del mercado",
  "Certificaciones",
  "Liderazgo",
  "Comunicación",
];

export async function askPeopleAi(ctx: Ctx): Promise<AiSuggestion[]> {
  if (!isOpenRouterConfigured()) return [];

  const prompt = `Eres People AI, copiloto de People & Culture. Propón máximo 3 oportunidades de desarrollo para esta persona, coherentes con su cargo real y basadas SOLO en la evidencia entregada. Español neutro, tono profesional y respetuoso, sin diagnósticos personales.

Datos:
${JSON.stringify(ctx, null, 1)}

Categorías válidas: ${CATEGORIES.join(", ")}.
Responde SOLO con JSON: {"suggestions":[{"title","category","rationale","evidence","current_state","target_state","suggested_actions"}]}`;

  const raw = await chatWithOpenRouter({
    messages: [{ role: "user", content: prompt }],
    responseFormat: { type: "json_object" },
    temperature: 0.2,
  });

  const parsed = JSON.parse(raw) as { suggestions?: AiSuggestion[] };
  return parsed.suggestions ?? [];
}

export function heuristicSuggestions(ctx: Ctx): AiSuggestion[] {
  const out: AiSuggestion[] = [];
  const first = ctx.employee.full_name.split(" ")[0];

  const openBlocker = ctx.blockers.find((b) => b.status !== "resuelto");
  if (openBlocker) {
    out.push({
      title: `Resolver el bloqueo de ${openBlocker.category.toLowerCase()}`,
      category: openBlocker.category === "Conocimiento" ? "Habilidades técnicas" : "Retos profesionales",
      rationale: `Es un bloqueo activo que condiciona el desempeño de ${first} en su rol de ${ctx.employee.job_title}.`,
      evidence: `Bloqueo ${openBlocker.status}: ${openBlocker.description ?? openBlocker.category}.`,
      current_state: "El bloqueo sigue abierto y se repite entre periodos.",
      target_state: "Bloqueo resuelto con un mecanismo acordado con el equipo.",
      suggested_actions: "Acordar responsable y fecha; revisar avance en el próximo 1:1.",
    });
  }

  const weakIndicator = ctx.indicators
    .filter((i) => i.target_value && i.current_value !== null)
    .sort(
      (a, b) =>
        Number(a.current_value) / Number(a.target_value) -
        Number(b.current_value) / Number(b.target_value),
    )[0];
  if (weakIndicator) {
    out.push({
      title: `Fortalecer ${weakIndicator.name.toLowerCase()}`,
      category: "Competencias",
      rationale: "El indicador está por debajo de la meta del periodo.",
      evidence: `${weakIndicator.name}: ${weakIndicator.current_value} de ${weakIndicator.target_value} ${weakIndicator.unit ?? ""}.`,
      current_state: "Resultado por debajo del objetivo definido.",
      target_state: "Indicador dentro del rango objetivo de forma sostenida.",
      suggested_actions: "Definir dos acciones concretas y medirlas quincenalmente.",
    });
  }

  const activeCourse = ctx.courses.find((c) => c.status !== "completado");
  if (activeCourse) {
    out.push({
      title: `Aplicar lo aprendido en ${activeCourse.course_name}`,
      category: "Actualización del mercado",
      rationale: "Hay formación en curso que aún no se traduce en práctica visible.",
      evidence: `${activeCourse.course_name} al ${activeCourse.progress}% de avance.`,
      current_state: "Formación avanzando sin aplicación documentada.",
      target_state: "Aprendizajes aplicados en una entrega real del rol.",
      suggested_actions: "Elegir un caso real de aplicación y compartir el resultado con el equipo.",
    });
  }

  return out.slice(0, 3);
}
