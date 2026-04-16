/**
 * Aggregates logs/matcher-queries.jsonl to surface mining candidates.
 *
 * Outputs three lists:
 *   1. UNRESOLVED — user said something, nothing matched confidently.
 *      → candidates for catalog expansion or new aliases.
 *   2. AMBIGUOUS  — two+ close matches, system asked user to disambiguate.
 *      → candidates for alias (if pattern is consistent) or re-ranking.
 *   3. LOW-MARGIN RESOLVED — auto-resolved but only just. Brittle.
 *      → sanity check the pick; if wrong, add alias for the correct ID.
 *
 * Workflow:
 *   1. Let the system run. Logs accumulate.
 *   2. Every quarter (or on demand):
 *        npx tsx scripts/mine-queries.ts
 *   3. Pick top offenders, decide: new alias, catalog change, or promote to
 *      probe-matcher.ts tricky set.
 *
 * Usage:
 *   npx tsx scripts/mine-queries.ts              # full report
 *   npx tsx scripts/mine-queries.ts --top=30     # show top 30 per list
 *   npx tsx scripts/mine-queries.ts --since=7d   # only entries from last N days (d/h)
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_PATH = resolve(__dirname, "../logs/matcher-queries.jsonl");

interface LogEntry {
  ts: string;
  phrase: string;
  originalName: string;
  verdict: "alias" | "resolved" | "ambiguous" | "unresolved";
  top: Array<{ id: string; name: string; score: number }>;
  margin: number | null;
}

const argv = process.argv.slice(2);
const topArg = argv.find((a) => a.startsWith("--top="))?.split("=")[1];
const TOP = topArg ? parseInt(topArg, 10) : 20;
const sinceArg = argv.find((a) => a.startsWith("--since="))?.split("=")[1];

// Low-margin threshold — if top1-top2 < this, resolve is shaky.
const LOW_MARGIN_THRESHOLD = 0.015;

function parseSince(s: string | undefined): number | null {
  if (!s) return null;
  const m = s.match(/^(\d+)([dh])$/);
  if (!m) throw new Error(`--since must be like "7d" or "24h", got "${s}"`);
  const n = parseInt(m[1], 10);
  const unit = m[2] === "d" ? 24 * 3600 * 1000 : 3600 * 1000;
  return Date.now() - n * unit;
}

const sinceMs = parseSince(sinceArg);

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

const pad = (s: string, n: number) => (s.length >= n ? s : s + " ".repeat(n - s.length));

function main() {
  if (!existsSync(LOG_PATH)) {
    console.log(`No log file at ${LOG_PATH}`);
    console.log("Hit /api/free-text-food/parse to generate logs, then re-run.");
    process.exit(0);
  }

  const lines = readFileSync(LOG_PATH, "utf-8").split("\n").filter(Boolean);
  const entries: LogEntry[] = [];
  for (const line of lines) {
    try {
      const e = JSON.parse(line) as LogEntry;
      if (sinceMs && new Date(e.ts).getTime() < sinceMs) continue;
      entries.push(e);
    } catch {
      // skip malformed lines
    }
  }

  console.log(`\n=== Mining ${entries.length} log entries${sinceMs ? ` (since ${sinceArg})` : ""} ===\n`);

  const byVerdict = { alias: 0, resolved: 0, ambiguous: 0, unresolved: 0 };
  for (const e of entries) byVerdict[e.verdict]++;
  const total = entries.length || 1;
  console.log("Verdict distribution:");
  for (const [k, v] of Object.entries(byVerdict)) {
    console.log(`  ${pad(k, 12)} ${v}  (${((v / total) * 100).toFixed(1)}%)`);
  }

  // ─── 1. UNRESOLVED: most frequent things we couldn't match ───
  const unresolvedCounts = new Map<string, { count: number; samplePhrases: Set<string>; bestScore: number }>();
  for (const e of entries) {
    if (e.verdict !== "unresolved") continue;
    const key = normalize(e.originalName);
    const entry = unresolvedCounts.get(key) ?? { count: 0, samplePhrases: new Set(), bestScore: 0 };
    entry.count++;
    if (entry.samplePhrases.size < 3) entry.samplePhrases.add(e.phrase);
    if (e.top[0] && e.top[0].score > entry.bestScore) entry.bestScore = e.top[0].score;
    unresolvedCounts.set(key, entry);
  }

  const unresolvedTop = [...unresolvedCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, TOP);

  console.log(`\n=== Top ${unresolvedTop.length} UNRESOLVED (needs alias or catalog entry) ===\n`);
  for (const [name, { count, bestScore }] of unresolvedTop) {
    console.log(`  ${pad(String(count), 4)} ${pad(name, 30)}  best top-1 score: ${bestScore.toFixed(3)}`);
  }

  // ─── 2. AMBIGUOUS: user had to choose; if the correct answer repeats, alias it ───
  const ambiguousCounts = new Map<string, { count: number; topCandidates: Map<string, { name: string; n: number }> }>();
  for (const e of entries) {
    if (e.verdict !== "ambiguous") continue;
    const key = normalize(e.originalName);
    const entry = ambiguousCounts.get(key) ?? { count: 0, topCandidates: new Map() };
    entry.count++;
    for (const t of e.top.slice(0, 3)) {
      const cand = entry.topCandidates.get(t.id) ?? { name: t.name, n: 0 };
      cand.n++;
      entry.topCandidates.set(t.id, cand);
    }
    ambiguousCounts.set(key, entry);
  }

  const ambiguousTop = [...ambiguousCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, TOP);

  console.log(`\n=== Top ${ambiguousTop.length} AMBIGUOUS (candidates for alias if one ID dominates) ===\n`);
  for (const [name, { count, topCandidates }] of ambiguousTop) {
    const cands = [...topCandidates.entries()]
      .sort((a, b) => b[1].n - a[1].n)
      .slice(0, 3)
      .map(([id, v]) => `[${id}] ${v.name} ×${v.n}`)
      .join("  |  ");
    console.log(`  ${pad(String(count), 4)} ${pad(name, 30)}  ${cands}`);
  }

  // ─── 3. LOW-MARGIN RESOLVED: auto-resolved but with razor-thin margin ───
  const lowMarginCounts = new Map<string, { count: number; winnerId: string; winnerName: string; runnerUpId: string; runnerUpName: string; avgMargin: number; marginSum: number }>();
  for (const e of entries) {
    if (e.verdict !== "resolved") continue;
    if (e.margin === null || e.margin >= LOW_MARGIN_THRESHOLD) continue;
    const key = normalize(e.originalName);
    const t0 = e.top[0], t1 = e.top[1];
    if (!t0 || !t1) continue;
    const entry = lowMarginCounts.get(key) ?? {
      count: 0, winnerId: t0.id, winnerName: t0.name,
      runnerUpId: t1.id, runnerUpName: t1.name,
      avgMargin: 0, marginSum: 0,
    };
    entry.count++;
    entry.marginSum += e.margin;
    entry.avgMargin = entry.marginSum / entry.count;
    lowMarginCounts.set(key, entry);
  }

  const lowMarginTop = [...lowMarginCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, TOP);

  console.log(`\n=== Top ${lowMarginTop.length} LOW-MARGIN RESOLVED (margin < ${LOW_MARGIN_THRESHOLD}) ===\n`);
  for (const [name, v] of lowMarginTop) {
    console.log(`  ${pad(String(v.count), 4)} ${pad(name, 30)}  margin avg ${v.avgMargin.toFixed(3)}`);
    console.log(`        won:  [${v.winnerId}] ${v.winnerName}`);
    console.log(`        vs:   [${v.runnerUpId}] ${v.runnerUpName}`);
  }

  console.log("\n=== Suggested actions ===");
  console.log("  1. Pick repeated UNRESOLVED → add to data/food-aliases.json or catalog.");
  console.log("  2. Pick repeated AMBIGUOUS with a clear winner → add to aliases.");
  console.log("  3. Review LOW-MARGIN RESOLVED — if the pick is wrong, add an alias forcing the correct ID.");
  console.log("  4. After changes, re-run: npm run probe:matcher to verify no regression.");
}

main();
