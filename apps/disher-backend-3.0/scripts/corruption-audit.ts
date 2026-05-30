/**
 * Scope-of-corruption audit. The chicken Zn=42 bug entered at commit 91e714e3 ("lots of")
 * when usda-foundation foods were re-imported with a broken mineral mapping. Question:
 * is it isolated or widespread? Two passes:
 *   A) PRECISE — for each usda-foundation food with a verified USDA match (from the backfill),
 *      compare our PRESENT minerals (Fe Mg P Ca K Na Zn Cu Mn) against the real USDA record.
 *      Flag cells diverging >2× (likely corrupt) / >3× (almost certainly).
 *   B) BROAD — scan ALL 406 catalog foods for physically-impossible mineral values regardless
 *      of source (catches issues outside the foundation set).
 *   tsx scripts/corruption-audit.ts
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadSeed, foundationFoods } from './micro-tool'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SR = resolve(__dirname, '../content/FoodData_Central_sr_legacy_food_json_2021-10-28.json')
const FDN = resolve(__dirname, '../content/FoodData_Central_foundation_food_json_2026-04-30.json')

// our mineral id -> { fdc nutrient.id, ×1000 to reach our unit }
const MIN: Record<number, { fdc: string; x1000?: boolean; sym: string }> = {
  9: { fdc: '1089', sym: 'Fe' }, 10: { fdc: '1090', sym: 'Mg' }, 11: { fdc: '1091', sym: 'P' },
  12: { fdc: '1087', sym: 'Ca' }, 13: { fdc: '1092', sym: 'K' }, 14: { fdc: '1093', sym: 'Na' },
  15: { fdc: '1095', sym: 'Zn' }, 16: { fdc: '1098', x1000: true, sym: 'Cu' }, 17: { fdc: '1101', x1000: true, sym: 'Mn' },
}

// verified matches from the micro backfill (micro-compose ACCEPTED). food id -> fdcId.
const MATCH: Record<string, number> = {
  '4185': 171697, '7811': 175202, '7861': 170569, '2867': 170379, '3176': 170688, '2774': 170286,
  '7838': 169382, '2214': 169726, '1580': 169092, '3772': 171284, '2463': 169975, '2465': 169977,
  '909': 168421, '3079': 170591, '250': 2346409, '7959': 173698, '4824': 172336, '7841': 2257045,
  '7703': 1999630, '7845': 170568, '7846': 169741, '2402': 169914, '7865': 173756, '7849': 173904,
  '897': 168409, '2670': 170182, '2666': 170178, '3069': 170581, '2905': 170417, '7843': 2258590,
  '1618': 169130, '2190': 169702, '2863': 170375, '3044': 170556, '3042': 170554, '1902': 169414,
  '7853': 2346404, '5956': 173468, '7810': 173744, '7814': 173734, '7881': 171052,
}

const sr = (JSON.parse(readFileSync(SR, 'utf-8')).SRLegacyFoods as any[]).filter((f) => f && Array.isArray(f.foodNutrients))
const fdn = (JSON.parse(readFileSync(FDN, 'utf-8')).FoundationFoods as any[]).filter((f) => f && Array.isArray(f.foodNutrients))
const recById = new Map<number, any>()
for (const f of sr) recById.set(f.fdcId, f)
for (const f of fdn) if (!recById.has(f.fdcId)) recById.set(f.fdcId, f)
const fdcAmt = (f: any, id: string) => { for (const n of f.foodNutrients) if (String(n?.nutrient?.id) === id && typeof n.amount === 'number') return n.amount; return undefined }

const foods = foundationFoods(loadSeed())
const byId = new Map(foods.map((f) => [f.id, f]))

console.log('=== PASS A: present-mineral divergence vs verified USDA record (usda-foundation foods) ===')
let cleanFoods = 0, flaggedFoods = 0, flaggedCells = 0
const rows: string[] = []
for (const id of Object.keys(MATCH)) {
  const food = byId.get(id); const rec = recById.get(MATCH[id])
  if (!food || !rec) { rows.push(`${id} ${food?.name ?? '?'} :: rec missing`); continue }
  const flags: string[] = []
  for (const ourId of Object.keys(MIN)) {
    const m = MIN[+ourId]
    const ov = food.nutrients[ourId]
    if (typeof ov !== 'number' || ov <= 0) continue // absent/zero — not in scope of "present minerals"
    let fv = fdcAmt(rec, m.fdc); if (fv === undefined || fv <= 0) continue
    if (m.x1000) fv = fv * 1000
    const ratio = ov / fv
    const lr = Math.abs(Math.log(ratio))
    if (lr > Math.log(2)) { flags.push(`${m.sym} our=${ov} usda=${Math.round(fv * 100) / 100} ${ratio.toFixed(1)}×${lr > Math.log(3) ? '!!' : ''}`); flaggedCells++ }
  }
  if (flags.length) { flaggedFoods++; rows.push(`⚠ ${food.name} (${id}) <- ${MATCH[id]} "${rec.description}"\n    ${flags.join('  ')}`) }
  else cleanFoods++
}
console.log(rows.join('\n') || '(none)')
console.log(`\nA-SUMMARY: ${cleanFoods} clean, ${flaggedFoods} foods with ≥1 mineral >2× off, ${flaggedCells} suspect cells (of ${Object.keys(MATCH).length} matched foods)`)

console.log('\n=== PASS B: physically-impossible minerals across ALL 406 catalog foods ===')
const catalog = JSON.parse(readFileSync(resolve(__dirname, '../../food-calc/src/shared/data/catalog.json'), 'utf-8')) as any[]
// generous upper bounds (mg unless noted) — exceed only for known extreme foods
const BOUND: Record<number, { max: number; sym: string; note?: string }> = {
  9: { max: 50, sym: 'Fe' }, 10: { max: 600, sym: 'Mg' }, 11: { max: 1500, sym: 'P' },
  12: { max: 2000, sym: 'Ca' }, 13: { max: 2500, sym: 'K' }, 14: { max: 40000, sym: 'Na(salt)' },
  15: { max: 20, sym: 'Zn', note: 'only oysters/wheatgerm exceed' }, 16: { max: 6000, sym: 'Cu(µg)' }, 17: { max: 15000, sym: 'Mn(µg)' },
  18: { max: 3000, sym: 'Se(µg)', note: 'only brazil nut exceeds' },
}
// Category-aware ceilings. Dried spices/herbs concentrate minerals (cinnamon Mn,
// thyme/cumin Fe, tarragon K); organ meats concentrate Cu (liver). These are REAL,
// not corruption — raise the bound for the specific (category, nutrient) pairs so the
// audit stops crying wolf and only surfaces genuine bad cells. Verified vs USDA.
const SPICE_MAX: Record<number, number> = { 9: 100, 10: 700, 13: 4000, 17: 70000 } // Fe Mg K Mn(µg)
const ORGAN_MAX: Record<number, number> = { 16: 12000, 15: 20 } // liver Cu(µg); Zn still capped
// Single foods whose extreme value is genuine (leavening agent = mineral salts; rice bran).
const WHITELIST = new Set([
  'custom-22:11', 'custom-22:12', // разрыхлитель P, Ca — it IS sodium/calcium phosphate
  '2201:10', '2201:11', // отруби рисовые Mg, P — bran really is this high
])
const isSpice = (f: any) => (f.categories ?? []).includes('spice')
const isOrgan = (f: any) => ['meat', 'poultry'].some((c) => (f.categories ?? []).includes(c)) && /печень|почки/i.test(f.name)
const bflags: string[] = []
for (const f of catalog) {
  const n = f.nutrients ?? {}
  for (const ourId of Object.keys(BOUND)) {
    const id = +ourId
    const v = n[ourId]; const b = BOUND[id]
    if (typeof v !== 'number') continue
    if (WHITELIST.has(`${f.id}:${id}`)) continue
    let max = b.max
    if (isSpice(f) && SPICE_MAX[id] !== undefined) max = SPICE_MAX[id]
    else if (isOrgan(f) && ORGAN_MAX[id] !== undefined) max = ORGAN_MAX[id]
    if (v > max) bflags.push(`${f.name} (${f.id}) ${b.sym}=${v} > ${max}${b.note ? ` (${b.note})` : ''}`)
  }
}
console.log(bflags.join('\n') || '(no physically-impossible mineral values)')
console.log(`\nB-SUMMARY: ${bflags.length} impossible-value cells across ${catalog.length} foods`)
