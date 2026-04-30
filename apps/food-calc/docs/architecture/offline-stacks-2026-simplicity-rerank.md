# Offline-First Stacks Re-Ranked by SIMPLICITY (April 2026)

**Date:** 2026-04-29
**Project:** Disher (single-user PWA, food tracker, iOS Safari + Add-to-Home-Screen primary).
**Replaces filters from:** `offline-first-stacks-2026-inventory.md` (those filters are no longer in effect — see below).

> **Reading guide:** Sections 1–7 + "Self-built baselines" examine off-the-shelf SDKs against the current Disher baseline. **§B "Architecture variant: backup-polling (local-first + delta push)"** added late in the research after a user proposal — that section is the **leading candidate** and the most carefully argued part of the doc. If you only have time for one section, read §B and the updated "Honest verdict" / "Final recommendation".

---

## Recap of the NEW criteria

The user explicitly REJECTED several gates from the prior research. This re-rank ignores them.

**No longer disqualifiers:**
- "Doesn't work with Supabase / wrong backend" — user will own backend / VPS if needed.
- Bundle size — no upper limit (LiveStore's ~500KB OK, PGlite ~3MB OK).
- Extra deployments (VPS, CF Worker, custom sync server) — fine.
- CRDT internals — fine if API is simple.

**Hard NEW gates:**
- **NO** Postgres logical replication / `wal_level=logical` (rules out Zero, PowerSync, ElectricSQL).
- **NO** required CRDT mental model exposed to the developer (concurrent edits not a concern).

**Top priorities (in order):**
1. Architecture simplicity — fewest concepts.
2. Fewest points of failure.
3. Offline UX — instant commit, invisible drain.
4. Data durability — no lost mutations.

**Project profile:**
- Sequential multi-device, no concurrent same-row edits.
- Tables: `products`, `dishes`, `dish_items`, `dish_portions`, `schedule_foods`, `schedule_events`, `daily_norms`, `periods`. Foreign keys.
- ~1200–15000 schedule entries/yr. Small data.
- Offline SLO: 3–7 days, mutations not lost.

**Disclosure of the existing baseline:**
Disher today runs a server-first stack: Supabase REST + TanStack Query (IndexedDB-persisted) + a hand-rolled flat outbox (`pendingWrites.ts`, ~150 LOC) with FIFO drain, exponential backoff, MAX_ATTEMPTS=10, APP_VERSION buster, single-flight, in-RAM mirror. Compound flows are online-gated. This is the **honest baseline** every other candidate must beat on simplicity, not just match.

---

## Counting "points of failure" — the rubric

For each candidate I count concrete failure surfaces:

1. **Local persistence layer** — the bytes on disk.
2. **Sync transport** — the wire protocol.
3. **Conflict resolution** — what happens when client and server disagree.
4. **Retry/backoff** — what happens on a flaky network.
5. **Schema migrations** — local schema changing under existing data.
6. **Multi-tab coordination** — two tabs writing simultaneously.
7. **Recovery flow** — local DB corrupted / cleared (Safari ITP, user clears storage, OPFS bug).
8. **Auth / token expiry** — refresh during a long-offline window.

The baseline outbox has **5 of 8** real surfaces (1, 2 trivial REST, 4, 6 N/A single-flight, 7 trivial — TanStack Query refetches), and most are <30 LOC each. That's the bar.

---

# Top candidates, re-ranked

## 1. Baseline: Supabase REST + TanStack Query + hand-rolled outbox  (= what Disher has today)

URL: in-repo at `food-calc/src/shared/lib/storage/pendingWrites.ts`.

**Status:** Production, shipped, tested. ~150 LOC owned by the user.

**Core mechanism (plain language):** Reads go to Supabase via REST; their results are cached in IndexedDB by TanStack Query. Writes are appended to a single IndexedDB array (`pendingWrites`), then a FIFO drainer pushes them one-by-one to Supabase REST. UI is optimistically patched at enqueue time. There is no replica DB, no CRDT, no event log, no logical replication.

**Points of failure (8):**
1. **Persistence:** `idb-keyval` (a 0.6KB wrapper). Failure mode: Safari clears IDB → cache lost; outbox lost. Recovery: refetch from server (data is just optimistic patches; durable copy is on the server).
2. **Sync transport:** Plain `fetch` to Supabase REST. Trivial.
3. **Conflict resolution:** Last-write-wins on the server (Postgres row update). No client-side merge code.
4. **Retry/backoff:** Exponential, capped at 30s, MAX_ATTEMPTS=10. Implemented in 30 LOC. Classifier (4xx poison vs 401/5xx retryable) is the most subtle thing here.
5. **Schema migrations:** APP_VERSION buster drops outbox + cache on app upgrade. Brutal but bulletproof.
6. **Multi-tab:** Currently ignored. Two tabs both call `drain()`; one wins via single-flight in its own tab, but cross-tab races on the IDB array are possible. **Real gap** (TanStack offline-transactions has leader election; Disher does not).
7. **Recovery:** Storage probe at boot is missing per outbox audit memo. Real gap.
8. **Auth:** Supabase JS handles refresh. 401 → retry with backoff. Tested.

**Mental model burden: 3/10.** The whole thing is "fetch + idb-keyval + a queue array." Anyone who knows React Query understands it in 20 minutes.

**Why it's the baseline to beat:** It exposes ZERO new abstractions. There is no event log, no schema DSL, no replication protocol, no CRDT, no leader-elected SQLite. The user wrote it; the user owns it; the user has invariant tests for it. The only honest gaps are #6 (cross-tab) and #7 (storage probe) — both fixable in <50 LOC.

**Verdict: This is the simplicity floor. A candidate must beat THIS, not match it.**

---

## 2. TanStack DB + @tanstack/offline-transactions

URL: https://tanstack.com/db/latest — https://www.npmjs.com/package/@tanstack/offline-transactions

**Status (April 2026):** TanStack DB 0.6.x (alpha/beta, road to v1). `offline-transactions` is the productized version of exactly what Disher built.

**Core mechanism:** Reactive client-side store fed by sync collections. Mutations go through a `Transaction` API; `offline-transactions` persists them to IDB before dispatch and drains FIFO with exponential-backoff + jitter + multi-tab leader election. Authoritative state remains on the server.

**Points of failure:**
1. **Persistence:** IndexedDB with localStorage fallback. Same as baseline.
2. **Sync transport:** You write the sync function. Trivial.
3. **Conflict resolution:** Server-side. Same as baseline.
4. **Retry/backoff:** Library-provided exponential + jitter. Configurable hooks.
5. **Schema migrations:** Collection schema changes — TanStack DB has its own migration story (immature in 0.6).
6. **Multi-tab:** **Solved** via leader election. **Beats baseline here.**
7. **Recovery:** IDB-persisted; `$synced=false` virtual prop drives outbox view.
8. **Auth:** Your responsibility (same as baseline).

**Mental model burden: 4/10.** Slight bump over baseline because of: collection abstraction, virtual props (`$synced`, `$origin`, `$key`), `Transaction` API, `createEffect`, "includes" hierarchical query shape. None of these are hard, but they are NEW concepts a maintainer must absorb. Migration from `pendingWrites.ts` would be ~2 days.

**Why it could beat baseline:** Multi-tab leader election + jitter + tested invariants are real upgrades. Documented invariants mean less custom test surface to maintain.

**Why it ties / loses:** Pre-1.0 (alpha persistence layer in 0.6). The user already shipped equivalent code. Switching adds a dependency, a mental model, and breaking-change risk for ~50 LOC of net win. **Wash — slight loss on simplicity, slight win on hardening.**

---

## 3. Jazz (jazz.tools)

URL: https://jazz.tools — https://github.com/garden-co/jazz — current line is 0.16 (April 2026, "Cleaner separation between Zod and CoValue schemas")

**Status:** Pre-1.0 (0.16). Active development. Self-host server is open-source; Jazz Cloud is the "just works" path. Real production users (per devtools.fm episode 123 + Gitnation talks) but a small set.

**Core mechanism:** You define data as **CoValues** — `CoMap`, `CoList`, `CoFeed`, `Account`, `Group`. Each CoValue is a CRDT internally, but the API looks like a plain mutable object. References to other CoValues = "FK by ID, follow breadcrumbs to resolve" (one-way; you add reverse refs manually). Permissions are part of the data model — every CoValue has a `Group`. Sync is managed by Jazz Cloud or a self-hosted Jazz server; offline is automatic ("just works", per docs).

**Points of failure:**
1. **Persistence:** Jazz client persists CoValues locally (IndexedDB). Opaque to user — pro and con.
2. **Sync transport:** WebSocket to Jazz Cloud or self-hosted server. WebSocket on iOS Safari has the same background-suspension caveat as anything else.
3. **Conflict resolution:** CRDT-handled internally, but the user said this is fine if API is simple. Last-write-wins at field level by default for CoMap. Actually fits Disher (sequential edits).
4. **Retry/backoff:** Internal to Jazz. Opaque. Cannot inject a classifier or APP_VERSION buster.
5. **Schema migrations:** Account migrations are a documented concept; CoValue schema migrations are evolving (0.14 → 0.16 broke schema syntax). API churn risk is real.
6. **Multi-tab:** Solved by Jazz internally (BroadcastChannel under the hood).
7. **Recovery:** Opaque. If local CoValue cache corrupts, you trust Jazz's server-side replay. No documented user-facing recovery flow.
8. **Auth:** Jazz has its own auth system (Better Auth integration in 0.16). Replaces Supabase Auth.

**Mental model burden: 6/10.** New concepts: CoValue, CoMap, CoList, CoFeed, Account, Group, ownership, reference-vs-id, "deep loading," Zod-based co schema. **For a single-user app with no collaboration this is significant overkill** — every relational FK becomes a CoMap reference + a Group decision. The CRDT is hidden, but the *data model* is not Postgres-shaped.

**Relational fit for Disher:** Workable but awkward. `schedule_food.product_id → products.id` becomes `scheduleFoodCoMap.product: Product` (a one-way ref). To list "all products" you need a top-level `accountRoot.products: CoList<Product>` — not free, you maintain it on every create/delete. RLS-style filtering is replaced by Group membership.

**Why it could beat baseline:** Sync, persistence, multi-tab, retry, conflict — ALL ABSTRACTED AWAY. Five points of failure collapse into "trust Jazz." If Jazz works, the surface area of code Disher has to own goes down ~80%.

**Why it loses for Disher:** (a) replaces the entire data model — products become CoMaps, RLS becomes Groups, Supabase Auth becomes Jazz auth — that's a rewrite, not a migration; (b) 0.x with ongoing schema-API churn (0.14 → 0.16 was breaking); (c) opaque failure modes — if a sync bug drops a write, the user has no diagnostics; (d) "beautiful Schedule UI" requires "all schedule_foods for date X" — a query Jazz answers via CoList traversal, not SQL. Single-developer maintainability is great IF Jazz never breaks; brittle if it does.

**Verdict:** Genuinely simpler than baseline ON THE HAPPY PATH (because failures-of-Jazz are replaced with one bet on Jazz). Loses on the cold-start cost (full rewrite) and on diagnostic transparency. **Strongest "could-beat-baseline" candidate, but only if Disher were greenfield.**

---

## 4. InstantDB

URL: https://www.instantdb.com — https://github.com/instantdb/instant — friction log https://diwaker.io/friction-log-instantdb/ (Jan 2026)

**Status:** Live managed BaaS. Self-hostable (Clojure backend + single multi-tenant Postgres). Diwaker's friction log: "non-toy app, not quite production ready yet" — published Jan 2026. The product is real, the SDK is shipping, but it's not "boring" yet.

**Core mechanism:** You define a schema (entities + relationships + permissions). The SDK runs a Datalog-resolved triple store in the browser, persists it to IndexedDB, syncs over WebSocket. Mutations are `db.transact([db.tx.products[id].update({...})])`. Offline: queries resolve from the local triple store; transactions queue and ship when online. CRDT-resolved at entity level (last-write-wins by timestamp).

**Points of failure:**
1. **Persistence:** IndexedDB triple store, opaque.
2. **Sync transport:** WebSocket. Same iOS caveats.
3. **Conflict resolution:** Last-write-wins per entity. CRDT is hidden. Fits Disher.
4. **Retry/backoff:** Internal Reactor state machine. Opaque, not user-tunable per Diwaker.
5. **Schema migrations:** Three approaches (code / CLI / dashboard) — Diwaker explicitly flagged "uncertain about the right way." Real burden.
6. **Multi-tab:** Solved internally.
7. **Recovery:** No first-class environment separation per friction log → testing pollutes prod data. Real ops smell.
8. **Auth:** InstantDB auth, replaces Supabase auth.

**Mental model burden: 5/10.** Diwaker quoted directly: "introduces a lot of new languages — permissions use Google CEL (but not exactly), queries resemble GraphQL (but aren't), mutations echo Firebase (but differ). This adds cognitive burden." Plus: triple store / Datalog mental model is genuinely different from SQL.

**Relational fit:** Good. Entities + links are first-class; queries follow links naturally.

**Why it could beat baseline:** Same as Jazz — many failure surfaces collapse into "trust the SDK."

**Why it loses:** (a) CEL+InstaQL+InstaTX = three new mini-languages to learn; (b) production-ready disclaimer in the friction log; (c) replaces backend (the user accepts this, but it's still a port of all 8 tables + RLS to Instant's permission model); (d) multi-environment story is weak.

**Verdict:** Real competitor to Jazz on simplicity, weaker than Jazz on data-model fit (triple store vs CoValues both new, but Datalog is harder to debug than CoMap). Probably tied with Jazz overall, more commercial, less alpha-y in some ways but less in others.

---

## 5. Evolu

URL: https://evolu.dev — https://github.com/evoluhq/evolu

**Status:** Active. Built on SQLite (better-sqlite3 in node, OPFS sqlite3 in browser). End-to-end encrypted by design — encryption key is a mnemonic. Sync via "Evolu Protocol" relay (open-source self-hostable; no Supabase/Postgres on the relay).

**Core mechanism:** Local SQLite + Kysely query builder. Mutations = SQL writes that are also serialized into the Evolu Protocol log; the log is encrypted and synced through a relay. Multiple clients merge log entries deterministically (LWW per row). The relay is "dumb" — it just stores ordered encrypted blobs.

**Points of failure:**
1. **Persistence:** SQLite (OPFS). Mature, well-trod.
2. **Sync transport:** Custom binary protocol over WebSocket. Less battle-tested than HTTP REST but documented.
3. **Conflict resolution:** LWW row-level via the protocol. Fits Disher.
4. **Retry/backoff:** Internal.
5. **Schema migrations:** SQL migrations via Kysely. Familiar.
6. **Multi-tab:** OPFS-WAL (the standard) + worker.
7. **Recovery:** Mnemonic = recovery key. Lose mnemonic = lose data forever (E2E encryption tradeoff).
8. **Auth:** Mnemonic-based identity. Replaces Supabase Auth entirely.

**Mental model burden: 5/10.** SQLite + Kysely = familiar. The mnemonic-as-identity is genuinely new and shifts the auth model. Encryption is mandatory, so it's not optional baggage.

**Relational fit:** Excellent — it IS SQL.

**Why it could beat baseline:** SQL queries against a real local DB → fast, no round-trip latency, multi-row transactions are native.

**Why it loses:** (a) E2E encryption forces mnemonic UX which doesn't fit a casual food tracker; (b) "lose mnemonic = lose data" is a UX failure mode worse than any sync bug; (c) replaces Supabase Auth + relays must be deployed; (d) the analytics backend (LLM + vector matching) needs cleartext — punching holes in E2E is awkward.

**Verdict:** Strong tech, **wrong for Disher** because of the mnemonic-driven E2E. Recommend out unless the user wants E2E as a feature.

---

## 6. RxDB v17

URL: https://rxdb.info — https://github.com/pubkey/rxdb — v17 released March 30, 2026 (polish/naming refinements, no architectural rewrite)

**Status:** Mature, 10+ yrs, stable. Active. v17 is "polish + tooling clarity." Premium plugins exist (paid).

**Core mechanism:** Reactive NoSQL collections over a pluggable RxStorage layer (Dexie/IDB, OPFS, SQLite, Memory). Replication = generic pull/push protocol; Supabase plugin wraps PostgREST + Realtime. CRUD via collection methods.

**Points of failure:**
1. **Persistence:** RxStorage adapter (IDB by default). Mature.
2. **Sync transport:** Replication plugin (Supabase plugin uses PostgREST polling + Realtime channel for push).
3. **Conflict resolution:** Per-document; default LWW. Fits Disher.
4. **Retry/backoff:** Built-in to replication plugin. Configurable.
5. **Schema migrations:** First-class. Documented per-collection migration strategies.
6. **Multi-tab:** BroadcastChannel-based leader. Built in.
7. **Recovery:** Replication state is durable; on storage clear, refetches from server.
8. **Auth:** Bring your own (Supabase JWT works fine with the supabase replication plugin).

**Mental model burden: 5/10.** New concepts: collections, RxStorage, replication state, schemas-with-versions, document hooks. None hard, but all need learning. Premium-plugin upsell is a constant background nag.

**Relational fit:** NoSQL by design. FKs become "store the referenced ID, join in app code." The Schedule view ("all schedule_foods for date X plus their products") is N+1 in the worst case, manageable but not as clean as SQL.

**Why it could beat baseline:** Reactive subscriptions handle UI updates; supabase replication plugin removes the outbox code; multi-tab + retry baked in.

**Why it loses:** It REPLACES TanStack Query, the current Schedule queries (which are SQL-shaped joins server-side), and forces NoSQL document modeling. That's not a "drop-in adapter" — it's a data layer rewrite. Plus, ~150 KB tree-shaken, multiple plugins to wire up. **Adds more concepts than baseline removes.**

**Verdict:** Mature and capable but not simpler than baseline. Loses on net concept count.

---

## 7. PGlite + custom sync

URL: https://pglite.dev — Electric SQL's PGlite v0.4 (March 2026, PostGIS + connection multiplexing)

**Status:** Stable, 13M+ weekly downloads aggregate. Real Postgres in browser (~3MB gzipped, no longer a gate).

**Core mechanism:** PGlite = a real Postgres in WASM. You write same SQL on client and server. Sync is YOUR responsibility unless you also use Electric (which we've ruled out due to logical replication ban). So: PGlite + your own snapshot sync (e.g., poll `/api/snapshot` for catalog, push outbox to Supabase).

**Points of failure:**
1. **Persistence:** PGlite OPFS files. Mature underneath (Postgres), young at the wrapper layer.
2. **Sync transport:** You write it.
3. **Conflict resolution:** You write it.
4. **Retry/backoff:** You write it.
5. **Schema migrations:** Postgres migrations on both client and server — must stay in sync.
6. **Multi-tab:** Connection multiplexing (new in v0.4) handles it.
7. **Recovery:** OPFS reset → re-snapshot.
8. **Auth:** Bring your own.

**Mental model burden: 7/10.** You're now operating two Postgres databases (client + server) with manual synchronization. "Real Postgres on the client" sounds simple but the sync glue you'd write to keep two DBs in sync without logical replication is exactly the work you'd avoid by NOT using a DB on the client.

**Why it could beat baseline:** Local SQL queries (joins, aggregates) without server round-trips. Faster Schedule + analytics views.

**Why it loses:** Adds ~3MB of WASM, OPFS dependencies (iOS quirks), AND you still write your own sync layer (which is what the baseline IS, minus the local DB). **Strictly more concepts than baseline.**

**Verdict:** Compelling for analytics-heavy local work, but NOT simpler than baseline. Out for Disher unless local SQL becomes a hot need.

---

## Honorable mentions, briefly

- **LiveStore** — pre-1.0 (0.4-dev). Event log + materializers + sync engine + snapshots is THE textbook list of points of failure. Author quoted: works great for single-instance-per-user; nibfont rejected it for sharing. Mental model 7/10. **Loses outright on simplicity** — adds an event-sourcing layer the user explicitly does not need (no concurrent edits).

- **Firebase Firestore offline** — `enableIndexedDbPersistence` + 500-offline-transaction CAP + 40MB cache cap. The 500 cap is a *hard blocker* for the 3–7 day SLO — a moderately active week could exceed it. Out.

- **PocketBase** — confirmed by maintainer: no offline sync built in. Community `pocketbase_drift` is Dart-only. Out for a JS PWA unless you write the offline layer yourself (= baseline + a different backend).

- **Triplit** — maintainer joined Supabase, status uncertain, no Supabase-Postgres compat. Out.

- **Replicache** — maintenance mode, Rocicorp pushes everyone to Zero. Out.

- **PouchDB + CouchDB** — "lightweight 46KB," replication is best-in-class for sync. BUT NoSQL document model, MapReduce/Mango query limits, and live-replication dies on offline rather than queueing. Mental model 5/10. Not simpler than baseline; loses on data shape.

- **Realm / MongoDB Atlas Device Sync** — DEPRECATED Sept 30, 2025. MongoDB officially recommends migrating off. Out.

- **Gun.js** — pioneer P2P graph DB. Codebase showing its age, resource tuning needed at scale. Out.

- **OrbitDB** — IPFS-based. Adds IPFS as a dependency. Out for a food tracker.

- **AceBase** — realtime Node + browser DB, low resource usage, but documentation gaps and a tiny ecosystem. Not safer than baseline. Out.

- **Couchbase Lite** — mobile-first SDK, weak PWA path. Out.

- **Solid (Inrupt pods)** — semantic web ideology, irrelevant to a food tracker. Out.

- **Fluid Framework (Microsoft)** — collaboration-focused, offline is an afterthought. Out.

- **Turso embedded replicas + Offline Sync** — Offline Sync is **public beta** (Turso's own page says "no durability guarantees during the beta period"). Promising for the "real SQLite + sync" lane, but the beta status + libsql client maturity in browsers is not ready. Re-check in 6 months.

- **Supabase + custom event log on top** — you keep Supabase, you add an `events` table, you replay events to materialize state. This is just LiveStore-by-hand using Postgres. **Adds points of failure**: an event log to compact, materializers to author, replay correctness to maintain. Ironically *more* code than the baseline. Out.

- **NextGraph / FOSDEM 2026 entrants** (LaSuite, Flint-on-Automerge, etc.) — collaboration / RDF / Yjs-shaped. Don't fit a single-user relational tracker.

---

# Self-built simple baselines — honest comparison

The user asked: if I just wrote this myself, what does it look like?

### A. Dexie + custom outbox (baseline-equivalent)

What it is: same shape as today, but Dexie instead of `idb-keyval`. Dexie offers `db.transaction()` for compound flows; the outbox can use it.

Points of failure: same 8 surfaces, slightly more idiomatic IDB code. Net change vs baseline: **negligible**. Adds 26KB. Removes `idb-keyval` (0.6KB). Buys: better DX for the outbox itself, NOT for the rest of the app.

**Verdict:** Cosmetic upgrade. Not a simplification.

### B. Custom Postgres event log + tiny sync server

What it is: drop Supabase Realtime, write a Node sync server that exposes `/events?since=X` and `/append`. Client appends to local IDB log, pushes; server materializes into Postgres tables.

Points of failure: ALL 8 surfaces are now yours, including (a) event-log correctness, (b) materializer idempotency, (c) replay performance, (d) snapshot/compaction. **You just rebuilt LiveStore.**

**Verdict:** Strictly worse than baseline. The user said willing to write their own backend; this would be the wrong place to spend that willingness.

### C. Supabase + custom local log (event-sourcing flavor)

What it is: keep Supabase, but maintain a local append-only log of every mutation, replay on boot to derive cache. Push-replay-pull when online.

Points of failure: ADDS event-log invariants (idempotent replay, ordering, schema evolution of past events). REMOVES nothing.

**Verdict:** Strictly worse. The user does not benefit from event sourcing because there are no concurrent edits to reconcile and the server is already authoritative.

---

# Architecture variant: backup-polling (local-first + delta push)

> **Added 2026-04-29 by user directive.** This is a NEW architecture variant the user proposed late in the research process. It is treated as first-class because, on inspection, it is potentially the SIMPLEST option that meets all stated criteria. The rest of this section argues it carefully and may reshape the final verdict.

## B.1 Architecture in detail

### B.1.1 Concept (one sentence)

Local-first using a regular indexed DB as source of truth — NOT event-sourcing, just a normal relational store — with mutations applied locally and a periodic delta push to a backup server that does **last-write-wins per row** and **never pushes back**.

### B.1.2 What runs where

**Client (browser PWA):**
- **Local store:** a normal relational DB in IndexedDB. Default pick: **Dexie 4.4** with versioned tables matching the Postgres schema (`products`, `dishes`, `dish_items`, `dish_portions`, `schedule_foods`, `schedule_events`, `daily_norms`, `periods`).
- **Mutations** apply directly to Dexie inside `db.transaction('rw', ...)`. Each row gets `client_modified_at = Date.now()` and a `_dirty: true` flag.
- **Reactive UI** — Dexie's `liveQuery()` / `useLiveQuery()` from `dexie-react-hooks`.
- **Push scheduler** fires on:
  - `online` event
  - `visibilitychange` (page becomes visible)
  - debounced 30s after last mutation (timer resets on each new mutation)
  - top-of-hour fallback `setInterval(60 * 60 * 1000)`
  - **immediately on every mutation when `navigator.onLine === true`** (collapses cross-device lag from minutes to seconds)
  - explicit `forcePush()` from a settings UI button

  Push reads all rows where `_dirty = true`, batches them into ONE HTTP request, sends to the backup endpoint, and on 2xx clears `_dirty` for rows whose `client_modified_at <= pushTimestamp` (timestamp-guard pattern from `feedback_timestamp_guard_pattern.md`).
- **Pull on cold start / fresh install / after eviction** — single `GET /api/backup/snapshot` returns the user's whole state as NDJSON. Client wipes Dexie and bulk-inserts. **Recovery flow only**, not steady-state sync.

**Server (Supabase Postgres + small endpoint on the existing Node sidecar `apps/disher-backend-3.0`):**
- `POST /api/backup/push` — accepts `{ rows: [{ table, id, payload, client_modified_at }, ...] }`. For each row: `INSERT … ON CONFLICT (id) DO UPDATE SET ... WHERE excluded.client_modified_at > <existing>.client_modified_at` (LWW guard). Returns `{ acceptedAt, rejectedIds }`.
- `GET /api/backup/snapshot` — streams `SELECT * FROM <each table> WHERE user_id = $1` as NDJSON with `Cache-Control: no-store`.
- Auth — same Supabase JWT the rest of the app already uses; backend validates with the same middleware as `/api/free-text-food`.

**Critical absences:** no realtime, no logical replication, no WAL slot, no PowerSync, no CRDT merge logic, no event log, no materializers. Plain Postgres + plain REST.

### B.1.3 Storage shape

```
IndexedDB (Dexie):
  disher.products       { id, user_id, payload, client_modified_at, _dirty }
  disher.dishes         { id, user_id, ..., _dirty }
  disher.dish_items     { id, dish_id, ..., _dirty }
  ... etc per table
  disher.catalog        { id, payload }            // read-only, never _dirty
  disher.meta           { schemaVersion, lastSnapshotAt, lastPushAt }

Postgres (existing schema, unchanged):
  + add `client_modified_at TIMESTAMPTZ NOT NULL DEFAULT now()` per table
  RLS unchanged (still by user_id)
```

### B.1.4 What's NOT here (vs the current outbox baseline)

- **No outbox queue.** Dexie IS the durable store; the `_dirty` flag is the only "queue."
- **No retry/backoff state machine.** Next scheduler tick re-collects dirty rows by definition.
- **No poison classifier.** Mutation never fails locally; server-side LWW silently wins (for legitimate transient errors). 4xx errors surface as a toaster + retry-with-fresh-token, no drop.
- **No `MAX_ATTEMPTS`, no exponential backoff cap, no in-flight registry.**
- **No `APP_VERSION` cache buster.** Dexie versioned schema handles upgrades natively.
- **No compound-transaction online-gate.** Everything's local + atomic Dexie tx; `createDish` and `createProduct` work offline.
- **No optimistic-update-then-reconcile choreography.** Dexie row IS the truth client-side.

## B.2 Points of failure — counted honestly

The user claims ~2 vs ~6 for outbox. My honest count: **3 first-class + 4 minor = 7 total, but each ~10× lower-stakes than the outbox failure modes.** Net **2 net new failure modes, 5 outbox modes removed, 2 unchanged.** The user's claim is approximately correct.

### B.2.1 First-class #1 — Schema migration on the local DB

**Risk:** Add a column to `products`. Old client still has Dexie schema vN, server now expects vN+1. Old client pushes old shape; LWW happily writes stale shape over fresh.

**Mitigation:**
- Dexie's versioned schema (`db.version(N).stores({...}).upgrade(tx => ...)`) — 5-line migration callback, not a buster.
- Server `client_modified_at` guard: stale-shape row that's *older* loses to fresh server data. The dangerous case (offline-edited row + missing fields) is fixed with **partial JSON merge** on the server: `payload = old_payload || new_payload` instead of full replace. ~10 lines of SQL.
- For irreconcilable schema breaks (rare): bump `schemaVersion` in `disher.meta`; on push, server returns 409; client wipes Dexie and pulls fresh snapshot. Same shape as `APP_VERSION` buster, narrower scope.

**Assessment:** Real but bounded. Same problem class as today's `APP_VERSION` buster, smaller blast radius (only dirty rows on offline clients).

### B.2.2 First-class #2 — Clock skew (LWW correctness)

**Risk:** Phone clock 5min behind laptop. User edits product on laptop at 12:00, edits same product on phone at 12:01 (phone-local) but phone wall-clock says 11:56. Phone's edit has earlier `client_modified_at`. LWW keeps laptop. Phone edit silently lost.

**Mitigation:**
- Disher is sequential single-user multi-device — "actively switched devices same minute" is rare.
- Server stamps its own `server_received_at` on push. On next pull, client compares; if server has a newer version of a row the client also marked dirty → conflict toaster: "your phone edit didn't sync in time, server has X, your version Y; pick one." Explicit UX, not silent loss. ~50 lines.
- For Disher's domain: `schedule_foods` are append-mostly cross-device; products/dishes are edited rarely. Realistic conflict rate is ~zero.

**Assessment:** Low-probability for Disher's profile. Mitigation is comparable in complexity to outbox poison classifier — and arguably simpler, because conflicts are explicit and user-resolvable.

### B.2.3 First-class #3 — First-mutation-eviction window

**Risk:** User installs PWA, creates a product, iOS evicts IDB before the first `pushScheduler` tick. Data lost (no server copy yet).

**Mitigation:**
- Push **immediately on every mutation when online** collapses the eviction window to "user is offline AND device evicts" — essentially never.
- Per `project_ios_pwa_storage_eviction.md`: home-screen PWAs on Safari 17+ are NOT subject to 7-day eviction. Risk is much lower than feared.
- Belt-and-suspenders: `storageWritable` boot probe (already recommended for the existing outbox per `project_outbox_audit_2026_04_28.md`) — refuse mutations until storage is writable.

**Assessment:** Strictly *not worse* than the outbox baseline (same eviction + same offline = same loss). With the immediate-online-push, strictly *better*.

### B.2.4 Minor #4 — Multi-tab same-device coordination

**Risk:** Two tabs both read `_dirty=true`, both POST. Server LWW makes this idempotent → no data corruption, just wasted bandwidth + a `_dirty`-clear race.

**Mitigation:** Run the `_dirty` clear inside a Dexie `rw` transaction with `WHERE client_modified_at <= pushTimestamp`. Race-safe by construction. Tab B's clear no-ops if tab A already cleared. ~5 lines. No leader election needed.

**Assessment:** Simpler than the outbox baseline (which needs `BroadcastChannel` + `navigator.locks` per Option 1's "harden the baseline" recommendation).

### B.2.5 Minor #5 — Catalog hydration (read-only global products)

**Risk:** ~412 global products live in `products WHERE user_id IS NULL`. Backup-polling treats all rows as user-mutable. Catalog is read-only.

**Mitigation:** Catalog ships as a separate read pipeline: `GET /api/catalog/snapshot` cached aggressively, ETag-guarded, hydrated into Dexie `disher.catalog` on cold start. UI reads union of `disher.catalog` + `disher.products` via Dexie compound query. Catalog never `_dirty`.

**Assessment:** Trivial. Same shape as today's `useAllProductsQuery` returning catalog + user products in one trip.

### B.2.6 Minor #6 — Free-text food (LLM still online-only)

**Risk:** `/api/free-text-food` is LLM + vector-matching, can't work offline.

**Mitigation:** Already online-gated via `useOnline()`. No regression. Backup-polling doesn't touch this.

**Assessment:** Non-issue.

### B.2.7 Minor #7 — Network failures during push

**Risk:** 5xx, drop, abort.

**Mitigation:** Server idempotent (LWW + ON CONFLICT). Re-push harmless. Client just doesn't clear `_dirty` if push didn't 2xx. Next tick retries. **No backoff state, no MAX_ATTEMPTS, no poison detection** — failure is transient by definition (4xx surfaces as toaster + auth refresh).

**Assessment:** This is the *whole point* of backup-polling. Re-collecting dirty rows next tick replaces the outbox retry state machine.

### B.2.8 Auth / RLS / per-user isolation

Re-uses existing auth infra. 401 → `supabase.auth.refreshSession()` → re-push. RLS unchanged (`user_id = auth.uid()` filter on backup endpoint). Zero new attack surface vs current Supabase REST writes. See `project_auth_invariant.md`.

### B.2.9 Final POF count vs outbox baseline

| # | Backup-polling failure mode | Severity | New code |
|---|---|---|---|
| 1 | Local DB schema migration | Medium | ~30 LOC (Dexie versioned + server JSON merge) |
| 2 | Clock skew lost edit | Low | ~50 LOC (server_received_at + conflict UX) |
| 3 | First-mutation eviction | Very low | ~20 LOC (storageWritable probe, shared with outbox) |
| 4 | Multi-tab race | Very low | ~5 LOC (timestamp-guard `_dirty` clear) |
| 5 | Catalog hydration | Negligible | ~30 LOC (separate cached endpoint) |
| 6 | LLM online-only | Non-issue | Already gated |
| 7 | Push network failure | Non-issue | 0 LOC (re-collect next tick) |

| # | Outbox failure mode (today) | Severity in practice |
|---|---|---|
| 1 | Enqueue + invalidate race → flicker (`feedback_outbox_no_invalidate.md`) | High — motivated this whole research |
| 2 | Multi-tab leader election absent | Medium |
| 3 | Compound-flow online-gate UX | Medium — degrades offline UX |
| 4 | MAX_ATTEMPTS poison mis-classification | Medium |
| 5 | APP_VERSION buster drops good rows | Medium |
| 6 | 401 retry vs poison-drop ambiguity | Medium |
| 7 | Drain throughput on 1200+ pending (`project_drain_batch_critical.md`) | High — known scaling issue |

**Backup-polling removes 5 of 7 outbox failure modes by construction (#1, #3, #4, #5, #7), introduces 2 genuinely new ones (#1 schema migration, #2 clock skew).** Net: **5 removed, 2 added, 2 unchanged.**

## B.3 Head-to-head simplicity comparisons

### B.3.1 vs LiveStore

| Axis | LiveStore | Backup-polling |
|------|-----------|----------------|
| Mental model | Event log → materializers → SQLite → reactive query | Mutation → Dexie row → push when convenient |
| Conceptual surface | High: events, materializers, eventlog replay, sync provider | Low: rows + dirty flag + interval push |
| Bundle | ~500KB (SQLite WASM) | ~28KB (Dexie + ~50-line push module) |
| Sync engine | Bundled, opinionated | None (you write `pushDirtyRows()`) |
| Debug story | "Read the eventlog" | "Look at Dexie, look at server, diff" |
| Compound flows | Atomic via materializer | Atomic via Dexie `db.transaction()` |
| Offline-instant | Yes (sync SQLite WAL) | Yes (Dexie IDB tx) |

**Verdict:** Backup-polling is dramatically simpler. LiveStore wins on "you don't write the sync engine" — but the sync engine here is ~50 lines, not 500.

### B.3.2 vs RxDB

| Axis | RxDB | Backup-polling |
|------|------|----------------|
| Bundle | 60–200 KB | ~28 KB |
| Sync model | Bidirectional pull/push w/ replication-supabase | Push-only, snapshot pull on recovery |
| Backend reqs | Postgres + checkpoint protocol (extra columns, `_deleted`) | Postgres + ONE ON CONFLICT endpoint |
| Reactive | First-class (RxJS) | Dexie liveQuery (good enough) |
| Schema migration | Built-in `migrationStrategies` | Dexie `version().upgrade()` |
| Conceptual surface | RxJS + RxDB schema DSL + replication checkpoints + plugins | Dexie schema + a 50-line push module |

**Verdict:** RxDB is essentially backup-polling-plus: gives bidirectional sync at the cost of more concepts. If server→client push isn't needed (Disher's case: sequential, lag-tolerant), RxDB is over-engineered.

### B.3.3 vs TanStack DB + offline-transactions

| Axis | TanStack DB + offline-tx | Backup-polling |
|------|------|----------------|
| Outbox under hood | Yes (still has 6 failure modes from §B.2.9 right column) | No (no outbox at all) |
| Bundle | ~50–70 KB | ~28 KB |
| Source of truth | Server (cache + optimistic) | Local Dexie (LWW server) |
| Compound flows offline | Online-gate or compound mutator | Native — Dexie tx is local |

**Verdict:** Philosophically opposed. Backup-polling wins on simplicity AND offline UX (compound flows work offline). TanStack DB wins on "you adopt a maintained library." Real trade.

### B.3.4 vs Jazz / InstantDB / Firebase

All replace the data model and/or backend. Backup-polling keeps Supabase as the durable backup target with no schema rewrite.

**Verdict:** Backup-polling wins on "stay on Supabase + no third-party data dependency." Jazz/Instant win on "fewer moving parts after you commit," but only on greenfield.

### B.3.5 vs naive online-first (no offline)

| Axis | Online-first | Backup-polling |
|------|------|----------------|
| Code complexity | Lowest | Low-medium |
| Offline UX | Broken | Fully usable |
| iOS background tab kills | Lose unsent edits | Edits durable in IDB |

**Verdict:** Naive online-first wins on raw simplicity but loses badly on UX and the user's "days offline" SLO. Not viable.

### B.3.6 vs current TanStack Query + custom outbox (Disher baseline)

| Axis | Current outbox | Backup-polling |
|------|------|----------------|
| Lines I own | ~400 (pendingWrites + syncRowMutationFn + offlineExecutor + classifier + APP_VERSION buster + tests) | ~150 estimated (Dexie schema + push module + snapshot pull + tests) |
| Failure modes (§B.2.9) | 6 medium-to-high in practice | 2 new + 2 unchanged + 5 removed |
| Source of truth | Supabase (+ local cache + outbox) | Local Dexie (+ Postgres backup) |
| Compound flows offline | Online-gated (UX block) | Just works |
| Reactivity | TanStack Query observers | Dexie liveQuery |
| Multi-device sync lag | ~100ms-ish per row when online | ~1s when both online; 30s–1h when not |
| Conflict handling | Server = truth (anyone clobbers) | LWW + explicit conflict UX |
| Recovery on eviction | Server canonical, lose unsent outbox | Snapshot pull |

**Verdict:** Beats baseline on simplicity AND offline UX, loses on multi-device freshness. For Disher's profile (single-user sequential, lag-tolerant), the trade is acceptable.

## B.4 Production prior art

I tried hard to find direct prior art for "regular DB locally + delta push to a dumb backup server, no server→client push." Honest findings:

### Closest matches

- **Bear (note app, iOS/Mac):** iCloud document sync, eventual consistency. Local source of truth, server is dumb backup, no realtime. Conflicts surface as duplicate notes. Massive production scale.
- **Joplin (notes):** Local SQLite + periodic sync to Dropbox/OneDrive/WebDAV. User-configurable interval (default 5 min). Closest publicly-documented analog. Open source, ships on iOS + desktop. The `feedback_timestamp_guard_pattern.md` memo references Joplin's `synced=true WHERE dateModified <= pushTimestamp` pattern — same race fix.
- **Day One (journal):** "Sync happens periodically." Local SQLite canonical. Cloud is backup.
- **Things 3 (todos):** "Things Cloud" sync described as "periodic, not real-time." Multi-device known to lag seconds-to-minutes.
- **Obsidian:** Pure local files. Sync opt-in (Obsidian Sync paid, iCloud, Dropbox, git). No realtime. User's `project_manual_export_idea.md` cites this lineage.
- **Apple Time Machine to NAS:** Hourly snapshots, no realtime. Same cadence as backup-polling's fallback timer (different domain — file system).

### Has anyone publicly named this pattern?

Searched: "delta push backup local first," "periodic sync local first," "hourly push offline first." **No widely-adopted name.** Closest terms:

- "Last-write-wins replication" (describes the conflict policy, not the architecture)
- "Push-only sync" (informal, used in Joplin/Day One discussions)
- "Episodic sync" (academic, not in mainstream JS docs)
- "Eventual consistency with periodic anti-entropy" (distributed systems, technically correct, nobody says this on HN)

**Honest verdict:** The pattern is well-trodden in commercial productivity apps (Bear, Joplin, Things, Day One) but doesn't have a brand name in the JS local-first ecosystem. The local-first JS scene is dominated by sync-engine vendors (LiveStore, Zero, RxDB, PowerSync, Jazz, Instant) who all market bidirectional realtime — backup-polling is "the boring answer" they don't sell.

That's actually a good sign: too simple to ship as a paid product, obvious enough that successful indie apps reach for it independently.

## B.5 Best stacks to pair with backup-polling

Ranked by simplicity for THIS specific architecture (where you write the sync layer yourself, ~50 LOC):

### B.5.1 Dexie 4.4 + ~50 lines push code — **probable winner**

- **Bundle:** ~26 KB (Dexie alone). With push module: ~28 KB total.
- **Why it fits:** Dexie's API is already shaped for this (versioned schema, `db.transaction()`, `liveQuery()`, IndexedDB durability). Dirty flag is one extra column.
- **Ergonomics:** TS-friendly, well-documented, 10-year-old library, used in tens of thousands of apps including Notion offline.
- **Multi-tab:** Dexie handles IDB transaction safety. Timestamp-guard `_dirty` clear (§B.2.4) is race-safe without leader election.
- **iOS Safari:** No known breakage. Standard PWA storage concerns, not Dexie-specific.
- **Migration cost:** Replace `idb-keyval` cache + `pendingWrites` outbox with Dexie tables. Entity `mutations.ts` becomes `db.products.put({...})`. ~3 days for entity layer.

**Rank: 1.**

### B.5.2 PGlite + own push — **overkill**

- **Bundle:** ~3 MB. The user removed the bundle gate, so technically allowed.
- **Why someone considers it:** Schema is *literally Postgres*; copy DDL between client and server. Same SQL works locally and remotely.
- **Why it loses anyway:** Wasm load + parse cost on iOS Safari cold start hurts. Solo dev gets nothing for the cost over Dexie — both give "tables and transactions." Local SQL aggregations aren't a Disher hot need.

**Rank: 5.**

### B.5.3 TinyBase + own synchronizer

- **Bundle:** ~5 KB (smallest).
- **Concern:** TinyBase is denormalized key-value-ish. Disher's data is normalized relational with FKs (`dish_items.dish_id → dishes.id`). Mapping to TinyBase loses FK validation Dexie's compound indexes give for free.
- **Production:** A few apps; no Supabase-paired example I could find.

**Rank: 3.** Possible if absolute floor on bundle is the goal; not chosen because relational fit is poor.

### B.5.4 Raw IndexedDB API

- **Bundle:** 0 (built-in).
- **Why no:** Raw IDB ergonomics are punishing. Auto-commit on microtask boundary, baroque schema upgrades, mass-delete is tedious. Saving 26 KB is not worth the productivity hit. Dexie exists for exactly this reason.

**Rank: don't.**

### B.5.5 LiveStore with custom sync transport — **overkill / philosophical mismatch**

LiveStore wants event-sourcing. You'd use its SQLite materialization while disabling its event-log philosophy. Worst of both worlds.

**Rank: don't.**

### B.5.6 SQLite-WASM (wa-sqlite, sql.js) + own push

- **Bundle:** 500–1000 KB. Same problem as PGlite at smaller scale.
- **Why someone considers:** "Real SQL on the client." Honestly: Dexie gives the data model needed; SQL-on-client isn't required.
- **iOS:** OPFS works on Safari 17+ but startup cost is real.

**Rank: 4.**

### B.5.7 Final stack ranking for backup-polling

1. **Dexie 4.4** — probable winner. ~28 KB total, perfect ergonomics, mature.
2. RxDB without the replication plugin — overkill but not disqualifying. ~80 KB; you'd use only the local store.
3. TinyBase — possible but relational fit is poor.
4. SQLite-WASM — only if SQL-on-client is required (Disher: no).
5. PGlite — only if you want literal Postgres DDL parity client+server.
6. Raw IDB — don't.
7. LiveStore — don't (philosophical mismatch).

## B.6 Honest pitfalls

### B.6.1 First-time multi-device user expects realtime

A user installs Disher on phone + laptop, edits product on phone, opens laptop expecting it there. With 1h fallback timer + 30s debounce, lag could be 30s–1h.

**Mitigations:**
- Push-on-mutation-when-online + `online` + `visibilitychange` cover the common case. New realistic lag: **~1s when both devices online**.
- Surface "Last synced X ago" indicator + manual "Sync now" button (pattern-compatible with `PendingWritesBadge`).
- Document expectation: "edits sync when both devices are online; 1h fallback covers anything missed."

**Honest verdict:** Acceptable for single-user food tracker. Not acceptable for collaborative editing. Disher isn't collaborative.

### B.6.2 Server-side storage cost

Backup-polling pushes deltas, not snapshots, so steady-state is normal Postgres (one row per entity, same as today). Snapshot endpoint is `SELECT * FROM ... WHERE user_id = $1` — no extra storage.

**Non-issue.** (The variant with snapshot history — `project_snapshot_backup_idea.md` — is more expensive but is NOT what's proposed here.)

### B.6.3 Backup server "down"

If Supabase / `/api/backup/push` is down for hours:
- Mutations still apply to Dexie; UI works fine.
- Push retries on next tick (5xx → retry; 4xx → toaster).
- No data loss as long as Dexie isn't evicted.

**Compared to outbox baseline:** identical (outbox also holds writes during outage). Not worse.

**Concern:** outage of *days* + eviction (extreme combo) → data gone. Same as outbox. Mitigation same: encourage user to keep PWA pinned.

### B.6.4 Data export

Trivial: `db.products.toArray()` then `JSON.stringify`. Implements `project_manual_export_idea.md` for free — Dexie data IS the user's data; export is one Dexie call.

**Privacy / compliance:** Backup endpoint stores in Supabase Postgres (same place as today). Same RLS, same retention, same DPA. No new compliance surface. Account deletion: standard cascade. Dexie is local; clears on uninstall.

### B.6.5 Telemetry / observability

How do we know mutations actually pushed?

- Client: log `lastPushAt` + `dirtyRowCount` to backend `/api/diag-logs` (route already exists per repo `git status`). Surface in `DiagButton` (already exists).
- Server: backup endpoint logs row counts per user per push. Anomaly detection ("user has had `_dirty > 24h`, no successful push") becomes a backend cron.
- UI: "synced X ago" indicator (extension of `PendingWritesBadge`).

**Honest assessment:** *Easier* to observe than the outbox. The 7-state outbox retry machine is harder to reason about than "rows are dirty until they aren't." A single counter on each side tells you everything.

### B.6.6 Edge cases I would actually lose sleep over

Being honest:

1. **Mutation → debounced push → tab close before push fires.** 30s debounce + tab close at 25s → no push. Next open: dirty rows still there → push fires. Fine. But if combined with eviction during the closed window → data loss. Mitigation: also fire on `pagehide` + `beforeunload` (best-effort, browsers throttle). This is the only edge case where backup-polling is *strictly worse* than enqueue-then-drain (which writes synchronously to IDB before resolving), and the gap is "30s of dirty data" vs "immediately durable." In practice eviction does not happen in 30s.
2. **Schema migrations across versions.** Real concern. Dexie versioned upgrades + server JSON-merge handle it, but every migration is a code review surface. Not unique to backup-polling — outbox has the same surface via `APP_VERSION`.
3. **Conflict UX.** "Phone version vs laptop version, pick one" surface is new code. ~50 lines + a modal, but it's UI work the current outbox elides ("server is truth, no UI conflict"). Cost: ~1 day to design + build.

None show-stoppers. All bounded.

## B.7 Honest verdict for backup-polling

**Does backup-polling beat the current TanStack Query + outbox baseline on simplicity?**

**Yes — given the stated assumptions.** Specifically:

✅ **Beats baseline when:**
- Single-user (Disher: yes).
- Sequential multi-device (Disher: yes per `project_auth_invariant.md`).
- "Days" offline SLO; 30s–1h cross-device sync lag acceptable (Disher: yes; food trackers don't need realtime cross-device).
- Backend smart enough to LWW + return snapshot (Disher: trivial; 2 endpoints on existing Node sidecar).
- Local DB with versioned schema available (Dexie fits perfectly).

❌ **Loses to baseline (or to a sync engine) when:**
- True multi-user collaborative editing required (Disher: no).
- Realtime cross-device freshness is a feature requirement (Disher: explicitly no).
- Schema changes are extremely frequent (Disher: low; food-tracker domain is stable).
- Team is multiple people and someone might "fix" the simplicity by adding a sync engine (Disher: solo dev, not a risk).

❌ **Specifically defeats it:**
- Adding multi-user features (a household sharing meal plans → real conflict resolution + realtime needed).
- A funding-round / vendor-support requirement to consume a managed sync engine. Not Disher today.
- Discovering iOS PWA eviction is more aggressive than `project_ios_pwa_storage_eviction.md` indicates. In that case all local-first variants suffer; backup-polling is no worse than baseline.

### B.7.1 Recommended next-step IF backup-polling is chosen

1. **Spike (2 days):** Dexie schema for `products` only. Replicate `useAllProductsQuery` + `createProduct` + `updateProduct` against Dexie. Wire push module + snapshot endpoint. Test offline-mutation → online-push.
2. **Verify (1 day):** Multi-tab race, eviction recovery (clear IDB → refresh → snapshot pull), schema upgrade (add a column, force migration).
3. **Migrate per-entity (5 days):** Roll across products → dishes → schedule_foods → schedule_events → daily_norms → periods.
4. **Decommission (1 day):** Delete `pendingWrites.ts`, `syncRowMutationFn.ts`, `offlineExecutor.ts`, `useOnline()` gates on compound flows. Keep `idb-keyval` only for Zustand draft persistence (or migrate those into Dexie too).

**Total: ~9 days.** Same order of magnitude as Tier-1 simplifications. **Higher upside** (deletes more code than Tier-1 adds).

### B.7.2 Recommended next-step IF backup-polling is rejected

Stick with Tier-1 from `project_simplification_tier1.md`. Reasons backup-polling might be rejected:
- "I don't trust 30s–1h cross-device lag" — fair; immediate-online-push narrows but doesn't kill it.
- "I want to use a maintained dependency, not own ~150 LOC" — fair; the maintenance cost of any sync-engine dep > 150 LOC of CRUD + a timer.
- "I want bidirectional realtime for future features" — fair; if multi-user is roadmap, plan a sync engine now. Backup-polling doesn't compose with realtime.

### B.7.3 Bottom line

Backup-polling is the simplest architecture I can find that meets Disher's stated criteria. It removes 5 of 7 outbox failure modes, adds 2 new ones with bounded mitigation, deletes more code than it writes, and has informal prior art in successful indie productivity apps (Bear, Joplin, Day One, Things). The pattern doesn't have a brand name in JS local-first because it's "boring" — but boring is the goal here.

The realistic risk is *not* technical. It's that 6 months from now, when adding a feature that wants realtime ("share meal plan with spouse"), the team would re-discover why sync engines exist. **For a single-user food tracker that promises to stay single-user, that's a fine tradeoff.** For anything else, it's not.

---

# Honest verdict

**Does ANY architecture beat the existing baseline (Supabase REST + TanStack Query + hand-rolled outbox) on raw simplicity + points of failure?**

**Updated answer (after the §B backup-polling re-examination): YES — backup-polling does, given Disher's specific profile.** Off-the-shelf SDKs do not; a self-built local-first variant does.

Re-ranked summary:

- **Backup-polling (Dexie + ~50-line push module)** — **beats baseline on simplicity + offline UX, loses on multi-device freshness.** Removes 5 of 7 outbox failure modes (§B.2.9). Adds 2 new bounded ones. Deletes more code than it writes. Strongest candidate IF Disher commits to staying single-user with sequential multi-device, lag-tolerant. **NEW LEADING OPTION.**
- **TanStack DB + offline-transactions** — *ties* on simplicity, *wins slightly* on hardening (multi-tab leader election, jitter, virtual props). Switching cost ~2 days. Net: marginal upgrade if pre-1.0 risk is acceptable; otherwise wash.
- **Jazz** — *would beat* baseline on POF count (5+ surfaces collapse into "trust Jazz") **only on a greenfield project**. For Disher, rewriting data model + replacing Supabase Auth + opaque failure modes outweighs the payoff.
- **InstantDB** — same pattern as Jazz: greenfield winner, brownfield loser. Diwaker friction log is a real signal that the simplicity is partial.
- **Everything else** — adds more concepts than it removes, OR replaces data model with something less SQL-shaped, OR is in maintenance/beta status.

**Off-the-shelf-only:** the only stacks that beat baseline on simplicity are Jazz and InstantDB, and only on greenfield. For brownfield Disher, the baseline IS simplest among off-the-shelf options.

**Self-built variants:** backup-polling is *strictly* simpler than the baseline outbox for Disher's profile. The trade is accepting 30s–1h worst-case cross-device lag (mitigated to ~1s with immediate-online-push) in exchange for deleting the entire outbox state machine.

---

# What to actually try as a PoC

In priority order (re-ordered after §B):

### Option 0 (NEW LEADING): Spike backup-polling on the `products` entity

Per §B.7.1: 2-day spike. Build Dexie schema for products, port `useAllProductsQuery` + `createProduct` + `updateProduct` to Dexie reads/writes, add a `pushDirtyRows()` module + `/api/backup/push` endpoint on the Node sidecar. Test offline-mutation → online-push, multi-tab race, eviction recovery (clear IDB → snapshot pull), schema upgrade.

**Decision criteria after spike:**
- ✅ Mutations apply within 16ms locally and survive process kill → backup-polling works.
- ✅ Cross-device lag with immediate-online-push is ≤2s in practice → multi-device freshness acceptable.
- ✅ Snapshot pull on cleared IDB restores all data → recovery flow trustworthy.
- ❌ If any of the above fails, fall back to Option 1.

If green: proceed to per-entity migration (~5 days) and outbox decommission (~1 day). Total ~9 days. Deletes more code than it writes. **Highest upside of any option.**

### Option 1 (fallback if Option 0 fails or backup-polling rejected): Harden the baseline. Don't migrate.

The baseline is already simpler than every off-the-shelf option for a brownfield Disher. The two real gaps the audit memo flagged are:

1. **Cross-tab leader election** for the outbox drainer. ~30 LOC using `BroadcastChannel` + `navigator.locks`. Source idea: copy the algorithm from `@tanstack/offline-transactions` README.
2. **Storage probe at boot** — try a write to IDB before unlocking the UI; if it fails (Safari private mode, quota exhausted), surface a "your data won't be saved" warning. ~20 LOC.

Plus the optional pre-merged items from the simplification plan: entityCache, coalesce, batch RPC. None of these require leaving the stack.

**Why this option:** preserves all invariant tests, no rewrite, no new dependency, ships in a day.

### Option 2 (if user wants to validate): A 1-week TanStack DB spike

Port one entity (`schedule_food`) to a TanStack DB collection + `offline-transactions`. Keep everything else on the baseline. Measure:

- Is multi-tab + jitter visibly better?
- Does the schedule UI feel snappier with reactive collections?
- How big does the bundle grow?

If yes to all, plan a phased migration. If no, the answer is "baseline wins, ship Option 1."

### Option 3 (only if the user is genuinely greenfield-curious): A 2-week Jazz spike

Build a parallel "schedule" prototype on Jazz from scratch. Model `Account → products: CoList<Product>`, `schedule: CoList<ScheduleFood>`, etc. Test offline drain, multi-device, recovery. This is a learning exercise; the answer for Disher will likely be "not worth a rewrite," but it'll calibrate what "trust the framework" feels like in practice.

---

# Key shifts vs prior research

| Topic | Prior verdict | New verdict |
|---|---|---|
| LiveStore | OUT — bundle/pre-1.0 | Still OUT — event-sourcing is overkill, NOT a simplicity win |
| Zero | SHORTLIST WITH CAVEAT | **Disqualified by NEW gate** (logical replication) |
| PowerSync | (in use) | **Disqualified** (logical replication) |
| ElectricSQL | not actively considered | **Disqualified** (logical replication) |
| Triplit | OUT — uncertain status | OUT — same |
| TanStack DB + offline-transactions | STRONG SHORTLIST | **Confirmed**: marginal upgrade or wash vs baseline |
| RxDB | SHORTLIST | OUT on simplicity grounds, not bundle |
| Dexie + Dexie Cloud | OUT (wrong backend) | Plain Dexie = cosmetic only; Dexie Cloud rejected on data model fit |
| Jazz | OUT (CRDT mental model) | **Re-considered**: best "could-beat" candidate IF greenfield. Loses on rewrite cost. |
| InstantDB | OUT (wrong backend) | **Re-considered**: tied with Jazz; Diwaker friction-log dims it. |
| PGlite | not central | OUT — adds concepts vs baseline despite local-SQL appeal |
| Firestore | (not deeply reviewed) | OUT — 500-offline-transaction cap is a real ceiling |
| Realm / MongoDB Device Sync | (not central) | **DEAD** — EOL Sept 30, 2025 |
| Evolu | OUT (immature) | Tech is solid; OUT on UX (mnemonic-as-identity wrong for casual food tracker) |
| Turso Offline Sync | not yet ranked | Public beta — re-check in 6 months |
| Custom Postgres event log | not central | OUT — strictly more code than baseline |

---

# Final recommendation

**Updated after §B backup-polling re-examination.**

Two viable paths, depending on user appetite:

**Path A (lower cost, baseline-only):** Plug the two real gaps in the existing outbox (cross-tab leader, storage probe). Ship. ~1 day. Preserves invariant tests, no rewrite, no new dependency. The simplicity floor among off-the-shelf options.

**Path B (higher upside, architecture change):** Spike backup-polling per Option 0. If green, migrate ~9 days total. **Deletes** the outbox + state machine + online-gate UX. Net code reduction, fewer failure modes, better offline UX. **Recommended IF the user accepts 30s–1h worst-case cross-device lag (mitigated to ~1s with immediate-online-push).**

The decision between A and B is **not technical** — both are sound. It's a values call:
- A = "the working code is the simpler code; don't rewrite working code."
- B = "the architecture itself can be simpler; rewriting is worth it once."

Off-the-shelf SDKs (TanStack DB, RxDB, Jazz, Instant, LiveStore, etc.) are dominated by Path A on simplicity for brownfield Disher. None of them strictly beats Path B on simplicity + POF count + offline UX for the user's profile.

If a re-platform is ever genuinely on the table for *different reasons* — e.g., adding multi-user sharing or true collaboration — re-open this list with **Jazz** at the top. Backup-polling does not compose with realtime collaboration.

---

## Sources

- [LiveStore docs (livestorejs)](https://docs.livestore.dev/)
- [LiveStore GitHub](https://github.com/livestorejs/livestore)
- [Jazz tools — How it works](https://jazz.tools/)
- [Jazz Data Modelling](https://jazz.tools/docs/react/reference/data-modelling)
- [Jazz 0.16.0 release notes](https://jazz.tools/docs/react/upgrade/0-16-0)
- [InstantDB architecture essay](https://www.instantdb.com/essays/architecture)
- [Diwaker Gupta — Friction Log: InstantDB (Jan 2026)](https://diwaker.io/friction-log-instantdb/)
- [Choosing a Sync Engine for Local-First in 2026 — johnny.sh](https://johnny.sh/blog/choosing-a-sync-engine-in-2026/)
- [TanStack DB 0.6 announcement](https://tanstack.com/blog/tanstack-db-0.6-app-ready-with-persistence-and-includes)
- [@tanstack/offline-transactions](https://www.npmjs.com/package/@tanstack/offline-transactions)
- [RxDB v17 release](https://rxdb.info/releases/17.0.0.html)
- [PocketBase offline discussion #67](https://github.com/pocketbase/pocketbase/discussions/67)
- [PocketBase PWA discussion #4379](https://github.com/pocketbase/pocketbase/discussions/4379)
- [Firestore — Access data offline (500-tx cap)](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- [MongoDB Device Sync deprecation announcement](https://www.mongodb.com/docs/atlas/app-services/sync/device-sync-deprecation/)
- [Turso Offline Sync public beta](https://turso.tech/blog/turso-offline-sync-public-beta)
- [PGlite v0.4 announcement](https://electric-sql.com/blog/2026/03/25/announcing-pglite-v04)
- [Evolu — Scaling local-first software](https://www.evolu.dev/blog/scaling-local-first-software)
- [PouchDB FAQ + replication](https://pouchdb.com/faq.html)
- [FOSDEM 2026 Local-First track](https://fosdem.org/2026/schedule/track/local-first/)
- [GenosDB — P2P/CRDT comparison 2026](https://genosdb.com/popular-p2p-distributed-databases)

### Sources added for §B (backup-polling)

- [Dexie 4.4 / Dexie Cloud Server 3.0](https://medium.com/dexie-js/dexie-4-4-dexie-cloud-server-3-0-the-big-one-d883b98599e8)
- [Dexie versioned schema docs](https://dexie.org/docs/Tutorial/Design#database-versioning)
- [Joplin sync model](https://joplinapp.org/help/dev/spec/sync)
- [Bear iCloud sync FAQ](https://bear.app/faq/sync/)
- [Obsidian Sync](https://help.obsidian.md/Obsidian+Sync)
- [Day One sync overview](https://dayoneapp.com/guides/tips-and-tutorials/sync/)
- [Things Cloud info](https://culturedcode.com/things/support/articles/2803572/)
- [Local-first principles (Kleppmann et al., 2019)](https://martin.kleppmann.com/papers/local-first.pdf)
- [WebKit eviction policy](https://webkit.org/blog/12257/the-user-agent-string-and-data-quotas/)
- Disher project memos: `project_outbox_audit_2026_04_28.md`, `feedback_outbox_no_invalidate.md`, `feedback_timestamp_guard_pattern.md`, `project_simplification_tier1.md`, `project_ios_pwa_storage_eviction.md`, `project_manual_export_idea.md`, `project_snapshot_backup_idea.md`, `project_auth_invariant.md`, `project_drain_batch_critical.md`
