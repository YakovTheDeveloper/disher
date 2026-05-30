/**
 * USDA micronutrient backfill workhorse for the 43 `usda-foundation` foods.
 *
 * Subcommands (run via tsx scripts/micro-tool.ts <cmd> [args]):
 *   audit                 baseline/post coverage of 27 micro ids over the 43 foods
 *   numref                ground-truth FDC number -> (name,unit,count) for our map
 *   list                  dump all 395 Foundation descriptions (fdcId, dataType, desc)
 *   search <query...>     list Foundation candidates whose desc contains all tokens
 *   show <fdcId>          dump one Foundation record's micro nutrients (mapped)
 *   roster                dump the 43 foods: id, name, filled/empty micro ids
 *
 * All large output is written to c:/tmp/*.json|txt for chunked reading; stdout
 * stays short. Source of truth for edits is seed/combined-foods-final.json.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BULK = resolve(__dirname, '../content/FoodData_Central_foundation_food_json_2026-04-30.json')
const SRC = resolve(__dirname, '../seed/combined-foods-final.json')

// 27 micro ids: minerals 9-19, vitamins 20-35.
export const MICRO_IDS: number[] = Array.from({ length: 35 - 9 + 1 }, (_, i) => i + 9)

// FDC nutrient.number (string) -> { our id, expected FDC unit, x1000 to reach our unit }
export const MAP: Record<string, { our: number; unit: string; x1000?: boolean }> = {
  '1089': { our: 9, unit: 'mg' }, // Iron
  '1090': { our: 10, unit: 'mg' }, // Magnesium
  '1091': { our: 11, unit: 'mg' }, // Phosphorus
  '1087': { our: 12, unit: 'mg' }, // Calcium
  '1092': { our: 13, unit: 'mg' }, // Potassium
  '1093': { our: 14, unit: 'mg' }, // Sodium
  '1095': { our: 15, unit: 'mg' }, // Zinc
  '1098': { our: 16, unit: 'mg', x1000: true }, // Copper  mg -> µg
  '1101': { our: 17, unit: 'mg', x1000: true }, // Manganese mg -> µg
  '1103': { our: 18, unit: 'µg' }, // Selenium
  '1100': { our: 19, unit: 'µg' }, // Iodine
  '1165': { our: 21, unit: 'mg' }, // Thiamin B1
  '1166': { our: 22, unit: 'mg' }, // Riboflavin B2
  '1167': { our: 23, unit: 'mg' }, // Niacin B3
  '1180': { our: 24, unit: 'mg' }, // Choline B4
  '1170': { our: 25, unit: 'mg' }, // Pantothenic acid B5
  '1175': { our: 26, unit: 'mg' }, // Vitamin B-6
  '1176': { our: 27, unit: 'µg' }, // Biotin B7  (our unit мкг)
  '1177': { our: 28, unit: 'µg' }, // Folate, total B9
  '1178': { our: 29, unit: 'µg' }, // Vitamin B-12
  '1106': { our: 20, unit: 'µg' }, // Vitamin A, RAE
  '1162': { our: 30, unit: 'mg' }, // Vitamin C
  '1114': { our: 31, unit: 'µg' }, // Vitamin D (D2+D3)
  '1109': { our: 32, unit: 'mg' }, // Vitamin E (alpha-tocopherol)
  '1185': { our: 33, unit: 'µg' }, // Vitamin K (phylloquinone)
  '1107': { our: 34, unit: 'µg' }, // Carotene, beta
  '1108': { our: 35, unit: 'µg' }, // Carotene, alpha
}

type SeedFood = { id: string; name: string; source?: string; categories?: string[]; nutrients: Record<string, number> }
type FdcFood = { fdcId: number; description: string; dataType: string; foodCategory?: { description?: string }; foodNutrients: any[] }

export function loadSeed(): SeedFood[] {
  return JSON.parse(readFileSync(SRC, 'utf-8'))
}
export function foundationFoods(seed: SeedFood[]): SeedFood[] {
  return seed.filter((f) => f.source === 'usda-foundation' && !(f.categories ?? []).includes('supplement'))
}
export function loadBulk(): FdcFood[] {
  return (JSON.parse(readFileSync(BULK, 'utf-8')).FoundationFoods as FdcFood[]).filter(
    (f) => f && Array.isArray(f.foodNutrients),
  )
}
// Fillable = the KEY is absent. An explicit 0 is a real measured zero (e.g.
// mushroom Vit C) and must never be overwritten — task rule "Пустая ячейка ≠ ноль".
function present(v: unknown): boolean {
  return v !== undefined && v !== null
}
function filled(v: unknown): boolean {
  return present(v)
}
function norm(u: string): string {
  return (u || '').toLowerCase().replace('μ', 'µ')
}

const cmd = process.argv[2] ?? ''
const rest = process.argv.slice(3)

if (cmd === 'audit') {
  const foods = foundationFoods(loadSeed())
  const perFood = foods.map((f) => {
    const empty = MICRO_IDS.filter((id) => !filled(f.nutrients[String(id)]))
    return { id: f.id, name: f.name, filledCount: 27 - empty.length, empty }
  })
  const perNutrient: Record<number, number> = {}
  for (const id of MICRO_IDS) perNutrient[id] = foods.filter((f) => !filled(f.nutrients[String(id)])).length
  const totalEmpty = perFood.reduce((s, x) => s + x.empty.length, 0)
  // explicit measured zeros (key present, value 0) — for transparency, not fillable
  let zeros = 0
  for (const f of foods) for (const id of MICRO_IDS) if (f.nutrients[String(id)] === 0) zeros++
  writeFileSync('c:/tmp/micro-audit.json', JSON.stringify({ count: foods.length, totalCells: foods.length * 27, totalEmpty, explicitZeros: zeros, perNutrient, perFood }, null, 1))
  console.log(`count=${foods.length} totalEmpty(absent)=${totalEmpty}/${foods.length * 27} explicitZeros=${zeros}`)
} else if (cmd === 'numref') {
  const bulk = loadBulk()
  const seen: Record<string, { our: number; names: Set<string>; units: Set<string>; cnt: number }> = {}
  for (const f of bulk)
    for (const n of f.foodNutrients ?? []) {
      const num = String(n?.nutrient?.id)
      if (MAP[num]) {
        seen[num] ??= { our: MAP[num].our, names: new Set(), units: new Set(), cnt: 0 }
        if (typeof n.amount === 'number') seen[num].cnt++
        seen[num].names.add(n.nutrient.name)
        seen[num].units.add(n.nutrient.unitName)
      }
    }
  const lines = Object.keys(MAP).map((num) => {
    const s = seen[num]
    const expU = MAP[num].unit
    const okU = s ? [...s.units].every((u) => norm(u) === norm(expU)) : false
    return `${num} our${MAP[num].our} cnt${s ? s.cnt : 0} unit[${s ? [...s.units].join(',') : '-'}]${okU ? '' : ' UNITMISMATCH'} ${s ? [...s.names].join(';') : 'ABSENT'}`
  })
  writeFileSync('c:/tmp/numref.txt', lines.join('\n'))
  console.log(`wrote numref ${lines.length} rows`)
} else if (cmd === 'list') {
  const bulk = loadBulk()
  const lines = bulk
    .map((f) => `${f.fdcId}  ${f.dataType}  ${f.description}`)
    .sort((a, b) => a.split('  ')[2].localeCompare(b.split('  ')[2]))
  writeFileSync('c:/tmp/foundation-list.txt', lines.join('\n'))
  console.log(`wrote ${lines.length} foundation foods`)
} else if (cmd === 'search') {
  const toks = rest.map((t) => t.toLowerCase())
  const bulk = loadBulk()
  const hits = bulk
    .filter((f) => toks.every((t) => f.description.toLowerCase().includes(t)))
    .map((f) => `${f.fdcId}  ${f.description}`)
  writeFileSync('c:/tmp/search-out.txt', hits.join('\n'))
  console.log(`matches=${hits.length}`)
  for (const h of hits.slice(0, 30)) console.log('  ' + h)
} else if (cmd === 'show') {
  const id = Number(rest[0])
  const f = loadBulk().find((x) => x.fdcId === id)
  if (!f) { console.log('not found'); process.exit(1) }
  const rows: string[] = []
  for (const n of f.foodNutrients ?? []) {
    const num = String(n?.nutrient?.id)
    if (MAP[num] && typeof n.amount === 'number') {
      const conv = MAP[num].x1000 ? n.amount * 1000 : n.amount
      rows.push(`our${MAP[num].our} fdc${num} ${n.nutrient.unitName} raw${n.amount} -> ${conv}  (${n.nutrient.name})`)
    }
  }
  writeFileSync('c:/tmp/show-out.txt', `${f.fdcId} [${f.dataType}] ${f.description}\ncat=${f.foodCategory?.description}\n` + rows.join('\n'))
  console.log(`${f.fdcId} [${f.dataType}] ${f.description}  (${rows.length} mapped micros)`)
} else if (cmd === 'match') {
  // Query tokens keyed by exact Russian name. must = >=1 present; want = bonus.
  const Q: Record<string, { must: string[]; want: string[] }> = {
    'абрикос': { must: ['apricot'], want: ['raw'] },
    'фасоль белая': { must: ['bean'], want: ['white', 'navy', 'cannellini'] },
    'бразильский орех': { must: ['brazil'], want: ['nut'] },
    'брокколи': { must: ['broccoli'], want: ['raw'] },
    'булгур': { must: ['bulgur'], want: ['dry'] },
    'гречка': { must: ['buckwheat'], want: ['groat'] },
    'мука гречневая': { must: ['buckwheat'], want: ['flour'] },
    'грибы экзотические': { must: ['mushroom'], want: ['raw'] },
    'рис дикий': { must: ['rice'], want: ['wild'] },
    'дыня': { must: ['melon', 'cantaloupe'], want: ['cantaloupe', 'raw'] },
    'йогурт': { must: ['yogurt'], want: ['plain', 'whole'] },
    'капуста зелёная': { must: ['collard', 'cabbage'], want: ['collard', 'green'] },
    'капуста краснокочанная': { must: ['cabbage'], want: ['red'] },
    'капуста кудрявая (кале)': { must: ['kale'], want: ['raw'] },
    'кедровые орехи': { must: ['pine', 'pignolia'], want: ['nut', 'dried'] },
    'клубника': { must: ['strawberr'], want: ['raw'] },
    'мука кокосовая': { must: ['coconut'], want: ['flour'] },
    'курица': { must: ['chicken'], want: ['breast', 'raw'] },
    'люциан': { must: ['snapper'], want: ['raw'] },
    'масло канола': { must: ['canola'], want: ['oil'] },
    'молоко миндальное': { must: ['almond'], want: ['milk', 'unsweetened'] },
    'молоко соевое': { must: ['soy'], want: ['milk', 'unsweetened'] },
    'мука миндальная': { must: ['almond'], want: ['flour'] },
    'мука овсяная': { must: ['oat'], want: ['flour'] },
    'нектарин': { must: ['nectarine'], want: ['raw'] },
    'нут': { must: ['chickpea', 'garbanzo'], want: ['dry'] },
    'овёс': { must: ['oat'], want: ['rolled', 'whole', 'raw'] },
    'огурец': { must: ['cucumber'], want: ['peel', 'raw'] },
    'пекан': { must: ['pecan'], want: ['raw'] },
    'макадамия': { must: ['macadamia'], want: ['raw'] },
    'фундук': { must: ['hazelnut', 'filbert'], want: ['raw'] },
    'пастернак': { must: ['parsnip'], want: ['raw'] },
    'перец болгарский': { must: ['pepper'], want: ['bell', 'sweet', 'red'] },
    'плантаны': { must: ['plantain'], want: ['raw', 'yellow'] },
    'просо': { must: ['millet'], want: ['raw', 'dry'] },
    'свекольная зелень': { must: ['beet'], want: ['green'] },
    'семена тыквы': { must: ['pumpkin'], want: ['seed', 'kernel'] },
    'семена чиа': { must: ['chia'], want: ['seed', 'dried'] },
    'семя льна': { must: ['flax'], want: ['seed'] },
    'сладкий картофель': { must: ['sweet potato'], want: ['raw'] },
    'соль': { must: ['salt'], want: ['table', 'iodized'] },
    'фасоль красная': { must: ['kidney'], want: ['red', 'bean'] },
    'фасоль чёрная': { must: ['black'], want: ['bean'] },
  }
  const NEG = ['cooked', 'boiled', 'drained', 'canned', 'frozen', 'roasted', 'toasted', 'baked', 'fried', 'juice', 'sauce', 'sweetened', 'fortified', 'syrup', 'smoked', 'paste', 'moisture', 'salted', 'dehydrated']
  const ANCHORS = [9, 10, 11, 12, 13, 15] // Fe Mg P Ca K Zn (mg, import-survived)
  const ourToFdc: Record<number, string> = {}
  for (const num of Object.keys(MAP)) ourToFdc[MAP[num].our] = num
  const bulk = loadBulk()
  function fdcVal(f: FdcFood, fdcNumId: string): number | undefined {
    for (const n of f.foodNutrients ?? [])
      if (String(n?.nutrient?.id) === fdcNumId && typeof n.amount === 'number') return n.amount
    return undefined
  }
  function scoreOf(desc: string, q: { must: string[]; want: string[] }): number {
    const d = desc.toLowerCase()
    if (!q.must.some((m) => d.includes(m))) return -999
    let s = 10
    for (const w of q.want) if (d.includes(w)) s += 4
    if (d.includes('raw')) s += 3
    if (d.includes('dry')) s += 1
    for (const ng of NEG) if (d.includes(ng)) s -= 5
    s -= desc.length * 0.01
    return s
  }
  function corrErr(our: SeedFood, f: FdcFood): { err: number; used: number } {
    const rs: number[] = []
    for (const a of ANCHORS) {
      const ov = our.nutrients[String(a)]
      const fv = fdcVal(f, ourToFdc[a])
      if (typeof ov === 'number' && ov > 0 && typeof fv === 'number' && fv > 0) rs.push(Math.abs(Math.log(fv / ov)))
    }
    if (!rs.length) return { err: Infinity, used: 0 }
    rs.sort((a, b) => a - b)
    return { err: rs[Math.floor(rs.length / 2)], used: rs.length }
  }
  // Foundation contributes ONLY cells SR Legacy lacks (= biotin). Its sole
  // ambiguous biotin food is bell pepper colour: our Vit C≈138 => red.
  // 2258590 = "Peppers, bell, red, raw" (verified present in this Foundation file).
  const OVERRIDE: Record<string, number> = {
    'перец болгарский': 2258590, // red bell — for biotin from the correct colour
  }
  const foods = foundationFoods(loadSeed())
  const lines: string[] = []
  const chosen: Record<string, any> = {}
  for (const food of foods) {
    if (OVERRIDE[food.name]) {
      const f = bulk.find((x) => x.fdcId === OVERRIDE[food.name])
      if (f) {
        const ce = corrErr(food, f)
        chosen[food.id] = { name: food.name, fdcId: f.fdcId, desc: f.description, score: null, gap: 'OVR', corrErr: ce.used ? ce.err : null, used: ce.used, contenders: 0 }
        lines.push(`${food.name} :: ${f.fdcId} OVERRIDE corr${ce.used ? ce.err.toFixed(2) : '-'}/${ce.used} :: ${f.description}`)
        continue
      }
    }
    const q = Q[food.name]
    if (!q) { lines.push(`${food.name} :: NOQUERY`); continue }
    const ranked = bulk
      .map((f) => ({ f, sc: scoreOf(f.description, q) }))
      .filter((x) => x.sc > -900)
      .sort((a, b) => b.sc - a.sc)
    if (!ranked.length) { lines.push(`${food.name} :: NOMATCH`); continue }
    const top = ranked[0].sc
    const contenders = ranked.filter((x) => x.sc >= top - 6)
    const withCorr = contenders.map((x) => ({ ...x, ...corrErr(food, x.f) }))
    const finite = withCorr.filter((x) => Number.isFinite(x.err))
    const pick = (finite.length ? finite.sort((a, b) => a.err - b.err) : withCorr)[0]
    const gap = ranked.length > 1 ? (ranked[0].sc - ranked[1].sc).toFixed(0) : '99'
    const corrTag = pick.used ? `corr${pick.err.toFixed(2)}/${pick.used}${pick.err > 0.4 ? 'FLAG' : ''}` : 'NOcorr'
    chosen[food.id] = { name: food.name, fdcId: pick.f.fdcId, desc: pick.f.description, score: pick.sc, gap, corrErr: pick.used ? pick.err : null, used: pick.used, contenders: contenders.length }
    lines.push(`${food.name} :: ${pick.f.fdcId} g${gap} ${corrTag} cont${contenders.length} :: ${pick.f.description}`)
  }
  writeFileSync('c:/tmp/match.txt', lines.join('\n'))
  writeFileSync('c:/tmp/match-chosen.json', JSON.stringify(chosen, null, 1))
  console.log(`match ${lines.length} foods, chosen ${Object.keys(chosen).length}`)
} else if (cmd === 'extract') {
  // Build the non-lossy backfill payload {ourId: {nutrientId: value}} from the
  // chosen FDC matches. Fills ONLY currently-empty micro cells; skips FDC values
  // that are absent or measured-zero; converts Cu/Mn mg->µg; asserts units.
  const chosen = JSON.parse(readFileSync('c:/tmp/match-chosen.json', 'utf-8')) as Record<string, { fdcId: number; desc: string }>
  const bulk = loadBulk()
  const byId = new Map(bulk.map((f) => [f.fdcId, f]))
  const foods = foundationFoods(loadSeed())
  const payload: Record<string, Record<string, number>> = {}
  const review: string[] = []
  const unitFlags: string[] = []
  let totalFill = 0
  function pick(f: FdcFood, fdcNumId: string): { amt: number; unit: string } | undefined {
    for (const n of f.foodNutrients ?? [])
      if (String(n?.nutrient?.id) === fdcNumId && typeof n.amount === 'number') return { amt: n.amount, unit: n.nutrient.unitName }
    return undefined
  }
  for (const food of foods) {
    const c = chosen[food.id]
    if (!c) { review.push(`${food.name} :: SKIP no match`); continue }
    const f = byId.get(c.fdcId)
    if (!f) { review.push(`${food.name} :: SKIP fdcId ${c.fdcId} not found`); continue }
    const adds: Record<string, number> = {}
    const zeros: number[] = []
    for (const num of Object.keys(MAP)) {
      const { our, unit, x1000 } = MAP[num]
      const cur = food.nutrients[String(our)]
      if (present(cur)) continue // non-lossy: never touch present cells (incl. explicit 0)
      const got = pick(f, num)
      if (!got) continue // absent in FDC -> leave empty
      if (got.amt <= 0) { zeros.push(our); continue } // measured zero -> real zero, leave empty
      if (norm(got.unit) !== norm(unit)) { unitFlags.push(`${food.name} id${our} fdcUnit=${got.unit} exp=${unit}`); continue }
      const val = x1000 ? got.amt * 1000 : got.amt
      adds[String(our)] = Math.round(val * 10000) / 10000
    }
    const n = Object.keys(adds).length
    if (n) { payload[food.id] = adds; totalFill += n }
    const addStr = Object.keys(adds).map((k) => `${k}=${adds[k]}`).join(' ')
    review.push(`${food.name} :: ${c.fdcId} +${n}${zeros.length ? ` z[${zeros.join(',')}]` : ''} :: ${addStr}`)
  }
  writeFileSync('c:/Users/booty/Documents/GitHub/disher/apps/disher-backend-3.0/seed/micro-backfill-payload.json', JSON.stringify(payload, null, 2))
  writeFileSync('c:/tmp/extract-review.txt', review.join('\n'))
  if (unitFlags.length) writeFileSync('c:/tmp/extract-unitflags.txt', unitFlags.join('\n'))
  console.log(`extract: ${Object.keys(payload).length} foods, ${totalFill} cells filled, unitFlags=${unitFlags.length}`)
} else if (cmd === 'names') {
  const foods = foundationFoods(loadSeed())
  const lines = foods.map((f, i) => `${String(i + 1).padStart(2)}  ${f.id}  ${f.name}`)
  writeFileSync('c:/tmp/names.txt', lines.join('\n'))
  console.log(`names ${foods.length}`)
} else if (cmd === 'roster') {
  const foods = foundationFoods(loadSeed())
  const lines = foods.map((f, i) => {
    const empty = MICRO_IDS.filter((id) => !filled(f.nutrients[String(id)]))
    return `${String(i + 1).padStart(2)}  ${f.id}  filled${27 - empty.length}  empty:${empty.join(',')}`
  })
  writeFileSync('c:/tmp/roster.txt', lines.join('\n'))
  console.log(`roster ${foods.length} foods`)
} else if (cmd === 'backfill') {
  // Surgical, non-lossy merge: insert ONLY new keys into each food's nutrients
  // object via text splice — preserves the file's exact formatting/escapes
  // (portion labels use \uXXXX that a full JSON.stringify would mangle).
  // Reads seed/micro-backfill-payload.json (produced by micro-compose.ts).
  const write = rest.includes('--write')
  const payload = JSON.parse(
    readFileSync(resolve(__dirname, '../seed/micro-backfill-payload.json'), 'utf-8'),
  ) as Record<string, Record<string, number>>
  let text = readFileSync(SRC, 'utf-8')
  const arr = JSON.parse(text) as Array<{ id: string; nutrients: Record<string, number> }>
  const occ: number[] = []
  for (let idx = text.indexOf('"nutrients": {'); idx !== -1; idx = text.indexOf('"nutrients": {', idx + 1)) occ.push(idx)
  if (occ.length !== arr.length) { console.log(`ABORT: occ ${occ.length} != arr ${arr.length}`); process.exit(1) }
  let added = 0, foodsTouched = 0, conflicts = 0
  for (let i = arr.length - 1; i >= 0; i--) {
    const add = payload[arr[i].id]
    if (!add) continue
    const keys = Object.keys(add).filter((k) => arr[i].nutrients[k] === undefined || arr[i].nutrients[k] === null)
    conflicts += Object.keys(add).length - keys.length
    if (!keys.length) continue
    const braceOpen = text.indexOf('{', occ[i])
    const closeIdx = text.indexOf('}', braceOpen) // nutrients is flat -> first } closes it
    const inner = text.slice(braceOpen + 1, closeIdx)
    const ins = keys.map((k) => `,\n      "${k}": ${add[k]}`).join('')
    const newInner = inner.replace(/\s+$/, '') + ins + '\n    '
    text = text.slice(0, braceOpen + 1) + newInner + text.slice(closeIdx)
    added += keys.length
    foodsTouched++
  }
  // verify it still parses and is a strict superset (no existing value changed)
  const reparsed = JSON.parse(text) as typeof arr
  let broke = 0
  for (let i = 0; i < arr.length; i++)
    for (const k of Object.keys(arr[i].nutrients))
      if (reparsed[i].nutrients[k] !== arr[i].nutrients[k]) broke++
  console.log(`${write ? 'WROTE' : 'DRY'} added=${added} foods=${foodsTouched} conflicts=${conflicts} parseOK changedExisting=${broke}`)
  if (broke) { console.log('ABORT: existing values changed'); process.exit(1) }
  if (write) writeFileSync(SRC, text)
} else {
  console.log('cmd: audit | numref | list | search <toks> | show <fdcId> | roster | match | extract | backfill [--write]')
}
