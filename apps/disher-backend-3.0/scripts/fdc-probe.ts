import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Workhorse probe over the 321MB FDC Foundation bulk.
//   tsx scripts/fdc-probe.ts search <term>        -> list Foundation candidates (id|dataType|desc)
//   tsx scripts/fdc-probe.ts show <fdcId>         -> dump all foodNutrients for one record
//   tsx scripts/fdc-probe.ts keys                 -> top-level structure + count
// Results also written to c:/tmp/fdc-probe-out.json for slice-reading.

const FDC_BULK = resolve(
  __dirname,
  '../content/FoodData_Central_foundation_food_json_2025-04-24.json',
)
const OUT = 'c:/tmp/fdc-probe-out.json'

const mode = process.argv[2] ?? ''
const arg = process.argv[3] ?? ''

const data = JSON.parse(readFileSync(FDC_BULK, 'utf-8'))
const foods: any[] = data.FoundationFoods ?? data.foods ?? []

function nutRows(f: any) {
  return (f.foodNutrients ?? [])
    .filter((n: any) => n?.nutrient)
    .map((n: any) => ({
      number: n.nutrient.number,
      name: n.nutrient.name,
      unit: n.nutrient.unitName,
      amount: n.amount,
    }))
    .sort((a: any, b: any) => Number(a.number) - Number(b.number))
}

if (mode === 'keys') {
  const out = {
    topKeys: Object.keys(data),
    count: foods.length,
    sample: foods[0]
      ? {
          fdcId: foods[0].fdcId,
          dataType: foods[0].dataType,
          description: foods[0].description,
          foodClass: foods[0].foodClass,
          publicationDate: foods[0].publicationDate,
        }
      : null,
  }
  writeFileSync(OUT, JSON.stringify(out, null, 2))
  console.log(`topKeys=${out.topKeys.join(',')} count=${out.count}`)
} else if (mode === 'search') {
  const t = arg.toLowerCase()
  const matches = foods
    .filter((f) => f.description?.toLowerCase().includes(t))
    .map((f) => ({
      fdcId: f.fdcId,
      dataType: f.dataType,
      description: f.description,
      category: f.foodCategory?.description ?? null,
      publicationDate: f.publicationDate,
    }))
  writeFileSync(OUT, JSON.stringify(matches, null, 2))
  console.log(`matches=${matches.length} -> ${OUT}`)
  for (const m of matches.slice(0, 40))
    console.log(`  ${m.fdcId} [${m.dataType}] ${m.description}`)
} else if (mode === 'show') {
  const id = Number(arg)
  const f = foods.find((x) => x.fdcId === id)
  if (!f) {
    console.log(`fdcId ${id} not found`)
    process.exit(1)
  }
  const out = {
    fdcId: f.fdcId,
    dataType: f.dataType,
    description: f.description,
    category: f.foodCategory?.description ?? null,
    publicationDate: f.publicationDate,
    nutrients: nutRows(f),
  }
  writeFileSync(OUT, JSON.stringify(out, null, 2))
  console.log(`${f.fdcId} [${f.dataType}] ${f.description} -> ${OUT} (${out.nutrients.length} nutrients)`)
} else {
  console.log('usage: keys | search <term> | show <fdcId>')
  process.exit(1)
}
