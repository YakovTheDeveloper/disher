import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const canonical = JSON.parse(readFileSync(join(__dirname, 'canonical-groups.json'), 'utf8'));
const foods = JSON.parse(readFileSync(join(__dirname, 'combined-foods-final.json'), 'utf8'));

const byId = new Map(foods.map(f => [f.id, f]));
const groupedIds = new Set();

const out = [];

function averageNutrients(entries) {
  const sums = {};
  const counts = {};
  for (const e of entries) {
    if (!e.nutrients) continue;
    for (const [k, v] of Object.entries(e.nutrients)) {
      if (typeof v !== 'number' || Number.isNaN(v)) continue;
      sums[k] = (sums[k] || 0) + v;
      counts[k] = (counts[k] || 0) + 1;
    }
  }
  const result = {};
  for (const k of Object.keys(sums)) {
    const avg = sums[k] / counts[k];
    result[k] = Math.round(avg * 100) / 100;
  }
  return result;
}

function mergePortions(entries) {
  const seen = new Map();
  for (const e of entries) {
    if (!Array.isArray(e.portions)) continue;
    for (const p of e.portions) {
      if (!p || !p.label) continue;
      const key = p.label.trim().toLowerCase();
      if (!seen.has(key)) seen.set(key, p);
    }
  }
  return [...seen.values()];
}

function mergeCategories(entries) {
  const set = new Set();
  for (const e of entries) {
    for (const c of e.categories || []) set.add(c);
  }
  return [...set];
}

for (const group of canonical) {
  const entries = group.ids.map(id => byId.get(id)).filter(Boolean);
  if (entries.length === 0) {
    console.warn(`[skip] canonical "${group.canonical}" has no matching ids`);
    continue;
  }
  for (const id of group.ids) groupedIds.add(id);

  const first = entries[0];
  out.push({
    id: first.id,
    name: group.canonical,
    source: first.source,
    categories: mergeCategories(entries),
    nutrients: averageNutrients(entries),
    portions: mergePortions(entries),
  });
}

// Append any foods not covered by any canonical group, untouched.
let orphanCount = 0;
for (const f of foods) {
  if (!groupedIds.has(f.id)) {
    out.push(f);
    orphanCount++;
  }
}

writeFileSync(
  join(__dirname, 'combined-foods-final-v2.json'),
  JSON.stringify(out, null, 2),
  'utf8',
);

console.log(`Canonical groups: ${canonical.length}`);
console.log(`Merged entries:   ${out.length - orphanCount}`);
console.log(`Orphan entries:   ${orphanCount}`);
console.log(`Total output:     ${out.length}`);
