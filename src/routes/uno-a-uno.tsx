import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/pc/primitives";

export const Route = createFileRoute("/uno-a-uno")({
  head: () => ({
    meta: [
      { title: "Conversaciones 1:1 — People Hub" },
      {
        name: "description",
        content: "Módulo de conversaciones 1:1 del hub de People & Culture.",
      },
      { property: "og:title", content: "Conversaciones 1:1 — People Hub" },
      { property: "og:description", content: "Preparación y registro de conversaciones 1:1." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      title="Conversaciones 1:1"
      subtitle="Preparar, conversar y registrar cada sesión con el equipo."
    />
  ),
});
