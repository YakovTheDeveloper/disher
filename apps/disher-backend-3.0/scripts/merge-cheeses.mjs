/**
 * Merges all 24 cheese variants from combined-foods.json into a single
 * canonical "сыр" entry (id=sk-145) in combined-foods-final.json.
 *
 * Nutrients are averaged across all source variants (per-nutrient,
 * skipping variants that don't have a given nutrient).
 *
 * Also updates canonical-groups.json and catalog-mapping.json.
 *
 * Run: node scripts/merge-cheeses.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const sourcePath = path.join(root, "seed", "combined-foods.json");
const finalPath = path.join(root, "seed", "combined-foods-final.json");
const groupsPath = path.join(root, "seed", "canonical-groups.json");
const mappingPath = path.join(root, "data", "catalog-mapping.json");

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const final = JSON.parse(fs.readFileSync(finalPath, "utf8"));
const groups = JSON.parse(fs.readFileSync(groupsPath, "utf8"));
const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));

// 1. Collect cheese variants (exclude сыроежки — that's mushrooms).
const cheeses = source.foods.filter(
  (f) => /^[Сс]ыр[\s,]/.test(f.nameRu || "") || f.nameRu === "Сыр Адыгейский"
);
console.log(`Found ${cheeses.length} cheese variants`);

// 2. Average nutrients (per-nutrient mean across variants that have it).
const nutrientSums = {};
const nutrientCounts = {};
for (const c of cheeses) {
  for (const n of c.nutrients) {
    nutrientSums[n.nutrientId] = (nutrientSums[n.nutrientId] ?? 0) + n.quantity;
    nutrientCounts[n.nutrientId] = (nutrientCounts[n.nutrientId] ?? 0) + 1;
  }
}
const averagedNutrients = {};
for (const id of Object.keys(nutrientSums)) {
  const avg = nutrientSums[id] / nutrientCounts[id];
  // Round: 2 decimals for small values, 0 for large
  averagedNutrients[id] = avg < 10 ? Math.round(avg * 100) / 100 : Math.round(avg * 10) / 10;
}

// Sort numerically for cleaner JSON
const sortedNutrients = {};
for (const id of Object.keys(averagedNutrients).sort((a, b) => Number(a) - Number(b))) {
  sortedNutrients[id] = averagedNutrients[id];
}

// 3. Build new сыр entry (keep sk-145 ID for backward compat).
const newCheese = {
  id: "sk-145",
  name: "сыр",
  source: "skurikhin",
  categories: ["dairy"],
  nutrients: sortedNutrients,
  portions: [
    { label: "ломтик (30 г)", grams: 30 },
    { label: "порция (50 г)", grams: 50 },
  ],
};

// 4. Replace sk-145 in final catalog.
const idx = final.findIndex((f) => f.id === "sk-145");
if (idx === -1) throw new Error("sk-145 not found in final catalog");
final[idx] = newCheese;
fs.writeFileSync(finalPath, JSON.stringify(final, null, 2), "utf8");
console.log(`✓ Updated combined-foods-final.json (sk-145 → "сыр", ${Object.keys(sortedNutrients).length} nutrients)`);

// Mirror to public copy used by the frontend.
const publicCopy = path.resolve(root, "..", "food-calc", "public", "combined-foods-final.json");
if (fs.existsSync(publicCopy)) {
  fs.writeFileSync(publicCopy, JSON.stringify(final, null, 2), "utf8");
  console.log(`✓ Mirrored to ${publicCopy}`);
}

// 5. Update canonical-groups.json.
const cheeseIds = cheeses.map((c) => c.id);
const groupIdx = groups.findIndex((g) => g.canonical === "сыр адыгейский" || (g.ids || []).includes("sk-145"));
const newGroup = { canonical: "сыр", ids: cheeseIds };
if (groupIdx === -1) {
  groups.push(newGroup);
} else {
  groups[groupIdx] = newGroup;
}
fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2), "utf8");
console.log(`✓ Updated canonical-groups.json (cluster "сыр" with ${cheeseIds.length} ids)`);

// 6. Append entry to catalog-mapping.json merged_clusters.
const mappingEntry = {
  base_id: "sk-145",
  base_name: "сыр",
  original_ids: cheeseIds,
  original_names: cheeses.map((c) => c.nameRu),
  merged_at: new Date().toISOString().slice(0, 10),
  nutrients_source: "average",
  note: "Recovered cluster: previously only sk-145 (адыгейский) survived consolidation. Merged all 24 cheese variants into one base product.",
};
mapping.merged_clusters = mapping.merged_clusters || [];
// Remove any prior cheese cluster entry to avoid duplicates
mapping.merged_clusters = mapping.merged_clusters.filter(
  (c) => !(c.base_id === "sk-145" && c.base_name && /сыр/i.test(c.base_name))
);
mapping.merged_clusters.push(mappingEntry);
mapping.total_merged_clusters = (mapping.merged_clusters || []).length;
fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), "utf8");
console.log(`✓ Appended cheese cluster to catalog-mapping.json`);

console.log("\nDone. Run gen-food-catalog-lite + gen-food-embeddings next.");
