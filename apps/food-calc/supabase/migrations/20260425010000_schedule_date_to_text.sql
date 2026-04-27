-- Convert schedule_foods.date and schedule_events.date from `date` to `text`.
--
-- The client keys schedules by `dd-MM-yyyy` (DDMMYYYY) end-to-end. PowerSync's
-- local SQLite is text-only and stored that string fine, but the upstream
-- Postgres `date` column rejected it (22008 "date/time field value out of
-- range"). We don't run any server-side date queries (no range scans, no
-- date_trunc, no order-by-date) — the schedule tables are user-scoped and
-- read only via PowerSync replication. Switching the column to text removes
-- the conversion boundary.

alter table public.schedule_foods
  alter column date type text using to_char(date, 'DD-MM-YYYY');

alter table public.schedule_events
  alter column date type text using to_char(date, 'DD-MM-YYYY');

-- Partial indexes on a column whose type changes are rebuilt by Postgres,
-- but recreate them explicitly to avoid any surprises on prod.
drop index if exists public.schedule_foods_user_date_idx;
drop index if exists public.schedule_events_user_date_idx;

create index schedule_foods_user_date_idx
  on public.schedule_foods (user_id, date)
  where deleted_at is null;

create index schedule_events_user_date_idx
  on public.schedule_events (user_id, date)
  where deleted_at is null;
