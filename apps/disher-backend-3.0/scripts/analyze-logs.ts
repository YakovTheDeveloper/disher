/**
 * Weekly log-analysis report.
 *
 * Consumes three log streams:
 *   logs/matcher-queries.jsonl              — per-item matcher verdicts (E1)
 *   logs/llm-output-YYYY-MM-DD.jsonl        — per-request LLM outputs (E3)
 *   data/telemetry/YYYY-MM-DD.jsonl         — per-request client telemetry (E2)
 *
 * Produces a markdown report at data/reports/YYYY-WW.md with four sections:
 *   1. Matcher quality — top corrections, verdict distribution, score buckets, stale aliases
 *   2. Missing-from-catalog candidates — top unresolved queries, clustered
 *   3. LLM patterns — hallucination rate, zero-quantity cases, item count, average cost
 *   4. User behaviour — review duration, drop-off, abandon rate
 *
 * Usage:
 *   npx tsx scripts/analyze-logs.ts                # last 7 days
 *   npx tsx scripts/analyze-logs.ts --since=14d    # last N days
 *   npx tsx scripts/analyze-logs.ts --top=30       # top-N entries per list
 *   npx tsx scripts/analyze-logs.ts --out=path.md  # custom output path
 */

import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = resolve(__dirname, "..");
const MATCHER_LOG = resolve(BACKEND_ROOT, "logs/matcher-queries.jsonl");
const LLM_LOG_DIR = resolve(BACKEND_ROOT, "logs");
const TELEMETRY_DIR = resolve(BACKEND_ROOT, "data/telemetry");
const REPORTS_DIR = resolve(BACKEND_ROOT, "data/reports");

// ─── CLI args ───

const argv = process.argv.slice(2);
const sinceArg = argv.find((a) => a.startsWith("--since="))?.split("=")[1] ?? "7d";
const topArg = argv.find((a) => a.startsWith("--top="))?.split("=")[1];
const outArg = argv.find((a) => a.startsWith("--out="))?.split("=")[1];
const TOP = topArg ? parseInt(topArg, 10) : 20;

function parseSince(s: string): number {
  const match = s.match(/^(\d+)([dh])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const n = parseInt(match[1], 10);
  return match[2] === "d" ? n * 24 * 60 * 60 * 1000 : n * 60 * 60 * 1000;
}

const WINDOW_MS = parseSince(sinceArg);
const CUTOFF = Date.now() - WINDOW_MS;

// ─── Types ───

interface MatcherEntry {
  ts: string;
  requestId?: string;
  phrase: string;
  originalName: string;
  llmNote?: string;
  llmQuantity?: number | null;
  llmTime?: string | null;
  normalizedName?: string;
  verdict: "alias" | "resolved" | "ambiguous" | "unresolved";
  top: Array<{ id: string; name: string; score: number }>;
  margin: number | null;
  scoreBreakdown?: { trigram?: number; cosine?: number; hybrid?: number; levenshtein?: number };
  aliasHit?: boolean;
  matcherVersion?: string;
  llmModel?: string;
}

interface LLMEntry {
  ts: string;
  requestId: string;
  model: string;
  phrase: string;
  itemsReturned: Array<{ name: string; note?: string; quantity: number | null; time: string | null }>;
  cached: boolean;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalCost?: number;
}

interface TelemetryEntry {
  ts: string;
  requestId: string;
  userId: string;
  action: "commit" | "abandon";
  itemsTotal: number;
  itemsCommitted: number;
  itemsDeleted: number;
  itemsWithEditedFood: number;
  itemsWithEditedTime: number;
  itemsWithEditedQty: number;
  corrections: Array<{
    originalName: string;
    matcherChoice: string;
    userChoice: string | null;
    correctionType: "accepted-top1" | "switched-ambiguous" | "manual-search" | "deleted";
  }>;
  llmLatencyMs: number;
  matcherLatencyMs: number;
  reviewDurationMs: number;
}

// ─── Readers ───

function readJsonl<T>(path: string, cutoffMs: number): T[] {
  if (!existsSync(path)) return [];
  const lines = readFileSync(path, "utf-8").split("\n").filter(Boolean);
  const out: T[] = [];
  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as T & { ts?: string };
      if (entry.ts && new Date(entry.ts).getTime() < cutoffMs) continue;
      out.push(entry);
    } catch {
      // skip malformed line
    }
  }
  return out;
}

function readMatcherLogs(): MatcherEntry[] {
  return readJsonl<MatcherEntry>(MATCHER_LOG, CUTOFF);
}

function readLLMLogs(): LLMEntry[] {
  if (!existsSync(LLM_LOG_DIR)) return [];
  const files = readdirSync(LLM_LOG_DIR).filter((f) => f.startsWith("llm-output-") && f.endsWith(".jsonl"));
  const out: LLMEntry[] = [];
  for (const f of files) out.push(...readJsonl<LLMEntry>(resolve(LLM_LOG_DIR, f), CUTOFF));
  return out;
}

function readTelemetryLogs(): TelemetryEntry[] {
  if (!existsSync(TELEMETRY_DIR)) return [];
  const files = readdirSync(TELEMETRY_DIR).filter((f) => f.endsWith(".jsonl"));
  const out: TelemetryEntry[] = [];
  for (const f of files) out.push(...readJsonl<TelemetryEntry>(resolve(TELEMETRY_DIR, f), CUTOFF));
  return out;
}

// ─── Utilities ───

function trigrams(s: string): Set<string> {
  const padded = `  ${s}  `;
  const out = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) out.add(padded.slice(i, i + 3));
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / (a.size + b.size - inter);
}

function formatPct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

function formatMs(n: number): string {
  return n < 1000 ? `${n}ms` : `${(n / 1000).toFixed(1)}s`;
}

function topN<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ─── Section 1: Matcher quality ───

function section1(matchers: MatcherEntry[], telemetry: TelemetryEntry[]): string {
  const lines: string[] = ["## 1. Matcher quality", ""];

  // Verdict distribution
  const verdictCount: Record<string, number> = { alias: 0, resolved: 0, ambiguous: 0, unresolved: 0 };
  for (const m of matchers) verdictCount[m.verdict] = (verdictCount[m.verdict] ?? 0) + 1;
  const total = matchers.length || 1;
  lines.push("### Verdict distribution");
  lines.push("");
  lines.push("| Verdict | Count | Share |");
  lines.push("|---|---|---|");
  for (const v of ["alias", "resolved", "ambiguous", "unresolved"] as const) {
    lines.push(`| ${v} | ${verdictCount[v]} | ${formatPct(verdictCount[v] / total)} |`);
  }
  lines.push("");

  // Top corrections from telemetry
  const corrCounter = new Map<string, { original: string; matcher: string; user: string; count: number }>();
  for (const t of telemetry) {
    for (const c of t.corrections) {
      if (c.correctionType === "accepted-top1" || c.correctionType === "deleted") continue;
      if (!c.userChoice) continue;
      const key = `${c.originalName}||${c.matcherChoice}||${c.userChoice}`;
      const prev = corrCounter.get(key);
      if (prev) prev.count += 1;
      else
        corrCounter.set(key, {
          original: c.originalName,
          matcher: c.matcherChoice,
          user: c.userChoice,
          count: 1,
        });
    }
  }
  const topCorrections = [...corrCounter.values()].sort((a, b) => b.count - a.count);
  lines.push(`### Top-${TOP} corrections (matcherChoice ≠ userChoice)`);
  lines.push("");
  if (topCorrections.length === 0) {
    lines.push("_Нет корректировок в окне._");
  } else {
    lines.push("| # | Original | Matcher → | User → | Count |");
    lines.push("|---|---|---|---|---|");
    topN(topCorrections, TOP).forEach((c, i) => {
      lines.push(`| ${i + 1} | ${c.original} | ${c.matcher} | ${c.user} | ${c.count} |`);
    });
  }
  lines.push("");

  // Score buckets for resolved
  const resolvedMatchers = matchers.filter((m) => m.verdict === "resolved" && m.top[0]);
  const buckets = [
    { label: "0.70-0.80", lo: 0.7, hi: 0.8, count: 0 },
    { label: "0.80-0.90", lo: 0.8, hi: 0.9, count: 0 },
    { label: "0.90-1.00", lo: 0.9, hi: 1.001, count: 0 },
  ];
  for (const m of resolvedMatchers) {
    const s = m.top[0].score;
    for (const b of buckets) if (s >= b.lo && s < b.hi) b.count += 1;
  }
  lines.push("### Score distribution for resolved verdict");
  lines.push("");
  lines.push("| Bucket | Count |");
  lines.push("|---|---|");
  for (const b of buckets) lines.push(`| ${b.label} | ${b.count} |`);
  lines.push("");

  // Stale aliases
  const aliasHitNames = new Set<string>();
  for (const m of matchers) if (m.verdict === "alias") aliasHitNames.add(m.originalName.toLowerCase());
  lines.push(`### Alias hit coverage`);
  lines.push("");
  lines.push(`- Distinct aliases triggered in window: ${aliasHitNames.size}`);
  lines.push(`- Total alias hits: ${verdictCount.alias}`);
  lines.push("");

  return lines.join("\n");
}

// ─── Section 2: Missing-from-catalog candidates ───

function section2(matchers: MatcherEntry[]): string {
  const lines: string[] = ["## 2. Missing-from-catalog candidates", ""];

  const unresolved = matchers.filter((m) => m.verdict === "unresolved");
  const counter = new Map<string, number>();
  for (const m of unresolved) {
    const key = (m.normalizedName ?? m.originalName).toLowerCase().trim();
    counter.set(key, (counter.get(key) ?? 0) + 1);
  }

  // Cluster by Jaccard on trigrams.
  const entries = [...counter.entries()].sort((a, b) => b[1] - a[1]);
  interface Cluster {
    lead: string;
    total: number;
    variants: string[];
    trigrams: Set<string>;
  }
  const clusters: Cluster[] = [];
  for (const [name, count] of entries) {
    const tri = trigrams(name);
    const match = clusters.find((c) => jaccard(c.trigrams, tri) >= 0.5);
    if (match) {
      match.total += count;
      match.variants.push(`${name} (${count})`);
    } else {
      clusters.push({ lead: name, total: count, variants: [`${name} (${count})`], trigrams: tri });
    }
  }
  clusters.sort((a, b) => b.total - a.total);

  lines.push(`### Top-${TOP} unresolved query clusters`);
  lines.push("");
  if (clusters.length === 0) {
    lines.push("_Unresolved queries не встречались в окне._");
  } else {
    lines.push("| # | Lead | Total hits | Variants |");
    lines.push("|---|---|---|---|");
    topN(clusters, TOP).forEach((c, i) => {
      const variants = c.variants.length > 3 ? c.variants.slice(0, 3).join(", ") + ", …" : c.variants.join(", ");
      lines.push(`| ${i + 1} | ${c.lead} | ${c.total} | ${variants} |`);
    });
  }
  lines.push("");
  lines.push("_USDA auto-lookup пока не реализован — добавьте `--usda` флаг в следующей итерации для автоподтягивания FDC ID._");
  lines.push("");

  return lines.join("\n");
}

// ─── Section 3: LLM patterns ───

function section3(matchers: MatcherEntry[], llm: LLMEntry[]): string {
  const lines: string[] = ["## 3. LLM patterns", ""];

  const totalRequests = llm.length || 1;
  const cached = llm.filter((l) => l.cached).length;
  const emptyItems = llm.filter((l) => l.itemsReturned.length === 0).length;
  const itemCounts = llm.map((l) => l.itemsReturned.length);
  const costs = llm.map((l) => l.totalCost).filter((c): c is number => typeof c === "number");

  lines.push("### Summary");
  lines.push("");
  lines.push(`- Requests: ${llm.length}`);
  lines.push(`- Cached: ${cached} (${formatPct(cached / totalRequests)})`);
  lines.push(`- Empty output: ${emptyItems} (${formatPct(emptyItems / totalRequests)})`);
  lines.push(`- Avg itemsReturned: ${mean(itemCounts).toFixed(2)}`);
  lines.push(`- Median itemsReturned: ${median(itemCounts).toFixed(0)}`);
  if (costs.length > 0) {
    lines.push(`- Mean cost per request: $${mean(costs).toFixed(5)}`);
    lines.push(`- Total cost in window: $${costs.reduce((a, b) => a + b, 0).toFixed(3)}`);
  } else {
    lines.push(`- Cost: _недоступно в usage (проверьте OpenRouter headers)_`);
  }
  lines.push("");

  // Hallucinations: LLM returns a name that ends up unresolved
  let hallucinations = 0;
  let hallucinationsTotal = 0;
  for (const m of matchers) {
    hallucinationsTotal += 1;
    if (m.verdict === "unresolved") hallucinations += 1;
  }
  lines.push("### Hallucination rate (proxy)");
  lines.push("");
  lines.push(`- Unresolved names / total names: ${hallucinations}/${hallucinationsTotal} = ${formatPct(hallucinations / (hallucinationsTotal || 1))}`);
  lines.push(`- _Proxy: treats unresolved as potential LLM hallucinations. Refine by cross-checking against catalog._`);
  lines.push("");

  // Zero-quantity cases
  const zeroQty = matchers.filter((m) => m.llmQuantity === 0).length;
  lines.push("### Zero-quantity LLM responses");
  lines.push("");
  lines.push(`- Count: ${zeroQty} (${formatPct(zeroQty / (matchers.length || 1))})`);
  lines.push(`- _Эти кейсы получают QUANTITY_FALLBACK_G=100. Если процент высок — правка системного промпта._`);
  lines.push("");

  return lines.join("\n");
}

// ─── Section 4: User behaviour ───

function section4(telemetry: TelemetryEntry[]): string {
  const lines: string[] = ["## 4. User behaviour", ""];

  if (telemetry.length === 0) {
    lines.push("_Telemetry не поступала в окне. Убедитесь, что фронт шлёт POST на /api/matcher-telemetry._");
    lines.push("");
    return lines.join("\n");
  }

  const commits = telemetry.filter((t) => t.action === "commit");
  const abandons = telemetry.filter((t) => t.action === "abandon");
  const reviewDurations = telemetry.map((t) => t.reviewDurationMs).filter((d) => d > 0);
  const matcherLatencies = telemetry.map((t) => t.matcherLatencyMs).filter((d) => d > 0);

  lines.push("### Flow outcomes");
  lines.push("");
  lines.push(`- Total telemetry events: ${telemetry.length}`);
  lines.push(`- Commits: ${commits.length} (${formatPct(commits.length / telemetry.length)})`);
  lines.push(`- Abandons: ${abandons.length} (${formatPct(abandons.length / telemetry.length)})`);
  lines.push("");

  lines.push("### Timing");
  lines.push("");
  lines.push(`- Median review duration: ${formatMs(median(reviewDurations))}`);
  lines.push(`- P90 review duration: ${formatMs(percentile(reviewDurations, 0.9))}`);
  lines.push(`- Median matcher latency: ${formatMs(median(matcherLatencies))}`);
  lines.push("");

  // Edit ratios
  const totalItems = telemetry.reduce((sum, t) => sum + t.itemsTotal, 0) || 1;
  const editedFood = telemetry.reduce((sum, t) => sum + t.itemsWithEditedFood, 0);
  const editedTime = telemetry.reduce((sum, t) => sum + t.itemsWithEditedTime, 0);
  const editedQty = telemetry.reduce((sum, t) => sum + t.itemsWithEditedQty, 0);
  const deleted = telemetry.reduce((sum, t) => sum + t.itemsDeleted, 0);
  lines.push("### Edit ratios (% of total items)");
  lines.push("");
  lines.push(`- Food edited: ${editedFood} (${formatPct(editedFood / totalItems)})`);
  lines.push(`- Time edited: ${editedTime} (${formatPct(editedTime / totalItems)})`);
  lines.push(`- Quantity edited: ${editedQty} (${formatPct(editedQty / totalItems)})`);
  lines.push(`- Deleted: ${deleted} (${formatPct(deleted / totalItems)})`);
  lines.push("");

  return lines.join("\n");
}

function percentile(nums: number[], p: number): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx];
}

// ─── Output path ───

function weeklyReportPath(): string {
  if (outArg) return resolve(process.cwd(), outArg);
  const d = new Date();
  const year = d.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(
    ((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getUTCDay() + 1) / 7,
  );
  return resolve(REPORTS_DIR, `${year}-W${String(week).padStart(2, "0")}.md`);
}

// ─── Main ───

function main() {
  const matchers = readMatcherLogs();
  const llm = readLLMLogs();
  const telemetry = readTelemetryLogs();

  const header = [
    `# Log analysis report`,
    "",
    `- Generated: ${new Date().toISOString()}`,
    `- Window: last ${sinceArg} (cutoff ${new Date(CUTOFF).toISOString()})`,
    `- Matcher entries: ${matchers.length}`,
    `- LLM entries: ${llm.length}`,
    `- Telemetry entries: ${telemetry.length}`,
    "",
  ].join("\n");

  const body = [
    header,
    section1(matchers, telemetry),
    section2(matchers),
    section3(matchers, llm),
    section4(telemetry),
  ].join("\n");

  const outPath = weeklyReportPath();
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, body, "utf-8");
  console.log(`Wrote report: ${outPath}`);
  console.log(`Sections: matcher quality, missing catalog, LLM patterns, user behaviour`);
}

main();
