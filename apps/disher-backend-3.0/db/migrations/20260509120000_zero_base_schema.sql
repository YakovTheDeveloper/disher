-- 2026-05-09 zero-base rewrite — see apps/food-calc/tds/ANALYSIS/zero-base-rewrite-2026-05-09.md
--
-- One writer per row. User data lives in Dexie and is dumped daily as a
-- single JSON blob into `user_backups`. Analyses are written ONLY by the
-- server LLM job and read by the client over HTTP (TanStack Query) — never
-- mirrored into Dexie. State for analyses is derived from `result_md` (empty
-- = pending, non-empty = done).
--
-- No per-row sync columns, no soft-delete, no idempotency keys, no status
-- enums. The act of deleting old per-table user-data tables is part of the
-- design — see plan §Migration. Pre-launch single user.

begin;

create table public.user_backups (
  user_id  uuid primary key references public.users(id) on delete cascade,
  snapshot jsonb not null
);

create table public.analyses (
  id           uuid primary key,
  user_id      uuid not null references public.users(id) on delete cascade,
  window_start timestamptz not null,
  window_end   timestamptz not null,
  result_md    text not null default '',
  idea_cards   jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now()
);

create index analyses_user_created_idx on public.analyses (user_id, created_at desc);

commit;
