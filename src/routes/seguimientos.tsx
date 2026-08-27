import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckCircle2, ListChecks, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, KpiCard, PageHeader, Panel, StatusBadge } from "@/components/pc/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/pc";
import {
  COMMITMENT_PRIORITIES,
  COMMITMENT_STATUSES,
  commitmentsQuery,
  isOverdue,
  labelFor,
} from "@/lib/sessions";

export const Route = createFileRoute("/seguimientos")({
  head: () => ({
    meta: [
      { title: "Seguimientos y compromisos — People Hub" },
      {
        name: "description",
        content:
          "Panel de seguimiento de compromisos acordados en las conversaciones 1:1: estado, vencimientos y actualizaciones.",
      },
      { property: "og:title", content: "Seguimientos y compromisos — People Hub" },
      {
        property: "og:description",
        content: "Controla el estado y vencimiento de los compromisos del equipo.",
      },
    ],
  }),
  component: Seguimientos,
});

const ALL = "todos";

function Seguimientos() {
  const { data, isLoading } = useQuery(commitmentsQuery);
  const queryClient = useQueryClient();
  const [person, setPerson] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const employees = data?.employees ?? [];
  const byId = useMemo(
    () => Object.fromEntries(employees.map((employee) => [employee.id, employee])),
    [employees],
  );
  const commitments = data?.commitments ?? [];

  const setStatusMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      const { error } = await supabase
        .from("commitments")
        .update({
          status: value,
          completed_at: value === "cumplido" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Compromiso actualizado.");
      queryClient.invalidateQueries({ queryKey: ["commitments"] });
    },
  });

  const addNote = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const { error } = await supabase
        .from("commitment_updates")
        .insert({ commitment_id: id, note: text, created_by: "People & Culture" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Actualización registrada.");
      setNote("");
      setNoteFor(null);
      queryClient.invalidateQueries({ queryKey: ["commitments"] });
    },
  });

  const filtered = commitments.filter((commitment) => {
    if (person !== ALL && commitment.employee_id !== person) return false;
    if (status === "vencido") return isOverdue(commitment);
    if (status !== ALL && commitment.status !== status) return false;
    return true;
  });

  const open = commitments.filter(
    (item) => item.status !== "cumplido" && item.status !== "cancelado",
  );
  const overdue = commitments.filter(isOverdue);
  const done = commitments.filter((item) => item.status === "cumplido");
  const rate = commitments.length ? Math.round((done.length / commitments.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Seguimientos"
        subtitle="Compromisos acordados en las conversaciones 1:1 y su estado real."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Compromisos abiertos" value={open.length} />
        <KpiCard label="Vencidos" value={overdue.length} tone={overdue.length ? "critical" : "positive"} />
        <KpiCard label="Cumplidos" value={done.length} />
        <KpiCard label="Tasa de cumplimiento" value={`${rate}%`} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={person} onValueChange={setPerson}>
          <SelectTrigger className="w-56">
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
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Estado: todos</SelectItem>
            <SelectItem value="vencido">Vencidos</SelectItem>
            {COMMITMENT_STATUSES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Panel title="Compromisos" description="Actualiza el estado o registra una nota de avance.">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Sin compromisos"
            description="Los acuerdos que registres en una conversación 1:1 aparecerán aquí."
          />
        ) : (
          <ul className="space-y-3">
            {filtered.map((commitment) => {
              const updates = (data?.updates ?? []).filter(
                (update) => update.commitment_id === commitment.id,
              );
              return (
                <li key={commitment.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{commitment.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <Link
                          to="/personas/$id"
                          params={{ id: commitment.employee_id }}
                          className="underline-offset-2 hover:underline"
                        >
                          {byId[commitment.employee_id]?.full_name ?? "—"}
                        </Link>{" "}
                        · Responsable: {commitment.responsible ?? "—"} · Vence{" "}
                        {formatDate(commitment.due_date)} ·{" "}
                        {labelFor(COMMITMENT_PRIORITIES, commitment.priority)}
                        {commitment.origin ? ` · Origen: ${commitment.origin}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isOverdue(commitment) && <StatusBadge tone="critical">Vencido</StatusBadge>}
                      <Select
                        value={commitment.status}
                        onValueChange={(value) =>
                          setStatusMutation.mutate({ id: commitment.id, value })
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMITMENT_STATUSES.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setNoteFor(noteFor === commitment.id ? null : commitment.id)}
                      >
                        <MessageSquarePlus className="mr-1.5 size-4" />
                        Nota
                      </Button>
                      {commitment.status !== "cumplido" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setStatusMutation.mutate({ id: commitment.id, value: "cumplido" })
                          }
                        >
                          <CheckCircle2 className="mr-1.5 size-4" />
                          Cumplido
                        </Button>
                      )}
                    </div>
                  </div>

                  {updates.length > 0 && (
                    <ul className="mt-3 space-y-1 border-l-2 border-border pl-3 text-xs text-muted-foreground">
                      {updates.map((update) => (
                        <li key={update.id}>
                          {formatDate(update.created_at.slice(0, 10))} — {update.note}
                        </li>
                      ))}
                    </ul>
                  )}

                  {noteFor === commitment.id && (
                    <div className="mt-3 flex gap-2">
                      <Input
                        value={note}
                        placeholder="Escribe una actualización de avance"
                        onChange={(event) => setNote(event.target.value)}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!note.trim()) return;
                          addNote.mutate({ id: commitment.id, text: note.trim() });
                        }}
                      >
                        Guardar
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
