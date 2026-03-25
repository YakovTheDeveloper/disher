/**
 * Generates a condensed food catalog for LLM context.
 *
 * Reads combined-foods.json (~4.4MB, 1632 foods with full nutrient data)
 * and outputs food-catalog-lite.json (~80KB) with only id, name, and categories.
 *
 * Usage: npx tsx scripts/gen-food-catalog.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const inputPath = resolve(
  __dirname,
  "../parser/output/combined-foods.json"
);
const outputPath = resolve(__dirname, "../data/food-catalog-lite.json");

interface CombinedFood {
  id: string;
  nameRu: string;
  nameEng: string;
  source: string;
  categories: string[];
  nutrients: Array<{ nutrientId: string; quantity: number }>;
  portions: unknown[];
}

interface CombinedFoodsFile {
  meta: Record<string, unknown>;
  foods: CombinedFood[];
}

const raw = readFileSync(inputPath, "utf-8");
const data: CombinedFoodsFile = JSON.parse(raw);

const lite = data.foods.map((f) => ({
  id: f.id,
  n: f.nameRu,
  c: f.categories,
}));

writeFileSync(outputPath, JSON.stringify(lite), "utf-8");

console.log(`Generated ${lite.length} entries → ${outputPath}`);
console.log(
  `Size: ${(Buffer.byteLength(JSON.stringify(lite)) / 1024).toFixed(1)} KB`
);
