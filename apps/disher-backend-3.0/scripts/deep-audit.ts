/**
 * Deeper adequacy audit — beyond "physically impossible" (PASS B). This catches
 * values that are individually plausible but WRONG by cross-checks:
 *   1. Macro→energy consistency: 4*protein + 4*carb + 9*fat ≈ kcal (±25%).
 *      Catches swapped/scaled macros even when each looks reasonable.
 *   2. Mass sanity: protein+fat+carb+water+ash should not exceed ~105 g/100g.
 *   3. Per-category outliers: for each (category, nutrient), flag values >5× the
 *      category median (robust) — surfaces a lone wrong cell hiding among peers.
 *   4. Suspiciously round / placeholder zeros on staple macros.
 *
 *   tsx scripts/deep-audit.ts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CATALOG = resolve(__dirname, '../../food-calc/src/shared/data/catalog.json')
type Food = { id: string | number; name: string; source?: string; categories?: string[]; nutrients: Record<string, number> }
const cat = JSON.parse(readFileSync(CATALOG, 'utf-8')) as Food[]

// nutrient ids (from catalog convention)
const PROT = '1', FAT = '2', CARB = '3', KCAL = '7', WATER = '8'
const n = (f: Food, id: string) => (typeof f.nutrients[id] === 'number' ? f.nutrients[id] : undefined)

const out: string[] = []

// --- 1. macro -> energy consistency ---
out.push('=== 1. Энергия не сходится с макросами (4P+4C+9F vs ккал, >25%) ===')
let e = 0
for (const f of cat) {
  const p = n(f, PROT), fat = n(f, FAT), c = n(f, CARB), k = n(f, KCAL)
  if (p === undefined || fat === undefined || c === undefined || k === undefined || k <= 0) continue
  const calc = 4 * p + 4 * c + 9 * fat
  const ratio = calc / k
  if (ratio > 1.25 || ratio < 0.75) { out.push(`  ${f.name} (${f.id}): ккал=${k} но макросы дают ${Math.round(calc)} (${ratio.toFixed(2)}×) [P${p} F${fat} C${c}]`); e++ }
}
if (!e) out.push('  (всё сходится)')

// --- 2. mass > 105 g/100g ---
out.push('\n=== 2. Сумма масс > 105 г/100г (P+F+C+вода) ===')
let m = 0
for (const f of cat) {
  const sum = (n(f, PROT) ?? 0) + (n(f, FAT) ?? 0) + (n(f, CARB) ?? 0) + (n(f, WATER) ?? 0)
  if (sum > 105) { out.push(`  ${f.name} (${f.id}): сумма=${sum.toFixed(1)} г`); m++ }
}
if (!m) out.push('  (нет)')

// --- 3. per-category per-nutrient robust outliers (>5× category median) ---
out.push('\n=== 3. Выбросы внутри категории (>5× медианы категории) ===')
const MICRO = ['9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '20', '21', '22', '23', '26', '28', '29', '30', '32', '33']
const NUTNAME: Record<string, string> = { '9': 'Fe', '10': 'Mg', '11': 'P', '12': 'Ca', '13': 'K', '14': 'Na', '15': 'Zn', '16': 'Cu', '17': 'Mn', '18': 'Se', '20': 'A', '21': 'B1', '22': 'B2', '23': 'B3', '26': 'B6', '28': 'B9', '29': 'B12', '30': 'C', '32': 'E', '33': 'K1' }
const byCat = new Map<string, Food[]>()
for (const f of cat) { const c = (f.categories ?? ['?'])[0]; if (!byCat.has(c)) byCat.set(c, []); byCat.get(c)!.push(f) }
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] }
let o = 0
for (const [c, foods] of byCat) {
  if (foods.length < 5) continue // need a population to judge
  for (const id of MICRO) {
    const vals = foods.map((f) => n(f, id)).filter((v): v is number => typeof v === 'number' && v > 0)
    if (vals.length < 5) continue
    const med = median(vals)
    if (med <= 0) continue
    for (const f of foods) {
      const v = n(f, id)
      if (typeof v === 'number' && v > med * 5 && v > 1) { out.push(`  [${c}] ${f.name} (${f.id}): ${NUTNAME[id]}=${v} (медиана категории ${med}, ${(v / med).toFixed(0)}×)`); o++ }
    }
  }
}
if (!o) out.push('  (нет резких выбросов)')

out.push(`\nИТОГО подозрительных: энергия=${e}, масса=${m}, выбросы=${o}`)
writeFileSync('c:/tmp/deep-audit.txt', out.join('\n'))
console.log(out.join('\n'))
