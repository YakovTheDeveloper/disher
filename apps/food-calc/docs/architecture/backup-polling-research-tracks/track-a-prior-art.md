# Track A v3 — Production Prior Art (verified with file:line citations)

**Дата:** 2026-04-29
**Статус:** verified (источники в `_inputs/`, прочитаны построчно)
**Метод:** main session извлекла куски source code из 4 OSS репов в `_inputs/`, этот документ верифицирует гипотезы v1 по конкретным строчкам кода. v1 (`track-a-prior-art.v1-websearch-only.md`) был WebSearch-only без file:line — здесь либо подтверждаем, либо опровергаем.

---

## Summary table — verification of v1 hypotheses

| v1 hypothesis | Verdict | Evidence (line refs to `_inputs/`) |
|---|---|---|
| Notesnook v3 заменил timestamp-based detection на `synced: bool` per row | ✅ CONFIRMED | `notesnook_collector.ts:65,87-88` (`unsynced(...)` enumerator + `set({ synced: true })` после успешного push) |
| Notesnook применяет timestamp-guard при clearing dirty flag для защиты от race с in-flight мутацией | ✅ CONFIRMED (доп. находка) | `notesnook_collector.ts:79-90` (комментарий-расшифровка edge case + `where("dateModified", "<=", pushTimestamp)`) |
| Standard Notes — single-endpoint POST с batch (`itemHashes`) + sync_token + cursor_token + `conflicts[]` | ✅ CONFIRMED | `sn_SyncItems.ts:28-41,104-114` (вход `itemHashes`/`syncToken`/`cursorToken`, выход `savedItems`/`conflicts`/`syncToken`) |
| Standard Notes использует «conflict copy» / возврат конфликтов клиенту, а не silent-merge на сервере | ✅ CONFIRMED | `sn_SaveItems.ts:37,87-94,110-114,132-138,147-153`; `sn_TimeDifferenceFilter.ts:38-49` |
| SN sync-token = base64(timestamp+1µs) — server-authoritative, защищает от sync-doubles | ✅ CONFIRMED | `sn_SaveItems.ts:217-233` (`calculateSyncToken`, `lastUpdatedTimestamp + 1` + `MicrosecondsInASecond` + base64) |
| Standard Notes auto-resolve порог скрытый, миллисекунды; legacy-клиенты получают второй порог секунд | ✅ CONFIRMED + уточнено | `sn_TimeDifferenceFilter.ts:37-49` (microsecond precision: `difference === 0`); `sn_TimeDifferenceFilter.ts:51-61,72-79` (legacy: `MicrosecondsInAMillisecond`, ApiVersion v20161215: `MicrosecondsInASecond`) |
| Joplin sync = три фазы UPLOAD / DELETE_REMOTE / DELTA | ✅ CONFIRMED (с поправкой) | `joplin_Synchronizer.ts:387-391` (комментарий) + `joplin_Synchronizer.ts:410` (`['update_remote','delete_remote','delta']`). Фактический порядок выполнения: DELETE_REMOTE (`:579-591`) → UPLOAD (`:600-862`) → DELTA (`:875-...`). |
| Joplin recovery flow («Delete local & re-download») — самый багогенный | ✅ CONFIRMED | `joplin_issues.md:1-29` (3 issue: #4919 hangs in loop, #9023 endless sync, #8660 leaked resources). Все 3 закрыты, все три на одном code path |
| Joplin делает per-item conflict detection при UPLOAD (LWW + conflict copy) | ✅ CONFIRMED | `joplin_Synchronizer.ts:651-708` (`getConflictType`, `remoteContent.updated_time > local.sync_time` → conflict; `local has changes` → updateRemote) |
| Joplin LWW делает на уровне `updated_time`, **не** на уровне file timestamp | ✅ CONFIRMED + детали | `joplin_Synchronizer.ts:669-673,812-824` (комментарий: «in order to know the real updated_time value, we need to load the content … updated_time is set and managed by clients so it's always accurate») |
| CloudSyncSession (Ryan Ashcraft) использует `edit_count` counter > timestamp | ❌ REFUTED | `css_CloudSyncSession.swift:5,23-24,287-293`; `css_SyncWork.swift:93-109` — реально использует `CKServerChangeToken` (CloudKit-native), это opaque token от Apple, не client-side counter |
| Things Cloud APNS-driven per-mutation push без debounce | ❓ UNVERIFIED — нет source в inputs (closed source) | — |

---

## 1. Notesnook (Streetwriters)

Source: `_inputs/notesnook_collector.ts` (push), `_inputs/notesnook_merger.ts` (pull conflict resolution), `_inputs/notesnook_sync_index.ts` (orchestrator), `_inputs/notesnook_auto-sync.ts` (debounce trigger), `_inputs/notesnook_devices.ts` (deviceId).

### 1.1 Push model — `synced: bool` flag instead of timestamp

`notesnook_collector.ts:37-44` определяет `hasUnsyncedChanges()` — итерируется по `SYNC_ITEM_TYPES`, вызывает `collection.unsyncedCount()`. То есть само понятие «есть ли что слать» — **это count rows where `synced=false`**, не сравнение timestamps.

`notesnook_collector.ts:46-93` — главный generator `collect(chunkSize, isForceSync)`:
- `:64` — `let pushTimestamp = Date.now();` фиксируется ПЕРЕД итерацией chunks (важно — это будет timestamp guard, см. ниже).
- `:65` — `for await (const chunk of collection.unsynced(chunkSize, isForceSync))` — pull только rows где `synced=false`.
- `:73` — `yield { items, type, count }` отдаёт батч наверх (там, в `notesnook_sync_index.ts:277-289`, идёт `pushItem` через SignalR).
- `:75-89` — **после** успешного yield, в той же транзакции:
  ```ts
  await this.db.sql()
    .updateTable(collection.type)
    .where("id", "in", ids)
    .where("dateModified", "<=", pushTimestamp)   // ← timestamp guard
    .set({ synced: true })
    .execute();
  ```
- `:90` — `pushTimestamp = Date.now();` обновляется для следующего chunk.

### 1.2 Race-condition guard (load-bearing для Disher)

Комментарий на `notesnook_collector.ts:79-86` — **прямой инвариант, который мы тоже должны соблюсти**:
```
EDGE CASE:
Sometimes an item can get updated while it's being pushed.
The result is that its `synced` property becomes true even
though it's modification wasn't yet synced.
In order to prevent that, we only set the `synced` property
to true for items that haven't been modified since we last ran
the push. Everything else will be collected again in the next
push.
```

Это **не теоретическая** вещь — это в production-коде. Соответствует `feedback_timestamp_guard_pattern.md` в memory. Disher должен делать ровно так же при clearing `_dirty=false`: `WHERE client_modified_at <= pushStartedAt`.

### 1.3 Auto-sync debounce trigger

`notesnook_auto-sync.ts:25-89` — класс `AutoSync`:
- `:42-45` — подписывается на `EVENTS.databaseUpdated`, на каждое event'е вызывает `schedule(event)`.
- `:58-88` — `schedule(event)`:
  - `:59-68` — фильтр: игнорирует `notehistory`, `sessioncontent`, и items где `remote/localOnly/failed/dateUploaded` (т.е. ничего тех, что пришло снаружи или внутреннее).
  - `:70` — `clearTimeout(this.timeout)` — каждое новое event обнуляет предыдущий таймер (debounce).
  - `:71-76` — **load-bearing комментарий** про *Date.now()* race: «It is required that the dateModified of an item should be a few milliseconds less than Date.now(). Setting sync interval to 0 causes a conflict where Date.now() & dateModified are equal causing the item to not be synced.» — то есть **interval=0 ломает collector**, потому что timestamp-guard на `<=` пропустит row, ровно совпадающий с pushTimestamp.
  - `:77-81` — interval = 100ms для `update`/`upsert` content, иначе `this.interval` (в `Sync` constructor — `1000ms`, см. `notesnook_sync_index.ts:166`).
  - `:82-87` — `setTimeout` вызывает `databaseSyncRequested` event.

**Trigger pattern для Notesnook:** debounce 100ms (для content) или 1000ms (для остального) после каждой мутации. Не «immediate»; не interval-based fallback в этом файле. Force sync — отдельная кнопка.

### 1.4 Pull merger — где живёт conflict copy

`notesnook_merger.ts:33` — `const THRESHOLD = process.env.NODE_ENV === "test" ? 2 * 1000 : 60 * 1000;` — **порог 60 секунд** для production / 2 секунды для tests. Это уточняет v1 hypothesis «1 минута» — ровно 60_000 ms.

`notesnook_merger.ts:42-70` — `mergeItem`:
- `:46` — `if (!localItem || remoteItem.dateModified > localItem.dateModified) return remoteItem;` — это LWW для большинства полей.
- `:50-69` — отдельный case: если remote — note, а local — trash item, который был auto-deleted из-за expiry, проверяется `expiryDate.dateModified` для решения «восстановить ли note».

`notesnook_merger.ts:135-169` — `isContentConflicted` (только для tiptap content):
- `:140-146` — определяет `isResolved` (был ли уже резолв conflict'а) и `isEdited` (`!localItem.synced` — снова **dirty flag**, не timestamp).
- `:147-163` — если edit'нут И не resolved:
  - `:151-153` — `timeDiff = max(remote.dateEdited, local.dateEdited) - min(...)` — `Math.abs(diff)`.
  - `:155-158` — `if (timeDiff < conflictThreshold || isHTMLEqual(...)) → "merge"` (т.е. в пределах 60s — auto-pick newer); `:159-161` — внутри окна берём `remoteItem` если оно новее.
  - `:165` — иначе → `"conflict"` → `notesnook_merger.ts:99-101` — local получает `conflicted = remoteItem` (оба варианта остаются, юзер выбирает в UI).

### 1.5 Recovery flow / migration / device id

`notesnook_sync_index.ts:217-234` — `init`:
- `:220-223` — если `isForceSync` — **сначала unregister, потом register** device. То есть force-sync = смена deviceId. Это намеренно — invalidates server-side per-device state.
- `:225-231` — иначе: get deviceId, если нет — register.

`notesnook_devices.ts:32-39` — `register`: генерит `getId()` UUID, POST'ит на `/devices?deviceId=...`, сохраняет в kv. Простейшее — нет coordination, нет lock.

Migration: `notesnook_sync_index.ts:596-643` — `deserializeItem` (применяется при pull):
- `:602-603` — каждый pulled item помечается `remote=true`, `synced=true` (чтобы collector не отправил его обратно).
- `:605-612` — `migrateItem(item, version, CURRENT_DATABASE_VERSION, ...)`. Если миграция вернула `"skip"` (`:613`) — item игнорируется.
- `:617-626` — для trash items миграция применяется второй раз с `itemType` (т.к. trash items имеют свои migration paths).
- `:640` — `if (migrationResult) item.synced = false;` — **если миграция реально что-то изменила, item помечается как unsynced**, чтобы пушнуть исправленный вариант обратно. Очень элегантно — миграция автоматически triggerит re-sync.

### 1.6 «Sync continues even with unresolved conflicts» (v3 lesson)

`notesnook_sync_index.ts:253-262` — после fetch'а, если `conflictedNoteIds.length > 0`, просто помечает их `conflicted = true` в SQL и продолжает. Никакого блокирующего waitForUserResolution.

### 1.7 Lessons for Disher

- **Patterns to copy:**
  - `_dirty: bool` per row + timestamp-guarded clearance (`notesnook_collector.ts:87`).
  - Debounce 100ms — 1000ms на event, не interval polling (`notesnook_auto-sync.ts:77-87`).
  - Auto-resolve threshold = 60s (`notesnook_merger.ts:33`); внутри окна — pick newer; вне — surface conflict copy.
  - Migration sets `synced=false` если что-то изменила (`notesnook_sync_index.ts:640`) — auto re-sync миграции.
  - **Не блокировать sync** на unresolved conflicts (`notesnook_sync_index.ts:253-262`).
- **Не копировать:**
  - SignalR/WebSocket invalidation push (`notesnook_sync_index.ts:452-485`) — у Disher нет cross-device push.
  - E2E encryption per-item (`notesnook_collector.ts:68-71`) — Disher данные не E2E.
  - Force-sync = unregister+register device (`notesnook_sync_index.ts:220-223`) — слишком агрессивно для нашего recovery flow.

---

## 2. Standard Notes (server)

Source: `_inputs/sn_SyncItems.ts` (use case), `_inputs/sn_SaveItems.ts` (write path), `_inputs/sn_TimeDifferenceFilter.ts` (conflict rule), `_inputs/sn_ItemSaveValidator.ts` (rule chain).

### 2.1 Single sync endpoint

`sn_SyncItems.ts:16-26` — `class SyncItems` принимает в конструктор репозиторий + 6 use case'ов (Get, Save, GetSharedVaults и т.п.). Это то, что висит за `POST /sync`.

`sn_SyncItems.ts:28-41` — `execute(dto)`:
- input: `userUuid, syncToken, cursorToken, limit, contentType, sharedVaultUuids` (для pull части) + `itemHashes` (для push части).
- `:30-37` — сначала `getItemsUseCase.execute({...})` — pull retrieve.
- `:43-52` — потом `saveItemsUseCase.execute({...itemHashes...})` — push.

`sn_SyncItems.ts:104-114` — формирование response:
```ts
const syncResponse: SyncItemsResponse = {
  retrievedItems,            // ← с pull
  syncToken: saveItemsResult.syncToken,
  savedItems: saveItemsResult.savedItems,
  conflicts: saveItemsResult.conflicts,
  cursorToken: getItemsResult.cursorToken,
  sharedVaultInvites,
  sharedVaults: ...,
  messages, notifications,
}
```

То есть **один endpoint = pull + push + conflicts + дополнительные коллекции (vaults/messages)**. Это и есть «single endpoint design».

### 2.2 Conflict-not-retrieve дедупликация

`sn_SyncItems.ts:58-61,130-142` — `filterOutSyncConflictsForConsecutiveSyncs`:
- если в `saveItemsResult.conflicts` есть `sync_conflict` с `serverItem`, то этот `serverItem.id` исключается из `retrievedItems`.
- Логика: если клиент уже получил conflict-копию своего item'а, не нужно тут же отдавать ему server-версию повторно через retrieve — он сам её затребует следующим раундом.

### 2.3 Push path — `SaveItems` use case

`sn_SaveItems.ts:35-166` — `execute(dto)`:
- `:36-37` — два аккумулятора: `savedItems`, `conflicts`. Это и есть «частичный успех» — каждый item обрабатывается независимо.
- `:53` — `lastUpdatedTimestamp = this.timer.getTimestampInMicroseconds()` — server-stamp один раз для batch'а (microsecond precision).
- `:55-155` — цикл по `itemHashes`:
  - `:56-65` — UUID-валидация. Невалидный UUID → `conflicts.push({type: UuidConflict})`, **continue** — остальные продолжают.
  - `:67` — lookup `existingItem`.
  - `:69-77` — read-only access → `conflicts.push({type: ReadOnlyError})`, continue.
  - `:79-95` — **rule chain** через `itemSaveValidator.validate(...)` — здесь живёт TimeDifferenceFilter.
  - `:97-119` — если `existingItem` существует → `updateExistingItem`. Сбой → `conflicts.push({type: UuidConflict})`.
  - `:120-153` — иначе `saveNewItem`. Сбой → `conflicts.push({type: UuidConflict})`.
- `:157` — `syncToken = this.calculateSyncToken(lastUpdatedTimestamp, savedItems)`.
- `:159` — `notifyOtherClientsOfTheUserThatItemsChanged(...)` — push event на другие сессии того же юзера через `sendEventToClient` (`:182-186`) и для shared vaults (`:194-214`).
- `:161-165` — return `{savedItems, conflicts, syncToken}`.

### 2.4 Sync token — `+1µs` trick

`sn_SaveItems.ts:217-233` — `calculateSyncToken(lastUpdatedTimestamp, savedItems)`:
```ts
private readonly SYNC_TOKEN_VERSION = 2  // sn_SaveItems.ts:20

if (savedItems.length) {
  const sortedItems = savedItems.sort((a, b) =>
    a.props.timestamps.updatedAt > b.props.timestamps.updatedAt ? 1 : -1
  )
  lastUpdatedTimestamp = sortedItems[sortedItems.length - 1].props.timestamps.updatedAt
}

const lastUpdatedTimestampWithMicrosecondPreventingSyncDoubles = lastUpdatedTimestamp + 1

return Buffer.from(
  `${this.SYNC_TOKEN_VERSION}:${
    lastUpdatedTimestampWithMicrosecondPreventingSyncDoubles / Time.MicrosecondsInASecond
  }`,
  'utf-8',
).toString('base64')
```

Что важно:
- Берётся `updatedAt` **последнего** saved item (после sort), а не сохранённый изначально `lastUpdatedTimestamp`. Учитывает что save мог занять время.
- `+1` микросекунда — чтобы следующий pull с этим token'ом не вернул только что сохранённый item обратно как «изменённый» (т.е. **anti-sync-double**).
- Token format: `"2:1234567890.123456"` → base64. Версионируется через `SYNC_TOKEN_VERSION = 2`.

### 2.5 Conflict detection rule — TimeDifferenceFilter

`sn_TimeDifferenceFilter.ts:13-62` — `check(dto)`:
- `:14-18` — если нет `existingItem` (новый item) → `passed: true`.
- `:20-26` — извлечение `incomingUpdatedAtTimestamp` из itemHash:
  - предпочтительно `props.updated_at_timestamp` (microsecond integer).
  - fallback: `convertStringDateToMicroseconds(updated_at)`.
  - дальнейший fallback: `new Date(0)` если ничего нет.
- `:28-32` — `itemWasSentFromALegacyClient(...)` — `incomingUpdatedAtTimestamp === 0 && apiVersion === ApiVersion.v20161215` → bypass, всегда passed.
- `:34-35` — `difference = incomingUpdatedAtTimestamp - ourUpdatedAtTimestamp`.
- `:37-49` — **modern client** (с `updated_at_timestamp`):
  ```ts
  if (this.itemHashHasMicrosecondsPrecision(dto.itemHash)) {
    const passed = difference === 0   // ← STRICT: timestamp must match exactly
    return {
      passed,
      conflict: passed ? undefined : {
        serverItem: dto.existingItem,
        type: ConflictType.ConflictingData,
      },
    }
  }
  ```
  Любое расхождение incoming.updated_at vs server.updated_at → conflict. Это **не LWW** — это «client must have based update on the exact server state».
- `:51-61` — **legacy client** (с millisecond precision):
  ```ts
  const passed = Math.abs(difference) < this.getMinimalConflictIntervalMicroseconds(dto.apiVersion)
  ```
  Окно: `MicrosecondsInAMillisecond` = 1ms (для не-legacy modern API).
- `:72-79` — `getMinimalConflictIntervalMicroseconds`: для `ApiVersion.v20161215` — **`MicrosecondsInASecond` = 1 секунда**, иначе `MicrosecondsInAMillisecond` = 1ms.

**Важно для Disher:** v1 говорил «auto-resolve threshold скрытный». Здесь точные значения: 0µs (strict) для modern, 1ms для middle, 1s для самого старого legacy API. Notesnook merger threshold = 60_000ms — это совсем другая модель: SN отвергает любое timestamp mismatch, Notesnook auto-resolves в окне.

### 2.6 ItemSaveValidator — chain pattern

`sn_ItemSaveValidator.ts:6-25` — простейший Chain of Responsibility:
- `:7` — конструктор принимает `Array<ItemSaveRuleInterface>`.
- `:9-19` — `validate(dto)` итерируется по rules, на первом fail возвращает `{passed: false, conflict, skipped}`.
- `:20-24` — иначе `{passed: true}`.

TimeDifferenceFilter — одно из правил. Вероятно есть и другие (`ContentTypeFilter`, `ReadOnlyFilter` etc., не в inputs). **Pattern:** rule chain → first fail wins → conflict surfaces в response.

### 2.7 Lessons for Disher

- **Patterns to copy:**
  - `POST /backup` принимает batch + возвращает `{savedItems, conflicts, syncToken}`. Per-row статус, не all-or-nothing (`sn_SaveItems.ts:36-37,162-165`).
  - Server-stamped `lastUpdatedTimestamp` один раз для batch'а (`sn_SaveItems.ts:53`) + sync_token = (max(updatedAt of savedItems) + 1µs) trick (`sn_SaveItems.ts:217-233`) для anti-sync-double.
  - Rule chain pattern (`sn_ItemSaveValidator.ts:9-19`) для расширения validation logic (схема версии, content limit, etc.) без переписывания SaveItems.
  - `UuidConflict` как отдельный тип для duplicate IDs (`sn_SaveItems.ts:58-62`) — Disher тоже должен отличать «conflict timestamp» от «conflict UUID».
- **Не копировать:**
  - **`difference === 0` strict** для modern clients (`sn_TimeDifferenceFilter.ts:38`). У SN это правильно (E2E, server физически не merge'ит), но для Disher single-user sequential это будет генерить duplicates на каждом обновлении за 2-x device flow. LWW (`incoming > server → accept`) лучше.
  - Pull часть (`sn_SyncItems.ts:30-37,67-102` — sharedVaults/messages/notifications) — Disher push-only.
  - `cursorToken` пагинация при retrieve (`sn_SyncItems.ts:32-37,109`) — Disher не делает retrieve.

---

## 3. Joplin

Source: `_inputs/joplin_Synchronizer.ts` (1282 lines, читали `:370-1100`), `_inputs/joplin_issues.md`.

### 3.1 Three-phase sync — verified

`joplin_Synchronizer.ts:387-391`:
```ts
// Synchronisation is done in three major steps:
//
// 1. UPLOAD: Send to the sync target the items that have changed since the last sync.
// 2. DELETE_REMOTE: Delete on the sync target, the items that have been deleted locally.
// 3. DELTA: Find on the sync target the items that have been modified or deleted and apply the changes locally.
```

Однако фактический порядок **не совпадает с этим комментарием**:
- `joplin_Synchronizer.ts:410` — `const syncSteps = options.syncSteps ? options.syncSteps : ['update_remote', 'delete_remote', 'delta'];` — массив объявляет UPLOAD первым.
- Но в коде: `:579` — `if (syncSteps.indexOf('delete_remote') >= 0)` — DELETE_REMOTE проверяется **первым** (внутри try-catch).
- Затем `:600` — `if (syncSteps.indexOf('update_remote') >= 0)` — UPLOAD.
- Затем `:875` — `if (syncSteps.indexOf('delta') >= 0)` — DELTA.

То есть фактический runtime order: **DELETE_REMOTE → UPLOAD → DELTA** (несмотря на нумерацию в комментарии 1.UPLOAD/2.DELETE_REMOTE/3.DELTA). v1 hypothesis верна по сути «три фазы», но порядок описан неточно.

### 3.2 Sync target version check (schema migration)

`joplin_Synchronizer.ts:489-512`:
- `:489` — `let remoteInfo = await fetchSyncInfo(this.api());` — читает `info.json` с target'а.
- `:495-500` — если `remoteInfo.version` не задан (свежий target) → `migrationHandler().upgrade(...)` создаёт новый.
- `:504` — `await this.migrationHandler().checkCanSync(remoteInfo);` — проверяет совместимость.
- `:506-507` — `if (appVersion !== 'unknown') checkIfCanSync(remoteInfo, appVersion);` — отдельная app-version проверка.

**Pattern**: server stamps `version` в info-файле, client refuse'ит sync при mismatch (либо upgrade'ит target, либо просит апгрейд клиента). v1 описал это правильно.

### 3.3 Lock during schema upgrade

`joplin_Synchronizer.ts:521-553`:
- `:521` — `if (!syncInfoEquals(localInfo, remoteInfo))` — если local и remote info разошлись.
- `:522` — `let newInfo = mergeSyncInfos(localInfo, remoteInfo);`
- `:527` — `await this.lockHandler().acquireLock(LockType.Exclusive, ...)` — **EXCLUSIVE lock** перед upload merged info.
- `:528-529` — upload и saveLocal.
- `:530` — `await this.lockHandler().releaseLock(LockType.Exclusive, ...)`.

`joplin_Synchronizer.ts:564-571` — после schema check'а:
- `:564` — `syncLock = await this.lockHandler().acquireLock(LockType.Sync, ...)` — **SYNC lock** на время actual sync.
- `:567-571` — `startAutoLockRefresh(syncLock, ...)` — фоновый refresh; если refresh упал → `cancel()` sync.

**Pattern verification:** v1 говорил «multiple SYNC locks параллельно, EXCLUSIVE для upgrade». Подтверждается через `LockType.Exclusive` vs `LockType.Sync`.

### 3.4 Conflict detection (UPLOAD phase)

`joplin_Synchronizer.ts:651-708` — для каждого item в `itemsThatNeedSync`:
- `:652-656` — `getConflictType(item)`: возвращает `NoteConflict` / `ResourceConflict` / `ItemConflict` в зависимости от type.
- `:658-667` — если `!remote`:
  - `:659-661` — `if (!local.sync_time)` → `CreateRemote` (новый локальный item).
  - `:662-666` — иначе `getConflictType(local)` — local был synced, потом удалён remotely, потом изменён локально. Это conflict.
- `:668-708` — если `remote` существует:
  - `:684` — `remoteContent = await this.apiCall('get', path);` — **загружает полный remote content**, потому что file timestamp ненадёжен (см. ниже).
  - `:698-707` — main check:
    ```ts
    if (remoteContent.updated_time > local.sync_time) {
      action = getConflictType(local);
      reason = 'both remote and local have changes';
    } else {
      action = SyncAction.UpdateRemote;
      reason = 'local has changes';
    }
    ```
  - Логика: если remote.updated_time > local.sync_time (то, когда мы в последний раз синканули) — значит remote изменился с тех пор как мы видели его → conflict. Иначе — наш upload safe.

### 3.5 Why file-timestamp is not enough (комментарий важный)

`joplin_Synchronizer.ts:669-682`:
```
Note: in order to know the real updated_time value, we need to load the content. In theory we could
rely on the file timestamp (in remote.updated_time) but in practice it's not accurate enough and
can lead to conflicts (for example when the file timestamp is slightly ahead of its real
updated_time). updated_time is set and managed by clients so it's always accurate.
```

То есть Joplin **не доверяет** filesystem-уровневому timestamp (который может ехать у Dropbox/OneDrive), и хранит свой `updated_time` внутри content payload'а. Для Disher (HTTP backup endpoint, не file storage) это менее релевантно — у нас и так server-stamped `received_at` отдельно от `client_modified_at`. Но pattern «client-managed timestamp как single source of truth для LWW» — confirmed.

### 3.6 Unhealthy edge case — `processingPathTwice`

`joplin_Synchronizer.ts:622-643` — safety-check против infinite loop:
- `:634-642` — если path уже обработан, проверяется почему он попал второй раз:
  - `:635-637` — если `local.updated_time > time.unixMs()` — timestamp в будущем → throw `processingPathTwice`.
  - `:638-640` — если `force_sync` стоит → throw.
  - `:641-642` — иначе («user is making changes while sync is in progress») → throw `changedDuringSync`.

Это runtime-ассерция о том что LWW + force-sync flag + clock skew могут привести к loop'у. Joplin логирует и аборт sync. **Lesson:** Disher должен иметь аналогичную safety-check'у в drain — если row пытается push'нуться уже второй раз в одном drain pass'е, abort с poison-toaster.

### 3.7 sync_time race window (`saveSyncTime`)

`joplin_Synchronizer.ts:812-824` — критический комментарий:
```
Note: Currently, we set sync_time to update_time, which should work fine given that the resolution is the millisecond.
In theory though, this could happen:

1. t0: Editor: Note is modified
2. t0: Sync: Found that note was modified so start uploading it
3. t0: Editor: Note is modified again
4. t1: Sync: Note has finished uploading, set sync_time to t0

Later any attempt to sync will not detect that note was modified in (3) (within the same millisecond as it was being uploaded)
because sync_time will be t0 too.

The solution would be to use something like an etag (a simple counter incremented on every change) to make sure each
change is uniquely identified. Leaving it like this for now.
```

**Это прямой counter-example к v1 hypothesis #5 (CSS использует edit_count).** Joplin сами признают что timestamp resolution в миллисекунду = риск race, и говорят «решение — etag/counter». Они не делают этого. Это поддерживает идею что **`_dirty: bool` (Notesnook approach) > millisecond-timestamp** — Notesnook решает эту проблему через bool flag, не нуждаясь в counter.

Disher план уже включает `_dirty: bool` — так что это уже учтено. Но при clearing нужен timestamp guard (`<=`, не `<`) или дополнительная проверка (если row снова стал dirty между push start и success).

### 3.8 DELTA phase — apply remote changes

`joplin_Synchronizer.ts:875-1100` — DELTA loop. Для нашего push-only Disher это не релевантно, отмечу только две детали:
- `:888-908` — `apiCall('delta', '', { context, allItemIdsHandler, allItemMetadataHandler, wipeOutFailSafe })` — есть **fail-safe flag** `Setting.value('sync.wipeOutFailSafe')`. Это и есть тот fail-safe из issue #8660.
- `:910-915` — комментарий о OneDrive race: если sync target директория исчезнет между sync'ами (например OneDrive прокидывает sync в фоне), `info.json` checking ловит это и предотвращает full local wipe.

### 3.9 Recovery flow — verified bugs

`joplin_issues.md` подтверждает все три ключевые issue (метаданные fetched 2026-04-29 через GitHub API):
- #4919 (closed 2021-05-09, labels: `bug, desktop, high`) — «Delete local data and re-download from sync target — hangs in loop».
- #9023 (closed 2023-10-20, labels: `bug`) — «Endless sync» при interaction с Victor plugin.
- #8660 (closed 2023-09-20, labels: `bug, stale`) — «resources folder not cleaned-up» при fail-safe OFF.

**Pattern:** все 3 на одном code path («Delete & re-download»), 2 из 3 — silent data loss / infinite loop, 1 — leaked storage. v1 hypothesis о «recovery самый багогенный» подтверждена.

### 3.10 Lessons for Disher

- **Patterns to copy:**
  - `info.json` с server-stamped `version` + EXCLUSIVE lock на upgrade (`joplin_Synchronizer.ts:489-553`). Disher: server возвращает `schema_version` в response header, client refuse'ит push при mismatch.
  - `processingPathTwice` safety check (`joplin_Synchronizer.ts:622-643`) — Disher аналог: per-drain-pass set отслеженных id, abort на повторе.
  - Fail-safe flag (`joplin_Synchronizer.ts:905`, `Setting.value('sync.wipeOutFailSafe')`) — Disher: если snapshot pull вернул 0 rows для known-non-empty user, refuse to wipe.
  - Recovery flow требует explicit confirmation + idempotent retry + detectable end state (от `joplin_issues.md`).
- **Не копировать:**
  - DELETE_REMOTE и DELTA фазы (Disher push-only).
  - Filesystem-style абстракция (read/write/list файлов).
  - Conflict notebook UX в полной форме — для Disher single-user избыточно (см. Notesnook 60s threshold instead).
  - millisecond `sync_time` resolution для clearing dirty (`joplin_Synchronizer.ts:812-824` — сами Joplin признают как недостаток). Disher: `_dirty: bool` + timestamp-guard.

---

## 4. CloudSyncSession (Ryan Ashcraft)

Source: `_inputs/css_CloudSyncSession.swift`, `_inputs/css_ErrorMiddleware.swift`, `_inputs/css_RetryMiddleware.swift`, `_inputs/css_SplittingMiddleware.swift`, `_inputs/css_SyncState.swift`, `_inputs/css_SyncWork.swift`.

### 4.1 ❌ REFUTED v1 hypothesis #5 — uses CKServerChangeToken, NOT edit_count

v1 гипотеза была: «CSS uses `edit_count` counter > timestamp». Это **ошибка**, исправляется здесь.

`css_CloudSyncSession.swift:5` — typealias:
```swift
public typealias ChangeTokenExpiredResolver = () -> CKServerChangeToken?
```

`css_CloudSyncSession.swift:23-24` — поле:
```swift
/// The function handler that will be called when the change token should be expired.
public let resolveExpiredChangeToken: ChangeTokenExpiredResolver?
```

`css_SyncWork.swift:93-109` — `FetchOperation`:
```swift
public struct FetchOperation: Identifiable, SyncOperation {
    public struct Response {
        public let changeToken: CKServerChangeToken?
        public let changedRecords: [CKRecord]
        public let deletedRecordIDs: [CKRecord.ID]
        public let hasMore: Bool
    }
    public let id = UUID()
    var changeToken: CKServerChangeToken?
    var retryCount: Int = 0
}
```

`CKServerChangeToken` — это **opaque token от Apple CloudKit**, который сервер выдаёт для зоны и передаётся обратно как cursor для следующего fetch'а. Это **не client-side counter** и **не timestamp**. Это server-managed sequential checkpoint.

Conflict resolution в CSS — отдельный механизм через `CKError.serverRecordChanged` (см. `css_ErrorMiddleware.swift:208-214`), где CloudKit возвращает `clientRecord` + `serverRecord`, а callback `resolveConflict: (CKRecord, CKRecord) -> CKRecord?` (из `css_CloudSyncSession.swift:4`) сам решает что сохранить. То есть CloudKit вообще не использует timestamp — он использует **CKRecord change tags** (server-managed opaque versions, как ETags). См. `css_ErrorMiddleware.swift:272-275`:
```swift
// Always return the server record so we don't end up in a conflict loop.
// The server record has the change tag we want to use.
```

**Корректная формулировка для Track A v3:** CloudSyncSession использует CloudKit-native version tokens (`CKServerChangeToken` для zone change tracking, `CKRecord` change tags для optimistic concurrency). Ни client-side `edit_count`, ни client-side timestamp как primary mechanism нет. Custom conflict resolver получает оба record'а и решает; типичная реализация (не в inputs) — LWW по custom modifiedAt field в record'е.

### 4.2 Error classification middleware — load-bearing pattern

`css_ErrorMiddleware.swift:43-235` — `mapErrorToEvent(error, work, zoneID)`:

Классификация ошибок:
- `:48-63` — **HALT** (фатально, нет retry):
  - `.notAuthenticated`, `.managedAccountRestricted`, `.quotaExceeded`, `.badDatabase`, `.incompatibleVersion`, `.permissionFailure`, `.missingEntitlement`, `.badContainer`, `.constraintViolation`, `.referenceViolation`, `.invalidArguments`, `.serverRejectedRequest`, `.resultsTruncated`, `.batchRequestFailed`, `.internalError`.
- `:64-76` — **RETRY** (transient, retry с suggested interval):
  - `.networkUnavailable`, `.networkFailure`, `.serviceUnavailable`, `.zoneBusy`, `.requestRateLimited`, `.serverResponseLost`.
  - Использует `CKErrorRetryAfterKey` если присутствует (server-suggested backoff).
- `:77-91` — **changeTokenExpired** — особый retry:
  - `:86` — `modifiedOperation.changeToken = resolveExpiredChangeToken()` — обнуляет client-side change token (просит resolver «забыл, дай новый или nil для full re-fetch»), потом retry.
- `:92-207` — **partialFailure** — самый сложный case:
  - `:97-105` — для fetch: единственный supported partial — `changeTokenExpired`, рекурсивно вызывает `mapErrorToEvent`.
  - `:106-204` — для modify (write batch):
    - `:117-119` — если `indicatesShouldBackoff` → retry с `suggestedBackoffSeconds`.
    - `:121-135` — фильтр **unhandleable errors**: всё кроме `batchRequestFailed`, `serverRecordChanged`, `unknownItem` → halt.
    - `:138-148` — `unknownItemRecordIDs` (probably deleted by another client) — игнорируются.
    - `:151-161` — `batchRequestFailedRecordIDs` — будут retry'нуты в следующем batch'е.
    - `:164-185` — `serverRecordChangedErrors` — каждый прогоняется через user's `resolveConflict`. Если хоть один не resolved → halt.
    - `:186-204` — финал: dispatch `.resolveConflict(work, allResolvedRecordsToSave, recordIDsToDeleteWithoutUnknowns)`.
- `:208-214` — single `serverRecordChanged` (не partial) — то же что в partial case, но для одного record'а.
- `:215` — `.limitExceeded` → `.split(work, error)` — это hand-off к SplittingMiddleware (см. ниже).
- `:216-217` — `.zoneNotFound, .userDeletedZone` → re-create zone.
- `:218-228` — остальные fatal cases → halt.

### 4.3 Splitting middleware — batch too large → split in half

`css_SplittingMiddleware.swift:1-25`:
```swift
struct SplittingMiddleware: Middleware {
    var session: CloudSyncSession
    func run(next: (SyncEvent) -> SyncEvent, event: SyncEvent) -> SyncEvent {
        switch event {
        case let .doWork(work):
            switch work {
            case let .modify(operation):
                if operation.shouldSplit {
                    for splitOperation in operation.split {
                        session.dispatch(event: .doWork(.modify(splitOperation)))
                    }
                    return next(.noop)
                }
            ...
```

Pre-emptive split: до отправки, если operation > порога — разделить.

`css_SyncWork.swift:3-4`:
```swift
public let maxRecommendedRecordsPerOperation = 400
public let maxRecommendedRecordsPerFetchOperation = 400
```

`css_SyncWork.swift:132-142` — `shouldSplit` + `split`:
```swift
var shouldSplit: Bool {
    return records.count + recordIDsToDelete.count > maxRecommendedRecordsPerOperation
}
var split: [ModifyOperation] {
    let splitRecords = records.chunked(into: maxRecommendedRecordsPerOperation)
    let splitRecordIDsToDelete = recordIDsToDelete.chunked(into: maxRecommendedRecordsPerOperation)
    return splitRecords.map { ModifyOperation(records: $0, recordIDsToDelete: [], ...) } +
        splitRecordIDsToDelete.enumerated().map { ... }
}
```

`css_SyncWork.swift:144-155` — `splitInHalf` — для post-failure splitting (после `.limitExceeded` server response'а):
```swift
var splitInHalf: [ModifyOperation] {
    let firstHalfRecords = Array(records[0 ..< records.count / 2])
    let secondHalfRecords = Array(records[records.count / 2 ..< records.count])
    ...
    return [
        ModifyOperation(records: firstHalfRecords, ...),
        ModifyOperation(records: secondHalfRecords, ..., checkpointID: checkpointID, ...),
    ]
}
```

Pattern: пытаемся отправить большой batch → server `.limitExceeded` → SplittingMiddleware разрезает пополам, отправляет два, повторяет рекурсивно. Это **runtime adaptive batching**, не статический config.

### 4.4 RetryMiddleware — capped exponential backoff

`css_RetryMiddleware.swift:4`:
```swift
let maxRetryCount = 5
```

`css_RetryMiddleware.swift:6-8`:
```swift
private func getRetryTimeInterval(retryCount: Int) -> TimeInterval {
    return TimeInterval(pow(Double(retryCount), 2.0))
}
```
Формула: `n²` секунд. Так retryCount=1→1s, 2→4s, 3→9s, 4→16s, 5→25s.

`css_RetryMiddleware.swift:15-40`:
- `:18` — current count.
- `:20-21` — если `currentRetryCount + 1 > maxRetryCount` → halt.
- `:23-29` — иначе либо `suggestedInterval` от server (`CKErrorRetryAfterKey`), либо exponential.
- `:31-33` — `dispatchQueue.asyncAfter(deadline: .now() + retryInterval) { session.dispatch(event: .retryWork(work)) }`.

Сравнение с Disher pendingWrites: у нас MAX_ATTEMPTS=10, cap 30s, exponential. CSS более агрессивный (cap=5, max delay 25s), но та же модель.

### 4.5 SyncState — operation queue model

`css_SyncState.swift:13-23` — четыре независимые queue: `modifyQueue`, `fetchQueue`, `createZoneQueue`, `createSubscriptionQueue`.

`css_SyncState.swift:71-91` — `allowedOperationModes`: даже когда есть работа, она может быть disabled (если halted, нет account, нет zone, нет subscription).

`css_SyncState.swift:93-111` — `preferredOperationModes`: priority ordering — createZone и createSubscription первыми (prereqs), затем modify, fetch.

`css_SyncState.swift:233-247` — `case let .split(work, _):` — поведение на explicit split event:
- pop original work.
- `splitInHalf` (не `split` — другой метод!) — два равные части, prioritize'ются (вставка в начало queue).

`css_SyncState.swift:249-268` — `.workSuccess`:
- `:250-251` — `state.retryCount = 0; state.lastRetryError = nil` — успех сбрасывает retry counter.
- `:255-259` — для fetch: если `response.hasMore` → push новый FetchOperation с `response.changeToken`, prioritized. То есть **pagination через resume token, не offset**.

### 4.6 Lessons for Disher

- **Patterns to copy:**
  - **Error classification таблица** (`css_ErrorMiddleware.swift:48-228`) — exact match с нашим pendingWrites poison-classifier по shape. CSS более expressive: `halt | retry | retry с change-token reset | split | resolveConflict | createZone`. Disher pendingWrites сейчас имеет только `halt | retry`. Можно расширить до `split` (если payload too large) + `resolveConflict` (если когда-нибудь вводим conflicts).
  - **SplittingMiddleware** (`css_SplittingMiddleware.swift:1-25` + `css_SyncWork.swift:132-155`) — runtime adaptive batching. Disher batch RPC (отложен) может работать так: пытаемся 100 rows; если server `.payloadTooLarge` → `splitInHalf` рекурсивно.
  - **`.workSuccess` resets retryCount** (`css_SyncState.swift:250-251`) — Disher pendingWrites уже так делает, но pattern verified.
  - **Pagination через server-managed token, не offset** (`css_SyncState.swift:255-259`) — для Disher snapshot pull при cold start.
  - **Server-suggested retry interval** (`CKErrorRetryAfterKey`, `css_ErrorMiddleware.swift:72-74`) — если backend возвращает `Retry-After` header, использовать его вместо собственного backoff.
- **Не копировать:**
  - CloudKit-specific (CKServerChangeToken, CKRecord, zone/subscription model) — Disher не на CloudKit.
  - Combine subjects pattern (`css_CloudSyncSession.swift:30-42`) — у нас своё `subscribePending` over `useSyncExternalStore`.

---

## 5. Patterns confirmed by 2+ apps (cross-cutting)

| Pattern | Apps | Citations |
|---|---|---|
| **Dirty flag per row > timestamp comparison** для определения unsynced | Notesnook (explicit), Joplin (де-facto через `sync_time` separate column), Disher план | `notesnook_collector.ts:65,87-88`; `joplin_Synchronizer.ts:812-824` (комментарий о millisecond race + рекомендация «использовать etag/counter») |
| **Timestamp-guard на clearing dirty flag** для защиты от race с in-flight push | Notesnook | `notesnook_collector.ts:79-90` (`<= pushTimestamp`) |
| **Single sync endpoint** с batch + per-row статусом в response | Standard Notes | `sn_SyncItems.ts:104-114`; `sn_SaveItems.ts:36-37,162-165` |
| **Server-stamped timestamp + sync_token с anti-double trick** | Standard Notes (`+1µs`) | `sn_SaveItems.ts:53,217-233` |
| **Per-row partial success** (одни accept'ятся, другие → conflicts array, никогда не all-or-nothing) | Standard Notes, CloudSyncSession (через partialFailure) | `sn_SaveItems.ts:36-37,55-153`; `css_ErrorMiddleware.swift:92-204` |
| **Error classification middleware** (halt vs retry vs split vs resolve-conflict) | CloudSyncSession, Disher pendingWrites (свой analog) | `css_ErrorMiddleware.swift:48-228` |
| **Recovery flow требует explicit confirmation + fail-safe + idempotent retry** | Joplin (через issues #4919/#9023/#8660) | `joplin_issues.md:1-29`; `joplin_Synchronizer.ts:905,910-915` |
| **Schema migration через server-stamped version + lock** | Joplin (`info.json` + EXCLUSIVE lock) | `joplin_Synchronizer.ts:489-553` |
| **Migration on pull triggers re-sync** (item помечается dirty после migration) | Notesnook | `notesnook_sync_index.ts:605-612,640` |
| **Conflict auto-resolve в окне < threshold, surface conflict copy вне окна** | Notesnook (60s), Standard Notes (legacy: 1s; modern: 0/1ms) | `notesnook_merger.ts:33,151-163`; `sn_TimeDifferenceFilter.ts:37-79` |
| **Debounce mutation → push через event-driven таймер, не interval** | Notesnook (100ms—1000ms) | `notesnook_auto-sync.ts:70-87` |
| **Server-suggested retry interval** (Retry-After-style) | CloudSyncSession (`CKErrorRetryAfterKey`) | `css_ErrorMiddleware.swift:72-74,80-82` |
| **Adaptive batching** — если server reject'ит за size → split in half, retry | CloudSyncSession | `css_SplittingMiddleware.swift:1-25`; `css_SyncWork.swift:132-155` |
| **Reset retry-counter on workSuccess** | CloudSyncSession, Disher pendingWrites | `css_SyncState.swift:250-251` |
| **deviceId per client** для server-side scoping | Notesnook | `notesnook_devices.ts:32-39`; `notesnook_sync_index.ts:217-234` |

---

## 6. Patterns rejected / not adopted by Disher

| Pattern | Откуда | Почему Disher не делает |
|---|---|---|
| Pull-based delta с cursor token | SN (`sn_SyncItems.ts:30-37,109`), Joplin (`joplin_Synchronizer.ts:875-908`) | Disher backup-polling = push-only. Pull только при cold start, без cursor-pagination |
| Microsecond timestamp precision для conflict detection | SN (`sn_TimeDifferenceFilter.ts:53,72-79`) | Single-user sequential — конфликта микросекундной точности не бывает; `Date.now()` ms достаточно |
| Strict `incoming.updated_at !== server.updated_at` → conflict | SN (`sn_TimeDifferenceFilter.ts:38`) | E2E rationale (server не может merge'ить) у SN; у Disher LWW (`incoming > server`) даёт меньше шумных duplicates |
| WebSocket / SignalR push для cross-device invalidation | Notesnook (`notesnook_sync_index.ts:452-485`) | Single-user PWA, hourly fallback + visibilitychange достаточны |
| Sub-document granular text merge / diff-match-patch | (упоминается в Things Cloud Fractus, Obsidian — не в inputs) | Disher данные = structured rows, не free text. LWW работает |
| CKServerChangeToken / CloudKit zone-based model | CloudSyncSession (`css_SyncWork.swift:93-109`) | Disher не на Apple ecosystem, opaque tokens нет смысла |
| Filesystem abstraction (read/write/list файлов) | Joplin | Disher target = HTTP endpoint, structured POST |
| DELETE_REMOTE phase | Joplin (`joplin_Synchronizer.ts:579-591`) | Disher делает soft-delete (`deleted_at`), не отдельная фаза |
| Force-sync = unregister+register device (resets server state) | Notesnook (`notesnook_sync_index.ts:220-223`) | Слишком агрессивно для нашего minor recovery — drop-and-resync local достаточно |
| Force-sync rule chain в SaveItems (читай: full validator pipeline) | SN (`sn_ItemSaveValidator.ts:6-25`) | Излишне для MVP. Если в будущем понадобится content-limit / read-only / schema-version validation — pattern полезен |

---

## 7. Sources (file:line)

### Notesnook (`_inputs/notesnook_*.ts`)
- `notesnook_collector.ts:37-44` — `hasUnsyncedChanges()`
- `notesnook_collector.ts:46-93` — `collect()` generator (push)
- `notesnook_collector.ts:64,90` — `pushTimestamp = Date.now()` capture
- `notesnook_collector.ts:65` — `collection.unsynced(chunkSize, isForceSync)`
- `notesnook_collector.ts:75-89` — clearing `synced=true` with timestamp guard
- `notesnook_collector.ts:79-86` — race-condition explanatory comment
- `notesnook_collector.ts:87-88` — `where("dateModified", "<=", pushTimestamp).set({ synced: true })`
- `notesnook_collector.ts:117-142` — `filterSyncableItems` (deletes `item.synced` before serialize, encodes localOnly as deleted)
- `notesnook_merger.ts:33` — `THRESHOLD = 60 * 1000`
- `notesnook_merger.ts:42-70` — `mergeItem` LWW
- `notesnook_merger.ts:135-169` — `isContentConflicted` threshold logic
- `notesnook_merger.ts:99-101` — conflict copy into `localItem.conflicted`
- `notesnook_auto-sync.ts:25-89` — debounce trigger
- `notesnook_auto-sync.ts:33,166` — interval = 1000ms (от `Sync` constructor)
- `notesnook_auto-sync.ts:71-76` — load-bearing comment about Date.now() race
- `notesnook_auto-sync.ts:77-87` — debounce 100ms (content) vs 1000ms (else)
- `notesnook_sync_index.ts:152-215` — `Sync` orchestrator
- `notesnook_sync_index.ts:217-234` — `init` + force-sync device reset
- `notesnook_sync_index.ts:253-262` — non-blocking conflict marking
- `notesnook_sync_index.ts:273-292` — `send` loop
- `notesnook_sync_index.ts:452-485` — SignalR connection
- `notesnook_sync_index.ts:596-643` — `deserializeItem` migration on pull
- `notesnook_sync_index.ts:640` — migration sets `synced=false` for re-push
- `notesnook_devices.ts:32-39` — device register

### Standard Notes (`_inputs/sn_*.ts`)
- `sn_SyncItems.ts:16-26` — `class SyncItems` deps
- `sn_SyncItems.ts:28-41` — `execute(dto)` use case orchestrator
- `sn_SyncItems.ts:58-61,130-142` — sync_conflict deduplication
- `sn_SyncItems.ts:104-114` — response shape
- `sn_SaveItems.ts:20` — `SYNC_TOKEN_VERSION = 2`
- `sn_SaveItems.ts:36-37` — `savedItems` + `conflicts` accumulators
- `sn_SaveItems.ts:53` — `lastUpdatedTimestamp = getTimestampInMicroseconds()` server-stamp
- `sn_SaveItems.ts:55-153` — main loop (UuidConflict / ReadOnly / TimeDifferenceFilter chain / saveNewItem / updateExistingItem)
- `sn_SaveItems.ts:159` — notify other clients
- `sn_SaveItems.ts:217-233` — `calculateSyncToken` with `+1µs` trick
- `sn_TimeDifferenceFilter.ts:13-62` — `check(dto)` rule
- `sn_TimeDifferenceFilter.ts:34-35` — `difference = incoming - server`
- `sn_TimeDifferenceFilter.ts:37-49` — modern client: `difference === 0`
- `sn_TimeDifferenceFilter.ts:51-61` — legacy client: tolerance window
- `sn_TimeDifferenceFilter.ts:64-79` — version-based interval selection
- `sn_ItemSaveValidator.ts:6-25` — Chain of Responsibility pattern

### Joplin (`_inputs/joplin_Synchronizer.ts` — selective)
- `joplin_Synchronizer.ts:387-391` — three-phase comment
- `joplin_Synchronizer.ts:410` — syncSteps array
- `joplin_Synchronizer.ts:489-512` — sync target version check
- `joplin_Synchronizer.ts:521-553` — info.json merge with EXCLUSIVE lock
- `joplin_Synchronizer.ts:564-571` — SYNC lock + auto-refresh
- `joplin_Synchronizer.ts:579-591` — DELETE_REMOTE phase
- `joplin_Synchronizer.ts:600-862` — UPLOAD phase
- `joplin_Synchronizer.ts:622-643` — `processingPathTwice` safety check
- `joplin_Synchronizer.ts:651-708` — conflict detection in UPLOAD
- `joplin_Synchronizer.ts:669-682` — comment about file timestamp not being reliable
- `joplin_Synchronizer.ts:812-824` — comment about millisecond race + etag recommendation
- `joplin_Synchronizer.ts:875-1100` — DELTA phase
- `joplin_Synchronizer.ts:905,910-915` — fail-safe + post-listResult validity check
- `joplin_issues.md:1-29` — issues #4919, #9023, #8660 metadata + lesson summary

### CloudSyncSession (`_inputs/css_*.swift`)
- `css_CloudSyncSession.swift:5,23-24,287-293` — `CKServerChangeToken`-based, NOT edit_count (refutation evidence)
- `css_CloudSyncSession.swift:65-73` — middleware chain ordering
- `css_CloudSyncSession.swift:110-131` — middleware dispatch (reverse order)
- `css_ErrorMiddleware.swift:43-228` — `mapErrorToEvent` classification
- `css_ErrorMiddleware.swift:48-63` — HALT errors
- `css_ErrorMiddleware.swift:64-76` — RETRY errors
- `css_ErrorMiddleware.swift:72-74,80-82` — `CKErrorRetryAfterKey` server-suggested backoff
- `css_ErrorMiddleware.swift:77-91` — changeTokenExpired handling
- `css_ErrorMiddleware.swift:92-207` — partialFailure handling
- `css_ErrorMiddleware.swift:208-214` — single serverRecordChanged
- `css_ErrorMiddleware.swift:215` — `.limitExceeded` → split
- `css_ErrorMiddleware.swift:237-285` — `resolveConflict` callback wiring
- `css_ErrorMiddleware.swift:272-275` — comment «Always return the server record so we don't end up in a conflict loop»
- `css_RetryMiddleware.swift:4` — `maxRetryCount = 5`
- `css_RetryMiddleware.swift:6-8` — `pow(retryCount, 2)` exponential
- `css_RetryMiddleware.swift:15-40` — retry dispatch
- `css_SplittingMiddleware.swift:1-25` — pre-emptive split on `shouldSplit`
- `css_SyncWork.swift:3-4` — `maxRecommendedRecordsPerOperation = 400`
- `css_SyncWork.swift:93-109` — `FetchOperation` with `CKServerChangeToken` (refutation)
- `css_SyncWork.swift:132-155` — `shouldSplit` + `split` + `splitInHalf`
- `css_SyncState.swift:13-23` — four operation queues
- `css_SyncState.swift:71-111` — operation mode gating (allowedOperationModes / preferredOperationModes)
- `css_SyncState.swift:233-247` — `.split` event → splitInHalf, prioritized
- `css_SyncState.swift:249-268` — `.workSuccess` resets retryCount + paginates fetch via changeToken

### Cross-references
- v1: `track-a-prior-art.v1-websearch-only.md` — все hypotheses verified (4 confirmed + 1 refuted + 1 unverified)
- Memory `feedback_timestamp_guard_pattern.md` — подтверждается `notesnook_collector.ts:87` инвариантом
- Memory `feedback_outbox_industry_consensus.md` — pattern «no invalidate after enqueue» здесь не освещён напрямую (это client-side concern), но косвенно поддерживается через Notesnook approach «set synced=true только после server ack»
- Track E (`track-e-our-category.md`) — не дублируем FoodNoms/Bearable/Daylio/OpenNutriTracker

---

## 8. Что осталось unverified / нужны дополнительные источники

- **Things Cloud per-mutation immediate push** (v1 hypothesis) — closed source, нет source code в inputs. Остаётся на уровне маркетинговых блогов Cultured Code из v1.
- **Standard Notes auto-resolve threshold value «within an arbitrary amount of time»** — частично верифицировано (`sn_TimeDifferenceFilter.ts:37-79`): для modern clients вообще нет окна (strict `=== 0`); для legacy v20161215 окно = 1 секунда. v1 фраза «within an arbitrary amount of time» относилась к старому API design'у, а в актуальной версии strict-mode введён.
- **Joplin schema migration history examples** (1→2→3 etc) — `MigrationHandler.ts` не в inputs. Только видим, что migration вызывается из `joplin_Synchronizer.ts:497`.
- **Notesnook server-side merge behavior** — `notesnook-sync-server` не в inputs, только клиент. Видим как клиент шлёт и принимает, но не как сервер resolves.
- **dexie input files** (`dexie_*.ts`) — присутствуют в `_inputs/` но не относятся к этому треку (Dexie hooks/live-query/schema/version — для Track B). Сознательно не разбирал.
