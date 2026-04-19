План: Упрощение каталога + note в details
Context
Философия: UX > точность нутриентов. Приложение не про точный подсчёт калорий — оно про минимальное трение при вводе. Позже нейросеть будет анализировать дневной рацион и делать выводы.

Текущая проблема: каталог из 716 продуктов содержит множество разновидностей ("Сельдь атлантическая жирная", "Сельдь тихоокеанская нежирная" и т.д.), из-за чего matcher часто попадает в ambiguous (несколько похожих кандидатов с близкими score). Пользователю это не нужно — он сказал "сельдь", значит нужна "Рыба" (или "Сельдь" как абстракция), а уточнения идут в заметку.

Три связанных изменения:

Свести каталог к абстрактным базовым продуктам — убрать дублирующие разновидности
LLM prompt — возвращать name (каноничный базовый) + note (уточняющая часть)
Pipeline — прокидывать note через resolved/ambiguous/unresolved → в scheduleFoods.details
Шаг 1: Промпт для корректировки каталога
Задача: из 716 продуктов составить список "абстрактных" базовых, объединив разновидности. Это ручной/полуавтоматический процесс — нужен промпт для LLM, который поможет принять решения по кластерам.

Промпт для GPT/Claude для анализа каталога:

Ты помогаешь упростить каталог продуктов питания. Цель — оставить только абстрактные базовые продукты, убрав дублирующие разновидности.

Правила объединения:
1. Если разновидности отличаются только жирностью/сортом/способом приготовления/регионом — объединить в один базовый: "Сельдь атлантическая жирная" + "Сельдь тихоокеанская нежирная" → "Сельдь"
2. Если разновидности отличаются по сути (другой вкус, другое использование в кулинарии) — оставить как отдельные: "Лук репка" и "Лук зелёный" — разные продукты
3. Специи — оставить каждую отдельно (корица ≠ куркума), но убрать префикс "Специи, ": "Специи, корица, молотый" → "Корица"
4. Масла — оставить каждое отдельно (оливковое ≠ подсолнечное), убрать слово "Масло" из категории, если оно в названии: "Масло оливковое" — ОК
5. Мука — объединить: "Мука 1 сорта" + "Мука 2 сорта" + "Мука обойная" → "Мука пшеничная". Разные виды муки (кукурузная, гречневая) — отдельно.
6. Нутриенты для объединённого продукта: взять усреднённые значения из разновидностей, или значения самого "базового" варианта (без приставок).
7. Порции: оставить 2-3 каноничные порции (самые частые/универсальные). Остальное — fallback на граммы. Не объединять все порции из разновидностей — UI будет перегружен.
8. ⚠️ Не путать вариации с разными продуктами: "молоко коровье" и "молоко соевое/миндальное" — РАЗНЫЕ продукты (разный состав, разное применение). "Йогурт" и "йогурт сладкий" — тоже разные (сахар меняет нутриентный профиль и поведенческую аналитику). Объединять только когда разница не влияет на кулинарное использование.

Для каждого кластера выведи:
- Исходные названия
- Предлагаемое базовое название  
- Какой ID взять за основу (чей нутриентный профиль ближе к "среднему")
- Уверенность: "точно объединить" / "на усмотрение пользователя"

Вот каталог (JSON): [вставить food-catalog-lite.json]
Выход: список решений по объединению → скрипт применяет их к combined-foods-final.json + перегенерирует embeddings.

## Шаг 1.5: Сохранить маппинг объединений

После применения кластеров, сохранить `disher-backend-3.0/data/catalog-mapping.json` с историей объединений для отладки и будущих целей:

```json
{
  "version": "1.0",
  "generated_at": "2026-04-16",
  "total_merged_clusters": 150,
  "original_count": 716,
  "final_count": 500,
  "merged_clusters": [
    {
      "base_id": 1,
      "base_name": "Сельдь",
      "original_ids": [42, 43, 44],
      "original_names": [
        "Сельдь атлантическая жирная",
        "Сельдь тихоокеанская нежирная",
        "Сельдь (копчённая)"
      ],
      "merged_at": "2026-04-16",
      "nutrients_source": "average"
    },
    {
      "base_id": 100,
      "base_name": "Мука пшеничная",
      "original_ids": [101, 102, 103],
      "original_names": [
        "Мука 1 сорта",
        "Мука 2 сорта",
        "Мука обойная"
      ],
      "merged_at": "2026-04-16",
      "nutrients_source": "id_101"
    }
  ]
}
```

**Назначение:**
- Отладка и верификация процесса объединения
- Возможность восстановить исходные названия продуктов если нужно
- История для будущих обновлений каталога
- Не используется в основном pipeline, только для справки

Кластеры, требующие внимания (из анализа):
Кластер	Текущее кол-во	Ожидаемое	Логика
Специи	35	35 (убрать префикс)	Каждая специя уникальна, просто убрать "Специи, "
Масло	21	15-18	Каждое масло уникально, но убрать дубли
Мука	19	5-7	Пшеничная/гречневая/кукурузная/рисовая/ржаная/овсяная
Рыба	13	8-10	Лосось/минтай/карп — разные; но "рыба, сельдь" = "сельдь"
Лук	9	4-5	Репчатый/зелёный/порей — разные
Перец	9	3-4	Болгарский/острый/халапеньо
Сельдь	6	1	→ "Сельдь"
Картофель	5	1	→ "Картофель"
Молоко	5	2-3	Коровье/соевое/миндальное — разные продукты; жирность — нет
Говядина	7	2-3	Говядина (мясо) / Говядина (субпродукты)
Ожидаемый результат: ~400-500 базовых продуктов вместо 716.

Шаг 2: LLM prompt — добавить поле note
Файл: disher-backend-3.0/src/api/routes/free-text-food.ts

Изменить SYSTEM_PROMPT, добавив поле note:

{
  "items": [
    {
      "type": "product",
      "name": "каноничное базовое название",
      "note": "уточняющая информация или пустая строка",
      "quantity": число_в_граммах,
      "time": "HH:MM" или null
    }
  ]
}
Добавить правила:

- name: всегда в именительном падеже, единственном числе, без уменьшительных форм.
    "селёдочку" → "сельдь", "яблочки" → "яблоко", "картошечку" → "картофель", "курочку" → "курица", "бананчик" → "банан"
- note: всё, что уточняет базовый продукт, но не является его каноничным названием:
    "бурый рис 200г" → name: "рис", note: "бурый"
    "творог 5%" → name: "творог", note: "5%"
    "сельдь солёная" → name: "сельдь", note: "солёная"
    "куриная грудка на гриле" → name: "куриная грудка", note: "на гриле"
    "просто банан" → name: "банан", note: ""
Изменить тип LLMItem:

interface LLMItem {
  type?: "product" | "dish";
  name: string;
  note?: string;      // NEW
  quantity: number | null;
  time: string | null;
}
Шаг 3: Прокинуть note через pipeline в details + staging page

### 3a. Backend (free-text-food.ts)

Добавить note во все response-типы:

```typescript
interface ResolvedItem {
  // ...existing fields...
  note: string;           // NEW
}
interface AmbiguousItem {
  // ...existing fields...
  note: string;           // NEW
}
interface UnresolvedItem {
  // ...existing fields...
  note: string;           // NEW
}
```

В resolveItems() — прокидывать item.note ?? "" в каждый результат.

### 3b. Frontend API & Router

**Frontend API (free-text-food/api.ts)**
- Обновить типы ResolvedItem, AmbiguousItem, UnresolvedItem — добавить note: string

**Router (src/app/router.tsx)**
- Добавить новый маршрут: `/free-text-food/:date` → `FreeTextFoodPage`
- Дата в URL используется для возврата на нужный день после коммита

### 3c. Frontend Page (FreeTextFoodPage.tsx)

**Архитектура:** страница с 3 шагами (как было в модалке, но на отдельной странице):

1. **InputStep** — форма для ввода текста
2. **LoadingStep** — спиннер во время запроса к бэку
3. **ReviewStep** — staging list для review + коммита

**Format hint в InputStep:**

Над полем ввода — одна строка подсказки + многострочный placeholder:

```
Подсказка (текст над полем):
"Продукт вес, через запятую. Время — в начале строки"

Placeholder (серый текст внутри поля):
"8:00 овсянка 200, банан, кофе
13:00 рис 150, курица 200, салат"
```

Принципы:
- Время в начале строки — естественный формат, LLM парсит его в `time: "HH:MM"`
- Вес необязателен (банан без веса — ок, `quantity: null`)
- Многострочный placeholder показывает что можно описать несколько приёмов пищи
- Нет слова "правила", нет модалки с инструкцией — только пример
- Если пользователь напишет свободный текст ("утром поел каши с молоком") — pipeline всё равно справится, hint просто увеличивает % чистых вводов

**Структура ReviewStep:**

```
────────────────────────────────
  Текст для проверки (read-only)
────────────────────────────────

  [← НАЗАД]

  ┌─ 08:30 ─────────────────────┐
  │  Рис [бурый ×]    200 г [×] │
  │  Сельдь [солён ×] 150 г [×] │
  │                              │
  │  12:00                       │
  │  Банан            120 г [×]  │
  │  ⚠ Молоко         250 г [×]  │ ← ambiguous: жёлтая точка
  │                              │
  │  [Добавить 4 items]         │ ← кнопка commit, дизейблена если 0 items
  │                              │
  └──────────────────────────────┘

  [← Undo]  ← временная snackbar при удалении item
```

**Взаимодействие:**

| Элемент | Tap | Результат |
|---------|-----|-----------|
| Время | tap | Редактировать время (раскрывается инлайн TimeChoose) |
| Имя продукта | tap | Заменить продукт через SearchFood modal |
| Количество | tap | Редактировать количество (раскрывается инлайн ProductQuantity) |
| Note chip (×) | tap | Удалить note, остаётся item |
| [×] справа от item | tap | Удалить весь item → undo-snackbar на 3с |
| [← НАЗАД] | tap | Очистить draft, вернуться на `/schedule/{date}` |
| [Добавить N] | tap | Commit: обновить all items.enabled=true в store, перейти на `/schedule/{date}` с success toast |

**Undo механика:**
- При удалении item: скрывается из списка, показывается snackbar "[← Undo] Удалено"
- Tap на Undo за 3 сек → item возвращается в список
- После 3 сек snackbar исчезает, item окончательно удалён

### 3d. UI Item Component (FreeTextFoodReviewItem.tsx)

Переиспользуем паттерн `ScheduleFoodItem`, но добавляем:

```typescript
type FreeTextFoodReviewItemProps = {
  item: ResolvedItem | AmbiguousItem | UnresolvedItem;
  onEditTime?: (item) => void;
  onEditQuantity?: (item) => void;
  onEditFood?: (item) => void;
  onRemoveNote?: () => void;
  onDeleteItem?: () => void;
  isAmbiguous?: boolean;  // визуальный маркер (жёлтая точка)
  isUnresolved?: boolean; // визуальный маркер (красная точка)
};
```

Структура:
```
[●] 08:30 | Рис [бурый ×] | 200 г | [×]
    ├─ ● = жёлтая (ambiguous) или красная (unresolved) или невидимая (resolved)
    ├─ [бурый ×] = removable note chip
    └─ [×] справа = delete item button
```

### 3e. LLM note as disambiguation signal (опционально для шага 4)

При matching, если каталог упрощён и ambiguous всё ещё возникает — note может помочь выбрать кандидата.

Пример: "сельдь солёная" → canonical "сельдь" найдена однозначно, ambiguous исчезает.
Если несколько кандидатов остаются (напр. "молоко" → коровье/соевое) — note ("соевое") может использоваться как дополнительный сигнал для выбора.

Реализация (в resolveItems() после упрощения каталога): если candidates.length > 1, сравнить note с названиями кандидатов и выбрать ближайший по similarity score.

## Файлы для изменения

**Backend:**
- `disher-backend-3.0/src/api/routes/free-text-food.ts` — SYSTEM_PROMPT (добавить note), LLMItem type, response types (ResolvedItem, AmbiguousItem, UnresolvedItem), resolveItems() logic

**Frontend:**
- `food-calc/src/app/router.tsx` — добавить маршрут `/free-text-food/:date`
- `food-calc/src/pages/free-text-food/FreeTextFoodPage.tsx` — новая страница (InputStep → LoadingStep → ReviewStep)
- `food-calc/src/pages/free-text-food/components/FreeTextFoodReviewItem.tsx` — компонент item в ReviewStep
- `food-calc/src/features/daySchedule/free-text-food/api.ts` — обновить типы (добавить note в ResolvedItem, AmbiguousItem, UnresolvedItem)
- `food-calc/src/features/daySchedule/free-text-food/FreeTextFoodModal.tsx` — удалить (или оставить как deprecated, если нужна обратная совместимость)
- `food-calc/src/widgets/FoodSchedule/FoodSchedule.tsx` — изменить кнопку открытия: вместо `modalStore.show(FreeTextFoodModal)` → `navigate(`/free-text-food/${date}`)`

## Порядок выполнения (обновлено 2026-04-16)

План разделён на **три независимых трека** A/B/C. Треки можно выполнять в разных сессиях — они не пересекаются по файлам, что минимизирует контекст и токены.

### Трек A — Фикс probe-matcher baseline (дёшево, быстро)
**Зачем:** разблокировать метрики перед Hybrid. Без корректных `expectedIds` нельзя замерить улучшение.
**Контекст сессии:** только `disher-backend-3.0/scripts/probe-matcher.ts` + `data/food-catalog-lite.json`.

- **A1.** Исправить 12 устаревших `expectedIds` (см. таблицу промахов ниже)
- **A2.** Прогнать `probe-matcher --set=basic --set=tricky --set=oov`
- **A3.** Зафиксировать baseline метрики в этом файле (раздел "Baseline")

**Acceptance:** basic R@1 ≥ 90%, tricky и oov — просто зафиксированы как отправная точка.

---

### Трек B — Доделка FreeTextFoodPage UI (изолирован от matcher)
**Зачем:** 4 недоделанных взаимодействия из первоначального плана.
**Контекст сессии:** только `food-calc/src/pages/free-text-food/`.

- **B1.** Редактирование времени — клик на время раскрывает inline `TimeChoose`
- **B2.** Редактирование названия — клик открывает `SearchFood` modal/drawer
- **B3.** Редактирование количества — клик раскрывает inline `ProductQuantity`
- **B4.** Диалог подтверждения перед удалением item
- **B5.** (опционально) Удалить `features/daySchedule/free-text-food/FreeTextFoodModal.tsx` и обновить экспорты

**Предварительная разведка (одна Read-операция):** проверить, что `TimeChoose`, `ProductQuantity`, `SearchFood` существуют как переиспользуемые компоненты. Если нет — оценка B1–B3 вырастает.

**Acceptance:** пройти чеклист из catalog.md строки 413–435 (проверка каждого пункта в DevTools LiveStore).

---

### Трек C — Hybrid Matcher (дорогой, делать последним)
**Зачем:** закрыть промахи tricky (diminutives, typos, yofication, compounds, предлоги).
**Контекст сессии:** `disher-backend-3.0/src/api/food-matcher.ts` + probe-скрипты.
**Блокирован треком A** (нужен baseline для сравнения).

- **C1.** Нормализация ё→е + lowercase в `normalizeForEmbedding` — 15 мин
- **C2.** **Симуляция до кода.** Написать скрипт `scripts/probe-hybrid-sim.ts`, который на текущем probe-наборе считает Dice trigram similarity для каждого query vs 412 продуктов. Выводит гистограмму top1 scores отдельно для true-positives и false-positives. **Пороги и веса берутся из этой гистограммы**, а не из головы.
- **C3.** Интеграция Dice parallel с cosine, hybrid score с весами из C2
- **C4.** Новые пороги из C2 (вместо текущих 0.85/0.65 как плейсхолдера)
- **C5.** Прогнать probe-matcher. Если tricky R@1 ≥ 80% — стоп, задача закрыта. Если < 80% — перейти к C6.
- **C6.** Levenshtein fallback для ambiguous-зоны
- **C7.** Почистить aliases — убрать diminutives (trigrams их закрывают), оставить только true synonyms (кишмиш→изюм, овсянка→овсяные хлопья)

**Acceptance (заранее зафиксировано):**
- Если tricky R@1 ≥ 80% — merge
- Если tricky R@1 в диапазоне 70–79% — merge + отдельный issue на следующую итерацию
- Если tricky R@1 < 70% — откат, Hybrid не работает, нужен другой подход (возможно — замена embedding модели)

**Что НЕ делаем:**
- Не расширяем aliases до 50+
- Не пишем strip предлогов/прилагательных
- Не меняем embedding модель
- Не делаем stemming / POS-tagging / learned calibration

---

### Трек D — Operational improvements (после стабилизации A–C)
**Зачем:** снять потолок perceived latency и закрыть пробел между metrics и real production feedback. Hybrid matcher (C) оптимизирован под probe-набор, но в проде пользователи делают запросы, которых в probe нет — и сидят по 10-30 секунд в ожидании. Трек D превращает matcher из «чёрного ящика» в самообучающуюся систему.

**Контекст сессий:** каждая задача — отдельная сессия, файлы пересекаются минимально.

- **D1.** **Telemetry для matcher-traffic.** Логировать каждый matchOne call: query, top-1 id, score, bucket (resolved/ambiguous/unresolved), final user choice (если пользователь поменял выбор в review-step).
  - Backend: endpoint `POST /api/matcher-telemetry` + append-only jsonl в `data/matcher-logs/YYYY-MM-DD.jsonl`
  - Frontend: fire-and-forget send при commit из FreeTextFoodPage (не блокирует UX)
  - Acceptance: неделя данных в проде → можно построить confusion matrix из реальных кейсов, не из probe-set
  - **Файлы:** `src/api/routes/matcher-telemetry.ts` (новый), `food-calc/src/features/daySchedule/free-text-food/api.ts` (добавить sendTelemetry)
  - **Зависимость:** нет
  - **Оценка:** ~20k tokens

- **D2.** **Streaming LLM → matcher → UI (SSE).** Сейчас весь pipeline синхронный: LLM 8-15s → matcher 2-5s → render. Пользователь видит spinner ~15-25s. Переделать на SSE: LLM возвращает items по мере парсинга, matcher сразу резолвит, UI добавляет items в список incrementally.
  - Backend: заменить `/api/parse-free-text-food` на SSE-стрим; LLM вызывать со `stream: true`, parsing по мере прихода completed JSON objects в массиве `items`
  - Frontend: `parseFreeTextFood` возвращает AsyncIterable; `FreeTextFoodPage` добавляет items в resolved/ambiguous/unresolved по мере прихода
  - LoadingStep исчезает — review-step показывается сразу после первого item
  - Acceptance: первый item появляется в UI за 2-4 секунды (вместо 15-25); отмена работает (AbortController прерывает SSE)
  - **Риски:** OpenRouter streaming на mistral/llama-моделях иногда ломается на escaped JSON — нужен robust partial-JSON parser (например `partial-json-parser` или incremental parsing через `JSONParser` из stream-json)
  - **Файлы:** `src/api/routes/free-text-food.ts` (SSE refactor), `food-calc/src/features/daySchedule/free-text-food/api.ts` (AsyncIterable), `food-calc/src/pages/free-text-food/FreeTextFoodPage.tsx` (incremental append)
  - **Зависимость:** нет (но лучше после D1 — чтобы мерить real-perceived-latency до и после)
  - **Оценка:** ~60-80k tokens (SSE — нетривиальная работа, нужно правильно handle partial chunks, errors, abort)

- **D3.** **Voice-first UX.** Явная кнопка-микрофон рядом с textarea (Web Speech API), вместо «голос через микрофон на клавиатуре».
  - `InputStep`: кнопка-микрофон справа внутри textarea-shell, tap → `SpeechRecognition.start()`, interim results стримятся в textarea realtime
  - Поддержка: Chrome/Safari/Edge (iOS Safari от 14.5+), Firefox не поддерживает — показывать кнопку только если `'SpeechRecognition' in window || 'webkitSpeechRecognition' in window`
  - Язык: `lang = 'ru-RU'`, continuous = true, interimResults = true
  - UX: во время записи — кнопка красная с pulse-анимацией; tap повторно → стоп; автоматический стоп через 2с тишины
  - Acceptance: на iPhone Safari — сказать «на завтрак овсянка с бананом», текст появляется в textarea, можно нажать «Разобрать»
  - **Файлы:** `food-calc/src/pages/free-text-food/FreeTextFoodPage.tsx` + новый `components/VoiceInputButton.tsx`
  - **Зависимость:** нет
  - **Оценка:** ~25-35k tokens (Web Speech API имеет quirks на iOS — нужна аккуратная error-handling)

**Порядок выполнения:** D1 → (D2 и D3 параллельно в разных сессиях). D1 даёт baseline метрики perceived latency и miss-rate, без которых D2/D3 нельзя честно мерить.

**Что НЕ делаем в треке D:**
- Не строим ML-pipeline для обучения на telemetry (это трек E, если будет). Пока — только сбор данных.
- Не делаем кэш эмбеддингов запросов — это уже попытка оптимизации; сначала надо увидеть распределение из D1, может быть cache-hit rate <20% и оно не стоит инфраструктуры.
- Не делаем weekly LLM-teacher цикл — это тоже ждёт данных D1.

---

### Трек E — Система логирования и telemetry-аналитика

**Зачем:** превратить matcher и LLM-парсер из «чёрных ящиков» в источник данных для улучшения сервиса. Сейчас `matcher-query-log.ts` пишет только top-3 кандидатов и verdict — этого мало для операционных выводов. Нужно логировать всю pipeline-цепочку **и действия пользователя в review-step**, чтобы на выходе отвечать на три вопроса:

1. **Где matcher ошибается?** (нужны правки каталога / aliases / порогов)
2. **Каких продуктов нет в базе?** (кандидаты на добавление через USDA/skurikhin импорт)
3. **Где LLM галлюцинирует?** (нужны правки SYSTEM_PROMPT)

**Контекст сессий:** каждая подзадача — отдельная сессия, файлы пересекаются мало.

#### E1. Расширить структуру matcher-log

**Файл:** `disher-backend-3.0/src/api/matcher-query-log.ts`

Сейчас пишется только `{phrase, originalName, verdict, top, margin}`. Добавить:

```typescript
interface MatcherQueryLogEntry {
  ts: string;
  requestId: string;             // NEW — связать все items одного запроса
  phrase: string;                // весь исходный пользовательский текст
  originalName: string;          // то что LLM вернул в name
  llmNote: string;               // NEW — note от LLM
  llmQuantity: number | null;    // NEW — чтобы ловить "LLM вернул 0, fallback сработал"
  llmTime: string | null;        // NEW — привязка ко времени
  normalizedName: string;        // NEW — после normalizeForEmbedding (ё→е и т.д.)
  verdict: MatchVerdict;
  top: Array<{ id: string; name: string; score: number }>;
  margin: number | null;

  // NEW — score breakdown для Hybrid Matcher:
  scoreBreakdown?: {
    trigram: number;             // Dice coefficient
    cosine: number;              // embedding similarity
    hybrid: number;              // weighted sum
    levenshtein?: number;        // если fallback сработал
  };

  // NEW — alias-hit:
  aliasHit: boolean;             // true если попали в food-aliases.json

  // NEW — environment:
  matcherVersion: string;        // git sha или semver, чтобы сопоставлять метрики с версией
  llmModel: string;              // какой OpenRouter-модел��ю обработали (deepseek-chat, etc.)
}
```

**Acceptance:** jsonl теперь содержит полный audit trail одного pipeline-прохода. Можно ответить на вопрос «почему "яблочко" попало в unresolved» без запуска probe.

#### E2. Telemetry от клиента (review-step actions)

**Файлы:** `disher-backend-3.0/src/api/routes/matcher-telemetry.ts` (новый), `food-calc/src/features/daySchedule/free-text-food/api.ts`

Без логов действий пользователя в review-step мы не знаем, **был ли top-1 правильным**. Сейчас matcher пишет, что вернул, но не знает, согласился ли с этим пользователь.

**Что собираем (fire-and-forget POST из [FreeTextFoodPage.tsx](food-calc/src/pages/free-text-food/FreeTextFoodPage.tsx) при commit):**

```typescript
interface TelemetryEvent {
  requestId: string;           // связь с matcher-log через E1
  userId: string;              // аноним или реальный
  action: 'commit' | 'abandon';
  itemsTotal: number;
  itemsCommitted: number;      // пользователь принял
  itemsDeleted: number;        // удалил из review
  itemsWithEditedFood: number; // клик на FoodName → SearchFood → выбрал другой
  itemsWithEditedTime: number;
  itemsWithEditedQty: number;

  // Per-item actions:
  corrections: Array<{
    originalName: string;       // что LLM вернул
    matcherChoice: string;      // top-1 matcher'а
    userChoice: string | null;  // что пользователь выбрал в итоге (или null если удалил)
    correctionType: 'accepted-top1' | 'switched-ambiguous' | 'manual-search' | 'deleted';
  }>;

  // Perceived latency:
  llmLatencyMs: number;
  matcherLatencyMs: number;
  reviewDurationMs: number;    // сколько времени пользователь редактировал review
}
```

Backend: append-only jsonl в `data/telemetry/YYYY-MM-DD.jsonl`.

**Acceptance:** через неделю сбора можно построить реальную confusion matrix и найти топ-20 queries где `matcherChoice ≠ userChoice` — это и есть roadmap для aliases/каталога.

#### E3. LLM output log

**Файл:** `disher-backend-3.0/src/api/llm-output-log.ts` (новый), модификация `routes/free-text-food.ts`

Помимо matcher-log нужен отдельный `llm-output-YYYY-MM-DD.jsonl`:

```typescript
interface LLMOutputLogEntry {
  ts: string;
  requestId: string;
  model: string;
  phrase: string;
  itemsReturned: LLMItem[];    // полный output LLM
  cached: boolean;             // из llmCache или свежий
  latencyMs: number;
  promptTokens?: number;       // если OpenRouter возвращает
  completionTokens?: number;
  totalCost?: number;          // если OpenRouter возвращает usage.cost
}
```

**Acceptance:** можно построить метрики: % случаев когда LLM вернул пустой array, средний itemCount на запрос, доля cached (→ ROI от кэша), распределение стоимости, самые проблемные запросы (ноль items, но пользователь потом написал снова).

#### E4. Scripts для еженедельного анализа логов

**Файлы:** `disher-backend-3.0/scripts/analyze-logs.ts` (новый набор)

Еженедельный ran, выводит markdown-отчёт в `data/reports/YYYY-WW.md`:

**Секция 1: Качество matcher**
- Топ-20 корректировок (`matcherChoice ≠ userChoice`) — roadmap для aliases и правок каталога
- Распределение verdict: resolved/ambiguous/unresolved с тенденцией неделя-к-неделе
- Accuracy по бакетам score (0.7-0.8 / 0.8-0.9 / 0.9+) — где реально проходит граница confidence
- Stale-alias detector: aliases на которые приходит 0 запросов за месяц (кандидаты на удаление)

**Секция 2: Кандидаты для добавления в базу**
- Топ-30 unresolved queries по частоте — это и есть **продукты, которых нет в базе**
- Группировка через simple clustering (Jaccard на trigrams) — "протеиновый батончик" и "протеиновый батончик 60г" склеиваются
- Для каждого candidate auto-lookup в USDA (через `/search/foods` API) — если найден, показать FDC ID как быструю ссылку на импорт
- Флаг "вероятно не продукт" — если query из нескольких слов и все — прилагательные/состояния ("то что мама приготовила") — отсеиваем

**Секция 3: LLM-паттерны**
- % галлюцинаций (LLM вернул name, которого нет в каталоге и который окажется unresolved) — тренд
- Топ-10 cases где LLM вернул `quantity: 0` — нужна ли правка промпта?
- Распределение itemCount на запрос — часто ли пользователи вводят много items за раз?
- Средняя стоимость запроса в USD — для ROI расчётов

**Секция 4: User behaviour**
- Drop-off rate на каждом шаге (input → loading → review → commit)
- Median time в review-step — если больше 30с, UI не справляется
- % запросов с abandon (пользователь закрыл без commit)
- % пользователей использующих голос vs клавиатуру (если реализован трек D3)

**Зависимости между подзадачами:** E1 → E2 и E3 параллельно → E4 после всех.

**Оценка:**
- E1: ~15k tokens
- E2: ~25k tokens (frontend изменения + backend endpoint + интеграция с matcher-log через requestId)
- E3: ~10k tokens
- E4: ~40k tokens (скрипты анализа — JSON агрегация + USDA API + markdown генерация)

**Что НЕ делаем:**
- Не кладём логи в БД (LiveStore/SQLite) — jsonl проще, ротация легче, анализ — offline скриптами
- Не шлём telemetry в external системы (Mixpanel, PostHog) — данные чувствительные (пищевые привычки), лучше держать у себя
- Не делаем realtime dashboards — weekly reports достаточно для sample size в 100-500 запросов
- Не делаем ML на telemetry — сначала нужны месяцы данных. Пока — только aggregate metrics

---

### Трек F — База данных: абстракция + продвинутый note-pipeline

**Зачем:** трек F — идеологическое продолжение шага 1. Мы свели 716 → 412 продуктов, но картофель и ещё ~30 кластеров остаются с разновидностями. Цель — **каталог чистых абстракций** (~250-300 продуктов), вся вариативность — в `note`.

**Контекст сессий:** `disher-backend-3.0/seed/`, `data/catalog-mapping.json`, `food-calc/src/livestore/seed.ts`, probe-скрипты.

#### F1. Аудит остаточных кластеров

**Задача:** составить исчерпывающий список кластеров, которые всё ещё не сведены к одному абстрактному продукту.

Запустить скрипт `scripts/analyze-catalog-clusters.ts` который группирует по trigram similarity > 0.6 и выводит отчёт:

```
Кластер «картофель» (5 items):
  sk-746 картофель
  2346 картофель молодой
  2347 картофель жареный
  2348 картофель варёный
  2349 картофель запечённый

Предложение: оставить только sk-746, остальные → note ("молодой" | "жареный" | ...)
Разница в нутриентах: жареный +180 kcal, остальные в пределах ±15% → merge safe.
```

Аналогично пройти по: мясо (говядина/свинина/курица — мы уже начали, но не до конца), рыба (лосось остался с разновидностями), творог (жирность), сыр (сорта), хлеб, каши.

**Acceptance:** список ~30-50 кластеров с предложением merge/skip и обоснованием (дельта нутриентов).

#### F2. Применить merge + обновить catalog-mapping

По каждому кластеру из F1:

1. Выбрать канонический `base_id` (чаще всего — самый общий по названию)
2. Занутриенты — average или id-based (как в шаге 1.5)
3. Обновить `data/catalog-mapping.json` (добавить новые merged_clusters)
4. Перегенерить `combined-foods-final.json`, `food-catalog-lite.json`, `food-embeddings.json`
5. Обновить `food-aliases.json` — убрать aliases, которые стали избыточными

**Acceptance:** каталог сокращается до ~250-300 продуктов. Probe-matcher basic R@1 остаётся ≥ 90%.

#### F3. Note-nutrient adjustment (опционально)

**Проблема:** если пользователь сказал "жареный картофель 200г", canonical product — "картофель" (nutrients сырого), но note="жареный" физически означает +180 kcal и +10g жира из масла. Пользователь получит заниженные нутриенты.

**Решение (лёгкое):** добавить статический lookup `data/note-nutrient-modifiers.json`:

```json
{
  "жареный": { "kcal": 1.3, "fat": 1.5 },
  "тушёный": { "kcal": 1.1, "fat": 1.2 },
  "варёный": { "kcal": 1.0 },
  "запечённый": { "kcal": 1.15, "fat": 1.1 },
  "на гриле": { "kcal": 1.05 },
  "5%": { "for": "творог", "kcal": 0.7, "fat": 0.3 }
}
```

При расчёте нутриентов в `shared/lib/nutrients.ts` — если у schedule-food есть `details` (note), применить modifier. Это **приблизительно** (не путать с точным расчётом), но UX > точность (философия проекта).

**Acceptance:** "жареная куриная грудка 200г" даёт +30% kcal относительно сырой — это ближе к реальности, чем текущие нутриенты сырого мяса.

#### F4. UI: отображение note в расписании

Сейчас note попадает в `scheduleFoods.details` (поле `details`). Но [`ScheduleFoodItem`](food-calc/src/widgets/FoodSchedule/ScheduleFoodItem) его не отображает. Нужно:

- Показывать `details` как subtitle или chip под названием продукта
- Если note непустой и есть modifier из F3 — показать индикатор «≈ +30% kcal»
- При открытии деталей (tap на item) — note редактируется (можно убрать или изменить)

**Acceptance:** в расписании видно "Куриная грудка · жареная · ≈+30% ккал".

**Оценка:**
- F1: ~20k tokens (скрипт + ручной аудит)
- F2: ~30k tokens (merge по кластерам + регенерация)
- F3: ~25k tokens (lookup + интеграция в nutrient-calc + tests)
- F4: ~20k tokens (UI изменения)

**Что НЕ делаем:**
- Не пишем динамический modifier-extractor через LLM (LLM уже делит name/note, этого достаточно)
- Не пытаемся учесть масло/соль/приправы "по умолчанию" при жарке — приблизительно не хуже, чем точно-но-ложно
- Не меняем schema scheduleFoods для структурированного note — строка достаточна

---

### Трек G — Переиспользуемость: FreeTextFoodPage → shared flow

**Зачем:** [`FreeTextFoodPage.tsx`](food-calc/src/pages/free-text-food/FreeTextFoodPage.tsx) — идеальная абстракция для "ввод → распознавание → review → commit". Сейчас она жёстко привязана к расписанию (`RouterUrls.Schedule(date)` на коммит, `events.scheduleFoodCreated`). Цель: сделать её переиспользуемой для **добавления в блюдо** (DishItems) и возможно для **массового создания** в других контекстах.

**Контекст сессий:** `food-calc/src/pages/free-text-food/`, `food-calc/src/pages/dish/`, `food-calc/src/app/router.tsx`.

#### G1. Извлечь commit-logic через `mode` prop

**Сейчас:** `handleCommit` хардкодит `events.scheduleFoodCreated`. Рефакторинг:

```typescript
type FreeTextFoodMode =
  | { kind: 'schedule'; date: string }      // текущее поведение
  | { kind: 'dish'; dishId: string }        // новое — добавление в блюдо
  | { kind: 'standalone'; onCommit: (items: CommittedItem[]) => void }; // универсальное

interface FreeTextFoodFlowProps {
  mode: FreeTextFoodMode;
}
```

`handleCommit` диспатчит по `mode.kind`:
- `schedule` → `events.scheduleFoodCreated` + navigate к `Schedule(date)`
- `dish` → `events.dishItemAdded` (или аналогичное событие) + navigate к `Dish(dishId)`
- `standalone` → вызывает `mode.onCommit(items)` и всё

#### G2. Разделить на страницу и hook + flow-компонент

**Трёхслойная декомпозиция:**

```
pages/free-text-food/FreeTextFoodPage.tsx     — тонкий wrapper, читает URL params, строит mode
features/free-text-food/FreeTextFoodFlow.tsx  — UI с 3 шагами (input → loading → review)
features/free-text-food/useFreeTextFood.ts    — hook с state + parse + commit logic
```

Зачем: страница знает про route, flow знает про UI, hook не знает ничего кроме data + LiveStore.

#### G3. Маршруты для разных контекстов

**Новые URL:**
- `/free-text-food/schedule/:date` — было `/free-text-food/:date`, переименовать
- `/free-text-food/dish/:dishId` — добавление в блюдо

Хелперы:
- `RouterUrls.FreeTextFoodSchedule(date)`
- `RouterUrls.FreeTextFoodDish(dishId)`

Обратная совместимость: `/free-text-food/:date` → редирект на `/free-text-food/schedule/:date` (на случай если кто-то держит ссылки).

#### G4. Интеграция в страницу блюда

В [`pages/dish/`](food-calc/src/pages/dish/) — кнопка «Рассказать что в блюде» рядом с существующими способами добавления. Клик → navigate на `/free-text-food/dish/:dishId`.

В review-step show должны отображаться name + qty + **игнорировать** time (для блюд time не применим). Использовать `mode` в FlowComponent для conditional UI.

#### G5. Extract FreeTextFoodReviewItem в shared

[`FreeTextFoodReviewItem.tsx`](food-calc/src/pages/free-text-food/components/FreeTextFoodReviewItem.tsx) — потенциально переиспользуемый паттерн для inline-редактирования item'а в списке (time + food + qty + note chip + delete). Можно перевести в `features/free-text-food/components/` и использовать в других местах, где нужен похожий inline-edit (например, "подтвердить список, созданный по шаблону").

**Оценка:**
- G1: ~20k tokens (refactor commit + types)
- G2: ~30k tokens (декомпозиция + тесты)
- G3: ~10k tokens (routes + helpers + редирект)
- G4: ~25k tokens (UI + интеграция в dish-page)
- G5: ~15k tokens (extract в shared)

**Что НЕ делаем:**
- Не создаём generic "EntityCreationFlow" абстракцию — YAGNI, пока только 2 mode'а
- Не отказываемся от URL-маршрутов в пользу модалок — full-screen flow работает лучше для многошагового процесса (особенно на мобильном)
- Не раскатываем flow на ScheduleEvents (health events) — у них другая логика, другая семантика

---

### Дополнительные идеи (бэклог, не план)

Несколько мыслей, которые не тянут на отдельный трек, но стоит держать в голове:

1. **Быстрое добавление из последних.** После 2-3 недель использования можно построить "топ-10 продуктов этого пользователя за последние 7 дней" → чип-бар над textarea на input-step. Tap на чип → вставка в textarea. Уменьшает typing friction.

2. **Shared dictionary между users (анонимно).** Если multiple users пишут "протеиновый батончик RxBar" и мы нашли его в USDA — добавить в каталог для всех. E4 уже собирает такой список; остаётся цикл auto-import + review.

3. **Повторяющиеся приёмы пищи.** Если пользователь 3 раза подряд вводит "утром овсянка 200 + банан + кофе" — предложить сохранить как "meal template" и добавлять одним тапом. Требует E2 (сбор данных) → затем template detection.

4. **Note как запрос к LLM для нутриентного adjustment (дорогой).** Альтернатива F3: вместо статической таблицы — спрашивать LLM "насколько жареная курица калорийнее сырой?". Хорошо масштабируется, но latency + cost. Оставить до момента когда F3-lookup покроет < 60% случаев.

5. **A/B testing для design variants.** Уже есть useDesignVariants — можно применить к review-step (разные layouts для resolved/ambiguous/unresolved), сохранять выбор в telemetry из E2.

6. **Offline-first для free-text-food.** LiveStore offline, но matcher — сервер. Идея: в offline-режиме кэшировать последние embeddings и делать matching на клиенте (ONNX.js для e5-small, ~40MB модель). Дорого, но решает full-offline UX. Отдельная большая история.

---

## Как взаимодействовать по трекам

**Правила:**
1. Одна сессия = один трек (A, B или C). Не смешивать.
2. В начале сессии — одна фраза: **«Начинаем трек A»** (или B, C). Я прочитаю только нужные файлы, не весь этот план.
3. Внутри трека шаги идут по порядку (A1 → A2 → A3). Я отмечаюсь после каждого шага, жду подтверждения перед следующим.
4. Если в середине трека обнаруживается блокер — остановка, обсуждение, не переключаемся на другой трек «заодно».
5. После закрытия трека — обновить раздел "Статус реализации" (поставить ✅) и зафиксировать метрики.

**Порядок треков:**
1. A → B/C параллельно → C зависит от A → D после C (D1 первым, D2/D3 параллельно)
2. **E (логирование)** параллельно с D — независим, но E2 (telemetry клиента) желательно делать после D1 либо объединить (E2 — это развитие D1). E1 и E3 изолированы от всего остального.
3. **F (база)** независим, можно делать когда угодно; F1 — быстрая аудит-сессия, F2/F3/F4 — по мере необходимости
4. **G (переиспользуемость)** — после B (UI стабилизирован), имеет смысл перед G4 иметь данные из E о том, как реально работает review-step

**Общий roadmap (грубо):**
- A (сделано), B (сделано), C (сделано)
- D1 / E1-E3 — одновременно (сбор данных → основа для всего дальнейшего)
- F1 — аудит каталога (быстро, 1 сессия)
- D2, D3, E4, F2 — параллельно в разных сессиях
- G1-G5 — последовательно, после того как pipeline стабильный
- F3, F4 — опционально, после F2

**Оценка токенов (обновлено):**
- A: ~15–20k | B: ~40–60k | C: ~50–80k
- D1: ~20k | D2: ~60–80k | D3: ~25–35k
- E1: ~15k | E2: ~25k | E3: ~10k | E4: ~40k
- F1: ~20k | F2: ~30k | F3: ~25k | F4: ~20k
- G1: ~20k | G2: ~30k | G3: ~10k | G4: ~25k | G5: ~15k

## Верификация (общий E2E после всех треков)

Ввести "бурый рис 200г, сельдь солёная, творог 5%" → проверить:
1. Загружается страница `/free-text-food/{date}`
2. ReviewStep показывает 3 item с note: "бурый", "солёная", "5%"
3. Tap [×] на note — note исчезает, item остаётся
4. Tap [×] справа от item → диалог подтверждения → Удалить → snackbar "← Undo" на 3с
5. Tap на время/название/количество — раскрываются инлайн-редакторы
6. Tap "Добавить 3" → коммит, переход на `/schedule/{date}`
7. В `scheduleFoods.details` для каждого item записан note
8. Проверить "банан, яйцо" без уточнений → note пустой, details пустой

## Baseline метрик (заполняется в A3)

| Set | R@1 | R@3 | Дата | Коммит |
|-----|-----|-----|------|--------|
| basic | 92.7% → 92.7%+ | 97.8% | 2026-04-16 | pre-C → post-C |
| tricky | 62.6% → 74.7% | 82.4% → 86.8% | 2026-04-16 | pre-C → post-C |
| oov FP | 36.4% → **0.0%** | — | 2026-04-16 | pre-C → post-C |

Tricky per-tag (pre-C → post-C hybrid):
- diminutive 64% → 72%, typo 63% → 88%, plural 70% → 80%, reorder 64% → 82%, yofication 57% → 57% (unchanged after 0.80 override tuning).
- compound/case/reorder-adj кейсы остаются низкими, но они не попадают на matcher в проде — LLM парсер убирает прилагательные состояния и предлоги до вызова matcher (см. routes/free-text-food.ts system prompt). Probe-набор надо разделить тэгом `post-llm:yes/no` в следующей итерации, чтобы мерить правильную метрику.

**Acceptance по треку C:** tricky R@1 74.7% (попадает в диапазон 70–79% → merge + issue на следующую итерацию). Real-matcher-traffic метрики (без compound/case/reorder-adj): значительный прирост, особенно typo (+25 п.п.), OOV-FP обнулён.

Цель после трека C: tricky R@1 ≥ 80%, tricky R@3 ≥ 93%.

---

## Статус реализации (обновлено 2026-04-16)

### ✅ Шаг 1: Корректировка каталога — ГОТОВО

- Каталог консолидирован: **716 → 412 продуктов** (файл `combined-foods-final-v2.json`, теперь основной `combined-foods-final.json`)
- У��раны дубли из разных источников (skurikhin + USDA), объединены разновидности (сельдь × 7 → 1, мука пшеничн��я × 6 → 1, перец болгарский × 4 → 1, картофель × 5 → 1, лук × 5 → 1 и т.д.)
- Убран префикс "Специи, " и "Рыба, ", имена в lowercase
- Каждая специя и витамин остаются отдельной сущностью
- Один источник истины: `disher-backend-3.0/seed/combined-foods-final.json` — копия в `food-calc/public/` для фронтенда
- Старые файлы (`combined-foods-final-v2.json`, `.backup.json`, `consolidated.json`) удалены
- `data/catalog-mapping.json` создан с историей объединений (189 merged clusters, 222 renamed items)
- Скрипт `scripts/consolidate-catalog.js` сохранён для будущих обновлени�� каталога

### ✅ Шаг 1.5: Генерация embeddings — ГОТОВО

- `data/food-embeddings.json` перегенерирован: 412 вектора (Xenova/multilingual-e5-small, 384 dim)
- `data/food-catalog-lite.json` перегенерирован: 412 entries (23 KB)

### ✅ Шаг 2: LLM prompt — поле `note` — ГОТОВО (ранее)

- Обновлен `SYSTEM_PROMPT` с инструкцией о поле `note`
- Добавлено `note: string` в типы `LLMItem`, `ResolvedItem`, `AmbiguousItem`, `UnresolvedItem`
- Обновлена `resolveItems()` — прокидывает `note` через весь pipeline

### ✅ Шаг 3: Frontend FreeTextFoodPage — ГОТОВО (ранее)

- Обновлены API типы (`ResolvedItem.note`, `AmbiguousItem.note`, `UnresolvedItem.note`)
- Маршрут `RouterLinks.FreeTextFood = '/free-text-food/:date'` + `getFreeTextFoodUrl(date)`
- Страница `FreeTextFoodPage.tsx` (InputStep → LoadingStep → ReviewStep)
- Компонент `FreeTextFoodReviewItem.tsx` с note chip, ambiguous/unresolved маркерами, undo механикой
- SCSS модули

### ✅ Интеграция FoodSchedule — ГОТОВО

- В `FoodSchedule.tsx` кнопка "Рассказать, что ел" теперь навигирует на `/free-text-food/:date` вместо `modalStore.show(FreeTextFoodModal)`
- Импорт `useNavigate` + `getFreeTextFoodUrl`
- Старый `FreeTextFoodModal` ещё существует в `features/daySchedule/free-text-food/` — можно удалить

### ✅ Обновление probe-скриптов — ЧАСТИЧНО

- `probe-matcher.ts` — обновлены все `expectedIds` под новые ID каталога v2 (412 продуктов)
- `probe-parse.ts` — обновлены все `expectedIds` под новые ID каталога v2, добавлено поле `note` в типы ответа
- `gen-food-catalog-lite.ts` — перезапущен, output обновлён
- `gen-food-embeddings.ts` — перезапущен, output обновлён
- `probe-coverage.ts`, `mine-queries.ts`, `gen-food-catalog.ts` — не требуют изменений (дженерик)

### 📋 Оставшиеся задачи

#### 1. Дофиксить probe-matcher expectedIds

Первый прогон `probe-matcher --set=basic` показал R@1=86.1%, R@3=90.5% (target: R@1≥85%, R@3≥95%).
Причина: часть ID в тестах не совпадают с реальными ID в v2 каталоге. Нужно:
- Пройтись по промахам и исправить ID (например: `дыня` ожидает `sk-919`, а реальный ID в v2 = `1580`)
- Некоторые продукты изменили ID при объединении (семга → лосось sk-419, нет отдельного ID для семги)
- Прогнать `--set=basic`, `--set=tricky`, `--set=oov` до PASS

**Конкретны�� промахи для исправления:**
| Query | В тесте | Реальный ID в v2 | Причина |
|-------|---------|------------------|---------|
| дыня | sk-919 | 1580 | другой source ID |
| изюм | 654 | sk-900 | другой source ID |
| лук | 2488 | 2488 (ok), но matcher находит sk-741 лук-порей | ambiguous — возможно ожидание слишком строгое |
| укроп | sk-713 | 4721 | другой source ID |
| скумбрия | sk-374 | 7607 | другой source ID |
| йогурт | 3792 | 3772 | typo в тесте (3792 vs 3772) |
| яйцо | 3775 | sk-164 | другой source ID |
| чечевица | 915 | 4908 | другой source ID |
| соя | sk-680 | 1770 | другой source ID |
| миндаль | sk-693 | sk-693 ok, matcher находит молоко миндальное | embeddings proximity |
| фундук | sk-694 | 3069 | другой source ID |
| семга | sk-419 | нет "семга" в v2, только лосось sk-419 | OK — семга=лосось |

#### 2. Запустить probe-parse (e2e)

Требует запущенный dev-сервер + OPENROUTER_API_KEY:
```bash
npm run dev  # дождаться "Matcher ready"
npx tsx scripts/probe-parse.ts
```

#### 3. Тестирование FreeTextFoodPage (ручное) — ⚠️ НЕДОДЕЛАНО

**Статус: НЕПОЛНОЕ ВЫПОЛНЕНИЕ.** Текущая реализация `FreeTextFoodPage.tsx` + `FreeTextFoodReviewItem.tsx` **НЕ СООТВЕТСТВУЕТ** плану.

**Что планировалось (не сделано):**

1. **Редактирование времени** — Клик на время должен раскрывать inline TimeChoose (план, строка 221-222)
   - Текущее: `<span className={styles.time}>{item.time}</span>` (неинтерактивно)
   - Нужно: `<button onClick={...}>` → раскрывается inline TimeChoose

2. **Редактирование названия** — Клик на название должен открывать SearchFood modal (план, строка 222)
   - Текущее: `<FoodName>` без обработчика
   - Нужно: `<button onClick={...}>` → SearchFood modal

3. **Редактирование количества** — Клик на количество должен раскрывать inline ProductQuantity (план, строка 223)
   - Текущее: `<Quantity onClick={() => {}}` (пустой обработчик)
   - Нужно: `onClick={...}` → раскрывается inline ProductQuantity

4. **Окошко подтверждения перед удалением item'а** — (план, строка 224)
   - Текущее: Клик на [×] справа сразу удаляет item → snackbar Undo на 3с
   - Нужно: Клик на [×] → появляется окошко подтверждения (диалог/модал), пользователь подтверждает/отменяет

**Что работает (соответствует плану):**
- ✅ Удаление note chip ([бурый ×]) — note исчезает, item остаётся
- ✅ Undo snackbar на 3с после удаления item'а
- ✅ Back button → возврат на `/schedule/{date}` с очисткой draft
- ✅ Commit → сохранение в расписание с `details: note`

**ПРОВЕРКА ПОСЛЕ ДОРАБОТКИ — ОБЯЗАТЕЛЬНО ДВАЖДЫ ПРОВЕРИТЬ:**

Перед тем как считать задачу ЗАВЕРШЁННОЙ, проверь **ВСЕ** пункты ниже:

1. **Редактирование времени:**
   - [ ] Клик на "08:30" → раскрывается TimeChoose внутри item'а
   - [ ] Выбираешь новое время → item обновляется в списке
   - [ ] Нажимаешь "Добавить 3" → коммит
   - [ ] В БД (`scheduleFoods`) время изменилось (проверь через DevTools LiveStore)

2. **Редактирование названия:**
   - [ ] Клик на "Рис" → открывается SearchFood modal/drawer
   - [ ] Выбираешь другой продукт (напр. "Пшено") → modal закрывается
   - [ ] item обновляется → теперь написано "Пшено", не "Рис"
   - [ ] Нажимаешь "Добавить" → коммит
   - [ ] В БД productId изменился (проверь через DevTools)

3. **Редактирование количества:**
   - [ ] Клик на "200 г" → раскрывается ProductQuantity inline (или modal)
   - [ ] Меняешь на "300 г" → item обновляется в списке
   - [ ] Нажимаешь "Добавить" → коммит
   - [ ] В БД quantity = 300 (проверь через DevTools)

4. **Подтверждение перед удалением:**
   - [ ] Нажимаешь [×] справа от item'а
   - [ ] Появляется диалог/окошко: "Удалить?" или "Вы уверены?" с [Отмена] и [Удалить]
   - [ ] Если нажать "Отмена" → item остаётся в списке
   - [ ] Если нажать "Удалить" → item пропадает, snackbar "← Отменить" на 3с

**Исходные требования (план, строки 220-227):**
```
| Время | tap | Редактировать время (раскрывается инлайн TimeChoose) |
| Имя продукта | tap | Заменить продукт через SearchFood modal |
| Количество | tap | Редактировать количество (раскрывается инлайн ProductQuantity) |
| Note chip (×) | tap | Удалить note, остаётся item |
| [×] справа от item | tap | Удалить весь item → undo-snackbar на 3с |
```

#### 4. Удалить старый FreeTextFoodModal (опционально)

- `food-calc/src/features/daySchedule/free-text-food/FreeTextFoodModal.tsx`
- Обновить `index.ts` экспорт
- Проверить нет ли других ссылок

#### 5. Опционально: LLM note как disambiguation signal (шаг 3e)

Если после консолидации ambiguous всё ещё возникает — использовать note для выбора кандидата в `resolveItems()`. Пример: "молоко соевое" → note "соевое" помогает выбрать из нескольких видов молока.

---

## Архитектура matcher'а и текущие проблемы

### Как работает pipeline (текущий, до рефакторинга)

```
User text → LLM (OpenRouter) → [{name, note, quantity, time}]
                                        ↓
                                  matchOne(name)
                                        ↓
                              1. Alias lookup (exact match → score=1, return)
                              2. normalizeForEmbedding (lowercase, strip punctuation)
                              3. Embed query (Xenova/multilingual-e5-small, 384d)
                              4. Cosine similarity vs 412 pre-computed vectors
                              5. Top-3 candidates
                                        ↓
                              resolveItems() — порог + margin:
                                top1 ≥ 0.8 AND margin ≥ 0.003 → resolved
                                top1 ≥ 0.8 AND margin < 0.003 → ambiguous
                                top1 < 0.8                     → unresolved
```

Aliases — `data/food-aliases.json`, ~18 записей (картошка→sk-746, огурчик→897 и т.д.). Если alias найден — embedding не вызывается.

⚠️ **Этот pipeline будет заменён на Hybrid Matcher** — см. раздел "Новый план" ниже.

### Результаты probe-matcher (2026-04-16, после фикса expectedIds)

| Set | R@1 | R@3 | Статус |
|-----|-----|-----|--------|
| basic (137) | 93.4% | 97.8% | PASS |
| tricky (91) | 59.3% | 86.8% | FAIL (target: 85/95) |
| oov (11) | — | — | PASS (FP=27.3%) |

### Категории промахов в tricky

**1. Diminutives / слэнг (яблочко, бананчик, свеколка, лучок)**
Embedding model не знает русские уменьшительные формы. "яблочко" ближе к "сок яблочный", чем к "яблоко". Сейчас покрыто aliases частично (картошка, огурчик), но 25 diminutive-кейсов — alias на каждый не масштабируется.

**2. Compound queries (куриная грудка, говяжий фарш, хлеб чёрный, творог обезжиренный)**
Embedding модель не выделяет главное слово. "куриная грудка" ≈ "крупа кукурузная" по embedding distance. "хлеб чёрный" → "смородина чёрная". Прилагательное перетягивает вектор.

**3. Typos (кортошка, куринная грудка, йогрут)**
e5-small не толерантен к опечаткам — одна буква смещает вектор сильно.

**4. Yofication (ё↔е: варёное, тушёная, чёрный, топлёное)**
normalizeForEmbedding не заменяет ё→е. Embedding model обрабатывает ё и е как разные токены.

**5. "с/из/без" + продукт (с бананом, из творога, с картошкой)**
Предлоги + падежные окончания сдвигают вектор. "с бананом" → "банановые чипсы" вместо "банан".

### Проблемы текущей архитектуры (ревью, 2026-04-16)

Независимый анализ двух LLM выявил системные проблемы в pipeline:

**1. Margin 0.003 — шум, а не сигнал.** В 384d пространстве e5-small дельта 0.003 — это уровень float precision. Нет стабильной семантической интерпретации. Порог подогнан под тесты, а не под реальное распределение.

**2. Dense-only retrieval нестабилен для коротких строк.** Embedding-модели оптимизированы под предложения/параграфы. Для 1-2 слов ("яблочко", "курочка") cosine similarity — нестабильный сигнал. Для каталога в 412 записей sparse-метрики (trigrams, BM25) дают больше, чем любые embedding-костыли.

**3. Aliases не масштабируются как основная стратегия.** 18 → 50 → 100 — это rule-based system creep. Попытка закрыть дыры слабой модели данных ручными правилами вместо улучшения алгоритма.

**4. Ручная нормализация (strip предлогов, прилагательных) — мини-морфология.** "куриная грудка" сработает, "очень свежая куриная грудка" — сломается. Бесконечная гонка за edge cases.

**5. e5-small "размыта" на 100+ языков.** Не обучена на русских флексиях, уменьшительных формах, коротких noisy запросах. Это корень проблемы, а не симптом.

### Новый план: Hybrid Matcher (dense + sparse)

#### Целевой pipeline

```
query
 ↓
normalize (lowercase, ё→е, trim punctuation)
 ↓
alias lookup (только ~20 true synonyms: кишмиш→изюм, овсянка→овсяные хлопья)
 ↓
parallel:
  trigram similarity (Dice/Sørensen) vs 412 каталожных имён
  embedding cosine (e5-small, как сейчас)
 ↓
hybrid score = 0.6 * trigram + 0.4 * cosine
 ↓
if top1 > 0.85 → resolved
if 0.65–0.85 → ambiguous
if < 0.65 → unresolved
 ↓
fuzzy fallback (Levenshtein ≤ 2) для ambiguous зоны — если есть кандидат с edit distance ≤ 2, поднять его score
```

#### Что меняется vs текущий pipeline

| Было | Стало | Почему |
|------|-------|--------|
| Только cosine similarity | Trigram (primary) + cosine (secondary) | Trigrams ловят морфологию, опечатки, diminutives — всё что ломает embedding |
| Margin 0.003 для ambiguous | Фиксированные пороги без margin (0.85 / 0.65) | Margin в embedding-пространстве не имеет стабильной интерпретации |
| Aliases ~18 → план 50+ | Aliases ~20, только true synonyms | Trigrams автоматически покрывают diminutives и typos |
| Strip предлогов/прилагательных | Только lowercase + ё→е + trim | Ручная морфология не масштабируется, trigrams решают это лучше |
| Embedding-only scoring | Hybrid scoring с весами | Dense ловит семантику (окорок→мясо), sparse ловит написание (яблочко→яблоко) |

#### Что каждое изменение закрывает

| Категория промахов | Текущее решение | Новое решение |
|-------------------|-----------------|---------------|
| Diminutives (яблочко, бананчик) | Aliases (не масштабируется) | Trigram similarity: "яблочко"/"яблоко" имеют ~75% общих триграмм |
| Typos (кортошка, йогрут) | Ничего | Trigrams + Levenshtein fallback |
| Yofication (ё↔е) | Ничего | Нормализация ё→е |
| Compound queries (куриная грудка) | Ничего | Trigrams по подстрокам + embedding как второй сигнал |
| Предлоги (с бананом) | Strip руками | Trigrams игнорируют "с " естественно (малая доля в общих n-граммах) |

#### Библиотеки (JS/TS)

- **Trigram/Dice coefficient**: `string-similarity` (Dice) или `trigram-utils` — мгновенно на 412 записях
- **Levenshtein**: `fastest-levenshtein` — O(n*m) но для коротких строк <1мс
- **Embedding**: оставить `Xenova/multilingual-e5-small` как есть — менять модель дорого, а в hybrid pipeline она играет вспомогательную роль

#### Порядок реализации

1. **Нормализация** (ё→е, trim) — 15 минут, закрывает yofication
2. **Trigram scoring** — добавить Dice coefficient параллельно с cosine, hybrid score — 1-2 часа
3. **Новые пороги** — убрать margin, поставить 0.85/0.65 — 15 минут
4. **Levenshtein fallback** — для ambiguous зоны — 30 минут
5. **Почистить aliases** — убрать diminutives, оставить только true synonyms — 15 минут
6. **Прогнать probe-matcher** — замерить R@1/R@3, подкрутить веса α/β если нужно

#### Что НЕ делаем (и почему)

- **Не расширяем aliases до 50+** — trigrams закрывают эту потребность автоматически
- **Не пишем strip предлогов/прилагательных** — ручная морфология, бесконечные edge cases
- **Не делаем stemming** — для коротких строк trigrams/Levenshtein работают лучше и проще
- **Не делаем keyword extraction для compounds** — требует POS-tagging, хрупко, trigrams решают проще
- **Не меняем embedding модель** — в hybrid pipeline она вспомогательная, ROI от замены низкий
- **Не делаем learned calibration** — недостаточно данных для обучения, фиксированные пороги + probe-тесты достаточны

#### Ожидаемый результат

На основе анализа категорий промахов в tricky (91 кейс):
- Diminutives (~25 кейсов) — закроет trigrams
- Typos (~10 кейсов) — закроет trigrams + Levenshtein
- Yofication (~8 кейсов) — закроет нормализация
- Compounds (~15 кейсов) — частично закроет trigrams
- Предлоги (~10 кейсов) — частично закроет trigrams

Прогноз: R@1 tricky с 59.3% → 80-85%, R@3 tricky с 86.8% → 93-96%