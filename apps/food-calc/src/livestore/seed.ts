import type { Store } from '@livestore/livestore'
import { events } from './schema'
import { SYSTEM_USER_ID } from '@/shared/lib/user'
import { DEFAULT_NORM } from '@/entities/daily-norm/model/default-norm'

// ─── Types matching combined-foods-final.json ───────────────────────────────

interface FinalFood {
  id: string
  name: string
  source?: string
  categories: string[]
  nutrients: Record<string, number>
  portions: Array<{ label: string; labelEng?: string; amount: number; unit: string; grams: number }>
}

// ─── Seed logic ──────────────────────────────────────────────────────────────

const SEED_VERSION = 1
const SEED_KEY = 'livestore_seed_version'

export function isSeedNeeded(): boolean {
  const stored = localStorage.getItem(SEED_KEY)
  return stored !== String(SEED_VERSION)
}

function markSeeded(): void {
  localStorage.setItem(SEED_KEY, String(SEED_VERSION))
}

/**
 * Seed reference products + default daily norm into LiveStore.
 * Called once on first launch. Reports progress via callback.
 */
export async function runSeed(
  store: Store,
  onProgress: (done: number, total: number) => void,
): Promise<void> {
  // 1. Fetch combined-foods-final.json from public/
  const res = await fetch('/combined-foods-final.json')
  if (!res.ok) throw new Error(`Failed to fetch seed data: ${res.status}`)
  const foods: FinalFood[] = await res.json()

  const total = foods.length + 1 // +1 for daily norm
  let done = 0

  // 2. Seed products in batches (avoid blocking UI)
  const BATCH_SIZE = 50
  for (let i = 0; i < foods.length; i += BATCH_SIZE) {
    const batch = foods.slice(i, i + BATCH_SIZE)
    const batchEvents = batch.map((food) => {
      return events.productCreated({
        id: food.id,
        userId: SYSTEM_USER_ID,
        name: food.name,
        nameEng: '',
        description: '',
        descriptionEng: '',
        source: food.source ?? '',
        pricePerKg: 0,
        nutrients: JSON.stringify(food.nutrients),
        portions: JSON.stringify(food.portions),
        categories: JSON.stringify(food.categories),
      })
    })

    store.commit(...batchEvents)
    done += batch.length
    onProgress(done, total)

    // Yield to UI thread between batches
    await new Promise((r) => setTimeout(r, 0))
  }

  // 3. Seed default daily norm
  store.commit(
    events.dailyNormCreated({
      id: DEFAULT_NORM.id,
      name: DEFAULT_NORM.name,
      description: DEFAULT_NORM.description,
      userId: SYSTEM_USER_ID,
      items: JSON.stringify(DEFAULT_NORM.items),
    }),
  )
  done++
  onProgress(done, total)

  // 4. Mark seed complete
  markSeeded()
}
