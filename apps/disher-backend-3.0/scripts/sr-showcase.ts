import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MAP } from './micro-tool'
const __dirname = dirname(fileURLToPath(import.meta.url))
const SR = resolve(__dirname, '../content/FoodData_Central_sr_legacy_food_json_2021-10-28.json')
const FDN = resolve(__dirname, '../content/FoodData_Central_foundation_food_json_2026-04-30.json')
const seed = JSON.parse(readFileSync(resolve(__dirname, '../seed/combined-foods-final.json'), 'utf-8')) as any[]
const sr = (JSON.parse(readFileSync(SR, 'utf-8')).SRLegacyFoods as any[]).filter((f) => f && Array.isArray(f.foodNutrients))
const fdn = (JSON.parse(readFileSync(FDN, 'utf-8')).FoundationFoods as any[]).filter((f) => f && Array.isArray(f.foodNutrients))
const srById = new Map(sr.map((f) => [f.fdcId, f]))
const fdnById = new Map(fdn.map((f) => [f.fdcId, f]))
const payload = JSON.parse(readFileSync(resolve(__dirname, '../seed/micro-backfill-payload.json'), 'utf-8'))
const srcLog = JSON.parse(readFileSync('c:/tmp/sr-srclog.json', 'utf-8'))
const srChosen = JSON.parse(readFileSync('c:/tmp/sr-chosen.json', 'utf-8'))
const fdnChosen = JSON.parse(readFileSync('c:/tmp/match-chosen.json', 'utf-8'))
const U: Record<number, string> = { 9: 'мг', 10: 'мг', 11: 'мг', 12: 'мг', 13: 'мг', 14: 'мг', 15: 'мг', 16: 'мкг', 17: 'мкг', 18: 'мкг', 19: 'мкг', 20: 'мкг', 21: 'мг', 22: 'мг', 23: 'мг', 24: 'мг', 25: 'мг', 26: 'мг', 27: 'мкг', 28: 'мкг', 29: 'мкг', 30: 'мг', 31: 'мкг', 32: 'мг', 33: 'мкг', 34: 'мкг', 35: 'мкг' }
const SYM: Record<number, string> = { 9: 'Fe', 10: 'Mg', 11: 'P', 12: 'Ca', 13: 'K', 14: 'Na', 15: 'Zn', 16: 'Cu', 17: 'Mn', 18: 'Se', 19: 'I', 20: 'A', 21: 'B1', 22: 'B2', 23: 'B3', 24: 'B4', 25: 'B5', 26: 'B6', 27: 'B7', 28: 'B9', 29: 'B12', 30: 'C', 31: 'D', 32: 'E', 33: 'K1', 34: 'βC', 35: 'αC' }
const ourToFdc: Record<number, string> = {}
for (const num of Object.keys(MAP)) ourToFdc[MAP[num].our] = num
function rawOf(rec: any, fdcNumId: string) { for (const n of rec.foodNutrients) if (String(n?.nutrient?.id) === fdcNumId && typeof n.amount === 'number') return n.amount; return undefined }
const out: string[] = []
for (const id of process.argv.slice(2)) {
  const food = seed.find((f) => f.id === id)
  const srC = srChosen[id]; const fdnC = fdnChosen[id]
  out.push(`\n### ${food.name} (${id})`)
  out.push(`   SR  ${srC ? srC.fdcId + ' "' + srC.desc + '"' : '(skip)'}`)
  out.push(`   FDN ${fdnC ? fdnC.fdcId + ' "' + fdnC.desc + '"' : '-'} (biotin fallback)`)
  const adds = payload[id] || {}
  for (const k of Object.keys(adds).sort((a, b) => +a - +b)) {
    const oid = +k; const s = srcLog[id][k]
    const rec = s === 'SR' ? srById.get(srC.fdcId) : fdnById.get(fdnC.fdcId)
    const raw = rec ? rawOf(rec, ourToFdc[oid]) : '?'
    const x = MAP[ourToFdc[oid]]?.x1000 ? ' ×1000' : ''
    out.push(`   +${SYM[oid]}(${oid}) = ${adds[k]} ${U[oid]}   [${s} raw=${raw}${x}]`)
  }
  // show a couple of PRESENT cells that were correctly left untouched
  const present = [9, 12, 13, 20, 30, 34].filter((i) => food.nutrients[String(i)] !== undefined).map((i) => `${SYM[i]}=${food.nutrients[String(i)]}`)
  out.push(`   (kept: ${present.join(' ')})`)
}
writeFileSync('c:/tmp/sr-showcase.txt', out.join('\n'))
console.log('showcase written')
