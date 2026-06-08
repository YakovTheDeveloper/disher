# Биллинг: предоплаченный кошелёк (рубли как поинты) — 2026-06-08

Статус: **ВСЕ ФАЗЫ ГОТОВЫ И ЗЕЛЁНЫЕ.** Backend: 30 billing-тестов (wallet 10 +
charge-routes 16 + balance-read 4) + 6 затронутых роут-сьютов на реальном
Postgres. Frontend: typecheck/eslint/stylelint чисто по затронутым файлам.
Все развилки §10 залочены. Реальный эквайринг (приём денег картой) — будущий
отдельный шаг, в этой работе намеренно не делался (пополнение вручную, §11).

## 0. Контекст и зафиксированные решения

Каждый запрос, который в итоге зовёт OpenRouter, списывает рубли с баланса
пользователя. Поинт = рубль 1:1. Решения из интервью 2026-06-08:

| Развилка | Решение |
| --- | --- |
| Приём денег | **Вручную/админом (MVP).** Строим только механику кошелька + списания. Реальный эквайринг — отдельным шагом позже. |
| Тариф | **Фикс за фичу** (не себестоимость×наценка). |
| Сейчас-анонимные роуты (`free-text parse`, `dish suggestions`) | **Делаем платными** → требуют `requireUser` + списание. Безопасно: регистрация уже обязательна (AuthGate), анонимов нет. |
| Стартовый баланс | **Да, приветственные рубли** (welcome grant). |

Из кода (`20260509120000_zero_base_schema.sql`): **pre-launch, один пользователь,
миграции без backfill.** → welcome-баланс заводим лениво, без сложного сидинга.

## 1. Бытовая модель

Предоплаченный кошелёк, как Steam Wallet / карта «Тройка» / предоплата на симке.
Юзер заранее кладёт рубли, каждый AI-запрос «прокусывает» баланс, на нуле —
«пополни». Не подписка, не постоплата.

## 2. Инварианты (не нарушать)

1. **Деньги — целые копейки (`bigint`), никогда не float.** Отображаем рублями.
2. **Леджер — источник правды, `wallet.balance_kop` — быстрый кэш.** Каждое
   движение денег = строка в `wallet_ledger`.
3. **Уход в минус физически невозможен:** `CHECK (balance_kop >= 0)` + условный
   `UPDATE ... WHERE balance_kop >= :price`.
4. **Атомарность против гонки:** списание — один conditional `UPDATE` с
   row-lock. Параллельные запросы одного юзера сериализуются на строке кошелька.
5. **Идемпотентность:** `request_id` + unique-индекс. Ретрай сети не списывает
   дважды; повторный refund не возвращает дважды.
6. **Сервер — единственный источник правды по балансу.** Клиент только отражает.
7. **Списываем только за реальный вызов OpenRouter.** Cache-hit (у `free-text`/
   `suggestions` уже есть кэш) — бесплатно. Провал до полезного ответа — возврат.

## 3. Данные (новая миграция `2026060812xxxx_wallet.sql`)

Стиль — как в `zero_base_schema.sql` (lower-case, `begin/commit`, `public.`).

```sql
begin;

create table public.wallet (
  user_id     uuid primary key references public.users(id) on delete cascade,
  balance_kop bigint not null default 0 check (balance_kop >= 0),
  updated_at  timestamptz not null default now()
);

create table public.wallet_ledger (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  amount_kop        bigint not null,             -- signed: <0 списание, >0 пополнение/грант/возврат
  balance_after_kop bigint not null,
  kind              text not null check (kind in ('grant','topup','charge','refund')),
  feature           text,                        -- 'daily_analysis' и т.п. для charge/refund
  request_id        text,                        -- идемпотентность (req id клиента / txn провайдера)
  meta              jsonb not null default '{}'::jsonb,  -- диагностика: {model, or_cost_usd}
  created_at        timestamptz not null default now()
);

-- один и тот же (юзер, вид, request_id) не повторяется → защита от двойного charge/refund
create unique index wallet_ledger_idem_idx
  on public.wallet_ledger (user_id, kind, request_id) where request_id is not null;

create index wallet_ledger_user_created_idx
  on public.wallet_ledger (user_id, created_at desc);

commit;
```

`wallet` отдельной таблицей, не колонкой в `users`: `users` принадлежит
better-auth, не пачкаем (и её миграции не конфликтуют). Имя `account` занято
better-auth (OAuth), поэтому `wallet`.

## 4. Прайс (config, server-side) — ЧИСЛА НА ПОДТВЕРЖДЕНИЕ

`src/billing/prices.ts`, единственный источник правды по ценам:

```ts
export const PRICES_KOP = {
  free_text_parse:  50,   // 0.5 ₽  — частый, ядро флоу добавления еды
  dish_suggestions: 50,   // 0.5 ₽
  daily_analysis:   200,  // 2 ₽
  dish_analysis:    200,  // 2 ₽
  long_analysis:    500,  // 5 ₽
} as const;
export type Feature = keyof typeof PRICES_KOP;

export const WELCOME_GRANT_KOP = 5000; // 50 ₽
```

С welcome 50₽ юзер на пробу получает ~100 разборов еды, или ~10 анализов.
DeepSeek дёшев → маржа положительная даже при фиксе. Клиент берёт цены через
`GET /api/billing/prices` (без дублей client/server).

## 5. Модуль кошелька `src/billing/wallet.ts`

Контракт типами, не дисциплиной. Все функции принимают `PoolClient` для работы
внутри транзакции вызова либо берут из пула.

```ts
ensureWallet(userId): Promise<void>
  // INSERT wallet ON CONFLICT DO NOTHING RETURNING;
  // если строка реально вставлена → INSERT wallet_ledger(grant, +WELCOME, request_id='welcome').
  // Идемпотентно: welcome выдаётся ровно один раз на юзера. Закрывает и существующего юзера.

getBalance(userId): Promise<number>            // kopecks
listLedger(userId, limit): Promise<LedgerRow[]>

charge(userId, feature, requestId): Promise<{ balanceKop: number }>
  // throws InsufficientBalanceError (→ 402) если не хватает.
  // Идемпотентно по (userId,'charge',requestId).

refund(userId, feature, requestId): Promise<void>
  // Возврат price назад. Идемпотентно по (userId,'refund',requestId). No-op если charge не было.

grant(userId, amountKop, reason): Promise<void> // админский/промо +баланс, kind='grant'
```

### `charge` — точный порядок (в одной транзакции)

```
BEGIN;
-- 1. идемпотентность: уже списывали этот request_id?
SELECT balance_after_kop FROM wallet_ledger
  WHERE user_id=:u AND kind='charge' AND request_id=:r;
   -> если найдено: COMMIT, вернуть как успех (НЕ списывать второй раз).
-- 2. атомарное условное списание (берёт row-lock на wallet)
UPDATE wallet SET balance_kop = balance_kop - :price, updated_at = now()
  WHERE user_id=:u AND balance_kop >= :price
  RETURNING balance_kop;
   -> если 0 строк: ROLLBACK, throw InsufficientBalanceError (→ 402).
-- 3. журналируем
INSERT INTO wallet_ledger(user_id,amount_kop,balance_after_kop,kind,feature,request_id)
  VALUES (:u, -:price, :newBalance, 'charge', :feature, :r);
   -> если unique violation (гонка двух идентичных req): ROLLBACK, перечитать и вернуть идемпотентно.
COMMIT;
```

Шаг 2 сериализует параллельные запросы одного юзера (lock на строке), шаг 1+unique
закрывают двойное списание на ретрае.

## 6. Поток по каждому эндпоинту

`requireUser` (есть) даёт `req.userId`. `requestId` — клиент шлёт в body/заголовке
`X-Request-Id` (uuid на попытку); сервер при отсутствии генерит свой.

| Эндпоинт | Когда списываем | Возврат |
| --- | --- | --- |
| `POST /free-text-food/parse` (JSON, +кэш) | cache-hit → **бесплатно**; cache-miss → `charge` перед вызовом OpenRouter | в `catch` вокруг fetch → `refund` |
| `POST /suggestions/dish-products` (JSON, +кэш) | то же | то же |
| `POST /analyze-dish` (SSE) | `charge` **до** `writeHead(200)` | refund, если упало до первого контент-чанка (`producedOutput=false`) |
| `POST /analyze/daily` (SSE) | то же | то же |
| `POST /analyze` (фоновая джоба) | `charge` на kickoff | `refund` внутри `updateAnalysisFailed` |

Эти два сейчас анонимные — добавляем `requireUser` preHandler (анонимов нет).
IP-rate-limit можно оставить вторым контуром или снять (баланс — основной лимит).

**Политика возврата для стримов (на подтверждение):** возвращаем, только если
до клиента не ушло ни одного контент-чанка (ошибка LLM/сети на старте). Если
контент пошёл, а юзер закрыл вкладку — он получил ценность, не возвращаем.
Это один boolean `producedOutput` в цикле стрима. Альтернатива — полный возврат
на любой не-успех (проще, но «читнул и отменил» = бесплатно).

`charge`/`refund` не делаем generic preHandler-хуком — гранулярность разная
(кэш, момент до writeHead, refund в catch). Явный вызов хелпера в каждом
хендлере.

## 7. Новые серверные эндпоинты

```
GET  /api/balance            → { balanceKop, balanceRub }          (requireUser)
GET  /api/balance/ledger?limit=50 → { items: LedgerRow[] }          (requireUser)
GET  /api/billing/prices     → { free_text_parse: 50, ... }         (requireUser)
```

(Опц., если выберем HTTP-грант вместо SQL) `POST /api/admin/grant` под
env-токеном `ADMIN_TOKEN`: `{ userId, amountKop, reason }`.

## 8. Клиент (apps/food-calc)

1. **Два now-paid вызова на `authedFetch`:** `parseFreeTextFood.ts` и
   `parseDishName.ts` сейчас на голом `fetch()` → перевести на `authedFetch`
   (токен есть всегда, AuthGate).
2. **402 → типизированная ошибка.** `classify.ts`: добавить
   `kind: 'payment_required'` для 402. Один интерсептор
   `assertOkOrPayment(res)` парсит `{ need, have }` и кидает `PaymentRequiredError`.
   UI ловит → `toaster.error('Недостаточно средств', { action: 'Пополнить' })`
   → открывает ProfileDrawer на секции баланса.
3. **Кошелёк-сущность** `entities/wallet/`: `useBalance()` (GET /api/balance),
   `useLedger()`. Инвалидация `useBalance` после каждого успешного AI-вызова.
4. **Где показываем баланс:** новая `BalanceSection.tsx` в `ProfileDrawer.tsx`
   (между профилем и темой): «Баланс: X ₽», история транзакций, кнопка
   «Пополнить» (в MVP — disabled/«скоро», провайдера ещё нет). Опц. маленький
   pill рядом с `AccountPanel` в `HomeTopBar`.
5. **Цены в UI (опц.):** из `GET /api/billing/prices` → подписи «−2 ₽» у кнопок;
   в `CreateLongAnalysisDrawer` строка «Спишется 5 ₽» у кнопки запуска. Без
   отдельных confirm-диалогов на дешёвых действиях.

## 9. Корнер-кейсы

| Кейс | Закрыто чем |
| --- | --- |
| Гонка одновременных запросов | conditional `UPDATE` + row-lock (§5 шаг 2) |
| Двойное списание на ретрае сети | `request_id` + unique-индекс (§3) |
| Двойной возврат | unique `(user,'refund',request_id)` |
| Уход в минус | `CHECK >= 0` + `WHERE >= :price` |
| Несколько устройств/сессий | баланс на сервере, клиент отражает |
| Cache-hit жжёт деньги | списываем только на cache-miss (§6) |
| Обрыв стрима | политика `producedOutput` (§6) |
| Фоновая `analyze` падает асинхронно | refund в `updateAnalysisFailed` |
| Welcome выдан дважды | `ensureWallet` идемпотентен (ON CONFLICT) |
| Существующий pre-launch юзер | `ensureWallet` лениво при первом запросе |
| Ручной возврат недовольному | `grant(...)` через тот же леджер |

## 10. Развилки — ЗАЛОЧЕНО (2026-06-08)

1. **Цены** (§4): `0.5/0.5/2/2/5 ₽`, welcome `50 ₽`. ✅
2. **Политика возврата стрима** (§6): `producedOutput`-гард. ✅
3. **UX списания:** пассивные подписи «−N ₽» + всегда видимый баланс, без
   confirm-диалогов. ✅
4. **Админ-грант:** хелпер `grant()` + SQL-сниппет в доке (без HTTP-эндпоинта). ✅

## 11. Что НЕ делаем (scope cut MVP)

- Реальный эквайринг/провайдер (ЮKassa и т.п.) — отдельный шаг.
- Себестоимость×наценка, съём usage из стримов — тариф фиксом.
- Rollover/expiry/pooled-аллокации кредитов — не нужно.
- Внешние метеринги (Lago/Orb/Stripe Billing) — оверкилл для рублёвого кошелька.

## 12. Фазы реализации

- **Phase 1 — ядро (backend) — ✅ ГОТОВО, 10/10 зелёных:** миграция
  `db/migrations/20260608120000_wallet.sql` + `src/billing/{prices,wallet,errors}.ts`
  + `src/billing/__tests__/wallet.test.ts`. Покрыто: charge списывает, 402 при
  нехватке (need/have), refund возвращает + идемпотентен, двойной charge
  идемпотентен (в т.ч. под гонкой), параллельный decrement не уходит в минус,
  welcome выдан ровно один раз. Admin-грант `grant()` — там же.
- **Phase 2 — врезка в 5 эндпоинтов — ✅ ГОТОВО, 16/16 зелёных:**
  `src/billing/http.ts` (`chargeOr402` + `resolveRequestId`, 402-контракт
  `{error:'insufficient_balance',needKop,haveKop}`); `requireUser` на два
  анонимных роута навешен в `buildApp` через scope (чтобы pure-pipeline
  unit-тесты остались без auth), billing в хендлере гейтится `req.userId`;
  free-text/suggestions — charge на cache-miss + refund в catch; analyze-dish/
  daily — charge до writeHead, refund по producedOutput (`runDailySSE`
  обёрнут в роуте, сигнатура не тронута); analyze — charge на kickoff
  (requestId = id), refund в фоновом failure-пути + на insert-ошибке/404.
  Тесты: `src/billing/__tests__/charge-routes.test.ts` (мок LLM, реальная БД).
  Клиент в эту фазу НЕ трогали (Phase 3).
- **Phase 3 — баланс-эндпоинты + клиент — ✅ ГОТОВО:**
  backend `src/api/routes/billing.ts` (`GET /api/balance`, `/api/balance/ledger`,
  `/api/billing/prices`, все под `requireUser`) + тест `balance-read.test.ts`
  (4/4). Клиент: `shared/lib/api/apiError.ts` (`PaymentRequiredError` +
  `readApiError`/`throwApiError`, RU-сообщение для 402), `shared/lib/api/billing.ts`
  (`fetchBalance`/`fetchLedger`); два анонимных вызова (`parseFreeTextFood`,
  `parseDishName`) переведены на `authedFetch` (чинит 401 от Phase 2); 402
  surface во всех 5 фетчерах (daily — через свой `DailyStreamError` с RU-текстом);
  `classify.ts` получил `payment_required`; `BalanceSection` в ProfileDrawer
  (баланс + welcome/история, кнопка «Пополнить — скоро» disabled, fetch-on-open,
  без live-bus). Баланс показывается, цены server-side.
- **Phase 4 — welcome + админ-грант — ✅ ГОТОВО:** welcome 50 ₽ выдаётся лениво
  через `ensureWallet` (Phase 1). Ручное пополнение в MVP — хелпер
  `grant(userId, kop, reason)` (`src/billing/wallet.ts`) или SQL ниже.

### Ручное пополнение (admin top-up, MVP)

Предпочтительно — хелпер из кода (сохраняет welcome-семантику, идемпотентен по
леджеру). SQL-фолбэк (создаёт кошелёк, если его ещё нет; две команды):

```sql
-- Дать юзеру :kop копеек (напр. 50000 = 500 ₽).
insert into public.wallet (user_id, balance_kop) values (:user_id, :kop)
  on conflict (user_id) do update
     set balance_kop = wallet.balance_kop + :kop, updated_at = now();
insert into public.wallet_ledger (user_id, amount_kop, balance_after_kop, kind, meta)
select :user_id, :kop, balance_kop, 'grant', '{"reason":"manual top-up"}'::jsonb
  from public.wallet where user_id = :user_id;
```

## 13. Client test coverage plan (✅ ВЫПОЛНЕНО 2026-06-08)

`/critique` 2026-06-08 показал: бэкенд покрыт (30 тестов), **клиент — 0 тестов**.
Менялось много на стыке, регрессию ловили только typecheck + существующие тесты.
План (vitest + testing-library, как `ProfileDrawer.test.tsx`):

**Статус: все 6 пунктов закрыты, +49 клиент-тестов (8 файлов, 93/93 зелёные).**
- §1 `apiError.test.ts` (новый, 9) · §2 `billing.test.ts` (новый, 7) ·
  §3 `classify.test.ts` (+3 блок `payment_required`) ·
  §4+§5 `parseFood.test.ts` (новый, 10 — parse×2 через таблицу: 402 +
  X-Request-Id) · §4 `runDishAnalysis.test.ts` (+2) · §4+body-id
  `runAnalysis.test.ts` (+2: 402 + «long не шлёт X-Request-Id, идемпотентность
  по body.id») · §4+§5 `streamDailyAnalysis.test.ts` (+2: kind `'payment'` +
  X-Request-Id) · §6 `BalanceSection.test.tsx` (новый, 3: loading/loaded/error).
- NB: `startAnalysis` (long) намеренно БЕЗ заголовка `X-Request-Id` —
  идемпотентность по body `id`; тест это фиксирует, не баг.
- Известный пре-существующий drift (НЕ из этой работы): whole-project
  `tsc --noEmit` красный из-за старых Dexie-фикстур в `runAnalysis.test.ts` /
  `runDishAnalysis.test.ts` без поля `updated_at` (схема его сделала required
  позже) + `TimeGroup.tsx` / `ModalShell.tsx`. Мои добавленные строки tsc-чисты.

---
Исходный план (для истории):

1. **`shared/lib/api/apiError.ts`** — `readApiError`: 402 → `{paymentRequired:true, needKop, haveKop, message:'Недостаточно…'}`; не-402 → `{message: body.error}`; не-JSON body → `HTTP <status>`. `throwApiError`: 402 → `instanceof PaymentRequiredError` с need/have; иначе → `Error(message)`.
2. **`shared/lib/api/billing.ts`** — `fetchBalance`/`fetchLedger` (мок `authedFetch`): ok → распарсено; non-ok → throw; `fetchLedger` пустой `items` → `[]`.
3. **`shared/lib/errors/classify.ts`** — `PaymentRequiredError` → `kind:'payment_required'`; статус 402 → `payment_required`.
4. **402-surface на 5 путях** (мок `authedFetch` → 402): parse×2 + dish + startAnalysis → `PaymentRequiredError`; daily → `DailyStreamError` kind `'payment'` (дописать в существующий `streamDailyAnalysis.test.ts`).
5. **`X-Request-Id`** — assert, что фетчеры шлют заголовок (мок `authedFetch`, проверить `init.headers`).
6. **`BalanceSection`** (render-тест) — loading → `…`; loaded → `X ₽` + строки леджера; error → «Не удалось загрузить баланс»; disabled «Пополнить — скоро».

Тесты обязательны до ручного smoke (schema-conformance + `Fastify.inject`),
не «руками проверил».
