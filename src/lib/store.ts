import { Redis } from "@upstash/redis";
import type {
  Finding,
  OrderEvent,
  PartOffer,
  PaymentRecord,
  RepairOrder,
  Shop,
  User,
} from "./types";
import { buildSeedOrders, SEED_SHOP, SEED_USERS, SEED_VERSION } from "./seed";

// Shared demo store. On Vercel each function instance used to hold its own
// globalThis copy, so the advisor screen, the customer screen and the chatbot
// could each see different data. State now lives in a single Redis JSON blob
// (Upstash) that every instance reads and writes. When the Redis env vars are
// absent (local dev before `vercel env pull`) it falls back to the old
// globalThis store, which is consistent within one process.

interface StoreState {
  seedVersion: number;
  shop: Shop;
  users: User[];
  orders: RepairOrder[];
  seededAt: string;
}

const KEY = "pitcrew:state";

const globalStore = globalThis as unknown as {
  __pitcrewStore?: StoreState;
  __pitcrewRedis?: Redis | null;
};

function getRedis(): Redis | null {
  if (globalStore.__pitcrewRedis !== undefined) {
    return globalStore.__pitcrewRedis;
  }
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  globalStore.__pitcrewRedis = url && token ? new Redis({ url, token }) : null;
  return globalStore.__pitcrewRedis;
}

function freshState(): StoreState {
  return {
    seedVersion: SEED_VERSION,
    shop: structuredClone(SEED_SHOP),
    users: structuredClone(SEED_USERS),
    orders: buildSeedOrders(),
    seededAt: new Date().toISOString(),
  };
}

// A stored state from an older seed reseeds itself — bump SEED_VERSION in
// seed.ts whenever demo data changes so prod never serves stale casts.
async function loadState(): Promise<StoreState> {
  const redis = getRedis();
  if (!redis) {
    const mem = globalStore.__pitcrewStore;
    if (!mem || mem.seedVersion !== SEED_VERSION) {
      globalStore.__pitcrewStore = freshState();
    }
    return globalStore.__pitcrewStore!;
  }
  const stored = await redis.get<StoreState>(KEY);
  if (stored && stored.seedVersion === SEED_VERSION) return stored;
  const fresh = freshState();
  await redis.set(KEY, fresh);
  return fresh;
}

async function saveState(state: StoreState): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    globalStore.__pitcrewStore = state;
    return;
  }
  await redis.set(KEY, state);
}

export async function resetStore(): Promise<void> {
  await saveState(freshState());
}

export async function getState(): Promise<StoreState> {
  return loadState();
}

export async function getShop(): Promise<Shop> {
  return (await loadState()).shop;
}

export async function setShopPlan(plan: Shop["plan"]): Promise<Shop> {
  const state = await loadState();
  state.shop.plan = plan;
  await saveState(state);
  return state.shop;
}

export async function getUsers(): Promise<User[]> {
  return (await loadState()).users;
}

export async function getOrders(shopId: string): Promise<RepairOrder[]> {
  // Hero order (ro_001) stays first; rest by most recently updated.
  return (await loadState()).orders
    .filter((o) => o.shopId === shopId)
    .sort((a, b) => {
      if (a.id === "ro_001") return -1;
      if (b.id === "ro_001") return 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
}

export async function getOrdersForCustomer(
  email: string,
): Promise<RepairOrder[]> {
  const needle = email.toLowerCase();
  return (await loadState()).orders
    .filter((o) => o.customerEmail.toLowerCase() === needle)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getOrder(id: string): Promise<RepairOrder | undefined> {
  return (await loadState()).orders.find((o) => o.id === id);
}

export async function updateOrder(
  id: string,
  patch: Partial<Omit<RepairOrder, "id">>,
): Promise<RepairOrder | undefined> {
  const state = await loadState();
  const order = state.orders.find((o) => o.id === id);
  if (!order) return undefined;
  Object.assign(order, patch, { updatedAt: new Date().toISOString() });
  await saveState(state);
  return order;
}

/**
 * Append one history entry. Repeated identical decisions (a customer toggling
 * approve → decline → approve) each get their own line — the record shows what
 * happened, not a tidied version of it.
 */
export async function appendEvent(
  orderId: string,
  event: Omit<OrderEvent, "at"> & { at?: string },
): Promise<RepairOrder | undefined> {
  const state = await loadState();
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return undefined;
  order.events = order.events ?? [];
  order.events.push({ at: event.at ?? new Date().toISOString(), ...event });
  order.updatedAt = new Date().toISOString();
  await saveState(state);
  return order;
}

export async function recordPayment(
  orderId: string,
  payment: PaymentRecord,
): Promise<RepairOrder | undefined> {
  const state = await loadState();
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return undefined;
  if (order.payment) return order; // idempotent — confirm route can be refreshed
  order.payment = payment;
  order.events = order.events ?? [];
  order.events.push({
    at: payment.at,
    actor: payment.processor === "Stripe" ? "Stripe" : "PitCrew (demo mode)",
    label: "Payment received",
    detail: `${(payment.amountCents / 100).toFixed(2)} USD · ref ${payment.reference}`,
  });
  order.updatedAt = new Date().toISOString();
  await saveState(state);
  return order;
}

export async function setItemApproval(
  orderId: string,
  itemId: string,
  approved: boolean | null,
): Promise<RepairOrder | undefined> {
  const state = await loadState();
  const order = state.orders.find((o) => o.id === orderId);
  const finding = order?.report?.findings.find((f) => f.id === itemId);
  if (!order || !finding) return undefined;
  finding.approved = approved;
  order.events = order.events ?? [];
  if (approved !== null) {
    order.events.push({
      at: new Date().toISOString(),
      actor: `${order.customerName}, customer`,
      label: approved ? "Approved a repair" : "Declined a repair",
      detail: `${finding.title} — ${(finding.priceCents / 100).toFixed(2)} USD`,
    });
  }
  order.updatedAt = new Date().toISOString();
  await saveState(state);
  return order;
}

/** Attach (or clear) the advisor-sourced part for one finding. */
export async function setFindingPart(
  orderId: string,
  findingId: string,
  part: PartOffer | null,
): Promise<RepairOrder | undefined> {
  const state = await loadState();
  const order = state.orders.find((o) => o.id === orderId);
  const finding = order?.report?.findings.find((f) => f.id === findingId);
  if (!order || !finding) return undefined;
  order.events = order.events ?? [];
  if (part) {
    finding.selectedPart = part;
    order.events.push({
      at: new Date().toISOString(),
      actor: "Service adviser",
      label: "Part sourced",
      detail: `${part.title} — ${part.vendor}, ${(part.priceCents / 100).toFixed(2)} USD`,
    });
  } else {
    delete finding.selectedPart;
  }
  order.updatedAt = new Date().toISOString();
  await saveState(state);
  return order;
}

// Server-side source of truth for money — never trust a client total.
export function approvedTotalCents(order: RepairOrder): number {
  return (order.report?.findings ?? [])
    .filter((f): f is Finding => Boolean(f) && f.approved === true)
    .reduce((sum, f) => sum + f.priceCents, 0);
}
