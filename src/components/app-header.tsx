import Link from "next/link";
import type { Role } from "@/lib/types";
import { homeForRole } from "@/lib/roles";

// Role-aware app top bar (docs/UI_REQUIREMENTS.md §3.2).
export function AppHeader({
  name,
  role,
  shopName,
}: {
  name: string;
  role: Role;
  shopName: string;
}) {
  return (
    <header className="bg-pit-navy text-white">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link
            href={homeForRole(role)}
            className="text-lg font-bold tracking-tight"
          >
            🔧 PitCrew
          </Link>
          <span className="hidden text-sm text-slate-400 sm:inline">
            {shopName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-pit-accent px-3 py-1 text-[13px] font-semibold">
            {role === "advisor" ? "Shop Advisor" : "Customer"}
          </span>
          <span className="hidden text-sm text-slate-200 sm:inline">
            {name}
          </span>
          <a
            href="/auth/logout"
            className="text-sm text-slate-400 transition-colors hover:text-white"
          >
            Sign out
          </a>
        </div>
      </div>
    </header>
  );
}
