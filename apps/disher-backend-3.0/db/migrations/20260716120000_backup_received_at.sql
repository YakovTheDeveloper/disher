-- 2026-07-16 — record WHEN a snapshot blob arrived.
--
-- The vault stores client-stamped rows (`updated_at`, the LWW key) and nothing
-- else: the server is a dumb shelf and never inspects the blob. That stays true
-- here — `received_at` is a fact about the SERVER ("I received this then"), not
-- about the user's data.
--
-- Why it earns a column: a device with a wrong wall clock stamps its rows with
-- that wrong time (a phone set to 2036 writes `updated_at: 2036`). Once the user
-- fixes their clock, the offset is gone — nothing anywhere records what it was,
-- so those rows can never be dated back. `received_at` keeps the offset
-- recoverable: a row claiming 2036 that arrived in 2026 is ~10 years fast, and a
-- one-off repair script can shift it whenever we need one.
--
-- This is deliberately NOT a fix for skewed clocks. It is the cheap thing that
-- keeps a fix POSSIBLE later, so we can decline to build one now (pre-launch,
-- zero users). Adding the column after the fact would not help: it only records
-- from the moment it exists.

begin;

alter table public.user_backups
  add column received_at timestamptz not null default now();

commit;
