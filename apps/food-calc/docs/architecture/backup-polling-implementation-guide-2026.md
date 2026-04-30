# Backup-Polling Implementation Guide for Disher

**Дата:** 2026-04-29
**Статус:** research complete, decision pending
**Источник:** synthesis of 5 research tracks (A/B/C/D/E)
**Контекст:** альтернатива текущему server-first outbox stack (`pendingWrites` + Supabase REST + TanStack Query persist)

---

## 1. Executive Summary

**Рекомендуемый стек:** Dexie 4.4.2 (local source of truth) + Hono 4.12 endpoint в существующем Node sidecar + Supabase JWKS validation + push-only `POST /backup` с `(id, edit_count, client_modified_at)` LWW и Notesnook-style timestamp guard на клиенте. Server-first outbox удаляется (`pendingWrites.ts`, `SyncProvider.tsx`, `PendingWritesBadge`); локальная БД становится истиной, бэкенд — durability layer, не sync engine.

**Net LOC impact:** −230 (новых ~200, удалённых ~430). Соответствует Tier-1 simplification ethos. См. track-c §"LOC budget".

**3 крупнейших риска (все требуют real-device validation в PoC):**
1. **iOS H2 pool poisoning** на backup endpoint (WebKit Bug #284946, см. user memory `project_ios_fetch_hang_2026_04_28.md`). Mitigation — HTTP/1.1 only / `/api/sb/*` proxy passthrough.
2. **iOS sendBeacon reliability** при aggressive home-button — единственный «push при tab close» примитив; iOS PWA `visibilitychange` quirks untested на real device.
3. **`Version.upgrade()` latency** на 30-day dataset на iPhone 12 — потенциально несколько секунд при первом open после schema bump.

**PoC обязателен:** все технические answers зафиксированы в research'е (16/16 corner cases имеют verdict, 4 prior-art apps глубоко разобраны), но 6 рисков требуют empirical validation на реальном iPhone (cite track-d §"Ключевые риски"). 2-day spike на ветке `experiment/backup-polling-products`.

**Решение юзера** (одна фраза, ставится в memory после прочтения этого doc):
- «делаю PoC backup-polling» → переходим к фазе 4.8 плана.
- «остаюсь на outbox» → research зафиксирован как контекст, никаких изменений.
- «копаем глубже X» → дополнительный фокус research'а.

---

## 2. Production Prior Art

5 приложений с похожей backup-polling-like архитектурой, distilled из track-a (verified file:line citations).

- **Notesnook** (`track-a §1`): `synced: bool` per row вместо timestamp comparison (`notesnook_collector.ts:65,87-88`); **timestamp-guard на clearing dirty flag** (`notesnook_collector.ts:79-90` — `WHERE dateModified <= pushTimestamp`); 60s conflict threshold (`notesnook_merger.ts:33`); debounce 100ms (hot) / 1000ms (cold) (`notesnook_auto-sync.ts:77-87`); migration on pull triggers re-sync (`notesnook_sync_index.ts:640`). **Загoss-bearing для нас** — каждый из этих паттернов копируем 1:1.
- **Standard Notes** (`track-a §2`): single endpoint `POST /sync` принимает batch + возвращает `{savedItems, conflicts, syncToken}` с per-row partial success (`sn_SyncItems.ts:104-114`, `sn_SaveItems.ts:36-37`); `+1µs` collision avoidance в sync-token (`sn_SaveItems.ts:217-233`); rule chain pattern для validation (`sn_ItemSaveValidator.ts:6-25`). **Шаблон для нашего `POST /backup`.** **Не копируем** strict `difference === 0` — это E2E rationale, у Disher LWW лучше.
- **Joplin** (`track-a §3`): three-phase sync (DELETE_REMOTE → UPLOAD → DELTA); EXCLUSIVE lock на schema upgrade (`joplin_Synchronizer.ts:521-553`); `processingPathTwice` safety check против infinite loops (`:622-643`); fail-safe flag (`:905`). **Recovery flow самый багогенный** — 3 closed issues (#4919, #9023, #8660) **все на одном code path** «Delete & re-download». Урок: never auto-wipe, всегда explicit confirm + fail-safe ON + idempotent + detectable end state.
- **CloudSyncSession (Apple, Ryan Ashcraft)** (`track-a §4`): error classification middleware (`css_ErrorMiddleware.swift:48-228`) — halt/retry/changeTokenReset/split/resolveConflict/createZone (богаче нашего poison-classifier на `halt|retry`). SplittingMiddleware с runtime adaptive batching (split-on-413). REFUTED v1 hypothesis: использует CloudKit `CKServerChangeToken`, **не** client-side `edit_count` (но FoodNoms-app поверх него — да, см. §3 ниже).
- **Apple HealthKit** (`track-e adjacent`): `(HKMetadataSyncIdentifier, HKMetadataSyncVersion)` per sample — Apple-grade подтверждение `(id, edit_count)` pattern.

---

## 3. Apps в нашей категории (Disher domain)

4 correlation/short-horizon trackers, distilled из track-e.

- **Bearable** (correlation tracker, native iOS+Android): single-device + encrypted cloud backup; Free tier = последние 30 дней correlations, Premium открывает 60/90/365. **Коммерческое подтверждение `project_short_distance_horizon.md`** — 30 дней оказались жизнеспособной маркетинговой и технической границей у app с 12k+ reviews / 4.7-4.8★. Multi-device НЕ работает (data conflict + data loss); их support page прямо это признаёт. **Что украсть:** «encrypted backup ≠ sync» как валидный продуктовый компромисс. **Что НЕ копировать:** logout-forces-restore, скрытие multi-device limitations.
- **Daylio** (mood tracker, Habitics): pure local SQLite + manual backup в Google Drive / iCloud. **Никакого автоматического sync вообще.** 4.8★ × 393k reviews — масштаб без cloud sync. **Что украсть:** `Version` field в backup file (schema migration). **Что НЕ копировать:** «just don't use multiple devices» как UX policy.
- **FoodNoms** (iOS/iPadOS/macOS, Ryan Ashcraft): local-first CoreData + CloudKit + опциональный Foodnoms Cloud (Supabase, май 2025). **Прямой precedent — sync engine `CloudSyncSession` в open source (MIT).** Ключевая находка: **edit_count counter > timestamp** для conflict resolver. Rationale: «iCloud-only poses long-term risk» — точно наш аргумент за свой backup endpoint поверх Supabase Auth. **Что украсть:** edit_count + UUID PK + tie-breaker strategy + persistent job queue + idempotent processing + SplittingMiddleware.
- **OpenNutriTracker** (Flutter, GPL-3.0, 1.8k stars): pure local Hive, «opt-in E2E sync» помечен на roadmap **1.5+ лет, не реализован**. Solo dev. Подтверждает что self-built sync — большая работа; backup-polling = выгодный компромисс.

**Cross-cutting findings:**
- **Никто из 4-х** не делает реальный multi-device sync без compromise. Disher с PWA backup-polling уже выше median по этому критерию.
- **Single-developer / two-person team apps доминируют** в нашей категории — complex sync engines не нужны для успеха.
- **MyFitnessPal/Cronometer (server-first гиганты)** регулярно теряют данные (MFP corruption mar-2024, Cronometer 3-day Google Fit break, MFP web/Android desync feb-2026). Local-first — реальная фича, не маркетинг.

---

## 4. Implementation Patterns

Distilled из track-b (~744 lines), все цитаты `track-b §B.X.Y`.

### 4.1 Local DB layer — Dexie 4.4

| Что | How | Cite |
|---|---|---|
| Schema migrations | `db.version(N).stores({...}).upgrade(tx => ...)` — chained, diff-based | track-b §B.1.1; `_inputs/dexie_version.ts:108-116` |
| Auto-stamping `_dirty`/`edit_count`/`client_modified_at` | `creating`/`updating`/`deleting` hooks; mutate `req.values[i]` напрямую | track-b §B.1.2; `_inputs/dexie_hooks-middleware.ts:38-69,99-141` |
| Reactive UI на 1200+ rows | `useLiveQuery(() => db.t.where('[user_id+date]').between(...).toArray(), [deps])` — index-bound | track-b §B.1.3; `_inputs/dexie_live-query.ts:90-99` |
| Compound indexes | `[user_id+date]` для schedule_*, `[user_id+_dirty]` для drain collector, `[dish_id+sort_order]` для dish_items | track-b §B.1.4 |
| Compound flow atomicity (createDish + dish_items × N) | `db.transaction('rw', tables, async () => ...)` — IndexedDB rollback на error. **Снимает текущее ограничение online-only для compound flows** | track-b §B.1.5 |
| Snapshot bulkPut обходит hooks | sentinel field `__server_apply` в hook handler | track-b §B.1.6 |

**Edge case:** auto-sync interval **must not be 0** — Notesnook баг-фикс. `client_modified_at === Date.now()` коллапсирует с pushTimestamp. Минимум 100ms debounce (`notesnook_auto-sync.ts:73-81`).

### 4.2 Push protocol

```
POST /backup
  body: { rows: [{ table, id, edit_count, client_modified_at, deleted_at, ...fields }, ...] }
  headers: X-Disher-Schema-Version: <N>
  response 200: {
    accepted: [{ id, server_received_at, server_edit_count }],
    rejected: [{ id, reason: 'stale_edit_count' | 'schema_mismatch' | 'auth_error', server_state? }]
  }
  response 422: { expected_version, current_version }    // schema mismatch — block drain
  response 413: <split-and-retry on client>
```

Server SQL (cite track-b §B.2.2 + §B.2.3):

```sql
INSERT INTO products (...) VALUES (...)
ON CONFLICT (id) DO UPDATE
  SET ..., server_received_at = now()
  WHERE
    -- Soft-delete sticky: delete всегда побеждает update
    (EXCLUDED.deleted_at IS NOT NULL AND products.deleted_at IS NULL)
    OR
    -- Иначе: edit_count → tie-breaker по client_modified_at
    (
      products.deleted_at IS NULL AND EXCLUDED.deleted_at IS NULL
      AND (
        EXCLUDED.edit_count > products.edit_count
        OR (EXCLUDED.edit_count = products.edit_count
            AND EXCLUDED.client_modified_at > products.client_modified_at)
      )
    );
```

**Идемпотентность** через `(id, edit_count, client_modified_at)` — без отдельного `idempotency_key` header (cite track-b §B.2.2; SN использует тот же подход в `sn_SaveItems.ts:55-65`).

**Per-table chunked push** (Notesnook pattern, `notesnook_collector.ts:61`): не мешать `products` и `schedule_foods` в одном payload — server validation легче, conflicts проще логировать.

**Auto-split on 413** (CSS pattern, `css_SplittingMiddleware.swift:1-25`, `css_SyncWork.swift:132-155`): default chunk = 500 rows; на server `payloadTooLarge` — `splitInHalf` рекурсивно.

**Compression** (track-b §B.2.6): `CompressionStream('gzip')` для payload > 50 KB. iOS Safari 16.4+, OK для target. 50 KB JSON Disher → ~8 KB gzipped.

**Server-stamped `received_at`** (track-b §B.2.4): возвращать в каждом accepted/rejected. Используется **только** для clock-skew telemetry (если `Math.abs(received_at - client_modified_at) > 5 min` → `diagLog('clock-skew-detected')`). **Никогда** не подменяет `client_modified_at` для conflict resolution — это ломает offline multi-day scenario (cite track-d §D.9; `joplin_Synchronizer.ts:669-672` «updated_time is set and managed by clients so it's always accurate»).

### 4.3 Scheduler

```
on mutation (Dexie hook fires):
  if HOT_TABLE (schedule_foods, schedule_events): debounce 100 ms
  else (products, dishes, daily_norms):           debounce 30 s
  on debounce expire: if navigator.onLine → drainPush()

on online event:               drainPush()
on visibilitychange (hidden):  navigator.sendBeacon('/backup', payload до 60 KB)
on visibilitychange (visible): drainPush()
on interval(1h):               drainPush()              // fallback
```

**Hot vs cold tables** (Notesnook pattern, `notesnook_auto-sync.ts:77-81`): юзер часто редактирует расписание (added → quantity tweak → time tweak за секунды); products/dishes — редко.

**Background Sync API:** **NOT supported on iOS Safari, ever** (`_inputs/web_apis_summary.md:6-13`). Workaround = `sendBeacon` на `visibilitychange → hidden` (64 KiB cap). `keepalive: true` имеет тот же 64 KiB cap (per origin) — не выигрываем.

**Page Lifecycle freeze/resume:** NOT in Safari (`web_apis_summary.md:16-22`). Используем **только** `visibilitychange` (reliable on iOS, `:54-60`).

**Multi-tab leader election** через `navigator.locks.request('disher-drain', {mode: 'exclusive'}, ...)` — iOS Safari 15.4+ baseline OK (`web_apis_summary.md:44-52`). Combined с timestamp guard — обе защиты комплементарны: lock гарантирует один tab пушит за раз; guard защищает от race in-flight push vs параллельная мутация.

**BroadcastChannel НЕ нужен** — Dexie liveQuery + global `storagemutated` event автоматически синхронизирует tabs через сам IDB. Overengineering.

### 4.4 Conflict UX

**Решение зафиксировано в плане §B.4:** auto-LWW, без UI окна «расхождение».

- **Server SQL:** edit_count primary, `client_modified_at` tie-breaker, soft-delete sticky (см. §4.2).
- **Client при apply server snapshot** (recovery / fresh install): `applyServerRow()` — если `local._dirty` → не перезаписываем; если `row.edit_count > local.edit_count` (или tie-breaker) → put. Локальные dirty rows никогда не теряются.
- **Conflict copy (Joplin-стиль) НЕ делаем** — single-user sequential, реальные конфликты ≈ never (юзер не редактирует «обед на прошлой неделе» с двух девайсов одновременно).
- **Recovery escape hatch** (см. §4.5) перекрывает потребность в conflict UI: если юзер чувствует «данные не те» — кнопка «Reset and resync» возвращает server state.

Cite: track-b §B.4; `notesnook_merger.ts:42-69` (pure LWW для structured rows); `joplin_Synchronizer.ts:651-708` (conflict copy — НЕ копируем); track-e CloudSyncSession + HealthKit (edit_count primary).

### 4.5 Recovery flow

- **Fresh install / eviction recovery:** `GET /backup/snapshot?since=null` → один JSON shot → `bulkPut`. **Estimated payload 30 days Disher** = ~125 KB JSON / ~20 KB gzipped (track-b §B.5.1). На iOS 3G uncompressed 1.25s, gzipped 0.2s. NDJSON streaming **не нужен** до multi-year backups.
- **Eviction detection** (track-b §B.5.2): `storageWritable` boot probe — `idbKeyval.set(probeKey) → get → del`. Если падает → recovery modal. Если `db.products.count() === 0 && server has data` → `pullSnapshot()`.
- **Partial corruption:** `Dexie.on('versionchange')` для multi-tab; `db.open().catch(VersionError)` → recovery modal. **Никогда auto-wipe.**
- **«Reset and resync» UI** (track-b §B.5.4 + Joplin issues lessons):
  - Explicit confirmation (type "RESET" to confirm input).
  - **Fail-safe ON по умолчанию:** перед wipe → `GET /backup/stats` → если `local count > server count + 10%` → abort + warning «Server has fewer rows than local. Are you sure?».
  - Idempotent: атомарный `db.delete()` + `db.open()` + chunked `bulkPut`. Прерывание на середине → повторный запуск безопасен.
  - Detectable end state: progress indicator + final toast «Restored N rows from cloud» или specific error. Никогда «syncing…» indefinitely.

Cite: `joplin_issues.md:21-29` (3 closed issues — все на этом code path, все 3 — silent loss / infinite loop / leaked storage).

### 4.6 Schema migration в условиях rolling 30-day window

| Migration type | Стратегия | Cite |
|---|---|---|
| **Add column** | Dexie `version(N).upgrade(...)` + `ALTER TABLE ADD COLUMN ... NULL` + server `COALESCE(EXCLUDED.col, products.col)` для partial payloads | track-b §B.6.1 |
| **Remove column** | Оставить колонку nullable & deprecated **минимум 30 дней** после релиза удаляющего клиента, потом `DROP COLUMN` | track-b §B.6.2 |
| **Rename column** | Dual-write обоих полей в transition window 30 дней; через 30 дней — drop old | track-b §B.6.3 |
| **Breaking change** | Drop-and-resync acceptable благодаря 30-day window. Bump APP_VERSION → wipe local → snapshot pull. Feature flag + staging week + changelog modal. | track-b §B.6.4 |

**Real-world frequency:** Joplin ~5-10 lifetime breaking migrations за ~10 лет; SN ~3-5 за 8 лет. **Disher migration cost ≈ 0 в типичный год.**

---

## 5. Stack of Choice

Distilled из track-c. Все версии verified в `_inputs/npm_versions.md` 2026-04-29.

| Concern | Pick | Reason |
|---|---|---|
| Local DB | **Dexie 4.4.2** | Zero runtime deps; gold standard; hooks + liveQuery + versioned upgrade встроены |
| React bindings | **dexie-react-hooks 4.4.0** | `useLiveQuery` с observability ranges (только релевантные mutations триггерят re-query) |
| Manual export (Phase 2) | **dexie-export-import 4.4.0** | Покрывает `project_manual_export_idea.md`; не блокер PoC |
| Server framework | **Hono 4.12.15** | Zero runtime deps; web-standard `Request`/`Response`; multi-runtime (Node/Bun/Deno/Workers) |
| Postgres | **Keep Supabase Postgres** | No migration cost в Phase 1; backup endpoint в существующем Node sidecar |
| Auth | **Keep Supabase Auth + JWKS validate в Hono через `jose`** | Lucia DEPRECATED; better-auth = 15 deps overkill; self-rolled JWT ломает auth-инвариант (`project_auth_invariant.md`); ~20 LOC через `jose.createRemoteJWKSet` |
| Query builder (Phase 1) | **Continue `@supabase/supabase-js` через service_role** | Zero migration; same pattern что во frontend |
| Query builder (Phase 2 если усложнится) | Drizzle ORM 0.45.2 | Type-safe; mainstream |
| Migration tool | **Continue raw SQL** в `supabase/migrations/` | Уже Disher pattern, не вводим drizzle-kit ради backup endpoint |
| Testing — unit | **Vitest + fake-indexeddb** | Расширение текущего setup |
| Testing — E2E | **Playwright + page.route** | Consistency с `project_e2e_supabase_mock.md` (14/14 pass chromium+webkit); MSW = overhead без выигрыша |
| Observability | Keep diag-logs (existing); defer Sentry/PostHog | Diag-logs покрывают текущий scope |

**Skip с явной причиной:** dexie-encrypted (E2E не в scope), dexie-relationships (TS типы покрывают), dexie-syncable (model mismatch — bidir sync, нам push-only), idb (Dexie ergonomics выигрывает), TinyBase (нет per-row index'ов над IDB), RxDB-без-replication (boilerplate), Drizzle+IDB (не существует first-party), Lucia (DEPRECATED), better-auth (overkill), Fastify (15 deps + Node-only), Elysia (Bun-first), Pino (`console.log` достаточно для PoC), MSW (`page.route` consistency).

**LOC budget breakdown (track-c):**

| Что | LOC |
|---|---|
| New: Dexie schema + version + hooks для `_dirty`/`client_modified_at`/`edit_count` | ~30 |
| New: Push module (`sendBeacon` + `visibilitychange` + interval + debounce + locks) | ~80 |
| New: Backup endpoint Hono handler с JWKS verify + LWW upsert | ~40 |
| New: Migration tests (Vitest + fake-indexeddb) | ~50 |
| New total | **~200** |
| Removed: `pendingWrites.ts` (outbox flat queue) | ~300 |
| Removed: `SyncProvider.tsx` boot logic | ~80 |
| Removed: `usePendingCount` + `PendingWritesBadge` | ~50 |
| Removed: optimistic patches in entity mutations (`setQueriesData` + `enqueue` + `invalidateQueries`) | ~50 (×N entities) |
| Removed total | **~430** |
| **Net** | **−230 LOC** |

**Point-of-failure delta:** удаляются 7 (outbox classifier, MAX_ATTEMPTS retry, schema-drift dropping by APP_VERSION, single-flight drain coordination, in-RAM mirror sync, online/visibilitychange re-drain triggers, anon→registered upgrade gating). Добавляются 2 (Dexie schema migration, clock skew handling). Net **−5**.

---

## 6. Corner Cases

16 cases distilled из track-d. Все имеют verdict до PoC.

| # | Question | Verdict | Status | Cite |
|---|---|---|---|---|
| D.1 | iOS Safari OPFS vs IDB | **IDB через Dexie 4.4.2** — нет ergonomic relational libs над OPFS в 2026; Disher data реляционная (FK через dish_items, schedule_foods); Notesnook/SN/Joplin тоже не на OPFS | resolved | track-d §D.1 |
| D.2 | iOS Background Sync API | **NOT supported, ever** (`web_apis_summary.md:6-13`); workaround = `visibilitychange + sendBeacon` (64 KiB cap) | resolved | track-d §D.2 |
| D.3 | `storage.persist()` grant on iOS | **Auto-granted для Home-Screen PWA** на iOS Safari 17+ (per `project_ios_pwa_storage_eviction.md`); browser-tab fallback heuristic, denial логируем | resolved | track-d §D.3 |
| D.4 | Quota exceeded (IDB full) | Catch `QuotaExceededError` → toaster «Удалите старые данные» + offer manual prune rows >60 days. **Никогда auto-prune без consent** (Joplin issue lesson). PoC проверит реальный iOS quota (100 MB ÷ 1 GB колеблется). | resolved | track-d §D.4 |
| D.5 | DB version downgrade | `VersionError` → recovery modal с explicit confirm + fail-safe ON. Drop-and-resync приемлем благодаря 30-day window. | resolved | track-d §D.5 |
| D.6 | Auth session expired during push | **401 = retry, не poison** — refresh через Supabase Auth + один retry. Pattern уже в `pendingWrites.ts`, переносится. | resolved | track-d §D.6 |
| D.7 | Race: mutation while push in flight | **Notesnook timestamp guard:** `_dirty=false WHERE client_modified_at <= pushTimestamp`. Документировано в track-b §B.2.8. | resolved | track-d §D.7 |
| D.8 | `client_modified_at` resolution | `Date.now()` (ms) достаточен для single-user sequential; tie-breaker через `edit_count`. Notesnook требует debounce ≥100 ms иначе collisions. | resolved | track-d §D.8 |
| D.9 | Server clock authoritative | **`client_modified_at` + `edit_count` для LWW; `server_received_at` ТОЛЬКО для skew telemetry** (порог 5 min). Server-authoritative ломает offline multi-day. | resolved | track-d §D.9 |
| D.10 | Cross-origin / subdomain | Different origins = different IDB; staging/prod автоматически изолированы браузером. | resolved | track-d §D.10 |
| D.11 | PWA update — service worker swap | SW scope ≠ IDB scope; SW update не трогает IDB. Schema upgrade срабатывает только при `db.version()` bump. `versionchange` handler для multi-tab. | resolved | track-d §D.11 |
| D.12 | Backup endpoint downtime SLA | **7 days silent tolerance** (~210 dirty rows ≈ 15 KB gzipped, fits sendBeacon); 7-30 days soft warning через `<PendingWritesBadge>`; >30 days recovery modal. | resolved | track-d §D.12 |
| D.13 | Anonymous → registered user upgrade | **Not applicable** — Tier-1 simplification (`project_required_auth_done.md`) уже вырезал анонимов 2026-04-28. | n/a | track-d §D.13 |
| D.14 | Logout — wipe Dexie? | **Wipe** на explicit logout button (privacy); **keep** на session expiry / auto-refresh. Dirty-rows confirmation modal перед wipe. **НЕ копируем Bearable forced-restore-on-login.** | resolved | track-d §D.14 |
| D.15 | GDPR / user data deletion | Two-phase: backend hard delete + client wipe Dexie на следующем boot. Pattern documented; **PoC scope excluded** (Phase 2 compliance work). | resolved (deferred impl) | track-d §D.15 |
| D.16 | 422 «schema mismatch» | Toast «App update required» + **block dirty drain** (preserves data). **Никогда auto-drop dirty rows.** Schema version negotiation через `X-Disher-Schema-Version` header. | resolved | track-d §D.16 |

**Сводка:** 14 resolved + 1 not applicable + 1 deferred-impl (D.15). Никаких блокеров.

---

## 7. PoC Scope

Per plan §6 — sanity criteria. Branch `experiment/backup-polling-products`, 2-day spike, начинаем с одной entity (`products`).

1. **Создать product → tab close 50ms → reload → есть.** (instant commit + Dexie persistence)
2. **50 mutations offline → online → all arrive without dupes.** (idempotency через `(id, edit_count, client_modified_at)` композит + ON CONFLICT)
3. **Multi-tab — mutation в одном tab → видно во втором.** (`navigator.locks` + Dexie liveQuery storagemutated)
4. **Mid-push network drop → восстановление → нет потерь.** (timestamp guard защищает _dirty flag)
5. **iOS device test (real device, not chromium devtools).** (validate iOS quirks — risks #1-4)
6. **Schema upgrade → data preserved.** (`Version.upgrade()` callback, latency на 30-day fixture)
7. **Eviction recovery → snapshot pull восстанавливает.** (`storageWritable` boot probe + `pullSnapshot()`)
8. **Clock skew → reconcile поведение.** (manually shift system clock на second device, observe edit_count + tie-breaker)

После PoC — **одна фраза решения юзера** в memory: «делаю миграцию» / «остаюсь на outbox» / «копаем глубже X» (per plan §9).

---

## 8. Open Questions (decide in PoC)

Все 16 corner cases имеют design-time answer, но 7 пунктов требуют empirical validation на реальном iPhone. Это и есть PoC value.

1. **iOS H2 pool poisoning** на backup endpoint (WebKit Bug #284946, `project_ios_fetch_hang_2026_04_28.md`). Design-time mitigation: HTTP/1.1 only / `/api/sb/*` proxy passthrough (`project_ios_proxy_resolved.md`).
2. **Реальный iOS quota** для A2HS PWA в 2026 — публичные источники колеблются 100 MB ÷ 1 GB; Disher 30-day ≈ 1-5 MB fits worst case, но shape `QuotaExceededError` нужно проверить.
3. **iOS sendBeacon reliability** при aggressive home-button — `visibilitychange` quirks untested на real device.
4. **`navigator.locks`** real-device behavior в multi-tab Safari iOS — первое использование, нет нашего production telemetry.
5. **`Version.upgrade()` latency** на 30-day dataset на iPhone 12 — потенциально нужен progress modal.
6. **Clock skew p99** observed на real beta users — порог 5 min эвристика, tune от observed данных.
7. **Дебаунс 100 ms vs 200 ms vs 500 ms** для hot tables — Notesnook 100 ms для HTML content, для structured Disher rows может быть лучше другой.

---

## 9. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| iOS quirks (H2 pool, sendBeacon, locks, quota) unknown until real-device test | High | Medium | PoC step 5 — mandatory iOS device test; design backup endpoint HTTP/1.1 only; have `/api/sb/*` proxy fallback |
| Schema migration на rolling window — первый breaking migration может удивить | Medium | Medium | PoC step 6 на 30-day fixture; staging week + changelog modal перед prod |
| User regret если backup-polling fits хуже ожиданий | Low | Low | Branch + 2-day spike, easy to abandon; outbox остаётся работающим до merge |
| `Version.upgrade()` блокирует UI на iPhone 12 | Medium | Low | PoC step 6 measure latency; progress modal если > 1s |
| Multi-tab `navigator.locks` race на iOS | Low | Medium | PoC step 3 — sanity test; combined с timestamp guard как двойная защита |
| Recovery flow багогенный (Joplin lesson) | Medium | High | Explicit confirm + fail-safe ON + idempotent + detectable end state per track-b §B.5.4 — обязательно в PoC |
| Clock skew threshold tuning без production data | Low | Low | PoC log skew telemetry; set threshold от observed p99 после beta |

---

## 10. Sources

### Track files (full citations внутри)
- `apps/food-calc/docs/architecture/backup-polling-research-tracks/track-a-prior-art.md` — production prior art (Notesnook, SN, Joplin, CloudSyncSession), verified file:line citations
- `apps/food-calc/docs/architecture/backup-polling-research-tracks/track-b-best-practices.md` — implementation patterns (Dexie, push protocol, scheduler, conflict UX, recovery, schema migration)
- `apps/food-calc/docs/architecture/backup-polling-research-tracks/track-c-tools-libraries.md` — stack of choice + LOC budget
- `apps/food-calc/docs/architecture/backup-polling-research-tracks/track-d-corner-cases.md` — 16 corner cases pre-resolved
- `apps/food-calc/docs/architecture/backup-polling-research-tracks/track-e-our-category.md` — domain category (Bearable, Daylio, FoodNoms, OpenNutriTracker, HealthKit)

### Source code excerpts (track research-tracks/_inputs/)
- Notesnook: `notesnook_collector.ts`, `notesnook_merger.ts`, `notesnook_auto-sync.ts`, `notesnook_sync_index.ts`, `notesnook_devices.ts`
- Standard Notes: `sn_SyncItems.ts`, `sn_SaveItems.ts`, `sn_TimeDifferenceFilter.ts`, `sn_ItemSaveValidator.ts`, `sn_GetItems.ts`
- Joplin: `joplin_Synchronizer.ts`, `joplin_issues.md`
- CloudSyncSession: `css_CloudSyncSession.swift`, `css_ErrorMiddleware.swift`, `css_RetryMiddleware.swift`, `css_SplittingMiddleware.swift`, `css_SyncState.swift`, `css_SyncWork.swift`
- Dexie: `dexie_version.ts`, `dexie_hooks-middleware.ts`, `dexie_live-query.ts`, `dexie_schema-helpers.ts`

### Verified web/npm references (track research-tracks/_inputs/)
- `web_apis_summary.md` — VERIFIED 2026-04-29 (caniuse, MDN, web.dev): Background Sync API, Page Lifecycle, sendBeacon, navigator.locks, visibilitychange iOS support
- `npm_versions.md` — VERIFIED 2026-04-29 (npm registry): Dexie 4.4.2, dexie-react-hooks 4.4.0, Hono 4.12.15, Fastify 5.8.5, Elysia 1.4.28, Drizzle 0.45.2, Lucia 3.2.2 (DEPRECATED), better-auth 1.6.9, idb 8.0.3

### Related plans / documents
- `c:/Users/booty/.claude/plans/backup-polling-research-2026.md` — research plan (this guide implements §3)
- `apps/food-calc/docs/architecture/offline-stacks-2026-simplicity-rerank.md` — re-rank без bundle/backend gates, выбор backup-polling как leading candidate
- `apps/food-calc/docs/architecture/offline-first-stacks-2026-inventory.md` — initial 29-stack survey
- `apps/food-calc/CLAUDE.md` — current Disher architecture (server-first w/ outbox `pendingWrites`)

### Disher memory (cited in tracks)
- `project_short_distance_horizon.md` — 30-day analytic horizon (Bearable Free tier коммерческий precedent)
- `feedback_timestamp_guard_pattern.md` — Notesnook/Joplin timestamp guard
- `project_required_auth_done.md` — Tier-1 anon removal (D.13 not applicable)
- `project_ios_pwa_storage_eviction.md` — Home-Screen PWA persist() работает на Safari 17+
- `project_ios_fetch_hang_2026_04_28.md` — WebKit Bug #284946 H2 pool poisoning (Risk 1)
- `project_ios_proxy_resolved.md` — `/api/sb/*` passthrough mitigation
- `project_auth_invariant.md` — login один раз, refresh не истекает, 401 = retry not poison
- `feedback_corner_case_frontload.md` — мотивация Track D
- `feedback_outbox_industry_consensus.md` — «no invalidate after enqueue» invariant (релевант текущему outbox)
- `project_simplification_tier1.md` — Tier-1 simplification ethos (net −230 LOC fits)
- `project_outbox_audit_2026_04_28.md` — boot probe рекомендация (D.4 / §4.5 storageWritable)
- `project_manual_export_idea.md` — manual export feature (Phase 2, через dexie-export-import)
- `project_e2e_supabase_mock.md` — Playwright + page.route pattern (continue в PoC)
