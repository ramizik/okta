"use client";

import { Eye, Hourglass, Timer, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/format";
import type { Finding } from "@/lib/types";
import { cn } from "@/lib/utils";

const wash: Record<Finding["severity"], string> = {
  red: "border-l-sev-red-fg bg-sev-red-bg/60",
  amber: "border-l-sev-amber-fg bg-sev-amber-bg/60",
  green: "border-l-sev-green-fg bg-sev-green-bg/60",
};

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 sm:grid-cols-[auto_7.5rem_minmax(0,1fr)]">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span className="label-caps">{label}</span>
      <span className="col-span-2 text-[13px] leading-snug sm:col-span-1">
        {value}
      </span>
    </div>
  );
}

export function FindingCard({
  finding,
  mode,
  index = 0,
  pending = false,
  onDecision,
}: {
  finding: Finding;
  mode: "shop" | "customer" | "paid";
  index?: number;
  pending?: boolean;
  /** null clears the decision (toggling the active choice off). */
  onDecision?: (approved: boolean | null) => void;
}) {
  const approved = finding.approved === true;
  const declined = finding.approved === false;

  return (
    <article
      className={cn(
        "pit-rise rounded-lg border border-l-4 border-border bg-card p-4 shadow-card transition-all duration-150",
        wash[finding.severity],
        approved && "border-l-sev-green-fg ring-1 ring-sev-green-border",
        declined && "opacity-60",
        pending && "opacity-70",
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <h3 className="text-[15px] font-semibold leading-snug">
          {finding.title}
        </h3>
        <span className="tnum shrink-0 text-base font-semibold">
          {finding.priceCents > 0 ? formatUsd(finding.priceCents) : "No cost"}
        </span>
      </div>

      <p className="mt-1.5 text-[13px] leading-snug text-foreground/90">
        {finding.plain}
      </p>

      {mode !== "shop" && finding.youllNotice && (
        <div className="mt-3 space-y-1.5 border-t border-border/70 pt-3">
          <Row
            icon={<Eye className="h-3.5 w-3.5" />}
            label="You'll notice"
            value={finding.youllNotice}
          />
          {finding.ifYouWait && (
            <Row
              icon={<Hourglass className="h-3.5 w-3.5" />}
              label="If you wait"
              value={finding.ifYouWait}
            />
          )}
          {finding.urgency && (
            <Row
              icon={<Timer className="h-3.5 w-3.5" />}
              label="Urgency"
              value={finding.urgency}
            />
          )}
        </div>
      )}

      {mode === "customer" && finding.priceCents > 0 && (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <Button
            variant={declined ? "secondary" : "outline"}
            size="sm"
            disabled={pending}
            onClick={() => onDecision?.(declined ? null : false)}
          >
            <X className="h-4 w-4" /> Decline
          </Button>
          <Button
            size="sm"
            variant={approved ? "default" : "outline"}
            disabled={pending}
            onClick={() => onDecision?.(approved ? null : true)}
          >
            <Check className="h-4 w-4" /> Approve
          </Button>
        </div>
      )}

      {(mode === "paid" || mode === "shop") && finding.approved !== null && (
        <div className="mt-3 flex justify-end">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              approved
                ? "bg-sev-green-bg text-sev-green-fg"
                : "bg-secondary text-muted-foreground",
            )}
          >
            {approved ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
            {approved ? "Approved" : "Declined"}
          </span>
        </div>
      )}
    </article>
  );
}
