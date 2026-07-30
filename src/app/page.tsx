import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  MessageSquareText,
  CreditCard,
  Wrench,
  Camera,
  ShieldCheck,
  Clock,
  Users,
  FileCheck2,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/pitcrew/app-shell";

export const metadata: Metadata = {
  title: "PitCrew — Clear repair approvals for shops and drivers",
  description:
    "PitCrew turns technician notes into plain-English repair reports: shops close approvals faster, drivers see photos, severity and price before they say yes.",
  openGraph: {
    title: "PitCrew — Clear repair approvals for shops and drivers",
    description:
      "One platform, two sides: faster approvals for repair shops, total transparency for drivers.",
    type: "website",
  },
};

const rawNote = `DIAGNOSE CHECK ENGINE LIGHT ON
Codes for misfire on cylinder 2. Checked spark
plugs and found them to be worn down and burnt.
Swapped coil packs 2&4. Test drive no misfire.
Recommend replacing spark plugs.`;

const shopFeatures = [
  {
    icon: Sparkles,
    title: "Automatic report writing",
    copy: "Multiple technicians drop raw notes. PitCrew merges them into one customer-ready report — no advisor retyping.",
  },
  {
    icon: Users,
    title: "Multi-tech workflow board",
    copy: "Engine, electrical and brakes logs live side by side with an AI roll-up, so the advisor sees the whole car at a glance.",
  },
  {
    icon: FileCheck2,
    title: "Line-item approvals on record",
    copy: "Each recommendation is approved or declined individually and timestamped — no more 'I never agreed to that'.",
  },
  {
    icon: CreditCard,
    title: "Payment before pickup",
    copy: "Customers pay the approved total online, so the bay clears the moment the work is done.",
  },
];

const driverFeatures = [
  {
    icon: MessageSquareText,
    title: "Plain-English findings",
    copy: "Every issue explained in a sentence you'd actually say out loud, with what you'll notice and what happens if you wait.",
  },
  {
    icon: Camera,
    title: "Photos from drop-off onward",
    copy: "See your car's condition at check-in and follow each inspection step as technicians complete it.",
  },
  {
    icon: ShieldCheck,
    title: "Approve only what you want",
    copy: "Red, amber and green severity with a fixed price per item. Decline anything and the total updates instantly.",
  },
  {
    icon: Clock,
    title: "Live status and ETA",
    copy: "Checked in, being inspected, in progress, ready — with parts ordered, tasks running and a direct line to the shop.",
  },
];

function FeatureList({
  features,
}: {
  features: { icon: typeof Wrench; title: string; copy: string }[];
}) {
  return (
    <ul className="mt-8 grid gap-5">
      {features.map((f) => (
        <li key={f.title} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <f.icon className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold">{f.title}</h3>
            <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
              {f.copy}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-border bg-card">
        <div className="app-container grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
          <Logo tone="dark" />
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button asChild>
              <a href="/auth/login?returnTo=/shop">Sign in</a>
            </Button>
          </div>
        </div>
      </nav>

      <section className="app-container py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold leading-[1.1] md:text-5xl">
              Car repairs — simplified for shops and their customers.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Shops write their notes as usual. PitCrew turns them into a
              clear, plain-English report with photos and prices, so drivers
              understand exactly what their car needs and can approve and pay
              in a tap.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <a href="/auth/login?returnTo=/shop">
                  I run a shop <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/auth/login?returnTo=/garage">
                  I&apos;m getting my car fixed
                </a>
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

      <section className="border-t border-border bg-card">
        <div className="app-container py-14 md:py-20">
          <h2 className="text-center text-2xl font-bold md:text-3xl">
            Built for both sides of the counter
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[15px] leading-relaxed text-muted-foreground">
            The same job, seen two ways — and both views stay in sync in real
            time.
          </p>

          <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-0">
            <div className="lg:pr-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-navy px-3 py-1 text-[13px] font-semibold text-navy-foreground">
                <Wrench className="h-3.5 w-3.5" /> For repair shops
              </span>
              <h3 className="mt-4 text-xl font-bold">
                Close approvals without the phone tag.
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                Stop rewriting notes and chasing callbacks. PitCrew does the
                translating and the follow-up so your advisors stay on the
                floor.
              </p>
              <FeatureList features={shopFeatures} />
              <Button className="mt-8" asChild>
                <a href="/auth/login?returnTo=/shop">
                  Open the shop demo <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <div className="lg:border-l lg:border-border lg:pl-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-[13px] font-semibold text-primary-foreground">
                <Car className="h-3.5 w-3.5" /> For drivers
              </span>
              <h3 className="mt-4 text-xl font-bold">
                Know exactly what you&apos;re paying for.
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                No jargon, no surprise invoice. See the photos, the reasoning
                and the price for every recommendation before you approve it.
              </p>
              <FeatureList features={driverFeatures} />
              <Button className="mt-8" variant="outline" asChild>
                <a href="/auth/login?returnTo=/garage">
                  See the customer view <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="app-container grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-10 text-sm text-muted-foreground">
        <Logo tone="dark" />
        <span className="shrink-0 text-right">
          © 2026 PitCrew · Built with Auth0 + Stripe
        </span>
      </footer>
    </div>
  );
}
