import type { Metadata } from "next";
import { auth0 } from "@/lib/auth0";
import { resolveRole } from "@/lib/roles";
import { getShop } from "@/lib/store";
import { PLANS } from "@/lib/plans";
import { stripeEnabled } from "@/lib/stripe";
import { PricingPlans } from "./plans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing — PitCrew for repair shops",
  description:
    "Two plans for service shops: Starter at $99/mo and Pro at $299/mo, with unlimited AI repair reports, customer approvals and online payments.",
  openGraph: {
    title: "Pricing — PitCrew for repair shops",
    description:
      "Starter $99/mo or Pro $299/mo. Cancel anytime, subscriptions powered by Stripe.",
  },
};

export default async function Pricing() {
  const session = await auth0.getSession();
  const isAdvisor = Boolean(
    session && resolveRole(session.user.email) === "advisor",
  );

  return (
    <PricingPlans
      plans={PLANS}
      currentPlan={isAdvisor ? (await getShop()).plan : null}
      signedIn={Boolean(session)}
      isAdvisor={isAdvisor}
      liveStripe={stripeEnabled}
    />
  );
}
