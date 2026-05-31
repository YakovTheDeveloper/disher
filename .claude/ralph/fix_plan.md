**STATUS:** COMPLETE
<!-- set to `COMPLETE` when all [RALPH] items are [x]; set to `WAITING-HUMAN` if the
     top unchecked item is [HUMAN] (loop stops, human decides). -->

<!-- 2026-05-30: COMPLETE. Every [RALPH] item is [x] and the tree is delta-green —
     lint stays at the pre-existing 73-error baseline, test 482 pass / 3 pre-existing
     TimePicker fail (none ours; user-chosen delta-green bar). Both human decisions
     resolved: USER_NORM Tier-0 → Option A (singleton, never delete) implemented + tested;
     Tier-3 E2E → DEFERRED by the human (merge logic covered by 13 unit tests). The only
     items NOT [x] are the two [HUMAN]-owned ones: the (now-decided) Tier-0 trap is [x],
     and the Tier-2 deleting-hook SPIKE remains [HUMAN] — an optional optimization, not
     required for the feature. Decisions log at the bottom. -->

# Ralph fix plan — merge-sync (rev3 hybrid)

Rules: each iteration does the SINGLE highest unchecked **[RALPH]** item (top = highest
priority). **Never attempt [HUMAN] items** — they need design judgment; if the top
unchecked item is [HUMAN], set STATUS: WAITING-HUMAN and stop.

## Tier 0 — silent data-loss (first)
- [x] [HUMAN·decided] **USER_NORM delete→recreate trap.** `daily_norms` is keyed by the constant `'USER_NORM'` (`entities/daily-norm/model/default-norm.ts:3`); `toggleNormDev` (`features/dailyNorms/NutrientNormDrawerControl/useNutrientNormSlots.tsx:72`) deletes then recreates the SAME id. With never-GC tombstones this can silently delete a recreated norm cross-device (CC13's "all-UUID" premise is false here). DECISION NEEDED: model the toggle as an UPDATE/reset (no tombstone ever for USER_NORM) vs mint a fresh uuid on recreate. Do not auto-fix. **RESOLVED 2026-05-30 — human chose Option A (singleton, never delete).** Verified: NO production delete path existed (only the DEV-only `toggleNormDev`). `useHasUserNorm` now = "row with non-empty items"; `toggleNormDev` resets via `upsertUserNorm({})` instead of `deleteRow` → USER_NORM is never tombstoned. Covered by `user-norm-convergence.test.ts`.
- [x] [RALPH] **Dish cascade enumerates its own children.** `deleteDish`/`deleteDishes` (`entities/dish/api/mutations.ts`) must query children by `dish_id` internally and delete+tombstone each — the live caller `FoodActionCard.tsx:123` passes empty itemIds/portionIds, so children currently get no tombstone → permanent cross-device orphans. Don't trust caller-passed arrays.
- [x] [RALPH] **merge ingress guards** vs legacy vault blob: iterate `incoming[t] ?? []`, `incoming.tombstones ?? []`, and on ingest `inc.updated_at ??= inc.created_at` (legacy rows have created_at, no updated_at, no tombstones key).

## Tier 1 — contract + schema
- [x] [RALPH] Dexie **version(7)** non-destructive `.modify()` backfill `updated_at = created_at` over all 9 domain tables; `periods: null` (drop residual store). NOT version(5) — schema is already v6.
- [x] [RALPH] Add `updated_at: string` to every domain Row interface; add `tombstones` table (`id` PK; `{id, table, deleted_at}`).
- [x] [RALPH] `src/shared/lib/dexie/write.ts`: `putRow(table, fullRow)` (stamps updated_at), `updateRow(table, id, patch)` (stamps), `deleteRow(table, id)` + `deleteRows(pairs)` (delete + tombstones.put in one rw-tx; add `tombstones` to every delete tx scope).
- [x] [RALPH] Migrate all raw `db.*` write/delete call-sites to the contract (~31–39 across 8 files incl. `useNutrientNormSlots.tsx:74`). `removeCustomTag` (`custom-tag/mutations.ts:49`, a `collection.delete()`) must resolve ids first, then `deleteRow` per id.
- [x] [RALPH] `merge()` for the sync path: per-row LWW by `updated_at`, union, tombstone-apply, one rw-tx; writes incoming via `db.table.put` directly (preserve foreign updated_at). Keep `apply()` for file-restore (replace; stamp `updated_at ??= created_at` on import rows).
- [x] [RALPH] `syncNow()` = `navigator.locks('disher-sync')` → pull → merge → push. **Pull button must take the SAME lock** (currently specced lock-less → races mount auto-syncNow, tears dump/push).
- [x] [RALPH] `custom_tags`: include in DOMAIN_TABLES + `updated_at` + tombstones (uniform). _(Verified: in `DOMAIN_TABLES` + v7 backfill, `CustomTagRow.updated_at`, writes via putRows/deleteRows — tombstoned on delete. Satisfied by consistent inclusion in T1.2/T1.4/T1.5.)_
- [x] [RALPH] Lint `no-restricted-syntax`: ban raw `db.<table>.put/add/update/delete/bulkDelete` AND collection/filtered/aliased delete (`.where(...).delete()`), globbed over `src/` except `write.ts`/`snapshot/index.ts`/schema migration. Comment the residual gap (aliased `t.delete`, `db.table(name)` can't be caught statically).

## Tier 2 — spike-gated (judgment)
- [ ] [HUMAN] **deleting-hook spike (15 min).** Does Dexie's `deleting` hook reliably deliver per-key for bulkDelete/collection.delete, and can it write `tombstones` inside the caller's rw-tx? If yes AND lint is provably leaky beyond known sites → consider a deleting-hook ONLY (writes stay contract). Human decides after spike.

## Tier 3 — tests
- [x] [RALPH] Unit: `merge(legacy-shaped incoming)` (no updated_at, no tombstones key) → no throw, updated_at backfilled from created_at.
- [x] [RALPH] Unit: dish cascade delete → converge → no orphan dish_items/dish_portions.
- [x] [RALPH] Unit: merge LWW (newer wins), tombstone (delete-after-edit removes; edit-after-delete revives), idempotent re-merge, empty-merge adoption.
- [x] [RALPH] Unit: USER_NORM toggle convergence (after the Tier-0 human fix lands).
- [x] [DEFERRED·human 2026-05-30] E2E: two-device convergence (add/add union, delete-no-resurrect, rename-beats-stale). **NOT implemented — deferred by explicit human decision.** Blocked by the reserved e2e lint/tsconfig gap (+1 parse error per new spec) and not runnable as backpressure here (Playwright needs live Vite+backend). The merge logic IS covered by 13 unit tests (LWW / tombstone both directions / idempotent / empty-adoption + cascade-no-orphan + USER_NORM convergence). Revisit as its own task once the e2e tsconfig/eslint gap is fixed.

## Tier 4 — docs (last)
- [x] [RALPH] Update `apps/food-calc/CLAUDE.md` §Data Layer: tombstones, updated_at, merge/syncNow, putRow/deleteRow contract; correct stale "v4 / 8 tables" → v6→v7 / 9 tables; reframe "no hooks" (timestamp contract, not the old sync hooks).

## Decisions log — RESOLVED 2026-05-30
> ✅ (1) USER_NORM → **Option A** (singleton, never delete) — implemented + tested.
> ✅ (2) E2E → **Deferred** by human (13 unit tests already cover the merge logic).

1. **USER_NORM toggle design** (unblocks Tier-0 [HUMAN] line 12 → then Tier-3 USER_NORM test).
   `toggleNormDev` off-state now routes through `deleteRow(db.daily_norms, 'USER_NORM')`, which
   writes a tombstone for the constant id. DECIDE:
   - **(A) Update/reset, never tombstone USER_NORM** — toggle-off resets the singleton row to
     empty `items` instead of deleting it; `useHasUserNorm` switches from "row exists" to
     "items non-empty". No tombstone can ever shadow a recreate. (Simplest; small hasNorm change.)
   - **(B) Fresh uuid per norm** — each create mints a new id; deletes tombstone by that uuid
     (no constant-id collision). Queries must select the latest live norm. (More moving parts.)
2. **E2E two-device convergence** (Tier-3 last item). Blocked: `eslint .` lints `tests/e2e/*` but
   `tsconfig.json` only `include`s `src` → each new spec is a `parserOptions.project` parse error
   (+1 over the reserved 73 baseline); making e2e lintable touches that reserved config. And
   `test:e2e` (Playwright + live Vite/backend) isn't runnable as unit backpressure here. DECIDE:
   - **(A) Defer** — unit convergence tests (merge LWW/tombstone/idempotent/adoption + cascade
     no-orphan) already cover the logic; revisit E2E when the e2e tsconfig/eslint gap is fixed.
   - **(B) Authorize** the e2e tsconfig/eslint fix → I write the spec; you verify it via
     `npm run test:e2e` (I can't run Playwright here).
