/**
 * Deduplicates combined-foods-final.json by merging skurikhin + USDA entries
 * that share the same normalized name.
 *
 * Strategy:
 * - Find pairs with identical normalized names across sources
 * - Merge nutrients: take union of all nutrient IDs
 * - On conflict (same nutrient ID, different value): prefer the source with more total nutrients
 * - Keep id/source/categories from the "winner" (more nutrients)
 * - Output: combined-foods-deduped.json
 *
 * Run: npx tsx scripts/deduplicate-foods.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface FoodItem {
  id: string
  name: string
  source: string
  categories: string[]
  nutrients: Record<string, number>
  portions: Array<{ l: string; g: number }>
}

const INPUT = join(__dirname, '../public/combined-foods-final.json')
const OUTPUT = join(__dirname, '../public/combined-foods-deduped.json')
const REPORT = join(__dirname, '../public/dedup-report.txt')

const SOURCE_PRIORITY: Record<string, number> = {
  'usda-sr-legacy': 3,
  'usda-foundation': 2,
  'skurikhin': 1,
  'custom': 0,
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/«|»/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function nutrientCount(item: FoodItem): number {
  return Object.keys(item.nutrients).length
}

/**
 * Pick the "base" item — the one whose id/source/categories we keep.
 * Priority: more nutrients wins. Tie-break: higher source priority.
 */
function pickBase(a: FoodItem, b: FoodItem): [FoodItem, FoodItem] {
  const countA = nutrientCount(a)
  const countB = nutrientCount(b)
  if (countA !== countB) {
    return countA >= countB ? [a, b] : [b, a]
  }
  const prioA = SOURCE_PRIORITY[a.source] ?? 0
  const prioB = SOURCE_PRIORITY[b.source] ?? 0
  return prioA >= prioB ? [a, b] : [b, a]
}

function mergeItems(items: FoodItem[]): FoodItem {
  if (items.length === 1) return items[0]

  // Sort all items by nutrient count desc, then source priority desc
  const sorted = [...items].sort((a, b) => {
    const diff = nutrientCount(b) - nutrientCount(a)
    if (diff !== 0) return diff
    return (SOURCE_PRIORITY[b.source] ?? 0) - (SOURCE_PRIORITY[a.source] ?? 0)
  })

  const base = sorted[0]
  const merged: FoodItem = {
    id: base.id,
    name: base.name,
    source: base.source,
    categories: [...new Set(sorted.flatMap(i => i.categories))],
    nutrients: { ...base.nutrients },
    portions: base.portions.length > 0
      ? base.portions
      : sorted.find(i => i.portions.length > 0)?.portions ?? [],
  }

  // Fill in missing nutrients from other sources
  for (let i = 1; i < sorted.length; i++) {
    const donor = sorted[i]
    for (const [nid, value] of Object.entries(donor.nutrients)) {
      if (!(nid in merged.nutrients)) {
        merged.nutrients[nid] = value
      }
    }
  }

  return merged
}

// --- Main ---

const raw: FoodItem[] = JSON.parse(readFileSync(INPUT, 'utf-8'))
console.log(`Loaded ${raw.length} items`)

// Group by normalized name
const byName = new Map<string, FoodItem[]>()
for (const item of raw) {
  const key = normalize(item.name)
  if (!byName.has(key)) byName.set(key, [])
  byName.get(key)!.push(item)
}

const result: FoodItem[] = []
const reportLines: string[] = []
let mergedCount = 0
let keptCount = 0

for (const [normName, group] of byName) {
  // Separate by source type: custom items are never merged
  const customItems = group.filter(i => i.source === 'custom')
  const dataItems = group.filter(i => i.source !== 'custom')

  // Keep all custom items as-is
  result.push(...customItems)

  if (dataItems.length <= 1) {
    result.push(...dataItems)
    keptCount += dataItems.length
    continue
  }

  // Check if duplicates are actually from different sources
  const sources = new Set(dataItems.map(i => i.source))
  if (sources.size === 1) {
    // Same source — keep all (not true duplicates, just same name)
    result.push(...dataItems)
    keptCount += dataItems.length
    continue
  }

  // We have cross-source duplicates — merge them
  const merged = mergeItems(dataItems)
  result.push(merged)
  mergedCount++

  // Report
  const donors = dataItems.filter(i => i.id !== merged.id)
  const baseCount = nutrientCount(dataItems.find(i => i.id === merged.id)!)
  const mergedNutrientCount = nutrientCount(merged)
  const donorInfo = donors
    .map(d => `${d.source}/${d.id} (${nutrientCount(d)} nutrients)`)
    .join(', ')

  reportLines.push(
    `MERGED: "${merged.name}" → kept ${merged.source}/${merged.id} (${baseCount}→${mergedNutrientCount} nutrients), absorbed: ${donorInfo}`
  )
}

// Sort result: custom first, then by name
result.sort((a, b) => {
  if (a.source === 'custom' && b.source !== 'custom') return 1
  if (a.source !== 'custom' && b.source === 'custom') return -1
  return a.name.localeCompare(b.name, 'ru')
})

console.log(`\nResults:`)
console.log(`  Original items: ${raw.length}`)
console.log(`  After dedup: ${result.length}`)
console.log(`  Merged groups: ${mergedCount}`)
console.log(`  Items removed (absorbed): ${raw.length - result.length}`)

// Write output
writeFileSync(OUTPUT, JSON.stringify(result, null, 4), 'utf-8')
console.log(`\nWritten to ${OUTPUT}`)

// Write report
const reportHeader = [
  `Deduplication Report`,
  `====================`,
  `Original: ${raw.length} items`,
  `After dedup: ${result.length} items`,
  `Merged groups: ${mergedCount}`,
  `Items absorbed: ${raw.length - result.length}`,
  ``,
  `--- Merge Details ---`,
  ``,
]
writeFileSync(REPORT, [...reportHeader, ...reportLines].join('\n'), 'utf-8')
console.log(`Report written to ${REPORT}`)
