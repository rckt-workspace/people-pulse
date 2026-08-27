import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, InitialsAvatar, Panel, ProgressBar } from "@/components/pc/primitives";
import { DevelopmentPanel } from "@/components/pc/DevelopmentPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { developmentOverviewQuery } from "@/lib/development";

export const Route = createFileRoute("/desarrollo")({
  head: () => ({
    meta: [
      { title: "Desarrollo — People Hub" },
      {
        name: "description",
        content: "Planes de desarrollo, competencias e índice de desarrollo del equipo.",
      },
      { property: "og:title", content: "Desarrollo — People Hub" },
      {
        property: "og:description",
        content: "Objetivos de desarrollo, sugerencias de People AI e índice de desarrollo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Desarrollo,
});

function Desarrollo() {
  const { data, isLoading } = useQuery(developmentOverviewQuery);
  const [selected, setSelected] = useState<string | null>(null);

  if (isLoading || !data) return <Skeleton className="h-96 w-full" />;

  const employees = data.employees as {
    id: string;
    full_name: string;
    job_title: string;
    area: string;
    development_index: number | null;
  }[];
  const active = selected ?? employees[0]?.id ?? null;
  const activeEmployee = employees.find((e) => e.id === active);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Desarrollo"
        subtitle="Objetivos de desarrollo, competencias e índice de desarrollo por persona."
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Panel title="Colaboradores" description="Selecciona a una persona.">
          <ul className="space-y-1">
            {employees.map((employee) => {
              const goals = data.goals.filter((g) => g.employee_id === employee.id);
              return (
                <li key={employee.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(employee.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted",
                      employee.id === active && "bg-muted",
                    )}
                  >
                    <InitialsAvatar name={employee.full_name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {employee.full_name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {employee.job_title} · {goals.length} objetivos
                      </span>
                      <ProgressBar
                        value={Number(employee.development_index ?? 0)}
                        className="mt-1.5"
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div>
          {activeEmployee ? (
            <DevelopmentPanel
              key={activeEmployee.id}
              employeeId={activeEmployee.id}
              employeeName={activeEmployee.full_name}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
