"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/pitcrew/primitives";
import { StatusBadge } from "@/components/pitcrew/status";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface OrderRow {
  id: string;
  vehicle: string;
  plate: string;
  customerName: string;
  status: OrderStatus;
  paid: boolean;
  total: string;
  updated: string;
}

const tabs = ["All", "Needs action", "In progress", "Ready"] as const;
type Tab = (typeof tabs)[number];

function matches(tab: Tab, o: OrderRow) {
  if (tab === "All") return true;
  if (tab === "Needs action")
    return o.status === "CHECKED_IN" || o.status === "INSPECTION_COMPLETE";
  if (tab === "In progress")
    return (
      o.status === "AWAITING_APPROVAL" ||
      o.status === "APPROVED" ||
      o.status === "PAID" ||
      o.status === "IN_PROGRESS"
    );
  return o.status === "READY";
}

export function OrdersTable({ rows }: { rows: OrderRow[] }) {
  const [tab, setTab] = useState<Tab>("All");
  const visible = rows.filter((o) => matches(tab, o));

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150",
              tab === t
                ? "bg-navy text-navy-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="hidden grid-cols-[2fr_1.2fr_1.3fr_0.8fr_0.6fr] gap-4 border-b border-border px-6 py-3 md:grid">
          {["Vehicle", "Customer", "Status", "Total", "Updated"].map((h) => (
            <span key={h} className="label-caps">
              {h}
            </span>
          ))}
        </div>

        {visible.length === 0 ? (
          <EmptyState
            className="border-0"
            icon={<ClipboardList className="h-5 w-5" />}
            title="No orders in this view"
            description="Try another filter — your other repair orders are still there."
          />
        ) : (
          visible.map((o) => (
            <Link
              key={o.id}
              href={`/shop/orders/${o.id}`}
              className="grid gap-2 border-b border-border px-6 py-4 transition-colors duration-150 last:border-0 hover:bg-background md:grid-cols-[2fr_1.2fr_1.3fr_0.8fr_0.6fr] md:items-center md:gap-4"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{o.vehicle}</p>
                <p className="font-mono text-[13px] text-muted-foreground">
                  {o.plate}
                </p>
              </div>
              <p className="truncate text-sm">{o.customerName}</p>
              <div>
                <StatusBadge status={o.status} paid={o.paid} />
              </div>
              <p className="tnum text-sm font-semibold">{o.total}</p>
              <p className="text-[13px] text-muted-foreground">{o.updated}</p>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
