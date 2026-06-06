/**
 * Generates embeddings for the food catalog using Xenova/multilingual-e5-small (384 dim).
 *
 * Reads the FRONTEND catalog (apps/food-calc/src/shared/data/catalog.json) and
 * writes data/food-embeddings.json. catalog.json is the single source of truth
 * for the id-space the frontend can render — building embeddings from it
 * guarantees the matcher never returns an id the frontend lacks (otherwise
 * `findCatalogProduct` → null → empty review row). Previously this read
 * seed/combined-foods-final.json (430 rows incl. 24 supplements that
 * build-catalog drops) → 24 orphan vectors custom-27..custom-50.
 * For e5: each catalog entry uses "passage: <name>. <categories>" prefix.
 *
 * Usage: npx tsx scripts/gen-food-embeddings.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { pipeline, env } from "@xenova/transformers";

env.allowLocalModels = false;

const __dirname = dirname(fileURLToPath(import.meta.url));

const MODEL_NAME = "Xenova/multilingual-e5-small";
const DIM = 384;
const BATCH_SIZE = 16;

interface FullProduct {
  id: string;
  name: string;
  categories?: string[];
}

interface EmbeddingsFile {
  model: string;
  dim: number;
  generatedAt: string;
  vectors: Array<{ id: string; name: string; v: number[] }>;
}

// Frontend build-route catalog (committed JS-bundle artifact). Same id-space
// the UI renders, so 0 orphan vectors by construction.
const seedPath = resolve(__dirname, "../../food-calc/src/shared/data/catalog.json");
const outDir = resolve(__dirname, "../data");
const outPath = resolve(outDir, "food-embeddings.json");

export function embeddingsAreFresh(): boolean {
  if (!existsSync(outPath)) return false;
  const seedMtime = statSync(seedPath).mtimeMs;
  const embMtime = statSync(outPath).mtimeMs;
  return embMtime >= seedMtime;
}

export async function generateEmbeddings(): Promise<void> {
  console.log(`Loading model ${MODEL_NAME}…`);
  const embedder = await pipeline("feature-extraction", MODEL_NAME);
  console.log("Model loaded.");

  const data: FullProduct[] = JSON.parse(readFileSync(seedPath, "utf-8"));
  console.log(`Encoding ${data.length} products in batches of ${BATCH_SIZE}…`);

  const vectors: EmbeddingsFile["vectors"] = [];
  const startedAt = Date.now();

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const texts = batch.map((f) => {
      const cats = (f.categories ?? []).join(", ");
      return `passage: ${f.name}${cats ? `. ${cats}` : ""}`;
    });

    const out = await embedder(texts, { pooling: "mean", normalize: true });
    const flat = out.data as Float32Array;

    for (let j = 0; j < batch.length; j++) {
      const v = Array.from(flat.subarray(j * DIM, (j + 1) * DIM));
      vectors.push({ id: batch[j].id, name: batch[j].name, v });
    }

    if ((i / BATCH_SIZE) % 10 === 0) {
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
      console.log(`  ${Math.min(i + BATCH_SIZE, data.length)}/${data.length} (${elapsed}s)`);
    }
  }

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const file: EmbeddingsFile = {
    model: MODEL_NAME,
    dim: DIM,
    generatedAt: new Date().toISOString(),
    vectors,
  };
  writeFileSync(outPath, JSON.stringify(file), "utf-8");
  const sizeMb = (Buffer.byteLength(JSON.stringify(file)) / 1024 / 1024).toFixed(2);
  const totalSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`Wrote ${vectors.length} vectors (${sizeMb} MB) in ${totalSec}s → ${outPath}`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  generateEmbeddings().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
