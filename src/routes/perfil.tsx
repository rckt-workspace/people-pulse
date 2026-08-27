import { createFileRoute } from "@tanstack/react-router";
import { InitialsAvatar, PageHeader, Panel } from "@/components/pc/primitives";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — People Hub" },
      { name: "description", content: "Perfil del usuario administrador de People & Culture." },
      { property: "og:title", content: "Perfil — People Hub" },
      { property: "og:description", content: "Perfil del usuario administrador del hub." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  return (
    <div className="space-y-8">
      <PageHeader title="Perfil" subtitle="Tu cuenta dentro del hub de People & Culture." />
      <Panel>
        <div className="flex items-center gap-4">
          <InitialsAvatar name="People Culture" size="lg" />
          <div>
            <p className="text-base font-semibold">People &amp; Culture</p>
            <p className="text-sm text-muted-foreground">people@empresa.com</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Rol: administrador con acceso completo
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
