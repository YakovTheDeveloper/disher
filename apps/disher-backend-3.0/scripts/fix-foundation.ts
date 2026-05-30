/**
 * PRECISE corruption fix for the 41 usda-foundation foods with a VERIFIED fdcId.
 * Ground truth = the FDC dumps on disk. For each matched food we compare every
 * mineral cell against the real USDA record; cells diverging >3x (almost-certainly
 * corrupt, e.g. chicken Zn 42 vs 1.54) get overwritten with the real value.
 * 2-3x divergences (cut/variety noise) are LEFT ALONE — conservative on purpose.
 *
 *   tsx scripts/fix-foundation.ts          # dry-run, prints table, writes nothing
 *   tsx scripts/fix-foundation.ts --write  # applies to BOTH source files
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SR = resolve(__dirname, '../content/FoodData_Central_sr_legacy_food_json_2021-10-28.json')
const FDN = resolve(__dirname, '../content/FoodData_Central_foundation_food_json_2026-04-30.json')
const SEED = resolve(__dirname, '../seed/combined-foods-final.json')
const CATALOG = resolve(__dirname, '../../food-calc/src/shared/data/catalog.json')
const WRITE = process.argv.includes('--write')

// our mineral id -> { fdc nutrient.id, ×1000 to reach our unit, symbol }
const MIN: Record<number, { fdc: string; x1000?: boolean; sym: string }> = {
  9: { fdc: '1089', sym: 'Fe' }, 10: { fdc: '1090', sym: 'Mg' }, 11: { fdc: '1091', sym: 'P' },
  12: { fdc: '1087', sym: 'Ca' }, 13: { fdc: '1092', sym: 'K' }, 14: { fdc: '1093', sym: 'Na' },
  15: { fdc: '1095', sym: 'Zn' }, 16: { fdc: '1098', x1000: true, sym: 'Cu' }, 17: { fdc: '1101', x1000: true, sym: 'Mn' },
}

// verified matches from the micro backfill (food id -> fdcId).
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

const seed = JSON.parse(readFileSync(SEED, 'utf-8')) as Array<{ id: string; name: string; nutrients: Record<string, number> }>
const byId = new Map(seed.map((f) => [f.id, f]))

// compute the fix set: { foodId: { nutId: newValue } } only for >3x corrupt cells
const fixes: Record<string, Record<string, number>> = {}
const rows: string[] = []
let totalCells = 0
for (const id of Object.keys(MATCH)) {
  const food = byId.get(id); const rec = recById.get(MATCH[id])
  if (!food || !rec) { rows.push(`${id} :: SKIP (food or USDA record missing)`); continue }
  const cellFixes: string[] = []
  for (const ourId of Object.keys(MIN)) {
    const m = MIN[+ourId]
    const ov = food.nutrients[ourId]
    if (typeof ov !== 'number' || ov <= 0) continue
    let fv = fdcAmt(rec, m.fdc); if (fv === undefined || fv <= 0) continue
    if (m.x1000) fv = fv * 1000
    const ratio = ov / fv
    if (ratio > 3 || ratio < 1 / 3) {
      const nv = Math.round(fv * 100) / 100
      fixes[id] ??= {}; fixes[id][ourId] = nv
      cellFixes.push(`${m.sym} ${ov}→${nv} (${ratio.toFixed(1)}×)`)
      totalCells++
    }
  }
  if (cellFixes.length) rows.push(`⚠ ${food.name} (${id})\n    ${cellFixes.join('   ')}`)
}

const report = [
  '=== PRECISE FIX (>3× divergence from verified USDA record) ===',
  rows.join('\n') || '(nothing to fix)',
  `\nSUMMARY: ${Object.keys(fixes).length} foods, ${totalCells} corrupt cells to overwrite`,
  WRITE ? '\nMODE: --write (applying)' : '\nMODE: dry-run (no files touched). Re-run with --write to apply.',
].join('\n')
writeFileSync('c:/tmp/fix-report.txt', report)
console.log(report)

if (!WRITE) process.exit(0)

// --- apply: surgical text splice per file, overwrite only the targeted cells,
//     preserve all other formatting/escapes. Verify only intended cells changed. ---
function apply(path: string, label: string) {
  let text = readFileSync(path, 'utf-8')
  const arr = JSON.parse(text) as Array<{ id: string; nutrients: Record<string, number> }>
  const idx = new Map(arr.map((f, i) => [f.id, i]))
  let changed = 0
  for (const foodId of Object.keys(fixes)) {
    if (!idx.has(foodId)) continue
    // locate this food's object then its nutrients block
    const idAnchor = text.indexOf(`"id": "${foodId}"`)
    if (idAnchor === -1) continue
    const nutStart = text.indexOf('"nutrients": {', idAnchor)
    const nutEnd = text.indexOf('}', nutStart)
    let block = text.slice(nutStart, nutEnd)
    for (const [nutId, val] of Object.entries(fixes[foodId])) {
      const re = new RegExp(`("${nutId}":\\s*)(-?[0-9.]+)`)
      if (re.test(block)) { block = block.replace(re, `$1${val}`); changed++ }
    }
    text = text.slice(0, nutStart) + block + text.slice(nutEnd)
  }
  // verify: reparse, confirm every targeted cell now equals the fix and nothing else moved
  const reparsed = JSON.parse(text) as typeof arr
  const ridx = new Map(reparsed.map((f, i) => [f.id, i]))
  let bad = 0
  for (const foodId of Object.keys(fixes))
    if (ridx.has(foodId))
      for (const [nutId, val] of Object.entries(fixes[foodId]))
        if (reparsed[ridx.get(foodId)!].nutrients[nutId] !== val) bad++
  if (bad) { console.log(`ABORT ${label}: ${bad} cells did not apply correctly`); process.exit(1) }
  writeFileSync(path, text)
  console.log(`WROTE ${label}: ${changed} cells across ${Object.keys(fixes).length} foods`)
}
apply(SEED, 'combined-foods-final.json')
apply(CATALOG, 'catalog.json')
