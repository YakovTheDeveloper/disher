/**
 * Final zinc fix for the 18 reviewed problem foods. Values decided WITH the user:
 * verified-species where USDA has the raw record; nearest-type approximation for
 * Russian fish absent from USDA (вобла/лещ/карась/навага — flagged 'approx');
 * cod liver hand-entered (2.4 mg, EU tables — no USDA raw cod-liver record).
 * Writes zinc (id15) only, to BOTH catalog.json (compact) and the seed (pretty).
 *
 *   tsx scripts/zinc-final.ts          # dry-run
 *   tsx scripts/zinc-final.ts --write
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CATALOG = resolve(__dirname, '../../food-calc/src/shared/data/catalog.json')
const SEED = resolve(__dirname, '../seed/combined-foods-final.json')
const WRITE = process.argv.includes('--write')
const ZN = '15'

// name -> { zinc, basis }. basis = where it came from (for the report/provenance).
const FINAL: Record<string, { z: number; basis: string }> = {
  'белок': { z: 0.03, basis: 'Egg, white, raw' },
  'зубатка': { z: 0.78, basis: 'Fish, wolffish, Atlantic, raw' },
  'камбала': { z: 0.32, basis: 'Fish, flatfish (flounder/sole), raw' },
  'карась': { z: 1.48, basis: 'carp (approx — crucian carp нет в USDA)' },
  'навага': { z: 0.45, basis: 'Fish, cod, Atlantic, raw (approx — saffron cod нет)' },
  'окунь морской': { z: 0.29, basis: 'Fish, ocean perch, Atlantic, raw' },
  'окунь речной': { z: 1.11, basis: 'Fish, perch, mixed species, raw' },
  'охотничьи колбаски': { z: 1.31, basis: 'Sausage, smoked link, pork/beef' },
  'сазан': { z: 1.48, basis: 'Fish, carp, raw (wild carp — точно)' },
  'ставрида': { z: 0.67, basis: 'Fish, mackerel, jack, raw' },
  'судак': { z: 0.62, basis: 'Fish, pike, walleye, raw (= судак)' },
  'лещ': { z: 1.48, basis: 'carp (approx — bream нет в USDA)' },
  'хек': { z: 0.88, basis: 'Fish, whiting, raw (hake family)' },
  'кабан': { z: 2.4, basis: 'pork (approx — boar raw без цинка)' },
  'кролик': { z: 1.57, basis: 'Game meat, rabbit, domesticated, raw' },
  'почки свиные': { z: 2.75, basis: 'Pork, kidneys, raw' },
  'вобла': { z: 0.45, basis: 'lean white fish (approx — roach нет в USDA)' },
  'печень трески': { z: 2.4, basis: 'ручной ввод (EU-таблицы — нет USDA raw cod liver)' },
}

function apply(path: string, pretty: boolean, label: string) {
  const arr = JSON.parse(readFileSync(path, 'utf-8')) as Array<{ name: string; nutrients: Record<string, number> }>
  const byName = new Map(arr.map((f) => [f.name, f]))
  let w = 0; const miss: string[] = []
  for (const [name, { z }] of Object.entries(FINAL)) {
    const f = byName.get(name)
    if (!f || !f.nutrients) { miss.push(name); continue }
    if (WRITE) f.nutrients[ZN] = z
    w++
  }
  if (miss.length) console.log(`  ${label}: НЕ найдены: ${miss.join(', ')}`)
  if (WRITE) { const out = pretty ? JSON.stringify(arr, null, 1) : JSON.stringify(arr); JSON.parse(out); writeFileSync(path, out) }
  console.log(`${WRITE ? 'WROTE' : 'would write'} ${label}: ${w}/${Object.keys(FINAL).length} foods`)
}

console.log('=== ФИНАЛ ЦИНКА (18 продуктов) ===')
for (const [name, { z, basis }] of Object.entries(FINAL)) console.log(`  ${name}: Zn=${z}  ← ${basis}`)
console.log()
apply(CATALOG, false, 'catalog.json')
apply(SEED, true, 'combined-foods-final.json')
console.log(WRITE ? '\n✅ записано' : '\n(dry-run, добавь --write)')
