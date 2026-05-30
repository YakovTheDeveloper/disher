/**
 * FULL catalog data-integrity audit (all 406 foods, all nutrient fields).
 * Sizes the total scope of corruption before any remediation. Five checks:
 *   A) Energy reconciliation — stored kcal (id7) vs Atwater 4·protein + 4·carb + 9·fat.
 *      Catches macro corruption with NO USDA match needed.
 *   B) Component sum — protein+fat+carb+water+fiber > 102g is physically impossible.
 *   C) Per-nutrient hard bounds — set ABOVE the most extreme REAL food so only gross
 *      corruption trips them; attributed by source so systematic per-source issues surface.
 *   D) Precise USDA per-cell compare for the 41 usda-foundation foods (>3× = severe).
 *   E) Zinc field summary (the known systematic issue).
 * Writes c:/tmp/full-audit.txt (detail) + console summary.
 *   tsx scripts/full-catalog-audit.ts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SR = resolve(__dirname, '../content/FoodData_Central_sr_legacy_food_json_2021-10-28.json')
const FDN = resolve(__dirname, '../content/FoodData_Central_foundation_food_json_2026-04-30.json')
const cat = JSON.parse(readFileSync(resolve(__dirname, '../../food-calc/src/shared/data/catalog.json'), 'utf-8')) as any[]

const N = (f: any, id: string | number) => { const v = (f.nutrients ?? {})[String(id)]; return typeof v === 'number' ? v : undefined }
const SYM: Record<string, string> = { 1: 'protein', 2: 'fat', 3: 'carb', 4: 'sugar', 5: 'starch', 6: 'fiber', 7: 'energy', 8: 'water', 9: 'Fe', 10: 'Mg', 11: 'P', 12: 'Ca', 13: 'K', 14: 'Na', 15: 'Zn', 16: 'Cu', 17: 'Mn', 18: 'Se', 19: 'I', 20: 'A', 21: 'B1', 22: 'B2', 23: 'B3', 24: 'B4', 25: 'B5', 26: 'B6', 27: 'B7', 28: 'B9', 29: 'B12', 30: 'C', 31: 'D', 32: 'E', 33: 'K1', 34: 'bCar', 35: 'aCar', 63: 'cholesterol' }
const out: string[] = []
const log = (s = '') => out.push(s)

// ---- A) energy reconciliation ----
log('=== A) ENERGY vs Atwater (4·prot + 4·carb + 9·fat) ===')
let eBad = 0; const eBySrc: Record<string, number> = {}
for (const f of cat) {
  const e = N(f, 7), p = N(f, 1) ?? 0, c = N(f, 3) ?? 0, fat = N(f, 2) ?? 0
  if (e === undefined || (p === 0 && c === 0 && fat === 0)) continue
  const calc = 4 * p + 4 * c + 9 * fat
  const diff = Math.abs(e - calc)
  if (diff > Math.max(60, 0.30 * Math.max(e, calc))) { eBad++; eBySrc[f.source] = (eBySrc[f.source] ?? 0) + 1; if (eBad <= 25) log(`  ${f.name} (${f.id}/${f.source}) stored=${e} atwater=${Math.round(calc)} Δ${Math.round(diff)}  [P${p} C${c} F${fat}]`) }
}
log(`A-SUMMARY: ${eBad} foods with energy off >30% ${JSON.stringify(eBySrc)}`)

// ---- B) component sum > 102g ----
log('\n=== B) COMPONENT SUM > 102g (impossible) ===')
let sumBad = 0
for (const f of cat) {
  const s = (N(f, 1) ?? 0) + (N(f, 2) ?? 0) + (N(f, 3) ?? 0) + (N(f, 8) ?? 0) + (N(f, 6) ?? 0)
  if (s > 102) { sumBad++; log(`  ${f.name} (${f.id}/${f.source}) Σ(P+F+C+H2O+fib)=${s.toFixed(1)}g`) }
}
log(`B-SUMMARY: ${sumBad} foods with component sum >102g`)

// ---- C) per-nutrient hard bounds (set above the most extreme real food) ----
log('\n=== C) IMPOSSIBLE per-nutrient values (bound > most-extreme real food) ===')
const BOUND: Record<string, number> = {
  1: 96, 2: 100, 3: 101, 4: 101, 5: 101, 6: 96, 7: 902, 8: 100,
  9: 130, 10: 900, 11: 2400, 12: 8200, 13: 17000, 14: 40000, /*15 zinc handled in E*/
  16: 16000, 17: 70000, 18: 3000, 19: 12000,
  20: 30000, 21: 12, 22: 12, 23: 120, 24: 700, 25: 22, 26: 13, 27: 120, 28: 2500, 29: 130, 30: 2000, 31: 600, 32: 220, 33: 2200, 34: 30000, 35: 6000,
  63: 3500,
}
const cBySrc: Record<string, number> = {}; const cByNut: Record<string, number> = {}; let cBad = 0
for (const f of cat) for (const id of Object.keys(BOUND)) {
  const v = N(f, id); if (v !== undefined && v > BOUND[id]) { cBad++; cBySrc[f.source] = (cBySrc[f.source] ?? 0) + 1; cByNut[SYM[id]] = (cByNut[SYM[id]] ?? 0) + 1; if (cBad <= 40) log(`  ${f.name} (${f.id}/${f.source}) ${SYM[id]}=${v} > ${BOUND[id]}`) }
}
log(`C-SUMMARY: ${cBad} impossible cells. byNutrient=${JSON.stringify(cByNut)} bySource=${JSON.stringify(cBySrc)}`)

// ---- negatives ----
log('\n=== negatives / NaN ===')
let neg = 0
for (const f of cat) for (const [k, v] of Object.entries(f.nutrients ?? {})) if (typeof v === 'number' && v < 0) { neg++; log(`  ${f.name} (${f.id}) ${SYM[k] ?? k}=${v}`) }
log(`NEG-SUMMARY: ${neg}`)

// ---- D) precise USDA compare for 41 usda-foundation ----
const sr = (JSON.parse(readFileSync(SR, 'utf-8')).SRLegacyFoods as any[]).filter((f) => f && Array.isArray(f.foodNutrients))
const fdn = (JSON.parse(readFileSync(FDN, 'utf-8')).FoundationFoods as any[]).filter((f) => f && Array.isArray(f.foodNutrients))
const recById = new Map<number, any>(); for (const f of sr) recById.set(f.fdcId, f); for (const f of fdn) if (!recById.has(f.fdcId)) recById.set(f.fdcId, f)
const MATCH: Record<string, number> = { '4185': 171697, '7811': 175202, '7861': 170569, '2867': 170379, '3176': 170688, '2774': 170286, '7838': 169382, '2214': 169726, '1580': 169092, '3772': 171284, '2463': 169975, '2465': 169977, '909': 168421, '3079': 170591, '250': 2346409, '7959': 173698, '4824': 172336, '7841': 2257045, '7703': 1999630, '7845': 170568, '7846': 169741, '2402': 169914, '7865': 173756, '7849': 173904, '897': 168409, '2670': 170182, '2666': 170178, '3069': 170581, '2905': 170417, '7843': 2258590, '1618': 169130, '2190': 169702, '2863': 170375, '3044': 170556, '3042': 170554, '1902': 169414, '7853': 2346404, '5956': 173468, '7810': 173744, '7814': 173734, '7881': 171052 }
// our minerals 9-17 -> fdc nutrient.id + ×1000 flag
const FDCMIN: Record<string, { fdc: string; x?: boolean }> = { 9: { fdc: '1089' }, 10: { fdc: '1090' }, 11: { fdc: '1091' }, 12: { fdc: '1087' }, 13: { fdc: '1092' }, 14: { fdc: '1093' }, 15: { fdc: '1095' }, 16: { fdc: '1098', x: true }, 17: { fdc: '1101', x: true } }
const fdcAmt = (f: any, id: string) => { for (const n of f.foodNutrients) if (String(n?.nutrient?.id) === id && typeof n.amount === 'number') return n.amount; return undefined }
const catById = new Map(cat.map((f) => [String(f.id), f]))
log('\n=== D) usda-foundation present-mineral SEVERE divergence (>3× vs verified USDA) ===')
let dSevere = 0
for (const id of Object.keys(MATCH)) {
  const food = catById.get(id), rec = recById.get(MATCH[id]); if (!food || !rec) continue
  const flags: string[] = []
  for (const ourId of Object.keys(FDCMIN)) {
    const ov = N(food, ourId); if (ov === undefined || ov <= 0) continue
    let fv = fdcAmt(rec, FDCMIN[ourId].fdc); if (fv === undefined || fv <= 0) continue
    if (FDCMIN[ourId].x) fv *= 1000
    const lr = Math.abs(Math.log(ov / fv)); if (lr > Math.log(3)) { flags.push(`${SYM[ourId]} our=${ov} usda=${Math.round(fv * 100) / 100} ${(ov / fv).toFixed(1)}×`); dSevere++ }
  }
  if (flags.length) log(`  ${food.name} (${id}) ${flags.join('  ')}`)
}
log(`D-SUMMARY: ${dSevere} severe (>3×) mineral divergences across 41 matched foods`)

// ---- E) zinc field summary ----
log('\n=== E) ZINC (id15) implausible (>15mg; only oysters legit) ===')
const zBySrc: Record<string, number> = {}; let zBad = 0
for (const f of cat) { const v = N(f, 15); if (v !== undefined && v > 15) { zBad++; zBySrc[f.source] = (zBySrc[f.source] ?? 0) + 1 } }
log(`E-SUMMARY: ${zBad} foods with zinc >15mg ${JSON.stringify(zBySrc)}`)

writeFileSync('c:/tmp/full-audit.txt', out.join('\n'))
console.log(out.join('\n'))
