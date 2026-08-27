import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/pc/primitives";

export const Route = createFileRoute("/people-insights")({
  head: () => ({
    meta: [
      { title: "People Insights — People Hub" },
      { name: "description", content: "Analítica agregada de personas, bienestar y desempeño." },
      { property: "og:title", content: "People Insights — People Hub" },
      {
        property: "og:description",
        content: "Analítica agregada de personas, bienestar y desempeño.",
      },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      title="People Insights"
      subtitle="Lectura transversal de patrones de bienestar, desempeño y desarrollo."
    />
  ),
});
