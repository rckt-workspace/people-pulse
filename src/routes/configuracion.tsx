import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, StatusBadge } from "@/components/pc/primitives";

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
      { property: "og:description", content: "Roles, periodos y preferencias del hub." },
    ],
  }),
  component: Configuracion,
});

function Configuracion() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Configuración"
        subtitle="Preferencias del espacio de trabajo y arquitectura de accesos."
      />
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
