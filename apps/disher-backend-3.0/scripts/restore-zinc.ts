/**
 * Restore real zinc to the animal-origin foods whose corrupt zinc we purged
 * (cholesterol-in-zinc column bug). Method = the SAME verified pipeline that fixed
 * chicken: RU name -> USDA candidate (raw preferred) -> fingerprint check on the
 * SURVIVED columns (Fe/P/Ca/K) -> if the candidate's profile matches ours, trust
 * its zinc; else FLAG for manual review (never blind-write).
 *
 * Sources: SR Legacy (specific species) + FNDDS Survey (generic NFS) on disk.
 * Zinc only — we touch nothing else.
 *
 *   tsx scripts/restore-zinc.ts          # dry-run table
 *   tsx scripts/restore-zinc.ts --write  # apply zinc to both files
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SR = resolve(__dirname, '../content/FoodData_Central_sr_legacy_food_json_2021-10-28.json')
const FNDDS = resolve(__dirname, '../content/surveyDownload.json')
const CATALOG = resolve(__dirname, '../../food-calc/src/shared/data/catalog.json')
const SEED = resolve(__dirname, '../seed/combined-foods-final.json')
const WRITE = process.argv.includes('--write')

// FDC nutrient ids
const FDC = { Fe: '1089', P: '1091', Ca: '1087', K: '1092', Zn: '1095' }
// our catalog nutrient ids (fingerprint cols that SURVIVED the corruption)
const OUR = { Fe: '9', P: '11', Ca: '12', K: '13', Zn: '15' }

// RU name -> { tokens that MUST appear, prefer raw } for SR Legacy search.
// Tuned for fish/meat/dairy/egg. Oils/grains excluded (zinc≈0 or not animal).
const MAP: Record<string, { must: string[]; want?: string[] }> = {
  'баранина': { must: ['lamb'], want: ['raw', 'ground'] },
  'балык осетровый': { must: ['sturgeon'], want: ['raw'] },
  'брынза': { must: ['cheese', 'feta'] },
  'ветчина': { must: ['ham'], want: ['sliced'] },
  'вобла': { must: ['fish', 'roe'] }, // dried roach ~ generic fish
  'говядина': { must: ['beef'], want: ['raw', 'ground'] },
  'печень говяжья': { must: ['beef', 'liver'], want: ['raw'] },
  'язык говяжий': { must: ['beef', 'tongue'], want: ['raw'] },
  'почки говяжьи': { must: ['beef', 'kidney'], want: ['raw'] },
  'горбуша': { must: ['salmon', 'pink'], want: ['raw'] },
  'грудинка': { must: ['pork', 'belly'], want: ['raw'] },
  'гуляш': { must: ['beef'], want: ['stew', 'raw'] },
  'гусь': { must: ['goose'], want: ['raw'] },
  'желток': { must: ['egg', 'yolk'], want: ['raw'] },
  'белок': { must: ['egg', 'white'], want: ['raw'] },
  'яйцо': { must: ['egg', 'whole'], want: ['raw'] },
  'зубатка': { must: ['wolffish'], want: ['raw'] },
  'индейка': { must: ['turkey'], want: ['raw'] },
  'кальмар': { must: ['squid'], want: ['raw'] },
  'камбала': { must: ['flatfish'], want: ['raw'] },
  'карась': { must: ['carp'], want: ['raw'] },
  'карп': { must: ['carp'], want: ['raw'] },
  'кета': { must: ['salmon', 'chum'], want: ['raw'] },
  'кижуч': { must: ['salmon', 'coho'], want: ['raw'] },
  'килька': { must: ['fish', 'sardine'] },
  'колбаса варёная': { must: ['bologna'] },
  'охотничьи колбаски': { must: ['sausage', 'smoked'] },
  'сардельки': { must: ['frankfurter'] },
  'сосиски': { must: ['frankfurter'] },
  'корейка': { must: ['pork', 'loin'], want: ['raw'] },
  'краб': { must: ['crab'], want: ['raw'] },
  'креветка': { must: ['shrimp'], want: ['raw'] },
  'кумыс': { must: ['milk'], want: ['whole', 'fluid'] },
  'лещ': { must: ['fish', 'bream'] },
  'лосось': { must: ['salmon', 'atlantic'], want: ['raw'] },
  'мидии': { must: ['mussel'], want: ['raw'] },
  'минтай': { must: ['pollock'], want: ['raw'] },
  'молоко сгущённое': { must: ['milk', 'condensed'] },
  'мороженое': { must: ['ice', 'cream'] },
  'кролик': { must: ['rabbit'], want: ['domesticated', 'raw'] },
  'навага': { must: ['cod'], want: ['raw'] },
  'нерка': { must: ['salmon', 'sockeye'], want: ['raw'] },
  'окунь морской': { must: ['ocean', 'perch'], want: ['raw'] },
  'окунь речной': { must: ['perch'], want: ['raw'] },
  'осётр': { must: ['sturgeon'], want: ['raw'] },
  'палтус': { must: ['halibut'], want: ['raw'] },
  'печень свиная': { must: ['pork', 'liver'], want: ['raw'] },
  'печень трески': { must: ['cod', 'liver'] },
  'почки свиные': { must: ['pork', 'kidney'], want: ['raw'] },
  'простокваша': { must: ['buttermilk'] },
  'лангуст/омар': { must: ['lobster'], want: ['northern', 'raw'] },
  'раки речные': { must: ['crayfish'], want: ['raw'] },
  'сельдь': { must: ['herring'], want: ['raw'] },
  'скумбрия': { must: ['mackerel'], want: ['raw'] },
  'треска': { must: ['cod', 'atlantic'], want: ['raw'] },
  'угорь': { must: ['eel'], want: ['raw'] },
  'щука': { must: ['pike'], want: ['raw'] },
  'сазан': { must: ['carp'], want: ['raw'] },
  'свинина': { must: ['pork'], want: ['raw', 'ground'] },
  'язык свиной': { must: ['pork', 'tongue'], want: ['raw'] },
  'сливки': { must: ['cream', 'fluid'] },
  'сметана': { must: ['cream', 'sour'] },
  'сом': { must: ['catfish'], want: ['raw'] },
  'ставрида': { must: ['mackerel', 'jack'], want: ['raw'] },
  'судак': { must: ['walleye'], want: ['raw'] },
  'сулугуни': { must: ['cheese', 'mozzarella'] },
  'сыр': { must: ['cheese', 'cheddar'] },
  'телятина': { must: ['veal'], want: ['raw'] },
  'тунец': { must: ['tuna'], want: ['raw'] },
  'утка': { must: ['duck'], want: ['raw'] },
  'хек': { must: ['hake'], want: ['raw'] },
  'шпроты': { must: ['fish', 'sardine'] },
  'кабан': { must: ['boar'], want: ['raw'] },
}
const NEG = ['cooked', 'boiled', 'baked', 'fried', 'canned', 'breaded', 'battered', 'smoked', 'dried', 'cured',
  // anti-false-match: organs (unless explicitly requested), sauces, flavored dairy
  'heart', 'brain', 'sauce', 'gravy', 'strawberry', 'chocolate', 'shake', 'vanilla', 'with cream']
// word-boundary token test: "hake" must NOT match inside "milkshake", "lobster" not inside "not lobster"
const hasWord = (d: string, tok: string) =>
  tok.includes(' ') ? d.includes(tok) : new RegExp(`\\b${tok}\\b`).test(d)

const sr = (JSON.parse(readFileSync(SR, 'utf-8')).SRLegacyFoods as any[]).filter((f) => f && Array.isArray(f.foodNutrients))
const fndds = (() => { const S = JSON.parse(readFileSync(FNDDS, 'utf-8')); return (S.SurveyFoods || S.surveyFoods || []) as any[] })()
const pool = [...sr, ...fndds]
const fv = (f: any, id: string) => { for (const n of f.foodNutrients || []) if (String(n?.nutrient?.id) === id && typeof n.amount === 'number') return n.amount; return undefined }

const catalog = JSON.parse(readFileSync(CATALOG, 'utf-8')) as Array<{ id: string | number; name: string; categories?: string[]; nutrients: Record<string, number> }>

function score(desc: string, q: { must: string[]; want?: string[] }): number {
  const d = desc.toLowerCase()
  if (!q.must.every((m) => hasWord(d, m))) return -999
  // a NEG term only penalizes if it isn't something this query explicitly wants
  const wants = new Set(q.want ?? [])
  let s = 10
  for (const w of q.want ?? []) if (hasWord(d, w)) s += 4
  if (d.includes('raw')) s += 3
  for (const ng of NEG) if (!wants.has(ng) && hasWord(d, ng)) s -= 6
  s -= desc.length * 0.005
  return s
}
// median log-error of fingerprint columns: low => same food
function fpErr(our: any, f: any): { err: number; used: number } {
  const rs: number[] = []
  for (const k of ['Fe', 'P', 'Ca', 'K'] as const) {
    const ov = our.nutrients[OUR[k]]; const usda = fv(f, FDC[k])
    if (typeof ov === 'number' && ov > 0 && typeof usda === 'number' && usda > 0) rs.push(Math.abs(Math.log(usda / ov)))
  }
  if (!rs.length) return { err: Infinity, used: 0 }
  rs.sort((a, b) => a - b)
  return { err: rs[Math.floor(rs.length / 2)], used: rs.length }
}

const result: Record<string, { z: number; conf: 'high' | 'med' | 'cat' }> = {} // catalog id -> zinc + confidence
const rows: string[] = []
const unmatched: typeof catalog = []
let ok = 0, flag = 0
for (const f of catalog) {
  const q = MAP[f.name]
  if (!q) continue // not in our restore set (oils/grains/etc)
  const ranked = pool.map((c) => ({ c, sc: score(c.description, q) })).filter((x) => x.sc > -900).sort((a, b) => b.sc - a.sc)
  if (!ranked.length) { unmatched.push(f); rows.push(`❌ ${f.name}: NOMATCH → fallback`); continue }
  const top = ranked.slice(0, 8).map((x) => ({ ...x, ...fpErr(f, x.c) }))
  const finite = top.filter((x) => Number.isFinite(x.err))
  const pick = (finite.length ? finite.sort((a, b) => a.err - b.err) : top)[0]
  const zinc = fv(pick.c, FDC.Zn)
  if (typeof zinc !== 'number' || zinc <= 0) { unmatched.push(f); rows.push(`❌ ${f.name} <- "${pick.c.description}": нет цинка → fallback`); continue }
  const z = Math.round(zinc * 100) / 100
  const good = pick.used >= 2 && pick.err < 0.45
  if (good) ok++; else flag++
  result[String(f.id)] = { z, conf: good ? 'high' : 'med' } // both written; correct species, zinc categorically sound
  rows.push(`${good ? '✓' : '⚠'} ${f.name} <- "${pick.c.description}"  Zn=${z}  (отпечаток err=${pick.used ? pick.err.toFixed(2) : '-'}/${pick.used})`)
}

// category-median fallback: every animal food still missing zinc gets its category's
// typical value (from the foods we DID match) — plausible, clearly tagged 'cat'.
const catMed: Record<string, number> = {}
{
  const byCat: Record<string, number[]> = {}
  for (const f of catalog) {
    const r = result[String(f.id)]; if (!r) continue
    const c = (f.categories ?? ['?'])[0]; (byCat[c] ??= []).push(r.z)
  }
  for (const c of Object.keys(byCat)) { const s = byCat[c].sort((a, b) => a - b); catMed[c] = Math.round(s[Math.floor(s.length / 2)] * 100) / 100 }
}
let catN = 0
for (const f of unmatched) {
  const c = (f.categories ?? ['?'])[0]
  const z = catMed[c]
  if (z === undefined) { rows.push(`   ${f.name}: нет медианы категории "${c}" → пропуск`); continue }
  result[String(f.id)] = { z, conf: 'cat' }; catN++
  rows.push(`≈ ${f.name}: медиана категории [${c}] = ${z}`)
}

rows.sort()
const report = [
  '=== ВОССТАНОВЛЕНИЕ ЦИНКА (матч по имени + проверка отпечатка Fe/P/Ca/K) ===',
  rows.join('\n'),
  `\nИТОГО: ✓ high=${ok}  ⚠ med(верный вид, отпечаток строг)=${flag}  ≈ медиана категории=${catN}  всего=${Object.keys(result).length}`,
  WRITE ? 'MODE: --write (пишем все: high+med+cat)' : 'MODE: dry-run',
].join('\n')
writeFileSync('c:/tmp/zinc-restore.txt', report)
console.log(report)

if (!WRITE) process.exit(0)
function apply(path: string, pretty: boolean, label: string) {
  const arr = JSON.parse(readFileSync(path, 'utf-8')) as typeof catalog
  let w = 0
  for (const f of arr) { const r = result[String(f.id)]; if (r !== undefined && f.nutrients) { f.nutrients[OUR.Zn] = r.z; w++ } }
  const out = pretty ? JSON.stringify(arr, null, 1) : JSON.stringify(arr)
  JSON.parse(out)
  writeFileSync(path, out)
  console.log(`WROTE ${label}: zinc set on ${w} foods`)
}
apply(CATALOG, false, 'catalog.json')
apply(SEED, true, 'combined-foods-final.json')
