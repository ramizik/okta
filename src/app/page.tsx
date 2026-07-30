import type { Metadata } from "next";
import {
  ArrowRight,
  Sparkles,
  ClipboardList,
  MessageSquareText,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/pitcrew/app-shell";

export const metadata: Metadata = {
  title: "PitCrew — Repair approvals your customers actually understand",
  description:
    "PitCrew turns raw technician notes into plain-English repair reports with one-click approval and payment for auto shops.",
  openGraph: {
    title: "PitCrew — Repair approvals your customers understand",
    description:
      "Raw tech notes in. Clear customer reports, approvals and payment out.",
    type: "website",
  },
};

const rawNote = `DIAGNOSE CHECK ENGINE LIGHT ON
Codes for misfire on cylinder 2. Checked spark
plugs and found them to be worn down and burnt.
Swapped coil packs 2&4. Test drive no misfire.
Recommend replacing spark plugs.`;

const steps = [
  {
    icon: ClipboardList,
    title: "Inspect",
    copy: "Your tech writes notes the way they always have.",
  },
  {
    icon: Sparkles,
    title: "Translate",
    copy: "PitCrew rewrites them into plain English with severity.",
  },
  {
    icon: MessageSquareText,
    title: "Approve",
    copy: "The customer approves or declines each line item.",
  },
  {
    icon: CreditCard,
    title: "Pay",
    copy: "They pay online and the bay keeps moving.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-[1280px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4">
          <Logo tone="dark" />
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild>
              <a href="/auth/login">Sign in</a>
            </Button>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-[1280px] px-6 py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[13px] font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> For independent
              repair shops
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] md:text-5xl">
              Stop losing hours to approval phone tag.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              PitCrew turns your technician&apos;s notes into a report your
              customer understands — then lets them approve and pay in a single
              tap.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <a href="/auth/login?returnTo=/shop">
                  Open the shop demo <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/auth/login?returnTo=/garage">See the customer view</a>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-xl border border-border bg-secondary/60 p-5">
              <p className="label-caps">Technician note</p>
              <pre className="mt-3 whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-muted-foreground">
                {rawNote}
              </pre>
            </div>
            <div className="flex justify-center">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </span>
            </div>
            <div className="rounded-xl border border-l-4 border-border border-l-sev-red-fg bg-sev-red-bg/60 p-5 shadow-card">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <h3 className="font-semibold">Ignition misfire on cylinder 2</h3>
                <span className="tnum shrink-0 font-semibold">$340.00</span>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed">
                One of your engine&apos;s cylinders isn&apos;t firing properly.
                The spark plugs are worn out and burnt.
              </p>
              <p className="mt-3 text-[13px] text-muted-foreground">
                <span className="label-caps">If you wait</span> — unburned fuel
                can damage your catalytic converter, a far more expensive
                repair.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title}>
              <span className="label-caps tnum">Step {i + 1}</span>
              <div className="mt-3 flex items-center gap-2">
                <s.icon className="h-5 w-5 text-primary" />
                <h3 className="text-base font-semibold">{s.title}</h3>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                {s.copy}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto grid max-w-[1280px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-10 text-sm text-muted-foreground">
        <Logo tone="dark" />
        <span className="shrink-0 text-right">
          © 2026 PitCrew · Built with Auth0 + Stripe
        </span>
      </footer>
    </div>
  );
}
