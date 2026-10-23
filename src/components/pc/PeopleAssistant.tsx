import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Send, Sparkles, X } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  chatWithPeopleAssistant,
  type AssistantAnswer,
} from "@/agent/functions/people-assistant.functions";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
  source?: AssistantAnswer["source"];
  error?: boolean;
};

const INTRO =
  "¡Hola! 👋 Soy People AI.\nPuedo ayudarte a preparar conversaciones 1:1, analizar indicadores, revisar bloqueos, compromisos y oportunidades de desarrollo del equipo.\n\n¿En qué puedo ayudarte?";

const QUICK_ACTIONS = [
  "¿Quién necesita atención?",
  "Preparar un 1:1",
  "Analizar bloqueos",
  "Oportunidades de desarrollo",
];

// Estilos editoriales para las respuestas de People AI. Sin HTML crudo: react-markdown no renderiza HTML por defecto.
const markdownComponents: Components = {
  p: ({ children }) => <p className="my-2 text-sm leading-6 first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  h1: ({ children }) => (
    <h1 className="mb-1.5 mt-3 text-base font-semibold text-foreground first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-1.5 mt-3 text-base font-semibold text-foreground first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-3 text-sm font-semibold text-foreground first:mt-0">{children}</h3>
  ),
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5 text-sm marker:text-primary/60 first:mt-0 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5 text-sm marker:font-medium marker:text-primary first:mt-0 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
  hr: () => <hr className="my-3 border-border" />,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-primary/30 pl-3 text-muted-foreground">{children}</blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-700">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs">{children}</pre>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
    >
      {children}
    </a>
  ),
  // Las tablas se evitan en el prompt; si llegan, se contienen dentro del panel.
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-border bg-slate-50 px-2 py-1.5 text-left font-semibold text-foreground">{children}</th>
  ),
  td: ({ children }) => <td className="border-b border-border px-2 py-1.5 align-top last:border-0">{children}</td>,
};

// Detecta la persona abierta en /personas/:id para pasarla como contexto.
function employeeFromPath(pathname: string): string | undefined {
  const match = /^\/personas\/([^/]+)\/?$/.exec(pathname);
  return match && match[1] !== "nueva" ? match[1] : undefined;
}

function Avatar({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ${className}`}
    >
      <Sparkles className="size-4" />
    </span>
  );
}

export function PeopleAssistant() {
  const { pathname } = useLocation();
  const employeeId = employeeFromPath(pathname);

  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const nextId = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const push = (message: Omit<ChatMessage, "id">) =>
    setMessages((current) => [...current, { ...message, id: ++nextId.current }]);

  const ask = useMutation({
    mutationFn: (message: string) => chatWithPeopleAssistant({ data: { message, employeeId } }),
    onSuccess: (result) => push({ role: "assistant", text: result.answer, source: result.source }),
    onError: () =>
      push({ role: "assistant", text: "No pude responder ahora. Inténtalo de nuevo.", error: true }),
  });

  // Animación de entrada: se monta cerrado y pasa a visible en el siguiente frame.
  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, ask.isPending]);

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || ask.isPending) return;
    setDraft("");
    push({ role: "user", text: value });
    ask.mutate(value);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Habla con People AI"
        className="fixed bottom-4 right-4 z-50 inline-flex h-12 items-center gap-3 rounded-full border border-border bg-background pl-1.5 pr-5 text-sm font-medium text-foreground shadow-[0_10px_30px_-12px_rgba(37,99,235,0.45)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-14px_rgba(37,99,235,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:bottom-6 sm:right-6"
      >
        <span className="relative inline-flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
          <span
            aria-hidden="true"
            className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-emerald-500"
          />
        </span>
        <span className="sm:hidden">People AI</span>
        <span className="hidden sm:inline">Habla con People AI</span>
      </button>
    );
  }

  return (
    <section
      role="dialog"
      aria-label="People AI"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
      className={`fixed bottom-3 right-3 z-50 flex h-[min(650px,80dvh)] w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-[0_28px_70px_-24px_rgba(15,23,42,0.35)] transition duration-300 ease-out sm:bottom-6 sm:right-6 sm:h-[min(690px,calc(100dvh-3rem))] sm:w-[440px] ${
        entered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="size-[18px]" />
            <span
              aria-hidden="true"
              className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background bg-emerald-500"
            />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-foreground">
              People AI
              <Sparkles aria-hidden="true" className="size-3.5 text-primary/70" />
            </p>
            <p className="truncate text-xs text-muted-foreground">Tu copiloto de People &amp; Culture</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Cerrar People AI"
          onClick={() => setOpen(false)}
          className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <X className="size-4" />
        </button>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5"
      >
        <div className="flex items-start gap-3">
          <Avatar className="size-8" />
          <div className="min-w-0 flex-1 whitespace-pre-line rounded-2xl rounded-tl-md border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm">
            {INTRO}
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="flex flex-wrap gap-2 pl-11">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => submit(action)}
                disabled={ask.isPending}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
              >
                {action}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex items-start gap-3">
                <Avatar className="size-8" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div
                    className={`min-w-0 break-words rounded-2xl rounded-tl-md px-4 py-3 shadow-sm ${
                      m.error
                        ? "border border-destructive/30 bg-destructive/5 text-sm text-destructive"
                        : "border border-border bg-background text-foreground"
                    }`}
                  >
                    {m.error ? (
                      m.text
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {m.text}
                      </ReactMarkdown>
                    )}
                  </div>
                  {m.source === "fallback" ? (
                    <div className="flex flex-wrap items-center gap-1.5 pl-1 text-xs text-muted-foreground">
                      <span
                        title="People AI no estuvo disponible para esta respuesta."
                        className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600"
                      >
                        Análisis local
                      </span>
                      <span>People AI no estuvo disponible para esta respuesta.</span>
                    </div>
                  ) : m.source === "ai" ? (
                    <div className="pl-1">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        People AI
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ),
          )
        )}

        {ask.isPending ? (
          <div role="status" aria-live="polite" className="flex items-start gap-3">
            <Avatar className="size-8" />
            <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-border bg-background px-4 py-3 shadow-sm">
              <span className="sr-only">People AI está respondiendo</span>
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  aria-hidden="true"
                  style={{ animationDelay: `${delay}ms` }}
                  className="size-1.5 animate-bounce rounded-full bg-primary/70"
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
        }}
        className="flex items-end gap-2 border-t border-border bg-background px-4 py-3"
      >
        <textarea
          rows={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit(draft);
            }
          }}
          placeholder="Escribe tu pregunta..."
          aria-label="Mensaje para People AI"
          maxLength={1000}
          disabled={ask.isPending}
          className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
        />
        <button
          type="submit"
          aria-label="Enviar"
          disabled={!draft.trim() || ask.isPending}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition duration-150 hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </form>
    </section>
  );
}
