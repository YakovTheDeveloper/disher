# AGENT.md — Ralph operating notes (merge-sync feature)

> Loaded every iteration as the concentrated must-knows. (CLAUDE.md also auto-loads —
> --bare is NOT used — but keep the essentials here too.) Keep SHORT. Append learnings.

## Repo
- Monorepo `disher`. Frontend = `apps/food-calc` (Vite + React + TS, Feature-Sliced Design).
- The loop runs from the repo root; use `--prefix` so commands need no `cd`.

## Commands (backpressure)
- Lint (zero-warnings): `npm --prefix apps/food-calc run lint`
- Unit tests (vitest): `npm --prefix apps/food-calc run test`
- One test file: `cd apps/food-calc && npx vitest run <path>` (vitest needs that cwd)
- ⚠️ RUN `npm --prefix apps/food-calc run test` FROM THE REPO ROOT (cwd = disher/). vitest resolves its root from `process.cwd()`; running it while cwd is `apps/food-calc` (e.g. after a `cd` in a prior Bash call) produces ~171 SPURIOUS failures across 25 files. If you see a sudden mass failure after a config-only change, it's the cwd — reset to repo root and re-run, don't "fix" anything. `cd` persists across Bash calls; prefer absolute paths.
- Typecheck/build: `npm --prefix apps/food-calc run build`
- E2E (Playwright, heavy): `npm --prefix apps/food-calc run test:e2e` — ONLY for sync-touching changes, not every loop.

## Where things live
- Dexie schema: `src/shared/lib/dexie/schema.ts` — currently **v6**, 9 tables (products, dishes, dish_items, dish_portions, schedule_foods, schedule_events, daily_norms, hypotheses, custom_tags) + a residual `periods` store.
- Snapshot/sync: `src/shared/lib/snapshot/index.ts` (dump / apply / push / pull).
- Mount sync gate: `src/features/backup/BackupGate.tsx`.
- Mutations per entity: `src/entities/<name>/api/mutations.ts`.

## Doctrine (because --bare drops CLAUDE.md)
- **WRITES use a CONTRACT, not a Dexie hook.** `putRow(table, fullRow)` stamps `updated_at`; `updateRow(table, id, patch)` for partial updates; `deleteRow(table, id)` writes the delete + a `tombstones.put` in ONE rw-tx. This is the deliberate replacement for the deleted sync-engine hooks — the old "no hooks" rule banned `_dirty`/scheduler hooks, NOT a timestamp contract.
- **merge() writes incoming rows via `db.table.put` DIRECTLY** (whitelisted in write.ts) to preserve the source `updated_at` — never through putRow (that would re-stamp `now()`).
- **Hard delete + separate `tombstones` table.** Read-path stays clean — NO `deleted_at` filters in queries.
- **NO placeholders / stubs / TODO-and-move-on. Full implementations only.**
- **NEVER run git** (no commit/reset/stash/checkout) — parallel dev sessions are live in this tree. (Also enforced: git is not in allowedTools.)

## Learnings (append one line as discovered)
- STATUS 2026-05-30: **COMPLETE.** Every [RALPH] [x], delta-green (lint 73 baseline, test 482 pass / 3 pre-existing TimePicker fail). Both human decisions resolved: USER_NORM → Option A (singleton never-delete: `useHasUserNorm` = non-empty items, dev toggle resets via `upsertUserNorm({})`, USER_NORM never tombstoned); Tier-3 E2E → DEFERRED by human (13 unit tests cover merge: LWW / tombstone both ways / idempotent / empty-adoption + cascade-no-orphan + USER_NORM convergence). Only the Tier-2 deleting-hook SPIKE remains [HUMAN] (optional optimization, not required for the feature).
- BASELINE is pre-existing RED (NOT ours, likely parallel sessions): lint = 73 errors in unrelated files (`no-explicit-any` in drawer-store/modal-store/overlay-types, `_`-prefixed unused vars in NumberInput/Typography/Pages, `parserOptions.project` parse errors on config + e2e specs); test = 3 fails in `TimePicker.test.tsx` (469 pass / 57 files).
- BACKPRESSURE = DELTA-GREEN (user decision 2026-05-30): an item passes if YOUR change adds NO NEW lint/test failures vs that baseline. NEVER touch the 73 lint errors / 3 TimePicker fails (unrelated files — PROMPT bans touching them). Check: lint stays ≤73 with none in files you edited; test stays 469-pass / 3-TimePicker-fail. New files you add must be lint-clean themselves.
- Build order ≠ plan risk-order: Tier-0 `[RALPH]` items (dish cascade, merge ingress) depend on Tier-1 foundation (tombstones table, `merge()`), so they can't be done FULLY until Tier 1 lands. Do Tier 1 foundation first, then Tier 0 becomes actionable.
- Dexie schema is at v7 now (was v6). 9 domain tables carry `updated_at` after the v7 backfill; `periods` store dropped.
- write.ts contract surface: `putRow` / `putRows` (bulk) / `updateRow` / `deleteRow` / `deleteRows`. `updateRow` takes Dexie's `UpdateSpec<T>` (accepts both a typed `{field}` partial AND a pre-mapped snake_case `Record<string,unknown>` patch). Mutations build rows as `Omit<XRow,'updated_at'>` (the contract stamps it). `deleteRows` takes `{table, id}[]` across heterogeneous tables in ONE rw-tx.
- TEST FILES still seed Dexie via raw `db.<table>.add/bulkAdd` (fixtures, NOT migrated — they sit outside the "8 production files"). They omit `updated_at` (tsc-only gap, runtime-harmless; vitest doesn't type-check). ⇒ The T1.8 lint rule MUST exclude `**/*.test.ts` + `**/__tests__/**`, else those seeds add to the error count and break delta-green.
- `npm run build` (tsc) is transiently red between T1.2 and T1.4 by design (required `updated_at` vs un-migrated call-sites); after T1.4 it's consistent again. Backpressure is lint+test only, so this never gated a step.
- Sync orchestration: `snapshot/index.ts` now exports `merge()`, `DOMAIN_TABLES`, and `syncNow()` (Web-Lock `'disher-sync'` → pull→merge→push, lock-less fallback for tests/old engines). ALL sync triggers route through `syncNow()`: BackupGate mount (gated render: render-now-if-local, block-if-empty), SettingsPage `handlePush`, ProfileDrawer `handleBackup`. A bare `push()` is now never called from UI (it whole-blob-LWW-clobbers unpulled remote).
- Changing a sync handler's import (`push`→`syncNow`) breaks the file's test if it `vi.mock('@/shared/lib/snapshot', ...)` — vitest's mocked module THROWS "No <name> export defined" on access of a name the factory omitted. Fix: add the new name (and the other imported names) to the mock factory. Did this for `ProfileDrawer.test.tsx` (mockPush→mockSync, added syncNow/dump/apply). Button labels unchanged, so role queries held.
