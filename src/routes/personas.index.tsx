import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import {
  EmptyState,
  InitialsAvatar,
  PageHeader,
  Panel,
  ProgressBar,
  StatusBadge,
  employeeStatusTone,
} from "@/components/pc/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_LABEL, daysSince, employeesQuery, formatDate, type Employee } from "@/lib/pc";

export const Route = createFileRoute("/personas/")({
  head: () => ({
    meta: [
      { title: "Personas — People Hub" },
      {
        name: "description",
        content: "Directorio de colaboradores con bienestar, cumplimiento y seguimiento.",
      },
      { property: "og:title", content: "Personas — People Hub" },
      {
        property: "og:description",
        content: "Directorio de colaboradores con bienestar, cumplimiento y seguimiento.",
      },
    ],
  }),
  component: PersonasPage,
});

const ALL = "todos";

function unique(values: (string | null)[]) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort();
}

function PersonasPage() {
  const { data, isLoading } = useQuery(employeesQuery);
  const [search, setSearch] = useState("");
  const [area, setArea] = useState(ALL);
  const [leader, setLeader] = useState(ALL);
  const [role, setRole] = useState(ALL);
  const [period, setPeriod] = useState(ALL);

  const employees = data ?? [];

  const filtered = useMemo(
    () =>
      employees.filter((e) => {
        const matchesSearch = `${e.full_name} ${e.job_title} ${e.area}`
          .toLowerCase()
          .includes(search.toLowerCase());
        return (
          matchesSearch &&
          (area === ALL || e.area === area) &&
          (leader === ALL || e.leader_name === leader) &&
          (role === ALL || e.job_title === role) &&
          (period === ALL || e.evaluation_period === period)
        );
      }),
    [employees, search, area, leader, role, period],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Personas"
        subtitle="Directorio del equipo con su estado de bienestar, desempeño y seguimiento."
        actions={
          <Button asChild>
            <Link to="/personas/nueva">
              <Plus className="size-4" />
              Nueva persona
            </Link>
          </Button>
        }
      />

      <Panel className="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, cargo o área"
              className="pl-9"
            />
          </div>
          <FilterSelect
            value={area}
            onChange={setArea}
            label="Área"
            options={unique(employees.map((e) => e.area))}
          />
          <FilterSelect
            value={leader}
            onChange={setLeader}
            label="Líder"
            options={unique(employees.map((e) => e.leader_name))}
          />
          <FilterSelect
            value={role}
            onChange={setRole}
            label="Cargo"
            options={unique(employees.map((e) => e.job_title))}
          />
          <FilterSelect
            value={period}
            onChange={setPeriod}
            label="Periodo"
            options={unique(employees.map((e) => e.evaluation_period))}
          />
        </div>

        <div className="p-2">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={Users}
                title="No hay personas que coincidan"
                description="Ajusta la búsqueda o los filtros, o agrega una nueva persona al equipo."
                action={
                  <Button asChild variant="outline">
                    <Link to="/personas/nueva">Nueva persona</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Colaborador</th>
                    <th className="px-3 py-2 font-medium">Área</th>
                    <th className="px-3 py-2 font-medium">Líder</th>
                    <th className="px-3 py-2 font-medium">Periodo</th>
                    <th className="px-3 py-2 font-medium">Bienestar</th>
                    <th className="px-3 py-2 font-medium">Cumplimiento</th>
                    <th className="px-3 py-2 font-medium">Último 1:1</th>
                    <th className="px-3 py-2 font-medium">Próximo</th>
                    <th className="px-3 py-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((employee) => (
                    <PersonRow key={employee.id} employee={employee} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[160px]">
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

function PersonRow({ employee }: { employee: Employee }) {
  const days = daysSince(employee.last_session_date);
  const wellbeing = Number(employee.wellbeing_score ?? 0);
  const compliance = Number(employee.compliance_percentage ?? 0);

  return (
    <tr className="border-t border-border transition-colors hover:bg-accent/50">
      <td className="px-3 py-3">
        <Link
          to="/personas/$id"
          params={{ id: employee.id }}
          className="flex items-center gap-3 font-medium hover:text-primary"
        >
          <InitialsAvatar name={employee.full_name} size="sm" />
          <span>
            {employee.full_name}
            <span className="block text-xs font-normal text-muted-foreground">
              {employee.job_title}
            </span>
          </span>
        </Link>
      </td>
      <td className="px-3 py-3 text-muted-foreground">{employee.area}</td>
      <td className="px-3 py-3 text-muted-foreground">{employee.leader_name}</td>
      <td className="px-3 py-3 text-muted-foreground">{employee.evaluation_period}</td>
      <td className="px-3 py-3">
        <span
          className={
            wellbeing >= 4 ? "text-success" : wellbeing >= 3.4 ? "text-warning" : "text-danger"
          }
        >
          {wellbeing.toFixed(1)}
        </span>
        <span className="text-muted-foreground">/5</span>
      </td>
      <td className="w-[130px] px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="tabular-nums">{compliance}%</span>
          <ProgressBar
            value={compliance}
            tone={compliance >= 85 ? "positive" : compliance >= 75 ? "warning" : "critical"}
            className="w-16"
          />
        </div>
      </td>
      <td className="px-3 py-3 text-muted-foreground">
        {days === null ? "—" : `hace ${days} días`}
      </td>
      <td className="px-3 py-3 text-muted-foreground">{formatDate(employee.next_followup_date)}</td>
      <td className="px-3 py-3">
        <StatusBadge tone={employeeStatusTone(employee.status)}>
          {STATUS_LABEL[employee.status] ?? employee.status}
        </StatusBadge>
      </td>
    </tr>
  );
}
