import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, Clock, DollarSign, Package } from "lucide-react";
import { getPlan, planUsage, type PlanUsage } from "@/lib/plans";
import { auth0 } from "@/lib/auth0";
import { getSeedUser } from "@/lib/roles";
import { approvedTotalCents, getOrders, getShop } from "@/lib/store";
import { formatRelative, formatUsd } from "@/lib/format";
import {
  isPaid,
  orderTotalCents,
  partsSourcedCount,
  partsSpendCents,
  vehicleName,
} from "@/lib/pitcrew-ui";
import { AppTopBar, RoleSwitchHint } from "@/components/pitcrew/app-shell";
import { Meter, StatCard } from "@/components/pitcrew/primitives";
import { OrdersTable, type OrderRow } from "./orders-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Repair orders — PitCrew shop dashboard",
  description:
    "Track repair orders, approvals awaiting customers, and revenue for your shop in one dashboard.",
};

export default async function ShopDashboard({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string }>;
}) {
  const { subscribed } = await searchParams;
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login?returnTo=/shop");

  const shop = getShop();
  const user = getSeedUser(session.user.email);
  const orders = getOrders(shop.id);

  const rows: OrderRow[] = orders.map((o) => ({
    id: o.id,
    vehicle: vehicleName(o),
    plate: o.vehicle.plate,
    customerName: o.customerName,
    status: o.status,
    paid: isPaid(o),
    total: formatUsd(orderTotalCents(o)),
    updated: formatRelative(o.updatedAt),
  }));

  const awaiting = orders.filter((o) => o.status === "AWAITING_APPROVAL").length;
  const revenueCents = orders
    .filter(isPaid)
    .reduce((sum, o) => sum + approvedTotalCents(o), 0);
  const partsCents = orders.reduce((sum, o) => sum + partsSpendCents(o), 0);
  const partsCount = orders.reduce((sum, o) => sum + partsSourcedCount(o), 0);
  const usage = planUsage(shop.plan, orders.length);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen">
      <AppTopBar
        role="advisor"
        user={user?.name ?? session.user.name ?? "Advisor"}
        shopName={shop.name}
      />
      <RoleSwitchHint email={session.user.email} />

      <main className="app-container py-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold">Repair orders</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {shop.name} · {today}
            </p>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 rounded-full border border-border bg-card px-3 py-1 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:border-primary/40 hover:text-foreground"
          >
            {shop.plan ? (
              <>
                <span className="capitalize">{shop.plan}</span> plan · Manage
              </>
            ) : (
              "Choose a plan"
            )}
          </Link>
        </div>

        {subscribed && getPlan(subscribed) && (
          <div className="mt-6 rounded-xl border border-sev-green-border bg-sev-green-bg p-5">
            <p className="flex items-center gap-2 font-semibold text-sev-green-fg">
              <Check className="h-5 w-5" /> {getPlan(subscribed)?.name} plan is
              active
            </p>
            <p className="mt-1 text-[15px] text-foreground/80">
              {shop.name} is subscribed. Every advisor on this shop can generate
              reports and take payments.
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Spent on parts"
            value={formatUsd(partsCents)}
            hint={
              partsCount
                ? `${partsCount} part${partsCount === 1 ? "" : "s"} sourced across open orders`
                : "Source parts from an order to start tracking"
            }
            icon={<Package className="h-4 w-4" />}
          />
          <StatCard
            label="Awaiting approval"
            value={String(awaiting)}
            hint="Customer hasn't responded"
            icon={<Clock className="h-4 w-4" />}
          />
          <StatCard
            label="Approved revenue"
            value={formatUsd(revenueCents)}
            hint={
              partsCents
                ? `${formatUsd(revenueCents - partsCents)} after parts`
                : undefined
            }
            icon={<DollarSign className="h-4 w-4" />}
          />
        </div>

        <PlanUsagePanel usage={usage} />

        <OrdersTable rows={rows} />
      </main>
    </div>
  );
}

// The monetization nudge: an advisor sees exactly how much of their plan the
// month's repair orders have eaten, and what upgrading buys them.
function PlanUsagePanel({ usage }: { usage: PlanUsage }) {
  const unlimited = usage.limit === null;
  const tone = usage.atLimit ? "over" : usage.nearLimit ? "warn" : "neutral";

  return (
    <section className="mt-4 rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="label-caps">Plan usage</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {usage.planName}
            </span>
          </div>

          <p className="tnum mt-2 text-lg font-semibold">
            {unlimited ? (
              <>
                {usage.used} repair orders this month ·{" "}
                <span className="text-muted-foreground">unlimited</span>
              </>
            ) : (
              <>
                {usage.used} of {usage.limit} repair orders used this month
              </>
            )}
          </p>

          <Meter percent={usage.percent} tone={tone} className="mt-3" />

          <p className="mt-2 text-[13px] text-muted-foreground">
            {unlimited
              ? "Pro plan — no monthly cap on orders, reports or payments."
              : usage.atLimit
                ? `You've hit the ${usage.planName} cap. Upgrade to keep generating reports and taking payments.`
                : `${usage.remaining} order${usage.remaining === 1 ? "" : "s"} left before you need to upgrade.`}
          </p>
        </div>

        {usage.nextPlan && (
          <Link
            href="/pricing"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary-hover"
          >
            Upgrade to {usage.nextPlan.name} · $
            {usage.nextPlan.priceCents / 100}/mo
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </section>
  );
}
