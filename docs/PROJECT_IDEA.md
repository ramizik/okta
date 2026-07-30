# PitCrew — Project Idea

> **One line:** A white-labeled SaaS portal for auto repair shops that turns raw technician
> inspection notes into plain-English customer reports with one-click approval and payment.

---

## 1. Problem

Auto repair approval is slow, opaque, and trust-poor.

Today a customer gets something like this (real-world example, `image.png` in repo root):

```
DIAGNOSE CHECK ENGINE LIGHT ON  🔴
Technician Note: Codes for misfire on cylinder 2 Checked spark plugs and found
them to be worn down and burnt. Swapped coil packs 2&4 Took vehicle on test
drive no misfire so far. Recommend replacing spark plugs
```

The customer has no idea:
- Is this dangerous?
- Can I drive it today?
- What does it cost?
- What happens if I wait?

So they call the shop. The shop plays phone tag. Approval is delayed hours or days.
The bay sits idle. Revenue slips. Trust erodes.

**The gap is not diagnostics. It's translation and approval.**

---

## 2. Users (two roles, one app)

| Role | Who | What they do in PitCrew |
|---|---|---|
| **Shop Advisor** (admin) | Independent repair shop owner / service advisor | Opens repair orders, dumps raw tech notes, hits "Generate Report", tracks approvals |
| **Customer** (car owner) | Vehicle owner / family | Sees their vehicle, reads plain-English findings, approves line items, pays |

Two clearly separate experiences, one codebase, one Auth0 tenant, role-based routing.

---

## 3. Product

A repair-order portal with two views over the same data.

### Shop side
- Auth0 login → shop dashboard
- List of repair orders with status + revenue awaiting approval
- Order detail: vehicle, customer, inspection line items, raw technician notes
- **"Generate PitCrew Report"** button → AI rewrites raw notes into customer language
- Status controls: `Checked In → Inspection Complete → Awaiting Approval → Approved → In Progress → Ready`
- Live view of what the customer approved / declined

### Customer side
- Auth0 login → "My Garage"
- Vehicle health card with a single verdict badge: **Safe to Drive / Service Soon / Stop Driving**
- Repair timeline (visual status stepper)
- Inspection findings as cards: red / yellow / green, each with
  - plain-English what we found
  - what you'll notice
  - what happens if you wait
  - price
- Per-item **Approve** / **Decline** toggles
- **Pay Approved Repairs** → Stripe Checkout
- Paid state updates instantly, shop dashboard reflects it

---

## 4. AI Core — one concrete job

AI does exactly one thing: **translate technician jargon into a customer-safe action report.**

Not a chatbot. Not a copilot. A translator with structured output.

**Input** (raw, from the shop side):
```
P0301 misfire cyl 1 likely coil, recommend plug + coil. Also drive belt cracking.
Cabin filter due per mileage. Engine oil dirty, due for service.
```

**Output** (structured JSON → rendered as cards):
```json
{
  "verdict": "SERVICE_SOON",
  "items": [
    {
      "severity": "red",
      "title": "Ignition misfire on cylinder 1",
      "plain": "One of your engine's cylinders isn't firing properly, most likely a worn ignition coil and spark plug.",
      "youll_notice": "Rough idle, less power, worse fuel economy.",
      "if_you_wait": "Unburned fuel can damage your catalytic converter — a much more expensive repair.",
      "urgency": "Service within a few days. Short local trips are okay."
    }
  ]
}
```

Model: **Claude (claude-sonnet-5)** via the Anthropic API, structured output through a tool schema.
Deterministic fallback: a pre-generated report is seeded for the demo order, so the demo
never depends on a live API call succeeding.

---

## 5. Auth0 Role

- Universal Login for both roles — visible, real, branded
- Role stored on the user profile; app routes on it
  - `advisor@pitcrew.demo` → `/shop`
  - `customer@pitcrew.demo` → `/garage`
- Middleware protects both trees; wrong role gets redirected, not 500'd
- Customers only ever see their own repair orders — enforced server-side
- Shop tenancy via a `shop_id` claim (single seeded shop for the demo)

**Practicality rule:** if Auth0 Organizations or the Management API slows us down,
role comes from a seeded email→role map. Demo > platform purity.

---

## 6. Stripe Role — both sides of the money

1. **Shop subscription (B2B SaaS monetization)** — `/pricing` with Starter / Pro tiers,
   Stripe Checkout in subscription mode. This is the actual business model.
2. **Repair payment (transactional)** — customer approves line items, total is computed
   server-side from approved items, one-time Stripe Checkout, webhook flips the order to `PAID`.

Both are visible on screen in the demo. Test mode, test cards.

---

## 7. Demo Flow (the 90-second script)

1. **Shop Advisor** logs in via Auth0 → dashboard shows 4 repair orders, one flagged *Awaiting Inspection*
2. Advisor opens the 2019 Honda Accord order, pastes the **real ugly technician note** from `image.png`
3. Clicks **Generate PitCrew Report** → raw jargon becomes a structured, color-coded customer report *(the wow moment)*
4. Advisor clicks **Send to Customer** → status moves to *Awaiting Approval*
5. **Switch to customer** (second browser / incognito, second Auth0 login)
6. Customer sees the vehicle health card: **⚠️ Service Soon**, with clear findings and prices
7. Customer approves 2 of 3 items, declines 1 → running total updates
8. Customer clicks **Pay $487.50** → Stripe Checkout → test card → success
9. **Back to shop view** → order is `PAID / In Progress`, revenue counter ticks up
10. Close on `/pricing`: "and this is how shops pay us" → Stripe subscription checkout

---

## 8. Why This Wins

| Judging axis | PitCrew's answer |
|---|---|
| Real problem | Every shop wastes hours per day on approval phone-tag |
| Multi-user SaaS | Two genuinely different roles over shared data, both demoed live |
| Auth0 usage | Real Universal Login, role-based routing, server-side ownership checks |
| Stripe usage | Subscription *and* transactional payment — both visible |
| AI usage | One concrete, high-value job with a visible before/after |
| Visual clarity | Traffic-light severity, status stepper, health badge — readable in 3 seconds |
| 30-second value | The before/after of the technician note explains the whole product |

---

## 9. Scope Discipline

### Must-have (the demo path, nothing else)
- Auth0 login, two roles, protected routes
- Shop dashboard + order detail
- AI note → structured report
- Customer garage + report view + per-item approval
- Stripe repair payment + webhook status update
- Stripe shop subscription pricing page
- Seeded demo data, deterministic demo account

### Nice-to-have (only after the above is green)
- Health score number (0–100)
- Inspection photo gallery (static seeded images)
- Race-themed copy / "pit stop" language toggle
- Multiple vehicles per customer
- Customer "ask a question" note field
- Shop-branded theme color

### Cut — do not build
- OBD ingestion, telemetry, real vehicle data
- Real-time messaging / websockets
- AI mechanic chat assistant
- Maintenance prediction engine
- Insurance / warranty / recall integrations
- Multi-shop network, true production multi-tenancy
- Native mobile app
- Admin/settings pages nobody opens in the demo
- File uploads with real storage (seed the images instead)

---

## 10. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 App Router + TypeScript | One deploy target, API routes + UI together |
| UI | Tailwind + shadcn/ui | Fastest path to polished; consistent components |
| Auth | `@auth0/nextjs-auth0` v4 | Sponsor requirement, already provisioned in `.projects/state.json` |
| Payments | `stripe` node SDK + Checkout Sessions | Hosted UI = zero payment-form bugs on stage |
| AI | `@anthropic-ai/sdk`, claude-sonnet-5, tool-schema output | Structured, reliable, fast |
| Data | In-memory store on `globalThis`, seeded at boot | No DB setup, no migrations, resets clean between demos |
| Deploy | Local `next dev` for the demo; Vercel as backup | Single process = state actually persists during the demo |

**Known tradeoff:** the in-memory store means state is per-process. That's *good* for a
local demo (deterministic, resettable) and acceptable on Vercel for a single session.
A `POST /api/demo/reset` endpoint restores seed state between run-throughs.

---

## 11. Non-Negotiables for Demo Stability

- [ ] A `/api/demo/reset` route that returns the app to seed state in one click
- [ ] Pre-generated AI report cached for the hero order — live call is an enhancement, not a dependency
- [ ] Stripe in test mode with the card number written on a sticky note
- [ ] Both demo accounts' credentials stored in `docs/DEMO.md`
- [ ] The full demo path rehearsed end-to-end at least twice before presenting
