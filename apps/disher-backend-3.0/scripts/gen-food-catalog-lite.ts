/**
 * Generates a lite catalog: { id, n (name), c (categories) }.
 *
 * Reads seed/combined-foods-final.json and writes data/food-catalog-lite.json.
 * Used for name lookup by id (matcher) and as compact catalog for LLM prompts.
 *
 * Usage: npx tsx scripts/gen-food-catalog-lite.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface FullProduct {
  id: string;
  name: string;
  source?: string;
  categories: string[];
}

interface LiteEntry {
  id: string;
  n: string;
  c: string[];
}

const inputPath = resolve(__dirname, "../seed/combined-foods-final.json");
const outputDir = resolve(__dirname, "../data");
const outputPath = resolve(outputDir, "food-catalog-lite.json");

export function generateLiteCatalog(): LiteEntry[] {
  const raw = readFileSync(inputPath, "utf-8");
  const data: FullProduct[] = JSON.parse(raw);
  return data.map((f) => ({ id: f.id, n: f.name, c: f.categories }));
}

export function writeLiteCatalog(): void {
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  const lite = generateLiteCatalog();
  writeFileSync(outputPath, JSON.stringify(lite), "utf-8");
  console.log(`Generated ${lite.length} entries → ${outputPath}`);
  console.log(`Size: ${(Buffer.byteLength(JSON.stringify(lite)) / 1024).toFixed(1)} KB`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) writeLiteCatalog();
