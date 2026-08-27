import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PageHeader, Panel, StatusBadge } from "@/components/pc/primitives";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/pc";
import {
  BLOCKER_SEVERITIES,
  COMMITMENT_PRIORITIES,
  COMMITMENT_STATUSES,
  RESPONSIBILITY_STATUSES,
  labelFor,
  sessionQuery,
} from "@/lib/sessions";

export const Route = createFileRoute("/sesiones/$id")({
  head: () => ({
    meta: [
      { title: "Detalle de sesión 1:1 — People Hub" },
      {
        name: "description",
        content:
          "Resumen completo de una conversación 1:1: respuestas, bienestar, bloqueos, indicadores y compromisos.",
      },
      { property: "og:title", content: "Detalle de sesión 1:1 — People Hub" },
      {
        property: "og:description",
        content: "Consulta el registro completo de una conversación 1:1.",
      },
    ],
  }),
  component: SessionDetail,
});

function SessionDetail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery(sessionQuery(id));

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" /> Cargando sesión…
      </div>
    );
  }
  if (!data?.session) {
    return <p className="text-sm text-muted-foreground">Sesión no encontrada.</p>;
  }

  const employee = data.employee as { id: string; full_name: string; job_title: string } | null;
  const answered = data.questions.filter((question) => (question.answer ?? "").trim());
  const wellbeing = data.wellbeing.filter((item) => item.session_id === id);
  const blockers = data.blockers.filter((item) => item.session_id === id);
  const commitments = data.commitments.filter((item) => item.session_id === id);
  const results = data.results.filter((item) => item.session_id === id);
  const indicatorName = (indicatorId: string) =>
    data.indicators.find((indicator) => indicator.id === indicatorId)?.name ?? "Indicador";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Sesión del ${formatDate(data.session.session_date)}`}
        subtitle={`${employee?.full_name ?? ""} · ${data.session.session_type} · Facilitador: ${data.session.facilitator ?? "—"}`}
        actions={
          employee ? (
            <Button asChild variant="outline">
              <Link to="/personas/$id" params={{ id: employee.id }}>
                Ver ficha
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Panel title="Bienestar promedio">
          <p className="text-2xl font-semibold tabular-nums">
            {data.session.wellbeing_score ? `${Number(data.session.wellbeing_score).toFixed(1)}/5` : "—"}
          </p>
        </Panel>
        <Panel title="Cumplimiento">
          <p className="text-2xl font-semibold tabular-nums">
            {data.session.compliance_percentage
              ? `${Math.round(Number(data.session.compliance_percentage))}%`
              : "—"}
          </p>
        </Panel>
        <Panel title="Estado">
          <StatusBadge tone={data.session.status === "completed" ? "positive" : "warning"}>
            {data.session.status === "completed" ? "Cerrada" : "Borrador"}
          </StatusBadge>
        </Panel>
      </div>

      {data.topics.length > 0 && (
        <Panel title="Temas tratados">
          <ul className="flex flex-wrap gap-2">
            {data.topics.map((topic) => (
              <li key={topic.id} className="rounded-full bg-muted px-3 py-1 text-sm">
                {topic.topic}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title={`Respuestas (${answered.length})`}>
        {answered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No se registraron respuestas.</p>
        ) : (
          <ul className="space-y-3">
            {answered.map((question) => (
              <li key={question.id} className="rounded-lg border border-border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {question.category ?? "General"}
                </p>
                <p className="mt-1 text-sm font-medium">{question.question_text}</p>
                <p className="mt-1 text-sm text-muted-foreground">{question.answer}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Bienestar por dimensión">
          {wellbeing.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin registro de bienestar.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {wellbeing.map((item) => (
                <li key={item.id} className="flex items-center justify-between">
                  <span>{item.dimension}</span>
                  <span className="tabular-nums text-muted-foreground">{Number(item.score)}/5</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Bloqueos registrados">
          {blockers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin bloqueos.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {blockers.map((blocker) => (
                <li key={blocker.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{blocker.category}</span>
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
                  </div>
                  <p className="text-muted-foreground">{blocker.description}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Indicadores del periodo">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin resultados registrados.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {results.map((result) => (
                <li key={result.id} className="flex items-center justify-between">
                  <span>{indicatorName(result.indicator_id)}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {result.result_value} ·{" "}
                    {result.compliance_percentage
                      ? `${Math.round(Number(result.compliance_percentage))}%`
                      : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Compromisos acordados">
          {commitments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin compromisos.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {commitments.map((commitment) => (
                <li key={commitment.id} className="rounded-lg border border-border p-3">
                  <p>{commitment.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {commitment.responsible} · Vence {formatDate(commitment.due_date)} ·{" "}
                    {labelFor(COMMITMENT_PRIORITIES, commitment.priority)} ·{" "}
                    {labelFor(COMMITMENT_STATUSES, commitment.status)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {data.responsibilities.length > 0 && (
        <Panel title="Responsabilidades revisadas">
          <ul className="space-y-2 text-sm">
            {data.responsibilities.map((review) => (
              <li key={review.id} className="rounded-lg border border-border p-3">
                <p>{review.responsibility_text}</p>
                <p className="text-xs text-muted-foreground">
                  {labelFor(RESPONSIBILITY_STATUSES, review.status)}
                  {review.notes ? ` · ${review.notes}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {data.session.general_notes && (
        <Panel title="Notas de la sesión">
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {data.session.general_notes}
          </p>
        </Panel>
      )}
    </div>
  );
}
