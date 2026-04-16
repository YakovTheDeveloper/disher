import { readFileSync, existsSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { pipeline, env, type FeatureExtractionPipeline } from "@xenova/transformers";
import { generateEmbeddings } from "../../scripts/gen-food-embeddings.js";

env.allowLocalModels = false;

const __dirname = dirname(fileURLToPath(import.meta.url));

const MODEL_NAME = "Xenova/multilingual-e5-small";
const DIM = 384;

const seedPath = resolve(__dirname, "../../seed/combined-foods-final.json");
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
let aliasMap: Map<string, string> = new Map();
let ready = false;

export function isMatcherReady(): boolean {
  return ready;
}

function shouldRegenerate(): boolean {
  if (!existsSync(embPath)) return true;
  const seedMtime = statSync(seedPath).mtimeMs;
  const embMtime = statSync(embPath).mtimeMs;
  return seedMtime > embMtime;
}

export async function initMatcher(): Promise<void> {
  if (shouldRegenerate()) {
    console.log("food-embeddings.json missing or stale — regenerating");
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

export async function embedQuery(text: string): Promise<Float32Array> {
  if (!embedder) throw new Error("Matcher not initialized");
  const out = await embedder(`query: ${text}`, { pooling: "mean", normalize: true });
  return out.data as Float32Array;
}

export interface MatchCandidate {
  id: string;
  name: string;
  score: number;
}

export function topKMatches(query: Float32Array, k = 3): MatchCandidate[] {
  const scored: MatchCandidate[] = new Array(catalogVectors.length);
  for (let i = 0; i < catalogVectors.length; i++) {
    scored[i] = {
      id: catalogMeta[i].id,
      name: catalogMeta[i].name,
      score: cosineSimilarity(query, catalogVectors[i]),
    };
  }
  scored.sort((a, b) => b.score - a.score);
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
  return topKMatches(vec, k);
}
