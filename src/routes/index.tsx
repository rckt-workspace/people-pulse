import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarClock, GraduationCap, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  EmptyState,
  InitialsAvatar,
  KpiCard,
  PageHeader,
  Panel,
  ProgressBar,
  StatusBadge,
  Trend,
  employeeStatusTone,
} from "@/components/pc/primitives";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_LABEL, overviewQuery } from "@/lib/pc";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "People Overview — People Hub" },
      {
        name: "description",
        content:
          "Panel principal de People & Culture: conversaciones 1:1, bienestar, desempeño, bloqueos y formación del equipo.",
      },
      { property: "og:title", content: "People Overview — People Hub" },
      {
        property: "og:description",
        content: "Una vista clara de conversaciones, bienestar, desempeño y desarrollo.",
      },
    ],
  }),
  component: Overview,
});

const ALL = "todos";

const KPI = {
  colaboradores: 24,
  onesDone: 18,
  onesPending: 6,
  commitmentsOpen: 32,
  commitmentsOverdue: 5,
  compliance: 84,
  wellbeing: 4.1,
  improvementPlans: 3,
};

const WELLBEING_DIMENSIONS = [
  { name: "Bienestar general", valor: 4.1, delta: 0.3 },
  { name: "Motivación", valor: 4.0, delta: 0.2 },
  { name: "Energía", valor: 3.7, delta: -0.1 },
  { name: "Carga laboral", valor: 3.4, delta: 0.4 },
  { name: "Estrés percibido", valor: 3.2, delta: 0.2 },
  { name: "Relación con líder", valor: 4.4, delta: 0.1 },
  { name: "Pertenencia", valor: 4.3, delta: 0.0 },
  { name: "Crecimiento", valor: 3.9, delta: 0.3 },
  { name: "Balance trabajo/vida", valor: 3.6, delta: -0.2 },
];

const BLOCKERS = [
  { name: "Priorización", valor: 7 },
  { name: "Cliente", valor: 5 },
  { name: "Procesos", valor: 4 },
  { name: "Carga laboral", valor: 4 },
  { name: "Comunicación", valor: 3 },
  { name: "Conocimiento", valor: 2 },
];

const TRAINING = {
  assigned: 18,
  completed: 12,
  autonomous: 8,
  completion: 67,
};

const UPCOMING = [
  { name: "Laura Gómez", role: "Senior UX Designer", when: "Hoy 10:00 AM" },
  { name: "Juan Pérez", role: "Backend Developer", when: "Mañana 3:00 PM" },
  { name: "Camila Torres", role: "Account Manager", when: "Viernes 11:00 AM" },
];

function Overview() {
  const { data, isLoading } = useQuery(overviewQuery);
  const [period, setPeriod] = useState("mes");
  const [area, setArea] = useState(ALL);
  const [leader, setLeader] = useState(ALL);
  const [role, setRole] = useState(ALL);
  const [evalPeriod, setEvalPeriod] = useState(ALL);

  const employees = data?.employees ?? [];

  const attention = useMemo(
    () =>
      employees
        .filter((e) => e.status !== "normal")
        .filter((e) => (area === ALL || e.area === area) && (leader === ALL || e.leader_name === leader))
        .slice(0, 5),
    [employees, area, leader],
  );

  const options = (values: string[]) => Array.from(new Set(values)).sort();

  return (
    <div className="space-y-8">
      <PageHeader
        title="People Overview"
        subtitle="Una vista clara de conversaciones, bienestar, desempeño y desarrollo."
        actions={
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Este mes</SelectItem>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Filter
          label="Área"
          value={area}
          onChange={setArea}
          options={options(employees.map((e) => e.area))}
        />
        <Filter
          label="Líder"
          value={leader}
          onChange={setLeader}
          options={options(employees.map((e) => e.leader_name))}
        />
        <Filter
          label="Cargo"
          value={role}
          onChange={setRole}
          options={options(employees.map((e) => e.job_title))}
        />
        <Filter
          label="Periodo de evaluación"
          value={evalPeriod}
          onChange={setEvalPeriod}
          options={options(employees.map((e) => e.evaluation_period))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Colaboradores" value={String(KPI.colaboradores)} hint="Equipo activo" />
        <KpiCard
          label="1:1 realizados"
          value={`${KPI.onesDone}/${KPI.colaboradores}`}
          hint="En el periodo seleccionado"
          tone="positive"
        />
        <KpiCard label="1:1 pendientes" value={String(KPI.onesPending)} tone="warning" />
        <KpiCard label="Compromisos abiertos" value={String(KPI.commitmentsOpen)} />
        <KpiCard
          label="Compromisos vencidos"
          value={String(KPI.commitmentsOverdue)}
          tone="critical"
        />
        <KpiCard label="Cumplimiento promedio" value={`${KPI.compliance}%`} />
        <KpiCard label="Bienestar promedio" value={`${KPI.wellbeing}/5`} trend={0.3} />
        <KpiCard label="Planes de mejora activos" value={String(KPI.improvementPlans)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Necesitan atención" description="Máximo 5 personas priorizadas.">
          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : attention.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nadie requiere atención especial"
              description="Todo el equipo está dentro de los rangos esperados en este periodo."
            />
          ) : (
            <ul className="space-y-3">
              {attention.map((person) => (
                <li
                  key={person.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <InitialsAvatar name={person.full_name} />
                    <div>
                      <p className="text-sm font-medium">{person.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Bienestar {Number(person.wellbeing_score ?? 0).toFixed(1)}/5 ·{" "}
                        {person.job_title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Cumplimiento {Number(person.compliance_percentage ?? 0)}% · mismo bloqueo en
                        sesiones recientes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge tone={employeeStatusTone(person.status)}>
                      {STATUS_LABEL[person.status] ?? person.status}
                    </StatusBadge>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/personas/$id" params={{ id: person.id }}>
                        Ver ficha
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Próximas conversaciones" description="Agenda de 1:1 de los próximos días.">
          <ul className="space-y-3">
            {UPCOMING.map((item, index) => (
              <li
                key={item.name}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <InitialsAvatar name={item.name} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.role}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarClock className="size-3" />
                      {item.when}
                    </p>
                  </div>
                </div>
                {index === 0 ? (
                  <Button size="sm" onClick={() => toast("Disponible en la siguiente fase.")}>
                    Preparar 1:1
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Bienestar del equipo" description="Escala 1 a 5, vs. periodo anterior.">
          <ul className="space-y-3">
            {WELLBEING_DIMENSIONS.map((dimension) => (
              <li key={dimension.name} className="flex items-center gap-4">
                <span className="w-40 shrink-0 text-sm text-muted-foreground">
                  {dimension.name}
                </span>
                <ProgressBar
                  value={(dimension.valor / 5) * 100}
                  tone={
                    dimension.valor >= 4 ? "positive" : dimension.valor >= 3.4 ? "info" : "warning"
                  }
                />
                <span className="w-8 shrink-0 text-right text-sm tabular-nums">
                  {dimension.valor.toFixed(1)}
                </span>
                <span className="w-14 shrink-0 text-right">
                  <Trend value={dimension.delta} />
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-6">
          <Panel title="Principales bloqueos" description="Menciones en las sesiones del periodo.">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BLOCKERS} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <ChartTooltip cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={14}>
                    {BLOCKERS.map((entry) => (
                      <Cell key={entry.name} fill="var(--primary)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Formación" description="Asignada vs. autónoma en el periodo.">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Metric label="Cursos asignados" value={TRAINING.assigned} />
              <Metric label="Cursos completados" value={TRAINING.completed} />
              <Metric label="Formación autónoma" value={TRAINING.autonomous} />
              <Metric label="Finalización" value={`${TRAINING.completion}%`} />
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-28 text-sm text-muted-foreground">Asignados</span>
                <ProgressBar value={(TRAINING.assigned / 26) * 100} />
                <span className="w-6 text-right text-sm tabular-nums">{TRAINING.assigned}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-28 text-sm text-muted-foreground">Autónomos</span>
                <ProgressBar value={(TRAINING.autonomous / 26) * 100} tone="positive" />
                <span className="w-6 text-right text-sm tabular-nums">{TRAINING.autonomous}</span>
              </div>
              <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <GraduationCap className="size-3.5" />
                La formación autónoma refleja iniciativa propia del equipo.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
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
