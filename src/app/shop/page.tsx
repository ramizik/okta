import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, ClipboardList, Clock, DollarSign, Timer } from "lucide-react";
import { getPlan } from "@/lib/plans";
import { auth0 } from "@/lib/auth0";
import { getSeedUser } from "@/lib/roles";
import { approvedTotalCents, getOrders, getShop } from "@/lib/store";
import { formatRelative, formatUsd } from "@/lib/format";
import { isPaid, orderTotalCents, vehicleName } from "@/lib/pitcrew-ui";
import { AppTopBar, RoleSwitchHint } from "@/components/pitcrew/app-shell";
import { StatCard } from "@/components/pitcrew/primitives";
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

      <main className="mx-auto max-w-[1280px] px-6 py-8">
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Orders today"
            value={String(orders.length)}
            icon={<ClipboardList className="h-4 w-4" />}
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
            icon={<DollarSign className="h-4 w-4" />}
          />
          <StatCard
            label="Avg approval"
            value="14 min"
            hint="Down from 3.5 hours"
            icon={<Timer className="h-4 w-4" />}
          />
        </div>

        <OrdersTable rows={rows} />
      </main>
    </div>
  );
}
