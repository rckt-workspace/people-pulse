import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Compass, Info, Pencil, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  EmptyState,
  Panel,
  ProgressBar,
  StatusBadge,
} from "@/components/pc/primitives";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate } from "@/lib/pc";
import {
  DEV_INDEX_DISCLAIMER,
  GOAL_CATEGORIES,
  GOAL_STATUSES,
  WEIGHT_LABELS,
  computeDevelopmentIndex,
  deleteGoal,
  developmentQuery,
  goalStatusLabel,
  goalStatusTone,
  saveIndexSnapshot,
  setSuggestionStatus,
  upsertGoal,
  weightsQuery,
  type DevelopmentGoal,
  type IndexWeights,
} from "@/lib/development";
import { suggestDevelopmentOpportunities } from "@/lib/development.functions";

type GoalDraft = Partial<DevelopmentGoal> & { employee_id: string };

const emptyGoal = (employeeId: string): GoalDraft => ({
  employee_id: employeeId,
  title: "",
  category: GOAL_CATEGORIES[0],
  description: "",
  current_state: "",
  target_state: "",
  actions: "",
  related_indicators: "",
  related_courses: "",
  responsible: "Responsable directo",
  target_date: null,
  progress: 0,
  status: "no_iniciado",
});

export function DevelopmentPanel({
  employeeId,
  employeeName,
}: {
  employeeId: string;
  employeeName: string;
}) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(developmentQuery(employeeId));
  const { data: weights } = useQuery(weightsQuery);
  const [draft, setDraft] = useState<GoalDraft | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["development", employeeId] });
    void queryClient.invalidateQueries({ queryKey: ["development-overview"] });
    void queryClient.invalidateQueries({ queryKey: ["employee", employeeId] });
  };

  const saveGoal = useMutation({
    mutationFn: (goal: GoalDraft) => upsertGoal(goal),
    onSuccess: () => {
      toast.success("Objetivo guardado.");
      setDraft(null);
      refresh();
    },
    onError: () => toast.error("No fue posible guardar el objetivo."),
  });

  const removeGoal = useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: () => {
      toast.success("Objetivo eliminado.");
      refresh();
    },
  });

  const suggest = useMutation({
    mutationFn: () => suggestDevelopmentOpportunities({ data: { employeeId } }),
    onSuccess: () => setAiOpen(true),
    onError: () => toast.error("People AI no pudo generar sugerencias ahora."),
  });

  const decideSuggestion = useMutation({
    mutationFn: (input: { id: string; status: "añadida" | "descartada" }) =>
      setSuggestionStatus(input.id, input.status),
    onSuccess: refresh,
  });

  if (isLoading || !data) return <Skeleton className="h-64 w-full" />;

  const breakdown = computeDevelopmentIndex(
    {
      indicators: data.indicators,
      commitments: data.commitments,
      competencies: data.competencies,
      courses: data.courses,
      goals: data.goals,
    },
    weights,
  );

  const aiSuggestions = suggest.data ?? [];

  return (
    <div className="space-y-6">
      {/* Índice de desarrollo */}
      <Panel
        title="Índice de desarrollo"
        description="Cálculo ponderado a partir de datos reales del colaborador."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowBreakdown((v) => !v)}>
              ¿Cómo se calcula?
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                saveIndexSnapshot(employeeId, breakdown)
                  .then(() => {
                    toast.success("Índice guardado en el histórico mensual.");
                    refresh();
                  })
                  .catch(() => toast.error("No fue posible guardar el histórico."))
              }
            >
              Guardar en histórico
            </Button>
          </div>
        }
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl font-semibold tabular-nums">{breakdown.total}/100</span>
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="Qué mide este índice">
                  <Info className="size-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">{DEV_INDEX_DISCLAIMER}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <ProgressBar value={breakdown.total} className="mt-3" />

        {showBreakdown ? (
          <div className="mt-5 space-y-3 rounded-lg border border-border p-4">
            {(Object.keys(WEIGHT_LABELS) as (keyof IndexWeights)[]).map((key) => (
              <div key={key} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">
                  {WEIGHT_LABELS[key]} · {weights?.[key] ?? 0}%
                </span>
                <span className="tabular-nums">
                  {breakdown.subscores[key] === null
                    ? "sin datos"
                    : `${Math.round(breakdown.subscores[key]!)} → ${breakdown.weighted[key]} pts`}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-medium">
              <span>Total</span>
              <span className="tabular-nums">{breakdown.total}/100</span>
            </div>
            <p className="text-xs text-muted-foreground">{DEV_INDEX_DISCLAIMER}</p>
          </div>
        ) : null}

        {data.history.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {data.history.map((point) => (
              <span
                key={point.period_month}
                className="rounded-md bg-muted px-2 py-1 text-xs tabular-nums text-muted-foreground"
              >
                {point.period_month.slice(0, 7)} · {point.total_score}
              </span>
            ))}
          </div>
        ) : null}
      </Panel>

      {/* Sugerencias guardadas */}
      {data.suggestions.length ? (
        <Panel
          title="Sugerencias de People AI pendientes"
          description="Ninguna sugerencia se agrega automáticamente: requieren aprobación humana."
        >
          <div className="space-y-3">
            {data.suggestions.map((s) => (
              <div key={s.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{s.title}</p>
                  <StatusBadge tone="info">{s.category ?? "Desarrollo"}</StatusBadge>
                </div>
                <dl className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <div>
                    <dt className="inline font-medium text-foreground">Por qué: </dt>
                    <dd className="inline">{s.rationale}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground">Evidencia: </dt>
                    <dd className="inline">{s.evidence}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground">Estado actual: </dt>
                    <dd className="inline">{s.current_state}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground">Objetivo: </dt>
                    <dd className="inline">{s.target_state}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground">Acciones sugeridas: </dt>
                    <dd className="inline">{s.suggested_actions}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      saveGoal.mutate(
                        {
                          employee_id: employeeId,
                          title: s.title,
                          category: s.category ?? GOAL_CATEGORIES[0],
                          description: s.rationale,
                          current_state: s.current_state,
                          target_state: s.target_state,
                          actions: s.suggested_actions,
                          responsible: "Responsable directo",
                          progress: 0,
                          status: "no_iniciado",
                        },
                        {
                          onSuccess: () =>
                            decideSuggestion.mutate({ id: s.id, status: "añadida" }),
                        },
                      )
                    }
                  >
                    Añadir al plan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setDraft({
                        employee_id: employeeId,
                        title: s.title,
                        category: s.category ?? GOAL_CATEGORIES[0],
                        description: s.rationale,
                        current_state: s.current_state,
                        target_state: s.target_state,
                        actions: s.suggested_actions,
                        responsible: "Responsable directo",
                        progress: 0,
                        status: "no_iniciado",
                      })
                    }
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => decideSuggestion.mutate({ id: s.id, status: "descartada" })}
                  >
                    Descartar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {/* Objetivos */}
      <Panel
        title={`Plan de desarrollo de ${employeeName.split(" ")[0]}`}
        description="Objetivos con estado actual, estado esperado, acciones y progreso."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={suggest.isPending}
              onClick={() => suggest.mutate()}
            >
              <Sparkles className="mr-1.5 size-4" />
              {suggest.isPending ? "Analizando…" : "Sugerir oportunidades de desarrollo"}
            </Button>
            <Button size="sm" onClick={() => setDraft(emptyGoal(employeeId))}>
              Nuevo objetivo
            </Button>
          </div>
        }
      >
        {data.goals.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="Sin objetivos de desarrollo"
            description="Crea el primer objetivo o pide sugerencias a People AI."
          />
        ) : (
          <div className="space-y-3">
            {data.goals.map((goal) => (
              <article key={goal.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{goal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {goal.category} · Responsable: {goal.responsible ?? "—"} · Fecha objetivo:{" "}
                      {goal.target_date ? formatDate(goal.target_date) : "sin fecha"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge tone={goalStatusTone(goal.status)}>
                      {goalStatusLabel(goal.status)}
                    </StatusBadge>
                    <Button size="icon" variant="ghost" onClick={() => setDraft(goal)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeGoal.mutate(goal.id)}
                      aria-label="Eliminar objetivo"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                {goal.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{goal.description}</p>
                ) : null}
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <Field label="Estado actual" value={goal.current_state} />
                  <Field label="Estado esperado" value={goal.target_state} />
                  <Field label="Acciones" value={goal.actions} />
                  <Field label="Indicadores relacionados" value={goal.related_indicators} />
                  <Field label="Cursos relacionados" value={goal.related_courses} />
                </dl>
                <div className="mt-3 flex items-center gap-3">
                  <ProgressBar value={goal.progress} className="flex-1" />
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {goal.progress}%
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      {/* Competencias */}
      <Panel title="Competencias" description="Nivel actual frente al nivel objetivo.">
        {data.competencies.length === 0 ? (
          <EmptyState title="Sin competencias registradas" />
        ) : (
          <ul className="space-y-3">
            {data.competencies.map((c) => (
              <li key={c.id} className="flex items-center gap-4">
                <div className="w-56 shrink-0">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.category ?? "—"}</p>
                </div>
                <ProgressBar
                  value={
                    c.target_level
                      ? (Number(c.current_level ?? 0) / Number(c.target_level)) * 100
                      : 0
                  }
                  className="flex-1"
                />
                <span className="text-xs tabular-nums text-muted-foreground">
                  {c.current_level ?? "—"}/{c.target_level ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Diálogo de sugerencias generadas */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Oportunidades sugeridas por People AI</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Máximo 3 propuestas basadas en sesiones, bloqueos, indicadores, formación y compromisos.
            Ninguna se agrega al plan sin tu aprobación.
          </p>
          <div className="space-y-3">
            {aiSuggestions.length === 0 ? (
              <EmptyState title="Sin sugerencias por ahora" />
            ) : (
              aiSuggestions.map((s, index) => (
                <div key={`${s.title}-${index}`} className="rounded-lg border border-border p-4">
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.category}</p>
                  <dl className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <div>
                      <dt className="inline font-medium text-foreground">Por qué: </dt>
                      <dd className="inline">{s.rationale}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium text-foreground">Evidencia: </dt>
                      <dd className="inline">{s.evidence}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium text-foreground">Estado actual: </dt>
                      <dd className="inline">{s.current_state}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium text-foreground">Objetivo: </dt>
                      <dd className="inline">{s.target_state}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium text-foreground">Acciones sugeridas: </dt>
                      <dd className="inline">{s.suggested_actions}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        saveGoal.mutate({
                          employee_id: employeeId,
                          title: s.title,
                          category: s.category,
                          description: s.rationale,
                          current_state: s.current_state,
                          target_state: s.target_state,
                          actions: s.suggested_actions,
                          responsible: "Responsable directo",
                          progress: 0,
                          status: "no_iniciado",
                        })
                      }
                    >
                      Añadir al plan
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAiOpen(false);
                        setDraft({
                          employee_id: employeeId,
                          title: s.title,
                          category: s.category,
                          description: s.rationale,
                          current_state: s.current_state,
                          target_state: s.target_state,
                          actions: s.suggested_actions,
                          responsible: "Responsable directo",
                          progress: 0,
                          status: "no_iniciado",
                        });
                      }}
                    >
                      Editar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Formulario de objetivo */}
      <Dialog open={draft !== null} onOpenChange={(open) => (open ? null : setDraft(null))}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Editar objetivo" : "Nuevo objetivo"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!draft.title?.trim()) {
                  toast.error("El título es obligatorio.");
                  return;
                }
                saveGoal.mutate({ ...draft, target_date: draft.target_date || null });
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="goal-title">Título</Label>
                  <Input
                    id="goal-title"
                    value={draft.title ?? ""}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="goal-category">Categoría</Label>
                  <select
                    id="goal-category"
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={draft.category ?? GOAL_CATEGORIES[0]}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  >
                    {GOAL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="goal-status">Estado</Label>
                  <select
                    id="goal-status"
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={draft.status ?? "no_iniciado"}
                    onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                  >
                    {GOAL_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="goal-description">Descripción</Label>
                  <Textarea
                    id="goal-description"
                    value={draft.description ?? ""}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="goal-current">Estado actual</Label>
                  <Textarea
                    id="goal-current"
                    value={draft.current_state ?? ""}
                    onChange={(e) => setDraft({ ...draft, current_state: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="goal-target">Estado esperado</Label>
                  <Textarea
                    id="goal-target"
                    value={draft.target_state ?? ""}
                    onChange={(e) => setDraft({ ...draft, target_state: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="goal-actions">Acciones</Label>
                  <Textarea
                    id="goal-actions"
                    value={draft.actions ?? ""}
                    onChange={(e) => setDraft({ ...draft, actions: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="goal-indicators">Indicadores relacionados</Label>
                  <Input
                    id="goal-indicators"
                    value={draft.related_indicators ?? ""}
                    onChange={(e) => setDraft({ ...draft, related_indicators: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="goal-courses">Cursos relacionados</Label>
                  <Input
                    id="goal-courses"
                    value={draft.related_courses ?? ""}
                    onChange={(e) => setDraft({ ...draft, related_courses: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="goal-responsible">Responsable</Label>
                  <Input
                    id="goal-responsible"
                    value={draft.responsible ?? ""}
                    onChange={(e) => setDraft({ ...draft, responsible: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="goal-date">Fecha objetivo (opcional)</Label>
                  <Input
                    id="goal-date"
                    type="date"
                    value={draft.target_date ?? ""}
                    onChange={(e) => setDraft({ ...draft, target_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="goal-progress">Progreso: {draft.progress ?? 0}%</Label>
                  <input
                    id="goal-progress"
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    className="w-full accent-[var(--primary)]"
                    value={draft.progress ?? 0}
                    onChange={(e) => setDraft({ ...draft, progress: Number(e.target.value) })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveGoal.isPending}>
                  Guardar objetivo
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}
