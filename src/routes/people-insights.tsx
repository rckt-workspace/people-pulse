import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CircleAlert, GraduationCap, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  EmptyState,
  KpiCard,
  PageHeader,
  Panel,
  ProgressBar,
} from "@/components/pc/primitives";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ALL,
  EMPTY_FILTERS,
  THRESHOLDS,
  computeInsights,
  formatScore,
  peopleInsightsQuery,
  type InsightFilters,
  type Period,
  type Signal,
} from "@/lib/people-insights";

export const Route = createFileRoute("/people-insights")({
  head: () => ({
    meta: [
      { title: "People Insights — People Hub" },
      { name: "description", content: "Analítica agregada de personas, bienestar y desempeño." },
      { property: "og:title", content: "People Insights — People Hub" },
      {
        property: "og:description",
        content: "Analítica agregada de personas, bienestar y desempeño.",
      },
    ],
  }),
  component: PeopleInsights,
});

const PERIOD_LABEL: Record<Period, string> = {
  "1m": "Último mes",
  "3m": "Últimos 3 meses",
  "6m": "Últimos 6 meses",
  all: "Todo",
};

const TONE_COLOR: Record<"positive" | "warning" | "critical", string> = {
  positive: "var(--success)",
  warning: "var(--warning)",
  critical: "var(--danger)",
};

const SIGNAL_BORDER: Record<Signal["tone"], string> = {
  critical: "var(--danger)",
  warning: "var(--warning)",
  info: "var(--primary)",
};

function PeopleInsights() {
  const { data, isLoading, isError, refetch } = useQuery(peopleInsightsQuery);
  const [filters, setFilters] = useState<InsightFilters>(EMPTY_FILTERS);

  const insights = useMemo(
    () => (data ? computeInsights(data, filters) : null),
    [data, filters],
  );

  const options = (values: string[]) => Array.from(new Set(values)).filter(Boolean).sort();
  const employees = data?.employees ?? [];

  const update = (patch: Partial<InsightFilters>) => setFilters((current) => ({ ...current, ...patch }));

  return (
    <div className="min-w-0 space-y-8">
      <PageHeader
        title="People Insights"
        subtitle="Lectura transversal de bienestar, desempeño, bloqueos, formación y desarrollo del equipo."
        actions={
          <Select value={filters.period} onValueChange={(value) => update({ period: value as Period })}>
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PERIOD_LABEL) as Period[]).map((period) => (
                <SelectItem key={period} value={period}>
                  {PERIOD_LABEL[period]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <InsightsSkeleton />
      ) : isError || !data || !insights ? (
        <Panel>
          <EmptyState
            icon={CircleAlert}
            title="No se pudieron cargar los datos"
            description="Revisa la conexión e inténtalo de nuevo."
            action={
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Reintentar
              </Button>
            }
          />
        </Panel>
      ) : employees.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Users}
            title="Aún no hay colaboradores"
            description="Cuando se registren personas, aquí aparecerán sus métricas."
          />
        </Panel>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <FilterSelect
              label="Área"
              value={filters.area}
              onChange={(area) => update({ area })}
              options={options(employees.map((e) => e.area))}
            />
            <FilterSelect
              label="Líder"
              value={filters.leader}
              onChange={(leader) => update({ leader })}
              options={options(employees.map((e) => e.leader_name))}
            />
            <FilterSelect
              label="Cargo"
              value={filters.role}
              onChange={(role) => update({ role })}
              options={options(employees.map((e) => e.job_title))}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Periodo relativo a la última sesión registrada ({insights.referenceDay}). Colaboradores
            incluidos: {insights.employeeCount}.
          </p>

          {data.failedSources.length > 0 ? (
            <p className="text-xs text-warning">
              Algunos datos no se pudieron cargar ({data.failedSources.join(", ")}). Las métricas que
              dependen de ellos pueden estar incompletas.
            </p>
          ) : null}

          {/* Sección 1 — KPIs */}
          <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Colaboradores" value={String(insights.employeeCount)} hint="Según filtros" />
            <KpiCard
              label="Bienestar promedio"
              value={formatScore(insights.kpis.wellbeing, "/5")}
              hint="Respuestas del periodo"
            />
            <KpiCard
              label="Cumplimiento promedio"
              value={formatScore(insights.kpis.compliance, "%")}
              hint="Indicadores del periodo"
            />
            <KpiCard
              label="Seguimiento prioritario/recomendado"
              value={String(insights.kpis.followUps)}
              tone={insights.kpis.followUps > 0 ? "warning" : "neutral"}
            />
            <KpiCard
              label="Bloqueos abiertos"
              value={String(insights.kpis.openBlockers)}
              tone={insights.kpis.openBlockers > 0 ? "warning" : "neutral"}
            />
            <KpiCard label="Compromisos abiertos" value={String(insights.kpis.openCommitments)} />
            <KpiCard
              label="Compromisos vencidos"
              value={String(insights.kpis.overdueCommitments)}
              tone={insights.kpis.overdueCommitments > 0 ? "critical" : "neutral"}
            />
            <KpiCard
              label="Índice de desarrollo promedio"
              value={formatScore(insights.kpis.developmentIndex)}
              hint="Historial mensual"
            />
          </section>

          {/* Secciones 2 y 3 — Bienestar y desempeño */}
          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <Panel title="Tendencia de bienestar" description="Promedio mensual, escala 1 a 5.">
              {insights.wellbeingTrend.length === 0 ? (
                <EmptyState title="Sin respuestas de bienestar en este periodo" />
              ) : (
                <div className="h-64 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={insights.wellbeingTrend} margin={{ left: 0, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis domain={[1, 5]} tickLine={false} axisLine={false} fontSize={11} width={28} />
                      <ChartTooltip />
                      <Area
                        type="monotone"
                        dataKey="promedio"
                        name="Bienestar"
                        stroke="var(--primary)"
                        fill="var(--primary)"
                        fillOpacity={0.12}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>

            <Panel
              title="Distribución de cumplimiento"
              description="Resultados de indicadores agrupados por nivel."
            >
              {insights.compliance.every((bucket) => bucket.valor === 0) ? (
                <EmptyState title="Sin resultados de indicadores en este periodo" />
              ) : (
                <div className="h-64 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={insights.compliance} margin={{ left: 0, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} interval={0} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} width={28} />
                      <ChartTooltip cursor={{ fill: "var(--muted)" }} />
                      <Bar dataKey="valor" name="Resultados" radius={[4, 4, 0, 0]} barSize={36}>
                        {insights.compliance.map((bucket) => (
                          <Cell key={bucket.label} fill={TONE_COLOR[bucket.tone]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
          </div>

          {/* Secciones 4 y 5 — Bloqueos y desarrollo */}
          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <Panel title="Principales bloqueos" description="Bloqueos abiertos por categoría (máximo 6).">
              {insights.blockers.length === 0 ? (
                <EmptyState title="Sin bloqueos abiertos en este periodo" />
              ) : (
                <div className="h-64 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={insights.blockers} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={110}
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                      />
                      <ChartTooltip cursor={{ fill: "var(--muted)" }} />
                      <Bar dataKey="valor" name="Bloqueos" radius={[0, 4, 4, 0]} barSize={14} fill="var(--primary)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>

            <Panel
              title="Evolución del índice de desarrollo"
              description="Promedio mensual del total del índice."
            >
              {insights.developmentTrend === null ? (
                <EmptyState
                  title="Historial insuficiente"
                  description="Se necesitan al menos dos meses de historial de desarrollo para mostrar la evolución."
                />
              ) : (
                <div className="h-64 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={insights.developmentTrend} margin={{ left: 0, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis tickLine={false} axisLine={false} fontSize={11} width={32} />
                      <ChartTooltip />
                      <Line
                        type="monotone"
                        dataKey="promedio"
                        name="Índice"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
          </div>

          {/* Secciones 6 y 7 — Formación y señales */}
          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <Panel title="Formación" description="Cursos asignados y autónomos en el periodo.">
              {insights.training.assigned + insights.training.autonomous === 0 ? (
                <EmptyState title="Sin cursos en este periodo" />
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Metric label="Asignados" value={insights.training.assigned} />
                    <Metric label="Autónomos" value={insights.training.autonomous} />
                    <Metric label="Completados" value={insights.training.completed} />
                    <Metric label="En curso" value={insights.training.inProgress} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tasa de finalización</span>
                      <span className="font-medium tabular-nums">
                        {insights.training.completionRate === null
                          ? "—"
                          : `${insights.training.completionRate}%`}
                      </span>
                    </div>
                    <ProgressBar value={insights.training.completionRate ?? 0} tone="positive" />
                  </div>
                  <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <GraduationCap className="size-3.5" />
                    Datos de la tabla de cursos registrados.
                  </p>
                </div>
              )}
            </Panel>

            <Panel
              title="Señales que requieren atención"
              description={`Reglas simples y transparentes (máximo ${THRESHOLDS.signalsMax}). Cada señal muestra su evidencia.`}
            >
              {insights.signals.length === 0 ? (
                <EmptyState title="Sin señales activas" description="Ninguna regla se cumple en este periodo." />
              ) : (
                <ul className="space-y-3">
                  {insights.signals.map((signal) => (
                    <li
                      key={`${signal.title}-${signal.evidence}`}
                      className="min-w-0 rounded-lg border border-border border-l-2 p-4"
                      style={{ borderLeftColor: SIGNAL_BORDER[signal.tone] }}
                    >
                      <p className="break-words text-sm font-medium">{signal.title}</p>
                      <p className="mt-1 break-words text-xs text-muted-foreground">{signal.evidence}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[190px]">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{label}: todos</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}
