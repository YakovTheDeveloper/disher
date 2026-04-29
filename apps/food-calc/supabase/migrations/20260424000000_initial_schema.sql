-- Disher initial Postgres schema for backup-polling architecture.
--
-- Local Dexie DB on the client is the source of truth. This Postgres backs it
-- up through POST /backup with last-write-wins on (edit_count, client_modified_at).
--
-- Sync columns on every user-table:
--   client_modified_at  ms-precision timestamp set by the client on every edit
--   edit_count          integer counter, +1 per mutation; primary LWW key
--   server_received_at  set by server on accept; clock-skew telemetry only
--
-- Soft delete via deleted_at. Snapshot pull (GET /backup/snapshot) includes
-- soft-deleted rows so the client can reconcile tombstones.
--
-- schedule_foods.date / schedule_events.date are TEXT (DD-MM-YYYY) — the
-- client keys schedules by that string end-to-end and we run no server-side
-- date queries, so the conversion boundary stays out of the way.

create extension if not exists pgcrypto with schema extensions;

-- ─── products (foods catalog + user-created) ───────────────────────────────

create table public.products (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references auth.users(id) on delete cascade,
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

-- ─── dishes ────────────────────────────────────────────────────────────────

create table public.dishes (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  name                 text not null,
  client_modified_at   timestamptz not null default now(),
  edit_count           integer not null default 0,
  server_received_at   timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

create index dishes_user_id_idx       on public.dishes (user_id) where deleted_at is null;
create index dishes_user_modified_idx on public.dishes (user_id, client_modified_at);

-- ─── dish_items ────────────────────────────────────────────────────────────

create table public.dish_items (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
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

-- ─── dish_portions ─────────────────────────────────────────────────────────

create table public.dish_portions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
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

-- ─── schedule_foods (daily food log) ───────────────────────────────────────

create type schedule_food_type as enum ('food', 'dish');

create table public.schedule_foods (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
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

-- ─── schedule_events (calendar / daily events with atoms) ──────────────────

create table public.schedule_events (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
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

-- ─── daily_norms ───────────────────────────────────────────────────────────

create table public.daily_norms (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
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

-- ─── periods (styling / tagging ranges) ────────────────────────────────────

create table public.periods (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
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

-- ─── Row Level Security ────────────────────────────────────────────────────

alter table public.products        enable row level security;
alter table public.dishes          enable row level security;
alter table public.dish_items      enable row level security;
alter table public.dish_portions   enable row level security;
alter table public.schedule_foods  enable row level security;
alter table public.schedule_events enable row level security;
alter table public.daily_norms     enable row level security;
alter table public.periods         enable row level security;

create policy products_select on public.products
  for select using (user_id is null or user_id = auth.uid());
create policy products_insert on public.products
  for insert with check (user_id = auth.uid());
create policy products_update on public.products
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy products_delete on public.products
  for delete using (user_id = auth.uid());

create policy dishes_select on public.dishes
  for select using (user_id = auth.uid());
create policy dishes_insert on public.dishes
  for insert with check (user_id = auth.uid());
create policy dishes_update on public.dishes
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy dishes_delete on public.dishes
  for delete using (user_id = auth.uid());

create policy dish_items_select on public.dish_items
  for select using (user_id = auth.uid());
create policy dish_items_insert on public.dish_items
  for insert with check (user_id = auth.uid());
create policy dish_items_update on public.dish_items
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy dish_items_delete on public.dish_items
  for delete using (user_id = auth.uid());

create policy dish_portions_select on public.dish_portions
  for select using (user_id = auth.uid());
create policy dish_portions_insert on public.dish_portions
  for insert with check (user_id = auth.uid());
create policy dish_portions_update on public.dish_portions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy dish_portions_delete on public.dish_portions
  for delete using (user_id = auth.uid());

create policy schedule_foods_select on public.schedule_foods
  for select using (user_id = auth.uid());
create policy schedule_foods_insert on public.schedule_foods
  for insert with check (user_id = auth.uid());
create policy schedule_foods_update on public.schedule_foods
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy schedule_foods_delete on public.schedule_foods
  for delete using (user_id = auth.uid());

create policy schedule_events_select on public.schedule_events
  for select using (user_id = auth.uid());
create policy schedule_events_insert on public.schedule_events
  for insert with check (user_id = auth.uid());
create policy schedule_events_update on public.schedule_events
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy schedule_events_delete on public.schedule_events
  for delete using (user_id = auth.uid());

create policy daily_norms_select on public.daily_norms
  for select using (user_id = auth.uid());
create policy daily_norms_insert on public.daily_norms
  for insert with check (user_id = auth.uid());
create policy daily_norms_update on public.daily_norms
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy daily_norms_delete on public.daily_norms
  for delete using (user_id = auth.uid());

create policy periods_select on public.periods
  for select using (user_id = auth.uid());
create policy periods_insert on public.periods
  for insert with check (user_id = auth.uid());
create policy periods_update on public.periods
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy periods_delete on public.periods
  for delete using (user_id = auth.uid());
