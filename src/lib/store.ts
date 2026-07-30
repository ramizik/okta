import type { Finding, RepairOrder, Shop, User } from "./types";
import { buildSeedOrders, SEED_SHOP, SEED_USERS } from "./seed";

// In-memory store for the demo. Backed by globalThis so it survives
// Next.js HMR and module re-evaluation across route handlers.

interface StoreState {
  shop: Shop;
  users: User[];
  orders: RepairOrder[];
  seededAt: string;
}

const globalStore = globalThis as unknown as {
  __pitcrewStore?: StoreState;
};

function freshState(): StoreState {
  return {
    shop: structuredClone(SEED_SHOP),
    users: structuredClone(SEED_USERS),
    orders: buildSeedOrders(),
    seededAt: new Date().toISOString(),
  };
}

function state(): StoreState {
  if (!globalStore.__pitcrewStore) {
    globalStore.__pitcrewStore = freshState();
  }
  return globalStore.__pitcrewStore;
}

export function resetStore(): void {
  globalStore.__pitcrewStore = freshState();
}

export function getState(): StoreState {
  return state();
}

export function getShop(): Shop {
  return state().shop;
}

export function getUsers(): User[] {
  return state().users;
}

export function getOrders(shopId: string): RepairOrder[] {
  // Hero order (ro_001) stays first; rest by most recently updated.
  return state()
    .orders.filter((o) => o.shopId === shopId)
    .sort((a, b) => {
      if (a.id === "ro_001") return -1;
      if (b.id === "ro_001") return 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
}

export function getOrdersForCustomer(email: string): RepairOrder[] {
  const needle = email.toLowerCase();
  return state()
    .orders.filter((o) => o.customerEmail.toLowerCase() === needle)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getOrder(id: string): RepairOrder | undefined {
  return state().orders.find((o) => o.id === id);
}

export function updateOrder(
  id: string,
  patch: Partial<Omit<RepairOrder, "id">>,
): RepairOrder | undefined {
  const order = getOrder(id);
  if (!order) return undefined;
  Object.assign(order, patch, { updatedAt: new Date().toISOString() });
  return order;
}

export function setItemApproval(
  orderId: string,
  itemId: string,
  approved: boolean | null,
): RepairOrder | undefined {
  const order = getOrder(orderId);
  const finding = order?.report?.findings.find((f) => f.id === itemId);
  if (!order || !finding) return undefined;
  finding.approved = approved;
  order.updatedAt = new Date().toISOString();
  return order;
}

// Server-side source of truth for money — never trust a client total.
export function approvedTotalCents(order: RepairOrder): number {
  return (order.report?.findings ?? [])
    .filter((f): f is Finding => Boolean(f) && f.approved === true)
    .reduce((sum, f) => sum + f.priceCents, 0);
}
