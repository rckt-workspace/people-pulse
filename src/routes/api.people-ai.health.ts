import { createFileRoute } from "@tanstack/react-router";

// Health sin dependencias: no llama a OpenRouter ni a Supabase.
export const Route = createFileRoute("/api/people-ai/health")({
  server: {
    handlers: {
      GET: async () =>
        new Response(JSON.stringify({ status: "ok", service: "people-ai" }), {
          headers: { "Content-Type": "application/json" },
        }),
    },
  },
});
