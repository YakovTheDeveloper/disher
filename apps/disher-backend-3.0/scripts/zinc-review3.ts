/**
 * Human-review v3: for each problem food, SEARCH SR Legacy for raw records of the
 * right species (no hardcoded fdcIds — those were garbage). Show the single best raw
 * candidate + its profile so the user verifies the species. Read-only.
 *
 *   tsx scripts/zinc-review3.ts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SR = resolve(__dirname, '../content/FoodData_Central_sr_legacy_food_json_2021-10-28.json')
const CATALOG = resolve(__dirname, '../../food-calc/src/shared/data/catalog.json')

const sr = (JSON.parse(readFileSync(SR, 'utf-8')).SRLegacyFoods as any[]).filter((f) => f && Array.isArray(f.foodNutrients))
const amt = (f: any, id: string) => { for (const n of f.foodNutrients || []) if (String(n?.nutrient?.id) === id && typeof n.amount === 'number') return n.amount; return null }
const OUR = { kcal: '7', prot: '1', fat: '2', Ca: '12', Na: '14', Zn: '15' }
const FDC = { kcal: '1008', prot: '1003', fat: '1004', Ca: '1087', Na: '1093', Zn: '1095' }

// search terms per problem food: tokens that must appear, prefer raw, avoid prep
const Q: Record<string, string[]> = {
  'белок': ['egg', 'white'],
  'вобла': ['roe'],
  'зубатка': ['wolffish'],
  'камбала': ['flatfish'],
  'карась': ['carp'],
  'навага': ['cod', 'atlantic'],
  'окунь морской': ['ocean', 'perch'],
  'окунь речной': ['perch', 'mixed'],
  'охотничьи колбаски': ['sausage', 'smoked'],
  'сазан': ['carp'],
  'ставрида': ['mackerel', 'jack'],
  'судак': ['walleye'],
  'лещ': ['fish', 'raw'], // bream has no US record; show generic lean fish options
  'хек': ['whiting'],
  'кабан': ['boar'],
  'кролик': ['rabbit'],
  'почки свиные': ['pork', 'kidney'],
  'печень трески': ['cod', 'liver'],
}
const NEG = ['cooked', 'boiled', 'fried', 'baked', 'breaded', 'battered', 'canned', 'smoked', 'dried', 'floured', 'broiled']

const catalog = JSON.parse(readFileSync(CATALOG, 'utf-8')) as Array<{ id: string; name: string; nutrients: Record<string, number> }>
const byName = new Map(catalog.map((f) => [f.name, f]))

function candidates(tokens: string[], wantRaw = true) {
  return sr.map((f) => {
    const d = (f.description || '').toLowerCase()
    if (!tokens.every((t) => d.includes(t))) return null
    let s = 0
    if (d.includes('raw')) s += 5
    for (const ng of NEG) if (d.includes(ng)) s -= 3
    s -= d.length * 0.01
    return { f, s }
  }).filter(Boolean).sort((a: any, b: any) => b.s - a.s) as { f: any; s: number }[]
}

const out: string[] = ['=== СВЕРКА v3: поиск СЫРОЙ видовой записи по названию ===',
  'Показан лучший сырой кандидат + до 2 альтернатив. Скажи ВЕРНО/НЕВЕРНО по каждому.\n']
for (const name of Object.keys(Q)) {
  const our = byName.get(name); if (!our) continue
  const o = (k: keyof typeof OUR) => our.nutrients[OUR[k]] ?? '—'
  const cands = candidates(Q[name])
  if (!cands.length) { out.push(`❓ ${name}: кандидатов не найдено (наш: ккал=${o('kcal')} белок=${o('prot')} жир=${o('fat')})`); continue }
  const best = cands[0].f
  const c = (k: keyof typeof FDC, f = best) => { const v = amt(f, FDC[k]); return v === null ? '—' : Math.round(v * 100) / 100 }
  const okk = typeof o('kcal') === 'number' && typeof c('kcal') === 'number' && Math.abs(Math.log((c('kcal') as number) / (o('kcal') as number))) < 0.4
  const block = [
    `${okk ? '✓' : '⚠'} ${name}`,
    `   наш:    ккал=${o('kcal')} белок=${o('prot')} жир=${o('fat')} Ca=${o('Ca')} Na=${o('Na')} Zn=${o('Zn') ?? '—'}`,
    `   USDA →  "${best.description}"  ккал=${c('kcal')} белок=${c('prot')} жир=${c('fat')} Zn=${c('Zn')}`,
  ]
  for (const alt of cands.slice(1, 3)) block.push(`      альт: "${alt.f.description}"  ккал=${c('kcal', alt.f)} Zn=${c('Zn', alt.f)}`)
  out.push(block.join('\n'))
}
writeFileSync('c:/tmp/zinc-review3.txt', out.join('\n\n'))
console.log(out.join('\n\n'))
