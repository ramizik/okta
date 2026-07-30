import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Wrench } from "lucide-react";
import { auth0 } from "@/lib/auth0";
import { getSeedUser } from "@/lib/roles";
import { getOrder, getShop } from "@/lib/store";
import { AppTopBar } from "@/components/pitcrew/app-shell";
import { EmptyState } from "@/components/pitcrew/primitives";
import { Button } from "@/components/ui/button";
import { CustomerReport } from "./report";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your repair report — PitCrew",
  description:
    "Read what your shop found in plain English, approve only the work you want, and pay online.",
};

export default async function GarageOrder({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth0.getSession();
  if (!session) redirect(`/auth/login?returnTo=/garage/orders/${id}`);

  const user = getSeedUser(session.user.email);
  const name = user?.name ?? session.user.name ?? "Customer";
  const order = getOrder(id);

  // Ownership check: someone else's order is a not-found, never data.
  const owned =
    order &&
    order.customerEmail.toLowerCase() ===
      (session.user.email ?? "").toLowerCase();

  if (!owned) {
    return (
      <div className="min-h-screen">
        <AppTopBar role="customer" user={name} shopName={getShop().name} />
        <main className="mx-auto max-w-3xl px-6 py-16">
          <EmptyState
            icon={<Wrench className="h-5 w-5" />}
            title="We couldn't load this report"
            description="The link may be out of date. Head back to your garage and try again."
            action={
              <Button asChild>
                <Link href="/garage">Back to my garage</Link>
              </Button>
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <AppTopBar role="customer" user={name} shopName={order.shopName} />
      <CustomerReport order={order} />
    </div>
  );
}
