# Offline-First / Local-First / Event-Sourcing JS Stacks — Fresh Inventory (April 2026)

**Date of research:** 2026-04-29
**Scope:** Independent inventory of every plausible offline-first / local-first / event-sourcing JavaScript stack for a single-user PWA on iOS Safari, evaluated against Disher's constraints (Supabase Postgres backend, ≤200KB bundle, single-developer maintainability, "days" offline SLO, structured/relational data, no CRDT-friendly text docs).
**Methodology:** GitHub releases + npm registry + official docs + community discussion (HN, johnny.sh, marmelab, localfirst.fm) cross-referenced. No prior project memos used as filter.

---

## How to read this document

Each stack is scored on a 10-point template. The only opinions in here are tagged "Verdict for Disher fit". Where I couldn't find data, I write "unknown" — I do not invent versions.

---

## Section 1 — Stack-by-stack

### 1. LiveStore (livestorejs)

1. **URL:** https://livestore.dev/ — https://github.com/livestorejs/livestore
2. **Version + status:** Last stable on npm is `0.3.1` (~10 months old). Active dev branch is `0.4.0-dev.22` (Dec 2025), explicitly pre-release. **Beta**.
3. **Core mechanism:** Event-sourcing on top of reactive SQLite (WASM in the browser, SQLite native on RN). Mutations are events appended to a local eventlog and materialized into SQLite in the same tick; sync engine pushes/pulls events between clients and a sync backend. Authoritative state = the eventlog; SQLite is a derived projection.
4. **Bundle size:** SQLite WASM dominates. Realistic web bundle is ~500–1000 KB gzipped including WASM. **Over Disher's 200KB cap.**
5. **Backend requirements:** First-party sync providers are `@livestore/sync-cf` (Cloudflare Workers + DO) and a node provider. No first-party Supabase adapter; would need a custom event-log endpoint.
6. **iOS Safari quirks:** Uses OPFS where available — works in Safari 17+ but cold-start cost is non-trivial. No reported fundamental breakage.
7. **Compound transactions:** Excellent — multi-table commits are atomic per event materializer, by design.
8. **Production case studies:** Overtone (music app, by the LiveStore author). Some smaller indie projects. No widely-known commercial deployment as of April 2026.
9. **Single-dev maintainability:** Beginner needs to understand event-sourcing AND materialization. Debugging requires reading the eventlog. Higher conceptual load than mutation-based stacks.
10. **Verdict for Disher fit:** **OUT.** Bundle size + pre-1.0 + JWT.sub-on-sync-cf gotcha + eventlog mental model is overkill for a single-user food tracker with no concurrent edits.

### 2. TanStack DB (@tanstack/db)

1. **URL:** https://tanstack.com/db — https://github.com/TanStack/db
2. **Version + status:** `0.6.5` (April 14, 2026). **Beta**, road to 1.0 explicit, SSR design partners being recruited.
3. **Core mechanism:** Reactive client-side store fed by sync collections. Mutations go through `Transaction` API; an outbox-style queue (`@tanstack/offline-transactions` package) optionally persists mutations before dispatch with retry + multi-tab leader election. Authoritative state = server (push/pull); local store is cache + optimistic overlay.
4. **Bundle size:** `@tanstack/db` core ~30–40KB gzipped. With `offline-transactions` and a sync collection ~50–70KB. With `browser-db-sqlite-persistence` (WASM): adds ~500KB. **In-budget without WASM persistence.**
5. **Backend requirements:** Backend-agnostic. You write the sync function (fetch + push). RxDB collection adapter exists. Trivial to wire to Supabase REST.
6. **iOS Safari quirks:** No specific Safari breakage. SQLite-backed adapter uses OPFS (Safari 17+ ok). Plain query+IndexedDB persistence path is iOS-friendly.
7. **Compound transactions:** Yes — `Transaction` API supports multi-collection commits with optimistic semantics.
8. **Production case studies:** ElectricSQL ships TanStack DB integrations as their official client (per March 2026 ElectricSQL blog). Indie usage growing. No mass-market consumer product publicly named.
9. **Single-dev maintainability:** **High.** Mutation flow is plain TS, queries are familiar to anyone using TanStack Query. The outbox is a documented invariant, not magic.
10. **Verdict for Disher fit:** **STRONG SHORTLIST.** The `offline-transactions` package is essentially what Disher already built. Pre-1.0 is the only real gate concern; classifier and APP_VERSION semantics would need to be ported to its retry hooks.

### 3. RxDB

1. **URL:** https://rxdb.info — https://github.com/pubkey/rxdb
2. **Version + status:** `17.1.0` (April 2026). v17 released March 30, 2026. **Stable, mature** (10+ years).
3. **Core mechanism:** Reactive NoSQL collections over a pluggable RxStorage layer (Dexie/IndexedDB, OPFS, SQLite, Memory). Replication is a generic pull/push protocol with stream support; per-backend plugins (Supabase, CouchDB, GraphQL, AppWrite, etc.) wrap it.
4. **Bundle size:** Minimal Dexie storage + no sync ≈ 60KB. Full setup with Supabase replication + encryption ≈ 200KB. **At-or-just-over budget.**
5. **Backend requirements:** First-party `replication-supabase` plugin uses PostgREST + Realtime. Production-quality.
6. **iOS Safari quirks:** IndexedDB storage works on iOS with no special quirks. WebSocket realtime suffers same iOS background limits as anything else, but the replication protocol is poll-tolerant.
7. **Compound transactions:** Per-collection bulk writes are atomic; cross-collection compound ops are app-level. Workable for createDish + dish_items if you sequence writes.
8. **Production case studies:** Many indie + enterprise (RxDB lists case studies; pubkey is consistently active). Not a fad.
9. **Single-dev maintainability:** Medium — schema migrations, hooks, and conflict resolution have a learning curve, but every concept maps to docs. Premium plugin ecosystem (paid) for some storage backends; the open-source core is sufficient for a Disher-shaped app.
10. **Verdict for Disher fit:** **SHORTLIST.** Mature, Supabase plugin exists, reactive UI integrates cleanly. Bundle is at the ceiling — would need careful tree-shaking. The premium-plugin upsell is mild but a friction point.

### 4. Dexie + Dexie Cloud

1. **URL:** https://dexie.org — https://dexie.org/cloud — https://github.com/dexie/Dexie.js
2. **Version + status:** Dexie `4.4` + Dexie Cloud `dexie-cloud-addon@4.4.7` + Dexie Cloud Server `3.0` (March 2026). **Stable, production**.
3. **Core mechanism:** Dexie is a thin reactive wrapper over IndexedDB (industry standard for IDB in JS). Dexie Cloud adds sync via a managed/self-hostable server using mutation logs; Dexie Cloud uses its own auth (passwordless email + OTP) and tenant model.
4. **Bundle size:** Dexie alone: 26KB gzipped. Dexie + Dexie Cloud addon: ~50–60KB gzipped. **Well within budget.**
5. **Backend requirements:** Dexie Cloud requires Dexie Cloud Server (managed by Dexie team or self-hosted Postgres-backed). **NOT Supabase-compatible** out of the box; you'd run Dexie Cloud Server alongside or replace Supabase.
6. **iOS Safari quirks:** None known specific to Dexie. IndexedDB on iOS Safari works.
7. **Compound transactions:** Excellent — Dexie's `db.transaction()` is the textbook IndexedDB compound-transaction API.
8. **Production case studies:** Dexie itself ships in tens of thousands of apps (Notion offline, etc.). Dexie Cloud is newer; case studies are smaller but real (per Fahlander's Medium posts).
9. **Single-dev maintainability:** **Very high** for plain Dexie. Dexie Cloud adds a server to manage; medium maintainability.
10. **Verdict for Disher fit:** **PROMISING BUT WRONG BACKEND.** Plain Dexie is great as a local cache. Dexie Cloud as the sync layer would mean abandoning Supabase Postgres. Unless Disher pivots backend, Dexie Cloud is OUT for sync; plain Dexie remains a viable IDB primitive.

### 5. Triplit (post-Supabase acqui-hire)

1. **URL:** https://triplit.dev — https://github.com/aspen-cloud/triplit
2. **Version + status:** Triplit team joined Supabase October 8, 2025 (Matt Linkous → "expand third-party integrations and offline-first capabilities"). Triplit OSS continues but is now community-maintained per johnny.sh (April 2026). **In governance limbo.**
3. **Core mechanism:** Reactive client + custom Triplit Server (Node) with an embedded sync protocol. Schema-first with full-stack type safety.
4. **Bundle size:** ~80–120KB gzipped (estimate, no fresh measurement).
5. **Backend requirements:** Requires Triplit Server. Not Supabase-Postgres-compatible — Triplit has its own storage layer.
6. **iOS Safari quirks:** None publicly reported as blocking; uses IndexedDB.
7. **Compound transactions:** Yes — `client.transact()` API supports multi-entity commits.
8. **Production case studies:** Pre-acquisition adoption was modest. Future as a standalone product is unclear: Supabase may absorb the tech into a native offline solution rather than maintain Triplit as a separate brand.
9. **Single-dev maintainability:** Was good (clean DX). Now has a "is this maintained?" red flag.
10. **Verdict for Disher fit:** **OUT.** Maintainer-status uncertainty + non-Supabase-Postgres backend even though the team is now AT Supabase. Watch for a future Supabase-native sync product, but don't bet a 2026 codebase on it today.

### 6. Zero (rocicorp/zero)

1. **URL:** https://zero.rocicorp.dev — https://github.com/rocicorp/mono (packages/zero)
2. **Version + status:** **Zero 1.4 — STABLE / GA.** Zero 1.0 (first stable) shipped in early 2026; 1.4 is the current line. This is a major change from prior context — Zero is no longer alpha.
3. **Core mechanism:** Sync engine acting as a layer between clients and Postgres. `zero-cache` server holds a SQLite replica of Postgres (via logical replication slot) and streams query results to clients. Custom mutators run on client AND server. Authoritative state = Postgres; client has a partial replica.
4. **Bundle size:** Client `@rocicorp/zero` ≈ 100–140KB gzipped. **At budget.**
5. **Backend requirements:** Needs Postgres with `wal_level=logical` AND a deployed `zero-cache` server (Hetzner CAX11-class is enough for small apps). **Supabase Postgres is supported** (you point zero-cache at the Supabase upstream DB), BUT Supabase free-tier-pooled connections won't work — you need a direct connection (same gotcha PowerSync had). Self-host or use Rocicorp's hosted offering.
6. **iOS Safari quirks:** WebSocket-based sync; same iOS background-suspension caveats as PowerSync's WebSocket transport, but no fundamental break. Persists locally to IndexedDB.
7. **Compound transactions:** Yes — custom mutators are first-class and run client+server with shared TS code.
8. **Production case studies:** Productlane (customer support tool) shipped on Zero. johnny.sh (April 2026) chose Zero over LiveStore/Triplit/Electric. Strong signal — but still small N.
9. **Single-dev maintainability:** Mutation flow is clean (Drizzle integration is praised). The operational burden is the extra server (zero-cache) you must run and monitor — non-trivial for a solo dev with a Supabase-only stack.
10. **Verdict for Disher fit:** **SHORTLIST WITH CAVEAT.** Tech is now stable, mutator model fits compound flows, johnny.sh's first-hand 2026 verdict is positive. The **operational gate** is real: Disher would add zero-cache as a third deployable (alongside Supabase + the Node sidecar). For a single-user food tracker that's a lot of infrastructure for marginal UX gain over outbox.

### 7. Replicache (standalone)

1. **URL:** https://replicache.dev — https://github.com/rocicorp/replicache
2. **Version + status:** `15.3.0` (last standalone publish ~6 months ago). **Maintenance mode** — Rocicorp explicitly says "open-sourced, no longer charging, focus shifted to Zero, existing users should migrate."
3. **Core mechanism:** Mutation-based sync. Client maintains local SQL-like KV store; mutations are functions run optimistically on client and authoritatively on server; server pushes patches.
4. **Bundle size:** ~70KB gzipped historically.
5. **Backend requirements:** Bring-your-own server (you implement push/pull endpoints). Supabase-compatible if you write the endpoints.
6. **iOS Safari quirks:** Works on iOS, IndexedDB-backed.
7. **Compound transactions:** Yes — mutators are atomic.
8. **Production case studies:** Linear used Replicache for years (Linear sync has since evolved). Many production apps. But all on Replicache 14/15, no new ones starting in 2026.
9. **Single-dev maintainability:** Was good, but choosing a "maintenance mode" stack in 2026 is malpractice for a new project.
10. **Verdict for Disher fit:** **OUT.** Pick its successor (Zero) or don't pick this lineage.

### 8. PowerSync (re-evaluation)

1. **URL:** https://powersync.com — https://github.com/powersync-ja
2. **Version + status:** Stable. Active commercial development. Disher previously rejected over (a) connection-pooler incompatibility with Supabase free tier and (b) iOS WebSocket-vs-HTTP transport surprise.
3. **Core mechanism:** Postgres → SQLite sync via a PowerSync service that replicates your Supabase upstream into per-user SQLite chunks delivered over WebSocket (preferred) or HTTP streaming (broken on iOS).
4. **Bundle size:** Web SDK ~250–350KB gzipped including SQLite WASM. **Over Disher's budget.**
5. **Backend requirements:** PowerSync Cloud (managed) or self-hosted PowerSync service + Supabase Postgres on Session Pooler / direct connection (NOT the IPv6 default).
6. **iOS Safari quirks:** **WebSocket transport is mandatory on iOS** — HTTP streaming hangs (project memo confirms). PowerSync supports this; not a blocker if configured.
7. **Compound transactions:** Yes — local SQLite handles compound writes, sync happens in a single oplog batch.
8. **Production case studies:** Several Flutter/RN production apps (FlutterFlow ecosystem). Web case studies thinner.
9. **Single-dev maintainability:** Medium — declarative sync rules in YAML are powerful but opaque when broken.
10. **Verdict for Disher fit:** **OUT (re-confirmed).** Nothing has changed since rejection. Bundle size + WAL trap on free-tier Supabase + need for managed service add up. The original reasons remain valid. It's a fine stack for the right project; this isn't it.

### 9. Jazz (jazz.tools)

1. **URL:** https://jazz.tools — https://github.com/garden-co/jazz
2. **Version + status:** **v2 alpha** (per official site). No stable production release as of April 2026.
3. **Core mechanism:** Distributed CRDT-like database (CoValues) replicated peer-to-peer or via Jazz Cloud. Built-in auth, encryption, presence, file streams.
4. **Bundle size:** Unknown precisely; probably 100–200KB gzipped.
5. **Backend requirements:** Jazz Cloud (managed) or self-host. **Not Supabase-compatible**; Jazz is its own data plane.
6. **iOS Safari quirks:** No specific known issues; uses IndexedDB.
7. **Compound transactions:** Co-values can be nested; compound writes are CRDT-merge-friendly.
8. **Production case studies:** Garden (the company) ships some demos. johnny.sh April 2026 explicitly mentions Jazz as "rejected" without elaboration. No mass-market app publicly identified.
9. **Single-dev maintainability:** CRDT internals leak when debugging. The CoValue model is non-trivial.
10. **Verdict for Disher fit:** **OUT.** Pre-1.0 alpha + incompatible backend + CRDT mental model for a non-CRDT-friendly domain (relational food data, no concurrent editing).

### 10. InstantDB

1. **URL:** https://instantdb.com — https://github.com/instantdb/instant
2. **Version + status:** Stable, hosted product. Continues to add features; positions itself as "the best backend for AI-coded apps".
3. **Core mechanism:** Hosted relational DB with real-time push to clients; client maintains local cache with offline mode + optimistic updates.
4. **Bundle size:** ~80–110KB gzipped.
5. **Backend requirements:** **InstantDB cloud (Postgres-backed) is the backend.** Not Supabase-compatible — InstantDB IS the database service.
6. **iOS Safari quirks:** None reported.
7. **Compound transactions:** Yes — `db.transact()` supports atomic multi-entity writes.
8. **Production case studies:** Some indie apps. Diwaker Gupta's friction log (cited in original prompt) flagged dev/prod env management, testing offline, and integration friction with non-blessed frameworks.
9. **Single-dev maintainability:** High for the happy path; testing-offline and multi-env are the friction points.
10. **Verdict for Disher fit:** **OUT.** Replacing Supabase to use InstantDB is a strictly larger lift than improving the current outbox.

### 11. ElectricSQL (post-pivot)

1. **URL:** https://electric-sql.com — https://github.com/electric-sql/electric
2. **Version + status:** `1.0.0-beta.1` (Dec 2024) and continuing in beta through 2026. Pivoted to **read-path-only sync** for Postgres (writes are your problem; pair with TanStack DB for writes).
3. **Core mechanism:** Postgres → client sync of "shapes" (subscribed query results) over HTTP long-polling streams. Powers a per-shape cached projection. **No write path** — writes go through your own API + optimistic update layer (TanStack DB is the canonical pairing).
4. **Bundle size:** Client `@electric-sql/client` ≈ 30KB gzipped. With PGlite (in-browser Postgres): adds ~3MB gzipped. Without PGlite: in-budget.
5. **Backend requirements:** Electric service in front of Postgres. Compatible with Supabase Postgres (Electric is used internally by Supabase per ElectricSQL blog).
6. **iOS Safari quirks:** **Long-polling sync mechanism criticized as slow/brittle by johnny.sh April 2026.** No fundamental iOS break, but UX degrades over flaky cell connections.
7. **Compound transactions:** Read-only sync — compound writes are entirely your responsibility (handled via TanStack DB or custom outbox).
8. **Production case studies:** Google, Supabase (internal), Trigger.dev, Otto, Doorboost (per Electric beta blog). Real production usage.
9. **Single-dev maintainability:** Concept is simple (subscribe to shapes). Operational reality is "you also need to design your write path", which doubles the surface.
10. **Verdict for Disher fit:** **MARGINAL — only with TanStack DB pairing.** Adds a service in front of Supabase for sync of read shapes; the write side is still outbox-shaped. Net win over plain TanStack Query + outbox is small for Disher's data volume (1200–15000 entries/year is well below "shape-streaming saves real bandwidth").

### 12. CR-SQLite (vlcn.io)

1. **URL:** https://vlcn.io — https://github.com/vlcn-io/cr-sqlite
2. **Version + status:** `0.16.3`, last published ~2 years ago (early 2024). **Stalled / inactive** as of April 2026.
3. **Core mechanism:** SQLite extension adding CRDT semantics to ordinary tables; multi-writer sync via change-set exchange.
4. **Bundle size:** WASM SQLite + extension ~600KB gzipped.
5. **Backend requirements:** Bring-your-own sync server (vlcn provided some, all stale).
6. **iOS Safari quirks:** WASM SQLite works; OPFS-dependent.
7. **Compound transactions:** SQLite-native, fully supported.
8. **Production case studies:** Demos. Nothing widely shipping in 2026.
9. **Single-dev maintainability:** Maintainer-inactive >12 months — automatic red flag.
10. **Verdict for Disher fit:** **OUT.** Inactive maintainer disqualifies for new projects.

### 13. WatermelonDB

1. **URL:** https://watermelondb.dev — https://github.com/Nozbe/WatermelonDB
2. **Version + status:** Active, RN-focused. Web build exists but is second-class.
3. **Core mechanism:** SQLite-based reactive DB designed for React Native; uses LokiJS-in-IndexedDB for web fallback.
4. **Bundle size:** ~150KB gzipped on web (LokiJS path).
5. **Backend requirements:** Bring-your-own (push/pull endpoints).
6. **iOS Safari quirks:** Web target uses LokiJS+IndexedDB. Works, but the project is primarily RN-focused; web is on the back burner.
7. **Compound transactions:** Yes (SQLite + database.write()).
8. **Production case studies:** Many on RN (Nozbe, Capacitor apps). Few PWA-specific.
9. **Single-dev maintainability:** Medium for RN. PWA-on-WatermelonDB is a less-trodden path.
10. **Verdict for Disher fit:** **OUT.** Disher is a PWA, not RN. Choosing an RN-first DB for a Safari-first PWA is wrong-tool/wrong-job.

### 14. Automerge / Automerge-Repo

1. **URL:** https://automerge.org — https://github.com/automerge/automerge-repo
2. **Version + status:** `automerge-repo@2.5.5` (April 2026). Stable; Automerge 2.0 core is production-ready.
3. **Core mechanism:** JSON-CRDT documents. Repo wraps the core lib with networking + storage adapters (IndexedDB persist, websocket+webrtc network).
4. **Bundle size:** ~120–160KB gzipped including WASM.
5. **Backend requirements:** Bring-your-own sync server (automerge-repo-sync-server reference impl exists). Not Supabase-shaped.
6. **iOS Safari quirks:** Works. WASM init time noticeable on cold start.
7. **Compound transactions:** Within a single document — fine. Cross-document atomicity — not guaranteed.
8. **Production case studies:** Ink & Switch's lab, some indie. Not consumer-mass-market.
9. **Single-dev maintainability:** **CRDT internals leak** when you hit a perf or merge edge case. High mental load.
10. **Verdict for Disher fit:** **OUT.** Disher's data is relational with FKs (schedule_food → product), not CRDT-friendly. Forcing it into Automerge documents loses Postgres-shaped query power.

### 15. Yjs + y-indexeddb + custom sync

1. **URL:** https://docs.yjs.dev — https://github.com/yjs/yjs — https://github.com/yjs/y-indexeddb
2. **Version + status:** Yjs is mature/stable. y-indexeddb `9.0.12` (Nov 2025).
3. **Core mechanism:** Y.Doc CRDTs in memory; y-indexeddb persists; you choose a network provider (y-websocket, y-webrtc, custom).
4. **Bundle size:** Yjs ~30KB + y-indexeddb ~10KB + provider varies = 50–70KB gzipped.
5. **Backend requirements:** BYO sync server.
6. **iOS Safari quirks:** None known. Works.
7. **Compound transactions:** Yjs transactions are within a doc; cross-doc is your problem.
8. **Production case studies:** Notion-clone-ish apps, collaborative editors, Tldraw earlier versions.
9. **Single-dev maintainability:** Same CRDT-leak problem as Automerge for non-text data.
10. **Verdict for Disher fit:** **OUT.** Same reason as Automerge — relational data with FKs is the wrong shape.

### 16. Evolu

1. **URL:** https://www.evolu.dev — https://github.com/evoluhq/evolu
2. **Version + status:** Active development, pre-1.0. Recently refactored away from Effect.
3. **Core mechanism:** SQLite (WASM) on client, Kysely query builder, end-to-end encrypted sync via owner-controlled relay servers. Uses RBSR (Range-Based Set Reconciliation).
4. **Bundle size:** ~400–600KB gzipped including SQLite WASM.
5. **Backend requirements:** Evolu relay server (reference impl provided, can self-host) — NOT Supabase-compatible. The whole point is sovereignty + encryption, server is dumb relay.
6. **iOS Safari quirks:** OPFS-backed; Safari 17+ ok.
7. **Compound transactions:** Yes (SQLite-native).
8. **Production case studies:** Indie apps. Author's blog posts thoughtful but no breakout commercial deployment.
9. **Single-dev maintainability:** Higher than average — schema migrations + encryption + sovereignty model.
10. **Verdict for Disher fit:** **OUT.** Bundle + custom relay backend incompatible with Supabase strategy. Interesting if Disher were a privacy-first app, which it isn't.

### 17. SyncedStore

1. **URL:** https://syncedstore.org — https://github.com/YousefED/SyncedStore
2. **Version + status:** `0.6.0`, ~2 years since last publish. **Stalled.**
3. **Core mechanism:** Plain-JS-objects API on top of Yjs.
4. **Bundle size:** Yjs + wrapper ≈ 60KB.
5. **Backend requirements:** Same as Yjs.
6. **iOS Safari quirks:** None.
7. **Compound transactions:** As Yjs.
8. **Production case studies:** Few public.
9. **Single-dev maintainability:** OK API; abandoned-project risk.
10. **Verdict for Disher fit:** **OUT.** Stalled + CRDT shape wrong for Disher.

### 18. TinyBase

1. **URL:** https://tinybase.org — https://github.com/tinyplex/tinybase
2. **Version + status:** Active, 6.x+ in 2026 (multiple releases per year). **Stable.**
3. **Core mechanism:** Reactive in-memory store with CRDT-capable persisters (SQLite, IndexedDB, browser storage), plus pluggable synchronizers (WebSocket, BroadcastChannel, custom).
4. **Bundle size:** ~5KB gzipped core. Tiny. **Best-in-class.**
5. **Backend requirements:** BYO synchronizer. Could write a Supabase one.
6. **iOS Safari quirks:** None.
7. **Compound transactions:** Yes (transaction API).
8. **Production case studies:** Some indie. Author markets it heavily; commercial-scale named users thin.
9. **Single-dev maintainability:** High — small surface, excellent docs.
10. **Verdict for Disher fit:** **MARGINAL.** Bundle is great, but you'd write the Supabase synchronizer yourself — that's the same lift as a custom outbox. Provides reactive store as a bonus over TanStack Query, but Disher already has TanStack Query + reactive primitives.

### 19. SignalDB

1. **URL:** https://signaldb.js.org — https://github.com/maxnowack/signaldb
2. **Version + status:** Active in 2026. Pre-1.0, but releases steady.
3. **Core mechanism:** Reactive collections (signals-based), pluggable persistence, SyncManager class for incremental sync via `updatedAt`. Mongo-shaped query API.
4. **Bundle size:** ~30–50KB gzipped (estimate, no fresh measurement).
5. **Backend requirements:** BYO sync handler — well-documented Supabase pattern in their docs.
6. **iOS Safari quirks:** None known.
7. **Compound transactions:** App-level (no first-class atomic multi-collection).
8. **Production case studies:** Few public. smallstack project mentioned in 2026 blog posts.
9. **Single-dev maintainability:** Good — Mongo-style API is familiar.
10. **Verdict for Disher fit:** **MARGINAL.** Plausible, but no production case at Disher's scale. Not strictly better than TanStack DB for the same effort.

### 20. Liveblocks (offline angle)

1. **URL:** https://liveblocks.io — https://github.com/liveblocks/liveblocks
2. **Version + status:** Stable, commercial. February 2026 they open-sourced sync engine + dev server.
3. **Core mechanism:** Real-time multiplayer rooms with Yjs/Storage docs. Built-in offline support: edits queued, sync on reconnect.
4. **Bundle size:** ~80KB gzipped client.
5. **Backend requirements:** Liveblocks Cloud (managed) or self-host (newly open). Storage is Liveblocks-shaped, NOT Postgres tables.
6. **iOS Safari quirks:** None reported.
7. **Compound transactions:** Within a Storage doc.
8. **Production case studies:** Many — Linear (presence), Vercel comments, Notion-likes.
9. **Single-dev maintainability:** High for collaboration features; over-fit for single-user apps.
10. **Verdict for Disher fit:** **OUT.** Designed for collaboration; Disher is single-user. Wrong tool.

### 21. ConvexDB

1. **URL:** https://convex.dev — https://github.com/get-convex/convex-backend
2. **Version + status:** Stable, commercial.
3. **Core mechanism:** Reactive serverless DB; client subscribes to queries; mutations are server functions. **Offline support is partial** — Convex docs explicitly say "no full offline sync mechanism, exploring the space."
4. **Bundle size:** ~80KB gzipped client.
5. **Backend requirements:** Convex Cloud or self-hosted. Not Supabase.
6. **iOS Safari quirks:** None known.
7. **Compound transactions:** Yes — server functions are atomic.
8. **Production case studies:** Many production apps (Convex has strong adoption).
9. **Single-dev maintainability:** High — docs and DX are top-tier.
10. **Verdict for Disher fit:** **OUT.** Replacing Supabase with Convex is too large a pivot AND offline story is not yet first-class.

### 22. Firebase Firestore (offline)

1. **URL:** https://firebase.google.com/docs/firestore
2. **Version + status:** Stable, mature.
3. **Core mechanism:** NoSQL document store; client SDK with `enableIndexedDbPersistence()` for offline cache + queue.
4. **Bundle size:** **~250–400KB gzipped** for the modular SDK with Firestore. Over Disher's budget.
5. **Backend requirements:** Firebase project. Not Supabase.
6. **iOS Safari quirks:** Persistence works; Safari private mode disables IndexedDB (acceptable trade).
7. **Compound transactions:** Yes (`db.runTransaction()`, batched writes ≤500 ops).
8. **Production case studies:** Tens of thousands of apps.
9. **Single-dev maintainability:** High — biggest vendor docs surface in this space.
10. **Verdict for Disher fit:** **OUT.** Bundle + non-Supabase + NoSQL ≠ Disher's relational schema.

### 23. Appwrite (offline)

1. **URL:** https://appwrite.io — https://github.com/appwrite/appwrite
2. **Version + status:** Stable, active.
3. **Core mechanism:** No native offline-first engine. Official path: pair with RxDB via the `replication-appwrite` plugin.
4. **Bundle size:** Appwrite client ~50KB; with RxDB another ~150KB.
5. **Backend requirements:** Appwrite. Not Supabase.
6. **iOS Safari quirks:** None known.
7. **Compound transactions:** No native cross-collection.
8. **Production case studies:** Many on Appwrite generally; offline-first specifically smaller N.
9. **Single-dev maintainability:** Medium.
10. **Verdict for Disher fit:** **OUT.** Wrong backend.

### 24. Hasura (offline patterns)

1. **URL:** https://hasura.io
2. **Version + status:** Hasura DDN stable; **no native offline sync engine**, only patterns (RxDB + Hasura tutorial).
3. **Core mechanism:** GraphQL over Postgres + RxDB on client.
4. **Bundle size:** Same as RxDB.
5. **Backend requirements:** Hasura + Postgres. Could front Supabase Postgres but adds a layer.
6. **iOS Safari quirks:** None.
7. **Compound transactions:** GraphQL mutations + RxDB local.
8. **Production case studies:** Hasura general adoption is strong; offline-first specifically is a documented pattern, not a product.
9. **Single-dev maintainability:** Medium.
10. **Verdict for Disher fit:** **OUT.** Adds Hasura layer over Supabase for no offline-specific benefit beyond RxDB-direct.

### 25. PGlite (as a primitive)

1. **URL:** https://pglite.dev — https://github.com/electric-sql/pglite
2. **Version + status:** v0.4 (March 2026). 13M+ weekly downloads across packages. **Production-quality primitive**, but not a sync engine on its own.
3. **Core mechanism:** Postgres compiled to WASM; runs in-browser/Node. Pair with ElectricSQL or custom sync for actual sync.
4. **Bundle size:** **~3MB gzipped WASM.** Way over Disher's budget.
5. **Backend requirements:** N/A as a primitive.
6. **iOS Safari quirks:** Works on iOS but cold-start latency real.
7. **Compound transactions:** Native Postgres txns.
8. **Production case studies:** Many integrations (Supabase Studio AI, Trigger.dev).
9. **Single-dev maintainability:** Pure Postgres knowledge.
10. **Verdict for Disher fit:** **OUT** as the storage layer (bundle), but **interesting as backend dev tooling**.

---

## Section 2 — Server-First Hybrid Approaches

### 26. TanStack Query + custom outbox (current Disher approach)

1. **URL:** https://tanstack.com/query — Disher's `pendingWrites.ts`
2. **Version + status:** Production. Disher's code, audited 2026-04-28.
3. **Core mechanism:** Server-authoritative. Queries hit Supabase REST; mutations enqueued to IndexedDB outbox; drain on reconnect with classifier + MAX_ATTEMPTS + APP_VERSION buster.
4. **Bundle size:** TanStack Query ~13KB gzipped + outbox code ~3KB. **Best-in-class small.**
5. **Backend requirements:** Supabase. Already wired.
6. **iOS Safari quirks:** Already debugged (Plan B `/api/sb/*` proxy for H2 bug #284946).
7. **Compound transactions:** App-level sequencing (works for Disher's flows; createDish is the only multi-row case).
8. **Production case studies:** Disher itself, plus thousands of apps using this pattern.
9. **Single-dev maintainability:** **Highest** — every line is owned by you, no abstraction debugging.
10. **Verdict for Disher fit:** **THIS IS THE BASELINE.** Anything else must beat this on a measurable axis.

### 27. TanStack DB on top of TanStack Query (no Realtime)

Already covered in #2 above. Notable as the natural upgrade path: keep Supabase REST for sync, swap the outbox for `@tanstack/offline-transactions`, get the reactive store as a bonus.

### 28. Supabase Realtime + local cache

1. **Version + status:** Realtime is stable. "Local cache" implies you write the offline layer yourself.
2. **Core mechanism:** Subscribe to Postgres changes via Realtime; merge into local cache (TanStack Query, IDB, etc.); mutations go via REST + your own outbox.
3. **Bundle size:** `@supabase/supabase-js` ~70KB + your code.
4. **Verdict for Disher fit:** Realtime adds live-update bandwidth not used by single-user app. **Marginal — only useful if multi-device live sync becomes required.**

### 29. Replicache + Postgres CDC

Replicache itself is in maintenance mode (#7). Skip.

---

## Section 3 — Comparison Table

| Stack                                | Version (Apr 2026)         | Bundle (gz, web)        | Maturity         | Supabase fit                  | iOS Safari fit              | Shortlist?           |
| ------------------------------------ | -------------------------- | ----------------------- | ---------------- | ----------------------------- | --------------------------- | -------------------- |
| LiveStore                            | 0.4.0-dev.22               | ~500KB+ (WASM)          | Beta             | Custom adapter only           | OK (OPFS)                   | No                   |
| TanStack DB                          | 0.6.5                      | ~50–70KB                | Beta, road to 1  | Excellent                     | Excellent                   | **YES**              |
| RxDB                                 | 17.1.0                     | ~60–200KB               | Stable           | First-party plugin            | Good                        | **YES (cap)**        |
| Dexie + Dexie Cloud                  | 4.4 / 4.4.7                | ~50KB                   | Stable           | NO (own backend)              | Excellent                   | No (backend)         |
| Triplit                              | community-maint            | ~100KB                  | Limbo            | NO                            | OK                          | No                   |
| Zero (rocicorp)                      | **1.4 GA**                 | ~100–140KB              | **Stable**       | Yes w/ direct PG conn         | OK (WS)                     | **YES (caveat)**     |
| Replicache                           | 15.3.0                     | ~70KB                   | Maintenance      | DIY                           | OK                          | No                   |
| PowerSync                            | stable                     | ~250–350KB              | Stable           | Yes w/ Session Pooler         | OK (WS only on iOS)         | No (re-confirmed)    |
| Jazz                                 | v2 alpha                   | ~150KB                  | Alpha            | NO                            | OK                          | No                   |
| InstantDB                            | stable                     | ~80–110KB               | Stable           | NO (own backend)              | OK                          | No                   |
| ElectricSQL                          | 1.0.0-beta.x               | ~30KB (no PGlite)       | Beta             | Yes (read-only sync)          | OK (long-poll slow)         | Marginal             |
| CR-SQLite (vlcn)                     | 0.16.3 (stale)             | ~600KB                  | Inactive         | DIY                           | OK                          | No                   |
| WatermelonDB                         | active                     | ~150KB                  | Stable           | DIY                           | RN-first                    | No                   |
| Automerge / automerge-repo           | 2.5.5                      | ~120–160KB              | Stable           | DIY                           | OK                          | No (CRDT mismatch)   |
| Yjs + y-indexeddb                    | y-idb 9.0.12               | ~50–70KB                | Stable           | DIY                           | Excellent                   | No (CRDT mismatch)   |
| Evolu                                | pre-1                      | ~400–600KB              | Beta             | NO                            | OK                          | No                   |
| SyncedStore                          | 0.6.0 stale                | ~60KB                   | Stalled          | DIY                           | OK                          | No                   |
| TinyBase                             | 6.x                        | **~5KB**                | Stable           | DIY                           | Excellent                   | Marginal             |
| SignalDB                             | pre-1, active              | ~30–50KB                | Active           | DIY (docs ok)                 | OK                          | Marginal             |
| Liveblocks                           | stable                     | ~80KB                   | Stable           | NO (own backend)              | Good                        | No (collab focus)    |
| ConvexDB                             | stable                     | ~80KB                   | Stable           | NO                            | OK                          | No                   |
| Firebase Firestore                   | stable                     | ~250–400KB              | Stable           | NO                            | Good                        | No                   |
| Appwrite                             | stable                     | ~50KB+RxDB              | Stable           | NO                            | OK                          | No                   |
| Hasura (RxDB pattern)                | DDN stable                 | RxDB-equiv              | Stable           | Adds layer                    | OK                          | No                   |
| PGlite                               | 0.4                        | ~3MB                    | Stable primitive | n/a                           | OK                          | No                   |
| **TanStack Query + custom outbox**   | **current Disher**         | **~16KB (Q+outbox)**    | **Production**   | **Native**                    | **Already debugged**        | **BASELINE**         |
| Supabase Realtime + local cache      | stable                     | ~70KB+code              | Stable           | Native                        | OK                          | Marginal             |

---

## Section 4 — Final Shortlist

Stacks that pass ALL gates:
- Stable 1.0+ OR pre-1.0 with public roadmap
- Bundle ≤200KB gzipped
- Compatible with Supabase Postgres backend (or trivial custom)
- ≥1 production case study or clear path to one
- Single-developer maintainable

| # | Stack | Why on shortlist |
|---|-------|------------------|
| 1 | **TanStack Query + custom outbox (Disher current)** | The baseline. Smallest bundle, fully owned, already shipping, maintainability ceiling. |
| 2 | **TanStack DB 0.6 + @tanstack/offline-transactions** | Natural upgrade — same conceptual model as the current outbox, with reactive store and battle-tested retry/leader/quota primitives. Pre-1.0 is the only blemish; Tanner Linsley's backing + ElectricSQL adoption mitigate it. |
| 3 | **RxDB 17 + replication-supabase** | Mature, first-party Supabase plugin, reactive. Bundle is at the cap, premium-plugin upsell mild. Best fit if Disher wants opinionated reactivity without writing the sync layer. |
| 4 | **Zero 1.4 (rocicorp)** — *with caveat* | Now GA, mutator model is excellent, johnny.sh April 2026 first-hand pick. **Caveat**: requires running `zero-cache` as a third deployable; Supabase free tier + zero-cache wants a direct PG connection (same gotcha as PowerSync). For a single-user food tracker, the operational tax is hard to justify over outbox. |

That's 4 stacks. I deliberately did not pad to 5.

---

## Section 5 — Promising-But-Failed-A-Gate

| Stack | Failed gate | Notes |
|-------|-------------|-------|
| LiveStore | Bundle size + pre-1.0 + JWT.sub bug at 0.4-dev | Excellent for the right shape (lots of per-user data, cross-user shared minimal). Wrong shape for Disher. |
| Triplit | Maintainer status (community-maint after Supabase acqui-hire) | Watch for a future Supabase-native offline product; possibly a 2027 reconsider. |
| ElectricSQL | Marginal benefit + long-poll concern | Read-path-only model means you still ship an outbox; net win small. |
| TinyBase | No Supabase production case study at scale | Bundle is amazing (~5KB) but you write the synchronizer yourself — same effort as outbox. |
| SignalDB | No production case study at Disher's scale | Active, plausible, but unproven. |
| Dexie Cloud | Backend incompatibility (not Supabase) | Plain Dexie remains a fine IDB primitive if you want a thinner KV store than `idb-keyval`. |

---

## Section 6 — Honest Verdict

**For a single-user PWA food tracker on Supabase Postgres + Node sidecar, with 1200–15000 entries/year and "days" offline SLO: none of the surveyed event-sourcing or local-first stacks is significantly better than the current TanStack Query + custom outbox approach.**

Three real candidates rise above noise:

1. **TanStack DB + offline-transactions** — incremental, low-risk swap of the outbox layer for a battle-tested implementation. Adds reactivity. Same conceptual model. **This is the only stack I'd actually consider migrating to in 2026** if the goal is "less code I maintain personally."
2. **RxDB 17** — heavier, opinionated, but mature. Choose if you want the reactive store + Supabase-replication-out-of-the-box and accept ~150–200KB bundle.
3. **Zero 1.4** — technically superior sync model (custom mutators, SQLite-replica), but the operational tax (running zero-cache) is disproportionate for Disher's scale. Re-evaluate if the app grows multi-user collaboration features.

Everything else either: is in the wrong shape (CRDT-on-relational-data), targets a different backend (replacing Supabase costs more than the gain), or is too immature/inactive for a production app in 2026.

The current outbox is **architecturally validated** (matches TanStack DB's industry pattern) and **better in some respects** (classifier, MAX_ATTEMPTS, APP_VERSION buster). The Tier-1 simplification plan (entityCache + coalesce + batch RPC + storage probe) is a more leveraged use of dev time than a wholesale stack swap.

**Recommendation, if forced to pick one upgrade path:** Tier-1 simplifications first. THEN, if outbox maintenance becomes painful, port to `@tanstack/offline-transactions` once it ships its 1.0.

---

## Sources

Primary references consulted (April 29, 2026):
- LiveStore docs/releases — https://docs.livestore.dev/, https://github.com/livestorejs/livestore/releases
- TanStack DB blog 0.6 — https://tanstack.com/blog/tanstack-db-0.6-app-ready-with-persistence-and-includes
- @tanstack/offline-transactions — https://www.npmjs.com/package/@tanstack/offline-transactions
- Zero release notes — https://zero.rocicorp.dev/docs/release-notes (Zero 1.0 stable, 1.4 current)
- Zero deployment — https://zero.rocicorp.dev/docs/deployment
- RxDB 17 release — https://rxdb.info/releases/17.0.0.html
- RxDB Supabase plugin — https://rxdb.info/replication-supabase.html
- Dexie 4.4 / Dexie Cloud 3.0 — https://medium.com/dexie-js/dexie-4-4-dexie-cloud-server-3-0-the-big-one-d883b98599e8
- Triplit joins Supabase — https://supabase.com/blog/triplit-joins-supabase
- johnny.sh "Choosing a Sync Engine in 2026" — https://johnny.sh/blog/choosing-a-sync-engine-in-2026/
- marmelab Zero review — https://marmelab.com/blog/2025/02/28/zero-sync-engine.html
- ElectricSQL beta — https://electric-sql.com/blog/2024/12/10/electric-beta-release
- ElectricSQL × TanStack DB 0.6 — https://electric-sql.com/blog/2026/03/25/tanstack-db-0.6-app-ready-with-persistence-and-includes
- PGlite v0.4 — https://electric-sql.com/blog/2026/03/25/announcing-pglite-v04
- Automerge-repo — https://github.com/automerge/automerge-repo/releases
- y-indexeddb — https://github.com/yjs/y-indexeddb/releases
- TinyBase — https://tinybase.org/
- SignalDB — https://signaldb.js.org/
- Liveblocks Feb 2026 OSS — https://liveblocks.io/blog/open-sourcing-the-liveblocks-sync-engine-and-dev-server
- Replicache maintenance mode — https://replicache.dev/
- Diwaker Gupta InstantDB friction log — https://diwaker.io/friction-log-instantdb/
- Convex object sync — https://stack.convex.dev/object-sync-engine
- iOS Safari PWA capabilities 2026 — https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide
- FOSDEM 2026 Local-First track — https://fosdem.org/2026/schedule/track/local-first/
