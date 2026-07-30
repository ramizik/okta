// Data contract — must stay in sync with docs/UI_REQUIREMENTS.md §11.
// The UI is built against these exact shapes; do not rename fields.

export type Severity = "red" | "amber" | "green";
export type Verdict = "SAFE_TO_DRIVE" | "SERVICE_SOON" | "STOP_DRIVING";
export type Role = "advisor" | "customer";

export type OrderStatus =
  | "CHECKED_IN"
  | "INSPECTION_COMPLETE"
  | "AWAITING_APPROVAL"
  | "APPROVED"
  | "PAID"
  | "IN_PROGRESS"
  | "READY";

export interface Finding {
  id: string;
  severity: Severity;
  title: string; // "Ignition misfire on cylinder 2"
  plain: string; // what we found, plain English
  youllNotice: string;
  ifYouWait: string;
  urgency: string;
  priceCents: number;
  approved: boolean | null; // null = not yet answered
  selectedPart?: PartOffer; // advisor-sourced part for this repair
}

/** A purchasable part matched to a Finding — sourced live from the web. */
export interface PartOffer {
  id: string;
  title: string;
  vendor: string; // "NAPA Auto Parts", "RockAuto"
  priceCents: number;
  delivery: string; // "Free delivery", "Pickup today"
  thumbnail: string;
  link: string;
  rating?: number;
  inStock: boolean;
}

export interface PartSearch {
  query: string; // what the AI actually searched for
  offers: PartOffer[];
  source: "live" | "fallback";
}

export interface Report {
  verdict: Verdict;
  summary: string;
  findings: Finding[];
}

export interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  plate: string;
  mileage: number;
  photoUrl: string;
}

export interface RepairOrder {
  id: string;
  shopId: string;
  shopName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicle: Vehicle;
  status: OrderStatus;
  rawTechNotes: string;
  report: Report | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface Shop {
  id: string;
  name: string;
  plan: "starter" | "pro" | null;
  location: string; // SerpApi location string — drives "near shop" parts results
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  shopId: string;
}
