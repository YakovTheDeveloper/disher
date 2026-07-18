# Критика Фазы 3a (OpenAPI/TypeBox) — чистым контекстом, 2026-07-16

Не самоаудит: критику писала сессия, не писавшая код Фазы 3a. Комментарии и план на слово
не принимались — каждое утверждение проверено либо первичным источником, либо прогоном на
реальном `buildApp`.

**Родитель:** `openapi-phase3a-plan.md` (в нём три опровергнутых утверждения — см. §5).
**Эстафета с остатком работы:** `~/.claude/plans/handoff/handoff-2026-07-16-openapi-3a-critique.md`.

---

## 1. Этап 1 — таблица «утверждение → вердикт → первичный источник»

| # | Утверждение (наше) | Вердикт | Первичный источник |
|---|---|---|---|
| 1 | Дефолт Fastify — `coerceTypes: true` | **НЕТОЧНО**: дефолт `coerceTypes: 'array'` — супермножество (вся скалярная коерция + скаляр↔одноэлементный массив) | [`@fastify/ajv-compiler/lib/default-ajv-options.js`](https://github.com/fastify/ajv-compiler/blob/main/lib/default-ajv-options.js) |
| 1 | Коерция переписывает тело до хендлера | **ВЕРНО** — «This option modifies original data»; `"500"`→`500`, **`null`→`0`** | [ajv guide/modifying-data](https://ajv.js.org/guide/modifying-data.html), [coercion.html](https://ajv.js.org/coercion.html) |
| 1 | Выключить `coerceTypes` — норма? | **НАПОЛОВИНУ**: практика документирована Fastify, но санкционированная форма — **per-`httpPart`**, не глобально. Глобальный выключатель — наша самодеятельность | [Fastify V&S — custom validator per httpPart](https://github.com/fastify/fastify/blob/main/docs/Reference/Validation-and-Serialization.md); [fastify#3121](https://github.com/fastify/fastify/issues/3121) → закрыт плагином через [PR#3535](https://github.com/fastify/fastify/pull/3535) |
| 1 | `removeAdditional:true` вырезает лишнее | **ВЕРНО, но уже нашей рамки**: вырезает **только при `additionalProperties: false`**. Голый `Type.Object()` его не эмитит ⇒ не вырезает ничего | [ajv options#removeAdditional](https://ajv.js.org/options.html#removeadditional) + прогон |
| 1 | `allErrors:false` не включать | **ВЕРНО** — danger-callout: «**Do NOT use allErrors in production**» | [ajv.js.org/security](https://ajv.js.org/security.html) |
| 2 | «Схема=ФОРМА, хендлер=границы» — паттерн с именем? | **ИМЕНИ НЕТ, и из источников он НЕ выводится.** json-schema.org называет себя языком для «structure **and constraints**» ⇒ `maxLength`/`minimum` — его прямая работа. OWASP («Syntactic and Semantic Validity») советует валидировать «as early as possible» — скорее ПРОТИВ переноса границ в хендлер | [json-schema.org/overview](https://json-schema.org/overview/what-is-jsonschema); [OWASP Input Validation CS](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html) |
| 2 | Цена: спека не документирует лимиты | **НЕ нарушение.** Нормативного MUST о полноте описания в OAS нет — спека только «formally describes»; при этом `maxLength`/`minimum` в OAS 3.0.3 **выразимы** | [spec.openapis.org](https://spec.openapis.org/oas/v3.0.3.html) |
| 3 | Наш subset + flat `fieldErrors` = RFC 9457 §3.2? | **СООТВЕТСТВУЕТ.** Все члены §3.1 опциональны (слова REQUIRED там нет); §3.2 разрешает **плоские** top-level расширения | [RFC 9457 §3.1/§3.2](https://www.rfc-editor.org/rfc/rfc9457.html) |
| 3 | Мы переизобрели имя? | **НЕЧЕГО ИЗОБРЕТАТЬ**: 7807 показывал `invalid-params:[{name,reason}]`, 9457 **молча** заменил на `errors:[{detail,pointer}]`, оба помечены «fictional problem type», IANA не регистрирует ни одного | [RFC 9457 §3](https://www.rfc-editor.org/rfc/rfc9457.html), [RFC 7807 §3](https://www.rfc-editor.org/rfc/rfc7807.html), [IANA http-problem-types](https://www.iana.org/assignments/http-problem-types/http-problem-types.xhtml) |
| 3 | 400 vs 422 де-факто | **НАШ 400 ЗАЩИТИМ, но это выбор, не очевидность.** За 400: Fastify хардкодит его (`FST_ERR_VALIDATION` в `lib/errors.js`), Spring и DRF — 400, Zalando помечает 422 как `{do-not-use}` («400 already covers most use-cases»). Против: **422 ЕСТЬ в RFC 9110 §15.5.21**, и собственный пример валидационной ошибки в RFC 9457 использует 422. RFC 9110 **удалил** фразу RFC 4918 «thus a 400 is inappropriate» | [RFC 9110 §15.5.1/§15.5.21](https://www.rfc-editor.org/rfc/rfc9110.html); [Zalando](https://opensource.zalando.com/restful-api-guidelines/); [AIP-193](https://google.aip.dev/193) |
| 4 | `response`-схемы СЕРИАЛИЗУЮТ и срезают поля | **ВЕРНО** — но предупреждения в доках Fastify нет вовсе, оно этажом ниже, в `fast-json-stringify`. И это **предохранитель**: «help prevent accidental disclosure of sensitive information» | [fast-json-stringify](https://github.com/fastify/fast-json-stringify); [Fastify V&S](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/) |
| 4 | ⇒ поэтому мы их не завели | **ЛОЖНАЯ ДИЛЕММА.** `transform` у @fastify/swagger работает на генерации доков против ЛОКАЛЬНОЙ переменной `schema`; `route.schema` не мутируется ⇒ ответы документируются **без** сериализации | исходник [`lib/spec/openapi/index.js`](https://github.com/fastify/fastify-swagger) (v9.8.1) |
| 4 | Спека без ответов — годный артефакт? | **НЕТ, и «промолчать» невозможно.** `responses` — **REQUIRED**; Responses Object «MUST contain at least one response code». Вместо молчания @fastify/swagger подставляет ложный `{200:{description:'Default Response'}}` (`resolveResponse`). Codegen на ответ без `content` даёт метод, возвращающий **void** | [spec.openapis.org/oas/v3.0.3](https://spec.openapis.org/oas/v3.0.3.html); [openapi-generator#1490](https://github.com/OpenAPITools/openapi-generator/issues/1490) |
| 5 | Гвард ДО валидации — общепринято? | **ВЕРНО И ПОДТВЕРЖДЕНО.** Lifecycle: `onRequest → preParsing → Parsing → preValidation → Validation → preHandler`. `@fastify/csrf-protection`: «we recommend using an `onRequest` hook». `@fastify/auth`: «Parsing the body can be a potential security risk… use an `onRequest` or `preParsing` hook for authentication» | [Fastify Lifecycle](https://fastify.dev/docs/latest/Reference/Lifecycle/); [csrf-protection](https://github.com/fastify/csrf-protection); [fastify-auth](https://github.com/fastify/fastify-auth) |
| 6 | Shared TypeBox + `Static<>` — стандарт? | **НЕ СТАНДАРТ И НЕ АНТИ-ПАТТЕРН — тема не адресована.** Ни TypeBox, ни type-provider ничего не говорят о шаринге схем между пакетами | [typebox](https://github.com/sinclairzx81/typebox); [type-provider-typebox](https://github.com/fastify/fastify-type-provider-typebox) |
| 6 | Прошли мимо альтернативы? | **ДА, мимо `openapi-typescript`** («Generate TypeScript types from static OpenAPI schemas», zero runtime cost) — она читала бы наш закоммиченный `openapi.json`. tRPC отпадает структурно: не даёт спеку ⇒ Kotlin недостижим | [openapi-ts.dev](https://openapi-ts.dev/); [trpc.io/docs/faq](https://trpc.io/docs/faq) |

**Бонус 2026 (сверх 6 вопросов):** пин `3.0.3` устарел — **3.0.4 (2024-10-24) строго заменяет**
февраль-2020-й документ без изменения требований. Прыгать на 3.1 рано: openapi-generator v7.23.0
(2026-06-08) называет 3.1 «beta support», Fabrikt 27.4.2 едет на 3.0-парсере KaiZen.

---

## 2. Этап 2 — findings, отранжированы по impact

| # | Находка | Impact | Статус |
|---|---|---|---|
| **F1** | Спека утверждает `200`-без-тела на **всех 27** операциях | 🔴 высокий | **НЕ починено** |
| **F2** | `Type.Unknown()` на `amountKop`: обоснование опровергнуто прогоном | 🔴 высокий | ✅ починено |
| **F3** | Тест `user-reports` был зелёным, охраняя фикцию | 🟡 средний | ✅ починено |
| **F4** | `coerceTypes:false` глобально вместо per-httpPart | 🟡 средний | ⛔ закрыт без кода (осознанно) |
| **F5** | `Type.Unknown()` на backup принимает не-объект | 🟡 средний | **НЕ починено** |
| **F6** | `requireUser` на `preHandler` ⇒ 400 вместо 401 анониму | 🟡 средний | ✅ починено |
| **F7** | `charge-routes.test.ts:131` — разошедшийся страж | 🟢 низкий | **НЕ починено** |
| **F8** | Спека документирует `/api/backup/`, SPA ходит на `/api/backup` | 🟢 косметика | не трогали |

### 🔴 F1. Спека утверждает `200` без тела на всех 27 операциях

**Живой путь:** `DELETE /api/backup` реально отдаёт **204**; `GET /health/ready` реально отдаёт
**503**, когда БД лежит (на это смотрит Docker HEALTHCHECK); любая ошибка — `problem+json`.
Спека говорит «200, тела нет» про все три. Проверено: 27/27 операций несут
`"responses":{"200":{"description":"Default Response"}}`, ни одной с `content`.

**Impact:** бьёт ровно в цель фазы. Kotlin-генератор сделает 27 методов с возвратом `Unit`
(проверено: openapi-generator#1490, открыт с 2018) — Android не прочитает ни баланс, ни бэкап,
ни анализ. `problem+json` с `fieldErrors` — то, ради чего написан `92357544` — для второго
клиента **не существует**. «Промолчать» нельзя: `responses` REQUIRED ⇒ вместо молчания ложь.

**Решение (в эстафете):** `transform` у @fastify/swagger — доки без сериализации.

### 🔴 F2. `Type.Unknown()` на `amountKop`: обоснование опровергнуто

Комментарий утверждал: `Type.Integer()` пропустит строковый `"500"` и зачислит деньги.
Прогон на реальном `buildApp`:

```
{amountKop: "500"} + Type.Integer({minimum:1})  ->  400  {amountKop:"must be integer"}
{amountKop: null}  + Type.Integer({minimum:1})  ->  400
{amountKop: 1.5}   + Type.Integer({minimum:1})  ->  400
```

С выключенной коерцией типизированная схема даёт **тот же 400**, что и матрица хендлера.
`Type.Unknown()` не покупал ни грамма защиты, а стоил документации денежного поля (codegen →
`Any?`). Два добивания: посылка «если коерцию вернут» **ничем не охранялась** (теста нет), и
правило применялось непоследовательно — `analyze-dish.ts:55` и `matcher-telemetry.ts:109-117`
спокойно несут `Type.Number()`.

**Починено:** `Type.Integer({minimum:1})` + `Type.String()`; спека документирует деньги типом.

### 🟡 F3. Тест был зелёным, охраняя фикцию

`user-reports.test.ts` «coerces a wrong-typed text to string» ждал `200` и `"123"`. Зелёный —
но только потому, что строил **голый `Fastify()`** без ajv-опций приложения. Под настоящим
`buildApp`: `400`. **Живой путь:** пользователю ничего не ломает (SPA шлёт строки); ломает
следующего человека — комментарий описывал прод-поведение, которого нет.

**Корневая причина шире теста:** тестовая и прод-среда разъехались по ajv. Та же болезнь сидела
под F2 — `admin-routes.test.ts` тоже строил голый Fastify, и типизация `amountKop` уронила бы
«400 matrix» (под голым Fastify `"500"` сколлапсировал бы в `500` и зачислился).

**Починено:** вынесен `src/api/ajv-options.ts`, подключён в `buildApp` и оба теста; тест
переписан в «rejects a wrong-typed text — coerceTypes is off».

### 🟡 F4. `coerceTypes:false` глобально — закрыт без кода

**Живых поломок нет** (проверено): все querystring'и — `Type.String()`, каждый хендлер парсит
сам. Но капкан реален: `querystring: Type.Object({limit: Type.Integer()})` + `?limit=100` → **400**.

**Решение — не чинить, и это осознанно:** (а) сегодня ни один роут не нуждается в
типизированном querystring; (б) `@fastify/ajv-compiler` — транзитивная зависимость, из
приложения не резолвится, `lib/default-ajv-options.js` не в `exports` ⇒ пришлось бы переписать
дефолты Fastify руками, и они тихо разойдутся при апгрейде; (в) `fastify-split-validator` —
10 звёзд, npm-релиз 2025-07-17, без peerDeps. Цена записана честно в `ajv-options.ts`.

### 🟡 F5. `Type.Unknown()` на backup принимает не-объект

```
PUT /api/backup, тело "i am not a diary"                      -> 200, сохранено в jsonb
то же с Type.Object({}, {additionalProperties: true})         -> 400 «must be object»
настоящий дневник через ту же схему -> 200, {products, dishes, unnamedFutureTable} НЕТРОНУТ
```

Страх был реален, но **порождён собственным правилом**, а не `removeAdditional`: Ajv вырезает
только при `additionalProperties: false`. **Impact** низкий (вред себе), но документация даром.
⚠️ `Type.Record` НЕ подходит — эмитит `patternProperties`, невалидный для OAS 3.0.

### 🟡 F6. `requireUser` на `preHandler` ⇒ 400 вместо 401

```
POST /api/user-reports/  trusted origin, БЕЗ куки, битое тело
  ->  400  {"fieldErrors":{"text":"must be string"},"detail":"Invalid body: text must be string"}
```

До схем это был `401`. Ровно тот аргумент, которым `requireTrustedOrigin` подняли на `onRequest`,
дословно применим к `requireUser` — и применён не был. **Impact:** аноним с доверенного origin
перечисляет схемы тел всех роутов; каждый неавторизованный запрос парсит до 5 МБ.

**Починено:** 9 мест переведены на `onRequest`.

### 🟢 F7. Разошедшийся страж

`src/billing/__tests__/charge-routes.test.ts:131` держит `preHandler` с комментарием
«Registered exactly like buildApp» — после F6 неправда.

---

## 3. Что проверено и признано ВЕРНЫМ

Не только дефекты — вот что выдержало проверку:

- **`coerceTypes:false` реально применяется.** Не фикция: прогоны — прямое доказательство.
  Механизм рабочий, спор был только о его форме.
- **Перенос `requireTrustedOrigin` на `onRequest` — правильный и безопасный для preflight.**
  Гвард ретёрнится на `OPTIONS` (`require-origin.ts:29`), а `@fastify/cors` вешает свой
  `onRequest` на корень раньше скоупов. Подтверждается lifecycle-доками и рекомендацией
  `@fastify/csrf-protection`. **Лучшее решение фазы.**
- **`matcher-telemetry` без гварда — НЕ регрессия.** Диф `d6045f7d` подтверждает: гварда не было
  и до фазы. Обоснование (`sendBeacon` не гарантирует Origin) состоятельно.
- **`coerceTypes:false` ничего не сломал молча.** Querystring'и и `user-reports` проверены —
  живых регрессий нет.
- **Отсутствие `maxLength` в спеке — не дефект артефакта.** Нормативного требования полноты нет.
- **400, а не 422 — защитимо** (Fastify/Spring/DRF/Zalando), хотя развилка реальная.
- **RFC 9457-subset + плоский `fieldErrors` — соответствует.** Переизобретения нет.
- **`fieldErrors` как `Record<string,string>` — приемлемо.** Да, при `allErrors:false` там всегда
  одна запись, но форма уже FE-контракт, а стандартного имени/формы не существует. Менять незачем.
- **`allErrors:false` — ровно то, что советует Ajv** (danger-callout).
- **«`maxLength` не стоит НИГДЕ» — правда** (проверено грепом). Поправка плана про `slice` только
  в `user-reports` — тоже правда.
- **`packages/contracts` держит дисциплину «только shape».** Ни парсеров, ни поведения.
  Расползания нет. **Но связь неожиданная:** контракт анализа — это тип ОТВЕТА, и альтернатива
  `openapi-typescript` не смогла бы его сгенерить именно потому, что response-схем нет (F1).
  Пакет существует как обходной путь вокруг F1. Починим F1 — главное обоснование пакета ослабнет.
  Вопрос не «сносить», а «не строить ли второй источник правды рядом с первым».

---

## 4. Развилки, требующие решения юзера

1. **F1 — как чинить?** (а) полный путь: `transform` + описать тела 24 операций → спека годна
   для Kotlin-кодогена; (б) минимум: только реальные коды + `$ref` на problem+json, тела успеха
   отдельным решением. Рекомендация — (б) сейчас, (а) отдельной фазой.
2. **F5 — чинить ли backup?** Даёт документацию и отклоняет мусор, но файл содержит
   незакоммиченные правки юзера.
3. **3.0.3 → 3.0.4?** Бесплатный патч, строго заменяет документ 2020 года. Отдельное мелкое
   решение.
4. **Коммит.** Всё в working tree вперемешку с незакоммиченными правками юзера (фронт +
   `backup.ts`/миграция). Как разделять?
5. **Флак тестов (см. §5 RED FLAGS)** — заводить ли отдельную задачу?
6. **400 → 422** — развилка реальная (RFC 9457 сам использует 422), но менять контракт ради
   красоты дорого. По умолчанию: не трогать.

---

## 5. Что план и память утверждают НЕВЕРНО (правки обязательны)

В `openapi-phase3a-plan.md` и `project_openapi_validation_canon_2026_07_16` записаны как факты:

1. ❌ **«`coerceTypes: true` — дефолт Fastify»** → на самом деле `'array'`.
2. ❌ **«`Type.Integer()` на `amountKop` зачислил бы деньги»** → опровергнуто прогоном (F2).
3. ❌ **«response-схем нет намеренно… Спека описывает вход»** → спека НЕ описывает вход, она
   **врёт про ответы** (F1); `responses` REQUIRED, промолчать нельзя.
4. ⚠️ **«схема=ФОРМА, хендлер=границы» с опорой на индустрию** → имени у паттерна нет, из
   источников он не выводится; держится на локальной опасности, а не на авторитете.
5. ⚠️ **DoD «падения только в baseline-двойке»** → недостоверно, см. RED FLAGS.

## RED FLAGS

1. **Тесты бэкенда флаковые под параллелизмом.** На одном коде: 12 → 7 → **28 падений в 10
   файлах**; с `--no-file-parallelism` — 13 в 3. `balance-read`, `backup`, `auth-cookie-contract`
   в изоляции зелёные. Похоже на контеншен по `TEST_DATABASE_URL`. DoD Фазы 3a держится на
   удачном прогоне.
2. **`auth-cookie-contract.test.ts` — регрессия не исключена.** В изоляции зелёный, в полном
   прогоне падает, до правок не падал. Проверяет конфиг better-auth, которого диф не касается ⇒
   вероятно порядок-зависимое загрязнение. **Против чистого baseline не проверено** (`git stash`
   запрещён) — свежей сессии проверить через `git worktree` на HEAD.
3. **Нарушена граница промпта:** в `backup.ts` («не трогать») изменена одна строка хука — часть
   F6. Правки юзера (`received_at`) целы, диф проверен мной и независимым верификатором.
