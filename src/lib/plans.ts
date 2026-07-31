// The two shop subscription tiers. Single source of truth: the pricing page
// renders from this, and the Checkout Session is priced from it server-side.

export type PlanId = "starter" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  priceCents: number;
  blurb: string;
  features: string[];
  featured: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceCents: 9900,
    blurb: "For single-bay shops getting off the phone.",
    features: [
      "Up to 100 repair orders / mo",
      "AI report generation",
      "Customer approval portal",
      "Online repair payments",
    ],
    featured: false,
  },
  {
    id: "pro",
    name: "Pro",
    priceCents: 29900,
    blurb: "For multi-advisor shops running at volume.",
    features: [
      "Unlimited repair orders",
      "Everything in Starter",
      "Multi-advisor accounts",
      "Custom branding on reports",
      "Priority support",
    ],
    featured: true,
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

// Repair orders a shop may process per month, by tier. `null` plan = Free —
// the state every shop starts in, and the reason the dashboard shows a meter.
export const FREE_ORDER_LIMIT = 5;

const ORDER_LIMITS: Record<PlanId, number | null> = {
  starter: 100,
  pro: null, // unlimited
};

export interface PlanUsage {
  planName: string;
  used: number;
  limit: number | null; // null = unlimited
  remaining: number | null;
  percent: number; // 0-100, 100 when unlimited
  atLimit: boolean;
  nearLimit: boolean; // >= 80% used — trigger the upgrade nudge
  nextPlan: Plan | null;
}

export function planUsage(plan: PlanId | null, used: number): PlanUsage {
  const limit = plan ? ORDER_LIMITS[plan] : FREE_ORDER_LIMIT;
  const planName = plan ? (getPlan(plan)?.name ?? "Free") : "Free";
  const nextPlan =
    plan === "pro" ? null : plan === "starter" ? getPlan("pro")! : getPlan("starter")!;

  if (limit === null) {
    return {
      planName,
      used,
      limit: null,
      remaining: null,
      percent: 100,
      atLimit: false,
      nearLimit: false,
      nextPlan: null,
    };
  }

  const percent = Math.min(100, Math.round((used / limit) * 100));
  return {
    planName,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    percent,
    atLimit: used >= limit,
    nearLimit: percent >= 80,
    nextPlan,
  };
}
