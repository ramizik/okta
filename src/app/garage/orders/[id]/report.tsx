"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, Loader2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { FindingCard } from "@/components/pitcrew/finding-card";
import { EmptyState } from "@/components/pitcrew/primitives";
import { StatusStepper, VerdictBadge } from "@/components/pitcrew/status";
import {
  CheckInPhotosPanel,
  InProgressPanel,
  InspectionProgressPanel,
} from "@/components/pitcrew/workflow-panels";
import { ReportProvenance } from "@/components/pitcrew/report-provenance";
import { ServiceRecordPanel } from "@/components/pitcrew/service-record";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/format";
import { bySeverity, isPaid, vehicleName } from "@/lib/pitcrew-ui";
import type { RepairOrder } from "@/lib/types";
import { setApprovalAction } from "@/app/actions";

export function CustomerReport({ order }: { order: RepairOrder }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [paying, startPaying] = useTransition();
  const [showGood, setShowGood] = useState(false);

  const findings = order.report?.findings ?? [];
  const attention = findings.filter((f) => f.severity !== "green").sort(bySeverity);
  const good = findings.filter((f) => f.severity === "green");
  const approved = findings.filter((f) => f.approved === true);
  const totalCents = approved.reduce((s, f) => s + f.priceCents, 0);
  const paid = isPaid(order);
  // The take-away record only exists once money has moved. On a finished job it
  // leads the page; while work is still running it sits below the findings.
  const record = paid ? <ServiceRecordPanel order={order} /> : null;

  // Toast the outcome of a return trip from Stripe Checkout, once.
  const searchParams = useSearchParams();
  const announced = useRef(false);
  useEffect(() => {
    if (announced.current) return;
    const paidFlag = searchParams.get("paid");
    const canceled = searchParams.get("canceled");
    if (paidFlag === "1") {
      announced.current = true;
      toast.success("Payment received", {
        description: "Your shop has been notified and work is starting.",
      });
    } else if (paidFlag === "0") {
      announced.current = true;
      toast.error("We couldn't confirm that payment", {
        description: "Nothing was charged. You can try again.",
      });
    } else if (canceled === "1") {
      announced.current = true;
      toast("Checkout canceled", {
        description: "Your approvals are still saved.",
      });
    }
  }, [searchParams]);

  const decide = (findingId: string, value: boolean | null) =>
    startTransition(async () => {
      await setApprovalAction(order.id, findingId, value);
      router.refresh();
    });

  const pay = () =>
    startPaying(async () => {
      try {
        const res = await fetch("/api/checkout/repair", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          toast.error(data.error ?? "Could not start checkout");
          return;
        }
        // Relative URL = the no-Stripe demo path; absolute = Stripe Checkout.
        if (data.url.startsWith("/")) {
          toast.success(`Payment of ${formatUsd(totalCents)} received`, {
            description: "Your shop has been notified and work is starting.",
          });
          router.push(data.url);
          router.refresh();
        } else {
          window.location.assign(data.url);
        }
      } catch {
        toast.error("Could not reach checkout");
      }
    });

  return (
    <>
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Link
          href="/garage"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> My Garage
        </Link>

        <h1 className="mt-4 text-2xl font-bold md:text-3xl">
          {vehicleName(order)}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{order.shopName}</p>

        <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-card">
          <StatusStepper
            status={order.status}
            audience="customer"
            interactive
            detailOverrides={{
              CHECKED_IN: <CheckInPhotosPanel />,
              INSPECTION_COMPLETE: <InspectionProgressPanel />,
              IN_PROGRESS: <InProgressPanel order={order} />,
            }}
          />
        </div>

        {order.status === "READY" && record}

        {findings.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<Wrench className="h-5 w-5" />}
              title="Your vehicle is being inspected"
              description="We'll let you know the moment your report is ready to review."
            />
          </div>
        ) : (
          <>
            {paid && (
              <div className="mt-6 rounded-xl border border-sev-green-border bg-sev-green-bg p-5">
                <p className="flex items-center gap-2 font-semibold text-sev-green-fg">
                  <Check className="h-5 w-5" /> Payment received
                </p>
                <p className="mt-1 text-[15px] text-foreground/80">
                  Your shop has been notified and work is starting.
                </p>
              </div>
            )}

            {order.report && (
              <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-card">
                <VerdictBadge verdict={order.report.verdict} />
                <p className="mt-4 text-[15px] leading-relaxed text-foreground/90">
                  {order.report.summary}
                </p>
              </div>
            )}

            <ReportProvenance order={order} />

            <h2 className="mt-8 text-xl font-semibold">
              Needs attention ({attention.length})
            </h2>
            <div className="mt-3 space-y-4">
              {attention.map((f, i) => (
                <FindingCard
                  key={f.id}
                  finding={f}
                  index={i}
                  pending={pending}
                  mode={paid ? "paid" : "customer"}
                  onDecision={(value) => decide(f.id, value)}
                />
              ))}
            </div>

            {good.length > 0 && (
              <div className="mt-8">
                <button
                  onClick={() => setShowGood((v) => !v)}
                  className="flex w-full items-center gap-2 rounded-xl border border-border bg-card px-5 py-4 text-left text-sm font-semibold shadow-card transition-colors duration-150 hover:bg-secondary/60"
                >
                  <ChevronDown
                    className={
                      "h-4 w-4 transition-transform duration-200 " +
                      (showGood ? "rotate-180" : "")
                    }
                  />
                  Looked good ({good.length})
                </button>
                {showGood && (
                  <div className="mt-3 space-y-3">
                    {good.map((f, i) => (
                      <FindingCard
                        key={f.id}
                        finding={f}
                        index={i}
                        mode="paid"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {order.status !== "READY" && record}
      </main>

      {!paid && approved.length > 0 && (
        <div className="pit-rise fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card shadow-float">
          <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                {approved.length} of {attention.length} items approved
              </p>
              <p className="tnum text-xl font-bold">{formatUsd(totalCents)}</p>
            </div>
            <Button
              size="lg"
              className="shrink-0"
              disabled={paying}
              onClick={pay}
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                </>
              ) : (
                <>Pay {formatUsd(totalCents)}</>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
