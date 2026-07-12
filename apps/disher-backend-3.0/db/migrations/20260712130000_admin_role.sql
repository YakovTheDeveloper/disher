-- 2026-07-12 — roles + better-auth `admin` plugin columns.
--
-- Adds the columns the better-auth admin() plugin expects on `users`/`session`
-- (see src/auth/server.ts). Additive ONLY — no data migration, no relogin: the
-- Disher auth-инвариант is "login once", so existing sessions must survive.
-- `banned` defaults false, so the plugin's ban-hook rejects nobody.
--
-- camelCase columns are double-quoted to match the better-auth naming the ORM
-- queries with (see 20260501000000_own_auth_init.sql). `role` stays lowercase
-- (unquoted → folded to lowercase, which is what the plugin reads).
--
-- `better-auth-schema.sql` is reference-only and NOT touched — new columns live
-- exclusively in this numbered migration, which both appliers (pg-migrate.sh,
-- db-reset.ts) pick up by its 14-digit prefix.
--
-- DEPLOY ORDERING: this migration MUST be applied BEFORE the admin()-plugin code
-- (auth/server.ts) goes live. Once the plugin is registered, better-auth's
-- getSession SELECTs role/banned/banReason/banExpires (users) + impersonatedBy
-- (session). If the code starts against a DB missing these columns, EVERY
-- getSession 500s → app-wide auth outage. pg-migrate.sh runs before the backend
-- container starts, so a normal deploy is safe — do not reorder that.

begin;

alter table "users"
  add column if not exists "role"       text default 'user',
  add column if not exists "banned"     boolean not null default false,
  add column if not exists "banReason"  text,
  add column if not exists "banExpires" timestamptz;

alter table "session"
  add column if not exists "impersonatedBy" uuid references "users" ("id");

commit;
