# Disher — Project Specification

Shared reference for `food-calc` (frontend) and `disher-backend-3.0` (backend).

---

## Architecture Overview

| Layer | Stack |
|---|---|
| Frontend | React + TypeScript + Vite, Feature-Sliced Design |
| Backend | Fastify (API server) |
| Database | LiveStore — event-sourced, offline-first, SQLite (wa-sqlite + OPFS) on client |
| Sync (optional) | Cloudflare Workers + Durable Objects + D1 via `@livestore/sync-cf` |
| Auth | JWT — `sub` claim maps to `userId`; anonymous mode for local-only |

### Ports (local dev)

| Service | Port |
|---|---|
| Frontend (Vite) | 3000 |
| Fastify API | 3100 |
| LiveStore sync worker (optional) | 8787 |

---

## Data Layer: LiveStore

All client data lives in **LiveStore** — an event-sourced, offline-first local database.

### Architecture

```
Events (immutable log) → Materializers (reducers) → SQLite Tables (queryable state)
```

- **Events** — immutable facts: `v1.ProductCreated`, `v1.DishDeleted`, etc.
- **Materializers** — pure functions mapping each event to SQL INSERT/UPDATE
- **Tables** — SQLite read model, queried via `queryDb()` + `useQuery()`
- **Persistence** — OPFS (Origin Private File System) via Web Worker
- **Multi-tab** — SharedWorker for automatic tab sync
- **Cross-device** — optional, via `VITE_LIVESTORE_SYNC_URL` env var

### Key Files

| File | Purpose |
|---|---|
| `src/livestore/schema.ts` | Events, tables, materializers, exported `schema` |
| `src/livestore/worker.ts` | Web Worker: `makeWorker({ schema })` + optional CF sync |
| `src/livestore/LiveStoreSetup.tsx` | `makePersistedAdapter` (OPFS + SharedWorker) + `<LiveStoreProvider>` |
| `src/livestore/seed.ts` | Seeds ~5000 reference products + default daily norm |
| `src/livestore/SeedGate.tsx` | Progress bar during seed, blocks rendering until done |

### Tables (SQLite, materialized from events)

| Table | Key Columns | Notes |
|---|---|---|
| `products` | id, userId, name, nameEng, pricePerKg, **nutrients** (JSON), **portions** (JSON), categories, deletedAt | ~5000 reference + user-created |
| `dishes` | id, name, userId, createdAt, updatedAt, deletedAt | User recipes |
| `dish_items` | id, dishId, productId, quantity, userId, deletedAt | Recipe contents |
| `dish_portions` | id, dishId, userId, label, amount, unit, grams, deletedAt | Dish serving sizes |
| `schedule_foods` | id, date, time, type, quantity, productId, dishId, userId, deletedAt | Daily schedule items |
| `schedule_events` | id, date, time, endTime, text, **atoms** (JSON), userId, deletedAt | Health events |
| `daily_norms` | id, userId, name, description, **items** (JSON), deletedAt | Nutritional targets |
| `periods` | id, userId, name, startDate, endDate, colorIndex, deletedAt | Time period groupings |

### Soft Deletes

All deletes are soft: `deletedAt: Date.now()`. All queries filter by `{ deletedAt: null }`.

### Query & Mutation Patterns

```typescript
// Queries — entity/api/queries.ts
const allProducts$ = queryDb(tables.products.where({ deletedAt: null }), { label: 'products' });
const products = useQuery(allProducts$);

// Single entity with deps
useQuery(queryDb(tables.products.where({ id: productId ?? "" }), { label: `product-${id}`, deps: [id] }));

// Mutations — entity/api/mutations.ts
function createProduct(store: Store, data) {
  store.commit(events.productCreated({ id: crypto.randomUUID(), userId: getCurrentUserId(), ...data }));
}

// Atomic multi-event commit
store.commit(
  ...itemIds.map(id => events.dishItemDeleted({ id, deletedAt })),
  events.dishDeleted({ id: dishId, deletedAt }),
);
```

### Seed Flow

1. Check `localStorage` for `SEED_VERSION` (current: 2)
2. If mismatch or DB empty → fetch `/combined-foods-final.json`
3. Batch 50 products per commit, yield between batches
4. Seed default daily norm (`DEFAULT_NORM`, userId `__system__`)
5. Save version to localStorage

---

## Data Model

### `userId` conventions

| Value | Meaning |
|---|---|
| `"__system__"` | Immutable reference data (products, dailyNorms) — read-only |
| `<uuid>` | User-owned record |

### JSON Columns

Some columns store JSON strings (not normalized tables):

| Column | Table | Format |
|---|---|---|
| `nutrients` | products | `Record<nutrientId, quantity>` — nutrients per 100g |
| `portions` | products | `Array<{label, amount, unit, grams}>` |
| `categories` | products | `string[]` |
| `items` | daily_norms | `Record<nutrientId, quantity>` |
| `atoms` | schedule_events | `Atom[]` — structured health event data |

Parsed via `JSON.parse()` + `useMemo()` in query hooks.

---

## Dexie Reference Database (legacy)

> Previously used for USDA `foodNutrients` bulk data (450K rows). Now unused after LiveStore migration — all nutrient data is embedded as JSON in the `products` table. Files `src/api/dexie/` can be removed.

---

## API Endpoints (Backend)

### `GET /api/system/version`

Returns sum of all system collection counts. Used by frontend to check if reference data needs sync.

```json
{ "version": 936015 }
```

### `GET /api/system/export/food-nutrients`

Streams all USDA `foodNutrients` as ndjson. Legacy — was used for Dexie bulk load.

### `GET /api/system/counts`

Per-collection counts. Used only by debug SystemPage.

**Implementation:** [disher-backend-3.0/src/api/routes/system.ts](disher-backend-3.0/src/api/routes/system.ts)

---

## LiveStore Best Practices (from official docs)

### Events

1. **Past-tense naming** — `todoCreated`, not `createTodo`. Semantic: "this happened."
2. **Include all data in event payload** — materializers must be deterministic. No `crypto.randomUUID()` inside materializers; generate IDs before `store.commit()`.
3. **Soft deletes over hard deletes** — avoids concurrency issues with event sourcing.
4. **Events are immutable** — once deployed, event definitions cannot be removed. New fields must have defaults or be optional.
5. **Schema evolution** — add fields with `Schema.optionalWith(...)` + default; never remove deployed events.
6. **`Events.synced()` for cross-device data** — all our events are already synced-ready.

### Materializers

1. **Deterministic & side-effect free** — pure mapping from event → SQL operation.
2. **All data via event payload** — never derive values inside materializers.
3. **Keep logic simple** — complex calculations belong in event creation, not materialization.
4. **Transactional** — all operations in a single materializer are atomic.

### Queries

1. **Use `queryDb()` with labels** — `{ label: 'products' }` for debugging.
2. **Use `deps` for dynamic queries** — re-evaluate when deps change: `{ deps: [productId] }`.
3. **Prefer SQL-level filtering** — use `.where()` instead of JS `.filter()` on results.
4. **Use `LIMIT` for pagination** — avoid loading all rows when only a subset is needed.
5. **Avoid `OFFSET` on large tables** — use cursor-based pagination instead.
6. **Treat query results as immutable** — never mutate returned objects.

### React Integration

1. **`batchUpdates` from react-dom** — pass to `<LiveStoreProvider>` to avoid intermediate renders.
2. **`useQuery()` for reactive subscriptions** — auto re-renders on data changes.
3. **`store.query()` for one-off reads** — outside React render cycle.
4. **`clientDocument` for ephemeral UI state** — filter settings, form state that shouldn't sync.

### Performance

1. **OPFS storage** — reliable persistence without blocking main thread.
2. **SharedWorker** — automatic multi-tab coordination.
3. **Batch related events** — single `store.commit(event1, event2, ...)` reduces re-renders.
4. **Indexed columns in WHERE** — for large tables, ensure filtered columns have indexes.

---

## What We Do Well vs. Best Practices

### Following best practices

| Practice | Status |
|---|---|
| Past-tense event naming (`v1.ProductCreated`) | Done |
| IDs generated before commit (`crypto.randomUUID()`) | Done |
| Soft deletes via `deletedAt` | Done |
| All events `Events.synced()` | Done |
| `batchUpdates` passed to LiveStoreProvider | Done |
| OPFS + SharedWorker persistence | Done |
| Atomic multi-event commits (`store.commit(...)`) | Done |
| Deterministic materializers (pure event → SQL) | Done |
| Query labels for debugging | Done |
| `deps` for dynamic queries | Done |
| `safeMutate()` error handling wrapper | Done |
| User-scoped `storeId` | Done |
| Schema evolution with `Schema.optionalWith()` | Done |

### Not following best practices

| Issue | Details | Recommended Fix |
|---|---|---|
| **Client-side filtering instead of SQL WHERE** | `useProducts(search)` loads ALL products, filters in JS. `useProductsByIds()` loads all, filters by Set. `useNutrientsByProductIds()` same. | Use `.where()` with SQL LIKE or parameterized queries. For ID filtering, use `sql` tagged template with `IN (...)` clause. |
| **No `clientDocument` for UI state** | Filter settings, search state, active tabs are in Zustand/React state. | Migrate ephemeral but persistent UI state (selected filters, last viewed date) to `clientDocument`. |
| **Repeated JSON parsing** | `JSON.parse(product.nutrients)` duplicated in `useProductNutrients`, `useNutrientsByProductIds`, components. | Create a shared parser helper or a computed query that handles parsing once. |
| **No indexes on frequently filtered columns** | `date` on `schedule_foods`, `dishId` on `dish_items`/`dish_portions` — no explicit indexes defined. | Add SQLite indexes for foreign key columns used in `.where()` filters. |
| **Devtools disabled** | Disabled due to Vite URL parse error. Only `window.__debugLiveStore` available. | Investigate fix or upgrade `@livestore/devtools-vite`. Devtools at `/_livestore` are valuable for inspecting events and state. |
| **No `computed()` or `signal()` usage** | All reactivity is via `useQuery()` + `useMemo()`. No LiveStore-native computed values or signals. | Consider `computed()` for derived data that combines multiple queries (e.g., enriched schedule foods, nutrient totals). |
| **`as any` casts on query results** | `rows.filter((r: any) => ...)` — losing type safety. | Use proper typed result schemas from `queryDb()`. |

---

## Improvement Roadmap

### Phase 1: Quick Wins

- [ ] **Add SQL indexes** — `schedule_foods(date)`, `dish_items(dishId)`, `dish_portions(dishId)`, `schedule_foods(userId)`. One-line additions in schema.
- [ ] **Replace client-side filtering with SQL WHERE** — `useProducts(search)` should use SQL `LIKE` via raw `queryDb({ query: sql\`...\` })`. `useProductsByIds()` should use `IN (...)`.
- [ ] **Extract JSON parsing helpers** — `parseNutrients(json: string)`, `parsePortions(json: string)`, `parseAtoms(json: string)`. Reuse everywhere.
- [ ] **Fix `as any` casts** — type query results properly using LiveStore's schema-derived types.

### Phase 2: LiveStore-Native Patterns

- [ ] **Adopt `clientDocument`** — for persistent UI state: selected nutrient filters, last viewed schedule date, search preferences. Replaces some Zustand stores.
- [ ] **Adopt `computed()`** — for derived values that combine multiple queries (enriched schedule foods with product/dish data, nutrient totals per day). Moves logic from `useMemo` in components to LiveStore's reactivity system.
- [ ] **Re-enable devtools** — investigate `@livestore/devtools-vite` compatibility with current Vite version. The `/_livestore` inspector is very useful for debugging events and state.

### Phase 3: Performance & Scale

- [ ] **Paginated queries for products** — currently loads all ~5000 products at once. Use `LIMIT` + cursor-based pagination for search results.
- [ ] **Incremental view maintenance (IVM)** — for heavy computed views (nutrient totals across schedule). LiveStore supports materialized views that update incrementally.
- [ ] **Benchmark large eventlog** — as events accumulate, test replay performance. Consider eventlog compaction if needed.

### Phase 4: Sync & Multi-Device

- [ ] **Enable Cloudflare sync** — infrastructure exists (`apps/livestore-sync-worker/`). Set `VITE_LIVESTORE_SYNC_URL` and test.
- [ ] **Auth integration** — user-scoped sync with JWT tokens.
- [ ] **Conflict resolution testing** — verify behavior when same record is modified on two devices offline.

---

## Design Code Guidance

### Reference: `food-calc/src/pages/home-page/ui/Navigation.tsx` + `Navigation.module.scss`

This component is the **style reference** for the project. Key patterns to follow:

| Pattern | Example |
|---|---|
| Oversized decorative type | `.v3Day` — `font-size: 7rem; font-weight: 800; color: rgba(0,0,0,0.06)` |
| Display font for headings | `font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.05em` |
| Mono font for data/labels | `font-family: var(--font-mono); letter-spacing: 0.06em` |
| Muted accent color | `color: var(--color-purple)` for secondary info |
| Frosted glass fixed elements | `background: rgba(255,255,255,0.85); backdrop-filter: blur(20px)` |
| Generous spacing | Large padding, `min-height: 80px`, breathing room |
| Minimal color palette | Near-black text, `rgba(0,0,0,...)` opacity variants, white backgrounds |
| Subtle entrance animations | `@keyframes` with `opacity` + `transform`, using `var(--duration-normal)` |

### Typography hierarchy

- **Display** (`--font-display`): headings, labels, prominent UI text — bold, uppercase, tracked
- **Mono** (`--font-mono`): data values, entity type names (блюдо, продукт), timestamps
- **Sans** (`--font-sans`): body text, decorative oversized numerals

---

## Design Variant Testing Pattern

When exploring multiple visual options for a component, use the `useDesignVariants` hook to cycle through them in-app so you can choose with your eyes — not your imagination.

### Hook: `shared/lib/useDesignVariants.ts`

```typescript
const { index } = useDesignVariants(VARIANTS.length, 2000); // cycles every 2s
const V = VARIANTS[index];
```

### How to apply

1. Define each variant as a separate component (`Variant1`, `Variant2`, …) in the same file
2. Use `useDesignVariants` to cycle the index
3. Wrap with a `variantWrap` + `variantBadge` to show the current variant number in the UI:

```tsx
<span className={styles.variantWrap}>
  <span className={styles.variantBadge}>{index + 1}</span>
  <V {...props} />
</span>
```

4. Pick the winner, delete the others, remove the hook and badge wrapper

### Reusable SCSS for the badge

```scss
.variantWrap { position: relative; display: inline-flex; }
.variantBadge {
  position: absolute; top: -6px; left: -6px; z-index: 10;
  width: 16px; height: 16px; border-radius: 50%;
  background: var(--color-purple); color: #fff;
  font-family: var(--font-mono); font-size: 9px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none; user-select: none;
}
```
