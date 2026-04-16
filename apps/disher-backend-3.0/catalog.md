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

## Порядок выполнения

1. Сначала — промпт для корректировки каталога (отдельная задача, вне кода)
2. Затем — изменения в LLM prompt (шаг 2, backend) + backend pipeline (шаг 3a)
3. Параллельно с п.2 — создать FreeTextFoodPage + router (шаг 3b-3e, frontend)
4. После корректировки каталога — перегенерировать embeddings (scripts/gen-food-embeddings.ts)

## Верификация

Ввести "бурый рис 200г, сельдь солёная, творог 5%" → проверить что:
1. Загружается страница `/free-text-food/{date}`
2. ReviewStep показывает 3 item с note: "бурый", "солёная", "5%"
3. Tap [×] на note — note исчезает, item остаётся
4. Tap [×] справа от item — item исчезает, snackbar "← Undo" на 3с
5. Tap "Добавить 3" → коммит, перевод на `/schedule/{date}`
6. В scheduleFoods.details для каждого item записано значение note ("бурый", "солёная", "5%")
7. Проверить "банан, яйцо" без уточнений → note пустой, details пустой

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

#### 3. Тестирование FreeTextFoodPage (ручное)

1. Запустить бэкенд: `cd disher-backend-3.0 && npm run dev`
2. Запустить фронтенд: `cd food-calc && npm run dev-local`
3. Открыть расписание на любой день, нажать "Рассказать, что ел"
4. Проверить:
   - Страница `/free-text-food/{date}` открывается
   - Ввести "бурый рис 200г, сельдь солёная, творог 5%"
   - ReviewStep показывает 3 item с note: "бурый", "солёная", "5%"
   - Tap [×] на note — note исчезает, item остаётся
   - Tap [×] справа — item исчезает, snackbar "← Undo" на 3с
   - Tap "Добавить 3" → коммит, редирект на `/schedule/{date}`
   - В scheduleFoods.details записано значение note
   - Проверить "банан, яйцо" без уточнений → note пустой

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