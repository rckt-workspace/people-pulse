import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  EmptyState,
  InitialsAvatar,
  PageHeader,
  Panel,
  StatusBadge,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/pc";
import {
  WIZARD_STEPS,
  createDraftSession,
  followupState,
  sessionsOverviewQuery,
} from "@/lib/sessions";

export const Route = createFileRoute("/uno-a-uno/")({
  head: () => ({
    meta: [
      { title: "Conversaciones 1:1 — People Hub" },
      {
        name: "description",
        content:
          "Prepara, realiza y consulta las conversaciones 1:1 del equipo: próximos, borradores e historial.",
      },
      { property: "og:title", content: "Conversaciones 1:1 — People Hub" },
      {
        property: "og:description",
        content: "Preparación, registro e historial de conversaciones 1:1.",
      },
    ],
  }),
  component: UnoAUno,
});

const ALL = "todos";

function UnoAUno() {
  const { data, isLoading } = useQuery(sessionsOverviewQuery);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [personFilter, setPersonFilter] = useState(ALL);
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [search, setSearch] = useState("");

  const employees = data?.employees ?? [];
  const sessions = data?.sessions ?? [];
  const byId = useMemo(
    () => Object.fromEntries(employees.map((employee) => [employee.id, employee])),
    [employees],
  );

  const start = useMutation({
    mutationFn: (employeeId: string) => createDraftSession(employeeId),
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["sessions-overview"] });
      navigate({ to: "/uno-a-uno/$sessionId", params: { sessionId: id } });
    },
    onError: () => toast.error("No fue posible crear la sesión."),
  });

  const removeDraft = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Borrador eliminado.");
      queryClient.invalidateQueries({ queryKey: ["sessions-overview"] });
    },
  });

  const completed = sessions.filter((session) => session.status === "completed");
  const drafts = sessions.filter((session) => session.status === "draft");

  const lastCompletedFor = (employeeId: string) =>
    completed.find((session) => session.employee_id === employeeId)?.session_date ?? null;

  const history = completed.filter((session) => {
    const employee = byId[session.employee_id];
    if (personFilter !== ALL && session.employee_id !== personFilter) return false;
    if (typeFilter !== ALL && session.session_type !== typeFilter) return false;
    if (search && !employee?.full_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const commitmentsBySession = (sessionId: string) =>
    (data?.commitments ?? []).filter((item) => item.session_id === sessionId).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Conversaciones 1:1"
        subtitle="Prepara, realiza y consulta cada conversación con el equipo."
      />

      <Tabs defaultValue="proximos">
        <TabsList>
          <TabsTrigger value="proximos">Próximos</TabsTrigger>
          <TabsTrigger value="borradores">Borradores ({drafts.length})</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="proximos" className="mt-6">
          <Panel
            title="Pendientes de conversación"
            description="Periodicidad sugerida: mensual. Atrasado cuando pasan más de 35 días."
          >
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : (
              <ul className="space-y-3">
                {employees.map((employee) => {
                  const last = lastCompletedFor(employee.id);
                  const state = followupState(last);
                  return (
                    <li
                      key={employee.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={employee.full_name} />
                        <div>
                          <p className="text-sm font-medium">{employee.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {employee.job_title} · Último 1:1 {formatDate(last)}
                            {state.days !== null ? ` (${state.days} días)` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
                        <Button
                          size="sm"
                          onClick={() => start.mutate(employee.id)}
                          disabled={start.isPending}
                        >
                          <CalendarPlus className="mr-1.5 size-4" />
                          Iniciar 1:1
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="borradores" className="mt-6">
          <Panel title="Sesiones sin finalizar" description="Puedes continuarlas en cualquier momento.">
            {drafts.length === 0 ? (
              <EmptyState
                icon={CalendarPlus}
                title="No hay borradores"
                description="Cuando inicies un 1:1 y salgas antes de terminar, aparecerá aquí."
              />
            ) : (
              <ul className="space-y-3">
                {drafts.map((session) => (
                  <li
                    key={session.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {byId[session.employee_id]?.full_name ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Creada el {formatDate(session.created_at.slice(0, 10))} · Paso{" "}
                        {session.current_step} de 7 ·{" "}
                        {WIZARD_STEPS[Math.min(session.current_step, 7) - 1]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDraft.mutate(session.id)}
                      >
                        <Trash2 className="mr-1.5 size-4" />
                        Eliminar borrador
                      </Button>
                      <Button asChild size="sm">
                        <Link to="/uno-a-uno/$sessionId" params={{ sessionId: session.id }}>
                          Continuar
                        </Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="historial" className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Buscar persona"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-56"
            />
            <Select value={personFilter} onValueChange={setPersonFilter}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Persona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Persona: todas</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tipo: todos</SelectItem>
                {Array.from(new Set(completed.map((session) => session.session_type))).map(
                  (type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <Panel title="Historial de sesiones">
            {history.length === 0 ? (
              <EmptyState
                icon={CalendarPlus}
                title="Sin sesiones registradas"
                description="Las sesiones completadas aparecerán en este historial."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Persona</th>
                      <th className="py-2 pr-4 font-medium">Fecha</th>
                      <th className="py-2 pr-4 font-medium">Tipo</th>
                      <th className="py-2 pr-4 font-medium">Bienestar</th>
                      <th className="py-2 pr-4 font-medium">Cumplimiento</th>
                      <th className="py-2 pr-4 font-medium">Acuerdos</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {history.map((session) => (
                      <tr key={session.id}>
                        <td className="py-3 pr-4 font-medium">
                          {byId[session.employee_id]?.full_name ?? "—"}
                        </td>
                        <td className="py-3 pr-4">{formatDate(session.session_date)}</td>
                        <td className="py-3 pr-4">{session.session_type}</td>
                        <td className="py-3 pr-4 tabular-nums">
                          {session.wellbeing_score ? `${Number(session.wellbeing_score).toFixed(1)}/5` : "—"}
                        </td>
                        <td className="py-3 pr-4 tabular-nums">
                          {session.compliance_percentage
                            ? `${Math.round(Number(session.compliance_percentage))}%`
                            : "—"}
                        </td>
                        <td className="py-3 pr-4 tabular-nums">
                          {commitmentsBySession(session.id)}
                        </td>
                        <td className="py-3 text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link to="/sesiones/$id" params={{ id: session.id }}>
                              Ver
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
