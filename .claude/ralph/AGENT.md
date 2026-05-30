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
- (none yet)
