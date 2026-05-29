# Free Text Food — документация фичи

Пользователь на мобильном голосом или текстом описывает что ел («на завтрак овсянку с бананом»), backend через LLM + векторный поиск возвращает структурированные продукты, frontend показывает результат с UI-disambiguation, пользователь подтверждает — продукты добавляются в расписание дня.

Актуальный прогресс и следующие шаги — [`apps/food-calc/tds/free-text-food-progress.md`](../../../../food-calc/tds/free-text-food-progress.md).

Все пути в README относительны корня backend-пакета (`apps/disher-backend-3.0/`), если не указано иное.

## Архитектура: Hybrid Pipeline

Разделение ответственности между LLM и embeddings:

| Слой | Инструмент | Задача |
|---|---|---|
| Extraction | LLM (DeepSeek через OpenRouter) | Парсинг языка → `[{ name, quantity, time }, ...]`. Каталог в промпт НЕ передаётся. |
| Vectorization | `@xenova/transformers`, `Xenova/multilingual-e5-small` (384 dim) | `name` → embedding на backend, локально |
| Matching | In-memory cosine similarity | Top-K кандидатов из предвычисленных эмбеддингов каталога |
| Disambiguation | UI | Авто-принятие / ручной выбор из top-3 / пропуск — в зависимости от score и margin |

Зачем так: LLM не видит каталог → экономия ~15–20k токенов на запрос + скорость. Embeddings сами справляются с синонимами («картошка» ≈ «картофель»), а threshold-логика делит results на 3 секции вместо молчаливого отбрасывания.

## Environment

| Переменная | Обязательна | Дефолт | Назначение |
|---|---|---|---|
| `OPENROUTER_API_KEY` | да | — | Ключ OpenRouter для вызова LLM |
| `SUGGESTION_MODEL` | нет | `deepseek/deepseek-chat` | Любая OpenRouter-модель с поддержкой JSON response mode |

Переменная `SUGGESTION_MODEL` шарится с роутом dish-suggestions — менять осознанно.

## Backend

### Файлы

| Путь | Назначение |
|---|---|
| [`src/api/routes/free-text-food.ts`](./free-text-food.ts) | HTTP-эндпоинт `POST /api/free-text-food/parse` + LLM + cache + threshold-логика |
| [`src/api/food-matcher.ts`](../food-matcher.ts) | embedder, cosine similarity, alias lookup, warmup, `normalizeForEmbedding` |
| [`src/api/catalog.ts`](../catalog.ts) | lite-каталог (id/name/categories), auto-regen по mtime |
| [`scripts/gen-food-catalog-lite.ts`](../../../scripts/gen-food-catalog-lite.ts) | генератор `data/food-catalog-lite.json` из seed |
| [`scripts/gen-food-embeddings.ts`](../../../scripts/gen-food-embeddings.ts) | генератор `data/food-embeddings.json` (одна запись на продукт) |
| [`scripts/probe-matcher.ts`](../../../scripts/probe-matcher.ts) | локальный probe matcher (top-3 для 21 односложного запроса) |
| [`scripts/probe-parse.ts`](../../../scripts/probe-parse.ts) | E2E-probe полного `/parse` на 15 голосовых фразах через HTTP |
| [`data/food-aliases.json`](../../../data/food-aliases.json) | точные алиасы (exact-match нормализованной строки до embedding) |

### Эндпоинт

**`POST /api/free-text-food/parse`**

```jsonc
// Request
{ "text": "на завтрак овсянку с бананом, в обед борщ", "existingDishNames": [] }

// Response
{
  "resolved":   [{ "productId", "name", "originalName", "quantity", "time", "confidence" }],
  "ambiguous":  [{ "originalName", "quantity", "time", "candidates": [{id,name,score}×3] }],
  "unresolved": [{ "originalName", "quantity", "time" }]
}
```

`existingDishNames` принимается для forward-совместимости с Full-фазой, но в MVP игнорируется.

### HTTP-коды ошибок

| Код | Причина | Когда возникает |
|---|---|---|
| 400 | `text is required` / `text too long (max 2000 chars)` | Пустой body, не-строка, пустая строка после trim, или длина > 2000 |
| 429 | `Rate limit exceeded. Max 30 requests per hour.` | Per-IP (`req.ip`) лимит 30/ч |
| 500 | сообщение ошибки | Упал вызов LLM, невалидный JSON от LLM, любая неперехваченная ошибка pipeline |
| 503 | `Food matcher is still initializing…` | `initMatcher()` ещё не завершился (embedder поднимается ~1–3 сек после старта) |

Frontend должен уметь: на 503 — показать «попробуйте через пару секунд», на 429 — явный toaster, на 500 — общий fallback с текстом ошибки (уже из `error.message` API).

### Pipeline (текущая MVP-логика)

1. Валидация request + rate-limit (30/ч/IP) + `isMatcherReady()` (503 пока embedder не поднялся).
2. **LLM cache** — `sha1(text.trim().toLowerCase())` → `{items, expiresAt}`, TTL 10 мин, max 200 записей (FIFO eviction по insertion order).
3. Если cache miss — `callLLM` через OpenRouter (`SUGGESTION_MODEL`, JSON response mode). Промпт компактный, каталог в него не попадает.
4. **Quantity fallback** — если LLM вернул `quantity ≤ 0` или не число, подставляем 100г. Item **не** отбрасывается.
5. **Time defaults** — см. раздел ниже.
6. Для каждого item:
   - `lookupAlias` → если exact-match алиаса, сразу resolved (score=1).
   - Иначе `matchOne` (embedding + top-K cosine).
   - **Resolved:** `top1.score ≥ 0.80 AND (top1.score − top2.score) ≥ 0.02`.
   - **Ambiguous:** `top1.score ≥ 0.80` (но margin-check не прошёл).
   - **Unresolved:** иначе.

Margin-first: scores для русского на e5-small лежат в узком диапазоне **0.83–0.91** — абсолютный порог ненадёжен (правильные top-1 вроде «сметана»=0.853 оказываются на грани). Primary-сигнал — насколько top-1 оторвался от top-2; абсолютный floor 0.80 остаётся только как защита от мусорных матчей. Если top-2 почти догоняет top-1, item помечается как ambiguous даже при score=0.89.

### Time defaults

LLM должен выводить время из контекста («утром»→08:00, «на обед»→13:00, «полдник»→16:00, «вечером»→19:00). Если LLM вернул `null`, применяется `fillDefaultTimes`:

- Идёт слева направо по items.
- Для item с валидным временем от LLM — ставит его и **сдвигает курсор слотов** вперёд через все дефолтные слоты ≤ этого времени.
- Для item без времени — берёт текущий дефолтный слот и сдвигает курсор на следующий (с clamp на последнем слоте).

Примеры:

| Вход (LLM times) | Результат |
|---|---|
| `[null, null, null]` | `08:00, 13:00, 16:00` |
| `[null, null, null, null, null]` | `08:00, 13:00, 16:00, 19:00, 19:00` (clamp) |
| `[10:00, null, null]` | `10:00, 13:00, 16:00` (курсор прыгнул через 08:00) |
| `[null, 15:00, null]` | `08:00, 15:00, 19:00` (после 15:00 курсор на 19:00) |

### Составные блюда и unresolved

В `seed/combined-foods-final.json` **отсутствуют** составные блюда (борщ, суп, смузи, запеканка, плов, пицца, пельмени, котлета, филе). В MVP-промпт намеренно зашито «даже борщ считай как product» — это значит, что такие элементы пройдут через product-путь, не найдут матча и попадут в `unresolved`. Оттуда их подхватит UI-флоу «Найти вручную». Это ожидаемое поведение, не баг — полноценный `type: dish` + ингредиенты будут в Full-фазе.

### Алиасы

`data/food-aliases.json` — формат `{ "ключ": "productId", ... }`. Ключ — результат `normalizeForEmbedding` (lowercase + удаление `.,!?;:()"'«»`), приведённый к lower-case; без лемматизации и морфологии. Ключи, начинающиеся с `_`, игнорируются — их можно использовать как inline-комментарии. Ссылки на несуществующие `productId` логируются с warning и пропускаются при загрузке.

Пример:

```json
{
  "_comment": "Короткие уменьшительные формы, которые e5-small путает",
  "картошка": "product-id-potato",
  "творожок": "product-id-cottage-cheese"
}
```

Расширять по логам `free-text-food/parse` unresolved/ambiguous-выборов.

### Калибровка

Пороговые значения подобраны по двум probe:

- [`scripts/probe-matcher.ts`](../../../scripts/probe-matcher.ts) — односложные запросы (21 шт.), калибровка matcher.
- [`scripts/probe-parse.ts`](../../../scripts/probe-parse.ts) — полные голосовые фразы (15 шт.) через HTTP, калибровка всего pipeline.

Критерий успеха: ≥70% items в resolved, ≤15% в unresolved (без учёта заведомо составных блюд). При изменении порогов (`SCORE_FLOOR`, `AUTO_ACCEPT_MARGIN`) **обязательно** перегонять `probe-parse.ts` и фиксировать актуальные числа в [`free-text-food-progress.md`](../../../../food-calc/tds/free-text-food-progress.md). Запускать после старта сервера:

```bash
npx tsx scripts/probe-parse.ts
```

### Workflow при изменении каталога

Если правится `seed/combined-foods-final.json`:

1. `npx tsx scripts/gen-food-catalog-lite.ts` — перегенерирует `data/food-catalog-lite.json`.
2. При старте сервера `initMatcher()` сам проверит `shouldRegenerate()` по mtime и перегенерирует `data/food-embeddings.json`, если seed новее. Ручной вызов: `npx tsx scripts/gen-food-embeddings.ts`.
3. Рестарт backend.
4. Прогнать `probe-parse.ts` — пороги могли поплыть после добавления новых продуктов в узкое эмбеддинг-пространство.
5. Проверить `food-aliases.json` — упавшие `productId` залогируются при загрузке, их нужно поправить.

## Frontend

### Файлы

Все в `apps/food-calc/src/features/daySchedule/free-text-food/`:

| Файл | Назначение |
|---|---|
| `api.ts` | `parseFreeTextFood(text, signal)` + типы `ResolvedItem/AmbiguousItem/UnresolvedItem/ParseResponse/MatchCandidate` |
| `FreeTextFoodModal.tsx` | Основная модалка — 3 шага: `input` → `loading` → `result` |
| `FreeTextFoodModal.module.scss` | Стили модалки |
| `openFreeTextFoodSearch.tsx` | Обёртка `SearchFood` через `modalStore.show` — escape hatch для unresolved |
| `index.ts` | Публичные экспорты |

Триггер: кнопка «Рассказать, что ел» в `TopBar` виджета `FoodSchedule` ([FoodSchedule.tsx:240](../../../../food-calc/src/widgets/FoodSchedule/FoodSchedule.tsx#L240)) → `modalStore.show(FreeTextFoodModal, { date })`.

### UX-решения

- **Input → Loading → Result.** `AbortController` отменяет клиентский fetch; `signal.aborted` возвращает экран в `input`. LLM на бэке продолжит выполняться — это явно написано на loading-экране: «Отмена прекратит ожидание, но расчёт на сервере продолжится».
- **Ambiguous секция compact-by-default.** По умолчанию top-1 уже принят и отображается как resolved-карточка с маленьким значком «?». Tap раскрывает chooser top-3 + кнопка «Ничего из предложенного». Без radio-групп в обычном виде — мобильный экран не захламляется.
- **Unresolved escape hatch.** У каждого unresolved item — кнопка «Найти вручную», которая открывает `SearchFood` поверх с `initialSearchQuery = originalName`. Выбранный продукт кладётся в список «добавить в расписание». Без этого unresolved превращается в молчаливую потерю.
- **Submit guard.** `isSubmitting` защищает от двойного тапа. Все принятые items коммитятся одним атомарным `store.commit(...events.scheduleFoodCreated[])` через `safeMutate` (см. [`@/shared/lib/safeMutate`](../../../../food-calc/src/shared/lib/safeMutate.ts)).
- **Error handling.** Ошибки fetch показываются inline в input-шаге (не toaster), ошибки коммита — через общий `toaster` из `shared/lib/toaster`. Если parse вернул полностью пустой результат — отдельный empty-state с кнопкой «Попробовать снова».

### Cross-layer contract

Единственная точка контракта frontend↔backend — `parseFreeTextFood(text, signal)` из `api.ts`. Типы `ResolvedItem / AmbiguousItem / UnresolvedItem / ParseResponse` зеркалят серверные интерфейсы в `free-text-food.ts`. При изменении формы ответа править обе стороны одновременно.

## Локальный запуск

```bash
# Backend
cd apps/disher-backend-3.0
export OPENROUTER_API_KEY=sk-or-...        # обязательно
# export SUGGESTION_MODEL=deepseek/deepseek-chat   # опционально
npx tsx src/api/server.ts
# дождаться "Matcher ready: N vectors loaded."

# Smoke test (bash/curl, UTF-8 file для кириллицы)
echo '{"text":"съел овсянку 200 грамм и банан"}' > /tmp/payload.json
curl -X POST http://localhost:3100/api/free-text-food/parse \
  -H "Content-Type: application/json; charset=utf-8" \
  --data-binary @/tmp/payload.json

# E2E probe
npx tsx scripts/probe-parse.ts

# Frontend
cd ../food-calc
npm run dev-network   # HTTPS обязателен для LiveStore
# в браузере открыть расписание → «Рассказать, что ел»
```

## Production concerns

- **In-memory LLM cache.** Живёт в процессе, не шарится между инстансами. При нескольких репликах cache-hit rate ≈ `1/N`. Для прода с несколькими инстансами — перенести в Redis или принять деградацию.
- **In-memory rate-limit.** Та же картина: per-инстанс Map, после рестарта счётчики сбрасываются. Атака по нескольким репликам обойдёт лимит. Для прода — Redis-бэкенд или reverse-proxy уровень.
- **`req.ip` доверие.** Fastify берёт IP из соединения. За обратным прокси (nginx/CF) нужно включить `trustProxy` в конфиге Fastify и убедиться, что X-Forwarded-For корректно пропускается — иначе все запросы схлопнутся на IP прокси и один клиент выест лимит за всех.
- **`AbortController` не отменяет работу на OpenRouter.** Расчёт на сервере продолжится и токены спишутся. Защита — rate-limit 30/ч/IP.
- **LLM failure mode.** Если LLM вернул невалидный JSON или пустой ответ — вся партия уходит в 500. Нет graceful fallback «не распознал → пустой результат».

## Ключевые ограничения и дальнейшие шаги

- **MVP = products only.** LLM-промпт запрещает `type: dish`. Full-фаза (матчинг существующих блюд + создание новых из ингредиентов) — в плане, ещё не реализована.
- **Модель `multilingual-e5-small` на русском даёт scores 0.83–0.91.** Абсолютный порог ненадёжен — поэтому margin-check. Если качество окажется недостаточным, план рекомендует попробовать `e5-base` (280MB, 768 dim) или лемматизацию перед embedding.
- **Каталог ~739 продуктов без составных блюд.** Расширение каталога или Full-фаза — отдельные задачи.
