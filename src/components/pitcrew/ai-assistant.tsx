"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, X, ArrowUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Page-aware AI assistant. The server rebuilds the data context from the
// session on every request — this component only reports the current path.
// Replies stream from POST /api/chat (MiniMax M3 via OpenRouter).

type ChatMessage = { id: string; role: "user" | "assistant"; text: string };

interface PageContext {
  label: string;
  blurb: string;
  role: "advisor" | "customer";
}

function suggestionsFor(path: string, role: PageContext["role"]): string[] {
  const onOrder = /\/orders\/[\w-]+/.test(path);
  if (onOrder && path.startsWith("/shop")) {
    return [
      "Summarize the technician findings",
      "Which item should I call the customer about first?",
      "What hasn't the customer approved yet?",
    ];
  }
  if (onOrder) {
    return [
      "Why does my car need this repair?",
      "What happens if I decline a repair?",
      "When will my car be ready?",
    ];
  }
  if (path.startsWith("/shop")) {
    return [
      "Which orders are waiting on approval?",
      "What's blocking the oldest job?",
      "How do approvals and payment work?",
    ];
  }
  if (path.startsWith("/garage")) {
    return [
      "What's the status of my car?",
      "What did the inspection find?",
      "How much will I pay in total?",
    ];
  }
  return role === "advisor"
    ? [
        "How does PitCrew help my shop?",
        "What does the customer see?",
        "How are repair reports generated?",
      ]
    : [
        "What does PitCrew do?",
        "What did the inspection find?",
        "How do I approve and pay?",
      ];
}

function Bubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-[14px] leading-relaxed text-primary-foreground">
          {message.text}
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2.5">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy text-navy-foreground">
        <Bot className="h-3.5 w-3.5" />
      </span>
      <p className="whitespace-pre-wrap pt-1 text-[14px] leading-relaxed text-foreground">
        {message.text}
      </p>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2.5">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy text-navy-foreground">
        <Bot className="h-3.5 w-3.5" />
      </span>
      <span className="pt-1.5 text-[14px] text-muted-foreground">
        <span className="inline-flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
        </span>
      </span>
    </div>
  );
}

export function AiAssistant() {
  const pathname = usePathname() ?? "/";
  const [ctx, setCtx] = useState<PageContext | null>(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Signed-in gate + header copy for the current page.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/chat/context?path=${encodeURIComponent(pathname)}`)
      .then(async (r) => {
        if (cancelled) return;
        setCtx(r.ok ? await r.json() : null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!ctx || pathname === "/") return null;

  async function send(text: string) {
    const value = text.trim();
    if (!value || thinking) return;
    const history = [...messages, { id: crypto.randomUUID(), role: "user" as const, text: value }];
    setMessages(history);
    setInput("");
    setThinking(true);

    const assistantId = crypto.randomUUID();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history
            .slice(-12)
            .map((m) => ({ role: m.role, content: m.text })),
          path: pathname,
        }),
      });
      if (!res.ok || !res.body) throw new Error(String(res.status));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let started = false;
      for (;;) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        acc += decoder.decode(chunk, { stream: true });
        if (!started && acc.trim()) {
          started = true;
          setThinking(false);
        }
        const snapshot = acc;
        setMessages([
          ...history,
          { id: assistantId, role: "assistant", text: snapshot },
        ]);
      }
      if (!acc.trim()) throw new Error("empty");
    } catch {
      setMessages([
        ...history,
        {
          id: assistantId,
          role: "assistant",
          text: "Sorry — I couldn't answer that just now. Give it another try in a moment.",
        },
      ]);
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-navy px-4 py-3 text-sm font-semibold text-navy-foreground shadow-float transition-transform duration-150 hover:scale-[1.03] active:scale-95"
      >
        {open ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
        <span className="hidden sm:inline">{open ? "Close" : "Ask PitCrew AI"}</span>
      </button>

      {open && (
        <div
          className="pointer-events-none fixed inset-0 z-50"
          role="dialog"
          aria-label="PitCrew AI assistant"
        >
          <div className="pointer-events-auto absolute bottom-0 right-0 flex h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-float sm:bottom-20 sm:right-5 sm:h-[560px] sm:max-h-[calc(100vh-7rem)] sm:w-[400px] sm:rounded-2xl">
            <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-navy px-4 py-3 text-navy-foreground">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy-soft">
                <Bot className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">PitCrew AI</p>
                <p className="truncate text-xs text-navy-foreground/70">
                  {ctx.label} · {ctx.blurb}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 transition-colors hover:bg-navy-soft"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div>
                  <p className="text-[15px] font-semibold">How can I help?</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                    Ask about this repair, the inspection findings, pricing or
                    timing — I read the page you&apos;re on.
                  </p>
                  <div className="mt-4 grid gap-2">
                    {suggestionsFor(pathname, ctx.role).map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-xl border border-border bg-secondary/60 px-3 py-2 text-left text-[13.5px] leading-snug transition-colors hover:border-primary/40 hover:bg-secondary"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <Bubble key={m.id} message={m} />
              ))}

              {thinking && <ThinkingDots />}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="border-t border-border bg-card p-3"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-primary/50">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder="Ask about your repair…"
                  maxLength={1000}
                  className="max-h-28 resize-none bg-transparent px-1.5 py-1 text-[14px] leading-relaxed outline-none placeholder:text-muted-foreground"
                />
                <Button
                  type="submit"
                  size="icon-sm"
                  className="shrink-0"
                  disabled={!input.trim() || thinking}
                  aria-label="Send message"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                PitCrew AI can make mistakes — confirm major repairs with your
                advisor.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
