// Build-time model warmup. @xenova/transformers v2 downloads the embedding
// model from the HuggingFace Hub on first use; in production we run with
// env.allowRemoteModels=false (food-matcher.ts) so the model MUST already sit
// in env.cacheDir. This script — run in the Docker builder stage — forces that
// download into MODEL_CACHE_DIR so the runtime image is fully offline.
//
// The model name MUST match MODEL_NAME in src/api/food-matcher.ts.
import { pipeline, env } from "@xenova/transformers";

const MODEL_NAME = "Xenova/multilingual-e5-small";

env.allowLocalModels = false;
env.allowRemoteModels = true; // warmup is the one place we DO hit the network
env.cacheDir = process.env.MODEL_CACHE_DIR || "/repo/.hfcache";

console.log(`[warm-model] downloading ${MODEL_NAME} → ${env.cacheDir}`);
const extractor = await pipeline("feature-extraction", MODEL_NAME);
// A real inference so every lazily-fetched weight/file lands in the cache.
await extractor("query: тест", { pooling: "mean", normalize: true });
console.log("[warm-model] done");
