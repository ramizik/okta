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
