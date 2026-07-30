# Brief for Lovable — Parts Sourcing panel (supersedes the PartsTech brief)

## ⚠️ Correction first

**Ignore everything in the earlier PartsTech brief. PartsTech is not being used.**

PartsTech's API is partner-gated — access requires a vetted application to OEConnection
and takes days. We replaced it with **SerpApi's Google Shopping engine**, which is already
live, already wired, and already returning real vendors and prices.

What changes for you:

| Earlier (PartsTech) | Now (SerpApi) |
|---|---|
| Search by VIN / license plate | Search is **automatic** — no search input to design |
| Supplier account / login state | None. No account UI |
| "Local vendor, X miles away" distance chips | **No distance data.** Don't design mileage badges |
| Real-time stock counts ("4 in stock") | **No stock counts.** Only a delivery string |
| Place order / purchase order flow | **No ordering.** Selecting a part attaches it, nothing more |
| Cart, checkout, order confirmation | Cut entirely — this is not a store |

The single biggest correction: **do not design a parts search box, a vendor picker, or a
"near me" map.** The advisor never types a query. They click one button on a finding and
get a ranked list back.

---

## What this feature actually is

On the **shop/advisor** side of a repair order, each inspection **Finding** ("Ignition
misfire on cylinder 2") can be expanded to show **real parts you can buy for that repair**,
pulled live from the web with vendor names and current prices.

The advisor picks one. It attaches to the finding. That's the whole loop.

**Why it matters (the story the screen has to tell):** the AI reads the technician's note,
figures out what physical part the repair needs, and finds it at real vendors at real
prices — work the advisor would otherwise do by hand across five browser tabs.

---

## The data you're rendering

These types are already live in `src/lib/types.ts`. **Do not rename fields.**

```ts
interface PartOffer {
  id: string;
  title: string;       // "NGK 2019 Honda Accord Spark Plug, Set of 4, 2.0L"
  vendor: string;      // "NAPA Auto Parts" | "RockAuto" | "Walmart" | "eBay - seller_name"
  priceCents: number;  // 7399  → render as $73.99
  delivery: string;    // "Free delivery" | "Pickup today" | "Check vendor"
  thumbnail: string;   // remote image URL — MAY BE AN EMPTY STRING
  link: string;        // outbound vendor URL
  rating?: number;     // 4.8 — often absent
  inStock: boolean;    // always true today; don't build UI that depends on false
}

interface PartSearch {
  query: string;                  // what was actually searched — SHOW THIS
  offers: PartOffer[];            // up to 6, in relevance order
  source: "live" | "fallback";
}
```

And on the finding itself:

```ts
interface Finding {
  // ...existing fields (severity, title, plain, priceCents, approved, ...)
  selectedPart?: PartOffer;  // set once the advisor picks one
}
```

### Real sample payload

```json
{
  "query": "2019 Honda Accord NGK iridium spark plugs set of 4",
  "source": "live",
  "offers": [
    { "id": "part_1_carpartscom", "title": "NGK 2019 Honda Accord Spark Plug, Set of 4, 2.0L 4Cyl",
      "vendor": "CarParts.com", "priceCents": 7399, "delivery": "Free delivery",
      "thumbnail": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9...",
      "link": "https://www.google.com/search?ibp=oshop&...", "rating": 4.6, "inStock": true },
    { "id": "part_2_ebaynectarinetw", "title": "2010-2019 Honda Accord Set of 4 Iridium Spark Plugs",
      "vendor": "eBay - nectarinetw", "priceCents": 2298, "delivery": "Free delivery",
      "thumbnail": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9...",
      "link": "https://www.ebay.com/itm/...", "inStock": true },
    { "id": "part_3_napaautoparts", "title": "Honda Genuine NGK Spark Plug Set for 2018+ Accord",
      "vendor": "NAPA Auto Parts", "priceCents": 18328, "delivery": "Pickup today",
      "thumbnail": "", "link": "https://www.napaonline.com/", "rating": 4.9, "inStock": true }
  ]
}
```

---

## The two server actions

Already implemented in `src/app/actions.ts`. Import and call them directly — do not write
`fetch` calls or new API routes.

```ts
// Fetch offers for one finding. Read-only, safe to call repeatedly.
searchPartsAction(orderId: string, findingId: string)
  => { ok: true;  query: string; offers: PartOffer[]; source: "live" | "fallback" }
   | { ok: false; query: ""; offers: []; source: "fallback" }

// Attach the advisor's choice. Pass null to clear it.
selectPartAction(orderId: string, findingId: string, part: PartOffer | null)
  => { ok: true }
```

**Both are advisor-only** — they throw `"Not authorized"` for a customer session. This panel
must never appear on `/garage/*` (the customer side). Shop side only: `/shop/orders/[id]`.

---

## States you must design

This is the part that matters most. There are five, and two of them are easy to forget.

**1. Idle** — the default. A finding shows its normal severity/price row plus a quiet
`Find parts` affordance. Don't make this loud; most of the screen's attention belongs to
the report itself.

**2. Loading — this takes 3 to 5 seconds.** That is a long time and it is not optional;
two network calls happen (the AI writes the query, then the shopping search runs). Design
a real loading state, not a spinner flash. The existing report generator uses cycling
labels for exactly this reason — consider matching that pattern
(`"Reading the finding…"` → `"Searching vendors…"` → `"Comparing prices…"`).

**3. Results.** Up to 6 offers, **already in the right order — do not re-sort by price.**
(Sorting by price surfaces a single $8 spark plug above the correct $73 set of four. The
order you receive is relevance-ranked.) Show `query` somewhere — seeing *"we searched
2019 Honda Accord NGK iridium spark plugs set of 4"* is what makes the AI step legible
instead of magic.

**4. Fallback (`source: "fallback"`).** The search failed, was rate-limited, or the key is
missing — and you're getting seeded offers instead. **These still render as a normal, useful
list.** Do not show an error, do not show an empty state. A small, honest marker is right
(`"Showing saved results"` / a muted "cached" chip). This is our live-demo safety net and it
must look calm, not broken.

**5. Selected.** `finding.selectedPart` is set. Show the chosen part compactly on the
finding row, with a way to change or clear it (`selectPartAction(..., null)`).

---

## Constraints that will bite you

- **`thumbnail` is frequently an empty string** — every seeded fallback offer has one, and
  plenty of live results do too. The layout must look correct with **no image at all**.
  Design the no-image case first, then treat the image as an enhancement.
- **Thumbnails are remote** (`encrypted-tbn*.gstatic.com`, `serpapi.com`). If you use
  `next/image`, `images.remotePatterns` in `next.config.ts` needs those hosts, or they
  won't render. A plain `<img>` avoids the problem entirely.
- **`rating` is often absent.** Don't reserve fixed space for stars.
- **Vendor strings are messy and real** — `"eBay - speedy-auto04"`,
  `"Walmart - MOCA AUTO PARTS"`, `"Southern States Cooperative"`. They can be long and
  they are not a fixed set. Truncate gracefully; don't build a vendor-logo lookup.
- **Titles are long** (~60 chars typical, some far longer). Clamp to 2 lines.
- **`link` goes off-site** — `target="_blank" rel="noopener noreferrer"`.
- **No distance, no stock count, no ETA.** `delivery` is the only fulfillment signal and
  it's a freeform string. Render it verbatim; don't parse it.
- **6 offers maximum.** No pagination, no infinite scroll, no "load more."

---

## Explicitly out of scope

Do not build: a search input, filters, sort controls, a cart, a checkout, an order-placement
flow, vendor account linking, a map, distance badges, stock counters, or price-history
charts. Selecting a part attaches it to the finding and nothing else happens.

---

## Design context

This lives inside the existing PitCrew shop order detail page and must inherit the design
system already in `globals.css` — warm paper canvas, near-black ink, blue accent, severity
red/amber/green, large radii. The parts panel is **supporting** UI: the customer-facing
report is the hero of that screen and this sits underneath it. Quiet, dense, scannable —
closer to a table than to product cards.

One nice-to-have if it fits naturally: the finding carries a quoted `priceCents` (what the
customer is charged) and the selected part carries its own `priceCents` (what the shop pays).
Showing both makes the shop's margin visible, which is a genuinely compelling advisor-side
detail. Optional — don't force it.
