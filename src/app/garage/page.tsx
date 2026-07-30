import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { getSeedUser } from "@/lib/roles";
import { getOrdersForCustomer, getShop } from "@/lib/store";
import { AppHeader } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

// Placeholder customer garage — proves auth + data wiring.
// Phase 5 / Lovable UI replaces the body of this page.
export default async function Garage() {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login?returnTo=/garage");

  const user = getSeedUser(session.user.email);
  const orders = getOrdersForCustomer(session.user.email ?? "");
  const firstName = (user?.name ?? session.user.name ?? "there").split(" ")[0];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        name={user?.name ?? session.user.name ?? "Customer"}
        role="customer"
        shopName={getShop().name}
      />
      <main className="mx-auto max-w-[1280px] px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">My Garage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, {firstName}
        </p>
        <div className="mt-8 grid gap-4">
          {orders.length === 0 && (
            <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
              No vehicles here yet.
            </div>
          )}
          {orders.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-xl border bg-card p-6"
            >
              <div>
                <div className="text-lg font-semibold">
                  {o.vehicle.year} {o.vehicle.make} {o.vehicle.model}{" "}
                  {o.vehicle.trim}
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {o.vehicle.plate} ·{" "}
                  {o.vehicle.mileage.toLocaleString("en-US")} mi
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  At {o.shopName}
                </div>
              </div>
              <Badge variant="secondary">{o.status.replaceAll("_", " ")}</Badge>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
