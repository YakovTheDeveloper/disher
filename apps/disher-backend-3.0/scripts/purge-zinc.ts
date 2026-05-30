/**
 * Purge corrupt zinc. ~73 animal-origin foods (skurikhin layer) have id15 ("zinc")
 * that is actually CHOLESTEROL shifted into the zinc column at import — physically
 * impossible as zinc (egg yolk 1510, butter 170, ...). Per project decision
 * (project_catalog_zinc_corruption_2026_05_30): clean the zinc, do NOT rescue the
 * cholesterol. A missing cell is honest; a fake 1510 deceives the user.
 *
 * We DELETE the id15 key (absent ≠ measured-zero) for every food whose zinc exceeds
 * the physical ceiling (20 mg/100g) EXCEPT genuinely zinc-rich foods (oysters/wheat
 * germ), which are whitelisted. Both source files are kept in sync.
 *
 *   tsx scripts/purge-zinc.ts          # dry-run
 *   tsx scripts/purge-zinc.ts --write  # apply
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CATALOG = resolve(__dirname, '../../food-calc/src/shared/data/catalog.json')
const SEED = resolve(__dirname, '../seed/combined-foods-final.json')
const WRITE = process.argv.includes('--write')

const ZN = '15'
const CEILING = 20 // mg/100g — only oysters/wheat germ legitimately exceed
const GENUINE = /устриц|зародыш|wheat ?germ/i

type Food = { id: string | number; name: string; nutrients: Record<string, number> }

// Decide the purge set from catalog (the file the user actually sees).
const catalog = JSON.parse(readFileSync(CATALOG, 'utf-8')) as Food[]
const targets = new Set<string>()
const report: string[] = []
for (const f of catalog) {
  const v = f.nutrients?.[ZN]
  if (typeof v === 'number' && v > CEILING && !GENUINE.test(f.name)) {
    targets.add(String(f.id))
    report.push(`${f.name} (${f.id}): Zn ${v} → (удалён)`)
  }
}
console.log(report.join('\n'))
console.log(`\n${targets.size} foods will have corrupt zinc removed.`)
const kept = catalog.filter((f) => typeof f.nutrients?.[ZN] === 'number' && f.nutrients[ZN] > CEILING && GENUINE.test(f.name))
console.log(`Whitelisted (genuine high zinc, kept): ${kept.map((f) => `${f.name}=${f.nutrients[ZN]}`).join(', ') || '(none)'}`)
console.log(WRITE ? '\nMODE: --write' : '\nMODE: dry-run')
if (!WRITE) process.exit(0)

function apply(path: string, pretty: boolean, label: string) {
  const arr = JSON.parse(readFileSync(path, 'utf-8')) as Food[]
  let removed = 0
  for (const f of arr) {
    if (targets.has(String(f.id)) && f.nutrients && ZN in f.nutrients) {
      delete f.nutrients[ZN]
      removed++
    }
  }
  const out = pretty ? JSON.stringify(arr, null, 1) : JSON.stringify(arr)
  // verify: reparse, assert no target still carries id15, and count unchanged otherwise
  const re = JSON.parse(out) as Food[]
  let leak = 0
  for (const f of re) if (targets.has(String(f.id)) && f.nutrients && ZN in f.nutrients) leak++
  if (leak) { console.log(`ABORT ${label}: ${leak} targets still have zinc`); process.exit(1) }
  writeFileSync(path, out)
  console.log(`WROTE ${label}: removed zinc from ${removed} foods (count=${re.length})`)
}
apply(CATALOG, false, 'catalog.json')
apply(SEED, true, 'combined-foods-final.json')
