# `sync-merge` — conformance corpus for the snapshot merge

Language-neutral fixtures pinning what Disher's `merge()` **actually does** when it reconciles an
incoming vault blob into local state. The web PWA is the reference implementation
(`apps/food-calc/src/shared/lib/snapshot/index.ts`); any second client — the Kotlin Multiplatform
one — is expected to run these same files through its own merge and land on the same bytes.

The invariants these fixtures encode, and the failure scenario behind each, are written up in
[`INVARIANTS.md`](./INVARIANTS.md) — next to the fixtures, deliberately. It used to live in
`apps/food-calc/tds/`, which is git-ignored: the corpus was shipping to a second writer with its
own semantics unreadable.

## Fixture shape

```jsonc
{
  "name": "05-tie-local-wins",
  "description": "…",
  "status": "canon" | "pins-known-bug",
  "local":    { "<table>": [ …rows ], "tombstones": [ … ] },  // state before
  "incoming": { "<table>": [ …rows ], "tombstones": [ … ] },  // the pulled blob
  "expected": { … }                                           // state after
}
```

`expected` is **generated, never hand-written** — `npm run golden:regen` (from `apps/food-calc/`)
runs the real `merge()` and writes the result back. Hand-authoring it would record what we *believe*
merge does; generating it records what it *does*. The regen diff is the point at which a human
reviews the semantics, so **read that diff — do not rubber-stamp it**.

Comparison is on the **canonical** form: empty tables dropped, tables and object keys sorted, rows
ordered by `id`. Do not compare raw JSON text.

### `status`

- **`canon`** — intended behaviour. A mismatch is a bug in your client.
- **`pins-known-bug`** — pins behaviour that is *wrong* but *shipped*. Reproduce it anyway: a second
  client has to be bit-compatible with what production actually does, not with the ideal. When the
  bug is fixed, these fixtures change; that diff is expected.

## The merge algorithm, in nine lines

1. **Tombstones first.** LWW by `deleted_at`, keyed by the deleted row's `id`. Strict `>`: on a tie
   the local tombstone survives.
2. **Rows, per table.** Union by presence; on a shared `id`, the higher `updated_at` wins. Strict
   `>`: **on a tie the LOCAL row survives and the incoming one is dropped.**
3. **Legacy ingest.** An incoming row with no `updated_at` gets it backfilled from `created_at`
   before any comparison. (A *local* row with no `updated_at` compares as the empty string and
   therefore loses to any stamped row — see fixture 07.)
4. **Tombstone application.** After the union, a row is deleted iff a tombstone exists for its `id`,
   that tombstone's `table` names this table, and `row.updated_at <= tombstone.deleted_at`. Note the
   `<=`: ties favour the **delete** here — the opposite of rule 2.
5. All of it in one read-write transaction.

## Non-negotiable contract for a second writer

Violate any of these and you corrupt other devices' data. Each has a numbered entry in the invariant
registry.

1. **Stamp format is `YYYY-MM-DDTHH:mm:ss.sssZ` — three millisecond digits, always, even when zero.**
   Stamps are compared **as strings**, character by character. Never parse one into an instant to
   compare it. Kotlin's `Instant.toString()` **omits** a zero millisecond field, producing
   `…T10:00:00Z` — and `'Z' (0x5A) > '.' (0x2E)`, so that string sorts *after* every stamp in the
   same second that carries millis. An older edit then silently overwrites a newer one. Format
   explicitly. (И-4, fixture 14.)
2. **Every writer needs a persistent monotonic clock.** A new stamp must be strictly greater than
   both the wall clock and the highest stamp the device has ever issued *or observed*:
   `next = max(now, highWaterMark + 1)`. Feed every incoming `updated_at` and `deleted_at` into the
   high-water mark on merge. Persist it across restarts. (И-2, И-3.)
3. **Never emit a stamp from the future.** There is no upper bound on the high-water mark and no way
   to reset it — one row stamped in year 9999 pins every device's clock there permanently, and the
   whole fleet degenerates into emitting identical stamps. (И-17.)
4. **Model rows in full, including fields you don't use.** `merge` replaces the whole record
   (`put(row)`), it does not merge fields. Some columns are unindexed and easy to miss —
   `products.description`, `dish_items.details`. Ship a row without one and you erase that field for
   every device, silently: the mapper renders a missing note as an empty note. (И-6.)
5. **Never emit a row without an `id`.** It throws inside the merge transaction, the transaction
   rolls back, and the sync loop never reaches its `push` — so the bad blob can never be replaced.
   Sync dies permanently, on every device, with no client-side recovery. (И-18.)
6. **`id` is unique across the whole database, not per table.** Use UUIDs. The tombstone track is
   keyed by the bare `id`, so two tables sharing one id makes their tombstones evict each other and
   a delete is lost outright. (И-11.)
7. **Deleting a row means: remove it and write its tombstone, in the same transaction.** Cascades are
   the writer's job — enumerate children by foreign key and delete them in that same transaction.
   (И-7, И-19.)
8. **Never `PUT /api/backup` without pulling and merging first.** The server does not check: it
   replaces the whole blob unconditionally (no ETag, no version). A bare push destroys every row your
   client doesn't know about. (И-9.)
9. **Never drop a table key you don't recognise.** The blob has no schema version. A client that
   dumps only its own tables erases every other table from the shared vault, because the server
   replaces rather than merges. Until a schema version exists, carry unknown keys through untouched.
   (И-5, fixture 13.)

## Out of scope for these fixtures

The high-water-mark clock, `pruneTombstones` (90-day TTL), and the HTTP transport. They are covered
by the property tests and the two-device simulator in
`apps/food-calc/src/shared/lib/snapshot/__tests__/`.
