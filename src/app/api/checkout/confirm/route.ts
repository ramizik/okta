import { NextRequest, NextResponse } from "next/server";
import { getPlan } from "@/lib/plans";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { setShopPlan } from "@/lib/store";

// Success redirect from Stripe Checkout. We verify the session server-side
// instead of relying on a webhook — that's what keeps the demo working
// without `stripe listen` running.

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const shopUrl = new URL("/shop", request.url);

  if (!sessionId || !stripeEnabled || !stripe) {
    shopUrl.searchParams.set("subscribed", "error");
    return NextResponse.redirect(shopUrl);
  }

  try {
    const checkout = await stripe.checkout.sessions.retrieve(sessionId);
    const plan = getPlan(String(checkout.metadata?.plan ?? ""));
    const complete =
      checkout.status === "complete" || checkout.payment_status === "paid";

    if (plan && complete) {
      setShopPlan(plan.id);
      shopUrl.searchParams.set("subscribed", plan.id);
    } else {
      shopUrl.searchParams.set("subscribed", "pending");
    }
  } catch {
    shopUrl.searchParams.set("subscribed", "error");
  }

  return NextResponse.redirect(shopUrl);
}
