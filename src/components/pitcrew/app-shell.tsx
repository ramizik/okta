import Link from "next/link";
import { Wrench, LogOut } from "lucide-react";
import type { Role } from "@/lib/types";
import { homeForRole } from "@/lib/roles";

export function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg " +
          (tone === "light"
            ? "bg-primary text-primary-foreground"
            : "bg-navy text-navy-foreground")
        }
      >
        <Wrench className="h-4 w-4" />
      </span>
      <span className="text-base font-bold tracking-tight">PitCrew</span>
    </span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  const label = role === "advisor" ? "Shop Advisor" : "Customer";
  return (
    <span className="rounded-full bg-primary px-3 py-1 text-[13px] font-semibold text-primary-foreground">
      {label}
    </span>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

export function AppTopBar({
  role,
  user,
  shopName,
}: {
  role: Role;
  user: string;
  shopName: string;
}) {
  return (
    <header className="sticky top-0 z-40 bg-navy text-navy-foreground">
      <div className="app-container grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
        <div className="flex min-w-0 items-center gap-4">
          <Link href={homeForRole(role)} className="shrink-0">
            <Logo tone="light" />
          </Link>
          <span className="hidden h-5 w-px bg-navy-soft sm:block" />
          <span className="hidden truncate text-sm text-navy-foreground/70 sm:block">
            {shopName}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <RoleBadge role={role} />
          <span className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-navy-soft text-xs font-semibold">
              {initials(user)}
            </span>
            <span className="hidden sm:inline">{user}</span>
          </span>
          <a
            href="/auth/logout"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-navy-foreground/70 transition-colors duration-150 hover:bg-navy-soft hover:text-navy-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </a>
        </div>
      </div>
    </header>
  );
}

/** Demo shortcuts strip. Role switching goes through Auth0, not a link. */
export function RoleSwitchHint({ email }: { email?: string }) {
  return (
    <div className="border-b border-border bg-secondary text-muted-foreground">
      <div className="app-container flex flex-wrap items-center gap-3 py-2 text-xs">
        <span className="opacity-70">
          Demo{email ? ` · signed in as ${email}` : ""}:
        </span>
        <a
          href="/auth/logout"
          className="underline underline-offset-4 hover:opacity-80"
        >
          Switch user
        </a>
        <Link
          href="/pricing"
          className="underline underline-offset-4 hover:opacity-80"
        >
          Pricing
        </Link>
        <a
          href="/api/demo/reset"
          className="underline underline-offset-4 hover:opacity-80"
        >
          Reset demo data
        </a>
      </div>
    </div>
  );
}
