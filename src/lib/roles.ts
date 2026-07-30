import type { Role, User } from "./types";
import { SEED_USERS } from "./seed";

// Demo role resolution: seeded email→role map (the roadmap's sanctioned
// fallback — no Management API round-trips, deterministic on stage).
// Unknown logins are treated as customers; they just see an empty garage.

export function resolveRole(email: string | undefined | null): Role {
  if (!email) return "customer";
  return getSeedUser(email)?.role ?? "customer";
}

export function getSeedUser(email: string | undefined | null): User | undefined {
  if (!email) return undefined;
  const needle = email.toLowerCase();
  return SEED_USERS.find((u) => u.email.toLowerCase() === needle);
}

export function homeForRole(role: Role): string {
  return role === "advisor" ? "/shop" : "/garage";
}
