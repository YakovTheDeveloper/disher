/**
 * End-to-end probe for HEAD A ("infer recipe"): hits
 * /api/suggestions/dish-products with canonical dish names and checks that each
 * dish yields a sensible ingredient set (count, resolved ratio, key ingredients).
 *
 * This is the acceptance gate for Вариант Б — head A (does "борщ" give a
 * reasonable набор/граммы?) was never measured before. Key ingredients are
 * checked by NAME substring (matcher returns canonical lowercase catalog names),
 * so the probe needs no hand-maintained id map.
 *
 * Prerequisites:
 *   1. `npm run dev` running; wait for "Matcher ready: … vectors loaded."
 *   2. OPENROUTER_API_KEY set in server env.
 *
 * Usage: npx tsx scripts/probe-recipe.ts [baseUrl]
 *   default baseUrl: http://localhost:3100
 */

export {};

interface Dish {
  name: string;
  // Each inner slot = one key ingredient, any of the substrings counts as a hit.
  // Checked against the union of resolved + ambiguous(top-3) catalog names.
  key: string[][];
}

const dishes: Dish[] = [
  { name: "борщ", key: [["свекл"], ["капуст"], ["картоф", "картош"], ["морков"]] },
  { name: "оливье", key: [["картоф"], ["морков"], ["яйц"], ["горош", "горошек"]] },
  { name: "омлет", key: [["яйц"], ["молок"]] },
  { name: "плов", key: [["рис"], ["морков"], ["лук"]] },
  { name: "винегрет", key: [["свекл"], ["картоф"], ["морков"]] },
  { name: "греческий салат", key: [["помидор", "томат"], ["огурец", "огурц"]] },
  { name: "цезарь", key: [["кур"], ["сухар", "хлеб", "крутон"], ["сыр", "пармезан"]] },
  { name: "окрошка", key: [["огурец", "огурц"], ["картоф"], ["яйц"]] },
];

const baseUrl = process.argv[2] ?? "http://localhost:3100";
const MIN_AVG_INGREDIENTS = 5;
const MIN_RESOLVED_PCT = 0.5;
const MIN_KEY_RECALL = 0.6;
const TIMEOUT_MS = 40_000;

interface Candidate { id: string; name: string; score: number }
interface ResolvedItem { productId: string; name: string; originalName: string; quantity: number }
interface AmbiguousItem { originalName: string; candidates: Candidate[] }
interface UnresolvedItem { originalName: string }
interface ParseResponse {
  resolved: ResolvedItem[];
  ambiguous: AmbiguousItem[];
  unresolved: UnresolvedItem[];
}

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е");

async function suggest(dishName: string): Promise<ParseResponse> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}/api/suggestions/dish-products`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ dishName }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json() as Promise<ParseResponse>;
  } finally {
    clearTimeout(timer);
  }
}

// Names visible to the user (resolved exactly + ambiguous top-3 candidates).
function visibleNames(r: ParseResponse): string[] {
  const names = r.resolved.map((i) => i.name);
  for (const a of r.ambiguous) names.push(...a.candidates.slice(0, 3).map((c) => c.name));
  return names.map(norm);
}

const pad = (s: string, n: number) => (s.length >= n ? s : s + " ".repeat(n - s.length));

interface DishResult {
  name: string;
  error: string | null;
  latencyMs: number;
  total: number;
  resolved: number;
  ambiguous: number;
  unresolved: number;
  keyHit: number;
  keyTotal: number;
  resolvedNames: string[];
  missedKeys: string[];
}

async function probeDish(d: Dish): Promise<DishResult> {
  const t0 = performance.now();
  try {
    const r = await suggest(d.name);
    const total = r.resolved.length + r.ambiguous.length + r.unresolved.length;
    const visible = visibleNames(r);
    let keyHit = 0;
    const missedKeys: string[] = [];
    for (const slot of d.key) {
      const hit = slot.some((sub) => visible.some((n) => n.includes(norm(sub))));
      if (hit) keyHit++;
      else missedKeys.push(slot[0]);
    }
    return {
      name: d.name,
      error: null,
      latencyMs: performance.now() - t0,
      total,
      resolved: r.resolved.length,
      ambiguous: r.ambiguous.length,
      unresolved: r.unresolved.length,
      keyHit,
      keyTotal: d.key.length,
      resolvedNames: r.resolved.map((i) => `${i.name} ${i.quantity}г`),
      missedKeys,
    };
  } catch (err) {
    return {
      name: d.name,
      error: (err as Error).message,
      latencyMs: performance.now() - t0,
      total: 0,
      resolved: 0,
      ambiguous: 0,
      unresolved: 0,
      keyHit: 0,
      keyTotal: d.key.length,
      resolvedNames: [],
      missedKeys: d.key.map((s) => s[0]),
    };
  }
}

async function main() {
  console.log(`\n=== Probe /suggestions/dish-products (head A) against ${baseUrl} ===\n`);

  const results: DishResult[] = [];
  for (const d of dishes) results.push(await probeDish(d)); // serial — recipe = N matcher calls

  let totalItems = 0, totalR = 0, totalA = 0, totalU = 0, keyHit = 0, keyTotal = 0;
  for (const r of results) {
    if (r.error) {
      console.log(`${pad(r.name, 18)} → ERROR: ${r.error}`);
      continue;
    }
    totalItems += r.total;
    totalR += r.resolved; totalA += r.ambiguous; totalU += r.unresolved;
    keyHit += r.keyHit; keyTotal += r.keyTotal;
    console.log(
      `${pad(r.name, 18)} → n:${r.total} R:${r.resolved} A:${r.ambiguous} U:${r.unresolved}` +
      ` key:${r.keyHit}/${r.keyTotal} ${r.latencyMs.toFixed(0)}ms`,
    );
    console.log(`     ${r.resolvedNames.join(", ") || "(no resolved)"}`);
    if (r.missedKeys.length) console.log(`     [MISS key] ${r.missedKeys.join(", ")}`);
  }

  const errors = results.filter((r) => r.error).length;
  const ok = results.filter((r) => !r.error);
  const avgIngredients = ok.length ? totalItems / ok.length : 0;
  const resolvedPct = totalItems ? totalR / totalItems : 0;
  const keyRecall = keyTotal ? keyHit / keyTotal : 0;

  console.log("\n=== Summary ===");
  console.log(`Dishes:          ${dishes.length}  (errors: ${errors})`);
  console.log(`Avg ingredients: ${avgIngredients.toFixed(1)}`);
  console.log(`Resolved:        ${totalR}/${totalItems}  (${(resolvedPct * 100).toFixed(1)}%)`);
  console.log(`Ambiguous:       ${totalA}   Unresolved: ${totalU}`);
  console.log(`Key recall:      ${(keyRecall * 100).toFixed(1)}%  (${keyHit}/${keyTotal})`);

  const pass = errors === 0
    && avgIngredients >= MIN_AVG_INGREDIENTS
    && resolvedPct >= MIN_RESOLVED_PCT
    && keyRecall >= MIN_KEY_RECALL;
  console.log(
    `\nTarget: avgIngredients≥${MIN_AVG_INGREDIENTS}, resolved≥${MIN_RESOLVED_PCT}, ` +
    `keyRecall≥${MIN_KEY_RECALL} → ${pass ? "PASS ✓" : "FAIL ✗"}`,
  );
  process.exit(pass ? 0 : 1);
}

await main();
