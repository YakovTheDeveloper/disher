# Track D — Corner Cases (front-loaded, before PoC)

**Дата:** 2026-04-29
**Статус:** ✅ завершён
**Скоуп:** §2.4 плана `backup-polling-research-2026.md` — 16 корнер-кейсов, на которые юзер хочет ответ **до** PoC, не после. Мотивация — `feedback_corner_case_frontload.md` из user memory: «для архитектурных решений с устоявшимся стеком юзер ценит front-load корнер-кейсов через web research до кода (~40-60 кейсов обозримы; стоп-критерий — плато)».

Источники: `_inputs/web_apis_summary.md`, `_inputs/joplin_issues.md`, `_inputs/dexie_*.ts`, `_inputs/notesnook_*.ts`, `_inputs/sn_*.ts`, `_inputs/css_*.swift`, completed tracks (B, C, E), user memory files (`project_ios_pwa_storage_eviction.md`, `project_ios_fetch_hang_2026_04_28.md`, `project_auth_invariant.md`, `project_short_distance_horizon.md`, `project_required_auth_done.md`, `feedback_timestamp_guard_pattern.md`), и текущий `apps/food-calc/CLAUDE.md`.

---

## Краткое резюме

| # | Вопрос | Status | Verdict |
|---|---|---|---|
| 1 | iOS Safari OPFS vs IDB | resolved | IDB через Dexie 4.4.2. OPFS не имеет ergonomic relational libraries в 2026 — overkill для нашего набора FK + liveQuery + versioned migrations. |
| 2 | iOS background fetch / Background Sync API | resolved | NOT supported on iOS, ever. Используем `visibilitychange` + `sendBeacon` (64 KiB cap). |
| 3 | `storage.persist()` grant on iOS | resolved | Auto-granted для Home-Screen PWA на iOS Safari 17+. Tab-fallback — heuristic, логируем denial. |
| 4 | Quota exceeded (IDB full) | resolved | Catch `QuotaExceededError`, auto-prune rows >60 дней + toaster «Удалите старые данные» с явным consent. |
| 5 | DB version downgrade | resolved | `VersionError` → recovery modal с явным confirm + fail-safe ON. Acceptable trade-off из-за 30-day window. |
| 6 | Auth session expired during push | resolved | 401 в drain = retry, **не poison** — refresh через Supabase Auth + один retry. Pattern уже в `pendingWrites.ts`. |
| 7 | Race: mutation while push in flight | resolved | Notesnook timestamp guard: `synced=true WHERE client_modified_at <= pushTimestamp`. Documented в Track B §B.2.8. |
| 8 | `client_modified_at` resolution | resolved | `Date.now()` (ms) достаточен для single-user sequential. Tie-breaker через `edit_count` (Track B §B.2.2). |
| 9 | Server clock authoritative | resolved | LWW по `client_modified_at` + `edit_count`. `server_received_at` — **только** для clock-skew telemetry. |
| 10 | Cross-origin / subdomain | resolved | IDB key = origin (scheme+host+port). Staging vs prod автоматически изолированы браузером. |
| 11 | PWA update — service worker swap | resolved | SW scope ≠ IDB scope. Schema migration через `Version.upgrade()` запускается только при bump'е `db.version()`. |
| 12 | Backup endpoint downtime SLA | resolved | До 7 дней downtime — toleratable (≤210 dirty rows ≈ 20 KB gzipped, fits sendBeacon). Длиннее — user-visible warning. |
| 13 | Anonymous → registered user upgrade | not applicable | Disher Tier-1 уже вырезал анонимов (`project_required_auth_done.md`). Кейс moot. |
| 14 | Logout — wipe Dexie? | resolved | **Wipe** на explicit logout button. **Keep** на session expiry / auto-refresh. |
| 15 | GDPR / user data deletion | resolved | Two-phase: (1) hard delete на бэкенде по запросу, (2) client wipe Dexie на следующем boot после confirmation. PoC не реализует. |
| 16 | Backup endpoint 422 «schema mismatch» | resolved | Toast «App update required» + block dirty drain (preserves data). Никогда auto-drop dirty rows. |

**Итог:** 14 resolved + 1 not applicable + 1 deferred-detail (D.15 implementation = Phase 2). Все 16 имеют явный verdict до PoC.

---

## D.1 iOS Safari OPFS (Origin Private File System) vs IndexedDB

**Answer.** Остаёмся на IndexedDB через Dexie 4.4.2. OPFS не использовать.

**Reason.**
1. OPFS даёт low-level file API поверх sandboxed disk; ergonomic relational libraries поверх него (с FK, indexes, reactive queries, versioned migrations) в 2026 ещё не имеют production-ready stable releases для PWA. Cite: `track-c-tools-libraries.md` C.1 — Dexie 4.4.2 имеет zero runtime dependencies (`_inputs/npm_versions.md` строка 9), versioned migrations (`_inputs/dexie_version.ts:108-116`), hooks для auto-stamping (`_inputs/dexie_hooks-middleware.ts:38-69`), liveQuery с observability ranges (`_inputs/dexie_live-query.ts:90-99`). Перенос всего этого на OPFS = реализация relational engine с нуля.
2. Disher data model структурно реляционная — `dish_items.product_id → products.id`, `schedule_foods.product_id → products.id`, `daily_norms.items` references nutrient IDs. Cite: `apps/food-calc/CLAUDE.md` секция «Tables». Без relational layer любая выборка «дай все schedule_foods для product X» становится full-scan через файлы.
3. Disher target = iOS Safari 17+. IndexedDB persistence на iOS Safari 17+ надёжен для Home-Screen PWA. Cite: user memory `project_ios_pwa_storage_eviction.md` — «Home-Screen PWA на iOS не подпадает под 7-day eviction; persist() работает с Safari 17+».
4. Indirect industry signal: Notesnook (на Dexie), Standard Notes (на IndexedDB через RxDB earlier, теперь native IDB), Joplin desktop (SQLite через Electron) — никто из изученных не на OPFS. Cite: track-a/track-c наблюдения.

**Status.** **Resolved** — IDB via Dexie 4.4.2 + dexie-react-hooks 4.4.0.

---

## D.2 iOS background fetch / Background Sync API

**Answer.** Не используем — iOS Safari **никогда** не поддерживал Background Sync API и не планирует.

**Reason.**
- Cite: `_inputs/web_apis_summary.md:6-13`:
  > «iOS Safari: NOT SUPPORTED. Ever.» / «caniuse: "3.2 – 26.5: Not supported" (no future support indicated).» / «Desktop Safari: NOT SUPPORTED.»
- Disher target включает iOS PWA Add-to-Home-Screen, поэтому Background Sync structurally недоступен. Любая логика «push после tab close через service worker» = blocker на iOS.
- Workaround: pусь aggressive while page is alive. Это даёт нам:
  - Каждую мутацию dim`idiate (debounce 100 ms для hot tables, 30s для cold) — Cite: `_inputs/notesnook_auto-sync.ts:58-88`.
  - На `online` event — full drain.
  - На `visibilitychange → hidden` — `navigator.sendBeacon` с payload до 64 KiB. Cite: `_inputs/web_apis_summary.md:24-41`.
  - 1-часовой setInterval fallback пока tab жив.
- Принимаем компромисс: при tab kill iOS до того как мы успели drain — некоторые pushes теряются временно. Они подберутся при следующем open (rows остаются `_dirty=true`, timestamp guard защищает от false `synced=true`).

**Status.** **Resolved** — стратегия = `visibilitychange + sendBeacon` (Track B §B.3.1).

---

## D.3 `storage.persist()` grant на iOS

**Answer.** Auto-granted для PWA с Add-to-Home-Screen (iOS Safari 17+). Для browser-tab usage — heuristic-based grant, denial логируем и показываем soft warning.

**Reason.**
- Cite: user memory `project_ios_pwa_storage_eviction.md` — «Home-Screen PWA на iOS не подпадает под 7-day eviction; persist() работает с Safari 17+». Это был load-bearing аргумент для backup-polling viability — без persist'а IDB могла бы вытираться через 7 дней без визитов, что ломает offline durability story.
- Browser tab fallback (юзер открыл Disher через Safari URL без A2HS) — `navigator.storage.persist()` возвращает Promise<boolean>; если false — heuristic не сработала (low engagement, low storage usage). Действие: логируем diag-event, показываем мягкий toast «Add Disher to Home Screen for reliable offline storage».
- API call ставим в `<SyncProvider>` boot sequence (текущая точка входа sync — cite: `apps/food-calc/CLAUDE.md`, секция «Sync Setup»).

**Status.** **Resolved** — call `navigator.storage.persist()` at boot, accept на PWA, log denial на tab.

**Reference snippet** (не код для PoC, шаблон):
```ts
async function ensureStoragePersistence() {
  if (!navigator.storage?.persist) return false;
  const granted = await navigator.storage.persist();
  diagLog('storage.persist', { granted });
  if (!granted) {
    // мягкий toast: «Add to Home Screen for reliable offline storage»
  }
  return granted;
}
```

---

## D.4 Quota exceeded — что делать когда IDB full

**Answer.** Catch `QuotaExceededError` на `bulkPut` / `put` → toaster «Удалите старые данные, мы сами не можем» + offer manual cleanup of rows older than 60 days. Auto-prune только с явным consent, не silently.

**Reason.**
1. Disher analytic horizon = 30 дней (cite: user memory `project_short_distance_horizon.md` — «Disher = аналитика max 30 дней, не лонгитюдинал»). Rows старше 60 дней (с двойным запасом) гарантированно вне аналитического окна и могут быть pruned безопасно — это не теряет user-facing функционал.
2. Industry rule: **никогда не удалять user data без confirmation**. Cite: `_inputs/joplin_issues.md:21-29` — урок из 3-х high-severity Joplin recovery bugs: «Never auto-wipe — always require explicit user confirmation. Fail-safe ON by default. Idempotent recovery.»
3. Quota на iOS Safari 17+ для PWA — `navigator.storage.estimate()` обычно показывает ~1 GB и больше. Disher 30-day data ≈ 1-5 MB. Quota exceeded = либо bug (мы пишем raw blobs куда-то), либо devtools/CDN кэш забил origin storage. В любом случае — user visibility важнее silent recovery.
4. Detection pattern в Dexie:
   ```ts
   try {
     await db.transaction('rw', db.products, async () => { /* bulk apply */ });
   } catch (err) {
     if (err.name === 'QuotaExceededError' || err.inner?.name === 'QuotaExceededError') {
       showQuotaToaster();
       return;
     }
     throw err;
   }
   ```

**Status.** **Resolved** — toaster + manual prune button. Auto-prune только rows > 60 days с user confirmation.

**Open question for PoC.** Реальный quota limit на iOS Safari 17 для PWA в 2026 — публичные источники колеблются 100 MB ÷ 1 GB. Real-device тест нужен.

---

## D.5 DB version downgrade (юзер откатил приложение)

**Answer.** Dexie бросает `VersionError`. Recovery = explicit modal «Reset & resync» с confirm + fail-safe ON. Acceptable trade-off благодаря 30-day window.

**Reason.**
1. Dexie versioning monotonic. Если на диске v3 schema, а код знает только v2 — Dexie не открывает БД. Cite: Track B §B.5.3 — «`db.open().catch(err => ...)` — если open fails с `VersionError` / `DatabaseClosedError`, fallback на recovery».
2. Reset+resync acceptable: благодаря backup endpoint мы знаем — server has latest snapshot. Пользователь теряет максимум rolling 30-day window of dirty edits (которые либо успели push'нуться, либо нет), но recoverable из cloud. Cite: Track B §B.6.4 — «Drop-and-resync приемлем, потому что данные старше 30 дней не load-bearing».
3. UI rule: explicit confirm + fail-safe ON. Cite: `_inputs/joplin_issues.md:21-29`:
   > «Never auto-wipe — always require explicit user confirmation. Fail-safe ON by default. Idempotent recovery (safe to re-run, no double-application of cleanup). Detectable end state — recovery either completes or surfaces a clear error, never 'still syncing forever'.»
4. Pattern: при boot — `db.open()` в `try/catch`. На VersionError → modal:
   > «App version older than your data. Reset and re-download? [Cancel] [Reset and resync]»

   Кнопка click → `db.delete()` → `pullSnapshot()` → done. Cite: Track B §B.5.4 — «Type "RESET" to confirm: [______]» pattern для destructive ops.

**Status.** **Resolved** — VersionError → recovery modal. Idempotent restore flow per Track B §B.5.4.

---

## D.6 Auth session expired during push

**Answer.** 401 в drain = **retry**, не poison. Refresh session через Supabase Auth, один retry; если повторно 401 — log diag event + back-off (но не выкидывать row из outbox).

**Reason.**
1. Cite: user memory `project_auth_invariant.md` — «Disher auth-инвариант: логин один раз, refresh token не истекает, 401 в drain = retry не poison, окно логина юзер не видит вне явного logout».
2. Pattern уже реализован в текущем `pendingWrites.ts`. Cite: `apps/food-calc/CLAUDE.md` секция «Outbox poison handling»:
   > «Outbox poison handling: any 4xx other than 401/408/425/429 is poison (toaster.error, drop, continue with the tail). 401 and 5xx/0/AbortError retry with exponential backoff.»
3. На backup-polling переезд этот invariant сохраняется. Backup endpoint валидирует Supabase JWT (cite: `track-c-tools-libraries.md` C.3 — JWT auth самописный либо JWKS-валидация Supabase token'а на собственном backend).
4. Refresh flow:
   ```
   on push() → 401 →
     await supabase.auth.refreshSession()
     retry push() once →
     if 401 again → log diag + back-off (rows остаются _dirty)
     if 200 → mark synced (timestamp guard)
   ```
5. **Edge case:** refresh token истёк (теоретически). Cite: `project_auth_invariant.md` — refresh token не истекает в normal flow. Если истёк — это explicit re-auth boundary, юзер увидит login screen. Dirty rows сохраняются и push'нутся после re-auth.

**Status.** **Resolved** — same pattern as `pendingWrites.ts`, transferred to backup-polling drainer.

---

## D.7 Race: mutation while push in flight

**Answer.** Notesnook timestamp guard. Перед push'ем фиксируем `pushTimestamp = Date.now()`. После 2xx response — `synced=true` (mark `_dirty=false`) **только** для rows у которых `client_modified_at <= pushTimestamp`. Rows, обновлённые во время push'а, остаются `_dirty=true` и подберутся следующим drain'ом.

**Reason.**
1. Cite: `_inputs/notesnook_collector.ts:80-89`:
   - line 64: `pushTimestamp = Date.now()` — берётся **per chunk** до начала push'а.
   - lines 80-89: после push — mark synced only rows with `dateModified <= pushTimestamp`.
2. Cite: user memory `feedback_timestamp_guard_pattern.md` — «Notesnook/Joplin фикс race-окна: `synced=true WHERE dateModified<=pushTimestamp` + recursive re-collect».
3. Documented в Track B §B.2.8 с pseudo-code:
   ```ts
   async function pushBatch(rows) {
     const pushAt = Date.now();
     const res = await fetch('/backup', { ... });
     await db.transaction('rw', tables, async () => {
       for (const { id } of accepted) {
         const row = await db.products.get(id);
         if (row && row.client_modified_at <= pushAt) {
           await db.products.update(id, { _dirty: false });
         }
       }
     });
   }
   ```
4. Дополнительная защита: `_inputs/notesnook_auto-sync.ts:73-81` — auto-sync interval НЕ должен быть 0:
   > «auto sync interval must not be 0 to avoid issues during data collection which works based on Date.now(). It is required that the dateModified of an item should be a few milliseconds less than Date.now().»

   Перевод: дебаунс push trigger ≥ 100 ms — иначе `client_modified_at === Date.now()` в момент сбора и race с одновременной правкой ломает invariant.

**Status.** **Resolved** — explicit pattern в Track B §B.2.8 + cross-cutting recommendation #3.

---

## D.8 `client_modified_at` resolution — Date.now() = ms enough?

**Answer.** Да, ms достаточно для single-user sequential. Tie-breaker через `edit_count` counter.

**Reason.**
1. Disher = single-user sequential (cite: `apps/food-calc/CLAUDE.md` + plan §0.1). Конкурентных правок одной строки на одном устройстве в один и тот же ms — практически невозможно (юзер физически не нажмёт save на одну row дважды за 1 ms).
2. Standard Notes использует microsecond precision (cite: `_inputs/sn_TimeDifferenceFilter.ts:38-47`) — но **только потому что они multi-user collaborative** (shared vaults). Disher не наш кейс.
3. Notesnook explicitly предупреждает что debounce ≥ 100 ms нужен иначе `Date.now()` collisions ломают sync (cite: `_inputs/notesnook_auto-sync.ts:73-81`). Мы это honoрируем (Track B §B.3.1).
4. `edit_count` как primary conflict resolver (Track B §B.2.2) дополнительно устраняет даже теоретическую коллизию: при equal `edit_count` — tie-breaker по `client_modified_at`. Cite: track-e-our-category.md (CloudSyncSession + Apple HealthKit `HKMetadataSyncIdentifier`/`HKMetadataSyncVersion`).
5. Add `device_id` в tie-breaker если PoC observes collisions — но prior art (Notesnook, Joplin) не использует, и single-user не нуждается.

**Status.** **Resolved** — ms + `edit_count` primary, optional device_id tie-breaker only if PoC shows need.

---

## D.9 Server clock authoritative — `server_received_at` vs `client_modified_at`?

**Answer.** Использовать `client_modified_at` (+ `edit_count`) для LWW conflict resolution. `server_received_at` — **только** для clock-skew detection telemetry. Никогда не подменять им `client_modified_at`.

**Reason.**
1. Cite: `_inputs/joplin_Synchronizer.ts:669-672`:
   > «updated_time is set and managed by clients so it's always accurate» — vs file timestamps на sync target которые «can be unreliable».
   Joplin делает client-authoritative timestamp интенционально.
2. Server-authoritative ломает offline multi-day scenario. Если юзер 3 дня offline → редактирует row в день 0 → push приходит на сервер в день 3 — `server_received_at = day 3`, но фактическая mutation была в day 0. Все downstream queries «что произошло за неделю» показывают неверный порядок.
3. Backup-polling ассумпция: client = source of truth. Cite: plan §0.3:
   > «Локальная БД (Dexie/IndexedDB) = source of truth.»
4. Clock skew detection — реальная польза от `server_received_at`:
   ```
   if (Math.abs(server_received_at - client_modified_at) > 5 * 60 * 1000) {
     diagLog('clock-skew-detected', { delta_ms, device_id });
   }
   ```
   Cite: Track B §B.2.4 — «Clock skew detection: если `server_received_at - client_modified_at > 5 минут` — логировать diag-event».
5. Industry: SN использует `lastUpdatedTimestamp = this.timer.getTimestampInMicroseconds()` (`_inputs/sn_SaveItems.ts:53`) как server clock в ответе клиенту, но клиент использует **свой** timestamp для conflict comparison. Тот же подход.

**Status.** **Resolved** — `client_modified_at` + `edit_count` для LWW, `server_received_at` для skew telemetry only.

---

## D.10 Cross-origin / subdomain (staging vs prod IDB share)

**Answer.** Different origins = different IDB databases. Staging и prod данные изолированы автоматически браузером, contamination невозможна.

**Reason.**
1. Web Storage spec: IDB key = origin tuple `(scheme, host, port)`. `https://disher.app:443` ≠ `https://staging.disher.app:443` ≠ `https://disher-pr-42.vercel.app:443`. Каждый получает свою sandboxed IDB instance.
2. Disher текущий deployment (cite: `apps/food-calc/CLAUDE.md` секция «Sync Setup») использует Supabase project URL + Node sidecar на отдельном host'е. Pre-prod / prod environments автоматически разделены.
3. Edge case: если staging и prod **разделяют один Supabase project** (что нежелательно), backup endpoint может получать staging data в prod database — но это backend concern, не frontend IDB. Cite: Track C §C.3 — рекомендация «отдельные Supabase projects для prod/staging».
4. Edge case: `*.disher.app` pattern с shared cookies — IDB не affected (origin includes subdomain). Cookies могут leak'нуть, IDB — нет.

**Status.** **Resolved** — no action needed. Standard browser isolation.

---

## D.11 PWA update — service worker swap, как Dexie данные переживают

**Answer.** Service worker scope ≠ IDB scope. SW update **не трогает** IDB. Dexie schema upgrade срабатывает только когда `db.version()` bump'ается в коде.

**Reason.**
1. Service worker storage = (1) Cache Storage API (controllable through SW), (2) фоновые задачи. IndexedDB управляется отдельно — main thread + SW могут оба читать/писать одну и ту же IDB instance, но lifecycle SW (install/activate/redundant) на IDB не влияет.
2. PWA update flow:
   - Browser fetches new SW → install event → activate event → SW takes control after page reload.
   - Старый Dexie schema на диске остаётся как был.
   - Когда новый код вызывает `db.open()` с `db.version(N)` где N > previous — Dexie запускает upgrade transaction. Cite: `_inputs/dexie_version.ts:108-116` (`Version.upgrade()` callback chained через `promisableChain`).
3. Cite: Track B §B.6.1 — «Add column = backward compatible. Старый клиент игнорирует новое поле (не знает, не присылает). Новый клиент использует. Никаких downtime / data loss.»
4. Edge case: если новый SW активируется во время того как старый код уже открыл DB на старой версии — Dexie бросает `versionchange` event на старую connection. Pattern: cite Track B §B.5.3 — `Dexie.on('versionchange')` → close old connection.
5. Disher PWA auto-update via Vite PWA plugin — после reload new code + new SW + new schema activate atomically per tab. Multi-tab edge case (один tab новый, другой старый) разрешается через `versionchange` handler.

**Status.** **Resolved** — standard Dexie versioning + `versionchange` handler.

---

## D.12 Backup endpoint downtime SLA

**Answer.** Plan для 7 дней downtime без user-visible degradation. Длиннее — soft warning через UI badge. Очень длинный (>30 дней) — это уже catastrophic, recovery flow.

**Reason.**
1. Estimation:
   - Disher typical activity ≈ 30 dirty rows/day (~6 schedule_foods + ~4 schedule_events + occasional product/dish edits). 7 days × 30 = 210 dirty rows.
   - Per row ≈ 200-500B JSON. 210 rows × 400B = ~85 KB raw / ~15 KB gzipped (6-7x compression). Cite: Track B §B.2.6.
   - sendBeacon 64 KiB cap (cite: `_inputs/web_apis_summary.md:24-30`) — gzipped 15 KB fits легко. Без compression — split на 2 chunks через `fetch keepalive`.
2. После 7 дней tolerance, UX:
   - Показать `<PendingWritesBadge>` (уже существует, cite: `apps/food-calc/CLAUDE.md` `src/shared/lib/sync/PendingWritesBadge.tsx`) с count + warning «Sync delayed N days».
   - Не блокировать UI — local DB продолжает работать.
3. Catastrophic (>30 дней): мы рискуем переполнить IDB quota и/или потерять trust юзера. Recovery strategy: показать модалку «Backup unreachable for >30 days. Continue locally?» с кнопкой acknowledge. Cite: Track B §B.5.4 (general recovery flow patterns).
4. Industry comparison:
   - Joplin: tolerates indefinite downtime locally (file-based sync, no central server timeout). Cite: track-a-prior-art (Joplin pattern).
   - Notesnook: similar — tolerates as long as local DB не overflow.
5. Track B §B.5.1 estimation: 30 days full snapshot = ~125 KB JSON / ~20 KB gzipped. Это означает что даже full backlog после 30 days downtime fit's в один HTTP request (gzipped) или 2 requests (uncompressed).

**Status.** **Resolved** — 7-day tolerance silent, 7-30 day window soft warning, >30 days recovery modal.

---

## D.13 Anonymous → registered user upgrade — Dexie tied to anonymous user_id

**Answer.** Disher Tier-1 (2026-04-28) **уже** удалил anonymous users + AuthGate. Этот корнер-кейс moot.

**Reason.**
1. Cite: user memory `project_required_auth_done.md` — «Tier-1 пункт 1 (обязательная регистрация + AuthGate) выполнен раньше очереди (2026-04-28); анонимы вырезаны».
2. Backup-polling migration starts с фиксированной registered-user invariant. Каждый Disher boot = `getSession()` returns user_id; если null → AuthGate blocks UI. Никогда нет anonymous IDB state, который надо мигрировать.
3. Если бы анонимы были — pattern был бы:
   - Dexie keyed на `user_id` через compound index `[user_id+...]`.
   - При upgrade `supabase.auth.updateUser({ email })` — `user_id` UUID **сохраняется** (Supabase auth invariant: anon→registered = same UUID). Cite: `apps/food-calc/CLAUDE.md` секция «Sync Setup»: «Anon→registered upgrade is a **two-step** flow».
   - Significaмо: IDB rows не нужно re-key. Просто `supabase.auth.updateUser` и backend sees same `auth.uid()`.
4. Disher же выбрал убрать анонимов целиком — упрощение в обмен на friction (mandatory signup). Решение валидно, см. memory.

**Status.** **Not applicable** — кейс removed by Tier-1 simplification.

---

## D.14 Logout — wipe Dexie или keep?

**Answer.** **Wipe** на explicit logout button click. **Keep** на session expiry / auto-refresh boundary.

**Reason.**
1. Privacy expectation: explicit logout = «I want this device clean». User signals intent. Сохранение local data поверх logout = privacy hole (next user on same device sees previous data).
2. Session expiry = transient, no user signal. Cite: user memory `project_auth_invariant.md`:
   > «refresh token не истекает в normal flow, logout — отдельный явный signal.»
   Любой session refresh — это same user, не нужен wipe.
3. Pattern:
   ```ts
   async function explicitLogout() {
     await Dexie.delete('disher-app');  // wipe IDB
     await idbKeyval.clear();            // wipe persisted query cache
     await supabase.auth.signOut();      // invalidate token
     // route to login screen
   }
   ```
4. Edge case: dirty rows pending push на момент logout. **Лоса acceptable** — пользователь explicitly logout = знает что local-only changes теряются. Но дать модалку: «You have N unsynced changes. Sync before logout? [Cancel] [Logout anyway] [Sync first]».
5. Industry: Bearable forces restore-from-backup на login (cite: `track-e-our-category.md` Bearable section) — это противоположный паттерн, но Bearable делает это **потому что у них broken multi-device**. Мы НЕ копируем (cite: track-e «что НЕ копировать» #2 — «Logout = принудительный restore из бэкапа»).

**Status.** **Resolved** — `Dexie.delete('disher-app')` on logout button click + dirty-rows confirmation.

---

## D.15 GDPR / user data deletion

**Answer.** Two-phase: (1) backend hard delete on user request (server-side soft-deleted rows + analytics caches). (2) Client wipes local Dexie на следующем boot после confirmation. PoC не реализует — это Phase 2 (legal/compliance work).

**Reason.**
1. GDPR Right to Erasure (Article 17) требует:
   - Backend hard delete (не soft) для personal data.
   - Удалить production + backups в reasonable timeframe (typically 30 дней).
   - Audit log что удалено и когда.
2. Disher current state (cite: `apps/food-calc/CLAUDE.md`): «Soft delete via `deleted_at`. Hard delete is never used.» — это для regular UX. GDPR delete = separate admin endpoint with hard delete.
3. Backup-polling delete flow:
   - User → Settings → Delete Account → confirmation modal.
   - Frontend: `POST /api/account/delete` (separate endpoint, not backup endpoint).
   - Backend: hard delete from products/dishes/schedule_foods/etc + analytics caches + diag-logs (per `disher-backend-3.0`).
   - Frontend: `Dexie.delete()` + `idbKeyval.clear()` + sign out + redirect.
4. UI rule: explicit confirm + one-way warning. Cite: Track B §B.5.4 patterns:
   > «☑ Fail-safe enabled (recommended) ... Type "DELETE" to confirm: [______]»
5. Не входит в PoC scope — это compliance work, отдельный endpoint, отдельный legal review. PoC = backup-polling viability test.
6. Industry: Bearable explicitly handles via support@email manual flow (cite: `track-e-our-category.md`). Daylio — `Settings → Delete Account` triggers full backup-then-wipe. Disher должен иметь automated endpoint (scale).

**Status.** **Resolved** — pattern documented; PoC scope excluded (Phase 2 task).

---

## D.16 Backup endpoint returns 422 «schema mismatch»

**Answer.** Client logs error, surfaces toast «App update required», **blocks further pushes** (preserves dirty state until update). **Никогда** auto-drop dirty rows on 422.

**Reason.**
1. 422 от backup endpoint = client-side schema mismatched server expectation. Examples:
   - Client v3 шлёт column `time` который сервер v2 не знает.
   - Client v2 шлёт без новой required column которую сервер v3 ожидает.
   - Client v3 после rollback пытается записать в schema, которая на сервере уже dropped.
2. Auto-drop dirty rows на 422 = silent data loss. Это catastrophic UX failure. Cite: `_inputs/joplin_issues.md:21-29`:
   > «Never auto-wipe — always require explicit user confirmation.»
3. Pattern:
   ```
   on 422 →
     diagLog('schema-mismatch', { rows: rejected.length, reason })
     showBlockingModal({
       title: 'App update required',
       body: 'Your version of Disher cannot sync with server. Please refresh.',
       actions: [{ label: 'Reload', onClick: () => window.location.reload() }]
     })
     // Stop drainer — don't burn battery retrying
   ```
4. Track B §B.6.1 + §B.6.4: schema migration plan для backup-polling предполагает 30-day window рулится через `JSON merge` (`COALESCE(EXCLUDED.col, products.col)`) и dual-write для rename. Breaking changes = редкость. 422 значит мы **не следовали** этому плану — серьёзный signal к юзеру и dev-team.
5. Cite: `_inputs/sn_SaveItems.ts:36-37, 121-153` — Standard Notes возвращает rejected rows с `ConflictType` reason; client decides reaction. 422 = special class — **block all** vs treat as per-row reject.
6. Schema version negotiation pattern: добавить header `X-Disher-Schema-Version: 3` в каждый push. Server проверяет, возвращает 422 с structured body `{ expected_version, current_version }`. Client может показать precise message «Your app is on schema 3, server expects 2». Это упрощает diagnosis.

**Status.** **Resolved** — toast + block, no auto-recovery.

---

## Сводка

- **Resolved (14 of 16):** D.1, D.2, D.3, D.4, D.5, D.6, D.7, D.8, D.9, D.10, D.11, D.12, D.14, D.15 (pattern resolved, implementation Phase 2), D.16.
- **Not applicable (1):** D.13 (anon users removed by Tier-1 simplification).
- **Deferred to PoC (0):** все 16 имеют answer + verdict; PoC валидирует empirically.

---

## Ключевые риски, которые остаются (даже после research'а)

Корнер-кейсы где answer есть, но real-device validation обязательна:

### Risk 1: iOS H2 pool poisoning во время push

- Cite: user memory `project_ios_fetch_hang_2026_04_28.md` — WebKit Bug #284946: Safari shares HTTP/2 connection pool poisoned across all `fetch` calls после network interruption. Disher уже наступил на это с Supabase fetch hang.
- **Implication для backup-polling:** backup endpoint должен использовать **HTTP/1.1 only** ИЛИ predictable iOS bug-tolerance.
- **Mitigation:**
  - Option A: backup endpoint behind nginx с `http2 off` для iOS UA.
  - Option B: тот же `/api/sb/*` proxy pattern, который уже работает (cite: user memory `project_ios_proxy_resolved.md` — «Plan B победил, /api/sb/* passthrough работает в dev»).
  - Option C: периодически rotate connection (`fetch` с `cache: 'no-store'` + close hint header).
- **Action item для PoC:** design backup endpoint с HTTP/1.1, не HTTP/2.

### Risk 2: Quota exceeded UX flow на iOS

- D.4 answer = «toaster + manual prune». Но реальный quota limit на iOS Safari 17 для PWA в 2026 — публичные источники колеблются 100 MB ÷ 1 GB. Disher 30-day dataset ≈ 1-5 MB — fit even worst case.
- **Risk:** девтульсы Chrome не воспроизводят iOS Safari quota behavior. Real-device test обязателен.
- **Action item для PoC:** на real iPhone — заполнить IDB до quota (через test fixture), наблюдать `QuotaExceededError` shape, проверить toaster path.

### Risk 3: Multi-tab leader election с `navigator.locks`

- D.2/D.7 предполагают `navigator.locks.request('disher-drain', { mode: 'exclusive' }, ...)`. Cite: `_inputs/web_apis_summary.md:44-52` — iOS Safari 15.4+, должно работать.
- **Risk:** мы первый раз используем locks API в Disher. Производственных bug-reports на iOS ≈ нет (хорошо), но и production telemetry у нас тоже нет.
- **Action item для PoC:** sanity test — открыть 2 tabs одного user, симултани едит, observe `navigator.locks` блокирует concurrent push.

### Risk 4: sendBeacon flushes на iOS PWA при home button

- D.2 answer relies on `visibilitychange + sendBeacon`. Cite: `_inputs/web_apis_summary.md:30-31`:
  > «iOS Safari: does NOT fire `unload`/`beforeunload` reliably — must use `visibilitychange` as trigger.»
- **Risk:** iOS PWA при aggressive home button presses — `visibilitychange` может fire'нуть после того как iOS уже зафризил процесс. sendBeacon в этом окне поведение **untested на real device**.
- **Action item для PoC:** test fixture — log to backend каждый sendBeacon attempt (с timestamp), затем home button hammering на реальном iPhone, проверить какие beacon'ы реально доехали.

### Risk 5: Schema migration timing в production

- D.11 + Track B §B.6 patterns предполагают `Version.upgrade()` callback runs at first open after version bump. Cite: `_inputs/dexie_version.ts:108-116`.
- **Risk:** на real iPhone с 30 days активных данных upgrade callback может занять секунды (iterating через 1200+ schedule_foods). UX risk — startup latency.
- **Action item для PoC:** прогон upgrade на 30-day fixture на real device, измерить latency, решить нужен ли progress modal.

### Risk 6: Clock skew detection threshold

- D.9 предлагает порог 5 минут. Cite: Track B §B.2.4 — это эвристика.
- **Risk:** туристический device timezone shift, NTP correction jumps — могут давать legitimate 30-минутные skew без user error. Telemetry threshold нужно tune.
- **Action item для PoC:** залогировать skew telemetry ≥30 дней на real beta users, set threshold от observed p99.

---

## Open questions for PoC (что не закрыто research'ем)

Эти вопросы имеют design-time answer, но empirical validation possible only в PoC:

1. **Реальный iOS quota** для Add-to-Home-Screen PWA в 2026 (D.4).
2. **iOS sendBeacon reliability при aggressive backgrounding** (D.2 risk #4).
3. **`navigator.locks` real-device behavior** в multi-tab Safari iOS (D.2 risk #3).
4. **HTTP/2 pool poisoning** при backup endpoint pусь (D.16 + risk #1).
5. **`Version.upgrade()` latency** на 30-day dataset на iPhone 12 (D.11 + risk #5).
6. **Clock skew p99** observed на real beta users (D.9 + risk #6).
7. **Quota exceeded shape** в Dexie + chained promise rejection (D.4).

---

## Sources

| Citation | Used in |
|---|---|
| `_inputs/web_apis_summary.md:6-13` | D.2 (Background Sync = NOT supported on iOS, ever) |
| `_inputs/web_apis_summary.md:16-22` | D.2, D.11 (Page Lifecycle freeze/resume = NOT in Safari) |
| `_inputs/web_apis_summary.md:24-30` | D.2, D.12 (sendBeacon 64 KiB cap) |
| `_inputs/web_apis_summary.md:30-31` | risk #4 (iOS не fires unload/beforeunload) |
| `_inputs/web_apis_summary.md:44-52` | D.2, risk #3 (navigator.locks iOS 15.4+) |
| `_inputs/web_apis_summary.md:54-60` | D.2 (visibilitychange reliable on iOS) |
| `_inputs/joplin_issues.md:21-29` | D.4, D.5, D.15, D.16 (recovery rules: explicit confirm, fail-safe ON, idempotent, detectable end state) |
| `_inputs/joplin_Synchronizer.ts:669-672` | D.9 (client-managed updated_time accurate vs unreliable file timestamps) |
| `_inputs/notesnook_collector.ts:64, 80-89` | D.7 (timestamp guard pattern) |
| `_inputs/notesnook_auto-sync.ts:73-81` | D.8 (Date.now() collision avoidance, 100 ms minimum debounce) |
| `_inputs/dexie_version.ts:108-116` | D.5, D.11 (Version.upgrade callback) |
| `_inputs/dexie_hooks-middleware.ts:38-69` | D.1 (Dexie hooks for auto-stamping) |
| `_inputs/dexie_live-query.ts:90-99` | D.1 (Dexie liveQuery observability ranges) |
| `_inputs/sn_SaveItems.ts:36-37, 53, 121-153` | D.9, D.16 (SN response shape, server timestamp, per-row reject) |
| `_inputs/sn_TimeDifferenceFilter.ts:38-47` | D.8 (microsecond precision = multi-user only) |
| `_inputs/npm_versions.md` строка 9 | D.1 (Dexie 4.4.2 zero runtime deps) |
| `track-b-best-practices.md` §B.2.2 | D.8 (edit_count primary, client_modified_at tie-breaker) |
| `track-b-best-practices.md` §B.2.4 | D.9 (server_received_at for skew telemetry) |
| `track-b-best-practices.md` §B.2.6 | D.12 (gzipped payload sizing) |
| `track-b-best-practices.md` §B.2.8 | D.7 (timestamp guard pseudo-code) |
| `track-b-best-practices.md` §B.3.1 | D.2 (visibilitychange + sendBeacon scheduler) |
| `track-b-best-practices.md` §B.5.1 | D.12 (30-day snapshot ≈ 125 KB JSON / 20 KB gzipped) |
| `track-b-best-practices.md` §B.5.3 | D.5, D.11 (VersionError handling) |
| `track-b-best-practices.md` §B.5.4 | D.5, D.15 (Reset & resync UI rules) |
| `track-b-best-practices.md` §B.6.1 | D.11 (add column = backward compatible) |
| `track-b-best-practices.md` §B.6.4 | D.5 (drop-and-resync acceptable in 30-day window) |
| `track-c-tools-libraries.md` C.1 | D.1 (Dexie ecosystem rationale) |
| `track-c-tools-libraries.md` C.3 | D.6 (JWT JWKS validation на собственном backend) |
| `track-e-our-category.md` Bearable | D.14 (logout = forced restore — anti-pattern) |
| `track-e-our-category.md` CloudSyncSession + HealthKit | D.8, D.9 (edit_count counter > timestamp) |
| `apps/food-calc/CLAUDE.md` (Tables section) | D.1 (relational data model) |
| `apps/food-calc/CLAUDE.md` (Sync Setup) | D.3, D.6, D.13 (current SyncProvider boot, anon→registered, outbox poison rules) |
| user memory `project_ios_pwa_storage_eviction.md` | D.1, D.3 (PWA persist() works on Safari 17+) |
| user memory `project_ios_fetch_hang_2026_04_28.md` | risk #1 (WebKit Bug #284946 H2 pool poisoning) |
| user memory `project_auth_invariant.md` | D.6, D.14 (login один раз, refresh не истекает, 401 = retry) |
| user memory `project_short_distance_horizon.md` | D.4, D.5, D.12 (30-day analytic horizon) |
| user memory `project_required_auth_done.md` | D.13 (anonymous users removed Tier-1) |
| user memory `feedback_timestamp_guard_pattern.md` | D.7 (Notesnook/Joplin pattern reference) |
| user memory `project_ios_proxy_resolved.md` | risk #1 (Plan B passthrough proxy) |

---

## Verdict для юзера

Все 16 корнер-кейсов из плана §2.4 имеют actionable answer **до** PoC. 1 кейс (D.13 anon users) зачёркнут как already-solved by Tier-1. Остальные 15 — resolved patterns.

Шесть рисков обозначены как «answer есть, real-device validation обязательна» — они формируют PoC test plan (см. plan §6 «Решающие вопросы для PoC»). Никаких фундаментальных blocker'ов в research не выявлено.

Backup-polling architecture viable под Disher profile с 14/16 corner cases pre-resolved. PoC scope = empirical validation of 6 risks выше + sanity criteria из plan §6.
