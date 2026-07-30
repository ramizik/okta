"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/pitcrew/app-shell";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    price: 99,
    features: [
      "Up to 100 repair orders / mo",
      "AI report generation",
      "Customer portal",
      "Online payments",
    ],
    featured: false,
  },
  {
    name: "Pro",
    price: 299,
    features: [
      "Unlimited repair orders",
      "Everything in Starter",
      "Multi-advisor accounts",
      "Custom branding",
      "Priority support",
    ],
    featured: true,
  },
];

export function PricingPlans() {
  const startSubscription = (plan: string) => {
    toast.success(`Starting your ${plan} trial`, {
      description: "Redirecting to secure checkout…",
    });
  };

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-[1280px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4">
          <Link href="/">
            <Logo tone="dark" />
          </Link>
          <Button variant="outline" asChild>
            <a href="/auth/login">Sign in</a>
          </Button>
        </div>
      </nav>

      <main className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-3xl font-bold md:text-4xl">
            Plans that pay for one repair order
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Every plan includes AI reports, the customer portal, and online
            approvals.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl items-stretch gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-xl border bg-card p-8 shadow-card",
                plan.featured ? "border-primary md:scale-[1.02]" : "border-border",
              )}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.05em] text-primary-foreground">
                  Most popular
                </span>
              )}
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="mt-4">
                <span className="tnum text-4xl font-bold">${plan.price}</span>
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
                onClick={() => startSubscription(plan.name)}
              >
                Start free trial
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Secure payments powered by Stripe. Cancel anytime.
        </p>
      </main>
    </div>
  );
}
