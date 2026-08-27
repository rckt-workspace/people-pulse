import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  Compass,
  Info,
  MessageSquare,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  EmptyState,
  InitialsAvatar,
  KpiCard,
  Panel,
  ProgressBar,
  StatusBadge,
  Timeline,
  TimelineItem,
  employeeStatusTone,
  indicatorStatusTone,
} from "@/components/pc/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { createDraftSession } from "@/lib/sessions";
import {
  INDICATOR_STATUS_LABEL,
  STATUS_LABEL,
  daysSince,
  employeeQuery,
  formatDate,
  indicatorCompliance,
  indicatorStatus,
  type Course,
  type Indicator,
  type IndicatorResult,
} from "@/lib/pc";

export const Route = createFileRoute("/personas/$id")({
  head: () => ({
    meta: [
      { title: "Ficha del colaborador — People Hub" },
      {
        name: "description",
        content: "Resumen, indicadores, formación y bienestar del colaborador.",
      },
      { property: "og:title", content: "Ficha del colaborador — People Hub" },
      {
        property: "og:description",
        content: "Resumen, indicadores, formación y bienestar del colaborador.",
      },
    ],
  }),
  component: PersonaDetalle,
});

const soon = () => toast("Disponible en la siguiente fase.");

function PersonaDetalle() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery(employeeQuery(id));
  const navigate = useNavigate();
  const startSession = useMutation({
    mutationFn: () => createDraftSession(id),
    onSuccess: (sessionId) =>
      navigate({ to: "/uno-a-uno/$sessionId", params: { sessionId } }),
    onError: () => toast.error("No fue posible iniciar la sesión."),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const employee = data?.employee;
  if (!employee) {
    return (
      <EmptyState
        title="No encontramos a esta persona"
        description="Es posible que haya sido eliminada del directorio."
        action={
          <Button asChild variant="outline">
            <Link to="/personas">Volver a Personas</Link>
          </Button>
        }
      />
    );
  }

  const indicators = data?.indicators ?? [];
  const results = data?.results ?? [];
  const courses = data?.courses ?? [];
  const sessions = data?.sessions ?? [];
  const wellbeing = data?.wellbeing ?? [];
  const commitments = data?.commitments ?? [];

  const openCommitments = commitments.filter((c) => c.status === "abierto").length;
  const overdueCommitments = commitments.filter((c) => c.status === "vencido").length;
  const lastSessionDays = daysSince(employee.last_session_date);
  const nextInDays = employee.next_followup_date
    ? Math.max(
        0,
        Math.round(
          (new Date(`${employee.next_followup_date}T00:00:00Z`).getTime() - Date.now()) /
            86_400_000,
        ),
      )
    : null;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/personas">
          <ArrowLeft className="size-4" />
          Personas
        </Link>
      </Button>

      <header className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-4">
          <InitialsAvatar name={employee.full_name} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">{employee.full_name}</h1>
              <StatusBadge tone={employeeStatusTone(employee.status)}>
                {STATUS_LABEL[employee.status] ?? employee.status}
              </StatusBadge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {employee.job_title} · {employee.area}
            </p>
            <p className="text-sm text-muted-foreground">
              Responsable: {employee.leader_name} · Periodo: {employee.evaluation_period}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/seguimientos">Ver seguimientos</Link>
          </Button>
          <Button onClick={() => startSession.mutate()} disabled={startSession.isPending}>
            Preparar 1:1
          </Button>
        </div>

      </header>

      <Tabs defaultValue="resumen">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="uno">1:1</TabsTrigger>
          <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
          <TabsTrigger value="compromisos">Compromisos</TabsTrigger>
          <TabsTrigger value="desarrollo">Desarrollo</TabsTrigger>
          <TabsTrigger value="formacion">Formación</TabsTrigger>
          <TabsTrigger value="bienestar">Bienestar</TabsTrigger>
        </TabsList>

        {/* --------------------------------- Resumen -------------------------------- */}
        <TabsContent value="resumen" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard
              label="Bienestar actual"
              value={`${Number(employee.wellbeing_score ?? 0).toFixed(1)}/5`}
              trend={0.4}
              tone={Number(employee.wellbeing_score) >= 4 ? "positive" : "warning"}
            />
            <KpiCard
              label="Cumplimiento"
              value={`${Number(employee.compliance_percentage ?? 0)}%`}
              hint="Promedio de indicadores del periodo"
            />
            <KpiCard
              label="Compromisos"
              value={`${openCommitments} abiertos`}
              hint={`${overdueCommitments} vencidos`}
              tone={overdueCommitments > 0 ? "warning" : "neutral"}
            />
            <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Índice de desarrollo
                </p>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="Qué mide este índice">
                        <Info className="size-3.5 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Este indicador resume evolución observable en desempeño y desarrollo. No
                      representa una evaluación psicológica.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums">
                  {employee.development_index ?? "—"}/100
                </span>
                <span className="text-xs font-medium text-success">+11 puntos</span>
              </div>
              <ProgressBar value={Number(employee.development_index ?? 0)} className="mt-3" />
            </div>
            <KpiCard
              label="Último 1:1"
              value={lastSessionDays === null ? "—" : `hace ${lastSessionDays} días`}
              hint={formatDate(employee.last_session_date)}
            />
            <KpiCard
              label="Próximo recomendado"
              value={nextInDays === null ? "—" : `en ${nextInDays} días`}
              hint={formatDate(employee.next_followup_date)}
            />
          </div>

          <Panel
            title={`Lo que debes saber antes de hablar con ${employee.full_name.split(" ")[0]}`}
            description="Contexto acumulado de las últimas conversaciones."
            actions={
              <Button size="sm" onClick={soon}>
                Preparar conversación
              </Button>
            }
          >
            <p className="text-sm leading-relaxed text-muted-foreground">
              Durante las últimas conversaciones, {employee.full_name.split(" ")[0]} ha mencionado
              dificultades relacionadas con priorización y comunicación con el cliente. Su
              percepción de carga laboral ha mejorado y sus indicadores presentan una tendencia
              positiva. Además, completó dos formaciones autónomas adicionales a las asignadas.
            </p>
          </Panel>

          <Panel title="Responsabilidades generales">
            {employee.general_responsibilities ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {employee.general_responsibilities}
              </p>
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="Todavía no hay responsabilidades definidas"
                description="Describe las responsabilidades principales asociadas al rol."
              />
            )}
          </Panel>
        </TabsContent>

        {/* ----------------------------------- 1:1 ---------------------------------- */}
        <TabsContent value="uno" className="mt-6">
          <Panel title="Historial de sesiones" description="Visualización histórica de los 1:1.">
            {sessions.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="Todavía no hay conversaciones registradas"
                description="Las sesiones 1:1 se registrarán desde el módulo de conversaciones en la siguiente fase."
              />
            ) : (
              <Timeline>
                {sessions.map((session) => (
                  <TimelineItem
                    key={session.id}
                    title={session.session_type}
                    meta={formatDate(session.session_date)}
                  >
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone="info" dot={false}>
                        Bienestar {Number(session.wellbeing_score ?? 0).toFixed(1)}
                      </StatusBadge>
                      <StatusBadge tone="neutral" dot={false}>
                        Cumplimiento {Number(session.compliance_percentage ?? 0)}%
                      </StatusBadge>
                    </div>
                    {session.general_notes ? (
                      <p className="mt-2 text-sm text-muted-foreground">{session.general_notes}</p>
                    ) : null}
                  </TimelineItem>
                ))}
              </Timeline>
            )}
          </Panel>
        </TabsContent>

        {/* ------------------------------- Indicadores ------------------------------ */}
        <TabsContent value="indicadores" className="mt-6 space-y-6">
          {indicators.length === 0 ? (
            <Panel>
              <EmptyState
                icon={Target}
                title="Todavía no hay indicadores"
                description="Agrega los indicadores definidos para este rol para comenzar a realizar seguimiento."
                action={<Button onClick={soon}>Añadir indicador</Button>}
              />
            </Panel>
          ) : (
            indicators.map((indicator) => (
              <IndicatorPanel
                key={indicator.id}
                indicator={indicator}
                history={results.filter((r) => r.indicator_id === indicator.id)}
              />
            ))
          )}
        </TabsContent>

        {/* ------------------------------- Compromisos ------------------------------ */}
        <TabsContent value="compromisos" className="mt-6">
          <Panel>
            <EmptyState
              icon={ClipboardList}
              title="Los compromisos llegan en la siguiente fase"
              description="Aquí verás los acuerdos alcanzados en cada conversación, con responsable, fecha y estado."
            />
          </Panel>
        </TabsContent>

        {/* -------------------------------- Desarrollo ------------------------------ */}
        <TabsContent value="desarrollo" className="mt-6">
          <Panel>
            <EmptyState
              icon={Compass}
              title="El plan de desarrollo llega en la siguiente fase"
              description="Aquí verás objetivos de desarrollo, competencias y evolución del rol."
            />
          </Panel>
        </TabsContent>

        {/* -------------------------------- Formación ------------------------------- */}
        <TabsContent value="formacion" className="mt-6 space-y-6">
          <CoursesPanel
            title="Formación asignada"
            description="Cursos definidos por la organización."
            courses={courses.filter((c) => c.course_type === "assigned")}
          />
          <CoursesPanel
            title="Formación autónoma"
            description="Iniciativa propia del colaborador — señal positiva de proactividad."
            courses={courses.filter((c) => c.course_type !== "assigned")}
          />
        </TabsContent>

        {/* -------------------------------- Bienestar ------------------------------- */}
        <TabsContent value="bienestar" className="mt-6 space-y-6">
          <Panel title="Dimensiones de bienestar" description="Escala 1 a 5. Datos simulados.">
            {wellbeing.length === 0 ? (
              <EmptyState
                icon={Info}
                title="Todavía no hay respuestas de bienestar"
                description="Se registrarán durante las conversaciones 1:1."
              />
            ) : (
              <div className="space-y-3">
                {wellbeing.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <span className="w-44 shrink-0 text-sm text-muted-foreground">
                      {item.dimension}
                    </span>
                    <ProgressBar
                      value={(Number(item.score) / 5) * 100}
                      tone={
                        Number(item.score) >= 4
                          ? "positive"
                          : Number(item.score) >= 3
                            ? "warning"
                            : "critical"
                      }
                    />
                    <span className="w-10 shrink-0 text-right text-sm tabular-nums">
                      {Number(item.score).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Histórico de bienestar" description="Promedio por sesión.">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[...sessions].reverse().map((s) => ({
                    name: formatDate(s.session_date).replace(/ de \d+$/, ""),
                    valor: Number(s.wellbeing_score ?? 0),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis domain={[1, 5]} tickLine={false} axisLine={false} fontSize={12} />
                  <ChartTooltip />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IndicatorPanel({
  indicator,
  history,
}: {
  indicator: Indicator;
  history: IndicatorResult[];
}) {
  const compliance = indicatorCompliance(indicator);
  const status = indicatorStatus(compliance);
  const unit = indicator.unit ?? "";

  return (
    <Panel
      title={indicator.name}
      description={indicator.description ?? undefined}
      actions={
        <StatusBadge tone={indicatorStatusTone(status)}>
          {INDICATOR_STATUS_LABEL[status]}
        </StatusBadge>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Meta</p>
              <p className="mt-1 font-medium tabular-nums">
                {indicator.target_value}
                {unit}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Resultado</p>
              <p className="mt-1 font-medium tabular-nums">
                {indicator.current_value}
                {unit}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Cumplimiento</p>
              <p className="mt-1 font-medium tabular-nums">
                {compliance === null ? "—" : `${compliance.toFixed(1)}%`}
              </p>
            </div>
          </div>
          <ProgressBar value={compliance ?? 0} tone={indicatorStatusTone(status)} />
          {indicator.weight ? (
            <p className="text-xs text-muted-foreground">Peso: {indicator.weight}%</p>
          ) : null}
        </div>

        <div className="h-44">
          {history.length === 0 ? (
            <EmptyState title="Sin histórico todavía" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={history.map((h) => ({
                  name: h.period_label ?? "",
                  valor: Number(h.result_value ?? 0),
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <ChartTooltip />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Panel>
  );
}

function CoursesPanel({
  title,
  description,
  courses,
}: {
  title: string;
  description: string;
  courses: Course[];
}) {
  return (
    <Panel title={title} description={description}>
      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Todavía no hay formación registrada"
          description="Cuando se registren cursos aparecerán aquí con su avance y competencia asociada."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-2 font-medium">Curso</th>
                <th className="px-2 py-2 font-medium">Plataforma</th>
                <th className="px-2 py-2 font-medium">Avance</th>
                <th className="px-2 py-2 font-medium">Estado</th>
                <th className="px-2 py-2 font-medium">Inicio</th>
                <th className="px-2 py-2 font-medium">Finalización</th>
                <th className="px-2 py-2 font-medium">Competencia</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-t border-border">
                  <td className="px-2 py-3 font-medium">{course.course_name}</td>
                  <td className="px-2 py-3 text-muted-foreground">{course.platform ?? "—"}</td>
                  <td className="w-32 px-2 py-3">
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums">{course.progress}%</span>
                      <ProgressBar
                        value={course.progress}
                        tone={course.progress === 100 ? "positive" : "info"}
                        className="w-14"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <StatusBadge tone={course.status === "completado" ? "positive" : "info"}>
                      {course.status === "completado" ? "Completado" : "En curso"}
                    </StatusBadge>
                  </td>
                  <td className="px-2 py-3 text-muted-foreground">
                    {formatDate(course.start_date)}
                  </td>
                  <td className="px-2 py-3 text-muted-foreground">
                    {formatDate(course.completion_date)}
                  </td>
                  <td className="px-2 py-3 text-muted-foreground">
                    {course.related_competency ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
