import { NextResponse } from "next/server";
import { resetStore, getState } from "@/lib/store";

// Demo safety net: returns the app to a clean seeded state.
// GET is supported so it can be hit from a browser address bar mid-demo.

function reset() {
  resetStore();
  const { orders, seededAt } = getState();
  return NextResponse.json({
    ok: true,
    seededAt,
    orders: orders.map((o) => ({ id: o.id, status: o.status })),
  });
}

export async function POST() {
  return reset();
}

export async function GET() {
  return reset();
}
