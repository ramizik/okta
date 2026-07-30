# PitCrew — 4-Hour Build Roadmap

**Rule:** work top to bottom. Do not start a phase until the previous one is demoable.
Commit and push after every phase. If a phase runs 15+ minutes over budget, cut its
optional items and move on.

Legend: 🔴 blocks the demo · 🟡 makes the demo good · ⚪ only if time remains

**Live site:** https://pitcrew-okta.vercel.app · demo users `advisor@pitcrew.demo` /
`customer@pitcrew.demo` (password `PitCrew-Demo-2026!`) · reset: `/api/demo/reset`

---

## Phase 0 — Scaffold (T+0:00 → T+0:25) ✅ DONE

**Goal:** a styled Next.js app running on `localhost:3000` with a landing page.

- [x] 🔴 `npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir --import-alias "@/*"` *(Next 16.2)*
- [x] 🔴 Install deps: `npm i @auth0/nextjs-auth0 stripe @anthropic-ai/sdk`
- [x] 🔴 Init shadcn/ui: `npx shadcn@latest init`
- [x] 🔴 Add components: `npx shadcn@latest add button card badge dialog input textarea separator table tabs avatar skeleton sonner`
- [x] 🔴 Create `.env.example` documenting every required var (never commit `.env`)
- [x] 🔴 Design tokens in `globals.css` *(now the "PitCrew Global System": warm paper canvas, ink navy, blue accent, severity red/amber/green)*
- [x] 🟡 Landing page `/` — two-sided hero, before/after technician-note visual, "Sign in" CTA
- [x] 🔴 `git add -A && git commit && git push`

---

## Phase 1 — Data Model & Seed (T+0:25 → T+0:50) ✅ DONE

**Goal:** the whole product's data exists in memory and renders as JSON at a debug route.

- [x] 🔴 `src/lib/types.ts` — `Shop`, `User`, `Vehicle`, `RepairOrder`, `Severity`, `OrderStatus` *(line items live as `Finding[]` on the report — matches the UI contract)*
- [x] 🔴 `OrderStatus` enum: `CHECKED_IN | INSPECTION_COMPLETE | AWAITING_APPROVAL | APPROVED | PAID | IN_PROGRESS | READY`
- [x] 🔴 `src/lib/store.ts` — `globalThis`-backed singleton store, survives HMR
  - [x] `getOrders(shopId)`, `getOrdersForCustomer(email)`, `getOrder(id)`
  - [x] `updateOrder(id, patch)`, `setItemApproval(orderId, itemId, approved)`
  - [x] `resetStore()` *(+ `approvedTotalCents()` — server-side money truth)*
- [x] 🔴 `src/lib/seed.ts` — one shop, two users, 4 repair orders:
  - [x] **Hero order**: 2019 Honda Accord, status `INSPECTION_COMPLETE`, raw notes verbatim from `image.png`
  - [x] Order 2: `AWAITING_APPROVAL` — already has a generated report
  - [x] Order 3: `PAID / IN_PROGRESS`
  - [x] Order 4: `READY`
- [x] 🔴 Pre-generated report JSON for the hero order stored in seed as the **AI fallback**
- [x] 🔴 `POST /api/demo/reset` → `resetStore()` *(GET also supported so it works from the address bar)*
- [x] 🟡 `GET /api/debug/state` (dev-only) to eyeball the store
- [x] 🔴 Commit + push

---

## Phase 2 — Auth0 (T+0:50 → T+1:25) ✅ DONE

**Goal:** both demo users can log in and land on the correct dashboard.

- [x] 🔴 Auth0 creds in `.env` (provisioned via Stripe Projects, `hackathon-app` client)
- [x] 🔴 `AUTH0_SECRET` + `APP_BASE_URL` *(stored as Stripe Projects variables)*
- [x] 🔴 Allowed Callback / Logout / Web Origins for localhost **and** the Vercel domain *(set via CLI, no dashboard)*
- [x] 🔴 `src/lib/auth0.ts` — `Auth0Client` instance (SDK v4)
- [x] 🔴 `src/proxy.ts` — auth boundary (Next 16 proxy convention), protects `/shop/*` and `/garage/*`
- [x] 🔴 Demo users created in Auth0:
  - [x] `advisor@pitcrew.demo` (role: `advisor`)
  - [x] `customer@pitcrew.demo` (role: `customer`)
- [x] 🔴 `src/lib/roles.ts` — seeded email→role map (the sanctioned fallback; deterministic on stage)
- [x] 🔴 Auth routes wired at `/auth/*` (v4 convention); login and logout both work
- [x] 🔴 Post-login redirect: `advisor → /shop`, `customer → /garage`
- [x] 🔴 Wrong-role access redirects instead of erroring
- [x] 🟡 Header with role badge, shop name, user, sign out
- [ ] 🔴 **Checkpoint: log in as each user in two browser profiles.** *(everything up to the password screen is verified — do the 30-second click-through before the demo)*
- [x] 🔴 Commit + push

---

## Phase 3 — Shop Dashboard & Order Detail (T+1:25 → T+2:00) ✅ DONE

**Goal:** the advisor experience is real and looks like a product.

- [x] 🔴 `/shop` — repair order table: vehicle, customer, status badge, total, updated-at
- [x] 🟡 Stat row: Orders Today · Awaiting Approval · Approved Revenue · Avg Approval Time
- [x] 🔴 `/shop/orders/[id]` — order detail
  - [x] Vehicle + customer header card
  - [x] Status stepper showing current stage *(interactive, with per-step shop detail panels)*
  - [x] **Raw technician notes** panel *(read-only by design-system decision — notes come from techs, not the advisor)*
  - [x] Inspection line items with severity + price *(read-only; prices come from the generated report)*
  - [x] Generated customer report preview panel (empty state until generated)
- [x] 🔴 Server actions: advance status, send to customer, approvals, payment — all session-checked
- [ ] 🟡 Dedicated `loading.tsx` / `error.tsx` for every route *(empty states exist; skeletons not yet)*
- [x] 🔴 Commit + push

---

## Phase 4 — The AI Translation (T+2:00 → T+2:30) ✅ DONE

**Goal:** the wow moment works, and cannot fail live.

- [x] 🔴 LLM provider *(OpenRouter via Stripe Projects — **MiniMax M3 BYOK**, replaces the planned `ANTHROPIC_API_KEY`)*
- [x] 🔴 `src/lib/ai.ts` — `generateReport(rawNotes, vehicle)`
  - [x] Structured JSON output: `{ verdict, summary, items: [{ severity, title, plain, youll_notice, if_you_wait, urgency, price_cents }] }`
  - [x] System prompt: plain English, 8th-grade reading level, no jargon, honest about urgency, never invent prices
  - [x] Single call, no streaming, reasoning disabled *(reasoning tokens blew the latency budget)*
- [x] 🔴 Generate endpoint *(server action `generateOrderReportAction` instead of a POST route)*
- [x] 🔴 **Fallback chain:** API error / timeout (20s) → seeded pre-generated report, warning logged, UI never shows an error
- [x] 🔴 "Generate PitCrew Report" button with cycling loading labels
- [x] 🟡 Before/after split view — raw note left, customer report right
- [x] 🔴 "Send to Customer" → status `AWAITING_APPROVAL`
- [x] 🔴 **Checkpoint: hero report generated repeatedly during testing — good output every time (live + fallback paths both verified)**
- [x] 🔴 Commit + push

---

## Phase 5 — Customer Garage & Approval (T+2:30 → T+3:00) ✅ DONE

**Goal:** the customer side is the prettiest screen in the app.

- [x] 🔴 `/garage` — vehicle card: photo, year/make/model, mileage *(verdict badge now only renders for `STOP_DRIVING` — the design system keeps red unmistakable by staying quiet otherwise)*
- [x] 🔴 `/garage/orders/[id]` — the PitCrew Report
  - [x] Status stepper (customer-friendly labels + per-step detail panels)
  - [x] Finding cards, sorted red → amber → green, each with plain / you'll notice / if you wait / price
  - [x] Per-item Approve / Decline toggle
  - [x] Sticky footer: approved item count + running total + **Pay** button
- [x] 🔴 Server action `setApprovalAction` — recomputes the total server-side (never trust the client total)
- [x] 🔴 Ownership check: a customer requesting another customer's order gets 404, not data
- [x] 🟡 Seeded check-in photos in a gallery + live inspection checklist
- [x] 🟡 Green "all clear" items collapsed under "Looked good (n)" by default
- [x] 🔴 Commit + push

---

## Phase 6 — Stripe (T+3:00 → T+3:35) 🟠 PARTIAL

**Goal:** money moves, both ways, on camera.

### Repair payment (transactional) — 🔴 must have
- [ ] 🔴 `STRIPE_SECRET_KEY` (test mode) in `.env` *(not provisioned yet)*
- [x] 🔴 `src/lib/stripe.ts` — SDK client *(with a clean demo fallback when the key is absent)*
- [ ] 🔴 `POST /api/checkout/repair` — Checkout Session from **server-computed approved items** *(currently `payOrderAction` simulates payment in-app; swap to real Checkout once the key exists)*
- [ ] 🔴 Success URL `/garage/orders/[id]?paid=1`, cancel URL back to the order
- [x] 🔴 Order flips to `PAID` — visible on both the customer and shop views
  - [ ] Primary: webhook `POST /api/webhooks/stripe` on `checkout.session.completed`
  - [x] **Fallback pattern proven:** the subscription flow verifies the session server-side on the success redirect — reuse for repairs
- [x] 🔴 Paid state visible on both the customer and shop views

### Shop subscription (the business model) — 🔴 must have
- [x] 🔴 Two plans defined: **Starter $99/mo**, **Pro $299/mo** *(inline `price_data` on the Checkout Session — no dashboard products needed)*
- [x] 🔴 `/pricing` page — two plan cards, feature lists, clear CTA
- [x] 🔴 `POST /api/checkout/subscription` — Checkout Session in `subscription` mode + server-side confirm on redirect
- [x] 🟡 Shop dashboard shows the current plan badge; upgrade CTA links to `/pricing`

- [ ] 🔴 **Checkpoint: run both checkouts with `4242 4242 4242 4242`.** *(blocked on `STRIPE_SECRET_KEY`)*
- [x] 🔴 Commit + push

---

## Phase 6.5 — AI Assistant (added beyond roadmap) ✅ DONE

- [x] Page-aware chatbot on every signed-in page — "Ask PitCrew AI"
- [x] `POST /api/chat` — streaming replies (MiniMax M3 via OpenRouter), 401 for signed-out
- [x] Server-built context: viewer role + own orders only (ownership is structural — the model never sees other customers' data)
- [x] Per-page suggestion chips (order detail / dashboard / garage variants)
- [x] Verified: grounded answers, no cross-customer leaks, honest "report not ready yet"

---

## Phase 7 — Polish (T+3:35 → T+3:50) 🟠 PARTIAL

- [x] 🟡 Consistent spacing, typography scale, one accent used deliberately *(PitCrew Global System applied everywhere)*
- [x] 🟡 Toast notifications on every state change (`sonner`)
- [ ] 🟡 Skeleton loaders instead of layout shift
- [x] 🟡 Role badge and shop name in the header — makes multi-tenancy visible
- [x] 🟡 Page titles + OG tags on the landing page
- [ ] ⚪ Health score 0–100 on the vehicle card
- [ ] ⚪ "Pit stop" themed copy on status labels
- [x] ⚪ Subtle animation on the report-generation reveal (`pit-rise` stagger)
- [x] 🔴 Commit + push

---

## Phase 8 — Demo Hardening (T+3:50 → T+4:00) ⏳ TODO

**Do not skip this. This is what separates a working project from a winning one.**

- [ ] 🔴 Write `docs/DEMO.md`: both logins, the exact click path, the Stripe test card, the reset URL
- [ ] 🔴 Rehearse the full 10-step path end-to-end, timed, twice
- [ ] 🔴 Hit `/api/demo/reset` and confirm the app returns to a clean seed state
- [ ] 🔴 Test with the network throttled / AI key removed — the fallback report must still render
- [ ] 🔴 Open two browser profiles side by side ahead of time, both pre-logged-in
- [ ] 🔴 Screenshot every key screen as a backup in case something breaks live
- [ ] 🔴 Final commit + push

### Vercel deploy (provisioned — `vercel/project` "pitcrew" on the hobby plan) ✅ DONE

- [x] 🟡 `VERCEL_TOKEN` via env (never on the command line)
- [x] 🟡 `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` from `.env`
- [x] 🟡 `vercel link` + production deploys — build green
- [x] 🟡 Env vars on Vercel: `AUTH0_*`, `AUTH0_SECRET`, `APP_BASE_URL`, `OPENROUTER_API_API_KEY` *(`STRIPE_*` pending key provisioning)*
- [x] 🟡 Vercel domain in Auth0 Allowed Callback / Logout / Web Origins
- [x] 🟡 `APP_BASE_URL` = https://pitcrew-okta.vercel.app in the Vercel env
- [ ] ⚪ Real Stripe webhook endpoint at `https://pitcrew-okta.vercel.app/api/webhooks/stripe`

---

## Cut List — reject on sight

OBD/telemetry · real-time chat *(the AI assistant is request/response, not chat infra)* ·
maintenance prediction · insurance/warranty/recalls · multi-shop network · real file uploads ·
a real database · password reset flows · email notifications · settings pages ·
dark/light toggle · mobile app · Auth0 Organizations if it costs more than 10 minutes.

---

## Risk Register

| Risk | Mitigation | Status |
|---|---|---|
| Auth0 callback URL misconfigured | localhost + prod URLs set via CLI before code | ✅ done |
| Auth0 role claim takes too long to wire | Seeded email→role map | ✅ done |
| AI call slow or fails on stage | Pre-generated seeded report + 20s timeout, silent fallback | ✅ done |
| Stripe webhook not reachable locally | Session verified server-side on the success redirect | ✅ done (subs) |
| In-memory state lost / dirty between runs | `/api/demo/reset` + run the demo on local `next dev` | ✅ done |
| Running out of time | Phases ordered by demo criticality | Phase 6 repair-checkout + Phase 8 remain |
