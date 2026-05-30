**STATUS:** IN-PROGRESS
<!-- set to `COMPLETE` when all [RALPH] items are [x]; set to `WAITING-HUMAN` if the
     top unchecked item is [HUMAN] (loop stops, human decides). -->

# Ralph fix plan — merge-sync (rev3 hybrid)

Rules: each iteration does the SINGLE highest unchecked **[RALPH]** item (top = highest
priority). **Never attempt [HUMAN] items** — they need design judgment; if the top
unchecked item is [HUMAN], set STATUS: WAITING-HUMAN and stop.

## Tier 0 — silent data-loss (first)
- [ ] [HUMAN] **USER_NORM delete→recreate trap.** `daily_norms` is keyed by the constant `'USER_NORM'` (`entities/daily-norm/model/default-norm.ts:3`); `toggleNormDev` (`features/dailyNorms/NutrientNormDrawerControl/useNutrientNormSlots.tsx:72`) deletes then recreates the SAME id. With never-GC tombstones this can silently delete a recreated norm cross-device (CC13's "all-UUID" premise is false here). DECISION NEEDED: model the toggle as an UPDATE/reset (no tombstone ever for USER_NORM) vs mint a fresh uuid on recreate. Do not auto-fix.
- [ ] [RALPH] **Dish cascade enumerates its own children.** `deleteDish`/`deleteDishes` (`entities/dish/api/mutations.ts`) must query children by `dish_id` internally and delete+tombstone each — the live caller `FoodActionCard.tsx:123` passes empty itemIds/portionIds, so children currently get no tombstone → permanent cross-device orphans. Don't trust caller-passed arrays.
- [ ] [RALPH] **merge ingress guards** vs legacy vault blob: iterate `incoming[t] ?? []`, `incoming.tombstones ?? []`, and on ingest `inc.updated_at ??= inc.created_at` (legacy rows have created_at, no updated_at, no tombstones key).

## Tier 1 — contract + schema
- [ ] [RALPH] Dexie **version(7)** non-destructive `.modify()` backfill `updated_at = created_at` over all 9 domain tables; `periods: null` (drop residual store). NOT version(5) — schema is already v6.
- [ ] [RALPH] Add `updated_at: string` to every domain Row interface; add `tombstones` table (`id` PK; `{id, table, deleted_at}`).
- [ ] [RALPH] `src/shared/lib/dexie/write.ts`: `putRow(table, fullRow)` (stamps updated_at), `updateRow(table, id, patch)` (stamps), `deleteRow(table, id)` + `deleteRows(pairs)` (delete + tombstones.put in one rw-tx; add `tombstones` to every delete tx scope).
- [ ] [RALPH] Migrate all raw `db.*` write/delete call-sites to the contract (~31–39 across 8 files incl. `useNutrientNormSlots.tsx:74`). `removeCustomTag` (`custom-tag/mutations.ts:49`, a `collection.delete()`) must resolve ids first, then `deleteRow` per id.
- [ ] [RALPH] `merge()` for the sync path: per-row LWW by `updated_at`, union, tombstone-apply, one rw-tx; writes incoming via `db.table.put` directly (preserve foreign updated_at). Keep `apply()` for file-restore (replace; stamp `updated_at ??= created_at` on import rows).
- [ ] [RALPH] `syncNow()` = `navigator.locks('disher-sync')` → pull → merge → push. **Pull button must take the SAME lock** (currently specced lock-less → races mount auto-syncNow, tears dump/push).
- [ ] [RALPH] `custom_tags`: include in DOMAIN_TABLES + `updated_at` + tombstones (uniform).
- [ ] [RALPH] Lint `no-restricted-syntax`: ban raw `db.<table>.put/add/update/delete/bulkDelete` AND collection/filtered/aliased delete (`.where(...).delete()`), globbed over `src/` except `write.ts`/`snapshot/index.ts`/schema migration. Comment the residual gap (aliased `t.delete`, `db.table(name)` can't be caught statically).

## Tier 2 — spike-gated (judgment)
- [ ] [HUMAN] **deleting-hook spike (15 min).** Does Dexie's `deleting` hook reliably deliver per-key for bulkDelete/collection.delete, and can it write `tombstones` inside the caller's rw-tx? If yes AND lint is provably leaky beyond known sites → consider a deleting-hook ONLY (writes stay contract). Human decides after spike.

## Tier 3 — tests
- [ ] [RALPH] Unit: `merge(legacy-shaped incoming)` (no updated_at, no tombstones key) → no throw, updated_at backfilled from created_at.
- [ ] [RALPH] Unit: dish cascade delete → converge → no orphan dish_items/dish_portions.
- [ ] [RALPH] Unit: merge LWW (newer wins), tombstone (delete-after-edit removes; edit-after-delete revives), idempotent re-merge, empty-merge adoption.
- [ ] [RALPH] Unit: USER_NORM toggle convergence (after the Tier-0 human fix lands).
- [ ] [RALPH] E2E: two-device convergence (add/add union, delete-no-resurrect, rename-beats-stale).

## Tier 4 — docs (last)
- [ ] [RALPH] Update `apps/food-calc/CLAUDE.md` §Data Layer: tombstones, updated_at, merge/syncNow, putRow/deleteRow contract; correct stale "v4 / 8 tables" → v6→v7 / 9 tables; reframe "no hooks" (timestamp contract, not the old sync hooks).
