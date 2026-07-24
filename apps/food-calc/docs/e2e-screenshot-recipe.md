# Рецепт: ad-hoc скриншоты UI через Playwright (e2e-окружение)

Как быстро получить живой скриншот любого экрана/дровера приложения с реальными
данными, не разбирая окружение с нуля. Проверено 2026-07-23 на quick-view дровере
нутриентов — рабочая пара файлов лежит в `.tmp-shots/` (`pw.config.ts` +
`shots.spec.ts`, scratch, в .gitignore).

## TL;DR

```bash
cd apps/food-calc
npx playwright test --config .tmp-shots/pw.config.ts
```

Конфиг сам поднимет оба сервера (или переиспользует живые), выполнит спеку и
положит PNG рядом. Своя спека = копия `shots.spec.ts` с другим сидом/селекторами
(+ поправь `testMatch` в конфиге, иначе выполнится только `shots.spec.ts`).

## Состав окружения

- **Два сервера** (Playwright `webServer` поднимает автоматически;
  `reuseExistingServer: true` — живые dev-серверы переиспользуются):
  - фронт: `pnpm run dev:e2e` в `apps/food-calc` → vite на `127.0.0.1:4173`
    (test mode, HTTP);
  - бэкенд: `pnpm run dev:e2e` в `apps/disher-backend-3.0` → `127.0.0.1:3101`
    (`/health` — readiness). Порт 3101 ≠ dev-бекенд 3100 — конфликта нет.
- **Мост `window.__e2e`** — ставится синхронно из `main.tsx` в test mode. Ждать:
  `waitForBridgeNoSession(page)` из `tests/e2e/analysisHelpers.ts`. Полезные
  методы: `getSession()`, `bulkAdd(table, rows)`, `listTable(table)`,
  `verifyEmail(email)`, `wipeLocal()` (типы — `tests/e2e/helpers.ts`).

## Авторизация — ТОЛЬКО dev-кнопка

```ts
await page.goto('/');
await waitForBridgeNoSession(page);
await page.getByRole('button', { name: 'Войти (Dev)' }).click();
```

Backend в test mode сидит `dev@disher.local`, а `AuthForm` рендерит DEV-кнопку
«Войти (Dev)» — один клик, без почты/пароля. НЕ используй
`signUpAndVerify` из analysisHelpers для скриншотов: кнопки «Зарегистрироваться»
на текущем AuthScreen нет (провалено таймаутом 2026-07-23).

## Сидирование (Dexie)

- Продукт: `bulkAdd('products', [{ id, name, source: '', nutrients: {...},
  portions: [], categories: [], serving_basis: '100g', serving_unit: null,
  created_at: ISO }])`.
- Id нутриентов — `src/entities/nutrient/ui/NutrientGroup/constants/constants.ts`:
  protein `'1'`, fats `'2'`, carbohydrates `'3'`, sugar `'4'`, fiber `'6'`,
  energy `'7'`, water `'8'`, железо `'9'`, магний `'10'`, фосфор `'11'`,
  кальций `'12'`, калий `'13'`, натрий `'14'`, цинк `'15'` (полный профиль —
  в `shots.spec.ts`).
- **Колонка «% нормы» и метры рендерятся ТОЛЬКО при пользовательской норме**:
  сид `daily_norms` с singleton-id `USER_NORM` (`useUserNormRowState` читает
  `db.daily_norms.get('USER_NORM')`). Без неё витрина «голая» (showNorms=false).
- Идемпотентность: перед `bulkAdd` проверяй `listTable` — сиды переживают reload.
- `page.route('**/api/backup**', 404)` — чтобы BackupGate не утянул/не потёр
  сиды при буте.

## Открытие quick-view дровера нутриентов

1. `page.locator('label[for="schedule-fe-search"]').first().click()` — SearchFood.
2. `page.locator('#schedule-fe-search').fill(NAME)`.
3. ⓘ скоупить к НАШЕЙ карточке (иначе гонка с неотфильтрованным списком):
   `page.getByRole('option', { name: new RegExp(NAME) })
   .getByRole('button', { name: 'Информация о продукте' }).click()`.
4. Контент дровера: `#drawer-content`; внутренний скролл —
   `#drawer-content-scrollable` (`scrollTo({ top: 500, behavior: 'instant' })`).
5. **Вторая snap-фаза — БЕЗ драга**: `page.getByRole('button',
   { name: 'Развернуть панель' }).click()` (доступная кнопка хендла).

## Тёмная тема

```ts
localStorage.setItem('disher.color-mode',
  JSON.stringify({ state: { mode: 'dark' }, version: 1 }));
// затем page.reload() + ждать мост + сид (идемпотентный)
```

## Грабли

- Мобильный вьюпорт обязателен (390×844 / isMobile / dsf=2) — приложение
  mobile-first, дроверы нижние.
- После открытия дровера/смены фазы — `waitForTimeout(1000)`: snap-анимация.
- Ад-хок спеки НЕ класть в `tests/e2e` (засоряют suite): scratch-папка
  `.tmp-shots/` + свой конфиг с узким `testMatch`.
