-- 2026-07-13 — auth diagnostics: one row per login-relevant auth attempt.
--
-- Why a table and not just the pino log: prod logs live in a container on someone
-- else's box behind a VPN, they rotate, and "почему у юзера не заходит" is a
-- question asked hours after the fact about ONE user. A queryable row keyed by
-- email/user_id answers it from the admin panel; stdout does not.
--
-- Written best-effort from the better-auth hooks (src/auth/auth-events.ts) —
-- a failed insert must NEVER break a login, so the writer swallows its own errors.
--
-- NO foreign key on user_id: the most valuable rows are the ones where sign-in
-- FAILED, i.e. where the user is unknown, mistyped, or already deleted. An FK
-- would reject exactly those inserts. Same reason `email` is stored raw: it is
-- the attempted identifier, not a reference.
--
-- Never stored: passwords, bearer tokens, id_tokens, OAuth codes. Only the
-- outcome and the error code.

begin;

create table public.auth_events (
  id            bigserial primary key,
  created_at    timestamptz not null default now(),
  -- better-auth endpoint template, e.g. '/sign-in/email', '/oauth2/callback/:providerId'
  path          text,
  -- 'email' | 'telegram' | null (unknown)
  provider      text,
  -- success = session issued / flow completed;
  -- failure = better-auth rejected it (bad password, unverified email, oauth error);
  -- error   = an exception escaped the endpoint (bug, DB down, Telegram unreachable)
  outcome       text not null check (outcome in ('success', 'failure', 'error')),
  status_code   int,
  error_code    text,
  error_message text,
  user_id       uuid,
  email         text,
  ip            text,
  user_agent    text
);

create index auth_events_created_idx on public.auth_events (created_at desc);
create index auth_events_user_idx on public.auth_events (user_id, created_at desc);
create index auth_events_email_idx on public.auth_events (lower(email), created_at desc);
-- The admin panel's default view is "show me what's broken" — failures only.
create index auth_events_problem_idx on public.auth_events (created_at desc)
  where outcome <> 'success';

commit;
