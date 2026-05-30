import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const seed = JSON.parse(readFileSync(resolve(__dirname, '../seed/combined-foods-final.json'), 'utf-8')) as any[]
const p = JSON.parse(readFileSync(resolve(__dirname, '../seed/micro-backfill-payload.json'), 'utf-8')) as Record<string, Record<string, number>>
const byId = new Map(seed.map((f) => [f.id, f]))
let overlaps = 0, cells = 0, zeros = 0, neg = 0, badId = 0
for (const id of Object.keys(p)) {
  const f = byId.get(id)
  if (!f) { badId++; continue }
  for (const k of Object.keys(p[id])) {
    cells++
    if (f.nutrients[k] !== undefined && f.nutrients[k] !== null) overlaps++
    const v = p[id][k]
    if (v === 0) zeros++
    if (v < 0) neg++
  }
}
console.log(`foods=${Object.keys(p).length} cells=${cells} OVERLAPS=${overlaps} zeroValues=${zeros} negValues=${neg} badIds=${badId}`)
