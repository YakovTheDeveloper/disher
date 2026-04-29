# Server-first vs Event-sourcing local-first — сравнение для Disher

**Статус:** черновик для решения
**Контекст:** Сессии A–F server-first миграции закоммичены. Возник вопрос — не стоит ли вместо Tier-1 упрощения уйти в event-sourcing local-first.
**Вне рамок:** стоимость миграции (явное условие). Сравниваем по надёжности, durability, корректности, операционной устойчивости.
**Автор-скоуп:** этот документ — нейтральный side-by-side, без вывода-рекомендации. Решение принимает юзер.

---

## 0. Профиль приложения (фиксируем перед сравнением)

- **Single-user** аккаунт. Multi-device — sequential, конкурентных правок нет.
- **Платформа:** PWA, тяжёлый трафик с iOS Safari.
- **Данные:** structured/relational (product, dish, schedule-food, schedule-event, daily-norm, period, analytics). FK между entity. Нет CRDT-friendly текстовых документов.
- **Каталог:** ~412 общих продуктов + user-created. Сейчас тянется HTTP fetch'ем из Supabase `products WHERE user_id IS NULL`.
- **Офлайн SLO:** дни. Поездка / плохая связь — приложение должно работать, мутации не теряются, sync при возврате.
- **Конкурентные правки одной строки:** не бывает (sequential multi-device).
- **Backend:** Supabase + Node sidecar (apps/disher-backend-3.0) с `/api/sb/*` proxy для обхода iOS H2 bug #284946.
- **Текущий блокер:** WebKit #284946 + потенциальные WS-баги на iOS, если включить Realtime.

---

## 1. Что мы сравниваем (определения)

### A. Server-first (текущая архитектура)

**Источник истины:** Supabase Postgres.
**Локально:** TanStack Query cache (idb-keyval, persisted 7d) + плоская durable очередь `pendingWrites` (idb-keyval, FIFO, MAX_ATTEMPTS=10, exp backoff cap 30s).
**Mutation flow:** optimistic update в memory collection → enqueue в pendingWrites → drain на online/visibilitychange/manual → invalidate queries только при success/poison/exhausted.
**Compound flows:** online-only gate (createDish, createProduct full, free-text food).
**Файлы:** `pendingWrites.ts`, `syncRowMutationFn.ts`, `SyncProvider.tsx`, `persister.ts`, `supabase-client.ts`, `offlineExecutor.ts`.

### B. Event-sourcing local-first

**Источник истины:** локальный event log (SQLite-in-OPFS у LiveStore / IndexedDB у Dexie / документы у RxDB / collection-БД у TanStack DB) → материализуется в локальные read-models.
**Mutation flow:** commit event локально (синхронно, без сети) → push events на сервер по расписанию или по событию → сервер апплаит в Postgres.
**Compound flows:** один локальный коммит, never online-gated.
**Backend:** Supabase Postgres остаётся как destination, но не как source-of-truth для онлайн-flow.

**Кандидаты в этой категории:**

| Кандидат | Что это | Зрелость | Wasm/bundle |
|---|---|---|---|
| **LiveStore** | Event log + SQLite-in-OPFS, materializers, sync через что угодно | Beta. JWT.sub gotcha (твоя memory) | ~400KB wasm |
| **Dexie + ручной log** | Самописный append-only log в Dexie, свой push/pull | Stable (Dexie). Сам пишешь sync-engine | ~30KB |
| **RxDB** | Document-based local-first, replication-плагины | Stable. 100-150KB+ startup blocking (твоя memory) | 100-150KB |
| **TanStack DB + Realtime** | Не event-sourcing strictly. Local collection + WS subscription | Alpha-ish (`@tanstack/db`) | ~50KB |

⚠️ **TanStack DB здесь — половинчатый кандидат**: ты уже частично используешь его для products. Это не event-sourcing, а server-authoritative с локальной collection. Включён по запросу юзера, но в "офлайн на дни" не вписывается так же чисто, как первые три.

---

## 2. Оси сравнения

Все оси оцениваются для офлайн-режима «дни» и для single-user multi-device sequential.

### Ось 1 — Durability мутации в момент коммита

**Что меряем:** если юзер тапнул "сохранить" и через 100ms закрыл вкладку / разрядил телефон / iOS убил процесс — переживёт ли мутация?

**Server-first:**
- Optimistic update: memory collection (TanStack DB / TQ cache).
- Persist: enqueue в pendingWrites = `idb-keyval.set('foodcalc-pending-writes', [...])` — **асинхронная запись в IndexedDB**.
- TQ persister: `throttleTime: 1000ms` — кэш сбрасывается на диск раз в секунду.
- **Окно потери:** ~50-1000ms между мутацией и flush'ем idb-keyval. Маленькое, но не ноль. На iOS Safari этот flush может прерваться при kill приложения в background.
- Compound flow (createDish online-only): если не в онлайне — мутация не принимается вообще. UX блок.

**Event-sourcing:**
- Commit event синхронно в локальный SQLite/IndexedDB (LiveStore: `store.commit(event)` — внутри SQLite WAL).
- **Окно потери:** доли миллисекунды (SQLite fsync) или сравнимо (IndexedDB transaction для Dexie).
- Compound flow: тот же коммит, не зависит от сети.

**Вердикт:** event-sourcing по конструкции даёт меньшее окно потери. Server-first зависит от throttle'а persister'а и async-природы idb-keyval. На iOS PWA, где процесс может быть убит резко — это реальный риск.

---

### Ось 2 — Поведение при многосуточном оффлайне

**Что меряем:** юзер 3-7 дней без сети, делает 200+ операций (добавляет приёмы пищи, создаёт продукты, редактирует расписание). При возврате online всё уезжает корректно.

**Server-first:**
- pendingWrites растёт линейно. Storage: idb-keyval, лимиты IndexedDB (на iOS Safari — динамическая квота, чистится при low storage).
- 200 операций × ~500 байт = ~100KB. Безопасно.
- Compound flows (createProduct полный, free-text) — **online-only сейчас**. Юзер физически не может создать новый продукт оффлайн. Это блокер для SLO «дни».
- Drain на возврате: FIFO без batching. 200 запросов через iOS H2 (потенциальный pool poisoning) = серия hang'ов, прогресс через 14-30s timeout-ы. Реально может занять минуты.
- MAX_ATTEMPTS=10 на каждый запрос. Если 401 не resolved — операция теряется после exhaust.

**Event-sourcing:**
- Event log растёт линейно. SQLite в OPFS — лимиты те же, но более плотное хранение. 200 событий × ~200 байт = ~40KB.
- Все flows работают офлайн (нет понятия "online-only").
- Push на возврате: один пакет событий (батч), один HTTP POST. Один потенциальный H2-hang, не 200.
- Storage growth: при росте лога нужен snapshot/compaction. LiveStore это умеет, но требует настройки. На горизонте дней-недель не блокер. На горизонте года — да.

**Вердикт:** event-sourcing структурно лучше для multi-day offline. Главная разница — не размер, а **отсутствие online-gate на compound flows** и **батчинг при reconnect**. Server-first сейчас имеет дыру (createProduct/createDish/free-text не работают оффлайн вообще) — это лечится в Tier-1, но требует RPC для compound + enqueueMany.

---

### Ось 3 — Correctness при race conditions (drain ↔ optimistic ↔ refetch)

**Что меряем:** юзер сделал мутацию → drain отправил → сервер принял → клиент рефетчит → есть ли мерцание/потеря.

**Server-first:**
- Известная боль: invalidate после enqueue вызывает race с drain → flicker. Зафиксировано в `feedback_outbox_no_invalidate.md` как индустриальный invariant.
- Фикс: invalidate **только** в drain success/poison/exhausted. Сейчас сделано так. Покрыто тестами (`pendingWrites.test.ts`).
- Timestamp guard (Notesnook/Joplin pattern) — **не реализован**. Окно: если рефетч между push и server commit, переписываются свежие optimistic данные старыми server-данными. Реально редко, но возможно.
- Catalog (user_id IS NULL) и user-data в одной таблице products — refetch может перетасовывать порядок.

**Event-sourcing:**
- Race нет по конструкции: read-model материализуется из event log локально, server push — отдельный канал, не пишет обратно в read-model.
- Reconciliation на возврате: server confirms event N → клиент помечает event N как synced. Read-model не пересобирается.
- LWW конфликты: на single-user sequential их нет.

**Вердикт:** event-sourcing избавляет от целого класса race conditions. Server-first их решает дисциплиной (invariants + тесты), и пока инвариант держится — работает.

---

### Ось 4 — Операционная устойчивость на iOS Safari

**Что меряем:** реальные WebKit баги, которые ловит Disher.

**Server-first:**
- **#284946 (H2 pool poisoning):** на горячем пути fetch. Лечится Plan B (Node proxy /api/sb/*). Рабочее решение, но требует backend в production. Cleanup todo не закрыт.
- Если включить Realtime для multi-device sync: #247943 (WS killed on background без onclose), heartbeat throttling в фоне, WebKit #298616/#302561 в перспективе iOS 26.
- Каждый WebKit-бюллетень = потенциальный регресс на горячем пути.

**Event-sourcing:**
- Сеть не на горячем пути. fetch может зависнуть — юзер не видит. Push дотолкается на следующий visibilitychange / online / периодический тик.
- Если push идёт через тот же `fetch` к Supabase — #284946 ловится **на push'е**, в фоне. Окно потери: время между мутацией и успешным push'ем. Для single-device это ОК (данные на устройстве). Для multi-device durability — то же ограничение, что у server-first после потери устройства до push'а.
- WS не нужен для core flow → класс WS-багов не ловится.
- **Caveat:** push-канал всё равно где-то делает HTTP. Можно пустить через тот же Node proxy → #284946 не страшен.

**Вердикт:** event-sourcing структурно убирает iOS-баги с горячего пути. Не делает их не существующими — но переводит из «юзер видит hang» в «фоновая задача retry'ит». Server-first завязан на работающий fetch на каждой мутации.

---

### Ось 5 — Multi-device (sequential) sync

**Что меряем:** юзер на телефоне утром, на ноуте вечером. Изменения с телефона должны быть на ноуте без ручного pull.

**Server-first:**
- Pull: TanStack Query refetch на focus / interval / manual. Источник — Supabase REST.
- Push: drain pendingWrites при online.
- Live updates: только если включить Supabase Realtime → класс WS-багов на iOS.
- В текущем виде (без Realtime) — multi-device работает через refetch, задержка 30s-несколько минут. Для sequential юзера это ОК.

**Event-sourcing:**
- Pull events: long-poll / WS / периодический GET от serverTimestamp. LiveStore сам не решает — sync transport pluggable.
- Push events: тот же канал в обратную сторону.
- В sequential модели можно делать pull раз в минуту HTTP GET — без WS, без iOS-багов. Latency 30-60s — приемлемо.
- Catalog (read-only global data) — отдельный pull-канал, не event-sourced.

**Вердикт:** для sequential multi-device обе архитектуры справляются с polling-подходом. Ни одна не требует WS обязательно. Преимущество event-sourcing: одна модель данных (events) для local + sync, не два разных контракта.

---

### Ось 6 — Recovery после corruption / quota / iOS storage eviction

**Что меряем:** OPFS/IndexedDB на iOS периодически вычищаются при low storage. Что переживает приложение.

**Server-first:**
- pendingWrites потерян → не отправленные мутации потеряны.
- TQ cache потерян → перетянется с сервера при online. Но при оффлайне — пустой UI (если cache не загрузился).
- APP_VERSION buster: при mismatch очередь дропается без send (твоя memory `feedback_corner_case_frontload.md`).
- Recovery: нужен online, нужен сервер.

**Event-sourcing:**
- Event log потерян → потеряны не-synced события + возможность replay.
- Если synced события на сервере: можно re-pull с сервера (как fresh install). Single source of recovery — сервер.
- LiveStore: storage probe на boot (твоя memory `project_outbox_audit_2026_04_28.md` — у server-first этого нет, но invariant тот же).
- Размер event log на iOS OPFS: тяжелее quota'у, чем pendingWrites. Риск eviction выше, но recovery симметричен.

**Вердикт:** обе архитектуры зависят от сервера для recovery. Event-sourcing держит больше данных локально → больше потенциальная потеря при eviction, но и больше шансов выжить без сети.

---

### Ось 7 — Storage growth (год+ горизонт)

**Server-first:**
- pendingWrites: при reliable drain — пуст или единицы записей. Не растёт.
- TQ cache: ограничен gcTime=7d, фактически снимок working set.
- Stable footprint, ~100KB-1MB на пользователя.

**Event-sourcing:**
- Event log: монотонно растёт.
- 1 год × 5 events/день = ~1800 events × 200 байт = 360KB. Не страшно.
- Активный юзер 50 events/день = 3.6MB/год. На грани комфорта iOS OPFS.
- LiveStore snapshot/compaction: периодически делает snapshot read-model + truncate log до snapshot. Требует реализации стратегии. У Dexie/самописного — пишешь сам.
- На горизонте дней-недель не вопрос. На горизонте года — реальная инженерная задача.

**Вердикт:** server-first имеет flat storage. Event-sourcing требует compaction strategy на длинном горизонте. Не блокер, но ещё одна вещь, которую надо построить и держать.

---

### Ось 8 — Migrations схемы

**Server-first:**
- Postgres migrations (Supabase). Клиент мапит camelCase, оптимистичный payload подстраивается.
- Schema drift между клиентом и сервером: APP_VERSION buster дропает кэш и pendingWrites.

**Event-sourcing:**
- **Юзер сказал: миграций схемы не будет.** Принимаю как факт.
- Для записи: если когда-нибудь понадобится — upcasters в LiveStore. Не сейчас.

**Вердикт:** ось снимается по решению юзера. Не входит в decision matrix.

---

### Ось 9 — Зрелость и production red flags

**Server-first:** все компоненты mature.
- TanStack Query — production-grade, миллионы пользователей.
- idb-keyval — простая обёртка, стабильная.
- Supabase + Postgres — production.
- Свой outbox — простой, тестами покрыт.
- Linear/Notion/Telegram используют ту же модель (твоя memory `project_simplification_tier1.md`).

**Event-sourcing кандидаты:**
- **LiveStore:** beta, JWT.sub gotcha с sync-cf, 400KB wasm, требует Vite ≤6.1.x (твоя memory `project_livestore_devtools_vite6.md`). Малое production-deployment в реальных продуктах.
- **Dexie + самописный log:** Dexie production-grade, сам sync-engine — твой код. Полный контроль, полная ответственность за корнер-кейсы (твоя memory `feedback_corner_case_frontload.md` про front-loading кейсов).
- **RxDB:** stable, но 100-150KB startup blocking, replication-плагин под Supabase community-уровня.
- **TanStack DB:** alpha. `@tanstack/db` пока не 1.0. Меньше прецедентов в production.

**Вердикт:** server-first — самая mature опция. Event-sourcing варианты — beta/alpha/самописный. Это плата за их преимущества.

---

### Ось 10 — Backend impact

**Server-first:**
- Backend = Supabase Postgres + Node proxy. Никаких изменений серверной логики при добавлении фич клиента.
- Compound RPC (`create_dish_full`, `create_product_full`) — нужны для офлайн compound, в Tier-1 plan.

**Event-sourcing:**
- Сервер должен принимать events и апплаить в Postgres.
- Либо: endpoint `/events` который применяет каждое событие (нужна логика на сервере).
- Либо: events транслируются в SQL через клиент перед push (тогда сервер тот же).
- LiveStore-sync-cf требует свой backend (Cloudflare Worker), но JWT.sub проблема.
- Самописный sync на Supabase: пишешь Postgres function `apply_event(event jsonb)` или table-per-event-type insert. Реальная работа.

**Вердикт:** event-sourcing требует серверной логики поверх таблиц. Не хитрой, но реальной. Server-first тривиален — Supabase REST уже всё умеет.

---

## 3. Сводная матрица (без вывода)

| Ось | Server-first (текущий) | LiveStore | Dexie+log | RxDB | TanStack DB+Realtime |
|---|---|---|---|---|---|
| 1. Durability коммита | ~50-1000ms окно | ~ms (SQLite) | ~ms (IDB tx) | ~ms | ~50-1000ms |
| 2. Multi-day offline | работает, но compound online-only | работает полностью | работает полностью | работает полностью | частично (зависит от collection persist) |
| 3. Race conditions | дисциплиной + тесты | по конструкции нет | если правильно написал log | по конструкции для replication | те же что server-first |
| 4. iOS WebKit стойкость | fetch на горячем пути | сеть в фоне | сеть в фоне | сеть в фоне | WS на горячем пути |
| 5. Multi-device sequential | refetch polling | events polling/WS | sам пишешь | replication-плагин | WS обязателен |
| 6. Recovery после eviction | через сервер | через сервер | через сервер | через сервер | через сервер |
| 7. Storage growth | flat | растёт, нужен compaction | растёт, сам пишешь compaction | растёт | flat |
| 8. Migrations | вне рамок | вне рамок | вне рамок | вне рамок | вне рамок |
| 9. Зрелость | mature | beta + JWT gotcha | mature DB + custom code | stable + 100KB | alpha |
| 10. Backend impact | тривиально (Supabase REST) | нужен event endpoint | нужен event endpoint | replication backend | trivially |

---

## 4. Ключевые open questions для решения

1. **iOS H2 fix через proxy — это решение или обход?**
   Plan B (Node proxy) работает. Если он production-ready — server-first iOS-проблема в основном решена. Если у proxy будут свои issues (latency, deploy, scaling) — event-sourcing смотрится сильнее.

2. **Compound flows offline — насколько критично?**
   Сейчас createDish/createProduct full/free-text — online-only. Если юзер часто оффлайн на дни, это **реально мешает**. Tier-1 plan включает RPC для compound, но всё ещё требует online (просто меньше round-trips). Event-sourcing решает по конструкции.

3. **Готов ли юзер поддерживать compaction strategy через год?**
   Если приложение долгоживущее — event log compaction станет работой. Если горизонт <1 года — пофиг.

4. **Realtime для multi-device — точно нужен или polling раз в минуту хватает?**
   Если хватает — server-first без Realtime вообще не ловит WS-баги. Если нужен мгновенный sync — оба подхода требуют WS, оба ловят iOS WS-баги.

5. **PoC риска LiveStore JWT.sub:**
   Зафиксирован в memory как блокер для sync-cf. Если идти в LiveStore — нужно подтвердить, что custom sync transport (не sync-cf) обходит проблему.

---

## 5. Что НЕ изменится при переходе

Чтобы юзер не ждал серебряной пули:

- **iOS H2 баг #284946** — структурный WebKit баг, лечится proxy. Любая архитектура, которая делает HTTP fetch к Supabase, его ловит. Event-sourcing просто прячет в фон.
- **Caталог как read-only данные** — нужен pull-канал в обоих случаях. Не event-sourced.
- **Auth invariant** (твоя memory `project_auth_invariant.md`) — refresh token, 401-retry — нужен в обеих архитектурах.
- **Storage probe на boot** — нужен в обеих (твоя memory `project_outbox_audit_2026_04_28.md`).
- **APP_VERSION buster** — нужен в обеих, на разных уровнях.

---

## 6. Что добавить в это сравнение, если потребуется empirical evidence

(не делаем сейчас, но фиксируем как опции)

- Мини-PoC: LiveStore с одной entity (например, daily-norm) рядом с текущим server-first, 1-2 дня. Замерить bundle, boot time, durability при kill во время мутации, behavior при iOS H2 hang.
- Telemetry на текущем server-first: сколько мутаций реально теряется в окне между optimistic и idb-keyval flush. Если ноль — Ось 1 не аргумент.
- Replay из diag-logs: сколько процентов сессий ловят #284946 после внедрения proxy.

---

**Конец первоначального сравнения.**

---

## 7. Вывод (после web-research 2026-04-29)

Юзер попросил вывод и проверку гипотезы «iOS может удалить данные при неиспользовании, и event-sourcing не спасёт от этого сам по себе». Проверил.

### 7.1 Главный факт, который меняет картину

**iOS Safari storage eviction policy (WebKit blog, Apple Dev Forums, эмпирика 2023-2026):**

| Контекст | Eviction policy |
|---|---|
| Safari tab (обычный сайт) | 7-day cap на script-writable storage при отсутствии user interaction |
| Home-Screen PWA (Add to Home Screen, standalone display) | **Не подпадает под 7-day eviction.** Только под general quota pressure (low device storage). |
| `navigator.storage.persist()` (с Safari 17) | Доступен. WebKit grants его эвристикой, **главная эвристика — установлен ли сайт как Home-Screen PWA.** Гарантия защиты от eviction (но не от ручной очистки юзером). |

**Прямая цитата WebKit:** «When a web app is running standalone (as Home Screen Web App on iOS or Web App added to dock on macOS), it has the same origin quota and overall quota as when it is opened in a browser app… Origins might be excluded from eviction if it has active page at the time of eviction, **or its storage is in persistent mode**.»

**Эмпирика HN-тред (2023):** юзер хранил «тысячи изображений» в IndexedDB через Home-Screen PWA с октября — данные пережили месяцы. В Safari tab та же страница теряла данные через 7 дней.

### 7.2 Что это значит для Disher

**Гипотеза юзера была чрезмерно пессимистичной.** «iOS удаляет данные при неиспользовании» верно для **Safari tab**, не для Home-Screen PWA. А Disher позиционируется как PWA — пользователи добавляют на главный экран.

**Защита данных на iOS складывается из трёх слоёв:**

1. **Add-to-Home-Screen onboarding.** Это **самая сильная защита**, доступная на вебе. Юзер, не добавивший на главный экран, в Safari tab — потеряет данные через 7 дней при неактивности. Это правда **независимо от архитектуры** (event-sourcing vs outbox — оба теряются).

2. **`navigator.storage.persist()` запрос.** Safari 17+ его уважает. Главная эвристика для grant — Home-Screen PWA. То есть слои 1 и 2 работают вместе: добавил на главный экран → запросил persist() → получил защиту от eviction.

3. **Cloud backup (server) как single source of recovery.** В обоих архитектурах при eviction recovery идёт с сервера.

**Слой 1 + слой 2 вместе делают eviction практически невозможным на iOS Safari 17+ при правильном onboarding.** Это ослабляет одно из главных преимуществ event-sourcing (что он лучше переживает оффлайн на дни) — server-first переживает то же самое, если данные не вычищаются.

### 7.3 Что про LiveStore

GitHub: текущий релиз `0.4.0-dev.22` (29 апреля 2026). 239 open issues. README не содержит claims о production-readiness. Не нашёл ни одного production case study реального продукта на LiveStore. Это **подтверждает** твою же memory `project_simplification_tier1.md` («LiveStore beta + JWT.sub проблема»).

LiveStore-курс на codewithbeto.dev есть — это образовательный контент, не свидетельство production deployments.

Indirect signal: LiveStore автор — Schickling (бывший Prisma core), сильное имя, активная разработка. Но **на 2026-04-29 это ещё не та технология, на которой строят продакшен food-tracker для iOS Safari пользователей**.

### 7.4 Что про event-sourcing food-tracker прецеденты

Не нашёл production food-tracker на event-sourcing/local-first. CushionDB — фреймворк, не продукт. Pain Tracker, workout tracker (Schroedingberg/progressive) — мелкие хобби-проекты. **MyNetDiary, Cronometer, FoodNoms, Lose It** — все server-authoritative (твоя же memory `project_simplification_tier1.md` это уже фиксировала).

Это **не доказывает**, что event-sourcing для food-tracker — плохая идея. Это значит, что **никто из больших не доказал, что это хорошая идея**, и ты будешь первопроходцем.

### 7.5 Финальный вывод (рекомендация)

**Я бы остался на server-first и закрыл слой защиты данных через PWA-onboarding + persist().**

Логика по убыванию веса:

1. **Главный аргумент за уход в event-sourcing был «iOS удаляет данные».** Web-research показывает: при правильном PWA onboarding (Add to Home Screen + `navigator.storage.persist()`) eviction практически снят. Аргумент сильно ослаблен.

2. **iOS H2 баг (#284946) уже решён** Plan B (Node proxy). Это была вторая большая боль. Оставшаяся работа — закрыть cleanup todo (убрать iOS-only serialization, увеличить timeout) — это часы, не недели.

3. **LiveStore на 2026-04-29 — `0.4.0-dev`, без production case studies.** Идти на нём в продакшен food-tracker — это бета-тестировать сразу два продукта, свой и фреймворка. Для single-developer-проекта это много.

4. **Event-sourcing структурно лучше по 4 осям из 10**, но эти 4 оси (durability коммита, multi-day offline для compound flows, race conditions, iOS стойкость) — на практике для Disher либо уже решены (H2 proxy), либо решаются меньшими средствами в Tier-1 (compound RPC решает offline для createDish/createProduct, MAX_ATTEMPTS=10 + invariant-test покрывают race conditions).

5. **Sequential single-user multi-device** — это профиль, на котором event-sourcing **не раскрывает свои сильные стороны** (CRDT-like merge, real-time collab). Tier-1 server-first для этого профиля адекватен.

### 7.6 Что я бы добавил в Tier-1 на основе research'а

Конкретные actionable пункты, которые усиливают server-first вместо переписывания:

1. **PWA onboarding flow** — баннер «Add to Home Screen» с инструкцией, **самый высокий ROI для durability на iOS**. Без этого никакая архитектура не спасёт.
2. **`navigator.storage.persist()` запрос на boot** — после первого мутирующего действия. На Safari 17+ даёт реальную защиту от eviction. Дешёвый патч.
3. **Storage probe на boot** (уже зафиксировано как gap в `project_outbox_audit_2026_04_28.md`) — детектит eviction случилась, форсит refresh с сервера.
4. **Compound RPC** (Tier-1 пункт 2) — снимает «createDish online-only» ограничение. Это закрывает Ось 2 multi-day offline.
5. **Telemetry на потерянные мутации** — diag-logs уже есть, добавить event на drop-after-MAX_ATTEMPTS. Если в реальности счётчик околонулевой — Tier-2 (event-sourcing) не нужен никогда.

### 7.7 Когда вернуться к event-sourcing

Чёткие триггеры для пересмотра:

- Persist API на iOS перестаёт работать или Apple меняет policy → одна из главных опор обвалится.
- Telemetry показывает >1% потерянных мутаций в реальных сессиях → server-first не справляется.
- Появляется реальная нужда в multi-user collab или offline-first compound flows за гранью того, что покрывает RPC → server-first неадекватен профилю.
- LiveStore выходит в 1.0 с production case studies → стоимость риска падает.

Пока ничего из этого не верно — Tier-1 + PWA onboarding адекватны.

---

---

## 8. Pushback: «Apple ITP всё равно удаляет данные PWA через 7 дней» — кто прав?

Юзер принёс цитату из блога/сводки, утверждающую, что Home-Screen PWA на iOS подпадают под 7-day eviction. Это **прямо противоречит** моему предыдущему выводу. Пошёл к первоисточнику WebKit — единственному источнику, который имеет вес.

### 8.1 Что говорит первоисточник (WebKit Tracking Prevention page)

**Прямая цитата с https://webkit.org/tracking-prevention/:**

> «The first-party domain of home screen web applications is exempt from ITP's 7-day cap on all script-writeable storage… ITP always skips that domain in its website data removal algorithm… the website data of home screen web applications is kept isolated from Safari and thus will not be affected by ITP's classification of tracking behavior in Safari.»

Apple Developer Forums thread 710157 — community-developer цитирует эту же страницу. Apple staff в треде не отметился (минус), но и не опроверг. Никто из dev-community не сообщает о потере данных Home-Screen PWA в 2024-2026 после соблюдения onboarding.

### 8.2 Где сводка из блогов ошибается

Цитата из сводки юзера:
> «Если пользователь не открывает PWA, установленное на рабочий стол, в течение 7 дней, iOS/Safari автоматически удаляет весь кэш Service Worker, данные IndexedDB и LocalStorage.»

Это **не подтверждается WebKit-первоисточником**. Источники сводки (MagicBell, itnext, vinova, tigren) — third-party блоги, **они путают две разные политики**:

- **ITP 7-day cap** — действительно существует, но с явным исключением для Home-Screen Web Apps (см. цитату выше).
- **General quota eviction под storage pressure** — существует, не привязан к 7 дням, срабатывает только когда устройство мало места. От него защищает `navigator.storage.persist()` (Safari 17+).

Блоги цитируют ITP-правила, не упоминая исключение, и обобщают на PWA. Это типичная ошибка вторичных источников.

### 8.3 Где сводка частично права

1. **«PWA — это веб-bookmark в глазах Apple»** — частично. Standalone display mode действительно не даёт всех привилегий нативного приложения (нет background sync, нет push до недавнего, ограниченный фоновой жизни). Но storage retention — отдельная политика, и там exempt.

2. **«Push notifications нужны для persist()»** — статья MagicBell 2026 это утверждает. Не нашёл прямого подтверждения у WebKit. Возможно, эвристика (notifications = engagement signal), не hard requirement. Нужно проверить эмпирически.

3. **«Для серьёзного оффлайна — Capacitor / Cordova / нативка»** — **это объективно более надёжный путь**. Не потому что Home-Screen PWA теряет данные через 7 дней (не теряет), а потому что:
   - Apple может изменить политику (как уже несколько раз меняли).
   - Quota eviction под device storage pressure всё равно существует.
   - User-driven actions (Settings → Safari → Clear) всё равно сносят данные.
   - Native filesystem даёт полный контроль и backups через iCloud.

### 8.4 Кто прав, по сумме

**По вопросу «удалит ли iOS данные Home-Screen PWA через 7 дней неактивности»:**
- WebKit official docs: НЕТ, exempt.
- Эмпирика developer-community: НЕТ.
- Блоги/сводки: ДА (они ошибаются, путают ITP с general policy).
- **Я был прав в предыдущем выводе.**

**По вопросу «надёжна ли PWA для serious offline-first на iOS»:**
- 7-day eviction — миф (для Home-Screen PWA).
- Но quota pressure eviction, политические изменения Apple, user clears — реальные риски.
- **Сводка частично права в духе:** для приложений, где данные пользователя — это его актив (медицинский трекер, food log за годы, financial), нативка надёжнее. PWA — компромисс.

### 8.5 Что я недооценил в первом выводе

Честно:

1. **`navigator.storage.persist()` на iOS требует доверия Apple's heuristic.** WebKit пишет «based on heuristics like whether the website is opened as a Home Screen Web App». «Like» означает «один из факторов», не «sufficient». Heuristic непрозрачна, может включать notification permission, frequency of use, etc. То есть persist() — не гарантия, а probability boost.

2. **Apple меняет политику регулярно.** ITP версий — 1.0, 2.0, 2.1, 2.3 и далее. Каждая ужесточала правила. Что exempt сегодня — может стать «exempt только если notifications enabled» завтра.

3. **User trust** — отдельная ось, которую я в первом сравнении не разобрал. Вынесу ниже отдельной секцией.

---

## 9. Manual sync / file-based / data sovereignty — third option

Юзер упомянул: «есть приложения которые вообще вручную синхронизируются — передачей файла». Это реальный и недооценённый паттерн. Разбираю.

### 9.1 Что это за класс приложений

Категория: **local-only с manual export/import**. Пользователь полностью владеет файлами своих данных. Никакого облака.

Прецеденты:
- **Obsidian** — markdown vault на диске. Sync через iCloud/Dropbox/Git/manual file copy. Local-first by design.
- **Joplin** — local SQLite + опциональный sync (Dropbox/WebDAV/local folder). Можно работать вообще без sync.
- **Standard Notes** — encrypted local + опциональный server (E2E).
- **GnuCash, KeePass, ledger-cli** — десктоп-родом, файл-based, full ownership.
- **Logseq** — markdown files + optional sync.

Все они объединены: **юзер видит файл, может скопировать, бэкапнуть, переслать. Apple не имеет права удалить файл из iCloud Drive / Dropbox.**

### 9.2 Почему это сильно для food tracker

**Психологический фактор (твой инсайт):** «доверие пользователя выше, если данные не видны и только для него». Это не маркетинг, это реальное конкурентное преимущество в категории, где:

- Health/food data sensitive (HIPAA-tier по психологии, не по регуляции).
- Калькуляторы калорий имеют плохую репутацию (MyFitnessPal был куплен Under Armour, продал данные → отток).
- Продукт без облака = нет рисков breach, нет subscription, нет «компания закрылась → данные потеряны».

**Технически:** food tracker отлично ложится в файловый формат:
- Per-day JSON / SQLite файл с приёмами пищи.
- Каталог продуктов — отдельный shareable файл (можно публиковать как seed).
- Schedule / диета — конфигурационный файл.
- Размер — десятки KB в год для активного юзера.

### 9.3 Архитектурные паттерны для PWA

**Вариант A — File System Access API (Chrome desktop only):**
- `showDirectoryPicker()` → юзер выбирает папку (e.g. iCloud Drive folder) → приложение пишет туда напрямую.
- На iOS Safari — НЕ работает. Fallback нужен.

**Вариант B — Manual export/import + OPFS:**
- Текущая работа в OPFS (durable, exempt от ITP).
- Юзер может в любой момент: «Export → JSON file» → файл сохраняется через стандартный download → юзер кладёт в iCloud Drive / Dropbox / shares в Telegram.
- «Import → from file» → восстановление.
- Это работает на iOS Safari **сейчас**, без специальных API.

**Вариант C — File-system-as-source-of-truth с sync через iCloud Drive:**
- Не доступно в PWA на iOS. Требует Capacitor / native wrapper.
- Это путь Obsidian.

### 9.4 Гибрид для Disher: «server + manual export» опция

Конкретная идея:

Сохранить server-first архитектуру (для UX и multi-device sync через cloud), **но добавить manual export/import как отдельный first-class feature**:

1. **«Export full backup»** — кнопка в Settings. JSON-файл со всеми schedules, products, daily-norms. Юзер сохраняет куда угодно.
2. **«Import from backup»** — приём JSON-файла. Полная замена или merge.
3. **«Privacy mode»** — опция в Settings, которая **отключает sync с сервером**. Все данные остаются в OPFS. Юзер сам экспортирует backup'ы. Если включит sync обратно — full re-upload.
4. **Local-only от рождения** — при регистрации опция «Skip cloud sync, use local only». Никаких API ключей, никакого профиля, никакого backend. Только client + manual exports.

**Плюсы:**
- Маркетинговый message: «Disher — единственный food tracker, где ты владеешь своими данными».
- Технически реализуемо в server-first, без переписывания архитектуры. Manual export — это просто dump текущего state.
- Закрывает корнер-кейс «Apple меняет policy» — у юзера всегда есть файл-бэкап.
- Даёт право выбора: облако-юзеры получают sync, privacy-юзеры — sovereignty.

**Минусы:**
- Маркетинговый message противоречит «multi-device sync» (но юзер сам выбирает). Это feature flag, не дилемма.
- Backend всё равно нужен для compound RPC и каталога. Privacy-mode юзер получает только локальный каталог (412 продуктов в seed файле).
- Multi-device sync для privacy-mode юзеров — manual через export/import между устройствами. ОК для редкого использования.

### 9.5 Event-sourcing vs Manual sync — это разные оси

Это важно: event-sourcing решает **технические** проблемы (durability, conflict resolution, offline). Manual sync решает **отношенческие** проблемы (trust, ownership, vendor independence).

Можно делать manual sync поверх server-first (как описано выше).
Можно делать manual sync поверх event-sourcing (LiveStore тоже умеет export).

**Не нужно выбирать event-sourcing ради trust.** Trust решается отдельным фичем.

---

## 10. Обновлённый вывод

**Решение остаётся:** server-first + Tier-1 упрощения. Но добавляется новый пункт.

**Tier-1 plan дополнения (в порядке ROI):**

1. **PWA onboarding flow** (Add to Home Screen baner) — **самый высокий ROI**. Без этого Safari tab юзеры теряют данные через 7 дней (ITP правило). Home-Screen PWA — exempt.
2. **`navigator.storage.persist()` запрос** на boot после первой мутации — закрывает quota-pressure eviction.
3. **Manual export/import** как first-class feature — **новый пункт** на основе твоего инсайта про privacy. Дёшев, market-differentiating, страхует от любых будущих Apple policy changes.
4. **Storage probe на boot** — детектит eviction случилась, форсит refetch с сервера.
5. **Compound RPC** — снимает «createDish online-only».
6. **Telemetry на drop-after-MAX_ATTEMPTS** — даст эмпирику для решения, нужен ли Tier-2.
7. **«Privacy mode» / local-only opt-out** — на post-v1, после валидации основного flow.

**Когда вернуться к event-sourcing:**

- Telemetry показывает >1% потерянных мутаций (server-first неадекватен).
- Apple меняет storage policy и ломает Home-Screen PWA exemption (но manual export уже страхует).
- LiveStore выходит в 1.0 с production case studies.
- Появляется multi-user collab или CRDT-сценарии.

Manual export добавление — закрывает большую часть «что если Apple подведёт» рисков **без архитектурной перестройки**. Это и есть инсайт юзера переведённый в actionable план.

---

---

## 11. Реальные числа (1200 schedules + 50 products + 50 dishes за год)

Юзер задал конкретный вопрос: «1200 schedules + 50 products + 50 dishes — server-first это нормально вытянет, или event-sourcing объективно лучше для этого профиля?»

### 11.1 Замер по фактическим типам Disher

Считал по `src/entities/*/model/types.ts` и `supabase/migrations/20260424000000_initial_schema.sql`.

| Entity | Кол-во | Средний размер JSON | Raw | Gzipped |
|---|---|---|---|---|
| ScheduleFood | 1200 | 280 B | 336 KB | 84 KB |
| Product (user) | 50 | 1000 B | 50 KB | 12 KB |
| Dish + items + portions | 50 | 1200 B | 60 KB | 14 KB |
| DailyNorm | 3-5 | 500 B | 2 KB | <1 KB |
| ScheduleEvent | 200 | 450 B | 90 KB | 22 KB |
| Period | 2-3 | 100 B | <1 KB | <1 KB |
| **Итого за год** | | | **~540 KB** | **~135 KB** |

Контекст:
- IndexedDB на iOS — квота динамическая, минимум сотни MB на origin (Safari 17+ — до 60% disk space).
- 540 KB — **меньше 0.1%** от типичного бюджета.
- Каталог 412 общих продуктов (через REST) — ещё ~400 KB. С каталогом всего ~1 MB.

### 11.2 Будет ли server-first это вытягивать

**TanStack Query cache** (текущая):
- 1200 schedules в `useAllSchedulesQuery` → один массив в кэше → ~340 KB.
- Persist через idb-keyval throttled 1s — ОК.
- React-render списка из 1200 — нужна виртуализация (react-window). Это UI задача, не storage.
- Memory footprint при загрузке: ~5-10 MB JS heap (объекты с замыканиями) — на iOS приемлемо.

**pendingWrites outbox**:
- 1200 операций НЕ копятся одновременно. Drain пуст в нормальном режиме.
- Worst case (юзер 7 дней оффлайн, делает 200 правок): 200 × ~500 байт = 100 KB. Нормально.

**Refetch / network**:
- Полный refetch schedules: ~340 KB JSON через iOS proxy → 1-3 секунды на быстрой сети, 5-10s на slow.
- TanStack Query `staleTime: 5min` — refetch не чаще раза в 5 минут.
- При first-load после persist hit — данные из кэша мгновенно, refetch в фоне.

**Вердикт:** **Объёмы тривиальные.** Server-first их вытянет без проблем. Это не аргумент в пользу event-sourcing. Disher не Notion с миллионом блоков, не Obsidian с 50K заметок. Food tracker — small structured data.

### 11.3 Где event-sourcing был бы объективно лучше

Не на storage volume. На двух других вещах:

1. **Boot performance.** 1200 schedules в TanStack cache на boot — ~50-100ms parse + materialize. В SQLite-in-OPFS (LiveStore) — ms (это native query). Разница ощутима, но не блокер.

2. **Querying.** В TanStack cache `useAllSchedulesQuery().data.filter(s => s.date === today)` — линейный скан 1200 на каждый render. Виртуализация UI лечит, но логически грязно. В LiveStore — реальный SQL `SELECT WHERE date = ?` с индексом, сложность O(log n).

**Контр-аргумент:** оба пункта решаются в server-first без LiveStore:
- Заменить `useAllSchedulesQuery` на `useSchedulesByDateRangeQuery(start, end)` — server отдаёт только нужное окно (e.g. ±7 дней). Сейчас `queries.ts` тянет всё целиком — это **техдолг, не архитектурная необходимость**.
- IndexedDB сам поддерживает индексы. idb-keyval как раз не использует, но Dexie — да. Можно мигрировать persistence на Dexie с индексами без перехода в event-sourcing.

То есть **«1200 элементов»** — не аргумент за event-sourcing, а аргумент за **скоупленные queries вместо useAll***. Это отдельный refactor, ~1-2 дня.

### 11.4 Вывод по числам

Server-first для профиля 1200 schedules + 50 products + 50 dishes — **не работает «впритык», работает с большим запасом**. Storage ОК, network ОК, memory ОК. UX-боль (slow filter на 1200) лечится скоупленными queries или Dexie-индексами, не сменой архитектуры.

Если у тебя инстинкт «как-то много» — это про UX (рендер списка), не про архитектуру. Виртуализация + `staleTime` + scoped queries закрывают это.

---

## 12. Альтернатива: server-first + snapshot backup (без event log)

Юзер задал ключевой вопрос: «А если event sourcing заменить просто на бекап по кнопке/раз в день, и на сервере решать конфликты?»

Это **третий путь**, который я в первом сравнении не рассмотрел. Разбираю.

### 12.1 Что это за модель

**Архитектура:**
- Server-first остаётся (Supabase Postgres + outbox). Mutation flow тот же.
- **Дополнительно:** периодически (раз в день, или по триггерам типа visibilitychange-after-N-mutations) клиент **снимает snapshot** всего своего state и шлёт на backend.
- Snapshot = JSON dump всех entity юзера.
- Backend хранит snapshot'ы в отдельной таблице `user_snapshots` (или S3 bucket): `{ user_id, snapshot_at, payload jsonb, app_version }`.
- TTL: keep last 30 daily / 12 monthly / forever-yearly (Apple Time Machine pattern).
- Опционально: «Export to file» — downloads тот же snapshot локально (overlap с §9).

### 12.2 Что это решает

| Проблема | Решает? | Как |
|---|---|---|
| iOS storage eviction (Home-Screen exempt + Safari tab loss) | Частично | Снимок на сервере → recovery возможен. Но live-state теряется до последнего snapshot'а. |
| Apple меняет policy в будущем | Да | Snapshot существует независимо от клиентского storage. |
| Юзер случайно удалил данные / accidental delete | Да | «Restore from snapshot N days ago» — киллер-фича. Server-first без snapshot'ов этого не делает. |
| Multi-device sequential | Не нужно (server-first уже умеет refetch) | Snapshot для archival, не для sync. |
| Multi-device конфликты | См. §12.3 ниже | Snapshot — не conflict resolution mechanism. |
| User trust / data sovereignty | Частично | Snapshot на сервере не равен «у меня файл на руках». Дополнить «Export to file» — да. |
| Compound flows offline | Не решает | Outbox/RPC решает это отдельно. |
| Durability коммита (~50-1000ms окно) | Не решает | Snapshot — periodic, не on-write. |

### 12.3 Multi-device конфликты — что значит «решать конфликты на сервере»

Юзер уточнил: «решать конфликты между устройствами, если есть».

**Контекст из профиля:** конкурентных правок одной строки не бывает (sequential). Это не CRDT-сценарий.

**Реальные конфликты в sequential multi-device:**
1. **A создал product X оффлайн → B создал product X оффлайн → оба online → две записи с разными UUID**, но одинаковым именем. Не конфликт строки, а duplicate entity.
2. **A удалил schedule → B отредактировал тот же schedule → reconcile.** Здесь да, race возможна.
3. **A на iPhone сделал 50 правок оффлайн неделю → online → B на десктопе тем временем сделал 5 правок.** Pendingwrites с обеих сторон, drain в один Postgres.

**Решения для server-first (без event-sourcing):**
1. **Last-Write-Wins по `updatedAt`** — стандартный паттерн. Работает для sequential (latest commit wins). Покрытый кейс — случай 2 выше: B's update приходит позже A's delete → strange undelete. Лечится `deleted_at` soft-delete (уже есть в Disher schema) + правило «delete вин над update».
2. **Server-side `INSERT … ON CONFLICT … DO UPDATE WHERE old.updated_at < new.updated_at`** — atomic LWW в Postgres. Уже доступно через Supabase upsert.
3. **Duplicate entity (случай 1)** — бизнес-логика на клиенте. UI-фича «Merge duplicates» в Settings, не sync-проблема.
4. **Snapshot backup как fallback** — если что-то пошло не так и юзер потерял данные, restore из snapshot N часов назад. Это **не решает конфликты, но даёт safety net.**

### 12.4 Сравнение трёх вариантов на оси «recovery»

| Сценарий | Server-first (текущий) | Server-first + daily snapshot | Event-sourcing local-first |
|---|---|---|---|
| Юзер потерял phone, зашёл с десктопа | Все данные с сервера через REST | То же (snapshot — это tier-2 backup) | Re-sync events с сервера |
| Apple вычистил storage iOS PWA | Refetch с сервера → восстановление | То же | Re-sync events с сервера |
| Бага в клиенте записала мусор в БД | **Нет recovery** — мусор уехал на server | **Restore из snapshot вчера** | Replay events до commit'а бага (если ты знаешь, какой event broken) |
| Юзер случайно удалил schedule неделю назад | Soft-delete только если в Disher schema (есть). Иначе **no recovery**. | **Restore из snapshot N дней назад** | Replay events без delete-event |
| Юзер хочет «откатиться к состоянию месяц назад» | **Нет** | **Да** | Да (replay до timestamp) |
| Backend corrupted (DB lost) | **Все данные потеряны** (если нет PG backup) | **Snapshot'ы — secondary backup** | Replay events с клиентов |

**Ключевой инсайт:** snapshot backup даёт **большую часть recovery-преимуществ event-sourcing** (point-in-time restore, accident recovery, data immutability) **без сложности event log'а**.

### 12.5 Что snapshot backup НЕ решает (vs event-sourcing)

Честно:

1. **Granularity recovery.** Event-sourcing восстанавливает до конкретного события. Snapshot — до snapshot'а раз в день / час. Если юзер сделал 50 правок с момента последнего snapshot'а и хочет откатить только одну — не получится, либо «всё за день», либо ничего.

2. **Audit log.** Event-sourcing даёт «что и когда юзер делал». Snapshot — нет. Для food-tracker это не критично, но если когда-нибудь захочется аналитики «как менялись привычки» — не из snapshot'ов.

3. **Optimistic durability коммита.** Event-sourcing комитит синхронно в локальный SQLite. Server-first + snapshot всё равно имеет окно ~50-1000ms между мутацией и idb-keyval flush.

### 12.6 Реализация snapshot backup в Disher

**Backend:**
```sql
CREATE TABLE user_snapshots (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users,
  taken_at timestamptz NOT NULL DEFAULT now(),
  app_version text,
  payload jsonb NOT NULL,  -- gzipped client-side?
  CHECK (jsonb_typeof(payload) = 'object')
);
CREATE INDEX ON user_snapshots(user_id, taken_at DESC);
```

RPC `take_snapshot(p_payload jsonb)`:
- Insert row.
- Trigger удаляет snapshot'ы старше 30 дней, оставляя по одному за месяц для последних 12 месяцев.

**Client:**
- В SyncProvider добавить trigger: после N мутаций ИЛИ раз в 24 часа на visibilitychange.
- Собирает full state из всех queries (`useQueryClient().getQueriesData()` плюс explicit fetches).
- `gzip` через CompressionStream API → POST `/api/sb/rpc/take_snapshot`.
- ~135 KB gzipped → быстро.

**Restore UI:**
- Settings → «Backup history» → list snapshots с датами.
- Кнопка «Restore» → clearAll + populate from snapshot → выгружает на сервер как fresh state.
- Confirmation: «Это перезапишет текущее состояние. Сохранить текущее как backup перед restore?»

**Storage cost для backend:**
- 135 KB × 30 ежедневных = ~4 MB на юзера.
- Дополнительно 12 ежемесячных = ~1.6 MB.
- При 1000 юзеров = ~5.6 GB. Supabase free tier 500 MB, paid plans без проблем.
- Можно gzipped store further compression в Supabase Storage (S3-like) вместо jsonb.

**Стоимость реализации (информативно, не учитываем):** 1-2 дня бекенд + 1 день клиент + 1 день UI restore. Для сравнения, миграция в LiveStore — недели + неизвестные баги.

### 12.7 Где snapshot backup лучше event-sourcing

1. **Зрелость.** Это не bleeding-edge. Это паттерн Time Machine / iCloud Backup / Dropbox Rewind. Любой может прочитать код и понять.
2. **Backend trivial.** Один table, один RPC, один cron-trigger. Никакой event-replay-engine, никаких materializers.
3. **Independent of client architecture.** Можно добавить **сейчас** к server-first, и оно работает. Можно через год перейти на event-sourcing — snapshot'ы остаются.
4. **UX как у Time Machine.** Юзер понимает «откатить вчера» интуитивно. Event log — никогда не показывается юзеру.
5. **«Backup на сервере» + «Export to file»** = full ownership story. Юзер: «у меня есть локальная копия + файл на руках + backup на сервере». Trust 3-of-3.

### 12.8 Где event-sourcing объективно лучше

1. **Granular point-in-time** (но юзер этого не просил).
2. **Multi-user real-time collab** (не профиль Disher).
3. **Audit log как продукт** (не профиль Disher).

### 12.9 Финальный сравнительный взгляд (3 варианта)

| Ось | Server-first (текущий) | Server-first + snapshot | Event-sourcing |
|---|---|---|---|
| Storage volume для 1200+50+50 | OK | OK + 4MB/yr server-side | OK |
| iOS PWA durability | OK при PWA-onboarding | OK + независимый recovery path | OK |
| Apple policy change risk | Recovery через server REST | + snapshot history | + local event log + server |
| Accidental delete recovery | Только soft-delete | **Point-in-time restore** | **Point-in-time replay** |
| Multi-device conflicts | LWW по updatedAt (есть сейчас) | Не меняется | Sequential events |
| User trust (data ownership) | Server-only | + snapshot visible to user | + local primary |
| Implementation complexity (для понимания) | Текущий код | +один table +RPC +UI | Полная rewrite слой data |
| Зрелость | Mature (Linear/Notion pattern) | Mature (Time Machine pattern) | Beta (LiveStore 0.4-dev) |
| **Сумма** | **Адекватно** | **Адекватно + safety net** | **Хорошо технически, дорого по риску** |

### 12.10 Обновлённая рекомендация

**Server-first + snapshot backup** — это **правильный третий путь**.

Он закрывает все реальные риски, которые поднял юзер:
- iOS eviction risk (если когда-нибудь сломается exemption) → server snapshot independent.
- Trust / sovereignty → snapshot history visible + export to file.
- Accidental delete / corruption recovery → point-in-time restore.
- Multi-device conflicts → LWW + snapshot fallback.
- 1200+50+50 объёмы → не вопрос для server-first вообще.

И **не имеет** недостатков event-sourcing для профиля Disher:
- Не beta tech.
- Не требует event-replay engine.
- Не требует переосмыслить mutation flow.
- Не требует compaction strategy.
- Никаких JWT.sub проблем.

**Tier-1 plan дополнения (финальная версия):**

1. **PWA-onboarding** (Add to Home Screen banner).
2. **`navigator.storage.persist()`** request на boot.
3. **Storage probe** на boot.
4. **Batch apply RPC** (см. §13 ниже) — критично для multi-day offline drain. Также покрывает createDish/createProduct compound flows.
5. **Coalesce same-row mutations** перед drain — снижает 1200 → 600-800 операций для типичного юзера.
6. **Scoped queries** (`useSchedulesByDateRangeQuery` вместо `useAll*`) — снимает UX-боль на 1200+ items в кэше.
7. **Snapshot backup system** (RPC + table + UI restore) — recovery / point-in-time / safety net.
8. **Manual export to file** — overlap со snapshot, ownership story.
9. **Telemetry** на drop-after-MAX_ATTEMPTS.

Items 4-5 закрывают long-offline drain story. Items 7-8 закрывают recovery story. Вместе — всё, ради чего рассматривали event-sourcing.

---

## 13. Long-offline drain — критическая ось

Юзер уточнил: «1200 schedules — server-first очередь будет хранить столько мутаций, а потом кучу запросов делать, это ОК?»

Это **другой вопрос** чем общий объём данных (§11). Это про drain strategy при возврате после многосуточного оффлайна.

### 13.1 Текущее поведение (НЕ ОК для multi-day offline)

Сценарий: юзер 7 дней оффлайн, делает ~1200 правок (создал/отредактировал/удалил schedules, products). Возвращается online.

**pendingWrites текущий drain (FIFO single-flight):**
- 1200 HTTP запросов к Supabase REST через iOS proxy /api/sb/*.
- Один за другим (FIFO single-flight guard в pendingWrites.ts:103).
- ~100-300ms на запрос на нормальной сети → **2-6 минут полный drain**.
- На slow сети (метро, 3G) → **10-15 минут**.
- Каждый запрос: отдельный auth header, отдельный RLS check, отдельная Postgres транзакция.
- Если хоть один словит 5xx → exponential backoff 1s→2s→4s…30s, **блокирует весь FIFO**.
- MAX_ATTEMPTS=10: цепочка bad luck может привести к exhaust → mutation dropped → toast error.

**UX:** юзер видит spinner «синхронизация…» 5+ минут. Или хуже — частичная sync с error'ами.

**Это объективно плохо. Текущий drain не рассчитан на 1200+ pending mutations.**

### 13.2 Решение — batch apply RPC (не event-sourcing)

```sql
CREATE FUNCTION apply_mutations_batch(p_mutations jsonb[])
RETURNS jsonb[] AS $$
  -- iterate p_mutations, apply each (insert/update/delete by table+op)
  -- collect per-mutation status (ok/conflict/error)
  -- return status array for client to mark individual entries done/poison
$$;
```

**Клиент drain переписан:**
- Берёт первые N (e.g. 100) entries из очереди.
- Один POST `/api/sb/rpc/apply_mutations_batch` с массивом.
- Получает status array — отмечает done/poison per entry.
- Повторяет следующий батч.

**Эффект:**
- 1200 single calls → 12 batch calls.
- 1 round-trip auth + RLS на батч вместо 100.
- Server обрабатывает в одной транзакции (или per-row с status array — выбор по семантике).
- Drain time: 2-6 мин → **5-15 секунд**.

### 13.3 Coalesce same-row mutations перед drain

Реальный паттерн юзера: за 7 дней редактирует один schedule 30 раз (двигает время, меняет quantity), создал product и сразу его 5 раз поправил.

Перед drain:
```ts
function coalescePending(entries: PendingEntry[]): PendingEntry[] {
  // Group by (table, row_id). For each group:
  // - if last op is delete → keep only delete (skip prior insert/update)
  // - if multiple updates → keep only last (LWW по enqueue timestamp)
  // - insert + updates → merge into single insert with merged payload
}
```

Эффект: 1200 → 600-800 операций для типичного паттерна. Сочетается с batch RPC: 8 batches × 100 = 800 → 8 round-trips.

### 13.4 Сравнение со event-sourcing для того же сценария

LiveStore push при возврате online:
- 1200 events в локальном log.
- Push батчем (LiveStore by design).
- Server applies events в одной транзакции.
- Drain time: ~5-15 секунд.

**Идентичный результат с server-first + batch RPC.** Разница:
- Event-sourcing: батчинг встроен в фреймворк.
- Server-first: пишешь `apply_mutations_batch` функцию сам (~50 строк PL/pgSQL).

Для разовой работы по добавлению одной RPC — это не аргумент за event-sourcing.

### 13.5 Что НЕ решает batch RPC

Будь честен:

1. **Memory footprint при boot.** 1200 entries в pendingWrites cache — ~600 KB JSON parse + materialize ~5-10 MB JS heap. На iOS приемлемо, но не ноль.

2. **Drain progress UI.** Юзер хочет видеть «50% синхронизировано» — нужен progress event. Простой счётчик entries-remaining-in-queue, не сложно.

3. **Failure атомарности на batch.** Если batch транзакционный и одна mutation poison'ится — вся транзакция откатывается? Решение: per-row try/catch в RPC, status array per mutation. Не блокер, но дизайн-решение.

4. **Rate limit на Supabase.** RPC calls тоже считаются. 12 batch calls вместо 1200 single — 100x легче. Не вопрос.

### 13.6 Итог по этой оси

**Современный server-first drain для 1200+ pending — НЕ ОК.** Юзер увидит длинный sync.

**Server-first + batch RPC + coalesce — полностью ОК**, идентичен event-sourcing по UX/времени/нагрузке.

Эта работа была пунктом 4 в `disher-simplification-tier1.md`, но в фокусе на createDish/createProduct compound flows. Расширить scope: **тот же RPC должен покрывать generic drain батчинг**. Один PL/pgSQL функция, два use case.

**Без этого пункта Tier-1 не закрывает multi-day offline SLO.** С этим пунктом — закрывает.

### 13.7 Уточнения после второй итерации с юзером

**Q1: Batch RPC дорого по Supabase pricing?**

Нет, дешевле. Compute считается per-transaction, не per-call. Batch = 1 BEGIN/COMMIT + 1 RLS check + N writes vs N × full transaction overhead → ~10-30x экономия compute. Bandwidth тот же (тело то же). На Free/Pro плане batch объективно безопаснее, чем single-flight FIFO. PostgREST rate limit (~100-500 req/s на anon key) тоже на стороне batch.

Цена `apply_mutations_batch` RPC = $0 дополнительно. Это PL/pgSQL функция, hosting compute считается как любой запрос.

**Q2: Compound flows (createProduct, createDish, free-text) — оффлайн возможны?**

⚠️ **Correction (после code review с юзером):** я ранее придумал детали, не сверившись с кодом. Фактическая картина:

- **`createProduct`** (`src/entities/product/api/mutations.ts:24-80`) — просто `enqueue('insert', {...})` в outbox. Nutrients/portions/categories инициализируются пустыми. Никакой LLM-валидации, никаких online-only gates. **Уже работает оффлайн.**
- **`createDish`** (`src/entities/dish/api/mutations.ts:37-64`) — создаёт только сам dish row. `addDishItem` и `addDishPortion` — отдельные мутации, добавляются позже по одной. В `FreeTextFoodFlow.tsx:602-611` items добавляются `for` loop'ом. Никакой compound транзакции, никакого FK race. **Уже работает оффлайн.**
- **Реально online-only — только free-text food parse** (`WriteFoodModal.tsx:28,66`, `WriteFoodButton.tsx`). Использует backend `/api/free-text-food/parse` с LLM (OpenRouter) + hybrid matcher (trigrams + cosine + e5-small embedding в `apps/disher-backend-3.0/src/api/food-matcher.ts`).

То есть единственный реальный compound-блок оффлайн — это free-text. Product/dish creation **уже работают оффлайн** через outbox.

**Free-text оффлайн — варианты:**

1. **Baseline (текущий):** просто блокировать оффлайн, юзер использует ручной выбор из каталога. Работает.
2. **Очередь на интерпретацию:** юзер вводит текст оффлайн → создаётся schedule с placeholder «pending interpretation» → при online backend интерпретирует → schedule заполняется реальными items. UX: можно «затрекать» оффлайн, но видишь интерпретацию только после sync.
3. **Локальный fallback matcher:** cached каталог + substring + Levenshtein на клиенте. Покрывает простые кейсы («яблоко 100г»), не справляется с compound («греческий салат с курицей»). Дублирование логики, качество резко хуже.

**Рекомендация:** Baseline + Вариант 2 как nice-to-have. Вариант 3 — отдельный полупроект, не оправдан.

**Каталог:** должен hydrate'иться из OPFS на boot. Оффлайн юзер должен видеть продукты для ручного выбора. Это уже частично реализовано через TanStack Query persist.

**Q3: Batch не подходит для трекера, где главное — instant tracking.**

Справедливое возражение. **Batching нужен ТОЛЬКО при catch-up drain, не в normal online flow.**

Drain strategy с threshold:
```ts
function drain() {
  const count = getPendingCount();
  if (count >= BATCH_THRESHOLD) {
    // catch-up after multi-day offline → batch RPC
    return drainBatch(BATCH_SIZE);
  } else {
    // normal tracking → single calls для минимальной latency
    return drainSingle();
  }
}
```

`BATCH_THRESHOLD` ≈ 5-10. Поведение:
- 1-5 pending (юзер затрекал 1-5 раз подряд оффлайн на ~минуты) → single calls FIFO. Latency ~200ms на запрос. Instant feel сохраняется.
- 5+ pending (catch-up после часов/дней оффлайна) → batch RPC. 1200 → 12 calls × ~500ms = 6 секунд total.

Это **покрывает оба профиля**: instant tracking в normal flow + быстрый sync при возврате после long offline.

Coalesce применяется только к catch-up batch'ам (не к single-flight в normal mode), чтобы не убивать instant feel.

### 13.8 Уточнённый Tier-1 пункт 4 (после code review)

**Скоп пересмотрен:** product/dish creation уже работают оффлайн через outbox, ничего там делать не надо. Реальный объём пункта 4:

4a. **`apply_mutations_batch` RPC** в Postgres — generic per-row apply с status array per mutation.
4b. **Threshold-based drain** в pendingWrites — single calls FIFO для normal tracking flow (instant feel), batch RPC при `pendingCount >= 5-10` (catch-up after offline).
4c. **Coalesce same-row mutations** — применяется только в batch mode, не в single. Same-row updates → keep last (LWW), delete-after-insert → skip оба.
4d. **Free-text food queue** (опционально, nice-to-have): юзер вводит текст оффлайн → placeholder schedule → re-interpret при online через существующий `/api/free-text-food/parse`. Без локального matcher.
4e. **Каталог hydrate** из OPFS на boot — в основном уже работает через TanStack Query persist, нужно проверить и докрутить.

Items 4a+4b+4c закрывают long-offline drain. Item 4d делает free-text менее болезненным оффлайн.

### 13.9 Реальные числа интенсивности (correction)

Юзер указал: 1200 schedules/year — это очень мало. Для активного юзера реалистично **40-50 schedules/day** = 15-20 тыс./year.

**Worst case offline drain (50 schedules/day × 7 days = 350 pending):**

| Стратегия | Drain time |
|---|---|
| Single FIFO (текущий) | 350 × 200ms = **70 секунд spinner'а** |
| Batch RPC (4 batches × 100) | ~2 секунды |

**Day-of-offline (50 pending):**

| Стратегия | Drain time |
|---|---|
| Single FIFO | 50 × 200ms = **10 секунд** |
| Batch RPC (1 batch) | ~0.5 секунды |

То есть batch нужен **не из-за extreme worst case, а из-за обычного дня оффлайна**. 10 секунд spinner'а после поездки в метро — уже плохо.

Threshold (4b) важен потому что в normal online (1-3 pending одновременно при tracking) — single calls дают instant feel, а batch добавляет ненужную задержку coalesce/grouping.

---

**Sources (web-research 2026-04-29):**
- [Updates to Storage Policy — WebKit blog](https://webkit.org/blog/14403/updates-to-storage-policy/)
- [PWA iOS Limitations and Safari Support (MagicBell, 2026)](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Safari iOS PWA Data Persistence — Apple Developer Forums](https://developer.apple.com/forums/thread/710157)
- [Is Safari still evicting IndexedDB after 7 days? — Hacker News](https://news.ycombinator.com/item?id=34266444)
- [LiveStore GitHub repository (current release 0.4.0-dev.22)](https://github.com/livestorejs/livestore)
- [What PWA Can Do Today — Persistent storage](https://whatpwacando.today/storage/)
- [Storage quotas and eviction criteria — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [WebKit Tracking Prevention — Home Screen Web App exemption (первоисточник для §8)](https://webkit.org/tracking-prevention/)
- [Exports are a security boundary — DEV.to (для §9)](https://dev.to/crisiscoresystems/exports-are-a-security-boundary-the-moment-local-first-becomes-shareable-3gj9)
- [Offline-first without a backend — DEV.to (для §9)](https://dev.to/crisiscoresystems/offline-first-without-a-backend-a-local-first-pwa-architecture-you-can-trust-3j15)
- [The PWA Data Trap — Scott Kuhl (для §9)](https://scottkuhl.medium.com/the-pwa-data-trap-5bd94d546348)
