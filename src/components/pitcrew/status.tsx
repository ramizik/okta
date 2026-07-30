"use client";

import { useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import {
  CUSTOMER_LABELS,
  SHOP_LABELS,
  SHOP_STEP_DETAILS,
  STATUS_FLOW,
  STEP_DETAILS,
} from "@/lib/pitcrew-ui";
import type { OrderStatus, Severity, Verdict } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusStepper({
  status,
  audience = "shop",
  interactive = false,
  allowFuture = false,
  detailOverrides,
}: {
  status: OrderStatus;
  audience?: "shop" | "customer";
  interactive?: boolean;
  allowFuture?: boolean;
  detailOverrides?: Partial<Record<OrderStatus, ReactNode>>;
}) {
  const labels = audience === "customer" ? CUSTOMER_LABELS : SHOP_LABELS;
  const current = Math.max(0, STATUS_FLOW.indexOf(status));
  const [selected, setSelected] = useState<number | null>(null);
  const active = selected ?? current;
  const activeStatus = STATUS_FLOW[active];
  const detail = (audience === "customer" ? STEP_DETAILS : SHOP_STEP_DETAILS)[
    activeStatus
  ];
  const override = detailOverrides?.[activeStatus];

  const stepProps = (i: number) =>
    interactive && (allowFuture || i <= current)
      ? {
          role: "button" as const,
          tabIndex: 0,
          onClick: () => setSelected(i),
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelected(i);
            }
          },
          className:
            "cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        }
      : {};

  return (
    <div>
      <div className="hidden items-start md:flex">
        {STATUS_FLOW.map((s, i) => {
          const done = i < current;
          const isCurrent = i === current;
          const isSelected = interactive && i === active;
          return (
            <div
              key={s}
              {...stepProps(i)}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center",
                stepProps(i).className,
              )}
            >
              <div className="flex w-full items-center">
                <span
                  className={cn(
                    "h-0.5 flex-1",
                    i === 0
                      ? "bg-transparent"
                      : done || isCurrent
                        ? "bg-primary"
                        : "bg-border",
                  )}
                />
                <span
                  className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors duration-150",
                    done && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-card ring-4 ring-primary/15",
                    !done && !isCurrent && "border-border bg-card",
                    isSelected && !isCurrent && "ring-4 ring-primary/15",
                  )}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        isCurrent ? "bg-primary" : "bg-border",
                      )}
                    />
                  )}
                </span>
                <span
                  className={cn(
                    "h-0.5 flex-1",
                    i === STATUS_FLOW.length - 1
                      ? "bg-transparent"
                      : done
                        ? "bg-primary"
                        : "bg-border",
                  )}
                />
              </div>
              <span
                className={cn(
                  "mt-2 px-1 text-center text-xs leading-tight",
                  isSelected || isCurrent
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {labels[s]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="md:hidden">
        <p className="text-sm font-medium">
          Step {current + 1} of {STATUS_FLOW.length} · {labels[status]}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-200"
            style={{
              width: `${((current + 1) / STATUS_FLOW.length) * 100}%`,
            }}
          />
        </div>
        {interactive && (
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
            {(allowFuture
              ? STATUS_FLOW
              : STATUS_FLOW.slice(0, current + 1)
            ).map((s, i) => (
              <button
                key={s}
                onClick={() => setSelected(i)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150",
                  i === active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                {labels[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      {interactive && (
        <div className="mt-5 rounded-lg border border-border bg-secondary/40 p-4">
          <p className="text-sm font-semibold">{labels[activeStatus]}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {detail.headline}
          </p>
          {detail.rows.length > 0 && (
            <dl className="mt-3 space-y-2">
              {detail.rows.map((r) => (
                <div
                  key={r.label}
                  className="grid gap-0.5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-3"
                >
                  <dt className="label-caps">{r.label}</dt>
                  <dd className="text-sm leading-relaxed">{r.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {override && <div className="mt-4">{override}</div>}
        </div>
      )}
    </div>
  );
}

const statusStyles: Record<OrderStatus, string> = {
  CHECKED_IN: "bg-secondary text-muted-foreground",
  INSPECTION_COMPLETE: "bg-primary/10 text-primary",
  AWAITING_APPROVAL:
    "bg-sev-amber-bg text-sev-amber-fg border border-sev-amber-border",
  APPROVED: "bg-sev-green-bg text-sev-green-fg border border-sev-green-border",
  PAID: "bg-sev-green-bg text-sev-green-fg border border-sev-green-border",
  IN_PROGRESS: "bg-primary/10 text-primary",
  READY: "bg-sev-green-fg text-card",
};

export function StatusBadge({
  status,
  paid,
}: {
  status: OrderStatus;
  paid?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
          statusStyles[status],
        )}
      >
        {SHOP_LABELS[status]}
      </span>
      {paid && status !== "PAID" && (
        <span className="inline-flex items-center rounded-full bg-sev-green-fg px-2.5 py-1 text-xs font-semibold text-card">
          Paid
        </span>
      )}
    </span>
  );
}

export const severityDot: Record<Severity, string> = {
  red: "bg-sev-red-fg",
  amber: "bg-sev-amber-fg",
  green: "bg-sev-green-fg",
};

export function SeverityDot({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 shrink-0 rounded-full",
        severityDot[severity],
      )}
    />
  );
}

// Only the alarming verdict gets a badge — routine verdicts stay quiet so
// red keeps its meaning ("Removed Safe to drive tag" in the design system).
const verdictMap: Partial<
  Record<Verdict, { label: string; icon: string; cls: string }>
> = {
  STOP_DRIVING: {
    label: "Stop driving",
    icon: "⛔",
    cls: "bg-sev-red-bg text-sev-red-fg border-sev-red-border",
  },
};

export function VerdictBadge({
  verdict,
  size = "lg",
}: {
  verdict: Verdict;
  size?: "sm" | "lg";
}) {
  const v = verdictMap[verdict];
  if (!v) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-bold uppercase tracking-[0.05em]",
        v.cls,
        size === "lg" ? "px-4 py-2 text-base" : "px-3 py-1 text-xs",
      )}
    >
      <span aria-hidden>{v.icon}</span>
      {v.label}
    </span>
  );
}
