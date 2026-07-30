"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X } from "lucide-react";

// Floating page-aware assistant. Renders only for signed-in users.
// The server rebuilds data context from the session on every request —
// this component only ever reports which page the user is looking at.

interface Msg {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

function suggestionsFor(path: string): string[] {
  if (/^\/garage\/orders\//.test(path)) {
    return [
      "What needs attention most?",
      "What happens if I skip a repair?",
      "Why does this cost what it costs?",
    ];
  }
  if (path.startsWith("/garage")) {
    return [
      "What did the inspection find?",
      "Is my car safe to drive?",
      "How do I approve and pay?",
    ];
  }
  if (/^\/shop\/orders\//.test(path)) {
    return ["Summarize this order", "What hasn't the customer approved yet?"];
  }
  if (path.startsWith("/shop")) {
    return ["Which orders need action?", "What's awaiting approval?"];
  }
  return ["What does PitCrew do?", "What's included in the Pro plan?"];
}

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hi! I can answer questions about this page — inspections, findings, prices, what happens if you wait on a repair. What would you like to know?",
};

export function ChatWidget() {
  const pathname = usePathname() ?? "/";
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/auth/profile")
      .then((r) => {
        if (!cancelled) setSignedIn(r.ok);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!signedIn) return null;

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setInput("");
    setBusy(true);

    const history = [...messages.filter((m) => !m.error), { role: "user" as const, content: question }];
    setMessages([...history, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Greeting stays client-side; send real turns only.
          messages: history.slice(1).slice(-12),
          path: pathname,
        }),
      });
      if (!res.ok || !res.body) throw new Error(String(res.status));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const snapshot = acc;
        setMessages([
          ...history,
          { role: "assistant", content: snapshot },
        ]);
      }
      if (!acc.trim()) throw new Error("empty");
    } catch {
      setMessages([
        ...history,
        {
          role: "assistant",
          content:
            "Sorry — I couldn't answer that just now. Give it another try in a moment.",
          error: true,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const showSuggestions =
    !busy && messages.filter((m) => m.role === "user").length === 0;

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-4 z-50 flex h-[min(560px,calc(100dvh-8rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-float"
          role="dialog"
          aria-label="PitCrew Assistant"
        >
          <div className="flex items-center justify-between bg-navy px-4 py-3 text-navy-foreground">
            <div>
              <p className="text-sm font-semibold">PitCrew Assistant</p>
              <p className="text-xs text-navy-foreground/70">
                Ask about anything on this page
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-lg p-1.5 transition-colors duration-150 hover:bg-navy-soft"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user" ? "flex justify-end" : "flex justify-start"
                }
              >
                <div
                  className={
                    "max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-[14px] leading-relaxed " +
                    (m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : m.error
                        ? "border border-sev-amber-border bg-sev-amber-bg text-foreground"
                        : "bg-secondary text-foreground")
                  }
                >
                  {m.content ||
                    (busy && i === messages.length - 1 ? (
                      <span className="inline-flex gap-1" aria-label="Thinking">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                      </span>
                    ) : null)}
                </div>
              </div>
            ))}

            {showSuggestions && (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestionsFor(pathname).map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-[13px] text-muted-foreground transition-colors duration-150 hover:border-primary hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border px-3 py-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your report…"
              aria-label="Message the PitCrew Assistant"
              maxLength={1000}
              className="h-10 flex-1 rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors duration-150 focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-opacity duration-150 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close PitCrew Assistant" : "Open PitCrew Assistant"}
        className="fixed bottom-6 right-4 z-50 grid h-13 w-13 place-items-center rounded-full bg-primary text-primary-foreground shadow-float transition-transform duration-150 hover:scale-105"
        style={{ height: 52, width: 52 }}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </button>
    </>
  );
}
