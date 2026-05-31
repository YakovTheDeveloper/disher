import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Physical-plausibility + parity guard for the food catalog.
//
// Background: `combined-foods-final.json` (the seed, 430 foods) is the source of
// truth; `apps/food-calc/src/shared/data/catalog.json` (406 foods) is generated
// from it via `build:catalog` (consolidation only DROPS records, it copies the
// survivors verbatim — so every catalog id must exist in the seed with identical
// nutrients + name). Both files have historically carried column-misalignment
// corruption (cholesterol→zinc, phantom fiber on meat) that surfaces as
// out-of-range values or a broken mass balance. This test encodes the
// "physically impossible" tier that is currently 0 across both files, so any
// future import/edit that reintroduces that class of corruption fails CI.
//
// It intentionally does NOT assert sugar≤carb / fiber≤carb / fattyAcids≤fat —
// those carry deliberately-accepted skurikhin digestible-carb artifacts and a
// few known exceptions (телятина ЖК>жир, etc.). The ad-hoc richer audit lives in
// c:/tmp/sem-audit.mjs; this is the hard tripwire.

type Food = {
  id: string;
  name: string;
  source?: string;
  nutrients?: Record<string, number>;
};

const here = fileURLToPath(new URL(".", import.meta.url));
const seed: Food[] = JSON.parse(
  readFileSync(new URL("../combined-foods-final.json", import.meta.url), "utf8"),
);
const catalog: Food[] = JSON.parse(
  readFileSync(
    `${here}../../../food-calc/src/shared/data/catalog.json`,
    "utf8",
  ),
);

const n = (f: Food, id: string): number | undefined => {
  const v = f.nutrients?.[id];
  return typeof v === "number" ? v : undefined;
};
const tag = (f: Food) => `${f.name} (${f.id}/${f.source ?? "?"})`;

// id → [human label, max] for the hard out-of-range tier.
const RANGE: Array<[string, string, number]> = [
  ["1", "protein", 100],
  ["2", "fat", 100],
  ["3", "carbohydrate", 100],
  ["6", "fiber", 100],
  ["8", "water", 100],
  ["7", "energy", 902], // 100 g pure fat ≈ 900 kcal — nothing edible exceeds it
];

function checkPhysics(foods: Food[], label: string) {
  const violations: string[] = [];
  for (const f of foods) {
    const nu = f.nutrients ?? {};
    // 1. every value finite & non-negative
    for (const [k, v] of Object.entries(nu)) {
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
        violations.push(`${tag(f)} nutrient ${k} = ${v} (не число / <0)`);
      }
    }
    // 2. macro / energy ranges
    for (const [id, name, max] of RANGE) {
      const v = n(f, id);
      if (v !== undefined && v > max) {
        violations.push(`${tag(f)} ${name} = ${v} (> ${max})`);
      }
    }
    // 3. mass balance — P+F+C+water can't exceed 100 g (+0.6 g rounding slack)
    const p = n(f, "1"),
      fat = n(f, "2"),
      c = n(f, "3"),
      w = n(f, "8");
    if ([p, fat, c, w].every((x) => x !== undefined)) {
      const sum = p! + fat! + c! + w!;
      if (sum > 100.6) {
        violations.push(
          `${tag(f)} баланс масс P+F+C+вода = ${sum.toFixed(1)} (> 100.6)`,
        );
      }
    }
  }
  return violations;
}

describe("catalog physical plausibility", () => {
  it("seed (combined-foods-final.json) has no impossible cells", () => {
    expect(checkPhysics(seed, "seed")).toEqual([]);
  });

  it("catalog (catalog.json) has no impossible cells", () => {
    expect(checkPhysics(catalog, "catalog")).toEqual([]);
  });
});

describe("catalog ↔ seed parity", () => {
  it("every catalog record matches its seed twin (nutrients + name) verbatim", () => {
    const seedById = new Map(seed.map((f) => [f.id, f]));
    const mismatches: string[] = [];
    for (const c of catalog) {
      const s = seedById.get(c.id);
      if (!s) {
        mismatches.push(`${tag(c)} есть в каталоге, но НЕ в сиде`);
        continue;
      }
      if (c.name !== s.name) {
        mismatches.push(`${c.id}: name "${c.name}" ≠ seed "${s.name}"`);
      }
      if (JSON.stringify(c.nutrients) !== JSON.stringify(s.nutrients)) {
        mismatches.push(`${tag(c)}: nutrients расходятся catalog↔seed`);
      }
    }
    expect(mismatches).toEqual([]);
  });
});
