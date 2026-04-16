/**
 * Dice trigram similarity simulation for the probe set.
 *
 * For every query in BASIC+TRICKY+OOV, computes Dice trigram similarity
 * against every catalog product. Reports:
 *
 *  - Histogram of top-1 Dice scores, split by true-positive (expected id
 *    is top-1) vs false-positive (expected id is NOT top-1, or query is OOV).
 *  - Per-tag recall@1 at a grid of Dice-only thresholds.
 *  - Separation between TP and FP top-1 distributions — this is the signal
 *    for whether Dice alone is useful, and where to put the ambiguous band.
 *
 * We use this output to pick:
 *   - Dice-alone high-confidence threshold (top-1 score >= X ⇒ commit)
 *   - Dice-alone reject threshold (top-1 score < Y ⇒ Dice adds nothing)
 *   - Weight w in hybrid: s_hybrid = w * cosine + (1-w) * dice
 *
 * Usage: npx tsx scripts/probe-hybrid-sim.ts
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalogPath = resolve(__dirname, "../data/food-catalog-lite.json");

interface LiteEntry { id: string; n: string; c: string[] }

const catalog = JSON.parse(readFileSync(catalogPath, "utf-8")) as LiteEntry[];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[.,!?;:()"'«»]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trigrams(s: string): Set<string> {
  const padded = `  ${s}  `;
  const out = new Set<string>();
  for (let i = 0; i <= padded.length - 3; i++) out.add(padded.slice(i, i + 3));
  return out;
}

function dice(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  for (const t of a) if (b.has(t)) overlap++;
  return (2 * overlap) / (a.size + b.size);
}

// Precompute trigrams for each catalog entry (against normalized name).
const catTrigrams: Array<{ id: string; name: string; tri: Set<string> }> = catalog.map((e) => ({
  id: e.id,
  name: e.n,
  tri: trigrams(normalize(e.n)),
}));

// ─── Probe set (mirror of probe-matcher.ts, kept in sync manually) ───
// We re-import only to avoid tripping the matcher's initMatcher side effects.
// Import the Case arrays by structural copy from probe-matcher.ts.
// Simplest: import the file for its data via dynamic import below.

const { BASIC, TRICKY, OOV } = await import("./probe-cases.ts").catch(() => null)
  ?? await extractCasesFromProbeMatcher();

async function extractCasesFromProbeMatcher() {
  // Parse probe-matcher.ts source and eval the three arrays in a sandbox-ish way.
  // It's not ideal but avoids a shared-data refactor for a one-shot simulation.
  const src = readFileSync(resolve(__dirname, "./probe-matcher.ts"), "utf-8");
  // Find each array literal: `const BASIC: Case[] = [ ... ];`
  const grab = (name: string): Array<{ query: string; expectedIds: string[]; cat: string; tags?: string[] }> => {
    const m = src.match(new RegExp(`const ${name}: Case\\[\\] = (\\[[\\s\\S]*?\\n\\]);`, "m"));
    if (!m) throw new Error(`Could not find ${name} in probe-matcher.ts`);
    // eslint-disable-next-line no-new-func
    return new Function(`return ${m[1]}`)();
  };
  return { BASIC: grab("BASIC"), TRICKY: grab("TRICKY"), OOV: grab("OOV") };
}

interface Case {
  query: string;
  expectedIds: string[];
  cat: string;
  tags?: string[];
}

const allCases: Case[] = [...BASIC, ...TRICKY, ...OOV];

interface Result {
  c: Case;
  top: Array<{ id: string; name: string; score: number }>;
  top1Id: string | null;
  top1Score: number;
  isTP: boolean; // true only if expectedIds includes top-1 AND not OOV
  isFPforScored: boolean; // scored case but wrong top-1
  isOOV: boolean;
}

const results: Result[] = [];

for (const c of allCases) {
  const qTri = trigrams(normalize(c.query));
  const scored = catTrigrams
    .map((e) => ({ id: e.id, name: e.name, score: dice(qTri, e.tri) }))
    .sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3);
  const top1 = top[0] ?? { id: null as unknown as string, name: "", score: 0 };
  const isOOV = c.expectedIds.length === 0;
  const isTP = !isOOV && c.expectedIds.includes(top1.id);
  const isFPforScored = !isOOV && !isTP;
  results.push({
    c,
    top,
    top1Id: top1.id ?? null,
    top1Score: top1.score,
    isTP,
    isFPforScored,
    isOOV,
  });
}

// ─── Reporting ───

const pad = (s: string, n: number) => (s.length >= n ? s : s + " ".repeat(n - s.length));

const tps = results.filter((r) => r.isTP);
const fpScored = results.filter((r) => r.isFPforScored);
const oov = results.filter((r) => r.isOOV);

function histogram(scores: number[], bins = 20) {
  const counts = new Array<number>(bins).fill(0);
  for (const s of scores) {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor(s * bins)));
    counts[idx]++;
  }
  return counts;
}

function renderHist(label: string, scores: number[], bins = 20) {
  const counts = histogram(scores, bins);
  const max = Math.max(1, ...counts);
  console.log(`\n${label}  (n=${scores.length}, mean=${(scores.reduce((a, b) => a + b, 0) / (scores.length || 1)).toFixed(3)}, min=${Math.min(...scores).toFixed(3)}, max=${Math.max(...scores).toFixed(3)})`);
  for (let i = 0; i < bins; i++) {
    const lo = i / bins;
    const hi = (i + 1) / bins;
    const bar = "█".repeat(Math.round((counts[i] / max) * 40));
    console.log(`  [${lo.toFixed(2)}–${hi.toFixed(2)})  ${pad(String(counts[i]), 4)}  ${bar}`);
  }
}

console.log(`\n=== Dice trigram sim over ${allCases.length} probe queries ===`);
console.log(`TPs (scored, correct top-1 by Dice):        ${tps.length}`);
console.log(`FPs (scored, wrong top-1 by Dice):          ${fpScored.length}`);
console.log(`OOV (should not match confidently):         ${oov.length}`);

renderHist("TP top-1 Dice scores", tps.map((r) => r.top1Score));
renderHist("FP-scored top-1 Dice scores", fpScored.map((r) => r.top1Score));
renderHist("OOV top-1 Dice scores", oov.map((r) => r.top1Score));

// R@1 at Dice-only thresholds: fraction of scored cases where correct id
// is top-1 AND top-1 >= threshold. Below the threshold we "don't commit"
// and the Dice layer yields nothing — the hybrid would then fall back to cosine.
console.log("\nR@1 / OOV-FP rate at Dice-only thresholds:");
console.log("  thresh  TP-commit  FP-commit  OOV-commit  TP-rate");
for (let t = 0.2; t <= 0.95; t += 0.05) {
  const tpC = tps.filter((r) => r.top1Score >= t).length;
  const fpC = fpScored.filter((r) => r.top1Score >= t).length;
  const oovC = oov.filter((r) => r.top1Score >= t).length;
  const rate = (tpC / (tps.length + fpScored.length));
  console.log(`  ${t.toFixed(2)}    ${pad(String(tpC), 9)}  ${pad(String(fpC), 9)}  ${pad(String(oovC), 10)}  ${(rate * 100).toFixed(1)}%`);
}

// Per-tag TP rate at dice >= 0.5 (a reference point).
const allTags = Array.from(new Set(allCases.flatMap((c) => c.tags ?? []))).sort();
console.log("\nPer-tag Dice TP rate (where top-1 is correct by Dice alone):");
for (const tag of allTags) {
  const inTag = results.filter((r) => !r.isOOV && (r.c.tags ?? []).includes(tag));
  if (!inTag.length) continue;
  const correct = inTag.filter((r) => r.isTP).length;
  console.log(`  ${pad(tag, 14)}  ${pad(`${correct}/${inTag.length}`, 7)}  (${((correct / inTag.length) * 100).toFixed(0)}%)`);
}

// Where does cosine miss & Dice save? Emit the cases where Dice top-1 is correct
// so we can spot-check which tricky phenomena Dice handles well.
console.log("\nSample TPs by Dice (first 30 with tags):");
const taggedTPs = tps.filter((r) => r.c.tags?.length).slice(0, 30);
for (const r of taggedTPs) {
  console.log(`  ${pad(r.c.query, 22)} → ${r.top1Score.toFixed(3)}  [${pad(r.top1Id ?? "", 8)}]  ${r.top[0].name}  (${(r.c.tags ?? []).join(",")})`);
}

console.log("\nSample FPs by Dice (first 25 with tags):");
const taggedFPs = fpScored.filter((r) => r.c.tags?.length).slice(0, 25);
for (const r of taggedFPs) {
  console.log(`  ${pad(r.c.query, 22)} → ${r.top1Score.toFixed(3)}  [${pad(r.top1Id ?? "", 8)}]  ${r.top[0].name}  (${(r.c.tags ?? []).join(",")})  expected=${r.c.expectedIds.join("|")}`);
}
