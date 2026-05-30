/**
 * Compose the FINAL backfill payload from the INDEPENDENT verification verdicts
 * (scripts/verify-workflow.js output), NOT from my own matcher. For each accepted
 * food we use the verifier's chosen fdcId, recompute fills deterministically
 * (absent cells only, unit-checked, Cu/Mn ×1000), and DROP every suspectSymbol
 * the verifier flagged. Rejected / no-verdict foods are left empty (no fabrication).
 *
 *   tsx scripts/micro-compose.ts            -> payload + readable before/after table
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MAP, loadSeed, foundationFoods } from './micro-tool'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SR = resolve(__dirname, '../content/FoodData_Central_sr_legacy_food_json_2021-10-28.json')
const FDN = resolve(__dirname, '../content/FoodData_Central_foundation_food_json_2026-04-30.json')

const present = (v: unknown) => v !== undefined && v !== null
const norm = (u: string) => (u || '').toLowerCase().replace('μ', 'µ')

const SYM: Record<number, string> = { 9: 'Fe', 10: 'Mg', 11: 'P', 12: 'Ca', 13: 'K', 14: 'Na', 15: 'Zn', 16: 'Cu', 17: 'Mn', 18: 'Se', 19: 'I', 20: 'A', 21: 'B1', 22: 'B2', 23: 'B3', 24: 'B4', 25: 'B5', 26: 'B6', 27: 'B7', 28: 'B9', 29: 'B12', 30: 'C', 31: 'D', 32: 'E', 33: 'K1', 34: 'bCar', 35: 'aCar' }
const U: Record<number, string> = { 9: 'мг', 10: 'мг', 11: 'мг', 12: 'мг', 13: 'мг', 14: 'мг', 15: 'мг', 16: 'мкг', 17: 'мкг', 18: 'мкг', 19: 'мкг', 20: 'мкг', 21: 'мг', 22: 'мг', 23: 'мг', 24: 'мг', 25: 'мг', 26: 'мг', 27: 'мкг', 28: 'мкг', 29: 'мкг', 30: 'мг', 31: 'мкг', 32: 'мг', 33: 'мкг', 34: 'мкг', 35: 'мкг' }
const symToOur: Record<string, number> = {}
for (const k of Object.keys(SYM)) symToOur[SYM[+k]] = +k

// Verifier verdicts (from wu7ob3y9d). fdcId + symbols to DROP as implausible.
const ACCEPTED: Array<{ id: string; fdcId: number; drop?: string[] }> = [
  { id: '4185', fdcId: 171697 }, { id: '7811', fdcId: 175202 }, { id: '7861', fdcId: 170569 },
  { id: '2867', fdcId: 170379 }, { id: '3176', fdcId: 170688 }, { id: '2774', fdcId: 170286 },
  { id: '7838', fdcId: 169382 }, { id: '2214', fdcId: 169726 }, { id: '1580', fdcId: 169092 },
  { id: '3772', fdcId: 171284 }, { id: '2463', fdcId: 169975 }, { id: '2465', fdcId: 169977 },
  { id: '909', fdcId: 168421, drop: ['B4'] }, { id: '3079', fdcId: 170591 }, { id: '250', fdcId: 2346409 },
  { id: '7959', fdcId: 173698 }, { id: '4824', fdcId: 172336 }, { id: '7841', fdcId: 2257045 },
  { id: '7703', fdcId: 1999630 }, { id: '7845', fdcId: 170568 }, { id: '7846', fdcId: 169741 },
  { id: '2402', fdcId: 169914 }, { id: '7865', fdcId: 173756 }, { id: '7849', fdcId: 173904 },
  { id: '897', fdcId: 168409 }, { id: '2670', fdcId: 170182 }, { id: '2666', fdcId: 170178 },
  { id: '3069', fdcId: 170581 }, { id: '2905', fdcId: 170417 }, { id: '7843', fdcId: 2258590 },
  { id: '1618', fdcId: 169130, drop: ['K1'] }, { id: '2190', fdcId: 169702 },
  { id: '2863', fdcId: 170375, drop: ['B4'] }, { id: '3044', fdcId: 170556 }, { id: '3042', fdcId: 170554 },
  { id: '1902', fdcId: 169414 }, { id: '7853', fdcId: 2346404 }, { id: '5956', fdcId: 173468 },
  { id: '7810', fdcId: 173744 }, { id: '7814', fdcId: 173734 },
  // курица: 171052 "Chicken, broilers or fryers, meat only, raw" — canonical generic raw chicken.
  // K-fingerprint decisive: our K=252 ≈ meat-only 229 vs ground 522 (verify-chicken's P-only pick
  // 171116 didn't discriminate: P 178 vs 173). User-confirmed 2026-05-30. Zn present (corrupt 42, untouched).
  { id: '7881', fdcId: 171052 },
]
const REJECTED: Record<string, string> = {
  // user-confirmed skip 2026-05-30: only candidate is whole-groat flour (Mg/K ~2.3× richer than our
  // light/sifted flour) → its B-vitamins (bran-concentrated) would overestimate ~2×. Leave empty (honest).
  '3175': 'мука гречневая: whole-groat 170687 ~2.3× richer minerals — wrong grade, B-vits would overestimate ~2×',
  // Foundation 2515382 "Flour, coconut" IS the source (minerals byte-for-byte 1.00×), but it carries
  // only minerals (already present) → 0 new vitamin cells; no SR coconut-flour record exists. Nothing to fill.
  '7863': 'мука кокосовая: source 2515382 confirmed but minerals-only (already filled), 0 new cells, no SR alt',
}

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
const payload: Record<string, Record<string, number>> = {}
const table: string[] = []
const unitFlags: string[] = []
let total = 0

for (const acc of ACCEPTED) {
  const food = byOurId.get(acc.id)!
  const rec = recById.get(acc.fdcId)
  if (!rec) { table.push(`${food.name} :: REC ${acc.fdcId} NOT FOUND`); continue }
  const drop = new Set((acc.drop ?? []).map((s) => symToOur[s]))
  const adds: Record<string, number> = {}
  const dropped: string[] = []
  for (const num of Object.keys(MAP)) {
    const { our, unit, x1000 } = MAP[num]
    if (present(food.nutrients[String(our)])) continue // non-lossy
    const a = amt(rec, num)
    if (!a || a.v <= 0) continue // absent / real zero
    if (norm(a.u) !== norm(unit)) { unitFlags.push(`${food.name} ${SYM[our]} ${a.u}!=${unit}`); continue }
    if (drop.has(our)) { dropped.push(SYM[our]); continue } // verifier flagged implausible
    adds[String(our)] = Math.round((x1000 ? a.v * 1000 : a.v) * 10000) / 10000
  }
  const n = Object.keys(adds).length
  if (n) { payload[acc.id] = adds; total += n }
  const addStr = Object.keys(adds).sort((a, b) => +a - +b).map((k) => `${SYM[+k]}=${adds[k]}${U[+k]}`).join(' ')
  table.push(`${food.name} (${acc.id}) <- ${acc.fdcId} "${rec.description}"  +${n}${dropped.length ? ` [drop ${dropped.join(',')}]` : ''}\n    ${addStr}`)
}
for (const id of Object.keys(REJECTED)) table.push(`SKIP ${REJECTED[id]}`)

writeFileSync(resolve(__dirname, '../seed/micro-backfill-payload.json'), JSON.stringify(payload, null, 2))
writeFileSync('c:/tmp/compose-table.txt', table.join('\n'))
if (unitFlags.length) writeFileSync('c:/tmp/compose-unitflags.txt', unitFlags.join('\n'))
console.log(`compose: ${Object.keys(payload).length} foods, ${total} cells, unitFlags=${unitFlags.length}, rejected=${Object.keys(REJECTED).length}`)
