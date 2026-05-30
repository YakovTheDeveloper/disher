/**
 * One-shot verification for the two paused flour decisions (coconut 7863, buckwheat 3175)
 * before moving them out of REJECTED. Prints anchor minerals (our seed vs FDC candidate)
 * and the micro cells each candidate would FILL (absent-only, unit-checked, Cu/Mn ×1000).
 *   tsx scripts/verify-flours.ts
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MAP, loadSeed, foundationFoods } from './micro-tool'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SR = resolve(__dirname, '../content/FoodData_Central_sr_legacy_food_json_2021-10-28.json')
const FDN = resolve(__dirname, '../content/FoodData_Central_foundation_food_json_2026-04-30.json')

const SYM: Record<number, string> = { 9: 'Fe', 10: 'Mg', 11: 'P', 12: 'Ca', 13: 'K', 14: 'Na', 15: 'Zn', 16: 'Cu', 17: 'Mn', 18: 'Se', 19: 'I', 20: 'A', 21: 'B1', 22: 'B2', 23: 'B3', 24: 'B4', 25: 'B5', 26: 'B6', 27: 'B7', 28: 'B9', 29: 'B12', 30: 'C', 31: 'D', 32: 'E', 33: 'K1', 34: 'bCar', 35: 'aCar' }
const U: Record<number, string> = { 9: 'мг', 10: 'мг', 11: 'мг', 12: 'мг', 13: 'мг', 14: 'мг', 15: 'мг', 16: 'мкг', 17: 'мкг', 18: 'мкг', 19: 'мкг', 20: 'мкг', 21: 'мг', 22: 'мг', 23: 'мг', 24: 'мг', 25: 'мг', 26: 'мг', 27: 'мкг', 28: 'мкг', 29: 'мкг', 30: 'мг', 31: 'мкг', 32: 'мг', 33: 'мкг', 34: 'мкг', 35: 'мкг' }
const ourToFdc: Record<number, string> = {}
for (const num of Object.keys(MAP)) ourToFdc[MAP[num].our] = num
const present = (v: unknown) => v !== undefined && v !== null
const norm = (u: string) => (u || '').toLowerCase().replace('μ', 'µ')

const sr = (JSON.parse(readFileSync(SR, 'utf-8')).SRLegacyFoods as any[]).filter((f) => f && Array.isArray(f.foodNutrients))
const fdn = (JSON.parse(readFileSync(FDN, 'utf-8')).FoundationFoods as any[]).filter((f) => f && Array.isArray(f.foodNutrients))
const recById = new Map<number, any>()
for (const f of sr) recById.set(f.fdcId, f)
for (const f of fdn) if (!recById.has(f.fdcId)) recById.set(f.fdcId, f)

function amt(f: any, fdcNumId: string): { v: number; u: string } | undefined {
  for (const n of f.foodNutrients) if (String(n?.nutrient?.id) === fdcNumId && typeof n.amount === 'number') return { v: n.amount, u: n.nutrient.unitName }
  return undefined
}

const foods = foundationFoods(loadSeed())
const byOurId = new Map(foods.map((f) => [f.id, f]))
const ANCHORS = [9, 10, 11, 12, 13, 15]

function report(ourId: string, fdcId: number) {
  const food = byOurId.get(ourId)
  const rec = recById.get(fdcId)
  if (!food) { console.log(`our ${ourId} NOT FOUND`); return }
  if (!rec) { console.log(`fdc ${fdcId} NOT FOUND`); return }
  console.log(`\n=== ${food.name} (${ourId})  <-  ${fdcId} "${rec.description}" [${rec.dataType ?? recById.get(fdcId)?.foodClass ?? '?'}] ===`)
  // anchor minerals our vs fdc
  const aLines: string[] = []
  for (const a of ANCHORS) {
    const ov = food.nutrients[String(a)]
    const fa = amt(rec, ourToFdc[a])
    const ratio = (typeof ov === 'number' && ov > 0 && fa && fa.v > 0) ? (fa.v / ov) : NaN
    aLines.push(`${SYM[a]} our=${ov ?? '∅'} fdc=${fa ? fa.v : '∅'} ${Number.isFinite(ratio) ? `(${ratio.toFixed(2)}×)` : ''}`)
  }
  console.log('  minerals: ' + aLines.join('  '))
  // what would be filled
  const adds: string[] = []
  for (const num of Object.keys(MAP)) {
    const { our, unit, x1000 } = MAP[num]
    if (present(food.nutrients[String(our)])) continue
    const a = amt(rec, num)
    if (!a || a.v <= 0) continue
    if (norm(a.u) !== norm(unit)) { adds.push(`${SYM[our]}!UNIT(${a.u})`); continue }
    const v = Math.round((x1000 ? a.v * 1000 : a.v) * 10000) / 10000
    adds.push(`${SYM[our]}=${v}${U[our]}`)
  }
  console.log(`  would fill ${adds.length}: ` + adds.join(' '))
}

// Coconut flour: claim = seed minerals byte-for-byte == Foundation 2515382 "Flour, coconut"
report('7863', 2515382)
// Buckwheat flour: candidate SR 170687 "Buckwheat flour, whole-groat" (overestimates light flour)
report('3175', 170687)
