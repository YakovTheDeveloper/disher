-- B1 — greenfield schema for own-auth (dev/test DBs).
--
-- Targets a blank Postgres DB (e.g. disher_dev). Creates:
--   1. better-auth tables (users, account, session, verification) — generated
--      by @better-auth/cli, see ./better-auth-schema.sql.
--   2. The 8 user-data tables that previously lived behind Supabase's
--      auth.users / RLS, now FK'd to public.users.
--
-- No RLS, no policies, no auth schema. Backend uses a direct pg.Pool with the
-- DB owner and validates `row.user_id === jwt.sub` itself (see CLAUDE.md →
-- "Data Layer").
--
-- For the prod migration (transforming an existing Supabase DB in place),
-- see 20260501000001_own_auth_migrate_supabase.sql — applied in phase F0.

begin;

-- ─── pgcrypto for gen_random_uuid() ────────────────────────────────────────

create extension if not exists pgcrypto;

-- ─── better-auth tables (copied verbatim from `npx @better-auth/cli generate` output) ──

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

create index "session_userId_idx"               on "session"      ("userId");
create index "account_userId_idx"               on "account"      ("userId");
create index "verification_identifier_idx"      on "verification" ("identifier");

-- ─── Disher user-data tables (mirrors 20260424000000_initial_schema.sql) ───
--
-- LWW sync columns on every row: client_modified_at, edit_count,
-- server_received_at, deleted_at. Indexes match the original; RLS removed.

-- products (catalog rows have user_id IS NULL)

create table public.products (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references public.users(id) on delete cascade,
  name                 text not null,
  name_eng             text not null default '',
  description          text not null default '',
  description_eng      text not null default '',
  source               text not null default '',
  price_per_kg         numeric not null default 0,
  nutrients            jsonb not null default '{}'::jsonb,
  portions             jsonb not null default '[]'::jsonb,
  categories           jsonb not null default '[]'::jsonb,
  client_modified_at   timestamptz not null default now(),
  edit_count           integer not null default 0,
  server_received_at   timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

create index products_user_id_idx       on public.products (user_id) where deleted_at is null;
create index products_user_modified_idx on public.products (user_id, client_modified_at);

-- dishes

create table public.dishes (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.users(id) on delete cascade,
  name                 text not null,
  client_modified_at   timestamptz not null default now(),
  edit_count           integer not null default 0,
  server_received_at   timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

create index dishes_user_id_idx       on public.dishes (user_id) where deleted_at is null;
create index dishes_user_modified_idx on public.dishes (user_id, client_modified_at);

-- dish_items

create table public.dish_items (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.users(id) on delete cascade,
  dish_id              uuid not null references public.dishes(id) on delete cascade,
  product_id           uuid not null references public.products(id),
  quantity             numeric not null,
  client_modified_at   timestamptz not null default now(),
  edit_count           integer not null default 0,
  server_received_at   timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

create index dish_items_dish_id_idx       on public.dish_items (dish_id) where deleted_at is null;
create index dish_items_user_id_idx       on public.dish_items (user_id) where deleted_at is null;
create index dish_items_user_modified_idx on public.dish_items (user_id, client_modified_at);

-- dish_portions

create table public.dish_portions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.users(id) on delete cascade,
  dish_id              uuid not null references public.dishes(id) on delete cascade,
  label                text not null,
  amount               numeric not null,
  unit                 text not null,
  grams                numeric not null,
  client_modified_at   timestamptz not null default now(),
  edit_count           integer not null default 0,
  server_received_at   timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

create index dish_portions_dish_id_idx       on public.dish_portions (dish_id) where deleted_at is null;
create index dish_portions_user_id_idx       on public.dish_portions (user_id) where deleted_at is null;
create index dish_portions_user_modified_idx on public.dish_portions (user_id, client_modified_at);

-- schedule_foods (daily food log)

create type schedule_food_type as enum ('food', 'dish');

create table public.schedule_foods (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.users(id) on delete cascade,
  date                 text not null,
  time                 text not null,
  type                 schedule_food_type not null,
  quantity             numeric not null,
  details              text not null default '',
  product_id           uuid references public.products(id),
  dish_id              uuid references public.dishes(id),
  client_modified_at   timestamptz not null default now(),
  edit_count           integer not null default 0,
  server_received_at   timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  deleted_at           timestamptz,

  constraint schedule_foods_ref_chk check (
    (type = 'food' and product_id is not null and dish_id is null) or
    (type = 'dish' and dish_id is not null and product_id is null)
  )
);

create index schedule_foods_user_date_idx     on public.schedule_foods (user_id, date) where deleted_at is null;
create index schedule_foods_user_modified_idx on public.schedule_foods (user_id, client_modified_at);

-- schedule_events (calendar / atom-based events)

create table public.schedule_events (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.users(id) on delete cascade,
  date                 text not null,
  time                 text not null,
  end_time             text not null default '',
  text                 text not null default '',
  atoms                jsonb not null default '[]'::jsonb,
  client_modified_at   timestamptz not null default now(),
  edit_count           integer not null default 0,
  server_received_at   timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

create index schedule_events_user_date_idx     on public.schedule_events (user_id, date) where deleted_at is null;
create index schedule_events_user_modified_idx on public.schedule_events (user_id, client_modified_at);

-- daily_norms

create table public.daily_norms (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.users(id) on delete cascade,
  name                 text not null,
  description          text not null default '',
  items                jsonb not null default '{}'::jsonb,
  client_modified_at   timestamptz not null default now(),
  edit_count           integer not null default 0,
  server_received_at   timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

create index daily_norms_user_id_idx       on public.daily_norms (user_id) where deleted_at is null;
create index daily_norms_user_modified_idx on public.daily_norms (user_id, client_modified_at);

-- periods

create table public.periods (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.users(id) on delete cascade,
  name                 text not null,
  color_index          int not null default 0,
  font_family          text not null default 'sans',
  font_size            int not null default 16,
  client_modified_at   timestamptz not null default now(),
  edit_count           integer not null default 0,
  server_received_at   timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

create index periods_user_id_idx       on public.periods (user_id) where deleted_at is null;
create index periods_user_modified_idx on public.periods (user_id, client_modified_at);

commit;
