// Dev smoke test for Phase 9 parts sourcing. Run: npx tsx --env-file=.env scripts/parts-smoke.ts
import { searchPartsForFinding } from "../src/lib/parts";
import { MOCK_HERO_REPORT, SEED_SHOP } from "../src/lib/seed";
import { buildSeedOrders } from "../src/lib/seed";

const order = buildSeedOrders()[0];
const targets = ["f_misfire", "f_oil", "f_belts"];

for (const id of targets) {
  const finding = MOCK_HERO_REPORT.findings.find((f) => f.id === id)!;
  const t0 = Date.now();
  const r = await searchPartsForFinding(finding, order.vehicle, SEED_SHOP.location);
  console.log(`\n=== ${finding.title}`);
  console.log(`    query   : "${r.query}"`);
  console.log(`    source  : ${r.source}   (${Date.now() - t0}ms)`);
  for (const o of r.offers) {
    console.log(`    $${(o.priceCents / 100).toFixed(2).padStart(8)}  ${o.vendor.padEnd(22)} ${o.title.slice(0, 52)}`);
  }
}
