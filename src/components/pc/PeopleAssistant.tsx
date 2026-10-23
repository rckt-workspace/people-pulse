import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Send, Sparkles, X } from "lucide-react";

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
          <div className="max-w-[88%] whitespace-pre-line rounded-2xl rounded-tl-md border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm">
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
                <div className="min-w-0 max-w-[84%] space-y-2">
                  <div
                    className={`whitespace-pre-line rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      m.error
                        ? "border border-destructive/30 bg-destructive/5 text-destructive"
                        : "border border-border bg-background text-foreground"
                    }`}
                  >
                    {m.text}
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
