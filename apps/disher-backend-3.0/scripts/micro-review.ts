import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const BULK = resolve(__dirname, '../content/FoodData_Central_foundation_food_json_2026-04-30.json')
const SRC = resolve(__dirname, '../seed/combined-foods-final.json')
const bulk = (JSON.parse(readFileSync(BULK, 'utf-8')).FoundationFoods as any[]).filter((f) => f && Array.isArray(f.foodNutrients))
const seed = JSON.parse(readFileSync(SRC, 'utf-8')) as any[]
const byOurId = (id: string) => seed.find((f) => f.id === id)
// fdc nutrient.id -> short label for the micros we care to print
const LBL: Record<string, string> = { '1093': 'Na', '1103': 'Se', '1162': 'C', '1106': 'A', '1107': 'bCar', '1108': 'aCar', '1109': 'E', '1114': 'D', '1185': 'K1', '1167': 'B3', '1166': 'B2', '1165': 'B1', '1178': 'B12', '1177': 'B9', '1087': 'Ca', '1092': 'K', '1100': 'I', '1180': 'B4' }
function val(f: any, fdcId: string): number | undefined {
  for (const n of f.foodNutrients) if (String(n?.nutrient?.id) === fdcId && typeof n.amount === 'number') return n.amount
  return undefined
}
function micros(f: any): string {
  return Object.keys(LBL).map((k) => { const v = val(f, k); return v === undefined ? null : `${LBL[k]}=${v}` }).filter(Boolean).join(' ')
}
function showFdc(id: number, tag: string) {
  const f = bulk.find((x) => x.fdcId === id)
  console.log(`[${tag}] ${id} ${f ? f.description : 'NOTFOUND'}`)
  if (f) console.log('   ' + micros(f))
}
function ourMicros(id: string, tag: string) {
  const f = byOurId(id)
  if (!f) { console.log(`[our ${tag}] ${id} NOTFOUND`); return }
  const ids = [9, 10, 11, 12, 13, 14, 15, 18, 20, 21, 22, 23, 30, 31, 32, 33, 34]
  console.log(`[our ${tag}] ${id} ${f.name}: ` + ids.map((i) => f.nutrients[String(i)] !== undefined ? `${i}=${f.nutrients[String(i)]}` : null).filter(Boolean).join(' '))
}
function listDesc(tokens: string[], tag: string) {
  const hits = bulk.filter((f) => tokens.every((t) => f.description.toLowerCase().includes(t)))
  console.log(`--- ${tag} (${hits.length}) ---`)
  for (const f of hits) console.log(`   ${f.fdcId} ${f.description}  || ${micros(f)}`)
}
console.log('=== CANOLA / PLANT MILKS (check fortification: D/B12/A/E/Ca) ===')
showFdc(748278, 'canola')
showFdc(2257045, 'almondmilk'); ourMicros('7841', 'almondmilk')
showFdc(1999630, 'soymilk'); ourMicros('7703', 'soymilk')
console.log('=== BELL PEPPER COLOR ===')
listDesc(['pepper', 'bell'], 'bell peppers')
ourMicros('7843', 'pepper')
console.log('=== CHICKEN PART ===')
listDesc(['chicken'], 'chicken'); ourMicros('7881', 'chicken')
console.log('=== OATS vs OAT FLOUR ===')
listDesc(['oat'], 'oat')
ourMicros('7849', 'oats')
console.log('=== SALT / SWEET POTATO ===')
showFdc(746775, 'salt'); ourMicros('5956', 'salt')
showFdc(2346404, 'sweetpotato'); ourMicros('7853', 'sweetpotato')
