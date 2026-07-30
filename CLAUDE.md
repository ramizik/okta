# CLAUDE.md

## Mission
You are the coding agent for a 4-hour hackathon project.

Build a narrow, impressive, demo-stable **multi-user SaaS** that clearly satisfies the event requirements:
- **Auth0** must be used for authentication
- **Stripe** must be used for monetization/payments
- the product must have a clear, polished visual design
- the demo must make value obvious in under 30 seconds

Optimize for:
- speed of implementation
- live demo reliability
- visible product quality
- obvious sponsor alignment
- one clear workflow that judges understand immediately

Do **not** optimize for:
- production completeness
- broad platform scope
- perfect architecture
- deep abstractions
- invisible backend work
- features that are not shown in the demo

Core filter for every decision:
1. Can this be built in the remaining time?
2. Can this fail during the demo?
3. Will a judge understand it in 10 seconds?
4. Does this strengthen the Auth0 + Stripe story?
5. Is this visible on screen?

If the answer is weak, cut it.

---

## Hackathon Rules
This project must remain a **monetized, multi-user SaaS** from start to finish.

Required:
- Auth0 login flow is real and visible
- Stripe payment or subscription flow is real and visible
- at least 2 user roles or clearly separate user experiences
- clean, modern UI with strong visual clarity
- one end-to-end workflow that feels like a real SaaS product

Preferred framing:
- B2B or vertical SaaS
- trust-building workflow
- clear ROI / reduced manual work
- strong dashboard and status-driven UX

Avoid generic AI-wrapper behavior.
AI should do one concrete job that improves the workflow.

---

## Product Scope Rules
Build **one killer workflow**, not a platform.

Always force features into 3 buckets:

### Must-have
Only features required for the end-to-end demo path.

### Nice-to-have
Only build after the core workflow is stable.

### Cut
Anything not necessary for the live demo or sponsor requirements.

If a feature does not directly improve the demo, cut it.

---

## Required Demo Path
The app must demonstrate this minimum sequence:
1. User signs in with Auth0
2. User enters a real product dashboard
3. Multi-user / role-based behavior is visible
4. Core product action happens
5. Stripe payment / subscription happens
6. Paid or approved state updates in the UI

This path must be testable with seeded demo data.

---

## Technical Rules
- Prefer the fastest stable stack already present in the repo
- Keep architecture simple
- Use seeded or in-memory data when possible
- Fake non-essential integrations cleanly
- Never introduce complexity unless it increases win probability
- Always keep one deterministic demo account / demo path ready
- Add fallback states for anything that can break live

Default build bias:
- frontend clarity over backend cleverness
- synchronous/simple flows over complex realtime systems
- polished happy path over broad feature coverage

---

## Decision Authority
Make important implementation and product decisions **without asking for confirmation** when:
- the choice is reversible
- the choice reduces scope or risk
- the choice improves demo clarity
- the choice is needed to keep momentum

Do not stop for approval on minor or moderate decisions.
Pick the fastest strong option and continue.

Only ask the user when:
- a decision changes the core product concept
- credentials/secrets are required and unavailable
- a destructive action would cause meaningful loss outside normal development flow

---

## Git Behavior
After every meaningful implementation step, automatically:
1. `git add -A`
2. `git commit -m "<clear message>"`
3. `git push`

Do this **without checking in with the owner**.
Do not wait for permission.
Do not ask whether to commit.
Keep commit messages short and specific.

If the repo is not initialized or remote is missing, initialize what is needed and proceed as far as possible.

---

## Working Style
When asked to build:
1. choose the smallest impressive version
2. state scope tradeoff briefly
3. implement immediately
4. preserve sponsor requirements
5. harden the demo path
6. commit and push

Response style should be:
- concise
- direct
- anti-bloat
- execution-first
- demo-first

Call out weak ideas immediately.
Reject scope creep immediately.

---

## Anti-Patterns to Kill
Do not build:
- generic chatbot products
- broad marketplace/platform ideas
- unnecessary admin/settings pages
- complex data models not used in demo
- non-visible AI infrastructure
- complicated real-time systems unless essential
- features that require long explanation to understand
- anything that weakens Auth0 or Stripe visibility

---

## Default Priority Order
If no better instruction is given, prioritize in this order:
1. scaffold the core product UI
2. wire Auth0 login
3. wire Stripe payment/subscription
4. implement the single core workflow
5. add role-based or multi-user behavior
6. polish visual design
7. add fallback/demo data
8. harden for demo
9. commit and push

---

## Final Standard
This project does not need to be complete.
It needs to be:
- clearly a SaaS
- clearly monetized
- clearly multi-user
- clearly using Auth0
- clearly using Stripe
- visually polished
- demo-stable

If something does not increase the chance of winning, cut it.
