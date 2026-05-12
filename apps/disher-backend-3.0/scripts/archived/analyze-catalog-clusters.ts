/**
 * F1 — Аудит остаточных кластеров каталога.
 *
 * Группирует продукты из combined-foods-final.json по trigram-similarity > 0.6
 * (Dice over char-trigrams нормализованного name). Выводит:
 *   - кластеры размером ≥ 2
 *   - дельту нутриентов (kcal=id 3, protein=1, fat=2, carb=4) к base
 *   - merge-вердикт: SAFE (delta ≤ 15%) | WARN (delta ≤ 35%) | SKIP (>35%)
 *
 * Также пишет машинно-читаемый JSON-отчёт data/catalog-clusters-audit.json
 * для последующего F2.
 *
 * Usage: npx tsx scripts/analyze-catalog-clusters.ts [--threshold 0.6]
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

interface Product {
  id: string;
  name: string;
  source?: string;
  categories: string[];
  nutrients: Record<string, number>;
}

const NUTRIENT_LABELS: Record<string, string> = {
  "1": "protein",
  "2": "fat",
  "3": "kcal",
  "4": "carb",
};

const SOURCE_PATH = resolve(root, "seed", "combined-foods-final.json");
const MAPPING_PATH = resolve(root, "data", "catalog-mapping.json");
const OUT_PATH = resolve(root, "data", "catalog-clusters-audit.json");

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

class UnionFind {
  parent: number[];
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
  }
  find(x: number): number {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }
  union(a: number, b: number) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent[rb] = ra;
  }
}

interface NutrientDelta {
  nutrient: string;
  base: number;
  variant: number;
  pctDelta: number;
}

function computeDeltas(base: Product, variant: Product): NutrientDelta[] {
  const out: NutrientDelta[] = [];
  for (const id of Object.keys(NUTRIENT_LABELS)) {
    const b = base.nutrients[id];
    const v = variant.nutrients[id];
    if (b == null || v == null || b === 0) continue;
    const pct = ((v - b) / b) * 100;
    out.push({
      nutrient: NUTRIENT_LABELS[id],
      base: b,
      variant: v,
      pctDelta: Math.round(pct * 10) / 10,
    });
  }
  return out;
}

function maxAbsDelta(deltas: NutrientDelta[]): number {
  if (deltas.length === 0) return 0;
  return Math.max(...deltas.map((d) => Math.abs(d.pctDelta)));
}

function verdict(maxDelta: number): "SAFE" | "WARN" | "SKIP" {
  if (maxDelta <= 15) return "SAFE";
  if (maxDelta <= 35) return "WARN";
  return "SKIP";
}

interface ClusterReport {
  size: number;
  baseId: string;
  baseName: string;
  baseCategories: string[];
  variants: Array<{
    id: string;
    name: string;
    categories: string[];
    triSim: number;
    deltas: NutrientDelta[];
    maxAbsDelta: number;
    verdict: "SAFE" | "WARN" | "SKIP";
  }>;
  overallMaxDelta: number;
  overallVerdict: "SAFE" | "WARN" | "SKIP";
}

function main() {
  const threshold = (() => {
    const idx = process.argv.indexOf("--threshold");
    if (idx >= 0 && process.argv[idx + 1]) return Number(process.argv[idx + 1]);
    return 0.6;
  })();

  const products: Product[] = JSON.parse(readFileSync(SOURCE_PATH, "utf-8"));
  const mapping = JSON.parse(readFileSync(MAPPING_PATH, "utf-8"));
  const alreadyMerged = new Set<string>(
    (mapping.merged_clusters ?? []).map((c: { base_id: string }) => c.base_id)
  );

  console.log(`Loaded ${products.length} products. Threshold = ${threshold}`);

  const tris = products.map((p) => trigrams(normalize(p.name)));
  const uf = new UnionFind(products.length);

  // Pairwise comparison — O(n²) but n=412, ~85k pairs, fast.
  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const sim = dice(tris[i], tris[j]);
      if (sim >= threshold) uf.union(i, j);
    }
  }

  // Bucket by root.
  const buckets = new Map<number, number[]>();
  for (let i = 0; i < products.length; i++) {
    const r = uf.find(i);
    const bucket = buckets.get(r);
    if (bucket) bucket.push(i);
    else buckets.set(r, [i]);
  }

  const clusters: ClusterReport[] = [];

  for (const indices of buckets.values()) {
    if (indices.length < 2) continue;

    // Pick base = product with shortest normalized name (most generic).
    const sorted = [...indices].sort(
      (a, b) => normalize(products[a].name).length - normalize(products[b].name).length
    );
    const baseIdx = sorted[0];
    const base = products[baseIdx];
    const variantIndices = sorted.slice(1);

    const variants = variantIndices.map((vi) => {
      const v = products[vi];
      const deltas = computeDeltas(base, v);
      const maxDelta = maxAbsDelta(deltas);
      return {
        id: v.id,
        name: v.name,
        categories: v.categories,
        triSim: Math.round(dice(tris[baseIdx], tris[vi]) * 1000) / 1000,
        deltas,
        maxAbsDelta: Math.round(maxDelta * 10) / 10,
        verdict: verdict(maxDelta),
      };
    });

    const overallMax = variants.length === 0 ? 0 : Math.max(...variants.map((v) => v.maxAbsDelta));

    clusters.push({
      size: indices.length,
      baseId: base.id,
      baseName: base.name,
      baseCategories: base.categories,
      variants,
      overallMaxDelta: Math.round(overallMax * 10) / 10,
      overallVerdict: verdict(overallMax),
    });
  }

  clusters.sort((a, b) => b.size - a.size);

  // Stats.
  const stats = {
    totalProducts: products.length,
    clustersFound: clusters.length,
    productsInClusters: clusters.reduce((s, c) => s + c.size, 0),
    safeClusters: clusters.filter((c) => c.overallVerdict === "SAFE").length,
    warnClusters: clusters.filter((c) => c.overallVerdict === "WARN").length,
    skipClusters: clusters.filter((c) => c.overallVerdict === "SKIP").length,
    productsAfterMergeSafeOnly:
      products.length -
      clusters
        .filter((c) => c.overallVerdict === "SAFE")
        .reduce((s, c) => s + (c.size - 1), 0),
    productsAfterMergeIncWarn:
      products.length -
      clusters
        .filter((c) => c.overallVerdict !== "SKIP")
        .reduce((s, c) => s + (c.size - 1), 0),
  };

  // Console summary.
  console.log("\n=== STATS ===");
  console.log(`Clusters: ${stats.clustersFound} (${stats.productsInClusters} products in clusters)`);
  console.log(`  SAFE: ${stats.safeClusters}`);
  console.log(`  WARN: ${stats.warnClusters}`);
  console.log(`  SKIP: ${stats.skipClusters}`);
  console.log(`After merge (SAFE only): ${stats.productsAfterMergeSafeOnly} products`);
  console.log(`After merge (SAFE+WARN): ${stats.productsAfterMergeIncWarn} products`);

  console.log("\n=== TOP 30 CLUSTERS BY SIZE ===");
  for (const c of clusters.slice(0, 30)) {
    const merged = alreadyMerged.has(c.baseId) ? " [base in mapping]" : "";
    console.log(
      `\n[${c.overallVerdict}] (${c.size}) ${c.baseId} «${c.baseName}» max Δ=${c.overallMaxDelta}%${merged}`
    );
    for (const v of c.variants.slice(0, 8)) {
      const dStr = v.deltas
        .map((d) => `${d.nutrient}${d.pctDelta >= 0 ? "+" : ""}${d.pctDelta}%`)
        .join(" ");
      console.log(`  [${v.verdict}] sim=${v.triSim} ${v.id} «${v.name}» — ${dStr}`);
    }
    if (c.variants.length > 8) console.log(`  …and ${c.variants.length - 8} more`);
  }

  writeFileSync(
    OUT_PATH,
    JSON.stringify({ generatedAt: new Date().toISOString(), threshold, stats, clusters }, null, 2),
    "utf-8"
  );
  console.log(`\nWrote ${OUT_PATH}`);
}

main();
