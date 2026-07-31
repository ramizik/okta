import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Car } from "lucide-react";
import { auth0 } from "@/lib/auth0";
import { getSeedUser } from "@/lib/roles";
import { getOrdersForCustomer, getShop } from "@/lib/store";
import { formatUsd } from "@/lib/format";
import { isPaid, serviceHistory, vehicleName } from "@/lib/pitcrew-ui";
import { AppTopBar, RoleSwitchHint } from "@/components/pitcrew/app-shell";
import { EmptyState } from "@/components/pitcrew/primitives";
import { StatusBadge, VerdictBadge } from "@/components/pitcrew/status";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Garage — PitCrew",
  description:
    "See your vehicle's health, read your repair report in plain English, and approve the work you want done.",
};

export default async function Garage() {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login?returnTo=/garage");

  const shop = await getShop();
  const user = getSeedUser(session.user.email);
  const orders = await getOrdersForCustomer(session.user.email ?? "");
  const name = user?.name ?? session.user.name ?? "Customer";
  const firstName = name.split(" ")[0];

  return (
    <div className="min-h-screen">
      <AppTopBar role="customer" user={name} shopName={shop.name} />
      <RoleSwitchHint email={session.user.email} />

      <main className="app-container py-8">
        <h1 className="text-3xl font-bold">My Garage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, {firstName}
        </p>

        <div className="mt-6 space-y-4">
          {orders.length === 0 ? (
            <EmptyState
              icon={<Car className="h-5 w-5" />}
              title="No vehicles yet"
              description="Once your shop checks a vehicle in, it will show up here."
            />
          ) : (
            orders.map((o) => {
              const findings = o.report?.findings ?? [];
              const attention = findings.filter(
                (f) => f.severity !== "green",
              ).length;
              return (
                <Link
                  key={o.id}
                  href={`/garage/orders/${o.id}`}
                  className="block overflow-hidden rounded-xl border border-border bg-card shadow-card transition-colors duration-150 hover:border-primary/40"
                >
                  <div className="grid gap-6 p-6 md:grid-cols-[18rem_minmax(0,1fr)]">
                    <div className="relative overflow-hidden rounded-xl bg-secondary">
                      {o.vehicle.photoUrl ? (
                        <Image
                          src={o.vehicle.photoUrl}
                          alt={vehicleName(o)}
                          width={1024}
                          height={640}
                          className="h-44 w-full object-cover md:h-full"
                        />
                      ) : (
                        <div className="grid h-44 w-full place-items-center text-muted-foreground">
                          <Car className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold">
                        {vehicleName(o)}
                      </h2>
                      <p className="mt-1 font-mono text-[13px] text-muted-foreground">
                        {o.vehicle.mileage.toLocaleString("en-US")} mi
                      </p>

                      {o.report && (
                        <div className="mt-4">
                          <VerdictBadge verdict={o.report.verdict} />
                        </div>
                      )}
                      {findings.length > 0 && (
                        <p className="mt-3 text-[15px] text-muted-foreground">
                          {attention} finding{attention === 1 ? "" : "s"} need
                          your attention
                        </p>
                      )}

                      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
                        <span className="min-w-0 truncate text-sm text-muted-foreground">
                          At {o.shopName} ·{" "}
                          <StatusBadge status={o.status} paid={isPaid(o)} />
                        </span>
                        <Button className="shrink-0" variant="outline" asChild>
                          <span>
                            Service Info <ArrowRight className="h-4 w-4" />
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Service history</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card shadow-card">
            {serviceHistory.map((h) => (
              <div
                key={h.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-6 py-4 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px]">{h.label}</p>
                  <p className="text-[13px] text-muted-foreground">{h.date}</p>
                </div>
                <span className="tnum shrink-0 text-sm text-muted-foreground">
                  {formatUsd(h.totalCents)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
