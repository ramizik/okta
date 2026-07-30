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
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  shopId: string;
}
