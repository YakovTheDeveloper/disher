/**
 * Merges custom-57 «свекла» (no-yo duplicate) into sk-784 «свёкла».
 *
 * Strategy: keep sk-784 nutrients as-is (skurikhin has more complete data,
 * 24 nutrients vs custom-57's ~16). Just drop custom-57 from the catalog
 * and record the merge in mapping/groups.
 *
 * Run: node scripts/merge-svekla.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const finalPath = path.join(root, "seed", "combined-foods-final.json");
const groupsPath = path.join(root, "seed", "canonical-groups.json");
const mappingPath = path.join(root, "data", "catalog-mapping.json");
const publicCopy = path.resolve(root, "..", "food-calc", "public", "combined-foods-final.json");

const final = JSON.parse(fs.readFileSync(finalPath, "utf8"));
const groups = JSON.parse(fs.readFileSync(groupsPath, "utf8"));
const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));

const BASE_ID = "sk-784";
const DUP_ID = "custom-57";

const baseIdx = final.findIndex((f) => f.id === BASE_ID);
const dupIdx = final.findIndex((f) => f.id === DUP_ID);
if (baseIdx === -1) throw new Error(`${BASE_ID} not found in final catalog`);
if (dupIdx === -1) throw new Error(`${DUP_ID} not found in final catalog`);

const dup = final[dupIdx];
console.log(`Removing ${DUP_ID} «${dup.name}» (kept ${BASE_ID} «свёкла»)`);

// 1. Remove duplicate from final.
final.splice(dupIdx, 1);
fs.writeFileSync(finalPath, JSON.stringify(final, null, 2), "utf8");
console.log(`✓ Updated combined-foods-final.json (${final.length} products)`);

if (fs.existsSync(publicCopy)) {
  fs.writeFileSync(publicCopy, JSON.stringify(final, null, 2), "utf8");
  console.log(`✓ Mirrored to ${publicCopy}`);
}

// 2. Add custom-57 to canonical-groups свёкла cluster.
const groupIdx = groups.findIndex((g) => g.canonical === "свёкла");
if (groupIdx === -1) {
  groups.push({ canonical: "свёкла", ids: [BASE_ID, DUP_ID] });
} else if (!groups[groupIdx].ids.includes(DUP_ID)) {
  groups[groupIdx].ids.push(DUP_ID);
}
fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2), "utf8");
console.log(`✓ Updated canonical-groups.json`);

// 3. Update catalog-mapping.json: add custom-57 to sk-784 merged cluster
//    and fix the existing names array (was missing one entry).
const merged = mapping.merged_clusters || [];
const entryIdx = merged.findIndex((c) => c.base_id === BASE_ID);
if (entryIdx === -1) {
  merged.push({
    base_id: BASE_ID,
    base_name: "свёкла",
    original_ids: [BASE_ID, DUP_ID],
    original_names: ["свёкла", "свекла (custom)"],
    merged_at: new Date().toISOString().slice(0, 10),
    nutrients_source: "kept-base",
    note: "custom-57 «свекла» (no-yo duplicate) folded into sk-784. Base nutrients kept (skurikhin has fuller data than custom).",
  });
} else {
  const e = merged[entryIdx];
  if (!e.original_ids.includes(DUP_ID)) e.original_ids.push(DUP_ID);
  e.original_names = e.original_names || [];
  if (!e.original_names.some((n) => /custom/i.test(n))) {
    e.original_names.push("свекла (custom)");
  }
  e.note = (e.note ? e.note + " " : "") +
    `Updated ${new Date().toISOString().slice(0, 10)}: folded custom-57 «свекла» (no-yo duplicate) into base.`;
}
mapping.merged_clusters = merged;
mapping.total_merged_clusters = merged.length;
mapping.final_count = final.length;
fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), "utf8");
console.log(`✓ Updated catalog-mapping.json (final_count=${final.length})`);

console.log("\nDone. Run gen-food-catalog-lite + gen-food-embeddings next.");
