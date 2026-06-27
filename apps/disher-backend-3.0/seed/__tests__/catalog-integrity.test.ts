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

type Portion = { label: string; grams: number };
type Food = {
  id: string;
  name: string;
  source?: string;
  nutrients?: Record<string, number>;
  portions?: Portion[];
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

// Portion plausibility — currently 0 across both files, so any future import/edit
// that reintroduces a broken portion (грудка=1769-class oversize, the помидор
// «5 штук=15 г при 1 штука=120 г» count/weight corruption, empty/zero rows) fails CI.
//
// Deliberately NOT asserting "no two portions share grams" — 27 catalog products
// legitimately reach the same weight two ways («банка (100 г)»+«порция (100 г)»,
// «½ папайи=150»+«порция, кубики=150»). Same weight, different mental model — a
// feature, not corruption. The hard tripwire is the three classes below.
const PORTION_MAX = 1000; // real ceiling is the 500 ml bottle/mug (500 г); 1000 leaves slack

// Parse a leading count like "5 штук" / "3 абрикоса" → { n, unit-head }.
const LEAD_COUNT = /^(\d+)\s+(.+)$/;
function countUnit(label: string): { n: number; head: string } | null {
  const m = LEAD_COUNT.exec(label);
  if (!m) return null;
  const rawHead = m[2].split(/[ ,(]/)[0];
  const head = ["штука", "штуки", "штук"].includes(rawHead) ? "шт" : rawHead;
  return { n: Number(m[1]), head };
}

function checkPortions(foods: Food[]): string[] {
  const violations: string[] = [];
  for (const f of foods) {
    const ports = f.portions ?? [];
    // 1. every portion: finite grams in (0, PORTION_MAX], non-empty label
    for (const p of ports) {
      if (
        typeof p.grams !== "number" ||
        !Number.isFinite(p.grams) ||
        p.grams <= 0 ||
        p.grams > PORTION_MAX
      ) {
        violations.push(`${tag(f)} порция "${p.label}" = ${p.grams} г (вне 0…${PORTION_MAX})`);
      }
      if (typeof p.label !== "string" || p.label.trim() === "") {
        violations.push(`${tag(f)} порция с пустым label (${p.grams} г)`);
      }
    }
    // 2. count-monotonicity: within one unit, more pieces ⇒ not less total weight,
    //    and per-piece grams stay within 3× across counts (catches помидор «5 шт=15»).
    const byUnit = new Map<string, Array<{ n: number; g: number; label: string }>>();
    for (const p of ports) {
      const u = countUnit(p.label);
      if (!u) continue;
      const arr = byUnit.get(u.head) ?? [];
      arr.push({ n: u.n, g: p.grams, label: p.label });
      byUnit.set(u.head, arr);
    }
    for (const arr of byUnit.values()) {
      if (arr.length < 2) continue;
      arr.sort((a, b) => a.n - b.n);
      for (let i = 0; i < arr.length - 1; i++) {
        const a = arr[i];
        const b = arr[i + 1];
        if (b.n <= a.n) continue;
        if (b.g < a.g) {
          violations.push(
            `${tag(f)} "${b.label}"=${b.g} г < "${a.label}"=${a.g} г (больше штук — меньше веса)`,
          );
          continue;
        }
        const perA = a.g / a.n;
        const perB = b.g / b.n;
        if (Math.max(perA, perB) / Math.min(perA, perB) > 3) {
          violations.push(
            `${tag(f)} вес/штука расходится: "${a.label}" ${perA.toFixed(1)} г/шт vs "${b.label}" ${perB.toFixed(1)} г/шт`,
          );
        }
      }
    }
  }
  return violations;
}

describe("catalog portion plausibility", () => {
  it("seed (combined-foods-final.json) has no broken portions", () => {
    expect(checkPortions(seed)).toEqual([]);
  });

  it("catalog (catalog.json) has no broken portions", () => {
    expect(checkPortions(catalog)).toEqual([]);
  });
});
