import type { OrderStatus, RepairOrder, Severity } from "./types";

// Presentation copy for the PitCrew UI: status vocabulary, per-step detail
// panels, and the seeded shop-floor context (tech reports, job queue, parts)
// that makes the workflow legible on stage. Order data itself lives in the
// store — this file never owns money or approvals.

export const STATUS_FLOW: OrderStatus[] = [
  "CHECKED_IN",
  "INSPECTION_COMPLETE",
  "AWAITING_APPROVAL",
  "APPROVED",
  "PAID",
  "IN_PROGRESS",
  "READY",
];

export const SHOP_LABELS: Record<OrderStatus, string> = {
  CHECKED_IN: "Checked in",
  INSPECTION_COMPLETE: "Inspection complete",
  AWAITING_APPROVAL: "Awaiting approval",
  APPROVED: "Approved",
  PAID: "Paid",
  IN_PROGRESS: "In progress",
  READY: "Ready",
};

export const CUSTOMER_LABELS: Record<OrderStatus, string> = {
  CHECKED_IN: "Checked in",
  INSPECTION_COMPLETE: "Being inspected",
  AWAITING_APPROVAL: "Report ready",
  APPROVED: "Approved",
  PAID: "Paid",
  IN_PROGRESS: "In progress",
  READY: "Ready for pickup",
};

export interface StepDetail {
  headline: string;
  rows: { label: string; value: string }[];
}

export const STEP_DETAILS: Record<OrderStatus, StepDetail> = {
  CHECKED_IN: {
    headline:
      "Your car arrived at the shop and was logged in by the service advisor.",
    rows: [
      { label: "Checked in", value: "Today, 8:12 AM" },
      {
        label: "Condition on arrival",
        value:
          "Drove in under its own power. Check engine light on, rough idle.",
      },
      { label: "Mileage in", value: "64,182 mi" },
      { label: "Estimated completion", value: "Today, 4:30 PM" },
    ],
  },
  INSPECTION_COMPLETE: {
    headline:
      "A technician is going through a 27-point inspection of your vehicle.",
    rows: [
      { label: "Started", value: "Today, 8:40 AM" },
      { label: "Technician", value: "Luis Ferrer, ASE Master" },
      {
        label: "Covers",
        value: "Engine, brakes, tires, fluids, battery and charging.",
      },
      { label: "Estimated finish", value: "Today, 10:15 AM" },
    ],
  },
  AWAITING_APPROVAL: {
    headline: "Your report is ready. Approve only the work you want done.",
    rows: [
      { label: "Sent", value: "Today, 10:22 AM" },
      {
        label: "What to do",
        value: "Review each finding below and approve or decline it.",
      },
      { label: "Hold time", value: "Your slot is held until 1:00 PM today." },
    ],
  },
  APPROVED: {
    headline: "Thanks — your approvals are locked in and parts are being pulled.",
    rows: [
      { label: "Approved", value: "Today, 10:48 AM" },
      { label: "Parts", value: "In stock at the shop, no delivery wait." },
      { label: "Next", value: "Work begins as soon as a bay opens." },
    ],
  },
  PAID: {
    headline: "Payment received. Your approved work is queued for a bay.",
    rows: [
      { label: "Paid", value: "Today, 10:52 AM" },
      { label: "Method", value: "Card on file via Stripe." },
      { label: "Next", value: "A technician picks up the job shortly." },
    ],
  },
  IN_PROGRESS: {
    headline: "Your approved repairs are underway in the shop.",
    rows: [
      { label: "Started", value: "Today, 11:05 AM" },
      { label: "Technician", value: "Luis Ferrer, ASE Master" },
      { label: "Estimated completion", value: "Today, 4:30 PM" },
      { label: "Test drive", value: "Included before we hand the keys back." },
    ],
  },
  READY: {
    headline: "Your vehicle is finished and waiting for pickup.",
    rows: [
      { label: "Ready since", value: "Today, 4:12 PM" },
      { label: "Pickup hours", value: "Until 6:00 PM today, 7:30 AM tomorrow." },
      { label: "Bring", value: "Photo ID. Payment is already on file." },
    ],
  },
};

export const SHOP_STEP_DETAILS: Record<OrderStatus, StepDetail> = {
  CHECKED_IN: {
    headline: "Vehicle received and logged by the advisor.",
    rows: [
      { label: "Checked in", value: "Today, 8:12 AM · Adviser Sarah M." },
      {
        label: "Arrival condition",
        value: "Drivable. CEL on, rough idle reported by customer.",
      },
      { label: "Mileage in", value: "64,182 mi" },
      { label: "Promised time", value: "Today, 4:30 PM" },
    ],
  },
  INSPECTION_COMPLETE: {
    headline: "27-point inspection running on bay 3.",
    rows: [
      { label: "Bay", value: "3 · Lift 2" },
      { label: "Lead tech", value: "Luis Ferrer, ASE Master" },
      { label: "Started", value: "Today, 8:40 AM" },
      { label: "Est. finish", value: "Today, 10:15 AM" },
    ],
  },
  AWAITING_APPROVAL: {
    headline: "Report sent. Waiting on the customer's per-item approvals.",
    rows: [],
  },
  APPROVED: {
    headline: "Customer approved. Parts pulled and job queued.",
    rows: [
      { label: "Approved", value: "Today, 10:48 AM" },
      { label: "Parts", value: "All in stock — no supplier wait." },
      { label: "Queue", value: "Next open bay, ETA 11:00 AM" },
    ],
  },
  PAID: {
    headline: "Payment cleared through Stripe. Job released to the floor.",
    rows: [
      { label: "Paid", value: "Today, 10:52 AM" },
      { label: "Processor", value: "Stripe · card payment" },
      { label: "Queue", value: "Released to the next open bay." },
    ],
  },
  IN_PROGRESS: {
    headline: "Approved work is on the lift.",
    rows: [
      { label: "Started", value: "Today, 11:05 AM" },
      { label: "Tech", value: "Luis Ferrer" },
      { label: "Est. completion", value: "Today, 4:30 PM" },
    ],
  },
  READY: {
    headline: "Job complete, quality checked and ready for pickup.",
    rows: [
      { label: "Completed", value: "Today, 4:12 PM" },
      { label: "QC", value: "Road test passed, no codes." },
      { label: "Customer", value: "Pickup notification sent." },
    ],
  },
};

export interface TechReport {
  id: string;
  tech: string;
  role: string;
  area: string;
  severity: Severity;
  notes: string;
  time: string;
}

export const techReports: TechReport[] = [
  {
    id: "t1",
    tech: "Luis Ferrer",
    role: "ASE Master Tech",
    area: "Engine & ignition",
    severity: "red",
    notes:
      "P0302 stored. Cyl 2 plug worn/burnt, gap 0.061. Swapped coils 2&4, misfire followed plug. Recommend 4x plugs + coil #2. Oil dark, 1.2qt low, past interval.",
    time: "9:04 AM",
  },
  {
    id: "t2",
    tech: "Dee Alvarez",
    role: "Brake & chassis Tech",
    area: "Brakes, tires, suspension",
    severity: "green",
    notes:
      "Pads F 7mm / R 6mm, rotors within spec, no lip. Tires 6/32 even wear, pressures set to 33psi. No play in front end.",
    time: "9:21 AM",
  },
  {
    id: "t3",
    tech: "Kev Nowak",
    role: "Electrical Tech",
    area: "Battery, charging, HVAC",
    severity: "amber",
    notes:
      "Batt 12.6V, alt output 14.2V under load — good. Cabin filter fully loaded with debris, airflow restricted. Blower draw slightly high.",
    time: "9:38 AM",
  },
];

export const aiSummary =
  "Three techs cleared the vehicle in 34 minutes. Safety systems (brakes, tires, charging) all pass. Two revenue items are urgent — cylinder 2 misfire and overdue oil — plus one comfort item (cabin filter). Customer-facing report was drafted automatically and sent for approval.";

export interface RepairTask {
  id: string;
  label: string;
  state: "done" | "active" | "queued";
  detail: string;
}

export const repairTasks: RepairTask[] = [
  {
    id: "j1",
    label: "Engine oil & filter service",
    state: "done",
    detail: "Completed 11:40 AM · 5W-20 full synthetic",
  },
  {
    id: "j2",
    label: "Spark plugs + ignition coil #2",
    state: "active",
    detail: "On the lift now · Luis Ferrer",
  },
  {
    id: "j3",
    label: "Road test & code clear",
    state: "queued",
    detail: "Starts after ignition work",
  },
];

export const partsPurchased = [
  { id: "p1", label: "NGK iridium spark plugs (4)", status: "In shop", priceCents: 6800 },
  { id: "p2", label: "OEM ignition coil — cyl 2", status: "In shop", priceCents: 11200 },
  { id: "p3", label: "5W-20 full synthetic oil + filter", status: "Used", priceCents: 4600 },
];

export const serviceHistory = [
  {
    id: "ro-0987",
    label: "Brake fluid flush · Precision Auto Care",
    date: "Nov 12, 2025",
    totalCents: 12900,
  },
  {
    id: "ro-0921",
    label: "Tire rotation & alignment · Precision Auto Care",
    date: "Jul 4, 2025",
    totalCents: 18450,
  },
  {
    id: "ro-0880",
    label: "Oil service · Precision Auto Care",
    date: "Feb 18, 2025",
    totalCents: 8400,
  },
];

export const checkInPhotos = [
  {
    id: "p1",
    src: "/checkin/checkin-front.jpg",
    alt: "Front three-quarter view of the vehicle at check-in",
    caption: "Front · no new damage",
  },
  {
    id: "p2",
    src: "/checkin/checkin-tire.jpg",
    alt: "Front driver-side tire and wheel at check-in",
    caption: "Front tires · 4/32in tread",
  },
  {
    id: "p3",
    src: "/checkin/checkin-dash.jpg",
    alt: "Instrument cluster showing the check engine light",
    caption: "Cluster · check engine light on",
  },
  {
    id: "p4",
    src: "/checkin/checkin-engine.jpg",
    alt: "Open engine bay at check-in",
    caption: "Engine bay · fluids logged",
  },
];

export type InspectionState = "done" | "active" | "pending";

export const inspectionSteps: {
  id: string;
  label: string;
  tech: string;
  state: InspectionState;
  detail: string;
  time: string;
}[] = [
  {
    id: "i1",
    label: "Road test & symptom check",
    tech: "Luis Ferrer",
    state: "done",
    detail: "Rough idle confirmed at stops, no misfire above 2k rpm.",
    time: "8:40 AM",
  },
  {
    id: "i2",
    label: "Diagnostic scan",
    tech: "Priya Raman",
    state: "done",
    detail: "P0302 stored. Live data pulled for cylinder 2.",
    time: "9:02 AM",
  },
  {
    id: "i3",
    label: "Brakes & tires",
    tech: "Danny Ruiz",
    state: "done",
    detail: "Front pads 3mm, tread 4/32in across the front axle.",
    time: "9:25 AM",
  },
  {
    id: "i4",
    label: "Fluids, battery & charging",
    tech: "Danny Ruiz",
    state: "active",
    detail: "Battery load test running, coolant and brake fluid sampled.",
    time: "in progress",
  },
  {
    id: "i5",
    label: "Suspension & undercarriage",
    tech: "Luis Ferrer",
    state: "pending",
    detail: "Lift inspection of bushings, boots and exhaust hangers.",
    time: "next",
  },
  {
    id: "i6",
    label: "Adviser review & pricing",
    tech: "Sarah Mitchell",
    state: "pending",
    detail: "Findings priced and written up for your report.",
    time: "~10:15 AM",
  },
];

export const SHOP_PHONE = "(209) 555-0100";

export function vehicleName(order: RepairOrder): string {
  const v = order.vehicle;
  return `${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ""}`;
}

// Money on an order is always derived from the report — never stored twice.
export function orderTotalCents(order: RepairOrder): number {
  return (order.report?.findings ?? []).reduce((s, f) => s + f.priceCents, 0);
}

// What the shop has actually committed to spend on parts: every finding where
// an advisor picked a sourced offer in the parts panel. Grows live in the demo.
export function partsSpendCents(order: RepairOrder): number {
  return (order.report?.findings ?? []).reduce(
    (s, f) => s + (f.selectedPart?.priceCents ?? 0),
    0,
  );
}

export function partsSourcedCount(order: RepairOrder): number {
  return (order.report?.findings ?? []).filter((f) => f.selectedPart).length;
}

export function isPaid(order: RepairOrder): boolean {
  return (
    order.status === "PAID" ||
    order.status === "IN_PROGRESS" ||
    order.status === "READY"
  );
}

const severityRank: Record<Severity, number> = { red: 0, amber: 1, green: 2 };

export function bySeverity<T extends { severity: Severity }>(a: T, b: T) {
  return severityRank[a.severity] - severityRank[b.severity];
}
