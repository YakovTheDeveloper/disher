-- B1 — transform migration for Supabase prod (applied in phase F0, NOT yet).
--
-- Assumes the existing schema from
--   food-calc/supabase/migrations/20260424000000_initial_schema.sql
--   food-calc/supabase/migrations/20260425000000_seed_catalog.sql
--   food-calc/supabase/migrations/20260429000000_remove_empty_supplements.sql
-- is already in place — i.e. 8 user-tables FK'd to auth.users, with RLS on,
-- plus a seeded products catalog (user_id IS NULL).
--
-- Transforms in place:
--   1. Adds the 4 better-auth tables (users plural, session, account, verification).
--   2. Wipes user-owned rows (their user_ids point at auth.users which is going
--      away). Catalog rows (products.user_id IS NULL) survive.
--   3. Drops every RLS policy and disables RLS — backend now validates
--      row.user_id === jwt.sub itself via the pg.Pool.
--   4. Re-points every user_id FK from auth.users(id) → public.users(id).
--
-- DROP SCHEMA auth CASCADE is intentionally LEFT OUT of this transaction —
-- run it manually post-F0 once smoke is green.

begin;

-- ─── 1. better-auth tables (verbatim from `npx @better-auth/cli generate`) ──

create table "users" (
  "id"            uuid default pg_catalog.gen_random_uuid() not null primary key,
  "name"          text not null,
  "email"         text not null unique,
  "emailVerified" boolean not null,
  "image"         text,
  "createdAt"     timestamptz default current_timestamp not null,
  "updatedAt"     timestamptz default current_timestamp not null
);

create table "session" (
  "id"        uuid default pg_catalog.gen_random_uuid() not null primary key,
  "expiresAt" timestamptz not null,
  "token"     text not null unique,
  "createdAt" timestamptz default current_timestamp not null,
  "updatedAt" timestamptz not null,
  "ipAddress" text,
  "userAgent" text,
  "userId"    uuid not null references "users" ("id") on delete cascade
);

create table "account" (
  "id"                     uuid default pg_catalog.gen_random_uuid() not null primary key,
  "accountId"              text not null,
  "providerId"             text not null,
  "userId"                 uuid not null references "users" ("id") on delete cascade,
  "accessToken"            text,
  "refreshToken"           text,
  "idToken"                text,
  "accessTokenExpiresAt"   timestamptz,
  "refreshTokenExpiresAt"  timestamptz,
  "scope"                  text,
  "password"               text,
  "createdAt"              timestamptz default current_timestamp not null,
  "updatedAt"              timestamptz not null
);

create table "verification" (
  "id"         uuid default pg_catalog.gen_random_uuid() not null primary key,
  "identifier" text not null,
  "value"      text not null,
  "expiresAt"  timestamptz not null,
  "createdAt"  timestamptz default current_timestamp not null,
  "updatedAt"  timestamptz default current_timestamp not null
);

create index "session_userId_idx"          on "session"      ("userId");
create index "account_userId_idx"          on "account"      ("userId");
create index "verification_identifier_idx" on "verification" ("identifier");

-- ─── 2. Wipe user-owned rows; preserve seeded catalog ─────────────────────

-- products: keep user_id IS NULL (catalog), drop the rest. CASCADE follows
-- dish_items.product_id and schedule_foods.product_id, both of which become
-- orphans anyway when their parent dishes/schedules are wiped below.
delete from public.products where user_id is not null;

-- everything else is user-owned 1:1 — TRUNCATE clears all rows.
-- CASCADE handles dish_items → dishes, dish_portions → dishes,
-- schedule_foods → dishes/products (FK to public.products),
-- and any user-owned products children that DELETE above missed.
truncate table
  public.dishes,
  public.dish_items,
  public.dish_portions,
  public.schedule_foods,
  public.schedule_events,
  public.daily_norms,
  public.periods
  cascade;

-- ─── 3. Drop RLS policies + disable RLS ───────────────────────────────────

drop policy if exists products_select        on public.products;
drop policy if exists products_insert        on public.products;
drop policy if exists products_update        on public.products;
drop policy if exists products_delete        on public.products;

drop policy if exists dishes_select          on public.dishes;
drop policy if exists dishes_insert          on public.dishes;
drop policy if exists dishes_update          on public.dishes;
drop policy if exists dishes_delete          on public.dishes;

drop policy if exists dish_items_select      on public.dish_items;
drop policy if exists dish_items_insert      on public.dish_items;
drop policy if exists dish_items_update      on public.dish_items;
drop policy if exists dish_items_delete      on public.dish_items;

drop policy if exists dish_portions_select   on public.dish_portions;
drop policy if exists dish_portions_insert   on public.dish_portions;
drop policy if exists dish_portions_update   on public.dish_portions;
drop policy if exists dish_portions_delete   on public.dish_portions;

drop policy if exists schedule_foods_select  on public.schedule_foods;
drop policy if exists schedule_foods_insert  on public.schedule_foods;
drop policy if exists schedule_foods_update  on public.schedule_foods;
drop policy if exists schedule_foods_delete  on public.schedule_foods;

drop policy if exists schedule_events_select on public.schedule_events;
drop policy if exists schedule_events_insert on public.schedule_events;
drop policy if exists schedule_events_update on public.schedule_events;
drop policy if exists schedule_events_delete on public.schedule_events;

drop policy if exists daily_norms_select     on public.daily_norms;
drop policy if exists daily_norms_insert     on public.daily_norms;
drop policy if exists daily_norms_update     on public.daily_norms;
drop policy if exists daily_norms_delete     on public.daily_norms;

drop policy if exists periods_select         on public.periods;
drop policy if exists periods_insert         on public.periods;
drop policy if exists periods_update         on public.periods;
drop policy if exists periods_delete         on public.periods;

alter table public.products        disable row level security;
alter table public.dishes          disable row level security;
alter table public.dish_items      disable row level security;
alter table public.dish_portions   disable row level security;
alter table public.schedule_foods  disable row level security;
alter table public.schedule_events disable row level security;
alter table public.daily_norms     disable row level security;
alter table public.periods         disable row level security;

-- ─── 4. Re-point user_id FKs from auth.users(id) → public.users(id) ───────
--
-- Constraint names follow Postgres' default <table>_<column>_fkey convention,
-- which is what `references auth.users(id)` produced in 20260424000000.

alter table public.products
  drop constraint if exists products_user_id_fkey,
  add  constraint           products_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;

alter table public.dishes
  drop constraint if exists dishes_user_id_fkey,
  add  constraint           dishes_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;

alter table public.dish_items
  drop constraint if exists dish_items_user_id_fkey,
  add  constraint           dish_items_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;

alter table public.dish_portions
  drop constraint if exists dish_portions_user_id_fkey,
  add  constraint           dish_portions_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;

alter table public.schedule_foods
  drop constraint if exists schedule_foods_user_id_fkey,
  add  constraint           schedule_foods_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;

alter table public.schedule_events
  drop constraint if exists schedule_events_user_id_fkey,
  add  constraint           schedule_events_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;

alter table public.daily_norms
  drop constraint if exists daily_norms_user_id_fkey,
  add  constraint           daily_norms_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;

alter table public.periods
  drop constraint if exists periods_user_id_fkey,
  add  constraint           periods_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;

commit;

-- After F0 smoke succeeds, run manually (NOT in this txn):
--   drop schema auth cascade;
