# PitCrew — UI/UX Requirements

**Audience:** the UI agent scaffolding the first visual version of the app.
**Read `docs/PROJECT_IDEA.md` first** for product context.

---

## 0. Mission & Boundaries

Build **every screen, fully styled, against mock data**. No Auth0. No Stripe. No AI calls.

- Every "action" is a client-side state update or a `console.log` stub.
- Every screen must be reachable by typing a URL — no login wall yet.
- Auth, payments, and AI get wired in later phases by swapping stubs for real calls.
- **Do not** create login/signup forms. Auth0 Universal Login is hosted; our "Sign In" is a link.

**Definition of done:** a person can click through the entire demo path (landing → shop dashboard
→ order detail → generate report → customer garage → report → approve items → pay → paid state)
using only mock data, and it looks like a product someone pays for.

---

## 1. Stack

| Item | Value |
|---|---|
| Framework | Next.js 15 App Router, TypeScript, `src/` dir |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Icons | `lucide-react` |
| Fonts | Geist Sans + Geist Mono (ship with `create-next-app`) |
| Toasts | `sonner` |

Server Components by default. `"use client"` only where interaction demands it.

---

## 2. Design Language

### 2.1 Visual direction

Professional automotive service software. Think **clean clinical dashboard**, not neon racing game.
The product's job is to make a stressed car owner feel informed and calm.

Light UI surface, dark navy chrome (top nav / sidebar). Generous whitespace. Strong hierarchy.
Restraint everywhere except severity, which should be impossible to miss.

### 2.2 Color — the one rule that matters

**Severity color carries the product's meaning. The brand accent must never compete with it.**

That's why the accent is blue: red/amber/green stay unambiguous signals, never decoration.

```css
/* Brand */
--pit-navy:      #0F172A;   /* nav, sidebar, footer */
--pit-navy-soft: #1E293B;   /* nav hover, elevated dark surfaces */
--pit-accent:    #2563EB;   /* primary buttons, links, active state, focus ring */
--pit-accent-hi: #1D4ED8;   /* accent hover */

/* Surfaces */
--bg:            #F8FAFC;   /* app background */
--surface:       #FFFFFF;   /* cards */
--border:        #E2E8F0;
--text:          #0F172A;
--text-muted:    #64748B;

/* Severity — never use these for anything decorative */
--sev-red-fg:    #DC2626;  --sev-red-bg:   #FEF2F2;  --sev-red-border:   #FECACA;
--sev-amber-fg:  #D97706;  --sev-amber-bg: #FFFBEB;  --sev-amber-border: #FDE68A;
--sev-green-fg:  #16A34A;  --sev-green-bg: #F0FDF4;  --sev-green-border: #BBF7D0;
```

Define these as CSS variables in `globals.css` and map them into the Tailwind theme. No raw
hex values in components.

### 2.3 Typography

| Use | Spec |
|---|---|
| Page title | Geist Sans, 30px / 700 / -0.02em |
| Section heading | 20px / 600 |
| Card title | 16px / 600 |
| Body | 15px / 400 / 1.6 line-height |
| Meta & labels | 13px / 500, `--text-muted`, uppercase + 0.05em tracking for labels only |
| **Raw technician note** | **Geist Mono, 13px** |

The monospace treatment on raw technician notes is deliberate and required: it makes the
"before" read as raw machine output, so the AI-generated "after" in clean sans feels like a
transformation. This contrast *is* the demo's wow moment. Do not use mono anywhere else
except code-like values (VINs, order numbers, error codes).

### 2.4 Spacing, radius, elevation

- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. Nothing off-scale.
- Radius: `8px` inputs & buttons, `12px` cards, `9999px` badges/pills.
- Elevation: one shadow only — `0 1px 3px rgb(15 23 42 / 0.08)`. Cards use borders, not shadows.
  Reserve a heavier shadow (`0 8px 24px rgb(15 23 42 / 0.12)`) for modals and the sticky pay bar.
- Page content max-width `1280px`, centered, `24px` gutters.

### 2.5 Motion

Restrained. `150ms ease-out` on hover/color. `200ms` on panel/accordion expand.
**One exception:** the AI report reveal (§5.4) gets a deliberate staggered fade-in-up,
60ms apart per card. That moment is the demo. Everything else stays quiet.

Respect `prefers-reduced-motion` — disable the stagger, keep the opacity change.

---

## 3. Global Layout

### 3.1 Two shells

**Marketing shell** (`/`, `/pricing`): transparent-to-solid top nav, centered content, footer.

**App shell** (`/shop/*`, `/garage/*`): fixed dark top bar, no sidebar (keeps it simple and
works on a projector), content area on `--bg`.

### 3.2 App top bar (shared, role-aware)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 🔧 PitCrew   │ Precision Auto Care          [Shop Advisor]  Sarah M. ▾     │
└────────────────────────────────────────────────────────────────────────────┘
```

- Left: logo + wordmark → links to role home (`/shop` or `/garage`).
- Center-left: current shop name (`Precision Auto Care`) — this makes tenancy visible.
- Right: **role badge pill** (`Shop Advisor` / `Customer`) + user name + avatar dropdown
  (Sign out only).
- The role badge is not decoration — judges need to see which user they're looking at when
  we switch browsers. Make it legible from across a room: `13px`, high contrast, always visible.

---

## 4. Route Map

| Route | Shell | Purpose |
|---|---|---|
| `/` | Marketing | Landing — the before/after pitch |
| `/pricing` | Marketing | Shop subscription plans |
| `/shop` | App | Advisor dashboard — repair order list |
| `/shop/orders/[id]` | App | Advisor order detail + report generation |
| `/garage` | App | Customer vehicle list |
| `/garage/orders/[id]` | App | Customer PitCrew Report + approval + pay |
| `/not-found` | App | 404 |

Build `loading.tsx` (skeletons) and `error.tsx` for both `/shop` and `/garage` trees.

---

## 5. Screen Specifications

### 5.1 `/` — Landing

Single scroll page. Sections in order:

1. **Nav** — logo left; `Pricing` + `Sign In` (accent button) right.
2. **Hero**
   - H1: *Stop explaining repairs over the phone.*
   - Sub: *PitCrew turns technician inspection notes into plain-English reports your customers
     actually understand — then lets them approve and pay in one click.*
   - Primary CTA `Sign In` → `/shop` (stub). Secondary `See Pricing` → `/pricing`.
3. **The before/after block — this is the most important section on the page.**
   Two panels side by side (stacked on mobile), with a `→` between them.
   - Left, labeled `WHAT THE SHOP WRITES`: monospace, cramped, grey — the real note from
     `image.png`. Use it verbatim; its ugliness is the argument.
   - Right, labeled `WHAT YOUR CUSTOMER SEES`: a real `FindingCard` (§6.4), red severity,
     clean and readable.
4. **Three value props** — icon + title + one line each:
   - `Approvals in minutes, not days`
   - `Every finding in plain English`
   - `Paid before the car leaves the lot`
5. **How it works** — 4 numbered steps: Inspect → Translate → Approve → Pay.
6. **Footer** — logo, copyright, "Built with Auth0 + Stripe".

Keep it to one viewport of hero + one scroll. This page is on screen for 5 seconds in the demo.

### 5.2 `/pricing`

Two plan cards, centered, equal height. **Pro is visually emphasized** (accent border, scale
1.02, `MOST POPULAR` ribbon).

| | Starter | Pro |
|---|---|---|
| Price | **$99**/mo | **$299**/mo |
| Features | Up to 100 repair orders/mo · AI report generation · Customer portal · Online payments | Unlimited repair orders · Everything in Starter · Multi-advisor accounts · Custom branding · Priority support |
| CTA | `Start Free Trial` (outline) | `Start Free Trial` (solid accent) |

Both CTAs call a `startSubscription(plan)` stub. Below the cards: a muted line —
*Secure payments powered by Stripe. Cancel anytime.*

### 5.3 `/shop` — Advisor Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  Repair Orders                                    [+ New Order]     │
│  Precision Auto Care · Tuesday, March 4                             │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│ │ Orders   │ │ Awaiting │ │ Approved │ │ Avg      │   ← StatCards   │
│ │ Today    │ │ Approval │ │ Revenue  │ │ Approval │                 │
│ │    4     │ │    1     │ │  $1,284  │ │  14 min  │                 │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘                 │
├─────────────────────────────────────────────────────────────────────┤
│  [ All ] [ Needs Action ] [ In Progress ] [ Ready ]   ← filter tabs │
│                                                                     │
│  VEHICLE            CUSTOMER      STATUS            TOTAL   UPDATED │
│  ─────────────────────────────────────────────────────────────────  │
│  2019 Honda Accord  Marcus Chen   ● Inspection      $487.50   2m    │
│  8ES1234                            Complete                        │
│  2021 Toyota RAV4   Dana Ortiz    ● Awaiting Appr.  $312.00   18m   │
│  ...                                                                │
└─────────────────────────────────────────────────────────────────────┘
```

- Rows are fully clickable → `/shop/orders/[id]`. Hover: `--bg` fill, pointer cursor.
- Vehicle cell: bold `year make model` over muted mono plate number.
- **Sort the hero order (2019 Honda Accord, `INSPECTION_COMPLETE`) first.** The demo starts
  there; the advisor should never hunt for it.
- Filter tabs filter client-side. `Needs Action` = `CHECKED_IN | INSPECTION_COMPLETE`.
- `+ New Order` opens a modal with vehicle/customer fields and a `Create` button (stub).
  Low priority — build last, it's a credibility prop, not a demo step.
- Mobile: table collapses to stacked cards.

### 5.4 `/shop/orders/[id]` — Advisor Order Detail ⭐ *the wow moment lives here*

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Back to orders                                                    │
│ 2019 Honda Accord EX  ·  8ES1234  ·  64,182 mi                      │
│ Marcus Chen · (209) 555-0142            [ Send to Customer → ]      │
├─────────────────────────────────────────────────────────────────────┤
│  ●───────●───────○───────○───────○───────○      ← StatusStepper     │
│  Checked Inspect  Awaiting Approved In Prog  Ready                  │
│  In      Complete Approval                                          │
├──────────────────────────────┬──────────────────────────────────────┤
│  TECHNICIAN NOTES            │  CUSTOMER REPORT                     │
│  ┌────────────────────────┐  │  ┌────────────────────────────────┐  │
│  │ (monospace textarea)   │  │  │                                │  │
│  │ Codes for misfire on   │  │  │   ✨ No report generated yet   │  │
│  │ cylinder 2. Checked    │  │  │                                │  │
│  │ spark plugs and found  │  │  │   Generate a customer-ready    │  │
│  │ them worn and burnt... │  │  │   report from the notes.       │  │
│  │                        │  │  │                                │  │
│  └────────────────────────┘  │  └────────────────────────────────┘  │
│  [ ⚡ Generate PitCrew Report ]                                      │
├──────────────────────────────┴──────────────────────────────────────┤
│  INSPECTION LINE ITEMS                              [ + Add item ]  │
│  🔴 Spark plugs & ignition coil — cyl 2      $ 340.00   [edit][×]   │
│  🟡 Cabin air filter                         $  59.00   [edit][×]   │
│  🔴 Engine oil service                       $  88.50   [edit][×]   │
│  ...                                                Total  $487.50  │
└─────────────────────────────────────────────────────────────────────┘
```

**Behavior:**

1. Notes panel is an editable monospace `Textarea`, pre-filled from mock data.
2. `Generate PitCrew Report` → button enters loading state with the label cycling through
   *Reading technician notes… → Assessing severity… → Writing plain English…*
   (~1.4s each; total ~2.5s). This is theater and it's worth it — it makes the AI legible.
3. Then the right panel fills with `FindingCard`s, **staggered fade-in-up, 60ms apart**.
4. After generation, the button becomes `↻ Regenerate` (outline).
5. `Send to Customer` is **disabled until a report exists**, with a tooltip saying why.
   On click: status advances to `AWAITING_APPROVAL`, toast *"Report sent to Marcus Chen"*.
6. Line items: severity dot, title, editable price. Total right-aligned, bold.
7. Once the customer has responded, each line item shows an approval chip
   (`✓ Approved` green / `✕ Declined` muted). Before that, nothing.

Panels stack vertically on screens under `1024px`.

### 5.5 `/garage` — Customer Garage

```
┌─────────────────────────────────────────────────────────────────────┐
│  My Garage                                                          │
│  Welcome back, Marcus                                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  ┌──────────┐   2019 Honda Accord EX                          │  │
│  │  │  [photo] │   8ES1234 · 64,182 mi                           │  │
│  │  │          │                                                 │  │
│  │  └──────────┘   ⚠️  SERVICE SOON                               │  │
│  │                 3 findings need your attention                 │  │
│  │                                                                │  │
│  │  At Precision Auto Care · Awaiting your approval               │  │
│  │                              [ Review Report → ]               │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

- The **verdict badge** is the loudest element on the card. Three states:
  - `✓ SAFE TO DRIVE` — green
  - `⚠️ SERVICE SOON` — amber
  - `⛔ STOP DRIVING` — red
- Vehicle photo: seeded static image in `/public`. Never a broken image — always render a
  neutral placeholder if missing.
- Card is clickable; the CTA is a visual affordance, not the only hit target.
- Below the active vehicle: `Service History` — 2–3 muted rows of past completed orders.
  Cheap to build, makes the account feel lived-in.

### 5.6 `/garage/orders/[id]` — The PitCrew Report ⭐ *the prettiest screen in the app*

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← My Garage                                                         │
│ 2019 Honda Accord EX · Precision Auto Care                          │
│                                                                     │
│  ●───────●───────●───────○───────○───────○                          │
│  Checked Inspected Report Approved  In      Ready                   │
│  In                Ready            Progress                        │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  ⚠️  SERVICE SOON                                              │  │
│  │  Your Accord is safe for short trips, but three items need     │  │
│  │  attention in the next couple of weeks.                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  NEEDS ATTENTION (3)                                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ 🔴  Ignition misfire on cylinder 2                    $340.00 │  │
│  │                                                                │  │
│  │ One of your engine's cylinders isn't firing properly. The      │  │
│  │ spark plugs are worn out and burnt.                            │  │
│  │                                                                │  │
│  │ 👁  YOU'LL NOTICE   Rough idle, less power, worse mileage.     │  │
│  │ ⏳  IF YOU WAIT     Unburned fuel can damage your catalytic    │  │
│  │                     converter — a far more expensive repair.   │  │
│  │ ⏱  URGENCY         Within a few days. Short trips are okay.   │  │
│  │                                                                │  │
│  │                         [  ✕ Decline  ] [  ✓ Approve  ]       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ...                                                                │
│                                                                     │
│  ▸ LOOKED GOOD (9)                              ← collapsed default │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─── sticky bottom bar ──────────────────────────────────────────┐ │
│  │  2 of 3 items approved              Total  $428.50             │ │
│  │                                     [  Pay $428.50  →  ]       │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Behavior:**

1. Findings sorted red → amber → green. Green items collapsed under `LOOKED GOOD (9)` by
   default so the red items own the screen.
2. Approve/Decline is a two-button toggle per card. Selected state is obvious: approved card
   gets a green left border + subtle green tint; declined card dims to 60% opacity.
3. **Sticky bottom bar** appears as soon as ≥1 item is approved; slides up from the bottom.
   Shows live count + total. Total recomputes on every toggle.
4. `Pay $X` → `startRepairPayment()` stub → simulate 1.2s → route to `?paid=1`.
5. **Paid state** (`?paid=1`): a green success banner replaces the sticky bar —
   *✓ Payment received. Your shop has been notified and work is starting.*
   Approve/Decline buttons become read-only chips. Stepper advances to `In Progress`.
6. If the order has no report yet, show a friendly waiting state:
   *🔧 Your vehicle is being inspected. We'll notify you when your report is ready.*

---

## 6. Component Inventory

Build these in `src/components/`. Every one takes typed props and renders from data.

### 6.1 `<StatusStepper status audience />`
Horizontal 6-step stepper. Completed = filled accent, current = accent ring + pulse, future =
grey. `audience="customer"` swaps labels to friendly copy (`Inspected`, `Report Ready`).
Mobile: collapses to `Step 3 of 6 · Awaiting Approval` with a progress bar.

### 6.2 `<StatusBadge status />`
Pill. Color map: `CHECKED_IN` slate · `INSPECTION_COMPLETE` blue · `AWAITING_APPROVAL` amber ·
`APPROVED` green · `PAID` green solid · `IN_PROGRESS` blue · `READY` green solid.

### 6.3 `<SeverityDot severity />` / `<VerdictBadge verdict />`
Dot: 10px filled circle, severity color. Verdict badge: large pill, icon + uppercase label,
severity bg + border + fg. Verdict badge must be readable at 3 feet.

### 6.4 `<FindingCard finding mode onApprove onDecline />` ⭐ *the most important component*
- `mode="shop"` — read-only preview, no buttons.
- `mode="customer"` — approve/decline buttons.
- `mode="paid"` — read-only chips.
- Severity-tinted left border (4px) + matching background wash at ~4% opacity.
- Sections `YOU'LL NOTICE` / `IF YOU WAIT` / `URGENCY` are label-value rows with icons and
  uppercase muted labels. Keep them scannable — they are the trust argument.
- Price top-right, `18px / 600`, tabular numerals.

### 6.5 `<VehicleCard vehicle order />`
Photo, title, plate/mileage (mono), verdict badge, finding count, shop name, CTA.

### 6.6 `<StatCard label value hint icon />`
Muted uppercase label, `30px/700` value, optional hint line. Tabular numerals on all figures.

### 6.7 `<OrderTable orders />` / `<OrderRow />`
Desktop table, mobile stacked cards. Fully clickable rows.

### 6.8 `<RawNotePanel value onChange readOnly />`
Monospace textarea with a `TECHNICIAN NOTES` label and a subtle "raw input" treatment
(slightly grey background, mono, tight leading).

### 6.9 `<GenerateReportButton state onGenerate />`
States: `idle` → `loading` (spinner + cycling labels) → `done`. Never disabled without a
tooltip explaining why.

### 6.10 `<PayBar approvedCount total onPay disabled />`
Sticky bottom bar, heavier shadow, slides up on appear.

### 6.11 `<EmptyState icon title description action />`
Used for: no report yet, no orders, no vehicles, 404.

### 6.12 `<PlanCard plan featured />`

### 6.13 `<RoleBadge role />`

---

## 7. States — build all four for every data surface

| State | Requirement |
|---|---|
| **Loading** | Skeletons that match the real layout's shape. Never a bare spinner on a full page. Never layout shift. |
| **Empty** | `<EmptyState>` with an icon, a plain-English line, and an action when one exists. Never a blank panel. |
| **Error** | Inline, human copy: *We couldn't load this order. Try again.* + retry button. Never a raw stack trace or error code on screen. |
| **Success** | Toast (`sonner`) + the affected UI updates in place. |

**Demo-critical:** nothing on screen may ever render as `undefined`, `NaN`, `$NaN`, a broken
image, or an empty box. Every component needs a sane fallback. A judge seeing `undefined` on
a projector costs more than any missing feature.

---

## 8. Copy Rules

- **Plain English, 8th-grade reading level.** No jargon in customer-facing text.
- Second person for customers (*your Accord*, *you'll notice*). Never *the vehicle*.
- Honest urgency, never fear-mongering. *Service within a few days* — not *DANGER*.
- Sentence case for buttons and headings. Uppercase reserved for labels and verdict badges.
- Buttons are verbs: `Approve`, `Send to Customer`, `Generate PitCrew Report`, `Pay $428.50`.
- Prices always `$1,234.50` — two decimals, thousands separator, tabular numerals.
- Dates relative under 24h (`2m ago`, `18m ago`), absolute beyond (`Mar 2`).

---

## 9. Responsive

Breakpoints: `sm 640` / `md 768` / `lg 1024` / `xl 1280`.

**Design desktop-first at 1440×900 — that's the projector.** But every screen must be usable
at 390px, because the customer-side story is "your customer approves from their phone in the
waiting room," and a judge may well pull it up on a phone.

Required mobile behavior: tables → stacked cards; two-column panels → stacked; stepper →
compact progress; sticky pay bar stays pinned and thumb-reachable; nav collapses to logo +
avatar.

---

## 10. Accessibility

Not optional — several of these directly protect the demo.

- **Never encode meaning in color alone.** Every severity has an icon *and* a text label.
  A red/green colorblind judge must read the same story. This is the single most important
  a11y rule in this product.
- Contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI borders.
- All interactive elements keyboard reachable, visible focus ring (2px accent, 2px offset).
- Real `<button>` / `<a>` elements — never clickable `<div>`s.
- Labels on every form control. `aria-live="polite"` on the running approval total.
- Alt text on vehicle photos; decorative icons `aria-hidden`.

---

## 11. Mock Data Contract

Create `src/lib/types.ts` and `src/lib/mock-data.ts`. **These types are the contract with the
backend phase** — match them exactly so the real store drops in without touching components.

```ts
export type Severity = 'red' | 'amber' | 'green';
export type Verdict  = 'SAFE_TO_DRIVE' | 'SERVICE_SOON' | 'STOP_DRIVING';
export type Role     = 'advisor' | 'customer';

export type OrderStatus =
  | 'CHECKED_IN' | 'INSPECTION_COMPLETE' | 'AWAITING_APPROVAL'
  | 'APPROVED' | 'PAID' | 'IN_PROGRESS' | 'READY';

export interface Finding {
  id: string;
  severity: Severity;
  title: string;          // "Ignition misfire on cylinder 2"
  plain: string;          // what we found, plain English
  youllNotice: string;
  ifYouWait: string;
  urgency: string;
  priceCents: number;
  approved: boolean | null;   // null = not yet answered
}

export interface Vehicle {
  id: string; year: number; make: string; model: string; trim?: string;
  plate: string; mileage: number; photoUrl: string;
}

export interface RepairOrder {
  id: string;
  shopId: string; shopName: string;
  customerName: string; customerEmail: string; customerPhone: string;
  vehicle: Vehicle;
  status: OrderStatus;
  rawTechNotes: string;
  report: { verdict: Verdict; summary: string; findings: Finding[] } | null;
  createdAt: string; updatedAt: string;   // ISO
}
```

### Required mock records

**Hero order — `ro_001`, must be first in the list:**
2019 Honda Accord EX · plate `8ES1234` · 64,182 mi · customer Marcus Chen ·
status `INSPECTION_COMPLETE` · `report: null` · `rawTechNotes` **copied verbatim from
`image.png`** (misfire cyl 2 / worn burnt plugs / coil packs 2&4 / dirty engine oil /
cabin air filter due / drive belt cracking / transmission breather possible leak).

Also ship `MOCK_HERO_REPORT` — the fully-written report this order produces — so the
generate button has something real to reveal. Write these findings carefully; this text is
what judges actually read. 3 red/amber findings with prices, plus ~9 green "looked good"
items (wiper blades, battery, brake fluid, coolant, radiator & hoses, etc. — pull the green
list straight from `image.png`).

**Supporting orders** (make the dashboard feel real):
- `ro_002` — 2021 Toyota RAV4, Dana Ortiz, `AWAITING_APPROVAL`, report present
- `ro_003` — 2017 Ford F-150, Priya Nair, `IN_PROGRESS`, paid
- `ro_004` — 2020 Subaru Outback, Tom Whitfield, `READY`

**Users:** `Sarah Martinez` (advisor, Precision Auto Care) · `Marcus Chen` (customer).

Currency in **cents** everywhere; format at render with a `formatUsd()` helper.

---

## 12. Build Order

1. Tokens in `globals.css` + Tailwind theme + shadcn init
2. `types.ts` + `mock-data.ts` (everything else depends on these)
3. App shell + top bar + role badge
4. Primitives: `StatusBadge`, `SeverityDot`, `VerdictBadge`, `StatCard`, `EmptyState`
5. `FindingCard` ← spend real time here, it appears on three screens
6. `/shop` dashboard
7. `/shop/orders/[id]` incl. the generate-and-reveal interaction
8. `/garage` + `/garage/orders/[id]` incl. approval + sticky pay bar + paid state
9. `/` landing
10. `/pricing`
11. Loading / error / 404
12. Mobile pass at 390px

---

## 13. Do Not Build

Login or signup forms · settings or profile pages · dark mode toggle · notification center ·
search · pagination · real file upload · charts or analytics graphs · onboarding wizard ·
chat UI · admin panels · anything requiring a backend call that doesn't exist yet.

If a screen isn't in §4, it isn't in scope.
