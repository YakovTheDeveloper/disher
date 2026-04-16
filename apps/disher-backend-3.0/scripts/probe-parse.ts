/**
 * End-to-end probe: hits /api/free-text-food/parse with realistic voice
 * phrases and checks each expected product by ID. Prints summary + exits 1
 * if targets missed.
 *
 * Prerequisites:
 *   1. `npm run dev` running; wait for "Matcher ready: … vectors loaded."
 *   2. OPENROUTER_API_KEY set in server env.
 *
 * Usage: npx tsx scripts/probe-parse.ts [baseUrl]
 *   default baseUrl: http://localhost:3100
 *
 * Updated 2026-04-16 for consolidated catalog v2 (412 products, lowercase names).
 */

export {};

interface Expected {
  ids: string[];          // один из этих product IDs должен найтись (resolved или ambiguous top-3)
  qty?: number;           // ожидаемое количество в граммах (± 20%)
}

interface Phrase { text: string; expected: Expected[] }

const phrases: Phrase[] = [
  {
    text: "на завтрак овсянку с бананом, в обед борщ с хлебом",
    expected: [{ ids: ["sk-638"] }, { ids: ["sk-898"] }, { ids: ["20", "sk-624"] }],
  },
  { text: "утром творог с мёдом", expected: [{ ids: ["sk-78"] }, { ids: ["2128"] }] },
  { text: "съел яйцо варёное и бутерброд с сыром", expected: [{ ids: ["3775"] }, { ids: ["sk-145"] }] },
  {
    text: "помидор огурец сметана на обед",
    expected: [{ ids: ["sk-821"] }, { ids: ["897"] }, { ids: ["sk-73"] }],
  },
  {
    text: "гречка 200 грамм и куриная грудка",
    expected: [{ ids: ["2774"], qty: 200 }, { ids: ["7881"] }],
  },
  { text: "картошка с курицей вечером", expected: [{ ids: ["sk-746"] }, { ids: ["7881"] }] },
  { text: "кофе с молоком утром и йогурт", expected: [{ ids: ["4378"] }, { ids: ["3792", "sk-35"] }] },
  { text: "яблоко банан апельсин", expected: [{ ids: ["sk-880"] }, { ids: ["sk-898"] }, { ids: ["sk-890"] }] },
  { text: "макароны с сыром на ужин", expected: [{ ids: ["sk-561", "sk-554"] }, { ids: ["sk-145"] }] },
  { text: "рис с овощами в обед 300 грамм", expected: [{ ids: ["sk-644"], qty: 300 }] },
  { text: "смузи из банана с молоком утром", expected: [{ ids: ["sk-898"] }, { ids: ["sk-53"] }] },
  { text: "салат из помидоров с огурцами", expected: [{ ids: ["sk-821"] }, { ids: ["897"] }] },
  { text: "сыр и хлеб на завтрак", expected: [{ ids: ["sk-145"] }, { ids: ["20", "sk-624"] }] },

  // количества прописью
  { text: "творог двести грамм утром", expected: [{ ids: ["sk-78"], qty: 200 }] },
  {
    text: "гречка сто пятьдесят грамм и курица двести",
    expected: [{ ids: ["2774"], qty: 150 }, { ids: ["7881"], qty: 200 }],
  },
  { text: "рис триста грамм в обед", expected: [{ ids: ["sk-644"], qty: 300 }] },
  { text: "банан одна штука утром", expected: [{ ids: ["sk-898"] }] },
];

const baseUrl = process.argv[2] ?? "http://localhost:3100";
const MIN_RESOLVED = 0.70;
const MAX_UNRESOLVED = 0.15;
const MIN_ITEM_RECALL = 0.80;
const QTY_TOLERANCE = 0.20;
const CONCURRENCY = 1;
const TIMEOUT_MS = 30_000;

interface Candidate { id: string; name: string; score: number }
interface ResolvedItem { productId: string; name: string; originalName: string; quantity: number; time: string; confidence: number; note: string; quantityGuessed?: boolean }
interface AmbiguousItem { originalName: string; quantity: number; time: string; candidates: Candidate[]; note: string; quantityGuessed?: boolean }
interface UnresolvedItem { originalName: string; quantity: number; time: string; note: string; quantityGuessed?: boolean }
interface ParseResponse { resolved: ResolvedItem[]; ambiguous: AmbiguousItem[]; unresolved: UnresolvedItem[] }

async function parse(text: string): Promise<ParseResponse> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}/api/free-text-food/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ text }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json() as Promise<ParseResponse>;
  } finally {
    clearTimeout(timer);
  }
}

type HitPlace = "resolved" | "ambiguous" | "none";

function findExpected(r: ParseResponse, exp: Expected): { place: HitPlace; qty: number | null } {
  for (const item of r.resolved) {
    if (exp.ids.includes(item.productId)) return { place: "resolved", qty: item.quantity };
  }
  for (const item of r.ambiguous) {
    if (item.candidates.slice(0, 3).some((c) => exp.ids.includes(c.id))) {
      return { place: "ambiguous", qty: item.quantity };
    }
  }
  return { place: "none", qty: null };
}

function qtyOk(got: number | null, want: number | undefined): boolean | null {
  if (want === undefined) return null;
  if (got === null) return false;
  return Math.abs(got - want) / want <= QTY_TOLERANCE;
}

interface PhraseResult {
  phrase: string;
  error: string | null;
  latencyMs: number;
  counts: { resolved: number; ambiguous: number; unresolved: number };
  hits: Array<{ ids: string[]; place: HitPlace; qtyOk: boolean | null; got: number | null; want: number | undefined }>;
}

async function probePhrase(p: Phrase): Promise<PhraseResult> {
  const t0 = performance.now();
  try {
    const r = await parse(p.text);
    return {
      phrase: p.text,
      error: null,
      latencyMs: performance.now() - t0,
      counts: { resolved: r.resolved.length, ambiguous: r.ambiguous.length, unresolved: r.unresolved.length },
      hits: p.expected.map((e) => {
        const { place, qty } = findExpected(r, e);
        return { ids: e.ids, place, qtyOk: qtyOk(qty, e.qty), got: qty, want: e.qty };
      }),
    };
  } catch (err) {
    return {
      phrase: p.text,
      error: (err as Error).message,
      latencyMs: performance.now() - t0,
      counts: { resolved: 0, ambiguous: 0, unresolved: 0 },
      hits: [],
    };
  }
}

async function pool<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

const pad = (s: string, n: number) => (s.length >= n ? s : s + " ".repeat(n - s.length));

async function main() {
  console.log(`\n=== Probe /parse against ${baseUrl} ===\n`);
  const results = await pool(phrases, CONCURRENCY, probePhrase);

  let totalItems = 0, totalR = 0, totalA = 0, totalU = 0;
  let expectedCount = 0, hitCount = 0, qtyChecked = 0, qtyHit = 0;

  for (const r of results) {
    if (r.error) {
      console.log(`${pad(r.phrase, 60)} → ERROR: ${r.error}`);
      continue;
    }
    const items = r.counts.resolved + r.counts.ambiguous + r.counts.unresolved;
    totalItems += items;
    totalR += r.counts.resolved; totalA += r.counts.ambiguous; totalU += r.counts.unresolved;
    expectedCount += r.hits.length;
    hitCount += r.hits.filter((h) => h.place !== "none").length;
    qtyChecked += r.hits.filter((h) => h.qtyOk !== null).length;
    qtyHit += r.hits.filter((h) => h.qtyOk === true).length;

    const hitsStr = r.hits.filter((h) => h.place !== "none").length;
    console.log(`${pad(r.phrase, 60)} → R:${r.counts.resolved} A:${r.counts.ambiguous} U:${r.counts.unresolved}` +
      ` hits:${hitsStr}/${r.hits.length} ${r.latencyMs.toFixed(0)}ms`);
    for (const h of r.hits.filter((x) => x.place === "none")) {
      console.log(`     [MISS] expected ${h.ids.join("|")}`);
    }
    for (const h of r.hits.filter((x) => x.qtyOk === false)) {
      console.log(`     [QTY]  ${h.ids.join("|")}: got ${h.got}г, want ${h.want}г`);
    }
  }

  const errors = results.filter((r) => r.error).length;
  const latencies = results.filter((r) => !r.error).map((r) => r.latencyMs).sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;

  const resolvedPct = totalItems ? totalR / totalItems : 0;
  const unresolvedPct = totalItems ? totalU / totalItems : 0;
  const itemRecall = expectedCount ? hitCount / expectedCount : 0;
  const qtyAccuracy = qtyChecked ? qtyHit / qtyChecked : 1;

  console.log("\n=== Summary ===");
  console.log(`Phrases:        ${phrases.length}  (errors: ${errors})`);
  console.log(`Items total:    ${totalItems}`);
  console.log(`Resolved:       ${totalR}  (${(resolvedPct * 100).toFixed(1)}%)`);
  console.log(`Ambiguous:      ${totalA}  (${totalItems ? ((totalA / totalItems) * 100).toFixed(1) : "0.0"}%)`);
  console.log(`Unresolved:     ${totalU}  (${(unresolvedPct * 100).toFixed(1)}%)`);
  console.log(`Item recall:    ${(itemRecall * 100).toFixed(1)}%  (${hitCount}/${expectedCount})`);
  console.log(`Qty accuracy:   ${(qtyAccuracy * 100).toFixed(1)}%  (${qtyHit}/${qtyChecked} within ±${QTY_TOLERANCE * 100}%)`);
  console.log(`Latency:        p50 ${p50.toFixed(0)}ms  p95 ${p95.toFixed(0)}ms`);

  const pass = errors === 0
    && resolvedPct >= MIN_RESOLVED
    && unresolvedPct <= MAX_UNRESOLVED
    && itemRecall >= MIN_ITEM_RECALL;
  console.log(`\nTarget: resolved≥${MIN_RESOLVED}, unresolved≤${MAX_UNRESOLVED}, itemRecall≥${MIN_ITEM_RECALL} → ${pass ? "PASS ✓" : "FAIL ✗"}`);
  process.exit(pass ? 0 : 1);
}

await main();
