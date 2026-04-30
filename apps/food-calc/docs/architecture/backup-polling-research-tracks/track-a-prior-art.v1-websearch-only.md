# Track A — Production Prior Art

**Дата:** 2026-04-29
**Время research'а:** ~3.5 ч (web research, без cloning'а — Bash/PowerShell в этой сессии заблокированы; работал через WebSearch + GitHub web view упоминания)
**Стоп-критерий достигнут:** да. Получено 5 приложений с подробным разбором всех 6 пунктов scope'а (Joplin, Standard Notes, Things 3, Notesnook, Obsidian Sync), плюс 4 прецедента в категории food/health (FoodNoms, Daylio, Bearable, OpenNutriTracker), плюс 2 контр-примера (CouchDB/PouchDB rev-tree, Apple Notes / NSPersistentCloudKitContainer). Material plateau на дальнейших querie'ях — переход на Track B был бы продуктивнее.
**Ограничения:** WebFetch и Bash/PowerShell были заблокированы permission'ами, поэтому не смог сделать `git clone` Joplin/Standard Notes для прямого чтения source. Работал через web-result summaries — конкретные SHA коммитов и file-line-numbers недоступны, но зафиксированы file paths из GitHub (`packages/lib/Synchronizer.ts`, `packages/lib/services/synchronizer/MigrationHandler.ts`).

---

## Executive summary

1. **Точное совпадение нашей backup-polling архитектуры существует в production: Things Cloud (Cultured Code) и Notesnook v3.** Things Cloud — APNS-driven push с per-mutation immediate upload, server-side merge на уровне строк/полей. Notesnook v3 specifically отказался от timestamp-based resumability в пользу `synced: bool` флага на каждой строке — буквально наш `_dirty: true`. Это снимает риск «мы первопроходцы» — две зрелые проприетарные системы с этой моделью работают.

2. **Joplin — не наш кейс.** Joplin делает full delta-pull (UPLOAD → DELETE_REMOTE → DELTA), включая поиск чужих изменений на каждом sync'е. Это backup-polling с pull. Полезен как reference для **schema migration locks** (exclusive vs sync lock pattern в `info.json`) и **conflict copy** UX, но не как протокол.

3. **«Conflict copy» — индустриальный default для sequential single-user**, и Joplin/Standard Notes показывают, что user-facing reconciliation UI почти не нужен в одиночном профиле. Standard Notes auto-resolve игнорирует конфликты ближе чем X секунд (точное значение в спеке не нашлось, упоминается «within an arbitrary amount of time»). Notesnook фиксирует threshold 1 минута. Для Disher (single-user, sequential) — тот же эвристический threshold + «conflict copy в специальную папку» = достаточно.

4. **Schema migration на server-side в этих архитектурах решается через version-stamped sync target metadata + exclusive lock на upgrade.** Joplin: `info.json` хранит `version`; client при boot'е проверяет, что server `version <= client supported version`, иначе блокирует sync и просит upgrade'ить server. Это даёт нам прямой паттерн: server stamps `schema_version`, клиент refuse'ит push если incompatible. Drop-and-resync >30 days — валидный escape hatch.

5. **iOS Safari constraints (ИЗ external research, не Track A scope, но жирно отмечено):** Background Sync API недоступен; sendBeacon limited 64KB; единственный надёжный «push при tab close» trigger — `visibilitychange === 'hidden'` + sendBeacon/fetch keepalive. Все iOS-targeting prior art (Bear, Things, Day One, FoodNoms) — **нативные приложения**, и их push-on-mutation паттерн в PWA не воспроизводится 1-в-1. Это не блокер для backup-polling (юзер допускает 1ч fallback + visibilitychange), но нужно фиксировать в Track B/D.

6. **Сюрприз:** Notesnook v3 publicly **отказался от timestamp-based detection of changed items** ради resumability. Их проблема: «timestamp как trigger даёт inconsistencies, sync resumability нестабильна». Решение: каждая запись имеет `synced: bool`. Это **противоположное** нашему текущему плану «timestamp + dirty flag». Контр-аргумент к timestamp-only подходу подтверждён production case'ом и стоит фронт-loadить в Track D.

---

## App-by-app deep dive

### 1. Joplin

- **Source:** https://github.com/laurent22/joplin (OSS, MIT)
- **Core sync code:** `packages/lib/Synchronizer.ts` (https://github.com/laurent22/joplin/blob/dev/packages/lib/Synchronizer.ts)
- **Migration handler:** `packages/lib/services/synchronizer/MigrationHandler.ts`
- **Spec docs:** https://joplinapp.org/help/dev/spec/sync/, /sync_lock/, /server_delta_sync/, /multiple_instances/

**Sync model:** Bidirectional sync с filesystem-style abstraction (S3, WebDAV, Joplin Server, Nextcloud, Dropbox, OneDrive). Three explicit phases per cycle:
- Step 1 — **UPLOAD**: items, изменённые локально с last sync, заливаются на target.
- Step 2 — **DELETE_REMOTE**: локально удалённые items стираются на target.
- Step 3 — **DELTA**: client запрашивает у target изменения, применяет локально.

**Push trigger:**
- Upload happens «within a few seconds» после локальной мутации (background sync triggered automatically on content change).
- Pull (DELTA step) — fixed interval, default 5 минут (settable, минимум через UI 5 мин, через `settings.json` можно меньше; параметр `sync.interval` в секундах).
- Plugin «Joplin Delayed Sync» делает 5000ms debounce + queue pending sync — это паттерн почти 1-в-1 с нашим debounce 30s.

**Conflict resolution:**
- LWW по `updated_time` для большинства полей (упомянуто: «Several properties have an associated updatedTime property used to resolve conflicts when two clients perform the same action on the same property, with heuristics deciding which value should be kept»).
- Для **note body** — НЕ LWW: «Conflict notebook» pattern. Local note копируется в специальный notebook «Conflict», remote версия применяется как canonical. Юзер сам разбирает.
- Plugin `joplin/plugin-conflict-resolution` добавляет diff-merge UI для conflict notes.
- В v2 sync блокировался на conflict; в v3 продолжает sync даже при unresolved conflicts.

**Schema migration:**
- Sync target имеет `version` field в `info.json` на target side. Логика клиента: `if remoteVersion === undefined → upgrade to latest`; `if equal → sync`; `if remoteVersion > clientVersion → refuse, ask user to upgrade client`.
- Migration защищена **EXCLUSIVE lock** в `lock/` folder. Format: `<lockType>_<clientType>_<clientId>.json` со `{type, clientType, clientId, updatedTime}`. Multiple clients могут иметь SYNC locks параллельно; только один — EXCLUSIVE для upgrade.
- Lock refresh каждые X секунд, expires если не refresh'ится в Y секунд (X<Y). Если несколько exclusive lock-файлов (crash перед release), валиден старейший.
- `MigrationHandler.ts` хранит миграции от version 1→2, 2→3 etc. Каждая — отдельный TS файл (`migrations/2.ts`, `migrations/3.ts`).

**Recovery flow:**
- «Delete local data and re-download from sync target» в Tools → Options → Sync → Advanced. Полный wipe local DB + первичный pull.
- Хорошо документировано **ломается**: GitHub issue #4919 «hangs in loop», #9023 «endless sync», #8660 «resources folder not cleaned up». Многие forum threads жалуются на 12-часовой sync overnight.
- Fail-safe setting защищает от ошибочного wipe'а если sync target внезапно пустой.

**Multi-tab / multi-process:**
- Desktop поддерживает 2 instances через profile lock + IPC HTTP servers. Lock файл в profile dir обновляется каждые X секунд; новый instance видит lock, шлёт IPC и закрывается.
- `--alt-instance-id` flag для secondary instance с собственным профилем (Web Clipper отключён там).
- Каждый client (mobile/desktop/cli) имеет уникальный `clientId` — используется в lock-file naming, conflict tracking.

**Известные проблемы:**
- Issue #6517 «Sync silently ignores new files with old timestamps» — delta algorithm полагается на file timestamps, при file-system sync с Syncthing может пропустить файлы со старым mtime.
- Issue #14028 «Unchanged notes sometimes get their modification time updated to the present» — race в timestamp update'ах.
- Issue #883 «Sync is very happy to delete your notebooks» — старая, исторический пример того как «delete remote → delete local» петля может смести данные если sync target кратковременно пуст.
- Issue #5223 «Potential orphaned resources left on sync target on resource conflict» — attachments не подтираются при conflict.
- Issue #13292 «Mark notes that are too large as cannot sync» — клиент бесконечно пытается заснуть слишком большой note, сервер reject'ит, retry loop.
- Performance: «Joplin struggles with sync targets other than local FS once you exceed ~600 notes», Android особенно медленный, OneDrive sync может занять 3+ минуты для одной note. На 26,000 items — 9.5–22 минут first sync даже после оптимизаций (commit 4dc1210 «Improved first sync speed»).
- Forum thread «Thousands of Conflicts - Any solution?» (https://discourse.joplinapp.org/t/39084) — типичный provoke-кейс при возврате device после длительного offline.
- Ctrl.blog «Sync issues finally drove me away from the Joplin note-taking app» — публичная критика sync UX.

**Что украсть для Disher:**
- **Pattern «info.json version + exclusive lock on schema upgrade»** — прямой шаблон для нашего scenario. Server stamps `schema_version`, client refuse'ит push при mismatch.
- **`clientId` per device** — даже в single-user, для idempotency и debugging. Уже есть в наших планах.
- **«Conflict copy» как fallback** для редких real conflicts (мы ассумируем sequential, но edge case многопроцессного PWA в нескольких табах может произвести). Создать таблицу `_conflicts` в Dexie, складывать туда rejected push'ы, показать badge в UI.
- **Plugin «Delayed Sync» 5s debounce + queue pending** — точный шаблон для нашего «debounce 30s + immediate on online».
- **Fail-safe**: если server snapshot вернул 0 rows для известного non-empty user — refuse to wipe. Joplin issue #883 + сама фича fail-safe.

**Что НЕ копировать:**
- **DELTA pull on every sync cycle** — мы сознательно отказываемся от bidirectional. Joplin делает pull всегда; мы — только при cold start.
- **Filesystem-style абстракция (read/write/delete/list файлов).** Наш target — структурированный POST endpoint, не file dumping ground. Список items не нужен.
- **Conflict notebook UX** в полной форме — overkill для single-user food/mood. Достаточно log-таблицы + toast «conflict resolved automatically» если разница >threshold.
- **Sync interval измеряется в seconds** — наш hourly fallback кажется длинным относительно Joplin'овского 5min, но он fallback, не основной trigger.
- **Конкретные проблемы recovery flow** (issue #4919, #9023) — урок: «delete local + redownload» button должен иметь explicit confirmation, idempotent retry, и fail-safe порог.

---

### 2. Standard Notes

- **Source:** https://github.com/standardnotes/syncing-server (deprecated PHP), https://github.com/standardnotes/syncing-server-js (current Node/TS)
- **Spec:** https://docs.standardnotes.org/specification/sync/
- **Third-party rust write-up (полезно):** https://listed.to/@fakePeterCxy/12480/standard-notes-sync-protocol-and-sfrs-a-rust-implementation
- **Encryption whitepaper:** https://standardnotes.com/help/security/encryption

**Sync model:** Single endpoint `POST /items/sync` принимает **batch** mutations + sync_token. Сервер не может читать content (E2E), поэтому conflict detection — чисто на metadata (`updated_at_timestamp`).

**Push protocol (наш ближайший аналог!):**
- Request body: `{items: [...], sync_token: <opaque>, cursor_token?: <opaque>, limit?: number}`.
- `sync_token`: holds reference to «latest known state of current user during last successful synchronization» — в реальной реализации это base64-encoded timestamp последней sync'и (формат `"MjoxNTk4OTAwOTQ4LjE0MjM3MDI="` decode'ится в timestamp с микросекундной точностью).
- `cursor_token`: возвращается если результат не уместился в limit, для пагинации pull'а.
- Response: `{retrieved_items, saved_items, unsaved_items, conflicts, sync_token, cursor_token?}`.
- Conflicts return как `{type: 'sync_conflict' | 'uuid_conflict', unsaved_item, server_item}`.

**Conflict resolution:**
- Server compares incoming `updated_at_timestamp` vs server-side `updated_at_timestamp`. Если **mismatch** → reject as `sync_conflict`. Не «server newer wins» — просто «client must reconcile».
- Client получает conflict, **создаёт duplicate item** (новый UUID, copy of unsaved_item) и пушит снова. Это и есть Standard Notes «conflict copy» — буквально дубликат note с пометкой.
- Auto-resolve heuristic: «Their conflict-detection logic somehow ignores conflicts whose timestamps are within an arbitrary amount of time apart» (источник: Typeblog Random write-up). Точное значение в спеке не нашлось.
- `uuid_conflict` отдельно: если client пытается сохранить item с UUID, который уже занят другим item на сервере (например, импорт из старого аккаунта). Resolution — изменить UUID на client'е, re-sync.

**Schema migration:**
- Client-side schema versioning через protocol versions: 001 → 002 → 003 → 004.
- В версии 004 introduced `items_keys` (encrypted keys synced as items themselves). Migration: создать default `itemsKey` из `accountKey.masterKey`.
- Server schema migrations — обычные DB migrations (TypeORM/etc). Не expose'ятся клиенту; sync API стабилен по контракту.
- При несовместимости версий — обычно client просто получает 426 Upgrade Required или эквивалент, и блокируется до обновления.

**Recovery:**
- Empty `sync_token` = first sync; server возвращает все items пользователя в batches.
- Standard Notes hosting + selfhost + offline mode (без аккаунта) — клиент может работать только локально и потом login activate'ит sync.
- **Документированный provoke кейс**: import старого архива с UUID'ами уже использованных — gives `uuid_conflict`.

**Multi-tab / multi-device:**
- В спеке не нашёл explicit lock'а. Полагается на `updated_at_timestamp` mismatch detection.
- Известная проблема: «server depends on timestamps from system clock (which may not be strictly monotonic) for synchronization tokens, which could bring unexpected synchronization behavior during multi-client synchronization scenarios, particularly when there is no lock limiting parallel synchronization requests» (Typeblog Random write-up). То есть multi-tab race может проявиться при system clock skew.

**Известные проблемы:**
- HN thread (https://news.ycombinator.com/item?id=34993188): «At least standard notes produce conflicting copies when collisions occur. Obsidian doesn't.» — общественное мнение что Standard Notes конфликты produce'ит часто.
- Forum issue #1569: «Standard Notes auto-resolving conflicts leads to duplicate notes» — auto-resolve threshold создаёт UX-шум: каждое автообновление активной заметки на 2 устройствах генерит duplicates.
- Issue #2387 (forum): «corrupted timestamp after import of items» — timestamp truncation bug.
- syncing-server issue #102 «Unable to sync notes» — sync_token races.
- Forum discussion #2602 «Highlight differences during Conflicted Copy errors» — пользовательский запрос на diff UI, до сих пор открыт.
- Help doc «How do I clear duplicates?» — целая страница troubleshoot'а для duplicate notes.

**Что украсть:**
- **Single endpoint `POST /sync` принимает batch** — наш `POST /backup` подход уже совпадает. Confirmation что это работает в proven E2E system.
- **Conflict detection через `incoming.updated_at !== server.updated_at`** — это **более строго**, чем нашё «server.updated_at >= incoming.updated_at = accept». Standard Notes отвергает даже идентичные timestamps, чтобы не было silent override. Стоит обдумать как trade-off: они choose data preservation > UX.
- **`sync_token` opaque base64 с микросекундной точностью** — даёт server полный контроль над cursor logic, можно потом сменить с timestamp на ULID/snowflake без breaking client. Но для backup-polling без pull'а нам это меньше важно.
- **`uuid_conflict` как отдельный case** — если backend по ошибке получает duplicate UUID (e.g., два устройства импортнули один JSON), отдельный response code, не silent merge.

**Что НЕ копировать:**
- **Full bidirectional sync** — мы push-only, у Standard Notes есть retrieval/pull часть.
- **Strict mismatch rejection (incoming.updated_at !== server)** — для нашего sequential single-user, true LWW (`incoming.updated_at > server.updated_at`) даст менее раздражающий UX. Strict mismatch для Standard Notes work'ает потому что они E2E и server физически не может merge'ить.
- **Auto-resolve threshold скрытный** — Standard Notes известная проблема (issue #1569): юзеры получают duplicates без понимания почему. Если делать threshold, документировать его и показывать toast «conflict auto-resolved».
- **Clock-skew vulnerability** через system clock timestamps без normalization — стоит дополнить `server_received_at` (см. Track B/D).

---

### 3. Things 3 / Things Cloud

- **Source:** Closed source. Architecture details из Cultured Code blog posts: «Things Cloud Nimbus Released» (2015) https://culturedcode.com/things/blog/2015/08/things-cloud-nimbus-released/, «Apple's Swift Powers the New Things Cloud System» (2025) MacRumors coverage https://www.macrumors.com/2025/05/20/swift-powers-new-things-cloud/.
- **Status page:** https://culturedcode.com/status/
- **Support:** https://culturedcode.com/things/support/articles/2803590/ (sync troubleshooting)

**Sync model — самое близкое попадание в наш паттерн из всех найденных:**
- Per-mutation immediate push: «When you make a change on your device, this change is immediately sent to Things Cloud».
- Server вычисляет, кому из других устройств нужны данные, и шлёт **APNS push notification** на эти устройства (это бэкенд → клиент, не наш кейс, но важно понимать что они НЕ poll'ят с клиента — APNS-driven invalidation).
- Когда устройство offline, изменения cache'атся локально и при reconnect делается **delta-sync, merging only changes** (не full re-upload).
- В 2021 — «Fractus»: granular text-sync на уровне changed strings, не whole notes. Smart conflict resolution на уровне substring'ов.
- В 2025 — полностью переписали backend на Swift, 4x speedup на sync request processing. Алгоритмы остались («refined over 14 years on solid mathematical foundation»), changed только инфраструктура.

**Push trigger:**
- Immediate per-mutation, не debounced (по официальному описанию).
- Offline cache → drain on reconnect.
- iOS APNS обеспечивает «push to other devices when app isn't running» — нативный путь, в PWA Safari не воспроизводится.

**Conflict resolution:**
- LWW для большинства fields (что подтверждается отсутствием conflict UX в product'е — пользователи никогда не видят разрешение конфликтов).
- Fractus делает sub-document granular merge: если 2 device одновременно редактируют разные части note — обе правки применяются.
- Sequential single-account профиль — конфликтов «in practice never».

**Schema migration:**
- «If you install a new version of Things, older devices will no longer be able to sync with your Things Cloud account» — version pinning. Переход forward-only, downgrade недоступен.
- Service выкатывал «Nimbus» (2015), «Fractus» (2021), Swift rewrite (2024-2025) — большие архитектурные смены делались **прозрачно для UI**, под капотом server gradual migration. Это говорит о **dual-write pattern** на server side.

**Recovery:**
- Things Cloud proprietary, fresh install pulls full state. Forum reports: «sync was robust and reliable in 7 years of use» от части users; «didn't lose data» pattern доминирует в reviews.

**Multi-tab / multi-device:**
- Native только (iOS/iPadOS/macOS/watchOS/visionOS). No web client. So multi-tab не существует как problem.
- Multi-device sequential — основной use case. APNS гарантирует low-latency cross-device.

**Известные проблемы:**
- Article «Things 3.13 Sync Might Stop Working» (https://culturedcode.com/things/support/articles/1790292/) — корп addressed специфический server-side bug, требовал client upgrade.
- Reddit/forum: иногда пользователи жалуются на 1-2 минутные задержки propagation, особенно на watch.
- App Store review «sync с Reminders очень плохой» — это integration issue, не Things Cloud sample.
- Bug «switching lists while editing text could cause changes to be lost» — fixed, но reminder что text editing race conditions реальны.

**Что украсть:**
- **«Per-mutation immediate push, no debounce»** — Things doesn't debounce. Возможно, и нам debounce 30s избыточен; с другой стороны — Things native + APNS, мы PWA + HTTP. Стоит calibrate'ить с Track B (web debounce best practice).
- **Sub-document granular changes (Fractus pattern)** — если дойдём до больших text fields в Disher (notes на schedule_food?), посмотреть на string-level diffs вместо whole-row push. Не critical для нашего MVP.
- **«Mathematical foundation that handles offline edits and conflict resolution»** — Cultured Code публично пишут что у них есть theoretical model. Нам стоит потратить пол-страницы на доказать formally (в Track B) что наш LWW + monotonic client_modified_at = correct для sequential.
- **Server-side gradual rewrite** (Nimbus → Fractus → Swift) — pattern «dual-write to old + new schema during transition window». Если Disher meningfull схему сменит, не block-and-migrate, а dual-write.

**Что НЕ копировать:**
- **APNS-driven cross-device invalidation** — у нас single-user PWA, не multi-device push critical. Hourly fallback + visibilitychange достаточны.
- **Closed-source advantage** — мы ОБЯЗАНЫ document'ировать наш протокол, юзер хочет понимать что происходит.
- **Native-only stack** — iOS Safari PWA constraints.

---

### 4. Notesnook (v3)

- **Source:** https://github.com/streetwriters/notesnook (client), https://github.com/streetwriters/notesnook-sync-server (server, self-hostable in alpha)
- **v3 release post:** https://blog.notesnook.com/introducing-notesnook-v3
- **Conflicts doc:** https://help.notesnook.com/faqs/what-are-merge-conflicts

**Sync model:**
- v1/v2: timestamp-based detection of changed items («modified timestamp»).
- **v3: explicitly removed the time factor.** «Each item has a boolean `synced` property that becomes false whenever it is changed. When pushing changes, the app gets all the items with `synced` set to false». — буквально наш `_dirty: true` подход.
- Server keeps list of unsynced items per device; on push device sends только those.

**Push trigger:**
- В v2 force sync был один кнопкой; в v3 разделили на force push & force pull.
- Background sync continues even with unresolved merge conflicts (v2 был блокирующий).

**Conflict resolution:**
- Merge conflict triggered if changes на двух devices как минимум **1 минута apart**. Внутри 1-минутного окна — auto-resolve (видимо LWW).
- Конфликт: оба варианта сохраняются, юзер выбирает в UI.

**Schema migration:**
- v3 был «rewritten core architecture, new sync engine, migrated to SQLite» — full rewrite, не incremental migration. Старые users мигрировали через дополнительный flow.
- В v1/v2 `synced=bool` не было; миграция требовала backfill всех items с `synced=true` baseline.

**Recovery:**
- Force pull — wipe local + redownload.
- Self-host server (alpha) — означает миграция users между instances требовала export/import.

**Multi-tab / multi-process:**
- Web client + desktop (Electron) + mobile. Multi-tab взаимодействие в спеке не явно описано. v3 поминает «improved real-time sync» — вероятно через WebSocket invalidation.

**Известные проблемы:**
- Issue #3839 «Sync bug» — общая категория.
- Issue #1234 «Merge conflict detected» — пользователи получают conflict с notes, которые они не редактировали (false positives из old timestamp logic? могло быть triggering reason для v3 rewrite).
- Forum: иногда v3 sync stuck на больших vault'ах.

**Что украсть (САМОЕ ВАЖНОЕ):**
- **`synced: bool` per row > timestamp comparison.** Notesnook explicit reasoning: «timestamp creates inconsistencies and makes sync resumability unstable». Это **прямой контраргумент** к timestamp-only подходу. Наш план уже включает `_dirty: true`, но:
  - Validate: мы ДОЛЖНЫ установить `_dirty=true` ВНУТРИ same transaction что сама мутация. Иначе race: мутация committed, dirty не set, push пропустил row, потом push'нулся новый push с уже cleared timestamp — row никогда не synced.
  - На server side: при success → server возвращает list of accepted ids → клиент в **отдельной local transaction** очищает `_dirty=false` ТОЛЬКО для тех id, у которых `client_modified_at` равен тому что мы пушили (timestamp guard, см. Notesnook/Joplin pattern feedback в memory). Иначе concurrent mutation теряется.
- **«Conflict detection threshold = 1 минута»** — простой, документируемый. Стоит брать наш threshold аналогично, e.g. 30 секунд.
- **Раздельные кнопки force push / force pull** в Tools menu — UX honest'и: юзер понимает направление потока.
- **Sync continues despite conflicts** (v3 lesson) — не блокировать backup push если в `_conflicts` таблице что-то лежит.

**Что НЕ копировать:**
- **Полный rewrite core architecture** (v2 → v3) — мы можем сделать миграцию backup-polling над существующим Dexie без full rewrite.
- **WebSocket real-time invalidation** — overkill для single-user PWA с 30-day horizon.

---

### 5. Obsidian Sync

- **Source:** Closed source (paid service). Docs: https://help.obsidian.md/sync. DeepWiki summary: https://deepwiki.com/obsidianmd/obsidian-help/3.1-obsidian-sync
- **Forum:** https://forum.obsidian.md (frequent sync threads)

**Sync model:**
- Centralized cloud, regional servers, E2E encrypted.
- Per-file sync (Obsidian = filesystem-based vault).
- Deterministic file-hash encryption — same content + same key → same encrypted hash → server dedupes без re-upload.

**Push trigger:**
- Real-time on file save (debounced ~few seconds).
- App on launch — full reconcile.

**Conflict resolution:**
- **Markdown files**: Google's `diff-match-patch` algorithm, three-way merge (base + local + remote). Surfaces unresolved conflicts as «conflict» files (`.md` next to original).
- **Non-markdown** (images, PDFs, Canvas): **LWW** by modification timestamp.

**Schema migration:**
- Vault = filesystem. No schema. Plugin data has own JSON files; plugins handle own migrations.

**Recovery:**
- Version history: Obsidian Sync keeps 1y of versions of each file (paid feature). Rollback per-file.
- New device install: full vault download.

**Multi-tab / multi-process:**
- Single Obsidian process per vault enforced (lock file in vault root).

**Известные проблемы:**
- Forum thread «Robust Sync Conflict Resolution» (https://forum.obsidian.md/t/93544) — feature request for better diff UI.
- HN: «Obsidian Sync doesn't produce conflict copies» — diff-match-patch handles most cases automatically. Trade-off: silent merge может lose minor edits.
- Encryption + Version Conflicts thread — versions per device after sync glitches.

**Что украсть:**
- **«Three-way diff-match-patch для text»** — если у нас будет large text field (notes), это SOTA подход. Но Disher — structured records, не text. Probably overkill.
- **Per-file version history** = analog «snapshot backup» memory item (`project_snapshot_backup_idea.md`). Юзер уже думал об этом — Obsidian validates pattern.

**Что НЕ копировать:**
- **Filesystem vault model** — наш data = relational, не файлы.
- **Three-way merge** для structured rows — overcomplication, LWW работает.

---

### 6. Bear (CloudKit-backed)

- **Source:** Closed source. Public info: https://bear.app/faq/syncing-privacy/, https://www.cossacklabs.com/blog/end-to-end-encryption-in-bear-app/
- **Community discussions:** https://community.bear.app/t/how-does-cloudkit-sync-work/17010

**Sync model:** CloudKit-based. Bear не управляет sync сама — отдаёт всё CloudKit (Apple iCloud).

**Push trigger:** CloudKit-managed. Apps can NOT force CloudKit to sync (no public API, system decides). Bear FAQ warns about this.

**Conflict resolution:** CloudKit handles. По умолчанию timestamp-based last-write-wins на CKRecord level. Custom conflict resolution через CKModifyRecordsOperation completion handler.

**Schema migration:** CKRecord schema versioning. Adding fields = backward compatible. Removing = problem (old clients cache old fields).

**Recovery:** CloudKit handles initial fetch + subscription'ы для invalidation.

**Multi-tab:** N/A (native macOS/iOS only).

**Известные проблемы:**
- Community «Sync Issues between devices», «iOS not syncing» threads — постоянный поток.
- Bear team вынуждены built `iCloudSyncStats()` debug console function для diagnose'а.
- Apps cannot force-trigger sync = root cause UX frustration.
- iCloud's conflict resolution «produces numbered suffixes» (Carlo Zottmann blog https://zottmann.org/2025/09/08/ios-icloud-drive-synchronization-deep.html) — не для CloudKit, но illustrative для всей iCloud family.

**Что украсть:**
- **«Sync stats» debug overlay** — кнопка / panel в settings показывающая «pending push: 12 items, last push: 2 min ago, last error: 401 (refreshed)». Это снимает 90% support requests.

**Что НЕ копировать:**
- **CloudKit как backend** — opaque, нельзя force sync, нельзя debug. Юзер уже сказал «свой VPS готов».
- **Зависимость от Apple ecosystem** — мы PWA cross-platform.

---

### 7. Day One

- **Source:** Closed source. https://dayoneapp.com/guides/day-one-sync/end-to-end-encryption-faq/
- **Community:** https://forums.dayoneapp.com

**Sync model:** Day One Sync — proprietary service built specifically for Day One data, **after migration away from iCloud + Dropbox** (which had «thousands of cases of data loss and duplication»).

**Push trigger:** Not publicly documented in detail. Implicit per-entry push.

**Conflict resolution:** Proprietary. E2E encrypted (default for new journals after 4.2). Encryption key stored locally + securely in iCloud.

**Schema migration:** Не публично. Day One major versions migrate (v2 → v3 etc) с user-facing flow.

**Recovery:** Service-managed. New device fetches full journal.

**Multi-tab:** Native only.

**Известные проблемы:**
- Forum threads: ongoing sync issues, but less than competitors.
- Critical historical context: Day One **abandoned iCloud + Dropbox** because data loss in их workload was untenable. This is a **strong validation что built-for-purpose backup endpoint > generic file sync**.

**Что украсть:**
- **«Built our own service because generic cloud sync lost data»** — public statement validates наш approach (свой VPS, не Supabase opaque sync).
- **«E2E by default for new journals after version X»** — gradual rollout pattern для security upgrades.

**Что НЕ копировать:**
- Specifics not public enough.

---

### 8. Logseq

- **Source:** https://github.com/logseq/logseq
- **Forum:** https://discuss.logseq.com

**Sync model:** Local-first. Sync is **secondary**: users wire iCloud / Dropbox / Git / Logseq's own paid Sync (in beta).

**Push trigger:** File-system based если через iCloud/Dropbox. Logseq Sync — debounced upload.

**Conflict resolution:** «Newer first» strategy on whole file. Fragile при partial sync.

**Schema migration:** Going through architectural rewrite to SQLite-backed storage в 2025-2026. RTC (real-time collab) в alpha.

**Recovery:** Restore from cloud backup или Git history.

**Multi-tab:** N/A typically.

**Известные проблемы:**
- Issue #6736 — frequent conflicts with Syncthing on always-running remote.
- FAQ thread «content overwritten when edit without fully synced» — race condition при partial pull.
- Sync «historically the biggest friction point» (multiple reviews).

**Что украсть:**
- **«Don't bet on filesystem sync as primary»** — если Logseq как product validates that filesystem-level sync produces conflicts даже у power users, our HTTP backup endpoint approach is правильный.

**Что НЕ копировать:**
- Pre-rewrite Logseq architecture — публично признали, что she не работала надёжно.

---

## Прецеденты в нашей категории (food / health / mood / correlation)

### A. FoodNoms (closest fit для food tracking + local-first)

- **Source:** https://foodnoms.com (closed source iOS app)
- **Cloud announcement:** https://foodnoms.com/news/foodnoms-cloud
- **Verdict from blog post:** Local-first design, optional iCloud sync (CoreData + CloudKit), **plus new FoodNoms Cloud powered by Supabase** for cross-Apple-ecosystem + future cross-platform.

**Architecture details:**
- Local-first: log/view/track works offline; data syncs «automatically when back online».
- Two cloud options:
  1. iCloud (CoreData + CloudKit + Advanced Data Protection E2E since iOS 16).
  2. FoodNoms Cloud — Supabase backend, GDPR-compliant, encrypted at rest + in transit.
- User chooses one.

**Что мы learn'им:**
- **Validation что Supabase as backend для food tracker = OK.** FoodNoms (well-respected nicheapp) shipped on Supabase. Our pivot away не запрещён, но Supabase для нашего simple backup-полля — proven viable.
- **«Two cloud options»** — interesting product pattern. Не copies us для PoC, но позже можно «iCloud sync» как opt-in (для iOS-only users that are already in Apple ecosystem).
- **Encrypted at rest + transit без full E2E** — мid-level security, реалистичный для food data (не как health diary). 

**Что НЕ копировать:**
- Native CoreData stack — мы на Dexie.

### B. Daylio (counter-example: no sync)

- Local SQLite. Manual backup to Google Drive / iCloud (encrypted file blob). **Не sync** между devices, never.
- Архитектура — extreme simplicity. ~10M+ users worldwide.
- App Store: backup + restore = одно из главных features.

**Lesson:** «Manual backup-only» — viable product strategy for mood tracking. **Не fits Disher** (we want cross-device), но validates что simple backup file is часть feature set (см. memory `project_manual_export_idea.md`).

### C. Bearable (correlation tracker — наша direct category)

- Cloud sync exists, encrypted. Architecture details opaque (closed source).
- From product description: «offline logging, syncing once connectivity restored».
- Apple Health / Google Fit / Fitbit integrations — pulls third-party data.

**Lesson:** Correlation tracker архитектура closed; competitor data unavailable. Their UX «encryption keys only with user» implies E2E or near-E2E. Их feature richness (multiple medication types, activity, mood, etc.) — relevant для product roadmap, не для sync architecture.

### D. OpenNutriTracker (open-source food tracker)

- **Source:** https://github.com/simonoppowa/OpenNutriTracker (Flutter)
- **Stack:** Flutter + Hive (local NoSQL) + Riverpod + Open Food Facts + USDA FDC.
- **Sync:** **NO sync.** Local-only.

**Lesson:** Pure local-first food tracker, GitHub-popular, GPL-3.0. **Counter-example для нашего sync need**: можно ship product без sync вообще. Если backup-polling provides sufficient data preservation + cross-device fits Disher use case (мобильно с друзьями?), это уже выше OpenNutriTracker baseline.

---

## Patterns в литературе

### Kleppmann (Designing Data-Intensive Applications + local-first papers)

- **Anti-entropy** — the technique of replicas exchanging summaries of their state to detect divergence. Our backup-polling = **degenerate anti-entropy**: client always sends, server always accepts. Single-direction, not bidirectional (which would be classical anti-entropy).
- **Strong Eventual Consistency (SEC)** через CRDTs — «if all replicas have received the same set of updates, they converge to same state regardless of order» (Kleppmann 2017 paper https://arxiv.org/abs/1707.01747).
- **Backup-polling SEC?** Yes, for sequential single-user: same set of mutations from one source = trivially converges. LWW gives convergence; Joplin's per-field LWW semantics are SEC-compatible.
- **Byzantine Eventual Consistency** (Kleppmann 2020 https://arxiv.org/abs/2012.00472) — irrelevant для us (no untrusted peers).

### Local-first paper (Ink & Switch 2019)

- 7 ideals: no spinners, your work isn't trapped, network optional, longevity, security/privacy by default, full collaboration, you retain ownership.
- Backup-polling satisfies #1-#5 + ownership; collaboration не applicable.

### CouchDB / PouchDB (counter-example, highly relevant)

- Use **revision tree (rev-tree)** instead of LWW timestamp.
- Conflicts stored as branches in rev-tree; deterministic algorithm picks winner by depth + lexicographic order on rev hash.
- PouchDB has known bug (issue #2451): rev hash uses uuid (random) instead of CouchDB's deterministic content-hash → unnecessary conflicts when syncing PouchDB↔PouchDB.
- **Why we don't use:** rev-tree assumes peer-to-peer multi-master replication — our model is single-master server, sequential client. Overhead is unjustified.

### Cassandra/DynamoDB tombstone pattern

- Soft delete via tombstone row, replicated like normal write, garbage-collected after `gc_grace_seconds`.
- For Disher: `deleted_at` column + LWW with rule «delete wins over update at same timestamp» (this is the rule from old `eventsourcing-research-2026.md` §12.3).
- Tombstones must persist on server long enough for all clients to see and apply. With our 30-day horizon — `gc_grace_seconds` could be ~30 days, then permanent purge.

---

## Cross-cutting findings

1. **«Conflict copy» is industry default for sequential users.** Joplin, Standard Notes, Notesnook all create duplicates on conflict. Obsidian uses three-way merge for text but falls back to conflict files for non-text. **For Disher single-user sequential**, conflict copy is overkill but cheap to implement (extra `_conflicts` table). Recommendation: implement minimal — log conflicts but auto-resolve if `|client_a.modified_at - client_b.modified_at| > 30s` via LWW.

2. **Schema migration uses version stamping + exclusive lock.** Joplin's `info.json` + lock file pattern is the cleanest. Standard Notes uses HTTP Upgrade Required-style rejection. Things Cloud forces client upgrade via incompatibility errors. **For Disher**: `POST /backup` returns `426 Upgrade Required` with `{required_client_version: "1.5.0"}` if server schema > client schema. Block push, show update prompt. Drop-and-resync >30 days OK as escape hatch.

3. **Recovery flows are the most-broken feature.** Joplin issues #4919/#9023/#8660 all about «delete local + re-download» hangs. Day One famously pivoted to its own cloud after iCloud/Dropbox lost data. **Lesson for Disher**: never auto-wipe local on perceived divergence; require explicit user confirmation; detect «server returned 0 rows but client has 1000» as fail-safe trigger and refuse to apply.

4. **Multi-tab/process coordination is solved with lock files + IPC.** Joplin uses HTTP server in each instance. For PWA: use **`navigator.locks`** API (available in Safari 17+) + **`BroadcastChannel`** for «I'm draining, others stand by». Even Joplin desktop limits to 2 instances. For Disher PWA, single-tab assumption + lock-based fallback is sufficient.

5. **Timestamp-based dirty detection has known instability — boolean dirty flag is industry winner.** Notesnook v3 explicitly switched. Joplin uses `sync_items.sync_time` (separate table) + `note.updated_time` together — equivalent to dirty-flag pattern. **For Disher**: continue with `_dirty: bool` + `client_modified_at`. Sync-row clearance must be timestamp-guarded (Notesnook lesson + memory `feedback_timestamp_guard_pattern.md`).

6. **Push trigger should be event-driven, not interval.** Things Cloud per-mutation immediate. Joplin within seconds. Notesnook on event. Hourly fallback is for «edge case where browser kept tab open, frozen». **For Disher**: immediate (online) + 30s debounce (offline burst protection) + visibilitychange + online event + 1h fallback. Matches plan.

7. **Server should server-stamp `received_at` in addition to client's `client_modified_at`.** Standard Notes' clock-skew vulnerability is documented. Joplin partially mitigates via lock timestamps. For Disher: server-side `received_at` for monitoring + audit, but `client_modified_at` remains authoritative for LWW (single-user sequential, clock skew < 1 hour mostly tolerable).

---

## Counter-examples (apps where pattern doesn't apply / why we differ)

### CouchDB / PouchDB / Cloudant

- Multi-master peer-to-peer replication. Rev-tree for conflicts. Designed for **collaboration**.
- Не наш кейс: single-user sequential = overkill.
- Take-away: their deterministic conflict winner pattern is more sophisticated, but unnecessary complexity for us.

### MyFitnessPal / Cronometer / YAZIO / Lose It

- **Server-first.** Source of truth on backend. Client = view.
- Offline support либо отсутствует, либо mediocre (cache last-fetched data, no offline mutation).
- Не наш кейс — explicitly rejected in earlier research stages.

### NSPersistentCloudKitContainer (Apple Notes etc.)

- Apple's framework auto-manages CloudKit ↔ Core Data. «Handles conflict resolution, schema migration, background syncing transparently.»
- Custom conflict resolution через `CKModifyRecordsOperation` completion handler.
- Not our case: native iOS only, opaque, can't force sync.

### Logseq pre-rewrite

- Filesystem-based sync (iCloud/Dropbox/Syncthing/Git). Multiple known conflict generation issues.
- Lesson: **don't sync via filesystem if you have control of your sync layer**. We have our own backup endpoint — apply structured POST, not file dumping.

### Daylio / OpenNutriTracker

- **No sync at all.** Manual backup file or local-only.
- Validates that no-sync products ship and succeed — but Disher wants cross-device, so we go past this.

### CRDTs + Yjs/Automerge

- Designed for concurrent multi-master collaboration.
- Sequential single-user = пустая трата bytes (op log overhead, vector clocks, etc.).
- Rejected in earlier research phases.

---

## Sources

### Joplin
- Repository: https://github.com/laurent22/joplin
- Sync code: https://github.com/laurent22/joplin/blob/dev/packages/lib/Synchronizer.ts
- Migration handler: https://github.com/laurent22/joplin/blob/c3f10d31cb0f63c798cabbee7177ec90e82ad67a/packages/lib/services/synchronizer/MigrationHandler.ts
- Sync spec: https://joplinapp.org/help/dev/spec/sync/
- Sync lock spec: https://joplinapp.org/help/dev/spec/sync_lock/
- Server delta sync: https://joplinapp.org/help/dev/spec/server_delta_sync/
- Multiple instances: https://joplinapp.org/help/dev/spec/multiple_instances/
- Conflict help: https://joplinapp.org/help/apps/conflict/
- Conflict readme: https://github.com/laurent22/joplin/blob/master/readme/conflict.md
- Issue #883: https://github.com/laurent22/joplin/issues/883
- Issue #4919: https://github.com/laurent22/joplin/issues/4919
- Issue #5223: https://github.com/laurent22/joplin/issues/5223
- Issue #6517: https://github.com/laurent22/joplin/issues/6517
- Issue #8660: https://github.com/laurent22/joplin/issues/8660
- Issue #9023: https://github.com/laurent22/joplin/issues/9023
- Issue #11081: https://github.com/laurent22/joplin/issues/11081
- Issue #13292: https://github.com/laurent22/joplin/issues/13292
- Issue #14028: https://github.com/laurent22/joplin/issues/14028
- Forum «Thousands of Conflicts»: https://discourse.joplinapp.org/t/thousands-of-conflicts-any-solution/39084
- Forum «Sync schedule reference time»: https://discourse.joplinapp.org/t/sync-schedule-reference-time-where-can-i-set-it/23621
- Plugin «Joplin Delayed Sync»: https://joplinapp.org/plugins/plugin/joplin-delayed-sync/
- Plugin «Conflict Resolution»: https://github.com/joplin/plugin-conflict-resolution
- Faster sync news: https://joplinapp.org/news/20231223-faster-sync/
- Ctrl.blog critique: https://www.ctrl.blog/entry/joplin-notes-sync.html
- DeepWiki: https://deepwiki.com/laurent22/joplin

### Standard Notes
- Sync API spec: https://docs.standardnotes.org/specification/sync/ (also docs.standardnotes.com)
- Repository (deprecated PHP): https://github.com/standardnotes/syncing-server
- Repository (current Node): https://github.com/standardnotes/syncing-server-js
- Encryption whitepaper: https://standardnotes.com/help/security/encryption
- Help «How do I clear duplicates»: https://standardnotes.com/help/33/how-do-i-clear-duplicates
- Forum issue #1569 (auto-resolve duplicates): https://github.com/standardnotes/forum/issues/1569
- Forum issue #2387 (timestamp corruption): https://github.com/standardnotes/forum/issues/2387
- Forum discussion #2602 (diff UI): https://github.com/standardnotes/forum/discussions/2602
- Syncing-server issue #102: https://github.com/standardnotes/syncing-server/issues/102
- Third-party Rust write-up (Typeblog): https://listed.to/@fakePeterCxy/12480/standard-notes-sync-protocol-and-sfrs-a-rust-implementation
- Rust impl (rafaelespinoza): https://github.com/rafaelespinoza/standardnotes
- 2025 update post: https://standardnotes.com/blog/2025-update
- HN thread: https://news.ycombinator.com/item?id=34993188

### Things 3 (Cultured Code)
- Status: https://culturedcode.com/status/
- Blog (Nimbus 2015): https://culturedcode.com/things/blog/2015/08/things-cloud-nimbus-released/
- MacRumors Swift rewrite: https://www.macrumors.com/2025/05/20/swift-powers-new-things-cloud/
- Things 3.13 sync warning: https://culturedcode.com/things/support/articles/1790292/
- Sync troubleshooting: https://culturedcode.com/things/support/articles/2803590/
- Wikipedia: https://en.wikipedia.org/wiki/Things_(software)
- 2026 sync overview: https://intech.it.com/does-things-app-sync-across-devices-the-ultimate-2026-guide/

### Notesnook
- Repository: https://github.com/streetwriters/notesnook
- Sync server: https://github.com/streetwriters/notesnook-sync-server
- v3 announcement: https://blog.notesnook.com/introducing-notesnook-v3
- Merge conflicts FAQ: https://help.notesnook.com/faqs/what-are-merge-conflicts
- Issue #1234 (merge detected): https://github.com/streetwriters/notesnook/issues/1234
- Issue #3839: https://github.com/streetwriters/notesnook/issues/3839
- Release v1.3.6: https://github.com/streetwriters/notesnook/releases/tag/v1.3.6

### Obsidian Sync
- DeepWiki Sync: https://deepwiki.com/obsidianmd/obsidian-help/3.1-obsidian-sync
- DeepWiki Conflict res: https://deepwiki.com/obsidianmd/obsidian-help/2.3-filters-and-views
- Forum «Robust Sync Conflict Resolution»: https://forum.obsidian.md/t/robust-sync-conflict-resolution/93544
- Forum «Encryption & Version Conflicts»: https://forum.obsidian.md/t/encryption-version-conflicts/81339

### Bear
- FAQ syncing: https://bear.app/faq/syncing-privacy/
- FAQ troubleshoot: https://bear.app/faq/sync-troubleshooting/
- Cossack Labs E2E post: https://www.cossacklabs.com/blog/end-to-end-encryption-in-bear-app/
- Community CloudKit: https://community.bear.app/t/how-does-cloudkit-sync-work/17010
- Community sync issues: https://community.bear.app/t/sync-issues-between-devices/11911
- CloudKit VLDB paper: https://www.vldb.org/pvldb/vol11/p540-shraer.pdf

### Day One
- E2E FAQ: https://dayoneapp.com/guides/day-one-sync/end-to-end-encryption-faq/
- Sync FAQ: https://dayoneapp.com/guides/day-one-sync/day-one-sync-faq/
- Solving sync troubles: https://dayoneapp.com/guides/troubleshooting/solving-sync-troubles/
- iCloud Drive deep dive (Zottmann): https://zottmann.org/2025/09/08/ios-icloud-drive-synchronization-deep.html

### Logseq
- Repository: https://github.com/logseq/logseq
- Issue #6736 (Syncthing conflicts): https://github.com/logseq/logseq/issues/6736
- Discussion #7944: https://github.com/logseq/logseq/discussions/7944
- Forum content overwritten: https://discuss.logseq.com/t/logseq-sync-content-got-overwritten-when-edit-without-fully-synced/15041

### Food / Health / Mood category
- FoodNoms Cloud announcement: https://foodnoms.com/news/foodnoms-cloud
- FoodNoms 2 review (MacStories): https://www.macstories.net/reviews/foodnoms-2-refreshes-its-design-and-adds-refinements-to-nutrition-logging-and-goal-tracking-throughout/
- Daylio backup options: https://daylio.net/faq/docs/daylio-faq/backup/backup-options/
- Daylio data security: https://daylio.net/faq/docs/daylio-faq/about/how-secure-is-my-data/
- Bearable site: https://bearable.app/
- OpenNutriTracker (DEV blog): https://dev.to/jeremy_libeskind_4bfdc99f/building-opennutritracker-a-privacy-first-nutrition-app-you-can-hack-on-2k9l

### Theory / patterns
- Kleppmann Verifying SEC paper: https://arxiv.org/abs/1707.01747
- Kleppmann publications: https://martin.kleppmann.com/2017/10/25/verifying-crdt-isabelle.html
- Kleppmann Byzantine EC: https://arxiv.org/abs/2012.00472
- Kleppmann 2025 keynote: https://martin.kleppmann.com/2025/03/31/papoc-keynote-byzantine.html
- PouchDB Conflicts guide: https://pouchdb.com/guides/conflicts.html
- CouchDB conflict model: https://docs.couchdb.org/en/stable/replication/conflicts.html
- PouchDB rev determinism issue #2451: https://github.com/pouchdb/pouchdb/issues/2451
- PouchDB rev determinism issue #4642: https://github.com/apache/pouchdb/issues/4642
- Cassandra tombstones (Sherman Digital): https://shermandigital.com/blog/cassandra-tombstone/
- Cassandra tombstones (LastPickle): https://thelastpickle.com/blog/2016/07/27/about-deletes-and-tombstones.html
- InfluxData anti-entropy: https://www.influxdata.com/blog/eventual-consistency-anti-entropy/

### iOS Safari constraints (ancillary, useful for Track B/D)
- MDN sendBeacon: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon
- MagicBell PWA iOS limits 2026: https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide
- Mobiloud PWA iOS 2026: https://www.mobiloud.com/blog/progressive-web-apps-ios
- BSWEN Safari PWA limitations: https://docs.bswen.com/blog/2026-03-12-safari-pwa-limitations-ios/
- Firt.dev PWA secrets: https://firt.dev/pwa-secrets/

---

## Не закрыто / unknown / нужно в следующих треках

- **Joplin Synchronizer.ts конкретный line-numbered просмотр** не сделан (Bash/PowerShell заблокированы для clone'а). Если важно для PoC — fetch raw Synchronizer.ts через `gh api` из Bash на следующей сессии.
- **Standard Notes auto-resolve threshold value** — точное значение «within an arbitrary amount of time» не нашлось в спеке. Возможно, в исходниках syncing-server-js. Если важно — клонить и grep'ить «conflict».
- **Things Cloud Fractus algorithm details** — closed source, нет prior art для granular text sync без CRDT (кроме diff-match-patch у Obsidian).
- **localfirst.fm episodes** — не получил конкретных episode references; возможно стоит просканировать manually на их сайте.
- **Joplin schema migration history (1→2→3 etc) examples** — упоминается `migrations/2.ts`, `migrations/3.ts` в репо; конкретный diff каждой миграции — для Track C/D детального просмотра.
- **Bearable architecture** — closed-source, public details ограничены маркетингом. Дальнейший research малопродуктивен.
