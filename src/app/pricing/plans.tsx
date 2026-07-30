"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/pitcrew/app-shell";
import { formatUsd } from "@/lib/format";
import type { Plan, PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function PricingPlans({
  plans,
  currentPlan,
  signedIn,
  isAdvisor,
  liveStripe,
}: {
  plans: Plan[];
  currentPlan: PlanId | null;
  signedIn: boolean;
  isAdvisor: boolean;
  liveStripe: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<PlanId | null>(null);

  const subscribe = async (plan: Plan) => {
    if (!signedIn) {
      window.location.assign("/auth/login?returnTo=/pricing");
      return;
    }
    if (!isAdvisor) {
      toast.error("Only shop advisors can manage the subscription");
      return;
    }

    setPending(plan.id);
    try {
      const res = await fetch("/api/checkout/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Could not start checkout");
        setPending(null);
        return;
      }
      if (data.url.startsWith("/")) {
        toast.success(`${plan.name} plan activated`);
        router.push(data.url);
      } else {
        window.location.assign(data.url);
      }
    } catch {
      toast.error("Could not reach checkout");
      setPending(null);
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border bg-card">
        <div className="app-container grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
          <Link href="/">
            <Logo tone="dark" />
          </Link>
          {signedIn ? (
            <Button variant="outline" asChild>
              <Link href={isAdvisor ? "/shop" : "/garage"}>
                Back to dashboard
              </Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <a href="/auth/login?returnTo=/pricing">Sign in</a>
            </Button>
          )}
        </div>
      </nav>

      <main className="app-container py-16">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-[13px] font-medium text-muted-foreground">
            For service shops
          </span>
          <h1 className="mt-5 text-3xl font-bold md:text-4xl">
            Plans that pay for themselves in one repair order
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Every plan includes AI reports, the customer approval portal, and
            online payments. Cancel anytime.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl items-stretch gap-6 md:grid-cols-2">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-xl border bg-card p-8 shadow-card",
                  plan.featured
                    ? "border-primary md:scale-[1.02]"
                    : "border-border",
                )}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.05em] text-primary-foreground">
                    Most popular
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 right-8 rounded-full bg-sev-green-fg px-3 py-1 text-[11px] font-bold uppercase tracking-[0.05em] text-card">
                    Current plan
                  </span>
                )}
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {plan.blurb}
                </p>
                <p className="mt-4">
                  <span className="tnum text-4xl font-bold">
                    {formatUsd(plan.priceCents).replace(".00", "")}
                  </span>
                  <span className="text-muted-foreground">/mo</span>
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[15px]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8"
                  size="lg"
                  variant={plan.featured ? "default" : "outline"}
                  disabled={pending !== null || isCurrent}
                  onClick={() => subscribe(plan)}
                >
                  {pending === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Opening
                      checkout…
                    </>
                  ) : isCurrent ? (
                    "Your current plan"
                  ) : currentPlan ? (
                    `Switch to ${plan.name}`
                  ) : (
                    `Subscribe to ${plan.name}`
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          {liveStripe
            ? "Subscriptions are billed monthly through Stripe. Cancel anytime."
            : "Demo mode — connect a Stripe key to bill these plans for real."}
        </p>
      </main>
    </div>
  );
}
