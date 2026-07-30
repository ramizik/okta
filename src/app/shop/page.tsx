import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { getSeedUser } from "@/lib/roles";
import { getOrders, getShop } from "@/lib/store";
import { formatUsd, formatRelative } from "@/lib/format";
import { approvedTotalCents } from "@/lib/store";
import { AppHeader } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

// Placeholder advisor dashboard — proves auth + data wiring.
// Phase 3 / Lovable UI replaces the body of this page.
export default async function ShopDashboard() {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login?returnTo=/shop");

  const shop = getShop();
  const user = getSeedUser(session.user.email);
  const orders = getOrders(shop.id);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        name={user?.name ?? session.user.name ?? "Advisor"}
        role="advisor"
        shopName={shop.name}
      />
      <main className="mx-auto max-w-[1280px] px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Repair Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">{shop.name}</p>
        <div className="mt-8 overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Approved</th>
                <th className="px-4 py-3 text-right font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-semibold">
                      {o.vehicle.year} {o.vehicle.make} {o.vehicle.model}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {o.vehicle.plate}
                    </div>
                  </td>
                  <td className="px-4 py-3">{o.customerName}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">
                      {o.status.replaceAll("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatUsd(approvedTotalCents(o))}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatRelative(o.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
