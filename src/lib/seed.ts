import type { PartOffer, Report, RepairOrder, Shop, User } from "./types";

// Bump whenever seed data changes — a deployed store holding an older version
// reseeds itself on next read, so prod never serves stale demo data.
export const SEED_VERSION = 4;

export const SEED_SHOP: Shop = {
  id: "shop_precision",
  name: "Precision Auto Care",
  // The demo starts on Free with 4 of 5 orders used — the plan meter on /shop
  // is already in the amber band, which is what motivates the Stripe upgrade.
  plan: null,
  location: "Stockton,California,United States",
};

export const SEED_USERS: User[] = [
  {
    id: "user_sarah",
    name: "Sarah Martinez",
    email: "advisor@pitcrew.demo",
    role: "advisor",
    shopId: SEED_SHOP.id,
  },
  // Three customer logins, one per repair stage, so each state can be shown
  // on its own account instead of being reached by clicking through the flow.
  {
    id: "user_marcus",
    name: "Marcus Chen",
    email: "customer@pitcrew.demo",
    role: "customer",
    shopId: SEED_SHOP.id,
  },
  {
    id: "user_dana",
    name: "Dana Ortiz",
    email: "dana@pitcrew.demo",
    role: "customer",
    shopId: SEED_SHOP.id,
  },
  {
    id: "user_tom",
    name: "Tom Whitfield",
    email: "tom@pitcrew.demo",
    role: "customer",
    shopId: SEED_SHOP.id,
  },
];

// Verbatim from image.png — the real inspection sheet. Its rawness is the demo's "before".
export const HERO_RAW_NOTES = `TODAY'S REQUESTS

[RED] DIAGNOSE CHECK ENGINE LIGHT ON
Technician Note: Codes for misfire on cylinder 2 Checked spark plugs and found them to be worn down and burnt. Swapped coil packs 2&4 Took vehicle on test drive no misfire so far. Recommend replacing spark plugs

INTAKE BODY CONDITION
[GREEN] Exterior Lighting

GENERAL MAINTENANCE
[RED] Dashboard Indicator Lights
Technician Note: Check engine light is on. Further diagnostics may be required. Engine code:
[GREEN] Wiper Blades
[GREEN] Battery
[GREEN] Battery/Terminals/Connections/Cables
[GREEN] Air Filter
[YELLOW] Cabin Air Filter
Technician Note: The vehicles cabin air filter is due for replacement based on vehicle's mileage and previous service.
[RED] Engine Oil
Technician Note: ENGINE OIL IS DIRTY The vehicle is due for an oil change service.
[YELLOW] Transmission Fluid
Technician Note: Breather for transmission possible leak
[GREEN] Brake Fluid
[GREEN] Engine Coolant
[GREEN] Radiator & Hoses
[RED] Drive Belts
Technician Note: 1 OR MORE OF ENGINES DRIVE BELT(S) HAS CRACKING`;

// Pre-generated report for the hero order. This is the Phase 4 AI fallback —
// if the live Claude call fails or times out on stage, this is what renders.
export const MOCK_HERO_REPORT: Report = {
  verdict: "SERVICE_SOON",
  summary:
    "Your Accord is safe for short trips, but a few items need attention in the next couple of weeks. The biggest one is an engine misfire that gets more expensive the longer it waits.",
  findings: [
    {
      id: "f_misfire",
      severity: "red",
      title: "Ignition misfire on cylinder 2",
      plain:
        "One of your engine's four cylinders isn't firing properly. The spark plugs are worn out and burnt, which means they can't ignite fuel the way they should.",
      youllNotice: "Rough idle, less power, worse gas mileage.",
      ifYouWait:
        "Unburned fuel can damage your catalytic converter — a far more expensive repair.",
      urgency: "Within a few days. Short trips are okay.",
      priceCents: 34000,
      approved: null,
    },
    {
      id: "f_oil",
      severity: "red",
      title: "Engine oil is dirty and overdue",
      plain:
        "Your engine oil has broken down and is past due for a change. Dirty oil doesn't protect the moving parts of your engine the way fresh oil does.",
      youllNotice:
        "You probably won't notice anything yet — that's what makes it easy to put off.",
      ifYouWait:
        "Worn oil speeds up engine wear and can shorten your engine's life.",
      urgency: "At this visit — it's quick and inexpensive.",
      priceCents: 8850,
      approved: null,
    },
    {
      id: "f_belts",
      severity: "red",
      title: "Drive belt is cracking",
      plain:
        "The rubber belt that powers your alternator and air conditioning has visible cracks. Cracked belts can snap without warning.",
      youllNotice: "Possibly a squealing sound when you start the car.",
      ifYouWait:
        "If the belt snaps while driving, the car can lose power steering and the battery stops charging — usually a roadside tow.",
      urgency: "Within a week or two.",
      priceCents: 14500,
      approved: null,
    },
    {
      id: "f_cabin_filter",
      severity: "amber",
      title: "Cabin air filter is due",
      plain:
        "The filter that cleans the air blowing into your car is due for replacement based on your mileage.",
      youllNotice: "Weaker airflow from the vents, a musty smell.",
      ifYouWait: "Nothing serious — just dustier air and a harder-working fan.",
      urgency: "Whenever convenient — easy to bundle with this visit.",
      priceCents: 5900,
      approved: null,
    },
    {
      id: "f_trans_breather",
      severity: "amber",
      title: "Possible leak at the transmission breather",
      plain:
        "We spotted what may be a small leak at the transmission's breather vent. It's minor right now, but worth keeping an eye on.",
      youllNotice: "Nothing yet — there are no symptoms at this stage.",
      ifYouWait:
        "If it develops into a real leak, low fluid can damage the transmission over time.",
      urgency: "We'll check it again at your next visit — no charge today.",
      priceCents: 0,
      approved: null,
    },
    ...(
      [
        ["f_lights", "Exterior lighting", "All exterior lights are working."],
        ["f_wipers", "Wiper blades", "Wiper blades are in good shape."],
        ["f_battery", "Battery", "Battery is healthy and holding charge."],
        [
          "f_terminals",
          "Battery terminals and cables",
          "Connections are clean and tight.",
        ],
        ["f_air_filter", "Engine air filter", "Air filter is clean."],
        ["f_brake_fluid", "Brake fluid", "Brake fluid is at a good level."],
        ["f_coolant", "Engine coolant", "Coolant level and condition look good."],
        [
          "f_radiator",
          "Radiator and hoses",
          "No leaks or wear on the radiator or hoses.",
        ],
      ] as const
    ).map(([id, title, plain]) => ({
      id,
      severity: "green" as const,
      title,
      plain,
      youllNotice: "",
      ifYouWait: "",
      urgency: "No action needed.",
      priceCents: 0,
      approved: null,
    })),
  ],
};

// Demo safety net for parts sourcing. If SerpApi is missing, rate-limited or
// slow, these render instead — same pattern as MOCK_HERO_REPORT. Captured from
// real Google Shopping results so the vendors and prices are honest.
export const MOCK_PART_OFFERS: Record<string, PartOffer[]> = {
  f_misfire: [
    {
      id: "mock_misfire_1",
      title: "NGK Laser Iridium Spark Plug Set of 4 — Honda Accord 2.0T",
      vendor: "NAPA Auto Parts",
      priceCents: 4796,
      delivery: "Pickup today",
      thumbnail: "",
      link: "https://www.napaonline.com/",
      rating: 4.8,
      inStock: true,
    },
    {
      id: "mock_misfire_2",
      title: "Denso Iridium TT Spark Plugs (4-Pack) fits 2018-2020 Accord",
      vendor: "RockAuto",
      priceCents: 3912,
      delivery: "Free delivery",
      thumbnail: "",
      link: "https://www.rockauto.com/",
      rating: 4.6,
      inStock: true,
    },
    {
      id: "mock_misfire_3",
      title: "Honda Genuine OEM Spark Plug 12290-6A0-A01",
      vendor: "O'Reilly Auto Parts",
      priceCents: 6299,
      delivery: "Pickup today",
      thumbnail: "",
      link: "https://www.oreillyauto.com/",
      rating: 4.9,
      inStock: true,
    },
  ],
  f_oil: [
    {
      id: "mock_oil_1",
      title: "Mobil 1 Extended Performance 0W-20 Full Synthetic, 5 qt",
      vendor: "Walmart",
      priceCents: 3374,
      delivery: "Free delivery",
      thumbnail: "",
      link: "https://www.walmart.com/",
      rating: 4.8,
      inStock: true,
    },
    {
      id: "mock_oil_2",
      title: "Honda Genuine 0W-20 Synthetic Blend + Filter Kit",
      vendor: "AutoZone",
      priceCents: 4199,
      delivery: "Pickup today",
      thumbnail: "",
      link: "https://www.autozone.com/",
      rating: 4.7,
      inStock: true,
    },
  ],
  f_belts: [
    {
      id: "mock_belts_1",
      title: "Gates Serpentine Belt K060922 — Honda Accord",
      vendor: "RockAuto",
      priceCents: 2488,
      delivery: "Free delivery",
      thumbnail: "",
      link: "https://www.rockauto.com/",
      rating: 4.7,
      inStock: true,
    },
    {
      id: "mock_belts_2",
      title: "Continental Elite Poly-V Serpentine Belt",
      vendor: "NAPA Auto Parts",
      priceCents: 3199,
      delivery: "Pickup today",
      thumbnail: "",
      link: "https://www.napaonline.com/",
      inStock: true,
    },
  ],
  f_cabin_filter: [
    {
      id: "mock_cabin_1",
      title: "FRAM Fresh Breeze Cabin Air Filter CF12157 — Accord 2018-2022",
      vendor: "AutoZone",
      priceCents: 2299,
      delivery: "Pickup today",
      thumbnail: "",
      link: "https://www.autozone.com/",
      rating: 4.6,
      inStock: true,
    },
    {
      id: "mock_cabin_2",
      title: "K&N Premium Cabin Air Filter VF2060",
      vendor: "Amazon",
      priceCents: 3495,
      delivery: "Free delivery",
      thumbnail: "",
      link: "https://www.amazon.com/",
      rating: 4.5,
      inStock: true,
    },
  ],
};

/** Generic fallback when a finding has no seeded offers. */
export const MOCK_PART_OFFERS_GENERIC: PartOffer[] = [
  {
    id: "mock_generic_1",
    title: "OEM-equivalent replacement part — Honda Accord",
    vendor: "RockAuto",
    priceCents: 7999,
    delivery: "Free delivery",
    thumbnail: "",
    link: "https://www.rockauto.com/",
    inStock: true,
  },
  {
    id: "mock_generic_2",
    title: "Premium aftermarket replacement part",
    vendor: "NAPA Auto Parts",
    priceCents: 9450,
    delivery: "Pickup today",
    thumbnail: "",
    link: "https://www.napaonline.com/",
    inStock: true,
  },
];

const now = Date.now();
const minsAgo = (m: number) => new Date(now - m * 60000).toISOString();

export function buildSeedOrders(): RepairOrder[] {
  return structuredClone<RepairOrder[]>([
    {
      // Hero order — the demo starts here. Must sort first on /shop.
      id: "ro_001",
      shopId: SEED_SHOP.id,
      shopName: SEED_SHOP.name,
      customerName: "Marcus Chen",
      customerEmail: "customer@pitcrew.demo",
      customerPhone: "(209) 555-0142",
      vehicle: {
        id: "veh_accord",
        year: 2019,
        make: "Honda",
        model: "Accord",
        trim: "EX",
        plate: "8ES1234",
        mileage: 64182,
        photoUrl: "/vehicles/accord.jpg",
      },
      status: "INSPECTION_COMPLETE",
      rawTechNotes: HERO_RAW_NOTES,
      report: null,
      events: [
        {
          at: minsAgo(94),
          actor: "Sarah Martinez, service adviser",
          label: "Vehicle checked in",
          detail: "64,182 mi · check engine light on, rough idle at stops",
        },
        {
          at: minsAgo(34),
          actor: "Luis Ferrer, ASE master technician",
          label: "Inspection completed",
          detail: "27-point inspection · P0302 stored, cylinder 2 misfire confirmed",
        },
      ],
      createdAt: minsAgo(94),
      updatedAt: minsAgo(2),
    },
    {
      id: "ro_002",
      shopId: SEED_SHOP.id,
      shopName: SEED_SHOP.name,
      // Dana's account opens straight onto the approve-and-pay screen, so that
      // step can be shown without first running the live generation — and it's
      // the fallback if the AI step is slow on stage.
      customerName: "Dana Ortiz",
      customerEmail: "dana@pitcrew.demo",
      customerPhone: "(209) 555-0177",
      vehicle: {
        id: "veh_rav4",
        year: 2021,
        make: "Toyota",
        model: "RAV4",
        trim: "XLE",
        plate: "7KPL921",
        mileage: 38450,
        photoUrl: "/vehicles/rav4.jpg",
      },
      status: "AWAITING_APPROVAL",
      rawTechNotes: `MULTI-POINT INSPECTION — 38,450 MI

[RED] Brakes front
Technician Note: Front pads 3mm, rotors lipped and scored. Rear pads 6mm ok. Recommend front pads + rotors, machine not possible below min thickness.

[RED] Battery / charging
Technician Note: Battery load test FAIL. 9.4V under load, spec 9.6 min. Cranking slow on cold start. Alt output 14.1V ok. Batt date code 3 yr.

[YELLOW] Cabin air filter
Technician Note: Filter loaded w/ debris, airflow restricted. Due per mileage.

[YELLOW] Rear wiper
Technician Note: Rear blade torn, streaking. Fronts ok.

[GREEN] Tires — 5/32 even wear all four, pressures set 35psi
[GREEN] Engine oil — clean, within interval
[GREEN] Coolant / brake fluid — level and condition ok
[GREEN] Exterior lighting — all functional
[GREEN] Suspension — no play, boots intact`,
      report: {
        verdict: "SERVICE_SOON",
        summary:
          "Your RAV4 is safe to drive, but two things need attention: the front brakes are down to their last quarter, and the battery failed its load test and is likely to leave you stranded on a cold morning. Two smaller comfort items can wait if you'd rather split the cost.",
        findings: [
          {
            id: "f_r2_brakes",
            catalogKey: "front_brakes",
            severity: "red",
            title: "Front brakes are down to 3mm",
            plain:
              "Your front brake pads are down to about 25% of their material, and the discs they press against are scored with a worn lip. Both need replacing together.",
            youllNotice:
              "A faint squeal when braking. Stopping still feels normal for now.",
            ifYouWait:
              "Pads wear through to metal, which ruins the discs and roughly doubles the repair cost.",
            urgency: "Within the next two weeks.",
            priceCents: 31200,
            approved: null,
          },
          {
            id: "f_r2_battery",
            catalogKey: "battery",
            severity: "red",
            title: "Battery failed its load test",
            plain:
              "Your battery holds a charge at rest but collapses under load — it measured 9.4 volts against a 9.6 volt minimum. It's three years old, which is about when they go.",
            youllNotice:
              "The engine cranks slowly on cold mornings before it catches.",
            ifYouWait:
              "It will eventually not start at all, usually on the coldest morning of the year.",
            urgency: "Before the next cold snap.",
            priceCents: 24500,
            approved: null,
          },
          {
            id: "f_r2_cabin_filter",
            catalogKey: "cabin_filter",
            severity: "amber",
            title: "Cabin air filter is clogged",
            plain:
              "The filter that cleans the air coming into your cabin is packed with road debris and is restricting airflow.",
            youllNotice:
              "Weaker airflow from the vents and a musty smell when the fan is on.",
            ifYouWait: "Nothing breaks — the air just stays stuffy.",
            urgency: "Whenever it's convenient.",
            priceCents: 8900,
            approved: null,
          },
          {
            id: "f_r2_wiper",
            catalogKey: "wipers",
            severity: "amber",
            title: "Rear wiper blade is torn",
            plain:
              "The rubber on your rear blade has split, so it smears instead of clearing. Your front blades are fine.",
            youllNotice: "Streaking across the rear glass in the rain.",
            ifYouWait: "A torn blade can eventually scratch the glass.",
            urgency: "Before the next rain.",
            priceCents: 3400,
            approved: null,
          },
          {
            id: "f_r2_tires",
            severity: "green",
            title: "Tires",
            plain:
              "All four tires have healthy tread at 5/32in with even wear. Pressures set to 35 psi.",
            youllNotice: "",
            ifYouWait: "",
            urgency: "No action needed.",
            priceCents: 0,
            approved: null,
          },
          {
            id: "f_r2_fluids",
            severity: "green",
            title: "Oil, coolant and brake fluid",
            plain:
              "Oil is clean and within its interval. Coolant and brake fluid are at level and in good condition.",
            youllNotice: "",
            ifYouWait: "",
            urgency: "No action needed.",
            priceCents: 0,
            approved: null,
          },
          {
            id: "f_r2_suspension",
            severity: "green",
            title: "Suspension and lighting",
            plain:
              "No play in the front end, all boots intact, and every exterior light works.",
            youllNotice: "",
            ifYouWait: "",
            urgency: "No action needed.",
            priceCents: 0,
            approved: null,
          },
        ],
      },
      events: [
        {
          at: minsAgo(230),
          actor: "Sarah Martinez, service adviser",
          label: "Vehicle checked in",
          detail: "38,450 mi · customer reported a faint squeal when braking",
        },
        {
          at: minsAgo(160),
          actor: "Dee Alvarez, brake & chassis technician",
          label: "Inspection completed",
          detail:
            "Front pads at 3mm with lipped rotors · battery failed load test at 9.4V",
        },
        {
          at: minsAgo(140),
          actor: "PitCrew AI",
          label: "Inspection report written",
          detail: "7 findings from the technician's notes · verdict service soon",
        },
        {
          at: minsAgo(18),
          actor: "Sarah Martinez, service adviser",
          label: "Report sent to customer",
          detail: "Sent to dana@pitcrew.demo for per-item approval",
        },
      ],
      createdAt: minsAgo(230),
      updatedAt: minsAgo(18),
    },
    {
      id: "ro_003",
      shopId: SEED_SHOP.id,
      shopName: SEED_SHOP.name,
      customerName: "Priya Nair",
      customerEmail: "priya.nair@example.com",
      customerPhone: "(209) 555-0163",
      vehicle: {
        id: "veh_f150",
        year: 2017,
        make: "Ford",
        model: "F-150",
        trim: "XLT",
        plate: "4TRK882",
        mileage: 91204,
        photoUrl: "",
      },
      status: "IN_PROGRESS",
      rawTechNotes:
        "Water pump weeping at gasket. Coolant low. Serpentine belt glazed. Replace pump, belt, flush coolant.",
      report: {
        verdict: "STOP_DRIVING",
        summary:
          "Your F-150's water pump is leaking coolant. Driving far risks overheating the engine, so we recommended fixing it right away — work is underway.",
        findings: [
          {
            id: "f_r3_pump",
            catalogKey: "water_pump",
            severity: "red",
            title: "Water pump is leaking coolant",
            plain:
              "The pump that circulates coolant through your engine is leaking at its seal, and your coolant level is low.",
            youllNotice:
              "A sweet smell after driving, coolant drops under the truck, temperature gauge creeping up.",
            ifYouWait:
              "An overheated engine can warp and fail completely — one of the most expensive repairs there is.",
            urgency: "Immediately — avoid driving until fixed.",
            priceCents: 68500,
            approved: true,
            // Job is on the lift, so the advisor already sourced these parts —
            // this is what feeds "Spent on parts" on the dashboard.
            selectedPart: {
              id: "seed_part_pump",
              title: "Motorcraft Water Pump PW-544 — F-150 3.5L EcoBoost",
              vendor: "NAPA Auto Parts",
              priceCents: 18742,
              delivery: "Pickup today",
              thumbnail: "",
              link: "https://www.napaonline.com/",
              rating: 4.7,
              inStock: true,
            },
          },
          {
            id: "f_r3_belt",
            catalogKey: "drive_belt",
            severity: "amber",
            title: "Serpentine belt is glazed",
            plain:
              "The belt that drives your accessories has a hard, shiny surface and doesn't grip as well as it should. We replace it while the pump is out.",
            youllNotice: "Occasional squeal on cold starts.",
            ifYouWait: "A slipping belt can leave you stranded.",
            urgency: "Being done with the water pump.",
            priceCents: 9800,
            approved: true,
            selectedPart: {
              id: "seed_part_belt",
              title: "Gates Serpentine Belt K060923 — Ford F-150",
              vendor: "RockAuto",
              priceCents: 2688,
              delivery: "Free delivery",
              thumbnail: "",
              link: "https://www.rockauto.com/",
              rating: 4.7,
              inStock: true,
            },
          },
        ],
      },
      payment: {
        at: minsAgo(60 * 4),
        amountCents: 78300,
        processor: "Stripe",
        reference: "cs_demo_f150_ro003",
      },
      events: [
        {
          at: minsAgo(60 * 26),
          actor: "Sarah Martinez, service adviser",
          label: "Vehicle checked in",
          detail: "91,204 mi · towed in, coolant smell and temperature gauge climbing",
        },
        {
          at: minsAgo(60 * 25),
          actor: "Luis Ferrer, ASE master technician",
          label: "Inspection completed",
          detail: "Water pump weeping at the gasket, coolant low, belt glazed",
        },
        {
          at: minsAgo(60 * 24),
          actor: "PitCrew AI",
          label: "Inspection report written",
          detail: "2 findings from the technician's notes · verdict stop driving",
        },
        {
          at: minsAgo(60 * 24),
          actor: "Sarah Martinez, service adviser",
          label: "Report sent to customer",
          detail: "Sent to priya.nair@example.com for per-item approval",
        },
        {
          at: minsAgo(60 * 5),
          actor: "Priya Nair, customer",
          label: "Approved a repair",
          detail: "Water pump is leaking coolant — 685.00 USD",
        },
        {
          at: minsAgo(60 * 5),
          actor: "Priya Nair, customer",
          label: "Approved a repair",
          detail: "Serpentine belt is glazed — 98.00 USD",
        },
        {
          at: minsAgo(60 * 4),
          actor: "Stripe",
          label: "Payment received",
          detail: "783.00 USD · ref cs_demo_f150_ro003",
        },
        {
          at: minsAgo(285),
          actor: "Sarah Martinez, service adviser",
          label: "Part sourced",
          detail: "Motorcraft Water Pump PW-544 — NAPA Auto Parts, 187.42 USD",
        },
        {
          at: minsAgo(283),
          actor: "Sarah Martinez, service adviser",
          label: "Part sourced",
          detail: "Gates Serpentine Belt K060923 — RockAuto, 26.88 USD",
        },
        {
          at: minsAgo(140),
          actor: "Luis Ferrer, ASE master technician",
          label: "Repair work started",
          detail: "Bay 3 · pump and belt on the lift",
        },
      ],
      createdAt: minsAgo(60 * 26),
      updatedAt: minsAgo(140),
    },
    {
      id: "ro_004",
      shopId: SEED_SHOP.id,
      shopName: SEED_SHOP.name,
      // Tom's account shows the finished state — job complete, car ready.
      customerName: "Tom Whitfield",
      customerEmail: "tom@pitcrew.demo",
      customerPhone: "(209) 555-0128",
      vehicle: {
        id: "veh_outback",
        year: 2020,
        make: "Subaru",
        model: "Outback",
        trim: "Premium",
        plate: "9SUB410",
        mileage: 51377,
        photoUrl: "",
      },
      status: "READY",
      rawTechNotes: `60K MILE SERVICE — 51,377 MI

[RED] Engine oil & filter
Technician Note: Due per interval. 5W-30 full synthetic, OEM filter. Drain plug washer replaced.

[YELLOW] Engine + cabin air filters
Technician Note: Both loaded. Engine filter grey, cabin filter debris packed. Replaced both.

[YELLOW] Tires
Technician Note: 6/32 front 7/32 rear, slight front shoulder wear. Rotated F/R and rebalanced. Pressures 33psi.

[YELLOW] Rear wiper
Technician Note: Blade chattering, rubber hardened. Customer declined, wants to source own.

[GREEN] Brakes — pads F 8mm R 9mm, rotors within spec, no lip
[GREEN] Battery/charging — 12.6V rest, 14.3V under load, batt 2 yr
[GREEN] Coolant / trans / brake fluid — level and condition ok
[GREEN] Drive belt & hoses — no cracking, tension ok
[GREEN] Road test — no codes, no pull, no noise`,
      report: {
        verdict: "SAFE_TO_DRIVE",
        summary:
          "Your Outback's 60,000-mile service is done and the car is in good shape — brakes, battery, belts and fluids all passed. You approved three items and declined the rear wiper blade, which is the only thing still outstanding.",
        findings: [
          {
            id: "f_r4_oil",
            catalogKey: "oil_service",
            severity: "red",
            title: "Engine oil and filter service",
            plain:
              "Your oil was past its interval. We drained it, fitted a new OEM filter and refilled with 5W-30 full synthetic.",
            youllNotice: "Quieter engine, especially on cold starts.",
            ifYouWait: "",
            urgency: "Completed on this visit.",
            priceCents: 12900,
            approved: true,
          },
          {
            id: "f_r4_filters",
            catalogKey: "cabin_filter",
            severity: "amber",
            title: "Engine and cabin air filters replaced",
            plain:
              "Both filters were loaded with debris — the engine one restricts power and economy, the cabin one restricts your vents. Both replaced.",
            youllNotice: "Stronger airflow from the vents, fresher cabin air.",
            ifYouWait: "",
            urgency: "Completed on this visit.",
            priceCents: 8900,
            approved: true,
          },
          {
            id: "f_r4_tires",
            severity: "amber",
            title: "Tire rotation and rebalance",
            plain:
              "Your front tires were wearing on the shoulders. We moved them front-to-rear and rebalanced all four so they wear evenly from here.",
            youllNotice: "Less vibration at highway speed.",
            ifYouWait: "",
            urgency: "Completed on this visit.",
            priceCents: 7900,
            approved: true,
          },
          {
            id: "f_r4_wiper",
            catalogKey: "wipers",
            severity: "amber",
            title: "Rear wiper blade is hardened",
            plain:
              "The rubber on your rear blade has gone hard and chatters across the glass instead of clearing it.",
            youllNotice: "Juddering and streaking on the rear window in rain.",
            ifYouWait: "A hardened blade can eventually scratch the glass.",
            urgency: "Before the next rain.",
            priceCents: 3400,
            approved: false,
          },
          {
            id: "f_r4_brakes",
            severity: "green",
            title: "Brakes",
            plain:
              "Front pads at 8mm, rears at 9mm, rotors within spec with no lip. Plenty of life left.",
            youllNotice: "",
            ifYouWait: "",
            urgency: "No action needed.",
            priceCents: 0,
            approved: null,
          },
          {
            id: "f_r4_battery",
            severity: "green",
            title: "Battery and charging",
            plain:
              "Battery reads 12.6V at rest and the alternator holds 14.3V under load. Both healthy.",
            youllNotice: "",
            ifYouWait: "",
            urgency: "No action needed.",
            priceCents: 0,
            approved: null,
          },
          {
            id: "f_r4_belts",
            severity: "green",
            title: "Belts, hoses and fluids",
            plain:
              "Drive belt shows no cracking, hoses are sound, and coolant, transmission and brake fluid are all at level and in good condition.",
            youllNotice: "",
            ifYouWait: "",
            urgency: "No action needed.",
            priceCents: 0,
            approved: null,
          },
          {
            id: "f_r4_roadtest",
            severity: "green",
            title: "Road test",
            plain:
              "Test driven after the work: no stored codes, no pulling, no new noises.",
            youllNotice: "",
            ifYouWait: "",
            urgency: "No action needed.",
            priceCents: 0,
            approved: null,
          },
        ],
      },
      payment: {
        at: minsAgo(60 * 27),
        amountCents: 29700,
        processor: "Stripe",
        reference: "cs_demo_outback_ro004",
      },
      events: [
        {
          at: minsAgo(60 * 30),
          actor: "Sarah Martinez, service adviser",
          label: "Vehicle checked in",
          detail: "51,377 mi · booked in for the 60,000-mile service",
        },
        {
          at: minsAgo(60 * 29),
          actor: "Dee Alvarez, brake & chassis technician",
          label: "Inspection completed",
          detail:
            "27-point inspection · oil past interval, both air filters loaded, front shoulder wear",
        },
        {
          at: minsAgo(60 * 28),
          actor: "PitCrew AI",
          label: "Inspection report written",
          detail: "8 findings from the technician's notes · verdict safe to drive",
        },
        {
          at: minsAgo(60 * 28),
          actor: "Sarah Martinez, service adviser",
          label: "Report sent to customer",
          detail: "Sent to tom@pitcrew.demo for per-item approval",
        },
        {
          at: minsAgo(60 * 27),
          actor: "Tom Whitfield, customer",
          label: "Approved a repair",
          detail: "Engine oil and filter service — 129.00 USD",
        },
        {
          at: minsAgo(60 * 27),
          actor: "Tom Whitfield, customer",
          label: "Approved a repair",
          detail: "Engine and cabin air filters replaced — 89.00 USD",
        },
        {
          at: minsAgo(60 * 27),
          actor: "Tom Whitfield, customer",
          label: "Approved a repair",
          detail: "Tire rotation and rebalance — 79.00 USD",
        },
        {
          at: minsAgo(60 * 27),
          actor: "Tom Whitfield, customer",
          label: "Declined a repair",
          detail: "Rear wiper blade is hardened — 34.00 USD",
        },
        {
          at: minsAgo(60 * 27),
          actor: "Stripe",
          label: "Payment received",
          detail: "297.00 USD · ref cs_demo_outback_ro004",
        },
        {
          at: minsAgo(60 * 26),
          actor: "Luis Ferrer, ASE master technician",
          label: "Repair work started",
          detail: "Bay 1 · oil, filters, tire rotation, brake inspection",
        },
        {
          at: minsAgo(60 * 2),
          actor: "Luis Ferrer, ASE master technician",
          label: "Work completed",
          detail: "5W-30 full synthetic, oil and cabin filters, tires rotated front-to-rear",
        },
        {
          at: minsAgo(45),
          actor: "Sarah Martinez, service adviser",
          label: "Quality check passed, vehicle ready for pickup",
          detail: "Road test completed, no stored codes",
        },
      ],
      createdAt: minsAgo(60 * 30),
      updatedAt: minsAgo(45),
    },
  ]);
}
