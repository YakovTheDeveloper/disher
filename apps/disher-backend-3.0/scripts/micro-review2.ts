import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const BULK = resolve(__dirname, '../content/FoodData_Central_foundation_food_json_2026-04-30.json')
const SRC = resolve(__dirname, '../seed/combined-foods-final.json')
const bulk = (JSON.parse(readFileSync(BULK, 'utf-8')).FoundationFoods as any[]).filter((f) => f && Array.isArray(f.foodNutrients))
const seed = JSON.parse(readFileSync(SRC, 'utf-8')) as any[]
const our = (id: string) => seed.find((f) => f.id === id)
const v = (f: any, fdcId: string) => { for (const n of f.foodNutrients) if (String(n?.nutrient?.id) === fdcId && typeof n.amount === 'number') return n.amount; return undefined }
const MICRO = Array.from({ length: 27 }, (_, i) => i + 9)
function ourLine(id: string, want: number[]) {
  const f = our(id); if (!f) return console.log(`our ${id} NOTFOUND`)
  const have = want.map((i) => f.nutrients[String(i)] !== undefined ? `${i}=${f.nutrients[String(i)]}` : null).filter(Boolean).join(' ')
  const empty = MICRO.filter((i) => !(typeof f.nutrients[String(i)] === 'number' && f.nutrients[String(i)] > 0))
  console.log(`our ${id} ${f.name}: ${have}  EMPTY:${empty.join(',')}`)
}
function cand(tokens: string[], extra: string[], tag: string) {
  console.log(`-- ${tag} --`)
  for (const f of bulk.filter((x) => tokens.every((t) => x.description.toLowerCase().includes(t))))
    console.log(`  ${f.fdcId} ${f.description}  ${extra.map((e) => { const val = v(f, e); return val === undefined ? '' : e + '=' + val }).join(' ')}`)
}
console.log('PEPPER our (A=20 src1106, C=30 src1162, bCar=34):')
ourLine('7843', [14, 16, 18, 20, 30, 34])
console.log('CHICKEN:')
cand(['chicken'], ['1103', '1175', '1167'], 'chicken cand: Se1103 B6_1175 B3_1167')
ourLine('7881', [18, 23, 26, 29])
console.log('OATS:')
cand(['oat'], [], 'oat cand')
ourLine('7849', [21, 22, 23, 26])
console.log('SALT:')
cand(['salt'], ['1093', '1100'], 'salt cand: Na1093 I1100')
ourLine('5956', [14, 19])
console.log('SWEET POTATO our (K=13 Ca=12 A=20 bCar=34):')
ourLine('7853', [13, 12, 20, 34])
