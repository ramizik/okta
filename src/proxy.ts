import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { homeForRole, resolveRole } from "@/lib/roles";

// Auth boundary (Next 16 proxy convention).
// - Mounts the Auth0 routes at /auth/*
// - /shop/* is advisor-only, /garage/* is customer-only
// - Wrong role redirects to the right home instead of erroring

export async function proxy(request: NextRequest) {
  const authRes = await auth0.middleware(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/auth")) {
    return authRes;
  }

  const needsShop = pathname.startsWith("/shop");
  const needsGarage = pathname.startsWith("/garage");
  if (needsShop || needsGarage) {
    const session = await auth0.getSession(request);
    if (!session) {
      const login = new URL("/auth/login", request.url);
      login.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(login);
    }
    const role = resolveRole(session.user.email);
    const home = homeForRole(role);
    if ((needsShop && role !== "advisor") || (needsGarage && role !== "customer")) {
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  return authRes;
}

export const config = {
  matcher: [
    // Everything except static assets — the SDK needs broad coverage for
    // rolling sessions and the /auth/* routes.
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
