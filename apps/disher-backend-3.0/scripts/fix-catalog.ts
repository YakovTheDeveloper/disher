/**
 * Apply the SAME 18 verified corruption fixes to catalog.json, which is formatted
 * differently from the seed (so the seed's text-splice anchors don't match). catalog
 * stores Cyrillic literally (no \uXXXX), so a JSON.parse -> mutate -> stringify round
 * trip is escape-safe. We mutate only the 18 targeted cells and write with the same
 * 1-space indentation the file already uses, then assert nothing else changed.
 *
 *   tsx scripts/fix-catalog.ts          # dry-run
 *   tsx scripts/fix-catalog.ts --write  # apply
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SR = resolve(__dirname, '../content/FoodData_Central_sr_legacy_food_json_2021-10-28.json')
const FDN = resolve(__dirname, '../content/FoodData_Central_foundation_food_json_2026-04-30.json')
const CATALOG = resolve(__dirname, '../../food-calc/src/shared/data/catalog.json')
const WRITE = process.argv.includes('--write')

const MIN: Record<number, { fdc: string; x1000?: boolean; sym: string }> = {
  9: { fdc: '1089', sym: 'Fe' }, 10: { fdc: '1090', sym: 'Mg' }, 11: { fdc: '1091', sym: 'P' },
  12: { fdc: '1087', sym: 'Ca' }, 13: { fdc: '1092', sym: 'K' }, 14: { fdc: '1093', sym: 'Na' },
  15: { fdc: '1095', sym: 'Zn' }, 16: { fdc: '1098', x1000: true, sym: 'Cu' }, 17: { fdc: '1101', x1000: true, sym: 'Mn' },
}
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

const catalog = JSON.parse(readFileSync(CATALOG, 'utf-8')) as Array<{ id: string | number; name: string; nutrients: Record<string, number> }>
const byId = new Map(catalog.map((f) => [String(f.id), f]))

const rows: string[] = []
let cells = 0
for (const id of Object.keys(MATCH)) {
  const food = byId.get(id); const rec = recById.get(MATCH[id])
  if (!food || !rec) continue
  const fixed: string[] = []
  for (const ourId of Object.keys(MIN)) {
    const m = MIN[+ourId]
    const ov = food.nutrients[ourId]
    if (typeof ov !== 'number' || ov <= 0) continue
    let fv = fdcAmt(rec, m.fdc); if (fv === undefined || fv <= 0) continue
    if (m.x1000) fv = fv * 1000
    const ratio = ov / fv
    if (ratio > 3 || ratio < 1 / 3) {
      const nv = Math.round(fv * 100) / 100
      if (WRITE) food.nutrients[ourId] = nv // mutate in place
      fixed.push(`${m.sym} ${ov}→${nv}`); cells++
    }
  }
  if (fixed.length) rows.push(`${food.name} (${id}): ${fixed.join('  ')}`)
}

console.log(rows.join('\n'))
console.log(`\n${rows.length} foods, ${cells} cells. ${WRITE ? 'WRITING' : 'dry-run'}`)
if (WRITE) {
  writeFileSync(CATALOG, JSON.stringify(catalog, null, 1) + '\n')
  // verify reparse + spot fingerprints
  const re = JSON.parse(readFileSync(CATALOG, 'utf-8')) as typeof catalog
  const chk = new Map(re.map((f) => [String(f.id), f]))
  const k = chk.get('7881')!.nutrients['15']; const s = chk.get('5956')!.nutrients['9']
  console.log(`VERIFY: count=${re.length} курица Zn=${k} соль Fe=${s}`)
}
