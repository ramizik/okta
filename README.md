<div align="center">

# 🔧 PitCrew

**Auto repair shops speak in jargon. Their customers don't.**

PitCrew turns raw technician inspection notes into a plain-English report the car owner
actually understands — then lets them approve and pay for the work in a tap.

### [→ Try it live: pitcrew-okta.vercel.app](https://pitcrew-okta.vercel.app)

</div>

---

## 🔑 Test it yourself

Two roles, two completely different experiences. Same password for both.

| Role | Email | Password |
|---|---|---|
| **Repair Adviser** (shop side) | `advisor@pitcrew.demo` | `PitCrew-Demo-2026!` |
| **Customer** (car owner) | `customer@pitcrew.demo` | `PitCrew-Demo-2026!` |

> 💡 Open the two accounts in separate browser profiles to watch state sync live between
> the shop and the customer. Stripe runs in test mode — pay with `4242 4242 4242 4242`,
> any future expiry, any CVC.
>
> Reset the demo data anytime: [`/api/demo/reset`](https://pitcrew-okta.vercel.app/api/demo/reset)

---

## 🎬 The 60-second walkthrough

1. **Sign in as the adviser** → land on a real repair-order dashboard
2. Open the **2019 Honda Accord** → see the raw technician note (`[RED] DIAGNOSE CHECK ENGINE LIGHT ON…`)
3. Hit **Generate PitCrew Report** → AI rewrites it in plain English, priced from the shop's service menu
4. Click **Find parts** on any line item → AI writes a parts query, real vendors and prices come back
5. **Send to customer**
6. **Sign in as the customer** → approve/decline each item, watch the total update
7. **Pay** → Stripe Checkout → order flips to paid on *both* screens

---

## ✨ What it does

**🤖 Jargon → plain English.** Technician shorthand becomes a report written at an 8th-grade
reading level: what we found, what you'll notice, what happens if you wait. Never invents
prices — those come from the shop's own service menu.

**🛒 Live parts sourcing.** For each repair, an AI writes a parts-store query from the
symptom (*"misfire on cylinder 2"* → *"2019 Honda Accord iridium spark plugs set"*), then
pulls real listings from Google Shopping — NAPA, RockAuto, AutoZone, Walmart — scoped to the
shop's city. The adviser attaches one and sees their margin.

**✅ Line-item approval.** The customer approves or declines each repair individually. The
total is always recomputed server-side — the client never sends a price.

**💬 Page-aware AI assistant.** Answers questions grounded in what you're actually looking at.
Context is built server-side from your own orders only, so the model structurally cannot see
another customer's data.

**🔒 Two real roles.** Advisers see the shop; customers see only their own cars. Requesting
someone else's order returns 404, not data.

---

## 🔌 Integrations

| | What it does here |
|---|---|
| **Auth0** | Real hosted login, two seeded roles, PKCE, role-based post-login routing. Wrong-role access redirects instead of erroring. |
| **Stripe** | Two flows: per-repair **Checkout** built from server-computed approved items, and shop **subscriptions** (Starter $99/mo · Pro $299/mo). Sessions verified server-side on redirect. |
| **OpenRouter** (MiniMax M3) | Report generation, parts-query writing, and the chat assistant. |
| **SerpApi** | Google Shopping engine — real vendors, real prices, scoped to the shop's location. |
| **Upstash Redis** | Shared demo state, so every serverless instance sees the same orders. |
| **Vercel** | Hosting, Fluid Compute, streaming chat. |

Auth0, OpenRouter and the Vercel project were provisioned through **Stripe Projects**.

---

## 🛡️ Built to survive a live demo

Every external call has a fallback, and none of them show the user an error:

- **AI report** → 20s timeout, then a pre-generated report from the seed
- **Parts search** → missing key, rate limit, or zero results → seeded offers, marked *"Showing saved results"*
- **Parts query** → if the model is slow, a deterministic query from the service menu
- **Stripe** → clean demo mode when no key is present
- **Redis** → falls back to an in-process store for local dev

The service menu also pins each finding's parts query, so the same demo returns the same
results every run.

---

## 🧱 Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 · shadcn/ui ·
server actions as the entire write API

```
src/lib/ai.ts        raw notes → structured report
src/lib/parts.ts     finding → parts query → live vendor offers
src/lib/catalog.ts   shop service menu: prices findings, pins parts queries
src/lib/store.ts     Redis-backed shared state
src/app/actions.ts   every write, session-checked
```

---

## 🚀 Run it locally

```bash
npm install
cp .env.example .env      # fill in the keys you have
npm run dev
```

**Auth0 keys are required** — every screen sits behind a login. Everything else is optional:
without Stripe, OpenRouter or SerpApi keys the app still runs end to end on seeded data, so
you can light up live features one at a time.

<div align="center">
<sub>Built with Auth0 + Stripe</sub>
</div>
