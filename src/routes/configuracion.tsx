import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader, Panel, StatusBadge } from "@/components/pc/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_WEIGHTS,
  DEV_INDEX_DISCLAIMER,
  WEIGHT_LABELS,
  saveWeights,
  weightsQuery,
  type IndexWeights,
} from "@/lib/development";

const ROLES = [
  { name: "People & Culture", access: "Acceso completo", active: true },
  { name: "Responsable directo", access: "Su equipo directo", active: false },
  { name: "CEO", access: "Vista agregada", active: false },
  { name: "Colaborador", access: "Su propia información", active: false },
];

export const Route = createFileRoute("/configuracion")({
  head: () => ({
    meta: [
      { title: "Configuración — People Hub" },
      { name: "description", content: "Configuración del hub interno de People & Culture." },
      { property: "og:title", content: "Configuración — People Hub" },
      { property: "og:description", content: "Roles, pesos del índice de desarrollo y preferencias." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Configuracion,
});

function Configuracion() {
  const queryClient = useQueryClient();
  const { data } = useQuery(weightsQuery);
  const [weights, setWeights] = useState<IndexWeights>(DEFAULT_WEIGHTS);

  useEffect(() => {
    if (data) setWeights(data);
  }, [data]);

  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  const save = useMutation({
    mutationFn: () => saveWeights(weights),
    onSuccess: () => {
      toast.success("Pesos actualizados.");
      void queryClient.invalidateQueries({ queryKey: ["development-weights"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configuración"
        subtitle="Preferencias del espacio de trabajo y arquitectura de accesos."
      />

      <Panel
        title="Pesos del índice de desarrollo"
        description="Deben sumar exactamente 100%."
        actions={
          <StatusBadge tone={total === 100 ? "positive" : "critical"}>Total {total}%</StatusBadge>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {(Object.keys(WEIGHT_LABELS) as (keyof IndexWeights)[]).map((key) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`w-${key}`}>{WEIGHT_LABELS[key]}</Label>
              <Input
                id={`w-${key}`}
                type="number"
                min={0}
                max={100}
                value={weights[key]}
                onChange={(e) =>
                  setWeights({ ...weights, [key]: Number(e.target.value || 0) })
                }
              />
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{DEV_INDEX_DISCLAIMER}</p>
        <div className="mt-4 flex gap-2">
          <Button disabled={total !== 100 || save.isPending} onClick={() => save.mutate()}>
            Guardar pesos
          </Button>
          <Button variant="ghost" onClick={() => setWeights(DEFAULT_WEIGHTS)}>
            Restablecer
          </Button>
        </div>
      </Panel>

      <Panel title="Roles" description="Arquitectura preparada para futuras fases.">
        <ul className="divide-y divide-border">
          {ROLES.map((role) => (
            <li key={role.name} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{role.name}</p>
                <p className="text-xs text-muted-foreground">{role.access}</p>
              </div>
              <StatusBadge tone={role.active ? "positive" : "neutral"}>
                {role.active ? "Activo" : "Próximamente"}
              </StatusBadge>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Integraciones" description="Se habilitarán en fases posteriores.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {["Google Calendar", "Gmail", "Drive", "Sheets", "Slack", "Udemy"].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
            >
              <span className="text-sm">{item}</span>
              <StatusBadge tone="neutral">Fase 3</StatusBadge>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
