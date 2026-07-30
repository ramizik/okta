import type { Metadata } from "next";
import { PricingPlans } from "./plans";

export const metadata: Metadata = {
  title: "Pricing — PitCrew for repair shops",
  description:
    "Simple plans for repair shops: Starter at $99/mo and Pro at $299/mo with unlimited AI repair reports and online approvals.",
  openGraph: {
    title: "Pricing — PitCrew for repair shops",
    description:
      "Starter $99/mo or Pro $299/mo. Cancel anytime, payments powered by Stripe.",
  },
};

export default function Pricing() {
  return <PricingPlans />;
}
