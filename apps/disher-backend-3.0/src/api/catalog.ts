import { readFileSync, statSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { writeLiteCatalog } from "../../scripts/gen-food-catalog-lite.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface CatalogEntry {
  id: string;
  n: string;
  c: string[];
}

const seedPath = resolve(__dirname, "../../seed/combined-foods-final.json");
const litePath = resolve(__dirname, "../../data/food-catalog-lite.json");

let catalog: CatalogEntry[] | null = null;
let catalogIds: Set<string> | null = null;

function shouldRegenerate(): boolean {
  if (!existsSync(litePath)) return true;
  const seedMtime = statSync(seedPath).mtimeMs;
  const liteMtime = statSync(litePath).mtimeMs;
  return seedMtime > liteMtime;
}

export function loadCatalog(): CatalogEntry[] {
  if (catalog) return catalog;
  if (shouldRegenerate()) {
    console.log("food-catalog-lite.json missing or stale — regenerating");
    writeLiteCatalog();
  }
  catalog = JSON.parse(readFileSync(litePath, "utf-8")) as CatalogEntry[];
  catalogIds = new Set(catalog.map((f) => f.id));
  return catalog;
}

export function getCatalogIds(): Set<string> {
  if (!catalogIds) loadCatalog();
  return catalogIds!;
}
