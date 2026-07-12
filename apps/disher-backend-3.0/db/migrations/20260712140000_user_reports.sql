-- 2026-07-12 — user-facing bug reports / feedback (prod route).
--
-- Distinct from the dev-only disk sink at data/bug-reports/ (routes/bug-reports.ts,
-- registered only when NODE_ENV !== 'production'). This is the durable prod store
-- for the "Сообщить о проблеме" row in the settings drawer: text + collected
-- client metadata, one row per submission, tied to the authenticated user. No
-- screenshots / no disk writes — nothing to escape the box, so it is safe to
-- register in production (see routes/user-reports.ts).

begin;

create table public.user_reports (
  id          uuid primary key,
  user_id     uuid not null references public.users(id) on delete cascade,
  text        text not null,
  page        text,
  screen_size text,
  user_agent  text,
  pwa         text,
  created_at  timestamptz not null default now()
);

create index user_reports_created_idx on public.user_reports (created_at desc);

commit;
