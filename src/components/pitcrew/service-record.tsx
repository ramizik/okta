"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { RepairOrder } from "@/lib/types";

// Downloads the PDF through fetch so a failure surfaces as a toast instead of
// a blank tab. The href stays on the anchor-free path deliberately: the file
// is built server-side per request and must never be cached.
function useServiceRecord(order: RepairOrder) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/record`);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PitCrew-service-record-${order.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Service record downloaded");
    } catch {
      toast.error("Could not build the service record", {
        description: "Try again in a moment.",
      });
    } finally {
      setBusy(false);
    }
  };

  return { busy, download };
}

/** Compact action — advisor workbench header. */
export function ServiceRecordButton({
  order,
  variant = "outline",
}: {
  order: RepairOrder;
  variant?: "outline" | "secondary";
}) {
  const { busy, download } = useServiceRecord(order);
  return (
    <Button variant={variant} disabled={busy} onClick={download}>
      {busy ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Building…
        </>
      ) : (
        <>
          <FileText className="h-4 w-4" /> Service record
        </>
      )}
    </Button>
  );
}

/**
 * The end-of-cycle panel on the customer's report. Lists what the document
 * actually contains so the download isn't a mystery button.
 */
export function ServiceRecordPanel({ order }: { order: RepairOrder }) {
  const { busy, download } = useServiceRecord(order);
  const findings = order.report?.findings ?? [];
  const authorised = findings.filter((f) => f.approved === true).length;
  const deferred = findings.filter(
    (f) => f.severity !== "green" && f.approved !== true,
  ).length;
  const steps = order.events?.length ?? 0;

  const contents = [
    `${authorised} repair${authorised === 1 ? "" : "s"} you authorised, itemised with the parts fitted`,
    order.payment ? "Your payment and its reference number" : "What is still outstanding",
    deferred > 0
      ? `${deferred} item${deferred === 1 ? "" : "s"} we recommended but did not carry out`
      : "Everything else we inspected and cleared",
    `A timestamped history of all ${steps} steps, plus the technician's original notes`,
  ];

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
        <span className="mt-0.5 text-muted-foreground">
          <FileText className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Your service record</h2>
          <p className="mt-1 text-[15px] text-foreground/80">
            A complete PDF of this visit — keep it for your records, your
            warranty, or the next owner of the car.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2 text-[14px] text-muted-foreground">
        {contents.map((line) => (
          <li key={line} className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
            <span aria-hidden className="text-foreground/40">
              •
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <Button className="mt-5 w-full sm:w-auto" disabled={busy} onClick={download}>
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Building your record…
          </>
        ) : (
          <>
            <Download className="h-4 w-4" /> Download service record (PDF)
          </>
        )}
      </Button>
    </div>
  );
}
