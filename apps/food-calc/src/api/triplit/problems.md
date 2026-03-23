# Triplit / Session — Known Problems & Trade-offs

## 1. Sync-then-disconnect anti-pattern (FIXED)

**Was**: `startSession → syncCollections → endSession → count IDB → retry`
**Problem**: Uses Triplit like a one-shot HTTP loader. Fights the engine's design.
**Fix**: Version check via `localStorage`. Connect only when version mismatches. Trust `onRemoteFulfilled` as authoritative sync signal. No retry loop, no IDB count verification.

---

## 2. Race condition: IDB count after endSession (FIXED)

**Was**: `fetchLocalCounts()` called immediately after `endSession()`.
**Problem**: `onRemoteFulfilled` fires when Triplit's in-memory state is updated, but IDB writes are batched asynchronously and may still be in flight. `endSession()` does not flush them. Result: `foodPortions` (and other large collections) report lower counts than server → false mismatch → unnecessary retry.
**Fix**: Removed IDB count verification entirely. Version number stored in `localStorage` replaces per-collection count comparison.

---

## 3. All 6 collections synced simultaneously (PARTIALLY FIXED)

**Was**: `Promise.all(SYSTEM_COLLECTIONS.map(waitForServerResponse))` — all at once.
**Problem**: `foods`, `foodPortions`, `foodNutrients` can be 300K+ rows each. Simultaneous IDB write bursts from 6 collections compete for main-thread bandwidth, causing frame drops.
**Current state**: `waitForCollection` still runs all in parallel (simplified from batched version to keep code clean after version-check refactor).
**Remaining option**: batch small collections first, yield, then large — worth revisiting if jank persists after bulk-import is implemented.

---

## 4. First-ever sync is slow (OPEN)

**Problem**: USDA reference data (~300K+ rows across `foods`, `foodPortions`, `foodNutrients`, `nutrients`) is synced via WebSocket on first load. WebSocket is the wrong transport for bulk static data — it's slow and causes UI lag on the first visit.
**Versioning helps**: subsequent loads are instant (one HTTP check, no sync). But the first visit still suffers.

### Root cause: reference data lives inside Triplit collections

Collections are mixed:
- `nutrients`, `foodNutrients` — purely system (no `userId`, no user variant)
- `foods`, `foodPortions` — mixed (`userId = "__system__"` for USDA, `userId = user.id` for user-created)
- `dailyNorms`, `dailyNormItems` — mixed (same pattern)

`dishItems` and `scheduleFoods` reference `foods` via Triplit relational queries (`.Include("food")`).
This means any split of the `foods` collection requires removing these `.Include()` calls and doing manual lookups from two sources.

### Option A — Partial split: pure-system collections → Dexie, `foods` stays in Triplit

Move only collections that have **no user variants** to Dexie (via HTTP bulk + `Dexie.bulkPut`):
- `nutrients` → Dexie
- `foodNutrients` → Dexie
- `foodPortions` → Dexie (USDA portions; if user creates custom portions, those stay in Triplit)

Keep in Triplit: `foods` (USDA + user), `dailyNorms`, `dailyNormItems`, all user data.

**Pros:**
- `dishItems.Include("food")` and `scheduleFoods.Include("food")` work without changes
- No component changes — only ~4 query hooks updated
- Food search stays in Triplit — reactive, no source merging
- `foodNutrients` is the largest collection; removing it from WebSocket is the biggest win
- Nutrient lookups become instant local IDB reads after first sync

**Cons:**
- `foods` (USDA) still syncs via WebSocket on first visit — if foods is large (branded USDA = 300K+), the main bottleneck remains
- Mixed Triplit collection persists — USDA + user foods in one place (architectural debt)
- Future user-added food nutrients would need a separate Triplit collection or merge logic (currently no such feature)

**Hooks to change:**
- `useProductNutrients(foodId)` → Dexie query instead of Triplit
- `useProductsByIds(ids)` → remove `.Include("nutrients")`, add parallel Dexie query
- `useProductPortions(foodId)` → Dexie query instead of Triplit
- `useDailyNormItems` → remove `.Include("nutrient")`, add Dexie lookup

### Option B — Full split: all USDA data → Dexie, Triplit for user data only

Move all USDA reference data to Dexie: `foods` (USDA), `foodNutrients`, `nutrients`, `foodPortions`.
Keep in Triplit: `foods` (user-created only), `dailyNorms`, `dailyNormItems`, all user data.

**Pros:**
- First visit fast — HTTP stream → `Dexie.bulkPut()` is orders of magnitude faster than WebSocket for bulk data
- Triplit WebSocket handles only user data (tiny volume) — realtime sync is instant
- Clean architecture: Triplit does what it's designed for

**Cons:**
- `dishItems.Include("food")` and `scheduleFoods.Include("food")` break for USDA food refs — must be replaced with a merged hook
- Food search must query both Dexie and Triplit and union results
- ~8 hooks change; component types must stay compatible

**Merged food lookup pattern (Option B):**
```ts
function useFoodsByIds(ids: string[]) {
  const usdaFoods = useLiveQuery(() => dexie.foods.where("id").anyOf(ids).toArray());
  const { results: userFoods } = useQuery(triplit, triplit.query("foods").Where("id", "in", ids));
  return mergeById(usdaFoods ?? [], userFoods ?? []);
}
```

**Hooks to change (in addition to Option A's 4):**
- `useDishItems(dishId)` → remove `.Include("food")`, resolve food via `useFoodsByIds`
- `useScheduleFoods(date)` → remove `.Include("food")`, resolve food via `useFoodsByIds`
- `useProduct(id)` → check Dexie first, fall back to Triplit
- `useProducts(search)` → union Dexie + Triplit results

---

## 5. Static reference data synced via real-time protocol (OPEN — architectural)

**Problem**: USDA foods/nutrients never change (or change very rarely). Using a WebSocket sync protocol designed for real-time collaborative data to distribute a static dataset is the wrong tool.
**Proper pattern**: serve as a versioned HTTP resource with `ETag` / `Cache-Control: immutable`. Download once, cache forever, invalidate only when version changes.
**Blocked by**: reference data being co-located with user data in Triplit collections (see #4).
**Resolved by**: Option A or Option B above.

---

## Decision log

| Decision | Rationale |
|---|---|
| Version = sum of all system collection counts | Simple, already available via `/api/system/counts`. No new hashing needed. |
| Trust `onRemoteFulfilled`, don't verify via IDB | `onRemoteFulfilled` is Triplit's authoritative signal. IDB count after disconnect has a race condition. |
| No retry loop | Retries were compensating for the IDB race condition. With that removed, retries are unnecessary. |
| Keep `endSession()` for anon after sync | Avoids persistent WebSocket for read-only reference data. User mode stays connected permanently. |
