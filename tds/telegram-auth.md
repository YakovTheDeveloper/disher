# Telegram-вход (OIDC через oauth.telegram.org + better-auth genericOAuth)

Статус: **код-полный**, за env-флагом. Реальный вход требует ручной настройки бота в
@BotFather (необратимое переключение в OIDC) + HTTPS-туннель — см. чек-лист ниже.

---

## Что это и почему так

«Войти через Telegram» реализован через **официальный OIDC-флоу Telegram**
(`oauth.telegram.org`), подключённый first-party плагином better-auth
`genericOAuth`. Bearer-режим не тронут: genericOAuth-callback чеканит сессию, а
плагин `bearer()` отдаёт заголовок `set-auth-token` ровно как для email-входа.

**Почему OIDC + genericOAuth, а НЕ классический Login Widget с ручным HMAC:**
- redirect-флоу иммунен к баг-блокировке попапов в установленной PWA (реальный
  cross-library дефект: installed PWA уходит в фон в момент открытия попапа, и
  `data-onauth`-колбэк виджета не срабатывает никогда);
- нет своей криптографии, своего session-mint эндпоинта, стороннего npm-пакета
  (`better-auth-telegram` отвергнут — одиночный мейнтейнер, supply-chain риск);
- Telegram отдаёт стандартный discovery-документ + JWKS.

**Ключевые решения (инварианты — не перерешивать):**
- **Email = Option A (плейсхолдер).** Telegram не отдаёт email, а `users.email` =
  `NOT NULL UNIQUE`. Синтезируем непорутабельный `tg_<sub>@telegram.local`,
  `emailVerified: true` — чтобы `emailVerification.sendOnSignUp` не слал письмо на
  фейковый адрес. Схему на nullable email НЕ мигрируем (Option B отклонён).
- **Идентичность строго по `account(providerId='telegram', accountId=<sub>)`**,
  НИКОГДА не по синтетическому email — защита от takeover и от коллизии
  плейсхолдера с реальным адресом.
- **Telegram = отдельный аккаунт в v1.** Слияние с email-аккаунтом = фаза 2.
- **Фича под env-флагом** (см. ниже) — не always-on.

---

## Флоу (сквозной)

1. Фронт: кнопка «Войти через Telegram» рендерится в `AuthForm.tsx` только при
   `VITE_TELEGRAM_LOGIN === '1'` (build-time).
2. Клик → `auth-store.signInWithTelegram()` →
   `authProvider.signInWithOAuth('telegram', '/')` →
   `authClient.signIn.oauth2({ providerId: 'telegram', callbackURL: '/' })`.
3. better-auth редиректит на `oauth.telegram.org` (authorize, PKCE).
4. Пользователь подтверждает в Telegram → редирект на callback:
   **`${BETTER_AUTH_URL}/api/auth/oauth2/callback/telegram`** (монтирует сам
   genericOAuth — это и есть redirect_uri для @BotFather).
5. Бэк меняет одноразовый PKCE-код на токены (client-auth = HTTP Basic).
6. У Telegram **нет userinfo-эндпоинта** — профиль берётся из `id_token` через
   `getUserInfo()` → `telegramProfileFromIdToken()`.
7. Сессия зачеканена, `set-auth-token` уходит на фронт, пользователь на `/`.

---

## Trust-модель id_token

`id_token` приходит с token-эндпоинта Telegram по TLS в обмен на одноразовый
PKCE-код, который знают только наш бэк и Telegram → канал аутентифицирован,
подделать токен в этом обмене нельзя. Дополнительно в `telegramProfileFromIdToken`
проверяются `iss` / `aud` / `exp`, а на провайдере стоят `issuer` +
`requireIssuerValidation` (better-auth сверяет `iss` из callback-параметров).

**Hardening-TODO (не блокер):** полная JWKS RS256-проверка подписи `id_token`.
Не требуется для корректности при аутентифицированном канале, но защита в глубину,
если флоу когда-либо получит токены из недоверенного источника.

---

## Конфигурация (env)

Сервер регистрирует провайдера **только если заданы ОБА** значения (ленивый
паттерн как у Resend); иначе плагин не подключается и эндпоинта Telegram-входа не
существует.

**Бэкенд** (`apps/disher-backend-3.0`, server-only — секрет НЕ shipить в SPA):
```
TELEGRAM_CLIENT_ID=      # bot_id (OIDC client_id)
TELEGRAM_CLIENT_SECRET=  # OIDC client secret бота
```
(шаблон — в `.env.production.example`, блок «Auth: Telegram login»)

**Фронтенд** (`apps/food-calc`, build-time):
```
VITE_TELEGRAM_LOGIN=1
```

---

## ✅ Чек-лист настройки бота в @BotFather

> ⚠️ Переключение в OIDC **необратимо**, и client secret сейчас **не ротируется**.
> Для dev/прототипа берите **ОДНОРАЗОВОГО (throwaway) бота**, не боевого.

1. Создать бота: @BotFather → `/newbot` → получить токен (для боевого не нужен —
   OIDC-креды отдельные).
2. Открыть бота как **Mini App** → **Bot Settings → Web Login**.
3. Нажать **«Switch to OpenID Connect Login»** — ⚠️ ОДНОСТОРОННЕЕ действие.
4. Зарегистрировать **точный** Redirect URI как Allowed URL:
   ```
   ${BETTER_AUTH_URL}/api/auth/oauth2/callback/telegram
   ```
   (пример прод: `https://api.example.com/api/auth/oauth2/callback/telegram`)
   ⚠️ **localhost и сырые LAN-IP Telegram отвергает** — в dev нужен HTTPS-туннель
   (напр. cloudflared / ngrok), а `BETTER_AUTH_URL` выставить в URL туннеля.
5. Получить **Client ID** и **Client Secret** → прописать в env бэка
   (`TELEGRAM_CLIENT_ID` / `TELEGRAM_CLIENT_SECRET`).
6. Собрать фронт с `VITE_TELEGRAM_LOGIN=1`.
7. Перезапустить бэк (провайдер подключится, эндпоинт появится).

---

## Ручная приёмка (E2E)

Автотесты E2E не покрывают (нужны реальные BotFather-креды + HTTPS-туннель).
Порядок:

1. Настроить бота по чек-листу выше, поднять HTTPS-туннель, задать env.
2. ⚠️ `AuthGate.tsx` сейчас **выключен** юзером (ранний `return <>{children}</>`,
   комментарий `// ⚠️ TEMP: авторизация отключена`) — пока так, auth-экран не
   монтируется и кнопки Telegram не видно. Для ручного E2E гейт **временно**
   вернуть (это отдельное решение юзера, НЕ часть данной задачи).
3. Открыть приложение → «Войти через Telegram» → подтвердить в Telegram →
   ожидается редирект обратно на `/` с активной сессией.
4. Проверить: в БД появился `user` с email `tg_<sub>@telegram.local` и строка
   `account(providerId='telegram', accountId=<sub>)`.

---

## Карта файлов

**Бэкенд** (`apps/disher-backend-3.0`)
- `src/auth/telegram.ts` — чистая логика `id_token → profile` (`decodeJwtClaims`,
  `telegramProfileFromIdToken`) + gated-конфиг провайдера
  (`telegramGenericOAuthConfig`).
- `src/auth/__tests__/telegram.test.ts` — 16 юнитов.
- `src/auth/server.ts` — импорт `genericOAuth` + условная регистрация плагина.
- `.env.production.example` — блок TELEGRAM_CLIENT_ID/SECRET.

**Фронтенд** (`apps/food-calc`)
- `src/shared/lib/auth/betterAuthClient.ts` — `plugins: [genericOAuthClient()]`.
- `src/shared/lib/auth/betterAuthProvider.ts` — `signInWithOAuth(providerId, callbackURL)`.
- `src/shared/lib/auth/types.ts` — `signInWithOAuth` в интерфейсе AuthProvider.
- `src/features/auth/auth-store.ts` — экшен `signInWithTelegram`.
- `src/features/auth/AuthForm.tsx` — кнопка (gated `VITE_TELEGRAM_LOGIN`).
- `src/features/auth/AuthForm.module.scss` — `.altAuth/.altDivider/.telegramBtn`.

## Гейты
- Бэкенд юниты: `pnpm -C apps/disher-backend-3.0 exec vitest run src/auth/__tests__/telegram.test.ts` → 16 passed.
- Бэкенд typecheck: `pnpm -C apps/disher-backend-3.0 run typecheck` → exit 0.
- Фронт auth-тесты: `pnpm -C apps/food-calc exec vitest run src/features/auth src/shared/lib/auth`.
