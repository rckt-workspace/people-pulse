import { createFileRoute } from "@tanstack/react-router";

const MAX_MESSAGE_LENGTH = 1000;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorMessage(error: unknown) {
  return {
    name: error instanceof Error ? error.name : "unknown",
    message: error instanceof Error ? error.message : String(error),
  };
}

export const Route = createFileRoute("/api/people-ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        console.info("[People AI API] request received");

        let body: { message?: unknown; employeeId?: unknown };
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ error: "El cuerpo de la solicitud no es JSON válido." }, 400);
        }

        const message = typeof body.message === "string" ? body.message.trim() : "";
        if (!message) return jsonResponse({ error: "El mensaje es obligatorio." }, 400);
        if (message.length > MAX_MESSAGE_LENGTH) {
          return jsonResponse({ error: `El mensaje supera los ${MAX_MESSAGE_LENGTH} caracteres.` }, 400);
        }

        const employeeId = typeof body.employeeId === "string" && body.employeeId ? body.employeeId : undefined;

        try {
          // Import dinámico: el código de servidor no entra en el bundle del navegador.
          const { answerPeopleAssistant } = await import("@/agent/people-assistant.server");
          const result = await answerPeopleAssistant(message, employeeId);
          console.info("[People AI API] response ready", { source: result.source });
          return jsonResponse({ answer: result.answer, source: result.source });
        } catch (error) {
          console.error("[People AI API] failed", errorMessage(error));
          return jsonResponse({ error: "No se pudo procesar la solicitud." }, 500);
        }
      },
    },
  },
});
