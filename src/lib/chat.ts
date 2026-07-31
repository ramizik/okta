import type { RepairOrder, Role } from "./types";
import { formatUsd } from "./format";
import { PLANS } from "./plans";
import {
  approvedTotalCents,
  getOrder,
  getOrders,
  getOrdersForCustomer,
  getShop,
} from "./store";

// Page-aware chatbot: the server builds the context from the store based on
// who is asking and what page they're on. The client only ever sends a path —
// it can't request data it doesn't own.

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "minimax/minimax-m3";
const TIMEOUT_MS = 25_000;

// ---------------------------------------------------------------------------
// Context assembly

function describeOrder(o: RepairOrder, full: boolean): object {
  const base = {
    orderId: o.id,
    vehicle:
      `${o.vehicle.year} ${o.vehicle.make} ${o.vehicle.model}` +
      (o.vehicle.trim ? ` ${o.vehicle.trim}` : ""),
    plate: o.vehicle.plate,
    mileage: o.vehicle.mileage,
    status: o.status,
    customer: o.customerName,
    approvedTotal: formatUsd(approvedTotalCents(o)),
    verdict: o.report?.verdict ?? "report not generated yet",
  };
  if (!full) return base;
  return {
    ...base,
    reportSummary: o.report?.summary ?? null,
    findings:
      o.report?.findings.map((f) => ({
        severity: f.severity,
        title: f.title,
        whatWeFound: f.plain,
        youllNotice: f.youllNotice || undefined,
        ifYouWait: f.ifYouWait || undefined,
        urgency: f.urgency || undefined,
        price: f.priceCents > 0 ? formatUsd(f.priceCents) : "no charge",
        customerDecision:
          f.approved === true
            ? "approved"
            : f.approved === false
              ? "declined"
              : "not decided yet",
      })) ?? "No report yet — the inspection notes haven't been translated.",
  };
}

const PRODUCT_KNOWLEDGE = {
  whatIsPitCrew:
    "PitCrew turns technician inspection notes into plain-English reports. Customers review each finding, approve or decline items, and pay online. Statuses flow: Checked in → Inspection complete → Awaiting approval → Approved → Paid → In progress → Ready for pickup.",
  paying:
    "Approved items are paid online by card (powered by Stripe) from the report page. The shop is notified immediately and work starts sooner.",
  plans: PLANS.map((p) => ({
    name: p.name,
    price: `${formatUsd(p.priceCents)}/mo`,
    features: p.features,
  })),
};

export async function buildChatContext(
  role: Role,
  email: string,
  path: string,
): Promise<object> {
  const shop = await getShop();
  const orderIdMatch = path.match(/\/orders\/([\w-]+)/);
  const focusedId = orderIdMatch?.[1];

  const visibleOrders =
    role === "advisor"
      ? await getOrders(shop.id)
      : await getOrdersForCustomer(email);

  // Ownership is enforced here: the focused order must be in the visible set.
  const focused = focusedId
    ? visibleOrders.find((o) => o.id === focusedId)
    : undefined;

  return {
    shop: { name: shop.name, plan: shop.plan },
    viewer: { role, email },
    currentPage: focused
      ? `Order detail for ${focused.id}`
      : path.startsWith("/shop")
        ? "Shop dashboard (all repair orders)"
        : path.startsWith("/garage")
          ? "Customer garage (their vehicles)"
          : path,
    currentOrder: focused ? describeOrder(focused, true) : undefined,
    otherOrders: visibleOrders
      .filter((o) => o.id !== focusedId)
      .map((o) => describeOrder(o, false)),
    product: PRODUCT_KNOWLEDGE,
  };
}

// ---------------------------------------------------------------------------
// Prompt

function systemPrompt(role: Role, context: object): string {
  const audience =
    role === "customer"
      ? `You are talking to the vehicle owner. Second person, warm, reassuring but honest. No jargon — 8th-grade reading level. If a part name is unavoidable, say what it does in a few words.`
      : `You are talking to the shop's service advisor. Be efficient and specific; light industry terminology is fine.`;

  return `You are the PitCrew Assistant, a helpful chat helper inside PitCrew, the auto-repair approval app for ${
    (context as { shop: { name: string } }).shop.name
  }.

${audience}

Ground rules:
- Answer ONLY from the DATA below plus common automotive knowledge (e.g. what a drive belt does, why misfires damage catalytic converters). When you use general knowledge about consequences, tie it back to the findings in DATA.
- Never invent prices, discounts, dates, or findings that aren't in DATA. If asked something DATA can't answer (booking changes, refunds, other people's vehicles), say so in one sentence and suggest contacting the shop.
- Money questions: use the exact prices in DATA. Totals only include approved items.
- Safety questions: use the verdict and urgency fields honestly. Never guarantee safety beyond what the report says, never fear-monger beyond it either.
- Keep replies short: 1-3 sentences, or up to 5 short bullet lines when listing items. Plain text only — no markdown headers, no bold, no tables. Bullets as "- " lines are fine.
- Stay on topic (this vehicle, this shop, this app, car care). Politely steer anything else back.

DATA:
${JSON.stringify(context, null, 1)}`;
}

// ---------------------------------------------------------------------------
// Streaming call

/**
 * Streams the assistant reply as plain text chunks.
 * Throws only before the stream starts (caller turns that into a 502).
 */
export async function streamChatReply(
  role: Role,
  email: string,
  path: string,
  messages: ChatMessage[],
): Promise<ReadableStream<Uint8Array>> {
  const apiKey =
    process.env.OPENROUTER_API_API_KEY ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OpenRouter key missing");

  const context = await buildChatContext(role, email, path);

  const upstream = await fetch(OPENROUTER_URL, {
    method: "POST",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      max_tokens: 700,
      temperature: 0.4,
      reasoning: { enabled: false },
      messages: [
        { role: "system", content: systemPrompt(role, context) },
        ...messages.slice(-12),
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    throw new Error(`OpenRouter ${upstream.status}`);
  }

  // Re-emit OpenRouter's SSE stream as bare text deltas.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const data = line.trim();
          if (!data.startsWith("data:")) continue;
          const payload = data.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const delta: string | undefined = JSON.parse(payload).choices?.[0]
              ?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(delta));
          } catch {
            // Partial JSON split across chunks — ignore; SSE lines are
            // newline-delimited so complete lines always parse.
          }
        }
      },
    }),
  );
}
