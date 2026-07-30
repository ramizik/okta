import type { Finding, PartOffer, PartSearch, Vehicle } from "./types";
import { MOCK_PART_OFFERS, MOCK_PART_OFFERS_GENERIC } from "./seed";
import { catalogByKey, catalogQuery, matchCatalog } from "./catalog";

// Live parts sourcing: a Finding becomes a real, purchasable part list.
//
// Two steps, both behind the same demo rule as src/lib/ai.ts — this module
// NEVER throws. Any failure falls back to seeded offers so the panel always
// renders something honest.
//
//   1. MiniMax M3 turns "worn to 3mm, metal-on-metal" into a parts query.
//   2. SerpApi's google_shopping engine returns real vendors + prices,
//      scoped to the shop's location so results are orderable nearby.

const SERPAPI_URL = "https://serpapi.com/search.json";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const QUERY_MODEL = "minimax/minimax-m3";

// The query step is short — if it can't answer fast, the heuristic is fine.
const QUERY_TIMEOUT_MS = 8_000;
const SEARCH_TIMEOUT_MS = 12_000;
const MAX_OFFERS = 6;

const QUERY_SYSTEM_PROMPT = `You turn an auto repair inspection finding into a parts-store search query.

Rules:
- Output ONLY the search query text. No quotes, no explanation, no punctuation at the end.
- Include the vehicle year, make and model, then the specific part needed.
- Name the physical part to buy, not the symptom. "misfire on cylinder 2" -> "spark plugs".
- Keep it under 12 words. No brand preference unless the finding names one.

Example input: 2019 Honda Accord / Ignition misfire on cylinder 2 / spark plugs worn and burnt
Example output: 2019 Honda Accord iridium spark plugs set`;

interface SerpShoppingResult {
  title?: string;
  source?: string;
  price?: string;
  extracted_price?: number;
  thumbnail?: string;
  product_link?: string;
  link?: string;
  delivery?: string;
  rating?: number;
}

/**
 * Heuristic query — used when the LLM is unavailable or too slow.
 * Strips the symptom framing and leans on the finding title, which is already
 * written in near-parts language by the report generator.
 */
function heuristicQuery(finding: Finding, vehicle: Vehicle): string {
  const car = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  return `${car} ${finding.title.toLowerCase().replace(/[^a-z0-9 ]/g, " ")}`
    .replace(/\s+/g, " ")
    .trim();
}

async function buildQuery(
  finding: Finding,
  vehicle: Vehicle,
): Promise<{ query: string; source: "live" | "fallback" }> {
  // Anything on the shop's service menu has a fixed query. The model words
  // each finding differently every run, so letting it write the query would
  // search for something slightly different in every demo — this pins it.
  const entry = catalogByKey(finding.catalogKey) ?? matchCatalog(finding);
  if (entry?.partsQuery) {
    return { query: catalogQuery(entry, vehicle), source: "live" };
  }

  const apiKey =
    process.env.OPENROUTER_API_API_KEY ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { query: heuristicQuery(finding, vehicle), source: "fallback" };
  }

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: QUERY_MODEL,
        max_tokens: 60,
        temperature: 0.2,
        reasoning: { enabled: false },
        messages: [
          { role: "system", content: QUERY_SYSTEM_PROMPT },
          {
            role: "user",
            content: `${vehicle.year} ${vehicle.make} ${vehicle.model}${
              vehicle.trim ? ` ${vehicle.trim}` : ""
            } / ${finding.title} / ${finding.plain}`,
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`openrouter ${res.status}`);

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const query = data.choices?.[0]?.message?.content?.trim().replace(/^"|"$/g, "");
    if (query && query.length > 3 && query.length < 160) {
      return { query, source: "live" };
    }
    throw new Error("unusable query");
  } catch (err) {
    console.warn("[parts] query build failed:", (err as Error).message);
    return { query: heuristicQuery(finding, vehicle), source: "fallback" };
  }
}

function normalizeOffer(
  raw: SerpShoppingResult,
  idx: number,
): PartOffer | null {
  const title = raw.title?.trim();
  const vendor = raw.source?.trim();
  const price = raw.extracted_price;
  if (!title || !vendor || !Number.isFinite(price) || (price as number) <= 0) {
    return null;
  }
  return {
    id: `part_${idx}_${vendor.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    title,
    vendor,
    priceCents: Math.round((price as number) * 100),
    delivery: raw.delivery?.trim() || "Check vendor",
    thumbnail: raw.thumbnail ?? "",
    link: raw.product_link ?? raw.link ?? "",
    rating: Number.isFinite(raw.rating) ? raw.rating : undefined,
    inStock: true,
  };
}

function seededOffers(finding: Finding): PartOffer[] {
  // Live findings get generated ids (f_gen_3), so fall back through the
  // catalog entry's seeded key before giving up on the generic offers.
  const entry = catalogByKey(finding.catalogKey) ?? matchCatalog(finding);
  const seeded =
    MOCK_PART_OFFERS[finding.id] ??
    (entry?.seededKey ? MOCK_PART_OFFERS[entry.seededKey] : undefined) ??
    MOCK_PART_OFFERS_GENERIC;
  return structuredClone(seeded);
}

// Same query, same offers — for the whole run of the dev server. Keeps the
// parts panel identical across repeated demos and saves SerpApi quota.
const globalCache = globalThis as unknown as {
  __pitcrewPartsCache?: Map<string, PartOffer[]>;
};
function offerCache(): Map<string, PartOffer[]> {
  globalCache.__pitcrewPartsCache ??= new Map();
  return globalCache.__pitcrewPartsCache;
}

/**
 * Find purchasable parts for one inspection finding.
 * Never throws — falls back to seeded offers on any failure.
 */
export async function searchPartsForFinding(
  finding: Finding,
  vehicle: Vehicle,
  location: string,
): Promise<PartSearch> {
  const { query } = await buildQuery(finding, vehicle);

  const cached = offerCache().get(query);
  if (cached) {
    return { query, offers: structuredClone(cached), source: "live" };
  }

  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    console.warn("[parts] SERPAPI_API_KEY missing; serving seeded offers");
    return { query, offers: seededOffers(finding), source: "fallback" };
  }

  try {
    const params = new URLSearchParams({
      engine: "google_shopping",
      q: query,
      location,
      api_key: apiKey,
      num: "20",
    });
    const res = await fetch(`${SERPAPI_URL}?${params}`, {
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`serpapi ${res.status}`);

    const data = (await res.json()) as {
      shopping_results?: SerpShoppingResult[];
      error?: string;
    };
    if (data.error) throw new Error(data.error);

    // Keep Google's relevance order. Sorting by price alone surfaces the
    // cheapest *wrong* part (one spark plug instead of the set of four) —
    // the advisor still sees every price side by side to compare.
    const offers = (data.shopping_results ?? [])
      .map(normalizeOffer)
      .filter((o): o is PartOffer => o !== null)
      .slice(0, MAX_OFFERS);

    if (offers.length === 0) throw new Error("no usable results");
    offerCache().set(query, structuredClone(offers));
    return { query, offers, source: "live" };
  } catch (err) {
    console.warn("[parts] search failed:", (err as Error).message);
    return { query, offers: seededOffers(finding), source: "fallback" };
  }
}
