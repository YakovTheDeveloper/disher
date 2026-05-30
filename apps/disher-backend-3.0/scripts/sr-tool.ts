/**
 * SR Legacy micronutrient backfill (richer panels than Foundation).
 *   tsx scripts/sr-tool.ts match      -> name+mineral-corr match of 43 foods to SR records
 *   tsx scripts/sr-tool.ts show <fdcId> [ourId]
 *   tsx scripts/sr-tool.ts extract    -> combined payload (Foundation-measured first, else SR)
 *   tsx scripts/sr-tool.ts backfill [--write]
 * Uses the SAME id-map/units as micro-tool. SR uses nutrient.id keying too.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MAP, loadSeed, foundationFoods } from './micro-tool'

const present = (v: unknown) => v !== undefined && v !== null

const __dirname = dirname(fileURLToPath(import.meta.url))
const SR = resolve(__dirname, '../content/FoodData_Central_sr_legacy_food_json_2021-10-28.json')
const SRC = resolve(__dirname, '../seed/combined-foods-final.json')

type Food = { id: string; name: string; source?: string; categories?: string[]; nutrients: Record<string, number> }
type SrFood = { fdcId: number; description: string; dataType: string; foodNutrients: any[] }

function loadSr(): SrFood[] {
  return (JSON.parse(readFileSync(SR, 'utf-8')).SRLegacyFoods as SrFood[]).filter((f) => f && Array.isArray(f.foodNutrients))
}
const norm = (u: string) => (u || '').toLowerCase().replace('μ', 'µ')
const ourToFdc: Record<number, string> = {}
for (const num of Object.keys(MAP)) ourToFdc[MAP[num].our] = num
function amt(f: SrFood, fdcNumId: string): { v: number; u: string } | undefined {
  for (const n of f.foodNutrients) if (String(n?.nutrient?.id) === fdcNumId && typeof n.amount === 'number') return { v: n.amount, u: n.nutrient.unitName }
  return undefined
}

// SR-aware query tokens (must: >=1 present; neg downranks processed forms).
const Q: Record<string, string[]> = {
  'абрикос': ['apricot'],
  'фасоль белая': ['beans, white', 'beans, navy'],
  'бразильский орех': ['brazilnut'],
  'брокколи': ['broccoli, raw'],
  'булгур': ['bulgur'],
  'гречка': ['buckwheat'],
  'мука гречневая': ['buckwheat flour'],
  'грибы экзотические': ['mushrooms'],
  'рис дикий': ['wild rice'],
  'дыня': ['melons, cantaloupe'],
  'йогурт': ['yogurt, plain'],
  'капуста зелёная': ['cabbage, raw', 'cabbage, common', 'collards'],
  'капуста краснокочанная': ['cabbage, red'],
  'капуста кудрявая (кале)': ['kale'],
  'кедровые орехи': ['pine nuts'],
  'клубника': ['strawberries'],
  'мука кокосовая': ['coconut flour', 'coconut meat'],
  'курица': ['chicken'],
  'люциан': ['snapper'],
  'масло канола': ['oil, canola', 'oil, industrial, canola'],
  'молоко миндальное': ['almond milk'],
  'молоко соевое': ['soymilk', 'soy milk'],
  'мука миндальная': ['almond flour', 'almond, flour', 'nuts, almonds'],
  'мука овсяная': ['oat flour', 'oat bran'],
  'нектарин': ['nectarines'],
  'нут': ['chickpeas'],
  'овёс': ['oats'],
  'огурец': ['cucumber'],
  'пекан': ['pecans'],
  'макадамия': ['macadamia'],
  'фундук': ['hazelnuts', 'filberts'],
  'пастернак': ['parsnips'],
  'перец болгарский': ['peppers, sweet', 'peppers, bell'],
  'плантаны': ['plantains'],
  'просо': ['millet'],
  'свекольная зелень': ['beet greens'],
  'семена тыквы': ['pumpkin and squash seed', 'pumpkin seed'],
  'семена чиа': ['chia'],
  'семя льна': ['flaxseed'],
  'сладкий картофель': ['sweet potato'],
  'соль': ['salt, table'],
  'фасоль красная': ['beans, kidney, red', 'beans, kidney, all'],
  'фасоль чёрная': ['beans, black, mature'],
}
const NEG = ['cooked', 'boiled', 'drained', 'canned', 'frozen', 'roasted', 'toasted', 'baked', 'fried', 'juice', 'sauce', 'sweetened', 'syrup', 'smoked', 'dehydrated', 'dry roasted', 'oil roasted', 'blanched', 'creamed', 'prepared', 'low sodium', 'with salt', 'baby food', 'soup', 'leavened', 'unprepared, ']
const ANCHORS = [9, 10, 11, 12, 13, 15] // Fe Mg P Ca K Zn

// Verified fdcId overrides where minerals alone can't pick variety/right product.
//   перец: red (our C≈138, A≈145) — 170427 has C=127.7/A=157; green(170108) C=80/A=18.
//   мука овсяная: oat flour ≈ milled oats (169705); SR's only "oat*flour" hit was
//     oat bran (different layer, P/Mg too high). Oats is the closest real proxy.
const OVERRIDE: Record<string, number> = {
  'перец болгарский': 170427, // Peppers, sweet, red, raw
  'мука овсяная': 169705, // Oats (proxy for oat flour; SR has no oat flour)
}
// Disputed — no defensible SR proxy; leave their absent micros empty (not fabricated).
//   грибы экзотические: "exotic" is a generic mix; SR species (white/shiitake/oyster/
//     enoki) differ materially and corr can't disambiguate (0.20–0.32).
//   мука кокосовая: SR has no coconut flour; coconut meat is wrong basis
//     (our K=1006 vs meat ~356–543, corr 0.45).
const SKIP = new Set<string>(['грибы экзотические', 'мука кокосовая'])

function scoreOf(desc: string, toks: string[]): number {
  const d = desc.toLowerCase()
  if (!toks.some((t) => d.includes(t))) return -999
  let s = 10
  if (d.includes('raw')) s += 4
  if (d.includes(', mature seeds, raw')) s += 3
  for (const ng of NEG) if (d.includes(ng)) s -= 5
  s -= desc.length * 0.005
  return s
}
function corrErr(our: Food, f: SrFood): { err: number; used: number } {
  const rs: number[] = []
  for (const a of ANCHORS) {
    const ov = our.nutrients[String(a)]
    const fv = amt(f, ourToFdc[a])
    if (typeof ov === 'number' && ov > 0 && fv && fv.v > 0) rs.push(Math.abs(Math.log(fv.v / ov)))
  }
  if (!rs.length) return { err: Infinity, used: 0 }
  rs.sort((a, b) => a - b)
  return { err: rs[Math.floor(rs.length / 2)], used: rs.length }
}

const cmd = process.argv[2] ?? ''
const rest = process.argv.slice(3)
const sr = loadSr()
const byId = new Map(sr.map((f) => [f.fdcId, f]))
const foods = foundationFoods(loadSeed())

if (cmd === 'match') {
  const lines: string[] = []
  const chosen: Record<string, any> = {}
  for (const food of foods) {
    if (SKIP.has(food.name)) { lines.push(`${food.name} :: SKIP-disputed (no defensible SR proxy)`); continue }
    if (OVERRIDE[food.name]) {
      const f = byId.get(OVERRIDE[food.name])
      if (f) { const ce = corrErr(food, f); chosen[food.id] = { name: food.name, fdcId: f.fdcId, desc: f.description, corrErr: ce.used ? ce.err : null, used: ce.used }; lines.push(`${food.name} :: ${f.fdcId} OVERRIDE corr${ce.used ? ce.err.toFixed(2) : '-'} :: ${f.description}`); continue }
    }
    const toks = Q[food.name]
    if (!toks) { lines.push(`${food.name} :: NOQUERY`); continue }
    const ranked = sr.map((f) => ({ f, sc: scoreOf(f.description, toks) })).filter((x) => x.sc > -900).sort((a, b) => b.sc - a.sc)
    if (!ranked.length) { lines.push(`${food.name} :: NOMATCH`); continue }
    const top = ranked[0].sc
    const contenders = ranked.filter((x) => x.sc >= top - 5).map((x) => ({ ...x, ...corrErr(food, x.f) }))
    const finite = contenders.filter((x) => Number.isFinite(x.err))
    const pick = (finite.length ? finite.sort((a, b) => a.err - b.err) : contenders)[0]
    chosen[food.id] = { name: food.name, fdcId: pick.f.fdcId, desc: pick.f.description, corrErr: pick.used ? pick.err : null, used: pick.used, contenders: contenders.length }
    const flag = pick.used && pick.err > 0.4 ? 'FLAG' : ''
    lines.push(`${food.name} :: ${pick.f.fdcId} corr${pick.used ? pick.err.toFixed(2) : '-'}/${pick.used}${flag} cont${contenders.length} :: ${pick.f.description}`)
  }
  writeFileSync('c:/tmp/sr-match.txt', lines.join('\n'))
  writeFileSync('c:/tmp/sr-chosen.json', JSON.stringify(chosen, null, 1))
  console.log(`sr-match ${lines.length}, chosen ${Object.keys(chosen).length}`)
} else if (cmd === 'cands') {
  // dump all scored candidates for one food name (debug variety selection)
  const name = rest.join(' ')
  const food = foods.find((f) => f.name === name)
  if (!food) { console.log('no food ' + name); process.exit(1) }
  const toks = Q[food.name] || []
  const ranked = sr.map((f) => ({ f, sc: scoreOf(f.description, toks) })).filter((x) => x.sc > -900).sort((a, b) => b.sc - a.sc).slice(0, 14)
  const L: Record<number, string> = { 30: 'C', 20: 'A', 34: 'bC', 32: 'E', 22: 'B2', 18: 'Se', 14: 'Na' }
  const out = [`our ${food.name}: ` + [9, 10, 11, 12, 13, 15, 30, 20, 34].map((i) => food.nutrients[String(i)] !== undefined ? `${i}=${food.nutrients[String(i)]}` : null).filter(Boolean).join(' ')]
  for (const x of ranked) {
    const ce = corrErr(food, x.f)
    const extra = Object.keys(L).map((k) => { const a = amt(x.f, ourToFdc[+k]); return a ? `${L[+k]}=${a.v}` : '' }).filter(Boolean).join(' ')
    out.push(`  ${x.f.fdcId} sc${x.sc.toFixed(0)} corr${Number.isFinite(ce.err) ? ce.err.toFixed(2) : '-'} :: ${x.f.description}  || ${extra}`)
  }
  writeFileSync('c:/tmp/sr-cands.txt', out.join('\n'))
  console.log(`cands ${ranked.length} for ${name}`)
} else if (cmd === 'verifyexport') {
  // Build a per-food candidate package for independent verification. For each
  // food: our mineral fingerprint + existing vitamins (context) + the top
  // candidates from BOTH SR and Foundation, each with the EXACT values we'd add
  // (absent cells only, converted to our units). The verifier picks the correct
  // product (raw/plain/right variety/part) or rejects all, and flags bad values.
  const SYM: Record<number, string> = { 9: 'Fe', 10: 'Mg', 11: 'P', 12: 'Ca', 13: 'K', 14: 'Na', 15: 'Zn', 16: 'Cu', 17: 'Mn', 18: 'Se', 19: 'I', 20: 'A', 21: 'B1', 22: 'B2', 23: 'B3', 24: 'B4', 25: 'B5', 26: 'B6', 27: 'B7', 28: 'B9', 29: 'B12', 30: 'C', 31: 'D', 32: 'E', 33: 'K1', 34: 'bCar', 35: 'aCar' }
  const U: Record<number, string> = { 9: 'mg', 10: 'mg', 11: 'mg', 12: 'mg', 13: 'mg', 14: 'mg', 15: 'mg', 16: 'ug', 17: 'ug', 18: 'ug', 19: 'ug', 20: 'ug', 21: 'mg', 22: 'mg', 23: 'mg', 24: 'mg', 25: 'mg', 26: 'mg', 27: 'ug', 28: 'ug', 29: 'ug', 30: 'mg', 31: 'ug', 32: 'mg', 33: 'ug', 34: 'ug', 35: 'ug' }
  // foundation bulk for cross-dataset candidates (esp. plant milks, biotin)
  const FDN = resolve(__dirname, '../content/FoodData_Central_foundation_food_json_2026-04-30.json')
  const fdn = (JSON.parse(readFileSync(FDN, 'utf-8')).FoundationFoods as SrFood[]).filter((f) => f && Array.isArray(f.foodNutrients))
  function fillsFrom(rec: SrFood, food: Food): Record<string, number> {
    const out: Record<string, number> = {}
    for (const num of Object.keys(MAP)) {
      const { our, unit, x1000 } = MAP[num]
      if (present(food.nutrients[String(our)])) continue
      const a = amt(rec, num)
      if (!a || a.v <= 0) continue
      if (norm(a.u) !== norm(unit)) continue
      out[String(our)] = Math.round((x1000 ? a.v * 1000 : a.v) * 10000) / 10000
    }
    return out
  }
  const fmtFill = (fl: Record<string, number>) => Object.keys(fl).sort((a, b) => +a - +b).map((k) => `${SYM[+k]}=${fl[k]}${U[+k]}`).join(' ')
  const out: any[] = []
  for (const food of foods) {
    const fp = [9, 10, 11, 12, 13, 15].map((i) => `${SYM[i]}=${food.nutrients[String(i)] ?? '?'}`).join(' ')
    const haveVit = [14, 18, 20, 30, 32, 33, 34].filter((i) => present(food.nutrients[String(i)])).map((i) => `${SYM[i]}=${food.nutrients[String(i)]}`).join(' ')
    // SR candidates: rescore broadly, keep top by (score then corr)
    const toks = Q[food.name] || []
    const srRanked = sr.map((f) => ({ f, src: 'SR', sc: scoreOf(f.description, toks), ce: corrErr(food, f).err })).filter((x) => x.sc > -900).sort((a, b) => b.sc - a.sc || a.ce - b.ce).slice(0, 6)
    // Foundation candidates: same token match
    const fdnRanked = fdn.map((f) => ({ f, src: 'FDN', sc: toks.some((t) => f.description.toLowerCase().includes(t)) ? 10 : -999, ce: corrErr(food, f).err })).filter((x) => x.sc > -900).sort((a, b) => a.ce - b.ce).slice(0, 4)
    const cands = [...srRanked, ...fdnRanked].map((x) => {
      const fl = fillsFrom(x.f, food)
      return { fdcId: x.f.fdcId, src: x.src, desc: x.f.description, corr: Number.isFinite(x.ce) ? Math.round(x.ce * 100) / 100 : null, nAdds: Object.keys(fl).length, fills: fmtFill(fl) }
    }).filter((c) => c.nAdds > 0 || true)
    out.push({ id: food.id, name: food.name, fingerprint: fp, existingVitamins: haveVit, candidates: cands })
  }
  writeFileSync('c:/tmp/verify-input.json', JSON.stringify(out))
  console.log(`verifyexport: ${out.length} foods`)
} else if (cmd === 'show') {
  const f = byId.get(Number(rest[0]))
  if (!f) { console.log('not found'); process.exit(1) }
  const rows: string[] = []
  for (const num of Object.keys(MAP)) { const a = amt(f, num); if (a) { const conv = MAP[num].x1000 ? a.v * 1000 : a.v; rows.push(`our${MAP[num].our} ${a.u} raw${a.v}->${conv}`) } }
  writeFileSync('c:/tmp/sr-show.txt', `${f.fdcId} [${f.dataType}] ${f.description}\n` + rows.join('\n'))
  console.log(`${f.fdcId} ${f.description} (${rows.length} micros)`)
} else if (cmd === 'extract') {
  const srChosen = JSON.parse(readFileSync('c:/tmp/sr-chosen.json', 'utf-8')) as Record<string, { fdcId: number; desc: string }>
  // Foundation-measured cells (higher quality) take priority over SR.
  const fdnPayload = JSON.parse(readFileSync(resolve(__dirname, '../seed/micro-foundation-payload.json'), 'utf-8')) as Record<string, Record<string, number>>
  const combined: Record<string, Record<string, number>> = {}
  const srcLog: Record<string, Record<string, string>> = {}
  const review: string[] = []
  const unitFlags: string[] = []
  let total = 0
  for (const food of foods) {
    const adds: Record<string, number> = {}
    const src: Record<string, string> = {}
    const c = srChosen[food.id]
    const f = c ? byId.get(c.fdcId) : null
    const fdn = fdnPayload[food.id] || {}
    // SR is primary. Foundation is fallback ONLY for cells SR lacks (= biotin).
    for (const num of Object.keys(MAP)) {
      const { our, unit, x1000 } = MAP[num]
      const cur = food.nutrients[String(our)]
      if (present(cur)) continue // non-lossy: never touch present cells (incl. explicit 0)
      const a = f ? amt(f, num) : undefined
      if (a && a.v > 0) {
        if (norm(a.u) !== norm(unit)) { unitFlags.push(`${food.name} id${our} srUnit=${a.u} exp=${unit}`); continue }
        adds[String(our)] = Math.round((x1000 ? a.v * 1000 : a.v) * 10000) / 10000
        src[String(our)] = 'SR'
      } else if (fdn[String(our)] !== undefined) {
        adds[String(our)] = fdn[String(our)] // Foundation analytically-measured fallback
        src[String(our)] = 'FDN'
      }
    }
    const n = Object.keys(adds).length
    if (n) { combined[food.id] = adds; srcLog[food.id] = src; total += n }
    review.push(`${food.name} :: SR${c ? c.fdcId : '-'} +${n} :: ` + Object.keys(adds).sort((a, b) => +a - +b).map((k) => `${k}=${adds[k]}(${src[k]})`).join(' '))
  }
  writeFileSync(resolve(__dirname, '../seed/micro-backfill-payload.json'), JSON.stringify(combined, null, 2))
  writeFileSync('c:/tmp/sr-extract-review.txt', review.join('\n'))
  writeFileSync('c:/tmp/sr-srclog.json', JSON.stringify(srcLog, null, 1))
  if (unitFlags.length) writeFileSync('c:/tmp/sr-unitflags.txt', unitFlags.join('\n'))
  console.log(`extract: ${Object.keys(combined).length} foods, ${total} cells, unitFlags=${unitFlags.length}`)
}
