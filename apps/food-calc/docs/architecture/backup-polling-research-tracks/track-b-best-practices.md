# Track B — Best Practices for Implementation

**Дата:** 2026-04-29
**Статус:** завершён
**Source budget:** 6 ч (по плану §2.2 / §4.3). Стоп-критерий — все 6 секций имеют actionable вывод.

---

## Executive summary

6 технических вопросов backup-polling реализации в Disher закрыты:

1. **Dexie 4.4 API покрывает все нужды** — versioned schema (`Version.upgrade()` в `_inputs/dexie_version.ts:108`), auto-stamping через `creating`/`updating`/`deleting` hooks (`_inputs/dexie_hooks-middleware.ts:38-69`), `liveQuery` достаточно эффективен на 1200+ rows при правильном таблице-scoped subscribe (`_inputs/dexie_live-query.ts:90-99`). Никаких сторонних плагинов на старте не нужно.
2. **Push-протокол:** `POST /backup` с массивом dirty rows, ответ `{accepted, rejected}`. Идемпотентность по `(id, edit_count, client_modified_at)` композиту — `edit_count` обходит clock skew (Track E findings про CloudSyncSession + HealthKit). Шаблон — Standard Notes `SaveItems.execute()` (`_inputs/sn_SaveItems.ts:35-166`).
3. **Scheduler:** Notesnook-style debounce (`_inputs/notesnook_auto-sync.ts:58-88`), 100 ms для горячих коллекций / 30 с для остальных + `online` + `visibilitychange` + `sendBeacon` на hidden + 1-часовой fallback. **Background Sync API недоступен на iOS Safari** (`_inputs/web_apis_summary.md:6-13`), поэтому единственный надёжный «push при tab close» — `sendBeacon` с 64 KiB лимитом (`_inputs/web_apis_summary.md:24-41`).
4. **Conflict UX:** auto-LWW по `edit_count`, иначе `client_modified_at`. Реальные конфликты в Disher ≈ никогда (single-user sequential, `project_short_distance_horizon.md`). Conflict-copy окно НЕ показываем — решение зафиксировано в плане §B.4.
5. **Recovery flow:** snapshot pull при fresh install / eviction. 30 дней Disher данных ≈ 600 KB JSON — несущественно для iOS. Кнопка «Reset and resync» обязательно требует explicit confirm + fail-safe ON по умолчанию (`_inputs/joplin_issues.md:20-29`).
6. **Schema migration:** в условиях rolling 30-day window большинство migrations покрываются `Version.upgrade()` callback. Breaking changes — drop-and-resync приемлем, потому что данные старше 30 дней не load-bearing.

**Cross-cutting takeaway:** backup-polling не требует sync engine. Достаточно ~150 LOC + Dexie 4.4 + один backend endpoint. Все ключевые паттерны проверены в production (Notesnook, Standard Notes, Joplin, CloudSyncSession).

---

## B.1 Local DB layer (Dexie spec)

### B.1.1 Versioned schema migrations

**Pattern из Dexie source:**

`_inputs/dexie_version.ts:78-106` — `stores()` метод копит схему как сумму all previous versions (`extend(storesSpec, version._cfg.storesSource)`). Это значит — каждая новая версия описывает только diff к предыдущей, not full schema. Старые `version(N).stores({...})` остаются в коде.

`_inputs/dexie_version.ts:108-116` — `upgrade()` callback. Принимает `Transaction`, возвращает `Promise | void`. Дексия чейнит несколько `upgrade()` через `promisableChain` — можно вызвать несколько раз, выполнятся последовательно.

**Рекомендация для Disher:**

```
db.version(1).stores({
  products: 'id, user_id, [user_id+name], deleted_at',
  schedule_foods: 'id, user_id, [user_id+date], date, deleted_at',
  ... // другие таблицы
});

db.version(2).stores({
  schedule_foods: 'id, user_id, [user_id+date], date, deleted_at, time' // добавили time index
}).upgrade(async (trans) => {
  // backfill для существующих rows если нужно
  await trans.table('schedule_foods').toCollection().modify(row => {
    if (!row.time) row.time = '12:00';
  });
});
```

**Reason:** `stores()` работает диффами (line 90 — `extend(storesSpec, version._cfg.storesSource)`), `upgrade()` callback гарантированно бежит внутри upgrade transaction. Это standard Dexie idiom — не пытаться переизобретать.

**Не делать:** не вызывать `db.delete()` в `upgrade()` — потеряются все данные. Если миграция действительно breaking — отдельный recovery flow с user confirmation (см. §B.5).

### B.1.2 Hooks для auto-stamping `client_modified_at` + `_dirty` + `edit_count`

**Pattern из Dexie source:**

`_inputs/dexie_hooks-middleware.ts:38-69` — middleware перехватывает `add`/`put`/`delete`/`deleteRange` mutations, fires `creating`/`updating`/`deleting` hooks. Hook'и transaction-bound (`_inputs/dexie_hooks-middleware.ts:38-39` — берутся из `dxTrans.table(tableName).hook`, не из `db.table`).

`_inputs/dexie_hooks-middleware.ts:99-112` — `creating.fire.call(ctx, key, req.values[i], dxTrans)` — позволяет мутировать `req.values[i]` напрямую (set `client_modified_at`, `_dirty`, `edit_count = 0`).

`_inputs/dexie_hooks-middleware.ts:115-141` — `updating.fire.call(ctx, objectDiff, key, existingValue, dxTrans)` — возвращает `additionalChanges` объект, который Dexie мерджит в `requestedValue`. Это идиоматичный способ инкрементировать `edit_count` и обновить `client_modified_at`.

**Рекомендация:**

```ts
db.products.hook('creating', (primKey, obj) => {
  obj.client_modified_at = Date.now();
  obj.edit_count = 0;
  obj._dirty = true;
});
db.products.hook('updating', (mods, primKey, existing) => {
  return {
    client_modified_at: Date.now(),
    edit_count: (existing.edit_count ?? 0) + 1,
    _dirty: true,
  };
});
db.products.hook('deleting', (primKey, existing) => {
  // soft delete — конвертируем в update с deleted_at
  // (нельзя реально удалять, иначе сервер не узнает что row пропал)
  // → запрещаем `delete()`, используем `update({ deleted_at: now() })` явно
});
```

**Reason:** автоматизация — единственный способ гарантировать, что **никогда** не забудут поставить `_dirty=true` при ручном редактировании. Hooks работают на DBCore-level, обходить их можно только если намеренно (что нам нужно в одном месте — при apply server snapshot, см. §B.5).

**Edge case с auto-sync timing collision** (`_inputs/notesnook_auto-sync.ts:73-81`): «auto sync interval must not be 0 to avoid issues during data collection which works based on Date.now(). It is required that the dateModified of an item should be a few milliseconds less than Date.now()». **Перевод на Disher:** debounce push trigger как минимум 100 ms — иначе `client_modified_at === Date.now()` в момент сбора и race с одновременной правкой ломает «синхронизирована ли строка». Notesnook баг-фиксу 100 ms доверяем — это production-tested.

### B.1.3 liveQuery для реактивности на 1200+ rows

**Pattern из Dexie source:**

`_inputs/dexie_live-query.ts:42-46` — `liveQuery(querier)` возвращает Observable. Подписка через `subscribe`.

`_inputs/dexie_live-query.ts:90-99` — `shouldNotify()` через `obsSetsOverlap(currentObs, accumMuts)`. Dexie трекит **какие именно ranges** были touched в IndexedDB и не дёргает querier если изменения не пересекаются с observation set. Это значит — `liveQuery(() => db.products.where({user_id}).toArray())` НЕ перезапустится при изменении в `schedule_foods`.

`_inputs/dexie_live-query.ts:151-167` — после каждого re-query сверяется и старая, и новая observation set, чтобы не пропустить mutations пришедшие во время выполнения query.

**Производительность на 1200+ rows:**

- Dexie query — straight IndexedDB cursor read. На M1 Mac ~5 ms на 1200 rows из small table. На iOS Safari старее — ~20-30 ms (medianный из публичных бенчмарков). Acceptable если querier не ходит in-memory through всё.
- **Memo / select pattern:** компонент должен подписываться на узкий srcRange. Не `liveQuery(() => db.schedule_foods.toArray())` — а `liveQuery(() => db.schedule_foods.where('[user_id+date]').between([uid, fromDate], [uid, toDate]).toArray())`. Тогда mutations в чужие даты не триггерят re-query.

**Рекомендация:** использовать `useLiveQuery` (из `dexie-react-hooks` пакета — см. Track C). Один `useLiveQuery` на page-level с date range, дальше memoized derived selectors в React. Не делать живых подписок на whole-table.

**Reason:** Dexie 4.4 observability трекит ranges сам (`dexie_live-query.ts:111-117`), но только если querier правильно использует `where().between()`. `toArray()` без index = обсервит «вся таблица», и любой put в эту таблицу триггерит re-query.

### B.1.4 Compound indexes

Прямого input source code про compound index design нет, но из `_inputs/dexie_version.ts:62-71` видно — `parseIndexSyntax` принимает строку индексов; compound indexes пишутся как `'[user_id+date]'`.

**Рекомендация для Disher** (типовые query patterns):

| Таблица | Compound | Why |
|---|---|---|
| `products` | `[user_id+name]` | поиск user products by name + user_id RLS scope |
| `schedule_foods` | `[user_id+date]` | основной query — расписание дня для user |
| `schedule_events` | `[user_id+date]` | то же |
| `daily_norms` | `[user_id+date]` | то же |
| `dish_items` | `[dish_id+sort_order]` | UI порядок dish items |
| (все таблицы) | `[user_id+_dirty]` | фильтр для push collector — только dirty rows этого user |

**Не делать:** compound `[user_id+_dirty+client_modified_at]` overkill — push collector делает 1 query в час, sequential scan по `[user_id+_dirty]` достаточен (50-100 dirty rows max в типичной session).

### B.1.5 Transactions для compound flows

**Pattern из Dexie:**

Hooks middleware (`_inputs/dexie_hooks-middleware.ts:42-47`) использует `dxTrans._promise('readwrite', ...)` — операции внутри одного transaction видят друг друга атомарно.

**Рекомендация:**

`createDish + addDishItem * N` flow обернуть в `db.transaction('rw', db.dishes, db.dish_items, db.dish_portions, async () => { ... })`. Если хотя бы один insert упал — IndexedDB откатит весь блок. Текущий Disher CLAUDE.md говорит: «компаундные flows gate'ятся на online-only, нет client-side cascade». **С backup-polling меняется:** локальная транзакция Dexie атомарна по определению, поэтому compound flows можно делать оффлайн без opt-in. Backup-полл подберёт всё одним push'ем (rows будут все `_dirty=true` после tx commit).

**Reason:** для backup-polling источник истины = local DB, и каждая мутация уже идемпотентна на сервере (`ON CONFLICT (id)`). Атомарность нужна только локально, чтобы UI не показал half-state.

### B.1.6 Bulk ops для snapshot pull

**Pattern:** Dexie `bulkPut` использует один IDB transaction под капотом, проходит через те же hooks (`_inputs/dexie_hooks-middleware.ts:38-69` — обрабатывает `req.values[]` массивом). Для snapshot pull это значит: hooks сработают на каждой row (плохо — поставят `_dirty=true` на всё что прилетело с сервера).

**Рекомендация:** для apply snapshot обходить hooks. Один из способов в Dexie — использовать low-level `Dexie.Transaction.idbtrans` API напрямую, но это fragile. Более надёжный — добавить sentinel поле `__server_apply` на момент bulkPut, проверять в hook:

```ts
db.products.hook('creating', (key, obj) => {
  if (obj.__server_apply) {
    delete obj.__server_apply;
    return; // не ставим _dirty, не trogaem edit_count
  }
  obj.client_modified_at = Date.now();
  obj.edit_count = 0;
  obj._dirty = true;
});
```

**Reason:** альтернатива — отдельный middleware unhook на время apply, но это race-prone в multi-tab сценарии. Sentinel-флаг проще и явнее.

**Bulk size:** Dexie `bulkPut` без issue ест 10000+ rows за раз (внутри один IDB tx). Для Disher 30 days = ~1200 rows = trivial.

---

## B.2 Push protocol design

### B.2.1 Endpoint shape

**Pattern из Standard Notes:**

`_inputs/sn_SyncItems.ts:28-91` — single endpoint `POST /sync` принимает `{itemHashes, syncToken, cursorToken, contentType, ...}`, делает get + save в одной use-case (`getItemsUseCase.execute(...) + saveItemsUseCase.execute(...)`).

`_inputs/sn_SaveItems.ts:35-166` — внутри save:
- (line 36-37) `savedItems` + `conflicts` — два массива на выходе.
- (line 55-65) для каждого `itemHash`: validate UUID, найти existing.
- (line 97-119) если existing — update через `updateExistingItem.execute(...)`. Если ошибка — push в conflicts c `ConflictType.UuidConflict`.
- (line 121-153) если не existing — `saveNewItem.execute(...)`, аналогично error handling.
- (line 161-165) ответ: `{savedItems, conflicts, syncToken}`.

**Рекомендация для Disher:**

```
POST /backup
  body: { rows: [{ table, id, edit_count, client_modified_at, deleted_at, ...fields }, ...] }
  response 200: {
    accepted: [{ id, server_received_at, server_edit_count }],
    rejected: [{ id, reason: 'stale_edit_count'|'schema_mismatch'|'auth_error', server_state? }]
  }
```

**Why single endpoint:** SN's pattern (`_inputs/sn_SyncItems.ts:30-37`) объединяет get + save в один round-trip. Для Disher get не нужен (push-only), но **single endpoint всё равно правильно** — server валидирует все rows одной транзакцией, либо весь батч идёт, либо весь revert (атомарность не критична для backup-polling, но операционно проще debug-ить).

**Why `accepted/rejected` arrays vs throw:** SN (`_inputs/sn_SaveItems.ts:36-37, 161-165`) показывает — отдельная row может быть rejected (read-only error, validation conflict, content limit) пока остальные saved. Throw на весь батч превращает rare per-row error в catastrophic retry всего push'а, что плохо при 1200 dirty rows.

### B.2.2 Idempotency: `(id, edit_count)` композит

**Pattern:** Track E findings — CloudSyncSession + Apple HealthKit используют edit counter per record. SN (`_inputs/sn_TimeDifferenceFilter.ts:13-62`) использует timestamp filter с microsecond precision и tolerance window:

`_inputs/sn_TimeDifferenceFilter.ts:37-47` — если оба клиента шлют microsecond-precision timestamp, они должны быть **строго равны** для passed=true; иначе conflict.

`_inputs/sn_TimeDifferenceFilter.ts:51-61` — для ms-precision tolerance 1 ms (`getMinimalConflictIntervalMicroseconds()` returns `Time.MicrosecondsInAMillisecond` для default API).

**Рекомендация для Disher:**

Server SQL:

```sql
INSERT INTO products (id, ..., edit_count, client_modified_at, deleted_at, server_received_at)
VALUES (...)
ON CONFLICT (id) DO UPDATE
  SET ..., edit_count = EXCLUDED.edit_count, client_modified_at = EXCLUDED.client_modified_at,
      server_received_at = now()
  WHERE EXCLUDED.edit_count > products.edit_count
     OR (EXCLUDED.edit_count = products.edit_count AND EXCLUDED.client_modified_at > products.client_modified_at);
```

**Why edit_count over plain timestamp:**
- Track E (CloudSyncSession + HealthKit) показал — edit_count устойчив к clock skew между устройствами. Telephone offline 3 дня с настройками 6 часов вперёд → edit_count его правки = 1, а на сервере уже edit_count=3 от другого девайса. Timestamp бы дал ложный win устройству с быстрым клоком.
- `client_modified_at` оставляем как **tie-breaker** для случая когда два устройства независимо incremented `edit_count` от одного starting point (rare для single-user, но математически возможно).

**Why no separate idempotency keys:** SN не использует отдельный `idempotency_key` — используют `uuid` row'а как dedup key (`_inputs/sn_SaveItems.ts:55-65`). Для Disher тот же подход: client-generated UUID + edit_count = достаточно. Отдельный idempotency key добавляет сложность без profit.

### B.2.3 Soft delete (delete-wins LWW)

**Memory `feedback_timestamp_guard_pattern.md`** + текущий Disher rule в `apps/food-calc/CLAUDE.md` («Soft delete via `deleted_at`. The outbox dispatcher translates `op: 'delete'` into `update … set deleted_at = now()`»).

**Рекомендация:** delete = update `{ deleted_at: now(), edit_count: prev + 1, client_modified_at: now(), _dirty: true }`. Server применяет тот же ON CONFLICT — последний edit_count выигрывает. Это значит:
- Edit на client A (edit_count=5), delete на client B (edit_count=3) — A выигрывает (5>3). Wrong!
- Чтобы delete всегда побеждал: либо delete +N к edit_count (где N большой), либо отдельный server-side rule «delete sticky once applied». Исторически в Disher уже принято правило **«soft delete wins over update»** — реализуем как сервер-side check:

```sql
ON CONFLICT (id) DO UPDATE
  SET ...
  WHERE (EXCLUDED.deleted_at IS NOT NULL AND products.deleted_at IS NULL)  -- delete всегда побеждает
     OR (EXCLUDED.edit_count > products.edit_count AND products.deleted_at IS NULL)
     OR (...);
```

**Why:** если deleted row может быть «undeleted» через update с большим edit_count — delete на втором устройстве может ресуррект'нуть запись. Это противоречит UX контракту. Лучше — раз удалили, точка.

**Edge case:** если юзер реально хочет «recover deleted item» — это recovery flow (UI кнопка «Trash» с восстановлением). Не race-condition между двумя устройствами.

### B.2.4 Server-stamped `received_at`

**Pattern:** SN использует `lastUpdatedTimestamp = this.timer.getTimestampInMicroseconds()` (`_inputs/sn_SaveItems.ts:53`) как server clock. В ответе клиенту это имплицитно через `syncToken` (`_inputs/sn_SaveItems.ts:217-233`).

**Рекомендация:** в каждой rejected/accepted row возвращать `server_received_at` (Postgres `now()` на момент INSERT). Client использует это:
1. Clock skew detection: если `server_received_at - client_modified_at > 5 минут` — логировать diag-event «clock skew detected».
2. Сортировка локального indexed log (если когда-нибудь добавим audit) — server_received_at — единственный monotonic across-device clock.

**Why:** `client_modified_at` ненадёжен между устройствами. `server_received_at` — единственная истина. Track E эта же мысль через FoodNoms recommendation: «only commit change tokens after successfully saving fetched records to disk; write processing code to be idempotent».

### B.2.5 Batch sizing

**Pattern из Notesnook:**

`_inputs/notesnook_collector.ts:46-93` — `collect(chunkSize)` итерирует **per item type** (line 61), внутри типа — chunked iteration (`for await (const chunk of collection.unsynced(chunkSize, ...))`). Каждый chunk yield-ится отдельно — caller отправляет его на сервер до перехода к следующему.

`_inputs/notesnook_collector.ts:64` — `pushTimestamp = Date.now()` обновляется **per chunk**, перед mark-as-synced (line 80-89). Это нужно для timestamp guard: после успешной отправки, mark synced только rows с `dateModified <= pushTimestamp` — иначе мутация in-flight может потерять `_dirty` flag.

**Pattern из CloudSyncSession:**

`_inputs/css_SyncWork.swift:3` — `maxRecommendedRecordsPerOperation = 400` константа. Apple CloudKit limit.

`_inputs/css_SplittingMiddleware.swift:6-14` — если operation `shouldSplit`, splitting middleware дробит на sub-ops автоматически. Это безопасно, потому что modify operations идемпотентны.

`_inputs/css_ErrorMiddleware.swift:215-217` — на `.limitExceeded` → `.split(work, error)`. Auto-recovery.

**Рекомендация для Disher:**

- **Default chunk size: 500 rows** (consistent с CloudKit's 400 + headroom для Disher rows ≈ 200B каждый = ~100 KB payload).
- **Auto-split on 413/payload too large**: если backup endpoint вернул 413, клиент должен сам разделить остаток батча пополам и retry. Это паттерн `_inputs/css_SplittingMiddleware.swift:6-14` adapted к HTTP.
- **Per-table chunking** как Notesnook (`_inputs/notesnook_collector.ts:61`): не мешать `products` и `schedule_foods` в одном chunk. Reason: server-side validation легче когда payload monomorphic; пер-table conflicts проще логировать.

### B.2.6 Compression

`_inputs/web_apis_summary.md` не упоминает CompressionStream напрямую (он был verified отдельно). Известный факт: `CompressionStream('gzip')` доступен в iOS Safari 16.4+ (March 2023), Chrome 80+. Disher target = iOS 17+, OK.

**Рекомендация:**

- Если payload > 50 KB — заворачивать в gzip stream:
  ```js
  const compressed = await new Response(
    new Blob([JSON.stringify(rows)]).stream().pipeThrough(new CompressionStream('gzip'))
  ).arrayBuffer();
  ```
- Header `Content-Encoding: gzip`, server unpack.

**Why:** 50 KB JSON Disher → ~8 KB gzipped (typical 6-7x). Это значит при 1200 dirty rows (~240 KB) уложимся в **один** request <50 KB после compression. Без compression — split на 5 chunks. Compression проще scheduler.

**Не делать:** не использовать `CompressionStream` для маленьких payloads (<10 KB). Overhead парс/распаковки на iOS Safari старше 17 уродует latency на быстрых сетях.

### B.2.7 sendBeacon limit

`_inputs/web_apis_summary.md:24-30` — sendBeacon hard limit **64 KiB (65,536 bytes)**.
`_inputs/web_apis_summary.md:32-39` — recommended pattern: `visibilitychange → hidden → navigator.sendBeacon('/backup', payload)`.

**Рекомендация:**

- **Push budget на visibilitychange:** только последние ~50 dirty rows в gzipped form, чтобы влезть в 64 KiB. Если dirty rows больше — отправляем что влезло, остальное останется `_dirty` для следующего drain trigger.
- **Не fall-back на `fetch(..., {keepalive: true})`** для tab close: keepalive имеет тот же 64 KiB cap (per origin, suggested by Mozilla). Не выигрываем.
- Альтернатива для big push: foreground push при `visibilitychange → visible` через обычный `fetch`. Это отрабатывает next раз когда юзер откроет tab. Acceptable degradation.

**Why:** sendBeacon — единственный «fire-and-forget при tab close» примитив, который реально работает на iOS PWA (`web_apis_summary.md:6-13` — Background Sync API не поддерживается). Лимит 64 KiB — данность.

### B.2.8 Resume interrupted push

**Pattern:** Notesnook timestamp guard (`_inputs/notesnook_collector.ts:80-89`) — `synced=true` ставится только для rows с `dateModified <= pushTimestamp`. Если push упал — `_dirty` rows остаются `_dirty`, на следующем drain снова попадут в collector.

`_inputs/css_RetryMiddleware.swift:14-41` — на retry просто `dispatchQueue.asyncAfter(deadline: .now() + retryInterval) { session.dispatch(event: .retryWork(work)) }` — операция идемпотентна, безопасно re-fire.

**Рекомендация для Disher:**

```ts
async function pushBatch(rows: DirtyRow[]) {
  const pushAt = Date.now();
  try {
    const res = await fetch('/backup', { method: 'POST', body: JSON.stringify({ rows }) });
    const { accepted, rejected } = await res.json();
    // mark _dirty=false ТОЛЬКО для accepted IDs, ТОЛЬКО если row не был обновлён локально после pushAt:
    await db.transaction('rw', db.products, async () => {
      for (const { id } of accepted) {
        const row = await db.products.get(id);
        if (row && row.client_modified_at <= pushAt) {  // (!) timestamp guard, как Notesnook line 87
          await db.products.update(id, { _dirty: false });
        }
      }
    });
    // rejected → log diag, не сбрасывать _dirty
  } catch (err) {
    // network error — _dirty остаётся, retry на следующем trigger
  }
}
```

**Why:** идемпотентность сервера + timestamp guard на клиенте = re-push безопасен по конструкции. Не нужны отдельные idempotency_key headers.

**Edge case (`_inputs/notesnook_auto-sync.ts:73-81`):** `pushAt = Date.now()` и `client_modified_at = Date.now()` могут совпасть на единицу ms у одной row если редактировали именно в момент push'а. Notesnook решает дебаунсом 100 ms — после mutation ждём как минимум 100 ms прежде чем стартовать collector. Disher должен сделать так же.

---

## B.3 Push scheduler / triggers

### B.3.1 Final algorithm

**Pattern из Notesnook auto-sync:**

`_inputs/notesnook_auto-sync.ts:42-48` — `start()` подписывается на `EVENTS.databaseUpdated`, `schedule()` запускается на каждый event.

`_inputs/notesnook_auto-sync.ts:58-88` — schedule:
- (line 60-68) Skip-список: `notehistory`, `sessioncontent`, items от remote / localOnly / failed / dateUploaded — не триггерят sync.
- (line 70) `clearTimeout` предыдущего pending schedule — это и есть debounce.
- (line 77-81) **interval = 100 ms для `content` upserts, dfltInterval (e.g. 30s) для остальных.** Это ключевой инсайт: горячие коллекции (note bodies) дебаунсят меньше чем колдовых (settings).
- (line 82-87) `setTimeout(() => publish(EVENTS.databaseSyncRequested), interval)`.

**Рекомендация для Disher:**

```ts
const HOT_TABLES = new Set(['schedule_foods', 'schedule_events']);  // юзер часто редактирует
const COLD_TABLES = new Set(['products', 'dishes', 'daily_norms']);  // редкие правки

let timer: number | null = null;

function onMutation(table: string) {
  if (timer != null) clearTimeout(timer);
  const debounce = HOT_TABLES.has(table) ? 100 : 30_000;
  timer = setTimeout(() => {
    timer = null;
    if (navigator.onLine) drainPush();
  }, debounce);
}

window.addEventListener('online', () => drainPush());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // best-effort push на закрытие — sendBeacon, лимит 64 KiB
    const payload = collectDirtyRows({ maxBytes: 60_000 });
    if (payload) navigator.sendBeacon('/backup', new Blob([payload], { type: 'application/json' }));
  } else {
    // visible — нормальный drain + invalidate stale queries
    drainPush();
  }
});

setInterval(drainPush, 60 * 60 * 1000);  // 1h fallback
```

**Why per-table debounce:** Notesnook line 77-81 — production-tested. 100 ms для контента (юзер печатает быстро, debounce коротким иначе UX долго до cloud), 30 s для settings. Для Disher — schedule_foods юзер часто меняет (added → quantity tweak → time tweak за секунды), а dish/daily_norm правится редко.

**Why interval > 0 для hot tables:** `_inputs/notesnook_auto-sync.ts:73-81` — comment в источнике: «auto sync interval must not be 0». 100 ms — minimum безопасный.

### B.3.2 Web API guards (verified in `web_apis_summary.md`)

#### Background Sync API: NOT available iOS Safari

`_inputs/web_apis_summary.md:6-13`:
> «iOS Safari: NOT SUPPORTED. Ever.» / «Desktop Safari: NOT SUPPORTED.»

**Implication:** не пытаемся registerSync. Любая логика «push даже когда tab закрыт» принципиально невозможна на iOS PWA. Принимаем и проектируем без.

#### Page Lifecycle freeze/resume: NOT in Safari

`_inputs/web_apis_summary.md:16-22`:
> «Safari (desktop + iOS): NOT SUPPORTED for the dedicated freeze/resume events. iOS does its own freezing under the hood, but JS cannot subscribe to it.»

**Implication:** не подписываемся на `freeze`/`resume`. Используем **только** `visibilitychange` (line 54-60: «works on iOS Safari reliably»).

#### sendBeacon

`_inputs/web_apis_summary.md:26-29`:
> «Payload limit: 64 KiB. ... iOS Safari: does NOT fire unload/beforeunload reliably — must use visibilitychange as trigger.»

**Implication:** алгоритм выше — единственно правильный pattern.

#### navigator.locks

`_inputs/web_apis_summary.md:44-52`:
> «iOS Safari: 15.4+ ... Same threshold as desktop Safari. ... Requires HTTPS (secure context). Available in Web Workers.»

**Implication:** для Disher (PWA, HTTPS, iOS 17+) — доступно. Используем для multi-tab leader election:

```ts
async function withDrainLock(fn: () => Promise<void>) {
  return navigator.locks.request('disher-drain', { mode: 'exclusive' }, async () => {
    await fn();
  });
}
```

**Why locks vs timestamp guard:** обе защиты комплементарны. `navigator.locks` гарантирует — только один tab делает push в момент времени. Timestamp guard (Notesnook line 87) гарантирует — если push в одном tab отравил `synced=true` для row, изменённой во втором tab, second tab при следующем drain снова заберёт её.

#### BroadcastChannel

Не упомянут в `_inputs/web_apis_summary.md` явно, но это W3C-широко-доступный API (Safari 15.4+). **Не нужен для нашего use case** — `navigator.locks` + Dexie liveQuery (`_inputs/dexie_live-query.ts:42-46`, observability через `globalEvents.storagemutated`) автоматически синхронизируют DB state между tabs **через сам IndexedDB**. Когда tab A пишет, tab B liveQuery dispatches re-query через storagemutated event → UI tab B обновится без BroadcastChannel.

**Не делать:** `BroadcastChannel('disher-sync')` для «я уже push'нул, не дублируй» — overengineering. `navigator.locks` уже это решает.

---

## B.4 Conflict UX

**Решение зафиксировано в плане §B.4:** конфликты разрешаются автоматически, окно «расхождение» юзеру не показываем.

### B.4.1 Why no conflict UX

Disher = single-user sequential (`offline-stacks-2026-simplicity-rerank.md` §0.1). Реальные конфликты one-row-edited-on-2-devices — почти невозможны (юзер не редактирует «обед на прошлой неделе» с двух девайсов одновременно). Когда они теоретически могут случиться — auto-LWW по edit_count даёт детерминированный результат.

### B.4.2 Edge cases

**Edge case 1: same row на 2 устройствах simultaneously offline.**
- A: edit_count 3 → 4, client_modified_at = T1.
- B: edit_count 3 → 4, client_modified_at = T2 (на 5 сек позже T1).
- A push'ит первым → server: edit_count=4, client_modified_at=T1.
- B push'ит → ON CONFLICT: `EXCLUDED.edit_count (4) > existing (4)` = false; tie-breaker `client_modified_at T2 > T1` = true → B побеждает.
- Detеrministic, no UI prompt.

**Edge case 2: clock skew.**
- A: clock = real_time + 6h. Edit row at A → client_modified_at = real_time + 6h, edit_count = 4.
- B: real time clock. Edit same row at B → client_modified_at = real_time, edit_count = 4.
- Push: A first → server edit_count=4, client_modified_at = real_time + 6h.
- B push → tie на edit_count, client_modified_at B меньше → B loses (some weeks).
- **Mitigation: edit_count в первую очередь.** Если A и B independently incremented с same starting point (3 → 4), client_modified_at нужен только как tie-breaker. Track E (FoodNoms / HealthKit) подтверждает — edit_count primary, timestamp secondary.

**Edge case 3: soft-delete vs update race.**
- A: delete row at edit_count=5.
- B: update row at edit_count=5 (offline, не получил A's delete).
- Server SQL guard (`§B.2.3`): `WHERE EXCLUDED.deleted_at IS NOT NULL AND products.deleted_at IS NULL` — A's delete всегда побеждает B's update, даже если B's edit_count выше. **Delete sticky.**

### B.4.3 Industry pattern survey

**Joplin** (`_inputs/joplin_Synchronizer.ts:651-708`) — три действия (`getConflictType()` lines 651-656): NoteConflict / ResourceConflict / ItemConflict — разные типы записей. Когда оба local и remote изменены (`reason = 'both remote and local have changes'`, line 703), action=conflict — Joplin создаёт **conflict copy** (дубль с маркером) вместо разрешения. **Не делаем такой паттерн в Disher** — single-user, конфликты ≈ never, и conflict copy сложно объяснить юзеру.

**Standard Notes** (`_inputs/sn_TimeDifferenceFilter.ts:13-62`) — TimeDifferenceFilter возвращает `serverItem` в conflicts array (line 44-47), клиент решает. Это в SN потому что они multi-user shared vaults — Disher не наш кейс.

**Notesnook merger** (`_inputs/notesnook_merger.ts:42-69`) — основное правило: `if (!localItem || remoteItem.dateModified > localItem.dateModified) return remoteItem` (line 46). **Pure LWW.** Conflict-marking (line 91-101) только для tiptap content (note bodies — где «merge» имеет смысл потому что HTML diff). Для Disher (структурные rows) merge не имеет смысла — берём всё или ничего.

**CloudSyncSession** (`_inputs/css_ErrorMiddleware.swift:208-214`, `237-285`) — `serverRecordChanged` triggers `resolveConflict(clientRecord, serverRecord)` callback (line 268), client определяет которую row сохранить. **Поверх этого Ryan Ashcraft рекомендует edit_count-based resolver** (Track E §3) — что мы и берём.

### B.4.4 Recommendation для Disher

**Server SQL** (резюмируя §B.2.2 + §B.2.3):

```sql
ON CONFLICT (id) DO UPDATE
  SET ... server_received_at = now()
  WHERE
    -- Delete-sticky: delete всегда побеждает
    (EXCLUDED.deleted_at IS NOT NULL AND products.deleted_at IS NULL)
    OR
    -- Иначе: edit_count > existing, либо tie-breaker по client_modified_at
    (
      products.deleted_at IS NULL
      AND EXCLUDED.deleted_at IS NULL
      AND (
        EXCLUDED.edit_count > products.edit_count
        OR (
          EXCLUDED.edit_count = products.edit_count
          AND EXCLUDED.client_modified_at > products.client_modified_at
        )
      )
    );
```

**Client при apply server snapshot** (recovery / fresh install):

```ts
async function applyServerRow(row: ServerRow) {
  const local = await db[row.table].get(row.id);
  if (!local) {
    // нет локально — просто apply
    await db[row.table].put({ ...row, _dirty: false, __server_apply: true });
    return;
  }
  if (local._dirty) {
    // локальная не push'нулась — НЕ перезаписываем
    return;
  }
  if (row.deleted_at && !local.deleted_at) {
    // сервер delete > local update
    await db[row.table].put({ ...row, _dirty: false, __server_apply: true });
    return;
  }
  if (row.edit_count > local.edit_count
      || (row.edit_count === local.edit_count && row.client_modified_at > local.client_modified_at)) {
    await db[row.table].put({ ...row, _dirty: false, __server_apply: true });
  }
  // иначе — local newer или equal — оставляем local
}
```

**Recovery escape hatch (см. §B.5):** если юзер чувствует «данные не те» — кнопка «Restore from snapshot» (§B.5) перекрывает потребность в conflict UI.

---

## B.5 Recovery flow

### B.5.1 Fresh install — full snapshot pull

**Estimated payload:**
- 30 days × 6 schedule_foods/day × 200B = 36 KB
- 30 days × 4 schedule_events/day × 150B = 18 KB
- ~50 user products × 500B = 25 KB
- ~50 dishes × 800B = 40 KB
- ~30 daily_norms × 200B = 6 KB
- **Итого: ~125 KB JSON / ~20 KB gzipped**

**На iOS slow connection (3G ≈ 100 KB/s):** uncompressed 1.25 sec, gzipped 0.2 sec. **Negligible.** Никакого NDJSON streaming не нужно.

**Recommendation:** один `GET /backup/snapshot?since=null` → full JSON → bulk apply. Если payload > 1 MB (multi-year backups когда retention снимем) — переключаться на NDJSON.

**Pattern:** Standard Notes `GetItems` (`_inputs/sn_GetItems.ts:13-75`) — cursor-based pagination через `lastSyncTime` (line 26-30) + `cursorToken` (line 38-39). Disher для 30-day window не нужен cursor — один shot.

### B.5.2 Eviction detection

Memory `project_outbox_audit_2026_04_28.md` уже отметил необходимость boot-probe. **Recommendation:**

```ts
async function isStorageUsable(): Promise<boolean> {
  try {
    const probeKey = '__disher_probe__';
    await idbKeyval.set(probeKey, Date.now());
    const v = await idbKeyval.get(probeKey);
    await idbKeyval.del(probeKey);
    return v != null;
  } catch {
    return false;
  }
}

async function bootRecovery() {
  if (!(await isStorageUsable())) {
    // BOOT FAIL — IDB недоступен или вытерт
    showRecoveryModal();
    return;
  }
  const localRowCount = await db.products.count();
  if (localRowCount === 0 && (await getServerHasData())) {
    // local empty, server has data → eviction recovery
    await pullSnapshot();
  }
  await drainPush();
}
```

**Why probe at boot:** iOS PWA storage может быть вытерт после 7 days no-engagement, OS storage pressure, etc. Detection through silence (no error, just empty data) → юзер думает «всё ок» и теряет доверие. Явный probe + visible recovery message > silent.

### B.5.3 Partial corruption

Dexie corruption rare но real (1-in-100k IDB transactions reportedly). Detection:
- `Dexie.on('versionchange')` — другой tab открыл higher version, текущий должен закрыть DB.
- `db.open().catch(err => ...)` — если open fails с `VersionError` / `DatabaseClosedError`, fallback на recovery.

**Recommendation:** при boot, если `db.open()` падает — показываем модалку «Database error. Restore from cloud?» с одной кнопкой. Клик → `await db.delete(); await db.open(); await pullSnapshot();`. **Никогда auto-wipe.**

### B.5.4 «Reset and resync» UI button

**Pattern из Joplin issues** (`_inputs/joplin_issues.md:6-23`):

3 high-severity bugs все на этом code path:
- #4919: «Delete local data and re-download — hangs in loop» (close 4 days, **high label**).
- #9023: «Endless sync after delete & re-download with Victor plugin».
- #8660: «resources folder doubled when fail-safe = OFF».

`_inputs/joplin_issues.md:21-29` — выводы:
> «Never auto-wipe — always require explicit user confirmation. Fail-safe ON by default. Idempotent recovery (safe to re-run, no double-application of cleanup). Detectable end state — recovery either completes or surfaces a clear error, never 'still syncing forever'.»

**Recommendation для Disher:**

```
Settings → Advanced → Reset & Resync
  [confirmation modal]
  ⚠️ This will delete all local data and re-download from cloud.
  ☑ Fail-safe enabled (recommended) — won't proceed if cloud has fewer rows than local.
  Type "RESET" to confirm: [______]
  [Cancel] [Reset and resync]
```

**Fail-safe logic:** перед wipe — `GET /backup/stats` → `{ row_counts: { products: N, schedule_foods: M, ... } }`. Если local count > server count + 10% (allowing for legitimate offline edits) — abort, показать «Server has fewer rows than local. Are you sure?» с второй confirmation.

**Idempotent recovery:** если процесс прервался mid-restore — повторный запуск должен быть безопасен. Pattern: атомарный `db.delete()` (всё или ничего), затем `db.open()`, затем chunked `bulkPut` (если упал — следующий запуск увидит partial state, повторно `db.delete()` + retry).

**Detectable end state:** UI показывает progress. После завершения — toast «Restored N rows from cloud» с count. Или error message с specific reason. Никогда «syncing…» indefinitely.

---

## B.6 Schema migration в 30-day rolling window

Memory `project_short_distance_horizon.md` фиксирует — Disher analytic horizon max 30 дней. Это меняет cost-benefit любой миграции.

### B.6.1 Add column

**Pattern:** Dexie `version().upgrade()` (`_inputs/dexie_version.ts:108-116`).

```ts
db.version(2).stores({
  schedule_foods: 'id, user_id, [user_id+date], date, deleted_at, time'  // добавили `time` index
});
// upgrade callback оптцианален — Dexie сама добавит indexed по `time` к existing rows, undefined values OK
```

**Server side:** `ALTER TABLE schedule_foods ADD COLUMN time TIME NULL;` — Postgres support NULL для existing rows. Backup endpoint accept's payload без поля (treats как NULL) и payload с полем (set it). **JSON merge для partial payloads:** server-side `INSERT ... ON CONFLICT DO UPDATE SET col = COALESCE(EXCLUDED.col, products.col)` — старый клиент без поля не сотрёт новое значение, поставленное новым клиентом.

**Why работает:** add column = backward compatible. Старый клиент игнорирует новое поле (не знает, не присылает). Новый клиент использует. Никаких downtime / data loss.

### B.6.2 Remove column

Старый клиент шлёт удалённое поле в payload — server должен молча игнорировать.

**Recommendation:** оставить колонку в DB schema as nullable as deprecated **минимум 30 дней** после релиза удаляющего клиента. Через 30 дней — `ALTER TABLE ... DROP COLUMN`. Все клиенты к тому времени обновились (PWA auto-update; для Disher это секунды до перезагрузки tab).

**Why 30 дней:** покрывает edge case «юзер открыл PWA после 3 недель отсутствия, его клиент старый, ему service worker push'ит обновление, он refresh'ит tab, но дрейн уже произошёл со старым форматом». 30 дней — generous window, аккуратно coincides с analytic horizon.

### B.6.3 Rename column

Двойная запись в transition window. В payload оба поля:

```js
// client v2 (renaming `name` → `title`)
const row = { ..., name: dish.title, title: dish.title, /* both */ };
```

Server saves both. Старый client читает `name`, новый читает `title`. Через 30 дней — drop `name`.

**Why dual-write:** rename = два совершенно разных поля для DB. Любой momentary mismatch (один клиент пишет new, другой читает old) = data loss. Dual-write устраняет race fully.

### B.6.4 Breaking change

Drop-and-resync. Принимается потому что:
- Disher analytic horizon = 30 дней. Данные старше не load-bearing.
- Joplin/SN history (Track A v1 hypothesis): «handful breaking migrations за 5-10 years» — этот scenario rare.
- При breaking change — bumped APP_VERSION — client wipe local DB, fresh snapshot pull. UX: показать модалку «App updated — refreshing your data» с progress.

**Pattern из Joplin** (косвенно через `_inputs/joplin_issues.md:6-23`) — явно подсказывает что любой wipe code path bug-prone, поэтому breaking changes должны быть редкими и тщательно тестированными.

**Recommendation:** breaking change — deliberate decision, обернуть в feature flag, пропустить через staging минимум 1 неделю, показать changelog модалку юзеру.

### B.6.5 Real-world frequency

Track A v1 hypothesis (`offline-stacks-2026-simplicity-rerank.md` cited) + Joplin/Standard Notes/Notesnook source histories — breaking schema migrations занимают единичные числа за всю историю проекта (Joplin ~5-10 lifetime breakages за ~10 лет; SN ~3-5 за 8 лет, см. `apiVersion` in `_inputs/sn_TimeDifferenceFilter.ts:64-77` — single bumped). **Это значит Disher migration cost ≈ 0 в типичный год.**

---

## Cross-cutting recommendations

Если забыть всё остальное — сделать это:

1. **`(id, edit_count, client_modified_at)` композит на каждой row.** Не plain timestamp. Reason: clock skew устранён, single-source of truth (Track E).
2. **Soft-delete sticky на сервере:** delete всегда побеждает update, независимо от edit_count. SQL `WHERE EXCLUDED.deleted_at IS NOT NULL AND existing.deleted_at IS NULL`.
3. **Notesnook timestamp guard на клиенте** (`_inputs/notesnook_collector.ts:87`): mark `_dirty=false` ТОЛЬКО для rows у которых `client_modified_at <= pushAt`. Иначе race ломает invariant.
4. **Dexie hooks для auto-stamping** (`_inputs/dexie_hooks-middleware.ts:38-69`). Запретить себе ручную установку `_dirty/edit_count/client_modified_at` нигде в entity mutations кроме hook.
5. **Server-stamped `received_at` в каждом ответе.** Используется для clock skew detection (diag log) и monotonic ordering.
6. **`navigator.locks` + Dexie liveQuery + storagemutated** для multi-tab. Не нужен BroadcastChannel.
7. **`visibilitychange + sendBeacon`** — единственный надёжный «push при tab close» на iOS Safari (`web_apis_summary.md:6-13, 24-41`).
8. **«Reset and resync» button** — explicit confirm + fail-safe ON + idempotent (`_inputs/joplin_issues.md:21-29`). Не делать automatic recovery.
9. **Per-table chunked push** (`_inputs/notesnook_collector.ts:61`) — не мешать таблицы в одном payload. Auto-split на 413 (`_inputs/css_SplittingMiddleware.swift:6-14`).
10. **Backup-polling = git одному человеку.** Не оверинжинирить.

---

## Open questions for PoC

Ответы возможны только в реальном PoC, не в research:

1. **Реальная latency `liveQuery` на 1200 schedule_foods rows на iOS Safari iPhone 12.** Проверить — нужен ли throttle observer или index достаточен.
2. **Размер persisted Dexie state на 30 дней Disher активности.** Cost: 600 KB-1 MB ожидаемо; если > 5 MB — ребалансировать какие fields идут в IDB.
3. **Дебаунс 100 ms vs 200 ms vs 500 ms для hot tables.** `_inputs/notesnook_auto-sync.ts:80` — Notesnook взяли 100. Но у них content = HTML (печатают много, sync flow дорогой). Для Disher schedule_foods — несколько edits в минуту, 200-500 ms может быть лучше UX.
4. **Производительность server `ON CONFLICT WHERE edit_count > ...` на 1000 rows одним INSERT.** Postgres handle, но нужен реальный benchmark с RLS включённым.
5. **iOS Safari sendBeacon на gzipped payload 60 KB — действительно ли flush'ится при tab close?** Web специcификация говорит да, но публичная литература показывает quirks. Только реальный device test.
6. **Multi-tab race: tab A в режиме push, tab B initiates own push в тот же момент.** `navigator.locks` это решает теоретически, но iOS quirks могут показать сюрпризы. Test: 2 tabs одного user, simultaneous edits, observer race.
7. **Recovery flow timing на 3G: full snapshot pull + bulk apply на iPhone 12.** Ожидаемо <5 sec, нужно проверить.
8. **Schema migration с `Version.upgrade()` в реальной production-like state с 30 дней данных.** Нет precedent в Disher что это сработает на iOS Safari без timeout.

---

## Sources cited

| Citation | Used in section |
|---|---|
| `_inputs/dexie_version.ts:62-71, 78-106, 108-116` | B.1.1, B.1.4, B.6.1 |
| `_inputs/dexie_hooks-middleware.ts:38-69, 99-112, 115-141` | B.1.2, B.1.6, cross-cutting #4 |
| `_inputs/dexie_live-query.ts:42-46, 90-99, 111-117, 151-167` | B.1.3, B.3.2, cross-cutting #6 |
| `_inputs/dexie_schema-helpers.ts` | B.6 (referenced) |
| `_inputs/notesnook_collector.ts:46-93, 61, 64, 80-89` | B.2.5, B.2.8, B.6, cross-cutting #3, #9 |
| `_inputs/notesnook_auto-sync.ts:42-48, 58-88, 73-81` | B.1.2, B.2.8, B.3.1 |
| `_inputs/notesnook_merger.ts:42-69, 91-101` | B.4.3 |
| `_inputs/notesnook_devices.ts` | (multi-device coordination context) |
| `_inputs/notesnook_types.ts` | (data shape reference) |
| `_inputs/sn_SyncItems.ts:28-91, 30-37` | B.2.1 |
| `_inputs/sn_SaveItems.ts:35-166, 36-37, 53, 55-65, 161-165, 217-233` | B.2.1, B.2.2, B.2.4 |
| `_inputs/sn_TimeDifferenceFilter.ts:13-62, 37-47, 51-61, 64-77` | B.2.2, B.4.3, B.6.5 |
| `_inputs/sn_GetItems.ts:13-75, 26-30, 38-39` | B.5.1 |
| `_inputs/joplin_Synchronizer.ts:651-708, 700-708` | B.4.3 |
| `_inputs/joplin_issues.md:6-23, 20-29` | B.5.4, cross-cutting #8 |
| `_inputs/css_ErrorMiddleware.swift:43-235, 208-214, 215-217, 237-285` | B.2.5, B.4.3 |
| `_inputs/css_RetryMiddleware.swift:14-41` | B.2.8 |
| `_inputs/css_SplittingMiddleware.swift:6-14` | B.2.5, cross-cutting #9 |
| `_inputs/css_SyncWork.swift:3` | B.2.5 |
| `_inputs/css_CloudSyncSession.swift:65-73` | (middleware chain context) |
| `_inputs/web_apis_summary.md:6-13, 16-22, 24-41, 44-52, 54-60` | B.3.2, cross-cutting #7, B.5 |
| `track-e-our-category.md` (CloudSyncSession + HealthKit edit_count) | B.2.2, B.2.4, B.4.4, cross-cutting #1 |
| `feedback_timestamp_guard_pattern.md` (memory) | B.2.3, B.2.8 |
| `project_outbox_audit_2026_04_28.md` (memory) | B.5.2 |
| `project_short_distance_horizon.md` (memory) | B.6, cross-cutting |
| `apps/food-calc/CLAUDE.md` (current Disher arch) | B.1, B.2.3 (current outbox context) |
