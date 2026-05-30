import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MAP, MICRO_IDS, loadBulk, loadSeed, foundationFoods } from './micro-tool'
const __dirname = dirname(fileURLToPath(import.meta.url))
const chosen = JSON.parse(readFileSync('c:/tmp/match-chosen.json', 'utf-8')) as Record<string, { fdcId: number }>
const payload = JSON.parse(readFileSync(resolve(__dirname, '../seed/micro-backfill-payload.json'), 'utf-8')) as Record<string, Record<string, number>>
const bulk = loadBulk()
const byId = new Map(bulk.map((f) => [f.fdcId, f]))
const foods = foundationFoods(loadSeed())
const ourToFdc: Record<number, string> = {}
for (const num of Object.keys(MAP)) ourToFdc[MAP[num].our] = num
const fdcAmt = (f: any, fdcNumId: string) => { for (const n of f.foodNutrients) if (String(n?.nutrient?.id) === fdcNumId && typeof n.amount === 'number') return n.amount; return undefined }
let empty = 0, fdcHasPos = 0, inPayload = 0
const missed: string[] = []
for (const food of foods) {
  const c = chosen[food.id]; const f = c ? byId.get(c.fdcId) : null
  for (const our of MICRO_IDS) {
    const cur = food.nutrients[String(our)]
    if (typeof cur === 'number' && cur > 0) continue
    empty++
    const amt = f ? fdcAmt(f, ourToFdc[our]) : undefined
    const has = typeof amt === 'number' && amt > 0
    if (has) fdcHasPos++
    const inP = payload[food.id] && payload[food.id][String(our)] !== undefined
    if (inP) inPayload++
    if (has && !inP) missed.push(`${food.name}#${our}(fdc${amt})`)
  }
}
console.log(`empty=${empty} fdcHasPositive=${fdcHasPos} inPayload=${inPayload} MISSED=${missed.length}`)
console.log('first missed: ' + missed.slice(0, 12).join(' '))
