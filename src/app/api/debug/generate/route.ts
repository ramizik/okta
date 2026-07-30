import { NextResponse } from "next/server";
import { generateReport } from "@/lib/ai";
import { HERO_RAW_NOTES } from "@/lib/seed";
import { getOrder } from "@/lib/store";
import { searchPartsForFinding } from "@/lib/parts";
import { getShop } from "@/lib/store";

// TEMPORARY Phase 4 checkpoint harness. Dev-only, deleted after verifying.
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const vehicle = getOrder("ro_001")!.vehicle;
  const t0 = Date.now();
  const { report, source } = await generateReport(HERO_RAW_NOTES, vehicle);
  const seconds = Number(((Date.now() - t0) / 1000).toFixed(1));

  const priced = report.findings.filter((f) => f.priceCents > 0);
  // What the parts panel would search for, per priced finding.
  const queries = await Promise.all(
    priced.map(async (f) => {
      const r = await searchPartsForFinding(f, vehicle, getShop().location);
      return {
        title: f.title,
        usd: f.priceCents / 100,
        catalogKey: f.catalogKey,
        query: r.query,
        offers: r.offers.length,
        partsSource: r.source,
      };
    }),
  );

  return NextResponse.json({
    source,
    seconds,
    verdict: report.verdict,
    totalUsd: report.findings.reduce((n, f) => n + f.priceCents, 0) / 100,
    pricedCount: priced.length,
    queries,
  });
}
