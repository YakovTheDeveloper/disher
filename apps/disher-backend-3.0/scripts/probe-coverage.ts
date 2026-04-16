/**
 * Catalog findability sanity check.
 *
 * For every product in the catalog, runs its own name through the matcher and
 * verifies the product ranks #1 against itself. Anything not at rank 1 means
 * the embedding space has a collision or a near-duplicate with a higher score —
 * worth investigating (duplicate in catalog, confusing name, alias hijack).
 *
 * Usage:
 *   npx tsx scripts/probe-coverage.ts              # summary only
 *   npx tsx scripts/probe-coverage.ts --verbose    # list every problem case
 *   npx tsx scripts/probe-coverage.ts --limit=100  # test first N products
 *
 * This is a static catalog → run this once, investigate findings, fix aliases
 * or catalog, then re-run after catalog changes.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { initMatcher, matchOne } from "../src/api/food-matcher.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalogPath = resolve(__dirname, "../data/food-catalog-lite.json");

interface CatalogItem { id: string; n: string; c?: string[] }

const argv = process.argv.slice(2);
const verbose = argv.includes("--verbose");
const limitArg = argv.find((a) => a.startsWith("--limit="))?.split("=")[1];
const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;

const pad = (s: string, n: number) => (s.length >= n ? s : s + " ".repeat(n - s.length));

async function main() {
  await initMatcher();
  const catalog = JSON.parse(readFileSync(catalogPath, "utf-8")) as CatalogItem[];
  const items = catalog.slice(0, Math.min(LIMIT, catalog.length));

  console.log(`\n=== Coverage probe (${items.length} / ${catalog.length} products) ===\n`);

  interface Issue { id: string; name: string; rank: number; top1Id: string; top1Name: string; top1Score: number; selfScore: number }
  const rankOne: number[] = [];
  const issues: Issue[] = [];

  let processed = 0;
  for (const item of items) {
    const top = await matchOne(item.n, 5);
    const rank = top.findIndex((t) => t.id === item.id) + 1;

    if (rank === 1) rankOne.push(top[0].score);
    else {
      const self = top.find((t) => t.id === item.id);
      issues.push({
        id: item.id,
        name: item.n,
        rank,
        top1Id: top[0]?.id ?? "—",
        top1Name: top[0]?.name ?? "—",
        top1Score: top[0]?.score ?? 0,
        selfScore: self?.score ?? 0,
      });
    }

    processed++;
    if (processed % 100 === 0) process.stderr.write(`  ${processed}/${items.length}\r`);
  }
  process.stderr.write("\n");

  // Sort issues by severity: rank 0 (not in top-5) first, then worst self-score
  issues.sort((a, b) => (a.rank || 99) - (b.rank || 99) || a.selfScore - b.selfScore);

  if (verbose || issues.length <= 40) {
    for (const iss of issues) {
      const rankStr = iss.rank === 0 ? "miss" : `#${iss.rank}`;
      console.log(`${pad(rankStr, 5)} ${pad(iss.id, 8)} ${pad(iss.name, 50)}`);
      console.log(`      top1 [${pad(iss.top1Id, 8)}] ${iss.top1Name}  (${iss.top1Score.toFixed(3)})`);
      console.log(`      self score: ${iss.selfScore.toFixed(3)}`);
    }
  } else {
    console.log(`${issues.length} issues (pass --verbose to list all). Showing worst 20:`);
    for (const iss of issues.slice(0, 20)) {
      const rankStr = iss.rank === 0 ? "miss" : `#${iss.rank}`;
      console.log(`${pad(rankStr, 5)} ${pad(iss.id, 8)} ${pad(iss.name, 50)} → top1=${iss.top1Name}`);
    }
  }

  const coverage = rankOne.length / items.length;
  const avgSelfScore = rankOne.length ? rankOne.reduce((s, x) => s + x, 0) / rankOne.length : 0;

  console.log("\n=== Summary ===");
  console.log(`Products:       ${items.length}`);
  console.log(`Rank 1:         ${rankOne.length}  (${(coverage * 100).toFixed(1)}%)`);
  console.log(`Issues:         ${issues.length}  (${(100 - coverage * 100).toFixed(1)}%)`);
  console.log(`  rank 2-5:     ${issues.filter((i) => i.rank > 0).length}`);
  console.log(`  not in top-5: ${issues.filter((i) => i.rank === 0).length}`);
  console.log(`Avg self-score (rank 1): ${avgSelfScore.toFixed(3)}`);
  console.log();
  console.log("Note: rank-2+ issues usually point to near-duplicate products in the catalog");
  console.log("(e.g. 'Банан' vs 'Бананы спелые'). Fix by merging duplicates or adding aliases.");
}

await main();
