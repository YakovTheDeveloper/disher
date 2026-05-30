/**
 * Build a human-review table mapping each problematic animal food to a candidate
 * USDA GENERIC ("NFS") product — same idea as Cheese, NFS. Shows the candidate's
 * full nutrient snapshot so the user can eyeball whether the match is right BEFORE
 * we replace. Read-only; writes nothing to the catalog.
 *
 *   tsx scripts/zinc-review.ts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FNDDS = resolve(__dirname, '../content/surveyDownload.json')
const SR = resolve(__dirname, '../content/FoodData_Central_sr_legacy_food_json_2021-10-28.json')
const CATALOG = resolve(__dirname, '../../food-calc/src/shared/data/catalog.json')

const S = JSON.parse(readFileSync(FNDDS, 'utf-8'))
const fndds = (S.SurveyFoods || S.surveyFoods || []) as any[]
const sr = (JSON.parse(readFileSync(SR, 'utf-8')).SRLegacyFoods as any[]).filter((f) => f && Array.isArray(f.foodNutrients))
const byDesc = (q: string) => fndds.find((f) => (f.description || '').toLowerCase() === q.toLowerCase())
const amt = (f: any, id: string) => { if (!f) return null; for (const n of f.foodNutrients || []) if (String(n?.nutrient?.id) === id && typeof n.amount === 'number') return n.amount; return null }

// our nutrient ids
const OUR = { kcal: '7', prot: '1', fat: '2', Ca: '12', Fe: '9', Na: '14', Zn: '15', K: '13', P: '11' }
// fdc ids
const FDC = { kcal: '1008', prot: '1003', fat: '1004', Ca: '1087', Fe: '1089', Na: '1093', Zn: '1095', K: '1092', P: '1091' }

// The proposed UNIVERSAL (NFS-generic) match per our food. NFS where it makes sense,
// else the closest single generic. This is the table the user reviews.
// Map to SPECIES-specific NFS where it exists (raw-ish, correct profile), NOT the
// generic "Fish, NFS" which is contaminated by fried/breaded prep (238 kcal).
// Available species NFS: cod, perch, flounder, mackerel, salmon, catfish, trout,
// tuna, bass, haddock, tilapia, whiting, white. Plus Shrimp/Clams/Shellfish NFS.
const PROPOSED: Record<string, string> = {
  // 🔴 problematic — these are the ones to scrutinize
  'белок': 'Egg, NFS',
  'вобла': 'Fish, white, mixed species, NFS', // dried roach ~ lean white fish
  'зубатка': 'Fish, white, mixed species, NFS',
  'камбала': 'Fish, flounder, NFS',
  'карась': 'Fish, catfish, NFS', // crucian carp ~ catfish (freshwater bottom)
  'навага': 'Fish, cod, NFS', // navaga IS a cod-family fish
  'окунь морской': 'Fish, perch, NFS',
  'окунь речной': 'Fish, perch, NFS',
  'охотничьи колбаски': 'Sausage, NFS',
  'сазан': 'Fish, catfish, NFS', // wild carp
  'ставрида': 'Fish, mackerel, NFS', // horse mackerel
  'судак': 'Fish, perch, NFS', // zander ~ perch family
  'лещ': 'Fish, white, mixed species, NFS',
  'хек': 'Fish, whiting, NFS', // hake ~ whiting (same family)
  'кабан': 'Pork, NFS', // wild boar ~ pork
  'кролик': 'Chicken, NFS', // rabbit lean white meat ~ chicken (closest generic)
  'почки свиные': 'Pork, NFS',
  'печень трески': 'Fish, cod, NFS', // cod liver — VERY fatty, NFS won't capture; flag hard
  // rest (already high/med) for full review
  'баранина': 'Lamb, NFS', 'балык осетровый': 'Fish, white, mixed species, NFS',
  'ветчина': 'Luncheon meat, NFS', 'говядина': 'Beef, NFS', 'печень говяжья': 'Beef, NFS',
  'язык говяжий': 'Beef, NFS', 'почки говяжьи': 'Beef, NFS', 'горбуша': 'Fish, salmon, NFS',
  'грудинка': 'Pork, NFS', 'гуляш': 'Beef, NFS', 'гусь': 'Chicken, NFS', 'желток': 'Egg, NFS',
  'яйцо': 'Egg, NFS', 'индейка': 'Turkey, NFS', 'кальмар': 'Shellfish, NFS', 'кета': 'Fish, salmon, NFS',
  'кижуч': 'Fish, salmon, NFS', 'килька': 'Fish, white, mixed species, NFS', 'колбаса варёная': 'Luncheon meat, NFS',
  'сардельки': 'Hot dog, NFS', 'сосиски': 'Hot dog, NFS', 'корейка': 'Pork, NFS', 'краб': 'Shellfish, NFS',
  'креветка': 'Shrimp, NFS', 'кумыс': 'Milk, NFS', 'лосось': 'Fish, salmon, NFS', 'мидии': 'Shellfish, NFS',
  'минтай': 'Fish, cod, NFS', 'молоко сгущённое': 'Milk, NFS', 'мороженое': 'Ice cream, NFS', 'нерка': 'Fish, salmon, NFS',
  'осётр': 'Fish, white, mixed species, NFS', 'палтус': 'Fish, flounder, NFS', 'печень свиная': 'Pork, NFS',
  'простокваша': 'Milk, NFS', 'лангуст/омар': 'Shellfish, NFS', 'раки речные': 'Shellfish, NFS',
  'сельдь': 'Fish, mackerel, NFS', 'скумбрия': 'Fish, mackerel, NFS', 'треска': 'Fish, cod, NFS',
  'угорь': 'Fish, white, mixed species, NFS', 'щука': 'Fish, perch, NFS', 'свинина': 'Pork, NFS',
  'язык свиной': 'Pork, NFS', 'сливки': 'Cream, NFS', 'сметана': 'Sour cream, NFS', 'сом': 'Fish, catfish, NFS',
  'сулугуни': 'Cheese, Mozzarella, NFS', 'сыр': 'Cheese, NFS', 'телятина': 'Beef, NFS', 'тунец': 'Fish, tuna, NFS',
  'утка': 'Chicken, NFS',
}
const PROBLEM = new Set(['белок', 'вобла', 'зубатка', 'камбала', 'карась', 'навага', 'окунь морской', 'окунь речной', 'охотничьи колбаски', 'сазан', 'ставрида', 'судак', 'лещ', 'хек', 'кабан', 'кролик', 'почки свиные', 'печень трески'])

const catalog = JSON.parse(readFileSync(CATALOG, 'utf-8')) as Array<{ id: string; name: string; categories?: string[]; nutrients: Record<string, number> }>
const byName = new Map(catalog.map((f) => [f.name, f]))

function line(name: string): string {
  const our = byName.get(name)
  const gen = PROPOSED[name]
  const cand = byDesc(gen)
  if (!our) return `${name}: НЕТ в каталоге`
  const oZn = our.nutrients[OUR.Zn]
  if (!cand) return `${name} → "${gen}": ⚠ NFS-запись не найдена`
  // our fingerprint vs candidate (kcal/protein/Ca) so user sees if it's the right kind of food
  const o = (k: keyof typeof OUR) => our.nutrients[OUR[k]] ?? '—'
  const c = (k: keyof typeof FDC) => { const v = amt(cand, FDC[k]); return v === null ? '—' : Math.round(v * 100) / 100 }
  return [
    `${PROBLEM.has(name) ? '🔴' : '  '} ${name}  →  ${gen}`,
    `      наш:  ккал=${o('kcal')} белок=${o('prot')} жир=${o('fat')} Ca=${o('Ca')} Na=${o('Na')} Zn=${oZn ?? '—'}`,
    `      USDA: ккал=${c('kcal')} белок=${c('prot')} жир=${c('fat')} Ca=${c('Ca')} Na=${c('Na')} Zn=${c('Zn')}`,
  ].join('\n')
}

const names = Object.keys(PROPOSED).filter((n) => byName.has(n))
// problem ones first
names.sort((a, b) => (PROBLEM.has(b) ? 1 : 0) - (PROBLEM.has(a) ? 1 : 0) || a.localeCompare(b))
const out = ['=== СВЕРКА: наш продукт → универсальный USDA (NFS) ===',
  '🔴 = проблемный (слабый матч цинка). Сравни «наш» и «USDA» строки — тот ли это тип продукта?\n',
  ...names.map(line)]
writeFileSync('c:/tmp/zinc-review-table.txt', out.join('\n\n'))
console.log(`Готово: ${names.length} продуктов (${[...PROBLEM].filter((n) => byName.has(n)).length} проблемных) → c:/tmp/zinc-review-table.txt`)
