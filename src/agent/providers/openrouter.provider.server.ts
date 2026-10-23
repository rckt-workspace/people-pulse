export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenRouterChoice = {
  message?: {
    content?: string;
  };
};

type OpenRouterResponse = {
  choices?: OpenRouterChoice[];
};

export type OpenRouterChatOptions = {
  messages: OpenRouterMessage[];
  model?: string;
  responseFormat?: { type: "json_object" };
  temperature?: number;
};

// Los modelos gratuitos enrutados por openrouter/free pueden tardar más de 30 s con contexto real.
const OPENROUTER_TIMEOUT_MS = 90_000;

function requireServerEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
  return value;
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env["OPENROUTER_API_KEY"]?.trim() && process.env["OPENROUTER_MODEL"]?.trim());
}

export async function chatWithOpenRouter(options: OpenRouterChatOptions): Promise<string> {
  const apiKey = requireServerEnv("OPENROUTER_API_KEY");
  const model = options.model ?? requireServerEnv("OPENROUTER_MODEL");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const siteUrl = process.env["OPENROUTER_SITE_URL"]?.trim();
  const appName = process.env["OPENROUTER_APP_NAME"]?.trim() || "People Pulse";
  if (siteUrl) headers["HTTP-Referer"] = siteUrl;
  headers["X-Title"] = appName;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.2,
        ...(options.responseFormat ? { response_format: options.responseFormat } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenRouter request failed (${response.status}): ${body.slice(0, 500)}`);
    }

    const payload = (await response.json()) as OpenRouterResponse;
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("OpenRouter returned an empty response.");
    return content;
  } finally {
    clearTimeout(timeout);
  }
}
