-- Disher initial Postgres schema
-- Migrated from ex-LiveStore SQLite tables: products, dishes, dish_items,
-- dish_portions, schedule_foods, schedule_events, daily_norms, periods.
--
-- Design notes:
--   * user_id is uuid (Supabase auth.users.id). Anonymous sign-ins mean every
--     row has a real user_id even before the user hits the signup flow, and
--     upgrading an anon user to permanent preserves the UUID so rows stay
--     attached.
--   * Soft delete via deleted_at timestamptz. PowerSync Sync Rules filter out
--     deleted_at IS NOT NULL at read time; retention/hard-delete is a later
--     batch job.
--   * JSON payloads (nutrients, portions, categories, items, atoms) are
--     stored as jsonb — normalization into side tables was considered but
--     rejected: mobile clients read these as opaque blobs and never query
--     into them server-side.
--   * updated_at/created_at are kept as timestamptz; PowerSync uses row
--     updated_at to invalidate caches. Triggers wire them up.
--   * RLS is ON for every table with a uniform policy: row.user_id =
--     auth.uid(). The catalog table (`products`) has an extra policy allowing
--     SELECT on system rows (user_id IS NULL) so the shared food DB is
--     visible to everyone.

-- ─── extensions ────────────────────────────────────────────────────────────

-- pgcrypto ships with Supabase by default and provides gen_random_uuid().
-- We previously used uuid-ossp's gen_random_uuid(), but on fresh Supabase
-- projects uuid-ossp is installed under the `extensions` schema while the
-- migration runs with search_path = public, so the unqualified call fails.
-- gen_random_uuid() from pgcrypto is in `extensions` too, but Supabase keeps
-- it on the default search_path for `public` migrations.
create extension if not exists pgcrypto with schema extensions;

-- ─── helpers ───────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

-- ─── products (foods catalog + user-created) ───────────────────────────────

create table public.products (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,
  name            text not null,
  name_eng        text not null default '',
  description     text not null default '',
  description_eng text not null default '',
  source          text not null default '',
  price_per_kg    numeric not null default 0,
  nutrients       jsonb not null default '{}'::jsonb,
  portions        jsonb not null default '[]'::jsonb,
  categories      jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index products_user_id_idx   on public.products (user_id) where deleted_at is null;
create index products_updated_at_idx on public.products (updated_at);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ─── dishes ────────────────────────────────────────────────────────────────

create table public.dishes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index dishes_user_id_idx    on public.dishes (user_id) where deleted_at is null;
create index dishes_updated_at_idx on public.dishes (updated_at);

create trigger dishes_set_updated_at
  before update on public.dishes
  for each row execute function public.set_updated_at();

-- ─── dish_items (dish composition) ─────────────────────────────────────────

create table public.dish_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  dish_id     uuid not null references public.dishes(id) on delete cascade,
  product_id  uuid not null references public.products(id),
  quantity    numeric not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index dish_items_dish_id_idx    on public.dish_items (dish_id) where deleted_at is null;
create index dish_items_user_id_idx    on public.dish_items (user_id) where deleted_at is null;
create index dish_items_updated_at_idx on public.dish_items (updated_at);

create trigger dish_items_set_updated_at
  before update on public.dish_items
  for each row execute function public.set_updated_at();

-- ─── dish_portions ─────────────────────────────────────────────────────────

create table public.dish_portions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  dish_id     uuid not null references public.dishes(id) on delete cascade,
  label       text not null,
  amount      numeric not null,
  unit        text not null,
  grams       numeric not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index dish_portions_dish_id_idx    on public.dish_portions (dish_id) where deleted_at is null;
create index dish_portions_user_id_idx    on public.dish_portions (user_id) where deleted_at is null;
create index dish_portions_updated_at_idx on public.dish_portions (updated_at);

create trigger dish_portions_set_updated_at
  before update on public.dish_portions
  for each row execute function public.set_updated_at();

-- ─── schedule_foods (daily food log) ───────────────────────────────────────

create type schedule_food_type as enum ('food', 'dish');

create table public.schedule_foods (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  time        text not null,
  type        schedule_food_type not null,
  quantity    numeric not null,
  details     text not null default '',
  product_id  uuid references public.products(id),
  dish_id     uuid references public.dishes(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,

  constraint schedule_foods_ref_chk check (
    (type = 'food' and product_id is not null and dish_id is null) or
    (type = 'dish' and dish_id is not null and product_id is null)
  )
);

create index schedule_foods_user_date_idx  on public.schedule_foods (user_id, date) where deleted_at is null;
create index schedule_foods_updated_at_idx on public.schedule_foods (updated_at);

create trigger schedule_foods_set_updated_at
  before update on public.schedule_foods
  for each row execute function public.set_updated_at();

-- ─── schedule_events (calendar / daily events with atoms) ──────────────────

create table public.schedule_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  time        text not null,
  end_time    text not null default '',
  text        text not null default '',
  atoms       jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index schedule_events_user_date_idx  on public.schedule_events (user_id, date) where deleted_at is null;
create index schedule_events_updated_at_idx on public.schedule_events (updated_at);

create trigger schedule_events_set_updated_at
  before update on public.schedule_events
  for each row execute function public.set_updated_at();

-- ─── daily_norms ───────────────────────────────────────────────────────────

create table public.daily_norms (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text not null default '',
  items       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index daily_norms_user_id_idx    on public.daily_norms (user_id) where deleted_at is null;
create index daily_norms_updated_at_idx on public.daily_norms (updated_at);

create trigger daily_norms_set_updated_at
  before update on public.daily_norms
  for each row execute function public.set_updated_at();

-- ─── periods (styling / tagging ranges) ────────────────────────────────────

create table public.periods (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  color_index  int not null default 0,
  font_family  text not null default 'sans',
  font_size    int not null default 16,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index periods_user_id_idx    on public.periods (user_id) where deleted_at is null;
create index periods_updated_at_idx on public.periods (updated_at);

create trigger periods_set_updated_at
  before update on public.periods
  for each row execute function public.set_updated_at();

-- ─── Row Level Security ────────────────────────────────────────────────────
--
-- Every user-scoped table gets the same 4 policies (select/insert/update/delete)
-- gated by user_id = auth.uid(). `products` also allows read of system rows
-- (user_id IS NULL) so the shared catalog is visible to everyone, including
-- anonymous users.

alter table public.products        enable row level security;
alter table public.dishes          enable row level security;
alter table public.dish_items      enable row level security;
alter table public.dish_portions   enable row level security;
alter table public.schedule_foods  enable row level security;
alter table public.schedule_events enable row level security;
alter table public.daily_norms     enable row level security;
alter table public.periods         enable row level security;

-- products: owner CRUD + public read of system rows
create policy products_select on public.products
  for select using (user_id is null or user_id = auth.uid());
create policy products_insert on public.products
  for insert with check (user_id = auth.uid());
create policy products_update on public.products
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy products_delete on public.products
  for delete using (user_id = auth.uid());

-- dishes
create policy dishes_select on public.dishes
  for select using (user_id = auth.uid());
create policy dishes_insert on public.dishes
  for insert with check (user_id = auth.uid());
create policy dishes_update on public.dishes
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy dishes_delete on public.dishes
  for delete using (user_id = auth.uid());

-- dish_items
create policy dish_items_select on public.dish_items
  for select using (user_id = auth.uid());
create policy dish_items_insert on public.dish_items
  for insert with check (user_id = auth.uid());
create policy dish_items_update on public.dish_items
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy dish_items_delete on public.dish_items
  for delete using (user_id = auth.uid());

-- dish_portions
create policy dish_portions_select on public.dish_portions
  for select using (user_id = auth.uid());
create policy dish_portions_insert on public.dish_portions
  for insert with check (user_id = auth.uid());
create policy dish_portions_update on public.dish_portions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy dish_portions_delete on public.dish_portions
  for delete using (user_id = auth.uid());

-- schedule_foods
create policy schedule_foods_select on public.schedule_foods
  for select using (user_id = auth.uid());
create policy schedule_foods_insert on public.schedule_foods
  for insert with check (user_id = auth.uid());
create policy schedule_foods_update on public.schedule_foods
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy schedule_foods_delete on public.schedule_foods
  for delete using (user_id = auth.uid());

-- schedule_events
create policy schedule_events_select on public.schedule_events
  for select using (user_id = auth.uid());
create policy schedule_events_insert on public.schedule_events
  for insert with check (user_id = auth.uid());
create policy schedule_events_update on public.schedule_events
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy schedule_events_delete on public.schedule_events
  for delete using (user_id = auth.uid());

-- daily_norms
create policy daily_norms_select on public.daily_norms
  for select using (user_id = auth.uid());
create policy daily_norms_insert on public.daily_norms
  for insert with check (user_id = auth.uid());
create policy daily_norms_update on public.daily_norms
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy daily_norms_delete on public.daily_norms
  for delete using (user_id = auth.uid());

-- periods
create policy periods_select on public.periods
  for select using (user_id = auth.uid());
create policy periods_insert on public.periods
  for insert with check (user_id = auth.uid());
create policy periods_update on public.periods
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy periods_delete on public.periods
  for delete using (user_id = auth.uid());
