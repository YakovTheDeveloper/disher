-- 2026-07-14 — снять колонки, которые заводил better-auth admin().
--
-- Плагин выпилен (см. src/auth/server.ts): его RPC мы всё равно 404-или вручную,
-- а нужна была одна колонка `role`. Четыре остальные не читает никто —
-- `banned`/`banReason`/`banExpires` (users) и `impersonatedBy` (session)
-- обслуживали ban/impersonate, которые в продукте объявлены анти-целями.
--
-- `users.role` ОСТАЁТСЯ: теперь она наша, объявлена как user.additionalFields
-- и её единственную читает requireAdmin.
--
-- DEPLOY ORDERING: эта миграция идёт СТРОГО ПОСЛЕ того, как cookie-код (и код
-- без admin()) отстоял в проде. Порядок = план отката: пока колонки на месте,
-- откат «вернуть плагин» работает; после дропа — уже нет. Если катнуть её вместе
-- с кодом и что-то пойдёт не так, откатываться будет некуда.
--
-- К моменту дропа ни одна живая ветка кода эти колонки не читает: без плагина
-- better-auth их не SELECT-ит, а наш код — тем более. Поэтому дроп безопасен
-- ровно при соблюдении порядка выше и опасен при его нарушении: применить его
-- к БД, против которой ещё работает контейнер СО старым кодом (с admin()),
-- значит уронить каждый getSession в 500.

begin;

alter table "users"
  drop column if exists "banned",
  drop column if exists "banReason",
  drop column if exists "banExpires";

alter table "session"
  drop column if exists "impersonatedBy";

commit;
