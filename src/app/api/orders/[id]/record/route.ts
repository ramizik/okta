import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { resolveRole } from "@/lib/roles";
import { getOrder } from "@/lib/store";
import { SHOP_PHONE } from "@/lib/pitcrew-ui";
import { buildServiceRecordPdf } from "@/lib/service-record";

// The take-away service record. Advisors can pull any order in their shop;
// customers only their own — same ownership rule as the report screen.

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.redirect(
      new URL(`/auth/login?returnTo=/garage/orders/${id}`, request.url),
    );
  }

  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const email = (session.user.email ?? "").toLowerCase();
  const role = resolveRole(email);
  const allowed =
    role === "advisor" || order.customerEmail.toLowerCase() === email;
  if (!allowed) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const pdf = await buildServiceRecordPdf(order, {
    shopPhone: SHOP_PHONE,
    issuedFor: session.user.name ?? session.user.email ?? "PitCrew user",
  });

  const filename = `PitCrew-service-record-${order.id}.pdf`;
  return new NextResponse(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
