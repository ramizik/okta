import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { getOrder, recordPayment, updateOrder } from "@/lib/store";
import { isPaid } from "@/lib/pitcrew-ui";

// Success redirect from repair Checkout. The session is verified server-side
// here rather than in a webhook — that's what lets the demo run without
// `stripe listen`, and it survives a refresh because it's idempotent.

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const fail = (id?: string) =>
    NextResponse.redirect(
      new URL(id ? `/garage/orders/${id}?paid=0` : "/garage", request.url),
    );

  if (!sessionId || !stripeEnabled || !stripe) return fail();

  const auth = await auth0.getSession();
  if (!auth) {
    return NextResponse.redirect(new URL("/auth/login?returnTo=/garage", request.url));
  }

  try {
    const checkout = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = String(checkout.metadata?.orderId ?? "");
    const order = await getOrder(orderId);

    // The session_id alone must not be able to flip an order: the caller has
    // to be signed in as the customer who owns it.
    const email = (auth.user.email ?? "").toLowerCase();
    if (!order || order.customerEmail.toLowerCase() !== email) return fail();

    if (checkout.payment_status !== "paid") return fail(order.id);

    if (!isPaid(order)) await updateOrder(order.id, { status: "PAID" });
    // recordPayment is a no-op once a payment exists, so a refresh of this
    // URL can't double-log the receipt line on the service record.
    await recordPayment(order.id, {
      at: new Date().toISOString(),
      amountCents: checkout.amount_total ?? 0,
      processor: "Stripe",
      reference: checkout.id,
    });

    return NextResponse.redirect(
      new URL(`/garage/orders/${order.id}?paid=1`, request.url),
    );
  } catch {
    return fail();
  }
}
