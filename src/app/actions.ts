"use server";

import { revalidatePath } from "next/cache";
import { auth0 } from "@/lib/auth0";
import { getSeedUser, resolveRole } from "@/lib/roles";
import {
  appendEvent,
  approvedTotalCents,
  getOrder,
  getShop,
  setFindingPart,
  setItemApproval,
  updateOrder,
} from "@/lib/store";
import { CUSTOMER_LABELS } from "@/lib/pitcrew-ui";
import { generateReport } from "@/lib/ai";
import { searchPartsForFinding } from "@/lib/parts";
import type { PartOffer, RepairOrder } from "@/lib/types";

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

/** Who to credit in the order history for an advisor-side action. */
function advisorName(session: { user: { email?: string; name?: string } }) {
  const named =
    getSeedUser(session.user.email)?.name ?? session.user.name ?? "Adviser";
  return `${named}, service adviser`;
}

async function requireOwner(orderId: string): Promise<RepairOrder> {
  const session = await auth0.getSession();
  const order = await getOrder(orderId);
  if (!session || !order) throw new Error("Not authorized");
  const email = (session.user.email ?? "").toLowerCase();
  if (order.customerEmail.toLowerCase() !== email) {
    throw new Error("Not authorized");
  }
  return order;
}

/** The wow moment: raw tech notes → plain-English report. Never throws on stage. */
export async function generateOrderReportAction(orderId: string) {
  const session = await requireAdvisor();
  const order = await getOrder(orderId);
  if (!order) return { ok: false as const, source: "fallback" as const };

  const { report, source } = await generateReport(
    order.rawTechNotes,
    order.vehicle,
  );
  await updateOrder(orderId, { report });
  await appendEvent(orderId, {
    actor: source === "live" ? "PitCrew AI" : "PitCrew (offline template)",
    label: "Inspection report written",
    detail: `${report.findings.length} findings from the technician's notes · verdict ${report.verdict.replace(/_/g, " ").toLowerCase()} · reviewed by ${advisorName(session)}`,
  });

  revalidatePath(`/shop/orders/${orderId}`);
  revalidatePath("/shop");
  return { ok: true as const, source };
}

export async function saveNotesAction(orderId: string, rawTechNotes: string) {
  await requireAdvisor();
  await updateOrder(orderId, { rawTechNotes });
  revalidatePath(`/shop/orders/${orderId}`);
  return { ok: true as const };
}

export async function sendToCustomerAction(orderId: string) {
  const session = await requireAdvisor();
  const order = await getOrder(orderId);
  if (!order?.report) return { ok: false as const };
  await updateOrder(orderId, { status: "AWAITING_APPROVAL" });
  await appendEvent(orderId, {
    actor: advisorName(session),
    label: "Report sent to customer",
    detail: `Sent to ${order.customerEmail} for per-item approval`,
  });
  revalidatePath(`/shop/orders/${orderId}`);
  revalidatePath("/shop");
  revalidatePath("/garage");
  return { ok: true as const };
}

export async function advanceStatusAction(
  orderId: string,
  status: RepairOrder["status"],
) {
  const session = await requireAdvisor();
  await updateOrder(orderId, { status });
  await appendEvent(orderId, {
    actor: advisorName(session),
    label: `Status moved to ${CUSTOMER_LABELS[status]}`,
  });
  revalidatePath(`/shop/orders/${orderId}`);
  revalidatePath("/garage");
  revalidatePath(`/garage/orders/${orderId}`);
  revalidatePath("/shop");
  return { ok: true as const };
}

/** Per-item approve / decline. `null` clears the answer. */
export async function setApprovalAction(
  orderId: string,
  findingId: string,
  approved: boolean | null,
) {
  await requireOwner(orderId);
  // Use the returned order, not the pre-mutation snapshot — with the shared
  // store the snapshot no longer aliases the stored object.
  const updated = await setItemApproval(orderId, findingId, approved);
  if (!updated) throw new Error("Unknown order or finding");

  // Any approval activity moves a sent report into the approved lane.
  if (updated.status === "AWAITING_APPROVAL") {
    const anyApproved = (updated.report?.findings ?? []).some(
      (f) => f.approved === true,
    );
    if (anyApproved) {
      await updateOrder(orderId, { status: "APPROVED" });
      await appendEvent(orderId, {
        actor: `${updated.customerName}, customer`,
        label: "Work authorised",
        detail: "Approved items released to the shop for scheduling",
      });
    }
  }

  revalidatePath(`/garage/orders/${orderId}`);
  revalidatePath("/garage");
  revalidatePath(`/shop/orders/${orderId}`);
  revalidatePath("/shop");
  return { ok: true as const, totalCents: approvedTotalCents(updated) };
}

/**
 * Advisor-only: source real, purchasable parts for one finding.
 * Read-only — it never mutates the order, so it's safe to call repeatedly.
 * Customers must never reach this (it burns SerpApi quota and is shop-side work).
 */
export async function searchPartsAction(orderId: string, findingId: string) {
  await requireAdvisor();
  const order = await getOrder(orderId);
  const finding = order?.report?.findings.find((f) => f.id === findingId);
  if (!order || !finding) {
    return { ok: false as const, query: "", offers: [], source: "fallback" as const };
  }

  const result = await searchPartsForFinding(
    finding,
    order.vehicle,
    (await getShop()).location,
  );
  return { ok: true as const, ...result };
}

/** Advisor-only: attach a chosen offer to the finding. `null` clears it. */
export async function selectPartAction(
  orderId: string,
  findingId: string,
  part: PartOffer | null,
) {
  await requireAdvisor();
  await setFindingPart(orderId, findingId, part);
  revalidatePath(`/shop/orders/${orderId}`);
  return { ok: true as const };
}

// Repair payment lives in POST /api/checkout/repair — it has to hand back a
// Stripe Checkout URL, and nothing the client can call may mark an order paid.
