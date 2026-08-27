import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/pc/primitives";

export const Route = createFileRoute("/desarrollo")({
  head: () => ({
    meta: [
      { title: "Desarrollo — People Hub" },
      { name: "description", content: "Planes de desarrollo y competencias del equipo." },
      { property: "og:title", content: "Desarrollo — People Hub" },
      { property: "og:description", content: "Planes de desarrollo y competencias del equipo." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      title="Desarrollo"
      subtitle="Planes de desarrollo, competencias y crecimiento profesional."
    />
  ),
});
