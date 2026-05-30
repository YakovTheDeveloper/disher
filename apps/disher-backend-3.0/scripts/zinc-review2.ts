/**
 * Human-review table v2: map each problematic animal food to a RAW species record
 * (SR Legacy / Foundation) — correct profile (raw≈raw), unlike FNDDS NFS which is
 * contaminated by frying. Shows full nutrient snapshot so the user can verify the
 * SPECIES is right before we replace zinc. Read-only.
 *
 *   tsx scripts/zinc-review2.ts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SR = resolve(__dirname, '../content/FoodData_Central_sr_legacy_food_json_2021-10-28.json')
const FDN = resolve(__dirname, '../content/FoodData_Central_foundation_food_json_2026-04-30.json')
const CATALOG = resolve(__dirname, '../../food-calc/src/shared/data/catalog.json')

const sr = (JSON.parse(readFileSync(SR, 'utf-8')).SRLegacyFoods as any[]).filter((f) => f && Array.isArray(f.foodNutrients))
const fdn = (JSON.parse(readFileSync(FDN, 'utf-8')).FoundationFoods as any[]).filter((f) => f && Array.isArray(f.foodNutrients))
const pool = [...sr, ...fdn]
const byFdc = new Map<number, any>(pool.map((f) => [f.fdcId, f]))
const amt = (f: any, id: string) => { if (!f) return null; for (const n of f.foodNutrients || []) if (String(n?.nutrient?.id) === id && typeof n.amount === 'number') return n.amount; return null }

const OUR = { kcal: '7', prot: '1', fat: '2', Ca: '12', Na: '14', Zn: '15' }
const FDC = { kcal: '1008', prot: '1003', fat: '1004', Ca: '1087', Na: '1093', Zn: '1095' }

// Pinned RAW species records (fdcId) chosen for the 18 problem foods. RU -> fdcId.
// Picked from SR Legacy raw entries; user verifies the species is right.
const PIN: Record<string, number> = {
  'белок': 173424,        // Egg, white, raw, fresh
  'вобла': 175176,        // Fish, roe, mixed species, raw (dried roach ~ roe/lean)
  'зубатка': 173687,      // Fish, wolffish, Atlantic, raw
  'камбала': 173638,      // Fish, flatfish (flounder/sole), raw
  'карась': 173695,       // Fish, carp, raw (crucian carp)
  'навага': 173701,       // Fish, cod, Atlantic, raw
  'окунь морской': 173708,// Fish, ocean perch, Atlantic, raw
  'окунь речной': 173711, // Fish, perch, mixed species, raw
  'охотничьи колбаски': 174581, // Sausage, smoked link, pork/beef
  'сазан': 173695,        // Fish, carp, raw
  'ставрида': 175119,     // Fish, mackerel, jack, raw
  'судак': 173715,        // Fish, pike, walleye, raw
  'лещ': 173703,          // Fish, fish portions/sticks? -> use generic lean: ocean perch raw
  'хек': 173669,          // Fish, whiting, mixed, raw (hake family)
  'кабан': 167560,        // Game meat, boar, wild, raw
  'кролик': 174374,       // Rabbit, domesticated, composite, raw
  'почки свиные': 167846, // Pork, kidneys, raw
  'печень трески': 173702,// Fish, cod, Atlantic, raw (liver -> flag; profile won't match)
}
const PROBLEM = new Set(Object.keys(PIN))

const catalog = JSON.parse(readFileSync(CATALOG, 'utf-8')) as Array<{ id: string; name: string; nutrients: Record<string, number> }>
const byName = new Map(catalog.map((f) => [f.name, f]))

function line(name: string): string {
  const our = byName.get(name)!
  const fdcId = PIN[name]
  const cand = byFdc.get(fdcId)
  const o = (k: keyof typeof OUR) => our.nutrients[OUR[k]] ?? '—'
  if (!cand) return `🔴 ${name} → fdc ${fdcId}: ЗАПИСЬ НЕ НАЙДЕНА В ДАМПЕ`
  const c = (k: keyof typeof FDC) => { const v = amt(cand, FDC[k]); return v === null ? '—' : Math.round(v * 100) / 100 }
  // profile match flag: kcal within 40%?
  const ok = typeof o('kcal') === 'number' && typeof c('kcal') === 'number' && Math.abs(Math.log((c('kcal') as number) / (o('kcal') as number))) < 0.4
  return [
    `${ok ? '✓' : '⚠'} ${name}  →  "${cand.description}"  (Zn=${c('Zn')})`,
    `      наш:  ккал=${o('kcal')} белок=${o('prot')} жир=${o('fat')} Ca=${o('Ca')} Na=${o('Na')}`,
    `      USDA: ккал=${c('kcal')} белок=${c('prot')} жир=${c('fat')} Ca=${c('Ca')} Na=${c('Na')}`,
  ].join('\n')
}

const names = [...PROBLEM].filter((n) => byName.has(n)).sort()
const out = ['=== СВЕРКА v2: проблемные → СЫРАЯ видовая запись USDA (профиль сходится) ===',
  '✓ = профиль (ккал) сошёлся, вид скорее верный.  ⚠ = профиль разошёлся, посмотри внимательно.',
  'Скажи по каждому: ВЕРНО / НЕВЕРНО (и чем заменить).\n',
  ...names.map(line)]
writeFileSync('c:/tmp/zinc-review2.txt', out.join('\n\n'))
console.log(`Готово: ${names.length} проблемных продуктов → таблица`)
console.log(out.join('\n\n'))
