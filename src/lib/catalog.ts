import type { Finding, Vehicle } from "./types";

// The shop's service menu.
//
// The model diagnoses; the shop prices. Every generated finding is matched
// back to a catalog entry here, which fixes two things the live model can't
// give us on its own:
//
//   1. Price. The prompt forbids inventing prices (the inspection sheet has
//      none), so a live report would otherwise be entirely $0 and the customer
//      would have nothing to approve or pay for.
//   2. A stable parts query. The model words each finding differently every
//      run ("Spark Plugs" vs "Check Engine Light – Cylinder 2 Misfire"), which
//      would send a different search to SerpApi each time. A fixed query per
//      service keeps the parts panel showing the same items in every demo.
//
// Unmatched findings stay at $0 and simply read "No cost" — nothing breaks.

export interface CatalogEntry {
  key: string;
  label: string;
  priceCents: number;
  /** Matched against the finding title + plain text, first hit wins. */
  match: RegExp;
  /** Parts query with {vehicle} replaced. Empty = not a parts job. */
  partsQuery: string;
  /** Seeded offers to fall back to, keyed by seed finding id. */
  seededKey?: string;
}

// Order matters: the first entry whose pattern matches wins, so the most
// specific services are listed before the general ones.
export const SERVICE_CATALOG: CatalogEntry[] = [
  {
    key: "ignition",
    label: "Spark plugs & ignition coil",
    priceCents: 34000,
    match: /spark plug|misfire|ignition coil|coil pack|cylinder \d|check engine|dashboard indicator|engine code/i,
    partsQuery: "{vehicle} NGK iridium spark plugs set of 4",
    seededKey: "f_misfire",
  },
  {
    key: "oil_service",
    label: "Engine oil & filter service",
    priceCents: 8850,
    match: /engine oil|oil change|oil service|dirty oil|oil is/i,
    partsQuery: "{vehicle} full synthetic 0W-20 engine oil and filter kit",
    seededKey: "f_oil",
  },
  {
    key: "drive_belt",
    label: "Drive belt replacement",
    priceCents: 14500,
    match: /drive belt|serpentine|belt.*crack|cracked belt|accessory belt/i,
    partsQuery: "{vehicle} serpentine drive belt",
    seededKey: "f_belts",
  },
  {
    key: "cabin_filter",
    label: "Cabin air filter",
    priceCents: 5900,
    match: /cabin air filter|cabin filter/i,
    partsQuery: "{vehicle} cabin air filter",
    seededKey: "f_cabin_filter",
  },
  {
    key: "front_brakes",
    label: "Front brake pads & rotors",
    priceCents: 31200,
    match: /brake pad|rotor|pads.*mm|brakes.*thin|metal-on-metal/i,
    partsQuery: "{vehicle} front brake pads and rotors kit",
  },
  {
    key: "battery",
    label: "Battery replacement",
    priceCents: 22500,
    match: /battery (is )?(weak|failing|low|bad|needs)|replace battery|battery test.*fail/i,
    partsQuery: "{vehicle} replacement car battery",
  },
  {
    key: "engine_air_filter",
    label: "Engine air filter",
    priceCents: 4200,
    match: /engine air filter|air filter.*(dirty|clog|due|replace)/i,
    partsQuery: "{vehicle} engine air filter",
  },
  {
    key: "wipers",
    label: "Wiper blades",
    priceCents: 3400,
    match: /wiper blade.*(worn|streak|replace|due)|wipers.*(worn|replace)/i,
    partsQuery: "{vehicle} windshield wiper blades pair",
  },
  {
    key: "coolant",
    label: "Coolant flush",
    priceCents: 12900,
    match: /coolant.*(flush|low|dirty|due|replace)|radiator.*(flush|leak)/i,
    partsQuery: "{vehicle} engine coolant antifreeze",
  },
  {
    key: "transmission",
    label: "Transmission service",
    priceCents: 18900,
    match: /transmission (fluid|service|leak|breather)/i,
    partsQuery: "{vehicle} transmission fluid",
  },
  {
    key: "water_pump",
    label: "Water pump replacement",
    priceCents: 68500,
    match: /water pump/i,
    partsQuery: "{vehicle} water pump",
  },
];

export function vehicleLabel(vehicle: Vehicle): string {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}

/** First catalog entry matching a finding's own words, or undefined. */
export function matchCatalog(finding: {
  title: string;
  plain: string;
}): CatalogEntry | undefined {
  const haystack = `${finding.title} ${finding.plain}`;
  return SERVICE_CATALOG.find((entry) => entry.match.test(haystack));
}

export function catalogByKey(key: string | undefined): CatalogEntry | undefined {
  if (!key) return undefined;
  return SERVICE_CATALOG.find((e) => e.key === key);
}

/**
 * The exact query sent to the parts search for a finding. Deterministic for
 * anything in the catalog, so the demo surfaces the same items every run.
 */
export function catalogQuery(
  entry: CatalogEntry,
  vehicle: Vehicle,
): string {
  return entry.partsQuery.replace("{vehicle}", vehicleLabel(vehicle));
}

/**
 * Price a generated report against the shop menu.
 *
 * Green findings are left alone — an item that passed inspection has no job
 * attached to it, regardless of what it mentions. A price the model did
 * provide is respected; we only fill in the zeros.
 */
export function priceFindings<T extends Finding>(findings: T[]): T[] {
  const used = new Set<string>();

  return findings.map((finding) => {
    if (finding.severity === "green") return finding;

    const entry = matchCatalog(finding);
    if (!entry) return finding;

    // One charge per service: if the model split a service across two
    // findings, only the first one carries the price.
    const alreadyBilled = used.has(entry.key);
    used.add(entry.key);

    return {
      ...finding,
      catalogKey: entry.key,
      priceCents:
        finding.priceCents > 0
          ? finding.priceCents
          : alreadyBilled
            ? 0
            : entry.priceCents,
    };
  });
}
