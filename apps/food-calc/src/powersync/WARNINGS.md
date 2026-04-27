# PowerSync + Supabase — операционные предостережения

Все, что не очевидно из кода и куда стоит заглянуть прежде, чем что-то менять
в этой папке, ловить странный 400, или удивляться, почему данные ведут себя
не так, как ожидалось.

---

## 1. PowerSync ретраит upload бесконечно

`uploadCrud` в [connector.ts](./connector.ts) пробрасывает любую ошибку
наружу. PowerSync воспринимает это как «не получилось, попробую снова» и
зацикливается на той же `CrudEntry`, пока она не пройдет. Это значит:

- Один битый insert (нарушение типа, NOT NULL, FK, RLS, чек-констрейнта)
  блокирует всю очередь — следующие записи тоже не уйдут, пока эта не
  пройдет.
- В консоли будет шквал `400 Bad Request` с одной и той же `CrudEntry`,
  по одной попытке на каждом цикле sync.
- Фикс кода **не лечит** уже застрявшую запись. Локальный CRUD-queue
  хранится в IndexedDB и переживает hot-reload и перезагрузку страницы.

### Как разруливать

- На dev: проще всего снести локальную IndexedDB (см. wipe-блок ниже).
- На prod: либо доставить серверный фикс (например, расслабить
  ограничение, на которое наткнулась запись), либо в connector добавить
  обработчик класса ошибок, при котором `batch.complete()` вызывается
  без перезаписи + локальная строка удаляется (тогда PowerSync пометит
  запись как «загружена» и забудет про нее). Сейчас такого fallback нет.

### Типичные источники 400 на upload

- `""` вместо `null` в uuid-колонках (Postgres не парсит пустую строку
  как uuid). На клиенте мы пишем в SQLite `column.text`, на сервере же
  колонка `uuid` — расхождение проявляется только на upload.
- Нарушение чек-констрейнтов (например, `schedule_foods_ref_chk`
  требует ровно один из `product_id`/`dish_id`).
- RLS не пропускает запись, у которой `user_id != auth.uid()`. Это
  возвращает 401/403, а не 400, но симптом тот же — бесконечный ретрай.

---

## 2. Anonymous sign-in == полноценный пользователь

`signInAnonymously()` в [PowerSyncProvider.tsx](./PowerSyncProvider.tsx)
создает реальную строку в `auth.users` с настоящим UUID. Это значит:

- Аноним пишет в Supabase так же, как обычный юзер. RLS-политика
  `user_id = auth.uid()` для него выполняется. Если 400 — это **не**
  «у анонима нет прав», это баг payload'а.
- При апгрейде анонима (`linkIdentity`) UUID **сохраняется**, его данные
  на сервере автоматически становятся данными постоянного аккаунта.
- Без CAPTCHA/rate-limit любой бот может в цикле создавать анонимов и
  засирать `auth.users` + ваши таблицы. См. ниже про защиту.

### Что Supabase защищает сам

- RLS не дает читать/писать чужие строки (Postgres вернет 403, JWT с
  чужим `sub` подписать нельзя).
- PowerSync Sync Rules — второй слой поверх RLS, бакеты гейтятся по
  `user_id = request.user_id()`.

### Что **не** защищает (наша зона ответственности)

- **Спам аккаунтов.** Включить Cloudflare Turnstile (Dashboard → Auth →
  Bot and Abuse Protection) и передавать `captchaToken` в
  `signInAnonymously({ options: { captchaToken } })`.
- **Rate limit на anonymous sign-ins.** Dashboard → Auth → Rate Limits.
- **Чистка stale анонимов.** Supabase не удаляет их сам. Нужен
  pg_cron job, который раз в сутки сносит `auth.users` где
  `is_anonymous = true and last_sign_in_at < now() - interval '30 days'`.
  `ON DELETE CASCADE` подчистит данные пользователя автоматически.
- **Логические лимиты** (например, не больше N schedule_foods на
  юзера). Ставится триггером `before insert`. Осторожно: ошибка из
  триггера приведет к зацикливанию upload (см. п. 1) — поэтому нужен
  и клиентский pre-check, и серверный триггер как defense-in-depth.

---

## 3. Snake_case на сервере, camelCase на клиенте

Postgres-колонки — `snake_case`, UI-типы — `camelCase`. Конвертация
делается в `api/queries.ts` через `snakeToCamel`. На запись (мутации)
конвертации нет — пишем сразу в `snake_case`. Не путать.

---

## 4. JSON-колонки — строки на клиенте, jsonb на сервере

`products.nutrients`, `daily_norms.items`, `schedule_events.atoms` и т.п.
на клиенте лежат как сериализованные строки (`column.text` в локальной
схеме), а на сервере — `jsonb`. PowerSync конвертирует автоматически на
upload/download, но в `db.execute(...)` мы пишем `JSON.stringify(...)`,
а при чтении — `JSON.parse(...)` на entity-уровне. Если забыть — на
сервере окажется строка `"[object Object]"` или `"null"`, и при
следующей синхронизации это вернется битым.

---

## 5. Soft delete

Все user-data таблицы имеют `deleted_at timestamptz`. «Удалить» = `update
... set deleted_at = ?`. Все `useQuery` фильтруют `where deleted_at is
null`. Hard-delete оставлен на batch job, его пока нет.

---

## 6. WebSocket транспорт обязателен на iOS Safari

`SyncStreamConnectionMethod.WEB_SOCKET` в [PowerSyncProvider.tsx](./PowerSyncProvider.tsx)
— не оптимизация, а обход бага: HTTP streaming на iOS Safari зависает
(чанки не доставляются в ReadableStream до закрытия соединения).
**Не менять** без проверки на реальном iOS.

---

## 7. Shared Worker (`enableMultiTabs: true`) — обязателен

Free-tier PowerSync дает 10 concurrent connections. Без shared worker
каждая вкладка открывает свой WebSocket — один юзер с 10 вкладками
выжирает весь лимит. См. [database.ts](./database.ts).

---

## 8. Sync Rules живут не здесь

Sync Rules (что отдавать клиенту в каких бакетах) задаются в PowerSync
Cloud Dashboard, **не в этом репо**. При изменении схемы Postgres
(`supabase/migrations/`) надо параллельно обновлять Sync Rules в
Dashboard, иначе клиент не увидит новые колонки/таблицы. Это легко
забыть — сервер не падает, просто данные молча не приезжают.
