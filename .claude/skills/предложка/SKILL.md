---
description: Завести dev-страницу «предложку» — отдельный standalone-роут /suggestion_<id> с живыми вариантами компонентов рядом, и отдать ссылку в чат. Решение принимается по картинке, а не по описанию.
---

# /предложка — живое превью предложения на отдельном роуте

Идея: когда юзер просит «покажи мысли на роуте» / «вынеси варианты в предложку»,
не описывать варианты текстом, а собрать их ЖИВЫМИ рядом на отдельной dev-странице
и кинуть ссылку. Юзер тыкает, решает по картинке.

Механизм уже стоит (НЕ переделывать каждый раз):

- Обвязка `apps/food-calc/src/app/development-features/` — `DevShell.tsx`
  (standalone, ВНЕ AuthGate/sync: глобальный CSS + шрифты + app-тон `mono`) и
  `devRoutes.tsx` (автодискавери папок `s_*/index.tsx` через `import.meta.glob`).
- В `router.tsx` подключён `devRoute` как top-level sibling `<App>`. Не трогать.
- Папки `s_*/` в `.gitignore` (эфемерны) — роутер/реестр руками НЕ правим.
- Дев-сервер: `https://localhost:5173` (`npm run dev` / `dev-local`, порт 5173).

## Когда вызвана

1. **Понять предложение.** Что за вопрос/развилка? Какие реальные компоненты
   затронуты? Если неясно — спросить 1-2 вопроса по-человечески (см. память
   `feedback_ask_questions_plainly`). НЕ выдумывать варианты на пустом месте.

2. **Сгенерировать короткий id** (8 hex), напр. через
   `node -e "console.log(require('crypto').randomBytes(4).toString('hex'))"`.

3. **Создать папку** `apps/food-calc/src/app/development-features/s_<id>/`:
   - `index.tsx` — `export default` компонент + `export const meta = { path:
     '/suggestion_<id>', title, question?, date? }`. Путь ОБЯЗАТЕЛЬНО
     `/suggestion_<id>` (подчёркивание — RR v7 не умеет параметр внутри сегмента,
     поэтому это литеральный путь целиком). `question` (суть «в чём вопрос») и
     `date` (YYYY-MM-DD) показываются в индексе `/dev-suggestions`.

4. **Собрать из закреплённой обвязки** `../SuggestionLayout` — НЕ верстать руками:
   `SuggestionPage` → `SuggestionHeader{title,lead}` → `OptionGrid` с
   `OptionCard{label,title,caption,changes[],recommended?}` (внутри — живое
   превью) → `Verdict`. Обвязка на токенах, адаптивна, поддерживает подсветку
   `?pick=<label>` (юзер кидает выбор через URL — читаю без чата; в самой
   предложке доступен `usePickedOption()`).

5. **Правила наполнения (hard-rules):**
   - **Верность.** Превью импортит НАСТОЯЩИЕ компоненты/стили проекта и рендерит
     их ИХ классами (образец — `pages/suggestion/SuggestionPage.tsx`: тащит
     `NutrientPickerDrawer.module.scss`, `NutrientRow`, `Chip`). НЕ переизобретать
     копии, НЕ лепить inline сырые `#hex`/`px` — только токены (см. память
     `feedback_verify_tokens_before_use`).
   - **≥3 направления.** Не робкие 2 варианта, а 3-5 ЧЕСТНО различных направлений
     (доктрина Stitch Vibe Design: «explore broadly before committing»). Если
     развилка бинарна — всё равно дать третий угол (статус-кво / гибрид).
   - Каждый `OptionCard`: title + 2-4 буллета «что меняется» + живое превью.
     Рекомендованный — `recommended`; в конце `Verdict` с обоснованием.

6. **Проверить** `npm run typecheck` + `npm run lint:style` (фильтровать свой
   файл — в WIP бывают чужие ошибки). Роутер/devRoutes не трогать — glob подхватит.

7. **Отдать ссылку в чат** ровно так:
   `https://localhost:5173/suggestion_<id>` — и одной строкой что там смотреть.
   (Индекс всех предложек: `https://localhost:5173/dev-suggestions`.)

## Чего НЕ делать

- НЕ коммитить папки `s_*/` (эфемерны, в .gitignore) — если только юзер не попросит.
- НЕ править `router.tsx` / `devRoutes.tsx` / `DevShell.tsx` под каждую предложку.
- НЕ описывать варианты только текстом, когда их можно показать живыми.
- По просьбе «почисти старые предложки» — удалить устаревшие папки `s_*/`.
