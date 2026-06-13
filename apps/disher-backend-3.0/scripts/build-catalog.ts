// Build the frontend catalog.json from the seed source-of-truth.
//
// Input:  apps/disher-backend-3.0/seed/combined-foods-final.json
// Output: apps/food-calc/src/shared/data/catalog.json
//
// The output shape mirrors the new Dexie ProductRow (no sync columns, no
// user_id, no deleted_at). Frontend imports it as a JS bundle artifact —
// there is no /api/catalog endpoint and no Dexie catalog table.
//
// Supplements (`categories: ['supplement', ...]`) are dropped — they will
// be authored per-user in Dexie, not shipped in the catalog.
//
//   pnpm --filter @disher/backend build:catalog

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

type SeedFood = {
  id: string;
  name: string;
  source: string;
  categories?: string[];
  nutrients: Record<string, number>;
  portions?: Array<{ label: string; grams: number }>;
};

type CatalogProductRow = {
  id: string;
  name: string;
  source: string;
  nutrients: Record<string, number>;
  portions: Array<{ label: string; grams: number }>;
  categories: string[];
  serving_basis: "100g" | "serving";
  serving_unit: null;
  // Optional thumbnail in apps/food-calc/public/catalog-food/<id>.webp.
  // Curated from Wikimedia Commons; mapping lives in seed/catalog-images.json
  // (id → path) so regenerating the catalog preserves the images. Attribution
  // per file is recorded in public/catalog-food/CREDITS.tsv.
  image?: string;
  created_at: string;
};

const SEED_PATH = join(__dirname, "../seed/combined-foods-final.json");
const IMAGES_PATH = join(__dirname, "../seed/catalog-images.json");
const OUT_PATH = join(__dirname, "../../food-calc/src/shared/data/catalog.json");

const seed = JSON.parse(readFileSync(SEED_PATH, "utf8")) as SeedFood[];

// id → "/catalog-food/<id>.webp". Missing key = no image for that food.
let images: Record<string, string> = {};
try {
  images = JSON.parse(readFileSync(IMAGES_PATH, "utf8")) as Record<string, string>;
} catch {
  // No image map yet — catalog ships without thumbnails. Not an error.
}

const rows: CatalogProductRow[] = seed
  .filter((f) => !(f.categories ?? []).includes("supplement"))
  .map((f) => ({
    id: f.id,
    name: f.name,
    source: f.source,
    nutrients: f.nutrients,
    portions: f.portions ?? [],
    categories: f.categories ?? [],
    serving_basis: "100g",
    serving_unit: null,
    ...(images[f.id] ? { image: images[f.id] } : {}),
    // Frozen at build time so catalog rows have a deterministic ordering field.
    created_at: "1970-01-01T00:00:00.000Z",
  }));

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(rows));

console.log(
  `[build-catalog] wrote ${rows.length} foods → ${OUT_PATH}`,
);
