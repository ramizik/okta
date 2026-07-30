"use server";

import { revalidatePath } from "next/cache";
import { auth0 } from "@/lib/auth0";
import { resolveRole } from "@/lib/roles";
import {
  approvedTotalCents,
  getOrder,
  setItemApproval,
  updateOrder,
} from "@/lib/store";
import { generateReport } from "@/lib/ai";
import type { RepairOrder } from "@/lib/types";

// Server actions are the whole write API for the demo. Every one of them
// re-checks the session: role for advisor actions, ownership for customer
// actions. The client never sends money totals — they're recomputed here.

async function requireAdvisor() {
  const session = await auth0.getSession();
  if (!session || resolveRole(session.user.email) !== "advisor") {
    throw new Error("Not authorized");
  }
  return session;
}

async function requireOwner(orderId: string): Promise<RepairOrder> {
  const session = await auth0.getSession();
  const order = getOrder(orderId);
  if (!session || !order) throw new Error("Not authorized");
  const email = (session.user.email ?? "").toLowerCase();
  if (order.customerEmail.toLowerCase() !== email) {
    throw new Error("Not authorized");
  }
  return order;
}

/** The wow moment: raw tech notes → plain-English report. Never throws on stage. */
export async function generateOrderReportAction(orderId: string) {
  await requireAdvisor();
  const order = getOrder(orderId);
  if (!order) return { ok: false as const, source: "fallback" as const };

  const { report, source } = await generateReport(
    order.rawTechNotes,
    order.vehicle,
  );
  updateOrder(orderId, { report });

  revalidatePath(`/shop/orders/${orderId}`);
  revalidatePath("/shop");
  return { ok: true as const, source };
}

export async function saveNotesAction(orderId: string, rawTechNotes: string) {
  await requireAdvisor();
  updateOrder(orderId, { rawTechNotes });
  revalidatePath(`/shop/orders/${orderId}`);
  return { ok: true as const };
}

export async function sendToCustomerAction(orderId: string) {
  await requireAdvisor();
  const order = getOrder(orderId);
  if (!order?.report) return { ok: false as const };
  updateOrder(orderId, { status: "AWAITING_APPROVAL" });
  revalidatePath(`/shop/orders/${orderId}`);
  revalidatePath("/shop");
  revalidatePath("/garage");
  return { ok: true as const };
}

export async function advanceStatusAction(
  orderId: string,
  status: RepairOrder["status"],
) {
  await requireAdvisor();
  updateOrder(orderId, { status });
  revalidatePath(`/shop/orders/${orderId}`);
  revalidatePath("/shop");
  return { ok: true as const };
}

/** Per-item approve / decline. `null` clears the answer. */
export async function setApprovalAction(
  orderId: string,
  findingId: string,
  approved: boolean | null,
) {
  const order = await requireOwner(orderId);
  setItemApproval(orderId, findingId, approved);

  // Any approval activity moves a sent report into the approved lane.
  if (order.status === "AWAITING_APPROVAL") {
    const anyApproved = (order.report?.findings ?? []).some(
      (f) => f.approved === true,
    );
    if (anyApproved) updateOrder(orderId, { status: "APPROVED" });
  }

  revalidatePath(`/garage/orders/${orderId}`);
  revalidatePath("/garage");
  revalidatePath(`/shop/orders/${orderId}`);
  revalidatePath("/shop");
  return { ok: true as const, totalCents: approvedTotalCents(order) };
}

/**
 * Demo payment. Phase 6 swaps the body for a Stripe Checkout Session built
 * from these same server-computed line items; the UI contract stays identical.
 */
export async function payOrderAction(orderId: string) {
  const order = await requireOwner(orderId);
  const totalCents = approvedTotalCents(order);
  if (totalCents <= 0) return { ok: false as const, totalCents: 0 };

  updateOrder(orderId, { status: "PAID" });
  revalidatePath(`/garage/orders/${orderId}`);
  revalidatePath("/garage");
  revalidatePath(`/shop/orders/${orderId}`);
  revalidatePath("/shop");
  return { ok: true as const, totalCents };
}
