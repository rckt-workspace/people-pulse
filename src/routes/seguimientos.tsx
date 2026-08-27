import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/pc/primitives";

export const Route = createFileRoute("/seguimientos")({
  head: () => ({
    meta: [
      { title: "Seguimientos — People Hub" },
      { name: "description", content: "Seguimiento de compromisos y acuerdos del equipo." },
      { property: "og:title", content: "Seguimientos — People Hub" },
      { property: "og:description", content: "Seguimiento de compromisos y acuerdos del equipo." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      title="Seguimientos"
      subtitle="Compromisos, acuerdos y seguimiento continuo del equipo."
    />
  ),
});
