# Disher — Project Specification

Shared reference for `food-calc` (frontend) and `disher-backend-3.0` (backend).

---

## Architecture Overview

| Layer | Stack |
|---|---|
| Frontend | React + TypeScript + Vite, Feature-Sliced Design |
| Backend | Fastify (API server) + Triplit (sync server) |
| Database | Triplit — offline-first, real-time sync via IndexedDB (client) / SQLite (server) |
| Auth | JWT — `sub` claim maps to `userId`; anonymous via `x-triplit-token-type: anon` |

### Ports (local dev)

| Service | Port |
|---|---|
| Frontend (Vite) | 3000 |
| Triplit sync server | 6543 / 6544 |
| Fastify API | 3100 |

---

## Data Model

### `userId` conventions

| Value | Meaning |
|---|---|
| `"__system__"` | Immutable reference data (foods, dailyNorms, etc.) — read-only for all users |
| `<uuid>` | User-owned record |

### Storage split

Static USDA data and user data are separated across two client-side stores:

| Collection | Storage | Who writes |
|---|---|---|
| `nutrients` (~150 rows, static) | Triplit (IndexedDB) | Triplit sync |
| `foods` — USDA (~9K, static) | Triplit (IndexedDB) | Triplit sync |
| `foods` — user-created | Triplit (IndexedDB) | Triplit sync |
| `foodPortions` (static) | Triplit (IndexedDB) | Triplit sync |
| `foodNutrients` — USDA (~450K, static) | **Dexie (IndexedDB)** | HTTP bulk load |
| `foodNutrients` — user-created (`userId != "__system__"`) | Triplit (IndexedDB) | Triplit sync (user insert/update/delete) |
| `dailyNorms`, `dailyNormItems` | Triplit (IndexedDB) | Triplit sync |
| `dishes`, `dishItems` | Triplit (IndexedDB) | Triplit sync |
| `scheduleFoods`, `scheduleEvents` | Triplit (IndexedDB) | Triplit sync |

**Why the split?**  450K `foodNutrients` rows are too large for WebSocket sync. HTTP ndjson stream → `Dexie.bulkPut()` is orders of magnitude faster for bulk static data. User-created `foodNutrients` stay in Triplit for real-time sync.

**Routing rule:** Nutrients are read from **both** sources and merged:
- System (USDA) nutrients → Dexie (`disher-reference` IndexedDB)
- User-created nutrients (`userId != "__system__"`) → Triplit (real-time sync)

Dexie results take precedence. Triplit fills in for foodIds not found in Dexie.
Implemented in `useNutrientsByFoodIds()` and `useProductNutrients()` ([`food-calc/src/entities/product/api/queries.ts`](food-calc/src/entities/product/api/queries.ts)).

**Dexie database:** `"disher-reference"`, table `foodNutrients { id, foodId, nutrientId, quantity }`.
Client: [`food-calc/src/api/dexie/client.ts`](food-calc/src/api/dexie/client.ts).

### Triplit system collections (synced on startup)

`nutrients`, `foods`, `foodPortions`, `dailyNorms`, `dailyNormItems`

(`foodNutrients` is **not** in this list — USDA nutrients are loaded separately via HTTP into Dexie.)

---

## Triplit Internal Storage Format

> ⚠️ Triplit does not expose aggregate queries (COUNT, SUM). Both the frontend
> and backend work around this by reading storage directly. The sections below
> document the assumed format and list the test files that guard it.
>
> **Pinned version: `@triplit/client ^1.0.50`**
> If counts silently return 0 after a Triplit upgrade, start here.

### Server — SQLite (`disher-backend-3.0`)

Triplit stores data in `triplit/.data/sqlite/app.db`, table `data`:

| Column | Type | Example |
|---|---|---|
| `key` | TEXT (primary key) | `fdata\x01f foods\x01<id>` |
| `value` | TEXT (JSON) | `{"userId":"__system__","name":"Apple",...}` |

**Key format:** `fdata\x01f<collection>\x01<id>`

To count system records in a collection:
```sql
SELECT COUNT(*) FROM data
WHERE key >= 'fdata\x01f<collection>\x01'
  AND key <  'fdata\x01f<collection>\x01\xFF'
  AND json_extract(value, '$.userId') = '__system__'
```

**Implementation:** [`src/api/routes/system.ts`](disher-backend-3.0/src/api/routes/system.ts) → `querySystemCounts(db)`
**Tests:** [`src/api/routes/system.test.ts`](disher-backend-3.0/src/api/routes/system.test.ts)

---

### Client — IndexedDB (`food-calc`)

Two IndexedDB databases on the client:

**`"triplit"`** — managed by Triplit, object store `"triplit"`:

| IDB key (tuple) | Value |
|---|---|
| `["data", collection, id]` | record object |

**`"disher-reference"`** — managed by Dexie, table `foodNutrients`:

| Field | Type |
|---|---|
| `id` | string (primary key) |
| `foodId` | string (indexed) |
| `nutrientId` | string (indexed) |
| `quantity` | number |

**Implementation:** [`src/api/dexie/client.ts`](food-calc/src/api/dexie/client.ts)

---

### Upgrade checklist

When upgrading `@triplit/client` / `@triplit/cli`:

- [ ] Run `npm test` in `disher-backend-3.0` — verifies SQLite key prefix format
- [ ] Run `npm test` in `food-calc` — verifies IDB tuple key format
- [ ] Check `@triplit/db/dist/entity-store.js` line with `new EntityDataStore(...)` — prefix must still be `["data"]`
- [ ] Check `@triplit/db/dist/kv-store/storage/indexed-db.js` — `storeName` must still be `"triplit"`
- [ ] Check `disher-backend-3.0` SQLite key format by opening `app.db` and inspecting a few keys with `SELECT key FROM data LIMIT 5`

---

## API: `/api/system/version`

`GET http://localhost:3100/api/system/version`

Returns a single version number (sum of all system collection counts). Used by the frontend at startup to decide whether a sync is needed.

**Response:**
```json
{ "version": 936015 }
```

Cheap: one SQLite `COUNT` per collection. Stored in `localStorage["reference_data_version"]` after a successful sync.

**Implementation:** [`src/api/routes/system.ts`](disher-backend-3.0/src/api/routes/system.ts) → `querySystemCounts(db)`

---

## API: `/api/system/export/food-nutrients`

`GET http://localhost:3100/api/system/export/food-nutrients`

Streams all USDA `foodNutrients` as ndjson. Used during initial sync to bulk-load into Dexie.

**Response:** one JSON object per line:
```
{"id":"...","foodId":"...","nutrientId":"...","quantity":1.5}
```

**Implementation:** [`src/api/routes/system.ts`](disher-backend-3.0/src/api/routes/system.ts)

---

## API: `/api/system/counts`

`GET http://localhost:3100/api/system/counts`

Returns per-collection counts. Used only by [`SystemPage`](food-calc/src/pages/settings/SystemPage/SystemPage.tsx) for the debug data table (local vs server comparison). Not used in the startup sync flow.

**Implementation:** [`src/api/routes/system.ts`](disher-backend-3.0/src/api/routes/system.ts)

---

## Sync Flow

**Implementation:** [`food-calc/src/api/triplit/session.ts`](food-calc/src/api/triplit/session.ts) → `initSession()`

### Anon mode (first launch / version mismatch)

1. `GET /api/system/version` → number `N`
2. Compare with `localStorage["reference_data_version"]`
3. Match → already synced, done (no connection)
4. Mismatch → `triplit.startSession(ANON_TOKEN)`, then **in parallel**:
   - Triplit sync: `waitForCollection()` × 5 (`nutrients`, `foods`, `foodPortions`, `dailyNorms`, `dailyNormItems`)
   - Dexie sync: `GET /api/system/export/food-nutrients` → `referenceDb.foodNutrients.bulkPut()` in batches of 2 000
5. Save `N` to localStorage, `triplit.endSession()` — no persistent connection

### Anon mode (repeat launch, version match)

All data is local. No network requests after the version check.

### Anon mode (server unreachable)

- Local version exists → use cached data (offline)
- No local version → offline, no data

### User mode (JWT in localStorage)

`triplit.startSession(token)` — stays connected for real-time sync of user data.

---

## Triplit Quirks & Pitfalls

> These are non-obvious Triplit behaviors discovered through debugging.
> Check this section before writing new queries.

### 1. `S.Id()` is special — cannot filter by `"id"` in offline/local mode

`Where("id", "in", [...])` returns 0 results when Triplit is disconnected or operating from the local cache. The `id` field (`S.Id()`) is internal metadata, not a regular column. Triplit may not index it the same way as user-defined fields in offline mode.

**Workaround:** Use `useEntity()` for single lookups, or add a separate indexed field (e.g. `externalId`) if you need batch filtering. For batch lookups of related data, prefer going through the data you need directly (e.g. query `foodNutrients` by `foodId` instead of fetching `foods` first).

### 2. `.Include()` relationships may be empty offline

Triplit relationships (`.Include("food")`) rely on the related entity being present in the local cache. If the related collection was never synced or was cleared, the relationship resolves to `null`/`undefined` silently — no error, no warning.

**Workaround:** Always null-check relationship results. If a relationship is critical, add a `console.warn` when it resolves to null for a non-null foreign key.

### 3. `onRemoteFulfilled` ≠ IDB write complete

`onRemoteFulfilled` fires when Triplit's in-memory state is updated, but IndexedDB writes are batched asynchronously. Counting IDB records immediately after `onRemoteFulfilled` or `endSession()` may return stale counts.

**Workaround:** Don't verify sync by counting IDB. Use the version number from `/api/system/version` as the authoritative sync signal.

### 4. WebSocket sync is wrong for bulk static data

450K+ rows of `foodNutrients` over WebSocket causes long first-load times and UI jank. HTTP ndjson stream → `Dexie.bulkPut()` is orders of magnitude faster.

**Rule:** Static reference data > 10K rows should be loaded via HTTP bulk, not Triplit sync.
