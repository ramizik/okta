import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { resolveRole } from "@/lib/roles";
import { getOrders, getOrdersForCustomer, getShop } from "@/lib/store";
import { SHOP_LABELS, CUSTOMER_LABELS, vehicleName } from "@/lib/pitcrew-ui";

export const dynamic = "force-dynamic";

// GET /api/chat/context?path=… — header copy for the assistant panel.
// Doubles as the signed-in gate: 401 hides the widget entirely.
export async function GET(req: NextRequest) {
  const session = await auth0.getSession();
  if (!session?.user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const role = resolveRole(session.user.email);
  const path = req.nextUrl.searchParams.get("path") ?? "/";
  const orderId = path.match(/\/orders\/([\w-]+)/)?.[1];

  const visible =
    role === "advisor"
      ? await getOrders((await getShop()).id)
      : await getOrdersForCustomer(session.user.email);
  const order = orderId ? visible.find((o) => o.id === orderId) : undefined;

  if (order) {
    const isShop = path.startsWith("/shop");
    const status = (isShop ? SHOP_LABELS : CUSTOMER_LABELS)[order.status];
    return NextResponse.json({
      role,
      label: vehicleName(order),
      blurb: `${status}${isShop ? " · shop view" : ""}`,
    });
  }
  if (path.startsWith("/shop")) {
    return NextResponse.json({
      role,
      label: "Shop dashboard",
      blurb: "Ask about any job in the queue",
    });
  }
  if (path.startsWith("/garage")) {
    return NextResponse.json({
      role,
      label: "My Garage",
      blurb: "Ask about your vehicle and repairs",
    });
  }
  return NextResponse.json({
    role,
    label: "PitCrew",
    blurb: "Ask anything about how PitCrew works",
  });
}
