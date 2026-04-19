# FreeTextFood: WriteFoodButton + страница review (Вариант 1)

## Context

Сегодня free-text ввод живёт отдельной страницей (`/free-text-food/schedule/:date`), доступ через кнопку "Рассказать что ел" в TopBar меню. Проблемы:

1. **Потеря контекста дня** на review — пользователь не видит committed items, может продублировать или ошибиться с временем.
2. **Text — не first-class**: закопан в меню.
3. **Тяжёлый переход**: FoodSchedule → page → commit → navigate back. Для частого использования слишком дорого.

**Цель**: сделать текстовый ввод основным, добавить видимую центральную кнопку `WriteFoodButton` "Описать еду" снизу между существующими FAB. Открытие review — на отдельной странице (как сейчас), но с **sticky `DayContextBar`** сверху, чтобы контекст дня был виден. Парсинг идёт **в фоне** (20-30 секунд), пользователь может свернуть модалку и работать с днём.

**Тот же функционал нужен на `DishBuilderPage`** — пользователь пишет "200г муки, 100г масла, 2 яйца", парсер возвращает items, после review они добавляются в Dish (через `addDishItem`), не в schedule. Поэтому хук, кнопка, модалка, persistence-слой — **переиспользуемые**, target-агностичные. Размещаем в [src/features/food/food-free-text-parse/](src/features/food/food-free-text-parse/) — новой папке (старая `features/daySchedule/free-text-food/` мигрирует туда).

Mobile-first. Offline — first-class.

---

## Почему Вариант 1, а не drawer

Drawer-вариант (Vaul bottom sheet поверх FoodSchedule) был отвергнут:

- **Контекст дня визуально виден, но неинтерактивен** — нельзя пролистать ItemsList или тапнуть existing item. Это визуальный фон, а не работающий контекст. Преимущество "видишь день" — мнимое.
- **ModalByLabel внутри Vaul ломается** (z-index 1000 < 5000 у drawer; `position:fixed` внутри `transform:translateY` контейнера некорректно позиционируется). Пришлось бы форкать `FreeTextFoodReviewItem` и заменять fullscreen-редакторы на inline accordion.
- **Inline accordion-редакторы — деградация UX**: пользователь привык тапать → fullscreen ModalByLabel с большим time picker / qty input / candidates list.
- **Snap points** могли бы спасти идею, но это +сложность и Vaul snap points в проекте ещё не использовали.

Вариант 1 переиспользует `FreeTextFoodFlow` без форков, ModalByLabel-редакторы работают как сейчас.

---

## Reuse-архитектура: `food-free-text-parse` feature

Парсинг идентичен для schedule и dish (один и тот же endpoint `/api/free-text-food/parse`). Различается только **что делать с результатом после commit**:

- **Schedule target**: для каждого resolved item → `addScheduleFood(store, { date, time, ..., productId })`
- **Dish target**: для каждого resolved item → `addDishItem(store, { dishId, quantity, productId })` (без time — Dish не имеет времени)

### Target-абстракция

```typescript
// src/features/food/food-free-text-parse/model/target.ts

type ParseTarget =
  | { kind: 'schedule'; date: string }       // 15-04-2026
  | { kind: 'dish'; dishId: string }

type CommitFn = (
  store: Store,
  resolvedItems: ResolvedItem[],
) => string[]  // returns new entity ids for highlight

const scheduleCommit: CommitFn = (store, items) =>
  items.map(item => addScheduleFood(store, { ... }))

const dishCommit: CommitFn = (store, items) =>
  items.map(item => addDishItem(store, { ... }))
```

### Storage key per target

`sessionStorage` ключ должен учитывать target, иначе parse в Schedule на 15 апр и parse в Dish A конфликтуют.

```
freeTextFood:parseState:schedule:15-04-2026
freeTextFood:parseState:dish:abc123
```

Helper: `getStorageKey(target: ParseTarget): string`.

### UI отличия (минимальные)

| | Schedule | Dish |
|---|---|---|
| Кнопка | "Описать еду" в FAB-row внизу FoodSchedule | "Описать ингредиенты" в action area DishBuilderPage |
| Контекст-бар на review | DayContextBar (items дня + время) | DishContextBar (items dish + название блюда), без time |
| Time field в review items | Виден, редактируемый | Скрыт (Dish не имеет time) |
| Navigate URL | `/free-text-food/schedule/:date` | `/free-text-food/dish/:dishId` |
| Commit handler | scheduleCommit | dishCommit |
| Highlight после commit | По scheduleFoodIds в FoodSchedule | По dishItemIds в DishBuilderPage |

`time` в `ResolvedItem` всегда есть из парсера — для dish-target просто игнорируем при commit.

---

## Архитектура

### Ключевое решение: parse 20-30s, keep-modal-open гибрид

Парсинг долгий. Варианты поведения модалки:

- **Auto-close**: пользователь теряет свой текст из виду, все состояния уезжают в FAB → много состояний у маленькой кнопки, легко промахнуться.
- **Block-modal**: модалка блокирует 30 секунд весь день — пользователь не может ничего делать.
- **Гибрид (выбираем)**: модалка остаётся открытой с inline progress, но её можно "свернуть в фон" → parse продолжается, WriteFoodButton показывает статус. Вернуться в модалку можно через тот же label.

### Flow

```
FoodSchedule
  │
  └─ [ AddButton | WriteFoodButton | AnalyticsButton? ]   ← bottom FAB row
         │
         ▼ (клик по label WriteFoodButton в idle)
  ModalByLabel открыта, textarea, ActionButtons: [Prev: отмена] [Next: отправить]
         │
         ▼ (Next → parse запрос, AbortController, persist в sessionStorage)
  Модалка НЕ закрывается. Внутри — inline progress: textarea становится read-only,
  показываем "Обрабатываем... (это займёт ~20-30 сек)" + spinner.
  ActionButtons меняются: [Prev: Свернуть] [Next: disabled "Ожидаем..."]
         │
         ├─── (пользователь тапает "Свернуть") ────┐
         │                                        │
         │                            Модалка закрывается.
         │                            Parse продолжается в фоне.
         │                            WriteFoodButton: Spinner + "Обрабатываем".
         │                            Клик на WriteFoodButton (в loading) = заново
         │                            открыть ту же модалку со spinner внутри.
         │                                        │
         │                                        ▼
         ▼ (parse готов, модалка открыта) ◄──────┘ (parse готов, модалка закрыта)
  Модалка: textarea read-only, показ "Готово · N items".           WriteFoodButton →
  ActionButtons: [Prev: Отмена] [Next: Перейти к проверке]          "Перейти" + badge (N).
         │                                                          Клик на label снова
         │ (клик Next / "Перейти к проверке")                       открывает модалку в
         │                                                          состоянии "Готово".
         ▼
  navigate(`/free-text-food/schedule/:date`, { state: { parseResult } })
  Модалка закрывается через её собственный input-checkbox blur.
         │
         ▼
  FreeTextFoodFlow рендерит review (skip step 1)
  Сверху — sticky DayContextBar (компактные items дня)
         │
         ▼ (Confirm → commit x N → navigate back)
  FoodSchedule показывает новые items с highlight (3 сек)
  sessionStorage очищается.
```

### Состояния модалки (единая state machine)

Модалка — единое место правды для текущего парса. WriteFoodButton отражает это состояние снаружи.

| Модалка | textarea | ActionButtons | Описание |
|---|---|---|---|
| `idle` | editable | [Отмена] [Отправить] | Пользователь вводит текст |
| `loading` | read-only | [Свернуть] [Ожидаем... (disabled)] | Parse идёт, можно свернуть |
| `ready` | read-only + "Готово · N items" | [Отмена] [Перейти к проверке] | Parse завершён, ждём перехода |
| `error` | editable (сохраняем текст) | [Отмена] [Повторить] | Network fail / timeout |

### Состояния WriteFoodButton (отражение модалки)

| Модалки state | WriteFoodButton | Клик по label |
|---|---|---|
| модалка открыта (любое) | — (скрыта или тот же label что открывал модалку) | N/A |
| закрыта + `idle` | "Описать еду" | Открыть модалку в idle |
| закрыта + `loading` | Spinner + "Обрабатываем" | Открыть модалку в loading |
| закрыта + `ready` | "Перейти" + badge (N) | Открыть модалку в ready ИЛИ сразу navigate (см. ниже) |
| закрыта + `error` | "Повторить" (warn-цвет) | Открыть модалку в error |
| offline (при idle) | "Нет сети" badge, disabled | — |

**Вопрос по `ready`**: клик на WriteFoodButton в `ready` — сразу navigate, или открыть модалку чтобы пользователь увидел "Готово · N items"? Решение: **сразу navigate**. Пользователь уже видел модалку раньше, ему нужно быстро перейти. Модалка в `ready`-состоянии нужна только для кейса "не свернул до готовности" — естественное продолжение flow.

---

## Persistence: sessionStorage + per-date state

Парсинг-state переживает unmount/reload/date-change через `sessionStorage`, ключом по дате.

**Ключ**: `freeTextFood:parseState:${date}` (например `freeTextFood:parseState:15-04-2026`).

**Форма**:
```typescript
type PersistedParseState = {
  date: string;            // '15-04-2026'
  status: 'loading' | 'ready' | 'error';
  inputText: string;       // что пользователь ввёл (для error-retry и для показа в модалке)
  parseResult?: ParseResponse;  // только для ready
  startedAt: number;       // Date.now() — для timeout detection
  requestId: string;       // для корреляции запроса и response при gonzo-race
};
```

**Правила**:

- При submit → write `loading` в storage + start fetch.
- При fetch resolved → verify дата+requestId из storage (мог пользователь отменить / переключить) → write `ready`.
- При fetch error → write `error` с сохранённым inputText.
- При mount FoodSchedule → read storage для текущей даты → restore state. Если `loading` и `startedAt + 60s < now` → принудительно `error` (fetch не переживёт reload, timeout).
- При navigate на review → передаём parseResult через `location.state` AND оставляем в storage. После успешного commit — clear storage для этой даты.
- При явной отмене (Отмена кнопка, date-change с confirm) — clear storage.
- При date-change — просто переключаем "активный ключ", storage для другой даты остаётся.

**Per-date state snapshot**: `useWriteFoodFlow(date)` читает storage по date, показывает соответствующий state. FAB-state на 16 апреля независим от 15 апреля. Это **снимает необходимость confirm-диалогов** при переключении дат — пользователь свободно листает, ready-кнопка появляется на той дате, где результат.

**Limitation**: при reload во время `loading` AbortController теряется, но fetch browser уже cancel'нул (tab reload). На mount мы видим `loading` в storage, stale-timeout (>60s) принудит в `error`, пользователь ретранит. Альтернатива — при mount сразу ставить `error` если `loading` в storage (fetch не мог пережить reload), но даём 60s grace на случай быстрого refresh.

---

## Ключевые файлы

### Создать (общие, target-агностичные — в `features/food/food-free-text-parse/`)

| Путь | Назначение |
|---|---|
| `food-calc/src/shared/lib/hooks/useOnline.ts` | `navigator.onLine` + listeners (shared, не feature-specific) |
| `food-calc/src/features/food/food-free-text-parse/model/target.ts` | `ParseTarget` discriminated union + storage key helper |
| `food-calc/src/features/food/food-free-text-parse/model/parseStateStorage.ts` | get/set/clear по target + JSON schema validation |
| `food-calc/src/features/food/food-free-text-parse/model/useWriteFoodFlow.ts` | Хук: принимает `target: ParseTarget`, state machine, AbortController, persist, timeout |
| `food-calc/src/features/food/food-free-text-parse/api/parseFreeTextFood.ts` | Перенесён из `daySchedule/free-text-food/api.ts` |
| `food-calc/src/features/food/food-free-text-parse/api/commit.ts` | `scheduleCommit`, `dishCommit` — конкретные commit-функции |
| `food-calc/src/features/food/food-free-text-parse/ui/WriteFoodButton.tsx` | FAB-кнопка, target-агностичная (читает state из хука) |
| `food-calc/src/features/food/food-free-text-parse/ui/WriteFoodButton.module.scss` | Стили |
| `food-calc/src/features/food/food-free-text-parse/ui/WriteFoodModal.tsx` | ModalByLabel + динамические ActionButtons. Принимает `target`, label-копи через prop |
| `food-calc/src/features/food/food-free-text-parse/ui/FreeTextFoodReviewItem.tsx` | **Перенесён** из `daySchedule/free-text-food/components/`. Принимает `showTime: boolean` для скрытия time в dish-target |
| `food-calc/src/features/food/food-free-text-parse/index.ts` | Public API: `WriteFoodButton`, `useWriteFoodFlow`, `ParseTarget`, типы |
| `food-calc/src/features/food/food-free-text-parse/telemetry.ts` | **Перенесён** из `daySchedule/free-text-food/` |

### Создать (schedule-specific)

| Путь | Назначение |
|---|---|
| `food-calc/src/pages/free-text-food/components/DayContextBar.tsx` | Sticky-top read-only items дня (schedule-only) |
| `food-calc/src/widgets/FoodSchedule/ScheduleFoodItem/ScheduleFoodItemPreview.tsx` | Компактный read-only item для DayContextBar |

### Создать (dish-specific)

| Путь | Назначение |
|---|---|
| `food-calc/src/pages/free-text-food/components/DishContextBar.tsx` | Sticky-top read-only items dish (название + ингредиенты) |
| `food-calc/src/pages/dish/components/DishItemPreview.tsx` | Компактный read-only dish item для DishContextBar |

### Изменить

| Путь | Что |
|---|---|
| `food-calc/src/widgets/FoodSchedule/FoodSchedule.tsx` | Вставить `<WriteFoodButton target={{ kind: 'schedule', date }} />`; убрать старую "Рассказать что ел" из TopBar |
| `food-calc/src/pages/dish/DishBuilderPage.tsx` | Вставить `<WriteFoodButton target={{ kind: 'dish', dishId }} />` рядом с AddButton |
| `food-calc/src/pages/free-text-food/FreeTextFoodFlow.tsx` | Принять `target: ParseTarget` + `initialParseResult` из `location.state`; commit через `target`-specific функцию; передать `showTime` в ReviewItem |
| `food-calc/src/pages/free-text-food/FreeTextFoodPage.tsx` | Парсить URL для определения target (`/schedule/:date` vs `/dish/:dishId`); прокинуть в Flow |
| `food-calc/src/app/router.tsx` | Добавить роут `/free-text-food/dish/:dishId` рядом с существующим `/free-text-food/schedule/:date` |

### Перенести (миграция папок)

Старая папка `food-calc/src/features/daySchedule/free-text-food/` **удаляется полностью**. Содержимое переезжает:

| Старый путь | Новый путь |
|---|---|
| `daySchedule/free-text-food/api.ts` | `food/food-free-text-parse/api/parseFreeTextFood.ts` |
| `daySchedule/free-text-food/FreeTextFoodModal.tsx` + `.scss` | **Заменяется** на новый `WriteFoodModal.tsx` (с keep-open + state machine) |
| `daySchedule/free-text-food/components/FreeTextFoodReviewItem.tsx` + `.scss` | `food/food-free-text-parse/ui/FreeTextFoodReviewItem.tsx` (+ prop `showTime`) |
| `daySchedule/free-text-food/openFreeTextFoodSearch.tsx` | **Удалить** (старый entry point из TopBar, больше не нужен) |
| `daySchedule/free-text-food/telemetry.ts` | `food/food-free-text-parse/telemetry.ts` |
| `daySchedule/free-text-food/index.ts` | **Удалить**, импорты обновить на новый feature |

Импорты в [src/livestore/seed.ts](src/livestore/seed.ts), router, FreeTextFoodFlow обновляются на `@/features/food/food-free-text-parse`.

### НЕ трогаем

- `ScheduleFoodItem.tsx`, `ScheduleFoodCreateModals.tsx` — без изменений.
- Парсер/matcher API endpoint — без изменений.
- Существующая FreeTextFoodFlow логика review (resolved/ambiguous/unresolved секции) — переиспользуется.

---

## Состояние и lifecycle

### `useWriteFoodFlow(target)` — хук

```typescript
useWriteFoodFlow(target: ParseTarget) → {
  state: 'idle' | 'loading' | 'ready' | 'error',
  parseResult: ParseResponse | null,
  inputText: string,
  submit: (text: string) => void,           // idle → loading
  minimize: () => void,                      // just closes modal, keeps state
  cancel: () => void,                        // any → idle + clear storage + abort
  retry: () => void,                         // error → loading (reuse inputText)
  goToReview: () => void,                    // ready → navigate + keep storage до commit
  clearAfterCommit: () => void,              // called from review after successful commit
}
```

`target` определяет storage key, navigate URL, и (через FreeTextFoodFlow) commit-функцию.

**Internal**: `abortRef`, timer для timeout (35s), sessionStorage sync, requestId для race-protection.

**Переходы (таблица)**:

| From | Event | To | Side effects |
|---|---|---|---|
| `idle` | `submit(text)` | `loading` | new AbortController, new requestId, sessionStorage.set, fetch, start 35s timer |
| `loading` | fetch resolved (requestId match + date match) | `ready` | sessionStorage.set (ready), clear timer |
| `loading` | fetch resolved (mismatch) | — | ignore |
| `loading` | fetch error / timeout 35s / offline | `error` | sessionStorage.set (error), clear timer, abort |
| `loading` | `cancel()` | `idle` | abort, clear storage, clear timer |
| `loading` | `minimize()` | `loading` | модалка закрывается, fetch продолжается |
| `ready` | `goToReview()` | `ready` | navigate (state остаётся `ready` до commit) |
| `ready` | `cancel()` | `idle` | clear storage |
| review commit | `clearAfterCommit()` | `idle` | clear storage for date |
| `error` | `retry()` | `loading` | new AbortController+requestId, keep inputText |
| `error` | `cancel()` | `idle` | clear storage |
| any | date prop меняется | reload from storage[newDate] | abort текущего fetch только если пользователь **физически** сменил дату, НЕ при возврате на ту же дату |

---

## Corner cases

### Date / navigation

| # | Сценарий | Поведение |
|---|---|---|
| 1 | Submit на 15 апреля → смена на 16 апреля во время `loading` | Fetch для 15 продолжается в фоне. FAB на 16 апр — `idle`. При возврате на 15 — FAB покажет `loading` (или `ready`, если успело). **AbortController не отменяется** — parse привязан к дате, а не к viewing-focused дате. Per-date state это поддерживает. |
| 2 | Смена на 16 → submit для 16 → возврат на 15 во время обоих `loading` | Два параллельных fetch, два разных ключа в storage, два разных requestId. Независимы. |
| 3 | `ready` на 15 → смена на 16 → возврат на 15 | FAB на 15 апр — `ready` (persisted). Клик → navigate с parseResult. |
| 4 | Browser back с FoodSchedule во время `loading` | FoodSchedule unmount, хук cleanup → **НЕ аbort**. Только `minimize()`-эквивалент: удаляем timer (нет компонента — некому следить), fetch продолжается в фоне до completion или browser cancel. sessionStorage сохранится. При mount FoodSchedule снова — restore, stale-timeout проверяет. Если fetch успел resolved и записал `ready` — на mount увидим `ready`. |
| 4b | Browser back во время `loading` + tab остался открыт | fetch продолжается (browser не cancel'ит fetch при route change внутри SPA). Результат fetch попытается записаться в storage — OK даже если FoodSchedule unmounted. **Исключение**: React StrictMode dev может double-mount и double-fire; requestId защищает. |
| 5 | Browser back с review без commit | `location.state` потерян (history API NOT сохраняет state при back-forward после unmount в зависимости от браузера — обычно сохраняет, но не гарантия). FAB на FoodSchedule всё ещё `ready` (из storage) → клик → navigate с parseResult из storage (не из history state). **storage — первичный источник**, history state — только для передачи данных туда. |
| 6 | Browser forward после back (без commit) | Работает через storage как в (5). |
| 7 | F5 на FoodSchedule в `idle` | Ничего не теряем. |
| 8 | F5 на FoodSchedule в `loading` | AbortController теряется, browser cancel'ит fetch. На mount: видим `loading` в storage, startedAt < 60s → держим `loading` ещё на grace-window и re-submit с тем же text и новым requestId. startedAt >= 60s → ставим `error`. |
| 9 | F5 на FoodSchedule в `ready` | Restore from storage. parseResult там же. |
| 10 | F5 на review | `location.state` теряется → FreeTextFoodPage видит storage[date] в `ready` → **берёт parseResult из storage** (новая логика в FreeTextFoodPage, не только из location.state) → skip step 1. Это делает storage authoritative, не location.state. |
| 11 | F5 на review с storage в `idle` (очищено) | Fallback: step 1 (textarea ввод). |
| 12 | Открыть второй tab в том же origin во время `loading` | `sessionStorage` **не шарится между табами** (в отличие от localStorage). Во втором табе FAB в `idle`. Двойной submit возможен — два независимых fetch, сервер без дедупликации. Приемлемо (парсинг stateless). |
| 13 | Закрытие tab во время `loading` | Browser cancel'ит fetch. Ничего не коммитится в БД (parse — read-only). |
| 14 | Переключение tab / app в background во время `loading` (iOS) | iOS Safari может suspend'ить fetch после 30-60s background. Timeout 35s на foreground таймере может не сработать корректно (JS timers throttled в background). На resume: видим `loading` с startedAt+now > 35s → force `error`. |
| 15 | Race: parse fail + user уже нажал Cancel | cancel() сработал первым → storage cleared + abort. AbortController вызывает fetch reject. requestId check отсеивает поздний response. |
| 16 | Race: parse success + user уже нажал Cancel | cancel cleared storage → fetch resolved, requestId в storage не найден → ignore. |
| 17 | Пользователь нажал submit, тут же "Свернуть", тут же снова "Описать еду" в idle | idle-клик на кнопку, пока parse loading — label открывает модалку. Модалка читает state из хука = `loading` → показывает spinner (не textarea editable). Пользователь видит "свой же" прогресс. Не может submit'ить второй раз. |
| 18 | Пользователь "Свернул", parse завершился, пользователь открывает модалку | Модалка в `ready`-состоянии: "Готово · N items", ActionButtons [Отмена] [Перейти к проверке]. |
| 19 | Долгий parse > 35s timeout | Force `error` + abort. Toast "Не дождались ответа. Попробуйте ещё раз." Retry с тем же текстом. |
| 20 | Offline → online во время `loading` | AbortController уже fail'нул на offline. State в `error`, показываем retry. |
| 21 | Parse ok, пользователь перешёл на review, но **до** review-страницы URL изменился (back/forward в истории) | parseResult в storage. На review mount — read storage → если ready → render review. |
| 22 | Двойной клик "Перейти к проверке" / быстрые тапы | Idempotent navigate (React Router дедуплицирует одинаковый pathname+state). |
| 23 | commit прошёл на review, но navigate back fail (редкий) | `clearAfterCommit()` вызывается **до** navigate. Storage очищен, FAB на возврате — idle. |
| 24 | **Parallel targets**: submit в Schedule(15-04) → переход на DishBuilder → submit в Dish(abc) → возврат на Schedule(15-04) | Storage keys per-target → независимы. FAB на Schedule показывает свой state, FAB на DishBuilder — свой. |
| 25 | **Dish удалён** во время `loading` для этого dish | На mount DishBuilderPage не существует (id невалидный). При попытке navigate на review с этим dishId — страница показывает 404/empty. Storage остаётся orphan'ом до явной очистки или истечения session. **TODO**: в `clearAfterCommit` добавить cleanup orphan-ключей при mount FreeTextFoodPage если target невалиден. |
| 26 | **Date format в schedule storage key vs dish id**: коллизия | Префикс `schedule:` vs `dish:` снимает риск (см. формат ключа). |
| 27 | **Dish target review**: ambiguous item с `time` в парс-ответе | Парсер всегда возвращает `time` (default `12:00` если не указано). В dish-flow `time` игнорируется при commit (`addDishItem` не принимает time). UI скрывает поле time для dish-target. |

### Специфика transition `loading` → `ready` → кнопка "Перейти"

Этот кусок пользователь выделил. Подробно:

1. `loading` state персистится в storage на старте submit.
2. Fetch resolved → handler проверяет:
   - `sessionStorage.get(date)` существует и имеет тот же `requestId`? (иначе — пользователь отменил/сменил дату → ignore)
   - Текущий `date` в хуке совпадает с `date` ответа? (пользователь листает — не важно, storage per-date)
3. Write `ready` + parseResult в storage.
4. Set React state `ready`.
5. FAB подписан на хук → перерендер → показывает "Перейти" + badge.
6. Если модалка открыта в этот момент — она тоже подписана на хук → показывает "Готово · N items" с [Перейти к проверке].
7. Если модалка закрыта — только FAB обновится.
8. **Edge**: в шаге 2-3 произошёл date change в FoodSchedule. Хук получил новый `date` prop → useEffect trigger → read storage[newDate]. Но **write в storage[oldDate]** всё равно происходит из fetch-handler (handler замкнут на old date через closure). Пользователь на новой дате не увидит изменений, но вернётся на старую — увидит ready.
9. **Edge**: пользователь хочет mock "отменить всё" в `ready` — нужна кнопка. В модалке это [Отмена]. Вне модалки — FAB long-press? Пока не делаем, простой Cancel только через модалку.

---

## DayContextBar

Sticky-top на review-странице. Пользователь видит уже committed items дня.

```
┌─────────────────────────────────────┐
│ Сегодня · 15 апр                    │
│ ─────────────────────────────────── │
│ • 8:00  овсянка 200г                │ ← horizontal scroll если много
│ • 9:00  кофе 250мл                  │
│ • 12:30 борщ 300г                   │
└─────────────────────────────────────┘
```

- `position: sticky; top: 0`.
- Horizontal scroll (chip-row) чтобы не съедать высоту.
- Empty state: одна строка "День пуст".
- Read-only, тап = noop (или expand — отложим).
- Использует `ScheduleFoodItemPreview` (компактный вариант `ScheduleFoodItem`).

---

## Offline UX

`useOnline` hook (`navigator.onLine` + listeners).

- WriteFoodButton offline + idle: "Описать еду" + бейдж "Нет сети", disabled. Клик (через label) → toast "Нужен интернет для обработки текста".
- Переход в offline **во время loading**: AbortController сработает на network error → state `error` → модалка (если открыта) показывает retry, FAB показывает "Повторить".
- `ready` state offline: не блокируем — navigate на review работает локально, commit тоже локальный.

---

## План реализации (шаги)

### Phase 1 — Миграция папки и shared-инфраструктура

1. **Создать структуру** `features/food/food-free-text-parse/` (api/, model/, ui/).
2. **Перенести** `daySchedule/free-text-food/api.ts` → `food-free-text-parse/api/parseFreeTextFood.ts`. Обновить импорты в FreeTextFoodFlow и других местах. Удалить старую папку после.
3. **Перенести** `FreeTextFoodReviewItem` + `telemetry` в новый feature.
4. **useOnline hook** — `shared/lib/hooks/`.

### Phase 2 — Reusable core (target-агностично)

5. **target.ts** — `ParseTarget` union + `getStorageKey(target)` + `getReviewUrl(target)`.
6. **parseStateStorage** — get/set/clear по `ParseTarget`, JSON validation, graceful fallback.
7. **commit.ts** — `scheduleCommit`, `dishCommit`. Возвращают новые ids.
8. **useWriteFoodFlow(target)** — state machine + AbortController + storage sync + timeout 35s. Юнит-тесты: transitions, abort cleanup, timeout, restore from storage, requestId race, **per-target isolation** (parse в schedule:15-04 не мешает parse в dish:abc).
9. **WriteFoodModal** — ModalByLabel + динамические ActionButtons по state. 4 режима (idle/loading/ready/error). Принимает `target` + `placeholder` копи-пропами.
10. **WriteFoodButton** — читает state из хука, отражает. SCSS. Принимает `target` + `label` копи-проп.

### Phase 3 — Schedule integration

11. **FoodSchedule.tsx** — вставить `<WriteFoodButton target={{ kind: 'schedule', date }} label="Описать еду" />`, убрать старую TopBar-кнопку.
12. **DayContextBar + ScheduleFoodItemPreview** — sticky-top, horizontal scroll.
13. **FreeTextFoodFlow** — принять `target` + `initialParseResult`. Skip step 1. Diverge на review-render: показать DayContextBar или DishContextBar по `target.kind`. Передать `showTime={target.kind === 'schedule'}` в ReviewItem.
14. **FreeTextFoodPage** — определить target из URL (`/schedule/:date` vs `/dish/:dishId`), читать parseResult из storage[target] → location.state → step 1.
15. **commit hook в Flow** — вызвать `target.kind === 'schedule' ? scheduleCommit : dishCommit`. После — `clearAfterCommit()` + emit highlight-event.

### Phase 4 — Dish integration

16. **DishItemPreview + DishContextBar** — для dish-target review.
17. **DishBuilderPage** — вставить `<WriteFoodButton target={{ kind: 'dish', dishId }} label="Описать ингредиенты" />` рядом с AddButton. Подписаться на highlight-event для новых dishItems.
18. **Router** — добавить `/free-text-food/dish/:dishId`.

### Phase 5 — Verification

19. **Ручная проверка corner cases** для обоих targets (см. Verification).
20. **Кросс-target test**: одновременно parse в schedule:15-04 и dish:abc — не должны конфликтовать в storage.

---

## Verification

**Ручная (mobile viewport в DevTools)**:

1. Базовый happy path: FAB → модалка → submit → свернуть → FAB показывает loading → parse завершился → FAB "Перейти" → navigate → review + DayContextBar сверху → commit → возврат → highlight.
2. Happy path без сворачивания: submit → ждать в модалке 20-30 сек → модалка сама показывает "Готово" → Перейти к проверке → review → commit.
3. Cancel: submit → Свернуть → открыть модалку снова (FAB клик) → Отмена → FAB idle, storage clear.
4. Date change (кейс #1): submit на 15 → листаю на 16 → FAB idle на 16 → возврат на 15 → FAB loading или ready.
5. Two dates parallel (кейс #2): submit на 15 → листаю на 16 → submit на 16 → возврат на 15 → оба FAB независимые.
6. F5 во время loading с startedAt <60s (кейс #8): submit → F5 → FAB показывает loading grace → re-submit автоматически.
7. F5 во время loading с startedAt >60s: симулировать через ручное изменение startedAt в storage → F5 → FAB error.
8. F5 во время ready (кейс #9): submit → ждать ready → F5 → FAB ready, parseResult восстановлен.
9. F5 на review (кейс #10): ready → navigate → F5 на review URL → review рендерится из storage, не из location.state.
10. F5 на review без storage (кейс #11): ready → commit (storage clear) → назад в истории → F5 → step 1.
11. Browser back с review (кейс #5): ready → navigate на review → back → FAB всё ещё ready → клик → снова review.
12. Timeout 35s (кейс #19): замокать long parse → ждать 35s → FAB error + toast.
13. Offline during loading (кейс #20): submit → DevTools offline → FAB error → online → retry → ok.
14. Быстрое переключение во время loading (кейс #17): submit → свернуть → сразу клик на FAB → модалка открывает loading-вид (не idle).
15. Parse готов пока модалка открыта (кейс #18): submit → не сворачивать → дождаться → модалка сама показывает "Готово".
16. Второй tab (кейс #12): submit в tab A → открыть tab B с тем же URL → tab B FAB idle (sessionStorage per-tab).
17. Deep link `/free-text-food/schedule/15-04-2026` без state/storage: работает как раньше (step 1).
18. **Dish target happy path**: открыть DishBuilderPage → "Описать ингредиенты" → "200г муки, 100г масла, 2 яйца" → submit → ждать ready → Перейти к проверке → DishContextBar показывает текущие ингредиенты dish сверху → Подтвердить → возврат → новые dishItems с highlight.
19. **Parallel parses (кейс #24)**: в Schedule(15-04) submit → не ждать → перейти на Dish(abc) → submit здесь → каждая страница показывает свой FAB-state → завершить оба независимо.
20. **Time field в dish review** (кейс #27): убедиться что для dish-target колонка time скрыта, для schedule — видна.
21. **Deep link `/free-text-food/dish/:dishId`**: прямой переход без state → step 1 (textarea), submit → парсит → review → commit добавляет в правильный dish.

**Юнит-тесты**:
- `useOnline` — mock events.
- `useWriteFoodFlow` — все transitions в таблице, abort cleanup, timeout, stale-restore, requestId race, per-date isolation.
- `parseStateStorage` — roundtrip + malformed JSON recovery.

**Регрессия**:
- Manual mode (AddButton flow) без изменений.
- Старый URL flow (прямой переход на FreeTextFoodPage без parseResult) работает.

---

# Альтернатива: Вариант 3 (drawer) — отложен

Bottom-drawer (Vaul) поверх FoodSchedule с inline accordion-редакторами вместо ModalByLabel. См. "Почему Вариант 1, а не drawer".

**Когда вернуться**: если найдём способ дать интерактивный контекст дня через snap points `[0.5, 0.95]`; или пользователи скажут, что navigation раздражает.

## Файлы, НЕ создаваемые в Варианте 1

- `FreeTextReviewDrawer.tsx`
- `FreeTextFoodReviewItemInDrawer.tsx`
