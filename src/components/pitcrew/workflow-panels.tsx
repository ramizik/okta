import Image from "next/image";
import {
  CheckCircle2,
  Circle,
  Loader2,
  MessageSquare,
  Phone,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeverityDot } from "@/components/pitcrew/status";
import { formatUsd } from "@/lib/format";
import {
  SHOP_PHONE,
  aiSummary,
  checkInPhotos,
  inspectionSteps,
  parseTechNotes,
  partsPurchased,
  repairTasks,
  techReports,
} from "@/lib/pitcrew-ui";
import type { RepairOrder } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Shop-side view of the awaiting-approval step: who inspected what, and the AI roll-up. */
export function TechWorkflowPanel({ order }: { order: RepairOrder }) {
  const findings = order.report?.findings ?? [];
  const approved = findings.filter((f) => f.approved === true).length;
  const priced = findings.filter((f) => f.priceCents > 0).length;
  // Fall back to the sample sheet only if this order's notes aren't structured.
  const parsedNotes = parseTechNotes(order.rawTechNotes);
  const sections = parsedNotes.length > 0 ? parsedNotes : techReports;

  return (
    <div>
      <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
        <p className="label-caps flex items-center gap-2 text-primary">
          <Sparkles className="h-3.5 w-3.5" /> AI summary of tech reports
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">
          {order.report?.summary ?? aiSummary}
        </p>
        <p className="mt-3 text-[13px] text-muted-foreground">
          {approved} of {priced} priced items approved by {order.customerName} so
          far.
        </p>
      </div>

      <p className="label-caps mt-5">Technician workflow</p>
      <div className="mt-2 space-y-2">
        {sections.map((t) => (
          <div key={t.id} className="rounded-lg border border-border bg-card p-3">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
              <SeverityDot severity={t.severity} />
              <p className="truncate text-sm font-semibold">
                {t.area}
                <span className="ml-2 font-normal text-muted-foreground">
                  {t.tech} · {t.role}
                </span>
              </p>
              <span className="tnum shrink-0 text-[13px] text-muted-foreground">
                {t.time}
              </span>
            </div>
            <p className="mt-2 font-mono text-[12px] leading-relaxed text-muted-foreground">
              {t.notes}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Customer-side view of the in-progress step: approved work, parts, ETA, contact. */
export function InProgressPanel({ order }: { order: RepairOrder }) {
  const approved = (order.report?.findings ?? []).filter(
    (f) => f.approved === true,
  );

  return (
    <div className="space-y-5">
      <div>
        <p className="label-caps">You approved</p>
        <div className="mt-2 space-y-1.5">
          {approved.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No items approved yet.
            </p>
          ) : (
            approved.map((f) => (
              <div
                key={f.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm"
              >
                <span className="truncate">{f.title}</span>
                <span className="tnum shrink-0 font-medium">
                  {formatUsd(f.priceCents)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <p className="label-caps">Work in progress</p>
        <div className="mt-2 space-y-2">
          {repairTasks.map((t) => (
            <div key={t.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-2.5">
              <span className="mt-0.5">
                {t.state === "done" ? (
                  <CheckCircle2 className="h-4 w-4 text-sev-green-fg" />
                ) : t.state === "active" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </span>
              <div className="min-w-0">
                <p className={cn("text-sm", t.state === "active" && "font-semibold")}>
                  {t.label}
                </p>
                <p className="text-[13px] text-muted-foreground">{t.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="label-caps">Parts purchased</p>
        <div className="mt-2 space-y-1.5">
          {partsPurchased.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-sm"
            >
              <span className="truncate">{p.label}</span>
              <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {p.status}
              </span>
              <span className="tnum shrink-0 font-medium">
                {formatUsd(p.priceCents)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-semibold">Estimated ready today, 4:30 PM</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          We&apos;ll text you the moment your {order.vehicle.model} is done.
          Questions about the work?
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <a href={`tel:${SHOP_PHONE.replace(/[^\d]/g, "")}`}>
              <Phone className="h-4 w-4" /> Call shop
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={`sms:${SHOP_PHONE.replace(/[^\d]/g, "")}`}>
              <MessageSquare className="h-4 w-4" /> Message advisor
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Customer-side view of the check-in step: photos taken when the car arrived. */
export function CheckInPhotosPanel() {
  return (
    <div>
      <p className="label-caps">Photos taken at drop-off</p>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {checkInPhotos.map((p) => (
          <figure
            key={p.id}
            className="overflow-hidden rounded-lg border border-border bg-card"
          >
            <Image
              src={p.src}
              alt={p.alt}
              width={1024}
              height={768}
              loading="lazy"
              className="h-24 w-full object-cover"
            />
            <figcaption className="px-2 py-1.5 text-[12px] leading-snug text-muted-foreground">
              {p.caption}
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-muted-foreground">
        We photograph every vehicle on arrival so there&apos;s a shared record
        of its condition.
      </p>
    </div>
  );
}

/** Customer-side view of the inspection step: which checks are done, active or pending. */
export function InspectionProgressPanel() {
  const done = inspectionSteps.filter((s) => s.state === "done").length;

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <p className="label-caps">Inspection checklist</p>
        <span className="tnum text-[13px] text-muted-foreground">
          {done} of {inspectionSteps.length} complete
        </span>
      </div>
      <div className="mt-2 space-y-2">
        {inspectionSteps.map((s) => (
          <div key={s.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2.5">
            <span className="mt-0.5">
              {s.state === "done" ? (
                <CheckCircle2 className="h-4 w-4 text-sev-green-fg" />
              ) : s.state === "active" ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
            </span>
            <div className="min-w-0">
              <p className={cn("text-sm", s.state === "active" && "font-semibold")}>
                {s.label}
                <span className="ml-2 text-[13px] font-normal text-muted-foreground">
                  {s.tech}
                </span>
              </p>
              <p className="text-[13px] leading-snug text-muted-foreground">
                {s.detail}
              </p>
            </div>
            <span className="tnum shrink-0 text-[12px] text-muted-foreground">
              {s.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
