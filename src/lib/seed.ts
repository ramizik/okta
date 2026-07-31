import type { PartOffer, Report, RepairOrder, Shop, User } from "./types";

// Bump whenever seed data changes — a deployed store holding an older version
// reseeds itself on next read, so prod never serves stale demo data.
export const SEED_VERSION = 2;

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
  {
    id: "user_marcus",
    name: "Marcus Chen",
    email: "customer@pitcrew.demo",
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
      createdAt: minsAgo(94),
      updatedAt: minsAgo(2),
    },
    {
      id: "ro_002",
      shopId: SEED_SHOP.id,
      shopName: SEED_SHOP.name,
      // Marcus's second car. Seeded at AWAITING_APPROVAL so the demo can show
      // the approve-and-pay screen without first running the live generation —
      // and so there's a fallback if the AI step is slow on stage.
      customerName: "Marcus Chen",
      customerEmail: "customer@pitcrew.demo",
      customerPhone: "(209) 555-0142",
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
      rawTechNotes:
        "Front brake pads at 3mm, rotors lipped. Rear pads 6mm ok. Tires 5/32 all around. Recommend front pads and rotors.",
      report: {
        verdict: "SERVICE_SOON",
        summary:
          "Your RAV4 is fine for now, but the front brakes are getting thin and should be replaced soon.",
        findings: [
          {
            id: "f_r2_brakes",
            severity: "amber",
            title: "Front brake pads are wearing thin",
            plain:
              "Your front brake pads are down to about 25% of their material, and the discs they press against have a worn lip.",
            youllNotice:
              "Possibly a faint squeal when braking. Stopping still feels normal.",
            ifYouWait:
              "Pads wear through to metal, which ruins the discs and roughly doubles the repair cost.",
            urgency: "Within the next few weeks.",
            priceCents: 31200,
            approved: null,
          },
          {
            id: "f_r2_tires",
            severity: "green",
            title: "Tires",
            plain: "All four tires have healthy tread remaining.",
            youllNotice: "",
            ifYouWait: "",
            urgency: "No action needed.",
            priceCents: 0,
            approved: null,
          },
        ],
      },
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
      createdAt: minsAgo(60 * 26),
      updatedAt: minsAgo(140),
    },
    {
      id: "ro_004",
      shopId: SEED_SHOP.id,
      shopName: SEED_SHOP.name,
      // Marcus's third car — the finished state, so the garage shows the full
      // arc (being inspected / needs a decision / done) on one login.
      customerName: "Marcus Chen",
      customerEmail: "customer@pitcrew.demo",
      customerPhone: "(209) 555-0142",
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
      rawTechNotes:
        "60k service complete. Oil, filters, tire rotation, brake inspection all done. No issues found.",
      report: {
        verdict: "SAFE_TO_DRIVE",
        summary:
          "Your Outback's 60,000-mile service is complete and everything checked out. You're good to go.",
        findings: [
          {
            id: "f_r4_service",
            severity: "green",
            title: "60,000-mile service completed",
            plain:
              "Oil and filters changed, tires rotated, brakes inspected. Everything looks healthy.",
            youllNotice: "",
            ifYouWait: "",
            urgency: "No action needed.",
            priceCents: 24900,
            approved: true,
          },
        ],
      },
      createdAt: minsAgo(60 * 30),
      updatedAt: minsAgo(45),
    },
  ]);
}
