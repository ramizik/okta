# PitCrew — 4-Hour Build Roadmap

**Rule:** work top to bottom. Do not start a phase until the previous one is demoable.
Commit and push after every phase. If a phase runs 15+ minutes over budget, cut its
optional items and move on.

Legend: 🔴 blocks the demo · 🟡 makes the demo good · ⚪ only if time remains

---

## Phase 0 — Scaffold (T+0:00 → T+0:25)

**Goal:** a styled Next.js app running on `localhost:3000` with a landing page.

- [ ] 🔴 `npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir --import-alias "@/*"`
- [ ] 🔴 Install deps: `npm i @auth0/nextjs-auth0 stripe @anthropic-ai/sdk`
- [ ] 🔴 Init shadcn/ui: `npx shadcn@latest init`
- [ ] 🔴 Add components: `npx shadcn@latest add button card badge dialog input textarea separator table tabs avatar skeleton sonner`
- [ ] 🔴 Create `.env.example` documenting every required var (never commit `.env`)
- [ ] 🔴 Define the design tokens in `globals.css`: dark slate base, one electric accent (racing green or amber), severity colors `red / amber / green`
- [ ] 🟡 Landing page `/` — headline, the before/after technician-note visual, "Sign in" CTA
- [ ] 🔴 `git add -A && git commit -m "scaffold: next.js + tailwind + shadcn" && git push`

---

## Phase 1 — Data Model & Seed (T+0:25 → T+0:50)

**Goal:** the whole product's data exists in memory and renders as JSON at a debug route.

- [ ] 🔴 `src/lib/types.ts` — `Shop`, `User`, `Vehicle`, `RepairOrder`, `InspectionItem`, `Severity`, `OrderStatus`
- [ ] 🔴 `OrderStatus` enum: `CHECKED_IN | INSPECTION_COMPLETE | AWAITING_APPROVAL | APPROVED | PAID | IN_PROGRESS | READY`
- [ ] 🔴 `src/lib/store.ts` — `globalThis`-backed singleton store, survives HMR
  - [ ] `getOrders(shopId)`, `getOrdersForCustomer(email)`, `getOrder(id)`
  - [ ] `updateOrder(id, patch)`, `setItemApproval(orderId, itemId, approved)`
  - [ ] `resetStore()`
- [ ] 🔴 `src/lib/seed.ts` — one shop, two users, 4 repair orders:
  - [ ] **Hero order**: 2019 Honda Accord, status `INSPECTION_COMPLETE`, raw notes copied verbatim from `image.png` (misfire cyl 2, dirty engine oil, cabin air filter, drive belt cracking, transmission fluid)
  - [ ] Order 2: `AWAITING_APPROVAL` — already has a generated report
  - [ ] Order 3: `PAID / IN_PROGRESS`
  - [ ] Order 4: `READY`
- [ ] 🔴 Pre-generated report JSON for the hero order stored in seed as the **AI fallback**
- [ ] 🔴 `POST /api/demo/reset` → `resetStore()` (the safety net for re-running the demo)
- [ ] 🟡 `GET /api/debug/state` (dev-only) to eyeball the store
- [ ] 🔴 Commit + push

---

## Phase 2 — Auth0 (T+0:50 → T+1:25)

**Goal:** both demo users can log in and land on the correct dashboard.

- [ ] 🔴 Confirm Auth0 creds in `.env` (`AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` already provisioned)
- [ ] 🔴 Add `AUTH0_SECRET` (`openssl rand -hex 32`) and `APP_BASE_URL=http://localhost:3000`
- [ ] 🔴 In the Auth0 dashboard set Allowed Callback / Logout / Web Origins for `http://localhost:3000`
- [ ] 🔴 `src/lib/auth0.ts` — export the `Auth0Client` instance
- [ ] 🔴 `src/middleware.ts` — mount the auth middleware, protect `/shop/*` and `/garage/*`
- [ ] 🔴 Create the two demo users in Auth0:
  - [ ] `advisor@pitcrew.demo` (role: `advisor`)
  - [ ] `customer@pitcrew.demo` (role: `customer`)
- [ ] 🔴 `src/lib/roles.ts` — resolve role from the session
  - [ ] Primary: read `app_metadata.role` / custom claim
  - [ ] **Fallback (use this if the Management API costs >10 min):** seeded email→role map
- [ ] 🔴 `/api/auth/*` routes wired; login and logout both work
- [ ] 🔴 Post-login redirect: `advisor → /shop`, `customer → /garage`
- [ ] 🔴 Wrong-role access redirects instead of erroring
- [ ] 🟡 Header component with avatar, name, role badge, logout
- [ ] 🔴 **Checkpoint: log in as each user in two browser profiles. Both land correctly.**
- [ ] 🔴 Commit + push

---

## Phase 3 — Shop Dashboard & Order Detail (T+1:25 → T+2:00)

**Goal:** the advisor experience is real and looks like a product.

- [ ] 🔴 `/shop` — repair order table: vehicle, customer, status badge, total, updated-at
- [ ] 🟡 Stat row: Orders Today · Awaiting Approval · Approved Revenue · Avg Approval Time
- [ ] 🔴 `/shop/orders/[id]` — order detail
  - [ ] Vehicle + customer header card
  - [ ] Status stepper showing current stage
  - [ ] **Raw technician notes** textarea (pre-filled on the hero order)
  - [ ] Inspection line items with severity + price, editable
  - [ ] Generated customer report preview panel (empty state until generated)
- [ ] 🔴 Server actions: update status, edit notes, edit item price
- [ ] 🟡 Empty/loading/error states for every panel — nothing blank on stage
- [ ] 🔴 Commit + push

---

## Phase 4 — The AI Translation (T+2:00 → T+2:30)

**Goal:** the wow moment works, and cannot fail live.

- [ ] 🔴 `ANTHROPIC_API_KEY` in `.env`
- [ ] 🔴 `src/lib/ai.ts` — `generateReport(rawNotes, vehicle)` using claude-sonnet-5
  - [ ] Tool-schema structured output: `{ verdict, summary, items: [{ severity, title, plain, youll_notice, if_you_wait, urgency, price }] }`
  - [ ] System prompt: plain English, 8th-grade reading level, no jargon, honest about urgency, never invent prices
  - [ ] `max_tokens` sane, single call, no streaming (simpler = safer)
- [ ] 🔴 `POST /api/orders/[id]/generate` → stores the report on the order
- [ ] 🔴 **Fallback chain (non-negotiable):** API error / timeout >12s → serve the seeded pre-generated report, log a warning, UI never shows an error
- [ ] 🔴 "Generate PitCrew Report" button with a loading state that looks intentional
- [ ] 🟡 Before/after split view on the shop side — raw note left, customer report right
- [ ] 🔴 "Send to Customer" → status `AWAITING_APPROVAL`
- [ ] 🔴 **Checkpoint: generate the hero report 3 times. Output is good every time.**
- [ ] 🔴 Commit + push

---

## Phase 5 — Customer Garage & Approval (T+2:30 → T+3:00)

**Goal:** the customer side is the prettiest screen in the app.

- [ ] 🔴 `/garage` — vehicle card: photo, year/make/model, mileage, **verdict badge** (Safe to Drive / Service Soon / Stop Driving)
- [ ] 🔴 `/garage/orders/[id]` — the PitCrew Report
  - [ ] Status stepper (customer-friendly labels)
  - [ ] Finding cards, sorted red → amber → green, each with plain / you'll notice / if you wait / price
  - [ ] Per-item Approve / Decline toggle
  - [ ] Sticky footer: approved item count + running total + **Pay** button
- [ ] 🔴 Server action `setItemApproval` — recomputes the total server-side (never trust the client total)
- [ ] 🔴 Ownership check: a customer requesting another customer's order gets 404, not data
- [ ] 🟡 Seeded inspection photos in a simple gallery
- [ ] 🟡 Green "all clear" items collapsed by default so red items dominate the screen
- [ ] 🔴 Commit + push

---

## Phase 6 — Stripe (T+3:00 → T+3:35)

**Goal:** money moves, both ways, on camera.

### Repair payment (transactional) — 🔴 must have
- [ ] 🔴 `STRIPE_SECRET_KEY` (test mode) in `.env`
- [ ] 🔴 `src/lib/stripe.ts` — SDK client
- [ ] 🔴 `POST /api/checkout/repair` — builds a Checkout Session from **server-computed approved items** as line items
- [ ] 🔴 Success URL `/garage/orders/[id]?paid=1`, cancel URL back to the order
- [ ] 🔴 Order flips to `PAID` on return
  - [ ] Primary: webhook `POST /api/webhooks/stripe` on `checkout.session.completed`
  - [ ] **Fallback: verify the session server-side on the success redirect** — works without `stripe listen` running, which is what saves the demo
- [ ] 🔴 Paid state visible on both the customer and shop views

### Shop subscription (the business model) — 🔴 must have
- [ ] 🔴 Create two test-mode Products/Prices: **Starter $99/mo**, **Pro $299/mo**
- [ ] 🔴 `/pricing` page — two plan cards, feature lists, clear CTA
- [ ] 🔴 `POST /api/checkout/subscription` — Checkout Session in `subscription` mode
- [ ] 🟡 Shop dashboard shows the current plan badge; upgrade CTA links to `/pricing`

- [ ] 🔴 **Checkpoint: run both checkouts with `4242 4242 4242 4242`.**
- [ ] 🔴 Commit + push

---

## Phase 7 — Polish (T+3:35 → T+3:50)

Only after everything above is green.

- [ ] 🟡 Consistent spacing, typography scale, and one accent color used deliberately
- [ ] 🟡 Toast notifications on every state change (`sonner`)
- [ ] 🟡 Skeleton loaders instead of layout shift
- [ ] 🟡 Role badge and shop name in the header — makes multi-tenancy visible
- [ ] 🟡 Favicon, page titles, OG tags on the landing page
- [ ] ⚪ Health score 0–100 on the vehicle card
- [ ] ⚪ "Pit stop" themed copy on status labels
- [ ] ⚪ Subtle animation on the report-generation reveal
- [ ] 🔴 Commit + push

---

## Phase 8 — Demo Hardening (T+3:50 → T+4:00)

**Do not skip this. This is what separates a working project from a winning one.**

- [ ] 🔴 Write `docs/DEMO.md`: both logins, the exact click path, the Stripe test card, the reset URL
- [ ] 🔴 Rehearse the full 10-step path end-to-end, timed, twice
- [ ] 🔴 Hit `/api/demo/reset` and confirm the app returns to a clean seed state
- [ ] 🔴 Test with the network throttled / AI key removed — the fallback report must still render
- [ ] 🔴 Open two browser profiles side by side ahead of time, both pre-logged-in
- [ ] 🔴 Screenshot every key screen as a backup in case something breaks live
- [ ] 🔴 Final commit + push

### Vercel deploy (provisioned — `vercel/project` "pitcrew" on the hobby plan)

Do this **once early** (a throwaway deploy right after Phase 0) so build problems surface
while there's still time, then re-deploy at the end.

- [ ] 🟡 `export VERCEL_TOKEN=$(grep '^VERCEL_TOKEN=' .env | cut -d= -f2-)` — never pass `--token` on the command line
- [ ] 🟡 `export VERCEL_ORG_ID=...` and `VERCEL_PROJECT_ID=...` from `.env` (both or neither)
- [ ] 🟡 `vercel link --repo -y` then `vercel deploy -y` (preview) — confirm the build is green
- [ ] 🟡 Push env vars to Vercel: `AUTH0_*`, `AUTH0_SECRET`, `APP_BASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY`
- [ ] 🟡 Add the Vercel domain to Auth0 Allowed Callback / Logout / Web Origins
- [ ] 🟡 Set `APP_BASE_URL` to the Vercel domain in the Vercel env (not localhost)
- [ ] ⚪ Point a real Stripe webhook endpoint at `https://<vercel-domain>/api/webhooks/stripe` — a public HTTPS URL means no `stripe listen` needed

---

## Cut List — reject on sight

OBD/telemetry · real-time chat · AI assistant chatbot · maintenance prediction ·
insurance/warranty/recalls · multi-shop network · real file uploads · a real database ·
password reset flows · email notifications · settings pages · dark/light toggle ·
mobile app · Auth0 Organizations if it costs more than 10 minutes.

---

## Risk Register

| Risk | Mitigation | Phase |
|---|---|---|
| Auth0 callback URL misconfigured | Set localhost + prod URLs at Phase 2 start, before writing code | 2 |
| Auth0 role claim takes too long to wire | Seeded email→role map fallback | 2 |
| AI call slow or fails on stage | Pre-generated seeded report + 12s timeout, silent fallback | 4 |
| Stripe webhook not reachable locally | Verify the session on the success redirect instead | 6 |
| In-memory state lost / dirty between runs | `/api/demo/reset` + run the demo on local `next dev` | 1 |
| Running out of time | Phases are ordered by demo criticality — stop wherever the clock stops, everything before it still demos | all |
