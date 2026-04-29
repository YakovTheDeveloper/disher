# Track C — Tools & Libraries

**Дата:** 2026-04-29
**Статус:** ✅ завершён
**Скоуп:** §2.3 плана `backup-polling-research-2026.md` — что переиспользовать, что писать с нуля.

Все версии библиотек и dependency counts взяты из `_inputs/npm_versions.md` (живая npm registry на 2026-04-29). Цитаты Dexie-паттернов — из исходников Dexie.js, выдержки в `_inputs/dexie_*.ts`.

---

## C.1 Dexie ecosystem

### dexie (4.4.2)

- **Status:** zero runtime dependencies (`_inputs/npm_versions.md` строка 9). Latest stable, активно мейнтенится.
- **Recommendation: ✅ adopt as primary local DB.** Базовый кирпич всей backup-polling архитектуры — без Dexie у нас остаётся `idb` lower-level, что проиграет по ergonomics (см. C.2).

**Что нам конкретно нужно от Dexie:**

1. **Versioned schema migrations.** В `_inputs/dexie_version.ts:108-116` метод `Version.upgrade(upgradeFunction)` принимает функцию, которая получает `Transaction` и может асинхронно мигрировать данные построчно. Точный механизм step-by-step миграции описан в `_inputs/dexie_schema-helpers.ts:200-362` (`updateTablesAndIndexes`): для каждой версии от `oldVersion` до latest вычисляется `getSchemaDiff` (строка 378), применяются `add`/`change`/`del` для tables/indexes, потом запускается `contentUpgrade` (строка 270) для миграции данных.

   Для нашего сценария «add `_dirty` + `client_modified_at` ко всем таблицам» это выглядит так (псевдокод, цитата паттерна — не код для PoC):
   ```ts
   db.version(2).stores({
     products: 'id, user_id, name, deleted_at, client_modified_at, _dirty',
     // ...
   }).upgrade(tx => {
     return tx.table('products').toCollection().modify(p => {
       p.client_modified_at = p.updated_at ?? Date.now();
       p._dirty = false;
     });
   });
   ```

2. **Hooks для авто-стэмпинга.** В `_inputs/dexie_hooks-middleware.ts:38-69` показано как `creating`/`updating`/`deleting` хуки перехватывают каждую `add`/`put`/`delete` мутацию. Хуки fire'ются *перед* записью в IDB (строки 99-145), могут модифицировать `req.values[i]` через `setByKeyPath` (строка 110) или вернуть `additionalChanges` для update'ов (строка 119-141). Это **точно то, что нам нужно** для прозрачного выставления `_dirty=true` + `client_modified_at=Date.now()` без правки call-site'ов в entity mutations.

   Цитата паттерна (псевдокод):
   ```ts
   db.products.hook('creating', (primKey, obj) => {
     obj.client_modified_at = Date.now();
     obj._dirty = true;
   });
   db.products.hook('updating', (mods) => ({
     ...mods,
     client_modified_at: Date.now(),
     _dirty: true,
   }));
   ```

3. **Compound indexes** через стандартный синтаксис `'[user_id+date]'` — `_inputs/dexie_schema-helpers.ts:601-623` (`parseIndexSyntax`). Для Disher критично для `schedule_foods` запросов «всё за день» и `[user_id+_dirty]` для drain-сканера (выбрать только dirty rows одной user'a).

4. **Bulk operations** (`bulkPut`, `bulkAdd`) — для snapshot pull при cold start / eviction recovery. Не цитируется в наших inputs, но это стандартный API Dexie (`db.products.bulkPut(rows)`), важен для Track B §B.5.

5. **Transactions** — Dexie native через `db.transaction('rw', tables, async () => { ... })`. Нужны для compound flows (createDish + dish_items × N) которые сейчас в Disher gated на online-only через outbox. С Dexie они станут локально атомарными.

**Что НЕ берём от Dexie:**
- `Dexie.Observable` / Dexie Cloud sync — это отдельный платный sync-engine, не наш кейс. Свою backup-polling логику пишем поверх liveQuery + hooks.

### dexie-react-hooks (4.4.0)

- **Status:** peerDeps `dexie >=4.2.0-alpha.1 <5.0.0`, `react >=16` (`_inputs/npm_versions.md` строка 14-16). Тот же монорепо.
- **Что даёт:** `useLiveQuery(querier, deps?, defaultResult?)` — реактивный хук, перерисовывает компонент когда подписанные таблицы изменились.
- **Recommendation: ✅ adopt.**

**Механика реактивности** (из `_inputs/dexie_live-query.ts`):

- При первом запуске `liveQuery(querier)` создаёт `ObservabilitySet subscr` (строка 110) — набор «какие index ranges затронуты этим запросом».
- Подписывается на глобальный `DEXIE_STORAGE_MUTATED_EVENT_NAME` (строка 134) — единый канал mutation-уведомлений Dexie.
- Когда приходит `mutationListener` (строка 94), накапливает изменения в `accumMuts`, и если `obsSetsOverlap(currentObs, accumMuts)` (строка 91) — повторно запускает querier.
- После повторного запуска — снова сравнивает с *новым* observation set (строки 153-167), потому что querier мог начать читать другие таблицы.

**Trade-off vs TanStack Query (текущий стек Disher):**

| Аспект | TanStack Query (текущий) | useLiveQuery (новый) |
|---|---|---|
| Источник правды | сервер (Supabase REST) | локальная БД (IndexedDB) |
| Что триггерит refetch | `staleTime` + `invalidateQueries` + window focus | каждая локальная мутация → автоматически |
| Optimistic updates | руками через `setQueriesData` (см. CLAUDE.md «How to Query & Mutate») | не нужны — мутация *уже* в локальной БД |
| Offline | работает через persisted cache (`idb-keyval`) | работает по дизайну — БД и есть истина |
| `userId` в queryKey | обязательно (RLS-разделение) | через `where({ user_id: userId })` в querier |

**Migration path от текущего `useAllProductsQuery`:**

Сейчас:
```ts
// src/entities/product/api/queries.ts
export function useAllProductsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['products', 'all', userId],
    enabled: !!userId,
    queryFn: async () => { /* supabase fetch */ },
  });
}
```

Станет (псевдокод):
```ts
export function useAllProducts() {
  const userId = useUserId();
  return useLiveQuery(
    () => userId ? db.products.where({ user_id: userId }).filter(p => !p.deleted_at).toArray() : [],
    [userId],
  );
}
```

Ключевое — **API сигнатура хука меняется** (`{data, isLoading, error}` → массив или `undefined`). Wrapping в адаптер `{data: result, isLoading: result === undefined}` тривиален.

**Производительность на 1200+ rows:** liveQuery re-runs querier *целиком* при каждом overlap'е. При 1200 schedule entries это всё ещё миллисекунды — IndexedDB read даже без индекса быстр на таких объёмах, но критично использовать compound indexes (`[user_id+date]`) чтобы query был index-bound, а не table scan. Это **уточняется в Track B §B.1** (производительность liveQuery).

### dexie-export-import (4.4.0)

- **Status:** peerDeps `dexie ^4.4.0` (`_inputs/npm_versions.md` строка 19-21). Аддон для full DB export/import в JSON.
- **Use case для Disher:** будущая фича «manual export» из memory `project_manual_export_idea.md` — Obsidian-style trust marketing «your data, your device, скачать/загрузить одним кликом».
- **Recommendation: ✅ adopt eventually.** Не блокирует PoC. Добавляется в Phase 2 когда фича выйдет в roadmap.

### dexie-encrypted

- **Use case:** E2E encryption на уровне поля.
- **Status для Disher:** не в текущем scope. Disher не E2E-encrypted продукт (food tracking, не sensitive medical data — health correlation в *клиенте* считается, не в облаке).
- **Recommendation: ❌ defer.** Если когда-нибудь появится «privacy mode» (шифрование backup blobs на сервере) — пересмотреть.

### dexie-relationships

- **Use case:** client-side foreign key enforcement (cascading deletes, lookups).
- **Disher альтернатива:** TS-типы + явная валидация в `entity/api/mutations.ts`. У нас уже всё на TS, FK-нарушение видно в compile-time для большинства кейсов.
- **Recommendation: ❌ skip.** Полагаемся на TS. Сервер делает финальную валидацию через Postgres FK constraints — это уже есть в `supabase/migrations/`.

### dexie-syncable

- **Описание:** старый плагин для self-built sync — реализуешь `ISyncProtocol` интерфейс, плагин даёт scaffold (revision tracking, change buffer, etc.).
- **Status в 2026:** в наших `_inputs/npm_versions.md` версия не зафиксирована. Из общего знания экосистемы — плагин существует, но менее активно мейнтенится чем сам Dexie. Правильная актуальная проверка — Track A v3 или ad-hoc npm view (не сделано в этом research'е, отмечается как open question).
- **Trade-off:** наша backup-polling архитектура **по дизайну тривиальна**:
  - push-only (нет remote→client sync)
  - LWW по `client_modified_at` (нет revision tracking, нет vector clocks)
  - ~50-80 LOC push-модуля (см. plan §1.2)

  dexie-syncable рассчитан на **двусторонний** sync с revision sequences и conflict resolution. Это **больше абстракции чем нам нужно**. Шанс что плагин «помешает» (форсит чужие конвенции, заставляет городить ISyncProtocol implementation для тривиального push) выше чем шанс «сэкономит код».

- **Recommendation: ❌ skip; написать inline.** Push-модуль в 80 LOC проще чем integrate'ить и понять плагин. **Если PoC stalls** на multi-tab координации или revision tracking — пересмотреть.

---

## C.2 Альтернативы Dexie

### idb (8.0.3) — Jake Archibald

- **Status:** zero runtime deps (`_inputs/npm_versions.md` строка 26). Уже косвенно используется в Disher через `idb-keyval` (CLAUDE.md → persister + outbox).
- **Что это:** minimal Promise-wrapper над raw IndexedDB. Без хуков, без живых подписок, без version-upgrade ergonomics.
- **vs Dexie:**
  - **+** меньше surface, проще заглянуть в исходник, ноль магии.
  - **−** нет `creating`/`updating` hooks (в `_inputs/dexie_hooks-middleware.ts` это ~200 LOC которые пришлось бы переписать).
  - **−** нет `liveQuery` — пришлось бы строить реактивность поверх `BroadcastChannel` или Zustand-store вручную.
  - **−** нет `getSchemaDiff` (`_inputs/dexie_schema-helpers.ts:378`) — миграция тяжелее.
  - **−** нет `bulkPut`/`bulkAdd` (есть raw `objectStore.put` в loop).
- **Bundle:** Dexie ~50KB minified, idb ~5KB. План §1.1 явно отменил bundle ceiling.
- **Recommendation: ❌ skip; stick with Dexie.** Без bundle-ограничения единственный аргумент за idb — «minimal surface», который проигрывает Dexie ergonomics в 5+ местах.

### TinyBase

- **Use case:** in-memory reactive store с optional persisters (IDB, file, custom).
- **Why было в shortlist:** легковесный, реактивный, поддерживает relations.
- **Why skip для Disher:**
  - TinyBase model — **row store с tables**, но без real index'ов поверх IndexedDB. Для 1200+ schedule entries с queries «найди всё за дату X» нужен либо memory-scan, либо отдельный index layer. Dexie даёт это бесплатно через compound indexes.
  - TinyBase persister в IDB — это сериализованный snapshot всей таблицы в один blob (или JSON-патч). Не подходит под нашу модель «найти dirty rows», потому что нет per-row queries по флагу.
  - У TinyBase нет встроенного `creating`/`updating` hook'а на уровне persister — авто-стэмпинг `_dirty` пришлось бы делать в каждом call-site.
- **Recommendation: ❌ skip — model mismatch.**

### RxDB без replication

- **Why было на радаре:** RxDB — local-first DB с RxJS observables, schema validation, encryption.
- **Why skip:**
  - RxDB ценность ≈ replication plugins. Без них остаётся «Dexie + observables + JSON schema validation», что даже больше boilerplate'а чем чистый Dexie.
  - RxDB pulls in larger dep tree (rxjs, ajv, etc.).
  - Schema validation через AJV — у Disher уже TS-типы, дублирование.
- **Recommendation: ❌ skip.**

### Drizzle ORM + IDB driver

- **Status:** Drizzle 0.45.2 (`_inputs/npm_versions.md` строка 49) — type-safe SQL toolkit.
- **Existence check:** **нет first-party IDB driver у Drizzle.** Drizzle officially target'ит Postgres / MySQL / SQLite (включая sqlite-wasm в браузере через `@libsql/client`/`wa-sqlite`), но не IndexedDB.
- **Why skip:**
  - SQL поверх IDB не существует первоклассно (community attempts типа `idb-sql` — не production).
  - Если когда-нибудь захотим SQL в браузере — это переход на sqlite-wasm + OPFS, отдельный research (упоминается в Track D §1 как open question по OPFS).
- **Recommendation: ❌ skip.** Drizzle оставляем для server-side (см. C.3).

---

## C.3 Server-side стек

Disher backend сейчас — `apps/disher-backend-3.0` (Node.js sidecar для analytics + free-text-food + diag-logs). В нём уже живут роуты `diag-logs.ts` и `supabase-proxy.ts` (виден в git status). Backup-polling endpoint логично добавить туда же — **не вводить третий деплой**.

### Framework: Hono 4.12 (recommended) vs Fastify 5.8 vs Elysia 1.4

| Framework | Версия | Runtime deps | Runtime target |
|---|---|---|---|
| Hono | 4.12.15 | **0** | Node + Bun + Deno + Workers + Fastly |
| Fastify | 5.8.5 | 15 (pino, find-my-way, fast-json-stringify, etc.) | Node-specific |
| Elysia | 1.4.28 | 4 (cookie, exact-mirror, memoirist, fast-decode-uri-component) | Bun-first |

(данные из `_inputs/npm_versions.md` строки 31-44)

- **Hono:** zero deps + multi-runtime + web-standard `Request`/`Response`. Тестирование тривиально (можно вызывать handler как обычную функцию с fake `Request`). Если когда-нибудь захотим перенести backup endpoint на Cloudflare Workers / Bun / Deno — без переписки.
- **Fastify:** mature, Node-only, известный JSON schema validation. Но 15 runtime deps означает больше поверхности для review. Disher не использует pino-инфраструктуру нигде ещё.
- **Elysia:** Bun-first, peerDep `@types/bun`. Disher на Node, переход на Bun не на горизонте.

**Recommendation: ✅ Hono.** Reasons:
1. Zero deps = trivial security audit (важно для backup endpoint, через который проходят все user data).
2. Multi-runtime = миграция на Workers / Bun возможна без переписки если когда-то захочется (например, Cloudflare Workers для edge-deploy backup endpoint).
3. Web-standard API = тестирование без MSW / superagent — просто `app.fetch(new Request(...))` в Vitest.
4. Уже есть существующий routes-pattern в `disher-backend-3.0/src/api/routes/` — Hono впишется без архитектурных правок.

### Postgres hosting

Текущий стек: Supabase Postgres (CLAUDE.md → `supabase/migrations/`).

**Опции:**

- **A. Keep Supabase Postgres.** Backup endpoint живёт в Node sidecar, использует тот же Postgres через `@supabase/supabase-js` (как admin) или через `pg` напрямую с Drizzle.
- **B. Neon / Render / DigitalOcean managed.** Migration cost средний — экспорт/импорт схемы тривиально, но придётся переключить и frontend RLS.
- **C. Self-host на VPS.** Юзер upgrade'нул на Micro tier (memory `project_supabase_freetier_wal_trap.md`), self-host добавит ops-burden без выигрыша.

**Recommendation: ✅ Phase 1 — keep Supabase Postgres.** Zero migration cost. Postgres сам по себе не виноват в проблемах sync (виноват был WAL-трап PowerSync на free-tier — а у нас теперь backup-polling без WAL).

**Что меняется:** drop Supabase Auth-зависимость на frontend? — см. секцию Auth ниже.

### Auth

| Опция | Status | Verdict |
|---|---|---|
| **Lucia 3.2.2** | DEPRECATED (`_inputs/npm_versions.md` строка 53-56). «Please see https://lucia-auth.com/lucia-v3/migrate.» | ❌ не адоптировать в new code. |
| **better-auth 1.6.9** | 15 runtime deps + 19 peer deps (`_inputs/npm_versions.md` строка 58-61). | ❌ overkill для single-user backup endpoint. |
| **Self-rolled JWT (`jose` only)** | минимальный setup. | ✅ возможно, но добавляет auth-state машинерию. |
| **Keep Supabase Auth, валидировать JWT через JWKS** | zero migration. Backup endpoint валидирует Supabase-issued JWT через `@supabase/supabase-js` admin или через прямой JWKS verify (`jose` library). | ✅ **рекомендую.** |

**Recommendation: ✅ Keep Supabase Auth + JWKS verify on backup endpoint.**

Reasons:
1. Disher уже использует Supabase Auth (CLAUDE.md «Sync Setup → Auth: anonymous sign-in is enabled»). Email+Anon enabled, anon→registered flow уже отлажен.
2. JWKS validation в Hono — ~20 LOC через `jose.createRemoteJWKSet` + `jwtVerify`.
3. Auth-инвариант юзера (memory `project_auth_invariant.md`): «логин один раз, refresh не истекает, юзер не видит окно логина» — Supabase это даёт из коробки. Self-rolled JWT придётся реализовывать refresh-rotation сам.
4. Когда переходим к mandatory signup (memory `project_required_auth_done.md` — уже сделано) — анонимы не существуют, scope ещё проще.

**Альтернатива (если Supabase станет проблемой):** self-rolled JWT с refresh tokens в Postgres. Reference impl — Lucia v3 migration guide или TanStack Start auth examples. Этот research не углубляется (не блокер для PoC).

### Query builder

| Опция | Verdict |
|---|---|
| **Drizzle ORM 0.45.2** | ✅ type-safe, простые миграции через `drizzle-kit`, активно мейнтенится. Используется в better-auth и многих indie shops. |
| **Kysely** | type-safe query builder без миграций. Ок для query layer, но нужна доп. tooling для migrations. |
| **Raw SQL via `pg`** | минимум магии. Дольше писать, но zero abstraction overhead. |
| **`@supabase/supabase-js` (текущее)** | уже в Disher. Простая JSON API над PostgREST. Минусы: PostgREST через RLS, что для server-to-server вызовов с service_role работает, но не выигрывает в типизации. |

**Recommendation:**
- **Phase 1 (PoC):** continue with `@supabase/supabase-js` через service_role key из Node sidecar. Backup endpoint делает `supabase.from('products').upsert(rows)` — это тот же паттерн что во frontend, минимум cognitive load.
- **Phase 2 (post-PoC если усложняется):** мигрировать на **Drizzle** для backup endpoint, raw SQL для миграций.

Не вводим Drizzle на старте — PoC должен сфокусироваться на полу-работе backup-polling, а не на миграции query layer.

### Migration tooling

- **drizzle-kit** если adopt'нем Drizzle. Generate SQL files автоматически из schema.
- **Текущий Disher pattern:** raw SQL files в `apps/food-calc/supabase/migrations/` (cited в CLAUDE.md «Tables: Defined in `supabase/migrations/`»).
- **Recommendation: ✅ continue raw SQL migrations.** Зачем вводить новый tool ради backup endpoint, когда для frontend уже есть устоявшийся pattern? Backup endpoint добавляет ~1-2 колонки (`client_modified_at`, server-side `received_at`?) к существующим таблицам. Один SQL файл.

### Rate limiting / abuse prevention

- **Сценарий:** single-user может пушить bursts по 1200+ rows за раз (multi-day offline catch-up). Нужно различать «легитимный burst» от «abuse».
- **Простая стратегия:**
  - Per-user rate limit: 100 push requests / hour. Burst через большой payload (до 5MB), не через 1000 small requests.
  - Per-IP абсолютный cap: 1000 requests / hour (для unauthenticated edge cases).
- **Реализация:** in-memory token bucket в Hono middleware. Для single-instance Node sidecar этого достаточно. Если когда-нибудь scale-out — Redis (out of scope).
- **Recommendation: ✅ write inline middleware in Hono.** Никакая lib не нужна на этом масштабе. ~30 LOC.

---

## C.4 Observability tooling

### Diag-logs endpoint

- **Status:** уже существует (`disher-backend-3.0/src/api/routes/diag-logs.ts` виден в git status новый файл).
- Парный клиент: `food-calc/src/shared/lib/observability/DiagButton.tsx` + `diagLog.ts` (тоже в git status, новые).
- **Recommendation: ✅ keep using.** Не вводим Sentry на этом этапе. Diag-logs покрывают наш use case (юзер репортит баг → мы видим что произошло на клиенте).

### Sentry

- **Use case:** automatic error tracking across all users.
- **Disher scope:** PoC + early-stage. Diag-logs (manual, by user request) сейчас даёт точечный сигнал, что и нужно.
- **Recommendation: ❌ defer.** Пересмотреть после >100 active users.

### PostHog / product analytics

- **Use case:** понять как юзеры используют фичи.
- **Recommendation: ❌ defer.** Не для backup-polling research.

### Server logs

- Текущий sidecar — Node.js. Логи через `console.log` пишутся в stdout, capture'ятся системным журналом VPS / Docker logs.
- **Pino** имеет смысл если **берём Fastify** (там встроен) — но мы выбрали Hono.
- **Recommendation: ✅ default `console.log` для Hono PoC.** Если когда-нибудь понадобится structured logging — добавим Pino (zero peerDep, можно вмонтировать).

---

## C.5 Testing infrastructure

### Vitest

- **Status:** уже основной test runner в Disher (CLAUDE.md → `npm run test`, `npx vitest run`). Используется для `pendingWrites` тестов (memory `project_outbox_audit_2026_04_28.md`).
- **Recommendation: ✅ keep.**

### fake-indexeddb (для Vitest unit-тестов Dexie)

- **Use case:** unit-test'ы Dexie-логики без реального браузера. Mock'ает IDB API в Node.
- **Compatibility:** работает с Dexie 4.x (стандартный setup `import 'fake-indexeddb/auto'` в `vitest.setup.ts`).
- **Recommendation: ✅ adopt.** Без этого тестирование Dexie hooks / migrations / queries требовало бы Playwright для каждого crumb'а — overkill.

### Playwright

- **Status:** уже основной E2E runner (memory `project_e2e_supabase_mock.md` — 14/14 pass на chromium+webkit).
- **Recommendation: ✅ keep.**

### Mocking backup endpoint

| Опция | Verdict |
|---|---|
| **MSW (Mock Service Worker)** | стандарт индустрии для mock'ов HTTP. Работает в browser + Node. |
| **Playwright `page.route` (текущий Disher pattern)** | уже используется для Supabase mock (memory `project_e2e_supabase_mock.md`). 14/14 tests pass. |

**Recommendation: ✅ extend `page.route` pattern.**

Reasons:
1. Consistency с существующим E2E setup. Юзер уже принял этот подход (memory подтверждает).
2. `page.route` живёт в test-runner, не в браузере → не нужно service worker registration / install dance.
3. MSW добавляет dep + boot complexity (registerSW в test setup) ради того что `page.route` делает однострочником.

Для **Vitest unit-тестов** push-модуля (если он делает `fetch('/backup')`) — стандартный `vi.mock('global.fetch')` или MSW Node mode. Но это уже Track D scope.

### Network condition simulation

- **Playwright** имеет `page.context().setOffline(true)` и `page.route` с искусственной задержкой через `route.continue` после `setTimeout`.
- Memory `project_e2e_supabase_mock.md` подтверждает что `page.route` уже используется для контроля Supabase ответов.
- **Recommendation: ✅ Playwright network APIs.** Никакой extra tooling не нужен.

---

## Cross-cutting recommendations

Сводный список — всё что adopt'им и всё что skip'аем:

### Adopt (всего 6 пакетов, из них 5 zero-dep)

1. **dexie** 4.4.2 — zero deps, primary local DB.
2. **dexie-react-hooks** 4.4.0 — `useLiveQuery` для реактивного UI.
3. **dexie-export-import** 4.4.0 — Phase 2 для manual export.
4. **fake-indexeddb** — Vitest unit tests для Dexie.
5. **hono** 4.12.15 — zero deps, backup endpoint в Node sidecar.
6. **jose** (для JWKS verify Supabase JWT) — стандартная JWT library, минимальный footprint.

### Skip (с явной причиной)

| Пакет | Причина |
|---|---|
| dexie-encrypted | E2E не в scope. |
| dexie-relationships | TS-типы покрывают. |
| dexie-syncable | Backup-polling слишком прост, плагин — overhead. |
| idb (Jake Archibald) | Без bundle ceiling, Dexie ergonomics выигрывает. |
| TinyBase | Model mismatch (нет per-row indexes над IDB). |
| RxDB без replication | Боулерплейт без выигрыша. |
| Drizzle + IDB driver | Не существует first-party. |
| Lucia | DEPRECATED. |
| better-auth | Overkill для single backup endpoint. |
| Self-rolled JWT | Auth-инвариант юзера лучше держится через Supabase. |
| Drizzle (Phase 1) | `@supabase/supabase-js` достаточно для PoC. |
| drizzle-kit | Raw SQL migrations уже работают. |
| Sentry | Diag-logs покрывают. |
| PostHog | Не блокер. |
| Pino | Hono = `console.log` достаточно. |
| MSW | `page.route` consistency. |
| Fastify | Hono выиграл по deps + multi-runtime. |
| Elysia | Bun-first, не наш runtime. |

### Keep (текущее)

- **@supabase/supabase-js** — auth + REST + (для backup endpoint в sidecar) admin queries через service_role. Pin to existing version.
- **Vitest, Playwright** — текущие test runners.
- **idb-keyval** — для persister'ов Zustand drafts (CLAUDE.md «Drafts persist via Zustand `persist` + idb-keyval»). После backup-polling миграции — пересмотреть, возможно заменить на Dexie.
- **TanStack Query** — для **online-only** запросов (free-text food, analytics). Не нужен для основных entity reads после миграции на `useLiveQuery`.

---

## Что это значит для migration LOC budget

Per plan §1.2: ~150 LOC новых vs ~400 LOC удалить. Track C calibration:

### New code (~200 LOC)

| Что | LOC |
|---|---|
| Dexie schema + version + hooks для `_dirty` / `client_modified_at` | ~30 |
| Push module: `sendBeacon` + `visibilitychange` + interval + debounce | ~80 |
| Backup endpoint Hono handler с JWKS verify + LWW upsert | ~40 |
| Migration tests (Vitest + fake-indexeddb) | ~50 |
| **Total** | **~200** |

### Removed code (~430 LOC)

| Что | LOC | Path |
|---|---|---|
| `pendingWrites.ts` (outbox flat queue) | ~300 | `food-calc/src/shared/lib/storage/pendingWrites.ts` |
| `SyncProvider.tsx` boot logic | ~80 | `food-calc/src/shared/lib/sync/SyncProvider.tsx` |
| `usePendingCount` + `PendingWritesBadge` (UI для outbox) | ~50 | `food-calc/src/shared/lib/sync/` |
| Optimistic patches in entity mutations (`setQueriesData`+ `enqueue` + `invalidateQueries`) | ~50 | каждая `entity/api/mutations.ts` |
| **Total** | **~430** |

### Net result

**−230 LOC** (более удалений чем добавлений). ✅ Соответствует tier-1 simplification ethos (memory `project_simplification_tier1.md`).

Дополнительно — **point-of-failure reduction:**
- Удаляются: outbox classifier, MAX_ATTEMPTS retry logic, schema-drift dropping by APP_VERSION, single-flight drain coordination, in-RAM mirror sync, online/visibilitychange re-drain triggers, anon→registered upgrade gating.
- Добавляются: Dexie schema migration, clock skew handling.
- Net point-of-failure: **−5** (см. plan §0.3 / `offline-stacks-2026-simplicity-rerank.md` §B).

---

## Open questions

Вопросы которые этот трек не закрыл, но которые **не блокируют** PoC:

1. **dexie-syncable health в 2026.** Проверить npm last-publish + GitHub activity. Если плагин жив + актуален — пересмотреть решение «write inline» (всё ещё вероятнее skip из-за model mismatch, но due diligence не сделана).
2. **Standalone backend vs Node sidecar для backup endpoint.** Решено в Phase 1 «в sidecar», но если sidecar становится bottleneck — опция отдельного Hono-on-Workers deploy остаётся открытой (Hono multi-runtime даёт это бесплатно).
3. **OPFS vs IndexedDB для Disher на iOS.** Track D §1 поднимает вопрос. Не решён здесь — Dexie OPFS адаптера нет, Dexie живёт на IDB. Если когда-нибудь захотим OPFS — это отдельный исследовательский трек (вероятный путь: sqlite-wasm + OPFS + Drizzle SQLite driver).
4. **Bundle size impact.** План §0.1 отменил bundle ceiling, но финальная цифра (Dexie + dexie-react-hooks ≈ 60-70KB minified+gzipped) полезно зафиксировать в PoC merge-checklist.
5. **TanStack Query — оставлять для analytics / free-text food или дропать полностью?** Текущая позиция: «оставить для online-only фич». Re-evaluate после миграции — возможно `useLiveQuery` + manual fetch без TanStack обойдётся.
6. **fake-indexeddb compat с Dexie 4.4.x specifically.** Стандартный setup должен работать, но stress-test'ить compound indexes + hooks + transactions нужно на старте PoC.

---

## Track C summary (одной фразой)

**Stack of choice:** Dexie 4.4 + dexie-react-hooks (zero-dep, primary store) + Hono 4.12 (zero-dep, backup endpoint в существующем Node sidecar) + Supabase Auth через JWKS (текущий setup без миграции) + Vitest/Playwright (текущие test runners) + fake-indexeddb для unit. **Net: 6 новых пакетов, из них 5 zero-runtime-dep, plus Drizzle отложен до Phase 2 если усложнится.**
