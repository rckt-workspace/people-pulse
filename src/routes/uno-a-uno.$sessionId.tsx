import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { InitialsAvatar, PageHeader, Panel, StatusBadge } from "@/components/pc/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/pc";
import {
  BLOCKER_CATEGORIES,
  BLOCKER_SEVERITIES,
  BLOCKER_STATUSES,
  COMMITMENT_PRIORITIES,
  COMMITMENT_RESPONSIBLES,
  NOTE_BLOCKS,
  QUESTION_CATEGORIES,
  RESPONSIBILITY_STATUSES,
  SESSION_TYPES,
  WELLBEING_DIMENSIONS,
  WIZARD_STEPS,
  labelFor,
  roleCategoryFor,
  scaleLabels,
  seedSessionQuestions,
  sessionQuery,
  splitResponsibilities,
} from "@/lib/sessions";

export const Route = createFileRoute("/uno-a-uno/$sessionId")({
  head: () => ({
    meta: [
      { title: "Registrar conversación 1:1 — People Hub" },
      {
        name: "description",
        content:
          "Asistente paso a paso para preparar, registrar y cerrar una conversación 1:1 con el equipo.",
      },
      { property: "og:title", content: "Registrar conversación 1:1 — People Hub" },
      {
        property: "og:description",
        content: "Asistente guiado de 7 pasos para registrar una conversación 1:1.",
      },
    ],
  }),
  component: SessionWizard,
});

type Draft = {
  sessionType: string;
  sessionDate: string;
  facilitator: string;
  notes: string;
  answers: Record<string, string>;
  wellbeing: Record<string, number>;
  wellbeingNotes: Record<string, string>;
  indicators: Record<string, string>;
  responsibilities: Record<string, { status: string; notes: string }>;
};

function SessionWizard() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(sessionQuery(sessionId));

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [customCategory, setCustomCategory] = useState(QUESTION_CATEGORIES[0]);
  const [newTopic, setNewTopic] = useState("");
  const initialised = useRef(false);
  const seeded = useRef(false);

  const employee = data?.employee as
    | {
        id: string;
        full_name: string;
        job_title: string;
        area: string;
        leader_name: string;
        evaluation_period: string;
        general_responsibilities: string | null;
      }
    | null
    | undefined;

  useEffect(() => {
    if (!data?.session || initialised.current) return;
    initialised.current = true;
    setStep(Math.min(Math.max(data.session.current_step || 1, 1), 7));
    const answers: Record<string, string> = {};
    for (const question of data.questions) answers[question.id] = question.answer ?? "";
    const wellbeing: Record<string, number> = {};
    const wellbeingNotes: Record<string, string> = {};
    for (const row of data.wellbeing.filter((item) => item.session_id === sessionId)) {
      wellbeing[row.dimension] = Number(row.score);
      if (row.notes) wellbeingNotes[row.dimension] = row.notes;
    }
    const indicators: Record<string, string> = {};
    for (const result of data.results.filter((item) => item.session_id === sessionId)) {
      indicators[result.indicator_id] = String(result.result_value ?? "");
    }
    const responsibilities: Record<string, { status: string; notes: string }> = {};
    for (const review of data.responsibilities) {
      responsibilities[review.responsibility_text] = {
        status: review.status,
        notes: review.notes ?? "",
      };
    }
    setDraft({
      sessionType: data.session.session_type,
      sessionDate: data.session.session_date,
      facilitator: data.session.facilitator ?? "People & Culture",
      notes: data.session.general_notes ?? "",
      answers,
      wellbeing,
      wellbeingNotes,
      indicators,
      responsibilities,
    });
  }, [data, sessionId]);

  useEffect(() => {
    if (!employee || !data || seeded.current) return;
    if (data.questions.length > 0) {
      seeded.current = true;
      return;
    }
    seeded.current = true;
    seedSessionQuestions(
      sessionId,
      employee.id,
      roleCategoryFor(employee.job_title, employee.area),
    ).then(() => queryClient.invalidateQueries({ queryKey: ["session", sessionId] }));
  }, [employee, data, sessionId, queryClient]);

  const responsibilities = useMemo(
    () => splitResponsibilities(employee?.general_responsibilities ?? null),
    [employee],
  );

  const previousSession = data?.history.find(
    (item) => item.id !== sessionId && item.status === "completed",
  );

  async function persist(nextStep = step) {
    if (!draft || !data) return;
    setSaving(true);
    try {
      await supabase
        .from("sessions")
        .update({
          session_type: draft.sessionType,
          session_date: draft.sessionDate,
          facilitator: draft.facilitator,
          general_notes: draft.notes,
          current_step: nextStep,
        })
        .eq("id", sessionId);

      const changed = data.questions.filter(
        (question) => (question.answer ?? "") !== (draft.answers[question.id] ?? ""),
      );
      for (const question of changed) {
        await supabase
          .from("session_questions")
          .update({ answer: draft.answers[question.id] ?? "" })
          .eq("id", question.id);
      }
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  }

  async function saveWellbeing(dimension: string, score: number, notes?: string) {
    if (!employee) return;
    const existing = data?.wellbeing.find(
      (item) => item.session_id === sessionId && item.dimension === dimension,
    );
    if (existing) {
      await supabase
        .from("wellbeing_responses")
        .update({ score, notes: notes ?? existing.notes })
        .eq("id", existing.id);
    } else {
      await supabase.from("wellbeing_responses").insert({
        session_id: sessionId,
        employee_id: employee.id,
        dimension,
        score,
        notes: notes ?? null,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
  }

  const finish = useMutation({
    mutationFn: async () => {
      if (!draft || !employee || !data) throw new Error("missing");
      await persist(7);

      // wellbeing average
      const scores = Object.values(draft.wellbeing);
      const wellbeingScore = scores.length
        ? Number((scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(2))
        : null;

      // indicator results
      const compliances: number[] = [];
      for (const indicator of data.indicators) {
        const raw = draft.indicators[indicator.id];
        if (raw === undefined || raw === "") continue;
        const value = Number(raw);
        if (Number.isNaN(value)) continue;
        const target = Number(indicator.target_value ?? 0);
        let compliance = 100;
        if (target > 0) {
          compliance =
            indicator.direction === "lower_better"
              ? Math.max(0, Math.min(150, (target / Math.max(value, 0.0001)) * 100))
              : Math.max(0, Math.min(150, (value / target) * 100));
        }
        compliances.push(compliance);
        const status = compliance >= 100 ? "cumplido" : compliance >= 85 ? "en_riesgo" : "no_cumplido";
        const existing = data.results.find(
          (item) => item.session_id === sessionId && item.indicator_id === indicator.id,
        );
        if (existing) {
          await supabase
            .from("indicator_results")
            .update({
              result_value: value,
              compliance_percentage: Number(compliance.toFixed(1)),
              status,
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("indicator_results").insert({
            indicator_id: indicator.id,
            employee_id: employee.id,
            session_id: sessionId,
            period_label: employee.evaluation_period,
            result_value: value,
            compliance_percentage: Number(compliance.toFixed(1)),
            status,
          });
        }
        await supabase
          .from("indicators")
          .update({ current_value: value })
          .eq("id", indicator.id);
      }
      const compliance = compliances.length
        ? Number(
            (compliances.reduce((sum, value) => sum + value, 0) / compliances.length).toFixed(1),
          )
        : null;

      // responsibility reviews
      for (const [text, review] of Object.entries(draft.responsibilities)) {
        const existing = data.responsibilities.find((item) => item.responsibility_text === text);
        if (existing) {
          await supabase
            .from("responsibility_reviews")
            .update({ status: review.status, notes: review.notes })
            .eq("id", existing.id);
        } else {
          await supabase.from("responsibility_reviews").insert({
            employee_id: employee.id,
            session_id: sessionId,
            responsibility_text: text,
            status: review.status,
            notes: review.notes,
          });
        }
      }

      await supabase
        .from("sessions")
        .update({
          status: "completed",
          approved: true,
          wellbeing_score: wellbeingScore,
          compliance_percentage: compliance,
        })
        .eq("id", sessionId);

      const nextFollowup = new Date(`${draft.sessionDate}T00:00:00Z`);
      nextFollowup.setUTCDate(nextFollowup.getUTCDate() + 30);
      await supabase
        .from("employees")
        .update({
          last_session_date: draft.sessionDate,
          next_followup_date: nextFollowup.toISOString().slice(0, 10),
          ...(wellbeingScore !== null ? { wellbeing_score: wellbeingScore } : {}),
          ...(compliance !== null ? { compliance_percentage: compliance } : {}),
        })
        .eq("id", employee.id);
    },
    onSuccess: () => {
      toast.success("Sesión guardada y cerrada.");
      queryClient.invalidateQueries();
      navigate({ to: "/sesiones/$id", params: { id: sessionId } });
    },
    onError: () => toast.error("No fue posible cerrar la sesión."),
  });

  if (isLoading || !draft || !employee) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" /> Cargando sesión…
      </div>
    );
  }

  const update = (patch: Partial<Draft>) => setDraft((prev) => (prev ? { ...prev, ...patch } : prev));

  const answeredCount = Object.values(draft.answers).filter((value) => value.trim()).length;
  const sessionBlockers = (data?.blockers ?? []).filter((item) => item.session_id === sessionId);
  const openHistoricBlockers = (data?.blockers ?? []).filter(
    (item) => item.session_id !== sessionId && item.status !== "resuelto",
  );
  const openCommitments = (data?.commitments ?? []).filter(
    (item) => item.status !== "cumplido" && item.status !== "cancelado",
  );
  const sessionCommitments = (data?.commitments ?? []).filter(
    (item) => item.session_id === sessionId,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`1:1 con ${employee.full_name}`}
        subtitle={`${employee.job_title} · ${employee.area} · Periodo ${employee.evaluation_period}`}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {saving
                ? "Guardando…"
                : savedAt
                  ? `Guardado ${savedAt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`
                  : "Borrador"}
            </span>
            <Button variant="outline" size="sm" onClick={() => persist()}>
              <Save className="mr-1.5 size-4" />
              Guardar borrador
            </Button>
          </div>
        }
      />

      <ol className="flex flex-wrap gap-2">
        {WIZARD_STEPS.map((label, index) => {
          const value = index + 1;
          const state = value === step ? "current" : value < step ? "done" : "todo";
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  state === "current"
                    ? "border-primary bg-primary text-primary-foreground"
                    : state === "done"
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {value}. {label}
              </button>
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel
            title="Contexto de la persona"
            description="Información previa para preparar la conversación."
            className="lg:col-span-2"
          >
            <div className="flex items-center gap-3">
              <InitialsAvatar name={employee.full_name} size="lg" />
              <div>
                <p className="font-medium">{employee.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  Responsable: {employee.leader_name}
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Última sesión
                </p>
                <p className="text-sm">
                  {previousSession ? formatDate(previousSession.session_date) : "Sin sesiones previas"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Compromisos abiertos
                </p>
                <p className="text-sm">{openCommitments.length}</p>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Bloqueos abiertos previos
              </p>
              {openHistoricBlockers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin bloqueos abiertos.</p>
              ) : (
                <ul className="space-y-2">
                  {openHistoricBlockers.map((blocker) => (
                    <li key={blocker.id} className="rounded-lg border border-border p-3 text-sm">
                      <span className="font-medium">{blocker.category}</span> — {blocker.description}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({labelFor(BLOCKER_STATUSES, blocker.status)})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-5 space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Formación en curso
              </p>
              {(data?.courses ?? []).filter((course) => course.status === "en_curso").length ===
              0 ? (
                <p className="text-sm text-muted-foreground">Sin formación activa.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {(data?.courses ?? [])
                    .filter((course) => course.status === "en_curso")
                    .map((course) => (
                      <li key={course.id}>
                        {course.course_name} · {course.progress}%
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </Panel>

          <Panel title="Datos de la sesión">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={draft.sessionDate}
                  onChange={(event) => update({ sessionDate: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de sesión</Label>
                <Select
                  value={draft.sessionType}
                  onValueChange={(value) => update({ sessionType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Facilitador</Label>
                <Input
                  value={draft.facilitator}
                  onChange={(event) => update({ facilitator: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Temas a tratar</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTopic}
                    placeholder="Añadir tema"
                    onChange={(event) => setNewTopic(event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      if (!newTopic.trim()) return;
                      await supabase
                        .from("session_topics")
                        .insert({ session_id: sessionId, topic: newTopic.trim() });
                      setNewTopic("");
                      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
                    }}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {(data?.topics ?? []).map((topic) => (
                    <li
                      key={topic.id}
                      className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-sm"
                    >
                      {topic.topic}
                      <button
                        type="button"
                        aria-label="Quitar tema"
                        onClick={async () => {
                          await supabase.from("session_topics").delete().eq("id", topic.id);
                          queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
                        }}
                      >
                        <X className="size-3.5 text-muted-foreground" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Panel
            title="Preguntas de la conversación"
            description={`${answeredCount} de ${data?.questions.length ?? 0} respondidas. Ninguna respuesta es obligatoria.`}
          >
            <div className="space-y-6">
              {["General", "Desarrollo", "Formación"].map((group) => {
                const items = (data?.questions ?? []).filter(
                  (question) => question.source === "fixed" && question.category === group,
                );
                if (items.length === 0) return null;
                return (
                  <section key={group} className="space-y-3">
                    <h3 className="text-sm font-semibold">{group}</h3>
                    {items.map((question) => (
                      <QuestionField
                        key={question.id}
                        label={question.question_text}
                        value={draft.answers[question.id] ?? ""}
                        onChange={(value) =>
                          update({ answers: { ...draft.answers, [question.id]: value } })
                        }
                        onBlur={() => persist()}
                      />
                    ))}
                  </section>
                );
              })}

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">
                  Preguntas según rol y responsabilidades
                </h3>
                {(data?.questions ?? [])
                  .filter((question) => question.source === "role")
                  .map((question) => (
                    <QuestionField
                      key={question.id}
                      label={question.question_text}
                      badge={question.category ?? undefined}
                      value={draft.answers[question.id] ?? ""}
                      onChange={(value) =>
                        update({ answers: { ...draft.answers, [question.id]: value } })
                      }
                      onBlur={() => persist()}
                    />
                  ))}
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Preguntas personalizadas</h3>
                {(data?.questions ?? [])
                  .filter((question) => question.source === "custom")
                  .map((question) => (
                    <QuestionField
                      key={question.id}
                      label={question.question_text}
                      badge={question.category ?? undefined}
                      value={draft.answers[question.id] ?? ""}
                      onChange={(value) =>
                        update({ answers: { ...draft.answers, [question.id]: value } })
                      }
                      onBlur={() => persist()}
                    />
                  ))}
                <div className="flex flex-wrap gap-2">
                  <Input
                    className="max-w-md"
                    placeholder="Escribe una pregunta nueva"
                    value={customQuestion}
                    onChange={(event) => setCustomQuestion(event.target.value)}
                  />
                  <Select value={customCategory} onValueChange={setCustomCategory}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUESTION_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!customQuestion.trim()) return;
                      await supabase.from("session_questions").insert({
                        session_id: sessionId,
                        employee_id: employee.id,
                        question_text: customQuestion.trim(),
                        category: customCategory,
                        source: "custom",
                        sort_order: (data?.questions.length ?? 0) + 1,
                      });
                      setCustomQuestion("");
                      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
                    }}
                  >
                    <Plus className="mr-1.5 size-4" />
                    Añadir pregunta
                  </Button>
                </div>
              </section>
            </div>
          </Panel>

          <Panel
            title="Revisión de responsabilidades"
            description="Marca cómo se está cumpliendo cada responsabilidad del rol."
          >
            {responsibilities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Esta persona no tiene responsabilidades registradas en su ficha.
              </p>
            ) : (
              <ul className="space-y-3">
                {responsibilities.map((text) => {
                  const current = draft.responsibilities[text] ?? {
                    status: "not_evaluated",
                    notes: "",
                  };
                  return (
                    <li key={text} className="rounded-lg border border-border p-4">
                      <p className="text-sm">{text}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {RESPONSIBILITY_STATUSES.map((status) => (
                          <button
                            key={status.value}
                            type="button"
                            onClick={() =>
                              update({
                                responsibilities: {
                                  ...draft.responsibilities,
                                  [text]: { ...current, status: status.value },
                                },
                              })
                            }
                            className={`rounded-full border px-3 py-1 text-xs ${
                              current.status === status.value
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                      <Textarea
                        className="mt-3"
                        rows={2}
                        placeholder="Observaciones (opcional)"
                        value={current.notes}
                        onChange={(event) =>
                          update({
                            responsibilities: {
                              ...draft.responsibilities,
                              [text]: { ...current, notes: event.target.value },
                            },
                          })
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      )}

      {step === 3 && (
        <Panel
          title="Bienestar percibido"
          description="Escala 1 a 5. Ninguna dimensión es obligatoria."
        >
          <ul className="space-y-5">
            {WELLBEING_DIMENSIONS.map((dimension) => {
              const labels = scaleLabels(dimension.name);
              const value = draft.wellbeing[dimension.name];
              return (
                <li key={dimension.name} className="rounded-lg border border-border p-4">
                  <p className="text-sm font-medium">{dimension.name}</p>
                  <p className="text-xs text-muted-foreground">{dimension.question}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {labels.map((label, index) => {
                      const score = index + 1;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            update({
                              wellbeing: { ...draft.wellbeing, [dimension.name]: score },
                            });
                            saveWellbeing(dimension.name, score);
                          }}
                          className={`rounded-md border px-3 py-1.5 text-xs ${
                            value === score
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {score} · {label}
                        </button>
                      );
                    })}
                  </div>
                  <Textarea
                    className="mt-3"
                    rows={2}
                    placeholder="Comentario (opcional)"
                    value={draft.wellbeingNotes[dimension.name] ?? ""}
                    onChange={(event) =>
                      update({
                        wellbeingNotes: {
                          ...draft.wellbeingNotes,
                          [dimension.name]: event.target.value,
                        },
                      })
                    }
                    onBlur={() => {
                      if (draft.wellbeing[dimension.name]) {
                        saveWellbeing(
                          dimension.name,
                          draft.wellbeing[dimension.name],
                          draft.wellbeingNotes[dimension.name] ?? "",
                        );
                      }
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      {step === 4 && (
        <BlockersStep
          sessionId={sessionId}
          employeeId={employee.id}
          sessionBlockers={sessionBlockers}
          historicBlockers={openHistoricBlockers}
          onChange={() => queryClient.invalidateQueries({ queryKey: ["session", sessionId] })}
        />
      )}

      {step === 5 && (
        <Panel
          title="Indicadores del periodo"
          description="Registra el resultado alcanzado. El cumplimiento se calcula automáticamente."
        >
          {(data?.indicators ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Esta persona aún no tiene indicadores definidos.
            </p>
          ) : (
            <ul className="space-y-4">
              {(data?.indicators ?? []).map((indicator) => {
                const raw = draft.indicators[indicator.id] ?? "";
                const value = Number(raw);
                const target = Number(indicator.target_value ?? 0);
                const compliance =
                  raw === "" || Number.isNaN(value) || target <= 0
                    ? null
                    : indicator.direction === "lower_better"
                      ? (target / Math.max(value, 0.0001)) * 100
                      : (value / target) * 100;
                return (
                  <li key={indicator.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{indicator.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Meta: {indicator.target_value ?? "—"} {indicator.unit ?? ""} · Anterior:{" "}
                          {indicator.current_value ?? "—"} {indicator.unit ?? ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input
                          className="w-32"
                          type="number"
                          placeholder="Resultado"
                          value={raw}
                          onChange={(event) =>
                            update({
                              indicators: {
                                ...draft.indicators,
                                [indicator.id]: event.target.value,
                              },
                            })
                          }
                        />
                        {compliance !== null && (
                          <StatusBadge
                            tone={
                              compliance >= 100
                                ? "positive"
                                : compliance >= 85
                                  ? "warning"
                                  : "critical"
                            }
                          >
                            {Math.round(compliance)}%
                          </StatusBadge>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      )}

      {step === 6 && (
        <Panel title="Notas de la sesión" description="Notas libres, estructuradas por bloques.">
          <div className="mb-3 flex flex-wrap gap-2">
            {NOTE_BLOCKS.map((block) => (
              <Button
                key={block.label}
                size="sm"
                variant="outline"
                onClick={() => update({ notes: `${draft.notes}${block.text}` })}
              >
                {block.label}
              </Button>
            ))}
          </div>
          <Textarea
            rows={14}
            value={draft.notes}
            onChange={(event) => update({ notes: event.target.value })}
            onBlur={() => persist()}
            placeholder="Escribe aquí lo relevante de la conversación…"
          />
        </Panel>
      )}

      {step === 7 && (
        <div className="space-y-6">
          <ReviewStep
            draft={draft}
            data={data!}
            sessionId={sessionId}
            employeeId={employee.id}
            responsibilities={responsibilities}
          />
          <Panel
            title="Compromisos de la sesión"
            description="Acuerdos concretos derivados de la conversación."
          >
            <CommitmentsEditor
              sessionId={sessionId}
              employeeId={employee.id}
              commitments={sessionCommitments}
              onChange={() => queryClient.invalidateQueries({ queryKey: ["session", sessionId] })}
            />
          </Panel>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button
          variant="ghost"
          disabled={step === 1}
          onClick={() => {
            const next = step - 1;
            setStep(next);
            persist(next);
          }}
        >
          <ChevronLeft className="mr-1.5 size-4" />
          Anterior
        </Button>
        {step < 7 ? (
          <Button
            onClick={() => {
              const next = step + 1;
              setStep(next);
              persist(next);
            }}
          >
            Siguiente
            <ChevronRight className="ml-1.5 size-4" />
          </Button>
        ) : (
          <Button onClick={() => finish.mutate()} disabled={finish.isPending}>
            <Check className="mr-1.5 size-4" />
            Guardar y cerrar sesión
          </Button>
        )}
      </div>
    </div>
  );
}

function QuestionField({
  label,
  value,
  badge,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  badge?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-normal">{label}</Label>
        {badge && <StatusBadge tone="neutral">{badge}</StatusBadge>}
      </div>
      <Textarea
        rows={2}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
}

function BlockersStep({
  sessionId,
  employeeId,
  sessionBlockers,
  historicBlockers,
  onChange,
}: {
  sessionId: string;
  employeeId: string;
  sessionBlockers: { id: string; category: string; description: string | null; severity: string | null; status: string }[];
  historicBlockers: { id: string; category: string; description: string | null; status: string }[];
  onChange: () => void;
}) {
  const [category, setCategory] = useState(BLOCKER_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("media");
  const [status, setStatus] = useState("nuevo");

  return (
    <div className="space-y-6">
      <Panel title="Bloqueos detectados en esta sesión">
        {sessionBlockers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no has registrado bloqueos.</p>
        ) : (
          <ul className="space-y-2">
            {sessionBlockers.map((blocker) => (
              <li
                key={blocker.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
              >
                <div>
                  <span className="font-medium">{blocker.category}</span> — {blocker.description}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    tone={
                      blocker.severity === "alta"
                        ? "critical"
                        : blocker.severity === "media"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {labelFor(BLOCKER_SEVERITIES, blocker.severity)}
                  </StatusBadge>
                  <StatusBadge tone="neutral">{labelFor(BLOCKER_STATUSES, blocker.status)}</StatusBadge>
                  <button
                    type="button"
                    aria-label="Eliminar bloqueo"
                    onClick={async () => {
                      await supabase.from("blockers").delete().eq("id", blocker.id);
                      onChange();
                    }}
                  >
                    <X className="size-4 text-muted-foreground" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 grid gap-3 rounded-lg bg-muted/50 p-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOCKER_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Nivel</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOCKER_SEVERITIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Descripción</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOCKER_STATUSES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={async () => {
                if (!description.trim()) {
                  toast.error("Describe el bloqueo.");
                  return;
                }
                await supabase.from("blockers").insert({
                  session_id: sessionId,
                  employee_id: employeeId,
                  category,
                  description: description.trim(),
                  severity,
                  status,
                });
                setDescription("");
                onChange();
              }}
            >
              <Plus className="mr-1.5 size-4" />
              Añadir bloqueo
            </Button>
          </div>
        </div>
      </Panel>

      <Panel title="Bloqueos previos abiertos" description="Actualiza su estado si corresponde.">
        {historicBlockers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin bloqueos previos abiertos.</p>
        ) : (
          <ul className="space-y-2">
            {historicBlockers.map((blocker) => (
              <li
                key={blocker.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
              >
                <span>
                  <span className="font-medium">{blocker.category}</span> — {blocker.description}
                </span>
                <Select
                  value={blocker.status}
                  onValueChange={async (value) => {
                    await supabase.from("blockers").update({ status: value }).eq("id", blocker.id);
                    onChange();
                  }}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOCKER_STATUSES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function CommitmentsEditor({
  sessionId,
  employeeId,
  commitments,
  onChange,
}: {
  sessionId: string;
  employeeId: string;
  commitments: { id: string; description: string; responsible: string | null; due_date: string | null; priority: string | null }[];
  onChange: () => void;
}) {
  const [description, setDescription] = useState("");
  const [responsible, setResponsible] = useState(COMMITMENT_RESPONSIBLES[0]);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("media");

  return (
    <div className="space-y-4">
      {commitments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay compromisos en esta sesión.</p>
      ) : (
        <ul className="space-y-2">
          {commitments.map((commitment) => (
            <li
              key={commitment.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
            >
              <div>
                <p>{commitment.description}</p>
                <p className="text-xs text-muted-foreground">
                  {commitment.responsible} · Vence {formatDate(commitment.due_date)} ·{" "}
                  {labelFor(COMMITMENT_PRIORITIES, commitment.priority)}
                </p>
              </div>
              <button
                type="button"
                aria-label="Eliminar compromiso"
                onClick={async () => {
                  await supabase.from("commitments").delete().eq("id", commitment.id);
                  onChange();
                }}
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 rounded-lg bg-muted/50 p-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Compromiso</Label>
          <Textarea
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Responsable</Label>
          <Select value={responsible} onValueChange={setResponsible}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMMITMENT_RESPONSIBLES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Fecha límite</Label>
          <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Prioridad</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMMITMENT_PRIORITIES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            onClick={async () => {
              if (!description.trim()) {
                toast.error("Describe el compromiso.");
                return;
              }
              await supabase.from("commitments").insert({
                employee_id: employeeId,
                session_id: sessionId,
                description: description.trim(),
                responsible,
                due_date: dueDate || null,
                priority,
                origin: "1:1",
                status: "abierto",
              });
              setDescription("");
              setDueDate("");
              onChange();
            }}
          >
            <Plus className="mr-1.5 size-4" />
            Añadir compromiso
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({
  draft,
  data,
  sessionId,
  responsibilities,
}: {
  draft: Draft;
  data: NonNullable<Awaited<ReturnType<ReturnType<typeof sessionQuery>["queryFn"]>>>;
  sessionId: string;
  employeeId: string;
  responsibilities: string[];
}) {
  const answered = data.questions.filter((question) => (draft.answers[question.id] ?? "").trim());
  const wellbeingScores = Object.values(draft.wellbeing);
  const average = wellbeingScores.length
    ? wellbeingScores.reduce((sum, value) => sum + value, 0) / wellbeingScores.length
    : null;
  const sessionBlockers = data.blockers.filter((item) => item.session_id === sessionId);

  return (
    <Panel title="Revisión final" description="Verifica todo antes de cerrar la sesión.">
      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h3 className="text-sm font-semibold">Datos</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {draft.sessionType} · {formatDate(draft.sessionDate)} · {draft.facilitator}
          </p>
        </section>
        <section>
          <h3 className="text-sm font-semibold">Bienestar</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {average ? `${average.toFixed(1)} / 5 (${wellbeingScores.length} dimensiones)` : "Sin registrar"}
          </p>
        </section>
        <section className="md:col-span-2">
          <h3 className="text-sm font-semibold">Respuestas registradas ({answered.length})</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {answered.slice(0, 8).map((question) => (
              <li key={question.id} className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">{question.question_text}</p>
                <p>{draft.answers[question.id]}</p>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="text-sm font-semibold">Bloqueos ({sessionBlockers.length})</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {sessionBlockers.map((blocker) => (
              <li key={blocker.id}>
                {blocker.category} — {blocker.description}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="text-sm font-semibold">Indicadores</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {data.indicators.map((indicator) => (
              <li key={indicator.id}>
                {indicator.name}: {draft.indicators[indicator.id] || "sin registrar"}
              </li>
            ))}
          </ul>
        </section>
        <section className="md:col-span-2">
          <h3 className="text-sm font-semibold">Responsabilidades revisadas</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {responsibilities.map((text) => (
              <li key={text}>
                {text} —{" "}
                {labelFor(
                  RESPONSIBILITY_STATUSES,
                  draft.responsibilities[text]?.status ?? "not_evaluated",
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Panel>
  );
}
