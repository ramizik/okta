import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { resolveRole } from "@/lib/roles";
import { getPlan } from "@/lib/plans";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { setShopPlan } from "@/lib/store";

// Shop subscription checkout. Only an advisor can put their shop on a plan,
// and the price always comes from the server-side plan table.

export async function POST(request: NextRequest) {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (resolveRole(session.user.email) !== "advisor") {
    return NextResponse.json(
      { error: "Only repair advisors can manage the subscription" },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { plan?: string };
  const plan = getPlan(body.plan ?? "");
  if (!plan) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  const origin =
    process.env.APP_BASE_URL ?? request.nextUrl.origin ?? "http://localhost:3000";

  // No Stripe key configured: activate the plan directly so the demo path
  // still completes end to end.
  if (!stripeEnabled || !stripe) {
    setShopPlan(plan.id);
    return NextResponse.json({
      url: `/shop?subscribed=${plan.id}&demo=1`,
      demo: true,
    });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: session.user.email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: plan.priceCents,
          recurring: { interval: "month" },
          product_data: {
            name: `PitCrew ${plan.name}`,
            description: plan.blurb,
          },
        },
      },
    ],
    metadata: { plan: plan.id, shopEmail: session.user.email ?? "" },
    success_url: `${origin}/api/checkout/confirm?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?canceled=1`,
  });

  return NextResponse.json({ url: checkout.url, demo: false });
}
