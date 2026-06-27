import { readFileSync, existsSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { pipeline, env, type FeatureExtractionPipeline } from "@xenova/transformers";
// NB: `generateEmbeddings` lives in scripts/, which tsconfig.build.json excludes
// from the prod build — a top-level import would be ERR_MODULE_NOT_FOUND in the
// `--prod deploy` image. It's only needed when embeddings are missing/stale
// (a dev/build-time concern), so it's loaded via dynamic import() in that branch.

// Cache the embedding model under a stable, writable path baked into the image
// (warmed at build time), and never reach out to HuggingFace at runtime.
// @xenova/transformers v2 ignores HF_HOME/TRANSFORMERS_CACHE — env.cacheDir is
// the only knob it honours. Overridable via MODEL_CACHE_DIR for local runs.
env.allowLocalModels = false;
// In prod the model must already be in env.cacheDir (warmed at image-build
// time) — never hit the network at runtime. In dev/build/test we still allow
// the HF download so a fresh machine (and the Docker builder warmup) Just Works.
// ALLOW_REMOTE_MODELS=true is an explicit escape hatch for prod if ever needed.
env.allowRemoteModels =
  process.env.NODE_ENV !== "production" ||
  process.env.ALLOW_REMOTE_MODELS === "true";
if (process.env.MODEL_CACHE_DIR) {
  env.cacheDir = process.env.MODEL_CACHE_DIR;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const MODEL_NAME = "Xenova/multilingual-e5-small";
const DIM = 384;

// Embeddings are built from the frontend catalog (see gen-food-embeddings.ts) —
// track its mtime for the staleness check so a catalog rebuild triggers a regen.
const seedPath = resolve(__dirname, "../../../food-calc/src/shared/data/catalog.json");
const embPath = resolve(__dirname, "../../data/food-embeddings.json");
const aliasPath = resolve(__dirname, "../../data/food-aliases.json");

interface EmbeddingsFile {
  model: string;
  dim: number;
  generatedAt: string;
  vectors: Array<{ id: string; name: string; v: number[] }>;
}

let embedder: FeatureExtractionPipeline | null = null;
let catalogVectors: Float32Array[] = [];
let catalogMeta: Array<{ id: string; name: string }> = [];
let catalogTrigrams: Array<Set<string>> = [];
let aliasMap: Map<string, string> = new Map();
let ready = false;

// Hybrid-matcher tuning constants. Picked from scripts/probe-hybrid-sim.ts
// histogram (see catalog.md Baseline).
//   TP top-1 Dice mean ≈ 0.86, FP-scored ≈ 0.48, OOV ≈ 0.38.
//   At Dice ≥ 0.80 no FP compound confused "X+adjective" with another
//   product in the probe set (the dangerous FPs like "тушёная капуста →
//   цветная капуста" live at 0.75–0.77). So at ≥ 0.80 we commit to
//   Dice top-1 directly.
// For everything else we rank by hybrid = 0.5*cos + 0.5*dice over the full
// catalog. 50/50 weights mirror the similar TP-FP separation both metrics
// showed in the sim (Dice gap 0.86→0.48; cosine gap ~0.05→0.02).
const DICE_HIGH_CONFIDENCE = 0.80;
const HYBRID_WEIGHT_COSINE = 0.5;
const HYBRID_WEIGHT_DICE = 0.5;

export function isMatcherReady(): boolean {
  return ready;
}

function shouldRegenerate(): boolean {
  // No embeddings at all → must build them.
  if (!existsSync(embPath)) return true;
  // The seed is the FRONTEND catalog, which is not shipped in the backend-only
  // prod image. If it's absent we cannot (and need not) check staleness — the
  // baked embeddings are authoritative there. Only compare mtimes when both
  // files exist (dev/build), so a catalog rebuild still triggers a regen.
  if (!existsSync(seedPath)) return false;
  const seedMtime = statSync(seedPath).mtimeMs;
  const embMtime = statSync(embPath).mtimeMs;
  return seedMtime > embMtime;
}

export async function initMatcher(): Promise<void> {
  if (shouldRegenerate()) {
    console.log("food-embeddings.json missing or stale — regenerating");
    // Loaded lazily: scripts/ is excluded from the prod build, so a static
    // import would break the prod image. This branch only runs in dev/build,
    // where scripts/ is present.
    const { generateEmbeddings } = await import(
      "../../scripts/gen-food-embeddings.js"
    );
    await generateEmbeddings();
  }

  console.log(`Loading embedder ${MODEL_NAME}…`);
  embedder = (await pipeline("feature-extraction", MODEL_NAME)) as FeatureExtractionPipeline;

  const data = JSON.parse(readFileSync(embPath, "utf-8")) as EmbeddingsFile;
  if (data.dim !== DIM) {
    throw new Error(`Embeddings dim mismatch: expected ${DIM}, got ${data.dim}`);
  }

  catalogVectors = data.vectors.map((v) => new Float32Array(v.v));
  catalogMeta = data.vectors.map((v) => ({ id: v.id, name: v.name }));
  catalogTrigrams = catalogMeta.map((m) => trigrams(normalizeForEmbedding(m.name)));

  if (existsSync(aliasPath)) {
    const raw = JSON.parse(readFileSync(aliasPath, "utf-8")) as Record<string, string>;
    const validIds = new Set(catalogMeta.map((m) => m.id));
    aliasMap = new Map();
    for (const [alias, id] of Object.entries(raw)) {
      if (alias.startsWith("_")) continue;
      if (!validIds.has(id)) {
        console.warn(`Alias "${alias}" → unknown id "${id}", skipping`);
        continue;
      }
      aliasMap.set(alias.toLowerCase(), id);
    }
    console.log(`Loaded ${aliasMap.size} aliases.`);
  }

  // Warmup: first inference is slow.
  await embedder("query: тест", { pooling: "mean", normalize: true });

  ready = true;
  console.log(`Matcher ready: ${catalogVectors.length} vectors loaded.`);
}

/**
 * Lightweight normalization for Russian queries before embedding.
 * Lowercases, strips a few stopwords and trailing punctuation.
 * Heavy morphology is left to the embedding model.
 */
export function normalizeForEmbedding(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[.,!?;:()"'«»]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  // Both vectors are L2-normalized → cosine == dot product.
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

function trigrams(s: string): Set<string> {
  const padded = `  ${s}  `;
  const out = new Set<string>();
  for (let i = 0; i <= padded.length - 3; i++) out.add(padded.slice(i, i + 3));
  return out;
}

function diceSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  for (const t of a) if (b.has(t)) overlap++;
  return (2 * overlap) / (a.size + b.size);
}

export async function embedQuery(text: string): Promise<Float32Array> {
  if (!embedder) throw new Error("Matcher not initialized");
  const out = await embedder(`query: ${text}`, { pooling: "mean", normalize: true });
  return out.data as Float32Array;
}

export interface MatchCandidate {
  id: string;
  name: string;
  score: number;
  trigram?: number;
  cosine?: number;
  hybrid?: number;
}

/**
 * Hybrid ranker: combines cosine embeddings with Dice trigram similarity.
 *
 * Strategy (picked from probe-hybrid-sim.ts histogram — see catalog.md Baseline):
 *   1. If the top-1 Dice candidate has Dice ≥ DICE_HIGH_CONFIDENCE, trust it.
 *      Almost no FP/OOV pollution above this threshold in the probe set.
 *   2. Otherwise rank by hybrid = 0.5*cos + 0.5*dice over all products.
 *
 * Returned `score` is the hybrid score (or raw Dice if the high-confidence
 * branch fired). Keep it bounded in [0, 1] so the OOV threshold in probe
 * still behaves like before.
 */
export function topKHybrid(
  queryVec: Float32Array,
  queryNormalized: string,
  k = 3,
): MatchCandidate[] {
  const qTri = trigrams(queryNormalized);
  const diceScores = new Array<number>(catalogTrigrams.length);
  let bestDice = -1;
  let bestDiceIdx = -1;
  for (let i = 0; i < catalogTrigrams.length; i++) {
    const d = diceSimilarity(qTri, catalogTrigrams[i]);
    diceScores[i] = d;
    if (d > bestDice) {
      bestDice = d;
      bestDiceIdx = i;
    }
  }

  const scored: MatchCandidate[] = new Array(catalogVectors.length);
  for (let i = 0; i < catalogVectors.length; i++) {
    const cos = cosineSimilarity(queryVec, catalogVectors[i]);
    const hybrid = HYBRID_WEIGHT_COSINE * cos + HYBRID_WEIGHT_DICE * diceScores[i];
    scored[i] = {
      id: catalogMeta[i].id,
      name: catalogMeta[i].name,
      score: hybrid,
      trigram: diceScores[i],
      cosine: cos,
      hybrid,
    };
  }
  scored.sort((a, b) => b.score - a.score);

  // High-confidence Dice override: promote Dice top-1 to position 0 if
  // Dice ≥ DICE_HIGH_CONFIDENCE and it isn't already there.
  if (bestDice >= DICE_HIGH_CONFIDENCE && bestDiceIdx >= 0) {
    const winnerId = catalogMeta[bestDiceIdx].id;
    if (scored[0].id !== winnerId) {
      const pos = scored.findIndex((c) => c.id === winnerId);
      if (pos > 0) {
        const [winner] = scored.splice(pos, 1);
        winner.score = bestDice;
        scored.unshift(winner);
      }
    }
  }
  return scored.slice(0, k);
}

export function lookupAlias(text: string): MatchCandidate | null {
  const normalized = normalizeForEmbedding(text);
  const id = aliasMap.get(normalized);
  if (!id) return null;
  const meta = catalogMeta.find((m) => m.id === id);
  if (!meta) return null;
  return { id, name: meta.name, score: 1 };
}

export async function matchOne(text: string, k = 3): Promise<MatchCandidate[]> {
  const alias = lookupAlias(text);
  if (alias) return [alias];
  const normalized = normalizeForEmbedding(text);
  const vec = await embedQuery(normalized);
  return topKHybrid(vec, normalized, k);
}
