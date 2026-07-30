import { NextResponse } from "next/server";
import { generateReport } from "@/lib/ai";
import { HERO_RAW_NOTES } from "@/lib/seed";
import { getOrder } from "@/lib/store";

// TEMPORARY Phase 4 checkpoint harness. Dev-only, delete after verifying.
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const vehicle = getOrder("ro_001")!.vehicle;
  const t0 = Date.now();
  const { report, source } = await generateReport(HERO_RAW_NOTES, vehicle);
  return NextResponse.json({
    source,
    seconds: Number(((Date.now() - t0) / 1000).toFixed(1)),
    verdict: report.verdict,
    summary: report.summary,
    counts: {
      total: report.findings.length,
      red: report.findings.filter((f) => f.severity === "red").length,
      amber: report.findings.filter((f) => f.severity === "amber").length,
      green: report.findings.filter((f) => f.severity === "green").length,
      priced: report.findings.filter((f) => f.priceCents > 0).length,
    },
    totalUsd: report.findings.reduce((n, f) => n + f.priceCents, 0) / 100,
    findings: report.findings.map((f) => ({
      severity: f.severity,
      title: f.title,
      usd: f.priceCents / 100,
      plain: f.plain,
    })),
  });
}
