"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import type { RepairOrder } from "@/lib/types";

/**
 * Customer-side view of the adviser's workbench: the technician's raw notes on
 * the left, the plain-English report they became on the right. The shop screen
 * shows this split to the adviser; showing the customer the same source is the
 * trust argument — nothing was added, it was only translated.
 */
export function ReportProvenance({ order }: { order: RepairOrder }) {
  const [open, setOpen] = useState(false);
  const findings = order.report?.findings ?? [];
  if (!order.report || !order.rawTechNotes.trim()) return null;

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors duration-150 hover:bg-secondary/60"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">
            Where this report came from
          </span>
          <span className="block text-[13px] text-muted-foreground">
            Your technician&apos;s original notes, and the plain English we
            turned them into.
          </span>
        </span>
        <ChevronDown
          className={
            "h-4 w-4 shrink-0 transition-transform duration-200 " +
            (open ? "rotate-180" : "")
          }
        />
      </button>

      {open && (
        <div className="border-t border-border">
          <div className="grid gap-px bg-border md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <div className="bg-card p-5">
              <p className="label-caps">What the technician wrote</p>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-muted-foreground">
                {order.rawTechNotes}
              </pre>
            </div>

            <div className="hidden items-center justify-center bg-card px-3 md:flex">
              <span className="rounded-full border border-border bg-secondary/60 p-2 text-muted-foreground">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>

            <div className="bg-card p-5">
              <p className="label-caps">What PitCrew wrote for you</p>
              <p className="mt-3 text-[14px] leading-relaxed text-foreground/90">
                {order.report.summary}
              </p>
              <ul className="mt-4 space-y-2">
                {findings
                  .filter((f) => f.severity !== "green")
                  .map((f) => (
                    <li
                      key={f.id}
                      className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 text-[13px]"
                    >
                      <span
                        aria-hidden
                        className={
                          "mt-1.5 h-2 w-2 rounded-full " +
                          (f.severity === "red"
                            ? "bg-sev-red-fg"
                            : "bg-sev-amber-fg")
                        }
                      />
                      <span className="text-foreground/80">{f.title}</span>
                    </li>
                  ))}
              </ul>
              <p className="mt-4 text-[12px] text-muted-foreground">
                {findings.length} findings · every price comes from your shop&apos;s
                published menu, not from the AI.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
