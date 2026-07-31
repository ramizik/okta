import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { stripe, stripeEnabled } from "@/lib/stripe";
import {
  approvedTotalCents,
  getOrder,
  recordPayment,
  updateOrder,
} from "@/lib/store";
import { isPaid } from "@/lib/pitcrew-ui";

// Repair payment checkout. The customer pays for the items they approved —
// line items are rebuilt from the stored report every time, so a tampered
// client can't change what is charged.

export async function POST(request: NextRequest) {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { orderId?: string };
  const order = await getOrder(body.orderId ?? "");
  const email = (session.user.email ?? "").toLowerCase();

  // Ownership check: someone else's order is a not-found, never a charge.
  if (!order || order.customerEmail.toLowerCase() !== email) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (isPaid(order)) {
    return NextResponse.json({ url: `/garage/orders/${order.id}?paid=1` });
  }

  const approved = (order.report?.findings ?? []).filter(
    (f) => f.approved === true && f.priceCents > 0,
  );
  const totalCents = approvedTotalCents(order);
  if (approved.length === 0 || totalCents <= 0) {
    return NextResponse.json(
      { error: "Approve at least one item before paying" },
      { status: 400 },
    );
  }

  const origin =
    process.env.APP_BASE_URL ?? request.nextUrl.origin ?? "http://localhost:3000";

  // No Stripe key configured: mark it paid so the demo path still completes.
  if (!stripeEnabled || !stripe) {
    await updateOrder(order.id, { status: "PAID" });
    await recordPayment(order.id, {
      at: new Date().toISOString(),
      amountCents: totalCents,
      processor: "Demo",
      reference: `demo_${order.id}`,
    });
    return NextResponse.json({
      url: `/garage/orders/${order.id}?paid=1&demo=1`,
      demo: true,
    });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: session.user.email ?? undefined,
    // One line item per approved finding, so the itemisation the customer
    // approved is exactly what shows up on the Stripe receipt.
    line_items: approved.map((f) => ({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: f.priceCents,
        product_data: {
          name: f.title,
          description: f.plain.slice(0, 250),
        },
      },
    })),
    metadata: {
      orderId: order.id,
      vehicle: `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}`,
      shopName: order.shopName,
    },
    success_url: `${origin}/api/checkout/repair/confirm?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/garage/orders/${order.id}?canceled=1`,
  });

  return NextResponse.json({ url: checkout.url, demo: false });
}
