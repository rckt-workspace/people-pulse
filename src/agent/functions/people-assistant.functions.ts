import { createServerFn } from "@tanstack/react-start";

export type AssistantAnswer = {
  answer: string;
  source: "ai" | "fallback";
};

export const chatWithPeopleAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: { message: string; employeeId?: string | undefined }) => {
    const message = (data.message ?? "").trim();
    if (!message) throw new Error("El mensaje está vacío.");
    if (message.length > 1000) throw new Error("El mensaje supera los 1000 caracteres.");
    return { message, employeeId: data.employeeId || undefined };
  })
  .handler(async ({ data }): Promise<AssistantAnswer> => {
    const { answerPeopleAssistant } = await import("@/agent/people-assistant.server");
    return answerPeopleAssistant(data.message, data.employeeId);
  });
