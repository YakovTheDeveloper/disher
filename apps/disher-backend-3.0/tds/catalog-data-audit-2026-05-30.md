# Catalog data-integrity audit — 2026-05-30

**Trigger:** user asked "почему Zn=42 только у курицы? может вся база corrupted?" after the USDA micro-backfill
flagged two side bugs. Ran a full all-fields audit of all 406 catalog foods.

**Verdict: the catalog is NOT broadly corrupted.** Corruption is concentrated in **one field (zinc, id15)
for one category (animal foods)** plus a small localized mineral scramble in re-imported usda-foundation foods.
Macros, vitamins, other minerals, plant foods, amino acids — all sound.

## Scope (audit script: `scripts/full-catalog-audit.ts`, detail in `c:/tmp/full-audit.txt`)

### 1. Zinc field (id15), animal foods — THE systematic issue: **~75 foods**
Impossible zinc (>15 mg/100g; only oysters legit). All 75 are animal foods. By source:
`skurikhin 63 · usda-sr-legacy 11 · usda-foundation 1`. Two root causes converge on this field:
- **Bug A — skurikhin/sr-legacy import column-misalignment.** The Russian-source importer wrote
  cholesterol-ish animal values into id15 (zinc) instead of `id63` (Холестерин, which exists in the
  scheme). Evidence: масло id15=170 (chol ~215, id63 absent), желток 1510 (chol ~1234-1510), почки 300
  (chol ~300). Plant skurikhin foods have CORRECT zinc (банан 0.16, картофель 0.32) — no cholesterol →
  no collision. Per-food fidelity to cholesterol varies (some foods already have a correct id63), so the
  reliable statement is "id15 is untrustworthy for animal foods," not "id15 == cholesterol everywhere".
- **Bug B — usda-foundation re-import (commit `91e714e3` "lots of").** git-traced: at `5b8183fe` курица
  was "Курица, бёдра" with Zn=1.35 (correct); at `91e714e3` re-imported as generic "курица" with scrambled
  minerals → Zn 42, Cu 23. Same broken import that put energy under the Atwater code.

### 2. usda-foundation mineral scramble (Bug B) — a handful
Severe (>3× vs verified USDA) across the 41 matched foods: **19 cells**, but mostly two genuinely-corrupt
foods + variety noise:
- **соль** — Fe 8.8×, Mg 22×, Ca 8.7×, Mn 0.3× (badly off; salt should be ~pure NaCl).
- **курица** — Zn 27.3× (the flagged bug).
- The rest are mostly **Na lower-than-USDA** (rice, bulgur, almond/oat flour, oats: 0.1-0.3×) — plausibly
  unsalted-variety differences, NOT necessarily corruption. A few single Fe/Ca/Cu divergences (melon,
  cabbage, nut Mn) — review case-by-case during remediation.

### 3. Everything else — CLEAN
- **Energy (Atwater 4·P+4·C+9·F):** 6 "off" flags, ALL artifacts — alcohol (водка/вино/ванильный экстракт:
  formula ignores ethanol's 7 kcal/g) + fiber double-count (отруби/гвоздика/перец душистый). Macros sound.
- **Component sum >102g:** 75 flags, ALL the fiber-within-carbs accounting artifact (carbs-by-difference
  already includes fiber, then fiber added again). Concentrated in dried/fibrous foods (spices, flours,
  bran, seeds). NOT corruption.
- **Per-nutrient impossible (bounds set above the most-extreme real food, zinc excluded):** **0 cells.**
  No other field has a zinc-like systematic problem.
- **Negatives:** 1 (палтус carb=-0.06, rounding). 
- All vitamins, other minerals, amino acids: plausible.

### Bonus finding (separate from corruption)
`id63 = Холестерин` exists in the backend scheme and is correctly populated for USDA foods (курица id63=82.2),
but the **frontend display scheme (`constants.ts`) stops at id58 → cholesterol is never shown**. Collected
but invisible. (User decided: do NOT recover cholesterol during this remediation — just clean zinc.)

## Remediation plan (user-approved approach: overwrite bad zinc with correct USDA, discard misplaced chol)
- **No fdcId in seed** (0/430 carry external ids) → correct zinc must be re-sourced by name-matching to USDA,
  like the micro-backfill. ~74 animal foods (skurikhin/sr-legacy) + chicken + соль minerals.
- Suggested: backfill-style verification workflow (match → adversarial verify → compose → surgical overwrite
  → safetycheck → build:catalog → spot-check), reusing `micro-tool`/`micro-compose` infra.
- This is its OWN task — NOT yet executed. Source `seed/combined-foods-final.json` currently holds only the
  micro-backfill (+243 vitamin cells, 2026-05-30); zinc bugs untouched.

## Status
- **Audit:** DONE 2026-05-30. Scripts: `corruption-audit.ts`, `full-catalog-audit.ts`, `verify-flours.ts`.
- **Remediation:** NOT started — awaiting go-ahead to build the zinc/mineral fix pass.
