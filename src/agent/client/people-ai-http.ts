// Cliente HTTP de People AI. Llama a la API same-origin /api/people-ai/*.
// Patrón equivalente al chatClient de Tania: timeout propio, errores por status, sin reintentos automáticos.

export type PeopleAiAnswer = {
  answer: string;
  source: "ai" | "fallback";
};

const CHAT_ENDPOINT = "/api/people-ai/chat";
const HEALTH_ENDPOINT = "/api/people-ai/health";

// El servidor tiene un timeout de 90 s hacia OpenRouter; el cliente lo iguala.
const CHAT_TIMEOUT_MS = 90_000;
// Warmup corto: despierta el servicio en Render Free sin bloquear nada.
const WARMUP_TIMEOUT_MS = 20_000;

const MESSAGES_BY_STATUS: Record<number, string> = {
  400: "La solicitud no es válida. Revisa el mensaje e inténtalo de nuevo.",
  429: "People AI está recibiendo muchas consultas. Inténtalo en unos minutos.",
  500: "No se pudo procesar la solicitud.",
  502: "El servicio de IA no respondió correctamente. Inténtalo de nuevo.",
  503: "El servicio no está disponible en este momento. Inténtalo más tarde.",
  504: "El servicio tardó demasiado en responder. Inténtalo de nuevo.",
};

function httpError(status: number, message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function cancelledError() {
  const error = new Error("La solicitud fue cancelada.");
  error.name = "AbortError";
  return error;
}

function isPeopleAiAnswer(value: unknown): value is PeopleAiAnswer {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { answer?: unknown; source?: unknown };
  return (
    typeof candidate.answer === "string" &&
    candidate.answer.trim().length > 0 &&
    (candidate.source === "ai" || candidate.source === "fallback")
  );
}

export async function sendPeopleAiMessage({
  message,
  employeeId,
  signal,
}: {
  message: string;
  employeeId?: string | undefined;
  signal?: AbortSignal | undefined;
}): Promise<PeopleAiAnswer> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onAbort);
  }

  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, employeeId }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      const detail = body.error ?? `Error ${response.status}.`;
      throw httpError(response.status, MESSAGES_BY_STATUS[response.status] ?? detail);
    }

    const data: unknown = await response.json();
    if (!isPeopleAiAnswer(data)) throw new Error("Respuesta inválida del servidor.");
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      if (signal?.aborted) throw cancelledError();
      throw new Error("El servidor tardó demasiado. Inténtalo de nuevo.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onAbort);
  }
}

// Nunca lanza: solo despierta el servicio. Si falla, el primer mensaje reintenta de forma natural.
export async function warmUpPeopleAi(): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS);
  try {
    await fetch(HEALTH_ENDPOINT, { method: "GET", signal: controller.signal });
  } catch {
    // Silencioso a propósito.
  } finally {
    clearTimeout(timeoutId);
  }
}
