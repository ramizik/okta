import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <main className="flex-1">
      <nav className="bg-pit-navy text-white">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
          <span className="text-lg font-bold tracking-tight">🔧 PitCrew</span>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm text-slate-300 transition-colors hover:text-white"
            >
              Pricing
            </Link>
            <Button asChild size="sm">
              <Link href="/shop">Sign in</Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-[1280px] px-6 py-24 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Stop explaining repairs over the phone.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          PitCrew turns technician inspection notes into plain-English reports
          your customers actually understand — then lets them approve and pay
          in one click.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/shop">Sign in</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/pricing">See pricing</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-8 text-sm text-muted-foreground">
          <span>🔧 PitCrew</span>
          <span>Built with Auth0 + Stripe</span>
        </div>
      </footer>
    </main>
  );
}
