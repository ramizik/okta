import type { Report, Severity, Vehicle, Verdict } from "./types";
import { MOCK_HERO_REPORT } from "./seed";
import { priceFindings } from "./catalog";

// LLM report generation via OpenRouter (provisioned through Stripe Projects).
// Demo rule: this function NEVER throws and never takes longer than ~12s —
// any failure silently falls back to the pre-generated hero report.

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// MiniMax M3 via the user's BYOK key connected in OpenRouter.
// Single model by design — on any failure we serve the seeded fallback report.
const MODELS = ["minimax/minimax-m3"];
// Free-tier models take ~14s on the full inspection sheet; the generate
// button's loading state covers this, and the fallback covers anything longer.
const TIMEOUT_MS = 20_000;

const SYSTEM_PROMPT = `You translate auto repair technician notes into a report for the car's owner.

Rules:
- Plain English, 8th-grade reading level. No jargon — if a part name is unavoidable, say what it does.
- Second person ("your Accord", "you'll notice"). Never "the vehicle".
- Honest about urgency, never fear-mongering.
- Never invent prices. If the notes don't state a price for an item, use 0 for price_cents.
- Every item in the notes appears exactly once. Green/OK items get short one-line "plain" text and empty strings for youll_notice/if_you_wait.
- verdict: STOP_DRIVING only if driving risks a breakdown or safety issue right now; SERVICE_SOON if items need attention in days/weeks; SAFE_TO_DRIVE otherwise.

Respond with ONLY a JSON object, no markdown fences:
{"verdict":"SAFE_TO_DRIVE|SERVICE_SOON|STOP_DRIVING","summary":"2 sentences addressed to the owner","items":[{"severity":"red|amber|green","title":"...","plain":"what we found, plain English","youll_notice":"...","if_you_wait":"...","urgency":"...","price_cents":0}]}`;

interface RawItem {
  severity?: string;
  title?: string;
  plain?: string;
  youll_notice?: string;
  if_you_wait?: string;
  urgency?: string;
  price_cents?: number;
}

const VERDICTS: Verdict[] = ["SAFE_TO_DRIVE", "SERVICE_SOON", "STOP_DRIVING"];
const SEVERITIES: Severity[] = ["red", "amber", "green"];

function parseReport(content: string): Report | null {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "");
  const raw = JSON.parse(cleaned) as {
    verdict?: string;
    summary?: string;
    items?: RawItem[];
  };
  if (!raw.summary || !Array.isArray(raw.items) || raw.items.length === 0) {
    return null;
  }
  return {
    verdict: VERDICTS.includes(raw.verdict as Verdict)
      ? (raw.verdict as Verdict)
      : "SERVICE_SOON",
    summary: raw.summary,
    // The model is forbidden from inventing prices, so a live report arrives
    // entirely at $0. The shop's own service menu prices it — see catalog.ts.
    findings: priceFindings(
      raw.items
      .filter((i) => i.title && i.plain)
      .map((i, idx) => ({
        id: `f_gen_${idx}`,
        severity: SEVERITIES.includes(i.severity as Severity)
          ? (i.severity as Severity)
          : "amber",
        title: i.title as string,
        plain: i.plain as string,
        youllNotice: i.youll_notice ?? "",
        ifYouWait: i.if_you_wait ?? "",
        urgency: i.urgency ?? "",
        priceCents:
          Number.isFinite(i.price_cents) && (i.price_cents as number) >= 0
            ? Math.round(i.price_cents as number)
            : 0,
        approved: null,
      })),
    ),
  };
}

async function callModel(
  model: string,
  rawNotes: string,
  vehicle: Vehicle,
): Promise<Report | null> {
  const apiKey =
    process.env.OPENROUTER_API_API_KEY ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1800,
      temperature: 0.3,
      // Nemotron is a reasoning model; thinking tokens blow the time budget.
      reasoning: { enabled: false },
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}${
            vehicle.trim ? ` ${vehicle.trim}` : ""
          }, ${vehicle.mileage.toLocaleString("en-US")} miles.\n\nTechnician inspection notes:\n${rawNotes}`,
        },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;
  return parseReport(content);
}

export async function generateReport(
  rawNotes: string,
  vehicle: Vehicle,
): Promise<{ report: Report; source: "live" | "fallback" }> {
  for (const model of MODELS) {
    try {
      const report = await callModel(model, rawNotes, vehicle);
      if (report && report.findings.length > 0) {
        return { report, source: "live" };
      }
      console.warn(`[ai] ${model} returned unusable output, trying next`);
    } catch (err) {
      console.warn(`[ai] ${model} failed:`, (err as Error).message);
    }
  }
  // Demo safety net — the seeded hero report always renders.
  console.warn("[ai] all models failed; serving seeded fallback report");
  return { report: structuredClone(MOCK_HERO_REPORT), source: "fallback" };
}
