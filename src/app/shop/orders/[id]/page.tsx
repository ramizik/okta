import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { auth0 } from "@/lib/auth0";
import { getSeedUser } from "@/lib/roles";
import { getOrder, getShop } from "@/lib/store";
import { AppTopBar } from "@/components/pitcrew/app-shell";
import { EmptyState } from "@/components/pitcrew/primitives";
import { Button } from "@/components/ui/button";
import { OrderWorkbench } from "./workbench";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Repair order — PitCrew shop",
  description:
    "Turn raw technician notes into a customer-ready PitCrew report, then send it for approval.",
};

export default async function ShopOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth0.getSession();
  if (!session) redirect(`/auth/login?returnTo=/shop/orders/${id}`);

  const shop = await getShop();
  const user = getSeedUser(session.user.email);
  const order = await getOrder(id);
  const advisorName = user?.name ?? session.user.name ?? "Adviser";

  if (!order || order.shopId !== shop.id) {
    return (
      <div className="min-h-screen">
        <AppTopBar role="advisor" user={advisorName} shopName={shop.name} />
        <main className="app-container py-16">
          <EmptyState
            icon={<Sparkles className="h-5 w-5" />}
            title="We couldn't find that order"
            description="It may have been closed or the link is out of date."
            action={
              <Button asChild>
                <Link href="/shop">Back to orders</Link>
              </Button>
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppTopBar role="advisor" user={advisorName} shopName={shop.name} />
      <OrderWorkbench order={order} />
    </div>
  );
}
